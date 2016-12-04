// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
console.log("I AM THE RENDERER!!!")

const menu = require('./menu.js')

const {ipcRenderer} = require('electron')
const scannerModule = require('./scanner')
const {dialog} = require('electron').remote

menu.setMenu()

scannerModule.init(document,new Image())

ipcRenderer.on('importWorksheets', (event, arg) => {
  dialog.showOpenDialog({title:"Import Worksheets", properties: ['openFile', 'multiSelections'], filters:[{name: 'images', extensions: ['jpg', 'jpeg', 'png', 'gif']}]}, (filenames)=>{
    if (filenames) {
      scannerModule.importImages(filenames)
    }
  })
})