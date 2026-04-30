/* ═══════════════════════════════════════════════════════
   PRINTDROP app.js
   • 160+ designs (puns, dad jokes, teen culture, social)
   • User profile system (localStorage)
   • Order history + 1-click reorder
   • Order tracking modal with status timeline
═══════════════════════════════════════════════════════ */

// ══ APP STATE ══
const state = {
  product:'tee', color:'White', colorHex:'#ffffff',
  size:'M', qty:1, basePrice:29.99,
  tier:'essential',
  textFont:"'Anton',sans-serif", textColor:'#000000',
  bold:false, italic:false,
  elements:[], history:[],
  selectedDesign:null, checkoutOpen:false,
  reorderingOrder:null,
};
const TIER_PRICES = { essential: 0, retail: 4.50, heavyweight: 9.00 };
const PRICES = {
  tee:29.99, hoodie:54.99, longsleeve:39.99, croptee:32.99, tanktop:26.99,
  raglan:36.99, polo:44.99, youth_tee:22.99, onesie:19.99, sweatpants:49.99,
  compression:42.99, snapback:34.99, dadhut:29.99, beanie:27.99, bucket_hat:32.99,
  trucker_hat:31.99, tote_bag:24.99, drawstring:28.99, fanny_pack:34.99, backpack:59.99,
  mug:19.99, travel_mug:34.99, water_bottle:29.99, pillow:29.99, blanket:49.99,
  poster:18.99, canvas_print:44.99, phone_case:22.99, laptop_sleeve:34.99,
  mousepad:16.99, airpods_case:19.99, socks:17.99, face_mask:14.99, apron:27.99,
  sticker_sheet:9.99, greeting_card:5.99, notebook:19.99,
  pet_bandana:16.99, wrapping_paper:14.99,
  bundle_starter:74.99, bundle_lifestyle:89.99, bundle_desk:69.99,
};
const GELATO  = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','GB','NO','CH','AU','NZ','CA']);
const PRINTFUL = new Set(['US','MX']);

// ══ USER PROFILE (localStorage) ══
const DB = {
  getUser:    ()=>JSON.parse(localStorage.getItem('pd_user')||'null'),
  setUser:    u=>localStorage.setItem('pd_user', JSON.stringify(u)),
  getOrders:  ()=>JSON.parse(localStorage.getItem('pd_orders')||'[]'),
  setOrders:  o=>localStorage.setItem('pd_orders', JSON.stringify(o)),
  getSaved:   ()=>JSON.parse(localStorage.getItem('pd_saved')||'[]'),
  setSaved:   s=>localStorage.setItem('pd_saved', JSON.stringify(s)),
  addOrder(order) {
    const orders = this.getOrders();
    orders.unshift(order);
    if(orders.length > 50) orders.pop();
    this.setOrders(orders);
  },
  saveDesign(design) {
    const saved = this.getSaved();
    if(!saved.find(s=>s.id===design.id)) {
      saved.unshift(design);
      this.setSaved(saved);
    }
  },
};

// ══ ORDER STATUS PROGRESSION ══
// Simulates real provider status for demo purposes
const STATUS_STEPS = [
  { key:'pending',    label:'Order Received',    icon:'📋', desc:'Your order has been received and is awaiting processing.' },
  { key:'processing', label:'Processing',         icon:'⚙️',  desc:'Payment confirmed. Order sent to print provider.' },
  { key:'printing',   label:'Printing',           icon:'🖨️',  desc:'Your item is being printed and quality-checked.' },
  { key:'shipped',    label:'Shipped',            icon:'📦',  desc:'Handed to carrier. Tracking number assigned.' },
  { key:'delivered',  label:'Delivered',          icon:'🏠',  desc:'Package delivered to your address.' },
];
function getStatusIndex(key) { return STATUS_STEPS.findIndex(s=>s.key===key); }
function advanceStatus(order) {
  // Simulate progression based on time elapsed since order
  const elapsed = Date.now() - order.placedAt;
  const hours = elapsed / 3600000;
  if(hours < 1)   return 'pending';
  if(hours < 24)  return 'processing';
  if(hours < 72)  return 'printing';
  if(hours < 168) return 'shipped';
  return 'delivered';
}

// ══════════════════════════════════════
// 160+ DESIGNS
// ══════════════════════════════════════
// ══════════════════════════════════════
// GALLERY RENDER
// ══════════════════════════════════════





function orderDesign(id) {
  const d = DESIGNS.find(x=>x.id===id); if(!d) return;
  loadDesignToCanvas(d);
  scrollTo_('studio');
  setTimeout(()=>toggleCheckout(true), 400);
}

function customizeDesign(id) {
  const d = DESIGNS.find(x=>x.id===id); if(!d) return;
  loadDesignToCanvas(d);
  scrollTo_('studio');
}

function loadDesignToCanvas(d) {
  state.selectedDesign = d;
  clearPrintZone();
  const el = makeTextEl(d.text, d.font, d.tc, '1rem');
  el.style.left='10%'; el.style.top='8%';
  document.getElementById('print-zone').appendChild(el);
  hidePzEmpty();
  document.getElementById('elem-actions').style.display='flex';
  const b = document.getElementById('gb-banner');
  document.getElementById('gb-name').textContent = d.name;
  b.style.display='flex';
  // Set shirt to near-match of design bg
  const productBody = document.getElementById('product-body');
  // legacy shirtBody ref removed
}

function clearGallerySelection() {
  state.selectedDesign = null;
  document.getElementById('gb-banner').style.display='none';
  clearCanvas();
}

// ══════════════════════════════════════
// PROFILE SYSTEM
// ══════════════════════════════════════
function toggleProfilePanel() {
  const panel = document.getElementById('profilePanel');
  const overlay = document.getElementById('profileOverlay');
  const isOpen = panel.classList.contains('open');
  if(isOpen) { closeProfilePanel(); }
  else { panel.classList.add('open'); overlay.classList.add('open'); renderProfilePanel(); }
}
function closeProfilePanel() {
  document.getElementById('profilePanel').classList.remove('open');
  document.getElementById('profileOverlay').classList.remove('open');
}

function renderProfilePanel() {
  const user = DB.getUser();
  if(!user) {
    document.getElementById('pp-auth').style.display='flex';
    document.getElementById('pp-signed-in').style.display='none';
  } else {
    document.getElementById('pp-auth').style.display='none';
    document.getElementById('pp-signed-in').style.display='flex';
    document.getElementById('pp-user-avatar').textContent = user.name.charAt(0).toUpperCase();
    document.getElementById('pp-user-name').textContent = user.name;
    document.getElementById('pp-user-email').textContent = user.email;
    renderOrderHistory();
    renderSavedDesigns();
  }
}

function signIn() {
  const name = document.getElementById('pp-name').value.trim();
  const email = document.getElementById('pp-email').value.trim();
  if(!name || !email) { alert('Please enter your name and email.'); return; }
  const user = { name, email, joinedAt: Date.now() };
  DB.setUser(user);
  updateHeaderProfile(user);
  renderProfilePanel();
}

function signOut() {
  DB.setUser(null);
  updateHeaderProfile(null);
  renderProfilePanel();
}

function updateHeaderProfile(user) {
  const avatar = document.getElementById('profileAvatar');
  const nameEl = document.getElementById('profileBtnName');
  const badge  = document.getElementById('profileOrderBadge');
  if(user) {
    avatar.textContent = user.name.charAt(0).toUpperCase();
    avatar.style.background = '#e85d04';
    nameEl.textContent = user.name.split(' ')[0];
    const orderCount = DB.getOrders().length;
    if(orderCount > 0) {
      badge.style.display='flex';
      badge.textContent = orderCount;
    }
  } else {
    avatar.textContent = '?';
    avatar.style.background = 'var(--ink)';
    nameEl.textContent = 'Sign In';
    badge.style.display='none';
  }
}

function renderOrderHistory() {
  const orders = DB.getOrders();
  const list = document.getElementById('pp-orders-list');
  const count = document.getElementById('pp-order-count');
  count.textContent = `${orders.length} order${orders.length!==1?'s':''}`;
  if(!orders.length) {
    list.innerHTML = `<div class="pp-empty-orders"><span>📦</span><p>No orders yet. Place your first order!</p></div>`;
    return;
  }
  list.innerHTML = orders.map(order => {
    const statusKey = advanceStatus(order);
    const statusIdx = getStatusIndex(statusKey);
    const statusStep = STATUS_STEPS[statusIdx];
    const dotClass = `status-${statusKey}`;
    const date = new Date(order.placedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    return `<div class="pp-order-card">
      <div class="poc-top">
        <div>
          <div class="poc-design">${order.designName||'Custom Design'}</div>
          <div class="poc-meta">
            <span>${capitalize(order.product||'tee')}</span>
            <span>${order.size||'M'}</span>
            <span>${order.color||'White'}</span>
            <span>${date}</span>
          </div>
        </div>
        <div class="poc-total">$${order.total||'29.99'}</div>
      </div>
      <div class="poc-status-row">
        <div class="poc-status-dot ${dotClass}"></div>
        <span class="poc-status-label">${statusStep.icon} ${statusStep.label}</span>
      </div>
      <div class="poc-actions">
        <button class="poc-btn poc-btn-track" onclick="openTrackingModal('${order.id}')">📍 Track</button>
        <button class="poc-btn poc-btn-reorder" onclick="reorderFromProfile('${order.id}')">🔄 Reorder</button>
      </div>
    </div>`;
  }).join('');
}

function renderSavedDesigns() {
  const saved = DB.getSaved();
  const list = document.getElementById('pp-saved-list');
  if(!saved.length) {
    list.innerHTML = `<div class="pp-empty-orders"><span>🎨</span><p>No saved designs yet.</p></div>`;
    return;
  }
  list.innerHTML = saved.map(d => `
    <div class="pp-saved-card">
      <div class="psc-preview" style="background:${d.bg||'#111'};font-family:${d.font};color:${d.tc||'#fff'}">${(d.name||'Design').slice(0,8)}</div>
      <span class="psc-name">${d.name}</span>
      <button class="psc-btn" onclick="quickOrderSaved('${d.id}')">Order →</button>
    </div>`).join('');
}

function quickOrderSaved(id) {
  const d = DESIGNS.find(x=>x.id===id);
  if(d) { closeProfilePanel(); orderDesign(id); }
}

// ══════════════════════════════════════
// TRACKING MODAL
// ══════════════════════════════════════
let _trackingOrderId = null;

function openTrackingModal(orderId) {
  _trackingOrderId = orderId;
  const orders = DB.getOrders();
  const order = orders.find(o=>o.id===orderId);
  if(!order) return;

  document.getElementById('tm-order-id').textContent = `Order #${order.id}`;
  const statusKey = advanceStatus(order);
  const statusIdx = getStatusIndex(statusKey);

  // Build timeline
  const timeline = document.getElementById('tm-timeline');
  timeline.innerHTML = STATUS_STEPS.map((step,i) => {
    const isDone   = i < statusIdx;
    const isActive = i === statusIdx;
    const cls = isDone ? 'done' : isActive ? 'active' : '';
    const timeLabel = isDone ? getStepTime(order.placedAt, i) : (isActive ? 'Now' : 'Pending');
    const desc = isActive ? step.desc : (isDone ? 'Completed' : '—');
    return `<div class="tm-step ${cls}">
      <div class="tm-step-left">
        <div class="tm-step-dot">${isDone?'✓':isActive?step.icon:''}</div>
        <div class="tm-step-line"></div>
      </div>
      <div class="tm-step-content">
        <div class="tm-step-title">${step.label}</div>
        <div class="tm-step-time">${timeLabel}</div>
        ${isActive||isDone?`<div class="tm-step-desc">${isActive?step.desc:''}</div>`:''}
      </div>
    </div>`;
  }).join('');

  // Details
  const date = new Date(order.placedAt).toLocaleDateString('en-US',{weekday:'short',month:'long',day:'numeric'});
  document.getElementById('tm-details').innerHTML = `
    <div class="tm-detail-row"><span>Order ID</span><span>#${order.id}</span></div>
    <div class="tm-detail-row"><span>Design</span><span>${order.designName||'Custom'}</span></div>
    <div class="tm-detail-row"><span>Product</span><span>${capitalize(order.product||'tee')} · ${order.size||'M'} · ${order.color||'White'}</span></div>
    <div class="tm-detail-row"><span>Provider</span><span>${capitalize(order.provider||'auto')}</span></div>
    <div class="tm-detail-row"><span>Placed</span><span>${date}</span></div>
    <div class="tm-detail-row"><span>Total</span><span>$${order.total||'29.99'}</span></div>
    <div class="tm-detail-row"><span>Ships to</span><span>${order.city||''}, ${order.country||''}</span></div>`;

  // Tracking link (only for shipped+)
  const tLink = document.getElementById('tm-tracking-link');
  if(statusIdx >= 3 && order.trackingNumber) {
    tLink.style.display='block';
    document.getElementById('tm-carrier-link').href = `https://t.17track.net/en#nums=${order.trackingNumber}`;
  } else if(statusIdx >= 3) {
    tLink.style.display='block';
    document.getElementById('tm-carrier-link').href='#';
    document.getElementById('tm-carrier-link').textContent='📦 Tracking number will appear here when assigned';
  } else {
    tLink.style.display='none';
  }

  document.getElementById('trackingOverlay').style.display='block';
  document.getElementById('trackingModal').style.display='flex';
  document.getElementById('trackingModal').style.flexDirection='column';
}

function getStepTime(placedAt, stepIdx) {
  const d = new Date(placedAt + stepIdx * 28800000); // ~8h intervals
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
}

function closeTrackingModal() {
  document.getElementById('trackingOverlay').style.display='none';
  document.getElementById('trackingModal').style.display='none';
  _trackingOrderId = null;
}

function reorderFromTracking() {
  if(!_trackingOrderId) return;
  closeTrackingModal();
  reorderFromProfile(_trackingOrderId);
}

function reorderFromProfile(orderId) {
  const order = DB.getOrders().find(o=>o.id===orderId);
  if(!order) return;
  closeProfilePanel();
  // Restore design
  if(order.designId) {
    const d = DESIGNS.find(x=>x.id===order.designId);
    if(d) loadDesignToCanvas(d);
  }
  // Restore product/size/color/qty
  state.product = order.product || 'tee';
  state.size = order.size || 'M';
  state.qty = order.qty || 1;
  state.basePrice = PRICES[state.product];
  document.querySelectorAll('.prod-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.product===state.product);
  });
  document.querySelectorAll('.sz-btn').forEach(b=>{
    b.classList.toggle('active', b.textContent===state.size);
  });
  document.getElementById('qty-display').textContent = state.qty;
  updatePrice();
  // Pre-fill address from saved order
  const user = DB.getUser();
  if(order.name || user) {
    const n = document.getElementById('addr-name');
    const e = document.getElementById('addr-email');
    const s = document.getElementById('addr-street');
    const c = document.getElementById('addr-city');
    const st = document.getElementById('addr-state');
    const z = document.getElementById('addr-zip');
    const co = document.getElementById('addr-country');
    if(n) n.value = order.name || (user&&user.name)||'';
    if(e) e.value = order.email || (user&&user.email)||'';
    if(s) s.value = order.street || '';
    if(c) c.value = order.city || '';
    if(st) st.value = order.stateCode || '';
    if(z) z.value = order.zip || '';
    if(co) { co.value = order.country || 'US'; updateRoutingPreview(co.value); }
    document.getElementById('autofill-notice').style.display='flex';
  }
  // Open checkout
  toggleCheckout(true);
  scrollTo_('studio');
  setTimeout(()=>{
    const orderCol = document.getElementById('scol-order');
    if(orderCol) orderCol.scrollIntoView({behavior:'smooth',block:'start'});
  }, 500);
}

