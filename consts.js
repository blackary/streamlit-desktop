// Export various constants used by other parts of the app
const path = require('path')

module.exports = {
  APPS_DIR: path.join(process.env.HOME, '.streamlit-desktop/apps'),
  DEFAULT_APP: "my_first_streamlit",
  DEFAULT_FILENAME: "streamlit_app.py",
  SERVER_FILE_PATH: path.join(process.env.HOME, '.streamlit-desktop/default_app/synced.py'),
  DEFAULT_APP_CONTENTS: `import streamlit as st
st.write("# Hello world!")`,
}