/* ============ DevBox 工具箱脚本 ============ */
"use strict";

/* ---------- 工具定义 ---------- */
const TOOLS = [
  { id: "json",      name: "JSON 格式化", icon: "{ }", desc: "格式化、压缩、校验、排序与转义 JSON 数据", group: "数据格式" },
  { id: "base64",    name: "Base64 编解码", icon: "🔐", desc: "文本与 Base64 互转，支持中文与 URL 安全模式", group: "编码转换" },
  { id: "url",       name: "URL 编解码", icon: "🔗", desc: "encodeURIComponent / encodeURI 与解码", group: "编码转换" },
  { id: "hash",      name: "哈希计算", icon: "#", desc: "SHA-1 / SHA-256 / SHA-384 / SHA-512 哈希", group: "编码转换" },
  { id: "timestamp", name: "时间戳转换", icon: "🕐", desc: "Unix 时间戳与日期时间双向转换", group: "时间日期" },
  { id: "color",     name: "颜色转换器", icon: "🎨", desc: "HEX / RGB / HSL 互转与色值速查", group: "设计前端" },
  { id: "regex",     name: "正则测试", icon: ".*", desc: "在线编写并实时测试正则表达式", group: "开发调试" },
  { id: "password",  name: "密码生成器", icon: "🔑", desc: "生成高强度随机密码，可配置字符集", group: "随机生成" },
  { id: "uuid",      name: "UUID / NanoID", icon: "🆔", desc: "批量生成 UUID v4 与 NanoID", group: "随机生成" },
  { id: "text",      name: "文本处理", icon: "📝", desc: "大小写、去重、排序、空白清理等批量操作", group: "文本处理" },
  { id: "convert",   name: "单位换算", icon: "📐", desc: "长度、重量、温度、数据量常用单位换算", group: "日常实用" },
];

/* ---------- DOM 辅助 ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2000);
}

async function copyText(text) {
  if (!text) return showToast("没有可复制的内容");
  try {
    await navigator.clipboard.writeText(text);
    showToast("已复制到剪贴板");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showToast("已复制到剪贴板");
  }
}

/* ---------- 主题 ---------- */
(function initTheme() {
  const saved = localStorage.getItem("devbox-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
})();
$("#themeBtn").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("devbox-theme", next);
});

/* ---------- 导航与路由 ---------- */
const nav = $("#toolNav");
const groups = {};
TOOLS.forEach((t) => { (groups[t.group] = groups[t.group] || []).push(t); });

let navHtml = `<button class="nav-item active" data-page="home"><span class="nav-icon">🏠</span>首页</button>`;
for (const [g, items] of Object.entries(groups)) {
  navHtml += `<div class="nav-group-title">${g}</div>`;
  items.forEach((t) => {
    navHtml += `<button class="nav-item" data-page="${t.id}"><span class="nav-icon">${t.icon}</span>${t.name}</button>`;
  });
}
nav.innerHTML = navHtml;

/* 首页卡片 */
$("#toolGrid").innerHTML = TOOLS.map((t) => `
  <div class="tool-card" data-page="${t.id}">
    <div class="tc-icon">${t.icon}</div>
    <h3>${t.name}</h3>
    <p>${t.desc}</p>
  </div>`).join("");

