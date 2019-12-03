import utils from 'utils';

const DOUBLE_TAP_THRESHOLD = 300;
const HOLD_THRESHOLD = 300;
const DRAG_THRESHOLD = 4;
const STYLUS_DRAG_THRESHOLD = 8;

let eventDistance = (a, b) => Math.sqrt(Math.pow(a.clientX - b.clientX, 2) + Math.pow(a.clientY - b.clientY, 2));

export default function captureInteraction(element, handler) {
  this.state = {};

  const setState = (newState) => this.state = {...this.state, ...newState};

  const touchstart = (e) => {
    if (e.touches && e.touches.length > 1) {
      setState({
        multiTouch: true,
        holding: false
      });
      //  for now ignore multi touch actions, in future we might want to edit on pinch
      return;
    }

    //  prevent mouseclick emulation
    e.preventDefault();
    const thisTouchStart = Date.now();
    const lastTouchStart = this.state.lastTouchStart;
    const isDoubleTap = (!e.touches || e.touches.length === 1) && lastTouchStart && thisTouchStart - lastTouchStart < DOUBLE_TAP_THRESHOLD;
    const lastPointerDown = (e.touches && e.touches[e.touches.length-1]) || e;
    const startPosition = {
      x: lastPointerDown.clientX,
      y: lastPointerDown.clientY
    }
    setState({
      lastTouchStart: thisTouchStart,
      touchIsDown: true,
      doubleTapping: isDoubleTap,
      lastPointerDown,
      lastPointerMoved: null,
      usingStylus: utils.stylusTouch(e),
      lastPointerTool: utils.stylusTouch(e) ? 'stylus' : 'finger' // TODO: differentiate for cursor
    });
    if (isDoubleTap) {
      handler({type: 'doubletapstart', x: lastPointerDown.clientX, y: lastPointerDown.clientY, stylus: this.state.usingStylus})
    }
    else {
      handler({type: 'touchstart', x: lastPointerDown.clientX, y: lastPointerDown.clientY, stylus: this.state.usingStylus})
      if (this.state.usingStylus) {
        handler({
          type: 'dragstart',
          x: lastPointerDown.clientX,
          y: lastPointerDown.clientY
        });
      }
    }

    setTimeout(() => {
      if (this.state.lastTouchStart === thisTouchStart && this.state.touchIsDown) {
        if (isDoubleTap) {
          //  doublehold
        }
        else if (!this.state.dragging && !this.state.multiTouch) {
          setState({
            holding: true,
            holdPosition: startPosition
          });
          handler({type: 'hold', ...startPosition })
          if (!this.state.usingStylus) {
            handler({
              type: 'dragstart',
              x: lastPointerDown.clientX,
              y: lastPointerDown.clientY
            });
          }
        }
      }
    }, HOLD_THRESHOLD);
  }

  const touchmove = (e) => {
    //  prevent mouseclick emulation
    //  (would trigger a second voxel add)
    e.preventDefault();
    let lastPointerMoved = (e.touches && e.touches[e.touches.length-1]) || e;
    const lastPointerDown = this.state.lastPointerDown;

    //  ignore first move if under threshold
    if (this.state.touchIsDown && !this.state.dragging && eventDistance(lastPointerDown, lastPointerMoved) < (this.state.lastPointerTool === 'stylus' ? DRAG_THRESHOLD : STYLUS_DRAG_THRESHOLD)) {
      return;
    }

    const firstDrag = !this.state.dragging;

    setState({
      dragging: this.state.touchIsDown,
      lastPointerDown: null,
      lastPointerMoved
    });

    if (this.state.usingStylus || this.state.holding) {
      handler({
        type: 'drag',
        x: lastPointerMoved.clientX,
        y: lastPointerMoved.clientY
      })
    }
    else {
      handler({type: 'touchmove', x: lastPointerMoved.clientX, y: lastPointerMoved.clientY})
    }
  }

  const touchend = (e) => {
    if (this.state.multiTouch && e.touches.length > 0) {
      //  ignore the results of any multitouch unless this is the last touch
      return;
    }
    let { dragging, holding, doubleTapping, multiTouch, lastPointerDown } = this.state;
    if (!dragging && !holding && !multiTouch) {
      const x = lastPointerDown.clientX;
      const y = lastPointerDown.clientY;
      doubleTapping ? handler({type: 'doubletap', x, y}) : handler({type: 'tap', x, y});
    }

    setState({
      touchIsDown: false,
      dragging: false,
      holding: false,
      multiTouch: false,
      doubleTapping: false,
      lastPointerDown: null,
      lastPointerMoved: null,
      usingStylus: false,
      holdPosition: null
    });

    handler({type: 'touchend'});
  }

  element.addEventListener('touchstart', touchstart, false);
  element.addEventListener('touchmove', touchmove, false);
  element.addEventListener('touchend', touchend, false);
  element.addEventListener('mousedown', touchstart, false);
  element.addEventListener('mousemove', touchmove, false);
  element.addEventListener('mouseup', touchend, false);
}