import tensorflow as tf
from keras.preprocessing.image import img_to_array
from keras.models import load_model
import numpy as np
import cv2
import requests

import operator
import os

UPLOAD_FOLDER = '/home/ubuntu/server/uploads'

from flask import Flask, request    
from werkzeug.utils import secure_filename
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route("/")
def index():
    return "asdf"

@app.route("/process_image", methods=["POST"])
def process_image():
    if (request.method == "POST"):
        if (request.files.get("picture") is not None):
            fil = request.files["picture"]
            filename = secure_filename(fil.filename)
            picstr = request.files["picture"].read()
            npimg = np.fromstring(picstr, np.uint8)
            print("DOES IT CV2")
            img = cv2.imdecode(npimg, 1)
            print("DOES IT GET HERE")
            image = cv2.resize(img, (28, 28))
            image = image.astype("float") / 255.0
            image = img_to_array(image)
            image = np.expand_dims(image, axis=0)
            label = "asdf"
            MODEL = "disasters.model"
            model = load_model(MODEL)
            pred = model.predict(image)[0]
            print(pred)
            loc = request.form["location.coordinates"]
            index, value = max(enumerate(pred), key=operator.itemgetter(1))
            print("index: {}, value: {}".format(index, value))
            fire = "false"
            medical = "false"
            if (index == 0):
                label = "housefire"
                fire = "true"
            elif (index == 1):
                label = "forestfire"
                fire = "true"
            elif (index == 2):
                label = "powerline"
                fire = "true"
            else:
                label = "caraccident"        
                medical = "true"


            headers = {
                'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik5FWTBPVVV3TVRSRU5qUTRSVUZDTkVJd01rUTBSVEUwUVRJMFF6ZzRSVGc1T0RBMFJEWXhOUSJ9.eyJodHRwOi8vY2xpZW50LW5hbWUiOiJIQUNLX1VWQSIsImlzcyI6Imh0dHBzOi8vbG9naW4tc2FuZGJveC5zYWZldHJlay5pby8iLCJzdWIiOiJzbXN8NWFiNjgxZTZhNjgwM2E5MTkxMWUzZmJkIiwiYXVkIjpbImh0dHBzOi8vYXBpLXNhbmRib3guc2FmZXRyZWsuaW8iLCJodHRwczovL3NhZmV0cmVrLXNhbmRib3guYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTUyMTkzNzk1OSwiZXhwIjoxNTIxOTczOTU5LCJhenAiOiJtNXFYRjV6dE9kVDRjZFF0VWJaVDJnckJoRjE4N3Z3NiIsInNjb3BlIjoib3BlbmlkIHBob25lIG9mZmxpbmVfYWNjZXNzIn0.cNHgoRjcKlLPfE0XvwsjFqEMPXhwoWFoIAEC1vjdqe-n_Hi9pgzlf-a8WaN6ph-mcrBO_gQJY1P_-ZJw6UwnyqkuKC7FhHZWYAqF_DPj7dtIXmBo-aBICoyFdGLQpE7TJmNmpJsv3D5Brrays2RAbclC0eMY687xkZk30g2VXPJQuhtcQ0ks3K1qfzrJnyJXzWv1t2g4SFLn4W_Zdxd2xMTlk-w185UZWHX3HYUJ2SJGyM7VrqypYMabTbYZav6A-0sYu-9Nvw4UewYTwGvsR3Tnczk3EB3G8aX3OpKFFoRuyRameLSQ9bmY2ziel6YXsTWIJkKEAtzHW83UbhcVHw',
                'Content-Type': 'application/json',
            }

            data = '{"services": {"police": true,"fire": %s,"medical": %s},"location.coordinates":%s}' % (fire, medical, loc)
            print(data)

            response = requests.post('https://api-sandbox.safetrek.io/v1/alarms', headers=headers, data=data)

            fil.seek(0, 0)
            fil.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

            print(response.text)
            
            return response.text
        else:
            return "{}"
    else:
        return "other\n"


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
