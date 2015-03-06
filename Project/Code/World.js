/***********************************************/
/*** Hierarchical Structure to Store Objects ***/
/***********************************************/
var stack = [];
var figure = [];
var numNodes = 0;
var index = 0;
for( var i=0; i<10; i++)
	figure[i] = createNode(null, null, null, null, null);

function createNode(object, transform, render, sibling, child){
    var node = {
    object: object,
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}

function updateNode(object) {
    figure[object.id].transform = object.modelMatrix;
}

function traverse(Id)
{
	if(Id == null) return;
	stack.push(modelMatrix);
	modelMatrix = mult(modelMatrix, figure[Id].transform);
	figure[Id].render.apply(figure[Id].object);
	if(figure[Id].child != null) traverse(figure[Id].child); 
	modelMatrix = stack.pop();
	if(figure[Id].sibling != null) traverse(figure[Id].sibling); 
}

/******************************************/
/*** World Model Containing All Objects ***/
/******************************************/
function World()
{
	this.lightPosition;
	this.lightAmbient;
	this.lightDiffuse;
	this.lightSpecular;

	this.last_child_index = -1;
	this.addObject = function(object)
	{
		object.id = index;
		figure[index] = createNode(object, object.modelMatrix, object.render, null, null);
		
		// Update the sibling of last node.
		if (this.last_child_index >= 0)
			figure[this.last_child_index].sibling = index;

		this.last_child_index = index;
		numNodes++;
		index++;
	}

	this.addLight = function(light)
	{
		this.lightPosition = light.position;
		this.lightAmbient = light.ambient;
		this.lightDiffuse = light.diffuse;
		this.lightSpecular = light.specular;

		// Assign to lightPosition, lightAmbient, lightDiffuse, lightSpecular;
		gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(this.lightPosition));
		gl.uniform4fv(gl.getUniformLocation(program, "lightAmbient"), flatten(this.lightAmbient));
		gl.uniform4fv(gl.getUniformLocation(program, "lightDiffuse"), flatten(this.lightDiffuse));
		gl.uniform4fv(gl.getUniformLocation(program, "lightSpecular"), flatten(this.lightSpecular));	
	}

	this.addProjection = function() {}

	this.render = function()
	{
		// Assign to UNIFORM_projectionMatrix;
		gl.uniformMatrix4fv(UNIFORM_projectionMatrix, false, flatten(projectionMatrix));

		// Assign to UNIFORM_viewMatrix;
		gl.uniformMatrix4fv(UNIFORM_viewMatrix, false, flatten(viewMatrix));
		
		// Render all objects in world;
		traverse(0);
	}
}

/******************************************/
/*********    Light Model    **************/
/******************************************/

// var ambientLight = 0;
var pointLight = 1;
var distantLight = 2;
// var spotLight = 3;
// function Light(type, near, position, orientation, ambient, diffuse, specular)
function Light(type, postion, ambient, diffuse, specular)
{
	this.type = type;
	this.position = vec4(postion[0], postion[1], postion[2], 0.0);
	this.position[3] = (type == 1) ? 1.0 : 0.0;

	this.ambient = ambient;
	this.diffuse = diffuse;
	this.specular = specular;
}

/******************************************/
/********    Material Model    ************/
/******************************************/
function Material(ambient, diffuse, specular, shininess)
{
	this.ambient = ambient;
	this.diffuse = diffuse;
	this.specular = specular;
	this.shininess = shininess;
}


