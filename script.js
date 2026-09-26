/* ==================================================
   다크 / 화이트 모드
   ================================================== */

const themeToggle = document.getElementById("theme-toggle");
const THEME_STORAGE_KEY = "dangcheong-dowon-theme-v1";

function applyVillageTheme(isLight) {
    document.body.classList.toggle("light-mode", isLight);
    if (!themeToggle) return;
    const glyph = themeToggle.querySelector('.theme-button-icon');
    if (glyph) glyph.textContent = isLight ? 'light_mode' : 'dark_mode';
    themeToggle.setAttribute("aria-label", isLight ? "다크 모드로 변경" : "화이트 모드로 변경");
}

// Restore the player's last chosen theme before attaching the toggle handler.
// When storage is unavailable, default to the original dark theme.
let savedVillageTheme = null;
try {
    savedVillageTheme = localStorage.getItem(THEME_STORAGE_KEY);
} catch (error) {
    console.warn("테마 설정을 불러오지 못했습니다.", error);
}
applyVillageTheme(savedVillageTheme === "light");

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const isLight = !document.body.classList.contains("light-mode");
        applyVillageTheme(isLight);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, isLight ? "light" : "dark");
        } catch (error) {
            console.warn("테마 설정을 저장하지 못했습니다.", error);
        }
    });
}


/* ==================================================
   왼쪽 패널
   ================================================== */

const leftArea =
    document.getElementById("left-area");


const leftToggle =
    document.getElementById("left-toggle");


leftToggle.addEventListener("click", () => {

    leftArea.classList.toggle("open");


    const isOpen =
        leftArea.classList.contains("open");


    if (isOpen) {

        leftToggle.classList.add("is-open");

        leftToggle.setAttribute(
            "aria-label",
            "왼쪽 패널 접기"
        );

    } else {

        leftToggle.classList.remove("is-open");

        leftToggle.setAttribute(
            "aria-label",
            "왼쪽 패널 펼치기"
        );

    }

});


/* ==================================================
   화면 전체 클릭 효과음
   ================================================== */

const clickSound =
    new Audio("bgm/click.mp3");


document.addEventListener("click", () => {

    clickSound.currentTime = 0;

    clickSound.play().catch(() => {});

});


/* ==================================================
   농사 시스템
   ================================================== */


/*
 * 작물 데이터
 */

const cropData = {

    rice: {
        name: "밀",
        seedIcon: "🌾",
        growingIcon: "새싹.png",
        readyIcon: "밀.png",
        growTime: 15 * 1000
    },

    paddy: {
        name: "벼",
        seedIcon: "🌾",
        growingIcon: "새싹.png",
        readyIcon: "벼.png",
        growTime: 120 * 1000
    },

    cabbage: {
        name: "배추",
        seedIcon: "🥬",
        growingIcon: "새싹.png",
        readyIcon: "배추.png",
        growTime: 150 * 1000
    },

    pepper: {
        name: "고추",
        seedIcon: "🌶️",
        growingIcon: "새싹.png",
        readyIcon: "고추.png",
        growTime: 180 * 1000
    },

    potato: {
        name: "감자",
        seedIcon: "🥔",
        growingIcon: "새싹.png",
        readyIcon: "감자.png",
        growTime: 240 * 1000
    },

    bean: {
        name: "콩",
        seedIcon: "🫘",
        growingIcon: "새싹.png",
        readyIcon: "콩.png",
        growTime: 30 * 1000
    },

    sugarcane: {
        name: "사탕수수",
        seedIcon: "🌱",
        growingIcon: "새싹.png",
        readyIcon: "사탕수수.png",
        growTime: 60 * 1000
    },

    ramie: {name:"모시풀",seedIcon:"🌱",growingIcon:"새싹.png",readyIcon:"모시풀.png",growTime:300 * 1000},
    cotton: {name:"솜",seedIcon:"🌱",growingIcon:"새싹.png",readyIcon:"솜.png",growTime:360 * 1000},
    pumpkin: {name:"호박",seedIcon:"🌱",growingIcon:"새싹.png",readyIcon:"호박.png",growTime:480 * 1000},
    sweetPotato: {name:"고구마",seedIcon:"🌱",growingIcon:"새싹.png",readyIcon:"고구마.png",growTime:600 * 1000},
};


/*
 * 밭 데이터
 *
 * 각 칸은
 *
 * null
 * 또는
 *
 * {
 *     crop: "rice",
 *     plantedAt: 시간,
 *     ready: false
 * }
 *
 * 형태로 관리합니다.
 */

const farms = [

    Array(9).fill(null),

    Array(9).fill(null),

    Array(9).fill(null),

    Array(9).fill(null)

];


/*
 * 밭 저장용 localStorage 키
 *
 * 심어둔 작물의 종류와 심은 시각을 저장합니다.
 * 따라서 페이지를 나갔다 돌아와도
 * plantedAt 기준으로 성장 시간이 계속 흐릅니다.
 */
const FARMS_STORAGE_KEY =
    "dangcheong-dowon-village-farms";


/*
 * 저장된 밭 불러오기
 */
function loadFarms() {

    try {

        const saved =
            localStorage.getItem(
                FARMS_STORAGE_KEY
            );


        if (!saved) {

            return;

        }


        const parsed =
            JSON.parse(saved);


        if (!Array.isArray(parsed)) {

            return;

        }


        parsed.forEach(
            (farm, farmIndex) => {

                if (
                    farmIndex >= farms.length ||
                    !Array.isArray(farm)
                ) {

                    return;

                }


                farm.forEach(
                    (crop, cellIndex) => {

                        if (
                            cellIndex >=
                            farms[farmIndex].length
                        ) {

                            return;

                        }


                        if (!crop) {

                            farms[farmIndex][
                                cellIndex
                            ] = null;

                            return;

                        }


                        const data =
                            cropData[crop.crop];


                        if (!data) {

                            farms[farmIndex][
                                cellIndex
                            ] = null;

                            return;

                        }


                        const plantedAt =
                            Number(
                                crop.plantedAt
                            );


                        if (
                            !Number.isFinite(
                                plantedAt
                            )
                        ) {

                            farms[farmIndex][
                                cellIndex
                            ] = null;

                            return;

                        }


                        farms[farmIndex][
                            cellIndex
                        ] = {

                            crop: crop.crop,

                            plantedAt:
                                plantedAt,

                            ready:
                                Date.now() -
                                plantedAt >=
                                data.growTime

                        };

                    }
                );

            }
        );

    } catch (error) {

        console.warn(
            "저장된 밭 데이터를 불러오지 못했습니다.",
            error
        );

    }

}


/*
 * 현재 밭 저장
 */
/* 디버그: 모든 밭의 심어진 작물을 즉시 수확 가능한 상태로 전환 */
window.dowonGrowAllCrops = function () {
    let count = 0;
    farms.forEach((farm, farmIndex) => {
        farm.forEach((crop, cellIndex) => {
            if (!crop || crop.ready || !cropData[crop.crop]) return;
            crop.ready = true;
            crop.plantedAt = Date.now() - cropData[crop.crop].growTime;
            renderFarmCell(farmIndex, cellIndex);
            count++;
        });
    });
    if (count) saveFarms();
    return count;
};

function saveFarms() {

    try {

        localStorage.setItem(
            FARMS_STORAGE_KEY,
            JSON.stringify(farms)
        );

    } catch (error) {

        console.warn(
            "밭 데이터를 저장하지 못했습니다.",
            error
        );

    }

}


/*
 * 현재 선택된 밭
 */

let selectedFarm =
    null;


/*
 * 현재 선택된 칸
 *
 * 작물을 드래그해서 놓을 기본 위치
 */

let selectedCell =
    null;


/*
 * 창고
 *
 * 작물 종류별 보유량
 */

const warehouse = {

    rice: 0,
    paddy: 0,
    cabbage: 0,
    pepper: 0,
    potato: 0,

    bean: 0,
    sugarcane: 0,
    sweetPotato: 0,
    pumpkin: 0,
    cotton: 0,
    ramie: 0,
    chickenFeed: 0,
    catFeed: 0, // 기존 저장 데이터 전환용 (상점에서는 판매하지 않음)
    catFishFeed: 0,
    catDuckFeed: 0,
    catChickenFeed: 0,
    egg: 0,
    sugar: 0,
    tofu: 0,
    flour: 0,
    saltedEgg: 0,
    ricePowder: 0,
    eggPancake: 0,
    pickledVegetables: 0,
    friedTofu: 0,
    sachet: 0,
    clothDoll: 0,
    cottonFabric: 0,
    yarn: 0,
    hempCloth: 0,
    roastedSweetPotato: 0,
    pumpkinSeed: 0,
    eggBread: 0,
    stickyRiceCake: 0,
    wool: 0,
    brownSugar: 0,
    sheepFeed: 0,
    roastedPotato: 0,
    grilledTofu: 0,
    potatoStarch: 0,
    sweetPotatoStarch: 0,
    soyMilk: 0,
    blackBeanPaste: 0,
    maltSyrup: 0,
    hotteok: 0,
    vegetablePancake: 0,
    potatoPancake: 0,
    pickledPotato: 0,
    tofuStick: 0,
    fermentedTofu: 0,
    tofuSkin: 0,
    steamedRiceCake: 0,
    pumpkinRiceCake: 0,
    glassNoodles: 0,
    driedBlackBeanPaste: 0,
    fish: 0,
    bait: 0,
    chickenMeat: 0,
    pork: 0,
    bitterMelon: 0,
    shepherdsPurse: 0,
    ...Object.fromEntries((window.DOWON_COOKING_RECIPES || []).map(recipe => [recipe.output, 0]))

};


/*
 * DOM
 */

const farmElements =
    document.querySelectorAll(".farm");


const farmCells =
    document.querySelectorAll(".farm-cell");


const cropPalette =
    document.getElementById("crop-palette");


const cropOptions =
    document.querySelectorAll(".crop-option");

/* 작물 해금: 밭에 실제로 심을 때도 동일한 조건을 검사합니다.
   기존 사탕수수와 같이 한번 달성한 쾌적도는 유지됩니다. */
const CROP_UNLOCK_COMFORT = Object.freeze({ sugarcane:50, paddy:100, cabbage:200, pepper:300, potato:400, ramie:500, cotton:700, pumpkin:900, sweetPotato:1200 });
function isCropUnlocked(cropType) {
    const required=CROP_UNLOCK_COMFORT[cropType];
    return required===undefined || !!window.dowonProgression?.hasComfort(required);
}
function isSugarWorkshopBuilt() { return !!window.dowonProgression?.isBuilt('sugar'); }
function isTofuUnlocked() { return !!window.dowonProgression?.isBuilt('tofu'); }
function refreshProgressionUnlocks() {
    for (const [cropType, threshold] of Object.entries(CROP_UNLOCK_COMFORT)) {
        const crop=document.querySelector(`.crop-option[data-crop="${cropType}"]`);
        if (!crop) continue;
        const unlocked=isCropUnlocked(cropType);
        crop.classList.toggle('comfort-locked',!unlocked);
        crop.draggable=unlocked;
        crop.setAttribute('aria-disabled',String(!unlocked));
        crop.dataset.lockLabel=`필요 쾌적도 ${threshold}`;
        crop.title=unlocked
            ? `${cropData[cropType].name} · 성장 시간 ${cropData[cropType].growTime < 60000 ? `${cropData[cropType].growTime/1000}초` : `${cropData[cropType].growTime/60000}분`}`
            : `${cropData[cropType].name} · 쾌적도 ${threshold}에 해금`;
    }
    const workshop=document.getElementById('sugar-workshop');
    if (workshop) {
        workshop.classList.toggle('comfort-locked',!isSugarWorkshopBuilt());
        workshop.setAttribute('aria-disabled',String(!isSugarWorkshopBuilt()));
    }
    if (typeof updateSugarButton==='function') updateSugarButton();
    const tofuWorkshop=document.getElementById('tofu-workshop');
    if (tofuWorkshop) {
        const unlockedTofu=isTofuUnlocked();
        tofuWorkshop.classList.toggle('comfort-locked',!unlockedTofu);
        tofuWorkshop.setAttribute('aria-disabled',String(!unlockedTofu));
    }
    if (typeof updateTofuButton==='function') updateTofuButton();
}
window.addEventListener('dowon-comfort-change',refreshProgressionUnlocks);
window.addEventListener('storage',event=>{
    if(event.key==='dangcheong-dowon-village-comfort-v1') refreshProgressionUnlocks();
});

const warehouseElement =
    document.getElementById("warehouse");


const warehouseGrid =
    document.getElementById("warehouse-grid");


/* ==================================================
   작물 선택창 열기
   ================================================== */

function openCropPalette(farmIndex, cellIndex) {
    selectedFarm = farmIndex;
    selectedCell = cellIndex;
    cropPalette.classList.add("visible");
}


/* ==================================================
   작물 선택창 닫기
   ================================================== */

function closeCropPalette() {

    cropPalette.classList.remove(
        "visible"
    );

}

/* 작물 선택창과 밭 이외의 영역을 클릭하면 선택창을 닫습니다.
   밭을 클릭해 선택창이 열리는 동일한 클릭은 닫힘 처리하지 않습니다. */
document.addEventListener('click', (event) => {
    if (!cropPalette.classList.contains('visible')) return;
    if (event.target.closest('#crop-palette, .farm')) return;
    closeCropPalette();
});


/* ==================================================
   밭 클릭
   ================================================== */

farmElements.forEach(
    (farmElement, farmIndex) => {

        farmElement.addEventListener(
            "click",
            (event) => {

                /*
                 * 클릭된 실제 칸 확인
                 */

                const cell =
                    event.target.closest(
                        ".farm-cell"
                    );


                let clickedCellIndex =
                    0;


                if (cell) {

                    clickedCellIndex =
                        Number(
                            cell.dataset.cell
                        );

                }


                /*
                 * 먼저 성숙한 작물 수확
                 *
                 * 밭 어디를 눌러도
                 * 해당 밭의 완성 작물을
                 * 전부 수확합니다.
                 */

                const harvested =
                    harvestReadyCrops(
                        farmIndex
                    );


                /*
                 * 수확이 있었다면
                 * 작물 선택창은 열지 않습니다.
                 */

                if (harvested > 0) {

                    closeCropPalette();

                    return;

                }


                /*
                 * 빈 칸을 클릭한 경우
                 * 작물 선택창 표시
                 */

                const cellData =
                    farms[farmIndex][
                        clickedCellIndex
                    ];


                if (
                    !cellData ||
                    cellData === null
                ) {

                    openCropPalette(
                        farmIndex,
                        clickedCellIndex
                    );

                }

            }
        );

    }
);


/* ==================================================
   작물 드래그 시작
   ================================================== */

let draggedCropType =
    null;


cropOptions.forEach(
    option => {

        option.addEventListener(
            "dragstart",
            (event) => {

                if (!isCropUnlocked(option.dataset.crop)) {
                    event.preventDefault(); draggedCropType = null; return;
                }
                draggedCropType =
                    option.dataset.crop;


                event.dataTransfer.setData(
                    "text/plain",
                    draggedCropType
                );


                event.dataTransfer.effectAllowed =
                    "copy";

            }
        );


        option.addEventListener(
            "dragend",
            () => {

                closeCropPalette();

                draggedCropType =
                    null;

            }
        );

    }
);


