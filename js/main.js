function Game(canvasId) {
    canvasId = (canvasId === undefined) ? 'canvas' : canvasId;
    
    var game = this;
    
    function getRandom(min, max) {
        return min + (Math.round(Math.random() * (max - min)));
    }
    
    function roundRect(x, y, width, height, radius, fill, stroke) {
        if (typeof stroke === 'undefined') {
            stroke = true;
        }
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        if (typeof radius === 'number') {
            radius = {tl : radius, tr : radius, br : radius, bl : radius};
        } else {
            var defaultRadius = {tl : 0, tr : 0, br : 0, bl : 0};
            for (var side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        game.ctx.beginPath();
        game.ctx.moveTo(x + radius.tl, y);
        game.ctx.lineTo(x + width - radius.tr, y);
        game.ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        game.ctx.lineTo(x + width, y + height - radius.br);
        game.ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        game.ctx.lineTo(x + radius.bl, y + height);
        game.ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        game.ctx.lineTo(x, y + radius.tl);
        game.ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        game.ctx.closePath();
        if (fill) {
            game.ctx.fill();
        }
        if (stroke) {
            game.ctx.stroke();
        }
    }
    
    function drawText(text, font, style, x, y) {
        game.ctx.save();
        game.ctx.font = font;
        
        if (style.fill !== undefined) {
            game.ctx.fillStyle = style.fill;
        }
        
        if (style.stroke !== undefined) {
            game.ctx.strokeStyle = style.stroke;
        }
        
        if (style.lineWidth !== undefined) {
            game.ctx.lineWidth = style.lineWidth;
        }

        var textMeasure = game.ctx.measureText(text);
        x = (x === 'center') ? Math.round((game.canvas.width / 2) - (textMeasure.width / 2)) : x;

        game.ctx.strokeText(text, x, y);
        game.ctx.fillText(text, x, y);
        game.ctx.restore();
    }

    function loadImage(src) {
        var obj = {
            img : new Image(),
            loaded : false
        };
        obj.img.addEventListener('load', function() {
            obj.loaded = true;
        });
        obj.img.src = src;
        game.images.push(obj);
        
        return obj;
    }
    
    function preloadImages() {
        game.images = [];
        for (var a in game.assets.src) {
            var src = game.assets.src[a];
            game.assets[a] = game.loadImage(src);
        }
        
        var promise = new Promise(function (resolve, reject) {
            var checkInterval = setInterval(function() {
                var allImagesLoaded = true;
                for (var i = 0; i < game.images.length; i++) {
                    allImagesLoaded = allImagesLoaded && game.images[i].loaded;
                }
                
                if (allImagesLoaded) {
                    clearInterval(checkInterval);
                    resolve(allImagesLoaded);
                }
            }, 500);
        });
        
        return promise;
    }

    function Sprite(sprite, x, y, w, h, speed) {
        this.sprite = sprite;
        
        this.spriteX = x;
        this.spriteY = y;
        
        this.totalSprites = this.spriteX * this.spriteY;
        this.currentSprite = 0;
        this.iterator = 0;
        
        this.spriteW = w;
        this.spriteH = h;
        
        this.speed = (speed !== undefined) ? speed : 0;
        
        this.getXYfromCurrentSprite = function() {
            return {
                x : (this.currentSprite % this.spriteX),
                y : Math.floor(this.currentSprite / this.spriteX)
            };
        };
        
        this.drawFromXY = function(x, y, spriteX, spriteY, width, height, alpha) {
            alpha = (alpha === undefined) ? 1 : alpha;
            game.ctx.save();
            game.ctx.globalAlpha = alpha;
            game.ctx.drawImage(this.sprite.img,  
                spriteX * this.spriteW, spriteY * this.spriteH, 
                this.spriteW, this.spriteH, 
                x, y, 
                width, height);
            game.ctx.restore();
            
            return this;
        };
        
        this.drawFromCurrentSprite = function(x, y, width, height, alpha) {
            alpha = (alpha === undefined) ? 1 : alpha;
            
            var spriteXY = this.getXYfromCurrentSprite();
            this.drawFromXY(x, y, spriteXY.x, spriteXY.y, width, height, alpha);
            
            return this;
        };
        
        this.nextSprite = function() {
            this.currentSprite = Math.round((this.iterator * this.speed) % (this.totalSprites - 1));
            this.iterator++;
            return this;
        };
        
        this.isTheLastSprite = function() {
            return (this.currentSprite === (this.totalSprites - 1));
        };
        
        return this;
    }
    
    function Clouds(game) {
        this.game = game;
        
        this.Cloud = function(game) {
            this.game = game;
            this.x = getRandom(this.game.width, this.game.width * 2);
            this.y = getRandom(0, this.game.height / 2);

            this.width = 280;
            this.height = 140;

            this.speed = getRandom(10, 30) / 10;
            this.alpha = getRandom(5, 10) / 10;
            
            this.spriteX = getRandom(0, 1);
            this.spriteY = getRandom(0, 3);

            this.sprite = new this.game.Sprite(this.game.assets.clouds, 2, 4, 280, 140);
            
            this.move = function() {
                this.x -= Math.round(1 * this.speed);
            };
            
            this.draw = function() {
                this.sprite.drawFromXY(this.x, this.y, this.spriteX, this.spriteY, this.width, this.height, this.alpha);
            };
            
            this.isOutOfScenary = function() {
                return ((this.x + this.width) < 0);
            };

            return this;
        };
        
        this.list = [];
        this.max = 20;
        
        this.addCloud = function() {
            if (this.list.length < this.max) {
                this.list.push(new this.Cloud(this.game));
            }
            
            return this;
        };
        
        this.removeCloud = function(index) {
            if (index >= 0 && index <= this.list.length) {
                this.list.splice(index, 1);
            }
            
            return this;
        };
        
        this.drawClouds = function() {
            for (var c = 0; c < this.list.length; c++) {
                var cloud = this.list[c];
                if (!cloud.isOutOfScenary()) {
                    cloud.draw();
                    cloud.move();
                } else {
                    this.removeCloud(c);
                    this.addCloud();
                }
            }
            
            return this;
        };
        
        this.create = function() {
            for (var c = 0; c < this.max; c++) {
                this.addCloud();
            }
            
            return this;
        };
        
        this.create();

        return this;
    }

    function Pipes(game) {
        this.game = game;
        
        this.Pipe = function(game) {
            this.game = game;

            this.position = getRandom(0, 20); //getRandom(0, Math.round(this.game.width / 110));

            var heightPortion = this.game.height / 8;

            this.x = this.game.width + (this.position * 150);
            this.y = this.game.height - getRandom(heightPortion * 2, heightPortion * 4);
            this.width = 110;
            this.height = 400;
            
            this.speed = 2;

            this.spriteX = getRandom(0, 2);

            this.sprite = new this.game.Sprite(this.game.assets.pipes, 1, 3, 220, 800);
            
            this.move = function() {
                this.x -= Math.round(1 * this.speed);
            };
            
            this.draw = function() {
                this.sprite.drawFromXY(this.x, this.y, this.spriteX, 0, this.width, this.height);
            };
            
            this.isOutOfScenary = function() {
                return ((this.x + this.width) < 0);
            };

            return this;
        };
        
        this.list = [];
        this.max = 10;
        
        this.addPipe = function() {
            if (this.list.length < this.max) {
                var pipe = null;
                
                do { // Check collision with other pipes to put in a empty position
                    pipe = new this.Pipe(this.game);
                } while (this.checkCollisionWithOtherPipes(pipe));
                
                this.list.push(pipe);
            }
            
            return this;
        };
        
        this.checkCollisionWithOtherPipes = function(newPipe) {
            for (var p = 0; p < this.list.length; p++) {
                var pipe = this.list[p];
                if (game.Collision().check.rect(newPipe, pipe)) {
                    return true;
                }
            }
            return false;
        };
        
        this.removePipe = function(index) {
            if (index >= 0 && index <= this.list.length) {
                this.list.splice(index, 1);
            }
            
            return this;
        };
        
        this.drawPipes = function() {
            for (var p = 0; p < this.list.length; p++) {
                var pipe = this.list[p];

                if (!pipe.isOutOfScenary()) {
                    pipe.draw();
                    pipe.move();
                } else {
                    this.removePipe(p);
                    this.addPipe();
                    this.game.player.addPipeToSaved();
                }
            }
            
            return this;
        };
        
        this.create = function() {
            for (var p = 0; p < this.max; p++) {
                this.addPipe();
            }
            
            return this;
        };
        
        this.create();

        return this;
    }
    
    function Birds(game) {
        this.game = game;
        
        this.Bird = function(game) {
            this.game = game;

            this.x = this.game.width + getRandom(0, this.game.width);
            this.y = getRandom(20, Math.round(this.game.height / 2));
            
            this.zoom = getRandom(0, 10) / 10;
            this.width = 60 * (1 + this.zoom);
            this.height = 78 * (1 + this.zoom);

            this.speed = getRandom(3, 6);
            this.amplitude = getRandom(1, 4);
            this.period = getRandom(30, 50);

            this.totalSprites = this.spriteX * this.spriteY;
            this.currentSprite = 0;
            
            this.sprite = new game.Sprite(this.game.assets.bird, 5, 4, 240, 310, this.speed / 10);
            
            this.move = function() {
                var frequencyH = Math.sin(2 * Math.PI * (this.game.iterator / this.period));
        
                this.x -= Math.round(1 * this.speed);
                this.y += Math.round(this.amplitude * frequencyH);
            };
            
            this.draw = function() {
                this.sprite.drawFromCurrentSprite(this.x, this.y, this.width, this.height);
                this.sprite.nextSprite();
            };
            
            this.isOutOfScenary = function() {
                return ((this.x + this.width) < 0);
            };

            return this;
        };
        
        this.addBird = function() {
            if (this.list.length < this.max) {
                this.list.push(new this.Bird(this.game));
            }
            
            game.audioController.setVolume('bird', 0.25).play('bird', false);
            
            return this;
        };
        
        this.removeBird = function(index) {
            if (index >= 0 && index <= this.list.length) {
                this.list.splice(index, 1);
            }
            
            return this;
        };
        
        this.removeAll = function() {
            this.list = [];
        };
        
        this.drawBirds = function() {
            for (var b = 0; b < this.list.length; b++) {
                var bird = this.list[b];

                if (!bird.isOutOfScenary()) {
                    bird.draw();
                    bird.move();
                } else {
                    this.removeBird(b);
                    this.addBird();
                    this.game.player.addBirdToSaved();
                }
            }
            
            for (var b = this.list.length; b < this.max; b++) {
                this.addBird();
            }
            
            return this;
        };
        
        this.create = function() {
            for (var b = 0; b < this.max; b++) {
                this.addBird();
            }
            
            return this;
        };
        
        this.list = [];
        this.max = 3;
        
        this.create();
        
        return this;
    }
    
    function Live(game) {
        this.game = game;
        
        this.x = null;
        this.y = null;
        this.width = 50;
        this.height = 50;

        this.sprite = new game.Sprite(game.assets.heart, 6, 1, 50, 50, 0.15);
        
        this.draw = function() {
            this.sprite.drawFromCurrentSprite(this.x, this.y, this.width, this.height);
            this.sprite.nextSprite();
            
            return this;
        };

        this.init = function(x, y) {
            this.x = x;
            this.y = y;
            
            return this;
        };
        
        return this;
    }

    function Player(game) {
        this.game = game;

        this.STATUS_DEAD = 0;
        this.STATUS_ALIVE = 1;
        this.status = this.STATUS_ALIVE; // 1 = Alive, 0 = Dead
        
        this.DIRECTION_UP = 'up';
        this.DIRECTION_DOWN = 'down';
        this.direction = this.DIRECTION_DOWN;
        
        this.width = 100;
        this.height = 80;
        this.x = -this.width;
        this.y = this.game.height / 3;
        
        this.upSpeed = 1.5;
        this.downSpeed = 2;
        this.horizontalSpeed = 0.5;
        
        this.maxSpriteUp = 2;
        this.maxSpriteDown = 6;
        this.spriteSpeed = 0.20;
        this.iterator = 4 / this.spriteSpeed; // To begin on 2º row, and iterate with 0.25 speed
        
        this.time = null;
        this.totalTime = 0;
        
        this.pipesSaved = 0;
        this.birdsSaved = 0;
        
        this.sprite = new game.Sprite(game.assets.airplane, 4, 2, 100, 80, this.spriteSpeed);

        this.maxLives = 3;
        this.lives = this.maxLives;
        this.heartLives = [];

        this.changeDirection = function(direction) {
            this.direction = direction;

            switch (direction) {
                case this.DIRECTION_UP:
                    this.iterator = (this.maxSpriteDown + 1) / this.spriteSpeed;
                    break;
                case this.DIRECTION_DOWN:
                    this.iterator = (this.maxSpriteUp + 1) / this.spriteSpeed;
                    break;
            }
            
            return this;
        };
        
        this.move = function() {
            if (this.x < 100) {
                this.x += Math.round(1 * this.horizontalSpeed);
                this.sprite.currentSprite = 4;
            } else {
                if (this.status !== 0) {
                    switch (this.direction) {
                        case this.DIRECTION_UP:
                            this.y -= Math.round(1 * this.upSpeed);

                            if ((this.sprite.currentSprite < this.maxSpriteUp) || (this.sprite.currentSprite >= this.sprite.spriteX)) {
                                this.sprite.currentSprite = (Math.round((this.iterator * this.spriteSpeed)) % this.sprite.totalSprites);
                            }
                            break;

                        case this.DIRECTION_DOWN:
                            this.y += Math.round(1 * this.downSpeed);

                            if ((this.sprite.currentSprite < this.maxSpriteDown)) {
                                this.sprite.currentSprite = (Math.round((this.iterator * this.spriteSpeed)) % this.sprite.totalSprites);
                            }
                            break;
                    }

                    this.iterator++;
                }
            }
            
            return this;
        };
        
        this.addLive = function() {
            if (this.lives < this.maxLives) {
                this.lives++;
                this.heartLives.push(new game.models.Live(this.game));
            }
            
            return this;
        };
        
        this.removeLive = function() {
            if (this.lives > 0) {
                this.lives--;
                this.heartLives.splice(this.heartLives.length - 1, 1);
            }
            
            return this;
        };
        
        this.createLives = function() {
            for (var l = 0; l < this.lives; l++) {
                this.heartLives.push(new game.models.Live(this.game));
            }
            
            return this;
        };
        
        this.drawLives = function() {
            var x = this.game.width - 200;
            var y = 20;
            
            for (var l = 0; l < this.lives; l++) {
                var live = this.heartLives[l];
                live.init(x, y).draw();
                x += live.width + 10;
            }
            
            return this;
        };
        
        this.draw = function() {
            if (this.status === 1) {
                var alpha = (this.x < 100) ? Math.abs(Math.sin(0.2 * this.game.iterator)) : 1;
                this.sprite.drawFromCurrentSprite(this.x, this.y, this.width, this.height, alpha);
            }
        
            return this;
        };
        
        this.addPipeToSaved = function() {
            if (this.x >= 100) {
                this.pipesSaved++;
            }
            
            if (this.pipesSaved === 100) {
                this.game.status = this.game.STATUS_YOUWIN;
            }
            
            return this;
        };
        
        this.addBirdToSaved = function() {
            if (this.x >= 100) {
                this.birdsSaved++;
            }
            
            if (this.birdsSaved === 25) {
                this.game.birds.max = 5;
            }
            
            if (this.birdsSaved === 50) {
                this.game.birds.max = 7;
            }
            
            if (this.birdsSaved === 75) {
                this.game.birds.max = 10;
            }
            
            if (this.birdsSaved === 100) {
//                this.time = new Date();
//                var timeDif = this.time - this.game.time;
//                this.totalTime += timeDif;
                this.time = new Date();
                this.game.status = this.game.STATUS_YOUWIN;
            }
            
            return this;
        };

        this.reload = function() {
//            var timeDif = this.time - this.game.time;
//            this.totalTime += timeDif;
            
            this.getTotalTime();
            this.removeLive();
            
            if (this.lives > 0) {
                this.game.birds.removeAll();
                this.init();
            } else {
                game.status = 3;
            }
            
            return this;
        };
        
        this.drawTime = function() {
            this.time = new Date();
            
            var timeDif = this.time - this.game.time;
            var time = new Date(timeDif);
            var minutes = (time.getMinutes() < 10) ? '0' + time.getMinutes() : time.getMinutes();
            var seconds = (time.getSeconds() < 10) ? '0' + time.getSeconds() : time.getSeconds();
            var millisecs = (time.getMilliseconds() < 10) ? '00' + time.getMilliseconds() : (time.getMilliseconds() < 100) ? '0' + time.getMilliseconds() : time.getMilliseconds();
            
            this.game.ctx.save();
            var style = {
                fill : 'rgba(255, 0, 0, 0.75)',
                stroke : 'rgba(255, 255, 255, 1)',
                lineWidth : 2
            };
            this.game.drawText(minutes + ":" + seconds + ":" + millisecs, 'bold 24px monospace', style, 'center', 30);
            this.game.ctx.restore();
            
            return this;
        };
        
        this.getTotalTime = function() {
            var timeDif = this.time - this.game.time;
            this.totalTime += timeDif;
            return this.totalTime;
        };
        
        this.init = function() {
            this.status = this.STATUS_ALIVE;
            this.direction = this.DIRECTION_DOWN;
            this.x = -this.width;
            this.y = this.game.height / 3;
            this.iterator = 4 / this.spriteSpeed;
            
            this.game.audioController.setVolume('biplane', 0.75).play('biplane', true);
            
            return this;
        };
        
        this.createLives();
        this.init();
        
        return this;
    }
    
    function Explosion(game) {
        this.game = game;
        
        this.x = null;
        this.y = null;
        this.width = 150;
        this.height = 150;
        
        this.spriteSpeed = 0.2;

        this.sprite = new game.Sprite(game.assets.explosion, 5, 4, 96, 96, this.spriteSpeed);
        
        this.draw = function() {
            var that = this;
            this.sprite.drawFromCurrentSprite(this.x, this.y, this.width, this.height);
            this.sprite.nextSprite();
            
            var promise = new Promise(function (resolve, reject) {
                if (that.sprite.isTheLastSprite()) {
                    resolve();
                }
            });
            
            return promise;
        };
        
        this.init = function(x, y) {
            this.x = x;
            this.y = y;
            this.sprite.iterator = 0;
            
            game.audioController.setVolume('explosion', 1).play('explosion', false);
            
            return this;
        };
        
        return this;
    }
    
    function Collision() {
        var check = {};
        
        check.rect = function(object1, object2, margin) {
            margin = (margin === undefined) ? 0 : margin;
            
            return ((object1.x + margin) < (object2.x + object2.width - margin) && // object1 at right of object2
                (object1.x + object1.width - margin) > (object2.x + margin) && // object1 at left of object2
                (object1.y + margin) < (object2.y + object2.height - margin) && // object1 below object2
                (object1.y + object1.height - margin) > (object2.y + margin)); // object1 over object2
        };
        
        check.circle = function(object1, object2, margin) {
            margin = (margin === undefined) ? 0 : margin;
            
            var circle1 = {
                x: object1.x + (object1.width / 2),
                y: object1.y + (object1.height / 2), 
                radius: (object1.width / 2) - margin
            };
            var circle2 = {
                x: object2.x + (object2.width / 2),
                y: object2.y + (object2.height / 2), 
                radius: (object2.width / 2) - margin
            };

            var dx = circle1.x - circle2.x;
            var dy = circle1.y - circle2.y;
            var distance = Math.sqrt(dx * dx + dy * dy);

            return (distance < circle1.radius + circle2.radius);
        };
        
        this.check = check;
        
        return this;
    }
    
    function AudioController() {
        this.audios = {};
        
        this.load = function(src) {
            var obj = {
                player : document.createElement('audio'),
                loaded : false,
                volume : 100
            };
            obj.player.setAttribute('src', src);
            obj.player.autoplay = false;
            obj.player.load();
            obj.player.addEventListener('canplay', function() {
                obj.loaded = true;
            });
            
            return obj;
        };
        
        this.preload = function() {
            for (var a in game.assets.audio) {
                var src = game.assets.audio[a];
                this.audios[a] = this.load(src);
            }
            
            var that = this;
            var promise = new Promise(function (resolve, reject) {
                var checkInterval = setInterval(function() {
                    var allAudiosLoaded = true;
                    for (var a in that.audios) {
                        allAudiosLoaded = allAudiosLoaded && that.audios[a].loaded;
                    }

                    if (allAudiosLoaded) {
                        clearInterval(checkInterval);
                        resolve(allAudiosLoaded);
                    }
                }, 500);
            });
            
            return promise;
        };
        
        this.play = function(audio, loop) {
            var sound = this.audios[audio];
            sound.player.loop = (loop !== undefined) ? loop : false;
            
            if (sound.loaded) {
                sound.player.play();
            }
            
            return this;
        };
        
        this.pause = function(audio) {
            var sound = this.audios[audio];
            sound.player.pause();
            
            return this;
        };
        
        this.setVolume = function(audio, volume) {
            var sound = this.audios[audio];
            sound.volume = volume;
            sound.player.volume = volume;
            
            return this;
        };
        
        return this;
    }
    
    game.getRandom = getRandom;
    game.roundRect = roundRect;
    game.drawText = drawText;
    game.loadImage = loadImage;
    game.preloadImages = preloadImages;
    
    game.Collision = Collision;
    game.AudioController = AudioController;
    game.Sprite = Sprite;

    game.muted = false;
    game.paused = false;
    
    game.STATUS_MAINTITLE = 0;
    game.STATUS_PLAYING = 1;
    game.STATUS_YOUWIN = 2;
    game.STATUS_YOULOSE = 3;
    
    game.assets = {
        src : {
            maintitle : 'assets/images/maintitle.png',
            background : 'assets/images/background.jpg',
            clouds : 'assets/images/clouds.png',
            pipes : 'assets/images/pipes.png',
            groundfloor : 'assets/images/groundfloor.png',
            bird : 'assets/images/bird.png',
            airplane : 'assets/images/airplane.png',
            explosion : 'assets/images/explosion.png',
            heart : 'assets/images/lives.png'
        },
        audio : {
            soundtrack : 'assets/audio/soundtrack.mp3',
            biplane : 'assets/audio/biplane.mp3',
            explosion : 'assets/audio/exploding.mp3',
            bird : 'assets/audio/bird.mp3'
        }
    };
    
    game.models = {
        Clouds : Clouds,
        Pipes : Pipes,
        Birds : Birds,
        Player : Player,
        Live : Live,
        Explosion : Explosion
    };
    
    game.drawBackground = drawBackground;
    game.drawMainTitle = drawMainTitle;
    game.drawGroundfloor = drawGroundfloor;
    game.drawPauseMenu = drawPauseMenu;
    game.drawWinMessage = drawWinMessage;
    game.drawLoseMessage = drawLoseMessage;
    
    game.checkCollisionBetweenAirPlaneAndSkyOrGround = checkCollisionBetweenAirPlaneAndSkyOrGround;
    game.checkCollisionBetweenAirPlaneAndPipes = checkCollisionBetweenAirPlaneAndPipes;
    game.checkCollisionBetweenAirPlaneAndBirds = checkCollisionBetweenAirPlaneAndBirds;
    game.checkCollisions = checkCollisions;
    
    game.mute = mute;
    game.pause = pause;
    game.iterate = iterate;
    game.drawGame = drawGame;
    
    game.keyDownHandler = keyDownHandler;
    game.keyUpHandler = keyUpHandler;
    game.mouseDownHandler = mouseDownHandler;
    game.mouseUpHandler = mouseUpHandler;
    game.windowResizeHandler = windowResizeHandler;
    
    game.start = start;
    game.begin = begin;
    game.init = init;
    
    function drawBackground() {
        var backgroundImg = game.assets.background.img;
        
        var posX = Math.round((game.iterator * 0.5) % game.canvas.width) ;
        
        game.ctx.save();
        game.ctx.drawImage(backgroundImg,
            0, 0, 
            backgroundImg.width, backgroundImg.height, 
            -posX, 0, 
            game.canvas.width, game.canvas.height
        );
        game.ctx.drawImage(backgroundImg, 
            0, 0, 
            backgroundImg.width, backgroundImg.height, 
            game.canvas.width - posX, 0, 
            game.canvas.width, game.canvas.height
        );
        game.ctx.strokeRect(0, 0, game.canvas.width, game.canvas.height);
        game.ctx.restore();
    }
    
    function drawMainTitle() {
        var titleImg = game.assets.maintitle.img;
        
        var posX = Math.round((game.canvas.width - titleImg.width) / 2);
        var posY = Math.round((game.canvas.height - titleImg.height) / 2);
        
        game.ctx.save();
        
        game.ctx.drawImage(titleImg,
                posX, posY, 
                titleImg.width, titleImg.height);
                
        var style = {
            fill : 'rgba(255, 0, 0, 0.75)',
            stroke : 'rgba(255, 255, 255, 1)',
            lineWidth : 2
        };
        
        game.drawText("Para comenzar: pulsa la tecla espacio", '32px fantasy', style, 'center', game.canvas.height - 240);
        game.drawText("o pulsa el botón izquierdo del ratón", '32px fantasy', style, 'center', game.canvas.height - 200);
        game.ctx.restore();
    }

    function drawGroundfloor() {
        var groundFloorImg = game.assets.groundfloor.img;
        
        var posX = -Math.round((game.iterator % groundFloorImg.width) * 2);
        var groundTiles = Math.ceil(game.canvas.width / groundFloorImg.width) + 2;
        
        game.ctx.save();
        for (var t = 0; t < groundTiles; t++) {
            game.ctx.drawImage(groundFloorImg,  
                posX + (t * groundFloorImg.width), game.canvas.height - groundFloorImg.height, 
                groundFloorImg.width, groundFloorImg.height);
        }
        game.ctx.restore();
    }
    
    function drawPauseMenu() {
        if (!game.pauseStrShowed) {
            var titleImg = game.assets.maintitle.img;

            var posX = Math.round((game.canvas.width - titleImg.width) / 2);
            var posY = Math.round((game.canvas.height - titleImg.height) / 2);

            game.ctx.save();
            game.ctx.fillStyle = 'rgba(127, 0, 0, 0.25)';
            game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
            
            game.ctx.globalAlpha = 0.5;
            game.ctx.drawImage(titleImg,
                    posX, posY, 
                    titleImg.width, titleImg.height);

            game.ctx.globalAlpha = 1;
            var style = {
                fill : 'rgba(255, 0, 0, 0.75)',
                stroke : 'rgba(255, 255, 255, 1)',
                lineWidth : 2
            };

            game.drawText("PAUSA", 'bold 64px fantasy', style, 'center', game.canvas.height / 2);
            game.pauseStrShowed = true;
        }

    }
    
    function drawWinMessage() {
        game.audioController.pause('biplane');
        
        game.ctx.save();
        game.ctx.lineWidth = 4;
        game.ctx.strokeStyle = 'rgba(0, 127, 0, 0.75';
        game.ctx.fillStyle = 'rgba(0, 127, 0, 0.5)';
        game.roundRect((game.canvas.width / 2) - 250, (game.canvas.height / 2) - 100, 500, 200, 10, true);
        game.ctx.restore();
        
        game.ctx.save();
        var style = {
            fill : 'rgba(0, 127, 0, 0.5)',
            stroke : 'rgba(255, 255, 255, 1)',
            lineWidth : 4
        };
        game.drawText("Has ganado!", 'bold 48px fantasy', style, 'center', (game.canvas.height / 2) - 150);
        game.ctx.restore();
        
        game.ctx.save();
        var style = {
            fill : 'rgba(255, 255, 255, 1)'
        };
        
        var time = new Date(game.player.getTotalTime());
        var minutes = (time.getMinutes() < 10) ? '0' + time.getMinutes() : time.getMinutes();
        var seconds = (time.getSeconds() < 10) ? '0' + time.getSeconds() : time.getSeconds();
        var millisecs = (time.getMilliseconds() < 10) ? '00' + time.getMilliseconds() : (time.getMilliseconds() < 100) ? '0' + time.getMilliseconds() : time.getMilliseconds();
        
        game.drawText("Has logrado durar: " + minutes + ":" + seconds + ":" + millisecs, 'bold 24px fantasy', style, 'center', (game.canvas.height / 2) - 60);
        game.drawText("Has esquivado " + game.player.pipesSaved + " tuberías.", 'bold 24px fantasy', style, 'center', (game.canvas.height / 2) - 20);
        game.drawText("Has esquivado " + game.player.birdsSaved + " pájaros.", 'bold 24px fantasy', style, 'center', (game.canvas.height / 2) + 20);
        game.drawText("¡Enhorabuena! ¿Te atreves a durar más tiempo?", 'bold 24px fantasy', style, 'center', (game.canvas.height / 2) + 60);
        game.ctx.restore();
        
        game.ctx.save();
        var style = {
            fill : 'rgba(0, 127, 0, 0.75)',
            stroke : 'rgba(255, 255, 255, 1)',
            lineWidth : 2
        };
        game.drawText("Pulsa 'R' para comenzar de nuevo.", 'bold 24px fantasy', style, 'center', (game.canvas.height / 2) + 140);
        game.ctx.restore();
    }
    
    function drawLoseMessage() {
        game.audioController.pause('biplane');
        
        game.ctx.save();
        game.ctx.lineWidth = 4;
        game.ctx.strokeStyle = 'rgba(255, 0, 0, 0.75';
        game.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        game.roundRect((game.canvas.width / 2) - 250, (game.canvas.height / 2) - 100, 500, 200, 10, true);
        game.ctx.restore();
        
        game.ctx.save();
        var style = {
            fill : 'rgba(255, 0, 0, 0.5)',
            stroke : 'rgba(255, 255, 255, 1)',
            lineWidth : 4
        };
        game.drawText("Has perdido!", 'bold 48px fantasy', style, 'center', (game.canvas.height / 2) - 150);
        game.ctx.restore();
        
        game.ctx.save();
        var style = {
            fill : 'rgba(255, 255, 255, 1)'
        };
        
        var time = new Date(game.player.getTotalTime());
        var minutes = (time.getMinutes() < 10) ? '0' + time.getMinutes() : time.getMinutes();
        var seconds = (time.getSeconds() < 10) ? '0' + time.getSeconds() : time.getSeconds();
        var millisecs = (time.getMilliseconds() < 10) ? '00' + time.getMilliseconds() : (time.getMilliseconds() < 100) ? '0' + time.getMilliseconds() : time.getMilliseconds();
        
        game.drawText("Has conseguido durar: " + minutes + ":" + seconds + ":" + millisecs, 'bold 24px fantasy', style, 'center', (game.canvas.height / 2) - 60);
        game.drawText("Has esquivado " + game.player.pipesSaved + " tuberías.", 'bold 24px fantasy', style, 'center', (game.canvas.height / 2) - 20);
        game.drawText("Has esquivado " + game.player.birdsSaved + " pájaros.", 'bold 24px fantasy', style, 'center', (game.canvas.height / 2) + 20);
        game.drawText("A ver si la próxima vez tienes más suerte ;-)", 'bold 24px fantasy', style, 'center', (game.canvas.height / 2) + 60);
        game.ctx.restore();
        
        game.ctx.save();
        var style = {
            fill : 'rgba(255, 0, 0, 0.75)',
            stroke : 'rgba(255, 255, 255, 1)',
            lineWidth : 2
        };
        game.drawText("Pulsa 'R' para comenzar de nuevo.", 'bold 24px fantasy', style, 'center', (game.canvas.height / 2) + 140);
        game.ctx.restore();
    }
    
    function checkCollisionBetweenAirPlaneAndSkyOrGround() {
        if ((game.player.y < 0) || // Collision with top Sky
            ((game.player.y + game.player.height) >= (game.canvas.height - game.assets.groundfloor.img.height + 20))) { // Collision with ground
             game.explosion.init(game.player.x, game.player.y);
             game.player.status = 0;
        }
    }
    
    function checkCollisionBetweenAirPlaneAndPipes() {
        for (var p = 0; p < game.pipes.list.length; p++) {
            var pipe = game.pipes.list[p];
            if (game.Collision().check.rect(game.player, pipe, 5)) {
                game.explosion.init(game.player.x, game.player.y);
                game.player.status = 0;
                return;
            }
        }
    }
    
    function checkCollisionBetweenAirPlaneAndBirds() {
        for (var b = 0; b < game.birds.list.length; b++) {
            var bird = game.birds.list[b];
            if (game.Collision().check.circle(game.player, bird, 5)) {
                game.birds.list.splice(b, 1);
                game.explosion.init(game.player.x, game.player.y);
                game.player.status = 0;
                return;
            }
        }
    }
    
    function checkCollisions() {
        if (game.player.x >= 100) {
            game.checkCollisionBetweenAirPlaneAndSkyOrGround();
            game.checkCollisionBetweenAirPlaneAndPipes();
            game.checkCollisionBetweenAirPlaneAndBirds();
        }
    }

    function keyDownHandler(event) {
        switch (game.status) {
            case game.STATUS_PLAYING:
                if (event.code === 'Space') {
                    game.player.changeDirection(game.player.DIRECTION_UP);
                }
                break;
        }
    }
    
    function keyUpHandler(event) {
        switch (game.status) {
            case game.STATUS_MAINTITLE:
                switch (event.code) {
                    case 'Space':
                        game.start();
                        break;
                    case 'KeyS':
                        game.mute();
                        break;
                }
                break;
                
            case game.STATUS_PLAYING:
                switch (event.code) {
                    case 'Space':
                        game.player.changeDirection(game.player.DIRECTION_DOWN);
                        break;
                    case 'KeyP':
                        game.pause();
                        break;
                    case 'KeyR':
                        game.begin();
                        break;
                    case 'KeyS':
                        game.mute();
                        break;
                }
                break;
                
            case game.STATUS_YOUWIN:
            case game.STATUS_YOULOSE:
                switch (event.code) {
                    case 'KeyR':
                        game.begin();
                        break;
                    case 'KeyS':
                        game.mute();
                        break;
                }
        }
    }
    
    function mouseDownHandler(event) {
        switch (game.status) {
            case game.STATUS_PLAYING:
                game.player.changeDirection(game.player.DIRECTION_UP);
                break;
        }
    }
    
    function mouseUpHandler(event) {
        //console.log("Mouse soltado!");
        switch (game.status) {
            case game.STATUS_MAINTITLE:
                game.start();
                break;
                
            case game.STATUS_PLAYING:
                game.player.changeDirection(game.player.DIRECTION_DOWN);
                break;
                
            case 2: // Win
            case 3: // Lose
                game.begin();
                break;
        }
    }
    
    function windowResizeHandler(event) {
        game.canvas.setAttribute("width", window.innerWidth - 5);
        game.canvas.setAttribute("height", window.innerHeight - 5);
    }
    
    function mute(status) {
        game.muted = (status === undefined) ? !game.muted : status;
        
        if (game.muted) {
            game.audioController.pause('soundtrack');
            game.audioController.pause('biplane');
        } else {
            game.audioController.play('soundtrack', true);
            game.audioController.play('biplane', true);
        }
    }
    
    function pause() {
        game.paused = !game.paused;
        game.mute(game.paused);        
    }
    
    function iterate() {
        game.iterator++;
    }
    
    function drawGame() {
        if (!game.paused) {
            game.pauseStrShowed = false;
            
            game.drawBackground();
            game.clouds.drawClouds();
        
            switch (game.status) {
                case game.STATUS_MAINTITLE:
                    game.drawMainTitle();
                    break;

                case game.STATUS_PLAYING:
                    game.pipes.drawPipes();
                    game.birds.drawBirds();
                    game.player.draw().drawTime().drawLives().move();
                    
                    if (game.player.status === game.player.STATUS_DEAD) {
                        game.explosion.draw().then(function() {
                            game.player.reload();
                            game.time = new Date();
                        });
                    } else {
                        game.checkCollisions();
                    }
                    
                    break;

                case game.STATUS_YOUWIN:
                    game.drawWinMessage();
                    break;

                case game.STATUS_YOULOSE:
                    game.drawLoseMessage();
                    break;
            }
        
            game.drawGroundfloor();
            game.iterate();
        } else {
            game.drawPauseMenu();
        }
        
        window.requestAnimationFrame(game.drawGame);
    }
    
    function start() {
        game.time = new Date();
        game.player = new game.models.Player(game);
        game.status = game.STATUS_PLAYING;
    }
    
    function begin() {
        game.status = game.STATUS_MAINTITLE;
        game.paused = false;
        game.iterator = 0;
    }
    
    function init() {
        game.error = false;
        
        game.audioController = new game.AudioController();
        
        game.audioController.preload().then(function() {
            game.preloadImages().then(function() {
                game.canvas = document.getElementById(canvasId);
                game.canvas.setAttribute("width", window.innerWidth - 20);
                game.canvas.setAttribute("height", window.innerHeight - 20);

                if (game.canvas.getContext) {
                    game.ctx = game.canvas.getContext('2d');

                    game.width = game.canvas.width;
                    game.height = game.canvas.height;

                    game.clouds = new game.models.Clouds(game);
                    game.pipes = new game.models.Pipes(game);
                    game.birds = new game.models.Birds(game);
                    game.explosion = new game.models.Explosion(game);

                    game.audioController.setVolume('soundtrack', 0.25).play('soundtrack', true);
                    game.begin();

                    window.addEventListener('keydown', game.keyDownHandler);
                    window.addEventListener('keyup', game.keyUpHandler);
                    window.addEventListener('resize', game.windowResizeHandler);
                    window.addEventListener('mousedown', game.mouseDownHandler);
                    window.addEventListener('mouseup', game.mouseUpHandler);

                    window.requestAnimationFrame(game.drawGame);
                } else {
                    game.error = true;
                }

            });
        });
    }

}

function main() {
    var game = new Game("game");
    game.init();
}

window.addEventListener("load", main);