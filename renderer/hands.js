window.addEventListener('load', function () {
  //mediapipe Hands detection
  const videoElement = document.getElementsByClassName('input_video')[0];
  const canvasElement = document.getElementsByClassName('output_canvas')[0];
  const canvasCtx = canvasElement.getContext('2d');
  var position = 'idle';

  function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
          { color: '#00FF00', lineWidth: 5 });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
      }
    }
    try {
      centerpoint(results);
    } catch (error) {
      console.log("error in onResult function");
    }
    canvasCtx.restore();
  }

  const hands = new Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    selfieMode: true
  });
  hands.onResults(onResults);

  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: 1280,
    height: 720
  });
  camera.start();

  function centerpoint(results) {
    try {
      var x = results.multiHandLandmarks[0][9].x;
      var y = results.multiHandLandmarks[0][9].y;


      if (y < 0.4) position = 'ArrowUp';
      else if (y > 0.75) position = 'ArrowDown';
      else position = 'idle';

      if (x < 0.35) position = 'ArrowLeft';
      else if (x > 0.65) position = 'ArrowRight';

      // console.log('inside: ' + position);

    } catch (error) {
      console.log(error);
    }
  }

this.setTimeout(thegame(), 5000);
  function thegame() {
    // GAME
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 720;
    let enemies = [];
    let score = 0;
    let gameOver = false;
    const fullScreenButton = document.getElementById('fullScreenButton');




    //for body movements
    // if (position == 'ArrowDown') restartGame();
    // console.log('outside: ' + position);


    class InputHandler {
      constructor() {
        this.keys = [];
        this.touchY = '';
        this.touchThreshold = 30;
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && gameOver) restartGame();
        });
        window.addEventListener('touchstart', (e) => {
          // console.log(this.keys);
          this.touchY = e.changedTouches[0].pageY;
        });
        window.addEventListener('touchmove', (e) => {
          // console.log(this.keys);
          const swipeDistance = e.changedTouches[0].pageY - this.touchY;
          if (swipeDistance < -this.touchThreshold && this.keys.indexOf('swipe up') === -1) this.keys.push('swipe up');
          else if (swipeDistance > this.touchThreshold && this.keys.indexOf('swipe down') === -1) {
            this.keys.push('swipe down');
            if (gameOver) restartGame();
          }
        });
        window.addEventListener('touchend', (e) => {
          // console.log(this.keys);
          this.keys.splice(this.keys.indexOf('swipe up'), 1);
          this.keys.splice(this.keys.indexOf('swipe down'), 1);
        });
      }
    }

    class Player {
      constructor(gameWidth, gameHeight) {
        this.gameHeight = gameHeight;
        this.gameWidth = gameWidth;
        this.width = 200;
        this.height = 200;
        this.x = 10;
        this.y = this.gameHeight - this.height;
        this.image = document.getElementById('playerImage');
        this.frameX = 0;
        this.frameY = 0;
        this.speed = 0;
        this.vy = 0;
        this.weight = 1;
        this.maxFrame = 8;
        this.fps = 30;
        this.frameTimer = 0;
        this.frameInterval = 1000 / this.fps;
      }

      restart() {
        this.x = 10;
        this.y = this.gameHeight - this.height;
        this.maxFrame = 8;
        this.frameY = 0;
      }

      draw(context) {
        context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
      }

      update(position, deltatime, enemies) {
        // collision detection'
        enemies.forEach(enemy => {
          const dx = (enemy.x + enemy.width / 2 - 20) - (this.x + this.width / 2);
          const dy = (enemy.y + enemy.height / 2) - (this.y + enemy.height / 2 + 20);
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < enemy.width / 3 + this.width / 3) {
            gameOver = true;
          }
        })

        // sprite animation
        if (this.frameTimer > this.frameInterval) {
          if (this.frameX >= this.maxFrame) {
            this.frameX = 0;
          }
          else {
            this.frameX++;
          }
        }
        else {
          this.frameTimer += deltatime;
        }

        // controls
        if (position == 'ArrowRight') {
          this.speed = 5;
        }
        else if (position == 'ArrowLeft') {
          this.speed = -5;
        }
        else if ((position == 'ArrowUp') && this.onGround()) {
          this.vy -= 30;
        }
        else {
          this.speed = 0;
        }


        console.log('player: ' + position);
        // horizontal movement
        this.x += this.speed;
        if (this.x < 0) this.x = 0;
        else if (this.x > this.gameWidth - this.width) this.x = this.gameWidth - this.width;

        // vertical movemnt
        this.y += this.vy;
        if (!this.onGround()) {
          this.vy += this.weight;
          this.maxFrame = 5;
          this.frameY = 1;
        }
        else {
          this.maxFrame = 8;
          this.vy = 0;
          this.frameY = 0;
        }
        if (this.y > this.gameHeight - this.height) this.y = this.gameHeight - this.height;

      }

      onGround() {
        return this.y >= this.gameHeight - this.height;
      }
    }

    class Background {
      constructor(gameWidth, gameHeight) {
        this.gameHeight = gameHeight;
        this.gameWidth = gameWidth;
        this.image = document.getElementById('backgroundImage');
        this.x = 0;
        this.y = 0;
        this.width = 2400;
        this.height = 720;
        this.speed = 20;
      }
      draw(context) {
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
        context.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
      }
      update() {
        this.x -= this.speed;
        if (this.x < 0 - this.width) {
          this.x = 0;
        }
      }
      restart() {
        this.x = 0;
      }
    }

    class Enemy {
      constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.width = 160;
        this.height = 119;
        this.image = document.getElementById('enemyImage');
        this.x = this.gameWidth;
        this.y = this.gameHeight - this.height;
        this.frameX = 0;
        this.speed = 8;
        this.maxFrame = 5;
        this.fps = 20;
        this.frameTimer = 0;
        this.frameInterval = 1000 / this.fps;
        this.markedForDeletion = false;
      }

      draw(context) {
        context.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height, this.x, this.y, this.width, this.height);
      }

      update(deltatime) {
        if (this.frameTimer > this.frameInterval) {
          if (this.frameX >= this.maxFrame) this.frameX = 0;
          else this.frameX++;
          this.frameTimer = 0;
        }
        else {
          this.frameTimer += deltatime;
        }
        this.x -= this.speed;
        if (this.x < 0 - this.width) {
          this.markedForDeletion = true;
          score++;
        }

      }
    };


    function handleEnemies(deltatime) {
      if (enemyTimer > enemyInterval + randomEnemyInterval) {
        enemies.push(new Enemy(canvas.width, canvas.height));
        randomEnemyInterval = Math.random() * 1000 + 1500;
        enemyTimer = 0;
      }
      else {
        enemyTimer += deltatime;
      }
      enemies.forEach(enemy => {
        enemy.draw(ctx);
        enemy.update(deltatime);
      });
      enemies = enemies.filter(enemy => !enemy.markedForDeletion);
    };

    function displayStatusText(context) {
      context.font = '40px Helvetica';
      context.fillStyle = 'black';
      context.fillText(`Score: ${score}`, 20, 50);
      context.fillStyle = 'white';
      context.fillText(`Score: ${score}`, 22, 52);
      if (gameOver) {
        context.font = '20px Helvetica';
        context.texAlign = 'center';
        context.fillStyle = 'black';
        context.fillText('GAME OVER, press Enter or swipe down to restart...', (canvas.width) / 4, 150);
        context.fillStyle = 'white';
        context.fillText('GAME OVER, press Enter or swipe down to restart...', (canvas.width) / 4 + 2, 152);
      }
    };

    function restartGame() {
      player.restart();
      background.restart();
      enemies = [];
      score = 0;
      gameOver = false;
      animate();
    };

    function toggleFullScreen() {
      if (!document.fullscreenElement) {
        canvas.requestFullscreen()
          .catch(err => alert(`Error, can't enable full-screen mode:  ${err.message}`))
      }
      else {
        document.exitFullscreen();
      }
    }
    fullScreenButton.addEventListener('click', toggleFullScreen)

    const input = new InputHandler();
    const player = new Player(canvas.width, canvas.height);
    const background = new Background(canvas.width, canvas.height);

    let lastTime = 0;
    let enemyTimer = 0;
    let enemyInterval = 1000;
    let randomEnemyInterval = Math.random() * 1000 + 500;

    function animate(timestamp = 0) {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      background.draw(ctx);
      player.draw(ctx);
      player.update(position, deltaTime, enemies);
      handleEnemies(deltaTime);
      displayStatusText(ctx);
      if (!gameOver) requestAnimationFrame(animate);

    };
    animate();

    if (position == 'ArrowDown' && gameOver) restartGame();
  }

})


