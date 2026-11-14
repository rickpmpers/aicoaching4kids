/**
 * Selfserved AI — First-Party Web Telemetry & Visitor Flow Engine
 * 
 * High-performance, zero-dependency, privacy-first analytics package.
 * Captures visitor journeys, page flows, clicks, dwell time, and UTM campaigns.
 * Ad-blocker immune, cookie-less, lightweight (<4KB).
 */
(function() {
  'use strict';

  // Determine endpoint: relative /api/telemetry on same origin, or fallback to central selfserved.ai
  var ENDPOINT = window.SF_TELEMETRY_ENDPOINT || '/api/telemetry';
  var startTime = Date.now();
  var activeReadSeconds = 0;
  var lastActiveTime = Date.now();
  var isTabActive = !document.hidden;
  var idleThresholdMs = 30000; // 30s inactivity pauses active reading counter
  var scrollMilestones = { 25: false, 50: false, 75: false, 90: false };
  var maxScrollReached = 0;

  // Session ID (persists within the browser tab session)
  var sessionId = (function() {
    try {
      var sid = sessionStorage.getItem('sf_sid');
      if (!sid) {
        sid = 's_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
        sessionStorage.setItem('sf_sid', sid);
      }
      return sid;
    } catch (e) {
      return 's_' + Math.random().toString(36).substring(2, 10);
    }
  })();

  // Anonymous Visitor ID (persists across visits on same device without cookies)
  var visitorId = (function() {
    try {
      var vid = localStorage.getItem('sf_vid');
      var isReturn = true;
      if (!vid) {
        isReturn = false;
        vid = 'v_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
        localStorage.setItem('sf_vid', vid);
      }
      return { id: vid, is_return: isReturn };
    } catch (e) {
      return { id: 'v_anonymous', is_return: false };
    }
  })();

  // 1. Channel, Origin, and UTM Attribution Engine
  function parseOrigin() {
    var ref = document.referrer || '';
    var urlParams = new URLSearchParams(window.location.search);

    var utm = {
      source: urlParams.get('utm_source') || '',
      medium: urlParams.get('utm_medium') || '',
      campaign: urlParams.get('utm_campaign') || '',
      content: urlParams.get('utm_content') || '',
      term: urlParams.get('utm_term') || ''
    };

    var channel = 'direct';
    var sourceName = 'direct';

    if (utm.source) {
      sourceName = utm.source.toLowerCase();
      if (sourceName.indexOf('linkedin') !== -1) channel = 'linkedin';
      else if (utm.medium === 'cpc' || utm.medium === 'paid') channel = 'paid';
      else if (utm.medium === 'email' || utm.medium === 'newsletter') channel = 'email';
      else channel = 'campaign';
    } else if (ref) {
      try {
        var refHost = new URL(ref).hostname.toLowerCase();

        // Generative AI Engines
        if (refHost.indexOf('chatgpt.com') !== -1 || ref.indexOf('com.openai.chatgpt') !== -1) {
          channel = 'ai_engine';
          sourceName = 'chatgpt';
        } else if (refHost.indexOf('perplexity.ai') !== -1) {
          channel = 'ai_engine';
          sourceName = 'perplexity';
        } else if (refHost.indexOf('claude.ai') !== -1) {
          channel = 'ai_engine';
          sourceName = 'claude';
        } else if (refHost.indexOf('copilot.microsoft.com') !== -1 || (refHost.indexOf('bing.com') !== -1 && ref.indexOf('/chat') !== -1)) {
          channel = 'ai_engine';
          sourceName = 'copilot';
        } else if (refHost.indexOf('gemini.google.com') !== -1) {
          channel = 'ai_engine';
          sourceName = 'gemini';
        } else if (refHost.indexOf('poe.com') !== -1 || refHost.indexOf('grok.com') !== -1 || refHost.indexOf('x.ai') !== -1) {
          channel = 'ai_engine';
          sourceName = 'other_ai';
        }
        // Traditional Search Engines
        else if (refHost.indexOf('google.') !== -1) {
          channel = 'search_engine';
          sourceName = 'google';
        } else if (refHost.indexOf('bing.com') !== -1) {
          channel = 'search_engine';
          sourceName = 'bing';
        } else if (refHost.indexOf('duckduckgo.com') !== -1) {
          channel = 'search_engine';
          sourceName = 'duckduckgo';
        } else if (refHost.indexOf('brave.com') !== -1) {
          channel = 'search_engine';
          sourceName = 'brave';
        } else if (refHost.indexOf('yahoo.') !== -1 || refHost.indexOf('baidu.') !== -1 || refHost.indexOf('yandex.') !== -1) {
          channel = 'search_engine';
          sourceName = 'other_search';
        }
        // Social / Professional
        else if (refHost.indexOf('linkedin.com') !== -1 || refHost.indexOf('lnkd.in') !== -1) {
          channel = 'linkedin';
          sourceName = 'linkedin';
        } else if (refHost.indexOf('t.co') !== -1 || refHost.indexOf('x.com') !== -1 || refHost.indexOf('twitter.com') !== -1) {
          channel = 'social';
          sourceName = 'x_twitter';
        } else if (refHost.indexOf('reddit.com') !== -1) {
          channel = 'social';
          sourceName = 'reddit';
        }
        // Internal Ecosystem Navigation
        else if (refHost === window.location.hostname || refHost.indexOf('selfserved.ai') !== -1) {
          channel = 'internal';
          sourceName = refHost;
        } else {
          channel = 'referral';
          sourceName = refHost;
        }
      } catch (e) {
        channel = 'referral';
        sourceName = ref;
      }
    }

    return { referrer: ref, channel: channel, source: sourceName, utm: utm };
  }

  var originMeta = parseOrigin();

  // 2. Dispatch Beacon
  function sendBeaconEvent(type, extra) {
    var payload = {
      event_type: type,
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      visitor_id: visitorId.id,
      is_return_visitor: visitorId.is_return,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      title: document.title,
      channel: originMeta.channel,
      source: originMeta.source,
      referrer: originMeta.referrer,
      utm_source: originMeta.utm.source,
      utm_medium: originMeta.utm.medium,
      utm_campaign: originMeta.utm.campaign,
      utm_content: originMeta.utm.content,
      viewport_w: window.innerWidth,
      viewport_h: window.innerHeight,
      screen_w: window.screen ? window.screen.width : 0,
      screen_h: window.screen ? window.screen.height : 0,
      active_read_seconds: Math.round(activeReadSeconds),
      total_dwell_seconds: Math.round((Date.now() - startTime) / 1000),
      max_scroll_reached: maxScrollReached
    };

    if (extra) {
      for (var k in extra) {
        if (extra.hasOwnProperty(k)) payload[k] = extra[k];
      }
    }

    try {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, blob);
      } else if (window.fetch) {
        window.fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(function() {});
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', ENDPOINT, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(payload));
      }
    } catch (e) {
      // Fail silently to never impact browsing
    }
  }

  // 3. Pageview
  sendBeaconEvent('page_view', {});

  // 4. Activity & Active Reading Measurement
  function recordUserActivity() {
    lastActiveTime = Date.now();
  }

  ['mousemove', 'scroll', 'keydown', 'touchstart', 'click'].forEach(function(evt) {
    window.addEventListener(evt, recordUserActivity, { passive: true });
  });

  setInterval(function() {
    if (isTabActive && (Date.now() - lastActiveTime < idleThresholdMs)) {
      activeReadSeconds += 1;
    }
  }, 1000);

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      isTabActive = false;
      sendBeaconEvent('engagement_pause', { reason: 'tab_hidden' });
    } else {
      isTabActive = true;
      lastActiveTime = Date.now();
      sendBeaconEvent('engagement_resume', { reason: 'tab_visible' });
    }
  });

  // 5. Scroll Depth Milestones
  function checkScroll() {
    var docHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );
    var winHeight = window.innerHeight;
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var scrollPercent = Math.min(100, Math.round(((scrollTop + winHeight) / docHeight) * 100));

    if (scrollPercent > maxScrollReached) {
      maxScrollReached = scrollPercent;
    }

    [25, 50, 75, 90].forEach(function(milestone) {
      if (scrollPercent >= milestone && !scrollMilestones[milestone]) {
        scrollMilestones[milestone] = true;
        sendBeaconEvent('scroll_depth', { milestone_percent: milestone });
      }
    });
  }

  var scrollDebounce = null;
  window.addEventListener('scroll', function() {
    if (!scrollDebounce) {
      scrollDebounce = setTimeout(function() {
        checkScroll();
        scrollDebounce = null;
      }, 200);
    }
  }, { passive: true });

  // 6. Navigation Routes, Flow Clicks & CTA Tracking
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    var button = e.target.closest('button, .btn, [role="button"], [data-cta]');

    if (link && link.href) {
      var dest = link.href;
      var linkText = (link.innerText || link.getAttribute('aria-label') || link.title || '').trim().substring(0, 80);
      var isExternal = link.hostname && link.hostname !== window.location.hostname && link.hostname.indexOf('selfserved.ai') === -1;

      sendBeaconEvent(isExternal ? 'exit_click' : 'navigation_click', {
        destination_url: dest,
        destination_host: link.hostname || '',
        destination_path: link.pathname || '',
        link_text: linkText,
        is_external: isExternal
      });
    } else if (button) {
      var btnText = (button.innerText || button.getAttribute('aria-label') || button.id || '').trim().substring(0, 80);
      sendBeaconEvent('cta_click', {
        element_id: button.id || '',
        element_class: button.className || '',
        element_text: btnText
      });
    }
  });

  // 7. Page Exit / Unload Beacon
  window.addEventListener('pagehide', function() {
    sendBeaconEvent('page_exit', {
      max_scroll_reached: maxScrollReached
    });
  });

})();
