/* ═══════════════════════════════════════════════════════
   PRINTDROP ADMIN — admin.js
   Real-time order dashboard with:
   • Token-based authentication
   • 24h buffer countdown timers
   • Approve Now / Cancel / Refund actions
   • Bulk operations
   • Order detail modal with tracking input
   • Branding config editor
   • Auto-refresh every 30s
═══════════════════════════════════════════════════════ */

// ══ CONFIG ══
const API = '';          // base URL (empty = same origin)
let   TOKEN = '';        // set after auth
let   _allOrders  = [];
let   _filteredOrders = [];
let   _currentFilter = 'all';
let   _searchQuery   = '';
let   _sortKey  = 'created_at';
let   _sortDir  = -1;    // -1 = desc
let   _selected = new Set();
let   _refreshTimer = null;
let   _countdownTimer = null;
let   _confirmCallback = null;
let   _openModalOrderId = null;
let   _catalogData = null;
let   _currentCatalogProvider = 'printful';
let   _catalogSearch = '';

// ══ AUTH ══
function authenticate() {
  const input = document.getElementById('tokenInput');
  TOKEN = input.value.trim();
  if(!TOKEN) return;
  // Verify by hitting /api/admin/stats
  apiFetch('/api/admin/stats')
    .then(data => {
      document.getElementById('authGate').style.display = 'none';
      document.getElementById('dashboard').style.display = 'flex';
      sessionStorage.setItem('pd_admin_token', TOKEN);
      init();
    })
    .catch(() => {
      document.getElementById('authError').style.display = 'block';
      input.value = '';
      input.focus();
    });
}

function signOut() {
  sessionStorage.removeItem('pd_admin_token');
  TOKEN = '';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('authGate').style.display = 'flex';
  document.getElementById('tokenInput').value = '';
  clearInterval(_refreshTimer);
  clearInterval(_countdownTimer);
}

// Check for saved token on load
window.addEventListener('DOMContentLoaded', () => {
  const saved = sessionStorage.getItem('pd_admin_token');
  if(saved) { TOKEN = saved; document.getElementById('tokenInput').value = saved; authenticate(); }
  document.getElementById('tokenInput').addEventListener('keydown', e => { if(e.key==='Enter') authenticate(); });
});

// ══ API HELPER ══
function apiFetch(path, options={}) {
  return fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': TOKEN,
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  }).then(async r => {
    const data = await r.json();
    if(!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  });
}

// ══ INIT ══
function init() {
  loadStats();
  loadOrders();
  loadBranding();
  startAutoRefresh();
  startCountdownTimer();
}

function startAutoRefresh() {
  clearInterval(_refreshTimer);
  _refreshTimer = setInterval(() => { loadStats(); loadOrders(); }, 30000);
}

function refresh() {
  const btn = document.querySelector('.refresh-btn');
  btn.style.transform = 'rotate(360deg)';
  btn.style.transition = 'transform .5s';
  setTimeout(() => { btn.style.transform=''; btn.style.transition=''; }, 500);
  loadStats(); loadOrders();
}

// ══ STATS ══
function loadStats() {
  apiFetch('/api/admin/stats').then(data => {
    const byStatus = data.by_status || {};
    const queued   = byStatus.queued || 0;
    const ready    = data.ready_to_dispatch || 0;

    setText('stat-total',     data.total || 0);
    setText('stat-queued',    queued);
    setText('stat-ready',     ready);
    setText('stat-sent',      (byStatus.sent || 0) + (byStatus.fulfilling || 0));
    setText('stat-shipped',   byStatus.shipped || 0);
    setText('stat-cancelled', byStatus.cancelled || 0);
    setText('stat-revenue',   '$' + (data.revenue_usd || 0).toFixed(2));
    setText('nav-queued-badge', queued);
    setText('nav-ready-badge',  ready);
    setText('sidebarBuffer',   data.buffer_hours + ' hrs');
    setText('setting-buffer',  data.buffer_hours + ' hours');
    setText('topbarStore', '');
  }).catch(console.error);
}

