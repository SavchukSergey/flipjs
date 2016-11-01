class Matrix2D {

    private m: number[];

    constructor(elements?: number[]) {
        this.m = elements || [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    public transformVector(v: Vector2D): Vector2D {
        var m = this.m;
        return new Vector2D(
            v.x * m[0] + v.y * m[3] + m[6],
            v.x * m[1] + v.y * m[4] + m[7]
        );
    }

    public determinant() {
        var m = this.m;
        var ax = m[0];
        var ay = m[1];
        var az = m[2];
        var bx = m[3];
        var by = m[4];
        var bz = m[5];
        var cx = m[6];
        var cy = m[7];
        var cz = m[8];

        var dx = by * cz - bz * cy;
        var dy = bz * cx - bx * cz;
        var dz = bx * cy - by * cx;
        return ax * dx + ay * dy + az * dz;
    }

    private multiplyArray(other: number[]) {
        var m = this.m;
        return new Matrix2D([
            m[0] * other[0] + m[1] * other[3] + m[2] * other[6],
            m[0] * other[1] + m[1] * other[4] + m[2] * other[7],
            m[0] * other[2] + m[1] * other[5] + m[2] * other[8],

            m[3] * other[0] + m[4] * other[3] + m[5] * other[6],
            m[3] * other[1] + m[4] * other[4] + m[5] * other[7],
            m[3] * other[2] + m[4] * other[5] + m[5] * other[8],

            m[6] * other[0] + m[7] * other[3] + m[8] * other[6],
            m[6] * other[1] + m[7] * other[4] + m[8] * other[7],
            m[6] * other[2] + m[7] * other[5] + m[8] * other[8]
        ]);
    }

    public multiply(other: Matrix2D): Matrix2D {
        return this.multiplyArray(other.getElements());
    }

    public translate(vector: Vector2D): Matrix2D {
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
        var m = this.m;
        var det = this.determinant();

        var ux = m[0];
        var uy = m[3];
        var uz = m[6];

        var vx = m[1];
        var vy = m[4];
        var vz = m[7];

        var wx = m[2];
        var wy = m[5];
        var wz = m[8];

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
        var self = this;
        var m = self.m;
        var dx = m[6];
        var dy = m[7];
        var kxx = m[0];
        var kxy = m[1];
        var kyx = m[3];
        var kyy = m[4];
        var kx = Math.sqrt(kxx * kxx + kyx * kyx);
        var ky = Math.sqrt(kxy * kxy + kyy * kyy);
        kxx /= kx;
        kyx /= kx;
        dx /= kx;
        kxy /= ky;
        kyy /= ky;
        dy /= ky;
        // return `translate(${self.roundFloat(dx)}px ${self.roundFloat(dy)}px) matrix(${self.roundFloat(m[0])}, ${self.roundFloat(m[1])}, ${self.roundFloat(m[3])}, ${self.roundFloat(m[4])}, 0, 0) `;
        return `matrix(${self.roundFloat(m[0])}, ${self.roundFloat(m[1])}, ${self.roundFloat(m[3])}, ${self.roundFloat(m[4])}, ${self.roundFloat(m[6])}, ${self.roundFloat(m[7])})`;
        // return ` scale(${kx}, ${ky}) matrix(${self.roundFloat(kxx)}, ${self.roundFloat(kxy)}, ${self.roundFloat(kyx)}, ${self.roundFloat(kyy)}, ${dx}, ${dy})`;
    }

    public getTransformMatrixExpression() {
        var self = this;
        var m = self.m;
        return `matrix(${self.roundFloat(m[0])}, ${self.roundFloat(m[1])}, ${self.roundFloat(m[3])}, ${self.roundFloat(m[4])}, ${self.roundFloat(m[6])}, ${self.roundFloat(m[7])})`;
    }

}
