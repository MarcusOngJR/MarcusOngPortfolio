// ========== Fetch external data ==========
let DATA = null;

// ---------- State ----------
let currentPath = ["Root"];       // array of folder names
let viewMode = "grid";            // "grid" | "list"
let sortMode = "recent";          // "recent" | "az"
let openNode = null;              // node currently opened in main

// ---------- DOM ----------
const $ = (s) => document.querySelector(s);
const treeEl   = $('#tree');
const crumbs   = $('#crumbs');
const grid     = $('#grid');
const qInput   = $('#q');
const countChip= $('#countChip');
const btnGrid  = $('#viewGrid');
const btnList  = $('#viewList');
const btnRecent= $('#sortRecent');
const btnAZ    = $('#sortAZ');

// ========== Helpers ==========
function flatten(node){
  if (!node || !node.children) return [];
  return node.children.flatMap(n => n.type === 'file' ? [n] : flatten(n));
}

function getNodeByPath(path){
  let cur = DATA;
  for (let i=1;i<path.length;i++){
    if (!cur.children) break;
    cur = cur.children.find(n => n.name === path[i]);
    if (!cur) break;
  }
  return cur || DATA;
}

function setCrumbs(){
  crumbs.innerHTML = currentPath.map((name,i)=>{
    const clickable = i < currentPath.length - 1;
    if (clickable) {
      const color = i ? 'var(--sub)' : 'var(--dim)';
      return `<a href="#" data-crumb="${i}" style="color:${color};text-decoration:none">${name}</a>`;
    }
    return `<b>${name}</b>`;
  }).join(' <span style="opacity:.6">/</span> ');
}

function setCount(n){
  countChip.textContent = `${n} ${n===1?'item':'items'}`;
}

function sortItems(items){
  if (sortMode==='recent') {
    return items.slice().sort((a,b)=>
      (b.year||0) - (a.year||0) || a.title.localeCompare(b.title)
    );
  }
  return items.slice().sort((a,b)=> a.title.localeCompare(b.title));
}

function itemMatchesQuery(item, q){
  if (!q) return true;
  const hay = [
    item.title, item.tag, String(item.year||''), ...(item.tech||[])
  ].join(' ').toLowerCase();
  return hay.includes(q);
}

// ========== Sidebar Tree ==========
function buildTreeNode(node, depth=0, pathSoFar=["Root"]){
  const li = document.createElement('li');
  li.className = 'node';
  li.setAttribute('role','treeitem');

  if (node.type === 'folder'){
    const btn = document.createElement('button');
    btn.setAttribute('type','button');
    btn.innerHTML = `
      <span class="twist">▸</span>
      <span class="ic">${node.icon || "📁"}</span>
      <span class="label">${node.name}</span>
    `;
    li.appendChild(btn);

    const childrenWrap = document.createElement('ul');
    childrenWrap.className = 'children';
    childrenWrap.setAttribute('role','group');
    li.appendChild(childrenWrap);

    li.setAttribute('aria-expanded','true');

    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      currentPath = pathSoFar.concat(node.name).slice(0, depth+1);
      openNode = getNodeByPath(currentPath);
      highlightActiveNode();
      renderMain();
    });

    (node.children||[]).forEach(child=>{
      if (child.type==='folder'){
        const sub = buildTreeNode(child, depth+1, pathSoFar.concat(node.name));
        childrenWrap.appendChild(sub);
      }
    });
  }
  return li;
}

let activeNodeEl = null;
function highlightActiveNode(){
  treeEl.querySelectorAll('.node').forEach(n=> n.classList.remove('active'));
  const names = currentPath.slice(1);
  const labels = [...treeEl.querySelectorAll('.node > button .label')];
  const last = names[names.length-1] || 'Root';
  const match = labels.find(el => el.textContent.trim() === last);
  if (match){
    activeNodeEl = match.closest('.node');
    activeNodeEl.classList.add('active');
    let p = activeNodeEl.parentElement;
    while (p && p !== treeEl){
      if (p.classList.contains('children')){
        const parentNode = p.parentElement;
        parentNode && parentNode.setAttribute('aria-expanded','true');
      }
      p = p.parentElement;
    }
  }
}

