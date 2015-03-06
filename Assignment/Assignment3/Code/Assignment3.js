var gl;
var program;
var ATTRIBUTE_vNormal;
var ATTRIBUTE_vPosition
var ATTRIBUTE_vColor;
var UNIFORM_projectionMatrix;
var UNIFORM_viewMatrix;
var UNIFORM_modelMatrix;
var time = 0.0;
var timer = new Timer();

var test = [];

//Global variables for Sphere
var numSubdivide = 5;
var numPoints = 0;
var pointsArray = [];
var normalsArray = [];
var modelMatrix = mat4();

//Global variables for light source
// var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var sunPosition = vec3(-0.5, 0.0, 0.0);
var lightPosition = vec4(sunPosition[0], sunPosition[1], sunPosition[2], 1.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var ambientProduct;
var diffuseProduct;
var specularProduct;
//Parameter to indentify which shading mathod wil be used;
//Phong shading--0; Gouraud shading--1; Flat shading--2;
var shadingMethod = 0;

//Global variable for projection control
var projectionMatrix;
var fovy = 60;
var aspect = 1;
var near = 0.1;
var far = 40;
fovyIncrement = 1;
L = 10;
var left = -L;
var right = L;
var ytop =L;
var bottom = -L;
//Global variable for view control
var viewMatrix;
var eye = vec3(0.0, 20*Math.tan(radians(30)), 20);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var eyeVertAngle = -30;
var navDegree = 1;
var navUnit = 0.25;
var worldUp = normalize(vec3(0.0, 1.0, Math.tan(radians(30))));
var isAttached = false;
var attachedPlanet;
var attachedViewMatrix = mat4();
var eyeAngle = 10;


function Sphere(numTimesToSubdivide)
{
	//Initial four points for tetrahedron;
	var va = vec4(0.0, 0.0, -1.0, 1);
	var vb = vec4(0.0, 0.942809, 0.333333, 1);
	var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
	var vd = vec4(0.816497, -0.471405, 0.333333, 1);

	//Subdivide each facet of tetrahedron;
	divideTriangle(va, vb, vc, numTimesToSubdivide, pointsArray);
	divideTriangle(vd, vc, vb, numTimesToSubdivide, pointsArray);
	divideTriangle(va, vd, vb, numTimesToSubdivide, pointsArray);
	divideTriangle(va, vc, vd, numTimesToSubdivide, pointsArray);
}

function divideTriangle(a, b, c, count)
{
	if (count > 0)
	{
		var ab = normalize(mix(a, b, 0.5), true);
		var ac = normalize(mix(a, c, 0.5), true);
		var bc = normalize(mix(b, c, 0.5), true);
		divideTriangle(a, ab, ac, count - 1, pointsArray);
		divideTriangle(ab, b, bc, count - 1, pointsArray);
		divideTriangle(bc, c, ac, count - 1, pointsArray);
		divideTriangle(ab, bc, ac, count - 1, pointsArray);
	}
	else
	{
		triangle(a, b, c);
	}
}

function triangle(a, b, c)
{
	pointsArray.push(a);
	pointsArray.push(b);
	pointsArray.push(c);

	var na = vec4();
	var nb = vec4();
	var nc = vec4();
	switch (shadingMethod)
	{
		//Phong shading
		case 0:
				na = vec4(a[0], a[1], a[2], 0);
				nb = vec4(b[0], b[1], b[2], 0);
				nc = vec4(c[0], c[1], c[2], 0);
				break;
		//Gouraud shading
		case 1:
				na = vec4(a[0], a[1], a[2], 0);
				nb = vec4(b[0], b[1], b[2], 0);
				nc = vec4(c[0], c[1], c[2], 0);
				break;
		//Flat shading
		case 2:
				var n = normalize( add( add(a, b), c));
				na = vec4(n[0], n[1], n[2], 0);
				nb = vec4(n[0], n[1], n[2], 0);
				nc = vec4(n[0], n[1], n[2], 0);
				break;
		default:
				break;
	}
	normalsArray.push(na);
	normalsArray.push(nb);
	normalsArray.push(nc);
	numPoints += 3;
}

//Define celestial body object;
function celestialBody(complexity, radius, orbitRadius, orbitSpeed, shading, mAmbient, mDiffuse, mSpecular, mShininess)
{
	this.radius = radius;
	this.orbitRadius = orbitRadius;
	this.orbitSpeed = orbitSpeed;
	this.sphereComplexity = complexity;
	this.rotationAngle = 0;
	this.rotationRate = 5 * orbitSpeed;
	// this.angleIncrement = 0.1 * orbitSpeed;
	this.shading = shading;
	this.mAmbient = mAmbient;
	this.mDiffuse = mDiffuse;
	this.mSpecular = mSpecular;
	this.mShininess = mShininess;
	this.position = vec4();
	this.bufferSetup = function()
	{
		pointsArray = [];
		normalsArray = [];
		numPoints = 0;
		shadingMethod = this.shading;
		//Build up a sphere model;
		Sphere(this.sphereComplexity);
		this.numOfPoints = numPoints;
		//Create a vertex Buffer to store the data;
		this.vBuffer = gl.createBuffer(); 
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
		//Create a normal Budder to store the data;
		this.nBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);   
		gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
	}
}