/* ==================================================
   밭 칸 드래그 심기

   작물 아이콘을 밭 위로 끌어가는 동안
   커서가 지나간 모든 빈 칸에 하나씩 심습니다.
   ================================================== */

function plantDraggedCrop(cell, event, rememberSelection = false) {
    const cropType = draggedCropType || event.dataTransfer.getData("text/plain");
    if (!cropData[cropType] || !isCropUnlocked(cropType)) return false;

    const farmElement = cell.closest(".farm");
    const farmIndex = Number(farmElement.dataset.farmId);
    const cellIndex = Number(cell.dataset.cell);
    if (farms[farmIndex][cellIndex]) return false;

    plantCrop(farmIndex, cellIndex, cropType);
    if (rememberSelection) {
        selectedFarm = farmIndex;
        selectedCell = cellIndex;
    }
    return true;
}

farmCells.forEach(cell => {
    cell.addEventListener("dragover", event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        cell.classList.add("drag-over");
        // 같은 칸에서 dragover가 반복되어도 이미 심어진 칸은 다시 심지 않습니다.
        plantDraggedCrop(cell, event, true);
    });

    cell.addEventListener("dragleave", () => {
        cell.classList.remove("drag-over");
    });

    cell.addEventListener("drop", event => {
        event.preventDefault();
        cell.classList.remove("drag-over");
        // dragover가 발생하지 않은 환경에서도 마지막 칸은 한 번 심습니다.
        plantDraggedCrop(cell, event);
    });
});


/* ==================================================
   작물 심기
   ================================================== */

function plantCrop(
    farmIndex,
    cellIndex,
    cropType
) {

    const data =
        cropData[cropType];


    if (!data || !isCropUnlocked(cropType)) {
        return;
    }


    /*
     * 빈 칸이 아니면 종료
     */

    if (
        farms[farmIndex][cellIndex]
    ) {

        return;

    }


    // 드래그로 실제 심기에 성공하면 선택 팝업을 닫습니다.
    closeCropPalette();

    farms[farmIndex][cellIndex] = {

        crop: cropType,

        plantedAt:
            Date.now(),

        ready: false

    };


    /*
     * 심은 즉시 저장
     */
    saveFarms();


    renderFarmCell(
        farmIndex,
        cellIndex
    );
    // 성공한 심기만 이벤트 대상으로 하며, 한 이벤트가 진행 중이면 중복 실행하지 않습니다.
    window.dispatchEvent(new CustomEvent('dowon-crop-planted', {detail:{farmIndex,cellIndex,cropType}}));
    document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'plant',cropType}}));

}


/* ==================================================
   밭 칸 렌더링
   ================================================== */

function updateCropReadyState(crop, data = cropData[crop?.crop]) {
    if (!crop || crop.ready || !data) return false;
    if (Date.now() - crop.plantedAt < data.growTime) return false;
    crop.ready = true;
    return true;
}

function renderFarmCell(
    farmIndex,
    cellIndex
) {

    const farm =
        farmElements[farmIndex];


    const cell =
        farm.querySelector(
            ".farm-cell[data-cell='" +
            cellIndex +
            "']"
        );


    const crop =
        farms[farmIndex][cellIndex];


    /*
     * 비어 있는 칸
     */

    if (!crop) {

        cell.innerHTML = "";

        cell.classList.remove(
            "has-crop",
            "ready"
        );

        return;

    }


    const data =
        cropData[crop.crop];


    /* 성장 완료 여부 확인 */
    updateCropReadyState(crop, data);


    /*
     * 아이콘 결정
     */

    const icon =
        crop.ready
            ? data.readyIcon
            : data.growingIcon;


    cell.innerHTML = `<span class="crop-icon" title="${data.name}"><img src="item/작물/${icon}" alt="${data.name}" width="32" height="32"></span>`;


    cell.classList.add(
        "has-crop"
    );


    if (crop.ready) {

        cell.classList.add(
            "ready"
        );

    } else {

        cell.classList.remove(
            "ready"
        );

    }

}


/* ==================================================
   모든 밭 렌더링
   ================================================== */

function renderAllFarms() {

    farms.forEach(
        (farm, farmIndex) => {

            farm.forEach(
                (_, cellIndex) => {

                    renderFarmCell(
                        farmIndex,
                        cellIndex
                    );

                }
            );

        }
    );

}


/* ==================================================
   성숙한 작물 수확
   ================================================== */

function harvestReadyCrops(
    farmIndex
) {

    let harvestedCount =
        0;


    farms[farmIndex].forEach(
        (crop, cellIndex) => {

            if (
                !crop ||
                !crop.ready
            ) {

                return;

            }


            /*
             * 창고에 추가
             */

            // 업그레이드한 밭은 심기/성장 시간은 그대로, 칸당 수확량만 2배입니다.
            const yieldPerCell=window.dowonProgression?.isFarmUpgraded(farmIndex)?2:1;
            warehouse[crop.crop]+=yieldPerCell;
            document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'harvest',item:crop.crop,count:yieldPerCell}}));


            harvestedCount++;


            /*
             * 밭에서 제거
             */

            farms[farmIndex][cellIndex] =
                null;


            renderFarmCell(
                farmIndex,
                cellIndex
            );

        }
    );


    if (
        harvestedCount > 0
    ) {

        saveWarehouse();
        updateChopperButton();
        updateMillButton();
        saveFarms();

        renderWarehouse();

    }


    return harvestedCount;

}


/* ==================================================
   창고 렌더링
   ================================================== */

let warehouseActiveTab = 'production';
const warehouseTabs = {
    production: document.getElementById('warehouse-tab-production'),
    material: document.getElementById('warehouse-tab-material'),
    food: document.getElementById('warehouse-tab-food'),
    decoration: document.getElementById('warehouse-tab-decoration')
};
function selectWarehouseTab(tab) {
    warehouseActiveTab = Object.prototype.hasOwnProperty.call(warehouseTabs, tab) ? tab : 'production';
    for (const [name, button] of Object.entries(warehouseTabs)) {
        const active = warehouseActiveTab === name;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
    }
    renderWarehouse();
}
for (const [name, button] of Object.entries(warehouseTabs)) {
    button.addEventListener('click', () => selectWarehouseTab(name));
}
function renderWarehouse() {
    if (warehouseActiveTab === 'material') {
        warehouseGrid.replaceChildren();
        const materials = [
            ['fish','생선'],
            ['bait','미끼'],
            ['chickenMeat','닭고기'],
            ['pork','돼지고기'],
            ['bitterMelon','여주'],
            ['shepherdsPurse','냉이']
        ];
        for (const [key,name] of materials) {
            const count = warehouse[key] || 0;
            if (count <= 0) continue;
            const cell = document.createElement('div');
            cell.className = 'warehouse-cell';
            cell.dataset.itemKey = key;
            cell.innerHTML = `<div class="warehouse-item" title="${name} ${count}개"><span class="warehouse-item-icon"><img src="item/재료/${name}.png" alt="${name}" width="32" height="32"></span><span class="warehouse-count">${count}</span></div>`;
            warehouseGrid.appendChild(cell);
        }
        return;
    }
    if (warehouseActiveTab === 'food') {
        warehouseGrid.replaceChildren();
        // Only cooked recipe outputs belong here. Ingredients remain under 생산.
        const shown = new Set();
        for (const recipe of (window.DOWON_COOKING_RECIPES || [])) {
            if (!recipe || !recipe.output || shown.has(recipe.output)) continue;
            shown.add(recipe.output);
            const count = warehouse[recipe.output] || 0;
            if (count < 1) continue;
            const cell = document.createElement('div');
            cell.className = 'warehouse-cell';
            cell.dataset.itemKey = recipe.output;
            const wrapper = document.createElement('div');
            wrapper.className = 'warehouse-item';
            wrapper.title = `${recipe.name} ${count}개`;
            const icon = document.createElement('span');
            icon.className = 'warehouse-item-icon';
            if (recipe.icon) {
                const img = document.createElement('img');
                img.src = recipe.icon;
                img.alt = recipe.name;
                img.width = 32;
                img.height = 32;
                icon.append(img);
            } else {
                icon.textContent = recipe.emoji || '🍲';
                icon.style.fontSize = '25px';
            }
            const qty = document.createElement('span');
            qty.className = 'warehouse-count';
            qty.textContent = String(count);
            wrapper.append(icon, qty);
            cell.append(wrapper);
            warehouseGrid.append(cell);
        }
        return;
    }
    if (warehouseActiveTab === 'decoration') {
        warehouseGrid.replaceChildren();
        const catalogue = window.dowonFurniture || {};
        const furniture = window.dowonFurnitureInventory?.get?.() || {};
        for (const [key, item] of Object.entries(catalogue)) {
            const count = furniture[key] || 0;
            if (!count) continue;
            const cell = document.createElement('div'); cell.className = 'warehouse-cell'; cell.dataset.itemKey=key;
            const wrapper = document.createElement('div'); wrapper.className='warehouse-item';
            wrapper.title = `${item.name} ${count}개 · 쾌적도 +${item.comfort * count}`;
            const picture = document.createElement('img'); picture.src = item.image; picture.alt=item.name; picture.width=32; picture.height=32;
            const icon = document.createElement('span'); icon.className='warehouse-item-icon'; icon.append(picture);
            const qty = document.createElement('span'); qty.className='warehouse-count'; qty.textContent=String(count);
            wrapper.append(icon,qty); cell.append(wrapper); warehouseGrid.append(cell);
        }
        return;
    }

    /*
     * 기존 내용 제거
     */

    warehouseGrid.innerHTML = "";


    /*
     * 현재는 작물 종류가 2개지만
     * 앞으로 작물이 늘어나도
     * 자동으로 칸이 추가되도록 구성
     */

    const storedCrops =
        Object.keys(
            cropData
        );


    storedCrops.forEach(
        cropType => {

            const data =
                cropData[cropType];


            const count =
                warehouse[cropType];


            /*
             * 아직 하나도 수확하지 않은
             * 작물은 창고에 표시하지 않음
             */

            if (count <= 0) {

                return;

            }


            const cell =
                document.createElement(
                    "div"
                );


            cell.className =
                "warehouse-cell"; cell.dataset.itemKey=cropType;


            cell.innerHTML = `

                <div
                    class="warehouse-item"
                    title="${data.name} ${count}개"
                >

                    <span
                        class="warehouse-item-icon"
                    >
                        <img src="item/작물/${data.readyIcon}" alt="${data.name}" width="32" height="32">
                    </span>

                    <span
                        class="warehouse-count"
                    >
                        ${count}
                    </span>

                </div>

            `;


            warehouseGrid.appendChild(
                cell
            );

        }
    );

    if (warehouse.chickenFeed > 0) {
        const cell = document.createElement("div");
        cell.className = "warehouse-cell"; cell.dataset.itemKey="chickenFeed";
        cell.innerHTML = `<div class="warehouse-item" title="닭 사료 ${warehouse.chickenFeed}개"><span class="warehouse-item-icon"><img src="item/가공품/닭 사료.png" alt="닭 사료" width="32" height="32"></span><span class="warehouse-count">${warehouse.chickenFeed}</span></div>`;
        warehouseGrid.appendChild(cell);
    }

    for (const [key,name] of [['catFishFeed','생선'],['catDuckFeed','오리고기'],['catChickenFeed','닭고기']]) {
        if (warehouse[key] <= 0) continue;
        const cell = document.createElement('div');cell.className='warehouse-cell';cell.dataset.itemKey=key;
        const item=document.createElement('div');item.className='warehouse-item';item.title=`${name} 사료 ${warehouse[key]}개`;
        const icon=document.createElement('span');icon.className='warehouse-item-icon';
        const img=document.createElement('img');img.src=`item/장식/고양이 가구/${name} 밥그릇.png`;img.alt=`${name} 사료`;img.width=img.height=32;
        const qty=document.createElement('span');qty.className='warehouse-count';qty.textContent=warehouse[key];
        icon.append(img);item.append(icon,qty);cell.append(item);warehouseGrid.append(cell);
    }

    if (warehouse.egg > 0) {
        const cell = document.createElement("div");
        cell.className = "warehouse-cell"; cell.dataset.itemKey="egg";
        cell.innerHTML = `<div class="warehouse-item" title="달걀 ${warehouse.egg}개"><span class="warehouse-item-icon"><img src="item/가공품/달걀.png" alt="달걀" width="32" height="32"></span><span class="warehouse-count">${warehouse.egg}</span></div>`;
        warehouseGrid.appendChild(cell);
    }

    if (warehouse.sugar > 0) {
        const cell = document.createElement('div');
        cell.className = 'warehouse-cell'; cell.dataset.itemKey='sugar';
        cell.innerHTML = `<div class="warehouse-item" title="설탕 ${warehouse.sugar}개"><span class="warehouse-item-icon"><img src="item/가공품/설탕.png" alt="설탕" width="32" height="32"></span><span class="warehouse-count">${warehouse.sugar}</span></div>`;
        warehouseGrid.appendChild(cell);
    }
    if (warehouse.saltedEgg > 0) {
        const cell = document.createElement('div');
        cell.className = 'warehouse-cell'; cell.dataset.itemKey='saltedEgg';
        cell.innerHTML = `<div class="warehouse-item" title="소금달걀 ${warehouse.saltedEgg}개"><span class="warehouse-item-icon"><img src="item/가공품/소금달걀.png" alt="소금달걀" width="32" height="32"></span><span class="warehouse-count">${warehouse.saltedEgg}</span></div>`;
        warehouseGrid.appendChild(cell);
    }
    if (warehouse.flour > 0) {
        const cell = document.createElement('div');
        cell.className = 'warehouse-cell'; cell.dataset.itemKey='flour';
        cell.innerHTML = `<div class="warehouse-item" title="밀가루 ${warehouse.flour}개"><span class="warehouse-item-icon"><img src="item/가공품/밀가루.png" alt="밀가루" width="32" height="32"></span><span class="warehouse-count">${warehouse.flour}</span></div>`;
        warehouseGrid.appendChild(cell);
    }
    if (warehouse.tofu > 0) {
        const cell = document.createElement('div');
        cell.className = 'warehouse-cell'; cell.dataset.itemKey='tofu';
        cell.innerHTML = `<div class="warehouse-item" title="두부 ${warehouse.tofu}개"><span class="warehouse-item-icon"><img src="item/가공품/두부.png" alt="두부" width="32" height="32"></span><span class="warehouse-count">${warehouse.tofu}</span></div>`;
        warehouseGrid.appendChild(cell);
    }

    // 신규 가공품: 음식 탭이 아닌 생산 탭에 보관합니다.
    for (const [key, name] of [['ricePowder','떡가루'],['eggPancake','계란전'],['pickledVegetables','절임채소'],['friedTofu','유부'],['sheepFeed','양 사료'],['brownSugar','흑설탕'],['wool','양털'],['stickyRiceCake','찹쌀떡'],['eggBread','계란빵'],['pumpkinSeed','호박씨'],['roastedSweetPotato','군고구마'],['hempCloth','삼베'],['yarn','털실'],['cottonFabric','면직물'],['clothDoll','수국'],['sachet','향주머니'],['roastedPotato','구운감자'],['grilledTofu','구운두부'],['potatoStarch','감자전분'],['sweetPotatoStarch','고구마 전분'],['soyMilk','두유'],['blackBeanPaste','검은콩장'],['maltSyrup','엿'],['hotteok','호떡'],['vegetablePancake','채소전'],['potatoPancake','감자전'],['pickledPotato','절임감자'],['tofuStick','푸주'],['fermentedTofu','두부유'],['tofuSkin','두부피'],['steamedRiceCake','증편'],['pumpkinRiceCake','호박떡'],['glassNoodles','당면'],['driedBlackBeanPaste','말린검은콩장']]) {
        const count=warehouse[key];
        if (!count) continue;
        const cell=document.createElement('div');cell.className='warehouse-cell';cell.dataset.itemKey=key;
        cell.innerHTML=`<div class="warehouse-item" title="${name} ${count}개"><span class="warehouse-item-icon"><img src="item/가공품/${name}.png" alt="${name}" width="32" height="32"></span><span class="warehouse-count">${count}</span></div>`;
        warehouseGrid.append(cell);
    }

    /*
     * 빈 칸 9개를 억지로 만들지 않습니다.
     * 실제로 보관 중인 작물 종류만 표시하고,
     * 작물 종류가 늘어나면 그만큼 자동으로 추가됩니다.
     */

}