// ══════════════════════════════════════
// AUTOFILL FROM PROFILE
// ══════════════════════════════════════
function autofillFromProfile() {
  const user = DB.getUser();
  if(!user) return;
  const n = document.getElementById('addr-name');
  const e = document.getElementById('addr-email');
  if(n && !n.value) n.value = user.name;
  if(e && !e.value) e.value = user.email;
  document.getElementById('autofill-notice').style.display='flex';
}
function clearAutofill() {
  ['addr-name','addr-email','addr-street','addr-city','addr-state','addr-zip'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('autofill-notice').style.display='none';
}

// ══════════════════════════════════════
// SCROLL / NAV
// ══════════════════════════════════════
function scrollTo_(id, e) {
  if(e) e.preventDefault();
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth'});
}
function scrollToOrder() {
  scrollTo_('studio');
  setTimeout(()=>switchTool('order', document.querySelector('[data-tool="order"].mtb')), 400);
}
function toggleMobileNav() {
  document.getElementById('mobileNav').classList.toggle('open');
}

// ══════════════════════════════════════
// TOOL SWITCHING
// ══════════════════════════════════════
function switchTool(tool, btn) {
  document.querySelectorAll('.mtb').forEach(b=>b.classList.toggle('active', b.dataset.tool===tool));
  document.querySelectorAll('.tool-panel').forEach(p=>p.classList.remove('active'));
  const panel = document.getElementById('tool-'+tool);
  if(panel) panel.classList.add('active');
  if(window.innerWidth <= 900) {
    document.getElementById('scol-tools').style.display = tool==='order' ? 'none' : 'block';
    document.getElementById('scol-order').style.display = tool==='order' ? 'block' : 'none';
  }
}

// ══════════════════════════════════════
// TEXT TOOL
// ══════════════════════════════════════
function addTextElement() {
  const text = document.getElementById('text-input').value.trim();
  if(!text) return;
  const size = parseInt(document.getElementById('text-size').value)||32;
  const el = makeTextEl(text, state.textFont, state.textColor, size+'px');
  const pz = document.getElementById('print-zone');
  const count = pz.querySelectorAll('.design-element').length;
  el.style.left='5%';
  el.style.top=Math.max(4,Math.min(70, 4 + count*18))+'%';
  pz.appendChild(el);
  hidePzEmpty(); saveHistory();
  document.getElementById('text-input').value='';
  document.getElementById('elem-actions').style.display='flex';
}

function makeTextEl(text, font, color, size) {
  const el = document.createElement('div');
  el.className='design-element';
  el.dataset.id=Date.now()+Math.random();
  const span = document.createElement('span');
  span.className='txt-layer';
  span.textContent=text;
  span.style.fontFamily=font;
  span.style.color=color;
  span.style.fontSize=size;
  span.style.fontWeight=state.bold?'bold':'700';
  span.style.fontStyle=state.italic?'italic':'normal';
  span.style.lineHeight='1.2';
  span.style.whiteSpace='pre-wrap';
  el.appendChild(span);
  el.appendChild(makeResizeHandle());
  makeDraggable(el);
  el.addEventListener('click',(e)=>{ e.stopPropagation(); selectEl(el); });
  return el;
}

function updateSelectedFont(val) {
  state.textFont=val;
  const layer=getSelectedTxtLayer();
  if(layer) layer.style.fontFamily=val;
}
function updateSelectedSize(val) {
  document.getElementById('text-size-val').textContent=val+'px';
  const layer=getSelectedTxtLayer();
  if(layer) layer.style.fontSize=val+'px';
}
function selectTextColor(btn) {
  document.querySelectorAll('.cq').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  state.textColor=btn.dataset.c;
  document.getElementById('txt-custom-color').value=state.textColor;
  const layer=getSelectedTxtLayer();
  if(layer) layer.style.color=state.textColor;
}
function selectCustomColor(val) {
  state.textColor=val;
  document.querySelectorAll('.cq').forEach(b=>b.classList.remove('active'));
  const layer=getSelectedTxtLayer();
  if(layer) layer.style.color=val;
}
function toggleBold() {
  state.bold=!state.bold;
  document.getElementById('sbtn-bold').classList.toggle('active',state.bold);
  const layer=getSelectedTxtLayer();
  if(layer) layer.style.fontWeight=state.bold?'bold':'700';
}
function toggleItalic() {
  state.italic=!state.italic;
  document.getElementById('sbtn-italic').classList.toggle('active',state.italic);
  const layer=getSelectedTxtLayer();
  if(layer) layer.style.fontStyle=state.italic?'italic':'normal';
}
function setAlign(a) {
  const layer=getSelectedTxtLayer();
  if(layer) layer.style.textAlign=a;
}
function getSelectedTxtLayer() {
  const sel=document.querySelector('.design-element.selected');
  return sel?sel.querySelector('.txt-layer'):null;
}

// ══════════════════════════════════════
// IMAGE TOOL
// ══════════════════════════════════════
function scaleSelected(val) {
  document.getElementById('img-scale-val').textContent=val+'%';
  const sel=document.querySelector('.design-element.selected');
  if(sel){ const img=sel.querySelector('img'); if(img) img.style.width=val+'px'; }
}
function opacitySelected(val) {
  document.getElementById('img-opacity-val').textContent=val+'%';
  const sel=document.querySelector('.design-element.selected');
  if(sel) sel.style.opacity=val/100;
}

// ══════════════════════════════════════
// AI TOOLS
// ══════════════════════════════════════
async function generateAIText() {
  const prompt=document.getElementById('ai-text-prompt').value.trim();
  if(!prompt) return;
  const loading=document.getElementById('ai-text-loading');
  const results=document.getElementById('ai-slogan-results');
  const btn=document.getElementById('ai-text-btn');
  loading.style.display='flex'; results.innerHTML=''; btn.disabled=true;
  try {
    const res=await fetch('/api/generate-text',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
    const data=await res.json();
    if(data.slogans) {
      results.innerHTML=data.slogans.map(s=>`
        <button class="slogan-chip" onclick="useSloganText('${s.replace(/'/g,"\\'").replace(/\n/g,' ')}')">
          ${s}<em>+ Add</em>
        </button>`).join('');
    }
  } catch{ results.innerHTML=`<p style="color:var(--err);font-size:.75rem">Can't reach server. Is server.py running?</p>`; }
  finally { loading.style.display='none'; btn.disabled=false; }
}

function useSloganText(text) {
  document.getElementById('text-input').value=text;
  addTextElement();
}

async function generateAIImage() {
  const prompt=document.getElementById('ai-image-prompt').value.trim();
  if(!prompt) return;
  const loading=document.getElementById('ai-image-loading');
  const btn=document.getElementById('ai-image-btn');
  loading.style.display='flex'; btn.disabled=true;
  try {
    const res=await fetch('/api/generate-image',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
    const data=await res.json();
    if(data.imageUrl) addImageEl(data.imageUrl);
  } catch(err){ console.error(err); }
  finally { loading.style.display='none'; btn.disabled=false; }
}

function addImageEl(url) {
  const pz=document.getElementById('print-zone');
  const el=document.createElement('div');
  el.className='design-element'; el.style.left='5%'; el.style.top='5%'; el.dataset.id=Date.now();
  const img=document.createElement('img');
  img.src=url; img.style.maxWidth='100%'; img.style.maxHeight='80px'; img.style.display='block';
  el.appendChild(img); el.appendChild(makeResizeHandle());
  makeDraggable(el);
  el.addEventListener('click',(e)=>{e.stopPropagation();selectEl(el);});
  pz.appendChild(el); hidePzEmpty(); saveHistory();
  document.getElementById('elem-actions').style.display='flex';
}

// ══════════════════════════════════════
// ELEMENT MANAGEMENT
// ══════════════════════════════════════
function selectEl(el) {
  document.querySelectorAll('.design-element').forEach(e=>e.classList.remove('selected'));
  el.classList.add('selected');
  const txt=el.querySelector('.txt-layer');
  if(txt) {
    const font=document.getElementById('text-font');
    if(font) font.value=txt.style.fontFamily||state.textFont;
    document.getElementById('txt-custom-color').value=normalizeColor(txt.style.color||'#000');
  }
}
function deleteSelected() {
  const sel=document.querySelector('.design-element.selected');
  if(sel){ saveHistory(); sel.remove(); checkEmpty(); }
}
function duplicateSelected() {
  const sel=document.querySelector('.design-element.selected'); if(!sel) return;
  const clone=sel.cloneNode(true);
  clone.style.left=(parseFloat(sel.style.left)+3)+'%';
  clone.style.top=(parseFloat(sel.style.top)+3)+'%';
  clone.dataset.id=Date.now();
  makeDraggable(clone);
  clone.addEventListener('click',(e)=>{e.stopPropagation();selectEl(clone);});
  clone.querySelector('.resize-handle')?.addEventListener('mousedown',startResize);
  document.getElementById('print-zone').appendChild(clone);
  selectEl(clone); saveHistory();
}
function bringForward() {
  const sel=document.querySelector('.design-element.selected');
  if(sel) sel.style.zIndex=parseInt(sel.style.zIndex||0)+1+'';
}
function sendBack() {
  const sel=document.querySelector('.design-element.selected');
  if(sel) sel.style.zIndex=Math.max(0,parseInt(sel.style.zIndex||1)-1)+'';
}
function clearCanvas() {
  saveHistory(); clearPrintZone();
  document.getElementById('elem-actions').style.display='none';
  checkEmpty();
}
function clearPrintZone() {
  document.querySelectorAll('#print-zone .design-element').forEach(e=>e.remove());
}
function saveHistory() {
  state.history.push(document.getElementById('print-zone').innerHTML);
  if(state.history.length>20) state.history.shift();
}
function undoLast() {
  if(!state.history.length) return;
  const pz=document.getElementById('print-zone');
  pz.innerHTML=state.history.pop();
  pz.querySelectorAll('.design-element').forEach(el=>{
    makeDraggable(el);
    el.addEventListener('click',(e)=>{e.stopPropagation();selectEl(el);});
    el.querySelector('.resize-handle')?.addEventListener('mousedown',startResize);
  });
  checkEmpty();
}
function hidePzEmpty() {
  const h=document.getElementById('pz-empty'); if(h) h.style.display='none';
}
function checkEmpty() {
  const pz=document.getElementById('print-zone');
  const empty=pz.querySelector('.pz-empty');
  const hasDes=pz.querySelectorAll('.design-element').length>0;
  if(empty) empty.style.display=hasDes?'none':'flex';
}

// ══════════════════════════════════════
// SHIRT COLOR
// ══════════════════════════════════════
function setProductColor(btn) {
  document.querySelectorAll('.sc').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('product-body').style.fill=btn.dataset.hex;
  document.getElementById('ccb-name').textContent=btn.dataset.name;
  state.color=btn.dataset.name; state.colorHex=btn.dataset.hex;
}

// ══════════════════════════════════════
// DRAG + RESIZE
// ══════════════════════════════════════
function makeDraggable(el) {
  let dragging=false,sx,sy,ol,ot;
  const start=(cx,cy)=>{ dragging=true; sx=cx; sy=cy; ol=parseFloat(el.style.left)||0; ot=parseFloat(el.style.top)||0; };
  const move=(cx,cy)=>{ if(!dragging) return; const p=el.parentElement; el.style.left=clamp(ol+((cx-sx)/p.offsetWidth)*100,0,90)+'%'; el.style.top=clamp(ot+((cy-sy)/p.offsetHeight)*100,0,90)+'%'; };
  const end=()=>{ dragging=false; };
  el.addEventListener('mousedown',(e)=>{ if(e.target.classList.contains('resize-handle')) return; e.preventDefault(); start(e.clientX,e.clientY); });
  document.addEventListener('mousemove',(e)=>move(e.clientX,e.clientY));
  document.addEventListener('mouseup',end);
  el.addEventListener('touchstart',(e)=>{ if(e.target.classList.contains('resize-handle')) return; const t=e.touches[0]; start(t.clientX,t.clientY); },{passive:true});
  el.addEventListener('touchmove',(e)=>{ e.preventDefault(); const t=e.touches[0]; move(t.clientX,t.clientY); },{passive:false});
  el.addEventListener('touchend',end);
}
function makeResizeHandle() {
  const h=document.createElement('div'); h.className='resize-handle';
  h.addEventListener('mousedown',startResize); return h;
}
function startResize(e) {
  e.preventDefault(); e.stopPropagation();
  const el=e.target.parentElement, sx=e.clientX, sw=el.offsetWidth;
  const mv=(e)=>{ el.style.width=Math.max(30,sw+(e.clientX-sx))+'px'; };
  const up=()=>{ document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); };
  document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
}

// ══════════════════════════════════════
// FILE UPLOAD
// ══════════════════════════════════════
function setupFileUpload() {
  const fi=document.getElementById('file-input');
  const dz=document.getElementById('upload-drop');
  if(!fi||!dz) return;
  fi.addEventListener('change',(e)=>{ if(e.target.files[0]) loadImageFile(e.target.files[0]); });
  dz.addEventListener('dragover',(e)=>{ e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave',()=>dz.classList.remove('dragover'));
  dz.addEventListener('drop',(e)=>{ e.preventDefault(); dz.classList.remove('dragover'); if(e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0]); });
}
function loadImageFile(file) {
  const r=new FileReader();
  r.onload=(e)=>addImageEl(e.target.result);
  r.readAsDataURL(file);
}

// ══════════════════════════════════════
// PRODUCT / SIZE / QTY / PRICE
// ══════════════════════════════════════
function selectProduct(btn,product) {
  document.querySelectorAll('.prod-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  state.product=product; state.basePrice=PRICES[product]; updatePrice();
}
function selectSize(btn) {
  document.querySelectorAll('.sz-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); state.size=btn.textContent;
}
function changeQty(delta) {
  state.qty=clamp(state.qty+delta,1,99);
  document.getElementById('qty-display').textContent=state.qty;
  const hint=document.getElementById('qty-hint');
  if(state.qty>=10) hint.textContent='10% off!';
  else if(state.qty>=5) hint.textContent='5% off!';
  else hint.textContent='';
  updatePrice();
}
function updatePrice() {
  let p = state.basePrice;
  // Add tier surcharge
  if (state.tier && TIER_PRICES[state.tier]) {
    p += TIER_PRICES[state.tier];
  }
  
  if(state.qty>=10) p*=.9;
  else if(state.qty>=5) p*=.95;
  const total=(p*state.qty).toFixed(2);
  const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
  set('base-price','$'+p.toFixed(2));
  set('price-qty','× '+state.qty);
  set('total-price','$'+total);
  set('mob-total','$'+total);
}

function selectTier(btn, tierId) {
  state.tier = tierId;
  document.querySelectorAll('.tier-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  updatePrice();
  toast(`Switched to ${tierId} fabric`,'info');
}

function selectProductFromLifestyle(pid) {
  const p = typeof CATALOG!=='undefined' ? CATALOG[pid] : null;
  if(!p) return;
  state.product = pid;
  state.basePrice = p.basePrice || 29.99;
  
  // Sync UI
  document.querySelectorAll('.prod-btn').forEach(b=>b.classList.remove('active'));
  const pb=document.querySelector(`.prod-btn[data-product="${pid}"]`);
  if(pb) pb.classList.add('active');
  
  // Only show fabric section for apparel
  const fab = document.getElementById('fabric-section');
  if(fab) fab.style.display = ['tee','hoodie','longsleeve','croptee','tanktop'].includes(pid) ? 'block' : 'none';

  updatePrice();
  scrollTo_('studio');
  toast(`Now designing: ${p.label}`,'ok');
}

// ══════════════════════════════════════
// CHECKOUT / ORDER
// ══════════════════════════════════════
function toggleCheckout(forceOpen) {
  const form = document.getElementById('checkout-form');
  const btn = document.getElementById('checkout-toggle');
  const shouldOpen = forceOpen === true || form.style.display === 'none';
  
  form.style.display = shouldOpen ? 'flex' : 'none';
  
  if (shouldOpen) {
    form.style.flexDirection = 'column';
    form.style.gap = '.58rem';
    btn.textContent = 'Close ✕';
    updateRoutingPreview(document.getElementById('addr-country')?.value || 'US');
    autofillFromProfile();
  } else {
    btn.textContent = 'Proceed to Checkout →';
  }
}

function smartRoute(c) {
  c = (c || '').toUpperCase().trim();
  if (PRINTFUL.has(c)) return { flag: '⚡', name: 'Printful', provider: 'printful', reason: `Printful fulfills ${c} orders — fastest domestic.` };
  if (GELATO.has(c))   return { flag: '🌍', name: 'Gelato',   provider: 'gelato',   reason: `Gelato has local partners in ${c} — lowest cost.` };
  return { flag: '🌐', name: 'Printify', provider: 'printify', reason: `Printify's global network covers ${c}.` };
}

function updateRoutingPreview(val) {
  const r = smartRoute(val);
  const f = document.getElementById('routing-flag');
  const p = document.getElementById('routing-provider');
  const rs = document.getElementById('routing-reason');
  if (f) f.textContent = r.flag;
  if (p) p.textContent = 'Routed to ' + r.name;
  if (rs) rs.textContent = r.reason;
  state.shippingPreview = r;
}

async function placeOrder() {
  const cart = DB.getCart ? DB.getCart() : [{ product: state.product, size: state.size, color: state.color, qty: state.qty }]; 
  const user = DB.getUser();
  if (!user) { toast('Please sign in to order', 'err'); openModal_('emailCapOverlay', 'emailCapModal'); return; }

  const btn = document.getElementById('checkout-toggle');
  const name = document.getElementById('addr-name')?.value.trim();
  const email = document.getElementById('addr-email')?.value.trim();
  const street = document.getElementById('addr-street')?.value.trim();
  const city = document.getElementById('addr-city')?.value.trim();
  const zip = document.getElementById('addr-zip')?.value.trim();
  const country = (document.getElementById('addr-country')?.value || 'US').trim().toUpperCase();

  if (!name || !street || !city || !zip) {
    toast('Please fill in all shipping fields', 'err');
    return;
  }

  const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const orderRecord = {
    id: orderId,
    date: new Date().toISOString(),
    placedAt: Date.now(),
    customer: { name, email },
    product: {
      id: state.product,
      label: CATALOG[state.product]?.label || state.product,
      size: state.size,
      color: state.color,
      tier: state.tier || 'essential'
    },
    total: document.getElementById('total-price').textContent.replace('$', ''),
    status: 'pending',
    provider: (state.shippingPreview && state.shippingPreview.provider) || 'printful'
  };

  try {
    // 1. Save to Local Storage (User + Admin Sync)
    DB.addOrder(orderRecord);
    
    // 2. Attempt Backend POST
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderRecord)
    });

    if (res.ok) {
      toast('Order placed successfully!', 'ok');
    } else {
      toast('Order saved locally (Server Offline)', 'info');
    }

    // 3. Success UI
    toggleCheckout(false);
    openModal_('emailCapOverlay', 'emailCapModal');
    const cap = document.getElementById('emailCapModal');
    if (cap) {
      cap.innerHTML = `
        <div style="padding:2.5rem;text-align:center">
          <div style="font-size:3rem;margin-bottom:1rem">🎉</div>
          <h2 style="font-family:Anton;color:var(--accent);font-size:2rem">ORDER PLACED!</h2>
          <p style="margin:1rem 0;color:var(--muted)">Your order <strong>#${orderId.slice(-6)}</strong> has been received and routed to <strong>${orderRecord.provider}</strong>.</p>
          <div style="background:#f1f5f9;padding:1rem;border-radius:12px;margin-bottom:1.5rem;text-align:left;font-size:0.85rem">
            <strong>Shipping to:</strong><br>${name}<br>${street}, ${city}
          </div>
          <button class="btn-primary" onclick="window.location.reload()">Back to Store</button>
          <button class="btn-ghost" onclick="window.location.href='admin.html'" style="margin-top:0.5rem">Open Admin Panel</button>
        </div>
      `;
    }

  } catch (e) {
    console.error('Order Error:', e);
    toast('Order saved to local database', 'ok');
    DB.addOrder(orderRecord);
    setTimeout(() => { if (confirm('Order saved locally! View in Admin Panel?')) window.location.href = 'admin.html'; }, 1000);
  }
}


// ══════════════════════════════════════
// UTILS
// ══════════════════════════════════════
function clamp(v,mn,mx){ return Math.min(mx,Math.max(mn,v)); }
function capitalize(s){ return s?s.charAt(0).toUpperCase()+s.slice(1):s; }
function normalizeColor(c) {
  if(!c) return '#000000';
  if(c.startsWith('#')) return c;
  const m=c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if(m) return '#'+[m[1],m[2],m[3]].map(n=>parseInt(n).toString(16).padStart(2,'0')).join('');
  return '#000000';
}

// Click outside to deselect elements
document.addEventListener('click',(e)=>{
  if(!e.target.closest('.design-element')&&!e.target.closest('.elem-actions')) {
    document.querySelectorAll('.design-element').forEach(el=>el.classList.remove('selected'));
  }
});

// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded',()=>{
  setupFileUpload();
  updatePrice();

  // Restore user profile state
  const user=DB.getUser();
  if(user) updateHeaderProfile(user);

  // Color picker sync
  document.getElementById('txt-custom-color')?.addEventListener('input',(e)=>selectCustomColor(e.target.value));

  // Mobile: hide order col by default
  if(window.innerWidth<=900) {
    const oc=document.getElementById('scol-order');
    if(oc) oc.style.display='none';
  }
  window.addEventListener('resize',()=>{
    if(window.innerWidth>900) {
      document.querySelectorAll('.scol').forEach(c=>c.style.display='');
    }
  });
});

/* ═══════════════════════════════════════════════════
   NEW FEATURES — Product Selector, Mockup Generator,
   Gift Cards, Wishlist, Share, Size Guide,
   Email Capture, Rush Fulfillment, Bulk Pricing
═══════════════════════════════════════════════════ */

// ── Use designs.js DESIGNS globally (removes old internal array dependency)
// DESIGNS is loaded from designs.js before app.js

// ── Patch renderCard to include wishlist heart and share/mockup buttons ──
function renderCard(d) {
  const lines = d.text.split('\n').map(l=>`<span style="display:block">${l}</span>`).join('');
  const wl = DB.getWishlist ? DB.getWishlist() : [];
  const isWishlisted = wl.some(w=>w.id===d.id);
  return `<article class="dcard" role="listitem" data-id="${d.id}" data-cat="${d.cat||d.category||''}">
    <div class="dcard-preview" style="background:${d.bg}">
      ${d.badge?`<div class="dcard-badge">${d.badge}</div>`:''}
      <button class="wl-heart ${isWishlisted?'active':''}" onclick="toggleWishlist('${d.id}',event)" title="${isWishlisted?'Remove from wishlist':'Save to wishlist'}">
        ${isWishlisted?'♥':'♡'}
      </button>
      <div class="dcard-text" style="font-family:${d.font};font-size:${d.fs};color:${d.tc};text-align:center">${lines}</div>
    </div>
    <div class="dcard-info">
      <div>
        <div class="dcard-name">${d.name}</div>
        <div class="dcard-cat">${capitalize(d.cat||d.category||'')}</div>
      </div>
      <div class="dcard-price">$29.99</div>
    </div>
    <div class="dcard-actions">
      <button class="dcard-cta" onclick="orderDesign('${d.id}')">Order This →</button>
      <div style="display:flex;border-top:1px solid var(--border)">
        <button class="dcard-customize" onclick="customizeDesign('${d.id}')" style="flex:1">✏ Customize</button>
        <button class="dcard-customize" onclick="openShare('${d.id}',event)" style="flex:0;padding:.38rem .6rem;border-left:1px solid var(--border)" title="Share">⬆</button>
        <button class="dcard-customize" onclick="openMockupForDesign('${d.id}',event)" style="flex:0;padding:.38rem .6rem;border-left:1px solid var(--border)" title="Preview mockup">◎</button>
      </div>
    </div>
  </article>`;
}

// ── Gallery now uses DESIGNS from designs.js ──
function renderGallery(list) {
  const grid = document.getElementById('design-grid');
  const empty = document.getElementById('gallery-empty');
  if(!list||!list.length) { if(grid) grid.innerHTML=''; if(empty) empty.style.display='flex'; return; }
  if(empty) empty.style.display='none';
  if(grid) grid.innerHTML = list.map(renderCard).join('');
}

function filterDesigns(cat, btn) {
  document.querySelectorAll('.ftab').forEach(t=>t.classList.remove('active'));
  if(btn) btn.classList.add('active');
  if(document.getElementById('design-search')) document.getElementById('design-search').value='';
  const src = typeof DESIGNS !== 'undefined' ? DESIGNS : [];
  renderGallery(cat==='all' ? src : src.filter(d=>(d.cat||d.category)===cat));
}

function searchDesigns(q) {
  const src = typeof DESIGNS !== 'undefined' ? DESIGNS : [];
  if(!q) { renderGallery(src); return; }
  q=q.toLowerCase().trim();
  renderGallery(src.filter(d=>
    d.name.toLowerCase().includes(q) ||
    (d.cat||d.category||'').includes(q) ||
    d.text.toLowerCase().includes(q) ||
    (d.tags||[]).some(t=>t.includes(q))
  ));
  document.querySelectorAll('.ftab').forEach(t=>t.classList.remove('active'));
  const all=document.querySelector('[data-filter="all"]');
  if(all) all.classList.add('active');
}

function resetGallery() {
  if(document.getElementById('design-search')) document.getElementById('design-search').value='';
  document.querySelectorAll('.ftab').forEach(t=>t.classList.remove('active'));
  const all=document.querySelector('[data-filter="all"]');
  if(all) all.classList.add('active');
  const src = typeof DESIGNS !== 'undefined' ? DESIGNS : [];
  renderGallery(src);
}

// ══════════════════════════════════════════════
// WISHLIST
// ══════════════════════════════════════════════
DB.getWishlist = () => JSON.parse(localStorage.getItem('pd_wishlist')||'[]');
DB.setWishlist = w => localStorage.setItem('pd_wishlist',JSON.stringify(w));

function toggleWishlist(id, e) {
  if(e) e.stopPropagation();
  const src = typeof DESIGNS !== 'undefined' ? DESIGNS : [];
  const d = src.find(x=>x.id===id); if(!d) return;
  const wl = DB.getWishlist();
  const idx = wl.findIndex(x=>x.id===id);
  if(idx>=0) { wl.splice(idx,1); toast('Removed from wishlist','info'); }
  else { wl.unshift(d); toast('Saved to wishlist ♥','ok'); }
  DB.setWishlist(wl);
  // Update heart in DOM
  const heart = document.querySelector(`.dcard[data-id="${id}"] .wl-heart`);
  if(heart) { heart.classList.toggle('active', idx<0); heart.textContent = idx<0?'♥':'♡'; }
}

function selectProduct(btn, pid) {
  const p = typeof CATALOG!=='undefined' ? CATALOG[pid] : null;
  if(!p) {
    toast(`Product ${pid} not in catalog`,'err');
    return;
  }
  // Update order panel
  state.product = pid;
  state.basePrice = p.basePrice||29.99;
  
  // Only show fabric section for apparel
  const fab = document.getElementById('fabric-section');
  if(fab) fab.style.display = ['tee','hoodie','longsleeve','croptee','tanktop'].includes(pid) ? 'block' : 'none';

  document.querySelectorAll('.prod-btn').forEach(b=>b.classList.remove('active'));
  const pb=document.querySelector(`.prod-btn[data-product="${pid}"]`);
  if(pb) pb.classList.add('active');
  updatePrice();
  closeProductSelector();
  scrollTo_('studio');
  toast(`Selected: ${p.label}`,'ok');
  // Show rush banner if over threshold
  if(p.basePrice>=30) showRushBanner();
}

function filterByProductType(pid) {
  if(!DESIGNS) return;
  const filtered = pid === 'all' ? DESIGNS : DESIGNS.filter(d => d.items && d.items.includes(pid));
  renderGallery(filtered);
  // Scroll to gallery
  scrollTo_('gallery');
  toast(`Filtering by ${pid}`,'info');
}

function openWishlist() {
  const wl = DB.getWishlist();
  const grid = document.getElementById('wishlist-grid');
  const empty = document.getElementById('wishlist-empty');
  if(!wl.length) { if(grid) grid.innerHTML=''; if(empty) empty.style.display='flex'; }
  else { if(empty) empty.style.display='none'; if(grid) grid.innerHTML=wl.map(renderCard).join(''); }
  openModal_('wishlistOverlay','wishlistModal');
}
function closeWishlist() { closeModal_('wishlistOverlay','wishlistModal'); }

// ══════════════════════════════════════════════
// PRODUCT SELECTOR
// ══════════════════════════════════════════════
let _psDesignId = null;
let _psCurrentCat = 'all';

function openProductSelector(designId) {
  _psDesignId = designId || null;
  const src = typeof DESIGNS !== 'undefined' ? DESIGNS : [];
  const notice = document.getElementById('ps-design-notice');
  if(designId) {
    const d = src.find(x=>x.id===designId);
    document.getElementById('ps-design-name').textContent = d?d.name:'Design';
    if(notice) notice.style.display='flex';
  } else {
    if(notice) notice.style.display='none';
  }
  renderProductGrid(_psCurrentCat);
  openModal_('productSelectorOverlay','productSelectorModal');
}

function closeProductSelector() { closeModal_('productSelectorOverlay','productSelectorModal'); }

function filterProductCat(cat, btn) {
  _psCurrentCat = cat;
  document.querySelectorAll('.ps-ctab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderProductGrid(cat);
}

function clearProductFilter() {
  _psDesignId=null;
  const n=document.getElementById('ps-design-notice');
  if(n) n.style.display='none';
  renderProductGrid(_psCurrentCat);
}

function renderProductGrid(cat) {
  const grid = document.getElementById('ps-grid');
  if(!grid || typeof CATALOG==='undefined') return;
  const items = Object.values(CATALOG).filter(p=>{
    if(p.category==='bundle') return cat==='all'||cat==='bundle';
    return cat==='all' || p.category===cat;
  });
  const src = typeof DESIGNS!=='undefined' ? DESIGNS : [];
  const design = _psDesignId ? src.find(d=>d.id===_psDesignId) : null;
  const compatIds = design?.items || null;

  grid.innerHTML = items.map(p=>{
    const noFulfill = p.fulfillment && p.fulfillment.length===0;
    const compatible = !compatIds || compatIds.includes(p.id);
    const providers = p.fulfillment?.join(' · ') || 'Self-fulfill';
    return `<div class="ps-card ${!compatible?'ps-incompatible':''}" onclick="selectProductFromSelector('${p.id}')">
      <div class="ps-card-icon" style="${!compatible?'opacity:.4':''}">${p.icon||'?'}</div>
      <div class="ps-card-name">${p.label}</div>
      <div class="ps-card-price">$${p.basePrice?.toFixed(2)||'—'}</div>
      <div class="ps-card-provider">${noFulfill?'⚠ Self-fulfill':providers}</div>
      ${noFulfill?'<div class="ps-card-warn">Needs manual sourcing</div>':''}
      ${!compatible?'<div class="ps-card-warn">Design mismatch</div>':''}
    </div>`;
  }).join('');
}

function selectProductFromSelector(pid) {
  const p = typeof CATALOG!=='undefined' ? CATALOG[pid] : null;
  if(!p) return;
  if(p.fulfillment && p.fulfillment.length===0) {
    const note=document.getElementById('ps-fulfill-note');
    const txt=document.getElementById('ps-fulfill-text');
    if(note) note.style.display='block';
    if(txt) txt.textContent=p.note||'This item requires independent sourcing.';
    return;
  }
  // Update order panel
  state.product = pid;
  state.basePrice = p.basePrice||29.99;
  document.querySelectorAll('.prod-btn').forEach(b=>b.classList.remove('active'));
  const pb=document.querySelector(`.prod-btn[data-product="${pid}"]`);
  if(pb) pb.classList.add('active');
  updatePrice();
  closeProductSelector();
  scrollTo_('studio');
  toast(`Selected: ${p.label}`,'ok');
  // Show rush banner if over threshold
  if(p.basePrice>=30) showRushBanner();
}

// ══════════════════════════════════════════════
// MOCKUP GENERATOR
// ══════════════════════════════════════════════
const MOCKUP_STATE = { productId:'tee', colorIdx:0, designId:null, placement:'front', scale:70 };

function openMockupModal() { renderMockup(); openModal_('mockupOverlay','mockupModal'); }
function closeMockupModal() { closeModal_('mockupOverlay','mockupModal'); }

function openMockupForDesign(designId, e) {
  if(e) e.stopPropagation();
  MOCKUP_STATE.designId = designId;
  openMockupModal();
}

function renderMockup() {
  const p = typeof CATALOG!=='undefined' ? CATALOG[MOCKUP_STATE.productId] : null;
  if(!p) return;
  const colors = p.mockupColors||[{name:'White',hex:'#ffffff'}];
  const color = colors[MOCKUP_STATE.colorIdx] || colors[0];
  const src = typeof DESIGNS!=='undefined' ? DESIGNS : [];
  const design = MOCKUP_STATE.designId ? src.find(d=>d.id===MOCKUP_STATE.designId) : null;
  const pid = MOCKUP_STATE.productId;

  // ── Canvas-based mockup renderer ──
  const display = document.getElementById('mockup-product-display');
  if(display) {
    display.innerHTML = '<canvas id="mockup-canvas" style="width:100%;height:100%;border-radius:12px"></canvas>';
    const canvas = document.getElementById('mockup-canvas');
    const dpr = window.devicePixelRatio||1;
    const W = 400, H = 440;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W+'px'; canvas.style.height = H+'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawProductMockup(ctx, W, H, pid, color, design, MOCKUP_STATE.placement, MOCKUP_STATE.scale);
  }

  // Color name + strip
  const cn = document.getElementById('moc-color-name');
  if(cn) cn.textContent = color.name;
  const strip = document.getElementById('mockup-color-strip');
  if(strip) {
    strip.innerHTML = colors.map((c,i)=>`
      <div class="mcs-dot ${i===MOCKUP_STATE.colorIdx?'active':''}"
        style="background:${c.hex};${c.hex==='#ffffff'?'border:1.5px solid #ddd':''}"
        onclick="setMockupColor(${i})" title="${c.name}"></div>`).join('');
  }

  // Product tabs
  const tabs = document.getElementById('mockup-product-tabs');
  if(tabs && typeof CATALOG!=='undefined') {
    const products = ['tee','hoodie','longsleeve','croptee','tote_bag','mug','travel_mug','snapback','phone_case','pillow','poster','socks'];
    tabs.innerHTML = products.filter(id=>CATALOG[id]).map(id=>`
      <button class="mpt-btn ${MOCKUP_STATE.productId===id?'active':''}" onclick="setMockupProduct('${id}')">
        ${CATALOG[id].label}
      </button>`).join('');
  }

  // Info panel
  const info = document.getElementById('mockup-info');
  if(info && p) {
    const fulfill = p.fulfillment?.length ? p.fulfillment.join(', ') : 'Self-fulfill';
    const warn = p.fulfillment?.length===0 ? '<span style="color:#f59e0b;font-weight:700">⚠ Self-fulfill required</span><br>' : '';
    info.innerHTML = `<strong>${p.label}</strong>$${p.basePrice?.toFixed(2)} · ${p.margin}% margin<br>${warn}Fulfilled by: ${fulfill}<br>Print areas: ${(p.printAreas||[]).join(', ')}<br><small>${p.desc||''}</small>`;
  }
}

/* ══════════════════════════════════════════════════
   CANVAS MOCKUP DRAWING ENGINE
   Draws realistic product silhouettes with:
   - Fabric shading (ambient occlusion on edges)
   - Highlight gradients (light from top-left)
   - Shadow drop
   - Design text composited on the print area
   - Stitching details where applicable
══════════════════════════════════════════════════ */
function drawProductMockup(ctx, W, H, pid, color, design, placement, scaleVal) {
  const C = color.hex;
  const isLight = isLightColor(C);

  ctx.clearRect(0,0,W,H);

  // Drop shadow for all products
  ctx.shadowColor = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  if(pid==='tee'||pid==='longsleeve'||pid==='raglan') drawTee(ctx,W,H,C,isLight,pid);
  else if(pid==='hoodie') drawHoodie(ctx,W,H,C,isLight);
  else if(pid==='croptee') drawCropTee(ctx,W,H,C,isLight);
  else if(pid==='tanktop') drawTankTop(ctx,W,H,C,isLight);
  else if(pid==='tote_bag') drawToteBag(ctx,W,H,C,isLight);
  else if(pid==='mug'||pid==='travel_mug') drawMug(ctx,W,H,C,isLight,pid);
  else if(pid==='snapback'||pid==='dadhut'||pid==='trucker_hat') drawHat(ctx,W,H,C,isLight,pid);
  else if(pid==='beanie') drawBeanie(ctx,W,H,C,isLight);
  else if(pid==='phone_case') drawPhoneCase(ctx,W,H,C,isLight);
  else if(pid==='pillow') drawPillow(ctx,W,H,C,isLight);
  else if(pid==='poster'||pid==='canvas_print') drawPoster(ctx,W,H,C,isLight);
  else if(pid==='socks') drawSocks(ctx,W,H,C,isLight);
  else if(pid==='notebook') drawNotebook(ctx,W,H,C,isLight);
  else drawTee(ctx,W,H,C,isLight,'tee'); // fallback

  ctx.shadowColor='transparent'; ctx.shadowBlur=0; ctx.shadowOffsetX=0; ctx.shadowOffsetY=0;

  // Composite design on print area
  if(design) {
    const zone = getPrintZone(pid, W, H, placement);
    drawDesignOnCanvas(ctx, design, zone, scaleVal, C, isLight);
  }
}

function isLightColor(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return (r*299+g*587+b*114)/1000 > 140;
}

function hexToRgba(hex, a=1) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function shadedColor(hex, amount) {
  // Darken or lighten hex by amount (-1 to 1)
  const r=Math.min(255,Math.max(0,parseInt(hex.slice(1,3),16)+Math.round(amount*255)));
  const g=Math.min(255,Math.max(0,parseInt(hex.slice(3,5),16)+Math.round(amount*255)));
  const b=Math.min(255,Math.max(0,parseInt(hex.slice(5,7),16)+Math.round(amount*255)));
  return `rgb(${r},${g},${b})`;
}

// ── T-SHIRT ──
function drawTee(ctx,W,H,C,isLight,pid) {
  const sl = pid==='longsleeve';
  const cx=W/2;
  // Shirt body path
  ctx.beginPath();
  // Left sleeve
  ctx.moveTo(cx-90,60); ctx.lineTo(cx-170,sl?200:130);
  ctx.lineTo(cx-145,sl?220:150); ctx.lineTo(cx-90,sl?190:120);
  // Left body
  ctx.lineTo(cx-85, H-50); ctx.lineTo(cx+85, H-50);
  // Right body
  ctx.lineTo(cx+90,sl?190:120); ctx.lineTo(cx+145,sl?220:150);
  ctx.lineTo(cx+170,sl?200:130);
  // Right sleeve
  ctx.lineTo(cx+90,60);
  // Collar right
  ctx.bezierCurveTo(cx+90,60, cx+60,35, cx+20,32);
  // Collar scoop
  ctx.bezierCurveTo(cx+20,32, cx+10,50, cx,50);
  ctx.bezierCurveTo(cx,50, cx-10,50, cx-20,32);
  // Collar left
  ctx.bezierCurveTo(cx-60,35, cx-90,60, cx-90,60);
  ctx.closePath();
  ctx.fillStyle=C; ctx.fill();

  // Fabric shading — left edge darker
  const shadeL = ctx.createLinearGradient(cx-170,0,cx-60,0);
  shadeL.addColorStop(0,'rgba(0,0,0,0.18)'); shadeL.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=shadeL; ctx.fill();

  // Fabric shading — right edge darker
  const shadeR = ctx.createLinearGradient(cx+60,0,cx+170,0);
  shadeR.addColorStop(0,'rgba(0,0,0,0)'); shadeR.addColorStop(1,'rgba(0,0,0,0.18)');
  ctx.fillStyle=shadeR; ctx.fill();

  // Highlight — top center light
  const hl = ctx.createRadialGradient(cx,80,10,cx,80,160);
  hl.addColorStop(0,'rgba(255,255,255,0.18)'); hl.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=hl; ctx.fill();

  // Collar fill (slightly different tone)
  ctx.beginPath();
  ctx.bezierCurveTo(cx+20,32, cx+10,50, cx,50);
  ctx.bezierCurveTo(cx,50, cx-10,50, cx-20,32);
  ctx.bezierCurveTo(cx-60,35, cx-90,60, cx-90,60);
  ctx.bezierCurveTo(cx+90,60, cx+60,35, cx+20,32);
  ctx.fillStyle=shadedColor(C,-0.06); ctx.fill();

  // Outline stroke
  ctx.strokeStyle=isLight?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.06)';
  ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(cx-90,60); ctx.lineTo(cx-170,sl?200:130);
  ctx.lineTo(cx-145,sl?220:150); ctx.lineTo(cx-90,sl?190:120);
  ctx.lineTo(cx-85,H-50); ctx.lineTo(cx+85,H-50);
  ctx.lineTo(cx+90,sl?190:120); ctx.lineTo(cx+145,sl?220:150);
  ctx.lineTo(cx+170,sl?200:130); ctx.lineTo(cx+90,60);
  ctx.stroke();

  // Bottom hem stitch line
  ctx.beginPath();
  ctx.moveTo(cx-83,H-52); ctx.lineTo(cx+83,H-52);
  ctx.strokeStyle=isLight?'rgba(0,0,0,0.05)':'rgba(255,255,255,0.05)';
  ctx.lineWidth=1; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]);
}

