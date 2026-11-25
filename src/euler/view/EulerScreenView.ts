/**
 * EulerScreenView.ts
 *
 * Lesson view for Euler's Method: slope field, exact curve, stepped Euler
 * polyline with tangent preview, Heun / RK4 overlays, start and xEnd handles,
 * and a compact step table with error readout.
 */

import { Multilink, type ReadOnlyProperty } from "scenerystack/axon";
import { localeProperty } from "scenerystack/joist";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, Node, Text } from "scenerystack/scenery";
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
  radioButtons,
  richText,
  row,
  text,
} from "../../common/LessonView.js";
import { equationById } from "../../common/model/EquationLibrary.js";
import { SlopeFieldNode } from "../../common/SlopeFieldNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import Colors from "../../SlopeFieldsColors.js";
import {
  EULER_FIELD_DENSITY,
  EULER_FIELD_SCALE,
  INITIAL_POINT_STEP,
  STEP_SIZE_PRESETS,
  X_END_MIN_GAP,
  X_END_STEP,
} from "../../SlopeFieldsConstants.js";
import { EULER_EQUATION_IDS, type EulerModel } from "../model/EulerModel.js";

const TABLE_FONT = "13px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function mono(value: string | ReadOnlyProperty<string>, width = 72): Text {
  return new Text(value, {
    font: TABLE_FONT,
    maxWidth: width,
    fill: Colors.textColorProperty,
  });
}

/** Rows to show in the step table: first 3, last 3, with an ellipsis when needed. */
function visibleStepIndices(stepsTaken: number): Array<number | "ellipsis"> {
  if (stepsTaken <= 5) {
    return Array.from({ length: stepsTaken + 1 }, (_, i) => i);
  }
  return [0, 1, 2, "ellipsis", stepsTaken - 2, stepsTaken - 1, stepsTaken];
}

export class EulerScreenView extends LessonView {
  private readonly fieldNode = new SlopeFieldNode();
  private readonly model: EulerModel;
  private readonly startHandle: ReturnType<Plot["handle"]>;
  private readonly xEndHandle: ReturnType<Plot["handle"]>;
  private readonly tableBox: GridBox;
  private readonly tableParent: Node;

