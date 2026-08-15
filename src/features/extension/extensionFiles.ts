import JSZip from 'jszip';

export const EXTENSION_MANIFEST = {
  manifest_version: 3,
  name: 'BytePrep Social Auto-Poster & Studio Helper',
  version: '1.2.0',
  description: '1-Click auto-fills Title, Description, #Shorts Tags, and upload settings on YouTube Studio, Instagram, Facebook Reels, and TikTok Studio.',
  permissions: ['storage', 'activeTab', 'clipboardRead', 'clipboardWrite'],
  host_permissions: [
    '*://studio.youtube.com/*',
    '*://www.youtube.com/*',
    '*://www.instagram.com/*',
    '*://business.facebook.com/*',
    '*://www.facebook.com/*',
    '*://www.tiktok.com/*',
    '*://byteprep-gamma.vercel.app/*',
    '*://ais-dev-*.run.app/*',
    '*://ais-pre-*.run.app/*',
    '*://localhost/*'
  ],
  action: {
    default_popup: 'popup.html',
    default_title: 'BytePrep Auto-Poster'
  },
  background: {
    service_worker: 'background.js'
  },
  content_scripts: [
    {
      matches: [
        '*://studio.youtube.com/*',
        '*://www.instagram.com/*',
        '*://business.facebook.com/*',
        '*://www.facebook.com/*',
        '*://www.tiktok.com/*',
        '*://byteprep-gamma.vercel.app/*',
        '*://ais-dev-*.run.app/*',
        '*://ais-pre-*.run.app/*',
        '*://localhost/*'
      ],
      js: ['content.js'],
      run_at: 'document_idle'
    }
  ]
};

export const EXTENSION_BACKGROUND_JS = `// BytePrep Social Auto-Poster Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('BytePrep Social Auto-Poster extension installed successfully!');
});

// Listen for messages from BytePrep web app or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_BYTEPREP_POST') {
    chrome.storage.local.set({ latestPost: message.data }, () => {
      chrome.action.setBadgeText({ text: 'NEW' });
      chrome.action.setBadgeBackgroundColor({ color: '#f43f5e' });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_LATEST_POST') {
    chrome.storage.local.get(['latestPost'], (result) => {
      sendResponse({ data: result.latestPost || null });
    });
    return true;
  }
});
`;

