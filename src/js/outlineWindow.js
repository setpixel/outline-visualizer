// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
console.log("I AM THE RENDERER!!!")

const menu = require('./menu.js')

const {ipcRenderer} = require('electron')

menu.setMenu()
//ipcRenderer.send('showWindow')