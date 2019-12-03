import React from 'react';
import './App.css';

const elementCenter = el => {
  const bb = el.getBoundingClientRect();
  return {
    x: bb.left + bb.width / 2,
    y: bb.top + bb.height / 2
  }
}

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")

const getPlaceValueTicks = (min, max, wholeUnit, fractionalUnit = 1, label = l => l) => {
  const numVisible = Math.ceil((max - min) / wholeUnit * fractionalUnit);
  const ticks = [];
  const scale = Math.min(1, 20/(max - min) * wholeUnit / fractionalUnit);
  if (scale < 0.2) return [];
  for (let i=0; i<numVisible; i++) {
    const x = (Math.ceil(min/(wholeUnit/fractionalUnit)) + i) * wholeUnit / fractionalUnit;
    ticks.push({
      label: label(x),
      scale,
      nextX: (Math.ceil(min/(wholeUnit/fractionalUnit)) + i+1) * wholeUnit / fractionalUnit,
      x,
      y:0
    });
  }
  return ticks;
}

const getTicks = (min, max) => {
  const takenTickXValues = {}
  const yearLabels = year => {
    let yearString = Math.abs(year);
    if (year % 100000000 === 0 && Math.abs(year) >= 1000000000) {
      yearString = Math.abs(year) / 1000000000 + 'B';
    }
    else if (year % 100000 === 0 && Math.abs(year) >= 1000000) {
      yearString = Math.abs(year) / 1000000 + 'M';
    }
    else if (year % 100 === 0 && Math.abs(year) >= 10000) {
      yearString = Math.abs(year) / 1000 + 'K';
    }
    return <pre>{yearString} {year < 0 && 'bc'}</pre>;
  }
  const days = [];
  const hours = [];
  const minutes = [];
  const seconds = [];
  const milliseconds = [];
  const microseconds = [];
  const nanoseconds = [];
  return [
    { label: <pre>0</pre>, x: 0, y: 0, scale: 1, nextX: 1 },
    ...getPlaceValueTicks(min, max, 100000000000, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 10000000000, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 1000000000, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 100000000, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 10000000, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 1000000, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 100000, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 10000, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 1000, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 100, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 10, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 1, 1, yearLabels),
    ...getPlaceValueTicks(min, max, 1, 12, x => {
      if (x < 0) x = x%1+1
      return <pre>{MONTHS[Math.round(x%1*12)]}</pre>
    })
  ].map(
    tick => {
      if (takenTickXValues[tick.x]) {
        return false;
      }
      else {
        takenTickXValues[tick.x] = true;
        return tick
      }
    }
  ).filter( tick => tick );
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
              const deltaToNextX = Math.abs(d.nextX - d.x);
              const clickMin = d.x - deltaToNextX/3;
              const clickMax = d.nextX + deltaToNextX/3;

              return (
                <div
                  key={d.x}
                  onWheel={ e => this.handleMouseWheel(e, elementCenter(e.target)) }
                  onClick={ e => this.setState({min: clickMin, max: clickMax})}
                  style={{
                    opacity: d.scale,
                    position: 'absolute',
                    fontSize: 24,
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