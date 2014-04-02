{
  "module_type" : "core",
  "init": function() {

    //This is a sample main_interface, it is called when interface initializes
    //Applciations should roll their own
    
    currentDocument().title = "Sync rules";

    if (!window.LOG_INFO_REPLICATION) setStyle(currentDocument().body, {
      "backgroundColor": "#4B6073",
      "color": "#CBCFD4"
    });

    //Reload in case main_interface changes
    eve.once("database.change.interfacedb.main_interface", function() {
      window.location.reload();
    });

    //Instantiate mixins THEN all the rest
    //This allows us to declare some mixins
    //in the initial script, yet use them in
    //anything else is loaded )

    eve("interface.request.mixin", {
      "id": "mixin"
    });

    eve.on("database.change.interfacedb.mixin", function() {
      eve("interface.remove.mixin.mixin", {
        callback: function() {
          eve("interface.request.mixin", {
            "id": "mixin"
          });
        }
      });
    });
    
    //Set styles
    eve("interface.request.styles", {
      id: "styles"
    });


    eve("interface.request_handle.mixin.mixin", function(o){

      eve("interface.request.editor_button", {
        "id": "button_editor"
      });
      eve("interface.request_handle.fullscreen.fullscreen", function(o) {
        if (screenfull.enabled) {
          eve("interface.request.fullscreen_button", {
            "id": "fullscreen_button"
          });
        }
      });
      eve("interface.request.editor", {
        "id": "main_editor"
      });
  
      eve("interface.request.logger", {
        "id": "logger_0"
      });

      //Adding layers
      eve("interface.request.overlay", {
        id: "overlay0"
      });
  
      eve("interface.request.overlay_paper", {
        id: "overlay_paper0"
      });
  
      //Now trigger the rest with an instantiated paper
  
      eve("interface.request_handle.overlay_paper.overlay_paper0", function(o) {
        //Add main container to landscape
        eve("interface.request.container.main_container", {
          id: "main_container",
            "direction": "y+",
          width: 10,
          height: 10,
          gutter: 10,
          interval: 5
        });
        eve("interface.request.container", {
          id: "container0",
            "direction": "y+",
          width: 500,
          height: 500,
          order: 1,
          interval: 0
        });
  
        eve("interface.request_handle.container.main_container", function(o) {
          eve.on("window.resize", function() {
            eve("interface.request_handle.container.main_container", function(oo) {
              var d = getViewportDimensions();
              oo.setDimensions(d.w, d.h);
              oo.setPosition(0, 0);
              eve("interface.layout_request_root.container.main_container");
            });
          });
          eve("window.resize");
        });
  
        eve("interface.request.banner.banner", {
          id: "banner",
          params: {
            "fontSize": 40
          },
          optimal_height: 50,
          order: 0,
          minimum_height: 100,
          adamantium: true
        });
  
        eve("interface.request_add_children", null, "container.main_container", "banner.banner");
        eve("interface.request_add_children", null, "container.main_container", "container.container0");
  
        //Requesting interface handler
        eve("interface.request.interface_handler", {
          id: "interface_handler"
        });
      });
    });
  }
}
