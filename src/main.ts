import "./style.css";

type Scene = "title" | "intro" | "world" | "battle";
type Choice = "quiet" | "answer";
let choice:Choice="quiet";
let dialogueIndex=0;
let hp=24;
let raf=0;

const app=document.querySelector<HTMLDivElement>("#app");
if(!app) throw new Error("app");

app.innerHTML=`
<div class="game">
  <div class="fx-noise"></div>
  <section id="title" class="scene title">
    <div class="title-sky"></div><div class="title-moon"></div>
    <div class="title-cloud cloud-a"></div><div class="title-cloud cloud-b"></div>
    <div class="title-city far"></div><div class="title-city mid"></div><div class="title-city near"></div>
    <div class="title-stars"></div><div class="title-rain"></div>
    <div class="title-copy">
      <div class="micro">AN ORIGINAL STORY / 01:17 AM</div>
      <h1>AFTERNOVA</h1><div class="sigil">✦</div>
      <p>THE WORLD IS QUIET AFTER THE LIGHT</p>
      <button id="start">BEGIN</button><small>© AFTERNOVA PROJECT</small>
    </div>
  </section>

  <section id="intro" class="scene hidden">
    <div class="intro-card">
      <div class="chapter">CHAPTER 01</div><div class="intro-line"></div>
      <h2>THE MORNING<br><i>THAT NEVER CAME</i></h2>
      <p>ある朝、世界から「音」がひとつ消えた。</p>
      <button id="intro-next">目を覚ます</button>
    </div>
  </section>

  <section id="world" class="scene hidden">
    <canvas id="game-canvas" class="game-canvas" width="1600" height="900"></canvas>
    <div class="world-hud"><span>AFTERNOVA</span><span id="time">06:42</span></div>
    <div class="world-caption"><b>自室</b><span>川越 / 06:42</span></div>
    <div class="hint">WASD / 矢印キー　・　調べる</div>
    <div id="dialogue" class="dialogue hidden">
      <div class="speaker" id="speaker">—</div><div class="dialogue-text" id="dialogue-text"></div>
      <button id="dialogue-next">▶</button>
    </div>
    <div class="touch-zone" id="touch-zone"></div>
  </section>

  <section id="battle" class="scene hidden">
    <div class="battle-bg"><div class="stars"></div><div class="battle-vignette"></div><div class="horizon"></div><div class="battle-floor"></div></div>
    <div class="battle-top"><span>UNKNOWN / 01</span><span>THREAT LEVEL : ?</span></div>
    <div class="enemy"><div class="enemy-glow"></div><div class="enemy-ring"></div><div class="enemy-shape"><i></i><b></b><em></em></div><div class="enemy-name">THE LISTENER</div></div>
    <div class="battle-box"><div class="battle-status"><span>YOU</span><strong id="hp">24 / 24</strong></div><div class="heart" id="heart">◆</div><div class="battle-message" id="battle-message">それは、こちらを見ている。</div></div>
    <div class="commands">
      <button data-cmd="fight"><b>FIGHT</b><small>攻撃</small></button><button data-cmd="talk"><b>TALK</b><small>話す</small></button>
      <button data-cmd="item"><b>ITEM</b><small>持ち物</small></button><button data-cmd="mercy"><b>MERCY</b><small>逃がす</small></button>
    </div>
  </section>
</div>`;

const $=<T extends HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const screens={title:$("#title"),intro:$("#intro"),world:$("#world"),battle:$("#battle")};
const dialogue=$("#dialogue"),speaker=$("#speaker"),dialogueText=$("#dialogue-text");
const canvas=$("#game-canvas") as HTMLCanvasElement;
const ctx=canvas.getContext("2d")!;
let scene:Scene="title";
let playerX=800,playerY=600;
let moving=false,walkTime=0;
let lastMoveTime=performance.now();
let dialogueTimer:number|undefined;

function resizeCanvas(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const rect=canvas.getBoundingClientRect();
  const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
}
window.addEventListener("resize",resizeCanvas);

