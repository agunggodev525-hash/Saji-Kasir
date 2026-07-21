const { app, BrowserWindow } = require('electron');
const path = require('path');
// Require the server helper using relative path
const { startServer } = require('./server.js');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'logo-toko-amanah-new.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        autoHideMenuBar: true
    });

    // Load the local server
    mainWindow.loadURL('http://localhost:8080');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    // Use app.getPath('userData') to store data in a persistent location
    const userDataPath = app.getPath('userData');
    console.log('Starting server with data path:', userDataPath);

    // Start the server directly in the main process
    startServer(userDataPath);

    // Give the server a moment to start (though since it's in-process it should be fast, 
    // but the listen callback is async. 1000ms is safe)
    setTimeout(createWindow, 1000);
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

app.on('will-quit', () => {
    // Server will close when app quits automatically since it's in the same process
});
