const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hitSound = document.getElementById("hit");
const powerSound = document.getElementById("powerup");

const cx = 250, cy = 250, R = 200;

let score = 0;
let level = 1;
let hits = 0;
let maxHits = 5;

let balls = [];
let obstacles = [];
let powerUps = [];

let tiltX = 0, tiltY = 0;
let speedCap = 5;
let speedBoostRate = 1.01;
let tiltFactor = 1;
let powerActive = false;
let powerTimer = 0;

window.addEventListener("deviceorientation", (e)=>{
  tiltX = e.gamma / 45 * tiltFactor;  
  tiltY = e.beta / 45 * tiltFactor;   
});

// Settings UI
function toggleSettings(){document.getElementById("settings").style.display="block";}
function closeSettings(){document.getElementById("settings").style.display="none";}

document.getElementById("maxHitsInput").addEventListener("change", e=> maxHits=parseInt(e.target.value));
document.getElementById("speedBoostSlider").addEventListener("input", e=> speedBoostRate=1+parseFloat(e.target.value)/100);
document.getElementById("tiltSlider").addEventListener("input", e=> tiltFactor=parseFloat(e.target.value));
document.getElementById("speedCapInput").addEventListener("change", e=> speedCap=parseFloat(e.target.value));

function spawnLevel(){
  balls=[{x:cx,y:cy,r:8,vx:(Math.random()*4+1)*(Math.random()<0.5?-1:1),vy:(Math.random()*4+1)*(Math.random()<0.5?-1:1)}];
  obstacles=[];
  for(let i=0;i<level;i++){
    obstacles.push({x:cx+Math.cos(i*2*Math.PI/level)*80, y:cy+Math.sin(i*2*Math.PI/level)*80, r:12+level*1.5});
  }
  powerUps=[];
  for(let i=0;i<Math.min(2,level);i++){
    powerUps.push({x:cx+Math.random()*150-75, y:cy+Math.random()*150-75, r:10});
  }
}

spawnLevel();

function updateBallWithTilt(b){
  b.vx += tiltX * 0.2;
  b.vy += tiltY * 0.2;
  let speed = Math.hypot(b.vx,b.vy);
  if(speed > speedCap){b.vx = b.vx/speed*speedCap; b.vy=b.vy/speed*speedCap;}
  b.x += b.vx;
  b.y += b.vy;
}

function bounce(b){
  let dx=b.x-cx, dy=b.y-cy, dist=Math.hypot(dx,dy);
  if(dist+b.r>=R){
    let nx=dx/dist, ny=dy/dist;
    let overlap=(dist+b.r)-R;
    b.x -= nx*overlap; b.y -= ny*overlap;
    let dot=b.vx*nx+b.vy*ny;
    b.vx=b.vx-2*dot*nx; b.vy=b.vy-2*dot*ny;
    let angle=Math.atan2(b.vy,b.vx), speed=Math.hypot(b.vx,b.vy);
    angle += (Math.random()-0.5)*0.6;
    b.vx=Math.cos(angle)*speed; b.vy=Math.sin(angle)*speed;
    b.vx *= speedBoostRate; b.vy *= speedBoostRate;
    score++;
    hitSound.currentTime=0; hitSound.play();
  }
}

function obstacleHit(b,o){
  let dx=b.x-o.x, dy=b.y-o.y, d=Math.hypot(dx,dy);
  if(d<b.r+o.r){
    hits++;
    if(hits>=maxHits){alert("GAME OVER\nScore:"+score); hits=0; score=0; level=1;} 
    else{level++;}
    spawnLevel();
  }
}

function checkPowerUps(b){
  for(let i=powerUps.length-1;i>=0;i--){
    let p=powerUps[i];
    if(Math.hypot(b.x-p.x,b.y-p.y)<b.r+p.r){
      powerActive=true; powerTimer=200; score+=1; powerSound.play();
      powerUps.splice(i,1);
    }
  }
}

function drawUI(){
  ctx.fillStyle="#0f0"; ctx.font="14px monospace";
  ctx.fillText("Score:"+score,20,20);
  ctx.fillText("Level:"+level,20,40);
  ctx.fillText("Hits:"+hits+"/"+maxHits,20,60);
  if(powerActive) ctx.fillText("Power-Up Active!",20,80);
}

function gameLoop(){
  ctx.clearRect(0,0,500,500);
  ctx.strokeStyle="#0f0"; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();

  obstacles.forEach(o=>{ctx.fillStyle="#ff0"; ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();});
  powerUps.forEach(p=>{ctx.fillStyle="#0ff"; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();});

  balls.forEach(b=>{
    updateBallWithTilt(b);
    if(powerActive){b.vx*=0.995; b.vy*=0.995; powerTimer--; if(powerTimer<=0) powerActive=false;}
    bounce(b);
    obstacles.forEach(o=>obstacleHit(b,o));
    checkPowerUps(b);
    ctx.fillStyle="#f00"; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
  });

  drawUI();
  requestAnimationFrame(gameLoop);
}

gameLoop();
