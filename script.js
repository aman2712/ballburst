import gameProperties from "./game.properties.js";

// get reference to html elements
const canvas = document.querySelector("canvas");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const resetBtn = document.getElementById("reset");

// set canvas height
var heightRatio = 0.9;
canvas.height = canvas.width * heightRatio;

// set canvas context
const ctx = canvas.getContext("2d");

// set utility variables
const width = canvas.width;
const height = canvas.height;

const midX = width / 2;
const midY = height / 2;

let animationFrame;
let seconds = 0;
let timer;
let animationRunning = false;

let ballsEscaped = 0;

var lastTime;
var requiredElapsed = 1000/60;

// class for bigger rotating circle
class Circle {
  // add radius, angles and rotation speed of ring
  constructor() {
    this.radius = canvas.width - 400;
    this.startAngle = 0;
    this.endAngle = 1.75;
    this.rotateSpeed = 0.005;
  }

  // paint the ring on canvas
  draw() {
    ctx.strokeStyle = "gold";
    ctx.beginPath();
    ctx.arc(
      midX,
      midY,
      this.radius,
      Math.PI * this.startAngle,
      Math.PI * this.endAngle
    );
    ctx.stroke();
    ctx.closePath();
  }
}

// gravity factors
const gravityX = [0.05, 0.04, 0.03, 0.02, -0.1, -0.5];
const gravityY = [0.05, 0.04, 0.03, 0.02, 0.01];

// class for smaller balls
class Ball {
  // add radius, color, gravity, position and velocity factors of balls
  constructor() {
    this.radius = gameProperties.CIRCLE_RADIUS;
    this.color = getRandomColor();
    this.gravityX = gravityX[Math.floor(Math.random() * gravityX.length)];
    this.gravityY = gravityY[Math.floor(Math.random() * gravityY.length)];
    this.position = {
      x: midX,
      y: midY,
    };
    this.velocity = {
      x: 0,
      y: 0,
    };
    this.escaped = false;
  }

  // paint ball on canvas
  draw() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "transparent";
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

// first initialisation of circle ring and balls
let circle = new Circle();
let balls = [new Ball()];

// animation function which repeats to paint content on canvas
function animate(now) {
  animationFrame = requestAnimationFrame(animate);
    
  if (!lastTime) { lastTime = now; }
  var elapsed = now - lastTime;
  if (elapsed > requiredElapsed) {
    // do stuff

  // rotate the ring with angles and rotation factor
  if (circle.startAngle <= -2) {
    circle.startAngle = 0;
  } else {
    circle.startAngle -= circle.rotateSpeed;
  }

  if (circle.endAngle <= -0.25) {
    circle.endAngle = 1.75;
  } else {
    circle.endAngle -= circle.rotateSpeed;
  }

  // clear the canvas to repaint updated content
  ctx.clearRect(0, 0, width, height);

  // add movement and collision detection for each ball and spawn new balls once a ball leaves the ring
  for(const [index, ball] of balls.entries()){
    // add ball to canvas
    ball.draw();

    // collision detection
    if (ball.velocity.y < 0) {
      ball.velocity.y -= ball.gravityY;
    } else {
      ball.velocity.y += ball.gravityY;
    }
    if (ball.velocity.x < 0) {
      ball.velocity.x -= ball.gravityX;
    } else {
      ball.velocity.x += ball.gravityX;
    }

    // velocity control
    if (ball.velocity.y >= 5) {
      ball.velocity.y = 5;
    }
    if (ball.velocity.x >= 5) {
      ball.velocity.x = 5;
    }

    if (ball.velocity.x <= -5) {
      ball.velocity.x = -5;
    }

    // distance calculation from mid point
    const x1 = midX;
    const x2 = ball.position.x + ball.radius + ball.velocity.x;
    const y1 = midY;
    const y2 = ball.position.y + ball.radius + ball.velocity.y;

    const distance = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5;

    // angle calculation of ball and start and end angle of ring
    let ballAngle = getAngle(
      ball.position.x + ball.velocity.x + ball.radius,
      ball.position.y + ball.velocity.y + ball.radius
    );
    if (ballAngle < 0) ballAngle += 360;

    let startAngle = circle.startAngle * 180;
    if (startAngle < 0) startAngle += 360;

    let endAngle = circle.endAngle * 180;
    if (endAngle < 0) endAngle += 360;

    // decision to rebound or re-add balls once it hits the walls
    if (distance > circle.radius) {
      if (
        !(
          (ballAngle <= startAngle && ballAngle >= endAngle) ||
          (ballAngle + 360 <= startAngle && ballAngle + 360 >= endAngle)
        ) &&
        !ball.escaped
      ) {
        ball.velocity.y = -1 * ball.velocity.y;
        ball.velocity.x = -1 * ball.velocity.x;
      } else {
        ball.escaped = true;
        if (distance > circle.radius + 200) {
          balls.splice(index, 1);
          balls = [...balls, new Ball(), new Ball(), new Ball()];
          ballsEscaped += 1;
          reset_animation();
        }
      }
    }
  }

  // add ball count and timer on canvas
  ctx.font = "15px Oxanium";
  ctx.fillStyle = "white";
  ctx.fillText(`Balls: ${balls.length}`, midX - 20, midY - circle.radius - 10);
  ctx.fillText(
    `Time (seconds): ${seconds <= 9 ? `0${seconds}` : seconds}`,
    canvas.width - 140,
    25
  );
  ctx.stroke();

  // draw the ring on canvas
  circle.draw();

  lastTime = now;
  }

  // update the canvas with animation frames
  // animationFrame = requestAnimationFrame(animate);
}

// add start, stop and reset event listeners
startBtn.addEventListener("click", startGame);
stopBtn.addEventListener("click", stopGame);
resetBtn.addEventListener("click", resetGame);

// start the game
function startGame() {
  if (startBtn.getAnimations().length > 0) {
    startBtn.getAnimations()[0].cancel();
  }
  if (animationRunning) return;
  animationRunning = true;
  animate();
  timer = setInterval(() => {
    seconds += 1;
  }, 1000);
}

// stop/pause the game
function stopGame() {
  animationRunning = false;
  cancelAnimationFrame(animationFrame);
  clearInterval(timer);
}

// reset game parameters and restart
function resetGame() {
  clearInterval(timer);
  cancelAnimationFrame(animationFrame);
  animationRunning = false;
  seconds = 0;
  circle = new Circle();
  balls = [new Ball()];
  startGame();
}

// utility function to generate random colors for balls
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  var color = "#";

  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * letters.length)];
  }

  return color;
}

// utility function to get angle of ball w.r.t. centre point with inverse trigonometry
function getAngle(x, y) {
  return (Math.atan2(y - midY, x - midX) * 180) / Math.PI;
}

// function to replay score animation
function reset_animation() {
  var el = document.getElementById("score");
  el.innerHTML = `${ballsEscaped}<span>BALLS ESCAPED</span>`;
  el.style.animation = "none";
  el.offsetHeight; /* trigger reflow */
  el.style.animation = null;
}