/******************************************/
/*********    Object Model    *************/
/******************************************/
var squareType = 0;
var cubeType = 1;
var sphereType = 2;
var sphereType2 = 3;
var sphereType2_BG = 4;
function Object(type)
{
	this.id;
	this.type = type;

	this.vBuffer = (this.type == squareType) ? vBuffer_square :
				   (this.type == cubeType) ? vBuffer_cube :
				   (this.type == sphereType) ? vBuffer_sphere :
				   (this.type == sphereType2 || this.type == sphereType2_BG) ? vBuffer_sphere2 : null;
	this.nBuffer = (this.type == squareType) ? nBuffer_square :
				   (this.type == cubeType) ? nBuffer_cube :
				   (this.type == sphereType) ? nBuffer_sphere :
				   (this.type == sphereType2) ? nBuffer_sphere2 :
				   (this.type == sphereType2_BG) ? nBufferInv_sphere2 : null;
	this.uvBuffer = (this.type == squareType) ? uvBuffer_square :
				   	(this.type == cubeType) ? uvBuffer_cube :
				   	(this.type == sphereType) ? uvBuffer_sphere :
				   	(this.type == sphereType2  || this.type == sphereType2_BG) ? uvBuffer_sphere2 : null;
	this.numPoints = (this.type == squareType) ? numPoints_square :
					 (this.type == cubeType) ? numPoints_cube :
				   	 (this.type == sphereType) ? numPoints_sphere :
				   	 (this.type == sphereType2  || this.type == sphereType2_BG) ? numPoints_sphere2 : null;

	this.iBuffer = null;
	if (this.type == sphereType2 || this.type == sphereType2_BG)
		this.iBuffer = iBuffer_sphere2;

	this.sizeMatrix = mat4();
	this.modelMatrix = mat4();
	this.material = new Material(vec4(1.0, 1.0, 1.0, 1.0),
								vec4(1.0, 1.0, 1.0, 1.0),
								vec4(0.0, 0.0, 0.0, 0.0), 0);
	this.boundVolume = null;

	this.collideAffected = false;
	this.mass = 0;
  	this.velocity = vec4(0,0,0,0);
  	this.vMagMax = 10;
  	this.force = vec4(0,0,0,0);
  	this.position = vec4();
  	this.rotateAxis = vec3(-1, 0, 0);
  	this.rotateAxisN = vec3(0, -1, 0);
  	this.rotationMatrix = mat4();

  	this.rotationAngle = 0;
  	this.rotationSpeed = 0;


  	this.isTextureMapped = false;
  	this.texture = null;

	this.last_child_index = -1;


	this.addObject = function(object)
	{
		object.id = index;
		figure[index] = createNode(object, object.modelMatrix, object.render, null, null);

		// Update the sibling of last node.
		if (this.last_child_index >= 0)
			figure[this.last_child_index].sibling = index;

		// Update the child of this node;
		figure[this.id].child = index;

		this.last_child_index = index;
		numNodes++;
		index++;
	}

	this.addSizeMatrix = function(sMatrix)
	{
		this.sizeMatrix = sMatrix;
	}

	this.staticMatrix = mat4();
	this.addModelMatrix = function(mMatrix)
	{
		this.modelMatrix = mult(mMatrix, this.modelMatrix);
		this.staticMatrix = this.modelMatrix;

		// Update the position;
		this.position = multMatVec(this.staticMatrix, this.position);
	}

	this.isBound = false;
	this.generateBoundVolume = function()
	{
		this.isBound = true;
		var matrix = mult(this.modelMatrix, this.sizeMatrix);
		switch (this.type)
		{
			case sphereType:
			case sphereType2:
				this.boundVolume = new BoundingSphere(this.sizeMatrix[0][0]);
				updateBoundShere(this.boundVolume, this.modelMatrix);
				break;
			case cubeType:
				this.boundVolume = new BoundingCube();
				updateBoundCube(this.boundVolume, matrix);
				break;
			case squareType:
				this.boundVolume = new BoundingPlane();
				updateBoundPlane(this.boundVolume, matrix);
				break;
			default:
				this.boundVolume = null;
				break;
		}
	}

	this.isAnimate = false;
	this.updateAnimMatrix = function(animMatrix)
	{
		this.isAnimate = true;
		this.modelMatrix = mult(animMatrix, this.staticMatrix);
	}

	this.addMaterial = function(material)
	{
		this.material = material;
	}

	this.addTexture = function(texture)
	{
		this.isTextureMapped = true;
		this.texture = texture;
	}

	this.addForce = function(force)
	{
		this.force = add(this.force, force);
	}

	this.addVelocity = function(velocity)
	{
		this.velocity = add(this.velocity, velocity);
	}

	this.render = function()
	{
		// Assign to ATTRIBUTE_vPosition;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(ATTRIBUTE_vPosition, 4, gl.FLOAT, false, 0, 0);

		// Assign to ATTRIBUTE_vNormal;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer);
		gl.vertexAttribPointer(ATTRIBUTE_vNormal, 4, gl.FLOAT, false, 0, 0);

		// Assign to ATTRIBUTE_vUV;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
		gl.vertexAttribPointer(ATTRIBUTE_vUV, 2, gl.FLOAT, false, 0, 0);

		// Assign to UNIFORM_viewMatrix for navigation;
		gl.uniformMatrix4fv(UNIFORM_viewMatrix, false, flatten(viewMatrix));

		// When the type is sphereType2, bind the index buffer;
		if (this.type == sphereType2 || this.type == sphereType2_BG)
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iBuffer);

		// Assign to UNIFORM_modelMatrix;
		var finalModelMatrix = mult(modelMatrix, this.sizeMatrix);
		gl.uniformMatrix4fv(UNIFORM_modelMatrix, false, flatten(finalModelMatrix));


		   //Setting UNIFORM_normalMatrix;
    	normalMatrix = mat4();            
    	normalMatrix = mat4Inverse(flatten(finalModelMatrix));
    	normalMatrix = Mat4transpose(normalMatrix);
    	gl.uniformMatrix4fv(UNIFORM_normalMatrix, false, normalMatrix);


		// Update the bounding Volume;
		if (this.isBound && this.isAnimate)
			this.updateBoundV(finalModelMatrix);

		// Assign to materialAmbient, materialDiffuse, materialSpecular and shininess;
		gl.uniform4fv(gl.getUniformLocation(program, "materialAmbient"), flatten(this.material.ambient));
		gl.uniform4fv(gl.getUniformLocation(program, "materialDiffuse"), flatten(this.material.diffuse));
		gl.uniform4fv(gl.getUniformLocation(program, "materialSpecular"), flatten(this.material.specular));
		gl.uniform1f(gl.getUniformLocation(program, "shininess"), this.material.shininess );

		// Assign to isTextureMapped;
		gl.uniform1f(gl.getUniformLocation(program, "isTextureMapped"), this.isTextureMapped );
		
		// Assign to UNIFORM_uSampler for texture mapping;
		if (this.isTextureMapped)
		{
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
			gl.uniform1i(UNIFORM_uSampler, 0);
		}

		// Draw the object;
		if (this.type == sphereType2 || this.type == sphereType2_BG)
			gl.drawElements(gl.TRIANGLES, this.numPoints, gl.UNSIGNED_SHORT, 0);
		else
			gl.drawArrays(gl.TRIANGLES, 0, this.numPoints);
	}

	this.updateBoundV = function(mMatrix)
	{
		switch (this.type)
		{
			case sphereType:
			case sphereType2:
				updateBoundShere(this.boundVolume, mMatrix);
				break;
			case cubeType:
				updateBoundCube(this.boundVolume, mMatrix);
				break;
			case squareType:
				updateBoundPlane(this.boundVolume, mMatrix);
				break;
			default:
				break;
		}
	}
}



