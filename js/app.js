
document.addEventListener('DOMContentLoaded', () => {
  // Load cache instantly
  State.loadCache();
  UI.renderAll();
  UI.switchTab('overview');

  // Fetch live background data
  loadData();

  // Attach event listeners
  const form = document.getElementById('onboardForm');
  if (form) form.addEventListener('submit', submitForm);

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => loadData());

  const searchInput = document.getElementById('resSearch');
  if (searchInput) searchInput.addEventListener('keyup', () => UI.renderResidents());
});

async function loadData() {
  const statusEl = document.getElementById('syncStatus');
  const syncIcon = document.getElementById('syncIcon');

  statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse"></span> Syncing...`;
  syncIcon.classList.add('animate-spin');

  try {
    const data = await API.fetchDashboardData();
    State.setStore(data);
    UI.renderAll();
    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Live Data Connected`;
  } catch (err) {
    statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Offline / Cache View`;
  } finally {
    syncIcon.classList.remove('animate-spin');
  }
}

async function submitForm(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.innerText = "Saving...";
  submitBtn.disabled = true;

  const residentId = "R" + Math.floor(100 + Math.random() * 900);
  const fileInput = document.getElementById('idFile');

  const newResident = {
    id: residentId,
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    joinDate: document.getElementById('joinDate').value,
    rent: document.getElementById('rent').value,
    floor: document.getElementById('floor').value,
    roomNumber: document.getElementById('roomNumber').value,
    bed: document.getElementById('bed').value
  };

  try {
    await API.postAction({ action: "addResident", resident: newResident });

    const currentMonth = newResident.joinDate.substring(0, 7);
    await API.postAction({
      action: "markPayment",
      residentId: residentId,
      month: currentMonth,
      paid: false,
      paidOn: "",
      amount: newResident.rent
    });

    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = async function(evt) {
        await API.postAction({
          action: "uploadDoc",
          residentId: residentId,
          fileName: `${newResident.name}_ID`,
          mimeType: file.type,
          base64: evt.target.result
        });
        finishOnboarding();
      };
      reader.readAsDataURL(file);
    } else {
      finishOnboarding();
    }
  } catch (err) {
    finishOnboarding();
  }
}

function finishOnboarding() {
  alert("Tenant onboarded successfully!");
  document.getElementById('onboardForm').reset();
  document.getElementById('submitBtn').innerText = "Confirm & Register";
  document.getElementById('submitBtn').disabled = false;
  loadData();
  UI.switchTab('residents');
}

async function vacateResident(resId) {
  if (!confirm(`Are you sure you want to vacate resident ${resId}?`)) return;
  await API.postAction({ action: "vacateResident", residentId: resId });
  loadData();
}

async function markPaid(resId, month, amount) {
  const today = new Date().toISOString().split('T')[0];
  await API.postAction({
    action: "markPayment",
    residentId: resId,
    month: month,
    paid: true,
    paidOn: today,
    amount: amount
  });
  loadData();
}

function openWhatsApp(phone, name, amount, month, paidOn) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  
  const message = `Hello ${name},\n\nYour rent payment of ₹${Number(amount).toLocaleString('en-IN')} for ${month} has been received and marked as PAID on${formatDate(paidOn)}.\n\nThank you!\n- Hostel Management`;
  const encodedMsg = encodeURIComponent(message);
  
  window.open(`https://wa.me/${formattedPhone}?text=${encodedMsg}`, '_blank');
}

function downloadReceipt(name, room, amount, paidOn, month) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><title>Rent Receipt - ${name}</title></head>
    <body style="font-family: Arial, sans-serif; padding: 40px; border: 2px solid #333; max-width: 500px; margin: auto;">
      <h2 style="color: #e6206e; text-align: center;">RENT PAYMENT RECEIPT</h2>
      <hr/>
      <p><strong>Resident Name:</strong> ${name}</p>
      <p><strong>Room Details:</strong> ${room}</p>
      <p><strong>Billing Month:</strong> ${month}</p>
      <p><strong>Amount Paid:</strong> ₹${Number(amount).toLocaleString('en-IN')}</p>
      <p><strong>Payment Date:</strong> ${formatDate(paidOn)}</p>
      <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">PAID</span></p>
      <hr/>
      <p style="text-align: center; font-size: 12px; color: #777;">Thank you for your payment!</p>
    </body>
    </html>
  `;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Receipt_${name}_${month}.html`;
  a.click();
}
