window.INTERFACE_OBJECT_REFERENCE = {};

// Basic wrapper for localStorage
var win = this;
var localJSON = (function(){
  if (!win.localStorage) {
    return false;
  }
  return {
    set: function(prop, val) {
      localStorage.setItem(prop, JSON.stringify(val));
    },
    get: function(prop, def) {
      try {
        if (localStorage.getItem(prop) === null) {
          return def;
        }
        return JSON.parse((localStorage.getItem(prop) || 'false'));
      } catch(err) {
        return def;
      }
    },
    remove: function(prop) {
      localStorage.removeItem(prop);
    }
  };
})();

var checkIfRewrite = function(url){
    if(window.location.href.indexOf("/_design/") != -1){
        return url;
    }
    else {
        return url+"userdb/"
    }
};

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

var logDiv = null;
var log2 = function(txt, severity) {
    if(window.PINPOINT !== "ALL" && txt.indexOf(window.PINPOINT) == -1) return;
    if(isUndefinedOrNull(logDiv)) return;

    var appendTo = isUndefinedOrNull(logDiv) ? currentDocument().body : logDiv;

    if(txt.indexOf("_local") >= 0) return;

    if(!isUndefinedOrNull(severity) && severity > 0) {
        appendChildNodes(appendTo, DIV({
            style: {
                "font-weight": "normal",
                "color": "#961247"
            }
        }, txt));
    } else if(!isUndefinedOrNull(severity) && severity < 0) {
        appendChildNodes(appendTo, DIV({
            style: {
                "font-weight": "normal",
                "color": "#038024"
            }
        }, txt));
    } else {
        appendChildNodes(appendTo, txt, BR());
    }
};

//Disable console for i.e.
if(!window.console || !console) {
    window.console = console = {};
    window.console.log = noop;
}
console.info = noop;
console.warn = noop;

//Setting window initial dimensions
//Before we read and assign it
window.current_dimensions = {}; 

'use strict';
//Remove duplicates in an array
dedupe = function(array){
    var tmp = {};
    map(function(item){ tmp[item]=null;}, array);
    return keys(tmp);
}


//The following takes care of handling JSON
//with methods
//Might not be needed if we store as base64
registerJSON("functions", function(o) {
    return typeof(o) == "function";
}, function(o) {
    return o + "";
});

reviveJSON = function(o) {
    //alert("Investigating : " + o);
    if(isUndefinedOrNull(o)) return null;
    var objtype = typeof(o);
    if(objtype == "string" && o.substring(0, 8) == "function") {
        //Override Mochikit Base, parenthesis dont work for functions
        var res = null;
        try {
            res = eval("[" + MochiKit.Base._filterJSON(o) + "][0]");
        }catch(e){
            alert("Error in evaluating: " + MochiKit.Base._filterJSON(o));
        }
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
            //eve.once(e, bind(d.callback, d));
            eve.once(e, function(){d.callback(this.obj)});
            return d;
        }, events);
        ll = new DeferredList(ll);
        return ll;
    };

//handling of buffered events
//Format is "buffered.<duration in msecs>.<event string>
//example :: "buffered.1500.message.hello.there"
//WARNING :: Last event only is kept and fired after delay
(function(glob) {
    var events = {};
    eve.on("buffered.*", function() {
        var evt = eve.nt();
        var delay = +evt.split(".")[1] / 1000;
        if(typeof(delay) != "number") {
            delay = .5;
        }
        var scope = this;
        var args = list(arguments);

        var name = evt.split(".").slice(2).join(".");

        try {
            events[name].cancel();
        } catch(e) {
            noop();
        }

        var cob = function() {
            args.unshift(scope);
            args.unshift(name);
            try{
                eve.apply(null, args);
            }catch(e){
                //console.log("BUFFERED Error: " + JSON.stringify(e));
                //console.log("PARAMS: " + args);
            }
            delete(events[evt]);
        };
        events[name] = callLater(delay, cob);
    });
})(this);

//handling of delayed events
//Format is "delayed.<duration in msecs>.<event string>
//example :: "delayed.1500.message.hello.there"
(function(glob) {
    eve.on("delayed.*", function() {
        var evt = eve.nt();
        var delay = +evt.split(".")[1] / 1000;

        if(typeof(delay) != "number") {
            delay = .5;
        }

        var scope = this;
        var args = list(arguments);

        var name = evt.split(".").slice(2).join(".");
        
        var cob = function() {
            args.unshift(scope);
            args.unshift(name);
            try{
                eve.apply(null, args);
            }catch(e){
                //console.log("DELAYED Error: " + JSON.stringify(e));
                //console.log("PARAMS: " + args);
            }
        };

        callLater(delay, cob);
    });
})(this);

//eve Buffered event handling
//type  can be uuid or event name passed as parameter
//returns canceller
window.eveBuffered = function(delay, event, type, func) {
  var buffer = {};

  if (type == "uuid") {
    var f = function(o) {
      var e = this;
      if (isUndefinedOrNull(buffer[e.uuid])) {
        //
        buffer[e.uuid] = {
          params: [],
          waiter: callLater(delay / 1000, function() {
            func(buffer[e.uuid].params);
            delete(buffer[e.uuid]);
          })
        };

      } else {
        buffer[e.uuid].waiter.cancel();
        buffer[e.uuid].waiter = callLater(delay / 1000, function() {
          func(buffer[e.uuid].params);
          delete(buffer[e.uuid]);
        });
      }
      buffer[e.uuid].params.push({
        "event": eve.nt(),
          "params": PouchDB.utils.extend(true, {}, e)
      });

    };
    eve.on(event, f);

    return function(){
      eve.off(event, f);
    };

  } else if (type == "event") {
    var f =  function(o) {
      var e = this;
      if (isUndefinedOrNull(buffer[event])) {
        //
        buffer[event] = {
          params: [],
          waiter: callLater(delay / 1000, function() {
            func(buffer[event].params);
            delete(buffer[event]);
          })
        };

      } else {
        buffer[event].waiter.cancel();
        buffer[event].waiter = callLater(delay / 1000, function() {
          func(buffer[event].params);
          delete(buffer[event]);
        });
      }
      buffer[event].params.push({
        "event": eve.nt(),
          "params": PouchDB.utils.extend(true, {}, e)
      });

    };
    eve.on(event,f);
        return function(){
      eve.off(event, f);
    };

  } else {
    console.warn("Warning: eveBuffered type not recognized: " + type)
        return noop;
  }
};

//Window dimensions monitor
//Sends out an event each time window is resized
//or rotated
(function(glob) {
    var current_dimensions = {};

    var resize_handler = function() {
            var d = getViewportDimensions();
            if(d.w != current_dimensions.w || d.h != current_dimensions.h) {
                eve("buffered.500.window.resize", d);
                current_dimensions =d;
            }
        };
    window.onresize = resize_handler;
    window.onorientationchange = resize_handler;
})(this);

//Folllows pointer draw definiton for unifying pointer events

