const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const runButton = document.getElementById('runBtn');
const resetButton = document.getElementById('reset');
let isAntAlgorithmAlreadyDrawn = false;


function resizeCanvas(){
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
};
resizeCanvas();
window.addEventListener('resize', resizeCanvas); 

resetButton.addEventListener('click', function() {
    points = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isAntAlgorithmAlreadyDrawn = false;
});

let points = [];

function getPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function drawPoint(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2, true);
    ctx.fillStyle = 'red';
    ctx.fill();
}

canvas.addEventListener('click', (event) => {
    const { x, y } = getPosition(event);
    points.push([x, y]);
    drawPoint(x, y);
});

class AntColony {
    constructor(points, numAnts, alpha, beta, rho, Q) {
        this.points = points;
        this.numAnts = numAnts;
        this.alpha = alpha;
        this.beta = beta;
        this.rho = rho;
        this.Q = Q;
        this.distances = this.calculateDistances();
        this.pheromones = this.initializePheromones();
    }

    calculateDistances() {
        const distances = [];
        for (let i = 0; i < this.points.length; i++) {
            distances[i] = [];
            for (let j = 0; j < this.points.length; j++) {
                if (i === j) {
                    distances[i][j] = 0;
                } else {
                    const dx = this.points[i][0] - this.points[j][0];
                    const dy = this.points[i][1] - this.points[j][1];
                    distances[i][j] = Math.sqrt(dx * dx + dy * dy);
                }
            }
        }
        return distances;
    }

    initializePheromones() {
        const pheromones = [];
        for (let i = 0; i < this.points.length; i++) {
            pheromones[i] = [];
            for (let j = 0; j < this.points.length; j++) {
                pheromones[i][j] = 1;
            }
        }
        return pheromones;
    }

    run(numIterations) {
        let bestPath = null;
        let bestDistance = Infinity;

        for (let iteration = 0; iteration < numIterations; iteration++) {
            const paths = [];
            for (let ant = 0; ant < this.numAnts; ant++) {
                const path = this.findPath();
                paths.push(path);
            }

            for (const path of paths) {
                const distance = this.calculatePathDistance(path);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestPath = path;
                }
            }

            this.updatePheromones(paths);
        }
        return bestPath;
    }

    findPath() {
        const path = [0];
        const visited = new Set([0]);

        while (path.length < this.points.length) {
            const currentPoint = path[path.length - 1];
            const probabilities = this.calculateProbabilities(currentPoint, visited);
            const nextPoint = this.selectNextPoint(probabilities);
            path.push(nextPoint);
            visited.add(nextPoint);
        }
        return path;
    }

    calculateProbabilities(currentPoint, visited) {
        const probabilities = [];
        for (let i = 0; i < this.points.length; i++) {
            if (!visited.has(i)) {
                const probability = (this.pheromones[currentPoint][i] ** this.alpha) * (1 / this.distances[currentPoint][i]) ** this.beta;
                probabilities.push(probability);
            } else {
                probabilities.push(0);
            }
        }
        const sum = probabilities.reduce((a, b) => a + b, 0);
        return probabilities.map(p => p / sum);
    }

    selectNextPoint(probabilities) {
        const random = Math.random();
        let cumulativeProbability = 0;
        for (let i = 0; i < probabilities.length; i++) {
            cumulativeProbability += probabilities[i];
            if (random < cumulativeProbability) {
                return i;
            }
        }
        return probabilities.length - 1;
    }

    calculatePathDistance(path) {
        let distance = 0;
        for (let i = 0; i < path.length - 1; i++) {
            distance += this.distances[path[i]][path[i + 1]];
        }
        distance += this.distances[path[path.length - 1]][path[0]];
        return distance;
    }

    updatePheromones(paths) {
        for (let i = 0; i < this.pheromones.length; i++) {
            for (let j = 0; j < this.pheromones[i].length; j++) {
                this.pheromones[i][j] *= this.rho;
            }
        }

        for (const path of paths) {
            const distance = this.calculatePathDistance(path);
            for (let i = 0; i < path.length - 1; i++) {
                this.pheromones[path[i]][path[i + 1]] += this.Q / distance;
                this.pheromones[path[i + 1]][path[i]] += this.Q / distance;
            }
            this.pheromones[path[path.length - 1]][path[0]] += this.Q / distance;
            this.pheromones[path[0]][path[path.length - 1]] += this.Q / distance;
        }
    }
}

function drawPaths(){
    const numAnts = 10;
    const alpha = 1;
    const beta = 5;
    const rho = 0.1;
    const Q = 100;
    const numIterations = 100;

    const colony = new AntColony(points, numAnts, alpha, beta, rho, Q);
    const bestPath = colony.run(numIterations);

    ctx.save(); 
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
   
    ctx.setLineDash([2, 3]); 
    
    ctx.moveTo(points[bestPath[0]][0], points[bestPath[0]][1]);
    for (let i = 1; i < bestPath.length; i++) {
        ctx.lineTo(points[bestPath[i]][0], points[bestPath[i]][1]);
    }
    ctx.lineTo(points[bestPath[0]][0], points[bestPath[0]][1]);
    ctx.stroke();
    ctx.restore();
}

runButton.addEventListener('click', () => {
    if (points.length < 2){
        alert('Добавьте хотя бы две точки!');
        return;
    }
    if(isAntAlgorithmAlreadyDrawn){
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for(const [x, y] of points)
        {
            drawPoint(x, y);
        }

        drawPaths();
        isAntAlgorithmAlreadyDrawn = true;
    }
    else{
        drawPaths();
        isAntAlgorithmAlreadyDrawn = true;
    }
});



