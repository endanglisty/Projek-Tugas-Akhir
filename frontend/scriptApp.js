// ── KONFIGURASI ──────────────────────────────────────────────
const PARAGRAPHS = [
  `Gambar tersebut muncul pada window yang berbeda sebab pada Open2ActionPerformed() objek baru dari kelas FormGambar menampilkan gambar ke window/form. Ukuran gambar diubah agar sesuai dengan lblGambar dan hasil resize dipasang pada komponen lblGambar.`,
  `Engine: Game dikembangkan menggunakan Unity Engine dengan bahasa pemrograman C# sebagai bahasa utama dalam pembuatan logika permainan. Asset grafis yang digunakan berupa sprite 2D, sedangkan efek suara digunakan untuk meningkatkan pengalaman bermain.`,
  `Implementasi karakter dilakukan menggunakan script PlayerMovement, untuk mengatur perpindahan player mulai dari melompat, berjalan, saat mendarat dari lompatan, dan menyerang. Serta PlayerAttack yang berfungsi untuk menggerakkan serangan bola player.`,
  `Berdasarkan pengujian aplikasi Vigenere Cipher telah menjalankan proses enkripsi dan dekripsi sesuai dengan algoritma Vigenere Cipher. Saat ciphertext didekripsi key yang sama, program berhasil mengembalikan pesan menjadi "sistem keamanan informasi".`,
  `ActionScript ini digunakan pada scene Quiz untuk mengontrol interaksi pengguna dalam menjawab soal. Sistem juga melakukan pengecekan jawaban dan menambahkan skor secara otomatis sebelum berpindah ke soal berikutnya melalui MovieClip(root).skor += 1;.`
];

// Ambil paragraf yang tersimpan, atau pilih acak baru
let REFERENCE = sessionStorage.getItem('referenceText');
if (!REFERENCE) {
  REFERENCE = PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)];
  sessionStorage.setItem('referenceText', REFERENCE);
}

// ── STATE ────────────────────────────────────────────────────
let keystrokes    = [];
let pressMap      = {};
let sessionStart  = null;
let isActive      = false;
let isComplete    = false;  // status "teks saat ini sudah lengkap" — bisa berubah-ubah (naik/turun)
let isSubmitting  = false;  // mencegah interaksi ganda saat proses kirim ke API

// Pelacak inaktivitas
let inactivityStart = null;
let totalInactMs    = 0;
let inactivityTimer = null;
const IDLE_THRESHOLD = 2000; // ms tanpa ketukan = idle

// ── ELEMEN DOM ───────────────────────────────────────────────
const area = document.getElementById('typingArea');

// ── INIT ─────────────────────────────────────────────────────
updateReferenceDisplay('');

// Update counter total karakter jika elemen ada
const charTotalEl = document.getElementById('charTotal');
if (charTotalEl) charTotalEl.textContent = REFERENCE.length;

area.setAttribute('maxlength', REFERENCE.length);

// ── TAMPILAN WARNA TEKS REFERENSI (murni visual, tidak memicu proses selesai) ──
function updateReferenceDisplay(typed) {
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
}

// ── CEK STATUS LENGKAP & TOGGLE TOMBOL "CEK HASIL" ─────────────
function checkCompletion(typed) {
  const complete = typed.length >= REFERENCE.length;
  if (complete !== isComplete) {
    isComplete = complete;
    const btn = document.getElementById('btnResult');
    if (btn) {
      btn.disabled = !isComplete || isSubmitting;
    }
  }
}

// ── KEYSTROKE CAPTURE ────────────────────────────────────────
area.addEventListener('keydown', (e) => {
  if (isSubmitting) return; // kunci hanya saat proses kirim ke API sedang berlangsung
  if (!isActive) startSession();

  resetInactivityTimer(); // Mereset timer untuk mendeteksi waktu tidak aktif (idle)
  pressMap[e.code] = performance.now(); // Menyimpan waktu saat tombol ditekan
});

// event saat tombol dilepas
area.addEventListener('keyup', (e) => {
  if (isSubmitting) return;
  const t = performance.now();

  // Memastikan tombol sebelumnya telah tercatat saat keydown
  if (pressMap[e.code] !== undefined) {
    const holdTime = t - pressMap[e.code];
    keystrokes.push({ // Menyimpan data keystroke ke dalam array
      key:         e.key,
      pressTime:   pressMap[e.code],
      releaseTime: t,
      holdTime:    holdTime
    });
    delete pressMap[e.code];
    updateStats();
  }

  // Memperbarui tampilan teks referensi
  updateReferenceDisplay(area.value);
  checkCompletion(area.value);
});

