const canvas = document.getElementById("canvas");
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