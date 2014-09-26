//Notedown.js
//For local storage of notes.

//JSON structure.
var notes = [];

notes[0] = {
	title: "Test notes",
	content: "Test notes.\n\n#Heading 1\nTest.",
	updated: 1411374670,
	color: "red",
	id: 0
};

notes[1] = {
	title: "Markdown is sick",
	content: "Test notes.",
	updated: 1411374990,
	color: "blue",
	id: 1
};

//Startup.
//Check for notes config file.
//var noteConfig = getNotes();
//if ( noteConfig ) { populateNotesSidebar(); activateMostRecentNote(); }
function noteDown( na ) {
	
	this.noteArray = na;
	this.elements = {
		noteList: document.getElementById("note-list"),
		noteAddNew: document.getElementById("note-add-new"),
		noteView: document.getElementById("note-current-view"),
		noteEditor: document.getElementById("note-edit"),
		noteEditorTitle: document.getElementById("note-edit-title"),
		noteEditorContent: document.getElementById("note-edit-editor"),
		noteEditorColor: document.getElementById("note-edit-color"),
		noteEditorClose: document.getElementById("editor-close"),
		noteCurrentEdit: document.getElementById("note-current-edit"),
		aEls: document.querySelectorAll("[data-rel=color]")
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
		noteTitle.innerHTML = note.title;
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
			notedown.activateNote( note );
			notedown.switchActiveTabs( this, note );
		}


		//Update time every minute.
		setInterval(function(){
			notedown.updateNoteTime( note, noteMeta );
		}, 1000 * 60);

		//Add to list.
		this.elements.noteList.insertBefore( noteElement, this.elements.noteAddNew );

	}

	this.switchActiveTabs = function( tab, note ) {

		//Is there another tab active?
		var currentMatches = document.querySelectorAll(".note-active");
		for ( i=0; i<currentMatches.length; i++ ) {

			//Remove the active class.
			removeClass(currentMatches[i],"note-active");

		}

		//Activate this tab.
		tab.className = tab.className + " note-active note-active-" + note.color;

	}

	this.deleteNote = function( note, noteElement ) {

		//Do fancy effects.
		noteElement.className = "note-block note-" + note.color + " note-delete";

		setTimeout(function(){
			//Remove from list.
			noteElement.parentNode.removeChild(noteElement);
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

		this.deactivateNote();

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
		eleHTML = eleHTML + note.content; //(Run this through markdown filter.)

		setTimeout(function(){
			notedown.elements.noteView.innerHTML = eleHTML;
			notedown.elements.noteView.className = "note-current-view fadeIn";
			setTimeout(function(){
				notedown.elements.noteView.className = "note-current-view";
			},350);
		}, 350);

	}

	this.deactivateNote = function() {

		//Fade away old notes.
		this.elements.noteView.className = "note-current-view fadeOut";
		activeNoteId = -1;

		setTimeout(function(){
			notedown.elements.noteView.innerHTML = '<p class="meta">Click on a note to open it.</p>';
			notedown.elements.noteView.className = "note-current-view fadeIn";
			setTimeout(function(){
				notedown.elements.noteView.className = "note-current-view";
			},350);
		}, 350);

	}

}

//Create notedown object.
var notedown = new noteDown( notes );

//If there's notes, add them.
if ( notes.length > 0 ) {
	for( i=0; i<notes.length; i++ ) {
		notedown.addNoteToSidebar(notes[i]);
	}
}


function hasClass(ele,cls) {
	return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}
function addClass(ele,cls) {
	if (!this.hasClass(ele,cls)) ele.className += " "+cls;
}
function removeClass(ele,cls) {
	if (hasClass(ele,cls)) {
		var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		ele.className=ele.className.replace(reg,' ');
	}
}