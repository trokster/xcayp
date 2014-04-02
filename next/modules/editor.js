{
    "module_type" : "core",
    "base_class": "interface.editor",
    "init": function() {
    //Set Component Relative Dimensions
    this.width_min = 380;
    this.width_pct = 80 / 100;
    this.height_pct = 75 / 100;
    this.header_pct = 8 / 100;
    this.footer_pct = 3 / 100;
    this.fillOpacity = .99;
    //Define self for future reference
    var self = this;
    //Create DIV container
    var container = this.container = DIV({
      "style": {
        "position": "absolute",
          "border": "solid red 0px",
          "zIndex": 100000
      }
    });
    //Create target Textarea for Codemirror
    var ta = TEXTAREA({});
    //Add a small header
    var header = this.header = DIV({
      "style": {
        "border": "solid purple 0px"
      }
    }, "");
    //Add a footer to editor
    var footer = this.footer = DIV({
      "style": {
        "border": "solid yellow 0px"
      }
    }, "");
    //Create the background DIV
    var bgdiv = this.bgdiv = DIV({
      "style": {
        "position": "absolute"
      }
    });
    //Add dropdown for Databases
    var dropdown_db = this.dropdown_db = SELECT({
      "style": {
        "position": "absolute"
      }
    }, OPTION());
    //Create an entry for each DB
    map(function(db) {
      appendChildNodes(dropdown_db, OPTION(null, db));
    }, keys(databases));
    var dropdown_doc = this.dropdown_doc = SELECT({
      "style": {
        "position": "absolute"
      }
    }, OPTION());
    //Appending everything to document
    appendChildNodes(currentDocument().body, container);
    appendChildNodes(container, bgdiv, header, ta, footer, this.dropdown_db, this.dropdown_doc);
    //Set initial position of the container offscreen
    setElementPosition(this.container, {
      x: -10000,
      y: -10000
    });
    //Set all components' relative position
    setElementPosition(bgdiv, {
      x: 0,
      y: 0
    });
    setElementPosition(this.dropdown_db, {
      x: 140,
      y: 7
    });
    setElementPosition(this.dropdown_doc, {
      x: 250,
      y: 7
    });
    setElementDimensions(this.dropdown_db, {
      w: 100,
      h: 20
    });
    setElementDimensions(this.dropdown_doc, {
      w: 100,
      h: 20
    });
    //Instiantiate codemirror
    var editor = this.editor = CodeMirror.fromTextArea(ta, {
      "lineNumbers": true,
        "matchBrackets": true,
        "theme": "cobalt",
        "mode": "javascript",
        "fixedGutter": true,
        "indentUnit": 2,
        "tabSize": 2,
        "extraKeys": {
        "Ctrl-Space": "autocomplete",
          "Ctrl-S": "cloudsave",
          "Ctrl-O": "cloudget",
          "Ctrl-=": "reformat"
      }
    });
    // Save text in DB as serialised JSON
    // Inputs: NONE
    // Output: NONE
    CodeMirror.commands.cloudsave = function() {
        
      self.edited_document.content = editor.getValue();
      //Quick check to see if json is correct
      try {
          evalJSON(self.edited_document.content);
      }
      catch(e) {
          log("Save failed ( evalJSON )");
          console.log(e);
          console.log(self.edited_document.content);
          return;
      }
      self.edited_document = btoa(self.edited_document);
      //log("Trying to save object");
      var f = function(err, response) {
        if (!isUndefinedOrNull(err)) {
          log("Error in calling put: " + serializeJSON(err));
          return;
        } else {
          if (response.ok == true) {
            eve("buffered.100.interface.editor." + self.name + ".open", {
              "database": self.database,
                "document": self.document
            });
          } else {
            log("DB was not OK with update: " + serializeJSON(response));
            return;
          }
        }
      }
      databases[self.database].database.put(self.edited_document, f);
    };
    // Get text from DB
    // Inputs: NONE
    // Output: NONE
    CodeMirror.commands.cloudget = function() {
      eve("interface.editor." + self.name + ".open", {
        database: self.database,
        document: self.document
      });
    };
    // Format code with Java Script Beautify
    // Inputs: NONE
    // Output: NONE
    CodeMirror.commands.reformat = function() {
      var coords = editor.getScrollInfo();
      editor.setValue(js_beautify(editor.getValue(), {
        indent_size: 2,
        preserve_newlines: true
      }));
      editor.scrollTo(coords.x, coords.y);
    };
    //Map autocomplete command
    CodeMirror.commands.autocomplete = function(cm) {
      CodeMirror.simpleHint(cm, CodeMirror.javascriptHint);
    };
    //Map close command
    CodeMirror.commands.close = function() {
      editor.setValue("");
      map(function(db) {
        eve("interface.remove.db_widget.dw_" + db);
      }, keys(databases));
      //eve("interface.remove.logger.logger_0");
      eve("interface.editor.closing");
      window.dev_active = false;
      hideElement(container);
    };
    //Creating raphael paper for background
    var paper = this.paper = Raphael(bgdiv);
    //Create base background in svg
    var bgrect = this.bgrect = paper.rect(0, 0, 100, 100, 10);
    //Set background properties
    bgrect.attr({
      fill: "#1A1B21",
        "stroke": "none",
        "fill-opacity": this.fillOpacity,
        "stroke-opacity": 1,
        "stroke-width": 1
    });
    //Create cloudget button
    var download = this.download = paper.path("M24.345,13.904c0.019-0.195,0.03-0.392,0.03-0.591c0-3.452-2.798-6.25-6.25-6.25c-2.679,0-4.958,1.689-5.847,4.059c-0.589-0.646-1.429-1.059-2.372-1.059c-1.778,0-3.219,1.441-3.219,3.219c0,0.21,0.023,0.415,0.062,0.613c-2.372,0.391-4.187,2.436-4.187,4.918c0,2.762,2.239,5,5,5h3.404l-0.707-0.707c-0.377-0.377-0.585-0.879-0.585-1.413c0-0.533,0.208-1.035,0.585-1.412l0.556-0.557c0.4-0.399,0.937-0.628,1.471-0.628c0.027,0,0.054,0,0.08,0.002v-0.472c0-1.104,0.898-2.002,2-2.002h3.266c1.103,0,2,0.898,2,2.002v0.472c0.027-0.002,0.054-0.002,0.081-0.002c0.533,0,1.07,0.229,1.47,0.63l0.557,0.552c0.78,0.781,0.78,2.05,0,2.828l-0.706,0.707h2.403c2.762,0,5-2.238,5-5C28.438,16.362,26.672,14.332,24.345,13.904z M21.033,20.986l-0.556-0.555c-0.39-0.389-0.964-0.45-1.276-0.137c-0.312,0.312-0.568,0.118-0.568-0.432v-1.238c0-0.55-0.451-1-1-1h-3.265c-0.55,0-1,0.45-1,1v1.238c0,0.55-0.256,0.744-0.569,0.432c-0.312-0.313-0.887-0.252-1.276,0.137l-0.556,0.555c-0.39,0.389-0.39,1.024-0.001,1.413l4.328,4.331c0.194,0.194,0.451,0.291,0.707,0.291s0.512-0.097,0.707-0.291l4.327-4.331C21.424,22.011,21.423,21.375,21.033,20.986z");
    download.transform("s.9,.9t20,0");
    //Attach click event
    download.click(CodeMirror.commands.cloudget);
    //Create cloudsave button
    var upload = this.upload = paper.path("M24.345,13.904c0.019-0.195,0.03-0.392,0.03-0.591c0-3.452-2.798-6.25-6.25-6.25c-2.679,0-4.958,1.689-5.847,4.059c-0.589-0.646-1.429-1.059-2.372-1.059c-1.778,0-3.219,1.441-3.219,3.219c0,0.21,0.023,0.415,0.062,0.613c-2.372,0.391-4.187,2.436-4.187,4.918c0,2.762,2.239,5,5,5h2.312c-0.126-0.266-0.2-0.556-0.2-0.859c0-0.535,0.208-1.04,0.587-1.415l4.325-4.329c0.375-0.377,0.877-0.585,1.413-0.585c0.54,0,1.042,0.21,1.417,0.587l4.323,4.329c0.377,0.373,0.585,0.878,0.585,1.413c0,0.304-0.073,0.594-0.2,0.859h1.312c2.762,0,5-2.238,5-5C28.438,16.362,26.672,14.332,24.345,13.904z M16.706,17.916c-0.193-0.195-0.45-0.291-0.706-0.291s-0.512,0.096-0.707,0.291l-4.327,4.33c-0.39,0.389-0.389,1.025,0.001,1.414l0.556,0.555c0.39,0.389,0.964,0.449,1.276,0.137s0.568-0.119,0.568,0.432v1.238c0,0.549,0.451,1,1,1h3.265c0.551,0,1-0.451,1-1v-1.238c0-0.551,0.256-0.744,0.569-0.432c0.312,0.312,0.887,0.252,1.276-0.137l0.556-0.555c0.39-0.389,0.39-1.025,0.001-1.414L16.706,17.916z");
    upload.transform("s.9,.9t60,0");
    //Attach click event
    upload.click(CodeMirror.commands.cloudsave);
    //Create close button ( cross top right )
    var close = this.close = paper.path("M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z");
    close.click(CodeMirror.commands.close);
    //Create reformat button
    var reformat = this.reformat = paper.path("M2.021,9.748L2.021,9.748V9.746V9.748zM2.022,9.746l5.771,5.773l-5.772,5.771l2.122,2.123l7.894-7.895L4.143,7.623L2.022,9.746zM12.248,23.269h14.419V20.27H12.248V23.269zM16.583,17.019h10.084V14.02H16.583V17.019zM12.248,7.769v3.001h14.419V7.769H12.248z");
    reformat.transform("s.9,.9t103,2");
    //Attach click event
    reformat.click(CodeMirror.commands.reformat);
    //Resize function ( actually potitions as well )
    this.resize = bind(function() {
      var d = getViewportDimensions();
      var width = Math.round(d.w * this.width_pct);
      if (width < this.width_min) width = this.width_min;
      setElementDimensions(this.header, {
        w: width,
        h: d.h * this.height_pct * this.header_pct
      });
      setElementDimensions(this.footer, {
        w: width,
        h: d.h * this.height_pct * this.footer_pct
      });
      this.editor.setSize(width, Math.round(d.h * this.height_pct * (1 - this.header_pct - this.footer_pct)));
      this.is_visible && setElementPosition(this.container, {
        x: d.w > width ? (d.w - width) / 2 : 0, //d.w * (1 - this.width_pct) / 2,
        y: 80 //d.h * (1 - this.height_pct) / 4.5
      });
      this.bgrect.attr({
        "width": width,
          "height": Math.round(d.h * this.height_pct)
      });
      this.paper.setSize(width, d.h * this.height_pct);
      this.close.transform("s.9,.9T" + (width - 33) + ", 0");
    }, this);
    //Attach resize method to window resize
    eve.on("window.resize", this.resize);
    this.is_visible = true;
    //Resize once then hide
    this.resize();
    hideElement(this.container);
    this.is_visible = false;
    //Connect dropdowns to change events
    connect(dropdown_db, "onchange", function(e) {e
      e.stop();
      var choice = e.src().options[e.src().selectedIndex].innerHTML;
      self.database = choice;
      self.document = null;
      dropdown_doc.fetch();
    });
    connect(dropdown_doc, "onchange", function(e) {
      e.stop();
      var choice = e.src().options[e.src().selectedIndex].innerHTML;
      self.document = choice;
      eve("interface.editor." + self.name + ".open", {
        database: self.database,
        document: self.document
      });
    });
    //Fetches all docs for ddown
    dropdown_doc.fetch = function() {
      //log("Fetching docs for ddown");
      replaceChildNodes(dropdown_doc, OPTION());
      if (!isUndefinedOrNull(self.database)) {
        databases[self.database].database.allDocs(function(err, docs) {
          replaceChildNodes(dropdown_doc, OPTION());
          if (isUndefinedOrNull(err)) {
            map(function(doc) {
              if (doc.id.indexOf("_local") == 0) return;
              var oo = OPTION(null, doc.id);
              if (self.document == doc.id) oo.selected = true;
              appendChildNodes(dropdown_doc, oo);
            }, docs.rows);
          }
        });
      }
    };
    map(function(item) {
      item.attr({
        "fill": "#CBD1D6",
          "stroke": "white",
          "stroke-width": 5,
          "stroke-opacity": 0,
          "cursor": "pointer"
      });
      //Register a hover for each button
      item.hover(function() {
        this.animate({
          "fill": "white",
            "stroke": "white",
            "stroke-width": 5,
            "stroke-opacity": .4
        }, 500);
      }, function() {
        this.animate({
          "fill": "#CBD1D6",
            "stroke": "white",
            "stroke-width": 5,
            "stroke-opacity": 0
        }, 500);
      })
    }, [upload, download, reformat, close]);
    //If editor class changes, trigger removal and re-instantiation once
    //Do pre-clean up here
    eve.once("database.change.interfacedb.editor", function() {
      var name = self.name;
      var p = {
        database: self.database,
        document: self.document
      };
      var cb = function() {
        //log("Launching cb :: " + p);
        eve.once("interface.response.editor." + name, function() {
          //log("Caught respawn");
          eve("interface.editor.main_editor.open", p)
        });
        eve("interface.request.editor", {
          id: name
        });
      };
      disconnectAll(dropdown_db);
      disconnectAll(dropdown_doc);
      removeElement(dropdown_db);
      removeElement(dropdown_doc);
      paper.remove();
      removeElement(self.header);
      removeElement(self.footer);
      //removeElement(self.editor);
      removeElement(self.container)
      eve("interface.remove.editor." + name, {
        "callback": cb
      })
    });
    //Attach open event
    eve.on("interface.editor." + this.name + ".open", function() {
      //log("Received open request");
      var param = this;

      //Create an entry for each DB
      replaceChildNodes(self.dropdown_db, OPTION());
      map(function(db) {
        appendChildNodes(self.dropdown_db, OPTION(null, db));
      }, keys(databases));

      if (isUndefinedOrNull(param.database)) {
        log("Database undefined");
      }
      if (isUndefinedOrNull(databases[param.database])) {
        log("Database not found: " + param.database);
      }
      if (isUndefinedOrNull(param.document)) {
        log("Document undefined");
      }
      var f = function(err, doc) {
        if (!isUndefinedOrNull(err)) {
          self.is_visible = true;
          showElement(self.container);
          self.editor.setValue(serializeJSON(err));
          self.resize();
          self.database = null;
          self.document = null;
        } else {
          self.is_visible = true;
          showElement(self.container);
          var o = atob(doc.content.replace(/[\n\r]/g, ''));
          self.editor.setValue(js_beautify(o));

          //Set edited document property
          self.edited_document = PouchDB.utils.extend(null, {},doc);

          self.resize();
          self.database = param.database;
          self.document = param.document;
          var options = map(function(opt) {
            return opt.innerHTML;
          }, self.dropdown_db.options);
          self.dropdown_db.selectedIndex = options.indexOf(self.database);
          replaceChildNodes(self.dropdown_doc, OPTION(), OPTION(null, self.document));
          self.dropdown_doc.selectedIndex = 1;
          self.dropdown_doc.fetch();
        }
        //Reformat content
        CodeMirror.commands.reformat();
      };
      try {
        databases[param.database].database.get(param.document, f);
      } catch (e) {
        noop()
      }
    });
    //try {
    //new Draggable(self.container);
    //} catch (e) {
    //  log("Draggable failed");
    //}
  },
    "descritpion": "This component is an editor able to edit couchdb JSON objects and methods"
}
