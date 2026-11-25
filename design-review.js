/* Authoring view: capture each knowledge-flow state in an isolated Demo instance. */
(() => {
  if (new URLSearchParams(location.search).has('design-capture')) return;
  const independent = new URLSearchParams(location.search).get('knowledge-mode') === 'independent';
  const iconMode = new URLSearchParams(location.search).get('knowledge-mode') === 'icons';
  const phone = document.querySelector('#app');
  document.documentElement.classList.add('has-design-review');
  const toolbar = document.createElement('div');toolbar.className='review-toolbar';
  toolbar.innerHTML='<span class="review-product">Catpaw Mobile</span><div class="review-tabs" role="tablist" aria-label="预览方式"><button type="button" role="tab" id="review-interactive" aria-controls="app" aria-selected="true">交互演示</button><button type="button" role="tab" id="review-design" aria-controls="review-gallery" aria-selected="false" tabindex="-1">设计稿</button></div>';
  const gallery=document.createElement('section');gallery.className='review-gallery';gallery.id='review-gallery';gallery.hidden=true;gallery.setAttribute('role','tabpanel');gallery.setAttribute('aria-labelledby','review-design');
  gallery.innerHTML='<header class="review-heading"><div><h1>添加知识库</h1></div><button type="button" class="review-regenerate">重新生成</button></header><p class="review-progress" role="status" aria-live="polite" hidden></p><div class="review-steps"></div>';
  document.body.prepend(toolbar);document.body.append(gallery);
  const notes=document.createElement('aside');notes.className='scheme-notes';notes.setAttribute('aria-label','方案优势');
  const currentScheme=iconMode?'icons':independent?'independent':'original';
  notes.innerHTML=[['original','方案一','方便随时开关企业知识。'],['independent','方案二','方便每次选择。'],['icons','方案三','方便单选。']].map(([value,title,description])=>`<div class="scheme-note"><div class="scheme-note-heading"><h2>${title}</h2><button type="button" data-scheme="${value}" aria-label="${currentScheme===value?'当前':'切换到'}${title}" aria-pressed="${currentScheme===value}">${currentScheme===value?'当前':'切换'}</button></div>${description?`<p>${description}</p>`:''}</div>`).join('');
  notes.addEventListener('click',event=>{
    const button=event.target.closest('[data-scheme]');if(!button||button.dataset.scheme===currentScheme)return;
    const url=new URL(location.href);
    if(button.dataset.scheme==='original')url.searchParams.delete('knowledge-mode');else url.searchParams.set('knowledge-mode',button.dataset.scheme);
    location.href=url.href;
  });
  document.body.append(notes);
  const status=gallery.querySelector('.review-progress');
  const regenerate=gallery.querySelector('.review-regenerate');
  let generating=false, complete=false;
  const snapshots=[];
  const steps=[
    ['默认首页','输入框为单行，尚未启用知识库。'],
    ['展开输入','点击输入框，文字区展开为两行并唤起键盘。'],
    ['打开添加面板','点击加号，选择列表中的“知识库”。'],
    ['选择知识库',iconMode?'企业知识默认关闭，下方列表隐藏。':independent?'可勾选“全选”，也可直接勾选下方任意知识库。':'企业知识默认关闭，列表不可选择。'],
    iconMode?['开启并多选全部','开启开关后展示列表，默认选中全部知识库；面板保持打开。']:independent?['单独添加','直接勾选“产品文档与使用指南”，立即添加，不影响其他选项。']:['开启企业知识','开启开关，默认选中全部三个知识库。'],
    iconMode?['单项添加后返回首页','首次点击单项右侧的指定图标进入逐项添加，回到首页显示所选知识文档的名称；再次打开列表仍显示相同图标。']:independent?['一键全选','勾选“全选”可选中全部三个知识库；取消勾选可清空，取消任一单项后，“全选”恢复空心描边状态。']:['按需调整','取消“团队流程与协作规范”，保留两个知识库；关闭开关暂停使用但保留勾选，再开启恢复。'],
    ['已添加知识库',iconMode?'再次打开并添加另一项，输入框标签累加为“知识 2”；重复添加同一项不会重复计数。':`选择即时生效，关闭面板后输入正文上方显示绿色“知识 ${independent?3:2}”。`],
    ['收起输入','空内容点击外部后恢复单行，已选知识库标签仍显示在输入区上方。'],
    ['专家与知识库并排','专家和知识库标签并排位于输入正文上方；点击知识库标签重新选择，专家可通过叉号移除。'],
  ];
  const frames=steps.map(([title,description],index)=>{
    const figure=document.createElement('figure');figure.className='review-step';
    figure.innerHTML=`<button type="button" class="review-step-image" aria-label="查看步骤 ${index+1}：${title}" disabled></button><figcaption><div class="review-step-label"><span>${String(index+1).padStart(2,'0')} · ${title}</span></div><p>${description}</p></figcaption>`;
    if(index===6){
      const note=document.createElement('p');
      note.textContent='交互说明：点击输入正文上方的绿色知识库标签，可再次打开“选择知识库”弹窗，调整已选知识库；修改立即生效。';
      figure.querySelector('figcaption').append(note);
    }
    gallery.querySelector('.review-steps').append(figure);
    figure.querySelector('button').addEventListener('click',()=>openImage(index));
    return figure;
  });
  function loadSavedSnapshots() {
    for (let index=0;index<steps.length;index++) {
      const src=new URL(`assets/${iconMode?'design-review-icons':independent?'design-review-independent':'design-review'}/step-${index+1}.png?v=20261125-text16`,location.href).href;
      snapshots[index]=src;
      const button=frames[index].querySelector('button');
      const image=document.createElement('img');image.src=src;image.alt=`${steps[index][0]}：${steps[index][1]}`;
      button.replaceChildren(image);button.disabled=false;
    }
    complete=true;
    status.textContent='';status.hidden=true;
  }
  function openImage(index) {
    if(!snapshots[index])return;
    const box=document.createElement('div');box.className='review-lightbox';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label',steps[index][0]);
    const image=document.createElement('img');image.src=snapshots[index];image.alt=steps[index][0];
    const close=document.createElement('button');close.type='button';close.textContent='关闭';
    const dismiss=()=>{box.remove();document.removeEventListener('keydown',key);gallery.inert=false;toolbar.inert=false;frames[index].querySelector('button').focus();};
    const key=event=>{if(event.key==='Escape')dismiss();if(event.key==='Tab'){event.preventDefault();close.focus();}};
    box.addEventListener('click',event=>{if(event.target===box)dismiss();});close.addEventListener('click',dismiss);
    box.append(image,close);document.body.append(box);gallery.inert=true;toolbar.inert=true;document.addEventListener('keydown',key);close.focus();
  }
  function setMode(mode) {
    const design=mode==='design';phone.hidden=design;phone.inert=design;gallery.hidden=!design;
    document.body.classList.toggle('design-review-mode',design);
    if(design)gallery.querySelector('.review-heading').after(notes);else document.body.append(notes);
    for(const button of toolbar.querySelectorAll('[role=tab]')){
      const selected=button.id===(design?'review-design':'review-interactive');
      button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
    }
    const url=new URL(location.href);design?url.searchParams.set('view','design'):url.searchParams.delete('view');window.history.replaceState(null,'',url);
    window.dispatchEvent(new Event('resize'));
    if(design&&!generating&&!complete)generate();
  }
  toolbar.querySelector('#review-interactive').addEventListener('click',()=>setMode('interactive'));
  toolbar.querySelector('#review-design').addEventListener('click',()=>setMode('design'));
  toolbar.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const design=event.key==='ArrowRight';setMode(design?'design':'interactive');toolbar.querySelector(design?'#review-design':'#review-interactive').focus();}});
  regenerate.addEventListener('click',()=>{if(location.protocol==='file:'){loadSavedSnapshots();return;}complete=false;generate();});
  if(location.protocol==='file:')regenerate.textContent='重新加载';

  const settle=win=>new Promise(resolve=>win.requestAnimationFrame(()=>win.requestAnimationFrame(resolve)));
  async function waitFor(win,predicate) {
    const start=performance.now();
    while(!predicate()){
      if(performance.now()-start>4000)throw new Error('步骤状态未能及时完成');
      await settle(win);
    }
  }
  function inlineSymbols(doc,node) {
    // Local SVG symbols live outside #app. Copy their instances into the capture
    // only so the image is self-contained and retains the original icon paths.
    for(const use of node.querySelectorAll('svg use')){
      const symbol=doc.getElementById((use.getAttribute('href')||'').slice(1));if(!symbol)continue;
      const group=doc.createElementNS('http://www.w3.org/2000/svg','g');
      for(const child of symbol.childNodes)group.append(child.cloneNode(true));use.replaceWith(group);
    }
  }
  async function generate() {
    if(generating)return;generating=true;regenerate.disabled=true;status.hidden=false;status.textContent='正在生成分步设计稿（0/9）…';
    const iframe=document.createElement('iframe');iframe.className='review-capture-host';iframe.tabIndex=-1;iframe.setAttribute('aria-hidden','true');iframe.title='设计稿生成实例';
    let timeout;
    try {
      const loaded=new Promise((resolve,reject)=>{iframe.onload=resolve;iframe.onerror=()=>reject(new Error('无法加载设计稿实例'));timeout=setTimeout(()=>reject(new Error('设计稿实例加载超时')),15000);});
      const url=new URL('index.html',location.href);url.searchParams.set('design-capture','1');if(iconMode||independent)url.searchParams.set('knowledge-mode',iconMode?'icons':'independent');iframe.src=url.href;document.body.append(iframe);await loaded;clearTimeout(timeout);
      const win=iframe.contentWindow,doc=iframe.contentDocument,app=doc.querySelector('#app');
      if(!win.CatpawKnowledge||!win.CatpawDemoKeyboard||!window.htmlToImage)throw new Error('设计稿依赖未加载，请刷新后重试');
      const style=doc.createElement('style');style.textContent='*{animation:none!important;transition:none!important;caret-color:transparent!important}#app{width:390px!important;height:844px!important;max-width:none!important;zoom:1!important;--composer-action-size:28px!important}';doc.head.append(style);
      await doc.fonts.ready;win.newChat();
      const click=selector=>{const element=doc.querySelector(selector);if(!element)throw new Error('缺少流程节点：'+selector);element.click();};
      for(let index=0;index<steps.length;index++) {
        if(index===1)win.CatpawDemoKeyboard.setOpen(true,true);
        if(index===2)win.openAdd();
        if(index===3)win.document.querySelector('[data-action="knowledge"]').click();
        if(index===4)click(independent?'[data-knowledge-id="product"]':'#knowledge-enterprise-toggle');
        if(index===5){click(iconMode?'[data-knowledge-add="product"]':independent?'#knowledge-enterprise-toggle':'[data-knowledge-id="team"]');if(iconMode)await waitFor(win,()=>doc.querySelector('#modal-layer').hidden);}
        if(index===6){if(iconMode){win.CatpawKnowledge.open();click('[data-knowledge-add="team"]');}else click('#knowledge-cancel');await waitFor(win,()=>doc.querySelector('#modal-layer').hidden);win.CatpawDemoKeyboard.setOpen(true,true);}
        if(index===7)win.CatpawDemoKeyboard.dismiss(true);
        if(index===8){win.CatpawDemoKeyboard.setOpen(true,true);win.openExperts();click('[data-expert="数据分析师"]');await waitFor(win,()=>doc.querySelector('#modal-layer').hidden);win.CatpawDemoKeyboard.setOpen(true,true);}
        await settle(win);
        doc.getAnimations().forEach(animation=>{try{animation.finish();}catch{animation.cancel();}});
        app.querySelectorAll('input[type=checkbox]').forEach(input=>input.toggleAttribute('checked',input.checked));
        inlineSymbols(doc,app);
        const png=await window.htmlToImage.toPng(app,{
          width:390,height:844,pixelRatio:2,skipFonts:true,backgroundColor:'#ffffff',
          filter:node=>node===app||node.nodeType!==1||(win.getComputedStyle(node).display!=='none'&&win.getComputedStyle(node).visibility!=='hidden'),
        });
        snapshots[index]=png;
        const button=frames[index].querySelector('button');const image=document.createElement('img');image.src=png;image.alt=`${steps[index][0]}：${steps[index][1]}`;button.replaceChildren(image);button.disabled=false;
        status.textContent=`正在生成分步设计稿（${index+1}/9）…`;
      }
      complete=true;status.textContent='';status.hidden=true;
    } catch(error) {
      status.textContent=`生成未完成：${error.message}。可点击“重新生成”重试。`;
    } finally { clearTimeout(timeout);iframe.remove();generating=false;regenerate.disabled=false; }
  }
  loadSavedSnapshots();
  setMode(new URLSearchParams(location.search).get('view')==='design'?'design':'interactive');
})();
