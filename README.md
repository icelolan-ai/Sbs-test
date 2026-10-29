# Silver Bullet Security — interactive site mockup

Mobile-first, app-style prototype (bottom tab bar, bottom sheets, scroll reveals) built from the content and
photos of https://silverbulletsecurity.com. Plain HTML/CSS/JS — no build step.

```
python3 -m http.server 8000   # then open http://localhost:8000
```

## Where to edit
| What | File |
| --- | --- |
| Email, **phone number**, training links, offices, social links | `js/config.js` |
| All wording, English and Thai (services, tiers, comparison tables, profile, journey) | `js/i18n.js` |
| Colours / layout | `css/styles.css` (tokens at the top) |
| Photos and logo | `assets/img/` |

- Leave `phone` empty in `config.js` and the Call button stays hidden; fill it in and it appears.
- Leave `links.secureBangkok` / `links.gamp` empty and those buttons email the training address instead.
- Thai text is a first draft and should be reviewed by a native speaker before publishing.
- The site can be installed to a phone's home screen (PWA) when served over HTTPS.