/* ==================================================
   성장 상태 갱신
   ==================================================

   1초마다 성장 시간을 확인합니다.
   */

setInterval(
    () => {

        let changed =
            false;


        farms.forEach(
            (farm, farmIndex) => {

                farm.forEach(
                    (crop, cellIndex) => {

                        if (
                            !crop ||
                            crop.ready
                        ) {

                            return;

                        }


                        const data =
                            cropData[crop.crop];


                        if (updateCropReadyState(crop, data)) {
                            renderFarmCell(
                                farmIndex,
                                cellIndex
                            );
                            changed = true;
                        }

                    }
                );

            }
        );


        if (changed) {

            /*
             * 성장 완료 상태도 저장합니다.
             * (심은 시각 자체가 저장되어 있으므로
             * 페이지를 나갔다 돌아와도 이어집니다.)
             */
            saveFarms();

        }

    },
    1000
);


/* ==================================================
   밭 드래그 강조
   ================================================== */

const style =
    document.createElement("style");


style.textContent = `

    .farm-cell.drag-over {
        background:
            rgba(255, 255, 255, 0.28) !important;

        transform:
            scale(0.96);
    }

`;


document.head.appendChild(
    style
);


/* ==================================================
   캐릭터
   ================================================== */

const mainArea =
    document.getElementById("main-area");


const characters = [];
// 주민 설정에서 등록된 주민만 캐릭터로 추가합니다.
window.dowonSceneCharacters = characters;

/* ==================================================
   캐릭터 이동
   ================================================== */

// 배경 원본 1920×1080의 장소 좌표. CSS background-size:cover / position:center 기준으로 변환합니다.
const SCENE_IMAGE_WIDTH = 1920;
const SCENE_IMAGE_HEIGHT = 1080;
const SCENE_ROUTES = [
 {name:'지붕 1',x:682,y:330,links:[3],jump:[3]},
 {name:'지붕 2',x:1288,y:268,links:[4],jump:[4]},
 {name:'별채',x:784,y:568,links:[1,5],jump:[1]},
 {name:'본채',x:1336,y:574,links:[2,5],jump:[2]},
 {name:'계단',x:1128,y:574,links:[3,4,10]},
 {name:'꽃밭',x:648,y:648,links:[8]},
 {name:'장독대',x:500,y:744,links:[8,9]},
 {name:'연못 1',x:802,y:740,links:[6,7,10]},
 {name:'연못 2',x:474,y:854,links:[7]},
 {name:'마당 1',x:872,y:728,links:[5,8,11]},
 {name:'마당 2',x:1474,y:784,links:[10,12,13]},
 {name:'밭',x:1400,y:900,links:[11]},
 {name:'풀숲',x:1640,y:678,links:[11]}
];
window.dowonPlaceNames=SCENE_ROUTES.map(p=>p.name);
const routeClock={previous:performance.now()};
const SCENE_POSITION_KEY='dangcheong-dowon-village-resident-position-v1';
// 화면 픽셀 대신 화면 크기에 대한 비율로 저장하므로 창 크기가 달라도 위치가 유지됩니다.
let savedScenePositions={};
try{
 const raw=JSON.parse(localStorage.getItem(SCENE_POSITION_KEY)||'{}');
 if(raw&&typeof raw==='object'&&!Array.isArray(raw))savedScenePositions=raw;
}catch(_){}
function scenePositionSnapshot(){
 const width=Math.max(1,mainArea.clientWidth),height=Math.max(1,mainArea.clientHeight);
 const result={};
 for(const c of characters){
  if(!c.routeNode||!Number.isFinite(c.routeX)||!Number.isFinite(c.routeY)||c.isBeingDragged)continue;
  const arr=c.arrival;
  result[String(c.residentIndex)]={
   x:c.routeX/width,y:c.routeY/height,
   node:c.routeNode,target:c.routeTarget||0,
   arrival:arr&&Number.isFinite(arr.x)&&Number.isFinite(arr.y)?{x:arr.x/width,y:arr.y/height}:null,
   previous:c.routePrevious||0,pause:Math.max(0,c.routePause||0),
   places:c.placesSinceFavorite||0,direction:c.direction||1,
   favoriteJourney:Array.isArray(c.favoriteJourney)?c.favoriteJourney.slice(0,20):[],
   meetJourney:Array.isArray(c.meetJourney)?c.meetJourney.slice(0,20):[],
   meetTarget:c.meetTarget||0,
   napEnd:c.napping?Date.now()+Math.max(0,(c.napUntil-performance.now())):0
  };
 }
 return result;
}
function saveScenePositions(){
 const snapshot=scenePositionSnapshot();
 if(!Object.keys(snapshot).length)return;
 savedScenePositions={...savedScenePositions,...snapshot};
 try{localStorage.setItem(SCENE_POSITION_KEY,JSON.stringify(savedScenePositions));}catch(error){console.warn('주민 위치 저장 실패',error);}
}
function restoreScenePosition(c){
 const p=savedScenePositions[String(c.residentIndex)];
 if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<-.5||p.x>1.5||p.y<-.5||p.y>1.5)return false;
 if(!Number.isInteger(p.node)||p.node<1||p.node>SCENE_ROUTES.length)return false;
 const width=Math.max(1,mainArea.clientWidth),height=Math.max(1,mainArea.clientHeight);
 c.routeNode=p.node;
 c.routeX=p.x*width;c.routeY=p.y*height;
 c.routeTarget=Number.isInteger(p.target)&&SCENE_ROUTES[p.node-1].links.includes(p.target)?p.target:0;
 c.arrival=c.routeTarget&&p.arrival&&Number.isFinite(p.arrival.x)&&Number.isFinite(p.arrival.y)
   ?{x:p.arrival.x*width,y:p.arrival.y*height}:null;
 c.routePrevious=Number.isInteger(p.previous)?p.previous:0;
 c.routePause=Number.isFinite(p.pause)?Math.max(0,Math.min(60,p.pause)):0;
 c.placesSinceFavorite=Number.isFinite(p.places)?Math.max(0,p.places):0;
 c.direction=p.direction===-1?-1:1;
 c.favoriteJourney=Array.isArray(p.favoriteJourney)?p.favoriteJourney.filter(n=>Number.isInteger(n)&&n>=1&&n<=SCENE_ROUTES.length):[];
 c.meetJourney=Array.isArray(p.meetJourney)?p.meetJourney.filter(n=>Number.isInteger(n)&&n>=1&&n<=SCENE_ROUTES.length):[];
 c.meetTarget=Number.isInteger(p.meetTarget)&&p.meetTarget>=1&&p.meetTarget<=SCENE_ROUTES.length?p.meetTarget:0;
 if(c.routeTarget&&SCENE_ROUTES[c.routeNode-1].jump?.includes(c.routeTarget))c.routeJump={progress:0};
 if(Number.isFinite(p.napEnd)&&p.napEnd>Date.now()){
  c.napping=true;c.napUntil=performance.now()+Math.min(60000,p.napEnd-Date.now());
  c.routeTarget=0;c.arrival=null;c.routeJump=null;c.routePause=Math.max(c.routePause,1);
  c.element.classList.add('resident-napping');
  const nap=document.createElement('span');nap.className='resident-nap-bubble';nap.textContent='💤';c.element.append(nap);
 }
 c.element.style.left=`${c.routeX-c.element.offsetWidth/2}px`;
 c.element.style.top=`${c.routeY-c.element.offsetHeight}px`;
 return true;
}
window.dowonSaveScenePositions=saveScenePositions;
window.setInterval(saveScenePositions,2000);
window.addEventListener('pagehide',()=>{if(!window.dowonFullResetInProgress)saveScenePositions();});
window.addEventListener('beforeunload',()=>{if(!window.dowonFullResetInProgress)saveScenePositions();});

function routePoint(number){
 const p=SCENE_ROUTES[number-1];
 const width=mainArea.clientWidth,height=mainArea.clientHeight;
 const scale=Math.max(width/SCENE_IMAGE_WIDTH,height/SCENE_IMAGE_HEIGHT);
 return {x:p.x*scale+(width-SCENE_IMAGE_WIDTH*scale)/2,
         y:p.y*scale+(height-SCENE_IMAGE_HEIGHT*scale)/2};
}
function arrivalPoint(number){
 const p=routePoint(number);
 return {x:p.x+(Math.random()*28-14),y:p.y+(Math.random()*28-14)};
}
function shortestRoute(from,to){
 if(from===to)return [];
 const queue=[[from]],seen=new Set([from]);
 while(queue.length){const path=queue.shift(),node=path[path.length-1];
  for(const next of SCENE_ROUTES[node-1].links){if(seen.has(next))continue;const candidate=path.concat(next);if(next===to)return candidate.slice(1);seen.add(next);queue.push(candidate);}
 }return [];
}
// 주민 대사: 자유 이동 중 일반 대사, 장소에 멈춰 있을 때 장소별 전용 대사.
// 대사 구분자는 |이며, 텍스트만 출력해 HTML이 실행되지 않게 합니다.
function residentDialogueOptions(source){
 return String(source||'').split('|').map(line=>line.trim()).filter(Boolean);
}
function showResidentDialogue(character,source,now){
 const options=residentDialogueOptions(source);
 if(!options.length)return false;
 const element=character.element;
 if(character.napping && now < (character.napUntil||0))return false;
 let bubble=element.querySelector('.resident-dialogue-bubble');
 if(!bubble){bubble=document.createElement('span');bubble.className='resident-dialogue-bubble';bubble.setAttribute('role','status');element.appendChild(bubble);}
 bubble.textContent=options[Math.floor(Math.random()*options.length)];
 bubble.hidden=false;
 character.dialogueUntil=now+Math.min(5200,Math.max(2800,bubble.textContent.length*130));
 return true;
}
// From the village clock: 06:00–17:59 is day, 18:00 onwards is night.
// Existing day-only saved dialogue remains available if a night field is empty.
function residentTimedLines(dayLines,nightLines){
 const minute=window.dowonClock?.get?.()?.minute;
 const night=Number.isFinite(minute)&&minute>=18*60;
 return night && residentDialogueOptions(nightLines).length ? nightLines : dayLines;
}
window.dowonShowRainDialogue = function(){
 const now=performance.now();
 // 현재 위치에 맞는 비 오는 날 대사만 선택합니다. 다른 장소의 대사는 섞지 않습니다.
 const rainySource=c=>{
  const moving=Boolean(c.routeTarget)&&c.routePause<=0;
  const key=String(c.routeNode);
  return moving
   ?residentTimedLines(c.rainLines,c.rainNightLines)
   :residentTimedLines(c.rainPlaceLines?.[key],c.rainPlaceNightLines?.[key]);
 };
 const eligible=characters.filter(c=>c.element?.isConnected && residentDialogueOptions(rainySource(c)).length && !c.napping && !c.farmEventBusy && !c.isBeingDragged && !(c.meetingUntil>now) && !(c.dialogueUntil>now));
 if(!eligible.length)return false;
 const c=eligible[Math.floor(Math.random()*eligible.length)];
 if(!showResidentDialogue(c,rainySource(c),now))return false;
 c.meetingUntil=Math.max(c.meetingUntil||0,c.dialogueUntil);
 c.nextDialogueAt=Math.max(c.nextDialogueAt||0,c.dialogueUntil+1500);
 return true;
};
function updateResidentDialogue(character,now){
 const bubble=character.element.querySelector('.resident-dialogue-bubble');
 if(bubble&&!bubble.hidden&&now>=character.dialogueUntil)bubble.hidden=true;
 if(character.napping||character.meetingUntil>now||character.farmEventBusy)return;
 if(now<(character.nextDialogueAt||0))return;
 // 비가 내릴 때는 맑은 날의 일반/장소 대사를 재생하지 않습니다.
 // 비 오는 날 대사는 날씨 시스템이 일정 간격으로 한 주민씩 재생합니다.
 if(window.dowonWeather?.get()?.weather==='rain'){
  character.nextDialogueAt=now+4000;
  return;
 }
 const moving=Boolean(character.routeTarget)&&character.routePause<=0;
 const key=String(character.routeNode);
 const source=moving
  ?residentTimedLines(character.generalLines,character.generalNightLines)
  :residentTimedLines(character.placeLines?.[key],character.placeNightLines?.[key]);
 const hasLines=showResidentDialogue(character,source,now);
 // 대사 없는 장소에서도 프레임마다 재시도하지 않습니다.
 character.nextDialogueAt=now+(hasLines?8000+Math.random()*7000:4000);
}
/* 아침 인사: 최초 06:00 또는 실제 다음 날 아침 한 번만 표시합니다.
   같은 날 새로고침 시에는 재생하지 않으며, 초기화 시 기록도 같이 삭제됩니다. */
