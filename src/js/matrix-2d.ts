class Matrix2D {

    private m: number[];

    constructor(elements?: number[]) {
        this.m = elements || [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    public transformVector(v: IVector2D) : IVector2D {
        return new Vector2D(
            v.x * this.m[0] + v.y * this.m[3] + this.m[6],
            v.x * this.m[1] + v.y * this.m[4] + this.m[7]
        );
    }

    public determinant() {
        var ax = this.m[0];
        var ay = this.m[1];
        var az = this.m[2];
        var bx = this.m[3];
        var by = this.m[4];
        var bz = this.m[5];
        var cx = this.m[6];
        var cy = this.m[7];
        var cz = this.m[8];

        var dx = by * cz - bz * cy;
        var dy = bz * cx - bx * cz;
        var dz = bx * cy - by * cx;
        return ax * dx + ay * dy + az * dz;
    }

    private multiplyArray(other: number[]) {
        return new Matrix2D([
            this.m[0] * other[0] + this.m[1] * other[3] + this.m[2] * other[6],
            this.m[0] * other[1] + this.m[1] * other[4] + this.m[2] * other[7],
            this.m[0] * other[2] + this.m[1] * other[5] + this.m[2] * other[8],

            this.m[3] * other[0] + this.m[4] * other[3] + this.m[5] * other[6],
            this.m[3] * other[1] + this.m[4] * other[4] + this.m[5] * other[7],
            this.m[3] * other[2] + this.m[4] * other[5] + this.m[5] * other[8],

            this.m[6] * other[0] + this.m[7] * other[3] + this.m[8] * other[6],
            this.m[6] * other[1] + this.m[7] * other[4] + this.m[8] * other[7],
            this.m[6] * other[2] + this.m[7] * other[5] + this.m[8] * other[8]
        ]);
    }

    public multiply(other: Matrix2D): Matrix2D {
        return this.multiplyArray(other.getElements());
    }

    public translate(vector: IVector2D): Matrix2D {
        return this.multiplyArray([1, 0, 0, 0, 1, 0, vector.x, vector.y, 1]);
    }

    public scale(kx: number, ky: number): Matrix2D {
        return this.multiplyArray([kx, 0, 0, 0, ky, 0, 0, 0, 1]);
    }

    public rotate(deg: number): Matrix2D {
        var angle = deg * Math.PI / 180;
        var ca = Math.cos(angle);
        var sa = Math.sin(angle);
        return this.multiplyArray([ca, sa, 0, -sa, ca, 0, 0, 0, 1]);
    }

    public reverse(): Matrix2D {
        var det = this.determinant();

        var ux = this.m[0];
        var uy = this.m[3];
        var uz = this.m[6];

        var vx = this.m[1];
        var vy = this.m[4];
        var vz = this.m[7];

        var wx = this.m[2];
        var wy = this.m[5];
        var wz = this.m[8];

        var c11 = (vy * wz - wy * vz) / det;
        var c12 = (wy * uz - uy * wz) / det;
        var c13 = (uy * vz - vy * uz) / det;

        var c21 = (wx * vz - vx * wz) / det;
        var c22 = (ux * wz - wx * uz) / det;
        var c23 = (vx * uz - ux * vz) / det;

        var c31 = (vx * wy - wx * vy) / det;
        var c32 = (wx * uy - ux * wy) / det;
        var c33 = (ux * vy - vx * uy) / det;

        return new Matrix2D([c11, c21, c31, c12, c22, c32, c13, c23, c33]);
    }

    public getElements() {
        return this.m.slice(0);
    }

    private roundFloat(v) {
        return Math.round(v * 1e8) / 1e8;
    }

    public getTransformExpression() {
        return `matrix(${this.roundFloat(this.m[0])}, ${this.roundFloat(this.m[1])}, ${this.roundFloat(this.m[3])}, ${this.roundFloat(this.m[4])}, ${this.roundFloat(this.m[6])}, ${this.roundFloat(this.m[7])})`;
    }

}
