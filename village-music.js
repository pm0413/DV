/* LifeSim 방식: 보이지 않는 YouTube IFrame API 플레이어로 배경음만 출력 */
(() => {
  'use strict';
  const button = document.getElementById('music-toggle');
  const mount = document.getElementById('youtube-bgm-player');
  if (!button || !mount) return;
  // 사계절 모두 낮/밤 동일한 곡을 사용합니다. 여름 밤 전용 곡은 재생하지 않습니다.
  const tracks = { summer: 'Kaj8ncVH6qM', spring: '8OLf-uHHdK4', autumn: 'F4d5tO2DsXQ', winter: 'zMH3yr0ChhA' };
  const PREF = 'dowon-audio-bgm-enabled-v1';
  const POSITION = 'dowon-audio-bgm-position-v1';
  const saved = (key) => { try { return localStorage.getItem(key); } catch (_) { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, String(value)); } catch (_) {} };
  let enabled = saved(PREF) === 'true';
  let awaitingGesture = false;
  let desiredPosition = null;
  try { const previous = JSON.parse(saved(POSITION) || 'null');
    if (previous && tracks[previous.track] && Number.isFinite(previous.second) && previous.second >= 0)
      desiredPosition = previous;
  } catch (_) {}

  let player = null;
  let current = '';
  let ready = false;

  function timeTrack() {
    const season = window.dowonSeasons?.get?.()?.season || 'summer';
    return tracks[season] ? season : 'summer';
  }
  function setButton() {
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', enabled ? '배경음 끄기' : '배경음 켜기');
    button.title = enabled ? '배경음 끄기' : '배경음 켜기';
    const label = button.querySelector('.music-button-label');
    if (label) label.textContent = '배경음';
    const glyph = button.querySelector('.music-button-icon');
    if (glyph) glyph.textContent = enabled ? 'music_note' : 'music_off';
  }
  function selectTrack(force = false) {
    if (!enabled || !ready || !player) return;
    const target = timeTrack();
    if (!force && current === target) return;
    // 디버그 계절 미리보기에도 곡을 즉시 전환합니다.
    current = target;
    try {
      const resume = desiredPosition?.track === target ? desiredPosition.second : 0;
      desiredPosition = null;
      player.loadVideoById({videoId: tracks[target], startSeconds: resume});
      player.setVolume(20);
      player.playVideo();
      // Automatically resumed videos may be blocked until the user's next gesture.
      awaitingGesture = true;
    }
    catch (error) { console.warn('배경음 전환 실패:', error); }
  }
  function makePlayer() {
    if (!enabled || player || !window.YT?.Player) return;
    // Old YT iframe may remain when turning back on; replace the container safely.
    mount.replaceChildren();
    ready = false;
    player = new window.YT.Player('youtube-bgm-player', {
      height: '200', width: '200',
      playerVars: { playsinline: 1, controls: 0, loop: 1, disablekb: 1, rel: 0 },
      events: {
        onReady(event) {
          ready = true;
          event.target.setVolume(20);
          selectTrack(true);
        },
        onStateChange(event) {
          if (event.data === window.YT.PlayerState.PLAYING) awaitingGesture = false;
          if (enabled && event.data === window.YT.PlayerState.ENDED) {
            try { player.seekTo(0, true); player.playVideo(); } catch (_) {}
          }
        },
        onAutoplayBlocked() { awaitingGesture = true; },
        onError(event) { console.warn('유튜브 배경음 재생 제한 또는 오류:', event.data); }
      }
    });
  }
  function loadApi() {
    window.dowonLoadYouTubeApi().then(() => {
      if (enabled) makePlayer();
    }).catch(error => console.warn('배경음 API 로딩 실패:', error));
  }
  button.addEventListener('click', () => {
    enabled = !enabled;
    save(PREF, enabled);
    setButton();
    if (enabled) {
      if (player && ready) { selectTrack(); player.playVideo(); awaitingGesture = true; }
      else loadApi();
    } else if (player && ready) {
      player.pauseVideo();
      awaitingGesture = false;
    }
  });
  document.addEventListener('dowon:timechange', () => selectTrack());
  document.addEventListener('dowon:seasonchange', () => selectTrack());
  // 다른 시간 스크립트 버전에서도 18:00 전환을 놓치지 않도록 정기적으로 확인.
  window.setInterval(() => {
    selectTrack();
    if (enabled && ready && player && current) {
      try {
        const second = player.getCurrentTime();
        if (Number.isFinite(second) && second >= 0) save(POSITION, JSON.stringify({track:current,second}));
      } catch (_) {}
    }
  }, 1000);
  // Preserve the last playback position on refresh, including right before unloading.
  window.addEventListener('pagehide', () => {
    if (window.dowonFullResetInProgress) return;
    if (!enabled || !ready || !player || !current) return;
    try { const second = player.getCurrentTime();
      if (Number.isFinite(second) && second >= 0) save(POSITION, JSON.stringify({track:current,second}));
    } catch (_) {}
  });
  function resumeOnGesture() {
    if (!enabled || !ready || !player || !awaitingGesture) return;
    try { player.playVideo(); } catch (_) {}
  }
  document.addEventListener('pointerdown', resumeOnGesture, {passive:true});
  document.addEventListener('keydown', resumeOnGesture);
  setButton();
  if (enabled) loadApi();
})();
