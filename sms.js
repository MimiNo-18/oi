(function () {
    'use strict';
    const STORAGE_KEY = 'mimi_sms_app_v1';
    const TELECOM_KEY = 'mimi_telecom_service_v1';
    const FEE = 0.10;
    const DEFAULT_SMS_CSS = `/* 信息页样式模板（只作用于短信列表页） */
.sms-home-screen .sms-conversation-list { border-radius: 18px; }
.sms-home-screen .sms-conversation { min-height: 76px; }
.sms-home-screen .sms-conversation-name { color: #111827; }
.sms-home-screen .sms-conversation-preview { color: #727985; }`;
    const app = document.getElementById('smsApp');
    const view = document.getElementById('smsView');
    const backButton = document.getElementById('smsBackBtn');
    const composeButton = document.getElementById('smsComposeBtn');
    const headerTitle = document.getElementById('smsHeaderTitle');
    const toast = document.getElementById('smsToast');
    if (!app || !view || !backButton || !composeButton || !headerTitle || !toast) return;

    let state = loadState();
    let route = 'home';
    let activeId = '';
    let toastTimer;
    let longPressTimer = null;
    let suppressNextClick = false;
    let moreDrag = null;

    function uid(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
    function escapeHtml(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
    function defaultState() { return { conversations: [], presets: [], chatCss: '' }; }
    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (!saved || typeof saved !== 'object') return defaultState();
            return { ...defaultState(), ...saved, conversations: Array.isArray(saved.conversations) ? saved.conversations : [] };
        } catch (_) { return defaultState(); }
    }
    function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} }
    function telecomState() {
        try { const value = JSON.parse(localStorage.getItem(TELECOM_KEY) || 'null'); return value && typeof value === 'object' ? value : null; } catch (_) { return null; }
    }
    function primaryNumber() { const tel = telecomState(); return tel && (tel.numbers || []).find(n => n.id === tel.primaryId) || tel && (tel.numbers || [])[0] || null; }
    function formatPhone(phone) { const digits = String(phone || '').replace(/\D/g, ''); return digits.length === 11 ? `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}` : digits; }
    function lastMessage(conversation) { const messages = conversation && Array.isArray(conversation.messages) ? conversation.messages : []; return messages.length ? messages[messages.length - 1] : null; }
    /* function displayDate(timestamp) {
        const date = new Date(timestamp || Date.now());
        const now = new Date();
        if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
    return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
    */
    function displayDate(timestamp) { const date = new Date(timestamp || Date.now()); const now = new Date(); if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }); return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }); }
    function avatarMarkup(conversation, extraClass) {
        const name = conversation.name || conversation.phone || '?';
        if (conversation.avatar) return `<img class="sms-avatar ${extraClass || ''}" src="${escapeHtml(conversation.avatar)}" alt="">`;
        return `<div class="sms-avatar ${extraClass || ''}">${escapeHtml(Array.from(name)[0] || '?')}</div>`;
    }
    function sortConversations() { state.conversations.sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || (b.updatedAt || 0) - (a.updatedAt || 0)); }
    function availableContacts() {
        try { if (typeof contacts !== 'undefined' && Array.isArray(contacts) && contacts.length) return contacts; } catch (_) {}
        try { const raw = JSON.parse(localStorage.getItem('contacts') || '[]'); return Array.isArray(raw) ? raw : []; } catch (_) { return []; }
    }
    function seedConversations() {
        if (state.conversations.length) return;
        const seeds = [{
            id: 'mimi-assistant', phone: '', name: 'Mimi助手', avatar: '', unread: true, pinned: true, updatedAt: Date.now(),
            messages: [
                { id: uid('msg'), direction: 'in', text: '欢迎使用MimiPhone！', time: Date.now() - 1000 },
                { id: uid('msg'), direction: 'in', text: '列表页CSS设置请点击顶部“信息”聊天页CSS设置请点击上方三个点中的自定义CSS。', time: Date.now() }
            ]
        }];
        /* 联系人只在真正收到短信或主动新建会话时出现。 */
        /* const seeds = availableContacts().slice(0, 2).map((contact, index) => ({
            id: uid('sms'), phone: contact.phone || `1380000${String(1000 + index).slice(-4)}`,
            name: contact.name || contact.netName || '联系人', avatar: contact.avatar || '', phones: (contact.phoneNumbers && contact.phoneNumbers.length ? contact.phoneNumbers : [contact.phoneNumber || contact.phone]), unread: index === 0,
            updatedAt: Date.now() - index * 3600000,
            messages: [{ id: uid('msg'), direction: 'in', text: index === 0 ? '嗨，最近还好吗？' : '有空记得联系我～', time: Date.now() - index * 3600000 - 60000 }]
        }));
        if (!seeds.length) {
            seeds.push({ id: uid('sms'), phone: '138 0000 1001', name: '妈妈', avatar: '', unread: true, updatedAt: Date.now() - 1800000, messages: [{ id: uid('msg'), direction: 'in', text: '到家了吗？', time: Date.now() - 1800000 }] });
            seeds.push({ id: uid('sms'), phone: '139 0000 1002', name: '小王', avatar: '', unread: false, updatedAt: Date.now() - 86400000, messages: [{ id: uid('msg'), direction: 'in', text: '周末一起吃饭吗？', time: Date.now() - 86400000 }] });
        } */
        state.conversations = seeds; saveState();
    }
    function setHeader(title, mode) {
        headerTitle.textContent = title;
        composeButton.hidden = mode === 'compose';
        if (mode === 'home') composeButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
        if (mode === 'thread') composeButton.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>';
    }
    function showToast(message) { clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('is-visible'); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2100); }
    function applyCustomCss() {
        let style = document.getElementById('smsCustomStyle');
        const css = localStorage.getItem('mimi_sms_custom_css') || DEFAULT_SMS_CSS;
        if (route !== 'home' && route !== 'thread') { if (style) style.remove(); return; }
        if (!style) { style = document.createElement('style'); style.id = 'smsCustomStyle'; document.head.appendChild(style); }
        style.textContent = route === 'thread' ? (state.chatCss || '') : css;
    }

    function renderHome(filter) {
        route = 'home'; setHeader('信息', 'home'); sortConversations();
        const query = String(filter || '').trim().toLowerCase();
        const list = state.conversations.filter(c => !query || `${c.name || ''} ${c.phone || ''} ${lastMessage(c)?.text || ''}`.toLowerCase().includes(query));
        view.innerHTML = `<section class="sms-screen sms-home-screen"><div class="sms-list-heading"><h1>信息</h1></div>
            <div class="sms-search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="smsSearch" class="sms-search" type="search" placeholder="搜索" value="${escapeHtml(filter || '')}"></div>
            ${list.length ? `<div class="sms-conversation-list">${list.map(c => { const last = lastMessage(c); return `<article class="sms-conversation" data-action="open-thread" data-id="${escapeHtml(c.id)}">${avatarMarkup(c)}<div class="sms-conversation-copy"><div class="sms-conversation-top"><span class="sms-conversation-name">${escapeHtml(c.name || c.phone)}</span><span class="sms-conversation-time">${displayDate(c.updatedAt || (last && last.time))}</span>${c.unread ? '<span class="sms-unread">新</span>' : ''}</div><span class="sms-conversation-preview">${last ? `${last.direction === 'out' ? '你：' : ''}${escapeHtml(last.text)}` : '暂无短信'}</span></div><span style="color:#c4c6ca;font-size:24px">›</span></article>`; }).join('')}</div>` : `<div class="sms-empty"><div class="sms-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.4 8.3 8.3 0 0 1-3.2-.7L4 20l1.7-3.4A7.4 7.4 0 0 1 4 11.5 7.7 7.7 0 0 1 12 4a7.7 7.7 0 0 1 8 7.5Z"/></svg></div><p>${query ? '没有找到匹配的对话' : '还没有短信'}</p><button class="sms-primary-action" data-action="compose">新建信息</button></div>`}</section>`;
        const search = document.getElementById('smsSearch');
        search?.addEventListener('input', () => renderHome(search.value));
        applyCustomCss();
    }
    function conversationFor(id) { return state.conversations.find(c => c.id === id); }
    function toolIcon(type) {
        const icons = {
            camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h3l1.5-2h7L17 7h3v12H4Z"/><circle cx="12" cy="13" r="3.2"/></svg>',
            album:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.4"/><path d="m5 17 4.3-4 3.2 3 2.3-2 4.2 3.7"/></svg>',
            video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3Z"/></svg>',
            capture:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>',
            audio:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>',
            file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6Z"/><path d="M14 3v5h4M9 13h6M9 17h6"/></svg>',
            live:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg>',
            contact:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0M19 5h2v14h-2"/></svg>'
        }; return icons[type] || icons.file;
    }
    function renderThread(id) {
        const conversation = conversationFor(id); if (!conversation) return renderHome();
        route = 'thread'; activeId = id; conversation.unread = false; saveState(); setHeader(conversation.name || formatPhone(conversation.phone), 'thread');
        const messages = conversation.messages || [];
        view.innerHTML = `<section class="sms-thread-screen"><div class="sms-thread-info">${avatarMarkup(conversation, 'sms-thread-avatar')}<div class="sms-thread-name">${escapeHtml(conversation.name || '未知联系人')}</div><div class="sms-thread-phone">${escapeHtml(formatPhone(conversation.phone))}</div></div><div id="smsMessages" class="sms-messages">${messages.length ? messages.map(m => { const body = m.msgType === 'image' ? `<img class="sms-bubble-image" src="${escapeHtml(m.text)}" alt="图片">` : escapeHtml(m.text); const bubble = `<div class="sms-bubble ${m.direction === 'out' ? 'out' : 'in'}">${body}</div>`; const meta = `<span class="sms-message-meta">${displayDate(m.time)}</span>`; return `<div class="sms-bubble-row ${m.direction === 'out' ? 'out' : 'in'}">${m.direction === 'out' ? meta + bubble : bubble + meta}</div>`; }).join('') : '<div class="sms-empty" style="min-height:180px"><p>发送第一条短信</p></div>'}</div><div id="smsMorePanel" class="sms-more-panel">${[['camera','拍照'],['album','相册'],['video','视频'],['capture','拍摄'],['audio','音频'],['file','文件'],['live','实时信息'],['contact','联系人']].map(item => `<button type="button" class="sms-more-item" data-action="more-${item[0]}"><span class="sms-more-icon">${toolIcon(item[0])}</span>${item[1]}</button>`).join('')}</div><form id="smsThreadForm" class="sms-composer"><button type="button" class="sms-composer-plus" id="smsImageButton" aria-label="更多功能">＋</button><input type="file" id="smsImageInput" accept="image/*" hidden><textarea id="smsMessageInput" class="sms-composer-input" rows="1" maxlength="500" placeholder="短信"></textarea><button class="sms-send-button" type="submit" aria-label="发送"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 4 16 8-16 8 3-8-3-8Z"/><path d="M7 12h13"/></svg></button></form></section>`;
        applyCustomCss();
        const messagesBox = document.getElementById('smsMessages'); if (messagesBox) messagesBox.scrollTop = messagesBox.scrollHeight;
        const input = document.getElementById('smsMessageInput'); input?.focus(); input?.addEventListener('input', () => { input.style.height = '38px'; input.style.height = `${Math.min(input.scrollHeight, 100)}px`; });
    }
    function renderCompose() {
        route = 'compose'; activeId = ''; setHeader('新信息', 'compose');
        const suggestions = state.conversations.filter(c => c.id !== 'mimi-assistant' && c.phone).slice(0, 5);
        view.innerHTML = `<section class="sms-screen sms-compose-screen"><div class="sms-recipient-label">收件人</div><input id="smsRecipientInput" class="sms-recipient-input" type="text" inputmode="tel" placeholder="输入姓名或电话号码"><div class="sms-contact-suggestions">${suggestions.map(c => `<button type="button" class="sms-suggestion" data-action="pick-recipient" data-id="${escapeHtml(c.id)}">${escapeHtml(c.name || c.phone)}</button>`).join('')}</div><div class="sms-compose-hint">使用当前手机号发送短信</div><button id="smsComposeNext" class="sms-compose-send" type="button" disabled>开始发送</button></section>`;
        const input = document.getElementById('smsRecipientInput'); const next = document.getElementById('smsComposeNext');
        const update = () => { next.disabled = !String(input.value).trim(); }; input?.addEventListener('input', update); next?.addEventListener('click', () => startCompose(input.value));
    }
    function startCompose(value) {
        const query = String(value || '').trim(); if (!query) return;
        const phone = query.replace(/\D/g, '');
        if (!phone) { showToast('请输入电话号码'); return; }
        let conversation = state.conversations.find(c => String(c.phone || '').replace(/\D/g, '') === phone);
        if (!conversation) { let contact = null; try { contact = availableContacts().find(item => String(item.phoneNumber || item.phone || '').replace(/\D/g, '') === phone); } catch (_) {} conversation = { id: uid('sms'), phone, phones: [phone], name: contact?.name || phone, contactId: contact?.id || '', avatar: contact?.avatar || '', unread: false, updatedAt: Date.now(), messages: [] }; state.conversations.push(conversation); saveState(); }
        renderThread(conversation.id);
    }
    async function requestApiReply(conversation) {
        try {
            if (typeof dbGetAll !== 'function') throw new Error('API配置不可用');
            const configId = localStorage.getItem('current_api_config_id') || 'default';
            const configs = await dbGetAll('api_configs') || []; const config = configs.find(item => item.id === configId) || configs[0];
            if (!config || !config.url || !config.key) throw new Error('请先在设置中配置有效的 API');
            let apiUrl = config.url.trim().replace(/\/$/, ''); if (!apiUrl.endsWith('/chat/completions')) apiUrl += '/chat/completions';
            const history = (conversation.messages || []).slice(-16).map(message => ({ role: message.direction === 'out' ? 'user' : 'assistant', content: message.msgType === 'image' ? '[用户发送了一张图片]' : message.text }));
            let persona = '';
            try { const contact = typeof contacts !== 'undefined' && contacts.find(item => item.name === conversation.name || item.phoneNumber === conversation.phone); if (contact?.design) persona = ` 人设参考：${contact.design}`; } catch (_) {}
            const response = await fetch(apiUrl, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${config.key}`}, body:JSON.stringify({ model:config.model, messages:[{role:'system',content:`你是联系人“${conversation.name || '联系人'}”，请像真实短信一样简短、自然地回复。不要提及AI身份。${persona}`}, ...history], temperature:parseFloat(config.temp) || 0.8, stream:false }) });
            let data = null; try { data = await response.json(); } catch (_) {}
            if (!response.ok) throw new Error(data?.error?.message || data?.message || 'API 请求失败');
            const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || data?.message?.content || data?.reply || data?.content || '';
            return String(content || '').trim();
        } catch (error) { showToast(error.message || '回复失败'); return ''; }
    }
    async function receiveApiReply(conversation) {
        const reply = await requestApiReply(conversation); if (!reply) return;
        conversation.messages = conversation.messages || [];
        String(reply).split(/\r?\n+/).map(item => item.trim()).filter(Boolean).forEach(item => conversation.messages.push({ id: uid('msg'), direction:'in', text:item, time:Date.now() }));
        conversation.updatedAt = Date.now(); conversation.unread = !(route === 'thread' && activeId === conversation.id); saveState(); if (route === 'thread' && activeId === conversation.id) renderThread(conversation.id); else if (route === 'home') renderHome();
    }
    function sendMessage(text) {
        const conversation = conversationFor(activeId); const clean = String(text || '').trim(); if (!conversation) return;
        if (!clean) { receiveApiReply(conversation); return; }
        if (conversation.id === 'mimi-assistant') { conversation.messages.push({ id: uid('msg'), direction:'out', text: clean, time: Date.now() }); conversation.updatedAt = Date.now(); saveState(); renderThread(conversation.id); receiveApiReply(conversation); return; }
        const primary = primaryNumber();
        if (!primary) { showToast('请先在通讯服务中开通手机号'); return; }
        const balance = Number(primary.balance || 0);
        if (balance < FEE) { showToast('话费余额不足，无法发送短信'); return; }
        primary.balance = Math.round((balance - FEE) * 100) / 100;
        const tel = telecomState(); if (tel) { const number = (tel.numbers || []).find(n => n.id === primary.id); if (number) number.balance = primary.balance; try { localStorage.setItem(TELECOM_KEY, JSON.stringify(tel)); } catch (_) {} }
        conversation.messages = conversation.messages || []; const sentMessage = { id: uid('msg'), direction: 'out', text: clean, time: Date.now() }; conversation.messages.push(sentMessage); conversation.updatedAt = Date.now(); conversation.unread = false; saveState(); renderThread(conversation.id);
        // API 回复只在点击发送后触发。
    }
    function sendImage(dataUrl) {
        const conversation = conversationFor(activeId); const primary = primaryNumber(); if (!conversation || !primary) { showToast('请先在通讯服务中开通手机号'); return; }
        const balance = Number(primary.balance || 0); if (balance < FEE) { showToast('话费余额不足，无法发送图片'); return; }
        primary.balance = Math.round((balance - FEE) * 100) / 100; const tel = telecomState(); if (tel) { const number = (tel.numbers || []).find(n => n.id === primary.id); if (number) number.balance = primary.balance; localStorage.setItem(TELECOM_KEY, JSON.stringify(tel)); }
        conversation.messages = conversation.messages || []; conversation.messages.push({ id:uid('msg'), direction:'out', msgType:'image', text:dataUrl, time:Date.now() }); conversation.updatedAt=Date.now(); saveState(); renderThread(conversation.id); showToast('图片已发送'); window.setTimeout(() => receiveApiReply(conversation), 250);
    }
    function ensureActionMenu() {
        let backdrop = document.getElementById('smsMenuBackdrop');
        let menu = document.getElementById('smsActionMenu');
        if (!backdrop) { backdrop = document.createElement('div'); backdrop.id = 'smsMenuBackdrop'; backdrop.className = 'sms-menu-backdrop'; backdrop.hidden = true; app.appendChild(backdrop); backdrop.addEventListener('click', closeActionMenu); }
        if (!menu) { menu = document.createElement('div'); menu.id = 'smsActionMenu'; menu.className = 'sms-action-menu'; menu.hidden = true; app.appendChild(menu); menu.addEventListener('click', handleActionMenuClick); }
        return { backdrop, menu };
    }
    function openActionMenu(type, id) {
        const c = conversationFor(id || activeId); if (!c) return;
        const { backdrop, menu } = ensureActionMenu(); menu.dataset.type = type; menu.dataset.id = c.id;
        const items = type === 'thread' ? [['call','呼叫'],['add-contact','添加到联系人'],['blacklist','加入黑名单'],['custom-css','自定义CSS']] : [['delete','删除'],['read','标为已读'],['pin',c.pinned ? '取消置顶' : '置顶'],['blacklist','加入黑名单'],['add-contact','添加到联系人'],['encrypt',c.encrypted ? '取消加密' : '加密'],['copy','复制号码']];
        menu.innerHTML = items.map(item => `<button type="button" data-menu-action="${item[0]}">${item[1]}</button>`).join('');
        backdrop.hidden = false; menu.hidden = false;
    }
    function closeActionMenu() { const backdrop = document.getElementById('smsMenuBackdrop'); const menu = document.getElementById('smsActionMenu'); if (backdrop) backdrop.hidden = true; if (menu) menu.hidden = true; }
    function handleActionMenuClick(event) {
        const button = event.target.closest('[data-menu-action]'); if (!button) return; const action = button.dataset.menuAction; const menu = document.getElementById('smsActionMenu'); const c = conversationFor(menu?.dataset.id);
        if (!c) return closeActionMenu();
        if (action === 'delete') { state.conversations = state.conversations.filter(item => item.id !== c.id); saveState(); closeActionMenu(); renderHome(); return; }
        if (action === 'read') c.unread = false;
        else if (action === 'pin') c.pinned = !c.pinned;
        else if (action === 'blacklist') c.blacklisted = true;
        else if (action === 'encrypt') c.encrypted = !c.encrypted;
        else if (action === 'copy') { const copyPromise = navigator.clipboard?.writeText(String(c.phone || '')); copyPromise?.catch(() => {}); showToast('号码已复制'); }
        else if (action === 'call') showToast(`呼叫 ${formatPhone(c.phone)}`);
        else if (action === 'add-contact') {
            try {
                if (typeof contacts !== 'undefined' && Array.isArray(contacts) && !contacts.some(item => String(item.phoneNumber || item.phone).replace(/\D/g, '') === String(c.phone).replace(/\D/g, ''))) {
                    const number = String(c.phone || '').replace(/\D/g, ''); contacts.push({ id: Date.now(), name: c.name || number, phone: number, phoneNumber: number, phoneNumbers: [number], avatar: c.avatar || '' });
                    if (typeof saveContactsToStorage === 'function') saveContactsToStorage();
                }
            } catch (_) {}
            showToast('已添加到联系人');
        }
        else if (action === 'custom-css') { closeActionMenu(); renderCssEditor('chat'); return; }
        saveState(); closeActionMenu(); if (route === 'home') renderHome();
    }
    function toggleMorePanel() { document.getElementById('smsMorePanel')?.classList.toggle('is-visible'); }
    function renderCssEditor(target) {
        view.dataset.cssOrigin = target === 'chat' ? 'thread' : 'home';
        route = 'css-editor'; setHeader('自定义CSS', 'compose'); applyCustomCss();
        const value = localStorage.getItem('mimi_sms_custom_css') || DEFAULT_SMS_CSS;
        view.innerHTML = `<section class="sms-screen sms-css-editor"><h1>信息页样式</h1><p>这里的 CSS 只作用于短信列表页，不会改变聊天详情页。可直接修改下方模板后保存。</p><textarea id="smsCssInput" class="sms-css-textarea" spellcheck="false">${escapeHtml(value)}</textarea><div class="sms-css-actions"><button type="button" class="secondary" data-action="css-reset">恢复模板</button><button type="button" data-action="css-save">保存样式</button></div></section>`;
    }
    const baseRenderCssEditor = renderCssEditor;
    renderCssEditor = function (target) {
        baseRenderCssEditor(target);
        const editor = view.querySelector('.sms-css-editor');
        if (!editor) return;
        editor.insertAdjacentHTML('beforeend', `<button type="button" class="sms-primary-action" data-action="css-preset" style="margin-top:10px;width:100%">保存为预设</button><div id="smsPresetList" class="sms-contact-edit-list">${(state.presets || []).map((p, i) => `<button type="button" class="sms-contact-edit-item" data-action="css-use-preset" data-index="${i}">${escapeHtml(p.name)}</button>`).join('')}</div>`);
        view.dataset.cssTarget = target === 'chat' ? 'chat' : 'home';
    };
    function receiveSms(phone, name, text) {
        const cleanPhone = String(phone || '').replace(/\s/g, ''); const cleanText = String(text || '').trim(); if (!cleanPhone || !cleanText) return false;
        let c = state.conversations.find(item => String(item.phone).replace(/\s/g, '') === cleanPhone);
        if (!c) { c = { id: uid('sms'), phone: cleanPhone, name: name || cleanPhone, avatar: '', unread: true, updatedAt: Date.now(), messages: [] }; state.conversations.push(c); }
        if (name && !c.name) c.name = name; c.messages = c.messages || []; c.messages.push({ id: uid('msg'), direction: 'in', text: cleanText, time: Date.now() }); c.updatedAt = Date.now(); c.unread = !(route === 'thread' && activeId === c.id); saveState();
        if (route === 'thread' && activeId === c.id) renderThread(c.id); else if (route === 'home') renderHome();
        return true;
    }
    function handleBack() { closeActionMenu(); if (route === 'css-editor') { if (view.dataset.cssOrigin === 'thread' && activeId) renderThread(activeId); else renderHome(); return; } if (route === 'thread' || route === 'compose') renderHome(); else closeSmsApp(); }
    function openSmsApp() { state = loadState(); seedConversations(); app.hidden = false; document.body.classList.add('sms-app-active'); renderHome(); if (typeof updateTime === 'function') updateTime(); }
    function closeSmsApp() { app.hidden = true; document.body.classList.remove('sms-app-active'); toast.classList.remove('is-visible'); closeActionMenu(); }

    backButton.addEventListener('click', handleBack); composeButton.addEventListener('click', () => { if (route === 'thread') openActionMenu('thread', activeId); else if (route === 'home') renderCompose(); });
    view.addEventListener('click', event => {
        const target = event.target.closest('[data-action="css-save"]');
        if (!target) return;
        event.stopImmediatePropagation();
        const css = document.getElementById('smsCssInput')?.value || '';
        const targetType = view.dataset.cssTarget || 'home';
        if (targetType === 'chat') state.chatCss = css; else localStorage.setItem('mimi_sms_custom_css', css);
        const index = Number(view.dataset.activePreset);
        if (Number.isInteger(index) && state.presets?.[index]) state.presets[index].css = css;
        saveState(); showToast('样式已立即使用');
        if (view.dataset.cssOrigin === 'thread' && activeId) renderThread(activeId); else renderHome();
    }, true);
    view.addEventListener('submit', event => { if (event.target.id === 'smsThreadForm') { event.preventDefault(); const input = document.getElementById('smsMessageInput'); sendMessage(input?.value); } });
    view.addEventListener('click', event => { if (suppressNextClick) { suppressNextClick = false; event.preventDefault(); return; } const target = event.target.closest('[data-action]'); if (!target) return; const action = target.dataset.action; if (action === 'open-thread') renderThread(target.dataset.id); else if (action === 'compose') renderCompose(); else if (action === 'pick-recipient') { const c = conversationFor(target.dataset.id); if (c) { const input = document.getElementById('smsRecipientInput'); if (input) { input.value = c.name || c.phone; document.getElementById('smsComposeNext').disabled = false; } } } else if (action === 'more') toggleMorePanel(); else if (action === 'more-photo' || action === 'more-camera' || action === 'more-video' || action === 'more-capture') document.getElementById('smsImageInput')?.click(); else if (action === 'more-audio') showToast('音频功能暂不可用'); else if (action === 'more-file') showToast('文件功能暂不可用'); else if (action === 'more-live') showToast('实时信息功能暂不可用'); else if (action === 'more-contact') showToast('联系人功能暂不可用'); else if (action === 'css-save') { localStorage.setItem('mimi_sms_custom_css', document.getElementById('smsCssInput')?.value || DEFAULT_SMS_CSS); renderHome(); showToast('信息页样式已保存'); } else if (action === 'css-reset') { const input = document.getElementById('smsCssInput'); if (input) input.value = DEFAULT_SMS_CSS; } });
    view.addEventListener('click', event => {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        if (target.dataset.action === 'css-preset') {
            const name = window.prompt('预设名称', '我的预设');
            if (!name) return;
            state.presets = state.presets || [];
            state.presets.push({ name, css: document.getElementById('smsCssInput')?.value || '', target: view.dataset.cssTarget || 'home' });
            saveState(); renderCssEditor(view.dataset.cssTarget === 'chat' ? 'chat' : 'home');
        } else if (target.dataset.action === 'css-use-preset') {
            const preset = (state.presets || [])[Number(target.dataset.index)];
            const input = document.getElementById('smsCssInput');
            if (preset && input) { input.value = preset.css; view.dataset.activePreset = target.dataset.index; }
        } else if (target.dataset.action === 'css-load') {
            const input = document.getElementById('smsCssInput');
            if (input) input.value = view.dataset.cssTarget === 'chat' ? '' : DEFAULT_SMS_CSS;
        }
        if (event.target.id === 'smsImageButton') toggleMorePanel();
    });
    view.addEventListener('contextmenu', event => {
        const target = event.target.closest('[data-action="css-use-preset"]');
        if (!target) return;
        event.preventDefault();
        const index = Number(target.dataset.index); const preset = (state.presets || [])[index];
        const action = window.prompt('输入 new 修改名称，输入 delete 删除预设', '');
        if (action === 'delete') state.presets.splice(index, 1);
        else if (action === 'new' && preset) { const name = window.prompt('新的预设名称', preset.name); if (name) preset.name = name; }
        saveState(); renderCssEditor(view.dataset.cssTarget === 'chat' ? 'chat' : 'home');
    });
    view.addEventListener('change', event => { if (event.target.id === 'smsImageInput') { const file = event.target.files?.[0]; if (!file || !file.type.startsWith('image/')) return; const reader = new FileReader(); reader.onload = () => sendImage(reader.result); reader.readAsDataURL(file); } });
    view.addEventListener('pointerdown', event => { const item = event.target.closest('.sms-conversation'); if (!item) return; clearTimeout(longPressTimer); longPressTimer = setTimeout(() => { suppressNextClick = true; openActionMenu('list', item.dataset.id); }, 550); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => view.addEventListener(type, () => clearTimeout(longPressTimer)));
    view.addEventListener('pointerdown', event => { const panel = event.target.closest('#smsMorePanel'); if (!panel) return; moreDrag = { panel, x: event.clientX, scroll: panel.scrollLeft }; panel.setPointerCapture?.(event.pointerId); });
    view.addEventListener('pointermove', event => { if (!moreDrag) return; moreDrag.panel.scrollLeft = moreDrag.scroll - (event.clientX - moreDrag.x); });
    view.addEventListener('pointerup', () => { moreDrag = null; });
    headerTitle.addEventListener('click', () => { if (route === 'home') renderCssEditor(); });
    document.querySelector('.sms-story-entry')?.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openSmsApp(); } });
    window.openSmsApp = openSmsApp; window.closeSmsApp = closeSmsApp; window.receiveSms = receiveSms;
    const telecomIcon = document.getElementById('storyApp1'); const smsIcon = document.getElementById('storyApp2');
    if (telecomIcon && smsIcon) { const syncIcon = () => { if (telecomIcon.src) smsIcon.src = telecomIcon.src; }; syncIcon(); new MutationObserver(syncIcon).observe(telecomIcon, { attributes: true, attributeFilter: ['src'] }); }
    if (window.location.hash === '#sms') requestAnimationFrame(openSmsApp);
})();
//（注：内容由AI生成）
