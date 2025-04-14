const mapContainer = document.getElementById("mapContainer");
const sizeInput = document.getElementById("sizeMapInput");
const resultMessage = document.getElementById("resultMessage");
let grid = [];
let gridSize = 0;
let start = null;
let end = null;
let bWasFounded = false;
let bIsSearching = false;
let g = false;


function fillMap()
{
    for (let y = 0; y < gridSize; y++) 
    {
        let row = [];
        for (let x = 0; x < gridSize; x++)
            row.push(1);
        grid.push(row);
    }


    let startX = random(0, Math.floor((gridSize-2) / 2)) * 2 + 1;
    let startY = random(0, Math.floor((gridSize-2) / 2)) * 2 + 1;
    if (gridSize%2==0 && startX==gridSize-1 && startY==gridSize-1)
    {
        startX -= 2;
        startY -= 2;
    }

    grid[startY][startX] = 0;

    let walls = [];

    const addWalls = (x, y) => 
    {
        const directions = [[2, 0], [-2, 0], [0, 2], [0, -2]];
        for (let [dx, dy] of directions) 
        {
            let nx = x + dx;
            let ny = y + dy;
            if (nx > 0 && nx < gridSize - 1 && ny > 0 && ny < gridSize - 1 
                && grid[ny][nx] == 1) 
            {
                walls.push([x + dx / 2, y + dy / 2, nx, ny]);
            }
        }
    };

    addWalls(startX, startY);

    while (walls.length > 0) 
    {
        let randomIndex = random(0, walls.length - 1);
        let [wx, wy, nx, ny] = walls.splice(randomIndex, 1)[0];

        if (grid[ny][nx] == 1) 
        {
            grid[wy][wx] = 0;
            grid[ny][nx] = 0;
            addWalls(nx, ny);
        }
    }
}

function generateMap() 
{
    if (bIsSearching)
        return;
    grid = [];
    gridSize = 0;
    mapContainer.innerHTML = "";
    start = null;
    end = null;
    bWasFounded = false;

    gridSize = parseInt(sizeInput.value);
    if (gridSize < 5)
    {
        resultMessage.textContent = "Size must be more than 4!";
        mapContainer.style.gridTemplateColumns = '0px';
        mapContainer.style.gridTemplateRows = '0px';
        mapContainer.innerHTML = "";
        return;
    }
    mapContainer.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;
    mapContainer.style.gridTemplateRows = `repeat(${gridSize}, 30px)`;
    resultMessage.textContent = "";

    fillMap();
    fixBoundaryMap();
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
            if (grid[y][x] == 1)
                cell.classList.add("wall")
                
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.addEventListener("click", () => toggleCell(cell, x, y));
            mapContainer.appendChild(cell);
        });
    });
}

function toggleCell(cell, x, y) 
{
    if (bIsSearching || bWasFounded) return;

    if (x == 0 || y == 0 || 
        x == gridSize-1 || y == gridSize-1)
        return;
    if ((start && start[0]==x && start[1]==y) ||
        (end && end[0]==x && end[1]==y))
        return;

    if (!start) 
    {
        start = [x, y];
        cell.classList.remove("wall");
        grid[y][x] = 0;
        cell.classList.add("start");
    } 
    else if (!end) 
    {
        end = [x, y];
        cell.classList.remove("wall");
        grid[y][x] = 0;
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
    if (bWasFounded) return;
    if (bIsSearching)
    {
        resultMessage.innerText = "Take your time...";
        return;
    }
    if (!start || !end) 
    {
        resultMessage.innerText = "Set start and end points, please!";
        return;
    }

    bIsSearching = true;
    bWasFounded = await findPath(start, end);
    bIsSearching = false;

    if (!bWasFounded)
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

function fixBoundaryMap() 
{
    for (let y = 1; y < gridSize - 1; y += 2) 
    {
        if (grid[y][gridSize - 2] == 1 && grid[y][gridSize - 3] == 0) 
        {
            grid[y][gridSize - 2] = 0;
        }
    }
    for (let x = 1; x < gridSize - 1; x += 2) 
    {
        if (grid[gridSize - 2][x] === 1 && grid[gridSize - 3][x] === 0) 
        {
            grid[gridSize - 2][x] = 0;
        }
    }
    for (let x = 0; x < gridSize; x++)
        grid[0][x] = 1;
    for (let x = 0; x < gridSize; x++)
        grid[gridSize-1][x] = 1;
    for (let y = 0; y < gridSize; y++)
        grid[y][0] = 1;
    for (let y = 0; y < gridSize; y++)
        grid[y][gridSize-1] = 1;
}

function random(min, max) 
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