  public constructor(model: EulerModel) {
    const manager = StringManager.getInstance();
    const strings = manager.getLessonStrings();
    const names = manager.getScreenNames();
    const summary = manager.getEulerA11yStrings().screenSummary;

    const dependencies = [
      model.equationIdProperty,
      model.x0Property,
      model.y0Property,
      model.xEndProperty,
      model.stepSizeProperty,
      model.stepsTakenProperty,
      model.isPlayingProperty,
      model.showHeunProperty,
      model.showRk4Property,
      model.showExactProperty,
      model.showFieldProperty,
    ] as const;

    const details = computed([...dependencies], () => {
      const h = model.stepSizeProperty.value;
      const taken = model.stepsTakenProperty.value;
      const n = model.totalSteps;
      const points = model.eulerPoints("euler");
      const current = points[Math.min(taken, points.length - 1)];
      const xy = current === undefined ? "—" : `(${format(current[0])}, ${format(current[1])})`;
      let textValue = StringUtils.fillIn(strings.eulerDetailsStringProperty.value, {
        h: format(h, 2),
        taken: `${taken}`,
        n: `${n}`,
        point: xy,
      });
      if (taken >= n && n > 0) {
        const err = model.globalError("euler");
        textValue += ` ${StringUtils.fillIn(strings.eulerDetailsErrorStringProperty.value, {
          error: format(err, 4),
        })}`;
      }
      return textValue;
    });

    super({
      title: names.eulerStringProperty,
      hint: summary.interactionHintStringProperty,
      playDescription: summary.playAreaStringProperty,
      controlDescription: summary.controlAreaStringProperty,
      details,
    });
    this.model = model;

    const equationChoices: Choice<string>[] = EULER_EQUATION_IDS.map((id) => {
      const eq = equationById(id);
      return { value: id, label: eq.latex, name: eq.latex };
    });
    const equationBox = comboBox(
      model.equationIdProperty,
      equationChoices,
      this.listParent,
      strings.equationStringProperty,
      292,
    );

    const stepSizeChoices: Choice<number>[] = STEP_SIZE_PRESETS.map((h) => ({
      value: h,
      label: format(h, 2),
      name: format(h, 2),
    }));
    // Radio presets only — a slider would not fit the control panel with the button rows.
    const stepSizeRadios = radioButtons(model.stepSizeProperty, stepSizeChoices, strings.stepSizeStringProperty, {
      orientation: "horizontal",
      size: 13,
      width: 44,
    });

    const stepButton = button(strings.stepStringProperty, () => model.stepForward());
    const playLabel = computed(
      [model.isPlayingProperty, strings.playStringProperty, strings.pauseStringProperty],
      () => (model.isPlayingProperty.value ? strings.pauseStringProperty.value : strings.playStringProperty.value),
    );
    const playButton = button(playLabel, () => {
      if (model.stepsTakenProperty.value >= model.totalSteps) {
        return;
      }
      model.isPlayingProperty.value = !model.isPlayingProperty.value;
    });
    const showAllButton = button(strings.showAllStringProperty, () => model.showAll());
    const restartButton = button(strings.restartStringProperty, () => model.restart());
    const halveButton = button(strings.halveHStringProperty, () => model.halveStep());

    const exactCheckbox = checkbox(model.showExactProperty, strings.exactSolutionStringProperty);
    const heunCheckbox = checkbox(model.showHeunProperty, strings.improvedEulerStringProperty);
    const rk4Checkbox = checkbox(model.showRk4Property, strings.rk4StringProperty);
    const fieldCheckbox = checkbox(model.showFieldProperty, strings.slopeFieldStringProperty);

    Multilink.multilink(
      [model.stepsTakenProperty, model.stepSizeProperty, model.x0Property, model.xEndProperty],
      () => {
        stepButton.enabled = model.stepsTakenProperty.value < model.totalSteps;
        playButton.enabled = model.stepsTakenProperty.value < model.totalSteps;
      },
    );
    const minPreset = STEP_SIZE_PRESETS[STEP_SIZE_PRESETS.length - 1] ?? 0.05;
    Multilink.multilink([model.stepSizeProperty], (h) => {
      halveButton.enabled = h > minPreset + 1e-12;
    });

    const controls = column(
      equationBox,
      text(strings.stepSizeStringProperty, 15, 290, true),
      stepSizeRadios,
      row(stepButton, playButton),
      row(showAllButton, restartButton),
      halveButton,
      exactCheckbox,
      heunCheckbox,
      rk4Checkbox,
      fieldCheckbox,
    );

    this.tableBox = new GridBox({
      xSpacing: 14,
      ySpacing: 3,
      xAlign: "left",
      yAlign: "center",
    });
    this.tableParent = new Node({ children: [this.tableBox] });

    const readout = computed([...dependencies], () => this.buildReadout());
    const heunRk4Readout = computed([...dependencies], () => this.buildOverlayErrors());

    const notes = row(
      this.tableParent,
      column(
        text(readout, 14, 340),
        text(heunRk4Readout, 13, 340),
        richText(strings.orderHintStringProperty, 12, 340, false, true),
      ),
    );

    this.finish(controls, notes, () => model.reset());

    const plot = this.plot;
    const clampStart = (x: number, y: number) => {
      const { xMin, xMax, yMin, yMax } = model.equation.domain;
      const x0 = Math.max(xMin, Math.min(xMax - X_END_MIN_GAP, x));
      const y0 = Math.max(yMin, Math.min(yMax, y));
      model.x0Property.value = x0;
      model.y0Property.value = y0;
    };
    const clampXEnd = (x: number) => {
      const min = model.x0Property.value + X_END_MIN_GAP;
      const max = model.equation.domain.xMax;
      model.xEndProperty.value = Math.max(min, Math.min(max, x));
    };

    this.startHandle = plot.handle({
      drag: (px, py) => clampStart(plot.modelX(px), plot.modelY(py)),
      keyboard: {
        name: strings.startPointHandleStringProperty,
        direction: "both",
        step: (dx, dy) => {
          clampStart(
            model.x0Property.value + dx * INITIAL_POINT_STEP,
            model.y0Property.value + dy * INITIAL_POINT_STEP,
          );
        },
      },
      readout: () =>
        StringUtils.fillIn(strings.initialPointReadoutStringProperty.value, {
          x: format(model.x0Property.value),
          y: format(model.y0Property.value),
        }),
    });

    this.xEndHandle = plot.handle({
      fill: Colors.secondaryColorProperty,
      cursor: "ew-resize",
      drag: (px) => clampXEnd(plot.modelX(px)),
      keyboard: {
        name: strings.xEndHandleStringProperty,
        direction: "leftRight",
        step: (dx) => clampXEnd(model.xEndProperty.value + dx * X_END_STEP),
      },
      readout: () =>
        StringUtils.fillIn(strings.xEndReadoutStringProperty.value, {
          x: format(model.xEndProperty.value),
        }),
    });

    Multilink.multilink([localeProperty, ...dependencies], () => this.redraw());
  }

  private buildReadout(): string {
    const model = this.model;
    const strings = StringManager.getInstance().getLessonStrings();
    const points = model.eulerPoints("euler");
    const taken = model.stepsTakenProperty.value;
    const current = points[Math.min(taken, Math.max(0, points.length - 1))];
    if (current === undefined) {
      return "";
    }
    const exact = model.exactAt(current[0]);
    const err =
      taken >= model.totalSteps && model.totalSteps > 0
        ? format(model.globalError("euler"), 4)
        : format(Math.abs(current[1] - exact), 4);
    return StringUtils.fillIn(strings.eulerReadoutStringProperty.value, {
      x: format(current[0]),
      y: format(current[1]),
      exact: format(exact),
      error: err,
    });
  }

