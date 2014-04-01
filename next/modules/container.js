{
  "module_type":"core",
  "base_class": "interface.container",
    "respawn_delay": 0,
    "gutter": 0,
    "description": "Base container, controls the layout of child containers",
    "interval": 0,
    "border": 0,
    "mixins": ["isContainer", "canRespawn", "handlesTap", "handlesTranslation"],
    "init": function() {
    var self = this;
    //self.div.style.border = "solid red 1px";
  }
}
