(function () {
  var slides = document.querySelectorAll('.slide');
  var totalSlides = slides.length;

  var lastActiveIndex = 0;         // which slide we think is "showing"
  var lastScrollY = window.scrollY;

  // figure out which slide index matches current scroll
  function getActiveIndex() {
    var scrollY = window.scrollY;
    var viewportH = window.innerHeight;
    var idx = Math.round(scrollY / viewportH);

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
