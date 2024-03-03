/* Ducky Dash: Poolside Peril */

var Colors = {
    poolInside: 0x43ade3,
    poolOutside: 0x83d5ed,
    darkBlue: 0x18719f,
    blue: 0x1c83b8,
};

window.addEventListener('load', function(){
	new Pool();
});

function Pool() {
    var self = this;
    var element, scene, camera, character, renderer, light, objects, paused, keysAllowed, score, difficulty, donutPresence, donutSize, fogDistance, gameOver;
    initialize();

    function initialize() {
        gameOver = false;
		paused = true;
        score = 0;
        difficulty = 0;

        // get from html
        element = document.getElementById('pool');
        document.getElementById("score").innerHTML = score;

        // initialize set-up
        renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true
		});
		renderer.setSize(element.clientWidth, element.clientHeight);
		renderer.shadowMap.enabled = true;
		element.appendChild(renderer.domElement);

		scene = new THREE.Scene();
		fogDistance = 40000;
		scene.fog = new THREE.Fog(0xbadbe4, 1, fogDistance);

        camera = new THREE.PerspectiveCamera(60, element.clientWidth / element.clientHeight, 1, 120000);
		camera.position.set(0, 1500, -2000);
		camera.lookAt(new THREE.Vector3(0, 600, -5000));
		window.camera = camera;

        light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
		scene.add(light);

        character = new Character();
		scene.add(character.element);

        var ground = createBox(3000, 20, 120000, Colors.sand, 0, -400, -60000);
		scene.add(ground);

        // add donuts
		objects = [];
		donutPresence = 0.2;
		donutSize = 0.5;
		for (var i = 10; i < 40; i++) {
			createDonuts(i * -3000, donutPresence, 0.5, donutSize);
		}

        // keys
        keysAllowed = {};
        var up = 38;
        var left = 37;
		var right = 39;
		var pause = 80;

        document.addEventListener('keydown',function(e) {
			if (!gameOver) {
				var key = e.keyCode;
				if (keysAllowed[key] === false) return;
				keysAllowed[key] = false;
				if (paused && !collisionsDetected() && key > 18) {
					paused = false;
					character.onUnpause();
					document.getElementById("variable-content").style.visibility = "hidden";
					document.getElementById("controls").style.display = "none";
				} 
                else {
					if (key == pause) {
						paused = true;
						character.onPause();
						document.getElementById("variable-content").style.visibility = "visible";
						document.getElementById("variable-content").innerHTML = "Game is paused. Press any key to resume.";
					}
					if (key == up && !paused) {character.onUpKeyPressed();}
                    if (key == left && !paused) {character.onLeftKeyPressed();}
					if (key == right && !paused) {character.onRightKeyPressed();}
				}
			}
		});
		
        document.addEventListener('keyup',function(e) { keysAllowed[e.keyCode] = true;});
		document.addEventListener('focus',function(e) {keysAllowed = {};});
        window.addEventListener('resize', handleWindowResize, false);

		loop();
    }
}

