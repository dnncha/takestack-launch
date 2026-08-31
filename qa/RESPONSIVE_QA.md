# Standalone site responsive QA

Date: 1 September 2026

Candidate: local working tree based on `ffd0ea76fb11d1a51f7e8b7a0b69030dd312d09b`

## Rendered checks

Chromium 1.62.1 rendered the static site from a local HTTP server at:

- Desktop: 1440 × 1000 CSS pixels
- Mobile: 393 × 852 CSS pixels
- Pages: home, support, privacy
- Full-page captures: `output/playwright/`
- Homepage HAR captures: no responses with status 400 or higher; three requests each for the document, stylesheet, and favicon

The captures show the header, workflow cards, calls to action, footer, and policy content without horizontal overflow or clipped text at both widths. Mobile collapses workflow cards to one column and keeps navigation and controls visible.

## Accessibility checks

- Every page has one `h1`, landmark elements, a labelled primary navigation, and a keyboard-visible skip link.
- Interactive elements are native links with visible focus treatment.
- The performance mockup has a concise accessible description; decorative internal shapes are hidden from assistive technology.
- There are no content images requiring alternate text.
- Reduced-motion preference disables smooth scrolling.
- Light and dark colour schemes are supported; blue link text is lightened on dark policy pages.

Automated source validation is implemented in `script/check_public_site.py`. The bundled `playwright-cli` wrapper could not start because the installed package exposed no `playwright-cli` executable, so screenshots were captured with the available Playwright screenshot command and Chrome instead. No automated assistive-technology audit was available.

## Before and after

- `output/playwright/before-desktop.png`: previous desktop/founder site from the base commit.
- `output/playwright/after-desktop.png`: standalone iPhone homepage at desktop width.
- `output/playwright/after-mobile.png`: standalone iPhone homepage at mobile width.

## Release boundary

These are local source and browser-rendering results. They do not prove deployment, production routing, inbox delivery, App Store availability, an installed app, or physical-device behaviour. Production HTTP, redirects, canonicals, assets, and support mail delivery remain post-deployment checks.
