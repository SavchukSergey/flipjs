class Vector2D {

    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    public sub(other: Vector2D) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    };

    public add(other: Vector2D) {
        return new Vector2D(this.x + other.x, this.y + other.y);
    };

    public mul(val: number) {
        return new Vector2D(this.x * val, this.y * val);
    };

    public rotateClockwise90() {
        return new Vector2D(this.y, -this.x);
    };

    public rotateCounterClockwise90() {
        return new Vector2D(-this.y, this.x);
    };

    public changeLength(val: number) {
        var len = this.length();
        if (!len) len = 1;
        return this.mul(val / len);
    };

    public normalize() {
        return this.changeLength(1);
    }

    public toString() {
        return `{${this.x}, ${this.y}}`;
    };

}