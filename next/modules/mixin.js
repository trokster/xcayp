{
  "version": "0.1",
  "module_type":"core",
  "description": "Class mixins \
    Allows 'interface' definitions... Please note this is not a real mixin implmentation, \
    as it works only in the context of this... mess.",
  "handlesTranslation": function(o) {
    if (window.mixins.initializeMixin(o, "handlesTranslation")) return;
    //Handle touch event
    //We need dimensions/x/y for this one
    setdefault(o, {
      handleTranslation: function(params) {
        //console.log(this.name + " :: OK, been swiped...");
        params.area = self.width * self.height;
        eve("interface.translation_event", {
          id: self._id + "." + self.name,
          params: params
        });
      }
    });
    window.mixins.isPositionable(o);
    window.mixins.isLockable(o);

    var self = o;

    o.handleEvent("interface.touch_events.translation", function() {
      if (!self.can_be_displayed) return;
      if (self.isInBBox(this.x, this.y, 0)) {
        self.handleTranslation(this);
      }
    });

    o.respawn_props.push("handleTranslation");

  },
  "handlesDrag": function(o) {
    if (window.mixins.initializeMixin(o, "handlesDrag")) return;
    //Handle touch event
    //We need dimensions/x/y for this one
    setdefault(o, {
      handleDrag: function(params) {
        var path = params.pointers[params.id].path;

        var p1 = path[path.length - 1];
        var p0 = path[0];


        var v = {
          x: (this._initial_coords.x + (p1.x - p0.x)),
          y: (this._initial_coords.y + (p1.y - p0.y))
        }
        this.setPosition(v.x, v.y);
        eve("buffered.10.interface.request_do_layout." + this._id + "." + this.name);
      }
    });
    window.mixins.isPositionable(o);
    window.mixins.isLockable(o);

    var self = o;

    o.handleEvent("interface.touch_events.drag.*", function() {
      var evt = eve.nt();

      if (evt == "interface.touch_events.drag.start" && self.isInBBox(this.x, this.y, 0)) {
        self._dragged = true;
        self._initial_coords = {
          x: self.x,
          y: self.y
        };
        self.handleDrag(this);
        return;
      } else if (evt == "interface.touch_events.drag.end" && self._dragged) {
        self._dragged = false;
        self.handleDrag(this);
        return;
      } else {
        if (self._dragged) self.handleDrag(this);
      }
    });

    o.respawn_props.push("handleDrag");

  },
  "handlesTap": function(o) {
    if (window.mixins.initializeMixin(o, "handlesTap")) return;
    //Handle touch event
    //We need dimensions/x/y for this one
    setdefault(o, {
      handleTap: function(params) {
        //console.log(this.name + " :: OK, been tapped: x" + params.taps);
        params.area = self.width * self.height;
        eve("interface.tap_event", {
          id: self._id + "." + self.name,
          params: params
        });
      }
    });
    window.mixins.isPositionable(o);
    window.mixins.isLockable(o);

    var self = o;

    o.handleEvent("interface.touch_events.tap", function() {
      if (!self.can_be_displayed) return;
      if (self.isInBBox(this.x, this.y, 0)) {
        self.handleTap(this);
      }
    });

    o.respawn_props.push("handleTap");

  },
    "hasPaper": function(o) {
    if (window.mixins.initializeMixin(o, "hasPaper")) return;

    setdefault(o, {
      paper: null,
      border: 0,
      raphAnimDelay: PHI * 1000 / 2,
      raphAnimType: "bounce",
      shapes: {},
      params: {}
    });

    //Init phase
    //Here we consider that there is always a default overlay_paper0
    //this might need rework at some point, but not sure
    //Maybe pass parent paper as string ?
    if (isUndefinedOrNull(o.paper)) {
      eve("interface.request_handle.overlay_paper.overlay_paper0", function(oo) {
        o.paper = oo.paper;
      });
    }

    o.handleEvent("interface.hide_request." + o._id + "." + o.name, function() {
      if (isUndefinedOrNull(o.disappear)) {
        map(function(s) {
          o.shapes[s].animate({
            "fill-opacity": 0,
              "stroke-opacity": 0
          }, o.raphAnimDelay, "smooth", function() {
            //console.log("Post disappear anim: " + o.id + " :: " + o.can_be_displayed);
            if (o.can_be_displayed) {
              o.shapes[s].attr({
                "fill-opacity": 1,
                  "stroke-opacity": 1
              });
              o.shapes[s].show();
            }
          });
        }, keys(o.shapes));
      } else {
        o.disappear();
      }
    });

    o.handleEvent("interface.appear_request." + o._id + "." + o.name, function() {
      if (isUndefinedOrNull(o.appear)) {
        map(function(s) {
          o.shapes[s].show();
          o.shapes[s].animate({
            "fill-opacity": 1,
              "stroke-opacity": 1
          }, o.raphAnimDelay, "smooth", function() {
            //console.log("Post appear anim: " + o.id + " :: " + o.can_be_displayed);
            if (!o.can_be_displayed) {
              o.shapes[s].attr({
                "fill-opacity": 0,
                  "stroke-opacity": 0
              });
              o.shapes[s].hide();
            }
          });
        }, keys(o.shapes));
      } else {
        o.appear();
      }
    });
    //eve("buffered.500.interface.layout_request_root." + o._id + "." + o.name);

    o.cleanups.push(function() {
      map(function(s) {
        o.shapes[s].stop();
        o.shapes[s].remove();
        delete o.shapes[s];
      }, keys(o.shapes));

    });

    o.respawn_props.push("paper");
    o.respawn_props.push("border");
  },
    "isContainer": function(o) {
    if (window.mixins.initializeMixin(o, "isContainer")) return;

    setdefault(o, {
      //This can in fine be one of ( x+/-, y+/-) ( right to left / left to right, top down etc. )
      direction: "x+",
      //Direction of layout ( breadth first or depth first
      layout_direction: "breadth_first",
      //Space between borders and content
      //May need to specify gutterX/gutterY later on
      gutter: 10,
      //Space between elements
      interval: 2,
      hidden_children: 0,
      sortChildren: function(a, b) {
        try {
          return compare(a.priority, b.priority);
        } catch (e) {
          return compare("" + a.priority, "" + b.priority)
        }
      },
      _dirty: true,
      _handleHierarchyChange: function() {
        var params = this;
        self.lock.acquire().addCallback(function() {
          if (self._being_destroyed || self._destroyed) {
            self.lock.release();
            return;
          }
          self._dirty = true;

          //Handle cases where we need to redefine indexes
          if (params.type == "new" && params.parent.implements("hasDiv") && params.child.implements("hasDiv")) {
            insertSiblingNodesAfter(params.parent.div, params.child.div);
          }
          //if (self.parent) self.parent._dirty = true;
          //console.log("Requesting root layout (hierarchy - false) : " + self.name);
          eve("buffered.0.interface.layout_request_root." + self._id + "." + self.name, false);
          self.lock.release();
        });
      },
      _handleLayoutRequestRoot: function() {
        //Check if self is dirty, if so: recalculate minimum_width for self and set parent to dirty
        if (self._dirty) {

          self.optimal_width = self.gutter * 2;
          self.optimal_height = self.gutter * 2;
          self.minimum_width = self.gutter * 2;
          self.minimum_height = self.gutter * 2;
          if (self.children.length > 0) {

            if (self.layout_direction == "breadth_first") {
              self.minimum_width += self.children[0].minimum_width;
              self.minimum_height += self.children[0].minimum_height;
            } else {
              if (self.direction == "x+") {
                self.minimum_width += self.children[0].minimum_width;
                self.minimum_height += listMax(map(function(c) {
                  return c.minimum_height;
                }, self.children));
              } else {
                self.minimum_width += listMax(map(function(c) {
                  return c.minimum_width;
                }, self.children));
                self.minimum_height += self.children[0].minimum_height;
              }
            }
            if (self.direction == "x+") {
              self.optimal_width += listMax(map(function(c) {
                return c.optimal_width
              }, self.children));

              self.optimal_height += listMax(map(function(c) {
                return c.optimal_height;
              }, self.children));

            }

            if (self.direction == "y+") {
              self.optimal_height += listMax(map(function(c) {
                return c.optimal_height
              }, self.children));

              self.optimal_width += listMax(map(function(c) {
                return c.optimal_width;
              }, self.children));
            }

            //map(function(c) {
            //  self.optimal_width += c.optimal_width;
            //  self.optimal_height += c.optimal_height;
            //}, self.children);

          }
          if (!isUndefinedOrNull(self.parent)) {
            //console.log(self.parent.name + " :: child setting _dirty to true");
            self.parent._dirty = true;
          }
          self._dirty = false;
          //console.log("Recalculating minimas: " + self.name + " :: " + JSON.stringify([self.minimum_width, self.minimum_height]));
        }
        //If we are not root parent, we pass it to parent
        if (!isUndefinedOrNull(self.parent)) {
          eve("interface.layout_request_root." + self.parent._id + "." + self.parent.name, false);
          return;
        } else {
          if (this == true) {
            if (self.children.length > 0) {
              eve("delayed.0.interface.request_do_layout." + self._id + "." + self.name);
            }
          } else {
            eve("buffered.200.interface.layout_request_root." + self._id + "." + self.name, true);
          }
        }
      },
      doLayout: function() {
        //Lock self
        //console.log(self.name + " :: layout in progress");
        eve("interface.minimas_change", self);
        var d = self.lock.acquire();
        d.addCallback(function() {

          if (self._being_destroyed || self._destroyed) {
            self.lock.release();
            return;
          }

          var nb_can_be_displayed = 0;

          var sum_optimal_width = 0;
          var sum_optimal_height = 0;

          var sum_minimum_width = 0;
          var sum_minimum_height = 0;

          //Sort children by priority ( shouldn't have to )
          self.children = sorted(self.children, function(a, b) {
            try {
              return compare(a.priority, b.priority);
            } catch (e) {
              return compare("" + a.priority, "" + b.priority)
            }
          });

          self.hidden_chidren = 0;
          //Compute which elements can be shown
          var clist = [];
          for (var i = 0; i < self.children.length; i++) {
            var c = self.children[i];

            if (self.layout_direction == "breadth_first") {
              //If breadth first, try to stack as much as possible in the first level
              //Then hide what we can't
              if (self.direction == "x+") {
                if (
                ((sum_minimum_width + c.minimum_width) <= (self.width - self.gutter * 2 - i * self.interval)) && (c.minimum_height <= (self.height - self.gutter * 2 - self.interval * i))) {
                  if (c.can_be_displayed != true) {
                    c.can_be_displayed = true;
                    eve("delayed.0.interface.appear_request." + c._id + "." + c.name);
                  }
                  sum_optimal_width += c.optimal_width;
                  sum_optimal_height += c.optimal_height;

                  sum_minimum_width += c.minimum_width;
                  sum_minimum_height += c.minimum_height;

                  nb_can_be_displayed += 1;
                  clist.push(c);
                } else {
                  //Hide those children that can't be displayed
                  for (var j = i; j < self.children.length; j++) {
                    self.hidden_children++;
                    var cc = self.children[j];
                    if (cc.can_be_displayed == true) {
                      cc.can_be_displayed = false;
                      eve("delayed.0.interface.hide_request." + cc._id + "." + cc.name);
                    }
                  }
                  //cut it off here
                  break;
                }
              } else if (self.direction == "y+") {
                if (
                ((sum_minimum_height + c.minimum_height) <= (self.height - self.gutter * 2 - i * self.interval)) && (c.minimum_width <= (self.width - self.gutter * 2 - self.interval * i))) {
                  if (c.can_be_displayed != true) {
                    c.can_be_displayed = true;
                    eve("delayed.0.interface.appear_request." + c._id + "." + c.name);
                  }
                  sum_optimal_width += c.optimal_width;
                  sum_optimal_height += c.optimal_height;

                  sum_minimum_width += c.minimum_width;
                  sum_minimum_height += c.minimum_height;

                  nb_can_be_displayed += 1;
                  clist.push(c);
                } else {
                  //Hide those children that can't be displayed
                  for (var j = i; j < self.children.length; j++) {
                    self.hidden_children++;
                    var cc = self.children[j];
                    if (cc.can_be_displayed == true) {
                      cc.can_be_displayed = false;
                      eve("delayed.0.interface.hide_request." + cc._id + "." + cc.name);
                    }
                  }
                  //cut it off here
                  break;
                }
              }
            } else {
              //If depth first, we go deep first and check children minimas
              if (self.direction == "x+") {
                if (
                ((sum_minimum_width + c.minimum_width) <= (self.width - self.gutter * 2 - i * self.interval)) && (c.minimum_height <= (self.height - self.gutter * 2 - self.interval * i))) {
                  if (c.can_be_displayed != true) {
                    c.can_be_displayed = true;
                    eve("delayed.0.interface.appear_request." + c._id + "." + c.name);
                  }
                  sum_optimal_width += c.optimal_width;
                  sum_optimal_height += c.optimal_height;

                  sum_minimum_width += c.minimum_width;
                  sum_minimum_height += c.minimum_height;

                  nb_can_be_displayed += 1;
                  clist.push(c);
                } else {
                  //Hide those children that can't be displayed
                  for (var j = i; j < self.children.length; j++) {
                    self.hidden_children++;
                    var cc = self.children[j];
                    if (cc.can_be_displayed == true) {
                      cc.can_be_displayed = false;
                      eve("delayed.0.interface.hide_request." + cc._id + "." + cc.name);
                    }
                  }
                  //cut it off here
                  break;
                }
              } else if (self.direction == "y+") {
                if (
                ((sum_minimum_height + c.minimum_height) <= (self.height - self.gutter * 2 - i * self.interval)) && (c.minimum_width <= (self.width - self.gutter * 2 - self.interval * i))) {
                  if (c.can_be_displayed != true) {
                    c.can_be_displayed = true;
                    eve("delayed.0.interface.appear_request." + c._id + "." + c.name);
                  }
                  sum_optimal_width += c.optimal_width;
                  sum_optimal_height += c.optimal_height;

                  sum_minimum_width += c.minimum_width;
                  sum_minimum_height += c.minimum_height;

                  nb_can_be_displayed += 1;
                  clist.push(c);
                } else {
                  //Hide those children that can't be displayed
                  for (var j = i; j < self.children.length; j++) {
                    self.hidden_children++;
                    var cc = self.children[j];
                    if (cc.can_be_displayed == true) {
                      cc.can_be_displayed = false;
                      eve("delayed.0.interface.hide_request." + cc._id + "." + cc.name);
                    }
                  }
                  //cut it off here
                  break;
                }
              }
            }



          }

          //Compute dimensions
          var remaining_width = self.width - self.gutter * 2 - self.interval * (clist.length - 1);
          var remaining_height = self.height - self.gutter * 2 - self.interval * (clist.length - 1);

          var full_width = self.width - self.gutter * 2 - self.interval * (clist.length - 1);
          var full_height = self.height - self.gutter * 2 - self.interval * (clist.length - 1);

          var dimensions_not_ok = true;
          var loop_cut_off = 0;

          var distribute = function(type, items, remainder) {

            var length = filter(function(item) {
              return item["adamantium"] == true ? false : true;
            }, items).length;
            if (length == 0) {
              map(function(item) {
                item[type] += remainder / items.length;
              }, items);
            } else {
              map(function(item) {
                if (item["adamantium"] != true) item[type] += remainder / length;
              }, items);
            }
          }


          while (dimensions_not_ok) {
            dimensions_not_ok = false;
            //safety switch

            if (remaining_width < 0 || remaining_height < 0) {
              var c = clist.pop();
              c.can_be_displayed = false;
              eve("delayed.0.interface.hide_request." + c._id + "." + c.name);
              remaining_width = self.width - self.gutter * 2 - self.interval * (clist.length - 1);
              remaining_height = self.height - self.gutter * 2 - self.interval * (clist.length - 1);
              sum_optimal_width -= c.optimal_width;
              sum_optimal_height -= c.optimal_height;

            }

            //WARNING: this is supposing you cant have more than 200 children
            if (loop_cut_off++ > 200) {
              console.error(self.name + " :: cutoff reached");
              break;
            }
            var total_width = 0;
            var total_height = 0;

            for (var i = 0; i < clist.length; i++) {
              var c = clist[i];


              if (self.direction == "x+") {
                c.width = c.optimal_width / sum_optimal_width * remaining_width;
                //Handling cases where weant the height to remain mostly constant
                if (c.adamantium) {
                  c.width = c.minimum_width;
                }
                if (c.width < c.minimum_width) c.width = c.minimum_width;
                total_width += c.width;

                //console.log(self.name + " :: Testing: " + total_width + " / " + remaining_width);
                if (total_width > full_width) {
                  remaining_width = (remaining_width + remaining_width - total_width);
                  dimensions_not_ok = true;
                  break;
                } else if (i == (clist.length - 1)) {
                  if (total_width < full_width) distribute("width", clist, full_width - total_width);
                }


              }
              if (self.direction == "y+") {
                c.height = c.optimal_height / sum_optimal_height * remaining_height;
                //Handling cases where weant the height to remain mostly constant
                if (c.adamantium) {
                  c.height = c.minimum_height;
                }
                if (c.height < c.minimum_height) c.height = c.minimum_height;
                total_height += c.height;

                //console.log(self.name + " :: Testing: " + total_height + " / " + remaining_height);
                if (total_height > full_height) {
                  remaining_height = (remaining_height + remaining_height - total_height);
                  dimensions_not_ok = true;
                  break;
                } else if (i == (clist.length - 1)) {
                  if (total_height < full_height) distribute("height", clist, full_height - total_height);
                }
              }

            }
          }


          //order objects by... order
          clist = sorted(clist, function(a, b) {
            try {
              return compare(a.order, b.order);
            } catch (e) {
              return compare("" + a.order, "" + b.order)
            }
          });

          var currentX = self.gutter;
          var currentY = self.gutter;
          //Lay out those elements that can be shown
          var waits = [];

          for (var i = 0; i < clist.length; i++) {
            var c = clist[i];

            if (self.direction == "x+") {

              c.setDimensions(c.width, self.height - self.gutter * 2);
              c.setPosition(self.x + currentX, self.y + self.gutter);

              currentX += (c.width + self.interval);
            }
            if (self.direction == "y+") {

              c.setDimensions(self.width - self.gutter * 2, c.height);
              c.setPosition(self.x + self.gutter, self.y + currentY);

              currentY += (c.height + self.interval);
            }

            //Message those elements to lay themselves out
            waits.push("interface.response_do_layout." + c._id + "." + c.name);
            eve("delayed.0.interface.request_do_layout." + c._id + "." + c.name);

          }
          //Wait for layout ok from those elements
          //console.log(self.name + " :: waiting for: " + waits);
          waitForEvents(waits).addCallback(function() {
            //console.log(self.name + " :: Got response for all my displaying children");
            //console.log(self.name + " :: Got response for all my displaying children: " + (self.children.length ? self.children[0].can_be_displayed : "NONE"));
            eve("buffered.0.interface.response_do_layout." + self._id + "." + self.name);
            self.lock.release();
          });
        });

        map(function(r) {
          o.respawn_props.push(r)
        }, ["direction", "adamantium", "gutter", "interval"]);
      },

    });
    //Always add in mixins after setting defaults
    //Otherwise variables passed as params will be ignored
    window.mixins.isDisplayComponent(o);
    window.mixins.isHierarchy(o);

    //Before event handling reference to self is required
    //( events redefine this, and we need that parameter )
    //We could bind it to o, then pass params as proper parameters
    //to resolve self definition ( TODO if coherency required )
    var self = o;

    o.handleEvent("interface.layout_request_root." + o._id + "." + o.name, o._handleLayoutRequestRoot);
    o.handleEvent("interface.hierarchy." + o._id + "." + o.name + ".*", o._handleHierarchyChange);

    o.handleEvent("interface.hide_request." + o._id + "." + o.name, function() {
      self.can_be_displayed = false;
      eve("interface.visibility_change", o);
      map(function(c) {
        c.can_be_displayed = false;
        eve("delayed.0.interface.hide_request." + c._id + "." + c.name);
      }, self.children);
    });

    o.handleEvent("interface.appear_request." + o._id + "." + o.name, function() {
      self.can_be_displayed = true;
      eve("interface.visibility_change", o);
      //self._dirty = true;
      //eve("interface.layout_request_root." + self._id + "." + self.name, false);
      map(function(c) {
        if (c.can_be_displayed) eve("delayed.0.interface.appear_request." + c._id + "." + c.name);
      }, self.children);
    });

  },
    "isDataBound": function(o) {
    if (window.mixins.initializeMixin(o, "isDataBound")) return;
    setdefault(o, {
      data_set: [],
      _runHandleDataChange: function(data) {
        var param_data, param_db;
        if (!isUndefinedOrNull(this.handleDataChange)) {
          if (typeof(data) != "string") {
            param_db = eve.nt().split(".")[2];
            param_data = eve.nt().split(".")[3];
          } else {
            param_db = data.split(".")[0];
            param_data = data.split(".")[1];
          }
          if (!isUndefinedOrNull(param_data)) {
            var self = this;
            this.fetchData(param_db, param_data, function(obj) {
              //alert(self.name + " :: Handling: " + obj);
              self.handleDataChange(param_db, param_data, obj);
            });
          } else {
            this.handleDataChange(param_db, param_data);
          }
        }
      },
      fetchData: function(db, data, handler) {
        try {
          databases[db].database.get(data, function(err, data) {
            if (!isUndefinedOrNull(err)) {
              handler(err);
            } else {
              handler(data);
            }
          });
        } catch (e) {
          handler({
            _id: "error",
            error: e.error
          });
        }
      },
      //Sample handle data change
      //To be overriden
      handleDataChange: function(db, data, obj) {
        console.log(this.name + " :: Handling: " + db + " :: " + data);
        noop();
      },
      //data should be of the form: <database>.<_id>
      //Note: We allow alternate form <database>
      //so we can watch all changes to database, up to the component
      //to filter what changes it is interested in
      addData: function(data) {
        if (this.data_set.indexOf(data) != -1) return;
        this.handleEvent("database.change." + data, this._runHandleDataChange);
        this.data_set.push(data);
        this._runHandleDataChange(data);
      },
      //Can't think of a use case for this for now, will implement if needed
      //as it implies quite a bit of behavior alteration
      removeData: function(data) {}
    });

    o.postInits.push(function() {
      var tmp = list(this.data_set);
      this.data_set = [];
      var self = this;
      map(function(item) {
        self.addData(item);
      }, tmp);
    });

    map(function(r) {
      o.respawn_props.push(r);
    }, ["data_set"]);

  },
    "canRespawn": function(o) {
    if (window.mixins.initializeMixin(o, "canRespawn")) return;
    //Adds the respawn functionality to an object
    //So that when its base class is updated, the object is re-instantiated
    //To solve parent/child complexities, we add a global lock to the respawn process
    //So that objects are respawned one after another
    setdefault(o, {
      respawn_delay: .1,
      respawn: function() {
        //Copy properties we need to pass through to spawned
        //Name is by default
        var params = {
          "id": this.name,
            "_id": this._id
        };

        this.respawn_props = dedupe(this.respawn_props);

        var self = this;
        map(function(prop) {
          params[prop] = self[prop];
        }, this.respawn_props);

        var delay = this.respawn_delay;
        return bind(function() {
          eve.once("interface.response." + this._id + "." + this.id, function() {
            callLater(delay, function() {
              window.global_respawn_lock.release();
            });
          });
          eve("interface.request." + this._id, this);
        }, params);
      }
    });

    eve.once("database.change.interfacedb." + o._id, bind(function() {
      if (isUndefinedOrNull(window.global_respawn_lock)) {
        window.global_respawn_lock = new DeferredLock();
      }
      var self = this;
      window.global_respawn_lock.acquire().addCallback(function() {
        //console.log(self.name + "-" + self.uuid + " setting my respawn_props: " + (self.parent ? self.parent.name + "-" + self.parent.uuid : ""));

        var cb = self.respawn();
        eve("interface.remove." + self._id + "." + self.name, {
          callback: cb
        });
      });
    }, o));


  },
    "init": function() {
    var old_mixins = window.mixins;
    window.PHI = (1 + Math.sqrt(5)) / 2;


    window.mixins = this;
    if (!isUndefinedOrNull(old_mixins)) {
      //Analyze changes at the first level of mixins
      //We check only bound functions by Mochikit
      var mixin_changes = {
        "new": [],
          "updated": [],
          "deleted": []
      };
      for (var m in window.mixins) {
        if (!window.mixins[m].im_func || m == "init") {
          //log("Ignoring: " + m);
          continue;
        }
        if (!(m in old_mixins)) {
          log("New mixin: " + m, -1);
          mixin_changes["new"].push(m);
          continue;
        }
        //We continue if it's the same mixin
        //log("Testing: (" + m + ") :: " + (serializeJSON(window.mixins[m].im_func) == serializeJSON(old_mixins[m].im_func)));
        if (serializeJSON(window.mixins[m].im_func) == serializeJSON(old_mixins[m].im_func)) continue;
        log("Mixin change: " + m, -1);
        mixin_changes["updated"].push(m);

      }
      for (var m in old_mixins) {
        if (!(m in window.mixins)) {
          log("Mixin deleted: " + m, 1);
          mixin_changes["deleted"].push(m);
        }
      }
      eve("interface.mixin.change", mixin_changes);
      old_mixins = null;
      //Create a new Raphael paper rough if required
      if (isUndefinedOrNull(window.roughRaph)) window.roughRaph = Raphael(-10000, -10000, 50, 50);
    }
  },
    "isHierarchy": function(o) {
    if (window.mixins.initializeMixin(o, "isHierarchy")) return;
    //Defines child/parent relationship for an object
    setdefault(o, {
      parent: null,
      children: [],
      appendChildren: function(children) {
        if (isUndefinedOrNull(children)) return;
        if (!isArrayLike(children)) children = [children];
        map(bind(function(child) {
          var added = false;

          if (this.children.indexOf(child) == -1) {
            added = true;
            if (!isUndefinedOrNull(child.parent)) child.parent.removeChildren(child);
            child.removeChildren && child.removeChildren(this);
            this.children.push(child);
            child.parent = this;
            eve("delayed.0.interface.hierarchy." + this._id + "." + this.name + ".child.new." + child._id + "." + child.name, {
              parent: this,
              child: child,
              type: "new"
            });
          }
        }, this), children);
        //If sortChildren is defined, sort the children
        if (this.sortChildren) {
          this.children = sorted(this.children, this.sortChildren);
        }
      },
      removeChildren: function(children) {
        if (isUndefinedOrNull(children)) return;
        if (!isArrayLike(children)) children = [children];

        this.children = filter(bind(function(child) {
          if (children.indexOf(child) != -1) {
            eve("delayed.0.interface.hierarchy." + this._id + "." + this.name + ".child.remove." + child._id + "." + child.name, {
              parent: this,
              child: child,
              type: "remove"
            });

            child.parent = null;
          }
          if (children.indexOf(child) == -1) return true;
        }, this), this.children);
      }
    });
    map(function(r) {
      o.respawn_props.push(r)
    }, ["parent", "children"]);
    //Has lock
    window.mixins.isLockable(o);

    //Remove parent/child relationship while we can
    o.cleanups.push(function() {
      var p = this.parent;
      if (!isUndefinedOrNull(this.parent)) {

        this.parent.removeChildren(this);
      }
      this.parent = p;
      this.removeChildren(this.children);
      if (isNull(this.parent)) return;
    });

    //Now we handle the case when we are given children
    //and parents as parameters ( mostly respawns )
    if (!isUndefinedOrNull(o.parent)) {
      o.parent.appendChildren(o);

    }
    if (o.children.length > 0) {
      var children = o.children;
      o.children = [];
      map(function(c) {
        o.appendChildren(c);
      }, children);
    }

  },
    "isPositionable": function(o) {
    if (window.mixins.initializeMixin(o, "isPositionable")) return;

    //Makes it so that an object can be positioned
    //and sends appropriate events
    //console.log(o.name + " :: " + "IsPositionable: " + JSON.stringify(o));
    setdefault(o, {
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      origx: -1000,
      origy: -1000,
      setPosition: function(x, y) {

        this.x = x;
        this.y = y;

        eve("interface.movement." + this._id + "." + this.name, this);
      },
      setDimensions: function(w, h) {
        this.height = h;
        this.width = w;
        eve("interface.resize." + this._id + "." + this.name, this);
      },
      getArea: function() {
        return this.width * this.height;
      },
      isInBBox: function(x, y) {
        if (x < this.x) return false;
        if (x > (this.x + this.width)) return false;
        if (y < this.y) return false;
        if (y > (this.y + this.height)) return false;
        return true;
      }
    });
    map(function(r) {
      o.respawn_props.push(r)
    }, ["x", "y", "width", "height"]);

  },
    "isDisplayComponent": function(o) {
    //Defines a leaf component
    //To be laid out by containers
    if (window.mixins.initializeMixin(o, "isDisplayComponent")) return;
    setdefault(o, {
      priority: 0,
      order: 0,
      current_font_size: 16,
      display: true,
      can_be_displayed: true,
      gutter: 4,
      event_buffer: 0,
      _runHandleDoLayout: function() {
        //self._dirty = true;
        //if (self.parent) self.parent._dirty = true;
        if (self.doLayout) {
          self.doLayout();
        }
      },
      //To be overridden by component
      //Don't forget to lock and return event
      doLayout: function() {
        eve("delayed.0.interface.response_do_layout." + this._id + "." + this.name);
      }
    });

    window.mixins.isLockable(o);
    window.mixins.isPositionable(o);
    window.mixins.canRespawn(o);
    window.mixins.isHierarchy(o);

    map(function(r) {
      o.respawn_props.push(r)
    }, ["x", "y", "width", "height", "order", "priority", "minimum_width", "minimum_height", "optimal_height", "optimal_width", "can_be_displayed"]);

    setdefault(o, {
      optimal_width: o.width,
      optimal_height: o.height,
      minimum_width: o.width,
      minimum_height: o.height,
      optimal_font_size: 16
    });

    var self = o;
    o.handleEvent("interface.request_do_layout." + o._id + "." + o.name, o._runHandleDoLayout);

  },
    "hasDiv": function(o) {
    if (window.mixins.initializeMixin(o, "hasDiv")) return;
    //Adds a div to an object listening to its position/resize and adapats to it
    setdefault(o, {
      div: null,
      border: 1,
      moveDuration: .2,
      morphDuration: .2,
      styleDuration: .2,
      transition: "sinusoidal",
      _updateDivStyle: function() {
        //Do nothing if object is not visible
        //if (self.div.style.visibility == "none") return;
        self.lock.acquire().addCallback(function() {
          if (self._being_destroyed || self._destroyed) {
            self.lock.release();
            return;
          }
          Morph(self.div, {
            style: {
              width: (self.width) + "px",
              height: (self.height) + "px",
              top: (self.y) + "px",
              left: (self.x) + "px"
            },
            duration: self.morphDuration,
            afterFinish: function() {
              self.lock.release();
            }
          });
        });
      }
    });

    window.mixins.isPositionable(o);
    window.mixins.isLockable(o);

    var self = o;

    o.handleEvent("interface.movement." + o._id + "." + o.name, function() {
      eve("buffered.50.interface.handle_div_style." + o._id + "." + o.name);
    });
    o.handleEvent("interface.resize." + o._id + "." + o.name, function() {
      eve("buffered.50.interface.handle_div_style." + o._id + "." + o.name);
    });

    o.handleEvent("interface.handle_div_style." + o._id + "." + o.name, o._updateDivStyle);
    //o.handleEvent("interface.handle_resize." + o._id + "." + o.name, o._updateDivStyle);

    o.handleEvent("interface.appear_request." + o._id + "." + o.name, function() {
      //console.log(self.name + " :: appearing");
      self.lock.acquire().addCallback(function() {
        appear(self.div, {
          duration: self.morphDuration / 1000,
          afterFinish: function() {
            self.lock.release();
          }
        });
      });
    });
    o.handleEvent("interface.hide_request." + o._id + "." + o.name, function() {
      //console.log(self.name + " :: disappearing");
      self.lock.acquire().addCallback(function() {
        fade(self.div, {
          duration: self.morphDuration / 1000,
          afterFinish: function() {
            self.lock.release();
          }
        });
      });
    });

    o.cleanups.push(bind(function() {
      if (!isUndefinedOrNull(this.div)) {
        try {
          removeElement(this.div);
          //console.log("Element removed: " + this.div);
          this.div = null;
        } catch (e) {
          console.log("Oops: problem: " + e);
        }
      }
    }, o));

    //Initialisation functions
    o.inits.push(function() {
      var col = MochiKit.Color.Color.fromBackground(currentDocument().body).toHexString();
      this.div = DIV({
        "style": {
          "border": "solid " + col + " 0px",
            "backgroundColor": col,
          position: "absolute",
            "left": 20 + "px",
            "top": 20 + "px",
            "width": 10 + "px",
            "height": 10 + "px",
            "padding": 0,
            "box-sizing": "border-box",
            "-webkit-box-sizing": "border-box",
            "-moz-box-sizing": "border-box",
            "box-sizing": "border-box"
        }
      });
      appendChildNodes(currentDocument().body, this.div);
      makeClipping(this.div);
      this._updateDivStyle();
    });

  },
    "initializeMixin": function(o, iam) {
    if (isUndefinedOrNull(o.implemented_mixins)) o.implemented_mixins = [];
    if (o.implemented_mixins.indexOf(iam) != -1) {
      return true;
    }
    o.implemented_mixins.push(iam);

    //Setting universal properties
    setdefault(o, {
      uuid: Raphael.createUUID(),
      cleanups: [],
      inits: [],
      postInits: [],
      respawn_props: ["respawn_props"],
      handleEvent: function(evt, f) {
        eve.on(evt, f);
        this.cleanups.push(function() {
          eve.off(evt, f);
        });
      },
      handleEventOnce: function(evt, f) {
        eve.once(evt, f);
        this.cleanups.push(function() {
          try {
            eve.off(evt, f);
          } catch (e) {
            noop();
          }
        });
      },
      implements: function(mixin) {
        if (this.implemented_mixins.indexOf(mixin) != -1) {
          return true;
        }
      }
    })
    //Ensure respawn_props is within
    //Respawn props
    if (o.respawn_props.indexOf("respawn_props") == -1) o.respawn_props.unshift("respawn_props");

    return false;
  },
    "isLockable": function(o) {
    if (window.mixins.initializeMixin(o, "isLockable")) return;
    //Adds a lock functionality to an object for async processes
    setdefault(o, {
      lock: new DeferredLock(),
      //Queue method doesn't do much, prefer using lock.acquire instead
      queue: function(f, ctx) {
        var d = this.lock.acquire();
        var lock = this.lock;
        d.addCallback(function() {
          f.call(ctx);
          lock.release();
        });
      }
    });
  }
}
