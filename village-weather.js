/* 계절별 강수: 봄 가랑비 / 여름·가을 비 / 겨울 눈. 날씨는 날짜별 저장, 계절 미리보기는 저장하지 않음. */
(() => {
 'use strict';
 const KEY='dangcheong-dowon-weather-v1';
 const scene=document.getElementById('main-area');
 if(!scene)return;
 const rain=document.createElement('div');rain.id='dowon-rain';rain.setAttribute('aria-hidden','true');
 const tint=document.createElement('div');tint.id='dowon-rain-tint';tint.setAttribute('aria-hidden','true');
 const snow=document.createElement('div');snow.id='dowon-snow';snow.setAttribute('aria-hidden','true');
 scene.append(tint,rain,snow);
 for(let i=0;i<65;i++){
   const drop=document.createElement('i');
   const x=(i*61.8033988749)%100;
   drop.style.setProperty('--rain-x',x.toFixed(2)+'%');
   drop.style.setProperty('--rain-delay',(-((i*.37)%2.1)).toFixed(2)+'s');
   drop.style.setProperty('--rain-duration',(1+(i%7)*.13).toFixed(2)+'s');
   drop.style.setProperty('--rain-opacity',(.24+(i%5)*.045).toFixed(2));
   rain.append(drop);
   const flake=document.createElement('i');
   flake.style.setProperty('--snow-x',x.toFixed(2)+'%');
   flake.style.setProperty('--snow-size',(2+(i%4)*1.4).toFixed(1)+'px');
   flake.style.setProperty('--snow-delay',(-((i*.73)%11)).toFixed(2)+'s');
   flake.style.setProperty('--snow-duration',(5+(i%9)*.83).toFixed(2)+'s');
   flake.style.setProperty('--snow-drift',(-24+(i%7)*8)+'px');
   snow.append(flake);
 }
 let state=null;
 try{state=JSON.parse(localStorage.getItem(KEY)||'null');}catch(_){}
 let latestDay=null,latestMinute=null,lastRainLineAt=Date.now();
 const season=()=>window.dowonSeasons?.get()?.season||'summer';
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}}
 function paint(){
   const wet=state?.weather==='rain',s=season();
   const kind=wet?(s==='winter'?'snow':s==='spring'?'drizzle':'rain'):'clear';
   scene.classList.toggle('dowon-is-raining',wet&&kind!=='snow');
   scene.classList.toggle('dowon-is-drizzling',kind==='drizzle');
   scene.classList.toggle('dowon-is-snowing',kind==='snow');
   if(!rain.isConnected||!tint.isConnected||!snow.isConnected)scene.append(tint,rain,snow);
   document.dispatchEvent(new CustomEvent('dowon:weatherchange',{detail:{weather:wet?'rain':'clear',kind,day:state?.day,manual:Boolean(state?.manual)}}));
 }
 function selectDay(day){
   if(!Number.isSafeInteger(day)||day<1)return;
   if(!state||state.day!==day||!['rain','clear'].includes(state.weather)){
     state={day,weather:Math.random()<.30?'rain':'clear',manual:false};
     save();lastRainLineAt=Date.now();
   }
   paint();
 }
 document.addEventListener('dowon:timechange',event=>{
   const day=Number(event.detail?.day),minute=Number(event.detail?.minute);
   if(!Number.isSafeInteger(day)||!Number.isFinite(minute))return;
   latestDay=day;latestMinute=minute;
   if(!state||state.day!==day)selectDay(day);
   else{
     const wet=state.weather==='rain',s=season();
     if(scene.classList.contains('dowon-is-snowing')!==(wet&&s==='winter') ||
        scene.classList.contains('dowon-is-raining')!==(wet&&s!=='winter') ||
        scene.classList.contains('dowon-is-drizzling')!==(wet&&s==='spring') ||
        !rain.isConnected||!tint.isConnected||!snow.isConnected)paint();
   }
 });
 document.addEventListener('dowon:seasonchange',()=>{if(state)paint();});
 function setManual(weather){
   if(!['rain','clear'].includes(weather))return false;
   if(!Number.isSafeInteger(latestDay)){
     const saved=window.dowonClock?.get?.();if(Number.isSafeInteger(saved?.day))latestDay=saved.day;
   }
   if(!Number.isSafeInteger(latestDay))return false;
   state={day:latestDay,weather,manual:true};save();lastRainLineAt=Date.now();paint();return true;
 }
 window.dowonWeather={get:()=>state?{...state,kind:state.weather==='rain'?(season()==='winter'?'snow':season()==='spring'?'drizzle':'rain'):'clear'}:null,set:setManual};
 function scheduleRainLine(){
   if(state?.weather!=='rain'||season()==='winter'||latestMinute==null||latestMinute>=1440){lastRainLineAt=Date.now();return;}
   if(Date.now()-lastRainLineAt<60000)return;
   lastRainLineAt=Date.now()+Math.floor(Math.random()*40000);
   if(typeof window.dowonShowRainDialogue==='function')window.dowonShowRainDialogue();
 }
 window.setInterval(scheduleRainLine,3000);
 const menu=document.querySelector('#debug-dialog .debug-actions');
 if(menu){
   const title=document.createElement('div');title.className='debug-weather-label';title.textContent='날씨 (오늘만 수동 변경 · 겨울에는 눈)';
   const buttons=document.createElement('div');buttons.className='debug-weather-buttons';
   for(const [weather,label] of [['clear','☀ 맑음'],['rain','☂ 비 / ❄ 눈']]){
     const button=document.createElement('button');button.type='button';button.textContent=label;
     button.addEventListener('click',()=>{if(setManual(weather))document.getElementById('debug-close')?.click();});
     buttons.append(button);
   }
   menu.append(title,buttons);
 }
})();
