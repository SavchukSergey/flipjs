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

    length: number;

    width(): number;

    height(): number;

    css(obj: any): IJQueryNodes;

    css(prop: string, val: string): IJQueryNodes;

    attr(prop: string): string;

    on(eventName: string, selector: string, func: { (ev: IJQueryEvent) });

    [index: number]: HTMLElement;

}

interface IJQueryEvent {
    
    type: string;

    clientX: number;

    clientY: number;

    originalEvent: Event;
    
    target: Node;

    preventDefault();
    
    stopPropagation();

}

interface IJQueryPromise {
    
    resolve(data?: any) : IJQueryPromise;

    done(data: {(data?: any)}) : IJQueryPromise;
}

interface IJQueryStatic {

    (selector: string): IJQueryNodes;

    (doc: Document): IJQueryNodes;

    (node: Node): IJQueryNodes;

    Deferred(): IJQueryPromise;

}


declare var $: IJQueryStatic;


