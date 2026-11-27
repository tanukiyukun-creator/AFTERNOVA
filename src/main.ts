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
        <div class="title-sky-glow"></div>
        <div class="sun-haze"></div>
        <div class="sun-disc"></div>
        <div class="cloud cloud-a"></div>
        <div class="cloud cloud-b"></div>
        <div class="cloud cloud-c"></div>
        <div class="city city-far"></div>
        <div class="city city-mid"></div>
        <div class="city city-near"></div>
        <div class="utility-pole pole-a"></div>
        <div class="utility-pole pole-b"></div>
        <div class="powerline line-a"></div>
        <div class="powerline line-b"></div>
        <div class="powerline line-c"></div>
        <div class="title-road"></div>
        <div class="title-grain"></div>
      </div>
      <div class="title-vignette"></div>
      <div class="title-cinematic-bars top"></div>
      <div class="title-cinematic-bars bottom"></div>
      <div class="title-content">
        <div class="title-location">SAITAMA / KAWAGOE &nbsp;·&nbsp; 07:04</div>
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
        <div class="title-footer-left">© AFTERNOVA PROJECT</div>
        <div class="title-version">VER. 0.1.0</div>
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
  }, 520);
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


// =========================================================
// AFTERNOVA CORE PLAYABLE SLICE
// Opening -> house exploration -> phone -> breakfast -> map
// -> relationship choices -> evening notification -> battle
// =========================================================

type RuntimeScene = "bedroom" | "kitchen" | "hall" | "outside";
type RuntimePhone = "messages" | "camera" | "map" | "sns" | "items" | "save" | "calls" | "search" | "music";

interface RuntimeSave {
  name: string;
  gender: string;
  scene: RuntimeScene;
  gameMinutes: number;
  phoneChecked: boolean;
  managerReplied: boolean;
  eveningNotification: boolean;
  breakfastDone: boolean;
  relationship: Record<string, number>;
  inventory: string[];
}

let runtimeMounted = false;
let runtimeScene: RuntimeScene = "bedroom";
let runtimePhonePage: RuntimePhone = "messages";
let phoneChecked = false;
let managerReplied = false;
let eveningNotification = false;
let breakfastDone = false;
let runtimeBattle = false;
let enemyHp = 24;
let playerHp = 30;
let runtimeRelationships: Record<string, number> = {
  "神谷 直人": 0,
  "母": 0,
  "ファミリーマート大宮店": 0
};
let runtimeInventory = ["スマートフォン", "学生証", "財布"];

function runtimeTime() {
  const total = Math.floor(gameMinutes) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function runtimeToast(text: string) {
  const toast = document.createElement("div");
  toast.className = "runtime-toast";
  toast.textContent = text;
  homeScreen.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2200);
}

function runtimeSave() {
  const data: RuntimeSave = {
    name: nameInput.value.trim() || "主人公",
    gender: selectedGender,
    scene: runtimeScene,
    gameMinutes,
    phoneChecked,
    managerReplied,
    eveningNotification,
    breakfastDone,
    relationship: runtimeRelationships,
    inventory: runtimeInventory
  };
  localStorage.setItem("afternova-runtime-save", JSON.stringify(data));
  runtimeToast("保存しました");
}

function runtimeLoad(): boolean {
  const raw = localStorage.getItem("afternova-runtime-save");
  if (!raw) {
    runtimeToast("保存データがありません");
    return false;
  }
  try {
    const data = JSON.parse(raw) as RuntimeSave;
    nameInput.value = data.name || "主人公";
    selectedGender = data.gender || "";
    runtimeScene = data.scene || "bedroom";
    gameMinutes = data.gameMinutes || 424;
    phoneChecked = Boolean(data.phoneChecked);
    managerReplied = Boolean(data.managerReplied);
    eveningNotification = Boolean(data.eveningNotification);
    breakfastDone = Boolean(data.breakfastDone);
    runtimeRelationships = data.relationship || runtimeRelationships;
    runtimeInventory = data.inventory || runtimeInventory;
    changeScreen("home", () => {
      mountRuntime();
      runtimeMode("explore");
    });
    return true;
  } catch {
    runtimeToast("保存データを読み込めませんでした");
    return false;
  }
}

