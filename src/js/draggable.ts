///<reference path="vector-2d.ts" />
///<reference path="jquery.d.ts" />

interface IDragArgs {

    $handle: IJQueryNodes;

    vector: Vector2D;

    rel: Vector2D;

    event: IJQueryEvent;

}

interface IDraggable {

    start(args: IDragArgs);

    move(args: IDragArgs);

    stop(args: IDragArgs);

    cancel(args: IDragArgs);
    
}