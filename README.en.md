# Tianxuewang · English Teaching Platform

**up366 · English Teaching & Assessment**

A complete, runnable bilingual (Chinese / English) school-facing website and content management system for
English teaching and assessment — built to explain, plainly, how AI actually enters an English classroom:
how speaking gets assessed, how essays get marked, how learning data gets read, and how teaching groups
change what they reteach.

[![License: MIT](https://img.shields.io/badge/License-MIT-A87B3F.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522.5-0C1B2A.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/DB-SQLite%20%7C%20MySQL-0C1B2A.svg)](#database)
[![Build](https://img.shields.io/badge/build-zero--build-2F6B4F.svg)](#stack)

> 中文 README: [README.md](README.md)

---

## Contents

- [What this is](#what-this-is)
- [What it ships with](#what-it-ships-with)
- [Quick start](#quick-start)
- [Project layout](#project-layout)
- [The admin panel](#the-admin-panel)
- [How bilingual works](#how-bilingual-works)
- [GEO / SEO: making the site legible to models](#geo--seo-making-the-site-legible-to-models)
- [Content model: 11 types, one code path](#content-model-11-types-one-code-path)
- [Stack](#stack)
- [Database](#database)
- [Deployment](#deployment)
- [Tests](#tests)
- [Contributing](#contributing)
- [License and brand](#license-and-brand)

---

## What this is

Tianxuewang (up366.com) works on one narrow problem: making English practice in Chinese schools measurable.
That work produced four product lines — speaking assessment, AI essay marking, a teaching platform, and
listening & vocabulary training.

This repository turns the "how do we explain that" problem into code you can run, edit and deploy:

- **A full public site** — home, product suite, case studies, newsroom, brand story, credentials, team,
  careers, contact.
- **A full admin panel** — CRUD for 11 content types, site settings, media library, enquiry inbox,
  administrators, audit log.
- **Real GEO support** — one `@graph` JSON-LD block per page, `llms.txt`, `sitemap.xml`, `hreflang`, so both
  search engines and generative engines (Doubao, DeepSeek, Qwen, Kimi…) can crawl and cite the site correctly.
- **Bilingual by construction** — not two sites, but one dataset and one set of templates with
  language-specific columns per field.

No bundler, no front-end framework, no ORM magic. Install, start, and the whole site is there.

## What it ships with

| Section | Path | Notes |
| --- | --- | --- |
| Home | `/` | Hero slides, key figures, three pillars, four products, eight-capability matrix, teaching loop, case studies, classroom feedback, milestones, news, partners, FAQ, CTA |
| Products | `/services` | Four product rows plus a detail page per product with capability lists and explicit limits |
| Case studies | `/cases` | Paginated library plus detail pages (engagement, region, scope, live-since year, products, gallery) |
| News | `/news` | Seven category filters, pagination, detail pages with sources, tags, prev/next, related reading |
| About | `/about` `/brand` `/trust` `/team` | Company, brand story and timeline, credentials, team structure |
| Careers | `/careers` | Role list plus detail pages with `JobPosting` structured data |
| Contact | `/contact` | Contact details and an enquiry form (CSRF, honeypot, rate limiting, DB + email notification) |
| Policies | `/privacy` `/terms` `/services-overview` | Privacy policy, terms of service, product boundaries |
| Admin | `/admin` | Content CRUD, settings, media, enquiries, GEO status, administrators |
| English site | `/en` and `/en/*` | A complete English mirror of every page |

## Quick start

### Requirements

- **Node.js ≥ 22.5** (uses the built-in `node:sqlite`; Node 18+ is enough if you run MySQL)
- No build step, no global tooling beyond npm

### Three steps

```bash
# 1. Dependencies
npm install

# 2. Create the schema, load bilingual seed content, create an admin, generate GEO files
npm run site:install -- --domain=https://www.up366.com --admin=admin --pass=your-password

# 3. Run
npm start          # http://localhost:3000
```

Open `http://localhost:3000` for Chinese, `http://localhost:3000/en` for English, and
`http://localhost:3000/admin` for the admin panel.

> Without `--pass`, the installer generates a 16-character password and prints it once — save it.
> Use `npm run passwd` to reset a forgotten password.

### Commands

```bash
npm start                 # production start
npm run dev               # dev mode (--watch)
npm run site:install      # install / reseed (--fresh rebuilds from scratch)
npm run site:check        # environment and directory checks
npm run passwd            # reset admin password
npm run static:export     # export a static copy to storage/static
npm run migrate:mysql     # SQLite → MySQL migration
npm test                  # smoke test (routes, pages, key output)
npm run test:admin        # admin login and permissions
npm run test:crud         # content CRUD
npm run test:security     # CSRF / honeypot / rate limit / XSS
npm run test:deploy       # sub-path deployment prefix
npm run test:content      # content integrity (bilingual fields, categories, sources, placeholders)
```

### Docker

```bash
docker compose up -d --build
# installs on first boot; http://localhost:8080
```

## Project layout

```text
up366/
├── app/                        # wiring layer
│   ├── config.js               # port / database / languages / paging / security
│   ├── routes.js               # 22 public (16 pages + 6 generated files) + 29 admin routes
│   ├── helpers.js              # e / url / ml / setting / asset / csrf_field …
│   └── bootstrap.js
├── config/                     # content and structure, editable without code
│   ├── content_types.json      # field lists, categories, list columns for 11 types
│   ├── settings_schema.json    # admin settings form
│   ├── seed_data.json          # settings / navs / slides / products / cases
│   └── seed_content.json       # articles / team / testimonials / partners / milestones / jobs / pages
├── docs/                       # documentation (Chinese)
│   ├── README.md               # index: four reading tracks
│   └── en/                     # documentation (English, one-to-one with Chinese)
├── examples/                   # copy-paste JSON-LD and GEO samples, with a README
├── install/                    # schema, seed, GEO generation, self-check
├── scripts/                    # tests, migration, export, password reset
├── src/
│   ├── core/                   # ctx / db / lang / settings / seo / repo / view / security …
│   ├── controllers/            # public controllers
│   └── admin/                  # admin controllers and generic CRUD
├── tests/                      # content tests, runnable without a server
├── views/
│   ├── site/                   # public templates (layout / partials / pages)
│   └── admin/                  # admin templates
├── assets/                     # css / js / img, referenced directly
├── .github/
│   ├── workflows/ci.yml        # content checks → site regression → image build
│   ├── ISSUE_TEMPLATE/         # bug report / feature request / contact links
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── dependabot.yml          # monthly dependency review
│   └── FUNDING.yml             # sponsor entry
├── llms.txt  llms-full.txt     # generated GEO files (Chinese and English)
├── README.md  README.en.md
├── LICENSE  CHANGELOG.md  CONTRIBUTING.md  SECURITY.md  DISCLAIMER.md
├── Dockerfile  docker-compose.yml  package.json
└── server.js
```

## The admin panel

After signing in at `/admin`, the left rail is ordered the way content work actually happens:

1. **Dashboard** — content totals, latest articles, newest enquiries, GEO status.
2. **Content** — articles, case studies, products, custom pages, jobs, team, testimonials, hero slides,
   partners, milestones, navigation. All 11 types share one list/edit UI driven by
   `config/content_types.json`; adding a field needs no code change.
3. **Operations** — enquiries (with status and source page), media library, GEO/SEO preview and regeneration.
4. **System** — site settings (basic, contact, SEO, home, social, system) and administrator accounts with an
   audit log.

Conventions worth knowing:

- Every field has a **Chinese and an English column**. Leave English empty and the English site falls back to
  Chinese rather than rendering a blank page.
- `sort` ascending controls order; turning `status` off removes the item from listings and the sitemap.
- Upload images through the media library; the editor inserts the path for you.
- Saving takes effect immediately — no restart. `sitemap.xml` and `llms.txt` are generated from live data.

More detail: [docs/en/usage.md](docs/en/usage.md).

## How bilingual works

Three rules, all of them deliberately contrary to "auto-detect the visitor's language":

1. **Language is decided by URL prefix only.** Chinese lives at the root, English under `/en`. No cookies, no
   `Accept-Language`, no `?lang=`.
2. **The language switch links straight to the same page in the other language**, identical to the
   `<link rel="alternate" hreflang>` target. No 302 hop.
3. **Fields are stored twice** — `title_cn` / `title_en` — with fallback to the other language when a
   translation is missing.

Why: crawlers such as Googlebot and GPTBot send `Accept-Language: en-US` by default. Detect language from the
request and your Chinese homepage gets crawled as English, which breaks `canonical` and `hreflang`. Let the URL
decide, and crawlers and humans see exactly the same thing.

## GEO / SEO: making the site legible to models

Generative engine optimisation here is a first-class concern, not a pre-launch afterthought:

- **One `@graph` block per page.** The first node is always `WebPage`, and its `name` matches the page
  `<title>` character for character. `Organization`, `Service`, `Article`, `FAQPage`, `BreadcrumbList`,
  `JobPosting` and `ItemList` nodes follow as needed, cross-referenced by `@id` so no entity is described twice.
- **`llms.txt` / `llms-full.txt`** — the former is a navigational summary of structure and key pages, the
  latter a full content index models can read directly. One pair per language, generated at runtime.
- **`sitemap.xml` / `robots.txt`** — every valid page included, drafts and noindex pages excluded.
- **`hreflang` and `canonical`** — the two languages reference each other instead of competing.

Samples live in [examples/](examples/); field conventions in [docs/en/api.md](docs/en/api.md).

## Content model: 11 types, one code path

| Type | Purpose | Key fields |
| --- | --- | --- |
| `articles` | News and opinion | category, title, summary, cover, body, tags, author, source, published_at, pinned |
| `cases` | Case studies | engagement, region, scope of use, live-since year, products, highlights, gallery |
| `services` | Products | subtitle, summary, capability list, body |
| `pages` | Single pages | template (standard / legal / internal), title, subtitle, body |
| `team` | Team | name, role, photo, bio |
| `testimonials` | Classroom feedback | attribution, context, quote |
| `partners` | Partners and standing | name, group (standards body / school / media) |
| `milestones` | Timeline | year, title, description |
| `jobs` | Careers | team, location, type, salary, headcount, body |
| `slides` | Hero carousel | title, subtitle, summary, image, button, link |
| `navs` | Navigation | label, URL, sort order |

To add a content type, add a block to `config/content_types.json`. The admin list, the edit form and the
front-end data access all follow automatically.

## Stack

| Decision | Choice | Why |
| --- | --- | --- |
| Runtime | Node.js + Express 4 | Mature ecosystem, shortest path to deployment |
| Templates | In-house zero-build EJS (`#` comments, `include`, layout inheritance) | Edit HTML, see it immediately — no bundler |
| Database | SQLite (default) / MySQL | Start with zero ops, scale without rewriting SQL |
| Client | Vanilla JS + CSS custom properties | No framework, no polyfill, no hydration cost |
| Security | CSP / CSRF / bcrypt / honeypot / rate limit / SVG sanitising | Education data involves minors; defaults are strict |

## Database

SQLite by default, stored at `data/app.sqlite`:

```bash
npm run site:install
```

Switching to MySQL is environment-only — no code changes:

```bash
HZ_DB_DRIVER=mysql \
HZ_DB_HOST=127.0.0.1 HZ_DB_PORT=3306 \
HZ_DB_NAME=up366 HZ_DB_USER=root HZ_DB_PASS=****** \
npm run site:install

npm run migrate:mysql     # migrate existing SQLite data
```

## Deployment

**Plain Node**

```bash
npm ci --omit=dev
npm run site:install
HZ_PORT=3000 NODE_ENV=production node server.js
```

**PM2** (config included)

```bash
pm2 start ecosystem.config.js && pm2 save
```

**Sub-path deployment** (e.g. `https://example.com/up366`) needs no code change:

```nginx
location /up366/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Prefix /up366;
}
```

**Static export** (when the form and admin are not needed)

```bash
npm run static:export     # writes to storage/static
```

## Tests

Five suites, no overlap. The first two run without a server; the rest spin up their own isolated instance, shut it
down afterwards, and can be re-run as often as you like.

| Command | What it proves | Needs a running server |
| --- | --- | --- |
| `npm run test:content` | Content rules: every article sources itself, every case carries a disclaimer, bilingual fields come in pairs, no placeholders or legacy brand strings | No |
| `npm test` | Full-site regression: walks every URL in `sitemap.xml`, checks canonical / hreflang / JSON-LD / OG per page | Yes (`127.0.0.1:8099`) |
| `npm run test:security` | Security baseline: headers, CSRF, rate limits, upload sandbox, path traversal, cookie flags | No |
| `npm run test:admin` | Admin login and every list screen | No |
| `npm run test:crud` | Create / read / update / delete round-trip for all 11 content types | No |
| `npm run test:deploy` | All three deployment modes (root / subdirectory / `X-Forwarded-Prefix`) keep every internal link correct | No |
| `npm run test:migrate` | SQLite → MySQL migration self-test | No |

`npm test` targets local port 8099 by default; point it elsewhere with `node scripts/smoke.js https://www.up366.com`.

CI runs exactly this set — see [.github/workflows/ci.yml](.github/workflows/ci.yml): content checks → install, boot,
full regression → build the image and probe its health endpoint. All three gates green, or it does not merge.

## Contributing

- Run `npm test`, `npm run test:security` and `npm run test:content` before opening a PR; add `test:admin` and
  `test:crud` if you touched the admin.
- Content changes must keep Chinese and English in sync — one-sided edits are rejected.
- Any factual claim, figure or report must carry a source. No invented numbers.
- Full workflow: [CONTRIBUTING.md](CONTRIBUTING.md). Security reports: [SECURITY.md](SECURITY.md).
  Read [.github/ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE/) before filing an issue.

## License and brand

- Code is released under the [MIT License](LICENSE) — free for commercial use, modification and redistribution.
- **The names "天学网" and "up366", the logo, page copy and image assets are not covered by the MIT grant.**
  Replace them with your own brand and content before deploying. See [DISCLAIMER.md](DISCLAIMER.md).
- Teaching-outcome statements on the site describe product capability and published case studies; they are not
  a guarantee of results for any particular school or class.
