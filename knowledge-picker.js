/* Mobile adaptation of the desktop enterprise-knowledge picker. */
(() => {
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
  let selection = { enabled:false, selected:new Set() };

  function syncTrigger() {
    const count = input.knowledgeBases.length;
    const badge = document.querySelector('#knowledge-count');
    badge.textContent = String(count);
    badge.hidden = !input.knowledgeEnabled;
    trigger.hidden = !input.knowledgeEnabled;
    trigger.classList.toggle('is-enabled', input.knowledgeEnabled);
    trigger.setAttribute('aria-label', input.knowledgeEnabled ? `选择知识库，已选择 ${count} 个` : '选择知识库');
    window.updateInput();
  }
  function clear() {
    input.knowledgeEnabled = false;
    input.knowledgeBases = [];
    syncTrigger();
  }
  function renderOptions() {
    const list = document.querySelector('#knowledge-options');
    list.replaceChildren();
    databases.forEach(item => {
      const row = document.createElement('label');
      row.className = 'knowledge-option'+(selection.enabled?'':' is-disabled');
      row.innerHTML = `<span class="knowledge-option-name">${item.name}</span><input type="checkbox" data-knowledge-id="${item.id}" aria-label="${item.name}">`;
      const checkbox = row.querySelector('input');
      checkbox.checked = selection.selected.has(item.id);
      checkbox.disabled = !selection.enabled;
      list.append(row);
    });
    syncPanel();
  }
  function syncPanel() {
    document.querySelector('#knowledge-enterprise-toggle').setAttribute('aria-checked',String(selection.enabled));
  }
  function saveSelection() {
    input.knowledgeEnabled = selection.enabled;
    input.knowledgeBases = databases.filter(item=>selection.selected.has(item.id)).map(item=>item.name);
    syncTrigger();
  }
  function open({ fromAdd = false } = {}) {
    selection = { enabled:input.knowledgeEnabled, selected:new Set(databases.filter(item=>input.knowledgeBases.includes(item.name)).map(item=>item.id)) };
    window.showSheet(`${window.pickerSheetHeader('选择知识库','knowledge-cancel',fromAdd)}
      <div class="knowledge-enterprise"><strong>企业知识</strong><button type="button" class="knowledge-switch" id="knowledge-enterprise-toggle" role="switch" aria-checked="false" aria-label="使用企业知识"><span></span></button></div>
      <div class="knowledge-options" id="knowledge-options" role="group" aria-label="可选知识库"></div>`, 'knowledge-sheet');
    trigger.setAttribute('aria-expanded','true');
    renderOptions();
  }
  // Keep the caret and keyboard stable until the toolbar click opens its sheet.
  trigger.addEventListener('pointerdown', event => {
    if (event.button === 0) event.preventDefault();
  });
  trigger.addEventListener('click',()=>open());
  content.addEventListener('change', event => {
    const checkbox=event.target.closest('[data-knowledge-id]');
    if (!checkbox || !selection.enabled) return;
    if (checkbox.checked) selection.selected.add(checkbox.dataset.knowledgeId);
    else selection.selected.delete(checkbox.dataset.knowledgeId);
    syncPanel();
    saveSelection();
  });
  content.addEventListener('click', event => {
    const button=event.target.closest('button');if (!button)return;
    switch (button.id) {
      case 'knowledge-enterprise-toggle':
        selection.enabled=!selection.enabled;
        selection.selected=new Set(selection.enabled?databases.map(item=>item.id):[]);
        renderOptions();saveSelection();break;
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
