document.getElementById('toggle').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (_) {}
  chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
  window.close();
});
