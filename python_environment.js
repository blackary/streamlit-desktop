// Inspired/copied liberally from datasette-app

const path = require('path')
const fs = require('fs')
const util = require("util")
const mkdir = util.promisify(fs.mkdir)
const cp = require("child_process")
const execFile = util.promisify(cp.execFile)
const EventEmitter = require("events");
const { dialog } = require("electron")
const {BrowserWindow} = require('electron')


const DEBUG = false;

const minPackageVersions = {
  "streamlit": "1.15.2",
  //"streamlit-extras": "0.2.4",
  //"snowflake-snowpark-python": "1.0.0",
}

function findPython(python_version, app) {
  const possibilities = [
    // In packaged app
    path.join(process.resourcesPath, "app", "python", "bin", `python${python_version}`),
    // In development
    path.join(__dirname, "python", "bin", `python${python_version}`),
  ];
  for (const path of possibilities) {
    if (fs.existsSync(path)) {
      if (DEBUG) {
        dialog.showMessageBox({
          type: "info",
          message: "Found python3",
          detail: path,
        });
      }
      return path;
    }
  }
  dialog.showMessageBox({
    type: "error",
    message: "Could not find python3",
    detail: "Could not find python3, checked" + possibilities.join(", "),
  });
  app.quit();
}

class StreamlitServer {
  constructor(app, file, port, environment="default", python_version="3.8") {
      this.app = app;
      this.file = file;
      this.port = port;
      this.process = null;
      this.environment = environment;
      this.python_version = python_version;
      this.logEmitter = new EventEmitter();
      this.cappedServerLog = [];
      this.cappedProcessLog = [];
      this.cap = 1000;
  }
  on(event, listener) {
    this.logEmitter.on(event, listener);
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
    try {
      BrowserWindow.getAllWindows()[0].getBrowserViews()[0].webContents.send("serverLog", JSON.stringify(item));
    } catch (e) {
      // BrowserView not loaded
    }
  }
  processLog(item) {
    this.cappedProcessLog.push(item);
    this.logEmitter.emit("processLog", item);
    this.cappedProcessLog = this.cappedProcessLog.slice(-this.cap);
    try {
      BrowserWindow.getAllWindows()[0].getBrowserViews()[0].webContents.send("processLog", JSON.stringify(item));
    } catch (e) {
      // BrowserView not loaded
    }
    if (DEBUG) {
      dialog.showMessageBox({
        type: "error",
        message: "Running",
        detail: JSON.stringify(item),
      });
    }
  }

  serverArgs() {
    const args = [
      "--server.port",
      this.port,
      "--server.runOnSave",
      "true",
      "--server.headless",
      "true",
    ];
    return args;
  }

  serverEnv() {
    const env = {
      STREAMLIT_SERVER_PORT: this.port,
      PYTHON_VERSION: this.python_version,
      ENVIRONMENT: this.environment,
    };
    return env;
  }

  async startOrRestart() {
    const venv_dir = await this.ensureVenv();
    await this.ensurePackagesInstalled();
    const streamlit_bin = path.join(venv_dir, "bin", "streamlit");
    //this.spawn = spawn
    //this.process = this.spawn(streamlit_bin,["run", this.file].concat(this.serverArgs()));

    return new Promise((resolve, reject) => {
      try {
        kill(this.port, 'tcp')
      } catch (e) {
        // Only kill it if there is another process running on the port
      }
      let process;
      try {
        const kill = require('kill-port')
        process = cp.spawn(streamlit_bin,["run", this.file].concat(this.serverArgs()));
      } catch (e) {
        reject(e);
      }
      this.process = process;
      process.stdout.on("data", (data) => {
        console.log(data.toString())
        if (/view your Streamlit app/.test(data)) {
          resolve('http://localhost:' + this.port)
        }
        for (const line of data.toString().split("\n")) {
          this.serverLog(line);
        }
      });
      process.on("error", (err) => {
        console.error("Failed to start streamlit", err);
        this.app.quit();
        reject();
      });
    });
  }


  shutdown() {
    this.process.kill();
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
    const stdesktop_app_dir = path.join(process.env.HOME, ".streamlit-desktop");
    const venv_dir = path.join(stdesktop_app_dir, "envs", this.environment);
    if (!fs.existsSync(stdesktop_app_dir)) {
      await mkdir(stdesktop_app_dir);
    }
    let shouldCreateVenv = true;
    if (fs.existsSync(venv_dir)) {
      // Check Python interpreter still works, using
      // ~/.streamlit-desktop/envs/{environment}/bin/python3.8 --version
      const venv_python = path.join(venv_dir, "bin", `python${this.python_version}`);
      try {
        await this.execCommand(venv_python, ["--version"]);
        shouldCreateVenv = false;
      } catch (e) {
        fs.rmdirSync(venv_dir, { recursive: true });
      }
    }
    if (shouldCreateVenv) {
      await this.execCommand(findPython(this.python_version, this.app), ["-m", "venv", venv_dir]);
    }
    return venv_dir;
  }

  async ensurePackagesInstalled() {
    // TODO: Should be able to use `pip freeze` to check these things more quickly
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
}

exports.StreamlitServer = StreamlitServer;