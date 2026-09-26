/* 전원생활일지 고양이: 고양이별 이미지와 이동/정지 프레임을 설정에서 가져옵니다. */
(() => {
 'use strict';
 const CONFIG=window.DOWON_CAT_CONFIG||[];
 const GIFT_CATALOG=window.DOWON_CAT_GIFTS||[];
 const giftDefs=new Map(GIFT_CATALOG.map(g=>[g.id,g]));
 const KEY='dangcheong-dowon-cats-v1';
 const $=id=>document.getElementById(id);
 const scene=$('main-area'),farm=$('farm-area'),menu=$('menu-cats'),dialog=$('village-cats-dialog'),backdrop=$('village-cats-backdrop');
 if(!scene||!farm||!menu||!dialog||!backdrop||!CONFIG.length)return;
 const defs=new Map(CONFIG.map(c=>[c.id,c]));
 const day=()=>window.dowonClock?.get?.()?.day||1;
 const blank=()=>({day:day(),visitors:[],activeVisitors:[],visitCount:0,visits:0,feed:0,strayFood:0,homeFood:0,strayFoodType:null,homeFoodType:null,cats:{},adopted:null,adoptedCats:[],adoptedDays:0,lastHomeDay:null,lastAdoptedPlayComfortDay:0,achievements:{},sound:false,petUsed:0,playUsed:0,giftCollection:{},pendingGifts:{},giftHistory:[],giftRolls:{},relationships:{},dailyRelationship:{day:day(),counts:{}}});
 let state=blank();
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object')state={...blank(),...saved,cats:saved.cats||{},visitors:Array.isArray(saved.visitors)?saved.visitors:[],activeVisitors:Array.isArray(saved.activeVisitors)?saved.activeVisitors:[],achievements:saved.achievements||{}};}catch(e){console.warn('고양이 저장 데이터를 읽지 못했습니다.',e);}
 state.giftCollection=state.giftCollection&&typeof state.giftCollection==='object'?state.giftCollection:{};
 state.pendingGifts=state.pendingGifts&&typeof state.pendingGifts==='object'?state.pendingGifts:{};
 state.giftHistory=Array.isArray(state.giftHistory)?state.giftHistory:[];
 state.giftRolls=state.giftRolls&&typeof state.giftRolls==='object'?state.giftRolls:{};
 state.relationships=state.relationships&&typeof state.relationships==='object'?state.relationships:{};
 state.dailyRelationship=state.dailyRelationship&&typeof state.dailyRelationship==='object'?state.dailyRelationship:{day:day(),counts:{}};
 state.dailyRelationship.counts=state.dailyRelationship.counts&&typeof state.dailyRelationship.counts==='object'?state.dailyRelationship.counts:{};
 for(const cat of CONFIG){
  if(!state.cats[cat.id])state.cats[cat.id]={points:0,visits:0,firstDay:null,pettedDay:0,playedDay:0};
  else state.cats[cat.id]={playedDay:0,pettedDay:0,points:0,visits:0,firstDay:null,...state.cats[cat.id]};
}
 // 이전 버전의 단일 입양 기록을 다중 입양 배열로 마이그레이션합니다.
 state.adoptedCats=Array.isArray(state.adoptedCats)?state.adoptedCats.filter(c=>c&&defs.has(c.id)):[];
 if(state.adopted&&defs.has(state.adopted.id)&&!state.adoptedCats.some(c=>c.id===state.adopted.id))state.adoptedCats.unshift(state.adopted);
 state.adopted=state.adoptedCats[0]||null;
 if(state.strayFood>0&&!state.strayFoodType)state.strayFoodType='fish';
 if(state.homeFood>0&&!state.homeFoodType)state.homeFoodType='fish';
 if(state.feed>0&&window.dowonInventory?.add?.('catFishFeed',state.feed))state.feed=0;
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn('고양이 데이터를 저장하지 못했습니다.',e);}};
 const grantComfort=amount=>{const c=window.dowonComfort;if(c?.get&&c?.set)c.set(c.get()+amount);};
 const profile=id=>state.cats[id];
 const adopted=id=>state.adoptedCats.some(c=>c.id===id);
 const adoptedCat=id=>state.adoptedCats.find(c=>c.id===id);
 const adoptionCapacity=()=>1+((()=>{try{const x=JSON.parse(localStorage.getItem('dangcheong-dowon-shop-collection-v1')||'{}');return x.purchased?.cat_rattan_house===true?3:0;}catch(_){return 0;}})());
 const canAdopt=()=>state.adoptedCats.length<adoptionCapacity();
 const displayName=id=>adopted(id)?adoptedCat(id).name:defs.get(id)?.name||'고양이';
 const report=(text)=>{$('cats-status').textContent=text;};
 const FOODS=Object.freeze([
  {type:'fish',key:'catFishFeed',name:'생선'},
  {type:'duck',key:'catDuckFeed',name:'오리고기'},
  {type:'chicken',key:'catChickenFeed',name:'닭고기'}
 ]);
 const PREFERENCES={cheese:['fish','duck','chicken'],calico:['fish'],tuxedo:['chicken'],tabby:['fish','chicken'],black:['duck'],white:['chicken','duck'],cow:['chicken','duck'],butler:['fish','chicken'],graytabby:['fish'],whitecheese:['fish','duck','chicken'],fluff:['duck'],ragdoll:['chicken','duck'],siamese:['fish','chicken']};
 const likes=(id,type)=>Boolean(type&&PREFERENCES[id]?.includes(type));
 const favoriteFoodText=id=>{
  const types=PREFERENCES[id]||[];
  if(!types.length)return '없음';
  return types.map(type=>FOODS.find(f=>f.type===type)?.name||type).join(' / ');
 };
 const feedCount=type=>window.dowonInventory?.get?.(FOODS.find(f=>f.type===type)?.key||'')||0;
 const season=()=>window.dowonSeasons?.get?.()?.season||'summer';
 const residentList=()=>{try{const raw=JSON.parse(localStorage.getItem('dangcheong-dowon-player-residents-v1')||'[]');return Array.isArray(raw)?raw:[];}catch(_){return [];}};
 const residentName=index=>residentList()[index]?.name||`주민 ${Number(index)+1}`;
 const relationshipScore=(catId,residentIndex)=>Number(state.relationships?.[catId]?.[residentIndex]||0);
 function relationshipLabel(score){return score>=40?'아주 친한 친구':score>=25?'친한 친구':score>=10?'친해지는 중':'낯을 익히는 중';}
 function addRelationship(catId,residentIndex){
  if(!Number.isInteger(residentIndex)||residentIndex<0)return false;
  if(state.dailyRelationship.day!==day())state.dailyRelationship={day:day(),counts:{}};
  const key=`${catId}:${residentIndex}`,used=Number(state.dailyRelationship.counts[key]||0);
  if(used>=3)return false;
  state.dailyRelationship.counts[key]=used+1;
  if(!state.relationships[catId])state.relationships[catId]={};
  state.relationships[catId][residentIndex]=Math.min(50,relationshipScore(catId,residentIndex)+1);
  save();
  document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cat-friendship',catId,resident:residentIndex,count:1}}));
  return true;
 }
 function giftsForSeason(){const current=season();const pool=GIFT_CATALOG.filter(g=>!Array.isArray(g.seasons)||g.seasons.includes(current));return pool.length?pool:GIFT_CATALOG;}
 function rollGift(id){
  if(!giftDefs.size||state.pendingGifts[id])return false;
  const key=`${day()}:${id}`;if(state.giftRolls[key])return false;state.giftRolls[key]=true;
  const chance=adopted(id) ? .22 : .14;if(Math.random()>=chance){save();return false;}
  const pool=giftsForSeason();if(!pool.length){save();return false;}
  const gift=pool[Math.floor(Math.random()*pool.length)];state.pendingGifts[id]={giftId:gift.id,day:day()};save();refreshActorGift(id);return true;
 }
 function giftVisual(gift,cls='cat-gift-visual'){
  if(gift?.image){const img=el('img',cls);img.src=gift.image;img.alt=gift.name||'고양이 선물';img.onerror=()=>{const span=el('span',cls,gift.emoji||'🎁');img.replaceWith(span);};return img;}
  return el('span',cls,gift?.emoji||'🎁');
 }
 function refreshActorGift(id){const a=active.get(id);if(!a)return;const badge=a.node.querySelector('.cat-gift-badge');if(badge)badge.hidden=!state.pendingGifts[id];}
 function claimGift(id){
  const pending=state.pendingGifts[id],gift=pending&&giftDefs.get(pending.giftId);if(!pending||!gift)return false;
  delete state.pendingGifts[id];state.giftCollection[gift.id]=Number(state.giftCollection[gift.id]||0)+1;
  state.giftHistory.unshift({giftId:gift.id,catId:id,day:day()});state.giftHistory=state.giftHistory.slice(0,40);save();refreshActorGift(id);
  document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cat-gift',catId:id,giftId:gift.id,giftName:gift.name}}));
  render();report(`${displayName(id)}이(가) ${gift.name}을(를) 가져왔습니다.`);return true;
 }
 // 해금 호감도는 아래 배열에서 조정할 수 있습니다.
 const PET_ACTIONS=[
  {name:'머리 쓰다듬기',min:0}, {name:'등 쓰다듬기',min:10},
  {name:'배 쓰다듬기',min:20}, {name:'발 만지기',min:30},
  {name:'꼬리 만지기',min:40}, {name:'안아주기',min:50}
 ];
 const CAT_TOYS=window.DOWON_CAT_TOYS||[];
 const ownedToys=()=>{const owned=window.dowonFurnitureInventory?.get?.()||{};return CAT_TOYS.filter(toy=>(owned[toy.key]||0)>0);};
 const DAILY_ACTION_LIMIT=5;
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
 const button=(label,fn,disabled=false)=>{const b=el('button','cat-action',label);b.type='button';b.disabled=disabled;if(typeof fn==='function')b.addEventListener('click',fn);return b;};
 let panel='collection',selected=null,active=new Map(),nextVisitAt=0,lastFrame=0,lastChirp=0;
 function ensureDay(){
  const d=day();if(state.day===d)return;
  if(d>state.day && state.adopted)state.adoptedDays+=d-state.day;
  state.day=d;state.visitCount=0;state.visitors=[];state.activeVisitors=[];state.petUsed=0;state.playUsed=0;state.strayFood=Math.min(3,state.strayFood);state.dailyRelationship={day:d,counts:{}};
  for(const id of [...active.keys()])if(!adopted(id))removeActor(id);
  nextVisitAt=Date.now()+6000;save();refreshBowls();for(const home of state.adoptedCats)rollGift(home.id);
 }
 const knownCount=()=>CONFIG.filter(c=>profile(c.id).visits>0).length;
 function markVisit(id){const p=profile(id);const first=p.visits===0;p.visits+=1;p.firstDay??=day();p.points+=1;state.visitCount++;state.visits++;state.visitors.push(id);save();if(first)grantComfort(3);document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cat-visit',catId:id,first}}));rollGift(id);}
 function centerOf(node){const s=scene.getBoundingClientRect(),r=node.getBoundingClientRect();return {x:r.left-s.left+r.width/2,y:r.top-s.top+r.height/2};}
 const random=(a,b)=>a+Math.random()*(b-a);
 // 가까워진 순간에만 한 번 판정합니다. 다시 떨어지기 전에는 재판정하지 않습니다.
 const MEETING_EMOJIS=['🐱','😼','😾','🦋','🐭','🐦','🐟','❤️','💔'];
 const catEncountered=new Set(),residentEncountered=new Set();
 const emoji=()=>MEETING_EMOJIS[Math.floor(Math.random()*MEETING_EMOJIS.length)];
 const encounterKey=(a,b)=>[a,b].sort().join(':');
 function showMeetingBubble(x,y){
  const bubble=el('span','cat-meeting-bubble',emoji());
  bubble.style.left=`${x}px`;bubble.style.top=`${y}px`;
  scene.append(bubble);
  // DOM과 함께 제거되어 데이터 저장이나 기존 대사 시스템에 영향을 주지 않습니다.
  setTimeout(()=>bubble.remove(),3000);
 }
 function releaseMeeting(a,now){
  if(!a.meetingEnd||now<a.meetingEnd)return;
  a.meetingEnd=0;
  a.pause=0;
  if(a.phase==='roam')chooseTarget(a);
 }
 function catMeetings(now){
  const cats=[...active.values()].filter(a=>a.phase==='roam');
  for(let i=0;i<cats.length;i++)for(let j=i+1;j<cats.length;j++){
   const a=cats[i],b=cats[j],key=encounterKey(a.id,b.id);
   const distance=Math.hypot(a.x-b.x,a.y-b.y);
   if(distance>112){catEncountered.delete(key);continue;}
   if(distance>72||catEncountered.has(key)||a.meetingEnd||b.meetingEnd||a.pause>now||b.pause>now)continue;
   catEncountered.add(key);
   if(Math.random()>=.30)continue;
   const mode=Math.floor(Math.random()*3);
   // 나란히 앉기는 같은 방향을 보되 몸이 겹치지 않도록 조금 떨어뜨립니다.
   if(mode===2){
    const mid=(a.x+b.x)/2,offset=29;
    a.x=Math.max(30,Math.min(bounds().w-30,mid-offset));
    b.x=Math.max(30,Math.min(bounds().w-30,mid+offset));
    a.node.classList.toggle('is-facing-left',false);
    b.node.classList.toggle('is-facing-left',false);
   }else{
    // 코 인사: 조금 더 가까이, 마주 보기: 현재 위치에서 서로 바라보기.
    if(mode===1&&distance>36){
     const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
     const ux=(b.x-a.x)/distance,uy=(b.y-a.y)/distance;
     a.x=mx-ux*17;a.y=my-uy*17;b.x=mx+ux*17;b.y=my+uy*17;
    }
    a.node.classList.toggle('is-facing-left',b.x>a.x);
    b.node.classList.toggle('is-facing-left',a.x>b.x);
   }
   for(const cat of [a,b]){cat.meetingEnd=now+3000;cat.pause=now+3000;setSpriteFrame(cat,false,now);position(cat);}
   showMeetingBubble((a.x+b.x)/2,Math.min(a.y,b.y)-69);
   document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cat-meeting',cats:[a.id,b.id],action:mode===2?'sit':mode===1?'nose':'look'}}));
  }
  // 사라진 고양이 조합의 판정 기록은 해제합니다.
  for(const key of catEncountered){const [id1,id2]=key.split(':');if(!active.has(id1)||!active.has(id2))catEncountered.delete(key);}
 }
 function residentMeeting(a,now){
  if(a.phase!=='roam'||a.meetingEnd||a.pause>now)return;
  const residents=window.dowonSceneCharacters||[];
  const near=new Set();
  for(const c of residents){
   if(!Number.isFinite(c.routeX)||!Number.isFinite(c.routeY)||!Number.isInteger(c.residentIndex))continue;
   const key=`${a.id}:${c.residentIndex}`,distance=Math.hypot(c.routeX-a.x,c.routeY-a.y);
   if(distance>110){residentEncountered.delete(key);continue;}
   near.add(key);
   if(distance>74||residentEncountered.has(key))continue;
   residentEncountered.add(key);
   if(Math.random()>=.30)continue;
   a.meetingEnd=now+3000;a.pause=now+3000;
   showMeetingBubble(a.x,a.y-69);
   // 주민의 이동·대사·상호작용 상태는 건드리지 않습니다.
   document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cat-resident-meeting',catId:a.id,resident:c.residentIndex}}));
   addRelationship(a.id,c.residentIndex);
   playChirp();
   break;
  }
  for(const key of residentEncountered)if(key.startsWith(`${a.id}:`)&&!near.has(key))residentEncountered.delete(key);
 }

 function bounds(){return {w:Math.max(80,scene.clientWidth),h:Math.max(110,scene.clientHeight)};}
 function actorFor(id,isHome=false){
  if(active.has(id))return active.get(id);
  const c=defs.get(id),node=el('button','village-cat'),sprite=el('span','village-cat-sprite',c.icon||'🐈');
  node.type='button';node.title=`${displayName(id)} 정보 보기`;node.setAttribute('aria-label',`${displayName(id)} 정보 보기`);
  if(c.image){
   sprite.textContent='';const img=el('img');img.src=c.idleImage||c.image;img.alt='';
   img.onerror=()=>{img.remove();sprite.textContent=c.icon||'🐈';const actor=active.get(id);if(actor)actor.animationUnavailable=true;};
   sprite.append(img);
   // 이동 프레임은 미리 불러와 처음 걷는 순간의 깜빡임을 줄입니다.
   for(const path of c.walkImages||[]){const preload=new Image();preload.src=path;}
  }
  const giftBadge=el('span','cat-gift-badge','🎁');giftBadge.hidden=!state.pendingGifts[id];giftBadge.setAttribute('aria-label','고양이가 선물을 발견했습니다');
  node.append(sprite,el('span','village-cat-name',displayName(id)),giftBadge);
  const b=bounds(),a={id,node,x:random(45,b.w-25),y:random(95,b.h-35),tx:0,ty:0,speed:random(96,132),pause:0,phase:isHome?'roam':'arrive',home:isHome,leaveAt:0,nearResident:false,lastProximity:0,meetingEnd:0,ate:false,frame:-1,frameChangedAt:0,animationUnavailable:false};
  node.addEventListener('click',()=>open('collection',id));scene.append(node);active.set(id,a);
  if(!isHome){
   if(!state.activeVisitors.includes(id)){state.activeVisitors.push(id);save();}
   if(state.visitors.includes(id)){
    // 새로고침 전에 밥을 먹었다면 방문 횟수·사료를 다시 소비하지 않고 산책을 복원합니다.
    a.phase='roam';a.ate=true;a.pause=Date.now()+1000;chooseTarget(a);
   }else{
    const target=centerOf($('stray-cat-bowl'));a.x=30;a.y=Math.min(b.h-30,Math.max(95,target.y));a.tx=target.x;a.ty=target.y;
   }
  }
  else{a.pause=Date.now()+2500;chooseTarget(a);}
  position(a);return a;
 }
 function chooseTarget(a){
  const b=bounds();
  // 짧은 거리에서 계속 방향만 바꾸지 않도록 가능한 한 먼 이동 목표를 선택합니다.
  const minDistance=Math.min(220,Math.max(85,b.w*.42));
  let best=null;
  for(let i=0;i<14;i++){
   const tx=random(25,Math.max(26,b.w-25));
   const ty=random(95,Math.max(96,b.h-40));
   const distance=Math.hypot(tx-a.x,ty-a.y);
   if(!best||distance>best.distance)best={tx,ty,distance};
   if(distance>=minDistance){a.tx=tx;a.ty=ty;return;}
  }
  a.tx=best.tx;a.ty=best.ty;
 }
 function position(a){a.node.style.left=`${a.x}px`;a.node.style.top=`${a.y}px`;}
 const WALK_FRAME_MS=220; // 두 배 빨라진 이동에 어울리는 1·2번 걷기 프레임
 function setSpriteFrame(a,moving,now){
  const cat=defs.get(a.id),frames=cat?.walkImages;
  if(!frames?.length||a.animationUnavailable)return;
  const img=a.node.querySelector('.village-cat-sprite img');if(!img)return;
  if(!moving){
   if(a.frame!==2){a.frame=2;img.src=cat.idleImage||cat.image;}
   return;
  }
  if(a.frame===2||a.frame<0){a.frame=0;a.frameChangedAt=now;img.src=frames[0];return;}
  if(now-a.frameChangedAt>=WALK_FRAME_MS){
   a.frame=a.frame===0?1:0;a.frameChangedAt=now;img.src=frames[a.frame];
  }
 }
 function removeActor(id){const actor=active.get(id);if(!actor)return;actor.node.remove();active.delete(id);if(!actor.home&&Array.isArray(state.activeVisitors)){state.activeVisitors=state.activeVisitors.filter(catId=>catId!==id);save();}}
 const bowlImage=type=>type?`item/장식/고양이 가구/${FOODS.find(f=>f.type===type)?.name||'생선'} 밥그릇.png`:'item/장식/고양이 가구/빈그릇.png';
 function refreshBowls(){
  for(const kind of ['stray','home']){
   const bowl=$(`${kind}-cat-bowl`);if(!bowl)continue;
   if(kind==='home')bowl.hidden=!state.adoptedCats.length;
   const count=state[`${kind}Food`],food=FOODS.find(f=>f.type===state[`${kind}FoodType`]);
   const image=bowl.querySelector('img');
   if(image){image.src=count>0?bowlImage(food?.type):bowlImage(null);image.alt=count>0?`${food?.name||''} 밥그릇 · ${count}회분`:'빈그릇';}
   bowl.title=`${kind==='stray'?'길냥이':'집냥이'} 밥그릇 · ${count>0?`${food?.name} ${count}회분`:'비어 있음'} · 눌러 사료 선택`;
  }
 }
 function eat(a){
  if(!a.home&&a.ate)return;
  if(a.home){
   if(state.homeFood>0&&likes(a.id,state.homeFoodType)&&state.lastHomeDay!==day()){
    state.homeFood--;profile(a.id).points+=1;state.lastHomeDay=day();
    if(!state.homeFood)state.homeFoodType=null;save();
   }
  }else{
   a.ate=true;
   if(state.strayFood<=0||!likes(a.id,state.strayFoodType)){
    a.phase='leave';a.tx=Math.max(8,bounds().w-10);a.ty=Math.max(90,a.y);return;
   }
   state.strayFood--;if(!state.strayFood)state.strayFoodType=null;markVisit(a.id);
  }
  document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cat-eat',catId:a.id}}));refreshBowls();renderIfOpen();
 }
 // 기존 길냥이/집냥이 밥그릇을 누르면 재고에서 종류를 선택하여 한 회분씩 채웁니다.
 const feedChooser=el('div','cat-feed-chooser');feedChooser.hidden=true;feedChooser.setAttribute('role','group');feedChooser.setAttribute('aria-label','고양이 사료 선택');
 const chooserHeading=el('strong','','사료를 선택하세요');feedChooser.append(chooserHeading);
 document.body.append(feedChooser);
 let chooserKind='stray';
 function closeFeedChooser(){feedChooser.hidden=true;}
 function refill(kind,type){
  const food=FOODS.find(f=>f.type===type);if(!food)return false;
  const current=state[`${kind}Food`],currentType=state[`${kind}FoodType`];
  if(kind==='home'&&!state.adoptedCats.length)return false;
  if(current>=3){report('밥그릇에는 최대 3회분까지 채울 수 있습니다.');return false;}
  if(current>0&&currentType!==type){report('기존 사료를 모두 먹은 뒤 다른 종류로 채울 수 있습니다.');return false;}
  if(kind==='home'&&!state.adoptedCats.some(c=>likes(c.id,type))){report('입양한 고양이가 좋아하는 사료를 선택해 주세요.');return false;}
  if(feedCount(type)<1||!window.dowonInventory?.take?.(food.key,1)){report(`${food.name} 사료 재고가 없습니다. 상점에서 구매해 주세요.`);return false;}
  state[`${kind}Food`]++;state[`${kind}FoodType`]=type;
  nextVisitAt=Math.min(nextVisitAt||Infinity,Date.now()+8000);
  save();refreshBowls();renderIfOpen();report(`${food.name} 사료를 1회분 채웠습니다.`);return true;
 }
 for(const food of FOODS){
  const item=el('button','cat-feed-choice');item.type='button';item.textContent=`${food.name} ×${feedCount(food.type)}`;
  item.dataset.type=food.type;
  item.addEventListener('click',()=>{if(refill(chooserKind,food.type))closeFeedChooser();else updateFoodChooser();});feedChooser.append(item);
 }
 function updateFoodChooser(){for(const food of FOODS){const b=feedChooser.querySelector(`[data-type="${food.type}"]`);b.textContent=`${food.name} ×${feedCount(food.type)}`;b.disabled=feedCount(food.type)<1;}}
 function showFeedChooser(kind){
  if(kind==='home'&&!state.adoptedCats.length)return;
  chooserKind=kind;updateFoodChooser();
  const rect=$(`${kind}-cat-bowl`).getBoundingClientRect();
  feedChooser.hidden=false;feedChooser.style.left=`${Math.min(Math.max(8,rect.left),Math.max(8,innerWidth-feedChooser.offsetWidth-8))}px`;
  feedChooser.style.top=`${Math.max(8,Math.min(rect.top-feedChooser.offsetHeight-8,innerHeight-feedChooser.offsetHeight-8))}px`;
 }
 document.addEventListener('pointerdown',e=>{if(!feedChooser.hidden&&!feedChooser.contains(e.target)&&!e.target.closest('.cat-bowl'))closeFeedChooser();});
 function buyFeed(){report('사료는 상점 → 반려동물 → 고양이 사료에서 종류와 수량을 선택해 구매할 수 있습니다.');return false;}
 // 주민 근처에서는 1·2·5·6번만 작은 소리로, 놀아주기에서는 3번을 최대 볼륨으로 재생합니다.
 function playCatSound(path,volume){
  if(!path)return;
  const variants=/\.(mp3|wav|ogg|m4a)$/i.test(path)?[path,path.replace(/\.[^.]+$/,'')+'.wav',path.replace(/\.[^.]+$/,'')+'.ogg',path.replace(/\.[^.]+$/,'')+'.m4a']:[path+'.mp3',path+'.wav',path+'.ogg',path+'.m4a'];
  const audio=new Audio();audio.volume=volume;audio.preload='none';let index=0;
  audio.addEventListener('error',()=>{if(++index<variants.length){audio.src=variants[index];audio.play().catch(()=>{});}});
  audio.src=variants[index];audio.play().catch(()=>{});
 }
 // 쓰다듬기 효과음은 하나가 끝날 때까지 재생을 중복 시작하지 않습니다.
 let petSoundActive=false;
 function playPetSound(){
  if(petSoundActive)return;
  const path=window.DOWON_CAT_PLAY_SOUND||'bgm/pet/3.mp3';
  if(!path)return;
  const variants=/\.(mp3|wav|ogg|m4a)$/i.test(path)?[path,path.replace(/\.[^.]+$/,'')+'.wav',path.replace(/\.[^.]+$/,'')+'.ogg',path.replace(/\.[^.]+$/,'')+'.m4a']:[path+'.mp3',path+'.wav',path+'.ogg',path+'.m4a'];
  const audio=new Audio();
  audio.volume=.5;
  audio.preload='none';
  petSoundActive=true;
  let index=0;
  let finished=false;
  const release=()=>{if(finished)return;finished=true;petSoundActive=false;};
  const tryNext=()=>{
   if(finished)return;
   if(++index>=variants.length){release();return;}
   audio.src=variants[index];
   audio.play().catch(()=>{if(!finished&&audio.error)tryNext();else release();});
  };
  audio.addEventListener('ended',release,{once:true});
  audio.addEventListener('error',tryNext);
  audio.src=variants[index];
  audio.play().catch(()=>{if(!finished&&audio.error)tryNext();else release();});
 }
 function playChirp(){
  if(Date.now()-lastChirp<30000)return;
  if(document.hidden)return;
  const sounds=window.DOWON_CAT_SOUNDS||[];
  const path=sounds[Math.floor(Math.random()*sounds.length)];if(!path)return;
  lastChirp=Date.now();
  playCatSound(path,.12);
 }
 function tick(frameNow){
  const now=Date.now();
  ensureDay();const dt=Math.min(.075,(frameNow-(lastFrame||frameNow))/1000);lastFrame=frameNow;
  const b=bounds();
  for(const home of state.adoptedCats)if(!active.has(home.id))actorFor(home.id,true);
  if(state.visitCount<3&&state.strayFood>0&&state.strayFoodType&&now>=nextVisitAt&&state.visitors.length+([...active.values()].filter(a=>!a.home&&!a.ate).length)<3&&state.strayFood>[...active.values()].filter(a=>!a.home&&!a.ate).length){
   const choices=CONFIG.filter(c=>!adopted(c.id)&&!state.visitors.includes(c.id)&&!active.has(c.id)&&likes(c.id,state.strayFoodType));
   if(choices.length){const c=choices[Math.floor(Math.random()*choices.length)];actorFor(c.id);nextVisitAt=now+random(25000,45000);save();}
  }
  for(const a of [...active.values()]){
   releaseMeeting(a,now);
   if(a.pause>now){setSpriteFrame(a,false,now);continue;}
   let dx=a.tx-a.x,dy=a.ty-a.y,dist=Math.hypot(dx,dy),step=a.speed*dt;
   const walking=dist>step&&dist>.2;
   if(walking){
    a.x+=dx/dist*step;a.y+=dy/dist*step;
    // 업로드된 PNG 이동 프레임은 기본적으로 '왼쪽을 보는' 그림입니다.
    // 따라서 오른쪽으로 걸을 때만 좌우 반전하고, 왼쪽으로 걸을 때는 원본을 그대로 씁니다.
    // 수평 이동이 거의 없으면 마지막으로 바라본 방향을 유지합니다.
    if(Math.abs(dx)>1)a.node.classList.toggle('is-facing-left',dx>0);
   }
   else{
    a.x=a.tx;a.y=a.ty;
    if(a.phase==='arrive'){eat(a);if(a.phase!=='leave'){a.phase='roam';a.pause=now+3500;chooseTarget(a);}}
    else if(a.phase==='leave'){removeActor(a.id);continue;}
    else if(a.phase==='home-eat'){eatHome(a);}
    else{if(a.home&&state.homeFood>0&&likes(a.id,state.homeFoodType)&&state.lastHomeDay!==day()&&Math.random()<.18){a.tx=centerOf($('home-cat-bowl')).x;a.ty=centerOf($('home-cat-bowl')).y;a.phase='home-eat';}
     else{a.pause=now+random(1500,5500);chooseTarget(a);}}
    if(a.phase==='home-eat'&&dist<step){eatHome(a);}
   }
   if(a.phase==='home-eat'&&Math.hypot(a.tx-a.x,a.ty-a.y)<2)eatHome(a);
   residentMeeting(a,now);
   setSpriteFrame(a,walking&&a.pause<=now,now);
   position(a);
  }
  catMeetings(now);
  requestAnimationFrame(tick);
 }
 function eatHome(a){if(a.phase!=='home-eat')return;eat(a);a.phase='roam';a.pause=Date.now()+2200;chooseTarget(a);}
 function pet(id,action){
  const p=profile(id);
  if(!p||!active.has(id)||state.petUsed>=DAILY_ACTION_LIMIT||!PET_ACTIONS.includes(action)||p.points<action.min)return;
  state.petUsed++;p.points+=2;save();document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cat-pet',catId:id}}));
  playPetSound();
  render();report(`${displayName(id)} · ${action.name} · 호감도 +2`);
 }
 // 장난감 놀아주기 효과음: 재생 중 연속 클릭 시 새 소리를 시작하지 않습니다.
 let playSoundActive=false;
 function playToySound(){
  if(playSoundActive)return;
  const audio=new Audio('bgm/boing.mp3');
  audio.volume=1; // 화면 클릭 효과음과 동일한 기본 음량
  playSoundActive=true;
  let released=false;
  const release=()=>{if(released)return;released=true;playSoundActive=false;};
  audio.addEventListener('ended',release,{once:true});
  audio.addEventListener('error',release,{once:true});
  audio.play().catch(release);
 }
 function playWith(id,toy){
  const p=profile(id);
  if(!p||!active.has(id)||state.playUsed>=DAILY_ACTION_LIMIT||!CAT_TOYS.includes(toy)||!ownedToys().some(item=>item.key===toy.key))return;
  state.playUsed++;p.points+=toy.affection;document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cat-play',catId:id}}));
  const homeBonus=adopted(id)&&state.lastAdoptedPlayComfortDay!==day();
  if(homeBonus)state.lastAdoptedPlayComfortDay=day();
  save();
  playToySound();
  if(homeBonus)grantComfort(2);
  render();report(`${displayName(id)} · ${toy.name}으로 놀아주기 · 호감도 +${toy.affection}${homeBonus?' · 쾌적도 +2':''}`);
 }
 function adopt(id){const c=defs.get(id);if(!c||adopted(id)||!canAdopt()||profile(id).points<c.adoptAt||!active.has(id))return;
  if(!window.confirm(`${c.name}을(를) 입양하시겠습니까?\n현재 ${state.adoptedCats.length}/${adoptionCapacity()}마리 입양했습니다. 입양한 고양이는 일반 플레이에서 파양할 수 없습니다.`))return;
  if(!window.confirm('입양을 최종 확정하시겠습니까? 일반 플레이에서는 파양할 수 없으며, 하드리셋하면 입양 기록도 초기화됩니다.'))return;
  const raw=window.prompt('입양한 고양이의 이름을 입력해 주세요. (최대 12자)',c.name);
  if(raw===null)return;
  const name=raw.trim().slice(0,12)||c.name;
  state.adoptedCats.push({id,name});state.adopted=state.adoptedCats[0];state.homeFood=0;state.homeFoodType=null;state.visitors=state.visitors.filter(v=>v!==id);state.activeVisitors=state.activeVisitors.filter(v=>v!==id);
  const a=active.get(id);if(a){a.home=true;a.phase='roam';a.pause=Date.now()+1000;chooseTarget(a);a.node.querySelector('.village-cat-name').textContent=name;}
  save();document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cat-adopt',catId:id,name}}));refreshBowls();render();report(`${name}이(가) 전원생활일지의 가족이 되었습니다.`);
 }
 function rename(id){const home=adoptedCat(id);if(!home)return;const raw=window.prompt('고양이의 새 이름을 입력해 주세요. (최대 12자)',home.name);if(raw===null)return;
  const name=raw.trim().slice(0,12);if(!name){report('이름을 한 글자 이상 입력해 주세요.');return;}
  home.name=name;const a=active.get(id);if(a){a.node.title=`${name} 정보 보기`;a.node.querySelector('.village-cat-name').textContent=name;}
  save();document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cat-rename',catId:id}}));render();report('이름을 변경했습니다.');}
 const achievements=[
  ['cat-first','첫 손님','길냥이 1마리 방문',s=>s.visits,1,100],
  ['cat-ten','밥 먹으러 왔어요','길냥이 누적 방문 10회',s=>s.visits,10,300],
  ['cat-five','낯익은 얼굴','같은 길냥이 5회 방문',s=>Math.max(0,...Object.values(s.cats).map(c=>c.visits||0)),5,200],
  ['cat-friend','고양이 친구','고양이 한 마리 호감도 20 달성',s=>Math.max(0,...Object.values(s.cats).map(c=>c.points||0)),20,300],
  ['cat-family','전원생활일지의 가족','고양이 한 마리 입양',s=>Number(Boolean(s.adopted)),1,500],
  ['cat-all','모두 만나봤어요','준비된 고양이 전부 발견',()=>knownCount(),CONFIG.length,400],
  ['cat-days','오늘도 함께','입양한 고양이와 7일 함께 보내기',s=>s.adoptedDays,7,300]
 ];
 function achievementsProgress(){ensureDay();return achievements.map(([id,title,description,fn,target,reward])=>({id,title,description,progress:fn(state),target,reward}));}
 function render(){
  const body=$('cats-content');const previousGalleryScroll=body.querySelector('.cat-book-gallery')?.scrollTop||0;const previousInfoScroll=body.querySelector('.cat-detail-info')?.scrollTop||0;body.replaceChildren();
  const knownCats=CONFIG.filter(c=>profile(c.id).visits>0||adopted(c.id));
  const selectedCat=defs.get(selected)||knownCats[0]||CONFIG[0];
  selected=selectedCat?.id||null;
  const shell=el('div','cat-book-shell');
  const gallery=el('aside','cat-book-gallery');
  const detail=el('section','cat-book-detail');
  shell.append(gallery,detail); body.append(shell);

  // 등록된 모든 고양이를 한 열에 표시합니다. 처음 만난 고양이만 모습을 공개합니다.
  for(const c of CONFIG){
    const p=profile(c.id),known=p.visits>0||adopted(c.id);
    const tile=el('button',`cat-book-card${selected===c.id?' is-selected':''}${known?'':' is-undiscovered'}`);tile.type='button';tile.disabled=!known;
    tile.setAttribute('aria-label',known?`${displayName(c.id)} · 호감도 ${p.points}`:'미발견 고양이');
    const frame=el('span','cat-book-thumb');
    if(known&&c.image){const img=el('img');img.src=c.image;img.alt='';frame.append(img);} else frame.textContent=known?(c.icon||'🐈'):'?';
    const copy=el('span','cat-book-card-copy');
    copy.append(el('strong','',known?displayName(c.id):'미발견'),el('small','',known?`호감도 ${p.points}`:'아직 만나지 못함'));
    tile.append(frame,copy);
    tile.addEventListener('click',()=>{selected=c.id;render();body.querySelector('.cat-detail-info')?.scrollTo(0,0);});
    gallery.append(tile);
  }

  if(!selectedCat)return;
  const c=selectedCat,p=profile(c.id),here=active.has(c.id),isHome=adopted(c.id),known=p.visits>0||isHome;
  if(!known){detail.append(el('p','cat-muted','아직 방문하지 않은 고양이입니다. 길냥이 밥그릇에 사료를 채워 기다려 주십시오.'));return;}
  const layout=el('div','cat-detail-layout');
  const overview=el('div','cat-detail-overview');
  const identity=el('div','cat-detail-identity');
  identity.append(el('h3','cat-name',`${displayName(c.id)} · ${isHome?'집냥이':'길냥이'}`));
  identity.append(el('p','cat-detail-progress',`호감도 ${p.points} / 입양 조건 ${c.adoptAt}`));
  identity.append(el('p','cat-muted',`첫 방문 ${p.firstDay||'-'}일째 · 총 방문 ${p.visits}회`));
  const intro=el('div','cat-detail-overview-side');
  intro.append(el('p','cat-muted',c.personality));
  intro.append(el('p','cat-muted',`좋아하는 사료 : ${favoriteFoodText(c.id)}`));
  const relationEntries=Object.entries(state.relationships[c.id]||{}).map(([idx,score])=>({idx:Number(idx),score:Number(score)||0})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score);
  const relationBox=el('section','cat-resident-friends');relationBox.append(el('strong','cat-subheading','마을 친구'));
  if(!relationEntries.length)relationBox.append(el('p','cat-muted','아직 가까워진 주민이 없습니다. 마을에서 자연스럽게 마주치면 친밀도가 쌓입니다.'));
  for(const rel of relationEntries.slice(0,5)){const row=el('div','cat-friend-row');row.append(el('span','',residentName(rel.idx)),el('span','',`${rel.score} / 50 · ${relationshipLabel(rel.score)}`));relationBox.append(row);}
  intro.append(relationBox);
  overview.append(identity,intro);
  const media=el('div','cat-detail-media');
  if(c.image){const img=el('img');img.src=c.image;img.alt='';media.append(img);}else media.append(el('span','cat-detail-emoji',c.icon||'🐈'));
  const info=el('div','cat-detail-info');
  const pending=state.pendingGifts[c.id],pendingGift=pending&&giftDefs.get(pending.giftId);
  if(pendingGift){
    const giftCard=el('div','cat-found-gift');giftCard.append(giftVisual(pendingGift),el('div','cat-found-gift-copy'));
    const copy=giftCard.querySelector('.cat-found-gift-copy');copy.append(el('strong','',`${displayName(c.id)}이(가) 무언가를 가져왔습니다`),el('small','',pendingGift.name));
    const claim=button('선물 받기',()=>claimGift(c.id));claim.classList.add('cat-gift-claim');giftCard.append(claim);info.append(giftCard);
  }
  const collectionIds=Object.keys(state.giftCollection).filter(id=>state.giftCollection[id]>0&&giftDefs.has(id));
  const giftCollection=el('section','cat-gift-collection');giftCollection.append(el('strong','cat-subheading',`발견한 선물 ${collectionIds.length} / ${GIFT_CATALOG.length}`));
  const giftGrid=el('div','cat-gift-grid');
  for(const gift of GIFT_CATALOG){
    const owned=Number(state.giftCollection[gift.id]||0);
    const cell=el('div',`cat-gift-cell${owned?'':' is-unknown'}`);
    const name=owned?`${gift.name} ×${owned}`:'미발견';
    cell.setAttribute('aria-label',name);
    cell.tabIndex=0; // 모바일 터치와 키보드 포커스에서도 선물 이름을 확인할 수 있습니다.
    cell.append(owned?giftVisual(gift):el('span','cat-gift-visual','?'),el('span','cat-gift-hover-name',name));
    giftGrid.append(cell);
  }giftCollection.append(giftGrid);info.append(giftCollection);
  // 모든 고양이가 공유하는 하루 5회 카운터입니다. 개별 고양이별 제한은 없습니다.
  const interactions=el('div','cat-interactions');
  const petHeader=el('div','cat-interaction-header');
  petHeader.append(el('strong','', '쓰다듬기'),el('span','',`오늘 ${state.petUsed}/${DAILY_ACTION_LIMIT}회`));
  const petGrid=el('div','cat-pet-grid');
  for(const action of PET_ACTIONS){
    const unlocked=p.points>=action.min;
    const btn=button(unlocked?action.name:`${action.name} · 호감도 ${action.min} 필요`,()=>pet(c.id,action),!here||!unlocked||state.petUsed>=DAILY_ACTION_LIMIT);
    btn.classList.add('cat-pet-option');
    if(!unlocked)btn.classList.add('is-locked');
    petGrid.append(btn);
  }
  interactions.append(petHeader,petGrid);
  const playHeader=el('div','cat-interaction-header');
  playHeader.append(el('strong','','놀아주기'),el('span','',`오늘 ${state.playUsed}/${DAILY_ACTION_LIMIT}회`));
  const toysGrid=el('div','cat-toy-inventory');
  const toys=ownedToys();
  if(!toys.length)toysGrid.append(el('p','cat-muted','보유한 장난감이 없습니다. 상점의 반려동물 탭에서 구매해 주세요.'));
  for(const toy of toys){
    const tile=el('button','cat-toy-item');tile.type='button';
    tile.disabled=!here||state.playUsed>=DAILY_ACTION_LIMIT;
    tile.title=`${toy.name} · 호감도 +${toy.affection} · 클릭하면 바로 사용됩니다.`;
    const img=el('img');img.src=toy.image;img.alt='';img.loading='lazy';
    const ownCount=window.dowonFurnitureInventory?.get?.()?.[toy.key]||0;
    tile.append(img,el('strong','',toy.name),el('small','cat-toy-affection',`호감도 +${toy.affection}`),el('small','cat-toy-owned',`보유 ${ownCount}개`));
    tile.addEventListener('click',()=>playWith(c.id,toy));
    toysGrid.append(tile);
  }
  interactions.append(playHeader,toysGrid);
  info.append(interactions);
  const adoptButton=isHome
    ? button('이름 바꾸기',()=>rename(c.id))
    : canAdopt()
      ? button('입양하기',()=>adopt(c.id),!here||p.points<c.adoptAt)
      : button('입양하기',null,true);
  adoptButton.classList.add('cat-detail-action-primary');
  const actions=el('div','cat-detail-actions');actions.append(adoptButton);info.append(actions);
  const note=el('p','cat-muted',here?'현재 마을에 머무르고 있습니다. 자러가기 전까지는 떠나지 않습니다.':'현재 마을에 없어서 교감할 수 없습니다. 방문했을 때만 상호작용할 수 있습니다.');
  info.append(note);
  layout.append(overview,media,info); detail.append(layout);gallery.scrollTop=previousGalleryScroll;info.scrollTop=previousInfoScroll;
 }
 function renderIfOpen(){if(!dialog.hidden)render();}
 function open(next='collection',id=null){
  for(const other of ['warehouse-close','kitchen-close','resident-close','shop-close','order-close','debug-close','village-features-close'])$(other)?.click();
  panel=next;selected=id;dialog.hidden=backdrop.hidden=false;render();report('');$('cats-close').focus();
 }
 function close(){dialog.hidden=backdrop.hidden=true;menu.focus();}
 window.addEventListener('dowon:cat-adoption-capacity-change',renderIfOpen);
 menu.addEventListener('click',()=>open('collection'));
 $('cats-close').addEventListener('click',close);backdrop.addEventListener('click',close);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden){e.stopImmediatePropagation();close();}},true);
 $('stray-cat-bowl').addEventListener('click',()=>showFeedChooser('stray'));
 $('home-cat-bowl').addEventListener('click',()=>showFeedChooser('home'));
 document.addEventListener('dowon:timechange',()=>{ensureDay();if(!dialog.hidden)render();});
 document.addEventListener('visibilitychange',()=>{lastFrame=0;});
 window.dowonCats={get:()=>JSON.parse(JSON.stringify(state)),getFeed:()=>Object.fromEntries(FOODS.map(f=>[f.type,feedCount(f.type)])),buyFeed,achievements:achievementsProgress,gifts:()=>GIFT_CATALOG.map(g=>({...g})),relationship:(catId,residentIndex)=>relationshipScore(catId,residentIndex)};
 ensureDay();refreshBowls();nextVisitAt=Date.now()+8000;for(const home of state.adoptedCats)rollGift(home.id);
 for(const id of (state.activeVisitors||[]))if(defs.has(id)&&!adopted(id)&&!active.has(id))actorFor(id,false);
 for(const home of state.adoptedCats)actorFor(home.id,true);
 requestAnimationFrame(tick);
})();