// Weblifted from http://blogs.msdn.com/b/ie/archive/2011/10/19/handling-multi-touch-and-mouse-input-in-all-browsers.aspx
// I believe creator name is: Ted Johnson
// this javascript function abstracts mouse, pointer, and touch events
//
// invoke with:
// target - the HTML element object which is the target of the drawing
// startDraw - a function called with four parameters (target, pointerId, x, y) when the drawing begins. x and y are guaranteed to be within target's rectange
// extendDraw - a function called with four parameters (target, pointerId, x, y) when the drawing is extended. x and y are guaranteed to be within target's rectange
// endDraw - a function called with two parameters (target, pointerId) when the drawing is ended
// logMessage - a function called with one parameter (string message) that can be logged as the caller desires. multiple line strings separated by \n may be sent
//
// all parameters expect target are optional
//
// target element cannot move within the document during drawing
//
function PointerDraw(target, startDraw, extendDraw, endDraw, logMessage) {

    // an object to keep track of the last x/y positions of the mouse/pointer/touch point
    // used to reject redundant moves and as a flag to determine if we're in the "down" state
    var lastXYById = {};

    // an audit function to see if we're keeping lastXYById clean
    if(logMessage) {
        window.setInterval(function() {
            var logthis = false;
            var msg = "Current pointerId array contains:";

            for(var key in lastXYById) {
                logthis = true;
                msg += " " + key;
            }

            if(logthis) {
                logMessage(msg);
            }
        }, 1000);
    }

    // Opera doesn't have Object.keys so we use this wrapper


    function NumberOfKeys(theObject) {
        if(Object.keys) return Object.keys(theObject).length;

        var n = 0;
        for(var key in theObject)++n;

        return n;
    }

    // IE10's implementation in the Windows Developer Preview requires doing all of this
    // Not all of these methods remain in the Windows Consumer Preview, hence the tests for method existence.


    function PreventDefaultManipulationAndMouseEvent(evtObj) {
        if(evtObj.preventDefault) evtObj.preventDefault();

        if(evtObj.preventManipulation) evtObj.preventManipulation();

        if(evtObj.preventMouseEvent) evtObj.preventMouseEvent();
    }

    // we send target-relative coordinates to the draw functions
    // this calculates the delta needed to convert pageX/Y to offsetX/Y because offsetX/Y don't exist in the TouchEvent object or in Firefox's MouseEvent object


    function ComputeDocumentToElementDelta(theElement) {
        var elementLeft = 0;
        var elementTop = 0;

        for(var offsetElement = theElement; offsetElement != null; offsetElement = offsetElement.offsetParent) {
            // the following is a major hack for versions of IE less than 8 to avoid an apparent problem on the IEBlog with double-counting the offsets
            // this may not be a general solution to IE7's problem with offsetLeft/offsetParent
            if(navigator.userAgent.match(/\bMSIE\b/) && (!document.documentMode || document.documentMode < 8) && offsetElement.currentStyle.position == "relative" && offsetElement.offsetParent && offsetElement.offsetParent.currentStyle.position == "relative" && offsetElement.offsetLeft == offsetElement.offsetParent.offsetLeft) {
                // add only the top
                elementTop += offsetElement.offsetTop;
            } else {
                elementLeft += offsetElement.offsetLeft;
                elementTop += offsetElement.offsetTop;
            }
        }

        return {
            x: elementLeft,
            y: elementTop
        };
    }

    // function needed because IE versions before 9 did not define pageX/Y in the MouseEvent object


    function EnsurePageXY(eventObj) {
        if(typeof eventObj.pageX == 'undefined') {
            // initialize assuming our source element is our target
            eventObj.pageX = eventObj.offsetX + documentToTargetDelta.x;
            eventObj.pageY = eventObj.offsetY + documentToTargetDelta.y;

            if(eventObj.srcElement.offsetParent == target && document.documentMode && document.documentMode == 8 && eventObj.type == "mousedown") {
                // source element is a child piece of VML, we're in IE8, and we've not called setCapture yet - add the origin of the source element
                eventObj.pageX += eventObj.srcElement.offsetLeft;
                eventObj.pageY += eventObj.srcElement.offsetTop;
            } else if(eventObj.srcElement != target && !document.documentMode || document.documentMode < 8) {
                // source element isn't the target (most likely it's a child piece of VML) and we're in a version of IE before IE8 -
                // the offsetX/Y values are unpredictable so use the clientX/Y values and adjust by the scroll offsets of its parents
                // to get the document-relative coordinates (the same as pageX/Y)
                var sx = -2,
                    sy = -2; // adjust for old IE's 2-pixel border
                for(var scrollElement = eventObj.srcElement; scrollElement != null; scrollElement = scrollElement.parentNode) {
                    sx += scrollElement.scrollLeft ? scrollElement.scrollLeft : 0;
                    sy += scrollElement.scrollTop ? scrollElement.scrollTop : 0;
                }

                eventObj.pageX = eventObj.clientX + sx;
                eventObj.pageY = eventObj.clientY + sy;
            }
        }
    }

    // cache the delta from the document to our event target (reinitialized each mousedown/MSPointerDown/touchstart)
    var documentToTargetDelta = ComputeDocumentToElementDelta(target);

    // functions to convert document-relative coordinates to target-relative and constrain them to be within the target


    function targetRelativeX(px) {
        return Math.max(0, Math.min(px - documentToTargetDelta.x, target.offsetWidth));
    };

    function targetRelativeY(py) {
        return Math.max(0, Math.min(py - documentToTargetDelta.y, target.offsetHeight));
    };

    // common event handler for the mouse/pointer/touch models and their down/start, move, up/end, and cancel events


    function DoEvent(theEvtObj) {

        // optimize rejecting mouse moves when mouse is up
        if(theEvtObj.type == "mousemove" && NumberOfKeys(lastXYById) == 0) return;

        PreventDefaultManipulationAndMouseEvent(theEvtObj);

        var pointerList = theEvtObj.changedTouches ? theEvtObj.changedTouches : [theEvtObj];
        for(var i = 0; i < pointerList.length; ++i) {
            var pointerObj = pointerList[i];
            var pointerId = (typeof pointerObj.identifier != 'undefined') ? pointerObj.identifier : (typeof pointerObj.pointerId != 'undefined') ? pointerObj.pointerId : 1;

            // use the pageX/Y coordinates to compute target-relative coordinates when we have them (in ie < 9, we need to do a little work to put them there)
            EnsurePageXY(pointerObj);
            var pageX = pointerObj.pageX;
            var pageY = pointerObj.pageY;

            if(theEvtObj.type.match(/(start|down)$/i)) {
                // clause for processing MSPointerDown, touchstart, and mousedown
                // refresh the document-to-target delta on start in case the target has moved relative to document
                documentToTargetDelta = ComputeDocumentToElementDelta(target);

                // protect against failing to get an up or end on this pointerId
                if(lastXYById[pointerId]) {
                    if(endDraw) endDraw(target, pointerId);
                    delete lastXYById[pointerId];
                    if(logMessage) logMessage("Ended draw on pointer " + pointerId + " in " + theEvtObj.type);
                }

                if(startDraw) startDraw(target, pointerId, targetRelativeX(pageX), targetRelativeY(pageY));

                // init last page positions for this pointer
                lastXYById[pointerId] = {
                    x: pageX,
                    y: pageY
                };

                // in the Microsoft pointer model, set the capture for this pointer
                // in the mouse model, set the capture or add a document-level event handlers if this is our first down point
                // nothing is required for the iOS touch model because capture is implied on touchstart
                if(target.msSetPointerCapture) target.msSetPointerCapture(pointerId);
                else if(theEvtObj.type == "mousedown" && NumberOfKeys(lastXYById) == 1) {
                    if(useSetReleaseCapture) target.setCapture(true);
                    else {
                        document.addEventListener("mousemove", DoEvent, false);
                        document.addEventListener("mouseup", DoEvent, false);
                    }
                }
            } else if(theEvtObj.type.match(/move$/i)) {
                // clause handles mousemove, MSPointerMove, and touchmove
                if(lastXYById[pointerId] && !(lastXYById[pointerId].x == pageX && lastXYById[pointerId].y == pageY)) {
                    // only extend if the pointer is down and it's not the same as the last point
                    if(extendDraw) extendDraw(target, pointerId, targetRelativeX(pageX), targetRelativeY(pageY));

                    // update last page positions for this pointer
                    lastXYById[pointerId].x = pageX;
                    lastXYById[pointerId].y = pageY;
                }
            } else if(lastXYById[pointerId] && theEvtObj.type.match(/(up|end|cancel)$/i)) {
                // clause handles up/end/cancel
                if(endDraw) endDraw(target, pointerId);

                // delete last page positions for this pointer
                delete lastXYById[pointerId];

                // in the Microsoft pointer model, release the capture for this pointer
                // in the mouse model, release the capture or remove document-level event handlers if there are no down points
                // nothing is required for the iOS touch model because capture is implied on touchstart
                if(target.msReleasePointerCapture) target.msReleasePointerCapture(pointerId);
                else if(theEvtObj.type == "mouseup" && NumberOfKeys(lastXYById) == 0) {
                    if(useSetReleaseCapture) target.releaseCapture();
                    else {
                        document.removeEventListener("mousemove", DoEvent, false);
                        document.removeEventListener("mouseup", DoEvent, false);
                    }
                }
            }
        }
    }

    var useSetReleaseCapture = false;

    if(window.navigator.msPointerEnabled) {
        // Microsoft pointer model
        target.addEventListener("MSPointerDown", DoEvent, false);
        target.addEventListener("MSPointerMove", DoEvent, false);
        target.addEventListener("MSPointerUp", DoEvent, false);
        target.addEventListener("MSPointerCancel", DoEvent, false);

        // css way to prevent panning in our target area
        if(typeof target.style.msContentZooming != 'undefined') target.style.msContentZooming = "none";

        // new in Windows Consumer Preview: css way to prevent all built-in touch actions on our target
        // without this, you cannot touch draw on the element because IE will intercept the touch events
        if(typeof target.style.msTouchAction != 'undefined') target.style.msTouchAction = "none";

        if(logMessage) logMessage("Using Microsoft pointer model");
    } else if(target.addEventListener) {
        // iOS touch model
        target.addEventListener("touchstart", DoEvent, false);
        target.addEventListener("touchmove", DoEvent, false);
        target.addEventListener("touchend", DoEvent, false);
        target.addEventListener("touchcancel", DoEvent, false);

        // mouse model
        target.addEventListener("mousedown", DoEvent, false);

        // mouse model with capture
        // rejecting gecko because, unlike ie, firefox does not send events to target when the mouse is outside target
        if(target.setCapture && !window.navigator.userAgent.match(/\bGecko\b/)) {
            useSetReleaseCapture = true;

            target.addEventListener("mousemove", DoEvent, false);
            target.addEventListener("mouseup", DoEvent, false);

            if(logMessage) logMessage("Using mouse model with capture");
        }
    } else if(target.attachEvent && target.setCapture) {
        // legacy IE mode - mouse with capture
        useSetReleaseCapture = true;
        target.attachEvent("onmousedown", function() {
            DoEvent(window.event);
            window.event.returnValue = false;
            return false;
        });
        target.attachEvent("onmousemove", function() {
            DoEvent(window.event);
            window.event.returnValue = false;
            return false;
        });
        target.attachEvent("onmouseup", function() {
            DoEvent(window.event);
            window.event.returnValue = false;
            return false;
        });

        if(logMessage) logMessage("Using legacy IE mode - mouse model with capture");
    } else {
        if(logMessage) logMessage("Unexpected combination of supported features");
    }

}

/**
 * jsDump
 * Copyright (c) 2008 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Licensed under BSD (http://www.opensource.org/licenses/bsd-license.php)
 * Date: 5/15/2008
 * @projectDescription Advanced and extensible data dumping for Javascript.
 * @version 1.0.0
 * @author Ariel Flesler
 */
var jsDump;

