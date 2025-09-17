# proposal_api.py
from flask import Flask, request, jsonify
from detect_proposal_form import predict_proposal_form
import os

app = Flask(__name__)

@app.route("/check-proposal-form", methods=["POST"])
def check_proposal_form():
    data = request.get_json()
    file_path = data.get("filePath")
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "Invalid or missing filePath"}), 400

    try:
        result = predict_proposal_form(file_path)
        return jsonify({"isProposalForm": bool(result)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001)