export const EXTENSION_CONTENT_JS = `// BytePrep Content Script - Smart Social Media Auto-Filler
(function() {
  console.log('[BytePrep Extension] Active on:', window.location.hostname);

  // 1. If running on BytePrep web app, listen for generated video posts
  if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('run.app') || window.location.hostname.includes('localhost')) {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'BYTEPREP_DISPATCH_TO_EXTENSION') {
        chrome.runtime.sendMessage({
          type: 'SAVE_BYTEPREP_POST',
          data: event.data.payload
        }, (res) => {
          console.log('[BytePrep Extension] Post synchronized:', res);
        });
      }
    });
    return;
  }

  // 2. Inject floating BytePrep Helper UI on social media studio pages
  function createFloatingHelper() {
    if (document.getElementById('byteprep-floating-helper')) return;

    chrome.runtime.sendMessage({ type: 'GET_LATEST_POST' }, (res) => {
      const post = res?.data;
      if (!post) return;

      const container = document.createElement('div');
      container.id = 'byteprep-floating-helper';
      container.style.position = 'fixed';
      container.style.bottom = '24px';
      container.style.right = '24px';
      container.style.zIndex = '9999999';
      container.style.backgroundColor = '#0f172a';
      container.style.color = '#ffffff';
      container.style.padding = '14px 18px';
      container.style.borderRadius = '16px';
      container.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(244, 63, 94, 0.4)';
      container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      container.style.fontSize = '12px';
      container.style.maxWidth = '320px';

      container.innerHTML = \`
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 800; color: #f43f5e;">
            <span>⚡ BytePrep Auto-Filler</span>
          </div>
          <button id="bp-close-btn" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px;">✕</button>
        </div>
        <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 10px; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
          \${post.formattedTitle || 'Ready to auto-fill post'}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
          <button id="bp-fill-all" style="grid-column: span 2; background: linear-gradient(135deg, #f43f5e, #fb7185); color: #ffffff; border: none; padding: 8px 12px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 11px;">
            ✨ Auto-Fill Title & Description
          </button>
          <button id="bp-copy-title" style="background: #1e293b; color: #cbd5e1; border: 1px solid #334155; padding: 6px 8px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 10px;">
            📋 Copy Title
          </button>
          <button id="bp-copy-desc" style="background: #1e293b; color: #cbd5e1; border: 1px solid #334155; padding: 6px 8px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 10px;">
            📋 Copy Caption
          </button>
        </div>
      \`;

      document.body.appendChild(container);

      // Close button
      document.getElementById('bp-close-btn').addEventListener('click', () => {
        container.remove();
      });

      // Copy buttons
      document.getElementById('bp-copy-title').addEventListener('click', () => {
        navigator.clipboard.writeText(post.formattedTitle || '');
        alert('Title copied to clipboard!');
      });

      document.getElementById('bp-copy-desc').addEventListener('click', () => {
        const fullDesc = (post.caption || '') + '\\n\\n' + (post.hashtags ? (Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags) : '');
        navigator.clipboard.writeText(fullDesc);
        alert('Caption & Hashtags copied to clipboard!');
      });

      // Auto-Fill Button
      document.getElementById('bp-fill-all').addEventListener('click', () => {
        autoFillCurrentPage(post);
      });
    });
  }

  function autoFillCurrentPage(post) {
    const fullCaption = (post.caption || '') + '\\n\\n' + (post.hashtags ? (Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags) : '');
    const title = post.formattedTitle || '';

    // 1. YouTube Studio Auto-Fill
    if (window.location.hostname.includes('studio.youtube.com')) {
      const titleBox = document.querySelector('#textbox[aria-label*="title" i], input[aria-label*="title" i], #textbox');
      if (titleBox) {
        titleBox.innerText = title;
        titleBox.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const descBox = document.querySelectorAll('#textbox[aria-label*="description" i], #textbox')[1];
      if (descBox) {
        descBox.innerText = fullCaption;
        descBox.dispatchEvent(new Event('input', { bubbles: true }));
      }

      navigator.clipboard.writeText(title);
      alert('YouTube Studio Title & Description filled! (Title also copied to clipboard)');
      return;
    }

    // 2. Instagram Web Auto-Fill
    if (window.location.hostname.includes('instagram.com')) {
      const textarea = document.querySelector('div[aria-label*="Write a caption" i], textarea[aria-label*="Write a caption" i]');
      if (textarea) {
        textarea.innerText = fullCaption;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        alert('Instagram Caption filled successfully!');
      } else {
        navigator.clipboard.writeText(fullCaption);
        alert('Caption & hashtags copied to clipboard! Click caption box and press Ctrl+V / Cmd+V');
      }
      return;
    }

    // 3. TikTok Studio
    if (window.location.hostname.includes('tiktok.com')) {
      const tiktokInput = document.querySelector('div[contenteditable="true"], .DraftEditor-root');
      if (tiktokInput) {
        tiktokInput.innerText = \`\${title} \${fullCaption}\`;
        tiktokInput.dispatchEvent(new Event('input', { bubbles: true }));
        alert('TikTok Caption auto-filled!');
      } else {
        navigator.clipboard.writeText(\`\${title} \${fullCaption}\`);
        alert('Title and Caption copied to clipboard!');
      }
      return;
    }

    // 4. Facebook Reels / Meta Business Suite
    if (window.location.hostname.includes('facebook.com')) {
      navigator.clipboard.writeText(\`\${title}\\n\\n\${fullCaption}\`);
      alert('Reel text copied to clipboard! Paste into the composer window.');
    }
  }

  // Poll for page load on studio URLs
  setInterval(() => {
    createFloatingHelper();
  }, 2000);
})();
`;

