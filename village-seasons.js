/* 도화마을: 게임 날짜로 계산하는 계절 + 저장하지 않는 디버그 미리보기 */
(() => {
  'use strict';
  const cycle=['summer','autumn','winter','spring'];
  const labels={summer:'여름',autumn:'가을',winter:'겨울',spring:'봄'};
  const icons={summer:'☀',autumn:'🍁',winter:'❄',spring:'🌸'};
  const seasonForDay=day=>cycle[Math.floor((Math.max(1,day)-1)/7)%cycle.length];
  let day=null, override=null, current=null, toastTimer=null;
  const label=document.getElementById('village-season');
  const toast=document.createElement('div');
  toast.id='dowon-season-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.setAttribute('aria-atomic','true');
  toast.hidden=true;
  // 밭 위에 고정해 계절 알림이 상태 패널이나 화면 조작을 가리지 않도록 합니다.
  (document.getElementById('farm-area')||document.getElementById('main-area')||document.body).append(toast);
  function effective(){return override||seasonForDay(day||1);}
  function announce(season){
    window.clearTimeout(toastTimer);
    toast.textContent=`${icons[season]} ${labels[season]}이 찾아왔습니다`;
    toast.hidden=false;
    toastTimer=window.setTimeout(()=>{toast.hidden=true;},3500);
  }
  function update(showToast=false){
    const next=effective(),previous=current;
    current=next;
    if(label)label.textContent=labels[next];
    if(next!==previous){
      document.dispatchEvent(new CustomEvent('dowon:seasonchange',{detail:{season:next,day,preview:Boolean(override)}}));
      if(showToast&&previous)announce(next);
    }
  }
  document.addEventListener('dowon:timechange',event=>{
    const next=Number(event.detail?.day);
    if(!Number.isSafeInteger(next)||next<1)return;
    if(day!==null&&next!==day)override=null; // 하루가 지나면 임시 계절 해제
    const changedDay=day!==null&&day!==next;
    day=next;
    update(changedDay);
  });
  window.dowonSeasons={
    get:()=>({season:effective(),actual:seasonForDay(day||1),day,preview:Boolean(override)}),
    forDay:seasonForDay,
    preview(season){
      if(season!==null&&!cycle.includes(season))return false;
      override=season;
      update(false);
      return true;
    }
  };
  const actions=document.querySelector('#debug-dialog .debug-actions');
  if(actions){
    const group=document.createElement('div');group.className='debug-season-controls';
    const title=document.createElement('div');title.className='debug-weather-label';
    title.textContent='계절 미리보기 · 날짜 및 저장 데이터 변경 없음';
    const row=document.createElement('div');row.className='debug-season-buttons';
    for(const [season,name] of [['summer','여름'],['autumn','가을'],['winter','겨울'],['spring','봄'],[null,'날짜 기준 복귀']]){
      const button=document.createElement('button');button.type='button';button.textContent=name;
      button.addEventListener('click',()=>{
        window.dowonSeasons.preview(season);
        document.getElementById('debug-close')?.click();
      });
      row.append(button);
    }
    group.append(title,row);actions.append(group);
  }
})();
