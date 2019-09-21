import React from 'react';
import './App.css';

const elementCenter = el => {
  const bb = el.getBoundingClientRect();
  return {
    x: bb.left + bb.width / 2,
    y: bb.top + bb.height / 2
  }
}

const getPlaceValueTicks = (min, max, placeValue) => {
  const numVisible = Math.ceil((max - min) / placeValue)
  const ticks = [];
  const scale = Math.min(2, 3 / (max - min) * 10 * placeValue);
  if (scale < 0.3) return [];
  for (let i=0; i<numVisible; i++) {
    const x = Math.round((Math.ceil(min/placeValue) + i)/(1/placeValue));
    if (x%(10*placeValue) !== 0) {
      ticks.push({ label: `${x}`, scale, x, y:0 });
    }
  }
  return ticks;
}

const getTicks = (min, max) => {
  return [
    { label: '0', x: 0, y: 0, scale: 2 },
    ...getPlaceValueTicks(min, max, 1),
    ...getPlaceValueTicks(min, max, 10),
    ...getPlaceValueTicks(min, max, 100),
    ...getPlaceValueTicks(min, max, 1000),
    ...getPlaceValueTicks(min, max, 10000),
    ...getPlaceValueTicks(min, max, 100000)
  ];
}

export default class ZoomableLine extends React.Component {
  state = {
    min: 2019 - 10,
    max: 2019 + 10,
    width: 0,
    height: 0
  }

  constructor() {
    super()
    this.container = React.createRef();
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseWheel = (event, altCenter) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      const direction = Math.sign(event.deltaY);
      const deltaX = direction * window.innerWidth/100;
      //this.pan(deltaX, 0);
    }
    else {
      const direction = Math.sign(event.deltaY);
      const scale = (direction < 0 ? 1/1.05 : 1.05);
      let x = altCenter ? altCenter.x : event.clientX; 

      const scaledEventX = this.state.min + (x / window.innerWidth) * (this.state.max - this.state.min);
      this.setState({
        min: this.state.min*scale + (scaledEventX * (1-scale)),
        max: this.state.max*scale + (scaledEventX * (1-scale))
      });
    }
    event.stopPropagation();
  }

  handleMouseDown = (event) => {
    this.setState({dragging: true});
  }

  handleMouseMove = (event) => {
    if (this.state.dragging) {
      this.pan(event.movementX, event.movementY);
    }
  }

  handleMouseUp = (event) => {
    this.setState({dragging: false});
  }

  pan = (screenDeltaX, screenDeltaY) => {
    const deltaX = screenDeltaX/this.state.width * (this.state.max - this.state.min);
    const min = this.state.min - deltaX;
    const max = this.state.max - deltaX;
    this.setState({min, max});
  }

  componentDidMount = () => {
    this.setState({
      width: this.container.current.offsetWidth,
      height: this.container.current.offsetHeight
    });
  }

  render = () => {
    let { center, zoomScale, width, height } = this.state;
    let divisions = [];
    if (width > 0) divisions = getTicks(this.state.min, this.state.max);

    return (
      <div
        ref={this.container}
        style={{width: '100%', height: '100%', overflow: 'hidden', position: 'relative'}}
        onWheel={ this.handleMouseWheel }
      >
        {
          divisions.map(
            d => {
              const x = (d.x - this.state.min) / (this.state.max - this.state.min) * this.state.width;
              const y = this.state.height / 2;
              return (
                <div
                  key={d.label}
                  onWheel={ e => this.handleMouseWheel(e, elementCenter(e.target)) }
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                    transformOrigin: '0% 50%',
                    transform: `translate(${x}px, ${y}px) scale(${d.scale})`,
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                >
                  <div>{d.label}</div>
                </div>
              );
            }
          )
        }
      </div>
    );
  }
}