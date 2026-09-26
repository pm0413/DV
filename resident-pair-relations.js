/* 주민 사이 호감도: 저장된 이름·초상화와 무관한 슬롯 쌍별 기록 */
(()=>{'use strict';
 const KEY='dangcheong-dowon-resident-pair-relations-v1';
 const LEGACY_KEY='nakwon-resident-pair-relations-v1';
 const clockDay=()=>Number(window.dowonClock?.get?.()?.day)||1;
 const pair=(a,b)=>[Number(a),Number(b)].sort((x,y)=>x-y).join(':');
 const clamp=n=>Math.max(0,Math.min(100,Math.round(Number(n)||0)));
 let data={day:clockDay(),pairs:{},starts:{}};
 try{
  const currentRaw=localStorage.getItem(KEY);
  const legacyRaw=currentRaw===null?localStorage.getItem(LEGACY_KEY):null;
  const saved=JSON.parse(currentRaw??legacyRaw??'null');
  if(saved&&saved.pairs){
   data={...data,...saved,starts:saved.starts||{}};
   if(currentRaw===null&&legacyRaw!==null){localStorage.setItem(KEY,JSON.stringify(data));localStorage.removeItem(LEGACY_KEY);}
  }
 }catch(_){}
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));localStorage.removeItem(LEGACY_KEY);}catch(e){console.warn('주민 간 관계 저장 실패',e);}};
 const label=s=>s.love?'연인':s.score>=80?'친한 친구':s.score>=50?'친구':s.score>=20?'아는 사이':'초면';
 const current=(a,b)=>{const k=pair(a,b);return data.pairs[k]||{score:0,love:false};};
 function change(a,b,patch){if(a===b)return;const k=pair(a,b),before=current(a,b);if(!(k in data.starts))data.starts[k]=label(before);const next={score:patch.score===undefined?before.score:clamp(patch.score),love:patch.love===undefined?!!before.love:!!patch.love};data.pairs[k]=next;persist();document.dispatchEvent(new CustomEvent('nakwon:resident-pair-change',{detail:{a:Number(a),b:Number(b),...next,relation:label(next)}}));}
 function rollDay(day,names){if(day<=data.day)return [];const results=[];for(const [k,start] of Object.entries(data.starts)){const end=label(data.pairs[k]||{score:0});if(start!==end){const [a,b]=k.split(':').map(Number),first=names?.[a]||`주민 ${a+1}`,second=names?.[b]||`주민 ${b+1}`;results.push(`🤝 ${first}와 ${second}의 관계가 '${end}'(으)로 바뀌었습니다.`);}}data.day=day;data.starts={};persist();return results;}
 function encounter(a,b){if(a===b)return;const old=current(a,b);const roll=Math.random();change(a,b,{score:old.score+(roll<.6?(Math.random()<.5?1:2):roll<.75?-1:0)});}
 window.nakwonResidentPairs={get:(a,b)=>({...current(a,b),relation:label(current(a,b))}),set:change,encounter,rollDay};
})();
