///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />
///<reference path="fold.ts" />
///<reference path="jquery.d.ts" />

$(document).ready(function () {

    var $container = $('.page-turn');
    var $scaler = $container.find('.scaler');

    var touchPointA: Vector2D;
    var touchCorner = '';
    var touchDelta = 0;

    var globalToLocalMatrix: Matrix2D;
    var localToGlobalMatrix: Matrix2D;
    var localToTextureMatrix: Matrix2D;
    var textureToLocalMatrix: Matrix2D;

    var screenHeight = $scaler.height();
    var screenWidth = $scaler.width();
    var pageHeight = screenHeight;
    var pageWidth = screenWidth / 2;

    /**
     * Get corner type by jquery node
     */
    function getCornerType($corner: IJQueryNodes): string {
        if ($corner.hasClass('corner-br')) {
            return 'br';
        } else if ($corner.hasClass('corner-bl')) {
            return 'bl';
        } else if ($corner.hasClass('corner-tr')) {
            return 'tr';
        } else if ($corner.hasClass('corner-tl')) {
            return 'tl';
        } else {
            return '';
        }
    }

    /**
     * Get global to corner local coordinate system transformation matrix
     */
    function getCornerMatrix(corner: string): Matrix2D {
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

    function getCornerShift(corner: string): number {
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
    function getTextureMatrix(corner: string): Matrix2D {
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

    function getFrontPage(corner: string): IJQueryNodes {
        switch (corner) {
            case 'br':
            case 'tr':
                return $container.find('.page3');
            case 'bl':
            case 'tl':
                return $container.find('.page2');
        }
    }

    function getBackPage(corner: string): IJQueryNodes {
        switch (corner) {
            case 'br':
            case 'tr':
                return $container.find('.page4');
            case 'bl':
            case 'tl':
                return $container.find('.page1');
        }
    }

    function initCorner(corner: string) {
        screenHeight = $scaler.height();
        screenWidth = $scaler.width();
        pageHeight = screenHeight;
        pageWidth = screenWidth / 2;

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
    function fixPointA(pointA: Vector2D): Vector2D {
        var screenWidth = $scaler.width();
        var screenHeight = $scaler.height();

        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;

        if (pointA.length() < 10) pointA = new Vector2D(0, 0);

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
    function easeInOutCubic(t: number, b: number, c: number, d: number): number {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t * t + b;
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
    };

    (function () {
        var mouseDownStart: Vector2D;
        var state = 'init';
        var $handle: IJQueryNodes;

        var dragging = null;
        var draggingPreview = null;

        function getMousePosition(ev: IJQueryEvent): Vector2D {
            if (ev.type.indexOf('touch') >= 0) {
                var touchEvent = <TouchEvent>ev.originalEvent
                var touch = touchEvent.touches[0];
                if (touch) {
                    return new Vector2D(touch.clientX, touch.clientY);
                } else {
                    touch = touchEvent.changedTouches[0];
                    return new Vector2D(touch.clientX, touch.clientY);
                }
            }
            return new Vector2D(ev.clientX, ev.clientY);
        }

        function checkThreshold(a: Vector2D, b: Vector2D): boolean {
            return a.sub(b).length() > 5;
        }

        function createDragArgs(ev: IJQueryEvent) {
            var pos = getMousePosition(ev);
            var rect = $scaler[0].getBoundingClientRect();
            var start = new Vector2D(rect.left, rect.top);
            return {
                rel: pos.sub(start),
                $handle: $handle,
                event: ev
            };
        }

        function dragStart(ev: IJQueryEvent) {
            var dragArgs = createDragArgs(ev);
            dragging = {};
            draggingPreview = null;
            return true;
        }

        function dragMove(ev: IJQueryEvent) {
            if (dragging) {
                dragFold(ev);

                var args = createDragArgs(ev);
                $handle.css({
                    top: ((args.rel.y / screenHeight) * 100) + '%',
                    left: ((args.rel.x / screenWidth) * 100) + '%',
                })
            }
        }

        function dragFold(ev: IJQueryEvent) {
            var args = createDragArgs(ev);
            var corner = getCornerType(args.$handle);
            initCorner(corner);
            var cm = getCornerMatrix(corner);
            touchPointA = cm.transformVector(args.rel);

            refresh(touchPointA);
        }

        function dragAnimate(target: Vector2D) {
            var start = touchPointA;
            var delta = target.sub(start);
            return animate((stage: number) => {
                var vector = delta.mul(stage).add(start);
                touchPointA = vector;
                refresh(vector);
            }).done(() => {
                cleanPages();
                clean();
            });
        }

        function dragEnd(ev: IJQueryEvent) {
            if (dragging) {
                var screenWidth = $scaler.width();
                var pageWidth = screenWidth / 2;
                if (touchPointA.x > pageWidth) {
                    dragAnimate(new Vector2D(screenWidth, 0)).done(() => {
                        shiftCurrent(touchDelta);
                    });
                } else {
                    dragCancel(ev);
                }
                dragging = null;
            }
        }

        function dragCancel(ev: IJQueryEvent) {
            if (dragging) {
                dragAnimate(new Vector2D(0, 0));
                dragging = null;
            }
        }

        function dragCheck(ev: IJQueryEvent, canCancel: boolean): any {
            if (state === 'drag') {
                if (canCancel) {
                    ev.preventDefault();
                    ev.stopPropagation();
                }
                return dragMove(ev);
            } else if (state === 'threshold') {
                var pos = getMousePosition(ev);
                if (checkThreshold(mouseDownStart, pos)) {
                    state = 'drag';
                    var res = dragStart(ev);
                    if (!res) state = 'init';
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
            if (dragging) return;
            draggingPreview = {};
            $handle = $(ev.target).closest('.corner');
            dragFold(ev);
        }).on('mouseout touchend', '.page-turn .corner', function (ev) {
            if (!draggingPreview) return;
            draggingPreview = null;
            dragAnimate(new Vector2D(0, 0));
        }).bind('mousemove touchmove', function (ev) {
            return dragCheck(ev, true);
        }).bind('mousewheel', function (ev) {
            return dragCheck(ev, false);
        }).bind('mouseup touchend', function (ev: IJQueryEvent) {
            if (state === 'drag') {
                ev.preventDefault();
                ev.stopPropagation();
                dragEnd(ev);
            } else if (state === 'threshold') {
                animateArrow(getCornerType($handle));
            }
            state = 'init';
        }).bind('keydown', function (ev) {
            if (!dragging) return;

            if (ev.keyCode === 27) {      //escape
                dragCancel(ev);
            }
        });

    })();

    function getPointAFromStage(stage: number): Vector2D {
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

    function getFoldB(pointA: Vector2D, pointB: Vector2D, pointC: Vector2D) {
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

    function calculateFoldByCorner(pointA: Vector2D): IFold {
        var pointM = pointA.mul(0.5);
        var symmetryLine = pointM.rotateClockwise90(); // starts at pointM and goes to both directions

        var foldA: Vector2D;
        if (symmetryLine.y != 0) {
            var ka = -pointM.y / symmetryLine.y;
            foldA = pointM.add(symmetryLine.mul(ka));
        } else {
            foldA = new Vector2D(pointM.x, 0);
        }

        var pointB: Vector2D;
        if (foldA.x == pointA.x && foldA.y == pointA.y) {
            pointB = pointA.add(new Vector2D(0, pageHeight));
        } else {
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
        }
    }

    function calculateFold(): IFold {
        var pointA = touchPointA;// getPointAFromStage(stage);
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

    function dumpFold(localFold: IFold) {
        function debugPoint($point: IJQueryNodes, vector: Vector2D) {
            vector = localToGlobalMatrix.transformVector(vector);
            $point.css({
                left: (100 * vector.x / screenWidth) + '%',
                top: (100 * vector.y / screenHeight) + '%'
            })
        }

        debugPoint($('.fold-point-A'), localFold.foldA);
        debugPoint($('.fold-point-B'), localFold.foldB);
        debugPoint($('.point-a'), localFold.pointA);
        debugPoint($('.point-b'), localFold.pointB);
        debugPoint($('.point-c'), localFold.pointC);
        debugPoint($('.point-d'), localFold.pointD);
        debugPoint($('.point-e'), localFold.pointE);
    }

    function setHandle(selector: string, x: number, y: number) {
        $container.find(selector).css({
            left: x + '%',
            top: y + '%'
        })
    }

    function setHandles() {
        setHandle('.corner-tl', 0, 0);
        setHandle('.corner-tr', 100, 0);
        setHandle('.corner-bl', 0, 100);
        setHandle('.corner-br', 100, 100);
    }

    function getOuterClipMatrix(pointO: Vector2D, pointU: Vector2D, pointV: Vector2D, originalWidth: number, originalHeight: number): Matrix2D {
        var clipX = pointU.sub(pointO).mul(1 / originalWidth);
        var clipY = pointV.sub(pointO).mul(1 / originalHeight);
        return new Matrix2D([clipX.x, clipX.y, 0, clipY.x, clipY.y, 0, 0, 0, 1]).translate(pointO);
    }

    function setupPage($page, matrix: Matrix2D, clipperMatrix: Matrix2D) {
        $page.css({
            transform: clipperMatrix.getTransformExpression()
        })

        matrix = matrix.multiply(clipperMatrix.reverse());

        $page.find('img').css({
            transform: matrix.getTransformExpression()
        })
    }

    function getPageMatrix(fold: IFold) {
        var pageXAxis = fold.pointD.sub(fold.pointA).normalize();
        var pageYAxis = fold.pointB.sub(fold.pointA).normalize();
        var pageMatrix = new Matrix2D([pageXAxis.x, pageXAxis.y, 0, pageYAxis.x, pageYAxis.y, 0, 0, 0, 1]).translate(fold.pointA);

        return localToTextureMatrix.multiply(pageMatrix);
    }

    function setupFrontPage(localFold: IFold) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();

        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;

        var $frontPage = getFrontPage(touchCorner);

        var frontPageMatrix = getPageMatrix(localFold).multiply(localToGlobalMatrix);

        var clipperMatrix: Matrix2D;
        if (localFold.foldA.x > localFold.foldB.x) { //triangle or trapezoid?
            clipperMatrix = getOuterClipMatrix(localFold.foldA, localFold.pointA, localFold.foldB, pageWidth, pageHeight);
        } else {
            clipperMatrix = getOuterClipMatrix(localFold.foldB, localFold.pointB, localFold.foldA, pageWidth, pageHeight);
        }
        clipperMatrix = clipperMatrix.multiply(localToGlobalMatrix);

        setupPage($frontPage, frontPageMatrix, clipperMatrix);
    }

    function setupBackPage(localFold: IFold) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();

        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;

        var $backPage = getBackPage(touchCorner);

        var spine = new Vector2D(pageWidth, 0);
        spine = textureToLocalMatrix.transformVector(spine);
        spine = localToGlobalMatrix.transformVector(spine);
        var backPageMatrix = new Matrix2D().translate(spine);

        var clipperMatrix: Matrix2D;
        if (localFold.foldA.x > localFold.foldB.x) { //triangle or trapezoid?
            clipperMatrix = getOuterClipMatrix(localFold.foldA, localFold.pointE, localFold.foldB, pageWidth, pageHeight);
        } else {
            clipperMatrix = getOuterClipMatrix(localFold.foldB, new Vector2D(0, pageHeight), localFold.foldA, pageWidth, pageHeight);
        }
        clipperMatrix = clipperMatrix.multiply(localToGlobalMatrix);

        setupPage($backPage, backPageMatrix, clipperMatrix);
    }

    function refresh(pointA: Vector2D) {
        var localFold = calculateFold();

        setupFrontPage(localFold);
        setupBackPage(localFold);

        dumpFold(localFold);

        setHandles();
    }

    function cleanPages() {
        return $container.find('li').removeClass('page1 page2 page3 page4')
    }

    function clean() {
        $container.removeClass('active').find('li').css('transform', '').find('img').css('transform', '');
    }

    function refreshState() {
        var $current = $container.find('li.current');
        $container.toggleClass('can-prev-2', !!$current.prev('li').length);
        $container.toggleClass('can-next-2', !!$current.next('li').length);
    }

    function shiftCurrent(delta: number) {
        var $current = $container.find('li.current');
        var $currentOne = $container.find('li.current-one');

        var $node = $current;
        var $nodeOne = $currentOne;
        while (delta >= 2) {
            $node = $node.next('li').next('li');;
            $nodeOne = $nodeOne.next('li').next('li');;
            delta -= 2;
        }
        while (delta <= -2) {
            $node = $node.prev('li').prev('li');;
            $nodeOne = $nodeOne.prev('li').prev('li');;
            delta += 2;
        }
        while (delta >= 1) {
            if ($node[0] == $nodeOne[0]) {
                $nodeOne = $nodeOne.next('li');
            } else {
                $node = $node.next('li').next('li');
                $nodeOne = $nodeOne.next('li');
            }
            delta--;
        }
        while (delta <= -1) {
            if ($node[0] == $nodeOne[0]) {
                $node = $node.prev('li').prev('li');
                $nodeOne = $nodeOne.prev('li');
            } else {
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

    function animate(callback: { (stage: number) }) {
        var frame = 0;
        var step = 4;

        callback(0);

        var promise = $.Deferred();
        function draw() {
            requestAnimationFrame(() => {
                frame += step;
                frame = Math.min(frame, 100);
                var x = easeInOutCubic(frame / 100, 0, 1, 1);
                callback(x)
                if (frame < 100) {
                    draw();
                } else {
                    promise.resolve();
                }
            });
        }

        draw();

        return promise;
    }

    function animateArrow(corner: string) {
        initCorner(corner);
        animate(stage => {
            var pointA = getPointAFromStage(stage);
            touchPointA = pointA;
            refresh(touchPointA);
        }).done(() => {
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

    function preloadImage($img: IJQueryNodes) {
        if (!$img.length) return;
        var imgNode = <HTMLImageElement>$img[0];
        var src = imgNode.src;
        var img = new Image()
        img.src = src;
        img.onload = function () {
            console.log(src);
        }
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

    $('body').on('click', '.page-turn .nav-next-2', () => {
        animateFlipForward();
    }).on('click', '.page-turn .nav-prev-2', () => {
        animateFlipBackward();
    }).on('click', '.page-turn .nav-next', () => {
        shiftCurrent(1);
    }).on('click', '.page-turn .nav-prev', () => {
        shiftCurrent(-1);
    });

});

