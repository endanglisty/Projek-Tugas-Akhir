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
//event saat tombol mulai ditekan
area.addEventListener('keydown', (e) => {
  if (isDone) return;
  if (!isActive) startSession();
  
  // Mereset timer untuk mendeteksi waktu tidak aktif (idle)
  resetInactivityTimer();
  // Menyimpan waktu saat tombol ditekan
  pressMap[e.code] = performance.now();
});

// event saat tombol dilepas
area.addEventListener('keyup', (e) => {
  if (isDone) return;
  const t = performance.now();

  // Memastikan tombol sebelumnya telah tercatat saat keydown
  if (pressMap[e.code] !== undefined) {
    const holdTime = t - pressMap[e.code];
    // Menyimpan data keystroke ke dalam array
    keystrokes.push({
      key:         e.key,
      pressTime:   pressMap[e.code],
      releaseTime: t,
      holdTime:    holdTime
    });
    delete pressMap[e.code]; // Membersihkan data sementara setelah Hold Time berhasil dihitung
    updateStats();
  }
  // Memperbarui tampilan teks referensi
  renderReference(area.value);
});

//event saat isi area pengetikan berubah
area.addEventListener('input', () => {

  if (isDone) return;
  const typed = area.value; // Mengambil teks yang sedang diketik pengguna
  const refEl = document.getElementById('refText'); // Mengambil elemen teks referensi
  let html = '';
  for (let i = 0; i < REFERENCE.length; i++) {
    // Mengubah spasi menjadi karakter HTML agar tetap terlihat
    const ch = REFERENCE[i] === ' ' ? '&nbsp;' : REFERENCE[i];
    if (i < typed.length) {
      // Memberi warna sesuai hasil perbandingan karakter
      html += `<span class="ref-char ${typed[i] === REFERENCE[i] ? 'correct' : 'wrong'}">${ch}</span>`;
    } else if (i === typed.length) {
      // Menandai posisi karakter berikutnya yang harus diketik
      html += `<span class="ref-char current">${ch}</span>`;
    } else {
       // Menampilkan karakter yang belum diketik
      html += `<span class="ref-char">${ch}</span>`;
    }
  }
  refEl.innerHTML = html;

  // Memperbarui progress bar berdasarkan jumlah karakter yang telah diketik
  document.getElementById('progressBar').style.width =
    Math.min(100, (typed.length / REFERENCE.length) * 100) + '%';
  const cp = document.getElementById('charProgress');
  if (cp) cp.textContent = Math.min(typed.length, REFERENCE.length);
});

