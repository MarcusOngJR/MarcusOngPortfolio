(function () {
  var slides = document.querySelectorAll('.slide');
  var totalSlides = slides.length;

  var lastActiveIndex = 0;         // which slide we think is "showing"
  var lastScrollY = window.scrollY;

  // figure out which slide index matches current scroll
function getActiveIndex() {
  var scrollY = window.scrollY;
  var viewportH = window.innerHeight;

  // 👇 smaller value = more sensitive scrolling
  var sensitivity = 0.6; // e.g. 0.6 means 60% of screen scroll switches slide

  var effectiveHeight = viewportH * sensitivity;
  var idx = Math.round(scrollY / effectiveHeight);

  if (idx < 0) idx = 0;
  if (idx > totalSlides - 1) idx = totalSlides - 1;
  return idx;
}

  function clearAnimClasses(slide) {
    slide.classList.remove(
      'slide--active',
      'slide--entering-down',
      'slide--entering-up',
      'slide--leaving-down',
      'slide--leaving-up',
      'slide--animating'
    );
  }

  // apply enter/exit classes to prev & next
  function runTransition(prevIndex, nextIndex, direction) {
    if (prevIndex === nextIndex) return;

    var prevSlide = slides[prevIndex];
    var nextSlide = slides[nextIndex];

    // clean slate for all slides
    slides.forEach(clearAnimClasses);

    // mark next slide as active + entering
    if (nextSlide) {
      nextSlide.classList.add('slide--active');
      if (direction === 'up') {
        nextSlide.classList.add('slide--entering-up');
      } else {
        nextSlide.classList.add('slide--entering-down');
      }

      // special stagger for slide 2 projects
      if (nextSlide.dataset.index === "2") {
        nextSlide.classList.add('slide--animating');
      }
    }

    // mark previous slide as leaving
    if (prevSlide) {
      if (direction === 'up') {
        prevSlide.classList.add('slide--leaving-down');
      } else {
        prevSlide.classList.add('slide--leaving-up');
      }
    }
  }

  function syncPrompt(activeIndex) {
    var prompt = document.querySelector('.scroll-prompt');
    if (!prompt) return;
    prompt.style.opacity = activeIndex === 0 ? '0.85' : '0';
    prompt.style.transition = 'opacity 0.4s ease';
  }

  function updateSlides() {
    var currentScrollY = window.scrollY;

    // scroll direction guess
    var direction;
    if (currentScrollY > lastScrollY) {
      direction = 'down';
    } else if (currentScrollY < lastScrollY) {
      direction = 'up';
    } else {
      direction = 'down'; // default if equal
    }
    lastScrollY = currentScrollY;

    var nextIndex = getActiveIndex();

    // only trigger transition if the index actually changed
    if (nextIndex !== lastActiveIndex) {
      runTransition(lastActiveIndex, nextIndex, direction);
      lastActiveIndex = nextIndex;
    } else {
      // ensure current stays interactive if for some reason classes got nuked
      var currentSlide = slides[nextIndex];
      if (currentSlide && !currentSlide.classList.contains('slide--active')) {
        clearAnimClasses(currentSlide);
        currentSlide.classList.add('slide--active', 'slide--entering-down');
        if (currentSlide.dataset.index === "2") {
          currentSlide.classList.add('slide--animating');
        }
      }
    }

    syncPrompt(nextIndex);
  }

  // on first load:
  // - add .page-loaded so .slide-content fades in
  // - force slide 0 into an "active, entering-down" look
  window.addEventListener('load', function () {
    document.body.classList.add('page-loaded');

    var firstSlide = slides[0];
    if (firstSlide) {
      clearAnimClasses(firstSlide);
      firstSlide.classList.add('slide--active', 'slide--entering-down');
      lastActiveIndex = 0;
    }

    syncPrompt(0);
    updateSlides();
  });

  // watch scroll / resize
  window.addEventListener('scroll', updateSlides);
  window.addEventListener('resize', updateSlides);
})();

