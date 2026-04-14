/**
 * WeChat Application Logic for MimiPhone
 */

// WeChat Global Variables
let wechatVisible = false;
let chatList = [];
let groupList = [];
let currentChatFriendId = null;
let currentGroupChatId = null;
let chatHistories = {};
let currentLongPressedMsg = null;
let longPressTimer = null;
let quotedMessage = null;
let messageToForward = null;
let isMultiSelectMode = false;
let selectedMsgIndexes = new Set();
let currentForwardMode = 'single';

let wechatUserInfo = {
    avatar: DEFAULT_AVATAR,
    nickname: '未设置网名',
    wechatId: '未设置',
    phone: '未设置',
    region: '未设置',
    patPat: '未设置',
    signature: '未设置',
    country: '中国',
    location: '未设置',
    mimiId: ''
};

// Moments Data
let momentsData = [];
let currentMomentsFriendId = null;
let momentImages = [];
let editingMomentId = null;
let currentMomentId = null;
let currentReplyTo = null;

// Contacts Data
let contacts = [];
let contactSelectMode = false;
let selectedContacts = new Set();
let editingContactId = null;
let currentDetailFriendId = null;
let isOpenedFromContactDetail = false;

// Sticker and Favorites Data
let stickerList = [];
let favoriteStickers = [];
let favoriteStickersLoaded = false;
let favoritesData = [];
let favSelectMode = false;
let selectedFavIds = new Set();

// World Book related to WeChat
let worldBooks = [];

// Main WeChat Page Functions
function openWechat() {
    wechatVisible = true;
    document.querySelector('.phone-container').style.display = 'none';
    document.getElementById('wechatContainer').style.display = 'flex';
    updateTime();
    updateBattery();
    
    const messagesTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item');
    switchWechatTab('messages', messagesTab);
    saveUIState();
}

function goBack() {
    wechatVisible = false;
    document.getElementById('wechatContainer').style.display = 'none';
    document.querySelector('.phone-container').style.display = 'flex';
    saveUIState();
}

function switchWechatTab(tab, element) {
    const chatListEl = document.getElementById('chatList');
    const contactsPage = document.getElementById('wechatContactsPage');
    const discoverPage = document.getElementById('wechatDiscoverPage');
    const mePage = document.getElementById('wechatMePage');
    const tagBar = document.getElementById('wechatTagBar');
    const searchBar = document.getElementById('wechatSearchBar');
    const navBar = document.querySelector('#wechatContainer .wechat-nav-bar');
    const bottomNav = document.querySelector('.wechat-bottom-nav');
    const navTitle = document.querySelector('#wechatContainer .wechat-nav-title');

    document.querySelectorAll('.wechat-bottom-nav .wechat-nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');

    chatListEl.style.display = 'none'; 
    contactsPage.style.display = 'none'; 
    if (discoverPage) discoverPage.style.display = 'none'; 
    mePage.style.display = 'none';
    searchBar.style.display = 'none'; 
    tagBar.style.display = 'none';

    if (navBar) navBar.style.display = 'flex';
    if (bottomNav) bottomNav.style.backgroundColor = '#fff';

    if (tab === 'messages') {
        chatListEl.style.display = 'block'; 
        searchBar.style.display = 'block'; 
        tagBar.style.display = 'flex'; 
        navTitle.textContent = 'Wechat';
        if (navBar) { navBar.style.display = 'flex'; navBar.style.backgroundColor = '#fff'; navBar.style.borderBottom = '1px solid #f5f5f5'; }
        renderChatList();
    } else if (tab === 'contacts') {
        contactsPage.style.display = 'block'; 
        searchBar.style.display = 'block'; 
        navTitle.textContent = '通讯录';
        if (navBar) { navBar.style.display = 'flex'; navBar.style.backgroundColor = '#fff'; navBar.style.borderBottom = '1px solid #f5f5f5'; }
        renderWechatContacts();
    } else if (tab === 'discover') {
        if (discoverPage) discoverPage.style.display = 'block'; 
        navTitle.textContent = '发现';
        if (navBar) { navBar.style.display = 'flex'; navBar.style.backgroundColor = '#fff'; navBar.style.borderBottom = 'none'; }
    } else if (tab === 'me') {
        mePage.style.display = 'block'; 
        if (navBar) navBar.style.display = 'none';
        if (bottomNav) bottomNav.style.backgroundColor = '#fff';
        renderWechatMePage();
    }
    saveUIState();
}

