function Vector2D(x, y) {

    this.x = x;
    this.y = y;

    this.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    this.sub = function (other: IVector2D) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    };

    this.add = function (other: IVector2D) {
        return new Vector2D(this.x + other.x, this.y + other.y);
    };

    this.mul = function (val) {
        return new Vector2D(this.x * val, this.y * val);
    };

    this.rotateClockwise90 = function () {
        return new Vector2D(this.y, -this.x);
    };

    this.rotateCounterClockwise90 = function () {
        return new Vector2D(-this.y, this.x);
    };

    this.changeLength = function (val) {
        var len = this.length();
        if (!len) len = 1;
        return this.mul(val / len);
    };

    this.normalize = function () {
        return this.changeLength(1);
    }

    this.toString = function() {
        return `{${this.x}, ${this.y}}`;
    };

}

interface IVector2D {

    sub(other: IVector2D): IVector2D;

    add(other: IVector2D): IVector2D;

    rotateClockwise90(): IVector2D;

    changeLength(len: number): IVector2D;

    mul(k: number) : IVector2D;

    length(): number;

    normalize(): IVector2D;

    x: number;

    y: number;

}