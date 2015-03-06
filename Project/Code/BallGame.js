var gl;
var program;
var ATTRIBUTE_vPosition;
var ATTRIBUTE_vNormal;
// var ATTRIBUTE_vColor;
var ATTRIBUTE_vUV;
var UNIFORM_projectionMatrix;
var UNIFORM_viewMatrix;
var UNIFORM_modelMatrix;
var UNIFORM_normalMatrix;
var UNIFORM_uSampler;

//Global variables for leap motion
var controller;
var frame;

var time = 0.0;
var dTime = 0.0;
var timer = new Timer();

var modelMatrix = mat4();

//Global variable for projection control
var projectionMatrix;
var fovy = 80;
var aspect = 1;
var near = 0.1;
var far = 2500;
fovyIncrement = 1;
L = 10;
var left = -L;
var right = L;
var ytop =L;
var bottom = -L;
//Global variable for view control
var viewMatrix;
var viewMatrixBall;
var eye = vec3(0.0, 8*Math.tan(radians(30)), 8);
var at = vec3(0.0, 0.0, -40.0);
var up = vec3(0.0, 1.0, 0.0);
var eyeVertAngle = -30;
var navDegree = 1;
var navUnit = 0.25;
var worldUp = normalize(vec3(0.0, 1.0, Math.tan(radians(60))));

var forceLM = vec4(0.0, 0.0, 0.0, 0.0);
var forceLMMag = 20;

var forceTest = vec4(0.0, 0.0, 0.0, 0.0);
var forceTestMag = 20;

var gravityAcceleration = vec4(0.0, -9.8, 0.0, 0.0);  // The gravity acceleration is 9.8N/kg;

var isRestart = false;

var myBall;
var myWorld;


var collidesound;
var metalsound;
var finalsound;


window.onload = function init()
{
  /***  Setup Leap Motion ***/
  controller = new Leap.Controller();
  controller.connect();

  // /*sound*/
  soundtrack = document.getElementById('soundtrack');
  metalsound = document.getElementById('metal-sound');
  collidesound = document.getElementById('collide-sound');
  rollingsound = document.getElementById('rolling-sound');
  finalsound =  document.getElementById('final-sound');


 

	/***  Setup WebGL ***/
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl){
		alert("WebGL isn't available");
	}

	/*** Configure WebGL ***/
	gl.viewport(0, 0, canvas.width, canvas.height);
  aspect=canvas.width/canvas.height;
	gl.clearColor(0.08, 0.08, 0.08, 1.0);
	gl.enable(gl.DEPTH_TEST);

	/*** Load shaders ***/
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	/*** Create buffers in GPU for the fundamental geometrics ***/
	createGeoBuffer();

	/*** Link the shaders' and application program's variables ***/
	ATTRIBUTE_vPosition = gl.getAttribLocation(program, "vPosition");
	gl.enableVertexAttribArray(ATTRIBUTE_vPosition);
	ATTRIBUTE_vNormal = gl.getAttribLocation(program, "vNormal");
	gl.enableVertexAttribArray(ATTRIBUTE_vNormal);
	ATTRIBUTE_vUV = gl.getAttribLocation(program, "vUV");
	gl.enableVertexAttribArray(ATTRIBUTE_vUV);
	// ATTRIBUTE_vColor = gl.getAttribLocation(program, "vColor");
	UNIFORM_projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");
	UNIFORM_viewMatrix = gl.getUniformLocation(program, "viewMatrix");
	UNIFORM_modelMatrix = gl.getUniformLocation(program, "modelMatrix");
  UNIFORM_normalMatrix = gl.getUniformLocation(program, "normalMatrix");
  UNIFORM_uSampler = gl.getUniformLocation(program, "uSampler");

	/*** Create the world ***/
	myWorld = new World();
	buildUpWorld(myWorld);


	// Projection and view;
	projectionMatrix = perspective(fovy, aspect, near, far);
	viewMatrix = lookAt(eye, at, up);
  viewMatrixBall = lookAt(eye, at, up);

	// Setting UNIFORM_projectionMatrix;
	gl.uniformMatrix4fv(UNIFORM_projectionMatrix, false, flatten(projectionMatrix));

  updateObjects();

  // soundtrack.volume=0.3; 
  // soundtrack.play();

	render();
}

function render()
{
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	frameString = "";

  // Refresh the information collectecd by leap motion in this frame;
  frame = controller.frame();

  // Obtain the the force applies by leap motion;
  obtainForceLM(forceLM);
  rotateView(corner);


//when ball rolling, paly sound
  if (myBall.velocity[0]!=0 || myBall.velocity[2]!=0){
  rollingsound.volume=0.1*(1-1/(Math.abs(myBall.velocity[0])+Math.abs(myBall.velocity[2])+1));  
  // rollingsound.play();
}else
  // rollingsound.pause();

  // Restart the game if game over;
  if (isRestart || myBall.position[1] < -10 )
    restartGame();


  // Update the time interval between two frames;
  dTime = timer.getElapsedTime() / 1000;

  // Apply the gravity to movable objects;
  addGravity();

  // Apply the external force to myBall;
  myBall.addForce(multScalVec(forceLMMag, forceLMrotate));
  myBall.addForce(multScalVec(forceTestMag, forceTestrotate));

  // Collision Detection between object and whole world;
  collisionDetection();
  // collideObjs(myBall, obj1);
  // collideObjs(myBall, obj2);
  collisionDetectionHL();

  // Move objects based on their velocity and force;
  physicalMovement(dTime)
  // objMoving(myBall, dTime); 
  // objMoving(obj1, dTime);
  // objMoving(obj2, dTime);

  // Generate and update the whole world;
  modelMatrix = mat4();
  myWorld.render();
  updateObjects();
  
  // Move camera;
  var newEye = add(eye, vec3(myBall.position));
  var newAt = add(at,vec3(myBall.position));
  viewMatrix = lookAt(newEye, newAt, up);

  // For testing;
  //frameOutput = document.getElementById("frameData");
  //frameOutput.innerHTML = "<div style='width:300px; float:left; padding:5px'>" + frameString + "</div>";

	requestAnimFrame(render);
}