// ══ ORDERS ══
function loadOrders() {
  // Build filter query
  const statusParam = (_currentFilter === 'all' || _currentFilter === 'ready')
    ? '' : `?status=${_currentFilter}`;

  apiFetch(`/api/admin/orders${statusParam}`)
    .then(data => {
      let orders = data.orders || [];
      // "Ready" filter: queued orders past their buffer window
      if(_currentFilter === 'ready') {
        orders = orders.filter(o => o.status === 'queued' && !o.within_buffer);
      }
      _allOrders = orders;
      applyFilters();
      updateReadyTable(orders.filter(o => o.status==='queued' && !o.within_buffer));
    }).catch(err => {
      console.error(err);
      toast('Failed to load orders: ' + err.message, 'err');
    });
}

function applyFilters() {
  let orders = [..._allOrders];
  if(_searchQuery) {
    const q = _searchQuery.toLowerCase();
    orders = orders.filter(o =>
      (o.id||'').toLowerCase().includes(q) ||
      (o.customer_name||'').toLowerCase().includes(q) ||
      (o.customer_email||'').toLowerCase().includes(q) ||
      (o.design_text||'').toLowerCase().includes(q)
    );
  }
  // Sort
  orders.sort((a,b) => {
    let av = a[_sortKey] ?? '', bv = b[_sortKey] ?? '';
    if(typeof av === 'string') av = av.toLowerCase();
    if(typeof bv === 'string') bv = bv.toLowerCase();
    return av < bv ? _sortDir : av > bv ? -_sortDir : 0;
  });
  _filteredOrders = orders;
  renderOrdersTable(orders);
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersBody');
  const empty = document.getElementById('ordersEmpty');
  if(!orders.length) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = orders.map(o => {
    const sel = _selected.has(o.id);
    const canApprove = o.status === 'queued';
    const canCancel  = !['delivered','refunded','cancelled'].includes(o.status);
    const canRefund  = ['sent','shipped','delivered','cancelled'].includes(o.status);
    const bufferCell = renderBufferCell(o);
    const provClass  = o.provider || 'printify';
    const date = formatDate(o.created_at);

    return `<tr class="${sel?'selected':''}" onclick="openModal('${o.id}',event)" data-id="${o.id}">
      <td class="th-check" onclick="event.stopPropagation()">
        <input type="checkbox" ${sel?'checked':''} onchange="toggleSelect('${o.id}',this)">
      </td>
      <td class="cell-id">${o.id}</td>
      <td class="cell-time">${date}</td>
      <td>
        <div class="cell-customer">
          <span class="cell-customer-name">${esc(o.customer_name||'—')}</span>
          <span class="cell-customer-email">${esc(o.customer_email||'')}</span>
        </div>
      </td>
      <td class="cell-design" title="${esc(o.design_text||'')}">
        ${esc((o.design_text||'Custom Design').slice(0,30))}</td>
      <td class="cell-product">${o.product||'tee'} · ${o.size||'M'} · ${o.color||'White'}</td>
      <td><span class="cell-provider ${provClass}">${providerIcon(o.provider)} ${o.provider||'auto'}</span></td>
      <td class="cell-total">${o.total_usd ? '$'+parseFloat(o.total_usd).toFixed(2) : '—'}</td>
      <td>${renderStatusBadge(o.status)}</td>
      <td class="buffer-cell">${bufferCell}</td>
      <td class="th-actions cell-actions" onclick="event.stopPropagation()">
        <button class="act-btn act-view" onclick="openModal('${o.id}',event)">View</button>
        ${canApprove ? `<button class="act-btn act-approve" onclick="confirmApprove('${o.id}',event)">⚡ Approve</button>` : ''}
        ${canCancel  ? `<button class="act-btn act-cancel" onclick="confirmCancel('${o.id}',event)">✕ Cancel</button>` : ''}
        ${canRefund  ? `<button class="act-btn act-refund" onclick="confirmRefund('${o.id}',event)">↩ Refund</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

function renderBufferCell(o) {
  if(o.status !== 'queued') return `<span class="bc-na">—</span>`;
  if(!o.within_buffer) return `<span class="bc-expired">READY ⚡</span>`;
  const hrs = Math.floor(o.seconds_remaining / 3600);
  const min = Math.floor((o.seconds_remaining % 3600) / 60);
  const sec = Math.floor(o.seconds_remaining % 60);
  return `<span class="bc-countdown" data-expires="${o.created_at + 86400}" data-seconds="${o.seconds_remaining}">
    ${pad(hrs)}:${pad(min)}:${pad(sec)}
  </span>`;
}

function startCountdownTimer() {
  clearInterval(_countdownTimer);
  _countdownTimer = setInterval(() => {
    document.querySelectorAll('.bc-countdown').forEach(el => {
      let secs = parseInt(el.dataset.seconds) - 1;
      if(secs < 0) { el.className='bc-expired'; el.textContent='READY ⚡'; return; }
      el.dataset.seconds = secs;
      const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), s = secs%60;
      el.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    });
  }, 1000);
}

function updateReadyTable(ready) {
  const tbody = document.getElementById('readyBody');
  if(!ready.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--muted)">No orders ready to dispatch.</td></tr>';
    return;
  }
  tbody.innerHTML = ready.map(o => {
    const overdueSecs = Math.abs(o.seconds_remaining);
    const overdueHrs  = (overdueSecs / 3600).toFixed(1);
    return `<tr onclick="openModal('${o.id}',event)">
      <td class="cell-id">${o.id}</td>
      <td><div class="cell-customer"><span class="cell-customer-name">${esc(o.customer_name||'—')}</span></div></td>
      <td class="cell-design">${esc((o.design_text||'Custom').slice(0,30))}</td>
      <td><span class="cell-provider ${o.provider}">${providerIcon(o.provider)} ${o.provider}</span></td>
      <td class="cell-total">${o.total_usd?'$'+parseFloat(o.total_usd).toFixed(2):'—'}</td>
      <td style="color:var(--accent);font-family:var(--font-mono);font-size:.75rem">${overdueHrs}h overdue</td>
      <td class="cell-actions" onclick="event.stopPropagation()">
        <button class="act-btn act-approve" onclick="confirmApprove('${o.id}',event)">⚡ Dispatch Now</button>
        <button class="act-btn act-cancel" onclick="confirmCancel('${o.id}',event)">✕ Cancel</button>
      </td>
    </tr>`;
  }).join('');
}

// ══ FILTERS & SORT ══
function setFilter(f, btn) {
  _currentFilter = f;
  _selected.clear();
  hideBulkBar();
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  loadOrders();
}

function searchOrders(q) {
  _searchQuery = q;
  applyFilters();
}

function sortBy(key) {
  if(_sortKey === key) _sortDir *= -1;
  else { _sortKey = key; _sortDir = -1; }
  applyFilters();
}

// ══ SELECTION ══
function toggleSelect(id, cb) {
  if(cb.checked) _selected.add(id);
  else _selected.delete(id);
  updateBulkBar();
}

function toggleSelectAll(cb) {
  _filteredOrders.forEach(o => {
    if(cb.checked) _selected.add(o.id);
    else _selected.delete(o.id);
  });
  renderOrdersTable(_filteredOrders);
  updateBulkBar();
}

function updateBulkBar() {
  const n = _selected.size;
  if(n > 0) {
    document.getElementById('bulkBar').style.display = 'flex';
    document.getElementById('bulkCount').textContent = `${n} selected`;
  } else {
    hideBulkBar();
  }
}

function hideBulkBar() { document.getElementById('bulkBar').style.display = 'none'; }
function clearSelection() { _selected.clear(); hideBulkBar(); renderOrdersTable(_filteredOrders); }

function bulkApprove() {
  if(!_selected.size) return;
  const ids = [..._selected];
  showConfirm({
    icon: '⚡',
    title: `Approve ${ids.length} orders?`,
    body: `These orders will be dispatched to the print provider immediately, skipping the 24-hour buffer.`,
    confirmLabel: 'Approve All',
    onConfirm: async () => {
      let ok = 0;
      for(const id of ids) {
        try { await apiFetch(`/api/admin/orders/${id}/approve`, {method:'POST', body:{admin_note:'Bulk approved'}}); ok++; }
        catch(e) { console.error(id, e); }
      }
      toast(`${ok}/${ids.length} orders approved`, 'ok');
      clearSelection(); loadStats(); loadOrders();
    }
  });
}

function bulkCancel() {
  if(!_selected.size) return;
  const ids = [..._selected];
  showConfirm({
    icon: '✕',
    title: `Cancel ${ids.length} orders?`,
    body: `These orders will be cancelled immediately. This cannot be undone.`,
    confirmLabel: 'Cancel All',
    danger: true,
    showReason: true,
    onConfirm: async (reason) => {
      let ok = 0;
      for(const id of ids) {
        try { await apiFetch(`/api/admin/orders/${id}/cancel`, {method:'POST', body:{reason:reason||'Bulk cancelled'}}); ok++; }
        catch(e) { console.error(id, e); }
      }
      toast(`${ok}/${ids.length} orders cancelled`, 'ok');
      clearSelection(); loadStats(); loadOrders();
    }
  });
}

function approveAllReady() {
  const ready = _allOrders.filter(o => o.status==='queued' && !o.within_buffer);
  if(!ready.length) { toast('No orders ready to dispatch', 'info'); return; }
  showConfirm({
    icon: '🚀',
    title: `Dispatch ${ready.length} ready orders?`,
    body: `All orders past the 24-hour buffer will be sent to their print providers now.`,
    confirmLabel: 'Dispatch All',
    onConfirm: async () => {
      let ok = 0;
      for(const o of ready) {
        try { await apiFetch(`/api/admin/orders/${o.id}/approve`, {method:'POST', body:{admin_note:'Batch dispatch'}}); ok++; }
        catch(e) { console.error(o.id, e); }
      }
      toast(`Dispatched ${ok} orders`, 'ok');
      loadStats(); loadOrders();
    }
  });
}

// ══ SINGLE ORDER ACTIONS ══
function confirmApprove(id, e) {
  if(e) e.stopPropagation();
  showConfirm({
    icon: '⚡',
    title: 'Approve & Dispatch Now?',
    body: `Order ${id} will be sent to the print provider immediately, skipping the remaining buffer time.`,
    confirmLabel: 'Approve Now',
    onConfirm: () => {
      apiFetch(`/api/admin/orders/${id}/approve`, {method:'POST', body:{admin_note:'Admin approved'}})
        .then(() => { toast('Order approved and dispatching!', 'ok'); loadStats(); loadOrders(); if(_openModalOrderId===id) refreshModal(id); })
        .catch(err => toast('Error: ' + err.message, 'err'));
    }
  });
}

function confirmCancel(id, e) {
  if(e) e.stopPropagation();
  showConfirm({
    icon: '🗑',
    title: 'Cancel Order?',
    body: `Order ${id} will be cancelled. If already sent to provider, you may need to cancel there separately.`,
    confirmLabel: 'Cancel Order',
    danger: true,
    showReason: true,
    onConfirm: (reason) => {
      apiFetch(`/api/admin/orders/${id}/cancel`, {method:'POST', body:{reason:reason||'Admin cancelled'}})
        .then(() => { toast('Order cancelled', 'ok'); loadStats(); loadOrders(); if(_openModalOrderId===id) refreshModal(id); })
        .catch(err => toast('Error: ' + err.message, 'err'));
    }
  });
}

function confirmRefund(id, e) {
  if(e) e.stopPropagation();
  showConfirm({
    icon: '↩',
    title: 'Mark as Refunded?',
    body: `This will mark order ${id} as refunded in the system. Process the actual refund in your payment processor.`,
    confirmLabel: 'Mark Refunded',
    showReason: true,
    onConfirm: (reason) => {
      apiFetch(`/api/admin/orders/${id}/refund`, {method:'POST', body:{reason:reason||'Admin refunded'}})
        .then(() => { toast('Marked as refunded', 'ok'); loadStats(); loadOrders(); if(_openModalOrderId===id) refreshModal(id); })
        .catch(err => toast('Error: ' + err.message, 'err'));
    }
  });
}

function saveTracking(id) {
  const num     = document.getElementById('tracking-num-input')?.value.trim();
  const carrier = document.getElementById('tracking-carrier-input')?.value.trim();
  if(!num) { toast('Enter a tracking number', 'err'); return; }
  apiFetch(`/api/admin/orders/${id}/tracking`, {method:'POST', body:{tracking_number:num, carrier}})
    .then(() => { toast('Tracking saved', 'ok'); refreshModal(id); loadOrders(); })
    .catch(err => toast('Error: ' + err.message, 'err'));
}

// ══ ORDER MODAL ══
function openModal(id, e) {
  if(e) e.stopPropagation();
  _openModalOrderId = id;
  const overlay = document.getElementById('modalOverlay');
  const modal   = document.getElementById('orderModal');
  overlay.style.display = 'block';
  modal.style.display   = 'flex';
  modal.style.flexDirection = 'column';
  refreshModal(id);
}

function refreshModal(id) {
  apiFetch(`/api/admin/orders/${id}`)
    .then(o => renderModal(o))
    .catch(err => { document.getElementById('om-body').innerHTML = `<p style="color:var(--err)">${err.message}</p>`; });
}

function renderModal(o) {
  document.getElementById('om-order-id').textContent = 'Order ' + o.id;
  document.getElementById('om-status-badge').innerHTML = renderStatusBadge(o.status);

  const bufferPct = o.within_buffer
    ? Math.round((1 - o.seconds_remaining / 86400) * 100)
    : 100;
  const bufferLabel = o.within_buffer
    ? `${fmtCountdown(o.seconds_remaining)} remaining`
    : (o.status === 'queued' ? 'READY TO DISPATCH' : '—');

  document.getElementById('om-body').innerHTML = `
    ${o.status === 'queued' ? `
    <div class="om-buffer-bar">
      <div class="bbar-label">24-HOUR CANCELLATION BUFFER</div>
      <div class="bbar-track"><div class="bbar-fill ${o.within_buffer?'':'expired'}" style="width:${bufferPct}%"></div></div>
      <div class="bbar-info">
        <span>Placed: ${formatDateFull(o.created_at)}</span>
        <span>${bufferLabel}</span>
        <span>Dispatches: ${o.fulfills_at_iso ? new Date(o.fulfills_at_iso).toLocaleString() : '—'}</span>
      </div>
    </div>` : ''}

    <div>
      <div class="om-section-title">Customer</div>
      <div class="om-grid">
        <div class="om-field"><div class="om-field-label">Name</div><div class="om-field-val">${esc(o.customer_name||'—')}</div></div>
        <div class="om-field"><div class="om-field-label">Email</div><div class="om-field-val mono">${esc(o.customer_email||'—')}</div></div>
        <div class="om-field"><div class="om-field-label">Address</div><div class="om-field-val">${esc(o.recipient?.address1||'—')}</div></div>
        <div class="om-field"><div class="om-field-label">City / State</div><div class="om-field-val">${esc((o.customer_city||'')+(o.recipient?.state_code?', '+o.recipient.state_code:''))}</div></div>
        <div class="om-field"><div class="om-field-label">ZIP / Country</div><div class="om-field-val mono">${esc((o.recipient?.zip||''))} ${esc(o.customer_country||'')}</div></div>
      </div>
    </div>

    <div>
      <div class="om-section-title">Order Details</div>
      <div class="om-grid">
        <div class="om-field"><div class="om-field-label">Design</div><div class="om-field-val">${esc(o.design_text||'Custom')}</div></div>
        <div class="om-field"><div class="om-field-label">Product</div><div class="om-field-val">${o.product||'tee'} · ${o.size||'M'} · ${o.color||'White'} · qty ${o.quantity||1}</div></div>
        <div class="om-field"><div class="om-field-label">Provider</div><div class="om-field-val">${providerIcon(o.provider)} ${o.provider||'auto'}</div></div>
        <div class="om-field"><div class="om-field-label">Total</div><div class="om-field-val mono">${o.total_usd ? '$'+parseFloat(o.total_usd).toFixed(2) : '—'}</div></div>
        <div class="om-field"><div class="om-field-label">Store</div><div class="om-field-val">${esc(o.store||'PrintDrop')}</div></div>
        <div class="om-field"><div class="om-field-label">Routing</div><div class="om-field-val" style="font-size:.75rem;color:var(--muted)">${esc(o.routing_reason||'')}</div></div>
      </div>
    </div>

    <div>
      <div class="om-section-title">Fulfillment</div>
      <div class="om-grid">
        <div class="om-field"><div class="om-field-label">Status</div><div class="om-field-val">${renderStatusBadge(o.status)}</div></div>
        <div class="om-field"><div class="om-field-label">POD Order ID</div><div class="om-field-val mono">${o.pod_order_id||'—'}</div></div>
        <div class="om-field"><div class="om-field-label">Dispatched</div><div class="om-field-val mono">${o.dispatched_at ? new Date(o.dispatched_at).toLocaleString() : '—'}</div></div>
        <div class="om-field"><div class="om-field-label">Carrier</div><div class="om-field-val">${o.carrier||'—'}</div></div>
      </div>
    </div>

    ${o.status !== 'cancelled' ? `
    <div>
      <div class="om-section-title">Tracking Number</div>
      <div class="tracking-form">
        <input class="tracking-input" id="tracking-num-input" type="text" placeholder="e.g. 1Z999AA1012345678" value="${o.tracking_number||''}">
        <input class="tracking-input" id="tracking-carrier-input" type="text" placeholder="Carrier (e.g. UPS)" value="${o.carrier||''}" style="max-width:120px">
        <button class="act-btn act-track" onclick="saveTracking('${o.id}')">Save</button>
      </div>
    </div>` : ''}

    ${o.cancel_reason ? `<div><div class="om-section-title">Cancellation</div><div class="om-field-val" style="font-size:.8rem;color:var(--err)">${esc(o.cancel_reason)}</div></div>` : ''}
    ${o.refund_reason ? `<div><div class="om-section-title">Refund Note</div><div class="om-field-val" style="font-size:.8rem;color:var(--purple)">${esc(o.refund_reason)}</div></div>` : ''}
    ${o.approved_by   ? `<div><div class="om-section-title">Approved By</div><div class="om-field-val mono" style="font-size:.78rem">${esc(o.approved_by)}</div></div>` : ''}
  `;

  // Footer buttons
  const footer = document.getElementById('om-footer');
  const canApprove = o.status === 'queued';
  const canCancel  = !['delivered','refunded','cancelled'].includes(o.status);
  const canRefund  = ['sent','shipped','delivered','cancelled'].includes(o.status);
  footer.innerHTML = `
    ${canApprove ? `<button class="act-btn act-approve" style="padding:.5rem 1rem" onclick="confirmApprove('${o.id}')">⚡ Approve Now</button>` : ''}
    ${canCancel  ? `<button class="act-btn act-cancel" style="padding:.5rem 1rem" onclick="confirmCancel('${o.id}')">✕ Cancel Order</button>` : ''}
    ${canRefund  ? `<button class="act-btn act-refund" style="padding:.5rem 1rem" onclick="confirmRefund('${o.id}')">↩ Refund</button>` : ''}
    <button class="act-btn act-view" style="padding:.5rem 1rem;margin-left:auto" onclick="closeModal()">Close</button>
  `;
}

function closeModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.getElementById('orderModal').style.display = 'none';
  _openModalOrderId = null;
}

