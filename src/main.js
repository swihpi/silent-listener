const { app, BrowserWindow, ipcMain, safeStorage, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const GEMINI_MODEL = 'gemini-3.1-flash-lite';
let mainWindow;

function keyPath() {
  return path.join(app.getPath('userData'), 'gemini-key.bin');
}

async function loadKey() {
  try {
    const encrypted = await fs.readFile(keyPath());
    if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows encryption is unavailable.');
    return safeStorage.decryptString(encrypted).trim();
  } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

async function saveKey(value) {
  const key = String(value || '').trim();
  if (!key) throw new Error('Paste a Gemini API key first.');
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows encryption is unavailable.');
  await fs.writeFile(keyPath(), safeStorage.encryptString(key), { mode: 0o600 });
}

async function removeKey() {
  try { await fs.unlink(keyPath()); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}

async function geminiAnswer(question, key) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `Answer directly and concisely in plain text. Do not claim to have heard audio.\n\nQuestion: ${question}` }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 260 }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Gemini returned HTTP ${response.status}.`);
  const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n').trim();
  if (!text) throw new Error('Gemini returned no text answer.');
  return text;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080, height: 760, minWidth: 760, minHeight: 560,
    backgroundColor: '#12151c',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  ipcMain.handle('key:status', async () => Boolean(await loadKey()));
  ipcMain.handle('key:save', async (_event, value) => { await saveKey(value); return true; });
  ipcMain.handle('key:remove', async () => { await removeKey(); return true; });
  ipcMain.handle('gemini:ask', async (_event, question, suppliedKey) => geminiAnswer(question, suppliedKey || await loadKey()));
  ipcMain.handle('open:api-key-page', () => shell.openExternal('https://aistudio.google.com/app/apikey'));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
