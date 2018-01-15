const {app, BrowserWindow, ipcMain, Tray, Menu} = require('electron')
const path = require('path')
const url = require('url')

var log = "Starting...\n";
var selectProfileIDCallback;

ipcMain.on('get-log', (event, arg) => {
  event.sender.send('log-reply', log)
})

ipcMain.on('trySetup', (event, args) => {
  amapi.setupInstall(args.MRR_API_key, args.MRR_API_secret, args.weekly_budget_btc, args.min_margin, args.RPI_threshold, args.max_difficulty, "Asdfa2rtga56q", function(profiles, selectProfileID){
    if (profiles === undefined){
      // Just startup if the profiles have already been selected.
      selectProfileID();
    } else {
      event.sender.send('step1Complete', profiles);
      selectProfileIDCallback = selectProfileID;
    }
  }, function(error){
    console.error(error);
  })
})

ipcMain.on('finishSetup', (event, id) => {
  selectProfileIDCallback(id);
  event.sender.send("installComplete", true)
})

const amapi = require('autominer-api');

if (amapi && amapi.onEvent){
  amapi.onEvent("log", function(message){
    console.log(message);
    log += message + "\n";
  })
  amapi.onEvent("error", function(message){
    console.log(message);
    log += message + "\n";
  })
}

ipcMain.on('shouldInstall', (event, args) => {
  if (!amapi.doesConfigExist()){
    event.sender.send("installComplete", false)
  } else {
    event.sender.send("installComplete", true)
  }
})

const assetsDirectory = path.join(__dirname, 'assets')

let tray = undefined
let window = undefined

// Don't show the app in the doc
app.dock.hide()

app.on('ready', () => {
  createTray()
  createWindow()
})

// Quit the app when the window is closed
app.on('window-all-closed', () => {
  // app.quit()
})

const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, 'classic-computer.png'))
  // tray.on('right-click', toggleWindow)
  // tray.on('double-click', toggleWindow)
  // tray.on('click', function (event) {
  //   toggleWindow()

  //   // Show devtools when command clicked
  //   if (window.isVisible() && process.defaultApp && event.metaKey) {
  //     // window.openDevTools({mode: 'detach'})
  //   }
  // })

  const contextMenu = Menu.buildFromTemplate([
    {label: 'Show/Hide Window', click: function(){ toggleWindow() }},
    {label: 'Quit', click: function(){ quitting = true; app.quit() }}
  ])
  tray.setContextMenu(contextMenu)
}

const getWindowPosition = () => {
  const windowBounds = window.getBounds()
  const trayBounds = tray.getBounds()

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4)

  return {x: x, y: y}
}

var quitting = false;

const createWindow = () => {

  const screen = require('electron').screen
  const display = screen.getPrimaryDisplay()

  window = new BrowserWindow({
    width: 600,
    height: 425,
    show: true,
    frame: true,
    fullscreenable: false,
    resizable: false,
    transparent: false,
    webPreferences: {
      // Prevents renderer process code from not running when window is
      // hidden
      backgroundThrottling: false
    }
  })
  window.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  //window.toggleDevTools();
  window.openDevTools({mode: 'detach'})

  // Hide the window when it loses focus
  window.on('close', (event) => {
    if (!quitting){
      window.hide()
      event.preventDefault()
    }
  })
}

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide()
  } else {
    showWindow()
  }
}

const showWindow = () => {
  // window.reload();
  // const position = getWindowPosition()
  // window.setPosition(position.x, position.y, false)
  window.show()
  window.focus()
}

ipcMain.on('show-window', () => {
  showWindow()
})

