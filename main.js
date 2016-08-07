/* TODO:

Ignore blank lines in the outline
parse images intellegently
Parse times intelligently
Merge together descriptions



*/


const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const {ipcMain} = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1300, height: 1000})

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
//global.sharedObj = {prop1: null};

const fs = require('fs')

let outlineData = []

function loadOutline() {
  outlineData = []
  fs.readFile(`./outline.txt`, 'utf-8', (err,data)=>{
    var lines = data.split(/\r?\n/)
    var node = 0
    var nodeCounter = 0
    var sceneCount = 0

    for (var i = 0; i < lines.length; i++) {
      if (lines[i].substr(0,1) == '#' ) {
        if (node !== 0) { outlineData.push(node) }
        node = {type:'section', text: lines[i].substr(1).trim()}
        nodeCounter = 0
      } else if (lines[i].trim().substr(0,2) == '//') {
        // comment do nothing
      } else if (lines[i].substr(0,2) == '  ' ) {
        let lineContent = lines[i].substr(2).trim()
        // first is there anything there? (no blank)
        if (lineContent !== ''){
          // is it a single word number?
          if (!isNaN(+lineContent)) {
            node.timing = +lineContent
          } else if (lineContent.match(/\.(jpeg|jpg|gif|png)$/) != null) {
            // is it an image?
            node.image.push(lineContent)
          } else if (lineContent.match(/^(EXT. |INT. )/) != null) {
            // is it an image?
            node.slugline = lineContent
          } else {
            // else add it to a description string
            if (node.description) {
              node.description += "\n" + lineContent
            } else {
              node.description = lineContent
            }
          }

        }



        // nodeCounter++
        // switch(nodeCounter) {
        //   case 1:
        //     node.description = lines[i].substr(2)
        //     break;
        //   case 2:
        //     node.timing = lines[i].substr(2)
        //     break;
        //   case 3:
        //     node.image = [lines[i].substr(2)]
        //     break;
        //   case 4:
        //     node.image.push(lines[i].substr(2))
        //     break;
        //   case 5:
        //     node.image.push(lines[i].substr(2))
        //     break;
        // }
      } else {
        if (lines[i].trim() !== '') {
          nodeCounter = 0
          sceneCount++
          if (node !== 0) { outlineData.push(node) }
          node = {type:'scene', text: lines[i], image: []}
        }
      }
    }
    
    if (node !== 0) { outlineData.push(node) }

    global.sharedObj = {outlineData: outlineData, sceneCount: sceneCount};

  })
}

loadOutline()

fs.watchFile(`./outline.txt`, (curr, prev) => {
  console.log(`the current mtime is: ${curr.mtime}`);
  loadOutline()
  console.log(`the previous mtime was: ${prev.mtime}`);
  mainWindow.webContents.send('reload','sup')
});

ipcMain.on('hi', (event, arg) => {
  console.log(arg);  // prints "ping"
});
