const $ = (selector) => document.querySelector(selector);
const icon = (name) => `<svg aria-hidden="true"><use href="#${name}"/></svg>`;
const skills = [
  ['catpaw-pptx', '使用 catdeck 创建与编辑 PowerPoint 演示文稿，支持视觉风格定制', 'palette'],
  ['docx', '文档创建、编辑与分析，支持修订、批注和格式保留', 'document'],
  ['expert-manager', '创建、管理和更新专家 (Expert)，扩展 AI 能力', 'palette'],
  ['pdf', 'PDF 处理工具：文本提取、合并拆分、表单填写', 'document'],
  ['pptx', '读取、编辑及合并拆分已有 PPT 演示文稿；创建或生成演示文稿', 'document'],
  ['skill-creator', '创建和更新技能，让 Catpaw 更懂你的工作方式', 'document'],
  ['xlsx', '创建和分析电子表格，处理数据、公式与图表', 'document'],
];

// Expert identities and avatars are reused from catpaw-desktop-ui/app.js.
const mobileExperts = [
  {name:'数据开发', description:'搭建数据流程，处理复杂数据任务', palette:'data'},
  {name:'产品顾问', description:'梳理用户需求，完善产品方案', palette:'product'},
  {name:'数据分析师', description:'洞察数据变化，提炼业务结论', palette:'analysis'},
  {name:'前端工程师', description:'实现页面交互，优化使用体验', palette:'frontend'}
];
let currentExpert = '';
  function mobileExpertAvatar(name, rounded = false) {
    const palette = mobileExperts.find(expert => expert.name === name)?.palette || 'data';
    return `<svg class="expert-avatar${rounded ? ' expert-avatar-rounded' : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${rounded ? `<rect width="24" height="24" rx="6" fill="var(--expert-${palette}-background)"/>` : `<circle cx="12" cy="12" r="12" fill="var(--expert-${palette}-background)"/>`}<path d="M4.2 24V12.3c0-3.4 1-6.5 2.8-8.9l2 3.4a8.5 8.5 0 0 1 6.4-.5l1.3-2.9c2 2.8 3.3 5.6 3.3 8.9 0 3.2-1.2 5.3-3.2 6.1-.5.2-.6.5-.6 1V24Z" fill="var(--expert-${palette}-face)"/><circle cx="10.6" cy="11.7" r="1" fill="var(--expert-${palette}-accent)"/><circle cx="15.8" cy="11.4" r="1" fill="var(--expert-${palette}-accent)"/></svg>`;
  }
function pickerSheetHeader(title, fromAdd = false) {
  const back = fromAdd ? '<button type="button" class="picker-sheet-back" data-action="back-to-add" aria-label="返回添加面板"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m14 6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' : '<span></span>';
  return `<div class="picker-sheet-heading">${back}<h2 class="sheet-title" id="sheet-title">${title}</h2><span aria-hidden="true"></span></div>`;
}
function openExperts({ fromAdd = false } = {}) {
  showSheet(`${pickerSheetHeader('我的专家', fromAdd)}<div class="mobile-expert-list" role="group" aria-label="选择专家">${mobileExperts.map(expert => `<button type="button" class="mobile-expert-row" data-expert="${expert.name}" aria-pressed="${expert.name === currentExpert}">${mobileExpertAvatar(expert.name,true)}<span class="mobile-expert-copy"><strong>${expert.name}</strong><small>${expert.description}</small></span><span class="mobile-expert-state">${expert.name===currentExpert?'已选':''}</span></button>`).join('')}</div>`, 'experts-sheet');
}
let currentSkill = '';
let model = 'Auto';
let lastFocus;
let closeTimer;
let toastTimer;
const history = ['New Chat'];
const savedChats = new Map();
let activeChat = 'New Chat';
let replyTimer;
let generating = false;
const layer = $('#modal-layer');
const sheet = $('#sheet');
const content = $('#sheet-content');

