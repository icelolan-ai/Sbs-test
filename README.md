# Silver Bullet Security website

A responsive company website using HTML, CSS and JavaScript. There is no build step, package installation, application server or database required for the current feature set.

## Run locally

Install Python 3, extract the full folder, then:

- Windows: double-click `START-WINDOWS.bat`.
- macOS/Linux: run `sh START-MAC-LINUX.sh` in Terminal.
- Any supported system: run `python server.py` (or `python3 server.py`).

The launcher opens **http://localhost:8000/**. Keep the terminal open; press Ctrl+C to stop. If port 8000 is occupied, run `python server.py --port 8001`. Do not open index.html directly with a file URL.

The server listens only on the local machine. It is for review and development, not production hosting. Google Fonts, map links, social links and original training pages require internet access. Images, styles and scripts are bundled locally. System fonts are used if Google Fonts cannot load.

## Editing

| Content | Location |
| --- | --- |
| Email, training links, office addresses, phone and social links | `js/config.js` |
| English and Thai text | `js/i18n.js` |
| Page structure and metadata | `index.html` |
| Layout, colors and responsive rules | `css/styles.css` |
| Interaction and animation | `js/main.js` |
| Photos and brand assets | `assets/` |
| Offline caching | `sw.js` and `manifest.webmanifest` |

After CSS/JS changes, update asset query versions in index.html and CACHE in sw.js. The phone contact button is hidden until a phone number is configured.

## Documentation

- `docs/PROJECT-OVERVIEW.md`: features, scope and review plan.
- `docs/AWS-DEPLOYMENT.md`: proposed infrastructure, access and release process.
- `docs/REVIEW-CHECKLIST.md`: acceptance checks and remaining production configuration.

Contact buttons open the visitor's email application. This version does not collect form submissions, store customer data or provide an authentication system. Background security graphics are decorative, not live security monitoring.
