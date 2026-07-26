// ── KONFIGURASI ──────────────────────────────────────────────
const PARAGRAPHS = [
  `Teknologi informasi mengubah cara manusia bekerja dan berkomunikasi tiap hari. Sistem komputer modern memproses data lebih cepat, sehingga mendukung aktivitas. Mahasiswa dituntut berpikir kritis, disiplin, dan bekerja sama, baik luring maupun daring.`,
  `Perkembangan kecerdasan buatan (Artificial Intelligence), membantu manusia menyelesaikan pekerjaan lebih efisien. Namun, pengguna harus memahami etika, keamanan, dan privasi sebelum memanfaatkan teknologi, agar manfaatnya dirasakan bertanggung jawab.`,
  `Keamanan informasi berperan penting dalam melindungi data pengguna. Gunakan kata sandi kuat, autentikasi dua faktor (2FA), lalu, biasakan logout setelah selesai menggunakan sistem. Langkah sederhana ini mengurangi risiko penyalahgunaan akun pengguna.`,
  `Internet menjadi sarana utama mencari informasi, belajar, bekerja, dan berkomunikasi. Pengguna perlu membedakan informasi benar dari berita palsu (hoaks). Sikap kritis, teliti, serta bertanggung jawab membantu menciptakan lingkungan digitalnya sehat.`,
  `Pemrograman komputer melatih kemampuan berpikir logis, sistematis, dan terstruktur. Setiap masalah dapat diselesaikan melalui analisis, penyusunan algoritma, implementasi program, hingga evaluasi hasilnya. Latihan konsisten meningkatkan kemampuannya.`,
  `Mahasiswa tidak hanya membutuhkan kemampuan akademik, tetapi juga keterampilan komunikasi, kepemimpinan, dan kerja sama. Dunia kerja menghargai individu yang mampu beradaptasi, berpikir kritis, serta menyelesaikan masalah dengan efektif, sehari-hari.`,
  `Aplikasi berbasis web semakin banyak digunakan karena dapat diakses melalui berbagai perangkat tanpa instalasi. Pengguna cukup membuka browser, memasukkan alamat situs, lalu melakukan login. Kemudahan ini, membuat layanan digital berkembang cepatnya.`,
  `Analisis data menjadi kompetensi penting pada era digital. Informasi dari proses pengolahan data membantu pengambilan keputusan, lebih tepat. Kemampuan menggunakan Python, R, atau SQL memberikan nilai tambah, bagi mahasiswa maupun profesional bidang.`,
  `Perkembangan teknologi komunikasi memungkinkan kolaborasi tanpa dibatasi jarak maupun waktu. Berbagai platform konferensi video, layanan penyimpanan awan (cloud), dan aplikasi pesan instan mempermudah koordinasi, pekerjaan diselesaikan lebih efektif.`,
  `Kesehatan mental merupakan aspek penting dalam kehidupan. Aktivitas belajar atau bekerja terlalu padat dapat menyebabkan kelelahan dan stres. Oleh sebab itu, setiap orang perlu beristirahat, berolahraga, mengatur waktu, serta menjaga keseimbangannya.`
];

// Ambil paragraf yang tersimpan, atau pilih acak baru
let REFERENCE = sessionStorage.getItem('referenceText');
if (!REFERENCE) {
  REFERENCE = PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)];
  sessionStorage.setItem('referenceText', REFERENCE);
}

// ── STATE ────────────────────────────────────────────────────
let keystrokes      = [];
let pressMap        = {};
let sessionStart    = null;
let isActive        = false;
let isDone          = false;

// Pelacak inaktivitas
let inactivityStart = null;
let totalInactMs    = 0;
let inactivityTimer = null;
const IDLE_THRESHOLD = 2000; // ms tanpa ketukan = idle

// ── ELEMEN DOM ───────────────────────────────────────────────
const area = document.getElementById('typingArea');

// ── INIT ─────────────────────────────────────────────────────
renderReference('');

// Update counter total karakter jika elemen ada
const charTotalEl = document.getElementById('charTotal');
if (charTotalEl) charTotalEl.textContent = REFERENCE.length;

