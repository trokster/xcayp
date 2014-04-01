{
  "module_type":"core",
  "init": function() {
    this.handleEvent("window.resize", this.handleWindowResize);
    //zIndex should be among the highest
    //this is only for testing purposes

    this.zIndex = 9999;

    var self = this;

    this.paper = Raphael(this.div, 0, 0, 50, 50);
    this.handleWindowResize();

  },
    "handleWindowResize": function() {
    //console.log(this.name + " in windowResizeHandler");
    var d = getViewportDimensions();
    setStyle(this.div, {
      "border": "solid red " + this.border + "px",
        "backgroundColor": "transparent",
        "zIndex": this.zIndex
    });

    this.setDimensions(d.w, d.h);
    this.paper && this.paper.setSize(d.w, d.h);
    this.setPosition(0, 0);

  },
    "border": 0,
    "mixins": ["hasDiv", "canRespawn"],
    "cleanup": function() {
    try {
      //More error prevention needs to take place here
      this.paper.remove();
    } catch (e) {}
  }
}
