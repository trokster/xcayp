{
  "module_type": "core",
    "init": function() {

    //This is a sample main_interface, it is called when interface initializes
    //Applciations should roll their own

    currentDocument().title = "Sync rules";

    if (!window.LOG_INFO_REPLICATION) setStyle(currentDocument().body, {
      "backgroundColor": "#4B6073",
        "color": "#CBCFD4"
    });

    //Instantiate mixins THEN all the rest
    //This allows us to declare some mixins
    //in the initial script, yet use them in
    //anything else that is loaded )

    eve("interface.request.mixin", {
      "id": "mixin"
    });

    //Triple tap to call editor
    eve.on("interface.touch_events.tap", function(evt) {
      if (this.taps == 4) {
        eve("interface.editor.main_editor.open", {
          database: "interfacedb",
            "document": "editor"
        });
      }
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


    eve("interface.request_handle.mixin.mixin", function(o) {

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
          minimum_width: 50,
          height: 500,
          order: 1,
          interval: 0
        });
        eve("interface.request.container", {
          id: "container1",
            "direction": "x+",
          width: 100,
          height: 50,
          minimum_width: 50,
          order: 0,
          interval: 5
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

        eve("interface.request.button", {
          id: "login",
          params: {
            "label": "Login"
          },
          handleTap: function(taps) {
            if (taps.taps > 1) return;
            eve("database.login.request", null, databases.userdb, {
              "remote": "Xcayp",
                "message": "Please login\nor create a new user."
            });
          }
        });
        eve("interface.request.button", {
          id: "admin",
          params: {
            "label": "User validation"
          },
          handleTap: function(taps) {
            if (taps.taps > 1) return;
            eve("application.user_auto_validation");
          }
        });
        eve("interface.request.button", {
          id: "cloudsave",
          params: {
            "label": "Save Changes"
          },
          handleTap: function(taps) {
            if (taps.taps > 1) return;
            log("Sync to core-interface enabled.", 1);
            databases.interfacedb.sync.to = true;
          }

        });

        eve("interface.request_add_children", null, "container.main_container", "banner.banner");
        eve("interface.request_add_children", null, "container.main_container", "container.container0");
        eve("interface.request_add_children", null, "container.main_container", "container.container1");
        eve("interface.request_add_children", null, "container.container1", "button.login");
        eve("interface.request_add_children", null, "container.container1", "button.admin");
        eve("interface.request_add_children", null, "container.container1", "button.cloudsave");

        //Reload in case main_interface changes
        eve.once("database.change.interfacedb.main_interface", function() {
          window.location.reload();
        });

      });
    });

  }
}