function goto(pageId) {
  $$(".page").forEach((p) => p.classList.remove("active"));
  const target = $(`#page-${pageId}`) || $("#page-home");
  target.classList.add("active");
  $$(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.page === pageId));
  closeSidebar();
  if (location.hash !== `#/${pageId}`) history.replaceState(null, "", pageId === "home" ? " " : `#/${pageId}`);
  window.scrollTo({ top: 0 });
}
document.addEventListener("click", (e) => {
  const item = e.target.closest("[data-page]");
  if (item) goto(item.dataset.page);
});
const initialPage = (location.hash.match(/^#\/([\w-]+)/) || [])[1];
if (initialPage && $(`#page-${initialPage}`)) goto(initialPage);

/* ---------- 搜索 ---------- */
$("#searchInput").addEventListener("input", (e) => {
  const kw = e.target.value.trim().toLowerCase();
  $$(".tool-card").forEach((c) => {
    const t = TOOLS.find((t) => t.id === c.dataset.page);
    const hit = !kw || t.name.toLowerCase().includes(kw) || t.desc.toLowerCase().includes(kw);
    c.style.display = hit ? "" : "none";
  });
});

/* ---------- 移动端侧边栏 ---------- */
const sidebar = $("#sidebar"), overlay = $("#overlay");
function openSidebar() { sidebar.classList.add("open"); overlay.classList.add("show"); }
function closeSidebar() { sidebar.classList.remove("open"); overlay.classList.remove("show"); }
$("#menuBtn").addEventListener("click", () => sidebar.classList.contains("open") ? closeSidebar() : openSidebar());
overlay.addEventListener("click", closeSidebar);

/* ================= JSON 工具 ================= */
function sortKeys(obj) {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj && typeof obj === "object") {
    return Object.keys(obj).sort().reduce((acc, k) => { acc[k] = sortKeys(obj[k]); return acc; }, {});
  }
  return obj;
}
$$("[data-json]").forEach((btn) => btn.addEventListener("click", () => {
  const input = $("#jsonInput"), output = $("#jsonOutput"), err = $("#jsonError");
  err.classList.add("hidden");
  const act = btn.dataset.json;
  if (act === "clear") { input.value = output.value = ""; $("#jsonStats").textContent = ""; return; }
  const text = input.value.trim();
  if (!text) return showToast("请先输入内容");
  try {
    if (act === "escape") {
      output.value = JSON.stringify(JSON.stringify(JSON.parse(text))).slice(1, -1);
    } else if (act === "unescape") {
      output.value = JSON.stringify(JSON.parse(`"${text.replace(/^"|"$/g, "")}"`), null, 2);
    } else {
      const obj = JSON.parse(text);
      if (act === "format") output.value = JSON.stringify(obj, null, 2);
      if (act === "minify") output.value = JSON.stringify(obj);
      if (act === "sort") output.value = JSON.stringify(sortKeys(obj), null, 2);
    }
    const bytes = new Blob([output.value]).size;
    $("#jsonStats").textContent = `· ${output.value.length} 字符 / ${bytes} 字节`;
  } catch (ex) {
    err.textContent = "❌ JSON 解析失败：" + ex.message;
    err.classList.remove("hidden");
  }
}));

/* ================= Base64 ================= */
$$("[data-b64]").forEach((btn) => btn.addEventListener("click", () => {
  const input = $("#b64Input"), output = $("#b64Output"), err = $("#b64Error");
  err.classList.add("hidden");
  const act = btn.dataset.b64;
  if (act === "clear") { input.value = output.value = ""; return; }
  const text = input.value;
  if (!text) return showToast("请先输入内容");
  try {
    const urlSafe = $("#b64UrlSafe").checked, utf8 = $("#b64Utf8").checked;
    if (act === "encode") {
      const bytes = utf8 ? new TextEncoder().encode(text) : Uint8Array.from(text, (c) => c.charCodeAt(0));
      let bin = "";
      bytes.forEach((b) => bin += String.fromCharCode(b));
      let b64 = btoa(bin);
      if (urlSafe) b64 = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      output.value = b64;
    } else {
      let b64 = text.trim().replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const bin = atob(b64);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      output.value = utf8 ? new TextDecoder().decode(bytes) : String.fromCharCode(...bytes);
    }
  } catch (ex) {
    err.textContent = "❌ 转换失败：输入不是有效的 Base64 字符串";
    err.classList.remove("hidden");
  }
}));

/* ================= URL 编解码 ================= */
$$("[data-url]").forEach((btn) => btn.addEventListener("click", () => {
  const input = $("#urlInput"), output = $("#urlOutput"), err = $("#urlError");
  err.classList.add("hidden");
  const act = btn.dataset.url;
  if (act === "clear") { input.value = output.value = ""; return; }
  const text = input.value;
  if (!text) return showToast("请先输入内容");
  try {
    if (act === "encode") output.value = encodeURIComponent(text);
    if (act === "encodeFull") output.value = encodeURI(text);
    if (act === "decode") output.value = decodeURIComponent(text);
  } catch (ex) {
    err.textContent = "❌ 解码失败：" + ex.message;
    err.classList.remove("hidden");
  }
}));

/* ================= 时间戳 ================= */
function pad(n) { return String(n).padStart(2, "0"); }
function fmtDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function tsTable(d) {
  const rows = [
    ["本地时间", fmtDate(d)],
    ["UTC 时间", d.toISOString().replace("T", " ").slice(0, 19)],
    ["ISO 8601", d.toISOString()],
    ["Unix 秒", Math.floor(d.getTime() / 1000)],
    ["Unix 毫秒", d.getTime()],
    ["星期", "日一二三四五六"[d.getDay()]],
    ["今年第几天", Math.ceil((d - new Date(d.getFullYear(), 0, 0)) / 864e5)],
  ];
  return rows.map(([k, v]) => `
    <div class="result-row">
      <span class="rk">${k}</span>
      <span class="rv">${v}<button class="copy-btn" data-copy="${v}">复制</button></span>
    </div>`).join("");
}
setInterval(() => {
  const d = new Date();
  $("#nowLocal").textContent = fmtDate(d);
  $("#nowIso").textContent = d.toISOString();
  $("#nowSec").textContent = Math.floor(d.getTime() / 1000);
  $("#nowMs").textContent = d.getTime();
}, 1000);

$("#tsToBtn").addEventListener("click", () => {
  const raw = $("#tsInput").value.trim();
  if (!raw) return showToast("请输入时间戳");
  let n = Number(raw);
  if (!/^\d+$/.test(raw) || isNaN(n)) return showToast("时间戳格式不正确");
  if (raw.length <= 11) n *= 1000; // 秒级
  if (n < 0 || n > 32503680000000) return showToast("时间戳超出合理范围");
  $("#tsResult").innerHTML = tsTable(new Date(n));
});
$("#dateToBtn").addEventListener("click", () => {
  const v = $("#dateInput").value;
  if (!v) return showToast("请先选择日期时间");
  const d = new Date(v);
  $("#dateResult").innerHTML = tsTable(d);
});

/* ================= 颜色转换 ================= */
function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(hex)) throw new Error("bad hex");
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function parseColor(str) {
  str = str.trim();
  if (/^#?[0-9a-f]{3}$|^#?[0-9a-f]{6}$/i.test(str)) return hexToRgb(str);
  const m = str.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3] };
  throw new Error("无法识别颜色格式");
}
function renderColor(rgb) {
  const { r, g, b } = rgb;
  const hsl = rgbToHsl(r, g, b);
  const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  $("#colorPreview").style.background = hex;
  const rows = [
    ["HEX", hex.toUpperCase()],
    ["RGB", `rgb(${r}, ${g}, ${b})`],
    ["HSL", `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`],
    ["亮度", `${(lum * 100).toFixed(1)}%（${lum > 0.55 ? "浅色，宜配深字" : "深色，宜配白字"}）`],
    ["CSS 变量", `--brand: ${hex};`],
  ];
  $("#colorResult").innerHTML = rows.map(([k, v]) => `
    <div class="result-row">
      <span class="rk">${k}</span>
      <span class="rv">${v}<button class="copy-btn" data-copy="${v}">复制</button></span>
    </div>`).join("");
}
function updateColor(str) {
  try {
    const rgb = parseColor(str);
    renderColor(rgb);
    $("#colorPicker").value = "#" + [rgb.r, rgb.g, rgb.b].map((v) => v.toString(16).padStart(2, "0")).join("");
  } catch {
    showToast("无法识别颜色格式，请输入 #hex 或 rgb(...)");
  }
}
$("#colorPicker").addEventListener("input", (e) => { $("#colorInput").value = e.target.value; updateColor(e.target.value); });
$("#colorInput").addEventListener("input", (e) => updateColor(e.target.value));
updateColor("#3b82f6");
$$(".gradient-item").forEach((g) => g.addEventListener("click", () => {
  const css = g.style.background;
  const hexes = css.match(/#[0-9a-f]{6}/gi) || [];
  copyText(`background: ${css};`);
  showToast(`已复制渐变 CSS：${hexes.join(" → ")}`);
}));

/* ================= 正则测试 ================= */
function runRegex() {
  const pattern = $("#regexPattern").value;
  const flags = $("#regexFlags").value;
  const text = $("#regexText").value;
  const box = $("#regexHighlight"), msg = $("#regexMsg");
  if (!pattern) { box.innerHTML = text ? escapeHtml(text) : ""; msg.textContent = "输入正则后自动匹配"; return; }
  let re;
  try { re = new RegExp(pattern, flags); }
  catch (ex) { msg.textContent = "❌ 正则语法错误：" + ex.message; box.innerHTML = ""; return; }
  if (!text) { box.innerHTML = ""; msg.textContent = "请输入测试文本"; return; }

  let count = 0, html = "", last = 0;
  if (flags.includes("g")) {
    let m;
    while ((m = re.exec(text)) !== null) {
      count++;
      html += escapeHtml(text.slice(last, m.index)) + `<mark>${escapeHtml(m[0])}</mark>`;
      last = m.index + m[0].length;
      if (m[0] === "") re.lastIndex++; // 防止空匹配死循环
      if (count > 5000) break;
    }
    html += escapeHtml(text.slice(last));
  } else {
    const m = text.match(re);
    if (m) { count = 1; html = escapeHtml(text.slice(0, m.index)) + `<mark>${escapeHtml(m[0])}</mark>` + escapeHtml(text.slice(m.index + m[0].length)); }
    else html = escapeHtml(text);
  }
  box.innerHTML = html || "&nbsp;";
  msg.textContent = `✅ 匹配到 ${count} 处${count && !flags.includes("g") ? "（添加 g 标志匹配全部）" : ""}`;
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
["#regexPattern", "#regexFlags", "#regexText"].forEach((sel) =>
  $(sel).addEventListener("input", runRegex));
runRegex();

/* ================= 密码生成 ================= */
$("#pwdLen").addEventListener("input", (e) => $("#pwdLenVal").textContent = e.target.value);
function generatePwd() {
  const len = +$("#pwdLen").value;
  let pool = "";
  if ($("#pwdUpper").checked) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if ($("#pwdLower").checked) pool += "abcdefghijklmnopqrstuvwxyz";
  if ($("#pwdNum").checked) pool += "0123456789";
  if ($("#pwdSym").checked) pool += "!@#$%^&*()-_=+[]{};:,.?/";
  if ($("#pwdNoAmb").checked) pool = pool.replace(/[0O1lI|]/g, "");
  if (!pool) return showToast("请至少选择一种字符集");
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let pwd = "";
  for (let i = 0; i < len; i++) pwd += pool[arr[i] % pool.length];
  $("#pwdOutput").textContent = pwd;
  // 强度估算：熵
  const entropy = Math.round(len * Math.log2(pool.length));
  const bar = $("#pwdStrength").querySelector("i");
  const pct = Math.min(100, entropy / 128 * 100);
  bar.style.width = pct + "%";
  bar.style.background = entropy < 45 ? "var(--danger)" : entropy < 75 ? "var(--warning)" : "var(--success)";
}
$("#pwdGenBtn").addEventListener("click", generatePwd);
$("#pwdCopyBtn").addEventListener("click", () => copyText($("#pwdOutput").textContent));
generatePwd();

/* ================= UUID / NanoID ================= */
function uuidv4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}
function nanoid(size = 21) {
  const alphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict";
  const arr = new Uint8Array(size);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => alphabet[b % alphabet.length]).join("");
}
function renderList(items) {
  $("#uuidList").innerHTML = items.map((id) => `
    <div class="list-item">
      <code>${id}</code>
      <button class="copy-btn" data-copy="${id}">复制</button>
    </div>`).join("");
}
$("#uuidGenBtn").addEventListener("click", () => renderList(Array.from({ length: 10 }, uuidv4)));
$("#nanoidGenBtn").addEventListener("click", () => renderList(Array.from({ length: 10 }, () => nanoid())));
$("#uuidClearBtn").addEventListener("click", () => $("#uuidList").innerHTML = "");
renderList(Array.from({ length: 5 }, uuidv4));

