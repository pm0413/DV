/* 전원생활일지 저장 스키마 버전 관리. 모든 게임 모듈보다 먼저 로드합니다. */
(()=>{'use strict';
 const META_KEY='dangcheong-dowon-save-schema-v1';
 const CURRENT_VERSION=1;
 const LEGACY_VERSION=1;
 const PREFIX='dangcheong-dowon-';
 const AUDIO_KEYS=new Set(['dowon-audio-bgm-enabled-v1','dowon-audio-bgm-position-v1','dowon-audio-ambient-enabled-v1','dowon-audio-ambient-position-v1']);
 // 구버전에서 접두어가 달랐던 주민 관계 키도 백업·초기화 대상으로 인정합니다.
 const LEGACY_EXTRA_KEYS=new Set(['nakwon-resident-pair-relations-v1']);
 const owns=key=>typeof key==='string'&&(key.startsWith(PREFIX)||AUDIO_KEYS.has(key)||LEGACY_EXTRA_KEYS.has(key));
 // target version => entries를 해당 버전으로 올리는 함수. 다음 저장 구조 변경 시 여기에만 추가합니다.
 const migrations=new Map();
 const cloneEntries=entries=>Object.fromEntries(Object.entries(entries||{}).filter(([key,value])=>owns(key)&&typeof value==='string'));
 function readOwned(store=localStorage){
   const result=Object.create(null);
   for(let i=0;i<store.length;i++){
     const key=store.key(i);if(!owns(key))continue;
     const value=store.getItem(key);if(value!==null)result[key]=value;
   }
   return result;
 }
 function parseMeta(entries){
   try{
     const raw=JSON.parse(entries?.[META_KEY]||'null');
     return raw&&Number.isSafeInteger(raw.schemaVersion)&&raw.schemaVersion>=1?raw:null;
   }catch(_){return null;}
 }
 function detectVersion(entries){
   const meta=parseMeta(entries);
   if(meta)return meta.schemaVersion;
   return Object.keys(entries||{}).some(key=>key!==META_KEY&&owns(key))?LEGACY_VERSION:CURRENT_VERSION;
 }
 function metaValue(version,previous){
   let createdAt;
   try{createdAt=JSON.parse(previous||'null')?.createdAt;}catch(_){}
   return JSON.stringify({schemaVersion:version,createdAt:createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
 }
 function prepareEntries(entries,fromVersion=detectVersion(entries)){
   if(!Number.isSafeInteger(fromVersion)||fromVersion<1)throw new Error('저장 데이터 버전을 확인할 수 없습니다.');
   if(fromVersion>CURRENT_VERSION)throw new Error(`이 저장 데이터는 더 새로운 버전(v${fromVersion})입니다. 현재 게임(v${CURRENT_VERSION})을 업데이트해 주세요.`);
   let next=cloneEntries(entries);
   for(let target=fromVersion+1;target<=CURRENT_VERSION;target++){
     const migrate=migrations.get(target);
     if(typeof migrate!=='function')throw new Error(`저장 데이터 v${target} 마이그레이션이 등록되어 있지 않습니다.`);
     const migrated=migrate({...next});
     if(!migrated||typeof migrated!=='object'||Array.isArray(migrated))throw new Error(`저장 데이터 v${target} 마이그레이션 결과가 올바르지 않습니다.`);
     next=cloneEntries(migrated);
   }
   next[META_KEY]=metaValue(CURRENT_VERSION,next[META_KEY]);
   return next;
 }
 function replaceOwned(store,next,previous){
   const current=readOwned(store);
   try{
     for(const key of Object.keys(current))store.removeItem(key);
     for(const [key,value] of Object.entries(next))store.setItem(key,value);
   }catch(error){
     try{
       for(const key of Object.keys(readOwned(store)))store.removeItem(key);
       for(const [key,value] of Object.entries(previous))store.setItem(key,value);
     }catch(restoreError){console.error('저장 데이터 마이그레이션 롤백 실패',restoreError);}
     throw error;
   }
 }
 function ensureCurrent(){
   const previous=readOwned();
   const fromVersion=detectVersion(previous);
   try{
     const initialized=!previous[META_KEY];
     const migrated=fromVersion!==CURRENT_VERSION;
     const changed=initialized||migrated;
     // 메타의 updatedAt은 신규 생성/실제 마이그레이션 때만 갱신합니다.
     if(changed){const next=prepareEntries(previous,fromVersion);replaceOwned(localStorage,next,previous);}
     return {ok:true,fromVersion,toVersion:CURRENT_VERSION,migrated,initialized,changed};
   }catch(error){
     console.error('저장 데이터 버전 확인/마이그레이션 실패',error);
     return {ok:false,fromVersion,toVersion:CURRENT_VERSION,error:String(error?.message||error)};
   }
 }
 const startup=ensureCurrent();
 window.dowonSaveSchema=Object.freeze({
   META_KEY,CURRENT_VERSION,LEGACY_VERSION,startup,owns,readOwned,detectVersion,prepareEntries,
   getVersion(){return detectVersion(readOwned());}
 });
})();
