/**
 * ============================================================
 * 포트폴리오 메인 스크립트
 * - 프로젝트 카드 렌더링
 * - 기술 스택 렌더링 + 스킬바 애니메이션
 * - 타이핑 애니메이션 (Hero)
 * - 스크롤 페이드인 (IntersectionObserver)
 * - 라이트박스
 * - 프로젝트 필터
 * - 폼 제출 처리 (UI 전용)
 * ============================================================
 */

/* ── 프로젝트 데이터 ─────────────────────────────────────── */
const portfolioProjects = [
  {
    id: "neon-requiem",
    type: "live",
    title: "NEON REQUIEM 2087",
    description:
      "사이버펑크 AI MUD 웹 게임. Vite + Flask 구성. AI NPC·전투·스킬 시스템 포함.",
    url: "https://github.com/karin01/TEXT-Mud-Game",
    icon: "🌃",
    tags: ["AI", "Vite", "Flask", "MUD"],
    thumb: "assets/neon-requiem.png",
    repoUrl: "https://github.com/karin01/TEXT-Mud-Game/archive/refs/heads/main.zip",
    repoLinkLabel: "ZIP 다운로드",
  },
  {
    id: "latinmat",
    type: "live",
    title: "라틴맛 커뮤니티",
    description:
      "전국 라틴댄스 파티·강습·정모 일정, 라틴 바 지도, 커뮤니티 기능을 모은 Firebase 기반 웹 서비스.",
    url: "https://latinmat.co.kr/",
    icon: "💃",
    tags: ["Firebase", "커뮤니티", "반응형"],
    thumb: "assets/latinmat.png",
  },
  {
    id: "chajadream",
    type: "live",
    title: "반려동물 차자드림",
    description:
      "실종·발견 동물 등록, 임보·입양 플랫폼. 텔레그램으로 실시간 알림 발송.",
    url: "http://chajadream.co.kr/",
    icon: "🐾",
    tags: ["웹", "텔레그램", "커뮤니티"],
    thumb: "assets/chajadream-web.png",
    gallery: ["assets/chajadream-telegram.png"],
  },
  {
    id: "stock-viewer",
    type: "local",
    title: "주식 AI 뷰어",
    description:
      "거래대금·거래량 순위, 종목 차트, AI 분석. 텔레그램으로 /chart 명령 응답.",
    url: "http://127.0.0.1:7654/",
    icon: "📈",
    tags: ["FastAPI", "AI", "주식"],
    thumb: "assets/stock-viewer.png",
    gallery: ["assets/stock-telegram-chart.png"],
  },
  {
    id: "vite-local",
    type: "local",
    title: "텍스트 CRPG 엔진",
    description:
      "중세 4인 파티 턴제 RPG. D&D식 판정 + PWA 지원. Vite + Python 백엔드.",
    url: null,
    urlCaption: "프론트(5173) · 엔진(8000) 로컬 실행",
    icon: "🎲",
    tags: ["PWA", "게임", "Python"],
    thumb: "assets/text-crpg.png",
    links: [
      { url: "http://localhost:5173/", label: "프론트(5173)" },
      { url: "http://127.0.0.1:8000/", label: "엔진(8000)" },
    ],
  },
  {
    id: "gmail-bot",
    type: "local",
    title: "Gmail → 텔레그램 봇",
    description:
      "IMAP 폴링으로 새 메일을 실시간 감지해 텔레그램으로 알림. AI 중요도 분류 포함.",
    url: null,
    urlCaption: "Python · IMAP + Telegram Bot API",
    icon: "✉️",
    tags: ["Python", "AI", "자동화"],
    thumb: "assets/gmail-telegram.png",
  },
];

/* ── 기술 스택 데이터 ─────────────────────────────────────── */
const skillCategories = [
  {
    icon: "🤖",
    category: "AI · 자동화",
    skills: [
      { name: "LLM / Prompt Engineering", pct: 82 },
      { name: "Python 자동화", pct: 88 },
      { name: "Telegram Bot API", pct: 90 },
    ],
  },
  {
    icon: "⚡",
    category: "백엔드",
    skills: [
      { name: "Flask / FastAPI", pct: 85 },
      { name: "Firebase (Firestore)", pct: 80 },
      { name: "REST API 설계", pct: 78 },
    ],
  },
  {
    icon: "🎨",
    category: "프론트엔드",
    skills: [
      { name: "HTML / CSS / JavaScript", pct: 90 },
      { name: "Vite + TypeScript", pct: 75 },
      { name: "반응형 UI 설계", pct: 85 },
    ],
  },
  {
    icon: "🛠️",
    category: "도구 · 배포",
    skills: [
      { name: "Git / GitHub", pct: 82 },
      { name: "Linux 서버 배포", pct: 70 },
      { name: "PWA 설계", pct: 70 },
    ],
  },
];

/* ── 유틸리티 ────────────────────────────────────────────── */

/** XSS 방지 이스케이프 */
function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

/** 클릭 가능 URL 확인 */
function hasClickableUrl(url) {
  return typeof url === "string" && url.length > 0 && url !== "#";
}

