/**
 * LessonView.ts
 *
 * Canonical lesson scaffold shared, file for file, by the Calculus sims
 * (Limit Explorer, Mean Value Theorem, Riemann Sum Builder, Related Rates, Slope
 * Fields). Keep the copies identical apart from the sim prefix in the imports: fix a
 * bug here, then copy the file into the other four sims.
 *
 * It provides a titled screen with a plot on the left, a control panel on the
 * right and notes under the plot, plus small control factories (combo box,
 * radio buttons, checkbox, slider) themed from the sim's colors.
 */

import {
  DerivedProperty,
  type NumberProperty,
  type Property,
  type ReadOnlyProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Bounds2, Dimension2, Range, roundSymmetric, Vector2 } from "scenerystack/dot";
import { localeProperty } from "scenerystack/joist";
import { Shape } from "scenerystack/kite";
import {
  Circle,
  DragListener,
  HBox,
  KeyboardDragListener,
  Line,
  Node,
  Path,
  Rectangle,
  RichText,
  Text,
  VBox,
} from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenSummaryContent, ScreenView } from "scenerystack/sim";
import {
  Checkbox,
  ComboBox,
  HSlider,
  RectangularPushButton,
  RectangularRadioButton,
  RectangularRadioButtonGroup,
} from "scenerystack/sun";
import Colors from "../SlopeFieldsColors.js";
import { LAYOUT as layout, SCREEN_VIEW_MARGIN } from "../SlopeFieldsConstants.js";
import {
  SLOPE_FIELDS_COMBO_BOX_OPTIONS as COMBO_BOX_OPTIONS,
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "./SlopeFieldsButtonOptions.js";
import { SlopeFieldsPanel } from "./SlopeFieldsPanel.js";

type StringSource = string | ReadOnlyProperty<string>;
type Paint = Rectangle["fill"];
type Domain = readonly [number, number, number, number];

/** @public */
export function computed(properties: readonly TReadOnlyProperty<unknown>[], calculate: () => string) {
  return DerivedProperty.deriveAny([localeProperty, ...properties], calculate);
}

/** @public */
export function format(value: number, digits = 2): string {
  return new Intl.NumberFormat(localeProperty.value, { maximumFractionDigits: digits }).format(value);
}

/** @public */
export function text(value: StringSource, size = 16, width = 298, bold = false): Text {
  return new Text(value, {
    font: `${bold ? "bold " : ""}${size}px sans-serif`,
    maxWidth: width,
    fill: Colors.textColorProperty,
  });
}

/**
 * Like `text`, but reads `<sup>`, `<sub>`, `<i>` and `<b>` markup, for formulas.
 * With `wrap`, long text breaks onto new lines at `width` instead of shrinking.
 *
 * @public
 */
export function richText(value: StringSource, size = 16, width = 298, bold = false, wrap = false): RichText {
  return new RichText(value, {
    font: `${bold ? "bold " : ""}${size}px sans-serif`,
    ...(wrap ? { lineWrap: width } : { maxWidth: width }),
    fill: Colors.textColorProperty,
  });
}

/** @public */
export function button(label: ReadOnlyProperty<string>, action: () => void): RectangularPushButton {
  return new RectangularPushButton({
    ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
    content: new Text(label, { font: "bold 14px sans-serif", fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 270 }),
    accessibleName: label,
    listener: action,
    xMargin: 10,
    yMargin: 8,
  });
}

/**
 * One entry of a combo box or radio group: `label` may carry RichText markup; `name` is what is announced.
 *
 * @public
 */
export type Choice<T> = {
  readonly value: T;
  readonly label: StringSource;
  readonly name?: StringSource;
};

/**
 * A drop-down list for choosing one of several named items (functions, regions, scenarios).
 * The open list is drawn in `listParent`, which LessonView keeps above everything else.
 *
 * @public
 */
export function comboBox<T>(
  property: Property<T>,
  choices: readonly Choice<T>[],
  listParent: Node,
  accessibleName: ReadOnlyProperty<string>,
  width = 270,
): ComboBox<T> {
  return new ComboBox(
    property,
    choices.map((choice) => ({
      value: choice.value,
      createNode: () =>
        new RichText(choice.label, { font: "15px sans-serif", fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: width - 40 }),
      accessibleName: choice.name ?? choice.label,
    })),
    listParent,
    { ...COMBO_BOX_OPTIONS, accessibleName, xMargin: 10, yMargin: 5, cornerRadius: 4 },
  );
}

/** A row (or column) of toggle buttons that keeps every option in view, for modes and rules.
 *
 * @public
 */
export function radioButtons<T>(
  property: Property<T>,
  choices: readonly Choice<T>[],
  accessibleName: ReadOnlyProperty<string>,
  options: { orientation?: "horizontal" | "vertical"; size?: number; width?: number } = {},
): RectangularRadioButtonGroup<T> {
  const size = options.size ?? 14;
  return new RectangularRadioButtonGroup(
    property,
    choices.map((choice) => ({
      value: choice.value,
      createNode: () =>
        new RichText(choice.label, {
          font: `${size}px sans-serif`,
          fill: LIGHT_SURFACE_TEXT_FILL,
          maxWidth: options.width ?? 120,
        }),
      options: { accessibleName: choice.name ?? choice.label },
    })),
    {
      orientation: options.orientation ?? "horizontal",
      spacing: 5,
      accessibleName,
      radioButtonOptions: {
        baseColor: Colors.controlSurfaceColorProperty,
        buttonAppearanceStrategy: RectangularRadioButton.FlatAppearanceStrategy,
        buttonAppearanceStrategyOptions: {
          selectedStroke: Colors.accentColorProperty,
          selectedLineWidth: 3,
          deselectedStroke: Colors.panelBorderColorProperty,
        },
        contentAppearanceStrategyOptions: { deselectedContentOpacity: 0.9 },
        xMargin: 7,
        yMargin: 5,
      },
    },
  );
}

/** @public */
export function checkbox(property: Property<boolean>, label: ReadOnlyProperty<string>, width = 270): Checkbox {
  return new Checkbox(
    property,
    new Text(label, { font: "15px sans-serif", fill: Colors.textColorProperty, maxWidth: width }),
    {
      boxWidth: 16,
      spacing: 7,
      checkboxColor: Colors.textColorProperty,
      checkboxColorBackground: Colors.panelBackgroundColorProperty,
      accessibleName: label,
    },
  );
}

/** @public */
export function row(...children: Node[]): HBox {
  return new HBox({ children, spacing: 7, align: "center" });
}

/** @public */
export function column(...children: Node[]): VBox {
  return new VBox({ children, spacing: 7, align: "left" });
}

/** About `count` evenly spaced round values (steps of 1, 2 or 5 × 10ⁿ) covering [min, max].
 *
 * @public
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  const span = max - min;
  if (!(span > 0 && Number.isFinite(span))) {
    return [min];
  }
  const raw = span / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((factor) => factor * power >= raw) ?? 10) * power;
  const ticks: number[] = [];
  for (let value = Math.ceil(min / step) * step; value <= max + step * 1e-9; value += step) {
    ticks.push(Math.abs(value) < step * 1e-9 ? 0 : Number(value.toPrecision(12)));
  }
  return ticks;
}

/** @public */
export function slider(
  label: ReadOnlyProperty<string>,
  value: NumberProperty,
  min: number,
  max: number,
  digits = 2,
  display = (x: number) => x,
  step?: number,
  enabledRangeProperty?: TReadOnlyProperty<Range>,
): VBox {
  const caption = computed([label, value], () => `${label.value}  ${format(display(value.value), digits)}`);
  const control = new HSlider(value, new Range(min, max), {
    accessibleName: label,
    ...(enabledRangeProperty ? { enabledRangeProperty } : {}),
    pdomCreateAriaValueText: (current) => format(display(current ?? value.value), digits),
    trackSize: new Dimension2(245, 4),
    thumbSize: new Dimension2(14, 21),
    thumbFill: Colors.accentColorProperty,
    thumbTouchAreaXDilation: 7,
    thumbTouchAreaYDilation: 7,
    ...(step
      ? {
          constrainValue: (x: number) => {
            const enabledRange = enabledRangeProperty?.value;
            if (enabledRange && (x === enabledRange.min || x === enabledRange.max)) {
              return x;
            }
            const snapped = roundSymmetric(x / step) * step;
            return enabledRange ? enabledRange.constrainValue(snapped) : snapped;
          },
          keyboardStep: step,
        }
      : {}),
  });
  const captionText = text(caption, 15, 285, true);
  const box = column(captionText, control);
  box.addDisposable(control, captionText, caption);
  return box;
}

/**
 * Tick-label formatters (the result may carry RichText markup such as `10<sup>−3</sup>`),
 * and whether to draw the x = 0 and y = 0 axis lines (off for logarithmic plots).
 */
type TickLabels = { x?: (value: number) => string; y?: (value: number) => string; axes?: boolean };

/**
 * A rectangular graph: grid and tick labels, a clipped drawing layer, and grab handles.
 * LessonView owns the main one; a view may add a second, smaller one (for example a
 * derivative graph under the main graph) with `new Plot(width, height)`.
 *
 * @public
 */
export class Plot extends Node {
  public readonly layers = new Node();
  // Handles persist across redraws; `clear()` only empties `layers`.
  private readonly handles = new Node();
  private readonly axes = new Node();
  private domain: Domain = [-1, 1, -1, 1];
  private axesKey = "";
  public readonly widthInPixels: number;
  public readonly heightInPixels: number;

  public constructor(plotWidth = layout.plotWidth, plotHeight = layout.plotHeight) {
    super();
    this.widthInPixels = plotWidth;
    this.heightInPixels = plotHeight;
    this.addChild(
      new Rectangle(0, 0, plotWidth, plotHeight, {
        fill: Colors.panelBackgroundColorProperty,
        stroke: Colors.panelBorderColorProperty,
        cornerRadius: 8,
        lineWidth: 1,
      }),
    );
    this.addChild(this.axes);
    this.addChild(this.layers);
    this.addChild(this.handles);
    this.layers.clipArea = Shape.rect(1, 1, plotWidth - 2, plotHeight - 2);
  }

  /**
   * Sets the visible model rectangle and redraws the grid, tick labels and axis titles.
   * Nothing is rebuilt when the domain, ticks, titles and locale are unchanged.
   */
  public setDomain(
    domain: Domain,
    xAxis: StringSource,
    yAxis: StringSource,
    xTicks?: number[],
    yTicks?: number[],
    labels: TickLabels = {},
  ): void {
    const [xmin, xmax, ymin, ymax] = domain;
    const xs = xTicks ?? niceTicks(xmin, xmax, 6);
    const ys = yTicks ?? niceTicks(ymin, ymax, 5);
    const title = (source: StringSource) => (typeof source === "string" ? source : source.value);
    const key = JSON.stringify([
      localeProperty.value,
      domain,
      xs,
      ys,
      title(xAxis),
      title(yAxis),
      xs.map(labels.x ?? String),
      ys.map(labels.y ?? String),
    ]);
    this.domain = domain;
    if (key === this.axesKey) {
      return;
    }
    this.axesKey = key;
    this.clear(this.axes);
    const horizontal = this.plotY(Math.min(ymax, Math.max(ymin, 0)));
    const vertical = this.plotX(Math.min(xmax, Math.max(xmin, 0)));
    const inset = 6;
    for (const value of xs) {
      const x = this.plotX(value);
      this.axes.addChild(new Line(x, 0, x, this.heightInPixels, { stroke: Colors.panelBorderColorProperty }));
      const tick = richText(labels.x ? labels.x(value) : format(value, 3), 11, 62);
      tick.centerX = Math.max(tick.width / 2 + inset, Math.min(this.widthInPixels - tick.width / 2 - inset, x));
      tick.bottom = this.heightInPixels - inset;
      this.axes.addChild(tick);
    }
    for (const value of ys) {
      const y = this.plotY(value);
      this.axes.addChild(new Line(0, y, this.widthInPixels, y, { stroke: Colors.panelBorderColorProperty }));
      const tick = richText(labels.y ? labels.y(value) : format(value, 2), 11, 62);
      tick.left = inset;
      tick.centerY = Math.max(12, Math.min(this.heightInPixels - 26, y));
      this.axes.addChild(tick);
    }
    if (labels.axes !== false) {
      this.axes.addChild(
        new Line(inset, horizontal, this.widthInPixels - inset, horizontal, {
          stroke: Colors.textColorProperty,
          lineWidth: 1,
        }),
      );
      this.axes.addChild(
        new Line(vertical, inset, vertical, this.heightInPixels - inset, {
          stroke: Colors.textColorProperty,
          lineWidth: 1,
        }),
      );
    }
    const xLabel = richText(xAxis, 13, 125, true);
    xLabel.right = this.widthInPixels - 12;
    xLabel.bottom = this.heightInPixels - 24;
    const yLabel = richText(yAxis, 13, 140, true);
    yLabel.left = 48;
    yLabel.top = 9;
    this.axes.addChild(xLabel);
    this.axes.addChild(yLabel);
  }

  public clear(node = this.layers): void {
    for (const child of node.children.slice()) {
      node.removeChild(child);
      child.dispose();
    }
  }

  public plotX(value: number): number {
    const [min, max] = this.domain;
    return ((value - min) / (max - min)) * this.widthInPixels;
  }

  public plotY(value: number): number {
    const [, , min, max] = this.domain;
    return ((max - value) / (max - min)) * this.heightInPixels;
  }

  public modelX(viewX: number): number {
    const [min, max] = this.domain;
    return min + ((max - min) * viewX) / this.widthInPixels;
  }

  public modelY(viewY: number): number {
    const [, , min, max] = this.domain;
    return max - ((max - min) * viewY) / this.heightInPixels;
  }

  /**
   * Adds a visible grab handle above the redrawn layers. The caller positions it with
   * `PlotHandle.place()` in plot pixels and receives the pointer's plot-pixel position
   * (offset so the handle does not jump to the finger) while it is dragged.
   */
  public handle(options: HandleOptions): PlotHandle {
    const handle = new PlotHandle(this, options);
    this.handles.addChild(handle);
    return handle;
  }

  public removeHandle(handle: PlotHandle): void {
    this.handles.removeChild(handle);
    handle.dispose();
  }

  public line(
    points: ReadonlyArray<readonly [number, number]>,
    stroke: Paint = Colors.accentColorProperty,
    width = 2,
    lineDash?: number[],
  ): void {
    const shape = new Shape();
    let drawing = false;
    // Non-finite samples (poles, gaps) break the curve instead of drawing to infinity.
    for (const [x, y] of points) {
      if (!(Number.isFinite(x) && Number.isFinite(y))) {
        drawing = false;
        continue;
      }
      const px = this.plotX(x);
      const py = Math.max(-1e4, Math.min(1e4, this.plotY(y)));
      if (drawing) {
        shape.lineTo(px, py);
      } else {
        shape.moveTo(px, py);
        drawing = true;
      }
    }
    if (shape.bounds.isFinite()) {
      this.layers.addChild(
        new Path(shape, { stroke, lineWidth: width, ...(lineDash ? { lineDash } : {}), pickable: false }),
      );
    }
  }

  public region(points: ReadonlyArray<readonly [number, number]>, fill: Paint, stroke: Paint = null): void {
    const finite = points.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
    if (finite.length < 3) {
      return;
    }
    const shape = new Shape();
    finite.forEach(([x, y], i) => {
      const py = Math.max(-1e4, Math.min(1e4, this.plotY(y)));
      if (i === 0) {
        shape.moveTo(this.plotX(x), py);
      } else {
        shape.lineTo(this.plotX(x), py);
      }
    });
    shape.close();
    this.layers.addChild(new Path(shape, { fill, stroke, lineWidth: 1, pickable: false }));
  }

  public point(x: number, y: number, stroke: Paint, open = false, radius = 5): void {
    if (!(Number.isFinite(x) && Number.isFinite(y))) {
      return;
    }
    this.layers.addChild(
      new Circle(radius, {
        x: this.plotX(x),
        y: Math.max(-1e4, Math.min(1e4, this.plotY(y))),
        fill: open ? Colors.panelBackgroundColorProperty : stroke,
        stroke,
        lineWidth: 2,
        pickable: false,
      }),
    );
  }

  public onDrag(callback: (x: number, y: number, start: boolean) => void): void {
    const input = new Rectangle(0, 0, this.widthInPixels, this.heightInPixels, {
      fill: "transparent",
      cursor: "ew-resize",
    });
    input.mouseArea = new Bounds2(0, 0, this.widthInPixels, this.heightInPixels);
    const update = (point: Parameters<Node["globalToLocalPoint"]>[0], start: boolean) => {
      const local = this.globalToLocalPoint(point);
      const [, , min, max] = this.domain;
      callback(this.modelX(local.x), max - ((max - min) * local.y) / this.heightInPixels, start);
    };
    input.addInputListener(
      new DragListener({
        start: (event) => update(event.pointer.point, true),
        drag: (event) => update(event.pointer.point, false),
      }),
    );
    this.insertChild(this.indexOfChild(this.handles), input);
  }
}

type HandleOptions = {
  fill?: Paint;
  radius?: number;
  cursor?: string;
  start?: () => void;
  drag: (x: number, y: number) => void;
  end?: () => void;
  // For a quantity with no slider: the handle joins the tab order and the arrow
  // keys move it by whole steps (Shift for quarter steps), passed as (dx, dy).
  // `direction` limits which arrow keys respond.
  keyboard?: {
    name: TReadOnlyProperty<string>;
    direction?: "leftRight" | "upDown" | "both";
    step: (dx: number, dy: number) => void;
  };
  // Value label shown above the handle while it is hovered or dragged, read on each place().
  readout?: () => string;
};

/**
 * Grab handle. By default it is pointer-only, because the quantity it moves also has an
 * HSlider in the control panel that owns the keyboard path. A handle given `keyboard`
 * options has no slider behind it, so it takes focus and the arrow keys itself.
 */
class PlotHandle extends Node {
  private readonly listener: DragListener;
  private readonly keyboardListener: KeyboardDragListener | null = null;
  private readonly readout: (() => string) | null;
  private readonly label: Text;
  private readonly labelBox: Rectangle;
  private readonly radius: number;
  private readonly plotWidth: number;
  private readonly plotHeight: number;

  public constructor(plot: Plot, options: HandleOptions) {
    const radius = options.radius ?? 8;
    const halo = new Circle(radius + 7, { fill: options.fill ?? Colors.accentColorProperty, opacity: 0.25 });
    super({
      cursor: options.cursor ?? "pointer",
      children: [
        halo,
        new Circle(radius, {
          fill: options.fill ?? Colors.accentColorProperty,
          stroke: Colors.panelBackgroundColorProperty,
          lineWidth: 2,
        }),
      ],
    });
    this.radius = radius;
    this.plotWidth = plot.widthInPixels;
    this.plotHeight = plot.heightInPixels;
    this.readout = options.readout ?? null;
    this.label = new Text("", { font: "bold 13px sans-serif", fill: Colors.textColorProperty });
    this.labelBox = new Rectangle(0, 0, 1, 1, {
      cornerRadius: 4,
      fill: Colors.panelBackgroundColorProperty,
      opacity: 0.9,
      pickable: false,
      visible: false,
      children: [this.label],
    });
    this.excludeInvisibleChildrenFromBounds = true;
    this.addChild(this.labelBox);
    this.mouseArea = Shape.circle(0, 0, radius + 6);
    this.touchArea = Shape.circle(0, 0, radius + 16);
    let offset = Vector2.ZERO;
    const local = (point: Vector2) => plot.globalToLocalPoint(point);
    this.listener = new DragListener({
      start: (event) => {
        offset = this.translation.minus(local(event.pointer.point));
        options.start?.();
      },
      drag: (event) => {
        const point = local(event.pointer.point).plus(offset);
        options.drag(Math.max(0, Math.min(this.plotWidth, point.x)), Math.max(0, Math.min(this.plotHeight, point.y)));
      },
      end: () => options.end?.(),
    });
    this.listener.isHighlightedProperty.link((highlighted) => {
      halo.opacity = highlighted ? 0.45 : 0.25;
      this.labelBox.visible = highlighted && this.readout !== null;
      this.updateLabel();
    });
    this.addInputListener(this.listener);
    const keyboard = options.keyboard;
    if (keyboard) {
      this.tagName = "div";
      this.focusable = true;
      this.accessibleName = keyboard.name;
      this.accessibleRoleDescription = "movable";
      this.keyboardListener = new KeyboardDragListener({
        dragDelta: 1,
        shiftDragDelta: 0.25,
        keyboardDragDirection: keyboard.direction ?? "both",
        drag: (_event, listener) => keyboard.step(listener.modelDelta.x, -listener.modelDelta.y),
      });
      this.addInputListener(this.keyboardListener);
    }
  }

  /** Moves the handle to plot pixels and hides it when the point falls off the plot. */
  public place(x: number, y: number): void {
    const inside = x >= -1 && x <= this.plotWidth + 1 && y >= -1 && y <= this.plotHeight + 1;
    this.visible = inside && Number.isFinite(x) && Number.isFinite(y);
    if (this.visible) {
      this.setTranslation(x, y);
      this.updateLabel();
    }
  }

  /** Refreshes the readout and keeps it on the plot: above the handle, or below it near the top. */
  private updateLabel(): void {
    if (!(this.readout && this.labelBox.visible)) {
      return;
    }
    this.label.string = this.readout();
    this.labelBox.setRect(0, 0, this.label.width + 10, this.label.height + 4);
    this.label.center = this.labelBox.localBounds.center;
    const gap = this.radius + 10;
    const above = this.y - gap - this.labelBox.height >= 0;
    this.labelBox.centerX = Math.max(
      this.labelBox.width / 2 - this.x,
      Math.min(this.plotWidth - this.x - this.labelBox.width / 2, 0),
    );
    if (above) {
      this.labelBox.bottom = -gap;
    } else {
      this.labelBox.top = gap;
    }
  }

  public override dispose(): void {
    this.removeInputListener(this.listener);
    this.listener.dispose();
    if (this.keyboardListener) {
      this.removeInputListener(this.keyboardListener);
      this.keyboardListener.dispose();
    }
    super.dispose();
  }
}

type LessonOptions = {
  title: ReadOnlyProperty<string>;
  /** Height of the main plot in pixels; a shorter plot leaves room for a second graph under it. */
  plotHeight?: number;
  playDescription: ReadOnlyProperty<string>;
  hint: ReadOnlyProperty<string>;
  details: ReadOnlyProperty<string>;
  controlDescription: ReadOnlyProperty<string>;
};

export class LessonView extends ScreenView {
  public readonly plot: Plot;
  /** Parent for open combo-box lists; `finish()` puts it on top of everything. */
  protected readonly listParent = new Node();

  public constructor(options: LessonOptions) {
    super({
      screenSummaryContent: new ScreenSummaryContent({
        playAreaContent: options.playDescription,
        controlAreaContent: options.controlDescription,
        currentDetailsContent: options.details,
        interactionHintContent: options.hint,
      }),
    });
    this.plot = new Plot(layout.plotWidth, options.plotHeight ?? layout.plotHeight);
    const title = text(options.title, 34, 920, true);
    title.left = layout.inset;
    title.top = 24;
    const hint = text(options.hint, 17, 950);
    hint.left = layout.inset;
    hint.top = 70;
    this.plot.left = layout.inset;
    this.plot.top = layout.top;
    this.addChild(title);
    this.addChild(hint);
    this.addChild(this.plot);
  }

  /** Width available under the plot for notes, readouts and rule bars. */
  protected get notesWidth(): number {
    return layout.plotWidth;
  }

  protected finish(controls: Node, notes: Node, reset: () => void): void {
    const panelContent = new Node({
      children: [new Rectangle(0, 0, layout.panelWidth, layout.panelHeight, { pickable: false }), controls],
    });
    controls.left = 15;
    controls.top = 15;
    const sidebar = new SlopeFieldsPanel(panelContent, {
      xMargin: 0,
      yMargin: 0,
      left: layout.inset + layout.plotWidth + layout.gap,
      top: layout.top,
    });
    notes.left = layout.inset;
    notes.top = layout.top + this.plot.heightInPixels + layout.notesGap;
    const resetButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: reset,
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - 20,
    });
    this.addChild(sidebar);
    this.addChild(notes);
    this.addChild(resetButton);
    this.addChild(this.listParent);
    // Reading order: what is on the graph, then the controls, then the notes under it.
    this.addChild(new Node({ pdomOrder: [this.plot, controls, notes, resetButton] }));
  }
}
