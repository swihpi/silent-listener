# Silent Listener for Windows

Silent Listener is a Windows desktop prototype that accepts a typed question or microphone speech, then displays a Gemini Flash-Lite answer as text. It never speaks an answer aloud.

## Safe sharing

This repository and the Windows installer contain **no Gemini API key**. Each person opens **Gemini settings**, pastes their own Google AI Studio key, tests it, and saves it. The app encrypts that key with Windows Data Protection API (DPAPI), tied to that person's Windows account. The key is never committed to GitHub, added to an export, or bundled with the installer.

## Use

1. Download `Silent Listener Setup.exe` from the GitHub Actions artifact or a future GitHub Release.
2. Install it, open **Gemini settings**, and add your own key.
3. Type a question or use **Start microphone**. Recognised final speech segments are shown separately and likely questions are automatically sent to Gemini.

## Current scope

- Windows 10/11, x64 installer.
- Typed Gemini questions are the dependable path.
- Microphone speech recognition depends on the Windows/Chromium speech service being available and permission being granted. The UI reports when it is unavailable.
- System-audio capture is **not yet implemented** in the Windows version. It is deliberately not claimed as a feature until it has a tested Windows-native transcription implementation.

## Build locally on Windows

```powershell
npm install
npm run dist
```

The GitHub Actions workflow produces the same Windows installer automatically after each push to `main`.
