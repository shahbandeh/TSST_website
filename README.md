# TSST — Transient Science @ Space Telescope

An original, responsive static website for Transient Science @ Space Telescope (TSST), including the STScI's Transients people directory.

## What is included

- `index.html` — semantic page content and sections
- `styles.css` — responsive layout, visual system, and CSS artwork
- `script.js` — mobile navigation, section tracking, and subtle reveal effects

## Local preview

Open `index.html` in a browser, or use a local web server such as:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

The site has no build step or runtime dependencies.

## ADS publication sync

The Publications section is refreshed every Monday by `.github/workflows/sync-publications.yml`. It selects each member's three most-cited first-author refereed papers.

1. Sign in to [NASA ADS](https://ui.adsabs.harvard.edu/), open **Account → Customize Settings → API Token**, and generate or copy your token.
2. In this GitHub repository, open **Settings → Secrets and variables → Actions**.
3. Create a repository secret named `ADS_API_TOKEN` and paste the token as its value.
4. Open **Actions → Sync ADS publications → Run workflow** for the first synchronization.

Never add the token to a source file. Author searches are configured in `data/team-authors.json`; ORCID-based queries can be used there when a name is ambiguous.
