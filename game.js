class Player {
    constructor(x, y, canvas) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.sprintSpeed = 8;
        this.jumpPower = 12;
        this.isJumping = false;
        this.gravity = 0.6;
        this.canvas = canvas;
        this.isSprinting = false;
        this.mouseX = canvas.width / 2;
        this.mouseY = canvas.height / 2;
    }

    update(keys) {
        // Horizontal movement
        let moveSpeed = this.isSprinting ? this.sprintSpeed : this.speed;
        if (keys['w'] || keys['W']) this.velocityY = -moveSpeed;
        if (keys['s'] || keys['S']) this.velocityY = moveSpeed;
        if (keys['a'] || keys['A']) this.velocityX = -moveSpeed;
        if (keys['d'] || keys['D']) this.velocityX = moveSpeed;

        // Reset velocity if no movement keys
        if (!(keys['w'] || keys['W'] || keys['s'] || keys['S'])) this.velocityY *= 0.8;
        if (!(keys['a'] || keys['A'] || keys['d'] || keys['D'])) this.velocityX *= 0.8;

        // Sprint
        this.isSprinting = keys['Shift'] || keys['shift'];

        // Jump
        if ((keys[' '] || keys['Space']) && !this.isJumping) {
            this.velocityY = -this.jumpPower;
            this.isJumping = true;
        }

        // Gravity
        this.velocityY += this.gravity;

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Collision with canvas
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.canvas.width) this.x = this.canvas.width - this.width;
        if (this.y + this.height >= this.canvas.height - 10) {
            this.y = this.canvas.height - this.height - 10;
            this.isJumping = false;
            this.velocityY = 0;
        }
    }

    draw(ctx) {
        // Body
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Head
        ctx.fillStyle = '#ff6b35';
        ctx.fillRect(this.x + 5, this.y - 15, 20, 15);

        // Draw direction indicator (crosshair to mouse)
        ctx.strokeStyle = '#ff6b35';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.mouseX, this.mouseY);
        ctx.stroke();
    }

    shoot() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            targetX: this.mouseX,
            targetY: this.mouseY
        };
    }
}

class Enemy {
    constructor(x, y, difficulty = 'normal') {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 35;
        this.difficulty = difficulty;
        this.speed = difficulty === 'easy' ? 1.5 : difficulty === 'normal' ? 3 : 4.5;
        this.health = 100;
        this.maxHealth = 100;
        this.vx = (Math.random() - 0.5) * this.speed * 2;
        this.vy = (Math.random() - 0.5) * this.speed;
        this.type = Math.random() > 0.7 ? 'armored' : 'normal';
        this.headX = this.x + this.width / 2;
        this.headY = this.y - 15;
        this.headWidth = 15;
        this.headHeight = 15;
    }

    update(canvasWidth, canvasHeight) {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls
        if (this.x <= 0 || this.x + this.width >= canvasWidth) this.vx *= -1;
        if (this.y <= 0 || this.y + this.height >= canvasHeight - 10) this.vy *= -1;

        // Keep in bounds
        this.x = Math.max(0, Math.min(this.x, canvasWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, canvasHeight - this.height - 10));

        // Update head position
        this.headX = this.x + this.width / 2;
        this.headY = this.y - 15;
    }

    draw(ctx) {
        // Body
        if (this.type === 'armored') {
            ctx.fillStyle = '#cc4400';
            ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        }
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Head
        ctx.fillStyle = '#ffaa66';
        ctx.beginPath();
        ctx.arc(this.headX, this.headY, this.headWidth / 2, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 25, this.width, 6);
        ctx.fillStyle = this.health > 50 ? '#00ff00' : this.health > 25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(this.x, this.y - 25, (this.health / this.maxHealth) * this.width, 6);
    }

    isHeadshot(bulletX, bulletY) {
        const dx = bulletX - this.headX;
        const dy = bulletY - this.headY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.headWidth / 2;
    }

    isHit(bulletX, bulletY) {
        return (
            bulletX >= this.x &&
            bulletX <= this.x + this.width &&
            bulletY >= this.y &&
            bulletY <= this.y + this.height
        );
    }

    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }
}

class Bullet {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = 8;
        this.distance = 0;
        this.maxDistance = 1500;

