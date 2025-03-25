import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './snake.component.html',
  styleUrls: ['./snake.component.scss'],
  imports: [CommonModule],
})
export class SnakeComponent implements AfterViewInit {
  @ViewChild('screen', { static: false })
  canvas!: ElementRef<HTMLCanvasElement>;

  score: number = 0;
  gameStarted: boolean = false;

  private ctx!: CanvasRenderingContext2D;
  private snake: Point[] = [];
  private gridSize: number = 20;
  private currentSpeed: number = 100; // pixels per second
  private direction = { x: 1, y: 0 };
  private food: Point = { x: 0, y: 0 };
  private gameOver: boolean = false;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private snakeGrowth: number = 0;
  private growthIncrement: number = 5;
  private initialLength: number = 9;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setCanvasDimensions();
      this.ctx = this.canvas.nativeElement.getContext('2d')!;
      this.resetCanvas();
    }
  }

  @HostListener('window:resize', [])
  onResize() {
    if (isPlatformBrowser(this.platformId)) {
      this.setCanvasDimensions();

      this.resetCanvas();
    }
  }

  // Set canvas dimensions dynamically based on window size.
  setCanvasDimensions() {
    const canvasEl = this.canvas.nativeElement;
    // Calculate available width and height percentages,
    // then make sure the dimensions are multiples of gridSize.
    const availableWidth = window.innerWidth * 0.9; // 90% of window width
    const availableHeight = window.innerHeight * 0.7; // 70% of window height
    canvasEl.width = Math.floor(availableWidth / this.gridSize) * this.gridSize;
    canvasEl.height =
      Math.floor(availableHeight / this.gridSize) * this.gridSize;
  }

  startGame() {
    if (isPlatformBrowser(this.platformId)) {
      this.resetGame();
      this.gameStarted = true;
      this.lastTime = performance.now();
      this.accumulator = 0;
      window.addEventListener('keydown', this.changeDirection.bind(this)); // fallback keyboard control
      requestAnimationFrame((time) => this.gameLoop(time));
    }
  }

  resetGame() {
    this.score = 0;
    this.gameOver = false;
    this.snakeGrowth = 0;
    this.currentSpeed = 100;
    this.direction = { x: 1, y: 0 };

    const canvasEl = this.canvas.nativeElement;
    const cols = Math.floor(canvasEl.width / this.gridSize);
    const rows = Math.floor(canvasEl.height / this.gridSize);
    const startCol = Math.floor(cols / 2);
    const startRow = Math.floor(rows / 2);

    this.snake = [];
    for (let i = 0; i < this.initialLength; i++) {
      this.snake.push({
        x: (startCol - i) * this.gridSize + this.gridSize / 2,
        y: startRow * this.gridSize + this.gridSize / 2,
      });
    }
    this.createFood();
  }

  gameLoop(currentTime: number) {
    if (this.gameOver) {
      alert('Game Over! Your score: ' + this.score);
      this.gameStarted = false;
      return;
    }
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    this.accumulator += deltaTime;

    const timePerCell = this.gridSize / this.currentSpeed;
    while (this.accumulator >= timePerCell) {
      this.updateSnake();
      this.checkFoodCollision();
      this.checkSelfCollision();
      this.accumulator -= timePerCell;
    }

    this.resetCanvas();
    this.drawFood();
    this.drawSnake();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  updateSnake() {
    const canvasEl = this.canvas.nativeElement;
    const cols = Math.floor(canvasEl.width / this.gridSize);
    const rows = Math.floor(canvasEl.height / this.gridSize);

    const head = this.snake[0];
    const currentCol = Math.floor((head.x - this.gridSize / 2) / this.gridSize);
    const currentRow = Math.floor((head.y - this.gridSize / 2) / this.gridSize);

    let newCol = currentCol + this.direction.x;
    let newRow = currentRow + this.direction.y;

    if (newCol < 0) newCol = cols - 1;
    else if (newCol >= cols) newCol = 0;
    if (newRow < 0) newRow = rows - 1;
    else if (newRow >= rows) newRow = 0;

    const newHead: Point = {
      x: newCol * this.gridSize + this.gridSize / 2,
      y: newRow * this.gridSize + this.gridSize / 2,
    };

    this.snake.unshift(newHead);
    while (this.snake.length > this.initialLength + this.snakeGrowth) {
      this.snake.pop();
    }
  }

  checkFoodCollision() {
    const head = this.snake[0];
    if (
      Math.abs(head.x - this.food.x) < 1 &&
      Math.abs(head.y - this.food.y) < 1
    ) {
      this.score++;
      this.snakeGrowth += this.growthIncrement;
      this.currentSpeed += 10;
      this.createFood();
    }
  }

  checkSelfCollision() {
    const head = this.snake[0];
    for (let i = 1; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        this.gameOver = true;
        break;
      }
    }
  }

  createFood() {
    const canvasEl = this.canvas.nativeElement;
    const cols = Math.floor(canvasEl.width / this.gridSize);
    const rows = Math.floor(canvasEl.height / this.gridSize);
    const foodCol = Math.floor(Math.random() * cols);
    const foodRow = Math.floor(Math.random() * rows);
    this.food = {
      x: foodCol * this.gridSize + this.gridSize / 2,
      y: foodRow * this.gridSize + this.gridSize / 2,
    };
  }

  drawFood() {
    this.ctx.fillStyle = 'green';
    const size = this.gridSize;
    this.ctx.beginPath();
    this.ctx.arc(this.food.x, this.food.y, size * 0.4, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawSnake() {
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = this.gridSize * 0.8;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(this.snake[0].x, this.snake[0].y);

    for (let i = 1; i < this.snake.length; i++) {
      const prev = this.snake[i - 1];
      const curr = this.snake[i];
      const dx = Math.abs(curr.x - prev.x);
      const dy = Math.abs(curr.y - prev.y);
      if (dx > this.gridSize || dy > this.gridSize) {
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(curr.x, curr.y);
      } else {
        this.ctx.lineTo(curr.x, curr.y);
      }
    }
    this.ctx.stroke();

    this.ctx.fillStyle = 'green';
    const head = this.snake[0];
    this.ctx.beginPath();
    this.ctx.arc(head.x, head.y, this.gridSize * 0.4, 0, Math.PI * 2);
    this.ctx.fill();
  }

  changeDirection(event: KeyboardEvent) {
    const key = event.key;
    if (key === 'ArrowLeft' && this.direction.x !== 1) {
      this.direction = { x: -1, y: 0 };
    } else if (key === 'ArrowUp' && this.direction.y !== 1) {
      this.direction = { x: 0, y: -1 };
    } else if (key === 'ArrowRight' && this.direction.x !== -1) {
      this.direction = { x: 1, y: 0 };
    } else if (key === 'ArrowDown' && this.direction.y !== -1) {
      this.direction = { x: 0, y: 1 };
    }
  }

  moveLeft() {
    if (this.direction.x !== 1) this.direction = { x: -1, y: 0 };
  }
  moveUp() {
    if (this.direction.y !== 1) this.direction = { x: 0, y: -1 };
  }
  moveRight() {
    if (this.direction.x !== -1) this.direction = { x: 1, y: 0 };
  }
  moveDown() {
    if (this.direction.y !== -1) this.direction = { x: 0, y: 1 };
  }

  resetCanvas() {
    const canvasEl = this.canvas.nativeElement;
    this.ctx.fillStyle = '#f0f8ff';
    this.ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= canvasEl.width; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, canvasEl.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= canvasEl.height; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(canvasEl.width, y);
      this.ctx.stroke();
    }
  }
}
