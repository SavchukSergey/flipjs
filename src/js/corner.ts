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

        public pagesDelta: number;

        public globalToLocalMatrix: Matrix2D;
        public localToGlobalMatrix: Matrix2D;

        public localToTextureMatrix: Matrix2D;
        public textureToLocalMatrix: Matrix2D;


        public spinePointA: Vector2D;
        public spinePointB: Vector2D;

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

            this.localToTextureMatrix = this.getLocalToTextureMatrix(cornerType);
            this.textureToLocalMatrix = this.localToTextureMatrix.reverse();


            this.spinePointA = new Vector2D(pageWidth, 0);
            this.spinePointB = new Vector2D(pageWidth, pageHeight);

            this.pagesDelta = this.getCornerShift(cornerType);

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

        public textureToLocal(vector: Vector2D) {
            vector = this.textureToLocalMatrix.transformVector(vector);
            return vector;
        }

        public textureToGlobal(vector: Vector2D) {
            vector = this.textureToLocalMatrix.transformVector(vector);
            vector = this.localToGlobalMatrix.transformVector(vector);
            return vector;
        }

        public calculateFold(): IFold {
            var pointA = this.touchPointA;
            var pageWidth = this.pageWidth;
            var pageHeight = this.pageHeight;

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
                foldB: this.getFoldB(pointA, pointB, pointC)
            }
        }

        private getFoldB(pointA: Vector2D, pointB: Vector2D, pointC: Vector2D) {
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

        /**
         * Get local to texture transform matrix
         */
        private getLocalToTextureMatrix(corner: string): Matrix2D {
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
        }


        private getCornerShift(corner: string): number {
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

    }

}