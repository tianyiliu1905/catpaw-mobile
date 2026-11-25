/* Mobile adaptation of the desktop enterprise-knowledge picker. */
(() => {
  const independent = new URLSearchParams(location.search).get('knowledge-mode') === 'independent';
  const iconMode = new URLSearchParams(location.search).get('knowledge-mode') === 'icons';
  const individual = independent || iconMode;
  const databases = [
    { id:'product', name:'产品文档与使用指南', description:'产品介绍、功能说明与使用指南' },
    { id:'project', name:'项目需求与设计资料', description:'项目方案、需求与交付资料' },
    { id:'team', name:'团队流程与协作规范', description:'团队流程、协作规范与常见问题' },
  ];
  const input = document.querySelector('#message');
  const trigger = document.querySelector('#knowledge-trigger');
  const content = document.querySelector('#sheet-content');
  const layer = document.querySelector('#modal-layer');
  input.knowledgeEnabled = false;
  input.knowledgeBases = [];
  let remembered = new Set();
  let hasSelection = false;
  let iconAllMode = false;
  let selection = { enabled:false, selected:new Set() };

  function syncTrigger() {
    const count = input.knowledgeBases.length;
    const badge = document.querySelector('#knowledge-count');
    badge.textContent = String(count);
    const single=count===1;
    document.querySelector('#knowledge-label').textContent=single?input.knowledgeBases[0]:'知识';
    badge.hidden = !input.knowledgeEnabled || single;
    const individualTags=iconMode && !iconAllMode && input.knowledgeEnabled && count>0;
    const tagList=document.querySelector('#knowledge-document-tags');
    tagList.replaceChildren();
    tagList.hidden=!individualTags;
    if(individualTags){
      input.knowledgeBases.forEach(name=>{
        const tag=document.createElement('button');tag.type='button';
        tag.className='composer-context-tag knowledge-context knowledge-document-trigger';
        tag.setAttribute('aria-label',`重新选择知识：${name}`);tag.setAttribute('aria-haspopup','dialog');
        tag.innerHTML='<svg aria-hidden="true"><use href="#book"/></svg><span></span>';
        tag.querySelector('span').textContent=name;tagList.append(tag);
      });
    }
    trigger.hidden = !input.knowledgeEnabled || individualTags;
    document.querySelector('#knowledge-context').hidden = !input.knowledgeEnabled || individualTags;
    trigger.classList.toggle('is-enabled', input.knowledgeEnabled);
    trigger.setAttribute('aria-label', input.knowledgeEnabled ? `选择知识，已选择 ${input.knowledgeBases.join("、")}` : '选择知识库');
    window.updateInput();
  }
  function clear() {
    remembered = new Set();
    hasSelection = false;
    iconAllMode = false;
    selection = { enabled:false, selected:new Set() };
    input.knowledgeEnabled = false;
    input.knowledgeBases = [];
    syncTrigger();
  }
  function renderOptions() {
    const list = document.querySelector('#knowledge-options');
    list.hidden=iconMode && !selection.enabled;
    list.replaceChildren();
    databases.forEach(item => {
      const row = document.createElement(iconMode?'div':'label');
      row.className = 'knowledge-option'+(individual || selection.enabled?'':' is-disabled');
      if(iconMode){
        row.innerHTML=`<span class="knowledge-option-name">${item.name}</span><button type="button" class="knowledge-item-add" data-knowledge-add="${item.id}" aria-label="指定${item.name}"><img src="assets/figma/knowledge-focus.svg" alt=""></button>`;
        list.append(row);return;
      }
      row.innerHTML = `<span class="knowledge-option-name">${item.name}</span><input type="checkbox" data-knowledge-id="${item.id}" aria-label="${item.name}">`;
      const checkbox = row.querySelector('input');
      checkbox.checked = selection.selected.has(item.id);
      checkbox.disabled = !independent && !selection.enabled;
      list.append(row);
    });
    syncPanel();
  }
  function syncPanel() {
    const toggle = document.querySelector('#knowledge-enterprise-toggle');
    if(independent){
      toggle.checked=selection.selected.size===databases.length;
      toggle.indeterminate=false;
    }else{
      toggle.setAttribute('aria-checked',String(selection.enabled));
      if(iconMode)toggle.setAttribute('aria-label','添加全部知识库');
    }
  }
  function saveSelection() {
    remembered=new Set(selection.selected);
    hasSelection=true;
    input.knowledgeEnabled = individual ? selection.selected.size > 0 : selection.enabled;
    input.knowledgeBases = input.knowledgeEnabled ? databases.filter(item=>selection.selected.has(item.id)).map(item=>item.name) : [];
    syncTrigger();
  }
  function open({ fromAdd = false } = {}) {
    const allControl=independent
      ? '<label class="knowledge-all-label"><span>全选</span><input type="checkbox" class="knowledge-all-checkbox" id="knowledge-enterprise-toggle" aria-label="全选知识库"></label>'
      : '<button type="button" class="knowledge-switch" id="knowledge-enterprise-toggle" role="switch" aria-checked="false" aria-label="使用企业知识"><span></span></button>';
    selection = { enabled:input.knowledgeEnabled, selected:individual?new Set(databases.filter(item=>input.knowledgeBases.includes(item.name)).map(item=>item.id)):new Set(remembered) };
    window.showSheet(`${window.pickerSheetHeader('选择知识库','knowledge-cancel',fromAdd)}
      <div class="knowledge-enterprise"><svg class="knowledge-enterprise-icon" aria-hidden="true"><use href="#book"/></svg><strong>企业知识</strong>${allControl}</div>
      <div class="knowledge-options" id="knowledge-options" role="group" aria-label="可选知识库"></div>`, iconMode?'knowledge-sheet knowledge-icons-sheet':'knowledge-sheet');
    trigger.setAttribute('aria-expanded','true');
    renderOptions();
  }
  // Keep the caret and keyboard stable until the toolbar click opens its sheet.
  trigger.addEventListener('pointerdown', event => {
    if (event.button === 0) event.preventDefault();
  });
  trigger.addEventListener('click',()=>open());
  const documentTags=document.querySelector('#knowledge-document-tags');
  documentTags.addEventListener('pointerdown',event=>{if(event.button===0)event.preventDefault();});
  documentTags.addEventListener('click',event=>{if(event.target.closest('.knowledge-document-trigger'))open();});
  content.addEventListener('change', event => {
    if(independent && event.target.id==='knowledge-enterprise-toggle'){
      selection.enabled=event.target.checked;
      selection.selected=new Set(event.target.checked?databases.map(item=>item.id):[]);
      renderOptions();saveSelection();return;
    }
    const checkbox=event.target.closest('[data-knowledge-id]');
    if (!checkbox || (!independent && !selection.enabled)) return;
    if (checkbox.checked) selection.selected.add(checkbox.dataset.knowledgeId);
    else selection.selected.delete(checkbox.dataset.knowledgeId);
    syncPanel();
    saveSelection();
  });
  content.addEventListener('click', event => {
    const button=event.target.closest('button');if (!button)return;
    const itemId=button.dataset.knowledgeAdd;
    if(iconMode && itemId){
      if(iconAllMode)selection.selected=new Set();
      iconAllMode=false;
      selection.selected.add(itemId);
      selection.enabled=true;
      renderOptions();saveSelection();
      window.closeSheet();
      return;
    }
    switch (button.id) {
      case 'knowledge-enterprise-toggle':
        selection.enabled=independent ? selection.selected.size !== databases.length : !selection.enabled;
        if(iconMode)iconAllMode=selection.enabled;
        if(individual)selection.selected=new Set(selection.enabled?databases.map(item=>item.id):[]);
        else if(selection.enabled && !hasSelection)selection.selected=new Set(databases.map(item=>item.id));
        renderOptions();saveSelection();
        break;
      case 'knowledge-cancel':
        window.closeSheet();break;
    }
  });
  new MutationObserver(() => {
    if(layer.hidden) trigger.setAttribute('aria-expanded','false');
  }).observe(layer,{ attributes:true, attributeFilter:['hidden'] });
  window.CatpawKnowledge = { clear, open };
  syncTrigger();
})();
