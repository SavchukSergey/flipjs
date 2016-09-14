function Matrix2D(elements?: number[]) {

    var self = this;

    var m = elements || [1, 0, 0, 0, 1, 0, 0, 0, 1];

    function determinant() {
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

    function multiplyArray(other) {
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

    function multiply(other) {
        return multiplyArray(other.getElements());
    }

    function translate(vector) {
        return multiplyArray([1, 0, 0, 0, 1, 0, vector.x, vector.y, 1]);
    }

    function scale(kx, ky) {
        return multiplyArray([kx, 0, 0, 0, ky, 0, 0, 0, 1]);
    }

    function rotate(deg) {
        var angle = deg * Math.PI / 180;
        var ca = Math.cos(angle);
        var sa = Math.sin(angle);
        return multiplyArray([ca, sa, 0, -sa, ca, 0, 0, 0, 1]);
    }

    function reverse() {
        var det = determinant();

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

    function getElements() {
        return m.slice(0);
    }

    function roundFloat(v) {
        return Math.round(v * 1e8) / 1e8;
    }

    function getTransformExpression() {
        return `matrix(${roundFloat(m[0])}, ${roundFloat(m[1])}, ${roundFloat(m[3])}, ${roundFloat(m[4])}, ${roundFloat(m[6])}, ${roundFloat(m[7])})`;
    }

    self.getElements = getElements;
    self.getTransformExpression = getTransformExpression;
    self.translate = translate;
    self.scale = scale;
    self.reverse = reverse;
    self.rotate = rotate;
    self.multiply = multiply;
    self.determinant = determinant;
}

interface IMatrix2D {

    getTransformExpression(): string;

    reverse(): IMatrix2D;

    multiply(other: IMatrix2D); IMatrix2D;
    
}
