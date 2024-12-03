declare namespace jQuery {
  interface JQuery<T = HTMLElement> {
    button(action?: string): JQuery<T>;
    button(options?: JQueryUI.ButtonOptions): JQuery<T>;

    selectmenu(options?: Record<string, any>): JQuery;
    selectmenu(method: 'refresh'): void;

    dragslider(options?: JQueryUI.DragsliderOptions): JQuery<T>;
    dragslider(method: string, ...args: any[]): any;
    dragslider(method: 'destroy'): void;
    dragslider(method: 'disable'): void;
    dragslider(method: 'enable'): void;
    dragslider(method: 'enable'): void;
    dragslider(method: 'value', value?: number): number | void;
    dragslider(method: 'values', index: number, value?: number): number | void;
    dragslider(method: 'values'): number[];
  }
}

declare namespace JQueryUI {
  interface ButtonOptions {
    disabled?: boolean;
    icons?: {
      primary?: string;
      secondary?: string;
    };
    label?: string;
    text?: boolean;
  }

  interface DragsliderOptions extends SliderOptions {
    rangeDrag?: boolean;
  }

  interface Dragslider extends Slider {
    options: DragsliderOptions;
  }
}
