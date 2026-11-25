/**
 * GrowthModelsScreenView.ts
 *
 * Lesson view for Growth Models: y(t) solution, optional direction field and
 * equilibria, a phase-line plot of f(y), parameter sliders, and ODE notes.
 */

import { Multilink, type NumberProperty, type ReadOnlyProperty } from "scenerystack/axon";
import { roundSymmetric } from "scenerystack/dot";
import { localeProperty } from "scenerystack/joist";
import { Shape } from "scenerystack/kite";
import { StringUtils } from "scenerystack/phetcommon";
import { Path, Text, VBox } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import {
  type Choice,
  checkbox,
  column,
  comboBox,
  computed,
  format,
  LessonView,
  Plot,
  richText,
  slider,
  text,
} from "../../common/LessonView.js";
import {
  characteristicTime,
  criticalHarvest,
  GROWTH_MODEL_IDS,
  type GrowthModelId,
  logisticInflection,
} from "../../common/model/GrowthModels.js";
import { SlopeFieldNode } from "../../common/SlopeFieldNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import Colors from "../../SlopeFieldsColors.js";
import {
  COOLING_DEFAULTS,
  EXPONENTIAL_DEFAULTS,
  GROWTH_FIELD_DENSITY,
  GROWTH_FIELD_SCALE,
  GROWTH_MAIN_PLOT_HEIGHT,
  GROWTH_PHASE_ARROW_COUNT,
  GROWTH_PHASE_PLOT_HEIGHT,
  type GrowthParamDefaults,
  HARVESTING_DEFAULTS,
  LOGISTIC_DEFAULTS,
} from "../../SlopeFieldsConstants.js";
import type { GrowthModelsModel } from "../model/GrowthModelsModel.js";

const DEFAULTS_BY_ID: Record<GrowthModelId, GrowthParamDefaults> = {
  exponential: EXPONENTIAL_DEFAULTS,
  cooling: COOLING_DEFAULTS,
  logistic: LOGISTIC_DEFAULTS,
  harvesting: HARVESTING_DEFAULTS,
};

/** Viewing window [0, tMax] × [yMin, yMax] for the main plot. */
function yWindow(model: GrowthModelsModel): { yMin: number; yMax: number } {
  const id = model.modelId;
  const y0 = model.y0Property.value;
  const tMax = model.tMaxProperty.value;
  if (id === "cooling") {
    return { yMin: 0, yMax: 100 };
  }
  if (id === "logistic" || id === "harvesting") {
    const top = 1.4 * Math.max(model.kProperty.value, y0);
    return { yMin: 0, yMax: Math.max(1, roundSymmetric(top)) };
  }
  // Exponential: fit y0 e^{r tMax}, capped at 50.
  const r = model.rProperty.value;
  const peak = y0 * Math.exp(r * tMax);
  const low = r < 0 ? peak : y0 * Math.exp(Math.min(0, r) * tMax);
  const yMax = Math.min(50, Math.max(y0 * 1.2, peak * 1.15, 1));
  const yMin = Math.min(0, low * 1.05);
  return { yMin, yMax: Math.max(yMax, yMin + 1) };
}

/** Time at which the logistic solution equals K/2, if that happens on [0, tMax]. */
function logisticInflectionTime(model: GrowthModelsModel): number | null {
  if (model.modelId !== "logistic") {
    return null;
  }
  const r = model.rProperty.value;
  const K = model.kProperty.value;
  const y0 = model.y0Property.value;
  const tMax = model.tMaxProperty.value;
  if (!(r > 0) || y0 <= 0 || y0 >= K) {
    return null;
  }
  if (Math.abs(y0 - K / 2) < 1e-9) {
    return 0;
  }
  if (y0 >= K / 2) {
    return null;
  }
  const t = Math.log((K - y0) / y0) / r;
  if (!(t >= 0 && t <= tMax)) {
    return null;
  }
  return t;
}

function stabilityLabel(
  stability: "stable" | "unstable" | "semistable",
  strings: ReturnType<StringManager["getLessonStrings"]>,
): string {
  if (stability === "stable") {
    return strings.stableStringProperty.value;
  }
  if (stability === "unstable") {
    return strings.unstableStringProperty.value;
  }
  return strings.semistableStringProperty.value;
}

