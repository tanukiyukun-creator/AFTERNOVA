import "./style.css";

type Scene = "title" | "intro" | "world" | "battle";
type Choice = "quiet" | "answer";
let scene:Scene="title";
let choice:Choice="quiet";
let dialogueIndex=0;
let battleTurn=0;
let hp=24;
let playerX=50;
let playerY=66;
let moving=false;
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
      <h1>AFTERNOVA</h1>
      <div class="sigil">✦</div>
      <p>THE WORLD IS QUIET AFTER THE LIGHT</p>
      <button id="start">BEGIN</button>
      <small>© AFTERNOVA PROJECT</small>
    </div>
  </section>

  <section id="intro" class="scene hidden">
    <div class="intro-card">
      <div class="chapter">CHAPTER 01</div>
      <div class="intro-line"></div>
      <h2>THE MORNING<br><i>THAT NEVER CAME</i></h2>
      <p>ある朝、世界から「音」がひとつ消えた。</p>
      <button id="intro-next">目を覚ます</button>
    </div>
  </section>

  <section id="world" class="scene hidden">
    <div class="world-hud"><span>AFTERNOVA</span><span id="time">06:42</span></div>
    <div id="world-art" class="world-art">
      <div class="room-back"><div class="room-ceiling-light"></div><div class="room-wall-art"></div></div>
      <div class="window"><div class="window-glass"><div class="sky-reflection"></div><div class="city-mini"></div><div class="window-light"></div></div><span></span></div>
      <div class="lamp"></div>
      <div class="desk"><div class="desk-top"></div><div class="desk-drawer"></div><div class="desk-leg left"></div><div class="desk-leg right"></div></div>
      <div class="bed"><div class="bed-head"></div><div class="blanket"></div><div class="pillow"></div></div>
      <div class="floor-glow"></div><div class="floor-lines"></div>
      <canvas id="hero-canvas" class="hero-canvas" width="240" height="320" aria-label="主人公"></canvas>
      <div class="object-note" id="note">机の上の紙</div>
      <div class="exit-door" id="door">廊下</div>
      <div class="touch-zone" id="touch-zone"></div>
    </div>
    <div class="world-caption"><b>自室</b><span>川越 / 06:42</span></div>
    <div class="hint">WASD / 矢印キー　・　調べる</div>
    <div id="dialogue" class="dialogue hidden">
      <div class="speaker" id="speaker">—</div>
      <div class="dialogue-text" id="dialogue-text"></div>
      <button id="dialogue-next">▶</button>
    </div>
  </section>

  <section id="battle" class="scene hidden">
    <div class="battle-bg"><div class="stars"></div><div class="battle-vignette"></div><div class="horizon"></div><div class="battle-floor"></div></div>
    <div class="battle-top"><span>UNKNOWN / 01</span><span>THREAT LEVEL : ?</span></div>
    <div class="enemy">
      <div class="enemy-glow"></div><div class="enemy-ring"></div><div class="enemy-shape"><i></i><b></b><em></em></div>
      <div class="enemy-name">THE LISTENER</div>
    </div>
    <div class="battle-box">
      <div class="battle-status"><span>YOU</span><strong id="hp">24 / 24</strong></div>
      <div class="heart" id="heart">◆</div>
      <div class="battle-message" id="battle-message">それは、こちらを見ている。</div>
    </div>
    <div class="commands">
      <button data-cmd="fight"><b>FIGHT</b><small>攻撃</small></button>
      <button data-cmd="talk"><b>TALK</b><small>話す</small></button>
      <button data-cmd="item"><b>ITEM</b><small>持ち物</small></button>
      <button data-cmd="mercy"><b>MERCY</b><small>逃がす</small></button>
    </div>
  </section>
