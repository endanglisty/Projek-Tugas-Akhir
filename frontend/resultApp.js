// ── AMBIL DATA DARI SESSIONSTORE ─────────────────────────────
const features    = JSON.parse(sessionStorage.getItem('stressFeatures') || 'null');
const result      = JSON.parse(sessionStorage.getItem('stressResult')   || 'null');
const confidence    = sessionStorage.getItem('stressConfidence')  || null;
const sessionTime = sessionStorage.getItem('sessionTime')     || null;
// const probability = parseFloat(sessionStorage.getItem('stressProbability') || '0');

// ── LABEL WAKTU ───────────────────────────────────────────────
// const daylightLabel = ['Pagi (05.00–11.00)', 'Siang (11.00–17.00)', 'Malam (17.00–05.00)'];

// function getDaylightLabel() {
//   const h = new Date().getHours();
//   if (h >= 5  && h < 11) return daylightLabel[0];
//   if (h >= 11 && h < 17) return daylightLabel[1];
//   return daylightLabel[2];
// }

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

  // if (summaryBox && features) {
  //   summaryBox.innerHTML =
  //     `Model mengklasifikasikan kondisi <b>STRES</b> ` +
  //     `dengan probabilitas <b>${(result.probability * 100).toFixed(1)}%</b>.<br><br>` +
  //     `Selama sesi tercatat ` +
  //     `<b>${features.backspace_count}</b> kali backspace, ` +
  //     `<b>${fmt(features.total_inact_duration, 1)}</b> detik inaktif, ` +
  //     `dan <b>${features.total_keystrokes}</b> total ketukan. ` +
  //     // `Variabilitas hold time yang tinggi (<b>${fmt(features.hold_time_cv, 2)}</b>) ` +
  //     `Flight time tidak teratur menjadi faktor utama.<br><br>` +
  //     `Disarankan untuk beristirahat sejenak sebelum melanjutkan aktivitas.`;
  // }

  if (summaryBox && features) {
    summaryBox.innerHTML =
      `Model mengklasifikasikan kondisi pengguna <b>STRES</b> ` +
      `dengan tingkat kepercayaan <b>${result.confidence}%</b>. ` +
      'Nilai tersebut menunjukkan bahwa model pola pengetikan yang direkam sesuai dengan karakteristik kondisi stres.' +
      `Pengguna disarankan untuk beristirahat sejenak sebelum melanjutkan aktivitas.`;
      // `dengan probabilitas <b>${(result.probability * 100).toFixed(1)}%</b>.<br><br>` 
      // `Selama sesi tercatat ` +
      // `<b>${features.backspace_count}</b> kali backspace, ` +
      // `<b>${fmt(features.total_inact_duration, 1)}</b> detik inaktif, ` +
      // `dan <b>${features.total_keystrokes}</b> total ketukan. ` +
      // `Variabilitas hold time yang tinggi (<b>${fmt(features.hold_time_cv, 2)}</b>) ` +
      // `Flight time tidak teratur menjadi faktor utama.<br><br>` +
      // `Disarankan untuk beristirahat sejenak sebelum melanjutkan aktivitas.`;
  }

} else if (result && result.stress === 'Tidak Stres') {
  card.classList.add('no-stress');
  icon.textContent         = '✓';
  label.textContent        = 'TIDAK STRES';
  sub.textContent          = 'Pola pengetikan menunjukkan kondisi normal';
  statusText.textContent   = 'Kondisi normal';
  dot.style.background     = 'var(--green)';
  dot.style.boxShadow      = '0 0 6px var(--green)';

  // if (summaryBox && features) {
  //   summaryBox.innerHTML =
  //     `Model mengklasifikasikan kondisi <b>TIDAK STRES</b> ` +
  //     `dengan probabilitas stres <b>${(result.probability * 100).toFixed(1)}%</b>.<br><br>` +
  //     `Pola pengetikan konsisten dengan hold time rata-rata ` +
  //     `<b>${fmt(features.hold_time_mean, 1)} ms</b> ` +
  //     // `dan kecepatan <b>${fmt(features.typing_speed * 60, 0)} ketukan/menit</b>. ` +
  //     `Kondisi saat ini baik untuk melanjutkan aktivitas.`;
  // }

  if (summaryBox && features) {
    summaryBox.innerHTML =
      `Model mengklasifikasikan kondisi <b>TIDAK STRES</b> ` +
      `dengan tingkat kepercayaan <b>${result.confidence}%</b>.` +
      `Nilai tersebut menunjukkan bahwa pola pengetikan yang direkam sesuai dengan karakteristik kondisi normal sehingga pengguna dapat melanjutkan aktivitas seperti biasa.`;
      // `dengan probabilitas stres <b>${(result.probability * 100).toFixed(1)}%</b>.<br><br>` 
      // `Pola pengetikan konsisten dengan hold time rata-rata ` +
      // `<b>${fmt(features.hold_time_mean, 1)} ms</b> ` +
      // `dan kecepatan <b>${fmt(features.typing_speed * 60, 0)} ketukan/menit</b>. ` +
      // `Kondisi saat ini baik untuk melanjutkan aktivitas.`;
  }

} else {
  // Tidak ada data
  if (label) label.textContent = 'Data tidak tersedia';
  if (sub)   sub.textContent   = 'Kembali dan ulangi sesi pengetikan';
  if (summaryBox) summaryBox.textContent =
    'Tidak ada data sesi. Silakan kembali dan mulai sesi pengetikan baru.';
}

// ── TAMPILKAN PROBABILITAS ────────────────────────────────────
// const mProbEl = document.getElementById('mProbability');
// if (mProbEl && result) {
//   mProbEl.textContent = (result.probability * 100).toFixed(1) + '%';
// }

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
    // if (confidenceFill) confidenceFill.style.width = "0%";
  }
}

// if (result && result.confidence != null) {

//   const confidence = Number(result.confidence);

//   mConfidenceEl.textContent = confidence.toFixed(2) + "%";

//   console.log(result);
//   console.log(result.confidence);

//   if (confidenceFill) {
//       confidenceFill.style.width = confidence + "%";
//   }
// }

// if (mConfidenceEl && result && result.confidence !== undefined) {
//     mConfidenceEl.textContent = result.confidence + '%';
// }

// ── TAMPILKAN METRIK KETIKAN ──────────────────────────────────
// Sesuai fitur model: tanpa avg_mouse_speed, Fatigue, PAM
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

  // Kecepatan Ketik (k/menit)
  // const mSpeed = document.getElementById('mSpeed');
  // if (mSpeed) mSpeed.innerHTML =
  //   `${fmt(features.typing_speed * 60, 0)}<span class="metric-unit">k/m</span>`;

  // Durasi Inaktif
  const mInact = document.getElementById('mInact');
  if (mInact) mInact.innerHTML =
    `${fmt(features.total_inact_duration / 1000, 1)}<span class="metric-unit">dtk</span>`;

  // Hold CV (variabilitas hold)
  // const mHoldCv = document.getElementById('mHoldCv');
  // if (mHoldCv) mHoldCv.textContent = fmt(features.hold_time_cv, 3);

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

// const cDaylight = document.getElementById('cDaylight');
// if (cDaylight) cDaylight.textContent = getDaylightLabel();

// ── RESET & KEMBALI ───────────────────────────────────────────
function restartSession() {
  // Hapus hanya data sesi, bukan kondisi user
  ['stressFeatures', 'stressResult', 'stressConfidence', 'sessionTime', 'referenceText'].forEach(k => {
    sessionStorage.removeItem(k);
  });
  window.location.href = 'Typing.html';
}
