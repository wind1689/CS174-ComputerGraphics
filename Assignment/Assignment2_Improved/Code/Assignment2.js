var gl;
var points = [];
var vColor;
var modelViewMatrix;
//Global variable for CUBE;
var cubeNumPoints = 36;
var cubeNumPointsStrip = 16;
var length = 0.5;
var colorVar;
var scaleSize = vec3(3, 3, 3);
var initialIndex = 0;
var colorVar = [
	vec4(1, 0, 0, 1),
	vec4(0, 1, 0, 1),
	vec4(0, 0, 1, 1),
	vec4(1, 1, 0, 1),
	vec4(1, 0, 1, 1),
	vec4(0, 1, 1, 1),
	vec4(0.8, 0.1, 0.3, 1),
	vec4(0.5, 0.3, 0.7, 1),
];
var moveVector = [
	vec3( 10,  10,  10),
	vec3(-10,  10,  10),
	vec3(-10, -10,  10),
	vec3( 10, -10,  10),
	vec3( 10,  10, -10),
	vec3(-10,  10, -10),
	vec3(-10, -10, -10),
	vec3( 10, -10, -10),
]
var animationControl = false;
var rotateAngle0 = 0;
var rotateAngle1 = 0;
var rotateAngle2 = 0;
var rotateAngle3 = 0;
var angleIncrement = 1;
var scaleCube0 = 1;
var scaleCube1 = 1;
var scaleCube2 = 1;
var scaleCube3 = 1;
var factor0 = 1;
var factor1 = 1;
var factor2 = 1;
var factor3 = 1;
var scaleIncrement = 0.01;
//Global variable for Cross Hair;
var showCrossHair = false;
var crossNumPoints = 12;
var scaleCrossHair = vec3(0.08, 0.08, 0.08);
var colorCrossHair = vec4(0, 0, 0, 1);
var projectionMatrixCH;
var viewMatrixCH;
var eyeCH = vec3(0, 0, 0);
var atCH = vec3(0, 0, 0);
var upCH = vec3(0, 1, 0);
//Global variable for projection and view control
var projectionMatrix;
var viewMatrix;
var fovy = 90;
var aspect = 1;
var near = 0.1;
var far = 45;
fovyIncrement = 1.0;
var eye = vec3(0, 25*Math.tan(radians(30)), 25);
var at = vec3(0, 0, 0);
var up = vec3(0, 1, 0);
var eyeVertAngle = -30;
var navDegree = 1.0;
var navUnit = 0.25;
var worldUp = normalize(vec3(0.0, 1.0, Math.tan(radians(30))));
// var worldUp = up;
window.onload = function init()
{
	//
  //  Setup WebGL
  //
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl){
		alert("WebGL isn't available");
	}

	//
  //  Configure WebGL
  //
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.9, 0.9, 0.9, 1.0);
	gl.enable(gl.DEPTH_TEST);

	// Set up geometry models
	// Cube(points);
  CubeStrip(points)
  CrossHair(points);

	//Load shaders and initialize attribute buffers
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	//Load the point data into the GPU's buffer vBuffer;
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);   
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);  

	//Associate out shader variables with our data buffer
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	//Create the color variable which can be passed through to the fragment shader;
	vColor = gl.getAttribLocation(program, "vColor");

	//Create the mvMatrix variable which can be passed through to the vertex shader;
	modelViewMatrix = gl.getUniformLocation(program, "modelViewMatrix");

	//Set the projection and view;
	projectionMatrix = perspective(fovy, aspect, near, far);
	projectionMatrixCH = ortho(-1.0, 1.0, -1.0, 1.0, -1.0, 1.0);
	viewMatrix = lookAt(eye, at, up);
  viewMatrixCH = lookAt(eyeCH, atCH, upCH);
  temp = mat4();

	render();
}

