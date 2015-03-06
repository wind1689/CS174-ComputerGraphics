/*****************************************/
/*** Create and Update Bounding Volume ***/
/*****************************************/
function BoundingCube()  // AABB form;
{
  // All lines along the axis;
  this.min = vec4( -length, 0, -length, 1.0);
  this.max = vec4(  length, 2*length,  length, 1.0);
}

function updateBoundCube(boundC, mMatrix)
{
  // Initialize the bounding volume first;
  boundC.min = vec4( -length, 0, -length, 1.0);
  boundC.max = vec4(  length, 2*length,  length, 1.0);

  boundC.min = multMatVec(mMatrix, boundC.min);
  boundC.max = multMatVec(mMatrix, boundC.max);
}

function BoundingSphere(newRadius)
{
  this.center = vec4();
  this.radius = newRadius;
}

function updateBoundShere(boundS, mMatrix)
{
  // Initialize the bounding volume first;
  boundS.center = vec4();
 
  var newCenter = multMatVec(mMatrix, boundS.center);
  boundS.center = newCenter;
}

function BoundingPlane()
{
  this.normal = vec4(0.0, 1.0, 0.0, 0.0);
  this.vectX = vec4(1.0, 0.0, 0.0, 0.0);
  this.vectZ = vec4(0.0, 0.0, 1.0, 0.0);
  this.min = vec4(-0.5, 0.0, -0.5, 1.0);
  this.max = vec4(0.5, 0.0, 0.5, 1.0);
}

function updateBoundPlane(boundP, mMatrix)
{
  // Initialize the bounding volume first;
  boundP.normal = vec4(0.0, 1.0, 0.0, 0.0);
  boundP.vectX = vec4(1.0, 0.0, 0.0, 0.0);
  boundP.vectZ = vec4(0.0, 0.0, 1.0, 0.0);
  boundP.min = vec4(-0.5, 0.0, -0.5, 1.0);
  boundP.max = vec4(0.5, 0.0, 0.5, 1.0);

  boundP.normal = normalize(multMatVec(mMatrix, boundP.normal));
  boundP.vectX = normalize(multMatVec(mMatrix, boundP.vectX));
  boundP.vectZ = normalize(multMatVec(mMatrix, boundP.vectZ));
  boundP.min = multMatVec(mMatrix, boundP.min);
  boundP.max = multMatVec(mMatrix, boundP.max);
}

/****************************************/
/********** Collision Detection *********/
/****************************************/

// These functions will return you null if no collision;
// If there is a collision, they will return the vector pointed
// from the center of sphere to the collision point;

function sphereSphereCollision(boundS1, boundS2)
{
  // frameString += "SphereCollision";
  u = subtract(boundS2.center, boundS1.center);
  // var dist2 = dot(u, u);
  var dist2 = u[0]*u[0] + u[1]*u[1] + u[2]*u[2];
  var radiusSum = boundS1.radius + boundS2.radius;
  if (dist2 <= radiusSum*radiusSum)
  {
    frameString += "SphereCollision";
    return normalize(u);
    // return vec4(0.0, 0.0, -1.0, 0.0);
  }
  else
    return null;
}

function spherePlaneCollision(boundS, boundP)
{   //frameString += "SpherePlaneCollision";
  c = boundS.center;
  var u = subtract(boundS.center, boundP.max);
  var v = subtract(boundS.center, boundP.min);
  var r = boundS.radius;
  var distP = dot(u, boundP.normal);    // Distance to plane;
  var distF = dot(u, boundP.vectZ);     // Distance to front line;
  var distB = dot(v, boundP.vectZ);     // Distance to back line;
  var distR = dot(u, boundP.vectX);     // Distance to right line;
  var distL = dot(v, boundP.vectX);     // Distance to left line;
  var value1 = 0;
  var value2 = 0;
  var value3 = 0;
  var vertor1 = vec4();
  var vector2 = vec4();
  var vector3 = vec4();
  var normal = vec4();

  if (distF > r || distB < -r || distR > r || distL < -r || distP > r || distP < -r)
  // if (distP > r)
  { 
    // frameString += distP;
    // frameString += "AAA";
    // if (distP > r)
    //   frameString += "1111";
    return null;
  }
  else
  {
    value1 = (distF > 0) ? distF : (distB >= 0) ? 0 : distB;
    value2 = (distR > 0) ? distR : (distL >= 0) ? 0 : distL;
    value3 = distP;
    if (value1*value1 + value2*value2 + value3*value3 > r*r)
      return null;

    // Return the normal vector pointed from center to collision point;
    vector1 = mult(boundP.vectZ, vec4(value1, value1, value1, 0));
    vector2 = mult(boundP.vectX, vec4(value2, value2, value2, 0));
    vector3 = mult(boundP.normal, vec4(value3, value3, value3, 0));
    normal = add(vector1, add(vector2, vector3));

    if (value1 == 0 && value2 == 0)
      return negate(boundP.normal);
    else
      return negate(multScalVec(1/boundS.radius, normal));
  }
}

