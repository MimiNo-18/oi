(function () {
    'use strict';

    const ITUNES_API = 'https://itunes.apple.com/search';
    const AUDIUS_DIRECTORY = 'https://api.audius.co';
    const LRCLIB_API = 'https://lrclib.net/api';
    const FALLBACK_COVER = 'https://jsd.onmicrosoft.cn/gh/mydracula/image@master/20260811/c3db77382dac477485f7672eb3c05d09.jpg';
    const T = {
        albums: '\u4e13\u8f91', addAlbum: '\u6dfb\u52a0\u4e13\u8f91', daily: '\u6bcf\u65e5\u63a8\u8350',
        search: '\u641c\u7d22\u5168\u7f51\u516c\u5f00\u97f3\u4e50', noResult: '\u6ca1\u6709\u627e\u5230\u53ef\u64ad\u653e\u7684\u97f3\u4e50',
        loading: '\u6b63\u5728\u52a0\u8f7d', searching: '\u6b63\u5728\u641c\u7d22', noSongs: '\u6682\u65e0\u6b4c\u66f2',
        import: '\u5bfc\u5165\u97f3\u4e50', local: '\u672c\u5730\u5bfc\u5165', link: '\u94fe\u63a5\u5bfc\u5165', cancel: '\u53d6\u6d88',
        songName: '\u6b4c\u66f2\u540d', artist: '\u4f5c\u8005 / \u6b4c\u624b', songUrl: '\u6b4c\u66f2\u94fe\u63a5',
        lyricsFile: '\u6b4c\u8bcd LRC \u6587\u4ef6', lyricsUrl: '\u6b4c\u8bcd\u94fe\u63a5', coverFile: '\u5c01\u9762\u56fe\u7247', coverUrl: '\u5c01\u9762\u94fe\u63a5', importLyrics: '\u5bfc\u5165\u6b4c\u8bcd', importImage: '\u5bfc\u5165\u56fe\u7247',
        albumName: '\u4e13\u8f91\u540d\u79f0', albumDesc: '\u4e13\u8f91\u7b80\u4ecb', createAlbum: '\u521b\u5efa\u4e13\u8f91',
        nowPlaying: 'NOW PLAYING', playlist: '\u64ad\u653e\u5217\u8868', noLyrics: '\u8fd9\u9996\u6b4c\u6ca1\u6709\u6b4c\u8bcd',
        back: '\u8fd4\u56de', emptyAlbums: '\u70b9\u51fb\u52a0\u53f7\u5bfc\u5165\u7b2c\u4e00\u5f20\u4e13\u8f91',
        localTip: '\u9009\u62e9\u540e\u4f1a\u5f39\u51fa\u6b4c\u66f2\u8d44\u6599', imported: '\u5bfc\u5165\u6210\u529f',
        modeSingle: '\u5df2\u5f00\u542f\u5355\u66f2\u5faa\u73af', modeList: '\u5df2\u5f00\u542f\u5217\u8868\u64ad\u653e', modeRandom: '\u5df2\u5f00\u542f\u968f\u673a\u64ad\u653e'
    };

    const icons = {
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
        plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
        arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
        heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>',
        play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
        previous: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM18.5 5.5v13L9 12z"/></svg>',
        next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM5.5 5.5v13L15 12z"/></svg>',
        list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>',
        repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
        repeatOne: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/><path d="M12 10v5M10.5 10H12"/></svg>',
        shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>'
    };

    const state = {
        tab: 'home', currentId: null, playing: false, mode: 'list', playQueue: [], lyrics: [], lyricsTrackId: null,
        daily: [], searchResults: [], albums: readJson('mimi_music_albums', []), tracks: readJson('mimi_music_tracks', []), favorites: readJson('mimi_music_favorites', [])
    };
    let app, view, audio, navCover, searchTimer, lyricsTimer, toastTimer, audiusHost;
    let lyricsUserScrolling = false;
    let lyricsAutoScrolling = false;
    let lyricsActiveIndex = -1;

    function readJson(key, fallback) {
        try { const value = JSON.parse(localStorage.getItem(key)); return Array.isArray(value) ? value : fallback; } catch (e) { return fallback; }
    }
    function saveState() {
        localStorage.setItem('mimi_music_albums', JSON.stringify(state.albums));
        localStorage.setItem('mimi_music_tracks', JSON.stringify(state.tracks.filter(function (track) { return !track.local; })));
        localStorage.setItem('mimi_music_favorites', JSON.stringify(state.favorites));
    }
    function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]; }); }
    function safeCover(url) { try { const parsed = new URL(url, window.location.href); return /^(https?:|data:|blob:)$/.test(parsed.protocol) ? parsed.href : FALLBACK_COVER; } catch (e) { return FALLBACK_COVER; } }
    function currentTrack() { return state.tracks.find(function (track) { return track.id === state.currentId; }) || state.daily.find(function (track) { return track.id === state.currentId; }) || null; }
    function allKnownTracks() { const map = {}; state.tracks.concat(state.daily, state.searchResults).forEach(function (track) { if (track && track.id) map[track.id] = track; }); return Object.keys(map).map(function (id) { return map[id]; }); }
    async function itunesSearch(keyword, limit) {
        const url = ITUNES_API + '?term=' + encodeURIComponent(keyword) + '&media=music&entity=song&country=CN&limit=' + (limit || 12);
        const response = await fetch(url);
        if (!response.ok) throw new Error('itunes search failed');
        const data = await response.json();
        return (data.results || []).filter(function (song) { return song.previewUrl; }).map(function (song) {
            return { id: 'itunes-' + song.trackId, sourceId: song.trackId, name: song.trackName || '\u672a\u547d\u540d', artist: song.artistName || '\u672a\u77e5\u6b4c\u624b', album: song.collectionName || 'Apple Music', src: song.previewUrl, cover: String(song.artworkUrl100 || FALLBACK_COVER).replace('100x100bb', '600x600bb'), duration: Number(song.trackTimeMillis) / 1000 || 0, lrc: '', source: 'Apple Music Preview', remote: true };
        });
    }
    async function getAudiusHost() {
        if (audiusHost) return audiusHost;
        const response = await fetch(AUDIUS_DIRECTORY);
        if (!response.ok) throw new Error('audius directory failed');
        const payload = await response.json();
        const hosts = payload && payload.data;
        if (!Array.isArray(hosts) || !hosts.length) throw new Error('no audius host');
        audiusHost = hosts[Math.floor(Math.random() * hosts.length)].replace(/\/$/, '');
        return audiusHost;
    }
    async function audiusSearch(keyword, limit) {
        const host = await getAudiusHost();
        const response = await fetch(host + '/v1/tracks/search?query=' + encodeURIComponent(keyword) + '&limit=' + (limit || 12) + '&app_name=MimiPhone');
        if (!response.ok) throw new Error('audius search failed');
        const payload = await response.json();
        return (payload.data || []).map(function (song) {
            const artwork = song.artwork || {};
            return { id: 'audius-' + song.id, sourceId: song.id, name: song.title || '\u672a\u547d\u540d', artist: song.user && song.user.name || '\u672a\u77e5\u6b4c\u624b', album: song.album_name || 'Audius', src: host + '/v1/tracks/' + song.id + '/stream?app_name=MimiPhone', cover: artwork['480x480'] || artwork['150x150'] || FALLBACK_COVER, duration: Number(song.duration) || 0, lrc: '', source: 'Audius Full Track', remote: true };
        });
    }
    async function publicSearch(keyword, limit) {
        const results = await Promise.allSettled([audiusSearch(keyword, limit), itunesSearch(keyword, limit)]);
        const merged = [];
        results.forEach(function (result) { if (result.status === 'fulfilled') merged.push.apply(merged, result.value); });
        const seen = {};
        return merged.filter(function (track) { const key = (track.name + '|' + track.artist).toLowerCase(); if (seen[key]) return false; seen[key] = true; return true; });
    }
    async function loadDaily() {
        const terms = ['\u534e\u8bed', '\u5468\u6770\u4f26', '\u6797\u4fca\u6770', '\u9648\u5955\u8fc5', '\u8f7b\u97f3\u4e50'];
        try {
            const selected = terms.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3);
            const groups = await Promise.all(selected.map(function (term) { return publicSearch(term, 18); }));
            const seen = {};
            state.daily = groups.flat().filter(function (track) { if (seen[track.id]) return false; seen[track.id] = true; return true; }).sort(function () { return Math.random() - 0.5; }).slice(0, 12);
            if (!state.currentId && state.daily[0]) state.currentId = state.daily[0].id;
            renderHome();
        } catch (e) { state.daily = []; renderHome(); }
    }
    function normalizeMetadata(value) {
        return String(value || '').normalize('NFKC').toLowerCase().replace(/\([^)]*(live|remaster|version|feat|ft\.)[^)]*\)/g, ' ').replace(/\[[^\]]*(live|remaster|version|feat|ft\.)[^\]]*\]/g, ' ').replace(/\b(feat|ft)\.?\s+.*$/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    }
    function metadataScore(expected, actual) {
        const left = normalizeMetadata(expected);
        const right = normalizeMetadata(actual);
        if (!left || !right) return 0;
        if (left === right) return 1;
        if (left.includes(right) || right.includes(left)) return Math.min(left.length, right.length) / Math.max(left.length, right.length);
        const a = new Set(left.split(/\s+/));
        const b = new Set(right.split(/\s+/));
        let common = 0;
        a.forEach(function (token) { if (b.has(token)) common += 1; });
        return common / Math.max(a.size, b.size, 1);
    }
    function lyricsMatchScore(track, candidate) {
        const title = metadataScore(track.name, candidate.trackName);
        const artist = metadataScore(track.artist, candidate.artistName);
        if (title < 0.78 || artist < 0.55) return -1;
        const candidateDuration = Number(candidate.duration) || 0;
        const expectedDuration = Number(track.duration) || 0;
        if (candidateDuration && expectedDuration && Math.abs(candidateDuration - expectedDuration) > Math.max(8, expectedDuration * 0.04)) return -1;
        const durationBonus = candidateDuration && expectedDuration ? Math.max(0, 1 - Math.abs(candidateDuration - expectedDuration) / 8) : 0;
        return title * 0.55 + artist * 0.35 + durationBonus * 0.1;
    }
    async function loadLyricsForTrack(track) {
        if (!track || track.lyricsLoading) return;
        if (track.lrc && (!track.remote || track.lyricsProvider === 'lrclib-v2')) return;
        if (track.remote && track.lyricsProvider !== 'lrclib-v2') track.lrc = '';
        track.lyricsLoading = true;
        try {
            const url = LRCLIB_API + '/search?track_name=' + encodeURIComponent(track.name) + '&artist_name=' + encodeURIComponent(track.artist);
            const response = await fetch(url, { headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('lyrics failed');
            const data = await response.json();
            const matches = Array.isArray(data) ? data.filter(function (item) { return item.syncedLyrics; }).map(function (item) { return { item: item, score: lyricsMatchScore(track, item) }; }).filter(function (entry) { return entry.score >= 0; }).sort(function (a, b) { return b.score - a.score; }) : [];
            if (matches[0]) { track.lrc = matches[0].item.syncedLyrics; track.lyricsProvider = 'lrclib-v2'; }
        } catch (e) {
            track.lrc = track.lrc || '';
        } finally {
            track.lyricsLoading = false;
            if (state.currentId === track.id) { state.lyrics = parseLyrics(track.lrc); if (document.querySelector('.music-lyrics-page')) renderLyrics(); }
        }
    }
    function formatTime(seconds) { return Number.isFinite(seconds) ? Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0') : '0:00'; }
    function getQueue() {
        const known = {};
        allKnownTracks().forEach(function (track) { known[track.id] = track; });
        const queued = state.playQueue.map(function (id) { return known[id]; }).filter(Boolean);
        if (queued.length) return queued;
        const seen = {};
        return state.daily.concat(state.tracks).filter(function (track) { if (!track || seen[track.id]) return false; seen[track.id] = true; return true; });
    }
    function trackRow(track) {
        const liked = state.favorites.includes(track.id);
        return '<div class="music-track-row' + (state.currentId === track.id ? ' is-current' : '') + '" data-track-id="' + escapeHtml(track.id) + '" role="button" tabindex="0"><img class="music-track-cover" src="' + safeCover(track.cover) + '" alt="' + escapeHtml(track.name) + '" loading="lazy"><span class="music-track-copy"><span class="music-track-name">' + escapeHtml(track.name) + '</span><span class="music-track-artist">' + escapeHtml(track.artist + (track.source ? ' · ' + track.source : '')) + '</span></span><button class="music-track-action' + (liked ? ' is-liked' : '') + '" type="button" data-like-id="' + escapeHtml(track.id) + '" aria-label="收藏">' + icons.heart + '</button></div>';
    }
    function bindTrackRows(root) {
        root.querySelectorAll('[data-track-id]').forEach(function (row) {
            row.addEventListener('click', function (event) { if (!event.target.closest('[data-like-id]')) { state.playQueue = Array.from(root.querySelectorAll('[data-track-id]')).map(function (item) { return item.dataset.trackId; }); playTrack(row.dataset.trackId); } });
            row.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); state.playQueue = Array.from(root.querySelectorAll('[data-track-id]')).map(function (item) { return item.dataset.trackId; }); playTrack(row.dataset.trackId); } });
        });
        root.querySelectorAll('[data-like-id]').forEach(function (button) { button.addEventListener('click', function (event) { event.stopPropagation(); toggleFavorite(button.dataset.likeId); }); });
    }
    function renderHome() {
        const albums = state.albums;
        const cards = albums.map(function (album) { return '<button class="music-album-card" type="button" data-album-id="' + escapeHtml(album.id) + '"><img class="music-album-cover" src="' + safeCover(album.cover) + '" alt="' + escapeHtml(album.name) + '"><span class="music-album-card-name">' + escapeHtml(album.name) + '</span></button>'; }).join('');
        view.innerHTML = '<section class="music-page music-home-page"><div class="music-page-inner"><h1 class="music-page-title" data-music-exit>MUSIC</h1><div class="music-search-row"><label class="music-search-shell">' + icons.search + '<input id="musicSearchInput" class="music-search-input" type="search" placeholder="' + T.search + '" autocomplete="off"></label><button class="music-add-btn" type="button" data-import-music aria-label="' + T.import + '">' + icons.plus + '</button></div></div><div id="musicSearchResults" class="music-search-results" hidden></div><div class="music-heading-row"><h2 class="music-section-title">' + T.albums + '</h2>' + (albums.length > 4 ? '<button class="music-album-next" type="button" aria-label="' + T.albums + '">' + icons.arrow + '</button>' : '') + '</div><div id="musicAlbumStrip" class="music-album-strip"><button class="music-album-card music-add-album-card" type="button" data-add-album><span class="music-album-add-cover">' + icons.plus + '</span><span class="music-album-card-name">' + T.addAlbum + '</span></button>' + (cards || '') + '</div><div class="music-heading-row"><h2 class="music-section-title">' + T.daily + '</h2><button class="music-shuffle-btn" type="button" data-refresh-daily aria-label="' + T.daily + '">' + icons.shuffle + '</button></div><div class="music-track-list">' + (state.daily.length ? state.daily.map(trackRow).join('') : '<div class="music-empty">' + (state.daily === null ? T.loading : T.noSongs) + '</div>') + '</div></section>';
        view.querySelector('[data-music-exit]').addEventListener('click', closeMusicApp);
        view.querySelectorAll('[data-add-album]').forEach(function (button) { button.addEventListener('click', openAlbumDialog); });
        view.querySelector('[data-import-music]').addEventListener('click', openImportChoice);
        view.querySelector('[data-refresh-daily]').addEventListener('click', function () { state.daily = []; renderHome(); loadDaily(); });
        view.querySelectorAll('[data-album-id]').forEach(function (button) { button.addEventListener('click', function () { renderAlbumDetail(button.dataset.albumId); }); });
        const next = view.querySelector('.music-album-next');
        if (next) next.addEventListener('click', function () { document.getElementById('musicAlbumStrip').scrollBy({ left: 240, behavior: 'smooth' }); });
        bindSearch(); bindTrackRows(view);
    }
    function bindSearch() {
        const input = document.getElementById('musicSearchInput'); const results = document.getElementById('musicSearchResults');
        input.addEventListener('input', function () { const query = input.value.trim(); window.clearTimeout(searchTimer); if (!query) { results.hidden = true; return; } results.hidden = false; results.innerHTML = '<div class="music-search-empty">' + T.searching + '</div>'; searchTimer = window.setTimeout(async function () { try { state.searchResults = await publicSearch(query, 20); results.innerHTML = state.searchResults.length ? state.searchResults.map(trackRow).join('') : '<div class="music-search-empty">' + T.noResult + '</div>'; bindTrackRows(results); } catch (e) { results.innerHTML = '<div class="music-search-empty">' + T.noResult + '</div>'; } }, 260); });
    }
    function renderAlbumList() {
        view.scrollTop = 0;
        view.innerHTML = '<section class="music-page"><header class="music-album-list-head"><h1 class="music-page-title music-album-list-title" data-album-back>Albums</h1><div class="music-album-list-subtitle">' + state.albums.length + ' \u5f20\u4e13\u8f91</div></header><div class="music-album-list">' + (state.albums.length ? state.albums.map(function (album) { return '<button class="music-album-list-row" type="button" data-open-album="' + escapeHtml(album.id) + '"><img src="' + safeCover(album.cover) + '" alt="' + escapeHtml(album.name) + '"><span class="music-album-list-copy"><span class="music-album-list-name">' + escapeHtml(album.name) + '</span><span class="music-album-list-desc">' + escapeHtml(album.desc) + '</span></span></button>'; }).join('') : '<div class="music-empty">' + T.emptyAlbums + '</div>') + '</div></section>';
        view.querySelector('[data-album-back]').addEventListener('click', renderHome); view.querySelectorAll('[data-open-album]').forEach(function (button) { button.addEventListener('click', function () { renderAlbumDetail(button.dataset.openAlbum); }); });
    }
    function renderAlbumDetail(albumId) {
        const album = state.albums.find(function (item) { return item.id === albumId; }); const songs = state.tracks.filter(function (track) { return track.albumId === albumId; });
        view.scrollTop = 0; view.innerHTML = '<section class="music-page"><header class="music-album-list-head"><h1 class="music-page-title music-album-list-title" data-album-back>' + escapeHtml(album ? album.name : T.albums) + '</h1><div class="music-album-list-subtitle">' + (album ? escapeHtml(album.desc) : '') + '</div></header><div class="music-track-list">' + (songs.length ? songs.map(trackRow).join('') : '<div class="music-empty">' + T.noSongs + '</div>') + '</div></section>'; view.querySelector('[data-album-back]').addEventListener('click', renderAlbumList); bindTrackRows(view);
    }
    function makeDialog(title, content, onSubmit) {
        const backdrop = document.createElement('div'); backdrop.className = 'music-dialog-backdrop'; backdrop.innerHTML = '<form class="music-dialog"><h2 class="music-dialog-title">' + title + '</h2>' + content + '<div class="music-dialog-actions"><button class="music-dialog-btn" type="button" data-dialog-close>' + T.cancel + '</button><button class="music-dialog-btn is-primary" type="submit">' + title + '</button></div></form>'; app.appendChild(backdrop);
        const close = function () { backdrop.remove(); }; backdrop.querySelector('[data-dialog-close]').addEventListener('click', close); backdrop.addEventListener('click', function (event) { if (event.target === backdrop) close(); }); backdrop.querySelector('form').addEventListener('submit', function (event) { event.preventDefault(); onSubmit(new FormData(event.currentTarget), close, event.currentTarget); });
        const first = backdrop.querySelector('input'); if (first) first.focus(); return backdrop;
    }
    function field(label, name, type, extra) { return '<label class="music-field">' + label + '<input name="' + name + '" type="' + (type || 'text') + '" ' + (extra || '') + '></label>'; }
    function fileField(name, accept, text) { return '<label class="music-field music-file-field"><span class="music-file-control" data-file-label="' + name + '">' + text + '</span><input name="' + name + '" type="file" accept="' + accept + '"></label>'; }
    function bindFileControls(root) { root.querySelectorAll('.music-file-field input').forEach(function (input) { input.addEventListener('change', function () { const label = root.querySelector('[data-file-label="' + input.name + '"]'); if (label) label.textContent = input.files && input.files[0] ? input.files[0].name : (input.name === 'coverFile' ? T.importImage : T.importLyrics); }); }); }
    function openImportChoice() {
        const backdrop = makeDialog(T.import, '<div class="music-choice-grid"><button type="button" class="music-choice-btn" data-local>' + T.local + '</button><button type="button" class="music-choice-btn" data-link>' + T.link + '</button></div>', function () {});
        backdrop.querySelector('button[type="submit"]').style.display = 'none';
        backdrop.querySelector('form').addEventListener('submit', function (event) { event.preventDefault(); });
        backdrop.querySelector('[data-local]').addEventListener('click', function () { backdrop.remove(); chooseAudioFile(); });
        backdrop.querySelector('[data-link]').addEventListener('click', function () { backdrop.remove(); openLinkImportDialog(); });
    }
    function chooseAudioFile() {
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'audio/*,.mp3,.m4a,.awb,.flac,.wav,.aac,.ogg'; input.style.display = 'none'; document.body.appendChild(input); input.addEventListener('change', function () { const file = input.files && input.files[0]; input.remove(); if (file) openTrackDialog({ file: file }); }); input.click();
    }
    function openLinkImportDialog() {
        openTrackDialog({ link: true });
    }
    function openTrackDialog(options) {
        const albumOptions = state.albums.map(function (album) { return '<option value="' + escapeHtml(album.id) + '">' + escapeHtml(album.name) + '</option>'; }).join('');
        const coverInputs = '<div class="music-form-split">' + field(T.coverUrl, 'coverUrl', 'url', 'placeholder="https://..."') + fileField('coverFile', 'image/*', T.importImage) + '</div>';
        const lyricsInputs = '<div class="music-form-split">' + field(T.lyricsUrl, 'lyricsUrl', 'url', 'placeholder="https://...lrc"') + fileField('lyricsFile', '.lrc,text/plain', T.importLyrics) + '</div>';
        const audioInput = options.link ? field(T.songUrl, 'songUrl', 'url', 'required placeholder="https://..."') : '<p class="music-dialog-hint">' + T.localTip + '</p>';
        const backdrop = makeDialog(T.import, audioInput + field(T.songName, 'name', 'text', 'required maxlength="80"') + field(T.artist, 'artist', 'text', 'required maxlength="60"') + '<label class="music-field">' + T.albums + '<select name="albumId"><option value="">-</option>' + albumOptions + '</select></label>' + lyricsInputs + coverInputs, async function (data, close, form) {
            const name = String(data.get('name') || '').trim(); const artist = String(data.get('artist') || '').trim(); if (!name || !artist) return;
            const audioFile = options.file; const lyricsFile = data.get('lyricsFile'); const coverFile = data.get('coverFile');
            const track = { id: 'local-' + Date.now(), name: name, artist: artist, album: '', albumId: String(data.get('albumId') || ''), src: options.link ? String(data.get('songUrl') || '').trim() : URL.createObjectURL(audioFile), cover: safeCover(String(data.get('coverUrl') || '').trim()), lrc: '', local: !options.link };
            if (lyricsFile && lyricsFile.size) track.lrc = await readText(lyricsFile); else if (data.get('lyricsUrl')) { try { track.lrc = decodeTextBuffer(await (await fetch(String(data.get('lyricsUrl')))).arrayBuffer()); } catch (e) {} }
            if (coverFile && coverFile.size) track.cover = await readDataUrl(coverFile);
            if (!track.cover) track.cover = FALLBACK_COVER;
            state.tracks.unshift(track); if (!state.currentId) state.currentId = track.id; saveState(); close(); renderHome();
        });
        bindFileControls(backdrop);
    }
    function openAlbumDialog() {
        const content = field(T.albumName, 'name', 'text', 'required maxlength="40"') + field(T.albumDesc, 'desc', 'text', 'maxlength="120"') + '<div class="music-form-split">' + field(T.coverUrl, 'coverUrl', 'url', 'placeholder="https://..."') + fileField('coverFile', 'image/*', T.importImage) + '</div>';
        const backdrop = makeDialog(T.createAlbum, content, async function (data, close) { const name = String(data.get('name') || '').trim(); if (!name) return; const file = data.get('coverFile'); const album = { id: 'album-' + Date.now(), name: name, desc: String(data.get('desc') || '').trim() || T.addAlbum, cover: safeCover(String(data.get('coverUrl') || '').trim()) }; if (file && file.size) album.cover = await readDataUrl(file); state.albums.push(album); saveState(); close(); renderHome(); });
        bindFileControls(backdrop);
    }
    function readDataUrl(file) { return new Promise(function (resolve) { const reader = new FileReader(); reader.onload = function () { resolve(String(reader.result || '')); }; reader.onerror = function () { resolve(''); }; reader.readAsDataURL(file); }); }
    function decodeTextBuffer(buffer) {
        const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
        if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes).replace(/^\uFEFF/, '');
        if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes).replace(/^\uFEFF/, '');
        const encodings = ['utf-8', 'gb18030', 'big5'];
        for (let i = 0; i < encodings.length; i += 1) {
            try { return new TextDecoder(encodings[i], { fatal: true }).decode(bytes).replace(/^\uFEFF/, ''); } catch (e) {}
        }
        return new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF/, '');
    }
    function readText(file) { return file.arrayBuffer().then(decodeTextBuffer).catch(function () { return ''; }); }
    function parseLyrics(text) {
        const lines = [];
        const source = String(text || '').replace(/\u0000/g, '');
        const offsetMatch = source.match(/\[offset:([+-]?\d+)\]/i);
        const offset = offsetMatch ? Number(offsetMatch[1]) / 1000 : 0;
        source.split(/\r?\n/).forEach(function (rawLine) {
            const stamps = Array.from(rawLine.matchAll(/\[(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:[.:]\d+)?)\]/g));
            if (!stamps.length) return;
            const content = rawLine.replace(/\[(?:(?:\d+):)?\d{1,2}:\d{1,2}(?:[.:]\d+)?\]/g, '').replace(/<\d{1,2}:\d{1,2}(?:[.:]\d+)?>/g, '').trim();
            stamps.forEach(function (stamp) {
                const hours = Number(stamp[1] || 0);
                const minutes = Number(stamp[2] || 0);
                const seconds = Number(String(stamp[3]).replace(':', '.'));
                const time = Math.max(0, hours * 3600 + minutes * 60 + seconds + offset);
                if (Number.isFinite(time)) lines.push({ time: time, text: content || '...' });
            });
        });
        const seen = {};
        return lines.sort(function (a, b) { return a.time - b.time; }).filter(function (line) { const key = line.time.toFixed(3) + '|' + line.text; if (seen[key]) return false; seen[key] = true; return true; });
    }
    function renderPlayer() {
        const track = currentTrack() || { name: T.noSongs, artist: '', cover: FALLBACK_COVER }; const modeIcon = state.mode === 'single' ? icons.repeatOne : state.mode === 'random' ? icons.shuffle : icons.repeat;
        view.scrollTop = 0; view.innerHTML = '<section class="music-page music-player-page"><div class="music-player-kicker">' + T.nowPlaying + '</div><button class="music-player-disc ' + (state.playing ? 'is-playing' : '') + '" data-open-lyrics type="button"><img src="' + safeCover(track.cover) + '" alt="' + escapeHtml(track.name) + '"></button><div class="music-player-name">' + escapeHtml(track.name) + '</div><div class="music-player-artist">' + escapeHtml(track.artist) + '</div><input id="musicProgress" class="music-progress" type="range" min="0" max="100" value="0" aria-label="progress"><div class="music-time-row"><span id="musicCurrentTime">0:00</span><span id="musicDuration">0:00</span></div><div class="music-player-controls"><button class="music-control-btn" type="button" data-play-mode aria-label="play mode">' + modeIcon + '</button><button class="music-control-btn" type="button" data-player-previous aria-label="previous">' + icons.previous + '</button><button class="music-control-btn is-primary" type="button" data-player-toggle aria-label="play">' + (state.playing ? icons.pause : icons.play) + '</button><button class="music-control-btn" type="button" data-player-next aria-label="next">' + icons.next + '</button><button class="music-control-btn" type="button" data-playlist aria-label="playlist">' + icons.list + '</button></div></section>';
        view.querySelector('[data-open-lyrics]').addEventListener('click', renderLyrics); view.querySelector('[data-player-toggle]').addEventListener('click', togglePlayback); view.querySelector('[data-player-previous]').addEventListener('click', function () { stepTrack(-1); }); view.querySelector('[data-player-next]').addEventListener('click', function () { stepTrack(1); }); view.querySelector('[data-play-mode]').addEventListener('click', cycleMode); view.querySelector('[data-playlist]').addEventListener('click', openPlaylist); view.querySelector('#musicProgress').addEventListener('input', function (event) { if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * Number(event.target.value) / 100; }); updateProgress();
    }
    function renderLyrics() {
        const track = currentTrack(); if (!track) return; state.lyrics = parseLyrics(track.lrc); state.lyricsTrackId = track.id;
        view.innerHTML = '<section class="music-page music-lyrics-page"><header class="music-lyrics-head"><button type="button" data-lyrics-back aria-label="back">' + icons.arrow + '</button><div><div class="music-lyrics-title">' + escapeHtml(track.name) + '</div><div class="music-lyrics-artist">' + escapeHtml(track.artist) + '</div></div></header><div class="music-lyrics-stage"><div id="musicLyricsScroll" class="music-lyrics-scroll"><div class="music-lyrics-spacer"></div>' + (state.lyrics.length ? state.lyrics.map(function (line, index) { return '<button class="music-lyric-line" type="button" data-lyric-index="' + index + '" data-lyric-time="' + line.time + '">' + escapeHtml(line.text) + '</button>'; }).join('') : '<div class="music-empty">' + T.noLyrics + '</div>') + '<div class="music-lyrics-spacer"></div></div><div class="music-lyrics-marker" aria-hidden="true"></div></div></section>';
        view.querySelector('[data-lyrics-back]').addEventListener('click', renderPlayer);
        const scroll = document.getElementById('musicLyricsScroll');
        const beginUserScroll = function () { lyricsUserScrolling = true; lyricsAutoScrolling = false; window.clearTimeout(lyricsTimer); };
        scroll.addEventListener('pointerdown', beginUserScroll, { passive: true });
        scroll.addEventListener('touchstart', beginUserScroll, { passive: true });
        scroll.addEventListener('wheel', beginUserScroll, { passive: true });
        scroll.addEventListener('scroll', function () {
            if (!lyricsUserScrolling || lyricsAutoScrolling) return;
            window.clearTimeout(lyricsTimer);
            lyricsTimer = window.setTimeout(function () {
                if (!lyricsUserScrolling) return;
                const rect = scroll.getBoundingClientRect();
                const markerY = rect.top + rect.height / 2;
                let nearest = null;
                let distance = Infinity;
                scroll.querySelectorAll('[data-lyric-time]').forEach(function (line) {
                    const lineRect = line.getBoundingClientRect();
                    const d = Math.abs(lineRect.top + lineRect.height / 2 - markerY);
                    if (d < distance) { distance = d; nearest = line; }
                });
                if (nearest && Number.isFinite(audio.duration)) { audio.currentTime = Math.min(Number(nearest.dataset.lyricTime), Math.max(0, audio.duration - 0.05)); updateLyricsHighlight(); }
                lyricsUserScrolling = false;
            }, 260);
        }, { passive: true });
        scroll.querySelectorAll('[data-lyric-time]').forEach(function (line) { line.addEventListener('click', function () { if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(Number(line.dataset.lyricTime), Math.max(0, audio.duration - 0.05)); lyricsUserScrolling = false; updateLyricsHighlight(); }); });
        lyricsUserScrolling = false;
        lyricsAutoScrolling = false;
        lyricsActiveIndex = -1;
        updateLyricsScroll(true);
    }
    function activeLyricIndex() { let active = -1; state.lyrics.forEach(function (line, index) { if (audio.currentTime + 0.05 >= line.time) active = index; }); return active; }
    function updateLyricsHighlight() { const active = activeLyricIndex(); const changed = active !== lyricsActiveIndex; lyricsActiveIndex = active; document.querySelectorAll('.music-lyric-line').forEach(function (item, index) { item.classList.toggle('is-active', index === active); }); return { line: active >= 0 ? document.querySelector('[data-lyric-index="' + active + '"]') : null, changed: changed }; }
    function updateLyricsScroll(force) { const scroll = document.getElementById('musicLyricsScroll'); if (state.tab !== 'player' || !scroll) return; const track = currentTrack(); if (!track || state.lyricsTrackId !== track.id) return; const result = updateLyricsHighlight(); if (result.line && (force || (result.changed && state.playing && !lyricsUserScrolling))) { const targetTop = result.line.offsetTop + result.line.offsetHeight / 2 - scroll.clientHeight / 2; lyricsAutoScrolling = true; scroll.scrollTo({ top: Math.max(0, targetTop), behavior: force ? 'auto' : 'smooth' }); window.setTimeout(function () { lyricsAutoScrolling = false; }, force ? 0 : 420); } }
    function renderMine() { const liked = allKnownTracks().filter(function (track) { return state.favorites.includes(track.id); }); view.innerHTML = '<section class="music-page"><header class="music-mine-header"><h1 class="music-page-title" data-music-exit>Mine</h1><div class="music-mine-summary">' + state.favorites.length + ' favorites / ' + state.albums.length + ' albums</div></header><h2 class="music-section-title">Favorites</h2><div class="music-track-list">' + (liked.length ? liked.map(trackRow).join('') : '<div class="music-empty">' + T.noSongs + '</div>') + '</div></section>'; view.querySelector('[data-music-exit]').addEventListener('click', closeMusicApp); bindTrackRows(view); }
    function renderPlaylist() { const queue = getQueue(); const backdrop = document.createElement('div'); backdrop.className = 'music-dialog-backdrop music-playlist-backdrop'; backdrop.innerHTML = '<div class="music-dialog"><h2 class="music-dialog-title">' + T.playlist + '</h2><div class="music-playlist-list">' + (queue.length ? queue.map(trackRow).join('') : '<div class="music-empty">' + T.noSongs + '</div>') + '</div><div class="music-dialog-actions"><button class="music-dialog-btn" type="button" data-dialog-close>' + T.cancel + '</button></div></div>'; app.appendChild(backdrop); backdrop.querySelector('[data-dialog-close]').addEventListener('click', function () { backdrop.remove(); }); bindTrackRows(backdrop); }
    function openPlaylist() { renderPlaylist(); }
    function showModeToast() { const old = app.querySelector('.music-mode-toast'); if (old) old.remove(); window.clearTimeout(toastTimer); const toast = document.createElement('div'); toast.className = 'music-mode-toast'; toast.textContent = state.mode === 'single' ? T.modeSingle : state.mode === 'random' ? T.modeRandom : T.modeList; app.appendChild(toast); toastTimer = window.setTimeout(function () { toast.remove(); }, 1000); }
    function cycleMode() { state.mode = state.mode === 'single' ? 'list' : state.mode === 'list' ? 'random' : 'single'; renderPlayer(); showModeToast(); }
    function stepTrack(delta) { const queue = getQueue(); if (!queue.length) return; if (state.mode === 'random') { const choices = queue.length > 1 ? queue.filter(function (track) { return track.id !== state.currentId; }) : queue; playTrack(choices[Math.floor(Math.random() * choices.length)].id); return; } let index = queue.findIndex(function (track) { return track.id === state.currentId; }); index = (index + delta + queue.length) % queue.length; playTrack(queue[index].id); }
    function playTrack(id) { const track = allKnownTracks().find(function (item) { return item.id === id; }); if (!track) return; if (!state.tracks.some(function (item) { return item.id === track.id; })) state.tracks.push(track); state.currentId = id; state.lyrics = parseLyrics(track.lrc); if (track.duration || track.lrc) loadLyricsForTrack(track); navCover.src = safeCover(track.cover); audio.src = track.src; audio.play().then(function () { state.playing = true; setTab('player'); }).catch(function () { state.playing = false; setTab('player'); }); }
    function togglePlayback() { const track = currentTrack(); if (!track) return; if (!audio.src || audio.src !== track.src) audio.src = track.src; if (audio.paused) audio.play().then(function () { state.playing = true; renderPlayer(); }).catch(function () { state.playing = false; renderPlayer(); }); else { audio.pause(); state.playing = false; renderPlayer(); } }
    function toggleFavorite(id) { const index = state.favorites.indexOf(id); if (index >= 0) state.favorites.splice(index, 1); else state.favorites.push(id); saveState(); if (state.tab === 'home') renderHome(); else if (state.tab === 'mine') renderMine(); }
    function updateProgress() { const progress = document.getElementById('musicProgress'); if (progress && audio.duration) progress.value = String(audio.currentTime / audio.duration * 100); const current = document.getElementById('musicCurrentTime'); const duration = document.getElementById('musicDuration'); if (current) current.textContent = formatTime(audio.currentTime); if (duration) duration.textContent = formatTime(audio.duration); updateLyricsScroll(); }
    function setTab(tab) { state.tab = tab; app.querySelectorAll('[data-music-tab]').forEach(function (button) { button.classList.toggle('is-active', button.dataset.musicTab === tab); }); if (tab === 'player') renderPlayer(); else if (tab === 'mine') renderMine(); else renderHome(); }
    function openMusicApp() { app.hidden = false; document.body.classList.add('music-app-active'); setTab('home'); if (!state.daily.length) loadDaily(); }
    function closeMusicApp() { app.hidden = true; document.body.classList.remove('music-app-active'); }
    function init() { app = document.getElementById('musicApp'); view = document.getElementById('musicView'); audio = document.getElementById('musicAudio'); navCover = document.getElementById('musicNavCover'); if (!app || !view || !audio || !navCover) return; state.daily = []; navCover.src = FALLBACK_COVER; app.querySelectorAll('[data-music-tab]').forEach(function (button) { button.addEventListener('click', function () { setTab(button.dataset.musicTab); }); }); audio.addEventListener('timeupdate', updateProgress); audio.addEventListener('loadedmetadata', function () { const track = currentTrack(); if (track && Number.isFinite(audio.duration)) { track.duration = track.duration || audio.duration; loadLyricsForTrack(track); } updateProgress(); }); audio.addEventListener('play', function () { state.playing = true; navCover.classList.add('is-playing'); if (state.tab === 'player') renderPlayer(); }); audio.addEventListener('pause', function () { state.playing = false; navCover.classList.remove('is-playing'); if (state.tab === 'player') renderPlayer(); }); audio.addEventListener('ended', function () { if (state.mode === 'single') { audio.currentTime = 0; audio.play(); } else stepTrack(1); }); app.addEventListener('error', function (event) { if (event.target instanceof HTMLImageElement && event.target.src !== FALLBACK_COVER) event.target.src = FALLBACK_COVER; }, true); renderHome(); }
    window.openMusicApp = openMusicApp; window.closeMusicApp = closeMusicApp; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
