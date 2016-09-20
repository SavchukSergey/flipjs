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
    this.toString = function () {
        return "{" + this.x + ", " + this.y + "}";
    };
}
///<reference path="vector-2d.ts" />
///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />
///<reference path="fold.ts" />
///<reference path="jquery.d.ts" />
$(document).ready(function () {
    var $container = $('.page-turn');
    var $scaler = $container.find('.scaler');
    var touchPointA;
    var touchCorner = '';
    var globalToLocalMatrix;
    var localToGlobalMatrix;
    var localToTextureMatrix;
    var textureToLocalMatrix;
    /**
     * Get corner type by jquery node
     */
    function getCornerType($corner) {
        if ($corner.hasClass('corner-br')) {
            return 'br';
        }
        if ($corner.hasClass('corner-bl')) {
            return 'bl';
        }
        if ($corner.hasClass('corner-tr')) {
            return 'tr';
        }
        if ($corner.hasClass('corner-tl')) {
            return 'tl';
        }
        return '';
    }
    /**
     * Get global to corner local coordinate system transformation matrix
     */
    function getCornerMatrix(corner) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();
        switch (corner) {
            case 'br':
                return new Matrix2D().translate(new Vector2D(-screenWidth, -screenHeight)).scale(-1, -1);
            case 'bl':
                return new Matrix2D().translate(new Vector2D(0, -screenHeight)).scale(1, -1);
            case 'tr':
                return new Matrix2D().translate(new Vector2D(-screenWidth, 0)).scale(-1, 1);
            case 'tl':
                return new Matrix2D().translate(new Vector2D(0, 0)).scale(1, 1);
        }
        return null;
    }
    /**
     * Get local to texture transform matrix
     */
    function getTextureMatrix(corner) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();
        var pageHeight = screenHeight;
        var pageWidth = screenWidth / 2;
        switch (corner) {
            case 'br':
                return new Matrix2D().scale(1, -1).translate(new Vector2D(0, pageHeight));
            case 'tr':
                return new Matrix2D().scale(1, 1).translate(new Vector2D(0, 0));
            case 'bl':
                return new Matrix2D().scale(-1, -1).translate(new Vector2D(pageWidth, pageHeight));
            case 'tl':
                return new Matrix2D().scale(-1, 1).translate(new Vector2D(pageWidth, 0));
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
    function initCorner(corner) {
        switch (corner) {
            case 'tr':
            case 'br':
                $container.addClass('active').addClass('active-next').removeClass('active-prev');
                var $newRightBase = $container.find('li.current').next('li').next('li');
                if ($newRightBase.length) {
                    cleanPages();
                    $container.find('li.current').addClass('page1').next('li').addClass('page2').next('li').addClass('page3').next('li').addClass('page4');
                }
                break;
            case 'tl':
            case 'bl':
                $container.addClass('active').removeClass('active-next').addClass('active-prev');
                var $newLeftBase = $container.find('li.current').prev('li').prev('li');
                if ($newLeftBase.length) {
                    cleanPages();
                    $container.find('li.current').next('li').addClass('page4').prev('li').addClass('page3').prev('li').addClass('page2').prev('li').addClass('page1');
                }
                break;
            default:
                $container.removeClass('active').removeClass('active-next').removeClass('active-prev');
                break;
        }
        touchCorner = corner;
        globalToLocalMatrix = getCornerMatrix(corner);
        localToGlobalMatrix = globalToLocalMatrix.reverse();
        localToTextureMatrix = getTextureMatrix(corner);
        textureToLocalMatrix = localToTextureMatrix.reverse();
    }
    /**
     * Check pointA to spine distance
     */
    function fixPointA(pointA) {
        var screenWidth = $scaler.width();
        var screenHeight = $scaler.height();
        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;
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
        var $target;
        var $handle;
        var cssBackup = {
            zIndex: ''
        };
        var dragging = null;
        function getMousePosition(ev) {
            if (ev.type.indexOf('touch') >= 0) {
                var touchEvent = ev.originalEvent;
                var touch = touchEvent.touches[0];
                if (touch) {
                    return {
                        x: touch.clientX,
                        y: touch.clientY
                    };
                }
                else {
                    touch = touchEvent.changedTouches[0];
                    return {
                        x: touch.clientX,
                        y: touch.clientY
                    };
                }
            }
            return {
                x: ev.clientX,
                y: ev.clientY
            };
        }
        function checkThreshold(a, b) {
            var dx = a.x - b.x;
            var dy = a.y - b.y;
            var d = Math.sqrt(dx * dx + dy * dy);
            return d > 5;
        }
        function getDragVector(ev) {
            var pos = getMousePosition(ev);
            return {
                x: pos.x - mouseDownStart.x,
                y: pos.y - mouseDownStart.y
            };
        }
        function createDragArgs(ev) {
            var vector = getDragVector(ev);
            var pos = getMousePosition(ev);
            var rect = $scaler[0].getBoundingClientRect();
            var rel = {
                x: pos.x - rect.left,
                y: pos.y - rect.top
            };
            return {
                rel: new Vector2D(rel.x, rel.y),
                vector: vector,
                position: pos,
                pageX: ev.pageX,
                pageY: ev.pageY,
                $handle: $handle,
                $target: $target,
                event: ev
            };
        }
        function createCssBackup() {
            if (!$target)
                debugger;
            var target = $target[0];
            if (!target)
                return null;
            return {
                zIndex: target.style.zIndex
            };
        }
        function restoreCss(backup) {
            var target = $target[0];
            if (target) {
                target.style.zIndex = backup.zIndex;
            }
        }
        function dragStart(ev) {
            cssBackup = createCssBackup();
            var dragArgs = createDragArgs(ev);
            dragging = {};
            var res = !dragging.start || dragging.start(dragArgs);
            if (!res)
                dragging = null;
            return res;
        }
        function dragMove(ev) {
            if (dragging) {
                var args = createDragArgs(ev);
                var screenHeight = $scaler.height();
                var screenWidth = $scaler.width();
                var pageWidth = screenWidth / 2;
                var pageHeight = screenHeight;
                var corner = getCornerType(args.$target);
                initCorner(corner);
                var cm = getCornerMatrix(corner);
                touchPointA = cm.transformVector(args.rel);
                var delta = 1;
                refresh(touchPointA, null);
                $handle.css({
                    top: args.rel.y + 'px',
                    left: args.rel.x + 'px',
                });
            }
        }
        function finalize() {
        }
        function dragEnd(ev) {
            finalize();
            if (dragging) {
                if (dragging.stop)
                    dragging.stop(createDragArgs(ev));
                dragging = null;
                restoreCss(cssBackup);
            }
        }
        function dragCancel(ev) {
            finalize();
            if (dragging) {
                dragging.cancel(createDragArgs(ev));
                dragging = null;
                restoreCss(cssBackup);
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
                $handle = $evtarget;
                $target = $handle.closest('.corner');
                $target = $target || $handle;
            }
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
                finalize();
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
    var stage = 0;
    function setStage(corner, frame) {
        touchCorner = corner;
        stage = frame;
        stage = Math.min(1, stage);
        stage = Math.max(0, stage);
    }
    function getPointAFromStage(stage) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();
        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;
        var angle = 45 + 45 * stage; //symmetry line angle changes from 45 to 90.
        angle = angle * Math.PI / 180;
        var x = easeInOutCubic(stage, 0, 1, 1);
        var fx = x * pageWidth;
        var fy = 0;
        var foldA = new Vector2D(fx, fy);
        var dpl = fx * Math.cos(angle);
        var dpx = dpl * Math.cos(angle);
        var dpy = dpl * Math.sin(angle);
        var pointM = new Vector2D(fx - dpx, dpy);
        return pointM.mul(2);
    }
    function getFoldB(pointA, pointB, pointC) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();
        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;
        var ba = pointB.sub(pointA);
        var kx = -pointA.x / ba.x;
        if (kx >= 0 && kx <= 1) {
            return ba.mul(kx).add(pointA);
        }
        var cb = pointC.sub(pointB);
        var ky = (pageHeight - pointB.y) / cb.y;
        return cb.mul(ky).add(pointB);
    }
    function calculateFoldByCorner(pointA) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();
        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;
        var pointM = pointA.mul(0.5);
        var symmetryLine = pointM.rotateClockwise90(); // starts at pointM and goes to both directions
        var ka = -pointM.y / symmetryLine.y;
        var foldA = pointM.add(symmetryLine.mul(ka));
        var pointB = foldA.sub(pointA).rotateClockwise90().changeLength(pageHeight).add(pointA);
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
    function calculateFold(stage) {
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
    function getGlobalFold(fold) {
        function toGlobal(vector) {
            return localToGlobalMatrix.transformVector(vector);
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
    function setupImage($img, matrix, clipA, clipB, clipC) {
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
        var pageXAxis = globalFold.pointD.sub(globalFold.pointA).normalize();
        var pageYAxis = globalFold.pointB.sub(globalFold.pointA).normalize();
        var pageMatrix = new Matrix2D([pageXAxis.x, pageXAxis.y, 0, pageYAxis.x, pageYAxis.y, 0, 0, 0, 1]).translate(globalFold.pointA);
        return localToTextureMatrix.multiply(pageMatrix);
    }
    function refresh(pointA, corner) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();
        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;
        var localFold = calculateFold(stage);
        var globalFold = getGlobalFold(localFold);
        dumpFold(globalFold);
        var frontPageMatrix = getPageMatrix(globalFold);
        var $frontPage = getFrontPage(touchCorner);
        var $backPage = getBackPage(touchCorner);
        var clipperMatrix = getOuterClipMatrix(globalFold.foldA, globalFold.pointA, globalFold.foldB, pageWidth, pageHeight);
        setupPage($frontPage, frontPageMatrix, clipperMatrix);
        var clipper2Matrix = getOuterClipMatrix(globalFold.foldA, globalFold.pointE, globalFold.foldB, pageWidth, pageHeight);
        var spine = new Vector2D(pageWidth, 0);
        spine = textureToLocalMatrix.transformVector(spine);
        spine = localToGlobalMatrix.transformVector(spine);
        console.log(spine.toString());
        var page4Matrix = new Matrix2D().translate(spine);
        setupPage($backPage, page4Matrix, clipper2Matrix);
    }
    function cleanPages() {
        return $container.find('li').removeClass('page1 page2 page3 page4');
    }
    function clean() {
        $container.removeClass('active').find('li').css('transform', '').find('img').css('transform', '');
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
        return $node;
    }
    function animate(corner, delta) {
        touchCorner = corner;
        clean();
        var frame = 0;
        var step = 4;
        function draw() {
            requestAnimationFrame(function () {
                if (frame > 100) {
                    cleanPages();
                    clean();
                    shiftCurrent(delta);
                    preloadImages();
                    return;
                }
                setStage(corner, frame / 100);
                frame += step;
                refresh();
                draw();
            });
        }
        draw();
    }
    function preloadImages() {
        preloadNextImages();
        preloadPrevImages();
    }
    var preloaders = {};
    function preloadImage($img) {
        if (!$img.length)
            return;
        var src = $img[0].src;
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
            var src = $img.attr('src');
            preloadImage($img);
        }
    }
    function animateFlipForward() {
        initCorner('br');
        var $newBase = $container.find('li.current').next('li').next('li');
        if ($newBase.length) {
            animate('right', 2);
        }
    }
    function animateFlipBackward() {
        initCorner('bl');
        var $newBase = $container.find('li.current').prev('li').prev('li');
        if ($newBase.length) {
            animate('left', -2);
        }
    }
    function animateForward() {
        shiftCurrent(1);
    }
    function animateBackward() {
        shiftCurrent(-1);
    }
    shiftCurrent(2);
    refresh();
    preloadImages();
    $('body').on('click', '.page-turn .nav-next-2', function () {
        animateFlipForward();
    }).on('click', '.page-turn .nav-prev-2', function () {
        animateFlipBackward();
    }).on('click', '.page-turn .nav-next', function () {
        animateForward();
    }).on('click', '.page-turn .nav-prev', function () {
        animateBackward();
    });
});

//# sourceMappingURL=flipper.js.map
