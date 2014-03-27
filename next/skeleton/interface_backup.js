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

    eve("application.login.validate");

    //Launch init on all databases
    log2("Creating all databases");
    map(function(db) {
        eve("database.init."+db);
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

//Reads a JSON from GIT and revives its content
var readGitJSON = function(doc){
    if(isUndefinedOrNull(doc.content)){
        return null;
    }
    else return evalJSON(atob(doc.content.replace(/[\n\r]/g, '')));
}


var fetchCatalog = function(){
    log2("Login success, checking catalog.", 1);

    var git = "https://api.github.com/repos/trokster/xcayp/contents/next/modules/catalog.json";

    var l = loadJSONDoc(git);
    l.addCallback(function(doc){
        var content = readGitJSON(doc);

        if(!isUndefinedOrNull(content)){
            log2("Catalog object fetched: " + JSON.stringify(content, null, 2), -1);
            window.rCatalog = content;
            //Declare database interface

            //NOTE: Here we added a path /userdb/ to handle rewrites 
            //( cases where we want to display a simpler path to the html file for example)

            //Try the standard setup first, THEN try with /userdb/ appended to the user database


            databases.interfacedb = {
                "name"  : "core_interface",
                "local" : "core_interface-" + rhost,
                "remote": rhost.split("://")[0] + "://" 
                    + window.credentials.user + ":" 
                    + window.credentials.password + "@" + rhost.split("://")[1] + "core_interface_" + rhost.split("://")[1].split("/")[0].replace(/\./g, "-").replace(/\:/g, ""),
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
                polling: 1500
            };

            //Connect to remote db interface
            var db = PouchDB(databases.interfacedb.remote, function(err, db){
                if(isUndefinedOrNull(err)){
                    //DB exists, handle catalog parse and check
                    log2("Connected to application's core_interface");
                    eve("application.setup.ready", null, db, window.rCatalog);
                }
                else if(err && err.status == 409){
                    //We're in the configuration where the databse may be rewritten so try link -> userdb
                    log2("Couldn't create DB, trying different userdb configuration");
                    databases.interfacedb.remote = rhost.split("://")[0] + "://" 
                    + window.credentials.user + ":"
                    + window.credentials.password + "@" + rhost.split("://")[1] + "userdb/core_interface_" + rhost.split("://")[1].split("/")[0].replace(/\./g, "-").replace(/\:/g, "");
                    var db = PouchDB(databases.interfacedb.remote, function(err, db){
                        if(isUndefinedOrNull(err)){
                            //DB exists, handle catalog parse and check
                            log2("Connected to application's core_interface");
                            eve("application.setup.ready", null, db, window.rCatalog);
                        }
                        else {
                            //DB creation/open failed, re-fetch until possible
                            eve("buffered.5000.application.fetch.catalog");
                        }
                    });
                }
                else{
                    //DB creation/open failed, re-fetch until possible
                    log2( "Error connecting to DB: " + JSON.stringify(err) );
                    eve("buffered.5000.application.fetch.catalog");
                }
            });
        }
        else {
            console.log("Failed to read catalog");
        }

    });
    l.addErrback(function(err){
        log2("Catalog could not be fetched: " + JSON.stringify(err));
        log2("Cycling until we can");
        eve("buffered.1500.application.fetch.catalog");
    });
}

eve.on("application.fetch.catalog", fetchCatalog);


eve.on("raphael.DOMload", init)(-100);
