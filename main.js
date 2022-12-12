// Modules to control application life and create native browser window
const {app, BrowserWindow, BrowserView, Menu} = require('electron')
const path = require('path')

const isMac = process.platform === 'darwin'

const menuClick = (menuItem, browserWindow, event) => {
  browserWindow.getBrowserViews()[0].webContents.send("menuItemClick", menuItem.label)
}
const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  {
    label: 'Load example',
    submenu: [
      {
        label: 'Basic',
        click: menuClick,
      },
      {
        label: 'Plot',
        click: menuClick,
      },
      {
        label: "Complex",
        click: menuClick,
      }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://electronjs.org')
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

const TOP = 30;
const TOTAL_WIDTH = 2000;
const TOTAL_HEIGHT = 1000;
const LEFT_WIDTH = 1200;
const RIGHT_WIDTH = TOTAL_WIDTH - LEFT_WIDTH;

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: TOTAL_WIDTH,
    height: TOTAL_HEIGHT,
    title: "Streamlit Desktop",
  });

  const leftView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration:  true, // SHOULD FIGURE OUT HOW TO REMOVE THESE SECURITY HOLES EVENTUALLY
      contextIsolation: false
    }
  })

  mainWindow.addBrowserView(leftView)

  leftView.setBounds({ x: 0, y: TOP, width: LEFT_WIDTH, height: TOTAL_HEIGHT - TOP })

  leftView.webContents.loadFile('index.html')

  const rightView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration:  true, // SHOULD FIGURE OUT HOW TO REMOVE THESE SECURITY HOLES EVENTUALLY
      contextIsolation: false
    }
  })

  mainWindow.addBrowserView(rightView)

  rightView.setBounds({ x: LEFT_WIDTH, y: TOP, width: RIGHT_WIDTH, height: TOTAL_HEIGHT - TOP })
  rightView.webContents.loadURL('http://localhost:8509')


  /*

  const streamlitWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    webPreferences: {
    }
  })

  streamlitWindow.loadURL("http://localhost:8509");*/

  // and load the index.html of the app.
  //mainWindow.loadFile('index.html')


  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
  //win.removeBrowserView(secondView)
  //win.removeBrowserView(view)
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

