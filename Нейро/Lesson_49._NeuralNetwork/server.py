from NeuralNetwork import training, guess

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/call_function', methods=['POST'])
def call_function():
    data = request.json
    function_name = data["function"]
    args = data["args"]

    if function_name == "training":
        training()
        return jsonify({"result": "Нейронка обучена!"})
    elif function_name == "guess":
        result = guess(args)
        return jsonify({"result": result})
    else:
        return jsonify({"error": "Функция не найдена"}), 404


if __name__ == '__main__':
    app.run(port=5000)

