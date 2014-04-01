{
  "module_type" : "core",
  "init": function() {

    var TOLERANCE_X = 10,
      TOLERANCE_Y = 10,
      TOLERANCE_ROTATION = 10,
      TOLERANCE_ALCOHOL = 0.5,
      TAP_INTERVAL_LIMIT = 250,
      LONG_INTERVAL_LIMIT = 800,
      DRAGSPEED = 2.5,
      MOVE_TOLERANCE = .1,
      TOUCH_TOLERANCE = 10,
      MULTITOUCH_THROTTLE = 50;

    this.handleEvent("window.resize", this.handleWindowResize);
    //zIndex should be among the highest
    //this is only for testing purposes

    this.zIndex = 99999;

    var self = this;

    this.pointers = {};
    this.opaque = false;

    this.handleWindowResize();

    self.Touches = {
      taps: null,
      tap: null,
      multipoint: false,
      drag: null,
      dragging: false
    };



    //Determines centroid from an array of points
    var calculate_centroid = function(points) {
      var xs = [],
        ys = [];
      map(function(ptr) {
        xs.push(ptr.x);
        ys.push(ptr.y);
      }, points);

      return {
        x: mean(xs),
        y: mean(ys)
      };
    };
    //Returns bounding box for an array of points
    var calc_bbox = function(pointers) {
      var xs = [],
        ys = [];
      map(function(ptr) {
        xs.push(ptr.x);
        ys.push(ptr.y);
      }, pointers);

      return {
        xmin: listMin(xs),
        xmax: listMax(xs),
        ymin: listMin(ys),
        ymax: listMax(ys)
      };
    }

    //Computes difference in scale between 2 bboxes
    var bbox_scale = function(bb0, bb1) {
      //log("Computing scale: " + JSON.stringify([bb0, bb1]));
      //return {
      //  x: (bb0.xmax - bb1.xmin) == 0 ? 1 : Math.abs((bb1.xmax - bb1.xmin) / (bb0.xmax - bb1.xmin)),
      //  y: (bb0.ymax - bb1.ymin) == 0 ? 1 : Math.abs((bb1.ymax - bb1.ymin) / (bb0.ymax - bb1.ymin))
      //};
      var l0 = Math.sqrt(Math.pow(bb0.xmax - bb0.xmin, 2) + Math.pow(bb0.ymax - bb0.ymin, 2));
      var l1 = Math.sqrt(Math.pow(bb1.xmax - bb1.xmin, 2) + Math.pow(bb1.ymax - bb1.ymin, 2));
      var ratio = l0 == 0 ? 1 : l1 / l0;
      return ratio;
    }

    //Pointer handling
    //We keep it simple:
    //SINGLE TOUCH EVENTS: taps / longtap / drag & drop
    //MULTI TOUCH EVENTS:  swipe ( can be one ) / rotate / zoom
    //Multi touch events have overwhelming priorities as follows:
    //translation -> scale -> rotation

    PointerDraw(this.div, function(tgt, id, x, y) {
      //Handle touch start      
      var t = new Date().getTime();

      self.pointers[id] = {
        initial: {
          x: x,
          y: y,
          t: t
        },
        current: {
          x: x,
          y: y,
          t: t
        },
        uuid: Raphael.createUUID()
      };

      if (keys(self.pointers).length > 1) {
        //if multiple touch points, cancel all tap/long taps/drags
        //canceling taps
        try {
          self.Touches.tap.cancel();
          delete(self.Touches.tap);
          delete(self.Touches.taps);
        } catch (e) {
          noop()
        }
        //Cancelling drags
        if (self.Touches.dragging) {
          self.Touches.dragging = false;
          eve("interface.touch_events.drag.cancel", self.Touches.draginfo);
          eve("interface.touch_events.drag.end", self.Touches.draginfo);
          delete(self.Touches.draginfo);
        }

        try {
          self.Touches.drag.cancel();
        } catch (e) {
          noop()
        }

        if (!self.Touches.multipoint) {
          self.Touches.multipoint = true;
          //log("multipoint on", 1);
        }

      } else {

        var initial_coords = PouchDB.utils.extend(true, {}, self.pointers[id]);

        //Trigger drag listener
        self.Touches.drag = callLater(LONG_INTERVAL_LIMIT / 1000, function() {
          //Check if the pointer is still there
          if (isUndefinedOrNull(self.pointers[id])) return;
          if (initial_coords.uuid != self.pointers[id].uuid) return;

          if (Math.abs(initial_coords.initial.x - self.pointers[id].current.x) > TOUCH_TOLERANCE) return;
          if (Math.abs(initial_coords.initial.y - self.pointers[id].current.y) > TOUCH_TOLERANCE) return;

          self.Touches.dragging = true;
          self.Touches.draginfo = {
            initial: initial_coords,
            current: initial_coords,
            uuid: Raphael.createUUID()
          };

          eve("interface.touch_events.drag.start", self.Touches.draginfo);
        });
      }

      //Initialize centroid
      //Parse through initial_multipoint to see if any
      //Or if big movement occured from start
      //If no central_multipoint, create a new one
      if (isUndefinedOrNull(self.Touches.multipoint_init)) {
        self.Touches.multipoint_init = PouchDB.utils.extend(true, {}, self.pointers);
      } else {
        //Is init_multipoint still valid ?
        var initial_points_moved = false,
          initial_points_invalid = false;
        for (var i = 0; i < keys(self.Touches.multipoint_init).length; i++) {
          var idx = keys(self.Touches.multipoint_init)[i];
          var point = self.pointers[idx];

          if (isUndefinedOrNull(point)) {
            initial_points_invalid = true;
            break;
          }

          if (point.uuid != self.Touches.multipoint_init[idx].uuid) {
            initial_points_invalid = true;
            break;
          }

          if (Math.abs(point.current.x - point.initial.x) > TOUCH_TOLERANCE) {
            initial_points_moved = true;
          }
          if (Math.abs(point.current.y - point.initial.y) > TOUCH_TOLERANCE) {
            initial_points_moved = true;
          }
        }

        if (initial_points_invalid) {
          //re-initialize with current pointers
          self.Touches.multipoint_init = PouchDB.utils.extend(true, {}, self.pointers);
          self.Touches.multipoint_final = {};
        } else if (initial_points_moved) {
          //Points moved, keep initial points
        } else {
          //Points have not moved, re-initialize with current points
          self.Touches.multipoint_init = PouchDB.utils.extend(true, {}, self.pointers);
          self.Touches.multipoint_final = {};
        }
      }

      //Calculate centroid
      self.Touches.centroid = calculate_centroid(map(function(item) {
        return self.Touches.multipoint_init[item].current;
      }, keys(self.Touches.multipoint_init)));



    }, function(tgt, id, x, y) {
      //Handle touch move      
      self.pointers[id].current.x = x;
      self.pointers[id].current.y = y;
      self.pointers[id].current.t = new Date().getTime();

      if (self.Touches.dragging) {
        self.Touches.draginfo.current = PouchDB.utils.extend(true, {}, self.pointers[id].current);
        self.Touches.draginfo.uuid = Raphael.createUUID();
        eve("interface.touch_events.drag.move", self.Touches.draginfo);
        return;
      }
      //No requirement to calculate centroid for now
      //This may change if realtime feedback needed for
      //translation / pinch / rotation
      //Right now i have no use, drag is enuff



    }, function(tgt, id) {
      //Handle touch end
      self.pointers[id].current.t = new Date().getTime();

      if (!self.Touches.multipoint) {
        //Handling case when we have only one pointer
        if (self.Touches.dragging) {
          if (Math.abs(self.pointers[id].current.x - self.pointers[id].initial.x) < TOUCH_TOLERANCE && Math.abs(self.pointers[id].current.y - self.pointers[id].initial.y) < TOUCH_TOLERANCE) {
            eve("interface.touch_events.longtap", {
              x: self.pointers[id].initial.x,
              y: self.pointers[id].initial.y,
              t: self.pointers[id].current.t,
              uuid: Raphael.createUUID()
            });

          }

          self.Touches.draginfo.current.t = self.pointers[id].current.t;
          self.Touches.draginfo.uuid = Raphael.createUUID();
          eve("interface.touch_events.drag.end", self.Touches.draginfo);
          //Cancelling drags
          try {
            self.Touches.drag.cancel();
          } catch (e) {
            noop()
          }
          delete(self.Touches.drag);
          self.Touches.dragging = false;
          delete(self.pointers[id]);
          //Remove multipoint_init
          delete(self.Touches.multipoint_init);
          return;

        }


        if (Math.abs(self.pointers[id].current.x - self.pointers[id].initial.x) < TOUCH_TOLERANCE && Math.abs(self.pointers[id].current.y - self.pointers[id].initial.y) < TOUCH_TOLERANCE) {
          var tap_duration = self.pointers[id].current.t - self.pointers[id].initial.t;

          if (tap_duration < LONG_INTERVAL_LIMIT) {
            var uuid = Raphael.createUUID();
            //We keep it simple: if tap doesnt have same coordinates as previous
            //tap, trigger previous tap, store this one
            if (isUndefinedOrNull(self.Touches.taps)) {
              self.Touches.taps = {
                taps: 1,
                x: self.pointers[id].initial.x,
                y: self.pointers[id].initial.y,
                t: self.pointers[id].current.t,
                uuid: uuid
              };
              var taps = PouchDB.utils.extend(true, {}, self.Touches.taps);
              self.Touches.tap = callLater(TAP_INTERVAL_LIMIT / 1000, function() {
                eve("interface.touch_events.tap", taps);
                delete(self.Touches.tap);
                delete(self.Touches.taps);
              });
              delete(self.pointers[id]);
              //Remove multipoint_init
              delete(self.Touches.multipoint_init);
              return;

            } else {
              if ((self.pointers[id].current.t - self.Touches.taps.t) < TAP_INTERVAL_LIMIT) {
                if (Math.abs(self.pointers[id].initial.x - self.Touches.taps.x) < TOUCH_TOLERANCE) {
                  if (Math.abs(self.pointers[id].initial.y - self.Touches.taps.y) < TOUCH_TOLERANCE) {

                    try {
                      self.Touches.tap.cancel();
                      self.Touches.taps.taps++;
                      self.Touches.taps.t = self.pointers[id].current.t;
                      var taps = PouchDB.utils.extend(true, {}, self.Touches.taps);
                      self.Touches.tap = callLater(TAP_INTERVAL_LIMIT / 1000, function() {
                        eve("interface.touch_events.tap", taps);
                        delete(self.Touches.tap);
                        delete(self.Touches.taps);
                      });
                    } catch (e) {
                      self.Touches.taps = {
                        taps: 1,
                        x: self.pointers[id].initial.x,
                        y: self.pointers[id].initial.y,
                        t: self.pointers[id].current.t,
                        uuid: uuid
                      };
                      var taps = PouchDB.utils.extend(true, {}, self.Touches.taps);
                      self.Touches.tap = callLater(TAP_INTERVAL_LIMIT / 1000, function() {
                        eve("interface.touch_events.tap", taps);
                        delete(self.Touches.tap);
                        delete(self.Touches.taps);
                      });
                    }
                  }
                }
              }
              delete(self.pointers[id]);
              //Remove multipoint_init
              delete(self.Touches.multipoint_init);
              delete(self.Touches.multipoint_final);
              return;
            }
          }

        }
      }
      //Handle generic centroid behavior

      //If only one pointer left, we cancel multipoint
      if (self.Touches.multipoint && keys(self.pointers).length == 1) {
        self.Touches.multipoint = false;
        //log("multipoint off", -1);

      }

      //We keep things simple again by taking only into account
      //movements from initial centroid

      if (isUndefinedOrNull(self.Touches.multipoint_final)) self.Touches.multipoint_final = {};
      //console.log("TEST: " + JSON.stringify(self.Touches.multipoint_init) + " :: " + JSON.stringify(self.pointers[id]));
      if (!isUndefinedOrNull(self.Touches.multipoint_init[id]) && self.Touches.multipoint_init[id].uuid == self.pointers[id].uuid) {
        //console.log("Setting final");
        self.Touches.multipoint_final[id] = PouchDB.utils.extend(true, {}, self.pointers[id]);
      }

      //If only one pointer left, means gesture just ended, time to analyze it
      if (keys(self.pointers).length == 1) {
        //log("Gesture analysis", -1);

        //pull final centroid
        var final_points = [];
        for (var i = 0; i < keys(self.Touches.multipoint_final).length; i++) {
          var idx = keys(self.Touches.multipoint_final)[i];

          final_points.push(self.Touches.multipoint_final[idx].current);

        }
        var final = calculate_centroid(final_points);
        var initial = self.Touches.centroid;

        //log("initial: " + JSON.stringify(initial) + " final :: " + JSON.stringify(final));


        if (Math.abs(final.x - initial.x) > 50 || Math.abs(final.y - initial.y) > 50) {
          //if translation is valid, we consider the event a translate
          var xx = final.x - initial.x;
          var yy = final.y - initial.y;
          var magnitude = Math.sqrt(xx * xx + yy * yy);
          var direction = null;

          //OK, let's see which way its pointing
          if (Math.abs(yy) > Math.abs(xx)) {
            //Handling vertical move
            direction = yy > 0 ? "down" : "up";
          } else {
            //Handling horizontal move
            direction = xx > 0 ? "right" : "left";
          }

          eve("interface.touch_events.translation", {
            x: initial.x,
            y: initial.y,
            magnitude: magnitude,
            vx: final.x - initial.x,
            vy: final.y - initial.y,
            direction: direction
          });
        } else {
          if (keys(self.Touches.multipoint_init).length > 1) {
            //explore scaling

            var bbox_initial = calc_bbox(map(function(item) {
              return self.Touches.multipoint_init[item].initial;
            }, keys(self.Touches.multipoint_init)));
            var bbox_final = calc_bbox(final_points);

            var ratio = bbox_scale(bbox_initial, bbox_final);

            if (Math.abs(ratio - 1) > 0.2) {
              eve("interface.touch_events.scale", {
                x: initial.x,
                y: initial.y,
                uuid: Raphael.createUUID(),
                ratio: ratio
              });

            } else {
              //explore rotation
              var id_ref = keys(self.Touches.multipoint_init)[0];

              var p1 = self.Touches.multipoint_init[id_ref].initial;
              var p2 = self.Touches.multipoint_final[id_ref].current;

              var a1 = Math.atan2(p1.y - initial.y, p1.x - initial.x) * 180 / Math.PI;
              var a2 = Math.atan2(p2.y - initial.y, p2.x - initial.x) * 180 / Math.PI;

              var rotation = a2 - a1;

              eve("interface.touch_events.rotation", {
                x: initial.x,
                y: initial.y,
                rotation: rotation
              });
            }

          }
        }




        //Remove multipoint_init
        delete(self.Touches.multipoint_init);
        delete(self.Touches.multipoint_final);

      }

      delete(self.pointers[id]);
    });



    ////////////////////////////////////////////////
    //Mouse wheelies
    ////////////////////////////////////////////////
    connect(this.div, "onmousewheel", function(evt) {
      if (Math.abs(evt.mouse().wheel.y) < .5) return;
      eve("buffered.100.interface.mouse.wheel", {
        "direction": evt.mouse().wheel.y > 0 ? "down" : "up",
          "x": evt.mouse().client.x,
          "y": evt.mouse().client.y
      });
    });

    //Translating into tap events for interface ( put this somewhere else at some point )
    self.handleEvent("interface.mouse.wheel", function() {
      //console.log("Mouse wheel: " + this.direction)
      //log("Mouse wheel: " + this.direction);

      var evt = PouchDB.utils.extend(true, {}, this);
      //Translate into taps 
      evt.taps = this.direction == "up" ? 2 : 3;
      evt.uuid = Raphael.createUUID();

      eve("interface.touch_events.tap", evt);
    });

    self.handleEvent("interface.touch_events.scale", function() {
      var evt = PouchDB.utils.extend(true, {}, this);
      //Translate into taps 
      evt.taps = this.ratio > 1 ? 2 : 3;
      evt.uuid = Raphael.createUUID();

      eve("interface.touch_events.tap", evt);
    });


    /*self.handleEvent("interface.touch_events.scale", function() {
      log("Scale event:\n" + JSON.stringify(this), -1);
    });
    */
    /*self.handleEvent("interface.touch_events.rotation", function() {
      log("Rotation event:\n" + JSON.stringify(this), -1);
    });
    self.handleEvent("interface.touch_events.translation", function() {
      log("Translation event:\n" + JSON.stringify(this), -1);
    });
		*/


    self.handleEvent("interface.hide_ui", function() {
      self.opaque = true;
      //self.div.style.opacity = .7;
      Opacity(self.div, {
        from: 0,
        to: .7,
        duration: .1,
        transition: "sinusoidal"
      });
    });

    self.handleEvent("interface.show_ui", function() {
      self.opaque = false;
      Opacity(self.div, {
        from: .7,
        to: 0,
        duration: .1,
        transition: "sinusoidal"
      });
    });

    self.handleEvent("interface.centroid", function() {
      var pt = this;
      window.INTERFACE_OBJECT_REFERENCE["interface.overlay_paper.overlay_paper0"].paper.circle(pt.x, pt.y, 10)
        .attr({
        "fill": pt.color ? pt.color : "yellow",
          "fill-opacity": .5,
          "stroke": "none"
      })
        .animate({
        "fill-opacity": 0
      }, 500, ">>", function() {
        this.remove()
      });
    });

    log("Touch ready", -1);

  },
    "cleanup": function() {
    try {
      disconnectAll(this.div);
    } catch (e) {}
  },
    "handleWindowResize": function() {
    //console.log(this.name + " in windowResizeHandler");
    var d = getViewportDimensions();
    setStyle(this.div, {
      "border": "solid red 1px",
        "backgroundColor": "black", //"transparent"
      "zIndex": this.zIndex,
        "opacity": 0
    });
    this.setDimensions(d.w, d.h);
    this.setPosition(0, 0);

  },
    "border": 0,
    "mixins": ["hasDiv", "canRespawn"],
    "contributtions": {
    "Anton Chekov": "Single pointer behavior --> refactored",
      "chidwin": "Path storage --> refactored, but may come back ( gesture/shape recognition )"
  }
}