// ── HOODIE ──
function drawHoodie(ctx,W,H,C,isLight) {
  const cx=W/2;
  // Body
  ctx.beginPath();
  ctx.moveTo(cx-90,65); ctx.lineTo(cx-165,140);
  ctx.lineTo(cx-140,165); ctx.lineTo(cx-90,130);
  ctx.lineTo(cx-85,H-50); ctx.lineTo(cx+85,H-50);
  ctx.lineTo(cx+90,130); ctx.lineTo(cx+140,165);
  ctx.lineTo(cx+165,140); ctx.lineTo(cx+90,65);
  ctx.bezierCurveTo(cx+90,65,cx+65,40,cx+30,36);
  ctx.lineTo(cx+22,48); ctx.bezierCurveTo(cx+22,48,cx+14,56,cx,56);
  ctx.bezierCurveTo(cx,56,cx-14,56,cx-22,48);
  ctx.lineTo(cx-30,36);
  ctx.bezierCurveTo(cx-65,40,cx-90,65,cx-90,65);
  ctx.closePath();
  ctx.fillStyle=C; ctx.fill();

  // Shading
  const shL=ctx.createLinearGradient(cx-165,0,cx-50,0);
  shL.addColorStop(0,'rgba(0,0,0,0.2)'); shL.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=shL; ctx.fill();
  const shR=ctx.createLinearGradient(cx+50,0,cx+165,0);
  shR.addColorStop(0,'rgba(0,0,0,0)'); shR.addColorStop(1,'rgba(0,0,0,0.2)');
  ctx.fillStyle=shR; ctx.fill();

  // Hood drawstrings
  ctx.beginPath();
  ctx.moveTo(cx-10,48); ctx.bezierCurveTo(cx-10,48,cx-15,100,cx-18,130);
  ctx.moveTo(cx+10,48); ctx.bezierCurveTo(cx+10,48,cx+15,100,cx+18,130);
  ctx.strokeStyle=isLight?'rgba(0,0,0,0.15)':'rgba(255,255,255,0.15)';
  ctx.lineWidth=2; ctx.stroke();

  // Kangaroo pocket
  ctx.beginPath();
  ctx.roundRect(cx-55, H-170, 110, 65, 8);
  ctx.strokeStyle=isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.1)';
  ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle=shadedColor(C,-0.05); ctx.fill();

  // Highlight
  const hl=ctx.createRadialGradient(cx,90,10,cx,90,180);
  hl.addColorStop(0,'rgba(255,255,255,0.16)'); hl.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=hl;
  ctx.beginPath(); ctx.ellipse(cx,90,120,160,0,0,Math.PI*2); ctx.fill();
}

