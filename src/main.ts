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
    <div class="title-city far"></div><div class="title-city near"></div>
    <div class="title-rain"></div>
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
      <div class="room-back"></div>
      <div class="window"><div class="sky-reflection"></div><div class="city-mini"></div></div>
      <div class="lamp"></div>
      <div class="desk"></div>
      <div class="bed"></div>
      <div class="floor-glow"></div>
      <div id="player" class="hero">
        <div class="shadow"></div><div class="legs"><i></i><i></i></div>
        <div class="body"></div><div class="head"></div><div class="hair"></div>
      </div>
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
    <div class="battle-bg"><div class="stars"></div><div class="horizon"></div></div>
    <div class="battle-top"><span>UNKNOWN / 01</span><span>THREAT LEVEL : ?</span></div>
    <div class="enemy">
      <div class="enemy-glow"></div><div class="enemy-shape"><i></i><b></b></div>
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
  setTimeout(()=>$("#intro").classList.add("arrive"),30);
}
$("#start").onclick=start;
$("#intro-next").onclick=()=>{
  go("world");
  setTimeout(()=>show("—","目が覚めた。\n……何かがおかしい。",()=>show("—","静かすぎる。窓の外から、何も聞こえない。")),350);
};

function updatePlayer(){
  const p=$("#player");
  p.style.left=playerX+"%";p.style.top=playerY+"%";p.classList.toggle("walking",moving);
}
function move(dx:number,dy:number){
  if(scene!=="world"||!dialogue.classList.contains("hidden"))return;
  playerX=Math.max(8,Math.min(92,playerX+dx));
  playerY=Math.max(16,Math.min(82,playerY+dy));
  moving=true;updatePlayer();
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
  if(scene==="world"){
    const t=$("#time");
    const base=6*60+42+Math.floor(performance.now()/10000);
    t.textContent=String(Math.floor((base%1440)/60)).padStart(2,"0")+":"+String(base%60).padStart(2,"0");
  }
  raf=requestAnimationFrame(loop);
}
raf=requestAnimationFrame(loop);
