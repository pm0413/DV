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
  // 가공품 도감 이름/이미지는 실제 창고에서 사용하는 파일명과 동일하게 유지한다.
  const processedCatalog={
    chickenFeed:'닭 사료',egg:'달걀',sugar:'설탕',tofu:'두부',flour:'밀가루',saltedEgg:'소금달걀',
    ricePowder:'떡가루',eggPancake:'계란전',pickledVegetables:'절임채소',friedTofu:'유부',
    sheepFeed:'양 사료',brownSugar:'흑설탕',wool:'양털',stickyRiceCake:'찹쌀떡',eggBread:'계란빵',
    pumpkinSeed:'호박씨',roastedSweetPotato:'군고구마',hempCloth:'삼베',yarn:'털실',cottonFabric:'면직물',
    clothDoll:'수국',sachet:'향주머니',roastedPotato:'구운감자',grilledTofu:'구운두부',potatoStarch:'감자전분',
    sweetPotatoStarch:'고구마 전분',soyMilk:'두유',blackBeanPaste:'검은콩장',maltSyrup:'엿',hotteok:'호떡',
    vegetablePancake:'채소전',potatoPancake:'감자전',pickledPotato:'절임감자',tofuStick:'푸주',
    fermentedTofu:'두부유',tofuSkin:'두부피',steamedRiceCake:'증편',pumpkinRiceCake:'호박떡',
    glassNoodles:'당면',driedBlackBeanPaste:'말린검은콩장'
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
    {key:'fish-s-01',grade:'S',name:'낙화리',image:'item/낚시/S등급/낙화리.png'},
    {key:'fish-s-02',grade:'S',name:'도화리',image:'item/낚시/S등급/도화리.png'},
    {key:'fish-s-03',grade:'S',name:'만년화리',image:'item/낚시/S등급/만년화리.png'},
    {key:'fish-s-04',grade:'S',name:'빙정어',image:'item/낚시/S등급/빙정어.png'},
    {key:'fish-s-05',grade:'S',name:'성월어',image:'item/낚시/S등급/성월어.png'},
    {key:'fish-s-06',grade:'S',name:'유광접어',image:'item/낚시/S등급/유광접어.png'},
    {key:'fish-s-07',grade:'S',name:'자미성어',image:'item/낚시/S등급/자미성어.png'},
    {key:'fish-s-08',grade:'S',name:'청엽어',image:'item/낚시/S등급/청엽어.png'},
    {key:'fish-s-09',grade:'S',name:'청옥리',image:'item/낚시/S등급/청옥리.png'},
    {key:'fish-s-10',grade:'S',name:'흑염어',image:'item/낚시/S등급/흑염어.png'},
    {key:'fish-a-01',grade:'A',name:'가물치',image:'item/낚시/A등급/가물치.png'},
    {key:'fish-a-02',grade:'A',name:'대두어',image:'item/낚시/A등급/대두어.png'},
    {key:'fish-a-03',grade:'A',name:'무지개송어',image:'item/낚시/A등급/무지개송어.png'},
    {key:'fish-a-04',grade:'A',name:'백련어',image:'item/낚시/A등급/백련어.png'},
    {key:'fish-a-05',grade:'A',name:'뱀장어',image:'item/낚시/A등급/뱀장어.png'},
    {key:'fish-a-06',grade:'A',name:'쏘가리',image:'item/낚시/A등급/쏘가리.png'},
    {key:'fish-a-07',grade:'A',name:'은어',image:'item/낚시/A등급/은어.png'},
    {key:'fish-a-08',grade:'A',name:'종어',image:'item/낚시/A등급/종어.png'},
    {key:'fish-b-01',grade:'B',name:'꺽지',image:'item/낚시/B등급/꺽지.png'},
    {key:'fish-b-02',grade:'B',name:'끄리',image:'item/낚시/B등급/끄리.png'},
    {key:'fish-b-03',grade:'B',name:'누치',image:'item/낚시/B등급/누치.png'},
    {key:'fish-b-04',grade:'B',name:'대농갱어',image:'item/낚시/B등급/대농갱어.png'},
    {key:'fish-b-05',grade:'B',name:'동자개',image:'item/낚시/B등급/동자개.png'},
    {key:'fish-b-06',grade:'B',name:'메기',image:'item/낚시/B등급/메기.png'},
    {key:'fish-b-07',grade:'B',name:'미유기',image:'item/낚시/B등급/미유기.png'},
    {key:'fish-b-08',grade:'B',name:'빙어',image:'item/낚시/B등급/빙어.png'},
    {key:'fish-b-09',grade:'B',name:'잉어',image:'item/낚시/B등급/잉어.png'},
    {key:'fish-b-10',grade:'B',name:'초어',image:'item/낚시/B등급/초어.png'},
    {key:'fish-b-11',grade:'B',name:'큰입배스',image:'item/낚시/B등급/큰입배스.png'},
    {key:'fish-b-12',grade:'B',name:'향어',image:'item/낚시/B등급/향어.png'},
    {key:'fish-c-01',grade:'C',name:'갈겨니',image:'item/낚시/C등급/갈겨니.png'},
    {key:'fish-c-02',grade:'C',name:'강준치',image:'item/낚시/C등급/강준치.png'},
    {key:'fish-c-03',grade:'C',name:'돌고기',image:'item/낚시/C등급/돌고기.png'},
    {key:'fish-c-04',grade:'C',name:'떡붕어',image:'item/낚시/C등급/떡붕어.png'},
    {key:'fish-c-05',grade:'C',name:'모래무지',image:'item/낚시/C등급/모래무지.png'},
    {key:'fish-c-06',grade:'C',name:'미꾸라지',image:'item/낚시/C등급/미꾸라지.png'},
    {key:'fish-c-07',grade:'C',name:'밀어',image:'item/낚시/C등급/밀어.png'},
    {key:'fish-c-08',grade:'C',name:'붕어',image:'item/낚시/C등급/붕어.png'},
    {key:'fish-c-09',grade:'C',name:'블루길',image:'item/낚시/C등급/블루길.png'},
    {key:'fish-c-10',grade:'C',name:'참갈겨니',image:'item/낚시/C등급/참갈겨니.png'},
    {key:'fish-c-11',grade:'C',name:'피라미',image:'item/낚시/C등급/피라미.png'}
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
      return {...fish,description:fish.grade==='S'&&count>0?`S등급 환상어 · 소장 1마리${measure}`:`${fish.grade}등급 물고기${measure}`};
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
    const isFish=activeTab==='fish';
    const visual=document.createElement('img');
    visual.src=item.image;
    visual.alt=known?item.name:'미발견 항목';
    if(!known)visual.className='collection-detail-silhouette';
    detail.append(visual);
    const name=document.createElement('strong');name.textContent=known?item.name:'미발견';
    const text=document.createElement('p');text.textContent=known?(item.description||'도감에 등록된 항목입니다.'):(isFish?'아직 잡지 못했습니다.':'아직 발견하지 못한 항목입니다.');
    detail.append(name,text);
  }
  function render(){
    updateSummary();
    document.querySelectorAll('[data-collection-tab]').forEach(button=>{
      const on=button.dataset.collectionTab===activeTab;button.classList.toggle('is-active',on);button.setAttribute('aria-selected',String(on));
    });
    const grid=$('collection-grid');grid.replaceChildren();
    const list=entries(activeTab); const known=new Set(discovered[activeTab]);
    for(const item of list){
      const found=known.has(item.key);const isFish=activeTab==='fish';const button=document.createElement('button');button.type='button';button.className='collection-card'+(found?' is-found':' is-unknown')+(isFish&&item.grade?' fish-card grade-'+item.grade.toLowerCase():'');button.dataset.key=item.key;
      if(isFish&&item.grade){const badge=document.createElement('span');badge.className='collection-fish-grade';badge.textContent=`${item.grade}등급`;button.append(badge);}
      const visual=document.createElement('span');visual.className='collection-card-visual';
      const img=document.createElement('img');img.src=item.image;img.alt='';if(!found)img.className='collection-item-silhouette';visual.append(img);
      const name=document.createElement('span');name.className='collection-card-name';name.textContent=found?item.name:'미발견';button.append(visual,name);
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
