class VisTooltip {
  constructor({ container, direction }) {
    this.container = container;
    this.direction = direction;
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.move = this.move.bind(this);
    this.init();
  }

  init() {
    this.container.classed("vis-tooltip-parent", true);
    this.tooltipBox = this.container
      .append("div")
      .attr("class", "vis-tooltip-box");
    this.tooltipContent = this.tooltipBox
      .append("div")
      .attr("class", "vis-tooltip-content");
    this.tooltipArrow = this.tooltipBox
      .append("div")
      .attr("class", "vis-tooltip-arrow");
    this.offset = 6;
  }

  show(html) {
    this.tooltipContent.html(html);
    this.tooltipBox.classed("is-visible", true);
    this.tooltipBCR = this.tooltipContent.node().getBoundingClientRect();
    this.containerBCR = this.container.node().getBoundingClientRect();
    return this;
  }

  hide() {
    this.tooltipBox.classed("is-visible", false);
    return this;
  }

  move({ target }) {
    const targetBCR = target.node().getBoundingClientRect();

    let xContent = 0,
      yContent = 0,
      xArrow = 0,
      yArrow = 0;

    let placement;

    if (["right", "left", "horizontal"].includes(this.direction)) {
      // Right
      if (this.direction !== "left") {
        placement = "right";
        xArrow =
          targetBCR.x + targetBCR.width + this.offset - this.containerBCR.x;
        yArrow = targetBCR.y + targetBCR.height / 2 - this.containerBCR.y;
        xContent = xArrow;
        yContent = yArrow - this.tooltipBCR.height / 2;
      }

      // Left
      if (
        this.direction === "left" ||
        xContent + this.tooltipBCR.width > this.containerBCR.width // Not enough space for right
      ) {
        placement = "left";
        xArrow = targetBCR.x - this.offset - this.containerBCR.x;
        yArrow = targetBCR.y + targetBCR.height / 2 - this.containerBCR.y;
        xContent = xArrow - this.tooltipBCR.width;
        yContent = yArrow - this.tooltipBCR.height / 2;
      }

      if (yContent < 0) {
        yContent = 0;
      } else if (yContent + this.tooltipBCR.height > this.containerBCR.height) {
        yContent = this.containerBCR.height - this.tooltipBCR.height;
      }
    }

    if (
      ["top", "bottom", "vertical"].includes(this.direction) ||
      xContent < 0 || // Not enough space for left
      xContent + this.tooltipBCR.width > this.containerBCR.width // Not enough space for right
    ) {
      // Top
      if (this.direction !== "bottom") {
        placement = "top";
        xArrow = targetBCR.x + targetBCR.width / 2 - this.containerBCR.x;
        yArrow = targetBCR.y - this.offset - this.containerBCR.y;
        xContent = xArrow - this.tooltipBCR.width / 2;
        yContent = yArrow - this.tooltipBCR.height;
      }

      // Bottom
      if (
        this.direction === "bottom" ||
        yContent < 0 // Not enough space for top
      ) {
        placement = "bottom";
        xArrow = targetBCR.x + targetBCR.width / 2 - this.containerBCR.x;
        yArrow =
          targetBCR.y + targetBCR.height + this.offset - this.containerBCR.y;
        xContent = xArrow - this.tooltipBCR.width / 2;
        yContent = yArrow;
      }

      if (xContent < 0) {
        xContent = 0;
      } else if (xContent + this.tooltipBCR.width > this.containerBCR.width) {
        xContent = this.containerBCR.width - this.tooltipBCR.width;
      }
    }

    this.tooltipBox.attr("data-placement", placement);
    this.tooltipContent.style(
      "transform",
      `translate(${xContent}px,${yContent}px)`
    );
    this.tooltipArrow.style("transform", `translate(${xArrow}px,${yArrow}px)`);

    return this;
  }
}
