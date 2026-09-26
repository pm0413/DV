/* 마을 기록: 최근 7일의 활동과 특별한 일을 저장합니다. */
(()=>{'use strict';
 const KEY='dangcheong-dowon-village-news-v1',$=id=>document.getElementById(id),menu=$('menu-news'),dialog=$('village-news-dialog'),backdrop=$('village-news-backdrop'),content=$('village-news-content'),notice=$('village-news-notice');if(!menu||!dialog||!backdrop||!content||!notice)return;
 const today=()=>window.dowonClock?.get?.()?.day||1;
 const blankDay=()=>({harvest:0,processed:0,cooked:0,catVisits:0,catGifts:0,requests:0,catFriendship:0,catMeetings:0,residentGifts:0,orders:0,events:[]});
 let state={day:today(),current:blankDay(),history:[]};try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&typeof x==='object')state={...state,...x,current:{...blankDay(),...(x.current||{}),events:Array.isArray(x.current?.events)?x.current.events:[]},history:Array.isArray(x.history)?x.history:[]};}catch(_){}
 // 구버전 기록도 표시하되 불필요한 과거 데이터는 즉시 7일치로 정리합니다.
 state.history=state.history.filter(r=>Number.isSafeInteger(Number(r.day))&&r.day<state.day&&r.day>=state.day-7).slice(0,7);
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn('마을 기록 저장 실패',e);}};
 const counts=['harvest','processed','cooked','catVisits','catGifts','requests','catFriendship','catMeetings','residentGifts','orders'];
 const hasActivity=r=>counts.some(k=>Number(r?.[k])>0)||Array.isArray(r?.events)&&r.events.length>0;
 function rollDay(next){if(!Number.isSafeInteger(next)||next<1||next===state.day)return;const old=state.day;
  if(next>old){state.current.events.push(...(window.nakwonResidentPairs?.rollDay(next,(JSON.parse(localStorage.getItem('dangcheong-dowon-player-residents-v1')||'[]')).map(p=>p?.name))||[]));state.history.unshift({day:old,...state.current});for(let d=old+1;d<next;d++)state.history.unshift({day:d,...blankDay()});}
  else state.history=[]; // 날짜 초기화 시 미래 날짜의 기록을 남기지 않습니다.
  state.history=state.history.filter(r=>r.day>=next-7&&r.day<next).slice(0,7);state.day=next;state.current=blankDay();save();
  if(next>old){notice.textContent=`📰 ${old}일째 마을 소식이 도착했습니다`;notice.hidden=false;setTimeout(()=>notice.hidden=true,6500);}}
 function line(emoji,text,n){return Number(n)>0?`<p>${emoji} ${text.replace('{n}',Number(n).toLocaleString('ko-KR'))}</p>`:''}
 function render(){content.replaceChildren();if(!state.history.length){const p=document.createElement('p');p.className='vn-empty';p.textContent='아직 지난 마을 기록이 없습니다. 하루를 보낸 뒤 자러가면 기록이 쌓입니다.';content.append(p);return;}
  for(const r of state.history){const a=document.createElement('article');a.className='vn-day';const h=document.createElement('h3');h.textContent=`${r.day}일째 · 마을 기록`;a.append(h);const lines=document.createElement('div');lines.innerHTML=`${line('🌾','작물 {n}개를 수확했습니다.',r.harvest)}${line('⚙️','가공품 {n}개를 완성했습니다.',r.processed)}${line('🍳','요리 {n}개를 완성했습니다.',r.cooked)}${line('🐈','고양이가 {n}번 마을을 방문했습니다.',r.catVisits)}${line('🎁','고양이가 선물 {n}개를 가져왔습니다.',r.catGifts)}${line('💛','주민 부탁 {n}건을 완료했습니다.',r.requests)}${line('🐾','고양이와 주민이 {n}번 가까워졌습니다.',r.catFriendship)}${line('🐱','고양이들이 서로 {n}번 인사했습니다.',r.catMeetings)}${line('🎀','주민에게 선물 {n}개를 전했습니다.',r.residentGifts)}${line('🛍️','주민 주문 {n}건을 완료했습니다.',r.orders)}`;a.append(...lines.children);
   for(const ev of Array.isArray(r.events)?r.events:[]){const item=document.createElement('p');item.textContent=String(ev);a.append(item);}
   if(!hasActivity(r)){const quiet=document.createElement('p');quiet.textContent='🍃 오늘은 마을이 조용했습니다.';a.append(quiet);}content.append(a);}}
 function open(){for(const id of ['warehouse-close','kitchen-close','resident-close','shop-close','order-close','debug-close','village-features-close','cats-close'])$(id)?.click();render();dialog.hidden=backdrop.hidden=false;notice.hidden=true;$('village-news-close')?.focus()}function close(){dialog.hidden=backdrop.hidden=true;menu.focus()}
 menu.addEventListener('click',open);notice.addEventListener('click',open);$('village-news-close').addEventListener('click',close);backdrop.addEventListener('click',close);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden){e.stopImmediatePropagation();close()}},true);
 document.addEventListener('dowon:timechange',e=>{const d=Number(e.detail?.day);if(Number.isSafeInteger(d)&&d>0)rollDay(d)});
 const eventText=d=>{switch(d.type){case 'cat-adopt':return `🏠 ${d.name||'고양이'}가 새로운 가족이 되었습니다.`;case 'resident-relationship-change':return `💕 ${d.first||'주민'}와 ${d.second||'주민'}의 관계가 '${d.relationship||'새로운 관계'}'(으)로 바뀌었습니다.`;case 'achievement-complete':return `🏅 '${d.name||'새 업적'}' 업적을 달성했습니다.`;case 'facility-unlocked':return `🛖 '${d.name||'새 시설'}' 시설을 사용할 수 있게 되었습니다.`;default:return null;}};
 document.addEventListener('dowon:activity',e=>{const d=e.detail||{};rollDay(today());if(d.type==='harvest')state.current.harvest+=Math.max(0,Number(d.count)||0);else if(d.type==='processed')state.current.processed+=Math.max(0,Number(d.count)||0);else if(d.type==='cook')state.current.cooked+=1;else if(d.type==='cat-visit')state.current.catVisits+=1;else if(d.type==='cat-gift')state.current.catGifts+=1;else if(d.type==='request'||d.type==='resident-request')state.current.requests+=1;else if(d.type==='cat-friendship')state.current.catFriendship+=Math.max(1,Number(d.count)||1);else if(d.type==='cat-meeting')state.current.catMeetings+=1;else if(d.type==='gift')state.current.residentGifts+=1;else if(d.type==='order-complete')state.current.orders+=1;
  const msg=eventText(d);if(msg)state.current.events.push(msg);save()});
 rollDay(today());save();window.dowonNews={get:()=>JSON.parse(JSON.stringify(state)),open};
})();
