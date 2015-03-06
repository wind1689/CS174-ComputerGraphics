// Global variables for gl control;
var gl;
var program;

var ATTRIBUTE_vPosition;
var ATTRIBUTE_vNormal;
var ATTRIBUTE_vUV;
// var ATTRIBUTE_vColor;
var UNIFORM_projectionMatrix;
var UNIFORM_viewMatrix;
var UNIFORM_modelMatrix;
var UNIFORM_modelMatrixUV;
var UNIFORM_uSampler;

var positionBuffer;
var normalBuffer;
var uvBuffer;
var myTexture1;
var myTexture2;
var projectionMatrix;
var viewMatrix;
var modelMatrix;
var modelMatrixUV;

var time = 0.0;
var timeInterval = 0.0;
var timer = new Timer();

// Global variables for Cube geometrics;
var length = 0.5;
var numPoints = 36;
var pointsArray = [];
var normalsArray = [];
var uvArray = [];

// Global variables for Cube1;
var cubePosition1 = vec3(-1.0, 0.0, 0.0);
var cubeRotationAxis1 = vec3(0, 1, 0);
var cubeRotationRate1 = 60;  //rpm;
var cubeRotationAngle1 = 0;
var rotationEnable1 = false;
var texRotationRate1 = 60;   //rpm;
var texRotationAngle1 = 0;
var texRotationEnable1 = false;

// Global variables for Cube2;
var cubePosition2 = vec3(1.0, 0.0, 0.0);
var cubeRotationAxis2 = vec3(1, 0, 0);
var cubeRotationRate2 = 30;  //rpm;
var cubeRotationAngle2 = 0;
var rotationEnable2 = false;
var texScrollSpeed2 = 1;
var texScrollDistance2 = 0.0;
var texScrollEnable2 = false;

// Global variables for light source
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var shininess = 50;

// Global variable for projection control
var fovy = 60;
var aspect = 1;
var near = 0.1;
var far = 5;
fovyIncrement = 1;

L = 3;
var left = -L;
var right = L;
var ytop =L;
var bottom = -L;

// Global variable for view control
var eye = vec3(0.0, 1, 3.5);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var eyeVertAngle = -30;
var navDegree = 1;
var navUnit = 0.06;
var worldUp = normalize(vec3(0.0, 1.0, Math.tan(radians(30))));
var isAttached = false;
var attachedPlanet;
var attachedViewMatrix = mat4();
var eyeAngle = 10;

function Cube(points, normals, uv)
{
  //The vertices of the Cube
  var vertices = [
      vec4(  length,  length,  length, 1.0),
      vec4( -length,  length,  length, 1.0),
      vec4( -length, -length,  length, 1.0),
      vec4(  length, -length,  length, 1.0),
      vec4(  length,  length, -length, 1.0),
      vec4( -length,  length, -length, 1.0),
      vec4( -length, -length, -length, 1.0),
      vec4(  length, -length, -length, 1.0)
  ];

  //Push the vertices into points array;
  Quad(vertices[0], vertices[1], vertices[2], vertices[3], vec4(0, 0, 1, 0), points, normals, uv); //Front
  Quad(vertices[4], vertices[5], vertices[6], vertices[7], vec4(0, 0, -1, 0), points, normals, uv); //Back
  Quad(vertices[1], vertices[5], vertices[6], vertices[2], vec4(-1, 0, 0, 0), points, normals, uv); //Left
  Quad(vertices[4], vertices[0], vertices[3], vertices[7], vec4(1, 0, 0, 0), points, normals, uv); //Right
  Quad(vertices[4], vertices[5], vertices[1], vertices[0], vec4(0, 1, 0, 0), points, normals, uv); //Top
  Quad(vertices[3], vertices[2], vertices[6], vertices[7], vec4(0, -1, 0, 0), points, normals, uv); //Bottom
}

function Quad(a, b, c, d, quadNormal, points, normals, uv)
{
	//Draw the first triangle;
	points.push(a);
 	points.push(b);
 	points.push(c);
 	normals.push(quadNormal);
 	normals.push(quadNormal);
 	normals.push(quadNormal);
 	uv.push(vec2(1,1));
 	uv.push(vec2(0,1));
 	uv.push(vec2(0,0));
	//Draw the second triangle;
	points.push(a);
	points.push(c);
	points.push(d);
	normals.push(quadNormal);
	normals.push(quadNormal);
	normals.push(quadNormal);
	uv.push(vec2(1,1));
 	uv.push(vec2(0,0));
 	uv.push(vec2(1,0));
}

