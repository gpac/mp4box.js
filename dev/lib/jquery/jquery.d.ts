declare namespace jQuery {
  interface JQueryStatic {
    (selector: string | Element | Document | Window | JQuery): JQuery;
    (html: string, context?: Element | Document): JQuery;
    (callback: () => void): JQuery;

    each<T>(collection: T[], callback: (index: number, value: T) => void): void;
    each<T>(object: Record<string, T>, callback: (key: string, value: T) => void): void;

    extend(target: object, ...sources: object[]): object;
    extend(deep: boolean, target: object, ...sources: object[]): object;

    ready(callback: () => void): JQuery;

    ajax(settings: JQueryAjaxSettings): JQueryXHR;

    parseHTML(data: string, context?: Document, keepScripts?: boolean): Node[];

    isEmptyObject(obj: object): boolean;

    version: string;
  }

  interface JQuery<T = HTMLElement> {
    startSample: number;
    endSample: number;
    tabs(): unknown;
    ready(callback: () => void): JQuery;
    each(callback: (index: number, element: T) => void): JQuery;

    find(selector: string): JQuery;
    parent(): JQuery;
    children(): JQuery;

    html(): string;
    html(htmlString: string): JQuery;

    text(): string;
    text(textString: string | number): JQuery;

    on(event: string, handler: (event: JQueryEventObject) => void): JQuery;

    hide(duration?: number | string, complete?: () => void): JQuery;
    show(duration?: number | string, complete?: () => void): JQuery;

    // Added methods
    css(propertyName: string): string;
    css(propertyName: string, value: string | number): JQuery;
    css(properties: Record<string, string | number>): JQuery;

    attr(attributeName: string): string | undefined;
    attr(attributeName: string, value: string | number): JQuery;
    attr(attributes: Record<string, string | number>): JQuery;

    removeAttr(attributeName: string): JQuery;

    append(content: string | JQuery | Element): JQuery;
    appendTo(target: string | JQuery | Element): JQuery;

    prepend(content: string | JQuery | Element): JQuery;
    prependTo(target: string | JQuery | Element): JQuery;

    before(content: string | JQuery | Element): JQuery;
    insertBefore(target: string | JQuery | Element): JQuery;

    after(content: string | JQuery | Element): JQuery;
    insertAfter(target: string | JQuery | Element): JQuery;

    remove(selector?: string): JQuery;
    is(selector: string): boolean;

    addClass(className: string): JQuery;
    removeClass(className?: string): JQuery;
    toggleClass(className: string, state?: boolean): JQuery;
    hasClass(className: string): boolean;

    width(): number;
    width(value: number | string): JQuery;

    height(): number;
    height(value: number | string): JQuery;

    offset(): { top: number; left: number } | undefined;
    offset(coordinates: { top: number; left: number }): JQuery;

    position(): { top: number; left: number };

    scrollTop(): number;
    scrollTop(value: number): JQuery;

    scrollLeft(): number;
    scrollLeft(value: number): JQuery;

    animate(
      properties: Record<string, string | number>,
      duration?: number | string,
      easing?: string,
      complete?: () => void,
    ): JQuery;

    stop(clearQueue?: boolean, jumpToEnd?: boolean): JQuery;

    val(): string | undefined;
    val(value: string | number): JQuery;

    length: number;
    [index: number]: T;
  }

  interface JQueryAjaxSettings {
    url?: string;
    type?: string;
    data?: any;
    success?: (data: any, textStatus: string, jqXHR: JQueryXHR) => void;
    error?: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => void;
  }

  interface JQueryXHR extends XMLHttpRequest {
    done(callback: (data: any, textStatus: string, jqXHR: JQueryXHR) => void): this;
    fail(callback: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => void): this;
    always(callback: () => void): this;
  }

  interface JQueryEventObject extends Event {
    data: any;
    delegateTarget: Element;
    relatedTarget: Element;
    result: any;
  }
}

declare const $: jQuery.JQueryStatic;
declare const jQuery: jQuery.JQueryStatic;
