/* 부엌 레시피: 이 파일만 편집해 레시피를 추가하세요.
   id: 중복 없는 영문 키 / level: 해금 레벨(1~3)
   ingredients: 창고에 표시되는 한글 이름과 필요 개수 / emoji: 임시 아이콘
   output: 음식 창고 키 / name: 표시 이름
   icon: 음식 PNG 경로.
   price: 창고에서 판매할 때 개당 동전 가격. 일반 음식은 재료 가치 합계의 120%를 올림하여 책정합니다. */
window.DOWON_COOKING_RECIPES = [
    {
        id: 'Egg_yolk_manju',
        level: 1,
        name: '노른자만주',
        ingredients: {
            밀가루: 1,
            달걀: 2,
            설탕: 1
        },
        output: 'food_Egg_yolk_manju',
        emoji: '',
        icon: 'item/요리/노른자만주.png',
        price: 47
    },
    {
        id: 'Egg_noodles',
        level: 1,
        name: '계란국수',
        ingredients: {
            밀가루: 2,
            달걀: 2
        },
        output: 'food_Egg_noodles',
        emoji: '🍽️',
        icon: 'item/요리/계란국수.png',
        price: 41
    },
    {
        id: 'Twisted_Doughnut',
        level: 1,
        name: '꽈배기',
        ingredients: {
            밀가루: 1,
            설탕: 1
        },
        output: 'food_Twisted_Doughnut',
        emoji: '🍽️',
        icon: 'item/요리/꽈배기.png',
        price: 18
    },
    {
        id: 'Pickled_Vegetable_Tofu_Soup',
        level: 1,
        name: '절임채소두부국',
        ingredients: {
            두부: 1,
            절임채소: 1
        },
        output: 'food_Vegetable_Tofu_Soup',
        emoji: '🥘',
        icon: 'item/요리/절임채소두부국.png',
        price: 36
    },
    {
        id: 'Soft Tofu Stew',
        level: 1,
        name: '순두부찌개',
        ingredients: {
            두부: 1,
            고추: 2
        },
        output: 'food_Soft Tofu Stew',
        emoji: '🥘',
        icon: 'item/요리/순두부찌개.png',
        price: 24
    },
    {
        id: 'Clear_Napa_Cabbage_Soup',
        level: 1,
        name: '맑은채소배추국',
        ingredients: {
            두부: 1,
            절임채소: 1
        },
        output: 'food_Clear_Napa_Cabbage_Soup',
        emoji: '🥘',
        icon: 'item/요리/맑은배추국.png',
        price: 36
    },
    {
        id: 'Egg_Fried_Rice',
        level: 1,
        name: '계란볶음밥',
        ingredients: {
            벼: 2,
            달걀: 2
        },
        output: 'food_Egg_Fried_Rice',
        emoji: '🥘',
        icon: 'item/요리/계란볶음밥.png',
        price: 39
    },
    {
        id: 'Steamed_Pickled_Vegetables_Fish',
        level: 2,
        name: '절임채소생선찜',
        ingredients: {
            절임채소: 3,
            생선: 1,
            고추: 2
        },
        output: 'food_Steamed_Pickled_Vegetables_Fish',
        emoji: '🍲',
        icon: 'item/요리/절임채소생선찜.png',
        price: 124
    },
    {
        id: 'Crucian_Tofu_Soup',
        level: 2,
        name: '붕어두부탕',
        ingredients: {
            생선: 1,
            두부: 1
        },
        output: 'food_Crucian_Tofu_Soup',
        emoji: '🍲',
        icon: 'item/요리/붕어두부탕.png',
        price: 40
    },
    {
        id: 'Pepper_Fried_Chicken',
        level: 2,
        name: '고추닭튀김',
        ingredients: {
            닭고기: 1,
            고추: 2
        },
        output: 'food_Pepper_Fried_Chicken',
        emoji: '🍗',
        icon: 'item/요리/고추닭튀김.png',
        price: 57
    },
    {
        id: 'Chicken_Tofu_Stir_Fry',
        level: 2,
        name: '닭두부볶음',
        ingredients: {
            닭고기: 1,
            두부: 1
        },
        output: 'food_Chicken_Tofu_Stir_Fry',
        emoji: '🍲',
        icon: 'item/요리/닭두부볶음.png',
        price: 52
    },
    {
        id: 'Sweet_Sour_Pork',
        level: 2,
        name: '탕수육',
        ingredients: {
            돼지고기: 1,
            설탕: 1
        },
        output: 'food_Sweet_Sour_Pork',
        emoji: '🍖',
        icon: 'item/요리/탕수육.png',
        price: 66
    },
    {
        id: 'Pickled_Vegetables_Boiled_Pork_Soup',
        level: 2,
        name: '절임채소수육탕',
        ingredients: {
            돼지고기: 1,
            절임채소: 1
        },
        output: 'food_Pickled_Vegetables_Boiled_Pork_Soup',
        emoji: '🍲',
        icon: 'item/요리/절임채소수육탕.png',
        price: 81
    },
    {
        id: 'Potato_Stir_Fry',
        level: 3,
        name: '감자볶음',
        ingredients: {
            감자: 2,
            고추: 3
        },
        output: 'food_Potato_Stir_Fry',
        emoji: '🥔',
        icon: 'item/요리/감자볶음.png',
        price: 41
    },
    {
        id: 'Meat_Hotteok',
        level: 3,
        name: '고기호떡',
        ingredients: {
            돼지고기: 1,
            밀가루: 2
        },
        output: 'food_Meat_Hotteok',
        emoji: '🥟',
        icon: 'item/요리/고기호떡.png',
        price: 66
    },
    {
        id: 'Pepper_Steamed_Fish',
        level: 3,
        name: '고추생선찜',
        ingredients: {
            생선: 1,
            고추: 3
        },
        output: 'food_Pepper_Steamed_Fish',
        emoji: '🐟',
        icon: 'item/요리/고추생선찜.png',
        price: 52
    },
    {
        id: 'Bitter_Melon_Pork_Soup',
        level: 3,
        name: '여주돼지탕',
        ingredients: {
            돼지고기: 1,
            여주: 1
        },
        output: 'food_Bitter_Melon_Pork_Soup',
        emoji: '🍲',
        icon: 'item/요리/여주돼지탕.png',
        price: 72
    },
    {
        id: 'Bitter_Melon_Egg_Stir_Fry',
        level: 3,
        name: '여주계란볶음',
        ingredients: {
            여주: 2,
            달걀: 3
        },
        output: 'food_Bitter_Melon_Egg_Stir_Fry',
        emoji: '🍳',
        icon: 'item/요리/여주계란볶음.png',
        price: 80
    },
    {
        id: 'Shepherds_Purse_Meat_Dumpling',
        level: 3,
        name: '냉이고기왕만두',
        ingredients: {
            밀가루: 1,
            돼지고기: 1,
            냉이: 2
        },
        output: 'food_Shepherds_Purse_Meat_Dumpling',
        emoji: '🥟',
        icon: 'item/요리/냉이고기왕만두.png',
        price: 89
    },
    // 히든 레시피는 기존처럼 판매 불가로 유지합니다.
    {
        id: 'hidden_Cheongmyeong_Plum_Wine',
        level: 1,
        residentName: '청명',
        name: '매화주',
        ingredients: { 사탕수수: 10 },
        output: 'food_hidden_Plum_Wine',
        emoji: '🍶',
        icon: 'item/요리/술.png',
        price: 0
    },
    {
        id: 'hidden_Dangbo_Poison_Wine',
        level: 1,
        residentName: '당보',
        name: '특제 독주',
        ingredients: { paddy: 10 },
        output: 'food_hidden_Poison_Wine',
        emoji: '🍶',
        icon: 'item/요리/독주.png',
        price: 0
    }
];
