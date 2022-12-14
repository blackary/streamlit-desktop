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


const editorCodeUpdated = (newCode) => {
    console.log(newCode);
    fs.writeFileSync(`${APPS_DIR}/${selectedApp}/${DEFAULT_FILENAME}`, newCode);
    fs.writeFileSync(SERVER_FILE_PATH, newCode);
}



const editor = new EditorView({
    doc: DEFAULT_APP_CONTENTS,
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

// Get selected radio button from the app chooser
let selected = document.querySelector('input[name="app"]:checked');
selectedAppChanged(selected.value);

// Loop through all the radio buttons with the name app and add a click event listener
document.querySelectorAll('input[name="app"]').forEach((radio) => {
    radio.addEventListener('click', (event) => {
        selectedAppChanged(event.target.value);
    });
});
// Update to initial state
editorCodeUpdated(editor.state.doc.toString())

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
        contents = DEFAULT_APP_CONTENTS;
    }
    else if (message == "Plot") {
        contents = `import streamlit as st
st.write('# Some charts')

st.line_chart({"a": [1,2,3], "b": [2,5,10]})
        `;
    }
    else if (message == "Complex") {
        contents = `import streamlit as st

st.write('# Some More Streamlit Stuff')

tab1, tab2, tab3 = st.tabs(["These", "Are", "Tabs"])

with tab1:
    st.write("Some stuff")
with tab2:
    st.write("The middle tab!")

with tab3:
    st.write("Another tab???")

num = st.slider("Select number", 1, 10, 3)

st.write(f"{num}^{num}: ", num**num)
`;
    }
    replaceEditorContents(contents);
    editorCodeUpdated(contents);
});