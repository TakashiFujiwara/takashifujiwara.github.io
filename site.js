const isListing = document.body.dataset.page === 'home';
const header = document.querySelector('.mast');
const menu = document.getElementById('mobile-nav');
const toggle = document.getElementById('menu-toggle');
function setMenu(open) {
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
}
toggle.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) {
    setMenu(false);
    toggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!menu.hidden && !header.contains(event.target)) setMenu(false);
});
matchMedia('(min-width: 761px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});
if (isListing) {
  const sectionLinks = Array.from(document.querySelectorAll('[data-section]'));
  const sections = ['profile', 'research', 'publications'].map(id => document.getElementById(id));
  const langLinks = Array.from(document.querySelectorAll('[data-lang]'));
  const profileTabs = document.querySelector('.profile-tabs');
  const tabs = Array.from(profileTabs.querySelectorAll('[role="tab"]'));
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  let activePanel = 'bio';

  function showProfilePanel(index) {
    activePanel = panels[index].id;
    for (const [i, tab] of tabs.entries()) {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    }
  }

  function followProfileHash() {
    const hash = location.hash.slice(1);
    const index = panels.findIndex(panel => panel.id === hash);
    if (index >= 0) {
      showProfilePanel(index);
      profileTabs.scrollIntoView({block: 'start', behavior: 'instant'});
    } else if (!hash || hash === 'profile' || hash === 'overview') {
      showProfilePanel(0);
    }
    updateSection();
  }

  for (const [index, tab] of tabs.entries()) {
    const panel = panels[index];
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    tab.addEventListener('click', event => {
      event.preventDefault();
      showProfilePanel(index);
      history.replaceState(null, '', '#' + panel.id);
      updateSection();
    });
    tab.addEventListener('keydown', event => {
      const last = tabs.length - 1;
      const destinations = {
        ArrowLeft: index ? index - 1 : last,
        ArrowRight: index === last ? 0 : index + 1,
        Home: 0,
        End: last,
      };
      if (!(event.key in destinations)) return;
      event.preventDefault();
      const destination = tabs[destinations[event.key]];
      destination.focus();
      destination.click();
    });
  }
  document.querySelector('.profile-panels').classList.add('tabbed');
  showProfilePanel(0);
  window.addEventListener('hashchange', followProfileHash);
  let tick = false;
  function updateSection() {
    tick = false;
    const threshold = header.offsetHeight + Math.min(190, window.innerHeight * .25);
    let current = 'profile';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= threshold) current = section.id;
    }
    for (const link of sectionLinks) {
      const selected = link.dataset.section === current;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    for (const link of langLinks) {
      link.hash = current === 'profile' ? (activePanel === 'bio' ? '' : activePanel) : current;
    }
  }
  function scheduleUpdate() {
    if (!tick) {
      tick = true;
      requestAnimationFrame(updateSection);
    }
  }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('load', updateSection);
  followProfileHash();
  const filters = Array.from(document.querySelectorAll('[data-filter]'));
  const papers = Array.from(document.querySelectorAll('.paper'));
  for (const button of filters) {
    button.addEventListener('click', () => {
      const selected = button.dataset.filter;
      for (const filter of filters) filter.setAttribute('aria-pressed', String(filter === button));
      for (const paper of papers) paper.hidden = selected !== 'all' && paper.dataset.kind !== selected;
      const count = papers.filter(paper => !paper.hidden).length;
      document.getElementById('filter-status').textContent = document.documentElement.lang === 'ja' ? count + '件の業績を表示' : count + (count === 1 ? ' publication shown' : ' publications shown');
    });
  }
}

const complexVideo = document.getElementById('complex-video');
if (complexVideo) {
  const motionButton = document.querySelector('.motion-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let wantsRotation = !reducedMotion.matches;
  let inView = false;
  complexVideo.controls = false;
  complexVideo.muted = true;
  motionButton.hidden = false;

  function updateMotionButton() {
    const playing = !complexVideo.paused;
    const label = playing ? motionButton.dataset.pause : motionButton.dataset.play;
    motionButton.dataset.playing = String(playing);
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
  }
  function syncMotion() {
    if (!complexVideo.isConnected) return;
    if (wantsRotation && inView && !document.hidden) {
      complexVideo.play().catch(updateMotionButton);
    } else {
      complexVideo.pause();
    }
  }
  motionButton.addEventListener('click', () => {
    wantsRotation = complexVideo.paused;
    syncMotion();
  });
  complexVideo.addEventListener('play', updateMotionButton);
  complexVideo.addEventListener('pause', updateMotionButton);
  reducedMotion.addEventListener('change', () => {
    wantsRotation = !reducedMotion.matches;
    syncMotion();
  });
  document.addEventListener('visibilitychange', syncMotion);
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncMotion();
  });
  observer.observe(complexVideo);
  function showStill() {
    const still = new Image();
    still.className = 'structure';
    still.src = complexVideo.poster;
    still.alt = complexVideo.getAttribute('aria-label');
    observer.disconnect();
    motionButton.hidden = true;
    complexVideo.replaceWith(still);
  }
  complexVideo.addEventListener('error', showStill, {once: true});
  complexVideo.querySelector('source:last-of-type').addEventListener('error', showStill, {once: true});
  updateMotionButton();
}