function modelDisplayName(id: GrowthModelId, strings: ReturnType<StringManager["getLessonStrings"]>): string {
  switch (id) {
    case "exponential":
      return strings.exponentialGrowthStringProperty.value;
    case "cooling":
      return strings.newtonsCoolingStringProperty.value;
    case "logistic":
      return strings.logisticGrowthStringProperty.value;
    case "harvesting":
      return strings.logisticHarvestingStringProperty.value;
  }
}

export class GrowthModelsScreenView extends LessonView {
  private readonly fieldNode = new SlopeFieldNode();
  private readonly model: GrowthModelsModel;
  private readonly phasePlot: Plot;
  private readonly y0Handle: ReturnType<Plot["handle"]>;
  private readonly sliderColumn: VBox;
  private sliderDisposables: Array<{ dispose: () => void }> = [];

  public constructor(model: GrowthModelsModel) {
    const manager = StringManager.getInstance();
    const strings = manager.getLessonStrings();
    const names = manager.getScreenNames();
    const summary = manager.getGrowthModelsA11yStrings().screenSummary;

    const dependencies = [
      model.modelIdProperty,
      model.rProperty,
      model.kProperty,
      model.ambientProperty,
      model.harvestProperty,
      model.y0Property,
      model.tMaxProperty,
      model.showPhaseLineProperty,
      model.showEquilibriaProperty,
      model.showDirectionFieldProperty,
    ] as const;

    const details = computed([...dependencies], () => GrowthModelsScreenView.describe(model));

    super({
      title: names.growthModelsStringProperty,
      plotHeight: GROWTH_MAIN_PLOT_HEIGHT,
      hint: summary.interactionHintStringProperty,
      playDescription: summary.playAreaStringProperty,
      controlDescription: summary.controlAreaStringProperty,
      details,
    });
    this.model = model;

    const modelChoices: Choice<string>[] = GROWTH_MODEL_IDS.map((id) => ({
      value: id,
      label:
        id === "exponential"
          ? strings.exponentialGrowthStringProperty
          : id === "cooling"
            ? strings.newtonsCoolingStringProperty
            : id === "logistic"
              ? strings.logisticGrowthStringProperty
              : strings.logisticHarvestingStringProperty,
    }));
    const modelBox = comboBox(model.modelIdProperty, modelChoices, this.listParent, strings.modelStringProperty, 292);

    this.sliderColumn = new VBox({ spacing: 7, align: "left" });
    this.rebuildSliders();

    const phaseCheckbox = checkbox(model.showPhaseLineProperty, strings.phaseLineStringProperty);
    const equilibriaCheckbox = checkbox(model.showEquilibriaProperty, strings.equilibriaStringProperty);
    const fieldCheckbox = checkbox(model.showDirectionFieldProperty, strings.directionFieldStringProperty);

    const controls = column(modelBox, this.sliderColumn, phaseCheckbox, equilibriaCheckbox, fieldCheckbox);

    this.phasePlot = new Plot(this.notesWidth, GROWTH_PHASE_PLOT_HEIGHT);
    model.showPhaseLineProperty.link((show) => {
      this.phasePlot.visible = show;
    });

    const formula = computed([...dependencies], () => this.buildFormula());
    const readout = computed([...dependencies], () => this.buildReadout());

    // excludeInvisibleChildrenFromBounds so hiding the phase line collapses its gap.
    const notes = new VBox({
      spacing: 7,
      align: "left",
      excludeInvisibleChildrenFromBounds: true,
      children: [
        this.phasePlot,
        richText(formula, 14, this.notesWidth, false, true),
        text(readout, 13, this.notesWidth),
      ],
    });

    this.finish(controls, notes, () => model.reset());

    const plot = this.plot;
    const clampY0 = (y: number) => {
      const { yMin, yMax } = yWindow(model);
      const range = model.y0Property.range;
      const lo = Math.max(yMin, range.min);
      const hi = Math.min(yMax, range.max);
      model.y0Property.value = Math.max(lo, Math.min(hi, y));
    };

    this.y0Handle = plot.handle({
      cursor: "ns-resize",
      drag: (_px, py) => clampY0(plot.modelY(py)),
      keyboard: {
        name: strings.y0HandleStringProperty,
        direction: "upDown",
        step: (_dx, dy) => {
          const { yMin, yMax } = yWindow(model);
          const stepSize = 0.01 * (yMax - yMin);
          clampY0(model.y0Property.value + dy * stepSize);
        },
      },
      readout: () => {
        const id = model.modelId;
        const template =
          id === "cooling"
            ? strings.t0ReadoutStringProperty.value
            : id === "exponential"
              ? strings.y0ReadoutStringProperty.value
              : strings.p0ReadoutStringProperty.value;
        return StringUtils.fillIn(template, { y: format(model.y0Property.value) });
      },
    });

    Multilink.multilink([model.modelIdProperty], () => this.rebuildSliders());
    Multilink.multilink([localeProperty, ...dependencies], () => this.redraw());
  }

