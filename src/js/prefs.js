const fs = require('fs')
const {app} = require('electron')

let prefs

let prefModule = {
  loadPrefs: function () {
    let prefFile = app.getPath('userData') + '/pref.json'
    try {
      prefs = JSON.parse(fs.readFileSync(prefFile))
    } catch (e) {
      console.log(e)
      prefs = {outlineFile: `./outl3ine.txt`}

      try {
        fs.writeFileSync(prefFile, JSON.stringify(prefs))
      } catch (e) {
        console.log(e)
      }
    }
    //console.log(contents)

    // fs.readFile(prefFile, 'utf-8', (err,data)=>{
    //   if (err) {
    //     // if not exist, create a new one
    //     console.log('error' + err)
    //   }

    //   prefs = JSON.parse(data)
    //   console.log(prefs)
    // })
  }, 
  savePrefs: function (prefs) {
    let prefFile = app.getPath('userData') + '/pref.json'
    fs.writeFileSync(prefFile, JSON.stringify(prefs))
  },
  getPrefs: function(){return prefs},
}

prefModule.loadPrefs()

module.exports = prefModule