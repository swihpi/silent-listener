const $ = selector => document.querySelector(selector);
const transcript = $('#transcript'), answers = $('#answers'), notice = $('#notice');
let recognition, listening = false, entries = [], answerEntries = [];

function time() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function render() {
  const size = `${$('#textSize').value}px`;
  transcript.classList.toggle('empty', !entries.length); answers.classList.toggle('empty', !answerEntries.length);
  transcript.innerHTML = entries.length ? entries.map(e => `<div class="entry" style="font-size:${size}"><small>Microphone · ${e.time}</small>${escapeHtml(e.text)}</div>`).join('') : 'Press <b>Start microphone</b>, then speak. Each final Windows speech segment becomes a separate entry.';
  answers.innerHTML = answerEntries.length ? answerEntries.slice().reverse().map(e => `<div class="entry" style="font-size:${size}"><small>Gemini Flash-Lite · ${e.time}</small><div class="question">${escapeHtml(e.question)}</div>${escapeHtml(e.answer)}</div>`).join('') : 'Ask a question to see a Gemini answer here.';
  $('#transcriptCount').textContent = entries.length; $('#answerCount').textContent = answerEntries.length;
}
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }
function isQuestion(text) { return /\?$|^(what|why|when|where|who|which|how|can|could|would|will|should|is|are|do|does|did)\b/i.test(text.trim()); }
async function ask(question) {
  const value = question.trim(); if (!value) return;
  notice.textContent = 'Asking Gemini…';
  try { const answer = await window.silentListener.askGemini(value); answerEntries.push({ question: value, answer, time: time() }); notice.textContent = 'Answer ready — text only.'; }
  catch (error) { answerEntries.push({ question: value, answer: `Could not answer: ${error.message}`, time: time() }); notice.textContent = 'Gemini needs a valid key. Open Gemini settings to add or replace it.'; }
  render();
}
function startRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) { notice.textContent = 'Windows speech recognition is unavailable in this build. You can still type questions.'; return; }
  recognition = new Recognition(); recognition.continuous = true; recognition.interimResults = true; recognition.lang = navigator.language || 'en-US';
  recognition.onresult = event => { for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) { const text = event.results[i][0].transcript.trim(); entries.push({ text, time: time() }); if (isQuestion(text)) ask(text); render(); } };
  recognition.onerror = event => { notice.textContent = `Microphone speech recognition: ${event.error}.`; };
  recognition.onend = () => { if (listening) recognition.start(); };
  recognition.start(); listening = true; $('#listenButton').textContent = 'Pause microphone'; $('#listenStatus').textContent = 'Listening to your microphone…';
}
$('#listenButton').addEventListener('click', () => { if (listening) { listening = false; recognition?.stop(); $('#listenButton').textContent = 'Start microphone'; $('#listenStatus').textContent = 'Microphone is paused.'; } else startRecognition(); });
$('#askForm').addEventListener('submit', event => { event.preventDefault(); const input = $('#question'); ask(input.value); input.value = ''; });
$('#textSize').addEventListener('change', render);
$('#settingsButton').addEventListener('click', () => $('#settings').showModal());
$('#keyPage').addEventListener('click', () => window.silentListener.openApiKeyPage());
$('#saveKey').addEventListener('click', async () => { try { await window.silentListener.saveGeminiKey($('#apiKey').value); $('#apiKey').value = ''; $('#keyStatus').textContent = 'Saved securely for this Windows account.'; } catch (error) { $('#keyStatus').textContent = error.message; } });
$('#removeKey').addEventListener('click', async () => { await window.silentListener.removeGeminiKey(); $('#keyStatus').textContent = 'Saved key removed.'; });
$('#testKey').addEventListener('click', async () => { const key = $('#apiKey').value.trim(); if (!key) { $('#keyStatus').textContent = 'Paste a key to test it.'; return; } $('#keyStatus').textContent = 'Testing…'; try { await window.silentListener.askGemini('Reply only with OK.', key); $('#keyStatus').textContent = 'Connection works. Save it when ready.'; } catch (error) { $('#keyStatus').textContent = error.message; } });
render();
