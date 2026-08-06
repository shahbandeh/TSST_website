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

document.querySelectorAll('[data-dialog]').forEach(button => {
  const dialog = document.getElementById(button.dataset.dialog);
  button.addEventListener('click', () => dialog.showModal());
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) dialog.close();
  });
});

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

const surnameOverrides = new Map([
  ['estefania padilla gonzalez', 'Padilla Gonzalez'],
  ['sophie von coelln', 'von Coelln']
]);
const nameCollator = new Intl.Collator('en', { sensitivity: 'base' });

function surnameFor(fullName) {
  const normalized = fullName.trim().toLowerCase();
  return surnameOverrides.get(normalized) || fullName.trim().split(/\s+/).at(-1);
}

function comparePeople(first, second) {
  const surnameComparison = nameCollator.compare(surnameFor(first.name), surnameFor(second.name));
  return surnameComparison || nameCollator.compare(first.name, second.name);
}

['panel-postdocs', 'panel-students', 'panel-affiliates', 'panel-alumni'].forEach(id => {
  const panel = document.getElementById(id);
  const cards = [...panel.children].map(card => ({ card, name: card.querySelector('h3').textContent.trim() }));
  cards.sort(comparePeople).forEach(({ card }) => panel.append(card));
});

const publicationGrid = document.getElementById('publication-grid');
const publicationsUpdated = document.getElementById('publications-updated');

function element(tag, className, textContent) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (textContent !== undefined) item.textContent = textContent;
  return item;
}

function renderPublications(data) {
  publicationGrid.replaceChildren();
  const publishedMembers = [...data.members].filter(member => member.papers?.length).sort(comparePeople);

  if (!publishedMembers.length) {
    publicationGrid.append(element('p', 'publication-empty', 'Publication data will appear after the next ADS synchronization.'));
    return;
  }

  publishedMembers.forEach(member => {
    const card = element('article', 'publication-author');
    const header = element('header', 'publication-author-header');
    const photo = element('img');
    photo.src = member.photo;
    photo.alt = '';
    photo.loading = 'lazy';
    const identity = element('div');
    identity.append(element('h3', '', member.name), element('p', '', member.group));
    header.append(photo, identity);
    card.append(header);

    const list = element('ol', 'paper-list');
    member.papers.forEach((paper, index) => {
        const item = element('li');
        const rank = element('span', 'paper-rank', String(index + 1).padStart(2, '0'));
        const details = element('div');
        const link = element('a', '', paper.title);
        link.href = paper.url;
        link.target = '_blank';
        link.rel = 'noopener';
        const meta = element('p', 'paper-meta');
        const citations = element('span', 'paper-citations', `${Number(paper.citation_count || 0).toLocaleString()} citations`);
        meta.append(`${paper.year} · ${paper.publication || 'ADS'} · `, citations);
        details.append(link, meta);
        item.append(rank, details);
        list.append(item);
    });
    card.append(list);
    publicationGrid.append(card);
  });

  publicationsUpdated.textContent = data.generated_at
    ? `Last synchronized ${new Date(data.generated_at).toLocaleDateString()}`
    : 'Awaiting first ADS synchronization';
}

if (publicationGrid) {
  fetch('data/publications.json')
    .then(response => {
      if (!response.ok) throw new Error('Publication data unavailable');
      return response.json();
    })
    .then(data => {
      if (data.members.length) return data;
      return fetch('data/team-authors.json')
        .then(response => response.json())
        .then(members => ({
          ...data,
          members: members.map(({ name, group, photo }) => ({ name, group, photo, papers: [] }))
        }));
    })
    .then(renderPublications)
    .catch(() => {
      publicationsUpdated.textContent = 'Publication data is temporarily unavailable';
      publicationGrid.append(element('p', 'publication-empty', 'Please check back after the next ADS synchronization.'));
    });
}
