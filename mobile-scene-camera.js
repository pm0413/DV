(()=>{
  'use strict';
  const main=document.getElementById('main-area');
  if(!main)return;
  const mq=window.matchMedia('(max-width:700px) and (orientation:portrait)');
  const IMAGE_W=1920, IMAGE_H=1080;
  let pan=0, drag=null;

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function maxPan(){
    if(!mq.matches)return 0;
    const w=Math.max(1,main.clientWidth), h=Math.max(1,main.clientHeight);
    const scale=Math.max(w/IMAGE_W,h/IMAGE_H);
    return Math.max(0,(IMAGE_W*scale-w)/2);
  }
  function apply(next=pan){
    const limit=maxPan();
    pan=clamp(next,-limit,limit);
    main.style.setProperty('--mobile-scene-pan-x',`${pan}px`);
  }
  function blockedTarget(target){
    return !!target.closest([
      '.resident-avatar','.village-cat','.cat-bowls',
      '#farm-area','#crop-palette','#fishing-marker',
      '#village-news-notice','.resident-request-reminder',
      '.scene-coordinate-marker','#warehouse','#warehouse-backdrop',
      'button','input','select','textarea','a'
    ].join(','));
  }
  main.addEventListener('pointerdown',e=>{
    if(!mq.matches||drag||blockedTarget(e.target))return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,startPan:pan,moved:false};
    try{main.setPointerCapture(e.pointerId);}catch(_){}
  },true);
  main.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
    if(!drag.moved){
      if(Math.hypot(dx,dy)<5)return;
      if(Math.abs(dy)>Math.abs(dx)*1.15){drag=null;return;}
      drag.moved=true;
    }
    apply(drag.startPan+dx);
    e.preventDefault();
  },{capture:true,passive:false});
  function end(e){
    if(!drag||e.pointerId!==drag.id)return;
    drag=null;
  }
  main.addEventListener('pointerup',end,true);
  main.addEventListener('pointercancel',end,true);
  window.addEventListener('resize',()=>apply(),{passive:true});
  mq.addEventListener?.('change',()=>{if(!mq.matches)pan=0;apply();});
  apply(0);
})();