/* ================= 哈希 ================= */
$("#hashBtn").addEventListener("click", async () => {
  const text = $("#hashInput").value;
  if (!text) return showToast("请先输入文本");
  const algos = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
  const rows = [];
  for (const algo of algos) {
    const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
    const hex = Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
    rows.push([algo, hex]);
  }
  $("#hashResult").innerHTML = rows.map(([k, v]) => `
    <div class="result-row">
      <span class="rk">${k}</span>
      <span class="rv">${v}<button class="copy-btn" data-copy="${v}">复制</button></span>
    </div>`).join("");
});

/* ================= 单位换算 ================= */
const UNITS = {
  "长度": { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254, nmi: 1852 },
  "重量": { kg: 1, g: 0.001, mg: 1e-6, t: 1000, lb: 0.45359237, oz: 0.028349523 },
  "数据量": { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, bit: 0.125 },
};
const TEMPS = ["°C 摄氏", "°F 华氏", "K 开尔文"];
let cvCategory = "长度";
function fillUnits() {
  const from = $("#cvFrom"), to = $("#cvTo");
  from.innerHTML = ""; to.innerHTML = "";
  if (cvCategory === "温度") {
    TEMPS.forEach((t, i) => {
      from.insertAdjacentHTML("beforeend", `<option value="${i}">${t}</option>`);
      to.insertAdjacentHTML("beforeend", `<option value="${i}">${t}</option>`);
    });
    from.value = 0; to.value = 1;
  } else {
    const units = UNITS[cvCategory];
    Object.keys(units).forEach((u) => {
      from.insertAdjacentHTML("beforeend", `<option value="${u}">${u}</option>`);
      to.insertAdjacentHTML("beforeend", `<option value="${u}">${u}</option>`);
    });
    from.value = Object.keys(units)[0];
    to.value = Object.keys(units)[1];
  }
}
const cvCatSel = document.createElement("select");
cvCatSel.className = "btn";
cvCatSel.style.flex = "0 0 auto";
cvCatSel.style.padding = "8px 12px";
cvCatSel.innerHTML = ["长度", "重量", "数据量", "温度"].map((c) => `<option>${c}</option>`).join("");
$("#cvValue").parentElement.insertBefore(cvCatSel, $("#cvValue"));
cvCatSel.addEventListener("change", (e) => { cvCategory = e.target.value; fillUnits(); });
fillUnits();

