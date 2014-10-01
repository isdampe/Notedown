Notedown - Yup, notes with markdown.
-------------------------------------

Notedown is a node-webkit based NodeJS app for storing
your notes in markdown.

It does exactly as you would expect - provides a simple
interface for composing and viewing markdown based notes.

![Notedown editor](screenshot-1.png)

![Notedown viewer](screenshot-2.png)

Download pre-built binaries, including node-webkit.
==========================================

> Last build 1/10/2014

Windows: [w-32bit]  
Linux: [l-32bit] / [l-64bit]  
Mac: [m-32bit] / [m-64bit]

[w-32bit]: http://cdn.evasivesoftware.com/notedown/notedown-win32.zip
[l-32bit]: http://cdn.evasivesoftware.com/notedown/notedown-linux32.zip
[l-64bit]: http://cdn.evasivesoftware.com/notedown/notedown-linux64.zip
[m-32bit]: http://cdn.evasivesoftware.com/notedown/notedown-mac32.zip
[m-64bit]: http://cdn.evasivesoftware.com/notedown/notedown-mac64.zip

How to compile.
===============

First, clone this repository.

	git clone https://github.com/isdampe/Notedown.git

Next, go download a suitable version of [node-webkit].

[node-webkit]: https://github.com/rogerwang/node-webkit

Copy node-webkit into the node-webkit/ folder

	cp ~/Downloads/node-webkit/* ~/git/notedown/node-webkit/

Install the Node dependencies

	cd ~/git/notedown/node-webkit
	npm install

Launch the app

	./nw

Contributing.
=============

Send pull-requests at will.