function restartGame()
{
   inicount=0;
   figure = [];
  numNodes = 0;
  index = 0;
  for( var i=0; i<10; i++)
    figure[i] = createNode(null, null, null, null);
  myWorld = new World();
  buildUpWorld(myWorld);
  viewMatrixBall = lookAt(eye, at, up);
  forceLM = vec4(0.0, 0.0, 0.0, 0.0);
  modelMatrix =mat4();
  background.updateAnimMatrix(modelMatrix);

  soundtrack.volume=0.3; 
  soundtrack.play();

  scaleF1 = 1.0;
  scaleF2 = -1.0;
  scaleFIncrement1 = 0.03;
  scaleFIncrement2 = -0.03;

}

function obtainForceLM(forceLM)
{
  if (frame.hands.length >= 1)
  {
    var hand = frame.hands[0];
    forceLM[0] = -hand.palmNormal[0];
    forceLM[2] = -hand.palmNormal[2];
  }
  else
    forceLM = vec4(0.0, 0.0, 0.0, 0.0);
}

function addGravity()
{
  for (var i = 0; i < numNodes; i++)
  {
    if (figure[i].object.collideAffected && (figure[i].object.type == sphereType || figure[i].object.type == sphereType2))
      figure[i].object.force = multScalVec(figure[i].object.mass, gravityAcceleration)
  }
}

//When the key is pressed, trigger this following function; 
window.onkeydown = function(event)
{
    // var key = String.fromCharCode(event.keyCode);
    keyCode = event.keyCode;
    switch (keyCode)
    {
      	//Press "Up Arrow"
      	case 38:
          	var EVAtemp = eyeVertAngle + navDegree;
          	if (EVAtemp < 90)
          	{
            	eyeVertAngle = EVAtemp;
            	viewMatrix = mult(rotate(-navDegree, vec3(1, 0, 0)), viewMatrix);
            	var upTemp = multMatVec(rotate(-navDegree, vec3(1, 0, 0)), vec4(worldUp, 0));
            	worldUp = vec3(upTemp[0], upTemp[1], upTemp[2]);
          	}
          	break;
      	//Press "Down Arrow"
      	case 40:
          	var EVAtemp = eyeVertAngle - navDegree;
          	if (EVAtemp > -90)
          	{
            	eyeVertAngle = EVAtemp;
            	viewMatrix = mult(rotate(navDegree, vec3(1, 0, 0)), viewMatrix);
            	var upTemp = multMatVec(rotate(navDegree, vec3(1, 0, 0)), vec4(worldUp, 0));
            	worldUp = vec3(upTemp[0], upTemp[1], upTemp[2]);
          	}
          	break;
      	//Press "Left Arrow"
      	case 37:
          	viewMatrix = mult(rotate(-navDegree, worldUp), viewMatrix);
          	break;
      	//Press "Right Arrow"
      	case 39:
          	viewMatrix = mult(rotate(navDegree, worldUp), viewMatrix);
          	break;
      	//Press "R"
      	case 82:
          	isRestart = true;
          	break;
      	//Press "I"
      	case 73:
          	viewMatrix = mult(translate(vec3(0.0, 0.0, navUnit)), viewMatrix);
          	break;
      	//Press "J"
    		case 74:
          	viewMatrix = mult(translate(vec3(navUnit, 0.0, 0.0)), viewMatrix);
    		break;
    	//Press "K"
    	case 75:
          	viewMatrix = mult(translate(vec3(-navUnit, 0.0, 0.0)), viewMatrix);
    		break;
    	//Press "M"
    	case 77:
          	viewMatrix = mult(translate(vec3(0.0, 0.0, -navUnit)), viewMatrix);
    		break;
    	//Press "W"
    	case 87:
          	forceTest = vec4(0, 0, -1, 0);
          	break;
      //Press "S"
      case 83:
            forceTest = vec4(0, 0, 1, 0);
            break;
      //Press "A"
      case 65:
            forceTest = vec4(-1, 0, 0, 0);
            break;
      //Press "D"
      case 68:
            forceTest = vec4(1, 0, 0, 0);
            break;      
      	default:
          	break;
    }
}

//When the key is released, trigger this following function;
window.onkeyup = function(event)
{
    forceTest = vec4(0.0, 0.0, 0.0, 0.0);
    isRestart = false;
}