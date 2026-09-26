/* 도화마을 영구 해금 시스템: 재화 결제, 진행 시간, 저장, 해금 상태는 이 파일에서 관리합니다. */
(() => {
 'use strict';
 const KEY='dangcheong-dowon-progression-v1';
 const SETTINGS={
   residentPrices:[0,0,500,2000,5000],
   // 밭 개방은 기존 동전 결제 방식, 업그레이드는 쾌적도 + 밭마다 동전 10,000.
   farmPrices:[0,500,1500,3000],
   farmUpgradeComfort:[100,1000,3000,5000],
   farmUpgradeCoins:10000,
   // 주문판은 동전 없이 쾌적도로만 자동 해금되며 한번 해금하면 유지됩니다.
   orderComfort:[0,50,100,150,200],
   workshops:{
     tofu:{id:'tofu-workshop',name:'콩공방',comfort:100,coins:100,duration:5*60*1000},
     chopper:{id:'chopper-workshop',name:'작두',comfort:200,coins:500,duration:10*60*1000},
     coop:{id:'coop-workshop',name:'닭장',comfort:500,coins:800,duration:13*60*1000},
     sugar:{id:'sugar-workshop',name:'설탕공방',comfort:1000,coins:1000,duration:15*60*1000},
     pancake:{id:'pancake-workshop',name:'전병방',comfort:2000,coins:2000,duration:20*60*1000},
     salter:{id:'salter-workshop',name:'절임통',comfort:4000,coins:4000,duration:25*60*1000},
     'tofu-processing':{id:'tofu-processing-workshop',name:'두부가공 시설',comfort:6000,coins:8000,duration:30*60*1000},
     sheep:{id:'sheep-workshop',name:'양우리',comfort:600,coins:1000,duration:15*60*1000},
     ricecake:{id:'ricecake-workshop',name:'떡방',comfort:1200,coins:2500,duration:20*60*1000},
     dryer:{id:'dryer-workshop',name:'건조장',comfort:700,coins:1200,duration:15*60*1000},
     roastery:{id:'roastery-workshop',name:'구이방',comfort:900,coins:1500,duration:18*60*1000},
     textile:{id:'textile-workshop',name:'옷공방',comfort:1500,coins:3500,duration:25*60*1000},
     embroidery:{id:'embroidery-workshop',name:'자수방',comfort:2500,coins:6000,duration:30*60*1000}
   }
 };
 let state={residents:2,farms:1,orders:1,peakComfort:0,workshops:{},upgradedFarms:[false,false,false,false]};
 try{
   const raw=JSON.parse(localStorage.getItem(KEY)||'null');
   if(raw&&typeof raw==='object'){
     state.residents=Math.max(2,Math.min(5,Number(raw.residents)||2));
     // 쾌적도 자동 해금 버전에서 0으로 저장된 경우에도 기본 밭은 무료 개방합니다.
     state.farms=Math.max(1,Math.min(4,Number.isInteger(Number(raw.farms))?Number(raw.farms):1));
     state.orders=Math.max(1,Math.min(5,Number(raw.orders)||1));
     state.peakComfort=Math.max(0,Number(raw.peakComfort)||0);
     state.workshops=raw.workshops&&typeof raw.workshops==='object'?raw.workshops:{};
     if(Array.isArray(raw.upgradedFarms))state.upgradedFarms=state.upgradedFarms.map((_,i)=>raw.upgradedFarms[i]===true);
   }
 }catch(error){console.warn('해금 정보 불러오기 실패',error);}
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch(error){console.warn('해금 정보 저장 실패',error);return false;}};
 const comfort=()=>Math.max(0,Number(localStorage.getItem('dangcheong-dowon-village-comfort-v1'))||0);
 const wallet=()=>window.dowonWallet;
 const pay=(cost)=>{
   if(!wallet() || wallet().getBalance()<cost){alert(`동전이 부족합니다. 필요: ◈ ${cost.toLocaleString('ko-KR')}`);return false;}
   return wallet().spend(cost);
 };
 const isResidentUnlocked=i=>i<state.residents;
 const isFarmUnlocked=i=>i<state.farms;
 const isFarmUpgraded=i=>Number.isInteger(i)&&i>=0&&i<4&&state.upgradedFarms[i]===true;
 const isOrderUnlocked=i=>i<state.orders;
 const orderThreshold=i=>SETTINGS.orderComfort[i]??Infinity;
 const refreshComfort=()=>{
   let changed=false;
   if(comfort()>state.peakComfort){state.peakComfort=comfort();changed=true;}
   while(state.orders<5&&state.peakComfort>=orderThreshold(state.orders)){state.orders++;changed=true;}
   // 밭 개방은 동전 결제로만 진행하며, 이미 개방한 밭 기록은 보존합니다.
   if(changed)save();
 };
 const residentCost=i=>SETTINGS.residentPrices[i]??0;
 function buyResident(i,onDone){
   if(i!==state.residents)return;
   const cost=residentCost(i);
   if(!confirm(`${i+1}번째 주민을 초대할까요?\n비용: ◈ ${cost.toLocaleString('ko-KR')}`))return;
   if(!pay(cost))return;
   state.residents++;save();if(onDone)onDone();
 }
 function buyFarm(i){
   if(i!==state.farms)return false;
   const cost=SETTINGS.farmPrices[i];
   if(!confirm(`${i+1}번째 밭(3×3)을 개방할까요?\n비용: ◈ ${cost.toLocaleString('ko-KR')}`))return false;
   if(!pay(cost))return false;
   state.farms++;
   if(!save()){
     state.farms--;
     wallet()?.refund?.(cost);
     alert('밭 해금 기록을 저장하지 못해 결제를 취소했습니다.');
     renderFarms();
     return false;
   }
   renderFarms();
   return true;
 }
 // 1→2→3→4번 밭 순서로만 업그레이드할 수 있습니다.
 // 각 단계는 쾌적도 이력 100/1,000/3,000/5,000과 동전 10,000을 요구합니다.
 function nextFarmUpgrade(){return state.upgradedFarms.findIndex(done=>!done);}
 function buyFarmUpgrade(i){
   refreshComfort();
   if(i!==nextFarmUpgrade()||!isFarmUnlocked(i)||state.peakComfort<SETTINGS.farmUpgradeComfort[i])return false;
   const cost=SETTINGS.farmUpgradeCoins;
   if(!confirm(`${i+1}번 밭을 업그레이드할까요?\n수확량: 칸당 1개 → 2개\n비용: ◈ ${cost.toLocaleString('ko-KR')}`))return false;
   if(!pay(cost))return false;
   state.upgradedFarms[i]=true;
   if(!save()){
     state.upgradedFarms[i]=false;
     wallet()?.refund?.(cost);
     alert('업그레이드 기록을 저장하지 못해 결제를 취소했습니다.');
     renderFarms();
     return false;
   }
   renderFarms();
   return true;
 }
 function renderFarms(){
   const farmArea=document.getElementById('farm-area');
   const heading=farmArea?.querySelector('.farm-section-label');
   let upgradeButton=heading?.querySelector('#farm-upgrade-button');
   if(heading&&!upgradeButton){
     upgradeButton=document.createElement('button');
     upgradeButton.type='button';
     upgradeButton.id='farm-upgrade-button';
     upgradeButton.className='farm-upgrade-button';
     heading.append(upgradeButton);
   }
   const next=nextFarmUpgrade();
   if(upgradeButton){
     const available=next!==-1&&state.peakComfort>=SETTINGS.farmUpgradeComfort[next];
     upgradeButton.hidden=!available;
     if(available){
       upgradeButton.textContent=`${next+1}번 밭 업그레이드 · ◈ ${SETTINGS.farmUpgradeCoins.toLocaleString('ko-KR')}`;
       upgradeButton.disabled=!isFarmUnlocked(next);
       upgradeButton.title=isFarmUnlocked(next)
         ? `${next+1}번 밭 수확량 2배 · 동전 ${SETTINGS.farmUpgradeCoins.toLocaleString('ko-KR')}`
         : `${next+1}번 밭을 먼저 개방해 주세요`;
       upgradeButton.onclick=()=>buyFarmUpgrade(next);
     }
   }
   document.querySelectorAll('#farm-area .farm').forEach((farm,i)=>{
     const locked=!isFarmUnlocked(i);
     const upgraded=isFarmUpgraded(i);
     farm.classList.toggle('farm-progression-locked',locked);
     farm.classList.toggle('farm-upgraded',upgraded);
     farm.dataset.lockLabel=locked?(i===state.farms?`🔒 ${SETTINGS.farmPrices[i].toLocaleString('ko-KR')} 동전`:'🔒 이전 밭 해금 필요'):'';
     farm.setAttribute('aria-label',locked?`${i+1}번째 밭 잠김 · ${farm.dataset.lockLabel}`:`${i+1}번째 밭 · 수확량 ${upgraded?2:1}개`);
     if(!farm.dataset.progressionBound){
       farm.dataset.progressionBound='true';
       for(const eventName of ['pointerdown','mousedown','touchstart','dragstart','dragenter','dragover','drop','click']){
         farm.addEventListener(eventName,event=>{
           if(isFarmUnlocked(i))return;
           event.preventDefault();event.stopImmediatePropagation();
           if(eventName==='click')buyFarm(i);
         },true);
       }
     }
   });
 }
 const isBuilt=key=>key==='mill'||Number(state.workshops[key])===-1;
 const hasComfort=threshold=>{refreshComfort();return state.peakComfort>=threshold;};
 function renderWorkshops(){
   for(const [key,def] of Object.entries(SETTINGS.workshops)){
     const card=document.getElementById(def.id);if(!card)continue;
     let panel=card.querySelector('.progression-workshop-gate');
     if(isBuilt(key)){
       panel?.remove();card.classList.remove('progression-building');
       continue;
     }
     if(!panel){panel=document.createElement('div');panel.className='progression-workshop-gate';card.append(panel);}
     card.classList.add('progression-building');
     const until=Number(state.workshops[key])||0;
     const ready=until>0&&Date.now()>=until;
     if(ready){state.workshops[key]=-1;save();document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'facility-unlocked',key,name:def.name}}));panel.remove();card.classList.remove('progression-building');
       window.dispatchEvent(new Event('dowon-comfort-change'));continue;
     }
     panel.replaceChildren();
     const title=document.createElement('strong');title.textContent=until?'⚒ 건설 중':`🔒 ${def.name}`;
     const desc=document.createElement('span');
     if(until){
       const remaining=Math.max(0,Math.ceil((until-Date.now())/1000));
       desc.textContent=`남은 시간 ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;
       panel.append(title,desc);continue;
     }
     desc.textContent=`쾌적도 ${def.comfort} · ◈ ${def.coins.toLocaleString('ko-KR')} · ${def.duration/60000}분`;
     const button=document.createElement('button');button.type='button';button.textContent='건설 시작';
     button.disabled=!hasComfort(def.comfort);
     button.title=button.disabled?`쾌적도 ${def.comfort} 필요`:'동전을 지불하고 건설합니다';
     button.addEventListener('click',()=>{
       if(isBuilt(key)||state.workshops[key]||!hasComfort(def.comfort))return;
       if(!confirm(`${def.name} 건설을 시작할까요?\n◈ ${def.coins.toLocaleString('ko-KR')} · ${def.duration/60000}분`))return;
       if(!pay(def.coins))return;
       state.workshops[key]=Date.now()+def.duration;save();renderWorkshops();
     });
     panel.append(title,desc,button);
   }
 }
 // 건설 시작(재화 결제)이 끝난 시설만 완료 처리합니다. 아직 시작하지 않은 시설은 건드리지 않습니다.
 function finishAllConstruction(){
   const building=Object.keys(SETTINGS.workshops).filter(key=>{
     const until=Number(state.workshops[key]);
     return Number.isFinite(until)&&until>0;
   });
   if(!building.length)return 0;
   const previous={...state.workshops};
   for(const key of building)state.workshops[key]=-1;
   if(!save()){
     state.workshops=previous;
     return 0;
   }
   renderWorkshops();
   window.dispatchEvent(new Event('dowon-comfort-change'));
   return building.length;
 }
 // 디버그 전용: 모든 등록된 가공소를 결제·대기시간 없이 영구 해금합니다.
 // 맷돌은 기본 개방 시설이므로 기존 상태를 유지합니다.
 function debugUnlockAllWorkshops(){
   const previous={...state.workshops};
   const locked=Object.keys(SETTINGS.workshops).filter(key=>!isBuilt(key));
   if(!locked.length)return 0;
   for(const key of locked)state.workshops[key]=-1;
   if(!save()){
     state.workshops=previous;
     renderWorkshops();
     return -1;
   }
   renderWorkshops();
   window.dispatchEvent(new Event('dowon-comfort-change'));
   return locked.length;
 }
 // 디버그 전용: 기본 개방 시설은 유지하고, 잠금·건설 대상 시설만 초기 잠금으로 되돌립니다.
 // 이미 진행 중인 생산 슬롯과 창고 재고는 수정하지 않습니다.
 function debugLockAllWorkshops(){
   const previous={...state.workshops};
   const targets=Object.keys(SETTINGS.workshops);
   const affected=targets.filter(key=>Number(state.workshops[key])!==0);
   if(!affected.length)return 0;
   for(const key of targets)delete state.workshops[key];
   if(!save()){
     state.workshops=previous;
     renderWorkshops();
     return -1;
   }
   renderWorkshops();
   window.dispatchEvent(new Event('dowon-comfort-change'));
   return affected.length;
 }
 // ON 이전 가공소 상태를 복원할 때 사용하며 기존 제작 슬롯은 보존합니다.
 function debugRestoreWorkshops(snapshot){
   if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))return false;
   const previous={...state.workshops};
   state.workshops={...snapshot};
   if(!save()){state.workshops=previous;return false;}
   renderWorkshops();window.dispatchEvent(new Event('dowon-comfort-change'));return true;
 }
 const debugAllWorkshopsUnlocked=()=>Object.keys(SETTINGS.workshops).every(key=>isBuilt(key));
 const api={finishAllConstruction,debugUnlockAllWorkshops,debugLockAllWorkshops,debugRestoreWorkshops,debugAllWorkshopsUnlocked,settings:SETTINGS,isResidentUnlocked,isFarmUnlocked,isFarmUpgraded,isOrderUnlocked,orderThreshold,refreshComfort,residentCost,buyResident,buyFarm,isBuilt,hasComfort,renderFarms,renderWorkshops,renderAll(){refreshComfort();renderFarms();renderWorkshops();}};
 window.dowonProgression=api;
 refreshComfort();renderFarms();renderWorkshops();
 window.addEventListener('dowon-comfort-change',()=>{refreshComfort();renderFarms();renderWorkshops();});
 document.addEventListener('dowon:walletchange',()=>renderWorkshops());
 // 건설은 실제 시간(Date.now)을 기준으로 진행되며, 재접속 후에도 남은 시간이 유지됩니다.
 setInterval(renderWorkshops,1000);
})();
