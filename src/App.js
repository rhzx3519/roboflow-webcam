import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import './App.css';

var bounding_box_colors = {};

// Update the colors in this list to set the bounding box colors
var color_choices = [
  "#C7FC00",
  "#FF00FF",
  "#8622FF",
  "#FE0056",
  "#00FFCE",
  "#FF8000",
  "#00B7EB",
  "#FFFF00",
  "#0E7AFE",
  "#FFABAB",
  "#0000FF",
  "#CCCCCC",
];

function drawBoundingBoxes(ctx, user_confidence, predictions) {
  // For each prediction, choose or assign a bounding box color choice,
  // then apply the requisite scaling so bounding boxes appear exactly
  // around a prediction.

  // If you want to do anything with predictions, start from this function.
  // For example, you could display them on the web page, check off items on a list,
  // or store predictions somewhere.

  for (var i = 0; i < predictions.length; i++) {
    var confidence = predictions[i].confidence;

    if (confidence < user_confidence) {
      continue
    }

    if (predictions[i].class in bounding_box_colors) {
      ctx.strokeStyle = bounding_box_colors[predictions[i].class];
    } else {
      var color =
        color_choices[Math.floor(Math.random() * color_choices.length)];
      ctx.strokeStyle = color;
      // remove color from choices
      color_choices.splice(color_choices.indexOf(color), 1);

      bounding_box_colors[predictions[i].class] = color;
    }

    var prediction = predictions[i];
    var x = prediction.bbox.x - prediction.bbox.width / 2;
    var y = prediction.bbox.y - prediction.bbox.height / 2;
    var width = prediction.bbox.width;
    var height = prediction.bbox.height;

    ctx.rect(x, y, width, height);

    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fill();

    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = "4";
    ctx.strokeRect(x, y, width, height);
    ctx.font = "25px Arial";
    ctx.fillText(prediction.class + " " + Math.round(confidence * 100) + "%", x, y - 10);
  }
}


const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "environment"
};

const Camera = (props) => {
  const { confidence } = props;
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const [model, setModel] = useState(null)
  const [webcamPosition, setWebcamPosition] = useState({ x: 0, y: 0 });

  const onUserMedia = (stream) => {

  };

  useEffect(() => {
    const updateWebcamPosition = () => {
      const webcamElement = webcamRef.current.video;
      const boundingRect = webcamElement.getBoundingClientRect();
      setWebcamPosition({ x: boundingRect.x, y: boundingRect.y });
    };

    updateWebcamPosition();

    window.addEventListener('resize', updateWebcamPosition);

    return () => {
      window.removeEventListener('resize', updateWebcamPosition);
    };
  }, []);

  useEffect(() => {
    window.roboflow
      .auth({
        publishable_key: 'rf_U7AD2Mxh39N7jQ3B6cP8xAyufLH3',
      })
      .load({
        model: 'microsoft-coco',
        version: 9,
      })
      .then(function (m) {
        // Images must have confidence > CONFIDENCE_THRESHOLD to be returned by the model
        m.configure({ threshold: 0.1 });
        setModel(m)
      });
  }, []);

  useEffect(() => {
    if (!model) {
      return;
    }
    const webcam = webcamRef.current
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawVideoFrame = () => {
      canvas.width = webcam.video.videoWidth;
      canvas.height = webcam.video.videoHeight;

      // ctx.drawImage(webcam.video, 0, 0, canvas.width, canvas.height);

      model.detect(webcamRef.current.video).then(function (predictions) {

        drawBoundingBoxes(ctx, confidence, predictions)
      });

      requestAnimationFrame(drawVideoFrame);
    };

    drawVideoFrame();
  }, [model, confidence])



  return (
    <>
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        onUserMedia={onUserMedia}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          left: webcamPosition.x + 'px',
          top: webcamPosition.y + 'px',
        }}
      />
    </>
  );
};


function App() {
  const [confidence, setConfidence] = useState(0.6)

  const handleChange = (e) => {
    setConfidence(parseFloat(e.value))
  }

  return (
    <>
      <h1>Roboflow + Web JS Example 🚀</h1>
      <p>Roboflow enables you to build and run custom computer vision models in your browser, on your device (i.e. NVIDIA
        Jetson, Luxonis OAK, via Docker), and via API.
      </p>
      <p>The below example runs <a href="https://universe.roboflow.com/jacob-solawetz/microsoft-coco">Microsoft's
        COCO</a> model to identify common objects, which is one of 50,000 open source models ready to use on <a
          href="https://universe.roboflow.com">Roboflow Universe</a>
      </p>
      <p>Using the demo below, you can identify <a href="https://universe.roboflow.com/jacob-solawetz/microsoft-coco">80
        different objects</a> using your webcam, from people to chairs to cups.</p>
      <p id="loading">Loading...</p>

      <Camera confidence={confidence} />
      <section id="settings">
        <label for="confidence">Prediction Confidence %</label><br />
        <input type="range" min="0" max="1" step="0.01" defaultValue={"0.2"} onChange={handleChange} />
      </section>
    </>
  );
}

export default App;