area.setAttribute('maxlength', REFERENCE.length);

// ── RENDER TEKS REFERENSI ────────────────────────────────────
function renderReference(typed) {
  const refEl = document.getElementById('refText');
  let html = '';

  for (let i = 0; i < REFERENCE.length; i++) {
    const ch = REFERENCE[i] === ' ' ? '&nbsp;' : REFERENCE[i];
    if (i < typed.length) {
      const cls = typed[i] === REFERENCE[i] ? 'correct' : 'wrong';
      html += `<span class="ref-char ${cls}">${ch}</span>`;
    } else if (i === typed.length) {
      html += `<span class="ref-char current">${ch}</span>`;
    } else {
      html += `<span class="ref-char">${ch}</span>`;
    }
  }

  refEl.innerHTML = html;

  // Progress bar teks
  const pct = Math.min(100, (typed.length / REFERENCE.length) * 100);
  document.getElementById('progressBar').style.width = pct + '%';

  // Counter karakter
  const cp = document.getElementById('charProgress');
  if (cp) cp.textContent = Math.min(typed.length, REFERENCE.length);

  // Cek selesai
  if (typed.length >= REFERENCE.length && !isDone) {
    finishSession(typed);
  }
}

// ── KEYSTROKE CAPTURE ────────────────────────────────────────
area.addEventListener('keydown', (e) => {
  if (isDone) return;
  if (!isActive) startSession();
  
  resetInactivityTimer();
  
  pressMap[e.code] = performance.now();
});

area.addEventListener('keyup', (e) => {
  if (isDone) return;
  const t = performance.now();

  if (pressMap[e.code] !== undefined) {
    // const t = performance.now();
    const holdTime = t - pressMap[e.code];
    keystrokes.push({
      key:         e.key,
      pressTime:   pressMap[e.code],
      releaseTime: t,
      holdTime:    holdTime
    });
    delete pressMap[e.code];
    updateStats();
  }
  renderReference(area.value);
});

area.addEventListener('input', () => {

  if (!isDone) renderReference(area.value);
});

// ── PELACAK INAKTIVITAS ──────────────────────────────────────
function resetInactivityTimer() {
  if (inactivityStart !== null) {
    totalInactMs   += performance.now() - inactivityStart;
    inactivityStart = null;
  }
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    inactivityStart = performance.now();
  }, IDLE_THRESHOLD);
}

// ── SESSION START ────────────────────────────────────────────
function startSession() {
  isActive     = true;
  sessionStart = performance.now();
  document.getElementById('statusDot').classList.add('active');
  document.getElementById('statusText').textContent = 'Merekam ketikan...';
}

// ── SELESAI MENGETIK ─────────────────────────────────────────
function finishSession(typed) {
  isDone = true;
  clearTimeout(inactivityTimer);

  // Hitung sisa inaktif jika masih berjalan
  if (inactivityStart !== null) {
    totalInactMs   += performance.now() - inactivityStart;
    inactivityStart = null;
  }

  // area.setAttribute('readonly', true);
  document.getElementById('statusText').textContent = 'Menganalisis...';
  document.getElementById('statusDot').classList.remove('active');

  if (keystrokes.length < 10) {
    document.getElementById('statusText').textContent = 'Data terlalu sedikit';
    return;
  }

  const features = extractFeatures(keystrokes);

  // Hitung akurasi pengetikan
  let correct = 0;
  for (let i = 0; i < Math.min(typed.length, REFERENCE.length); i++) {
    if (typed[i] === REFERENCE[i]) correct++;
  }
  const acc = Math.round((correct / REFERENCE.length) * 100);

  updateStats();

  // Simpan ke sessionStorage
  sessionStorage.setItem('stressFeatures', JSON.stringify(features));
  sessionStorage.setItem('stressConfidence', acc);
  sessionStorage.setItem('sessionTime', new Date().toISOString());

  // Kirim ke API lalu aktifkan tombol
  (async () => {
    const result = await classifyStress(features);
    sessionStorage.setItem('stressResult', JSON.stringify(result));
    document.getElementById('statusText').textContent =
      'Selesai — ' + result.stress;

    const btn = document.getElementById('btnResult');
    if (btn) {
      btn.disabled    = false;
      btn.textContent = 'Cek Hasil →';
    }
  })();
}