// ── PELACAK INAKTIVITAS ──────────────────────────────────────
function resetInactivityTimer() {
  if (inactivityStart !== null) { //durasi idle dihitung ketika mulai mengatik
    totalInactMs   += performance.now() - inactivityStart;
    inactivityStart = null;
  }
  clearTimeout(inactivityTimer); //timer lama dibatalkan
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
function extractFeatures(buf) {
  // Hold time dari pressTime & releaseTime
  // Mengambil seluruh nilai Hold Time yang valid (0–2000 ms)
  const holds = buf.map(k => k.holdTime).filter(h => h > 0 && h < 2000);

  // Flight time (selisih waktu antar penekanan tombol)
  const flights = [];
  for (let i = 1; i < buf.length; i++) {
    const f = buf[i].pressTime - buf[i-1].pressTime;
    if (f > 0 && f < 5000) flights.push(f); // Hanya menyimpan nilai Flight Time yang valid
  }

  // Menghitung rata-rata dan standar deviasi Hold Time
  const holdMean   = mean(holds);
  const holdStd    = std(holds);

  // Menghitung rata-rata dan standar deviasi Flight Time
  const flightMean = flights.length ? mean(flights) : 0;
  const flightStd  = flights.length ? std(flights)  : 0;

  // Menghitung jumlah seluruh penekanan tombol
  const keyCount       = buf.length;

  // Menghitung jumlah tombol Backspace
  const backspaceCount = buf.filter(k => k.key === 'Backspace').length;
  const backspaceRatio = keyCount > 0 ? backspaceCount / keyCount : 0;   // Menghitung rasio penggunaan Backspace

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
  // Menyusun payload sesuai urutan fitur model SVM
  const payload = {
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

  try {
    // Mengirim data fitur ke API Flask
    const response = await fetch('http://localhost:5000/predict', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    // Menampilkan error jika backend gagal merespons
    if(!response.ok){
    throw new Error("Backend Error");
    } 
    
    const result = await response.json();
    // Backend mengembalikan: { stress: 'Stres'/'Tidak Stres', probability: 0.xx }
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
  if (f.backspace_ratio > 0.08)      score += 2; // banyak koreksi
  if (f.hold_time_mean < 80)         score += 1; // terlalu cepat menekan
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
  const n = keystrokes.length; // mnghitung jumlah ketukan
  document.getElementById('keyCount').textContent = n;
  if (n < 2) return;

  const holds = keystrokes.map(k => k.holdTime); // Mengambil seluruh Hold Time

  // Menghitung rata-rata dan standar deviasi Hold Time
  const holdAvgMs = mean(holds);
  const holdStd = std(holds);

  // Menghitung rata-rata dan standar deviasi Hold Time
  const flights = [];
  for (let i = 1; i < keystrokes.length; i++) {
    const f = keystrokes[i].pressTime - keystrokes[i - 1].pressTime;
    if (f > 0 && f < 5000) {
        flights.push(f);
    }
  }

  // Menghitung rata-rata dan standar deviasi Flight Time
  const flightAvgMs = flights.length ? mean(flights) : 0;
  const flightStd = flights.length ? std(flights) : 0;

  // Menghitung jumlah penggunaan Backspace
  const bsCount  = keystrokes.filter(k => k.key === 'Backspace').length;
  const inactSec = (totalInactMs / 1000).toFixed(1); // ubah waktu tidak aktif dari ms ke detik

  // Stat-chip bawah textarea
  document.getElementById('holdAvg').textContent    = Math.round(holdAvgMs);   // Hold Time (ms)
  document.getElementById('flightAvg').textContent  = Math.round(flightAvgMs); // Flight Time (ms)

  // Mengambil elemen HTML berdasarkan id
  const mHold    = document.getElementById('mHold');
  const mFlight  = document.getElementById('mFlight');
  const mHoldStd = document.getElementById('mHoldStd');
  const mFlightStd = document.getElementById("mFlightStd");
  const mVar     = document.getElementById('mVar');
  const mInact   = document.getElementById('mInact');

  if (mHold)    mHold.innerHTML    = `${Math.round(holdAvgMs)}<span class="metric-unit">ms</span>`; // Menampilkan rata-rata Hold Time (ms)
  if (mFlight)  mFlight.innerHTML  = `${Math.round(flightAvgMs)}<span class="metric-unit">ms</span>`; // rata rata flight time
  if (mHoldStd) mHoldStd.innerHTML = `${holdStd.toFixed(1)}<span class="metric-unit">ms</span>`; // std Hold Time
  if (mFlightStd) mFlightStd.innerHTML = `${flightStd.toFixed(1)}<span class="metric-unit">ms</span>`; // std Flight time
  if (mVar)     mVar.textContent   = n; //jumlah total penekanan tombol (keystroke)
  if (mInact)   mInact.innerHTML   = `${inactSec}<span class="metric-unit">dtk</span>`; // total durasi tidak aktif (idle time) dalam detik
}

// ── UTILS ────────────────────────────────────────────────────
// Menghitung nilai rata-rata (mean) dari sebuah array
function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// Menghitung standar deviasi dari sebuah array
function std(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);  // Hitung nilai rata-rata
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length); // Hitung standar deviasi
}
