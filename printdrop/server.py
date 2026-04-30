"""
PrintDrop — White-Label Backend API Server
==========================================
White-labeled fulfillment engine with a 24-hour cancellation buffer.
Orders are queued and held for 24 hours before being dispatched to the
print provider — giving customers time to cancel without penalty.

Endpoints (customer-facing):
  GET  /                        → Serves index.html (storefront)
  POST /api/order               → Places an order into the 24-hr buffer queue
  POST /api/order/<id>/cancel   → Customer self-cancel (within buffer window)
  GET  /api/order/<id>/status   → Get order status + tracking
  POST /api/generate-text       → AI-written shirt slogans
  POST /api/generate-image      → Stub: placeholder image URL
  GET  /api/health              → Health check

Endpoints (admin — protected by ADMIN_TOKEN):
  GET  /admin                   → Serves admin.html
  GET  /api/admin/orders        → List all orders (filterable by status)
  POST /api/admin/orders/<id>/approve  → Skip 24-hr wait, fulfill now
  POST /api/admin/orders/<id>/cancel   → Cancel any order
  POST /api/admin/orders/<id>/refund   → Mark as refunded
  GET  /api/admin/stats         → Dashboard stats
  POST /api/admin/branding      → Update white-label branding config

White-Label Config (see BRANDING below):
  - Set your store name, logo URL, and support email
  - Orders go out under your brand, not PrintDrop

Usage:
  pip install flask apscheduler
  python3 server.py
  → Storefront:  http://localhost:5000
  → Admin:       http://localhost:5000/admin
  → Admin Token: set ADMIN_TOKEN env var (default: "admin-secret-change-me")
"""

import os
import json
import uuid
import time
import hashlib
import threading
from datetime import datetime, timezone
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory

# ── Try to import optional POD modules ────────────────────────
try:
    from generator import generate_tshirt_design
    HAS_GENERATOR = True
except ImportError:
    HAS_GENERATOR = False

try:
    from pod_service import fulfill_one_click, smart_route as _pod_smart_route
    HAS_POD = True
except ImportError:
    HAS_POD = False

try:
    import catalog_manager
    HAS_CATALOG_MANAGER = True
except ImportError:
    HAS_CATALOG_MANAGER = False

# ══════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════

ADMIN_TOKEN   = os.environ.get("ADMIN_TOKEN", "admin-secret-change-me")
BUFFER_HOURS  = int(os.environ.get("BUFFER_HOURS", "24"))   # cancellation window
ORDERS_FILE   = os.environ.get("ORDERS_FILE", "orders.json")  # persistent store
BRANDING_FILE = os.environ.get("BRANDING_FILE", "branding.json")

# ── White-label branding defaults ─────────────────────────────
DEFAULT_BRANDING = {
    "store_name":    "PrintDrop",
    "tagline":       "Custom Apparel, Shipped Worldwide",
    "logo_url":      "",
    "support_email": "support@printdrop.com",
    "accent_color":  "#e85d04",
    "from_email":    "orders@printdrop.com",
    "footer_text":   "© 2025 PrintDrop",
}

# ══════════════════════════════════════════════════════════════
# FLASK APP
# ══════════════════════════════════════════════════════════════
app = Flask(__name__, static_folder=".", static_url_path="")

def cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Admin-Token"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, DELETE"
    return response

app.after_request(cors)

# ══════════════════════════════════════════════════════════════
# PERSISTENT ORDER STORE (JSON file — swap for a real DB)
# ══════════════════════════════════════════════════════════════
_store_lock = threading.Lock()