  private buildOverlayErrors(): string {
    const model = this.model;
    const strings = StringManager.getInstance().getLessonStrings();
    const parts: string[] = [];
    if (model.showHeunProperty.value) {
      parts.push(
        StringUtils.fillIn(strings.heunErrorStringProperty.value, {
          error: format(model.globalError("heun"), 4),
        }),
      );
    }
    if (model.showRk4Property.value) {
      parts.push(
        StringUtils.fillIn(strings.rk4ErrorStringProperty.value, {
          error: format(model.globalError("rk4"), 4),
        }),
      );
    }
    return parts.join("   ");
  }

  private rebuildTable(): void {
    const model = this.model;
    const strings = StringManager.getInstance().getLessonStrings();
    const points = model.eulerPoints("euler");
    const taken = model.stepsTakenProperty.value;
    const eq = model.equation;

    for (const child of this.tableBox.children.slice()) {
      this.tableBox.removeChild(child);
      child.dispose();
    }

    const headers = [
      strings.tableNStringProperty.value,
      strings.tableXStringProperty.value,
      strings.tableYStringProperty.value,
      strings.tableFStringProperty.value,
      strings.tableExactStringProperty.value,
    ];
    const widths = [28, 64, 64, 72, 72];
    headers.forEach((label, col) => {
      this.tableBox.addChild(mono(label, widths[col]).mutate({ layoutOptions: { column: col, row: 0 } }));
    });

    let rowIndex = 1;
    for (const index of visibleStepIndices(taken)) {
      if (index === "ellipsis") {
        this.tableBox.addChild(mono("⋮", 28).mutate({ layoutOptions: { column: 0, row: rowIndex } }));
        rowIndex += 1;
        continue;
      }
      const point = points[index];
      if (point === undefined) {
        continue;
      }
      const [x, y] = point;
      const slope = eq.f(x, y);
      const exact = model.exactAt(x);
      const cells = [
        `${index}`,
        format(x, 3),
        format(y, 4),
        Number.isFinite(slope) ? format(slope, 3) : "—",
        Number.isFinite(exact) ? format(exact, 4) : "—",
      ];
      cells.forEach((cell, col) => {
        this.tableBox.addChild(mono(cell, widths[col]).mutate({ layoutOptions: { column: col, row: rowIndex } }));
      });
      rowIndex += 1;
    }
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

    if (model.showFieldProperty.value) {
      this.fieldNode.opacity = 0.4;
      this.fieldNode.update(plot, eq.f, domain, EULER_FIELD_DENSITY, EULER_FIELD_SCALE);
      plot.layers.addChild(this.fieldNode);
    }

    if (model.showExactProperty.value && eq.exact) {
      const exactFn = eq.exact(model.x0Property.value, model.y0Property.value);
      const count = 400;
      const exactPoints: Array<readonly [number, number]> = [];
      for (let i = 0; i <= count; i++) {
        const xi = xMin + ((xMax - xMin) * i) / count;
        exactPoints.push([xi, exactFn(xi)]);
      }
      plot.line(exactPoints, Colors.tertiaryColorProperty, 2);
    }

    if (model.showHeunProperty.value) {
      const heun = model.eulerPoints("heun");
      plot.line(heun, Colors.secondaryColorProperty, 2);
      for (const [x, y] of heun) {
        plot.point(x, y, Colors.secondaryColorProperty, false, 3);
      }
    }

    if (model.showRk4Property.value) {
      const rk4 = model.eulerPoints("rk4");
      plot.line(rk4, Colors.quaternaryColorProperty, 2);
      for (const [x, y] of rk4) {
        plot.point(x, y, Colors.quaternaryColorProperty, false, 3);
      }
    }

    const euler = model.eulerPoints("euler");
    const taken = model.stepsTakenProperty.value;
    const shown = euler.slice(0, taken + 1);
    plot.line(shown, Colors.accentColorProperty, 3);
    for (const [x, y] of shown) {
      plot.point(x, y, Colors.accentColorProperty, false, 5);
    }

    // Next-step tangent segment: follow the slope out by one step size.
    if (taken < model.totalSteps) {
      const current = euler[taken];
      if (current !== undefined) {
        const [xn, yn] = current;
        const h = model.stepSizeProperty.value;
        const slope = eq.f(xn, yn);
        if (Number.isFinite(slope)) {
          const xNext = Math.min(xn + h, model.xEndProperty.value);
          plot.line(
            [
              [xn, yn],
              [xNext, yn + (xNext - xn) * slope],
            ],
            Colors.accentColorProperty,
            2,
            [5, 4],
          );
        }
      }
    }

    const xEnd = model.xEndProperty.value;
    plot.line(
      [
        [xEnd, yMin],
        [xEnd, yMax],
      ],
      Colors.textColorProperty,
      1,
      [6, 4],
    );

    this.startHandle.place(plot.plotX(model.x0Property.value), plot.plotY(model.y0Property.value));
    this.xEndHandle.place(plot.plotX(xEnd), plot.plotY(0));

    this.rebuildTable();
  }
}
