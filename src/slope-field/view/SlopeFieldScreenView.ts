/**
 * SlopeFieldScreenView.ts
 *
 * Lesson view for the Slope Field screen: slope-field Path, solution curves,
 * equilibria / isocline overlays, initial-point handle, and control panel.
 */

import { Multilink } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { localeProperty } from "scenerystack/joist";
import { StringUtils } from "scenerystack/phetcommon";
import { Text } from "scenerystack/scenery";
import {
  button,
  type Choice,
  checkbox,
  column,
  comboBox,
  computed,
  format,
  LessonView,
  type Plot,
  richText,
  row,
  slider,
  text,
} from "../../common/LessonView.js";
import { EQUATIONS, isocline } from "../../common/model/EquationLibrary.js";
import { traceSolution } from "../../common/model/odeSolvers.js";
import { SlopeFieldNode } from "../../common/SlopeFieldNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import Colors from "../../SlopeFieldsColors.js";
import { INITIAL_POINT_STEP } from "../../SlopeFieldsConstants.js";
import type { SlopeFieldModel } from "../model/SlopeFieldModel.js";

/** Classify an autonomous equilibrium by the sign of f just below / above c. */
function classifyEquilibrium(f: (x: number, y: number) => number, c: number): "stable" | "unstable" | "semistable" {
  const below = f(0, c - 1e-3);
  const above = f(0, c + 1e-3);
  const upBelow = below > 0;
  const downAbove = above < 0;
  if (upBelow && downAbove) {
    return "stable";
  }
  if (!(upBelow || downAbove)) {
    return "unstable";
  }
  return "semistable";
}

/** True when the numerical trace fails to span the full x-window or exits the y-window. */
function solutionLeavesWindow(
  points: ReadonlyArray<readonly [number, number]>,
  domain: { xMin: number; xMax: number; yMin: number; yMax: number },
): boolean {
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined) {
    return true;
  }
  const h = (domain.xMax - domain.xMin) / 400;
  if (first[0] > domain.xMin + 2 * h || last[0] < domain.xMax - 2 * h) {
    return true;
  }
  for (const [, y] of points) {
    if (y < domain.yMin || y > domain.yMax) {
      return true;
    }
  }
  return false;
}

export class SlopeFieldScreenView extends LessonView {
  private readonly fieldNode = new SlopeFieldNode();
  private readonly model: SlopeFieldModel;
  private readonly initialHandle: ReturnType<Plot["handle"]>;

