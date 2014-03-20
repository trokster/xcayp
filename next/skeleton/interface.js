var rhost = (window.location + "").split("://")[0] + "://" + window.location.hostname + ":" + window.location.port + "/";
window.LOG_INFO_REPLICATION = false;
window.AJAX_CONCURRENT_REQUEST_LIMIT = 200;
window.INITIAL_LOG_LENGTH = 5;
window.PINPOINT = "ALL";
window.LOG_FAILED_REPLICATION = true;

window.INTERFACE_OBJECT_REFERENCE = {};


//Logging functions
var log = function(txt, severity) {
        eve("interface.log", {
            "text": txt,
            severity: severity
        });
    } //log = noop;
var logDiv = null;
var log2 = function(txt, severity) {
        if(window.PINPOINT !== "ALL" && txt.indexOf(window.PINPOINT) == -1) return;
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
    }

//Done defining logging
var init = function(){

    //Log all raphael events
    //except buffered or delayed
    eve.on("*", function(){
        if(eve.nt().substring( 0, 9) == "buffered.") return;
        if(eve.nt().substring( 0, 8) == "delayed.") return;

        log2("EVENT: " + eve.nt());
    });

    log2("Analyzing fragment" );

    var fragment = (window.location+"").split("#");
    fragment.shift();
    log2("Fragment is: " + JSON.stringify(fragment));


    //These are the possible arguments
    //- dev   -> init_dev: launches dev interface to manage / review / code
    //  interface elements.
    //  extra params will trigger dev specific behavior ( single component testing etc.)
    //
    //- main  -> init_main: launches main application using core
    //  interface elements ( ones from the production database)
    //    
    //- stage -> init_stage: launches main application using stage interface elements
    //  ( pre-production ) 
    //
    // No params triggers init_main
    //
    //- setup -> setup process: To be run on a virgin database to make sure
    //  all the databases for app development / deployment are set up


    if(fragment.length > 0){
        var env = fragment[0].toLowerCase();
        if(env == "dev"){
            return init_dev(fragment);
        }
        else if(env == "main"){
            return init_main(fragment);
        }
        else if(env == "stage"){
            return init_stage(fragment);
        }
        else if(env == "setup"){
            return init_setup(fragment);
        }
    }

    //Otherwise, we launch main
    if (fragment.length) {
        log2("Fragment was not recognized or empty");
    }
    log2("Triggering main");
    init_main(null);
}

//MAIN interface
var init_main = function(fragment){
    log2("Setting up MAIN environment");

    //Declare databases
    databases.interfacedb = {
        "name"  : "core_interface",
        "local" : "core_interface-" + rhost,
        "remote": rhost + "core_interface/",
        "filter_to": function(doc, req){
            if(doc && doc._id == "_design/interface") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "filter_from": function(doc, req){
            if(doc && doc._id == "_design/interface") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "sync": {
            "from": true,
            "to": false
        },
        polling: 1500
    };

    //Launch init on all databases
    log2("Creating all databases");
    map(function(db) {
        eve("database.init."+db);
    }, keys(databases));


}

//DEV interface
var init_dev = function(fragment){
    log2("Setting up DEV environment");

    //Here we need the core interface for the GUI
    //Declare databases
    databases.interfacedb = {
        "name"  : "core_interface",
        "local" : "core_interface-" + rhost,
        "remote": rhost + "core_interface/",
        "filter_to": function(doc, req){
            if(doc && doc._id == "_design/interface") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "filter_from": function(doc, req){
            if(doc && doc._id == "_design/interface") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "sync": {
            "from": true,
            "to": false
        },
        polling: 1500
    };

    //We also need the dev and stage interface databases

    databases.stage_interfacedb = {
        "name"  : "stage_interface",
        "local" : "stage_interface-" + rhost,
        "remote": rhost + "stage_interface/",
        "filter_to": function(doc, req){
            if(doc && doc._id == "_design/interface") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "filter_from": function(doc, req){
            if(doc && doc._id == "_design/interface") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "sync": {
            "from": true,
            "to": false
        },
        polling: 1500
    };

    //Putting this in comments for now, as we may have one per user
    /*
    //Declare databases
    databases.dev_interfacedb = {
        "name"  : "dev_interface",
        "local" : "dev_interface-" + rhost,
        "remote": rhost + "dev_interface/",
        "filter_to": function(doc, req){
            if(doc && doc._id == "_design/interface") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "filter_from": function(doc, req){
            if(doc && doc._id == "_design/interface") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "sync": {
            "from": true,
            "to": true
        },
        polling: 1500
    };
    */

    //Launch init on all databases
    log2("Creating all databases");
    map(function(db) {
        eve("database.init."+db);
    }, keys(databases));


}

//STAGE interface
var init_stage = function(fragment){
    log2("Setting up STAGE environment");

    //Declare databases ( Here we work with stage database )
    databases.interfacedb = {
        "name"  : "stage_interface",
        "local" : "stage_interface-" + rhost,
        "remote": rhost + "stage_interface/",
        "filter_to": function(doc, req){
            if(doc && doc._id == "_design/interface") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "filter_from": function(doc, req){
            if(doc && doc._id == "_design/interface") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "sync": {
            "from": true,
            "to": false
        },
        polling: 1500
    };

    //Launch init on all databases
    log2("Creating all databases");
    map(function(db) {
        eve("database.init."+db);
    }, keys(databases));

}

eve.on("raphael.DOMload", init)(-100);
