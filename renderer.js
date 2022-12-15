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
        contents = `import streamlit as st
import pandas as pd
import numpy as np
st.write('# Oh yeah, tabulate')

tab1, tab2, tab3 = st.tabs(["T1", "T2 (rules)", "T3"])

with tab1:
    st.write("Some stuff")
    st.write("# This is a pretty good TAB")
with tab2:
    st.write("The middle tab!")
    st.write("# This one is THE BEST")
with tab3:
    st.write("Another tab???")
    st.write("# You better believe it")

num = st.slider("Select number", 1, 10, 3)

df = pd.DataFrame(
    np.random.randn(num, 2) / [50, 50] + [37.76, -122.4],
    columns=['lat', 'lon'])

st.map(df)
`
    }
    else if (message == "Plot") {
        contents = `import streamlit as st
import pandas as pd

st.title("Let's see some :bar_chart:")
st.write('Some charts')

df = pd.DataFrame({"a": [1,2,3], "b": [2,5,10]})
st.line_chart(df)
st.write("# :boom: :boom: :boom: :boom: :boom:")
st.bar_chart(df)`
    }
    else if (message == "Complex") {
        contents = `# Import python packages
import streamlit as st
import pandas as pd
import numpy as np

# Write directly to the app
st.title("Example Streamlit-Desktop App :balloon:")

st.write(
    """Replace this example with your own code!
    **And if you're new to Streamlit,** check
    out our easy-to-follow guides at
    [docs.streamlit.io](https://docs.streamlit.io).
    """
)

# Use an interactive slider to get user input
hifives_val = st.slider(
    "Number of votes :hand:",
    min_value=0,
    max_value=90,
    value=60,
    help="Use this to enter the number of high-fives you gave in Q3",
)
sql_data = pd.DataFrame(np.random.randint(10, size=(10,3)) * 10)
sql_data.columns = [f'Votes for {i}' for i in range(1,4)]

# Create a simple bar chart
# See docs.streamlit.io for more types of charts
st.subheader("Number of votes :white_check_mark:")
st.bar_chart(data=sql_data)

st.subheader("Underlying data :bar_chart:")
st.table(sql_data)


`
    }
    else if (message == "Snowpark") {
        contents = fs.readFileSync('templates/snowpark.py', 'utf8', (err, data) => {
            if (err) {
                return `st.write("Import Failed")`;
            }
        });
    }
    editor.setState(EditorState.create({
        doc: contents,
        extensions: [
            basicSetup,
            keymap.of([indentWithTab]),
            python(),
            EditorView.updateListener.of((viewUpdate) => {
                if (viewUpdate.docChanged) {
                    const doc = viewUpdate.state.doc;
                    const value = doc.toString();
                    updated(value);
                }
            }),
        ],
    }))
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