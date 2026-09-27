/* 모바일 가공소 전체 패널 접기/펼치기. PC 레이아웃에는 관여하지 않습니다. */
(()=>{
  const mq=window.matchMedia('(max-width:700px)');
  const panel=document.getElementById('right-area');
  const heading=panel?.querySelector('.workshop-panel-heading');
  const list=document.getElementById('workshop-list');
  if(!panel||!heading||!list)return;

  const button=document.createElement('button');
  button.type='button';
  button.className='mobile-workshop-toggle';
  button.innerHTML='<span aria-hidden="true">▾</span>';
  button.setAttribute('aria-controls','workshop-list');
  heading.append(button);

  const setCollapsed=(collapsed)=>{
    panel.classList.toggle('mobile-workshop-collapsed',collapsed && mq.matches);
    button.setAttribute('aria-expanded',String(!(collapsed && mq.matches)));
    button.setAttribute('aria-label',collapsed?'가공소 펼치기':'가공소 접기');
  };

  // 모바일 진입 시 항상 플레이 화면을 넓게 확보합니다.
  setCollapsed(mq.matches);

  const toggle=()=>{
    if(!mq.matches)return;
    setCollapsed(!panel.classList.contains('mobile-workshop-collapsed'));
  };
  button.addEventListener('click',e=>{e.stopPropagation();toggle();});
  heading.addEventListener('click',e=>{
    if(!mq.matches||e.target.closest('button')||e.target.closest('.workshop-coin-wallet'))return;
    toggle();
  });
  mq.addEventListener?.('change',e=>setCollapsed(e.matches));
})();
