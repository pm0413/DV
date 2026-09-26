/* 기존 게임 디자인을 유지하면서 상단 설정 팝업과 시간 정지 버튼 연결 */
(() => {
  'use strict';
  const dialog = document.getElementById('save-transfer-dialog');
  const tabs = {
    general: document.getElementById('settings-tab-general'),
    backup: document.getElementById('settings-tab-backup')
  };
  const panels = {
    general: document.getElementById('settings-panel-general'),
    backup: document.getElementById('settings-panel-backup')
  };
  const pauseButton = document.getElementById('settings-pause-time');
  const pauseStatus = document.getElementById('settings-pause-status');
  if (!dialog || !tabs.general || !tabs.backup || !panels.general || !panels.backup || !pauseButton || !pauseStatus) return;

  function selectTab(name) {
    if (!Object.hasOwn(tabs, name)) return;
    for (const key of Object.keys(tabs)) {
      const active = key === name;
      tabs[key].classList.toggle('is-active', active);
      tabs[key].setAttribute('aria-selected', String(active));
      tabs[key].tabIndex = active ? 0 : -1;
      panels[key].hidden = !active;
    }
  }
  window.dowonOpenSettingsTab = selectTab;
  for (const key of Object.keys(tabs)) {
    tabs[key].addEventListener('click', () => selectTab(key));
    tabs[key].addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 'general' : event.key === 'End' ? 'backup' : key === 'general' ? 'backup' : 'general';
      selectTab(next);
      tabs[next].focus();
    });
  }
  function updatePauseButton() {
    const paused = Boolean(window.dowonClock?.isPaused?.());
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.textContent = paused ? '시간 다시 흐르게' : '시간 멈추기';
    pauseStatus.textContent = paused ? '현재 게임 시각에서 멈춰 있습니다.' : '게임 시간이 흐르고 있습니다.';
  }
  pauseButton.addEventListener('click', () => {
    const clock = window.dowonClock;
    if (!clock?.setPaused) {
      pauseStatus.textContent = '게임 시계 기능을 찾을 수 없습니다.';
      return;
    }
    if (!clock.setPaused(!clock.isPaused())) {
      pauseStatus.textContent = '게임 시간 전환이 진행 중입니다. 잠시 뒤 다시 시도해 주세요.';
      return;
    }
    updatePauseButton();
  });
  document.addEventListener('dowon:clockpausechange', updatePauseButton);
  updatePauseButton();
  selectTab('general');
})();
