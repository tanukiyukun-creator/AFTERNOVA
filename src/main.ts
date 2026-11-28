import "./style.css";

type Screen = "title" | "gender" | "name" | "home";
type Gender = "男性" | "女性";
type Room = "bedroom" | "hall" | "kitchen";
type PhoneTab = "messages" | "camera" | "map" | "items" | "save";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root was not found.");

let screen: Screen = "title";
let titleSelection = 0;
let selectedGender: Gender = "男性";
let playerName = "主人公";
let room: Room = "bedroom";
let phoneOpen = false;
let phoneTab: PhoneTab = "messages";
let messageReplied = false;
let breakfastDone = false;
let gameMinutes = 7 * 60 + 4;
let dialogueTimer: number | undefined;

app.innerHTML = `
<main class="game">
  <div class="screen-transition" id="screen-transition"></div>

  <section class="title-screen" id="title-screen">
    <div class="title-backdrop">
      <div class="title-sky-glow"></div><div class="sun-haze"></div><div class="sun-disc"></div>
      <div class="cloud cloud-a"></div><div class="cloud cloud-b"></div><div class="cloud cloud-c"></div>
      <div class="city city-far"></div><div class="city city-mid"></div><div class="city city-near"></div>
      <div class="utility-pole pole-a"></div><div class="utility-pole pole-b"></div>
      <div class="powerline line-a"></div><div class="powerline line-b"></div><div class="powerline line-c"></div>
      <div class="title-road"></div><div class="title-grain"></div>
    </div>
    <div class="title-vignette"></div><div class="title-cinematic-bars top"></div><div class="title-cinematic-bars bottom"></div>
    <div class="title-content">
      <div class="title-location">SAITAMA / KAWAGOE · 07:04</div>
      <div class="title-kicker">A STORY AFTER THE LIGHT</div>
      <h1>AFTERNOVA</h1><div class="title-rule"></div><div class="title-sub">KAWAGOE / SAITAMA</div>
      <nav class="title-menu">
        <button class="title-item selected" data-index="0">NEW GAME</button>
        <button class="title-item" data-index="1">LOAD GAME</button>
        <button class="title-item" data-index="2">SETTINGS</button>
      </nav>
      <div class="title-hint">↑ ↓ で選択　ENTER / TAP で決定</div>
      <div class="title-footer-left">© AFTERNOVA PROJECT</div><div class="title-version">VER. 0.2.0</div>
    </div>
  </section>

  <section class="gender-screen hidden" id="gender-screen">
    <div class="creation-card">
      <div class="eyebrow">NEW GAME / 01</div><h2>あなたについて</h2>
      <p>主人公の性別を選択してください。</p>
      <div class="gender-options">
        <button class="gender-option" data-gender="男性"><span class="gender-symbol">♂</span><span>男性</span></button>
        <button class="gender-option" data-gender="女性"><span class="gender-symbol">♀</span><span>女性</span></button>
      </div>
      <div class="creation-note">この選択は主人公のデザインに反映されます</div>
    </div>
  </section>

  <section class="name-screen hidden" id="name-screen">
    <div class="name-card">
      <div class="eyebrow">NEW GAME / 02</div><h2>あなたの名前</h2>
      <p>この世界で呼ばれる名前を入力してください。</p>
      <input id="name-input" maxlength="12" autocomplete="off" placeholder="名前" />
      <button id="name-start">この名前で始める</button><div class="name-note">ENTERでも開始できます</div>
    </div>
  </section>

  <section class="home-screen hidden" id="home-screen">
    <div class="home-world topdown-world" id="home-world"></div>

    <div class="home-top"><span>AFTERNOVA</span><span id="clock">07:04</span></div>
    <div class="home-location"><strong id="room-name">自室</strong><span>川越市 / 自宅</span></div>
    <div class="interaction-hint" id="interaction-hint">クリック / タップで探索</div>
    <div class="home-dialogue hidden" id="home-dialogue"><div class="dialogue-name" id="dialogue-name">—</div><div class="dialogue-text" id="opening-text"></div><button id="dialogue-next">次へ</button></div>
    <button class="phone-button" id="phone-button" aria-label="スマートフォン">PHONE</button>
    <div class="explore-controls" id="explore-controls">
      <button data-action="left">←</button><button data-action="forward">↑</button><button data-action="right">→</button>
    </div>

    <div class="phone-overlay hidden" id="phone-overlay">
      <div class="phone-shell">
        <div class="phone-status"><span>07:04</span><span>●●● 100%</span></div>
        <div class="phone-screen">
          <div class="phone-header"><button id="phone-close">×</button><strong>PHONE</strong><span>AFTERNOVA</span></div>
          <div class="phone-content" id="phone-content"></div>
          <div class="phone-nav">
            <button data-tab="messages">メッセージ</button><button data-tab="camera">カメラ</button>
            <button data-tab="map">地図</button><button data-tab="items">所持品</button><button data-tab="save">保存</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</main>`;

