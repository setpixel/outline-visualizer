/* TODO:

add menu for app

make icon for outliner

if cannot open the file, open a file open dialog box

save a pref for when the window is opened.

open dev tools with a flag
  https://github.com/sindresorhus/electron-is-dev

print output

auto update

menu speak

menu print.. select the filename for output
  maybe some settings?

*/

const {app, ipcMain, BrowserWindow} = electron = require('electron')
const {dialog} = require('electron')

const fs = require('fs')

const prefModule = require('./prefs')
const printModule = require('./print')

let mainWindow
let statWatcher 

// load prefs file.
let prefs = prefModule.getPrefs()

function createWindow () {
  if (mainWindow) {
    mainWindow.webContents.send('reload')
  } else {
    mainWindow = new BrowserWindow({width: 1300, height: 1000, show: false})
    mainWindow.loadURL(`file://${__dirname}/../index.html`)
  }

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    prefModule.savePrefs(prefs)
    mainWindow = null
  })

  mainWindow.once('ready-to-show', () => {
    setTimeout(()=>{mainWindow.show()}, 500)
  })

}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', loadOutline)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  //if (process.platform !== 'darwin') {
    app.quit()
  //}
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


let outlineData = []

function openOutline() {
  dialog.showOpenDialog({title:"Open Outline", filters:[{name: 'Outline', extensions: ['outline', 'txt']}]}, (filenames)=>{
    if (filenames) {
      console.log('Opening: ' + filenames[0])
      prefs.outlineFile = filenames[0]
      loadOutline(true)
    }
  })
}

function loadOutline(create) {
  // if (statWatcher) {
  //   statWatcher.stop()
  //   statWatcher = null
  //   console.log(statWatcher)
  // }

  outlineData = []
  fs.readFile(prefs.outlineFile, 'utf-8', (err,data)=>{
    
    if (err) {
      console.log("ERROR: Can't open file.")
      openOutline()
      return
    }

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
          } else if (lineContent.split(' ')[0].match(/\.(jpeg|jpg|gif|png)$/) != null) {
            // is it an image?
            if (lineContent.split(' ').length > 1) {
              // poster image
              node.posterImage = lineContent.split(' ')[0]
            } else {
              // regular image
              node.image.push(lineContent.split(' ')[0])
            }

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

    let documentPath = prefs.outlineFile.split('/')
    documentPath.pop()
    documentPath = documentPath.join('/')

    console.log(outlineData)

    global.sharedObj = {outlineData: outlineData, sceneCount: sceneCount, documentPath: documentPath}

    if (create) {
      statWatcher = fs.watchFile(prefs.outlineFile, {persistent: false}, (e) => {
        loadOutline()
        console.log(`The outline has been updated.`);
        mainWindow.webContents.send('reload')
      })

      createWindow()
    }



  })
}

//loadOutline()

ipcMain.on('showWindow', ()=> {
  mainWindow.show()
})


ipcMain.on('openOutline', ()=> {
  openOutline()
})

ipcMain.on('exportFountain', (event, arg) => {
  dialog.showSaveDialog({title:"Export Fountain Screenplay", defaultPath: prefs.outlineFile, buttonLabel: "Export", filters:[{name: 'Fountain', extensions: ['fountain']}]}, (filename)=>{
    if (filename) {
      console.log('EXPORTING: ' + filename)

      let outlineData = global.sharedObj.outlineData

      let scriptText = 'Title: **Screenplay from Outline**\n'
      scriptText+= 'Credit: Written by\n'
      scriptText+= 'Author: _______\n'
      scriptText+= 'Format: Screenplay\n'
      scriptText+= 'Draft date: ' + (new Date()).toDateString() + '\n'
      scriptText+= 'Contact: _______\n\n'
      let sceneNumber = 0
      let currentSection

      for (var i = 0; i < outlineData.length; i++) {
        if (outlineData[i].type == 'section') {
          if (currentSection) {
            scriptText += '>**End of ' + currentSection + '**<\n\n'
            scriptText += '===\n\n'
          }
          currentSection = outlineData[i].text
          scriptText += '# ' + outlineData[i].text + '\n\n'
          scriptText += '>**' + outlineData[i].text + '**<\n\n'
        } else if (outlineData[i].type == 'scene') {
          sceneNumber++
          if (outlineData[i].slugline) {
            scriptText += outlineData[i].slugline + ' #' + sceneNumber + '#\n\n'
          } else {
            scriptText += '.' + outlineData[i].text.toUpperCase() + ' #' + sceneNumber + '#' + '\n\n'
          }
          
          scriptText += '= ' + outlineData[i].text + '\n\n'
          
          if (outlineData[i].timing) {
            scriptText += '[[ timing: ' + outlineData[i].timing + ' seconds ]]\n\n'
          }
          if (outlineData[i].description) {
            scriptText += outlineData[i].description + '\n\n'
          }
        }
      }

      scriptText+= '> THE END <'

      var stream = fs.createWriteStream(filename)
      stream.once('open', function(fd) {
        stream.write(scriptText)
        stream.end()
      })

    }
  })
})