// ── PINDAH KE HALAMAN HASIL ──────────────────────────────────
function goToResult() {
  window.location.href = 'Result.html';
}

function finishTyping() { goToResult(); }

// ── EKSTRAKSI FITUR ───────────────────────────────────────────
// Fitur sesuai FEATURE_COLS di notebook (tanpa avg_mouse_speed, Fatigue, PAM)
function extractFeatures(buf) {
  // Hold time dari pressTime & releaseTime
  const holds = buf.map(k => k.holdTime).filter(h => h > 0 && h < 2000);

  // Flight time: jeda antar ketukan
  const flights = [];
  for (let i = 1; i < buf.length; i++) {
    const f = buf[i].pressTime - buf[i-1].pressTime;
    if (f > 0 && f < 5000) flights.push(f);
  }

  const holdMean   = mean(holds);
  const holdStd    = std(holds);
  // const holdCv     = holdMean > 0 ? holdStd / holdMean : 0;   // koefisien variasi

  const flightMean = flights.length ? mean(flights) : 0;
  const flightStd  = flights.length ? std(flights)  : 0;
  // const flightCv   = flightMean > 0 ? flightStd / flightMean : 0;

  const keyCount       = buf.length;
  const backspaceCount = buf.filter(k => k.key === 'Backspace').length;
  const backspaceRatio = keyCount > 0 ? backspaceCount / keyCount : 0;

  // Typing speed: ketukan per detik selama sesi
  const elapsedSec  = sessionStart
    ? (performance.now() - sessionStart) / 1000
    : 1;
  const typingSpeed = elapsedSec > 0 ? keyCount / elapsedSec : 0;

  const totalInactDuration = totalInactMs / 1000; // konversi ke detik

  // Waktu sesi
  const daylightEncoded = getDaylightValue();

  return {
    // 12 fitur sesuai FEATURE_COLS notebook
    total_keystrokes:     keyCount,
    backspace_count:      backspaceCount,
    backspace_ratio:      parseFloat(backspaceRatio.toFixed(4)),
    hold_time_mean:       parseFloat(holdMean.toFixed(2)),
    hold_time_std:        parseFloat(holdStd.toFixed(2)),
    // hold_time_cv:         parseFloat(holdCv.toFixed(4)),
    flight_time_mean:     parseFloat(flightMean.toFixed(2)),
    flight_time_std:      parseFloat(flightStd.toFixed(2)),
    // flight_time_cv:       parseFloat(flightCv.toFixed(4)),
    // typing_speed:         parseFloat(typingSpeed.toFixed(4)),
    total_inact_duration: parseFloat(totalInactDuration.toFixed(2)),
    Daylight_Encoded:     daylightEncoded
  };
}

