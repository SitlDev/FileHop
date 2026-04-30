(() => {
  'use strict';

  const SIDEBAR_ID = 'videorail-sidebar';
  const TOGGLE_ID = 'videorail-toggle';
  const SIDEBAR_WIDTH = '340px';

  // ── Message listener from popup ──────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'toggle') toggleSidebar();
  });

  // ── Main toggle ──────────────────────────────────────────────────────────
  function toggleSidebar() {
    const existing = document.getElementById(SIDEBAR_ID);
    if (existing) {
      destroySidebar();
    } else {
      buildSidebar();
    }
  }

  function destroySidebar() {
    const sidebar = document.getElementById(SIDEBAR_ID);
    const toggle  = document.getElementById(TOGGLE_ID);
    if (sidebar) sidebar.remove();
    if (toggle)  toggle.remove();
    document.documentElement.style.marginRight = '';
    document.documentElement.style.transition  = '';
  }

  // ── Build sidebar ─────────────────────────────────────────────────────────
  function buildSidebar() {
    const videos = collectVideos();

    // Tab to open sidebar even when collapsed
    const toggleTab = document.createElement('div');
    toggleTab.id = TOGGLE_ID;
    toggleTab.innerHTML = `
      <span class="vr-tab-icon">▶</span>
      <span class="vr-tab-label">Videos</span>
      ${videos.length ? `<span class="vr-tab-count">${videos.length}</span>` : ''}
    `;
    toggleTab.addEventListener('click', () => {
      const sb = document.getElementById(SIDEBAR_ID);
      if (sb) {
        const hidden = sb.classList.toggle('vr-hidden');
        document.documentElement.style.marginRight = hidden ? '0' : SIDEBAR_WIDTH;
      }
    });
    document.body.appendChild(toggleTab);

    // Sidebar shell
    const sidebar = document.createElement('div');
    sidebar.id = SIDEBAR_ID;

    sidebar.innerHTML = `
      <div class="vr-header">
        <div class="vr-header-left">
          <span class="vr-logo">▶</span>
          <span class="vr-title">VideoRail</span>
        </div>
        <div class="vr-header-right">
          <span class="vr-count">${videos.length} video${videos.length !== 1 ? 's' : ''}</span>
          <button class="vr-close" title="Close sidebar">✕</button>
        </div>
      </div>

      <div class="vr-player-wrap" id="vr-player-wrap" style="display:none">
        <div class="vr-player-header">
          <span class="vr-player-title" id="vr-player-title">Now Playing</span>
          <button class="vr-player-close" id="vr-player-close">↩ Back</button>
        </div>
        <div class="vr-player-box" id="vr-player-box"></div>
        <div class="vr-player-meta" id="vr-player-meta"></div>
      </div>

      <div class="vr-list" id="vr-list">
        ${videos.length === 0 ? renderEmpty() : videos.map((v, i) => renderCard(v, i)).join('')}
      </div>

      <div class="vr-footer">
        <button class="vr-refresh" id="vr-refresh">↻ Rescan page</button>
      </div>
    `;

    document.body.appendChild(sidebar);

    // Push page content
    document.documentElement.style.transition = 'margin-right 0.3s ease';
    document.documentElement.style.marginRight = SIDEBAR_WIDTH;

    // Wire events
    sidebar.querySelector('.vr-close').addEventListener('click', destroySidebar);
    sidebar.querySelector('#vr-refresh').addEventListener('click', refreshList);
    sidebar.querySelector('#vr-player-close').addEventListener('click', closePlayer);

    sidebar.querySelectorAll('.vr-card').forEach((card, i) => {
      card.addEventListener('click', () => playVideo(videos[i], card));
    });
  }

  // ── Video collection ──────────────────────────────────────────────────────
  function collectVideos() {
    const found = [];
    const seen  = new Set();

    const add = (entry) => {
      const key = entry.src || entry.pageUrl || JSON.stringify(entry.title).slice(0,60);
      if (!key || seen.has(key)) return;
      seen.add(key);
      found.push(entry);
    };

    // ── 1. Native <video> elements (including inside shadow DOM) ────────────
    const allVideos = [...document.querySelectorAll('video')];
    // Walk shadow roots
    document.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) {
        el.shadowRoot.querySelectorAll('video').forEach(v => allVideos.push(v));
      }
    });

    allVideos.forEach(el => {
      const src = resolveVideoSrc(el);
      add({
        type:     'native',
        el,
        src,
        title:    el.title || el.getAttribute('aria-label') || nearbyTitle(el) || `Video ${found.length + 1}`,
        thumb:    el.poster || dataAttrThumb(el) || null,
        duration: el.duration && !isNaN(el.duration) ? formatDur(el.duration) : dataDuration(el),
      });
    });

    // ── 2. HLS / DASH / MP4 streams hidden in data-* attributes ────────────
    const streamAttrPatterns = [
      'data-src', 'data-video-src', 'data-hls', 'data-hls-src', 'data-stream',
      'data-mp4', 'data-file', 'data-url', 'data-video', 'data-source',
      'data-manifest', 'data-dash', 'data-m3u8',
    ];
    document.querySelectorAll('[' + streamAttrPatterns.join('],[') + ']').forEach(el => {
      if (el.tagName === 'VIDEO') return; // already handled
      streamAttrPatterns.forEach(attr => {
        const val = el.getAttribute(attr) || '';
        if (!isVideoUrl(val)) return;
        const thumb = dataAttrThumb(el) || nearbyThumb(el);
        add({
          type:     'native-lazy',
          el,
          src:      val,
          title:    dataAttrTitle(el) || nearbyTitle(el) || `Video ${found.length + 1}`,
          thumb,
          duration: dataDuration(el),
        });
      });
    });

    // ── 3. HLS / MP4 URLs extracted from inline <script> tags ───────────────
    extractScriptStreams().forEach(entry => add(entry));

    // ── 4. Video listing cards (thumbnail grids on browse/search pages) ──────
    extractListingCards().forEach(entry => add(entry));

    // ── 5. Iframes ───────────────────────────────────────────────────────────
    document.querySelectorAll('iframe').forEach(el => {
      const src = el.src || el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || '';
      if (!src) return;

      // YouTube
      if (/youtube\.com\/embed|youtu\.be/.test(src)) {
        const vidId = extractYTId(src);
        add({
          type: 'iframe', el,
          src: autoplayYT(src), origSrc: src,
          title: el.title || el.getAttribute('aria-label') || nearbyTitle(el) || 'YouTube Video',
          thumb: vidId ? `https://img.youtube.com/vi/${vidId}/mqdefault.jpg` : null,
        });
        return;
      }

      // Known embed platforms
      const platforms = [
        { re: /vimeo\.com/,       label: 'Vimeo' },
        { re: /loom\.com/,        label: 'Loom' },
        { re: /wistia\.com/,      label: 'Wistia' },
        { re: /vidyard\.com/,     label: 'Vidyard' },
        { re: /dailymotion\.com/, label: 'Dailymotion' },
        { re: /twitch\.tv/,       label: 'Twitch' },
        { re: /rumble\.com/,      label: 'Rumble' },
        { re: /odysee\.com/,      label: 'Odysee' },
        { re: /bitchute\.com/,    label: 'BitChute' },
        { re: /embed\./,          label: 'Embed' },
        { re: /player\./,         label: 'Player' },
      ];

      const match = platforms.find(p => p.re.test(src));
      if (match) {
        add({
          type: 'iframe', el, src, origSrc: src,
          title: el.title || nearbyTitle(el) || `${match.label} Video`,
          thumb: dataAttrThumb(el) || nearbyThumb(el) || null,
        });
      }
    });

    return found;
  }

  // ── Extract streams from inline scripts ────────────────────────────────────
  function extractScriptStreams() {
    const results = [];
    const seen = new Set();
    // Match m3u8, mpd, or mp4 URLs in script content
    const urlRe = /["'`](https?:\/\/[^"'`\s]{8,}\.(?:m3u8|mpd|mp4|webm)[^"'`\s]*?)["'`]/g;
    // Also match key:value patterns like "src":"https://..."
    document.querySelectorAll('script:not([src])').forEach(s => {
      let m;
      while ((m = urlRe.exec(s.textContent)) !== null) {
        const url = m[1];
        if (seen.has(url)) continue;
        seen.add(url);
        // Try to find a nearby title hint from variable names
        const titleHint = extractJsonTitle(s.textContent, url);
        results.push({
          type: 'native-lazy',
          el: null,
          src: url,
          title: titleHint || `Stream ${results.length + 1}`,
          thumb: extractJsonThumb(s.textContent, url),
          duration: null,
          fromScript: true,
        });
      }
    });
    return results;
  }

  // ── Extract video listing cards from browse/search/grid pages ──────────────
  function extractListingCards() {
    const results = [];
    // Common selectors for video card/thumb links across video sites
    const cardSelectors = [
      'a[href*="/video"]',
      'a[href*="/watch"]',
      'a[href*="/v/"]',
      'a[href*="/embed"]',
      '[class*="video-item"] a',
      '[class*="video-card"] a',
      '[class*="videocard"] a',
      '[class*="thumb"] a',
      '[class*="thumbnail"] a',
      '[class*="pcVideoListItem"] a',
      '[class*="video_item"] a',
      '[class*="videoLink"]',
      '[data-video-id]',
      '[data-vkey]',
    ];

    const seen = new Set();
    document.querySelectorAll(cardSelectors.join(',')).forEach(el => {
      // Must have a thumbnail image and a title to be a valid card
      const img = el.querySelector('img') ||
                  el.closest('[class*="item"],[class*="card"],[class*="thumb"]')?.querySelector('img');
      const thumb = img?.src || img?.getAttribute('data-src') || img?.getAttribute('data-lazy') || null;
      if (!thumb || !isImageUrl(thumb)) return;

      const pageUrl = el.href || el.getAttribute('data-href') || '';
      if (!pageUrl || pageUrl === '#' || pageUrl === window.location.href) return;
      if (seen.has(pageUrl)) return;
      seen.add(pageUrl);

      // Title candidates
      const title =
        el.getAttribute('title') ||
        el.querySelector('[class*="title"],[class*="name"],[class*="label"]')?.textContent?.trim() ||
        img?.getAttribute('alt') ||
        el.getAttribute('aria-label') ||
        '';
      if (!title) return;

      // Duration from overlay badge
      const durEl = el.querySelector(
        '[class*="duration"],[class*="time"],[class*="length"],[class*="runtime"]'
      );
      const duration = durEl?.textContent?.trim() || null;

      results.push({
        type: 'listing-card',
        el,
        src: null,
        pageUrl,
        title: title.trim().slice(0, 120),
        thumb,
        duration,
      });
    });

    return results;
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  function renderEmpty() {
    return `
      <div class="vr-empty">
        <div class="vr-empty-icon">⬜</div>
        <div class="vr-empty-msg">No videos detected on this page.</div>
        <div class="vr-empty-sub">Try scrolling to load lazy content, then rescan.</div>
      </div>
    `;
  }

  function renderCard(v, i) {
    const thumbStyle = v.thumb
      ? `background-image:url('${v.thumb}');background-size:cover;background-position:center`
      : '';
    const badge = v.type === 'native' ? 'HTML5'
                : v.type === 'native-lazy' ? (v.src?.includes('.m3u8') ? 'HLS' : v.src?.includes('.mpd') ? 'DASH' : 'Stream')
                : v.type === 'listing-card' ? 'Card'
                : domainBadge(v.src);
    return `
      <div class="vr-card" data-index="${i}">
        <div class="vr-thumb" style="${thumbStyle}">
          ${!v.thumb ? `<span class="vr-thumb-icon">🎬</span>` : ''}
          <div class="vr-play-overlay"><span class="vr-play-btn">▶</span></div>
          ${v.duration ? `<span class="vr-duration">${v.duration}</span>` : ''}
        </div>
        <div class="vr-card-info">
          <div class="vr-card-title">${escHtml(v.title)}</div>
          <div class="vr-card-meta">
            <span class="vr-badge">${badge}</span>
          </div>
        </div>
      </div>
    `;
  }

  // ── Playback ──────────────────────────────────────────────────────────────
  function playVideo(v, cardEl) {
    // Highlight active card
    document.querySelectorAll('.vr-card').forEach(c => c.classList.remove('vr-active'));
    cardEl.classList.add('vr-active');

    const wrap  = document.getElementById('vr-player-wrap');
    const box   = document.getElementById('vr-player-box');
    const title = document.getElementById('vr-player-title');
    const list  = document.getElementById('vr-list');
    const meta  = document.getElementById('vr-player-meta');

    box.innerHTML   = '';
    title.textContent = v.title;
    wrap.style.display = 'block';
    list.classList.add('vr-list-compact');

    if (v.type === 'listing-card') {
      const iframe = document.createElement('iframe');
      iframe.src = v.pageUrl;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:6px;';
      box.appendChild(iframe);
      meta.textContent = shortenUrl(v.pageUrl);
    } else if (v.type === 'native' || v.type === 'native-lazy') {
      if (v.src && isVideoUrl(v.src)) {
        const vid = document.createElement('video');
        vid.src = v.src;
        vid.controls = true;
        vid.autoplay = true;
        vid.style.cssText = 'width:100%;border-radius:6px;display:block;';
        box.appendChild(vid);
        meta.textContent = shortenUrl(v.src);
      } else if (v.el) {
        const clone = v.el.cloneNode(true);
        clone.controls = true;
        clone.autoplay = true;
        clone.style.cssText = 'width:100%;border-radius:6px;display:block;';
        box.appendChild(clone);
        meta.textContent = v.src ? shortenUrl(v.src) : '';
      }
    } else {
      const iframe = document.createElement('iframe');
      iframe.src = v.src;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:6px;';
      box.appendChild(iframe);
      meta.textContent = shortenUrl(v.origSrc || v.src);
    }

    wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closePlayer() {
    const wrap = document.getElementById('vr-player-wrap');
    const list = document.getElementById('vr-list');
    if (wrap) wrap.style.display = 'none';
    if (list) list.classList.remove('vr-list-compact');
    document.querySelectorAll('.vr-card').forEach(c => c.classList.remove('vr-active'));
    document.getElementById('vr-player-box').innerHTML = '';
  }

  function refreshList() {
    const list = document.getElementById('vr-list');
    const header = document.querySelector('.vr-count');
    closePlayer();
    const videos = collectVideos();
    list.innerHTML = videos.length === 0 ? renderEmpty() : videos.map(renderCard).join('');
    if (header) header.textContent = `${videos.length} video${videos.length !== 1 ? 's' : ''}`;
    list.querySelectorAll('.vr-card').forEach((card, i) => {
      card.addEventListener('click', () => playVideo(videos[i], card));
    });
    // Flash
    list.style.opacity = '0.4';
    setTimeout(() => list.style.opacity = '1', 200);
  }

  // ── Utils ─────────────────────────────────────────────────────────────────

  function resolveVideoSrc(el) {
    if (el.currentSrc && el.currentSrc !== '') return el.currentSrc;
    if (el.src) return el.src;
    // <source> children
    const source = el.querySelector('source[src]');
    if (source) return source.src;
    // data-* fallbacks
    const dataAttrs = ['data-src','data-video-src','data-hls','data-stream','data-mp4','data-url','data-file'];
    for (const a of dataAttrs) {
      const v = el.getAttribute(a);
      if (v && isVideoUrl(v)) return v;
    }
    return '';
  }

  function isVideoUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return /\.(mp4|webm|ogg|ogv|m3u8|mpd|mov|avi|flv|ts)([\?#]|$)/i.test(url) ||
           /\/manifest\//i.test(url) ||
           /(hls|dash|stream|video|media)/i.test(url) && url.startsWith('http');
  }

  function isImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return /\.(jpg|jpeg|png|webp|gif|avif)([\?#]|$)/i.test(url) || url.startsWith('data:image');
  }

  function dataAttrThumb(el) {
    const attrs = ['data-thumb','data-thumbnail','data-poster','data-preview',
                   'data-image','data-img','data-cover','data-screenshot'];
    for (const a of attrs) {
      const v = el.getAttribute(a);
      if (v && isImageUrl(v)) return v;
    }
    return null;
  }

  function dataAttrTitle(el) {
    const attrs = ['data-title','data-name','data-video-title','data-label','title'];
    for (const a of attrs) {
      const v = el.getAttribute(a);
      if (v && v.length > 1 && v.length < 150) return v;
    }
    return null;
  }

  function dataDuration(el) {
    const attrs = ['data-duration','data-length','data-runtime','data-time'];
    for (const a of attrs) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const n = parseFloat(v);
      if (!isNaN(n) && n > 0) return formatDur(n);
      if (/\d+:\d+/.test(v)) return v.trim();
    }
    return null;
  }

  function nearbyThumb(el) {
    const container = el.closest('[class*="item"],[class*="card"],[class*="wrap"],[class*="thumb"],[class*="video"]');
    if (!container) return null;
    const img = container.querySelector('img[src],img[data-src],img[data-lazy]');
    return img?.src || img?.getAttribute('data-src') || img?.getAttribute('data-lazy') || null;
  }

  function nearbyTitle(el) {
    const candidates = [
      el.closest('[aria-label]')?.getAttribute('aria-label'),
      el.closest('figure')?.querySelector('figcaption')?.textContent?.trim(),
      // Broader container search with common class patterns
      el.closest([
        'article','section',
        '[class*="video-container"],[class*="video-wrap"],[class*="embed-container"]',
        '[class*="video-item"],[class*="video-card"],[class*="videocard"]',
        '[class*="player-container"],[class*="player-wrap"]',
      ].join(','))?.querySelector('h1,h2,h3,h4,[class*="title"],[class*="name"]')?.textContent?.trim(),
      // Page-level title as last resort for single-video pages
      document.querySelector('h1')?.textContent?.trim(),
    ];
    return candidates.find(c => c && c.length > 1 && c.length < 120) || '';
  }

  // Try to find a title near a URL in inline script JSON blobs
  function extractJsonTitle(scriptText, url) {
    const urlEscaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Look backwards from the URL for a "title" key within ~200 chars
    const idx = scriptText.indexOf(url);
    if (idx === -1) return null;
    const context = scriptText.slice(Math.max(0, idx - 300), idx + 100);
    const m = context.match(/["'](?:title|name|label|video_title)["']\s*:\s*["']([^"']{2,120})["']/i);
    return m ? m[1] : null;
  }

  function extractJsonThumb(scriptText, url) {
    const idx = scriptText.indexOf(url);
    if (idx === -1) return null;
    const context = scriptText.slice(Math.max(0, idx - 400), idx + 200);
    const m = context.match(/["'](?:thumb|thumbnail|poster|image|preview|screenshot)["']\s*:\s*["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
    return m ? m[1] : null;
  }

  function extractYTId(src) {
    const m = src.match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function autoplayYT(src) {
    try {
      const u = new URL(src);
      u.searchParams.set('autoplay', '1');
      u.searchParams.set('enablejsapi', '1');
      return u.toString();
    } catch { return src; }
  }

  function domainBadge(src) {
    try {
      const h = new URL(src).hostname.replace('www.', '');
      const map = {
        'youtube.com': 'YouTube', 'youtu.be': 'YouTube',
        'vimeo.com': 'Vimeo', 'loom.com': 'Loom',
        'wistia.com': 'Wistia', 'vidyard.com': 'Vidyard',
        'dailymotion.com': 'Dailymotion', 'twitch.tv': 'Twitch',
        'rumble.com': 'Rumble',
      };
      if (src.endsWith('.m3u8') || src.includes('.m3u8?')) return 'HLS';
      if (src.endsWith('.mpd')  || src.includes('.mpd?'))  return 'DASH';
      return map[h] || h.split('.').slice(-2, -1)[0] || 'Video';
    } catch { return 'Video'; }
  }

  function formatDur(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${m}:${String(sec).padStart(2,'0')}`;
  }

  function shortenUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url);
      return u.hostname + (u.pathname.length > 30 ? u.pathname.slice(0, 30) + '…' : u.pathname);
    } catch { return url.slice(0, 50); }
  }

  function escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
