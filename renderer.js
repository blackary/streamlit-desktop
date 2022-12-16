/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */


const {basicSetup} = require("codemirror")
const {EditorView, keymap} = require("@codemirror/view")
const {EditorState} = require("@codemirror/state")

const {python} = require("@codemirror/lang-python")
const {indentWithTab} = require("@codemirror/commands")
const fs = require('fs');

const { APPS_DIR, DEFAULT_APP, DEFAULT_FILENAME, SERVER_FILE_PATH, DEFAULT_APP_CONTENTS } = require('./consts');
const { join } = require("path")


const editorCodeUpdated = (newCode) => {
    console.log("UPDATED");
    console.log(newCode);
    fs.writeFileSync(`${APPS_DIR}/${selectedApp}/${DEFAULT_FILENAME}`, newCode);
    fs.writeFileSync(SERVER_FILE_PATH, newCode);
}



const editor = new EditorView({
    //doc: DEFAULT_APP_CONTENTS,
    extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        python(),
        EditorView.updateListener.of((viewUpdate) => {
          if (viewUpdate.docChanged) {
              const doc = viewUpdate.state.doc;
              const value = doc.toString();
              editorCodeUpdated(value);
          }
      }),
    ],
    parent: document.getElementById('editor'),
  });


  const replaceEditorContents = (newContents) => {
      editor.dispatch({
          changes: {
              from: 0,
              to: editor.state.doc.length,
              insert: newContents
          }
      })
  }


let selectedApp = DEFAULT_APP;

const selectedAppChanged = (new_app) => {
    if (new_app === "") {
        return;
    }
    if (new_app === '<Add new app>') {

        if (new_app_name === null) {
            return;
        }
        new_app = new_app_name;
    }
    console.log(new_app);
    selectedApp = new_app;
    // Create the directory and default file if it doesn't exist
    if (!fs.existsSync(`${APPS_DIR}/${selectedApp}`)) {
        fs.mkdirSync(`${APPS_DIR}/${selectedApp}`, { recursive: true });
        let contents = DEFAULT_APP_CONTENTS + `\n"## This is ${selectedApp}"`;
        fs.writeFileSync(`${APPS_DIR}/${selectedApp}/${DEFAULT_FILENAME}`, contents);
    }
    // Read the file from the app directory
    let app_file = fs.readFileSync(`${APPS_DIR}/${selectedApp}/${DEFAULT_FILENAME}`, 'utf8');
    replaceEditorContents(app_file);
}

// Get selected app from the selectbox
let selected = document.querySelector('select[name="app"]');
selectedAppChanged(selected.value);

document.querySelector('select[name="app"]').onchange = (event) => {
    selectedAppChanged(event.target.value);
};

// Update to initial state
let contents = editor.state.doc.toString();
if (contents) {
    editorCodeUpdated(contents);
}

require('electron').ipcRenderer.on('serverLog', (event, message) => {
    // Send logs to the #logs div
    const logDiv = document.getElementById('logs');
    logDiv.value += message;
})

require('electron').ipcRenderer.on('processLog', (event, message) => {
    // Send logs to the #logs div
    const logDiv = document.getElementById('logs');
    logDiv.value += message;
})

require('electron').ipcRenderer.on('menuItemClick', (event, message) => {
    let contents = "";
    if (message == "Basic") {
        file_path = join(__dirname, 'templates/basic.py')
    }
    else if (message == "Plot") {
        file_path = join(__dirname, 'templates/plot.py')
    }
    else if (message == "Complex") {
        file_path = join(__dirname, 'templates/plot.py')
    }
    else if (message == "Snowpark") {
        file_path = join(__dirname, 'templates/snowpark.py')
    }
    else {
        return;
    }
    contents = fs.readFileSync(file_path, 'utf8', (err, data) => {
        if (err) {
            return `st.error("Import Failed for ${file_path}")`;
        }
    });
    replaceEditorContents(contents);
})

var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    if (content.style.display === "block") {
      content.style.display = "none";
    } else {
      content.style.display = "block";
    }
  });
}