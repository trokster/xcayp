{
  "version": 0.02,
  "module_type":"core",
    "mixins": ["isDisplayComponent", "canRespawn", "hasPaper", "handlesTap"],
    "init": function() {
    var self = this;
    var d = getViewportDimensions();

    self.getPaper(function(paper) {

      self.shapes.text = paper.text(0, 0, self.params.label || "Button");
      self.shapes.text.attr({
        "fill": "white",
          "stroke-width": .5,
          "stroke": "white",
          "stroke-opacity": .2,
          "font-size": 12,
          "font-family": "Arial, Helvetica, sans-serif",
          "fill-opacity": .8,
          "font-weight": "normal",
          "transform": "T" + (self.width / 2) + "," + (-self.height * 2)
      });

      if (self.params.attrs_text) self.shapes.attr(self.params.attrs_text);

      self.shapes.rect = paper.rect(0, -self.width * 2, 20, 20, self.params.round || 5);
      self.shapes.rect.attr({
        "fill": "30-black-darkblue",
          "stroke": "gray",
          "stroke-width": self.border,
          "cursor": "pointer"
      });

      if (self.params.attrs_rect) self.shapes.attr(self.params.attrs_rect);

      self.optimal_width = self.minimum_width = d.w * self.params.minimum_height_ratio;

      self.handleEvent("window.resize", function() {
        var d = getViewportDimensions();
        self.params.minimum_height_ratio = self.params.minimum_height_ratio || .1;

        self.optimal_width = self.minimum_width = d.w * self.params.minimum_height_ratio;
      });

      self.shapes.text.insertAfter(self.shapes.rect);


    });
  },
    "doLayout": function() {

    var self = this;
    var d = getViewportDimensions();
    self.params.label_ratio = self.params.label_ratio || .6;

    if (isUndefinedOrNull(self.paper) || isUndefinedOrNull(self.shapes.rect) || isUndefinedOrNull(self.shapes.text)) return;

    self.lock.acquire().addCallback(function() {

      self.shapes.rect.animate({
        x: self.x + self.border,
        y: self.y + self.border,
        width: self.width - self.border * 2,
        height: self.height - self.border * 2
      }, self.raphAnimDelay, self.raphAnimType);



      for (var i = 2; i < 200; i++) {
        self.shapes.text.attr({
          "font-size": i
        });

        var bb = self.shapes.text.getBBox();

        if ((bb.height > ((self.height - self.border * 2) * self.params.label_ratio)) || (bb.width > ((self.width - self.border * 2) * self.params.label_ratio))) {
          break;
        }
      }

      self.shapes.text.attr({
        "font-size": i
      });

      var bb = self.shapes.text.getBBox();

      self.shapes.text.animate({
        "transform": "T" + (self.x + self.width / 2) + "," + (self.y + self.height / 2)
      }, self.raphAnimDelay, self.raphAnimType);


      eve("delayed.0.interface.response_do_layout." + self._id + "." + self.name);
      self.lock.release();

    });
  }
}
