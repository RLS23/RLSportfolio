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
    if (!match) return {};
    try {
      const data = window.jsyaml.load(match[1]) || {};
      if (!data.description && match[2] && match[2].trim()) {
        data.description = match[2].trim();
      }
      return data;
    } catch (e) {
      console.error("Could not parse project frontmatter", e);
      return {};
    }
  }

  async function listProjectFiles() {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/contents/content/projects?ref=${BRANCH}`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) throw new Error("GitHub API status " + res.status);
      const files = await res.json();
      return files
        .filter((f) => f.name.endsWith(".md"))
        .map((f) => f.name);
    } catch (e) {
      console.warn("Falling back to local file listing:", e.message);
      return null;
    }
  }

  async function fetchProject(filename) {
    try {
      const res = await fetch(`content/projects/${filename}`, { cache: "no-store" });
      if (!res.ok) return null;
      const raw = await res.text();
      const data = parseFrontmatter(raw);
      data.slug = filename.replace(/\.md$/, "");
      return data;
    } catch (e) {
      return null;
    }
  }

  async function loadAllProjects() {
    let files = await listProjectFiles();
    if (!files) {
      // Last-resort fallback if GitHub's API is unreachable/rate-limited:
      // try the slugs already known to exist in this deploy.
      files = window.KNOWN_PROJECT_SLUGS
        ? window.KNOWN_PROJECT_SLUGS.map((s) => s + ".md")
        : [];
    }
    const projects = (await Promise.all(files.map(fetchProject))).filter(Boolean);
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
      <img src="${escapeHtml(coverImage(p))}" loading="lazy">
      <h3>${escapeHtml(p.title)}</h3>
      <p class="meta">${escapeHtml(metaLine(p))}</p>
    </a></div>`;
  }

  window.CMSData = { loadAllProjects, cardHtml, coverImage, metaLine, escapeHtml, parseFrontmatter, imageSrc };
})(window);
