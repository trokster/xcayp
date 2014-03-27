var rhost = (window.location + "").split("://")[0] + "://" + window.location.hostname + ":" + window.location.port + "/";

window.LOG_FAILED_REPLICATION = true;
window.INTERFACE_OBJECT_REFERENCE = {};
window.PINPOINT = "ALL";

//Logging functions
var log = function(txt, severity) {
        eve("interface.log", {
            "text": txt,
            severity: severity
        });
    } //log = noop;
var logDiv = null;

//Done defining logging
var init = function(){

    //Log all raphael events
    //except buffered or delayed
    eve.on("*", function(){
        if(eve.nt().substring( 0, 9) == "buffered.") return;
        if(eve.nt().substring( 0, 8) == "delayed.") return;
        if(eve.nt().substring( 0, 8) == "raphael.") return;

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
        /*
        else if(env == "stage"){
            return init_stage(fragment);
        }
        */
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
        "remote": checkIfRewrite(rhost) + "test_db/",
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
            "from"  : true,
            "to"    : true
        },
        polling: 5000
    };
    //Launch init on all databases
    log2("Creating all databases");
    map(function(db) {
        console.log("Registering: " + "database.created."+db);
        eve.once("database.created."+db, function(){

            console.log("Created, launching sync: " + "database.request.sync."+db)

            eve("database.request.sync."+db);
        });
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

    eve("application.login.validate");

    //Launch init on all databases
    log2("Creating all databases");
    map(function(db) {
        eve("database.init."+db);
        eve.once("database.created."+db, function(){
            eve("database.request.sync")
        });
    }, keys(databases));
}

//SETUP interface
var init_setup = function(){
    log2("Considering we're on a virgin database");
    //Validate credentials
    //opens login if no credentials are found on machine
    //or if credentials do not have admin rights on DB server
    eve("application.login.validate");

    var checkSetup = function(){
        var creds = localJSON.get(rhost+"-credentials");

        if(creds.response && MochiKit.Base.findValue(creds.response.roles, "admin") != -1){
            eve("application.fetch.catalog");
        }
        else {
            eve("application.login.request", null, {"status": "User: " + window.credentials.user + " does not have admin priviledges.\nLogged out."});
            eve("application.login.destroy");
            eve.once("application.login.success", checkSetup);
        }
    };

    eve.once("application.login.success", checkSetup);

}

eve.on("raphael.DOMload", init)(-100);
