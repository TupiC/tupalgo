import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
declare var require: any;
var find_path = require('dijkstrajs').find_path;
import { Grid, Astar } from "fast-astar";
import { obstacles } from './obstacles';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'tupalgo';
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  grid: number[][] = [];
  gridSize: number = 60;
  cellSize: number = 10;
  obstacles: Set<string> = obstacles
  startNode: string = '0,0';
  finishNode: string = '59,59';
  animationSpeed: number = 50;
  chosenAlgorithm: Algorithm = 'dijkstra';
  path: any = [];
  timeTaken: number = 0;
  finished = false;
  intervalId: any;
  startTime: number = 0;
  paintSize: number = 1;

  ngAfterViewInit() {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.width = this.gridSize * this.cellSize;
    this.canvas.height = this.gridSize * this.cellSize;
    this.initGrid();
    this.drawGrid();

    this.canvas.addEventListener('click', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => {
      if (e.buttons === 1) this.onMouseDown(e);
    });
  }

  fillGraph(rows: number, cols: number, obstacles: Set<string>) {
    const graph: any = {};

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const node = `${r},${c}`;
        if (obstacles.has(node)) continue;
        graph[node] = {};

        if (r > 0) {
          const top = `${r - 1},${c}`;
          if (!obstacles.has(top)) graph[node][top] = 1;
        }

        if (r < rows - 1) {
          const bottom = `${r + 1},${c}`;
          if (!obstacles.has(bottom)) graph[node][bottom] = 1;
        }

        if (c > 0) {
          const left = `${r},${c - 1}`;
          if (!obstacles.has(left)) graph[node][left] = 1;
        }

        if (c < cols - 1) {
          const right = `${r},${c + 1}`;
          if (!obstacles.has(right)) graph[node][right] = 1;
        }
      }
    }

    return graph;
  }

  initGrid() {
    for (let r = 0; r < this.gridSize; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.gridSize; c++) {
        this.grid[r][c] = 0;
      }
    }
  }

  drawGrid() {
    const gridObstacles = Array.from(this.obstacles);
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        this.ctx.fillStyle = this.grid[r][c] === 1 ? 'black' : 'white';
        if (gridObstacles.includes(`${r},${c}`)) {
          this.ctx.fillStyle = 'black';
        }
        this.ctx.fillRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);
        this.ctx.strokeRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);
      }
    }
  }

  onMouseDown(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (this.grid[row][col] === 0) {
      for (let r = row - this.paintSize; r <= row + this.paintSize; r++) {
        for (let c = col - this.paintSize; c <= col + this.paintSize; c++) {
          if (r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize) {
            this.grid[r][c] = 1;
            this.obstacles.add(`${r},${c}`);
          }
        }
      }
    }

    this.drawGrid();
  }

  startAlgorithm() {
    console.log(this.obstacles)
    this.startTimer();
    this.path = [];
    this.clearGreenLine();
    const start = performance.now();
    if (this.chosenAlgorithm === 'dijkstra') {
      this.runDijkstra();
    } else {
      this.runAstar();
    }
    const end = performance.now();
    this.timeTaken = end - start
    this.visualizePath(this.path);
  }

  startTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.startTime = performance.now();
    this.finished = false;
    this.intervalId = setInterval(() => {
      if (!this.finished) {
        const elapsed = performance.now() - this.startTime;
        this.timeTaken = elapsed;
      }
    }, 10);
  }

  runDijkstra() {
    const graph = this.fillGraph(this.gridSize, this.gridSize, this.obstacles);
    this.path = find_path(graph, this.startNode, this.finishNode);
  }

  runAstar() {
    let grid = new Grid({ col: this.gridSize, row: this.gridSize });
    this.obstacles.forEach((obstacle) => {
      const [r, c] = obstacle.split(',').map(Number);
      grid.set([r, c], 'value', 1);
    });

    let start = this.startNode.split(',').map(Number);
    let end = this.finishNode.split(',').map(Number);
    let astar = new Astar(grid),
      path = astar.search(
        [start[0], start[1]],                // start
        [end[0], end[1]],                   // end
        {                        // option
          rightAngle: true,    // default:false,Allow diagonal
          optimalResult: false   // default:true,In a few cases, the speed is slightly slower
        }
      )
    if (path) {
      this.path = path.map((node) => node.join(','));
    }
  }

  visualizePath(path: string[]) {
    let delay = 100;

    for (let i = 0; i < path.length; i++) {
      const [r, c] = path[i].split(',').map(Number);
      setTimeout(() => {
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);
        this.ctx.strokeRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);

        if (i === path.length - 1) {
          this.finished = true;
          clearInterval(this.intervalId);
        }
      }, delay)
      delay += this.animationSpeed;
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.obstacles.clear();
    this.path = [];
    this.initGrid();
    this.drawGrid();
  }

  clearGreenLine() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid();
  }
}

type Algorithm = 'dijkstra' | 'astar';