// ══ CONFIRM DIALOG ══
function showConfirm({ icon, title, body, confirmLabel, danger, showReason, onConfirm }) {
  document.getElementById('cd-icon').textContent = icon || '⚠️';
  document.getElementById('cd-title').textContent = title;
  document.getElementById('cd-body').textContent = body;
  const confirmBtn = document.getElementById('cd-confirm-btn');
  confirmBtn.textContent = confirmLabel || 'Confirm';
  confirmBtn.className = 'cd-confirm' + (danger ? ' danger' : '');
  document.getElementById('cd-reason-wrap').style.display = showReason ? 'block' : 'none';
  document.getElementById('cd-reason').value = '';
  _confirmCallback = onConfirm;
  document.getElementById('confirmOverlay').style.display = 'block';
  document.getElementById('confirmDialog').style.display = 'block';
  if(showReason) setTimeout(()=>document.getElementById('cd-reason').focus(), 100);
}

function executeConfirm() {
  const reason = document.getElementById('cd-reason').value.trim();
  closeConfirm();
  if(_confirmCallback) { _confirmCallback(reason); _confirmCallback = null; }
}

function closeConfirm() {
  document.getElementById('confirmOverlay').style.display = 'none';
  document.getElementById('confirmDialog').style.display = 'none';
}