function runtimeOverlayClose() {
  homeScreen.querySelectorAll(".runtime-overlay").forEach((el) => el.remove());
}

function runtimeDialogue(
  speaker: string,
  text: string,
  options: { label: string; action: () => void }[] = []
) {
  runtimeOverlayClose();
  const overlay = document.createElement("div");
  overlay.className = "runtime-overlay runtime-dialogue-overlay";
  overlay.innerHTML = `
    <div class="runtime-dialogue">
      <div class="runtime-dialogue-name">${speaker}</div>
      <div class="runtime-dialogue-text">${text}</div>
      <div class="runtime-dialogue-options">
        ${options.map((o, i) => `<button data-runtime-option="${i}">${o.label}</button>`).join("")}
      </div>
    </div>
  `;
  homeScreen.appendChild(overlay);

  options.forEach((option, i) => {
    const button = overlay.querySelector<HTMLButtonElement>(`[data-runtime-option="${i}"]`);
    button?.addEventListener("click", () => {
      overlay.remove();
      option.action();
    });
  });

  if (options.length === 0) {
    overlay.addEventListener("click", () => overlay.remove());
  }
}

function runtimePhone(page: RuntimePhone = runtimePhonePage) {
  runtimeOverlayClose();
  runtimePhonePage = page;
  const overlay = document.createElement("div");
  overlay.className = "runtime-overlay runtime-phone-overlay";
  overlay.innerHTML = `
    <div class="runtime-phone">
      <header class="runtime-phone-header">
        <button data-runtime-close>‹</button>
        <div><b>AFTERNOVA PHONE</b><span>${runtimeTime()}</span></div>
        <span class="runtime-signal">4G · 75%</span>
      </header>
      <div class="runtime-phone-content" id="runtime-phone-content"></div>
      <nav class="runtime-phone-nav">
        <button data-runtime-phone="messages">メッセージ</button>
        <button data-runtime-phone="camera">カメラ</button>
        <button data-runtime-phone="map">地図</button>
        <button data-runtime-phone="sns">SNS</button>
        <button data-runtime-phone="items">持ち物</button>
        <button data-runtime-phone="save">セーブ</button>
        <button data-runtime-phone="calls">通話</button>
        <button data-runtime-phone="search">検索</button>
        <button data-runtime-phone="music">音楽</button>
      </nav>
    </div>
  `;
  homeScreen.appendChild(overlay);

  const body = overlay.querySelector<HTMLDivElement>("#runtime-phone-content")!;
  const close = () => overlay.remove();

  if (page === "messages") {
    body.innerHTML = `
      <div class="runtime-page-kicker">MESSAGES</div>
      <article class="runtime-message-thread">
        <div class="runtime-message-head">ファミリーマート大宮店　店長</div>
        <div class="runtime-message incoming">岡本くん、突然申し訳ないんだけど今日シフトはいれる？</div>
        ${managerReplied ? '<div class="runtime-message outgoing">すみません、人違いではないでしょうか。</div><div class="runtime-message incoming">今日の18:42、忘れないでください</div>' : ""}
        ${eveningNotification ? '<div class="runtime-message important">18:42　今日の18:42、忘れないでください</div>' : ""}
      </article>
      ${!phoneChecked ? '<div class="runtime-phone-actions"><button data-runtime-reply>返信する</button><button data-runtime-ignore>返信しない</button></div>' : ""}
      <div class="runtime-message-head secondary">神谷 直人</div>
      <div class="runtime-message incoming">おはよ。今日学校来る？</div>
    `;
  } else if (page === "camera") {
    body.innerHTML = `
      <div class="runtime-page-kicker">CAMERA</div>
      <div class="runtime-camera"><span>●</span><i></i><b>川越・自宅</b></div>
      <button class="runtime-wide-button" data-runtime-photo>撮影する</button>
    `;
  } else if (page === "map") {
    body.innerHTML = `
      <div class="runtime-page-kicker">KAWAGOE MAP</div>
      <div class="runtime-mini-map"><span>川越駅</span><span>時の鐘</span><span>自宅</span><span>山村学園高校</span></div>
      <button class="runtime-wide-button" data-runtime-open-map>大きな地図を開く</button>
    `;
  } else if (page === "sns") {
    body.innerHTML = `
      <div class="runtime-page-kicker">SNS</div>
      <article class="runtime-sns"><b>kawagoe_today</b><p>朝の川越。今日もいつも通り。</p><small>07:01</small></article>
      <article class="runtime-sns"><b>naoto_k</b><p>今日学校来る人いる？</p><small>07:03</small></article>
    `;
  } else if (page === "items") {
    body.innerHTML = `
      <div class="runtime-page-kicker">ITEMS</div>
      <div class="runtime-items">${runtimeInventory.map((item) => `<div>${item}</div>`).join("")}</div>
    `;
  } else if (page === "calls") {
    body.innerHTML = `
      <div class="runtime-page-kicker">CALLS</div>
      <article class="runtime-call-card">
        <b>神谷 直人</b><span>不在着信　07:08</span>
        <button data-runtime-call>折り返す</button>
      </article>
      <article class="runtime-call-card">
        <b>母</b><span>最近の通話</span>
        <button data-runtime-call-mother>電話する</button>
      </article>
    `;
  } else if (page === "search") {
    body.innerHTML = `
      <div class="runtime-page-kicker">WEB SEARCH</div>
      <div class="runtime-search">
        <input id="runtime-search-input" placeholder="川越について検索" />
        <button data-runtime-search>検索</button>
      </div>
      <div id="runtime-search-result" class="runtime-search-result">検索した内容がここに表示されます。</div>
    `;
  } else if (page === "music") {
    body.innerHTML = `
      <div class="runtime-page-kicker">MUSIC</div>
      <div class="runtime-player-card">
        <div class="runtime-album-art"></div>
        <b>morning / 07:04</b>
        <span>再生中</span>
        <button data-runtime-music>▶ / ❚❚</button>
      </div>
    `;
  } else {
    body.innerHTML = `
      <div class="runtime-page-kicker">SAVE</div>
      <p class="runtime-description">現在時刻・場所・選択・関係値を端末内に保存します。</p>
      <button class="runtime-wide-button" data-runtime-save>この状態を保存</button>
    `;
  }

  overlay.querySelectorAll<HTMLButtonElement>("[data-runtime-phone]").forEach((button) => {
    button.addEventListener("click", () => runtimePhone(button.dataset.runtimePhone as RuntimePhone));
  });
  overlay.querySelector<HTMLButtonElement>("[data-runtime-close]")?.addEventListener("click", close);
  overlay.querySelector<HTMLButtonElement>("[data-runtime-reply]")?.addEventListener("click", () => {
    phoneChecked = true;
    managerReplied = true;
    runtimeRelationships["ファミリーマート大宮店"] += 1;
    runtimePhone("messages");
    runtimeDialogue("ファミリーマート大宮店　店長", "今日の18:42、忘れないでください。");
  });
  overlay.querySelector<HTMLButtonElement>("[data-runtime-ignore]")?.addEventListener("click", () => {
    phoneChecked = true;
    runtimePhone("messages");
  });
  overlay.querySelector<HTMLButtonElement>("[data-runtime-photo]")?.addEventListener("click", () => runtimeToast("写真を保存しました"));
  overlay.querySelector<HTMLButtonElement>("[data-runtime-open-map]")?.addEventListener("click", () => {
    overlay.remove();
    runtimeMap();
  });
  overlay.querySelector<HTMLButtonElement>("[data-runtime-save]")?.addEventListener("click", runtimeSave);
  overlay.querySelector<HTMLButtonElement>("[data-runtime-call]")?.addEventListener("click", () => {
    runtimeRelationships["神谷 直人"] += 1;
    runtimeDialogue("神谷 直人", "お、起きてた？ 今日学校で話そ。");
  });
  overlay.querySelector<HTMLButtonElement>("[data-runtime-call-mother]")?.addEventListener("click", () => {
    runtimeRelationships["母"] += 1;
    runtimeDialogue("母", "どうしたの？");
  });
  overlay.querySelector<HTMLButtonElement>("[data-runtime-search]")?.addEventListener("click", () => {
    const input = overlay.querySelector<HTMLInputElement>("#runtime-search-input");
    const result = overlay.querySelector<HTMLDivElement>("#runtime-search-result");
    const query = input?.value.trim() || "";
    if (result) result.textContent = query ? `「${query}」についての検索結果。\n川越市内の情報が表示される。` : "検索ワードを入力してください。";
  });
  overlay.querySelector<HTMLButtonElement>("[data-runtime-music]")?.addEventListener("click", () => {
    runtimeToast("音楽を切り替えました");
  });
}

