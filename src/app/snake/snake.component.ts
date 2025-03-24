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
  // Instead of storing separate speeds, we now store the overall current speed.
  private currentSpeed: number = 100;
  private xVelocity: number = 100;
  private yVelocity: number = 0;
  private food: Point = { x: 0, y: 0 };
  private gameOver: boolean = false;
  private lastTime: number = 0;
  private snakeGrowth: number = 0;
  private growthIncrement: number = 5;
  private initialLength: number = 9;

  // For touch detection.
  private touchStartX: number = 0;
  private touchStartY: number = 0;

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
    if (!this.gameStarted && isPlatformBrowser(this.platformId)) {
      this.setCanvasDimensions();
      this.resetCanvas();
    }
  }

  setCanvasDimensions() {
    const canvasEl = this.canvas.nativeElement;
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
  }

  startGame() {
    if (isPlatformBrowser(this.platformId)) {
      this.resetGame();
      this.gameStarted = true;
      this.lastTime = performance.now();
      window.addEventListener('keydown', this.changeDirection.bind(this));
      this.canvas.nativeElement.addEventListener(
        'touchstart',
        this.handleTouchStart.bind(this),
        false
      );
      this.canvas.nativeElement.addEventListener(
        'touchend',
        this.handleTouchEnd.bind(this),
        false
      );
      requestAnimationFrame((time) => this.gameLoop(time));
    }
  }

  resetGame() {
    this.score = 0;
    this.gameOver = false;
    this.snakeGrowth = 0;
    this.currentSpeed = 100; // Reset overall speed.
    const canvasEl = this.canvas.nativeElement;
    const startX = canvasEl.width / 2;
    const startY = canvasEl.height / 2;
    this.snake = [];
    for (let i = 0; i < this.initialLength; i++) {
      this.snake.push({ x: startX - i * this.gridSize, y: startY });
    }
    // Set initial velocity to move right, using currentSpeed.
    this.xVelocity = this.currentSpeed;
    this.yVelocity = 0;
    this.createFood();
  }

  gameLoop(currentTime: number) {
    if (this.gameOver) {
      alert('Game Over! Your score: ' + this.score);
      this.gameStarted = false;
      return;
    }
    let deltaTime = (currentTime - this.lastTime) / 1000;
    if (deltaTime < 0) deltaTime = 0;
    deltaTime = Math.min(deltaTime, 0.05);
    this.lastTime = currentTime;

    this.updateSnake(deltaTime);
    this.checkFoodCollision();
    this.checkGameOver();
    this.resetCanvas();
    this.drawFood();
    this.drawSnake();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  resetCanvas() {
    this.ctx.fillStyle = 'lightgray';
    this.ctx.fillRect(
      0,
      0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height
    );
  }

  private distance(a: Point, b: Point): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  updateSnake(deltaTime: number) {
    const newHead: Point = {
      x: this.snake[0].x + this.xVelocity * deltaTime,
      y: this.snake[0].y + this.yVelocity * deltaTime,
    };
    this.snake.unshift(newHead);

    let totalLength = 0;
    for (let i = 0; i < this.snake.length - 1; i++) {
      totalLength += this.distance(this.snake[i], this.snake[i + 1]);
    }

    const targetLength =
      (this.initialLength + this.snakeGrowth) * this.gridSize;

    while (totalLength > targetLength && this.snake.length > 1) {
      const tailIndex = this.snake.length - 1;
      const segLength = this.distance(
        this.snake[tailIndex - 1],
        this.snake[tailIndex]
      );
      if (totalLength - segLength >= targetLength) {
        totalLength -= segLength;
        this.snake.pop();
      } else {
        const excess = totalLength - targetLength;
        const t = 1 - excess / segLength;
        const prev = this.snake[tailIndex - 1];
        const tail = this.snake[tailIndex];
        this.snake[tailIndex] = {
          x: prev.x + (tail.x - prev.x) * t,
          y: prev.y + (tail.y - prev.y) * t,
        };
        totalLength = targetLength;
      }
    }
  }

  checkFoodCollision() {
    const head = this.snake[0];
    const threshold = 20;
    const dx = head.x - this.food.x;
    const dy = head.y - this.food.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < threshold) {
      console.log('Food eaten! Distance:', dist);
      this.score++;
      this.snakeGrowth += this.growthIncrement;
      // Increase overall speed by 10 pixels per second.
      this.currentSpeed += 10;
      // Update velocity to reflect new speed while preserving direction.
      if (this.xVelocity !== 0) {
        this.xVelocity = Math.sign(this.xVelocity) * this.currentSpeed;
        this.yVelocity = 0;
      } else if (this.yVelocity !== 0) {
        this.yVelocity = Math.sign(this.yVelocity) * this.currentSpeed;
        this.xVelocity = 0;
      }
      this.createFood();
    }
  }

  checkGameOver() {
    const head = this.snake[0];
    const canvasEl = this.canvas.nativeElement;
    if (
      head.x < 0 ||
      head.x >= canvasEl.width ||
      head.y < 0 ||
      head.y >= canvasEl.height
    ) {
      console.log('Head out of bounds!');
      this.gameOver = true;
    }
    for (let i = 10; i < this.snake.length; i++) {
      if (this.distance(head, this.snake[i]) < 10) {
        console.log('Self collision detected at index:', i);
        this.gameOver = true;
        break;
      }
    }
  }

  createFood() {
    const cols = this.canvas.nativeElement.width;
    const rows = this.canvas.nativeElement.height;
    this.food.x = Math.random() * cols;
    this.food.y = Math.random() * rows;
  }

  drawFood() {
    this.ctx.fillStyle = 'green';
    const size = 20;
    this.ctx.beginPath();
    this.ctx.arc(this.food.x, this.food.y, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawSnake() {
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 20;
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(this.snake[0].x, this.snake[0].y);
    for (let i = 1; i < this.snake.length; i++) {
      this.ctx.lineTo(this.snake[i].x, this.snake[i].y);
    }
    this.ctx.stroke();

    this.ctx.fillStyle = 'green';
    const head = this.snake[0];
    this.ctx.beginPath();
    this.ctx.arc(head.x, head.y, 10, 0, Math.PI * 2);
    this.ctx.fill();
  }

  changeDirection(event: KeyboardEvent) {
    const key = event.key;
    // Update velocity based on currentSpeed.
    if (key === 'ArrowLeft') {
      this.xVelocity = -this.currentSpeed;
      this.yVelocity = 0;
    } else if (key === 'ArrowUp') {
      this.xVelocity = 0;
      this.yVelocity = -this.currentSpeed;
    } else if (key === 'ArrowRight') {
      this.xVelocity = this.currentSpeed;
      this.yVelocity = 0;
    } else if (key === 'ArrowDown') {
      this.xVelocity = 0;
      this.yVelocity = this.currentSpeed;
    }
  }

  handleTouchStart(evt: TouchEvent) {
    const touch = evt.changedTouches[0];
    this.touchStartX = touch.pageX;
    this.touchStartY = touch.pageY;
  }

  handleTouchEnd(evt: TouchEvent) {
    const touch = evt.changedTouches[0];
    const dx = touch.pageX - this.touchStartX;
    const dy = touch.pageY - this.touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        this.xVelocity = this.currentSpeed;
        this.yVelocity = 0;
      } else {
        this.xVelocity = -this.currentSpeed;
        this.yVelocity = 0;
      }
    } else {
      if (dy > 0) {
        this.xVelocity = 0;
        this.yVelocity = this.currentSpeed;
      } else {
        this.xVelocity = 0;
        this.yVelocity = -this.currentSpeed;
      }
    }
  }
}
