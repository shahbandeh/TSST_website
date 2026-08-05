const toggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const navLinks = [...document.querySelectorAll('.sidebar nav a')];
const sections = [...document.querySelectorAll('main section[id]')];

toggle.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});

navLinks.forEach(link => link.addEventListener('click', () => {
  sidebar.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach(item => observer.observe(item));

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  });
}, { rootMargin: '-35% 0px -55% 0px' });

sections.forEach(section => sectionObserver.observe(section));

const tabs = [...document.querySelectorAll('[role="tab"]')];

function selectTab(tab) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', selected);
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : index + (event.key === 'ArrowRight' ? 1 : -1);
    next = (next + tabs.length) % tabs.length;
    selectTab(tabs[next]);
    tabs[next].focus();
  });
});
