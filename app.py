from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import json
import os

app = Flask(__name__)
app.secret_key = "man_eio_gateway_secret_key"  # Oturum yönetimi için zorunludur

DATA_FILE = 'data.json'

def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

@app.route('/')
def login_page():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    muhendis = request.form.get('muhendis_adi')
    if muhendis:
        session['user'] = muhendis
        return redirect(url_for('index'))
    return redirect(url_for('login_page'))

@app.route('/panel')
def index():
    if 'user' not in session:
        return redirect(url_for('login_page'))
    return render_template('index.html', user=session['user'])

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login_page'))

@app.route("/api/data", methods=["GET"])
def get_data():
    knowledge_base = load_data()
    return jsonify({"knowledge_base": knowledge_base})

@app.route("/api/save-karne", methods=["POST"])
def save_karne():
    req_data = request.json
    knowledge_base = load_data()

    existing_index = next((i for i, item in enumerate(knowledge_base) if item.get("id") == req_data.get("id")), None)
    
    if existing_index is not None:
        knowledge_base[existing_index] = req_data
    else:
        knowledge_base.insert(0, req_data)

    save_data(knowledge_base)
    return jsonify({"status": "success", "message": "Karne başarıyla kaydedildi ve arşive eklendi!"})

@app.route("/api/request-support", methods=["POST"])
def request_support():
    req_data = request.json
    task_id = req_data.get("id")
    knowledge_base = load_data()

    for item in knowledge_base:
        if item.get("id") == task_id:
            item["durum"] = "Destek Bekleniyor 🛟"
            break

    save_data(knowledge_base)
    return jsonify({"status": "success", "message": "Destek talebi ilgili ekibe iletildi!"})

@app.route("/api/transfer-task", methods=["POST"])
def transfer_task():
    req_data = request.json
    task_id = req_data.get("id")
    yeni_muhendis = req_data.get("yeniMuhendis")
    knowledge_base = load_data()

    for item in knowledge_base:
        if item.get("id") == task_id:
            item["tamamlayanMühendis"] = yeni_muhendis
            item["durum"] = "Devredildi 🔄"
            break

    save_data(knowledge_base)
    return jsonify({"status": "success", "message": f"Madde başarıyla {yeni_muhendis} adlı mühendise aktarıldı!"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)