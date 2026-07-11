const sidebar = document.querySelector('.sidebar');
const menuButton = document.querySelector('.menu-button');
const pageTitle = document.querySelector('#page-title');
const appView = document.querySelector('#app-view');
const navigationControls = document.querySelectorAll('[data-view]');

const viewLabels = {
  home: 'Home',
  teams: 'Teams',
  players: 'Players',
  rosters: 'Rosters',
  'live-match': 'Live Match',
  rotations: 'Rotations',
  reports: 'Reports',
  settings: 'Settings'
};

const homeMarkup = appView.innerHTML;

function closeSidebar() {
  sidebar.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}

function showView(viewName) {
  const label = viewLabels[viewName] || 'Home';
  pageTitle.textContent = label;

  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.view === viewName);
  });

  if (viewName === 'home') {
    appView.innerHTML = homeMarkup;
  } else {
    appView.innerHTML = `
      <section class="placeholder-view">
        <p class="eyebrow">ScoreFlow Coach</p>
        <h2>${label}</h2>
        <p>This section is part of the Coach app foundation. Its working features and data model will be added in a dedicated pull request.</p>
      </section>
    `;
  }

  closeSidebar();
}

menuButton.addEventListener('click', () => {
  const willOpen = !sidebar.classList.contains('is-open');
  sidebar.classList.toggle('is-open', willOpen);
  menuButton.setAttribute('aria-expanded', String(willOpen));
});

document.addEventListener('click', (event) => {
  const viewControl = event.target.closest('[data-view]');

  if (viewControl) {
    showView(viewControl.dataset.view);
    return;
  }

  if (
    window.innerWidth <= 780 &&
    sidebar.classList.contains('is-open') &&
    !sidebar.contains(event.target) &&
    !menuButton.contains(event.target)
  ) {
    closeSidebar();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 780) {
    closeSidebar();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('ScoreFlow Coach service worker registration failed:', error);
    });
  });
}
