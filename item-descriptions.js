/* 아이템 소개 글과 개당 판매가를 이 파일에서 수정하세요.
   description: 말풍선에 표시할 소개 글 (줄바꿈은 \n 사용 가능)
   price: 1개 판매 시 받는 동전. 0이면 판매 버튼이 비활성화됩니다.
   내부 아이템 키 rice는 기존 저장 데이터 호환을 위해 유지하며 화면에는 밀로 표시합니다. */

window.dowonItemDescriptions = {
  rice: {
    name: '밀',
    description: '노랗게 익은 밀 이삭. 곱게 빻으면 밀가루를 만들 수 있다.',
    price: 1
  },
  paddy: {
    name: '벼',
    description: '논에서 수확한 벼. 맷돌에 넣어 빻으면 떡가루를 얻을 수 있다.',
    price: 4
  },
  cabbage: {
    name: '배추',
    description: '잎이 겹겹이 자란 싱싱한 배추. 절임통에 넣으면 아삭한 절임채소가 된다.',
    price: 5
  },
  pepper: {
    name: '고추',
    description: '붉게 익은 고추. 수확하여 창고에 보관할 수 있다.',
    price: 6
  },
  potato: {
    name: '감자',
    description: '땅속에서 자란 감자. 수확하여 창고에 보관할 수 있다.',
    price: 8
  },
  bean: {
    name: '콩',
    description: '작고 단단한 콩알. 두부를 만들거나 닭 사료의 재료로 사용할 수 있다.',
    price: 2
  },
  sugarcane: {
    name: '사탕수수',
    description: '줄기에 달콤한 즙이 가득한 작물. 설탕공방에서 설탕으로 가공할 수 있다.',
    price: 3
  },
  chickenFeed: {
    name: '닭 사료',
    description: '밀과 콩을 섞어 만든 닭 먹이. 닭장에 넣으면 달걀을 얻을 수 있다.',
    price: 7
  },
  catFishFeed: {name:'생선 사료',description:'생선을 좋아하는 고양이를 부르는 사료입니다.',price:10},
  catDuckFeed: {name:'오리고기 사료',description:'오리고기를 좋아하는 고양이를 부르는 사료입니다.',price:10},
  catChickenFeed: {name:'닭고기 사료',description:'닭고기를 좋아하는 고양이를 부르는 사료입니다.',price:10},
  egg: {
    name: '달걀',
    description: '닭장에서 얻은 신선한 달걀. 여러 요리와 가공품의 재료로 쓰인다.',
    price: 12
  },
  sugar: {
    name: '설탕',
    description: '사탕수수에서 얻은 달콤한 설탕. 과자와 달콤한 요리를 만들 때 사용한다.',
    price: 10
  },
  tofu: {
    name: '두부',
    description: '콩을 갈아 굳힌 부드러운 두부. 그대로 요리하거나 유부로 가공할 수 있다.',
    price: 8
  },
  flour: {
    name: '밀가루',
    description: '밀을 곱게 빻아 만든 가루. 국수와 과자 등 다양한 음식의 기본 재료다.',
    price: 5
  },
  saltedEgg: {
    name: '소금달걀',
    description: '달걀을 소금에 절여 만든 저장 식품. 짭조름한 맛이 특징이다.',
    price: 30
  },
  ricePowder: {
    name: '떡가루',
    description: '벼를 빻아 만든 고운 가루. 쫀득한 떡을 만드는 데 사용한다.',
    price: 12
  },
  eggPancake: {
    name: '계란전',
    description: '밀가루와 달걀을 섞어 노릇하게 부친 전. 따뜻할 때 먹으면 더욱 고소하다.',
    price: 40
  },
  pickledVegetables: {
    name: '절임채소',
    description: '배추를 절여 아삭한 식감을 살린 반찬. 여러 음식에 곁들여 먹기 좋다.',
    price: 22
  },
  friedTofu: {
    name: '유부',
    description: '두부를 가공해 만든 고소한 유부. 국물 요리나 속을 채운 음식에 사용한다.',
    price: 22
  }
};

// 상점 재료와 낚시 재료. 상점 재료는 재판매 불가(price 0), 생선은 추후 미니게임 보상 가치 25로 설정합니다.
Object.assign(window.dowonItemDescriptions,{
  fish:{name:'생선',description:'낚시 미니게임에서 얻는 생선. 여러 생선 요리의 재료로 사용한다.',price:25},
  bait:{name:'미끼',description:'낚시를 시작할 때 1개씩 사용하는 미끼. 상점 재료 탭에서 구매한다.',price:0},
  chickenMeat:{name:'닭고기',description:'상점 재료 탭에서 구매하는 닭고기. 요리 재료로 사용한다.',price:0},
  pork:{name:'돼지고기',description:'상점 재료 탭에서 구매하는 돼지고기. 요리 재료로 사용한다.',price:0},
  bitterMelon:{name:'여주',description:'상점 재료 탭에서 구매하는 여주. 쌉싸름한 요리에 사용한다.',price:0},
  shepherdsPurse:{name:'냉이',description:'상점 재료 탭에서 구매하는 냉이. 향긋한 요리에 사용한다.',price:0}
});

