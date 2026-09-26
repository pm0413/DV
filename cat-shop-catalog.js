/* 반려동물 상점: 고양이 놀이용 장난감은 구매 후 소모되지 않으며,
   쾌적도가 아닌 고양이 호감도를 올립니다. 이름/가격/증가량은 여기서 수정하세요. */
window.DOWON_CAT_TOYS = [
  {key:'cat_rattan_ball',name:'라탄공',price:100,affection:10,comfort:0,image:'item/장식/고양이 가구/라탄공.png'},
  {key:'cat_fishing_rod',name:'낚싯대',price:180,affection:20,comfort:0,image:'item/장식/고양이 가구/낚싯대.png'},
  {key:'cat_catnip_pouch',name:'캣닙주머니',price:320,affection:40,comfort:0,image:'item/장식/고양이 가구/캣닙주머니.png'}
];
window.DOWON_CAT_SHOP_THEMES = [
  {id:'cat-decoration',title:'고양이 장난감',items:[
    ...window.DOWON_CAT_TOYS
  ]},
  {id:'cat-furniture',title:'고양이 가구',items:[
    {key:'cat_rattan_house',name:'등나무집',price:10000,comfort:200,adoptionBonus:3,oneTime:true,image:'item/장식/고양이 가구/등나무집.png'}
  ]}
];
