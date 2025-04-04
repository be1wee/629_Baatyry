
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const clusterButton = document.getElementById('clusterButton');


const resizeCanvas = () => {
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

function kMeans(points, k) {
    let centroids = [];
    for (let i = 0; i < k; i++) {
        centroids.push(points[i]);
    }

    let classes = new Array(points.length).fill(0);
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

            if (classes[i] !== closestCentroid) {
                itr = true;
                classes[i] = closestCentroid;
            }
        }

        for (let i = 0; i < k; i++) {
            let sumX = 0;
            let sumY = 0;
            let count = 0;

            for (let j = 0; j < points.length; j++) {
                if (classes[j] === i) {
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

    return { centroids, classes };
}

function drawClusters(points, centroids, classes) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < points.length; i++) {
        ctx.beginPath();
        ctx.arc(points[i].x, points[i].y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = `hsl(${classes[i] * 360 / centroids.length}, 100%, 50%)`;
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
        const k = 4;
        const result = kMeans(points, k);
        drawClusters(points, result.centroids, result.classes);
    }
});

        