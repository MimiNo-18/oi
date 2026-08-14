(function () {
    'use strict';

    const STORAGE_KEY = 'mimi_telecom_service_v1';
    const REAL_NAME_KEY = 'mimi_real_name_info';
    const PHONE_PREFIXES = ['130', '131', '132', '155', '156', '166', '175', '176', '185', '186', '196'];
    const PLANS = [
        { id: 'light', name: '轻享套餐', data: '20GB 流量 · 100 分钟通话', price: 29, badge: '20G' },
        { id: 'daily', name: '畅享套餐', data: '60GB 流量 · 300 分钟通话', price: 59, badge: '60G' },
        { id: 'max', name: '自在套餐', data: '120GB 流量 · 800 分钟通话', price: 99, badge: 'MAX' }
    ];

    const app = document.getElementById('telecomApp');
    const view = document.getElementById('telecomView');
    const nav = document.getElementById('telecomNav');
    const backButton = document.getElementById('telecomBackBtn');
    const headerTitle = document.getElementById('telecomHeaderTitle');
    const toast = document.getElementById('telecomToast');

    if (!app || !view || !nav || !backButton || !headerTitle || !toast) return;

    let state = loadState();
    let route = 'verify';
    let pickerMode = 'initial';
    let pickerNumbers = [];
    let selectedPickerNumber = '';
    let toastTimer = null;

    function defaultState() {
        return {
            verifiedName: '',
            createdAt: Date.now(),
            profile: { displayName: '', city: '', email: '' },
            numbers: [],
            primaryId: ''
        };
    }

    function loadState() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (!saved || typeof saved !== 'object') return defaultState();
            return {
                ...defaultState(),
                ...saved,
                profile: { ...defaultState().profile, ...(saved.profile || {}) },
                numbers: Array.isArray(saved.numbers) ? saved.numbers : []
            };
        } catch (error) {
            return defaultState();
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.warn('通讯服务数据保存失败:', error);
        }
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function randomInt(max) {
        if (window.crypto && window.crypto.getRandomValues) {
            const values = new Uint32Array(1);
            window.crypto.getRandomValues(values);
            return values[0] % max;
        }
        return Math.floor(Math.random() * max);
    }

    function generatePhoneNumber(excluded) {
        const existing = new Set(excluded || []);
        let phone = '';
        do {
            const suffix = Array.from({ length: 8 }, () => randomInt(10)).join('');
            phone = PHONE_PREFIXES[randomInt(PHONE_PREFIXES.length)] + suffix;
        } while (existing.has(phone));
        return phone;
    }

    function refreshPickerNumbers() {
        const excluded = state.numbers.map(item => item.phone);
        pickerNumbers = [];
        while (pickerNumbers.length < 5) {
            const phone = generatePhoneNumber(excluded.concat(pickerNumbers));
            pickerNumbers.push(phone);
        }
        selectedPickerNumber = '';
    }

    function formatPhone(phone) {
        const clean = String(phone || '').replace(/\D/g, '');
        if (clean.length !== 11) return clean || '暂未选号';
        return `${clean.slice(0, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}`;
    }

    function getPrimaryNumber() {
        return state.numbers.find(item => item.id === state.primaryId) || state.numbers[0] || null;
    }

    function setHeader(title, showNav, activeTab) {
        headerTitle.textContent = title;
        nav.hidden = !showNav;
        nav.querySelectorAll('[data-telecom-tab]').forEach(button => {
            button.classList.toggle('is-active', button.dataset.telecomTab === activeTab);
        });
    }

    function setRoute(nextRoute) {
        route = nextRoute;
        render();
        view.scrollTop = 0;
    }

    function render() {
        if (route === 'verify') renderVerification();
        else if (route === 'picker') renderNumberPicker();
        else if (route === 'home') renderHome();
        else if (route === 'mine') renderMine();
        else if (route === 'profile') renderProfileEditor();
        else if (route === 'manage') renderNumberManagement();
    }

    function renderVerification() {
        setHeader('实名认证', false, '');
        const accountName = getSavedAccountName();
        view.innerHTML = `
            <section class="telecom-screen">
                <div class="telecom-verify-visual" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.6 2.9 8.1 7 10 4.1-1.9 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/></svg>
                </div>
                <div class="telecom-kicker">IDENTITY CHECK</div>
                <h1 class="telecom-title">核对账号姓名</h1>
                <p class="telecom-description">为保障号码安全，首次使用需核对账号实名姓名。这里只验证姓名，不需要其他证件信息。</p>
                <form id="telecomVerifyForm" class="telecom-card telecom-form-card">
                    <div class="telecom-field">
                        <label for="telecomVerifyName">姓名</label>
                        <input id="telecomVerifyName" class="telecom-input" type="text" maxlength="20" autocomplete="name" placeholder="请输入账号实名姓名" value="${accountName ? escapeHtml(accountName) : ''}">
                        <div class="telecom-field-help">姓名仅用于本机核验，不会上传。</div>
                        <div id="telecomVerifyError" class="telecom-form-error"></div>
                    </div>
                    <button class="telecom-primary-button" type="submit">确认并继续</button>
                </form>
            </section>`;
        requestAnimationFrame(() => document.getElementById('telecomVerifyName')?.focus());
    }

    function getSavedAccountName() {
        try {
            const info = JSON.parse(localStorage.getItem(REAL_NAME_KEY) || '{}');
            const name = String(info.name || '').trim();
            return name && name !== '未设置' ? name : '';
        } catch (error) {
            return '';
        }
    }

    function storeAccountName(name) {
        try {
            const info = JSON.parse(localStorage.getItem(REAL_NAME_KEY) || '{}');
            info.name = name;
            localStorage.setItem(REAL_NAME_KEY, JSON.stringify(info));
            if (typeof realNameInfo !== 'undefined' && realNameInfo) realNameInfo.name = name;
        } catch (error) {
            console.warn('实名姓名同步失败:', error);
        }
    }

    function submitVerification() {
        const input = document.getElementById('telecomVerifyName');
        const errorBox = document.getElementById('telecomVerifyError');
        const name = String(input?.value || '').trim();
        const accountName = getSavedAccountName();
        if (!name) {
            if (errorBox) errorBox.textContent = '请输入姓名后再确认';
            input?.focus();
            return;
        }
        if (accountName && name !== accountName) {
            if (errorBox) errorBox.textContent = '姓名与账号实名信息不一致，请重新输入';
            input?.focus();
            return;
        }
        if (!accountName) storeAccountName(name);
        state.verifiedName = name;
        if (!state.profile.displayName) state.profile.displayName = name;
        saveState();
        pickerMode = 'initial';
        refreshPickerNumbers();
        setRoute('picker');
    }

    function renderNumberPicker() {
        setHeader(pickerMode === 'add' ? '添加手机号' : '选择手机号', false, '');
        if (!pickerNumbers.length) refreshPickerNumbers();
        view.innerHTML = `
            <section class="telecom-screen">
                <div class="telecom-picker-heading">
                    <div>
                        <div class="telecom-kicker">NUMBER PICKER</div>
                        <h1 class="telecom-title">选择喜欢的号码</h1>
                    </div>
                    <button class="telecom-secondary-button" type="button" data-action="refresh-numbers">换一批</button>
                </div>
                <p class="telecom-description">以下号码由系统随机生成。选中一个号码后确认，即可归入你的通讯服务账号。</p>
                <div class="telecom-number-grid" aria-label="可选手机号">
                    ${pickerNumbers.map(phone => `
                        <button class="telecom-number-option${selectedPickerNumber === phone ? ' is-selected' : ''}" type="button" data-action="select-number" data-phone="${phone}">
                            <span class="telecom-number-copy"><strong>${formatPhone(phone)}</strong><span>中国大陆 · 移动通信号码</span></span>
                            <span class="telecom-number-check">✓</span>
                        </button>`).join('')}
                </div>
                <div class="telecom-picker-actions">
                    <button id="telecomConfirmNumber" class="telecom-primary-button" type="button" data-action="confirm-number" ${selectedPickerNumber ? '' : 'disabled'}>确认选择</button>
                </div>
            </section>`;
    }

    function confirmSelectedNumber() {
        if (!selectedPickerNumber) return;
        const number = {
            id: `tel_${Date.now()}_${randomInt(10000)}`,
            phone: selectedPickerNumber,
            balance: (2000 + randomInt(8001)) / 100,
            planId: '',
            createdAt: Date.now()
        };
        state.numbers.push(number);
        if (!state.primaryId) state.primaryId = number.id;
        saveState();
        pickerNumbers = [];
        selectedPickerNumber = '';
        if (pickerMode === 'add') {
            setRoute('manage');
            showToast('新号码已添加');
        } else {
            setRoute('home');
            showToast('选号成功，欢迎使用通讯服务');
        }
    }

    function renderHome() {
        setHeader('通讯服务', true, 'home');
        const primary = getPrimaryNumber();
        if (!primary) {
            pickerMode = 'initial';
            refreshPickerNumbers();
            setRoute('picker');
            return;
        }
        const displayName = state.profile.displayName || state.verifiedName || '用户';
        const currentPlan = PLANS.find(plan => plan.id === primary.planId);
        view.innerHTML = `
            <section class="telecom-screen has-nav">
                <div class="telecom-home-top">
                    <div><div class="telecom-greeting">你好，${escapeHtml(displayName)}</div><h1>我的通讯</h1></div>
                    <span class="telecom-status-pill">服务正常</span>
                </div>
                <article class="telecom-balance-card">
                    <div class="telecom-balance-label">当前话费余额</div>
                    <div class="telecom-balance-value"><small>¥</small>${Number(primary.balance || 0).toFixed(2)}</div>
                    <div class="telecom-primary-number"><span>当前手机号</span><strong>${formatPhone(primary.phone)}</strong></div>
                </article>
                <div class="telecom-section-heading"><h2>套餐推荐</h2><span>${currentPlan ? `当前：${currentPlan.name}` : '为你精选'}</span></div>
                <div class="telecom-plan-list">
                    ${PLANS.map(plan => `
                        <article class="telecom-card telecom-plan-card" data-action="choose-plan" data-plan-id="${plan.id}">
                            <div class="telecom-plan-icon">${plan.badge}</div>
                            <div class="telecom-plan-copy"><strong>${plan.name}</strong><span>${plan.data}</span></div>
                            <button class="telecom-text-button telecom-plan-price" type="button" data-action="choose-plan" data-plan-id="${plan.id}">¥${plan.price}<span>${primary.planId === plan.id ? '使用中' : '每月'}</span></button>
                        </article>`).join('')}
                </div>
            </section>`;
    }

    function renderMine() {
        setHeader('我的', true, 'mine');
        const primary = getPrimaryNumber();
        const displayName = state.profile.displayName || state.verifiedName || '用户';
        const initial = Array.from(displayName)[0] || '我';
        view.innerHTML = `
            <section class="telecom-screen has-nav">
                <div class="telecom-mine-heading"><div><div class="telecom-greeting">个人中心</div><h1>我的服务</h1></div></div>
                <article class="telecom-card telecom-profile-card">
                    <div class="telecom-profile-avatar">${escapeHtml(initial)}</div>
                    <div class="telecom-profile-copy">
                        <div class="telecom-profile-name">${escapeHtml(displayName)}<span class="telecom-verified-mark">已实名</span></div>
                        <div class="telecom-profile-phone">${formatPhone(primary?.phone)}</div>
                    </div>
                    <div class="telecom-profile-count">${state.numbers.length} 个号码</div>
                </article>
                <div class="telecom-card telecom-menu-list">
                    <button class="telecom-menu-item" type="button" data-action="open-profile">
                        <span class="telecom-menu-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg></span>
                        <span class="telecom-menu-copy"><strong>通讯资料</strong><span>编辑称呼、所在城市与联系邮箱</span></span><span class="telecom-chevron">›</span>
                    </button>
                    <button class="telecom-menu-item" type="button" data-action="open-manage">
                        <span class="telecom-menu-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M9 18h6"/></svg></span>
                        <span class="telecom-menu-copy"><strong>号码管理</strong><span>查看、添加或切换名下手机号</span></span><span class="telecom-chevron">›</span>
                    </button>
                </div>
            </section>`;
    }

    function renderProfileEditor() {
        setHeader('编辑通讯资料', false, '');
        const profile = state.profile || {};
        view.innerHTML = `
            <section class="telecom-screen">
                <div class="telecom-kicker">PROFILE</div>
                <h1 class="telecom-title">通讯资料</h1>
                <p class="telecom-description">实名姓名不可在这里修改，其余资料仅用于完善你的通讯服务档案。</p>
                <form id="telecomProfileForm" class="telecom-card telecom-form-card">
                    <div class="telecom-field"><label for="telecomRealName">实名姓名</label><input id="telecomRealName" class="telecom-input" type="text" value="${escapeHtml(state.verifiedName)}" readonly></div>
                    <div class="telecom-field"><label for="telecomDisplayName">显示称呼</label><input id="telecomDisplayName" class="telecom-input" type="text" maxlength="20" value="${escapeHtml(profile.displayName || '')}" placeholder="例如：小米"></div>
                    <div class="telecom-field"><label for="telecomCity">所在城市</label><input id="telecomCity" class="telecom-input" type="text" maxlength="30" value="${escapeHtml(profile.city || '')}" placeholder="例如：上海"></div>
                    <div class="telecom-field"><label for="telecomEmail">联系邮箱</label><input id="telecomEmail" class="telecom-input" type="email" maxlength="60" value="${escapeHtml(profile.email || '')}" placeholder="可选"></div>
                    <div id="telecomProfileError" class="telecom-form-error"></div>
                    <div class="telecom-form-actions"><button class="telecom-primary-button" type="submit">保存资料</button></div>
                </form>
            </section>`;
    }

    function saveProfile() {
        const displayName = String(document.getElementById('telecomDisplayName')?.value || '').trim();
        const city = String(document.getElementById('telecomCity')?.value || '').trim();
        const email = String(document.getElementById('telecomEmail')?.value || '').trim();
        const errorBox = document.getElementById('telecomProfileError');
        if (!displayName) {
            if (errorBox) errorBox.textContent = '显示称呼不能为空';
            return;
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (errorBox) errorBox.textContent = '请输入正确的邮箱格式';
            return;
        }
        state.profile = { displayName, city, email };
        saveState();
        setRoute('mine');
        showToast('通讯资料已保存');
    }

    function renderNumberManagement() {
        setHeader('号码管理', false, '');
        view.innerHTML = `
            <section class="telecom-screen">
                <div class="telecom-kicker">MY NUMBERS</div>
                <h1 class="telecom-title">名下手机号</h1>
                <p class="telecom-description">可将任一号码设为首页展示的主号码，也可以继续添加系统随机生成的新号码。</p>
                <div class="telecom-number-manage-list">
                    ${state.numbers.map(number => {
                        const isPrimary = number.id === state.primaryId;
                        const plan = PLANS.find(item => item.id === number.planId);
                        return `
                            <article class="telecom-card telecom-managed-number">
                                <div class="telecom-managed-top">
                                    <div><strong>${formatPhone(number.phone)}</strong><span>余额 ¥${Number(number.balance || 0).toFixed(2)} · ${plan ? plan.name : '暂未选择套餐'}</span></div>
                                    ${isPrimary ? '<em class="telecom-primary-badge">主号码</em>' : ''}
                                </div>
                                <div class="telecom-managed-actions">
                                    ${isPrimary ? '' : `<button type="button" data-action="set-primary" data-number-id="${number.id}">设为主号码</button>`}
                                    ${state.numbers.length > 1 ? `<button class="is-danger" type="button" data-action="remove-number" data-number-id="${number.id}">移除号码</button>` : ''}
                                </div>
                            </article>`;
                    }).join('')}
                </div>
                <button class="telecom-add-number" type="button" data-action="add-number">＋ 添加新手机号</button>
            </section>`;
    }

    function choosePlan(planId) {
        const plan = PLANS.find(item => item.id === planId);
        const primary = getPrimaryNumber();
        if (!plan || !primary) return;
        primary.planId = plan.id;
        saveState();
        renderHome();
        showToast(`已选择${plan.name}`);
    }

    function setPrimaryNumber(numberId) {
        if (!state.numbers.some(item => item.id === numberId)) return;
        state.primaryId = numberId;
        saveState();
        renderNumberManagement();
        showToast('主号码已切换');
    }

    function removeNumber(numberId) {
        if (state.numbers.length <= 1) return;
        const target = state.numbers.find(item => item.id === numberId);
        if (!target || !window.confirm(`确定移除手机号 ${formatPhone(target.phone)} 吗？`)) return;
        state.numbers = state.numbers.filter(item => item.id !== numberId);
        if (state.primaryId === numberId) state.primaryId = state.numbers[0]?.id || '';
        saveState();
        renderNumberManagement();
        showToast('号码已移除');
    }

    function showToast(message) {
        clearTimeout(toastTimer);
        toast.textContent = message;
        toast.classList.add('is-visible');
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1900);
    }

    function handleBack() {
        if (route === 'profile' || route === 'manage') {
            setRoute('mine');
            return;
        }
        if (route === 'picker' && pickerMode === 'add') {
            setRoute('manage');
            return;
        }
        closeTelecomApp();
    }

    function openTelecomApp() {
        state = loadState();
        app.hidden = false;
        document.body.classList.add('telecom-app-active');
        if (!state.verifiedName) route = 'verify';
        else if (!state.numbers.length) {
            route = 'picker';
            pickerMode = 'initial';
            refreshPickerNumbers();
        } else route = 'home';
        render();
        if (typeof updateTime === 'function') updateTime();
    }

    function closeTelecomApp() {
        app.hidden = true;
        document.body.classList.remove('telecom-app-active');
        toast.classList.remove('is-visible');
    }

    view.addEventListener('submit', event => {
        event.preventDefault();
        if (event.target.id === 'telecomVerifyForm') submitVerification();
        if (event.target.id === 'telecomProfileForm') saveProfile();
    });

    view.addEventListener('click', event => {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        if (action === 'refresh-numbers') {
            refreshPickerNumbers();
            renderNumberPicker();
        } else if (action === 'select-number') {
            selectedPickerNumber = target.dataset.phone || '';
            renderNumberPicker();
        } else if (action === 'confirm-number') confirmSelectedNumber();
        else if (action === 'choose-plan') choosePlan(target.dataset.planId);
        else if (action === 'open-profile') setRoute('profile');
        else if (action === 'open-manage') setRoute('manage');
        else if (action === 'add-number') {
            pickerMode = 'add';
            refreshPickerNumbers();
            setRoute('picker');
        } else if (action === 'set-primary') setPrimaryNumber(target.dataset.numberId);
        else if (action === 'remove-number') removeNumber(target.dataset.numberId);
    });

    nav.addEventListener('click', event => {
        const button = event.target.closest('[data-telecom-tab]');
        if (!button) return;
        setRoute(button.dataset.telecomTab === 'mine' ? 'mine' : 'home');
    });

    backButton.addEventListener('click', handleBack);
    document.querySelector('.telecom-story-entry')?.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openTelecomApp();
        }
    });

    window.openTelecomApp = openTelecomApp;
    window.closeTelecomApp = closeTelecomApp;

    if (window.location.hash === '#telecom') {
        requestAnimationFrame(openTelecomApp);
    }
})();
