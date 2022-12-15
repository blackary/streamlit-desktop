/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */

const DEFAULT_APPS = [
  "my_first_streamlit",
  "my_second_streamlit",
  "my_third_streamlit"
]

const fs = require('fs');
const {APPS_DIR} = require('./consts');

const getApps = () => {
  try {
    return fs.readdirSync(APPS_DIR);
  } catch(e) {
    return [];
  }
}

window.addEventListener('DOMContentLoaded', () => {
  let apps = getApps();
  if (apps.length === 0) {
    apps = DEFAULT_APPS
    DEFAULT_APPS.forEach(app => {
      fs.mkdirSync(`${APPS_DIR}/${app}`, { recursive: true });
      let contents = DEFAULT_APP_CONTENTS + `\n"## This is ${app}"`;
      fs.writeFileSync(`${APPS_DIR}/${app}/streamlit_app.py`, contents);
    });
  }
  const appSelector = document.getElementById("app-selector")

  apps.forEach(app => {
    let option = document.createElement("option");
    option.value = app
    option.label = app
    appSelector.appendChild(option);
  });

  let addNew = document.createElement("option");
  addNew.value = "add_new"
  addNew.label = "(Coming soon) Add new app"
  addNew.disabled = true;

  appSelector.appendChild(addNew);

  appSelector.value = apps[0];

  appSelector.dispatchEvent(new Event('change'));
})