function go(id:"intro"|"world"|"battle"){
  Object.values(screens).forEach(x=>x.classList.add("hidden"));
  screens[id].classList.remove("hidden"); scene=id;
  if(id==="world"){playerX=800;playerY=620;resizeCanvas();}
}
function start(){
  go("intro");
  const intro=$("#intro"); intro.classList.remove("arrive");
  requestAnimationFrame(()=>intro.classList.add("arrive"));
}
$("#start").onclick=start;
$("#intro-next").onclick=()=>{
  go("world");
  setTimeout(()=>show("—","目が覚めた。\\n……何かがおかしい。",()=>show("—","静かすぎる。窓の外から、何も聞こえない。")),350);
};

function show(name:string,text:string,next?:()=>void){
  if(dialogueTimer) clearInterval(dialogueTimer);
  dialogue.classList.remove("hidden"); speaker.textContent=name; dialogueText.textContent="";
  dialogue.dataset.ready="0"; dialogue.dataset.next=next?"1":"0";
  let i=0;
  dialogueTimer=window.setInterval(()=>{
    dialogueText.textContent=text.slice(0,++i);
    if(i>=text.length){clearInterval(dialogueTimer);dialogue.dataset.ready="1";}
  },18);
  $("#dialogue-next").onclick=()=>{
    if(dialogue.dataset.ready!=="1"){if(dialogueTimer)clearInterval(dialogueTimer);dialogueText.textContent=text;dialogue.dataset.ready="1";return;}
    if(dialogue.dataset.next==="1")next?.(); else dialogue.classList.add("hidden");
  };
}