  private rebuildSliders(): void {
    for (const node of this.sliderDisposables) {
      node.dispose();
    }
    this.sliderDisposables = [];
    for (const child of this.sliderColumn.children.slice()) {
      this.sliderColumn.removeChild(child);
    }

    const model = this.model;
    const strings = StringManager.getInstance().getLessonStrings();
    const id = model.modelId;
    const defaults = DEFAULTS_BY_ID[id];

    const add = (
      label: ReadOnlyProperty<string>,
      property: NumberProperty,
      spec: { min: number; max: number; step: number },
      digits = 2,
    ) => {
      const control = slider(label, property, spec.min, spec.max, digits, undefined, spec.step);
      this.sliderColumn.addChild(control);
      this.sliderDisposables.push(control);
    };

    if (id === "cooling") {
      add(strings.coolingRateRStringProperty, model.rProperty, defaults.r);
      add(strings.ambientTemperatureStringProperty, model.ambientProperty, defaults.ambient, 1);
      add(strings.initialTemperatureStringProperty, model.y0Property, defaults.y0, 1);
    } else if (id === "exponential") {
      add(strings.growthRateRStringProperty, model.rProperty, defaults.r);
      add(strings.initialValueStringProperty, model.y0Property, defaults.y0);
    } else {
      add(strings.growthRateRStringProperty, model.rProperty, defaults.r);
      add(strings.carryingCapacityKStringProperty, model.kProperty, defaults.K, 1);
      if (id === "harvesting") {
        add(strings.harvestRateHStringProperty, model.harvestProperty, defaults.harvest, 1);
      }
      add(strings.initialPopulationStringProperty, model.y0Property, defaults.y0, 1);
    }
    add(strings.timeMaxStringProperty, model.tMaxProperty, defaults.tMax, 1);
  }

  private buildFormula(): string {
    const model = this.model;
    const strings = StringManager.getInstance().getLessonStrings();
    const r = format(model.rProperty.value);
    const y0 = format(model.y0Property.value);
    const K = format(model.kProperty.value);
    const ambient = format(model.ambientProperty.value);
    const H = format(model.harvestProperty.value);

    switch (model.modelId) {
      case "exponential": {
        const rVal = model.rProperty.value;
        const rExp = `${format(rVal)} t`;
        return StringUtils.fillIn(strings.odeExponentialStringProperty.value, {
          r,
          y0,
          rExp,
        });
      }
      case "cooling":
        return StringUtils.fillIn(strings.odeCoolingStringProperty.value, { r, ambient, y0 });
      case "logistic": {
        const y0Val = model.y0Property.value;
        const ratio = y0Val === 0 ? "—" : format((model.kProperty.value - y0Val) / y0Val);
        return StringUtils.fillIn(strings.odeLogisticStringProperty.value, { r, K, ratio });
      }
      case "harvesting":
        return `${StringUtils.fillIn(strings.odeHarvestingStringProperty.value, { r, K, H })}   ${strings.harvestingNumericalStringProperty.value}`;
    }
  }

  private buildReadout(): string {
    const model = this.model;
    const strings = StringManager.getInstance().getLessonStrings();
    const parts: string[] = [];

    const charTime = characteristicTime(model.modelId, model.parameters);
    if (charTime !== null) {
      const template =
        charTime.kind === "doubling" ? strings.doublingTimeStringProperty.value : strings.halfLifeStringProperty.value;
      parts.push(StringUtils.fillIn(template, { t: format(charTime.value) }));
    }

    if (model.modelId === "logistic" || model.modelId === "harvesting") {
      parts.push(
        StringUtils.fillIn(strings.inflectionHeightStringProperty.value, {
          value: format(logisticInflection(model.parameters)),
        }),
      );
    }

    if (model.modelId === "harvesting") {
      const crit = criticalHarvest(model.parameters);
      parts.push(StringUtils.fillIn(strings.criticalHarvestStringProperty.value, { value: format(crit) }));
      if (model.harvestProperty.value > crit) {
        parts.push(StringUtils.fillIn(strings.extinctionWarningStringProperty.value, { value: format(crit) }));
        const tExt = model.extinctionTime;
        if (tExt !== null && tExt <= model.tMaxProperty.value) {
          parts.push(StringUtils.fillIn(strings.extinctionTimeStringProperty.value, { t: format(tExt) }));
        }
      }
    }

    return parts.join("   ");
  }