const MORNING_GREETING_KEY='dangcheong-dowon-village-morning-greeting-v2';
let lastMorningDialogueDay=null;
let greetedDay=0;
try{greetedDay=Number(localStorage.getItem(MORNING_GREETING_KEY))||0;}catch(_){}
function playMorningDialogue(){
 const participants=characters.filter(character=>residentDialogueOptions(character.morningLines).length);
 if(!participants.length)return false;
 const now=performance.now();
 let played=false;
 participants.forEach(character=>{
   if(showResidentDialogue(character,character.morningLines,now)){
     played=true;
     character.meetingUntil=Math.max(character.meetingUntil||0,character.dialogueUntil);
     character.nextDialogueAt=Math.max(character.nextDialogueAt||0,character.dialogueUntil+1000);
   }
 });
 return played;
}
document.addEventListener('dowon:timechange',event=>{
 const day=Number(event.detail?.day),minute=Number(event.detail?.minute);
 if(!Number.isSafeInteger(day)||day<1||!Number.isFinite(minute))return;
 const newDay=lastMorningDialogueDay!==null&&day!==lastMorningDialogueDay;
 lastMorningDialogueDay=day;
 // 로딩 시 06:00이면 바로 말하되, 이미 같은 날 표시했다면 다시 말하지 않습니다.
 if(minute!==360||greetedDay===day)return;
 // 새 날에는 화면이 밝아지는 전환 후에 말합니다.
 const delay=newDay?1700:0;
 // 예약 즉시 기록하여 06:00에서 새로고침해도 중복으로 뜨지 않도록 합니다.
 if(!characters.some(c=>residentDialogueOptions(c.morningLines).length))return;
 greetedDay=day;
 try{localStorage.setItem(MORNING_GREETING_KEY,String(day));}catch(_){}
 window.setTimeout(playMorningDialogue,delay);
});
// 같은 장소에서 마주치거나 서로 만나고 싶어질 때, 연결된 길을 따라 합류합니다.
/* 주민 만남: 관계에 따라 빈도, 머무는 시간, 중앙 말풍선을 다르게 사용합니다. */
const encounterClock={next:performance.now()+12000};
const PAIR_COOLDOWNS=new Map();
const pairKey=(a,b)=>[a.residentIndex,b.residentIndex].sort((x,y)=>x-y).join(':');
const pairState=(a,b)=>window.nakwonResidentPairs?.get(a.residentIndex,b.residentIndex)||{score:0,love:false,relation:'초면'};
const EVENT_CHOICES={초면:['greet','awkward'],'아는 사이':['greet','awkward','rest'],친구:['greet','rest','walk'],'친한 친구':['greet','rest','walk','follow'],연인:['greet','rest','walk']};
const EVENT_EMOJIS={greet:'👋',awkward:'😅',rest:'🙂',follow:'🤭'};
const WALK_EMOJIS=['🐱','🌱','🐟','🎶'];
function pickEventEmoji(type){return type==='walk'?WALK_EMOJIS[Math.floor(Math.random()*WALK_EMOJIS.length)]:(EVENT_EMOJIS[type]||'💬');}
function eventLine(person,other,event,role){const data=person.eventLines?.[event]||{};const override=data.overrides?.[String(other.residentIndex)]?.[role];return typeof override==='string'&&override.trim()?override:data[role]||'';}
function eventDialogue(a,b,type,now,duration){
 const opening=eventLine(a,b,type,'opening');
 const reply=eventLine(b,a,type,'reply');
 if(residentDialogueOptions(opening).length){showResidentDialogue(a,opening,now);a.dialogueUntil=now+duration;}
 if(residentDialogueOptions(opening).length&&residentDialogueOptions(reply).length){showResidentDialogue(b,reply,now);b.dialogueUntil=now+duration;}
}
const meetingBubble=document.createElement('span');
meetingBubble.className='resident-meeting-bubble';meetingBubble.hidden=true;
meetingBubble.setAttribute('role','status');mainArea.append(meetingBubble);
let meetingBubbleUntil=0;
let activeEncounter=null;
function finishEncounter(now=performance.now(),cancelled=false){
 const pair=activeEncounter;
 if(!pair)return false;
 activeEncounter=null;
 if(!cancelled){
  window.nakwonResidentPairs?.encounter(pair.a.residentIndex,pair.b.residentIndex);
  document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'resident-pair-event',a:pair.a.residentIndex,b:pair.b.residentIndex,action:pair.type}}));
  if(pair.type==='walk'||pair.type==='rest'||pair.type==='follow')document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'resident-pair-'+pair.type}}));
  if(pair.type==='walk'&&window.nakwonResidentPairs?.get(pair.a.residentIndex,pair.b.residentIndex)?.love){
   document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'resident-pair-lovewalk'}}));
   if(pair.waited)document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'resident-pair-waitwalk'}}));
  }
 }
 meetingBubble.hidden=true;
 meetingBubbleUntil=0;
 meetingBubble.replaceChildren();
 meetingBubble.dataset.eventEmoji='';
 meetingBubble.classList.remove('meeting-bubble-friend','meeting-bubble-love','meeting-bubble-event-emoji');
 for(const person of [pair.a,pair.b]){
  setResidentActionEmoji(person,'');
  person.meetingUntil=0;
  person.meetingPartner=null;
  person.routePause=0;
  person.meetCooldown=Math.max(person.meetCooldown||0,now+4000);
  person.element?.classList.remove('resident-meeting-left','resident-meeting-right');
  const speech=person.element?.querySelector('.resident-dialogue-bubble');
  if(speech)speech.hidden=true;
  person.dialogueUntil=0;
  person.nextDialogueAt=Math.max(person.nextDialogueAt||0,now+1000);
 }
 return true;
}
function interruptEncounterFor(person,now=performance.now()){
 if(activeEncounter&&(activeEncounter.a===person||activeEncounter.b===person))
  return finishEncounter(now,true);
 return false;
}
function relationOf(a,b){return pairState(a,b).relation;}
function endMeetingBubble(now){if(!meetingBubble.hidden&&now>=meetingBubbleUntil)meetingBubble.hidden=true;}
function setResidentActionEmoji(person,text=''){
 if(!person?.element)return;
 let bubble=person.element.querySelector('.resident-action-emoji');
 if(!text){if(bubble)bubble.hidden=true;return;}
 if(!bubble){bubble=document.createElement('span');bubble.className='resident-action-emoji';bubble.setAttribute('aria-hidden','true');person.element.append(bubble);}
 bubble.textContent=text;bubble.hidden=false;
}
function updateEncounterEmoji(ev,now){
 if(!ev)return;
 // 이벤트 대사가 실제로 떠 있는 동안에는 대사만 보여 주고, 행동이 시작되면 이모지를 표시합니다.
 if(now<ev.moveFrom){meetingBubble.hidden=true;return;}
 const point={x:(ev.a.routeX+ev.b.routeX)/2,y:Math.min(ev.a.routeY,ev.b.routeY)};
 if(meetingBubble.dataset.eventEmoji!==ev.emoji){meetingBubble.replaceChildren();meetingBubble.textContent=ev.emoji;meetingBubble.dataset.eventEmoji=ev.emoji;}
 meetingBubble.classList.add('meeting-bubble-event-emoji');
 meetingBubble.style.left=`${Math.max(10,Math.min(mainArea.clientWidth-10,point.x))}px`;
 meetingBubble.style.top=`${Math.max(25,point.y-125)}px`;
 meetingBubble.hidden=false;meetingBubbleUntil=ev.until;
}
function startEncounter(a,b,now,manualPoint=null,forcedType=null){
 if(activeEncounter&&now>=activeEncounter.until)finishEncounter(now);
 if(activeEncounter)return false;
 if(a===b||a.napping||b.napping||a.isBeingDragged||b.isBeingDragged||a.farmEventBusy||b.farmEventBusy||a.meetingUntil>now||b.meetingUntil>now||a.routeTarget||b.routeTarget||a.dialogueUntil>now||b.dialogueUntil>now)return false;
 if(!manualPoint&&(!a.routeNode||a.routeNode!==b.routeNode||a.routeJump||b.routeJump))return false;
 const key=pairKey(a,b);
 if(now<(PAIR_COOLDOWNS.get(key)||0))return false;
 PAIR_COOLDOWNS.set(key,now+120000);
 // 가까워진 순간에만 30% 판정; 연인이 찾아간 경우는 약속된 동행으로 취급.
 if(!forcedType&&Math.random()>=.3){a.meetCooldown=b.meetCooldown=now+30000;return false;}
 const relation=relationOf(a,b);
 const types=EVENT_CHOICES[relation]||EVENT_CHOICES.초면;
 const type=forcedType||types[Math.floor(Math.random()*types.length)];
 const point=manualPoint||{x:(a.routeX+b.routeX)/2,y:(a.routeY+b.routeY)/2};
 const walk=type==='walk'||type==='follow';
 const dialogueDuration=eventLine(a,b,type,'opening').trim()?3800:0;
 const actionDuration=walk?4000+Math.random()*2000:3000;
 const duration=dialogueDuration+actionDuration;
 for(const person of [a,b]){person.routeTarget=0;person.routeJump=null;person.arrival=null;person.meetTarget=null;person.meetJourney=[];person.favoriteJourney=[];}
 const gap=Math.min(32,Math.max(18,mainArea.clientWidth*.03));
 a.routeX=point.x-gap;b.routeX=point.x+gap;a.routeY=b.routeY=point.y;
 const sameDirection=type==='rest'||walk;
 a.direction=1;b.direction=sameDirection?1:-1;
 activeEncounter={a,b,type,emoji:pickEventEmoji(type),until:now+duration,moveFrom:now+dialogueDuration,lastTick:now,walkSpeed:Math.max(14,Math.min(35,mainArea.clientWidth*.038)),startedAt:now};
 a.meetingPartner=b;b.meetingPartner=a;
 a.meetingUntil=b.meetingUntil=now+duration;
 a.routePause=b.routePause=duration/1000;
 a.meetCooldown=b.meetCooldown=now+120000;
 for(const person of [a,b]){
  person.element.querySelector('.resident-dialogue-bubble')?.setAttribute('hidden','');
  person.dialogueUntil=now+duration;person.nextDialogueAt=now+duration+1000;
  person.element.classList.remove('resident-meeting-left','resident-meeting-right');
 }
 meetingBubble.hidden=true;meetingBubble.dataset.eventEmoji='';
 eventDialogue(a,b,type,now,dialogueDuration||duration);
 if(!dialogueDuration)updateEncounterEmoji(activeEncounter,now);
 return true;
}
/* 작물 심기: 성공한 심기의 30% 확률로 주민 1명이 밭으로 달려옵니다.
   먼저 하는 말과 상대별 원격 답변은 주민 설정의 '밭 반응'에서 관리합니다. */
