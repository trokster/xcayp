Xcayp
=====

Have you ever dreamt of working on your websites from any device with a browser? Xcayp allow this and much more.

Xcayp is a modular online interface in which the code is stored in a web oriented database (couchdb) with advanced 
sync capabilities. This allows for radical approach to user interfaces, development and deployment.  

For the time being the interface is composed of:
 - A code editor allowing online/offline modification of the interface objects, regenerating the frontend in real time.
 - Widgets controling the connection to the remote DBs, and therefore choose if work is performed locally 
or synchronized directly to the server whenever you are online.


The goal is to provide the community with a robust interface along with a component repository that can be used by 
others as the foundation to build their online applications. Thanks to the very nature of the technology used, you get end 
user and application data sync for free


Status
------

Functional but very very alpha. We mean it.

Dependencies:
-------------
Xcayp is built upon the following libraries:
- Mochikit: a simple feature complete js framework    					 --> http://mochikit.com
- Raphael: a cross browser SVG library										 --> http://raphaeljs.com
- Pouchdb: the database that syncs											 --> http://pouchdb.com
- Codemirror: in browser editor that gave me the idea in the first place		 --> http://codemirror.net
- Jquery: Embedded within pouch for the moment								 --> http://jquery.com
- Jsbeautifier: To make your code pretty
- base64.js: for btoa/atob polyfill ( ie )
- json2: JSON library not sure if needed anymore.

Supported Browsers:
------------------
Xcayp has been tested with modern versions of Chrome, Android Chrome, Android firefox, Safari, Mobile Safari & Firefox (16+).

IE support is only partial for the moment (remote pouch simulates local pouchdb ). IE10 support should be 
soon when Pouchdb implements it.

This list assumes your browser supports SVG and indexeddb.

Chrome on nexus7 has been reported not to work

Opera not tested

Give it a shot :)
----------------

Play around with it to experience new way to use a DB, A test server is set-up allowing you to test the interface & 
the editor. Keep in mind that for obvious security reason the change you will make will be limited to the local image 
and will not be persistent nor sent to the server



When the page is up, click on top right JS icon ( half hidden ), and start playing with your interface.
( remote saves not allowed )

Click to play at:

https://xcayp.com



OK it works, what next ?
------------------------

You can edit interface elements, create new ones ( just enter an id that doesn't exist and delete the rev key ) and replicate to source database when satisfied.

Interface elements are called in main_interface object. Then eve.js is used to pass messages around.

Have a look at main interface and layer to get a gist of how things are done.


Bring it on, I Couch like a pro
-------------------------------

If you want to have your own server you will need to replicate the following couchdb databases:
 - Interface DB for replication https://xcayp.com/interface
 - Data DB for replication https://xcayp.com/data
 - remote sandbox for ie to simulate local: https://xcayp.com/local_interface
 - remote sandbox for ie to simulate local: https://xcayp.com/local_data
Then go to: https://your.couchdb.database.com/interface/_design/interface/interface.html




