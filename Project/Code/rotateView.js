var oldposition=vec4(0,0,0,0);
var	rrr=0;
var	start=0;
var sign=0;
var turnright=0;
var firsttime=0;
var count=1000000;
var forceTestrotate=vec4();
var forceLMrotate=vec4();
function rotateView(corner){

  if (isRestart || myBall.position[1] < -10){
  oldposition=vec4(0,0,0,0);
  rrr=0;
  start=0;
  sign=0;
  turnright=0;
  firsttime=0;
  count=1000000;
    eye =  vec3(0, 8*Math.tan(radians(30)), 8);
	 at = vec3(0.0, 0.0, -40.0);
    }

	mindis=100000000;

	for (i=start;i<corner.length;i++){
		dis = distance(oldposition,corner[i]);
		if (dis[0]<mindis){
			mindis=dis[0];
			flag=vec2(dis[1],dis[2]);
			nearestCorner=corner[i];
		}
	}

	if(!flag[0] && flag[1] && nearestCorner[3])
		{comp=myBall.position[2]<=nearestCorner[2];turnright=-1;}
	if(!flag[0] && flag[1] && !nearestCorner[3])
		{comp=myBall.position[0]>=nearestCorner[0];turnright=1;}

	if(!flag[0] && !flag[1] && !nearestCorner[3])
		{comp=myBall.position[0]>=nearestCorner[0];turnright=-1;}
	if(!flag[0] && !flag[1] && nearestCorner[3])
		{comp=myBall.position[2]>=nearestCorner[2];turnright=1;}

	if(flag[0] && !flag[1] && nearestCorner[3])
		{comp=myBall.position[2]>=nearestCorner[2];turnright=-1;}
	if(flag[0] && !flag[1] && !nearestCorner[3])
		{comp=myBall.position[0]<=nearestCorner[0];turnright=1;}
	
	if(flag[0] && flag[1] && !nearestCorner[3])
		{comp=myBall.position[0]<=nearestCorner[0];turnright=-1;}
	if(flag[0] && flag[1] && nearestCorner[3])
		{comp=myBall.position[2]<=nearestCorner[2];turnright=1;}

	  if (comp && mindis<200){
    	firsttime++;
    	if(firsttime==1) {
    		count=0;
    		firsttime=0;
			start++;
			sign=turnright;
		}

    }
    
    	if(count<45){
    	eye=vec3(multMatVec(rotate(sign*2,vec3(0,1,0)),vec4(eye,1)));

    	
    	at=vec3(multMatVec(rotate(sign*2,vec3(0,1,0)),vec4(at,1)));

		count++;
		rrr=rrr+sign*2; 
		}

		
		
		
	mindis=100000000;
	oldposition=myBall.position;
	forceTestrotate = (multMatVec(rotate(rrr,vec3(0,1,0)),(forceTest)));
	forceLMrotate = (multMatVec(rotate(rrr,vec3(0,1,0)),(forceLM)));

}
function distance(a,b){
	var dis=(a[0]-b[0])*(a[0]-b[0])+(a[2]-b[2])*(a[2]-b[2])+(a[2]-b[2])*(a[2]-b[2]);
	flag1= vec2(a[0]>b[0],a[2]>b[2]);
	return vec3(dis,flag1);
}