function runtimeMap() {
  runtimeOverlayClose();
  const overlay = document.createElement("div");
  overlay.className = "runtime-overlay runtime-map-overlay";
  overlay.innerHTML = `
    <div class="runtime-map">
      <header><button data-runtime-map-close>‹</button><div><b>KAWAGOE</b><span>SAITAMA / CITY MAP</span></div><strong>${runtimeTime()}</strong></header>
      <div class="runtime-map-canvas">
        <div class="map-river"></div><div class="map-route route-a"></div><div class="map-route route-b"></div><div class="map-route route-c"></div>
        <button class="runtime-map-pin p-home">自宅</button>
        <button class="runtime-map-pin p-school">山村学園高校</button>
        <button class="runtime-map-pin p-station">川越駅</button>
        <button class="runtime-map-pin p-honkawagoe">本川越駅</button>
        <button class="runtime-map-pin p-bell">時の鐘</button>
        <button class="runtime-map-pin p-sweets">菓子屋横丁</button>
      </div>
      <div class="runtime-map-footer">現在地：${runtimeScene === "outside" ? "自宅付近" : "自宅"}</div>
    </div>
  `;
  homeScreen.appendChild(overlay);
  overlay.querySelector("[data-runtime-map-close]")?.addEventListener("click", () => overlay.remove());
}