function textureSetup()
{
	myTexture1 = gl.createTexture();
	myTexture1.image = new Image();
	myTexture1.image.src = "../Images/chrome.jpg";
	myTexture1.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture1);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture1.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture2 = gl.createTexture();
	myTexture2.image = new Image();
	myTexture2.image.src = "../Images/chrome.jpg";
	myTexture2.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture2);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture2.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
}

window.onload = function init()
{
  /***  Setup WebGL ***/
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl){
		alert("WebGL isn't available");
	}

  /*** Configure WebGL ***/
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	/*** Set up geometry models ***/
	Cube(pointsArray, normalsArray, uvArray);

	/*** Load shaders ***/
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	/*** Create buffers in GPU for the geometrics; ***/
	positionBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, positionBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

  normalBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, normalBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

  uvBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, uvBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(uvArray), gl.STATIC_DRAW );

  /*** Texture set-up ***/
  textureSetup();

	/*** Link the shaders' and application program's variables ***/
	ATTRIBUTE_vPosition = gl.getAttribLocation(program, "vPosition");
	gl.enableVertexAttribArray(ATTRIBUTE_vPosition);

	ATTRIBUTE_vNormal = gl.getAttribLocation(program, "vNormal");
	gl.enableVertexAttribArray(ATTRIBUTE_vNormal);
	
	ATTRIBUTE_vUV = gl.getAttribLocation(program, "vUV");
	gl.enableVertexAttribArray(ATTRIBUTE_vUV);

	

	// ATTRIBUTE_vColor = gl.getAttribLocation(program, "vColor");
	// gl.enableVertexAttribArray( ATTRIBUTE_vColor );

	UNIFORM_projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");

	UNIFORM_viewMatrix = gl.getUniformLocation(program, "viewMatrix");

	UNIFORM_modelMatrix = gl.getUniformLocation(program, "modelMatrix");

	UNIFORM_modelMatrixUV = gl.getUniformLocation(program, "modelMatrixUV");

	UNIFORM_uSampler = gl.getUniformLocation(program, "uSampler");

	/*** Assign value to shaders' variables ***/
	// Assign to UNIFORM_projectionMatrix;
	projectionMatrix = perspective(fovy, aspect, near, far);
	// projectionMatrix = ortho(left, right, bottom, ytop, near, far);
	gl.uniformMatrix4fv(UNIFORM_projectionMatrix, false, flatten(projectionMatrix));

	// Assign to UNIFORM_viewMatrix;
	viewMatrix = lookAt(eye, at, up);
	gl.uniformMatrix4fv(UNIFORM_viewMatrix, false, flatten(viewMatrix));

	timer.reset();
	render();
}

function render()
{
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	/*** Set up the time for animation ***/
	timeInterval = timer.getElapsedTime() / 1000;
	// time += timeInterval;

	/*** Draw the objects ***/
	drawCube1();
	drawCube2();

	requestAnimFrame(render);
}

function drawCube1()
{
	/*** Assign to ATTRIBUTE_vPosition ***/
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(ATTRIBUTE_vPosition, 4, gl.FLOAT, false, 0, 0);

	/*** Assign to ATTRIBUTE_vNormal ***/
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(ATTRIBUTE_vNormal, 4, gl.FLOAT, false, 0, 0);

	/*** Assign to ATTRIBUTE_vUV ***/
	gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
	gl.vertexAttribPointer(ATTRIBUTE_vUV, 2, gl.FLOAT, false, 0, 0);

	/*** Assign to UNIFORM_projectionMatrix ***/
	// projectionMatrix = mat4();
	// projectionMatrix = perspective(fovy, aspect, near, far);
	// gl.uniformMatrix4fv(UNIFORM_projectionMatrix, false, flatten(projectionMatrix));

	/*** Assign to UNIFORM_viewMatrix ***/
	gl.uniformMatrix4fv(UNIFORM_viewMatrix, false, flatten(viewMatrix));

	/*** Assign to UNIFORM_modelMatrix ***/
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, translate(cubePosition1));
	if (rotationEnable1)
	{
		cubeRotationAngle1 += (6 * timeInterval * cubeRotationRate1);
		cubeRotationAngle1 %= 360;
	}
	modelMatrix = mult(modelMatrix, rotate(cubeRotationAngle1, cubeRotationAxis1));
	gl.uniformMatrix4fv(UNIFORM_modelMatrix, false, flatten(modelMatrix));

	/*** Assign to UNIFORM_modelMatrixUV ***/
	modelMatrixUV = mat4();
	modelMatrixUV = mult(modelMatrixUV, translate(vec3(0.5, 0.5, 0.0)));
	if (texRotationEnable1)
	{
		texRotationAngle1 += (6 * timeInterval * texRotationRate1);
		texRotationAngle1 %= 360;
	}
	modelMatrixUV = mult(modelMatrixUV, rotate(texRotationAngle1, vec3(0, 0, 1)));
	modelMatrixUV = mult(modelMatrixUV, translate(vec3(-0.5, -0.5, 0.0)));
	gl.uniformMatrix4fv(UNIFORM_modelMatrixUV, false, flatten(modelMatrixUV));

	/*** Assign to UNIFORM_uSampler ***/
	gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, myTexture1);
  gl.uniform1i(UNIFORM_uSampler, 0);

	/*** Assign to other variable in shaders ***/
	// Assign to lightPosition;
	gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
	// Assign to shininess;
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

	/*** Draw the Cube ***/
	gl.drawArrays(gl.TRIANGLES, 0, numPoints);
}

