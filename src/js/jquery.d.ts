interface IJQueryNodes {

    hasClass(className: string): boolean;

    addClass(className: string): IJQueryNodes;

    removeClass(className: string): IJQueryNodes;

    toggleClass(className: string, val: boolean): IJQueryNodes;

    find(selector: string): IJQueryNodes;

    next(selector: string): IJQueryNodes;

    prev(selector: string): IJQueryNodes;

    closest(selector: string): IJQueryNodes;

    ready(f: { () });

    empty() : IJQueryNodes;

    clone() : IJQueryNodes;

    length: number;

    width(): number;

    height(val?: number): number;

    css(obj: any): IJQueryNodes;

    css(prop: string, val: string): IJQueryNodes;

    attr(prop: string): string;

    attr(prop: string, value: string): IJQueryNodes;

    val(): string;

    val(value: string): IJQueryNodes;

    text(prop: string): string;

    text(prop: string, value: string): IJQueryNodes;

    data(prop: string): any;

    data(prop: string, value: any): IJQueryNodes;

    on(eventName: string, selector: string, func: { (ev: IJQueryEvent, arg?: any) });

    off(eventName: string);

    bind(eventName: string, func: IJQueryEventHandler);

    unbind(eventName: string, func: IJQueryEventHandler);

    trigger(eventName: string, args?: any);

    show(): IJQueryNodes;

    hide(): IJQueryNodes;

    remove(): IJQueryNodes;

    index(): number;

    blur(): IJQueryNodes;

    append(nodes: IJQueryNodes): IJQueryNodes;

    [index: number]: HTMLElement;

    each(func: IJQueryEach<HTMLElement>): IJQueryNodes;

    filter(selector: string): IJQueryNodes;

    after(node: IJQueryNodes): IJQueryNodes;

    not(selector: string): IJQueryNodes;

    children(selector?: string): IJQueryNodes;

    animate(args: any, args2: any): IJQueryNodes;

    contents(): IJQueryNodes;

}

interface IJQueryEvent {

    target: Node;

    pageX: number;

    pageY: number;

    which: number;

    keyCode: number;


    ctrlKey: boolean;

    type: string;

    clientX: number;

    clientY: number;

    originalEvent: Event;

    preventDefault();

    stopPropagation();

}

interface IJQueryPromise {

    reject(data?: any): IJQueryPromise;

    resolve(data?: any): IJQueryPromise;

    done(data: { (data?: any) }): IJQueryPromise;
}

interface IJQueryStatic {

    (selector: string): IJQueryNodes;

    (doc: Document): IJQueryNodes;

    (win: Window): IJQueryNodes;

    (node: Node): IJQueryNodes;

    (obj: any): IJQueryNodes;

    Deferred(): IJQueryPromise;

    fn: any;

    extend(obj: any, ...others): any;

    ajax(args: any): IJQueryPromise;

    each<T>(objs: T[], func: IJQueryEach<T>): IJQueryNodes;

    parseJSON(str: string): any;

}

interface IJQueryEventHandler {

    (ev: IJQueryEvent, args?: any);

}

interface IJQueryEach<T> {

    (index: number, node: T);

}

declare var $: IJQueryStatic;


