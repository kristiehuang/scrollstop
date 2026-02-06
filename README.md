# Scroll Stop 🛑

A Chrome extension that helps you break the infinite scroll habit by limiting how much you can scroll on distracting sites.

## Features

- **Customizable scroll limit**: Set a pixel threshold (default: 3000px, roughly 3 screen heights)
- **Block any site**: Add Twitter, Instagram, LinkedIn, TikTok, Reddit, or any other distracting site
- **Quick-add buttons**: One-click to add popular social media sites
- **Custom redirect**: Choose where to go when you've scrolled enough (default: Notion)
- **Progress indicator**: See how much scrolling you have left
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
3. Set your **redirect URL** (where you want to go when limit is reached)
4. Add sites to block using:
   - The input field + "Add" button
   - Quick-add chips for popular sites
5. Toggle the extension on/off as needed
6. Click **Save Settings**

## How It Works

When you visit a blocked site:
1. A small progress indicator appears in the bottom-right corner
2. As you scroll, it tracks your total scroll distance
3. At 80% of your limit, the indicator turns pink as a warning
4. When you hit the limit, a full-screen overlay appears
5. After a 3-second countdown, you're redirected to your productive site

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
- Redirect: https://notion.so
- Blocked sites: twitter.com, x.com, instagram.com

## License

MIT