//Create Sun;
var sphereComplexity = 4;
var radius = 3;
var orbitRadius = 0;
var orbitSpeed = 0;
var shading = 2;        //Flat shading;
var materialAmbient = vec4( 5.0, 4.6, 0.0, 1.0 );
var materialDiffuse = vec4( 0.0, 0.0, 0.0, 1.0 );
var materialSpecular = vec4( 0.0, 0.0, 0.0, 1.0 );
var materialShininess = 1.0;
var sunPosition = vec3(-0.5, 0.0, 0.0);
sun = new celestialBody(sphereComplexity, radius, orbitRadius, orbitSpeed, shading,
												materialAmbient, materialDiffuse, materialSpecular, materialShininess);

//Create planet1;
sphereComplexity = 2;
radius = 0.3;
orbitRadius = 5;
orbitSpeed = 14;
shading = 2;            //Flat shading;
materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
materialDiffuse = vec4( 0.8, 0.8, 1.0, 1.0 );
materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
materialShininess = 100.0;
planet1 = new celestialBody(sphereComplexity, radius, orbitRadius, orbitSpeed, shading,
														materialAmbient, materialDiffuse, materialSpecular, materialShininess);

//Create planet2;
sphereComplexity = 3;
radius = 0.2;
orbitRadius = 6.5;
orbitSpeed =9.5;
shading = 1;            //Gouraud shading;
materialAmbient = vec4( 0.6, 0.8, 0.6, 1.0 );
materialDiffuse = vec4( 0.3, 1.0, 0.3, 1.0 );
materialSpecular = vec4( 1.0, 0.8, 0.5, 1.0 );
materialShininess = 100.0;
planet2 = new celestialBody(sphereComplexity, radius, orbitRadius, orbitSpeed, shading,
														materialAmbient, materialDiffuse, materialSpecular, materialShininess);

//Create planet3;
sphereComplexity = 5;
radius = 0.4;
orbitRadius = 8.5;
orbitSpeed = 5.3;
shading = 0;            //Phong shading;
materialAmbient = vec4( 0.4, 0.4, 0.8, 1.0 );
materialDiffuse = vec4( 0.4, 0.4, 1.0, 1.0 );
materialSpecular = vec4( 1.0, 0.8, 0.5, 1.0 );
materialShininess = 100.0;
planet3 = new celestialBody(sphereComplexity, radius, orbitRadius, orbitSpeed, shading,
														materialAmbient, materialDiffuse, materialSpecular, materialShininess);

