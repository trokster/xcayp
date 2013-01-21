//Disable console
if(!window.console || !console){
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
    if (lineWidth > 0) {
        for (; i < textLength; i++) {
            if (text.charAt(i) == " ") {
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

var DumpObject = function(obj)
{
  var od = new Object;
  var result = "";
  var len = 0;

  for (var property in obj)
  {
    var value = obj[property];
    if (typeof value == 'string')
      value = "'" + value + "'";
    else if (typeof value == 'object')
    {
      if (value instanceof Array)
      {
        value = "[ " + value + " ]";
      }
      else
      {
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
window.current_dimensions = {};
//And we need binary translators
if (!window.btoa) window.btoa = base64.encode
if (!window.atob) window.atob = base64.decode
    
'use strict';

// Add ECMA262-5 method binding if not supported natively
//
if (!('bind' in Function.prototype)) {
    Function.prototype.bind= function(owner) {
        var that= this;
        if (arguments.length<=1) {
            return function() {
                return that.apply(owner, arguments);
            };
        } else {
            var args= Array.prototype.slice.call(arguments, 1);
            return function() {
                return that.apply(owner, arguments.length===0? args : args.concat(Array.prototype.slice.call(arguments)));
            };
        }
    };
}

// Add ECMA262-5 string trim if not supported natively
//
if (!('trim' in String.prototype)) {
    String.prototype.trim= function() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };
}

// Add ECMA262-5 Array methods if not supported natively
//
if (!('indexOf' in Array.prototype)) {
    Array.prototype.indexOf= function(find, i /*opt*/) {
        if (i===undefined) i= 0;
        if (i<0) i+= this.length;
        if (i<0) i= 0;
        for (var n= this.length; i<n; i++)
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('lastIndexOf' in Array.prototype)) {
    Array.prototype.lastIndexOf= function(find, i /*opt*/) {
        if (i===undefined) i= this.length-1;
        if (i<0) i+= this.length;
        if (i>this.length-1) i= this.length-1;
        for (i++; i-->0;) /* i++ because from-argument is sadly inclusive */
            if (i in this && this[i]===find)
                return i;
        return -1;
    };
}
if (!('forEach' in Array.prototype)) {
    Array.prototype.forEach= function(action, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                action.call(that, this[i], i, this);
    };
}
if (!('map' in Array.prototype)) {
    Array.prototype.map= function(mapper, that /*opt*/) {
        var other= new Array(this.length);
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                other[i]= mapper.call(that, this[i], i, this);
        return other;
    };
}
if (!('filter' in Array.prototype)) {
    Array.prototype.filter= function(filter, that /*opt*/) {
        var other= [], v;
        for (var i=0, n= this.length; i<n; i++)
            if (i in this && filter.call(that, v= this[i], i, this))
                other.push(v);
        return other;
    };
}
if (!('every' in Array.prototype)) {
    Array.prototype.every= function(tester, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && !tester.call(that, this[i], i, this))
                return false;
        return true;
    };
}
if (!('some' in Array.prototype)) {
    Array.prototype.some= function(tester, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && tester.call(that, this[i], i, this))
                return true;
        return false;
    };
}

//Add keys to object
if (!Object.keys) {
  Object.keys = (function () {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;
 
    return function (obj) {
      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');
 
      var result = [];
 
      for (var prop in obj) {
        if (hasOwnProperty.call(obj, prop)) result.push(prop);
      }
 
      if (hasDontEnumBug) {
        for (var i=0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
        }
      }
      return result;
    }
  })()
};    
    
registerJSON("functions", function (o) {return typeof(o) == "function";}, function(o){return o+"";});

reviveJSON = function (o) {
	//alert("Investigating : " + o);
	var objtype = typeof(o);
	if (objtype == "string" && o.substring(0,8) == "function") {
        //Override Mochikit Base, parenthesis dont work for functions
		return eval("["+MochiKit.Base._filterJSON(o)+"][0]");
	}
	if (objtype == "string" || objtype == "number") {
		return o;
	}
	// recurse
	var me = arguments.callee;

	// array
	if (objtype != "function" && typeof(o.length) == "number") {
		var res = [];
		for (var i = 0; i < o.length; i++) {
			var val = me(o[i]);
			res.push(val);
		}
		return res;
	}
	// generic object code path
	res = {};
	for (var k in o) {
		val = me(o[k]);
		res[k] = val;
	}
	return res;
}

//Waits for multiple events before triggering
var waitForEvents = function(events){
    if(!isArrayLike(events)) events = [events];
	var ll = map(function(e){
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
(function (glob) {
    var events = {};
    eve.on("buffered.*", function(){
        var evt = eve.nt();
        var delay =  +evt.split(".")[1] / 1000;
        if(typeof(delay) != "number") {
            delay = .5;
        }
        var scope = this;
        var args = arguments;
        
        var name = evt.split(".").slice(2).join(".");
    
        try{
            events[name].cancel();
        }
        catch(e){
            noop();
        }
        
        var cob = function(){
            eve(name, scope, args);
            delete(events[evt]);
        };
        events[name] = callLater(delay, cob);
    });
})(this);


(function(glob) {
    var current_dimensions = {};
    
    var resize_handler = function(){
        var d = getViewportDimensions();
        if(serializeJSON(d) != serializeJSON(current_dimensions)){
            eve("buffered.200.window.resize", d);
            current_dimensions = d;
        }
    };
    window.onresize = resize_handler;
    window.onorientationchange = resize_handler;
})(this);