// ══ VIEW SWITCHING ══
function switchView(view, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.snav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + view)?.classList.add('active');
  if(btn) btn.classList.add('active');

  const titles = {
    orders:   ['Order Management', 'All orders · live'],
    ready:    ['Ready to Ship ⚡', 'Orders past the 24h buffer'],
    catalog:  ['Live Product Catalog', 'Direct from fulfillment providers'],
    branding: ['White-Label Branding', 'Customize your store'],
    settings: ['Settings', 'Server configuration'],
  };
  const [t, s] = titles[view] || ['Dashboard', ''];
  setText('topbarTitle', t);
  setText('topbarSub', s);

  if(view === 'ready') loadOrders();
  if(view === 'catalog') refreshCatalog();
}

// ══ CATALOG ══
function refreshCatalog() {
  const loading = document.getElementById('catalogLoading');
  const grid = document.getElementById('catalogGrid');
  const empty = document.getElementById('catalogEmpty');
  
  loading.style.display = 'flex';
  grid.innerHTML = '';
  empty.style.display = 'none';

  apiFetch('/api/catalog')
    .then(data => {
      _catalogData = data;
      renderCatalog();
    })
    .catch(err => {
      console.error(err);
      toast('Failed to load catalog: ' + err.message, 'err');
    })
    .finally(() => {
      loading.style.display = 'none';
    });
}