export const EXTENSION_POPUP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BytePrep Social Auto-Poster</title>
  <style>
    body {
      width: 320px;
      margin: 0;
      padding: 16px;
      background-color: #090d16;
      color: #f1f5f9;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #1e293b;
    }
    .title {
      font-weight: 900;
      font-size: 14px;
      color: #ffffff;
    }
    .badge {
      font-size: 9px;
      background: #f43f5e;
      color: #fff;
      padding: 2px 6px;
      border-radius: 9999px;
      font-weight: 800;
    }
    .card {
      background: #131d31;
      border: 1px solid #243552;
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .post-title {
      font-size: 12px;
      font-weight: 700;
      color: #fbbf24;
      margin-bottom: 6px;
    }
    .post-desc {
      font-size: 11px;
      color: #94a3b8;
      max-height: 60px;
      overflow-y: auto;
      line-height: 1.4;
      margin-bottom: 10px;
    }
    .btn {
      display: block;
      width: 100%;
      background: #f43f5e;
      color: white;
      text-align: center;
      padding: 8px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 11px;
      border: none;
      cursor: pointer;
      margin-bottom: 6px;
      box-sizing: border-box;
    }
    .btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
    }
    .btn:hover {
      opacity: 0.9;
    }
    .links-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 18px;">⚡</div>
    <div class="title">BytePrep Auto-Poster</div>
    <span class="badge">HELPER</span>
  </div>

  <div class="card" id="post-container">
    <div id="no-post" style="font-size: 11px; color: #64748b; text-align: center; padding: 12px 0;">
      No pending video short detected.<br>Generate a short in BytePrep to sync!
    </div>
    <div id="has-post" style="display: none;">
      <div class="post-title" id="bp-title"></div>
      <div class="post-desc" id="bp-desc"></div>
      <button class="btn" id="bp-copy-all">📋 Copy Full Title & Caption</button>
    </div>
  </div>

  <div style="font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 6px;">1-Click Direct Upload Portals:</div>
  <div class="links-grid">
    <a href="https://studio.youtube.com/channel/mine/videos/upload?d=ud" target="_blank" class="btn btn-secondary">🔴 YouTube Studio</a>
    <a href="https://www.instagram.com/" target="_blank" class="btn btn-secondary">📸 Instagram Web</a>
    <a href="https://www.tiktok.com/creator-center/upload" target="_blank" class="btn btn-secondary">🎵 TikTok Studio</a>
    <a href="https://business.facebook.com/latest/reels_composer" target="_blank" class="btn btn-secondary">📘 Facebook Reels</a>
  </div>

  <script src="popup.js"></script>
</body>
</html>
`;

export const EXTENSION_POPUP_JS = `// BytePrep Popup Script
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['latestPost'], (result) => {
    const post = result.latestPost;
    if (post) {
      document.getElementById('no-post').style.display = 'none';
      document.getElementById('has-post').style.display = 'block';
      document.getElementById('bp-title').textContent = post.formattedTitle || 'BytePrep Short';
      document.getElementById('bp-desc').textContent = post.caption || '';

      document.getElementById('bp-copy-all').addEventListener('click', () => {
        const full = (post.formattedTitle || '') + '\\n\\n' + (post.caption || '') + '\\n\\n' + (post.hashtags ? (Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags) : '');
        navigator.clipboard.writeText(full);
        alert('Copied to clipboard!');
      });
    }
  });
});
`;

export const EXTENSION_README_MD = `# BytePrep Social Media Auto-Poster Extension (Manifest V3)

## How to Install in 30 Seconds:

1. **Download & Extract**: Download the \`byteprep-extension.zip\` from BytePrep and unzip the folder to your computer.
2. **Open Extensions in Chrome**:
   - Go to \`chrome://extensions/\` in your Google Chrome or Brave or Edge browser.
3. **Enable Developer Mode**:
   - Toggle the switch for **"Developer mode"** in the top right corner.
4. **Load Unpacked**:
   - Click the **"Load unpacked"** button in the top left.
   - Select the unzipped \`byteprep-extension\` folder.
5. **Done!**
   - Whenever you create or post a video in BytePrep, the extension captures the Title, Description, and Tags.
   - When you open YouTube Studio, Instagram, Facebook Reels, or TikTok, click the floating **"⚡ Auto-Fill"** button to automatically populate all metadata instantly!
`;

/**
 * Generates a ready-to-install ZIP containing all extension files
 */
export const generateExtensionZip = async (): Promise<Blob> => {
  const zip = new JSZip();

  zip.file('manifest.json', JSON.stringify(EXTENSION_MANIFEST, null, 2));
  zip.file('background.js', EXTENSION_BACKGROUND_JS);
  zip.file('content.js', EXTENSION_CONTENT_JS);
  zip.file('popup.html', EXTENSION_POPUP_HTML);
  zip.file('popup.js', EXTENSION_POPUP_JS);
  zip.file('README.md', EXTENSION_README_MD);

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
};
