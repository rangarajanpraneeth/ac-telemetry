const { app, BrowserWindow } = require('electron');
const path = require('path');

const developerMode = true;

const createWindow = () => {
   const window = new BrowserWindow({
      // fullscreen: true,
      width: 1600,
      height: 900,
      minWidth: 1600,
      minHeight: 900,
      webPreferences: {
         nodeIntegration: true,
         contextIsolation: false
      },
      icon: path.join(__dirname, '../images/icon.ico')
   });
   window.setMenuBarVisibility(false);
   if (developerMode) window.webContents.openDevTools();
   window.loadFile(path.join(__dirname, '../app/act.html'));
}

app.whenReady().then(() => {
   createWindow();
   app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
   });
});

app.on('window-all-closed', () => {
   if (process.platform !== 'darwin') app.quit();
});