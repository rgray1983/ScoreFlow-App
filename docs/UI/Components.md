# Shared UI Components

The Coach app should grow through reusable components rather than one-off page markup.

## Planned component groups

### Navigation
- App shell
- iPad navigation rail
- Phone bottom navigation
- More drawer
- Top bar

### Actions
- Primary, secondary, destructive, and quiet buttons
- Icon buttons
- Floating or sticky match actions where needed

### Data display
- Team card
- Player card
- Match card
- Schedule event card
- Stat metric
- Status pill
- Timeline item
- Empty state

### Inputs
- Text, number, date, time, and search fields
- Select and multi-select
- Color picker with HEX input, brand swatches, and recent colors
- Photo and logo upload
- Toggle, checkbox, and segmented controls

### Feedback
- Modal and bottom sheet
- Confirmation dialog
- Toast
- Loading skeleton
- Offline/sync indicator
- Validation and error state

## Component rules

- Components expose typed props.
- Styles use shared tokens.
- Mobile behavior is designed first.
- Components must handle long names and real data without hiding essential values.
- Destructive actions require clear confirmation.
- Forms preserve unsaved local work whenever practical.
