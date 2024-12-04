// Add debug logging at the start
console.log('Bluesky+ Extension loaded');

// Create and inject the playback speed control styles
const style = document.createElement('style');
style.textContent = `
  .bsky-speed-control {
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    margin-right: 8px;
  }
  
  .bsky-speed-control:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;
document.head.appendChild(style);
console.log('Styles injected');

// Function to add speed control to a video player
function addSpeedControl(videoContainer) {
  console.log('Attempting to add speed control to:', videoContainer);
  
  // Find the video element
  const video = videoContainer.querySelector('video');
  if (!video) {
    console.log('No video element found');
    return;
  }
  
  if (videoContainer.querySelector('.bsky-speed-control')) {
    console.log('Speed control already exists');
    return;
  }

  // Try different selectors for controls
  const controls = videoContainer.querySelector('[data-testid="scrubber"]')?.parentElement?.querySelector('div:last-child') ||
                  videoContainer.querySelector('video')?.closest('div')?.querySelector('div:last-child');

  if (!controls) {
    console.log('No controls container found');
    return;
  }

  console.log('Found controls:', controls);

  const speedButton = document.createElement('button');
  speedButton.className = 'bsky-speed-control';
  speedButton.textContent = '1x';

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  let currentSpeedIndex = 3; // Default 1x

  speedButton.addEventListener('click', () => {
    currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;
    const newSpeed = speeds[currentSpeedIndex];
    video.playbackRate = newSpeed;
    speedButton.textContent = newSpeed + 'x';
    console.log('Speed changed to:', newSpeed);
  });

  // Try to insert at the beginning of controls
  controls.insertBefore(speedButton, controls.firstChild);
  console.log('Speed control added successfully');
}

// Function to find and process video players
function findAndProcessVideos() {
  console.log('Searching for videos...');
  
  // Try different selectors
  let videoContainers = new Set([
    ...document.querySelectorAll('div[aria-label="Embedded video player"]'),
    ...Array.from(document.querySelectorAll('video')).map(v => v.closest('div'))
  ].filter(Boolean));

  // Additional method to find video containers
  document.querySelectorAll('video').forEach(video => {
    let container = video.closest('div[aria-label="Embedded video player"]') || 
                   video.closest('div');
    if (container) videoContainers.add(container);
  });

  console.log('Found video containers:', videoContainers.size);
  videoContainers.forEach(addSpeedControl);
}

// Observer to watch for new video players being added to the page
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      findAndProcessVideos();
    }
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});
console.log('Observer started');

// Initial search for videos
findAndProcessVideos();

// Also search after a delay to catch dynamically loaded content
setTimeout(findAndProcessVideos, 2000);
setTimeout(findAndProcessVideos, 5000); 