function renderTree(){
  treeEl.innerHTML = '';
  (DATA.children||[]).forEach(folder=>{
    const nodeEl = buildTreeNode(folder, 1, ["Root"]);
    treeEl.appendChild(nodeEl);
  });
  highlightActiveNode();
}

// ========== Main ==========
function renderCards(items){
  if (!items.length){
    grid.className = viewMode === 'grid' ? 'grid' : 'list';
    grid.innerHTML = `<div class="empty">No items found.</div>`;
    setCount(0);
    return;
  }

  const html = items.map(it=>{
    // decide where to go when clicked
    const href = (it.link && it.link.trim() && it.link.trim() !== '#')
      ? it.link
      : `details.html?id=${encodeURIComponent(it.id)}`;

    return `
      <article
        class="card"
        role="link"
        tabindex="0"
        aria-label="${it.title}"
        data-id="${it.id}"
        data-href="${href}"
      >
        <div class="title">${it.title}</div>
        <div class="meta">
          ${it.year ? `<span>${it.year}</span>` : ''}
        </div>
        ${it.desc ? `<div class="desc">${it.desc}</div>` : ''}
      </article>
    `;
  }).join('');

  grid.className = viewMode === 'grid' ? 'grid' : 'list';
  grid.innerHTML = html;
  setCount(items.length);

  // Navigate on click or Enter/Space
  const go = (el) => {
    const href = el.getAttribute('data-href');
    if (!href) return;
    window.location.href = href; // use window.open(href,'_blank','noopener') for new tab
  };

  grid.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('click', ()=> go(card));
    card.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go(card);
      }
    });
  });
}

function gatherVisibleItems(){
  const q = qInput.value.trim().toLowerCase();
  let items;

  if (q){
    items = flatten(openNode).filter(x=>x.type==='file' && itemMatchesQuery(x,q));
  } else {
    const direct = (openNode.children||[]).filter(x=>x.type==='file');
    items = direct.length ? direct : flatten(openNode).filter(x=>x.type==='file');
  }
  return sortItems(items);
}

function renderMain(){
  setCrumbs();
  const items = gatherVisibleItems();
  renderCards(items);
}

// ========== Events ==========
function bindEvents(){
  let t;
  qInput.addEventListener('input', ()=>{
    clearTimeout(t); t = setTimeout(()=> renderMain(), 80);
  });

  btnGrid.addEventListener('click', ()=>{
    viewMode='grid';
    btnGrid.setAttribute('aria-pressed','true');
    btnList.setAttribute('aria-pressed','false');
    renderMain();
  });
  btnList.addEventListener('click', ()=>{
    viewMode='list';
    btnList.setAttribute('aria-pressed','true');
    btnGrid.setAttribute('aria-pressed','false');
    renderMain();
  });

  btnRecent.addEventListener('click', ()=>{
    sortMode='recent';
    btnRecent.setAttribute('aria-pressed','true');
    btnAZ.setAttribute('aria-pressed','false');
    renderMain();
  });
  btnAZ.addEventListener('click', ()=>{
    sortMode='az';
    btnAZ.setAttribute('aria-pressed','true');
    btnRecent.setAttribute('aria-pressed','false');
    renderMain();
  });

  crumbs.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-crumb]');
    if (!a) return;
    e.preventDefault();
    const idx = parseInt(a.getAttribute('data-crumb'),10);
    currentPath = currentPath.slice(0, idx+1);
    openNode = getNodeByPath(currentPath);
    highlightActiveNode();
    renderMain();
  });
}

// ========== Init ==========
function initWithData(){
  openNode = DATA;
  renderTree();
  renderMain();
  bindEvents();
}

// bootstrapping: fetch external JSON
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('Data/archiveData.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    DATA = await res.json();
    if (!DATA || DATA.type !== 'folder') throw new Error('Invalid data shape');
    initWithData();
  } catch (err) {
    console.error('Failed to load archive data:', err);
    grid.innerHTML = `<div class="empty">Could not load archive data.</div>`;
  }
});
