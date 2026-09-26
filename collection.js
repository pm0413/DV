(() => {
  'use strict';
  const STORAGE_KEY = 'dangcheong-dowon-collection-v1';
  const $ = id => document.getElementById(id);
  const discovered = load();
  let activeTab = 'crop';
  let selectedKey = null;

  function load(){
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(raw&&typeof raw==='object'){
        const recipeKeys=new Set((window.DOWON_COOKING_RECIPES||[]).map(recipe=>recipe.output));
        const legacyFood=Array.isArray(raw.food)?raw.food:[];
        return {
          crop:Array.isArray(raw.crop)?raw.crop:[],
          processed:Array.isArray(raw.processed)?raw.processed:legacyFood.filter(key=>!recipeKeys.has(key)),
          cooking:Array.isArray(raw.cooking)?raw.cooking:legacyFood.filter(key=>recipeKeys.has(key)),
          fish:Array.isArray(raw.fish)?raw.fish:[],
          cat:Array.isArray(raw.cat)?raw.cat:[]
        };
      }
    }catch(error){console.warn('도감 저장 데이터를 읽지 못했습니다.',error);}
    return {crop:[],processed:[],cooking:[],fish:[],cat:[]};
  }
  function save(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(discovered));}
    catch(error){console.warn('도감 저장 실패',error);}
  }
  function uniquePush(category,key){
    if(!key||!discovered[category]||discovered[category].includes(key))return false;
    discovered[category].push(key);save();return true;
  }
  function cropEntries(){
    return Object.entries(cropData).map(([key,data])=>({
      key,name:data.name,image:`item/작물/${data.readyIcon}`,description:window.dowonItemDescriptions?.[key]?.description||`${data.name}을(를) 수확하면 도감에 등록됩니다.`
    }));
  }
  const processedCatalog={
    chickenFeed:'닭 사료',egg:'달걀',sugar:'설탕',tofu:'두부',flour:'밀가루',saltedEgg:'소금달걀',ricePowder:'떡가루',eggPancake:'달걀지단',pickledVegetables:'절임채소',friedTofu:'유부',sachet:'향낭',clothDoll:'천인형',cottonFabric:'무명천',yarn:'실',hempCloth:'모시천',roastedSweetPotato:'군고구마',pumpkinSeed:'호박씨',eggBread:'계란빵',stickyRiceCake:'찹쌀떡',wool:'양털',brownSugar:'흑설탕',sheepFeed:'양 사료',roastedPotato:'군감자',grilledTofu:'구운두부',potatoStarch:'감자전분',sweetPotatoStarch:'고구마전분'
  };
  function processedEntries(){
    return Object.entries(processedCatalog)
      .filter(([key])=>Object.prototype.hasOwnProperty.call(warehouse,key))
      .map(([key,name])=>({key,name,image:`item/가공품/${name}.png`,description:window.dowonItemDescriptions?.[key]?.description||`${name}을(를) 처음 획득하면 등록됩니다.`}));
  }
  function cookingEntries(){
    return (window.DOWON_COOKING_RECIPES||[]).map(recipe=>({key:recipe.output,name:recipe.name,image:recipe.icon||`item/요리/${recipe.name}.png`,description:window.dowonItemDescriptions?.[recipe.output]?.description||`${recipe.name}을(를) 처음 요리하면 등록됩니다.`}));
  }
  const FISH_COLLECTION_KEY='dangcheong-dowon-fishing-collection-v1';
  const fishCatalog=[
    {key:'pearl-fish',grade:'A',name:'진주어',image:'item/낚시/A물고기/진주어.png'},
    {key:'freshwater-fish',grade:'B',name:'민물고기',image:'item/낚시/B물고기/민물고기.png'},
    {key:'shrimp',grade:'C',name:'새우',image:'item/낚시/C물고기/새우.png'}
  ];
  function fishingState(){
    try{return JSON.parse(localStorage.getItem(FISH_COLLECTION_KEY)||'null')||{};}catch(_){return {};}
  }
  function fishEntries(){
    const state=fishingState();
    return fishCatalog.map(fish=>{
      const count=Number(state.counts?.[fish.key])||0;
      const bestSize=Number(state.bestSize?.[fish.key])||0;
      const bestWeight=Number(state.bestWeight?.[fish.key])||0;
      const measure=count>0?` · 잡은 횟수 ${count} · 최대 ${bestSize.toFixed(1)}cm / ${bestWeight>=1000?(bestWeight/1000).toFixed(2)+'kg':bestWeight.toFixed(0)+'g'}`:'';
      return {...fish,description:`${fish.grade}등급 물고기${measure}`};
    });
  }
  function syncFishing(){
    const state=fishingState();let changed=false;
    for(const fish of fishCatalog)if((Number(state.counts?.[fish.key])||0)>0)changed=uniquePush('fish',fish.key)||changed;
    if(changed&&isOpen())render();
  }
  function catEntries(){
    return (window.DOWON_CAT_CONFIG||[]).map(cat=>({key:cat.id,name:cat.name,image:cat.image,description:cat.personality||'마을을 찾아오는 고양이입니다.'}));
  }
  function entries(category){
    return category==='crop'?cropEntries():category==='processed'?processedEntries():category==='cooking'?cookingEntries():category==='fish'?fishEntries():catEntries();
  }
  function inventoryCategory(key){
    if(Object.prototype.hasOwnProperty.call(cropData,key))return 'crop';
    if(processedEntries().some(item=>item.key===key))return 'processed';
    return cookingEntries().some(item=>item.key===key)?'cooking':null;
  }
  function syncInventory(){
    let changed=false;
    for(const [key,count] of Object.entries(warehouse)){
      if(!(Number(count)>0))continue;
      const category=inventoryCategory(key);
      if(category)changed=uniquePush(category,key)||changed;
    }
    if(changed&&isOpen())render();
  }
  function syncLegacyCats(){
    try{
      const state=JSON.parse(localStorage.getItem('dangcheong-dowon-cats-v1')||'null');
      if(!state?.cats)return;
      let changed=false;
      for(const [id,profile] of Object.entries(state.cats))if((profile?.visits||0)>0)changed=uniquePush('cat',id)||changed;
      if(changed&&isOpen())render();
    }catch(error){console.warn('기존 고양이 발견 기록을 도감으로 옮기지 못했습니다.',error);}
  }
  function isOpen(){return !$('collection-dialog')?.hidden;}
  function totals(){
    const result={}; let found=0,total=0;
    for(const category of ['crop','processed','cooking','fish','cat']){
      const list=entries(category);const keys=new Set(list.map(x=>x.key));const count=discovered[category].filter(key=>keys.has(key)).length;
      result[category]={count,total:list.length};found+=count;total+=list.length;
    }
    return {result,found,total};
  }
  function updateSummary(){
    const {result,found,total}=totals();
    $('collection-total').textContent=`${found} / ${total}`;
    $('collection-percent').textContent=`전체 수집률 ${total?Math.round(found/total*100):0}%`;
    for(const category of ['crop','processed','cooking','fish','cat'])$('collection-count-'+category).textContent=`${result[category].count}/${result[category].total}`;
  }
  function renderDetail(item,known){
    const detail=$('collection-detail');detail.replaceChildren();
    const visual=known?document.createElement('img'):document.createElement('div');
    if(known){visual.src=item.image;visual.alt=item.name;}else{visual.className='collection-detail-unknown';visual.textContent='?';}
    const name=document.createElement('strong');name.textContent=known?item.name:'???';
    const text=document.createElement('p');text.textContent=known?(item.description||'도감에 등록된 항목입니다.'):'아직 발견하지 못한 항목입니다.';
    detail.append(visual,name,text);
  }
  function render(){
    updateSummary();
    document.querySelectorAll('[data-collection-tab]').forEach(button=>{
      const on=button.dataset.collectionTab===activeTab;button.classList.toggle('is-active',on);button.setAttribute('aria-selected',String(on));
    });
    const grid=$('collection-grid');grid.replaceChildren();
    const list=entries(activeTab); const known=new Set(discovered[activeTab]);
    for(const item of list){
      const found=known.has(item.key);const button=document.createElement('button');button.type='button';button.className='collection-card'+(found?' is-found':' is-unknown');button.dataset.key=item.key;
      const visual=document.createElement('span');visual.className='collection-card-visual';
      if(found){const img=document.createElement('img');img.src=item.image;img.alt='';visual.append(img);}else visual.textContent='?';
      const name=document.createElement('span');name.className='collection-card-name';name.textContent=found?item.name:'???';button.append(visual,name);
      button.addEventListener('click',()=>{selectedKey=item.key;renderDetail(item,found);});grid.append(button);
    }
    const selected=list.find(item=>item.key===selectedKey);if(selected)renderDetail(selected,known.has(selected.key));else $('collection-detail').innerHTML='<span>항목을 선택해 주세요.</span>';
  }
  function open(){syncInventory();syncLegacyCats();syncFishing();$('collection-backdrop').hidden=false;$('collection-dialog').hidden=false;$('menu-collection')?.setAttribute('aria-expanded','true');render();}
  function close(){$('collection-backdrop').hidden=true;$('collection-dialog').hidden=true;$('menu-collection')?.setAttribute('aria-expanded','false');}

  window.dowonCollection={syncInventory,discover:(category,key)=>{const changed=uniquePush(category,key);if(changed&&isOpen())render();return changed;},open,close};
  $('menu-collection')?.addEventListener('click',open);
  $('collection-close')?.addEventListener('click',close);
  $('collection-backdrop')?.addEventListener('click',close);
  document.querySelectorAll('[data-collection-tab]').forEach(button=>button.addEventListener('click',()=>{activeTab=button.dataset.collectionTab;selectedKey=null;render();}));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&isOpen())close();});
  document.addEventListener('dowon:activity',event=>{if(event.detail?.type==='cat-visit'&&event.detail.catId)window.dowonCollection.discover('cat',event.detail.catId);});
  syncInventory();syncLegacyCats();syncFishing();
})();