/* Let mouse wheel over spline still scroll page */
(function enableSplineScrollPassthrough() {
  var splines = document.querySelectorAll('.spline-bg');

  splines.forEach(function (splineEl) {
    splineEl.addEventListener(
      'wheel',
      function (e) {
        // stop spline from consuming wheel
        e.preventDefault();
        window.scrollBy({
          top: e.deltaY,
          left: 0,
          behavior: 'auto'
        });
      },
      { passive: false }
    );
  });
})();

(async function fillFeaturedProjectsFromJson() {
  try {
    const res = await fetch('Data/featuredProjects.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load featuredProjects.json');
    console.log('✅ Successfully loaded featuredProjects.json');

    const data = await res.json();
    const items = Array.isArray(data?.featuredProjects) ? data.featuredProjects : [];
    const cards = document.querySelectorAll('.slide[data-index="2"] .project-card');

    cards.forEach((card, i) => {
      const proj = items[i];
      if (!proj) return; // nothing to fill for this card

      const titleEl = card.querySelector('.project-card__name');
      const metaEl  = card.querySelector('.project-card__meta');
      const bodyEl  = card.querySelector('.project-card__body');
      const linkEl  = card.querySelector('.project-card__link');

      if (titleEl) titleEl.textContent = proj.title ?? '';
      if (metaEl)  metaEl.textContent  = proj.info ?? '';
      if (bodyEl)  bodyEl.textContent  = proj.description ?? '';

      if (linkEl) {
        if (proj.link) {
          // Update the link href and text
          linkEl.href = proj.link;
          linkEl.textContent = 'To Case Study →';

          linkEl.removeAttribute('aria-disabled');
          linkEl.style.pointerEvents = '';
          linkEl.style.opacity = '';
        } else {
          // Gracefully disable link if none provided
          linkEl.href = '#';
          linkEl.textContent = 'Unavailable';
          linkEl.setAttribute('aria-disabled', 'true');
          linkEl.style.pointerEvents = 'none';
          linkEl.style.opacity = '0.6';
        }
      }
    });
  } catch (err) {
    console.error('❌ Error loading featuredProjects.json:', err);
  }
})();




//////////////////////////////////////////
//////////My Journey Slide///////////////




