const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const clusterButton = document.getElementById('clusterButton');
const input = document.getElementById('input');

function isNaturalNumber(value) {
    const number = Number(value);
    return Number.isInteger(number) && number > 0;
}
function resizeCanvas(){
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
};
resizeCanvas();
window.addEventListener('resize', resizeCanvas); 


let points = [];

canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    points.push({ x, y });

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'black';
    ctx.fill();
});

resetButton.addEventListener('click', function() {
    points = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function kMeans(points, k) {
    let centroids = [];
    for (let i = 0; i < k; i++) {
        centroids.push(points[i]);
    }

    let numbers_of_clusters = new Array(points.length).fill(0);
    let itr = true;

    while (itr) {
        itr = false;

        for (let i = 0; i < points.length; i++) {
            let minDist = Infinity;
            let closestCentroid = -1;

            for (let j = 0; j < k; j++) {
                const dist = Math.hypot(points[i].x - centroids[j].x, points[i].y - centroids[j].y);
                if (dist < minDist) {
                    minDist = dist;
                    closestCentroid = j;
                }
            }

            if (numbers_of_clusters[i] !== closestCentroid) {
                itr = true;
                numbers_of_clusters[i] = closestCentroid;
            }
        }

        for (let i = 0; i < k; i++) {
            let sumX = 0;
            let sumY = 0;
            let count = 0;

            for (let j = 0; j < points.length; j++) {
                if (numbers_of_clusters[j] === i) {
                    sumX += points[j].x;
                    sumY += points[j].y;
                    count++;
                }
            }

            if (count > 0) {
                centroids[i].x = sumX / count;
                centroids[i].y = sumY / count;
            }
        }
    }

    return { centroids, numbers_of_clusters: numbers_of_clusters };
}

function drawClusters(points, centroids, numbers_of_clusters) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < points.length; i++) {
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${numbers_of_clusters[i] * 360 / centroids.length}, 100%, 50%)`;
        ctx.fill();
    }

    for (let i = 0; i < centroids.length; i++) {
        ctx.beginPath();
        ctx.arc(centroids[i].x, centroids[i].y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${i * 360 / centroids.length}, 100%, 50%)`;
        ctx.fill();
    }
}

clusterButton.addEventListener('click', function() {
    if (points.length > 0) {
        const k = 4; //placeholder and k have same value esli chto
        let inputValue = Number(input.value);
        if(inputValue !== 0){
            if(isNaturalNumber(inputValue)){
                if(points.length<inputValue){
                    alert(`Поставьте не менее ${inputValue} точек`)
                }
                else{
                    const result = kMeans(points, inputValue);
                    drawClusters(points, result.centroids, result.numbers_of_clusters);
                } 
            }
            else{
                alert("Ты что, совсем ку-ку? Введи натуральное число!")
            }

        } 
        else{
            if(points.length<k){
                alert(`Поставьте не менее ${k} точек`)
            }
            else{
                const result = kMeans(points, k);
                drawClusters(points, result.centroids, result.numbers_of_clusters);
            }   
        }
    }
    else{
        alert("Сначала расставь точки, лол")
    }
});