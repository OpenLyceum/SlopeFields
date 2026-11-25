# Implementation notes — Slope Fields

Developer-facing architecture notes for `slope-fields`.

## Architecture

Screens: src/slope-field/, src/euler/, src/growth-models/

- Models own state and `step` / `reset`; views observe Properties and never integrate physics.
- Colors live in `src/SlopeFieldsColors.ts`; strings in `src/i18n/` via `StringManager`.
- Preferences shell: `src/preferences/` (empty until sim-specific prefs are added).

## Notes

*Record design decisions, performance constraints, and known limitations here.*
