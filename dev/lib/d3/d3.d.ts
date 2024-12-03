declare namespace d3 {
  interface Event {
    altKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    key: string;
    type: string;
    target: EventTarget;
    [key: string]: any;
  }

  let event: Event;

  interface Selection<T = Element> {
    datum(data: import('../../../dist/log-CFoFYlQM').S[]): unknown;
    select(arg0: string): Selection;
    selectAll(arg0: string): Array<Selection>;
    checked: boolean;
    attr(
      name: string,
      value: string | number | ((datum: T, index: number) => string | number),
    ): Selection<T>;
    style(
      name: string,
      value: string | number | ((datum: T, index: number) => string | number),
      priority?: string,
    ): Selection<T>;
    property(name: string, value: any): Selection<T>;
    text(value: string | number | ((datum: T, index: number) => string)): Selection<T>;
    html(value: string | ((datum: T, index: number) => string)): Selection<T>;
    append(name: string): Selection<T>;
    insert(name: string, before: string | ((datum: T, index: number) => string)): Selection<T>;
    remove(): Selection<T>;
    data(data: T[], key?: (datum: T, index: number) => any): Selection<T>;
    enter(): Selection<T>;
    exit(): Selection<T>;
    call(callback: Axis | ((selection: Selection<T>) => void)): Selection<T>;
    each(callback: (datum: T, index: number, nodes: T[]) => void): Selection<T>;
    on(event: string, listener: (datum: T, index: number, nodes: T[]) => void): Selection<T>;
    transition(): Selection<T>;
    duration(duration: number): Selection<T>;
    delay(delay: number): Selection<T>;
    ease(easing: string): Selection<T>;
    merge(other: Selection<T>): Selection<T>;
    filter(predicate: (datum: T, index: number) => boolean): Selection<T>;
    order(): Selection<T>;
    sort(comparator?: (a: T, b: T) => number): Selection<T>;
  }

  namespace scale {
    function linear(): LinearScale;
    function category20c(): OrdinalScale<string>;
  }

  interface LinearScale {
    (value: number): number;
    domain(values: [number, number]): this;
    range(values: [number, number]): this;
  }

  interface OrdinalScale<T> {
    (value: string): T;
    domain(values: string[]): this;
    range(values: T[]): this;
  }

  namespace layout {
    function treemap(): TreemapLayout;
  }

  interface TreemapLayout {
    size(dimensions: [number, number]): this;
    nodes(root: any): any[];
    round(round: boolean): this;
    value(value: string | ((datum: any) => number)): this;
    sticky(sticky: boolean): this;
  }

  namespace svg {
    function axis(): Axis;

    function area(): Area;

    interface Area {
      x(accessor: (datum: any, index: number) => number): this;
      y(accessor: (datum: any, index: number) => number): this;
      x0(accessor: (datum: any, index: number) => number): this;
      x1(accessor: (datum: any, index: number) => number): this;
      y0(accessor: (datum: any, index: number) => number): this;
      y1(accessor: (datum: any, index: number) => number): this;
      interpolate(type: string): this;
    }
  }

  interface Axis {
    scale(scale: any): this;
    orient(orientation: 'top' | 'bottom' | 'left' | 'right'): this;
    tickSize(size: number): this;
    tickFormat(formatter: (value: any) => string): this;
  }

  function select(selector: string): Selection;
  function selectAll(selector: string): Selection;

  function descending<T>(a: T, b: T): number;
  function min<T>(array: T[], accessor?: (datum: T) => number): number;
  function max<T>(array: T[], accessor?: (datum: T) => number): number;
  function extent<T>(array: T[], accessor?: (datum: T) => number): [number, number];
  function sum<T>(array: T[], accessor?: (datum: T) => number): number;
  function mean<T>(array: T[], accessor?: (datum: T) => number): number;
  function quantile<T>(array: T[], p: number): number;
  function median<T>(array: T[]): number;
  function variance<T>(array: T[]): number;
  function deviation<T>(array: T[]): number;

  function transition(): Selection;

  function format(specifier: string): (value: any) => string;

  // Add more if needed
}
