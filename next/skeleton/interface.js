var rhost = (window.location + "").split("://")[0] + "://" + window.location.hostname + ":" + window.location.port + "/";

window.LOG_FAILED_REPLICATION = true;
window.PINPOINT = "ALL";

//Logging functions
var log = function(txt, severity) {
    eve("interface.log", {
        "text": txt,
        severity: severity
    });
}
//log = noop;


//Done defining logging
var init = function(){
    logDiv = DIV({"style":{"border":"solid red 0px", "height":"100%", "width":"100%"}});
    appendChildNodes(currentDocument().body, logDiv);

    if(!window.PINPOINT) removeElement(logDiv);

    setStyle(currentDocument().body, {
      "backgroundColor": "#161B24",
      "color": "#CBCFD4"
    });
    //Log all raphael events
    //except buffered or delayed
    /*eve.on("*", function(){
        if(eve.nt().substring( 0, 9) == "buffered.") return;
        if(eve.nt().substring( 0, 8) == "delayed.") return;
        if(eve.nt().substring( 0, 8) == "raphael.") return;

        log2("EVENT: " + eve.nt());
    });
*/

    log2("Analyzing fragment" );

    var fragment = (window.location+"").split("#");
    fragment.shift();
    log2("Fragment is: " + JSON.stringify(fragment));
    window.appname = rhost.split("://")[1].split(":")[0].replace(/\./g, "-");



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
    logDiv && removeElement(logDiv);
    //Declare databases
    databases.interfacedb = {
        "name"  : "core_interface",
        "local" : "core_interface-" + rhost,
        "remote": checkIfRewrite(rhost) + "core_interface-"+appname+"/",
        "filter_to": function(doc, req){
            if(doc && doc._id.substr(0,7) == "_design") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "filter_from": function(doc, req){
            if(doc && doc._id.substr(0,7) == "_design") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "sync": {
            "from"  : true,
            "to"    : false
        },
        polling: 20000
    };

    //Declare databases
    databases.userdb = {
        "name"  : "userdb",
        "local" : "user_generic-" + rhost,
        "remote": checkIfRewrite(rhost)  + "userdb_"+appname+"_"+appname+"_generic",
        "filter_to": function(doc, req){
            if(doc && doc._id.substr(0,7) == "_design") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "filter_from": function(doc, req){
            if(doc && doc._id.substr(0,7) == "_design") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "sync": {
            "from"  : true,
            "to"    : false
        },
        polling: 1500
    };


    //Launch init on all databases
    log2("Creating all databases");
    map(function(db) {
        console.log("Registering: " + "database.created."+db);
        eve.once("database.created."+db, function(){

            console.log("Created, launching sync: " + "database.request.sync."+db)

            eve("database.request.sync."+db);
            eve("database.request.changes."+db);
        });
        eve("database.init."+db);

    }, keys(databases));

    eve.once("database.sync.status.interfacedb", function(){
        //First sync status will be from ( success or fail, doesn't matter )
        eve("interface.request.main_interface", {"id":"main_interface"});
    });
}

//DEV interface
var init_dev = function(fragment){
    log2("Setting up DEV environment");

}

//SETUP interface
var init_setup = function(){
    log2("Launching SETUP.", -1);
    log2("Considering we're on a virgin database");

    eve.once("application.setup.switch_to_main", function(){
        //window.location.href = window.location.href.split("#")[0]+"#main";
        //window.location.reload();
    });

    if(!confirm("This operation will delete all local DBs. OK to proceed ?")) return;

    //Declare databases
    databases.repositorydb = {
        "name"  : "core_repository",
        "local" : "core_repository-" + rhost,
        "remote": checkIfRewrite(rhost)  + "core_repository-"+appname+"/",
        "filter_to": function(doc, req){
            if(doc && doc._id.substr(0,7) == "_design") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "filter_from": function(doc, req){
            if(doc && doc._id.substr(0,7) == "_design") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "sync": {
            "from"  : true,
            "to"    : true
        },
        polling: 1500
    };

    databases.interfacedb = {
        "name"  : "core_interface",
        "local" : "core_interface-" + rhost,
        "remote": checkIfRewrite(rhost)  + "core_interface-"+appname+"/",
        "filter_to": function(doc, req){
            if(doc && doc._id.substr(0,7) == "_design") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "filter_from": function(doc, req){
            if(doc && doc._id.substr(0,7) == "_design") return false;
            if(doc && doc._id.substr(0,7) == "_local/") return false;
            return true;
        },
        "sync": {
            "from"  : true,
            "to"    : false
        },
        polling: 1500
    };

    log2("Destroying local DBs", 1);
    PouchDB.destroy(PouchDB.utils.Crypto.MD5(databases.interfacedb.local));
    PouchDB.destroy(PouchDB.utils.Crypto.MD5(databases.repositorydb.local));


    //Launch init on all databases
    log2("Creating all databases");
    map(function(db) {
        console.log("Registering: " + "database.created."+db);
        eve.once("database.created."+db, function(){

            console.log("Created, launching sync: " + "database.request.sync."+db)

            eve("database.request.sync."+db);
            eve("database.request.changes."+db);
        });
        eve("database.init."+db);

    }, keys(databases));

    //Consider we need to be online for initial setup
    eve.once("database.initial.replication.to.repositorydb", function(){
        log2("Initial replication (to) complete", -1);

        //Pull security document from core_repository
        //Note: if we're here, we should have admin creds
        eve("application.setup.security");

    });

    eve.on("application.setup.security", function(){

        if(isUndefinedOrNull(databases.repositorydb.auth)){
            //log2("Warning: Not logged in", 1);
            eve("database.login.request", null, databases.repositorydb);
            eve("buffered.1500.application.setup.security");
            return;
        }
        if(isUndefinedOrNull(databases.repositorydb.remotedb)){
            //log2("Warning: No DB yet", 1);
            eve("buffered.1500.application.setup.security");
            return;
        }
        log2("Fetching design doc", -1);
        databases.repositorydb.remotedb.get("_design/utils", function(err, doc){
            if(!isUndefinedOrNull(err) && err.status != 404){
                log2("Error fetching design doc: " + err, 1);
                eve("buffered.1500.application.setup.security");
                return;
            }

            log2("Design doc fetched: " + JSON.stringify(doc), -1);

            var my_func = function(newDoc, oldDoc, userCtx) {
                if (newDoc._id && newDoc._id.indexOf("_local/") == 0) return;
                if (!userCtx || !userCtx.roles || userCtx.roles.indexOf("_admin") == -1) {
                    throw ({
                        forbidden: 'Only database admin can write here, seriously :).'
                    });
                }
            }

            var my_filter = function(doc, req){
                if(doc._deleted){
                    return true;
                }
                //If flagged as core
                if (doc.module_type == "core") {
                return true;
                }
                //If flagged as validated
                if (doc.validated) {
                return true;
                }
                //Otherwise, don't replicate
                return false;
            }

            var ddoc = {
                "_id"                   : "_design/utils",
                "validate_doc_update"   : "" + my_func,
                "filters"               : {
                    "core_and_validated_only": "" + my_filter
                }
            };

            if(doc && doc._rev ) ddoc._rev = doc._rev ;

            databases.repositorydb.remotedb.put(ddoc, function(err, doc){
                if(!isUndefinedOrNull(err)){
                    console.log("Error putting design object:");
                    console.log(err);

                    if(err.status == 401){
                        delete(databases.repositorydb.auth);
                        eve("database.login.request", null, databases.repositorydb);
                        eve("buffered.1500.application.setup.security");
                    }

                }
                else {
                    log2("_design object uploaded, validation function activated", -1);
                    eve("interface.catalog.fetch");
                }
            });
            eve("interface.create_core_database");


        });

    });

    eve.on("interface.catalog.fetch", function(){
        log2("Fetching catalog from local DB if available", -1);
        databases.repositorydb.database.get("catalog", function(err, doc){
            if(!isUndefinedOrNull(err) && err.status != 404){
                console.log("Error fetching catalog");
                console.log(err);
                eve("buffered.1500.interface.catalog.fetch");
                return;
            }

            //If we're here, either doc is null or there is a catalog
            if(isUndefinedOrNull(doc)){
                doc = {
                    "core"  : {
                        "type"  : "git", 
                        "url"   : "https://api.github.com/repos/trokster/xcayp/contents/next/modules"
                    },
                    "_id": "catalog"
                };
                console.log("Putting Doc");
                databases.repositorydb.database.put(doc);
            }

            log2("Parsing through catalog", -1);
            map(function(item){
                log2("Checking: '" + item + "'' :: TYPE : " + doc[item].type, -1);
                if(item == "_id" || item == "_rev") return;
                if(doc[item].type == "git"){
                    //Fetch git data and parse all modules
                    var l = loadJSONDoc(doc[item].url);
                    l.addCallback(function(gitDoc){
                        map(function(module){
                            module = gitDoc[module];
                            log2("Handling: " + module.name, -1);

                            var ext = module.name.split(".");
                            ext = ext[ext.length-1];
                            if(ext != "js"){
                                log2("Not sure how to handle: " + module.name + ", discarding.", 1);
                                return;
                            }
                            var name = module.name.split(".")[0];
                            //Try to fetch in local DB to see if it exists
                            databases.repositorydb.database.get(name, function(err, doc){
                                if(!isUndefinedOrNull(err) && err.status != 404){
                                    console.log("Error checking if local has: " + name);
                                    eve("buffered.20000.interface.catalog.fetch");
                                }

                                if(isUndefinedOrNull(doc)){
                                    // Fetch it from github, then save it locally
                                    //( will replicate )
                                    log2("Fetching from github: " + name, -1);
                                    var ll = loadJSONDoc(module.url);
                                    ll.addCallback(function(gitModule){
                                        console.log("Fetched from github: ");
                                        console.log(gitModule);

                                        
                                        
                                        var newDoc = PouchDB.utils.extend(null, {}, {
                                            "content"   : gitModule.content,
                                            "_id"       : name,
                                            "sha"       : gitModule.sha
                                            });

                                        //Read content to add extra info
                                        try{
                                            var o = evalJSON(atob(gitModule.content.replace(/[\n\r]/g, '')));
                                        } catch(e){
                                            log2("Error reading git Source for: " + name);
                                            throw(e);
                                        }


                                        if(o.module_type) newDoc.module_type = ""+o.module_type;
                                        o = null;


                                        databases.repositorydb.database.put(newDoc, function(err, doc){
                                            if(!isUndefinedOrNull(err)){
                                                console.log("Error inserting a record in repositorydb");
                                                console.log(err);
                                                return;
                                            }
                                            else {
                                                log2("Entry: " + name + " :: created in DB.", -1)
                                            }
                                        });

                                    });
                                    ll.addErrback(function(err){
                                        console.log("Error fetching from github");
                                        console.log(err);
                                    });
                                }
                                else {
                                    // Keep local version, tag as checked
                                    // Admin will have to manually update via
                                    // Module interface
                                    log2("Module: " + name + " :: exists locally, skipping", -1);
                                    return;
                                }

                            });

                        }, keys(gitDoc));
                    });
                    l.addErrback(function(err){
                        log2("Couldn't fetch git Data: " + doc[item].url + " :: try again in 20 secs.", 1);

                        console.log(err);
                        eve("buffered.20000.interface.catalog.fetch");
                        return;
                    });
                }
                else {
                    log2("Don't know how to handle type: " + doc[item].type, 1);
                    return;
                }

            }, keys(doc));


        });
    });

    eve.on("interface.create_core_database", function(){
        PouchDB(checkIfRewrite(rhost) + "core_interface-"+appname+"/", {"auth":databases.repositorydb.auth, auto_compaction:true}, function(err, database){
            if(!isUndefinedOrNull(err)){
                console.log("Error creating Core DB, retrying in 5 seconds");
                console.log(err);
                eve("buffered.5000.interface.create_core_database");
                return;
            }
            log2("Core database created", -1);
            //Set up security
            database.get("_design/utils", function(err, doc){
                if(!isUndefinedOrNull(err) && err.status != 404){
                    log2("Error fetching design doc: " + err, 1);
                    eve("buffered.1500.interface.create_core_database");
                    return;
                }

                log2("Core DB :: Design doc fetched: " + JSON.stringify(doc), -1);

                var my_func = function(newDoc, oldDoc, userCtx) {
                    if (newDoc._id && newDoc._id.indexOf("_local/") == 0) return;
                    if (!userCtx || !userCtx.roles || userCtx.roles.indexOf("_admin") == -1) {
                        throw ({
                            forbidden: 'Only database admin can write here, seriously :).'
                        });
                    }
                };


                var ddoc = {
                    "_id"                   : "_design/utils",
                    "validate_doc_update"   : "" + my_func
                };

                if(doc && doc._rev ) ddoc._rev = doc._rev ;

                log2("CORE DB :: posting design doc.", -1);
                database.put(ddoc, function(err, doc){
                    if(!isUndefinedOrNull(err)){
                        console.log("Error putting design object:");
                        console.log(err);

                        if(err.status == 401){
                            delete(databases.repositorydb.auth);
                            eve("database.login.request", null, databases.repositorydb);
                            eve("buffered.1500.application.setup.security");
                        }

                    }
                    else {
                        log2("CORE DB :: _design object uploaded, validation function activated", -1);

                        //Now set up replicator
                        PouchDB(rhost+"_replicator", {auth:databases.repositorydb.auth, auto_compaction:true}, function(err, database){
                            if(!isUndefinedOrNull(err)){
                                console.log("CORE DB :: Error setting up replicator, retrying whole process in 5 seconds");
                                console.log(err);
                                eve("buffered.5000.interface.create_core_database");
                                return;
                            }
                            log2("CORE DB :: Fetching replicator entry");
                            database.get("repository_to_core-"+appname, function(err_rep1, doc_rep1){
                            
                                var replicate = {
                                    "_id"       : "repository_to_core-"+appname,
                                    "source"    : "core_repository-"+appname,
                                    "target"    : "core_interface-"+appname,
                                    "filter"    : "utils/core_and_validated_only",
                                    "continuous": true,
                                    "user_ctx"  : {
                                    "name"      : databases.repositorydb.auth.username,
                                    "roles"     : ["_admin"],
                                    "requester" : databases.repositorydb.auth.username
                                    }
                                };

                                log2("CORE DB :: Setting up replicator entry");
                                if (isUndefinedOrNull(err_rep1)) {
                                  //console.log(doc.name + " :: Replicator exists, deleting(1)");
                                  database.remove(doc_rep1, function(err, response) {
                                    //console.log(doc.name + " :: Replicator removed, putting(1)");
                                    //replicate._rev = doc2._rev;
                                    database.put(replicate);
                                  });
                                } else {
                                  //console.log(doc.name + " :: Replicator doesn't exist, creating(1)");
                                  database.put(replicate);
                                }

                                eve("interface.request.logger", {"id":"logger"}, function(){
                                    log("OK, setup complete\nSwitching to MAIN", -1);
                                    eve("buffered.1500.application.setup.switch_to_main");
                                });
                            });

                        });
                    }
                });

            });
        });
    });

}


eve.on("raphael.DOMload", init)(-100);