//Create planet4;
sphereComplexity = 4;
radius = 0.6;
orbitRadius = 11;
orbitSpeed = 3.7;
shading = 0;            //Phong shading;
materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
materialSpecular = vec4( 0.0, 0.0, 0.0, 1.0 );
materialShininess = 1.0;
planet4 = new celestialBody(sphereComplexity, radius, orbitRadius, orbitSpeed, shading,
														materialAmbient, materialDiffuse, materialSpecular, materialShininess);

//Create moon;
sphereComplexity = 3;
radius = 0.15;
orbitRadius = 0.5;
orbitSpeed = 6;
shading = 1;            //Gouraud shading;
materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
materialDiffuse = vec4( 0.8, 0.2, 0.0, 1.0 );
materialSpecular = vec4( 0.2, 0.2, 0.2, 1.0 );
materialShininess = 1.0;
moon = new celestialBody(sphereComplexity, radius, orbitRadius, orbitSpeed, shading,
														materialAmbient, materialDiffuse, materialSpecular, materialShininess);


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
	gl.clearColor(0.08, 0.08, 0.08, 1.0);
	gl.enable(gl.DEPTH_TEST);

	// Set up geometry models

	//Load shaders and initialize attribute buffers
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	//Create the normal variable which can be passed through to the vertex shader;
	ATTRIBUTE_vNormal = gl.getAttribLocation(program, "vNormal");

	//Create the position variable which can be passed through to the vertex shader;
	ATTRIBUTE_vPosition = gl.getAttribLocation(program, "vPosition");

	//Create the color variable which can be passed through to the fragment shader;
	ATTRIBUTE_vColor = gl.getAttribLocation(program, "vColor");

	//Create the projection variable which can be passed through to the vertex shader;
	UNIFORM_projectionMatrix = gl.getUniformLocation(program, "projectionMatrix");

	//Create the view variable which can be passed through to the vertex shader;
	UNIFORM_viewMatrix = gl.getUniformLocation(program, "viewMatrix");

	//Create the model variable which can be passed through to the vertex shader;
	UNIFORM_modelMatrix = gl.getUniformLocation(program, "modelMatrix");

	//Set up different buffers in GPU for different planets;
	sun.bufferSetup();
	planet1.bufferSetup();
	planet2.bufferSetup();
	planet3.bufferSetup();
	planet4.bufferSetup();
	moon.bufferSetup();

	//Projection and view;
	projectionMatrix = perspective(fovy, aspect, near, far);
	// projectionMatrix = ortho(left, right, bottom, ytop, near, far);
	viewMatrix = lookAt(eye, at, up);

	render();
}

function render()
{
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	//Set up the time for animation;
	time += timer.getElapsedTime() / 1000;

	//Setting UNIFORM_projectionMatrix;
	gl.uniformMatrix4fv(UNIFORM_projectionMatrix, false, flatten(projectionMatrix));

	//Setting UNIFORM_viewMatrix;
	gl.uniformMatrix4fv(UNIFORM_viewMatrix, false, flatten(viewMatrix));

	//Draw the objects;
	drawCelestialBody(sun);
	drawCelestialBody(planet1);
	drawCelestialBody(planet2);
	drawCelestialBody(planet3);
	drawCelestialBody(planet4);
	drawMoon(moon, planet3);

	requestAnimFrame(render);
}