let activeFarmEvent=null;
const FARM_EVENT_TIMEOUT=22000;
window.addEventListener('dowon-crop-planted',()=>{
 if(activeFarmEvent||Math.random()>=.30)return;
 const candidates=characters.filter(c=>c.routeNode&&!c.napping&&!c.isBeingDragged&&!c.farmEventBusy&&residentDialogueOptions(c.farmOpening).length);
 if(!candidates.length)return;
 const speaker=candidates[Math.floor(Math.random()*candidates.length)];
 const responders=characters.filter(c=>c!==speaker&&!c.napping&&!c.isBeingDragged&&String(c.farmRepliesByResident?.[String(speaker.residentIndex)]||'').trim());
 const responder=responders.length?responders[Math.floor(Math.random()*responders.length)]:null;
 const now=performance.now();
 interruptEncounterFor(speaker,now);
 if(responder)interruptEncounterFor(responder,now);
 const startingNode=speaker.routeNode;
 const path=shortestRoute(startingNode,12);
 activeFarmEvent={speaker,responder,phase:'moving',deadline:now+FARM_EVENT_TIMEOUT};
 speaker.farmEventBusy=true;
 speaker.meetingUntil=0;speaker.meetTarget=null;speaker.meetJourney=[];
 speaker.favoriteJourney=[];speaker.routePause=0;
 speaker.routeTarget=path.shift()||0;speaker.farmJourney=path;
 speaker.arrival=speaker.routeTarget?arrivalPoint(speaker.routeTarget):null;
 speaker.routeJump=null;
 speaker.nextDialogueAt=now+FARM_EVENT_TIMEOUT;
 showResidentDialogue(speaker,speaker.farmOpening,now);
 document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'resident-farm',resident:speaker.residentIndex}}));
 if(!speaker.routeTarget)finishFarmArrival(now);
});
function endFarmEvent(now){
 const event=activeFarmEvent;if(!event)return;
 const c=event.speaker;c.farmEventBusy=false;c.farmJourney=[];
 c.nextDialogueAt=now+4500;
 activeFarmEvent=null;
}
function finishFarmArrival(now){
 const event=activeFarmEvent;if(!event||event.phase!=='moving')return;
 event.phase='talking';event.deadline=now+6000;
 const {speaker,responder}=event;
 speaker.routePause=6;speaker.farmJourney=[];
 const line=residentDialogueOptions(speaker.farmArrival);
 if(line.length)showResidentDialogue(speaker,speaker.farmArrival,now);
 if(responder){
  const reply=responder.farmRepliesByResident?.[String(speaker.residentIndex)];
  if(reply){showResidentDialogue(responder,reply,now+400);responder.nextDialogueAt=now+6500;}
 }
}
let lastNpcHour=null;
document.addEventListener('dowon:timechange',event=>{
 const day=Number(event.detail?.day),minute=Number(event.detail?.minute);
 if(!Number.isFinite(day)||!Number.isFinite(minute))return;
 const hourKey=`${day}:${Math.floor(minute/60)}`;
 if(lastNpcHour===null){lastNpcHour=hourKey;return;}
 if(lastNpcHour===hourKey)return;
 lastNpcHour=hourKey;
 const now=performance.now();
 for(const c of characters){
  if(c.napping){c.napping=false;c.napUntil=0;c.element.classList.remove('resident-napping');
   c.element.querySelector('.resident-nap-bubble')?.remove();c.napClickBubble=null;c.routePause=0;}
  if(c.isBeingDragged||c.farmEventBusy||c.meetingUntil>now||Math.random()>=.10)continue;
  c.napping=true;c.napUntil=now+60000;c.routeTarget=0;c.routeJump=null;
  c.favoriteJourney=[];c.meetJourney=[];c.meetTarget=null;c.routePause=60;
  c.element.classList.add('resident-napping');
  const current=c.element.querySelector('.resident-dialogue-bubble');if(current)current.hidden=true;
  let nap=c.element.querySelector('.resident-nap-bubble');
  if(!nap){nap=document.createElement('span');nap.className='resident-nap-bubble';c.element.append(nap);}
  nap.textContent='💤';
 }
});
function moveCharacters(now=performance.now()){
 const dt=Math.min(.07,Math.max(0,(now-routeClock.previous)/1000));routeClock.previous=now;
 if(activeEncounter&&now>=activeEncounter.until)finishEncounter(now);
 endMeetingBubble(now);
 if(activeFarmEvent&&now>=activeFarmEvent.deadline)endFarmEvent(now);
 characters.forEach(character=>{
  const element=character.element;
  if(!character.meetCooldown)character.meetCooldown=now+12000+Math.random()*15000;
  if(!character.routeNode){
   character.routeNode=Number.isInteger(Number(character.favoritePlace))&&Number(character.favoritePlace)>=1&&Number(character.favoritePlace)<=SCENE_ROUTES.length?Number(character.favoritePlace):8;character.routeTarget=0;
   character.routePause=5;character.routePrevious=0;character.placesSinceFavorite=0;
   character.favoriteJourney=[];character.routeJump=null;
   const origin=arrivalPoint(character.routeNode);character.routeX=origin.x;character.routeY=origin.y;
   restoreScenePosition(character);
  }
  if(character.napping){
   if(character.napClickBubble&&now>=character.napClickBubbleUntil){const spoken=element.querySelector('.resident-dialogue-bubble');if(spoken)spoken.hidden=true;character.napClickBubble.hidden=false;character.napClickBubble=null;}
   if(now>=character.napUntil){character.napping=false;character.napUntil=0;element.classList.remove('resident-napping');element.querySelector('.resident-nap-bubble')?.remove();character.napClickBubble=null;const spoken=element.querySelector('.resident-dialogue-bubble');if(spoken&&now>=character.dialogueUntil)spoken.hidden=true;character.routePause=0;}
   else{
    element.style.left=`${character.routeX-element.offsetWidth/2}px`;
    element.style.top=`${character.routeY-element.offsetHeight}px`;
    return;
   }
  }
  const favorite=Number(character.favoritePlace)||0;
  const validFavorite=favorite>=1&&favorite<=SCENE_ROUTES.length?favorite:0;
  if(character.isBeingDragged){
   element.style.left=`${character.routeX-element.offsetWidth/2}px`;
   element.style.top=`${character.routeY-element.offsetHeight}px`;
   return;
  }
  // 상대의 기존 행동을 끝까지 기다리는 연인은 자리에서 이동하지 않습니다.
  if(character.loverWaitFor){
    setResidentActionEmoji(character,'😳');
    const lover=characters.find(c=>c.residentIndex+1===character.loverWaitFor);
    if(lover&&lover.element?.isConnected&&relationOf(character,lover)==='연인'&&!lover.napping){
      if(!lover.farmEventBusy&&!lover.routeTarget&&!(lover.dialogueUntil>now)&&!(lover.meetingUntil>now)&&!activeEncounter){
        character.loverWaitFor=null;setResidentActionEmoji(character,'');if(startEncounter(character,lover,now,{x:(character.routeX+lover.routeX)/2,y:(character.routeY+lover.routeY)/2},'walk')&&activeEncounter)activeEncounter.waited=true;
      }
      element.style.left=`${character.routeX-element.offsetWidth/2}px`;element.style.top=`${character.routeY-element.offsetHeight}px`;return;
    }
    character.loverWaitFor=null;setResidentActionEmoji(character,'');
  }
  if(character.loverSeekFor)setResidentActionEmoji(character,'☺️');
  else if(!character.loverWaitFor)setResidentActionEmoji(character,'');
  if(activeEncounter&&(activeEncounter.a===character||activeEncounter.b===character)){
   const ev=activeEncounter;
   if(character===ev.a){
     const delta=Math.min(.07,Math.max(0,(now-ev.lastTick)/1000));ev.lastTick=now;
     if(now>=ev.moveFrom&&(ev.type==='walk'||ev.type==='follow')){
       const dx=ev.walkSpeed*delta;
       const rightLimit=mainArea.clientWidth-Math.max(40,character.element.offsetWidth);
       if(ev.b.routeX+dx<rightLimit){ev.a.routeX+=dx;ev.b.routeX+=dx;}
       else ev.until=now;
     }
   }
   character.routePause=Math.max(0,(activeEncounter.until-now)/1000);
   updateResidentDialogue(character,now);
   if(character===ev.a)updateEncounterEmoji(ev,now);
   setResidentActionEmoji(character,'');
   element.style.left=`${character.routeX-element.offsetWidth/2}px`;
   element.style.top=`${character.routeY-element.offsetHeight}px`;
   const appearance=element.querySelector('.resident-avatar-image, .resident-avatar-face');
   if(appearance){element.style.transform='';appearance.style.transform=character.direction>0?'scaleX(-1)':'scaleX(1)';}
   return;
  }
  if(character.farmEventBusy&&activeFarmEvent?.speaker===character&&activeFarmEvent.phase==='talking'){
   character.routePause=Math.max(character.routePause||0,dt+.02);
  }
  if(character.meetingUntil && character.meetingUntil<=now){
   character.meetingUntil=0;
   element.classList.remove('resident-meeting-left','resident-meeting-right');
   // 마주 본 두 주민을 동일한 장소 좌표로 되돌리지 않습니다.
   // 만남 때 벌려 둔 위치 그대로 다음 경로를 향해 곧바로 출발합니다.
   character.routePause=0;
  }
  if(character.meetingUntil>now){character.routePause=Math.max(0,(character.meetingUntil-now)/1000);}
  else if(character.routePause>0)character.routePause=Math.max(0,character.routePause-dt);
  if(!character.meetingUntil&&!character.routeTarget&&character.routePause<=0&&!(character.farmEventBusy&&activeFarmEvent?.phase==='talking')){
   // 좋아하는 장소 외의 장소 10곳을 방문하면 최단 연결 경로를 통해 즉시 귀환합니다.
   if(validFavorite&&character.routeNode!==validFavorite&&character.placesSinceFavorite>=10){
    character.favoriteJourney=shortestRoute(character.routeNode,validFavorite);
   }
   if(character.favoriteJourney?.length){character.routeTarget=character.favoriteJourney.shift();}
   else if(character.meetTarget&&character.routeNode!==character.meetTarget){
    const meetPath=shortestRoute(character.routeNode,character.meetTarget);
    character.routeTarget=meetPath.shift()||0;
    character.meetJourney=meetPath;
   }
   else{
    const neighbors=SCENE_ROUTES[character.routeNode-1].links;
    const allowed=validFavorite&&character.placesSinceFavorite<10?neighbors.filter(n=>n!==validFavorite):neighbors;
    const alternatives=allowed.filter(n=>n!==character.routePrevious);
    const choices=alternatives.length&&Math.random()<.8?alternatives:allowed;
    // 좋아하는 장소가 바로 옆이면 방문 확률을 크게 높입니다.
    if(validFavorite&&neighbors.includes(validFavorite)&&character.placesSinceFavorite>=10)character.routeTarget=validFavorite;
    else character.routeTarget=choices[Math.floor(Math.random()*choices.length)];
   }
   if(!SCENE_ROUTES[character.routeNode-1].links.includes(character.routeTarget))character.routeTarget=0;
   if(character.routeTarget)character.arrival=arrivalPoint(character.routeTarget);
   character.routeJump=character.routeTarget&&SCENE_ROUTES[character.routeNode-1].jump?.includes(character.routeTarget)?{progress:0}:null;
  }
  if(character.routeTarget&&character.routePause<=0){
   const target=character.arrival||(character.arrival=arrivalPoint(character.routeTarget)),dx=target.x-character.routeX,dy=target.y-character.routeY;
   const distance=Math.hypot(dx,dy),speed=(character.speed||.18)*330*(character.farmEventBusy?2.4:1),step=Math.min(distance,speed*dt);
   if(distance>0){character.routeX+=dx/distance*step;character.routeY+=dy/distance*step;}
   if(Math.abs(dx)>1)character.direction=dx>0?1:-1;
   if(character.routeJump){const origin=routePoint(character.routeNode);const length=Math.max(1,Math.hypot(target.x-origin.x,target.y-origin.y));character.routeJump.progress=1-Math.min(1,Math.hypot(target.x-character.routeX,target.y-character.routeY)/length);}
   if(distance<=step+.5){
    character.routeX=target.x;character.routeY=target.y;character.routePrevious=character.routeNode;
    character.routeNode=character.routeTarget;character.routeTarget=0;character.arrival=null;character.routeJump=null;
    character.nextDialogueAt=now+350;
    if(character.farmEventBusy&&activeFarmEvent?.speaker===character&&activeFarmEvent.phase==='moving'){
      if(character.routeNode===12){finishFarmArrival(now);}
      else if(character.farmJourney?.length){
        character.routeTarget=character.farmJourney.shift();character.arrival=arrivalPoint(character.routeTarget);
        character.routePause=0;
      }else endFarmEvent(now);
    }
    if(character.meetTarget===character.routeNode){
     character.meetTarget=null;character.meetJourney=[];
     character.meetCooldown=now-1;
     const soughtId=character.loverSeekFor;character.loverSeekFor=null;setResidentActionEmoji(character,'');
     const lover=(soughtId?characters.find(c=>c.residentIndex+1===soughtId):null)||characters.find(c=>c!==character&&relationOf(c,character)==='연인'&&c.routeNode===character.routeNode);
     if(lover&&(lover.farmEventBusy||lover.routeTarget||lover.dialogueUntil>now||lover.meetingUntil>now)){character.loverWaitFor=lover.residentIndex+1;character.routePause=30;setResidentActionEmoji(character,'😳');}
     const waiting=characters.find(c=>c!==character&&!c.napping&&c.routeNode===character.routeNode&&!c.routeTarget&&!c.meetingUntil&&!c.farmEventBusy&&!(c.dialogueUntil>now));
     if(waiting){waiting.meetCooldown=now-1;startEncounter(character,waiting,now,null,relationOf(character,waiting)==='연인'?'walk':null);}
    }
    if(character.farmEventBusy&&activeFarmEvent?.speaker===character){character.routePause=character.routeTarget?0:6;}
    else if(character.meetingUntil>now){character.routePause=Math.max(0,(character.meetingUntil-now)/1000);}
    else if(validFavorite&&character.routeNode===validFavorite){
     character.placesSinceFavorite=0;character.favoriteJourney=[];character.routePause=8+Math.random()*12;
    }else{
     character.placesSinceFavorite=(character.placesSinceFavorite||0)+1;
     // 귀환 경로에서는 정차하지 않고 다음 연결 장소로 계속 움직입니다.
     character.routePause=character.favoriteJourney?.length||character.meetJourney?.length?0:5;
     if(character.meetJourney?.length&&!character.favoriteJourney?.length){
      character.routeTarget=character.meetJourney.shift();
      character.arrival=arrivalPoint(character.routeTarget);
      character.routeJump=SCENE_ROUTES[character.routeNode-1].jump?.includes(character.routeTarget)?{progress:0}:null;
     }
     if(validFavorite&&character.placesSinceFavorite>=10&&character.routeNode!==validFavorite){
      character.favoriteJourney=shortestRoute(character.routeNode,validFavorite);
      character.routePause=0;
     }
    }
   }
  }
  // 연인을 찾아온 주민은 상대가 밭 반응/대화를 마칠 때까지 방해하지 않고 기다립니다.
  if(character.loverWaitFor){
   setResidentActionEmoji(character,'😳');
   const target=characters.find(c=>c.residentIndex+1===character.loverWaitFor);
   if(!target||relationOf(character,target)!=='연인'||character.napping||target.napping){character.loverWaitFor=null;setResidentActionEmoji(character,'');}
   else if(!target.farmEventBusy&&!target.routeTarget&&!target.isBeingDragged&&!(target.dialogueUntil>now)&&!(target.meetingUntil>now)&&!activeEncounter){
     character.loverWaitFor=null;setResidentActionEmoji(character,'');if(startEncounter(character,target,now,{x:(character.routeX+target.routeX)/2,y:(character.routeY+target.routeY)/2},'walk')&&activeEncounter)activeEncounter.waited=true;
   }
  }
  // 목적지가 같은 두 주민이 장소에 도착하면 짧게 마주 봅니다.
  if(!character.napping&&!character.farmEventBusy&&!character.routeTarget&&!character.meetingUntil&&character.routePause>0&&now>character.meetCooldown){
   const other=characters.find(c=>c!==character&&!c.napping&&c.routeNode===character.routeNode&&!c.routeTarget&&!c.meetingUntil&&now>(c.meetCooldown||0));
   if(other)startEncounter(character,other,now);
  }
  updateResidentDialogue(character,now);
  const jumpHeight=character.routeJump?Math.sin(Math.PI*character.routeJump.progress)*Math.max(60,mainArea.clientHeight*.11):0;
  const bob=character.routeTarget?Math.sin(now/130)*1.4:0;
  element.style.left=`${character.routeX-element.offsetWidth/2}px`;
  element.style.top=`${character.routeY-element.offsetHeight-jumpHeight+bob}px`;
  const appearance=element.querySelector('.resident-avatar-image, .resident-avatar-face');
  if(appearance){element.style.transform='';appearance.style.transform=character.direction>0?'scaleX(-1)':'scaleX(1)';}
 });
 // 일정 간격으로 한 주민이 다른 주민을 만나고 싶어질 수 있습니다.
 // 좋아하는 장소에 복귀하는 중인 주민은 기존 목표를 우선합니다.
 if(now>=encounterClock.next&&characters.length>1){
  encounterClock.next=now+18000+Math.random()*19000;
  const candidates=characters.filter(c=>c.routeNode&&!c.napping&&!c.farmEventBusy&&!c.routeTarget&&!c.meetingUntil&&now>(c.meetCooldown||0)&&!c.favoriteJourney?.length&&(!c.favoritePlace||c.placesSinceFavorite<10));
  if(candidates.length>1){
   const visitor=candidates[Math.floor(Math.random()*candidates.length)];
   const hosts=candidates.filter(c=>c!==visitor&&c.routeNode!==visitor.routeNode&&relationOf(c,visitor)==='연인'&&now>(PAIR_COOLDOWNS.get(pairKey(c,visitor))||0));
   if(hosts.length){
    const host=hosts[Math.floor(Math.random()*hosts.length)];
    visitor.meetTarget=host.routeNode;
    visitor.meetJourney=[];
    visitor.loverSeekFor=host.residentIndex+1;
    setResidentActionEmoji(visitor,'☺️');
    visitor.routePause=0;
    visitor.meetCooldown=now+30000;
    host.meetCooldown=now+30000;
    // 상대방은 현재 장소에서 기다리되 경로 밖으로 이동하지 않습니다.
    host.routePause=Math.max(host.routePause||0,Math.min(12,shortestRoute(visitor.routeNode,host.routeNode).length*3+4));
   }
  }
 }
 requestAnimationFrame(moveCharacters);
}

