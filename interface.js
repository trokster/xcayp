//Define base server string
//var rhost = "http://xcayp.webfactional.com/";
//var rhost = "http://ecrew-beta:5984/";
var rhost = "https://"+window.location.hostname+":"+window.location.port+"/";

var databases = {};

//Define interface database ( This will be read only for non admin )
databases.interfacedb = {
    "name"          : "interface",
    "local"         : "interface",
    "remote"        : rhost+"interface_ui/",
    //Note :: this is the fallback that gets created if we
    //Fail to create local DB
    //At some point, append username so we have it unique per user id
    "local_fallback": rhost+"local_interface_ui/",
    "sync" : {
        "from"  : false,
        "to"    : false
    },
    polling:1500
};

//Define UI DB ( persist only locally )
//Might need to rename once role is more refined
databases.uidb = {
    "name"          : "user_interface",
    "local"         : "user_interface_ui",
    //Note :: This is persisted only locally, internet explorer might need slightly different
    //handling
    
    //"remote"        : rhost+"interface_ui",
    
    //Note :: this is the fallback that gets created if we
    //Fail to create local DB
    //At some point, append username so we have it unique per user id
    "local_fallback": rhost+"local_user_interface_ui/",
    "sync" : {
        "from"  : false,
        "to"    : false
    },
    polling:1500
};

//Define Data DB ( Replicate with filter at some point, keeping it full both ways for now )
databases.datadb = {
    "name"          : "data",
    //At some point, append username so we have it unique per user id
    "local"         : "data",
    //At some point, append username so we have it unique per user id
    "remote"        : rhost+"data/",
    
    //Note :: this is the fallback that gets created if we
    //Fail to create local DB
    //At some point, append username so we have it unique per user id
    "local_fallback": rhost+"local_data/",
    "sync" : {
        "from"  : false,
        "to"    : false
    },
    polling:1500
};

