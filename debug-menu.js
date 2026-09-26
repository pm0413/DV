/* 선택형 디버그 메뉴
 * 이 파일이 존재할 때만 디버그 버튼/팝업이 생성됩니다.
 * 배포 시 이 파일만 제외하면 디버그 UI가 나타나지 않습니다.
 */
(() => {
  'use strict';
  if (document.getElementById('debug-open')) return;

  const topRight = document.getElementById('top-right');
  if (!topRight) return;

  const openButton = document.createElement('button');
  openButton.id = 'debug-open';
  openButton.type = 'button';
  openButton.setAttribute('aria-haspopup', 'dialog');
  openButton.setAttribute('aria-controls', 'debug-dialog');
  openButton.setAttribute('aria-expanded', 'false');
  openButton.title = '디버그';
  openButton.innerHTML = '<span class="debug-button-icon material-symbols-outlined" aria-hidden="true">bug_report</span><span class="debug-button-label utility-label">디버그</span>';
  topRight.insertBefore(openButton, topRight.firstElementChild);

  const backdrop = document.createElement('div');
  backdrop.id = 'debug-backdrop';
  backdrop.className = 'debug-backdrop';
  backdrop.hidden = true;

  const dialog = document.createElement('section');
  dialog.id = 'debug-dialog';
  dialog.className = 'debug-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'debug-title');
  dialog.hidden = true;
  dialog.innerHTML = `
    <div class="debug-heading"><strong id="debug-title">디버그</strong><button id="debug-close" type="button" aria-label="디버그 닫기">×</button></div>
    <div class="debug-actions">
      <button id="debug-fast-forward" type="button">전체 빨리 감기 (제작 · 건설 · 작물)</button>
      <button id="debug-toggle-workshops" type="button" aria-pressed="false">모든 가공소 해금: OFF</button>
      <button id="debug-free-crafting" type="button" aria-pressed="false">재료 상관없이 제작: OFF</button>
      <div class="debug-amount-control"><label for="debug-coins-amount">추가할 동전</label><input id="debug-coins-amount" type="number" min="1" max="1000000000" step="1" inputmode="numeric" value="10000"><button id="debug-add-coins" type="button">동전 추가</button></div>
      <div class="debug-amount-control"><label for="debug-comfort-amount">추가할 쾌적도</label><input id="debug-comfort-amount" type="number" min="1" max="1000000000" step="1" inputmode="numeric" value="100"><button id="debug-add-comfort" type="button">쾌적도 추가</button></div>
      <div class="debug-two-buttons" role="group" aria-label="시간 변경"><button id="debug-day" type="button">낮이 되기</button><button id="debug-night" type="button">밤이 되기</button></div>
      <button id="debug-evening" type="button">오후 5시 50분이 되기</button>
    </div>`;
  document.body.append(backdrop, dialog);

  const closeButton = dialog.querySelector('#debug-close');
  const actions = dialog.querySelector('.debug-actions');
  function setOpen(open) {
    dialog.hidden = !open;
    backdrop.hidden = !open;
    openButton.setAttribute('aria-expanded', String(open));
    if (open) closeButton.focus(); else openButton.focus();
  }
  openButton.addEventListener('click', () => setOpen(true));
  closeButton.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dialog.hidden) setOpen(false); });

  dialog.querySelector('#debug-day')?.addEventListener('click', () => { window.dowonClock?.jumpTo(12); setOpen(false); });
  dialog.querySelector('#debug-night')?.addEventListener('click', () => { window.dowonClock?.jumpTo(22); setOpen(false); });
  dialog.querySelector('#debug-evening')?.addEventListener('click', () => { window.dowonClock?.jumpTo(17, 50); setOpen(false); });
  dialog.querySelector('#debug-fast-forward')?.addEventListener('click', () => {
    window.dowonProgression?.finishAllConstruction?.();
    window.dowonGrowAllCrops?.();
    window.dowonFinishAllCrafting?.();
    setOpen(false);
  });

  const WORKSHOP_DEBUG_BACKUP = 'dangcheong-dowon-debug-workshop-backup-v1';
  const workshopToggle = dialog.querySelector('#debug-toggle-workshops');
  function hasWorkshopBackup(){ try{return localStorage.getItem(WORKSHOP_DEBUG_BACKUP)!==null;}catch(_){return false;} }
  function refreshWorkshopToggle(){ const enabled=hasWorkshopBackup(); workshopToggle.textContent=`모든 가공소 해금: ${enabled?'ON':'OFF'}`; workshopToggle.setAttribute('aria-pressed',String(enabled)); }
  workshopToggle?.addEventListener('click',()=>{
    const api=window.dowonProgression;
    if(!api?.debugUnlockAllWorkshops||!api?.debugRestoreWorkshops)return;
    if(!hasWorkshopBackup()){
      let previous={};
      try{previous=JSON.parse(localStorage.getItem('dangcheong-dowon-progression-v1')||'{}')?.workshops||{};localStorage.setItem(WORKSHOP_DEBUG_BACKUP,JSON.stringify(previous));}
      catch(_){alert('가공소 원래 상태를 저장하지 못했습니다.');return;}
      if(api.debugUnlockAllWorkshops()<0){localStorage.removeItem(WORKSHOP_DEBUG_BACKUP);alert('가공소 해금에 실패했습니다.');return;}
    }else{
      let previous;
      try{previous=JSON.parse(localStorage.getItem(WORKSHOP_DEBUG_BACKUP));}catch(_){alert('이전 가공소 상태를 읽지 못했습니다.');return;}
      if(!api.debugRestoreWorkshops(previous)){alert('가공소 원래 상태를 복원하지 못했습니다.');return;}
      localStorage.removeItem(WORKSHOP_DEBUG_BACKUP);
    }
    refreshWorkshopToggle();
  });
  refreshWorkshopToggle();

  const freeCraftButton=dialog.querySelector('#debug-free-crafting');
  function refreshFreeCraft(){const enabled=Boolean(window.dowonDebugFreeCraft?.get?.());freeCraftButton.textContent=`재료 상관없이 제작: ${enabled?'ON':'OFF'}`;freeCraftButton.setAttribute('aria-pressed',String(enabled));}
  freeCraftButton?.addEventListener('click',()=>{if(!window.dowonDebugFreeCraft)return;window.dowonDebugFreeCraft.set(!window.dowonDebugFreeCraft.get());refreshFreeCraft();});
  refreshFreeCraft();

  function readAmount(id){const field=dialog.querySelector('#'+id);const value=Number(field?.value);if(!field||!Number.isSafeInteger(value)||value<1||value>1000000000){alert('추가할 수량을 1~1,000,000,000 사이의 정수로 입력해 주세요.');field?.focus();return null;}return value;}
  dialog.querySelector('#debug-add-coins')?.addEventListener('click',()=>{const amount=readAmount('debug-coins-amount');if(amount===null)return;if(typeof window.dowonWallet?.refund!=='function'){alert('동전 기능을 찾지 못했습니다.');return;}window.dowonWallet.refund(amount);setOpen(false);});
  dialog.querySelector('#debug-add-comfort')?.addEventListener('click',()=>{const amount=readAmount('debug-comfort-amount');if(amount===null)return;if(typeof window.dowonComfort?.get!=='function'||typeof window.dowonComfort?.set!=='function'){alert('쾌적도 기능을 찾지 못했습니다.');return;}window.dowonComfort.set(window.dowonComfort.get()+amount);setOpen(false);});

  if (actions) {
    const affinityButton=document.createElement('button'); affinityButton.type='button'; affinityButton.id='debug-edit-affinity'; affinityButton.textContent='캐릭터 호감도 변경'; actions.append(affinityButton);
    const panel=document.createElement('section'); panel.id='debug-affinity-panel'; panel.hidden=true;
    const heading=document.createElement('strong');heading.textContent='캐릭터 호감도 변경';
    const kind=document.createElement('select');kind.setAttribute('aria-label','주민 종류'); [['mpc','MPC · 마을 주민 5명'],['npc','NPC · 주문판 주민 10명']].forEach(([v,t])=>kind.add(new Option(t,v)));
    const resident=document.createElement('select');resident.setAttribute('aria-label','변경할 주민');
    const hearts=document.createElement('select');hearts.setAttribute('aria-label','해금된 하트 수');for(let n=0;n<=10;n++)hearts.add(new Option(`♥ ${n} / 10`,String(n)));
    const points=document.createElement('input');points.type='number';points.min='0';points.step='1';points.setAttribute('aria-label','현재 단계 호감도');
    const info=document.createElement('p');info.className='debug-affinity-info';
    const save=document.createElement('button');save.type='button';save.textContent='호감도 적용';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='닫기';
    panel.append(heading,kind,resident,hearts,points,info,save,cancel); actions.insertAdjacentElement('afterend',panel);
    function residentNames(){try{const key=kind.value==='mpc'?'dangcheong-dowon-player-residents-v1':'dangcheong-dowon-village-orders-v1';const data=JSON.parse(localStorage.getItem(key)||'null');return (kind.value==='mpc'?data:data?.residents)||[];}catch(_){return [];}}
    function updateNumbers(){const api=window.dowonAffinity;if(!api)return;const h=Number(hearts.value),max=api.debugThreshold(h);points.disabled=h===10;points.max=h===10?'0':String(max-1);info.textContent=h===10?'모든 하트 해금 완료 · 현재 호감도 0':`현재 단계: 0 ~ ${max-1} (다음 하트 필요 ${max})`;}
    function readSelected(){const state=window.dowonAffinity?.get(kind.value,Number(resident.value));if(!state)return;hearts.value=String(state.hearts);points.value=String(state.points);updateNumbers();}
    function populate(){const names=residentNames();resident.replaceChildren();const size=kind.value==='mpc'?5:10;for(let i=0;i<size;i++)resident.add(new Option(`${i+1}. ${names[i]?.name||'미등록'}`,String(i)));readSelected();}
    affinityButton.addEventListener('click',()=>{if(!window.dowonAffinity?.debugSet){alert('호감도 기능을 찾지 못했습니다.');return;}panel.hidden=!panel.hidden;if(!panel.hidden)populate();});
    kind.addEventListener('change',populate);resident.addEventListener('change',readSelected);hearts.addEventListener('change',()=>{points.value='0';updateNumbers();});
    save.addEventListener('click',()=>{const h=Number(hearts.value),v=Number(points.value);if(points.value.trim()===''||!window.dowonAffinity?.debugSet(kind.value,Number(resident.value),h,v)){alert('현재 단계 호감도를 올바르게 입력해 주세요.');return;}readSelected();info.textContent='저장 완료 · '+info.textContent;});
    cancel.addEventListener('click',()=>{panel.hidden=true;});
  }
})();
