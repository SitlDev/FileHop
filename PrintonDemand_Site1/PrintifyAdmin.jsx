import { useState } from "react";

const API = "http://localhost:3001/api";

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ["ORDERS", "PRODUCTS", "SHIPPING CALC", "WEBHOOKS", "SETUP"];

// ── Status colors ─────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  pending_payment: "#FFD700",
  submitted_to_printify: "#00FFFF",
  fulfilled: "#00FF41",
  cancelled: "#FF4500",
  payment_failed: "#FF0066",
};

// ── Mock data for preview ─────────────────────────────────────────────────────
const MOCK_ORDERS = [
  { orderId: "RT-A1B2C3D4", status: "submitted_to_printify", printifyOrderId: "pfy_001", email: "punk@nowhere.com", createdAt: "2024-11-10T14:22:00Z", cart: [{ shirtId: 1, size: "L", qty: 1, price: 34 }] },
  { orderId: "RT-X9Y8Z7W6", status: "fulfilled", printifyOrderId: "pfy_002", email: "rebel@zine.net", createdAt: "2024-11-09T09:01:00Z", printifyStatus: "fulfilled", cart: [{ shirtId: 5, size: "M", qty: 2, price: 34 }] },
  { orderId: "RT-Q5R4S3T2", status: "pending_payment", email: "anarchy@usa.org", createdAt: "2024-11-10T18:55:00Z", cart: [{ shirtId: 3, size: "XL", qty: 1, price: 34 }] },
];

