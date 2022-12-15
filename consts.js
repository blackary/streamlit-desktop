// Export various constants used by other parts of the app
const path = require('path')

module.exports = {
  APPS_DIR: path.join(process.env.HOME, '.streamlit-desktop/apps'),
  DEFAULT_APP: "my_first_streamlit",
  DEFAULT_FILENAME: "streamlit_app.py",
  SERVER_FILE_PATH: path.join(process.env.HOME, '.streamlit-desktop/default_app/synced.py'),
  DEFAULT_APP_CONTENTS: `import streamlit as st

col1, col2 = st.columns([1,3])
col2.write("# Hello Streamlit!")

col2.write("# :dog:")
col2.write("# :cat:")
col2.write("# :balloon:")
col2.write("# :brain:")
col2.write("# :umbrella:")
col2.write("# :chicken:")
col2.write("# :ring:")

st.snow()

`
}