(()=>{
 'use strict';
 const scene=document.getElementById('main-area');
 if(!scene)return;
 const mq=matchMedia('(max-width: 700px) and (orientation: portrait)');
 let x=0,minX=0,maxX=0,drag=null,imgToken=0;
 const interactive='button, input, select, textarea, a, #farm-area, .resident-avatar, .character, .village-cat, .cat-bowls, .fishing-marker, [role="dialog"], [data-no-camera]';
 const clamp=v=>Math.max(minX,Math.min(maxX,v));
 function apply(v){x=clamp(v);scene.style.setProperty('--mobile-camera-x',`${x}px`);}
 function bgUrl(){
   const raw=getComputedStyle(scene).backgroundImage||'';
   const matches=[...raw.matchAll(/url\(["']?([^"')]+)["']?\)/g)];
   return matches.length?matches[matches.length-1][1]:'';
 }
 function measure(){
   if(!mq.matches){minX=maxX=0;apply(0);return;}
   const r=scene.getBoundingClientRect(),url=bgUrl(),token=++imgToken;
   if(!url||!r.width||!r.height){minX=maxX=0;apply(0);return;}
   const im=new Image();
   im.onload=()=>{
     if(token!==imgToken)return;
     const scale=Math.max(r.width/im.naturalWidth,r.height/im.naturalHeight);
     const rendered=im.naturalWidth*scale;
     const overflow=Math.max(0,(rendered-r.width)/2);
     minX=-overflow;maxX=overflow;apply(x);
   };
   im.onerror=()=>{if(token===imgToken){minX=maxX=0;apply(0);}};
   im.src=url;
 }
 function cameraX(){return mq.matches?x:0;}
 window.DohwaMobileCamera={getX:cameraX,refresh:measure};
 scene.addEventListener('pointerdown',e=>{
   if(!mq.matches||e.pointerType==='mouse'&&e.button!==0)return;
   if(e.target.closest(interactive))return;
   drag={id:e.pointerId,start:e.clientX,base:x,moved:false};
   try{scene.setPointerCapture(e.pointerId);}catch(_){}
 },true);
 scene.addEventListener('pointermove',e=>{
   if(!drag||e.pointerId!==drag.id)return;
   const dx=e.clientX-drag.start;
   if(!drag.moved&&Math.abs(dx)<5)return;
   drag.moved=true;apply(drag.base+dx);e.preventDefault();
 },{capture:true,passive:false});
 const end=e=>{if(drag&&e.pointerId===drag.id)drag=null;};
 scene.addEventListener('pointerup',end,true);scene.addEventListener('pointercancel',end,true);
 addEventListener('resize',measure,{passive:true});mq.addEventListener?.('change',measure);
 new MutationObserver(()=>requestAnimationFrame(measure)).observe(scene,{attributes:true,attributeFilter:['style','class']});
 measure();setTimeout(measure,300);
})();
