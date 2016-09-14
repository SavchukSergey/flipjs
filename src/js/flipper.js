function Matrix2D(elements) {
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
        return "matrix(" + roundFloat(m[0]) + ", " + roundFloat(m[1]) + ", " + roundFloat(m[3]) + ", " + roundFloat(m[4]) + ", " + roundFloat(m[6]) + ", " + roundFloat(m[7]) + ")";
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
function Vector2D(x, y) {
    this.x = x;
    this.y = y;
    this.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    this.sub = function (other) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    };
    this.add = function (other) {
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
        if (!len)
            len = 1;
        return this.mul(val / len);
    };
    this.normalize = function () {
        return this.changeLength(1);
    };
}
///<reference path="vector-2d.ts" />
///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />
///<reference path="fold.ts" />
$(document).ready(function () {
    var $container = $('.page-turn');
    var $scaler = $container.find('.scaler');
    var touchCorner = 'right';
    var stage = 0;
    function setStage(corner, frame) {
        touchCorner = corner;
        stage = frame;
        stage = Math.min(1, stage);
        stage = Math.max(0, stage);
    }
    function calculateFold(stage) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();
        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;
        var angle = 45 + 45 * stage; //symmetry line angle changes from 45 to 90.
        angle = angle * Math.PI / 180;
        var fx = stage * pageWidth;
        var fy = 0;
        var foldA = new Vector2D(fx, fy);
        var dpl = fx * Math.cos(angle);
        var dpx = dpl * Math.cos(angle);
        var dpy = dpl * Math.sin(angle);
        var p = new Vector2D(fx - dpx, dpy);
        var pointA = p.mul(2);
        var pointB = foldA.sub(pointA).rotateClockwise90().changeLength(pageHeight).add(pointA);
        var pointC = pointA.sub(pointB).rotateClockwise90().changeLength(pageWidth).add(pointB);
        var pointD = pointB.sub(pointC).rotateClockwise90().changeLength(pageHeight).add(pointC);
        var pointE = new Vector2D(0, 0);
        var foldB = pointB;
        if (foldB.x < 0) {
            var ba = pointA.sub(pointB).changeLength(pageHeight);
            var k = -pointA.x / ba.x;
            ba = ba.mul(k);
            foldB = ba.add(pointA);
        }
        else {
            var side = pointC.sub(pointB);
            var crossLineY = pageHeight - pointB.y;
            if (side.y != 0) {
                var k = crossLineY / side.y;
                foldB = side.mul(k).add(pointB);
            }
            else {
                foldB = pointC;
            }
        }
        return {
            foldA: foldA,
            foldB: foldB,
            pointA: pointA,
            pointB: pointB,
            pointC: pointC,
            pointD: pointD,
            pointE: pointE
        };
    }
    function getGlobalFold(fold) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();
        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;
        function toGlobal(vector) {
            if (touchCorner == 'right') {
                return new Vector2D(screenWidth - vector.x, screenHeight - vector.y);
            }
            else if (touchCorner == 'left') {
                return new Vector2D(vector.x, screenHeight - vector.y);
            }
        }
        return {
            foldA: toGlobal(fold.foldA),
            foldB: toGlobal(fold.foldB),
            pointA: toGlobal(fold.pointA),
            pointB: toGlobal(fold.pointB),
            pointC: toGlobal(fold.pointC),
            pointD: toGlobal(fold.pointD),
            pointE: toGlobal(fold.pointE)
        };
    }
    function dumpFold(globalFold) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();
        function debugPoint($point, vector) {
            $point.css({
                left: (100 * vector.x / screenWidth) + '%',
                top: (100 * vector.y / screenHeight) + '%'
            });
        }
        debugPoint($('.fold-point-A'), globalFold.foldA);
        debugPoint($('.fold-point-B'), globalFold.foldB);
        debugPoint($('.point-a'), globalFold.pointA);
        debugPoint($('.point-b'), globalFold.pointB);
        debugPoint($('.point-c'), globalFold.pointC);
        debugPoint($('.point-d'), globalFold.pointD);
        debugPoint($('.point-e'), globalFold.pointE);
    }
    function getOuterClipMatrix(pointO, pointU, pointV, originalWidth, originalHeight) {
        var width = pointU.sub(pointO).length();
        var height = pointV.sub(pointO).length();
        var clipX = pointU.sub(pointO).changeLength(width / originalWidth);
        var clipY = pointV.sub(pointO).changeLength(height / originalHeight);
        return new Matrix2D([clipX.x, clipX.y, 0, clipY.x, clipY.y, 0, 0, 0, 1]).translate(pointO);
    }
    function setupPage($page, matrix, clipperMatrix) {
        $page.css({
            transform: clipperMatrix.getTransformExpression()
        });
        matrix = matrix.multiply(clipperMatrix.reverse());
        $page.find('img').css({
            transform: matrix.getTransformExpression()
        });
    }
    function getPageMatrix(globalFold) {
        if (touchCorner == 'right') {
            var page3XAxis = globalFold.pointC.sub(globalFold.pointB).normalize();
            var page3YAxis = globalFold.pointA.sub(globalFold.pointB).normalize();
            return new Matrix2D([page3XAxis.x, page3XAxis.y, 0, page3YAxis.x, page3YAxis.y, 0, 0, 0, 1]).translate(globalFold.pointB);
        }
        else if (touchCorner == 'left') {
            var page3XAxis = globalFold.pointB.sub(globalFold.pointC).normalize();
            var page3YAxis = globalFold.pointD.sub(globalFold.pointC).normalize();
            return new Matrix2D([page3XAxis.x, page3XAxis.y, 0, page3YAxis.x, page3YAxis.y, 0, 0, 0, 1]).translate(globalFold.pointC);
        }
    }
    function refresh() {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();
        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;
        var localFold = calculateFold(stage);
        var globalFold = getGlobalFold(localFold);
        dumpFold(globalFold);
        var pageMatrix = getPageMatrix(globalFold);
        var clipperMatrix = getOuterClipMatrix(globalFold.foldA, globalFold.pointA, globalFold.foldB, pageWidth, pageHeight);
        var clipper2Matrix = getOuterClipMatrix(globalFold.foldA, globalFold.pointE, globalFold.foldB, pageWidth, pageHeight);
        if (touchCorner == 'right') {
            var page4Matrix = new Matrix2D().translate(new Vector2D(pageWidth, 0));
            setupPage($('.page3'), pageMatrix, clipperMatrix);
            setupPage($('.page4'), page4Matrix, clipper2Matrix);
        }
        else if (touchCorner == 'left') {
            var page1Matrix = new Matrix2D().translate(new Vector2D(0, 0));
            setupPage($('.page2'), pageMatrix, clipperMatrix);
            setupPage($('.page1'), page1Matrix, clipper2Matrix);
        }
    }
    function cleanPages() {
        return $container.find('li').removeClass('page1 page2 page3 page4');
    }
    function clean() {
        $container.removeClass('active').find('li').css('transform', '').find('img').css('transform', '');
    }
    function shiftCurrent(delta) {
        var $current = $container.find('li.current');
        var $node = $current;
        while (delta) {
            if (delta > 0) {
                $node = $node.next('li');
                delta--;
            }
            else if (delta < 0) {
                $node = $node.prev('li');
                delta++;
            }
        }
        if ($node.length) {
            $current.removeClass('current');
            $node.addClass('current');
            return $node;
        }
        return $current;
    }
    function animate(corner, delta) {
        touchCorner = corner;
        clean();
        $container.addClass('active').toggleClass('active-next', delta > 0).toggleClass('active-prev', delta < 0);
        var frame = 0;
        var step = 4;
        function draw() {
            requestAnimationFrame(function () {
                if (frame <= 100) {
                    frame += step;
                    setStage(corner, frame / 100);
                    draw();
                }
                else {
                    cleanPages();
                    clean();
                    shiftCurrent(delta);
                }
                refresh();
            });
        }
        draw();
    }
    function animateForward() {
        cleanPages();
        $container.find('li.current').addClass('page1').next('li').addClass('page2').next('li').addClass('page3').next('li').addClass('page4');
        animate('right', 2);
    }
    function animateBackward() {
        cleanPages();
        $container.find('li.current').next('li').addClass('page4').prev('li').addClass('page3').prev('li').addClass('page2').prev('li').addClass('page1');
        animate('left', -2);
    }
    $('input#fold').bind('input', function () {
        touchCorner = 'left';
        clean();
        $container.addClass('active');
        var $current = $container.find('li.current');
        $container.find('li.current').next('li').addClass('page4').prev('li').addClass('page3').prev('li').addClass('page2').prev('li').addClass('page1');
        refresh();
    });
    $('button.forward').click(animateForward);
    $('button.backward').click(animateBackward);
    refresh();
});

//# sourceMappingURL=flipper.js.map
