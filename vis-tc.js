class VisTideChart {
  constructor({ id, data, hideDateAxis, hideTimeAxis, hideYAxis }) {
    this.id = id;
    this.data = data;
    this.hideDateAxis = hideDateAxis;
    this.hideTimeAxis = hideTimeAxis;
    this.hideYAxis = hideYAxis;

    this.resizeVis = this.resizeVis.bind(this);
    this.moved = this.moved.bind(this);
    this.left = this.left.bind(this);

    this.initVis();
  }

  initVis() {
    this.hideBothAxis = this.hideDateAxis && this.hideTimeAxis;
    this.hideOneAxis =
      !this.hideBothAxis && (this.hideDateAxis || this.hideTimeAxis);
    this.dimension = {
      margin: {
        top: 8,
        right: 0,
        bottom: this.hideBothAxis ? 0 : this.hideOneAxis ? 20 : 32,
        left: 0,
      },
      width: null,
      height: this.hideBothAxis ? 320 - 32 : this.hideOneAxis ? 320 - 20 : 320,
      get boundedWidth() {
        return this.width - this.margin.left - this.margin.right;
      },
      get boundedHeight() {
        return this.height - this.margin.top - this.margin.bottom;
      },
      currentTimeCircleRadius: 6.5,
      tideCircleRadius: 8,
    };

    this.parseTime = (date, time) => luxon.DateTime.fromISO(`${date}T${time}`);
    this.formatLabelTime = (dt) => dt.toFormat("H':'mm");
    this.formatTickTime = (t) => {
      const dt = luxon.DateTime.fromJSDate(t);
      if (!this.hideBothAxis) {
        if (this.hideDateAxis) {
          if (dt.minute === 0) return dt.toFormat("H");
          return "";
        } else if (this.hideTimeAxis) {
          if (dt.hour === 0) return dt.toFormat("d LLL");
          return "";
        } else {
          if (dt.hour === 0) return dt.toFormat("d LLL");
          if (dt.minute === 0) return dt.toFormat("H");
          return "";
        }
      }
      return "";
    };

    this.x = d3.scaleTime();
    this.y = d3
      .scaleLinear()
      .range([
        this.dimension.height - this.dimension.margin.bottom,
        this.dimension.margin.top,
      ]);

    this.linePath = d3
      .area()
      .curve(d3.curveMonotoneX)
      .x((d) => this.x(d.time.toJSDate()))
      .y((d) => this.y(d.value));
    this.areaPath = d3
      .area()
      .curve(d3.curveMonotoneX)
      .x((d) => this.x(d.time.toJSDate()))
      .y1((d) => this.y(d.value))
      .y0(this.dimension.height - this.dimension.margin.bottom);

    this.container = d3
      .select(`#${this.id}`)
      .append("div")
      .attr("class", "vis-tide-chart");
    this.svg = this.container.append("svg");

    this.tooltip = new VisTooltip({
      container: this.container,
      direction: "vertical",
    });

    this.chartClipId = `${this.id}-chart-clip`;
    this.defs = this.svg.append("defs").call((defs) =>
      defs
        .selectAll("clipPath")
        .data([this.chartClipId])
        .join("clipPath")
        .attr("id", (id) => id)
    );

    this.svg
      .append("g")
      .attr("class", "chart-g")
      .attr("clip-path", `url(#${this.chartClipId})`)
      .call((g) => g.append("g").attr("class", "background-g"))
      .call((g) =>
        g
          .append("g")
          .attr("class", "tide-paths-g")
          .call((g) => g.append("path").attr("class", "tide-area-path"))
          .call((g) => g.append("path").attr("class", "tide-line-path"))
      );
    this.svg.append("g").attr("class", "tides-g");
    if (!this.hideBothAxis) {
      this.svg.append("g").attr("class", "axis-g x-axis");
    }
    if (!this.hideYAxis) {
      this.svg.append("g").attr("class", "axis-g y-axis");
    }
    this.svg
      .append("circle")
      .attr("class", "current-time-circle")
      .attr("r", this.dimension.currentTimeCircleRadius);

    this.resizeVis();
    window.addEventListener("resize", this.resizeVis);
    this.wrangleData();
    this.addHover();
  }

  resizeVis() {
    this.dimension.width = this.container.node().clientWidth;
    this.x.range([
      this.dimension.margin.left,
      this.dimension.width - this.dimension.margin.right,
    ]);
    this.svg.attr("viewBox", [
      0,
      0,
      this.dimension.width,
      this.dimension.height,
    ]);
    if (this.displayData) this.updateVis();
  }

  wrangleData() {
    const unit = this.data.unit;

    const tides = [];
    for (let i = 0; i < this.data.tide.length; i++) {
      const d = this.data.tide[i];
      const time = this.parseTime(d.date, d.time);
      const value = d.value;
      let isLow;
      if (i < this.data.tide.length - 1) {
        const e = this.data.tide[i + 1];
        const nextValue = e.value;
        isLow = value < nextValue;
      } else {
        const e = this.data.tide[i - 1];
        const prevValue = e.value;
        isLow = value < prevValue;
      }
      tides.push({
        time,
        value,
        isLow,
      });
    }

    const tidesTimes = tides.map((t) => t.time.toJSDate());

    const startTime = tides[1].time.startOf("day");
    const endTime = tides[tides.length - 2].time
      .startOf("day")
      .plus({ days: 1 });
    const currentTime = this.parseTime(
      this.data.currentDate,
      this.data.currentTime
    );

    const suns = [];
    for (let i = 0; i < this.data.sun.length; i++) {
      const d = this.data.sun[i];
      const sunriseTime = this.parseTime(d.date, d.sunrise);
      const sunsetTime = this.parseTime(d.date, d.sunset);
      const firstLightTime = this.parseTime(d.date, d.firstlight);
      const lastLightTime = this.parseTime(d.date, d.lastlight);

      suns.push({
        start: firstLightTime.startOf("day"),
        end: firstLightTime,
        phase: "night",
      });
      suns.push({
        start: firstLightTime,
        end: sunriseTime,
        phase: "light",
      });
      suns.push({
        start: sunriseTime,
        end: sunsetTime,
        phase: "day",
      });
      suns.push({
        start: sunsetTime,
        end: lastLightTime,
        phase: "light",
      });
      suns.push({
        start: lastLightTime,
        end: lastLightTime.startOf("day").plus({ days: 1 }),
        phase: "night",
      });
    }

    this.displayData = {
      unit,
      tides,
      tidesTimes,
      suns,
      startTime,
      endTime,
      currentTime,
    };

    this.x.domain([
      this.displayData.startTime.toJSDate(),
      this.displayData.endTime.toJSDate(),
    ]);
    const [minValue, maxValue] = d3.extent(
      this.displayData.tides,
      (d) => d.value
    );
    this.y
      .domain([
        minValue - (maxValue - minValue) * 0.1,
        maxValue + (maxValue - minValue) * 0.25,
      ])
      .nice();
    this.updateVis();
  }

  updateVis() {
    this.defs
      .select(`#${this.chartClipId}`)
      .selectAll("rect")
      .data([0])
      .join((enter) =>
        enter
          .append("rect")
          .attr("x", this.dimension.margin.left)
          .attr("y", this.dimension.margin.top)
          .attr("height", this.dimension.boundedHeight)
      )
      .attr("width", this.dimension.boundedWidth);

    // Day and night background
    this.svg
      .select(".background-g")
      .selectAll(".background-rect")
      .data(this.displayData.suns)
      .join((enter) =>
        enter
          .append("rect")
          .attr("y", this.dimension.margin.top)
          .attr("height", this.dimension.boundedHeight)
      )
      .attr("class", (d) => `background-rect is-${d.phase}`)
      .attr("x", (d) => this.x(d.start.toJSDate()))
      .attr(
        "width",
        (d) => this.x(d.end.toJSDate()) - this.x(d.start.toJSDate())
      );

    // Tides foreground
    this.svg
      .select(".tide-area-path")
      .datum(this.displayData.tides)
      .attr("d", this.areaPath);

    this.svg
      .select(".tide-line-path")
      .datum(this.displayData.tides)
      .attr("d", this.areaPath);

    this.svg
      .select(".tides-g")
      .selectAll(".tide-g")
      .data(this.displayData.tides.slice(1, this.displayData.tides.length - 1))
      .join((enter) =>
        enter
          .append("g")
          .attr("class", "tide-g")
          .call((g) =>
            g
              .append("circle")
              .attr("class", "tide-circle-shadow")
              .attr("r", this.dimension.tideCircleRadius + 0.5)
              .attr("cy", 1)
          )
          .call((g) =>
            g
              .append("circle")
              .attr("class", "tide-circle")
              .attr("r", this.dimension.tideCircleRadius)
          )
          .call((g) =>
            g
              .append("path")
              .attr("class", "tide-icon")
              .attr(
                "d",
                "M0,-3.03934274260637L2.6321480259049848,1.519671371303185L-2.6321480259049848,1.519671371303185Z"
              )
          )
      )
      .attr(
        "transform",
        (d) => `translate(${this.x(d.time.toJSDate())},${this.y(d.value)})`
      )
      .call((g) =>
        g
          .select(".tide-icon")
          .attr("transform", (d) => `scale(2)rotate(${d.isLow ? 180 : 0})`)
      );

    this.svg
      .select(".current-time-dot")
      .attr("r", this.dimension.currentTimeCircleRadius)
      .attr(
        "transform",
        (d) => `translate(${this.x(this.displayData.currentTime)},0)`
      );

    // X axis
    if (!this.hideBothAxis) {
      let tick = this.svg
        .select(".x-axis")
        .attr(
          "transform",
          `translate(0,${this.dimension.height - this.dimension.margin.bottom})`
        )
        .call(
          d3
            .axisBottom(this.x)
            .ticks(this.dimension.boundedWidth / 30)//by increasing the number (30) we can reduce the number of hours on the x axis for smaller width charts
            .tickFormat(this.formatTickTime)
            .tickSizeInner(4)
            .tickPadding(4)
        )
        .call((g) => g.select(".domain").remove())
        .selectAll(".tick");

      if (this.hideDateAxis) {
        tick.select("text").attr("text-anchor", (d, i, n) => {
          if (i === 0) return "start";
          if (i === n.length - 1) return "end";
          return "middle";
        });
      } else if (this.hideTimeAxis) {
        tick.filter((t) => t.getHours() !== 0).remove();
        tick.select("text").attr("text-anchor", (d, i, n) => {
          if (i === 0) return "start";
          if (i === n.length - 1) return "end";
          return "middle";
        });
      } else {
        tick = tick
          .filter((t) => t.getHours() === 0)
          .call((g) => g.select("line").attr("y2", 16))
          .call((g) =>
            g
              .select("text")
              .attr("y", 20)
              .attr("text-anchor", (d, i, n) => {
                if (i === 0) return "start";
                if (i === n.length - 1) return "end";
                return "middle";
              })
          );
      }
    }

    // Y axis
    if (!this.hideYAxis) {
      const yAxisTitle = this.displayData.unit;
      this.svg
        .select(".y-axis")
        .attr("transform", `translate(${this.dimension.margin.left},0)`)
        .call(
          d3
            .axisRight(this.y)
            .ticks(this.dimension.boundedHeight / 50)
            .tickSizeInner(4)
            .tickPadding(4)
        )
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g.select(".tick:last-of-type text").text(function () {
            return `${d3.select(this).text()}${yAxisTitle}`;
          })
        );
    }

    // Current time circle
    this.svg.select(".current-time-circle").attr("transform", () => {
      const x = this.x(this.displayData.currentTime);
      const y = this.findYatXbyBisection(
        x,
        this.svg.select(".tide-line-path").node()
      );
      return `translate(${x},${y})`;
    });
  }

  addHover() {
    this.svg.on("mousemove", this.moved).on("mouseleave", this.left);
    this.hovered = null;
  }

  moved(event) {
    const pointer = d3.pointer(event, this.svg.node());
    const xm = this.x.invert(pointer[0]);
    const i = d3.bisectCenter(
      this.displayData.tidesTimes,
      xm,
      1,
      this.displayData.tidesTimes.length - 1
    );
    const d = this.displayData.tides[i];
    if (d !== this.hovered) {
      this.hovered = d;
      const time = d.time.toFormat("H':'mm");
      const date = d.time.toFormat("d LLL");
      const value = d3.format(".2f")(d.value);
      this.tooltip.show(`
        <div class="date-time ${d.isLow ? "is-low" : ""}">
          <div>${time}</div>
          <div>${date}</div>
        </div>
        <div>${value} ${this.displayData.unit}</div>
      `);
      const target = this.svg
        .select(".tides-g")
        .selectAll(".tide-g")
        .filter((e) => e === d)
        .select(".tide-circle");
      this.tooltip.move({ target });
    }
  }

  left() {
    this.tooltip.hide();
    this.hovered = null;
  }

  // https://stackoverflow.com/a/17896375/7612054
  findYatXbyBisection(x, path, error) {
    var length_end = path.getTotalLength(),
      length_start = 0,
      point = path.getPointAtLength((length_end + length_start) / 2), // get the middle point
      bisection_iterations_max = 50,
      bisection_iterations = 0;

    error = error || 0.01;

    while (x < point.x - error || x > point.x + error) {
      // get the middle point
      point = path.getPointAtLength((length_end + length_start) / 2);

      if (x < point.x) {
        length_end = (length_start + length_end) / 2;
      } else {
        length_start = (length_start + length_end) / 2;
      }

      // Increase iteration
      if (bisection_iterations_max < ++bisection_iterations) break;
    }
    return point.y;
  }
}
