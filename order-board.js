/* 주민 주문판: 현재 해금된 생산품만 요구, 주민 설정/동전/주문 영구 저장 */
(() => {
  'use strict';
  const KEY = 'dangcheong-dowon-village-orders-v1';
  // 주문판 전용 기본 주민: 번호별 이미지와 이름은 최초 배정 때 무작위 1:1 연결합니다.
  const DEFAULT_NAMES = ['무무','무순이','무돌이','무냥이','무떡이','무심이','무념이','무상이','무둘이','무밍이'];
  const DEFAULT_IMAGES = Array.from({length:10}, (_,i) => `character/주민/주민${i+1}.png`);
  const shuffle = values => {
    const result=values.slice();
    for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  };
  const progression=window.dowonProgression;
  // 모든 농작물·가공품은 창고 판매가/해금과 같은 공통 목록을 사용합니다.
  const requestItems = window.dowonRequestItems;
  if (!requestItems) throw new Error('주문 품목 목록(village-request-items.js)을 먼저 불러와 주세요.');
  const CATALOG = requestItems.catalog;
  const menu = document.getElementById('menu-orders');
  const board = document.getElementById('order-board');
  const backdrop = document.getElementById('order-backdrop');
  const close = document.getElementById('order-close');
  const list = document.getElementById('order-residents');
  const detail = document.getElementById('order-detail');
  const status = document.getElementById('order-status');
  const workshopCoinDisplay = document.getElementById('workshop-coin-wallet');
  if (!board || !menu || !list || !detail || typeof warehouse === 'undefined') return;

  let residents = [];
  let coins = 0;
  let selected = 0;
  let editing = false;
  let editingResident = null;
  let slots = Array(5).fill(null);
  const EXCHANGE_TIME = 5 * 60 * 1000;
  const roster = e('div', 'order-roster');
  list.parentNode.insertBefore(roster, list);
  const unlocked = () => requestItems.availableKeys();

  // 주민 주문판만 작물 5~20개를 요구합니다. 다른 부탁 시스템의 수량 설정은 유지합니다.
  const orderQtyRange = key => CATALOG[key]?.kind === 'crop' ? [5,20] : requestItems.qtyRange(key);
  function validOrderQty(key, qty) {
    if (!requestItems.has(key) || !Number.isInteger(qty)) return false;
    const [min,max] = orderQtyRange(key);
    return qty >= min && qty <= max;
  }
  function drawOrderQty(key) {
    const [min,max] = orderQtyRange(key);
    return min + Math.floor(Math.random() * (max - min + 1));
  }
  function validOrder(raw) {
    if (!Array.isArray(raw) || raw.length < 1 || raw.length > 3) return false;
    const seen = new Set();
    let foods = 0;
    for (const line of raw) {
      if (!line || !validOrderQty(line.key,line.qty) || seen.has(line.key)) return false;
      seen.add(line.key);
      if (CATALOG[line.key].kind === 'food') foods += line.qty;
    }
    return foods <= 1;
  }
  function generateOrder() {
    const selected = unlocked().slice();
    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selected[i], selected[j]] = [selected[j], selected[i]];
    }
    const desired = 1 + Math.floor(Math.random() * Math.min(3,selected.length));
    const lines = [];
    let addedFood = false;
    for (const key of selected) {
      if (lines.length >= desired) break;
      if (CATALOG[key].kind === 'food') {
        if (addedFood) continue;
        addedFood = true;
      }
      lines.push({key, qty:drawOrderQty(key)});
    }
    return lines;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({residents, coins, slots})); }
    catch (error) { status.textContent = '저장 공간이 부족합니다. 주민 이미지를 더 작은 파일로 설정해 주세요.'; console.warn(error); }
  }
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (Number.isSafeInteger(raw.coins) && raw.coins >= 0) coins = raw.coins;
    if (Array.isArray(raw.residents)) {
      residents = raw.residents.slice(0, 10).map(r => {
        if (!r || typeof r.name !== 'string') return null;
        const name = r.name.trim().slice(0, 20);
        if (!name) return null;
        return {name, image: typeof r.image === 'string' && (r.image.startsWith('data:image/') || /^character\/주민\/주민(?:10|[1-9])\.png$/.test(r.image)) ? r.image : '', order: validOrder(r.order) ? r.order : generateOrder()};
      });
    }
    // 이미 등록된 주문판 주민·초상화·주문은 덮어쓰지 않고, 빈 자리만 기본 주민으로 채웁니다.
    // 한번 생성된 조합은 기존 저장 키에 저장되어 새로고침/데이터 이동에도 유지됩니다.
    const usedNames=new Set(residents.filter(Boolean).map(r=>r.name));
    const usedImages=new Set(residents.filter(Boolean).map(r=>r.image));
    const names=shuffle(DEFAULT_NAMES.filter(name=>!usedNames.has(name)));
    const images=shuffle(DEFAULT_IMAGES.filter(image=>!usedImages.has(image)));
    for(let i=0;i<10;i++) {
      if(residents[i])continue;
      const name=names.shift(), image=images.shift();
      if(!name || !image)break;
      residents[i]={name,image,order:generateOrder()};
    }
    // 이전 5칸 고정 저장 데이터를 기존 주민 목록으로 안전하게 이전합니다.
    if (Array.isArray(raw.slots) && raw.slots.length === 5) {
      slots = raw.slots.map(s => {
        if (!s || typeof s !== 'object') return {resident:null, until:0, previous:null};
        const resident = Number.isInteger(s.resident) && residents[s.resident] ? s.resident : null;
        const until = Number.isFinite(s.until) && s.until > 0 ? s.until : 0;
        const previous = Number.isInteger(s.previous) ? s.previous : null;
        return {resident: until > Date.now() ? null : resident, until: until > Date.now() ? until : 0, previous};
      });
    } else {
      slots = Array.from({length:5}, (_,i) => ({resident:residents[i] ? i : null, until:0, previous:null}));
    }
    // 기존 저장에서 빈 주문 칸이 있으면 새로 추가된 기본 주민으로 배치합니다.
    const inUse=new Set(slots.map(s=>s?.resident).filter(id=>id!==null && id!==undefined));
    slots.forEach(s=>{if(!s || s.resident!==null || s.until>Date.now())return;
      const next=residents.findIndex((r,i)=>r && !inUse.has(i));
      if(next>=0){s.resident=next;inUse.add(next);}
    });
  } catch (error) { console.warn('주문 데이터 로드 오류', error); }
  function candidate(exclude=null) {
    const occupied = new Set(slots.map(s => s && s.resident).filter(n => n !== null && n !== undefined));
    const options = residents.map((r,i) => r && !occupied.has(i) && i !== exclude ? i : null).filter(i => i !== null);
    return options.length ? options[Math.floor(Math.random()*options.length)] : null;
  }
  function refill(index, exclude=null) {
    const id = candidate(exclude);
    slots[index] = {resident:id, until:0, previous:null};
    if (id !== null) residents[id].order = generateOrder();
    return id;
  }
  function updateExpired() {
    let changed = false;
    slots.forEach((s,i) => {if (s && s.until && Date.now() >= s.until) {refill(i, s.previous);changed=true;}});
    if(changed) save();
    return changed;
  }
  function showRoster() {
    roster.replaceChildren();
    const heading=e('div','order-roster-heading');
    heading.append(e('strong','',`주민 목록 ${residents.filter(Boolean).length}/10`));
    const add=e('button','order-roster-add','+ 주민 추가');add.type='button';add.disabled=residents.filter(Boolean).length>=10;
    add.addEventListener('click',()=>{editing=true;editingResident=null;status.textContent='';render();});
    heading.append(add);roster.append(heading);
    const people=e('div','order-roster-people');
    residents.forEach((r,i)=>{if(!r)return;const b=e('button','order-roster-person',r.name);b.type='button';b.dataset.npcIndex=String(i);b.title=`${r.name} 이름·이미지 수정`;b.addEventListener('click',()=>{editing=true;editingResident=i;render();});people.append(b);});
    roster.append(people);
  }
  function e(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }
  window.addEventListener('dowon-comfort-change',()=>{if(board.classList.contains('is-open'))render();});
  function showCoins() { if(!workshopCoinDisplay)return; const amount=workshopCoinDisplay.querySelector('.coin-amount'); if(amount)amount.textContent=coins.toLocaleString('ko-KR'); else workshopCoinDisplay.textContent=`◈ ${coins.toLocaleString('ko-KR')}`; }
  // 상점과 주민 주문판이 같은 동전 잔액을 사용하도록 단일 거래 API를 노출합니다.
  window.dowonWallet = {
    getBalance: () => coins,
    spend(amount) {
      if (!Number.isSafeInteger(amount) || amount <= 0 || coins < amount) return false;
      coins -= amount;
      save(); showCoins();
      document.dispatchEvent(new CustomEvent('dowon:walletchange', {detail:{coins}}));
      return true;
    },
    resetBalance() {
      coins = 0; save(); showCoins();
      document.dispatchEvent(new CustomEvent('dowon:walletchange', {detail:{coins}}));
      return true;
    },
    refund(amount) {
      if (!Number.isSafeInteger(amount) || amount <= 0) return;
      coins += amount; save(); showCoins();
      document.dispatchEvent(new CustomEvent('dowon:walletchange', {detail:{coins}}));
    }
  };
  function portrait(r) {
    if (!r || !r.image) return e('div', 'order-portrait', r ? '◇' : '+');
    const img = e('img', 'order-portrait'); img.src = r.image; img.alt = `${r.name}의 초상`; return img;
  }
  function showList() {
    list.replaceChildren();
    for (let i=0; i<5; i++) {
      if(progression && !progression.isOrderUnlocked(i)){
        const card=e('button','order-resident order-resident-locked');
        card.type='button';
        card.disabled=true;
        const centered=e('span','order-card-center');
        centered.append(
          e('span','order-locked-icon','🔒'),
          e('span','order-locked-title','쾌적도'),
          e('span','order-locked-value',`${progression.orderThreshold(i)} 해금`)
        );
        card.append(centered);
        list.append(card);
        continue;
      }
      const s=slots[i];
      const cooling=!!(s && s.until && Date.now()<s.until);
      const id=s && s.resident !== undefined ? s.resident : null;
      const r=id === null ? null : residents[id];
      if (cooling) {
        const card=e('div','order-resident order-resident-cooldown');
        const remaining=Math.max(0,Math.ceil((s.until-Date.now())/1000));
        const centered=e('span','order-card-center');
        centered.append(e('span','order-cooldown-label','주민 교체 중'),e('strong','order-cooldown-time',`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`));
        card.append(centered);
        list.append(card);continue;
      }
      const card=e('button','order-resident'+(selected===i?' active':''));card.type='button';
      card.setAttribute('aria-pressed',String(selected===i));
      if(r){
        card.append(portrait(r),e('span','order-resident-name',r.name));
      } else {
        const centered=e('span','order-card-center order-card-empty');
        centered.append(portrait(r),e('span','order-resident-name','대기 중'));
        card.append(centered);
      }
      card.disabled=!r;
      card.addEventListener('click',()=>{selected=i;editing=false;status.textContent='';render();});
      list.append(card);
    }
  }
  function showEditor(r) {
    detail.replaceChildren(e('h3', '', r ? '주민 정보 수정' : '주민 등록'));
    const form = e('form', 'order-edit');
    const name = e('input'); name.type = 'text'; name.maxLength = 20; name.required = true; name.placeholder = '주민 이름'; name.value = r ? r.name : '';
    const label = e('label', '', '주민 이미지 (선택 사항 · PNG/JPG/WebP)');
    const file = e('input'); file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp';
    let image = r ? r.image : '';
    const preview = e('div'); preview.appendChild(portrait(r));
    file.addEventListener('change', async () => {
      if (!file.files || !file.files[0]) return;
      const picked = file.files[0];
      if (picked.size > 10 * 1024 * 1024) { status.textContent = '이미지는 10MB 이하 파일을 선택해 주세요.'; return; }
      try {
        image = await shrink(picked);
        const updated = {name: name.value.trim() || '주민', image};
        preview.replaceChildren(portrait(updated)); status.textContent = '';
      } catch (error) { status.textContent = '이미지를 읽지 못했습니다. 다른 이미지를 선택해 주세요.'; }
    });
    form.append(name, label, file, preview);
    const saveButton = e('button', '', '저장'); saveButton.type = 'submit'; form.appendChild(saveButton);
    const cancel = e('button', '', '취소'); cancel.type = 'button'; cancel.addEventListener('click', () => {editing = false; render();}); form.appendChild(cancel);
    form.addEventListener('submit', ev => {
      ev.preventDefault(); const title = name.value.trim().slice(0, 20); if (!title) return;
      let index=editingResident;
      if (index === null) {
        if (residents.filter(Boolean).length >= 10) return;
        index=residents.findIndex(r=>!r);
        if(index<0) index=residents.length;
      }
      const original=residents[index];
      residents[index]={name:title,image,order:original&&validOrder(original.order)?original.order:generateOrder()};
      if(!original){ const empty=slots.findIndex(s=>s&&!s.until&&s.resident===null);if(empty>=0) slots[empty]={resident:index,until:0,previous:null}; }
      editing=false;editingResident=null;save();render();
    });
    detail.appendChild(form);
  }
  async function shrink(file) {
    const src = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = src; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 210;
      const ctx = canvas.getContext('2d');
      const scale = Math.min(160 / image.naturalWidth, 210 / image.naturalHeight);
      const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
      ctx.clearRect(0, 0, 160, 210);
      ctx.drawImage(image, (160 - w) / 2, (210 - h) / 2, w, h);
      return canvas.toDataURL('image/png');
    } finally { URL.revokeObjectURL(src); }
  }
  function showDetail() {
    if(progression && !progression.isOrderUnlocked(selected)){detail.replaceChildren(e('h3','','주문 칸 잠김'),e('p','order-hint',`쾌적도 ${progression.orderThreshold(selected)}에 해금됩니다.`));return;}
    const currentSlot=slots[selected];
    const r=currentSlot && currentSlot.resident !== null ? residents[currentSlot.resident] : null; detail.replaceChildren();
    if(currentSlot && currentSlot.until && Date.now()<currentSlot.until){detail.append(e('h3','','주민 교체 중'),e('p','order-hint','5분 후 새로운 주민의 주문이 도착합니다.'));return;}
    if (!r) {
      detail.append(e('h3', '', '새 주민을 등록해 주세요.'), e('p', 'order-hint', '주민 이름과 이미지를 설정하면 해당 주민의 주문을 받을 수 있습니다.'));
      return;
    }
    if (!validOrder(r.order)) { r.order = generateOrder(); save(); }
    const header = e('div', 'order-detail-heading');
    const headingTitle=e('div','order-heading-title');
    headingTitle.appendChild(e('h3', '', `${r.name}의 주문`));
    headingTitle.dataset.npcIndex=String(currentSlot.resident);
    const affinity=window.dowonAffinity?.renderNpcBadge?.(currentSlot.resident);
    if(affinity)headingTitle.appendChild(affinity);
    header.appendChild(headingTitle);
    const edit = e('button', 'order-edit-trigger', '이름·이미지 수정'); edit.type = 'button'; edit.addEventListener('click', () => {editing = true; editingResident=currentSlot.resident; showEditor(r);}); header.appendChild(edit); detail.appendChild(header);
    const items = e('div', 'order-items');
    let enough = true;
    // 동일한 품목·수량을 창고에서 직접 판매한 총액의 120% (동전 단위 올림).
    const payout = requestItems.orderReward(r.order);
    for (const line of r.order) {
      const info = CATALOG[line.key]; const owned = Number(warehouse[line.key] || 0);
      if (owned < line.qty) enough = false;
      const cell = e('div', 'order-item'); const icon = e('img'); icon.src = info.image; icon.alt = info.name;
      const ownedLabel=e('span', `owned-count ${owned >= line.qty ? 'sufficient' : 'insufficient'}`, `보유 ${owned}개`);
      cell.append(icon, e('strong', '', info.name), e('span', '', `필요 ${line.qty}개`), ownedLabel); items.appendChild(cell);
    }
    detail.appendChild(items); const reward = e('div','order-reward'); reward.append('납품 보상 (일반 판매가 +20%)  ◈ '); reward.appendChild(e('b','',payout.toLocaleString('ko-KR')));
    const submit = e('button', '', '주문 제출'); submit.disabled = !enough; submit.type = 'button';
    submit.addEventListener('click', () => {
      if (!validOrder(r.order) || r.order.some(line => (warehouse[line.key] || 0) < line.qty)) {status.textContent = '재고가 부족합니다.'; render(); return;}
      for (const line of r.order) warehouse[line.key] -= line.qty;
      window.dowonAffinity?.addNpcPoints(currentSlot.resident,window.dowonResidentRewards?.npcOrderPoints||10);
      coins += payout; showCoins(); document.dispatchEvent(new CustomEvent('dowon:walletchange',{detail:{coins}}));
      document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'order-complete',resident:currentSlot.resident,items:r.order.map(line=>({key:line.key,qty:line.qty})),reward:payout}}));
      refill(selected, currentSlot.resident);
      saveWarehouse(); save(); renderWarehouse();
      if (typeof updateChopperButton === 'function') updateChopperButton();
      if (typeof updateCoopButton === 'function') updateCoopButton();
      status.textContent = '';
      render();
    });
    const footer = e('div', 'order-footer');
    const exchange = e('button', 'order-exchange', '교환'); exchange.type = 'button'; exchange.title = '새 주문 받기';
    exchange.addEventListener('click', () => {
      slots[selected]={resident:null,until:Date.now()+EXCHANGE_TIME,previous:currentSlot.resident};
      save();status.textContent='';render();
    });
    const actions = e('div', 'order-footer-actions'); actions.append(exchange, submit); footer.append(reward, actions); detail.appendChild(footer);
  }
  function render() { if(progression)progression.refreshComfort();updateExpired();showCoins();showRoster();showList();if(editing)showEditor(editingResident===null?null:residents[editingResident]);else showDetail(); }
  function setOpen(open) {
    board.classList.toggle('is-open',open); backdrop.classList.toggle('is-open',open);
    board.setAttribute('aria-hidden',String(!open)); menu.setAttribute('aria-expanded',String(open));
    if (open) {status.textContent = ''; render(); close.focus();} else menu.focus();
  }
  menu.addEventListener('click', () => setOpen(true)); close.addEventListener('click', () => setOpen(false)); backdrop.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', ev => {if (ev.key === 'Escape' && board.classList.contains('is-open')) setOpen(false);});
  setInterval(() => {
    if(updateExpired()) {if(board.classList.contains('is-open'))render();return;}
    if(board.classList.contains('is-open')) {
      slots.forEach((s,i)=>{if(!s||!s.until)return;const c=list.children[i];const t=c&&c.querySelector('.order-cooldown-time');if(t){const remain=Math.max(0,Math.ceil((s.until-Date.now())/1000));t.textContent=`${Math.floor(remain/60)}:${String(remain%60).padStart(2,'0')}`;}});
    }
  },1000);
  // 초기 로드 시 주문판을 열지 않아도 저장된 동전 잔액 표시
  showCoins();
  save();
})();
