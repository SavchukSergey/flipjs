///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />
///<reference path="fold.ts" />

declare var $:any;

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

    function calculateFold(stage: number): IFold {
        var screenHeight: number = $scaler.height();
        var screenWidth: number = $scaler.width();

        var pageWidth = screenWidth / 2;
        var pageHeight = screenHeight;

        var angle = 45 + 45 * stage; //symmetry line angle changes from 45 to 90.
        angle = angle * Math.PI / 180;

        var fx = stage * pageWidth;
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

    function getGlobalFold(fold: IFold) : IFold {
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

    function getOuterClipMatrix(pointO: IVector2D, pointU: IVector2D, pointV: IVector2D, originalWidth: number, originalHeight: number) : IMatrix2D {
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
        var $slider = $('.page-turn .scaler');

        var screenHeight: number = $slider.height();
        var screenWidth: number = $slider.width();

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
        var $node = $current;
        while (delta) {
            if (delta > 0) {
                $node = $node.next('li');
                delta--;
            } else if (delta < 0) {
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

    function animate(corner: string, delta: number) {
        touchCorner = corner;

        clean();
        $container.addClass('active').toggleClass('active-next', delta > 0).toggleClass('active-prev', delta < 0);

        var frame = 100;
        var step = 4;

        function draw() {
            requestAnimationFrame(function () {
                if (frame >= 0) {
                    frame -= step;
                    setStage(corner, frame);
                    draw();
                } else {
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