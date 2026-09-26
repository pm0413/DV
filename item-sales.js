/* 창고 아이템 소개 / 선택 수량 판매: 기존 주문판 동전 API와 재고 저장 로직을 사용합니다. */
(() => {
 'use strict';
 const grid=document.getElementById('warehouse-grid');
 if(!grid)return;
 const descriptions=window.dowonItemDescriptions||{};
 const pop=document.createElement('section');
 pop.id='dw-item-pop';pop.setAttribute('role','dialog');pop.setAttribute('aria-label','아이템 정보와 판매');pop.hidden=true;
 const name=document.createElement('strong');name.className='dw-item-pop-name';
 const desc=document.createElement('p');desc.className='dw-item-pop-desc';
 const value=document.createElement('p');value.className='dw-item-pop-price';
 const row=document.createElement('div');row.className='dw-item-pop-controls';
 const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label','판매 수량 줄이기');
 const qty=document.createElement('span');qty.className='dw-item-pop-qty';qty.setAttribute('aria-live','polite');
 const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','판매 수량 늘리기');
 const sell=document.createElement('button');sell.type='button';sell.className='dw-item-pop-sell';sell.textContent='판매';
 const status=document.createElement('p');status.className='dw-item-pop-status';status.setAttribute('role','status');
 row.append(minus,qty,plus,sell);pop.append(name,desc,value,row,status);document.body.append(pop);
 let selected=null,count=1,anchor=null;
 const stock=key=>Object.prototype.hasOwnProperty.call(warehouse,key)?warehouse[key]:window.dowonFurnitureInventory?.get?.()[key]||0;
 function close(){selected=null;anchor=null;pop.hidden=true;}
 function update(){
  if(!selected)return;
  const available=stock(selected);
  count=Math.max(1,Math.min(count,Math.max(1,available)));
  qty.textContent=`×${count} / ${available}`;
  minus.disabled=count<=1;plus.disabled=count>=available;
  const unit=Number(descriptions[selected]?.price)||0;
  value.textContent=unit>0?`개당 ${unit.toLocaleString('ko-KR')}원 · 합계 ${(unit*count).toLocaleString('ko-KR')}원`:'판매가 미설정';
  sell.disabled=available<1||unit<=0||!window.dowonWallet?.refund;
 }
 function place(){
  if(!anchor||pop.hidden)return;
  const a=anchor.getBoundingClientRect();
  const w=pop.offsetWidth,h=pop.offsetHeight;
  const left=Math.min(Math.max(8,a.left+a.width/2-w/2),Math.max(8,innerWidth-w-8));
  const top=a.top-h-9>=8?a.top-h-9:Math.min(innerHeight-h-8,a.bottom+9);
  pop.style.left=left+'px';pop.style.top=Math.max(8,top)+'px';
 }
 function open(cell){
  const key=cell.dataset.itemKey;
  if(!key||!descriptions[key]||stock(key)<1)return;
  selected=key;anchor=cell;count=1;status.textContent='';
  name.textContent=descriptions[key].name||key;
  desc.textContent=descriptions[key].description||'설명이 아직 등록되지 않았습니다.';
  pop.hidden=false;update();place();
 }
 // Open on click only; hovering over slots or leaving the popup does nothing.
 grid.addEventListener('click',event=>{
  const cell=event.target.closest('.warehouse-cell[data-item-key]');
  if(!cell||!grid.contains(cell)){
   close();
   return;
  }
  if(cell===anchor&&!pop.hidden)close();
  else open(cell);
 });
 minus.addEventListener('click',()=>{count--;update();});
 plus.addEventListener('click',()=>{count++;update();});
 sell.addEventListener('click',()=>{
   const key=selected,unit=Number(descriptions[key]?.price)||0;
   const amount=unit*count;
   if(!key||!Number.isSafeInteger(unit)||unit<=0||!Number.isSafeInteger(amount)||!window.dowonWallet?.refund||stock(key)<count)return;
   if(Object.prototype.hasOwnProperty.call(warehouse,key)){
     warehouse[key]-=count;
     try{saveWarehouse();}catch(error){warehouse[key]+=count;status.textContent='재고 저장 실패';return;}
   }else if(!window.dowonFurnitureInventory?.sell?.(key,count)){
     status.textContent='장식 재고를 저장하지 못했습니다.';return;
   }
   window.dowonWallet.refund(amount);
   const sold=count;
   if(typeof renderWarehouse==='function')renderWarehouse();
   status.textContent=`${sold}개 판매 · ${amount.toLocaleString('ko-KR')}원 획득`;
   anchor=grid.querySelector(`.warehouse-cell[data-item-key="${key}"]`);
   if(!anchor||stock(key)<1){setTimeout(close,950);sell.disabled=true;minus.disabled=true;plus.disabled=true;}
   else{count=1;update();place();}
 });
 document.addEventListener('pointerdown',e=>{if(!pop.hidden&&!pop.contains(e.target)&&!grid.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 grid.addEventListener('scroll',close,{passive:true});
 window.addEventListener('resize',place);
 document.getElementById('warehouse-close')?.addEventListener('click',close);
 document.getElementById('warehouse-tab-production')?.addEventListener('click',close);
 document.getElementById('warehouse-tab-food')?.addEventListener('click',close);
 document.getElementById('warehouse-tab-decoration')?.addEventListener('click',close);
})();
