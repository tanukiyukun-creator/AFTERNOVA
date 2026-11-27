import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App root was not found.");

app.innerHTML = `
  <main class="game">
    <canvas id="world"></canvas>
    <div class="vignette"></div>
    <div class="hud">
      <div class="brand">AFTERNOVA</div>
      <div class="clock" id="clock">07:04</div>
    </div>
    <div class="toast" id="toast"></div>
    <section class="dialogue hidden" id="dialogue">
      <div class="name" id="dialogue-name"></div>
      <div class="text" id="dialogue-text"></div>
    </section>
    <button class="phone-button" id="phone-button" aria-label="スマートフォン">☎</button>
    <section class="phone" id="phone">
      <header class="phone-head">
        <div class="phone-title">PHONE</div>
        <button class="close" id="phone-close" aria-label="閉じる">×</button>
      </header>
      <article class="message">
        <div class="sender">ファミリーマート大宮店　店長</div>
        <div class="body" id="message-body">岡本くん、突然申し訳ないんだけど今日シフトはいれる？</div>
      </article>
      <div class="reply">
        <button id="reply-button">返信する</button>
      </div>
    </section>
  </main>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#world")!;
const glContext = canvas.getContext("webgl", { antialias: true, alpha: false });
if (!glContext) throw new Error("WebGL is not supported.");
const gl: WebGLRenderingContext = glContext;

const vertexShaderSource = `
attribute vec2 a_position;
uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_scale;
void main(){
  vec2 p = (a_position * u_scale + u_translation) / u_resolution * 2.0 - 1.0;
  gl_Position = vec4(p.x, -p.y, 0.0, 1.0);
}`;

const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main(){ gl_FragColor = u_color; }`;

function shader(type: number, source: string): WebGLShader {
  const s = gl.createShader(type);
  if (!s) throw new Error("Shader creation failed.");
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s) ?? "Shader compile failed.");
  }
  return s;
}

const program = gl.createProgram();
if (!program) throw new Error("Program creation failed.");
gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexShaderSource));
gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentShaderSource));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(program) ?? "Program link failed.");
}
gl.useProgram(program);

const positionBuffer = gl.createBuffer();
if (!positionBuffer) throw new Error("Buffer creation failed.");
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]), gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "a_position");
const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
const translationLocation = gl.getUniformLocation(program, "u_translation");
const scaleLocation = gl.getUniformLocation(program, "u_scale");
const colorLocation = gl.getUniformLocation(program, "u_color");

gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

type Rect = { x:number; y:number; w:number; h:number; color:[number,number,number,number] };

function rect(r: Rect) {
  gl.uniform2f(translationLocation, r.x, r.y);
  gl.uniform2f(scaleLocation, r.w, r.h);
  gl.uniform4fv(colorLocation, r.color);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

let player = { x: 0.5, y: 0.59 };
const keys = new Set<string>();
let last = performance.now();

const toast = document.querySelector<HTMLDivElement>("#toast")!;
const phone = document.querySelector<HTMLElement>("#phone")!;
const phoneButton = document.querySelector<HTMLButtonElement>("#phone-button")!;
const phoneClose = document.querySelector<HTMLButtonElement>("#phone-close")!;
const replyButton = document.querySelector<HTMLButtonElement>("#reply-button")!;
const messageBody = document.querySelector<HTMLDivElement>("#message-body")!;
const clock = document.querySelector<HTMLDivElement>("#clock")!;
const dialogue = document.querySelector<HTMLElement>("#dialogue")!;
const dialogueName = document.querySelector<HTMLDivElement>("#dialogue-name")!;
const dialogueText = document.querySelector<HTMLDivElement>("#dialogue-text")!;

let replySent = false;
let gameMinutes = 7 * 60 + 4;

function showToast(text: string) {
  toast.textContent = text;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2300);
}