// WeChat Settings Logic
function openWechatSettings() {
    showContainer('wechatSettingsContainer');
    updateTime();
    saveUIState();
}

function closeWechatSettings() {
    showContainer('wechatContainer');
    const meTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item:last-child');
    if (meTab) switchWechatTab('me', meTab);
    saveUIState();
}

function openWechatDisplaySettings() {
    showContainer('wechatDisplaySettingsContainer');
    updateTime();
    saveUIState();
}

function closeWechatDisplaySettings() {
    openWechatSettings();
    saveUIState();
}

// WeChat Storage Logic
function openWechatStorage() {
    showContainer('wechatStorageContainer');
    document.getElementById('storageScanning').style.display = 'flex';
    document.getElementById('storageDetail').style.display = 'none';
    setTimeout(() => { calculateStorage(); }, 1500);
    updateTime();
    saveUIState();
}

function closeWechatStorage() {
    document.getElementById('wechatStorageContainer').style.display = 'none';
    openWechatSettings();
    saveUIState();
}

// 顶部分类栏逻辑
let topCategories = []; // { name: string, contactIds: number[] }
let currentSelectedCategory = '默认';
let currentEditingCategoryName = null;
let selectedContactIdsForCategory = new Set();

function loadTopCategories() {
    const saved = localStorage.getItem('wechat_top_categories');
    if (saved) {
        topCategories = JSON.parse(saved);
    } else {
        topCategories = [
            { name: '默认', contactIds: [] }
        ];
    }
}

function saveTopCategories() {
    safeLocalStorageSet('wechat_top_categories', JSON.stringify(topCategories));
}

function renderTopTagBar() {
    const bar = document.getElementById('wechatTagBar');
    if (!bar) return;
    bar.innerHTML = '';
    topCategories.forEach(cat => {
        const item = document.createElement('div');
        item.className = `tag-item ${currentSelectedCategory === cat.name ? 'active' : ''}`;
        item.textContent = cat.name;
        item.onclick = () => {
            currentSelectedCategory = cat.name;
            renderTopTagBar();
            renderChatList();
        };
        bar.appendChild(item);
    });
}

function openCategoryManagement() {
    showContainer('categoryManagementContainer');
    document.body.classList.add('category-management-active');
    showCategoryMenu();
    renderCategoryManagementList();
    saveUIState();
}

function showCategoryMenu() {
    document.getElementById('categoryNavTitle').textContent = '更多';
    document.getElementById('categoryMenuArea').style.display = 'block';
    document.getElementById('actualCategoryContent').style.display = 'none';
    document.getElementById('relationshipBindingContent').style.display = 'none';
    document.getElementById('categoryBackBtn').onclick = closeCategoryManagement;
}

function showActualCategoryManagement() {
    document.getElementById('categoryNavTitle').textContent = '顶部分组设置';
    document.getElementById('categoryMenuArea').style.display = 'none';
    document.getElementById('actualCategoryContent').style.display = 'flex';
    document.getElementById('relationshipBindingContent').style.display = 'none';
    document.getElementById('categoryBackBtn').onclick = showCategoryMenu;
    renderCategoryManagementList();
}

function showRelationshipBinding() {
    document.getElementById('categoryNavTitle').textContent = '关系绑定';
    document.getElementById('categoryMenuArea').style.display = 'none';
    document.getElementById('actualCategoryContent').style.display = 'none';
    document.getElementById('relationshipBindingContent').style.display = 'block';
    document.getElementById('categoryBackBtn').onclick = showCategoryMenu;
}

function closeCategoryManagement() {
    showContainer('wechatSettingsContainer');
    document.body.classList.remove('category-management-active');
    renderTopTagBar();
    renderChatList();
    saveUIState();
}