function sphereCubeCollision(boundS, boundC)
{
  var u = subtract(boundS.center, boundC.max);
  var v = subtract(boundS.center, boundC.min);
  var r = boundS.radius * 1.0;
  var distF = dot(u, vec4(0, 0, 1, 0));  // Distance to cube's front face;
  var distB = dot(v, vec4(0, 0, 1, 0));  // Distance to cube's back face;
  var distR = dot(u, vec4(1, 0, 0, 0));  // Distance to cube's right face;
  var distL = dot(v, vec4(1, 0, 0, 0));  // Distance to cube's left face;
  var distU = dot(u, vec4(0, 1, 0, 0));  // Distance to cube's up face;
  var distD = dot(v, vec4(0, 1, 0, 0));  // Distance to cube's down face;
  var normal = vec4();
  var value1 = 0;
  var value2 = 0;
  var value3 = 0;

  if (distF > r || distB < -r || distR > r || distL < -r || distU > r || distD < -r)
    return null;
  else
  {
    value1 = (distF > 0) ? distF : (distB >= 0) ? 0 : distB;
    value2 = (distR > 0) ? distR : (distL >= 0) ? 0 : distL;
    value3 = (distU > 0) ? distU : (distD >= 0) ? 0 : distD;
    if (value1*value1 + value2*value2 + value3*value3 > r*r)
      return null;

    // Return the normal vector pointed from center to collision point;
    normal = vec4(value2, value3, value1, 0.0);
    if (value1 == 0 && value2 == 0 && value3 > 0)
      return vec4(0.0, -1.0, 0.0, 0.0);  // For up face;
    else if (value1 == 0 && value2 == 0 && value3 < 0)
      return vec4(0.0, 1.0, 0.0, 0.0);   // For down face;
    else if (value1 > 0 && value2 == 0 && value3 == 0)
      return vec4(0.0, 0.0, -1.0, 0.0);  // For front face;
    else if (value1 < 0 && value2 == 0 && value3 == 0)
      return vec4(0.0, 0.0, 1.0, 0.0);   // For back face;
    else if (value1 == 0 && value2 > 0 && value3 == 0)
      return vec4(-1.0, 0.0, 0.0, 0.0);   // For right face;
    else if (value1 == 0 && value2 < 0 && value3 == 0)
      return vec4(1.0, 0.0, 0.0, 0.0);   // For left face;
    else
      // return negate(normalize(normal));
      return negate(multScalVec(1/boundS.radius, normal));
  }
}

function collisionDetection()
{
  for (var i = 0; i < numNodes; i++)
  {
    if (figure[i].object.collideAffected && (figure[i].object.type == sphereType || figure[i].object.type == sphereType2))
    {
      var firstCollide = true;
      for (var j = i + 1; j < numNodes; j++)
      {
        if (figure[j].object.isBound)
        {
          if (firstCollide)
            figure[i].object.rotateAxis = vec3(0, 0, 0);
          if (collideObjs(figure[i].object, figure[j].object))
            firstCollide = false;
        }
      }
    }
  }
}
var inicount=0;
function collideObjs(object1, object2)
{
  inicount++;
  var normal = null;
  switch(object2.type)
  {
    case sphereType:
    case sphereType2:
        normal = sphereSphereCollision(object1.boundVolume, object2.boundVolume);
        break;
    case cubeType:
        normal = sphereCubeCollision(object1.boundVolume, object2.boundVolume);
        break;
    case squareType:
        normal = spherePlaneCollision(object1.boundVolume, object2.boundVolume);
        break;
    default:
        break;
  }

  // If there is a collision;
  if (normal != null)
  {
    collisionHappen(object1, object2, normal);
        //sound
    if(object2.type==3 && inicount>500){
    // /collidesound.play();
      metalsound.volume=0.1;
      metalsound.play();

    }
    if(object2.type==1 && inicount>500){
      collidesound.volume=0.5;
      collidesound.play();

    }


    return 1;
  }
  return 0;
}
 