  /** Static so the `details` Property can be built before `super()`. */
  private static describe(model: GrowthModelsModel): string {
    const strings = StringManager.getInstance().getLessonStrings();
    const id = model.modelId;
    const params: string[] = [`r = ${format(model.rProperty.value)}`];
    if (id === "cooling") {
      params.push(`T_a = ${format(model.ambientProperty.value)}`);
      params.push(`T₀ = ${format(model.y0Property.value)}`);
    } else {
      if (id === "logistic" || id === "harvesting") {
        params.push(`K = ${format(model.kProperty.value)}`);
      }
      if (id === "harvesting") {
        params.push(`H = ${format(model.harvestProperty.value)}`);
      }
      const yLabel = id === "exponential" ? "y₀" : "P₀";
      params.push(`${yLabel} = ${format(model.y0Property.value)}`);
    }
    params.push(`t_max = ${format(model.tMaxProperty.value)}`);

    const eqs = model.equilibria;
    const eqText =
      eqs.length === 0
        ? "—"
        : eqs
            .map((eq) =>
              StringUtils.fillIn(strings.equilibriumLabeledStringProperty.value, {
                y: format(eq.y),
                stability: stabilityLabel(eq.stability, strings),
              }),
            )
            .join("; ");

    let textValue = StringUtils.fillIn(strings.growthDetailsStringProperty.value, {
      model: modelDisplayName(id, strings),
      params: params.join(", "),
      equilibria: eqText,
    });

    if (id === "harvesting") {
      const crit = criticalHarvest(model.parameters);
      if (model.harvestProperty.value > crit) {
        textValue += ` ${StringUtils.fillIn(strings.extinctionWarningStringProperty.value, { value: format(crit) })}`;
        const tExt = model.extinctionTime;
        if (tExt !== null && tExt <= model.tMaxProperty.value) {
          textValue += ` ${StringUtils.fillIn(strings.extinctionTimeStringProperty.value, { t: format(tExt) })}`;
        }
      }
    }
    return textValue;
  }

  private redraw(): void {
    const model = this.model;
    const strings = StringManager.getInstance().getLessonStrings();
    const plot = this.plot;
    const tMax = Math.max(model.tMaxProperty.value, 1e-9);
    const { yMin, yMax } = yWindow(model);
    const id = model.modelId;

    const yAxis =
      id === "cooling"
        ? strings.axisTempStringProperty
        : id === "exponential"
          ? strings.axisYStringProperty
          : strings.axisPStringProperty;
    plot.setDomain([0, tMax, yMin, yMax], strings.axisTStringProperty, yAxis);

    if (this.fieldNode.parent) {
      this.fieldNode.parent.removeChild(this.fieldNode);
    }
    plot.clear();

    const rate = model.rate;
    const domain = { xMin: 0, xMax: tMax, yMin, yMax };

    if (model.showDirectionFieldProperty.value) {
      this.fieldNode.opacity = 0.35;
      this.fieldNode.update(plot, (_t, y) => rate(y), domain, GROWTH_FIELD_DENSITY, GROWTH_FIELD_SCALE);
      plot.layers.addChild(this.fieldNode);
    }

    if (model.showEquilibriaProperty.value) {
      for (const eq of model.equilibria) {
        const stable = eq.stability === "stable";
        const stroke = stable ? Colors.tertiaryColorProperty : Colors.secondaryColorProperty;
        const dash = stable ? undefined : [6, 4];
        plot.line(
          [
            [0, eq.y],
            [tMax, eq.y],
          ],
          stroke,
          stable ? 2 : 1.5,
          dash,
        );
        const label = new Text(
          StringUtils.fillIn(strings.equilibriumLabeledStringProperty.value, {
            y: format(eq.y),
            stability: stabilityLabel(eq.stability, strings),
          }),
          {
            font: "11px sans-serif",
            fill: stroke,
            pickable: false,
          },
        );
        label.right = plot.plotX(tMax) - 8;
        label.centerY = plot.plotY(eq.y) - 10;
        plot.layers.addChild(label);
      }
    }

    const sampleCount = 400;
    const curve: Array<readonly [number, number]> = [];
    for (let i = 0; i <= sampleCount; i++) {
      const t = (tMax * i) / sampleCount;
      curve.push([t, model.solution(t)]);
    }
    plot.line(curve, Colors.accentColorProperty, 3);

    if (id === "logistic") {
      const tInf = logisticInflectionTime(model);
      if (tInf !== null) {
        const yInf = logisticInflection(model.parameters);
        plot.point(tInf, yInf, Colors.quaternaryColorProperty, false, 5);
        const label = new Text(strings.kOver2StringProperty.value, {
          font: "11px sans-serif",
          fill: Colors.quaternaryColorProperty,
          pickable: false,
        });
        label.left = plot.plotX(tInf) + 6;
        label.centerY = plot.plotY(yInf) - 10;
        plot.layers.addChild(label);
      }
    }

    this.y0Handle.place(plot.plotX(0), plot.plotY(model.y0Property.value));

    this.redrawPhaseLine(yMin, yMax);
  }

