const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Add any APIs you want to expose to the renderer process
    platform: process.platform,
    versions: process.versions
});