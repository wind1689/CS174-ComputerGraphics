var gl;
var points1;
var points2;
var colorVar;
var vColor;
var vPosition;
var vBuffer1;
var vBuffer2;
var vMVTranslate;
var numPoints = 5000;
var direction = true;
var angle = 0;
var delta = 0;
var mvMatrix;

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
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	// Set up geometry models
	gasket();
	gasket2();

	//Load shaders and initialize attribute buffers
	var program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);

	//Load the point data into the GPU

	//Restore the points of gasket2 in the Buffer2 in GPU;
	vBuffer2 = gl.createBuffer();     
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points2), gl.STATIC_DRAW);

	//Restore the points of gasket1 in the Buffer1 in GPU;
	vBuffer1 = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer1);   
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points1), gl.STATIC_DRAW);  

	//Associate out shader variables with our data buffer
	vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	//Create the color variable which can be passed through to the fragment shader;
	colorVar = vec4(1.0, 0.0, 0.0, 1.0);
	vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttrib4fv(vColor, flatten(colorVar));

	//Create the model-view Matrix;
	mvMatrix = mat4();
	vMVTranslate = gl.getUniformLocation(program, "vMVTranslate");
	gl.uniformMatrix4fv(vMVTranslate, false, flatten(mvMatrix));

	render();
}

function render()
{
	gl.clear(gl.COLOR_BUFFER_BIT);  //If it is an animation, the color in last frame must be cleared
	angle += delta;
	mvMatrix = rotate(angle, [0, 0, 1]);
	gl.uniformMatrix4fv(vMVTranslate, false, flatten(mvMatrix));
	gl.drawArrays(gl.POINTS, 0, numPoints);
	requestAnimFrame(render);
}

function gasket()
{
	var vertices =
	[	vec2(-0.5, -0.5),
		vec2(0.5, -0.5),
		vec2(0.0, 0.5),
	];

	var u = add(vertices[0], vertices[1]);
	var v = add(vertices[0], vertices[2]);
	var p = scale(0.5, add(u, v));

	points1 = [p];

	for (var i = 0; points1.length < numPoints; ++i)
	{
		var j = Math.floor(Math.random()*3);

		p = add(points1[i], vertices[j]);
		p = scale(0.5, p);
		points1.push(p);
	}
}

function gasket2()
{
	var vertices =
	[	vec2(-0.5, 0.5),
		vec2(0.5, -0.5),
		vec2(0.0, 0.5),
	];

	var u = add(vertices[0], vertices[1]);
	var v = add(vertices[0], vertices[2]);
	var p = scale(0.5, add(u, v));

	points2 = [p];

	for (var i = 0; points2.length < numPoints; ++i)
	{
		var j = Math.floor(Math.random()*3);

		p = add(points2[i], vertices[j]);
		p = scale(0.5, p);
		points2.push(p);
	}
}

//When the key is pressed, trigger this following function; 
window.onkeydown = function(event)
{
    var key = String.fromCharCode(event.keyCode);
    switch (key)
    {
    	//When the number "1" is pressed, change color to green;
    	case '1':
    		colorVar = vec4(0.0, 1.0, 0.0, 1.0);
    		gl.vertexAttrib4fv(vColor, flatten(colorVar));
    		break;
    	//When the number "2" is pressed, change color back to red;
    	case '2':
    		colorVar = vec4(1.0, 0.0, 0.0, 1.0);
    		gl.vertexAttrib4fv(vColor, flatten(colorVar));
    		break;
    	//When the number "3" is pressed, change the shape to gasket2;
    	case '3':
    		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
			gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(vPosition);
    		break;
    	//When the number "4" is pressed, change the shape back to gasket1;
    	case '4':
    		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer1);
			gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
			gl.enableVertexAttribArray(vPosition);
	   		break;
	   	case 'R':
	   		delta = 1;
	   		break;
    }
}

//When the key is released, trigger this following function;
/*window.onkeyup = function(event)
{
    colorVar = vec4(1.0, 0.0, 0.0, 1.0);  //Reset the color back to red;
    gl.vertexAttrib4fv(vColor, flatten(colorVar));
}*/
