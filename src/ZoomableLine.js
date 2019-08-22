import React from 'react';
import './App.css';

const getTicks = (min, max) => {
  const numDivisions = 10;
  const ticks = [...new Array(numDivisions)].map((_, index) => {
    return { label: '0.' + index, x: 0.1*index, y: 0 };
  });
  return ticks;
}


export default class ZoomableLine extends React.Component {
  state = {
    min: 0,
    max: 1,
    width: 0,
    height: 0
  }

  constructor() {
    super()
    this.container = React.createRef();
    document.addEventListener('wheel', this.handleMouseWheel);
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseWheel = (event) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      const direction = Math.sign(event.deltaY);
      const deltaX = direction * window.innerWidth/100;
      //this.pan(deltaX, 0);
    }
    else {
      const direction = Math.sign(event.deltaY);
      const scale = (direction < 0 ? 0.9 : 1.1);

      const scaledEventX = this.state.min + (event.clientX / window.innerWidth) * (this.state.max - this.state.min);
      this.setState({
        min: this.state.min*scale + (scaledEventX * (1-scale)),
        max: this.state.max*scale + (scaledEventX * (1-scale))
      });
    }
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
      >
        <div>{this.state.min}</div>
        <div>{this.state.max}</div>
        {
          divisions.map(
            d => {
              const x = (d.x - this.state.min) / (this.state.max - this.state.min) * this.state.width;
              const y = this.state.height / 2;
              return (
                <div
                  key={d.label}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 0,
                    height: 0,
                    transform: `translate(${x}px, ${y}px)`,
                    display: 'flex',
                    alignItems: 'center',
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