// 부엌 레시피별 음식 설명과 판매가. 세부 값은 cooking-recipes.js에서 편집합니다.
for (const recipe of (window.DOWON_COOKING_RECIPES || [])) {
  window.dowonItemDescriptions[recipe.output] = { name:recipe.name, description:'직접 만든 요리', price:recipe.price||0 };
}

/* 신규 품목: 판매가가 확정되면 price를 수정하세요. */
Object.assign(window.dowonItemDescriptions,{
  ramie:{name:"모시풀",description:"모시풀 · 신규 작물 또는 가공품입니다.",price:10},
  cotton:{name:"솜",description:"솜 · 신규 작물 또는 가공품입니다.",price:12},
  pumpkin:{name:"호박",description:"호박 · 신규 작물 또는 가공품입니다.",price:15},
  sweetPotato:{name:"고구마",description:"고구마 · 신규 작물 또는 가공품입니다.",price:18},
  sheepFeed:{name:"양 사료",description:"양 사료 · 신규 작물 또는 가공품입니다.",price:9},
  brownSugar:{name:"흑설탕",description:"흑설탕 · 신규 작물 또는 가공품입니다.",price:16},
  wool:{name:"양털",description:"양털 · 신규 작물 또는 가공품입니다.",price:16},
  stickyRiceCake:{name:"찹쌀떡",description:"찹쌀떡 · 신규 작물 또는 가공품입니다.",price:30},
  eggBread:{name:"계란빵",description:"계란빵 · 신규 작물 또는 가공품입니다.",price:80},
  pumpkinSeed:{name:"호박씨",description:"호박씨 · 신규 작물 또는 가공품입니다.",price:55},
  roastedSweetPotato:{name:"군고구마",description:"군고구마 · 신규 작물 또는 가공품입니다.",price:65},
  hempCloth:{name:"삼베",description:"삼베 · 신규 작물 또는 가공품입니다.",price:50},
  yarn:{name:"털실",description:"털실 · 신규 작물 또는 가공품입니다.",price:80},
  cottonFabric:{name:"면직물",description:"면직물 · 신규 작물 또는 가공품입니다.",price:60},
  clothDoll:{name:"수국",description:"수국 · 신규 작물 또는 가공품입니다.",price:150},
  sachet:{name:"향주머니",description:"향주머니 · 신규 작물 또는 가공품입니다.",price:130},
  roastedPotato:{name:"구운감자",description:"구운감자 · 가공소에서 제작한 생산품입니다.",price:45},
  grilledTofu:{name:"구운두부",description:"구운두부 · 가공소에서 제작한 생산품입니다.",price:35},
  potatoStarch:{name:"감자전분",description:"감자전분 · 가공소에서 제작한 생산품입니다.",price:30},
  sweetPotatoStarch:{name:"고구마 전분",description:"고구마 전분 · 가공소에서 제작한 생산품입니다.",price:65},
  soyMilk:{name:"두유",description:"두유 · 가공소에서 제작한 생산품입니다.",price:10},
  blackBeanPaste:{name:"검은콩장",description:"검은콩장 · 가공소에서 제작한 생산품입니다.",price:30},
  maltSyrup:{name:"엿",description:"엿 · 가공소에서 제작한 생산품입니다.",price:18},
  hotteok:{name:"호떡",description:"호떡 · 가공소에서 제작한 생산품입니다.",price:30},
  vegetablePancake:{name:"채소전",description:"채소전 · 가공소에서 제작한 생산품입니다.",price:75},
  potatoPancake:{name:"감자전",description:"감자전 · 가공소에서 제작한 생산품입니다.",price:100},
  pickledPotato:{name:"절임감자",description:"절임감자 · 가공소에서 제작한 생산품입니다.",price:55},
  tofuStick:{name:"푸주",description:"푸주 · 가공소에서 제작한 생산품입니다.",price:28},
  fermentedTofu:{name:"두부유",description:"두부유 · 가공소에서 제작한 생산품입니다.",price:38},
  tofuSkin:{name:"두부피",description:"두부피 · 가공소에서 제작한 생산품입니다.",price:36},
  steamedRiceCake:{name:"증편",description:"증편 · 가공소에서 제작한 생산품입니다.",price:85},
  pumpkinRiceCake:{name:"호박떡",description:"호박떡 · 가공소에서 제작한 생산품입니다.",price:90},
  glassNoodles:{name:"당면",description:"당면 · 가공소에서 제작한 생산품입니다.",price:40},
  driedBlackBeanPaste:{name:"말린검은콩장",description:"말린검은콩장 · 가공소에서 제작한 생산품입니다.",price:42},
});
