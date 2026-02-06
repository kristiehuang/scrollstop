// Background service worker for Scroll Stop extension

// Set default settings on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      scrollLimit: 3000,
      redirectUrl: 'https://notion.so',
      blockedSites: ['twitter.com', 'x.com', 'instagram.com'],
      enabled: true
    });
    
    console.log('Scroll Stop: Extension installed with default settings');
  }
});

// Listen for tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Content script is injected via manifest, this is just for logging
    console.log('Scroll Stop: Tab updated', tab.url);
  }
});
