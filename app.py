from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
import joblib
import serial
import time
import os

# time.sleep(2)
# ser = serial.Serial('COM5', 9600, timeout=1 ) 
# time.sleep(2)
# ser.reset_input_buffer()

# print('Is COM5 open?', ser.isOpen())

app = Flask(__name__)

try:
    model = joblib.load('randomForestModel.joblib')
    print('Model successfully loaded...')
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    try:
        data = request.json
        features = data.get('features')

        if not features:
            return jsonify({'error': 'No features provided'}), 400

        features = np.array(features).reshape(1, -1)
        features = pd.DataFrame(features, columns=[
            'temperature_2m (°C)', 'relative_humidity_2m (%)', 'rain (mm)', 
            'surface_pressure (hPa)', 'cloud_cover (%)', 'wind_direction_10m (°)', 
            'snowfall(mm)', 'wind_speed(m/s)', 'wind_gust(m/s)'
        ]) 

        prediction = model.predict(features)[0]
        # if not ser.isOpen():
        #     ser.open()
        # print('com55 is open', ser.isOpen())
        # ser.write(f"{prediction}\n".encode('utf-8'))
        print(f"Predicted value {prediction} sent to Arduino via COM5")

        return jsonify({'prediction': prediction})
    
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'error': 'Prediction failed', 'details': str(e)}), 500

PORT = os.environ.get('PORT', 3000)
if __name__ == '__main__':
    # try:
    app.run(host='0.0.0.0', port=PORT, debug=True)
    # finally:
    #     if ser.is_open:
    #         ser.close()