/* SLIDE 3 — robust rail/cards sync + smooth autoplay (no skips) */
(async function () {
  // ---- Load data -----------------------------------------------------------
  let nodes = [];
  try {
    const res = await fetch('Data/timelineNodes.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load Data/timelineNodes.json');
    const raw = await res.json();
    nodes = Array.isArray(raw) ? raw : (raw.timelineNodes || raw.events || raw.nodes || []);
    if (!nodes?.length) return;
  } catch (e) { console.error(e); return; }

  // ---- DOM -----------------------------------------------------------------
  const slide = document.querySelector('.slide[data-index="3"]');
  if (!slide) return;

  const rail        = slide.querySelector('.journey__rail');
  const track       = rail.querySelector('.journey__track');
  const markersWrap = rail.querySelector('.journey__markers');
  const handle      = rail.querySelector('.journey__handle');
  const popover     = rail.querySelector('.journey__popover');
  const popDate     = popover.querySelector('.journey__popover-date');
  const popTitle    = popover.querySelector('.journey__popover-title');
  const popDesc     = popover.querySelector('.journey__popover-desc');
  const popLink     = popover.querySelector('.journey__popover-link');

  const cards  = slide.querySelector('.journey__cards');
  const btnPrev= slide.querySelector('.journey__btn--prev');
  const btnNext= slide.querySelector('.journey__btn--next');
  const btnPlay= slide.querySelector('.journey__btn--play');
  const zoomEl = slide.querySelector('.journey__zoom-range');

  // ---- Normalize data ------------------------------------------------------
  const toTime = d => { const t = new Date(d).getTime(); return Number.isFinite(t) ? t : NaN; };
  const events = nodes.map((e,i)=>({
    idx:i, time: toTime(e.date), date:e.date,
    label: e.label ?? e.tag ?? '',
    title: e.title ?? e.name ?? 'Untitled',
    description: e.description ?? e.desc ?? '',
    link: e.link || null
  })).filter(e=>Number.isFinite(e.time)).sort((a,b)=>a.time-b.time);
  if (!events.length) return;

  const minT = events[0].time, maxT = events[events.length-1].time;
  const range = Math.max(1, maxT - minT);
  const pctFromTime = t => ((t - minT) / range) * 100;

  // ---- Render markers & cards ----------------------------------------------
  markersWrap.innerHTML = '';
  events.forEach(e => {
    const m = document.createElement('div');
    m.className = 'journey__marker';
    m.style.left = pctFromTime(e.time) + '%';
    m.title = e.label || e.title;
    m.addEventListener('click', ()=>focusIndex(e.idx, {smooth:true, source:'marker'}));
    markersWrap.appendChild(m);
  });

  cards.innerHTML = '';
  events.forEach(e => {
    const card = document.createElement('article');
    card.className = 'journey__card';
    const dateTxt = new Date(e.date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
    card.innerHTML = `
      <div class="journey__card-date">${dateTxt}</div>
      <h4 class="journey__card-title">${e.title}</h4>
      <p class="journey__card-desc">${e.description}</p>
      ${e.link ? `<a class="journey__card-link" href="${e.link}" target="_blank" rel="noopener">Open →</a>` : ``}
    `;
    cards.appendChild(card);
  });

  // ---- Geometry helpers (pixel-perfect alignment) --------------------------
  function rects() {
    return {
      rail: rail.getBoundingClientRect(),
      track: track.getBoundingClientRect(),
      markers: markersWrap.getBoundingClientRect(),
    };
  }
  // center X of marker i in *rail* coordinates
  function markerCenterXInRail(i) {
    const { rail, markers } = rects();
    const mk = markersWrap.children[i];
    if (!mk) return null;
    // Because marker is centered with translate(-50%), its visual center sits at offsetLeft
    const centerInMarkers = mk.offsetLeft;
    return (markers.left - rail.left) + centerInMarkers;
  }
  // place handle & popover by exact center (handle uses translate(-50%, -50%) in CSS)
  function placeAtRailX(x) {
    handle.style.left  = `${x}px`;
    popover.style.left = `${x}px`;
  }

  // ---- State & core updater -------------------------------------------------
  let current = 0;
  let isPlaying = false;
  let playTimer = null;
  let scrollLock = false;  // prevents scroll handler feedback loops

  function setPopover(ev) {
    popDate.textContent  = new Date(ev.date).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
    popTitle.textContent = ev.title;
    popDesc.textContent  = ev.description;
    if (ev.link) { popLink.href = ev.link; popLink.hidden = false; }
    else { popLink.hidden = true; }
  }

  function setMarkerActive(i) {
    markersWrap.querySelectorAll('.journey__marker')
      .forEach((el, idx) => el.classList.toggle('is-active', idx === i));
  }

  function focusIndex(i, opts = {}) {
    const { smooth = true, source = 'program' } = opts;
    const total = events.length;
    if (total === 0) return;
    const next = Math.max(0, Math.min(total - 1, i));
    current = next;

    const ev = events[current];
    setPopover(ev);
    setMarkerActive(current);

    const x = markerCenterXInRail(current);
    if (x != null) placeAtRailX(x);

    // scroll card into view
    const behavior = smooth ? 'smooth' : 'instant';
    const card = cards.children[current];
    if (card) {
      scrollLock = true;
      card.scrollIntoView({ behavior, inline: 'center', block: 'nearest' });
      // release lock shortly after scroll completes
      window.clearTimeout(scrollLock.__t);
      scrollLock.__t = window.setTimeout(()=>{ scrollLock = false; }, smooth ? 420 : 0);
    }
  }

  // ---- Dragging (snap to nearest marker) -----------------------------------
  let dragging = false;
  function nearestIndexFromClientX(clientX) {
    const { track } = rects();
    const rel = Math.max(0, Math.min(track.width, clientX - track.left));
    const pct = (rel / track.width) * 100;
    // nearest by percent timeline
    let best=0, dist=1e9;
    for (let i=0;i<events.length;i++) {
      const p = pctFromTime(events[i].time);
      const d = Math.abs(p - pct);
      if (d < dist) { dist = d; best = i; }
    }
    return best;
  }
  handle.addEventListener('pointerdown', e => { dragging = true; handle.setPointerCapture?.(e.pointerId); pause(); });
  window.addEventListener('pointermove', e => {
    if (!dragging) return;
    const idx = nearestIndexFromClientX(e.clientX);
    if (idx !== current) focusIndex(idx, { smooth:false, source:'drag' });
    else {
      // even if same index, keep handle glued to marker center under pointer
      const x = markerCenterXInRail(current);
      if (x != null) placeAtRailX(x);
    }
  });
  window.addEventListener('pointerup', () => { dragging = false; });

  // ---- Cards scroll -> update rail (when user drags cards) ------------------
  cards.addEventListener('scroll', () => {
    if (scrollLock) return;
    const rect = cards.getBoundingClientRect();
    let best = 0, dist = 1e9;
    for (let i=0;i<cards.children.length;i++){
      const c = cards.children[i].getBoundingClientRect();
      const mid = c.left + c.width/2;
      const d = Math.abs(mid - (rect.left + rect.width/2));
      if (d < dist){ dist = d; best = i; }
    }
    if (best !== current) focusIndex(best, { smooth:false, source:'cardscroll' });
  }, { passive:true });

  // ---- Controls -------------------------------------------------------------
  function nextIndex() { return (current + 1) % events.length; }
  function prevIndex() { return (current - 1 + events.length) % events.length; }

  btnNext.addEventListener('click', () => { pause(); focusIndex(nextIndex(), {smooth:true, source:'next'}); });
  btnPrev.addEventListener('click', () => { pause(); focusIndex(prevIndex(), {smooth:true, source:'prev'}); });

  function scheduleNextTick() {
    // chain timeouts instead of setInterval to avoid drift & race with smooth scroll
    playTimer = window.setTimeout(() => {
      focusIndex(nextIndex(), { smooth:true, source:'autoplay' });
      scheduleNextTick();
    }, 1600);
  }
function play() {
  if (isPlaying) return;
  isPlaying = true;

  // Guard: btnPlay can be null on some pages/states
  try { btnPlay && (btnPlay.textContent = '⏸'); } catch (_) {}

  scheduleNextTick();
}
  function pause() {
    isPlaying = false;
    btnPlay.textContent = '▶';
    window.clearTimeout(playTimer);
  }
  btnPlay.addEventListener('click', () => isPlaying ? pause() : play());

  // keyboard
  slide.addEventListener('keydown', e=>{
    if (e.key==='ArrowRight'){ e.preventDefault(); pause(); focusIndex(nextIndex(), {smooth:true, source:'key'}); }
    else if (e.key==='ArrowLeft'){ e.preventDefault(); pause(); focusIndex(prevIndex(), {smooth:true, source:'key'}); }
    else if (e.key===' '){ e.preventDefault(); isPlaying ? pause() : play(); }
  });

  // zoom (affects card sizes/gap only)

  // resize -> re-place by marker center (keeps perfect alignment)
  window.addEventListener('resize', () => {
    const x = markerCenterXInRail(current);
    if (x != null) placeAtRailX(x);
  });

  // ---- Init -----------------------------------------------------------------
focusIndex(0, { smooth:false, source:'init' });

// Kick autoplay after first paint (and only if user doesn't prefer reduced motion)
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced) {
  requestAnimationFrame(() => setTimeout(() => play(), 50));
}
})();