  public constructor(model: SlopeFieldModel) {
    const manager = StringManager.getInstance();
    const strings = manager.getLessonStrings();
    const names = manager.getScreenNames();
    const summary = manager.getSlopeFieldA11yStrings().screenSummary;

    const dependencies = [
      model.equationIdProperty,
      model.initialPointProperty,
      model.densityProperty,
      model.segmentScaleProperty,
      model.showIsoclineProperty,
      model.isoclineSlopeProperty,
      model.showEquilibriaProperty,
      model.showExactProperty,
      model.pinnedCurves.lengthProperty,
    ] as const;

    const details = computed([...dependencies], () => {
      const eq = model.equation;
      const { x, y } = model.initialPointProperty.value;
      const leaves = solutionLeavesWindow(model.currentSolution, eq.domain);
      const windowNote = leaves
        ? strings.solutionLeavesWindowStringProperty.value
        : strings.solutionStaysInWindowStringProperty.value;
      return `${eq.latex}. (x₀, y₀) = (${format(x)}, ${format(y)}). ${windowNote}`;
    });

    super({
      title: names.slopeFieldStringProperty,
      hint: summary.interactionHintStringProperty,
      playDescription: summary.playAreaStringProperty,
      controlDescription: summary.controlAreaStringProperty,
      details,
    });
    this.model = model;

    const equationChoices: Choice<string>[] = EQUATIONS.map((eq) => ({
      value: eq.id,
      label: eq.latex,
      name: eq.latex,
    }));
    const equationBox = comboBox(
      model.equationIdProperty,
      equationChoices,
      this.listParent,
      strings.equationStringProperty,
      292,
    );

    const exactCheckbox = checkbox(model.showExactProperty, strings.exactSolutionStringProperty);
    const equilibriaCheckbox = checkbox(model.showEquilibriaProperty, strings.equilibriaStringProperty);
    const isoclineCheckbox = checkbox(model.showIsoclineProperty, strings.isoclineStringProperty);

    const isoclineSlider = slider(
      strings.isoclineSlopeStringProperty,
      model.isoclineSlopeProperty,
      -3,
      3,
      1,
      undefined,
      0.5,
    );
    const densitySlider = slider(strings.arrowsPerRowStringProperty, model.densityProperty, 9, 31, 0, undefined, 2);
    const scaleSlider = slider(
      strings.arrowLengthStringProperty,
      model.segmentScaleProperty,
      0.3,
      1,
      1,
      undefined,
      0.1,
    );

    const keepButton = button(strings.keepCurveStringProperty, () => model.keepCurve());
    const clearButton = button(strings.clearCurvesStringProperty, () => model.clearCurves());

    Multilink.multilink([model.equationIdProperty], () => {
      const eq = model.equation;
      exactCheckbox.enabledProperty.value = eq.exact !== undefined;
      equilibriaCheckbox.enabledProperty.value = eq.equilibria.length > 0;
    });
    Multilink.multilink([model.showIsoclineProperty], (show) => {
      isoclineSlider.enabled = show;
    });
    Multilink.multilink([model.pinnedCurves.lengthProperty], (n) => {
      clearButton.enabled = n > 0;
    });

    const controls = column(
      equationBox,
      exactCheckbox,
      equilibriaCheckbox,
      isoclineCheckbox,
      isoclineSlider,
      densitySlider,
      scaleSlider,
      row(keepButton, clearButton),
    );

    const equationLine = computed([model.equationIdProperty], () => model.equation.latex);
    const pointLine = computed([model.initialPointProperty, strings.initialPointReadoutStringProperty], () => {
      const { x, y } = model.initialPointProperty.value;
      return StringUtils.fillIn(strings.initialPointReadoutStringProperty.value, {
        x: format(x),
        y: format(y),
      });
    });
    const slopeLine = computed(
      [model.equationIdProperty, model.initialPointProperty, strings.slopeAtInitialStringProperty],
      () => {
        const eq = model.equation;
        const { x, y } = model.initialPointProperty.value;
        const slope = eq.f(x, y);
        return StringUtils.fillIn(strings.slopeAtInitialStringProperty.value, {
          slope: Number.isFinite(slope) ? format(slope) : "—",
        });
      },
    );
    const equilibriaNote = computed(
      [
        model.equationIdProperty,
        strings.equilibriaNoteStringProperty,
        strings.stableStringProperty,
        strings.unstableStringProperty,
        strings.semistableStringProperty,
        strings.noEquilibriaNoteStringProperty,
      ],
      () => {
        const eq = model.equation;
        if (!eq.autonomous || eq.equilibria.length === 0) {
          return strings.noEquilibriaNoteStringProperty.value;
        }
        const parts = eq.equilibria.map((c) => {
          const kind = classifyEquilibrium(eq.f, c);
          const label =
            kind === "stable"
              ? strings.stableStringProperty.value
              : kind === "unstable"
                ? strings.unstableStringProperty.value
                : strings.semistableStringProperty.value;
          return `y = ${format(c)} (${label})`;
        });
        return StringUtils.fillIn(strings.equilibriaNoteStringProperty.value, {
          list: parts.join("; "),
        });
      },
    );

    const notes = column(
      richText(equationLine, 16, this.notesWidth, true),
      text(pointLine, 15, this.notesWidth),
      text(slopeLine, 15, this.notesWidth),
      richText(equilibriaNote, 14, this.notesWidth, false, true),
    );

    this.finish(controls, notes, () => model.reset());

    const plot = this.plot;
    const clampPoint = (x: number, y: number) => {
      const { xMin, xMax, yMin, yMax } = model.equation.domain;
      model.initialPointProperty.value = new Vector2(
        Math.max(xMin, Math.min(xMax, x)),
        Math.max(yMin, Math.min(yMax, y)),
      );
    };

    plot.onDrag((x, y) => clampPoint(x, y));

    this.initialHandle = plot.handle({
      drag: (px, py) => clampPoint(plot.modelX(px), plot.modelY(py)),
      keyboard: {
        name: strings.initialPointHandleStringProperty,
        direction: "both",
        step: (dx, dy) => {
          const p = model.initialPointProperty.value;
          clampPoint(p.x + dx * INITIAL_POINT_STEP, p.y + dy * INITIAL_POINT_STEP);
        },
      },
      readout: () => {
        const { x, y } = model.initialPointProperty.value;
        return StringUtils.fillIn(strings.initialPointReadoutStringProperty.value, {
          x: format(x),
          y: format(y),
        });
      },
    });

    Multilink.multilink([localeProperty, ...dependencies], () => this.redraw());
  }

