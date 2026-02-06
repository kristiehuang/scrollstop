// Scroll Stop Content Script
(function() {
  let settings = {
    scrollLimit: 3000,
    dailyBlockLimit: 5,
    redirectUrl: 'https://notion.so',
    blockedSites: ['twitter.com', 'x.com', 'instagram.com'],
    enabled: true
  };

  let totalScrolled = 0;
  let isBlocked = false;
  let isDailyLocked = false;
  let warningOverlay = null;
  let hasRedirected = false;
  let currentSiteKey = null;

  // Get current site key for tracking
  function getCurrentSiteKey() {
    const hostname = window.location.hostname.toLowerCase().replace('www.', '');
    // Find matching blocked site
    for (const site of settings.blockedSites) {
      const cleanSite = site.toLowerCase().replace('www.', '');
      if (hostname === cleanSite || hostname.endsWith('.' + cleanSite)) {
        return cleanSite;
      }
    }
    return hostname;
  }

  // Get today's date key
  function getTodayKey() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  // Check if current site is in blocked list
  function isBlockedSite() {
    const hostname = window.location.hostname.toLowerCase().replace('www.', '');
    return settings.blockedSites.some(site => {
      const cleanSite = site.toLowerCase().replace('www.', '');
      return hostname === cleanSite || hostname.endsWith('.' + cleanSite);
    });
  }

  // Get daily block count for current site
  async function getDailyBlockCount() {
    try {
      const result = await chrome.storage.local.get(['dailyBlockCounts', 'dailyBlockDate']);
      const today = getTodayKey();
      
      // Reset if it's a new day
      if (result.dailyBlockDate !== today) {
        await chrome.storage.local.set({
          dailyBlockCounts: {},
          dailyBlockDate: today
        });
        return 0;
      }
      
      const counts = result.dailyBlockCounts || {};
      return counts[currentSiteKey] || 0;
    } catch (error) {
      console.error('Scroll Stop: Error getting daily block count', error);
      return 0;
    }
  }

  // Increment daily block count for current site
  async function incrementDailyBlockCount() {
    try {
      const result = await chrome.storage.local.get(['dailyBlockCounts', 'dailyBlockDate']);
      const today = getTodayKey();
      
      let counts = result.dailyBlockCounts || {};
      
      // Reset if it's a new day
      if (result.dailyBlockDate !== today) {
        counts = {};
      }
      
      counts[currentSiteKey] = (counts[currentSiteKey] || 0) + 1;
      
      await chrome.storage.local.set({
        dailyBlockCounts: counts,
        dailyBlockDate: today
      });
      
      return counts[currentSiteKey];
    } catch (error) {
      console.error('Scroll Stop: Error incrementing daily block count', error);
      return 0;
    }
  }

  // Load settings from storage
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['scrollLimit', 'dailyBlockLimit', 'redirectUrl', 'blockedSites', 'enabled']);
      
      if (result.scrollLimit) settings.scrollLimit = result.scrollLimit;
      if (result.dailyBlockLimit) settings.dailyBlockLimit = result.dailyBlockLimit;
      if (result.redirectUrl) settings.redirectUrl = result.redirectUrl;
      if (result.blockedSites) settings.blockedSites = result.blockedSites;
      if (result.enabled !== undefined) settings.enabled = result.enabled;
      
      // Reset scroll count when settings change
      totalScrolled = 0;
      hasRedirected = false;
      isDailyLocked = false;
      
      if (isBlockedSite() && settings.enabled) {
        currentSiteKey = getCurrentSiteKey();
        await checkDailyLimit();
      } else {
        cleanup();
      }
    } catch (error) {
      console.error('Scroll Stop: Error loading settings', error);
    }
  }

  // Check if daily limit exceeded
  async function checkDailyLimit() {
    const blockCount = await getDailyBlockCount();
    
    if (blockCount >= settings.dailyBlockLimit) {
      // Site is locked for the day!
      isDailyLocked = true;
      isBlocked = true;
      createDailyLockOverlay(blockCount);
    } else {
      initScrollTracking(blockCount);
    }
  }

  // Create daily lock overlay (site fully blocked)
  function createDailyLockOverlay(blockCount) {
    if (warningOverlay) return;

    warningOverlay = document.createElement('div');
    warningOverlay.id = 'scroll-stop-warning';
    warningOverlay.innerHTML = `
      <div class="scroll-stop-content daily-locked">
        <div class="scroll-stop-icon">🔒</div>
        <p class="motivational-text">What are you doing here?<br>Does the work match the ambition?</p>
        <p class="site-locked-info">${currentSiteKey} is locked until tomorrow.</p>
        <p class="scroll-stop-redirect">Redirecting in <span id="scroll-stop-countdown">3</span> seconds...</p>
        <button id="scroll-stop-redirect-now">Back to What Matters</button>
      </div>
    `;

    appendOverlayStyles();
    document.body.appendChild(warningOverlay);

    // Add event listener for immediate redirect
    document.getElementById('scroll-stop-redirect-now').addEventListener('click', redirect);

    // Start countdown
    startRedirectCountdown();
  }



  // Create warning overlay (scroll limit reached)
  async function createWarningOverlay() {
    if (warningOverlay) return;

    // Increment the block count
    const newCount = await incrementDailyBlockCount();
    const remaining = settings.dailyBlockLimit - newCount;

    warningOverlay = document.createElement('div');
    warningOverlay.id = 'scroll-stop-warning';
    warningOverlay.innerHTML = `
      <div class="scroll-stop-content">
        <div class="scroll-stop-icon">🛑</div>
        <p class="motivational-text">Dial it in. Does The Work Match The Ambition?</p>
        <p class="block-count-warning">${remaining > 0 
          ? `${remaining}/${settings.dailyBlockLimit} chances today`
          : `🔒 No more chances. ${currentSiteKey} is locked for today.`
        }</p>
        <div class="scroll-stop-progress">
          <div class="scroll-stop-progress-bar" style="width: 100%"></div>
        </div>
        <p class="scroll-stop-redirect">Redirecting in <span id="scroll-stop-countdown">3</span> seconds...</p>
        <button id="scroll-stop-redirect-now">Get Back on Track</button>
      </div>
    `;

    appendOverlayStyles();
    document.body.appendChild(warningOverlay);

    // Add event listener for immediate redirect
    document.getElementById('scroll-stop-redirect-now').addEventListener('click', redirect);

    // Start countdown
    startRedirectCountdown();
  }

  // Append overlay styles
  function appendOverlayStyles() {
    if (document.getElementById('scroll-stop-overlay-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'scroll-stop-overlay-styles';
    style.textContent = `
      #scroll-stop-warning {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: fadeIn 0.3s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .scroll-stop-content {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 40px 50px;
        border-radius: 20px;
        text-align: center;
        color: white;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.4s ease;
      }
      
      .scroll-stop-content.daily-locked {
        background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
      }
      
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(30px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .scroll-stop-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }
      
      .scroll-stop-content h2 {
        font-size: 28px;
        margin-bottom: 16px;
        font-weight: 700;
      }
      
      .scroll-stop-content p {
        font-size: 16px;
        margin-bottom: 12px;
        opacity: 0.9;
      }
      
      .scroll-stop-content .motivational-text {
        font-size: 20px;
        font-weight: 600;
        line-height: 1.4;
        margin: 20px 0;
        opacity: 1;
      }
      
      .scroll-stop-content .site-locked-info {
        font-size: 14px;
        opacity: 0.7;
      }
      
      .scroll-stop-content .block-count-warning {
        background: rgba(255, 255, 255, 0.2);
        padding: 12px 16px;
        border-radius: 10px;
        font-weight: 500;
        font-size: 14px;
        margin: 16px 0;
      }
      
      .scroll-stop-progress {
        height: 8px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        margin: 20px 0;
        overflow: hidden;
      }
      
      .scroll-stop-progress-bar {
        height: 100%;
        background: white;
        border-radius: 4px;
        transition: width 1s linear;
      }
      
      .scroll-stop-redirect {
        font-size: 14px;
        opacity: 0.8;
      }
      
      #scroll-stop-redirect-now {
        margin-top: 20px;
        padding: 14px 32px;
        font-size: 16px;
        font-weight: 600;
        background: white;
        color: #667eea;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      
      .daily-locked #scroll-stop-redirect-now {
        color: #f5576c;
      }
      
      #scroll-stop-redirect-now:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      }
    `;

    document.head.appendChild(style);
  }

  // Start redirect countdown
  function startRedirectCountdown() {
    let countdown = 3;
    const countdownEl = document.getElementById('scroll-stop-countdown');
    const progressBar = document.querySelector('.scroll-stop-progress-bar');
    
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdownEl) countdownEl.textContent = countdown;
      if (progressBar) progressBar.style.width = `${(countdown / 3) * 100}%`;
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        redirect();
      }
    }, 1000);
  }

  // Redirect to productive site
  function redirect() {
    if (hasRedirected) return;
    hasRedirected = true;
    window.location.href = settings.redirectUrl;
  }

  // Create progress indicator
  function createProgressIndicator() {
    let indicator = document.getElementById('scroll-stop-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'scroll-stop-indicator';
      
      const style = document.createElement('style');
      style.id = 'scroll-stop-indicator-style';
      style.textContent = `
        #scroll-stop-indicator {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 18px;
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          font-weight: 500;
          z-index: 2147483646;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: opacity 0.3s, transform 0.3s;
          cursor: default;
        }
        
        #scroll-stop-indicator:hover {
          transform: scale(1.05);
        }
        
        #scroll-stop-indicator .indicator-main {
          font-weight: 600;
        }
        
        #scroll-stop-indicator .indicator-blocks {
          font-size: 11px;
          opacity: 0.85;
          margin-top: 4px;
        }
        
        #scroll-stop-indicator .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          margin-top: 8px;
          overflow: hidden;
        }
        
        #scroll-stop-indicator .progress-fill {
          height: 100%;
          background: white;
          border-radius: 2px;
          transition: width 0.1s;
        }
        
        #scroll-stop-indicator.warning {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          animation: pulse 0.5s ease-in-out infinite alternate;
        }
        
        @keyframes pulse {
          from { transform: scale(1); }
          to { transform: scale(1.05); }
        }
      `;
      
      if (!document.getElementById('scroll-stop-indicator-style')) {
        document.head.appendChild(style);
      }
      document.body.appendChild(indicator);
    }
    return indicator;
  }

  // Update progress indicator
  function updateProgressIndicator(blockCount) {
    const indicator = createProgressIndicator();
    const percentage = Math.min((totalScrolled / settings.scrollLimit) * 100, 100);
    const remaining = Math.max(settings.scrollLimit - totalScrolled, 0);
    const blocksRemaining = settings.dailyBlockLimit - blockCount;
    
    indicator.innerHTML = `
      <div class="indicator-main">🛑 ${Math.round(remaining)} px left</div>
      <div class="indicator-blocks">${blocksRemaining} block${blocksRemaining === 1 ? '' : 's'} left today</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
    `;
    
    // Add warning class when close to limit
    if (percentage >= 80) {
      indicator.classList.add('warning');
    } else {
      indicator.classList.remove('warning');
    }
  }

  // Current block count for display
  let currentBlockCount = 0;

  // Handle scroll events
  function handleScroll(e) {
    if (!settings.enabled || isBlocked || hasRedirected || isDailyLocked) return;
    
    // Track scroll delta
    const delta = Math.abs(e.deltaY || 0);
    if (delta > 0) {
      totalScrolled += delta;
      updateProgressIndicator(currentBlockCount);
      
      // Check if limit reached
      if (totalScrolled >= settings.scrollLimit) {
        isBlocked = true;
        createWarningOverlay();
      }
    }
  }

  // Block scrolling when limit reached
  function blockScroll(e) {
    if (isBlocked) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  // Initialize scroll tracking
  function initScrollTracking(blockCount) {
    // Remove any existing listeners first
    cleanup();
    
    currentBlockCount = blockCount;
    
    // Add scroll tracking
    window.addEventListener('wheel', handleScroll, { passive: true });
    
    // Block scroll when limit reached
    window.addEventListener('wheel', blockScroll, { passive: false });
    window.addEventListener('touchmove', blockScroll, { passive: false });
    
    // Show initial progress indicator
    updateProgressIndicator(blockCount);
  }

  // Cleanup function
  function cleanup() {
    window.removeEventListener('wheel', handleScroll);
    window.removeEventListener('wheel', blockScroll);
    window.removeEventListener('touchmove', blockScroll);
    
    const indicator = document.getElementById('scroll-stop-indicator');
    if (indicator) indicator.remove();
    
    if (warningOverlay) {
      warningOverlay.remove();
      warningOverlay = null;
    }
  }

  // Listen for settings updates from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_UPDATED' || message.type === 'STATS_RESET') {
      loadSettings();
    }
  });

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSettings);
  } else {
    loadSettings();
  }
})();
