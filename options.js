// Save options to chrome.storage
function saveOptions() {
  const enableVideoControls = document.getElementById('enableVideoControls').checked;
  const enableTrendingHashtags = document.getElementById('enableTrendingHashtags').checked;
  
  chrome.storage.sync.set({
    enableVideoControls: enableVideoControls,
    enableTrendingHashtags: enableTrendingHashtags
  }, () => {
    // Optional: Show a "saved" message
  });
}

// Restore options from chrome.storage
function restoreOptions() {
  chrome.storage.sync.get({
    enableVideoControls: true,  // Default value
    enableTrendingHashtags: true  // Default value
  }, (items) => {
    document.getElementById('enableVideoControls').checked = items.enableVideoControls;
    document.getElementById('enableTrendingHashtags').checked = items.enableTrendingHashtags;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('enableVideoControls').addEventListener('change', saveOptions);
document.getElementById('enableTrendingHashtags').addEventListener('change', saveOptions); 