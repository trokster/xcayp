xcayp
=====

It could be summarized as a pouch app. A web app that can be customized in browser, everywhere where pouchdb(https://github.com/daleharvey/pouchdb) is supported. A skeleton is provided that connects to the source DBs, interface objects are downloaded locally from source DBs and revived live.


Goal is simple: create a robust common library where participants may drop custom interfaces that they feel would be useful to the community.


Dependencies:
-------------

- Mochikit a simple feature complete js framework  							 --> http://mochikit.com
- Raphael a cross browser SVG library										 --> http://raphaeljs.com
- pouchdb the database that syncs											 --> http://pouchdb.com
- Codemirror in browser editor that gave me the idea in the first place		 --> http://codemirror.com
- Embedded within pouch for the moment: jquery								 --> http://jquery.com

Pouch version is custom, I'll sync up when ready.

Give it a shot :)
----------------

You have a choice: replicate my couchdb databases:

https://xcayp.cloudant.com/interface

https://xcayp.cloudant.com/data

https://xcayp.cloudant.com/interface_ui

Then point to your own db, or play around with it locally at:

https://xcayp.cloudant.com/interface/_design/interface/interface.html

 ( remote saves not allowed )

Once first replication is complete, you can tick off the replication arrow on interfacedb so the login dialog stops popping up.

Note: couch databases should be behind https, otherwise you'll need to alter interface.js

When you're set up, click on top right JS icon ( half hidden ), and starting playing with your interface.



Supported Browsers:
chrome
android chrome
safari
mobile safari

Anything pouch and Raphaeljs run on.

IE10 support when pouch is ready. Ie 10- support is available by creating extra dbs on the source db ( in interface.js ) when in memory pouch is available, will switch to that.


OK it works, what next ?
------------------------

You can edit interface elements, create new ones ( just enter an id that doesn't exist ) and replicate to source database when satisfied.

Interface elements are called in main_interface object. Then eve is used to pass messages around.

Have a look at main interface and say layer to get a gist of how things are done.
Dedicated webpage coming soon.