function setCatalogProvider(p, btn) {
  _currentCatalogProvider = p;
  document.querySelectorAll('.ctab').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderCatalog();
}

function searchCatalog(q) {
  _catalogSearch = q.toLowerCase();
  renderCatalog();
}

function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  const empty = document.getElementById('catalogEmpty');
  if(!_catalogData) return;

  let products = _catalogData[_currentCatalogProvider] || [];
  
  // Normalization (since different providers have different schemas)
  let items = [];
  if(_currentCatalogProvider === 'printful') {
    items = products.map(p => ({
      id: p.id,
      name: p.main_category_title || 'Apparel',
      label: p.title || p.model,
      brand: p.brand || 'Printful',
      image: p.image,
      price: 'From $'+(p.price || '0.00'),
      variants: p.variant_count + ' variants'
    }));
  } else if(_currentCatalogProvider === 'printify') {
    items = products.map(p => ({
      id: p.id,
      name: 'Printify Blueprint',
      label: p.title,
      brand: p.brand,
      image: p.images ? p.images[0] : null,
      price: 'Blueprint ID: ' + p.id,
      variants: 'Sync to use'
    }));
  } else if(_currentCatalogProvider === 'gelato') {
    items = products.map(p => ({
      id: p.productUid,
      name: p.productFamilyName,
      label: p.title || p.productUid,
      brand: 'Gelato',
      image: null, // Gelato API catalog is sparse on images in basic call
      price: 'UID: ' + p.productUid,
      variants: 'Global Fulfillment'
    }));
  }

  if(_catalogSearch) {
    items = items.filter(i => 
      i.label.toLowerCase().includes(_catalogSearch) || 
      i.brand.toLowerCase().includes(_catalogSearch) ||
      i.name.toLowerCase().includes(_catalogSearch)
    );
  }

  if(!items.length) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = items.map(i => `
    <div class="product-card">
      ${i.image ? `<img src="${i.image}" class="pc-img" alt="${i.label}">` : `<div class="pc-img" style="display:flex;align-items:center;justify-content:center;background:var(--surface3);color:var(--faint);font-size:2rem">📦</div>`}
      <div class="pc-body">
        <div class="pc-brand">${i.brand}</div>
        <div class="pc-name">${i.label}</div>
        <div class="pc-meta">
          <div class="pc-price">${i.price}</div>
          <div class="pc-variants">${i.variants}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ══ BRANDING ══
function loadBranding() {
  apiFetch('/api/admin/branding')
    .then(b => {
      setVal('bf-store-name',    b.store_name || '');
      setVal('bf-tagline',       b.tagline || '');
      setVal('bf-logo-url',      b.logo_url || '');
      setVal('bf-support-email', b.support_email || '');
      setVal('bf-from-email',    b.from_email || '');
      setVal('bf-accent',        b.accent_color || '#e85d04');
      setVal('bf-footer',        b.footer_text || '');
      document.getElementById('bf-accent-picker').value = b.accent_color || '#e85d04';
      setText('sidebarStoreName', b.store_name || 'PrintDrop');
      document.title = (b.store_name||'PrintDrop') + ' Admin';
    }).catch(console.error);
}

function saveBranding() {
  const data = {
    store_name:    getVal('bf-store-name'),
    tagline:       getVal('bf-tagline'),
    logo_url:      getVal('bf-logo-url'),
    support_email: getVal('bf-support-email'),
    from_email:    getVal('bf-from-email'),
    accent_color:  getVal('bf-accent'),
    footer_text:   getVal('bf-footer'),
  };
  apiFetch('/api/admin/branding', { method: 'POST', body: data })
    .then(() => {
      toast('Branding saved', 'ok');
      setText('sidebarStoreName', data.store_name || 'PrintDrop');
      const saved = document.getElementById('bf-saved');
      saved.style.display = 'inline';
      setTimeout(() => saved.style.display = 'none', 2500);
    })
    .catch(err => toast('Error: ' + err.message, 'err'));
}

// ══ HELPERS ══
function renderStatusBadge(status) {
  const icons = {
    queued:'⏳',approved:'⚡',fulfilling:'⚙',sent:'📤',
    shipped:'📦',delivered:'✅',cancelled:'✕',failed:'❌',refunded:'↩',
  };
  const labels = {
    queued:'Queued',approved:'Approved',fulfilling:'Fulfilling',sent:'Sent',
    shipped:'Shipped',delivered:'Delivered',cancelled:'Cancelled',failed:'Failed',refunded:'Refunded',
  };
  return `<span class="status-badge sb-${status||'queued'}">${icons[status]||''} ${labels[status]||status}</span>`;
}

function providerIcon(p) {
  return {printful:'⚡',gelato:'🌍',printify:'🌐'}[p] || '📦';
}

function formatDate(ts) {
  if(!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ' ' +
         d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true});
}
function formatDateFull(ts) {
  if(!ts) return '—';
  return new Date(ts * 1000).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
}
function fmtCountdown(secs) {
  const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), s = Math.floor(secs%60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
function pad(n) { return String(n).padStart(2,'0'); }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function setText(id, v) { const el=document.getElementById(id); if(el) el.textContent=v; }
function setVal(id, v)  { const el=document.getElementById(id); if(el) el.value=v; }
function getVal(id)     { return document.getElementById(id)?.value?.trim()||''; }

// ══ TOAST ══
let _toastTimer;
function toast(msg, type='info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// Enter to auth
document.addEventListener('keydown', e => {
  if(e.key==='Escape') { closeModal(); closeConfirm(); }
});