/******************************************/
/*** Bulil Up All Objects in This World ***/
/******************************************/
function duplicateStaticObj(world, object, num, scaling, translation, isBound)
{
	var i;
	for (i = 0; i < num; i++)
	{
		var dupObj = new Object(object.type);
		var matrix = mat4();
		matrix = scale(scaling[i]);
		dupObj.addSizeMatrix(matrix);
		matrix = translate(translation[i]);
		matrix = mult(matrix, object.modelMatrix);
		dupObj.addModelMatrix(matrix);
		if (isBound)
			dupObj.generateBoundVolume();
		dupObj.addMaterial(object.material);
		dupObj.addTexture(object.texture);
		world.addObject(dupObj);
	}
}
var shipcenter=[];
function duplicateSpaceObj(world, object,center)
{
	var i;
	for (i = 0; i < 12; i++)
	{
		var dupObj = new Object(object.type);
		var dupcenter = new Object(center.type);
		var matrix = mat4();
		matrix = scale(vec3(1,1.25,1));
		dupObj.addSizeMatrix(matrix);
		matrix = mat4();
		//matrix = mult(matrix,translate(vec3(-20,0,0)));
		matrix = mult(matrix,rotate(i*30,vec3(0,0,1)));
		matrix = mult(matrix, object.modelMatrix);
		dupObj.addModelMatrix(matrix);
		dupObj.addMaterial(object.material);
		if(i%2)
		dupObj.addTexture(myTexture15);
		else
		dupObj.addTexture(myTexture16);


		dupcenter.addMaterial(object.material);
		dupcenter.addTexture(myTexture16);
		dupcenter.addSizeMatrix(scale(vec3(1, 1, 4)));
		shipcenter[i]=dupcenter;
		world.addObject(dupcenter);
		dupcenter.addObject(dupObj);
			
	}

		dupObj = new Object(object.type);
		dupcenter = new Object(center.type);
		matrix = scale(vec3(0.3,2,0.3));
		dupObj.addSizeMatrix(matrix);
		dupObj.addMaterial(object.material);
		dupObj.addTexture(myTexture16);

		dupcenter.addMaterial(object.material);
		dupcenter.addTexture(myTexture16);
		dupcenter.addSizeMatrix(scale(vec3(1, 1, 4)));
		shipcenter[i]=dupcenter;
		world.addObject(dupcenter);
		dupcenter.addObject(dupObj);

}
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var lightPosition = vec3(0.0, 1.0, 1.0);
var myLight;
var obj1;
var dist1 = 0;
var obj2;
var dist2 = 0;
var rotateAngle2 = 0;
var rotateAngle3 = 0;
var rotateIncrement = 1;
var distIncrement = 0.1;
var obj3;
var materialAmbient = vec4(0.4, 0.4, 0.8, 1.0);
var materialDiffuse = vec4(0.4, 0.4, 1.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.5, 1.0);
var materialShininess = 100;
var myMaterialspaceship;
var myMaterialbackground;
var myMaterial3;
var myTexture1;
var myTexture2;
var myTexture3;
var myTexture4;
var myTexture5;
var myTexture6;
var myTexture7;
var myTexture8;
var myTexture9;
var myTexture10;
var myTextureWIN;
var obj4;
var obj5;
var obj6;
var obj7;
var obj8;
var obj9;
var obj10;
var obj11;
var obj12;
var obj13;
var obj14;
var obj15;
var obj16;
var obj17;
var scalingArray1 = [];
var translationArray1 = [];
var dupNum1;
var scalingArray2 = [];
var translationArray2 = [];
var dupNum2;

var funBall;



dupNum1 = 19;
scalingArray1 = [
	vec3(6.0, 1.0, 16.0),
	vec3(12.0, 1.0, 20.0),
	vec3(6.0, 1.0, 28.0),
	vec3(38.0, 1.0, 12.0),
	//vec3(16.0, 1.0, 12.0),
	vec3(28.0, 1.0, 12.0),
	vec3(12.0, 1.0, 12.0),
	vec3(12.0, 1.0, 12.0),
	vec3(12.0, 1.0, 12.0),
	vec3(20.0, 1.0, 12.0),
	vec3(28.0, 1.0, 12.0),
	vec3(12.0, 1.0, 40.0),
	vec3(12.0, 1.0, 12.0),
	vec3(28.0, 1.0, 12.0),   
    vec3(12.0, 1.0, 0.0),    //chalu1
	vec3(12.0, 1.0, 20.0),  
	vec3(12.0, 1.0, 0.0),    //chalu2
	vec3(16.0, 1.0, 20.0),
	vec3(12.0, 1.0, 0.0),    //chalu3
	vec3(12.0, 1.0, 20.0)
];

translationArray1 = [
	vec3(-20.0, -4/Math.sqrt(3), 0.0),
	vec3(-17.0, 0.0, -22.0),
	vec3(-20.0, 0.0, -54.0),
	vec3(2.0, 0.0, -62.0),
	//vec3(38.0, 0.0, -62.0),
	vec3(72.0, 0.0, -62.0),
	vec3(80.0, 0.0, -50.0),
	vec3(80.0, 0.0, -34.0),
	vec3(80.0, 0.0, -22.0),
	vec3(76.0, 0.0, -10.0),
	vec3(44.0, 20.0, -10.0),
	vec3(24.0, 20.0, -24.0),
	vec3(36.0, 20.0, -38.0),
	vec3(60.0, 40.0, -38.0),
	vec3(72.0, 0.0, 0.0),
	vec3(64.0, 0.0, 6.0),
	vec3(52.0, 20.0, 0.0),
	vec3(50.0, 20.0, 6.0),
	vec3(24.0, 20.0, -48.0),
	vec3(24.0, 20.0, -54.0)
];
	
