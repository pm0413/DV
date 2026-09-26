/* 작물 PNG가 아직 포함되지 않았을 때 깨진 이미지 대신 임시 아이콘을 표시합니다.
 * 사용자가 item/작물 폴더에 원본 PNG를 추가하면 별도 수정 없이 실제 이미지가 표시됩니다. */
(() => {
  const icons = { '밀':'🌾', '벼':'🌾', '배추':'🥬', '고추':'🌶️', '감자':'🥔', '콩':'🫘', '사탕수수':'🌱', '작물':'🌱', '새싹':'🌱', '닭 사료':'🌾', '달걀':'🥚', '설탕':'🍬', '떡가루':'🍚','계란전':'🍳','절임채소':'🥬','유부':'🍢','소금달걀':'🥚' };
  function fallback(event) {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.getAttribute('src')?.includes('item/작물/')) return;
    if (img.dataset.imageFallbackApplied) return;
    img.dataset.imageFallbackApplied = 'true';
    let filename;
    try { filename = decodeURIComponent(new URL(img.src, document.baseURI).pathname.split('/').pop()); }
    catch { filename = img.getAttribute('src').split('/').pop(); }
    const key = filename.replace(/\.png$/i,'');
    const span = document.createElement('span');
    span.className = 'missing-crop-icon';
    span.textContent = icons[key] || '🌱';
    span.setAttribute('role','img');
    span.setAttribute('aria-label', img.alt || key);
    img.replaceWith(span);
  }
  document.addEventListener('error', fallback, true);
})();
