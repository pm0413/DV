/* 플레이어↔MPC(5명), 플레이어↔주문판 NPC(10명): 서로 다른 영구 호감도. */
(() => {
    'use strict';
    const CFG = window.dowonResidentRewards;
    if (!CFG) return;
    const KEY = 'dangcheong-dowon-affinity-v1';
    const MAX = 10;
    const clean = () => ({
        mpc: Array.from({
            length: 5
        }, () => ({
            hearts: 0,
            points: 0
        })),
        npc: Array.from({
            length: 10
        }, () => ({
            hearts: 0,
            points: 0
        })),
        request: null,
        nextOfferAt: Date.now() + CFG.requestOfferIntervalMs,
        nextGiftAt: Date.now() + CFG.giftCheckIntervalMs,
        lastRequestEnd: 0
    });
    let data = clean();
    try {
        const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (saved && typeof saved === 'object') {
            for (const kind of ['mpc', 'npc'])
                if (Array.isArray(saved[kind])) saved[kind].slice(0, kind === 'mpc' ? 5 : 10).forEach((p, i) => {
                    if (p && Number.isInteger(p.hearts) && p.hearts >= 0 && Number.isInteger(p.points) && p.points >= 0) data[kind][i] = {
                        hearts: Math.min(MAX, p.hearts),
                        points: p.points
                    };
                });
            if (saved.request && Number.isInteger(saved.request.resident) && saved.request.resident >= 0 && saved.request.resident < 5 && CFG.requests[saved.request.item]) {
                const r = saved.request;
                if (['offered', 'accepted'].includes(r.status) && Number.isFinite(r.expiresAt)) data.request = {
                    resident: r.resident,
                    item: r.item,
                    qty: Number.isInteger(r.qty)&&r.qty>0?r.qty:1,
                    status: 'accepted',
                    expiresAt: 0
                };
            }
            for (const k of ['nextOfferAt', 'nextGiftAt', 'lastRequestEnd'])
                if (Number.isFinite(saved[k])) data[k] = saved[k];
        }
    } catch (err) {
        console.warn('호감도 저장 정보 읽기 실패', err);
    }

    // 수락 시 정해진 수량은 저장합니다. 기존 저장 데이터의 1개짜리 부탁도 그대로 유지됩니다.
    const requestQty=r=>Number.isInteger(r?.qty)&&r.qty>0?r.qty:1;

    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (err) {
            console.warn('호감도 저장 실패', err);
        }
    }
    const slot = (kind, index) => Number.isInteger(index) && index >= 0 && index < data[kind].length ? data[kind][index] : null;
    const need = h => CFG.heartThresholds[h] ?? Infinity;

    function hearts(kind, i) {
        const p = slot(kind, i);
        if (!p) return '';
        return '♥'.repeat(MAX);
    }

    function badge(kind, i) {
        const p = slot(kind, i);
        if (!p) return null;
        const el = document.createElement('span');
        el.className = 'dowon-affinity-badge';
        const line = document.createElement('span');
        line.className = 'dowon-affinity-hearts';
        for (let h = 0; h < MAX; h++) {
            const heart = document.createElement('span');
            heart.className = 'dowon-affinity-heart ' + (h < p.hearts ? 'is-unlocked' : 'is-locked');
            heart.textContent = '♥';
            line.append(heart);
        }
        const tooltipText = p.hearts >= MAX ? '호감도 MAX · 10/10 하트 해금' : `현재 호감도 ${p.points} / ${need(p.hearts)} · ${p.hearts}/10 하트 해금`;
        const tip = document.createElement('span');
        tip.className = 'dowon-affinity-tooltip';
        tip.textContent = tooltipText;
        el.setAttribute('aria-label', tooltipText);
        el.tabIndex = 0;
        el.append(line, tip);
        return el;
    }

    function refresh(kind, i) {
        document.querySelectorAll(`.dowon-affinity-badge[data-kind="${kind}"][data-index="${i}"]`).forEach(node => node.replaceWith(markedBadge(kind, i)));
    }

    function markedBadge(kind, i) {
        const b = badge(kind, i);
        if (b) {
            b.dataset.kind = kind;
            b.dataset.index = String(i);
        }
        return b;
    }

    function add(kind, i, points) {
        const p = slot(kind, i);
        if (!p || !Number.isFinite(points) || points <= 0) return;
        // 이미 사용된 호감도는 다음 하트로 이월하지 않습니다. 한 번에 큰 보상을 받아도 다음 문턱은 0부터.
        if (p.hearts < MAX) {
            p.points += Math.floor(points);
            if (p.points >= need(p.hearts)) {
                p.hearts++;
                p.points = 0;
            }
        }
        save();
        refresh(kind, i);
    }

    function sceneCharacters() {
        return Array.isArray(window.dowonSceneCharacters) ? window.dowonSceneCharacters : [];
    }

    function living() {
        return sceneCharacters().filter(c => Number.isInteger(c.residentIndex) && !c.napping && !c.isBeingDragged && !(c.meetingUntil && performance.now() < c.meetingUntil) && !c.farmEventBusy);
    }

    function characterById(i) {
        return sceneCharacters().find(c => c.residentIndex === i);
    }

    function bubble(c, content, cssClass = '') {
        if (!c?.element) return;
        let el = c.element.querySelector('.resident-affinity-toast');
        if (!el) {
            el = document.createElement('button');
            el.type = 'button';
            el.className = 'resident-affinity-toast';
            el.addEventListener('pointerdown', event => event.stopPropagation());
            el.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                if (data.request?.resident === c.residentIndex) onMpcClick(c);
            });
            c.element.append(el);
        }
        el.textContent = content;
        el.className = 'resident-affinity-toast ' + cssClass;
        el.hidden = false;
        el.disabled = true;
        el.setAttribute('aria-label', content);
        return el;
    }

    // 수락한 주민 부탁은 재료가 없는 동안에도 쾌적도 패널 바로 아래에서 확인할 수 있습니다.
    // 저장된 부탁을 재사용하므로 새로고침 후에도 같은 주민·아이템이 표시됩니다.
    const reminder = (() => {
        const area = document.getElementById('village-status');
        if (!area) return null;
        const node = document.createElement('div');
        node.id = 'resident-request-reminder';
        node.className = 'resident-request-reminder';
        node.hidden = true;
        node.tabIndex = 0;
        node.setAttribute('role', 'button');
        node.setAttribute('aria-haspopup', 'dialog');
        node.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            const r = data.request;
            const c = r && characterById(r.resident);
            if (r?.status === 'accepted' && c && (Number(window.dowonInventory?.get(r.item)) || 0) >= requestQty(r)) finishRequest(c);
        });
        node.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            node.click();
        });
        const title = document.createElement('strong');
        title.className = 'resident-request-reminder-title';
        const detail = document.createElement('span');
        detail.className = 'resident-request-reminder-detail';
        const progress = document.createElement('span');
        progress.className = 'resident-request-reminder-progress';
        node.append(title, detail, progress);
        area.append(node);
        return {node, title, detail, progress};
    })();

    function refreshReminder() {
        if (!reminder) return;
        const r = data.request;
        const entry = r && CFG.requests[r.item];
        if (!r || r.status !== 'accepted' || !entry) {
            reminder.node.hidden = true;
            reminder.node.dataset.resident = '';
            return;
        }
        const resident = characterById(r.resident);
        let savedResident = null;
        if (!resident) {
            try { savedResident = JSON.parse(localStorage.getItem('dangcheong-dowon-player-residents-v1') || '[]')[r.resident]; } catch (_) {}
        }
        const name = resident?.element?.getAttribute('aria-label') || savedResident?.name || `주민 ${r.resident + 1}`;
        const required = requestQty(r);
        const current = Number(window.dowonInventory?.get(r.item)) || 0;
        const ready = current >= required;
        reminder.title.textContent = `${name}의 부탁`;
        reminder.detail.textContent = `${entry.name} ×${required}`;
        reminder.progress.textContent = ready ? '전달 가능' : `${Math.min(current, required)} / ${required}`;
        reminder.node.setAttribute('aria-label', `${name}의 부탁 · ${entry.name} ${required}개 · ${ready ? '전달 가능' : `${current}/${required}`}`);
        reminder.node.classList.toggle('is-ready', ready);
        reminder.node.tabIndex = ready ? 0 : -1;
        reminder.node.hidden = false;
    }
    function visibleOffer() { refreshReminder(); }
    function clearRequest() {
        const old = data.request;
        data.request = null;
        data.lastRequestEnd = Date.now();
        data.nextOfferAt = data.lastRequestEnd + CFG.requestCooldownMs;
        save();
        refreshReminder();
    }

    function finishRequest(c) {
        const r = data.request,
            entry = r && CFG.requests[r.item];
        if (!r || r.status !== 'accepted' || r.resident !== c.residentIndex || !entry) return false;
        const q = requestQty(r);
        if (!window.dowonInventory?.take(r.item, q)) {
            visibleOffer();
            return true;
        }
        add('mpc', r.resident, entry.points);
        const comfort=window.dowonRequestItems?.catalog?.[r.item]?.kind==='food'?10:5;
        const recipient = r.resident;
        clearRequest();
        const comfortAPI=window.dowonComfort;
        if(comfortAPI?.get&&comfortAPI?.set)comfortAPI.set(comfortAPI.get()+comfort);
        document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'resident-request',resident:recipient,item:r.item,qty:q}}));
        // UI 주기 갱신/다른 일시적 표시와 별개로 감사 반응의 만료 시각을 관리합니다.
        const thanksUntil = Date.now() + 2000;
        c.requestThanksUntil = thanksUntil;
        bubble(c, '👍', 'resident-request-thanks');
        setTimeout(() => {
            if (c.requestThanksUntil !== thanksUntil) return;
            c.requestThanksUntil = 0;
            const current = c.element?.querySelector('.resident-affinity-toast');
            if (current?.classList.contains('resident-request-thanks')) current.remove();
            if (data.request?.resident === recipient) visibleOffer();
        }, 2000);
        c.routePause = 2;
        return true;
    }

    function onMpcClick(c) {
        if (!Number.isInteger(c?.residentIndex)) return;
        add('mpc', c.residentIndex, CFG.mpcClickPoints);
    }

    // 주민이 새 부탁을 제시하는 순간에만 재생합니다. 반복 말풍선 갱신에는 재생하지 않습니다.
    const requestAlertSound = new Audio('bgm/Alert.mp3');
    requestAlertSound.volume = 1; // bgm/click.mp3와 동일한 기본 음량
    function playRequestAlert() {
        requestAlertSound.currentTime = 0;
        requestAlertSound.play().catch(() => {});
    }

    function tryOffer() {
        if (data.request || Date.now() < data.nextOfferAt || Date.now() < data.lastRequestEnd + CFG.requestCooldownMs) return;
        data.nextOfferAt = Date.now() + CFG.requestOfferIntervalMs;
        const people = living(),
            // 상시 주민 부탁 품목은 가공품/음식만 사용합니다.
            available = (window.dowonInventory?.availableKeys() || []).filter(k =>
                CFG.requests[k] && window.dowonRequestItems?.catalog?.[k]?.kind !== 'crop');
        if (people.length && available.length && Math.random() < CFG.requestOfferChance) {
            const c = people[Math.floor(Math.random() * people.length)],
                key = available[Math.floor(Math.random() * available.length)];
            data.request = {
                resident: c.residentIndex,
                item: key,
                qty: window.dowonRequestItems?.drawQty(key) || CFG.requests[key].quantity || 1,
                status: 'accepted',
                expiresAt: 0
            };
            playRequestAlert();
            refreshReminder();
        }
        save();
    }

    function tryGift() {
        if (Date.now() < data.nextGiftAt) return;
        data.nextGiftAt = Date.now() + CFG.giftCheckIntervalMs;
        const people = living().filter(c => slot('mpc', c.residentIndex)?.hearts >= CFG.giftMinimumHearts);
        const available = (window.dowonInventory?.availableKeys() || []).filter(k => CFG.requests[k]);
        if (people.length && available.length && Math.random() < CFG.giftChance) {
            const c = people[Math.floor(Math.random() * people.length)],
                key = available[Math.floor(Math.random() * available.length)];
            // 기존 재고를 보지 않고 정확히 1개를 추가합니다. 개인 인벤토리는 없습니다.
            if (window.dowonInventory.add(key, 1)) {
                bubble(c, `🎁 ${CFG.requests[key].name} +1`, 'resident-request-gift');
                setTimeout(() => {
                    c.element?.querySelector('.resident-affinity-toast')?.remove();
                }, 2400);
            }
        }
        save();
    }

    function tick() {
        tryOffer();
        tryGift();
        visibleOffer();
        refreshReminder();
    }
    const api = {
        onMpcClick,
        addNpcPoints: (i, n) => add('npc', i, n),
        addMpcPoints: (i, n) => {if(!slot('mpc',i)||!Number.isFinite(n)||n<=0)return false;add('mpc',i,n);return true;},
        renderMpcBadge: i => markedBadge('mpc', i),
        renderNpcBadge: i => markedBadge('npc', i),
        debugSet: (kind, i, hearts, points) => {
            const p = slot(kind, i);
            if (!p || !Number.isInteger(hearts) || hearts < 0 || hearts > MAX || !Number.isInteger(points) || points < 0) return false;
            if (hearts === MAX) {
                if (points !== 0) return false;
            } else if (points >= need(hearts)) return false;
            p.hearts = hearts;
            p.points = points;
            save();
            refresh(kind, i);
            return true;
        },
        debugThreshold: hearts => need(hearts),
        resetMpc: i => {
            if (!slot('mpc', i)) return;
            data.mpc[i] = {
                hearts: 0,
                points: 0
            };
            if (data.request?.resident === i) clearRequest();
            save();
            refresh('mpc', i);
        },
        get: (kind, i) => {
            const v = slot(kind, i);
            return v ? {
                ...v
            } : null;
        }
    };
    window.dowonAffinity = api;
    // 구버전의 수락 대기 상태는 상시 부탁 규칙에 맞춰 자동 진행 상태로 마이그레이션합니다.
    if (data.request?.status === 'offered') { data.request.status = 'accepted'; data.request.expiresAt = 0; save(); }
    setInterval(tick, 1000);
    // 주민 목록 카드에는 호감도 UI를 두지 않습니다. 기존 DOM에 남은 하트도 정리합니다.
    document.querySelectorAll('#resident-cards .resident-tile-footer .dowon-affinity-badge, #resident-cards .resident-detail-top .dowon-affinity-badge').forEach(node => node.remove());
    // 주문판이 호감도 모듈보다 먼저 그려졌어도 하트는 주문 제목 옆에만 표시합니다.
    document.querySelectorAll('#order-board .order-heading-title').forEach(heading => {
        if (heading.querySelector('.dowon-affinity-badge')) return;
        const i = Number(heading.dataset.npcIndex);
        if (Number.isInteger(i) && i >= 0 && i < 10) heading.append(markedBadge('npc', i));
    });
    // 화면 로딩 당시 활성화된 부탁은 그대로 이어집니다.
    tick();
    refreshReminder();
})();
