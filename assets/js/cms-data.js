/* cms-data.js
   Reads project entries straight out of /content/projects on GitHub so the
   site updates itself as soon as a project is added or edited through
   /admin — no rebuild step required.
*/
(function (window) {
  const REPO = "RLS23/RLSportfolio";
  const BRANCH = "main";

  function parseFrontmatter(raw) {
    const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) return { body: raw.trim() };
    try {
      const data = window.jsyaml.load(match[1]) || {};
      data.body = (match[2] || "").trim();
      if (!data.description && data.body) data.description = data.body;
      return data;
    } catch (e) {
      console.error("Could not parse frontmatter", e);
      return {};
    }
  }

  async function listFiles(folder) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${folder}?ref=${BRANCH}`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) throw new Error("GitHub API status " + res.status);
      const files = await res.json();
      return files.filter((f) => f.name.endsWith(".md")).map((f) => f.name);
    } catch (e) {
      console.warn(`Could not list ${folder}:`, e.message);
      return [];
    }
  }

  async function fetchEntry(folder, filename) {
    try {
      const res = await fetch(`${folder}/${filename}`, { cache: "no-store" });
      if (!res.ok) return null;
      const raw = await res.text();
      const data = parseFrontmatter(raw);
      data.slug = filename.replace(/\.md$/, "");
      return data;
    } catch (e) {
      return null;
    }
  }

  async function loadAllTestimonials() {
    const files = await listFiles("content/testimonials");
    const entries = (await Promise.all(files.map((f) => fetchEntry("content/testimonials", f)))).filter(Boolean);
    return entries;
  }

  async function loadSiteSettings() {
    try {
      const res = await fetch("content/settings/site.json", { cache: "no-store" });
      if (!res.ok) return {};
      return await res.json();
    } catch (e) {
      return {};
    }
  }

  async function loadAllProjects() {
    let files = await listFiles("content/projects");
    if (!files.length && window.KNOWN_PROJECT_SLUGS) {
      // Last-resort fallback if GitHub's API is unreachable/rate-limited.
      files = window.KNOWN_PROJECT_SLUGS.map((s) => s + ".md");
    }
    const projects = (await Promise.all(files.map((f) => fetchEntry("content/projects", f)))).filter(Boolean);
    projects.sort((a, b) => (b.year || 0) - (a.year || 0) || (b.slug > a.slug ? 1 : -1));
    return projects;
  }

  function imageSrc(entry) {
    if (!entry) return "";
    if (typeof entry === "string") return entry;
    return entry.src || "";
  }

  function coverImage(p) {
    if (p.images && p.images.length) {
      const src = imageSrc(p.images[0]);
      if (src) return src;
    }
    return "assets/images/hero.png";
  }

  function metaLine(p) {
    return [p.type, p.date || p.year, p.location].filter(Boolean).join(" — ");
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function cardHtml(p) {
    return `<div class="card"><a href="project.html?slug=${encodeURIComponent(p.slug)}">
      <div class="thumb"><img src="${escapeHtml(coverImage(p))}" alt="${escapeHtml(p.title)}" loading="lazy"></div>
      <h3>${escapeHtml(p.title)}</h3>
      <p class="meta">${escapeHtml(metaLine(p))}</p>
    </a></div>`;
  }

  window.CMSData = {
    loadAllProjects, loadAllTestimonials, loadSiteSettings,
    cardHtml, coverImage, metaLine, escapeHtml, parseFrontmatter, imageSrc,
  };
})(window);
