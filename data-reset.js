/* 배포용 저장 데이터 완전 초기화. 디버그 메뉴와 독립적으로 동작합니다. */
(() => {
  'use strict';

  const RESET_MARKER = '__dangcheong_dowon_full_reset_pending__';
  const IMPORT_CLOCK_KEY = '__dangcheong_dowon_clock_import_pending__';
  const DEBUG_ONLY_KEYS = ['dangcheong-dowon-debug-free-craft-v1', 'dangcheong-dowon-debug-workshop-backup-v1'];

  // 예전 개발본에서 남은 디버그 상태가 배포본 플레이에 섞이지 않게 항상 제거합니다.
  try { for (const key of DEBUG_ONLY_KEYS) localStorage.removeItem(key); } catch (_) {}

  const button = document.getElementById('settings-reset-all');
  if (!button) return;

  const warning = [
    '도화마을의 모든 저장 데이터를 삭제합니다.',
    '',
    '주민 이름·이미지·설정 및 주민 주문판 등록 정보까지 전부 삭제됩니다.',
    '밭·작물·창고·동전·가구·쾌적도·가공소 해금,',
    '호감도·고양이·업적·날짜·계절·날씨·음악 설정도 초기화됩니다.',
    '',
    '삭제한 데이터는 복원할 수 없습니다.',
    '필요하다면 설정 > 백업 탭에서 먼저 내보내세요.',
    '',
    '정말 모든 게임 데이터를 삭제할까요?'
  ].join('\n');

  button.addEventListener('click', () => {
    if (!window.confirm(warning)) return;

    // 페이지를 떠나는 순간 각 모듈이 현재 상태를 다시 저장하지 않도록 먼저 차단합니다.
    window.dowonFullResetInProgress = true;

    try {
      // 가져오기 직후 시계를 한 번 복원하는 세션 플래그는 사용자 head의 접두어 대상이 아니므로 선삭제합니다.
      sessionStorage.removeItem(IMPORT_CLOCK_KEY);
      // 실제 게임 데이터 삭제는 다음 문서의 <head>가 게임 스크립트보다 먼저 수행합니다.
      localStorage.setItem(RESET_MARKER, '1');
      window.location.reload();
    } catch (error) {
      window.dowonFullResetInProgress = false;
      console.error('도화마을 저장 데이터 초기화 준비 실패', error);
      window.alert('저장 데이터를 삭제하지 못했습니다. 브라우저 저장소 사용 권한을 확인한 뒤 다시 시도해 주세요.');
    }
  });
})();