function renderCategoryManagementList() {
    const list = document.getElementById('categoryManagementList');
    const preview = document.getElementById('categoryPreviewTags');
    if (!list || !preview) return;
    list.innerHTML = '';
    preview.innerHTML = '';

    topCategories.forEach(cat => {
        // 渲染预览标签
        const tag = document.createElement('div');
        tag.className = 'tag-item';
        if (currentSelectedCategory === cat.name) tag.classList.add('active');
        tag.textContent = cat.name;
        preview.appendChild(tag);

        // 渲染管理列表
        const item = document.createElement('div');
        item.className = 'category-mgmt-item';
        
        let actionButtons = `
            <span class="category-action-btn" onclick="renameCategory('${cat.name}')">重命名</span>
            <span class="category-action-btn" onclick="manageCategoryMembers('${cat.name}')">管理成员</span>
        `;
        
        if (cat.name !== '默认' && cat.name !== topCategories[0].name) {
            actionButtons += `<span class="category-action-btn delete" onclick="deleteCategory('${cat.name}')">删除</span>`;
        }

        item.innerHTML = `
            <div class="category-mgmt-info">
                <div class="category-mgmt-name">${cat.name}</div>
                <div class="category-mgmt-count">${cat.contactIds ? cat.contactIds.length : 0} 位成员</div>
            </div>
            <div class="category-mgmt-actions">
                ${actionButtons}
            </div>
        `;
        list.appendChild(item);
    });
}

function renameCategory(oldName) {
    const newName = prompt('请输入新的分组名称:', oldName);
    if (newName && newName.trim() && newName.trim() !== oldName) {
        if (topCategories.find(c => c.name === newName.trim())) {
            alert('分组名称已存在');
            return;
        }
        const category = topCategories.find(c => c.name === oldName);
        if (category) {
            category.name = newName.trim();
            if (currentSelectedCategory === oldName) {
                currentSelectedCategory = category.name;
            }
            saveTopCategories();
            renderCategoryManagementList();
            renderTopTagBar();
        }
    }
}

function addNewCategory() {
    const name = prompt('请输入新分组名称:');
    if (name && name.trim()) {
        if (topCategories.find(c => c.name === name.trim())) {
            alert('分组名称已存在');
            return;
        }
        topCategories.push({ name: name.trim(), contactIds: [] });
        saveTopCategories();
        renderCategoryManagementList();
    }
}

function deleteCategory(name) {
    if (confirm(`确定要删除分组 "${name}" 吗？`)) {
        topCategories = topCategories.filter(c => c.name !== name);
        if (currentSelectedCategory === name) currentSelectedCategory = '默认';
        saveTopCategories();
        renderCategoryManagementList();
    }
}

function manageCategoryMembers(categoryName) {
    currentEditingCategoryName = categoryName;
    const category = topCategories.find(c => c.name === categoryName);
    selectedContactIdsForCategory = new Set(category.contactIds);
    
    document.getElementById('selectionModalTitle').textContent = `为 "${categoryName}" 选择成员`;
    renderSelectionContactsList();
    document.getElementById('contactSelectionModal').classList.add('active');
}

function renderSelectionContactsList() {
    const container = document.getElementById('selectionContactsList');
    if (!container) return;
    container.innerHTML = '';
    
    if (contacts.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无联系人</div>';
        return;
    }

    contacts.forEach(contact => {
        const isChecked = selectedContactIdsForCategory.has(contact.id);
        const item = document.createElement('div');
        item.className = 'selection-contact-item';
        item.onclick = () => {
            if (selectedContactIdsForCategory.has(contact.id)) {
                selectedContactIdsForCategory.delete(contact.id);
            } else {
                selectedContactIdsForCategory.add(contact.id);
            }
            renderSelectionContactsList();
        };
        item.innerHTML = `
            <div class="selection-checkbox ${isChecked ? 'checked' : ''}"></div>
            <img src="${contact.avatar || ''}" class="wechat-contact-avatar" style="width:32px; height:32px;">
            <div class="wechat-contact-name">${contact.name}</div>
        `;
        container.appendChild(item);
    });
}

function closeSelectionModal() {
    document.getElementById('contactSelectionModal').classList.remove('active');
}

function confirmContactSelection() {
    const category = topCategories.find(c => c.name === currentEditingCategoryName);
    if (category) {
        category.contactIds = Array.from(selectedContactIdsForCategory);
        saveTopCategories();
        renderCategoryManagementList();
    }
    closeSelectionModal();
}

