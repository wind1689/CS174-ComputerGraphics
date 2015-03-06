/*********************************/
/*** Create Geometrics' Models ***/
/*********************************/
// Cube model
function cube(points, normals, uv)
{
  //The vertices of the Cube
  var vertices = [
      vec4(  length, 2*length,  length, 1.0),
      vec4( -length, 2*length,  length, 1.0),
      vec4( -length, 0,  length, 1.0),
      vec4(  length, 0,  length, 1.0),
      vec4(  length, 2*length, -length, 1.0),
      vec4( -length, 2*length, -length, 1.0),
      vec4( -length, 0, -length, 1.0),
      vec4(  length, 0, -length, 1.0)
  ];

  //Push the vertices into points array;
  quad(vertices[0], vertices[1], vertices[2], vertices[3], vec4(0, 0, 1, 0), points, normals, uv); //Front
  quad(vertices[4], vertices[5], vertices[6], vertices[7], vec4(0, 0, -1, 0), points, normals, uv); //Back
  quad(vertices[1], vertices[5], vertices[6], vertices[2], vec4(-1, 0, 0, 0), points, normals, uv); //Left
  quad(vertices[4], vertices[0], vertices[3], vertices[7], vec4(1, 0, 0, 0), points, normals, uv); //Right
  quad(vertices[4], vertices[5], vertices[1], vertices[0], vec4(0, 1, 0, 0), points, normals, uv); //Top
  quad(vertices[3], vertices[2], vertices[6], vertices[7], vec4(0, -1, 0, 0), points, normals, uv); //Bottom
}

// Square model;
function quad(a, b, c, d, quadNormal, points, normals, uv)
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

// Sphere model;
function sphere(complexity, points, normals, uv)
{
  //Initial four points for tetrahedron;
  var va = vec4(0.0, 0.0, -1.0, 1);
  var vb = vec4(0.0, 0.942809, 0.333333, 1);
  var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
  var vd = vec4(0.816497, -0.471405, 0.333333, 1);

  //Subdivide each facet of tetrahedron;
  divideTriangle(va, vb, vc, complexity, points, normals, uv);
  divideTriangle(vd, vc, vb, complexity, points, normals, uv);
  divideTriangle(va, vd, vb, complexity, points, normals, uv);
  divideTriangle(va, vc, vd, complexity, points, normals, uv);
}
function divideTriangle(a, b, c, count, points, normals, uv)
{
  if (count > 0)
  {
    var ab = normalize(mix(a, b, 0.5), true);
    var ac = normalize(mix(a, c, 0.5), true);
    var bc = normalize(mix(b, c, 0.5), true);
    divideTriangle(a, ab, ac, count - 1, points, normals, uv);
    divideTriangle(ab, b, bc, count - 1, points, normals, uv);
    divideTriangle(bc, c, ac, count - 1, points, normals, uv);
    divideTriangle(ab, bc, ac, count - 1, points, normals, uv);
  }
  else
  {
    triangle(a, b, c, points, normals, uv);
  }
}

// Triangle model;
function triangle(a, b, c, points, normals, uv)
{
  points.push(a);
  points.push(b);
  points.push(c);

  normals.push(vec4(a[0], a[1], a[2], 0));
  normals.push(vec4(b[0], b[1], b[2], 0));
  normals.push(vec4(c[0], c[1], c[2], 0));
  uv.push(vec2(0.5, 1.0));
  uv.push(vec2(0.0, 0.0));
  uv.push(vec2(1.0, 0.0));
  numPoints += 3;
}

// Sphere model which can be texture mapped;
function sphere2(latitudeBands, longitudeBands, points, normals, normalsInv, uv, indices)
{
  for (var latNumber=0; latNumber <= latitudeBands; latNumber++)
  {
      var theta = latNumber * Math.PI / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber=0; longNumber <= longitudeBands; longNumber++)
      {
          var phi = longNumber * 2 * Math.PI / longitudeBands;
          var sinPhi = Math.sin(phi);
          var cosPhi = Math.cos(phi);

          var x = cosPhi * sinTheta;
          var y = cosTheta;
          var z = sinPhi * sinTheta;
          var u = 1 - (longNumber / longitudeBands);
          var v = 1 - (latNumber / latitudeBands);

          normals.push(x);
          normals.push(y);
          normals.push(z);
          normals.push(0.0);
          normalsInv.push(-x);
          normalsInv.push(-y);
          normalsInv.push(-z);
          normalsInv.push(0.0);
          uv.push(u);
          uv.push(v);
          points.push(x);
          points.push(y);
          points.push(z);
          points.push(1.0);
      }
  }

  for (var latNumber=0; latNumber < latitudeBands; latNumber++)
  {
      for (var longNumber=0; longNumber < longitudeBands; longNumber++)
      {
          var first = (latNumber * (longitudeBands + 1)) + longNumber;
          var second = first + longitudeBands + 1;
          indices.push(first);
          indices.push(second);
          indices.push(first + 1);

          indices.push(second);
          indices.push(second + 1);
          indices.push(first + 1);
      }
  }
}

