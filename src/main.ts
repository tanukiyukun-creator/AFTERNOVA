import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root was not found.");

type Screen = "title" | "name" | "home";
let screen: Screen = "title";
let titleSelection = 0;

app.innerHTML = `
  <main class="game">
    <div class="title-screen" id="title-screen">
      <div class="title-backdrop">
        <div class="sun-haze"></div>
        <div class="cloud cloud-a"></div>
        <div class="cloud cloud-b"></div>
        <div class="city city-far"></div>
        <div class="city city-near"></div>
        <div class="powerline line-a"></div>
        <div class="powerline line-b"></div>
      </div>
      <div class="title-vignette"></div>
      <div class="title-content">
        <div class="title-kicker">A STORY AFTER THE LIGHT</div>
        <h1>AFTERNOVA</h1>
        <div class="title-rule"></div>
        <div class="title-sub">KAWAGOE / SAITAMA</div>
        <nav class="title-menu" aria-label="タイトルメニュー">
          <button class="title-item selected" data-index="0">NEW GAME</button>
          <button class="title-item" data-index="1">LOAD GAME</button>
          <button class="title-item" data-index="2">SETTINGS</button>
        </nav>
        <div class="title-hint">↑ ↓ で選択　ENTER / TAP で決定</div>
        <div class="title-version">AFTERNOVA // 0.1.0</div>
      </div>
    </div>

    <section class="name-screen hidden" id="name-screen">
      <div class="name-card">
        <div class="eyebrow">NEW GAME</div>
        <h2>あなたの名前</h2>
        <p>この世界で呼ばれる名前を入力してください。</p>
        <input id="name-input" maxlength="12" autocomplete="off" placeholder="名前" />
        <button id="name-start">この名前で始める</button>
        <div class="name-note">ENTERでも開始できます</div>
      </div>
    </section>

    <section class="home-screen hidden" id="home-screen">
      <div class="home-world">
        <div class="room-wall"></div>
        <div class="window"><div class="window-sky"></div><div class="window-city"></div></div>
        <div class="desk"></div>
        <div class="bed"><div class="pillow"></div></div>
        <div class="room-floor"></div>
        <div class="player"></div>
      </div>
      <div class="home-top"><span>AFTERNOVA</span><span id="clock">07:04</span></div>
      <div class="home-caption"><strong>川越市</strong><span>自宅・自室</span></div>
      <div class="home-dialogue">
        <div class="dialogue-name">—</div>
        <div class="dialogue-text" id="opening-text">……朝だ。</div>
      </div>
    </section>
  </main>
`;

const titleScreen = document.querySelector<HTMLElement>("#title-screen")!;
const nameScreen = document.querySelector<HTMLElement>("#name-screen")!;
const homeScreen = document.querySelector<HTMLElement>("#home-screen")!;
const menuItems = [...document.querySelectorAll<HTMLButtonElement>(".title-item")];
const nameInput = document.querySelector<HTMLInputElement>("#name-input")!;
const nameStart = document.querySelector<HTMLButtonElement>("#name-start")!;
const openingText = document.querySelector<HTMLDivElement>("#opening-text")!;

function setSelection(index: number) {
  titleSelection = (index + menuItems.length) % menuItems.length;
  menuItems.forEach((item, i) => item.classList.toggle("selected", i === titleSelection));
}

function startNewGame() {
  screen = "name";
  titleScreen.classList.add("hidden");
  nameScreen.classList.remove("hidden");
  window.setTimeout(() => nameInput.focus(), 80);
}

function beginHome() {
  const name = nameInput.value.trim() || "主人公";
  openingText.textContent = `${name}は、ゆっくりと目を覚ました。`;
  screen = "home";
  nameScreen.classList.add("hidden");
  homeScreen.classList.remove("hidden");
}

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    const index = Number(item.dataset.index ?? 0);
    setSelection(index);
    if (index === 0) startNewGame();
  });
});

window.addEventListener("keydown", (event) => {
  if (screen === "title") {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setSelection(titleSelection + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter" && titleSelection === 0) {
      startNewGame();
    }
    return;
  }

  if (screen === "name" && event.key === "Enter") {
    event.preventDefault();
    beginHome();
  }
});

nameStart.addEventListener("click", beginHome);

nameInput.addEventListener("input", () => {
  nameInput.value = nameInput.value.replace(/[<>]/g, "");
});

let last = performance.now();
let gameMinutes = 7 * 60 + 4;

function tick(now: number) {
  const dt = Math.min(now - last, 100);
  last = now;

  if (screen === "home") {
    gameMinutes += (dt / 60000) * 24 * 60;
    const total = Math.floor(gameMinutes) % 1440;
    const clock = document.querySelector<HTMLSpanElement>("#clock");
    if (clock) {
      clock.textContent = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    }
  }

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