(function(){
    function quote( str ){
        if(str.slice(0,8) == "function") return str;
        if(str.slice(1,9) == "function") console.log("Met a func(2): " + str);
        return '"' + str.toString().replace(/"/g, '\\"') + '"';
    };
    function literal( o ){
        return o + '';  
    };
    function join( pre, arr, post ){
        var s = jsDump.separator(),
            base = jsDump.indent();
            inner = jsDump.indent(1);
        if( arr.join )
            arr = arr.join( ',' + s + inner );
        if( !arr )
            return pre + post;
        return [ pre, inner + arr, base + post ].join(s);
    };
    function array( arr ){
        var i = arr.length, ret = Array(i);                 
        this.up();
        while( i-- )
            ret[i] = this.parse( arr[i] );              
        this.down();
        return join( '[', ret, ']' );
    };
    
    var reName = /^function (\w+)/;
    
    jsDump = {
        parse:function( obj, type ){//type is used mostly internally, you can fix a (custom)type in advance
            var parser = this.parsers[ type || this.typeOf(obj) ];
            type = typeof parser;           
            
            return type == 'function' ? parser.call( this, obj ) :
                   type == 'string' ? parser :
                   this.parsers.error;
        },
        typeOf:function( obj ){
            var type = typeof obj,
                f = 'function';//we'll use it 3 times, save it
            return type != 'object' && type != f ? type :
                !obj ? 'null' :
                obj.exec ? 'regexp' :// some browsers (FF) consider regexps functions
                obj.getHours ? 'date' :
                obj.scrollBy ?  'window' :
                obj.nodeName == '#document' ? 'document' :
                obj.nodeName ? 'node' :
                obj.item ? 'nodelist' : // Safari reports nodelists as functions
                obj.callee ? 'arguments' :
                obj.call || obj.constructor != Array && //an array would also fall on this hack
                    (obj+'').indexOf(f) != -1 ? f : //IE reports functions like alert, as objects
                'length' in obj ? 'array' :
                type;
        },
        separator:function(){
            return this.multiline ? this.HTML ? '<br />' : '\n' : this.HTML ? '&nbsp;' : ' ';
        },
        indent:function( extra ){// extra can be a number, shortcut for increasing-calling-decreasing
            if( !this.multiline )
                return '';
            var chr = this.indentChar;
            if( this.HTML )
                chr = chr.replace(/\t/g,'   ').replace(/ /g,'&nbsp;');
            return Array( this._depth_ + (extra||0) ).join(chr);
        },
        up:function( a ){
            this._depth_ += a || 1;
        },
        down:function( a ){
            this._depth_ -= a || 1;
        },
        setParser:function( name, parser ){
            this.parsers[name] = parser;
        },
        // The next 3 are exposed so you can use them
        quote:quote, 
        literal:literal,
        join:join,
        //
        _depth_: 1,
        // This is the list of parsers, to modify them, use jsDump.setParser
        parsers:{
            window: '[Window]',
            document: '[Document]',
            error:'[ERROR]', //when no parser is found, shouldn't happen
            unknown: '[Unknown]',
            'null':'null',
            undefined:'undefined',
            'function':function( fn ){
                var ret = 'function',
                    name = 'name' in fn ? fn.name : (reName.exec(fn)||[])[1];//functions never have name in IE
                if( name )
                    ret += ' ' + name;
                ret += '(';
                
                ret = [ ret, this.parse( fn, 'functionArgs' ), '){'].join('');
                return join( ret, this.parse(fn,'functionCode'), '}' );
            },
            array: array,
            nodelist: array,
            arguments: array,
            object:function( map ){
                var ret = [ ];
                this.up();
                for( var key in map )
                    ret.push( this.parse(key,'key') + ': ' + this.parse(map[key]) );
                this.down();
                return join( '{', ret, '}' );
            },
            node:function( node ){
                var open = this.HTML ? '&lt;' : '<',
                    close = this.HTML ? '&gt;' : '>';
                    
                var tag = node.nodeName.toLowerCase(),
                    ret = open + tag;
                    
                for( var a in this.DOMAttrs ){
                    var val = node[this.DOMAttrs[a]];
                    if( val )
                        ret += ' ' + a + '=' + this.parse( val, 'attribute' );
                }
                return ret + close + open + '/' + tag + close;
            },
            functionArgs:function( fn ){//function calls it internally, it's the arguments part of the function
                var l = fn.length;
                if( !l ) return '';             
                
                var args = Array(l);
                while( l-- )
                    args[l] = String.fromCharCode(97+l);//97 is 'a'
                return ' ' + args.join(', ') + ' ';
            },
            key:quote, //object calls it internally, the key part of an item in a map
            functionCode:'[code]', //function calls it internally, it's the content of the function
            attribute:quote, //onode calls it internally, it's an html attribute value
            string:quote,
            date:quote,
            regexp:literal, //regex
            number:literal,
            'boolean':literal
        },
        DOMAttrs:{//attributes to dump from nodes, name=>realName
            id:'id',
            name:'name',
            'class':'className'
        },
        HTML:false,//if true, entities are escaped ( <, >, \t, space and \n )
        indentChar:'   ',//indentation unit
        multiline:true //if true, items in a collection, are separated by a \n, else just a space.
    };

})();

jsDump.setParser("function", jsDump.literal);
jsDump.setParser( 'date', function( date ){
    return '"'+date.toUTCString()+'"';
});
jsDump.multiline = false;


//Waits for a given DOM element before triggering
var waitForElements = function( delay, elements, callback, retries ){
    if(isUndefinedOrNull(retries)) retries = Infinity;
    if(!isArrayLike(elements)) elements = [elements];
    if(retries == 0){
        console.log("Element: " + element + " could not be found. Giving up");
        return;
    }

    var not_found = 0;
    var eles = {};
    map(function(e){
        var ee = getElement(e);
        if(isUndefinedOrNull(ee)) {
            not_found++;
            console.log("Not found: " + e);
        }
        eles[e] = ee;
    }, elements);

    if(not_found >0){
        //Re-submit, at least one element could not be found
        delete eles;
        callLater(delay/1000, waitForElements, delay, elements, callback, retries--);
        return;
    }
    else {
        callback(eles);
    }
    delete eles;
}


Raphael.registerFont({w:229,face:{"font-family":"whoa","font-weight":400,"font-stretch":"normal","units-per-em":"360","panose-1":"2 0 5 0 0 0 0 0 0 0",ascent:"288",descent:"-72",bbox:"-0.738298 -325 315.086 19","underline-thickness":"26.3672","underline-position":"-24.9609","unicode-range":"U+0020-U+007A"},glyphs:{" ":{w:105},"\u00a0":{w:105},"!":{d:"87,-270v25,40,-13,187,-18,168v-19,10,-33,15,-55,14v-11,-6,-7,-31,-7,-49v0,-35,-2,-67,-7,-97v25,-14,54,-25,87,-36xm64,-69v24,0,24,2,23,19v-16,15,-35,29,-68,31v-5,1,-14,-12,-14,-29v0,-10,19,-21,59,-21",w:96,k:{z:8,y:3,x:3,w:8,v:8,u:8,t:8,s:3,r:3,q:14,p:3,o:14,n:8,m:8,l:3,k:3,j:14,i:8,h:19,g:14,f:8,e:3,d:3,c:3,b:3,a:8,"?":8,".":14,"*":14,"!":3}},"*":{d:"136,-239v15,37,20,56,25,56r52,-9v12,11,-8,23,-30,58r31,53v-7,11,-21,27,-42,50v-12,-4,-48,-37,-66,-45v-6,0,-32,15,-73,33v-5,-1,-9,-4,-11,-10v10,-16,25,-28,32,-47v-15,-11,-33,-19,-54,-26r0,-8v15,-12,24,-29,41,-38v14,1,27,4,43,4v1,-25,6,-37,12,-37v25,-26,23,-32,40,-34",w:217,k:{z:1,y:1,x:1,w:23,v:18,u:7,t:12,s:1,r:18,q:7,p:18,o:12,n:12,m:7,l:1,k:7,j:1,i:12,h:12,g:12,f:7,e:1,d:7,c:1,b:12,a:1,"?":1,".":29,"*":29,"!":7}},".":{d:"73,-36v-1,12,-26,35,-42,31v-13,0,-23,-14,-31,-40v23,-15,42,-25,56,-30v2,0,8,13,17,39",w:73,k:{z:29,y:68,x:29,w:45,v:73,u:1,t:112,s:23,r:62,q:23,p:56,o:29,n:1,m:7,l:12,k:18,j:12,i:18,h:18,g:29,f:12,e:62,d:40,c:73,b:62,a:1,"?":90,".":1,"*":23,"!":7}},"?":{d:"0,-172v-3,-20,119,-115,175,-110v5,0,9,7,11,22v5,35,-19,54,-48,128r44,7v1,21,-16,24,-24,36v-32,9,-75,26,-94,-14v27,-48,47,-66,54,-109v-23,-2,-28,6,-45,25v-20,11,-34,28,-58,35xm115,-54v12,-4,29,-10,38,-2v0,12,-14,26,-40,40v-12,0,-24,-8,-22,-26v0,-4,8,-8,24,-14r0,2",w:186,k:{z:26,y:20,x:26,w:9,v:15,u:20,t:37,s:26,q:4,p:15,o:4,n:20,m:31,l:20,k:15,j:31,i:31,h:9,g:4,f:37,e:9,d:15,c:20,b:4,a:31,"?":26,".":37,"*":4,"!":4}},a:{d:"132,-261v17,48,25,45,58,129r35,89v-11,11,-26,22,-46,34v-38,-3,-62,-14,-21,-25v-10,-20,-19,-34,-26,-44v-15,9,-42,15,-81,18r-38,22v-9,0,-13,-4,-13,-12v0,-18,7,-19,11,-24v-6,-1,-9,-6,-9,-14v0,-3,11,-8,32,-15v25,-54,40,-81,33,-121xm105,-127v-4,12,-14,19,-14,35v11,4,21,-2,32,-4",w:224,k:{z:31,y:59,x:31,w:36,v:42,u:3,t:42,s:25,r:64,q:20,p:59,o:25,n:3,m:3,l:14,k:20,j:9,i:31,h:20,g:25,f:9,e:31,d:42,c:59,b:64,a:3,"?":53,".":3,"*":25,"!":9}},b:{d:"67,-34v-9,-80,-28,-136,-67,-174v0,-9,8,-12,3,-21v4,1,25,-12,60,-30v13,12,39,26,78,32v46,8,71,6,72,11v-15,22,-34,43,-55,64v31,2,84,-12,84,21v0,24,-33,60,-98,107v-5,22,-88,3,-77,-10xm115,-175r5,16v4,-5,10,-8,13,-14v-7,0,-13,0,-18,-2xm135,-105r6,48v16,-7,23,-24,36,-34v4,-10,1,-19,-15,-17",w:241,k:{z:37,y:31,x:31,w:4,v:9,u:20,t:9,s:20,r:31,q:4,p:31,o:4,n:20,m:31,l:26,k:26,j:26,i:15,h:9,g:4,f:31,e:9,d:31,c:31,b:31,a:26,"?":31,".":70,"*":4,"!":9}},c:{d:"0,-195v28,-19,63,-47,111,-32v19,-5,76,14,123,7r0,2v3,-4,15,-2,17,2v0,9,-17,29,-49,61r-94,0r18,73v74,-15,100,-37,118,-19v-36,24,-93,60,-161,78v-36,-73,-30,-80,-83,-166r0,-6",w:250,k:{z:29,y:12,x:24,w:29,v:46,u:18,t:40,s:24,r:1,q:7,p:1,o:12,n:18,m:24,l:12,k:7,j:18,i:35,h:7,g:12,f:29,e:7,d:1,c:12,b:1,a:18,"?":24,".":96,"*":57,"!":1}},d:{d:"57,-240v10,-5,13,-9,22,-8v27,35,68,57,121,73v32,9,46,14,45,22v-37,47,-74,77,-108,97v-18,11,-50,32,-90,38v-7,-31,-9,-69,-7,-77v-14,-50,-21,-84,-40,-105v0,-10,20,-22,57,-40xm164,-117v-13,0,-30,-12,-39,-8r4,40v23,-8,35,-28,35,-32",w:245,k:{z:18,y:18,x:13,w:7,v:2,u:18,t:2,s:7,r:35,q:13,p:35,o:13,n:13,m:35,l:18,k:18,j:57,i:2,h:29,g:7,f:68,e:29,d:24,c:18,b:40,a:57,"?":13,".":118,"*":18,"!":7}},e:{d:"52,-238v14,2,29,12,41,4v15,23,51,31,85,22r0,2v5,-1,11,-6,14,-2v0,-5,9,-7,26,-8r4,4v-3,7,-26,20,-70,31v-26,6,-39,8,-39,12v-3,25,48,17,65,20v27,-3,57,-15,83,-12r0,6v-25,13,-58,29,-105,38v-43,8,-32,21,-29,53v30,-11,68,-37,109,-51v5,22,-21,32,-72,69v-24,17,-52,28,-79,39v-3,-5,-6,-3,-10,0v-8,-27,-13,-71,-23,-93v-19,-3,-51,11,-46,-19v13,-14,23,-20,30,-20v-5,-24,-13,-36,-22,-36v-12,0,-14,-2,-14,-12v0,-10,13,-22,40,-35v0,-3,4,-7,12,-12",w:261,k:{z:1,y:12,x:7,w:12,v:7,u:18,t:1,s:1,r:34,q:18,p:29,o:18,n:12,m:34,l:7,k:12,j:45,i:1,h:23,g:12,f:51,e:29,d:18,c:12,b:29,a:45,"?":7,".":101,"*":29,"!":7}},f:{d:"90,-241v12,-10,18,-13,27,-12v64,44,81,49,158,48v5,0,10,5,14,13v3,13,-48,15,-116,26v8,7,11,34,23,58r88,-28v1,1,2,2,4,2v-1,15,-32,34,-92,58v-2,16,-7,24,-15,23v-34,20,-57,29,-70,29r0,-4v-3,4,-8,-1,-10,-3r1,-26v-30,1,-104,3,-101,-15v-3,-8,21,-30,39,-24v12,-11,40,-4,57,-1v-8,-26,-27,-60,-58,-102v-2,-33,14,-25,51,-42",w:288,k:{z:17,y:1,x:12,w:1,v:6,u:12,t:12,s:12,r:17,q:6,p:12,o:6,n:17,m:34,l:1,k:1,j:40,i:17,h:17,g:1,f:40,e:1,d:1,c:1,b:12,a:45,"?":12,".":112,"*":1,"!":6}},g:{d:"7,-89v-37,-101,101,-132,182,-162v5,0,10,19,14,57v-41,21,-51,28,-74,27v-9,-12,-17,-18,-24,-18v-16,17,-28,32,-26,55v49,-13,92,-34,143,-47r7,12r-15,133v5,0,9,3,12,10v0,10,-24,23,-71,41v-31,-1,-4,-51,-12,-65v-62,10,-101,6,-136,-43xm95,-101v9,10,23,15,41,15v6,-13,-15,-19,-33,-17",k:{z:2,y:13,x:8,w:2,v:2,u:13,t:2,s:2,r:30,q:8,p:30,o:8,n:13,m:13,l:8,k:13,j:13,i:2,h:8,g:8,f:13,e:13,d:19,c:13,b:30,a:13,"?":8,".":13,"*":8,"!":8}},h:{d:"100,-228v5,-1,8,1,9,4r1,87r33,4v-5,-12,-10,-44,-12,-80v5,-9,17,-18,38,-26v0,-3,12,-11,37,-24v9,6,10,17,8,32v-1,10,19,75,36,172v3,19,-16,40,-53,63v-15,1,-27,-4,-37,-15v3,-5,8,-7,9,-13r-15,-67v-31,7,-46,12,-46,16v2,21,-75,73,-87,32r6,-39v-10,-4,-22,-8,-27,-22v4,-5,14,-12,30,-21r0,-64",w:251,k:{z:25,y:30,x:30,w:19,v:25,u:3,t:25,s:25,r:36,q:14,p:36,o:14,n:3,m:3,l:14,k:19,j:8,i:25,h:14,g:14,f:3,e:19,d:36,c:30,b:36,a:3,"?":30,".":8,"*":19,"!":8}},i:{d:"152,-325v28,7,5,27,-4,46v14,4,29,-6,40,4r-44,34v4,0,8,7,11,21v-8,-2,-4,10,-11,11v5,10,-16,15,-36,21v-16,-18,-20,-25,-36,-17v-4,0,-8,-10,-11,-27r5,-4v-19,-32,-33,-50,-7,-64v14,1,23,6,36,13v7,-10,16,4,23,8v5,-16,13,-30,24,-42v2,4,11,2,10,-4xm4,-150v-15,-31,40,-21,64,-31v47,15,53,29,82,8v3,4,8,-2,13,0v21,19,18,8,38,34v-31,5,-32,0,-32,23v0,60,22,43,60,40v2,3,6,4,6,9v-74,32,-194,62,-203,59v-11,-4,-16,-9,-17,-13v4,-12,13,-19,27,-19v0,-2,14,-5,43,-10v-4,-26,-1,-59,-9,-81v-48,0,-72,-6,-72,-19",w:235,k:{z:25,y:58,x:52,w:36,v:36,u:8,t:36,s:36,r:63,q:14,p:58,o:19,n:8,m:2,l:19,k:25,j:2,i:41,h:25,g:19,f:2,e:58,d:41,c:58,b:63,a:2,"?":58,".":30,"*":36,"!":25}},j:{d:"166,-249v39,57,58,109,58,156v0,23,-31,46,-93,69v-65,8,-138,-30,-131,-60r24,-25v19,-7,39,-14,56,-24v0,8,11,4,9,13v-7,27,8,26,46,42v0,-28,-16,-69,-48,-122v8,-13,43,-25,64,-42v4,4,9,-10,15,-7",w:224,k:{z:14,y:19,x:14,w:3,v:8,u:8,t:8,s:14,r:36,q:3,p:30,o:3,n:14,m:8,l:19,k:25,j:3,i:8,h:3,g:3,f:8,e:8,d:25,c:19,b:30,a:3,"?":14,".":36,"*":3,"!":8}},k:{d:"83,-238v8,8,16,31,24,70r40,-35v27,5,56,-19,80,-16r0,4v-27,29,-51,49,-71,60r0,4v58,-13,77,14,97,88v-34,10,-91,70,-97,-5v-12,-29,-27,-43,-46,-42r-3,71v-12,7,-43,26,-83,30v-17,-12,-12,-23,0,-50v-1,-23,2,-51,-2,-71v10,-9,-32,-54,-17,-90v4,5,13,0,18,-1r0,3v21,-10,39,-11,60,-20",w:253,k:{z:21,y:43,x:43,w:26,v:32,u:4,t:37,s:26,r:26,q:10,p:26,o:10,l:15,k:21,j:4,i:43,h:10,g:10,e:21,d:26,c:43,b:26,"?":54,".":21,"*":26,"!":15}},l:{d:"87,-227v36,40,19,90,17,150r60,-17v-2,-9,-10,-20,0,-25v20,-10,38,-21,64,-25v8,3,21,15,38,37v2,22,-8,25,-31,40v0,5,-9,10,-27,17v-65,-11,-141,21,-179,37r0,-2v-11,7,-21,-7,-19,-27v12,-38,27,-102,-8,-133v5,-4,-2,-14,-2,-21v8,-7,64,-26,87,-31",w:265,k:{z:39,y:44,x:55,w:17,v:28,u:11,t:33,s:44,r:55,p:50,n:11,m:11,l:22,k:28,j:5,i:39,f:5,e:11,d:33,c:44,b:50,"?":66,".":55,"*":17,"!":5}},m:{d:"141,-202v-10,-13,35,-41,64,-50v2,0,5,12,8,37r26,74v45,74,22,83,-49,143v-16,8,-29,13,-41,13v-13,-10,43,-35,44,-66v-4,-19,-8,-28,-12,-28v-43,30,-51,51,-74,33v-9,-15,-16,-32,-26,-46v-8,8,-33,27,-71,38v-5,-1,-11,0,-10,-13v30,-42,43,-68,34,-115v0,-8,45,-35,67,-38v5,-2,14,29,35,64",w:261,k:{z:29,y:40,x:35,w:18,v:24,u:7,t:24,s:29,r:52,q:2,p:52,o:7,n:7,m:7,l:18,k:24,j:2,i:29,h:2,g:7,f:2,e:13,d:35,c:40,b:46,a:2,"?":35,".":18,"*":18,"!":7}},n:{d:"8,-172v16,-8,19,-19,44,-17v0,-3,9,-6,28,-10r57,60r-3,-92v-8,-1,-25,-1,-27,-13v12,-22,49,-29,82,-34v13,3,20,13,20,30v0,58,5,127,16,206v-11,7,-31,34,-65,38v-13,-19,-38,-46,-75,-80v-3,19,-10,28,-20,28v-5,5,-14,10,-28,15v-2,6,-11,9,-24,9v-7,-7,-14,-14,-13,-25v17,-32,20,-72,8,-115",w:225,k:{z:15,y:15,x:15,w:9,v:9,t:9,s:15,r:15,q:4,p:15,o:9,m:4,l:9,k:15,j:4,i:15,h:9,g:9,f:4,e:15,d:15,c:15,b:15,"?":15,"*":9,"!":4}},o:{d:"214,-139v5,22,-65,106,-126,106v-30,0,-58,-20,-83,-58v-10,-38,-3,-59,24,-89v3,0,10,-7,20,-22v21,-5,37,-19,77,-25v3,0,5,4,8,13v20,0,42,12,68,34v11,19,13,22,12,41xm82,-168v-27,28,5,71,46,80v6,0,11,-10,16,-30v0,-18,-20,-35,-62,-50",w:214,k:{z:4,y:9,x:4,u:15,r:31,p:26,n:9,m:26,l:9,k:9,j:26,h:9,f:31,e:4,d:15,c:9,b:26,a:26,"?":4,".":70,"!":4}},p:{d:"0,-212v26,-13,44,-34,74,-43v34,29,70,50,107,62v44,13,66,21,66,25v0,9,-38,34,-113,74v3,17,-1,31,2,45v-17,12,-43,23,-76,35v-14,-6,1,-36,-7,-49r3,0v-6,-10,-3,-30,-7,-44r3,0v-12,-46,-34,-74,-52,-105xm128,-140r4,29v9,-7,22,-10,28,-20",w:246,k:{y:9,x:3,w:14,v:9,u:14,t:3,r:31,q:20,p:25,o:14,n:9,m:31,l:3,k:9,j:103,h:25,g:9,f:59,e:14,d:14,c:9,b:25,a:59,"?":3,".":114,"*":31,"!":3}},q:{d:"160,-239v35,0,51,10,50,25v-7,10,-14,15,-20,15r0,4v48,11,49,32,55,70v6,11,30,-6,33,9v-9,10,-26,20,-50,28v-34,35,-60,70,-119,70v-50,0,-85,-26,-107,-78v-9,-55,20,-76,81,-110v25,-22,51,-33,77,-33xm90,-175v-11,13,-13,55,0,59r57,-37v5,3,8,8,15,9v-5,-10,-13,-20,-24,-18v-13,-9,-29,-13,-48,-13xm171,-85v-16,4,-38,1,-57,2v15,15,25,21,44,20v8,-6,13,-14,13,-22",w:277,k:{z:40,y:40,x:45,w:12,v:23,u:18,t:40,s:40,r:51,q:1,p:51,o:1,n:18,m:29,l:23,k:23,j:29,i:40,h:7,g:1,f:45,e:7,d:34,c:40,b:51,a:34,"?":45,".":90,"*":12,"!":7}},r:{d:"142,11v0,-17,14,-58,39,-102v-2,-13,-24,-9,-44,-10r3,32v-46,26,-60,52,-78,30v1,-67,-19,-119,-62,-181v2,-7,6,-14,4,-22r67,-25v0,9,45,22,135,41v-3,4,15,2,14,11v-16,29,-35,51,-55,66v1,6,17,4,22,3v99,8,47,25,26,109v9,2,10,3,9,10v-25,22,-47,36,-64,41v-2,-5,-9,-1,-16,-3xm112,-190v10,17,9,30,14,34v7,-5,14,-13,21,-25v-3,-3,-15,-6,-35,-9",w:245,k:{z:40,y:35,x:40,w:2,v:7,u:18,t:18,s:24,r:29,q:2,p:29,o:2,n:18,m:18,l:24,k:24,j:18,i:24,h:7,g:2,f:18,e:7,d:29,c:35,b:29,a:13,"?":46,".":29,"*":2,"!":7}},s:{d:"230,-109v-34,49,-124,96,-205,95v-15,-28,18,-74,33,-68v23,-8,38,-17,44,-11v-3,18,-12,34,-10,42v31,0,54,-10,71,-30v-78,-19,-127,-37,-145,-56v-34,-35,-20,-57,28,-85v23,-5,61,-29,99,-28v-1,4,27,25,35,37v0,3,-18,17,-54,42r-6,0v-20,-21,-35,-30,-51,-30v-3,41,32,50,111,71v32,8,50,13,50,21",k:{z:47,y:41,x:58,w:14,v:25,u:14,t:75,s:53,r:53,q:3,p:47,o:3,n:19,m:25,l:25,k:25,j:19,i:75,h:3,g:3,f:19,e:8,d:36,c:41,b:47,a:14,"?":69,".":75,"*":19,"!":8}},t:{d:"150,-265v32,-10,21,45,30,71r-2,0v3,2,2,9,3,14v30,11,101,7,125,14v2,-3,10,-5,9,1v-47,8,-90,17,-131,28v4,19,2,41,6,58r92,-52v7,0,14,-4,15,5v-4,8,-26,21,-61,46v-46,32,-81,60,-111,74v-13,-9,-10,-28,-14,-45v10,-19,-3,-56,-4,-82v-37,1,-112,7,-107,-24v18,-13,39,-24,64,-34v11,1,28,10,36,6v-1,-13,-5,-26,-11,-40",w:314,k:{z:5,y:16,x:10,w:21,v:16,u:21,t:10,s:5,r:38,q:21,p:32,o:21,n:16,m:38,l:10,k:16,j:54,i:5,h:32,g:16,f:65,e:27,d:21,c:16,b:32,a:60,"?":10,".":121,"*":21,"!":10}},u:{d:"9,-203v28,-13,48,-27,77,-31v18,24,12,103,-3,156v29,4,69,-11,64,-15r-29,-84v44,-19,70,-28,77,-28v4,22,14,76,25,79v10,-2,16,29,22,48v-12,12,-38,27,-77,44v-7,-7,-10,-17,-11,-31v-64,32,-97,32,-147,40r-7,-24v12,-54,23,-84,15,-114r3,0",w:241,k:{z:25,y:42,x:42,w:25,v:31,u:3,t:31,s:37,r:53,q:3,p:53,o:9,n:3,m:3,l:14,k:20,i:37,h:3,g:9,e:14,d:37,c:42,b:48,"?":42,".":37,"*":20,"!":9}},v:{d:"157,-251v47,18,70,34,70,47v10,22,-11,56,-32,120v0,25,-29,50,-87,75v-8,-20,-43,-58,-96,-120v-27,-32,-7,-30,54,-52v23,2,35,8,35,19v13,14,23,28,30,45r5,0v17,-37,26,-64,26,-80v0,-25,-24,-30,-52,-35r0,-5",k:{z:3,y:3,x:3,w:14,v:8,u:14,t:8,s:3,r:8,q:19,p:3,o:19,n:8,m:36,l:3,k:3,j:36,i:8,h:25,g:14,f:36,e:3,d:3,c:3,b:3,a:30,"?":3,".":58,"*":19,"!":8}},w:{d:"232,-282v26,66,-20,168,-16,244v-8,8,-25,20,-52,36r-46,-109r-11,52v-21,18,-27,16,-49,32v-14,-20,-35,-92,-57,-109v-3,-10,2,-20,12,-19v6,-3,19,-10,39,-14v2,0,9,10,21,30v6,-22,12,-44,7,-64v26,-14,44,-21,54,-21v2,-1,22,65,34,91r2,0v10,-32,32,-163,-33,-141v-14,-23,20,-34,53,-39v28,8,42,19,42,31",w:239,k:{z:7,y:7,x:7,w:12,v:12,u:12,t:7,s:7,r:1,q:18,p:1,o:18,n:12,m:24,l:7,k:7,j:24,i:7,h:18,g:12,f:24,e:7,d:1,c:7,b:1,a:24,"?":7,".":24,"*":12,"!":1}},x:{d:"203,-238v13,0,26,-1,26,11r-65,95r51,39v9,0,28,7,25,26v-6,7,-26,23,-60,46v-47,-32,-72,-49,-76,-49v-33,35,-33,46,-65,44v-8,0,-12,-2,-14,-7v0,-11,6,-20,19,-25r34,-39v-52,-42,-78,-71,-78,-86v29,-13,47,-37,85,-41v27,36,36,57,49,60v2,-9,13,-21,5,-28",w:239,k:{z:24,y:35,x:41,w:30,v:57,u:7,t:57,s:35,r:13,q:13,p:24,o:13,n:7,m:2,l:18,k:24,j:2,i:52,h:18,g:13,f:2,e:30,d:24,c:35,b:13,a:2,"?":46,".":18,"*":30,"!":13}},y:{d:"66,-51v-10,-15,-52,-126,-66,-134r0,-7r77,-41v22,22,39,63,50,123v16,-9,18,-5,18,-20v0,-19,1,-32,4,-40v-6,-3,-9,-7,-9,-13v7,-6,42,-38,88,-59r9,15v-10,54,-14,117,-20,169v12,36,-2,32,-59,71r-81,-18v2,-16,18,-18,26,-28v11,2,17,-11,37,-18v-2,-10,3,-27,-2,-33v-42,22,-66,33,-72,33",w:237,k:{z:5,y:5,x:5,w:10,v:10,u:16,t:10,s:5,q:16,o:16,n:10,m:16,l:5,k:5,j:16,i:10,h:16,g:10,f:16,e:5,c:5,a:16,"?":5,".":16,"*":10}},z:{d:"194,-3v-40,-44,-93,-52,-164,-50v-14,-22,-4,-20,29,-41r59,-35v32,-29,54,-51,47,-59v-24,4,-48,4,-60,16v3,8,8,13,9,22r-51,35v-18,0,-27,-7,-27,-21v-13,-22,-24,-33,-34,-33v-8,-18,46,-31,59,-47v29,7,66,-9,150,-27v15,4,37,-21,38,4v-43,76,-74,85,-122,133v15,2,21,6,38,12v-1,-23,17,-36,54,-48v10,-3,21,19,15,38v4,19,12,34,13,55v-15,14,-29,36,-53,46",w:249,k:{z:22,y:28,x:28,w:17,v:22,t:28,s:28,q:11,p:17,o:11,l:11,k:17,j:5,i:33,h:11,g:11,f:5,e:17,d:17,c:28,b:5,"?":39,".":5,"*":17}},A:{d:"132,-261v17,48,25,45,58,129r35,89v-11,11,-26,22,-46,34v-38,-3,-62,-14,-21,-25v-10,-20,-19,-34,-26,-44v-15,9,-42,15,-81,18r-38,22v-9,0,-13,-4,-13,-12v0,-18,7,-19,11,-24v-6,-1,-9,-6,-9,-14v0,-3,11,-8,32,-15v25,-54,40,-81,33,-121xm105,-127v-4,12,-14,19,-14,35v11,4,21,-2,32,-4",w:224},B:{d:"67,-34v-9,-80,-28,-136,-67,-174v0,-9,8,-12,3,-21v4,1,25,-12,60,-30v13,12,39,26,78,32v46,8,71,6,72,11v-15,22,-34,43,-55,64v31,2,84,-12,84,21v0,24,-33,60,-98,107v-5,22,-88,3,-77,-10xm115,-175r5,16v4,-5,10,-8,13,-14v-7,0,-13,0,-18,-2xm135,-105r6,48v16,-7,23,-24,36,-34v4,-10,1,-19,-15,-17",w:241},C:{d:"0,-195v28,-19,63,-47,111,-32v19,-5,76,14,123,7r0,2v3,-4,15,-2,17,2v0,9,-17,29,-49,61r-94,0r18,73v74,-15,100,-37,118,-19v-36,24,-93,60,-161,78v-36,-73,-30,-80,-83,-166r0,-6",w:250},D:{d:"57,-240v10,-5,13,-9,22,-8v27,35,68,57,121,73v32,9,46,14,45,22v-37,47,-74,77,-108,97v-18,11,-50,32,-90,38v-7,-31,-9,-69,-7,-77v-14,-50,-21,-84,-40,-105v0,-10,20,-22,57,-40xm164,-117v-13,0,-30,-12,-39,-8r4,40v23,-8,35,-28,35,-32",w:245},E:{d:"52,-238v14,2,29,12,41,4v15,23,51,31,85,22r0,2v5,-1,11,-6,14,-2v0,-5,9,-7,26,-8r4,4v-3,7,-26,20,-70,31v-26,6,-39,8,-39,12v-3,25,48,17,65,20v27,-3,57,-15,83,-12r0,6v-25,13,-58,29,-105,38v-43,8,-32,21,-29,53v30,-11,68,-37,109,-51v5,22,-21,32,-72,69v-24,17,-52,28,-79,39v-3,-5,-6,-3,-10,0v-8,-27,-13,-71,-23,-93v-19,-3,-51,11,-46,-19v13,-14,23,-20,30,-20v-5,-24,-13,-36,-22,-36v-12,0,-14,-2,-14,-12v0,-10,13,-22,40,-35v0,-3,4,-7,12,-12",w:261},F:{d:"90,-241v12,-10,18,-13,27,-12v64,44,81,49,158,48v5,0,10,5,14,13v3,13,-48,15,-116,26v8,7,11,34,23,58r88,-28v1,1,2,2,4,2v-1,15,-32,34,-92,58v-2,16,-7,24,-15,23v-34,20,-57,29,-70,29r0,-4v-3,4,-8,-1,-10,-3r1,-26v-30,1,-104,3,-101,-15v-3,-8,21,-30,39,-24v12,-11,40,-4,57,-1v-8,-26,-27,-60,-58,-102v-2,-33,14,-25,51,-42",w:288},G:{d:"7,-89v-37,-101,101,-132,182,-162v5,0,10,19,14,57v-41,21,-51,28,-74,27v-9,-12,-17,-18,-24,-18v-16,17,-28,32,-26,55v49,-13,92,-34,143,-47r7,12r-15,133v5,0,9,3,12,10v0,10,-24,23,-71,41v-31,-1,-4,-51,-12,-65v-62,10,-101,6,-136,-43xm95,-101v9,10,23,15,41,15v6,-13,-15,-19,-33,-17"},H:{d:"100,-228v5,-1,8,1,9,4r1,87r33,4v-5,-12,-10,-44,-12,-80v5,-9,17,-18,38,-26v0,-3,12,-11,37,-24v9,6,10,17,8,32v-1,10,19,75,36,172v3,19,-16,40,-53,63v-15,1,-27,-4,-37,-15v3,-5,8,-7,9,-13r-15,-67v-31,7,-46,12,-46,16v2,21,-75,73,-87,32r6,-39v-10,-4,-22,-8,-27,-22v4,-5,14,-12,30,-21r0,-64",w:251},I:{d:"152,-325v28,7,5,27,-4,46v14,4,29,-6,40,4r-44,34v4,0,8,7,11,21v-8,-2,-4,10,-11,11v5,10,-16,15,-36,21v-16,-18,-20,-25,-36,-17v-4,0,-8,-10,-11,-27r5,-4v-19,-32,-33,-50,-7,-64v14,1,23,6,36,13v7,-10,16,4,23,8v5,-16,13,-30,24,-42v2,4,11,2,10,-4xm4,-150v-15,-31,40,-21,64,-31v47,15,53,29,82,8v3,4,8,-2,13,0v21,19,18,8,38,34v-31,5,-32,0,-32,23v0,60,22,43,60,40v2,3,6,4,6,9v-74,32,-194,62,-203,59v-11,-4,-16,-9,-17,-13v4,-12,13,-19,27,-19v0,-2,14,-5,43,-10v-4,-26,-1,-59,-9,-81v-48,0,-72,-6,-72,-19",w:235},J:{d:"166,-249v39,57,58,109,58,156v0,23,-31,46,-93,69v-65,8,-138,-30,-131,-60r24,-25v19,-7,39,-14,56,-24v0,8,11,4,9,13v-7,27,8,26,46,42v0,-28,-16,-69,-48,-122v8,-13,43,-25,64,-42v4,4,9,-10,15,-7",w:224},K:{d:"83,-238v8,8,16,31,24,70r40,-35v27,5,56,-19,80,-16r0,4v-27,29,-51,49,-71,60r0,4v58,-13,77,14,97,88v-34,10,-91,70,-97,-5v-12,-29,-27,-43,-46,-42r-3,71v-12,7,-43,26,-83,30v-17,-12,-12,-23,0,-50v-1,-23,2,-51,-2,-71v10,-9,-32,-54,-17,-90v4,5,13,0,18,-1r0,3v21,-10,39,-11,60,-20",w:253},L:{d:"87,-227v36,40,19,90,17,150r60,-17v-2,-9,-10,-20,0,-25v20,-10,38,-21,64,-25v8,3,21,15,38,37v2,22,-8,25,-31,40v0,5,-9,10,-27,17v-65,-11,-141,21,-179,37r0,-2v-11,7,-21,-7,-19,-27v12,-38,27,-102,-8,-133v5,-4,-2,-14,-2,-21v8,-7,64,-26,87,-31",w:265},M:{d:"141,-202v-10,-13,35,-41,64,-50v2,0,5,12,8,37r26,74v45,74,22,83,-49,143v-16,8,-29,13,-41,13v-13,-10,43,-35,44,-66v-4,-19,-8,-28,-12,-28v-43,30,-51,51,-74,33v-9,-15,-16,-32,-26,-46v-8,8,-33,27,-71,38v-5,-1,-11,0,-10,-13v30,-42,43,-68,34,-115v0,-8,45,-35,67,-38v5,-2,14,29,35,64",w:261},N:{d:"8,-172v16,-8,19,-19,44,-17v0,-3,9,-6,28,-10r57,60r-3,-92v-8,-1,-25,-1,-27,-13v12,-22,49,-29,82,-34v13,3,20,13,20,30v0,58,5,127,16,206v-11,7,-31,34,-65,38v-13,-19,-38,-46,-75,-80v-3,19,-10,28,-20,28v-5,5,-14,10,-28,15v-2,6,-11,9,-24,9v-7,-7,-14,-14,-13,-25v17,-32,20,-72,8,-115",w:225},O:{d:"214,-139v5,22,-65,106,-126,106v-30,0,-58,-20,-83,-58v-10,-38,-3,-59,24,-89v3,0,10,-7,20,-22v21,-5,37,-19,77,-25v3,0,5,4,8,13v20,0,42,12,68,34v11,19,13,22,12,41xm82,-168v-27,28,5,71,46,80v6,0,11,-10,16,-30v0,-18,-20,-35,-62,-50",w:214},P:{d:"0,-212v26,-13,44,-34,74,-43v34,29,70,50,107,62v44,13,66,21,66,25v0,9,-38,34,-113,74v3,17,-1,31,2,45v-17,12,-43,23,-76,35v-14,-6,1,-36,-7,-49r3,0v-6,-10,-3,-30,-7,-44r3,0v-12,-46,-34,-74,-52,-105xm128,-140r4,29v9,-7,22,-10,28,-20",w:246},Q:{d:"160,-239v35,0,51,10,50,25v-7,10,-14,15,-20,15r0,4v48,11,49,32,55,70v6,11,30,-6,33,9v-9,10,-26,20,-50,28v-34,35,-60,70,-119,70v-50,0,-85,-26,-107,-78v-9,-55,20,-76,81,-110v25,-22,51,-33,77,-33xm90,-175v-11,13,-13,55,0,59r57,-37v5,3,8,8,15,9v-5,-10,-13,-20,-24,-18v-13,-9,-29,-13,-48,-13xm171,-85v-16,4,-38,1,-57,2v15,15,25,21,44,20v8,-6,13,-14,13,-22",w:277},R:{d:"142,11v0,-17,14,-58,39,-102v-2,-13,-24,-9,-44,-10r3,32v-46,26,-60,52,-78,30v1,-67,-19,-119,-62,-181v2,-7,6,-14,4,-22r67,-25v0,9,45,22,135,41v-3,4,15,2,14,11v-16,29,-35,51,-55,66v1,6,17,4,22,3v99,8,47,25,26,109v9,2,10,3,9,10v-25,22,-47,36,-64,41v-2,-5,-9,-1,-16,-3xm112,-190v10,17,9,30,14,34v7,-5,14,-13,21,-25v-3,-3,-15,-6,-35,-9",w:245},S:{d:"230,-109v-34,49,-124,96,-205,95v-15,-28,18,-74,33,-68v23,-8,38,-17,44,-11v-3,18,-12,34,-10,42v31,0,54,-10,71,-30v-78,-19,-127,-37,-145,-56v-34,-35,-20,-57,28,-85v23,-5,61,-29,99,-28v-1,4,27,25,35,37v0,3,-18,17,-54,42r-6,0v-20,-21,-35,-30,-51,-30v-3,41,32,50,111,71v32,8,50,13,50,21"},T:{d:"150,-265v32,-10,21,45,30,71r-2,0v3,2,2,9,3,14v30,11,101,7,125,14v2,-3,10,-5,9,1v-47,8,-90,17,-131,28v4,19,2,41,6,58r92,-52v7,0,14,-4,15,5v-4,8,-26,21,-61,46v-46,32,-81,60,-111,74v-13,-9,-10,-28,-14,-45v10,-19,-3,-56,-4,-82v-37,1,-112,7,-107,-24v18,-13,39,-24,64,-34v11,1,28,10,36,6v-1,-13,-5,-26,-11,-40",w:314},U:{d:"9,-203v28,-13,48,-27,77,-31v18,24,12,103,-3,156v29,4,69,-11,64,-15r-29,-84v44,-19,70,-28,77,-28v4,22,14,76,25,79v10,-2,16,29,22,48v-12,12,-38,27,-77,44v-7,-7,-10,-17,-11,-31v-64,32,-97,32,-147,40r-7,-24v12,-54,23,-84,15,-114r3,0",w:241},V:{d:"157,-251v47,18,70,34,70,47v10,22,-11,56,-32,120v0,25,-29,50,-87,75v-8,-20,-43,-58,-96,-120v-27,-32,-7,-30,54,-52v23,2,35,8,35,19v13,14,23,28,30,45r5,0v17,-37,26,-64,26,-80v0,-25,-24,-30,-52,-35r0,-5"},W:{d:"232,-282v26,66,-20,168,-16,244v-8,8,-25,20,-52,36r-46,-109r-11,52v-21,18,-27,16,-49,32v-14,-20,-35,-92,-57,-109v-3,-10,2,-20,12,-19v6,-3,19,-10,39,-14v2,0,9,10,21,30v6,-22,12,-44,7,-64v26,-14,44,-21,54,-21v2,-1,22,65,34,91r2,0v10,-32,32,-163,-33,-141v-14,-23,20,-34,53,-39v28,8,42,19,42,31",w:239},X:{d:"203,-238v13,0,26,-1,26,11r-65,95r51,39v9,0,28,7,25,26v-6,7,-26,23,-60,46v-47,-32,-72,-49,-76,-49v-33,35,-33,46,-65,44v-8,0,-12,-2,-14,-7v0,-11,6,-20,19,-25r34,-39v-52,-42,-78,-71,-78,-86v29,-13,47,-37,85,-41v27,36,36,57,49,60v2,-9,13,-21,5,-28",w:239},Y:{d:"66,-51v-10,-15,-52,-126,-66,-134r0,-7r77,-41v22,22,39,63,50,123v16,-9,18,-5,18,-20v0,-19,1,-32,4,-40v-6,-3,-9,-7,-9,-13v7,-6,42,-38,88,-59r9,15v-10,54,-14,117,-20,169v12,36,-2,32,-59,71r-81,-18v2,-16,18,-18,26,-28v11,2,17,-11,37,-18v-2,-10,3,-27,-2,-33v-42,22,-66,33,-72,33",w:237},Z:{d:"194,-3v-40,-44,-93,-52,-164,-50v-14,-22,-4,-20,29,-41r59,-35v32,-29,54,-51,47,-59v-24,4,-48,4,-60,16v3,8,8,13,9,22r-51,35v-18,0,-27,-7,-27,-21v-13,-22,-24,-33,-34,-33v-8,-18,46,-31,59,-47v29,7,66,-9,150,-27v15,4,37,-21,38,4v-43,76,-74,85,-122,133v15,2,21,6,38,12v-1,-23,17,-36,54,-48v10,-3,21,19,15,38v4,19,12,34,13,55v-15,14,-29,36,-53,46",w:249}}});


//Define globals and sync process
var rhost = (window.location + "").split("://")[0] + "://" + window.location.hostname + ":" + window.location.port + "/";
var databases = {};

eve.on("database.init", function(){
    var db = eve.nt().split(".")[2];
    var name = db;
    var db = databases[db];

    db.database = new PouchDB(PouchDB.utils.Crypto.MD5(db.local, {auto_compaction:true}));
    db.remotedb = null;

    eve("database.created."+name);
});


//Login handler :: requires a database meta object as parameter ( example: databases.interfacedb )
//usage: eve("database.login.request", null, databases.interfacedb);
eve.on("database.login.request", function(database, custom){
    var login = {};

    login.init = function(){
        var self = this;
        self.border = 5;

        if(!isUndefinedOrNull(getElement("login_container"))) {
            //console.log("Another login window is already open, cancelling.");
            return;
        }

        login.container = DIV({"id":"login_container"});

        setStyle(self.container, {
            "position":"absolute",
            "border": "solid red 0px",
            "zIndex": 100001
        });

        makePositioned(self.container);

        appendChildNodes(currentDocument().body, self.container);

        self.min_width = 300;
        self.max_width = 400;
        self.min_height= 180;

        login.paper_container = DIV({});
        appendChildNodes(login.container, login.paper_container);
        setStyle(login.paper_container, {width:"100%", height:"100%"});

        self.paper = Raphael(login.paper_container);
        self.background = self.paper.rect(self.border/2,self.border/2,50,50, self.border*2).attr({
            "fill":"30-#061A30-#345985", 
            "stroke":"white",
            "stroke-width":self.border
        });

        self.username = self.paper.text(0, 0, "Username");
        self.password = self.paper.text(0, 0, "Password");

        if(custom) {
            self.title = self.paper.text(0,0,"Please login" + ( custom.remote ? " to\n" + custom.remote : "" ));
        }
        else {
            self.title = self.paper.text(0,0,"Please login to\n" + database.remote);
        }

        self.status = self.paper.text(0,0, "Awaiting login...");
        if(custom && custom.message){
            self.status.attr({"text":custom.message});
        }

        map(function(item) {
          item.attr({
            "fill": "white",
              "stroke-width": .5,
              "stroke": "white",
              "stroke-opacity": .2,
              "font-size": 12,
              "font-family": "Arial, Helvetica, sans-serif",
              "fill-opacity": .8,
              "font-weight": "bold"
          });
        }, [self.username, self.password, self.title, self.status]);

        self.status.attr({
            "font-size":11,
            "font-weight": "normal"
        });


        self.username_input = INPUT();
        self.password_input = INPUT({
          "type": "password"
        });

        var handleInputChange = function(){
            var usr = self.username_input.value;
            var pwd = self.password_input.value;

            if(isUndefinedOrNull(usr) || usr == ""){
                msg = "Please enter user name.";
                self.username_input.focus();
            }
            else if(isUndefinedOrNull(pwd) || pwd == ""){
                self.password_input.focus();
                msg = "Please enter password."
            }
            else {
                msg = "Hello "+usr+",\nChecking your credentials...";

                if(!custom){

                    database.remotedb = null;
                    database.auth = PouchDB.utils.extend(true, {}, {"username":usr, "password":pwd});
                }
                else {
                    database.database = null;
                    database.remotedb = null;
                    database.auth = PouchDB.utils.extend(true, {}, {"username":usr, "password":pwd});
                    database.local = usr + " :: " + rhost;
                    database.remote = "userdb_"+appname+"_"+usr;

                    eve("application.user_validate", database);
                }

                callLater(.5, self.destroy);
            }

            self.status.attr({"text":msg});

        };

        connect(self.username_input, "onchange", handleInputChange);
        connect(self.password_input, "onchange", handleInputChange);
        connect(self.password_input, "onblur", handleInputChange);
        connect(self.password_input, "onpaste", handleInputChange);


        map(function(item) {
          appendChildNodes(self.container, item);
          setStyle(item, {
            "position": "absolute",
              "border": "solid red 0px"
          });
          makePositioned(item);
        }, [self.username_input, self.password_input]);

        self.background.attr({"fill-opacity":.001});
        self.background.animate({"fill-opacity":1}, 500);

        self.resize();
        if(custom && custom.username){
            self.username_input.value = custom.username;
            self.password_input.focus();
        }else {
            self.username_input.focus();
        }

        return login;
    }

    login.resize = function(){
        var self = this;
        var d = getViewportDimensions();

        //Try to position login window correctly
        //1:3 left, 1:5 top
        self.width  = ( d.w / 3 ) > self.min_width ? d.w/3 : self.min_width;
        self.width  = self.width  < self.max_width ? self.width : self.max_width;

        self.height = self.width * self.min_height / self.min_width;

        setElementDimensions(self.container, {w:self.width, h:self.height});
        self.paper.setSize(self.width, self.height);

        self.x = (d.w - self.width)/2 ;
        self.y = (d.h - self.height)/4 ;

        if(self.x < 0) self.x = 0;
        if(self.y < 0) self.y = 0;

        setElementPosition(self.container, {x:self.x, y:self.y});
        self.background.attr({
            width:self.width - self.border, 
            height:self.height - self.border
        });

        self.title.attr({
            "x": self.width / 2,
            "y": self.height * .2
        });

        self.username.attr({
            "text-anchor": "start",
            "x": self.width * .1,
            "y": self.height * .5
        });

        var bb = self.username.getBBox();
        self.password.attr({
            "text-anchor": "start",
            "x": bb.x,
            "y": bb.y2 + bb.height + 5
        });
        var pp = self.password.getBBox();
        setElementPosition(self.username_input, {
            x: pp.x2 + 10,
            y: bb.y - 2
        });
        setElementPosition(self.password_input, {
            x: pp.x2 + 10,
            y: pp.y - 2
        });
        map(function(item) {
            setElementDimensions(item, {
                w: self.width * .5,
                h: 15
                });
        }, [self.username_input, self.password_input]);

        self.status.attr({x:self.width/2, y:self.height*.85});

    }

    login.destroy = function(){

        var self = this;

        disconnectAll(self.username_input);
        disconnectAll(self.password_input);
        disconnectAll(self);

        eve.off("window.resize", self.resize);

        self.paper.remove();
        self.paper = null;
        removeElement(self.container);
        self.container = null;

        return;

    };


    bindMethods(login);
    eve.on("window.resize", login.resize);
    login.init();
});

//Sync handler
//usage: eve("database.sync/changes.request.<database name>");
(function(glob) {
    eve.on("database.request.*", function() {

        var db = eve.nt().split(".")[3];
        var type = eve.nt().split(".")[2];

        if(isUndefinedOrNull(databases[db].polling)) databases[db].polling = 1000;
        var polling = databases[db].polling;

        opts = {};

        if(type == "sync") {

            if(databases[db].sync_in_progress){
                console.log("Sync request denied, one is already in progress.");
                return;
            }
            else {
                databases[db].sync_in_progress = true;
            }

            //log(db + " :: received sync request");
            var waiter = new Deferred();
            var syncFrom = new Deferred();
            var syncTo = new Deferred();
            waiter.addCallbacks(function() {
                if(databases[db].sync.from && !isUndefinedOrNull(databases[db].remote)) {
                    var onComplete = function(err, res) {
                        if(!isUndefinedOrNull(err)) {
                            eve("database.sync.status." + db, {
                                success: false,
                                type: "from"
                            });
                            console.log("In error, checking");
                            console.log(err);

                            //Analyze if issue is due to auth
                            if(err.status == 500 && err.details && err.details.message && err.details.message == "You are not a db or server admin."){

                                eve("database.login.request", null, databases[db]);
                            }
                            if(err.status == 500 && err.details && err.details.message && err.details.message == "Name or password is incorrect."){

                                eve("database.login.request", null, databases[db]);
                            }
                            if(window.LOG_FAILED_REPLICATION) log2("Error encountered during replication ( FROM ) : " + db + " :: " + JSON.stringify(res));
                            if(window.LOG_FAILED_REPLICATION) console.log(err);
                            if(window.LOG_FAILED_REPLICATION) console.log(res);

                        } else {

                            if(isUndefinedOrNull(databases[db].replications)) databases[db].replications = {};
                            if(isUndefinedOrNull(databases[db].replications.from)) databases[db].replications.from = 0;
                            databases[db].replications.from += 1;
                            if(databases[db].replications.from == 1){
                                eve("database.initial.replication.from."+db);
                            }

                            eve("database.sync.status." + db, {
                                success: true,
                                type: "from"
                            });
                        }
                        eve("database.response.sync.from." + db);
                        //eve("buffered."+databases[db].polling+".database.request.sync."+db);
                        return syncFrom.callback();
                    };

                    //Create database if it is not created yet
                    if(isUndefinedOrNull(databases[db].remotedb)){
                        var opts2 = {auto_compaction:true};
                        if(!isUndefinedOrNull(databases[db].auth))
                            opts2.auth = databases[db].auth;
                        PouchDB(databases[db].remote, opts2, function(err, remote_database){
                            var opts3 = {complete:onComplete};
                            if(databases[db].filter_from)
                                opts3.filter = databases[db].filter_from;
                            if(isUndefinedOrNull(err)){
                                databases[db].remotedb = remote_database;
                                databases[db].database.replicate.from(databases[db].remotedb, opts3);
                                return;
                            }
                            else {

                                if(err.status == 404){
                                    //Means we could not create database, request admin credentials
                                    //eve("database.login.request", null, databases[db]);

                                    //Only request admon credentials if we are in the setup mode
                                    var fragment = (window.location+"").split("#");
                                    if(fragment[1] == "setup"){
                                        eve("database.login.request", null, databases[db]);
                                    }
                                    else {
                                        if(isUndefinedOrNull(databases[db].user_warning)) databases[db].user_warning = 0;
                                        if(databases[db].user_warning++ % 10 == 0) log("Database: " + databases[db].remote + " doesn't exist yet. You need to wait for your admin's validation.", 1);
                                    }

                                }
                                if(err.status == 401){
                                    //Means we could not open database, request credentials
                                    eve("database.login.request", null, databases[db]);
                                }

                                if(window.LOG_FAILED_REPLICATION) log2("Error encountered during replication ( FROM ) : " + db + " :: " + err);
                                if(window.LOG_FAILED_REPLICATION) console.log(err);

                                eve("database.sync.status." + db, {
                                    success: false,
                                    type: "from"
                                });
                                return syncFrom.callback();
                            }
                        });
                    }
                    else {
                        var opts3 = {complete:onComplete};
                        if(databases[db].filter_from)
                            opts3.filter = databases[db].filter_from;
                        databases[db].database.replicate.from(databases[db].remotedb, opts3);
                    }
                } else {
                    //log("Returning blank sync from");
                    return syncFrom.callback();
                }
            });

            syncFrom.addCallbacks(function() {
                if(databases[db].sync.to && !isUndefinedOrNull(databases[db].remote)) {
                    var onComplete = function(err, res) {

                        if(!isUndefinedOrNull(err)) {
                            eve("database.sync.status." + db, {
                                success: false,
                                type: "to"
                            });
                            //Analyze if issue is due to auth
                            if(err.status == 500 && err.details && err.details.message && err.details.message == "You are not a db or server admin."){

                                eve("database.login.request", null, databases[db]);
                            }
                            if(err.status == 500 && err.details && err.details.message && err.details.message == "Name or password is incorrect."){

                                eve("database.login.request", null, databases[db]);
                            }
                            //Silly message specific to validate_update_doc
                            if(err.status == 500 && err.details && isArrayLike(err.details) && err.details[0].reason == "Only database admin can write here, seriously :)."){

                                eve("database.login.request", null, databases[db]);
                            }
                            if(window.LOG_FAILED_REPLICATION) console.log("Error encountered during replication ( TO ) : " + db + " :: " + err);
                            if(window.LOG_FAILED_REPLICATION) console.log(err);
                            if(window.LOG_FAILED_REPLICATION) console.log(res);
                        } else {

                            if(isUndefinedOrNull(databases[db].replications)) databases[db].replications = {};
                            if(isUndefinedOrNull(databases[db].replications.to)) databases[db].replications.to = 0;
                            databases[db].replications.to += 1;

                            if(databases[db].replications.to == 1){
                                eve("database.initial.replication.to."+db);
                            }

                            eve("database.sync.status." + db, {
                                success: true,
                                type: "to"
                            });
                        }
                        eve("database.response.sync.to." + db);
                        //eve("buffered."+databases[db].polling+".database.request.sync."+db);
                        return syncTo.callback();
                    };
                    //Create database if it is not created yet
                    if(isUndefinedOrNull(databases[db].remotedb)){
                        var opts2 = {auto_compaction:true};
                        if(!isUndefinedOrNull(databases[db].auth))
                            opts2.auth = databases[db].auth;
                        PouchDB(databases[db].remote, opts2, function(err, remote_database){

                            if(isUndefinedOrNull(err)){
                                databases[db].remotedb = remote_database;
                                var opts3 = {complete:onComplete};
                                if(databases[db].filter_to)
                                    opts3.filter = databases[db].filter_to;
                                databases[db].database.replicate.to(databases[db].remotedb, opts3);
                            }
                            else {
                                if(err.status == 404 || err.status == 401){
                                    //Means we could not create database, request admin credentials
                                    //eve("database.login.request", null, databases[db]);

                                    //Only request admin credentials if we are in the setup mode
                                    var fragment = (window.location+"").split("#");
                                    if(fragment[1] == "setup"){
                                        eve("database.login.request", null, databases[db]);
                                    }
                                    else {
                                        if(isUndefinedOrNull(databases[db].user_warning)) databases[db].user_warning = 0;
                                        if(databases[db].user_warning++ % 10 == 0) log("Database: " + databases[db].remote + " doesn't exist yet. You need to wait for your admin's validation.", 1);
                                    }
                                }
                                if(err.status == 401){
                                    //Username/password error
                                    eve("database.login.request", null, databases[db]);
                                }

                                if(window.LOG_FAILED_REPLICATION) console.log("Error encountered during replication ( TO ) : " + db + " :: " + err);
                                if(window.LOG_FAILED_REPLICATION) console.log(err);

                                eve("database.sync.status." + db, {
                                    success: false,
                                    type: "to"
                                });
                                return syncTo.callback();
                            }
                        });
                    }
                    else {
                        var opts3 = {complete:onComplete};
                        if(databases[db].filter_to)
                            opts3.filter = databases[db].filter_to;
                        databases[db].database.replicate.to(databases[db].remotedb, opts3);
                    }
                } else {
                    //log("Returning blank sync to");
                    return syncTo.callback();
                }
            });
            syncTo.addCallback(function() {
                eve("database.sync.status." + db, {
                    success: true,
                    type: "idle"
                });
                databases[db].sync_in_progress = false;
                eve("buffered." + databases[db].polling + ".database.request.sync." + db);
            });
            waiter.callback();
        }
        if(type == "changes") {
            //log("Changes request Received : " + eve.nt() + " LAST_SEQ: " + databases[db].last_seq, 1);
            databases[db].database.changes({
                "onChange": function(change) {
                    //Handle bug on last seq
                    //if(change.seq <= databases[db].last_seq) return;
                    //log("DB: " + db + " CHANGE: " + serializeJSON(change), -1);
                    eve("buffered.100.database.change." + db + "." + change.id, change);
                    //We update the last seq
                    if(databases[db].last_seq < change.seq) databases[db].last_seq = change.seq;

                },
                "complete": function(err, res) {
                    if(!isUndefinedOrNull(err)){
                        log2("Problem reading changes on " + db + ": " + JSON.stringify(err) );
                    }
                    //log2("DB: " + db + " CHANGE(complete): " + serializeJSON(res) + " :: " + databases[db].database.type(), -1);
                    //This is where you trigger next change request
                    eve("buffered." + databases[db].polling + ".database.request.changes." + db);
                },
                "since": databases[db].last_seq,
                //Make changes feed continuous if not http
                "continuous": databases[db].database.type() != 'http' ? true : false
            });
        }
    });
})(this);

eve.on("github.sync", function(params){
    if(isUndefinedOrNull(params)){
        params = {
            "git" : "https://api.github.com/repos/trokster/xcayp/contents/next/modules/"
        };
    }
});


//The heart of the module skeleton
eve.on("interface.request.*", function(callback) {
    var req = this;
    var cls = eve.nt().split(".")[2];
    var event = eve.nt();

    if(isUndefinedOrNull(this.id)){
        alert("An interface.request was sent without an id, cancelling spawn");
        return;
    }

    //We check if we have interface class in DB
    //Otherwise, we keep requesting it until we
    //have one
    var f = function(err, doc) {
            if(!isUndefinedOrNull(err)) {
                console.log("Error getting interface object: " + cls + ", resubmitting");
                console.log("ERROR: " + serializeJSON(err));
                eve("delayed.1000." + event, req);
            } else {
                //var o = reviveJSON(evalJSON(serializeJSON(doc)));
                var o = evalJSON(atob(doc.content.replace(/[\n\r]/g, '')));
                o._id = doc._id;
                //Keeping o.name for retro-compatibility
                //Remove as soon as possible
                //We check if mixins are required, and if mixins are ready ( in window )
                if(!isUndefinedOrNull(o.mixins) && isUndefinedOrNull(window.mixins)) {
                    console.log("Error instantiating interface object: " + cls + ", mixins not ready... Resubmitting");
                    eve("delayed.500." + event, req);
                    return;
                }

                o.name = req.id;

                //Handle special case for postInits
                var postInits = [];
                if(o.postInits) {
                    map(function(ini){postInits.push(ini);}, o.postInits)
                }
                if(req.postInits) {
                    map(function(ini){postInits.push(ini);}, req.postInits);
                }
                req.postInits = postInits;

                //Handling special cases for parent and children
                //These are straight references that can loop, so we handle
                //them differently
                var transient_vars = {};
                map(function(item) {
                    if(!isUndefinedOrNull(req[item])) {
                        transient_vars[item] = req[item];
                        delete req[item];
                    }
                }, ["parent", "children"]);

                var oo = PouchDB.utils.extend(true, {}, req);
                update(oo, transient_vars);
                delete transient_vars;

                oo.id = cls + "." + req.id;
                //mutate o to accept all settings put in req
                //console.log("Mutate param: " + o.name + " :: " +JSON.stringify(req));
                update(o, oo);
                //console.log("Pre build: " + o.name + " :: " +JSON.stringify(oo));
                if(o.mixins) {
                    map(function(mix) {
                        window.mixins[mix](o);
                        bindMethods(o);
                    }, o.mixins);
                }
                //A last bind for good measure
                bindMethods(o);

                //Run mixin inits
                if(o.inits && o.inits.length) {
                    map(function(ff) {
                        ff.apply(o);
                    }, o.inits);
                }

                o.init && o.init();

                //Run mixin postInits
                if(o.postInits && o.postInits.length) {
                    map(function(ff) {
                        ff.apply(o);
                    }, o.postInits);
                }

                window.INTERFACE_OBJECT_REFERENCE["interface." + cls + "." + req.id] = o;
                //log("Found: " + cls + " rev: " + o._rev);
                eve("interface.response." + cls + "." + req.id, {
                    "req": req,
                    "obj": o
                });

                var dest = function() {
                        var callback = this.callback;
                        //Prevent multiple calls ( normally .once prevents this)
                        if(o._destroyed) return;

                        o._being_destroyed = true;
                        var handleRemove = function(){
                            //Prevent multiple calls ( normally .once prevents this)
                            if(o._destroyed) return;

                            o._destroyed = true;
                            eve.off("interface." + cls + "." + req.id + ".*");
                            //eve.off("interface.request_handle." + cls + "." + req.id);

                            if(!isUndefinedOrNull(o.cleanup)) o.cleanup();
                            if(!isUndefinedOrNull(o.cleanups)) {
                                map(function(oc) {
                                    oc.apply(o);
                                }, o.cleanups)
                            }
                            //Callback if defined ( Handy in case you need the object to re-instantiate )
                            if(!isUndefinedOrNull(callback)) callback();
                            delete window.INTERFACE_OBJECT_REFERENCE["interface." + cls + "." + req.id];
                            eve("delayed.0.interface.removed." + cls + "." + req.id);
                        };
                        if(o.implements && o.implements("isLockable")){
                            o.lock.acquire().addCallback(function(){
                                handleRemove();
                                o.lock.release();
                            });
                        }
                        else {
                            handleRemove();
                        }
                    };
                eve.once("interface.remove." + cls + "." + req.id, dest);
                //log(cls+" Ready");
                if(callback) callback(o);
            }
        };
    databases.interfacedb.database.get(cls, f);

});


eve.on("interface.mixin.change", function() {
    var to_be_respawned = {};
    var to_check = clone(this.updated);
    extend(to_check, this.deleted);
    map(function(mix) {
        map(function(idx) {
            var o = window.INTERFACE_OBJECT_REFERENCE[idx];
            if(isUndefinedOrNull(o.implemented_mixins)) return;
            if(findValue(o.implemented_mixins, mix) != -1 && findValue(o.implemented_mixins, "canRespawn") != -1) {
                to_be_respawned[idx.split(".")[1]] = true;
            }
        }, keys(window.INTERFACE_OBJECT_REFERENCE));
    }, to_check);
    log("Classes to be respawned: " + serializeJSON(keys(to_be_respawned)));
    //Simulate database change to respawn component
    map(function(item) {
        eve("database.change.interfacedb." + item, {
            "seq": "DUMMY",
            changes: []
        });
    }, keys(to_be_respawned));
})


//Utility function
//Pattern or parameters is of the form: button.button0 ( we dump the interface prefix )
eve.on("interface.request_add_children", function(parent, children) {
    if(!isArrayLike(children)) children = [children];

    var waits = ["interface.response_handle." + parent];
    eve("delayed.0.interface.request_handle." + parent)

    map(function(c) {
        waits.push("interface.response_handle." + c);
        eve("delayed.0.interface.request_handle." + c);
    }, children)

    waitForEvents(waits).addCallback(function() {
        map(function(c) {
            window.INTERFACE_OBJECT_REFERENCE["interface." + parent].appendChildren(window.INTERFACE_OBJECT_REFERENCE["interface." + c]);
        }, children);
    });

})
eve.on("interface.request_remove_children", function(parent, children) {
    if(!isArrayLike(children)) children = [children];

    var waits = ["interface.response_handle." + parent];
    eve("delayed.0.interface.request_handle." + parent)

    map(function(c) {
        waits.push("interface.response_handle." + c);
        eve("delayed.0.interface.request_handle." + c);
    }, children)

    waitForEvents(waits).addCallback(function() {
        map(function(c) {
            window.INTERFACE_OBJECT_REFERENCE["interface." + parent].removeChildren(window.INTERFACE_OBJECT_REFERENCE["interface." + c]);
        }, children);
    });

})


eve.on("interface.request_handle.*", function() {

    var evt = eve.nt();

    var lcls = evt.split(".")[2];
    var lname = evt.split(".")[3];

    if(("interface." + lcls + "." + lname) in window.INTERFACE_OBJECT_REFERENCE) {
        var o = window.INTERFACE_OBJECT_REFERENCE["interface." + lcls + "." + lname];
        if(typeof(this) == 'function') this(o);
        eve("delayed.0.interface.response_handle." + lcls + "." + lname, o);
    } else {
        //try{console.log("Received request for: " + cls + "."+ name+ " :: Not, found re-submitting")}catch(e){noop()}
        eve("delayed.500." + evt, this);
    }

});


eve.on("application.user_validate", function() {
  var database = this;
  console.log("Validating user: " + database.auth.username);

  database.local = database.auth.username + "-" + rhost;
  database.remote = checkIfRewrite(rhost) + "userdb_" + appname + "_" + database.auth.username;

  eve("application.local_user_validate", database);

});

eve.on("application.local_user_validate", function() {
  var database = this;

  //Try to log on locally and see if first init object exists
  PouchDB(PouchDB.utils.Crypto.MD5(database.local), function(err, db) {
    if (!isUndefinedOrNull(err)) {
      log("Error creating local DB:\n" + database.local + "\n" + JSON.stringify(err), 1);
      console.log("Error creating local DB:\n" + database.local + "\n", 1);
      console.log(err);
      return;
    } else {
      db.get("user_init", function(err, doc) {
        if (!isUndefinedOrNull(err)) {
          log("Error getting init object, checking remote");
          eve("application.remote_user_validate", database);
        } else {
          //Local DB exists and is valid, set up remote and launch sync
          log("User exists locally, setting up remote", -1);
          database.database = db;
          database.sync.to = true;
          database.sync.from = true;
          database.polling = 1500;
          eve("database.request.sync.userdb");
        }
      });
    }
  });
});

eve.on("application.remote_user_validate", function() {
  var database = this;

  //Try to validate the user remotely
  var db = rhost.split("://");
  PouchDB(db[0] + "://" + database.auth.username + ":" + database.auth.password + "@" + db[1] + "_users", function(err, usersdb) {
    if (!isUndefinedOrNull(err)) {
      console.log("Error connecting to _users");
      console.log(err);

      //If message is password incorrect, we have no way to know if user exists
      //or if password is wrong so we try to create user
      if (err.message == "Name or password is incorrect.") {
        if (confirm("User " + database.auth.username + " doesn't seem to exist, would you like to create it ?")) {
          eve("application.remote_user_create", database);
          return;
        } else {
          log("Login aborted", -1);
          return;
        }
      }
      //Otherwise we consider it a network problem and ask to connect later
      else {
        log("Problem connecting to remote users DB, please try again later", 1);
      }

    } else {
      //A valid user exists we're good to go

      //Check if user is valid for this application
      usersdb.get("org.couchdb.user:" + database.auth.username, function(err, doc){
        if(doc){
            if(isUndefinedOrNull(doc.validated)) doc.validated = {};
            if(isUndefinedOrNull(doc.validated[appname])) {
                doc.validated[appname] = false;
                usersdb.put(doc);
            }
        }
      });


      log("User exists remotely, setting up local and remote", -1);
      database.database = PouchDB(PouchDB.utils.Crypto.MD5(database.local), function(err, db) {
        if (!isUndefinedOrNull(err)) {
          console.log("Error creating local DB");
          console.log(err);
        } else {
          database.database.put({
            _id: "user_init",
              "first_init": true
          });
          database.sync.to = true;
          database.sync.from = true;
          database.polling = 1500;
          eve("delayed.100.database.request.sync.userdb");
        }
      });
    }
  });
});

eve.on("application.remote_user_create", function() {
  var database = this;
  var db = rhost.split("://");
  PouchDB(rhost + "_users", function(err, usersdb) {
    if (!isUndefinedOrNull(err)) {
      console.log("Error connecting to usersdb");
      console.log(err);
    } else {
      //Try to create user
      usersdb.put({
        _id: "org.couchdb.user:" + database.auth.username,
        type: "user",
        name: database.auth.username,
        password: database.auth.password,
        roles: ["reader"]
      }, function(err, doc) {
        if (!isUndefinedOrNull(err)) {
          if (err.message == "Document update conflict.") {
            //This means the user already exists so essentially it's a
            //password mistake
            log("Error creating user.\nWrong password entered earlier.", 1);
            console.log("Attemtpting to re-summon login");
            console.log(database.auth.username);
            eve("delayed.1500.database.login.request", null, databases.userdb, {
              "remote": "Xcayp",
                "username": database.auth.username,
                "message": "User already exists.\nPlease enter correct password"
            });
            return;
          }
          console.log("Error creating user");
          console.log(err);
        } else {
          //User created correctly, launch sync
          log("User created remotely, setting up local and remote", -1);
          database.database = PouchDB(PouchDB.utils.Crypto.MD5(database.local), function(err, db) {
            if (!isUndefinedOrNull(err)) {
              console.log("Error creating local DB");
              console.log(err);
            } else {
              database.database.put({
                _id: "user_init",
                  "first_init": true
              });
              database.sync.to = true;
              database.sync.from = true;
              database.polling = 1500;
              eve("delayed.100.database.request.sync.userdb");
            }
          });
        }
      });
    }
  });
})


