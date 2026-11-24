/* Authoring view: capture each knowledge-flow state in an isolated Demo instance. */
(() => {
  if (new URLSearchParams(location.search).has('design-capture')) return;
  const independent = new URLSearchParams(location.search).get('knowledge-mode') === 'independent';
  const phone = document.querySelector('#app');
  document.documentElement.classList.add('has-design-review');
  const toolbar = document.createElement('div');toolbar.className='review-toolbar';
  toolbar.innerHTML='<span class="review-product">Catpaw Mobile</span><div class="review-tabs" role="tablist" aria-label="预览方式"><button type="button" role="tab" id="review-interactive" aria-controls="app" aria-selected="true">交互演示</button><button type="button" role="tab" id="review-design" aria-controls="review-gallery" aria-selected="false" tabindex="-1">设计稿</button></div>';
  const version=document.createElement('label');version.className='review-version';
  version.innerHTML='<span>交互版本</span><select aria-label="交互版本"><option value="original">原版</option><option value="independent">新版 · 独立添加</option></select>';
  version.querySelector('select').value=independent?'independent':'original';
  version.querySelector('select').addEventListener('change',event=>{
    const url=new URL(location.href);
    if(event.target.value==='independent')url.searchParams.set('knowledge-mode','independent');else url.searchParams.delete('knowledge-mode');
    location.href=url.href;
  });
  toolbar.insertBefore(version,toolbar.querySelector('.review-tabs'));
  const gallery=document.createElement('section');gallery.className='review-gallery';gallery.id='review-gallery';gallery.hidden=true;gallery.setAttribute('role','tabpanel');gallery.setAttribute('aria-labelledby','review-design');
  gallery.innerHTML='<header class="review-heading"><div><h1>添加知识库</h1></div><button type="button" class="review-regenerate">重新生成</button></header><p class="review-progress" role="status" aria-live="polite" hidden></p><div class="review-steps"></div>';
  document.body.prepend(toolbar);document.body.append(gallery);
  const status=gallery.querySelector('.review-progress');
  const regenerate=gallery.querySelector('.review-regenerate');
  let generating=false, complete=false;
  const snapshots=[];
  const steps=[
    ['默认首页','输入框为单行，尚未启用知识库。'],
    ['展开输入','点击输入框，文字区展开为两行并唤起键盘。'],
    ['打开添加面板','点击加号，选择列表中的“知识库”。'],
    ['选择知识库',independent?'可点击“使用全部”，也可直接勾选下方任意知识库。':'企业知识默认关闭，列表不可选择。'],
    independent?['单独添加','直接勾选“产品文档与使用指南”，立即添加，不影响其他选项。']:['开启企业知识','开启开关，默认选中全部三个知识库。'],
    independent?['一键使用全部','点击“使用全部”，一次使用全部三个知识库；按钮变为“取消全选”。']:['按需调整','取消“团队流程与协作规范”，保留两个知识库。'],
    ['已添加知识库',`选择即时生效，关闭面板后输入正文上方显示绿色“知识库 ${independent?3:2}”。`],
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
      const src=new URL(`assets/${independent?'design-review-independent':'design-review'}/step-${index+1}.png?v=20261124-use-all-black`,location.href).href;
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
      const url=new URL('index.html',location.href);url.searchParams.set('design-capture','1');if(independent)url.searchParams.set('knowledge-mode','independent');iframe.src=url.href;document.body.append(iframe);await loaded;clearTimeout(timeout);
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
        if(index===5)click(independent?'#knowledge-enterprise-toggle':'[data-knowledge-id="team"]');
        if(index===6){click('#knowledge-cancel');await waitFor(win,()=>doc.querySelector('#modal-layer').hidden);win.CatpawDemoKeyboard.setOpen(true,true);}
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