  private redraw(): void {
    const model = this.model;
    const plot = this.plot;
    const eq = model.equation;
    const domain = eq.domain;
    const { xMin, xMax, yMin, yMax } = domain;

    plot.setDomain([xMin, xMax, yMin, yMax], "x", "y");

    if (this.fieldNode.parent) {
      this.fieldNode.parent.removeChild(this.fieldNode);
    }
    plot.clear();

    this.fieldNode.update(plot, eq.f, domain, model.densityProperty.value, model.segmentScaleProperty.value);
    plot.layers.addChild(this.fieldNode);

    const h = (xMax - xMin) / 400;
    for (const pinned of model.pinnedCurves) {
      plot.line(traceSolution(eq.f, pinned.x0, pinned.y0, domain, h), Colors.secondaryColorProperty, 2);
    }
    plot.line(model.currentSolution, Colors.accentColorProperty, 3);

    if (model.showExactProperty.value && eq.exact) {
      const { x, y } = model.initialPointProperty.value;
      const exactFn = eq.exact(x, y);
      const count = 400;
      const points: Array<readonly [number, number]> = [];
      for (let i = 0; i <= count; i++) {
        const xi = xMin + ((xMax - xMin) * i) / count;
        points.push([xi, exactFn(xi)]);
      }
      plot.line(points, Colors.tertiaryColorProperty, 2, [6, 4]);
    }

    if (model.showEquilibriaProperty.value && eq.equilibria.length > 0) {
      const strings = StringManager.getInstance().getLessonStrings();
      for (const c of eq.equilibria) {
        plot.line(
          [
            [xMin, c],
            [xMax, c],
          ],
          Colors.quaternaryColorProperty,
          2,
        );
        const label = new Text(StringUtils.fillIn(strings.equilibriumLabelStringProperty.value, { c: format(c) }), {
          font: "12px sans-serif",
          fill: Colors.quaternaryColorProperty,
          pickable: false,
        });
        label.right = plot.plotX(xMax) - 8;
        label.centerY = plot.plotY(c) - 10;
        plot.layers.addChild(label);
      }
    }

    if (model.showIsoclineProperty.value) {
      // positiveFill (#204859) has weak contrast on the panel (#16213e); use quaternary
      // with a longer dash than equilibria (solid) so the isocline stays distinct.
      const pieces = isocline(eq, model.isoclineSlopeProperty.value, domain);
      for (const poly of pieces) {
        plot.line(poly, Colors.quaternaryColorProperty, 1.5, [6, 3]);
      }
    }

    const { x, y } = model.initialPointProperty.value;
    this.initialHandle.place(plot.plotX(x), plot.plotY(y));
  }
}
