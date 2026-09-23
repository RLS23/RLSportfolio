# Setting up instant project uploads (login + add pictures & description)

Your site now has a working "Add Project" system built on **Decap CMS** (the
`/admin` panel already in your repo) + **Netlify Identity** for login +
**Git Gateway** so saving a project commits it straight to GitHub. The
Projects page and Homepage now read project data live from
`content/projects/*.md`, so anything you add through `/admin` appears on the
live site automatically after Netlify redeploys (usually under a minute) —
no code editing required.

## One-time setup in the Netlify dashboard (5 minutes)

1. Go to your site in Netlify → **Site configuration → Identity** → click
   **Enable Identity**.
2. Under Identity → **Registration**, set it to **Invite only** (so random
   people can't sign themselves up).
3. Under Identity → **Services**, click **Enable Git Gateway**. This is what
   lets a logged-in user save changes straight to your GitHub repo without
   needing their own GitHub account or token.
4. Under Identity → **Invite users**, invite your own email address. You'll
   get an email with a link to set a password.

## Replacing your repo

Download the attached folder and push its contents over your existing
`RLSportfolio` repo (replace everything, then commit and push to `main`):

```bash
git add -A
git commit -m "Add login + instant project uploads via Decap CMS"
git push
```

## Using it day to day

1. Go to `yoursite.netlify.app` and click **Log in** in the header (or go
   straight to `yoursite.netlify.app/admin`).
2. Log in with the email/password you set up.
3. Click **Projects → New Project**, fill in the title, type, date,
   location, software, upload one or more photos, and write the
   description.
4. Click **Publish**. That's it — Decap commits a new file to
   `content/projects/`, Netlify redeploys, and the project shows up on your
   Projects page and (if you tick "Feature on homepage") on your Homepage.

## What changed, technically

- `admin/config.yml` — CMS schema: title, type, year, date, location,
  software, **image uploads** (multiple), video link, description, and a
  "feature on homepage" toggle.
- `content/projects/*.md` — your 21 existing projects, migrated into this
  format so nothing was lost.
- `assets/js/cms-data.js` — fetches the list of project files from GitHub
  and renders them into cards, with no build step.
- `projects.html`, `index.html` — now render their project grids from that
  data instead of hardcoded HTML.
- `project.html` — one dynamic page (`project.html?slug=project14`) that
  replaced the 21 separate static project pages; the old
  `projects/projectN.html` files now just redirect here so old links still
  work.
- `script.js` — adds the Log in / Log out / **+ New project** control in
  the header on every page.