var log = function(txt, severity){
    eve("interface.log", {"text":txt, severity:severity});

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
var log2 = function(txt, severity){

    if(txt.indexOf("_local") >= 0)
        return;

    if ( !isUndefinedOrNull(severity) && severity > 0 ) {
        appendChildNodes(currentDocument().body, DIV({style:{"font-weight":"normal", "color":"#961247"}}, txt));
    }
    else if ( !isUndefinedOrNull(severity) && severity < 0 ) {
        appendChildNodes(currentDocument().body, DIV({style:{"font-weight":"normal", "color":"#038024"}}, txt));
    }
    else {
        appendChildNodes(currentDocument().body, txt, BR());
    }
}
var paper = null;

var init = function () {

    //log("OK app starting");
    //log("Addresses: " + serializeJSON(window.location));
          
    log2("Creating all databases");
    map(function(db){
        var name = db;
        var db = databases[db];

        //log("Handling: " + db.name);
        //Try to create DB locally
        try {
            log2("Trying to create local DB: idb://" + db.local);
            Pouch("idb://" + db.local, function(err, database){eve("database.created", {"error":err, "database":database, name:name});});
        } catch(e){
            log2("We can't use idxDB here, trying WebSql");
            try{
                Pouch("websql://" + db.local, function(err, database){eve("database.created", {"error":err, "database":database, name:name});});
            }
            catch(e){
                log2("We can't use webSQL here, falling back to remote couch");
                try{
                    Pouch(db.local_fallback, 
                       function(err, database){
                           eve("database.created", {"error":err, "database":database,name:name});
                       });
                } catch(e){
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

eve.on("database.created", function(){
    if(isUndefinedOrNull(this.err)){
        log2("DB has been created: " + this.name, -1);
        var mydb = this.database;
        var db = this.name
        //First launch initial sync
        //Then say you're ready
        databases[db].database = mydb;
        
        var res = function(){
            eve("database.ready."+db);
            //eve("database.request.changes."+db);
        };
        
        eve("database.request.sync."+db);
        
        //log("DB : " + db + " :: sync request sent, now we wait");
        
        waits = [];
        databases[db].sync.to && waits.push("database.response.sync.to."+db);
        databases[db].sync.from && waits.push("database.response.sync.from."+db);
        waitForEvents(waits).addCallback(res);
        
        //Note :: sync should check if all data is really necessary
        //Or if sample is enough
    }
    else {
        log2("DB creation error: " + this.name + " :: " + serializeJSON(this.err));
    }
       
});

//Launch when ready
//When we're here, we've launched first sync
waitForEvents([
    "database.ready.interfacedb", 
    "database.ready.uidb", 
    "database.ready.datadb"
    ]).addCallbacks(function(){
    log2("OK all DBs Ready", -1);
    replaceChildNodes(currentDocument().body, null);
    
    //This is where we create change listeners on the local DBs
    //log("Preparing changes: " + serializeJSON( keys(databases)),-1);
    map(function(db){
        //log("Triggering change listener on: " + db, -1);
        databases[db].database.info(function(err, info){
            if(!isUndefinedOrNull(err)){
                log("ERROR getting info on :" + db);
            }
            else {
                log(db + " :: INFO : " + serializeJSON(info));
                //log("Triggering changes listener on(real): " + db);
                databases[db].last_seq = info.update_seq;
                eve("database.request.changes."+db);
            }
        });
    }, keys(databases));

        
    log("Sending request for main_interface");


    eve("interface.request.main_interface", {"id":"interface0"});
    
    //databases.datadb.database.post({"test":"HULLLA"}, function(err, res){});
    
    databases.interfacedb.database.allDocs({conflicts:true}, function(err, docs){
        
        var k = (map(function(doc){ return doc.id}, docs.rows));
        log("ALLDOCS: [ " + k.join(", ") + " ]");

        if(findValue(k, "main_interface")<0 || findValue(k, "db_widget")<0){
            log("Can't find minimal interface, requesting sync from");
            databases["interfacedb"].sync.from = true;
        }
        else {
            log("Everything looks good, launching local instance");
        }
    });
    
}, function(err){log("Error in DB creation cb");});

//Sync handler
(function(glob){
    eve.on("database.request.*", function(){
        
        var db = eve.nt().split(".")[3];
        var type =  eve.nt().split(".")[2];
        
        if(isUndefinedOrNull(databases[db].polling))
            databases[db].polling = 1000;
        var polling = databases[db].polling;
        
        //log("Received "+ type +" request for: " + db);
        
        opts = {};
        
        if(type == "sync" ){
            //log(db + " :: received sync request");
                
            var waiter = new Deferred();
            var syncFrom = new Deferred();
            var syncTo = new Deferred();
            waiter.addCallbacks(function(){
                if(databases[db].sync.from && !isUndefinedOrNull(databases[db].remote)) {
                    //Try to create if local handle not ready
                    try {
                        if(isUndefinedOrNull(databases[db].remotedb)){
                            databases[db].remotedb = Pouch(databases[db].remote);
                        }
                    }
                    catch(e){
                        log2("Problem creating remote: " + databases[db].remote);
                    }
                    //log("DB :: " + db + " SYNC FROM");
                    var onComplete = function(err){
                        //log("In onComplete");
                        if(!isUndefinedOrNull(err)){
                            eve("database.sync.status."+db, {success:false, type:"from"});
                        }
                        else {
                            eve("database.sync.status."+db, {success:true, type:"from"});
                        }
                        //log("SYNC FROM complete:: " + db) ;
                        eve("database.response.sync.from."+db);
                        //eve("buffered."+databases[db].polling+".database.request.sync."+db);
                        syncFrom.callback();
                    };
                    databases[db].database.replicate.from(databases[db].remotedb, opts, onComplete);
                }
                else {
                    //log("Returning blank sync from");
                    syncFrom.callback();
                }
            });
            syncFrom.addCallbacks(function(){
                if(databases[db].sync.to  && !isUndefinedOrNull(databases[db].remote)) {
                    //Try to create if local handle not ready
                    try {
                        if(isUndefinedOrNull(databases[db].remotedb)){
                            databases[db].remotedb = Pouch(databases[db].remote);
                        }
                    }
                    catch(e){
                        log2("Problem creating remote: " + databases[db].remote);
                    }
                    //log("DB :: " + db + " SYNC TO");
                    var onComplete = function(err){
                        if(!isUndefinedOrNull(err)){
                            eve("database.sync.status."+db, {success:false, type:"to"});
                        }
                        else {
                            eve("database.sync.status."+db, {success:true, type:"to"});
                        }
                        //log("SYNC TO complete:: " + db) ;
                        eve("database.response.sync.to."+db);
                        //eve("buffered."+databases[db].polling+".database.request.sync."+db);
                        syncTo.callback();
                    };
                    databases[db].database.replicate.to(databases[db].remotedb, opts, onComplete);
                }
                else {
                    //log("Returning blank sync to");
                    syncTo.callback();
                }
            });
            syncTo.addCallback(function(){
                //log(db + " :: requesting sync");
                eve("database.sync.status."+db, {success:true, type:"idle"});
                eve("buffered."+databases[db].polling+".database.request.sync."+db);
            });
            waiter.callback();
        }
        if(type == "changes"){
            //log("Changes request Received : " + eve.nt() + " LAST_SEQ: " + databases[db].last_seq, 1);
            databases[db].database.changes({
                "onChange":function(change){
                    //Handle bug on last seq
                    //if(change.seq <= databases[db].last_seq) return;
                    
                    log("DB: " + db + " CHANGE: " + serializeJSON(change), -1);
                    eve("buffered.100.database.change."+db+"."+change.id, change);
                    //We update the last seq
                    if(databases[db].last_seq < change.seq)
                        databases[db].last_seq = change.seq;

                },
                "complete":function(err, res){
                    
                    //log2("DB: " + db + " CHANGE(complete): " + serializeJSON(res) + " :: " + databases[db].database.type(), -1);
                    //This is where you trigger next change request
                    eve("buffered."+databases[db].polling+".database.request.changes."+db);
                },
                "since":databases[db].last_seq,
                //Make changes feed continuous if not http
                "continuous" : databases[db].database.type() != 'http' ? true : false
            });
        }
    });
})(this);




eve.on("raphael.DOMload", init)(-100);

eve.on("window.resize", function(){
    //log("Window resized:: width: " + this.w + " :: height: " + this.h);
});

eve.on("database.change.*", function(){
    var evt = eve.nt().split(".");
    var db = evt[2];
    var id = evt[3];
    
    var change = this;
    
    //log("DB Change ( "+db+" ) :: " + id + " :: deleted: " + ( change.deleted == true ), ( change.deleted == true ) );
    //log(eve.nt());
});

eve.on("interface.request.*", function(){
    var req = this;
    var cls = eve.nt().split(".")[2];
    var event = eve.nt();
    //log("Received interface request");
    //log("class: " + cls + " :: name: " + req.id );
    
    //We check if we have interface class in DB
    //Otherwise, we keep requesting it until we
    //have one
    var f = function(err, doc){
        if(!isUndefinedOrNull(err)){
            log("Error getting interface object: " + cls + ", resubmitting");
            log("ERROR: " + serializeJSON(err));
            eve("buffered.1000."+event, req);
        }
        else {
            var o = reviveJSON(evalJSON(serializeJSON(doc)));
            o.name = req.id;
            
            o.init && o.init();
            //log("Found: " + cls + " rev: " + o._rev);
            var reqh = function(){
                eve("interface.response_handle."+ cls + "." +req.id, o); 
            };
            eve.on("interface.request_handle."+cls+"." + req.id, reqh);
            eve("interface.response."+cls+"."+req.id, {"req": req, "obj": o});
            
            var dest = function(){
                eve.off("interface."+cls+"."+req.id+".*");
                eve.off("interface.request_handle."+cls+"." + req.id);
                if(!isUndefinedOrNull(o.cleanup)) o.cleanup();
                //Callback if defined ( Handy in case you need the object to re-instantiate )
                if(!isUndefinedOrNull(this.callback)) this.callback();
            };
            eve.once("interface.remove."+cls+"."+req.id, dest);
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




