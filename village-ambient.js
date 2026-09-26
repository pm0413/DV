/* 별도의 환경음: 비 > 맑은 날 밤 > 맑은 날 아침. YouTube IFrame API 이용. */
(() => {
  'use strict';
  const button=document.getElementById('ambient-toggle');
  const mount=document.getElementById('youtube-ambient-player');
  if(!button||!mount)return;
  const VIDEOS={rain:'c2-DrsZAgQM', night:'ESNOSMHiiwg',day:'IONC0qF4NCw',springClear:'1UfN0papjng',autumnClear:'WPlZUsbWqBc',winterClear:'Gp4Vcx0JeMA',winterSnow:'GjoNZbucaLA'};
  const VOLUME=10;
  const PREF='dowon-audio-ambient-enabled-v1';
  const POSITION='dowon-audio-ambient-position-v1';
  const saved=key=>{try{return localStorage.getItem(key);}catch(_){return null;}};
  const save=(key,value)=>{try{localStorage.setItem(key,String(value));}catch(_){}};
  let enabled=saved(PREF)==='true', player=null, ready=false, current='', awaitingGesture=false;
  let desiredPosition=null;
  try{const previous=JSON.parse(saved(POSITION)||'null');
    if(previous&&VIDEOS[previous.track]&&Number.isFinite(previous.second)&&previous.second>=0)desiredPosition=previous;
  }catch(_){}
  function selection(){
    const season=window.dowonSeasons?.get?.()?.season||'summer';
    const weather=window.dowonWeather?.get?.();
    const wet=weather?.weather==='rain'||document.getElementById('main-area')?.classList.contains('dowon-is-raining')||document.getElementById('main-area')?.classList.contains('dowon-is-snowing');
    if(season==='winter')return wet?'winterSnow':'winterClear';
    if(wet)return 'rain'; // 봄 가랑비·가을 비는 기존 여름 빗소리 이용
    if(season==='spring')return 'springClear';
    if(season==='autumn')return 'autumnClear';
    const clock=window.dowonClock?.get?.();
    const minute=Number.isFinite(clock?.minute)?clock.minute:Number((document.getElementById('village-clock')?.textContent||'06:00').split(':')[0])*60;
    return minute>=18*60 || minute<6*60?'night':'day';
  }
  function setButton(){
    const label=enabled?'환경음 끄기':'환경음 켜기';
    button.setAttribute('aria-pressed',String(enabled));
    button.setAttribute('aria-label',label);
    button.title=label;
    const span=button.querySelector('.ambient-button-label');if(span)span.textContent='환경음';
    const glyph=button.querySelector('.ambient-button-icon');if(glyph)glyph.textContent=enabled?'volume_up':'volume_off';
  }
  function refresh(force=false){
    if(!enabled||!ready||!player)return;
    const next=selection();
    if(!force&&current===next)return;
    current=next;
    try{
      const resume=desiredPosition?.track===next?desiredPosition.second:0;
      desiredPosition=null;
      player.loadVideoById({videoId:VIDEOS[next],startSeconds:resume});
      player.setVolume(VOLUME);player.playVideo();awaitingGesture=true;
    }
    catch(error){console.warn('환경음 전환 실패:',error);}
  }
  function makePlayer(){
    if(!enabled||player||!window.YT?.Player)return;
    ready=false;mount.replaceChildren();
    player=new window.YT.Player('youtube-ambient-player',{
      width:'200',height:'200',playerVars:{playsinline:1,controls:0,loop:1,disablekb:1,rel:0},
      events:{
        onReady(event){ready=true;event.target.setVolume(VOLUME);refresh(true);},
        onStateChange(event){if(event.data===window.YT.PlayerState.PLAYING)awaitingGesture=false;if(enabled&&event.data===window.YT.PlayerState.ENDED){try{player.seekTo(0,true);player.playVideo();}catch(_){}}},
        onAutoplayBlocked(){awaitingGesture=true;},
        onError(event){console.warn('유튜브 환경음 재생 제한 또는 오류:',event.data);}
      }
    });
  }
  function loadApi(){
    window.dowonLoadYouTubeApi().then(()=>{
      if(enabled)makePlayer();
    }).catch(error=>console.warn('환경음 API 로딩 실패:',error));
  }
  button.addEventListener('click',()=>{
    enabled=!enabled;save(PREF,enabled);setButton();
    if(enabled){if(player&&ready){refresh();player.playVideo();awaitingGesture=true;}else loadApi();}
    else if(player&&ready){player.pauseVideo();awaitingGesture=false;}
  });
  document.addEventListener('dowon:weatherchange',()=>refresh());
  document.addEventListener('dowon:seasonchange',()=>refresh());
  document.addEventListener('dowon:timechange',()=>refresh());
  window.setInterval(()=>{
    refresh();
    if(enabled&&ready&&player&&current){
      try{const second=player.getCurrentTime();
        if(Number.isFinite(second)&&second>=0)save(POSITION,JSON.stringify({track:current,second}));
      }catch(_){}
    }
  },1500);
  window.addEventListener('pagehide',()=>{
    if (window.dowonFullResetInProgress) return;
    if(!enabled||!ready||!player||!current)return;
    try{const second=player.getCurrentTime();
      if(Number.isFinite(second)&&second>=0)save(POSITION,JSON.stringify({track:current,second}));
    }catch(_){}
  });
  function resumeOnGesture(){
    if(!enabled||!ready||!player||!awaitingGesture)return;
    try{player.playVideo();}catch(_){}
  }
  document.addEventListener('pointerdown',resumeOnGesture,{passive:true});
  document.addEventListener('keydown',resumeOnGesture);
  setButton();
  if(enabled)loadApi();
})();
