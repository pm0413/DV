(() => {
  'use strict';

  const main = document.getElementById('main-area');
  const marker = document.getElementById('fishing-marker');
  const markerStatus = document.getElementById('fishing-marker-status');
  const dialog = document.getElementById('fishing-dialog');
  const backdrop = document.getElementById('fishing-backdrop');
  const closeBtn = document.getElementById('fishing-close');
  const exitBtn = document.getElementById('fishing-exit');
  const againBtn = document.getElementById('fishing-again');
  const baitCount = document.getElementById('fishing-bait-count');
  const attemptsText = document.getElementById('fishing-attempts');
  const progressFill = document.getElementById('fishing-progress-fill');
  const startPanel = document.getElementById('fishing-start');
  const startNote = document.getElementById('fishing-start-note');
  const startYes = document.getElementById('fishing-start-yes');
  const startNo = document.getElementById('fishing-start-no');
  const stage = document.getElementById('fishing-stage');
  const dial = document.getElementById('fishing-dial');
  const pulse = document.getElementById('fishing-pointer');
  const countdown = document.getElementById('fishing-countdown');
  const judgement = document.getElementById('fishing-judgement');
  const result = document.getElementById('fishing-result');
  const resultTitle = document.getElementById('fishing-result-title');
  const resultText = document.getElementById('fishing-result-text');
  const resultFish = document.getElementById('fishing-result-fish');
  const resultGrade = document.getElementById('fishing-result-grade');
  const resultImage = document.getElementById('fishing-result-image');
  const resultName = document.getElementById('fishing-result-name');
  const resultMeasure = document.getElementById('fishing-result-measure');
  if (!main || !marker || !dialog || !backdrop || !dial || !pulse || !startPanel) return;

  const IMAGE_W = 1920;
  const IMAGE_H = 1080;
  const FISH_X = 500;
  const FISH_Y = 930;
  const MOBILE_FISH_X = 690;
  const MOBILE_FISH_Y = 730;
  const COLLECTION_KEY = 'dangcheong-dowon-fishing-collection-v1';

  /* 테스트 단계: A/B/C 모두 동일 확률(각 1/3). */
  const FISHES = [
    {
      id: 'pearl-fish', grade: 'A', name: '진주어',
      image: 'item/낚시/A물고기/진주어.png', className: 'fish-grade-a',
      attempts: 4, durationMin: 1450, durationMax: 1850,
      sizeMin: 28, sizeMax: 55, weightMin: 700, weightMax: 3800
    },
    {
      id: 'freshwater-fish', grade: 'B', name: '민물고기',
      image: 'item/낚시/B물고기/민물고기.png', className: 'fish-grade-b',
      attempts: 5, durationMin: 2050, durationMax: 2550,
      sizeMin: 15, sizeMax: 38, weightMin: 180, weightMax: 1500
    },
    {
      id: 'shrimp', grade: 'C', name: '새우',
      image: 'item/낚시/C물고기/새우.png', className: 'fish-grade-c',
      attempts: 6, durationMin: 2700, durationMax: 3300,
      sizeMin: 4, sizeMax: 12, weightMin: 8, weightMax: 85
    }
  ];

  /* 가장 넓은 등급색 띠 전체 = 완벽, 띠 바로 안팎 = 일반, 나머지 = 실패. */
  const START_SCALE = 1.32;
  const END_SCALE = 0.18;
  const PERFECT_INNER = 0.60;
  const PERFECT_OUTER = 0.84;
  const GOOD_INNER = 0.45;
  const GOOD_OUTER = 0.99;
  const PERFECT_GAIN = 45;
  const GOOD_GAIN = 30;
  const ROUND_PAUSE = 520;
  const START_DELAY_MS = 3000;

  let currentFish = null;
  let currentCatch = null;
  let progress = 0;
  let attempts = 0;
  let maxAttempts = 0;
  let active = false;
  let preparing = false;
  let locked = false;
  let raf = 0;
  let roundStart = 0;
  let roundDuration = 2400;
  let currentScale = START_SCALE;
  let roundTimer = 0;
  let countdownTimer = 0;
  let pausedRoundElapsed = 0;

  const inv = () => window.dowonInventory;
  const count = key => Number(inv()?.get?.(key)) || 0;

  function baseCollection() {
    return {
      counts: Object.fromEntries(FISHES.map(f => [f.id, 0])),
      bestSize: Object.fromEntries(FISHES.map(f => [f.id, 0])),
      bestWeight: Object.fromEntries(FISHES.map(f => [f.id, 0]))
    };
  }

  function loadCollection() {
    const base = baseCollection();
    try {
      const raw = JSON.parse(localStorage.getItem(COLLECTION_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return base;
      for (const fish of FISHES) {
        const caught = Number(raw.counts?.[fish.id]);
        const bestSize = Number(raw.bestSize?.[fish.id]);
        const bestWeight = Number(raw.bestWeight?.[fish.id]);
        if (Number.isSafeInteger(caught) && caught >= 0) base.counts[fish.id] = caught;
        if (Number.isFinite(bestSize) && bestSize >= 0) base.bestSize[fish.id] = bestSize;
        if (Number.isFinite(bestWeight) && bestWeight >= 0) base.bestWeight[fish.id] = bestWeight;
      }
    } catch (_) {}
    return base;
  }

  let collection = loadCollection();
  function saveCollection() {
    try { localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection)); }
    catch (error) { console.warn('물고기 도감 저장 실패', error); }
  }

  function scenePoint(x, y) {
    const w = main.clientWidth;
    const h = main.clientHeight;
    const scale = Math.max(w / IMAGE_W, h / IMAGE_H);
    return {
      x: x * scale + (w - IMAGE_W * scale) / 2,
      y: y * scale + (h - IMAGE_H * scale) / 2
    };
  }

  function placeMarker() {
    const isMobile = window.matchMedia('(max-width:700px)').matches;
    const p = scenePoint(isMobile ? MOBILE_FISH_X : FISH_X, isMobile ? MOBILE_FISH_Y : FISH_Y);
    marker.style.left = `${p.x}px`;
    marker.style.top = `${p.y}px`;
    marker.hidden = p.x < -30 || p.x > main.clientWidth + 30 || p.y < -30 || p.y > main.clientHeight + 60;
    markerStatus.style.left = `${p.x}px`;
    markerStatus.style.top = `${p.y - 50}px`;
  }

  placeMarker();
  window.addEventListener('resize', placeMarker, { passive: true });


  function selectFish() {
    return FISHES[Math.floor(Math.random() * FISHES.length)];
  }

  function randomBetween(min, max, digits = 0) {
    const value = min + Math.random() * (max - min);
    const m = 10 ** digits;
    return Math.round(value * m) / m;
  }

  function rollCatch(fish) {
    return {
      size: randomBetween(fish.sizeMin, fish.sizeMax, 1),
      weight: Math.round(randomBetween(fish.weightMin, fish.weightMax, 0))
    };
  }

  function formatWeight(g) {
    return g >= 1000 ? `${(g / 1000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}kg` : `${Math.round(g)}g`;
  }

  function applyFishTheme(fish) {
    dialog.classList.remove('fish-grade-a', 'fish-grade-b', 'fish-grade-c');
    if (fish) dialog.classList.add(fish.className);
  }

  function updateMeta() {
    baitCount.textContent = String(count('bait'));
    attemptsText.textContent = (active || preparing || maxAttempts > 0) ? String(attempts) : '-';
    attemptsText.setAttribute('aria-label', maxAttempts > 0 ? `남은 횟수 ${attempts}/${maxAttempts}` : '낚시 시작 전');
    progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }

  function consumeBait() {
    return inv()?.take?.('bait', 1) === true;
  }

  function setPulseScale(scale) {
    currentScale = scale;
    pulse.style.transform = `translate(-50%, -50%) scale(${scale})`;
    const center = (PERFECT_INNER + PERFECT_OUTER) / 2;
    const distance = Math.abs(scale - center);
    const proximity = Math.max(0, 1 - distance / 0.75);
    pulse.style.opacity = String(0.48 + proximity * 0.52);
  }

  function randomRoundDuration() {
    if (!currentFish) return 2400;
    return currentFish.durationMin + Math.random() * (currentFish.durationMax - currentFish.durationMin);
  }

  function clearCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = 0;
    if (countdown) countdown.textContent = '';
  }

  function startRound() {
    if (!active || attempts <= 0) return;
    clearTimeout(roundTimer);
    locked = false;
    judgement.textContent = '';
    judgement.className = 'fishing-judgement';
    roundDuration = randomRoundDuration();
    roundStart = performance.now();
    setPulseScale(START_SCALE);
    if (!raf) raf = requestAnimationFrame(animate);
  }

  function animate(ts) {
    if (!active) {
      raf = 0;
      return;
    }
    if (!roundStart) roundStart = ts;
    const t = Math.max(0, Math.min(1, (ts - roundStart) / roundDuration));
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const scale = START_SCALE + (END_SCALE - START_SCALE) * eased;
    setPulseScale(scale);

    if (t >= 1) {
      raf = 0;
      if (!locked) resolveRound('miss');
      return;
    }
    raf = requestAnimationFrame(animate);
  }

  function showStartPrompt(message = '') {
    stopAnimation();
    currentFish = null;
    currentCatch = null;
    applyFishTheme(null);
    progress = 0;
    attempts = 0;
    maxAttempts = 0;
    result.hidden = true;
    resultFish.hidden = true;
    stage.hidden = true;
    startPanel.hidden = false;
    startNote.textContent = message || '미끼는 ‘네’를 누를 때 1개 소모됩니다.';
    startYes.disabled = false;
    updateMeta();
  }

  function beginFishing(onNoBait) {
    if (preparing || active) return;
    if (count('bait') < 1 || !consumeBait()) {
      onNoBait();
      updateMeta();
      return;
    }

    currentFish = selectFish();
    currentCatch = rollCatch(currentFish);
    applyFishTheme(currentFish);
    progress = 0;
    maxAttempts = currentFish.attempts;
    attempts = maxAttempts;
    active = false;
    preparing = true;
    locked = true;
    result.hidden = true;
    resultFish.hidden = true;
    startPanel.hidden = true;
    stage.hidden = false;
    judgement.textContent = '';
    setPulseScale(START_SCALE);
    pulse.style.opacity = '0';
    updateMeta();

    let remaining = Math.ceil(START_DELAY_MS / 1000);
    countdown.textContent = String(remaining);
    countdownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        countdown.textContent = String(remaining);
        return;
      }
      clearCountdown();
      preparing = false;
      active = true;
      locked = false;
      pulse.style.opacity = '';
      startRound();
    }, 1000);
  }

  function beginAfterConfirmation() {
    beginFishing(() => {
      startNote.textContent = '미끼가 없습니다. 상점의 재료 탭에서 구매할 수 있습니다.';
    });
  }

  function beginRetryFishing() {
    beginFishing(() => {
      result.hidden = false;
      resultFish.hidden = true;
      resultTitle.textContent = '미끼가 없습니다';
      resultText.textContent = '상점의 재료 탭에서 미끼를 구매해야 낚시할 수 있습니다.';
      againBtn.disabled = true;
    });
  }

  function open() {
    dialog.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add('fishing-open');
    showStartPrompt();
  }

  function stopAnimation() {
    active = false;
    preparing = false;
    locked = true;
    clearCountdown();
    clearTimeout(roundTimer);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    roundStart = 0;
  }

  function close() {
    stopAnimation();
    dialog.hidden = true;
    backdrop.hidden = true;
    document.body.classList.remove('fishing-open');
  }

  function registerCatch(fish, caught) {
    if (!fish || !caught) return;
    collection.counts[fish.id] = (Number(collection.counts[fish.id]) || 0) + 1;
    collection.bestSize[fish.id] = Math.max(Number(collection.bestSize[fish.id]) || 0, caught.size);
    collection.bestWeight[fish.id] = Math.max(Number(collection.bestWeight[fish.id]) || 0, caught.weight);
    saveCollection();
    window.dowonCollection?.discover?.('fish', fish.id);
  }

  function renderResultFish(success) {
    resultFish.hidden = !success || !currentFish || !currentCatch;
    if (resultFish.hidden) return;
    resultGrade.textContent = `${currentFish.grade}등급`;
    resultImage.src = currentFish.image;
    resultImage.alt = currentFish.name;
    resultName.textContent = currentFish.name;
    resultMeasure.textContent = `${currentCatch.size.toFixed(1)}cm · ${formatWeight(currentCatch.weight)}`;
  }

  function finish(success) {
    stopAnimation();
    stage.hidden = true;
    startPanel.hidden = true;
    result.hidden = false;
    renderResultFish(success);

    if (success) {
      inv()?.add?.('fish', 1);
      registerCatch(currentFish, currentCatch);
      resultTitle.textContent = '낚시 성공!';
      resultText.textContent = '창고에는 생선 1개로 보관됩니다.';
      document.dispatchEvent(new CustomEvent('dowon:activity', {
        detail: {
          type: 'fishing-success', item: 'fish', count: 1,
          fishId: currentFish?.id || '', fishName: currentFish?.name || '', grade: currentFish?.grade || '',
          fishSize: currentCatch?.size || 0, fishWeight: currentCatch?.weight || 0
        }
      }));
    } else {
      resultTitle.textContent = '낚시 실패';
      resultText.textContent = '물고기가 도망갔습니다.';
      document.dispatchEvent(new CustomEvent('dowon:activity', {
        detail: { type: 'fishing-fail', fishId: currentFish?.id || '', grade: currentFish?.grade || '' }
      }));
    }

    againBtn.disabled = false;
    updateMeta();
  }

  function showJudgement(type) {
    const labels = { perfect: '완벽', good: '일반', miss: '실패' };
    judgement.textContent = labels[type] || '';
    judgement.className = `fishing-judgement is-${type}`;
  }

  function resolveRound(type) {
    if (!active || locked || attempts <= 0) return;
    locked = true;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    attempts -= 1;

    let gain = 0;
    if (type === 'perfect') gain = PERFECT_GAIN;
    else if (type === 'good') gain = GOOD_GAIN;

    progress = Math.min(100, progress + gain);
    showJudgement(type);
    updateMeta();

    if (progress >= 100) {
      roundTimer = setTimeout(() => finish(true), 620);
      return;
    }
    if (attempts <= 0) {
      roundTimer = setTimeout(() => finish(false), 620);
      return;
    }

    roundTimer = setTimeout(startRound, ROUND_PAUSE);
  }

  function judge() {
    if (!active || preparing || locked || attempts <= 0) return;
    if (currentScale >= PERFECT_INNER && currentScale <= PERFECT_OUTER) resolveRound('perfect');
    else if (currentScale >= GOOD_INNER && currentScale <= GOOD_OUTER) resolveRound('good');
    else resolveRound('miss');
  }




  marker.addEventListener('click', open);
  startYes?.addEventListener('click', beginAfterConfirmation);
  startNo?.addEventListener('click', close);
  dial.addEventListener('pointerdown', e => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    judge();
  });
  closeBtn?.addEventListener('click', close);
  exitBtn?.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  againBtn?.addEventListener('click', beginRetryFishing);

  document.addEventListener('keydown', e => {
    if (dialog.hidden) return;
    if (e.key === 'Escape') {
      close();
      return;
    }
    if (!active || preparing) return;
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      judge();
    }
  });
})();
