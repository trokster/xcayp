//Define base server string
var rhost = (window.location+"").split("://")[0]+ "://" + window.location.hostname + ":" + window.location.port + "/";
window.LOG_INFO_REPLICATION = false;

var databases = {};

//Define interface database ( This will be read only for non admin )
databases.interfacedb = {
    "name": "interface",
    "local": "interface",
    "remote": rhost + "interface/",
    //Note :: this is the fallback that gets created if we
    //Fail to create local DB
    //At some point, append username so we have it unique per user id
    "local_fallback": rhost + "local_interface/",
    "sync": {
        "from": true,
        "to": false
    },
    polling: 1500
};

// //Define UI DB ( persist only locally )
// //Might need to rename once role is more refined
// databases.uidb = {
//     "name"          : "user_interface",
//     "local"         : "user_interface_ui",
//     //Note :: This is persisted only locally, internet explorer might need slightly different
//     //handling
//     //"remote"        : rhost+"interface_ui",
//     //Note :: this is the fallback that gets created if we
//     //Fail to create local DB
//     //At some point, append username so we have it unique per user id
//     "local_fallback": rhost+"local_user_interface_ui/",
//     "sync" : {
//         "from"  : false,
//         "to"    : false
//     },
//     polling:1500
// };
//Define Data DB ( Replicate with filter at some point, keeping it full both ways for now )
databases.datadb = {
    "name": "data",
    //At some point, append username so we have it unique per user id
    "local": "data",
    //At some point, append username so we have it unique per user id
    "remote": rhost + "data/",

    //Note :: this is the fallback that gets created if we
    //Fail to create local DB
    //At some point, append username so we have it unique per user id
    "local_fallback": rhost + "local_data/",
    "sync": {
        "from": false,
        "to": false
    },
    polling: 1500
};

var log = function(txt, severity) {
        eve("interface.log", {
            "text": txt,
            severity: severity
        });

        // if(txt.indexOf("_local") >= 0)
        //     return;
        // if ( !isUndefinedOrNull(severity) && severity > 0 ) {
        //     appendChildNodes(currentDocument().body, DIV({style:{"font-weight":"normal", "color":"#961247"}}, txt));
        // }
        // else if ( !isUndefinedOrNull(severity) && severity < 0 ) {
        //     appendChildNodes(currentDocument().body, DIV({style:{"font-weight":"normal", "color":"#038024"}}, txt));
        // }
        // else {
        //     appendChildNodes(currentDocument().body, txt, BR());
        // }
    }
    //log = noop;
var log2 = function(txt, severity) {

        if(txt.indexOf("_local") >= 0) return;

        if(!isUndefinedOrNull(severity) && severity > 0) {
            appendChildNodes(currentDocument().body, DIV({
                style: {
                    "font-weight": "normal",
                    "color": "#961247"
                }
            }, txt));
        } else if(!isUndefinedOrNull(severity) && severity < 0) {
            appendChildNodes(currentDocument().body, DIV({
                style: {
                    "font-weight": "normal",
                    "color": "#038024"
                }
            }, txt));
        } else {
            appendChildNodes(currentDocument().body, txt, BR());
        }
    }
var paper = null;

var init = function() {
        //Capture replication info ( we have only one at start: interfacedb)
        window.CAPTURE_REPLICATION = true;
        //progress bar
        var bar = progressBar();
        bar.name = "progress_bar_0";
        bar.init();
        bar.listenTo("interface.replication.pending", {
            "x": "total_completed",
            "max": "total_to_complete"
        });

        log2("Creating all databases");
        map(function(db) {
            var name = db;
            var db = databases[db];

            //log("Handling: " + db.name);
            //Try to create DB locally
            try {
                log2("Trying to create local DB: idb://" + db.local);
                Pouch("idb://" + db.local, function(err, database) {
                    eve("database.created", {
                        "error": err,
                        "database": database,
                        name: name
                    });
                });
            } catch(e) {
                log2("We can't use idxDB here, trying WebSql");
                try {
                    Pouch("websql://" + db.local, function(err, database) {
                        eve("database.created", {
                            "error": err,
                            "database": database,
                            name: name
                        });
                    });
                } catch(e) {
                    log2("We can't use webSQL here, falling back to remote couch");
                    try {
                        Pouch(db.local_fallback, function(err, database) {
                            eve("database.created", {
                                "error": err,
                                "database": database,
                                name: name
                            });
                        });
                    } catch(e) {
                        log2("Database could not be created :: " + db.local_fallback, 1);
                        log(serializeJSON(e));
                        //In this case, we go on anyhow
                        //eve("database.created", {"error":err, "database":database});
                        throw(e);
                    }
                }
            }
        }, keys(databases));

    };

