const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('silentListener', {
  hasGeminiKey: () => ipcRenderer.invoke('key:status'),
  saveGeminiKey: key => ipcRenderer.invoke('key:save', key),
  removeGeminiKey: () => ipcRenderer.invoke('key:remove'),
  askGemini: (question, suppliedKey) => ipcRenderer.invoke('gemini:ask', question, suppliedKey),
  openApiKeyPage: () => ipcRenderer.invoke('open:api-key-page')
});
