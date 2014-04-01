{
  "mixins": ["isDisplayComponent", "hasPaper"],
  "module_type":"core",
    "init": function() {

    var self = this;
    self.border = 0;
    self.minimum_height = self.minimum_height || 20;
    self.minimum_width = self.minimum_width || 20;

    eve("interface.request_handle.overlay_paper.overlay_paper0", function(oo) {
      self.paper = oo.paper;
    });

    self.handleEvent("window.resize", function() {
      var d = getViewportDimensions();
      if (.1 * d.h > 50 && self.minimum_height != .1 * d.h) {
        self.minimum_height = .1 * d.h;
        self.optimal_height = .1 * d.h;

        self._dirty = true;
        eve("buffered.100.interface.layout_request_root." + self._id + "." + self.name, false);
      }
    });
  },
    "doLayout": function() {
    var self = this;
    if (isUndefinedOrNull(self.paper)) return;
    this.lock.acquire().addCallback(function() {
      if (isUndefinedOrNull(self.shapes.rect)) {

        self.shapes.rect = self.paper.rect(0, 0, 100, 100, 10).attr({
          "fill": "30-black-#263613",
            "fill-opacity": 0,
            "stroke-opacity": 1,
            "stroke-width": 0,
            "stroke": "white"
        });

        self.shapes.title = self.paper.print(0, 0, "XCAYP 0.2", self.paper.getFont("whoa"), 500).attr({
          fill: "30-#fff-yellow",
            "stroke": "gray",
            "stroke-width": 4
        });
        self.shapes.subtext = self.paper.print(0, 0, "Sync rules all", self.paper.getFont("whoa"), 70).attr({
          fill: "30-#fff-yellow",
            "stroke": "white",
            "stroke-width": 0
        });

        self.title_bbox = self.shapes.title.getBBox();
        self.subtext_bbox = self.shapes.subtext.getBBox();

        self.original_width = self.width;
        self.original_height = self.height;

        //Set minimas
        self.minimum_width = self.minimum_width || 20;
        self.minimum_height = self.minimum_height || 20;

      }

      self.shapes.rect.animate({
        x: self.x + self.border,
        y: self.y + self.border,
        width: self.width - self.border * 2,
        height: self.height - self.border * 2,
          "stroke-width": self.border,
          "fill-opacity": 1,
          "stroke-opacity": 1

      }, self.raphAnimDelay, self.raphAnimType);


      //Height of title should be less than 80% of height
      //Width of title should be less than 80% of width

      //Calculate highest ratio
      var xratio = self.width * 0.7 / self.title_bbox.width;
      var yratio = self.height * 0.7 / self.title_bbox.height;

      var ratio = xratio <= yratio ? xratio : yratio;

      var previous_title_transform = self.shapes.title.attr("transform");
      var previous_sub_transform = self.shapes.subtext.attr("transform");

      self.shapes.title.attr({
        "transform": "S" + ratio + "," + ratio
      });
      self.shapes.subtext.attr({
        "transform": "S" + ratio + "," + ratio
      });

      var bb_title = self.shapes.title.getBBox();
      var bb_subtext = self.shapes.subtext.getBBox();

      self.shapes.title.attr({
        "transform": previous_title_transform
      });
      self.shapes.subtext.attr({
        "transform": previous_sub_transform
      });

      self.shapes.title.animate({
        "transform": "S" + ratio + "," + ratio + "T" + (self.x - bb_title.x + self.width / 2 - bb_title.width / 2) + "," + (self.y - bb_title.y + self.height / 2.4 - bb_title.height / 2)
      }, self.raphAnimDelay, self.raphAnimType);

      self.shapes.subtext.animate({
        "transform": "S" + ratio + "," + ratio + "T" + (self.x - bb_subtext.x + self.width / 2 - bb_subtext.width / 2) + "," + (self.y - bb_subtext.y + self.height * .95 - bb_subtext.height)
      }, self.raphAnimDelay, self.raphAnimType);

      eve("delayed.0.interface.response_do_layout." + self._id + "." + self.name);
      self.lock.release();
    });
  }
}