const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
const screens: Record<Screen, HTMLElement> = {title:$("#title-screen"),gender:$("#gender-screen"),name:$("#name-screen"),home:$("#home-screen")};
const transition = $("#screen-transition");
const menuItems = [...document.querySelectorAll<HTMLButtonElement>(".title-item")];
const genderOptions = [...document.querySelectorAll<HTMLButtonElement>(".gender-option")];
const nameInput = $("#name-input") as HTMLInputElement;
const nameStart = $("#name-start");
const dialogue = $("#home-dialogue");
const dialogueName = $("#dialogue-name");
const dialogueText = $("#opening-text");
const dialogueNext = $("#dialogue-next");
const roomName = $("#room-name");
const phoneOverlay = $("#phone-overlay");
const phoneContent = $("#phone-content");
const hint = $("#interaction-hint");

function press(el: HTMLElement){ el.classList.remove("pressed"); void el.offsetWidth; el.classList.add("pressed"); setTimeout(()=>el.classList.remove("pressed"),220); }

function changeScreen(next: Screen, after?:()=>void){
  if(screen===next)return;
  transition.classList.remove("play"); void transition.offsetWidth; transition.classList.add("play");
  setTimeout(()=>{
    Object.values(screens).forEach(e=>e.classList.add("hidden"));
    screens[next].classList.remove("hidden"); screen=next; after?.();
  },540);
}

function setTitleSelection(i:number){
  titleSelection=(i+menuItems.length)%menuItems.length;
  menuItems.forEach((b,n)=>b.classList.toggle("selected",n===titleSelection));
}

function startNewGame(){
  press(menuItems[0]); changeScreen("gender");
}

function selectGender(g:Gender, el:HTMLElement){
  press(el); selectedGender=g;
  genderOptions.forEach(b=>b.classList.toggle("selected",b.dataset.gender===g));
  setTimeout(()=>changeScreen("name",()=>setTimeout(()=>nameInput.focus(),120)),300);
}

function beginHome(){
  press(nameStart); playerName=nameInput.value.trim()||"主人公";
  changeScreen("home",()=>startOpening());
}

function showDialogue(name:string,text:string,next?:()=>void){
  if(dialogueTimer)clearTimeout(dialogueTimer);
  dialogue.classList.remove("hidden"); dialogueName.textContent=name; dialogueText.textContent="";
  let i=0; dialogueTimer=window.setInterval(()=>{dialogueText.textContent=text.slice(0,++i); if(i>=text.length){clearInterval(dialogueTimer); dialogue.dataset.next=next?"1":"0";}},18);
  dialogueNext.onclick=()=>{ if(dialogue.dataset.next==="1") next?.(); else dialogue.classList.add("hidden"); };
}

function startOpening(){
  room="bedroom"; playerX=50; playerY=66; renderRoom();
  showDialogue("—",`${playerName}は、ゆっくりと目を覚ました。`,()=>{
    showDialogue("—","窓の向こうから、川越の朝が静かに始まっている。",()=>dialogue.classList.add("hidden"));
  });
}

