var Matrix2D = (function () {
    function Matrix2D(elements) {
        this.m = elements || [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }
    Matrix2D.prototype.transformVector = function (v) {
        var m = this.m;
        return new Vector2D(v.x * m[0] + v.y * m[3] + m[6], v.x * m[1] + v.y * m[4] + m[7]);
    };
    Matrix2D.prototype.determinant = function () {
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
    };
    Matrix2D.prototype.multiplyArray = function (other) {
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
    };
    Matrix2D.prototype.getElements = function () {
        return this.m.slice(0);
    };
    Matrix2D.prototype.roundFloat = function (v) {
        return Math.round(v * 1e8) / 1e8;
    };
    Matrix2D.prototype.getTransformExpression = function () {
        var self = this;
        var m = self.m;
        return "matrix(" + self.roundFloat(m[0]) + ", " + self.roundFloat(m[1]) + ", " + self.roundFloat(m[3]) + ", " + self.roundFloat(m[4]) + ", " + self.roundFloat(m[6]) + ", " + self.roundFloat(m[7]) + ")";
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
///<reference path="jquery.d.ts" />
///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />
var FlipJs;
(function (FlipJs) {
    var Corner = (function () {
        function Corner($container, cornerType) {
            this.$container = $container;
            var $scaler = $container.find('.scaler');
            this.screenHeight = $scaler.height();
            this.screenWidth = $scaler.width();
            var pageHeight = this.screenHeight;
            var pageWidth = this.screenWidth / 2;
            this.pageHeight = pageHeight;
            this.pageWidth = pageWidth;
            this.globalToLocalMatrix = this.getCornerMatrix(cornerType);
            this.localToGlobalMatrix = this.globalToLocalMatrix.reverse();
            this.localToTextureMatrix = this.getLocalToTextureMatrix(cornerType);
            this.textureToLocalMatrix = this.localToTextureMatrix.reverse();
            this.spinePointA = new Vector2D(pageWidth, 0);
            this.spinePointB = new Vector2D(pageWidth, pageHeight);
            this.pagesDelta = this.getCornerShift(cornerType);
        }
        Corner.prototype.setLocalPointA = function (point) {
            point = this.fixPointA(point);
            this.touchPointA = point;
        };
        Corner.prototype.setGlobalPointA = function (point) {
            this.setLocalPointA(this.globalToLocalMatrix.transformVector(point));
        };
        Corner.prototype.getPoint = function () {
            return this.touchPointA;
        };
        Corner.prototype.localToGlobal = function (vector) {
            return this.localToGlobalMatrix.transformVector(vector);
        };
        Corner.prototype.textureToLocal = function (vector) {
            vector = this.textureToLocalMatrix.transformVector(vector);
            return vector;
        };
        Corner.prototype.textureToGlobal = function (vector) {
            vector = this.textureToLocalMatrix.transformVector(vector);
            vector = this.localToGlobalMatrix.transformVector(vector);
            return vector;
        };
        Corner.prototype.calculateFold = function () {
            var pointA = this.touchPointA;
            var pageWidth = this.pageWidth;
            var pageHeight = this.pageHeight;
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
                foldB: this.getFoldB(pointA, pointB, pointC)
            };
        };
        Corner.prototype.getFoldB = function (pointA, pointB, pointC) {
            var pageHeight = this.pageHeight;
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
        };
        /**
         * Check pointA to spine distance. We dont want page to be torn...
         */
        Corner.prototype.fixPointA = function (pointA) {
            if (pointA.length() < 10)
                pointA = new Vector2D(0, 0);
            var spinePointA = this.spinePointA;
            var spinePointB = this.spinePointB;
            var pageWidth = this.pageWidth;
            var maxDiag = spinePointB.length();
            var diag = pointA.sub(spinePointB);
            if (diag.length() > maxDiag) {
                diag = diag.changeLength(maxDiag);
                pointA = diag.add(spinePointB);
            }
            var dir = pointA.sub(spinePointA);
            if (dir.length() > pageWidth) {
                dir = dir.changeLength(pageWidth);
                pointA = dir.add(spinePointA);
            }
            return pointA;
        };
        /**
         * Get global to corner local coordinate system transformation matrix
         */
        Corner.prototype.getCornerMatrix = function (corner) {
            var screenWidth = this.screenWidth;
            var screenHeight = this.screenHeight;
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
        };
        /**
         * Get local to texture transform matrix
         */
        Corner.prototype.getLocalToTextureMatrix = function (corner) {
            var pageWidth = this.pageWidth;
            var pageHeight = this.pageHeight;
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
        };
        Corner.prototype.getCornerShift = function (corner) {
            switch (corner) {
                case 'br':
                case 'tr':
                    return 2;
                case 'bl':
                case 'tl':
                    return -2;
            }
            return 0;
        };
        return Corner;
    }());
    FlipJs.Corner = Corner;
})(FlipJs || (FlipJs = {}));
///<reference path="vector-2d.ts" />
///<reference path="jquery.d.ts" />
///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />
///<reference path="draggable.ts" />
var FlipJs;
(function (FlipJs) {
    var DraggableFold = (function () {
        function DraggableFold() {
        }
        DraggableFold.prototype.start = function (args) {
        };
        DraggableFold.prototype.move = function (args) {
        };
        DraggableFold.prototype.stop = function (args) {
        };
        DraggableFold.prototype.cancel = function (args) {
        };
        return DraggableFold;
    }());
    FlipJs.DraggableFold = DraggableFold;
})(FlipJs || (FlipJs = {}));
///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />
///<reference path="draggable.ts" />
var FlipJs;
(function (FlipJs) {
    var DraggableZoom = (function () {
        function DraggableZoom() {
        }
        DraggableZoom.prototype.start = function (args) {
        };
        DraggableZoom.prototype.move = function (args) {
        };
        DraggableZoom.prototype.stop = function (args) {
        };
        DraggableZoom.prototype.cancel = function (args) {
        };
        return DraggableZoom;
    }());
    FlipJs.DraggableZoom = DraggableZoom;
})(FlipJs || (FlipJs = {}));
///<reference path="jquery.d.ts" />
///<reference path="flipper.d.ts" />
$(document).ready(function () {
    var regex = /#magazine:(\d+)/i;
    function refresh() {
        var hash = window.location.hash || '#';
        var res = regex.exec(hash);
        var $pageTurn = $('.page-turn.hash');
        if (res) {
            var pageNumber = parseInt(res[1], 10);
            var pageTurn = $pageTurn.pageTurn();
            pageTurn.navigate(pageNumber);
        }
        $pageTurn.toggleClass('opened', !!res);
    }
    $(window).bind('hashchange', function () {
        refresh();
    });
    refresh();
    $('body').on('page-change', '.page-turn', function (ev, pageNumber) {
        window.location.hash = "#magazine:" + pageNumber;
    });
});
///<reference path="vector-2d.ts" />
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
    function init($container) {
        var $scaler = $container.find('.scaler');
        var $pages = $container.find('.pages');
        var $zoomNode = $container.find('.page-turn-magnifier');
        var $toolbarPage = $container.find('.page-turn-toolbar input');
        var corner;
        /** Front side of page being folded */
        var $frontPage;
        var $frontPageImg;
        /** Back side of page being folded */
        var $backPage;
        var $backPageImg;
        var touchCorner = '';
        var zoomValue = 1;
        var zoomK = 1.5;
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
            $pages.find('li').each(function (index, node) {
                var $node = $(node);
                if (!$node.hasClass('empty')) {
                    page++;
                }
                var $originalImg = $node.find('img');
                var url = $originalImg.attr('data-preview-src') || $originalImg.attr('src');
                var $img = $('<img />').attr('src', url);
                var $li = $('<li></li>');
                var $a = $('<a></a>').attr('href', "#magazine:" + page).append($img);
                $li.append($a);
                $ol.append($li);
            });
        }
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
         * Get back side of page being fold
         */
        function getBackPage(corner) {
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
        function getFrontPage(corner) {
            switch (corner) {
                case 'br':
                case 'tr':
                    return $pages.find('.page2');
                case 'bl':
                case 'tl':
                    return $pages.find('.page3');
            }
        }
        function initCorner(cornerType) {
            corner = new FlipJs.Corner($container, cornerType);
            screenHeight = $scaler.height();
            screenWidth = $scaler.width();
            pageHeight = screenHeight;
            pageWidth = screenWidth / 2;
            var $pageA = getPageA();
            var $pageB = getPageB();
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
                    vector: pos.sub(mouseDownStart),
                    $handle: $handle,
                    event: ev
                };
            }
            function dragStart(ev) {
                var args = createDragArgs(ev);
                dragging = {
                    zoom: zoom(),
                };
                if (dragging.zoom) {
                }
                else {
                    dragStartFold(args);
                }
                draggingPreview = null;
                return true;
            }
            function dragStartFold(args) {
                var corner = getCornerType(args.$handle);
                initCorner(corner);
            }
            function dragMove(ev) {
                if (dragging) {
                    var args = createDragArgs(ev);
                    if (dragging.zoom) {
                        dragMoveZoom(args);
                    }
                    else {
                        dragMoveFold(args);
                    }
                }
            }
            function dragMoveZoom(args) {
                var m = new Matrix2D().scale(zoomValue, zoomValue).translate(zoomShift).translate(args.vector);
                $zoomNode.css('transform', m.getTransformExpression());
            }
            function dragMoveFold(args) {
                corner.setGlobalPointA(args.rel);
                refresh();
            }
            function dragAnimate(target) {
                var start = corner.getPoint();
                var delta = target.sub(start);
                return animate(function (stage) {
                    var vector = delta.mul(stage).add(start);
                    corner.setLocalPointA(vector);
                    refresh();
                }).done(function () {
                    cleanPages();
                    clean();
                });
            }
            function dragEnd(ev) {
                if (dragging) {
                    if (dragging.zoom) {
                        dragEndZoom(ev);
                    }
                    else {
                        dragEndFold(ev);
                    }
                    dragging = null;
                }
            }
            function dragEndZoom(ev) {
                var args = createDragArgs(ev);
                zoomShift = zoomShift.add(args.vector);
            }
            function dragEndFold(ev) {
                var touchPointA = corner.getPoint();
                if (touchPointA.x > pageWidth) {
                    dragAnimate(new Vector2D(screenWidth, 0)).done(function () {
                        shiftCurrent(corner.pagesDelta);
                    });
                }
                else {
                    dragCancel(ev);
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
                    state = 'threshold';
                    $handle = $evtarget.closest('.corner');
                }
            }).on('mousemove touchmove', '.page-turn .corner', function (ev) {
                if (dragging || zoom())
                    return;
                draggingPreview = {};
                mouseDownStart = new Vector2D(-100, -100);
                $handle = $(ev.target).closest('.corner');
                var args = createDragArgs(ev);
                var corner = getCornerType(args.$handle);
                initCorner(corner);
                dragMoveFold(args);
            }).on('mouseout touchend', '.page-turn .corner', function (ev) {
                if (!draggingPreview)
                    return;
                draggingPreview = null;
                dragAnimate(new Vector2D(0, 0));
            }).on('mousedown touchstart', '.page-turn.zoom-in .page-turn-magnifier', function (ev) {
                var $evtarget = $(ev.target);
                if (state === 'init') {
                    mouseDownStart = getMousePosition(ev);
                    ev.preventDefault();
                    ev.stopPropagation();
                    state = 'threshold';
                    $handle = $evtarget.closest('.page-turn');
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
                    $handle = $(ev.target).closest('.corner');
                    if ($handle.length) {
                        animateArrow(getCornerType($handle));
                    }
                }
                state = 'init';
            }).bind('click', '.page-turn .corner', function (ev) {
            }).bind('keydown', function (ev) {
                if (!dragging)
                    return;
                if (ev.keyCode === 27) {
                    dragCancel(ev);
                }
            });
        })();
        /**
         * Get touch point vector during auto-animation. Fold point x and Fold angle is animated.
         * @param stage Number from 0 to 1.
         */
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
        function dumpFold(localFold) {
            function debugPoint($point, vector) {
                vector = corner.localToGlobal(vector);
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
        /**
         * Get trapezoid clipper matrix.
         */
        function getTrapezoidClipperMatrix(pointO, pointU, pointV, pointW) {
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
        function setupPage($page, $img, pageMatrix, clipperMatrix) {
            pageMatrix = pageMatrix.multiply(corner.localToGlobalMatrix);
            clipperMatrix = clipperMatrix.multiply(corner.localToGlobalMatrix);
            $page.css('transform', clipperMatrix.getTransformExpression());
            pageMatrix = pageMatrix.multiply(clipperMatrix.reverse()); //compensate clipper matrix
            $img.css('transform', pageMatrix.getTransformExpression());
        }
        function getPageMatrix(fold) {
            var pageXAxis = fold.pointA.sub(fold.pointD).normalize();
            var pageYAxis = fold.pointC.sub(fold.pointD).normalize();
            var pageMatrix = new Matrix2D([pageXAxis.x, pageXAxis.y, 0, pageYAxis.x, pageYAxis.y, 0, 0, 0, 1]).translate(fold.pointD);
            return corner.textureToLocalMatrix.multiply(pageMatrix);
        }
        function setupBackPage(localFold) {
            var pageMatrix = getPageMatrix(localFold);
            var clipperMatrix;
            if (localFold.foldA.x > localFold.foldB.x) {
                clipperMatrix = getOuterClipMatrix(localFold.foldA, localFold.pointA, localFold.foldB);
            }
            else {
                clipperMatrix = getOuterClipMatrix(localFold.foldB, localFold.pointB, localFold.foldA);
            }
            setupPage($backPage, $backPageImg, pageMatrix, clipperMatrix);
        }
        function setupFrontPage(localFold) {
            var shift = corner.textureToGlobal(new Vector2D(0, 0));
            var pageMatrix = new Matrix2D().translate(shift).multiply(corner.globalToLocalMatrix);
            var spineA = corner.spinePointA.mul(2); //Scale it by any number >1 to avoid zero axis length
            var spineB = corner.spinePointB.mul(2); //Scale it by any number >1 to avoid zero axis length
            var clipperMatrix;
            if (localFold.foldA.x > localFold.foldB.x) {
                clipperMatrix = getTrapezoidClipperMatrix(localFold.foldA, spineA, localFold.foldB, spineB);
            }
            else {
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
            return $pages.find('li').removeClass('page1 page2 page3 page4');
        }
        function clean() {
            $container.removeClass('active');
            $pages.find('li').css('transform', '').find('img').css('transform', '');
        }
        function isOneSideLeftPage() {
            return $container.hasClass('one-side-left');
        }
        function isOneSideRightPage() {
            return $container.hasClass('one-side-right');
        }
        function getOneSidePage() {
            if (isOneSideLeftPage()) {
                return $pages.children('li.page-a');
            }
            else if (isOneSideRightPage()) {
                return $pages.children('li.page-b');
            }
            else {
                return $({});
            }
        }
        function hasPageBefore($page) {
            var $prev = $page.prev('li');
            return isPage($prev);
        }
        function hasPageAfter($page) {
            var $next = $page.next('li');
            return isPage($next);
        }
        function getPageA() {
            return $pages.children('li.page-a');
        }
        function getPageB() {
            return $pages.children('li.page-b');
        }
        function isPage($page) {
            if (!$page.length)
                return false;
            return !$page.hasClass('empty');
        }
        function refreshState() {
            var $pageA = getPageA();
            var $pageB = getPageB();
            var $currentOne = getOneSidePage();
            $container.toggleClass('can-prev-2', hasPageBefore($pageA));
            $container.toggleClass('can-next-2', hasPageAfter($pageB));
            $container.toggleClass('can-prev', hasPageBefore($currentOne));
            $container.toggleClass('can-next', hasPageAfter($currentOne));
            var twoSides = isPage($pageA) && isPage($pageB);
            $container.toggleClass('two-sides', twoSides);
            var pageNum = getPageNumber();
            $toolbarPage.val(pageNum.toString());
            preloadImages();
        }
        function getPageNumber() {
            var $items = $pages.children('li:not(.empty)');
            var oneSideLeft = isOneSideLeftPage();
            for (var n = 0; n < $items.length; n++) {
                var $page = $($items[n]);
                if ($page.hasClass('page-a')) {
                    return n + (oneSideLeft ? 1 : 2);
                }
                else if ($page.hasClass('page-b')) {
                    return n + 1;
                }
            }
        }
        function shiftCurrent(delta) {
            var pn = getPageNumber();
            navigate(pn + delta);
        }
        function animate(callback) {
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
                requestAnimationFrame(function () {
                    frame += step;
                    frame = Math.min(frame, 100);
                    var x = easeInOutCubic(frame / 100, 0, 1, 1);
                    callback(x);
                    if (frame < 100) {
                        draw();
                    }
                    else {
                        animationSemaphore = false;
                        $container.removeClass('animating');
                        promise.resolve();
                    }
                });
            }
            draw();
            return promise;
        }
        function animateArrow(cornerType) {
            initCorner(cornerType);
            animate(function (stage) {
                var pointA = getPointAFromStage(stage);
                corner.setLocalPointA(pointA);
                refresh();
            }).done(function () {
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
                }
                else {
                    shiftCurrent(2);
                }
            }
        }
        function animateFlipBackward() {
            var $newBase = $pages.children('li.page-a').prev('li');
            if ($newBase.length) {
                if (!zoom()) {
                    animateArrow('bl');
                }
                else {
                    shiftCurrent(-2);
                }
            }
        }
        function getMaxPage() {
            return $pages.children('li:not(.empty)').length;
        }
        function navigate(pageNumber) {
            var $items = $pages.children('li');
            var maxPage = getMaxPage();
            pageNumber = Math.min(Math.max(1, pageNumber), maxPage);
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
            $container.toggleClass('first', pageNumber == 1);
            $container.toggleClass('last', pageNumber >= maxPage);
        }
        function close() {
            window.location.hash = '#';
        }
        function zoom() {
            return $container.hasClass('zoom-in');
        }
        function setZoom() {
            zoomShift = new Vector2D(0, 0);
            var m = new Matrix2D().scale(zoomValue, zoomValue);
            $zoomNode.css('transform', m.getTransformExpression());
            $container.toggleClass('zoom-in', zoomValue > 1);
        }
        function zoomIn() {
            zoomValue *= zoomK;
            setZoom();
        }
        function zoomOut() {
            zoomValue /= zoomK;
            setZoom();
        }
        function toggleZoom() {
            if (zoom()) {
                zoomValue = 1;
            }
            else {
                zoomValue = 2;
            }
            setZoom();
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
        };
    }
    var data = this.data('page-turn');
    if (data)
        return data;
    data = init(this);
    this.data('page-turn', data);
    return data;
};
$(document).ready(function () {
    function getControl(ev) {
        return $(ev.target).closest('.page-turn').pageTurn();
    }
    $('body').on('dblclick', '.page-turn .page-turn-magnifier', function (ev) {
        getControl(ev).toggleZoom();
    }).on('click', '.page-turn .go-next-2', function (ev) {
        getControl(ev).animateFlipForward();
    }).on('click', '.page-turn .go-prev-2', function (ev) {
        getControl(ev).animateFlipBackward();
    }).on('click', '.page-turn .go-next', function (ev) {
        getControl(ev).shiftCurrent(1);
    }).on('click', '.page-turn .go-prev', function (ev) {
        getControl(ev).shiftCurrent(-1);
    }).on('click', '.page-turn .zoom-in', function (ev) {
        getControl(ev).zoomIn();
    }).on('click', '.page-turn .zoom-out', function (ev) {
        getControl(ev).zoomOut();
    }).on('change', '.page-turn .go-page', function (ev) {
        var $input = $(ev.target).closest('input');
        getControl(ev).navigate(parseInt($input.val(), 10));
    }).on('click', '.page-turn .fullscreen', function (ev) {
        getControl(ev).toggleZoom();
    }).on('click', '.page-turn .bg, .page-turn .empty', function (ev) {
        getControl(ev).close();
    }).on('touchstart', '.page-turn', function (ev) {
        return;
        if (ev.type.indexOf('touch') >= 0) {
            var touchEvent = ev.originalEvent;
            if (touchEvent.touches.length > 1) {
                ev.preventDefault();
            }
        }
    });
});

//# sourceMappingURL=flipper.js.map
