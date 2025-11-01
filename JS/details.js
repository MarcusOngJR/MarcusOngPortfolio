// === Utility ===
function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function findItemAndPath(root, id, path = ["Root"]){
  if (!root) return null;
  for (const child of (root.children || [])){
    if (child.type === "file" && child.id === id){
      return { item: child, path };
    }
    if (child.type === "folder"){
      const res = findItemAndPath(child, id, path.concat(child.name));
      if (res) return res;
    }
  }
  return null;
}

function renderCrumbs(path){
  const crumbs = document.getElementById('crumbs');
  if (!path || !path.length){
    crumbs.textContent = "Archive";
    return;
  }
  const parts = ['<a href="archive.html" style="text-decoration:none;color:var(--sub)">Archive</a>']
    .concat(path.slice(1).map((p)=> `<span style="opacity:.6">/</span> <span>${p}</span>`));
  crumbs.innerHTML = parts.join(' ');
}

function chipHtml(text){ return `<span class="chip">${text}</span>`; }
function tagHtml(text){ return `<span class="tag">${text}</span>`; }

// === Main Logic ===
async function main(){
  const id = getParam('id');
  const notfound = document.getElementById('notfound');
  const head = document.getElementById('head');
  const title = document.getElementById('title');
  const meta = document.getElementById('meta');
  const desc = document.getElementById('desc');
  const extra = document.getElementById('extra');
  const openBtn = document.getElementById('openBtn');
  const copyBtn = document.getElementById('copyBtn');

  if (!id){
    renderCrumbs([]);
    notfound.style.display = '';
    return;
  }

  try{
    const res = await fetch('Data/archiveData.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const DATA = await res.json();

    const found = findItemAndPath(DATA, id);
    if (!found){
      renderCrumbs([]);
      notfound.style.display = '';
      return;
    }

    const { item, path } = found;
    renderCrumbs(path);

    // Fill content
    title.textContent = item.title || '(Untitled)';
    const bits = [];
    if (item.year) bits.push(String(item.year));
    if (item.tag) bits.push(tagHtml(item.tag));
    if (Array.isArray(item.tech)) bits.push(
      `<span class="tech">${item.tech.map(chipHtml).join('')}</span>`
    );
    meta.innerHTML = bits.join(' ');

    desc.textContent = item.desc || '';
    extra.innerHTML = '';

    const href = item.link && item.link.trim() ? item.link : null;
    if (href){
      openBtn.href = href;
      openBtn.style.display = 'inline-flex';
    } else {
      openBtn.style.display = 'none';
    }

    copyBtn.addEventListener('click', async ()=>{
      try{
        await navigator.clipboard.writeText(window.location.href);
        copyBtn.textContent = 'Copied!';
        setTimeout(()=> copyBtn.textContent = 'Copy Link', 1200);
      }catch(_){}
    });

    head.style.display = '';

  }catch(err){
    console.error(err);
    renderCrumbs([]);
    notfound.style.display = '';
  }
}

document.addEventListener('DOMContentLoaded', main);