class DatasetteServer {
  constructor(app, port) {
    this.app = app;
    this.port = port;
    this.process = null;
    this.apiToken = crypto.randomBytes(32).toString("hex");
    this.logEmitter = new EventEmitter();
    this.cappedServerLog = [];
    this.cappedProcessLog = [];
    this.accessControl = "localhost";
    this.cap = 1000;
  }
  on(event, listener) {
    this.logEmitter.on(event, listener);
  }
  async openFile(filepath) {
    const first16 = await firstBytes(filepath, 16);
    let endpoint;
    let errorMessage;
    if (first16.equals(SQLITE_HEADER)) {
      endpoint = "/-/open-database-file";
      errorMessage = "Error opening database file";
    } else {
      endpoint = "/-/open-csv-file";
      errorMessage = "Error opening CSV file";
    }
    const response = await this.apiRequest(endpoint, {
      path: filepath,
    });
    const responseJson = await response.json();
    if (!responseJson.ok) {
      console.log(responseJson);
      dialog.showMessageBox({
        type: "error",
        message: errorMessage,
        detail: responseJson.error,
      });
    } else {
      setTimeout(() => {
        this.openPath(responseJson.path);
      });
    }
  }
  async about() {
    const response = await request(
      `http://localhost:${this.port}/-/versions.json`
    );
    const data = await response.json();
    return [
      "An open source multi-tool for exploring and publishing data",
      "",
      `Python: ${data.python.version}`,
    ].join("\n");
  }
  async setAccessControl(accessControl) {
    if (accessControl == this.accessControl) {
      return;
    }
    this.accessControl = accessControl;
    await this.startOrRestart();
  }
  serverLog(message, type) {
    if (!message) {
      return;
    }
    type ||= "stdout";
    const item = {
      message: message.replace("INFO:     ", ""),
      type,
      ts: new Date(),
    };
    this.cappedServerLog.push(item);
    this.logEmitter.emit("serverLog", item);
    this.cappedServerLog = this.cappedServerLog.slice(-this.cap);
  }
  processLog(item) {
    this.cappedProcessLog.push(item);
    this.logEmitter.emit("processLog", item);
    this.cappedProcessLog = this.cappedProcessLog.slice(-this.cap);
  }
  serverArgs() {
    const args = [
      "--port",
      this.port,
      "--version-note",
      "xyz-for-datasette-app",
      "--setting",
      "sql_time_limit_ms",
      "10000",
      "--setting",
      "max_returned_rows",
      "2000",
      "--setting",
      "facet_time_limit_ms",
      "3000",
      "--setting",
      "max_csv_mb",
      "0",
    ];
    if (this.accessControl == "network") {
      args.push("--host", "0.0.0.0");
    }
    return args;
  }
  serverEnv() {
    return {
      DATASETTE_API_TOKEN: this.apiToken,
      DATASETTE_SECRET: RANDOM_SECRET,
      DATASETTE_DEFAULT_PLUGINS: Object.keys(minPackageVersions).join(" "),
    };
  }
  async startOrRestart() {
    const venv_dir = await this.ensureVenv();
    await this.ensurePackagesInstalled();
    const datasette_bin = path.join(venv_dir, "bin", "datasette");
    let backupPath = null;
    if (this.process) {
      // Dump temporary to restore later
      backupPath = path.join(
        app.getPath("temp"),
        `backup-${crypto.randomBytes(8).toString("hex")}.db`
      );
      await this.apiRequest("/-/dump-temporary-to-file", { path: backupPath });
      this.process.kill();
    }
    return new Promise((resolve, reject) => {
      let process;
      try {
        process = cp.spawn(datasette_bin, this.serverArgs(), {
          env: this.serverEnv(),
        });
      } catch (e) {
        reject(e);
      }
      this.process = process;
      process.stderr.on("data", async (data) => {
        if (/Uvicorn running/.test(data)) {
          serverHasStarted = true;
          if (backupPath) {
            await this.apiRequest("/-/restore-temporary-from-file", {
              path: backupPath,
            });
            await unlink(backupPath);
          }
          resolve(`http://localhost:${this.port}/`);
        }
        for (const line of data.toString().split("\n")) {
          this.serverLog(line, "stderr");
        }
      });
      process.stdout.on("data", (data) => {
        for (const line of data.toString().split("\n")) {
          this.serverLog(line);
        }
      });
      process.on("error", (err) => {
        console.error("Failed to start datasette", err);
        this.app.quit();
        reject();
      });
    });
  }

  shutdown() {
    this.process.kill();
  }