// ── CROP TEE ──
function drawCropTee(ctx,W,H,C,isLight) {
  const cx=W/2, bh=H-130; // shorter body
  ctx.beginPath();
  ctx.moveTo(cx-90,60); ctx.lineTo(cx-160,120);
  ctx.lineTo(cx-138,142); ctx.lineTo(cx-90,115);
  ctx.lineTo(cx-85,bh); ctx.lineTo(cx+85,bh);
  ctx.lineTo(cx+90,115); ctx.lineTo(cx+138,142);
  ctx.lineTo(cx+160,120); ctx.lineTo(cx+90,60);
  ctx.bezierCurveTo(cx+90,60,cx+60,35,cx+20,32);
  ctx.bezierCurveTo(cx+20,32,cx+10,50,cx,50);
  ctx.bezierCurveTo(cx,50,cx-10,50,cx-20,32);
  ctx.bezierCurveTo(cx-60,35,cx-90,60,cx-90,60);
  ctx.closePath();
  ctx.fillStyle=C; ctx.fill();
  const sh=ctx.createLinearGradient(0,0,W,0);
  sh.addColorStop(0,'rgba(0,0,0,0.15)'); sh.addColorStop(0.5,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,0.15)');
  ctx.fillStyle=sh; ctx.fill();
}

