/* 주민 갤러리 5칸 + 상세 탭(기본정보/대사/설정) */
(() => {
 'use strict';
 const KEY='dangcheong-dowon-player-residents-v1';
 const progression=window.dowonProgression;
 const dialog=document.getElementById('resident-dialog');
 const backdrop=document.getElementById('resident-backdrop');
 const menu=document.getElementById('menu-residents');
 const close=document.getElementById('resident-close');
 const cards=document.getElementById('resident-cards');
 const scene=document.getElementById('main-area');
 const characters=window.dowonSceneCharacters;
 if(!dialog||!backdrop||!menu||!close||!cards||!scene||!characters)return;
 let residents;
 // 저장 기록이 전혀 없는 새 게임에서만 1·2번 기본 주민을 등록합니다.
 // 이미 주민을 삭제/변경했거나 다른 기기에서 백업을 복원한 경우에는 다시 등록하지 않습니다.
 let existingResidentSave=null;
 try{existingResidentSave=localStorage.getItem(KEY);}catch(_){}
 if(existingResidentSave===null){
   const defaults=window.DOWON_DEFAULT_RESIDENTS;
   if(Array.isArray(defaults)&&defaults.length>=2){
     const placeNames=window.dowonPlaceNames||[];
     const makeDefault=(source,i)=>{
       const {favoritePlaceName,farmReplyToOther,...fields}=source;
       const favoritePlace=placeNames.indexOf(favoritePlaceName)+1;
       return {...fields,favoritePlace:favoritePlace>0?favoritePlace:0,
         farmRepliesByResident:{[String(i===0?1:0)]:farmReplyToOther||''}};
     };
     const initial=[makeDefault(defaults[0],0),makeDefault(defaults[1],1),null,null,null];
     try{localStorage.setItem(KEY,JSON.stringify(initial));existingResidentSave=JSON.stringify(initial);}
     catch(e){console.warn('기본 주민 저장 실패',e);}
   }
 }
 try {const old=JSON.parse(existingResidentSave||'null');residents=Array.isArray(old)?old.slice(0,5):[];}catch(_){residents=[];}
 while(residents.length<5)residents.push(null);
 residents=residents.map(r=>r&&typeof r.name==='string'&&r.name.trim()?r:null);
 const monthDays=m=>[31,29,31,30,31,30,31,31,30,31,30,31][m-1]||31;
 const stored=(newList)=>{try{localStorage.setItem(KEY,JSON.stringify(newList));document.dispatchEvent(new Event('dowon:residentschange'));return true;}catch(e){console.warn('주민 저장 실패',e);return false;}};
 let selected=null;
 const button=(label,cls,onClick)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',onClick);return b;};
 const makeLabel=(text,input,extraClass='')=>{const l=document.createElement('label');if(extraClass)l.className=extraClass;const span=document.createElement('span');span.textContent=text;l.append(span,input);return l;};
 const makePanel=(name,title,note='')=>{const panel=document.createElement('section');panel.className='resident-tab-panel';panel.dataset.tab=name;const h=document.createElement('h4');h.textContent=title;panel.append(h);if(note){const p=document.createElement('p');p.className='resident-panel-note';p.textContent=note;panel.append(p);}return panel;};
 function renderCharacters(){
   // 편집/저장 후 주민 DOM을 새로 만들 때도 이동 중 위치를 보존합니다.
   window.dowonSaveScenePositions?.();
   for(const c of characters)c.element.remove();characters.length=0;
   residents.forEach((r,i)=>{
     if(!r || (progression && !progression.isResidentUnlocked(i)))return;
     const el=document.createElement('div');el.className='resident-avatar';el.setAttribute('aria-label',r.name);
     const face=document.createElement(r.image?'img':'span');face.className=r.image?'resident-avatar-image':'resident-avatar-face';
     if(r.image){face.src=r.image;face.alt=r.name+' 캐릭터';face.draggable=false;}else face.textContent=r.name.trim().charAt(0);
     const name=document.createElement('span');name.className='resident-avatar-name';name.textContent=r.name;
     el.append(face,name);scene.append(el);
     characters.push({element:el,x:90+i*47,y:Math.max(90,scene.clientHeight*(.42+(i%3)*.06)),speed:.14+i*.008,direction:i%2? -1:1,favoritePlace:Number(r.favoritePlace)||0,residentIndex:i,clickLines:r.clickLines||'',repeatClickLines:r.repeatClickLines||'',tenClickLines:r.tenClickLines||'',sleepClickLines:r.sleepClickLines||'',generalLines:r.generalLines||'',placeLines:r.placeLines||{},interactionLines:r.interactionLines||'',interactionByResident:r.interactionByResident||{},interactionRepliesByResident:r.interactionRepliesByResident||{},interactionDisabledByResident:r.interactionDisabledByResident||{},morningLines:r.morningLines||'',generalNightLines:r.generalNightLines||'',placeNightLines:r.placeNightLines||{},rainLines:r.rainLines||'',rainNightLines:r.rainNightLines||'',rainPlaceLines:r.rainPlaceLines||{},rainPlaceNightLines:r.rainPlaceNightLines||{},farmOpening:r.farmOpening||'',farmArrival:r.farmArrival||'',farmRepliesByResident:r.farmRepliesByResident||{},relationships:r.relationships||{},eventLines:r.eventLines||{}});
   });
 }
 const select=(options,value,aria)=>{const s=document.createElement('select');s.setAttribute('aria-label',aria);for(const [v,label] of options){const o=document.createElement('option');o.value=v;o.textContent=label;s.append(o);}s.value=String(value??'');return s;};
 function gallery(){
   selected=null;cards.replaceChildren();cards.classList.remove('resident-detail-view');cards.classList.add('resident-gallery');
   residents.forEach((r,i)=>{
     const locked=progression && !progression.isResidentUnlocked(i);
     const slotNo=String(i+1).padStart(2,'0');
     const classes=['resident-tile'];
     if(locked)classes.push('resident-tile-locked');
     else if(r)classes.push('resident-tile-filled');
     else classes.push('resident-tile-empty');
     const card=button('',classes.join(' '),()=>{if(locked){progression.buyResident(i,()=>{renderCharacters();gallery();});return;}detail(i);});
     card.dataset.slot=slotNo;
     card.setAttribute('aria-label',r?`${r.name} 상세 정보 보기`:locked?`${i+1}번째 주민 해금`:`${i+1}번째 주민 추가`);

     const visual=document.createElement('span');visual.className='resident-tile-visual';
     const frameNumber=document.createElement('span');frameNumber.className='resident-tile-frame-number';frameNumber.textContent=slotNo;
     const frameLabel=document.createElement('span');frameLabel.className='resident-tile-frame-label';frameLabel.innerHTML='VILLAGE<br>RESIDENT';
     const frameDeco=document.createElement('span');frameDeco.className='resident-tile-frame-deco';
     visual.append(frameNumber,frameLabel,frameDeco);

     if(r?.image){
       const img=document.createElement('img');img.src=r.image;img.alt='';img.draggable=false;visual.append(img);
     }else{
       const silhouette=document.createElement('span');
       silhouette.className=locked?'resident-tile-placeholder resident-tile-plus':'resident-tile-placeholder';
       silhouette.textContent=r?r.name.charAt(0):'+';
       visual.append(silhouette);
     }

     const footer=document.createElement('span');footer.className='resident-tile-footer';
     const title=document.createElement('strong');
     title.className='resident-tile-display-name';

     if(locked){
       title.textContent='주민 초대';
       const cost=document.createElement('span');cost.className='resident-tile-cost';
       const lock=document.createElement('span');lock.className='resident-tile-lock';lock.textContent='🔒';
       cost.textContent=`${progression.residentCost(i).toLocaleString('ko-KR')} 동전`;
       footer.append(lock,title,cost);
     }else if(r){
       title.textContent=r.name;
       // 이름은 이미지 영역 밖, 카드 자체에 놓아 중앙 경계선을 가로질러도 잘리지 않게 합니다.
       // 호감도 하트는 목록 카드 대신 상세 화면의 기본 정보 제목에 표시합니다.
     }else{
       title.textContent='주민 추가';
       const note=document.createElement('span');note.className='resident-tile-cost resident-tile-empty-note';note.textContent='빈 슬롯';
       footer.append(title,note);
     }
     card.append(visual,footer);if(r&&!locked)card.append(title);cards.append(card);
   });
   const hint=document.querySelector('#resident-dialog .resident-hint');if(hint)hint.textContent='첫 두 주민은 무료 · 나머지는 동전으로 초대할 수 있어요.';
 }
 function detail(i){
   selected=i;const r=residents[i];cards.replaceChildren();cards.classList.remove('resident-gallery');cards.classList.add('resident-detail-view');
   const top=document.createElement('div');top.className='resident-detail-top';
   const back=button('← 주민 목록','resident-back',gallery);
   const title=document.createElement('strong');title.className='resident-detail-title';title.textContent=r?`${r.name} resident profile`:`resident ${i+1}`;
   top.append(back,title);cards.append(top);

   const layout=document.createElement('div');layout.className='resident-detail-layout';
   const form=document.createElement('form');form.className='resident-card resident-detail-card';

   const name=document.createElement('input');name.type='text';name.maxLength=20;name.required=true;name.placeholder='이름을 입력하세요';name.value=r?.name||'';
   const gender=select([['','성별 선택'],['여성','여성'],['남성','남성'],['기타','기타'],['미설정','설정 안 함']],r?.gender||'','성별');gender.required=true;
   const age=document.createElement('input');age.type='number';age.min='0';age.max='150';age.step='1';age.required=true;age.placeholder='나이';age.value=r?.age??'';
   const birth=document.createElement('div');birth.className='resident-birthday';
   const month=select([['','월 선택'],...Array.from({length:12},(_,k)=>[String(k+1),`${k+1}월`])],r?.month||'','생일 월');
   const day=select([['','일 선택'],...Array.from({length:31},(_,k)=>[String(k+1),`${k+1}일`])],r?.day||'','생일 일');month.required=day.required=true;birth.append(month,day);
   const place=select([['','좋아하는 장소 선택'],...((window.dowonPlaceNames||[]).map((label,k)=>[String(k+1),label]))],r?.favoritePlace||'','좋아하는 장소');place.required=true;
   const generalLines=document.createElement('textarea');generalLines.rows=4;generalLines.maxLength=5000;generalLines.placeholder='안녕! | 오늘 날씨 좋다 | 산책하고 싶어';generalLines.value=r?.generalLines||'';
   const generalNightLines=document.createElement('textarea');generalNightLines.rows=4;generalNightLines.maxLength=5000;generalNightLines.placeholder='별이 떴네. | 이제 밤이구나.';generalNightLines.value=r?.generalNightLines||'';
   const placeLines={};
   const placeNightLines={};
   const rainPlaceLines={};
   const rainPlaceNightLines={};
   // A separate, per-resident response bank; one entry per line (legacy | accepted).
   const clickLines=document.createElement('textarea');clickLines.rows=4;clickLines.maxLength=5000;
   clickLines.placeholder='응? 나 불렀어?\n무슨 일이야?\n마침 심심했는데.';
   clickLines.value=r?.clickLines||'';
   const repeatClickLines=document.createElement('textarea');repeatClickLines.rows=3;repeatClickLines.maxLength=3000;
   repeatClickLines.placeholder='또 불렀어?\n왜 자꾸 불러?';
   repeatClickLines.value=r?.repeatClickLines||'';
   const tenClickLines=document.createElement('textarea');tenClickLines.rows=3;tenClickLines.maxLength=3000;tenClickLines.placeholder='열 번이나 불렀어?!';tenClickLines.value=r?.tenClickLines||'';
   const sleepClickLines=document.createElement('textarea');sleepClickLines.rows=3;sleepClickLines.maxLength=3000;
   sleepClickLines.placeholder='으음… 조금만 더 잘래.';
   sleepClickLines.value=r?.sleepClickLines||'';
   const matrixRows=[];
   const imageInput=document.createElement('input');imageInput.type='file';imageInput.accept='image/png,image/jpeg,image/webp,image/gif';imageInput.className='resident-image-input';
   const preview=document.createElement('img');preview.className='resident-image-preview';preview.alt='캐릭터 이미지 미리보기';preview.hidden=!r?.image;if(r?.image)preview.src=r.image;
   const imageNote=document.createElement('span');imageNote.className='resident-image-note';imageNote.textContent='PNG · JPG · WEBP · GIF / 2MB 이하 (투명 PNG 추천)';
   const imageWrap=document.createElement('div');imageWrap.className='resident-image-wrap';imageWrap.append(imageInput,preview,imageNote);
   let uploadedImage=r?.image||'';
   const notice=document.createElement('p');notice.className='resident-notice';notice.setAttribute('role','status');

   const basicPanel=makePanel('basic',r?`${r.name} · 기본 정보`:`주민 ${i+1} · 기본 정보`);
   if(r){const hearts=window.dowonAffinity?.renderMpcBadge?.(i);if(hearts)basicPanel.querySelector('h4')?.append(hearts);}
   const basicGrid=document.createElement('div');basicGrid.className='resident-basic-grid';
   // 프로필 상단: 왼쪽 이미지 / 오른쪽 이름·성별·나이
   const basicTop=document.createElement('div');basicTop.className='resident-basic-top';
   const imageColumn=document.createElement('div');imageColumn.className='resident-basic-image-column';
   imageColumn.append(makeLabel('캐릭터 이미지',imageWrap));
   const infoColumn=document.createElement('div');infoColumn.className='resident-basic-info-column';
   infoColumn.append(makeLabel('이름',name),makeLabel('성별',gender),makeLabel('나이',age),makeLabel('생일',birth),makeLabel('좋아하는 장소',place));
   basicTop.append(imageColumn,infoColumn);
   basicGrid.append(basicTop);
   basicPanel.append(basicGrid);
   if(r){
     const giftWrap=document.createElement('div');giftWrap.className='vf-gift-section';
     const giftBtn=button('🎁 선물하기','vf-gift-open',()=>window.dowonFeatures?.openGift(i));giftWrap.append(giftBtn);
     const choiceHost=document.createElement('div');choiceHost.className='vf-gift-choice-host';choiceHost.dataset.giftChoiceResident=String(i);giftWrap.append(choiceHost);
     window.dowonGiftChoices?.renderEditor(i,choiceHost);
     basicPanel.append(giftWrap);
   }


   const dialoguePanel=makePanel('dialogue','대사','날씨별로 왼쪽은 낮(06:00~17:59), 오른쪽은 밤(18:00~24:00) 대사입니다. 여러 대사는 | 로 구분하세요. 밤 칸이 비어 있으면 기존 낮 대사를 사용합니다.');
   const weatherTabs=document.createElement('div');weatherTabs.className='resident-weather-tabs';weatherTabs.setAttribute('role','tablist');weatherTabs.setAttribute('aria-label','대사 날씨 선택');
   const weatherViews={};const weatherButtons={};
   for(const [key,label] of [['clear','☀ 맑은 날'],['rain','☂ 비 오는 날']]){
     const btn=document.createElement('button');btn.type='button';btn.className='resident-weather-tab';btn.textContent=label;
     btn.setAttribute('role','tab');btn.setAttribute('aria-selected',String(key==='clear'));
     const panel=document.createElement('div');panel.className='resident-weather-view';panel.dataset.weather=key;
     panel.setAttribute('role','tabpanel');panel.hidden=key!=='clear';
     btn.addEventListener('click',()=>{
       for(const [other,view] of Object.entries(weatherViews)){
         const active=other===key;view.hidden=!active;weatherButtons[other].classList.toggle('active',active);weatherButtons[other].setAttribute('aria-selected',String(active));
       }
     });
     btn.classList.toggle('active',key==='clear');weatherTabs.append(btn);weatherButtons[key]=btn;weatherViews[key]=panel;
   }
   // Every walking/place row has a stable two-column day / night pair.
   // The original dialogue fields remain the day fields to preserve existing save data.
   const makeTimeRow=(dayTitle,dayInput,nightTitle,nightInput)=>{
     const row=document.createElement('div');row.className='resident-dialogue-time-row';
     row.append(makeLabel(dayTitle,dayInput),makeLabel(nightTitle,nightInput));
     return row;
   };
   const generalGrid=document.createElement('div');generalGrid.className='resident-dialogue-grid resident-dialogue-times';
   generalGrid.append(makeTimeRow('낮 · 이동 중 대사',generalLines,'밤 · 이동 중 대사',generalNightLines));
   weatherViews.clear.append(generalGrid);
   const rainLines=document.createElement('textarea');rainLines.rows=3;rainLines.maxLength=2000;rainLines.placeholder='비가 부슬부슬 오네요. | 우산을 챙겨야겠어요.';rainLines.value=r?.rainLines||'';
   const rainNightLines=document.createElement('textarea');rainNightLines.rows=3;rainNightLines.maxLength=2000;rainNightLines.placeholder='밤에도 비가 내리네. | 빗소리가 좋다.';rainNightLines.value=r?.rainNightLines||'';
   const rainGrid=document.createElement('div');rainGrid.className='resident-dialogue-grid resident-dialogue-times';
   rainGrid.append(makeTimeRow('낮 · 이동 중 대사',rainLines,'밤 · 이동 중 대사',rainNightLines));
   weatherViews.rain.append(rainGrid);
   const placeGrid=document.createElement('div');placeGrid.className='resident-dialogue-places-grid resident-dialogue-times full';
   const rainPlaceGrid=document.createElement('div');rainPlaceGrid.className='resident-dialogue-places-grid resident-dialogue-times full';
   (window.dowonPlaceNames||[]).forEach((placeName,index)=>{
     const key=String(index+1);
     const entry=document.createElement('textarea');entry.rows=3;entry.maxLength=2000;entry.placeholder=`맑은 낮 ${placeName}에서 할 말 | 다른 대사`;entry.value=r?.placeLines?.[key]||'';placeLines[key]=entry;
     const nightEntry=document.createElement('textarea');nightEntry.rows=3;nightEntry.maxLength=2000;nightEntry.placeholder=`맑은 밤 ${placeName}에서 할 말 | 다른 대사`;nightEntry.value=r?.placeNightLines?.[key]||'';placeNightLines[key]=nightEntry;
     placeGrid.append(makeTimeRow(`${placeName} · 낮`,entry,`${placeName} · 밤`,nightEntry));
     const rainEntry=document.createElement('textarea');rainEntry.rows=3;rainEntry.maxLength=2000;rainEntry.placeholder=`비 오는 낮 ${placeName}에서 할 말 | 다른 대사`;rainEntry.value=r?.rainPlaceLines?.[key]||'';rainPlaceLines[key]=rainEntry;
     const rainNightEntry=document.createElement('textarea');rainNightEntry.rows=3;rainNightEntry.maxLength=2000;rainNightEntry.placeholder=`비 오는 밤 ${placeName}에서 할 말 | 다른 대사`;rainNightEntry.value=r?.rainPlaceNightLines?.[key]||'';rainPlaceNightLines[key]=rainNightEntry;
     rainPlaceGrid.append(makeTimeRow(`${placeName} · 낮`,rainEntry,`${placeName} · 밤`,rainNightEntry));
   });
   weatherViews.rain.append(rainPlaceGrid);
   const morningLines=document.createElement('textarea');morningLines.rows=3;morningLines.maxLength=2000;morningLines.placeholder='좋은 아침이에요! | 오늘도 좋은 하루 보내세요';morningLines.value=r?.morningLines||'';
   const morningGrid=document.createElement('div');morningGrid.className='resident-dialogue-grid resident-morning-lines';
   morningGrid.append(makeLabel('아침 대사 · 로딩 및 다음 날 아침에 표시 ( | 로 구분)',morningLines,'full'));
   // 아침 대사를 맑은 날 대사 섹션의 첫 번째 입력칸으로 배치합니다.
   weatherViews.clear.prepend(morningGrid);
   weatherViews.clear.append(placeGrid);
   dialoguePanel.append(weatherTabs,weatherViews.clear,weatherViews.rain);

   const pairEditors=[];
   if(r){
     const relationSection=document.createElement('div');relationSection.className='resident-pair-section';
     const heading=document.createElement('h4');heading.textContent='주민 관계';relationSection.append(heading);
     residents.forEach((other,j)=>{
       if(i===j||!other)return;
       const saved=window.nakwonResidentPairs?.get(i,j)||{score:0,love:false,relation:'초면'};
       const block=document.createElement('div');block.className='resident-pair-entry';
       const name=document.createElement('strong');name.textContent=other.name;
       const status=document.createElement('span');status.textContent=`${saved.relation} · ${saved.score}/100`;
       const stage=select([['auto','호감도에 따라 자동'],['초면','초면'],['아는 사이','아는 사이'],['친구','친구'],['친한 친구','친한 친구'],['love','연인 · 고정']],saved.love?'love':'auto',`${other.name}과의 관계`);
       const score=document.createElement('input');score.type='number';score.min='0';score.max='100';score.step='1';score.value=String(saved.score);score.setAttribute('aria-label',`${other.name}과의 호감도`);
       stage.addEventListener('change',()=>{if(stage.value==='love')return;const starts={'초면':0,'아는 사이':20,'친구':50,'친한 친구':80};if(stage.value in starts)score.value=String(starts[stage.value]);});
       block.append(name,status,makeLabel('관계',stage),makeLabel('호감도 (0~100)',score));relationSection.append(block);pairEditors.push({j,stage,score});
     });
     basicPanel.append(relationSection);
   }
   const interactionPanel=makePanel('interaction','상호작용', '한 줄에 내가 먼저 할 말과 상대 주민별 답변을 작성하세요. 답변이 빈 상대에게는 이 대사를 하지 않습니다.');
   const partners=residents.map((person,index)=>({person,index})).filter(item=>item.person&&item.index!==i);
   // 호감도/관계는 기본 정보에서 직접 수정합니다. 기존 자동 대화 입력은 보존합니다.
   const matrixScroll=document.createElement('div');matrixScroll.className='resident-matrix-scroll';
   const matrix=document.createElement('div');matrix.className='resident-matrix';
   matrix.style.setProperty('--matrix-columns',String(1+partners.length));
   const header=document.createElement('div');header.className='resident-matrix-header';
   const mainHeading=document.createElement('strong');mainHeading.textContent=`${r?.name||'나'} · 먼저 할 말`;header.append(mainHeading);
   partners.forEach(({person})=>{const heading=document.createElement('strong');heading.textContent=`${person.name} · 답변`;header.append(heading);});
   matrix.append(header);
   // 기존 상대별 선행 대사들을 하나의 표로 합치되, 기존 답변과 연결된 원문은 유지합니다.
   const existingLines=[...(r?.interactionLines||'').split('|')];
   partners.forEach(({index})=>{
     const lines=r?.interactionByResident?.[String(index)]||'';
     existingLines.push(...lines.split('|'));
   });
   const uniqueLines=[...new Set(existingLines.map(line=>line.trim()).filter(Boolean))];
   const makeRow=(opening='')=>{
     const row=document.createElement('div');row.className='resident-matrix-row';
     const first=document.createElement('input');first.type='text';first.maxLength=500;first.placeholder='내가 먼저 할 대사';first.value=opening;
     first.setAttribute('aria-label','먼저 할 대사');row.append(first);
     const answers={};
     partners.forEach(({person,index})=>{
       const key=String(index);const cell=document.createElement('div');cell.className='resident-matrix-answer-cell';const answer=document.createElement('input');answer.type='text';answer.maxLength=1000;
       answer.placeholder=`${person.name}의 답변`;
       answer.value=person.interactionRepliesByResident?.[String(i)]?.[opening]||'';
       answer.setAttribute('aria-label',`${person.name}의 답변: ${opening||'새 대사'}`);
       cell.append(answer);answers[key]={answer};row.append(cell);
     });
     const entry={first,answers,row,original:opening};matrixRows.push(entry);matrix.append(row);
   };
   (uniqueLines.length?uniqueLines:['','','']).forEach(makeRow);
   matrixScroll.append(matrix);interactionPanel.append(matrixScroll);
   const matrixActions=document.createElement('div');matrixActions.className='resident-matrix-actions';
   const addRow=button('+ 대사 추가','resident-matrix-add',()=>makeRow());
   const removeRow=button('마지막 줄 삭제','resident-matrix-remove',()=>{
     if(matrixRows.length<=1)return;
     const entry=matrixRows.pop();entry.row.remove();
   });
   matrixActions.append(addRow,removeRow);interactionPanel.append(matrixActions);

   const EVENT_TYPES=[['greet','마주 보고 인사'],['awkward','어색하게 엇갈리기'],['rest','나란히 쉬기'],['walk','함께 걷기'],['follow','장난스럽게 따라가기'],['visit','연인 찾아가기'],['wait','연인 기다리기']];
   const eventPanel=makePanel('event','이벤트','대사를 비워두면 행동만 진행합니다. | 로 여러 대사를 구분하면 무작위 선택됩니다. 상대별 대사가 있으면 공통 대사보다 우선합니다.');
   const eventInputs={};
   EVENT_TYPES.forEach(([key,title])=>{
     const section=document.createElement('div');section.className='resident-event-section';
     const heading=document.createElement('h4');heading.textContent=title;section.append(heading);
     const saved=r?.eventLines?.[key]||{};const inputs={overrides:{}};
     for(const [field,label] of [['opening','먼저 말하기 · 공통'],['reply','상대에게 답하기 · 공통']]){
       const input=document.createElement('textarea');input.rows=2;input.maxLength=3000;input.value=saved[field]||'';input.placeholder='대사가 없으면 비워두세요';section.append(makeLabel(label,input,'full'));inputs[field]=input;
     }
     if(partners.length){
       const toggle=button('상대 주민별 전용 대사 ▾','resident-event-toggle',()=>{overrideWrap.hidden=!overrideWrap.hidden;});section.append(toggle);
       const overrideWrap=document.createElement('div');overrideWrap.className='resident-event-overrides';overrideWrap.hidden=true;
       partners.forEach(({person,index})=>{
         const entries={};const pair=saved.overrides?.[String(index)]||{};
         for(const [field,label] of [['opening',`${person.name}에게 먼저 말하기`],['reply',`${person.name}에게 답하기`]]){
           const input=document.createElement('textarea');input.rows=2;input.maxLength=3000;input.value=pair[field]||'';overrideWrap.append(makeLabel(label,input,'full'));entries[field]=input;
         }inputs.overrides[String(index)]=entries;
       });section.append(overrideWrap);
     }
     eventPanel.append(section);eventInputs[key]=inputs;
   });
   const farmPanel=makePanel('farm' ,'밭 반응','작물 심기에 30% 확률로 주민 한 명이 반응합니다. 시작 대사를 설정한 주민만 달려올 수 있으며, 다른 주민은 현재 위치에서 답변합니다.');
   const farmGrid=document.createElement('div');farmGrid.className='resident-dialogue-grid';
   const farmOpening=document.createElement('textarea');farmOpening.rows=2;farmOpening.maxLength=2000;farmOpening.placeholder='밭에 뭐 심으셨습니까? | 저도 구경하겠습니다!';farmOpening.value=r?.farmOpening||'';
   const farmArrival=document.createElement('textarea');farmArrival.rows=2;farmArrival.maxLength=2000;farmArrival.placeholder='드디어 밭에 도착했습니다!';farmArrival.value=r?.farmArrival||'';
   farmGrid.append(makeLabel('달려가기 전 대사 (| 로 여러 개 구분)',farmOpening,'full'),makeLabel('밭 도착 후 대사',farmArrival,'full'));
   const farmReplies={};
   residents.forEach((person,index)=>{
     if(!person||index===i)return;
     const input=document.createElement('textarea');input.rows=2;input.maxLength=2000;
     input.placeholder=`${person.name}이 밭으로 달려올 때 멀리서 할 답변 (비우면 답변하지 않음)`;
     input.value=r?.farmRepliesByResident?.[String(index)]||'';
     farmReplies[String(index)]=input;
     farmGrid.append(makeLabel(`${person.name}에게 할 원격 답변`,input,'full'));
   });
   farmPanel.append(farmGrid);
   const clickPanel=makePanel('click','클릭 반응','캐릭터를 짧게 클릭하면 말풍선이 나옵니다. 한 줄에 대사 하나씩 입력하세요. | 구분도 가능합니다. 비워두면 기본 대사를 사용합니다.');
   const clickGrid=document.createElement('div');clickGrid.className='resident-dialogue-grid';
   clickGrid.append(makeLabel('기본 클릭 대사',clickLines,'full'),makeLabel('연속 클릭 대사 (3초 내 3~10회)',repeatClickLines,'full'),makeLabel('10회 초과 클릭 대사 (3초 내 11회부터)',tenClickLines,'full'),makeLabel('자는 중 클릭 대사 (취침 상태에서 사용)',sleepClickLines,'full'));
   clickPanel.append(clickGrid);
   // 이미지 등록과 기본 정보를 같은 탭에서 편집합니다. 저장/삭제는 공통 하단에 유지합니다.
   const panels=[basicPanel,dialoguePanel,interactionPanel,eventPanel,farmPanel,clickPanel];
   panels.forEach(p=>form.append(p));

   const actions=document.createElement('div');actions.className='resident-buttons resident-form-actions';
   const save=document.createElement('button');save.type='submit';save.textContent=r?'변경 사항 저장':'주민 추가';actions.append(save);
   if(r){actions.append(button('주민 삭제','resident-delete',()=>{if(!confirm(`${r.name} 주민을 삭제할까요?`))return;const next=residents.map(person=>person?{...person,interactionByResident:{...(person.interactionByResident||{})},relationships:{...(person.relationships||{})}}:null);next[i]=null;next.forEach(person=>{if(person){delete person.interactionByResident[String(i)];delete person.relationships[String(i)];}});if(!stored(next)){notice.textContent='삭제 정보를 저장하지 못했어요.';return;}residents=next;window.dowonAffinity?.resetMpc(i);renderCharacters();gallery();}));}
   form.append(actions,notice);

   imageInput.addEventListener('change',()=>{const file=imageInput.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>2*1024*1024){notice.textContent='PNG, JPG, WEBP, GIF 이미지를 2MB 이하로 선택해 주세요.';imageInput.value='';return;}const reader=new FileReader();reader.onload=()=>{uploadedImage=String(reader.result);preview.src=uploadedImage;preview.hidden=false;notice.textContent='이미지가 선택됐어요. 저장하면 적용됩니다.';};reader.onerror=()=>{notice.textContent='이미지를 읽을 수 없습니다.';};reader.readAsDataURL(file);});

   form.addEventListener('submit',e=>{
     e.preventDefault();
     const m=Number(month.value),d=Number(day.value),a=Number(age.value);
     if(!name.value.trim()||!gender.value||age.value===''||!Number.isInteger(a)||a<0||a>150||!m||!d||d>monthDays(m)||!place.value){notice.textContent='이름, 성별, 나이, 생일, 좋아하는 장소를 확인해 주세요.';return;}
     const next=residents.map(person=>person?{...person,relationships:{...(person.relationships||{})}}:null);
     const relationships={...(r?.relationships||{})};
     const eventLines=Object.fromEntries(Object.entries(eventInputs).map(([key,inputs])=>[key,{opening:inputs.opening.value,reply:inputs.reply.value,overrides:Object.fromEntries(Object.entries(inputs.overrides).map(([j,entries])=>[j,{opening:entries.opening.value,reply:entries.reply.value}]))}]));
     const validRows=matrixRows.map(entry=>({entry,opening:entry.first.value.trim()})).filter(item=>item.opening);
     const openings=[...new Set(validRows.map(item=>item.opening))];
     const interactionByResident={...(r?.interactionByResident||{})};
     // 새로운 공통 선행 대사는 모든 상대에게 동일하게 적용됩니다.
     partners.forEach(({index})=>{interactionByResident[String(index)]=openings.join(' | ');});
     partners.forEach(({person,index})=>{
       const key=String(index);const old=next[index];
       if(!old)return;
       const previous={...(old.interactionRepliesByResident?.[String(i)]||{})};
       const updated={};
       // 같은 행을 편집한 경우 저장된 답변을 새 원문 키에 매핑합니다.
       validRows.forEach(({entry,opening})=>{updated[opening]=entry.answers[key].answer.value;});
       next[index]={...old,interactionRepliesByResident:{...(old.interactionRepliesByResident||{}),[String(i)]:{...previous,...updated}},interactionDisabledByResident:{...(old.interactionDisabledByResident||{}),[String(i)]:{}}};
     });
     next[i]={...r,name:name.value.trim(),gender:gender.value,age:a,month:m,day:d,image:uploadedImage,favoritePlace:Number(place.value),generalLines:generalLines.value,generalNightLines:generalNightLines.value,clickLines:clickLines.value,repeatClickLines:repeatClickLines.value,tenClickLines:tenClickLines.value,sleepClickLines:sleepClickLines.value,morningLines:morningLines.value,rainLines:rainLines.value,rainNightLines:rainNightLines.value,interactionLines:openings.join(' | '),interactionByResident,relationships,eventLines,farmOpening:farmOpening.value,farmArrival:farmArrival.value,farmRepliesByResident:Object.fromEntries(Object.entries(farmReplies).map(([key,input])=>[key,input.value])),placeLines:Object.fromEntries(Object.entries(placeLines).map(([key,entry])=>[key,entry.value])),placeNightLines:Object.fromEntries(Object.entries(placeNightLines).map(([key,entry])=>[key,entry.value])),rainPlaceLines:Object.fromEntries(Object.entries(rainPlaceLines).map(([key,entry])=>[key,entry.value])),rainPlaceNightLines:Object.fromEntries(Object.entries(rainPlaceNightLines).map(([key,entry])=>[key,entry.value]))};
     if(!stored(next)){notice.textContent='저장 공간이 부족합니다. 더 작은 이미지로 다시 등록해 주세요.';return;}
     const changes=[];for(let other=0;other<next.length;other++){if(other===i||!next[other])continue;const before=residents[i]?.relationships?.[String(other)]||residents[other]?.relationships?.[String(i)]||'아는사이';const after=next[i]?.relationships?.[String(other)]||next[other]?.relationships?.[String(i)]||'아는사이';if(before!==after)changes.push({type:'resident-relationship-change',first:next[i].name,second:next[other].name,relationship:after});}
     pairEditors.forEach(({j,stage,score})=>window.nakwonResidentPairs?.set(i,j,{love:stage.value==='love',score:Number(score.value)}));
     residents=next;for(const detail of changes)document.dispatchEvent(new CustomEvent('dowon:activity',{detail}));renderCharacters();gallery();
   });

   const tabs=document.createElement('div');tabs.className='resident-detail-tabs';
   const tabDefs=[['basic','●','기본정보'],['dialogue','●','대사'],['interaction','●','상호작용'],['event','●','이벤트'],['farm','●','밭 반응'],['click','●','클릭 반응']];
   const tabButtons=[];
   const setTab=(key)=>{tabButtons.forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===key));panels.forEach(panel=>panel.classList.toggle('active',panel.dataset.tab===key));};
   tabDefs.forEach(([key,icon,label])=>{const btn=document.createElement('button');btn.type='button';btn.className='resident-detail-tab';btn.dataset.tab=key;btn.innerHTML=`<span class="resident-detail-tab-icon">${icon}</span><span class="resident-detail-tab-text">${label}</span>`;btn.addEventListener('click',()=>setTab(key));tabButtons.push(btn);tabs.append(btn);});
   setTab('basic');

   layout.append(form,tabs);cards.append(layout);name.focus();
 }
 function setOpen(open){dialog.hidden=backdrop.hidden=!open;menu.setAttribute('aria-expanded',String(open));menu.classList.toggle('selected',open);if(open){gallery();close.focus();}else menu.focus();}
 menu.addEventListener('click',()=>{document.getElementById('warehouse-close')?.click();setOpen(true);});
 close.addEventListener('click',()=>setOpen(false));backdrop.addEventListener('click',()=>setOpen(false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dialog.hidden){if(selected!==null)gallery();else setOpen(false);}});
 renderCharacters();
})();