let interactionDay=Number(window.dowonClock?.get?.()?.day)||1;
document.addEventListener('dowon:timechange',event=>{
 const day=Number(event.detail?.day)||interactionDay;
 if(day===interactionDay)return;
 interactionDay=day;if(activeEncounter)finishEncounter(performance.now(),true);
 for(const c of characters){c.loverWaitFor=null;c.meetTarget=null;c.meetJourney=[];}
});
/* Player click interaction: short press shows speech; dragging never triggers it. */
const CLICK_FALLBACK=['응? 나 불렀어?','무슨 일이야?'];
const REPEAT_FALLBACK=['또 불렀어?','왜 자꾸 불러?'];
const TEN_CLICK_FALLBACK=['열 번도 넘게 부른 거야?!'];
const SLEEP_FALLBACK=['으음… 조금만 더 잘래.'];
function residentClickSpeak(character){
 document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'resident-click',resident:character.residentIndex}}));
 const now=performance.now();
 // 이전 클릭으로부터 3초가 지나면 이 주민의 연속 클릭 횟수를 초기화합니다.
 if(now-(character.lastPlayerClickAt||-Infinity)>3000)character.playerClickCount=0;
 character.playerClickCount=(character.playerClickCount||0)+1;
 character.lastPlayerClickAt=now;
 const isAsleep=Boolean(character.napping||window.dowonClock?.get?.()?.sleeping||window.dowonClock?.get?.()?.asleep);
 const repeat=character.playerClickCount>=3;
 const many=character.playerClickCount>10;
 const source=isAsleep?character.sleepClickLines:many?character.tenClickLines:repeat?character.repeatClickLines:character.clickLines;
 const fallback=isAsleep?SLEEP_FALLBACK:many?TEN_CLICK_FALLBACK:repeat?REPEAT_FALLBACK:CLICK_FALLBACK;
 const lines=residentDialogueOptions(source);
 const selected=(lines.length?lines:fallback);
 const line=selected[Math.floor(Math.random()*selected.length)];
 if(character.napping){const nap=character.element.querySelector('.resident-nap-bubble');if(nap)nap.hidden=true;character.napClickBubbleUntil=now+3200;character.napClickBubble=nap;character.napping=false;}
 if(!showResidentDialogue(character,line,now))return;
 if(character.napClickBubble){character.napping=true;}
 // Do not immediately overwrite clicked dialogue with ambient chatter.
 character.dialogueUntil=now+Math.max(3000,Math.min(4200,line.length*130));
 character.nextDialogueAt=character.dialogueUntil+2500;
}
/* 주민을 끌어 이웃 옆에 내려놓으면 기존 상호작용 대사를 재사용합니다. */
const residentDrag={active:null};
function nearestResidentPlace(x,y){
 let best=1,distance=Infinity;
 SCENE_ROUTES.forEach((_,i)=>{const p=routePoint(i+1),d=Math.hypot(x-p.x,y-p.y);if(d<distance){distance=d;best=i+1;}});
 return best;
}
function cancelResidentDrag(restore=true){
 const d=residentDrag.active;if(!d)return;
 residentDrag.active=null;
 d.character.isBeingDragged=false;
 d.character.element.classList.remove('resident-being-dragged');
 if(restore&&d.started){Object.assign(d.character,d.original);}
}
// 주민을 누르는 즉시 자동 이동을 멈추고, 화면 전체에서 포인터를 추적합니다.
// 별도 UI가 포인터를 가로채더라도 주민이 손에서 떨어지지 않도록 합니다.
mainArea.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'&&e.button!==0||residentDrag.active)return;
 const avatar=e.target.closest?.('.resident-avatar');
 if(!avatar||!mainArea.contains(avatar))return;
 const character=characters.find(c=>c.element===avatar);
 if(!character)return;
 const rect=mainArea.getBoundingClientRect();
 residentDrag.active={character,id:e.pointerId,startX:e.clientX,startY:e.clientY,
  offsetX:e.clientX-rect.left-character.routeX,offsetY:e.clientY-rect.top-character.routeY,
  original:{routeNode:character.routeNode,routeTarget:character.routeTarget,routeX:character.routeX,routeY:character.routeY,
   routePause:character.routePause,routeJump:character.routeJump,arrival:character.arrival,
   favoriteJourney:character.favoriteJourney,meetJourney:character.meetJourney,meetTarget:character.meetTarget},started:false};
 character.isBeingDragged=true;
 try{mainArea.setPointerCapture(e.pointerId);}catch(_){}
 e.preventDefault();
},true);
function residentDragMove(e){
 const d=residentDrag.active;if(!d||e.pointerId!==d.id)return;
 if(!d.started&&Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<5)return;
 d.started=true;
 // Dragging one resident immediately ends BOTH sides of their ongoing encounter.
 interruptEncounterFor(d.character,performance.now());
 const c=d.character,rect=mainArea.getBoundingClientRect();
 c.element.classList.add('resident-being-dragged');
 c.routeX=Math.max(0,Math.min(rect.width,e.clientX-rect.left-d.offsetX));
 c.routeY=Math.max(0,Math.min(rect.height,e.clientY-rect.top-d.offsetY));
 c.element.style.left=`${c.routeX-c.element.offsetWidth/2}px`;
 c.element.style.top=`${c.routeY-c.element.offsetHeight}px`;
 e.preventDefault();
}
function residentDragEnd(e){
 const d=residentDrag.active;if(!d||e.pointerId!==d.id)return;
 if(!d.started){const clicked=d.character;cancelResidentDrag(false);window.dowonAffinity?.onMpcClick(clicked);residentClickSpeak(clicked);return;}
 residentDragMove(e);
 const c=d.character,now=performance.now();
 const other=characters.filter(o=>o!==c&&!o.napping&&!o.isBeingDragged&&o.routeX!=null&&o.routeY!=null)
  .sort((a,b)=>Math.hypot(a.routeX-c.routeX,a.routeY-c.routeY)-Math.hypot(b.routeX-c.routeX,b.routeY-c.routeY))[0];
 const nearby=other&&Math.hypot(other.routeX-c.routeX,other.routeY-c.routeY)<=Math.max(70,Math.min(110,mainArea.clientWidth*.12));
 if(nearby){
  interruptEncounterFor(other,now);
  const point={x:(c.routeX+other.routeX)/2,y:(c.routeY+other.routeY)/2};
  const node=nearestResidentPlace(point.x,point.y);
  for(const person of [c,other]){person.routeNode=node;person.routeTarget=0;person.routeJump=null;person.arrival=null;person.favoriteJourney=[];person.meetJourney=[];person.meetTarget=null;person.meetingUntil=0;}
  cancelResidentDrag(false);
  startEncounter(c,other,now,point);
 }else{
  c.routeNode=nearestResidentPlace(c.routeX,c.routeY);c.routeTarget=0;c.routeJump=null;c.arrival=null;
  c.favoriteJourney=[];c.meetJourney=[];c.meetTarget=null;c.routePause=5;
  c.meetCooldown=now+4000;
  cancelResidentDrag(false);
 }
}
window.addEventListener('pointermove',residentDragMove,true);
window.addEventListener('pointerup',residentDragEnd,true);
window.addEventListener('pointercancel',()=>cancelResidentDrag(true),true);
window.addEventListener('blur',()=>cancelResidentDrag(true));

/* ==================================================
   화면 크기 변경
   ================================================== */

let lastSceneSize={width:mainArea.clientWidth,height:mainArea.clientHeight};
window.addEventListener('resize',()=>{
    const sx=mainArea.clientWidth/Math.max(1,lastSceneSize.width);
    const sy=mainArea.clientHeight/Math.max(1,lastSceneSize.height);
    for(const c of characters){if(c.routeNode){c.routeX*=sx;c.routeY*=sy;}}
    lastSceneSize={width:mainArea.clientWidth,height:mainArea.clientHeight};
});

/* 가공품마다 독립된 6칸과 저장 키를 사용합니다.
   이전 버전의 시설별 공유 슬롯은 각 품목의 슬롯으로 분리하여 최초 1회 이전합니다. */
/* 디버그: 재료 무시 제작. 시설 해금 및 제작 슬롯 제한은 그대로 적용합니다. */
const NAKWON_FREE_CRAFT_KEY='dangcheong-dowon-debug-free-craft-v1';
window.dowonDebugFreeCraft={
    get(){try{return localStorage.getItem(NAKWON_FREE_CRAFT_KEY)==='1';}catch(_){return false;}},
    set(enabled){try{localStorage.setItem(NAKWON_FREE_CRAFT_KEY,enabled?'1':'0');}catch(_){return false;}
        document.dispatchEvent(new Event('dowon:debug-free-craft-change'));return true;}
};
function debugFreeCrafting(){return Boolean(window.dowonDebugFreeCraft?.get());}
function spendCraftMaterials(materials){
    if(debugFreeCrafting())return true;
    if(Object.entries(materials).some(([key,qty])=>(warehouse[key]||0)<qty))return false;
    for(const [key,qty] of Object.entries(materials))warehouse[key]-=qty;
    return true;
}
function createRecipeWorkshop({id,storageKey,legacyProduct=null,recipes}) {
    const groups=recipes.map((recipe,index)=>({
        recipe,
        slotId:recipe.slotId || (index===0?`${id}-slots`:`${id}-${recipe.product}-slots`),
        storageKey:`${storageKey}:product:${recipe.product}`,
        slots:Array(6).fill(null)
    }));
    const message=document.getElementById(`${id}-message`);
    function saveGroup(group){
        try{localStorage.setItem(group.storageKey,JSON.stringify(group.slots));}
        catch(error){console.warn(`${id} ${group.recipe.name} 저장 실패`,error);}
    }
    function load(){
        let shared=null;
        try{const old=JSON.parse(localStorage.getItem(storageKey)||'null');if(Array.isArray(old))shared=old;}
        catch(error){console.warn(`${id} 이전 저장 데이터 읽기 실패`,error);}
        for(const group of groups){
            let saved=null;
            let hasNewSave=false;
            try{
                const raw=localStorage.getItem(group.storageKey);
                if(raw!==null){saved=JSON.parse(raw);hasNewSave=Array.isArray(saved);}
            }catch(error){console.warn(`${group.recipe.name} 저장 데이터 읽기 실패`,error);}
            if(!hasNewSave){
                // 예전 공유 6칸에서 해당 가공품만 골라 원래의 남은 시간을 유지합니다.
                saved=(shared||[]).filter(entry=>entry &&
                    (entry.product||legacyProduct)===group.recipe.product);
            }
            if(!Array.isArray(saved))continue;
            let index=0;
            for(const entry of saved){
                if(index>=6)break;
                if(entry && Number.isFinite(entry.finishAt) && entry.finishAt>0){
                    group.slots[index++]={finishAt:entry.finishAt,product:group.recipe.product};
                }
            }
            if(!hasNewSave)saveGroup(group);
        }
    }
    function update(){
        for(const group of groups){
            const button=document.getElementById(group.recipe.buttonId);
            if(button){
                button.disabled=!window.dowonProgression?.isBuilt(id) || group.slots.every(Boolean)||(!debugFreeCrafting() && Object.entries(group.recipe.materials)
                    .some(([key,qty])=>(warehouse[key]||0)<qty));
                refreshWorkshopTooltip(button, group.recipe.materials, group.recipe.minutes);
            }
        }
    }
    function render(){
        const now=Date.now();
        for(const group of groups){
            const slots=group.slots,recipe=group.recipe;
            const slotElement=document.getElementById(group.slotId);
            if(!slotElement)continue;
            compactProductionSlots(slots,()=>saveGroup(group));
            slotElement.replaceChildren();
            slots.forEach((entry,index)=>{
                const slot=document.createElement('div');slot.className='chopper-slot';
                if(!entry){slot.setAttribute('aria-label',`${recipe.name} ${index+1}번 칸 · 비어 있음`);}
                else{
                    const img=document.createElement('img');img.src=`item/가공품/${recipe.name}.png`;
                    img.alt=recipe.name;img.width=32;img.height=32;
                    if(now>=entry.finishAt){
                        const take=document.createElement('button');take.type='button';
                        take.className='finished-item-button';take.title=`${recipe.name} 받기`;
                        take.disabled=!window.dowonProgression?.isBuilt(id);
                        take.setAttribute('aria-label',take.title);take.append(img);
                        take.addEventListener('click',()=>{
                            if(!window.dowonProgression?.isBuilt(id)||slots[index]!==entry||Date.now()<entry.finishAt)return;
                            slots[index]=null;warehouse[recipe.product]=(warehouse[recipe.product]||0)+1;
                            saveGroup(group);saveWarehouse();renderWarehouse();render();
                            document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'processed',item:recipe.product,count:1}}));
                        });
                        slot.append(take);
                    }else{
                        slot.classList.add('is-processing');attachProductionRemaining(slot,entry.finishAt);
                        // Newly registered recipes use the same darkened preview as legacy recipes.
                        // Apply to the actual image as well so pre-existing theme rules cannot override it.
                        img.style.setProperty('filter','brightness(.28) grayscale(.35)','important');
                        img.style.setProperty('opacity','.78','important');
                        slot.title=`${recipe.name} · ${productionRemainingLabel(entry.finishAt)}`;slot.append(img);
                    }
                }
                slotElement.append(slot);
            });
        }
        update();
    }
    for(const group of groups){
        const recipe=group.recipe;
        document.getElementById(recipe.buttonId)?.addEventListener('click',()=>{
            if(!window.dowonProgression?.isBuilt(id)){
                if(message)message.textContent='먼저 가공소를 건설해야 합니다.';
                return;
            }
            const slots=group.slots;
            const index=slots.findIndex(entry=>entry===null);
            if(index<0){if(message)message.textContent=`${recipe.name}: 제작 칸 6개가 모두 사용 중입니다.`;return;}
            const missing=Object.entries(recipe.materials).filter(([key,qty])=>(warehouse[key]||0)<qty);
            if(missing.length&&!debugFreeCrafting()){if(message)message.textContent=`${missing.map(([key,qty])=>`${window.dowonItemDescriptions?.[key]?.name||key} ${qty}개`).join(', ')}가 필요합니다.`;return;}
            spendCraftMaterials(recipe.materials);
            slots[index]={finishAt:Date.now()+recipe.minutes*60*1000,product:recipe.product};
            saveWarehouse();saveGroup(group);renderWarehouse();render();if(message)message.textContent='';
            updateChopperButton();updateCoopButton();updateSugarButton();updateTofuButton();
        });
    }
    return {
        slots:groups[0].slots, slotGroups:groups.map(group=>group.slots),
        groups,save:()=>groups.forEach(saveGroup),load,update,render
    };
}
const millFacility=createRecipeWorkshop({
 id:'mill',storageKey:'dangcheong-dowon-village-mill',legacyProduct:'flour',recipes:[
  {buttonId:'mill-start',product:'flour',name:'밀가루',materials:{rice:2},minutes:0.5},
  {slotId:'mill-rice-powder-slots',buttonId:'mill-rice-powder-start',product:'ricePowder',name:'떡가루',materials:{paddy:2},minutes:1.5}
 ]
});
const millSlots=millFacility.slots;
const saveMill=millFacility.save,loadMill=millFacility.load,renderMill=millFacility.render,updateMillButton=millFacility.update;

/* 작두: 6개 칸의 제작 상태와 창고 수량을 브라우저에 저장 */
const WAREHOUSE_STORAGE_KEY = "dangcheong-dowon-village-warehouse";
/* 기본 1품목 가공소는 하나의 공통 엔진을 사용합니다.
   기존 저장 키와 외부 함수명(saveChopper 등)은 유지하여 이전 저장/다른 모듈과 호환됩니다. */