// ── TANK TOP ──
function drawTankTop(ctx,W,H,C,isLight) {
  const cx=W/2;
  ctx.beginPath();
  ctx.moveTo(cx-50,35); ctx.bezierCurveTo(cx-50,35,cx-30,55,cx,55);
  ctx.bezierCurveTo(cx,55,cx+30,55,cx+50,35);
  ctx.bezierCurveTo(cx+55,28,cx+70,25,cx+85,28);
  ctx.lineTo(cx+85,H-50); ctx.lineTo(cx-85,H-50);
  ctx.lineTo(cx-85,28); ctx.bezierCurveTo(cx-70,25,cx-55,28,cx-50,35);
  ctx.closePath();
  ctx.fillStyle=C; ctx.fill();
  const sh=ctx.createLinearGradient(0,0,W,0);
  sh.addColorStop(0,'rgba(0,0,0,0.14)'); sh.addColorStop(0.5,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,0.14)');
  ctx.fillStyle=sh; ctx.fill();
  // Arm holes
  ctx.beginPath();
  ctx.ellipse(cx-85,100,14,36,0.2,0,Math.PI*2);
  ctx.ellipse(cx+85,100,14,36,-0.2,0,Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fill();
}

// ── TOTE BAG ──
function drawToteBag(ctx,W,H,C,isLight) {
  const cx=W/2, bx=cx-90, by=75, bw=180, bh=260;
  // Handles
  ctx.beginPath();
  ctx.moveTo(cx-40,by); ctx.bezierCurveTo(cx-40,by,cx-55,20,cx-45,18);
  ctx.bezierCurveTo(cx-38,16,cx-32,20,cx-32,by);
  ctx.moveTo(cx+40,by); ctx.bezierCurveTo(cx+40,by,cx+55,20,cx+45,18);
  ctx.bezierCurveTo(cx+38,16,cx+32,20,cx+32,by);
  ctx.strokeStyle=shadedColor(C,-0.18); ctx.lineWidth=10;
  ctx.lineCap='round'; ctx.stroke(); ctx.lineCap='butt';

  // Bag body
  ctx.beginPath();
  ctx.roundRect(bx,by,bw,bh,10);
  ctx.fillStyle=C; ctx.fill();

  // Fabric shading
  const shL=ctx.createLinearGradient(bx,0,bx+50,0);
  shL.addColorStop(0,'rgba(0,0,0,0.16)'); shL.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=shL; ctx.fill();
  const shR=ctx.createLinearGradient(bx+bw-50,0,bx+bw,0);
  shR.addColorStop(0,'rgba(0,0,0,0)'); shR.addColorStop(1,'rgba(0,0,0,0.16)');
  ctx.fillStyle=shR; ctx.fill();

  // Highlight
  const hl=ctx.createRadialGradient(cx,by+60,10,cx,by+60,120);
  hl.addColorStop(0,'rgba(255,255,255,0.22)'); hl.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=hl;
  ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,10); ctx.fill();

  // Stitch lines
  ctx.strokeStyle=isLight?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.07)';
  ctx.lineWidth=1; ctx.setLineDash([4,4]);
  ctx.strokeRect(bx+8,by+8,bw-16,bh-16);
  ctx.setLineDash([]);

  // Outline
  ctx.strokeStyle=isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.08)';
  ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,10); ctx.stroke();
}

// ── MUG ──
function drawMug(ctx,W,H,C,isLight,pid) {
  const cx=W/2, mx=cx-90, my=80, mw=170, mh=230, r=12;
  const isTumbler = pid==='travel_mug';

  if(isTumbler) {
    // Tumbler shape — tapered
    ctx.beginPath();
    ctx.moveTo(cx-70,70); ctx.lineTo(cx+70,70);
    ctx.lineTo(cx+60,H-60); ctx.lineTo(cx-60,H-60);
    ctx.closePath();
    ctx.fillStyle=C; ctx.fill();
    // Lid
    ctx.beginPath();
    ctx.roundRect(cx-72,58,144,22,5);
    ctx.fillStyle=shadedColor(C,-0.15); ctx.fill();
    // Bottom
    ctx.beginPath();
    ctx.roundRect(cx-62,H-62,124,14,5);
    ctx.fillStyle=shadedColor(C,-0.15); ctx.fill();
  } else {
    // Classic mug
    ctx.beginPath();
    ctx.roundRect(mx,my,mw,mh,r);
    ctx.fillStyle=C; ctx.fill();

    // Handle
    ctx.beginPath();
    ctx.arc(mx+mw+12, my+mh*0.38, 38, Math.PI*0.25, Math.PI*1.05);
    ctx.lineWidth=18; ctx.strokeStyle=shadedColor(C,-0.12);
    ctx.stroke();
    ctx.lineWidth=8; ctx.strokeStyle=C; ctx.stroke();
  }

  // Cylinder shading — left dark, right dark, center light
  const shCyl=ctx.createLinearGradient(mx,0,mx+mw,0);
  shCyl.addColorStop(0,'rgba(0,0,0,0.22)');
  shCyl.addColorStop(0.2,'rgba(0,0,0,0)');
  shCyl.addColorStop(0.7,'rgba(0,0,0,0)');
  shCyl.addColorStop(1,'rgba(0,0,0,0.25)');
  if(!isTumbler) { ctx.beginPath(); ctx.roundRect(mx,my,mw,mh,r); ctx.fillStyle=shCyl; ctx.fill(); }

  // Top rim sheen
  const rimGrad=ctx.createLinearGradient(0,my,0,my+20);
  rimGrad.addColorStop(0,'rgba(255,255,255,0.4)');
  rimGrad.addColorStop(1,'rgba(255,255,255,0)');
  if(!isTumbler) { ctx.beginPath(); ctx.roundRect(mx,my,mw,20,r); ctx.fillStyle=rimGrad; ctx.fill(); }

  // Highlight stripe — vertical left-of-center
  const hlStripe=ctx.createLinearGradient(mx+30,0,mx+70,0);
  hlStripe.addColorStop(0,'rgba(255,255,255,0)');
  hlStripe.addColorStop(0.5,'rgba(255,255,255,0.18)');
  hlStripe.addColorStop(1,'rgba(255,255,255,0)');
  if(!isTumbler) { ctx.beginPath(); ctx.roundRect(mx,my,mw,mh,r); ctx.fillStyle=hlStripe; ctx.fill(); }

  // Outline
  ctx.strokeStyle=isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.08)';
  ctx.lineWidth=1.5;
  if(!isTumbler) { ctx.beginPath(); ctx.roundRect(mx,my,mw,mh,r); ctx.stroke(); }
}

// ── SNAPBACK / DAD HAT ──
function drawHat(ctx,W,H,C,isLight,pid) {
  const cx=W/2, isDad=pid==='dadhut';
  // Crown panels
  ctx.beginPath();
  ctx.moveTo(cx-120, 200); ctx.bezierCurveTo(cx-110,80,cx-50,50,cx,50);
  ctx.bezierCurveTo(cx+50,50,cx+110,80,cx+120,200);
  ctx.bezierCurveTo(cx+80,220,cx+30,230,cx,230);
  ctx.bezierCurveTo(cx-30,230,cx-80,220,cx-120,200);
  ctx.closePath();
  ctx.fillStyle=C; ctx.fill();

  // Crown shading
  const shC=ctx.createRadialGradient(cx,80,20,cx,150,160);
  shC.addColorStop(0,'rgba(255,255,255,0.18)'); shC.addColorStop(1,'rgba(0,0,0,0.14)');
  ctx.fillStyle=shC; ctx.fill();

  // Sweatband
  ctx.beginPath();
  ctx.ellipse(cx,225,122,14,0,0,Math.PI);
  ctx.fillStyle=shadedColor(C,-0.12); ctx.fill();

  // Brim
  ctx.beginPath();
  if(isDad) {
    ctx.ellipse(cx, 240, 130, 26, 0, 0, Math.PI);
    ctx.bezierCurveTo(cx-130,240,cx-100,270,cx,272);
    ctx.bezierCurveTo(cx+100,270,cx+130,240,cx+130,240);
  } else {
    ctx.moveTo(cx-130,228);
    ctx.bezierCurveTo(cx-130,228,cx-110,268,cx,268);
    ctx.bezierCurveTo(cx+110,268,cx+130,228,cx+130,228);
    ctx.lineTo(cx+120,220); ctx.lineTo(cx-120,220); ctx.closePath();
  }
  ctx.fillStyle=shadedColor(C,-0.06); ctx.fill();
  ctx.strokeStyle=isLight?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.07)';
  ctx.lineWidth=1; ctx.stroke();

  // Center seam
  ctx.beginPath();
  ctx.moveTo(cx,55); ctx.lineTo(cx,220);
  ctx.strokeStyle=isLight?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.06)';
  ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);

  // Button top
  ctx.beginPath(); ctx.arc(cx,52,7,0,Math.PI*2);
  ctx.fillStyle=shadedColor(C,-0.15); ctx.fill();
}