function showSheet(html, type = '') {
  clearTimeout(closeTimer);
  if (layer.hidden) lastFocus = document.activeElement;
  layer.classList.remove('closing');
  layer.hidden = false;
  sheet.className = `sheet ${type}`;
  if (!type.split(' ').includes('knowledge-sheet')) $('#knowledge-trigger').setAttribute('aria-expanded', 'false');
  $('#sheet-handle').hidden = ['knowledge-sheet','skills-sheet','experts-sheet','commands-sheet','add-sheet'].includes(type.split(' ')[0]);
  content.innerHTML = html;
  $('#app-surface').inert = true;
  // Focusing the entering sheet must not scroll the phone underneath it.
  sheet.focus({ preventScroll: true });
}
function closeSheet() {
  if (layer.hidden) return;
  layer.classList.add('closing');
  $('#app-surface').inert = false;
  closeTimer = setTimeout(() => {
    layer.hidden = true;
    layer.classList.remove('closing');
    $('#app-surface').inert = false;
    if (sheet.contains(document.activeElement) || document.activeElement === document.body) lastFocus?.focus({ preventScroll: true });
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180);
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => $('#toast').hidden = true, 2400);
}
function openAdd() {
  showSheet(`<h2 id="sheet-title" hidden>添加到对话</h2><div class="attachment-grid">${[['camera','拍照'],['image','相册'],['file','文件'],['book','资料库']].map(([name,label]) => `<button class="attachment-tile" data-attachment="${name}">${icon(name)}<span>${label}</span></button>`).join('')}</div>${[['brain','专家','experts'],['book','知识库','knowledge'],['skills','技能','skills'],['terminal','自定义命令','commands']].map(([name,label,action])=>`<button class="action-row" data-action="${action}"><span class="row-icon">${icon(name)}</span><strong>${label}</strong></button>`).join('')}`, 'add-sheet');
}
function openSkills({ fromAdd = false } = {}) {
  showSheet(`${pickerSheetHeader('我的技能', fromAdd)}<div class="skill-list">${skills.map(([name,description,type],i)=>`<button class="skill-row" data-skill="${i}"><span class="skill-art ${type}">${type==='palette'?'<img src="assets/logo.png" alt="">':`<img src="assets/${{docx:'artifact-doc',pdf:'artifact-pdf',pptx:'artifact-ppt','skill-creator':'artifact-markdown',xlsx:'artifact-excel'}[name]}.svg" alt="">`}</span><span class="skill-copy"><span class="skill-name">${name}<span class="badge">内置</span></span><span class="skill-description">${description}</span></span></button>`).join('')}</div>`, 'skills-sheet');
}
function selectSkill(index) {
  currentSkill = skills[index][0];
  $('#selected-skill').innerHTML = `${icon('skills')}<span>${currentSkill}</span><button type="button" id="remove-skill" aria-label="移除技能">${icon('close')}</button>`;
  $('#selected-skill').hidden = false;
  updateInput();
  closeSheet();
}
function fillPrompt(text) {
  $('#message').value = text;
  updateInput();
  $('#message').focus();
}
function syncExpertTag() {
  $('#expert-context').hidden=!currentExpert;
  $('#expert-trigger').innerHTML=currentExpert?`${mobileExpertAvatar(currentExpert)}<span>${currentExpert}</span>`:'';
  $('#composer-contexts').hidden=!currentExpert && !$('#message').knowledgeEnabled && $('#selected-skill').hidden;
}
function updateInput() {
  syncExpertTag();
  const input = $('#message');
  const form = $('#chat-form');
  const hasText = Boolean(input.value.trim());
  const hasContext = !$('#selected-skill').hidden || !$('#attachment-preview').hidden;
  const editing = form.contains(document.activeElement) || $('#app').classList.contains('keyboard-open');
  form.classList.remove('is-multiline');
  input.style.height = '24px';
  const multiline = editing || hasContext || (hasText && (input.value.includes('\n') || input.scrollHeight > 25));
  form.classList.toggle('is-multiline', multiline);
  form.classList.toggle('has-message', hasText);
  if (multiline) {
    input.style.height = '0px';
    input.style.height = Math.min(168, Math.max(48, input.scrollHeight)) + 'px';
  }
  input.style.overflowY = input.scrollHeight > 168 ? 'auto' : 'hidden';
  $('#expand-input').hidden = !multiline;
  $('#app').style.setProperty('--context-extra-height',Math.max(0,$('#composer-contexts').offsetHeight-28)+'px');
  $('#voice-button').hidden = generating || (hasText && !multiline);
  $('#send-button').hidden = !hasText || generating;
  $('#stop-button').hidden = !generating;
}
$('#add-button').addEventListener('click', openAdd);
$('#backdrop').addEventListener('click', closeSheet);
$('#sheet-handle').addEventListener('click', closeSheet);
document.addEventListener('keydown', event => {
  if ($('#app').classList.contains('sidebar-open')) {
    if (event.key === 'Escape') closeSidebar();
    if (event.key === 'Tab') {
      const buttons = [...$('#side-nav').querySelectorAll('button')].filter(el => el.getClientRects().length);
      if (event.shiftKey && document.activeElement === buttons[0]) {event.preventDefault();buttons.at(-1).focus({preventScroll:true});}
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) {event.preventDefault();buttons[0].focus({preventScroll:true});}
    }
    return;
  }
  if (layer.hidden) return;
  if (event.key === 'Escape') closeSheet();
  if (event.key === 'Tab') {
    const items = [...sheet.querySelectorAll('button,input,textarea')].filter(el => !el.hidden);
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === sheet)) {event.preventDefault();last?.focus({ preventScroll: true });}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus({ preventScroll: true });}
  }
});
content.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.skill !== undefined) return selectSkill(Number(button.dataset.skill));
  const action = button.dataset.action;
  if (action === 'close-sheet') return closeSheet();
  if (action === 'back-to-add') return openAdd();
  const fromAdd = sheet.classList.contains('add-sheet');
  if (action === 'knowledge') return window.CatpawKnowledge.open({ fromAdd });
  if (action === 'skills') return openSkills({ fromAdd });
  if (action === 'experts') return openExperts({ fromAdd });
  if (action === 'commands') return showSheet(`${pickerSheetHeader('自定义命令', fromAdd)}<div class="simple-list">${['总结这段内容','润色这段文字','翻译成英文'].map(name=>`<button class="action-row" data-command="${name}"><span class="row-icon">${icon('terminal')}</span>${name}</button>`).join('')}</div>`, 'commands-sheet');
  if (button.dataset.expert) {currentExpert=button.dataset.expert;updateInput();closeSheet();$('#message').focus({preventScroll:true});return;}
  if (button.dataset.command) {closeSheet();fillPrompt(`${button.dataset.command}：`);return;}
  if (button.dataset.model) {model=button.dataset.model;$('#model-button').textContent=model;closeSheet();return;}
  if (button.dataset.project) {$('#current-project').textContent=button.dataset.project;$('#side-project-name').textContent=button.dataset.project;closeSheet();return;}
  if (button.dataset.history !== undefined) {closeSheet();openHistory(Number(button.dataset.history));return;}
  if (action === 'new') {newChat();closeSheet();return;}
  const attachment = button.dataset.attachment;
  if (attachment === 'book') {showSheet('<h2 class="sheet-title" id="sheet-title">资料库</h2><p class="sheet-note">把常用资料放在这里，随时带入对话。</p><button class="action-row" data-attachment="file"><span class="row-icon">'+icon('plus')+'</span>添加本地资料</button>');return;}
  const input = {camera:'#camera-input',image:'#photo-input',file:'#file-input'}[attachment];
  if (input) {$(input).click();closeSheet();}
});
$('#expert-trigger').addEventListener('click',()=>openExperts());
$('#remove-expert').addEventListener('click',()=>{currentExpert='';updateInput();});
$('#selected-skill').addEventListener('click', event => {if(event.target.closest('#remove-skill')) {currentSkill='';$('#selected-skill').hidden=true;updateInput();}});
document.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>fillPrompt(button.dataset.prompt)));
document.querySelectorAll('input[type=file]').forEach(input=>input.addEventListener('change',()=>{if(!input.files.length)return;$('#attachment-preview').textContent='附件：'+[...input.files].map(file=>file.name).join('、');$('#attachment-preview').hidden=false;updateInput();toast(`已添加 ${input.files.length} 个附件`);}));
$('#model-button').addEventListener('click',()=>showSheet(`<h2 class="sheet-title" id="sheet-title">选择模式</h2><div class="simple-list">${['Auto','快速','深度思考'].map(name=>`<button class="action-row" data-model="${name}">${name}${name===model?icon('check'):''}</button>`).join('')}</div>`));
$('#project-button').addEventListener('click',()=>showSheet(`<h2 class="sheet-title" id="sheet-title">选择项目</h2><div class="simple-list">${['默认项目','日常灵感','工作空间'].map(name=>`<button class="action-row" data-project="${name}">${name}${name===$('#current-project').textContent?icon('check'):''}</button>`).join('')}</div>`));
$('#cloud-button').addEventListener('click',()=>toast('云端模式 · 设计演示'));
$('#more-button').addEventListener('click',()=>showSheet(`<h2 class="sheet-title" id="sheet-title">对话选项</h2><button class="action-row" data-action="new"><span class="row-icon">${icon('plus')}</span>开始新对话</button><p class="sheet-note">Catpaw Mobile · 交互设计 Demo</p>`));
$('#menu-button').addEventListener('click', openSidebar);
$('#message').addEventListener('input',updateInput);
$('#message').addEventListener('focus',() => {
  // Desktop keyboard coordinates expansion and movement in one layout update.
  if (!window.CatpawDemoKeyboard) updateInput();
});
$('#message').addEventListener('blur',() => requestAnimationFrame(updateInput));
// Empty drafts collapse on an outside tap, including after selecting knowledge.
document.addEventListener('pointerdown', event => {
  if (event.target.closest('#chat-form,#demo-keyboard,#editor-layer')) return;
  if ($('#message').value.trim()) return;
  if ($('#chat-form').contains(document.activeElement)) document.activeElement.blur();
  updateInput();
}, true);