eve.on("database.created", function() {
    if(isUndefinedOrNull(this.err)) {
        log2("DB has been created: " + this.name, -1);

        var mydb = this.database;
        var db = this.name
        //First launch initial sync
        //Then say you're ready
        databases[db].database = mydb;

        var res = function() {
                eve("database.ready." + db);
                //eve("database.request.changes."+db);
            };

        eve("database.request.sync." + db);

        //log("DB : " + db + " :: sync request sent, now we wait");
        waits = [];
        databases[db].sync.to && waits.push("database.response.sync.to." + db);
        databases[db].sync.from && waits.push("database.response.sync.from." + db);
        waitForEvents(waits).addCallback(res);

        //Note :: sync should check if all data is really necessary
        //Or if sample is enough
    } else {
        log2("DB creation error: " + this.name + " :: " + serializeJSON(this.err));
    }

});

//Launch when ready
//When we're here, we've launched first sync
waitForEvents(["database.ready.interfacedb", "database.ready.datadb"]).addCallbacks(function() {
    log2("OK all DBs Ready", -1);

    window.CAPTURE_REPLICATION = false;
    eve("interface.replication.pending", {
        "pending": 0,
        "total_completed": 100,
        "total_to_complete": 100
    });

    // log2("Checking all_docs");
    // databases["interfacedb"].database.allDocs(function(err, docs){
    //     map(function(doc){log2("Checking: " + doc.id);}, docs.rows);
    // });
    //This is where we create change listeners on the local DBs
    //log("Preparing changes: " + serializeJSON( keys(databases)),-1);
    var waits = [];
    map(function(db) {
        var d = new Deferred();
        waits.push(d);

        //log("Triggering change listener on: " + db, -1);
        databases[db].database.info(function(err, info) {
            if(!isUndefinedOrNull(err)) {
                log2("ERROR getting info on :" + db);
                d.callback();
            } else {
                //log2(db + " :: INFO : " + serializeJSON(info));
                //log("Triggering changes listener on(real): " + db);
                databases[db].last_seq = info.update_seq;
                eve("database.request.changes." + db);
                d.callback();
            }
        });
    }, keys(databases));
    var d = new DeferredList(waits);
    d.addCallback(function() {

        eve("interface.request.main_interface", {
            "id": "interface0"
        });

    });
});

