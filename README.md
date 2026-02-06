# Scroll Stop 🛑

A Chrome extension that helps you break the infinite scroll habit by limiting how much you can scroll on distracting sites.

## Features

- **Customizable scroll limit**: Set a pixel threshold (default: 3000px, roughly 3 screen heights)
- **Daily block limit**: Set how many times you can hit the scroll limit per site per day (default: 5). After that, the site is fully locked!
- **Block any site**: Add Twitter, Instagram, LinkedIn, TikTok, Reddit, or any other distracting site
- **Quick-add buttons**: One-click to add popular social media sites
- **Custom redirect**: Choose where to go when you've scrolled enough (default: Notion)
- **Progress indicator**: See how much scrolling you have left AND how many blocks remain today
- **Today's stats**: View your block counts per site in the popup
- **Beautiful UI**: Clean, modern design with smooth animations

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select this folder (`social media scroll stop`)
5. The extension icon will appear in your toolbar

## Usage

1. Click the extension icon to open settings
2. Set your **scroll limit** (recommended: 2000-5000 pixels)
3. Set your **daily block limit** (how many times you can hit the scroll limit before the site is locked)
4. Set your **redirect URL** (where you want to go when limit is reached)
5. Add sites to block using:
   - The input field + "Add" button
   - Quick-add chips for popular sites
6. View **Today's Stats** to see how many times you've been blocked on each site
7. Toggle the extension on/off as needed
8. Click **Save Settings**

## How It Works

When you visit a blocked site:
1. A small progress indicator appears in the bottom-right corner showing:
   - Pixels remaining before scroll limit
   - Number of blocks remaining today
2. As you scroll, it tracks your total scroll distance
3. At 80% of your limit, the indicator turns pink as a warning
4. When you hit the scroll limit:
   - A full-screen overlay appears showing how many blocks you have left today
   - Your block count for that site increases by 1
   - After a 3-second countdown, you're redirected to your productive site
5. **If you've hit the daily block limit** (e.g., 5 blocks on Twitter):
   - The site is immediately locked when you visit
   - A "Site Locked for Today" overlay appears
   - You're redirected without the option to scroll at all
   - The lock resets at midnight

## Files

- `manifest.json` - Extension configuration
- `popup.html/js/css` - Settings popup UI
- `content.js` - Scroll tracking logic (runs on web pages)
- `background.js` - Service worker for initialization
- `icons/` - Extension icons

## Icons

You'll need to add icon files:
- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)
- `icons/icon128.png` (128x128 pixels)

You can use any image editor or online tool to create these, or use the placeholder icons provided.

## Customization

The extension uses Chrome's sync storage, so your settings will sync across devices if you're signed into Chrome.

Default settings:
- Scroll limit: 3000 pixels
- Daily block limit: 5 times per site
- Redirect: https://notion.so
- Blocked sites: twitter.com, x.com, instagram.com

## License

MIT