// ── KLASIFIKASI — FETCH KE FLASK API ─────────────────────────
async function classifyStress(features) {
  // Payload sesuai FEATURE_COLS notebook — tanpa avg_mouse_speed, Fatigue, PAM
  const payload = {
    total_keystrokes:     features.total_keystrokes,
    backspace_count:      features.backspace_count,
    backspace_ratio:      features.backspace_ratio,
    hold_time_mean:       features.hold_time_mean,
    hold_time_std:        features.hold_time_std,
    // hold_time_cv:         features.hold_time_cv,
    flight_time_mean:     features.flight_time_mean,
    flight_time_std:      features.flight_time_std,
    // flight_time_cv:       features.flight_time_cv,
    // typing_speed:         features.typing_speed,
    total_inact_duration: features.total_inact_duration,
    Daylight_Encoded:     features.Daylight_Encoded
  };

  try {
    const response = await fetch('http://localhost:5000/predict', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    if(!response.ok){
    throw new Error("Backend Error");
    } 
    
    const result = await response.json();
    // Backend mengembalikan: { stress: 'Stres'/'Tidak Stres', probability: 0.xx }
    // sessionStorage.setItem('stressProbability', result.probability ?? 0);
    return result;

  } catch (err) {
    console.error('Gagal menghubungi backend:', err);
    // Fallback rule-based jika API offline
    const label = classifyStressFallback(features);
    return { stress: label, confidence: "-" };
  }
}

// ── FALLBACK RULE-BASED (jika API offline) ───────────────────
function classifyStressFallback(f) {
  let score = 0;
  // if (f.hold_time_cv > 0.5)          score += 2; // ketikan tidak konsisten
  // if (f.flight_time_cv > 0.6)        score += 2; // ritme tidak teratur
  if (f.backspace_ratio > 0.08)      score += 2; // banyak koreksi
  if (f.hold_time_mean < 80)         score += 1; // terlalu cepat menekan
  // if (f.typing_speed < 0.5 ||
  //     f.typing_speed > 8)            score += 1; // kecepatan tidak normal
  if (f.total_inact_duration > 30)   score += 1; // sering berhenti
  return score >= 3 ? 'Stres' : 'Tidak Stres';
}

// ── WAKTU SESI (Daylight) ────────────────────────────────────
// 0 = Pagi (05–11), 1 = Siang (11–17), 2 = Malam (17–05)
function getDaylightValue() {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 11) return 0;
  if (hour >= 11 && hour < 17) return 1;
  return 2;
}

// ── STATISTIK REAL-TIME ──────────────────────────────────────
// Label chip disesuaikan dengan fitur model yang aktual
function updateStats() {
  const n = keystrokes.length;
  document.getElementById('keyCount').textContent = n;
  if (n < 2) return;

  const holds = keystrokes.map(k => k.holdTime);
  const holdAvgMs = mean(holds);
  const holdStd = std(holds);

  const flights = [];
  for (let i = 1; i < keystrokes.length; i++) {
    const f = keystrokes[i].pressTime - keystrokes[i - 1].pressTime;
    if (f > 0 && f < 5000) {
        flights.push(f);
    }
  }

  const flightAvgMs = flights.length ? mean(flights) : 0;
  const flightStd = flights.length ? std(flights) : 0;

  const bsCount  = keystrokes.filter(k => k.key === 'Backspace').length;
  const inactSec = (totalInactMs / 1000).toFixed(1);

  const elapsedMin = sessionStart
    ? (performance.now() - sessionStart) / 60000
    : 0;
  const speed = elapsedMin > 0 ? Math.round(n / elapsedMin) : 0;

  // Stat-chip bawah textarea
  document.getElementById('holdAvg').textContent    = Math.round(holdAvgMs);   // Hold Time (ms)
  document.getElementById('flightAvg').textContent  = Math.round(flightAvgMs); // Flight Time (ms)
  // document.getElementById('typingSpeed').textContent = speed;

  // Metrik sidebar/result (jika elemen ada)
  const mHold    = document.getElementById('mHold');
  const mFlight  = document.getElementById('mFlight');
  const mHoldStd = document.getElementById('mHoldStd');
  const mFlightStd = document.getElementById("mFlightStd");
  const mVar     = document.getElementById('mVar');
  const mInact   = document.getElementById('mInact');

  if (mHold)    mHold.innerHTML    = `${Math.round(holdAvgMs)}<span class="metric-unit">ms</span>`;
  if (mFlight)  mFlight.innerHTML  = `${Math.round(flightAvgMs)}<span class="metric-unit">ms</span>`;
  if (mHoldStd) mHoldStd.innerHTML = `${holdStd.toFixed(1)}<span class="metric-unit">ms</span>`;
  if (mFlightStd) mFlightStd.innerHTML = `${flightStd.toFixed(1)}<span class="metric-unit">ms</span>`;
  if (mVar)     mVar.textContent   = n;
  if (mInact)   mInact.innerHTML   = `${inactSec}<span class="metric-unit">dtk</span>`;
}

// ── UTILS ────────────────────────────────────────────────────
function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function std(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
}