const MOCK_PRODUCTS = [
  { id: "pfy_prod_1", title: "QUESTION EVERYTHING Tee", variants: 10, published: true },
  { id: "pfy_prod_2", title: "NO FUTURE Tee", variants: 10, published: true },
  { id: "pfy_prod_3", title: "BORN TO RAISE HELL Tee", variants: 10, published: false },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function PrintifyAdmin() {
  const [tab, setTab] = useState("ORDERS");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Shipping calc state
  const [shipCart, setShipCart] = useState('[{"product_id":"FILL","variant_id":123,"quantity":1}]');
  const [shipAddr, setShipAddr] = useState('{"first_name":"John","last_name":"Doe","email":"j@test.com","phone":"555-0100","country":"US","region":"FL","address1":"123 Punk Ave","city":"Miami","zip":"33101"}');
  const [shipResult, setShipResult] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const apiCall = async (method, path, body) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    } catch (e) {
      showToast(e.message, false);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const calcShipping = async () => {
    try {
      const result = await apiCall("POST", "/printify/shipping", {
        addressTo: JSON.parse(shipAddr),
        lineItems: JSON.parse(shipCart),
      });
      setShipResult(result);
      showToast("Shipping calculated");
    } catch (_) {}
  };

  const registerWebhooks = async () => {
    try {
      const result = await apiCall("POST", "/webhooks/register-printify");
      showToast(`Registered ${result.length} webhooks`);
    } catch (_) {}
  };

  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: "#080808", minHeight: "100vh", color: "#e0e0e0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .tt { font-family: 'Share Tech Mono', 'Courier New', monospace; }
        .bb { font-family: 'Bebas Neue', sans-serif; letter-spacing: 3px; }
        .tab { background: none; border: none; cursor: pointer; padding: 12px 20px; font-family: 'Bebas Neue', sans-serif; font-size: 15px; letter-spacing: 3px; color: #444; border-bottom: 2px solid transparent; transition: all 0.15s; }
        .tab:hover { color: #FF4500; }
        .tab.active { color: #FF4500; border-bottom-color: #FF4500; }
        .card { background: #111; border: 1px solid #1e1e1e; padding: 20px; }
        .btn { background: #FF4500; border: none; color: #000; padding: 8px 18px; cursor: pointer; font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 2px; transition: filter 0.15s; }
        .btn:hover { filter: brightness(1.2); }
        .btn-ghost { background: transparent; border: 1px solid #333; color: #888; padding: 6px 14px; cursor: pointer; font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 1px; transition: all 0.15s; }
        .btn-ghost:hover { border-color: #FF4500; color: #FF4500; }
        textarea, input { background: #0d0d0d; border: 1px solid #252525; color: #aaa; padding: 10px 12px; font-family: 'Share Tech Mono', monospace; font-size: 12px; width: 100%; outline: none; }
        textarea:focus, input:focus { border-color: #FF4500; }
        .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
        .row { display: flex; gap: 12px; align-items: flex-start; }
        .col { flex: 1; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #FF4500; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e1e1e", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div className="bb" style={{ fontSize: 20, color: "#FF4500" }}>
          REBELTHREADS <span style={{ color: "#333" }}>ADMIN</span>
          <span style={{ color: "#252525", fontSize: 12, marginLeft: 12 }}>× PRINTIFY INTEGRATION</span>
        </div>
        <div className="tt" style={{ fontSize: 11, color: "#333" }}>
          {loading ? <span style={{ color: "#FFD700" }}>● LOADING...</span> : <span style={{ color: "#1e1e1e" }}>● IDLE</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1e1e1e", padding: "0 32px", display: "flex" }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* ── ORDERS ── */}
        {tab === "ORDERS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="bb" style={{ fontSize: 22, color: "#FF4500" }}>ORDER QUEUE</span>
              <span className="tt" style={{ fontSize: 11, color: "#444" }}>Showing mock data — connect API to load live orders</span>
            </div>
            {MOCK_ORDERS.map((o) => (
              <div key={o.orderId} className="card" style={{ borderLeft: `2px solid ${STATUS_COLOR[o.status] || "#333"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="bb" style={{ fontSize: 18, color: "#f0f0f0", marginBottom: 4 }}>{o.orderId}</div>
                    <div className="tt" style={{ fontSize: 11, color: "#555" }}>{o.email} · {new Date(o.createdAt).toLocaleDateString()}</div>
                    {o.printifyOrderId && (
                      <div className="tt" style={{ fontSize: 11, color: "#333", marginTop: 4 }}>
                        Printify: {o.printifyOrderId}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                      <span className="status-dot" style={{ background: STATUS_COLOR[o.status] || "#333" }} />
                      <span className="tt" style={{ fontSize: 12, color: STATUS_COLOR[o.status] || "#666" }}>
                        {o.status.toUpperCase().replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="bb" style={{ fontSize: 20, color: "#f0f0f0", marginTop: 6 }}>
                      ${o.cart.reduce((s, i) => s + i.price * i.qty, 0)}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {o.cart.map((item, i) => (
                    <span key={i} className="tt" style={{ fontSize: 11, background: "#1a1a1a", padding: "4px 10px", color: "#888", border: "1px solid #222" }}>
                      Shirt #{item.shirtId} · {item.size} · ×{item.qty}
                    </span>
                  ))}
                </div>
                {o.status === "submitted_to_printify" && (
                  <div style={{ marginTop: 12 }}>
                    <button className="btn-ghost" onClick={() => showToast(`Cancel sent for ${o.orderId}`)}>
                      CANCEL ORDER
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === "PRODUCTS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="bb" style={{ fontSize: 22, color: "#FF4500" }}>PRINTIFY PRODUCTS</span>
              <button className="btn" onClick={() => showToast("Use Printify dashboard to create products, then fetch here")}>
                SYNC FROM PRINTIFY
              </button>
            </div>
            {MOCK_PRODUCTS.map((p) => (
              <div key={p.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div className="bb" style={{ fontSize: 16, color: "#f0f0f0" }}>{p.title}</div>
                  <div className="tt" style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
                    ID: {p.id} · {p.variants} variants
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="tt" style={{ fontSize: 11, color: p.published ? "#00FF41" : "#444" }}>
                    {p.published ? "● PUBLISHED" : "○ DRAFT"}
                  </span>
                  {!p.published && (
                    <button className="btn" style={{ fontSize: 13, padding: "6px 14px" }}
                      onClick={() => showToast(`Publishing ${p.id}...`)}>
                      PUBLISH
                    </button>
                  )}
                  <button className="btn-ghost" onClick={() => showToast(`Fetched variants for ${p.id}`)}>
                    VIEW VARIANTS
                  </button>
                </div>
              </div>
            ))}
            <div className="card" style={{ borderStyle: "dashed", borderColor: "#252525", textAlign: "center", padding: 40 }}>
              <div className="bb" style={{ color: "#333", fontSize: 18, marginBottom: 8 }}>CREATE NEW PRODUCT</div>
              <div className="tt" style={{ color: "#2a2a2a", fontSize: 12, marginBottom: 16 }}>
                POST /api/printify/products with blueprint_id, print_provider_id, and design image
              </div>
              <button className="btn" onClick={() => showToast("Open Printify dashboard to upload designs")}>
                + NEW PRODUCT
              </button>
            </div>
          </div>
        )}

        {/* ── SHIPPING CALC ── */}
        {tab === "SHIPPING CALC" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <span className="bb" style={{ fontSize: 22, color: "#FF4500" }}>SHIPPING CALCULATOR</span>
            <div className="row">
              <div className="col">
                <div className="tt" style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>LINE ITEMS (JSON)</div>
                <textarea
                  rows={6}
                  value={shipCart}
                  onChange={(e) => setShipCart(e.target.value)}
                />
              </div>
              <div className="col">
                <div className="tt" style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>SHIP-TO ADDRESS (JSON)</div>
                <textarea
                  rows={6}
                  value={shipAddr}
                  onChange={(e) => setShipAddr(e.target.value)}
                />
              </div>
            </div>
            <button className="btn" onClick={calcShipping} style={{ width: 220 }}>
              CALCULATE SHIPPING
            </button>
            {shipResult && (
              <div className="card">
                <div className="bb" style={{ color: "#FF4500", marginBottom: 12 }}>SHIPPING OPTIONS</div>
                <pre className="tt" style={{ fontSize: 11, color: "#888", whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(shipResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ── WEBHOOKS ── */}
        {tab === "WEBHOOKS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <span className="bb" style={{ fontSize: 22, color: "#FF4500" }}>WEBHOOK MANAGEMENT</span>
            <div className="card">
              <div className="bb" style={{ fontSize: 16, color: "#f0f0f0", marginBottom: 12 }}>PRINTIFY WEBHOOKS</div>
              {["order:fulfilled", "order:shipment:created", "order:shipment:delivered", "product:deleted"].map((topic) => (
                <div key={topic} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <div>
                    <span className="tt" style={{ fontSize: 13, color: "#888" }}>{topic}</span>
                    <div className="tt" style={{ fontSize: 11, color: "#333", marginTop: 2 }}>
                      → POST /webhooks/printify
                    </div>
                  </div>
                  <span className="tt" style={{ fontSize: 11, color: "#333" }}>NOT REGISTERED</span>
                </div>
              ))}
              <button className="btn" style={{ marginTop: 20 }} onClick={registerWebhooks}>
                REGISTER ALL WEBHOOKS
              </button>
            </div>
            <div className="card">
              <div className="bb" style={{ fontSize: 16, color: "#f0f0f0", marginBottom: 12 }}>STRIPE WEBHOOKS</div>
              {["payment_intent.succeeded", "payment_intent.payment_failed", "charge.dispute.created"].map((e) => (
                <div key={e} style={{ padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <span className="tt" style={{ fontSize: 12, color: "#555" }}>{e}</span>
                </div>
              ))}
              <div className="tt" style={{ fontSize: 11, color: "#333", marginTop: 12 }}>
                Register at dashboard.stripe.com → Developers → Webhooks<br />
                Endpoint: POST /webhooks/stripe
              </div>
            </div>
          </div>
        )}

        {/* ── SETUP ── */}
        {tab === "SETUP" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <span className="bb" style={{ fontSize: 22, color: "#FF4500" }}>SETUP GUIDE</span>

            {[
              {
                step: "01", title: "Install & Configure",
                lines: ["npm install", "cp .env.example .env", "# Fill in PRINTIFY_API_KEY, PRINTIFY_SHOP_ID, STRIPE_SECRET_KEY", "npm run dev"]
              },
              {
                step: "02", title: "Create Products in Printify",
                lines: ["# Upload design images:", "POST /api/printify/uploads  { fileName, url }", "", "# Create product (Blueprint 2 = Gildan 64000):", "POST /api/printify/products  { blueprint_id: 2, print_provider_id: 99, ... }", "", "# Get variant IDs per size:", "GET /api/printify/products/:id"]
              },
              {
                step: "03", title: "Map Variant IDs in catalog.js",
                lines: ["# Edit lib/catalog.js:", "# Set printifyProductId + variants { S: 17887, M: 17888, ... }", "# per shirt ID"]
              },
              {
                step: "04", title: "Register Webhooks",
                lines: ["# Set PUBLIC_URL in .env first, then:", "POST /webhooks/register-printify", "", "# Stripe: add endpoint in dashboard.stripe.com", "# stripe listen --forward-to localhost:3001/webhooks/stripe"]
              },
              {
                step: "05", title: "Frontend Checkout Flow",
                lines: ["# 1. Create intent:", "POST /api/orders/intent  { cart, email }", "", "# 2. Collect payment with Stripe.js (clientSecret)", "", "# 3. Confirm after payment:", "POST /api/orders/confirm  { orderId, paymentIntentId, shippingAddress }"]
              },
            ].map(({ step, title, lines }) => (
              <div key={step} className="card" style={{ borderLeft: "2px solid #FF4500" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div className="bb" style={{ fontSize: 32, color: "#FF4500", lineHeight: 1, minWidth: 40 }}>{step}</div>
                  <div style={{ flex: 1 }}>
                    <div className="bb" style={{ fontSize: 18, color: "#f0f0f0", marginBottom: 10 }}>{title}</div>
                    <pre className="tt" style={{ fontSize: 12, color: "#666", lineHeight: 1.8, background: "#0d0d0d", padding: 14, border: "1px solid #1a1a1a" }}>
                      {lines.join("\n")}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 32, right: 32,
          background: toast.ok ? "#0d2b0d" : "#2b0d0d",
          border: `1px solid ${toast.ok ? "#00FF41" : "#FF4500"}`,
          color: toast.ok ? "#00FF41" : "#FF4500",
          padding: "12px 20px",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 13,
          letterSpacing: 1,
          zIndex: 9999,
          maxWidth: 360,
        }}>
          {toast.ok ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}
    </div>
  );
}
