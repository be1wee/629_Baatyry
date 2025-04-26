const canvas = document.getElementById("canvas");
const runBtn = document.getElementById("runBtn");
const trainBtn = document.getElementById("trainBtn");
const ctx = canvas.getContext("2d");
let drawing = false;
let coord = { x: 0, y: 0 };

function resizeCanvas(){
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
};
resizeCanvas();
window.addEventListener('resize', resizeCanvas); 

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);

function getPosition(event) {
  coord.x = event.clientX - canvas.offsetLeft;
  coord.y = event.clientY - canvas.offsetTop;
}

function startDrawing(event) {
  drawing = true;
  getPosition(event);
}

function stopDrawing() {
  drawing = false;
}

function draw(event) {
  if (!drawing) return;
  ctx.beginPath();
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.moveTo(coord.x, coord.y);
  getPosition(event);
  ctx.lineTo(coord.x, coord.y);
  ctx.stroke();
}



document.getElementById('runBtn').onclick = function() {
    const sourceCanvas = document.getElementById('canvas');
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = 28;
    resizedCanvas.height = 28;
    const resizedCtx = resizedCanvas.getContext('2d');
    resizedCtx.drawImage(sourceCanvas, 0, 0, 28, 28);
  
    document.getElementById('compressedImg').src = resizedCanvas.toDataURL('image/png');
  };



  function scaleCanvasTo28x28(sourceCanvas) {    
    const scale = Math.min(28 / 500, 28 / 500);
    const scaledWidth = 500 * scale;
    const scaledHeight = 500 * scale;
    const offsetX = (28 - scaledWidth) / 2;
    const offsetY = (28 - scaledHeight) / 2;

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = 28;
    tmpCanvas.height = 28;
    const tmpContex = tmpCanvas.getContext('2d');
    
    tmpContex.drawImage(sourceCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
    let coords = findBox(tmpContex.getImageData(0, 0, 28, 28).data);

    let box_x = coords[2] - coords[0] + 1;
    let box_y = coords[3] - coords[1] + 1;

    let sx = (28 - box_x)/2;
    let sy = (28 - box_y)/2;

    ctx.drawImage(tmpCanvas, coords[0], coords[1], box_x, box_y, sx, sy, box_x, box_y);
    
    return ctx.getImageData(0, 0, 28, 28);
}

function findBox(img){
    let sx = 28; sy = 28; ex = 0; ey = 0;
    for(let i = 0; i < 28; ++i){
        for(let j = 0; j < 28; ++j){
            if(img[j + 28*i] == 0){
                continue;
            }
            if(j < sx) sx = j;
            if(j > ex) ex = j;
            if(i < sy) sy = i;
            if(i > ey) ey = i;
        }
    }
    if(sx - 2 >= 0 && ex + 2 < 28){
        sx -= 2;
        ex += 2;
    }else if(sx - 1 >= 0 && ex + 1 < 28){
        sx -= 1;
        ex += 1;
    }
    if(sy - 2 >= 0 && ey + 2 < 28){
        sy -= 2;
        ey += 2;
    }else if(sy - 1 >= 0 && ey + 1 < 28){
        sy -= 1;
        ey += 1;
    }
    let coords = [];
    coords.push(sx);
    coords.push(sy);
    coords.push(ex);
    coords.push(ey);
    return coords;
}
  


async function callPythonFunction(inputList, flag) {
  const data1 = {
    function: "guess",
    args: { inputList }
  };
  const data2 = {
    function: "training",
    args: {}
  };
  
  if (flag == 1)
  {
    const response = await fetch('http://localhost:5000/call_function', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data1)
    });
  }
  
  if (flag == 2)
    {
      
      const response = await fetch('http://localhost:5000/call_function', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data2)
      });
    }
    const result = await response.json();
    alert("Результат:", result.result);
}


trainBtn.addEventListener('click', function(event){
    callPythonFunction([],2);
});

runBtn.addEventListener('click', function(event){
    let imageData = scaleCanvasTo28x28(canvas);
    const uint8Array = imageData.data;
    const float32Array = new Float32Array(uint8Array.length);
    for (let i = 0; i < uint8Array.length; i++) {
      float32Array[i] = uint8Array[i] / 255.0;
    }
    console.log(float32Array);
    callPythonFunction(float32Array,1);
});