function saveWarehouse() {
    try {
        localStorage.setItem(WAREHOUSE_STORAGE_KEY, JSON.stringify(warehouse));
        window.dowonCollection?.syncInventory();
    }
    catch (error) { console.warn("창고 저장 실패", error); }
}
function loadWarehouse() {
    try {
        const saved = JSON.parse(localStorage.getItem(WAREHOUSE_STORAGE_KEY) || "null");
        if (saved && typeof saved === "object") {
            for (const key of Object.keys(warehouse)) {
                if (Number.isSafeInteger(saved[key]) && saved[key] >= 0) warehouse[key] = saved[key];
            }
            // 구형 일반 고양이 사료는 생선 사료로 한 번만 이전합니다.
            if(warehouse.catFeed>0){warehouse.catFishFeed+=warehouse.catFeed;warehouse.catFeed=0;saveWarehouse();}
            // 예전 저장 데이터에 한글 키로 저장된 재료가 있으면 실제 창고 키로 이전합니다.
            for (const [legacyKey, standardKey] of Object.entries({밀가루:'flour', 달걀:'egg', 설탕:'sugar'})) {
                if (Number.isSafeInteger(saved[legacyKey]) && saved[legacyKey] > 0 && warehouse[standardKey] === 0) {
                    warehouse[standardKey] = saved[legacyKey];
                }
            }
        }
    } catch (error) { console.warn("창고 불러오기 실패", error); }
}
window.dowonInventory = {
    get: key => Object.prototype.hasOwnProperty.call(warehouse,key) ? warehouse[key] : 0,
    add(key, qty=1) {
        if(!Object.prototype.hasOwnProperty.call(warehouse,key) || !Number.isSafeInteger(qty) || qty<1)return false;
        warehouse[key]+=qty;saveWarehouse();renderWarehouse();return true;
    },
    take(key,qty=1){
        if(!Object.prototype.hasOwnProperty.call(warehouse,key) || !Number.isSafeInteger(qty) || qty<1 || warehouse[key]<qty)return false;
        warehouse[key]-=qty;saveWarehouse();renderWarehouse();
        updateChopperButton();updateCoopButton();updateSugarButton();updateTofuButton();updateMillButton();updateSalterButton();pancakeFacility.update();tofuProcessingFacility.update();return true;
    },
    availableKeys(){
        return window.dowonRequestItems?.availableKeys() || ['rice','bean'];
    }
};

function workshopItemName(key){return window.dowonItemDescriptions?.[key]?.name||cropData[key]?.name||key;}
function buildWorkshopTooltipHtml(materials, minutes){
    const parts=Object.entries(materials).map(([key,qty])=>{
        const enough=(warehouse[key]||0)>=qty;
        const cls=enough?'dw-ok':'dw-shortage';
        return `<span class="${cls}">${workshopItemName(key)} ${qty}개</span>`;
    });
    return `필요 재료: ${parts.join(' · ')}<br>제작 시간: ${minutes}분`;
}
function refreshWorkshopTooltip(buttonOrId, materials, minutes){
    const button=typeof buttonOrId==='string'?document.getElementById(buttonOrId):buttonOrId;
    if(!button)return;
    const tooltipId=button.getAttribute('aria-describedby');
    const tooltip=tooltipId?document.getElementById(tooltipId):null;
    if(tooltip)tooltip.innerHTML=buildWorkshopTooltipHtml(materials, minutes);
}
function compactProductionSlots(slots, saveSlots) {
    const now = Date.now();
    const ordered = slots.filter(entry => entry && entry.finishAt <= now)
        .concat(slots.filter(entry => entry && entry.finishAt > now));
    while (ordered.length < slots.length) ordered.push(null);
    const changed = ordered.some((entry, i) => entry !== slots[i]);
    if (changed) {
        slots.splice(0, slots.length, ...ordered);
        saveSlots();
    }
}
function productionRemainingLabel(finishAt) {
    const seconds = Math.max(0, Math.ceil((finishAt - Date.now()) / 1000));
    if (!seconds) return '제작 완료';
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `남은 시간 ${minutes}분 ${String(rest).padStart(2, '0')}초`;
}
function attachProductionRemaining(slot, finishAt) {
    slot.dataset.finishAt = String(finishAt);
    slot.title = productionRemainingLabel(finishAt);
    slot.setAttribute('aria-label', slot.title);
}
/* 슬롯은 렌더링 때 다시 생성되므로 매번 현재 DOM에서 처리합니다. */
setInterval(() => {
    document.querySelectorAll('#mill-slots .is-processing[data-finish-at], #mill-rice-powder-slots .is-processing[data-finish-at], #chopper-slots .is-processing[data-finish-at], #coop-slots .is-processing[data-finish-at], #sugar-slots .is-processing[data-finish-at], #tofu-slots .is-processing[data-finish-at], #salter-slots .is-processing[data-finish-at], #salter-vegetable-slots .is-processing[data-finish-at], #pancake-slots .is-processing[data-finish-at], #tofu-processing-slots .is-processing[data-finish-at]')
        .forEach(slot => {
            const label = productionRemainingLabel(Number(slot.dataset.finishAt));
            slot.title = label;
            slot.setAttribute('aria-label', label);
        });
}, 1000);

function createSingleProductWorkshop({
    facilityId, storageKey, slotId, buttonId, messageId,
    product, productName, imageName=productName, materials, minutes,
    isBuilt, lockedMessage, materialMessage,
    collectRequiresBuilt=false, lockedAriaLabel='', readyAriaLabel='',
    afterCollect=null, afterStart=null
}) {
    const slots=Array(6).fill(null);
    const slotElement=document.getElementById(slotId);
    const startButton=document.getElementById(buttonId);
    const message=document.getElementById(messageId);

    function save(){
        try{localStorage.setItem(storageKey,JSON.stringify(slots));}
        catch(error){console.warn(`${productName} 가공소 저장 실패`,error);}
    }
    function load(){
        try{
            const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
            if(!Array.isArray(saved))return;
            saved.slice(0,6).forEach((entry,index)=>{
                if(entry&&Number.isFinite(entry.finishAt)&&entry.finishAt>0)slots[index]={finishAt:entry.finishAt};
            });
        }catch(error){console.warn(`${productName} 가공소 불러오기 실패`,error);}
    }
    function hasMaterials(){
        return Object.entries(materials).every(([key,qty])=>(warehouse[key]||0)>=qty);
    }
    function update(){
        if(!startButton)return;
        const built=Boolean(isBuilt());
        startButton.disabled=!built||slots.every(Boolean)||(!debugFreeCrafting()&&!hasMaterials());
        if(lockedAriaLabel||readyAriaLabel)startButton.setAttribute('aria-label',built?readyAriaLabel:lockedAriaLabel);
        refreshWorkshopTooltip(startButton,materials,minutes);
    }
    function render(){
        if(!slotElement)return;
        compactProductionSlots(slots,save);
        const now=Date.now();
        slotElement.replaceChildren();
        slots.forEach((entry,index)=>{
            const slot=document.createElement('div');
            slot.className='chopper-slot';
            if(!entry){
                slot.setAttribute('aria-label',`${index+1}번 칸 · 비어 있음`);
            }else if(now>=entry.finishAt){
                const take=document.createElement('button');
                take.type='button';take.className='finished-item-button';
                take.title=`${productName} 받기`;take.setAttribute('aria-label',`${productName} 받기`);
                if(collectRequiresBuilt)take.disabled=!isBuilt();
                take.innerHTML=`<img src="item/가공품/${imageName}.png" alt="${productName} 완성" width="32" height="32">`;
                take.addEventListener('click',()=>{
                    if((collectRequiresBuilt&&!isBuilt())||!slots[index]||Date.now()<slots[index].finishAt)return;
                    slots[index]=null;
                    warehouse[product]=(warehouse[product]||0)+1;
                    document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'processed',item:product,count:1}}));
                    save();saveWarehouse();renderWarehouse();render();
                    if(afterCollect)afterCollect();
                });
                slot.appendChild(take);
            }else{
                slot.classList.add('is-processing');
                attachProductionRemaining(slot,entry.finishAt);
                slot.innerHTML=`<img src="item/가공품/${imageName}.png" alt="${productName} 제작 중" width="32" height="32">`;
            }
            slotElement.appendChild(slot);
        });
        update();
    }
    if(startButton)startButton.addEventListener('click',()=>{
        if(!isBuilt()){if(message)message.textContent=lockedMessage;return;}
        const index=slots.findIndex(entry=>entry===null);
        if(index<0){if(message)message.textContent='제작 칸 6개가 모두 사용 중입니다.';return;}
        if(!debugFreeCrafting()&&!hasMaterials()){if(message)message.textContent=materialMessage;return;}
        spendCraftMaterials(materials);
        slots[index]={finishAt:Date.now()+minutes*60*1000};
        saveWarehouse();save();renderWarehouse();render();
        if(afterStart)afterStart();
        if(message)message.textContent='';
    });
    return {slots,save,load,update,render};
}

const chopperFacility=createSingleProductWorkshop({
    facilityId:'chopper',storageKey:'dangcheong-dowon-village-chopper',slotId:'chopper-slots',buttonId:'chopper-start',messageId:'chopper-message',
    product:'chickenFeed',productName:'닭 사료',materials:{rice:2,bean:1},minutes:1,
    isBuilt:()=>!!window.dowonProgression?.isBuilt('chopper'),lockedMessage:'작두를 건설해야 합니다.',materialMessage:'밀 2개와 콩 1개가 필요합니다.',
    afterCollect:()=>updateCoopButton(),afterStart:()=>updateMillButton()
});
const chopperSlots=chopperFacility.slots;
function saveChopper(){return chopperFacility.save();}
function loadChopper(){return chopperFacility.load();}
function updateChopperButton(){return chopperFacility.update();}
function renderChopper(){return chopperFacility.render();}

const coopFacility=createSingleProductWorkshop({
    facilityId:'coop',storageKey:'dangcheong-dowon-village-coop',slotId:'coop-slots',buttonId:'coop-start',messageId:'coop-message',
    product:'egg',productName:'달걀',materials:{chickenFeed:1},minutes:2,
    isBuilt:()=>!!window.dowonProgression?.isBuilt('coop'),lockedMessage:'닭장을 건설해야 합니다.',materialMessage:'닭 사료 1개가 필요합니다.'
});
const coopSlots=coopFacility.slots;
function saveCoop(){return coopFacility.save();}
function loadCoop(){return coopFacility.load();}
function updateCoopButton(){return coopFacility.update();}
function renderCoop(){return coopFacility.render();}

const sugarFacility=createSingleProductWorkshop({
    facilityId:'sugar',storageKey:'dangcheong-dowon-village-sugar-workshop',slotId:'sugar-slots',buttonId:'sugar-start',messageId:'sugar-message',
    product:'sugar',productName:'설탕',materials:{sugarcane:2},minutes:2.5,
    isBuilt:isSugarWorkshopBuilt,lockedMessage:'설탕공방을 건설해야 합니다.',materialMessage:'사탕수수 2개가 필요합니다.',
    collectRequiresBuilt:true,lockedAriaLabel:'설탕공방 건설 필요',readyAriaLabel:'설탕 제작'
});
const sugarSlots=sugarFacility.slots;
function saveSugar(){return sugarFacility.save();}
function loadSugar(){return sugarFacility.load();}
function updateSugarButton(){return sugarFacility.update();}
function renderSugar(){return sugarFacility.render();}

const tofuFacility=createSingleProductWorkshop({
    facilityId:'tofu',storageKey:'dangcheong-dowon-village-tofu-workshop',slotId:'tofu-slots',buttonId:'tofu-start',messageId:'tofu-message',
    product:'tofu',productName:'두부',materials:{bean:2},minutes:2,
    isBuilt:isTofuUnlocked,lockedMessage:'콩공방을 건설해야 합니다.',materialMessage:'콩 2개가 필요합니다.',
    collectRequiresBuilt:true,lockedAriaLabel:'콩공방 건설 필요',readyAriaLabel:'두부 제작'
});
const tofuSlots=tofuFacility.slots;
function saveTofu(){return tofuFacility.save();}
function loadTofu(){return tofuFacility.load();}
function updateTofuButton(){return tofuFacility.update();}
function renderTofu(){return tofuFacility.render();}

/* 절임통과 새 가공소도 동일한 6칸 슬롯 엔진을 사용합니다. */
const salterFacility=createRecipeWorkshop({
 id:'salter',storageKey:'dangcheong-dowon-village-salter',legacyProduct:'saltedEgg',recipes:[
  {buttonId:'salter-start',product:'saltedEgg',name:'소금달걀',materials:{egg:2},minutes:4},
  {slotId:'salter-vegetable-slots',buttonId:'salter-vegetable-start',product:'pickledVegetables',name:'절임채소',materials:{cabbage:3},minutes:5}
 ]
});
const salterSlots=salterFacility.slots;
const saveSalter=salterFacility.save,loadSalter=salterFacility.load,renderSalter=salterFacility.render,updateSalterButton=salterFacility.update;

const pancakeFacility=createRecipeWorkshop({
 id:'pancake',storageKey:'dangcheong-dowon-village-pancake-workshop',legacyProduct:'eggPancake',recipes:[
  {buttonId:'pancake-start',product:'eggPancake',name:'계란전',materials:{flour:1,egg:2},minutes:4}
 ]
});
const tofuProcessingFacility=createRecipeWorkshop({
 id:'tofu-processing',storageKey:'dangcheong-dowon-village-tofu-processing-workshop',legacyProduct:'friedTofu',recipes:[
  {buttonId:'tofu-processing-start',product:'friedTofu',name:'유부',materials:{tofu:1,flour:1},minutes:5}
 ]
});


