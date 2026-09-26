(() => {
  'use strict';

  const palette = document.getElementById('crop-palette');
  if (!palette) return;

  const isNarrow = () => window.innerWidth <= 1100;
  const canScroll = () => palette.scrollWidth > palette.clientWidth + 2;
  const isFinePointer = () => window.matchMedia?.('(pointer:fine)').matches;

  const refresh = () => {
    palette.classList.toggle('crop-pan-ready', !!(isNarrow() && canScroll() && isFinePointer()));
  };

  // 좁은 PC에서는 세로 휠도 작물 줄의 좌우 이동으로 사용할 수 있습니다.
  // 트랙패드의 deltaX는 그대로 존중합니다.
  palette.addEventListener('wheel', (event) => {
    if (!isNarrow() || !canScroll()) return;

    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    const delta = horizontal ? event.deltaX : event.deltaY;
    if (!delta) return;

    const before = palette.scrollLeft;
    palette.scrollLeft += delta;
    if (palette.scrollLeft !== before) event.preventDefault();
  }, { passive:false });

  // 작물 아이콘은 기존 '끌어서 심기'를 그대로 사용합니다.
  // 대신 선택줄의 패딩/아이콘 사이 빈 공간을 잡으면 마우스로 좌우 드래그할 수 있습니다.
  let drag = null;
  palette.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.pointerType === 'touch') return;
    if (!isNarrow() || !canScroll()) return;
    if (event.target.closest('.crop-option')) return;

    drag = {
      pointerId:event.pointerId,
      startX:event.clientX,
      startScroll:palette.scrollLeft
    };
    palette.classList.add('crop-pan-dragging');
    try { palette.setPointerCapture(event.pointerId); } catch (_) {}
    event.preventDefault();
  });

  palette.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    palette.scrollLeft = drag.startScroll - (event.clientX - drag.startX);
    event.preventDefault();
  });

  const endDrag = (event) => {
    if (!drag || (event?.pointerId != null && event.pointerId !== drag.pointerId)) return;
    try { palette.releasePointerCapture(drag.pointerId); } catch (_) {}
    drag = null;
    palette.classList.remove('crop-pan-dragging');
  };
  palette.addEventListener('pointerup', endDrag);
  palette.addEventListener('pointercancel', endDrag);
  palette.addEventListener('lostpointercapture', endDrag);

  window.addEventListener('resize', refresh);
  window.addEventListener('load', refresh, {once:true});
  new MutationObserver(refresh).observe(palette, {attributes:true, attributeFilter:['class']});
  refresh();
})();
