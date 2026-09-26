/* 상호작용 표: 제목/빈 공간을 마우스로 끌어 가로 이동, 입력창 편집은 그대로 유지 */
(()=>{
  'use strict';
  const selector='.resident-dialog .resident-matrix-scroll';
  const editable='input,textarea,select,button,[contenteditable="true"]';
  let state=null;
  document.addEventListener('pointerdown',event=>{
    if(event.button!==0 || event.pointerType==='touch')return;
    const scroller=event.target.closest(selector);
    if(!scroller || event.target.closest(editable) || scroller.scrollWidth<=scroller.clientWidth)return;
    state={element:scroller,id:event.pointerId,x:event.clientX,y:event.clientY,left:scroller.scrollLeft,dragged:false};
    scroller.setPointerCapture(event.pointerId);
  });
  document.addEventListener('pointermove',event=>{
    if(!state || event.pointerId!==state.id)return;
    const dx=event.clientX-state.x;
    if(!state.dragged && Math.abs(dx)<4)return;
    state.dragged=true;
    state.element.classList.add('drag-scrolling');
    state.element.scrollLeft=state.left-dx;
    event.preventDefault();
  },{passive:false});
  function release(event){
    if(!state || event.pointerId!==state.id)return;
    const {element,id}=state;
    element.classList.remove('drag-scrolling');
    if(element.hasPointerCapture(id))element.releasePointerCapture(id);
    state=null;
  }
  document.addEventListener('pointerup',release);
  document.addEventListener('pointercancel',release);
  document.addEventListener('wheel',event=>{
    const scroller=event.target.closest(selector);
    if(!scroller || scroller.scrollWidth<=scroller.clientWidth)return;
    // Shift + 휠 또는 트랙패드의 가로 스크롤도 지원. 일반 휠은 세로 스크롤 유지.
    if(event.shiftKey && Math.abs(event.deltaY)>0){
      scroller.scrollLeft+=event.deltaY;
      event.preventDefault();
    }
  },{passive:false});
})();
