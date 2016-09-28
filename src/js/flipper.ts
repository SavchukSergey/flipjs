///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />
///<reference path="fold.ts" />
///<reference path="jquery.d.ts" />
///<reference path="flipper.d.ts" />

$.fn.pageTurn = function () {

    function init($container: IJQueryNodes): IFlipperControl {
        var $scaler = $container.find('.scaler');
        var $pages = $container.find('.pages');

        /** Front side of page being folded */
        var $frontPage: IJQueryNodes;
        var $frontPageImg: IJQueryNodes;

        /** Back side of page being folded */
        var $backPage: IJQueryNodes;
        var $backPageImg: IJQueryNodes;

        var touchPointA: Vector2D;
        var touchCorner = '';
        var touchDelta = 0;

        var animationSemaphore = false;

        var globalToLocalMatrix: Matrix2D;
        var localToGlobalMatrix: Matrix2D;
        var localToTextureMatrix: Matrix2D;
        var textureToLocalMatrix: Matrix2D;

        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();
        var pageHeight = screenHeight;
        var pageWidth = screenWidth / 2;

        function buildPreview() {
            var $preview = $container.find('div.preview');
            if (!$preview.length) {
                $preview = $('<div class="preview"><ol></ol></div>');
                $container.append($preview);
            }
            var $ol = $preview.find('ol');
            $ol.empty();
            var page = 0;
            $pages.find('li').each((index, node) => {
                var $node = $(node);
                if (!$node.hasClass('empty')) {
                    page++;
                }
                var $originalImg = $node.find('img');
                var url = $originalImg.attr('data-preview-src') || $originalImg.attr('src');
                var $img = $('<img />').attr('src', url); 
                var $li = $('<li></li>');
                var $a = $('<a></a>').attr('href', `#magazine:${page}`).append($img);
                $li.append($a);
                $ol.append($li);
            });
        }

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
        function getLocalToTextureMatrix(corner: string): Matrix2D {
            var m = new Matrix2D();
            switch (corner) {
                case 'br':
                    return m.scale(-1, -1).translate(new Vector2D(pageWidth, pageHeight));
                case 'tr':
                    return m.scale(-1, 1).translate(new Vector2D(pageWidth, 0));
                case 'bl':
                    return m.scale(1, -1).translate(new Vector2D(0, pageHeight));
                case 'tl':
                    return m.scale(1, 1).translate(new Vector2D(0, 0));
            }
        }

        /**
         * Get back side of page being fold
         */
        function getBackPage(corner: string): IJQueryNodes {
            switch (corner) {
                case 'br':
                case 'tr':
                    return $pages.find('.page3');
                case 'bl':
                case 'tl':
                    return $pages.find('.page2');
            }
        }

        /**
         * Get front side of page being fold
         */
        function getFrontPage(corner: string): IJQueryNodes {
            switch (corner) {
                case 'br':
                case 'tr':
                    return $pages.find('.page2');
                case 'bl':
                case 'tl':
                    return $pages.find('.page3');
            }
        }

        function initCorner(corner: string) {
            screenHeight = $scaler.height();
            screenWidth = $scaler.width();
            pageHeight = screenHeight;
            pageWidth = screenWidth / 2;

            var $pageA = $pages.find('li.page-a');
            var $pageB = $pages.find('li.page-b');
            switch (corner) {
                case 'tr':
                case 'br':
                    if ($pageB.next('li:not(.empty)').length) {
                        cleanPages();
                        $pageA.addClass('page1');
                        $pageB.addClass('page2').next('li').addClass('page3').next('li').addClass('page4');
                    }
                    break;
                case 'tl':
                case 'bl':
                    if ($pageA.prev('li:not(.empty)').length) {
                        cleanPages();
                        $pageA.next('li').addClass('page4').prev('li').addClass('page3').prev('li').addClass('page2').prev('li').addClass('page1');
                    }
                    break;
            }

            $frontPage = getFrontPage(corner);
            $backPage = getBackPage(corner);

            $frontPageImg = $frontPage.find('img');
            $backPageImg = $backPage.find('img');

            touchCorner = corner;
            touchDelta = getCornerShift(corner);

            globalToLocalMatrix = getCornerMatrix(corner);
            localToGlobalMatrix = globalToLocalMatrix.reverse();

            localToTextureMatrix = getLocalToTextureMatrix(corner);
            textureToLocalMatrix = localToTextureMatrix.reverse();

            $container.toggleClass('active', !!touchDelta).toggleClass('active-next', touchDelta > 0).toggleClass('active-prev', touchDelta < 0);

        }

        /**
         * Check pointA to spine distance. We dont want page to be torn...
         */
        function fixPointA(pointA: Vector2D): Vector2D {
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
                    var touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
                    return new Vector2D(touch.clientX, touch.clientY);
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
                var args = createDragArgs(ev);
                var corner = getCornerType(args.$handle);
                initCorner(corner);

                dragging = {};
                draggingPreview = null;
                return true;
            }

            function dragMove(ev: IJQueryEvent) {
                if (dragging) {
                    dragFold(ev);
                }
            }

            function dragFold(ev: IJQueryEvent) {
                var args = createDragArgs(ev);
                touchPointA = globalToLocalMatrix.transformVector(args.rel);
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

            $('html, body').on('mousedown touchstart', '.page-turn .corner', (ev: IJQueryEvent) => {
                var $evtarget = $(ev.target);
                if (state === 'init') {
                    mouseDownStart = getMousePosition(ev);
                    ev.preventDefault();
                    ev.stopPropagation();
                    state = 'threshold';
                    $handle = $evtarget.closest('.corner');
                }
            }).on('mousemove touchmove', '.page-turn .corner', (ev: IJQueryEvent) => {
                if (dragging) return;
                draggingPreview = {};
                $handle = $(ev.target).closest('.corner');
                var args = createDragArgs(ev);
                var corner = getCornerType(args.$handle);
                initCorner(corner);
                dragFold(ev);
            }).on('mouseout touchend', '.page-turn .corner', (ev: IJQueryEvent) => {
                if (!draggingPreview) return;
                draggingPreview = null;
                dragAnimate(new Vector2D(0, 0));
            }).bind('mousemove touchmove', (ev: IJQueryEvent) => {
                return dragCheck(ev, true);
            }).bind('mousewheel', function (ev) {
                return dragCheck(ev, false);
            }).bind('mouseup touchend', (ev: IJQueryEvent) => {
                if (state === 'drag') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    dragEnd(ev);
                } else if (state === 'threshold') {
                    animateArrow(getCornerType($handle));
                }
                state = 'init';
            }).bind('keydown', (ev: IJQueryEvent) => {
                if (!dragging) return;

                if (ev.keyCode === 27) {      //escape
                    dragCancel(ev);
                }
            });

        })();

        /**
         * Get touch point vector during auto-animation. Fold point x and Fold angle is animated.
         * @param stage Number from 0 to 1.
         */
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

        function getOuterClipMatrix(pointO: Vector2D, pointU: Vector2D, pointV: Vector2D): Matrix2D {
            var clipX = pointU.sub(pointO).mul(1 / pageWidth);
            var clipY = pointV.sub(pointO).mul(1 / pageHeight);
            return new Matrix2D([clipX.x, clipX.y, 0, clipY.x, clipY.y, 0, 0, 0, 1]).translate(pointO);
        }

        /**
         * Get trapezoid clipper matrix.
         */
        function getTrapezoidClipperMatrix(pointO: Vector2D, pointU: Vector2D, pointV: Vector2D, pointW: Vector2D): Matrix2D {
            var axisX = pointU.sub(pointO);
            var axisY = pointV.sub(pointO);
            var dirX = axisX.normalize();
            var dirY = axisY.normalize();
            var axisMatrix = new Matrix2D([dirX.x, dirX.y, 0, dirY.x, dirY.y, 0, 0, 0, 1]);

            //make sure pointW is included into the matrix
            var matrix = axisMatrix.translate(pointO);
            var reverse = matrix.reverse();
            var checkPoint = reverse.transformVector(pointW);

            var kx = checkPoint.x / axisX.length();
            var ky = checkPoint.y / axisY.length();
            var k = Math.max(kx, ky, 1);
            return axisMatrix.scale(k, k).translate(pointO);
        }

        /**
         * Setups page using page martix and clipper matrix
         * @param pageMatrix Page matrix in corner local coordinate system
         * @param clipperMatrix Clipper matrix in corner local coordinate system
         */
        function setupPage($page: IJQueryNodes, $img: IJQueryNodes, pageMatrix: Matrix2D, clipperMatrix: Matrix2D) {
            pageMatrix = pageMatrix.multiply(localToGlobalMatrix);
            clipperMatrix = clipperMatrix.multiply(localToGlobalMatrix);

            $page.css({
                transform: clipperMatrix.getTransformExpression()
            })

            pageMatrix = pageMatrix.multiply(clipperMatrix.reverse()); //compensate clipper matrix

            $img.css({
                transform: pageMatrix.getTransformExpression()
            })
        }

        function getPageMatrix(fold: IFold) {
            var pageXAxis = fold.pointA.sub(fold.pointD).normalize();
            var pageYAxis = fold.pointC.sub(fold.pointD).normalize();
            var pageMatrix = new Matrix2D([pageXAxis.x, pageXAxis.y, 0, pageYAxis.x, pageYAxis.y, 0, 0, 0, 1]).translate(fold.pointD);

            return textureToLocalMatrix.multiply(pageMatrix);
        }

        function setupBackPage(localFold: IFold) {
            var pageMatrix = getPageMatrix(localFold);

            var clipperMatrix: Matrix2D;
            if (localFold.foldA.x > localFold.foldB.x) { //triangle or trapezoid?
                clipperMatrix = getOuterClipMatrix(localFold.foldA, localFold.pointA, localFold.foldB);
            } else {
                clipperMatrix = getOuterClipMatrix(localFold.foldB, localFold.pointB, localFold.foldA);
            }

            setupPage($backPage, $backPageImg, pageMatrix, clipperMatrix);
        }

        function setupFrontPage(localFold: IFold) {
            var shift = textureToLocalMatrix.transformVector(new Vector2D(0, 0));
            shift = localToGlobalMatrix.transformVector(shift);
            var pageMatrix = new Matrix2D().translate(shift).multiply(globalToLocalMatrix);

            var spineA = new Vector2D(pageWidth, 0).mul(2); //Scale it by any number >1 to avoid zero axis length
            var spineB = new Vector2D(pageWidth, pageHeight).mul(2); //Scale it by any number >1 to avoid zero axis length
            var clipperMatrix: Matrix2D;
            if (localFold.foldA.x > localFold.foldB.x) { //triangle or trapezoid?
                clipperMatrix = getTrapezoidClipperMatrix(localFold.foldA, spineA, localFold.foldB, spineB);
            } else {
                clipperMatrix = getTrapezoidClipperMatrix(localFold.foldB, spineB, localFold.foldA, spineA);
            }

            setupPage($frontPage, $frontPageImg, pageMatrix, clipperMatrix);
        }

        function refresh(pointA: Vector2D) {
            var localFold = calculateFold();

            setupBackPage(localFold);
            setupFrontPage(localFold);

            // dumpFold(localFold);
        }

        function cleanPages() {
            return $pages.find('li').removeClass('page1 page2 page3 page4')
        }

        function clean() {
            $container.removeClass('active');
            $pages.find('li').css('transform', '').find('img').css('transform', '');
        }

        function refreshState() {
            var $pageA = $pages.children('li.page-a');
            var $pageB = $pages.children('li.page-b');
            var $prev = $pageA.prev('li');
            var $next = $pageB.next('li');
            $container.toggleClass('can-prev-2', !!$prev.length && !$prev.hasClass('empty'));
            $container.toggleClass('can-next-2', !!$next.length && !$next.hasClass('empty'));

            var twoSides = !!$pageA.length && !!$pageB.length && !$pageA.hasClass('empty') && !$pageB.hasClass('empty');
            $container.toggleClass('two-sides', twoSides)

            preloadImages();
        }

        function getPageNumber(): number {
            var $items = $pages.find('li:not(.empty)');
            var oneSideLeft = $container.hasClass('one-side-left');
            for (var n = 0; n < $items.length; n++) {
                var $page = $($items[n]);
                if ($page.hasClass('page-a')) {
                    return n + (oneSideLeft ? 1 : 2);
                } else if ($page.hasClass('page-b')) {
                    return n + 1;
                }
            }
        }

        function shiftCurrent(delta: number) {
            var pn = getPageNumber();
            navigate(pn + delta);
        }

        function animate(callback: { (stage: number) }) {
            var promise = $.Deferred();
            if (animationSemaphore) {
                promise.reject();
                return promise;
            }

            animationSemaphore = true;

            $container.addClass('animating');
            var frame = 0;
            var step = 4;

            callback(0);

            function draw() {
                requestAnimationFrame(() => {
                    frame += step;
                    frame = Math.min(frame, 100);
                    var x = easeInOutCubic(frame / 100, 0, 1, 1);
                    callback(x)
                    if (frame < 100) {
                        draw();
                    } else {
                        animationSemaphore = false;
                        $container.removeClass('animating');
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
            var $current = $pages.find('li.page-a');
            for (var i = 0; i < 3; i++) {
                $current = $current.next('li');
                var $img = $current.find('img');
                preloadImage($img);
            }
        }

        function preloadPrevImages() {
            var $current = $pages.find('li.page-a');
            for (var i = 0; i < 3; i++) {
                $current = $current.prev('li');
                var $img = $current.find('img');
                preloadImage($img);
            }
        }

        function animateFlipForward() {
            var $newBase = $pages.children('li.page-b').next('li');
            if ($newBase.length) {
                animateArrow('br');
            }
        }

        function animateFlipBackward() {
            var $newBase = $pages.children('li.page-a').prev('li');
            if ($newBase.length) {
                animateArrow('bl');
            }
        }

        function getMaxPage() {
            return $pages.children('li:not(.empty)').length;
        }

        function navigate(pageNumber: number) {
            var $items = $pages.children('li');
            pageNumber = Math.min(Math.max(1, pageNumber), getMaxPage());
            var page = 0;
            for (var i = 0; i < $items.length; i++) {
                var $page = $($items[i]);
                if (!$page.hasClass('empty')) {
                    page++;
                }
                var pageA = (page % 2 == 0) && (page == pageNumber || (page + 1) == pageNumber);
                var pageB = (page % 2 == 1) && ((page - 1) == pageNumber || page == pageNumber);
                $page.toggleClass('page-a', pageA);
                $page.toggleClass('page-b', pageB);
            }
            var left = pageNumber % 2 == 0;
            $container.toggleClass('one-side-left', left);
            $container.toggleClass('one-side-right', !left);
            refreshState();
            $container.trigger('page-change', [getPageNumber()]);
        }

        function close() {
            window.location.hash = '#';
        }

        refreshState();

        buildPreview();

        return {
            animateFlipBackward: animateFlipBackward,
            animateFlipForward: animateFlipForward,
            shiftCurrent: shiftCurrent,
            navigate: navigate,
            close: close
        }
    }

    var data = this.data('page-turn');
    if (data) return data;
    data = init(this);
    this.data('page-turn', data);
    return data;
};

$(document).ready(function () {
    var data = $('.page-turn').pageTurn();
    $('body').on('click', '.page-turn .nav-next-2', () => {
        data.animateFlipForward();
    }).on('click', '.page-turn .nav-prev-2', () => {
        data.animateFlipBackward();
    }).on('click', '.page-turn .nav-next', () => {
        data.shiftCurrent(1);
    }).on('click', '.page-turn .nav-prev', () => {
        data.shiftCurrent(-1);
    }).on('click', '.page-turn .bg, .page-turn .empty', () => {
        data.close();
    });
});

