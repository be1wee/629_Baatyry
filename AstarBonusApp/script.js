const mapContainer = document.getElementById("mapContainer");
const sizeInput = document.getElementById("sizeMapInput");
const resultMessage = document.getElementById("resultMessage");
let grid = [];
let gridSize = 0;
let start = null;
let end = null;
let bIsSearching = false;

function generateMap() 
{
    gridSize = parseInt(sizeInput.value);

    //~Dynamic style settings
    mapContainer.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;
    mapContainer.style.gridTemplateRows = `repeat(${gridSize}, 30px)`;
    resultMessage.textContent = "";
    mapContainer.innerHTML = "";
    //~End of dynamic style settings

    grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

    // Rezero the data after previous generation
    start = null;
    end = null;
    bIsSearching = false;

    renderGrid();
}

function renderGrid() 
{
    grid.forEach((row, y) => 
    {
        row.forEach((item, x) => 
        {
            let cell = document.createElement("div");
            cell.classList.add("cell");
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.addEventListener("click", () => toggleCell(cell, x, y));
            mapContainer.appendChild(cell);
        });
    });
}

function toggleCell(cell, x, y) 
{
    if (bIsSearching) return;

    if (!start) 
    {
        start = [x, y];
        cell.classList.add("start");
    } 
    else if (!end) 
    {
        end = [x, y];
        cell.classList.add("end");
    }
    else if (grid[y][x] == 1) 
    {
        grid[y][x] = 0;
        cell.classList.remove("wall");
    } 
    else if (grid[y][x] == 0)
    {
        grid[y][x] = 1;
        cell.classList.add("wall");
    }
}

async function tryToFindPath()
{
    if (!start || !end || bIsSearching) 
    {
        resultMessage.innerText = "Set start and end points, please!";
        return;
    }

    bIsSearching = true;
    let wasFounded = await findPath(start, end);
    bIsSearching = false;

    if (!wasFounded)
    {
        resultMessage.innerText = "No path found...";
        return;
    }
    resultMessage.innerText = "Congrats!";
}

async function findPath(start, end) 
{
    let stack = [[...start]];
    let visited = new Set();
    let deadEnds = new Set();
    
    while (stack.length > 0) 
    {
        let position = stack[stack.length - 1];
        let [x, y] = position;
        visited.add(`${x},${y}`);
        
        if (end[0] == x && end[1] == y) 
            return true;
        
        const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const possibleMoves = [];
        for (const [dx, dy] of directions) 
        {
            const newX = x + dx;
            const newY = y + dy;
            
            if (newX >= 0 && newX < gridSize && 
                newY >= 0 && newY < gridSize &&
                grid[newY][newX] == 0 && 
                !visited.has(`${newX},${newY}`) &&
                !deadEnds.has(`${newX},${newY}`)) 
            {
                possibleMoves.push([newX, newY]);
            }
        }
        
        if (possibleMoves.length == 0) 
        {
            deadEnds.add(`${x},${y}`);
            stack.pop();
        } 
        else 
        {
            let closestMove = possibleMoves[0];
            for (const move of possibleMoves) 
            {
                if (getManhattanDistance(move, end) < getManhattanDistance(closestMove, end)) 
                {
                    closestMove = move;
                }
            }
            stack.push(closestMove)
        }
        await animateStep(position);
    }
    return false;
}

function getManhattanDistance([x1, y1], [x2, y2]) 
{
    // Something like a heruistic for the grids
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

async function animateStep([x, y]) 
{
    let cell = mapContainer.children[y * gridSize + x];
    if (!cell.classList.contains("start") 
        && !cell.classList.contains("end")) 
    {
        cell.classList.add("path");
    }
    await sleep(100);
}

function sleep(ms) 
{
    return new Promise(resolve => setTimeout(resolve, ms));
}
