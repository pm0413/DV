/* 사이드바 NEW 알림: 업적 / 도감 / 마을 기록 */
(()=>{
  'use strict';
  const KEY='dangcheong-dowon-menu-new-v1';
  const targets={achievements:'menu-achievements',collection:'menu-collection',news:'menu-news'};
  let state={achievements:false,collection:false,news:false};
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved&&typeof saved==='object')state={...state,...saved};
  }catch(_){ }
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}};
  function badge(kind){
    const button=document.getElementById(targets[kind]);
    if(!button)return null;
    let node=button.querySelector('.menu-new-badge');
    if(!node){
      node=document.createElement('span');
      node.className='menu-new-badge';
      node.textContent='NEW!';
      node.setAttribute('aria-hidden','true');
      button.append(node);
    }
    return node;
  }
  function render(kind){
    const node=badge(kind);if(!node)return;
    node.hidden=!state[kind];
    const button=document.getElementById(targets[kind]);
    if(button){
      if(state[kind])button.setAttribute('data-has-new','true');
      else button.removeAttribute('data-has-new');
    }
  }
  function mark(kind){if(!(kind in targets)||state[kind])return;state[kind]=true;save();render(kind);}
  function read(kind){if(!(kind in targets)||!state[kind])return;state[kind]=false;save();render(kind);}
  window.dowonMenuNew={mark,read,get:()=>({...state})};
  for(const kind of Object.keys(targets))render(kind);
})();
