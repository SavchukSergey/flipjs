///<reference path="vector-2d.ts" />

interface IFold {

    //Fold point on horizontal axis
    foldA: Vector2D;

    //Second fold point
    foldB: Vector2D;


    /**
     * Touch corner position
     */
    pointA: Vector2D;

    pointB: Vector2D;

    pointC: Vector2D;

    pointD: Vector2D;
    
    /**
     * Original corner position (0, 0)
     */
    pointE: Vector2D;
    
}