function renderChatList(searchKeyword = '') {
    const container = document.getElementById('chatList');
    if (!container) return;
    
    // 合并好友聊天和群聊
    let combinedList = [...chatList, ...groupList];
    
    let filteredList = combinedList;
    
    // 顶部分类筛选 (群聊目前不参与联系人分类，只在“默认”显示)
    if (currentSelectedCategory !== '默认') {
        const category = topCategories.find(c => c.name === currentSelectedCategory);
        if (category) {
            filteredList = chatList.filter(chat => category.contactIds.includes(chat.contactId));
        }
    }

    if (searchKeyword) {
        filteredList = filteredList.filter(item => {
            const isGroup = item.members !== undefined;
            const name = isGroup ? item.name : getFriendDisplayName(item);
            const nameMatch = name.toLowerCase().includes(searchKeyword);
            const msgMatch = item.message.toLowerCase().includes(searchKeyword);
            return nameMatch || msgMatch;
        });
    }

    if (filteredList.length === 0) {
        container.innerHTML = searchKeyword ? '<div class="empty-state">未找到匹配的聊天</div>' : '<div class="empty-state">该分类下暂无聊天记录</div>';
        return;
    }

    const pinned = filteredList.filter(f => f.isPinned);
    const others = filteredList.filter(f => !f.isPinned);

    let html = '';
    
    // 渲染置顶列表
    pinned.forEach((item, index) => {
        html += renderChatItem(item, true);
    });

    // 如果有置顶项且有普通项，插入物理灰色间隔
    if (pinned.length > 0 && others.length > 0) {
        html += '<div class="chat-list-physical-gap"></div>';
    }

    // 渲染普通列表
    others.forEach(item => {
        html += renderChatItem(item, false);
    });

    container.innerHTML = html;
    if (typeof addSwipeListeners === 'function') addSwipeListeners();
}

// 微信收藏逻辑
async function loadFavoritesFromStorage() {
    try {
        const data = await dbGet('settings', 'wechat_favorites_data');
        if (data) {
            favoritesData = data.value;
        } else {
            const saved = localStorage.getItem('wechat_favorites_data');
            if (saved) {
                favoritesData = JSON.parse(saved);
                await saveFavoritesToStorage();
            }
        }
    } catch (e) {
        const saved = localStorage.getItem('wechat_favorites_data');
        if (saved) favoritesData = JSON.parse(saved);
    }
}

async function saveFavoritesToStorage() {
    try {
        await dbPut('settings', { key: 'wechat_favorites_data', value: favoritesData });
    } catch (e) {
        safeLocalStorageSet('wechat_favorites_data', JSON.stringify(favoritesData));
    }
}

function openWechatFavorites() {
    showContainer('wechatFavoritesContainer');
    favSelectMode = false;
    selectedFavIds.clear();
    updateFavPageUI();
    renderFavoritesList();
    updateTime();
    saveUIState();
}

function closeWechatFavorites() {
    document.getElementById('wechatFavoritesContainer').style.display = 'none';
    saveUIState();
}

function renderFavoritesList(keyword = '') {
    const container = document.getElementById('favoritesList');
    if (!container) return;
    let filtered = [...favoritesData];
    
    // 排序：置顶的在前面，其次按 ID 倒序
    filtered.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
        return b.id - a.id;
    });

    if (keyword) {
        filtered = filtered.filter(item => item.content.includes(keyword));
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无收藏表情包</div>';
        return;
    }

    let html = '';
    filtered.forEach(item => {
        const isSelected = selectedFavIds.has(item.id);
        if (item.isMergedForward) {
            const previewHtml = (item.fullHistory || []).slice(0, 2).map(h => {
                let displayContent = h.content;
                if (h.msgType === 'sticker') {
                    displayContent = `[${h.stickerName || '表情'}]`;
                }
                return `<div class="merged-forward-preview-item">${h.name}：${displayContent}</div>`;
            }).join('');

            html += `
                <div class="favorite-item ${item.isPinned ? 'pinned' : ''} ${favSelectMode ? 'selecting' : ''}" 
                     data-id="${item.id}"
                     onclick="handleFavClick(${item.id})">
                    <div class="favorite-checkbox ${isSelected ? 'checked' : ''}"></div>
                    <div class="merged-forward-bubble" style="width: 100%; border: none !important; box-shadow: none !important; padding: 0 !important; pointer-events: none; background: transparent !important;">
                        <div class="merged-forward-title">${item.title || '聊天记录'}</div>
                        <div class="merged-forward-preview">
                            ${previewHtml}
                            ${(item.fullHistory || []).length > 2 ? '<div class="merged-forward-preview-item">...</div>' : ''}
                        </div>
                        <div class="merged-forward-line"></div>
                        <div class="merged-forward-footer">聊天记录</div>
                    </div>
                    <div class="favorite-date">${item.date}</div>
                </div>
            `;
        } else {
            html += `
                <div class="favorite-item ${item.isPinned ? 'pinned' : ''} ${favSelectMode ? 'selecting' : ''}" 
                     data-id="${item.id}"
                     onclick="handleFavClick(${item.id})">
                    <div class="favorite-checkbox ${isSelected ? 'checked' : ''}"></div>
                    <div class="favorite-content">${item.content}</div>
                    <div class="favorite-date">${item.date}</div>
                </div>
            `;
        }
    });
    container.innerHTML = html;
    setupFavLongPress();
}