function renderRoom(){
  const world=$("#home-world");
  world.dataset.room=room;
  roomName.textContent=room==="bedroom"?"自室":room==="hall"?"廊下":"キッチン";
  hint.textContent=room==="bedroom"?"WASD / 矢印キーで移動　近くで調べる":room==="hall"?"WASD / 矢印キーで移動　右のドアからキッチンへ":"WASD / 矢印キーで移動　母親に近づく";
  const roomMarkup = room==="bedroom" ? 
    `<div class="topdown-room bedroom-map"><div class="room-ceiling"></div><div class="window-tile" data-action="look-window"><span>窓</span></div><div class="bed-tile"><span>BED</span></div><div class="desk-tile"><span>DESK</span><div class="phone-pickup" data-action="phone">PHONE</div></div><div class="door-tile" data-action="hall"><span>廊下</span></div><div class="rug"></div></div>` :
    room==="hall" ?
    `<div class="topdown-room hall-map"><div class="hall-wall"></div><div class="hall-runner"></div><div class="hall-picture p1"></div><div class="hall-picture p2"></div><div class="door-tile back" data-action="bedroom"><span>自室</span></div><div class="door-tile kitchen" data-action="kitchen"><span>キッチン</span></div></div>` :
    `<div class="topdown-room kitchen-map"><div class="kitchen-wall"></div><div class="kitchen-counter"></div><div class="kitchen-table-top"></div><div class="mother-character"><div class="mother-head"></div><span>母</span></div><div class="kitchen-door" data-action="hall">廊下</div></div>`;
  world.innerHTML=roomMarkup+characterMarkup()+
    `<div class="touch-controls" aria-label="移動操作"><button data-move="up">▲</button><div><button data-move="left">◀</button><button data-move="down">▼</button><button data-move="right">▶</button></div></div>`;
  updateCharacter();
  bindWorldActions();
  bindMoveButtons();
}

function characterMarkup(){
  const female=selectedGender==="女性";
  return `<div class="player-character ${female?"female":"male"}" id="player-character"><div class="player-shadow"></div><div class="player-head"></div><div class="player-hair"></div><div class="player-body"></div><div class="player-arm left"></div><div class="player-arm right"></div><div class="player-leg left"></div><div class="player-leg right"></div><div class="player-name-tag">${playerName}</div></div>`;
}

let playerX=50;
let playerY=66;
let moving=false;
function updateCharacter(){
  const p=document.querySelector<HTMLElement>("#player-character");
  if(!p)return;
  p.style.left=playerX+"%"; p.style.top=playerY+"%";
  p.classList.toggle("walking",moving);
}
function movePlayer(dx:number,dy:number){
  if(screen!=="home"||phoneOpen)return;
  playerX=Math.max(7,Math.min(93,playerX+dx));
  playerY=Math.max(12,Math.min(86,playerY+dy));
  moving=true; updateCharacter();
  window.clearTimeout((movePlayer as any)._timer);
  (movePlayer as any)._timer=window.setTimeout(()=>{moving=false;updateCharacter();},130);
}
function bindMoveButtons(){
  document.querySelectorAll<HTMLButtonElement>("[data-move]").forEach(b=>b.onclick=()=>{
    const d=b.dataset.move;
    if(d==="up")movePlayer(0,-3); if(d==="down")movePlayer(0,3); if(d==="left")movePlayer(-3,0); if(d==="right")movePlayer(3,0);
  });
}



function bindWorldActions(){
  document.querySelectorAll<HTMLElement>("[data-action]").forEach(el=>{
    el.onclick=()=>handleAction(el.dataset.action||"");
  });
}

function handleAction(action:string){
  if(phoneOpen)return;
  if(action==="phone"){openPhone();return;}
  if(action==="look-window"){
    showDialogue("—","いつもの川越の朝。……なのに、なぜか少しだけ遠く見える。");
    return;
  }
  if(action==="bed"){
    showDialogue("—","まだ眠気が残っている。今日は学校がある。");
    return;
  }
  if(action==="hall"){
    room="hall"; playerX=50; playerY=78; renderRoom();
    showDialogue("—","廊下へ出た。");
    return;
  }
  if(action==="kitchen"){
    room="kitchen"; playerX=50; playerY=76; renderRoom();
    showDialogue("母","おはよう。朝ごはん、できてるよ。",()=>{
      breakfastDone=true;
      showDialogue(playerName,"うん。",()=>dialogue.classList.add("hidden"));
    });
    return;
  }
  if(action==="bedroom"){
    room="bedroom"; playerX=50; playerY=78; renderRoom();
    return;
  }
}

function openPhone(){
  phoneOpen=true;
  phoneOverlay.classList.remove("hidden");
  renderPhone();
}
function closePhone(){
  phoneOpen=false;
  phoneOverlay.classList.add("hidden");
}