dupNum2 = 5;
scalingArray2 = [
	//vec3(4.0, 4.0, 4.0),
	//vec3(4.0, 4.0, 4.0),
	vec3(4.0, 4.0, 4.0),
	vec3(4.0, 4.0, 4.0),
	vec3(4.0, 4.0, 4.0),
	vec3(4.0, 4.0, 4.0),
	vec3(4.0, 4.0, 4.0)
];
translationArray2 = [
	//vec3(-4.0, 0.0, -48.0),
	//vec3(4.0, 0.0, -48.0),
	vec3(76.0, 0.0, -36.0),
	vec3(80.0, 0.0, -36.0),
	vec3(84.0, 0.0, -36.0),
	vec3(40.0, 20.01, -6.0),
	vec3(40.0, 20.01, -14.0)
];

var background;
var initialPosition_obj2 = vec4();
var lastPosition_obj2 = vec4();

var corner = [
vec4(-14,0,-56,1),
vec4(74,0,-56,0),
vec4(74,0,-16,1),
vec4(30,0,-16,0),
vec4(30,20,-32,1)
];

function buildUpWorld(world)
{
	// Create light;
	myLight = new Light(distantLight, lightPosition,
						lightAmbient, lightDiffuse, lightSpecular);
	world.addLight(myLight);
	


	// Create material;
	materialAmbient = vec4(1.5, 1, 1.5, 1.0);
	materialDiffuse = vec4(1.7, 1.7, 1.7, 1.0);
	materialSpecular = vec4(4, 2, 1, 1.0);
	myMaterialspaceship = new Material(materialAmbient, materialDiffuse,
							materialSpecular, materialShininess);
	
	materialAmbient = vec4(2.5, 2.5, 2.5, 1.0);
	materialDiffuse = vec4(0.5, 0.5, 0.5, 1.0);
	materialSpecular = vec4(0, 0, 0, 1.0);
	materialShininess = 150;
	myMaterialbackground = new Material(materialAmbient, materialDiffuse,
							materialSpecular, materialShininess);

	materialAmbient = vec4(3, 0, 0, 1.0);
	materialDiffuse = vec4(0.2, 0.0, 0.0, 1.0);
	myMaterial3 = new Material(materialAmbient, materialDiffuse,
							materialSpecular, materialShininess);

	// Create material;
	materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
	materialDiffuse = vec4(1, 1, 1.0, 1.0);
	materialSpecular = vec4(1, 1, 1, 1.0);
	materialShininess = 250;
	myMaterialplanet = new Material(materialAmbient, materialDiffuse,
							materialSpecular, materialShininess);



	// Create material;
	materialAmbient = vec4(5, 5, 5, 1.0);
	materialDiffuse = vec4(0, 0, 0.0, 1.0);
	materialSpecular = vec4(0, 0, 0, 1.0);
	materialShininess = 150;
	myMaterialsun = new Material(materialAmbient, materialDiffuse,
							materialSpecular, materialShininess);

		// Create material;
	materialAmbient = vec4(2, 2, 2, 1.0);
	materialDiffuse = vec4(0.4, 0.4, 0.4, 1.0);
	materialSpecular = vec4(0, 0, 0, 1.0);
	materialShininess = 150;
	myMaterialroad = new Material(materialAmbient, materialDiffuse,
							materialSpecular, materialShininess);

	// Create texture;
	myTexture1 = gl.createTexture();
	myTexture1.image = new Image();
	myTexture1.image.src = "../Images/3.jpg";
	myTexture1.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture1);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture1.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture2 = gl.createTexture();
	myTexture2.image = new Image();
	myTexture2.image.src = "../Images/5.jpg";
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
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture21 = gl.createTexture();
	myTexture21.image = new Image();
	myTexture21.image.src = "../Images/51.jpg";
	myTexture21.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture21);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture21.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture3 = gl.createTexture();
	myTexture3.image = new Image();
	myTexture3.image.src = "../Images/4.jpg";
	myTexture3.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture3);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture3.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture4 = gl.createTexture();
	myTexture4.image = new Image();
	myTexture4.image.src = "../Images/neptune2.jpg";
	myTexture4.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture4);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture4.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}


	myTexture5 = gl.createTexture();
	myTexture5.image = new Image();
	myTexture5.image.src = "../Images/2.jpg";
	myTexture5.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture5);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture5.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture6 = gl.createTexture();
	myTexture6.image = new Image();
	myTexture6.image.src = "../Images/sunmap.jpg";
	myTexture6.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture6);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture6.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}


	myTextureWIN = gl.createTexture();
	myTextureWIN.image = new Image();
	myTextureWIN.image.src = "../Images/WIN.jpg";
	myTextureWIN.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTextureWIN);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTextureWIN.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture7 = gl.createTexture();
	myTexture7.image = new Image();
	myTexture7.image.src = "../Images/final.jpg";
	myTexture7.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture7);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture7.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture8 = gl.createTexture();
	myTexture8.image = new Image();
	myTexture8.image.src = "../Images/circle.jpg";
	myTexture8.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture8);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture8.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture9 = gl.createTexture();
	myTexture9.image = new Image();
	myTexture9.image.src = "../Images/jupitermap.jpg";
	myTexture9.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture9);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture9.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture10 = gl.createTexture();
	myTexture10.image = new Image();
	myTexture10.image.src = "../Images/bigearth.jpg";
	myTexture10.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture10);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture10.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture11 = gl.createTexture();
	myTexture11.image = new Image();
	myTexture11.image.src = "../Images/venusmap.jpg";
	myTexture11.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture11);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture11.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture12 = gl.createTexture();
	myTexture12.image = new Image();
	myTexture12.image.src = "../Images/mars.jpg";
	myTexture12.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture12);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture12.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	myTexture13 = gl.createTexture();
	myTexture13.image = new Image();
	myTexture13.image.src = "../Images/987mars.jpg";
	myTexture13.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture13);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture13.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

		myTexture14 = gl.createTexture();
	myTexture14.image = new Image();
	myTexture14.image.src = "../Images/moon.jpg";
	myTexture14.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture14);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture14.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture15 = gl.createTexture();
	myTexture15.image = new Image();
	myTexture15.image.src = "../Images/space.jpg";
	myTexture15.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture15);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture15.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	myTexture16 = gl.createTexture();
	myTexture16.image = new Image();
	myTexture16.image.src = "../Images/space1.jpg";
	myTexture16.image.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, myTexture16);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexture16.image);
		gl.generateMipmap(gl.TEXTURE_2D);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		 gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
	/******************************************/
	/*********      LEVEL 1       *************/
	/******************************************/
	// Create myBall;     *(Initial position of ball can only adjusted by myBall.position)!!
	myBall = new Object(sphereType2);
	myBall.addSizeMatrix(scale(vec3(1.0, 1.0, 1.0)));
	 myBall.position = vec4(-20.0, 10.0, 4.0, 0.0);
	 // myBall.position = vec4(64.0, 8.0, 8.0, 0.0); // first 0 gravt
	// myBall.position = vec4(52.0, 28.0, 10.0, 0.0);// second 0 gravt
	   // myBall.position = vec4(24.0, 28.0, -58.0, 0.0);// third 0 gravt
	
	myBall.addTexture(myTexture4);
	myBall.generateBoundVolume();
	// Create myBall's physical properties;
	myBall.collideAffected = true;
	myBall.mass = 3.0;
	world.addObject(myBall);

	

	/******************************************/
	/*********      LEVEL 2       *************/
	/******************************************/
	// Create obj1 ball;
	obj1 = new Object(sphereType2);
	obj1.addSizeMatrix(scale(vec3(1, 1, 1)));
	obj1.addMaterial(myMaterialroad);
	obj1.addTexture(myTexture12);
	obj1.generateBoundVolume();
	// Create myBall's physical properties;
	obj1.collideAffected = true;
	obj1.position = vec4(-17, 16.0, -22.0, 1.0);
	obj1.mass = 3;
	world.addObject(obj1);

	// Create obj2 cube;
	obj2 = new Object(cubeType);
	obj2.addSizeMatrix(scale(vec3(6, 6, 6)));
	obj2.addTexture(myTexture21);
	obj2.addMaterial(myMaterialroad);
	obj2.generateBoundVolume();
	// Create myBall's physical properties;
	obj2.collideAffected = true;
	obj2.position = vec4(-20.0, 0.0, -48.0, 1.0);
	initialPosition_obj2 = obj2.position;
	//lastPosition_obj2 = obj2.position;
	obj2.mass = 5;
	world.addObject(obj2);

	// Create obj22 cube;
	obj22 = new Object(cubeType);
	obj22.addSizeMatrix(scale(vec3(4, 4, 4)));
	obj22.addTexture(myTexture21);
	obj22.addMaterial(myMaterialroad);
	obj22.generateBoundVolume();
	// Create myBall's physical properties;
	obj22.collideAffected = false;
	obj22.position = vec4(40, 20.01, -10.0, 1.0);
	initialPosition_obj22 = obj22.position;
	//lastPosition_obj2 = obj2.position;
	obj22.mass = 5;
	world.addObject(obj22);


    /******************************************/
	/*********      LEVEL 3       *************/
	/******************************************/
	// Create background;
	background = new Object(sphereType2_BG);
	background.addSizeMatrix(scale(vec3(2000, 2000, 2000)));
	modelMatrix = mat4();
	// modelMatrix = mult(modelMatrix, translate(vec3(0.0, 0.0, 0.0)));
	background.addModelMatrix(modelMatrix);
	background.addMaterial(myMaterialbackground);
	background.addTexture(myTexture5);
	world.addObject(background);

	// Create obj3   Road
	obj3 = new Object(squareType);      
	obj3.addMaterial(myMaterialroad);
	obj3.addTexture(myTexture1);

	duplicateStaticObj(world, obj3, dupNum1, scalingArray1, translationArray1);
	//obj3.generateBoundVolume();
	duplicateStaticObj(world, obj3, dupNum1, scalingArray1, translationArray1, true);

	// Create obj4;   slope1
	obj4 = new Object(squareType);
	obj4.addSizeMatrix(scale(vec3(6, 1, 8/Math.sqrt(3))));
	modelMatrix = mat4();
	modelMatrix = mult(rotate(30,vec3(1,0,0)),modelMatrix);
	modelMatrix = mult(translate(vec3(-20.0, -2/ Math.sqrt(3), -10)),modelMatrix);
	obj4.addModelMatrix(modelMatrix);
	obj4.addMaterial(myMaterialroad);
	obj4.addTexture(myTexture1);
	obj4.generateBoundVolume();
	world.addObject(obj4);


	// Create obj5;   slope2
	obj5 = new Object(squareType);
	obj5.addSizeMatrix(scale(vec3(60, 1, 12)));
	modelMatrix = mat4();
	modelMatrix = mult(rotate(30,vec3(1,0,0)),modelMatrix);
	modelMatrix = mult(translate(vec3(36, 3, -68-3*Math.sqrt(3))),modelMatrix);
	obj5.addModelMatrix(modelMatrix);
	obj5.addMaterial(myMaterialroad);
	obj5.addTexture(myTexture1);
	obj5.generateBoundVolume();
	world.addObject(obj5);


	// Create obj6;   slope3
	obj6 = new Object(squareType);
	obj6.addSizeMatrix(scale(vec3(12, 1, 8)));
	modelMatrix = mat4();
	modelMatrix = mult(rotate(-30,vec3(1,0,0)),modelMatrix);
	modelMatrix = mult(translate(vec3(80, 2, -46)),modelMatrix);
	obj6.addModelMatrix(modelMatrix);
	obj6.addMaterial(myMaterialroad);
	obj6.addTexture(myTexture1);
	obj6.generateBoundVolume();
	world.addObject(obj6);


	// Create obj7   fixed cube
	obj7 = new Object(cubeType);
	obj7.addMaterial(myMaterialroad);
	obj7.addTexture(myTexture3);

	duplicateStaticObj(world, obj7, dupNum2, scalingArray2, translationArray2);
	obj7.generateBoundVolume();
	duplicateStaticObj(world, obj7, dupNum2, scalingArray2, translationArray2, true);


	// Create obj8;   movingcube2
	obj8 = new Object(cubeType);
	obj8.addSizeMatrix(scale(vec3(2, 2, 4)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(-1, 20.01, 0)), modelMatrix);
	obj8.addModelMatrix(modelMatrix);
	obj8.addMaterial(myMaterialroad);
	obj8.addTexture(myTexture3);
	obj8.generateBoundVolume();
	world.addObject(obj8);

	// Create obj9;   movingcube1
	obj9 = new Object(cubeType);
	obj9.addSizeMatrix(scale(vec3(2, 2, 4)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(1, 20.01, 0)), modelMatrix);
	obj9.addModelMatrix(modelMatrix);
	obj9.addMaterial(myMaterialroad);
	obj9.addTexture(myTexture3);
	obj9.generateBoundVolume();
	world.addObject(obj9);


	// Create obj10;   bridge
	obj10 = new Object(squareType);
	obj10.addSizeMatrix(scale(vec3(6, 1, 8)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(-20, 0.0, -36)),modelMatrix);
	obj10.addModelMatrix(modelMatrix);
	obj10.addMaterial(myMaterialroad);
	obj10.addTexture(myTexture1);
	obj10.generateBoundVolume();
	//world.addObject(obj10);w

	// Create obj11;   squareforbridge
	obj11 = new Object(squareType);
	obj11.addSizeMatrix(scale(vec3(6, 6, 6)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(-13, 3, -30)),modelMatrix);
	modelMatrix = mult(modelMatrix,rotate(-45,vec3(0, 1, 0)));
	modelMatrix = mult(modelMatrix,rotate(90,vec3(1, 0, 0)));
	
	obj11.addModelMatrix(modelMatrix);
	obj11.addMaterial(myMaterialroad);
	obj11.addTexture(myTexture13);
	obj11.generateBoundVolume();
	world.addObject(obj11);



	/******************************************/
	/*********      DESTINATION   *************/
	/******************************************/
	// Create obj12;   WIN
	obj12 = new Object(squareType);
	obj12.addSizeMatrix(scale(vec3(8, 1, 12)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(60, 40.01, -38)),modelMatrix);
	obj12.addModelMatrix(modelMatrix);
	obj12.addMaterial(myMaterial3);
	//obj12.addTexture(myTexture2);
	obj12.generateBoundVolume();
	world.addObject(obj12);
 
    // Create obj13;     funal wall  
	obj13 = new Object(squareType);
	obj13.addSizeMatrix(scale(vec3(12, 1, 12)));
	modelMatrix = mat4();
	modelMatrix = mult(rotate(90,vec3(0,0,1)), modelMatrix);
	modelMatrix = mult(translate(vec3(72, 46, -38)),modelMatrix);
	obj13.addModelMatrix(modelMatrix);
	obj13.addMaterial(myMaterialsun);
	obj13.addTexture(myTexture7);
	obj13.generateBoundVolume();
	//world.addObject(obj13);



	/******************************************/
	/******************************************/

	// Create obj15;   zhenkongqu1
	obj15 = new Object(squareType);
	obj15.addSizeMatrix(scale(vec3(12, 1, 12)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(64, 0.01, -10)),modelMatrix);
	obj15.addModelMatrix(modelMatrix);
	obj15.addMaterial(myMaterialroad);
	obj15.addTexture(myTexture8);
	obj15.generateBoundVolume();
	world.addObject(obj15);

	//Create obj15top;   zhenkongqu1's top
	obj15top = new Object(squareType);
	obj15top.addSizeMatrix(scale(vec3(12, 1, 12)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(64, 20.01, -10)),modelMatrix);
	obj15top.addModelMatrix(modelMatrix);
	obj15top.addMaterial(myMaterialroad);
	obj15top.addTexture(myTexture8);
	obj15top.generateBoundVolume();
	world.addObject(obj15top);

	// Create obj16;   zhenkongqu2
	obj16 = new Object(squareType);
	obj16.addSizeMatrix(scale(vec3(12, 1, 12)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(40, 20.01, -38)),modelMatrix);
	obj16.addModelMatrix(modelMatrix);
	obj16.addMaterial(myMaterialroad);
	obj16.addTexture(myTexture8);
	obj16.generateBoundVolume();
	world.addObject(obj16);

	// Create obj16top;   zhenkongqu2'top
	obj16top = new Object(squareType);
	obj16top.addSizeMatrix(scale(vec3(12, 1, 12)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(40, 40.01, -38)),modelMatrix);
	obj16top.addModelMatrix(modelMatrix);
	obj16top.addMaterial(myMaterialroad);
	obj16top.addTexture(myTexture8);
	obj16top.generateBoundVolume();
	world.addObject(obj16top);
  
    //trigger zhenkongqu1
	obj17 = new Object(squareType);
	obj17.addSizeMatrix(scale(vec3(4, 1, 4)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(64, 0.01, 10)),modelMatrix);
	obj17.addModelMatrix(modelMatrix);
	obj17.addMaterial(myMaterialroad);
	obj17.addTexture(myTexture2);
	obj17.generateBoundVolume();
	world.addObject(obj17);

	//triggerback 
	obj18 = new Object(squareType);
	obj18.addSizeMatrix(scale(vec3(4, 1, 4)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(50, 20.01, 10)),modelMatrix);
	obj18.addModelMatrix(modelMatrix);
	obj18.addMaterial(myMaterialroad);
	obj18.addTexture(myTexture21);
	obj18.generateBoundVolume();
	world.addObject(obj18);

	//trigger zhenkongqu2
	obj19 = new Object(squareType);
	obj19.addSizeMatrix(scale(vec3(4, 1, 4)));
	modelMatrix = mat4();
	modelMatrix = mult(translate(vec3(24, 20.01, -58)),modelMatrix);
	obj19.addModelMatrix(modelMatrix);
	obj19.addMaterial(myMaterialroad);
	obj19.addTexture(myTexture2);
	obj19.generateBoundVolume();
	world.addObject(obj19);


	// Create obj1 ball;
	earth = new Object(sphereType2);
	earth.addSizeMatrix(scale(vec3(250, 250, 250)));
	earth.addTexture(myTexture10);
	earth.addMaterial(myMaterialplanet);
	earth.collideAffected = false;
	earth.position = vec4(0.0, -230.0, -250.0, 1.0);
	earth.mass = 10;
	world.addObject(earth);

		// Create obj1 ball;
	solar = new Object(sphereType2);
	solar.addSizeMatrix(scale(vec3(250, 250, 250)));
	solar.addTexture(myTexture6);
	solar.addMaterial(myMaterialsun);
	earth.addObject(solar);
		

		// Create venus ball;
	venus = new Object(sphereType2);
	venus.addSizeMatrix(scale(vec3(35, 35, 35)));
	venus.addTexture(myTexture11);
	venus.addMaterial(myMaterialplanet);
	solar.addObject(venus);



		// Create venus ball;
	moon = new Object(sphereType2);
	moon.addSizeMatrix(scale(vec3(15, 15, 15)));
	moon.addTexture(myTexture14);
	moon.addMaterial(myMaterialplanet);
	venus.addObject(moon);



		// Create shipcenter;
	shipcenter = new Object(cubeType);
	shipcenter.addMaterial(myMaterialspaceship);
	
	// Create obj8;   movingcube2
	spaceship = new Object(cubeType);
	spaceship.addMaterial(myMaterialspaceship);
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix,translate(vec3(0, 2, 0)));
	spaceship.addModelMatrix(modelMatrix);


	duplicateSpaceObj(world, spaceship,shipcenter);



}