def _load_orders() -> dict:
    if not os.path.exists(ORDERS_FILE):
        return {}
    with open(ORDERS_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def _save_orders(orders: dict):
    with open(ORDERS_FILE, "w") as f:
        json.dump(orders, f, indent=2, default=str)

def get_all_orders() -> list:
    with _store_lock:
        orders = _load_orders()
    return sorted(orders.values(), key=lambda o: o.get("created_at", 0), reverse=True)

def get_order(order_id: str) -> dict | None:
    with _store_lock:
        orders = _load_orders()
    return orders.get(order_id)

def save_order(order: dict):
    with _store_lock:
        orders = _load_orders()
        orders[order["id"]] = order
        _save_orders(orders)

def update_order(order_id: str, **fields):
    with _store_lock:
        orders = _load_orders()
        if order_id not in orders:
            return None
        orders[order_id].update(fields)
        orders[order_id]["updated_at"] = _now_iso()
        _save_orders(orders)
        return orders[order_id]

def _now_ts()  -> float: return time.time()
def _now_iso() -> str:   return datetime.now(timezone.utc).isoformat()

# ══════════════════════════════════════════════════════════════
# BRANDING CONFIG
# ══════════════════════════════════════════════════════════════
def get_branding() -> dict:
    if not os.path.exists(BRANDING_FILE):
        return DEFAULT_BRANDING.copy()
    with open(BRANDING_FILE, "r") as f:
        try:
            data = json.load(f)
            return {**DEFAULT_BRANDING, **data}
        except json.JSONDecodeError:
            return DEFAULT_BRANDING.copy()

def save_branding(data: dict):
    with open(BRANDING_FILE, "w") as f:
        json.dump({**DEFAULT_BRANDING, **data}, f, indent=2)

# ══════════════════════════════════════════════════════════════
# ADMIN AUTH
# ══════════════════════════════════════════════════════════════
def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return jsonify({}), 200
        token = (
            request.headers.get("X-Admin-Token") or
            request.args.get("token") or
            ""
        )
        if token != ADMIN_TOKEN:
            return jsonify({"error": "Unauthorized. Provide X-Admin-Token header."}), 401
        return f(*args, **kwargs)
    return decorated

# ══════════════════════════════════════════════════════════════
# SMART ROUTING (fallback if pod_service not available)
# ══════════════════════════════════════════════════════════════
GELATO_COUNTRIES = {
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE",
    "IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
    "GB","NO","CH","AU","NZ","CA",
}
PRINTFUL_COUNTRIES = {"US","MX"}

def smart_route(country_code: str) -> tuple[str, str]:
    if HAS_POD:
        return _pod_smart_route(country_code)
    c = (country_code or "US").upper().strip()
    if c in PRINTFUL_COUNTRIES:
        return ("printful", f"Printful warehouses in {c} — fastest domestic.")
    if c in GELATO_COUNTRIES:
        return ("gelato",   f"Gelato local partners in {c} — lowest shipping.")
    return ("printify",     f"Printify global network — widest coverage for {c}.")

# ══════════════════════════════════════════════════════════════
# ORDER STATUS MACHINE
# ══════════════════════════════════════════════════════════════
# Status flow:
#   queued → (24h passes or admin approves) → fulfilling → sent → shipped → delivered
#   queued → (customer or admin cancels)    → cancelled
#   fulfilling → (pod error)               → failed
#   any → (admin refunds)                  → refunded

STATUS_LABELS = {
    "queued":     "Queued — Awaiting Fulfillment",
    "approved":   "Approved — Fulfilling Now",
    "fulfilling": "Fulfilling",
    "sent":       "Sent to Provider",
    "shipped":    "Shipped",
    "delivered":  "Delivered",
    "cancelled":  "Cancelled",
    "failed":     "Failed",
    "refunded":   "Refunded",
}

def buffer_seconds() -> float:
    return BUFFER_HOURS * 3600

def is_within_buffer(order: dict) -> bool:
    age = _now_ts() - order.get("created_at", 0)
    return age < buffer_seconds()

def seconds_until_fulfillment(order: dict) -> float:
    age = _now_ts() - order.get("created_at", 0)
    return max(0.0, buffer_seconds() - age)

# ══════════════════════════════════════════════════════════════
# BACKGROUND FULFILLMENT WORKER
# Checks every 5 minutes for queued orders past their buffer window
# ══════════════════════════════════════════════════════════════
def _fulfillment_worker():
    """Runs in a background thread. Dispatches orders past their buffer."""
    print("[Worker] Fulfillment worker started")
    while True:
        try:
            _process_ready_orders()
        except Exception as e:
            print(f"[Worker] Error: {e}")
        time.sleep(300)  # check every 5 minutes

def _process_ready_orders():
    orders = get_all_orders()
    for order in orders:
        if order.get("status") not in ("queued", "approved"):
            continue
        # Skip if still within buffer (unless already approved)
        if order.get("status") == "queued" and is_within_buffer(order):
            continue
        print(f"[Worker] Dispatching order {order['id']} to {order.get('provider','auto')}")
        _dispatch_to_pod(order)

def _dispatch_to_pod(order: dict):
    """Actually sends the order to the POD provider."""
    order_id = order["id"]
    update_order(order_id, status="fulfilling")

    if not HAS_POD:
        # Demo mode: simulate success
        time.sleep(1)
        update_order(
            order_id,
            status="sent",
            dispatched_at=_now_iso(),
            pod_order_id="DEMO-" + order_id[:6].upper(),
            tracking_number=None,
        )
        print(f"[Worker][Demo] Order {order_id} marked as sent (no pod_service)")
        return

    # Real dispatch via pod_service
    design_path = order.get("design_path") or "outputs/design_001.png"
    recipient   = order.get("recipient", {})
    override    = order.get("provider") if order.get("provider") not in ("auto", None) else None

    result = fulfill_one_click(
        image_path=design_path,
        recipient_info=recipient,
        provider_override=override,
    )

    if result and "error" not in result:
        update_order(
            order_id,
            status="sent",
            dispatched_at=_now_iso(),
            pod_order_id=result.get("id") or result.get("order_id"),
            pod_response=result,
        )
        print(f"[Worker] Order {order_id} dispatched → {order.get('provider')}")
    else:
        err = result.get("error", "Unknown POD error") if result else "POD call failed"
        update_order(order_id, status="failed", error=err)
        print(f"[Worker] Order {order_id} FAILED: {err}")

# Start background worker thread
_worker_thread = threading.Thread(target=_fulfillment_worker, daemon=True)
_worker_thread.start()

# ══════════════════════════════════════════════════════════════
# STATIC ROUTES
# ══════════════════════════════════════════════════════════════
@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/admin")
def admin_dashboard():
    # Serve admin.html — protected client-side by token prompt
    return send_from_directory(".", "admin.html")

@app.route("/<path:filename>")
def static_files(filename):
    if os.path.exists(filename):
        return send_from_directory(".", filename)
    return "Not found", 404

# ══════════════════════════════════════════════════════════════
# HEALTH
# ══════════════════════════════════════════════════════════════
@app.route("/api/health", methods=["GET"])
def health():
    branding = get_branding()
    orders   = get_all_orders()
    queued   = sum(1 for o in orders if o.get("status") == "queued")
    return jsonify({
        "status":        "ok",
        "store":         branding["store_name"],
        "buffer_hours":  BUFFER_HOURS,
        "orders_total":  len(orders),
        "orders_queued": queued,
        "pod_available": HAS_POD,
        "generator_available": HAS_GENERATOR,
        "catalog_available": HAS_CATALOG_MANAGER,
    })

# ══════════════════════════════════════════════════════════════
# LIVE CATALOG
# ══════════════════════════════════════════════════════════════
@app.route("/api/catalog", methods=["GET"])
def api_get_catalog():
    if not HAS_CATALOG_MANAGER:
        return jsonify({"error": "Catalog manager not available"}), 503
    return jsonify(catalog_manager.get_unified_catalog())

@app.route("/api/catalog/<provider>/<product_id>", methods=["GET"])
def api_get_product(provider, product_id):
    if not HAS_CATALOG_MANAGER:
        return jsonify({"error": "Catalog manager not available"}), 503
    details = catalog_manager.get_provider_product(provider, product_id)
    return jsonify(details)

# ══════════════════════════════════════════════════════════════
# AI TEXT GENERATION
# ══════════════════════════════════════════════════════════════
SLOGAN_BANK = {
    "gym":      ["No Days Off", "Built Different", "Earn It Every Day", "Pain Is Progress", "Beast Mode Activated"],
    "motivat":  ["Rise & Grind", "Dream It. Build It.", "Relentless", "Be The Storm", "Make It Happen"],
    "faith":    ["Faith Over Fear", "God's Got This", "Walk By Faith", "Blessed & Grateful", "He Is Risen"],
    "funny":    ["Powered By Coffee", "Adulting Is Hard", "Sarcasm Loading…", "404 Sleep Not Found", "NPC Mode: On"],
    "teen":     ["Understood The Assignment", "No Cap FR FR", "Delulu Is The Solulu", "Vibe Check ✓", "We Ball"],
    "culture":  ["Chronically Online", "Protect Your Peace", "Soft Life Only", "Quiet Quitting Pro", "Unbothered"],
    "love":     ["Love Wins", "Choose Love Daily", "Kind Is Cool", "You Matter", "Collect Moments"],
    "puns":     ["I Am Nacho Average", "Kale Yeah!", "Shell Yeah!", "I Donut Care", "Feeling Grape"],
    "default":  ["Stay True", "Original Since Day One", "No Limits", "Own Your Story", "Just Start"],
}

def get_bank_key(prompt: str) -> str:
    p = prompt.lower()
    for key, words in [
        ("gym",     ["gym","fitness","workout","muscle","lift","gains"]),
        ("motivat", ["motiv","inspir","grind","hustle","ambition"]),
        ("faith",   ["faith","god","church","prayer","jesus","blessed"]),
        ("funny",   ["funny","humor","joke","coffee","sarcasm"]),
        ("teen",    ["teen","genz","vibe","slay","rizz","cap"]),
        ("culture", ["culture","online","soft","peace","boundary"]),
        ("love",    ["love","kind","heart","care","romance"]),
        ("puns",    ["pun","nacho","kale","donut","grape","shell"]),
    ]:
        if any(w in p for w in words):
            return key
    return "default"

@app.route("/api/generate-text", methods=["POST", "OPTIONS"])
def generate_text():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    data   = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "").strip()
    if not prompt:
        return jsonify({"error": "prompt is required"}), 400
    key     = get_bank_key(prompt)
    slogans = SLOGAN_BANK.get(key, SLOGAN_BANK["default"])
    return jsonify({"slogans": slogans, "theme": key})