ipcMain.on('exportOutliner', (event, arg) => {
  dialog.showSaveDialog({title:"Export Outliner", defaultPath: prefs.outlineFile, buttonLabel: "Export", filters:[{name: 'Outliner', extensions: ['outliner']}]}, (filename)=>{
    if (filename) {
      console.log('EXPORTING: ' + filename)
      
      let outlineData = global.sharedObj.outlineData

      let jsonString = `{
      "id":"root",
      "type":"Map",
      "value":{
        "documentMetadata":{
          "id":"RZMYwdFTv8sZ",
          "type":"Map",
          "value":{
            "title":{
              "json":"New Outline"
            },
            "author":{
              "json":""
            }
          }
        },
        "viewData":{
          "id":"OCL-uru7v8si",
          "type":"Map",
          "value":{
            "mode":{
              "json":"default"
            },
            "scale":{
              "json":2
            }
          }
        },
        "outlineNodes":{
          "id":"1231231231321",
          "type":"List",
          "value":[\n`


      let sceneNumber = 0
      let currentSection

      let nodeList = []

      for (var i = 0; i < outlineData.length; i++) {
        let nodeString
        if (outlineData[i].type == 'section') {
          nodeString = `{
              "id":"` + (Math.random()*99999999) + `",
              "type":"OutlineNode",
              "value":{
                "id":{
                  "json":` + i + `
                },
                "title":{
                  "json":"` + outlineData[i].text + `"
                },
                "type":{
                  "json":"section"
                },
                "order":{
                  "json":1
                }
              }
            }`
        } else if (outlineData[i].type == 'scene') {

          let description = ''
          if (outlineData[i].description) {
            description = JSON.stringify(outlineData[i].description.replace(/(\r\n|\n|\r)/gm,""))
          } else {
             description = JSON.stringify('')
          }

          let timing = 120
          if (outlineData[i].timing) {
            timing = outlineData[i].timing
          }

          let setting = ''
          let timeOfDay = ''

          if (outlineData[i].slugline) {
            z = outlineData[i].slugline.split('-')
            setting = z[0].trim()
            if (z.length > 1) {
              timeOfDay = z[1].trim()
            }
          }

          let posterImage = ''

          if (outlineData[i].posterImage) {
            posterImage = outlineData[i].posterImage
          }

          nodeString = `{
              "id":"` + (Math.random()*99999999) + `",
              "type":"OutlineNode",
              "value":{
                "id":{
                  "json":` + i + `
                },
                "title":{
                  "json":` + JSON.stringify(outlineData[i].text) + `
                },
                "type":{
                  "json":"scene"
                },
                "synopsis":{
                  "json":` + description + `
                },
                "order":{
                  "json":9
                },
                "imageURL":{
                  "json":"` + posterImage + `"
                },
                "setting":{
                  "json":"` + setting + `"
                },
                "timeOfDay":{
                  "json":"` + timeOfDay + `"
                },
                "tags":{
                  "json":""
                },
                "actors":{
                  "json":""
                },
                "duration":{
                  "json":` + timing + `
                },
                "completion":{
                  "json":""
                }
              }
            }`
        }
        nodeList.push(nodeString)
      }
        jsonString += nodeList.join(',')

      jsonString+= `      ]
          }
        }
      }`

      var stream = fs.createWriteStream(filename)
      stream.once('open', function(fd) {
        stream.write(jsonString)
        stream.end()
      })

    }
  })
})

ipcMain.on('exportCSV', (event, arg) => {
  dialog.showSaveDialog({title:"Export CSV file", defaultPath: prefs.outlineFile, buttonLabel: "Export", filters:[{name: 'CSV', extensions: ['csv']}]}, (filename)=>{
    if (filename) {
      console.log('EXPORTING: ' + filename)
      let outlineData = global.sharedObj.outlineData
      let sceneNumber = 0
      let currentSection = ''
      let csvText = 'SECTION,#,SCENE,TIMING,PAGES\n'
      for (var i = 0; i < outlineData.length; i++) {
        if (outlineData[i].type == 'section') {
          currentSection = outlineData[i].text
        } else if (outlineData[i].type == 'scene') {
          sceneNumber++
          csvText += currentSection + ','
          csvText += sceneNumber + ','
          csvText += '"' + outlineData[i].text + '",'
          if (outlineData[i].timing) {
            csvText += outlineData[i].timing + ','
            csvText += (outlineData[i].timing/60).toFixed(2)
          } else {
            csvText += ','
          }
          csvText += '\n'
        }          
      }
      var stream = fs.createWriteStream(filename)
      stream.once('open', function(fd) {
        stream.write(csvText)
        stream.end()
      })
    }
  })
})

ipcMain.on('exportCSV', (event, arg) => {
  dialog.showSaveDialog({title:"Export CSV file", defaultPath: prefs.outlineFile, buttonLabel: "Export", filters:[{name: 'CSV', extensions: ['csv']}]}, (filename)=>{
    if (filename) {
      console.log('EXPORTING: ' + filename)
      let outlineData = global.sharedObj.outlineData
      let sceneNumber = 0
      let currentSection = ''
      let csvText = 'SECTION,#,SCENE,TIMING,PAGES\n'
      for (var i = 0; i < outlineData.length; i++) {
        if (outlineData[i].type == 'section') {
          currentSection = outlineData[i].text
        } else if (outlineData[i].type == 'scene') {
          sceneNumber++
          csvText += currentSection + ','
          csvText += sceneNumber + ','
          csvText += '"' + outlineData[i].text + '",'
          if (outlineData[i].timing) {
            csvText += outlineData[i].timing + ','
            csvText += (outlineData[i].timing/60).toFixed(2)
          } else {
            csvText += ','
          }
          csvText += '\n'
        }          
      }
      var stream = fs.createWriteStream(filename)
      stream.once('open', function(fd) {
        stream.write(csvText)
        stream.end()
      })
    }
  })
})

ipcMain.on('exportPoster', (event, arg) => {
  let outlineData = global.sharedObj.outlineData
  printModule.printTest(outlineData, global.sharedObj.documentPath)
})
