
interface IJQueryNodes {

    pageTurn(): IFlipperControl;

}

interface IFlipperControl {

    animateFlipBackward();

    animateFlipForward();

    shiftCurrent(delta: number);
    
}