function setupFavLongPress() {
    const items = document.querySelectorAll('.favorite-item');
    items.forEach(item => {
        item.addEventListener('touchstart', (e) => {
            if (favSelectMode) return;
            favLongPressTimer = setTimeout(() => {
                showFavContextMenu(item, e.touches[0]);
            }, 600);
        }, { passive: true });

        item.addEventListener('touchend', () => clearTimeout(favLongPressTimer));
        item.addEventListener('touchmove', () => clearTimeout(favLongPressTimer));
    });
}

function showFavContextMenu(item, touch) {
    const menu = document.getElementById('favContextMenu');
    if (!menu) return;
    currentLongPressedFav = item;
    
    menu.style.display = 'flex';
    
    const rect = item.getBoundingClientRect();
    let top = rect.top + (rect.height / 2) - (menu.offsetHeight / 2);
    let left = rect.left + (rect.width / 2) - (menu.offsetWidth / 2);
    
    if (top < 60) top = 60;
    if (top + menu.offsetHeight > window.innerHeight - 60) top = window.innerHeight - menu.offsetHeight - 60;
    if (left < 10) left = 10;
    if (left + menu.offsetWidth > window.innerWidth - 10) left = window.innerWidth - menu.offsetWidth - 10;

    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
    
    const id = parseInt(item.getAttribute('data-id'));
    const fav = favoritesData.find(f => f.id === id);
    const stickyItem = menu.querySelector('[onclick*="置顶"]');
    if (stickyItem && fav) {
        stickyItem.textContent = fav.isPinned ? '取消置顶' : '置顶';
    }

    if (navigator.vibrate) navigator.vibrate(50);
}

function handleFavAction(action) {
    const menu = document.getElementById('favContextMenu');
    if (menu) menu.style.display = 'none';
    if (!currentLongPressedFav) return;
    const id = parseInt(currentLongPressedFav.getAttribute('data-id'));
    const fav = favoritesData.find(f => f.id === id);

    switch(action) {
        case '删除':
            if (confirm('确定删除该收藏吗？')) {
                favoritesData = favoritesData.filter(f => f.id !== id);
                saveFavoritesToStorage();
                renderFavoritesList();
            }
            break;
        case '置顶':
            if (fav) {
                fav.isPinned = !fav.isPinned;
                saveFavoritesToStorage();
                renderFavoritesList();
            }
            break;
        case '多选':
            toggleFavSelectMode();
            break;
        case '转发':
            if (fav.isMergedForward) {
                messageToForward = fav;
            } else {
                messageToForward = fav.content;
            }
            document.getElementById('forwardModal').classList.add('active');
            if (typeof renderForwardContacts === 'function') renderForwardContacts();
            break;
    }
}

function handleFavClick(id) {
    if (favSelectMode) {
        if (selectedFavIds.has(id)) {
            selectedFavIds.delete(id);
        } else {
            selectedFavIds.add(id);
        }
        renderFavoritesList();
        updateFavPageUI();
    } else {
        const fav = favoritesData.find(f => f.id === id);
        if (!fav) return;

        // 需求 2: 点击收藏页面的内容可以发送收藏
        if (currentChatFriendId) {
            if (confirm('是否发送该收藏内容？')) {
                sendFavoriteMessage(fav);
                closeWechatFavorites();
                return;
            }
        }

        if (fav && fav.isMergedForward) {
            if (typeof openMergedChatDetail === 'function') openMergedChatDetail(fav);
        }
    }
}