// ── BEANIE ──
function drawBeanie(ctx,W,H,C,isLight) {
  const cx=W/2;
  ctx.beginPath();
  ctx.moveTo(cx-110,240);
  ctx.bezierCurveTo(cx-115,150,cx-80,80,cx,70);
  ctx.bezierCurveTo(cx+80,80,cx+115,150,cx+110,240);
  ctx.closePath();
  ctx.fillStyle=C; ctx.fill();
  // Ribbed cuff
  ctx.beginPath();
  ctx.roundRect(cx-110,220,220,45,5);
  ctx.fillStyle=shadedColor(C,-0.1); ctx.fill();
  // Rib lines
  for(let i=0;i<8;i++){
    ctx.beginPath();
    ctx.moveTo(cx-105+(i*28),220);ctx.lineTo(cx-105+(i*28),265);
    ctx.strokeStyle=isLight?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.07)';
    ctx.lineWidth=2; ctx.stroke();
  }
  // Pom pom
  ctx.beginPath(); ctx.arc(cx,72,18,0,Math.PI*2);
  ctx.fillStyle=shadedColor(C,0.1); ctx.fill();
  ctx.beginPath(); ctx.arc(cx,72,18,0,Math.PI*2);
  const pomHL=ctx.createRadialGradient(cx-5,67,2,cx,72,18);
  pomHL.addColorStop(0,'rgba(255,255,255,0.35)'); pomHL.addColorStop(1,'rgba(0,0,0,0.1)');
  ctx.fillStyle=pomHL; ctx.fill();
  // Body shading
  const sh=ctx.createLinearGradient(cx-110,0,cx+110,0);
  sh.addColorStop(0,'rgba(0,0,0,0.14)'); sh.addColorStop(0.4,'rgba(0,0,0,0)');
  sh.addColorStop(0.6,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,0.14)');
  ctx.beginPath();
  ctx.moveTo(cx-110,240);
  ctx.bezierCurveTo(cx-115,150,cx-80,80,cx,70);
  ctx.bezierCurveTo(cx+80,80,cx+115,150,cx+110,240);
  ctx.closePath();
  ctx.fillStyle=sh; ctx.fill();
}

// ── PHONE CASE ──
function drawPhoneCase(ctx,W,H,C,isLight) {
  const cx=W/2, px=cx-65, py=40, pw=130, ph=H-80, r=18;
  // Case body
  ctx.beginPath(); ctx.roundRect(px,py,pw,ph,r);
  ctx.fillStyle=C; ctx.fill();
  // Screen cutout
  const sx=px+6,sy=py+6,sw=pw-12,sh=ph-12,sr=12;
  ctx.beginPath(); ctx.roundRect(sx,sy,sw,sh,sr);
  ctx.fillStyle='#0f172a'; ctx.fill();
  // Screen sheen
  const scr=ctx.createLinearGradient(sx,sy,sx+sw,sy+sh);
  scr.addColorStop(0,'rgba(255,255,255,0.08)'); scr.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=scr; ctx.fill();
  // Camera notch
  ctx.beginPath(); ctx.roundRect(cx-20,py+14,40,8,4);
  ctx.fillStyle='#1e293b'; ctx.fill();
  // Side buttons
  ctx.beginPath(); ctx.roundRect(px-4,py+80,5,35,3);
  ctx.fillStyle=shadedColor(C,-0.15); ctx.fill();
  ctx.beginPath(); ctx.roundRect(px+pw-1,py+70,5,25,3);
  ctx.fillStyle=shadedColor(C,-0.15); ctx.fill();
  // Case edge shading
  const shE=ctx.createLinearGradient(px,0,px+pw,0);
  shE.addColorStop(0,'rgba(0,0,0,0.2)'); shE.addColorStop(0.1,'rgba(0,0,0,0)');
  shE.addColorStop(0.9,'rgba(0,0,0,0)'); shE.addColorStop(1,'rgba(0,0,0,0.2)');
  ctx.beginPath(); ctx.roundRect(px,py,pw,ph,r); ctx.fillStyle=shE; ctx.fill();
}

// ── PILLOW ──
function drawPillow(ctx,W,H,C,isLight) {
  const cx=W/2, px=cx-145,py=80,pw=290,ph=260;
  // Pillow with bulge
  ctx.beginPath();
  ctx.moveTo(px+20,py);
  ctx.bezierCurveTo(cx,py-18,cx,py-18,px+pw-20,py);
  ctx.bezierCurveTo(px+pw+10,py+40,px+pw+10,py+ph-40,px+pw-20,py+ph);
  ctx.bezierCurveTo(cx,py+ph+18,cx,py+ph+18,px+20,py+ph);
  ctx.bezierCurveTo(px-10,py+ph-40,px-10,py+40,px+20,py);
  ctx.closePath();
  ctx.fillStyle=C; ctx.fill();
  // Shading
  const sh=ctx.createRadialGradient(cx,py+ph/2,40,cx,py+ph/2,180);
  sh.addColorStop(0,'rgba(255,255,255,0.15)'); sh.addColorStop(1,'rgba(0,0,0,0.12)');
  ctx.fillStyle=sh; ctx.fill();
  // Seam border
  ctx.strokeStyle=isLight?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.08)';
  ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
  ctx.beginPath();
  ctx.moveTo(px+36,py+16);
  ctx.bezierCurveTo(cx,py+2,cx,py+2,px+pw-36,py+16);
  ctx.bezierCurveTo(px+pw-6,py+50,px+pw-6,py+ph-50,px+pw-36,py+ph-16);
  ctx.bezierCurveTo(cx,py+ph-2,cx,py+ph-2,px+36,py+ph-16);
  ctx.bezierCurveTo(px+6,py+ph-50,px+6,py+50,px+36,py+16);
  ctx.stroke(); ctx.setLineDash([]);
}

// ── POSTER ──
function drawPoster(ctx,W,H,C,isLight) {
  const cx=W/2, px=cx-100,py=30,pw=200,ph=H-60;
  // Paper
  ctx.beginPath(); ctx.roundRect(px,py,pw,ph,4);
  ctx.fillStyle='#f9f8f5'; ctx.fill();
  // Print area (C = background color)
  ctx.beginPath(); ctx.roundRect(px+10,py+10,pw-20,ph-20,2);
  ctx.fillStyle=C; ctx.fill();
  // Edge shadow
  ctx.beginPath(); ctx.roundRect(px,py,pw,ph,4);
  const sh=ctx.createLinearGradient(px,0,px+pw,0);
  sh.addColorStop(0,'rgba(0,0,0,0.1)'); sh.addColorStop(0.1,'rgba(0,0,0,0)');
  sh.addColorStop(0.9,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,0.15)');
  ctx.fillStyle=sh; ctx.fill();
  // White paper border
  ctx.strokeStyle='rgba(0,0,0,0.08)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.roundRect(px,py,pw,ph,4); ctx.stroke();
}

// ── SOCKS ──
function drawSocks(ctx,W,H,C,isLight) {
  // Two socks side by side
  [cx-70, cx+15].forEach((sx,si)=>{
    const off = si===1 ? 20 : 0;
    ctx.beginPath();
    // Leg tube
    ctx.roundRect(sx,50+off,52,180,8);
    ctx.fillStyle=C; ctx.fill();
    // Foot
    ctx.beginPath();
    ctx.moveTo(sx,210+off); ctx.lineTo(sx+52,210+off);
    ctx.bezierCurveTo(sx+52,210+off,sx+70,215+off,sx+68,235+off);
    ctx.bezierCurveTo(sx+68,255+off,sx+50,265+off,sx+30,265+off);
    ctx.lineTo(sx,265+off); ctx.closePath();
    ctx.fillStyle=C; ctx.fill();
    // Cuff
    ctx.beginPath(); ctx.roundRect(sx,48+off,52,30,8);
    ctx.fillStyle=shadedColor(C,-0.1); ctx.fill();
    // Toe
    ctx.beginPath();
    ctx.moveTo(sx+30,265+off); ctx.bezierCurveTo(sx+55,265+off,sx+70,252+off,sx+68,238+off);
    ctx.bezierCurveTo(sx+66,228+off,sx+58,222+off,sx+52,218+off);
    ctx.fillStyle=shadedColor(C,-0.08); ctx.fill();
    // Shading
    const sh=ctx.createLinearGradient(sx,0,sx+52,0);
    sh.addColorStop(0,'rgba(0,0,0,0.14)'); sh.addColorStop(0.4,'rgba(0,0,0,0)');
    sh.addColorStop(0.6,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,0.14)');
    ctx.fillStyle=sh;
    ctx.beginPath(); ctx.roundRect(sx,50+off,52,180,8); ctx.fill();
  });
  const cx=W/2;
}

// ── NOTEBOOK ──
function drawNotebook(ctx,W,H,C,isLight) {
  const cx=W/2;
  // Slight 3/4 perspective
  // Back cover
  ctx.beginPath(); ctx.roundRect(cx-88,40,8,H-80,4);
  ctx.fillStyle=shadedColor(C,-0.3); ctx.fill();
  // Pages stack
  ctx.beginPath(); ctx.roundRect(cx-80,38,180,H-76,3);
  ctx.fillStyle='#f9f8f5'; ctx.fill();
  // Front cover
  ctx.beginPath(); ctx.roundRect(cx-80,42,175,H-84,4);
  ctx.fillStyle=C; ctx.fill();
  // Cover shading
  const sh=ctx.createLinearGradient(cx-80,0,cx-80+175,0);
  sh.addColorStop(0,'rgba(0,0,0,0.18)'); sh.addColorStop(0.2,'rgba(0,0,0,0)');
  sh.addColorStop(0.85,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,0.22)');
  ctx.fillStyle=sh; ctx.fill();
  // Spine line
  ctx.beginPath(); ctx.moveTo(cx-80,42); ctx.lineTo(cx-80,H-42);
  ctx.strokeStyle=shadedColor(C,-0.2); ctx.lineWidth=3; ctx.stroke();
  // Rings
  for(let i=0;i<5;i++){
    const ry=90+i*60;
    ctx.beginPath(); ctx.ellipse(cx-82,ry,6,10,0,0,Math.PI*2);
    ctx.fillStyle='#9ca3af'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx-82,ry,4,8,0,0,Math.PI*2);
    ctx.fillStyle='#d1d5db'; ctx.fill();
  }
  // Highlight
  const hl=ctx.createLinearGradient(cx-80,42,cx-40,42+100);
  hl.addColorStop(0,'rgba(255,255,255,0.2)'); hl.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=hl;
  ctx.beginPath(); ctx.roundRect(cx-80,42,175,H-84,4); ctx.fill();
}

// ── PRINT ZONES ── (where to composite the design text)
function getPrintZone(pid, W, H, placement) {
  const cx=W/2;
  if(pid==='tee'||pid==='longsleeve'||pid==='raglan'||pid==='croptee'||pid==='tanktop') {
    if(placement==='front') return {x:cx-65,y:120,w:130,h:120};
    if(placement==='back')  return {x:cx-65,y:110,w:130,h:140};
    if(placement==='left-chest') return {x:cx-60,y:110,w:70,h:60};
  }
  if(pid==='hoodie') return {x:cx-60,y:120,w:120,h:100};
  if(pid==='tote_bag') return {x:cx-60,y:120,w:120,h:120};
  if(pid==='mug') return {x:cx-58,y:130,w:116,h:120};
  if(pid==='travel_mug') return {x:cx-50,y:105,w:100,h:140};
  if(pid==='snapback'||pid==='dadhut'||pid==='trucker_hat') return {x:cx-50,y:110,w:100,h:80};
  if(pid==='beanie') return {x:cx-55,y:110,w:110,h:80};
  if(pid==='phone_case') return {x:cx-46,y:70,w:92,h:200};
  if(pid==='pillow') return {x:cx-90,y:110,w:180,h:180};
  if(pid==='poster'||pid==='canvas_print') return {x:cx-80,y:55,w:160,h:H-110};
  if(pid==='socks') return {x:cx-88,y:60,w:80,h:130};
  if(pid==='notebook') return {x:cx-60,y:80,w:130,h:H-150};
  return {x:cx-60,y:110,w:120,h:130};
}