function render()
{
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var ctm = mat4();

  //Draw 8 cubes;
	var index = initialIndex;
	for (var i = 0; i < 8; i++, index++)
	{
		index %= 8;
		gl.vertexAttrib4fv(vColor, flatten(colorVar[index]));
		ctm = mat4();
		ctm = mult(ctm, projectionMatrix);
		ctm = mult(ctm, viewMatrix);
		ctm = mult(ctm, translate(moveVector[i]));
		ctm = mult(ctm, scale(scaleSize));
		ctm = mult(ctm, rotateOrScaleAnimation(i));
		gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
		//Draw the points;
		// gl.drawArrays(gl.TRIANGLES, 0, cubeNumPoints);    //Draw cube using TRIANGLES
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, cubeNumPointsStrip);  //Draw cube using TRIANGLE_STRIP
	}

  //Draw cross hair;
  if (showCrossHair)
  {
    gl.vertexAttrib4fv(vColor, flatten(colorCrossHair));
    ctm = mat4();
    ctm = mult(ctm, projectionMatrixCH);
    ctm = mult(ctm, viewMatrixCH);
    ctm = mult(ctm, scale(scaleCrossHair));
    gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm));
    gl.drawArrays(gl.TRIANGLES, 16, crossNumPoints);   //Read from the 36th position in Buffer;
  }

	requestAnimFrame(render);
}

//Function which decides the rotation animation or scaling animation of cubes;
function rotateOrScaleAnimation(index)
{
  var transformMatrix = mat4();
  switch(index)
  {
    case 0:
        if (animationControl)
          rotateAngle0 -= 0.5*angleIncrement;
        rotateAngle0 %= 360;
        transformMatrix = rotate(rotateAngle0, vec3(-1,1,1))
        break;
    case 1:
        if(scaleCube0 > 1.1)
          factor0 *= -1;
        else if(scaleCube0 < 0.9)
          factor0 *= -1;
        if (animationControl)
          scaleCube0 += factor0*0.5*scaleIncrement;
        transformMatrix = scale(vec3(scaleCube0, scaleCube0, scaleCube0))
        break;
    case 2:
        if (animationControl)
          rotateAngle1 -= 5*angleIncrement;
        rotateAngle1 %= 360;
        transformMatrix = rotate(rotateAngle1, vec3(1,0,0))
        break;
    case 3:
        if(scaleCube1 > 1.1)
          factor1 *= -1;
        else if(scaleCube1 < 0.9)
          factor1 *= -1;
        if (animationControl)
          scaleCube1 += factor1*-0.2*scaleIncrement;
        transformMatrix = scale(vec3(scaleCube1, scaleCube1, scaleCube1))
        break;
        break;
    case 4:
        if(scaleCube2 > 1.1)
          factor2 *= -1;
        else if(scaleCube2 < 0.9)
          factor2 *= -1;
        if (animationControl)
          scaleCube2 += factor2*1.0*scaleIncrement;
        transformMatrix = scale(vec3(scaleCube2, scaleCube2, scaleCube2))
        break;
        break;
    case 5:
        if (animationControl)
          rotateAngle2 += 3*angleIncrement;
        rotateAngle2 %= 360;
        transformMatrix = rotate(rotateAngle2, vec3(0,1,0))
        break;
    case 6:
        if(scaleCube3 > 1.1)
          factor3 *= -1;
        else if(scaleCube3 < 0.9)
          factor3 *= -1;
        if (animationControl)
          scaleCube3 += factor3*-0.5*scaleIncrement;
        transformMatrix = scale(vec3(scaleCube3, scaleCube3, scaleCube3))
        break;
        break;
    case 7:
        if (animationControl)
          rotateAngle3 += 1*angleIncrement;
        rotateAngle3 %= 360;
        transformMatrix = rotate(rotateAngle3, vec3(0,0,1))
        break;
    default:
        break;
  }
  return transformMatrix;
}

//Model cross hair using TRIANGLES;
function CrossHair(points)
{
  //The vertices of the Cross Hair
  var L = 0.1;
  var vertices = [
      vec3(  L,  10*L,  0),
      vec3( -L,  10*L,  0),
      vec3( -L, -10*L,  0),
      vec3(  L, -10*L,  0),
      vec3(  10*L,  L,  0),
      vec3( -10*L,  L,  0),
      vec3( -10*L, -L,  0),
      vec3(  10*L, -L,  0)
  ];

  //Push the vertices into points array;
  drawQuad(vertices[0], vertices[1], vertices[2], vertices[3], points);
  drawQuad(vertices[4], vertices[5], vertices[6], vertices[7], points);
}