var floatflag = 0;
var delay=0;
var begindelay=0;
function collisionDetectionHL()
{
  if(begindelay)
  delay++;

  if (collideObjs(obj1, obj11) && obj11.isBound == true)
 { begindelay=1;

}
  if(delay==10){
  myWorld.addObject(obj10);
  obj11.isBound = false;
  delay=0;
  begindelay=0;
  }

  if (collideObjs(myBall, obj12) && obj12.isBound == true)        
  {
    obj12.addTexture(myTextureWIN);
    myWorld.addObject(obj13);
    obj12.isBound = false;
    finalsound.volume=0.3;
    finalsound.play();
    myBall.velocity=vec4(0,0,0,0);
    myBall.collideAffected=false;
  }

  if (collideObjs(myBall, obj18))       
   {
    myBall.addTexture(myTexture4);
       myBall.mass = 3;
    // myBall.addSizeMatrix(scale(vec3(1, 1, 1)));
    obj22.collideAffected = true ;
  
   }

  if (collideObjs(myBall, obj19))       
   {
    myBall.addTexture(myTexture9);
    // myBall.addSizeMatrix(scale(vec3(1.5, 1.5, 1.5)));
    myBall.mass = 2;

  
   }


  //obj17  is trigger for lighter ball, to float in 0 gravity zone
   if (collideObjs(myBall, obj17))       
   {
    myBall.addTexture(myTexture9);
    // myBall.addSizeMatrix(scale(vec3(1.3, 1.3, 1.3)));
    myBall.mass = 2;
   }

//obj15 and obj15top is upper/bottom egde of 0-gravity zone
    if (collideObjs(myBall, obj15)&&myBall.mass<3)       
     {floatflag=1; }
    if (collideObjs(myBall, obj15top))       
     {  floatflag=0;
        myBall.addForce(multScalVec(1, vec4(0,floatforce,0,0)));
      }

//obj16 and obj16top is upper/bottom egde of 0-gravity zone
    if (collideObjs(myBall, obj16)&&myBall.mass<3)       
     {floatflag=1; }
    if (collideObjs(myBall, obj16top))       
     {  floatflag=0;
        myBall.addForce(multScalVec(1, vec4(0,4*floatforce,0,0)));
      }

  //when myball into 0-gravity zone, add float force to the ball
    floatforce = (30>myBall.mass*9.8)?30-myBall.mass*9.8:0;
    if(floatflag)
    { 
      myBall.addForce(multScalVec(1, vec4(0,4*floatforce,0,0)));
      myBall.addForce(multScalVec(-forceTestMag, forceTestrotate));
      myBall.addForce(multScalVec(-forceTestMag, forceLMrotate));
      deg+=800*dTime;
    }


}

