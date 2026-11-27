import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root was not found.");

type Screen = "title" | "gender" | "name" | "home";
let screen: Screen = "title";
let titleSelection = 0;
let selectedGender = "";

app.innerHTML = `
  <main class="game">
    <div class="screen-transition" id="screen-transition"></div>
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

    <section class="gender-screen hidden" id="gender-screen">
      <div class="creation-card">
        <div class="eyebrow">NEW GAME / 01</div>
        <h2>あなたについて</h2>
        <p>主人公の性別を選択してください。</p>
        <div class="gender-options">
          <button class="gender-option" data-gender="男性"><span class="gender-symbol">♂</span><span>男性</span></button>
          <button class="gender-option" data-gender="女性"><span class="gender-symbol">♀</span><span>女性</span></button>
          <button class="gender-option" data-gender="その他"><span class="gender-symbol">◇</span><span>その他</span></button>
        </div>
        <div class="creation-note">あとから変更できません</div>
      </div>
    </section>

    <section class="name-screen hidden" id="name-screen">
      <div class="name-card">
        <div class="eyebrow">NEW GAME / 02</div>
        <h2>あなたの名前</h2>
        <p>この世界で呼ばれる名前を入力してください。</p>
        <input id="name-input" maxlength="12" autocomplete="off" placeholder="名前" />
        <button id="name-start">この名前で始める</button>
        <div class="name-note">ENTERでも開始できます</div>
      </div>
    </section>

    <section class="home-screen hidden" id="home-screen">
      <div class="home-world opening-bed-view">
        <div class="opening-ai-image" aria-hidden="true"></div>
        <div class="opening-ai-fallback" aria-hidden="true">
          <div class="room-wall"></div>
          <div class="window"><div class="window-sky"></div><div class="window-city"></div></div>
          <div class="desk"></div>
          <div class="bed"><div class="pillow"></div></div>
          <div class="room-floor"></div>
        </div>
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
const genderScreen = document.querySelector<HTMLElement>("#gender-screen")!;
const nameScreen = document.querySelector<HTMLElement>("#name-screen")!;
const homeScreen = document.querySelector<HTMLElement>("#home-screen")!;
const transition = document.querySelector<HTMLElement>("#screen-transition")!;
const menuItems = [...document.querySelectorAll<HTMLButtonElement>(".title-item")];
const genderOptions = [...document.querySelectorAll<HTMLButtonElement>(".gender-option")];
const nameInput = document.querySelector<HTMLInputElement>("#name-input")!;
const nameStart = document.querySelector<HTMLButtonElement>("#name-start")!;
const openingText = document.querySelector<HTMLDivElement>("#opening-text")!;

const screens: Record<Screen, HTMLElement> = {
  title: titleScreen,
  gender: genderScreen,
  name: nameScreen,
  home: homeScreen
};

function animatePress(button: HTMLElement) {
  button.classList.remove("pressed");
  void button.offsetWidth;
  button.classList.add("pressed");
  window.setTimeout(() => button.classList.remove("pressed"), 220);
}

function changeScreen(next: Screen, after?: () => void) {
  if (screen === next) return;
  transition.classList.remove("play");
  void transition.offsetWidth;
  transition.classList.add("play");

  window.setTimeout(() => {
    Object.values(screens).forEach((element) => element.classList.add("hidden"));
    screens[next].classList.remove("hidden");
    screen = next;
    if (after) after();
  }, 180);
}

function setSelection(index: number) {
  titleSelection = (index + menuItems.length) % menuItems.length;
  menuItems.forEach((item, i) => item.classList.toggle("selected", i === titleSelection));
}

function startNewGame(button?: HTMLElement) {
  if (button) animatePress(button);
  changeScreen("gender");
}

function selectGender(gender: string, button?: HTMLElement) {
  if (button) animatePress(button);
  selectedGender = gender;
  genderOptions.forEach((option) => option.classList.toggle("selected", option.dataset.gender === gender));

  window.setTimeout(() => {
    changeScreen("name", () => window.setTimeout(() => nameInput.focus(), 120));
  }, 260);
}

function beginHome(button?: HTMLElement) {
  if (button) animatePress(button);
  const name = nameInput.value.trim() || "主人公";
  openingText.textContent = `${name}は、ゆっくりと目を覚ました。`;
  changeScreen("home");
}

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    const index = Number(item.dataset.index ?? 0);
    setSelection(index);
    if (index === 0) startNewGame(item);
    else animatePress(item);
  });
});

genderOptions.forEach((option) => {
  option.addEventListener("click", () => selectGender(option.dataset.gender ?? "その他", option));
});

nameStart.addEventListener("click", () => beginHome(nameStart));

window.addEventListener("keydown", (event) => {
  if (screen === "title") {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setSelection(titleSelection + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "Enter" && titleSelection === 0) {
      startNewGame(menuItems[0]);
    }
    return;
  }

  if (screen === "gender") {
    if (event.key === "1") selectGender("男性", genderOptions[0]);
    else if (event.key === "2") selectGender("女性", genderOptions[1]);
    else if (event.key === "3") selectGender("その他", genderOptions[2]);
    return;
  }

  if (screen === "name" && event.key === "Enter") {
    event.preventDefault();
    beginHome(nameStart);
  }
});

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
    if (clock) clock.textContent = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