//Model cubes using TRIANGLE_STRIP
function CubeStrip(points)
{
  //The vertices of the Cube
  var vertices = [
      vec3(  length,  length,  length),
      vec3( -length,  length,  length),
      vec3( -length, -length,  length),
      vec3(  length, -length,  length),
      vec3(  length,  length, -length),
      vec3( -length,  length, -length),
      vec3( -length, -length, -length),
      vec3(  length, -length, -length)
  ];
  //Push the vertices into points array;
  points.push(vertices[3]);
  points.push(vertices[2]);
  points.push(vertices[0]);
  points.push(vertices[1]);
  points.push(vertices[4]);
  points.push(vertices[5]);
  points.push(vertices[7]);
  points.push(vertices[6]);
  points.push(vertices[5]);
  points.push(vertices[1]);
  points.push(vertices[6]);
  points.push(vertices[2]);
  points.push(vertices[7]);
  points.push(vertices[3]);
  points.push(vertices[4]);
  points.push(vertices[0]);
}

//Model cubes using TRIANGLES;
function Cube(points)
{
  //The vertices of the Cube
  var vertices = [
      vec3(  length,  length,  length),
      vec3( -length,  length,  length),
      vec3( -length, -length,  length),
      vec3(  length, -length,  length),
      vec3(  length,  length, -length),
      vec3( -length,  length, -length),
      vec3( -length, -length, -length),
      vec3(  length, -length, -length)
  ];

  //Push the vertices into points array;
  drawQuad(vertices[0], vertices[1], vertices[2], vertices[3], points); //Front
  drawQuad(vertices[4], vertices[5], vertices[6], vertices[7], points); //Back
  drawQuad(vertices[1], vertices[5], vertices[6], vertices[2], points); //Left
  drawQuad(vertices[4], vertices[0], vertices[3], vertices[7], points); //Right
  drawQuad(vertices[4], vertices[5], vertices[1], vertices[0], points); //Top
  drawQuad(vertices[3], vertices[2], vertices[6], vertices[7], points); //Bottom
}

function drawQuad(a, b, c, d, points)
{
	//Draw the first triangle;
	points.push(a);
  points.push(b);
  points.push(c);
  //Draw the second triangle;
  points.push(a);
  points.push(c);
  points.push(d);
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
    	//Press "C"
    	case 67:
    			initialIndex++;
    			initialIndex %= 8;
          showCrossHair = true;
    			break;
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
      //Press "B"
      case 66:
          eye = vec3(0, 0, 25);
          at = vec3(0, 0, 0);
          up = vec3(0, 1, 0);
          viewMatrix = lookAt(eye, at, up);
          fovy = 90;
          aspect = 1;
          near = 0.1;
          far = 45;
          projectionMatrix = perspective(fovy, aspect, near, far);
          animationControl = false;
          rotateAngle0 = 0;
          rotateAngle1 = 0;
          rotateAngle2 = 0;
          rotateAngle3 = 0;
          angleIncrement = 1;
          scaleCube0 = 1;
          scaleCube1 = 1;
          scaleCube2 = 1;
          scaleCube3 = 1;
          factor0 = 1;
          factor1 = 1;
          factor2 = 1;
          factor3 = 1;
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
    	//Press "N"
    	case 78:
          var temp = fovy - fovyIncrement;
          if (temp > 30)
          {
            fovy = temp;
            projectionMatrix = perspective(fovy, aspect, near, far);
          }
    			break;
    	//Press "W"
    	case 87:
          var temp = fovy + fovyIncrement;
          if (temp < 150)
          {
            fovy = temp;
            projectionMatrix = perspective(fovy, aspect, near, far);
          }
          break;
      //Press "A"
      case 65:
          animationControl = !animationControl;
          break;    
    	default:
    			break;
    }
}