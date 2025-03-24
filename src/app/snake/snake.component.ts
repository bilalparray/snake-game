import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';

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
  private gameInterval: any;
  private snake: { x: number; y: number }[] = [];
  private xVelocity: number = 20;
  private yVelocity: number = 0;
  private foodX: number = 0;
  private foodY: number = 0;
  private gameOver: boolean = false;

  // Grid size for each snake segment / food block
  private gridSize: number = 20;

  // For touch detection
  private touchStartX: number = 0;
  private touchStartY: number = 0;

  ngAfterViewInit() {
    this.setCanvasDimensions();
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    this.resetCanvas();
  }

  // Update canvas dimensions only when game is not running
  @HostListener('window:resize', [])
  onResize() {
    if (!this.gameStarted) {
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
    this.resetGame();
    this.gameStarted = true;

    // Add event listeners once
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

    // Start game loop
    this.gameInterval = setInterval(() => this.gameLoop(), 250);
  }

  resetGame() {
    this.score = 0;
    this.gameOver = false;
    // Initialize snake in the center of the canvas with 5 segments
    const startX =
      Math.floor(this.canvas.nativeElement.width / 2 / this.gridSize) *
      this.gridSize;
    const startY =
      Math.floor(this.canvas.nativeElement.height / 2 / this.gridSize) *
      this.gridSize;
    this.snake = [
      { x: startX, y: startY },
      { x: startX - this.gridSize, y: startY },
      { x: startX - this.gridSize * 2, y: startY },
      { x: startX - this.gridSize * 3, y: startY },
      { x: startX - this.gridSize * 4, y: startY },
    ];
    this.xVelocity = this.gridSize;
    this.yVelocity = 0;
    this.createFood();
  }

  gameLoop() {
    if (this.gameOver) {
      clearInterval(this.gameInterval);
      alert('Game Over! Your score: ' + this.score);
      this.gameStarted = false;
      return;
    }

    this.checkGameOver();
    this.resetCanvas();
    this.drawFood();
    this.moveSnake();
    this.drawSnake();

    if (this.snake[0].x === this.foodX && this.snake[0].y === this.foodY) {
      this.score++;
      this.createFood();
    } else {
      this.snake.pop();
    }
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

  checkGameOver() {
    const head = this.snake[0];
    if (
      head.x < 0 ||
      head.x >= this.canvas.nativeElement.width ||
      head.y < 0 ||
      head.y >= this.canvas.nativeElement.height
    ) {
      this.gameOver = true;
    }
    for (let i = 1; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        this.gameOver = true;
      }
    }
  }

  createFood() {
    const cols = Math.floor(this.canvas.nativeElement.width / this.gridSize);
    const rows = Math.floor(this.canvas.nativeElement.height / this.gridSize);
    this.foodX = Math.floor(Math.random() * cols) * this.gridSize;
    this.foodY = Math.floor(Math.random() * rows) * this.gridSize;
  }

  drawFood() {
    this.ctx.fillStyle = 'green';
    this.ctx.fillRect(this.foodX, this.foodY, this.gridSize, this.gridSize);
  }

  moveSnake() {
    const head = {
      x: this.snake[0].x + this.xVelocity,
      y: this.snake[0].y + this.yVelocity,
    };
    this.snake.unshift(head);
  }

  drawSnake() {
    this.ctx.fillStyle = 'black';
    this.snake.forEach((segment) => {
      this.ctx.fillRect(segment.x, segment.y, this.gridSize, this.gridSize);
    });
  }

  changeDirection(event: KeyboardEvent) {
    const key = event.key;
    const goingUp = this.yVelocity === -this.gridSize;
    const goingDown = this.yVelocity === this.gridSize;
    const goingRight = this.xVelocity === this.gridSize;
    const goingLeft = this.xVelocity === -this.gridSize;

    if (key === 'ArrowLeft' && !goingRight) {
      this.xVelocity = -this.gridSize;
      this.yVelocity = 0;
    } else if (key === 'ArrowUp' && !goingDown) {
      this.xVelocity = 0;
      this.yVelocity = -this.gridSize;
    } else if (key === 'ArrowRight' && !goingLeft) {
      this.xVelocity = this.gridSize;
      this.yVelocity = 0;
    } else if (key === 'ArrowDown' && !goingUp) {
      this.xVelocity = 0;
      this.yVelocity = this.gridSize;
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
      if (dx > 0 && this.xVelocity !== -this.gridSize) {
        this.xVelocity = this.gridSize;
        this.yVelocity = 0;
      } else if (dx < 0 && this.xVelocity !== this.gridSize) {
        this.xVelocity = -this.gridSize;
        this.yVelocity = 0;
      }
    } else {
      if (dy > 0 && this.yVelocity !== -this.gridSize) {
        this.yVelocity = this.gridSize;
        this.xVelocity = 0;
      } else if (dy < 0 && this.yVelocity !== this.gridSize) {
        this.yVelocity = -this.gridSize;
        this.xVelocity = 0;
      }
    }
  }
}
