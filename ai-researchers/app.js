const people = [...window.peoplePart1, ...window.peoplePart2, ...window.peoplePart3];

const labels = {
  "AI 算法研究":"算法研究",
  "AI 系统与基础设施":"AI 系统与基础设施",
  "具身智能与机器人":"具身智能与机器人",
  "芯片与计算架构":"芯片与计算架构"
};

const state = { query:"", type:"全部", sort:"default" };
const filtersEl = document.getElementById("filters");
const gridEl = document.getElementById("grid");
const emptyEl = document.getElementById("empty");
const resultCountEl = document.getElementById("resultCount");
const modal = document.getElementById("modal");

function esc(v="") {
  return String(v ?? "").replace(/[&<>"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[s]));
}
function urls(v) {
  if (!v) return [];
  return String(v).match(/https?:\/\/[^\s]+/gi) || [];
}
function isWechat(u="") {
  return /mp\.weixin\.qq\.com/i.test(u);
}
function linkLabel(u="") {
  if (isWechat(u)) return "微信文章 ↗";
  if (/notion\.site/i.test(u)) return "项目页面 ↗";
  return "打开链接 ↗";
}
function linkify(v) {
  if (!v) return "";
  return String(v).split(/(https?:\/\/[^\s]+)/gi).map(part => {
    if (/^https?:\/\//i.test(part)) {
      return `<a class="small-link" href="${esc(part)}" target="_blank" rel="noopener">${linkLabel(part)}</a>`;
    }
    return esc(part).replace(/\n/g, "<br>");
  }).join("");
}
function searchable(p) {
  return Object.values(p).filter(Boolean).join(" ").toLowerCase();
}
function renderFilters() {
  const types = ["全部", ...new Set(people.map(p=>p["类型"]).filter(Boolean))];
  filtersEl.innerHTML = types.map(t => {
    const count = t==="全部" ? people.length : people.filter(p=>p["类型"]===t).length;
    return `<button class="chip ${state.type===t?"active":""}" data-type="${esc(t)}">${esc(t)} · ${count}</button>`;
  }).join("");
  filtersEl.querySelectorAll(".chip").forEach(btn => btn.addEventListener("click", () => {
    state.type = btn.dataset.type;
    renderFilters();
    render();
  }));
}
function getVisible() {
  let arr = people.filter(p => {
    const typeOk = state.type==="全部" || p["类型"]===state.type;
    const qOk = !state.query || searchable(p).includes(state.query);
    return typeOk && qOk;
  });
  if (state.sort==="name") arr.sort((a,b)=>String(a["姓名"]).localeCompare(String(b["姓名"]),"zh-CN"));
  if (state.sort==="type") arr.sort((a,b)=>String(a["类型"]).localeCompare(String(b["类型"]),"zh-CN") || String(a["姓名"]).localeCompare(String(b["姓名"]),"zh-CN"));
  return arr;
}
function card(p, idx) {
  const zhihu = p["知乎页面"];
  const reports = urls(p["过往报道链接（如有）"]);
  const noteUrls = urls(p["个人意愿（留言）"]);
  const wechat = noteUrls.find(isWechat);
  const hasNote = !!p["个人意愿（留言）"];
  return `
  <article class="card" tabindex="0" data-index="${idx}" aria-label="查看 ${esc(p["姓名"])} 详情">
    <div class="card-top">
      <div>
        <h3 class="name">${esc(p["姓名"])}</h3>
        <p class="identity">${esc(p["身份"] || "身份信息待补充")}</p>
      </div>
      <span class="badge">${esc(labels[p["类型"]] || p["类型"] || "未分类")}</span>
    </div>
    <div class="angle"><strong>值得报道的点</strong>${esc(p["值得报道的点"] || "暂无")}</div>
    <div class="card-footer">
      <div class="linkset">
        ${zhihu ? `<a class="small-link" href="${esc(zhihu)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">知乎主页 ↗</a>` : ""}
        ${reports.length ? `<a class="small-link" href="${esc(reports[0])}" target="_blank" rel="noopener" onclick="event.stopPropagation()">过往报道 ↗</a>` : ""}
        ${wechat ? `<a class="small-link" href="${esc(wechat)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">微信文章 ↗</a>` : hasNote ? `<span class="small-link" title="有采访意愿或备注"><span class="note-dot"></span>采访备注</span>` : ""}
      </div>
      <span class="more">查看详情 →</span>
    </div>
  </article>`;
}
function render() {
  const visible = getVisible();
  resultCountEl.textContent = `当前显示 ${visible.length} / ${people.length} 位研究者`;
  gridEl.innerHTML = visible.map(p => card(p, people.indexOf(p))).join("");
  emptyEl.style.display = visible.length ? "none" : "block";
  gridEl.querySelectorAll(".card").forEach(el => {
    const open = () => openModal(people[Number(el.dataset.index)]);
    el.addEventListener("click", open);
    el.addEventListener("keydown", e => {
      if (e.key==="Enter" || e.key===" ") { e.preventDefault(); open(); }
    });
  });
}
function block(label, value, full=false) {
  if (!value) return "";
  return `<div class="block ${full?"full":""}"><div class="label">${esc(label)}</div><div class="value">${linkify(value)}</div></div>`;
}
function openModal(p) {
  document.getElementById("dialogBadge").textContent = labels[p["类型"]] || p["类型"] || "未分类";
  document.getElementById("dialogTitle").textContent = p["姓名"] || "";
  document.getElementById("dialogIdentity").textContent = p["身份"] || "";
  const reports = urls(p["过往报道链接（如有）"]);
  const noteUrls = urls(p["个人意愿（留言）"]);
  const resultUrls = urls(p["相关成果"]);
  const wechatUrls = noteUrls.filter(isWechat);
  let content = `<div class="detail-grid">`;
  if (p["个人意愿（留言）"]) {
    const noteLabel = wechatUrls.length ? "近期工作 / 宣传素材" : "采访意愿 / 备注";
    content += `<div class="block full"><div class="label">${noteLabel}</div><div class="notice">${linkify(p["个人意愿（留言）"])}</div></div>`;
  }
  content += block("值得报道的点", p["值得报道的点"], true);
  content += block("过往经历", p["过往事迹"], true);
  content += block("相关成果", p["相关成果"], true);
  content += `</div>`;
  const actions = [];
  if (p["知乎页面"]) actions.push(`<a class="action" href="${esc(p["知乎页面"])}" target="_blank" rel="noopener">打开知乎主页 ↗</a>`);
  wechatUrls.forEach(u=>actions.push(`<a class="action secondary" href="${esc(u)}" target="_blank" rel="noopener">打开微信文章 ↗</a>`));
  reports.forEach((u,i)=>actions.push(`<a class="action secondary" href="${esc(u)}" target="_blank" rel="noopener">过往报道${reports.length>1?` ${i+1}`:""} ↗</a>`));
  resultUrls.filter(u => !isWechat(u)).forEach(u=>actions.push(`<a class="action secondary" href="${esc(u)}" target="_blank" rel="noopener">${/notion\.site/i.test(u)?"打开项目页面 ↗":"打开成果链接 ↗"}</a>`));
  if (actions.length) content += `<div class="action-row">${[...new Set(actions)].join("")}</div>`;
  document.getElementById("dialogContent").innerHTML = content;
  modal.classList.add("open");
  document.body.style.overflow="hidden";
  document.getElementById("closeModal").focus();
}
function closeModal() {
  modal.classList.remove("open");
  document.body.style.overflow="";
}
document.getElementById("searchInput").addEventListener("input", e => {
  state.query = e.target.value.trim().toLowerCase();
  render();
});
document.getElementById("sortSelect").addEventListener("change", e => {
  state.sort = e.target.value;
  render();
});
document.getElementById("closeModal").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target===modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key==="Escape" && modal.classList.contains("open")) closeModal(); });

renderFilters();
render();