function showDialogue(name: string, text: string) {
  dialogueName.textContent = name;
  dialogueText.textContent = text;
  dialogue.classList.remove("hidden");
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener("resize", resize);
resize();

window.addEventListener("keydown", e => {
  keys.add(e.key.toLowerCase());
  if (e.key.toLowerCase() === "p") phone.classList.toggle("open");
});
window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));

phoneButton.onclick = () => phone.classList.add("open");
phoneClose.onclick = () => phone.classList.remove("open");

replyButton.onclick = () => {
  if (replySent) return;
  replySent = true;
  messageBody.textContent = "今日の18:42、忘れないでください";
  replyButton.textContent = "返信済み";
  replyButton.disabled = true;
  showToast("メッセージを送信しました");
};

function update(dt: number) {
  const speed = 0.00022 * dt;
  if (keys.has("w") || keys.has("arrowup")) player.y -= speed;
  if (keys.has("s") || keys.has("arrowdown")) player.y += speed;
  if (keys.has("a") || keys.has("arrowleft")) player.x -= speed;
  if (keys.has("d") || keys.has("arrowright")) player.x += speed;
  player.x = Math.max(0.12, Math.min(0.88, player.x));
  player.y = Math.max(0.16, Math.min(0.84, player.y));

  gameMinutes += dt / 60000 * 24 * 60;
  const total = Math.floor(gameMinutes) % (24 * 60);
  clock.textContent = `${String(Math.floor(total / 60)).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`;
}

function render() {
  const w = canvas.width, h = canvas.height;
  gl.clearColor(0.035, 0.027, 0.047, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform2f(resolutionLocation, w, h);

  const scale = Math.min(w / 1280, h / 720);
  const ox = (w - 1280 * scale) / 2;
  const oy = (h - 720 * scale) / 2;
  gl.viewport(0, 0, w, h);

  const R=(x:number,y:number,ww:number,hh:number,c:[number,number,number,number]):Rect=>({x:ox+x*scale,y:oy+y*scale,w:ww*scale,h:hh*scale,color:c});

  rect(R(0,0,1280,720,[0.055,0.043,0.075,1]));
  rect(R(0,90,1280,540,[0.12,0.105,0.14,1]));

  // Kawagoe-inspired morning town block layout.
  rect(R(0,250,1280,180,[0.16,0.15,0.17,1]));
  rect(R(0,330,1280,40,[0.09,0.085,0.10,1]));
  rect(R(590,90,100,540,[0.09,0.085,0.10,1]));
  rect(R(30,125,300,115,[0.20,0.19,0.20,1]));
  rect(R(350,125,190,115,[0.23,0.21,0.22,1]));
  rect(R(730,125,220,115,[0.19,0.18,0.20,1]));
  rect(R(980,125,270,115,[0.22,0.20,0.21,1]));
  rect(R(30,470,260,120,[0.19,0.18,0.20,1]));
  rect(R(330,470,210,120,[0.22,0.20,0.22,1]));
  rect(R(720,470,250,120,[0.18,0.17,0.19,1]));
  rect(R(1010,470,240,120,[0.21,0.19,0.20,1]));

  // Crosswalk.
  for(let i=0;i<8;i++) rect(R(520+i*32,316,18,68,[0.72,0.70,0.72,0.65]));

  // Utility poles / shadows.
  rect(R(1080,80,7,210,[0.08,0.07,0.08,1]));
  rect(R(1060,90,50,5,[0.08,0.07,0.08,1]));

  // Player.
  const px=ox+player.x*1280*scale;
  const py=oy+player.y*720*scale;
  rect({x:px-10*scale,y:py-18*scale,w:20*scale,h:36*scale,color:[0.72,0.58,0.82,1]});
  rect({x:px-8*scale,y:py-30*scale,w:16*scale,h:14*scale,color:[0.86,0.78,0.84,1]});
}

function loop(now:number){
  const dt=Math.min(now-last,50);
  last=now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

showDialogue("母親", "「おはよう。今日は学校、早いんじゃなかった？」");
