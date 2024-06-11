import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
declare var require: any;
var find_path = require('dijkstrajs').find_path;

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
  gridSize: number = 20;
  cellSize: number = 20;
  obstacles: Set<string> = new Set();
  startNode: string = '0,0';
  finishNode: string = '19,19';
  animationSpeed: number = 50;
  path = [];

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
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        this.ctx.fillStyle = this.grid[r][c] === 1 ? 'black' : 'white';
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
      this.grid[row][col] = 1;
      this.obstacles.add(`${row},${col}`);
    }

    this.drawGrid();
  }

  startAlgorithm() {
    this.path = [];
    const graph = this.fillGraph(this.gridSize, this.gridSize, this.obstacles);
    this.path = find_path(graph, this.startNode, this.finishNode);
    this.visualizePath(this.path);
  }

  visualizePath(path: string[]) {
    let delay = 100;

    for (let i = 0; i < path.length; i++) {
      const [r, c] = path[i].split(',').map(Number);
      setTimeout(() => {
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);
        this.ctx.strokeRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);
      }, delay);
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
}