# ══════════════════════════════════════════════════════════════
# AI IMAGE GENERATION (stub)
# ══════════════════════════════════════════════════════════════
@app.route("/api/generate-image", methods=["POST", "OPTIONS"])
def generate_image():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    data   = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "abstract art")
    seed   = abs(hash(prompt)) % 10000
    return jsonify({"imageUrl": f"https://picsum.photos/seed/{seed}/500/500", "prompt": prompt})

# ══════════════════════════════════════════════════════════════
# CUSTOMER: PLACE ORDER (enters 24-hr buffer queue)
# ══════════════════════════════════════════════════════════════
@app.route("/api/order", methods=["POST", "OPTIONS"])
def place_order():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    recipient = data.get("recipient", {})
    required  = ["name", "address1", "city", "country_code", "zip"]
    missing   = [f for f in required if not recipient.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # Generate design file (if generator available)
    design_text = data.get("designText", "").strip()
    design_path = None
    if design_text and HAS_GENERATOR:
        order_id_tmp = str(uuid.uuid4())[:8]
        output_dir   = "outputs/orders"
        os.makedirs(output_dir, exist_ok=True)
        design_path = f"{output_dir}/order_{order_id_tmp}.png"
        try:
            generate_tshirt_design(
                text=design_text,
                output_path=design_path,
                font_path="/System/Library/Fonts/Supplemental/Arial Bold.ttf",
                font_size=400,
            )
        except Exception:
            design_path = None

    # Determine provider
    country       = recipient.get("country_code", "US")
    provider_pref = data.get("provider", "auto")
    if provider_pref == "auto":
        provider, routing_reason = smart_route(country)
    else:
        provider       = provider_pref
        routing_reason = f"Manual override: {provider}"

    # Build order record
    order_id = "PD-" + uuid.uuid4().hex[:8].upper()
    branding = get_branding()

    order = {
        "id":               order_id,
        "status":           "queued",
        "created_at":       _now_ts(),
        "created_at_iso":   _now_iso(),
        "updated_at":       _now_iso(),
        "fulfills_at_iso":  datetime.fromtimestamp(
            _now_ts() + buffer_seconds(), tz=timezone.utc
        ).isoformat(),
        "design_text":      design_text,
        "design_path":      design_path,
        "product":          data.get("product", "tee"),
        "color":            data.get("color", "White"),
        "size":             data.get("size", "M"),
        "quantity":         int(data.get("quantity", 1)),
        "provider":         provider,
        "routing_reason":   routing_reason,
        "recipient":        recipient,
        "store":            branding["store_name"],
        "customer_name":    recipient.get("name"),
        "customer_email":   recipient.get("email"),
        "customer_city":    recipient.get("city"),
        "customer_country": country,
        "total_usd":        data.get("totalUsd"),
        "notes":            data.get("notes", ""),
        "dispatched_at":    None,
        "pod_order_id":     None,
        "tracking_number":  None,
        "cancelled_at":     None,
        "cancel_reason":    None,
        "approved_by":      None,
        "refunded_at":      None,
    }

    save_order(order)
    print(f"[Order] {order_id} queued → {provider.upper()} | {country} | fulfills in {BUFFER_HOURS}h")

    return jsonify({
        "success":         True,
        "order_id":        order_id,
        "status":          "queued",
        "provider":        provider,
        "buffer_hours":    BUFFER_HOURS,
        "fulfills_at":     order["fulfills_at_iso"],
        "routing_reason":  routing_reason,
        "message":         f"Order queued! You have {BUFFER_HOURS} hours to cancel if needed.",
        "cancel_url":      f"/api/order/{order_id}/cancel",
    })

# ══════════════════════════════════════════════════════════════
# CUSTOMER: CHECK ORDER STATUS
# ══════════════════════════════════════════════════════════════
@app.route("/api/order/<order_id>/status", methods=["GET", "OPTIONS"])
def order_status(order_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    order = get_order(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    within_buffer = is_within_buffer(order) and order.get("status") == "queued"
    secs_left     = seconds_until_fulfillment(order) if within_buffer else 0

    return jsonify({
        "order_id":        order_id,
        "status":          order.get("status"),
        "status_label":    STATUS_LABELS.get(order.get("status"), order.get("status")),
        "can_cancel":      within_buffer,
        "seconds_until_fulfillment": secs_left,
        "fulfills_at":     order.get("fulfills_at_iso"),
        "tracking_number": order.get("tracking_number"),
        "provider":        order.get("provider"),
        "dispatched_at":   order.get("dispatched_at"),
    })

# ══════════════════════════════════════════════════════════════
# CUSTOMER: CANCEL (within buffer window)
# ══════════════════════════════════════════════════════════════
@app.route("/api/order/<order_id>/cancel", methods=["POST", "OPTIONS"])
def customer_cancel(order_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    order = get_order(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.get("status") not in ("queued",):
        return jsonify({"error": f"Cannot cancel an order with status '{order.get('status')}'."}), 400
    if not is_within_buffer(order):
        return jsonify({"error": "Cancellation window has closed (24 hours has passed)."}), 400

    data   = request.get_json(silent=True) or {}
    reason = data.get("reason", "Customer requested cancellation")
    update_order(order_id, status="cancelled", cancel_reason=reason, cancelled_at=_now_iso())
    print(f"[Order] {order_id} CANCELLED by customer: {reason}")
    return jsonify({"success": True, "order_id": order_id, "status": "cancelled"})

# ══════════════════════════════════════════════════════════════
# ADMIN: LIST ORDERS
# ══════════════════════════════════════════════════════════════
@app.route("/api/admin/orders", methods=["GET", "OPTIONS"])
@require_admin
def admin_list_orders():
    status_filter = request.args.get("status")       # e.g. "queued"
    search        = request.args.get("q", "").lower() # name/email search
    limit         = int(request.args.get("limit", 200))

    orders = get_all_orders()

    if status_filter and status_filter != "all":
        orders = [o for o in orders if o.get("status") == status_filter]

    if search:
        orders = [o for o in orders if
            search in (o.get("customer_name") or "").lower() or
            search in (o.get("customer_email") or "").lower() or
            search in (o.get("id") or "").lower() or
            search in (o.get("design_text") or "").lower()
        ]

    # Enrich with computed fields
    enriched = []
    for o in orders[:limit]:
        within = is_within_buffer(o) and o.get("status") == "queued"
        enriched.append({
            **o,
            "status_label":        STATUS_LABELS.get(o.get("status"), o.get("status")),
            "can_customer_cancel": within,
            "seconds_remaining":   seconds_until_fulfillment(o) if within else 0,
            "within_buffer":       within,
        })

    return jsonify({
        "orders":  enriched,
        "total":   len(enriched),
        "filter":  status_filter or "all",
    })

# ══════════════════════════════════════════════════════════════
# ADMIN: GET SINGLE ORDER
# ══════════════════════════════════════════════════════════════
@app.route("/api/admin/orders/<order_id>", methods=["GET", "OPTIONS"])
@require_admin
def admin_get_order(order_id):
    order = get_order(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    within = is_within_buffer(order) and order.get("status") == "queued"
    return jsonify({
        **order,
        "status_label":    STATUS_LABELS.get(order.get("status"), order.get("status")),
        "within_buffer":   within,
        "seconds_remaining": seconds_until_fulfillment(order) if within else 0,
    })

# ══════════════════════════════════════════════════════════════
# ADMIN: APPROVE NOW (skip 24-hr buffer)
# ══════════════════════════════════════════════════════════════
@app.route("/api/admin/orders/<order_id>/approve", methods=["POST", "OPTIONS"])
@require_admin
def admin_approve(order_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    order = get_order(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.get("status") not in ("queued",):
        return jsonify({"error": f"Order status is '{order.get('status')}', cannot approve."}), 400

    data  = request.get_json(silent=True) or {}
    admin = data.get("admin_note", "Admin approved")

    update_order(order_id, status="approved", approved_by=admin, approved_at=_now_iso())
    print(f"[Admin] Order {order_id} APPROVED by admin — dispatching immediately")

    # Dispatch in background thread so the response returns fast
    order = get_order(order_id)
    threading.Thread(target=_dispatch_to_pod, args=(order,), daemon=True).start()

    return jsonify({
        "success":  True,
        "order_id": order_id,
        "status":   "approved",
        "message":  "Order approved and being dispatched to print provider now.",
    })

# ══════════════════════════════════════════════════════════════
# ADMIN: CANCEL ORDER
# ══════════════════════════════════════════════════════════════
@app.route("/api/admin/orders/<order_id>/cancel", methods=["POST", "OPTIONS"])
@require_admin
def admin_cancel(order_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    order = get_order(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.get("status") in ("delivered", "refunded", "cancelled"):
        return jsonify({"error": f"Cannot cancel order with status '{order.get('status')}'."}), 400

    data   = request.get_json(silent=True) or {}
    reason = data.get("reason", "Cancelled by admin")
    update_order(order_id, status="cancelled", cancel_reason=reason, cancelled_at=_now_iso())
    print(f"[Admin] Order {order_id} CANCELLED: {reason}")
    return jsonify({"success": True, "order_id": order_id, "status": "cancelled"})

# ══════════════════════════════════════════════════════════════
# ADMIN: REFUND ORDER
# ══════════════════════════════════════════════════════════════
@app.route("/api/admin/orders/<order_id>/refund", methods=["POST", "OPTIONS"])
@require_admin
def admin_refund(order_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    order = get_order(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    data   = request.get_json(silent=True) or {}
    reason = data.get("reason", "Refund issued by admin")
    update_order(order_id, status="refunded", refund_reason=reason, refunded_at=_now_iso())
    print(f"[Admin] Order {order_id} REFUNDED: {reason}")
    return jsonify({"success": True, "order_id": order_id, "status": "refunded"})

# ══════════════════════════════════════════════════════════════
# ADMIN: UPDATE TRACKING
# ══════════════════════════════════════════════════════════════
@app.route("/api/admin/orders/<order_id>/tracking", methods=["POST", "OPTIONS"])
@require_admin
def admin_update_tracking(order_id):
    if request.method == "OPTIONS":
        return jsonify({}), 200
    order = get_order(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    data = request.get_json(silent=True) or {}
    tracking = data.get("tracking_number", "").strip()
    carrier  = data.get("carrier", "").strip()
    updated  = update_order(order_id, tracking_number=tracking, carrier=carrier, status="shipped")
    return jsonify({"success": True, "order_id": order_id, "tracking_number": tracking})

# ══════════════════════════════════════════════════════════════
# ADMIN: DASHBOARD STATS
# ══════════════════════════════════════════════════════════════
@app.route("/api/admin/stats", methods=["GET", "OPTIONS"])
@require_admin
def admin_stats():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    orders = get_all_orders()
    total  = len(orders)
    by_status = {}
    for o in orders:
        s = o.get("status", "unknown")
        by_status[s] = by_status.get(s, 0) + 1

    # Revenue (from total_usd field)
    revenue = sum(
        float(o.get("total_usd") or 0)
        for o in orders
        if o.get("status") not in ("cancelled", "refunded")
    )

    # Orders ready to dispatch (past buffer, still queued)
    ready_to_dispatch = sum(
        1 for o in orders
        if o.get("status") == "queued" and not is_within_buffer(o)
    )

    # Today's orders
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).timestamp()
    today_orders = sum(1 for o in orders if o.get("created_at", 0) >= today_start)

    # By provider
    by_provider = {}
    for o in orders:
        p = o.get("provider", "unknown")
        by_provider[p] = by_provider.get(p, 0) + 1

    return jsonify({
        "total":              total,
        "today":              today_orders,
        "by_status":          by_status,
        "by_provider":        by_provider,
        "revenue_usd":        round(revenue, 2),
        "ready_to_dispatch":  ready_to_dispatch,
        "buffer_hours":       BUFFER_HOURS,
    })

# ══════════════════════════════════════════════════════════════
# ADMIN: BRANDING CONFIG
# ══════════════════════════════════════════════════════════════
@app.route("/api/admin/branding", methods=["GET", "POST", "OPTIONS"])
@require_admin
def admin_branding():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    if request.method == "GET":
        return jsonify(get_branding())
    data = request.get_json(silent=True) or {}
    save_branding(data)
    return jsonify({"success": True, "branding": get_branding()})

# ══════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    branding = get_branding()
    print("\n" + "="*60)
    print(f"  {branding['store_name']} — White-Label Print-on-Demand")
    print(f"  Storefront: http://localhost:5000")
    print(f"  Admin:      http://localhost:5000/admin")
    print(f"  Buffer:     {BUFFER_HOURS}h cancellation window")
    print(f"  POD Ready:  {HAS_POD}")
    print("="*60 + "\n")
    app.run(host="127.0.0.1", port=5005, debug=False, use_reloader=False)

# ══════════════════════════════════════════════════════════════
# PRODUCTION INFRASTRUCTURE STUBS
# ══════════════════════════════════════════════════════════════

def send_confirmation_email(order):
    """
    TODO: Integrate with SendGrid, Mailgun, or SMTP.
    Send white-labeled order confirmation to order['customer_email'].
    """
    print(f"[EMAIL] Sending confirmation to {order['customer_email']}")
    pass

@app.route("/api/webhooks/pod", methods=["POST"])
def pod_webhook():
    """
    Handle live tracking/status updates from Printful, Printify, or Gelato.
    Requires setting the Webhook URL in your POD provider's dashboard.
    """
    data = request.json
    # 1. Verify provider signature (security)
    # 2. Update order status/tracking in orders.json
    print(f"[WEBHOOK] Received update: {data}")
    return jsonify({"status": "received"}), 200

@app.route("/api/create-payment-intent", methods=["POST"])
def create_payment():
    """
    TODO: Integrate with Stripe.
    https://stripe.com/docs/payments/accept-a-payment
    """
    return jsonify({"clientSecret": "pi_stub_secret_123"}), 200
