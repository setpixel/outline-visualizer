/*

  refactor

  print worksheet for current scene
    dialogue (more than 1 scene?)

  import storyboard worksheet images

  speak

  hotkeys for going to beginning 
    end
    middle?

  remove edit
*/

const {Menu} = require('electron').remote
const {ipcRenderer} = require('electron')

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open...',
        accelerator: 'CmdOrCtrl+O',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('openOutline')
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Export Treatment...',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('exportTreatment')
        }
      },
      {
        label: 'Export to Fountain Screenplay...',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('exportFountain')
        }
      },
      {
        label: 'Export to Outliner...',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('exportOutliner')
        }
      },
      {
        label: 'Export to CSV file...',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('exportCSV')
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Export poster to PDF...',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('exportPoster')
        }
      },
      {
        type: 'separator'
      },
      {
        accelerator: 'CmdOrCtrl+P',
        label: 'Print current scene worksheet...',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('printWorksheet')
        }
      },
      {
        accelerator: 'CmdOrCtrl+I',
        label: 'Import worksheets...',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('importWorksheets')
        }
      },
    ]
  },
  {
    label: 'Navigation',
    submenu: [
      {
        accelerator: 'Home',
        label: 'Go to the beginning',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('goBeginning')
        }
      },
      {
        label: 'Previous section',
        accelerator: 'CmdOrCtrl+Left',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('goPreviousSection')
        }
      },
      {
        label: 'Previous scene',
        accelerator: 'Left',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('goPreviousScene')
        }
      },
      {
        label: 'Next scene',
        accelerator: 'Right',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('goNextScene')
        }
      },
      {
        label: 'Next section',
        accelerator: 'CmdOrCtrl+Right',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('goNextSection')
        }
      },
      {
        type: 'separator'
      },
      {
        accelerator: 'CmdOrCtrl+S',
        label: 'Start speaking',
        click ( item, focusedWindow, event) {
          ipcRenderer.send('startSpeaking')
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        role: 'copy'
      },
      {
        role: 'paste'
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click (item, focusedWindow) {
          if (focusedWindow) focusedWindow.reload()
        }
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click (item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.toggleDevTools()
        }
      },
      {
        type: 'separator'
      },
      {
        accelerator: 'CmdOrCtrl+F',
        role: 'togglefullscreen'
      }
    ]
  },
  {
    role: 'window',
    submenu: [
      {
        role: 'minimize'
      },
      {
        role: 'close'
      }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click () { require('electron').shell.openExternal('http://www.setpixel.com') }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  const name = require('electron').remote.app.getName()
  template.unshift({
    label: name,
    submenu: [
      {
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  })
  // // Edit menu.
  // template[1].submenu.push(
  //   {
  //     type: 'separator'
  //   },
  //   {
  //     label: 'Speech',
  //     submenu: [
  //       {
  //         role: 'startspeaking'
  //       },
  //       {
  //         role: 'stopspeaking'
  //       }
  //     ]
  //   }
  // )
  // Window menu.
  template[5].submenu = [
    {
      label: 'Close',
      accelerator: 'CmdOrCtrl+W',
      role: 'close'
    },
    {
      label: 'Minimize',
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize'
    },
    {
      label: 'Zoom',
      role: 'zoom'
    },
    {
      type: 'separator'
    },
    {
      label: 'Bring All to Front',
      role: 'front'
    }
  ]
}

const menuInstance = Menu.buildFromTemplate(template)

const menu = {

  setMenu: function() {
    Menu.setApplicationMenu(menuInstance)
  }
}

module.exports = menu