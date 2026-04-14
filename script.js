const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Ccircle cx='12' cy='10' r='3' fill='%23fff'/%3E%3Cpath d='M12 14c-4 0-6 2-6 2v1h12v-1s-2-2-6-2z' fill='%23fff'/%3E%3C/svg%3E";
        const DEFAULT_LANDSCAPE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23eee'%3E%3Crect width='24' height='24'/%3E%3Cpath d='M4 18l4-4 3 3 4-4 5 5v1H4v-1z' fill='%23ccc'/%3E%3C/svg%3E";

        let currentElement = null;
        let currentImageId = null;

        // 统一页面切换逻辑，防止白屏和层级冲突
        function hideAllContainers() {
            const containers = [
                'wechatContainer', 'settingsContainer', 
                'contactsContainer', 'themeContainer', 'worldBookContainer',
                'accountContainer', 'accountInfoContainer', 'displaySettingsContainer',
                'apiConfigContainer', 'mineContainer', 'personalInfoContainer',
                'wechatSettingsContainer', 'wechatDisplaySettingsContainer',
                'wechatStorageContainer', 'categoryManagementContainer',
                'chatInfoContainer', 'addContactContainer', 'wechatFavoritesContainer',
                'stickerLibraryContainer', 'stickerManagementContainer',
                'mergedChatDetailContainer', 'realNameContainer', 'manualMemoryContainer',
                'worldBookEditPage', 'bookItemEditPage', 'momentsContainer',
                'momentsEditPage', 'wechatAccountSwitchContainer', 'servicePageContainer',
                'groupChatPage', 'groupChatInfoPage', 'contactDetailPage', 'chatPageContainer',
                'wallpaperPage', 'iconPage', 'icon2Page', 'fontPage', 'batterySettingsContainer'
            ];
            containers.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            
            const phoneEl = document.querySelector('.phone-container');
            if (phoneEl) phoneEl.style.display = 'none';

            document.body.classList.remove('moments-active', 'contact-detail-active', 'service-page-active', 'category-management-active', 'personal-info-active');
        }

        function showContainer(id) {
            hideAllContainers();
            let el = (id === 'phone-container') ? document.querySelector('.phone-container') : document.getElementById(id);
            
            if (el) {
                el.style.display = 'flex';
                if (id === 'wechatContainer') el.style.display = 'block'; // 微信主页使用 block 布局
                window.scrollTo(0, 0); // 切换页面后回到顶部
            } else {
                console.error('Container not found:', id);
            }
        }


        const iconConfig = [
            { id: 'avatar1', name: '头像1' },
            { id: 'avatar2', name: '头像2' },
            { id: 'illustration', name: '插画' },
            { id: 'app1', name: '微信' },
            { id: 'app2', name: '小游戏' },
            { id: 'app3', name: '世界书' },
            { id: 'app4', name: '网易云音乐' },
            { id: 'dock1', name: '电话' },
            { id: 'dock2', name: '联系人' },
            { id: 'dock3', name: '主题' },
            { id: 'dock4', name: '设置' },
            { id: 'accountAvatarImg', name: '账号头像' }
        ];

        const btnIconConfig = [
            { id: 'theme-menu-mine', name: '主题-我的', default: '👤' },
            { id: 'theme-menu-wallpaper', name: '主题-壁纸', default: '🖼️' },
            { id: 'theme-menu-icon', name: '主题-图标', default: '🎨' },
            { id: 'theme-menu-icon2', name: '主题-图标2', default: '🖼️' },
            { id: 'theme-menu-font', name: '主题-字体', default: '🔤' },
            { id: 'theme-menu-beautify', name: '主题-美化', default: '✨' },
            { id: 'theme-menu-component', name: '主题-组件', default: '🧩' },
            { id: 'set-icon-account', name: '设置-账号', default: '🔑' },
            { id: 'set-icon-display', name: '设置-显示', default: '📱' },
            { id: 'set-icon-api', name: '设置-API配置', default: '⚙️' },
            { id: 'set-icon-security', name: '设置-安全', default: '🛡️' },
            { id: 'set-icon-about', name: '设置-关于', default: 'ℹ️' },
            { id: 'set-icon-update', name: '设置-更新', default: '🔄' }
        ];
        
        async function loadSavedIcons() {
            try {
                const images = await dbGetAll("icons");
                images.forEach((img) => {
                    const el = document.getElementById(img.id);
                    if (el && img.src) el.src = img.src;
                });
                const btnIcons = await dbGetAll("button_icons");
                btnIcons.forEach((icon) => {
                    const el = document.getElementById(icon.id);
                    if (el && icon.content) {
                        if (icon.content.startsWith('data:image/') || icon.content.startsWith('http')) {
                            el.innerHTML = `<img src="${icon.content}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
                            el.style.overflow = 'hidden';
                        } else el.textContent = icon.content;
                    }
                });
            } catch (e) { console.error("Failed to load images:", e); }
        }

        async function saveImage(id, src) {
            try {
                await dbPut("icons", { id: id, src: src });
            } catch (e) {
                console.error("Failed to save image:", e);
                alert("保存图片失败");
            }
        }

        function updateTime() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            const globalTime = document.getElementById('globalTime');
            if (globalTime) globalTime.textContent = timeStr;
            document.querySelectorAll('.wechat-time-sync').forEach(el => { el.textContent = timeStr; });
        }

        function safeLocalStorageSet(key, value, silent = false) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error("LocalStorage save failed:", e);
                // 存储没有大小限制
                return false;
            }
        }

        function safeLocalStorageRemove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error("LocalStorage remove failed:", e);
                return false;
            }
        }

        function togglePhoneBorder(enabled) {
            if (enabled) {
                document.body.classList.add('has-phone-border');
                safeLocalStorageSet('mimi_border_pref', 'true');
            } else {
                document.body.classList.remove('has-phone-border');
                safeLocalStorageSet('mimi_border_pref', 'false');
            }
        }

        function toggleNotch(enabled) {
            if (enabled) {
                document.body.classList.add('has-notch');
                safeLocalStorageSet('mimi_notch_pref', 'true');
            } else {
                document.body.classList.remove('has-notch');
                safeLocalStorageSet('mimi_notch_pref', 'false');
            }
        }

        function toggleStatusBar(enabled) {
            const statusBar = document.getElementById('globalStatusBar');
            if (statusBar) statusBar.style.display = enabled ? 'none' : 'flex';
            safeLocalStorageSet('mimi_status_bar_hide_pref', enabled ? 'true' : 'false');
            document.querySelectorAll('[id="statusBarToggle"]').forEach(toggle => { toggle.checked = enabled; });
        }

        function loadDisplayExtras() {
            const borderPref = localStorage.getItem('mimi_border_pref') === 'true';
            const notchPref = localStorage.getItem('mimi_notch_pref') === 'true';
            const statusBarHidePref = localStorage.getItem('mimi_status_bar_hide_pref') === 'true';
            if (borderPref) {
                document.body.classList.add('has-phone-border');
                const toggle = document.getElementById('borderToggle');
                if (toggle) toggle.checked = true;
            }
            if (notchPref) {
                document.body.classList.add('has-notch');
                const toggle = document.getElementById('notchToggle');
                if (toggle) toggle.checked = true;
            }
            if (statusBarHidePref) toggleStatusBar(true);
        }

        function updateBattery() {
            if ('getBattery' in navigator) {
                navigator.getBattery().then(battery => {
                    const updateAll = () => {
                        const level = Math.round(battery.level * 100);
                        document.querySelectorAll('.battery-percent').forEach(el => { el.textContent = `${level}%`; });
                        document.querySelectorAll('.battery-fill').forEach(el => {
                            el.style.width = `${level}%`;
                            if (level <= 20) el.classList.add('low');
                            else el.classList.remove('low');
                        });
                        checkBatteryAlert(level);
                    };
                    updateAll();
                    battery.addEventListener('levelchange', updateAll);
                });
            }
        }

        function checkBatteryAlert(level) {
            const enabled = localStorage.getItem('mimi_battery_alert_enabled') === 'true';
            if (!enabled) return;
            if (level <= 20 && !window.lowBatteryAlerted) {
                const customText = localStorage.getItem('mimi_battery_alert_text') || "当前电量低于20%请及时充电";
                const customCss = localStorage.getItem('mimi_battery_alert_css') || "";
                showCustomBatteryAlert(customText, customCss);
                window.lowBatteryAlerted = true;
            } else if (level > 20) window.lowBatteryAlerted = false;
        }

        function showCustomBatteryAlert(text, css) {
            const old = document.getElementById('batteryAlertOverlay');
            if (old) old.remove();
            const overlay = document.createElement('div');
            overlay.id = 'batteryAlertOverlay';
            overlay.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999999; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease;`;
            const alertBox = document.createElement('div');
            alertBox.className = 'custom-battery-alert';
            let baseStyle = `background: #fff; padding: 25px; border-radius: 20px; width: 80%; max-width: 300px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative;`;
            alertBox.style.cssText = baseStyle + css;
            alertBox.innerHTML = `
                <div class="battery-alert-content" style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">${text}</div>
                <button onclick="document.getElementById('batteryAlertOverlay').remove()" style="width: 100%; padding: 12px; background: #000; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer;">好的</button>
            `;
            overlay.appendChild(alertBox);
            document.body.appendChild(overlay);
            if (!document.getElementById('batteryAlertAnim')) {
                const style = document.createElement('style');
                style.id = 'batteryAlertAnim';
                style.textContent = `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
                document.head.appendChild(style);
            }
        }

        function openBatterySettings() {
            document.getElementById('displaySettingsContainer').style.display = 'none';
            document.getElementById('batterySettingsContainer').style.display = 'flex';
            loadBatterySettings();
            updateTime();
            saveUIState();
        }

        function closeBatterySettings() {
            document.getElementById('batterySettingsContainer').style.display = 'none';
            document.getElementById('displaySettingsContainer').style.display = 'flex';
            saveUIState();
        }

        function loadBatterySettings() {
            const enabled = localStorage.getItem('mimi_battery_alert_enabled') === 'true';
            const text = localStorage.getItem('mimi_battery_alert_text') || "当前电量低于20%请及时充电";
            const css = localStorage.getItem('mimi_battery_alert_css') || "";
            document.getElementById('batteryAlertToggle').checked = enabled;
            document.getElementById('batteryAlertText').value = text;
            document.getElementById('batteryAlertCss').value = css;
            updateBatteryConfigUI(enabled);
        }

        function toggleBatteryAlert(enabled) {
            safeLocalStorageSet('mimi_battery_alert_enabled', enabled);
            updateBatteryConfigUI(enabled);
            saveBatterySettings();
        }

        function updateBatteryConfigUI(enabled) {
            const line = document.getElementById('batteryTextLine');
            const input = document.getElementById('batteryAlertText');
            const label = document.getElementById('batteryAlertLabel');
            if (line) line.style.borderBottomColor = enabled ? '#000' : '#ddd';
            if (input) {
                input.disabled = !enabled;
                input.style.color = enabled ? '#000' : '#888';
            }
            if (label) label.style.color = enabled ? '#000' : '#666';
        }

        function saveBatterySettings() {
            const enabled = document.getElementById('batteryAlertToggle').checked;
            const text = document.getElementById('batteryAlertText').value;
            const css = document.getElementById('batteryAlertCss').value;
            safeLocalStorageSet('mimi_battery_alert_enabled', enabled);
            safeLocalStorageSet('mimi_battery_alert_text', text);
            safeLocalStorageSet('mimi_battery_alert_css', css);
        }

        function previewBatteryAlert() {
            const text = document.getElementById('batteryAlertText').value || "当前电量低于20%请及时充电";
            const css = document.getElementById('batteryAlertCss').value || "";
            showCustomBatteryAlert(text, css);
        }

        function applyBatteryTemplate(type) {
            let css = "";
            switch(type) {
                case 'ios': css = "background: rgba(255,255,255,0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 14px; color: #000; font-family: -apple-system; font-weight: 600;"; break;
                case 'neon': css = "background: #1a1a1a; border: 2px solid #0ff; box-shadow: 0 0 15px #0ff; color: #0ff; text-shadow: 0 0 5px #0ff; border-radius: 0; font-family: 'Courier New';"; break;
                case 'minimal': css = "background: #fff; border-left: 5px solid #000; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: left;"; break;
                case 'dark': css = "background: #2c2c2e; color: #fff; border-radius: 18px; box-shadow: 0 10px 40px rgba(0,0,0,0.4);"; break;
            }
            document.getElementById('batteryAlertCss').value = css;
            saveBatterySettings();
            showCustomBatteryAlert(document.getElementById('batteryAlertText').value, css);
        }

        function editText(element, type) {
            currentElement = element;
            document.getElementById('textInput').value = element.textContent;
            document.getElementById('textModal').classList.add('active');
        }

        function confirmText() {
            const newText = document.getElementById('textInput').value;
            if (newText.trim()) {
                currentElement.textContent = newText;
                saveTextContent();
            }
            closeModal();
        }

        function saveAccountInfo() {
            const btn = document.querySelector('.account-action-item[onclick="saveAccountInfo()"]');
            if (btn) btn.style.opacity = '0.5';
            setTimeout(() => {
                saveTextContent();
                alert('账号信息保存成功');
                if (btn) btn.style.opacity = '1';
            }, 50);
        }

        function saveTextContent() {
            const textElements = document.querySelectorAll('[id^="txt-"]');
            const textData = {};
            textElements.forEach(el => { textData[el.id] = el.textContent; });
            safeLocalStorageSet('mimi_text_content', JSON.stringify(textData));
        }

        function loadTextContent() {
            const saved = localStorage.getItem('mimi_text_content');
            if (saved) {
                const textData = JSON.parse(saved);
                for (const id in textData) {
                    const el = document.getElementById(id);
                    if (el) el.textContent = textData[id];
                }
            }
        }

        function changeImage(imageId) {
            currentImageId = imageId;
            document.getElementById('urlInputContainer').style.display = 'none';
            document.getElementById('imageModal').classList.add('active');
        }

        function selectFromAlbum() { document.getElementById('fileInput').click(); }

        function handleFileSelect(event) {
            const file = event.target.files[0];
            const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
            if (file && allowedTypes.includes(file.type)) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const src = e.target.result;
                    const el = document.getElementById(currentImageId);
                    if (el.tagName === 'IMG') {
                        el.src = src;
                        saveImage(currentImageId, src);
                    } else {
                        el.innerHTML = `<img src="${src}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
                        el.style.overflow = 'hidden';
                        saveButtonIcon(currentImageId, src);
                    }
                    if (document.getElementById('iconPage').style.display === 'flex') renderIconList();
                    if (document.getElementById('icon2Page').style.display === 'flex') renderIcon2List();
                    closeModal();
                };
                reader.readAsDataURL(file);
            }
        }

        function showUrlInput() {
            document.getElementById('urlInputContainer').style.display = 'block';
            document.getElementById('modalMainButtons').style.display = 'none';
            document.getElementById('urlInput').focus();
        }

        function hideUrlInput() {
            document.getElementById('urlInputContainer').style.display = 'none';
            document.getElementById('modalMainButtons').style.display = 'flex';
            document.getElementById('urlInput').value = '';
        }

        function confirmUrl() {
            const url = document.getElementById('urlInput').value.trim();
            if (url) {
                const el = document.getElementById(currentImageId);
                if (el.tagName === 'IMG') {
                    el.src = url;
                    saveImage(currentImageId, url);
                } else {
                    el.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
                    el.style.overflow = 'hidden';
                    saveButtonIcon(currentImageId, url);
                }
                if (document.getElementById('iconPage').style.display === 'flex') renderIconList();
                if (document.getElementById('icon2Page').style.display === 'flex') renderIcon2List();
                closeModal();
            }
        }

        function closeModal() {
            document.getElementById('textModal').classList.remove('active');
            document.getElementById('imageModal').classList.remove('active');
            document.getElementById('urlInputContainer').style.display = 'none';
            document.getElementById('modalMainButtons').style.display = 'flex';
            document.getElementById('urlInput').value = '';
        }

        async function updateApp() {
            if (confirm('确定要检查并更新到最新版本吗？')) {
                try {
                    if ('caches' in window) {
                        const cacheNames = await caches.keys();
                        for (const name of cacheNames) await caches.delete(name);
                    }
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) await registration.unregister();
                    }
                    alert('缓存已清理，即将重新加载以更新到最新版本');
                    window.location.reload();
                } catch (e) { alert("更新失败：" + e.message); }
            }
        }

        function openSettings() {
            showContainer('settingsContainer');
            updateTime();
            updateBattery();
            saveUIState();
        }

        function closeSettings() {
            showContainer('phone-container');
            saveUIState();
        }

        function openAccount() {
            showContainer('accountContainer');
            updateTime();
            updateBattery();
            saveUIState();
        }

        function closeAccount() {
            showContainer('settingsContainer');
            saveUIState();
        }

        function openAccountInfo() {
            showContainer('accountInfoContainer');
            const nickname = document.getElementById('txt-account-nickname').textContent;
            const phone = document.getElementById('txt-account-phone').textContent;
            const avatarSrc = document.getElementById('accountAvatarImg').src;
            const infoNickname = document.getElementById('info-nickname');
            const infoPhone = document.getElementById('info-phone');
            const infoAvatar = document.getElementById('accountInfoAvatarPreview');
            const infoMimi = document.getElementById('info-mimi-id');
            const infoCountry = document.getElementById('info-country');
            const infoLocation = document.getElementById('info-location');
            if (infoNickname) infoNickname.textContent = nickname === '请输入昵称' ? '未设置' : nickname;
            if (infoPhone) infoPhone.textContent = phone === '请输入手机号' ? '未设置' : phone;
            if (infoAvatar) infoAvatar.src = avatarSrc;
            if (infoMimi) {
                if (!wechatUserInfo.mimiId) {
                    wechatUserInfo.mimiId = 'Mid' + Math.floor(Math.random() * 100000000);
                    saveWechatUserInfo();
                }
                infoMimi.textContent = wechatUserInfo.mimiId;
            }
            if (infoCountry) infoCountry.textContent = wechatUserInfo.country || '中国';
            if (infoLocation) infoLocation.textContent = wechatUserInfo.location || '未设置';
            updateTime();
            updateBattery();
            saveUIState();
        }

        function closeAccountInfo() {
            showContainer('accountContainer');
            saveUIState();
        }

        function openRealNamePage() {
            showContainer('realNameContainer');
            document.getElementById('realName-name').value = realNameInfo.name === '未设置' ? '' : realNameInfo.name;
            document.getElementById('realName-age').value = realNameInfo.age === '未设置' ? '' : realNameInfo.age;
            document.getElementById('realName-gender').value = realNameInfo.gender === '未设置' ? '' : realNameInfo.gender;
            document.getElementById('realName-birthday').value = realNameInfo.birthday === '未设置' ? '' : realNameInfo.birthday;
            document.getElementById('realName-job').value = realNameInfo.job === '未设置' ? '' : realNameInfo.job;
            document.getElementById('realName-location').value = realNameInfo.location === '未设置' ? '' : realNameInfo.location;
            document.getElementById('realName-hometown').value = realNameInfo.hometown === '未设置' ? '' : realNameInfo.hometown;
            document.getElementById('realName-persona').value = realNameInfo.persona === '未设置' ? '' : realNameInfo.persona;
            updateTime();
            updateBattery();
            saveUIState();
        }

        function closeRealNamePage() {
            realNameInfo.name = document.getElementById('realName-name').value.trim() || '未设置';
            realNameInfo.age = document.getElementById('realName-age').value.trim() || '未设置';
            realNameInfo.gender = document.getElementById('realName-gender').value.trim() || '未设置';
            realNameInfo.birthday = document.getElementById('realName-birthday').value.trim() || '未设置';
            realNameInfo.job = document.getElementById('realName-job').value.trim() || '未设置';
            realNameInfo.location = document.getElementById('realName-location').value.trim() || '未设置';
            realNameInfo.hometown = document.getElementById('realName-hometown').value.trim() || '未设置';
            realNameInfo.persona = document.getElementById('realName-persona').value.trim() || '未设置';
            saveRealNameInfo();
            const statusEl = document.getElementById('real-name-status');
            if (statusEl) statusEl.textContent = (realNameInfo.name !== '未设置') ? '已实名' : '未实名';
            showContainer('accountInfoContainer');
            saveUIState();
        }

        function openApiConfig() {
            showContainer('apiConfigContainer');
            updateTime();
            updateBattery();
            loadApiConfigs();
            saveUIState();
        }

        function closeApiConfig() {
            showContainer('settingsContainer');
            saveUIState();
        }

        function openDisplaySettings() {
            showContainer('displaySettingsContainer');
            updateTime();
            updateBattery();
            document.getElementById('fullscreenToggle').checked = !!document.fullscreenElement;
            saveUIState();
        }

        function closeDisplaySettings() {
            showContainer('settingsContainer');
            saveUIState();
        }

        function toggleFullscreen(enabled) {
            if (enabled) {
                safeLocalStorageSet('mimi_fullscreen_pref', 'true', true);
                enterFullscreen();
            } else {
                safeLocalStorageRemove('mimi_fullscreen_pref');
                exitFullscreen();
            }
        }

        function enterFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().then(() => {
                    if (screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => {});
                }).catch(err => console.warn("Fullscreen request failed:", err));
            }
        }

        function exitFullscreen() {
            if (document.fullscreenElement) {
                document.exitFullscreen();
                if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
            }
        }

        function checkFullscreenPref() {
            const pref = localStorage.getItem('mimi_fullscreen_pref');
            if (pref === 'true') {
                const toggle = document.getElementById('fullscreenToggle');
                if (toggle) toggle.checked = true;
            }
        }

        document.addEventListener('click', () => {
            if (localStorage.getItem('mimi_fullscreen_pref') === 'true' && !document.fullscreenElement) enterFullscreen();
        }, true);

        document.addEventListener('fullscreenchange', () => {
            const toggle = document.getElementById('fullscreenToggle');
            if (toggle) {
                const pref = localStorage.getItem('mimi_fullscreen_pref');
                toggle.checked = (pref === 'true');
            }
        });

        function downloadData(data, fileName) {
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        }

        async function exportSystemData() {
            try {
                const data = { localStorage: {}, indexedDB: {} };
                const keys = ['mimi_text_content', 'wechat_user_info', 'wechat_chat_list', 'wechat_group_list', 'wechat_chat_histories', 'contacts', 'customCategories', 'current_api_config_id', 'mimi_ui_state', 'lowBatteryAlerted'];
                keys.forEach(key => {
                    const val = localStorage.getItem(key);
                    if (val !== null) data.localStorage[key] = val;
                });
                const stores = ['wallpapers', 'icons', 'fonts', 'themes', 'api_configs', 'settings', 'chat_histories', 'moments'];
                for (const store of stores) data.indexedDB[store] = await dbGetAll(store);
                downloadData(data, `MimiPhone_FullData_${new Date().toISOString().slice(0,10)}.json`);
                alert('系统数据导出成功！');
            } catch (e) { alert("导出失败：" + e.message); }
        }

        function importSystemData(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.localStorage || !data.indexedDB) throw new Error('导入文件格式不正确');
                    if (!confirm('导入数据将覆盖当前所有设置，是否继续？')) return;
                    for (const key in data.localStorage) localStorage.setItem(key, data.localStorage[key]);
                    for (const storeName in data.indexedDB) {
                        await dbClear(storeName);
                        for (const item of data.indexedDB[storeName]) await dbPut(storeName, item);
                    }
                    alert('系统数据导入成功，即将刷新页面');
                    location.reload();
                } catch (error) { alert('导入失败：' + error.message); }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        async function deleteSystemData() {
            if (!confirm('确定要删除所有系统数据吗？')) return;
            if (!confirm('请再次确认：确定要彻底删除吗？')) return;
            try {
                localStorage.clear();
                const stores = ['wallpapers', 'icons', 'fonts', 'themes', 'api_configs', 'settings', 'chat_histories', 'moments'];
                for (const store of stores) await dbClear(store);
                alert('系统数据已全部删除，即将刷新页面');
                location.reload();
            } catch (e) { alert("删除失败：" + e.message); }
        }

        async function loadApiConfigs() {
            try {
                apiConfigs = await dbGetAll('api_configs');
                if (apiConfigs.length === 0) {
                    const defaultConfig = { id: 'default', name: '默认配置', url: '', key: '', model: '', temp: '1.0' };
                    await dbPut('api_configs', defaultConfig);
                    apiConfigs = [defaultConfig];
                }
                const savedConfigId = localStorage.getItem('current_api_config_id');
                if (savedConfigId && apiConfigs.find(c => c.id === savedConfigId)) currentConfigId = savedConfigId;
                else currentConfigId = apiConfigs[0].id;
                renderConfigDropdown();
                applyConfigToForm(currentConfigId);
            } catch (e) { console.error("Failed to load API configs:", e); }
        }

        function renderConfigDropdown() {
            const select = document.getElementById('configSelect');
            select.innerHTML = '';
            apiConfigs.forEach(config => {
                const option = document.createElement('option');
                option.value = config.id;
                option.textContent = config.name;
                select.appendChild(option);
            });
            select.value = currentConfigId;
        }

        function handleConfigChange() {
            currentConfigId = document.getElementById('configSelect').value;
            localStorage.setItem('current_api_config_id', currentConfigId);
            applyConfigToForm(currentConfigId);
        }

        function applyConfigToForm(id) {
            const config = apiConfigs.find(c => c.id === id);
            if (config) {
                document.getElementById('configNameInput').value = config.name || '';
                document.getElementById('apiUrlInput').value = config.url || '';
                document.getElementById('apiKeyInput').value = config.key || '';
                document.getElementById('tempSlider').value = config.temp || '1.0';
                document.getElementById('tempValue').textContent = config.temp || '1.0';
                const modelSelect = document.getElementById('modelSelect');
                if (config.model) {
                    modelSelect.innerHTML = `<option value="${config.model}">${config.model}</option>`;
                    modelSelect.value = config.model;
                } else modelSelect.innerHTML = '<option value="">请选择模型</option>';
            }
        }

        async function deleteConfig() {
            if (currentConfigId === 'default') { alert('默认配置不能删除'); return; }
            if (confirm('确定要删除当前配置吗？')) {
                try {
                    await dbDelete('api_configs', currentConfigId);
                    apiConfigs = apiConfigs.filter(c => c.id !== currentConfigId);
                    currentConfigId = apiConfigs[0].id;
                    localStorage.setItem('current_api_config_id', currentConfigId);
                    renderConfigDropdown();
                    applyConfigToForm(currentConfigId);
                } catch (e) { console.error("Failed to delete config:", e); }
            }
        }

        function updateTempValue(val) { document.getElementById('tempValue').textContent = val; }

        (function() {
            const originalAlert = window.alert;
            window.alert = function(text) {
                const modal = document.getElementById('mimiAlertModal');
                const textEl = document.getElementById('mimiAlertText');
                if (modal && textEl) {
                    textEl.textContent = text;
                    modal.classList.add('active');
                } else originalAlert(text);
            };
        })();

        function closeMimiAlert() {
            document.getElementById('mimiAlertModal').classList.remove('active');
            if (localStorage.getItem('mimi_fullscreen_pref') === 'true' && !document.fullscreenElement) enterFullscreen();
        }

        function prepareNewConfig() {
            document.getElementById('configNameInput').value = '';
            document.getElementById('apiUrlInput').value = '';
            document.getElementById('apiKeyInput').value = '';
            document.getElementById('modelSelect').innerHTML = '<option value="">请选择模型</option>';
            document.getElementById('tempSlider').value = '1.0';
            document.getElementById('tempValue').textContent = '1.0';
            document.getElementById('configNameInput').focus();
            currentConfigId = ''; 
            document.getElementById('configSelect').value = '';
        }

        async function searchModels() {
            let url = document.getElementById('apiUrlInput').value.trim();
            const key = document.getElementById('apiKeyInput').value.trim();
            if (!url) { alert('请先输入接口地址'); return; }
            const btn = document.querySelector('.search-model-btn');
            btn.textContent = '获取中...';
            btn.disabled = true;
            try {
                let baseUrl = url.replace(/\/chat\/completions\/?$/, '');
                let modelsUrl = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
                if (baseUrl.includes('openai.azure.com')) { alert('Azure OpenAI 暂不支持自动搜索模型'); return; }
                const response = await fetch(modelsUrl, { method: 'GET', headers: { 'Authorization': `Bearer ${key}` } });
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                const select = document.getElementById('modelSelect');
                select.innerHTML = '<option value="">请选择模型</option>';
                if (data.data && Array.isArray(data.data)) {
                    data.data.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m.id; opt.textContent = m.id; select.appendChild(opt);
                    });
                    alert('模型获取成功');
                } else throw new Error('Unexpected data format');
            } catch (e) {
                const manualModel = prompt('自动获取失败，请手动输入模型名称:');
                if (manualModel) {
                    const select = document.getElementById('modelSelect');
                    select.innerHTML = `<option value="${manualModel}">${manualModel}</option>`;
                    select.value = manualModel;
                }
            } finally {
                btn.textContent = '搜索模型'; btn.disabled = false;
            }
        }

        async function saveCurrentApiConfig() {
            const nameInput = document.getElementById('configNameInput').value.trim();
            if (!nameInput) { alert('请输入配置名称'); return; }
            const saveBtn = document.querySelector('.theme-action-btn[onclick="saveCurrentApiConfig()"]');
            if (saveBtn) saveBtn.style.opacity = '0.5';
            const url = document.getElementById('apiUrlInput').value;
            const key = document.getElementById('apiKeyInput').value;
            const model = document.getElementById('modelSelect').value;
            const temp = document.getElementById('tempSlider').value;
            try {
                let configToSave = apiConfigs.find(c => c.name === nameInput);
                if (configToSave) {
                    configToSave.url = url; configToSave.key = key; configToSave.model = model; configToSave.temp = temp;
                    await dbPut('api_configs', configToSave);
                    currentConfigId = configToSave.id;
                } else if (currentConfigId && currentConfigId !== '' && currentConfigId !== 'default') {
                    const currentConfig = apiConfigs.find(c => c.id === currentConfigId);
                    if (currentConfig) {
                        currentConfig.name = nameInput; currentConfig.url = url; currentConfig.key = key; currentConfig.model = model; currentConfig.temp = temp;
                        await dbPut('api_configs', currentConfig);
                    }
                } else {
                    const newId = Date.now().toString();
                    const newConfig = { id: newId, name: nameInput, url, key, model, temp };
                    await dbPut('api_configs', newConfig);
                    apiConfigs.push(newConfig);
                    currentConfigId = newId;
                }
                safeLocalStorageSet('current_api_config_id', currentConfigId, true);
                apiConfigs = await dbGetAll('api_configs');
                renderConfigDropdown();
                alert('API配置已保存');
            } catch (e) { alert('保存失败: ' + e.message); } finally { if (saveBtn) saveBtn.style.opacity = '1'; }
        }



        // 点击模态框外部关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal();
                    closeWechatModal();
                }
            });
        });

        // 点击页面其他地方关闭微信添加菜单
        document.addEventListener('click', function(e) {
            const menu = document.getElementById('addMenu');
            const addBtn = document.querySelector('.wechat-nav-right');
            if (menu && !menu.contains(e.target) && addBtn && !addBtn.contains(e.target)) {
                menu.classList.remove('active');
            }
        });

        // 自定义分类管理
        let customCategories = [];

        // 从本地存储加载自定义分类
        function loadCustomCategories() {
            const saved = localStorage.getItem('customCategories');
            if (saved) {
                customCategories = JSON.parse(saved);
                updateCategoryDropdown();
            }
        }

        // 保存自定义分类到本地存储
        function saveCustomCategories() {
            localStorage.setItem('customCategories', JSON.stringify(customCategories));
        }

        // 更新分类下拉框
        function updateCategoryDropdown() {
            const select = document.getElementById('newContactCategory');
            const currentValue = select.value;
            
            // 保留默认选项
            const defaultOptions = ['朋友', '恋人', '同事', '其他'];
            
            // 清空并重建选项
            select.innerHTML = '';
            
            // 添加默认选项
            defaultOptions.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                select.appendChild(opt);
            });
            
            // 添加自定义分类
            customCategories.forEach(category => {
                const opt = document.createElement('option');
                opt.value = category;
                opt.textContent = category;
                select.appendChild(opt);
            });
            
            // 添加"添加新分类"选项
            const addOpt = document.createElement('option');
            addOpt.value = '__custom__';
            addOpt.textContent = '+ 添加新分类';
            select.appendChild(addOpt);
            
            // 恢复之前的选择（如果有效）
            if (currentValue && currentValue !== '__custom__') {
                select.value = currentValue;
            }
        }

        // 处理分类下拉框变化
        function handleCategoryChange() {
            const select = document.getElementById('newContactCategory');
            const customInput = document.getElementById('customCategoryInput');
            
            if (select.value === '__custom__') {
                customInput.style.display = 'block';
                document.getElementById('customCategoryName').focus();
            } else {
                customInput.style.display = 'none';
                document.getElementById('customCategoryName').value = '';
            }
        }

        // 添加自定义分类
        function addCustomCategory() {
            const input = document.getElementById('customCategoryName');
            const categoryName = input.value.trim();
            
            if (!categoryName) {
                alert('请输入分类名称');
                return;
            }
            
            // 检查是否与默认分类重复
            const defaultCategories = ['朋友', '恋人', '同事', '其他'];
            if (defaultCategories.includes(categoryName)) {
                alert('该分类已存在，请使用其他名称');
                return;
            }
            
            // 检查是否与已有自定义分类重复
            if (customCategories.includes(categoryName)) {
                alert('该分类已存在，请使用其他名称');
                return;
            }
            
            // 添加新分类
            customCategories.push(categoryName);
            saveCustomCategories();
            updateCategoryDropdown();
            
            // 选中新添加的分类
            const select = document.getElementById('newContactCategory');
            select.value = categoryName;
            
            // 隐藏输入框
            document.getElementById('customCategoryInput').style.display = 'none';
            input.value = '';
        }

        // 取消添加自定义分类
        function cancelCustomCategory() {
            const select = document.getElementById('newContactCategory');
            const customInput = document.getElementById('customCategoryInput');
            
            // 重置为第一个选项
            select.selectedIndex = 0;
            
            // 隐藏输入框并清空
            customInput.style.display = 'none';
            document.getElementById('customCategoryName').value = '';
        }

        // 支持回车键添加分类
        document.addEventListener('DOMContentLoaded', function() {
            const customCategoryInput = document.getElementById('customCategoryName');
            if (customCategoryInput) {
                customCategoryInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomCategory();
                    }
                });
            }
        });

        // 主题页面相关函数
        function openThemePage() {
            showContainer('themeContainer');
            showThemeMainMenu();
            updateTime();
            updateBattery();
            saveUIState();
        }

        function closeThemePage() {
            showContainer('phone-container');
            saveUIState();
        }

        function showThemeMainMenu() {
            document.getElementById('themeMainMenu').style.display = 'flex';
            document.getElementById('wallpaperPage').style.display = 'none';
            document.getElementById('iconPage').style.display = 'none';
            document.getElementById('icon2Page').style.display = 'none';
            document.getElementById('fontPage').style.display = 'none';
            document.querySelector('#themeContainer .theme-title').textContent = '主题设置';
            document.querySelector('#themeContainer .theme-back').onclick = closeThemePage;
            saveUIState();
        }

        function openWallpaperPage() {
            document.getElementById('themeMainMenu').style.display = 'none';
            document.getElementById('wallpaperPage').style.display = 'flex';
            document.querySelector('#themeContainer .theme-title').textContent = '壁纸设置';
            document.querySelector('#themeContainer .theme-back').onclick = showThemeMainMenu;
            renderWallpaperGrid();
            saveUIState();
        }

        function openIconPage() {
            document.getElementById('themeMainMenu').style.display = 'none';
            document.getElementById('iconPage').style.display = 'flex';
            document.querySelector('#themeContainer .theme-title').textContent = '图标设置';
            document.querySelector('#themeContainer .theme-back').onclick = showThemeMainMenu;
            renderIconList();
            saveUIState();
        }

        function openIcon2Page() {
            document.getElementById('themeMainMenu').style.display = 'none';
            document.getElementById('icon2Page').style.display = 'flex';
            document.querySelector('#themeContainer .theme-title').textContent = '图标2设置';
            document.querySelector('#themeContainer .theme-back').onclick = showThemeMainMenu;
            renderIcon2List();
            saveUIState();
        }

        function openFontPage() {
            document.getElementById('themeMainMenu').style.display = 'none';
            document.getElementById('fontPage').style.display = 'flex';
            document.querySelector('#themeContainer .theme-title').textContent = '字体设置';
            document.querySelector('#themeContainer .theme-back').onclick = showThemeMainMenu;
            renderFontGrid();
            saveUIState();
        }

        function renderIconList() {
            const list = document.getElementById('iconList');
            list.innerHTML = '';
            
            iconConfig.forEach(icon => {
                const currentSrc = document.getElementById(icon.id).src;
                
                const item = document.createElement('div');
                item.className = 'icon-setting-item';
                item.onclick = () => changeImage(icon.id);
                
                item.innerHTML = `
                    <div class="icon-setting-info">
                        <img src="${currentSrc}" class="icon-preview" alt="${icon.name}">
                        <span class="icon-name">${icon.name}</span>
                    </div>
                    <span class="icon-arrow">〉</span>
                `;
                
                list.appendChild(item);
            });
        }

        function renderIcon2List() {
            const list = document.getElementById('icon2List');
            list.innerHTML = '';
            
            btnIconConfig.forEach(icon => {
                const el = document.getElementById(icon.id);
                const currentContent = el.innerHTML;
                
                const item = document.createElement('div');
                item.className = 'icon-setting-item';
                item.onclick = () => changeButtonIcon(icon.id);
                
                item.innerHTML = `
                    <div class="icon-setting-info">
                        <div class="theme-menu-icon" style="width: 40px; height: 40px; margin-right: 15px; background: #f0f0f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; overflow: hidden;">${currentContent}</div>
                        <span class="icon-name">${icon.name}</span>
                    </div>
                    <span class="icon-arrow">〉</span>
                `;
                
                list.appendChild(item);
            });
        }

        function changeButtonIcon(id) {
            currentImageId = id;
            document.getElementById('urlInputContainer').style.display = 'none';
            document.getElementById('modalMainButtons').style.display = 'flex';
            document.getElementById('imageModal').classList.add('active');
        }

        async function saveButtonIcon(id, content) {
            try {
                await dbPut("button_icons", { id: id, content: content });
            } catch (e) {
                console.error("Failed to save button icon:", e);
                alert("保存图标失败");
            }
        }

        async function resetButtonIcons(silent = false) {
            if (silent || confirm('确定要重置所有按钮图标为默认吗？')) {
                try {
                    await dbClear('button_icons');
                    btnIconConfig.forEach(icon => {
                        const el = document.getElementById(icon.id);
                        if (el) el.textContent = icon.default;
                    });
                    if (document.getElementById('icon2Page').style.display === 'flex') {
                        renderIcon2List();
                    }
                } catch (e) {
                    console.error("Failed to reset button icons:", e);
                }
            }
        }

        async function resetIcons(silent = false) {
            if (silent || confirm('确定要重置所有图标为默认吗？')) {
                try {
                    await dbClear('icons');
                    iconConfig.forEach(icon => {
                        const el = document.getElementById(icon.id);
                        if (el) el.src = icon.default || '';
                    });
                    if (document.getElementById('themeContainer').style.display === 'flex') {
                        renderIconList();
                    }
                } catch (e) {
                    console.error("Failed to reset icons:", e);
                }
            }
        }


        // 壁纸管理
        let wallpapers = []; // 存储对象 {id, src}
        let currentWallpaper = '';

        async function loadWallpapers() {
            try {
                wallpapers = await dbGetAll('wallpapers');
                const current = await dbGet('settings', 'currentWallpaper');
                if (current) {
                    currentWallpaper = current.value;
                    applyWallpaper(currentWallpaper);
                }
            } catch (e) {
                console.error("Failed to load wallpapers:", e);
            }
        }

        function handleWallpaperFile(event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    addWallpaper(e.target.result);
                };
                reader.readAsDataURL(file);
            }
            event.target.value = ''; // 重置input
        }

        function showWallpaperUrlInput() {
            const url = prompt('请输入图片URL链接:');
            if (url && url.trim()) {
                addWallpaper(url.trim());
            }
        }

        async function addWallpaper(src) {
            // 检查是否已存在
            if (wallpapers.some(w => w.src === src)) {
                alert('该壁纸已存在');
                return;
            }
            
            try {
                const id = await dbPut('wallpapers', { src: src });
                wallpapers.push({ id: id, src: src });
                renderWallpaperGrid();
                // 自动应用新壁纸
                setWallpaper(src);
            } catch (e) {
                console.error("Failed to add wallpaper:", e);
                alert('保存壁纸失败');
            }
        }

        async function setWallpaper(src) {
            currentWallpaper = src;
            try {
                await dbPut('settings', { key: 'currentWallpaper', value: src });
                applyWallpaper(src);
                renderWallpaperGrid();
            } catch (e) {
                console.error("Failed to set wallpaper:", e);
            }
        }

        function applyWallpaper(src) {
            const container = document.querySelector('.phone-container');
            if (src) {
                container.style.backgroundImage = `url('${src}')`;
            } else {
                container.style.backgroundImage = 'none';
            }
        }

        async function restoreDefaultWallpaper() {
            currentWallpaper = '';
            try {
                await dbDelete('settings', 'currentWallpaper');
                applyWallpaper('');
                renderWallpaperGrid();
            } catch (e) {
                console.error("Failed to restore default wallpaper:", e);
            }
        }

        async function deleteWallpaper(id) {
            if (confirm('确定要删除这张壁纸吗？')) {
                try {
                    const wallpaper = wallpapers.find(w => w.id === id);
                    if (!wallpaper) return;

                    await dbDelete('wallpapers', id);
                    wallpapers = wallpapers.filter(w => w.id !== id);
                    
                    // 如果删除的是当前壁纸，恢复默认
                    if (currentWallpaper === wallpaper.src) {
                        restoreDefaultWallpaper();
                    } else {
                        renderWallpaperGrid();
                    }
                } catch (e) {
                    console.error("Failed to delete wallpaper:", e);
                    alert("删除失败");
                }
            }
        }

        function renderWallpaperGrid() {
            const grid = document.getElementById('wallpaperGrid');
            grid.innerHTML = '';

            // 默认壁纸选项
            const defaultItem = document.createElement('div');
            defaultItem.className = `wallpaper-item ${!currentWallpaper ? 'active' : ''}`;
            defaultItem.onclick = restoreDefaultWallpaper;
            defaultItem.innerHTML = `
                <div style="width: 100%; height: 100%; background: #fff; display: flex; align-items: center; justify-content: center; color: #333; font-size: 12px; flex-direction: column; gap: 5px;">
                    <div style="font-size: 20px;">↺</div>
                    <div>恢复默认</div>
                </div>
            `;
            grid.appendChild(defaultItem);

            // 用户壁纸
            wallpapers.forEach(wallpaper => {
                const item = document.createElement('div');
                item.className = `wallpaper-item ${currentWallpaper === wallpaper.src ? 'active' : ''}`;
                
                // 长按删除逻辑
                let pressTimer;
                let isLongPress = false;
                
                const startPress = (e) => {
                    isLongPress = false;
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        deleteWallpaper(wallpaper.id);
                    }, 800); // 800ms长按
                };
                
                const cancelPress = () => {
                    clearTimeout(pressTimer);
                };

                // 触摸事件
                item.addEventListener('touchstart', startPress);
                item.addEventListener('touchend', cancelPress);
                item.addEventListener('touchmove', cancelPress);
                
                // 鼠标事件（用于PC调试）
                item.addEventListener('mousedown', startPress);
                item.addEventListener('mouseup', cancelPress);
                item.addEventListener('mouseleave', cancelPress);

                // 点击应用
                item.onclick = (e) => {
                    if (isLongPress) return;
                    setWallpaper(wallpaper.src);
                };

                item.innerHTML = `<img src="${wallpaper.src}" class="wallpaper-thumb" loading="lazy">`;
                grid.appendChild(item);
            });
        }

        // 字体管理
        let customFonts = [];
        let currentFont = null;

        async function loadFonts() {
            try {
                customFonts = await dbGetAll('fonts');
                // 重新加载所有字体
                for (const font of customFonts) {
                    loadFontFace(font.name, font.source);
                }

                const current = await dbGet('settings', 'currentFont');
                if (current) {
                    currentFont = current.value;
                    // 确保当前字体已加载
                    const fontData = customFonts.find(f => f.name === currentFont);
                    if (fontData) {
                        document.body.style.fontFamily = `"${currentFont}", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
                    }
                }
            } catch (e) {
                console.error('Failed to load fonts', e);
            }
        }

        async function loadFontFace(name, source) {
            try {
                const font = new FontFace(name, `url("${source}")`);
                await font.load();
                document.fonts.add(font);
                return true;
            } catch (e) {
                console.error(`Failed to load font ${name}:`, e);
                return false;
            }
        }

        function handleFontFile(event) {
            const file = event.target.files[0];
            if (file) {
                // 检查文件大小，限制为 20MB (IndexedDB 可以支持更大)
                if (file.size > 20 * 1024 * 1024) {
                    alert('字体文件过大，请选择小于 20MB 的文件');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    const name = `CustomFont_${Date.now()}`;
                    addFont(name, e.target.result, file.name);
                };
                reader.readAsDataURL(file);
            }
            event.target.value = '';
        }

        function showFontUrlInput() {
            const url = prompt('请输入字体文件URL链接 (.ttf, .otf, .woff):');
            if (url && url.trim()) {
                const name = `CustomFont_${Date.now()}`;
                addFont(name, url.trim(), '网络字体');
            }
        }

        async function addFont(name, source, displayName) {
            // 尝试加载字体以验证
            const success = await loadFontFace(name, source);
            if (!success) {
                alert('无法加载该字体，请检查文件格式或链接是否有效。');
                return;
            }

            const newFont = {
                name: name,
                source: source,
                displayName: displayName || '未知字体'
            };

            try {
                await dbPut('fonts', newFont);
                customFonts.push(newFont);
                renderFontGrid();
                // 自动应用
                applyFont(name);
            } catch (e) {
                console.error("Failed to save font:", e);
                alert('保存字体失败');
            }
        }

        async function applyFont(name) {
            currentFont = name;
            try {
                await dbPut('settings', { key: 'currentFont', value: name });
                
                if (name) {
                    document.body.style.fontFamily = `"${name}", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
                } else {
                    document.body.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
                }
                
                renderFontGrid();
            } catch (e) {
                console.error("Failed to apply font:", e);
            }
        }

        async function restoreDefaultFont() {
            currentFont = null;
            try {
                await dbDelete('settings', 'currentFont');
                document.body.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
                renderFontGrid();
            } catch (e) {
                console.error("Failed to restore default font:", e);
            }
        }

        async function deleteFont(name) {
            if (confirm('确定要删除这个字体吗？')) {
                try {
                    await dbDelete('fonts', name);
                    customFonts = customFonts.filter(f => f.name !== name);
                    
                    if (currentFont === name) {
                        restoreDefaultFont();
                    } else {
                        renderFontGrid();
                    }
                } catch (e) {
                    console.error("Failed to delete font:", e);
                    alert("删除字体失败");
                }
            }
        }

        function renderFontGrid() {
            const grid = document.getElementById('fontGrid');
            grid.innerHTML = '';

            // 默认字体
            const defaultItem = document.createElement('div');
            defaultItem.className = `font-item ${!currentFont ? 'active' : ''}`;
            defaultItem.onclick = restoreDefaultFont;
            defaultItem.innerHTML = `
                <div class="font-preview-text" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Aa</div>
                <div class="font-name">默认字体</div>
            `;
            grid.appendChild(defaultItem);

            // 自定义字体
            customFonts.forEach(font => {
                const item = document.createElement('div');
                item.className = `font-item ${currentFont === font.name ? 'active' : ''}`;
                
                // 长按删除逻辑
                let pressTimer;
                let isLongPress = false;
                
                const startPress = (e) => {
                    isLongPress = false;
                    item.classList.add('deleting');
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        deleteFont(font.name);
                        item.classList.remove('deleting');
                    }, 800);
                };
                
                const cancelPress = () => {
                    clearTimeout(pressTimer);
                    item.classList.remove('deleting');
                };

                item.addEventListener('touchstart', startPress);
                item.addEventListener('touchend', cancelPress);
                item.addEventListener('touchmove', cancelPress);
                item.addEventListener('mousedown', startPress);
                item.addEventListener('mouseup', cancelPress);
                item.addEventListener('mouseleave', cancelPress);

                item.onclick = () => {
                    if (!isLongPress) {
                        applyFont(font.name);
                    }
                };

                item.innerHTML = `
                    <div class="font-preview-text" style="font-family: '${font.name}';">Aa</div>
                    <div class="font-name">${font.displayName}</div>
                    <div class="font-delete-hint">松手删除</div>
                `;
                grid.appendChild(item);
            });
        }

        // 主题功能实现
        let savedThemes = [];
        let currentThemeId = 'default';

        // 加载保存的主题
        async function loadThemes() {
            try {
                savedThemes = await dbGetAll('themes');
                const current = await dbGet('settings', 'currentThemeId');
                if (current) {
                    currentThemeId = current.value;
                }
                renderThemeList();
            } catch (e) {
                console.error("Failed to load themes:", e);
            }
        }

        // 保存当前主题
        async function saveCurrentTheme() {
            // 1. 切换到首页进行截图
            const mineContainer = document.getElementById('mineContainer');
            const phoneContainer = document.querySelector('.phone-container');
            
            // 隐藏当前页面，显示首页
            mineContainer.style.display = 'none';
            phoneContainer.style.display = 'flex';
            
            // 等待渲染
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                // 2. 截图
                const canvas = await html2canvas(phoneContainer, {
                    useCORS: true,
                    logging: false,
                    scale: 0.5 // 降低分辨率以节省存储空间
                });
                const screenshot = canvas.toDataURL('image/jpeg', 0.7);

                // 3. 切回我的页
                phoneContainer.style.display = 'none';
                mineContainer.style.display = 'flex';

                // 4. 输入名字
                const name = prompt('请输入主题名称:', `主题 ${savedThemes.length + 1}`);
                if (!name) return;

                // 5. 收集当前配置
                // 获取当前图标配置
                const icons = {};
                const iconList = await dbGetAll('icons');
                iconList.forEach(icon => {
                    icons[icon.id] = icon.src;
                });

                // 获取当前文案
                const textElements = document.querySelectorAll('[id^="txt-"]');
                const textData = {};
                textElements.forEach(el => {
                    textData[el.id] = el.textContent;
                });

                const theme = {
                    id: Date.now().toString(),
                    name: name,
                    screenshot: screenshot,
                    config: {
                        wallpaper: currentWallpaper || '',
                        icons: icons,
                        font: currentFont || '',
                        textContent: textData
                    }
                };

                // 6. 保存
                await dbPut('themes', theme);
                savedThemes.push(theme);
                
                currentThemeId = theme.id;
                await dbPut('settings', { key: 'currentThemeId', value: currentThemeId });
                
                renderThemeList();
                alert('主题保存成功！');

            } catch (error) {
                console.error('保存主题失败:', error);
                phoneContainer.style.display = 'none';
                mineContainer.style.display = 'flex';
                alert('保存失败，无法生成预览图');
            }
        }

        // 渲染主题列表
        function renderThemeList() {
            const list = document.getElementById('themeList');
            list.innerHTML = '';

            // 默认主题
            const defaultCard = document.createElement('div');
            defaultCard.className = `theme-card ${currentThemeId === 'default' ? 'active' : ''}`;
            defaultCard.onclick = () => applyTheme('default');
            defaultCard.innerHTML = `
                <div class="theme-preview" style="background: #fff; display: flex; align-items: center; justify-content: center; color: #333; font-size: 12px; flex-direction: column; gap: 5px;">
                    <div style="font-size: 24px;">↺</div>
                </div>
                <div class="theme-info">
                    <div class="theme-name">默认主题</div>
                </div>
            `;
            list.appendChild(defaultCard);

            // 用户主题
            savedThemes.forEach(theme => {
                const card = document.createElement('div');
                card.className = `theme-card ${currentThemeId === theme.id ? 'active' : ''}`;
                
                // 长按删除
                let pressTimer;
                let isLongPress = false;
                
                const startPress = (e) => {
                    isLongPress = false;
                    card.classList.add('deleting');
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        deleteTheme(theme.id);
                        card.classList.remove('deleting');
                    }, 800);
                };
                
                const cancelPress = () => {
                    clearTimeout(pressTimer);
                    card.classList.remove('deleting');
                };

                card.addEventListener('touchstart', startPress);
                card.addEventListener('touchend', cancelPress);
                card.addEventListener('touchmove', cancelPress);
                card.addEventListener('mousedown', startPress);
                card.addEventListener('mouseup', cancelPress);
                card.addEventListener('mouseleave', cancelPress);

                card.onclick = () => {
                    if (!isLongPress) {
                        applyTheme(theme.id);
                    }
                };

                card.innerHTML = `
                    <img src="${theme.screenshot}" class="theme-preview" alt="${theme.name}">
                    <div class="theme-info">
                        <div class="theme-name">${theme.name}</div>
                    </div>
                    <div class="theme-delete-hint">松手删除</div>
                `;
                list.appendChild(card);
            });
        }

        // 应用主题
        async function applyTheme(themeId) {
            try {
                if (themeId === 'default') {
                    // 恢复默认
                    currentThemeId = 'default';
                    await dbPut('settings', { key: 'currentThemeId', value: 'default' });
                    
                    // 清除壁纸
                    await restoreDefaultWallpaper();
                    
                    // 清除图标
                    await resetIcons(true);
                    
                    // 清除字体
                    await restoreDefaultFont();
                    
                } else {
                    const theme = savedThemes.find(t => t.id === themeId);
                    if (!theme) return;

                    currentThemeId = themeId;
                    await dbPut('settings', { key: 'currentThemeId', value: themeId });

                    // 应用壁纸
                    if (theme.config.wallpaper) {
                        await setWallpaper(theme.config.wallpaper);
                    } else {
                        await restoreDefaultWallpaper();
                    }

                    // 应用图标
                    await dbClear('icons');
                    const iconPromises = Object.keys(theme.config.icons).map(id => {
                        return dbPut('icons', { id: id, src: theme.config.icons[id] });
                    });
                    await Promise.all(iconPromises);
                    
                    // 刷新图标显示
                    Object.keys(theme.config.icons).forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.src = theme.config.icons[id];
                    });

                    // 应用字体
                    if (theme.config.font) {
                        await applyFont(theme.config.font);
                    } else {
                        await restoreDefaultFont();
                    }

                    // 应用文案
                    if (theme.config.textContent) {
                        for (const id in theme.config.textContent) {
                            const el = document.getElementById(id);
                            if (el) el.textContent = theme.config.textContent[id];
                        }
                        saveTextContent();
                    }
                }

                renderThemeList();
                
                // 刷新其他页面的状态
                renderWallpaperGrid();
                renderIconList();
                renderFontGrid();
            } catch (e) {
                console.error("Failed to apply theme:", e);
                alert("应用主题失败");
            }
        }

        // 删除主题
        async function deleteTheme(themeId) {
            if (confirm('确定要删除这个主题吗？')) {
                try {
                    await dbDelete('themes', themeId);
                    savedThemes = savedThemes.filter(t => t.id !== themeId);
                    
                    if (currentThemeId === themeId) {
                        await applyTheme('default');
                    } else {
                        renderThemeList();
                    }
                } catch (e) {
                    console.error("Failed to delete theme:", e);
                    alert("删除主题失败");
                }
            }
        }

        // 导出主题
        function exportThemes() {
            if (savedThemes.length === 0) {
                alert('没有可导出的主题');
                return;
            }
            downloadData(savedThemes, `MimiPhone_Themes_${new Date().toISOString().slice(0,10)}.json`);
        }

        // 导入主题
        function importThemes(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const themes = JSON.parse(e.target.result);
                    if (!Array.isArray(themes)) {
                        throw new Error('格式错误');
                    }
                    
                    // 简单的验证
                    const validThemes = themes.filter(t => t.id && t.name && t.config);
                    
                    if (validThemes.length === 0) {
                        alert('未找到有效的主题数据');
                        return;
                    }

                    // 合并主题（避免ID冲突）
                    let addedCount = 0;
                    for (const newTheme of validThemes) {
                        // 重新生成ID以防冲突
                        newTheme.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
                        await dbPut('themes', newTheme);
                        savedThemes.push(newTheme);
                        addedCount++;
                    }

                    renderThemeList();
                    alert(`成功导入 ${addedCount} 个主题`);

                } catch (error) {
                    console.error(error);
                    alert('导入失败：文件格式不正确');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        // 我的页面相关函数
        function openMinePage() {
            showContainer('mineContainer');
            document.querySelector('#mineContainer .theme-title').textContent = '我的主题';
            updateTime();
            updateBattery();
            renderThemeList();
            saveUIState();
        }

        function closeMinePage() {
            showContainer('themeContainer');
            showThemeMainMenu();
            saveUIState();
        }

        // IndexedDB 封装
        const DB_NAME = 'MimiPhoneDB';
        const DB_VERSION = 4; // 提升版本号以支持大数据量存储
        let db;

        const dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // 创建存储对象
                if (!db.objectStoreNames.contains('wallpapers')) {
                    db.createObjectStore('wallpapers', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('icons')) {
                    db.createObjectStore('icons', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('button_icons')) {
                    db.createObjectStore('button_icons', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('fonts')) {
                    db.createObjectStore('fonts', { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains('themes')) {
                    db.createObjectStore('themes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('api_configs')) {
                    db.createObjectStore('api_configs', { keyPath: 'id' });
                }
            };
        });

        // DB 辅助函数
        async function dbGet(storeName, key) {
            await dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async function dbGetAll(storeName) {
            await dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async function dbPut(storeName, value) {
            await dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(value);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async function dbDelete(storeName, key) {
            await dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        async function dbClear(storeName) {
            await dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }





        // 保存UI状态
        function saveUIState() {
            const state = {
                activeContainer: '',
                themePage: '',
                activeChatId: currentChatFriendId,
                activeBookId: currentEditingBookId,
                activeItemId: currentEditingItemId
            };
            
            if (document.getElementById('worldBookContainer').style.display === 'flex') state.activeContainer = 'worldBookContainer';
            else if (document.getElementById('worldBookEditPage').style.display === 'flex') state.activeContainer = 'worldBookEditPage';
            else if (document.getElementById('bookItemEditPage').style.display === 'flex') state.activeContainer = 'bookItemEditPage';
            else if (document.getElementById('realNameContainer') && document.getElementById('realNameContainer').style.display === 'flex') state.activeContainer = 'realNameContainer';
            else if (document.getElementById('servicePageContainer').style.display === 'flex') state.activeContainer = 'servicePageContainer';
            else if (document.getElementById('stickerManagementContainer').style.display === 'flex') state.activeContainer = 'stickerManagementContainer';
            else if (document.getElementById('stickerLibraryContainer').style.display === 'flex') state.activeContainer = 'stickerLibraryContainer';
            else if (document.getElementById('batterySettingsContainer').style.display === 'flex') state.activeContainer = 'batterySettingsContainer';
            else if (document.getElementById('wechatFavoritesContainer').style.display === 'flex') state.activeContainer = 'wechatFavoritesContainer';
            else if (document.getElementById('contactDetailPage').style.display === 'flex') state.activeContainer = 'contactDetailPage';
            else if (document.getElementById('chatPageContainer').style.display === 'flex') state.activeContainer = 'chatPageContainer';
            else if (document.getElementById('categoryManagementContainer').style.display === 'flex') state.activeContainer = 'categoryManagementContainer';
            else if (document.getElementById('personalInfoContainer').style.display === 'flex') state.activeContainer = 'personalInfoContainer';
            else if (document.getElementById('wechatDisplaySettingsContainer').style.display === 'flex') state.activeContainer = 'wechatDisplaySettingsContainer';
            else if (document.getElementById('wechatStorageContainer').style.display === 'flex') state.activeContainer = 'wechatStorageContainer';
            else if (document.getElementById('wechatSettingsContainer').style.display === 'flex') state.activeContainer = 'wechatSettingsContainer';
            else if (document.getElementById('wechatAccountSwitchContainer').style.display === 'flex') state.activeContainer = 'wechatAccountSwitchContainer';
            else if (document.getElementById('wechatContainer').style.display === 'block') state.activeContainer = 'wechatContainer';
            else if (document.getElementById('contactsContainer').style.display !== 'none') state.activeContainer = 'contactsContainer';
            else if (document.getElementById('addContactContainer').style.display !== 'none') state.activeContainer = 'addContactContainer';
            else if (document.getElementById('settingsContainer').style.display === 'flex') state.activeContainer = 'settingsContainer';
            else if (document.getElementById('accountContainer').style.display === 'flex') state.activeContainer = 'accountContainer';
            else if (document.getElementById('accountInfoContainer').style.display === 'flex') state.activeContainer = 'accountInfoContainer';
            else if (document.getElementById('apiConfigContainer').style.display === 'flex') state.activeContainer = 'apiConfigContainer';
            else if (document.getElementById('mineContainer').style.display === 'flex') state.activeContainer = 'mineContainer';
            else if (document.getElementById('themeContainer').style.display === 'flex') {
                state.activeContainer = 'themeContainer';
                if (document.getElementById('wallpaperPage').style.display === 'flex') state.themePage = 'wallpaperPage';
                else if (document.getElementById('iconPage').style.display === 'flex') state.themePage = 'iconPage';
                else if (document.getElementById('icon2Page').style.display === 'flex') state.themePage = 'icon2Page';
                else if (document.getElementById('fontPage').style.display === 'flex') state.themePage = 'fontPage';
                else state.themePage = 'themeMainMenu';
            }
            else state.activeContainer = 'phone-container';
            
            sessionStorage.setItem('mimi_ui_state', JSON.stringify(state));
        }

        // 加载UI状态
        function loadUIState() {
            const saved = sessionStorage.getItem('mimi_ui_state');
            if (!saved) return;
            const state = JSON.parse(saved);

            if (state.activeContainer === 'worldBookContainer') openWorldBook();
            else if (state.activeContainer === 'worldBookEditPage') {
                openWorldBook();
                if (state.activeBookId) openWorldBookEdit(state.activeBookId);
            }
            else if (state.activeContainer === 'bookItemEditPage') {
                openWorldBook();
                if (state.activeBookId) {
                    openWorldBookEdit(state.activeBookId);
                    if (state.activeItemId) openBookItemEdit(state.activeItemId);
                }
            }
            else if (state.activeContainer === 'stickerManagementContainer') {
                openWechat();
                switchWechatTab('me', document.querySelector('.wechat-nav-item:last-child'));
                openStickerLibrary();
                openStickerManagement();
            }
            else if (state.activeContainer === 'batterySettingsContainer') {
                openSettings();
                openDisplaySettings();
                openBatterySettings();
            }
            else if (state.activeContainer === 'stickerLibraryContainer') {
                openWechat();
                switchWechatTab('me', document.querySelector('.wechat-nav-item:last-child'));
                openStickerLibrary();
            }
            else if (state.activeContainer === 'wechatFavoritesContainer') {
                openWechat();
                switchWechatTab('me', document.querySelector('.wechat-nav-item:last-child'));
                openWechatFavorites();
            }
            else if (state.activeContainer === 'contactDetailPage' && state.activeChatId) {
                openWechat();
                openContactDetail(state.activeChatId);
            }
            else if (state.activeContainer === 'chatPageContainer') {
                openWechat();
                openChat(state.activeChatId);
            }
            else if (state.activeContainer === 'chatInfoContainer') {
                openWechat();
                openChat(state.activeChatId);
                openChatInfo();
            }
            else if (state.activeContainer === 'categoryManagementContainer') {
                openWechat();
                switchWechatTab('me', document.querySelector('.wechat-nav-item:last-child'));
                openWechatSettings();
                openCategoryManagement();
            }
            else if (state.activeContainer === 'chatPageContainer' && state.activeChatId) {
                openWechat();
                openChat(state.activeChatId);
            }
            else if (state.activeContainer === 'personalInfoContainer') {
                openWechat();
                switchWechatTab('me', document.querySelector('.wechat-nav-item:last-child'));
                openPersonalInfo();
            }
            else if (state.activeContainer === 'servicePageContainer') {
                openWechat();
                switchWechatTab('me', document.querySelector('.wechat-nav-item:last-child'));
                openServicePage();
            }
            else if (state.activeContainer === 'wechatDisplaySettingsContainer') {
                openWechat();
                switchWechatTab('me', document.querySelector('.wechat-nav-item:last-child'));
                openWechatSettings();
                openWechatDisplaySettings();
            }
            else if (state.activeContainer === 'wechatStorageContainer') {
                openWechat();
                switchWechatTab('me', document.querySelector('.wechat-nav-item:last-child'));
                openWechatSettings();
                openWechatStorage();
            }
            else if (state.activeContainer === 'wechatSettingsContainer') {
                openWechat();
                switchWechatTab('me', document.querySelector('.wechat-nav-item:last-child'));
                openWechatSettings();
            }
            else if (state.activeContainer === 'wechatAccountSwitchContainer') {
                openWechat();
                switchWechatTab('me', document.querySelector('.wechat-nav-item:last-child'));
                openWechatSettings();
                openWechatAccountSwitch();
            }
            else if (state.activeContainer === 'wechatContainer') openWechat();
            else if (state.activeContainer === 'contactsContainer') openContacts();
            else if (state.activeContainer === 'addContactContainer') openAddContactPage();
            else if (state.activeContainer === 'settingsContainer') openSettings();
            else if (state.activeContainer === 'accountContainer') {
                openSettings();
                openAccount();
            }
            else if (state.activeContainer === 'accountInfoContainer') {
                openSettings();
                openAccount();
                openAccountInfo();
            }
            else if (state.activeContainer === 'realNameContainer') {
                openSettings();
                openAccount();
                openAccountInfo();
                openRealNamePage();
            }
            else if (state.activeContainer === 'apiConfigContainer') {
                openSettings();
                openApiConfig();
            }
            else if (state.activeContainer === 'displaySettingsContainer') {
                openSettings();
                openDisplaySettings();
            }
            else if (state.activeContainer === 'themeContainer') {
                openThemePage();
                if (state.themePage === 'wallpaperPage') openWallpaperPage();
                else if (state.themePage === 'iconPage') openIconPage();
                else if (state.themePage === 'icon2Page') openIcon2Page();
                else if (state.themePage === 'fontPage') openFontPage();
            }
            else if (state.activeContainer === 'mineContainer') {
                openThemePage();
                openMinePage();
            }
        }

        // 处理键盘弹出时的视图调整
        window.addEventListener('resize', () => {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                // 延迟一会确保键盘已完全弹出
                setTimeout(() => {
                    if (currentChatFriendId) {
                        const container = document.getElementById('chatMessages');
                        container.scrollTop = container.scrollHeight;
                    }
                    // 确保当前活跃的输入框在可视区域内
                    document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        });

        // 世界书逻辑
        let worldBooks = JSON.parse(localStorage.getItem('mimi_world_books') || '[]');
        let currentEditingBookId = null;
        let currentEditingItemId = null;

        function saveWorldBooks() {
            localStorage.setItem('mimi_world_books', JSON.stringify(worldBooks));
        }

        function openWorldBook() {
            showContainer('worldBookContainer');
            renderWorldBookList();
            updateTime();
            saveUIState();
        }

        function closeWorldBook() {
            showContainer('phone-container');
            saveUIState();
        }

        function showAddWorldBookModal() {
            document.getElementById('addWorldBookModal').classList.add('active');
            document.getElementById('newWorldBookName').value = '';
            document.getElementById('newWorldBookName').focus();
        }

        function closeAddWorldBookModal() {
            document.getElementById('addWorldBookModal').classList.remove('active');
        }

        function confirmAddWorldBook() {
            const name = document.getElementById('newWorldBookName').value.trim();
            if (!name) return;

            const newBook = {
                id: Date.now(),
                name: name,
                description: '',
                items: []
            };

            worldBooks.push(newBook);
            saveWorldBooks();
            closeAddWorldBookModal();
            openWorldBookEdit(newBook.id);
        }

        let bookIdToDelete = null;
        let itemIdToDelete = null;

        function showDeleteWorldBookModal(id) {
            bookIdToDelete = id;
            document.getElementById('deleteWorldBookConfirmModal').classList.add('active');
            document.getElementById('confirmDeleteWorldBookBtn').onclick = () => {
                worldBooks = worldBooks.filter(b => b.id !== bookIdToDelete);
                saveWorldBooks();
                renderWorldBookList();
                closeDeleteWorldBookConfirmModal();
            };
        }

        function closeDeleteWorldBookConfirmModal() {
            document.getElementById('deleteWorldBookConfirmModal').classList.remove('active');
            bookIdToDelete = null;
        }

        function showDeleteBookItemModal(id) {
            itemIdToDelete = id;
            document.getElementById('deleteBookItemConfirmModal').classList.add('active');
            document.getElementById('confirmDeleteBookItemBtn').onclick = () => {
                const book = worldBooks.find(b => b.id === currentEditingBookId);
                if (book) {
                    book.items = book.items.filter(i => i.id !== itemIdToDelete);
                    saveWorldBooks();
                    renderBookItemsList();
                }
                closeDeleteBookItemConfirmModal();
            };
        }

        function closeDeleteBookItemConfirmModal() {
            document.getElementById('deleteBookItemConfirmModal').classList.remove('active');
            itemIdToDelete = null;
        }

        function renderWorldBookList() {
            const list = document.getElementById('worldBookList');
            const empty = document.getElementById('worldBookEmptyState');
            
            // 彻底清除所有卡片容器
            list.innerHTML = '';

            if (worldBooks.length === 0) {
                list.style.display = 'none';
                empty.style.display = 'flex';
                return;
            }

            list.style.display = 'grid';
            empty.style.display = 'none';

            worldBooks.forEach(book => {
                const card = document.createElement('div');
                card.className = 'world-book-card';
                card.style.position = 'relative';
                
                // 长按显示删除确认弹窗
                let longPressTimer;
                let isLongPress = false;
                const startPress = (e) => {
                    isLongPress = false;
                    longPressTimer = setTimeout(() => {
                        isLongPress = true;
                        if (navigator.vibrate) navigator.vibrate(50);
                        showDeleteWorldBookModal(book.id);
                    }, 800);
                };
                const cancelPress = () => {
                    clearTimeout(longPressTimer);
                };

                card.addEventListener('touchstart', startPress, { passive: true });
                card.addEventListener('touchend', cancelPress);
                card.addEventListener('touchmove', cancelPress);
                card.addEventListener('mousedown', startPress);
                card.addEventListener('mouseup', cancelPress);
                card.addEventListener('mouseleave', cancelPress);

                card.onclick = (e) => {
                    if (isLongPress) return;
                    openWorldBookEdit(book.id);
                };

                card.innerHTML = `
                    <div class="world-book-name">${book.name}</div>
                    <div class="world-book-desc">${book.description || '暂无简介'}</div>
                `;
                list.appendChild(card);
            });
        }

        function openWorldBookEdit(id) {
            currentEditingBookId = id;
            const book = worldBooks.find(b => b.id === id);
            if (!book) return;

            document.getElementById('editBookTitle').textContent = book.name;
            document.getElementById('editBookDesc').value = book.description;
            renderBookItemsList();

            document.getElementById('worldBookContainer').style.display = 'none';
            document.getElementById('worldBookEditPage').style.display = 'flex';
            updateTime();
        }

        function closeWorldBookEdit() {
            document.getElementById('worldBookEditPage').style.display = 'none';
            openWorldBook();
        }

        function editWorldBookName() {
            const book = worldBooks.find(b => b.id === currentEditingBookId);
            if (!book) return;

            const newName = prompt('修改世界书名称', book.name);
            if (newName && newName.trim()) {
                book.name = newName.trim();
                document.getElementById('editBookTitle').textContent = book.name;
                saveWorldBooks();
                renderWorldBookList();
            }
        }

        function updateBookDesc() {
            const book = worldBooks.find(b => b.id === currentEditingBookId);
            if (!book) return;

            book.description = document.getElementById('editBookDesc').value;
            saveWorldBooks();
        }

        function showAddBookItemModal() {
            document.getElementById('addBookItemModal').classList.add('active');
            document.getElementById('newBookItemName').value = '';
            document.getElementById('newBookItemName').focus();
        }

        function closeAddBookItemModal() {
            document.getElementById('addBookItemModal').classList.remove('active');
        }

        function confirmAddBookItem() {
            const name = document.getElementById('newBookItemName').value.trim();
            if (!name) return;

            const book = worldBooks.find(b => b.id === currentEditingBookId);
            if (!book) return;

            const newItem = {
                id: Date.now(),
                name: name,
                remark: '',
                content: '',
                enabled: true
            };

            book.items.push(newItem);
            saveWorldBooks();
            closeAddBookItemModal();
            openBookItemEdit(newItem.id);
        }

        function renderBookItemsList() {
            const list = document.getElementById('bookItemsList');
            const book = worldBooks.find(b => b.id === currentEditingBookId);
            if (!book) return;

            list.innerHTML = '';
            book.items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'book-item-row';
                
                // 长按显示删除确认弹窗
                let longPressTimer;
                let isLongPress = false;
                const startPress = (e) => {
                    isLongPress = false;
                    longPressTimer = setTimeout(() => {
                        isLongPress = true;
                        if (navigator.vibrate) navigator.vibrate(50);
                        showDeleteBookItemModal(item.id);
                    }, 800);
                };
                const cancelPress = () => {
                    clearTimeout(longPressTimer);
                };

                row.addEventListener('touchstart', startPress, { passive: true });
                row.addEventListener('touchend', cancelPress);
                row.addEventListener('touchmove', cancelPress);
                row.addEventListener('mousedown', startPress);
                row.addEventListener('mouseup', cancelPress);
                row.addEventListener('mouseleave', cancelPress);

                row.onclick = (e) => {
                    if (isLongPress) return;
                    openBookItemEdit(item.id);
                };
                
                row.innerHTML = `
                    <div class="book-item-content-left" style="display: flex; flex-direction: column; flex: 1; position: relative;">
                        <div class="book-item-name">${item.name}</div>
                        <div class="book-item-remark" style="font-size: 11px; color: #b2b2b2; text-align: right; margin-right: 10px; min-height: 12px; margin-top: 4px;">${item.remark || ''}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;" onclick="event.stopPropagation()">
                        <label class="switch">
                            <input type="checkbox" ${item.enabled ? 'checked' : ''} onchange="toggleItemRead(${item.id}, this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                `;
                list.appendChild(row);
            });
        }

        function toggleItemRead(itemId, enabled) {
            const book = worldBooks.find(b => b.id === currentEditingBookId);
            if (!book) return;

            const item = book.items.find(i => i.id === itemId);
            if (item) {
                item.enabled = enabled;
                saveWorldBooks();
                renderBookItemsList();
            }
        }

        function openBookItemEdit(itemId) {
            const book = worldBooks.find(b => b.id === currentEditingBookId);
            if (!book) return;

            const item = book.items.find(i => i.id === itemId);
            if (!item) return;

            currentEditingItemId = itemId;
            document.getElementById('editItemTitle').textContent = item.name;
            document.getElementById('editItemRemark').value = item.remark;
            document.getElementById('editItemContent').value = item.content;

            document.getElementById('worldBookEditPage').style.display = 'none';
            document.getElementById('bookItemEditPage').style.display = 'flex';
            updateTime();
        }

        function closeBookItemEdit() {
            document.getElementById('bookItemEditPage').style.display = 'none';
            document.getElementById('worldBookEditPage').style.display = 'flex';
            renderBookItemsList();
        }

        function updateItemDetails() {
            const book = worldBooks.find(b => b.id === currentEditingBookId);
            if (!book) return;

            const item = book.items.find(i => i.id === currentEditingItemId);
            if (item) {
                item.remark = document.getElementById('editItemRemark').value;
                item.content = document.getElementById('editItemContent').value;
                saveWorldBooks();
            }
        }

        // 世界书绑定逻辑
        let tempBoundWorldBookIds = [];

        function openWorldBookBindingModal() {
            if (!currentChatFriendId) return;
            const settings = getChatSettings(currentChatFriendId);
            tempBoundWorldBookIds = [...(settings.boundWorldBookIds || [])];
            
            document.getElementById('worldBookBindingModal').classList.add('active');
            renderWorldBookBindingList();
        }

        function closeWorldBookBindingModal() {
            document.getElementById('worldBookBindingModal').classList.remove('active');
            tempBoundWorldBookIds = [];
        }

        function renderWorldBookBindingList() {
            const container = document.getElementById('worldBookBindingList');
            container.innerHTML = '';

            if (worldBooks.length === 0) {
                container.innerHTML = '<div class="empty-state" style="padding: 20px;">暂无世界书，请先创建</div>';
                return;
            }

            worldBooks.forEach(book => {
                const isChecked = tempBoundWorldBookIds.includes(book.id);
                const item = document.createElement('div');
                item.className = 'selection-contact-item';
                item.style.padding = '12px 10px';
                item.style.borderBottom = '1px solid #f0f0f0';
                item.onclick = () => toggleWorldBookBinding(book.id);
                
                item.innerHTML = `
                    <div class="selection-checkbox ${isChecked ? 'checked' : ''}"></div>
                    <div style="flex: 1; margin-left: 10px;">
                        <div style="font-size: 15px; color: #333; font-weight: 500;">${book.name}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 2px;">${book.items.length} 个条目</div>
                    </div>
                `;
                container.appendChild(item);
            });
        }


        // 初始化
        (async function init() {
            updateTime();
            updateBattery();
            loadTextContent();

            try {
                await dbPromise; // 等待 DB 初始化
                await loadApiConfigs(); // 加载 API 配置
                await loadWallpapers(); // 加载壁纸设置
                await loadSavedIcons(); // 加载图标设置
                await loadFonts(); // 加载字体设置
                await loadThemes(); // 加载主题列表
                // loadUIState(); // 刷新始终回到主页，不加载上一次的状态
                checkFullscreenPref();
                loadDisplayExtras();
                if (typeof initWechat === 'function') await initWechat();
            } catch (e) {
                console.error("Initialization failed:", e);
                alert("数据库初始化失败，部分功能可能无法使用。");
            }

            setInterval(() => {
                updateTime();
            }, 1000);
        })();