/* 신규 생산품: 각 품목별 독립 슬롯 / 저장 / 수령. */
const nakwonExtraFacilities = [
  createRecipeWorkshop({id:'chopper',storageKey:'dangcheong-dowon-extra-chopper',recipes:[
    {slotId:'extra-sheepFeed-slots',buttonId:'extra-sheepFeed-start',product:'sheepFeed',name:'양 사료',materials:{rice:2,sugarcane:1},minutes:1.5},
  ]}),
  createRecipeWorkshop({id:'sugar',storageKey:'dangcheong-dowon-extra-sugar',recipes:[
    {slotId:'extra-brownSugar-slots',buttonId:'extra-brownSugar-start',product:'brownSugar',name:'흑설탕',materials:{sugarcane:3},minutes:3},
  ]}),
  createRecipeWorkshop({id:'sheep',storageKey:'dangcheong-dowon-extra-sheep',recipes:[
    {slotId:'extra-wool-slots',buttonId:'extra-wool-start',product:'wool',name:'양털',materials:{sheepFeed:1},minutes:2.5},
  ]}),
  createRecipeWorkshop({id:'ricecake',storageKey:'dangcheong-dowon-extra-ricecake',recipes:[
    {slotId:'extra-stickyRiceCake-slots',buttonId:'extra-stickyRiceCake-start',product:'stickyRiceCake',name:'찹쌀떡',materials:{ricePowder:1,sugar:1},minutes:4},
    {slotId:'extra-eggBread-slots',buttonId:'extra-eggBread-start',product:'eggBread',name:'계란빵',materials:{egg:3,ricePowder:1,brownSugar:1},minutes:7},
  ]}),
  createRecipeWorkshop({id:'dryer',storageKey:'dangcheong-dowon-extra-dryer',recipes:[
    {slotId:'extra-pumpkinSeed-slots',buttonId:'extra-pumpkinSeed-start',product:'pumpkinSeed',name:'호박씨',materials:{pumpkin:3},minutes:3},
  ]}),
  createRecipeWorkshop({id:'roastery',storageKey:'dangcheong-dowon-extra-roastery',recipes:[
    {slotId:'extra-roastedSweetPotato-slots',buttonId:'extra-roastedSweetPotato-start',product:'roastedSweetPotato',name:'군고구마',materials:{sweetPotato:3},minutes:4},
  ]}),
  createRecipeWorkshop({id:'textile',storageKey:'dangcheong-dowon-extra-textile',recipes:[
    {slotId:'extra-hempCloth-slots',buttonId:'extra-hempCloth-start',product:'hempCloth',name:'삼베',materials:{ramie:4},minutes:4},
    {slotId:'extra-yarn-slots',buttonId:'extra-yarn-start',product:'yarn',name:'털실',materials:{wool:4},minutes:5},
    {slotId:'extra-cottonFabric-slots',buttonId:'extra-cottonFabric-start',product:'cottonFabric',name:'면직물',materials:{cotton:4},minutes:4},
  ]}),
  createRecipeWorkshop({id:'embroidery',storageKey:'dangcheong-dowon-extra-embroidery',recipes:[
    {slotId:'extra-clothDoll-slots',buttonId:'extra-clothDoll-start',product:'clothDoll',name:'수국',materials:{hempCloth:1,yarn:1},minutes:6},
    {slotId:'extra-sachet-slots',buttonId:'extra-sachet-start',product:'sachet',name:'향주머니',materials:{cottonFabric:1,hempCloth:1},minutes:10},
  ]}),
];
/* 추가 가공품: 가공소별 신규 레시피 전용 독립 제작 슬롯 및 저장 키. */
const nakwonAdditionalFacilities = [
  createRecipeWorkshop({id:'roastery',storageKey:'dangcheong-dowon-additional-roastery',recipes:[
    {slotId:'extra-roastedPotato-slots',buttonId:'extra-roastedPotato-start',product:'roastedPotato',name:'구운감자',materials:{potato:3,pepper:2},minutes:5},
    {slotId:'extra-grilledTofu-slots',buttonId:'extra-grilledTofu-start',product:'grilledTofu',name:'구운두부',materials:{tofu:2,pepper:2},minutes:6}
  ]}),
  createRecipeWorkshop({id:'mill',storageKey:'dangcheong-dowon-additional-mill',recipes:[
    {slotId:'extra-potatoStarch-slots',buttonId:'extra-potatoStarch-start',product:'potatoStarch',name:'감자전분',materials:{potato:3},minutes:2},
    {slotId:'extra-sweetPotatoStarch-slots',buttonId:'extra-sweetPotatoStarch-start',product:'sweetPotatoStarch',name:'고구마 전분',materials:{sweetPotato:3},minutes:3}
  ]}),
  createRecipeWorkshop({id:'tofu',storageKey:'dangcheong-dowon-additional-tofu',recipes:[
    {slotId:'extra-soyMilk-slots',buttonId:'extra-soyMilk-start',product:'soyMilk',name:'두유',materials:{bean:3},minutes:3},
    {slotId:'extra-blackBeanPaste-slots',buttonId:'extra-blackBeanPaste-start',product:'blackBeanPaste',name:'검은콩장',materials:{bean:3,pepper:3},minutes:5}
  ]}),
  createRecipeWorkshop({id:'sugar',storageKey:'dangcheong-dowon-additional-sugar',recipes:[
    {slotId:'extra-maltSyrup-slots',buttonId:'extra-maltSyrup-start',product:'maltSyrup',name:'엿',materials:{sugarcane:3,rice:3},minutes:4}
  ]}),
  createRecipeWorkshop({id:'pancake',storageKey:'dangcheong-dowon-additional-pancake',recipes:[
    {slotId:'extra-hotteok-slots',buttonId:'extra-hotteok-start',product:'hotteok',name:'호떡',materials:{flour:2,sugar:1},minutes:6},
    {slotId:'extra-vegetablePancake-slots',buttonId:'extra-vegetablePancake-start',product:'vegetablePancake',name:'채소전',materials:{flour:2,egg:3,cabbage:3},minutes:7},
    {slotId:'extra-potatoPancake-slots',buttonId:'extra-potatoPancake-start',product:'potatoPancake',name:'감자전',materials:{potatoStarch:1,egg:3,brownSugar:1},minutes:8}
  ]}),
  createRecipeWorkshop({id:'salter',storageKey:'dangcheong-dowon-additional-salter',recipes:[
    {slotId:'extra-pickledPotato-slots',buttonId:'extra-pickledPotato-start',product:'pickledPotato',name:'절임감자',materials:{potato:3,pepper:3},minutes:6}
  ]}),
  createRecipeWorkshop({id:'tofu-processing',storageKey:'dangcheong-dowon-additional-tofu-processing',recipes:[
    {slotId:'extra-tofuStick-slots',buttonId:'extra-tofuStick-start',product:'tofuStick',name:'푸주',materials:{soyMilk:1,sugar:1},minutes:6},
    {slotId:'extra-fermentedTofu-slots',buttonId:'extra-fermentedTofu-start',product:'fermentedTofu',name:'두부유',materials:{tofu:2,pepper:2},minutes:7},
    {slotId:'extra-tofuSkin-slots',buttonId:'extra-tofuSkin-start',product:'tofuSkin',name:'두부피',materials:{soyMilk:1,brownSugar:1},minutes:7}
  ]}),
  createRecipeWorkshop({id:'ricecake',storageKey:'dangcheong-dowon-additional-ricecake',recipes:[
    {slotId:'extra-steamedRiceCake-slots',buttonId:'extra-steamedRiceCake-start',product:'steamedRiceCake',name:'증편',materials:{egg:3,ricePowder:1,maltSyrup:1},minutes:9},
    {slotId:'extra-pumpkinRiceCake-slots',buttonId:'extra-pumpkinRiceCake-start',product:'pumpkinRiceCake',name:'호박떡',materials:{pumpkin:3,ricePowder:1,brownSugar:1},minutes:8}
  ]}),
  createRecipeWorkshop({id:'dryer',storageKey:'dangcheong-dowon-additional-dryer',recipes:[
    {slotId:'extra-glassNoodles-slots',buttonId:'extra-glassNoodles-start',product:'glassNoodles',name:'당면',materials:{potatoStarch:1},minutes:5},
    {slotId:'extra-driedBlackBeanPaste-slots',buttonId:'extra-driedBlackBeanPaste-start',product:'driedBlackBeanPaste',name:'말린검은콩장',materials:{blackBeanPaste:1},minutes:7}
  ]}),
];
const nakwonExtensionFacilities = [...nakwonExtraFacilities, ...nakwonAdditionalFacilities];
/* ==================================================
   밭 / 창고 초기화
   ================================================== */

/*
 * 페이지를 다시 열었을 때
 * 저장된 작물을 먼저 복원합니다.
 */
loadFarms();
loadWarehouse();
loadMill();
loadChopper();
loadCoop();
loadSugar();
loadTofu();
loadSalter();
pancakeFacility.load();
tofuProcessingFacility.load();
nakwonExtensionFacilities.forEach(f=>f.load());
renderAllFarms();
renderWarehouse();
renderMill();
renderChopper();
renderCoop();
renderSugar();
renderTofu();
renderSalter();
pancakeFacility.render();
tofuProcessingFacility.render();
nakwonExtensionFacilities.forEach(f=>f.render());
refreshProgressionUnlocks();
document.addEventListener('dowon:debug-free-craft-change',()=>{
    updateMillButton();updateChopperButton();updateCoopButton();updateSugarButton();updateTofuButton();
    salterFacility.update();pancakeFacility.update();tofuProcessingFacility.update();
    nakwonExtensionFacilities.forEach(f=>f.update());
});
window.addEventListener('dowon-comfort-change', () => {
    updateChopperButton();
    updateCoopButton();
    pancakeFacility.update();
    salterFacility.update();
    tofuProcessingFacility.update();
    nakwonExtensionFacilities.forEach(f=>f.update());
});
setInterval(() => { renderMill(); renderChopper(); renderCoop(); renderSugar(); renderTofu(); renderSalter(); pancakeFacility.render(); tofuProcessingFacility.render(); nakwonExtensionFacilities.forEach(f=>f.render()); }, 1000);

/* 주민의 가끔 하는 완성 가공품 대리 수령.
   실제 수령 버튼을 호출하므로 플레이어와 동일한 슬롯 비우기/창고 저장 경로를 사용합니다. */
const RESIDENT_COLLECT_CHECK_MS = 30000;
const RESIDENT_COLLECT_CHANCE = 0.10;
const RESIDENT_COLLECT_COOLDOWN_MS = 120000;
let lastResidentCollectAt = 0;
function tryResidentCollectFinishedProduct(){
    const wallNow=Date.now();
    if(wallNow-lastResidentCollectAt<RESIDENT_COLLECT_COOLDOWN_MS)return;
    const sceneNow=performance.now();
    const eligible=characters.filter(c=>c.element?.isConnected && !c.napping && !c.isBeingDragged &&
        !c.farmEventBusy && !(c.meetingUntil>sceneNow) && !(c.dialogueUntil>sceneNow) &&
        !(c.napUntil>sceneNow));
    if(!eligible.length)return;
    const available=[
        {slots:millSlots,selector:'#mill-slots',item:'flour',multi:true},
        {slots:millFacility.slotGroups[1],selector:'#mill-rice-powder-slots',item:'ricePowder',multi:true},
        {slots:chopperSlots,selector:'#chopper-slots',item:'chickenFeed',enabled:()=>window.dowonProgression?.isBuilt('chopper')},
        {slots:coopSlots,selector:'#coop-slots',item:'egg',enabled:()=>window.dowonProgression?.isBuilt('coop')},
        {slots:sugarSlots,selector:'#sugar-slots',item:'sugar',enabled:()=>isSugarWorkshopBuilt()},
        {slots:tofuSlots,selector:'#tofu-slots',item:'tofu',enabled:()=>isTofuUnlocked()},
        {slots:salterSlots,selector:'#salter-slots',item:'saltedEgg',multi:true,enabled:()=>window.dowonProgression?.isBuilt('salter')},
        {slots:salterFacility.slotGroups[1],selector:'#salter-vegetable-slots',item:'pickledVegetables',multi:true,enabled:()=>window.dowonProgression?.isBuilt('salter')},
        {slots:pancakeFacility.slots,selector:'#pancake-slots',item:'eggPancake',multi:true,enabled:()=>window.dowonProgression?.isBuilt('pancake')},
        {slots:tofuProcessingFacility.slots,selector:'#tofu-processing-slots',item:'friedTofu',multi:true,enabled:()=>window.dowonProgression?.isBuilt('tofu-processing')}
    ].flatMap(group=>{
        if(group.enabled && !group.enabled())return [];
        return group.slots.flatMap((entry,index)=>{
            if(!entry || !Number.isFinite(Number(entry.finishAt)) || wallNow<Number(entry.finishAt))return [];
            const button=document.querySelector(`${group.selector} > :nth-child(${index+1}) .finished-item-button:not(:disabled)`);
            return button?[{button,group,index,entry}]:[];
        });
    });
    if(!available.length)return;
    const resident=eligible[Math.floor(Math.random()*eligible.length)];
    if(Math.random()>=RESIDENT_COLLECT_CHANCE)return;
    const {button,group,index,entry}=available[Math.floor(Math.random()*available.length)];
    const collectedItem=group.multi?(entry.product||group.item):group.item;
    const previousCount=warehouse[collectedItem];
    // 기존 플레이어 수령 경로를 이용하되, 수령 전후 창고와 제작 슬롯을 검증합니다.
    button.click();
    const collected=group.slots[index]!==entry && warehouse[collectedItem]===previousCount+1;
    if(!collected)return;
    lastResidentCollectAt=wallNow;
    let bubble=resident.element.querySelector('.resident-dialogue-bubble');
    if(!bubble){
        bubble=document.createElement('span');bubble.className='resident-dialogue-bubble';
        bubble.setAttribute('role','status');resident.element.appendChild(bubble);
    }
    bubble.textContent='📦';bubble.hidden=false;
    resident.dialogueUntil=sceneNow+2000;
    resident.nextDialogueAt=Math.max(resident.nextDialogueAt||0,sceneNow+3500);
}
setInterval(tryResidentCollectFinishedProduct,RESIDENT_COLLECT_CHECK_MS);



/* ==================================================
   캐릭터 이동 시작
   ================================================== */

moveCharacters();

/* 디버그: 제작 중인 모든 슬롯을 즉시 완료 상태로 만들고 저장/렌더링합니다.
   debug-menu.js는 script.js보다 뒤에서 로드되므로 DOM 버튼을 여기서 직접 찾지 않고 API만 공개합니다. */
window.dowonFinishAllCrafting = function(){
    const now=Date.now();
    const finishSlots=slots=>slots.forEach(entry=>{if(entry&&entry.finishAt>now)entry.finishAt=now;});
    millFacility.slotGroups.forEach(finishSlots);
    finishSlots(chopperSlots); finishSlots(coopSlots); finishSlots(sugarSlots); finishSlots(tofuSlots);
    salterFacility.slotGroups.forEach(finishSlots);
    pancakeFacility.slotGroups.forEach(finishSlots);
    tofuProcessingFacility.slotGroups.forEach(finishSlots);
    nakwonExtensionFacilities.forEach(f=>f.groups.forEach(g=>finishSlots(g.slots)));

    saveMill(); saveChopper(); saveCoop(); saveSugar(); saveTofu(); saveSalter();
    pancakeFacility.save(); tofuProcessingFacility.save();
    nakwonExtensionFacilities.forEach(f=>f.save());

    renderMill(); renderChopper(); renderCoop(); renderSugar(); renderTofu(); renderSalter();
    pancakeFacility.render(); tofuProcessingFacility.render();
    nakwonExtensionFacilities.forEach(f=>f.render());
    return true;
};

/* 창고는 왼쪽 메뉴에서만 표시하며, 배경 클릭·ESC로 닫습니다. */
const warehouseMenu = document.getElementById("menu-warehouse");
const warehouseCloseButton = document.getElementById("warehouse-close");
const warehouseBackdrop = document.getElementById("warehouse-backdrop");
// 창고를 #main-area 밖으로 옮겨 메인 게임 영역의 너비/높이 및 overflow:hidden 제한을 없앱니다.
// ID와 이벤트 대상은 그대로 두므로 창고 재고/탭/설명창 동작은 유지됩니다.
document.body.append(warehouseBackdrop, warehouseElement);
window.dowonSetWarehouseOpen = setWarehouseOpen;
function setWarehouseOpen(open) {
    warehouseElement.classList.toggle("is-open", open);
    warehouseBackdrop.classList.toggle("is-open", open);
    warehouseElement.setAttribute("aria-hidden", String(!open));
    warehouseMenu.setAttribute("aria-expanded", String(open));
    document.getElementById("menu-residents").classList.remove("selected");
    warehouseMenu.classList.toggle("selected", open);
    if (open) { document.getElementById('kitchen-close')?.click(); selectWarehouseTab('production'); warehouseCloseButton.focus(); }
    else { warehouseMenu.focus(); }
}
warehouseMenu.addEventListener("click", () => setWarehouseOpen(true));
warehouseCloseButton.addEventListener("click", () => setWarehouseOpen(false));
warehouseBackdrop.addEventListener("click", () => setWarehouseOpen(false));


document.addEventListener("keydown", event => { if (event.key === "Escape" && warehouseElement.classList.contains("is-open")) setWarehouseOpen(false); });

