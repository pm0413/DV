/* 모바일 세로 화면: #main-area의 배경 이미지만 좌우로 패닝합니다.
   DOM 오브젝트(밭/주민/고양이/낚시/UI)는 transform하지 않습니다. */
(()=>{
  const scene=document.getElementById('main-area');
  if(!scene)return;

  const mq=window.matchMedia('(max-width:700px) and (orientation:portrait)');
  let pan=0, limit=0, dragging=false, pointerId=null, startX=0, startPan=0;
  let bgToken='';

  const bgUrl=()=>{
    const value=getComputedStyle(scene).backgroundImage||'';
    const matches=[...value.matchAll(/url\((?:"|')?([^"')]+)(?:"|')?\)/g)];
    return matches.length?matches[matches.length-1][1]:'';
  };

  const apply=()=>scene.style.setProperty('--mobile-bg-pan',`${pan}px`);
  const clamp=()=>{ pan=Math.max(-limit,Math.min(limit,pan)); apply(); };

  const measure=()=>{
    if(!mq.matches){pan=0;limit=0;apply();return;}
    const url=bgUrl();
    if(!url){limit=0;pan=0;apply();return;}
    const token=`${url}|${scene.clientWidth}|${scene.clientHeight}`;
    if(token===bgToken)return;
    bgToken=token;
    const img=new Image();
    img.onload=()=>{
      if(!mq.matches||!scene.clientWidth||!scene.clientHeight)return;
      const scale=Math.max(scene.clientWidth/img.naturalWidth,scene.clientHeight/img.naturalHeight);
      const renderedWidth=img.naturalWidth*scale;
      limit=Math.max(0,(renderedWidth-scene.clientWidth)/2);
      clamp();
    };
    img.src=url;
  };

  const canStart=e=>{
    if(!mq.matches||e.button>0)return false;
    /* 빈 마을 배경을 잡았을 때만 카메라를 움직입니다. */
    return e.target===scene;
  };

  scene.addEventListener('pointerdown',e=>{
    if(!canStart(e))return;
    measure();
    dragging=true; pointerId=e.pointerId; startX=e.clientX; startPan=pan;
    scene.setPointerCapture?.(e.pointerId);
  });
  scene.addEventListener('pointermove',e=>{
    if(!dragging||e.pointerId!==pointerId||!mq.matches)return;
    const dx=e.clientX-startX;
    if(Math.abs(dx)>3)e.preventDefault();
    pan=startPan+dx;
    clamp();
  },{passive:false});
  const stop=e=>{
    if(!dragging||e.pointerId!==pointerId)return;
    dragging=false; pointerId=null;
    try{scene.releasePointerCapture?.(e.pointerId);}catch(_){ }
  };
  scene.addEventListener('pointerup',stop);
  scene.addEventListener('pointercancel',stop);

  const refresh=()=>{bgToken='';measure();};
  window.addEventListener('resize',refresh,{passive:true});
  mq.addEventListener?.('change',refresh);

  /* 계절/시간/날씨로 배경 파일이 바뀌면 새 이미지 비율로 이동 한계를 다시 계산합니다. */
  new MutationObserver(()=>{bgToken='';measure();}).observe(scene,{attributes:true,attributeFilter:['style','class']});
  measure();
})();