function sendFavoriteMessage(fav) {
    if (!currentChatFriendId) return;
    
    const history = chatHistories[currentChatFriendId] || [];
    let newMessage;

    if (fav.isMergedForward) {
        newMessage = {
            type: 'sent',
            isMergedForward: true,
            title: fav.title,
            fullHistory: JSON.parse(JSON.stringify(fav.fullHistory)),
            content: '[聊天记录]',
            time: new Date().getTime()
        };
    } else {
        newMessage = {
            type: 'sent',
            content: fav.content,
            time: new Date().getTime()
        };
    }
    
    history.push(newMessage);
    chatHistories[currentChatFriendId] = history;
    
    const friend = chatList.find(f => f.id === currentChatFriendId);
    if (friend) {
        friend.message = fav.isMergedForward ? '[聊天记录]' : fav.content;
        friend.time = formatTime(new Date());
    }

    if (typeof renderMessages === 'function') renderMessages();
    if (typeof saveChatHistories === 'function') saveChatHistories();
    if (typeof saveChatListToStorage === 'function') saveChatListToStorage();
    renderChatList();
}

function toggleFavSelectMode() {
    favSelectMode = !favSelectMode;
    selectedFavIds.clear();
    updateFavPageUI();
    renderFavoritesList();
}

function updateFavPageUI() {
    const cancelBtn = document.getElementById('favCancelSelectBtn');
    const deleteBtn = document.getElementById('favDeleteBtn');
    if (!cancelBtn || !deleteBtn) return;
    cancelBtn.style.display = favSelectMode ? 'block' : 'none';
    deleteBtn.style.display = favSelectMode ? 'block' : 'none';
    deleteBtn.disabled = selectedFavIds.size === 0;
    deleteBtn.style.opacity = selectedFavIds.size === 0 ? '0.5' : '1';
}

function handleFavBatchDelete() {
    if (selectedFavIds.size === 0) return;
    if (confirm(`确定删除选中的 ${selectedFavIds.size} 条收藏吗？`)) {
        favoritesData = favoritesData.filter(f => !selectedFavIds.has(f.id));
        saveFavoritesToStorage();
        toggleFavSelectMode();
    }
}

function searchFavorites() {
    const input = document.getElementById('favoritesSearchInput');
    if (!input) return;
    const keyword = input.value.trim();
    renderFavoritesList(keyword);
}

// 表情库逻辑
async function loadStickers() {
    try {
        const data = await dbGet('settings', 'wechat_stickers');
        if (data) {
            stickerList = data.value;
        } else {
            const saved = localStorage.getItem('wechat_stickers');
            if (saved) {
                stickerList = JSON.parse(saved);
                await saveStickers();
            }
        }
    } catch (e) {
        const saved = localStorage.getItem('wechat_stickers');
        if (saved) stickerList = JSON.parse(saved);
    }
}

async function saveStickers() {
    try {
        await dbPut('settings', { key: 'wechat_stickers', value: stickerList });
    } catch (e) {
        localStorage.setItem('wechat_stickers', JSON.stringify(stickerList));
    }
}

function openStickerLibrary() {
    showContainer('stickerLibraryContainer');
    loadStickers();
    renderStickerGrid();
    updateTime();
    saveUIState();
}

function closeStickerLibrary() {
    document.getElementById('stickerLibraryContainer').style.display = 'none';
    saveUIState();
}

function openStickerManagement() {
    document.getElementById('stickerManagementContainer').style.display = 'flex';
    updateTime();
    saveUIState();
}

function closeStickerManagement() {
    document.getElementById('stickerManagementContainer').style.display = 'none';
    saveUIState();
}

function openStickerCategoryManagement() {
    alert('分类管理功能开发中');
}

function openUsageManagement() {
    alert('使用管理功能开发中');
}

function triggerStickerImport() {
    document.getElementById('stickerFileImportInput').click();
}

async function handleStickerFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const extension = file.name.split('.').pop().toLowerCase();
    
    if (extension === 'json') {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    stickerList = [...stickerList, ...data];
                    saveStickers();
                    renderStickerGrid();
                    alert('导入成功');
                } else {
                    alert('JSON格式不符合表情包要求');
                }
            } catch (err) {
                alert('JSON解析失败：' + err.message);
            }
        };
        reader.readAsText(file);
    } else if (extension === 'txt') {
        const reader = new FileReader();
        reader.onload = function(e) {
            processStickerTextContent(e.target.result);
        };
        reader.readAsText(file);
    } else if (extension === 'docx') {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            if (window.mammoth) {
                mammoth.extractRawText({arrayBuffer: arrayBuffer})
                    .then(function(result) {
                        processStickerTextContent(result.value);
                    })
                    .catch(function(err) {
                        alert('Docx解析失败：' + err.message);
                    });
            } else {
                alert('正在加载Docx解析组件，请稍后再试');
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('不支持的文件格式');
    }
    event.target.value = '';
}