function runtimeBattle() {
  runtimeOverlayClose();
  runtimeBattle = true;
  enemyHp = 24;
  playerHp = 30;
  const overlay = document.createElement("div");
  overlay.className = "runtime-overlay runtime-battle-overlay";
  overlay.innerHTML = `
    <div class="runtime-battle">
      <div class="runtime-battle-top"><span>ANOMALY / 01</span><span>${runtimeTime()}</span></div>
      <div class="runtime-battle-stage">
        <div class="runtime-enemy"><div></div><b>名前のない違和感</b><i><em id="runtime-enemy-hp"></em></i></div>
        <div class="runtime-player"><div></div><b>${nameInput.value.trim() || "主人公"}</b><i><em id="runtime-player-hp"></em></i></div>
      </div>
      <div class="runtime-battle-log" id="runtime-battle-log">それは、そこにいるはずのないものだった。</div>
      <div class="runtime-battle-menu">
        <button data-battle-action="attack">ATTACK</button>
        <button data-battle-action="talk">TALK</button>
        <button data-battle-action="item">ITEM</button>
        <button data-battle-action="run">RUN</button>
      </div>
    </div>
  `;
  homeScreen.appendChild(overlay);
  runtimeRenderBattle(overlay);
  overlay.querySelectorAll<HTMLButtonElement>("[data-battle-action]").forEach((button) => {
    button.addEventListener("click", () => runtimeBattleAction(button.dataset.battleAction || "run", overlay));
  });
}

function runtimeRenderBattle(overlay: HTMLElement) {
  const enemy = overlay.querySelector<HTMLElement>("#runtime-enemy-hp");
  const player = overlay.querySelector<HTMLElement>("#runtime-player-hp");
  if (enemy) enemy.style.width = `${Math.max(0, enemyHp / 24 * 100)}%`;
  if (player) player.style.width = `${Math.max(0, playerHp / 30 * 100)}%`;
}