$('#message').addEventListener('keydown',event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)&&!event.isComposing){event.preventDefault();$('#chat-form').requestSubmit();}});
$('#chat-form').addEventListener('submit',event=>{
  event.preventDefault();
  const text=$('#message').value.trim();
  if(!text)return;
  if (generating) finishReply();
  if ($('#conversation').hidden) activeChat = text;
  if (!history.includes(activeChat)) history.unshift(activeChat);
  enterConversation();
  const user=document.createElement('div');user.className='message user';user.textContent=text;
  const knowledge = $('#message').knowledgeBases || [];
  if (knowledge.length) {
    const references = document.createElement('div');references.className='message-knowledge';
    references.textContent='知识库：'+knowledge.join('、');user.append(references);
  }
  $('#conversation').append(user);
  const reply=document.createElement('div');reply.className='message assistant';
  reply.innerHTML = answerMarkup();
  $('#conversation').append(reply);
  const status=document.createElement('div');status.className='reply-status';status.textContent='正在整理回复';reply.append(status);
  generating = true;
  window.CatpawKnowledge?.clear();
  $('#message').value='';$('#attachment-preview').hidden=true;document.querySelectorAll('input[type=file]').forEach(input=>input.value='');updateInput();
  $('#conversation').scrollTop=$('#conversation').scrollHeight;
  replyTimer=setTimeout(finishReply,4000);
});
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
$('#voice-button').addEventListener('click',()=>{
  if(!SpeechRecognition){toast('当前浏览器不支持语音输入，请使用键盘输入');return;}
  const recognition=new SpeechRecognition();recognition.lang='zh-CN';recognition.interimResults=false;
  recognition.onstart=()=>{$('#voice-button').classList.add('recording');toast('正在聆听，请说话…');};
  recognition.onresult=event=>fillPrompt(event.results[0][0].transcript);
  recognition.onend=()=>$('#voice-button').classList.remove('recording');
  recognition.onerror=()=>toast('未能使用麦克风，请检查浏览器权限');recognition.start();
});

