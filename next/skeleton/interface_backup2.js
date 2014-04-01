var rhost = (window.location + "").split("://")[0] + "://" + window.location.hostname + ":" + window.location.port + "/";
window.LOG_INFO_REPLICATION = false;
window.AJAX_CONCURRENT_REQUEST_LIMIT = 200;
window.INITIAL_LOG_LENGTH = 5;
window.PINPOINT = "ALL";
window.LOG_FAILED_REPLICATION = true;

window.INTERFACE_OBJECT_REFERENCE = {};

var databases = {};

//Define interface database ( This will be read only for non admin )
databases.interfacedb = {
    "name": "interface",
    "local": "interface",
    "remote": rhost + "interface/",
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
var paper = null;

eve.on("database.init", function(){
    var db = eve.nt().split(".")[2];
    var name = db;
    var db = databases[db];

    db.local_db_string = "unknown";
    //console.log("Handling init: " + db.name);
    //Try to create DB locally
    try {
        log2("Trying to create local DB: idb://" + db.local);
        Pouch("idb://" + db.local, {auto_compaction:true}, function(err, database) {
            eve("database.created."+name, {
                "error": err,
                "database": database,
                name: name
            });
        });
        db.local_db_string = "idb://" + db.local;
    } catch(e) {
        log2("We can't use idxDB here, trying WebSql");
        try {
            Pouch("websql://" + db.local, {auto_compaction:true}, function(err, database) {
                eve("database.created."+name, {
                    "error": err,
                    "database": database,
                    name: name
                });
            });
        db.local_db_string = "websql://" + db.local;
        } catch(e) {
            log2("We can't use webSQL here, falling back to remote couch ( no local sync )");
            var database_tgt = null;
            try {
                //Cancelling replications
                //Note: hardwired into replication also
                //So not really necessary
                db.sync.from = false;
                db.sync.to = false;
                //This one however is necessary
                db.nosync = true;
                database_tgt = Pouch(db.remote,function(err, database) {
                    eve("database.created."+name, {
                        "error": err,
                        "database": database,
                        name: name
                    });
                });
            } catch(e) {
                log2("Database could not be created :: " + db.remote + " Can be normal ( no locals )", 1);
                log2(serializeJSON(e));
                //In this case, we go on anyhow
                    eve("database.created."+name, {
                        "error": null,
                        "database": database_tgt,
                        name: name
                    });
                throw(e);
            }
        }
    }
});

var init = function() {

        window.Pouch = PouchDB;

        logDiv = DIV({
            "style": {
                "border": "solid red 0px",
                "height": "100%",
                "width": "100%"
            }
        });
        appendChildNodes(currentDocument().body, logDiv);
        //Capture replication info ( we have only one at start: interfacedb)
        window.CAPTURE_REPLICATION = true;
        //progress bar
        var bar = progressBar();
        bar.name = "progress_bar_0";
        bar.init();
        window.INTERFACE_OBJECT_REFERENCE["interface.progressBar.progress_bar_0"] = bar;
        bar.listenTo("interface.replication.pending", {
            "x": "total_completed",
            "max": "total_to_complete",
            "remaining": "remaining"
        });

        log2("Creating all databases");
        map(function(db) {
            eve("database.init."+db);
        }, keys(databases));

    };

eve.on("database.created.*", function() {
    if(isUndefinedOrNull(this.err)) {
        log2("DB has been created: " + this.name, -1);
        //console.log("DB has been created: " + this.name, -1);

        var mydb = this.database;
        var db = this.name
        //First launch initial sync
        //Then say you're ready
        databases[db].database = mydb;

        //Note :: sync should check if all data is really necessary
        //Or if sample is enough
    } else {
        log2("DB creation error: " + this.name + " :: " + serializeJSON(this.err));
        console.log("DB creation error: " + this.name + " :: " + serializeJSON(this.err));
    }
})(-100);

eve.once("database.created.interfacedb", function() {
    if(isUndefinedOrNull(this.err)) {

        var mydb = this.database;
        var db = this.name

        var res = function() {
            log2("DB ready: " + "database.ready." + db);
            console.log(db + " :: Database ready");
                eve("database.ready." + db);
                //eve("database.request.changes."+db);
            //console.log("DB Ready: " + db);
        };

        eve("database.request.sync." + db);

        //console.log("DB : " + db + " :: sync request sent, now we wait");
        waits = [];
        databases[db].sync.to && waits.push("database.response.sync.to." + db);
        databases[db].sync.from && waits.push("database.response.sync.from." + db);
        console.log("OK waiting for syncs: " + db);
        waitForEvents(waits).addCallback(res);

        //Note :: sync should check if all data is really necessary
        //Or if sample is enough
    }
});


//Launch when ready
//When we're here, we've launched first sync
waitForEvents(["database.ready.interfacedb"]).addCallbacks(function() {
    log2("OK all DBs Ready", -1);

    window.CAPTURE_REPLICATION = false;

    var db = "interfacedb";

    eve("interface.replication.pending", {
        "pending": 0,
        "total_completed": 100,
        "total_to_complete": 100,
        "remaining": []
    });

    if(!window.LOG_INFO_REPLICATION) removeElement(logDiv);

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
    var syncs_in_progress = {};
    var changes_in_progress = {};

    eve.on("database.request.*", function() {

        //console.log("HERE: " + eve.nt());
        var db = eve.nt().split(".")[3];
        var type = eve.nt().split(".")[2];
        var _internal_flag = eve.nt().split(".")[4];

        if(isUndefinedOrNull(databases[db].polling)) databases[db].polling = 1000;
        var polling = databases[db].polling;

        //console.log("Received "+ type +" request for: " + db);
        var opts = {};

        if(type == "sync") {
            //console.log(db + " :: received sync request");
            var waiter = new Deferred();
            var syncFrom = new Deferred();
            var syncTo = new Deferred();

            if(_internal_flag != "_internal"){
                //console.log("CHECKING SYNC: " + _internal_flag + " :: " + JSON.stringify(syncs_in_progress));
                //console.log("SYNC2: " + syncs_in_progress[db]);
                if(syncs_in_progress[db]){
                    //console.log(db + " :: SYNC already requested.");
                    return;
                }
                else {
                    syncs_in_progress[db] = true;
                    //console.log(db + " :: SYNC requested")
                }
            }

            waiter.addCallbacks(function() {
                if(databases[db].sync.from && !databases[db].nosync && !isUndefinedOrNull(databases[db].remote)) {
                    var onComplete = function(err, res) {
                        //console.log(db +" :: In onComplete ( Replicate FROM )");
                        if(!isUndefinedOrNull(err)) {
                            eve("database.sync.status." + db, {
                                success: false,
                                type: "from",
                                error:err
                            });
                            //console.log("Error encountered during replication ( FROM ) : " + db + " :: " + JSON.stringify(res));
                        } else {
                            eve("database.sync.status." + db, {
                                success: true,
                                type: "from"
                            });
                        }
                        //console.log("SYNC FROM complete :: " + db) ;
                        eve("database.response.sync.from." + db);
                        //eve("buffered."+databases[db].polling+".database.request.sync."+db);
                        try{
                            //console.log(db + " :: Calling syncFrom callback");
                            syncFrom.callback();
                        }catch(e){
                            console.log(db + " :: SyncFrom called twice in a row.(1)");
                        }
                    };

                    //Try to create if local handle not ready
                    try {
                        if(isUndefinedOrNull(databases[db].remotedb)) {
                            //console.log("Trying to create remote DB ( FROM)");
                            databases[db].remotedb = Pouch(databases[db].remote, function(err, database){
                                if(err){
                                    delete(databases[db].remotedb);
                                    return onComplete(err, null);
                                }
                            });
                        }
                    } catch(e) {
                        console.log("Problem creating remote ( FROM ): " + databases[db].remote);
                    }

                    delete opts.filter;
                    if(databases[db].filter_from){
                        opts.filter = databases[db].filter_from;
                    }
                    var opt = Pouch.extend(true, {}, opts);
                    opt.complete = onComplete;
                    //console.log("DB :: " + db + " SYNC FROM");
                    databases[db].database.replicate.from(databases[db].remotedb, opt);
                } else {
                    //console.log(db + " :: Returning blank sync from");
                    try{
                        //console.log(db + " :: Calling syncFrom callback");
                        syncFrom.callback();
                    }catch(e){
                        console.log(db + " :: SyncFrom called twice in a row.(2)");
                    }
                }
            });
            syncFrom.addCallbacks(function() {
                if(databases[db].sync.to && !databases[db].nosync && !isUndefinedOrNull(databases[db].remote)) {
                    //Try to create if local handle not ready
                    var onComplete = function(err, res) {
                        //console.log("Replication TO: entered onComplete: " + err);
                        if(!isUndefinedOrNull(err)) {
                            eve("database.sync.status." + db, {
                                success: false,
                                type: "to",
                                error:err
                            });
                            if(window.LOG_FAILED_REPLICATION) console.log("Error encountered during replication ( TO ) : " + db + " :: " + JSON.stringify(res));
                        } else {
                            eve("database.sync.status." + db, {
                                success: true,
                                type: "to"
                            });
                        }
                        //console.log("SYNC TO complete :: " + db) ;
                        eve("database.response.sync.to." + db);
                        //eve("buffered."+databases[db].polling+".database.request.sync."+db);
                        try{
                            //console.log(db + " :: Calling syncTo callback");
                            syncTo.callback();
                        }catch(e){
                            console.log(db + " :: SyncTo called twice in a row.(1)");
                        }
                    };
                    try {
                        //console.log(db + " :: Creating remotedb");
                        if(isUndefinedOrNull(databases[db].remotedb)) {
                            databases[db].remotedb = Pouch(databases[db].remote, function(err, database){
                                if(err){
                                    delete(databases[db].remotedb);
                                    return onComplete(err, null);
                                }
                            });
                        }
                    } catch(e) {
                        //log2("Problem creating remote: " + databases[db].remote);
                        console.log("Problem creating remote: " + databases[db].remote);
                    }
                    //console.log("DB :: " + db + " SYNC TO");
                    //console.log("Replication TO remote: " + db);
                    delete opts.filter;
                    if(databases[db].filter_to){
                        opts.filter = databases[db].filter_to;
                    }
                    var opt = Pouch.extend(true, {}, opts);
                    opt.complete = onComplete;
                    databases[db].database.replicate.to(databases[db].remotedb, opt);
                } else {
                    //console.log(db + " :: Returning blank sync to");
                    try{
                        //console.log(db + " :: Calling syncTo callback");
                        syncTo.callback();
                    }catch(e){
                        console.log(db + " :: SyncTo called twice in a row.(2)");
                    }
                }
            });
            syncTo.addCallback(function() {
                //console.log(db + " :: requesting sync");
                eve("database.sync.status." + db, {
                    success: true,
                    type: "idle"
                });
                eve("buffered." + databases[db].polling + ".database.request.sync." + db + "._internal");
            });
            waiter.callback();
        }
        if(type == "changes") {
            //log("Changes request Received : " + eve.nt() + " LAST_SEQ: " + databases[db].last_seq, 1);
            if(_internal_flag != "_internal"){
                if(changes_in_progress[db]){
                    console.log(db + " :: CHANGES already requested.");
                    return;
                }
                else {
                    console.log(db + " :: CHANGES requested")
                    changes_in_progress[db] = true;
                }
            }

            databases[db].database.changes({
                "onChange": function(change) {
                    //Handle bug on last seq
                    //if(change.seq <= databases[db].last_seq) return;
                    var change_message = evalJSON(serializeJSON(change));
                    if("seq" in change_message && (findValue(change_message["seq"], "-") != -1)) change_message["seq"] = change_message["seq"].split("-")[0] + "-" + change_message["seq"].split("-")[1].substr(0, 4) + "...";
                    map(function(chg) {
                        if("rev" in chg) chg["rev"] = chg["rev"].split("-")[0] + "-" + chg["rev"].split("-")[1].substr(0, 4) + "...";
                    }, change_message["changes"]);
                    //log("DB: " + db + " CHANGE: " + serializeJSON(change_message), -1);
                    eve("buffered.500.database.change." + db + "." + change.id, change);
                    //We update the last seq
                    //WARNING: check this against cloudant & iriscouch, not sure how theirs behave
                    if(databases[db].last_seq < change.seq) databases[db].last_seq = change.seq;

                },
                "complete": function(err, res) {

                    //log2("DB: " + db + " CHANGE(complete): " + serializeJSON(res) + " :: " + databases[db].database.type(), -1);
                    //This is where you trigger next change request
                    eve("buffered." + databases[db].polling + ".database.request.changes." + db + "._internal");
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

eve.on("interface.request_handle.*", function() {

    var evt = eve.nt();

    var lcls = evt.split(".")[2];
    var lname = evt.split(".")[3];

    if(("interface." + lcls + "." + lname) in window.INTERFACE_OBJECT_REFERENCE) {
        var o = window.INTERFACE_OBJECT_REFERENCE["interface." + lcls + "." + lname];
        if(typeof(this) == 'function') this(o);
        eve("delayed.0.interface.response_handle." + lcls + "." + lname, o);
    } else {
        //try{console.log("Received request for: " + cls + "."+ name+ " :: Not, found re-submitting")}catch(e){noop()}
        eve("delayed.500." + evt, this);
    }

});

//Utility function
//Pattern or parameters is of the form: button.button0 ( we dump the interface prefix )
eve.on("interface.request_add_children", function(parent, children) {
    if(!isArrayLike(children)) children = [children];

    var waits = ["interface.response_handle." + parent];
    eve("delayed.0.interface.request_handle." + parent)

    map(function(c) {
        waits.push("interface.response_handle." + c);
        eve("delayed.0.interface.request_handle." + c);
    }, children)

    waitForEvents(waits).addCallback(function() {
        map(function(c) {
            window.INTERFACE_OBJECT_REFERENCE["interface." + parent].appendChildren(window.INTERFACE_OBJECT_REFERENCE["interface." + c]);
        }, children);
    });

})
eve.on("interface.request_remove_children", function(parent, children) {
    if(!isArrayLike(children)) children = [children];

    var waits = ["interface.response_handle." + parent];
    eve("delayed.0.interface.request_handle." + parent)

    map(function(c) {
        waits.push("interface.response_handle." + c);
        eve("delayed.0.interface.request_handle." + c);
    }, children)

    waitForEvents(waits).addCallback(function() {
        map(function(c) {
            window.INTERFACE_OBJECT_REFERENCE["interface." + parent].removeChildren(window.INTERFACE_OBJECT_REFERENCE["interface." + c]);
        }, children);
    });

})

eve.on("interface.mixin.change", function() {
    var to_be_respawned = {};
    var to_check = clone(this.updated);
    extend(to_check, this.deleted);
    map(function(mix) {
        map(function(idx) {
            var o = window.INTERFACE_OBJECT_REFERENCE[idx];
            if(isUndefinedOrNull(o.implemented_mixins)) return;
            if(findValue(o.implemented_mixins, mix) != -1 && findValue(o.implemented_mixins, "canRespawn") != -1) {
                to_be_respawned[idx.split(".")[1]] = true;
            }
        }, keys(window.INTERFACE_OBJECT_REFERENCE));
    }, to_check);
    log("Classes to be respawned: " + serializeJSON(keys(to_be_respawned)));
    //Simulate database change to respawn component
    map(function(item) {
        eve("database.change.interfacedb." + item, {
            "seq": "DUMMY",
            changes: []
        });
    }, keys(to_be_respawned));
})

eve.on("interface.mixin_beta.change", function() {
    var to_be_respawned = {};
    var to_check = clone(this.updated);
    extend(to_check, this.deleted);
    map(function(mix) {
        map(function(idx) {
            var o = window.INTERFACE_OBJECT_REFERENCE[idx];
            if(isUndefinedOrNull(o.implemented_mixins)) return;
            if(findValue(o.implemented_mixins, mix) != -1 && findValue(o.implemented_mixins, "canRespawn") != -1) {
                to_be_respawned[idx.split(".")[1]] = true;
            }
        }, keys(window.INTERFACE_OBJECT_REFERENCE));
    }, to_check);
    log("Classes to be respawned: " + serializeJSON(keys(to_be_respawned)));
    //Simulate database change to respawn component
    map(function(item) {
        eve("database.change.interfacedb." + item, {
            "seq": "DUMMY",
            changes: []
        });
    }, keys(to_be_respawned));
})

eve.on("interface.request.*", function() {
    var req = this;
    var cls = eve.nt().split(".")[2];
    var event = eve.nt();

    if(isUndefinedOrNull(this.id)){
        alert("An interface.request was sent without an id, cancelling spawn");
        return;
    }

    //log("Received interface request");
    //log("class: " + cls + " :: name: " + req.id );
    //We check if we have interface class in DB
    //Otherwise, we keep requesting it until we
    //have one
    var f = function(err, doc) {
            if(!isUndefinedOrNull(err)) {
                console.log("Error getting interface object: " + cls + ", resubmitting");
                console.log("ERROR: " + serializeJSON(err));
                eve("delayed.1000." + event, req);
            } else {
                var o = reviveJSON(evalJSON(serializeJSON(doc)));
                //Keeping o.name for retro-compatibility
                //Remove as soon as possible
                //We check if mixins are required, and if mixins are ready ( in window )
                if(!isUndefinedOrNull(o.mixins) && isUndefinedOrNull(window.mixins)) {
                    console.log("Error instantiating interface object: " + cls + ", mixins not ready... Resubmitting");
                    eve("delayed.100." + event, req);
                    return;
                }

                o.name = req.id;

                //Handle special case for postInits
                var postInits = [];
                if(o.postInits) {
                    map(function(ini){postInits.push(ini);}, o.postInits)
                }
                if(req.postInits) {
                    map(function(ini){postInits.push(ini);}, req.postInits);
                }
                req.postInits = postInits;

                //Handling special cases for parent and children
                //These are straight references that can loop, so we handle
                //them differently
                var transient_vars = {};
                map(function(item) {
                    if(!isUndefinedOrNull(req[item])) {
                        transient_vars[item] = req[item];
                        delete req[item];
                    }
                }, ["parent", "children"]);

                var oo = Pouch.extend(true, {}, req);
                update(oo, transient_vars);
                delete transient_vars;

                oo.id = cls + "." + req.id;
                //mutate o to accept all settings put in req
                //console.log("Mutate param: " + o.name + " :: " +JSON.stringify(req));
                update(o, oo);
                //console.log("Pre build: " + o.name + " :: " +JSON.stringify(oo));
                if(o.mixins) {
                    map(function(mix) {
                        window.mixins[mix](o);
                        bindMethods(o);
                    }, o.mixins);
                }
                //A last bind for good measure
                bindMethods(o);

                //Run mixin inits
                if(o.inits && o.inits.length) {
                    map(function(ff) {
                        ff.apply(o);
                    }, o.inits);
                }

                o.init && o.init();

                //Run mixin postInits
                if(o.postInits && o.postInits.length) {
                    map(function(ff) {
                        ff.apply(o);
                    }, o.postInits);
                }

                window.INTERFACE_OBJECT_REFERENCE["interface." + cls + "." + req.id] = o;
                //log("Found: " + cls + " rev: " + o._rev);
                eve("interface.response." + cls + "." + req.id, {
                    "req": req,
                    "obj": o
                });

                var dest = function() {
                        var callback = this.callback;
                        //Prevent multiple calls ( normally .once prevents this)
                        if(o._destroyed) return;

                        o._being_destroyed = true;
                        var handleRemove = function(){
                            //Prevent multiple calls ( normally .once prevents this)
                            if(o._destroyed) return;

                            o._destroyed = true;
                            eve.off("interface." + cls + "." + req.id + ".*");
                            eve.off("interface.request_handle." + cls + "." + req.id);

                            if(!isUndefinedOrNull(o.cleanup)) o.cleanup();
                            if(!isUndefinedOrNull(o.cleanups)) {
                                map(function(oc) {
                                    oc.apply(o);
                                }, o.cleanups)
                            }
                            //Callback if defined ( Handy in case you need the object to re-instantiate )
                            if(!isUndefinedOrNull(callback)) callback();
                            delete window.INTERFACE_OBJECT_REFERENCE["interface." + cls + "." + req.id];
                            eve("delayed.0.interface.removed." + cls + "." + req.id);
                        };
                        if(o.implements && o.implements("isLockable")){
                            o.lock.acquire().addCallback(function(){
                                handleRemove();
                                o.lock.release();
                            });
                        }
                        else {
                            handleRemove();
                        }
                    };
                eve.once("interface.remove." + cls + "." + req.id, dest);
                //log(cls+" Ready");
            }
        };
    databases.interfacedb.database.get(cls, f);

});

eve.on("database.*.object_request.*", function() {
    var cls = eve.nt().split(".")[3];
    var db = eve.nt().split(".")[1];

    var f = this;

    //console.log("Requesting: " + cls + " from DB: " + db);
    if(db in databases) {
        databases.interfacedb.database.get(cls, f);
    } else {

    }
});