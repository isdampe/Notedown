/*
 * Notedown.js
 *
 * For keeping track of notes with Markdown.
 * License: GPL 2.0
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 * Enjoy
 *
 * Thanks to:
 * marked (https://github.com/chjj/marked)
 * Lato fonts (http://www.latofonts.com/)
 * Node-webkit (https://github.com/rogerwang/node-webkit)
 *
 * Written by @isdampe (https://github.com/isdampe)
 * Send your pull requests to https://github.com/isdampe/Notedown
 */

//Load the filesystem library.
var fs = require('fs');
var marked = require('marked');
var gui = require('nw.gui');

//JSON structure.
var notes = [];
var nodes = [];

//The main noteDown object.
//This controls almost everything.
(function(opts,window) {

	this.opts = opts;

	this.elements = {

		noteList: document.getElementById("note-list"),
		noteAddNew: document.getElementById("note-add-new"),
		noteView: document.getElementById("note-current-view"),
		noteViewClose: document.getElementById("view-close"),
		noteEditor: document.getElementById("note-edit"),
		noteEditorTitle: document.getElementById("note-edit-title"),
		noteEditorContent: document.getElementById("note-edit-editor"),
		noteEditorColor: document.getElementById("note-edit-color"),
		noteEditorClose: document.getElementById("editor-close"),
		noteCurrentEdit: document.getElementById("note-current-edit"),
		aEls: document.querySelectorAll("[data-rel=color]"),
		noteEditorSave: document.getElementById("note-edit-publish")

	};

	var activeNoteId = -1;

	this.addColorHook = function(element) {
		element.addEventListener('click', function(e) {
			e.preventDefault();

			var color = this.getAttribute('data-color');
			notedown.elements.noteEditorColor.value = color;

			notedown.syncColors();

		});
	};

	this.addShortcutsHook = function(){

		var keyMap = [];
		keyMap["addNote"] = ["ctrl+n"];
		keyMap["editNote"] = ["ctrl+e"];
		keyMap["publishNote"] = ["ctrl+s"];
		keyMap["discardNote"] = ["ctrl+d","esc"];

		var publishCurrentNote = function(e){
			this.elements.noteEditorSave.click();
			return false;
		};

		var discardCurrentNote = function(e){
			this.elements.noteEditorClose.click();
			return false;
		};

		var editCurrentNote = function(e){
			this.elements.noteCurrentEdit.click();
			return false;
		};

		var addNote = function(e){
			this.elements.noteAddNew.click();
			return false;
		};

		var hook = function( elem, keys, callback ){
			Mousetrap(elem).bind(keys,callback);
		};

		//Add note
		hook(document,keyMap["addNote"],addNote);

		//Edit note
		hook(document,keyMap["editNote"],editCurrentNote);
		hook(this.elements.noteEditorTitle,keyMap["editNote"],editCurrentNote);
		hook(this.elements.noteEditorContent,keyMap["editNote"],editCurrentNote);

		//Publish note
		hook(this.elements.noteEditorTitle,keyMap["publishNote"],publishCurrentNote);
		hook(this.elements.noteEditorContent,keyMap["publishNote"],publishCurrentNote);

		//Discard note
		hook(this.elements.noteEditorTitle,keyMap["discardNote"],discardCurrentNote);
		hook(this.elements.noteEditorContent,keyMap["discardNote"],discardCurrentNote);
	};

	this.parseMarkdown = function(md){

		marked.setOptions({
			highlight: function (code) {
				return require('highlight.js').highlightAuto(code).value;
			}
		});

		var result = marked(md);
		return result;
	};

	this.elements.noteList.addEventListener("mousewheel", function(e){

		//Manage scrolling.
		var scrollSpeed = 50, futureMargin, maxMargin;

		var direction = "none";

		if ( e.wheelDelta < 0 ) {
			direction = "down";
		} else {
			direction = "up";
		}

		if( direction === "none" ) {
			return;
		}

		//Get total height.
		var height = notedown.elements.noteList.offsetHeight;
		var winHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

		if ( height < winHeight ) {
			return;
		}

		//Get the offset of the top.
		var offsetTop = notedown.elements.noteList.offsetTop;

		if ( direction === "down" ) {

			//Scroll down
			futureMargin = offsetTop - scrollSpeed;

			//Figure max negative margin.
			maxMargin = (height - winHeight) * -1;

			if ( futureMargin < maxMargin ) {
				futureMargin = maxMargin;
			}

		} else if ( direction === "up" ) {

			//Scroll up
			futureMargin = offsetTop + scrollSpeed;

			//Figure max negative margin.
			maxMargin = 0;

			if ( futureMargin > maxMargin ) {
				futureMargin = maxMargin;
			}

		}

		//Move the bar.
		notedown.elements.noteList.style.marginTop = futureMargin + "px";

	});

	this.elements.noteViewClose.onclick = function(e) {

		//Just deactivate the view.
		notedown.deactivateNote();
		notedown.loseFocusOnNotes();

	};

	this.elements.noteEditorSave.onclick = function(e) {
		e.preventDefault();

		//Get all values.
		var title = notedown.elements.noteEditorTitle.value;
		var content = notedown.elements.noteEditorContent.value;
		var color = notedown.elements.noteEditorColor.value;

		//If there's content, but no title, default to untitled.
		if ( title === "" && content !== "" ) {
			title = "Untitled";
		}

		if ( title !== "" ) {

			//Can save.
			if ( activeNoteId === -1 ) {

				//Create new object in array.
				var noteId = notedown.addNotes({
					title: title,
					content: content,
					updated: getTimestamp(),
					color: color
				});

				//Insert into sidebar.
				notedown.addNoteToSidebar( notes[noteId] );

				notedown.activateNote( notes[noteId] );
				notedown.switchActiveTabs( this, notes[noteId] );

			} else {

				//Save into existing object.
				notes[activeNoteId].title = title;
				notes[activeNoteId].content = content;
				notes[activeNoteId].color = color;
				notes[activeNoteId].updated = getTimestamp();

				notedown.activateNote( notes[activeNoteId] );
				notedown.switchActiveTabs( this, notes[activeNoteId] );

			}

			//Save to disk.
			notedown.writeCacheToDisk();

			//Once everything is saved, reload entire sidebar.
			notedown.sidebarEmpty();

			//Refill sidebar.
			notedown.fillSidebar();


		} else {
			//Nothing to save. Just exit.

		}


		notedown.elements.noteEditor.className = "note-edit inactive";

	};

	this.elements.noteCurrentEdit.onclick = function(e) {
		e.preventDefault();

		notedown.launchEditor( activeNoteId );
	};

	this.elements.noteEditorClose.onclick = function(e) {
		e.preventDefault();

		//Close the editor.
		//No need to save / add.
		notedown.elements.noteEditor.className = "note-edit inactive";
	};

	this.elements.noteAddNew.onclick = function(e) {
		e.preventDefault();

		//Deactivate current view.
		notedown.deactivateNote();
		notedown.loseFocusOnNotes();
		notedown.launchEditor(-1);
	};

	this.launchEditor = function( noteID ){

		if ( noteID === -1 ) {
			//New editor. clear all the fields.
			notedown.elements.noteEditorTitle.value = '';
			notedown.elements.noteEditorContent.value = '';
			notedown.elements.noteEditorColor.value = 'blue';
		} else {
			notedown.elements.noteEditorTitle.value = notes[noteID].title;
			notedown.elements.noteEditorContent.value = notes[noteID].content;
			notedown.elements.noteEditorColor.value = notes[noteID].color;
		}

		notedown.syncColors();

		//Fade in editor.
		notedown.elements.noteEditor.className = "note-edit edit-fadeIn";
		setTimeout(function(){
			notedown.elements.noteEditorTitle.focus();
		},310);

	};

	this.syncColors = function() {

		var color =  notedown.elements.noteEditorColor.value;

		//Loop through and remove active border class.
		for (var i = 0; i < this.elements.aEls.length; i++) {
			this.elements.aEls[i].className = this.elements.aEls[i].className.replace(" block-selected","");

			//Get color of block.
			var colorNew = this.elements.aEls[i].getAttribute('data-color');

			if ( color === colorNew ) {
				this.elements.aEls[i].className = this.elements.aEls[i].className + " block-selected";
			}

		}

	};

	this.addNoteToSidebar = function( note ) {

		//Create a dom object.
		var noteElement = document.createElement("div");
		noteElement.className = "note-block note-" + note.color;
		var noteHeader = document.createElement("header");
		var noteDelete = document.createElement("span");
		noteDelete.className = "close";
		noteDelete.innerHTML = "x";
		var noteTitle = document.createElement("h2");
		var theTitle = note.title;
		if ( theTitle.length > 20 ) {
			theTitle = theTitle.substr(0,18) + "...";
		}
		noteTitle.innerHTML = theTitle;

		var noteMeta = document.createElement("p");
		noteMeta.className = "meta";
		noteMeta.innerHTML = notedown.getTimeDiffClean( note.updated, getTimestamp() ) + " ago";

		//Append children.
		noteHeader.appendChild(noteDelete);
		noteElement.appendChild(noteHeader);
		noteElement.appendChild(noteTitle);
		noteElement.appendChild(noteMeta);

		//Do hooks.
		noteDelete.onclick = function(e) {
			e.preventDefault();
			e.stopPropagation();
			notedown.deleteNote( note, noteElement );
		};

		noteElement.onclick = function(e) {
			e.preventDefault();
			if ( activeNoteId !== note.id ) {
				notedown.activateNote( note );
				notedown.switchActiveTabs( this, note );
			}
		};


		//Update time every minute.
		setInterval(function(){
			notedown.updateNoteTime( note, noteMeta );
		}, 1000 * 1);

		//Add to list.
		this.elements.noteList.insertBefore( noteElement, this.elements.noteAddNew );

		noteElement.id = nodes.length;

		//Push to array.
		nodes.push( noteElement );

	};

	this.switchActiveTabs = function( tab, note ) {

		notedown.loseFocusOnNotes();

		//Activate this tab.
		tab.className = tab.className + " note-active note-active-" + note.color;

	};

	this.loseFocusOnNotes = function() {
		var currentMatches = document.querySelectorAll(".note-active");
		for ( i=0; i<currentMatches.length; i++ ) {

			//Remove the active class.
			removeClass(currentMatches[i],"note-active");

		}
	};

	this.deleteNote = function( note, noteElement ) {

		//Do fancy effects.
		noteElement.className = "note-block note-" + note.color + " note-delete";

		setTimeout(function(){
			//Remove from list.
			var dataID = noteElement.id;
			noteElement.parentNode.removeChild(noteElement);

			//Remove from nodes array.
			nodes.splice( dataID, 1 );

		}, 500);

		var arrFind = 0;

		//Remove from array.
		for ( i=0; i<notes.length; i++ ) {
			if ( notes[i].id === note.id ) {
				notes.splice( i, 1 );
				arrFind = i;
			}
		}

		for( i=0; i<notes.length; i++ ) {
			notes[i].id = i;
		}

		notedown.deactivateNote();
		notedown.loseFocusOnNotes();
		notedown.writeCacheToDisk();

	};

	this.updateNoteTime = function( note, noteMeta ) {

		//Check current unix time stamp vs note.updated timestamp.
		var string = notedown.getTimeDiffClean( note.updated, getTimestamp() );
		noteMeta.innerHTML = string + " ago";

	};

	this.activateNote = function ( note ) {

		//Fade away old notes.
		this.elements.noteView.className = "note-current-view fadeOut";

		//Set flag.
		activeNoteId = note.id;

		//The date.
		var date = new Date(note.updated);
		var theDate = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();


		var eleHTML = '<h1 class="title">' + note.title + '</h1>';
		eleHTML = eleHTML + '<p class="meta">' + theDate + '</p>';
		eleHTML = eleHTML + this.parseMarkdown(note.content);

		setTimeout(function(){
			notedown.elements.noteViewClose.className = "close active";
			notedown.elements.noteView.innerHTML = eleHTML;
			notedown.elements.noteView.className = "note-current-view fadeIn note-" + note.color;

			//Hook links.
			notedown.hookExternalLinks();

			setTimeout(function(){
				notedown.elements.noteView.className = "note-current-view note-" + note.color;
			},350);
		}, 350);

	};

	this.deactivateNote = function() {

		//Fade away old notes.
		this.elements.noteView.className = "note-current-view fadeOut";
		notedown.elements.noteViewClose.className = "close deactive";
		activeNoteId = -1;

		setTimeout(function(){
			notedown.elements.noteView.innerHTML = '<p class="meta">Click on a note to open it.</p>';
			notedown.elements.noteView.className = "note-current-view fadeIn";
			setTimeout(function(){
				notedown.elements.noteView.className = "note-current-view";
			},350);
		}, 350);

	};

	this.addNotes = function( noteObject ) {

		var noteId = notes.length;
		noteObject.id = noteId;
		notes.push( noteObject );

		return noteId;

	};

	this.sidebarEmpty = function() {

		for ( i=0; i<nodes.length; i++ ) {
			if ( nodes[i].parentNode !== null ) {
				nodes[i].parentNode.removeChild(nodes[i]);
			}
		}

		//The bar has been emptied. Redeclare the nodes array.
		nodes = [];

	};

	this.fillSidebar = function() {

		if ( notes.length > 0 ) {
			for( i=0; i<notes.length; i++ ) {
				notedown.addNoteToSidebar(notes[i]);
			}
		}

		//Set active note class.
		if ( activeNoteId !== -1 ) {
			nodes[activeNoteId].className = nodes[activeNoteId].className + " note-active note-active-" + notes[activeNoteId].color;
		}

	};

	this.hookExternalLinks = function() {

		var linkEls = document.querySelectorAll('a');

    for (var i = 0, len = linkEls.length; i < len; i++) {
    	notedown.externalLinkCallback(linkEls[i]);
    }

	};

	this.externalLinkCallback = function(element) {

		element.addEventListener('click', function(e) {

			e.preventDefault();
			gui.Shell.openExternal( this.href );

		});

	};

	this.getTimeDiffClean = function( previous,now ) {

		var days, hours, dayString, hourString, minutes, minuteString, secondsString;
		var secsDiff = (now - previous) / 1000;

		if ( secsDiff > 86400 ) {

			//Days
			days = parseInt(secsDiff / 86400, 0);
			hours = parseInt( (secsDiff - (86400 * days)) / 3600, 0);

			dayString = ( days > 1 ? 'days' : 'day' );
			hourString = ( hours > 1 ? 'hours' : 'hour' );

			return days + " " + dayString + ", " + hours + " " + hourString;


		} else if ( secsDiff > 3600 ) {

			//Hours and minutes
			hours = parseInt(secsDiff / 3600,0);
			minutes = parseInt( (secsDiff % 3600) / 60, 0);

			hourString = ( hours > 1 ? 'hours' : 'hour');
			minuteString = ( minutes > 1 ? 'minutes' : 'minute');


			return hours + " " + hourString + ", " + minutes + " " + minuteString;

		} else if ( secsDiff > 60 ) {

			//Minutes
			minutes = parseInt(secsDiff / 60, 0);
			minuteString = ( minutes > 1 ? 'minutes' : 'minute');

			return minutes + " " + minuteString;

		} else {

			//Seconds.

			secsDiff = parseInt(secsDiff,0);
			secondsString = ( secsDiff > 1 ? 'seconds' : 'second' );
			return secsDiff + " " + secondsString;
		}

	};

	this.writeCacheToDisk = function() {

		//Convert the array to a json buffer.
		var dataBuffer = JSON.stringify( notes );

		//Write it to disk.
		fs.writeFile( notedown.opts.filePath, dataBuffer, function(err){
			if (err) {
				alert("There was an error saving your file to " + notedown.opts.filePath );
			}
		} );

	};

	this.readNotesFromDisk = function() {

		var jsonBuffer;

		//Is there a file?
		if ( fs.existsSync( notedown.opts.filePath, function(){} ) ) {

			//Ready the file.
			var buffer = fs.readFileSync( notedown.opts.filePath, "utf8", function(err){});

			//Check for valid json.
			try {
        jsonBuffer = JSON.parse( buffer );
    	} catch (e) {
        jsonBuffer = -1;
    	}

    	if ( jsonBuffer !== -1 ) {
    		//Valid json.
    		notes = jsonBuffer;
    	} else {
    		//Invalid file.
    		alert("Your data file is corrupt. We're going to automatically write over this. If you want to back it up, you should do so before saving any notes. You can find the file here.\n\n" + notedown.opts.filePath );
    	}

		}

	};

	this.init = function() {

		//Shortcuts
		this.addShortcutsHook();

		//Color hooks.
		for (var i = 0; i < this.elements.aEls.length; i++) {
			this.addColorHook(this.elements.aEls[i]);
		}

		//Read the notes saved.
		notedown.readNotesFromDisk();

		//Enable cmd keys on OSX.
		var mb = new gui.Menu({type:"menubar"});
		if ( typeof mb.createMacBuiltin !== "undefined" ) {
			mb.createMacBuiltin("notedown");
			gui.Window.get().menu = mb;
		}

		//Show the window.
		gui.Window.get().show();

		//If there's notes, add them.
		notedown.fillSidebar();
	};

	window.notedown = this;
	notedown.init();

})({filePath: "app/data/data.json"}, window);