//Sync handler
(function(glob) {
    eve.on("database.request.*", function() {

        var db = eve.nt().split(".")[3];
        var type = eve.nt().split(".")[2];

        if(isUndefinedOrNull(databases[db].polling)) databases[db].polling = 1000;
        var polling = databases[db].polling;

        //log("Received "+ type +" request for: " + db);
        opts = {};

        if(type == "sync") {
            //log(db + " :: received sync request");
            var waiter = new Deferred();
            var syncFrom = new Deferred();
            var syncTo = new Deferred();
            waiter.addCallbacks(function() {
                if(databases[db].sync.from && !isUndefinedOrNull(databases[db].remote)) {
                    //Try to create if local handle not ready
                    try {
                        if(isUndefinedOrNull(databases[db].remotedb)) {
                            databases[db].remotedb = Pouch(databases[db].remote);
                        }
                    } catch(e) {
                        log2("Problem creating remote: " + databases[db].remote);
                    }
                    //log2("DB :: " + db + " SYNC FROM");
                    var onComplete = function(err, res) {
                            //log("In onComplete");
                            if(!isUndefinedOrNull(err)) {
                                eve("database.sync.status." + db, {
                                    success: false,
                                    type: "from"
                                });
                                if(window.LOG_FAILED_REPLICATION) log2("Error encountered during replication ( FROM ) : " + db + " :: " + JSON.stringify(res));
                            } else {
                                eve("database.sync.status." + db, {
                                    success: true,
                                    type: "from"
                                });
                            }
                            //log2("SYNC FROM complete:: " + db) ;
                            eve("database.response.sync.from." + db);
                            //eve("buffered."+databases[db].polling+".database.request.sync."+db);
                            syncFrom.callback();
                        };
                    databases[db].database.replicate.from(databases[db].remotedb, opts, onComplete);
                } else {
                    //log("Returning blank sync from");
                    syncFrom.callback();
                }
            });
            syncFrom.addCallbacks(function() {
                if(databases[db].sync.to && !isUndefinedOrNull(databases[db].remote)) {
                    //Try to create if local handle not ready
                    try {
                        if(isUndefinedOrNull(databases[db].remotedb)) {
                            databases[db].remotedb = Pouch(databases[db].remote);
                        }
                    } catch(e) {
                        log2("Problem creating remote: " + databases[db].remote);
                    }
                    //log2("DB :: " + db + " SYNC TO");
                    var onComplete = function(err, res) {
                            if(!isUndefinedOrNull(err)) {
                                eve("database.sync.status." + db, {
                                    success: false,
                                    type: "to"
                                });
                                if(window.LOG_FAILED_REPLICATION) log2("Error encountered during replication ( TO ) : " + db + " :: " + JSON.stringify(res));
                            } else {
                                eve("database.sync.status." + db, {
                                    success: true,
                                    type: "to"
                                });
                            }
                            //log2("SYNC TO complete:: " + db) ;
                            eve("database.response.sync.to." + db);
                            //eve("buffered."+databases[db].polling+".database.request.sync."+db);
                            syncTo.callback();
                        };
                    databases[db].database.replicate.to(databases[db].remotedb, opts, onComplete);
                } else {
                    //log("Returning blank sync to");
                    syncTo.callback();
                }
            });
            syncTo.addCallback(function() {
                //log(db + " :: requesting sync");
                eve("database.sync.status." + db, {
                    success: true,
                    type: "idle"
                });
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
                    log("DB: " + db + " CHANGE: " + serializeJSON(change), -1);
                    eve("buffered.100.database.change." + db + "." + change.id, change);
                    //We update the last seq
                    if(databases[db].last_seq < change.seq) databases[db].last_seq = change.seq;

                },
                "complete": function(err, res) {

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

eve.on("raphael.DOMload", init)(-100);

eve.on("window.resize", function() {
    //log("Window resized:: width: " + this.w + " :: height: " + this.h);
});

eve.on("database.change.*", function() {
    var evt = eve.nt().split(".");
    var db = evt[2];
    var id = evt[3];

    var change = this;

    //log("DB Change ( "+db+" ) :: " + id + " :: deleted: " + ( change.deleted == true ), ( change.deleted == true ) );
    //log(eve.nt());
});

eve.on("interface.request.*", function() {
    var req = this;
    var cls = eve.nt().split(".")[2];
    var event = eve.nt();
    //log("Received interface request");
    //log("class: " + cls + " :: name: " + req.id );
    //We check if we have interface class in DB
    //Otherwise, we keep requesting it until we
    //have one
    var f = function(err, doc) {
            if(!isUndefinedOrNull(err)) {
                log("Error getting interface object: " + cls + ", resubmitting");
                log("ERROR: " + serializeJSON(err));
                eve("buffered.1000." + event, req);
            } else {
                var o = reviveJSON(evalJSON(serializeJSON(doc)));
                o.name = req.id;

                o.init && o.init();
                //log("Found: " + cls + " rev: " + o._rev);
                var reqh = function() {
                        eve("interface.response_handle." + cls + "." + req.id, o);
                    };
                eve.on("interface.request_handle." + cls + "." + req.id, reqh);
                eve("interface.response." + cls + "." + req.id, {
                    "req": req,
                    "obj": o
                });

                var dest = function() {
                        eve.off("interface." + cls + "." + req.id + ".*");
                        eve.off("interface.request_handle." + cls + "." + req.id);
                        if(!isUndefinedOrNull(o.cleanup)) o.cleanup();
                        //Callback if defined ( Handy in case you need the object to re-instantiate )
                        if(!isUndefinedOrNull(this.callback)) this.callback();
                    };
                eve.once("interface.remove." + cls + "." + req.id, dest);
                //log(cls+" Ready");
            }
        };
    databases.interfacedb.database.get(cls, f);

});

//Connection process
//Base https provides login form
//User Exists or not
//NO --> //Approval process
//Creation of user
//Creation of user datadb
//Creation of user local_fallback db
//Creation of user_ui_db_fallback
//YES --> Initialize program
//Data
//Data should know who can read/write/create
//Note : data changes are buffered ( parameter or default ) clientside
//Interface objects
//Interface classes should have a flag --> dev / integration / production