  private redrawPhaseLine(yMin: number, yMax: number): void {
    const model = this.model;
    const plot = this.phasePlot;
    plot.clear();
    if (!model.showPhaseLineProperty.value) {
      return;
    }

    const strings = StringManager.getInstance().getLessonStrings();
    const rate = model.rate;
    const samples = 200;
    const fValues: number[] = [];
    for (let i = 0; i <= samples; i++) {
      const y = yMin + ((yMax - yMin) * i) / samples;
      const fy = rate(y);
      if (Number.isFinite(fy)) {
        fValues.push(fy);
      }
    }
    let fMin = Math.min(0, ...fValues);
    let fMax = Math.max(0, ...fValues);
    if (!(fMax > fMin)) {
      fMin = -1;
      fMax = 1;
    }
    const pad = 0.1 * (fMax - fMin);
    fMin -= pad;
    fMax += pad;

    plot.setDomain([yMin, yMax, fMin, fMax], strings.axisYStringProperty, strings.axisFStringProperty);

    // Zero line for f.
    plot.line(
      [
        [yMin, 0],
        [yMax, 0],
      ],
      Colors.textColorProperty,
      1,
      [4, 3],
    );

    const curve: Array<readonly [number, number]> = [];
    for (let i = 0; i <= samples; i++) {
      const y = yMin + ((yMax - yMin) * i) / samples;
      curve.push([y, rate(y)]);
    }
    plot.line(curve, Colors.accentColorProperty, 2);

    for (const eq of model.equilibria) {
      if (eq.stability === "stable") {
        plot.point(eq.y, 0, Colors.tertiaryColorProperty, false, 6);
      } else if (eq.stability === "unstable") {
        plot.point(eq.y, 0, Colors.secondaryColorProperty, true, 6);
      } else {
        // Semistable: ringed (open) with a filled half-disk look via overlapping points.
        plot.point(eq.y, 0, Colors.quaternaryColorProperty, true, 6);
        plot.point(eq.y, 0, Colors.quaternaryColorProperty, false, 3);
      }
    }

    // Flow arrows along the y-axis (horizontal axis of this plot).
    const count = GROWTH_PHASE_ARROW_COUNT;
    for (let i = 0; i < count; i++) {
      const y = yMin + ((yMax - yMin) * (i + 0.5)) / count;
      const fy = rate(y);
      if (!Number.isFinite(fy) || Math.abs(fy) < 1e-9) {
        continue;
      }
      const cx = plot.plotX(y);
      const cy = plot.plotY(0);
      const pointingRight = fy > 0;
      const arrow = new ArrowNode(0, 0, pointingRight ? 14 : -14, 0, {
        fill: Colors.textColorProperty,
        stroke: Colors.textColorProperty,
        tailWidth: 2,
        headWidth: 7,
        headHeight: 7,
        pickable: false,
      });
      arrow.centerX = cx;
      arrow.centerY = cy;
      plot.layers.addChild(arrow);
    }

    // Current y0 marker (small triangle above the axis).
    const y0 = model.y0Property.value;
    const tipX = plot.plotX(y0);
    const tipY = plot.plotY(0);
    const triangle = new Path(new Shape().moveTo(0, 0).lineTo(-6, -10).lineTo(6, -10).close(), {
      fill: Colors.accentColorProperty,
      stroke: Colors.panelBackgroundColorProperty,
      lineWidth: 1,
      pickable: false,
      x: tipX,
      y: tipY - 2,
    });
    plot.layers.addChild(triangle);
  }
}