/* ── 프로젝트 카드 빌더 ──────────────────────────────────── */

function buildThumbHtml(project) {
  if (project.thumb) {
    return `
      <div class="project-card-thumb project-card-thumb--photo">
        <img class="project-card-img"
          src="${escapeHtml(project.thumb)}"
          alt="${escapeHtml(project.title)} 스크린샷"
          width="640" height="360" loading="lazy" decoding="async" />
      </div>`;
  }
  return `
    <div class="project-card-thumb">
      <span class="project-card-icon" aria-hidden="true">${project.icon}</span>
    </div>`;
}

function buildBodyHtml(project, footLine, typeTag, tagsHtml) {
  return `
    <div class="project-card-body">
      <div class="project-card-tags">${typeTag}${tagsHtml}</div>
      <h3 class="project-card-title">${escapeHtml(project.title)}</h3>
      <p class="project-card-desc">${escapeHtml(project.description)}</p>
      <span class="project-card-url">${escapeHtml(footLine)}</span>
    </div>`;
}

function createProjectCard(project) {
  const clickable = hasClickableUrl(project.url);
  const localOnly  = project.type === "local";

  const footLine = clickable
    ? project.url
    : project.urlCaption || "웹 주소 없음 · 로컬에서 실행";

  const tagsHtml = project.tags
    .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
    .join("");
  const typeTag = localOnly
    ? '<span class="tag local">로컬</span>'
    : '<span class="tag">운영</span>';

  const article = document.createElement("article");
  article.className = "project-card" + (clickable ? "" : " project-card--static");
  article.dataset.filter = project.type;
  article.style.position = "relative";

  const thumbHtml = buildThumbHtml(project);
  const bodyHtml  = buildBodyHtml(project, footLine, typeTag, tagsHtml);

  if (clickable) {
    const a = document.createElement("a");
    a.className = "project-card-link";
    a.href = project.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML = thumbHtml + bodyHtml;
    article.appendChild(a);
  } else {
    const block = document.createElement("div");
    block.className = "project-card-link project-card-link--static";
    block.setAttribute("role", "group");
    block.setAttribute("aria-label", project.title);
    block.innerHTML = thumbHtml + bodyHtml;
    article.appendChild(block);
  }

  const extras = document.createElement("div");
  extras.className = "project-card-extras";

  (Array.isArray(project.links) ? project.links : []).forEach((link) => {
    if (!link?.url) return;
    const a = document.createElement("a");
    a.href = link.url;
    a.className = "card-repo-link";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link.label || "링크";
    extras.appendChild(a);
  });

  if (project.repoUrl && project.repoUrl !== project.url) {
    const ra = document.createElement("a");
    ra.href = project.repoUrl;
    ra.className = "card-repo-link";
    ra.target = "_blank";
    ra.rel = "noopener noreferrer";
    ra.textContent = project.repoLinkLabel ||
      (project.repoUrl.includes("/archive/") ? "ZIP 다운로드" : "관련 링크");
    extras.appendChild(ra);
  }

  if (project.thumb) {
    const zoomBtn = document.createElement("button");
    zoomBtn.type = "button";
    zoomBtn.className = "card-extra-btn";
    zoomBtn.textContent = "스크린샷 보기";
    zoomBtn.addEventListener("click", () => openLightbox(project.thumb, project.title));
    extras.appendChild(zoomBtn);
  }

  (Array.isArray(project.gallery) ? project.gallery : []).forEach((src, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gallery-thumb-btn";
    btn.setAttribute("aria-label", `${project.title} 추가 이미지 ${i + 1}`);
    const img = document.createElement("img");
    img.src = src; img.alt = "";
    img.width = 120; img.height = 68; img.loading = "lazy";
    btn.appendChild(img);
    btn.addEventListener("click", () => openLightbox(src, project.title));
    extras.appendChild(btn);
  });

  if (extras.childElementCount > 0) article.appendChild(extras);
  return article;
}

/* ── 렌더링 함수들 ───────────────────────────────────────── */

function renderProjects(filter) {
  const grid = document.getElementById("project-grid");
  if (!grid) return;
  grid.innerHTML = "";
  const list = filter === "all"
    ? portfolioProjects
    : portfolioProjects.filter((p) => p.type === filter);
  list.forEach((p) => grid.appendChild(createProjectCard(p)));
}

function renderSkills() {
  const grid = document.getElementById("skills-grid");
  if (!grid) return;

  skillCategories.forEach((cat) => {
    const card = document.createElement("div");
    card.className = "skill-card fade-in-section";

    const skillsHtml = cat.skills.map((s) => `
      <div class="skill-item">
        <div class="skill-name-row">
          <span class="skill-name">${escapeHtml(s.name)}</span>
          <span class="skill-pct">${s.pct}%</span>
        </div>
        <div class="skill-bar">
          <div class="skill-fill" style="--target-w: ${s.pct / 100}"></div>
        </div>
      </div>`).join("");

    card.innerHTML = `
      <div class="skill-card-header">
        <span class="skill-icon" aria-hidden="true">${cat.icon}</span>
        <span class="skill-category">${escapeHtml(cat.category)}</span>
      </div>
      ${skillsHtml}`;

    grid.appendChild(card);
  });
}

