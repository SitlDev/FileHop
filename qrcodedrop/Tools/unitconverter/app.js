const categorySelect = document.getElementById('unit-category');
const fromSelect = document.getElementById('unit-from');
const toSelect = document.getElementById('unit-to');
const input = document.getElementById('unit-input');
const output = document.getElementById('unit-output');
const btnConvert = document.getElementById('btn-convert');
const btnCopy = document.getElementById('btn-copy');

const conversions = {
  length: {
    units: ['meter', 'kilometer', 'mile', 'yard', 'foot', 'inch', 'centimeter', 'millimeter'],
    toMeter: { meter: 1, kilometer: 1000, mile: 1609.34, yard: 0.9144, foot: 0.3048, inch: 0.0254, centimeter: 0.01, millimeter: 0.001 }
  },
  weight: {
    units: ['kilogram', 'gram', 'milligram', 'pound', 'ounce', 'ton'],
    toKg: { kilogram: 1, gram: 0.001, milligram: 0.000001, pound: 0.453592, ounce: 0.0283495, ton: 1000 }
  },
  temperature: {
    units: ['celsius', 'fahrenheit', 'kelvin'],
    convert: (val, from, to) => {
      let c;
      if (from === 'celsius') c = val;
      else if (from === 'fahrenheit') c = (val - 32) * 5 / 9;
      else if (from === 'kelvin') c = val - 273.15;
      
      if (to === 'celsius') return c;
      if (to === 'fahrenheit') return c * 9 / 5 + 32;
      if (to === 'kelvin') return c + 273.15;
    }
  },
  volume: {
    units: ['liter', 'milliliter', 'gallon', 'quart', 'pint', 'cup', 'fluid_ounce'],
    toLiter: { liter: 1, milliliter: 0.001, gallon: 3.78541, quart: 0.946353, pint: 0.473176, cup: 0.236588, fluid_ounce: 0.0295735 }
  },
  speed: {
    units: ['meter_per_second', 'kilometer_per_hour', 'mile_per_hour', 'knot'],
    toMps: { meter_per_second: 1, kilometer_per_hour: 0.27778, mile_per_hour: 0.44704, knot: 0.51444 }
  }
};

function populateUnits() {
  const cat = categorySelect.value;
  const units = conversions[cat].units;
  fromSelect.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
  toSelect.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
  if (units.length > 1) toSelect.value = units[1];
  convert();
}

function convert() {
  const cat = categorySelect.value;
  const from = fromSelect.value;
  const to = toSelect.value;
  const val = parseFloat(input.value) || 0;

  if (cat === 'temperature') {
    const result = conversions[cat].convert(val, from, to);
    output.value = `${val}° ${from.toUpperCase()} = ${result.toFixed(4)}° ${to.toUpperCase()}`;
  } else {
    let base, key;
    if (cat === 'length') { base = conversions[cat].toMeter; key = 'toMeter'; }
    else if (cat === 'weight') { base = conversions[cat].toKg; key = 'toKg'; }
    else if (cat === 'volume') { base = conversions[cat].toLiter; key = 'toLiter'; }
    else if (cat === 'speed') { base = conversions[cat].toMps; key = 'toMps'; }

    const inBase = val * base[from];
    const result = inBase / base[to];
    output.value = `${val} ${from} = ${result.toFixed(6)} ${to}`;
  }
}

async function copyResult() {
  const txt = output.value;
  if (!txt) return;
  try {
    await navigator.clipboard.writeText(txt);
    const orig = btnCopy.textContent;
    btnCopy.textContent = 'Copied!';
    setTimeout(() => btnCopy.textContent = orig, 1500);
    showEmailModal('copy');
  } catch (err) {
    alert('Copy failed: ' + err.message);
  }
}

categorySelect.addEventListener('change', populateUnits);
fromSelect.addEventListener('change', convert);
toSelect.addEventListener('change', convert);
input.addEventListener('input', convert);
btnConvert.addEventListener('click', convert);
btnCopy.addEventListener('click', copyResult);

// --- Email modal ---
const emailModal = document.getElementById('email-modal');
const closeModal = document.querySelector('.close-modal');
const emailSignupForm = document.getElementById('email-signup-form');
const signupEmail = document.getElementById('signup-email');
let modalShown = false;

function showEmailModal(trigger) {
  if (!modalShown && !localStorage.getItem('email_subscribed')) {
    emailModal.style.display = 'block';
    modalShown = true;
  }
}

closeModal.addEventListener('click', () => { emailModal.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === emailModal) emailModal.style.display = 'none'; });

emailSignupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = signupEmail.value.trim();
  if (!email) return;
  try {
    const res = await fetch('https://knotstranded.com/api/newsletter', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source: 'unitconverter_tool', timestamp: new Date().toISOString() })
    });
    if (res.ok) {
      localStorage.setItem('email_subscribed', 'true');
      emailModal.style.display = 'none';
      alert('Thanks for subscribing!');
    } else {
      alert('Subscription error. Try again later.');
    }
  } catch (err) {
    console.error(err);
    alert('Subscription error. Try again later.');
  }
});

// initial
populateUnits();