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
  const scale = Math.min(1, 10/(max - min) * (wholeUnit / fractionalUnit));
  if (scale < 0.2) return [];
  for (let i=-1; i<numVisible; i++) {
    const start = (Math.ceil(min/(wholeUnit/fractionalUnit)) + i) * wholeUnit / fractionalUnit;
    ticks.push({
      label: label(start),
      scale,
      start,
      labelPosition: 'start',
      end: (Math.ceil(min/(wholeUnit/fractionalUnit)) + i+1) * wholeUnit / fractionalUnit
    });
  }
  return ticks;
}

const getTicks = (min, max) => {
  const takenTickLabels = {}
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
  const monthTicks = getPlaceValueTicks(min, max, 1, 12, x => {
    if (x < 0) x = x%1+1
    return <pre>{MONTHS[Math.round(x%1*12)]}</pre>
  }).map( monthTick => {
    monthTick.labelPosition = 'center';
    return monthTick;
  })
  const dayTicks = [];
  monthTicks.forEach( monthTick => {
    const daysInMonth = 30;
    const daySpan = (monthTick.end - monthTick.start)/daysInMonth
    const scale = Math.min(1, (monthTick.end - monthTick.start) / (max - min))
    if (scale < 0.2) return;
    for (let i=0; i<daysInMonth; i++) {
      dayTicks.push({
        start: monthTick.start + daySpan*i,
        end: monthTick.start + daySpan*(i+1),
        scale,
        label: <pre>{i+1}</pre>
      })
    }
  })

  const hourTicks = [];

  const hourString = hour => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour < 12 ? hour + 'am' : (hour - 12) + 'pm'
  }

  dayTicks.forEach( dayTick => {
    const hoursInDay = 24;
    const hourSpan = (dayTick.end - dayTick.start)/hoursInDay
    const scale = Math.min(1, (dayTick.end - dayTick.start) / (max - min))
    if (scale < 0.2) return;
    for (let i=0; i<hoursInDay; i++) {
      const start = dayTick.start + hourSpan*i;
      const end = start + hourSpan;
      if (start < max && end > min) {
        hourTicks.push({
          start,
          end,
          scale,
          label: <pre>{hourString(i)}</pre>
        })
      }
    }
  })
  return [
    { label: <pre>0</pre>, start: 0, end: 0, y: 0, scale: 1 },
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
    ...monthTicks,
    ...dayTicks,
    ...hourTicks
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
              const x = (d.start - this.state.min) / (this.state.max - this.state.min) * this.state.width;
              const y = this.state.height / 2;

              return (
                <div
                  key={d.start + '-' + d.end}
                  onWheel={ e => this.handleMouseWheel(e, elementCenter(e.target)) }
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