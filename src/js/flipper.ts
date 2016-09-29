///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />
///<reference path="fold.ts" />
///<reference path="jquery.d.ts" />
///<reference path="flipper.d.ts" />
///<reference path="draggable.ts" />
///<reference path="draggable-zoom.ts" />
///<reference path="draggable-fold.ts" />
///<reference path="corner.ts" />

$.fn.pageTurn = function () {

    var DraggableZoom = FlipJs.DraggableZoom;
    var DraggableFold = FlipJs.DraggableFold;

    function init($container: IJQueryNodes): IFlipperControl {
        var $scaler = $container.find('.scaler');
        var $pages = $container.find('.pages');
        var $zoomNode = $container.find('.page-turn-magnifier');
        var $toolbarPage = $container.find('.page-turn-toolbar input');
        
        var corner: FlipJs.Corner;

        /** Front side of page being folded */
        var $frontPage: IJQueryNodes;
        var $frontPageImg: IJQueryNodes;

        /** Back side of page being folded */
        var $backPage: IJQueryNodes;
        var $backPageImg: IJQueryNodes;

        var touchCorner = '';

        var zoomK = 2;
        var zoomShift = new Vector2D(0, 0);

        var animationSemaphore = false;

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

        function initCorner(cornerType: string) {
            corner = new FlipJs.Corner($container, cornerType);
            screenHeight = $scaler.height();
            screenWidth = $scaler.width();
            pageHeight = screenHeight;
            pageWidth = screenWidth / 2;

            var $pageA = $pages.find('li.page-a');
            var $pageB = $pages.find('li.page-b');
            switch (cornerType) {
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

            $frontPage = getFrontPage(cornerType);
            $backPage = getBackPage(cornerType);

            $frontPageImg = $frontPage.find('img');
            $backPageImg = $backPage.find('img');

            touchCorner = cornerType;
            var touchDelta = corner.pagesDelta;

            $container.toggleClass('active', !!touchDelta).toggleClass('active-next', touchDelta > 0).toggleClass('active-prev', touchDelta < 0);

        }


        /**
         * Easing function
         * @param t Time from 0 to 1
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

            function createDragArgs(ev: IJQueryEvent): IDragArgs {
                var pos = getMousePosition(ev);
                var rect = $scaler[0].getBoundingClientRect();
                var start = new Vector2D(rect.left, rect.top);
                return {
                    rel: pos.sub(start),
                    vector: pos.sub(mouseDownStart),
                    $handle: $handle,
                    event: ev
                };
            }

            function dragStart(ev: IJQueryEvent) {
                var args = createDragArgs(ev);

                dragging = {
                    zoom: zoom(),
                };

                if (dragging.zoom) {

                } else {
                    dragStartFold(args);
                }

                draggingPreview = null;
                return true;
            }

            function dragStartFold(args: IDragArgs) {
                var corner = getCornerType(args.$handle);
                initCorner(corner);
            }

            function dragMove(ev: IJQueryEvent) {
                if (dragging) {
                    var args = createDragArgs(ev);
                    if (dragging.zoom) {
                        dragMoveZoom(args);
                    } else {
                        dragMoveFold(args);
                    }
                }
            }

            function dragMoveZoom(args: IDragArgs) {
                var m = new Matrix2D().scale(1.5, 1.5).translate(zoomShift).translate(args.vector);
                $zoomNode.css('transform', m.getTransformExpression());
            }

            function dragMoveFold(args: IDragArgs) {
                corner.setGlobalPointA(args.rel);
                refresh();
            }

            function dragAnimate(target: Vector2D) {
                var start = corner.getPoint();
                var delta = target.sub(start);
                return animate((stage: number) => {
                    var vector = delta.mul(stage).add(start);
                    corner.setLocalPointA(vector);
                    refresh();
                }).done(() => {
                    cleanPages();
                    clean();
                });
            }

            function dragEnd(ev: IJQueryEvent) {
                if (dragging) {
                    if (dragging.zoom) {
                        dragEndZoom(ev);
                    } else {
                        dragEndFold(ev);
                    }
                    dragging = null;
                }
            }

            function dragEndZoom(ev: IJQueryEvent) {
                var args = createDragArgs(ev);
                zoomShift = zoomShift.add(args.vector);
            }

            function dragEndFold(ev: IJQueryEvent) {
                var touchPointA = corner.getPoint();
                if (touchPointA.x > pageWidth) {
                    dragAnimate(new Vector2D(screenWidth, 0)).done(() => {
                        shiftCurrent(corner.pagesDelta);
                    });
                } else {
                    dragCancel(ev);
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
                if (dragging || zoom()) return;
                draggingPreview = {};
                mouseDownStart = new Vector2D(-100, -100);
                $handle = $(ev.target).closest('.corner');
                var args = createDragArgs(ev);
                var corner = getCornerType(args.$handle);
                initCorner(corner);
                dragMoveFold(args);
            }).on('mouseout touchend', '.page-turn .corner', (ev: IJQueryEvent) => {
                if (!draggingPreview) return;
                draggingPreview = null;
                dragAnimate(new Vector2D(0, 0));
            }).on('mousedown touchstart', '.page-turn.zoom-in .page-turn-magnifier', (ev: IJQueryEvent) => {
                var $evtarget = $(ev.target);
                if (state === 'init') {
                    mouseDownStart = getMousePosition(ev);
                    ev.preventDefault();
                    ev.stopPropagation();
                    state = 'threshold';
                    $handle = $evtarget.closest('.page-turn');
                }
            }).bind('mousemove touchmove', (ev: IJQueryEvent) => {
                return dragCheck(ev, true);
            }).bind('mousewheel', function (ev: IJQueryEvent) {
                return dragCheck(ev, false);
            }).bind('mouseup touchend', (ev: IJQueryEvent) => {
                if (state === 'drag') {
                    ev.preventDefault();
                    ev.stopPropagation();
                    dragEnd(ev);
                } else if (state === 'threshold') {
                    $handle = $(ev.target).closest('.corner');
                    if ($handle.length) {
                        animateArrow(getCornerType($handle));
                    }
                }
                state = 'init';
            }).bind('click', '.page-turn .corner', (ev: IJQueryEvent) => {
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

        function dumpFold(localFold: IFold) {
            function debugPoint($point: IJQueryNodes, vector: Vector2D) {
                vector = corner.localToGlobal(vector);
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
            pageMatrix = pageMatrix.multiply(corner.localToGlobalMatrix);
            clipperMatrix = clipperMatrix.multiply(corner.localToGlobalMatrix);

            $page.css('transform', clipperMatrix.getTransformExpression());

            pageMatrix = pageMatrix.multiply(clipperMatrix.reverse()); //compensate clipper matrix

            $img.css('transform', pageMatrix.getTransformExpression());
        }

        function getPageMatrix(fold: IFold) {
            var pageXAxis = fold.pointA.sub(fold.pointD).normalize();
            var pageYAxis = fold.pointC.sub(fold.pointD).normalize();
            var pageMatrix = new Matrix2D([pageXAxis.x, pageXAxis.y, 0, pageYAxis.x, pageYAxis.y, 0, 0, 0, 1]).translate(fold.pointD);

            return corner.textureToLocalMatrix.multiply(pageMatrix);
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
            var shift = corner.textureToGlobal(new Vector2D(0, 0));
            var pageMatrix = new Matrix2D().translate(shift).multiply(corner.globalToLocalMatrix);

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

        function refresh() {
            var localFold = corner.calculateFold();

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

            var pageNum = getPageNumber();
            $toolbarPage.val(pageNum.toString());
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

        function animateArrow(cornerType: string) {
            initCorner(cornerType);
            animate(stage => {
                var pointA = getPointAFromStage(stage);
                corner.setLocalPointA(pointA);
                refresh();
            }).done(() => {
                cleanPages();
                clean();
                shiftCurrent(corner.pagesDelta);
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
            var $current = $pages.children('li.page-a');
            for (var i = 0; i < 3; i++) {
                $current = $current.next('li');
                var $img = $current.find('img');
                preloadImage($img);
            }
        }

        function preloadPrevImages() {
            var $current = $pages.children('li.page-a');
            for (var i = 0; i < 3; i++) {
                $current = $current.prev('li');
                var $img = $current.find('img');
                preloadImage($img);
            }
        }

        function animateFlipForward() {
            var $newBase = $pages.children('li.page-b').next('li');
            if ($newBase.length) {
                if (!zoom()) {
                    animateArrow('br');
                } else {
                    shiftCurrent(2);
                }
            }
        }

        function animateFlipBackward() {
            var $newBase = $pages.children('li.page-a').prev('li');
            if ($newBase.length) {
                if (!zoom()) {
                    animateArrow('bl');
                } else {
                    shiftCurrent(-2);
                }
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

        function zoom() {
            return $container.hasClass('zoom-in');
        }

        function zoomIn() {
            $container.addClass('zoom-in');
            zoomShift = new Vector2D(0, 0);
            var m = new Matrix2D().scale(zoomK, zoomK);
            $zoomNode.css('transform', m.getTransformExpression());
        }

        function zoomOut() {
            $container.removeClass('zoom-in');
            var m = new Matrix2D();
            $zoomNode.css('transform', m.getTransformExpression());
        }

        function toggleZoom() {
            if (zoom()) {
                zoomOut();
            } else {
                zoomIn();
            }
        }

        refreshState();

        buildPreview();

        return {
            animateFlipBackward: animateFlipBackward,
            animateFlipForward: animateFlipForward,
            shiftCurrent: shiftCurrent,
            navigate: navigate,
            close: close,
            zoomIn: zoomIn,
            zoomOut: zoomOut,
            toggleZoom: toggleZoom
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
    $('body').on('dblclick', '.page-turn .page-turn-magnifier', () => {
        data.toggleZoom();
    }).on('click', '.page-turn .go-next-2', () => {
        data.animateFlipForward();
    }).on('click', '.page-turn .go-prev-2', () => {
        data.animateFlipBackward();
    }).on('click', '.page-turn .go-next', () => {
        data.shiftCurrent(1);
    }).on('click', '.page-turn .go-prev', () => {
        data.shiftCurrent(-1);
    }).on('change', '.page-turn .go-page', (ev) => {
        var $input = $(ev.target).closest('input');
        data.navigate(parseInt($input.val(), 10));
    }).on('click', '.page-turn .bg, .page-turn .empty', () => {
        data.close();
    });
});