function runtimeBattleAction(action: string, overlay: HTMLElement) {
  const log = overlay.querySelector<HTMLDivElement>("#runtime-battle-log")!;
  if (action === "attack") {
    const damage = 6 + Math.floor(Math.random() * 5);
    enemyHp -= damage;
    log.textContent = `${nameInput.value.trim() || "主人公"}の攻撃。\n${damage}のダメージ。`;
  } else if (action === "talk") {
    runtimeRelationships["名前のない違和感"] = (runtimeRelationships["名前のない違和感"] || 0) + 1;
    log.textContent = "話しかけた。\nそれは、答えの代わりにこちらを見た。";
  } else if (action === "item") {
    playerHp = Math.min(30, playerHp + 8);
    log.textContent = "小さな飴を口にした。\nHPが回復した。";
  } else {
    runtimeBattle = false;
    overlay.remove();
    runtimeRenderScene();
    return;
  }

  if (enemyHp <= 0) {
    log.textContent += "\n\n違和感は、朝の光の中へ消えた。";
    runtimeBattle = false;
    window.setTimeout(() => {
      overlay.remove();
      runtimeRenderScene();
    }, 1200);
    runtimeRenderBattle(overlay);
    return;
  }

  const damage = 2 + Math.floor(Math.random() * 4);
  playerHp -= damage;
  log.textContent += `\n\n反応した。HP -${damage}`;
  if (playerHp <= 0) {
    playerHp = 30;
    runtimeScene = "outside";
    log.textContent += "\n\n気がつくと、自宅の近くに立っていた。";
    runtimeBattle = false;
    window.setTimeout(() => {
      overlay.remove();
      runtimeRenderScene();
    }, 1200);
  }
  runtimeRenderBattle(overlay);
}

function runtimeSceneMarkup() {
  const sceneText =
    runtimeScene === "bedroom" ? "自宅・自室" :
    runtimeScene === "kitchen" ? "自宅・キッチン" :
    runtimeScene === "hall" ? "自宅・廊下" : "川越市・自宅付近";

  let actions = "";
  if (runtimeScene === "bedroom") {
    actions = `
      <button class="runtime-hotspot window" data-runtime-action="window">窓を見る</button>
      <button class="runtime-hotspot kitchen" data-runtime-action="kitchen">キッチンへ</button>
      <button class="runtime-hotspot hall" data-runtime-action="hall">廊下へ</button>
    `;
  } else if (runtimeScene === "kitchen") {
    actions = `
      <button class="runtime-hotspot mother" data-runtime-action="mother">母に話しかける</button>
      <button class="runtime-hotspot breakfast" data-runtime-action="breakfast">朝食を食べる</button>
      <button class="runtime-hotspot hall" data-runtime-action="hall">廊下へ</button>
    `;
  } else if (runtimeScene === "hall") {
    actions = `
      <button class="runtime-hotspot kitchen" data-runtime-action="kitchen">キッチンへ</button>
      <button class="runtime-hotspot door" data-runtime-action="outside">玄関へ</button>
    `;
  } else {
    actions = `
      <button class="runtime-hotspot home" data-runtime-action="hall">自宅へ</button>
      <button class="runtime-hotspot walk" data-runtime-action="map">川越を歩く</button>
      <button class="runtime-hotspot anomaly" data-runtime-action="battle">違和感を調べる</button>
    `;
  }

  return `
    <div class="runtime-world runtime-${runtimeScene}">
      <div class="runtime-sunlight"></div>
      <div class="runtime-window"></div>
      <div class="runtime-cityline"></div>
      <div class="runtime-floor"></div>
      <div class="runtime-furniture bed"></div>
      <div class="runtime-furniture desk"></div>
      <div class="runtime-kitchen-counter"></div>
      <div class="runtime-character-silhouette"></div>
      <div class="runtime-scene-label"><b>川越市</b><span>${sceneText}</span></div>
      <div class="runtime-clock">${runtimeTime()}</div>
      <div class="runtime-hotspots">${actions}</div>
    </div>
    <div class="runtime-bottom">
      <div class="runtime-message">${runtimeScene === "outside" ? "いつもの街なのに、ほんの少しだけ何かがおかしい。" : "朝の静かな時間が流れている。"}</div>
      <div class="runtime-bottom-actions">
        <button data-runtime-phone-open>PHONE</button>
        <button data-runtime-map-open>MAP</button>
        <button data-runtime-save-open>SAVE</button>
      </div>
    </div>
  `;
}