        // Calculate direction
        const dx = targetX - x;
        const dy = targetY - y;
        const length = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / length) * this.speed;
        this.vy = (dy / length) * this.speed;

        // Add spray
        const spread = (Math.random() - 0.5) * 0.1;
        this.vx += (Math.random() - 0.5) * spread * this.speed;
        this.vy += (Math.random() - 0.5) * spread * this.speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.distance += this.speed;
        return this.distance < this.maxDistance;
    }

    draw(ctx) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100, this.canvas);
        this.enemies = [];
        this.bullets = [];
        this.keys = {};
        this.isRunning = false;
        this.timeLeft = 60;
        this.difficulty = 'normal';
        this.mode = 'classic';
        this.stats = {
            kills: 0,
            shots: 0,
            hits: 0,
            headshots: 0,
            deaths: 0
        };
        this.setupEventListeners();
        this.spawnRate = 2;
        this.spawnCounter = 0;
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.player.mouseX = e.clientX - rect.left;
            this.player.mouseY = e.clientY - rect.top;
        });

        this.canvas.addEventListener('click', () => {
            this.shoot();
        });

        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.dataset.difficulty;
            });
        });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.mode = e.target.dataset.mode;
            });
        });
    }

    start() {
        this.reset();
        this.isRunning = true;
        document.getElementById('gameOver').classList.remove('show');
        document.getElementById('startBtn').textContent = 'RUNNING...';
        document.getElementById('startBtn').disabled = true;
        this.gameLoop();
    }

    reset() {
        this.stats = { kills: 0, shots: 0, hits: 0, headshots: 0, deaths: 0 };
        this.timeLeft = 60;
        this.enemies = [];
        this.bullets = [];
        this.spawnCounter = 0;
        this.updateUI();
    }

    shoot() {
        if (!this.isRunning) return;

        this.stats.shots++;
        const shootData = this.player.shoot();
        this.bullets.push(new Bullet(shootData.x, shootData.y, shootData.targetX, shootData.targetY));
        this.updateUI();
    }

    spawn() {
        const spawnRates = { easy: 1, normal: 2, hard: 3.5 };
        const maxEnemies = { easy: 3, normal: 5, hard: 8 };
        const rate = spawnRates[this.difficulty];
        const max = maxEnemies[this.difficulty];

        this.spawnCounter++;
        if (this.spawnCounter > 60 / rate && this.enemies.length < max) {
            const x = Math.random() * (this.canvas.width - 25);
            const y = Math.random() * (this.canvas.height / 2);
            this.enemies.push(new Enemy(x, y, this.difficulty));
            this.spawnCounter = 0;
        }
    }

    updateUI() {
        document.getElementById('kills').textContent = this.stats.kills;
        document.getElementById('shots').textContent = this.stats.shots;
        document.getElementById('headshots').textContent = this.stats.headshots;
        
        const accuracy = this.stats.shots > 0
            ? Math.round((this.stats.hits / this.stats.shots) * 100)
            : 100;
        document.getElementById('accuracy').textContent = accuracy + '%';
        document.getElementById('accuracyBar').style.width = accuracy + '%';

        const kda = this.stats.kills / Math.max(1, this.stats.deaths);
        document.getElementById('kda').textContent = kda.toFixed(2);

        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    endGame() {
        this.isRunning = false;
        document.getElementById('startBtn').textContent = 'START GAME';
        document.getElementById('startBtn').disabled = false;

        const accuracy = this.stats.shots > 0
            ? Math.round((this.stats.hits / this.stats.shots) * 100)
            : 100;
        const kda = this.stats.kills / Math.max(1, this.stats.deaths);

        document.getElementById('finalKills').textContent = this.stats.kills;
        document.getElementById('finalAccuracy').textContent = accuracy + '%';
        document.getElementById('finalHeadshots').textContent = this.stats.headshots;
        document.getElementById('finalKDA').textContent = kda.toFixed(2);

        document.getElementById('gameOver').classList.add('show');
    }

    update() {
        if (!this.isRunning) return;

        this.player.update(this.keys);
        this.spawn();

        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (!this.bullets[i].update()) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Check collision with enemies
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const bullet = this.bullets[i];
                const enemy = this.enemies[j];

                if (enemy.isHit(bullet.x, bullet.y)) {
                    this.stats.hits++;
                    let damage = 25;
                    let isHeadshot = false;

                    if (enemy.isHeadshot(bullet.x, bullet.y)) {
                        damage = 100;
                        this.stats.headshots++;
                        isHeadshot = true;
                    }

                    if (enemy.type === 'armored') damage *= 0.7;

                    if (enemy.takeDamage(damage)) {
                        this.stats.kills++;
                        this.enemies.splice(j, 1);
                    }

                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }

        // Update enemies
        for (let enemy of this.enemies) {
            enemy.update(this.canvas.width, this.canvas.height);
        }

        this.timeLeft--;
        this.updateUI();

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    draw() {
        // Background
        this.ctx.fillStyle = '#0f1419';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid pattern
        this.ctx.strokeStyle = '#1a1f3a';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.canvas.height; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }

        // Ground
        this.ctx.fillStyle = '#1a3a2a';
        this.ctx.fillRect(0, this.canvas.height - 10, this.canvas.width, 10);

        // Draw game objects
        this.player.draw(this.ctx);

        for (let enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        for (let bullet of this.bullets) {
            bullet.draw(this.ctx);
        }

        // Draw crosshair
        const crosshairSize = 15;
        this.ctx.strokeStyle = '#ff6b35';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.mouseX - crosshairSize, this.player.mouseY);
        this.ctx.lineTo(this.player.mouseX + crosshairSize, this.player.mouseY);
        this.ctx.moveTo(this.player.mouseX, this.player.mouseY - crosshairSize);
        this.ctx.lineTo(this.player.mouseX, this.player.mouseY + crosshairSize);
        this.ctx.stroke();

        // Mode indicator
        this.ctx.fillStyle = '#ff6b35';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`${this.mode.toUpperCase()} - ${this.difficulty.toUpperCase()}`, 20, 30);
    }

    gameLoop() {
        this.update();
        this.draw();
        if (this.isRunning || this.timeLeft > 0) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

const game = new Game();