//event saat isi area pengetikan berubah
area.addEventListener('input', () => {
  if (isSubmitting) return;
  updateReferenceDisplay(area.value);
  checkCompletion(area.value);
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

// ── KLIK TOMBOL "CEK HASIL" ──────────────────────────────────
function finishTyping() {
  if (!isComplete || isSubmitting) return; // safety, seharusnya tombol sudah disabled
  finishSession(area.value);
}

// ── PROSES ANALISIS (dipicu oleh klik tombol) ──
function finishSession(typed) {
  isSubmitting = true;
  clearTimeout(inactivityTimer);

  // Hitung sisa inaktif jika masih berjalan
  if (inactivityStart !== null) {
    totalInactMs   += performance.now() - inactivityStart;
    inactivityStart = null;
  }

  // area.setAttribute('readonly', true);
  document.getElementById('statusText').textContent = 'Menganalisis...';
  document.getElementById('statusDot').classList.remove('active');

  const btn = document.getElementById('btnResult');
  if (btn) btn.disabled = true;

  if (keystrokes.length < 10) {
    document.getElementById('statusText').textContent = 'Data terlalu sedikit';
    isSubmitting = false;
    if (btn) btn.disabled = !isComplete;
    return;
  }

  const features = extractFeatures(keystrokes);

  // Hitung akurasi pengetikan
  let correct = 0;
  for (let i = 0; i < Math.min(typed.length, REFERENCE.length); i++) {
    if (typed[i] === REFERENCE[i]) correct++;
  }
  const acc = Math.round((correct / REFERENCE.length) * 100);

  // Simpan ke sessionStorage
  sessionStorage.setItem('stressFeatures', JSON.stringify(features));
  sessionStorage.setItem('stressConfidence', acc);
  sessionStorage.setItem('sessionTime', new Date().toISOString());

  // Kirim ke API, lalu pindah ke halaman hasil
  (async () => {
    const result = await classifyStress(features);
    sessionStorage.setItem('stressResult', JSON.stringify(result));
    document.getElementById('statusText').textContent =
      'Selesai — ' + result.stress;
    goToResult();
  })();
}

// ── PINDAH KE HALAMAN HASIL ──────────────────────────────────
function goToResult() {
  window.location.href = 'Result.html';
}

// ── EKSTRAKSI FITUR ───────────────────────────────────────────
// Fitur sesuai FEATURE_COLS di notebook
function extractFeatures(buf) {
  // Hold time dari pressTime & releaseTime
  const holds = buf.map(k => k.holdTime).filter(h => h > 0 && h < 2000);

  // Flight time: jeda antar ketukan
  const flights = [];
  for (let i = 1; i < buf.length; i++) {
    const f = buf[i].pressTime - buf[i-1].pressTime;
    if (f > 0 && f < 5000) flights.push(f);
  }

  // Menghitung rata-rata dan std hold time
  const holdMean   = mean(holds);
  const holdStd    = std(holds);

  // Menghitung rata-rata dan std flight time
  const flightMean = flights.length ? mean(flights) : 0;
  const flightStd  = flights.length ? std(flights)  : 0;

  // Jumlah seluruh penekanan tombol
  const keyCount       = buf.length; 
  const backspaceCount = buf.filter(k => k.key === 'Backspace').length; // Menghitung jumlah tombol Backspace
  const backspaceRatio = keyCount > 0 ? backspaceCount / keyCount : 0;

  // total_inact_duration dikirim dalam MILIDETIK (ms), sesuai satuan saat training
  const totalInactDurationMs = totalInactMs;

  // Waktu sesi
  const daylightEncoded = getDaylightValue();

  // Mengembalikan seluruh fitur yang akan dikirim ke backend
  return {
    total_keystrokes:     keyCount,
    backspace_count:      backspaceCount,
    backspace_ratio:      parseFloat(backspaceRatio.toFixed(4)),
    hold_time_mean:       parseFloat(holdMean.toFixed(2)),
    hold_time_std:        parseFloat(holdStd.toFixed(2)),
    flight_time_mean:     parseFloat(flightMean.toFixed(2)),
    flight_time_std:      parseFloat(flightStd.toFixed(2)),
    total_inact_duration: parseFloat(totalInactDurationMs.toFixed(2)),
    Daylight_Encoded:     daylightEncoded
  };
}

// ── KLASIFIKASI — FETCH KE FLASK API ─────────────────────────
async function classifyStress(features) {
  const payload = { // menyusun sesuai urutan fitur model
    total_keystrokes:     features.total_keystrokes,
    backspace_count:      features.backspace_count,
    backspace_ratio:      features.backspace_ratio,
    hold_time_mean:       features.hold_time_mean,
    hold_time_std:        features.hold_time_std,
    flight_time_mean:     features.flight_time_mean,
    flight_time_std:      features.flight_time_std,
    total_inact_duration: features.total_inact_duration,
    Daylight_Encoded:     features.Daylight_Encoded
  };

  const startTime = performance.now(); //ukur waktu mulai sistem
  try { // kirim ke flask
    console.log("Mulai mengirim request...");

    const response = await fetch('http://localhost:5000/predict', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    const endTime = performance.now(); //ukur akhir waktu sistem
    const predictionTime = endTime - startTime;  //prediksi waktu per sesi

    console.log("Response diterima:", response.status);
    // tampilkan pesan
    console.log(
        "Waktu respons prediksi:",
        predictionTime.toFixed(2),
        "ms"
    );

    // tampilkan error jika gagal
    if (!response.ok) {
      throw new Error("Backend Error");
    }

    const result = await response.json();
    return result; // Backend mengembalikan: stress: 'Stres'/'Tidak Stres', probability: 0.xx% 

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
  if (f.backspace_ratio > 0.08)         score += 2; // banyak koreksi
  if (f.hold_time_mean < 80)            score += 1; // terlalu cepat menekan
  if (f.total_inact_duration > 30000)   score += 1; // >30 detik (dalam ms), sering berhenti
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
function updateStats() {
  const n = keystrokes.length;
  document.getElementById('keyCount').textContent = n;
  if (n < 2) return;

  // Menghitung rata-rata dan standar deviasi Hold Time
  const holds = keystrokes.map(k => k.holdTime);
  const holdAvgMs = mean(holds);
  const holdStd = std(holds);

  // Menghitung rata-rata dan standar deviasi Flight Time
  const flights = [];
  for (let i = 1; i < keystrokes.length; i++) {
    const f = keystrokes[i].pressTime - keystrokes[i - 1].pressTime;
    if (f > 0 && f < 5000) {
      flights.push(f);
    }
  }

  const flightAvgMs = flights.length ? mean(flights) : 0;
  const flightStd = flights.length ? std(flights) : 0;

  const inactSec = (totalInactMs / 1000).toFixed(1); // ubah waktu tidak aktif dari ms ke detik

  // Stat-chip bawah textarea
  document.getElementById('holdAvg').textContent    = Math.round(holdAvgMs);
  document.getElementById('flightAvg').textContent  = Math.round(flightAvgMs);

  // Mengambil elemen HTML berdasarkan id
  const mHold      = document.getElementById('mHold');
  const mFlight    = document.getElementById('mFlight');
  const mHoldStd   = document.getElementById('mHoldStd');
  const mFlightStd = document.getElementById('mFlightStd');
  const mVar       = document.getElementById('mVar');
  const mInact     = document.getElementById('mInact');

  // Menampilkan metrik masing-masing fitur
  if (mHold)      mHold.innerHTML      = `${Math.round(holdAvgMs)}<span class="metric-unit">ms</span>`;
  if (mFlight)    mFlight.innerHTML    = `${Math.round(flightAvgMs)}<span class="metric-unit">ms</span>`;
  if (mHoldStd)   mHoldStd.innerHTML   = `${holdStd.toFixed(1)}<span class="metric-unit">ms</span>`;
  if (mFlightStd) mFlightStd.innerHTML = `${flightStd.toFixed(1)}<span class="metric-unit">ms</span>`;
  if (mVar)       mVar.textContent     = n;
  if (mInact)     mInact.innerHTML     = `${inactSec}<span class="metric-unit">dtk</span>`;
}

// ── UTILS ────────────────────────────────────────────────────
// Menghitung nilai rata-rata (mean) dari sebuah array
function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// Menghitung standar deviasi dari sebuah array
function std(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr); // Hitung nilai rata-rata
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length); // Hitung standar deviasi
}