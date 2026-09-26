/* 주민별 플레이어 지정 좋아하는 선물: 1~5개, 7일짜리 실제 게임 계절당 1회 저장.
   디버그의 임시 계절 미리보기는 설정 가능 여부를 바꾸지 않습니다. */
(() => {
 'use strict';
 const STORAGE='dangcheong-dowon-resident-favorite-choices-v1';
 const DEFAULT_LIKES={
   0:{likes:['egg','eggPancake'],dislike:'chickenFeed'},
   1:{likes:['sugar','food_Twisted_Doughnut'],dislike:'chickenFeed'},
   2:{likes:['bean','friedTofu'],dislike:'chickenFeed'},
   3:{likes:['egg','paddy'],dislike:'chickenFeed'},
   4:{likes:['cabbage','pickledVegetables'],dislike:'chickenFeed'}
 };
 window.dowonGiftPreferences=DEFAULT_LIKES;
 let records={};
 try{const data=JSON.parse(localStorage.getItem(STORAGE)||'null');if(data&&typeof data==='object'&&!Array.isArray(data))records=data;}catch(_){}
 const getDay=()=>{
   const d=window.dowonClock?.get?.()?.day;
   if(Number.isSafeInteger(d)&&d>0)return d;
   try{const saved=JSON.parse(localStorage.getItem('dangcheong-dowon-village-clock-v2')||'null');return Number.isSafeInteger(saved?.day)&&saved.day>0?saved.day:1;}catch(_){return 1;}
 };
 const seasonIndex=()=>Math.floor((getDay()-1)/7);
 const itemKeys=()=>[...new Set([...Object.keys(window.dowonItemDescriptions||{}),...(window.DOWON_COOKING_RECIPES||[]).map(r=>r.output).filter(Boolean)])];
 const nameOf=k=>(window.DOWON_COOKING_RECIPES||[]).find(r=>r.output===k)?.name||window.dowonItemDescriptions?.[k]?.name||k;
 const get=i=>{const record=records[i];return record&&Array.isArray(record.items)?record.items.filter(k=>typeof k==='string'):[];};
 const canEdit=i=>Number.isInteger(i)&&i>=0&&i<5&&(!records[i]||records[i].season!==seasonIndex());
 function choose(i,items){
   if(!canEdit(i)||!Array.isArray(items)||items.length<1||items.length>5||new Set(items).size!==items.length)return false;
   const valid=new Set(itemKeys());if(items.some(k=>!valid.has(k)))return false;
   const next={...records,[i]:{season:seasonIndex(),items:[...items]}};
   try{localStorage.setItem(STORAGE,JSON.stringify(next));records=next;}catch(e){console.warn('주민 선물 취향 저장 실패',e);return false;}
   document.dispatchEvent(new CustomEvent('dowon:giftchoiceschange',{detail:{resident:i,items:[...items]}}));
   return true;
 }
 // 프로필의 좋아하는 선물 영역. 이미 저장했으면 다음 실제 계절까지 선택 불가.
 function renderEditor(i,host){
   if(!host)return;
   host.replaceChildren();
   const create=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
   const title=create('p','vf-gift-choice-title','좋아하는 선물');host.append(title);
   const items=get(i);
   host.append(create('p','vf-note',items.length?items.map(nameOf).join(' · '):'선호 아이템이 아직 설정되지 않았습니다. 최대 5개까지 선택할 수 있습니다.'));
   if(!canEdit(i)){host.append(create('p','vf-note','이번 계절에는 이미 설정했습니다. 다음 계절부터 변경할 수 있으며, 변경하지 않으면 기존 설정이 유지됩니다.'));return;}
   const toggle=create('button','vf-gift-choice-button',items.length?'좋아하는 선물 변경하기':'좋아하는 선물 정하기');toggle.type='button';host.append(toggle);
   const editor=create('div','vf-gift-choice-editor');editor.hidden=true;host.append(editor);
   toggle.addEventListener('click',()=>{editor.hidden=!editor.hidden;if(!editor.hidden)toggle.setAttribute('aria-expanded','true');else toggle.setAttribute('aria-expanded','false');});
   editor.append(create('p','vf-note','아이템을 1~5개 선택한 후 저장해 주세요. 저장 후에는 다음 계절까지 변경할 수 없습니다. (창고에 없는 아이템도 선택할 수 있습니다.)'));
   const count=create('p','vf-note',`선택 0/5`);editor.append(count);
   const grid=create('div','vf-gift-choice-grid');editor.append(grid);
   const selection=new Set();const cards=[];
   const refresh=()=>{count.textContent=`선택 ${selection.size}/5`;for(const card of cards){const active=selection.has(card.key);card.button.classList.toggle('is-selected',active);card.button.setAttribute('aria-pressed',String(active));card.button.disabled=!active&&selection.size>=5;}};
   for(const key of itemKeys()) {
     const card=create('button','vf-gift-choice-item');card.type='button';card.key=key;
     const img=create('img');img.src=(window.DOWON_COOKING_RECIPES||[]).find(r=>r.output===key)?.icon||`item/${["eggPancake","egg","chickenFeed","tofu","ricePowder","flour","sugar","saltedEgg","friedTofu","pickledVegetables"].includes(key)?"가공품":"작물"}/${nameOf(key)}.png`;img.alt='';img.loading='lazy';img.onerror=()=>{img.style.display='none';};
     card.append(img,create('span','',nameOf(key)));card.addEventListener('click',()=>{if(selection.has(key))selection.delete(key);else if(selection.size<5)selection.add(key);refresh();});
     grid.append(card);cards.push({key,button:card});
   }
   const action=create('button','vf-gift-choice-save','선택한 선물 저장하기');action.type='button';editor.append(action);
   const message=create('p','vf-note','');editor.append(message);
   action.addEventListener('click',()=>{
     if(!selection.size){message.textContent='좋아하는 선물을 1개 이상 선택해 주세요.';return;}
     if(!window.confirm('이번 계절의 선호 아이템을 확정하시겠습니까? 다음 계절까지 변경할 수 없습니다.'))return;
     if(choose(i,[...selection]))renderEditor(i,host);else message.textContent='이번 계절에 이미 설정했거나 저장하지 못했습니다.';
   });
   refresh();
 }
 window.dowonGiftChoices={get,canEdit,choose,renderEditor,seasonIndex};
 // 열어 둔 프로필에서 날짜가 다음 계절로 바뀌어도 잠금 문구가 즉시 갱신됨.
 let lastSeason=seasonIndex();
 document.addEventListener('dowon:timechange',()=>{const n=seasonIndex();if(n===lastSeason)return;lastSeason=n;document.querySelectorAll('[data-gift-choice-resident]').forEach(host=>renderEditor(Number(host.dataset.giftChoiceResident),host));});
})();
