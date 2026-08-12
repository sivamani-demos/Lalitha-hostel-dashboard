const UI = {
  // File upload display helper
  handleFileSelect(input, targetElId) {
    const el = document.getElementById(targetElId);
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      el.innerHTML = `✓ ${file.name} (${sizeMb} MB)`;
      el.classList.add('text-emerald-700');
    }
  },

  // Toast Notification
  showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    
    toast.className = `pointer-events-auto p-4 rounded-2xl shadow-xl border text-xs font-bold flex items-center justify-between gap-3 toast-enter ${
      isSuccess ? 'bg-emerald-900 text-emerald-50 border-emerald-700' : 'bg-rose-900 text-rose-50 border-rose-700'
    }`;
    
    toast.innerHTML = `
      <div class="flex items-center gap-2.5">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${isSuccess 
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>' 
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
        </svg>
        <span>${message}</span>
      </div>
      <button onclick="this.parentElement.remove()" class="opacity-70 hover:opacity-100">&times;</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.replace('toast-enter', 'toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Drawer Controls
  openOnboardModal() {
    const modal = document.getElementById('onboardModal');
    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.querySelector('.drawer-backdrop').classList.remove('opacity-0');
        modal.querySelector('.drawer-panel').classList.remove('translate-x-full');
      }, 10);
    }
  },

  closeOnboardModal() {
    const modal = document.getElementById('onboardModal');
    if (modal) {
      modal.querySelector('.drawer-backdrop').classList.add('opacity-0');
      modal.querySelector('.drawer-panel').classList.add('translate-x-full');
      setTimeout(() => modal.classList.add('hidden'), 300);
    }
  },

  switchTab(tab) {
    ['overview', 'onboard', 'rooms', 'residents', 'documents', 'payments'].forEach(t => {
      const view = document.getElementById(`view-${t}`);
      const btn = document.getElementById(`tab-${t}`);
      if (view) view.classList.add('hidden');
      if (btn) {
        btn.classList.remove('text-pink-theme', 'border-pink-theme');
        btn.classList.add('border-transparent');
      }
    });
    const targetView = document.getElementById(`view-${tab}`);
    const targetBtn = document.getElementById(`tab-${tab}`);
    if (targetView) targetView.classList.remove('hidden');
    if (targetBtn) {
      targetBtn.classList.add('text-pink-theme', 'border-pink-theme');
      targetBtn.classList.remove('border-transparent');
    }
  },

  renderAll() {
    this.updateOverviewMetrics();
    this.renderRooms();
    this.renderResidents();
    this.renderDocuments();
    this.renderPayments();
  },

  updateOverviewMetrics() {
    const totalBeds = CONFIG.TOTAL_BEDS;
    const occupied = State.store.residents.length;
    const vacant = totalBeds - occupied;

    document.getElementById('stat-total-beds').innerText = totalBeds;
    document.getElementById('stat-occupied').innerText = occupied;
    document.getElementById('stat-vacant').innerText = `${vacant} beds vacant`;

    const expectedMonth = State.store.residents.reduce((sum, r) => sum + (Number(r.rent) || 0), 0);
    document.getElementById('stat-expected').innerText = `₹${expectedMonth.toLocaleString('en-IN')}`;

    const pendingList = State.store.payments.filter(p => String(p.paid).toUpperCase() !== 'TRUE');
    const pendingTotal = pendingList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    document.getElementById('stat-pending-count').innerText = pendingList.length;
    document.getElementById('stat-pending-outstanding').innerText = `₹${pendingTotal.toLocaleString('en-IN')} outstanding`;

    const paidList = State.store.payments.filter(p => String(p.paid).toUpperCase() === 'TRUE');
    const collectedTotal = paidList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    document.getElementById('stat-collected').innerText = `₹${collectedTotal.toLocaleString('en-IN')}`;
    document.getElementById('stat-collected-target').innerText = `of ₹${expectedMonth.toLocaleString('en-IN')} expected`;

    const pct = expectedMonth > 0 ? Math.min(100, Math.round((collectedTotal / expectedMonth) * 100)) : 0;
    document.getElementById('collectionProgressBar').style.width = `${pct}%`;

    document.getElementById('rent-card-expected').innerText = `₹${expectedMonth.toLocaleString('en-IN')}`;
    document.getElementById('rent-card-collected').innerText = `₹${collectedTotal.toLocaleString('en-IN')}`;
    document.getElementById('rent-card-outstanding').innerText = `₹${pendingTotal.toLocaleString('en-IN')}`;

    this.renderFloorBars();
  },

  renderFloorBars() {
    const floorBeds = {
      "Floor 1": { total: 21, occupied: 0 },
      "Floor 2": { total: 21, occupied: 0 },
      "Floor 3": { total: 21, occupied: 0 },
      "Floor 4": { total: 16, occupied: 0 }
    };

    State.store.residents.forEach(r => {
      const key = `Floor ${r.floor}`;
      if (floorBeds[key]) floorBeds[key].occupied += 1;
    });

    const container = document.getElementById('floorOccupancyBars');
    container.innerHTML = Object.entries(floorBeds).map(([floor, data]) => {
      const pct = Math.round((data.occupied / data.total) * 100);
      return `
        <div>
          <div class="flex justify-between text-xs mb-1 font-semibold text-stone-600">
            <span>${floor}</span>
            <span class="text-stone-400 font-bold">${data.occupied}/${data.total} beds</span>
          </div>
          <div class="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden p-0.5">
            <div class="bg-gradient-to-r from-[#702447] to-[#e6206e] h-1.5 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  filterRooms(floor) {
    State.roomFloorFilter = floor;
    ['1', '2', '3', '4'].forEach(f => {
      const btn = document.getElementById(`flt-room-${f}`);
      if (f === floor) {
        btn.className = "px-5 py-2 rounded-full text-xs font-bold bg-[#522138] text-white shadow-sm transition-all";
      } else {
        btn.className = "px-5 py-2 rounded-full text-xs font-bold bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all";
      }
    });
    this.renderRooms();
  },

  renderRooms() {
    const container = document.getElementById('roomsContainer');
    const roomMap = {};

    for (let f = 1; f <= 3; f++) {
      for (let r = 1; r <= 6; r++) {
        const roomNo = `${f}0${r}`;
        const capacity = r <= 3 ? 3 : 4;
        roomMap[roomNo] = { floorNum: `${f}`, roomNumber: roomNo, capacity, occupants: [] };
      }
    }
    for (let r = 1; r <= 4; r++) {
      const roomNo = `40${r}`;
      roomMap[roomNo] = { floorNum: '4', roomNumber: roomNo, capacity: 4, occupants: [] };
    }

    State.store.residents.forEach(res => {
      const roomKey = String(res.roomNumber);
      if (roomMap[roomKey]) roomMap[roomKey].occupants.push(res);
    });

    const filteredRooms = Object.values(roomMap).filter(r => r.floorNum === State.roomFloorFilter);

    container.innerHTML = filteredRooms.map(r => {
      const free = r.capacity - r.occupants.length;
      const isFull = free === 0;
      const statusPill = isFull 
        ? `<span class="bg-rose-100 text-rose-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">${r.capacity}-sharing · full</span>`
        : `<span class="bg-amber-50 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">${r.capacity}-sharing · ${free} free</span>`;

      return `
        <div class="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm card-hover space-y-4">
          <div class="flex justify-between items-center border-b border-stone-100 pb-3">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5"/></svg>
              <h3 class="font-bold text-base text-stone-900">Room ${r.roomNumber}</h3>
            </div>
            ${statusPill}
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            ${r.occupants.map(o => `
              <div class="p-2.5 bg-stone-50 rounded-xl border border-stone-100/80 hover:border-pink-200 transition-colors">
                <p class="font-bold text-stone-800 text-xs truncate">${o.name}</p>
                <p class="text-[10px] font-medium text-stone-400 mt-0.5">Bed ${o.bed}</p>
              </div>
            `).join('')}
            ${Array.from({length: free}).map(() => `
              <div class="p-2.5 border border-dashed border-stone-200 rounded-xl text-stone-400 text-xs font-medium flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                Vacant
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  },

  renderResidents() {
    const tbody = document.getElementById('residentsTableBody');
    const searchEl = document.getElementById('resSearch');
    const search = searchEl ? searchEl.value.toLowerCase() : '';

    const filtered = State.store.residents.filter(r => 
      String(r.name).toLowerCase().includes(search) || 
      String(r.roomNumber).includes(search) || 
      String(r.phone).includes(search)
    );

    const countEl = document.getElementById('resCount');
    if (countEl) countEl.innerText = `${filtered.length} residents`;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-stone-400 text-xs font-medium">No matching resident records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const payRecord = State.store.payments.find(p => p.residentId === r.id);
      const isPaid = payRecord && String(payRecord.paid).toUpperCase() === 'TRUE';
      
      const badge = isPaid
        ? `<span class="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-1 rounded-full font-bold">Paid</span>`
        : `<span class="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-full font-bold">Pending</span>`;

      return `
        <tr class="hover:bg-stone-50/80 transition-colors">
          <td class="p-4 font-bold text-stone-900">${r.name}</td>
          <td class="p-4 text-stone-600 font-medium">Room ${r.roomNumber} · Bed ${r.bed}</td>
          <td class="p-4 text-stone-500 font-mono text-xs flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            ${r.phone}
          </td>
          <td class="p-4 text-stone-500 font-medium">${formatDate(r.joinDate)}</td>
          <td class="p-4 font-bold text-stone-900">₹${Number(r.rent).toLocaleString('en-IN')}</td>
          <td class="p-4">${badge}</td>
          <td class="p-4 text-right">
            <button onclick="vacateResident('${r.id}')" class="text-xs text-stone-400 hover:text-rose-600 font-bold transition-colors flex items-center gap-1 ml-auto btn-spring">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              Vacate
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderDocuments() {
    const container = document.getElementById('documentsListContainer');
    const withDocs = State.store.residents.filter(r => r.aadharFileUrl && r.aadharFileUrl !== '');
    
    document.getElementById('docsSummaryText').innerText = `${withDocs.length} of ${State.store.residents.length} tenants have an ID on file`;

    if (State.store.residents.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-stone-400 text-xs font-medium">No tenants registered yet.</div>`;
      return;
    }

    container.innerHTML = State.store.residents.map(r => {
      const hasDoc = r.aadharFileUrl && r.aadharFileUrl !== '';
      return `
        <div class="p-4 bg-white rounded-xl border border-stone-200/80 flex items-center justify-between card-hover">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div>
              <p class="font-bold text-stone-900 text-sm">${r.name}</p>
              <p class="text-xs text-stone-400 font-medium">Room ${r.roomNumber} · Bed ${r.bed}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            ${hasDoc ? `
              <span class="bg-emerald-50 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Uploaded</span>
              <a href="${r.aadharFileUrl}" target="_blank" class="px-4 py-1.5 bg-[#522138] text-white rounded-full text-xs font-bold hover:bg-[#3d1829] flex items-center gap-1 transition-all btn-spring shadow-sm">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                View File
              </a>
            ` : `
              <span class="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Missing</span>
              <button onclick="UI.openOnboardModal()" class="px-4 py-1.5 bg-[#522138] text-white rounded-full text-xs font-bold hover:bg-[#3d1829] flex items-center gap-1 transition-all btn-spring shadow-sm">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                Upload
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  },

  // FIX 5: Resident Name Lookup, Official WhatsApp Icon, and Two-Way Toggle
  renderPayments() {
    const container = document.getElementById('rentListContainer');

    if (State.store.payments.length === 0) {
      container.innerHTML = `<div class="p-8 text-center text-stone-400 text-xs font-medium">No rent transactions found.</div>`;
      return;
    }

    container.innerHTML = State.store.payments.map(p => {
      const isPaid = String(p.paid).toUpperCase() === 'TRUE';
      
      // Lookup resident name using residentId (R1, R2...)
      const res = State.store.residents.find(r => String(r.id) === String(p.residentId)) || {};
      const resName = res.name || `Resident (${p.residentId})`;
      const roomInfo = res.roomNumber ? `Room ${res.roomNumber} · Bed ${res.bed}` : `Resident ID: ${p.residentId}`;
      const phone = res.phone || '';

      return `
        <div class="p-4 hover:bg-stone-50/80 flex justify-between items-center transition-colors">
          <div>
            <p class="font-bold text-stone-900 text-sm">${resName}</p>
            <p class="text-xs text-stone-400 font-medium mt-0.5">${roomInfo}</p>
          </div>

          <div class="flex items-center gap-3">
            <span class="font-bold text-stone-900 text-sm">₹${Number(p.amount).toLocaleString('en-IN')}</span>
            
            ${isPaid ? `
              <span class="text-xs text-stone-400 font-medium">paid ${p.paidOn ? formatDate(p.paidOn) : ''}</span>
              
              <!-- Click Paid to Toggle back to Pending -->
              <button onclick="togglePaymentState('${p.residentId}', '${p.month}', ${p.amount}, false)" title="Click to mark as unpaid" class="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-emerald-200 transition-all btn-spring">
                <svg class="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                ✓ Paid
              </button>

              <button onclick="downloadReceipt('${resName}', '${roomInfo}', '${p.amount}', '${p.paidOn}', '${p.month}')" title="Download Receipt" class="w-8 h-8 flex items-center justify-center text-stone-500 bg-stone-100 hover:bg-stone-200 rounded-full transition-all btn-spring">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              </button>

              <!-- Official WhatsApp Brand Styling -->
              <button onclick="openWhatsApp('${phone}', '${resName}', '${p.amount}', '${p.month}', '${p.paidOn}')" title="Send WhatsApp Receipt" class="w-8 h-8 flex items-center justify-center text-white bg-[#25D366] hover:bg-[#20ba5a] rounded-full shadow-sm transition-all btn-spring">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.002 3.66 3.745-.983z"/></svg>
              </button>
            ` : `
              <!-- Click Mark Paid to Toggle to Paid -->
              <button onclick="togglePaymentState('${p.residentId}', '${p.month}', ${p.amount}, true)" class="text-xs border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-full font-bold transition-all flex items-center gap-1 btn-spring">
                <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Mark paid
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }
};

function switchTab(t) { UI.switchTab(t); }
function filterRooms(f) { UI.filterRooms(f); }
function renderResidents() { UI.renderResidents(); }
function formatDate(d) {
  if (!d) return '-';
  const date = new Date(d);
  return isNaN(date) ? d : date.toISOString().split('T')[0];
}
