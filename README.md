xcayp
=====

It could be summarized as a pouch app. A web app that can be customized in browser, everywhere where pouchdb(https://github.com/daleharvey/pouchdb) is supported. A skeleton is provided that connects to the source DBs, interface objects are downloaded locally from source DBs and revived.


Goal is simple: create a robust common library where participants may drop custom interfaces that they feel would be useful to the community.

Status
------

Very very alpha.

Dependencies:
-------------
Xcayp is build on the following apps which brings critical functionalities:
- Mochikit a simple feature complete js framework    					 --> http://mochikit.com
- Raphael a cross browser SVG library										 --> http://raphaeljs.com
- pouchdb the database that syncs											 --> http://pouchdb.com
- Codemirror in browser editor that gave me the idea in the first place		 --> http://codemirror.com
- Embedded within pouch for the moment: jquery								 --> http://jquery.com

Supported Browsers:
------------------
There is no known issues with modern version of Chrome, android Browser, safari, mobile safari & Firefox 16 or more. 

IE Support is only partial for the moment due to the lack of support for pouchdb
Ie 10 operation is still possible with some work by creating extra dbs on the source db ( in interface.js ) when in memory pouch is available, will switch to that.


Give it a shot :)
----------------

Play around with it locally to experience new way to use a DB 

When the page is up, click on top right JS icon ( half hidden ), and start playing with your interface.
( remote saves not allowed )

Click to play at:

https://xcayp.cloudant.com/interface/_design/interface/interface.html


OK it works, what next ?
------------------------

You can edit interface elements, create new ones ( just enter an id that doesn't exist ) and replicate to source database when satisfied.

Interface elements are called in main_interface object. Then eve.js is used to pass messages around.

Have a look at main interface and layer to get a gist of how things are done.
Dedicated webpage coming soon.



Bring it on, I Couch like a pro
-------------------------------

If you want to hav your own server you will need to replicate thee following couchdb databases:

https://xcayp.cloudant.com/interface
https://xcayp.cloudant.com/data
https://xcayp.cloudant.com/interface_ui

Note: couch databases should be behind https, otherwise you'll need to alter interface.js


