// Save options to chrome.storage
function saveOptions() {
  const enableVideoControls = document.getElementById('enableVideoControls').checked;
  chrome.storage.sync.set({
    enableVideoControls: enableVideoControls
  }, () => {
    // Optional: Show a "saved" message
  });
}

// Restore options from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get({
    enableVideoControls: true  // Default value
  }, (items) => {
    document.getElementById('enableVideoControls').checked = items.enableVideoControls;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('enableVideoControls').addEventListener('change', saveOptions); 