
interface IJQueryNodes {

    pageTurn(): IFlipperControl;

}

interface IFlipperControl {

    animateFlipBackward();

    animateFlipForward();

    shiftCurrent(delta: number);
    
    navigate(page: number);

    zoomIn();

    zoomOut();

    toggleZoom();

    close();
    
}