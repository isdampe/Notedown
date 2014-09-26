//Notedown.js
//For local storage of notes.

//Load the filesystem library.
var fs = require('fs');
var marked = require('marked');
var gui = require('nw.gui');

//JSON structure.
var notes = [];
var nodes = [];

//The main noteDown object.
//This controls almost everything.
function noteDown( opts ) {

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

  for (var i = 0; i < this.elements.aEls.length; i++) {
		this.elements.aEls[i].addEventListener('click', function(e) {
			e.preventDefault();
			
			var color = this.getAttribute('data-color');
			notedown.elements.noteEditorColor.value = color;

			notedown.syncColors();

		});
	}

	this.elements.noteViewClose.onclick = function(e) {

		//Just deactivate the view.
		notedown.deactivateNote();
		notedown.loseFocusOnNotes();

	}

	this.elements.noteEditorSave.onclick = function(e) {
		e.preventDefault();

		//Get all values.
		var title = notedown.elements.noteEditorTitle.value;
		var content = notedown.elements.noteEditorContent.value;
		var color = notedown.elements.noteEditorColor.value;

		if ( title !== "" ) {

			//Can save.
			if ( activeNoteId === -1 ) {

				//Create new object in array.
				var noteId = notedown.addNotes({
					title: title,
					content: content,
					updated: 1411374670,
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

	}

	this.elements.noteCurrentEdit.onclick = function(e) {
		e.preventDefault();

		notedown.launchEditor( activeNoteId );
	}

	this.elements.noteEditorClose.onclick = function(e) {
		e.preventDefault();

		//Close the editor.
		//No need to save / add.
		notedown.elements.noteEditor.className = "note-edit inactive";
	}

	this.elements.noteAddNew.onclick = function(e) {
		e.preventDefault();

		//Deactivate current view.
		notedown.deactivateNote();
		notedown.loseFocusOnNotes();
		notedown.launchEditor(-1);

	}

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
	}

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

	}


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
		noteMeta.innerHTML = note.updated;

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
		}

		noteElement.onclick = function(e) {
			e.preventDefault();
			if ( activeNoteId !== note.id ) {
				notedown.activateNote( note );
				notedown.switchActiveTabs( this, note );
			}
		}


		//Update time every minute.
		setInterval(function(){
			notedown.updateNoteTime( note, noteMeta );
		}, 1000 * 60);

		//Add to list.
		this.elements.noteList.insertBefore( noteElement, this.elements.noteAddNew );

		noteElement.id = nodes.length;

		//Push to array.
		nodes.push( noteElement );

	}

	this.switchActiveTabs = function( tab, note ) {

		notedown.loseFocusOnNotes();

		//Activate this tab.
		tab.className = tab.className + " note-active note-active-" + note.color;

	}

	this.loseFocusOnNotes = function() {
		var currentMatches = document.querySelectorAll(".note-active");
		for ( i=0; i<currentMatches.length; i++ ) {

			//Remove the active class.
			removeClass(currentMatches[i],"note-active");

		}
	}

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

	}

	this.updateNoteTime = function( note, noteMeta ) {

		//Check current unix time stamp vs note.updated timestamp.

	}

	this.activateNote = function ( note ) {

		//Fade away old notes.
		this.elements.noteView.className = "note-current-view fadeOut";

		//Set flag.
		activeNoteId = note.id;

		var eleHTML = '<h1 class="title">' + note.title + '</h1>';
		eleHTML = eleHTML + '<p class="meta">' + note.updated + '</p>';
		eleHTML = eleHTML + marked( note.content );

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

	}

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

	}

	this.addNotes = function( noteObject ) {

		var noteId = notes.length;
		noteObject.id = noteId;
		notes.push( noteObject );

		return noteId;

	}

	this.sidebarEmpty = function() {

		for ( i=0; i<nodes.length; i++ ) {
			if ( nodes[i].parentNode !== null ) {
				nodes[i].parentNode.removeChild(nodes[i]);
			}
		}

		//The bar has been emptied. Redeclare the nodes array.
		nodes = [];

	}

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

	}

	this.hookExternalLinks = function() {

		var linkEls = document.querySelectorAll('a');

    for (var i = 0, len = linkEls.length; i < len; i++) {
      var linkelement = linkEls[i];
    	linkelement.addEventListener('click', function(e) {
    		
    		e.preventDefault();
				gui.Shell.openExternal( this.href );

      });
    }

	}

	this.writeCacheToDisk = function() {

		//Convert the array to a json buffer.
		var dataBuffer = JSON.stringify( notes );

		//Write it to disk.
		fs.writeFile( notedown.opts.filePath, dataBuffer, function(err){
			if (err) {
				alert("There was an error saving your file to " + notedown.opts.filePath );
			}
		} );
		
	}

	this.readNotesFromDisk = function() {

		//Is there a file?
		if ( fs.existsSync( notedown.opts.filePath, function(){} ) ) {

			//Ready the file.
			var buffer = fs.readFileSync( notedown.opts.filePath, "utf8", function(err){});
			
			//Check for valid json.
			try {
        var json = JSON.parse( buffer );
    	} catch (e) {
        var json = -1;
    	}

    	if ( json !== -1 ) {
    		//Valid json.
    		notes = json;
    	} else {
    		//Invalid file.
    		alert("Your data file is corrupt. We're going to automatically right over this. If you want to back it up, you should do so before saving any notes. You can find the file here.\n\n" + notedown.opts.filePath );
    	}

		}

	}

}

//Create notedown object.
var notedown = new noteDown({
	filePath: "app/data/data.json"
});

//Read the notes saved.
notedown.readNotesFromDisk();

//Show the window.
gui.Window.get().show();

//If there's notes, add them.
notedown.fillSidebar();