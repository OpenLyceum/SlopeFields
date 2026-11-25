# AGENTS.md — Slope Fields

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Slope Fields (`slope-fields`) is a SceneryStack simulation scaffolded from SceneryStackTemplate.

## Key files

| File | Purpose |
|---|---|
| `src/SlopeFieldsColors.ts` | All `ProfileColorProperty` instances |
| `src/SlopeFieldsConstants.ts` | Named numeric constants |
| `src/SlopeFieldsNamespace.ts` | Namespace for color property names |
| `src/i18n/StringManager.ts` | Singleton localized string accessor |
| `src/common/SlopeFieldsPanel.ts` | Pre-themed `Panel` wrapper |
| `src/common/SlopeFieldsButtonOptions.ts` | Flat button / combo-box option bundles |
| `src/slope-field/SlopeFieldScreen.ts` | Screen wrapper |
| `src/slope-field/model/SlopeFieldModel.ts` | Simulation state and logic |
| `src/slope-field/view/SlopeFieldScreenView.ts` | Visual nodes, layout, a11y wiring |
| `src/euler/EulerScreen.ts` | Screen wrapper |
| `src/euler/model/EulerModel.ts` | Simulation state and logic |
| `src/euler/view/EulerScreenView.ts` | Visual nodes, layout, a11y wiring |
| `src/growth-models/GrowthModelsScreen.ts` | Screen wrapper |
| `src/growth-models/model/GrowthModelsModel.ts` | Simulation state and logic |
| `src/growth-models/view/GrowthModelsScreenView.ts` | Visual nodes, layout, a11y wiring |

## Compliance carve-outs

None yet.
