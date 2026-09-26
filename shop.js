/* 가구 상점: 테마 섹션 + 상품 팝업 + 구매 */
(() => {
  'use strict';

  const THEMES = Array.isArray(window.DOWON_SHOP_THEMES) && window.DOWON_SHOP_THEMES.length
    ? window.DOWON_SHOP_THEMES
    : [{
        id: 'default',
        title: '테마1',
        items: [
          { key: 'chair', name: '의자', price: 100, comfort: 10, image: 'item/장식/의자.png' },
          { key: 'desk', name: '책상', price: 200, comfort: 20, image: 'item/장식/책상.png' },
          { key: 'light', name: '조명', price: 150, comfort: 15, image: 'item/장식/조명.png' }
        ]
      }];

  const CAT_THEMES = Array.isArray(window.DOWON_CAT_SHOP_THEMES) ? window.DOWON_CAT_SHOP_THEMES : [];
  // 고양이 가구도 기존 가구와 동일하게 창고·쾌적도·판매 시스템에 포함됩니다.
  const ALL_THEMES = [...THEMES, ...CAT_THEMES];
  const CATALOG = Object.freeze(ALL_THEMES.reduce((acc, theme) => {
    (theme.items || []).forEach(item => {
      if (!item || !item.key) return;
      acc[item.key] = {
        name: item.name || item.key,
        price: Number(item.price) || 0,
        comfort: Number(item.comfort) || 0,
        affection: Number(item.affection) || 0,
        adoptionBonus: Number(item.adoptionBonus) || 0,
        oneTime: Boolean(item.oneTime),
        image: item.image || '',
        themeId: theme.id,
        themeTitle: theme.title || ''
      };
    });
    return acc;
  }, {}));

  const KEY = 'dangcheong-dowon-furniture-v2';
  const COLLECTION_KEY = 'dangcheong-dowon-shop-collection-v1';
  const button = document.getElementById('menu-shop');
  const dialog = document.getElementById('shop-dialog');
  const backdrop = document.getElementById('shop-backdrop');
  const close = document.getElementById('shop-close');
  const list = document.getElementById('shop-products');
  const coins = document.getElementById('shop-coins');
  const status = document.getElementById('shop-status');
  const materialsTab = document.getElementById('shop-tab-materials');
  const petsTab = document.getElementById('shop-tab-pets');
  let activeTab = 'materials';
  const getFeedCount = key => window.dowonInventory?.get?.(key) ?? 0;
  const FEEDS = Object.freeze([
    {key:'catFishFeed',name:'생선 사료',price:35,comfort:0,themeTitle:'반려동물 · 고양이 사료',image:'item/장식/고양이 가구/생선 밥그릇.png',isFeed:true},
    {key:'catDuckFeed',name:'오리고기 사료',price:35,comfort:0,themeTitle:'반려동물 · 고양이 사료',image:'item/장식/고양이 가구/오리고기 밥그릇.png',isFeed:true},
    {key:'catChickenFeed',name:'닭고기 사료',price:35,comfort:0,themeTitle:'반려동물 · 고양이 사료',image:'item/장식/고양이 가구/닭고기 밥그릇.png',isFeed:true}
  ]);
  const FEED_BY_KEY = Object.freeze(Object.fromEntries(FEEDS.map(food=>[food.key,food])));
  const MATERIALS = Object.freeze([
    {key:'bait',name:'미끼',price:10,comfort:0,themeTitle:'낚시 재료',image:'item/재료/미끼.png',isMaterial:true},
    {key:'chickenMeat',name:'닭고기',price:35,comfort:0,themeTitle:'요리 재료',image:'item/재료/닭고기.png',isMaterial:true},
    {key:'pork',name:'돼지고기',price:45,comfort:0,themeTitle:'요리 재료',image:'item/재료/돼지고기.png',isMaterial:true},
    {key:'bitterMelon',name:'여주',price:15,comfort:0,themeTitle:'요리 재료',image:'item/재료/여주.png',isMaterial:true},
    {key:'shepherdsPurse',name:'냉이',price:12,comfort:0,themeTitle:'요리 재료',image:'item/재료/냉이.png',isMaterial:true}
  ]);
  const MATERIAL_BY_KEY = Object.freeze(Object.fromEntries(MATERIALS.map(item=>[item.key,item])));
  const getMaterialCount = key => window.dowonInventory?.get?.(key) ?? 0;

  if (!button || !dialog || !backdrop || !close || !list) return;

  let inventory = {};
  for (const key of Object.keys(CATALOG)) inventory[key] = 0;

  try {
    const old = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (old && typeof old === 'object') {
      for (const key of Object.keys(CATALOG)) {
        if (Number.isSafeInteger(old[key]) && old[key] >= 0) inventory[key] = old[key];
      }
    }
  } catch (error) {
    console.warn('가구 재고를 읽지 못했습니다.', error);
  }

  // 소유 기록은 창고 수량과 분리합니다. 판매하거나 사용해도 재구매 불가 상태가 유지됩니다.
  let collection = { purchased: {}, completed: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(COLLECTION_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (saved.purchased && typeof saved.purchased === 'object') collection.purchased = { ...saved.purchased };
      if (saved.completed && typeof saved.completed === 'object') collection.completed = { ...saved.completed };
    }
  } catch (error) { console.warn('상점 수집 기록을 불러오지 못했습니다.', error); }
  // 기존 버전에서 보유하던 장식도 이미 구매한 것으로 취급합니다.
  for (const key of Object.keys(CATALOG)) if (inventory[key] > 0) collection.purchased[key] = true;
  try { localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection)); } catch (error) {
    console.warn('상점 수집 기록을 저장하지 못했습니다.', error);
  }
  const isPetItem = item => Boolean(item && CAT_THEMES.some(theme => theme.id === item.themeId));
  const isRepeatable = item => Boolean(item && (item.isFeed || item.isMaterial || (isPetItem(item) && !item.oneTime)));
  const isPurchased = key => collection.purchased[key] === true;
  const themeItems = id => Object.entries(CATALOG).filter(([, item]) => item.themeId === id);
  const themeComplete = id => {
    const entries = themeItems(id);
    return entries.length > 0 && entries.every(([key]) => isPurchased(key));
  };
  const themeBonus = id => themeItems(id).reduce((total, [, item]) => total + item.comfort, 0) / 2;

  window.dowonFurniture = CATALOG;
  window.dowonFurnitureInventory = {
    get: () => ({ ...inventory }),
    sell(key, qty) {
      // 반려동물 상품은 재구매가 가능하므로 여러 개 보유하거나 판매할 수 있습니다.
      if (!CATALOG[key] || CATALOG[key].adoptionBonus || !Number.isSafeInteger(qty) || qty < 1 || inventory[key] < qty) return false;
      const next = { ...inventory, [key]: inventory[key] - qty };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch (_) {
        return false;
      }
      inventory = next;
      window.dowonComfort?.set?.(Math.max(0, (window.dowonComfort.get() || 0) - CATALOG[key].comfort * qty));
      return true;
    }
  };

  function updateCoins() {
    const balance = window.dowonWallet?.getBalance?.();
    const amount = coins.querySelector('.coin-amount');
    if (amount) amount.textContent = balance === undefined ? '0' : balance.toLocaleString('ko-KR');
    else coins.textContent = balance === undefined ? '◈ 0' : `◈ ${balance.toLocaleString('ko-KR')}`;
    const disabled = balance === undefined;
    if (currentItem) {
      syncPopupControls(balance, disabled);
    }
  }


  function buy(key, qty = 1) {
    if (MATERIAL_BY_KEY[key]) {
      const material=MATERIAL_BY_KEY[key];
      const count=Math.max(1,Number(qty)||1);
      const wallet=window.dowonWallet;
      if(!wallet){status.textContent='동전 정보를 불러오지 못했습니다.';return;}
      const totalPrice=material.price*count;
      if(!wallet.spend(totalPrice)){status.textContent='동전이 부족합니다.';updateCoins();return;}
      if(!window.dowonInventory?.add?.(material.key,count)){
        wallet.refund?.(totalPrice);status.textContent='재료를 창고에 보관하지 못했습니다.';updateCoins();return;
      }
      document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'material-purchased',key:material.key,count}}));
      status.textContent=`${material.name} ${count}개를 구매했습니다. · 창고 보유 ${getMaterialCount(material.key)}개`;
      closeItemPopup();renderShop();updateCoins();return;
    }
    if (FEED_BY_KEY[key]) {
      const feedItem=FEED_BY_KEY[key];
      const count = Math.max(1, Number(qty) || 1);
      const wallet = window.dowonWallet;
      if (!wallet) {
        status.textContent = '동전 정보를 불러오지 못했습니다.';
        return;
      }
      const totalPrice = feedItem.price * count;
      if (!wallet.spend(totalPrice)) {
        status.textContent = '고양이 사료를 구매하지 못했습니다. 보유 동전을 확인해 주십시오.';
        updateCoins();
        return;
      }
      if (!window.dowonInventory?.add?.(feedItem.key, count)) {
        wallet.refund?.(totalPrice);
        status.textContent = '고양이 사료를 창고에 보관하지 못했습니다.';
        updateCoins();
        return;
      }
      document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cat-feed-purchased',key:feedItem.key,count}}));
      status.textContent = `${feedItem.name} ${count}개를 구매했습니다. · 창고 보유 ${getFeedCount(feedItem.key)}개`;
      closeItemPopup();
      renderShop();
      updateCoins();
      return;
    }
    const item = CATALOG[key];
    const wallet = window.dowonWallet;
    if (!item || !wallet) {
      status.textContent = '동전 정보를 불러오지 못했습니다.';
      return;
    }
    const repeatable = isRepeatable(item);
    const count = repeatable ? clampQuantity(qty) : 1;
    if (!repeatable && isPurchased(key)) {
      closeItemPopup();
      status.textContent = '이미 구매한 상품입니다.';
      return;
    }
    const totalPrice = item.price * count;
    if (!wallet.spend(totalPrice)) {
      status.textContent = '동전이 부족합니다.';
      updateCoins();
      return;
    }
    const next = { ...inventory, [key]: (inventory[key] || 0) + count };
    // 반려동물 상품은 1회 구매 컬렉션에 기록하지 않고, 가구의 기존 1회 구매 규칙만 유지합니다.
    const nextCollection = repeatable ? collection : {
      purchased: { ...collection.purchased, [key]: true },
      completed: { ...collection.completed }
    };
    const themeEntries = repeatable ? [] : themeItems(item.themeId);
    const justCompleted = !item.adoptionBonus && themeEntries.length > 0 && !collection.completed[item.themeId]
      && themeEntries.every(([productKey]) => nextCollection.purchased[productKey] === true);
    if (justCompleted) nextCollection.completed[item.themeId] = true;
    try {
      // 구매/수집 완료를 모두 보존한 뒤에만 쾌적도를 지급합니다.
      localStorage.setItem(KEY, JSON.stringify(next));
      if (!repeatable) localStorage.setItem(COLLECTION_KEY, JSON.stringify(nextCollection));
    } catch (error) {
      try { localStorage.setItem(KEY, JSON.stringify(inventory)); } catch (_) {}
      wallet.refund(totalPrice);
      status.textContent = '구매 기록을 저장하지 못해 결제를 취소했습니다.';
      console.warn(error);
      return;
    }
    inventory = next;
    collection = nextCollection;
    document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'shop-purchased',key,adoptionBonus:!!item.adoptionBonus}}));
    const bonus = justCompleted ? themeBonus(item.themeId) : 0;
    window.dowonComfort?.set?.((window.dowonComfort.get() || 0) + item.comfort * count + bonus);
    if (item.adoptionBonus) window.dispatchEvent(new Event('dowon:cat-adoption-capacity-change'));
    if (typeof window.renderWarehouse === 'function') window.renderWarehouse();
    else if (typeof renderWarehouse === 'function') renderWarehouse();
    status.textContent = item.adoptionBonus ? `${item.name} 구매 완료 · 쾌적도 +${item.comfort} · 입양 가능 고양이 +${item.adoptionBonus}` : item.affection > 0
      ? `${item.name} ${count}개 구매 완료 · 보유 ${next[key]}개 · 놀아주기에 사용할 수 있습니다.`
      : justCompleted
        ? `${item.themeTitle} 완벽 구매! 쾌적도 +${item.comfort} · 테마 완성 보너스 +${bonus}`
        : `${item.name} ${count}개 구매 완료 · 쾌적도 +${item.comfort * count}`;
    closeItemPopup();
    renderShop();
    updateCoins();
  }

  // popup
  const itemPopupBackdrop = document.createElement('div');
  itemPopupBackdrop.className = 'shop-item-backdrop';
  itemPopupBackdrop.hidden = true;

  const itemPopup = document.createElement('section');
  itemPopup.className = 'shop-item-dialog';
  itemPopup.hidden = true;
  itemPopup.setAttribute('role', 'dialog');
  itemPopup.setAttribute('aria-modal', 'true');
  itemPopup.setAttribute('aria-labelledby', 'shop-item-title');

  itemPopup.innerHTML = `
    <button type="button" class="shop-item-close" aria-label="상품 팝업 닫기">×</button>
    <div class="shop-item-preview">
      <img id="shop-item-image" alt="" width="240" height="240">
    </div>
    <div class="shop-item-copy">
      <p class="shop-item-theme" id="shop-item-theme"></p>
      <h3 id="shop-item-title"></h3>
      <p class="shop-item-comfort" id="shop-item-comfort"></p>
      <div class="shop-item-quantity" id="shop-item-quantity" hidden>
        <span class="shop-item-quantity-label">구매 수량</span>
        <div class="shop-item-stepper">
          <button type="button" class="shop-stepper-button" id="shop-qty-minus" aria-label="수량 줄이기">−</button>
          <input type="number" min="1" max="99" step="1" class="shop-qty-input" id="shop-qty-input" value="1" inputmode="numeric">
          <button type="button" class="shop-stepper-button" id="shop-qty-plus" aria-label="수량 늘리기">＋</button>
        </div>
      </div>
      <div class="shop-item-actions">
        <button type="button" class="shop-price-button" id="shop-item-price" disabled></button>
        <button type="button" class="shop-buy-button" id="shop-item-buy">구매</button>
      </div>
    </div>
  `;
  document.body.append(itemPopupBackdrop, itemPopup);

  const popupCloseButton = itemPopup.querySelector('.shop-item-close');
  const popupImage = itemPopup.querySelector('#shop-item-image');
  const popupTheme = itemPopup.querySelector('#shop-item-theme');
  const popupTitle = itemPopup.querySelector('#shop-item-title');
  const popupComfort = itemPopup.querySelector('#shop-item-comfort');
  const quantityWrap = itemPopup.querySelector('#shop-item-quantity');
  const quantityInput = itemPopup.querySelector('#shop-qty-input');
  const quantityMinus = itemPopup.querySelector('#shop-qty-minus');
  const quantityPlus = itemPopup.querySelector('#shop-qty-plus');
  const priceButton = itemPopup.querySelector('#shop-item-price');
  const buyButton = itemPopup.querySelector('#shop-item-buy');

  let currentItem = null;
  let currentQuantity = 1;
  let lastFocusedTile = null;

  function clampQuantity(value) {
    return Math.max(1, Math.min(99, Number(value) || 1));
  }

  function syncPopupControls(balance = window.dowonWallet?.getBalance?.(), disabled = balance === undefined) {
    if (!currentItem) return;
    const qty = isRepeatable(currentItem) ? clampQuantity(currentQuantity) : 1;
    currentQuantity = qty;
    if (quantityInput) quantityInput.value = String(qty);
    if (quantityWrap) quantityWrap.hidden = !isRepeatable(currentItem);
    const totalPrice = currentItem.price * qty;
    priceButton.textContent = `${totalPrice.toLocaleString('ko-KR')} 동전`;
    priceButton.disabled = disabled;
    buyButton.disabled = disabled || balance < totalPrice || (!isRepeatable(currentItem) && isPurchased(currentItem.key));
    buyButton.textContent = isRepeatable(currentItem) ? `${qty}개 구매` : '구매';
  }

  function setQuantity(next) {
    currentQuantity = clampQuantity(next);
    syncPopupControls();
  }

  quantityMinus?.addEventListener('click', () => setQuantity(currentQuantity - 1));
  quantityPlus?.addEventListener('click', () => setQuantity(currentQuantity + 1));
  quantityInput?.addEventListener('input', () => setQuantity(quantityInput.value));
  quantityInput?.addEventListener('blur', () => setQuantity(quantityInput.value));

  function openItemPopup(item, sourceButton) {
    if (!item || (!isRepeatable(item) && isPurchased(item.key))) return;
    currentItem = item;
    currentQuantity = 1;
    lastFocusedTile = sourceButton || null;
    popupImage.src = item.image;
    popupImage.alt = item.name;
    popupTheme.textContent = item.themeTitle || '';
    popupTitle.textContent = item.name;
    popupComfort.textContent = item.isFeed
      ? `밥그릇을 누르면 선택하여 채울 수 있습니다. 창고 보유 ${getFeedCount(item.key)}개`
      : item.isMaterial
        ? `요리에 사용하는 재료입니다. 창고 보유 ${getMaterialCount(item.key)}개`
      : item.adoptionBonus > 0
        ? `쾌적도 +${item.comfort} · 입양 가능 고양이 +${item.adoptionBonus} · 1회 구매 한정`
      : item.affection > 0
        ? `놀아주기에 사용하면 해당 고양이 호감도 +${item.affection} · 구매 후 반복 사용 가능합니다.`
        : `쾌적도 +${item.comfort}`;
    buyButton.onclick = () => buy(item.key, currentQuantity);
    itemPopup.hidden = itemPopupBackdrop.hidden = false;
    itemPopup.setAttribute('aria-hidden', 'false');
    syncPopupControls();
    requestAnimationFrame(() => buyButton.focus());
  }

  function closeItemPopup() {
    currentItem = null;
    itemPopup.hidden = itemPopupBackdrop.hidden = true;
    itemPopup.setAttribute('aria-hidden', 'true');
    if (lastFocusedTile) lastFocusedTile.focus();
  }

  popupCloseButton.addEventListener('click', closeItemPopup);
  itemPopupBackdrop.addEventListener('click', closeItemPopup);

  function createTile(item) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shop-tile';
    const owned = !isRepeatable(item) && isPurchased(item.key);
    button.setAttribute('aria-label', owned ? `${item.name} · 구매 완료` : item.isFeed ? `${item.name} · 동전 ${item.price} · 창고 보유 ${getFeedCount(item.key)}개` : item.isMaterial ? `${item.name} · 동전 ${item.price} · 창고 보유 ${getMaterialCount(item.key)}개` : isPetItem(item) ? `${item.name} · 동전 ${item.price} · 보유 ${inventory[item.key] || 0}개` : item.name);
    button.disabled = owned;
    button.classList.toggle('shop-tile-owned', owned);
    button.classList.toggle('shop-tile-unowned', !owned);

    const frame = document.createElement('span');
    frame.className = 'shop-tile-frame';

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = '';
    img.width = 80;
    img.height = 80;
    img.loading = 'lazy';

    frame.append(img);
    button.append(frame);
    if (isRepeatable(item)) {
      const quantity = document.createElement('span');quantity.className='shop-feed-quantity';
      quantity.textContent=`×${item.isFeed ? getFeedCount(item.key) : item.isMaterial ? getMaterialCount(item.key) : (inventory[item.key] || 0)}`;
      frame.append(quantity);
    }
    button.addEventListener('click', () => openItemPopup(item, button));
    return button;
  }

  function renderShop() {
    list.innerHTML = '';
    const tabIsPets = activeTab === 'pets';
    const tabIsMaterials = activeTab === 'materials';
    materialsTab?.classList.toggle('is-active', tabIsMaterials);
    petsTab?.classList.toggle('is-active', tabIsPets);
    materialsTab?.setAttribute('aria-selected', String(tabIsMaterials));
    petsTab?.setAttribute('aria-selected', String(tabIsPets));
    list.setAttribute('aria-labelledby', tabIsPets ? 'shop-tab-pets' : 'shop-tab-materials');
    list.classList.remove('shop-products--furniture');
    list.classList.toggle('shop-products--materials', tabIsMaterials);
    list.classList.toggle('shop-products--pets', tabIsPets);
    if (tabIsMaterials) {
      const section=document.createElement('section');section.className='shop-theme-block';
      const title=document.createElement('h3');title.className='shop-theme-title';title.textContent='요리 재료';
      const grid=document.createElement('div');grid.className='shop-theme-grid';
      MATERIALS.forEach(item=>grid.append(createTile(item)));section.append(title,grid);list.append(section);
      return;
    }
    if (tabIsPets) {
      const feedSection=document.createElement('section');feedSection.className='shop-theme-block shop-feed-block';
      const feedTitle=document.createElement('h3');feedTitle.className='shop-theme-title shop-theme-title--compact';feedTitle.textContent='고양이 사료';
      const feedGrid=document.createElement('div');feedGrid.className='shop-theme-grid';
      FEEDS.forEach(food=>feedGrid.append(createTile(food)));feedSection.append(feedTitle,feedGrid);list.append(feedSection);
    }
    (tabIsPets ? CAT_THEMES : THEMES).forEach(theme => {
      const section = document.createElement('section');
      section.className = 'shop-theme-block';

      const title = document.createElement('h3');
      title.className = `shop-theme-title${tabIsPets ? ' shop-theme-title--compact' : ''}`;
      title.textContent = theme.title || '테마';
      const completed = !tabIsPets && themeComplete(theme.id);
      if (completed) {
        const clear = document.createElement('span');
        clear.className = 'shop-theme-clear';
        clear.textContent = `완벽 구매 · 쾌적도 +${themeBonus(theme.id)}`;
        title.append(clear);
      }

      const grid = document.createElement('div');
      grid.className = 'shop-theme-grid';

      const items = Array.isArray(theme.items) ? theme.items : [];
      if (items.length) {
        items.forEach(raw => {
          const item = CATALOG[raw.key];
          if (item) grid.append(createTile({ ...item, key: raw.key }));
        });
      } else {
        const empty = document.createElement('p');
        empty.className = 'shop-theme-empty';
        empty.textContent = '등록된 상품이 없습니다.';
        grid.append(empty);
      }

      section.append(title, grid);
      list.append(section);
    });
  }

  function setOpen(open) {
    if (open) {
      document.getElementById('kitchen-close')?.click();
      window.dowonSetWarehouseOpen?.(false);
      document.getElementById('resident-close')?.click();
      document.getElementById('order-close')?.click();
    } else {
      closeItemPopup();
    }
    dialog.hidden = backdrop.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.classList.toggle('selected', open);
    if (open) {
      status.textContent = '';
      renderShop();
      updateCoins();
      close.focus();
    } else {
      button.focus();
    }
  }

  materialsTab?.addEventListener('click',()=>{if(activeTab==='materials')return;activeTab='materials';status.textContent='';renderShop();});
  petsTab?.addEventListener('click',()=>{if(activeTab==='pets')return;activeTab='pets';status.textContent='';renderShop();});
  button.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') {
      if (!itemPopup.hidden) closeItemPopup();
      else if (!dialog.hidden) setOpen(false);
    }
  });
  document.addEventListener('dowon:walletchange', updateCoins);
  document.addEventListener('dowon:catfeedchange',()=>{if(!dialog.hidden&&activeTab==='pets')renderShop();});

  renderShop();
  updateCoins();
})();
