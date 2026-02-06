// DOM Elements
const scrollLimitInput = document.getElementById('scrollLimit');
const redirectUrlInput = document.getElementById('redirectUrl');
const newSiteInput = document.getElementById('newSite');
const addSiteBtn = document.getElementById('addSiteBtn');
const siteList = document.getElementById('siteList');
const enabledToggle = document.getElementById('enabledToggle');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');
const quickAddChips = document.querySelectorAll('.chip');

// State
let blockedSites = [];

// Default settings
const defaults = {
  scrollLimit: 3000,
  redirectUrl: 'https://notion.so',
  blockedSites: ['twitter.com', 'x.com', 'instagram.com'],
  enabled: true
};

// Load settings on popup open
document.addEventListener('DOMContentLoaded', loadSettings);

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['scrollLimit', 'redirectUrl', 'blockedSites', 'enabled']);
    
    scrollLimitInput.value = result.scrollLimit || defaults.scrollLimit;
    redirectUrlInput.value = result.redirectUrl || defaults.redirectUrl;
    blockedSites = result.blockedSites || defaults.blockedSites;
    enabledToggle.checked = result.enabled !== undefined ? result.enabled : defaults.enabled;
    
    renderSiteList();
    updateQuickAddChips();
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

function renderSiteList() {
  siteList.innerHTML = '';
  
  blockedSites.forEach((site, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="site-name">${site}</span>
      <button class="remove-btn" data-index="${index}" title="Remove site">×</button>
    `;
    siteList.appendChild(li);
  });

  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      removeSite(index);
    });
  });
}

function addSite(site) {
  // Clean up the site input
  site = site.trim().toLowerCase();
  
  // Remove protocol if present
  site = site.replace(/^(https?:\/\/)?(www\.)?/, '');
  
  // Remove trailing slash
  site = site.replace(/\/$/, '');
  
  if (!site) {
    showStatus('Please enter a valid site', 'error');
    return;
  }
  
  if (blockedSites.includes(site)) {
    showStatus('Site already added', 'error');
    return;
  }
  
  blockedSites.push(site);
  renderSiteList();
  updateQuickAddChips();
  newSiteInput.value = '';
}

function removeSite(index) {
  blockedSites.splice(index, 1);
  renderSiteList();
  updateQuickAddChips();
}

function updateQuickAddChips() {
  quickAddChips.forEach(chip => {
    const site = chip.dataset.site;
    if (blockedSites.includes(site)) {
      chip.classList.add('added');
      chip.textContent = '✓ ' + chip.textContent.replace('✓ ', '');
    } else {
      chip.classList.remove('added');
      chip.textContent = chip.textContent.replace('✓ ', '');
    }
  });
}

async function saveSettings() {
  const scrollLimit = parseInt(scrollLimitInput.value) || defaults.scrollLimit;
  let redirectUrl = redirectUrlInput.value.trim() || defaults.redirectUrl;
  
  // Ensure redirect URL has protocol
  if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
    redirectUrl = 'https://' + redirectUrl;
  }
  
  // Validate scroll limit
  if (scrollLimit < 100) {
    showStatus('Scroll limit must be at least 100 pixels', 'error');
    return;
  }
  
  try {
    await chrome.storage.sync.set({
      scrollLimit,
      redirectUrl,
      blockedSites,
      enabled: enabledToggle.checked
    });
    
    // Notify all tabs about the settings change
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED' }).catch(() => {
        // Ignore errors for tabs that don't have the content script
      });
    });
    
    showStatus('Settings saved!', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
}

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `status show ${type}`;
  
  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 2500);
}

// Event listeners
addSiteBtn.addEventListener('click', () => addSite(newSiteInput.value));

newSiteInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addSite(newSiteInput.value);
  }
});

quickAddChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const site = chip.dataset.site;
    if (blockedSites.includes(site)) {
      const index = blockedSites.indexOf(site);
      removeSite(index);
    } else {
      addSite(site);
    }
  });
});

saveBtn.addEventListener('click', saveSettings);
