/* 전원생활일지 부엌: 레벨은 1→2:40EXP, 2→3:80EXP; 승급 시 경험치 0부터 시작.
   일반 성공 +2EXP / 완벽 성공 +6EXP / 자동 요리 +4EXP. 완벽일 때만 숙련도 +1(최대 4).
   이 미니게임은 사용자가 제공한 반원형 게이지 스크린샷을 바탕으로 구현했습니다. */
(() => {
 'use strict';
 const recipes=(window.DOWON_COOKING_RECIPES||[]).filter(r=>r&&r.id&&r.output&&r.ingredients&&r.level>=1&&r.level<=3);
 const byId=new Map(recipes.map(r=>[r.id,r]));
 const RESIDENT_STORAGE='dangcheong-dowon-player-residents-v1';
 function visible(recipe){
   if(!recipe.residentName)return true;
   try{
     const saved=JSON.parse(localStorage.getItem(RESIDENT_STORAGE)||'[]');
     return Array.isArray(saved)&&saved.some(resident=>resident&&typeof resident.name==='string'&&resident.name.trim()===recipe.residentName);
   }catch(_){return false;}
 }
 const availableRecipes=()=>recipes.filter(visible);
 const $=id=>document.getElementById(id);
 const menu=$('menu-kitchen'),dialog=$('kitchen-dialog'),backdrop=$('kitchen-backdrop'),closeButton=$('kitchen-close');
 if(!menu||!dialog||!backdrop||!closeButton)return;
 const list=$('kitchen-recipe-list'),actions=$('kitchen-actions'),minigame=$('kitchen-minigame'),resultPanel=$('kitchen-result-panel'),needle=$('kitchen-needle');
 const STORAGE='dangcheong-dowon-kitchen-v1';
 const totals={1:40,2:80,3:80};
 const state={level:1,exp:0,mastery:{}};
 const collapsed={1:false,2:false,3:false};
 try{
   const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');
   if(saved&&typeof saved==='object'){
     if([1,2,3].includes(saved.level))state.level=saved.level;
     if(Number.isSafeInteger(saved.exp)&&saved.exp>=0)state.exp=Math.min(saved.exp,totals[state.level]);
     if(saved.mastery&&typeof saved.mastery==='object'){
       for(const recipe of recipes){const val=saved.mastery[recipe.id];if(Number.isSafeInteger(val)&&val>=0)state.mastery[recipe.id]=Math.min(4,val);}
     }
   }
 }catch(error){console.warn('부엌 저장 데이터 읽기 실패',error);}
 const save=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(state));return true;}catch(error){console.warn('부엌 저장 실패',error);return false;}};
 const inventory=()=>window.dowonInventory;
 // 창고에서 표시되는 한글 아이템명을 실제 창고 키로 연결합니다.
 // 기존 영문 키로 작성된 레시피도 그대로 호환됩니다.
 const ITEM_ALIASES={계란:'egg'}; // 창고 표시명 '달걀'의 관용 표기
 function inventoryKey(name){
   const descriptions=window.dowonItemDescriptions||{};
   if(Object.prototype.hasOwnProperty.call(descriptions,name))return name;
   if(Object.prototype.hasOwnProperty.call(ITEM_ALIASES,name))return ITEM_ALIASES[name];
   const match=Object.entries(descriptions).find(([,data])=>data&&data.name===name);
   return match?match[0]:name;
 }
 const count=name=>Number(inventory()?.get?.(inventoryKey(name)))||0;
 const mastery=recipe=>state.mastery[recipe.id]||0;
 const unlocked=recipe=>visible(recipe)&&state.level>=recipe.level;
 const enough=recipe=>Object.entries(recipe.ingredients).every(([key,n])=>Number.isSafeInteger(n)&&n>0&&count(key)>=n);

 const itemName=key=>window.dowonItemDescriptions?.[key]?.name||key;
 const icon=(recipe,elm)=>{
   elm.replaceChildren();
   if(recipe.icon){const img=document.createElement('img');img.src=recipe.icon;img.alt='';img.onerror=()=>{if(img.isConnected)elm.textContent=recipe.emoji||'🍲';};elm.append(img);}
   else elm.textContent=recipe.emoji||'🍲';
 };
 let selected=recipes[0]?.id||null;
 let running=false,animationId=0,angle=-Math.PI*0.83,direction=1,previousTime=null,lastFocused=null;
 let stage='idle'; // idle / timing / result
 const completeOverlay=$('kitchen-complete');
 let completeTimer=0;
 function clearComplete(){
   if(completeTimer){clearTimeout(completeTimer);completeTimer=0;}
   if(completeOverlay)completeOverlay.hidden=true;
 }
 function stopAnimation(){running=false;cancelAnimationFrame(animationId);animationId=0;previousTime=null;}
 function setMessage(s){$('kitchen-message').textContent=s||'';}
 function refreshHeader(){
   const level=state.level,target=totals[level];
   $('kitchen-level').textContent=String(level);
   $('kitchen-experience').textContent=`${state.exp} / ${target} EXP`;
   $('kitchen-level-info').textContent=level===3?'3레벨 · 최대 레벨':'다음 레벨까지';
   $('kitchen-exp-fill').style.width=`${state.exp/target*100}%`;
 }
 function selectRecipe(id){if(stage!=='idle'||!byId.has(id)||!visible(byId.get(id)))return;selected=id;const recipe=byId.get(id);if(recipe)collapsed[recipe.level]=false;setMessage('');render();}
 function toggleLevel(level){collapsed[level]=!collapsed[level];renderList();}
 function renderList(){
   const recipesByLevel=availableRecipes().reduce((acc,recipe)=>{(acc[recipe.level]||(acc[recipe.level]=[])).push(recipe);return acc;},{});
   const availableLevels=[1,2,3].filter(level=>recipesByLevel[level]?.length);
   list.replaceChildren();
   for(const level of availableLevels){
     const section=document.createElement('section');section.className='kitchen-level-group';
     section.classList.toggle('is-collapsed',!!collapsed[level]);
     const header=document.createElement('button');header.type='button';header.className='kitchen-level-toggle';
     header.setAttribute('aria-expanded',String(!collapsed[level]));
     header.setAttribute('aria-controls',`kitchen-level-panel-${level}`);
     const titleWrap=document.createElement('span');titleWrap.className='kitchen-level-toggle-copy';
     const title=document.createElement('strong');title.textContent=`${level}레벨 레시피 모음`;
     const meta=document.createElement('small');meta.textContent=`${recipesByLevel[level].length}개`;
     titleWrap.append(title,meta);
     const arrow=document.createElement('span');arrow.className='kitchen-level-toggle-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='▾';
     header.append(titleWrap,arrow);
     header.addEventListener('click',(event)=>{event.preventDefault();event.stopPropagation();toggleLevel(level);});
     const panel=document.createElement('div');panel.className='kitchen-level-recipes';panel.id=`kitchen-level-panel-${level}`;
     panel.hidden=!!collapsed[level];panel.style.display=collapsed[level]?'none':'flex';
     for(const recipe of recipesByLevel[level]){
       const btn=document.createElement('button');btn.type='button';btn.className='kitchen-recipe';
       btn.classList.toggle('is-selected',selected===recipe.id);
       btn.classList.toggle('is-locked',!unlocked(recipe));
       btn.setAttribute('aria-pressed',String(selected===recipe.id));
       const pic=document.createElement('span');pic.className='kitchen-recipe-emoji';icon(recipe,pic);
       const content=document.createElement('span');content.className='kitchen-recipe-meta';
       const titleRow=document.createElement('span');titleRow.className='kitchen-recipe-title-row';
       const name=document.createElement('strong');name.textContent=recipe.name;
       titleRow.append(name);
       // 재료를 모두 갖추고 현재 요리 레벨에서 해금된 음식만 체크 표시합니다.
       if(unlocked(recipe)&&enough(recipe)){
         const ready=document.createElement('span');
         ready.className='material-symbols-outlined kitchen-recipe-ready';
         ready.textContent='check_circle';
         ready.title='만들 수 있음';
         ready.setAttribute('aria-label','만들 수 있음');
         titleRow.append(ready);
       }
       const tag=document.createElement('small');tag.textContent=!unlocked(recipe)?`🔒 요리 ${recipe.level}레벨에 해금`:mastery(recipe)===4?'✓ 자동 요리 가능':`숙련도 ${mastery(recipe)}/4`;
       content.append(titleRow,tag);btn.append(pic,content);btn.addEventListener('click',()=>selectRecipe(recipe.id));
       panel.append(btn);
     }
     section.append(header,panel);
     list.append(section);
   }
 }
 function renderDetail(){
   const recipe=byId.get(selected);if(!recipe||!visible(recipe)){actions.hidden=true;return;}
   icon(recipe,$('kitchen-dish-icon'));
   $('kitchen-dish-name').textContent=recipe.name;
   $('kitchen-dish-level').textContent=`${recipe.level}레벨 레시피 · 완성품 ×1`;
   const ingredientBox=$('kitchen-ingredients');ingredientBox.replaceChildren();
   for(const [key,n] of Object.entries(recipe.ingredients)){
     const tag=document.createElement('span');tag.className='kitchen-ingredient';
     const have=count(key);tag.classList.toggle('is-short',have<n);
     tag.textContent=`${itemName(key)} ×${n} (보유 ${have})`;ingredientBox.append(tag);
   }
   const known=mastery(recipe);
   $('kitchen-mastery-label').textContent=`${known===4?'자동 요리 해금 · ':''}숙련도 ${known} / 4`;
   const track=$('kitchen-mastery-track');track.replaceChildren();
   for(let i=0;i<4;i++){const mark=document.createElement('span');mark.className='kitchen-mastery-dot';mark.classList.toggle('is-earned',i<known);track.append(mark);}
   actions.hidden=stage!=='idle';
   $('kitchen-manual').hidden=false;
   actions.classList.toggle('has-auto',known===4);
   $('kitchen-auto').hidden=known<4;
   $('kitchen-manual').disabled=!unlocked(recipe)||!enough(recipe)||stage!=='idle';
   $('kitchen-auto').disabled=!unlocked(recipe)||!enough(recipe)||stage!=='idle';
   $('kitchen-auto').textContent='자동 요리 · 즉시 완성';
   $('kitchen-help').hidden=stage!=='idle';
 }
 function render(){
   if(!byId.has(selected)||!visible(byId.get(selected)))selected=availableRecipes()[0]?.id||null;
   refreshHeader();renderList();renderDetail();
 }
 function gainExperience(amount){
   state.exp+=amount;
   let leveled=false;
   while(state.level<3 && state.exp>=totals[state.level]){
     // 경험치는 레벨별 별도 구간. 초과 경험치만 이월하고 이전 누적치는 복사하지 않습니다.
     state.exp-=totals[state.level];state.level++;leveled=true;
   }
   if(state.level===3)state.exp=Math.min(80,state.exp);
   return leveled;
 }
 function consumeAndProduce(recipe){
   const inv=inventory();if(!inv||!enough(recipe))return false;
   const removed=[];
   for(const [name,n] of Object.entries(recipe.ingredients)){
     const key=inventoryKey(name);
     if(!inv.take(key,n)){
       for(const [oldKey,oldCount] of removed)inv.add(oldKey,oldCount);
       return false;
     }
     removed.push([key,n]);
   }
   if(!inv.add(recipe.output,1)){
     for(const [key,n] of removed)inv.add(key,n);
     return false;
   }
   return true;
 }
 function finish(perfect,automatic=false){
   const recipe=byId.get(selected);
   if(!recipe||!unlocked(recipe)||!consumeAndProduce(recipe)){
     stage='idle';minigame.hidden=true;resultPanel.hidden=true;setMessage('재료가 부족하거나 창고에 보관할 수 없어 요리를 완료하지 못했습니다.');render();return;
   }
   const levelBefore=state.level;
   const before=mastery(recipe);
   if(perfect&&!automatic)state.mastery[recipe.id]=Math.min(4,before+1);
   const experience=automatic?4:perfect?6:2;
   const leveled=gainExperience(experience);save();
   document.dispatchEvent(new CustomEvent('dowon:activity',{detail:{type:'cook',recipeId:recipe.id,perfect:perfect&&!automatic}}));
   const title=automatic?'자동 요리 완료':perfect?'완벽!':'성공!';
   $('kitchen-result-title').textContent=title;
   const masteryNotice=automatic?'자동 제작 · 숙련도 유지':perfect?`숙련도 +1 (${mastery(recipe)}/4)${mastery(recipe)===4&&before<4?' · 자동 요리 해금!':''}`:'숙련도 +0 (완벽 판정에서만 획득)';
   $('kitchen-result-description').textContent=`${recipe.name} ×1 획득 · 경험치 +${experience} · ${masteryNotice}${leveled?` · 요리 ${levelBefore}→${state.level}레벨 달성!`:''}`;
   stage='result';minigame.hidden=true;actions.hidden=true;resultPanel.hidden=true;$('kitchen-help').hidden=true;
   refreshHeader();setMessage('');renderList();
   // 재료 차감/완성품 지급/경험치/숙련도 저장이 끝난 뒤 연출을 단 한 번 시작합니다.
   clearComplete();
   if(completeOverlay){
     $('kitchen-complete-badge').textContent=automatic?'자동 요리 완성!':perfect?'완벽!':'완성!';
     $('kitchen-complete-name').textContent=`${recipe.name} ×1`;
     const reward=`경험치 +${experience}${perfect&&!automatic?' · 숙련도 +1':''}${leveled?` · 요리 ${state.level}레벨 달성!`:''}${perfect&&!automatic&&mastery(recipe)===4&&before<4?' · 자동 요리 해금!':''}`;
     $('kitchen-complete-reward').textContent=reward;
     icon(recipe,$('kitchen-complete-dish'));
     completeOverlay.hidden=false;
     completeTimer=setTimeout(()=>{
       completeTimer=0;
       if(stage==='result'&&!dialog.hidden)next();
     },1650);
   }else{
     // 구버전 HTML 파일만 교체한 경우에도 요리 결과를 확인할 수 있도록 유지합니다.
     resultPanel.hidden=false;$('kitchen-next').focus();
   }
 }
 function drawNeedle(){
   const x=300+238*Math.cos(angle),y=265+238*Math.sin(angle);
   needle.setAttribute('x2',x.toFixed(2));needle.setAttribute('y2',y.toFixed(2));
 }
 function tick(now){
   if(!running)return;
   if(previousTime!==null){
     let next=angle+direction*Math.min((now-previousTime)/1000,.05)*1.9;
     if(next>=-0.045){next=-0.045-(next+0.045);direction=-1;}
     else if(next<=-Math.PI+.045){next=-Math.PI+.045+(-Math.PI+.045-next);direction=1;}
     angle=next;
   }
   previousTime=now;drawNeedle();animationId=requestAnimationFrame(tick);
 }
 function startManual(){
   const recipe=byId.get(selected);
   if(stage!=='idle'||!recipe||!unlocked(recipe))return;
   if(!enough(recipe)){setMessage('재료가 부족합니다.');render();return;}
   stage='timing';angle=-Math.PI*.83;direction=1;previousTime=null;
   actions.hidden=true;resultPanel.hidden=true;minigame.hidden=false;$('kitchen-help').hidden=true;
   drawNeedle();running=true;animationId=requestAnimationFrame(tick);$('kitchen-stop').focus();
 }
 function stopManual(){
   if(stage!=='timing')return;
   stopAnimation();
   // 반원의 중앙 ±약 10도 범위를 완벽으로 판정, 나머지는 모두 성공 (실패 없음).
   const perfect=Math.abs(angle+Math.PI/2)<=0.18;
   finish(perfect,false);
 }
 function autoCook(){
   const recipe=byId.get(selected);
   if(stage!=='idle'||!recipe||!unlocked(recipe)||mastery(recipe)!==4)return;
   if(!enough(recipe)){setMessage('재료가 부족합니다.');render();return;}
   finish(false,true);
 }
 function next(){if(stage!=='result')return;clearComplete();stage='idle';resultPanel.hidden=true;render();}
 function setOpen(open){
   if(open){
     document.getElementById('shop-close')?.click();
     window.dowonSetWarehouseOpen?.(false);
     document.getElementById('resident-close')?.click();
     document.getElementById('order-close')?.click();
     document.getElementById('debug-close')?.click();
   }
   if(!open){stopAnimation();clearComplete();stage='idle';minigame.hidden=true;resultPanel.hidden=true;lastFocused=null;}
   dialog.hidden=backdrop.hidden=!open;
   menu.classList.toggle('selected',open);
   menu.setAttribute('aria-expanded',String(open));
   if(open){setMessage('');render();closeButton.focus();}else menu.focus();
 }
 menu.addEventListener('click',()=>setOpen(true));closeButton.addEventListener('click',()=>setOpen(false));backdrop.addEventListener('click',()=>setOpen(false));
 $('kitchen-manual').addEventListener('click',startManual);$('kitchen-stop').addEventListener('click',stopManual);
 $('kitchen-auto').addEventListener('click',autoCook);$('kitchen-next').addEventListener('click',next);
 document.addEventListener('keydown',event=>{
   if(dialog.hidden)return;
   if(event.key==='Escape'){event.preventDefault();setOpen(false);}
   if((event.code==='Space'||event.key===' ')&&stage==='timing'){
     if(event.repeat)return;
     event.preventDefault();stopManual();
   }
 });
 document.addEventListener('visibilitychange',()=>{
   // 숨겨진 탭에서 타이머가 진행되어 의도치 않게 판정되지 않도록 복귀 시 새로 시작.
   if(document.hidden&&stage==='timing'){stopAnimation();stage='idle';minigame.hidden=true;setMessage('화면을 벗어나 요리가 중단되었습니다. 재료는 차감되지 않았습니다.');render();}
 });
 document.addEventListener('dowon:residentschange',()=>{
   if(stage==='timing'&&(!byId.get(selected)||!visible(byId.get(selected)))){
     stopAnimation();stage='idle';minigame.hidden=true;setMessage('주민이 변경되어 요리가 중단되었습니다. 재료는 차감되지 않았습니다.');
   }
   if(!dialog.hidden)render();
 });
 window.addEventListener('storage',event=>{if(event.key===RESIDENT_STORAGE&&!dialog.hidden)render();});
 window.dowonKitchen={get:()=>({level:state.level,exp:state.exp,mastery:{...state.mastery}})};
 render();
})();