/*****************************************/
/*** Create Geometrics' Buffers in GPU ***/
/*****************************************/
var pointsArray = [];
var normalsArray = [];
var indicesArray = [];
var uvArray = [];
var numPoints = 0;

// Create Square Buffer;
var vBuffer_square;
var nBuffer_square;
var uvBuffer_square;
var numPoints_square;
function createSquareBuffer()
{
  pointsArray = [];
  normalsArray = [];
  uvArray = [];
  // Build up a square model;
  numPoints = 6;
  numPoints_square = numPoints;
  var a = vec4( 0.5,  0.0, -0.5,  1.0);
  var b = vec4(-0.5,  0.0, -0.5,  1.0);
  var c = vec4(-0.5,  0.0,  0.5,  1.0);
  var d = vec4( 0.5,  0.0,  0.5,  1.0);
  var normal = vec4(0.0, 1.0, 0.0, 0.0);
  quad(a, b, c, d, normal, pointsArray, normalsArray, uvArray);
  // Create a vertex Buffer in GPU to store the data;
  vBuffer_square = gl.createBuffer(); 
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_square);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  // Create a normal Buffer in GPU to store the data;
  nBuffer_square = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer_square);   
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
  // Create a uv Buffer in GPU to store the data;
  uvBuffer_square = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer_square);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(uvArray), gl.STATIC_DRAW);
}

// Create Cube Buffer;
var vBuffer_cube;
var nBuffer_cube;
var uvBuffer_cube;
var numPoints_cube;
var length = 0.5;
function createCubeBuffer()
{
  pointsArray = [];
  normalsArray = [];
  uvArray = [];
  // Build up a cube model;
  numPoints = 36;
  numPoints_cube = numPoints;
  cube(pointsArray, normalsArray, uvArray);
  // Create a vertex Buffer in GPU to store the data;
  vBuffer_cube = gl.createBuffer(); 
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_cube);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  // Create a normal Buffer in GPU to store the data;
  nBuffer_cube = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer_cube);   
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
  // Create a uv Buffer in GPU to store the data;
  uvBuffer_cube = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer_cube);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(uvArray), gl.STATIC_DRAW);
}

// Create Sphere Buffer;
var vBuffer_sphere;
var nBuffer_sphere;
var uvBuffer_sphere;
var complexity = 4;
var numPoints_sphere;
function createSphereBuffer()
{
  pointsArray = [];
  normalsArray = [];
  uvArray = [];
  // Build up a sphere model;
  numPoints = 0;
  sphere(complexity, pointsArray, normalsArray, uvArray);
  numPoints_sphere = numPoints;
  // Create a vertex Buffer in GPU to store the data;
  vBuffer_sphere = gl.createBuffer(); 
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_sphere);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  // Create a normal Buffer in GPU to store the data;
  nBuffer_sphere = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer_sphere);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
  // Create a uv Buffer in GPU to store the data;
  uvBuffer_sphere = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer_sphere);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(uvArray), gl.STATIC_DRAW);
}

// Create Sphere2 Buffer;
var vBuffer_sphere2;
var nBuffer_sphere2;
var nBufferInv_sphere2;
var uvBuffer_sphere2;
var iBuffer_sphere2;
var latitudeBands = 30;
var longitudeBands = 30;
var numPoints_sphere2;
var normalsInvArray = [];
function createSphere2Buffer()
{
  pointsArray = [];
  normalsArray = [];
  normalsInvArray = [];
  indicesArray = [];
  uvArray = [];

  // Build up a sphere model;
  numPoints_sphere2 = 6*latitudeBands*longitudeBands;
  sphere2(latitudeBands, longitudeBands, pointsArray, normalsArray, normalsInvArray, uvArray, indicesArray);
  // Create a vertex Buffer in GPU to store the data;
  vBuffer_sphere2 = gl.createBuffer(); 
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_sphere2);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
  // Create a normal Buffer in GPU to store the data;
  nBuffer_sphere2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer_sphere2);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
  // Create an inverse normal Buffer in GPU for environment's texture mapping;
  nBufferInv_sphere2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBufferInv_sphere2);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsInvArray), gl.STATIC_DRAW);
  // Create a index Buffer in GPU to store the data;
  iBuffer_sphere2 = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer_sphere2);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesArray), gl.STATIC_DRAW );
  // Create a uv Buffer in GPU to store the data;
  uvBuffer_sphere2 = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer_sphere2);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(uvArray), gl.STATIC_DRAW);
}

function createGeoBuffer()
{
  createSquareBuffer();
  createCubeBuffer();
  createSphereBuffer();
  createSphere2Buffer();
}
