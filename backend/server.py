from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/phrase", methods=['GET'])
def get_phrase():
    data = {
        "phrase": "Hello from the Flask server!"
    }
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)