function runtimeRenderScene() {
  runtimeOverlayClose();
  homeScreen.innerHTML = runtimeSceneMarkup();
  homeScreen.classList.add("runtime-home");
  homeScreen.querySelector("[data-runtime-phone-open]")?.addEventListener("click", () => runtimePhone("messages"));
  homeScreen.querySelector("[data-runtime-map-open]")?.addEventListener("click", runtimeMap);
  homeScreen.querySelector("[data-runtime-save-open]")?.addEventListener("click", runtimeSave);

  homeScreen.querySelectorAll<HTMLButtonElement>("[data-runtime-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.runtimeAction;
      if (action === "window") {
        runtimeDialogue("—", "窓の外には、川越の朝の街並みが見える。\nいつもと変わらない。……たぶん。");
      } else if (action === "kitchen") {
        runtimeScene = "kitchen"; runtimeRenderScene();
      } else if (action === "hall") {
        runtimeScene = "hall"; runtimeRenderScene();
      } else if (action === "outside") {
        runtimeScene = "outside"; runtimeRenderScene();
      } else if (action === "mother") {
        runtimeRelationships["母"] += 1;
        runtimeDialogue("母", breakfastDone ? "今日は少し早いね。気をつけて行ってらっしゃい。" : "おはよう。朝ごはん、そこに置いてあるから。", [
          { label: "「ありがとう」", action: () => { runtimeRelationships["母"] += 1; } },
          { label: "黙っている", action: () => {} }
        ]);
      } else if (action === "breakfast") {
        breakfastDone = true;
        gameMinutes += 8;
        runtimeDialogue("母", "……いただきます。");
      } else if (action === "map") {
        runtimeMap();
      } else if (action === "battle") {
        runtimeBattle();
      }
    });
  });
}

function runtimeMode(mode: "opening" | "explore") {
  runtimeOverlayClose();
  if (mode === "opening") {
    homeScreen.classList.remove("runtime-home");
    homeScreen.innerHTML = `
      <div class="runtime-opening">
        <div class="runtime-opening-art">
          <div class="runtime-opening-window"></div>
          <div class="runtime-opening-bed"></div>
          <div class="runtime-opening-desk"></div>
          <div class="runtime-opening-light"></div>
        </div>
        <div class="runtime-opening-copy">
          <span>川越市 · 自宅 / ${runtimeTime()}</span>
          <h2>朝。</h2>
          <p>${nameInput.value.trim() || "主人公"}は、ゆっくりと目を覚ました。</p>
          <button data-runtime-wake>目を覚ます</button>
        </div>
      </div>
    `;
    homeScreen.querySelector("[data-runtime-wake]")?.addEventListener("click", () => runtimeMode("explore"));
  } else {
    runtimeRenderScene();
  }
}

function mountRuntime() {
  if (runtimeMounted) return;
  runtimeMounted = true;
  runtimeMode("opening");
}

// Extend the existing start flow without replacing the original screen system.
nameStart.addEventListener("click", () => {
  window.setTimeout(() => {
    runtimeMounted = false;
    mountRuntime();
  }, 620);
});

const runtimeNewGameButton = document.querySelector<HTMLButtonElement>("[data-index=\"0\"]");
runtimeNewGameButton?.addEventListener("click", () => {
  runtimeMounted = false;
  window.setTimeout(() => mountRuntime(), 620);
});

const runtimeLoadButton = document.querySelector<HTMLButtonElement>("[data-index=\"1\"]");
runtimeLoadButton?.addEventListener("click", () => {
  window.setTimeout(() => runtimeLoad(), 50);
});

window.setInterval(() => {
  if (!runtimeMounted || !homeScreen.classList.contains("hidden")) {
    if (runtimeMounted) {
      const clock = homeScreen.querySelector<HTMLElement>(".runtime-clock");
      if (clock) clock.textContent = runtimeTime();
    }
  }
  if (!eveningNotification && gameMinutes >= 18 * 60 + 42 && runtimeMounted) {
    eveningNotification = true;
    runtimeToast("18:42 — 新しい通知があります");
    if (runtimeScene !== "outside") {
      runtimeDialogue("通知", "18:42。スマートフォンが短く震えた。", [
        { label: "確認する", action: () => runtimePhone("messages") },
        { label: "あとで見る", action: () => {} }
      ]);
    }
  }
}, 250);

