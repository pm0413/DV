/* 주민 주문·부탁 공통 품목: 작물 / 가공품 / 실제 조리 가능한 부엌 음식.
   고양이 사료와 가구는 주문 대상에서 제외합니다. */
(() => {
  'use strict';
  const definitions = [
    {key:'rice', kind:'crop'}, {key:'bean', kind:'crop'},
    {key:'sugarcane', kind:'crop', comfort:50}, {key:'paddy', kind:'crop', comfort:100}, {key:'cabbage', kind:'crop', comfort:200}, {key:'pepper', kind:'crop', comfort:300}, {key:'potato', kind:'crop', comfort:400},
    {key:'flour', workshop:'mill'}, {key:'ricePowder', workshop:'mill', comfort:100},
    {key:'tofu', workshop:'tofu'}, {key:'chickenFeed', workshop:'chopper'},
    {key:'egg', workshop:'coop'}, {key:'sugar', workshop:'sugar'},
    {key:'eggPancake', workshop:'pancake'},
    {key:'saltedEgg', workshop:'salter'},
    {key:'pickledVegetables', workshop:'salter', comfort:200},
    {key:'friedTofu', workshop:'tofu-processing'}
  ];
  const descriptions=window.dowonItemDescriptions||{};
  const ingredientKey=name=>name==='계란'?'egg':Object.hasOwn(descriptions,name)?name:Object.keys(descriptions).find(key=>descriptions[key]?.name===name);
  const ingredientExists=name=>Boolean(ingredientKey(name));
  // 레시피에 아직 등록되지 않은 재료가 있으면 제작할 수 없으므로 주민이 요구하지 않습니다.
  const cooked=(window.DOWON_COOKING_RECIPES||[]).filter(recipe=>recipe?.output && !recipe.residentName &&
    Number.isSafeInteger(recipe.price)&&recipe.price>0 && Number.isInteger(recipe.level) &&
    Object.keys(recipe.ingredients||{}).every(ingredientExists)).map(recipe=>({
      key:recipe.output,kind:'food',level:recipe.level,image:recipe.icon||'',
      materials:Object.keys(recipe.ingredients||{}).map(ingredientKey)
    }));
  const catalog = Object.freeze(Object.fromEntries([...definitions.map(def=>({...def,kind:def.kind||'processed'})),...cooked].map(def => {
    const item = window.dowonItemDescriptions?.[def.key];
    if(!item || !Number.isSafeInteger(item.price) || item.price < 1)
      throw new Error(`부탁 품목 ${def.key}의 창고 판매가를 확인해 주세요.`);
    return [def.key, Object.freeze({
      ...def, name:item.name, image:def.image||`item/${def.kind==='crop'?'작물':'가공품'}/${item.name}.png`, price:item.price
    })];
  })));
  const has = key => Object.hasOwn(catalog,key);
  const isAvailable = key => {
    const item = catalog[key];
    if(!item) return false;
    const progression = window.dowonProgression;
    if(item.comfort && !progression?.hasComfort?.(item.comfort)) return false;
    if(item.workshop && !progression?.isBuilt?.(item.workshop)) return false;
    if(item.level && (window.dowonKitchen?.get?.()?.level||1)<item.level) return false;
    // 음식에 필요한 작물·가공품이 아직 해금되지 않았다면 해당 음식도 주문에서 제외합니다.
    if(item.kind==='food' && item.materials?.some(ingredient=>!catalog[ingredient]||!isAvailable(ingredient))) return false;
    return true;
  };
  const qtyRange=key=>catalog[key]?.kind==='crop'?[30,50]:catalog[key]?.kind==='food'?[1,1]:[2,3];
  const drawQty=key=>{const [min,max]=qtyRange(key);return min+Math.floor(Math.random()*(max-min+1));};
  const validQty=(key,qty)=>has(key)&&Number.isInteger(qty)&&qty>=qtyRange(key)[0]&&qty<=qtyRange(key)[1];
  window.dowonRequestItems = Object.freeze({
    catalog, keys:Object.freeze(Object.keys(catalog)), has, isAvailable,qtyRange,drawQty,validQty,
    availableKeys:() => Object.keys(catalog).filter(isAvailable),
    saleTotal:lines => lines.reduce((sum,line) => sum + (catalog[line.key]?.price||0)*line.qty, 0),
    orderReward:lines => Math.ceil(lines.reduce((sum,line) => sum + (catalog[line.key]?.price||0)*line.qty, 0)*1.2)
  });
})();