function drawCube2()
{
	/*** Assign to ATTRIBUTE_vPosition ***/
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.vertexAttribPointer(ATTRIBUTE_vPosition, 4, gl.FLOAT, false, 0, 0);

	/*** Assign to ATTRIBUTE_vNormal ***/
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(ATTRIBUTE_vNormal, 4, gl.FLOAT, false, 0, 0);

	/*** Assign to ATTRIBUTE_vUV ***/
	gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
	gl.vertexAttribPointer(ATTRIBUTE_vUV, 2, gl.FLOAT, false, 0, 0);

	/*** Assign to UNIFORM_projectionMatrix ***/
	// projectionMatrix = mat4();
	// gl.uniformMatrix4fv(UNIFORM_projectionMatrix, false, flatten(projectionMatrix));

	/*** Assign to UNIFORM_viewMatrix ***/
	gl.uniformMatrix4fv(UNIFORM_viewMatrix, false, flatten(viewMatrix));

	/*** Assign to UNIFORM_modelMatrix ***/
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, translate(cubePosition2));
	if (rotationEnable2)
	{
		cubeRotationAngle2 += (6 * timeInterval * cubeRotationRate2);
		cubeRotationAngle2 %= 360;
	}
	modelMatrix = mult(modelMatrix, rotate(cubeRotationAngle2, cubeRotationAxis2));
	gl.uniformMatrix4fv(UNIFORM_modelMatrix, false, flatten(modelMatrix));

	/*** Assign to UNIFORM_modelMatrixUV ***/
	modelMatrixUV = mat4();
	modelMatrixUV = mult(modelMatrixUV, translate(vec3(0.5, 0.5, 0.0)));
	if (texScrollEnable2)
	{
		texScrollDistance2 += (timeInterval * texScrollSpeed2);
		texScrollDistance2 %= 1;
	}
	modelMatrixUV = mult(modelMatrixUV, translate(vec3(texScrollDistance2, 0.0, 0.0)));
	modelMatrixUV = mult(modelMatrixUV, scale(vec3(2, 2, 2)));
	modelMatrixUV = mult(modelMatrixUV, translate(vec3(-0.5, -0.5, 0.0)));
	gl.uniformMatrix4fv(UNIFORM_modelMatrixUV, false, flatten(modelMatrixUV));

	/*** Assign to UNIFORM_uSampler ***/
	gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, myTexture2);
  gl.uniform1i(UNIFORM_uSampler, 0);

	/*** Assign to other variable in shaders ***/
	// Assign to lightPosition;
	gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
	// Assign to shininess;
	gl.uniform1f(gl.getUniformLocation(program, "shininess"), shininess);

	/*** Draw the Cube ***/
	gl.drawArrays(gl.TRIANGLES, 0, numPoints);
}

function multMatVec(matrix, vector)
{
  if (vector.length != 4)
  {
    throw "Length of vector is not 4";
  }
  var result = [];
  for (var i = 0; i < 4; i++)
  {
    var sum = 0;
    for (var j = 0; j < 4; j++)
    {
      sum += matrix[i][j] * vector[j];
    }
    result.push(sum);
  }
  return result;
}

//When the key is pressed, trigger this following function; 
window.onkeydown = function(event)
{
    // var key = String.fromCharCode(event.keyCode);
    keyCode = event.keyCode;
    switch (keyCode)
    {
    	//Press "I"
    	case 73:
    			viewMatrix = mult(translate(vec3(0.0, 0.0, navUnit)), viewMatrix);
    			break;
    	//Press "O"
    	case 79:
    			viewMatrix = mult(translate(vec3(0.0, 0.0, -navUnit)), viewMatrix);
    			break;
    	//Press "R"
    	case 82:
    			rotationEnable1 = !rotationEnable1;
    			rotationEnable2 = !rotationEnable2;
    			break;
    	//Press "T"
    	case 84:
    			texRotationEnable1 = !texRotationEnable1;
    			break;
    	//Press "S"
    	case 83:
    			texScrollEnable2 = !texScrollEnable2;
    			break;
    	default:
    			break;
    }
}