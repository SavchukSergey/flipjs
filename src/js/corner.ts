///<reference path="jquery.d.ts" />
///<reference path="matrix-2d.ts" />
///<reference path="vector-2d.ts" />

namespace FlipJs {

    export class Corner {

        private $container: IJQueryNodes;
        private touchPointA: Vector2D;

        private screenHeight: number;
        private screenWidth: number;
        private pageHeight: number;
        private pageWidth: number;

        public globalToLocalMatrix: Matrix2D;
        public localToGlobalMatrix: Matrix2D;

        private spinePointA: Vector2D;
        private spinePointB: Vector2D;

        constructor($container: IJQueryNodes, cornerType: string) {
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

            this.spinePointA = new Vector2D(pageWidth, 0);
            this.spinePointB = new Vector2D(pageWidth, pageHeight);

        }

        public setLocalPointA(point: Vector2D) {
            point = this.fixPointA(point);

            this.touchPointA = point;
        }

        public setGlobalPointA(point: Vector2D) {
            this.setLocalPointA(this.globalToLocalMatrix.transformVector(point));
        }

        public getPoint() {
            return this.touchPointA;
        }

        public localToGlobal(vector: Vector2D) {
            return this.localToGlobalMatrix.transformVector(vector);
        }


        /**
         * Check pointA to spine distance. We dont want page to be torn...
         */
        private fixPointA(pointA: Vector2D): Vector2D {
            if (pointA.length() < 10) pointA = new Vector2D(0, 0);

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
        }

        /**
         * Get global to corner local coordinate system transformation matrix
         */
        private getCornerMatrix(corner: string): Matrix2D {
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
        }



    }

}