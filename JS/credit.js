// --- Data you can edit quickly ---
const CREDIT_DATA = {
  builtWith: [
    {
      name: "HTML • CSS • JS",
      meta: "Core web stack",
      links: [{label:"MDN Web Docs", url:"https://developer.mozilla.org/"}],
      notes: "Semantic HTML, responsive CSS grid, vanilla JS"
    },
    {
      name: "Typefaces & Icons",
      meta: "System UI stack, emoji icons",
      links: [{label:"Emojipedia", url:"https://emojipedia.org/"}],
      notes: "No external font loads to keep it fast"
    },
    {
      name: "Development",
      meta: "VS Code, Git",
      links: [
        {label:"VS Code", url:"https://code.visualstudio.com/"},
        {label:"Git", url:"https://git-scm.com/"}
      ],
      notes: "Live Server for local dev; simple static hosting"
    }
  ],
  assets: [
    {
      name: "Color System",
      meta: "Accent & sub palette",
      links: [],
      notes: "Accent: #c084fc • Sub: #60a5fa • Cards: semi-transparent"
    },
    {
      name: "Data Model",
      meta: "Archive JSON schema",
      links: [{label:"archiveData.json", url:"Data/archiveData.json"}],
      notes: "Folder/file tree with title, year, desc, link"
    },
    {
      name: "Accessibility",
      meta: "Keyboard & ARIA",
      links: [{label:"WAI-ARIA Practices", url:"https://www.w3.org/WAI/ARIA/apg/"}],
      notes: "Focusable cards, proper nav landmarks, breadcrumbs"
    }
  ],
  thanks: [
    { who: "Lecturers & Mentors", why: "Guidance on software engineering & project design" },
    { who: "Friends & Teammates", why: "Brainstorms, feedback, and late-night testing" },
    { who: "Open-source Community", why: "Libraries, docs, and examples that accelerated learning" }
  ]
};

// --- DOM helpers ---
const $ = (s) => document.querySelector(s);

function cardHTML({name, meta, links = [], notes}){
  const linksHTML = links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join(" · ");
  return `
    <article class="creditCard">
      <div class="name">${name}</div>
      <div class="meta">${meta || ""}</div>
      ${notes ? `<div class="notes">${notes}</div>` : ""}
      ${links.length ? `<div class="links">${linksHTML}</div>` : ""}
    </article>
  `;
}

function renderSection(){
  const builtWithEl = $('#builtWith');
  const assetsEl = $('#assets');
  const thanksEl = $('#thanks');

  builtWithEl.innerHTML = CREDIT_DATA.builtWith.map(cardHTML).join('');
  assetsEl.innerHTML = CREDIT_DATA.assets.map(cardHTML).join('');
  thanksEl.innerHTML = CREDIT_DATA.thanks.map(
    t => `<li><span class="who">${t.who}</span><span class="why">${t.why}</span></li>`
  ).join('');

  // Year
  const yn = $('#yearNow');
  if (yn) yn.textContent = new Date().getFullYear();
}

function bindToTop(){
  const btn = $('#toTop');
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    btn.classList.toggle('show', y > 240);
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  btn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
  onScroll();
}

document.addEventListener('DOMContentLoaded', () => {
  renderSection();
  bindToTop();
});