</div>`;

const $=<T extends HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const screens={title:$("#title"),intro:$("#intro"),world:$("#world"),battle:$("#battle")};
const dialogue=$("#dialogue"), speaker=$("#speaker"), dialogueText=$("#dialogue-text");
const heroCanvas=$("#hero-canvas") as HTMLCanvasElement;
const heroCtx=heroCanvas.getContext("2d")!;
let heroPhase=0;
let lastMoveTime=performance.now();
let timer:number|undefined;

function show(name:string,text:string,next?:()=>void){
  if(timer)clearInterval(timer);
  dialogue.classList.remove("hidden"); speaker.textContent=name; dialogueText.textContent="";
  let i=0;
  timer=window.setInterval(()=>{dialogueText.textContent=text.slice(0,++i);if(i>=text.length){clearInterval(timer);dialogue.dataset.ready="1";}},18);
  dialogue.dataset.next=next?"1":"0";
  $("#dialogue-next").onclick=()=>{if(dialogue.dataset.ready!=="1")return;if(dialogue.dataset.next==="1")next?.();else dialogue.classList.add("hidden");};
}
function go(id:"intro"|"world"|"battle"){
  Object.values(screens).forEach(x=>x.classList.add("hidden"));
  screens[id].classList.remove("hidden");
  scene=id;
}
function start(){
  go("intro");
  const intro=$("#intro");
  intro.classList.remove("arrive");
  requestAnimationFrame(()=>intro.classList.add("arrive"));
}
$("#start").onclick=start;
$("#intro-next").onclick=()=>{
  go("world");
  setTimeout(()=>show("—","目が覚めた。\n……何かがおかしい。",()=>show("—","静かすぎる。窓の外から、何も聞こえない。")),350);
};

function updatePlayer(){
  heroCanvas.style.left=playerX+"%";
  heroCanvas.style.top=playerY+"%";
}
function roundRect(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
  const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
}
function drawHero(now:number){
  const ctx=heroCtx;ctx.clearRect(0,0,240,320);
  const walking=moving && now-lastMoveTime<260;
  const bob=walking?Math.sin(heroPhase)*3:Math.sin(now/900)*.7;
  const leg=walking?Math.sin(heroPhase)*10:0;
  ctx.save();ctx.translate(120,238+bob);
  ctx.fillStyle="rgba(0,0,0,.34)";ctx.beginPath();ctx.ellipse(0,35,48,11,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(-14+leg*.25,10);ctx.rotate(leg*.025);
  const lg=ctx.createLinearGradient(0,0,0,62);lg.addColorStop(0,"#303747");lg.addColorStop(1,"#111722");
  ctx.fillStyle=lg;roundRect(ctx,-11,0,22,60,8);ctx.fill();
  ctx.fillStyle="#0c1018";roundRect(ctx,-13,49,25,10,5);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(14-leg*.25,10);ctx.rotate(-leg*.025);
  ctx.fillStyle="#202736";roundRect(ctx,-11,0,22,60,8);ctx.fill();ctx.fillStyle="#0c1018";roundRect(ctx,-12,49,25,10,5);ctx.fill();ctx.restore();
  const body=ctx.createLinearGradient(-34,-75,34,-10);body.addColorStop(0,"#596986");body.addColorStop(.42,"#35435e");body.addColorStop(1,"#171f31");
  ctx.fillStyle=body;roundRect(ctx,-34,-76,68,76,15);ctx.fill();
  ctx.fillStyle="rgba(190,205,235,.22)";roundRect(ctx,-23,-62,46,3,2);ctx.fill();
  ctx.fillStyle="#151b29";roundRect(ctx,-42,-68,13,52,7);ctx.fill();roundRect(ctx,29,-68,13,52,7);ctx.fill();
  ctx.fillStyle="#d7b7ad";ctx.beginPath();ctx.ellipse(0,-101,34,39,0,0,Math.PI*2);ctx.fill();
  const skin=ctx.createRadialGradient(-8,-112,4,8,-96,38);skin.addColorStop(0,"#f4d8cb");skin.addColorStop(1,"#ae817f");ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(0,-101,34,39,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#171820";ctx.beginPath();ctx.moveTo(-35,-104);ctx.quadraticCurveTo(-34,-146,0,-149);ctx.quadraticCurveTo(36,-146,38,-108);ctx.quadraticCurveTo(20,-126,8,-130);ctx.quadraticCurveTo(-8,-113,-35,-104);ctx.fill();
  ctx.fillStyle="#2a2933";ctx.beginPath();ctx.moveTo(-34,-116);ctx.quadraticCurveTo(-28,-130,-10,-134);ctx.quadraticCurveTo(-1,-125,-7,-112);ctx.quadraticCurveTo(-20,-113,-34,-116);ctx.fill();
  ctx.fillStyle="#191923";ctx.beginPath();ctx.ellipse(-12,-98,3.5,5,0,0,Math.PI*2);ctx.ellipse(12,-98,3.5,5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="rgba(255,255,255,.65)";ctx.beginPath();ctx.arc(-13,-100,1.2,0,Math.PI*2);ctx.arc(11,-100,1.2,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="rgba(92,54,60,.55)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-89,8,.15,Math.PI-.15);ctx.stroke();
  ctx.fillStyle="rgba(255,255,255,.18)";roundRect(ctx,-29,-65,5,38,3);ctx.fill();
  ctx.restore();
}
function move(dx:number,dy:number){
  if(scene!=="world"||!dialogue.classList.contains("hidden"))return;
  playerX=Math.max(8,Math.min(92,playerX+dx));
  playerY=Math.max(16,Math.min(82,playerY+dy));
  moving=true;lastMoveTime=performance.now();heroPhase+=Math.PI/2;updatePlayer();
  clearTimeout((move as any).t);
  (move as any).t=setTimeout(()=>{moving=false;updatePlayer()},180);
}
function inspect(){
  if(scene!=="world")return;
  const d=Math.hypot(playerX-30,playerY-35);
  if(d<18)show("—","紙には、見覚えのない文字が一行だけ書かれている。\n「きょうは、まだ来ていない。」");
}
$("#note").onclick=inspect;
$("#door").onclick=()=>show("—","まだ外へ出る気にはなれない。");
$("#world-art").addEventListener("click",e=>{
  const t=e.target as HTMLElement;
  if(t===e.currentTarget)inspect();
});
window.addEventListener("keydown",e=>{
  if(scene==="title"&&e.key==="Enter")start();
  if(scene==="world"){
    const s=1.05;
    if(e.key==="w"||e.key==="W"||e.key==="ArrowUp")move(0,-s);
    if(e.key==="s"||e.key==="S"||e.key==="ArrowDown")move(0,s);
    if(e.key==="a"||e.key==="A"||e.key==="ArrowLeft")move(-s,0);
    if(e.key==="d"||e.key==="D"||e.key==="ArrowRight")move(s,0);
    if(e.key===" "||e.key==="Enter")inspect();
  }
});

const touch=$("#touch-zone");
let down=false,px=0,py=0,pid=-1,last=0;
touch.onpointerdown=e=>{down=true;pid=e.pointerId;px=e.clientX;py=e.clientY;last=performance.now();touch.setPointerCapture(pid)};
touch.onpointermove=e=>{
  if(!down||e.pointerId!==pid)return;
  const now=performance.now();if(now-last<55)return;
  const dx=e.clientX-px,dy=e.clientY-py,len=Math.hypot(dx,dy);if(len<5)return;
  const s=Math.min(.8,len/80);move(dx/len*s,dy/len*s);px=e.clientX;py=e.clientY;last=now;
};
["pointerup","pointercancel","lostpointercapture"].forEach(x=>touch.addEventListener(x,()=>{down=false;pid=-1}));

function battleMessage(text:string){$("#battle-message").textContent=text}
document.querySelectorAll<HTMLButtonElement>(".commands button").forEach(b=>b.onclick=()=>{
  const cmd=b.dataset.cmd;
  if(cmd==="fight"){battleTurn++;battleMessage(battleTurn===1?"刃が、影の輪郭をかすめた。":"それは笑った。ダメージは、ない。")}
  if(cmd==="talk"){battleMessage("「……音を、返して。」\n影は少しだけ近づいた。")}
  if(cmd==="item"){battleMessage("ポケットの中には、まだ何もない。")}
  if(cmd==="mercy"){battleMessage("まだ、その時じゃない。")}
  if(battleTurn>0&&cmd==="talk"){setTimeout(()=>go("world"),850)}
});

let lastFrame=performance.now();
function loop(now:number){
  const dt=Math.min(100,now-lastFrame);lastFrame=now;
  if(scene==="world")drawHero(now);
  if(scene==="world"){
    const t=$("#time");
    const base=6*60+42+Math.floor(performance.now()/10000);
    t.textContent=String(Math.floor((base%1440)/60)).padStart(2,"0")+":"+String(base%60).padStart(2,"0");
  }
  raf=requestAnimationFrame(loop);
}
raf=requestAnimationFrame(loop);
