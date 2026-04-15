// 微信相关交互逻辑（从主脚本中拆分）

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
        if (navBar) {
            navBar.style.display = 'flex';
            navBar.style.backgroundColor = '#fff';
            navBar.style.borderBottom = '1px solid #f5f5f5';
        }
        if (typeof renderChatList === 'function') renderChatList();
    } else if (tab === 'contacts') {
        contactsPage.style.display = 'block';
        searchBar.style.display = 'block';
        navTitle.textContent = '通讯录';
        if (navBar) {
            navBar.style.display = 'flex';
            navBar.style.backgroundColor = '#fff';
            navBar.style.borderBottom = '1px solid #f5f5f5';
        }
        if (typeof renderWechatContacts === 'function') renderWechatContacts();
    } else if (tab === 'discover') {
        if (discoverPage) discoverPage.style.display = 'block';
        navTitle.textContent = '发现';
        if (navBar) {
            navBar.style.display = 'flex';
            navBar.style.backgroundColor = '#fff';
            navBar.style.borderBottom = 'none';
        }
    } else if (tab === 'me') {
        mePage.style.display = 'block';
        if (navBar) navBar.style.display = 'none';
        if (bottomNav) bottomNav.style.backgroundColor = '#fff';
        if (typeof renderWechatMePage === 'function') renderWechatMePage();
    }

    if (typeof saveUIState === 'function') saveUIState();
}

function openWechat() {
    if (typeof wechatVisible !== 'undefined') wechatVisible = true;
    const phoneContainer = document.querySelector('.phone-container');
    const wechatContainer = document.getElementById('wechatContainer');
    if (phoneContainer) phoneContainer.style.display = 'none';
    if (wechatContainer) wechatContainer.style.display = 'flex';

    if (typeof updateTime === 'function') updateTime();
    if (typeof updateBattery === 'function') updateBattery();

    const messagesTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item');
    if (messagesTab) switchWechatTab('messages', messagesTab);

    if (typeof saveUIState === 'function') saveUIState();
}
