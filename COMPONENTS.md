# ScoreFlow V2 Components

This project is still plain HTML/CSS/JS, so "components" are CSS/HTML patterns rather than React components.

## Reusable components

- `.sf-card` / `.home-card`
- `.icon-btn`
- `.top-bar`
- `.status-cluster`
- `.viewer-count`
- `.live-status`
- `.team-panel`
- `.logo-picker`
- `.score-btn`
- `.point-actions`
- `.sets-card`
- `.center-panel`
- `.match-pill`
- `.alert-banner`
- `.set-box`
- `.control-grid`
- `.fan-zone-card`
- `.chat-message`
- `.settings-card`
- `.dialog-actions`

## Layout modes

The same IDs are preserved so the existing JavaScript keeps working:

- Landscape scorer
- Portrait scorer
- Portrait viewer
- Home screen
- Fan Zone
- Dialogs

## Rule for future changes

Do not add one-off overrides at the bottom of `style.css`.

Find the section for the component/layout you are changing and edit that source rule.
