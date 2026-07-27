import joblib
import json
import numpy as np
import pandas as pd
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

# Inisialisasi aplikasi Flask
app = Flask(__name__)
CORS(app)

# Memuat model SVM
model = joblib.load('SVM_Model.pkl')

# Memuat urutan fitur yang digunakan saat pelatihan model
with open("feature_cols.json", "r") as f:
    feature_cols = json.load(f)

# Endpoint utama untuk memastikan API berjalan
@app.route("/")
def home():
    return jsonify({
        "message": "Stress Clasification API",
        "status": "running",
    })

# Endpoint untuk proses klasifikasi stres
@app.route("/predict", methods=["POST"])

def predict():
    data = request.get_json() # Menerima data fitur dari frontend dalam format JSON
    
    # Validasi data masuk
    required = [
        "total_keystrokes",
        "backspace_count",
        "backspace_ratio",
        "hold_time_mean",
        "hold_time_std",
        "flight_time_mean",
        "flight_time_std",
        "total_inact_duration",
        "Daylight_Encoded"
    ]

    # Validasi kelengkapan data masukan
    for field in required:
        if field not in data:
            return jsonify({
                "error": f"{field} tidak ditemukan"
            }), 400

    # if not data:
    #     return jsonify({
    #         "error": "Tidak ada data yang dikirim."
    #     }), 400
    
    print("Data diterima")
    print(data)

    try:
        # Menyusun data menjadi DataFrame sesuai format input model
        features = pd.DataFrame([{
            "total_keystrokes": data["total_keystrokes"],
            "backspace_count": data["backspace_count"],
            "backspace_ratio": data["backspace_ratio"],
            "hold_time_mean": data["hold_time_mean"],
            "hold_time_std": data["hold_time_std"],
            "flight_time_mean": data["flight_time_mean"],
            "flight_time_std": data["flight_time_std"],
            "total_inact_duration": data["total_inact_duration"],
            "Daylight_Encoded": data["Daylight_Encoded"]
        }])

        # Menyesuaikan urutan fitur dengan saat pelatihan model
        features = features[feature_cols]

        print("\n===== FEATURES =====")

        print("Features:")
        print(features)

        # Melakukan prediksi kelas menggunakan model SVM
        # pred = model.predict(features)[0]

        # Menghitung probabilitas setiap kelas
        proba = model.predict_proba(features)[0]
        classes = list(model.classes_)

        # mengubah label numerik menjadi label teks
        # prediction = "Tidak Stres" if pred == 0 else "Stres"
        # Tentukan prediksi dari proba tertinggi, BUKAN dari model.predict()
        pred_index = int(np.argmax(proba))
        pred = classes[pred_index]
        confidence = float(proba[pred_index])

        prediction = "Tidak Stres" if str(pred) in ("0", "0.0") else "Stres"
        
        # Menampilkan probabilitas hasil prediksi
        # print(f"Probabilitas -> Tidak Stres: {proba[0]:.4f} | Stres: {proba[1]:.4f}")

        # Mengambil confidence berdasarkan prediksi
        # pred_index = classes.index(pred) # Cari index prediksi di dalam classes_,
        # confidence = proba[pred]

        # if str(pred) in ("0", "Tidak Stres", "tidak stres", "0.0"):
        #     prediction = "Tidak Stres"
        # else:
        #     prediction = "Stres"

        print("Classes:", classes)
        print("Pred:", pred, "| Confidence:", confidence)

        # Mengirim hasil prediksi ke frontend dalam format JSON
        return jsonify({
            "stress": prediction,
            "confidence": round(confidence * 100, 2)
        })

    except Exception as e:

        traceback.print_exc()

        return jsonify({
            "error": str(e)
        }),400


if __name__ == "__main__":
    app.run(debug=True)