var scaleF1 = 1.0;
var scaleF2 = -1.0;
var scaleFIncrement1 = 0.03;
var scaleFIncrement2 = -0.03;
var factor = 2;
var deg=0;
var shipindex=0;
function updateObjects()
{
	distIncrement *= (dist1 > 3) ? -1 : 1;
	distIncrement *= (dist1 < -3) ? -1 : 1;
	dist1 += distIncrement;
	rotateAngle2 += rotateIncrement;
	rotateAngle2 %= 360;
	//rotateAngle3 += 20 * dTime * rotateIncrement;

	// MyBall's animation;
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, translate(vec3(myBall.position)));
	// modelMatrix = mult(modelMatrix, rotate(myBall.rotateAngle, myBall.rotateAxis));
	modelMatrix = mult(modelMatrix, myBall.rotationMatrix);
	myBall.updateAnimMatrix(modelMatrix);

	// Obj1's animation;
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, translate(vec3(obj1.position)));
	// modelMatrix = mult(modelMatrix, rotate(obj1.rotateAngle, obj1.rotateAxis));
	modelMatrix = mult(modelMatrix, obj1.rotationMatrix);
	obj1.updateAnimMatrix(modelMatrix);

	//rotate earth
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, translate(vec3(earth.position)));
	deg+=dTime;
	modelMatrix = mult(modelMatrix, rotate(90,vec3(0,0,1)));
	// modelMatrix = mult(modelMatrix, rotate(130,vec3(0,1,0)));
	modelMatrix = mult(modelMatrix, rotate(deg,vec3(0,1,0)));
	earth.updateAnimMatrix(modelMatrix);
	
	//rotate background
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, rotate(-100,vec3(0,0,1)));
	modelMatrix = mult(modelMatrix, rotate(-30,vec3(0,1,0)));
	modelMatrix = mult(modelMatrix, rotate(-0.3*deg,vec3(0,1,0)));
	background.updateAnimMatrix(modelMatrix);


	// solar animation;
	modelMatrix = mat4();

	modelMatrix = mult(modelMatrix, rotate(-2*deg,vec3(0,1,0)));
	modelMatrix = mult(modelMatrix, translate(vec3(0, 0, -1000)));
		 modelMatrix = mult(modelMatrix, rotate(4*deg,vec3(0,1,0)));
	solar.updateAnimMatrix(modelMatrix);

		// modelMatrix = mult(modelMatrix, translate(vec3(-120.0, 0.0, 0.0)));
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, rotate(-deg,vec3(1,0,0)));
	modelMatrix = mult(modelMatrix, rotate(2*deg,vec3(1,0,0)));
	// modelMatrix = mult(modelMatrix, rotate(200,vec3(1,0,0)));
	lightPosition=vec3(multMatVec(modelMatrix,vec4(0,0,-1000,0)));
	myLight1 = new Light(1, lightPosition,
						lightAmbient, lightDiffuse, lightSpecular);
	myWorld.addLight(myLight1);

	// venus animation;
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, rotate(180,vec3(0,1,0)));
	modelMatrix = mult(modelMatrix, rotate(-20*deg,vec3(0,1,0)));
	modelMatrix = mult(modelMatrix, translate(vec3(500.0, 0.0, 0.0)));
	venus.updateAnimMatrix(modelMatrix);





	// venus moon animation;
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, rotate(100*deg,vec3(0,1,0)));
	modelMatrix = mult(modelMatrix, translate(vec3(100.0, 0, 0.0)));
	moon.updateAnimMatrix(modelMatrix);

	spacerotate();

	// Obj2's animation;
	modelMatrix = mat4();
	
	if (length1(subtract(obj2.position, initialPosition_obj2)) < 17)
	{
		modelMatrix = mult(modelMatrix, translate(vec3(obj2.position)));
		lastPosition_obj2 = obj2.position;
	}
	else
	{
		modelMatrix = mult(modelMatrix, translate(vec3(lastPosition_obj2)));
		obj2.velocity = vec4(0,0,0,0);
		obj2.collideAffected = false;
	}

	lastPosition_obj2 = vec3(obj2.position);
	obj2.updateAnimMatrix(modelMatrix);

	// Obj22's animation;
	modelMatrix = mat4();
	
	if (length1(subtract(obj22.position, initialPosition_obj22)) < 17)
	{
		modelMatrix = mult(modelMatrix, translate(vec3(obj22.position)));
		lastPosition_obj22 = obj22.position;
	}
	else
	{
		modelMatrix = mult(modelMatrix, translate(vec3(lastPosition_obj22)));
		obj22.velocity = vec4(0,0,0,0);
		obj22.collideAffected = false;
	}

	lastPosition_obj22 = vec3(obj22.position);
	obj22.updateAnimMatrix(modelMatrix);



	scaleFIncrement1 *= (scaleF1 > 5) ? -1 : 1;
	scaleFIncrement1 *= (scaleF1 < 1) ? -1 : 1;
	scaleF1 += 40 * dTime * scaleFIncrement1;

	scaleFIncrement2 *= (scaleF2 < -5) ? -1 : 1;
	scaleFIncrement2 *= (scaleF2 > -1) ? -1 : 1;
	scaleF2 += 40 * dTime * scaleFIncrement2;


	//movingcube1's animation
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, translate(18,0,-20));
	modelMatrix = mult(modelMatrix, scale(scaleF1,1,1));
	obj9.velocity = vec4(factor * 80 * scaleFIncrement1,0,0,0);
	
	obj9.updateAnimMatrix(modelMatrix);

	//movingcube2's animation
	modelMatrix = mat4();
	modelMatrix = mult(modelMatrix, translate(30,0,-28));
	modelMatrix = mult(modelMatrix, scale(-scaleF2,1,1));
	obj8.velocity = vec4(factor * 80 * scaleFIncrement2,0,0,0);

	obj8.updateAnimMatrix(modelMatrix);

	// FunBall animation;
	// modelMatrix = mat4();
	// funBall.rotationAngle += 6 * dTime * funBall.rotationSpeed;
	// funBall.rotationAngle %= 360;
	// modelMatrix = mult(modelMatrix, rotate(funBall.rotationAngle, vec3(0.0, 1.0, 0.0)));
	// funBall.updateAnimMatrix(modelMatrix);

	


	updateNode(myBall);
	updateNode(obj1);
	updateNode(obj2);
	updateNode(obj22);
	updateNode(obj9);
	updateNode(obj8);
	// updateNode(funBall);
	updateNode(earth);
	updateNode(background);

	updateNode(solar);
	updateNode(venus);
	updateNode(moon);
	
	

}


function spacerotate()
{
	var i;
	for (i = 0; i < 13; i++)
	{
		
		matrix = mat4();

		matrix = mult(matrix,translate(vec3(-45,15,-20)));
		matrix = mult(matrix,rotate(30,vec3(0,1,0)));
		matrix = mult(matrix,rotate(20*deg,vec3(0,0,1)));
		shipcenter[i].updateAnimMatrix(matrix);	
		updateNode(shipcenter[i]);
	}
}