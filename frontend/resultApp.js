// ── AMBIL DATA DARI SESSIONSTORE ─────────────────────────────
const features    = JSON.parse(sessionStorage.getItem('stressFeatures') || 'null');
const result      = JSON.parse(sessionStorage.getItem('stressResult')   || 'null');
const confidence    = sessionStorage.getItem('stressConfidence')  || null;
const sessionTime = sessionStorage.getItem('sessionTime')     || null;

// ── LABEL WAKTU ───────────────────────────────────────────────
const daylightLabel = ['Morning', 'Afternoon', 'Night'];

function getDaylightLabel(encoded) {
  if (encoded === 0 || encoded === 1 || encoded === 2) {
    return daylightLabel[encoded];
  }
  return '—';
}

// ── FORMAT ANGKA ─────────────────────────────────────────────
function fmt(val, decimal = 0) {
  if (val === null || val === undefined || isNaN(Number(val))) return '—';
  return Number(val).toFixed(decimal);
}

// ── ELEMEN HASIL ─────────────────────────────────────────────
const card       = document.getElementById('resultCard');
const label      = document.getElementById('resultLabel');
const sub        = document.getElementById('resultSub');
const icon       = document.getElementById('resultIcon');
const dot        = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const summaryBox = document.getElementById('summaryBox');

// ── TAMPILKAN HASIL DETEKSI ───────────────────────────────────
if (result && result.stress === 'Stres') {
  card.classList.add('stress');
  icon.textContent         = '⚠';
  label.textContent        = 'STRES';
  sub.textContent          = 'Pola pengetikan menunjukkan indikasi stres';
  statusText.textContent   = 'Terdeteksi stres';
  dot.style.background     = 'var(--red)';
  dot.style.boxShadow      = '0 0 6px var(--red)';

  // Menampilkan teks kesimpulan
  if (summaryBox && features) {
    summaryBox.innerHTML =
      `Model mengklasifikasikan kondisi pengguna <b>STRES</b> ` +
      `dengan tingkat kepercayaan <b>${result.confidence}%</b>. ` +
      `Nilai tersebut menunjukkan bahwa model pola pengetikan yang direkam sesuai dengan karakteristik kondisi stres. ` +
      `Pengguna disarankan untuk beristirahat sejenak sebelum melanjutkan aktivitas.`;
  }

} else if (result && result.stress === 'Tidak Stres') { // Menampilkan status tidak stres
  card.classList.add('no-stress');
  icon.textContent         = '✓';
  label.textContent        = 'TIDAK STRES';
  sub.textContent          = 'Pola pengetikan menunjukkan kondisi normal';
  statusText.textContent   = 'Kondisi normal';
  dot.style.background     = 'var(--green)';
  dot.style.boxShadow      = '0 0 6px var(--green)';

  // Menampilkan teks kesimpulan tidak stres
  if (summaryBox && features) {
    summaryBox.innerHTML =
      `Model mengklasifikasikan kondisi <b>TIDAK STRES</b> ` +
      `dengan tingkat kepercayaan <b>${result.confidence}%</b>. ` +
      ` Nilai tersebut menunjukkan bahwa pola pengetikan yang direkam sesuai dengan karakteristik kondisi normal sehingga pengguna dapat melanjutkan aktivitas seperti biasa.`;
  }

} else {
  // Tidak ada data
  if (label) label.textContent = 'Data tidak tersedia';
  if (sub)   sub.textContent   = 'Kembali dan ulangi sesi pengetikan';
  if (summaryBox) summaryBox.textContent =
    'Tidak ada data sesi. Silakan kembali dan mulai sesi pengetikan baru.';
}

//── TAMPILKAN CONFIDENCE ────────────────────────────────────
const mConfidenceEl = document.getElementById('mConfidenceModel');
const confidenceFill = document.getElementById("confidenceFill");

if (result && result.confidence != null) {
  const confidenceNum = Number(result.confidence);
  if (!isNaN(confidenceNum)) {
    mConfidenceEl.textContent = confidenceNum.toFixed(2) + "%";
    if (confidenceFill) confidenceFill.style.width = confidenceNum + "%";
  } else {
    mConfidenceEl.textContent = "Tidak tersedia (mode offline)";
  }
}

// ── TAMPILKAN METRIK KETIKAN ──────────────────────────────────
if (features) {
  // Hold Time (dari Press & Release)
  const mHold = document.getElementById('mHold');
  if (mHold) mHold.innerHTML =
    `${fmt(features.hold_time_mean, 1)}<span class="metric-unit">ms</span>`;

  // Standar deviasi hold time
  const mHoldStd = document.getElementById('mHoldStd');
  if (mHoldStd) mHoldStd.innerHTML =
    `${fmt(features.hold_time_std,1)}<span class="metric-unit">ms</span>`;

  // Flight Time
  const mFlight = document.getElementById('mFlight');
  if (mFlight) mFlight.innerHTML =
    `${fmt(features.flight_time_mean, 1)}<span class="metric-unit">ms</span>`;

  // Standar deviasi flight time
  const mFlightStd = document.getElementById('mFlightStd');
  if (mFlightStd)mFlightStd.innerHTML =
    `${fmt(features.flight_time_std, 1)}<span class="metric-unit">ms</span>`;

  // Jumlah Backspace
  const mBackspace = document.getElementById('mBackspace');
  if (mBackspace) mBackspace.innerHTML =
    `${features.backspace_count ?? '—'}<span class="metric-unit">kali</span>`;

  // Total Ketukan
  const mKeyCount = document.getElementById('mKeyCount');
  if (mKeyCount) mKeyCount.textContent = features.total_keystrokes ?? '—';

  // Durasi Inaktif
  const mInact = document.getElementById('mInact');
  if (mInact) mInact.innerHTML =
    `${fmt(features.total_inact_duration / 1000, 1)}<span class="metric-unit">dtk</span>`;

  // Backspace ratio
  const mBsRatio = document.getElementById('mBsRatio');
  if (mBsRatio) mBsRatio.textContent = fmt(features.backspace_ratio * 100, 1) + '%';
}

// ── AKURASI PENGETIKAN ────────────────────────────────────────
const mConfidence = document.getElementById('mConfidence');
if (mConfidence && confidence !== null) {
  mConfidence.innerHTML = `${confidence}<span class="metric-unit">%</span>`;
}

// ── WAKTU SESI ────────────────────────────────────────────────
const cSessionTime = document.getElementById('cSessionTime');
if (cSessionTime && sessionTime) {
  cSessionTime.textContent =
    new Date(sessionTime).toLocaleString('id-ID', {
      dateStyle: 'medium', timeStyle: 'short'
    });
}

// Daylight
const cDaylight = document.getElementById('cDaylight');
if (cDaylight && features) {
  cDaylight.textContent = getDaylightLabel(features.Daylight_Encoded);
}

console.log(document.getElementById('cDaylight'));
console.log(JSON.parse(sessionStorage.getItem('stressFeatures')));

// ── RESET & KEMBALI ───────────────────────────────────────────
function restartSession() {
  // Hapus data sesi sebelumnya
  ['stressFeatures', 'stressResult', 'stressConfidence', 'sessionTime', 'referenceText'].forEach(k => {
    sessionStorage.removeItem(k);
  });
  window.location.href = 'Typing.html';
}