/* ── 스킬바 애니메이션 ───────────────────────────────────── */

function initSkillBars() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll(".skill-fill").forEach((fill) => {
    observer.observe(fill);
  });
}

/* ── 스크롤 페이드인 ─────────────────────────────────────── */

function initScrollFade() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  document.querySelectorAll(".fade-in-section").forEach((el) => observer.observe(el));
}

/* ── 타이핑 애니메이션 ───────────────────────────────────── */

function initTypingEffect() {
  const target = document.getElementById("typing-target");
  if (!target) return;

  const phrases = [
    "바이브 코딩으로 시작했어요 ✨",
    "코드 한 줄 몰랐는데 만들었습니다",
    "AI가 짜고 저는 아이디어 냅니다 🧠",
    "비개발자의 반란입니다 🤙",
    "그래도 실제로 돌아갑니다 😅",
  ];

  const cursor = target.querySelector(".typing-cursor");
  let phraseIdx = 0, charIdx = 0, isDeleting = false;

  function tick() {
    const current = phrases[phraseIdx];
    const visible = current.slice(0, charIdx);

    // 텍스트 노드만 교체 (커서 보존)
    Array.from(target.childNodes).forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) n.remove();
    });
    target.insertBefore(document.createTextNode(visible), cursor);

    if (!isDeleting && charIdx < current.length) {
      charIdx++;
      setTimeout(tick, 60 + Math.random() * 40);
    } else if (!isDeleting && charIdx === current.length) {
      setTimeout(() => { isDeleting = true; tick(); }, 2000);
    } else if (isDeleting && charIdx > 0) {
      charIdx--;
      setTimeout(tick, 35);
    } else {
      isDeleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      setTimeout(tick, 400);
    }
  }

  // 초기 텍스트 제거
  Array.from(target.childNodes).forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) n.remove();
  });
  setTimeout(tick, 1000);
}

/* ── 라이트박스 ──────────────────────────────────────────── */

function openLightbox(src, title) {
  const root = document.getElementById("lightbox");
  const img  = document.getElementById("lightbox-img");
  if (!root || !img) return;
  img.src = src;
  img.alt = title ? `${title} 스크린샷` : "스크린샷";
  root.hidden = false;
  document.body.style.overflow = "hidden";
  root.querySelector(".lightbox-close")?.focus();
}

function closeLightbox() {
  const root = document.getElementById("lightbox");
  const img  = document.getElementById("lightbox-img");
  if (!root || !img) return;
  root.hidden = true;
  img.src = ""; img.alt = "";
  document.body.style.overflow = "";
}

function initLightbox() {
  const root = document.getElementById("lightbox");
  if (!root) return;
  root.addEventListener("click", (e) => { if (e.target === root) closeLightbox(); });
  root.querySelector(".lightbox-close")?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !root.hidden) closeLightbox();
  });
}

/* ── 필터 탭 ─────────────────────────────────────────────── */

function initFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      renderProjects(btn.dataset.filter || "all");
    });
  });
}

/* ── 연락 폼 처리 (UI 전용) ──────────────────────────────── */

function handleFormSubmit(e) {
  e.preventDefault();
  const notice = document.getElementById("form-notice");
  const btn    = e.target.querySelector(".btn-submit");
  if (!notice || !btn) return;

  btn.textContent = "전송 중...";
  btn.disabled = true;

  setTimeout(() => {
    notice.hidden = false;
    notice.textContent = "✅ 메시지가 전달되었습니다! 감사합니다 😊";
    btn.textContent = "Send message";
    btn.disabled = false;
    e.target.reset();

    setTimeout(() => { notice.hidden = true; }, 4000);
  }, 1200);
}

/* ── 활성 네비 링크 스크롤 추적 ──────────────────────────── */

function initActiveNav() {
  const sections = [
    { id: "top",      link: document.querySelector('.nav-link[href="#top"]') },
    { id: "about",    link: document.querySelector('.nav-link[href="#about"]') },
    { id: "projects", link: document.querySelector('.nav-link[href="#projects"]') },
    { id: "contact",  link: document.querySelector('.nav-link[href="#contact"]') },
  ];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const section = sections.find((s) => s.id === entry.target.id || (s.id === "top" && entry.target.tagName === "SECTION" && !entry.target.id));
      if (entry.isIntersecting && section?.link) {
        sections.forEach((s) => s.link?.classList.remove("is-active"));
        section.link.classList.add("is-active");
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll("section[id], main > section:first-child").forEach((sec) => {
    observer.observe(sec);
  });
}

/* ── 연도 표시 ───────────────────────────────────────────── */

function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

/* ── 진입점 ──────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  initYear();
  initLightbox();
  initFilters();
  renderProjects("all");
  renderSkills();
  initTypingEffect();
  initScrollFade();
  initSkillBars();
  initActiveNav();
});
