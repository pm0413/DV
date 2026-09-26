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

  /* 등급 확률: S 3% / A 10% / B 27% / C 60%. */
  const FISHES = [
    { id:'fish-s-01', grade:'S', name:'낙화리', image:'item/낚시/S등급/낙화리.png', className:'fish-grade-s', attempts:5, durationMin:1250, durationMax:1650, sizeMin:30.3, sizeMax:55, weightMin:800, weightMax:3200 },
    { id:'fish-s-02', grade:'S', name:'도화리', image:'item/낚시/S등급/도화리.png', className:'fish-grade-s', attempts:5, durationMin:1250, durationMax:1650, sizeMin:33.0, sizeMax:60, weightMin:950, weightMax:3800 },
    { id:'fish-s-03', grade:'S', name:'만년화리', image:'item/낚시/S등급/만년화리.png', className:'fish-grade-s', attempts:5, durationMin:1250, durationMax:1650, sizeMin:46.8, sizeMax:85, weightMin:1875, weightMax:7500 },
    { id:'fish-s-04', grade:'S', name:'빙정어', image:'item/낚시/S등급/빙정어.png', className:'fish-grade-s', attempts:5, durationMin:1250, durationMax:1650, sizeMin:38.5, sizeMax:70, weightMin:1300, weightMax:5200 },
    { id:'fish-s-05', grade:'S', name:'성월어', image:'item/낚시/S등급/성월어.png', className:'fish-grade-s', attempts:5, durationMin:1250, durationMax:1650, sizeMin:41.2, sizeMax:75, weightMin:1450, weightMax:5800 },
    { id:'fish-s-06', grade:'S', name:'유광접어', image:'item/낚시/S등급/유광접어.png', className:'fish-grade-s', attempts:5, durationMin:1250, durationMax:1650, sizeMin:27.5, sizeMax:50, weightMin:700, weightMax:2800 },
    { id:'fish-s-07', grade:'S', name:'자미성어', image:'item/낚시/S등급/자미성어.png', className:'fish-grade-s', attempts:5, durationMin:1250, durationMax:1650, sizeMin:44.0, sizeMax:80, weightMin:1625, weightMax:6500 },
    { id:'fish-s-08', grade:'S', name:'청엽어', image:'item/낚시/S등급/청엽어.png', className:'fish-grade-s', attempts:5, durationMin:1250, durationMax:1650, sizeMin:35.8, sizeMax:65, weightMin:1100, weightMax:4400 },
    { id:'fish-s-09', grade:'S', name:'청옥리', image:'item/낚시/S등급/청옥리.png', className:'fish-grade-s', attempts:5, durationMin:1250, durationMax:1650, sizeMin:39.6, sizeMax:72, weightMin:1250, weightMax:5000 },
    { id:'fish-s-10', grade:'S', name:'흑염어', image:'item/낚시/S등급/흑염어.png', className:'fish-grade-s', attempts:5, durationMin:1250, durationMax:1650, sizeMin:49.5, sizeMax:90, weightMin:2125, weightMax:8500 },
    { id:'fish-a-01', grade:'A', name:'가물치', image:'item/낚시/A등급/가물치.png', className:'fish-grade-a', attempts:5, durationMin:1450, durationMax:1850, sizeMin:45.0, sizeMax:100, weightMin:1440, weightMax:8000 },
    { id:'fish-a-02', grade:'A', name:'대두어', image:'item/낚시/A등급/대두어.png', className:'fish-grade-a', attempts:5, durationMin:1450, durationMax:1850, sizeMin:58.5, sizeMax:130, weightMin:6300, weightMax:35000 },
    { id:'fish-a-03', grade:'A', name:'무지개송어', image:'item/낚시/A등급/무지개송어.png', className:'fish-grade-a', attempts:5, durationMin:1450, durationMax:1850, sizeMin:36.0, sizeMax:80, weightMin:1260, weightMax:7000 },
    { id:'fish-a-04', grade:'A', name:'백련어', image:'item/낚시/A등급/백련어.png', className:'fish-grade-a', attempts:5, durationMin:1450, durationMax:1850, sizeMin:54.0, sizeMax:120, weightMin:5400, weightMax:30000 },
    { id:'fish-a-05', grade:'A', name:'뱀장어', image:'item/낚시/A등급/뱀장어.png', className:'fish-grade-a', attempts:5, durationMin:1450, durationMax:1850, sizeMin:45.0, sizeMax:100, weightMin:630, weightMax:3500 },
    { id:'fish-a-06', grade:'A', name:'쏘가리', image:'item/낚시/A등급/쏘가리.png', className:'fish-grade-a', attempts:5, durationMin:1450, durationMax:1850, sizeMin:27.0, sizeMax:60, weightMin:900, weightMax:5000 },
    { id:'fish-a-07', grade:'A', name:'은어', image:'item/낚시/A등급/은어.png', className:'fish-grade-a', attempts:5, durationMin:1450, durationMax:1850, sizeMin:13.5, sizeMax:30, weightMin:54, weightMax:300 },
    { id:'fish-a-08', grade:'A', name:'종어', image:'item/낚시/A등급/종어.png', className:'fish-grade-a', attempts:5, durationMin:1450, durationMax:1850, sizeMin:45.0, sizeMax:100, weightMin:2160, weightMax:12000 },
    { id:'fish-b-01', grade:'B', name:'꺽지', image:'item/낚시/B등급/꺽지.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:12.0, sizeMax:30, weightMin:90, weightMax:600 },
    { id:'fish-b-02', grade:'B', name:'끄리', image:'item/낚시/B등급/끄리.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:20.0, sizeMax:50, weightMin:300, weightMax:2000 },
    { id:'fish-b-03', grade:'B', name:'누치', image:'item/낚시/B등급/누치.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:28.0, sizeMax:70, weightMin:750, weightMax:5000 },
    { id:'fish-b-04', grade:'B', name:'대농갱어', image:'item/낚시/B등급/대농갱어.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:20.0, sizeMax:50, weightMin:300, weightMax:2000 },
    { id:'fish-b-05', grade:'B', name:'동자개', image:'item/낚시/B등급/동자개.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:16.0, sizeMax:40, weightMin:180, weightMax:1200 },
    { id:'fish-b-06', grade:'B', name:'메기', image:'item/낚시/B등급/메기.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:32.0, sizeMax:80, weightMin:1200, weightMax:8000 },
    { id:'fish-b-07', grade:'B', name:'미유기', image:'item/낚시/B등급/미유기.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:24.0, sizeMax:60, weightMin:450, weightMax:3000 },
    { id:'fish-b-08', grade:'B', name:'빙어', image:'item/낚시/B등급/빙어.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:6.0, sizeMax:15, weightMin:8, weightMax:50 },
    { id:'fish-b-09', grade:'B', name:'잉어', image:'item/낚시/B등급/잉어.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:40.0, sizeMax:100, weightMin:2250, weightMax:15000 },
    { id:'fish-b-10', grade:'B', name:'초어', image:'item/낚시/B등급/초어.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:48.0, sizeMax:120, weightMin:3750, weightMax:25000 },
    { id:'fish-b-11', grade:'B', name:'큰입배스', image:'item/낚시/B등급/큰입배스.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:28.0, sizeMax:70, weightMin:825, weightMax:5500 },
    { id:'fish-b-12', grade:'B', name:'향어', image:'item/낚시/B등급/향어.png', className:'fish-grade-b', attempts:5, durationMin:2050, durationMax:2550, sizeMin:36.0, sizeMax:90, weightMin:1800, weightMax:12000 },
    { id:'fish-c-01', grade:'C', name:'갈겨니', image:'item/낚시/C등급/갈겨니.png', className:'fish-grade-c', attempts:5, durationMin:2700, durationMax:3300, sizeMin:7.0, sizeMax:20, weightMin:18, weightMax:150 },
    { id:'fish-c-02', grade:'C', name:'강준치', image:'item/낚시/C등급/강준치.png', className:'fish-grade-c', attempts:5, durationMin:2700, durationMax:3300, sizeMin:28.0, sizeMax:80, weightMin:600, weightMax:5000 },
    { id:'fish-c-03', grade:'C', name:'돌고기', image:'item/낚시/C등급/돌고기.png', className:'fish-grade-c', attempts:5, durationMin:2700, durationMax:3300, sizeMin:7.0, sizeMax:20, weightMin:18, weightMax:150 },
    { id:'fish-c-04', grade:'C', name:'떡붕어', image:'item/낚시/C등급/떡붕어.png', className:'fish-grade-c', attempts:5, durationMin:2700, durationMax:3300, sizeMin:17.5, sizeMax:50, weightMin:300, weightMax:2500 },
    { id:'fish-c-05', grade:'C', name:'모래무지', image:'item/낚시/C등급/모래무지.png', className:'fish-grade-c', attempts:5, durationMin:2700, durationMax:3300, sizeMin:8.8, sizeMax:25, weightMin:24, weightMax:200 },
    { id:'fish-c-06', grade:'C', name:'미꾸라지', image:'item/낚시/C등급/미꾸라지.png', className:'fish-grade-c', attempts:5, durationMin:2700, durationMax:3300, sizeMin:7.0, sizeMax:20, weightMin:12, weightMax:100 },
    { id:'fish-c-07', grade:'C', name:'밀어', image:'item/낚시/C등급/밀어.png', className:'fish-grade-c', attempts:5, durationMin:2700, durationMax:3300, sizeMin:5.2, sizeMax:15, weightMin:10, weightMax:80 },
    { id:'fish-c-08', grade:'C', name:'붕어', image:'item/낚시/C등급/붕어.png', className:'fish-grade-c', attempts:5, durationMin:2700, durationMax:3300, sizeMin:17.5, sizeMax:50, weightMin:300, weightMax:2500 },
    { id:'fish-c-09', grade:'C', name:'블루길', image:'item/낚시/C등급/블루길.png', className:'fish-grade-c', attempts:5, durationMin:2700, durationMax:3300, sizeMin:8.8, sizeMax:25, weightMin:48, weightMax:400 },
    { id:'fish-c-10', grade:'C', name:'참갈겨니', image:'item/낚시/C등급/참갈겨니.png', className:'fish-grade-c', attempts:5, durationMin:2700, durationMax:3300, sizeMin:7.0, sizeMax:20, weightMin:18, weightMax:150 },
    { id:'fish-c-11', grade:'C', name:'피라미', image:'item/낚시/C등급/피라미.png', className:'fish-grade-c', attempts:5, durationMin:2700, durationMax:3300, sizeMin:7.0, sizeMax:20, weightMin:18, weightMax:150 }
  ];

  /* 가장 넓은 등급색 띠 전체 = 완벽, 띠 바로 안팎 = 일반, 나머지 = 실패. */
  const START_SCALE = 1.32;
  const END_SCALE = 0.18;
  const PERFECT_INNER = 0.54;
  const PERFECT_OUTER = 0.70;
  const GOOD_INNER = 0.44;
  const GOOD_OUTER = 0.80;
  /* 전 등급 5회. 성공 판정의 게이지 상승폭과 원 축소 리듬만 등급별로 다르게 둔다. */
  const GRADE_DIFFICULTY = {
    S: { gainMin:20, gainMax:24, pauseChance:0.82, pauseMin:180, pauseMax:420, burstFactor:1.85 },
    A: { gainMin:16, gainMax:24, pauseChance:0.68, pauseMin:170, pauseMax:380, burstFactor:1.65 },
    B: { gainMin:20, gainMax:28, pauseChance:0.52, pauseMin:150, pauseMax:340, burstFactor:1.45 },
    C: { gainMin:24, gainMax:32, pauseChance:0.38, pauseMin:130, pauseMax:300, burstFactor:1.30 }
  };
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
  let roundMotion = null;

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


  const GRADE_CHANCES = [
    { grade: 'S', chance: 3 },
    { grade: 'A', chance: 10 },
    { grade: 'B', chance: 27 },
    { grade: 'C', chance: 60 }
  ];

  function selectFish() {
    const roll = Math.random() * 100;
    let cursor = 0;
    let grade = 'C';
    for (const entry of GRADE_CHANCES) {
      cursor += entry.chance;
      if (roll < cursor) { grade = entry.grade; break; }
    }
    const pool = FISHES.filter(fish => fish.grade === grade);
    return pool[Math.floor(Math.random() * pool.length)];
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
    dialog.classList.remove('fish-grade-s', 'fish-grade-a', 'fish-grade-b', 'fish-grade-c');
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

  /* 물고기 등급별 생선 획득량: A=3, B=2, C=1. S는 별도 소장/재포획 보상. */
  function fishRewardCount(fish) {
    if (!fish) return 1;
    if (fish.grade === 'A') return 3;
    if (fish.grade === 'B') return 2;
    return 1;
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

  function gradeDifficulty() {
    return GRADE_DIFFICULTY[currentFish?.grade] || GRADE_DIFFICULTY.C;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function rollProgressGain(type) {
    const cfg = gradeDifficulty();
    /* 완벽은 같은 등급 범위의 상단 절반, 일반은 하단 절반에서 뽑는다. */
    const middle = (cfg.gainMin + cfg.gainMax) / 2;
    const min = type === 'perfect' ? middle : cfg.gainMin;
    const max = type === 'perfect' ? cfg.gainMax : middle;
    return Math.round(randomBetween(min, max));
  }

  function buildRoundMotion() {
    /* 매 라운드 축소 리듬을 새로 뽑는다.
       완전 정지 대신 wobble 구간에서 잠깐 버티듯 2~4% 정도 팽창했다 원래 크기로 돌아온다.
       wobble이 없는 직선 패턴도 섞어서 다음 움직임을 외우기 어렵게 한다. */
    const patterns = [
      [ ['move',0.34,0.38], ['wobble',0,0], ['move',0.24,0.16], ['move',0.42,0.46] ],
      [ ['move',0.22,0.30], ['move',0.25,0.34], ['wobble',0,0], ['move',0.25,0.15], ['move',0.28,0.21] ],
      [ ['move',0.28,0.27], ['wobble',0,0], ['move',0.18,0.14], ['move',0.20,0.23], ['wobble',0,0], ['move',0.16,0.13], ['move',0.18,0.23] ],
      [ ['move',0.18,0.16], ['move',0.30,0.36], ['wobble',0,0], ['move',0.20,0.15], ['move',0.32,0.33] ],
      [ ['move',0.24,0.30], ['move',0.22,0.29], ['move',0.20,0.19], ['move',0.34,0.22] ]
    ];
    const template = patterns[Math.floor(Math.random() * patterns.length)];
    const moveWeight = template.reduce((sum, seg) => sum + (seg[0] === 'move' ? seg[2] : 0), 0) || 1;
    const segments = template.map(seg => {
      if (seg[0] === 'wobble') {
        return {
          kind:'wobble',
          distance:0,
          duration:randomBetween(450,800),
          amplitude:randomBetween(0.02,0.04)
        };
      }
      return {
        kind:'move',
        distance:seg[1],
        duration:roundDuration * (seg[2] / moveWeight)
      };
    });
    return { segments, totalDuration:segments.reduce((sum, seg) => sum + seg.duration, 0) };
  }

  function startRound() {
    if (!active || attempts <= 0) return;
    clearTimeout(roundTimer);
    locked = false;
    judgement.textContent = '';
    judgement.className = 'fishing-judgement';
    roundDuration = randomRoundDuration();
    roundMotion = buildRoundMotion();
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

    const motion = roundMotion;
    const elapsed = Math.max(0, ts - roundStart);
    let cursor = 0;
    let travelled = 0;
    let wobbleRatio = 0;
    let finished = true;

    for (const seg of motion.segments) {
      const segEnd = cursor + seg.duration;
      if (elapsed >= segEnd) {
        travelled += seg.distance;
        cursor = segEnd;
        continue;
      }

      finished = false;
      const local = Math.max(0, Math.min(1, (elapsed - cursor) / seg.duration));
      if (seg.kind === 'move') {
        /* 각 이동 구간의 시작/끝을 완화해 속도 변화가 순간이동처럼 보이지 않게 한다. */
        const easedLocal = local < 0.5
          ? 2 * local * local
          : 1 - Math.pow(-2 * local + 2, 2) / 2;
        travelled += seg.distance * easedLocal;
      } else if (seg.kind === 'wobble') {
        /* 0 → 살짝 커짐 → 살짝 작아짐 → 0. 한 구간이 끝나면 원래 축소 궤도로 정확히 복귀한다. */
        wobbleRatio = Math.sin(local * Math.PI * 2) * seg.amplitude;
      }
      break;
    }

    const t = Math.max(0, Math.min(1, travelled));
    const baseScale = START_SCALE + (END_SCALE - START_SCALE) * t;
    const scale = Math.max(END_SCALE, baseScale * (1 + wobbleRatio));
    setPulseScale(scale);

    if (finished || elapsed >= motion.totalDuration) {
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
      const previousCaught = Number(collection.counts[currentFish.id]) || 0;
      let rewardItem = '';
      let rewardCount = 0;
      let coinReward = 0;

      if (currentFish.grade === 'S') {
        if (previousCaught === 0) {
          resultText.textContent = `${currentFish.name}을(를) 처음 잡았습니다. 소장 물고기로 등록됩니다.`;
        } else {
          coinReward = 1000;
          window.dowonWallet?.refund?.(coinReward);
          resultText.textContent = `이미 소장 중인 ${currentFish.name}입니다. 동전 1,000원을 받았습니다.`;
        }
      } else {
        rewardCount = currentFish.grade === 'A' ? 3 : currentFish.grade === 'B' ? 2 : 1;
        rewardItem = 'fish';
        inv()?.add?.('fish', rewardCount);
        resultText.textContent = `창고에 생선 ${rewardCount}개로 보관됩니다.`;
      }

      registerCatch(currentFish, currentCatch);
      resultTitle.textContent = '낚시 성공!';
      document.dispatchEvent(new CustomEvent('dowon:activity', {
        detail: {
          type: 'fishing-success', item: rewardItem, count: rewardCount, coins: coinReward,
          fishId: currentFish?.id || '', fishName: currentFish?.name || '', grade: currentFish?.grade || '',
          fishSize: currentCatch?.size || 0, fishWeight: currentCatch?.weight || 0, firstCatch: previousCaught === 0
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

    const gain = (type === 'perfect' || type === 'good') ? rollProgressGain(type) : 0;
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