/****************************************/
/********** Collision Reaction **********/
/****************************************/
function collisionHappen(obj1, obj2, normal)
{
  n = normal;
  frameString += " Collision!!";
  var velocityNT = 0.1;
  var velocityPT = 0.00001;
  var reboundCoef = 0.5;
  var frictionCoef = 0.05;

  var forceNMag;
  var forceN;
  var velocityNMag;
  var velocityN;
  var velocityP;
  var velocityPMag2;
  var frictionMag;
  var friction;

  // The portion of force along the normal vector; 
  forceNMag = dot(obj1.force, normal);
  forceN = multScalVec(forceNMag, normal);

  // The portion of velocity along the normal vector;
  velocityNMag = dot(subtract(obj1.velocity, obj2.velocity), normal);
  velocityN = multScalVec(velocityNMag, normal );
  velocityP = subtract(obj1.velocity, velocityN);
  velocityPMag2 = velocityP[0]*velocityP[0]+velocityP[1]*velocityP[1]+velocityP[2]*velocityP[2];

  // Modify the velocity of the obj1;
  if (!obj2.collideAffected)
  {
    if (velocityNMag > velocityNT)
      obj1.addVelocity(negate(multScalVec(reboundCoef+1, velocityN)));
    else if (velocityNMag >= -velocityNT)
      obj1.addVelocity(negate(velocityN));
  }
  else if (velocityNMag > velocityNT)
  {
    var v1NMag = dot(obj1.velocity, normal);
    var v1N = multScalVec(v1NMag, normal);
    var v1P = subtract(obj1.velocity, v1N);
    var v2NMag = dot(obj2.velocity, normal);
    var v2N = multScalVec(v2NMag, normal);
    var v2P = subtract(obj2.velocity, v2N);
    var coef1_1 = (obj1.mass - obj2.mass)/(obj1.mass + obj2.mass);
    var coef1_2 = 2*obj2.mass/(obj1.mass + obj2.mass);
    var coef2_1 = -coef1_1;
    var coef2_2 = 2*obj1.mass/(obj1.mass + obj2.mass);
    var v1 = v1N;
    var v2 = v2N;
    v1N = add(multScalVec(coef1_1, v1), multScalVec(coef1_2, v2));
    v2N = add(multScalVec(coef2_1, v2), multScalVec(coef2_2, v1));
    obj1.velocity = add(v1N, v1P);
    obj2.velocity = add(v2N, v2P);
  }

  // Modify the bracing force of the obj1;
  if (forceNMag > 0 && velocityNMag <= velocityNT && velocityNMag >= -velocityNT)
    obj1.addForce(negate(forceN));

  // Modify the friction of the obj1;
  if (velocityPMag2 > velocityPT)
  {
    frameString += "Friction1";
    frictionMag = forceNMag * frictionCoef;
    friction = negate(multScalVec(frictionMag, normalize(velocityP)));
    obj1.addForce(friction);
  }
  else if (velocityPMag2 >= 0)
  {
    frameString += "Friction2";
    friction = negate(velocityP);
    obj1.addVelocity(friction);
  }

  // Modify the obj1.rotationAxisN;
  // frameString += "WWWWWWW";
  // obj1.rotateAxisN = vec3(normal[0], normal[1], normal[2]);
  if (!isNaN(normal[0]))
    obj1.rotateAxisN = normalize(add(obj1.rotateAxisN, vec3(normal)));
}



/****************************************/
/********** Physical Performance ********/
/****************************************/
function physicalMovement(dt)
{
  for (var i = 0; i < numNodes; i++)
  {
    if (figure[i].object.collideAffected)
      objMoving(figure[i].object, dt);
  }
}

function objMoving(obj, dt)
{
    // Update accelaration
    acceleration = multScalVec(1/obj.mass, obj.force);

    // Update velocity;
    v0 = obj.velocity;
    obj.velocity = add(obj.velocity, multScalVec(dt, acceleration));
    // Set the velocity limit;
    var velocityMag = length1(obj.velocity);
    if (velocityMag > obj.vMagMax)
      obj.velocity = multScalVec(obj.vMagMax/velocityMag, obj.velocity);
    
    // Update position;
    dPosition = add(mult(v0, vec4(dt, dt, dt, 0.0))
            ,mult(acceleration, vec4(0.5*dt*dt, 0.5*dt*dt, 0.5*dt*dt, 0.0)));
    obj.position = add(obj.position, dPosition);

    // Ball will self-rotate;
    if (obj.type == sphereType || obj.type == sphereType2)
    {
      // Modify the rotation axis;
      var u = vec3(dPosition[0], dPosition[1], dPosition[2]);
      var v = obj.rotateAxisN;
      axis = cross(u, v);
      if (axis[0] || axis[1] || axis[2])
        obj.rotateAxis = normalize(axis);

      // Increase the rotation angle;
      rotateIncrement = 360 * length1(dPosition) / (2 * Math.PI * obj.boundVolume.radius);
      if (obj.velocity[0] != 0 || obj.velocity[2] != 0)
        obj.rotationMatrix = mult(rotate(rotateIncrement, obj.rotateAxis), obj.rotationMatrix);
    }
}