/* 가공소 제목의 화살표는 본문(제작/제작 칸/안내)만 접습니다. 건설 UI는 유지합니다. */
(() => {
 'use strict';
 const key='dangcheong-dowon-workshop-folds-v1';
 let saved={};
 try {const record=JSON.parse(localStorage.getItem(key)||'{}');if(record&&typeof record==='object'&&!Array.isArray(record))saved=record;} catch(error){console.warn('가공소 접기 상태 불러오기 실패',error);}
 document.querySelectorAll('#workshop-list .workshop-card').forEach(card=>{
   const button=card.querySelector('.workshop-fold');
   const content=card.querySelector('.workshop-content');
   if(!button||!content)return;
   const apply=expanded=>{
     content.hidden=!expanded;
     card.classList.toggle('is-folded',!expanded);
     button.setAttribute('aria-expanded',String(expanded));
     button.setAttribute('aria-label',`${card.querySelector('.workshop-heading strong')?.textContent||'가공소'} ${expanded?'접기':'펼치기'}`);
   };
   apply(saved[card.id]!==false);
   button.addEventListener('click',()=>{
     const next=button.getAttribute('aria-expanded')!=='true';
     apply(next);saved[card.id]=next;
     try{localStorage.setItem(key,JSON.stringify(saved));}catch(error){console.warn('가공소 접기 상태 저장 실패',error);}
   });
 });
})();


/* 가공품 안내는 스크롤 영역 밖의 별도 레이어로 표시해 잘림을 방지합니다. */
(() => {
  'use strict';
  const list = document.getElementById('workshop-list');
  if (!list) return;
  const floating = document.createElement('div');
  floating.className = 'dowon-workshop-floating-tooltip';
  floating.setAttribute('role', 'tooltip');
  floating.hidden = true;
  document.body.appendChild(floating);
  let active = null;
  let source = null;

  function closeTooltip() {
    active = null;
    source = null;
    floating.hidden = true;
  }
  function positionTooltip() {
    if (!active || floating.hidden) return;
    const buttonBox = active.getBoundingClientRect();
    const margin = 8;
    const width = floating.offsetWidth;
    const height = floating.offsetHeight;
    // Float outside the workshop row layout. Prefer above the hovered recipe;
    // if there is not enough viewport room, place it below.
    let left = buttonBox.left;
    let top = buttonBox.top - height - 8;
    if (top < margin) top = buttonBox.bottom + 8;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin;
    left = Math.max(margin, left);
    top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
    floating.style.left = `${left}px`;
    floating.style.top = `${top}px`;
  }
  function showTooltip(button) {
    const tip = button.closest('.chopper-action')?.querySelector('[role="tooltip"]');
    if (!tip) return;
    active = button;
    source = tip;
    floating.innerHTML = source.innerHTML;
    floating.hidden = false;
    positionTooltip();
  }
  list.querySelectorAll('.workshop-production .chopper-action > button[id$="-start"]').forEach(button => {
    button.addEventListener('mouseenter', () => showTooltip(button));
    button.addEventListener('mouseleave', () => { if (active === button) closeTooltip(); });
    button.addEventListener('focus', () => showTooltip(button));
    button.addEventListener('blur', () => { if (active === button) closeTooltip(); });
  });
  // Scrolling the workshop list changes the anchor position. Close rather than leave a stranded tooltip.
  list.addEventListener('scroll', closeTooltip, {passive:true});
  window.addEventListener('scroll', closeTooltip, {passive:true});
  window.addEventListener('resize', () => { if (active) positionTooltip(); }, {passive:true});
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeTooltip(); });
})();
