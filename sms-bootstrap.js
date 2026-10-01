(function () {
    'use strict';
    if (typeof window.openSmsApp === 'function') return;
    const app = document.getElementById('smsApp');
    const view = document.getElementById('smsView');
    const back = document.getElementById('smsBackBtn');
    if (!app || !view) return;
    function openSmsApp() {
        app.hidden = false;
        document.body.classList.add('sms-app-active');
        view.innerHTML = '<section class="sms-screen sms-home-screen"><div class="sms-list-heading"><h1>信息</h1></div><div class="sms-search-wrap"><input class="sms-search" type="search" placeholder="搜索"></div><div class="sms-conversation-list"><article class="sms-conversation" id="mimiBootstrapConversation"><div class="sms-avatar">M</div><div class="sms-conversation-copy"><div class="sms-conversation-top"><span class="sms-conversation-name">Mimi助手</span><span class="sms-conversation-time">现在</span></div><span class="sms-conversation-preview">欢迎使用MimiPhone！</span></div></article></div></section>';
        document.getElementById('mimiBootstrapConversation')?.addEventListener('click', () => {
            view.innerHTML = '<section class="sms-thread-screen"><div class="sms-thread-info"><div class="sms-avatar sms-thread-avatar">M</div><div class="sms-thread-name">Mimi助手</div></div><div class="sms-messages"><div class="sms-bubble-row in"><div class="sms-bubble in">欢迎使用MimiPhone！</div></div><div class="sms-bubble-row in"><div class="sms-bubble in">列表页CSS设置请点击顶部“信息”；聊天页CSS设置请点击上方三个点中的自定义CSS。</div></div></div><form class="sms-composer"><textarea class="sms-composer-input" placeholder="短信"></textarea><button class="sms-send-button" type="submit">发送</button></form></section>';
        });
    }
    function closeSmsApp() { app.hidden = true; document.body.classList.remove('sms-app-active'); }
    window.openSmsApp = openSmsApp;
    window.closeSmsApp = closeSmsApp;
    back?.addEventListener('click', closeSmsApp);
    document.querySelector('.sms-story-entry')?.addEventListener('click', openSmsApp);
})();