  async apiRequest(path, body) {
    return await request(`http://localhost:${this.port}${path}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
      },
    });
  }

  async execCommand(command, args) {
    return new Promise((resolve, reject) => {
      // Use spawn() not execFile() so we can tail stdout/stderr
      console.log(command, args);
      // I tried process.hrtime() here but consistently got a
      // "Cannot access 'process' before initialization" error
      const start = new Date().valueOf(); // millisecond timestamp
      const process = cp.spawn(command, args);
      const collectedErr = [];
      this.processLog({
        type: "start",
        command,
        args,
      });
      process.stderr.on("data", async (data) => {
        for (const line of data.toString().split("\n")) {
          this.processLog({
            type: "stderr",
            command,
            args,
            stderr: line.trim(),
          });
          collectedErr.push(line.trim());
        }
      });
      process.stdout.on("data", (data) => {
        for (const line of data.toString().split("\n")) {
          this.processLog({
            type: "stdout",
            command,
            args,
            stdout: line.trim(),
          });
        }
      });
      process.on("error", (err) => {
        this.processLog({
          type: "error",
          command,
          args,
          error: err.toString(),
        });
        reject(err);
      });
      process.on("exit", (err) => {
        let duration_ms = new Date().valueOf() - start;
        this.processLog({
          type: "end",
          command,
          args,
          duration: duration_ms,
        });
        if (process.exitCode == 0) {
          resolve(process);
        } else {
          reject(collectedErr.join("\n"));
        }
      });
    });
  }

  async installPlugin(plugin) {
    const pip_binary = path.join(
      process.env.HOME,
      ".streamlit-desktop",
      "venv",
      "bin",
      "pip"
    );
    await this.execCommand(pip_binary, [
      "install",
      plugin,
      "--disable-pip-version-check",
    ]);
  }

  async uninstallPlugin(plugin) {
    const pip_binary = path.join(
      process.env.HOME,
      ".streamlit-desktop",
      "venv",
      "bin",
      "pip"
    );
    await this.execCommand(pip_binary, [
      "uninstall",
      plugin,
      "--disable-pip-version-check",
      "-y",
    ]);
  }

  async packageVersions() {
    const venv_dir = await this.ensureVenv();
    const pip_path = path.join(venv_dir, "bin", "pip");
    const versionsProcess = await execFile(pip_path, [
      "list",
      "--format",
      "json",
    ]);
    const versions = {};
    for (const item of JSON.parse(versionsProcess.stdout)) {
      versions[item.name] = item.version;
    }
    return versions;
  }

  async ensureVenv() {
    const stdesktop_app_dir = path.join(process.env.HOME, ".streamlt-desktop");
    const venv_dir = path.join(stdesktop_app_dir, "venv");
    if (!fs.existsSync(stdesktop_app_dir)) {
      await mkdir(stdesktop_app_dir);
    }
    let shouldCreateVenv = true;
    if (fs.existsSync(venv_dir)) {
      // Check Python interpreter still works, using
      // ~/.streamlit-desktop/venv/bin/python3.8 --version
      const venv_python = path.join(venv_dir, "bin", "python3.8");
      try {
        await this.execCommand(venv_python, ["--version"]);
        shouldCreateVenv = false;
      } catch (e) {
        fs.rmdirSync(venv_dir, { recursive: true });
      }
    }
    if (shouldCreateVenv) {
      await this.execCommand(findPython(), ["-m", "venv", venv_dir]);
    }
    return venv_dir;
  }

  async ensurePackagesInstalled() {
    const venv_dir = await this.ensureVenv();
    // Anything need installing or upgrading?
    const needsInstall = [];
    for (const [name, requiredVersion] of Object.entries(minPackageVersions)) {
      needsInstall.push(`${name}>=${requiredVersion}`);
    }
    const pip_path = path.join(venv_dir, "bin", "pip");
    try {
      await this.execCommand(
        pip_path,
        ["install"].concat(needsInstall).concat(["--disable-pip-version-check"])
      );
    } catch (e) {
      dialog.showMessageBox({
        type: "error",
        message: "Error running pip",
        detail: e.toString(),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  openPath(path, opts) {
    path = path || "/";
    opts = opts || {};
    const loadUrlOpts = {
      extraHeaders: `authorization: Bearer ${this.apiToken}`,
      method: "POST",
      postData: [
        {
          type: "rawData",
          bytes: Buffer.from(JSON.stringify({ redirect: path })),
        },
      ],
    };
    if (
      BrowserWindow.getAllWindows().length == 1 &&
      (opts.forceMainWindow ||
        new URL(BrowserWindow.getAllWindows()[0].webContents.getURL())
          .pathname == "/")
    ) {
      // Re-use the single existing window
      BrowserWindow.getAllWindows()[0].webContents.loadURL(
        `http://localhost:${this.port}/-/auth-app-user`,
        loadUrlOpts
      );
    } else {
      // Open a new window
      let newWindow = new BrowserWindow({
        ...windowOpts(),
        ...{ show: false },
      });
      newWindow.loadURL(
        `http://localhost:${this.port}/-/auth-app-user`,
        loadUrlOpts
      );
      newWindow.once("ready-to-show", () => {
        newWindow.show();
      });
      configureWindow(newWindow);
    }
  }
}