function clamp(v:number,a:number,b:number){return Math.max(a,Math.min(b,v));}
function rounded(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();
}
function poly(c:CanvasRenderingContext2D,p:number[]){c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();}
function roomScale(){
  const sx=canvas.width/1600,sy=canvas.height/900;
  return {sx,sy};
}
function drawRoom(t:number){
  resizeCanvas();
  const {sx,sy}=roomScale(); ctx.setTransform(sx,0,0,sy,0,0);
  const W=1600,H=900;
  ctx.clearRect(0,0,W,H);

  const wall=ctx.createLinearGradient(0,0,0,510); wall.addColorStop(0,"#77727d");wall.addColorStop(.72,"#8a8088");wall.addColorStop(1,"#554f58");
  ctx.fillStyle=wall;ctx.fillRect(0,0,W,510);
  ctx.fillStyle="#302d34";ctx.fillRect(0,510,W,390);
  const warm=ctx.createRadialGradient(1080,180,20,1080,180,700);warm.addColorStop(0,"rgba(255,221,186,.18)");warm.addColorStop(1,"rgba(255,221,186,0)");ctx.fillStyle=warm;ctx.fillRect(0,0,W,900);
  ctx.fillStyle="rgba(255,255,255,.12)";ctx.fillRect(0,507,W,3);

  // window
  const wx=1110,wy=92,ww=390,wh=360;
  ctx.fillStyle="#26252d";ctx.shadowColor="rgba(0,0,0,.5)";ctx.shadowBlur=35;ctx.fillRect(wx-10,wy-10,ww+20,wh+20);ctx.shadowBlur=0;
  const sky=ctx.createLinearGradient(0,wy,0,wy+wh);sky.addColorStop(0,"#657b9c");sky.addColorStop(.68,"#bfa5a7");sky.addColorStop(1,"#706c79");ctx.fillStyle=sky;ctx.fillRect(wx,wy,ww,wh);
  ctx.fillStyle="#2a2b35";
  const buildings=[[0,245,60,115],[68,190,78,170],[158,250,55,110],[220,165,85,195],[318,225,72,135],[395,178,55,182]];
  buildings.forEach(([x,y,w,h],i)=>{ctx.fillRect(wx+x,wy+y,w,h);ctx.fillStyle=i%2?"#333540":"#252731";});
  ctx.fillStyle="#282730";ctx.fillRect(wx+ww/2-2,wy,4,wh);ctx.fillRect(wx,wy+205,ww,4);
  ctx.fillStyle="rgba(255,255,255,.12)";poly(ctx,[wx+20,wy,wx+130,wy,wx+50,wy+wh,wx-5,wy+wh]);ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,.18)";ctx.lineWidth=2;ctx.strokeRect(wx,wy,ww,wh);

  // wall art
  ctx.fillStyle="#3b373e";ctx.fillRect(760,145,190,170);ctx.save();ctx.translate(855,230);ctx.rotate(-.035);
  const art=ctx.createLinearGradient(-85,-75,85,75);art.addColorStop(0,"#c5b29f");art.addColorStop(.55,"#74778a");art.addColorStop(1,"#303441");ctx.fillStyle=art;ctx.fillRect(-82,-72,164,144);
  ctx.strokeStyle="#211f25";ctx.lineWidth=8;ctx.strokeRect(-82,-72,164,144);ctx.restore();

  // ceiling light
  ctx.fillStyle="rgba(255,228,188,.28)";ctx.beginPath();ctx.ellipse(900,70,90,25,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#e7d4b6";ctx.beginPath();ctx.ellipse(900,66,62,12,0,0,Math.PI*2);ctx.fill();

  // lamp
  ctx.fillStyle="#332d30";ctx.fillRect(360,90,6,230);
  poly(ctx,[330,320,396,320,382,270,344,270]);ctx.fillStyle="#ad8d78";ctx.fill();
  const lampGlow=ctx.createRadialGradient(363,320,5,363,320,170);lampGlow.addColorStop(0,"rgba(255,210,160,.24)");lampGlow.addColorStop(1,"rgba(255,210,160,0)");ctx.fillStyle=lampGlow;ctx.fillRect(180,180,370,300);

  // desk
  const dx=170,dy=570,dw=450;
  ctx.fillStyle="#3a2f31";ctx.fillRect(dx+35,dy+80,25,245);ctx.fillRect(dx+dw-60,dy+80,25,245);
  ctx.fillStyle="#4b3a38";ctx.fillRect(dx+45,dy+95,dw-90,145);ctx.fillStyle="#624a42";ctx.fillRect(dx,dy,dw,42);ctx.fillStyle="#8a6858";ctx.fillRect(dx+8,dy+8,dw-16,12);
  ctx.fillStyle="#30272a";rounded(ctx,dx+65,dy+65,dw-130,115,6);ctx.fill();ctx.strokeStyle="#71564d";ctx.stroke();
  ctx.fillStyle="#a99a8c";ctx.fillRect(dx+105,dy+82,180,55);ctx.fillStyle="#25242a";ctx.fillRect(dx+325,dy+86,54,48);
  ctx.fillStyle="#d9c9b6";ctx.fillRect(dx+145,dy+78,100,64);ctx.strokeStyle="#80766e";ctx.strokeRect(dx+145,dy+78,100,64);
  ctx.fillStyle="#5a4a45";ctx.fillRect(dx+165,dy+94,55,3);ctx.fillRect(dx+165,dy+106,40,3);

  // bed
  const bx=1010,by=545,bw=500,bh=230;
  ctx.fillStyle="#403a42";rounded(ctx,bx,by,bw,65,10);ctx.fill();ctx.fillStyle="#615b65";ctx.fillRect(bx+10,by+10,bw-20,40);
  const blanket=ctx.createLinearGradient(bx,by+55,bx+bw,by+bh);blanket.addColorStop(0,"#e1d9de");blanket.addColorStop(.55,"#b5adb5");blanket.addColorStop(1,"#817a84");
  ctx.fillStyle=blanket;rounded(ctx,bx+8,by+50,bw-16,bh-50,9);ctx.fill();ctx.strokeStyle="#4b4650";ctx.lineWidth=6;ctx.stroke();
  ctx.fillStyle="#eee9e9";rounded(ctx,bx+38,by+73,145,70,12);ctx.fill();ctx.fillStyle="rgba(110,100,110,.18)";ctx.fillRect(bx+40,by+130,140,8);

  // floor boards / glow
  const fg=ctx.createRadialGradient(800,515,30,800,515,720);fg.addColorStop(0,"rgba(255,215,178,.13)");fg.addColorStop(1,"rgba(255,215,178,0)");ctx.fillStyle=fg;ctx.fillRect(0,510,W,390);
  ctx.strokeStyle="rgba(217,200,181,.09)";ctx.lineWidth=2;for(let x=0;x<W;x+=150){ctx.beginPath();ctx.moveTo(x,510);ctx.lineTo(x+70,900);ctx.stroke();}

  // paper interaction glow
  const pulse=.55+.45*Math.sin(t/700);ctx.fillStyle="rgba(255,236,190,"+(0.08*pulse)+")";ctx.beginPath();ctx.arc(dx+195,dy+110,38,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#d9c9b6";ctx.fillRect(dx+145,dy+78,100,64);ctx.strokeStyle="#80766e";ctx.strokeRect(dx+145,dy+78,100,64);

  drawHero(t,playerX,playerY);
  ctx.setTransform(1,0,0,1,0,0);
}
function drawHero(t:number,x:number,y:number){
  // Procedural sprite sheet: four facing directions, idle + two walk poses.
  // The sprite is drawn at a stable world scale so animation never changes collision size.
  const c=ctx;
  const dir=(window as any).__heroDir||"down";
  const walking=moving&&t-lastMoveTime<220;
  const phase=walking?Math.floor((walkTime%(Math.PI*2))/(Math.PI*2/4)):0;
  const bob=walking?[0,-1.5,0,1.5][phase]:Math.sin(t/900)*.7;
  const step=walking?Math.sin(walkTime)*7:0;
  const sway=walking?Math.sin(walkTime)*1.6:0;

  c.save();
  c.translate(x,y+bob);
  c.scale(1.0,1.0);

  // Ground shadow
  c.fillStyle="rgba(0,0,0,.38)";
  c.beginPath();c.ellipse(0,45,52,12,0,0,Math.PI*2);c.fill();

  // Back-facing hair silhouette
  if(dir==="up"){
    c.fillStyle="#12131b";
    rounded(c,-42,-170,84,92,28);c.fill();
    c.fillStyle="#252633";
    rounded(c,-33,-162,66,68,22);c.fill();
    drawBody(c,step,sway,true);
    c.fillStyle="#10121a";rounded(c,-25,-113,50,70,18);c.fill();
    drawBackHair(c);
    drawShoes(c,step);
    c.restore();return;
  }

  drawShoes(c,step);
  drawBody(c,step,sway,false);

  // arms
  c.save();
  c.translate(-42,-66);c.rotate(-.035+step*.008);
  const armL=c.createLinearGradient(0,0,0,58);armL.addColorStop(0,"#536682");armL.addColorStop(1,"#202a3d");
  c.fillStyle=armL;rounded(c,-8,0,16,58,8);c.fill();
  c.fillStyle="#e2c0b4";c.beginPath();c.arc(0,59,8,0,Math.PI*2);c.fill();c.restore();
  c.save();
  c.translate(42,-66);c.rotate(.035-step*.008);
  c.fillStyle="#3d4d68";rounded(c,-8,0,16,58,8);c.fill();
  c.fillStyle="#d8b7ad";c.beginPath();c.arc(0,59,8,0,Math.PI*2);c.fill();c.restore();

  // torso
  drawBody(c,step,sway,false);

  // head
  const skin=c.createRadialGradient(-12,-142,4,10,-119,52);
  skin.addColorStop(0,"#f4d9cc");skin.addColorStop(.72,"#d1aaa0");skin.addColorStop(1,"#a97d7d");
  c.fillStyle=skin;c.beginPath();c.ellipse(0,-128,41,47,0,0,Math.PI*2);c.fill();

  // neck
  c.fillStyle="#c2938c";rounded(c,-13,-94,26,18,7);c.fill();

  // hair mass
  c.fillStyle="#171821";
  c.beginPath();
  c.moveTo(-43,-132);c.quadraticCurveTo(-43,-179,-5,-184);
  c.quadraticCurveTo(35,-186,45,-143);
  c.quadraticCurveTo(42,-127,31,-115);
  c.quadraticCurveTo(25,-144,11,-151);
  c.quadraticCurveTo(-5,-136,-19,-133);
  c.quadraticCurveTo(-32,-128,-43,-132);c.fill();
  // individual fringe locks
  c.fillStyle="#282936";
  poly(c,[-41,-139,-22,-165,-11,-148,-19,-132]);c.fill();
  poly(c,[-21,-145,-5,-169,5,-151,-3,-130]);c.fill();
  poly(c,[0,-149,17,-168,25,-148,16,-128]);c.fill();
  poly(c,[18,-146,34,-163,43,-140,30,-119]);c.fill();

  // face
  c.fillStyle="#191923";
  if(dir==="left"){
    c.beginPath();c.ellipse(-13,-125,4,6,0,0,Math.PI*2);c.fill();
  }else if(dir==="right"){
    c.beginPath();c.ellipse(13,-125,4,6,0,0,Math.PI*2);c.fill();
  }else{
    c.beginPath();c.ellipse(-15,-124,4,6,0,0,Math.PI*2);c.ellipse(15,-124,4,6,0,0,Math.PI*2);c.fill();
  }
  c.fillStyle="rgba(255,255,255,.75)";
  if(dir==="left"){c.beginPath();c.arc(-14,-126,1.4,0,Math.PI*2);c.fill();}
  else if(dir==="right"){c.beginPath();c.arc(12,-126,1.4,0,Math.PI*2);c.fill();}
  else{c.beginPath();c.arc(-16,-126,1.4,0,Math.PI*2);c.arc(14,-126,1.4,0,Math.PI*2);c.fill();}
  c.strokeStyle="rgba(92,54,60,.65)";c.lineWidth=2;c.beginPath();c.arc(0,-111,9,.15,Math.PI-.15);c.stroke();

  // clothing highlights and collar
  c.fillStyle="#8a9ab1";poly(c,[-17,-90,0,-76,17,-90,11,-66,-11,-66]);c.fill();
  c.fillStyle="rgba(225,235,255,.2)";rounded(c,-30,-82,5,43,3);c.fill();

  if(dir==="left"||dir==="right"){
    c.globalAlpha=.16;c.fillStyle="#fff";c.fillRect(dir==="left"?-37:32,-80,4,45);c.globalAlpha=1;
  }
  c.restore();
}

function drawShoes(c:CanvasRenderingContext2D,step:number){
  c.save();
  c.translate(-18+step*.55,6);c.rotate(step*.008);
  c.fillStyle="#242a38";rounded(c,-12,0,24,65,8);c.fillStyle="#080b12";rounded(c,-16,56,30,13,6);c.fill();
  c.fillStyle="rgba(255,255,255,.14)";rounded(c,-9,7,15,3,2);c.fill();c.restore();
  c.save();
  c.translate(18-step*.55,6);c.rotate(-step*.008);
  c.fillStyle="#202633";rounded(c,-12,0,24,65,8);c.fillStyle="#080b12";rounded(c,-15,56,30,13,6);c.fill();
  c.fillStyle="rgba(255,255,255,.14)";rounded(c,-9,7,15,3,2);c.fill();c.restore();
}

function drawBody(c:CanvasRenderingContext2D,step:number,sway:number,back:boolean){
  c.save();c.translate(sway,0);
  const body=c.createLinearGradient(-42,-96,42,-10);
  body.addColorStop(0,"#657794");body.addColorStop(.45,"#3d4d69");body.addColorStop(1,"#151e30");
  c.fillStyle=body;rounded(c,-42,-96,84,92,17);c.fill();
  c.fillStyle="#27344b";rounded(c,-34,-84,68,15,7);c.fill();
  c.fillStyle="rgba(220,230,250,.18)";rounded(c,-28,-79,56,4,2);c.fill();
  c.fillStyle="#121927";rounded(c,-50,-82,16,62,8);c.fill();rounded(c,34,-82,16,62,8);c.fill();
  c.fillStyle="#aebbd0";poly(c,[-18,-91,0,-76,18,-91,10,-63,-10,-63]);c.fill();
  c.restore();
}
function drawBackHair(c:CanvasRenderingContext2D){
  c.fillStyle="#171821";c.beginPath();
  c.moveTo(-43,-143);c.quadraticCurveTo(-40,-184,0,-186);
  c.quadraticCurveTo(40,-184,43,-143);c.lineTo(32,-108);
  c.quadraticCurveTo(22,-125,12,-134);c.lineTo(0,-115);c.lineTo(-12,-134);
  c.quadraticCurveTo(-26,-122,-34,-108);c.closePath();c.fill();
}
function setHeroDir(dx:number,dy:number){
  if(Math.abs(dx)>Math.abs(dy)) (window as any).__heroDir=dx<0?"left":"right";
  else if(Math.abs(dy)>0) (window as any).__heroDir=dy<0?"up":"down";
}
function move(dx:number,dy:number){
  setHeroDir(dx,dy);
  if(scene!=="world"||!dialogue.classList.contains("hidden"))return;
  playerX=clamp(playerX+dx,70,1530);playerY=clamp(playerY+dy,400,800);
  moving=true;lastMoveTime=performance.now();walkTime+=Math.PI/2;lastMoveTime=performance.now();
  clearTimeout((move as any).timer);(move as any).timer=setTimeout(()=>moving=false,180);
}
function inspect(){
  if(scene!=="world")return;
  if(Math.hypot(playerX-365,playerY-690)<150)show("—","紙には、見覚えのない文字が一行だけ書かれている。\\n「きょうは、まだ来ていない。」");
  else if(Math.hypot(playerX-1260,playerY-650)<240)show("—","ベッドには、まだ温度が残っている。\\n誰かが先に起きたような気がした。");
  else show("—","……。");
}
window.addEventListener("keydown",e=>{
  if(scene==="title"&&e.key==="Enter")start();
  if(scene==="world"){
    const s=5.2;
    if(e.key==="w"||e.key==="W"||e.key==="ArrowUp")move(0,-s);
    if(e.key==="s"||e.key==="S"||e.key==="ArrowDown")move(0,s);
    if(e.key==="a"||e.key==="A"||e.key==="ArrowLeft")move(-s,0);
    if(e.key==="d"||e.key==="D"||e.key==="ArrowRight")move(s,0);
    if(e.key===" "||e.key==="Enter")inspect();
  }
});
canvas.addEventListener("click",e=>{
  if(scene!=="world")return;
  const r=canvas.getBoundingClientRect(),sx=1600/r.width,sy=900/r.height;
  const x=(e.clientX-r.left)*sx,y=(e.clientY-r.top)*sy;
  if(Math.hypot(x-365,y-690)<170)inspect(); else if(Math.hypot(x-1260,y-650)<260)inspect();
});

const touch=$("#touch-zone");let down=false,px=0,py=0,pid=-1,last=0;
touch.onpointerdown=e=>{down=true;pid=e.pointerId;px=e.clientX;py=e.clientY;last=performance.now();touch.setPointerCapture(pid)};
touch.onpointermove=e=>{
  if(!down||e.pointerId!==pid)return;const now=performance.now();if(now-last<35)return;
  const dx=e.clientX-px,dy=e.clientY-py,len=Math.hypot(dx,dy);if(len<4)return;
  const s=Math.min(9,len/18);move(dx/len*s,dy/len*s);px=e.clientX;py=e.clientY;last=now;
};
["pointerup","pointercancel","lostpointercapture"].forEach(x=>touch.addEventListener(x,()=>{down=false;pid=-1}));

function battleMessage(text:string){$("#battle-message").textContent=text;}
document.querySelectorAll<HTMLButtonElement>(".commands button").forEach(b=>b.onclick=()=>{
  const cmd=b.dataset.cmd;
  if(cmd==="fight"){battleTurn++;battleMessage(battleTurn===1?"刃が、影の輪郭をかすめた。":"それは笑った。ダメージは、ない。");}
  if(cmd==="talk")battleMessage("「……音を、返して。」\\n影は少しだけ近づいた。");
  if(cmd==="item")battleMessage("ポケットの中には、まだ何もない。");
  if(cmd==="mercy")battleMessage("まだ、その時じゃない。");
  if(battleTurn>0&&cmd==="talk")setTimeout(()=>go("world"),850);
});

let lastFrame=performance.now();
function loop(now:number){
  lastFrame=now;
  if(scene==="world"){drawRoom(now);walkTime+=.045;$("#time").textContent="06:"+String(42+Math.floor(now/10000)%18).padStart(2,"0");}
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