function loop() {
    // if the game is ongoing
    if (!paused) {

        // Add more donuts
        if ((objects[objects.length - 1].mesh.position.z) % 3000 == 0) {
            difficulty += 1;
            var levelLength = 30;
            if (difficulty % levelLength == 0) {
                var level = difficulty / levelLength;
                switch (level) {
                    case 1:
                        donutPresence = 0.35;
                        donutSize = 0.5;
                        break;
                    case 2:
                        donutPresence = 0.35;
                        donutSize = 0.85;
                        break;
                    case 3:
                        donutPresence = 0.5;
                        donutSize = 0.85;
                        break;
                    case 4:
                        donutPresence = 0.5;
                        donutSize = 1.1;
                        break;
                    case 5:
                        donutPresence = 0.5;
                        donutSize = 1.1;
                        break;
                    case 6:
                        donutPresence = 0.55;
                        donutSize = 1.1;
                        break;
                    default:
                        donutPresence = 0.55;
                        donutSize = 1.25;
                }
            }
            if ((difficulty >= 5 * levelLength && difficulty < 6 * levelLength)) {
                fogDistance -= (25000 / levelLength);
            } else if (difficulty >= 8 * levelLength && difficulty < 9 * levelLength) {
                fogDistance -= (5000 / levelLength);
            }
            createDonuts(-120000, donutPresence, 0.5, donutSize);
            scene.fog.far = fogDistance;
        }

        // Shorten the distance of donuts
        objects.forEach(function(object) {
            object.mesh.position.z += 100;
        });

        // Remove excess donuts
        objects = objects.filter(function(object) {
            return object.mesh.position.z < 0;
        });

        character.update();

        // Check for collisions between the character and objects.
        if (collisionsDetected()) {
            gameOver = true;
            paused = true;
            document.addEventListener('keydown', function(e) {
                    if (e.keyCode == 40)
                    document.location.reload(true);
                }
            );

            var variableContent = document.getElementById("variable-content");
            variableContent.style.visibility = "visible";
            variableContent.innerHTML = "Game over! Press the down arrow to try again.";
        }

        // Update scores
        score += 10;
        document.getElementById("score").innerHTML = score;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}

function createDonuts(position, probability, minScale, maxScale) {
    for (var lane = -1; lane < 2; lane++) {
        var randomNumber = Math.random();
        if (randomNumber < probability) {
            var scale = minScale + (maxScale - minScale) * Math.random();
            var donut = new Donut(lane * 800, -400, position, scale);
            objects.push(donut);
            scene.add(donut.mesh);
        }
    } 
}

function collisionsDetected() {
    var charMinX = character.element.position.x - 115;
    var charMaxX = character.element.position.x + 115;
    var charMinY = character.element.position.y - 310;
    var charMaxY = character.element.position.y + 320;
    var charMinZ = character.element.position.z - 40;
    var charMaxZ = character.element.position.z + 40;
    for (var i = 0; i < objects.length; i++) {
        if (objects[i].collides(charMinX, charMaxX, charMinY, 
                charMaxY, charMinZ, charMaxZ)) {
            return true;
        }
    }
    return false;
}

function handleWindowResize() {
    renderer.setSize(element.clientWidth, element.clientHeight);
    camera.aspect = element.clientWidth / element.clientHeight;
    camera.updateProjectionMatrix();
}

function Character() {

    var self = this;

    this.jumpDuration = 0.6;
    this.jumpHeight = 2000;

    var loader = new THREE.GLTFLoader();
    loader.load('/duck.glb', function (gltf) {
        self.element = gltf.scene;
        self.element.position.set(0, 0, -4000);
        initialize();
    });

    this.update = function() {

		// Obtain the curren time for future calculations.
		var currentTime = new Date() / 1000;

		// Apply actions to the character if none are currently being
		// carried out.
		if (!self.isJumping &&
			!self.isSwitchingLeft &&
			!self.isSwitchingRight &&
			self.queuedActions.length > 0) {
			switch(self.queuedActions.shift()) {
				case "up":
					self.isJumping = true;
					self.jumpStartTime = new Date() / 1000;
					break;
				case "left":
					if (self.currentLane != -1) {
						self.isSwitchingLeft = true;
					}
					break;
				case "right":
					if (self.currentLane != 1) {
						self.isSwitchingRight = true;
					}
					break;
			}
		}

		// If the character is jumping, update the height of the character
		if (self.isJumping) {
			var jumpClock = currentTime - self.jumpStartTime;
			self.element.position.y = self.jumpHeight * Math.sin(
				(1 / self.jumpDuration) * Math.PI * jumpClock) +
				sinusoid(2 * self.stepFreq, 0, 20, 0,
					self.jumpStartTime - self.runningStartTime);
			if (jumpClock > self.jumpDuration) {
				self.isJumping = false;
				self.runningStartTime += self.jumpDuration;
			}
		} else {
			var runningClock = currentTime - self.runningStartTime;
			self.element.position.y = sinusoid(
				2 * self.stepFreq, 0, 20, 0, runningClock);
			self.head.rotation.x = sinusoid(
				2 * self.stepFreq, -10, -5, 0, runningClock) * deg2Rad;
			self.torso.rotation.x = sinusoid(
				2 * self.stepFreq, -10, -5, 180, runningClock) * deg2Rad;
			self.leftArm.rotation.x = sinusoid(
				self.stepFreq, -70, 50, 180, runningClock) * deg2Rad;
			self.rightArm.rotation.x = sinusoid(
				self.stepFreq, -70, 50, 0, runningClock) * deg2Rad;
			self.leftLowerArm.rotation.x = sinusoid(
				self.stepFreq, 70, 140, 180, runningClock) * deg2Rad;
			self.rightLowerArm.rotation.x = sinusoid(
				self.stepFreq, 70, 140, 0, runningClock) * deg2Rad;
			self.leftLeg.rotation.x = sinusoid(
				self.stepFreq, -20, 80, 0, runningClock) * deg2Rad;
			self.rightLeg.rotation.x = sinusoid(
				self.stepFreq, -20, 80, 180, runningClock) * deg2Rad;
			self.leftLowerLeg.rotation.x = sinusoid(
				self.stepFreq, -130, 5, 240, runningClock) * deg2Rad;
			self.rightLowerLeg.rotation.x = sinusoid(
				self.stepFreq, -130, 5, 60, runningClock) * deg2Rad;

			// If the character is not jumping, it may be switching lanes.
			if (self.isSwitchingLeft) {
				self.element.position.x -= 200;
				var offset = self.currentLane * 800 - self.element.position.x;
				if (offset > 800) {
					self.currentLane -= 1;
					self.element.position.x = self.currentLane * 800;
					self.isSwitchingLeft = false;
				}
			}
			if (self.isSwitchingRight) {
				self.element.position.x += 200;
				var offset = self.element.position.x - self.currentLane * 800;
				if (offset > 800) {
					self.currentLane += 1;
					self.element.position.x = self.currentLane * 800;
					self.isSwitchingRight = false;
				}
			}
		}
	}

	this.onLeftKeyPressed = function() {self.queuedActions.push("left");}
	this.onUpKeyPressed = function() {self.queuedActions.push("up");}
	this.onRightKeyPressed = function() {self.queuedActions.push("right");}
    this.onPause = function() {self.pauseStartTime = new Date() / 1000;}

	this.onUnpause = function() {
		var currentTime = new Date() / 1000;
		var pauseDuration = currentTime - self.pauseStartTime;
		self.runningStartTime += pauseDuration;
		if (self.isJumping) {
			self.jumpStartTime += pauseDuration;
		}
	}
}

function sinusoid(frequency, minimum, maximum, phase, time) {
	var amplitude = 0.5 * (maximum - minimum);
	var angularFrequency = 2 * Math.PI * frequency;
	var phaseRadians = phase * Math.PI / 180;
	var offset = amplitude * Math.sin(
		angularFrequency * time + phaseRadians);
	var average = (minimum + maximum) / 2;
	return average + offset;
}

function Donut (x, y, z, s) {

    var self = this;
    this.mesh = new THREE.Object3D();

    var loader = new THREE.GLTFLoader();
    loader.load('/donut.glb', function (gltf) {
        self.mesh = gltf.scene;
        self.mesh.position.set(x, y, z);
        self.mesh.scale.set(s, s, s);
    });

    // check for collisions
    this.collides = function (minX, maxX, minY, maxY, minZ, maxZ) {
        var DonutMinX = self.mesh.position.x - this.scale * 250;
        var DonutMaxX = self.mesh.position.x + this.scale * 250;
        var DonutMinY = self.mesh.position.y;
        var DonutMaxY = self.mesh.position.y + this.scale * 1150;
        var DonutMinZ = self.mesh.position.z - this.scale * 250;
        var DonutMaxZ = self.mesh.position.z + this.scale * 250;

        return DonutMinX <= maxX && DonutMaxX >= minX && DonutMinY <= maxY && DonutMaxY >= minY && DonutMinZ <= maxZ && DonutMaxZ >= minZ;
    }
}