var Matrix2D = (function () {
    function Matrix2D(elements) {
        this.m = elements || [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }
    Matrix2D.prototype.transformVector = function (v) {
        return new Vector2D(v.x * this.m[0] + v.y * this.m[3] + this.m[6], v.x * this.m[1] + v.y * this.m[4] + this.m[7]);
    };
    Matrix2D.prototype.determinant = function () {
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
    };
    Matrix2D.prototype.multiplyArray = function (other) {
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
    };
    Matrix2D.prototype.multiply = function (other) {
        return this.multiplyArray(other.getElements());
    };
    Matrix2D.prototype.translate = function (vector) {
        return this.multiplyArray([1, 0, 0, 0, 1, 0, vector.x, vector.y, 1]);
    };
    Matrix2D.prototype.scale = function (kx, ky) {
        return this.multiplyArray([kx, 0, 0, 0, ky, 0, 0, 0, 1]);
    };
    Matrix2D.prototype.rotate = function (deg) {
        var angle = deg * Math.PI / 180;
        var ca = Math.cos(angle);
        var sa = Math.sin(angle);
        return this.multiplyArray([ca, sa, 0, -sa, ca, 0, 0, 0, 1]);
    };
    Matrix2D.prototype.reverse = function () {
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
    };
    Matrix2D.prototype.getElements = function () {
        return this.m.slice(0);
    };
    Matrix2D.prototype.roundFloat = function (v) {
        return Math.round(v * 1e8) / 1e8;
    };
    Matrix2D.prototype.getTransformExpression = function () {
        return "matrix(" + this.roundFloat(this.m[0]) + ", " + this.roundFloat(this.m[1]) + ", " + this.roundFloat(this.m[3]) + ", " + this.roundFloat(this.m[4]) + ", " + this.roundFloat(this.m[6]) + ", " + this.roundFloat(this.m[7]) + ")";
    };
    return Matrix2D;
}());
var Vector2D = (function () {
    function Vector2D(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector2D.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    ;
    Vector2D.prototype.sub = function (other) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    };
    ;
    Vector2D.prototype.add = function (other) {
        return new Vector2D(this.x + other.x, this.y + other.y);
    };
    ;
    Vector2D.prototype.mul = function (val) {
        return new Vector2D(this.x * val, this.y * val);
    };
    ;
    Vector2D.prototype.rotateClockwise90 = function () {
        return new Vector2D(this.y, -this.x);
    };
    ;
    Vector2D.prototype.rotateCounterClockwise90 = function () {
        return new Vector2D(-this.y, this.x);
    };
    ;
    Vector2D.prototype.changeLength = function (val) {
        var len = this.length();
        if (!len)
            len = 1;
        return this.mul(val / len);
    };
    ;
    Vector2D.prototype.normalize = function () {
        return this.changeLength(1);
    };
    Vector2D.prototype.toString = function () {
        return "{" + this.x + ", " + this.y + "}";
    };
    ;
    return Vector2D;
}());
///<reference path="vector-2d.ts" />
///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />
///<reference path="fold.ts" />
///<reference path="jquery.d.ts" />
$(document).ready(function () {
    var $container = $('.page-turn');
    var $scaler = $container.find('.scaler');
    var $frontPage;
    var $backPage;
    var $otherPage;
    var $frontPageImg;
    var $backPageImg;
    var $otherPageImg;
    var touchPointA;
    var touchCorner = '';
    var touchDelta = 0;
    var globalToLocalMatrix;
    var localToGlobalMatrix;
    var localToTextureMatrix;
    var textureToLocalMatrix;
    var screenHeight = $scaler.height();
    var screenWidth = $scaler.width();
    var pageHeight = screenHeight;
    var pageWidth = screenWidth / 2;
    /**
     * Get corner type by jquery node
     */
    function getCornerType($corner) {
        if ($corner.hasClass('corner-br')) {
            return 'br';
        }
        else if ($corner.hasClass('corner-bl')) {
            return 'bl';
        }
        else if ($corner.hasClass('corner-tr')) {
            return 'tr';
        }
        else if ($corner.hasClass('corner-tl')) {
            return 'tl';
        }
        else {
            return '';
        }
    }
    /**
     * Get global to corner local coordinate system transformation matrix
     */
    function getCornerMatrix(corner) {
        var m = new Matrix2D();
        switch (corner) {
            case 'br':
                return m.translate(new Vector2D(-screenWidth, -screenHeight)).scale(-1, -1);
            case 'bl':
                return m.translate(new Vector2D(0, -screenHeight)).scale(1, -1);
            case 'tr':
                return m.translate(new Vector2D(-screenWidth, 0)).scale(-1, 1);
            case 'tl':
                return m.translate(new Vector2D(0, 0)).scale(1, 1);
        }
        return null;
    }
    function getCornerShift(corner) {
        switch (corner) {
            case 'br':
            case 'tr':
                return 2;
            case 'bl':
            case 'tl':
                return -2;
        }
        return 0;
    }
    /**
     * Get local to texture transform matrix
     */
    function getTextureMatrix(corner) {
        var m = new Matrix2D();
        switch (corner) {
            case 'br':
                return m.scale(1, -1).translate(new Vector2D(0, pageHeight));
            case 'tr':
                return m.scale(1, 1).translate(new Vector2D(0, 0));
            case 'bl':
                return m.scale(-1, -1).translate(new Vector2D(pageWidth, pageHeight));
            case 'tl':
                return m.scale(-1, 1).translate(new Vector2D(pageWidth, 0));
        }
    }
    function getFrontPage(corner) {
        switch (corner) {
            case 'br':
            case 'tr':
                return $container.find('.page3');
            case 'bl':
            case 'tl':
                return $container.find('.page2');
        }
    }
    function getBackPage(corner) {
        switch (corner) {
            case 'br':
            case 'tr':
                return $container.find('.page4');
            case 'bl':
            case 'tl':
                return $container.find('.page1');
        }
    }
    function getOtherPage(corner) {
        switch (corner) {
            case 'br':
            case 'tr':
                return $container.find('.page2');
            case 'bl':
            case 'tl':
                return $container.find('.page3');
        }
    }
    function initCorner(corner) {
        screenHeight = $scaler.height();
        screenWidth = $scaler.width();
        pageHeight = screenHeight;
        pageWidth = screenWidth / 2;
        $frontPage = getFrontPage(corner);
        $backPage = getBackPage(corner);
        $otherPage = getOtherPage(corner);
        $frontPageImg = $frontPage.find('img');
        $backPageImg = $backPage.find('img');
        $otherPageImg = $otherPage.find('img');
        var $current = $container.find('li.current');
        switch (corner) {
            case 'tr':
            case 'br':
                $container.addClass('active').addClass('active-next').removeClass('active-prev');
                if ($container.find('li.current').next('li')) {
                    cleanPages();
                    $current.addClass('page1').next('li').addClass('page2').next('li').addClass('page3').next('li').addClass('page4');
                }
                break;
            case 'tl':
            case 'bl':
                $container.addClass('active').removeClass('active-next').addClass('active-prev');
                if ($container.find('li.current').prev('li').length) {
                    cleanPages();
                    $current.next('li').addClass('page4').prev('li').addClass('page3').prev('li').addClass('page2').prev('li').addClass('page1');
                }
                break;
            default:
                $container.removeClass('active').removeClass('active-next').removeClass('active-prev');
                break;
        }
        touchCorner = corner;
        touchDelta = getCornerShift(corner);
        globalToLocalMatrix = getCornerMatrix(corner);
        localToGlobalMatrix = globalToLocalMatrix.reverse();
        localToTextureMatrix = getTextureMatrix(corner);
        textureToLocalMatrix = localToTextureMatrix.reverse();
    }
    /**
     * Check pointA to spine distance. We dont want page to be torn...
     */
    function fixPointA(pointA) {
        var screenWidth = $scaler.width();
        var screenHeight = $scaler.height();
        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;
        if (pointA.length() < 10)
            pointA = new Vector2D(0, 0);
        var spinePointB = new Vector2D(pageWidth, pageHeight);
        var maxDiag = spinePointB.length();
        var diag = pointA.sub(spinePointB);
        if (diag.length() > maxDiag) {
            diag = diag.changeLength(maxDiag);
            pointA = diag.add(spinePointB);
        }
        var spinePointA = new Vector2D(pageWidth, 0);
        var dir = pointA.sub(spinePointA);
        if (dir.length() > pageWidth) {
            dir = dir.changeLength(pageWidth);
            pointA = dir.add(spinePointA);
        }
        return pointA;
    }
    /**
     * Easing function
     */
    function easeInOutCubic(t, b, c, d) {
        t /= d / 2;
        if (t < 1)
            return c / 2 * t * t * t + b;
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
    }
    ;
    (function () {
        var mouseDownStart;
        var state = 'init';
        var $handle;
        var dragging = null;
        var draggingPreview = null;
        function getMousePosition(ev) {
            if (ev.type.indexOf('touch') >= 0) {
                var touchEvent = ev.originalEvent;
                var touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
                return new Vector2D(touch.clientX, touch.clientY);
            }
            return new Vector2D(ev.clientX, ev.clientY);
        }
        function checkThreshold(a, b) {
            return a.sub(b).length() > 5;
        }
        function createDragArgs(ev) {
            var pos = getMousePosition(ev);
            var rect = $scaler[0].getBoundingClientRect();
            var start = new Vector2D(rect.left, rect.top);
            return {
                rel: pos.sub(start),
                $handle: $handle,
                event: ev
            };
        }
        function dragStart(ev) {
            var args = createDragArgs(ev);
            var corner = getCornerType(args.$handle);
            initCorner(corner);
            dragging = {};
            draggingPreview = null;
            return true;
        }
        function dragMove(ev) {
            if (dragging) {
                dragFold(ev);
            }
        }
        function dragFold(ev) {
            var args = createDragArgs(ev);
            touchPointA = globalToLocalMatrix.transformVector(args.rel);
            refresh(touchPointA);
        }
        function dragAnimate(target) {
            var start = touchPointA;
            var delta = target.sub(start);
            return animate(function (stage) {
                var vector = delta.mul(stage).add(start);
                touchPointA = vector;
                refresh(vector);
            }).done(function () {
                cleanPages();
                clean();
            });
        }
        function dragEnd(ev) {
            if (dragging) {
                var screenWidth = $scaler.width();
                var pageWidth = screenWidth / 2;
                if (touchPointA.x > pageWidth) {
                    dragAnimate(new Vector2D(screenWidth, 0)).done(function () {
                        shiftCurrent(touchDelta);
                    });
                }
                else {
                    dragCancel(ev);
                }
                dragging = null;
            }
        }
        function dragCancel(ev) {
            if (dragging) {
                dragAnimate(new Vector2D(0, 0));
                dragging = null;
            }
        }
        function dragCheck(ev, canCancel) {
            if (state === 'drag') {
                if (canCancel) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
                return dragMove(ev);
            }
            else if (state === 'threshold') {
                var pos = getMousePosition(ev);
                if (checkThreshold(mouseDownStart, pos)) {
                    state = 'drag';
                    var res = dragStart(ev);
                    if (!res)
                        state = 'init';
                    return res;
                }
            }
            return true;
        }
        $('html, body').on('mousedown touchstart', '.page-turn .corner', function (ev) {
            var $evtarget = $(ev.target);
            if (state === 'init') {
                mouseDownStart = getMousePosition(ev);
                ev.preventDefault();
                ev.stopPropagation();
                state = 'threshold';
                $handle = $evtarget.closest('.corner');
            }
        }).on('mousemove touchmove', '.page-turn .corner', function (ev) {
            if (dragging)
                return;
            draggingPreview = {};
            $handle = $(ev.target).closest('.corner');
            var args = createDragArgs(ev);
            var corner = getCornerType(args.$handle);
            initCorner(corner);
            dragFold(ev);
        }).on('mouseout touchend', '.page-turn .corner', function (ev) {
            if (!draggingPreview)
                return;
            draggingPreview = null;
            dragAnimate(new Vector2D(0, 0));
        }).bind('mousemove touchmove', function (ev) {
            return dragCheck(ev, true);
        }).bind('mousewheel', function (ev) {
            return dragCheck(ev, false);
        }).bind('mouseup touchend', function (ev) {
            if (state === 'drag') {
                ev.preventDefault();
                ev.stopPropagation();
                dragEnd(ev);
            }
            else if (state === 'threshold') {
                animateArrow(getCornerType($handle));
            }
            state = 'init';
        }).bind('keydown', function (ev) {
            if (!dragging)
                return;
            if (ev.keyCode === 27) {
                dragCancel(ev);
            }
        });
    })();
    function getPointAFromStage(stage) {
        var angle = 45 + 45 * stage; //symmetry line angle changes from 45 to 90.
        angle = angle * Math.PI / 180;
        var fx = stage * pageWidth;
        var fy = 0;
        var foldA = new Vector2D(fx, fy);
        var dpl = fx * Math.cos(angle);
        var dpx = dpl * Math.cos(angle);
        var dpy = dpl * Math.sin(angle);
        var pointM = new Vector2D(fx - dpx, dpy);
        return pointM.mul(2);
    }
    function getFoldB(pointA, pointB, pointC) {
        var ba = pointB.sub(pointA);
        if (ba.x == 0) {
            return new Vector2D(pointA.x, pageHeight);
        }
        var kx = -pointA.x / ba.x;
        if (kx >= 0 && kx <= 1) {
            return ba.mul(kx).add(pointA);
        }
        var cb = pointC.sub(pointB);
        var ky = (pageHeight - pointB.y) / cb.y;
        return cb.mul(ky).add(pointB);
    }
    function calculateFoldByCorner(pointA) {
        var pointM = pointA.mul(0.5);
        var symmetryLine = pointM.rotateClockwise90(); // starts at pointM and goes to both directions
        var foldA;
        if (symmetryLine.y != 0) {
            var ka = -pointM.y / symmetryLine.y;
            foldA = pointM.add(symmetryLine.mul(ka));
        }
        else {
            foldA = new Vector2D(pointM.x, 0);
        }
        var pointB;
        if (foldA.x == pointA.x && foldA.y == pointA.y) {
            pointB = pointA.add(new Vector2D(0, pageHeight));
        }
        else {
            pointB = foldA.sub(pointA).rotateClockwise90().changeLength(pageHeight).add(pointA);
        }
        var pointC = pointA.sub(pointB).rotateClockwise90().changeLength(pageWidth).add(pointB);
        var pointD = pointB.sub(pointC).rotateClockwise90().changeLength(pageHeight).add(pointC);
        return {
            pointA: pointA,
            pointB: pointB,
            pointC: pointC,
            pointD: pointD,
            pointE: new Vector2D(0, 0),
            foldA: foldA,
            foldB: getFoldB(pointA, pointB, pointC)
        };
    }
    function calculateFold() {
        var pointA = touchPointA; // getPointAFromStage(stage);
        pointA = fixPointA(pointA);
        var fold = calculateFoldByCorner(pointA);
        return {
            foldA: fold.foldA,
            foldB: fold.foldB,
            pointA: fold.pointA,
            pointB: fold.pointB,
            pointC: fold.pointC,
            pointD: fold.pointD,
            pointE: fold.pointE
        };
    }
    function dumpFold(localFold) {
        function debugPoint($point, vector) {
            vector = localToGlobalMatrix.transformVector(vector);
            $point.css({
                left: (100 * vector.x / screenWidth) + '%',
                top: (100 * vector.y / screenHeight) + '%'
            });
        }
        debugPoint($('.fold-point-A'), localFold.foldA);
        debugPoint($('.fold-point-B'), localFold.foldB);
        debugPoint($('.point-a'), localFold.pointA);
        debugPoint($('.point-b'), localFold.pointB);
        debugPoint($('.point-c'), localFold.pointC);
        debugPoint($('.point-d'), localFold.pointD);
        debugPoint($('.point-e'), localFold.pointE);
    }
    function getOuterClipMatrix(pointO, pointU, pointV) {
        var clipX = pointU.sub(pointO).mul(1 / pageWidth);
        var clipY = pointV.sub(pointO).mul(1 / pageHeight);
        return new Matrix2D([clipX.x, clipX.y, 0, clipY.x, clipY.y, 0, 0, 0, 1]).translate(pointO);
    }
    function setupPage($page, $img, matrix, clipperMatrix) {
        $page.css({
            transform: clipperMatrix.getTransformExpression()
        });
        matrix = matrix.multiply(clipperMatrix.reverse());
        $img.css({
            transform: matrix.getTransformExpression()
        });
    }
    function getPageMatrix(fold) {
        var pageXAxis = fold.pointD.sub(fold.pointA).normalize();
        var pageYAxis = fold.pointB.sub(fold.pointA).normalize();
        var pageMatrix = new Matrix2D([pageXAxis.x, pageXAxis.y, 0, pageYAxis.x, pageYAxis.y, 0, 0, 0, 1]).translate(fold.pointA);
        return localToTextureMatrix.multiply(pageMatrix);
    }
    function setupFrontPage(localFold) {
        var frontPageMatrix = getPageMatrix(localFold).multiply(localToGlobalMatrix);
        var clipperMatrix;
        if (localFold.foldA.x > localFold.foldB.x) {
            clipperMatrix = getOuterClipMatrix(localFold.foldA, localFold.pointA, localFold.foldB);
        }
        else {
            clipperMatrix = getOuterClipMatrix(localFold.foldB, localFold.pointB, localFold.foldA);
        }
        clipperMatrix = clipperMatrix.multiply(localToGlobalMatrix);
        setupPage($frontPage, $frontPageImg, frontPageMatrix, clipperMatrix);
    }
    function setupBackPage(localFold) {
        var spine = new Vector2D(pageWidth, 0);
        spine = textureToLocalMatrix.transformVector(spine);
        spine = localToGlobalMatrix.transformVector(spine);
        var backPageMatrix = new Matrix2D().translate(spine);
        var clipperMatrix;
        if (localFold.foldA.x > localFold.foldB.x) {
            clipperMatrix = getOuterClipMatrix(localFold.foldA, localFold.pointE, localFold.foldB);
        }
        else {
            clipperMatrix = getOuterClipMatrix(localFold.foldB, new Vector2D(0, pageHeight), localFold.foldA);
        }
        clipperMatrix = clipperMatrix.multiply(localToGlobalMatrix);
        setupPage($backPage, $backPageImg, backPageMatrix, clipperMatrix);
    }
    function refresh(pointA) {
        var localFold = calculateFold();
        setupFrontPage(localFold);
        setupBackPage(localFold);
        // dumpFold(localFold);
    }
    function cleanPages() {
        return $container.find('li').removeClass('page1 page2 page3 page4');
    }
    function clean() {
        $container.removeClass('active').find('li').css('transform', '').find('img').css('transform', '');
    }
    function refreshState() {
        var $current = $container.find('li.current');
        $container.toggleClass('can-prev-2', !!$current.prev('li').length);
        $container.toggleClass('can-next-2', !!$current.next('li').length);
    }
    function shiftCurrent(delta) {
        var $current = $container.find('li.current');
        var $currentOne = $container.find('li.current-one');
        var $node = $current;
        var $nodeOne = $currentOne;
        while (delta >= 2) {
            $node = $node.next('li').next('li');
            ;
            $nodeOne = $nodeOne.next('li').next('li');
            ;
            delta -= 2;
        }
        while (delta <= -2) {
            $node = $node.prev('li').prev('li');
            ;
            $nodeOne = $nodeOne.prev('li').prev('li');
            ;
            delta += 2;
        }
        while (delta >= 1) {
            if ($node[0] == $nodeOne[0]) {
                $nodeOne = $nodeOne.next('li');
            }
            else {
                $node = $node.next('li').next('li');
                $nodeOne = $nodeOne.next('li');
            }
            delta--;
        }
        while (delta <= -1) {
            if ($node[0] == $nodeOne[0]) {
                $node = $node.prev('li').prev('li');
                $nodeOne = $nodeOne.prev('li');
            }
            else {
                $nodeOne = $nodeOne.prev('li');
            }
            delta++;
        }
        if ($node.length) {
            $current.removeClass('current');
            $currentOne.removeClass('current-one');
            $node.addClass('current');
            $nodeOne.addClass('current-one');
        }
        refreshState();
        preloadImages();
        return $node;
    }
    function animate(callback) {
        var frame = 0;
        var step = 4;
        callback(0);
        var promise = $.Deferred();
        function draw() {
            requestAnimationFrame(function () {
                frame += step;
                frame = Math.min(frame, 100);
                var x = easeInOutCubic(frame / 100, 0, 1, 1);
                callback(x);
                if (frame < 100) {
                    draw();
                }
                else {
                    promise.resolve();
                }
            });
        }
        draw();
        return promise;
    }
    function animateArrow(corner) {
        initCorner(corner);
        animate(function (stage) {
            var pointA = getPointAFromStage(stage);
            touchPointA = pointA;
            refresh(touchPointA);
        }).done(function () {
            cleanPages();
            clean();
            shiftCurrent(touchDelta);
        });
    }
    function preloadImages() {
        preloadNextImages();
        preloadPrevImages();
    }
    var preloaders = {};
    function preloadImage($img) {
        if (!$img.length)
            return;
        var imgNode = $img[0];
        var src = imgNode.src;
        var img = new Image();
        img.src = src;
        img.onload = function () {
            console.log(src);
        };
        preloaders[src] = img;
    }
    function preloadNextImages() {
        var $current = $scaler.find('li.current');
        for (var i = 0; i < 3; i++) {
            var $current = $current.next('li');
            var $img = $current.find('img');
            preloadImage($img);
        }
    }
    function preloadPrevImages() {
        var $current = $scaler.find('li.current');
        for (var i = 0; i < 3; i++) {
            var $current = $current.prev('li');
            var $img = $current.find('img');
            preloadImage($img);
        }
    }
    function animateFlipForward() {
        var $newBase = $container.find('li.current').next('li');
        if ($newBase.length) {
            animateArrow('br');
        }
    }
    function animateFlipBackward() {
        var $newBase = $container.find('li.current').prev('li');
        if ($newBase.length) {
            animateArrow('bl');
        }
    }
    preloadImages();
    refreshState();
    $('body').on('click', '.page-turn .nav-next-2', function () {
        animateFlipForward();
    }).on('click', '.page-turn .nav-prev-2', function () {
        animateFlipBackward();
    }).on('click', '.page-turn .nav-next', function () {
        shiftCurrent(1);
    }).on('click', '.page-turn .nav-prev', function () {
        shiftCurrent(-1);
    });
});

//# sourceMappingURL=flipper.js.map