function processStickerTextContent(text) {
    // 正则匹配：名称 + 冒号 + URL(以jpg, png, gif结尾)
    // 支持中文冒号和英文冒号
    const regex = /([^：:\n\r]+)[：:](https?:\/\/[^ \n\r]+?\.(?:jpg|png|gif))/gi;
    let match;
    let added = 0;
    
    while ((match = regex.exec(text)) !== null) {
        const name = match[1].trim();
        const url = match[2].trim();
        if (name && url) {
            stickerList.push({ name: name, src: url });
            added++;
        }
    }

    if (added > 0) {
        saveStickers();
        renderStickerGrid();
        alert(`成功识别并导入 ${added} 个表情`);
    } else {
        alert('未能识别到有效的表情信息（请确保包含图片URL）');
    }
}

function exportStickers() {
    if (stickerList.length === 0) {
        alert('当前表情库为空，无可导出的内容');
        return;
    }
    downloadData(stickerList, `MimiPhone_Emojis_${new Date().toISOString().slice(0,10)}.json`);
    alert('所有表情包已导出为 JSON 文件');
}

function renderStickerGrid() {
    const container = document.getElementById('stickerGrid');
    if (!container) return;
    const input = document.getElementById('stickerSearchInput');
    const keyword = input ? input.value.trim().toLowerCase() : '';
    
    let filtered = stickerList;
    if (keyword) {
        filtered = stickerList.filter(s => s.name.toLowerCase().includes(keyword));
    }

    container.innerHTML = '';

    // 保持添加按钮在第一位
    if (!keyword) {
        const addBtn = document.createElement('div');
        addBtn.className = 'sticker-add-btn';
        addBtn.onclick = openStickerUploadModal;
        addBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
        `;
        container.appendChild(addBtn);
    }

    filtered.forEach((sticker, index) => {
        const item = document.createElement('div');
        item.className = 'sticker-item';
        
        // 长按逻辑
        let pressTimer;
        item.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                showStickerOptions(sticker, index);
            }, 600);
        }, { passive: true });
        item.addEventListener('touchend', () => clearTimeout(pressTimer));
        item.addEventListener('touchmove', () => clearTimeout(pressTimer));

        item.innerHTML = `
            <img src="${sticker.src}" alt="${sticker.name}">
            <div class="sticker-name-overlay">${sticker.name}</div>
        `;
        container.appendChild(item);
    });
}

let currentEditingStickerIndex = null;
function showStickerOptions(sticker, index) {
    if (navigator.vibrate) navigator.vibrate(50);
    currentEditingStickerIndex = index;
    document.getElementById('stickerOptionsModal').classList.add('active');
}

function closeStickerOptionsModal() {
    document.getElementById('stickerOptionsModal').classList.remove('active');
}

function startModifyStickerName() {
    const sticker = stickerList[currentEditingStickerIndex];
    if (!sticker) return;
    const newName = prompt('请输入新名字：', sticker.name);
    if (newName && newName.trim()) {
        sticker.name = newName.trim();
        saveStickers();
        renderStickerGrid();
    }
    closeStickerOptionsModal();
}

function startDeleteSticker() {
    if (confirm('确定删除该表情吗？')) {
        stickerList.splice(currentEditingStickerIndex, 1);
        saveStickers();
        renderStickerGrid();
    }
    closeStickerOptionsModal();
}

function openStickerUploadModal() {
    document.getElementById('stickerUploadModal').classList.add('active');
    switchStickerUploadTab('single');
}

function closeStickerUploadModal() {
    document.getElementById('stickerUploadModal').classList.remove('active');
    hideStickerUrlInput('single');
    hideStickerUrlInput('batch');
}

function switchStickerUploadTab(mode) {
    currentUploadMode = mode;
    document.getElementById('tab-single').classList.toggle('active', mode === 'single');
    document.getElementById('tab-batch').classList.toggle('active', mode === 'batch');
    document.getElementById('stickerUploadSingle').style.display = mode === 'single' ? 'block' : 'none';
    document.getElementById('stickerUploadBatch').style.display = mode === 'batch' ? 'block' : 'none';
}

function importStickerFromAlbum(mode) {
    if (mode === 'single') {
        document.getElementById('stickerFileInputSingle').click();
    } else {
        document.getElementById('stickerFileInputBatch').click();
    }
}

function handleStickerFileSelect(event, mode) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (mode === 'single') {
        const name = prompt('请输入表情名称：');
        if (!name) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            stickerList.push({ name: name.trim(), src: e.target.result });
            saveStickers();
            renderStickerGrid();
            closeStickerUploadModal();
        };
        reader.readAsDataURL(files[0]);
    } else {
        const namesInput = prompt('请输入表情名称（多个用空格或回车隔开）：');
        if (!namesInput) return;
        const names = namesInput.trim().split(/\s+/);
        
        let processed = 0;
        for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const name = names[i] || `表情_${Date.now()}_${i}`;
                stickerList.push({ name: name, src: e.target.result });
                processed++;
                if (processed === files.length) {
                    saveStickers();
                    renderStickerGrid();
                    closeStickerUploadModal();
                }
            };
            reader.readAsDataURL(files[i]);
        }
    }
    event.target.value = '';
}

function showStickerUrlInput(mode) {
    const el = document.getElementById(`stickerUrlArea-${mode}`);
    if (el) el.style.display = 'block';
}

function hideStickerUrlInput(mode) {
    const area = document.getElementById(`stickerUrlArea-${mode}`);
    const input = document.getElementById(`stickerUrl-${mode}`);
    if (area) area.style.display = 'none';
    if (input) input.value = '';
}

function confirmStickerUrl(mode) {
    const input = document.getElementById(`stickerUrl-${mode}`);
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    if (mode === 'single') {
        const name = prompt('请输入表情名称：');
        if (!name) return;
        stickerList.push({ name: name.trim(), src: val });
    } else {
        // 格式：小猫撒娇：htpps://xxxx
        const lines = val.split(/[\s\n]+/);
        lines.forEach(line => {
            const parts = line.split(/[：:]/);
            if (parts.length >= 2) {
                const name = parts[0].trim();
                const url = line.substring(line.indexOf(parts[1])).trim();
                if (name && url) {
                    stickerList.push({ name: name, src: url });
                }
            }
        });
    }
    
    saveStickers();
    renderStickerGrid();
    closeStickerUploadModal();
}

let pendingStickerFiles = [];
function handleBatchStickerSelect(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    pendingStickerFiles = Array.from(files);
    const input = document.getElementById('batchStickerNameInput');
    if (!input) return;
    input.value = '';
    
    closeStickerUploadModal();
    document.getElementById('batchStickerNameModal').classList.add('active');
    
    input.onkeydown = function(e) {
        if (e.key === 'Enter') {
            e.stopPropagation();
        }
    };
    setTimeout(() => input.focus(), 100);
}

function closeBatchNameModal() {
    document.getElementById('batchStickerNameModal').classList.remove('active');
    pendingStickerFiles = [];
}

function confirmBatchNames() {
    const input = document.getElementById('batchStickerNameInput');
    if (!input) return;
    const namesInput = input.value.trim();
    if (!namesInput) {
        alert('请输入名称');
        return;
    }
    const names = namesInput.split(/[\s\n]+/);
    
    let processed = 0;
    pendingStickerFiles.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const name = names[i] || `表情_${Date.now()}_${i}`;
            stickerList.push({ name: name, src: e.target.result });
            processed++;
            if (processed === pendingStickerFiles.length) {
                saveStickers();
                renderStickerGrid();
                closeBatchNameModal();
                closeStickerUploadModal();
            }
        };
        reader.readAsDataURL(file);
    });
}

// WeChat specific initialization
async function initWechat() {
    await loadContactsFromStorage();
    await loadChatListFromStorage();
    await loadGroupListFromStorage();
    await loadChatHistories();
    loadWechatUserInfo();
    loadTopCategories();
    await loadFavoritesFromStorage();
    await loadStickers();
    await loadFavoriteStickers();
    renderTopTagBar();
}
