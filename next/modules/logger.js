{
  "module_type":"core",
  "init": function() {
    var self = this;
    var gutter = 13;
    var border = 1;
    var container = this.container = DIV({
      style: {
        "position": "absolute",
          "zIndex": 10000,
          "border": "solid red 0px"
      }
    });
    var messages = self.messages = [];
    self.currently_displayed = null;
    self.messaging = false;
    //Flag to indicate if a respawn is requested
    //This is to cleanly exit animations and have no other issues
    self.respawn = false;
    appendChildNodes(currentDocument().body, container);
    setElementPosition(container, {
      x: 400,
      y: 20
    });
    setElementDimensions(container, {
      w: 200,
      h: 100
    });
    var paper = this.paper = Raphael(container);
    //log("Drawing rect ");
    self.background = background = paper.rect(border / 2, border / 2, 20, 20, 5);
    self.text = paper.text(0, 0, "...");
    self.text.attr({
      "fill": "white",
        "stroke": "white",
        "stroke-width": 1,
        "stroke-opacity": 0,
        "fill-opacity": 0,
      //'text-anchor': 'start',
      //"font-weight": "bold",
      "font-size": 10,
        "font-family": "Verdana" //"Arial, Helvetica, sans-serif"
    });
    //log("Initializing");
    this.background.attr({
      "fill": "30-#163E4F-#4281B8",
        "fill-opacity": 0,
        "stroke-width": border,
        "stroke-opacity": .7,
        "stroke": "white"
    });
    self.count = paper.text(0, 0, "0").attr({
      "fill": "white",
        "stroke": "black",
        "stroke-width": 1,
        "stroke-opacity": 0,
        "fill-opacity": 0,
      //'text-anchor': 'start',
      "font-weight": "bold",
        "font-size": 9,
        "font-family": "Verdana"
    });
    var message = this.message = function() {
      self.messages.unshift(this);
      self.display();
    };
    var display = self.display = function() {
      if (self.messaging || self.messages.length == 0) {
        return;
      }
      self.messaging = true;
      showElement(self.container);
      var d = getViewportDimensions();
      var o = self.messages.pop();
      self.currently_displayed = o;
      var duration = o.text.length * 50;
      duration = duration < 500 ? 500 : duration;
      duration = duration > 1000 ? 3000 : duration;
      var max_width = d.w * .6 / 8;
      max_width = max_width > (500 / 8) ? (500 / 8) : max_width;
      self.text.attr({
        text: window.wordwrap(o.text, max_width)
      });
      self.count.attr({
        "text": "[" + self.messages.length + "]"
      });
      if (o.severity == 1) {
        self.background.attr({
          "fill": "30-#1F0610-#ED454D",
            "fill-opacity": 0,
            "stroke-width": border,
            "stroke-opacity": .7,
            "stroke": "#1F0610"
        });
      } else if (o.severity == -1) {
        self.background.attr({
          "fill": "30-#1E211C-#31A626",
            "fill-opacity": 0,
            "stroke-width": border,
            "stroke-opacity": .7,
            "stroke": "#1E211C"
        });
      } else {
        self.background.attr({
          "fill": "30-#163E4F-#4281B8",
            "fill-opacity": 0,
            "stroke-width": border,
            "stroke-opacity": .7,
            "stroke": "#163E4F"
        });
      }
      var bb = self.text.getBBox(true);
      self.text.attr({
        "transform": "t" + (-bb.x + gutter) + "," + (-bb.y + gutter)
      });
      self.count.attr({
        "transform": "t" + (bb.width / 2 + gutter) + "," + (bb.height + gutter * 2)
      });
      paper.setSize(gutter * 2 + bb.width + border * 2, gutter * 2 + bb.height + 10 + border * 2);
      setElementDimensions(container, {
        w: gutter * 2 + bb.width + border * 2,
        h: gutter * 2 + bb.height + 10 + border * 2
      });
      setElementPosition(container, {
        x: d.w / 2 - bb.width / 2 - gutter,
        y: 20
      });
      background.attr({
        width: gutter * 2 + bb.width + border,
        height: gutter * 2 + bb.height + 10 + border
      });
      background.animate({
        "0%": {
          "fill-opacity": 0,
            "stroke-opacity": 0
        },
          "10%": {
          "fill-opacity": .8,
            "stroke-opacity": .2
        },
          "90%": {
          "fill-opacity": .4,
            "stroke-opacity": .7
        },
          "100%": {
          "fill-opacity": 0,
            "stroke-opacity": 0
        }
      }, duration);
      self.count.animate({
        "0%": {
          "fill-opacity": 0,
            "stroke-opacity": 0
        },
          "10%": {
          "fill-opacity": .2,
            "stroke-opacity": 0
        },
          "90%": {
          "fill-opacity": .6,
            "stroke-opacity": 0
        },
          "100%": {
          "fill-opacity": 0,
            "stroke-opacity": 0
        }
      }, duration);
      self.text.animate({
        "0%": {
          "fill-opacity": 0,
            "stroke-opacity": 0
        },
          "10%": {
          "fill-opacity": .4,
            "stroke-opacity": 0
        },
          "90%": {
          "fill-opacity": .6,
            "stroke-opacity": 0
        },
          "100%": {
          "fill-opacity": 0,
            "stroke-opacity": 0,
            "callback": function() {
            self.currently_displayed = null;
            hideElement(self.container);
            self.messaging = false;
            if (self.respawn) {
              self.text.stop();
              var cb = function() {
                eve("interface.request.logger", {
                  id: name
                });
                eve.once("interface.response.logger." + self.name, function() {
                  iextend(this.obj.messages, list(self.messages));
                  this.obj.messages.push({
                    "text": "Logger respawn Complete.",
                    severity: -1
                  });
                  this.obj.display();
                });
              };
              eve("interface.remove.logger." + self.name, {
                callback: cb
              });
            } else {
              self.display();
            }
          }
        }
      }, duration);
    };
    this.cleanup = function() {
      map(function(item) {
        item.stop();
      }, [self.text, self.count, self.background]);
      eve.off("interface.log", message);
      paper.remove();
      removeElement(container);
    };
    eve.once("database.change.interfacedb.logger", function() {
      self.respawn = true;
    });
    eve.on("interface.log", message);
    //log("Running Diagnostics on logger");
    //log("Testing severity\nExtremely important message! ( mostly ERRORS )", 1);
    //log("Testing severity\nOK So this one is important info", -1);
    //log("Testing severity\nThis is your stock sublimlinal chatter");
    //self.display();
    log("Logger ready...");
  }
}
