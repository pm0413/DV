/* 전원생활일지 기기 간 수동 저장 데이터 전송: 게임에 속한 키만 다룹니다. */
(()=>{'use strict';
 const FORMAT='dowon-village-save',VERSION=1,PREFIX='dangcheong-dowon-';
 const CLOCK_KEY='dangcheong-dowon-village-clock-v2';
 const IMPORT_CLOCK_KEY='__dangcheong_dowon_clock_import_pending__';
 // 저장 키 판정은 save-version.js를 단일 기준으로 사용합니다. 구버전 페이지에서도 동작하도록 fallback만 둡니다.
 const AUDIO_KEYS=new Set(['dowon-audio-bgm-enabled-v1','dowon-audio-bgm-position-v1','dowon-audio-ambient-enabled-v1','dowon-audio-ambient-position-v1']);
 const LEGACY_EXTRA_KEYS=new Set(['nakwon-resident-pair-relations-v1']);
 const fallbackOwns=key=>typeof key==='string'&&(key.startsWith(PREFIX)||AUDIO_KEYS.has(key)||LEGACY_EXTRA_KEYS.has(key));
 const owns=key=>window.dowonSaveSchema?.owns?.(key)??fallbackOwns(key);
 const dialog=document.getElementById('save-transfer-dialog'),backdrop=document.getElementById('save-transfer-backdrop'),openButton=document.getElementById('settings-open'),closeButton=document.getElementById('save-transfer-close'),exportButton=document.getElementById('save-transfer-export'),importButton=document.getElementById('save-transfer-import'),fileInput=document.getElementById('save-transfer-file'),filename=document.getElementById('save-transfer-filename'),status=document.getElementById('save-transfer-status');
 if(!dialog||!backdrop||!openButton||!closeButton||!exportButton||!importButton||!fileInput)return;
 const showStatus=(message,error=false)=>{status.textContent=message;status.style.color=error?'#f19b8f':'';};
 const setOpen=open=>{dialog.hidden=!open;backdrop.hidden=!open;openButton.setAttribute('aria-expanded',String(open));if(open)closeButton.focus();else openButton.focus();};
 openButton.addEventListener('click',()=>{window.dowonOpenSettingsTab?.('general');setOpen(true);});closeButton.addEventListener('click',()=>setOpen(false));backdrop.addEventListener('click',()=>setOpen(false));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!dialog.hidden)setOpen(false);});
 const readCurrent=()=>{const result=Object.create(null);for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(owns(key)){const value=localStorage.getItem(key);if(value!==null)result[key]=value;}}return result;};
 function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
 exportButton.addEventListener('click',()=>{
  try{
   // game modules persist synchronously in localStorage; a backup reflects the current saved state.
   const entries=readCurrent();
   // 저장소에 마지막으로 기록된 시각이 아닌, 버튼을 누른 순간의 게임 시각을 받습니다.
   const clock=window.dowonClock?.snapshotForTransfer?.();
   if(clock)entries[CLOCK_KEY]=JSON.stringify(clock);
   const count=Object.keys(entries).length;
   if(count===0){showStatus('저장된 게임 데이터를 찾지 못했습니다.',true);return;}
   const payload={format:FORMAT,version:VERSION,schemaVersion:window.dowonSaveSchema?.CURRENT_VERSION||1,exportedAt:new Date().toISOString(),entries};
   const date=new Date(),part=n=>String(n).padStart(2,'0');
   const stamp=`${date.getFullYear()}${part(date.getMonth()+1)}${part(date.getDate())}-${part(date.getHours())}${part(date.getMinutes())}`;
   download(new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),`전원생활일지-저장데이터-${stamp}.json`);
   showStatus(`저장 항목 ${count}개를 백업 파일로 내보냈습니다. 파일을 다른 기기로 옮겨 주세요.`);
  }catch(error){console.error('데이터 내보내기 실패',error);showStatus('백업 파일을 만들지 못했습니다. 브라우저의 저장소/다운로드 권한을 확인해 주세요.',true);}
 });
 fileInput.addEventListener('change',()=>{const file=fileInput.files?.[0];filename.textContent=file?file.name:'선택한 파일 없음';importButton.disabled=!file;showStatus('');});
 importButton.addEventListener('click',async()=>{
  const file=fileInput.files?.[0];if(!file)return;
  importButton.disabled=true;
  try{
   if(file.size>60*1024*1024)throw new Error('파일 크기가 60MB를 초과합니다.');
   const input=JSON.parse(await file.text());
   if(!input||input.format!==FORMAT||input.version!==VERSION||!input.entries||Array.isArray(input.entries)||typeof input.entries!=='object')throw new Error('전원생활일지 저장 데이터 파일이 아니거나 지원하지 않는 백업 형식입니다.');
   const schema=window.dowonSaveSchema;
   const sourceSchemaVersion=Number.isSafeInteger(input.schemaVersion)?input.schemaVersion:(schema?.LEGACY_VERSION||1);
   const preparedEntries=schema?.prepareEntries?schema.prepareEntries(input.entries,sourceSchemaVersion):input.entries;
   const keys=Object.keys(preparedEntries);
   if(!keys.length||keys.length>220||keys.some(key=>!owns(key)||typeof preparedEntries[key]!=='string'))throw new Error('백업 항목이 비어 있거나 올바르지 않습니다.');
   // 날짜·시간 복구가 불가능하면 기존 저장 데이터를 삭제하기 전에 중단합니다.
   let backupClock;
   try{backupClock=JSON.parse(preparedEntries[CLOCK_KEY]||'null');}catch(_){backupClock=null;}
   if(!backupClock||!Number.isSafeInteger(backupClock.day)||backupClock.day<1||
      !Number.isSafeInteger(backupClock.minute)||backupClock.minute<360||backupClock.minute>1440){
     throw new Error('백업 파일에 올바른 날짜·시간 기록이 없습니다. PC에서 다시 내보내 주세요.');
   }
   if(!window.confirm('이 기기의 기존 전원생활일지 저장 기록을 백업 파일로 덮어씁니다.\n기존 기록을 먼저 내보내셨나요?\n\n가져온 뒤 게임을 새로고침합니다. 계속할까요?')){showStatus('가져오기를 취소했습니다.');return;}
   const previous=readCurrent();
   // 저장 파일에 들어 있던 날짜/분은 유지하고, 마지막 저장 시각만 이 기기의 현재 시각으로 재설정합니다.
   const exactClock={day:backupClock.day,minute:backupClock.minute,savedAt:Date.now()};
   let importCommitted=false;
   try{
     window.dowonSaveImportInProgress=true; // 가져오기 중 이전 기기 시계의 자동 기록을 차단
     sessionStorage.setItem(IMPORT_CLOCK_KEY,JSON.stringify(exactClock));
     // 현재 데이터를 통째로 대체해 이전 기기의 잔여 기록이 섞이지 않도록 합니다.
     for(const key of Object.keys(previous))localStorage.removeItem(key);
     for(const key of keys)localStorage.setItem(key,key===CLOCK_KEY?JSON.stringify(exactClock):preparedEntries[key]);
     importCommitted=true;
   }catch(error){
     try{const partiallyWritten=readCurrent();for(const key of Object.keys(partiallyWritten))localStorage.removeItem(key);for(const key of Object.keys(previous))localStorage.setItem(key,previous[key]);}
     catch(restoreError){console.error('기존 데이터 되돌리기 실패',restoreError);throw new Error('저장 용량 부족 등으로 복원이 실패했으며 기존 기록도 되돌리지 못했습니다. 기존 백업 파일을 보관해 주세요.');}
     throw new Error('저장 용량 부족 등으로 가져오지 못했습니다. 이 기기의 기존 기록은 유지되었습니다.');
   }finally{
     if(!importCommitted){
       try{sessionStorage.removeItem(IMPORT_CLOCK_KEY);}catch(_){}
       window.dowonSaveImportInProgress=false;
     }
   }
   showStatus('가져오기 완료. 백업 날짜·시간으로 게임을 다시 시작합니다.');
   window.location.reload(); // 새 페이지에서 시계를 정확하게 1회 복원합니다.
  }catch(error){console.error('데이터 가져오기 실패',error);showStatus(`가져오기 실패: ${error.message||'파일을 확인해 주세요.'}`,true);}
  finally{importButton.disabled=!fileInput.files?.length;}
 });
})();
