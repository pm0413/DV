/* 가공소 반응형 슬롯: 숨긴 칸의 제작 데이터와 DOM 순서는 유지합니다. */
(() => {
  const CELL = 32, GAP = 4;
  const rows = [...document.querySelectorAll('#workshop-list .workshop-production')];
  const schedule = new Set();
  let frame = 0;
  function update(row) {
    const slots = row.querySelector('[id$="-slots"]');
    const viewport = row.querySelector('.workshop-slot-viewport');
    if (!slots || !viewport) return;
    const cells = [...slots.children].filter(el => el.classList.contains('chopper-slot'));
    if (!cells.length) return;
    // 버튼이 가진 실제 너비를 뺀 나머지에서 32px 슬롯이 몇 칸 들어가는지 계산합니다.
    const capacity = Math.max(1, Math.min(6, Math.floor((viewport.clientWidth + GAP) / (CELL + GAP))));
    // 폭이 줄면 오른쪽 슬롯부터 숨깁니다. 제작 상태와 관계없이 줄바꿈하지 않으며,
    // 제작 버튼과 가장 왼쪽 1번 슬롯은 항상 남깁니다. 숨겨진 슬롯의 데이터/진행 상태는 유지됩니다.
    cells.forEach((cell, i) => { cell.hidden = i >= capacity; });
    slots.style.setProperty('--nakwon-visible-columns', Math.min(capacity, cells.length));
    slots.classList.remove('nakwon-slots-wrapped');
  }
  function request(row) {
    schedule.add(row);
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      for (const target of schedule) update(target);
      schedule.clear();
    });
  }
  const resizer = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
    entries.forEach(entry => request(entry.target.closest('.workshop-production')));
  }) : null;
  rows.forEach(row => {
    const slots = row.querySelector(':scope > [id$="-slots"]');
    if (!slots) return;
    const navigator = document.createElement('div');
    navigator.className = 'workshop-slot-navigator nakwon-adaptive-navigator';
    const viewport = document.createElement('div');
    viewport.className = 'workshop-slot-viewport nakwon-adaptive-viewport';
    slots.before(navigator);
    navigator.appendChild(viewport);
    viewport.appendChild(slots);
    const observer = new MutationObserver(() => request(row));
    observer.observe(slots, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
    resizer?.observe(row);
    resizer?.observe(viewport);
    request(row);
  });
  window.addEventListener('resize', () => rows.forEach(request));
})();
