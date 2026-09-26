/* 마을 시계: 1 현실 초 = 1 게임 분. 자러가기 전까지 24:00에서 정지. */
(() => {
 'use strict';
 const LEGACY_KEY='dangcheong-dowon-village-clock-v1';
 const KEY='dangcheong-dowon-village-clock-v2';
 const IMPORT_CLOCK_KEY='__dangcheong_dowon_clock_import_pending__';
 const COMFORT_KEY='dangcheong-dowon-village-comfort-v1';
 const PAUSE_KEY='dangcheong-dowon-village-clock-paused-v1';
 let paused=localStorage.getItem(PAUSE_KEY)==='true';
 const dayEl=document.getElementById('village-day');
 const clockEl=document.getElementById('village-clock');
 const periodEl=document.getElementById('village-period');
 const iconEl=document.getElementById('village-time-icon');
 const comfortEl=document.getElementById('village-comfort');
 const sleepButton=document.getElementById('village-sleep');
 const transition=document.getElementById('sleep-transition');
 const scene=document.getElementById('main-area');
 if(!dayEl||!clockEl||!comfortEl||!sleepButton||!transition||!scene)return;
 const START=360,END=1440;
 const now=Date.now();
 let data;
 try{data=JSON.parse(localStorage.getItem(KEY)||'null');}catch(_){data=null;}
 // 데이터를 다른 기기에서 가져온 직후 첫 로드에서는 현실 경과 시간을 적용하지 않습니다.
 // 가져오기 전에 실행 중이던 기존 시계가 마지막 순간 기록을 덮더라도 이 값을 우선합니다.
 let importedClock=null;
 try{
   const raw=sessionStorage.getItem(IMPORT_CLOCK_KEY);
   if(raw){
     const candidate=JSON.parse(raw);
     if(candidate&&Number.isSafeInteger(candidate.day)&&candidate.day>=1&&
        Number.isSafeInteger(candidate.minute)&&candidate.minute>=START&&candidate.minute<=END){
       importedClock={day:candidate.day,minute:candidate.minute,savedAt:now};
     }
     sessionStorage.removeItem(IMPORT_CLOCK_KEY); // 가져오기 시 1회만 적용
   }
 }catch(error){console.warn('가져온 게임 시계 복원 기록 확인 실패',error);}
 if(importedClock){
   data=importedClock;
 }else{
   if(!data||!Number.isSafeInteger(data.day)||data.day<1||!Number.isFinite(data.minute)||!Number.isFinite(data.savedAt)){
     const legacy=Number(localStorage.getItem(LEGACY_KEY));
     const elapsed=Number.isFinite(legacy)&&legacy>0&&legacy<=now?Math.max(0,Math.floor((now-legacy)/1000)):0;
     const total=START+elapsed;
     // 이전 버전에서 이미 지난 일수는 유지하고, 현재 게임 날짜는 24:00에서 정지시킵니다.
     data={day:Math.floor((total-START)/1440)+1,minute:Math.min(END,START+((total-START)%1440)),savedAt:now};
   }
   data.day=Math.max(1,Math.floor(data.day));
   data.minute=Math.max(START,Math.min(END,Math.floor(data.minute)));
   // 일반적인 재실행에서는 원래 게임 규칙대로 지난 현실 시간을 적용합니다.
   if(!paused)data.minute=Math.min(END,data.minute+Math.max(0,Math.floor((now-data.savedAt)/1000)));
   data.savedAt=now;
 }
 let busy=false;
 function persist(){
   if(window.dowonFullResetInProgress||window.dowonSaveImportInProgress)return;
   try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){console.warn('마을 시간 저장 실패',e);}
 }
 function advance(){
   if(paused)return;
   const current=Date.now();
   const elapsed=Math.max(0,Math.floor((current-data.savedAt)/1000));
   if(elapsed>0){data.minute=Math.min(END,data.minute+elapsed);data.savedAt+=elapsed*1000;persist();}
 }
 const savedComfort=Number(localStorage.getItem(COMFORT_KEY));
 comfortEl.textContent=(Number.isFinite(savedComfort)&&savedComfort>=0?Math.floor(savedComfort):0).toLocaleString('ko-KR');
 window.dowonComfort={
   get:()=>Number(localStorage.getItem(COMFORT_KEY)||0)||0,
   set(value){if(!Number.isFinite(value)||value<0)return;const next=Math.floor(value);localStorage.setItem(COMFORT_KEY,String(next));comfortEl.textContent=next.toLocaleString('ko-KR');window.dispatchEvent(new Event('dowon-comfort-change'));}
 };
 // 업로드한 bg 폴더의 실제 한글 파일명과 계절·시간·날씨를 1:1 매칭합니다.
 const BACKGROUNDS={
   summer:{clear:['여름맑은아침.jpg','여름맑은밤.png'],rain:['여름비아침.png','여름비밤.png']},
   spring:{clear:['봄맑은아침.png','봄맑은밤.png'],rain:['봄비아침.png','봄비밤.png']},
   autumn:{clear:['가을맑은아침.png','가을맑은밤.png'],rain:['가을비아침.png','가을비밤.png']},
   // 겨울 밤 / 눈 배경은 추후 해당 파일 추가 시 자동 전환합니다.
   winter:{clear:['겨울맑은아침.png','겨울맑은밤.png'],rain:['겨울눈아침.png','겨울눈밤.png']}
 };
 // 없는 겨울 이미지는 겨울 아침 파일로 대체; 파일을 넣으면 별도 코드 수정 필요 없음.
 const FALLBACK='겨울맑은아침.png';
 let lastSceneFile='',imageRequest=0,crossfadeCleanupTimer=0;
 function background(file,darkness){
   const nightOverlay=window.dowonSeasons?.get()?.season==='winter' && data.minute>=1080 ? .46 : 0;
   const shade=Math.min(.75,darkness+nightOverlay);
   scene.style.backgroundImage=`linear-gradient(rgba(4,8,17,${shade.toFixed(3)}),rgba(4,8,17,${shade.toFixed(3)})),linear-gradient(180deg,rgba(5,8,13,.34),rgba(6,10,14,.18) 45%,rgba(5,8,12,.56)),url("bg/${file}")`;
 }
 // 낮/밤(또는 날씨/계절) 배경 파일이 바뀔 때 기존 화면을 위에 잠시 남겨
 // 새 배경으로 서서히 녹아들게 합니다. 첫 로드에서는 불필요한 페이드를 하지 않습니다.
 function crossfadeBackground(file,darkness){
   const previous=scene.style.backgroundImage;
   if(!previous){background(file,darkness);return;}
   if(crossfadeCleanupTimer)window.clearTimeout(crossfadeCleanupTimer);
   scene.style.setProperty('--scene-crossfade-image',previous);
   scene.style.setProperty('--scene-crossfade-opacity','1');
   background(file,darkness);
   // 1프레임 안에서 1→0으로 바뀌면 브라우저가 전환을 생략할 수 있어 두 프레임 뒤 시작합니다.
   window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{
     scene.style.setProperty('--scene-crossfade-opacity','0');
   }));
   crossfadeCleanupTimer=window.setTimeout(()=>{
     scene.style.setProperty('--scene-crossfade-image','none');
   },5200);
 }
 function updateSceneBackground(){
   const minute=data.minute,night=minute>=18*60;
   const season=window.dowonSeasons?.get()?.season||'summer';
   const weather=window.dowonWeather?.get()?.weather==='rain'?'rain':'clear';
   const file=(BACKGROUNDS[season]||BACKGROUNDS.summer)[weather][night?1:0];
   const darkness=minute<900?0:minute<1080?(minute-900)/180*.42:0;
   if(lastSceneFile!==file){
     lastSceneFile=file;
     const request=++imageRequest;
     const probe=new Image();
     probe.onload=()=>{if(request===imageRequest)crossfadeBackground(file,darkness);};
     probe.onerror=()=>{if(request===imageRequest)crossfadeBackground(season==='winter'?FALLBACK:BACKGROUNDS.summer[weather][night?1:0],darkness);};
     probe.src=`bg/${file}`;
   }else if(scene.style.backgroundImage){
     // 갱신된 밝기와 밤 여부를 이미지 로딩 대기 없이 반영합니다.
     const winterMissing=season==='winter'&&!scene.style.backgroundImage.includes(`bg/${file}`);
     background(winterMissing?FALLBACK:file,darkness);
   }
 }
 document.addEventListener('dowon:weatherchange',updateSceneBackground);
 document.addEventListener('dowon:seasonchange',updateSceneBackground);
 function render(){
   const minute=data.minute,hour=Math.floor(minute/60),mins=minute%60;
   dayEl.textContent=`${data.day}일째`;
   clockEl.textContent=`${String(hour).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;
   const night=hour>=18;
   iconEl.textContent=night?'☾':'☀';
   periodEl.textContent=hour>=24?'자정':night?'밤':hour<11?'아침':hour<15?'낮':'저녁';
   const canSleep=minute>=22*60;
   sleepButton.hidden=!canSleep;
   sleepButton.disabled=busy||!canSleep;
   sleepButton.title=canSleep?'다음 날 아침 06:00으로 이동':'22:00 이후 잠자리에 들 수 있습니다';
   // 날짜가 바뀌면 날씨 시스템이 오늘의 날씨를 먼저 결정합니다.
   document.dispatchEvent(new CustomEvent("dowon:timechange",{detail:{day:data.day,minute,night}}));
   updateSceneBackground();
 }
 function tick(){if(busy||paused||window.dowonFullResetInProgress||window.dowonSaveImportInProgress)return;advance();render();}
 function sleep(){
   advance();if(busy||data.minute<1320){render();return;}
   document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'sleep'}}));
   busy=true;sleepButton.disabled=true;
   transition.classList.remove('sleep-fade-out');transition.classList.add('sleep-fade-in');
   // 화면이 완전히 어두워진 다음에만 다음 날과 배경을 전환합니다.
   window.setTimeout(()=>{
     data.day+=1;data.minute=START;data.savedAt=Date.now();persist();render();
     window.setTimeout(()=>{
       transition.classList.remove('sleep-fade-in');transition.classList.add('sleep-fade-out');
       window.setTimeout(()=>{transition.classList.remove('sleep-fade-out');busy=false;render();},1500);
     },280);
   },1100);
 }
 sleepButton.addEventListener('click',sleep);
 // 기존 디버그 팝업의 낮/밤 버튼과 연결. 날짜는 넘기지 않으며 현재 날의 해당 시각으로 이동.
 window.dowonClock={
  jumpTo(hour, minute=0){if(!Number.isInteger(hour)||hour<6||hour>23||!Number.isInteger(minute)||minute<0||minute>59||busy)return;data.minute=hour*60+minute;data.savedAt=Date.now();persist();render();},
  resetDay(){if(busy)return false;data.day=1;data.minute=START;data.savedAt=Date.now();persist();render();return true;},
  // 완전 초기화 시 실행 중이던 시계의 이전 날짜를 메모리에서도 없앱니다.
  prepareFullReset(){data.day=1;data.minute=START;data.savedAt=Date.now();busy=false;paused=false;},
  isPaused:()=>paused,
  setPaused(next){
    if(busy||window.dowonFullResetInProgress||window.dowonSaveImportInProgress)return false;
    const desired=Boolean(next);
    if(paused===desired)return true;
    if(!paused)advance();
    paused=desired;data.savedAt=Date.now();
    try{localStorage.setItem(PAUSE_KEY,String(paused));}catch(error){console.warn('시간 정지 설정 저장 실패',error);}
    persist();render();
    document.dispatchEvent(new CustomEvent('dowon:clockpausechange',{detail:{paused}}));
    return true;
  },
  // 내보내기 버튼을 누른 순간의 실제 게임 시각을 저장합니다.
  snapshotForTransfer(){
    if(!window.dowonFullResetInProgress&&!window.dowonSaveImportInProgress)advance();
    return {day:data.day,minute:data.minute,savedAt:Date.now()};
  },
  get:()=>({day:data.day,minute:data.minute,paused})
 };
 const eveningButton=document.getElementById('debug-evening');
 if(eveningButton) eveningButton.addEventListener('click',()=>{window.dowonClock.jumpTo(17,50);document.getElementById('debug-close')?.click();});
 persist();render();window.setInterval(tick,1000);
})();