function renderPhone(){
  const tab=phoneTab;
  const body=tab==="messages"?`
    <div class="phone-title">メッセージ</div>
    <article class="message-card">
      <div class="message-from">ファミリーマート大宮店　店長</div>
      <div class="message-time">07:03</div>
      <p>岡本くん、突然申し訳ないんだけど今日シフトはいれる？</p>
      ${messageReplied
        ? "<div class='message-reply'>返信済み</div>"
        : `<div class="message-actions"><button data-reply="yes">返信する</button><button data-reply="no">無視する</button></div>`}
    </article>`
  :tab==="camera"?`<div class="phone-title">カメラ</div><div class="camera-preview"><div>CAMERA</div><span>川越 / 自室</span></div>`
  :tab==="map"?`<div class="phone-title">川越市</div><div class="map-preview"><div class="map-road r1"></div><div class="map-road r2"></div><div class="map-pin">● 自宅</div><small>現在地：川越市</small></div>`
  :tab==="items"?`<div class="phone-title">所持品</div><div class="item-grid"><div>スマートフォン</div><div>学生証</div><div>家の鍵</div><div>財布</div></div>`
  :`<div class="phone-title">セーブ</div><div class="save-card"><strong>AFTERNOVA / SLOT 01</strong><span>${playerName} · ${formatTime()} · ${roomName.textContent}</span><button id="save-game">この状態を保存</button></div>`;
  phoneContent.innerHTML=body;

  phoneContent.querySelectorAll<HTMLButtonElement>("[data-reply]").forEach(b=>b.onclick=()=>{
    messageReplied=true;
    renderPhone();
    showDialogue("—",b.dataset.reply==="yes"?"返信した。":"返信せず、画面を閉じた。");
  });

  const save=$("#save-game");
  save?.addEventListener("click",()=>{
    localStorage.setItem("afternova-save",JSON.stringify({
      playerName,selectedGender,room,gameMinutes,breakfastDone,messageReplied,playerX,playerY
    }));
    press(save);
  });
}

function formatTime(){
  const t=Math.floor(gameMinutes)%1440;
  return `${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`;
}

menuItems.forEach(b=>b.onclick=()=>{
  const i=Number(b.dataset.index||0);
  setTitleSelection(i);
  if(i===0)startNewGame();
  else press(b);
});

genderOptions.forEach(b=>b.onclick=()=>{
  const g=b.dataset.gender;
  if(g==="男性"||g==="女性")selectGender(g,b);
});

nameStart.onclick=beginHome;

$("#phone-button").onclick=openPhone;
$("#phone-close").onclick=closePhone;

document.querySelectorAll<HTMLButtonElement>(".phone-nav button").forEach(b=>b.onclick=()=>{
  phoneTab=(b.dataset.tab||"messages") as PhoneTab;
  renderPhone();
});

window.addEventListener("keydown",e=>{
  if(screen==="title"){
    if(e.key==="ArrowUp"||e.key==="ArrowDown"){
      e.preventDefault();
      setTitleSelection(titleSelection+(e.key==="ArrowDown"?1:-1));
    }else if(e.key==="Enter"&&titleSelection===0){
      startNewGame();
    }
  }else if(screen==="gender"){
    if(e.key==="1")selectGender("男性",genderOptions[0]);
    if(e.key==="2")selectGender("女性",genderOptions[1]);
  }else if(screen==="name"&&e.key==="Enter"){
    e.preventDefault();
    beginHome();
  }else if(screen==="home"){
    if(e.key==="Escape"&&phoneOpen){
      closePhone();
      return;
    }
    if(!phoneOpen){
      const step=3;
      if(e.key==="w"||e.key==="W"||e.key==="ArrowUp")movePlayer(0,-step);
      if(e.key==="s"||e.key==="S"||e.key==="ArrowDown")movePlayer(0,step);
      if(e.key==="a"||e.key==="A"||e.key==="ArrowLeft")movePlayer(-step,0);
      if(e.key==="d"||e.key==="D"||e.key==="ArrowRight")movePlayer(step,0);
    }
  }
});

nameInput.addEventListener("input",()=>{
  nameInput.value=nameInput.value.replace(/[<>]/g,"");
});

let last=performance.now();
function tick(now:number){
  const dt=Math.min(now-last,100);
  last=now;
  if(screen==="home"&&!phoneOpen){
    gameMinutes+=(dt/60000)*24*60;
    const clock=$("#clock");
    clock.textContent=formatTime();
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