// Preserve a conventional 390 × 844 phone viewport in desktop previews.
function fitPhonePreview() {
  const framePadding = document.documentElement.classList.contains('has-design-review') ? 104 : 48;
  const scale = Math.min(1, (window.innerHeight - framePadding) / 844, (window.innerWidth - 48) / 390);
  const previewScale = Math.max(0.1, scale);
  document.documentElement.style.setProperty('--preview-scale', String(previewScale));
  // Keep the requested visible 28px control size when the desktop frame is zoomed.
  const effectiveScale = window.innerWidth >= 600 ? previewScale : 1;
  document.documentElement.style.setProperty('--composer-action-size', `${28 / effectiveScale}px`);
}
window.addEventListener('resize', fitPhonePreview);
fitPhonePreview();


function answerMarkup() {
  return `<article class="answer-body">
    <p>可以。这个手机端 Demo 可以围绕<strong>开始任务、选择能力、查看结果</strong>三个环节组织，让操作保持简单、内容更容易阅读。</p>
    <h2>核心设计</h2>
    <ul><li><strong>首页：</strong>保留问候语和项目入口，常用任务紧贴输入区，方便快速开始。</li><li><strong>能力选择：</strong>附件、专家与技能通过底部面板展开；所有面板保持相同高度，内容在内部滚动。</li><li><strong>对话阅读：</strong>正文采用 16px 字号与舒适的行距，通过标题、列表和加粗区分信息层级。</li></ul>
    <h2>导航与项目</h2>
    <p>点击左上角图标展开导航，当前页面向右移动，保留一部分对话作为上下文。新任务、专家、技能和资料库放在上方；项目与历史对话集中在下方。</p>
    <p>选择历史对话可以返回已保存的内容；新建任务则回到首页，开始新的对话。</p>
    <h2>需要留意的交互细节</h2>
    <p>输入区固定在底部。打开面板时保持底层页面的位置，关闭后继续原来的操作。对话内容可以独立滚动，顶部导航始终可见。</p>
    <p>回复整理过程中，右侧显示停止按钮；结束后恢复发送或语音入口。长内容通过段落间距、短标题和重点加粗来提高可读性。</p>
    <p class="answer-sources"><strong>参考：</strong><a href="https://developer.apple.com/design/human-interface-guidelines/layout" target="_blank" rel="noopener noreferrer">Apple 布局指南 ↗</a>、<a href="https://webkit.org/blog/7929/designing-websites-for-iphone-x/" target="_blank" rel="noopener noreferrer">WebKit 安全区域 ↗</a></p>
    <p>你可以继续选择技能、添加附件，或从左侧导航创建一个新任务。</p>
  </article>${replyActions()}`;
}
function enterConversation() {
  $('#app').classList.add('in-conversation');
  $('#welcome').hidden=true;
  $('#conversation').hidden=false;
  $('#new-chat-button').hidden=false;
  $('.app-header h1').textContent=activeChat === 'New Chat' ? '移动端交互设计与界面细节' : activeChat;
  $('.app-header h1').title=$('.app-header h1').textContent;
  $('#message').rows=1;
}
function finishReply() {
  clearTimeout(replyTimer);
  generating=false;
  document.querySelectorAll('.reply-status').forEach(el=>el.remove());
  if (!$('#conversation').hidden) savedChats.set(activeChat, $('#conversation').innerHTML);
  updateInput();
}
function newChat() {
  currentExpert='';
  finishReply();
  window.CatpawKnowledge?.clear();
  closeSidebar();
  $('#app').classList.remove('in-conversation');
  $('#conversation').replaceChildren();
  $('#conversation').hidden=true;
  $('#welcome').hidden=false;
  $('#new-chat-button').hidden=true;
  $('.app-header h1').textContent='新对话';
  $('#message').value='';$('#message').rows=1;
  currentSkill='';$('#selected-skill').hidden=true;updateInput();
  $('#attachment-preview').hidden=true;
  document.querySelectorAll('input[type=file]').forEach(input=>input.value='');
  activeChat='';updateInput();
}
function openHistory(index) {
  currentExpert='';
  finishReply();
  window.CatpawKnowledge?.clear();
  closeSidebar();
  activeChat=history[index];
  enterConversation();
  $('#conversation').innerHTML=savedChats.get(activeChat)||`<div class="message user">帮我整理手机端的设计方案，补齐界面细节与多行输入交互。</div><div class="message assistant">${answerMarkup()}</div>`;
  $('#conversation').scrollTop=0;
}
function renderHistory() {
  const list=$('#side-history');list.replaceChildren();
  history.forEach((title,index)=>{
    const button=document.createElement('button');button.className='side-history-item'+(title===activeChat?' active':'');
    button.dataset.chat=String(index);
    button.innerHTML=`${icon('loader')}<span class="history-title"></span><time>刚刚</time>`;
    button.querySelector('.history-title').textContent=title;
    list.append(button);
  });
}
function openSidebar() {
  renderHistory();
  $('#app').classList.add('sidebar-open');
  $('#side-nav').inert=false;$('#side-nav').setAttribute('aria-hidden','false');
  $('#menu-button').setAttribute('aria-expanded','true');
  $('#sidebar-dismiss').hidden=false;
  $('#app-surface').querySelectorAll('header,section,.composer-area').forEach(el=>el.inert=true);
  $('#side-nav button').focus({preventScroll:true});
}
function closeSidebar() {
  if(!$('#app').classList.contains('sidebar-open'))return;
  $('#app').classList.remove('sidebar-open');
  $('#side-nav').inert=true;$('#side-nav').setAttribute('aria-hidden','true');
  $('#menu-button').setAttribute('aria-expanded','false');
  $('#sidebar-dismiss').hidden=true;
  $('#app-surface').querySelectorAll('[inert]').forEach(el=>el.inert=false);
  $('#menu-button').focus({preventScroll:true});
}
$('#sidebar-dismiss').addEventListener('click',closeSidebar);
$('#new-chat-button').addEventListener('click',newChat);
$('#stop-button').addEventListener('click',finishReply);
$('#toggle-project').addEventListener('click',()=>{
  const expanded=$('#toggle-project').getAttribute('aria-expanded')==='true';
  $('#toggle-project').setAttribute('aria-expanded',String(!expanded));
  $('#side-project-content').hidden=expanded;
});
$('#side-nav').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.chat!==undefined){openHistory(Number(button.dataset.chat));return;}
  const nav=button.dataset.nav;if(!nav)return;
  if(nav==='new'){newChat();return;}
  closeSidebar();
  if(nav==='skills'){openSkills();return;}
  if(nav==='experts'){openExperts();return;}
  if(nav==='library'){openAdd();content.querySelector('[data-attachment="book"]').click();return;}
  if(nav==='add-project'){$('#project-button').click();return;}
  if(nav==='cloud'){toast('云端模式 · 设计演示');return;}
  if(nav==='device'){showSheet('<h2 class="sheet-title" id="sheet-title">我的设备</h2><p class="sheet-note">当前使用云端工作空间</p>');return;}
  if(nav==='sites'){fillPrompt('帮我创建一个网站');return;}
  if(nav==='connectors'){showSheet('<h2 class="sheet-title" id="sheet-title">连接器</h2><p class="sheet-note">连接常用工具，将资料带入对话。</p><p class="sheet-note">当前 Demo 尚未连接外部服务</p>');return;}
  if(nav==='scheduled'){showSheet('<h2 class="sheet-title" id="sheet-title">定时任务</h2><p class="sheet-note">暂无定时任务</p><p class="sheet-note">定时执行能力将在接入服务后开放</p>');return;}
  if(nav==='settings'){showSheet('<h2 class="sheet-title" id="sheet-title">设置</h2><p class="sheet-note">Catpaw Mobile · 设计演示<br>当前工作空间：Cloud<br>尚未连接真实 AI 服务</p>');}
});
$('#conversation').addEventListener('click',async event=>{
  const button=event.target.closest('[data-copy-reply]');if(!button)return;
  const text=button.closest('.message').querySelector('.answer-body').innerText;
  try{await navigator.clipboard.writeText(text);toast('已复制回复');}catch{toast('当前浏览器无法访问剪贴板');}
});
renderHistory();