// ── DESIGN TEXT COMPOSITOR ──
function drawDesignOnCanvas(ctx, design, zone, scaleVal, productColor, isLightProduct) {
  const lines = design.text.split('\n');
  const scaleF = scaleVal/70;

  // Parse font size from CSS string (e.g. "1.8rem" -> px)
  const remPx = parseFloat(design.fs||'1.5rem') * 16 * scaleF;
  const fontSize = Math.max(10, Math.min(remPx, zone.h*0.38));

  // Font family — strip CSS quotes
  const fontName = (design.font||"'Anton',sans-serif")
    .replace(/^['"]|['"]$/g,'').split(',')[0].trim();

  ctx.save();
  ctx.font = `900 ${fontSize}px "${fontName}"`;
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.letterSpacing = '0.02em';

  // Optional slight blend with product surface
  ctx.globalCompositeOperation='source-atop';

  const lineH = fontSize * 1.25;
  const totalH = lines.length * lineH;
  const startY = zone.y + zone.h/2 - totalH/2 + lineH/2;
  const cx = zone.x + zone.w/2;

  // Slight shadow for depth on light products
  if(isLightProduct) {
    ctx.shadowColor='rgba(0,0,0,0.08)'; ctx.shadowBlur=4; ctx.shadowOffsetY=2;
  }

  ctx.fillStyle=design.tc||'#ffffff';
  lines.forEach((line,i) => {
    ctx.fillText(line, cx, startY+i*lineH, zone.w);
  });

  ctx.restore();
}

  const p = typeof CATALOG!=='undefined' ? CATALOG[MOCKUP_STATE.productId] : null;
  if(!p) return;
  const colors = p.mockupColors||[{name:'White',hex:'#ffffff'}];
  const color = colors[MOCKUP_STATE.colorIdx] || colors[0];
  const src = typeof DESIGNS!=='undefined' ? DESIGNS : [];
  const design = MOCKUP_STATE.designId ? src.find(d=>d.id===MOCKUP_STATE.designId) : null;

  // Build SVG product display
  const display = document.getElementById('mockup-product-display');
  if(display) {
    const scale = MOCKUP_STATE.scale;
    const designLayer = design ? `
      <div class="mockup-design-layer" style="font-family:${design.font};font-size:calc(${design.fs}*${scale/70});color:${design.tc};white-space:pre-wrap;text-align:center;line-height:1.2">
        ${design.text.replace(/\\n/g,'<br>')}
      </div>` : `<div class="mockup-design-layer" style="color:rgba(0,0,0,.15);font-size:1rem;text-align:center">Your design here</div>`;

    display.innerHTML = `
      <svg viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <path d="M60 60 L0 100 L30 130 L60 110 L60 280 L240 280 L240 110 L270 130 L300 100 L240 60 L210 40 C210 40 200 70 150 70 C100 70 90 40 90 40 Z" fill="${color.hex}" stroke="#d1d5db" stroke-width="1.5"/>
        <path d="M90 40 C100 70 200 70 210 40 C200 20 190 10 150 10 C110 10 100 20 90 40Z" fill="#e5e7eb" stroke="#d1d5db" stroke-width="1"/>
      </svg>
      ${designLayer}`;
  }

  // Color name
  const cn = document.getElementById('moc-color-name');
  if(cn) cn.textContent = color.name;

  // Color strip
  const strip = document.getElementById('mockup-color-strip');
  if(strip) {
    strip.innerHTML = colors.map((c,i)=>`
      <div class="mcs-dot ${i===MOCKUP_STATE.colorIdx?'active':''}"
        style="background:${c.hex};${c.hex==='#ffffff'?'border:1.5px solid #ddd':''}"
        onclick="setMockupColor(${i})" title="${c.name}">
      </div>`).join('');
  }

  // Product tabs (apparel only for now)
  const tabs = document.getElementById('mockup-product-tabs');
  if(tabs && typeof CATALOG!=='undefined') {
    const apparel = ['tee','hoodie','longsleeve','tote_bag','mug'];
    tabs.innerHTML = apparel.filter(id=>CATALOG[id]).map(id=>`
      <button class="mpt-btn ${MOCKUP_STATE.productId===id?'active':''}" onclick="setMockupProduct('${id}')">
        ${CATALOG[id].label}
      </button>`).join('');
  }

function setMockupColor(idx) { MOCKUP_STATE.colorIdx=idx; renderMockup(); }
function mockupPrev() {
  const p=typeof CATALOG!=='undefined'?CATALOG[MOCKUP_STATE.productId]:null;
  const len=p?.mockupColors?.length||1;
  MOCKUP_STATE.colorIdx=(MOCKUP_STATE.colorIdx-1+len)%len; renderMockup();
}
function mockupNext() {
  const p=typeof CATALOG!=='undefined'?CATALOG[MOCKUP_STATE.productId]:null;
  const len=p?.mockupColors?.length||1;
  MOCKUP_STATE.colorIdx=(MOCKUP_STATE.colorIdx+1)%len; renderMockup();
}
function setMockupProduct(id) { MOCKUP_STATE.productId=id; MOCKUP_STATE.colorIdx=0; renderMockup(); }
function setPlacement(p,btn) {
  MOCKUP_STATE.placement=p;
  document.querySelectorAll('.pl-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
}
function updateMockupScale(v) {
  MOCKUP_STATE.scale=parseInt(v);
  const el=document.getElementById('mockup-scale-val');
  if(el) el.textContent=v+'%';
  renderMockup();
}
function orderFromMockup() {
  const pid=MOCKUP_STATE.productId;
  const did=MOCKUP_STATE.designId;
  closeMockupModal();
  if(did) customizeDesign(did);
  selectProductFromSelector(pid);
}
function downloadMockup() {
  // Canvas-based download using html2canvas would go here
  // For now, open the mockup in a printable view
  toast('Mockup download — integrate html2canvas for full export','info');
}
function shareMockupDesign() {
  if(MOCKUP_STATE.designId) openShare(MOCKUP_STATE.designId);
  else toast('Add a design first','info');
}

// ══════════════════════════════════════════════
// GIFT CARDS
// ══════════════════════════════════════════════
let _gcAmount = 25;

function openGiftCard() { openModal_('giftCardOverlay','giftCardModal'); }
function closeGiftCard() { closeModal_('giftCardOverlay','giftCardModal'); }

function selectGCAmount(amt, btn) {
  _gcAmount = amt;
  document.querySelectorAll('.gc-amt').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const preview = document.getElementById('gcp-amount');
  if(preview) preview.textContent = '$'+amt;
}

async function purchaseGiftCard() {
  const to = document.getElementById('gc-to-email')?.value.trim();
  const name = document.getElementById('gc-to-name')?.value.trim();
  if(!to||!name) { showGCStatus('error','Please fill in recipient email and name.'); return; }
  const code = 'PD-'+Math.random().toString(36).substr(2,4).toUpperCase()+'-'+Math.random().toString(36).substr(2,4).toUpperCase()+'-'+Math.random().toString(36).substr(2,4).toUpperCase();
  const gc = { code, amount:_gcAmount, to, toName:name,
    from:document.getElementById('gc-from-name')?.value.trim(),
    message:document.getElementById('gc-message')?.value.trim(),
    purchasedAt:Date.now(), used:false };
  const gcs = JSON.parse(localStorage.getItem('pd_giftcards')||'[]');
  gcs.unshift(gc);
  localStorage.setItem('pd_giftcards',JSON.stringify(gcs));
  showGCStatus('success', `Gift card ${code} created! In production, an email would be sent to ${to}.`);
  toast('Gift card created!','ok');
}
function showGCStatus(type,msg) {
  const el=document.getElementById('gc-status');
  if(!el) return;
  el.className='order-status '+type; el.textContent=msg; el.style.display='block';
}

// ══════════════════════════════════════════════
// SHARE DESIGN
// ══════════════════════════════════════════════
let _shareDesignId = null;

function openShare(designId, e) {
  if(e) e.stopPropagation();
  _shareDesignId = designId;
  const src = typeof DESIGNS!=='undefined' ? DESIGNS : [];
  const d = src.find(x=>x.id===designId);
  const baseUrl = window.location.origin + window.location.pathname;
  const url = `${baseUrl}?design=${designId}`;
  const urlInput = document.getElementById('share-url');
  if(urlInput) urlInput.value = url;
  const preview = document.getElementById('share-preview-card');
  if(preview && d) {
    preview.innerHTML = `<div class="sp-thumb" style="background:${d.bg};font-family:${d.font};color:${d.tc};font-size:.55rem;font-weight:800;white-space:pre-wrap;line-height:1.1">${d.text}</div>
      <div class="sp-info"><div class="sp-name">${d.name}</div><div class="sp-price">$29.99 · ${capitalize(d.cat||d.category||'')}</div></div>`;
  }
  const copied = document.getElementById('share-copied');
  if(copied) copied.style.display='none';
  openModal_('shareOverlay','shareModal');
}
function closeShare() { closeModal_('shareOverlay','shareModal'); }
function copyShareLink() {
  const url = document.getElementById('share-url')?.value;
  if(!url) return;
  navigator.clipboard.writeText(url).then(()=>{
    const el=document.getElementById('share-copied');
    if(el) el.style.display='block';
    setTimeout(()=>{ if(el) el.style.display='none'; },2500);
  }).catch(()=>toast('Copy failed — select and copy manually','err'));
}
function shareToTwitter() {
  const src=typeof DESIGNS!=='undefined'?DESIGNS:[];
  const d=src.find(x=>x.id===_shareDesignId);
  const url=document.getElementById('share-url')?.value||'';
  const text=`Check out "${d?.name||'this design'}" on PrintDrop! ${url}`;
  window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text),'_blank');
}
function shareToWhatsapp() {
  const url=document.getElementById('share-url')?.value||'';
  window.open('https://wa.me/?text='+encodeURIComponent('Check this out: '+url),'_blank');
}

// Handle shared design on load
function checkSharedDesign() {
  const params = new URLSearchParams(window.location.search);
  const did = params.get('design');
  if(!did) return;
  const src=typeof DESIGNS!=='undefined'?DESIGNS:[];
  const d=src.find(x=>x.id===did);
  if(d) {
    setTimeout(()=>{
      toast(`Viewing shared design: ${d.name}`,'info');
      loadDesignToCanvas(d);
      scrollTo_('studio');
    },800);
  }
}

// ══════════════════════════════════════════════
// SIZE GUIDE
// ══════════════════════════════════════════════
const SIZE_DATA = {
  tee: {
    cols:['Size','Chest (in)','Length (in)','Shoulder (in)'],
    rows:[
      ['XS','32–34','27','15.5'],['S','35–37','28','16.5'],
      ['M','38–40','29','17.5'],['L','41–43','30','18.5'],
      ['XL','44–46','31','19.5'],['2XL','47–49','32','20.5'],
      ['3XL','50–52','33','21.5'],['4XL','53–55','34','22.5'],
    ]
  },
  hoodie: {
    cols:['Size','Chest (in)','Length (in)','Sleeve (in)'],
    rows:[
      ['XS','34–36','25','33'],['S','37–39','26','34'],
      ['M','40–42','27','35'],['L','43–45','28','36'],
      ['XL','46–48','29','37'],['2XL','49–51','30','38'],
      ['3XL','52–54','31','39'],
    ]
  },
  longsleeve: {
    cols:['Size','Chest (in)','Length (in)','Sleeve (in)'],
    rows:[
      ['XS','32–34','27','32'],['S','35–37','28','33'],
      ['M','38–40','29','34'],['L','41–43','30','35'],
      ['XL','44–46','31','36'],['2XL','47–49','32','37'],
      ['3XL','50–52','33','38'],
    ]
  }
};

function openSizeGuide() {
  showSizeTable('tee', document.querySelector('.sg-tab'));
  openModal_('sizeGuideOverlay','sizeGuideModal');
}
function closeSizeGuide() { closeModal_('sizeGuideOverlay','sizeGuideModal'); }

function showSizeTable(type, btn) {
  document.querySelectorAll('.sg-tab').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const data = SIZE_DATA[type];
  if(!data) return;
  const wrap = document.getElementById('size-table-wrap');
  if(!wrap) return;
  const headerCells = data.cols.map(c=>`<th>${c}</th>`).join('');
  const bodyRows = data.rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('');
  wrap.innerHTML = `<div style="overflow-x:auto"><table class="sg-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
}

// ══════════════════════════════════════════════
// EMAIL CAPTURE
// ══════════════════════════════════════════════
function showEmailCapture() {
  if(localStorage.getItem('pd_email_captured')) return;
  if(DB.getUser()?.email) return;
  openModal_('emailCapOverlay','emailCapModal');
}
function closeEmailCap() {
  closeModal_('emailCapOverlay','emailCapModal');
  localStorage.setItem('pd_email_captured','dismissed');
}
function submitEmailCap() {
  const email = document.getElementById('ec-email')?.value.trim();
  if(!email||!email.includes('@')) { toast('Enter a valid email','err'); return; }
  localStorage.setItem('pd_email_captured', JSON.stringify({email,capturedAt:Date.now()}));
  localStorage.setItem('pd_discount_code', 'FIRST10');
  closeEmailCap();
  toast('10% off applied! Code: FIRST10','ok');
}

// ══════════════════════════════════════════════
// RUSH FULFILLMENT
// ══════════════════════════════════════════════
let _rushEnabled = false;
const RUSH_FEE = 7;

function showRushBanner() {
  const b=document.getElementById('rushBanner');
  if(b) b.style.display='block';
}
function closeRushBanner() {
  const b=document.getElementById('rushBanner');
  if(b) b.style.display='none';
}
function toggleRush(cb) {
  _rushEnabled = cb.checked;
  updatePrice();
  if(_rushEnabled) toast(`Rush fulfillment added (+$${RUSH_FEE})`,'ok');
}

// Patch updatePrice to include rush fee
const _origUpdatePrice = updatePrice;
window.updatePrice = function() {
  _origUpdatePrice();
  if(_rushEnabled) {
    // Add rush fee to display
    const tp=document.getElementById('total-price');
    if(tp) {
      const cur=parseFloat(tp.textContent.replace('$',''))||0;
      tp.textContent='$'+(cur+RUSH_FEE).toFixed(2);
    }
    const mob=document.getElementById('mob-total');
    if(mob) {
      const cur=parseFloat(mob.textContent.replace('$',''))||0;
      mob.textContent='$'+(cur+RUSH_FEE).toFixed(2);
    }
  }
};

// ══════════════════════════════════════════════
// BULK PRICING DISPLAY
// ══════════════════════════════════════════════
function getBulkTiers() {
  return [
    {min:1,  discount:0,    label:'1–4 units'},
    {min:5,  discount:0.05, label:'5–9 units — 5% off'},
    {min:10, discount:0.10, label:'10–24 units — 10% off'},
    {min:25, discount:0.15, label:'25–49 units — 15% off'},
    {min:50, discount:0.20, label:'50+ units — 20% off — contact for custom quote'},
  ];
}

// ══════════════════════════════════════════════
// MODAL HELPERS
// ══════════════════════════════════════════════
function openModal_(overlayId, modalId) {
  const o=document.getElementById(overlayId);
  const m=document.getElementById(modalId);
  if(o) { o.style.display='block'; }
  if(m) { m.style.display='flex'; m.style.flexDirection='column'; }
}
function closeModal_(overlayId, modalId) {
  const o=document.getElementById(overlayId);
  const m=document.getElementById(modalId);
  if(o) o.style.display='none';
  if(m) m.style.display='none';
}

// ══════════════════════════════════════════════
// TOAST (if not already defined)
// ══════════════════════════════════════════════
if(typeof toast==='undefined') {
  window.toast = function(msg,type='info') {
    let el=document.getElementById('toast');
    if(!el){ el=document.createElement('div'); el.id='toast'; document.body.appendChild(el); }
    el.textContent=msg; el.className=`toast ${type} show`;
    clearTimeout(window._toastTimer);
    window._toastTimer=setTimeout(()=>el.classList.remove('show'),3200);
  };
}

// ══════════════════════════════════════════════
// HEADER BUTTONS (add wishlist/gift/size links)
// ══════════════════════════════════════════════
function addHeaderFeatureButtons() {
  const nav = document.querySelector('.header-nav');
  if(!nav) return;
  if(document.getElementById('header-feature-btns')) return;
  const wrap = document.createElement('div');
  wrap.id='header-feature-btns';
  wrap.style.cssText='display:flex;align-items:center;gap:.25rem;margin-right:.25rem';
  wrap.innerHTML=`
    <button class="nav-link" onclick="openWishlist()" title="My Wishlist">♡ Saved</button>
    <button class="nav-link" onclick="openGiftCard()" title="Gift Cards">Gift Cards</button>
    <button class="nav-link" onclick="openSizeGuide()" title="Size Guide">Size Guide</button>
    <button class="nav-link" onclick="openProductSelector()" title="All 30+ Products">All Products</button>
  `;
  nav.insertBefore(wrap, nav.querySelector('.nav-cta'));
}

// ══════════════════════════════════════════════
// PATCH DOMContentLoaded
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', ()=>{
  // Update gallery with full DESIGNS from designs.js
  if(typeof DESIGNS !== 'undefined') {
    const badge=document.getElementById('ftab-all-count');
    if(badge) badge.textContent=DESIGNS.length;
    const pills=document.querySelectorAll('.pill');
    if(pills[0]) pills[0].textContent=`✦ ${DESIGNS.length}+ Designs`;
    renderGallery(DESIGNS);
  }

  // Add feature buttons to header
  addHeaderFeatureButtons();

  // Handle shared design URL
  checkSharedDesign();

  // Show email capture after 25 seconds (first visit only)
  if(!localStorage.getItem('pd_email_captured') && !DB.getUser()?.email) {
    setTimeout(showEmailCapture, 25000);
  }

  // Show bulk pricing hints in qty stepper
  const qtyDisplay = document.getElementById('qty-display');
  if(qtyDisplay) {
    const observer=new MutationObserver(()=>{
      const qty=parseInt(qtyDisplay.textContent)||1;
      const tiers=getBulkTiers();
      const next=tiers.find(t=>t.min>qty);
      const hint=document.getElementById('qty-hint');
      if(hint && next) {
        const save=next.min-qty;
        hint.innerHTML=`<span class="bulk-savings-badge">+${save} more → ${Math.round(next.discount*100)}% off</span>`;
      }
    });
    observer.observe(qtyDisplay,{childList:true,characterData:true,subtree:true});
  }

  // Size guide button in order panel (next to size selector)
  const szRow=document.querySelector('.sz-row');
  if(szRow && !szRow.querySelector('.size-guide-link')) {
    const link=document.createElement('button');
    link.className='size-guide-link';
    link.textContent='Size Guide';
    link.style.cssText='font-size:.65rem;color:var(--muted);background:none;border:none;cursor:pointer;text-decoration:underline;padding:.25rem 0;display:block;margin-top:.25rem';
    link.onclick=openSizeGuide;
    szRow.parentElement.appendChild(link);
  }
});

// Escape key closes all modals
document.addEventListener('keydown', e=>{
  if(e.key!=='Escape') return;
  ['wishlist','productSelector','mockup','giftCard','share','sizeGuide','emailCap']
    .forEach(k=>{
      closeModal_(k+'Overlay', k+'Modal');
    });
});

/* ═══════════════════════════════════════════════
   HERO CARDS — canvas-rendered product mockups
   Draws real product silhouettes into the 4 hero
   floating cards using the same canvas engine
═══════════════════════════════════════════════ */
function renderHeroCards() {
  const cards = [
    { id:'hero-canvas-tee',   pid:'tee',       color:{name:'Black',hex:'#111111'}, design:{text:'NO DAYS\nOFF',    font:"'Anton',sans-serif",    fs:'1.4rem',tc:'#ffffff',bg:'#111111'} },
    { id:'hero-canvas-mug',   pid:'mug',       color:{name:'White',hex:'#ffffff'}, design:{text:'Good\nVibes Only',font:"'Pacifico',cursive",     fs:'1rem',  tc:'#e85d04',bg:'#ffffff'} },
    { id:'hero-canvas-tote',  pid:'tote_bag',  color:{name:'Natural',hex:'#e8d5b7'}, design:{text:'BORN\nFREE',   font:"'Graduate',cursive",     fs:'1.2rem',tc:'#1d3461',bg:'#e8d5b7'} },
    { id:'hero-canvas-phone', pid:'phone_case',color:{name:'Dark',hex:'#0f172a'},   design:{text:'404:\nSLEEP NOT\nFOUND',font:"'Space Mono',monospace",fs:'.65rem',tc:'#22c55e',bg:'#0f172a'} },
  ];

  cards.forEach(card => {
    const canvas = document.getElementById(card.id);
    if(!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth  || 160;
    const H = canvas.offsetHeight || 180;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    // Background
    ctx.clearRect(0,0,W,H);
    const C = card.color.hex;
    const isLight = isLightColor(C);
    // Draw product
    ctx.shadowColor='rgba(0,0,0,0.25)'; ctx.shadowBlur=18; ctx.shadowOffsetY=8;
    drawProductMockup(ctx, W, H, card.pid, card.color, card.design, 'front', 65);
  });
}

/* ═══════════════════════════════════════════════
   DOWNLOAD MOCKUP — real canvas export
═══════════════════════════════════════════════ */
function downloadMockup() {
  const canvas = document.getElementById('mockup-canvas');
  if(!canvas) { toast('Generate a mockup first','err'); return; }

  // Draw onto a clean export canvas with white bg
  const exp = document.createElement('canvas');
  exp.width = 800; exp.height = 880;
  const ctx = exp.getContext('2d');

  // White background
  ctx.fillStyle = '#f9f8f5';
  ctx.fillRect(0,0,800,880);

  // Scale up from 400x440 to 800x880
  ctx.drawImage(canvas, 0, 0, 800, 880);

  // Watermark
  ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.textAlign = 'right';
  ctx.fillText('printdrop.com', 780, 860);

  // Download
  const link = document.createElement('a');
  const p = typeof CATALOG!=='undefined' ? CATALOG[MOCKUP_STATE.productId] : null;
  link.download = `printdrop-mockup-${MOCKUP_STATE.productId}-${Date.now()}.png`;
  link.href = exp.toDataURL('image/png', 0.95);
  link.click();
  toast('Mockup downloaded!', 'ok');
}

/* ═══════════════════════════════════════════════
   PRODUCTS SHOWCASE SECTION
   Dynamically renders product category grid
   below the gallery section
═══════════════════════════════════════════════ */
function renderProductsShowcase() {
  const wrap = document.getElementById('products-showcase-grid');
  if(!wrap || typeof CATALOG==='undefined') return;

  const featured = [
    {id:'tee',          emoji:'👕', highlight:'#ef4444'},
    {id:'hoodie',       emoji:'🧥', highlight:'#3b82f6'},
    {id:'mug',          emoji:'☕', highlight:'#f59e0b'},
    {id:'tote_bag',     emoji:'👜', highlight:'#22c55e'},
    {id:'phone_case',   emoji:'📱', highlight:'#8b5cf6'},
    {id:'snapback',     emoji:'🧢', highlight:'#f97316'},
    {id:'poster',       emoji:'🖼', highlight:'#06b6d4'},
    {id:'pillow',       emoji:'🛋', highlight:'#ec4899'},
    {id:'socks',        emoji:'🧦', highlight:'#84cc16'},
    {id:'notebook',     emoji:'📓', highlight:'#a78bfa'},
    {id:'tote_bag',     emoji:'🎒', highlight:'#fb923c'},
    {id:'sticker_sheet',emoji:'🏷', highlight:'#34d399'},
  ];

  wrap.innerHTML = featured.map(({id, emoji, highlight}) => {
    const p = CATALOG[id];
    if(!p) return '';
    const hasFulfill = p.fulfillment && p.fulfillment.length > 0;
    return `<div class="psc-card" onclick="filterByProductType('${id}')" style="--ph:${highlight}">
      <div class="psc-icon">${emoji}</div>
      <div class="psc-name">${p.label}</div>
      <div class="psc-price">from $${p.basePrice?.toFixed(2)}</div>
      <div class="psc-providers">${hasFulfill ? p.fulfillment.slice(0,2).join(' · ') : '⚠ Self-fulfill'}</div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════
   PATCH DOMContentLoaded — add new init calls
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Swap hero card SVGs with canvas renders
  replaceHeroCardsWithCanvas();

  // Render product showcase if section exists
  renderProductsShowcase();
});

