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

// Add styles for trending hashtags
const trendingStyles = document.createElement('style');
trendingStyles.textContent = `
  .trending-hashtags {
    padding: 8px 16px;
    background: var(--background);
    border-radius: 8px;
    margin: 8px 0;
  }
  .trending-hashtags h4 {
    color: var(--text-primary);
    margin-bottom: 8px;
  }
  .trending-tag {
    color: var(--accent);
    text-decoration: none;
    margin-right: 12px;
    font-size: 14px;
  }
  .trending-tag:hover {
    text-decoration: underline;
  }
`;
document.head.appendChild(trendingStyles);

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

let enableVideoControls = true; // Default value

// Check settings before initializing
chrome.storage.sync.get({
  enableVideoControls: true  // Default value
}, (items) => {
  enableVideoControls = items.enableVideoControls;
  if (enableVideoControls) {
    // Initial search for videos
    findAndProcessVideos();
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also search after a delay to catch dynamically loaded content
    setTimeout(findAndProcessVideos, 2000);
    setTimeout(findAndProcessVideos, 5000);
  }
});

// Function to add trending hashtags
function addTrendingHashtags() {
  const searchInput = document.querySelector('input[role="search"]');
  if (!searchInput || searchInput.closest('.trending-parent')) return;

  const parentElement = searchInput.parentElement;
  
  // Create trending hashtags container
  const trendingContainer = document.createElement('div');
  trendingContainer.className = 'trending-hashtags';
  trendingContainer.innerHTML = `
    <h4>Trending Hashtags</h4>
    <div id="trending-tags-list"></div>
  `;

  // Insert after the search input's parent
  parentElement.parentElement.insertBefore(trendingContainer, parentElement.nextSibling);
  parentElement.classList.add('trending-parent'); // Mark as processed

  // Connect to WebSocket and track hashtags
  const ws = new WebSocket("wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post");
  const hashtagData = new Map();
  const allPosts = new Map();

  class HashtagInfo {
    constructor() {
      this.totalCount = 0;
      this.users = new Set();
    }

    get count() {
      return this.users.size; // Using unique users count
    }

    addUse(userId) {
      this.totalCount++;
      this.users.add(userId);
    }
  }

  ws.onmessage = (event) => {
    const json = JSON.parse(event.data);
    if (json.commit?.operation === 'create' && json.commit?.collection === 'app.bsky.feed.post') {
      const facets = json.commit?.record?.facets || [];
      const userId = json.did;
      
      facets.forEach(facet => {
        facet.features.forEach(feature => {
          if (feature.$type === 'app.bsky.richtext.facet#tag') {
            const hashtag = feature.tag.toLowerCase();
            if (!hashtagData.has(hashtag)) {
              hashtagData.set(hashtag, new HashtagInfo());
            }
            const tagInfo = hashtagData.get(hashtag);
            tagInfo.addUse(userId);
            updateTrendingList();
          }
        });
      });
    }
  };

  function updateTrendingList() {
    const tagsList = document.getElementById('trending-tags-list');
    if (!tagsList) return;

    const sortedHashtags = Array.from(hashtagData.entries())
      .sort((a, b) => b[1].count - a[1].count) // Sort by unique users count
      .slice(0, 10);

    tagsList.innerHTML = sortedHashtags
      .map(([tag, data]) => `
        <a href="https://bsky.app/search?q=%23${encodeURIComponent(tag)}" 
           class="trending-tag">#${tag}</a>
      `)
      .join('');
  }
}

// Add trending hashtags observer
const trendingObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      addTrendingHashtags();
    }
  }
});

// Initialize trending hashtags
addTrendingHashtags();
trendingObserver.observe(document.body, {
  childList: true,
  subtree: true
}); 