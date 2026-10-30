# Website review checklist

## Business review

- Approve English and Thai content, service names and all Bronze/Silver/Gold capabilities.
- Verify company history, offices, contacts and training program links.
- Confirm current event availability; no unconfirmed event date is advertised.
- Approve photos and check whether any dashboard information visible in photos needs masking.
- Decide the staging access policy, production hostname and legacy URL redirects.

## Functional acceptance

- Logo hover/touch emphasis resets correctly; long-press image menu checked on a physical iPhone.
- Animated circuits extend on downward scroll and retract on return; reduced-motion mode stays usable.
- Hero text fades with scroll; navigation and EN/TH switching work.
- Consulting, monitoring and training dialogs open/close; keyboard and escape behavior work.
- Tier dots have names, active red state and correct details. Desktop wheel selection works. Smartphone cards do not change tier when touched; dot buttons do.
- Methodology wheel responds to mouse, touch and keyboard.
- Office map pins, Office addresses disclosure, map links and contact links work.
- No clipped text or horizontal overflow on phone, tablet and desktop.
- Test real iPhone/Safari and Android/Chrome, plus desktop Chrome/Edge and Safari as applicable.

## Deployment acceptance

- S3 stays private; CloudFront OAC and HTTPS work.
- Confirm correct content types, all image/script/style URLs and custom-domain share metadata.
- Check fresh browser load, update from a previous cached version, and offline fallback after an online visit.
- Confirm that external font loading failure still leaves readable system fonts.
- Keep rollback files and record the accepted release.
