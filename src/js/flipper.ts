///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />
///<reference path="fold.ts" />

declare var $: any;

$(document).ready(function () {

    var $container = $('.page-turn');
    var $scaler = $container.find('.scaler');

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

                var touch = ev.originalEvent.touches[0];
                if (touch) {
                    return {
                        x: touch.clientX,
                        y: touch.clientY
                    };
                } else {
                    touch = ev.originalEvent.changedTouches[0];
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
            }
            return {
                rel: rel,
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
            if (!$target) debugger;
            var target = $target[0];
            if (!target) return null;
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
            dragging = {
            };

            var res = !dragging.start || dragging.start(dragArgs);
            if (!res) dragging = null;
            return res;
        }

        function dragMove(ev) {
            if (dragging) {
                var args = createDragArgs(ev);
                $handle.css({
                    top: args.rel.y + 'px',
                    left: args.rel.x + 'px',
                })
            }
        }

        function finalize() {
        }

        function dragEnd(ev) {
            finalize();
            if (dragging) {
                if (dragging.stop) dragging.stop(createDragArgs(ev));
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
            } else if (state === 'threshold') {
                finalize();
            }
            state = 'init';
        }).bind('keydown', function (ev) {
            if (!dragging) return;

            if (ev.keyCode === 27) {      //escape
                dragCancel(ev);
            }
        });

    })();

    var touchCorner = 'right';
    var stage = 0;

    function setStage(corner, frame) {
        touchCorner = corner;
        stage = frame;

        stage = Math.min(1, stage);
        stage = Math.max(0, stage);
    }

    function easeInOutCubic(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t * t + b;
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
    };

    function calculateFold(stage: number): IFold {
        var screenHeight: number = $scaler.height();
        var screenWidth: number = $scaler.width();

        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;

        var angle = 45 + 45 * stage; //symmetry line angle changes from 45 to 90.
        angle = angle * Math.PI / 180;

        var x = easeInOutCubic(stage, 0, 1, 1);

        var fx = x * pageWidth;
        var fy = 0;

        var foldA: IVector2D = new Vector2D(fx, fy);

        var dpl = fx * Math.cos(angle);
        var dpx = dpl * Math.cos(angle);
        var dpy = dpl * Math.sin(angle);

        var p = new Vector2D(fx - dpx, dpy);

        var pointA = p.mul(2);
        var pointB = foldA.sub(pointA).rotateClockwise90().changeLength(pageHeight).add(pointA);
        var pointC = pointA.sub(pointB).rotateClockwise90().changeLength(pageWidth).add(pointB);
        var pointD = pointB.sub(pointC).rotateClockwise90().changeLength(pageHeight).add(pointC);
        var pointE: IVector2D = new Vector2D(0, 0);

        var foldB = pointB;
        if (foldB.x < 0) {
            var ba = pointA.sub(pointB).changeLength(pageHeight);
            var k = -pointA.x / ba.x;
            ba = ba.mul(k);
            foldB = ba.add(pointA);
        } else {
            var side = pointC.sub(pointB);
            var crossLineY = pageHeight - pointB.y;

            if (side.y != 0) {
                var k = crossLineY / side.y;
                foldB = side.mul(k).add(pointB);
            } else {
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

    function getGlobalFold(fold: IFold): IFold {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();

        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;

        function toGlobal(vector) {
            if (touchCorner == 'right') {
                return new Vector2D(screenWidth - vector.x, screenHeight - vector.y);
            } else if (touchCorner == 'left') {
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

    function dumpFold(globalFold: IFold) {
        var screenHeight = $scaler.height();
        var screenWidth = $scaler.width();

        function debugPoint($point, vector: IVector2D) {
            $point.css({
                left: (100 * vector.x / screenWidth) + '%',
                top: (100 * vector.y / screenHeight) + '%'
            })
        }

        debugPoint($('.fold-point-A'), globalFold.foldA);
        debugPoint($('.fold-point-B'), globalFold.foldB);
        debugPoint($('.point-a'), globalFold.pointA);
        debugPoint($('.point-b'), globalFold.pointB);
        debugPoint($('.point-c'), globalFold.pointC);
        debugPoint($('.point-d'), globalFold.pointD);
        debugPoint($('.point-e'), globalFold.pointE);
    }

    function getOuterClipMatrix(pointO: IVector2D, pointU: IVector2D, pointV: IVector2D, originalWidth: number, originalHeight: number): IMatrix2D {
        var width = pointU.sub(pointO).length();
        var height = pointV.sub(pointO).length();
        var clipX = pointU.sub(pointO).changeLength(width / originalWidth);
        var clipY = pointV.sub(pointO).changeLength(height / originalHeight);
        return new Matrix2D([clipX.x, clipX.y, 0, clipY.x, clipY.y, 0, 0, 0, 1]).translate(pointO);
    }

    function setupPage($page, matrix: IMatrix2D, clipperMatrix: IMatrix2D) {
        $page.css({
            transform: clipperMatrix.getTransformExpression()
        })

        matrix = matrix.multiply(clipperMatrix.reverse());

        $page.find('img').css({
            transform: matrix.getTransformExpression()
        })
    }

    function getPageMatrix(globalFold: IFold) {
        if (touchCorner == 'right') {
            var page3XAxis = globalFold.pointC.sub(globalFold.pointB).normalize();
            var page3YAxis = globalFold.pointA.sub(globalFold.pointB).normalize();
            return new Matrix2D([page3XAxis.x, page3XAxis.y, 0, page3YAxis.x, page3YAxis.y, 0, 0, 0, 1]).translate(globalFold.pointB);
        } else if (touchCorner == 'left') {
            var page3XAxis = globalFold.pointB.sub(globalFold.pointC).normalize();
            var page3YAxis = globalFold.pointD.sub(globalFold.pointC).normalize();
            return new Matrix2D([page3XAxis.x, page3XAxis.y, 0, page3YAxis.x, page3YAxis.y, 0, 0, 0, 1]).translate(globalFold.pointC);
        }
    }

    function refresh() {
        var screenHeight: number = $scaler.height();
        var screenWidth: number = $scaler.width();

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
        } else if (touchCorner == 'left') {
            var page1Matrix = new Matrix2D().translate(new Vector2D(0, 0));

            setupPage($('.page2'), pageMatrix, clipperMatrix);
            setupPage($('.page1'), page1Matrix, clipper2Matrix);
        }
    }

    function cleanPages() {
        return $container.find('li').removeClass('page1 page2 page3 page4')
    }

    function clean() {
        $container.removeClass('active').find('li').css('transform', '').find('img').css('transform', '');
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

        return $node;
    }

    function animate(corner: string, delta: number) {
        touchCorner = corner;

        clean();
        $container.addClass('active').toggleClass('active-next', delta > 0).toggleClass('active-prev', delta < 0);

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
        if (!$img.length) return;
        var src = $img[0].src;
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
            var src = $img.attr('src');
            preloadImage($img);
        }
    }

    function animateFlipForward() {
        var $newBase = $container.find('li.current').next('li').next('li');
        if ($newBase.length) {
            cleanPages();
            $container.find('li.current').addClass('page1').next('li').addClass('page2').next('li').addClass('page3').next('li').addClass('page4');
            animate('right', 2);
        }
    }

    function animateFlipBackward() {
        var $newBase = $container.find('li.current').prev('li').prev('li');
        if ($newBase.length) {
            cleanPages();
            $container.find('li.current').next('li').addClass('page4').prev('li').addClass('page3').prev('li').addClass('page2').prev('li').addClass('page1');
            animate('left', -2);
        }
    }

    function animateForward() {
        shiftCurrent(1);
    }

    function animateBackward() {
        shiftCurrent(-1);
    }

    refresh();
    preloadImages();

    $('body').on('click', '.page-turn .nav-next-2', () => {
        animateFlipForward();
    }).on('click', '.page-turn .nav-prev-2', () => {
        animateFlipBackward();
    }).on('click', '.page-turn .nav-next', () => {
        animateForward();
    }).on('click', '.page-turn .nav-prev', () => {
        animateBackward();
    });

});