function convertTemp(v, from, to) {
  let c; // 全部先转摄氏
  if (from === 0) c = v;
  else if (from === 1) c = (v - 32) * 5 / 9;
  else c = v - 273.15;
  if (to === 0) return c;
  if (to === 1) return c * 9 / 5 + 32;
  return c + 273.15;
}
$("#cvBtn").addEventListener("click", () => {
  const v = parseFloat($("#cvValue").value);
  if (isNaN(v)) return showToast("请输入有效数字");
  let result;
  if (cvCategory === "温度") {
    result = convertTemp(v, +$("#cvFrom").value, +$("#cvTo").value);
  } else {
    const units = UNITS[cvCategory];
    result = v * units[$("#cvFrom").value] / units[$("#cvTo").value];
  }
  const fromLabel = $("#cvFrom").selectedOptions[0].text;
  const toLabel = $("#cvTo").selectedOptions[0].text;
  const formatted = Number(result.toPrecision(12)).toLocaleString("zh-CN", { maximumFractionDigits: 10 });
  $("#cvResult").innerHTML = `
    <div class="result-row">
      <span class="rk">换算结果</span>
      <span class="rv">${v} ${fromLabel} = ${formatted} ${toLabel}</span>
    </div>`;
});

/* ================= 文本处理 ================= */
$("#textInput").addEventListener("input", (e) => {
  const t = e.target.value;
  const lines = t ? t.split("\n").length : 0;
  $("#textStats").textContent = `· ${t.length} 字符 · ${lines} 行 · ${new Blob([t]).size} 字节`;
});
$$("[data-text]").forEach((btn) => btn.addEventListener("click", () => {
  const input = $("#textInput"), output = $("#textOutput");
  const act = btn.dataset.text;
  if (act === "clear") { input.value = output.value = ""; $("#textStats").textContent = ""; return; }
  let t = input.value;
  if (!t) return showToast("请先输入文本");
  let lines;
  switch (act) {
    case "upper": output.value = t.toUpperCase(); break;
    case "lower": output.value = t.toLowerCase(); break;
    case "trim": output.value = t.trim(); break;
    case "trimLines": output.value = t.split("\n").map((l) => l.trim()).join("\n"); break;
    case "dedup": output.value = [...new Set(t.split("\n"))].join("\n"); break;
    case "sort": lines = t.split("\n").sort((a, b) => a.localeCompare(b, "zh-Hans-CN")); output.value = lines.join("\n"); break;
    case "reverse": output.value = t.split("\n").reverse().join("\n"); break;
    case "nl2comma": output.value = t.split("\n").map((l) => l.trim()).filter(Boolean).join(", "); break;
  }
}));

/* ================= 全局复制按钮代理 ================= */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".copy-btn");
  if (btn && btn.dataset.copy) copyText(btn.dataset.copy);
});

/* ================= 输出框快捷复制 ================= */
$$("textarea[readonly]").forEach((ta) => {
  ta.addEventListener("click", () => { if (ta.value) copyText(ta.value); });
  ta.title = "点击复制内容";
});
