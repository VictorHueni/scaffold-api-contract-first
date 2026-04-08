// ── Initialize Lucide icons ──
  lucide.createIcons();

  // ── Generate dot grids ──
  function fillDotGrid(id, cols, rows) {
    const grid = document.getElementById(id);
    if (!grid) return;
    grid.style.gridTemplateColumns = `repeat(${cols}, 4px)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 4px)`;
    for (let i = 0; i < cols * rows; i++) {
      const d = document.createElement('div');
      d.className = 'dot';
      grid.appendChild(d);
    }
  }
  fillDotGrid('dots1', 8, 12);
  fillDotGrid('dots10', 5, 8);
  fillDotGrid('dots-closing', 8, 12);

  // ── Agenda items ──
  const agendaCategories = [
    { header: "Design & Validate", color: "green", items: [
      { n: 1, label: "The Contract", sub: "OpenAPI spec" },
      { n: 2, label: "Linting", sub: "Spectral" },
      { n: 3, label: "Mock Server", sub: "Prism" }
    ]},
    { header: "Generate Code", color: "blue", items: [
      { n: 4, label: "Client Codegen", sub: "TypeScript" },
      { n: 5, label: "Server Stubs", sub: "Spring Boot" }
    ]},
    { header: "Test & Guard", color: "amber", items: [
      { n: 6, label: "Contract Tests", sub: "Schemathesis" },
      { n: 7, label: "Breaking Changes", sub: "oasdiff" },
      { n: 8, label: "Functional Tests", sub: "Hurl" },
      { n: 9, label: "API Docs", sub: "Scalar" }
    ]},
    { header: "Run & Ship", color: "slate", items: [
      { n: 10, label: "CI Pipeline", sub: "GitHub Actions" }
    ]}
  ];
  const cardsEl = document.getElementById('agenda-cards');
  agendaCategories.forEach(cat => {
    const col = document.createElement('div');
    col.className = 'card-col';
    col.dataset.color = cat.color;
    col.innerHTML = `<div class="card-col-header">${cat.header}</div>`;
    cat.items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card-item';
      card.innerHTML = `<div class="card-num">${item.n}</div><div class="card-text"><div class="card-label">${item.label}</div><div class="card-sub">${item.sub}</div></div>`;
      col.appendChild(card);
    });
    cardsEl.appendChild(col);
  });

  // ── Hub diagram connection lines ──
  const svg = document.getElementById('connections-svg');
  const cx = 480, cy = 270;
  for (let i = 0; i < 8; i++) {
    const node = document.getElementById('sat' + i);
    const rect = node.getBoundingClientRect();
    const slideRect = node.closest('.slide').getBoundingClientRect();
    const nx = rect.left + rect.width / 2 - slideRect.left;
    const ny = rect.top + rect.height / 2 - slideRect.top;
    // Scale to viewBox
    const sx = nx / slideRect.width * 960;
    const sy = ny / slideRect.height * 540;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', cx); line.setAttribute('y1', cy);
    line.setAttribute('x2', sx); line.setAttribute('y2', sy);
    line.setAttribute('stroke', '#006039');
    line.setAttribute('stroke-width', '1.2');
    line.setAttribute('stroke-dasharray', '6 4');
    line.setAttribute('opacity', '0.5');
    svg.appendChild(line);
  }

  // ── Fullscreen presentation mode ──
  const slides = document.querySelectorAll('.slide');
  let currentSlide = 0;
  let presenting = false;

  function scaleSlides() {
    const margin = 40;
    const scaleX = (window.innerWidth - margin * 2) / 960;
    const scaleY = (window.innerHeight - margin * 2) / 540;
    const scale = Math.min(scaleX, scaleY);
    slides.forEach(s => {
      s.style.transform = presenting ? `translate(-50%, -50%) scale(${scale})` : '';
    });
  }

  function enterPresentation() {
    presenting = true;
    document.body.classList.add('presenting');
    slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
    document.documentElement.requestFullscreen?.();
    setTimeout(scaleSlides, 100);
  }

  function exitPresentation() {
    presenting = false;
    document.body.classList.remove('presenting');
    slides.forEach(s => { s.classList.remove('active'); s.style.display = ''; s.style.transform = ''; });
    document.exitFullscreen?.();
  }

  window.addEventListener('resize', () => { if (presenting) scaleSlides(); });

  function showSlide(n) {
    currentSlide = Math.max(0, Math.min(n, slides.length - 1));
    if (presenting) {
      slides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      if (!presenting) enterPresentation();
    } else if (e.key === 'Escape') {
      if (presenting) exitPresentation();
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      if (presenting) showSlide(currentSlide + 1);
    } else if (e.key === 'ArrowLeft') {
      if (presenting) showSlide(currentSlide - 1);
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && presenting) exitPresentation();
  });

  // ── Slide 6: cross-zone arrows ──
  function drawS6Arrows() {
    const wrap = document.querySelector('.s6 .arch-grid-wrap');
    const svg = document.getElementById('s6-arrows');
    if (!wrap || !svg) return;
    const wr = wrap.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${wr.width} ${wr.height}`);

    // Arrow connections
    const arrows = [
      // DEV: frontend -> apic -> mock, then adapter -> connector -> mock backend
      ['d-fe', 'd-apic'],
      ['d-apic', 'd-mock'],
      ['d-adapt', 'd-conn'],
      ['d-conn', 'd-be'],
      // PROD: full chain
      ['p-fe', 'p-apic'],
      ['p-apic', 'p-adapt'],
      ['p-adapt', 'p-conn'],
      ['p-conn', 'p-be']
    ];

    svg.innerHTML = '<defs><marker id="ah6" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto"><path d="M0,0 L6,2.5 L0,5" fill="#bbb"/></marker></defs>';

    arrows.forEach(([fromId, toId]) => {
      const fromEl = document.getElementById(fromId);
      const toEl = document.getElementById(toId);
      if (!fromEl || !toEl) return;
      const fr = fromEl.getBoundingClientRect();
      const tr = toEl.getBoundingClientRect();
      const x1 = fr.right - wr.left + 2;
      const y1 = fr.top + fr.height / 2 - wr.top;
      const x2 = tr.left - wr.left - 2;
      const y2 = tr.top + tr.height / 2 - wr.top;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#ccc');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('marker-end', 'url(#ah6)');
      svg.appendChild(line);
    });
  }
  // Remove inline arrows from prod ace-flow (SVG handles them now)
  drawS6Arrows();
  window.addEventListener('resize', drawS6Arrows);