function drawCelestialBody(celestialBodyX)
{
	//ATTRIBUTE_vPosition read the data from vBuffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, celestialBodyX.vBuffer);
	gl.vertexAttribPointer(ATTRIBUTE_vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(ATTRIBUTE_vPosition);

	//ATTRIBUTE_vNormal read the data from nBuffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, celestialBodyX.nBuffer);
	gl.vertexAttribPointer(ATTRIBUTE_vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(ATTRIBUTE_vNormal);

	//Setting UNIFORM_modelMatrix;
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, translate(sunPosition));
	
	celestialBodyX.rotationAngle = time * celestialBodyX.rotationRate;
	// celestialBodyX.rotationAngle += celestialBodyX.angleIncrement;
	celestialBodyX.rotationAngle %= 360;
	modelMatrix = mult(modelMatrix, rotate(celestialBodyX.rotationAngle, vec3(0.0, 1.0, 0.0)));
	modelMatrix = mult(modelMatrix, translate(vec3(celestialBodyX.orbitRadius, 0.0, 0.0)));
	
	var planetSize = vec3(celestialBodyX.radius, celestialBodyX.radius, celestialBodyX.radius);
	modelMatrix = mult(modelMatrix, scale(planetSize));
	gl.uniformMatrix4fv(UNIFORM_modelMatrix, false, flatten(modelMatrix));

	//Setting the position of this celestialBody;
	celestialBodyX.position = vec4();
	celestialBodyX.position = multMatVec(modelMatrix, celestialBodyX.position);

	//Setting UNIFORM_viewMatrix;
	if (isAttached)
		attachTo(attachedPlanet);
	gl.uniformMatrix4fv(UNIFORM_viewMatrix, false, flatten(viewMatrix));

	//Setting the light model;
	ambientProduct = mult(lightAmbient, celestialBodyX.mAmbient);
	diffuseProduct = mult(lightDiffuse, celestialBodyX.mDiffuse);
	specularProduct = mult(lightSpecular, celestialBodyX.mSpecular);
	gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
	gl.uniform4fv( gl.getUniformLocation(program, "ambientProductV"), flatten(ambientProduct) );
	gl.uniform4fv( gl.getUniformLocation(program, "diffuseProductV"), flatten(diffuseProduct) );
	gl.uniform4fv( gl.getUniformLocation(program, "specularProductV"), flatten(specularProduct) );
	gl.uniform1f( gl.getUniformLocation(program, "shininessV"), celestialBodyX.mShininess );
	gl.uniform4fv( gl.getUniformLocation(program, "ambientProductF"), flatten(ambientProduct) );
	gl.uniform4fv( gl.getUniformLocation(program, "diffuseProductF"), flatten(diffuseProduct) );
	gl.uniform4fv( gl.getUniformLocation(program, "specularProductF"), flatten(specularProduct) );
	gl.uniform1f( gl.getUniformLocation(program, "shininessF"), celestialBodyX.mShininess );

	//Setting the shading method;
	gl.uniform1f( gl.getUniformLocation(program, "shadingMethodV"), celestialBodyX.shading);
	gl.uniform1f( gl.getUniformLocation(program, "shadingMethodF"), celestialBodyX.shading);

	//Draw the points;
	gl.drawArrays(gl.TRIANGLES, 0, celestialBodyX.numOfPoints);
}

function drawMoon(moon, planet)
{
	//ATTRIBUTE_vPosition read the data from vBuffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, moon.vBuffer);
	gl.vertexAttribPointer(ATTRIBUTE_vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(ATTRIBUTE_vPosition);

	//ATTRIBUTE_vNormal read the data from nBuffer;
	gl.bindBuffer(gl.ARRAY_BUFFER, moon.nBuffer);
	gl.vertexAttribPointer(ATTRIBUTE_vNormal, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(ATTRIBUTE_vNormal);

	//Setting UNIFORM_modelMatrix;
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, translate(sunPosition));
	
	modelMatrix = mult(modelMatrix, rotate(planet.rotationAngle, vec3(0.0, 1.0, 0.0))); 
	modelMatrix = mult(modelMatrix, translate(vec3(planet.orbitRadius, 0.0, 0.0)));

	moon.rotationAngle += moon.angleIncrement;
	moon.rotationAngle %= 360;
	modelMatrix = mult(modelMatrix, rotate(moon.rotationAngle, vec3(0.0, 1.0, 0.0)));
	modelMatrix = mult(modelMatrix, translate(vec3((planet.radius + moon.orbitRadius), 0.0, 0.0)));
	
	var planetSize = vec3(moon.radius, moon.radius, moon.radius);
	modelMatrix = mult(modelMatrix, scale(planetSize));
	gl.uniformMatrix4fv(UNIFORM_modelMatrix, false, flatten(modelMatrix));

	//Setting UNIFORM_viewMatrix;
	if (isAttached)
		attachTo(attachedPlanet);
	gl.uniformMatrix4fv(UNIFORM_viewMatrix, false, flatten(viewMatrix));

	//Setting the light model;
	ambientProduct = mult(lightAmbient, moon.mAmbient);
	diffuseProduct = mult(lightDiffuse, moon.mDiffuse);
	specularProduct = mult(lightSpecular, moon.mSpecular);
	gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );
	gl.uniform4fv( gl.getUniformLocation(program, "ambientProductV"), flatten(ambientProduct) );
	gl.uniform4fv( gl.getUniformLocation(program, "diffuseProductV"), flatten(diffuseProduct) );
	gl.uniform4fv( gl.getUniformLocation(program, "specularProductV"), flatten(specularProduct) );
	gl.uniform1f( gl.getUniformLocation(program, "shininessV"), moon.mShininess );
	gl.uniform4fv( gl.getUniformLocation(program, "ambientProductF"), flatten(ambientProduct) );
	gl.uniform4fv( gl.getUniformLocation(program, "diffuseProductF"), flatten(diffuseProduct) );
	gl.uniform4fv( gl.getUniformLocation(program, "specularProductF"), flatten(specularProduct) );
	gl.uniform1f( gl.getUniformLocation(program, "shininessF"), moon.mShininess );

	//Setting the shading method;
	gl.uniform1f( gl.getUniformLocation(program, "shadingMethodV"), moon.shading);
	gl.uniform1f( gl.getUniformLocation(program, "shadingMethodF"), moon.shading);

	//Draw the points;
	gl.drawArrays(gl.TRIANGLES, 0, moon.numOfPoints);
}

function attachTo(celestialBodyX)
{
	//Setting the "at";
	var planetPosition = vec3(celestialBodyX.position[0], celestialBodyX.position[1], celestialBodyX.position[2]);
  at = planetPosition;
  //Setting the "eye";
  var mX = celestialBodyX.orbitRadius * Math.cos(radians(celestialBodyX.rotationAngle - eyeAngle));
  var mZ = - celestialBodyX.orbitRadius * Math.sin(radians(celestialBodyX.rotationAngle - eyeAngle));
  var mY = 0.0;
  var m = vec3(mX, mY, mZ);
  eye = add(sunPosition, m);
  // eye = add(planetPosition, vec3(0.0, 1.0, 1.0));
	up = vec3(0.0, 1.0, 0.0);
  viewMatrix = mult( attachedViewMatrix, lookAt(eye, at, up) );
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
    	//Press "Up Arrow"
    	case 38:
    			if (!isAttached)
    			{
          	var EVAtemp = eyeVertAngle + navDegree;
          	if (EVAtemp < 90)
          	{
          	  eyeVertAngle = EVAtemp;
          	  viewMatrix = mult(rotate(-navDegree, vec3(1, 0, 0)), viewMatrix);
          	  var upTemp = multMatVec(rotate(-navDegree, vec3(1, 0, 0)), vec4(worldUp, 0));
            	worldUp = vec3(upTemp[0], upTemp[1], upTemp[2]);
          	}
        	}
    			break;
    	//Press "Down Arrow"
    	case 40:
    			if (!isAttached)
    			{
          	var EVAtemp = eyeVertAngle - navDegree;
          	if (EVAtemp > -90)
          	{
          	  eyeVertAngle = EVAtemp;
          	  viewMatrix = mult(rotate(navDegree, vec3(1, 0, 0)), viewMatrix);
          	  var upTemp = multMatVec(rotate(navDegree, vec3(1, 0, 0)), vec4(worldUp, 0));
          	  worldUp = vec3(upTemp[0], upTemp[1], upTemp[2]);
          	}
        	}
          break;
    	//Press "Left Arrow"
    	case 37:
    			if (!isAttached)
    			{
          	viewMatrix = mult(rotate(-navDegree, worldUp), viewMatrix);
          }
          else
          {
          	attachedViewMatrix = mult(rotate(-navDegree, up), attachedViewMatrix)
          }
          break;
    	//Press "Right Arrow"
    	case 39:
          if (!isAttached)
    			{
          	viewMatrix = mult(rotate(navDegree, worldUp), viewMatrix);
          }
          else
          {
          	attachedViewMatrix = mult(rotate(navDegree, up), attachedViewMatrix)
          }
          break;
      //Press "R"
      case 82:
          eye = vec3(0.0, 20*Math.tan(radians(30)), 20);
          at = vec3(0.0, 0.0, 0.0);
          up = vec3(0.0, 1.0, 0.0);
          eyeVertAngle = -30;
					worldUp = normalize(vec3(0.0, 1.0, Math.tan(radians(30))));
          viewMatrix = lookAt(eye, at, up);
          fovy = 60;
          aspect = 1;
          near = 0.1;
          far = 40;
          projectionMatrix = perspective(fovy, aspect, near, far);
          break;
    	//Press "I"
    	case 73:
    			if (!isAttached)
    			{
          	viewMatrix = mult(translate(vec3(0.0, 0.0, navUnit)), viewMatrix);
    			}
    			break;
    	//Press "J"
    	case 74:
    			if (!isAttached)
    			{
          	viewMatrix = mult(translate(vec3(navUnit, 0.0, 0.0)), viewMatrix);
    			}
    			break;
    	//Press "K"
    	case 75:
    			if (!isAttached)
    			{
          	viewMatrix = mult(translate(vec3(-navUnit, 0.0, 0.0)), viewMatrix);
    			}
    			break;
    	//Press "M"
    	case 77:
    			if (!isAttached)
    			{
          	viewMatrix = mult(translate(vec3(0.0, 0.0, -navUnit)), viewMatrix);
    			}
    			break;
    	//Press "N"
    	case 78:
    			if (!isAttached)
    			{
          	var fovyTemp = fovy - fovyIncrement;
          	if (fovyTemp > 30)
          	{
            	fovy = fovyTemp;
            	projectionMatrix = perspective(fovy, aspect, near, far);
          	}
          }
    			break;
    	//Press "W"
    	case 87:
    			if (!isAttached)
    			{
          	var fovyTemp = fovy + fovyIncrement;
          	if (fovyTemp < 150)
          	{
            	fovy = fovyTemp;
            	projectionMatrix = perspective(fovy, aspect, near, far);
          	}
          }
          break;
      //Press "1"
      case 49:
      		isAttached = true;
      		attachedPlanet = planet1;
      		attachedViewMatrix = mat4();
      		break;
      //Press "2"
      case 50:
      		isAttached = true;
      		attachedPlanet = planet2;
      		attachedViewMatrix = mat4();
      		break;
      //Press "3"
      case 51:
      		isAttached = true;
      		attachedPlanet = planet3;
      		attachedViewMatrix = mat4();
      		break;
      //Press "4"
      case 52:
      		isAttached = true;
      		attachedPlanet = planet4;
      		attachedViewMatrix = mat4();
      		break;
      //Press "D"
      case 68:
      		isAttached = false;
      		eye = vec3(0.0, 20*Math.tan(radians(30)), 20);
					at = vec3(0.0, 0.0, 0.0);
					up = vec3(0.0, 1.0, 0.0);
      		viewMatrix = lookAt(eye, at, up);
      		worldUp = normalize(vec3(0.0, 1.0, Math.tan(radians(30))));
      		attachedViewMatrix = mat4();
      		break;  
    	default:
    			break;
    }
}