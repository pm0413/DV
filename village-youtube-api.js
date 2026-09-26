/* Shared YouTube IFrame API loader for BGM and ambient audio. */
(() => {
  'use strict';
  let pending = null;
  window.dowonLoadYouTubeApi = function () {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (pending) return pending;
    pending = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      let script = existing;
      let timeout;
      function cleanup() { clearTimeout(timeout); script?.removeEventListener('error', failed); }
      function ready() {
        if (typeof previous === 'function') {
          try { previous(); } catch (error) { console.warn('기존 YouTube 준비 콜백 오류:', error); }
        }
        if (!window.YT?.Player) return failed();
        cleanup(); resolve(window.YT);
      }
      function failed() {
        cleanup();
        if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = previous;
        if (script && script.parentNode) script.remove();
        pending = null;
        reject(new Error('YouTube IFrame API를 불러오지 못했습니다.'));
      }
      window.onYouTubeIframeAPIReady = ready;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
      }
      script.addEventListener('error', failed, {once:true});
      if (!existing) document.head.appendChild(script);
      timeout = setTimeout(() => { if (window.YT?.Player) ready(); else failed(); }, 15000);
    });
    return pending;
  };
})();
