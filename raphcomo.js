//Disable console
if(!window.console || !console) {
    window.console = console = {};
}
console.info = noop;
console.warn = noop;

window.wordwrap = function(text, lineWidth) {
    var text = text,
        i = lineWidth,
        textLength = text.length,
        editedText = text,
        difference = 0;
    if(lineWidth > 0) {
        for(; i < textLength; i++) {
            if(text.charAt(i) == " ") {
                difference = editedText.length - textLength;
                test = editedText.split("");
                test.splice(i + difference, 0, "\n");
                editedText = test.join("");
                i += lineWidth;
            }
        }
        return editedText;
    } else {
        return editedText;
    }
};

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/string/wordwrap [rev. #2]

String.prototype.wordWrap = function(m, b, c){
    var i, j, l, s, r;
    if(m < 1)
        return this;
    for(i = -1, l = (r = this.split("\n")).length; ++i < l; r[i] += s)
        for(s = r[i], r[i] = ""; s.length > m; r[i] += s.slice(0, j) + ((s = s.slice(j)).length ? b : ""))
            j = c == 2 || (j = s.slice(0, m + 1).match(/\S*(\s)?$/))[1] ? m : j.input.length - j[0].length
            || c == 1 && m || j.input.length + (j = s.slice(m).match(/^\S*/)).input.length;
    return r.join("\n");
};

window.rwrap = function(t, width) {
    var content = t.attr("text");
    var abc = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    t.attr({
      "text" : abc
    });
    var letterWidth = t.getBBox().width / abc.length;

    t.attr({
        "text" : content
    });

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/string/wordwrap [rev. #2]
    var i, j, l, s, r, m, b, c, content;
    m=Math.round(width/letterWidth);
    b = "\n";
    c = 1;

    for(i = -1, l = (r = content.split("\n")).length; ++i < l; r[i] += s)
        for(s = r[i], r[i] = ""; s.length > m; r[i] += s.slice(0, j) + ((s = s.slice(j)).length ? b : ""))
            j = c == 2 || (j = s.slice(0, m + 1).match(/\S*(\s)?$/))[1] ? m : j.input.length - j[0].length
            || c == 1 && m || j.input.length + (j = s.slice(m).match(/^\S*/)).input.length;
    

    t.attr({
        "text" : r.join("\n").replace("\n ", "\n")
    });
}

var DumpObject = function(obj) {
    var od = new Object;
    var result = "";
    var len = 0;

    for(var property in obj) {
        var value = obj[property];
        if(typeof value == 'string') value = "'" + value + "'";
        else if(typeof value == 'object') {
            if(value instanceof Array) {
                value = "[ " + value + " ]";
            } else {
                var ood = DumpObject(value);
                value = "{ " + ood.dump + " }";
            }
        }
        result += "'" + property + "' : " + value + ", ";
        len++;
    }
    od.dump = result.replace(/, $/, "");
    od.len = len;

    return od;
}

//Force use of indexedDB and 
//window.shimIndexedDB && window.shimIndexedDB.__useShim();
//Register current size
window.current_dimensions = {}; //And we need binary translators
if(!window.btoa) window.btoa = base64.encode
if(!window.atob) window.atob = base64.decode

'use strict';

// Add ECMA262-5 method binding if not supported natively
//
if(!('bind' in Function.prototype)) {
    Function.prototype.bind = function(owner) {
        var that = this;
        if(arguments.length <= 1) {
            return function() {
                return that.apply(owner, arguments);
            };
        } else {
            var args = Array.prototype.slice.call(arguments, 1);
            return function() {
                return that.apply(owner, arguments.length === 0 ? args : args.concat(Array.prototype.slice.call(arguments)));
            };
        }
    };
}

// Add ECMA262-5 string trim if not supported natively
//
if(!('trim' in String.prototype)) {
    String.prototype.trim = function() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}

// Add ECMA262-5 Array methods if not supported natively
//
if(!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf = function(find, i /*opt*/ ) {
        if(i === undefined) i = 0;
        if(i < 0) i += this.length;
        if(i < 0) i = 0;
        for(var n = this.length; i < n; i++)
        if(i in this && this[i] === find) return i;
        return -1;
    };
}
if(!('lastIndexOf' in Array.prototype)) {
    Array.prototype.lastIndexOf = function(find, i /*opt*/ ) {
        if(i === undefined) i = this.length - 1;
        if(i < 0) i += this.length;
        if(i > this.length - 1) i = this.length - 1;
        for(i++; i-- > 0;) /* i++ because from-argument is sadly inclusive */
        if(i in this && this[i] === find) return i;
        return -1;
    };
}
if(!('forEach' in Array.prototype)) {
    Array.prototype.forEach = function(action, that /*opt*/ ) {
        for(var i = 0, n = this.length; i < n; i++)
        if(i in this) action.call(that, this[i], i, this);
    };
}
if(!('map' in Array.prototype)) {
    Array.prototype.map = function(mapper, that /*opt*/ ) {
        var other = new Array(this.length);
        for(var i = 0, n = this.length; i < n; i++)
        if(i in this) other[i] = mapper.call(that, this[i], i, this);
        return other;
    };
}
if(!('filter' in Array.prototype)) {
    Array.prototype.filter = function(filter, that /*opt*/ ) {
        var other = [],
            v;
        for(var i = 0, n = this.length; i < n; i++)
        if(i in this && filter.call(that, v = this[i], i, this)) other.push(v);
        return other;
    };
}
if(!('every' in Array.prototype)) {
    Array.prototype.every = function(tester, that /*opt*/ ) {
        for(var i = 0, n = this.length; i < n; i++)
        if(i in this && !tester.call(that, this[i], i, this)) return false;
        return true;
    };
}
if(!('some' in Array.prototype)) {
    Array.prototype.some = function(tester, that /*opt*/ ) {
        for(var i = 0, n = this.length; i < n; i++)
        if(i in this && tester.call(that, this[i], i, this)) return true;
        return false;
    };
}

//Add keys to object
if(!Object.keys) {
    Object.keys = (function() {
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({
                toString: null
            }).propertyIsEnumerable('toString'),
            dontEnums = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
            dontEnumsLength = dontEnums.length;

        return function(obj) {
            if(typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

            var result = [];

            for(var prop in obj) {
                if(hasOwnProperty.call(obj, prop)) result.push(prop);
            }

            if(hasDontEnumBug) {
                for(var i = 0; i < dontEnumsLength; i++) {
                    if(hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
                }
            }
            return result;
        }
    })()
};

registerJSON("functions", function(o) {
    return typeof(o) == "function";
}, function(o) {
    return o + "";
});

reviveJSON = function(o) {
    //alert("Investigating : " + o);
    var objtype = typeof(o);
    if(objtype == "string" && o.substring(0, 8) == "function") {
        //Override Mochikit Base, parenthesis dont work for functions
        return eval("[" + MochiKit.Base._filterJSON(o) + "][0]");
    }
    if(objtype == "string" || objtype == "number" || objtype == "boolean") {
        return o;
    }
    // recurse
    var me = arguments.callee;

    // array
    if(objtype != "function" && typeof(o.length) == "number") {
        var res = [];
        for(var i = 0; i < o.length; i++) {
            var val = me(o[i]);
            res.push(val);
        }
        return res;
    }
    // generic object code path
    res = {};
    for(var k in o) {
        val = me(o[k]);
        res[k] = val;
    }
    return res;
}

//Waits for multiple events before triggering
var waitForEvents = function(events) {
        if(!isArrayLike(events)) events = [events];
        var ll = map(function(e) {
            var d = new Deferred();
            eve.once(e, bind(d.callback, d));
            return d;
        }, events);
        ll = new DeferredList(ll);
        return ll;
    };

//handling of buffered events
//Format is "buffered.<duration in msecs>.<event string>
//example :: "buffered.1500.message.hello.there"
//Last event only is kept and fired after delay
(function(glob) {
    var events = {};
    eve.on("buffered.*", function() {
        var evt = eve.nt();
        var delay = +evt.split(".")[1] / 1000;
        if(typeof(delay) != "number") {
            delay = .5;
        }
        var scope = this;
        var args = arguments;

        var name = evt.split(".").slice(2).join(".");

        try {
            events[name].cancel();
        } catch(e) {
            noop();
        }

        var cob = function() {
                eve(name, scope, args);
                delete(events[evt]);
            };
        events[name] = callLater(delay, cob);
    });
})(this);

(function(glob) {
    var current_dimensions = {};

    var resize_handler = function() {
            var d = getViewportDimensions();
            if(serializeJSON(d) != serializeJSON(current_dimensions)) {
                eve("buffered.200.window.resize", d);
                current_dimensions = d;
            }
        };
    window.onresize = resize_handler;
    window.onorientationchange = resize_handler;
})(this);

var progressBar = function() {
        var res = {
            'init': function() {
                this.log_length = window.INITIAL_LOG_LENGTH || 5;
                //Set Component Relative Dimensions
                var width_pct = this.width_pct = 70 / 100;
                this.height_pct = 45 / 100;
                var percentage = this.percentage = 0.01;
                var fontsize = this.fontsize = 9;
                this.border = 1;
                this.height = 100;
                this.width = (this.fontsize + 2) * 30;
                //Define self for future reference
                var self = this;
                //Create DIV container
                var container = this.container = DIV({
                    "style": {
                        "position": "absolute",
                        "border": "solid red 0px",
                        "zIndex": 10000
                    }
                });
                //Appending everything to document
                appendChildNodes(currentDocument().body, container);
                //Creating raphael paper for background
                var paper = this.paper = Raphael(container);
                //Create base background in svg
                var bgrect = this.bgrect = paper.rect(this.border, this.border, 100, 100, 10);
                //Set background properties
                bgrect.attr({
                    fill: "30-#191D24-#4B6275",
                    "stroke": "#191D24",
                    "fill-opacity": 1,
                    "stroke-opacity": 0,
                    "stroke-width": this.border,
                    blur: Raphael.vml ? 0 : 0
                });
                var outer_rect = this.outer_rect = paper.rect(0, 0, 50, 50, 5);
                var inner_rect = this.inner_rect = paper.rect(0, 0, 50, 50, 5);
                inner_rect.toFront();
                outer_rect.attr({
                    fill: "#466B7A",
                    "stroke": "#172B33",
                    "fill-opacity": 1,
                    "stroke-opacity": 0,
                    "stroke-width": this.border
                });
                inner_rect.attr({
                    fill: "30-#73B500-#E9FFD4",
                    "stroke": "#73B500",
                    "fill-opacity": 1,
                    "stroke-opacity": 1,
                    "stroke-width": this.border,
                    blur: Raphael.vml ? 0 : 0
                });
                var text = this.text = paper.text(0, 0, "Init...");
                text.attr({
                    "fill": "white",
                    "stroke-width": .5,
                    "stroke": "white",
                    "stroke-opacity": .2,
                    "font-size": this.fontsize,
                    //"font-weight": "bold",
                    "font-family": "Arial, Helvetica, sans-serif",
                    "fill-opacity": .8
                });

                this.resize = bind(function() {
                    var d = getViewportDimensions();
                    var width = this.width;
                    setElementPosition(this.container, {
                        x: d.w < width ? 0 : (d.w - width) / 2,
                        y: d.h / 3
                    });
                    setElementDimensions(this.container, {
                        w: width + this.border * 2,
                        h: this.height + this.border * 2 + +this.log_length * (this.fontsize + 2)
                    });
                    this.bgrect.attr({
                        "width": width - this.border,
                        "height": this.height + this.log_length * (this.fontsize + 2)
                    });
                    this.paper.setSize(width + this.border * 2, this.height + this.border * 2 + this.log_length * (this.fontsize + 2));
                    this.outer_rect.attr({
                        "width": width * width_pct,
                        "height": this.height / 6 + this.border,
                        "x": width * (1 - width_pct) / 2,
                        "y": this.height / 2 - this.height / 7 / 2
                    });
                    this.inner_rect.attr({
                        "width": width * width_pct * this.percentage,
                        "height": this.height / 6,
                        "x": width * (1 - width_pct) / 2,
                        "y": this.height / 2 - this.height / 7 / 2
                    });
                    this.text.attr({
                        "x": width / 2,
                        "y": this.height * .7 + (this.log_length * (this.fontsize + 2)) / 2
                    });
                }, this);
                //Attach resize method to window resize
                eve.on("window.resize", this.resize);
                this.cleanup = function() {
                    this.inner_rect.stop();
                    self.evt && eve.off(self.evt, self.progress);
                    eve.off("window.resize", this.resize);
                    paper.remove();
                    removeElement(self.container);
                }
                this.progress = function() {
                    //log2("In progress: " + JSON.stringify(this));
                    var max = this[self.guidelines["max"]];
                    var measure = this[self.guidelines["x"]];
                    var remaining = this[self.guidelines["remaining"]] || [];

                    //log2("Results: " + [measure, max, max == 0 ? 0 : measure / max])
                    self.percentage = max == 0 ? 0 : measure / max;
                    if(self.percentage == 0) self.percentage = 0.01;
                    self.inner_rect.stop();
                    self.inner_rect.animate({
                        "width": self.width * self.width_pct * self.percentage
                    }, 100, "smooth");
                    var to_display = [];
                    for(var i = 0; i < (self.log_length - 1); i++) {
                        to_display.push(remaining.length > i ? (i == 0 ? "" : "\n") + remaining[i] : "");
                    }
                    to_display.push(i > self.log_length ? "\n..." : "");
                    self.text.attr({
                        "text": "Replicating: " + remaining.length + "\n" + reduce(function(a, b) {
                            return a + b;
                        }, to_display)
                    });
                };
                this.listenTo = function(evt, guidelines) {
                    self.guidelines = guidelines;
                    eve.on(evt, self.progress);
                    self.evt = evt;
                };
                this.resize();
                var cls = "progressBar";
                req = {
                    id: this.name
                };
                var o = res;
                var reqh = function() {
                        eve("interface.response_handle." + cls + "." + req.id, o);
                    };
                eve.on("interface.request_handle." + cls + "." + req.id, reqh);
                eve("interface.response." + cls + "." + req.id, {
                    "req": req,
                    "obj": o
                });

                var dest = function() {
                        eve.off("interface." + cls + "." + req.id + ".*");
                        eve.off("interface.request_handle." + cls + "." + req.id);
                        if(!isUndefinedOrNull(o.cleanup)) o.cleanup();
                        //Callback if defined ( Handy in case you need the object to re-instantiate )
                        if(!isUndefinedOrNull(this.callback)) this.callback();
                    };
                eve.once("interface.remove." + cls + "." + req.id, dest);
            },
            '_id': 'progressBar'
        };
        return res;
    };
