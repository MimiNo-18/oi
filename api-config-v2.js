(function () {
    'use strict';

    var host = document.getElementById('apiConfigContainer');
    if (!host) return;

    var page = 'home';
    var chatSlot = 'main';
    var voiceProvider = 'fish';
    var imageKey = 'mimi_image_api_config_v2';
    var videoKey = 'mimi_video_api_config_v2';
    var voiceKey = 'mimi_voice_api_configs_v2';
    var presetKey = 'mimi_api_presets_v2';

    host.className = 'api-v2-container';

    function t(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function label(text) {
        return text;
    }

    function setPage(title, content) {
        host.innerHTML = '<div class="api-v2-header">' +
            '<button class="api-v2-back" type="button" data-api-back aria-label="back">&lsaquo;</button>' +
            '<div class="api-v2-title">' + title + '</div><div></div></div>' +
            '<div class="api-v2-content" id="apiV2Content">' + content + '</div>';
    }

    function show() {
        host.style.display = 'flex';
        var settings = document.getElementById('settingsContainer');
        if (settings) settings.style.display = 'none';
        renderHome();
    }

    function close() {
        host.style.display = 'none';
        var settings = document.getElementById('settingsContainer');
        if (settings) settings.style.display = 'flex';
        if (typeof saveUIState === 'function') saveUIState();
    }

    function menuItem(target, title) {
        return '<button class="api-v2-menu-item" type="button" data-api-page="' + target + '">' +
            '<span class="api-v2-menu-name">' + title + '</span><span class="api-v2-menu-arrow">&rsaquo;</span></button>';
    }

    function renderHome() {
        page = 'home';
        setPage(label('\u0041\u0050\u0049 \u914d\u7f6e'), '<div class="api-v2-menu">' +
            menuItem('chat', label('\u804a\u5929 \u0041\u0050\u0049')) +
            menuItem('image', label('\u751f\u56fe \u0041\u0050\u0049')) +
            menuItem('voice', label('\u8bed\u97f3 \u0041\u0050\u0049')) +
            menuItem('video', label('\u89c6\u9891 \u0041\u0050\u0049')) +
            '</div>');
    }

    function normalizeRoot(url) {
        return String(url || '').trim()
            .replace(/\/+$/, '')
            .replace(/\/chat\/completions$/i, '')
            .replace(/\/images\/generations$/i, '')
            .replace(/\/v1$/i, '');
    }

    function field(id, title, value, placeholder, secret) {
        return '<div class="api-v2-field"><label for="' + id + '">' + title + '</label>' +
            '<input id="' + id + '" class="api-v2-input' + (secret ? ' api-v2-secret' : '') + '"' +
            ' type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false"' +
            ' value="' + t(value || '') + '" placeholder="' + t(placeholder || '') + '"></div>';
    }

    function modelField(value) {
        return '<div class="api-v2-field"><label for="apiV2Model">' + label('\u6a21\u578b') + '</label>' +
            '<div class="api-v2-row"><input id="apiV2Model" class="api-v2-input" type="text" list="apiV2ModelList"' +
            ' value="' + t(value || '') + '" placeholder="' + label('\u8f93\u5165\u6a21\u578b \u0049\u0044 \u6216\u70b9\u51fb\u62c9\u53d6') + '">' +
            '<datalist id="apiV2ModelList"></datalist>' +
            '<button class="api-v2-small-btn" type="button" data-api-models>' + label('\u62c9\u53d6\u6a21\u578b') + '</button></div></div>';
    }

    function presetScope() {
        if (page === 'chat') return chatSlot === 'main' ? 'chat-main' : 'chat-secondary';
        if (page === 'image') return 'image';
        return '';
    }

    function presets() {
        var data = readJson(presetKey);
        return Array.isArray(data[presetScope()]) ? data[presetScope()] : [];
    }

    function presetField() {
        var list = presets();
        return '<div class="api-v2-preset-row">' +
            '<div class="api-v2-preset-dropdown"><select id="apiV2Preset" data-api-preset-select>' +
            '<option value="">' + label('\u9009\u62e9\u9884\u8bbe') + '</option>' +
            list.map(function (item, index) { return '<option value="' + index + '">' + t(item.name) + '</option>'; }).join('') +
            '</select></div>' +
            '<button class="api-v2-preset-icon" type="button" data-api-preset-save title="' + label('\u4fdd\u5b58\u9884\u8bbe') + '" aria-label="' + label('\u4fdd\u5b58\u9884\u8bbe') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>' +
            '<button class="api-v2-preset-icon" type="button" data-api-preset-delete title="' + label('\u5220\u9664\u5f53\u524d\u9884\u8bbe') + '" aria-label="' + label('\u5220\u9664\u5f53\u524d\u9884\u8bbe') + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button></div>';
    }

    function form(data, kind) {
        var temperature = kind === 'chat'
            ? '<div class="api-v2-field"><label for="apiV2Temp">' + label('\u6e29\u5ea6') + '</label>' +
              '<input id="apiV2Temp" class="api-v2-input" type="number" min="0" max="2" step="0.1" value="' + t(data.temp || '1.0') + '"></div>'
            : '';
        return '<div class="api-v2-form">' +
            presetField() +
            field('apiV2Name', label('\u914d\u7f6e\u540d\u79f0'), data.name, label('\u4f8b\u5982\uff1a\u4e3b\u63a5\u53e3'), false) +
            field('apiV2Url', label('\u63a5\u53e3\u5730\u5740'), data.url, 'https://example.com \u6216 https://example.com/v1', false) +
            field('apiV2Key', label('\u0041\u0050\u0049 \u5bc6\u94a5'), data.key, label('\u8f93\u5165\u4f60\u7684\u5bc6\u94a5'), true) +
            modelField(data.model) + temperature +
            '<div class="api-v2-hint">' + label('\u63a5\u53e3\u5730\u5740\u53ef\u5e26 /v1\uff0c\u4e5f\u53ef\u4e0d\u5e26\uff0c\u8c03\u7528\u65f6\u4f1a\u81ea\u52a8\u5904\u7406\u3002') + '</div>' +
            '<div id="apiV2Status" class="api-v2-status"></div>' +
            '<button class="api-v2-save" type="button" data-api-save>' + label('\u4fdd\u5b58\u914d\u7f6e') + '</button></div>';
    }

    function readJson(key) {
        try { return JSON.parse(localStorage.getItem(key) || '{}'); }
        catch (error) { return {}; }
    }

    async function loadChat() {
        var configs = [];
        try {
            if (typeof dbGetAll === 'function') configs = await dbGetAll('api_configs') || [];
        } catch (error) {}
        var id = chatSlot === 'main' ? 'default' : 'chat-secondary';
        var data = configs.find(function (item) { return item.id === id; }) || {
            id: id,
            name: chatSlot === 'main' ? label('\u4e3b \u0041\u0050\u0049') : label('\u526f \u0041\u0050\u0049'),
            url: '', key: '', model: '', temp: '1.0'
        };
        var content = document.getElementById('apiV2Content');
        if (!content) return;
        content.innerHTML = '<div class="api-v2-tabs">' +
            '<button class="api-v2-tab ' + (chatSlot === 'main' ? 'active' : '') + '" type="button" data-chat-slot="main">' + label('\u4e3b \u0041\u0050\u0049') + '</button>' +
            '<button class="api-v2-tab ' + (chatSlot === 'secondary' ? 'active' : '') + '" type="button" data-chat-slot="secondary">' + label('\u526f \u0041\u0050\u0049') + '</button></div>' +
            form(data, 'chat');
    }

    function renderChat() {
        page = 'chat';
        setPage(label('\u804a\u5929 \u0041\u0050\u0049'), '');
        loadChat();
    }

    function renderImage() {
        page = 'image';
        var data = Object.assign({ name: label('\u751f\u56fe \u0041\u0050\u0049'), url: '', key: '', model: '' }, readJson(imageKey));
        setPage(label('\u751f\u56fe \u0041\u0050\u0049'), form(data, 'image'));
    }

    function renderVideo() {
        page = 'video';
        var data = Object.assign({ name: label('\u89c6\u9891 \u0041\u0050\u0049'), url: '', key: '', model: '' }, readJson(videoKey));
        setPage(label('\u89c6\u9891 \u0041\u0050\u0049'), form(data, 'video'));
    }

    function voiceDefaults() {
        return {
            fish: { name: 'FishAudio', url: 'https://api.fish.audio', key: '', model: '', voiceId: '' },
            minimax: { name: 'MiniMax', url: 'https://api.minimax.io/v1', key: '', model: '', voiceId: '' },
            eleven: { name: 'ElevenLabs', url: 'https://api.elevenlabs.io/v1', key: '', model: '', voiceId: '' }
        };
    }

    function voiceTab(provider, text) {
        return '<button class="api-v2-tab ' + (voiceProvider === provider ? 'active' : '') + '" type="button" data-voice-provider="' + provider + '">' + text + '</button>';
    }

    function renderVoice() {
        page = 'voice';
        var saved = readJson(voiceKey);
        var data = Object.assign({}, voiceDefaults()[voiceProvider], saved[voiceProvider] || {});
        var tabs = '<div class="api-v2-tabs">' + voiceTab('fish', 'FishAudio') + voiceTab('minimax', 'MiniMax') + voiceTab('eleven', 'ElevenLabs') + '</div>';
        setPage(label('\u8bed\u97f3 \u0041\u0050\u0049'), tabs + '<div class="api-v2-form">' +
            field('apiV2Name', label('\u914d\u7f6e\u540d\u79f0'), data.name, label('\u670d\u52a1\u540d\u79f0'), false) +
            field('apiV2Url', label('\u63a5\u53e3\u5730\u5740'), data.url, label('\u670d\u52a1\u5546 \u0041\u0050\u0049 \u5730\u5740'), false) +
            field('apiV2Key', label('\u0041\u0050\u0049 \u5bc6\u94a5'), data.key, label('\u8f93\u5165\u4f60\u7684\u5bc6\u94a5'), true) +
            modelField(data.model) +
            field('apiV2VoiceId', label('\u97f3\u8272 \u0049\u0044'), data.voiceId, label('\u8f93\u5165\u670d\u52a1\u5546\u63d0\u4f9b\u7684\u97f3\u8272 \u0049\u0044'), false) +
            '<div id="apiV2Status" class="api-v2-status"></div>' +
            '<button class="api-v2-save" type="button" data-api-save>' + label('\u4fdd\u5b58\u914d\u7f6e') + '</button></div>');
    }

    function value(id, fallback) {
        var element = document.getElementById(id);
        return element ? element.value.trim() : fallback;
    }

    function values() {
        return {
            name: value('apiV2Name', ''),
            url: value('apiV2Url', ''),
            key: value('apiV2Key', ''),
            model: value('apiV2Model', ''),
            temp: value('apiV2Temp', '1.0'),
            voiceId: value('apiV2VoiceId', '')
        };
    }

    function status(text) {
        var element = document.getElementById('apiV2Status');
        if (element) element.textContent = text;
    }

    function fillForm(data) {
        ['Name', 'Url', 'Key', 'Model', 'Temp'].forEach(function (suffix) {
            var key = suffix.charAt(0).toLowerCase() + suffix.slice(1);
            var element = document.getElementById('apiV2' + suffix);
            if (element && data[key] != null) element.value = data[key];
        });
    }

    function loadPreset(index) {
        var preset = presets()[Number(index)];
        if (!preset) return;
        fillForm(preset.data || {});
        status(label('\u5df2\u52a0\u8f7d\u9884\u8bbe'));
    }

    function savePreset() {
        var oldModal = document.getElementById('apiV2PresetModal');
        if (oldModal) oldModal.remove();
        var modal = document.createElement('div');
        modal.id = 'apiV2PresetModal';
        modal.className = 'style-preset-name-modal';
        modal.innerHTML = '<div class="style-preset-name-dialog"><div class="style-preset-name-title">' + label('\u4fdd\u5b58\u4e3a\u9884\u8bbe') + '</div>' +
            '<input id="apiV2PresetNameInput" type="text" maxlength="30" placeholder="' + label('\u8bf7\u8f93\u5165\u9884\u8bbe\u540d') + '" value="' + t(value('apiV2Name', '')) + '">' +
            '<div class="style-preset-name-actions"><button type="button" data-api-preset-cancel>' + label('\u53d6\u6d88') + '</button>' +
            '<button type="button" class="confirm" data-api-preset-confirm>' + label('\u4fdd\u5b58') + '</button></div></div>';
        document.body.appendChild(modal);
        var input = document.getElementById('apiV2PresetNameInput');
        if (input) { input.focus(); input.select(); }
    }

    function confirmPresetSave() {
        var input = document.getElementById('apiV2PresetNameInput');
        var name = input ? input.value.trim() : '';
        if (!name) { alert(label('\u9884\u8bbe\u540d\u4e0d\u80fd\u4e3a\u7a7a')); return; }
        var currentData = values();
        var all = readJson(presetKey);
        var scope = presetScope();
        var list = Array.isArray(all[scope]) ? all[scope] : [];
        var existing = list.find(function (item) { return item.name === name; });
        if (existing) existing.data = currentData;
        else list.push({ name: name, data: currentData });
        all[scope] = list;
        localStorage.setItem(presetKey, JSON.stringify(all));
        var select = document.getElementById('apiV2Preset');
        if (select) {
            select.innerHTML = '<option value="">' + label('\u9009\u62e9\u9884\u8bbe') + '</option>' +
                list.map(function (item, index) { return '<option value="' + index + '">' + t(item.name) + '</option>'; }).join('');
            select.value = String(list.findIndex(function (item) { return item.name === name; }));
        }
        var modal = document.getElementById('apiV2PresetModal');
        if (modal) modal.remove();
        status(label('\u9884\u8bbe\u5df2\u4fdd\u5b58'));
    }

    function deletePreset() {
        var select = document.getElementById('apiV2Preset');
        if (!select || select.value === '') {
            status(label('\u8bf7\u5148\u9009\u62e9\u8981\u5220\u9664\u7684\u9884\u8bbe'));
            return;
        }
        var index = Number(select.value);
        var all = readJson(presetKey);
        var scope = presetScope();
        var list = Array.isArray(all[scope]) ? all[scope] : [];
        if (!list[index]) return;
        if (!window.confirm(label('\u786e\u5b9a\u5220\u9664\u9884\u8bbe\u201c') + list[index].name + label('\u201d\u5417\uff1f'))) return;
        list.splice(index, 1);
        all[scope] = list;
        localStorage.setItem(presetKey, JSON.stringify(all));
        select.innerHTML = '<option value="">' + label('\u9009\u62e9\u9884\u8bbe') + '</option>' +
            list.map(function (item, itemIndex) { return '<option value="' + itemIndex + '">' + t(item.name) + '</option>'; }).join('');
        status(label('\u9884\u8bbe\u5df2\u5220\u9664'));
    }

    async function save() {
        var data = values();
        try {
            if (page === 'chat') {
                var id = chatSlot === 'main' ? 'default' : 'chat-secondary';
                if (typeof dbPut !== 'function') throw new Error(label('\u6570\u636e\u5e93\u5c1a\u672a\u5c31\u7eea'));
                await dbPut('api_configs', Object.assign({ id: id }, data));
                if (chatSlot === 'main') localStorage.setItem('current_api_config_id', id);
            } else if (page === 'image') {
                localStorage.setItem(imageKey, JSON.stringify(data));
            } else if (page === 'video') {
                localStorage.setItem(videoKey, JSON.stringify(data));
            } else if (page === 'voice') {
                var all = readJson(voiceKey);
                all[voiceProvider] = data;
                localStorage.setItem(voiceKey, JSON.stringify(all));
            }
            status(label('\u5df2\u4fdd\u5b58'));
            alert(label('\u5df2\u4fdd\u5b58'));
            renderHome();
        } catch (error) {
            status(label('\u4fdd\u5b58\u5931\u8d25\uff1a') + error.message);
        }
    }

    async function fetchModels() {
        var data = values();
        if (!data.url) {
            status(label('\u8bf7\u5148\u8f93\u5165\u63a5\u53e3\u5730\u5740'));
            return;
        }
        status(label('\u6b63\u5728\u62c9\u53d6\u6a21\u578b\u2026'));
        var headers = {};
        if (page === 'voice' && voiceProvider === 'eleven') headers['xi-api-key'] = data.key;
        else if (data.key) headers.Authorization = 'Bearer ' + data.key;
        try {
            var response = await fetch(normalizeRoot(data.url) + '/v1/models', { headers: headers });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            var json = await response.json();
            var list = Array.isArray(json.data) ? json.data : Array.isArray(json.models) ? json.models : Array.isArray(json) ? json : [];
            var ids = list.map(function (item) {
                return typeof item === 'string' ? item : item.id || item.model_id || item.name;
            }).filter(Boolean);
            var datalist = document.getElementById('apiV2ModelList');
            if (datalist) datalist.innerHTML = ids.map(function (id) { return '<option value="' + t(id) + '"></option>'; }).join('');
            status(ids.length ? label('\u5df2\u62c9\u53d6 ') + ids.length + label(' \u4e2a\u6a21\u578b') : label('\u672a\u8fd4\u56de\u6a21\u578b\uff0c\u53ef\u624b\u52a8\u8f93\u5165'));
        } catch (error) {
            status(label('\u62c9\u53d6\u5931\u8d25\uff0c\u53ef\u76f4\u63a5\u624b\u52a8\u8f93\u5165\u6a21\u578b \u0049\u0044'));
        }
    }

    host.addEventListener('click', function (event) {
        var pageButton = event.target.closest('[data-api-page]');
        if (pageButton) {
            if (pageButton.dataset.apiPage === 'chat') renderChat();
            if (pageButton.dataset.apiPage === 'image') renderImage();
            if (pageButton.dataset.apiPage === 'voice') renderVoice();
            if (pageButton.dataset.apiPage === 'video') renderVideo();
            return;
        }
        if (event.target.closest('[data-api-back]')) {
            if (page === 'home') close(); else renderHome();
            return;
        }
        var slotButton = event.target.closest('[data-chat-slot]');
        if (slotButton) {
            chatSlot = slotButton.dataset.chatSlot;
            loadChat();
            return;
        }
        var providerButton = event.target.closest('[data-voice-provider]');
        if (providerButton) {
            voiceProvider = providerButton.dataset.voiceProvider;
            renderVoice();
            return;
        }
        var presetSaveButton = event.target.closest('[data-api-preset-save]');
        if (presetSaveButton) {
            savePreset();
            return;
        }
        if (event.target.closest('[data-api-preset-delete]')) {
            deletePreset();
            return;
        }
        if (event.target.closest('[data-api-models]')) fetchModels();
        if (event.target.closest('[data-api-save]')) save();
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('[data-api-preset-cancel]')) {
            var modal = document.getElementById('apiV2PresetModal');
            if (modal) modal.remove();
        }
        if (event.target.closest('[data-api-preset-confirm]')) confirmPresetSave();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && document.activeElement && document.activeElement.id === 'apiV2PresetNameInput') confirmPresetSave();
    });

    host.addEventListener('change', function (event) {
        if (event.target.matches('[data-api-preset-select]') && event.target.value !== '') loadPreset(event.target.value);
    });

    window.openApiConfig = show;
    window.closeApiConfig = function () {
        if (page === 'home') close(); else renderHome();
    };
})();
