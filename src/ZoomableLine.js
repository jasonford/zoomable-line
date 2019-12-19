import React from 'react';
import './App.css';

const elementCenter = el => {
  const bb = el.getBoundingClientRect();
  return {
    x: bb.left + bb.width / 2,
    y: bb.top + bb.height / 2
  }
}

const MONTHS = "January Febuary March April May June July August September October November December".split(" ")

const yearLabel = year => {
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
  return <pre>{yearString}{year < 0 && ' bc'}</pre>;
}

const getYearTicks = (min, max, wholeUnit = 1) => {
  const numVisible = Math.ceil((max - min) / wholeUnit);
  const ticks = [];
  const scale = Math.min(1, 10/(max - min) * (wholeUnit));
  if (scale < 0.2) {
    return getYearTicks(min, max, wholeUnit * 10)
  }
  for (let i=-1; i<numVisible; i++) {
    const start = (Math.ceil(min/(wholeUnit)) + i) * wholeUnit;
    ticks.push({
      label: yearLabel(start),
      scale: start % (wholeUnit*10) === 0 ? 1 : scale,
      start,
      end: (Math.ceil(min/wholeUnit) + i+1) * wholeUnit
    });
  }
  return ticks;
}

const getTicks = (min, max) => {
  const yearTicks = getYearTicks(min, max);

  const monthTicks = []
  yearTicks.forEach( yearTick => {
    const monthsInYear = 12
    const monthSpan = (yearTick.end - yearTick.start)/monthsInYear
    const scale = Math.min(1, (yearTick.end - yearTick.start) / (max - min))
    if (scale < 0.2) return;
    for (let i=0; i<monthsInYear; i++) {
      const start = yearTick.start + monthSpan*i;
      const end = start + monthSpan;
      if (start < max && end > min) {
        monthTicks.push({
          start,
          end,
          scale,
          label: <pre>{MONTHS[i]}</pre>
        })
      }
    }
  })

  const dayTicks = [];
  monthTicks.forEach( monthTick => {
    const daysInMonth = 30;
    const daySpan = (monthTick.end - monthTick.start)/daysInMonth
    const scale = Math.min(1, (monthTick.end - monthTick.start) / (max - min))
    if (scale < 0.2) return;
    for (let i=0; i<daysInMonth; i++) {
      const start = monthTick.start + daySpan*i;
      const end = start + daySpan;
      if (start < max && end > min) {
        dayTicks.push({
          start,
          end,
          scale,
          label: <pre>{i+1}</pre>
        })
      }
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
    yearTicks,
    monthTicks,
    dayTicks,
    hourTicks,
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
    let divisionGroups = [];
    if (width > 0) divisionGroups = getTicks(this.state.min, this.state.max);

    return (
      <div
        ref={this.container}
        style={{width: '100%', height: '100%', overflow: 'hidden', position: 'relative'}}
        onWheel={ this.handleMouseWheel }
      >
        {
          divisionGroups.map(
            divisionGroup => {
              return (
                <div style={{position: 'relative', height: 48}}>
                  {
                    divisionGroup.map( d => {
                      let x = (d.start - this.state.min) / (this.state.max - this.state.min) * this.state.width;
                      if (x < 0) {
                        x = 0; //  TODO: interpolate this number so it smoothly disappears as new values slide in
                      }
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
                            transformOrigin: '0% 0%',
                            transform: `translate(${x}px, 0px) scale(${d.scale})`,
                            display: 'flex',
                            justifyContent: 'center'
                          }}
                        >
                          <div>{d.label}</div>
                        </div>
                      )
                    })
                  }
                </div>
              );
            }
          )
        }
      </div>
    );
  }
}