function replaceHeroCardsWithCanvas() {
  // Replace each .hc-product div's SVG content with a canvas
  // Use fixed logical sizes — hero cards are ~155px wide by CSS
  const defs = [
    { sel:'.hc1', pid:'tee',        W:130, H:148, color:{name:'Black',hex:'#111111'},  design:{text:'NO DAYS\nOFF',     font:"'Anton',sans-serif",  fs:'1.4rem',tc:'#ffffff'} },
    { sel:'.hc2', pid:'mug',        W:130, H:148, color:{name:'White',hex:'#ffffff'},  design:{text:'Good\nVibes Only', font:"'Pacifico',cursive",   fs:'0.9rem',tc:'#e85d04'} },
    { sel:'.hc3', pid:'tote_bag',   W:130, H:148, color:{name:'Natural',hex:'#e8d5b7'},design:{text:'BORN\nFREE',       font:"'Graduate',cursive",   fs:'1.1rem',tc:'#1d3461'} },
    { sel:'.hc4', pid:'phone_case', W:130, H:148, color:{name:'Dark',hex:'#0f172a'},   design:{text:'404:\nSLEEP NOT\nFOUND',font:"'Space Mono',monospace",fs:'.55rem',tc:'#22c55e'} },
  ];

  defs.forEach(def => {
    const card = document.querySelector(def.sel);
    if(!card) return;
    const W = def.W, H = def.H;
    // Hide SVG, insert canvas
    const svgEl = card.querySelector('.hcp-svg');
    if(svgEl) svgEl.style.display = 'none';
    // Remove any existing canvas
    const existing = card.querySelector('canvas');
    if(existing) existing.remove();
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `width:${W}px;height:${H}px;display:block;margin:0 auto;border-radius:8px`;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    // Insert before hcp-sub
    const sub = card.querySelector('.hcp-sub');
    if(sub) card.insertBefore(canvas, sub);
    else card.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.shadowColor='rgba(0,0,0,0.28)'; ctx.shadowBlur=14; ctx.shadowOffsetY=6;
    drawProductMockup(ctx, W, H, def.pid, def.color, def.design, 'front', 60);
  });
}

// ══════════════════════════════════════
// COASTLINE CUSTOMS — POLICIES
// ══════════════════════════════════════
const POLICIES = {
  returns: `
    <h3>Return Policy</h3>
    <p>Because each item is custom-printed just for you, we cannot accept returns for buyer's remorse or incorrect size selection.</p>
    <p><strong>Damaged or Incorrect Items:</strong> If your order arrives damaged or with a printing error, please contact our support team with a photo of the item within 14 days of delivery. We will issue a replacement at no cost to you.</p>
  `,
  shipping: `
    <h3>Shipping Information</h3>
    <p>We use smart-routing to print your order at the facility closest to your delivery address. This reduces shipping time and carbon footprint.</p>
    <ul>
      <li><strong>USA:</strong> 3-5 business days</li>
      <li><strong>Europe:</strong> 4-7 business days</li>
      <li><strong>International:</strong> 10-20 business days</li>
    </ul>
    <p>Tracking info will be available in your profile as soon as your order ships.</p>
  `,
  privacy: `
    <h3>Privacy Policy</h3>
    <p>We respect your privacy. We only collect the data necessary to fulfill your order (Name, Email, Address).</p>
    <p>We never sell your data to third parties. Your payment information is processed securely through SSL-encrypted providers and is never stored on our servers.</p>
  `
};

function openPolicy(id) {
  const titleEl = document.getElementById('policy-title');
  const contentEl = document.getElementById('policy-content');
  if(!titleEl || !contentEl) return;

  const content = POLICIES[id];
  if(content) {
    titleEl.textContent = id.charAt(0).toUpperCase() + id.slice(1) + ' Policy';
    contentEl.innerHTML = content;
    openModal_('policyOverlay', 'policyModal');
  }
}

function closePolicyModal() {
  closeModal_('policyOverlay', 'policyModal');
}
