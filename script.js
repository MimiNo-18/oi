let currentElement = null;
        let currentImageId = null;

        // 统一页面切换逻辑，防止白屏和层级冲突
        function hideAllContainers() {
            const commonContainers = [
                'settingsContainer', 'themeContainer', 'worldBookContainer',
                'accountContainer', 'accountInfoContainer', 'displaySettingsContainer',
                'apiConfigContainer', 'mineContainer', 'realNameContainer', 
                'worldBookEditPage', 'bookItemEditPage', 'wallpaperPage', 
                'iconPage', 'icon2Page', 'fontPage', 'batterySettingsContainer'
            ];
            
            // 微信相关容器
            const wechatContainers = [
                'wechatContainer', 'contactsContainer', 'personalInfoContainer',
                'wechatSettingsContainer', 'wechatDisplaySettingsContainer',
                'wechatStorageContainer', 'categoryManagementContainer',
                'chatInfoContainer', 'addContactContainer', 'wechatFavoritesContainer',
                'stickerLibraryContainer', 'stickerManagementContainer',
                'mergedChatDetailContainer', 'manualMemoryContainer',
                'momentsContainer', 'momentsEditPage', 'wechatAccountSwitchContainer', 
                'servicePageContainer', 'groupChatPage', 'groupChatInfoPage', 
                'contactDetailPage', 'chatPageContainer'
            ];

            [...commonContainers, ...wechatContainers].forEach(id => {
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
                // 微信主页和聊天页等可能需要特殊的布局显示
                if (['wechatContainer', 'chatPageContainer', 'momentsContainer'].includes(id)) {
                    el.style.display = 'block';
                }
                window.scrollTo(0, 0);
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
            
            // 同步所有标记了需要同步时间的元素
            document.querySelectorAll('.time-sync, .wechat-time-sync').forEach(el => { 
                el.textContent = timeStr; 
            });
        }

        function safeLocalStorageSet(key, value, silent = false) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error("LocalStorage save failed:", e);
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
                    if (el && el.tagName === 'IMG') {
                        el.src = src;
                        saveImage(currentImageId, src);
                    } else if (el) {
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
                if (el && el.tagName === 'IMG') {
                    el.src = url;
                    saveImage(currentImageId, url);
                } else if (el) {
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
                infoMimi.textContent = localStorage.getItem('mimi_unique_id') || '';
            }
            
            // 微信相关用户信息展示
            if (typeof wechatUserInfo !== 'undefined') {
                if (infoCountry) infoCountry.textContent = wechatUserInfo.country || '中国';
                if (infoLocation) infoLocation.textContent = wechatUserInfo.location || '未设置';
            }
            
            updateTime();
            updateBattery();
            saveUIState();
        }

        function closeAccountInfo() {
            showContainer('accountContainer');
            saveUIState();
        }

        let apiConfigs = [];
        let currentConfigId = 'default';

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
                // 核心配置及微信相关配置
                const keys = [
                    'mimi_text_content', 'current_api_config_id', 'mimi_ui_state', 'lowBatteryAlerted',
                    'wechat_user_info', 'wechat_chat_list', 'wechat_group_list', 'wechat_chat_histories', 
                    'contacts', 'customCategories'
                ];
                keys.forEach(key => {
                    const val = localStorage.getItem(key);
                    if (val !== null) data.localStorage[key] = val;
                });
                // 数据库存储，包含微信相关的历史和朋友圈
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
            if (!select) return;
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

        // UI 状态保存（仅限核心 phone UI 部分）
        function saveUIState() {
            const state = { activeContainer: '' };
            if (document.getElementById('settingsContainer').style.display === 'flex') state.activeContainer = 'settingsContainer';
            else if (document.getElementById('accountContainer').style.display === 'flex') state.activeContainer = 'accountContainer';
            else if (document.getElementById('themeContainer').style.display === 'flex') state.activeContainer = 'themeContainer';
            else state.activeContainer = 'phone-container';
            sessionStorage.setItem('mimi_ui_state', JSON.stringify(state));
        }

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
                const el = document.getElementById(icon.id);
                if (!el) return;
                const currentSrc = el.src;
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
                if (!el) return;
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
                } catch (e) { console.error(e); }
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
                } catch (e) { console.error(e); }
            }
        }

        // 壁纸管理
        let wallpapers = []; 
        let currentWallpaper = '';

        async function loadWallpapers() {
            try {
                wallpapers = await dbGetAll('wallpapers');
                const current = await dbGet('settings', 'currentWallpaper');
                if (current) {
                    currentWallpaper = current.value;
                    applyWallpaper(currentWallpaper);
                }
            } catch (e) { console.error(e); }
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
            event.target.value = '';
        }

        function showWallpaperUrlInput() {
            const url = prompt('请输入图片URL链接:');
            if (url && url.trim()) {
                addWallpaper(url.trim());
            }
        }

        async function addWallpaper(src) {
            if (wallpapers.some(w => w.src === src)) { alert('该壁纸已存在'); return; }
            try {
                const id = await dbPut('wallpapers', { src: src });
                wallpapers.push({ id: id, src: src });
                renderWallpaperGrid();
                setWallpaper(src);
            } catch (e) { alert('保存壁纸失败'); }
        }

        async function setWallpaper(src) {
            currentWallpaper = src;
            try {
                await dbPut('settings', { key: 'currentWallpaper', value: src });
                applyWallpaper(src);
                renderWallpaperGrid();
            } catch (e) { console.error(e); }
        }

        function applyWallpaper(src) {
            const container = document.querySelector('.phone-container');
            if (container) {
                container.style.backgroundImage = src ? `url('${src}')` : 'none';
            }
        }

        async function restoreDefaultWallpaper() {
            currentWallpaper = '';
            try {
                await dbDelete('settings', 'currentWallpaper');
                applyWallpaper('');
                renderWallpaperGrid();
            } catch (e) { console.error(e); }
        }

        async function deleteWallpaper(id) {
            if (confirm('确定要删除这张壁纸吗？')) {
                try {
                    const wallpaper = wallpapers.find(w => w.id === id);
                    if (!wallpaper) return;
                    await dbDelete('wallpapers', id);
                    wallpapers = wallpapers.filter(w => w.id !== id);
                    if (currentWallpaper === wallpaper.src) {
                        restoreDefaultWallpaper();
                    } else {
                        renderWallpaperGrid();
                    }
                } catch (e) { alert("删除失败"); }
            }
        }

        function renderWallpaperGrid() {
            const grid = document.getElementById('wallpaperGrid');
            if (!grid) return;
            grid.innerHTML = '';
            const defaultItem = document.createElement('div');
            defaultItem.className = `wallpaper-item ${!currentWallpaper ? 'active' : ''}`;
            defaultItem.onclick = restoreDefaultWallpaper;
            defaultItem.innerHTML = `<div style="width:100%;height:100%;background:#fff;display:flex;align-items:center;justify-content:center;color:#333;font-size:12px;flex-direction:column;gap:5px;"><div style="font-size:20px;">↺</div><div>恢复默认</div></div>`;
            grid.appendChild(defaultItem);
            wallpapers.forEach(wallpaper => {
                const item = document.createElement('div');
                item.className = `wallpaper-item ${currentWallpaper === wallpaper.src ? 'active' : ''}`;
                let pressTimer;
                const startPress = () => { pressTimer = setTimeout(() => deleteWallpaper(wallpaper.id), 800); };
                const cancelPress = () => { clearTimeout(pressTimer); };
                item.addEventListener('touchstart', startPress);
                item.addEventListener('touchend', cancelPress);
                item.addEventListener('touchmove', cancelPress);
                item.addEventListener('mousedown', startPress);
                item.addEventListener('mouseup', cancelPress);
                item.onclick = () => setWallpaper(wallpaper.src);
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
                for (const font of customFonts) { loadFontFace(font.name, font.source); }
                const current = await dbGet('settings', 'currentFont');
                if (current) {
                    currentFont = current.value;
                    const fontData = customFonts.find(f => f.name === currentFont);
                    if (fontData) { document.body.style.fontFamily = `"${currentFont}", -apple-system, sans-serif`; }
                }
            } catch (e) { console.error(e); }
        }

        async function loadFontFace(name, source) {
            try {
                const font = new FontFace(name, `url("${source}")`);
                await font.load();
                document.fonts.add(font);
                return true;
            } catch (e) { return false; }
        }

        function handleFontFile(event) {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 20 * 1024 * 1024) { alert('文件过大'); return; }
                const reader = new FileReader();
                reader.onload = function(e) { addFont(`CustomFont_${Date.now()}`, e.target.result, file.name); };
                reader.readAsDataURL(file);
            }
            event.target.value = '';
        }

        function showFontUrlInput() {
            const url = prompt('请输入字体文件URL:');
            if (url && url.trim()) { addFont(`CustomFont_${Date.now()}`, url.trim(), '网络字体'); }
        }

        async function addFont(name, source, displayName) {
            const success = await loadFontFace(name, source);
            if (!success) { alert('无法加载该字体'); return; }
            const newFont = { name: name, source: source, displayName: displayName || '未知字体' };
            try {
                await dbPut('fonts', newFont);
                customFonts.push(newFont);
                renderFontGrid();
                applyFont(name);
            } catch (e) { alert('保存字体失败'); }
        }

        async function applyFont(name) {
            currentFont = name;
            try {
                await dbPut('settings', { key: 'currentFont', value: name });
                document.body.style.fontFamily = name ? `"${name}", sans-serif` : "sans-serif";
                renderFontGrid();
            } catch (e) { console.error(e); }
        }

        async function restoreDefaultFont() {
            currentFont = null;
            try {
                await dbDelete('settings', 'currentFont');
                document.body.style.fontFamily = "sans-serif";
                renderFontGrid();
            } catch (e) { console.error(e); }
        }

        async function deleteFont(name) {
            if (confirm('确定要删除这个字体吗？')) {
                try {
                    await dbDelete('fonts', name);
                    customFonts = customFonts.filter(f => f.name !== name);
                    if (currentFont === name) { restoreDefaultFont(); } else { renderFontGrid(); }
                } catch (e) { alert("删除失败"); }
            }
        }

        function renderFontGrid() {
            const grid = document.getElementById('fontGrid');
            if (!grid) return;
            grid.innerHTML = '';
            const defaultItem = document.createElement('div');
            defaultItem.className = `font-item ${!currentFont ? 'active' : ''}`;
            defaultItem.onclick = restoreDefaultFont;
            defaultItem.innerHTML = `<div class="font-preview-text">Aa</div><div class="font-name">默认字体</div>`;
            grid.appendChild(defaultItem);
            customFonts.forEach(font => {
                const item = document.createElement('div');
                item.className = `font-item ${currentFont === font.name ? 'active' : ''}`;
                let pressTimer;
                item.addEventListener('touchstart', () => { pressTimer = setTimeout(() => deleteFont(font.name), 800); });
                item.addEventListener('touchend', () => clearTimeout(pressTimer));
                item.addEventListener('mousedown', () => { pressTimer = setTimeout(() => deleteFont(font.name), 800); });
                item.addEventListener('mouseup', () => clearTimeout(pressTimer));
                item.onclick = () => applyFont(font.name);
                item.innerHTML = `<div class="font-preview-text" style="font-family:'${font.name}';">Aa</div><div class="font-name">${font.displayName}</div>`;
                grid.appendChild(item);
            });
        }

        // 主题功能实现
        let savedThemes = [];
        let currentThemeId = 'default';

        async function loadThemes() {
            try {
                savedThemes = await dbGetAll('themes');
                const current = await dbGet('settings', 'currentThemeId');
                if (current) currentThemeId = current.value;
                renderThemeList();
            } catch (e) { console.error(e); }
        }

        async function saveCurrentTheme() {
            const mineContainer = document.getElementById('mineContainer');
            const phoneContainer = document.querySelector('.phone-container');
            mineContainer.style.display = 'none';
            phoneContainer.style.display = 'flex';
            await new Promise(r => setTimeout(r, 100));
            try {
                const canvas = await html2canvas(phoneContainer, { useCORS: true, logging: false, scale: 0.5 });
                const screenshot = canvas.toDataURL('image/jpeg', 0.7);
                phoneContainer.style.display = 'none';
                mineContainer.style.display = 'flex';
                const name = prompt('请输入主题名称:', `主题 ${savedThemes.length + 1}`);
                if (!name) return;
                const icons = {};
                (await dbGetAll('icons')).forEach(icon => { icons[icon.id] = icon.src; });
                const textData = {};
                document.querySelectorAll('[id^="txt-"]').forEach(el => { textData[el.id] = el.textContent; });
                const theme = { id: Date.now().toString(), name: name, screenshot: screenshot, config: { wallpaper: currentWallpaper || '', icons: icons, font: currentFont || '', textContent: textData } };
                await dbPut('themes', theme);
                savedThemes.push(theme);
                currentThemeId = theme.id;
                await dbPut('settings', { key: 'currentThemeId', value: currentThemeId });
                renderThemeList();
                alert('主题保存成功！');
            } catch (error) {
                phoneContainer.style.display = 'none'; mineContainer.style.display = 'flex';
                alert('保存失败');
            }
        }

        function renderThemeList() {
            const list = document.getElementById('themeList');
            if (!list) return;
            list.innerHTML = '';
            const defaultCard = document.createElement('div');
            defaultCard.className = `theme-card ${currentThemeId === 'default' ? 'active' : ''}`;
            defaultCard.onclick = () => applyTheme('default');
            defaultCard.innerHTML = `<div class="theme-preview" style="background:#fff;display:flex;align-items:center;justify-content:center;color:#333;font-size:12px;flex-direction:column;gap:5px;"><div style="font-size:24px;">↺</div></div><div class="theme-info"><div class="theme-name">默认主题</div></div>`;
            list.appendChild(defaultCard);
            savedThemes.forEach(theme => {
                const card = document.createElement('div');
                card.className = `theme-card ${currentThemeId === theme.id ? 'active' : ''}`;
                let pt;
                card.addEventListener('touchstart', () => { pt = setTimeout(() => deleteTheme(theme.id), 800); });
                card.addEventListener('touchend', () => clearTimeout(pt));
                card.addEventListener('mousedown', () => { pt = setTimeout(() => deleteTheme(theme.id), 800); });
                card.addEventListener('mouseup', () => clearTimeout(pt));
                card.onclick = () => applyTheme(theme.id);
                card.innerHTML = `<img src="${theme.screenshot}" class="theme-preview" alt="${theme.name}"><div class="theme-info"><div class="theme-name">${theme.name}</div></div>`;
                list.appendChild(card);
            });
        }

        async function applyTheme(themeId) {
            try {
                if (themeId === 'default') {
                    currentThemeId = 'default';
                    await dbPut('settings', { key: 'currentThemeId', value: 'default' });
                    await restoreDefaultWallpaper();
                    await resetIcons(true);
                    await restoreDefaultFont();
                } else {
                    const theme = savedThemes.find(t => t.id === themeId);
                    if (!theme) return;
                    currentThemeId = themeId;
                    await dbPut('settings', { key: 'currentThemeId', value: themeId });
                    if (theme.config.wallpaper) await setWallpaper(theme.config.wallpaper); else await restoreDefaultWallpaper();
                    await dbClear('icons');
                    for (const id in theme.config.icons) await dbPut('icons', { id: id, src: theme.config.icons[id] });
                    for (const id in theme.config.icons) { const el = document.getElementById(id); if (el) el.src = theme.config.icons[id]; }
                    if (theme.config.font) await applyFont(theme.config.font); else await restoreDefaultFont();
                    if (theme.config.textContent) { for (const id in theme.config.textContent) { const el = document.getElementById(id); if (el) el.textContent = theme.config.textContent[id]; } saveTextContent(); }
                }
                renderThemeList(); renderWallpaperGrid(); renderIconList(); renderFontGrid();
            } catch (e) { alert("应用失败"); }
        }

        async function deleteTheme(themeId) {
            if (confirm('确定要删除这个主题吗？')) {
                try {
                    await dbDelete('themes', themeId);
                    savedThemes = savedThemes.filter(t => t.id !== themeId);
                    if (currentThemeId === themeId) await applyTheme('default'); else renderThemeList();
                } catch (e) { alert("删除失败"); }
            }
        }

        function exportThemes() { if (savedThemes.length === 0) { alert('无导出内容'); return; } downloadData(savedThemes, `MimiPhone_Themes.json`); }

        function importThemes(event) {
            const file = event.target.files[0]; if (!file) return;
            const reader = new FileReader(); reader.onload = async function(e) {
                try {
                    const themes = JSON.parse(e.target.result);
                    if (!Array.isArray(themes)) throw new Error('格式错误');
                    for (const nt of themes) { if (nt.id && nt.name && nt.config) { nt.id = Date.now().toString() + Math.random().toString(36).substr(2, 5); await dbPut('themes', nt); savedThemes.push(nt); } }
                    renderThemeList(); alert(`成功导入`);
                } catch (error) { alert('导入失败'); }
            }; reader.readAsText(file); event.target.value = '';
        }

        function openMinePage() { showContainer('mineContainer'); document.querySelector('#mineContainer .theme-title').textContent = '我的主题'; updateTime(); updateBattery(); renderThemeList(); saveUIState(); }
        function closeMinePage() { showContainer('themeContainer'); showThemeMainMenu(); saveUIState(); }

        // IndexedDB 封装
        const DB_NAME = 'MimiPhoneDB';
        const DB_VERSION = 4;
        let db;

        const dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = (event) => reject(event.target.error);
            request.onsuccess = (event) => { db = event.target.result; resolve(db); };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('wallpapers')) db.createObjectStore('wallpapers', { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains('icons')) db.createObjectStore('icons', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('button_icons')) db.createObjectStore('button_icons', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('fonts')) db.createObjectStore('fonts', { keyPath: 'name' });
                if (!db.objectStoreNames.contains('themes')) db.createObjectStore('themes', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
                if (!db.objectStoreNames.contains('api_configs')) db.createObjectStore('api_configs', { keyPath: 'id' });
            };
        });

        async function dbGet(storeName, key) { await dbPromise; return new Promise((res, rej) => { const tx = db.transaction([storeName], 'readonly'); const s = tx.objectStore(storeName); const req = s.get(key); req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); }); }
        async function dbGetAll(storeName) { await dbPromise; return new Promise((res, rej) => { const tx = db.transaction([storeName], 'readonly'); const s = tx.objectStore(storeName); const req = s.getAll(); req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); }); }
        async function dbPut(storeName, value) { await dbPromise; return new Promise((res, rej) => { const tx = db.transaction([storeName], 'readwrite'); const s = tx.objectStore(storeName); const req = s.put(value); req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); }); }
        async function dbDelete(storeName, key) { await dbPromise; return new Promise((res, rej) => { const tx = db.transaction([storeName], 'readwrite'); const s = tx.objectStore(storeName); const req = s.delete(key); req.onsuccess = () => res(); req.onerror = () => rej(req.error); }); }
        async function dbClear(storeName) { await dbPromise; return new Promise((res, rej) => { const tx = db.transaction([storeName], 'readwrite'); const s = tx.objectStore(storeName); const req = s.clear(); req.onsuccess = () => res(); req.onerror = () => rej(req.error); }); }

        // 处理键盘弹出时的视图调整
        window.addEventListener('resize', () => {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                setTimeout(() => {
                    // 微信聊天窗口自动滚动
                    if (typeof currentChatFriendId !== 'undefined' && currentChatFriendId) {
                        const container = document.getElementById('chatMessages');
                        if (container) container.scrollTop = container.scrollHeight;
                    }
                    document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        });

        // 初始化
        (async function init() {
            updateTime();
            updateBattery();
            loadTextContent();
            
            // 初始化 WeChat
            if (typeof initWechat === 'function') {
                await initWechat();
            }

            try {
                await dbPromise; 
                await loadApiConfigs(); 
                await loadWallpapers(); 
                await loadSavedIcons(); 
                await loadFonts(); 
                await loadThemes(); 
                checkFullscreenPref();
                loadDisplayExtras();
            } catch (e) { console.error("Initialization failed:", e); }

            setInterval(updateTime, 1000);
        })();
