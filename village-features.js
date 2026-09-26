/* 전원생활일지 생활 확장: 선물, 요리 도감, 업적. 기존 저장 키와 분리. */
(() => {
 'use strict';
 const KEY='dangcheong-dowon-life-features-v1';
 const $=id=>document.getElementById(id);
 const recipes=()=>window.DOWON_COOKING_RECIPES||[];
 const visibleRecipes=()=>recipes().filter(recipe=>{
   if(!recipe.residentName)return true;
   return residents().some(person=>person?.name?.trim()===recipe.residentName);
 });
 const inv=()=>window.dowonInventory;
 const wallet=()=>window.dowonWallet;
 const grantComfort=amount=>{const c=window.dowonComfort;if(!c?.get||!c?.set)return false;c.set(c.get()+amount);return true;};
 const achievementComfort=(title)=>{
  const fifty=new Set(['풍년이로구나','손이 열 개라도 모자라','공방이 가득한 마을','백 번의 식사','요리 도감 완성','주문 해결사','마을의 해결사','안녕. 전원생활일지','모두 모여 살아요','한 달의 마을 생활','열세 마리의 발자국','고양이들의 아지트','오래오래 함께','손길이 익숙해졌어','계절을 한 바퀴','계절을 담은 상자','고양이를 위한 공간','모두가 좋아해']);
  const twenty=new Set(['풍요로운 밭','땅을 넓히다','마을의 요리사','자꾸 부르게 되네','가까워진 사이','마을의 배달부','오늘은 장사가 잘되네','부탁받기 바쁜 하루','우리 마을을 꾸며요','열 번의 아침','골고루 준비했어요','쓰담쓰담','작고 소중한 것들']);
  return fifty.has(title)?50:twenty.has(title)?20:10;
};
 const day=()=>window.dowonClock?.get()?.day||1;
 const residents=()=>{try{const a=JSON.parse(localStorage.getItem('dangcheong-dowon-player-residents-v1')||'[]');return Array.from({length:5},(_,i)=>a[i]?.name?{...a[i],index:i}:null);}catch(_){return Array(5).fill(null);}};
 const labels=()=>window.dowonItemDescriptions||{};
 const nameOf=k=>recipes().find(r=>r.output===k)?.name||labels()[k]?.name||k;
 const imageOf=k=>{const r=recipes().find(r=>r.output===k);return r?.icon||`item/${["eggPancake","egg","chickenFeed","tofu","ricePowder","flour","sugar","saltedEgg","friedTofu","pickledVegetables"].includes(k)?"가공품":"작물"}/${nameOf(k)}.png`;};
 const defaults=()=>({gifts:{},giftTastes:{},collection:{},stats:{harvest:0,processed:0,cooked:0,gifts:0},claimed:{},extra:{totals:{},byItem:{},orderByResident:{},catByResident:{},catGiftsByCat:{},daily:{},flags:{},seasons:{},feedPurchased:{}}});
 let state=defaults();
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object'){
   state={...defaults(),...saved,gifts:saved.gifts||{},giftTastes:saved.giftTastes||{},collection:saved.collection||{},claimed:saved.claimed||{},stats:{...defaults().stats,...(saved.stats||{})},extra:{...defaults().extra,...(saved.extra||{})}};
 }}catch(e){console.warn('생활 기록 불러오기 실패',e);}
 // 구버전 '오늘의 부탁' 저장 필드는 더 이상 사용하지 않습니다.
 delete state.day; delete state.quests; delete state.bonusClaimed; if(state.stats)delete state.stats.requests;
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(e){console.warn('생활 기록 저장 실패',e);return false;}};
 const emit=(type,detail={})=>document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type,...detail}}));
 const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 const button=(text,run,cls='')=>{const b=node('button',cls,text);b.type='button';b.addEventListener('click',run);return b;};
 const available=()=>Object.keys(labels()).filter(k=>inv()?.get(k)>0);
 const storedKeys=()=>Object.keys(labels());
 const hasGift=i=>state.gifts[i]===day();
 function preferencesFor(i){const choices=storedKeys();const picks=['eggPancake','egg','tofu','food_Egg_noodles','flour','sugar','rice','bean','cabbage','sugarcane'].filter(k=>choices.includes(k));const preferred=picks.length?picks:['rice','bean'];return {favorite:preferred[i%preferred.length],likes:[preferred[(i+1)%preferred.length],preferred[(i+2)%preferred.length]].filter(Boolean),dislike:preferred[(i+5)%preferred.length]};}
 // 각 슬롯별 취향을 resident-gifts.js에서 바꿀 수 있고, 미설정이면 기본 선호도를 사용.
 function taste(i,k){const cfg=window.dowonGiftPreferences?.[i]||preferencesFor(i);const chosen=window.dowonGiftChoices?.get(i)||[];return chosen.includes(k)?'favorite':(cfg.likes||[]).includes(k)?'like':cfg.dislike===k?'dislike':'normal';}
 function modal(){const backdrop=$('village-features-backdrop'),dialog=$('village-features-dialog');return {backdrop,dialog};}
 let current='';
 let activeAchievementCategory='농사';
 function close(){const {backdrop,dialog}=modal();if(!dialog)return;dialog.hidden=backdrop.hidden=true;current='';}
 function open(title,kind){const {backdrop,dialog}=modal();if(!dialog)return;
  for(const id of ['warehouse-close','kitchen-close','resident-close','shop-close','order-close','debug-close'])$(id)?.click();
  if(kind==='achievements')activeAchievementCategory='농사';
  current=kind;$('village-features-title').textContent=title;dialog.hidden=backdrop.hidden=false;renderModal();$('village-features-close').focus();
 }
 const message=s=>{$('village-features-status').textContent=s||'';};
 const root=()=>$('village-features-content');
 const itemImg=k=>{const img=node('img','vf-item-image');img.src=imageOf(k);img.alt=nameOf(k);img.loading='lazy';img.onerror=()=>{img.onerror=null;img.style.display='none';};return img;};
 function renderGift(){const i=Number(current.slice(5));const r=residents()[i];if(!r){root().textContent='등록된 주민이 없습니다.';return;}
  const header=node('div','vf-note',`${r.name} · ${day()}일째 · ${hasGift(i)?'오늘 선물 완료':'오늘 0/1회'}`);root().append(header);
  if(!hasGift(i))root().append(node('p','vf-note','선물할 아이템을 선택해 주세요. 주민마다 선호하는 아이템이 다릅니다.'));
  const keys=available();if(!keys.length)root().append(node('p','vf-note','창고에 선물할 물품이 없습니다.'));
  const grid=node('div','vf-item-grid');root().append(grid);
  for(const key of keys){const owned=inv().get(key);if(owned<1)continue;
   const card=button('',()=>gift(i,key),'vf-item-card');card.disabled=hasGift(i);card.append(itemImg(key),node('strong','',nameOf(key)),node('small','',`보유 ×${owned}`));
   grid.append(card);
  }
  const known=state.giftTastes[i]||{};if(Object.keys(known).length){const box=node('div','vf-note','지금까지 확인한 선물 반응:');root().append(box);for(const [k,v] of Object.entries(known))box.append(node('span','vf-known',`${nameOf(k)} · ${v==='favorite'?'아주 좋아함':v==='like'?'좋아함':v==='dislike'?'싫어함':'보통'}`));}
 }
 function gift(i,key){if(!residents()[i]||hasGift(i)||inv()?.get(key)<1)return;
  if(!window.dowonAffinity?.addMpcPoints){message('호감도 시스템을 불러오지 못했습니다.');return;}
  if(!inv().take(key,1)){message('아이템을 전달하지 못했습니다.');return;}
  const feeling=taste(i,key),points=feeling==='favorite'?5:feeling==='like'?3:feeling==='dislike'?0:1;
  if(points)window.dowonAffinity.addMpcPoints(i,points);
  state.gifts[i]=day();(state.giftTastes[i]||(state.giftTastes[i]={}))[key]=feeling;state.stats.gifts++;save();
  renderModal();message(`호감도 +${points}`);emit('gift',{resident:i,item:key});
 }
 const ex=()=>{state.extra.catSocial ||= {};state.extra.seasonsSeen ||= {};return state.extra;};
 const totals=()=>ex().totals;
 const n=(key)=>Number(totals()[key])||0;
 const itemN=(kind,key)=>Number(ex().byItem[kind+':'+key])||0;
 const increment=(key,qty=1)=>{totals()[key]=(Number(totals()[key])||0)+qty;};
 const countKeys=(obj,minimum=1)=>Object.values(obj||{}).filter(v=>Number(v)>=minimum).length;
 const cats=()=>window.dowonCats?.get?.()||{};
 const catProfiles=()=>Object.values(cats().cats||{});
 const knownCats=()=>catProfiles().filter(c=>Number(c.visits)>0).length;
 const adoptedCats=()=>cats().adoptedCats||[];
 const maxCatPoints=()=>Math.max(0,...catProfiles().map(c=>Number(c.points)||0));
 const catsAbove=x=>catProfiles().filter(c=>Number(c.points)>=x).length;
 const uniqueGiftCount=()=>countKeys(cats().giftCollection);
 const giftCount=()=>Object.values(cats().giftCollection||{}).reduce((a,v)=>a+(Number(v)||0),0);
 const prog=()=>{try{return JSON.parse(localStorage.getItem('dangcheong-dowon-progression-v1')||'{}');}catch(_){return {};}};
 const builtCount=()=>Object.values(prog().workshops||{}).filter(x=>Number(x)===-1).length+1;
 const shopKeys=()=>{try{return Object.keys(JSON.parse(localStorage.getItem('dangcheong-dowon-shop-collection-v1')||'{}').purchased||{});}catch(_){return [];}};
 const furniture=()=>window.dowonFurniture||{};
 const reqHearts=()=>Array.from({length:2},(_,i)=>window.dowonAffinity?.get?.('mpc',i)?.hearts||0);
 const make=(id,title,category,description,progress,target=1,reward=100)=>[id,title,category,description,progress,target,reward];
 const extraDefs=[];
 const add=(id,title,category,description,progress,target=1,reward=100)=>extraDefs.push(make('extra-'+id,title,category,description,progress,target,reward));

 const achievementDefs=[
  ['first-harvest','첫 수확','농사','작물 1개 수확',s=>s.stats.harvest,1,100],
  ['harvest-100','풍요로운 밭','농사','작물 누적 100개 수확',s=>s.stats.harvest,100,300],
  ['first-processed','첫 가공','생산','가공품 1개 수령',s=>s.stats.processed,1,100],
  ['processed-100','마을의 일꾼','생산','가공품 누적 100개 수령',s=>s.stats.processed,100,400],
  ['first-cook','첫 요리','요리','요리 1회 완성',s=>s.stats.cooked,1,100],
  ['master-5','능숙한 요리사','요리','서로 다른 요리 5종 숙련도 4/4',s=>Object.values(window.dowonKitchen?.get()?.mastery||{}).filter(v=>v>=4).length,5,500],
  ['dish-5','요리 수집가','요리','서로 다른 요리 5종 발견',s=>Object.keys(s.collection).length,5,300],
  ['gift-10','작은 정성','주민','선물 누적 10회',s=>s.stats.gifts,10,250],
  ['friendship','가까워진 사이','주민','주민 1명 호감도 하트 3개 달성',()=>Array.from({length:5},(_,i)=>window.dowonAffinity?.get?.('mpc',i)?.hearts||0).reduce((a,b)=>Math.max(a,b),0),3,300],
  ['comfort-100','마을 꾸미기','마을','쾌적도 100 달성',()=>window.dowonComfort?.get?.()||0,100,200],
  ['comfort-1000','북적이는 전원생활일지','마을','쾌적도 1,000 달성',()=>window.dowonComfort?.get?.()||0,1000,800],
  ['cat-first','첫 손님','고양이','길냥이 1마리 방문',()=>window.dowonCats?.achievements()?.find(a=>a.id==='cat-first')?.progress||0,1,100],
  ['cat-ten','밥 먹으러 왔어요','고양이','길냥이 누적 방문 10회',()=>window.dowonCats?.achievements()?.find(a=>a.id==='cat-ten')?.progress||0,10,300],
  ['cat-five','낯익은 얼굴','고양이','같은 길냥이 5회 방문',()=>window.dowonCats?.achievements()?.find(a=>a.id==='cat-five')?.progress||0,5,200],
  ['cat-friend','고양이 친구','고양이','고양이 한 마리 호감도 20 달성',()=>window.dowonCats?.achievements()?.find(a=>a.id==='cat-friend')?.progress||0,20,300],
  ['cat-family','전원생활일지의 가족','고양이','고양이 한 마리 입양',()=>window.dowonCats?.achievements()?.find(a=>a.id==='cat-family')?.progress||0,1,500],
  ['cat-all','모두 만나봤어요','고양이','준비된 고양이 전부 발견',()=>window.dowonCats?.achievements()?.find(a=>a.id==='cat-all')?.progress||0,window.DOWON_CAT_CONFIG?.length||13,400],
  ['cat-days','오늘도 함께','고양이','입양한 고양이와 7일 함께 보내기',()=>window.dowonCats?.achievements()?.find(a=>a.id==='cat-days')?.progress||0,7,300]
 ];
 add("extra-hello","안녕. 전원생활일지","마을","처음 게임을 시작했습니다.",()=>(1),1);
 add("extra-sow","씨앗 한 알","농사","작물 처음 심기",()=>(n("plant")),1);
 add("extra-harvest500","밭일이 익숙해졌어","농사","작물 누적 500개 수확",()=>(state.stats.harvest),500);
 add("extra-harvest1000","풍년이로구나","농사","작물 누적 1,000개 수확",()=>(state.stats.harvest),1000);
 add("extra-allcrops","골고루 심어요","농사","작물 7종을 각각 한 번 이상 수확",()=>(["wheat","bean","sugarcane","paddy","cabbage","pepper","potato"].filter(k=>itemN("harvest",k)>0).length),7);
 add("extra-fullplant","빈틈없는 농부","농사","사용 가능한 밭 모든 칸에 작물 심기",()=>(n("fullplant")),1);
 add("extra-farmopen","땅을 넓히다","농사","추가 밭 첫 해금",()=>(Math.max(0,(Number(prog().farms)||1)-1)),1);
 add("extra-allfarms","마을의 대농장","농사","모든 밭 해금",()=>(Number(prog().farms)>=4?1:0),1);
 add("extra-crop-wheat","밀밭의 주인","농사","wheat 누적 100개 수확",()=>(itemN("harvest","wheat")),100);
 add("extra-crop-bean","콩 한 바구니","농사","bean 누적 100개 수확",()=>(itemN("harvest","bean")),100);
 add("extra-crop-sugarcane","달콤한 수확","농사","sugarcane 누적 100개 수확",()=>(itemN("harvest","sugarcane")),100);
 add("extra-crop-paddy","쌀밥의 시작","농사","paddy 누적 100개 수확",()=>(itemN("harvest","paddy")),100);
 add("extra-crop-cabbage","채소밭 가꾸기","농사","cabbage 누적 100개 수확",()=>(itemN("harvest","cabbage")),100);
 add("extra-crop-pepper","매콤한 하루","농사","pepper 누적 100개 수확",()=>(itemN("harvest","pepper")),100);
 add("extra-crop-potato","땅속의 보물","농사","potato 누적 100개 수확",()=>(itemN("harvest","potato")),100);
 add("extra-prod500","바쁜 가공소","생산","가공품 누적 500개 수령",()=>(state.stats.processed),500);
 add("extra-prod1000","손이 열 개라도 모자라","생산","가공품 누적 1000개 수령",()=>(state.stats.processed),1000);
 add("extra-prod-chickenFeed","닭들의 식사","생산","chickenFeed 누적 50개 생산",()=>(itemN("processed","chickenFeed")),50);
 add("extra-prod-egg","달걀 한 바구니","생산","egg 누적 50개 생산",()=>(itemN("processed","egg")),50);
 add("extra-prod-sugar","달콤한 공방","생산","sugar 누적 50개 생산",()=>(itemN("processed","sugar")),50);
 add("extra-prod-tofu","두부 장인","생산","tofu 누적 50개 생산",()=>(itemN("processed","tofu")),50);
 add("extra-prod-flour","곡식의 변신","생산","flour 누적 50개 생산",()=>(itemN("processed","flour")),50);
 add("extra-all-prods","정성 들인 한 끼","생산","서로 다른 가공품 7종 이상 수령",()=>(countKeys(Object.fromEntries(Object.entries(ex().byItem).filter(([k])=>k.startsWith("processed:"))))),7);
 add("extra-sixslots","쉬지 않는 가공소","생산","가공 슬롯 6칸을 동시에 사용",()=>(n("sixslots")),1);
 add("extra-all-workshops","공방이 가득한 마을","생산","모든 가공소 해금",()=>(builtCount()>=Object.keys(window.dowonProgression?.settings?.workshops||{}).length+1?1:0),1);
 add("extra-cook10","오늘은 내가 요리사","요리","요리 누적 10회 완성",()=>(state.stats.cooked),10);
 add("extra-cook100","마을의 요리사","요리","요리 누적 100회 완성",()=>(state.stats.cooked),100);
 add("extra-cook500","백 번의 식사","요리","요리 누적 500회 완성",()=>(state.stats.cooked),500);
 add("extra-recipe10","새로운 맛","요리","요리 도감 10종 발견",()=>(Object.keys(state.collection).length),10);
 add("extra-recipe20","식탁이 풍성해졌어","요리","요리 도감 20종 발견",()=>(Object.keys(state.collection).length),20);
 add("extra-master1","완벽한 한 접시","요리","요리 1종 숙련도 4/4",()=>(Object.values(window.dowonKitchen?.get?.()?.mastery||{}).filter(x=>x>=4).length),1);
 add("extra-master10","손맛이 살아있네","요리","요리 10종 숙련도 4/4",()=>(Object.values(window.dowonKitchen?.get?.()?.mastery||{}).filter(x=>x>=4).length),10);
 add("extra-secret1","비밀의 요리법","요리","히든 레시피 첫 발견",()=>(n("secret")),1);
 add("extra-secretall","비밀을 모두 풀다","요리","히든 레시피 모두 발견",()=>(recipes().filter(r=>r.residentName&&state.collection[r.id]).length),Math.max(1,recipes().filter(r=>r.residentName).length));
 add("extra-plum","매화 향기","요리","매화주 처음 만들기",()=>(n("plum")),1);
 add("extra-all-recipes","요리 도감 완성","요리","현재 준비된 모든 요리 발견",()=>(Object.keys(state.collection).length),Math.max(1, recipes().length));
 add("extra-cat3","새로운 발자국","고양이","서로 다른 고양이 3종 발견",()=>(knownCats()),3);
 add("extra-cat7","마을 고양이 탐험가","고양이","서로 다른 고양이 7종 발견",()=>(knownCats()),7);
 add("extra-cat13","열세 마리의 발자국","고양이","고양이 13종 모두 발견",()=>(knownCats()),13);
 add("extra-cat20","단골손님","고양이","같은 고양이 20회 방문",()=>(Math.max(0,...catProfiles().map(c=>Number(c.visits)||0))),20);
 add("extra-cat100","매일 놀러 와","고양이","고양이 누적 100회 방문",()=>(cats().visits||0),100);
 add("extra-cat500","고양이들의 아지트","고양이","고양이 누적 500회 방문",()=>(cats().visits||0),500);
 add("extra-cat50","마음의 문을 열다","고양이","고양이 한 마리 호감도 50 달성",()=>(maxCatPoints()),50);
 add("extra-cat5friends","고양이들의 친구","고양이","고양이 5마리 호감도 50 달성",()=>(catsAbove(50)),5);
 add("extra-catall50","모두가 좋아해","고양이","고양이 13마리 호감도 50 달성",()=>(catsAbove(50)),13);
 add("extra-adopt2","우리 집 두 번째 고양이","고양이","고양이 2마리 입양",()=>(adoptedCats().length),2);
 add("extra-adopt4","네 마리의 가족","고양이","고양이 4마리 입양",()=>(adoptedCats().length),4);
 add("extra-rename","새 이름을 선물했어","고양이","입양한 고양이 처음 이름 변경",()=>(n("cat-rename")),1);
 add("extra-rattan","같이 살자","고양이","고양이 입양용 등나무집 구매",()=>(Object.entries(furniture()).some(([k,v])=>v.adoptionBonus&&shopKeys().includes(k))?1:0),1);
 add("extra-cat30days","함께한 시간","고양이","입양 고양이와 30일 함께",()=>(cats().adoptedDays||0),30);
 add("extra-cat100days","오래오래 함께","고양이","입양 고양이와 100일 함께",()=>(cats().adoptedDays||0),100);
 add("extra-feed1","밥 먹고 가렴","고양이","고양이 첫 사료 먹이기",()=>(n("cat-eat")),1);
 add("extra-feed10","빈 그릇이 되었어요","고양이","고양이 사료 섭취 누적 10회",()=>(n("cat-eat")),10);
 add("extra-feed100","고양이 급식소","고양이","고양이 사료 섭취 누적 100회",()=>(n("cat-eat")),100);
 add("extra-foodliked","입맛에 딱 맞아","고양이","고양이가 좋아하는 사료 첫 섭취",()=>(n("cat-eat")),1);
 add("extra-feedtypes","골고루 준비했어요","고양이","사료 생선·닭고기·오리고기 모두 구매",()=>(countKeys(ex().feedPurchased)),3);
 add("extra-pet1","쓰다듬어도 될까?","고양이","고양이 처음 쓰다듬기",()=>(n("cat-pet")),1);
 add("extra-pet50","쓰담쓰담","고양이","고양이 쓰다듬기 누적 50회",()=>(n("cat-pet")),50);
 add("extra-pet200","손길이 익숙해졌어","고양이","고양이 쓰다듬기 누적 200회",()=>(n("cat-pet")),200);
 add("extra-play1","같이 놀자","고양이","고양이와 처음 놀아주기",()=>(n("cat-play")),1);
 add("extra-play50","장난감은 즐거워","고양이","고양이 놀아주기 누적 50회",()=>(n("cat-play")),50);
 add("extra-alltoys","장난감 수집가","고양이","고양이 장난감 3종 구매",()=>(["cat_rattan_ball","cat_fishing_rod","cat_catnip_pouch"].filter(k=>Number(window.dowonFurnitureInventory?.get?.()[k])>0||shopKeys().includes(k)).length),3);
 add("extra-allcatfurniture","고양이를 위한 공간","고양이","고양이 가구 종류별로 구매",()=>(Object.entries(furniture()).filter(([k,v])=>v.adoptionBonus&&Number(window.dowonFurnitureInventory?.get?.()[k])>0).length),Math.max(1,Object.values(furniture()).filter(v=>v.adoptionBonus).length));
 add("extra-meet1","어색한 첫인사","고양이","고양이끼리 처음 상호작용",()=>(n("cat-meeting")),1);
 add("extra-meet10","고양이들의 수다","고양이","고양이끼리 누적 10회 상호작용",()=>(n("cat-meeting")),10);
 add("extra-meet100","고양이들의 사교 모임","고양이","고양이끼리 누적 100회 상호작용",()=>(n("cat-meeting")),100);
 add("extra-sit","나란히 나란히","고양이","고양이끼리 나란히 앉기 첫 발생",()=>(n("cat-sit")),1);
 add("extra-nose","코를 맞대고","고양이","고양이끼리 코 인사 첫 발생",()=>(n("cat-nose")),1);
 add("extra-human10","고양이와 마을 사람들","고양이","고양이와 주민 연출형 만남 10회",()=>(n("cat-resident-meeting")),10);
 add("extra-human2","모두의 관심을 받아","고양이","고양이 한 마리가 서로 다른 주민 2명과 만남",()=>(Math.max(0,...Object.values(ex().catByResident).map(o=>countKeys(o)))),2);
 add("extra-social50","마을의 인기 고양이","고양이","고양이 한 마리가 누적 50회 상호작용",()=>(Math.max(0,...Object.values(ex().catSocial||{}).map(Number))),50);
 add("extra-gift1","작은 선물","고양이","고양이 첫 선물 받기",()=>(giftCount()),1);
 add("extra-gift10","고양이의 보물상자","고양이","고양이 선물 누적 10개 발견",()=>(giftCount()),10);
 add("extra-gift50","어디서 주워 왔니?","고양이","고양이 선물 누적 50개 발견",()=>(giftCount()),50);
 add("extra-gifts3","작고 소중한 것들","고양이","서로 다른 고양이 선물 3종 발견",()=>(uniqueGiftCount()),3);
 add("extra-gifts5","반짝이는 수집가","고양이","서로 다른 고양이 선물 5종 발견",()=>(uniqueGiftCount()),5);
 add("extra-allgifts","고양이의 보물 도감","고양이","선물 10종 모두 발견",()=>(uniqueGiftCount()),10);
 add("extra-flower","봄의 선물","고양이","눌러 말린 꽃 발견",()=>(Number(cats().giftCollection?.["pressed-flower"])||0),1);
 add("extra-clover","행운을 물고 왔어","고양이","네잎클로버 발견",()=>(countKeys(Object.fromEntries(Object.entries(cats().giftCollection||{}).filter(([k])=>/clover/.test(k))))),1);
 add("extra-autumn","가을의 흔적","고양이","도토리·낙엽·솔방울 모두 발견",()=>(["acorn","fallen-leaf","pinecone"].filter(k=>Object.keys(cats().giftCollection||{}).some(g=>g===k)).length),3);
 add("extra-seasongift","계절을 담은 상자","고양이","사계절마다 고양이 선물 받기",()=>(countKeys(ex().seasons)),4);
 add("extra-samecatgift","선물은 마음이지","고양이","같은 고양이에게 선물 누적 10개 받기",()=>(Math.max(0,...Object.values(ex().catGiftsByCat).map(Number))),10);
 add("extra-click1","첫인사","주민","주민 한 명 첫 클릭",()=>(n("resident-click")),1);
 add("extra-click100","자꾸 부르게 되네","주민","주민 누적 100회 클릭",()=>(n("resident-click")),100);
 add("extra-gift-first","처음 전하는 마음","주민","주민에게 첫 선물 전달",()=>(state.stats.gifts),1);
 add("extra-gift50","선물하는 즐거움","주민","주민에게 누적 50회 선물",()=>(state.stats.gifts),50);
 add("extra-favorite","취향을 알아가는 중","주민","주민이 아주 좋아하는 선물 첫 발견",()=>(n("resident-favorite")),1);
 add("extra-favorite10","취향 저격","주민","주민 한 명에게 아주 좋아하는 선물 누적 10회 전달",()=>(Math.max(0,...Object.values(ex().favoriteByResident||{}).map(Number))),10);
 add("extra-relationship1","마음이 통했어","주민","주민 간 관계 첫 변화",()=>(n("resident-relationship-change")),1);
 add("extra-friendtwo","마을의 친구","주민","기본 주민 2명 모두 호감도 하트 3개",()=>(reqHearts().filter(x=>x>=3).length),2);
 add("extra-maxhearts","소중한 사이","주민","주민 한 명의 호감도 하트 최대치",()=>(Math.max(0,...reqHearts())),10);
 add("extra-farmfirst","밭에서 만났어요","주민","주민의 밭 반응 첫 발생",()=>(n("resident-farm")),1);
 add("extra-farm20","오늘도 밭이 궁금해","주민","주민의 밭 반응 누적 20회",()=>(n("resident-farm")),20);
 add("extra-order1","첫 주문","주민","주민 주문 첫 완료",()=>(n("order-complete")),1);
 add("extra-order10","주문이 들어왔어요","주민","주민 주문 누적 10건 완료",()=>(n("order-complete")),10);
 add("extra-order50","마을의 배달부","주민","주민 주문 누적 50건 완료",()=>(n("order-complete")),50);
 add("extra-order100","주문 해결사","주민","주민 주문 누적 100건 완료",()=>(n("order-complete")),100);
 add("extra-repeat5","낯익은 손님","주민","같은 주민 주문 5건 완료",()=>(Math.max(0,...Object.values(ex().orderByResident).map(Number))),5);
 add("extra-tenorders","열 명의 단골","주민","서로 다른 주민 10명의 주문 완료",()=>(countKeys(ex().orderByResident)),10);
 add("extra-repeat20","또 오셨네요","주민","같은 주민 주문 누적 20건 완료",()=>(Math.max(0,...Object.values(ex().orderByResident).map(Number))),20);
 add("extra-dayorders5","오늘은 장사가 잘되네","주민","게임 내 하루에 주문 5건 완료",()=>(Number(ex().daily.order||0)),5);
 add("extra-largeorder","창고가 텅 비었어","주민","주문 하나로 물품 20개 이상 납품",()=>(n("largeorder")),1);
 add("extra-request1","작은 부탁 하나","주민","주민 머리 위 부탁 첫 완료",()=>(n("resident-request")),1);
 add("extra-request10","부탁받기 바쁜 하루","주민","주민 머리 위 부탁 10건 완료",()=>(n("resident-request")),10);
 add("extra-request50","언제든 도와줄게","주민","주민 머리 위 부탁 50건 완료",()=>(n("resident-request")),50);
 add("extra-request5day","오늘은 내가 해결사","주민","게임 내 하루에 상시 주민 부탁 5건 완료",()=>(Number(ex().daily.request||0)),5);
 add("extra-requeststreak","부탁은 놓치지 않아","주민","주민 머리 위 부탁 연속 5건 성공",()=>(n("request-streak")),5);
 add("extra-firstnews","첫 마을 기록","마을","첫날의 마을 기록 확인",()=>(window.dowonNews?.get?.()?.history?.length||0),1);
 add("extra-furniture1","첫 번째 장식","마을","가구 첫 구매",()=>(shopKeys().length),1);
 add("extra-furniture10","우리 마을을 꾸며요","마을","서로 다른 가구 10종 구매",()=>(shopKeys().length),10);
 add("extra-furniture30","수집가의 방","마을","서로 다른 가구 30종 구매",()=>(shopKeys().length),30);
 add("extra-allfurniture","꾸미기의 달인","마을","상점 일반 가구 모두 구매",()=>(Object.keys(furniture()).filter(k=>!furniture()[k].isFeed&&!furniture()[k].adoptionBonus).filter(k=>shopKeys().includes(k)).length),Object.keys(furniture()).filter(k=>!furniture()[k].isFeed&&!furniture()[k].adoptionBonus).length);
 add("extra-comfort500","쾌적한 하루","마을","쾌적도 500 달성",()=>(window.dowonComfort?.get?.()||0),500);
 add("extra-comfort2000","살기 좋은 마을","마을","쾌적도 2,000 달성",()=>(window.dowonComfort?.get?.()||0),2000);
 add("extra-comfort5000","모두 모여 살아요","마을","쾌적도 5,000 달성",()=>(window.dowonComfort?.get?.()||0),5000);
 add("extra-facility1","새로운 일터","마을","시설 첫 해금",()=>(n("facility-unlocked")),1);
 add("extra-facility5","마을이 성장했어요","마을","시설 5개 해금",()=>(n("facility-unlocked")),5);
 add("extra-facilitiesall","모든 것이 갖춰진 마을","마을","모든 시설 해금",()=>(builtCount()>=Object.keys(window.dowonProgression?.settings?.workshops||{}).length+1?1:0),1);
 add("extra-cathouse","오늘부터 집사","마을","등나무집 구매",()=>(Object.entries(furniture()).some(([k,v])=>v.adoptionBonus&&Number(window.dowonFurnitureInventory?.get?.()[k])>0)?1:0),1);
 add("extra-orderslots","손님맞이 준비 완료","마을","주민 주문판 모든 칸 해금",()=>(Number(prog().orders)>=5?1:0),1);
 add("extra-farmexpand","넓어진 밭","마을","밭 확장 완료",()=>(Number(prog().farms)>=4?1:0),1);
 add("extra-sleep1","첫 번째 밤","마을","처음 자러가기",()=>(n("sleep")),1);
 add("extra-day10","열 번의 아침","마을","게임 내 10일째 도달",()=>(day()),10);
 add("extra-day30","한 달의 마을 생활","마을","게임 내 30일째 도달",()=>(day()),30);
 add("extra-fourseasons","계절을 한 바퀴","마을","사계절 모두 경험",()=>(countKeys(ex().seasonsSeen)),4);
 add("extra-rain","비 오는 날의 풍경","마을","비 오는 날 처음 맞이하기",()=>(n("rain")),1);
 add("extra-snow","눈 내리는 마을","마을","눈 오는 날 처음 맞이하기",()=>(n("snow")),1);
 // 주민 관계 업적: 직접 설정한 관계 단계와 실제 발생한 행동 이벤트를 구분합니다.
 const registeredResidentIndices=()=>residents().filter(Boolean).map(p=>p.index);
 const residentPairs=()=>{const idx=registeredResidentIndices(),list=[];for(let i=0;i<idx.length;i++)for(let j=i+1;j<idx.length;j++)list.push({a:idx[i],b:idx[j],...window.nakwonResidentPairs?.get?.(idx[i],idx[j])});return list;};
 const isFriend=pair=>pair.love||pair.score>=50;
 const hasRelationship=level=>residentPairs().some(p=>p.score>=level);
 const relationFlags=()=>ex().relationAchievements||(ex().relationAchievements={});
 const eventTypes=()=>relationFlags().eventTypes||(relationFlags().eventTypes={});
 const relationCounts=()=>relationFlags().counts||(relationFlags().counts={});
 const pairFriendCount=()=>Math.max(0,...registeredResidentIndices().map(i=>residentPairs().filter(p=>(p.a===i||p.b===i)&&isFriend(p)).length));
 add('relation-first','처음 뵙겠습니다','주민','주민 두 명이 처음으로 상호작용',()=>n('resident-pair-event'),1);
 add('relation-known','조금은 익숙한 사이','주민','주민 한 조합이 아는 사이 이상',()=>Number(hasRelationship(20)),1);
 add('relation-friend','우리 친구 할까?','주민','주민 한 조합이 친구 이상',()=>Number(hasRelationship(50)),1);
 add('relation-best','둘도 없는 친구','주민','주민 한 조합이 친한 친구',()=>Number(hasRelationship(80)),1);
 add('relation-social','마을의 사교왕','주민','주민 한 명이 서로 다른 주민 3명과 친구 이상',pairFriendCount,3);
 add('relation-all','모두 사이좋게','주민','등록된 주민 전원이 서로 친구 이상 (최소 2명)',()=>{const ps=residentPairs();return registeredResidentIndices().length>=2&&ps.length&&ps.every(isFriend)?1:0;},1);
 add('relation-10','오늘도 반가워','주민','주민 간 상호작용 누적 10회',()=>n('resident-pair-event'),10);
 add('relation-50','이야기가 끊이질 않아','주민','주민 간 상호작용 누적 50회',()=>n('resident-pair-event'),50);
 add('relation-walk','함께 걷는 길','주민','주민 두 명이 처음으로 함께 걷기',()=>n('resident-pair-walk'),1);
 add('relation-walk20','산책이 취미','주민','주민끼리 함께 걷기 누적 20회',()=>n('resident-pair-walk'),20);
 add('relation-rest','잠깐 쉬어갈까?','주민','나란히 쉬기 이벤트 첫 발생',()=>n('resident-pair-rest'),1);
 add('relation-follow','장난꾸러기','주민','장난스럽게 따라가기 이벤트 첫 발생',()=>n('resident-pair-follow'),1);
 add('relation-wait','기다리는 마음','주민','연인이 상대를 기다린 뒤 함께 걷기',()=>n('resident-pair-waitwalk'),1);
 add('relation-lovewalk','너와 함께라면','주민','연인 간 함께 걷기 누적 10회',()=>n('resident-pair-lovewalk'),10);
 add('relation-love10','변함없는 사이','주민','직접 지정한 연인 관계로 게임 내 10일 함께 보내기',()=>Math.max(0,...Object.values(relationCounts()).map(Number)),10);
 achievementDefs.push(...extraDefs);
 const achievementCategories=[
  {name:'농사',icon:'wheat'},
  {name:'생산',icon:'box'},
  {name:'요리',icon:'award_meal'},
  {name:'주민',icon:'groups_3'},
  {name:'마을',icon:'cottage'},
  {name:'고양이',icon:'pets'}
 ];
 function renderAchievements(){
  const summary=node('p','vf-note',`달성 ${achievementDefs.filter(a=>a[4](state)>=a[5]).length}/${achievementDefs.length} · 보상은 한 번만 받을 수 있습니다.`);
  root().append(summary);
  const layout=node('div','vf-achievement-layout');
  const sidebar=node('nav','vf-achievement-sidebar');sidebar.setAttribute('aria-label','업적 분류');
  const results=node('section','vf-achievement-results');results.setAttribute('aria-label',`${activeAchievementCategory} 업적`);
  for(const group of achievementCategories){
   const selected=group.name===activeAchievementCategory;
   const tab=button('',()=>{if(activeAchievementCategory===group.name)return;activeAchievementCategory=group.name;renderModal();},'vf-achievement-tab');
   tab.setAttribute('aria-label',`${group.name} 업적`);tab.title=group.name;
   tab.setAttribute('aria-current',selected?'page':'false');tab.classList.toggle('is-active',selected);
   const glyph=node('span','material-symbols-outlined',group.icon);glyph.setAttribute('aria-hidden','true');
   tab.append(glyph);sidebar.append(tab);
  }
  results.append(node('h3','vf-achievement-heading',activeAchievementCategory));
  for(const [id,title,category,description,progress,target,reward] of achievementDefs){
   if(category!==activeAchievementCategory)continue;
   const n=progress(state),done=n>=target,claimed=!!state.claimed[id],card=node('article','vf-card'),head=node('div','vf-card-head');
   head.append(node('strong','',title),node('span','vf-chip',claimed?'보상 수령 완료':done?'달성!':'진행 중'));card.append(head,node('p','',description),node('div','vf-note',`${Math.min(n,target)} / ${target} · 보상 ◈ ${reward} · 쾌적도 +${achievementComfort(title)}`));
   const bar=node('div','vf-progress'),fill=node('span');fill.style.width=`${Math.min(100,Math.max(0,n/target*100))}%`;bar.append(fill);card.append(bar);
   if(done&&!claimed)card.append(button('보상 받기',()=>{if(state.claimed[id]||progress(state)<target||!wallet()?.refund)return;state.claimed[id]=true;save();emit('achievement-complete',{id,name:title});wallet().refund(reward);const comfort=achievementComfort(title);grantComfort(comfort);renderModal();message(`${title} 업적 보상으로 쾌적도 +${comfort}를 받았습니다.`);},'vf-primary'));
   results.append(card);
  }
  layout.append(sidebar,results);root().append(layout);
 }
 function renderModal(){const content=root();if(!content)return;content.replaceChildren();message('');if(current.startsWith('gift-'))renderGift();else if(current==='achievements')renderAchievements();}
 function renderCollection(){const content=$('kitchen-collection');if(!content)return;content.replaceChildren();const all=visibleRecipes(),discovered=all.filter(r=>state.collection[r.id]);
  content.append(node('p','vf-note',`발견한 요리 ${discovered.length} / ${all.length} · 처음 요리한 날짜와 제작 기록을 확인할 수 있습니다.`));
  const grid=node('div','vf-collection-grid');content.append(grid);
  for(const r of all){const entry=state.collection[r.id],pastMastery=window.dowonKitchen?.get()?.mastery?.[r.id]||0,unlocked=(window.dowonKitchen?.get()?.level||1)>=r.level;const c=node('article','vf-collection-card');
    const img=itemImg(r.output);if(!entry&&!unlocked&&!pastMastery)img.classList.add('vf-unknown');c.append(img,node('strong','',entry||unlocked||pastMastery?r.name:'???'));
    if(entry){const mastery=window.dowonKitchen?.get()?.mastery?.[r.id]||0;c.append(node('small','',`첫 제작 ${entry.firstDay}일째`),node('small','',`총 ${entry.total}회 · 완벽 ${entry.perfect}회`),node('small','',`숙련도 ${mastery}/4`));}
    else c.append(node('small','',pastMastery?`이전 숙련도 ${pastMastery}/4 · 제작 기록 없음`:unlocked?'아직 요리하지 않음':`${r.level}레벨 해금`));
    grid.append(c);
  }
 }
 function showCollection(){const content=$('kitchen-collection'),normal=$('kitchen-content'),progress=$('kitchen-progress'),button=$('kitchen-collection-toggle');if(!content||!normal||!button)return;
  const open=content.hidden;content.hidden=!open;normal.hidden=open;if(progress)progress.hidden=open;button.textContent=open?'레시피 보기':'요리 도감';if(open)renderCollection();
 }
 function mount(){if(!$('village-features-dialog'))return;
  $('village-features-close').addEventListener('click',close);$('village-features-backdrop').addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('village-features-dialog').hidden){e.stopImmediatePropagation();close();}},true);
  $('kitchen-collection-toggle').addEventListener('click',showCollection);
  $('kitchen-close').addEventListener('click',()=>{const content=$('kitchen-collection');if(!content.hidden){content.hidden=true;$('kitchen-content').hidden=false;$('kitchen-progress').hidden=false;$('kitchen-collection-toggle').textContent='요리 도감';}});
 }
 document.addEventListener('dowon:activity',event=>{const {type,...detail}=event.detail||{};if(type){record(type,detail);onExtraEvent(type,detail);}});

 function onExtraEvent(type,d){
  if(type==='achievement-complete')return;
  if(type==='harvest'||type==='processed'){const key=type==='harvest'?'harvest':'processed',item=String(d.item||'');if(item){const k=key+':'+item;ex().byItem[k]=(Number(ex().byItem[k])||0)+Math.max(0,Number(d.count)||1);}}
  if(type==='cat-feed-purchased')ex().feedPurchased[d.key]=1;
  if(type==='plant'){const key='plant:'+d.cropType;ex().byItem[key]=(ex().byItem[key]||0)+1;try{const farms=JSON.parse(localStorage.getItem('dangcheong-dowon-village-farms')||'[]');if(farms.length&&farms.slice(0,Number(prog().farms)||1).every(f=>Array.isArray(f)&&f.length&&f.every(Boolean)))increment('fullplant');}catch(_){}}
  if(type==='shop-purchased'&&d.adoptionBonus)increment('cat-house');
  if(type==='cat-meeting'){for(const cat of d.cats||[])ex().catSocial[cat]=(Number(ex().catSocial[cat])||0)+1;if(d.action==='sit')increment('cat-sit');if(d.action==='nose')increment('cat-nose');}
  if(type==='cat-resident-meeting'){const cat=String(d.catId||''),r=String(d.resident);if(cat){const v=ex().catByResident[cat]||(ex().catByResident[cat]={});v[r]=(v[r]||0)+1;ex().catSocial[cat]=(Number(ex().catSocial[cat])||0)+1;}}
  if(type==='cook'){const r=recipes().find(x=>x.id===d.recipeId);if(r){if(/매화주/.test(r.name||''))increment('plum');if(r.residentName)increment('secret');}}
  if(type==='cat-gift'&&d.catId){ex().catGiftsByCat[d.catId]=(ex().catGiftsByCat[d.catId]||0)+1;const season=String(window.dowonSeasons?.get?.()?.season||'');if(season)ex().seasons[season]=1;}
  if(type==='gift'&&d.resident!==undefined){const feeling=state.giftTastes?.[d.resident]?.[d.item];if(feeling==='favorite'){increment('resident-favorite');(ex().favoriteByResident||(ex().favoriteByResident={}))[d.resident]=((ex().favoriteByResident||{})[d.resident]||0)+1;}}
  if(type==='order-complete'){ex().orderByResident[d.resident]=(ex().orderByResident[d.resident]||0)+1;ex().daily.order=(ex().daily.order||0)+1;if((d.items||[]).reduce((sum,it)=>sum+(Number(it.qty)||0),0)>=20)increment('largeorder');}
  if(type==='resident-request'){ex().daily.request=(ex().daily.request||0)+1;ex().flags.requestStreak=(ex().flags.requestStreak||0)+1;totals()['request-streak']=Math.max(n('request-streak'),ex().flags.requestStreak);}

  increment(type);
  save();
 }
 document.addEventListener('dowon:weatherchange',event=>{const kind=event.detail?.kind;if(kind==='snow'||kind==='rain'||kind==='drizzle'){if(!ex().flags['weather-'+kind]){ex().flags['weather-'+kind]=true;increment(kind==='snow'?'snow':'rain');save();}}});
 document.addEventListener('click',event=>{const button=event.target?.closest?.('button[id$="-start"]');if(!button)return;setTimeout(()=>{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!/^dangcheong-dowon-village-(?:mill|chopper|coop|sugar-workshop|tofu-workshop|pancake-workshop|salter|tofu-processing)/.test(key))continue;try{const slots=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(slots)&&slots.length>=6&&slots.every(Boolean)){increment('sixslots');save();break;}}catch(_){}}},0);},true);
 document.addEventListener('dowon:seasonchange',event=>{if(event.detail?.preview)return;const season=String(event.detail?.season||'');if(season){ex().seasonsSeen[season]=1;save();}});
 function refreshLoveDay(){const stats=relationCounts(),currentDay=day(),active=new Set(residentPairs().filter(p=>p.love).map(p=>[p.a,p.b].join(':')));const last=Number(relationFlags().lastLoveDay)||0;
  if(last===currentDay)return;
  if(last>0&&currentDay===last+1){for(const id of active)stats[id]=(Number(stats[id])||0)+1;}
  else{for(const id of active)stats[id]=1;}
  for(const id of Object.keys(stats))if(!active.has(id))delete stats[id];
  relationFlags().lastLoveDay=currentDay;save();
 }
 document.addEventListener('nakwon:resident-pair-change',()=>{refreshLoveDay();if(current==='achievements')renderModal();});
 document.addEventListener('dowon:timechange',refreshLoveDay);
 refreshLoveDay();
 document.addEventListener('dowon:timechange',()=>{const newDay=day();if(ex().daily.day!==newDay){ex().daily={day:newDay,quest:0,request:0,order:0};ex().seasonsSeen=ex().seasonsSeen||{};const season=String(window.dowonSeasons?.get?.()?.season||'');if(season)ex().seasonsSeen[season]=1;save();}});
 window.dowonFeatures={openPanel:(kind)=>{if(kind==='achievements')open('마을 업적',kind);},openGift:i=>{if(!residents()[i])return;open(`${residents()[i].name}에게 선물하기`,`gift-${i}`);},refresh:()=>{if(current)renderModal();},get:()=>JSON.parse(JSON.stringify(state))};
 // 사이드바 버튼은 다른 메뉴의 초기화 오류와 무관하게 독립적으로 연결합니다.
 for(const [id,title,kind] of [['menu-achievements','마을 업적','achievements']]){
   const control=$(id);
   if(control)control.addEventListener('click',()=>open(title,kind));
 }
 mount();
})();