function replyActions() {
  const now = new Date();
  const stamp = `${now.getMonth()+1}月${now.getDate()}日 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  return `<div class="reply-actions"><button data-copy-reply aria-label="复制回复"><img src="assets/figma/copy.svg" alt=""></button><button data-feedback="like" aria-label="赞同回复" aria-pressed="false"><img src="assets/figma/like.svg" alt=""></button><button data-feedback="dislike" aria-label="不赞同回复" aria-pressed="false"><img src="assets/figma/dislike.svg" alt=""></button><time datetime="${now.toISOString()}">${stamp}</time></div>`;
}
// Keep keyboard activation in the user's original pointer event on a real textarea.
$('#chat-form').addEventListener('click', event => {
  if (event.target.closest('button, textarea, .selected-skill, .attachment-preview')) return;
  $('#message').focus({preventScroll:true});
});
$('#expand-input').addEventListener('click', () => {
  $('#expanded-message').value = $('#message').value;
  $('#editor-layer').hidden = false;
  $('#app-surface').inert = true;
  $('#expanded-message').focus({preventScroll:true});
});
function closeEditor(apply) {
  if (apply) $('#message').value = $('#expanded-message').value;
  $('#editor-layer').hidden = true;
  $('#app-surface').inert = false;
  updateInput();
  $('#message').focus({preventScroll:true});
}
$('#editor-done').addEventListener('click', () => closeEditor(true));
$('#editor-cancel').addEventListener('click', () => closeEditor(false));
$('#editor-layer').addEventListener('keydown', event => {
  if (event.key === 'Escape') {event.preventDefault();closeEditor(false);}
  if (event.key === 'Tab') {
    const items=[$('#editor-cancel'),$('#editor-done'),$('#expanded-message')];
    if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1).focus({preventScroll:true});}
    else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0].focus({preventScroll:true});}
  }
});
$('#conversation').addEventListener('click', event => {
  const button=event.target.closest('[data-feedback]');if(!button)return;
  const wasPressed=button.getAttribute('aria-pressed')==='true';
  button.closest('.reply-actions').querySelectorAll('[data-feedback]').forEach(el=>el.setAttribute('aria-pressed','false'));
  button.setAttribute('aria-pressed',String(!wasPressed));
  if(!wasPressed)toast('已记录反馈');
  savedChats.set(activeChat,$('#conversation').innerHTML);
});
new ResizeObserver(() => updateInput()).observe($('#app'));
updateInput();
