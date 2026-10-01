/* ============ Mik K歌 · 独立逻辑 ============ */
(function () {
    'use strict';

    /* ---------- 数据 ---------- */
    var ASSET = 'assets/mik/';
    var NOTE = {
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00,
        A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.26,
        F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77
    };
    function mel() {
        var args = Array.prototype.slice.call(arguments);
        return args.map(function (n) { return NOTE[n]; });
    }
    /* 真实K歌软件式伴奏：每首歌的和弦进行（每句1个和弦） */
    var SONG_CHORDS = {
        s1: ['Am', 'F', 'C', 'G'], s2: ['C', 'G', 'Am', 'F'], s3: ['C', 'G', 'Am', 'F'],
        s4: ['Am', 'F', 'C', 'G'], s5: ['Em', 'C', 'G', 'D'], s6: ['C', 'G', 'Am', 'F'],
        s7: ['C', 'G', 'Am', 'F'], s8: ['G', 'D', 'Em', 'C'], s9: ['Am', 'F', 'C', 'G'],
        s10: ['C', 'G', 'Am', 'F'], s11: ['C', 'G', 'Am', 'F'], s12: ['C', 'Am', 'F', 'G']
    };
    var CHORD = {
        C: [261.63, 329.63, 392.00], G: [196.00, 246.94, 293.66], Am: [220.00, 261.63, 329.63],
        F: [174.61, 220.00, 261.63], Dm: [146.83, 174.61, 220.00], Em: [164.81, 196.00, 246.94],
        D: [146.83, 185.00, 220.00]
    };
    var CHORD_BASS = { C: 130.81, G: 98.00, Am: 110.00, F: 87.31, Dm: 73.42, Em: 82.41, D: 73.42 };
    /* 每首歌：4 句歌词 + 16 音符旋律（4 组），句长 4.6s */
    var SONGS = [
        { id: 's1', title: '夜曲', artist: '周杰伦', albumId: 'a1', dur: '3:28',
          lines: [
              { t: 0, txt: '为你弹奏肖邦的夜曲' },
              { t: 4.6, txt: '纪念我死去的爱情' },
              { t: 9.2, txt: '跟夜风一样的声音' },
              { t: 13.8, txt: '心碎的很好听' }
          ],
          melA: ['A4','E4','A4','C5'], melB: ['B4','A4','G4','E4'], melC: ['A4','C5','E5','D5'], melD: ['C5','A4','G4','E4'] },
        { id: 's2', title: '晴天', artist: '周杰伦', albumId: 'a2', dur: '4:29',
          lines: [
              { t: 0, txt: '故事的小黄花' },
              { t: 4.6, txt: '从出生那年就飘着' },
              { t: 9.2, txt: '童年的荡秋千' },
              { t: 13.8, txt: '随记忆一直晃到现在' }
          ],
          melA: ['C5','E5','G5','E5'], melB: ['D5','C5','A4','G4'], melC: ['C5','E5','G5','A5'], melD: ['G5','E5','D5','C5'] },
        { id: 's3', title: '起风了', artist: '买辣椒也用券', albumId: 'a3', dur: '5:25',
          lines: [
              { t: 0, txt: '我曾难自拔于世界之大' },
              { t: 4.6, txt: '也沉溺于其中梦话' },
              { t: 9.2, txt: '不得真假 不做挣扎' },
              { t: 13.8, txt: '不惧笑话' }
          ],
          melA: ['G4','A4','C5','D5'], melB: ['E5','D5','C5','A4'], melC: ['G4','A4','C5','E5'], melD: ['D5','C5','A4','G4'] },
        { id: 's4', title: '光年之外', artist: '邓紫棋', albumId: 'a4', dur: '3:55',
          lines: [
              { t: 0, txt: '我没想到为了你我能疯狂到' },
              { t: 4.6, txt: '山崩海啸没有你根本不想逃' },
              { t: 9.2, txt: '大脑在颤抖' },
              { t: 13.8, txt: '像被谁下了咒' }
          ],
          melA: ['A4','C5','E5','D5'], melB: ['C5','A4','G4','A4'], melC: ['C5','E5','G5','E5'], melD: ['D5','C5','A4','G4'] },
        { id: 's5', title: '孤勇者', artist: '陈奕迅', albumId: 'a5', dur: '4:16',
          lines: [
              { t: 0, txt: '爱你孤身走暗巷' },
              { t: 4.6, txt: '爱你不跪的模样' },
              { t: 9.2, txt: '爱你对峙过绝望' },
              { t: 13.8, txt: '不肯哭一场' }
          ],
          melA: ['G4','B4','D5','E5'], melB: ['D5','B4','G4','A4'], melC: ['B4','D5','E5','G5'], melD: ['E5','D5','B4','G4'] },
        { id: 's6', title: '海阔天空', artist: 'Beyond', albumId: 'a6', dur: '5:28',
          lines: [
              { t: 0, txt: '原谅我这一生不羁放纵爱自由' },
              { t: 4.6, txt: '也会怕有一天会跌倒' },
              { t: 9.2, txt: '背弃了理想 谁人都可以' },
              { t: 13.8, txt: '哪会怕有一天只你共我' }
          ],
          melA: ['G4','A4','B4','D5'], melB: ['E5','D5','B4','A4'], melC: ['G4','A4','B4','E5'], melD: ['D5','B4','A4','G4'] },
        { id: 's7', title: '小幸运', artist: '田馥甄', albumId: 'a1', dur: '4:25',
          lines: [
              { t: 0, txt: '原来你是我最想留住的幸运' },
              { t: 4.6, txt: '原来我们和爱情曾经靠得那么近' },
              { t: 9.2, txt: '那为我对抗世界的决定' },
              { t: 13.8, txt: '那陪我淋的雨' }
          ],
          melA: ['C5','D5','E5','G5'], melB: ['E5','D5','C5','A4'], melC: ['G4','A4','C5','D5'], melD: ['E5','C5','D5','C5'] },
        { id: 's8', title: '平凡之路', artist: '朴树', albumId: 'a2', dur: '5:01',
          lines: [
              { t: 0, txt: '我曾经跨过山和大海' },
              { t: 4.6, txt: '也穿过人山人海' },
              { t: 9.2, txt: '我曾经拥有着一切' },
              { t: 13.8, txt: '转眼都飘散如烟' }
          ],
          melA: ['G4','A4','C5','C5'], melB: ['A4','G4','E4','G4'], melC: ['G4','A4','C5','D5'], melD: ['C5','A4','G4','E4'] },
        { id: 's9', title: '演员', artist: '薛之谦', albumId: 'a3', dur: '4:21',
          lines: [
              { t: 0, txt: '简单点 说话的方式简单点' },
              { t: 4.6, txt: '递进的情绪请省略' },
              { t: 9.2, txt: '你又不是个演员' },
              { t: 13.8, txt: '别设计那些情节' }
          ],
          melA: ['A4','C5','E5','E5'], melB: ['D5','C5','A4','G4'], melC: ['A4','C5','D5','E5'], melD: ['C5','A4','G4','A4'] },
        { id: 's10', title: '成都', artist: '赵雷', albumId: 'a4', dur: '5:28',
          lines: [
              { t: 0, txt: '和我在成都的街头走一走' },
              { t: 4.6, txt: '直到所有的灯都熄灭了也不停留' },
              { t: 9.2, txt: '你会挽着我的衣袖' },
              { t: 13.8, txt: '我会把手揣进裤兜' }
          ],
          melA: ['G4','A4','B4','D5'], melB: ['D5','B4','A4','G4'], melC: ['A4','B4','D5','E5'], melD: ['D5','B4','A4','G4'] },
        { id: 's11', title: '稻香', artist: '周杰伦', albumId: 'a5', dur: '3:43',
          lines: [
              { t: 0, txt: '还记得你说家是唯一的城堡' },
              { t: 4.6, txt: '随着稻香河流继续奔跑' },
              { t: 9.2, txt: '微微笑 小时候的梦我知道' },
              { t: 13.8, txt: '不要哭让萤火虫带着你逃跑' }
          ],
          melA: ['C5','D5','E5','G5'], melB: ['E5','D5','C5','D5'], melC: ['G4','A4','C5','E5'], melD: ['D5','C5','D5','C5'] },
        { id: 's12', title: '岁月神偷', artist: '金玟岐', albumId: 'a6', dur: '4:07',
          lines: [
              { t: 0, txt: '时间是让人猝不及防的东西' },
              { t: 4.6, txt: '晴时有风阴有时雨' },
              { t: 9.2, txt: '争不过朝夕 又念着往昔' },
              { t: 13.8, txt: '偷走了青丝却留住一个你' }
          ],
          melA: ['A4','B4','C5','E5'], melB: ['D5','C5','B4','A4'], melC: ['G4','A4','B4','D5'], melD: ['C5','B4','A4','G4'] }
    ];

    var ALBUMS = [
        { id: 'a1', name: '夜·声场', cover: ASSET + 'album1.jpg', desc: '深夜录音室里的即兴现场，安静但滚烫。', songs: ['s1', 's7'] },
        { id: 'a2', name: '晴空电台', cover: ASSET + 'album2.jpg', desc: '把夏天收进声波，一首首都是放晴的心情。', songs: ['s2', 's8'] },
        { id: 'a3', name: '风起时', cover: ASSET + 'album3.jpg', desc: '琴键落下时风也停了，适合一个人慢慢唱。', songs: ['s3', 's9'] },
        { id: 'a4', name: '星海漫游', cover: ASSET + 'album4.jpg', desc: '戴上耳机就是银河，适合飙高音的歌单。', songs: ['s4', 's10'] },
        { id: 'a5', name: '暗巷英雄', cover: ASSET + 'album5.jpg', desc: '写给每一个不肯低头的你，唱到破音也没关系。', songs: ['s5', 's11'] },
        { id: 'a6', name: '旧日金曲', cover: ASSET + 'album6.jpg', desc: '黑胶转动的年代感，经典永远不过时。', songs: ['s6', 's12'] }
    ];

    var ROOMS = [
        { id: 'r1', name: '都市夜归人', host: 'Momo', tag: '独唱', people: 86, hot: '9.8w', cover: ALBUMS[4].cover, songIds: ['s5', 's1', 's9'] },
        { id: 'r2', name: '情歌对唱PK', host: '阿澈', tag: 'PK', people: 42, hot: '4.2w', cover: ALBUMS[0].cover, songIds: ['s7', 's4', 's10'] },
        { id: 'r3', name: '声乐自习室', host: 'Sonia', tag: '练习', people: 23, hot: '1.6w', cover: ALBUMS[2].cover, songIds: ['s3', 's2', 's12'] },
        { id: 'r4', name: '粤语金曲馆', host: '老麦', tag: '粤语', people: 57, hot: '5.5w', cover: ALBUMS[5].cover, songIds: ['s6', 's8', 's2'] },
        { id: 'r5', name: '新歌首唱会', host: 'Luna', tag: '新歌', people: 31, hot: '2.8w', cover: ALBUMS[1].cover, songIds: ['s11', 's7', 's5'] },
        { id: 'r6', name: '深夜电台房', host: '知秋', tag: '电台', people: 18, hot: '9.9k', cover: ALBUMS[3].cover, songIds: ['s12', 's9', 's3'] }
    ];

    var MEMBER_NAMES = ['Momo', '阿澈', 'Sonia', '老麦', 'Luna', '知秋', '木木', 'Kiki', '白桃', '大熊', '晚风', '一粟'];

    /* 每首歌的和弦进行（4 句各一组）+ 和弦音高 */
    var CHORDS = {
        s1: ['Am', 'F', 'C', 'G'], s2: ['C', 'G', 'Am', 'F'], s3: ['G', 'Em', 'C', 'D'],
        s4: ['Am', 'F', 'C', 'G'], s5: ['Em', 'C', 'G', 'D'], s6: ['G', 'D', 'Em', 'C'],
        s7: ['C', 'G', 'Am', 'F'], s8: ['G', 'D', 'Em', 'C'], s9: ['Am', 'F', 'C', 'G'],
        s10: ['G', 'D', 'Em', 'C'], s11: ['C', 'G', 'Am', 'F'], s12: ['Am', 'F', 'C', 'G']
    };
    var CHORD_FREQS = {
        'Am': [220.00, 261.63, 329.63], 'F': [174.61, 220.00, 261.63],
        'C': [261.63, 329.63, 392.00], 'G': [196.00, 246.94, 293.66],
        'Em': [164.81, 196.00, 246.94], 'D': [146.83, 185.00, 220.00]
    };

    var PROFILE = {
        name: 'MikKeeper',
        id: 'MIK_10086',
        lv: 8,
        lvPct: 66,
        works: [
            { songId: 's1', grade: 'SSS', plays: '12.6w', time: '09-20' },
            { songId: 's7', grade: 'S', plays: '8.4w', time: '09-12' },
            { songId: 's6', grade: 'A', plays: '5.1w', time: '08-30' }
        ],
        stats: { works: 6, fans: '2.1w', follow: 12 }
    };

    function songById(id) {
        for (var i = 0; i < SONGS.length; i++) if (SONGS[i].id === id) return SONGS[i];
        return SONGS[0];
    }
    function albumById(id) {
        for (var i = 0; i < ALBUMS.length; i++) if (ALBUMS[i].id === id) return ALBUMS[i];
        return ALBUMS[0];
    }
    function albumSongs(album) {
        return album.songs.map(songById);
    }
    function coverOf(song) { return albumById(song.albumId).cover; }

    /* ---------- 状态 ---------- */
    var app = null, view = null;
    var tab = 'home';
    var favs = readJson('mik_favs', []);
    var toastTimer = null;

    function readJson(key, fallback) {
        try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
    }
    function saveFavs() { try { localStorage.setItem('mik_favs', JSON.stringify(favs)); } catch (e) {} }
    function isFav(id) { return favs.indexOf(id) >= 0; }
    function toggleFav(id) {
        var i = favs.indexOf(id);
        if (i >= 0) favs.splice(i, 1); else favs.push(id);
        saveFavs();
        renderHome();
    }
    function toast(msg) {
        if (!app) return;
        var el = document.getElementById('mikToast');
        el.textContent = msg;
        el.hidden = false;
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(function () { el.hidden = true; }, 1600);
    }

    /* ---------- 图标 ---------- */
    var IC = {
        k: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a5 5 0 0 0-5 5v4a5 5 0 0 0 10 0V8a5 5 0 0 0-5-5Z"/><path d="M5 12a7 7 0 0 0 14 0h-2a5 5 0 0 1-10 0H5Z"/><rect x="11" y="16" width="2" height="5" rx="1"/><path d="M8 21h8"/></svg>',
        people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16 14.5a4.2 4.2 0 0 1 4.5 4"/></svg>',
        mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3.5"/><path d="M8.5 21.5h7"/></svg>',
        pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>',
        restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
        heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>',
        arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
        back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>'
    };

    /* ---------- 渲染：首页 ---------- */
    function renderHome() {
        view.innerHTML =
            '<section class="mik-page is-in" data-page="home">' +
                '<h2 class="mik-section-title">热门推荐 <small>HOT · 拖动魔方看看</small></h2>' +
                '<div class="mik-cube-wrap" id="mikCubeWrap">' +
                    '<div class="mik-cube" id="mikCube">' + cubeFaces() + '</div>' +
                '</div>' +
                '<p class="mik-cube-hint">← 拖动旋转 · 点击专辑进入 →</p>' +
                '<h2 class="mik-section-title">热门专辑 <small>ALBUMS</small></h2>' +
                '<div class="mik-album-scroll">' + ALBUMS.map(function (a) {
                    return '<div class="mik-album-card" data-open-album="' + a.id + '">' +
                        '<div class="mik-album-cover" style="background-image:url(' + a.cover + ')"></div>' +
                        '<div class="mik-album-card-name">' + esc(a.name) + '</div>' +
                        '<div class="mik-album-card-meta">' + a.songs.length + ' 首 · ' + esc(a.desc.slice(0, 14)) + '</div>' +
                    '</div>';
                }).join('') + '</div>' +
                '<h2 class="mik-section-title">热门单曲 <small>TOP SONGS</small></h2>' +
                '<div class="mik-song-list">' + SONGS.map(songRow).join('') + '</div>' +
            '</section>';
        bindCube();
        bindListClicks(view);
    }
    function cubeFaces() {
        var faces = [];
        for (var i = 0; i < 6; i++) {
            var a = ALBUMS[i];
            faces.push('<div class="mik-cube-face" data-open-album="' + a.id + '" style="background-image:url(' + a.cover + ')">' +
                '<span class="mik-cube-face-tag">' + (i + 1) + ' / 6</span>' +
                '<span class="mik-cube-face-label">' + esc(a.name) + '</span></div>');
        }
        return faces.join('');
    }
    function songRow(song) {
        var fav = isFav(song.id);
        return '<div class="mik-song-row" data-song="' + song.id + '">' +
            '<div class="mik-song-cover" style="background-image:url(' + coverOf(song) + ')"></div>' +
            '<div class="mik-song-main"><div class="mik-song-title">' + esc(song.title) + '</div>' +
            '<div class="mik-song-artist">' + esc(song.artist) + ' · ' + song.dur + '</div></div>' +
            '<button class="mik-song-fav ' + (fav ? 'is-on' : '') + '" type="button" data-fav="' + song.id + '" aria-label="收藏">' +
            (fav ? '♥' : '♡') + '</button>' +
            '<button class="mik-song-kbtn" type="button" data-k="' + song.id + '">' + IC.k + ' K歌</button>' +
        '</div>';
    }

    /* ---------- 渲染：歌房 ---------- */
    function renderRoom() {
        view.innerHTML =
            '<section class="mik-page is-in" data-page="room">' +
                '<h2 class="mik-section-title">K歌房 <small>LIVE ROOMS</small></h2>' +
                '<div class="mik-room-list">' + ROOMS.map(function (r) {
                    return '<div class="mik-room-card" data-room="' + r.id + '">' +
                        '<div class="mik-room-cover" style="background-image:url(' + r.cover + ')"><span class="mik-room-live">LIVE</span></div>' +
                        '<div class="mik-room-main">' +
                            '<div class="mik-room-name">' + esc(r.name) + '</div>' +
                            '<div class="mik-room-host">房主 ' + esc(r.host) + '</div>' +
                            '<div class="mik-room-meta">' +
                                '<span class="mik-room-tag">' + esc(r.tag) + '</span>' +
                                '<span class="mik-room-people">' + IC.people + r.people + ' 人 · 热度 ' + r.hot + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                }).join('') + '</div>' +
            '</section>';
        bindListClicks(view);
    }

    /* ---------- 渲染：个人主页 ---------- */
    function renderProfile() {
        var p = PROFILE;
        var works = readWorks() || p.works;
        view.innerHTML =
            '<section class="mik-page is-in" data-page="profile">' +
                '<div class="mik-profile-head">' +
                    '<div class="mik-profile-avatar" style="background-image:url(' + ASSET + 'avatar.jpg)"></div>' +
                    '<div class="mik-profile-main">' +
                        '<div class="mik-profile-name">' + esc(p.name) + '</div>' +
                        '<div class="mik-profile-id">ID ' + esc(p.id) + '</div>' +
                        '<div class="mik-profile-lv">LV.<b>' + p.lv + '</b><span class="mik-lv-track"><i></i></span> ' + p.lvPct + '%</div>' +
                    '</div>' +
                '</div>' +
                '<div class="mik-profile-stats">' +
                    '<div class="mik-profile-stat" data-stat="作品"><b>' + p.stats.works + '</b><span>作品</span></div>' +
                    '<div class="mik-profile-stat" data-stat="粉丝"><b>' + p.stats.fans + '</b><span>粉丝</span></div>' +
                    '<div class="mik-profile-stat" data-stat="关注"><b>' + p.stats.follow + '</b><span>关注</span></div>' +
                '</div>' +
                '<h3 class="mik-section-sub">我的作品</h3>' +
                '<div class="mik-work-list">' + works.map(function (w) {
                    var s = songById(w.songId);
                    return '<div class="mik-work-card" data-k="' + s.id + '">' +
                        '<div class="mik-work-cover" style="background-image:url(' + coverOf(s) + ')"></div>' +
                        '<div class="mik-work-main">' +
                            '<div class="mik-work-title">' + esc(s.title) + ' <span style="color:var(--mik-muted);font-weight:500">- ' + esc(s.artist) + '</span></div>' +
                            '<div class="mik-work-meta">播放 ' + w.plays + ' · ' + w.time + '</div>' +
                        '</div>' +
                        '<span class="mik-grade-badge mik-grade-' + w.grade.toLowerCase() + '">' + w.grade + '</span>' +
                    '</div>';
                }).join('') + '</div>' +
                '<h3 class="mik-section-sub">更多</h3>' +
                '<div class="mik-menu-list">' +
                    menuItem('收藏', IC.heart, favs.length + ' 首') +
                    menuItem('黑胶会员', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.4"/></svg>', '未开通') +
                    menuItem('消息中心', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16v11H8l-4 4Z"/><path d="M8 10h8M8 13.5h5"/></svg>', '3 条未读') +
                    menuItem('设置', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z"/></svg>', '') +
                '</div>' +
            '</section>';
        bindListClicks(view);
    }
    function menuItem(name, icon, badge) {
        return '<div class="mik-menu-item" data-menu="' + name + '">' + icon + '<span>' + name + '</span>' +
            (badge ? '<span class="mik-menu-badge">' + badge + '</span>' : '') +
            '<span class="mik-menu-arrow">›</span></div>';
    }

    /* ---------- 通用点击绑定 ---------- */
    function bindListClicks(root) {
        root.querySelectorAll('[data-open-album]').forEach(function (el) {
            el.addEventListener('click', function () { openAlbum(el.dataset.openAlbum); });
        });
        root.querySelectorAll('[data-k]').forEach(function (el) {
            el.addEventListener('click', function () { openSing(songById(el.dataset.k)); });
        });
        root.querySelectorAll('[data-fav]').forEach(function (el) {
            el.addEventListener('click', function (e) { e.stopPropagation(); toggleFav(el.dataset.fav); });
        });
        root.querySelectorAll('[data-room]').forEach(function (el) {
            el.addEventListener('click', function () { openRoom(el.dataset.room); });
        });
        root.querySelectorAll('[data-stat]').forEach(function (el) {
            el.addEventListener('click', function () { toast('「' + el.dataset.stat + '」数据看板 · 演示中'); });
        });
        root.querySelectorAll('[data-menu]').forEach(function (el) {
            el.addEventListener('click', function () {
                if (el.dataset.menu === '收藏') { toast('共收藏 ' + favs.length + ' 首歌曲'); return; }
                toast('「' + el.dataset.menu + '」功能 · 演示中');
            });
        });
    }
    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /* ---------- 专辑详情 ---------- */
    function openAlbum(id) {
        var a = albumById(id);
        var s = document.createElement('div');
        s.className = 'mik-album-view';
        s.innerHTML =
            '<div class="mik-album-hero" style="background-image:url(' + a.cover + ')">' +
                '<div class="mik-album-hero-bar">' +
                    '<button class="mik-back" type="button" data-close-album>‹</button>' +
                    '<div class="mik-title-capsule" style="padding:6px 18px;font-size:13px">专辑</div>' +
                    '<span class="mik-header-spacer"></span>' +
                '</div>' +
                '<div class="mik-album-hero-info">' +
                    '<div class="mik-album-hero-name">' + esc(a.name) + '</div>' +
                    '<div class="mik-album-hero-meta">' + a.songs.length + ' 首歌曲 · 暗夜限定企划</div>' +
                '</div>' +
            '</div>' +
            '<div class="mik-album-body">' +
                '<p class="mik-album-desc">' + esc(a.desc) + '</p>' +
                '<h3 class="mik-section-sub">选一首，开始 K 歌</h3>' +
                '<div class="mik-song-list">' + albumSongs(a).map(songRow).join('') + '</div>' +
            '</div>';
        app.appendChild(s);
        s.querySelector('[data-close-album]').addEventListener('click', function () { s.remove(); });
        bindListClicks(s);
    }

    /* ---------- 房间详情 ---------- */
    function openRoom(id) {
        var r = null;
        for (var i = 0; i < ROOMS.length; i++) if (ROOMS[i].id === id) r = ROOMS[i];
        if (!r) return;
        var members = MEMBER_NAMES.slice(0, 6).map(function (name, i) {
            var hue = [210, 30, 150, 280, 190, 0][i];
            return '<div class="mik-room-member"><div class="mik-room-avatar" style="background:linear-gradient(135deg,hsl(' + hue + ',26%,30%),hsl(' + hue + ',22%,16%));display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700">' + esc(name[0]) + '</div><div class="mik-room-member-name">' + esc(name) + '</div></div>';
        }).join('');
        var queue = r.songIds.map(songById);
        var d = document.createElement('div');
        d.className = 'mik-room-view';
        d.innerHTML =
            '<div class="mik-room-hero" style="background-image:url(' + r.cover + ')">' +
                '<div class="mik-album-hero-bar">' +
                    '<button class="mik-back" type="button" data-close-room>‹</button>' +
                    '<div class="mik-title-capsule" style="padding:6px 18px;font-size:13px">LIVE</div>' +
                    '<span class="mik-header-spacer"></span>' +
                '</div>' +
                '<div class="mik-album-hero-info">' +
                    '<div class="mik-album-hero-name">' + esc(r.name) + '</div>' +
                    '<div class="mik-album-hero-meta">房主 ' + esc(r.host) + ' · ' + r.people + ' 人在线 · 热度 ' + r.hot + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="mik-room-body">' +
                '<h3 class="mik-section-sub">房内成员</h3>' +
                '<div class="mik-room-members">' + members + '</div>' +
                '<div class="mik-room-queue-title">点歌队列 <small>点击歌曲即可加入跟唱</small></div>' +
                '<div class="mik-song-list">' + queue.map(songRow).join('') + '</div>' +
            '</div>';
        app.appendChild(d);
        d.querySelector('[data-close-room]').addEventListener('click', function () { d.remove(); });
        bindListClicks(d);
    }

    /* ---------- Tab 切换 ---------- */
    function setTab(next) {
        tab = next;
        app.querySelectorAll('.mik-nav-bar').forEach(function (b) {
            b.classList.toggle('is-active', b.dataset.mikTab === next);
        });
        if (next === 'room') renderRoom();
        else if (next === 'profile') renderProfile();
        else renderHome();
    }

    /* ---------- 打开 / 关闭 ---------- */
    function openMikApp() {
        app.hidden = false;
        document.body.classList.add('mik-app-active');
        setTab('home');
    }
    function closeMikApp() {
        app.hidden = true;
        document.body.classList.remove('mik-app-active');
        stopSinging();
        app.querySelectorAll('.mik-album-view, .mik-room-view, .mik-sing, .mik-prep').forEach(function (n) { n.remove(); });
    }

    /* ---------- 3D 魔方轮播 ---------- */
    var cubeAngle = 0, cubeSpeed = 0.10, cubeDragged = false, cubeRaf = null;
    function bindCube() {
        var cube = document.getElementById('mikCube');
        var wrap = document.getElementById('mikCubeWrap');
        if (!cube || !wrap) return;
        var R = 217;
        Array.prototype.forEach.call(cube.children, function (face, i) {
            face.style.transform = 'rotateY(' + (i * 60) + 'deg) translateZ(' + R + 'px)';
            face.addEventListener('click', function (e) {
                if (wrap.__justDragged) { wrap.__justDragged = false; e.stopPropagation(); return; }
            });
        });
        cube.style.transform = 'rotateX(-7deg) rotateY(' + cubeAngle + 'deg)';
        function tick() {
            if (!wrap.__dragging) cubeAngle += cubeSpeed;
            cube.style.transform = 'rotateX(-7deg) rotateY(' + cubeAngle + 'deg)';
            cubeRaf = requestAnimationFrame(tick);
        }
        if (cubeRaf) cancelAnimationFrame(cubeRaf);
        cubeRaf = requestAnimationFrame(tick);
        var startX = 0, startY = 0, moved = false, pid = null;
        wrap.addEventListener('pointerdown', function (e) {
            wrap.__dragging = true;
            wrap.__justDragged = false;
            startX = e.clientX; startY = e.clientY; moved = false;
            wrap.classList.add('is-dragging');
            if (pid === null) pid = wrap.setPointerCapture(e.pointerId);
        });
        wrap.addEventListener('pointermove', function (e) {
            if (!wrap.__dragging) return;
            var dx = e.clientX - startX, dy = e.clientY - startY;
            if (Math.abs(dx) + Math.abs(dy) > 7) moved = true;
            cubeAngle += dx * 0.35;
            startX = e.clientX; startY = e.clientY;
            cubeSpeed = dx * 0.02;
        });
        function release() {
            if (moved) wrap.__justDragged = true;
            wrap.__dragging = false;
            wrap.classList.remove('is-dragging');
            pid = null;
            if (Math.abs(cubeSpeed) < 0.02) cubeSpeed = 0.10;
            if (cubeSpeed > 0.9) cubeSpeed = 0.9;
            if (cubeSpeed < -0.9) cubeSpeed = -0.9;
            setTimeout(function () { cubeSpeed = cubeSpeed < 0 ? -0.10 : 0.10; }, 1800);
        }
        wrap.addEventListener('pointerup', release);
        wrap.addEventListener('pointercancel', release);
    }

    /* ---------- K 歌引擎 ---------- */
    var S = {
        song: null, phase: 'idle', node: null,
        ctx: null, master: null, micStream: null, analyser: null, timer: null,
        startAt: 0, pausedAt: 0, notes: [], sentence: 0,
        sentScores: [], sentTexts: [], sentPitchSum: 0, sentPitchN: 0,
        pitchSum: 0, pitchN: 0, rhythmSum: 0, rhythmN: 0,
        singMs: 0, aliveMs: 0, singingOn: false, pauseCount: 0,
        micOk: false, demo: false, demoPitch: 76,
        semi: 0, volume: 0.9, originalOn: false
    };
    var NOTE_MS = 1150, SENT_MS = 4600, PRE_MS = 700, TOTAL_MS = 4 * SENT_MS + 900;

    function notesOf(song) {
        var groups = [song.melA, song.melB, song.melC, song.melD], out = [];
        for (var g = 0; g < 4; g++) {
            for (var k = 0; k < 4; k++) {
                out.push({ t: g * SENT_MS + k * NOTE_MS, d: NOTE_MS - 40, f: NOTE[groups[g][k]] });
            }
        }
        return out;
    }
    function openSing(song) {
        stopSinging();
        S.song = song; S.phase = 'prep';
        S.semi = 0; S.volume = 0.9; S.originalOn = false;
        var d = document.createElement('div');
        d.className = 'mik-prep';
        d.id = 'mikSingPrep';
        d.innerHTML =
            '<div class="mik-prep-bg" style="background-image:url(' + coverOf(song) + ')"></div>' +
            '<div class="mik-sing-header">' +
                '<button class="mik-back" type="button" id="mikPrepBack">‹</button>' +
                '<div class="mik-sing-songinfo"><div class="mik-sing-songname">' + esc(song.title) + '</div>' +
                '<div class="mik-sing-artist">' + esc(song.artist) + ' · 副歌片段 0:18</div></div>' +
                '<span class="mik-header-spacer"></span>' +
            '</div>' +
            '<div class="mik-prep-body">' +
                '<div class="mik-prep-cover" style="background-image:url(' + coverOf(song) + ')"></div>' +
                '<div class="mik-prep-name">' + esc(song.title) + '</div>' +
                '<div class="mik-prep-artist">' + esc(song.artist) + '</div>' +
                '<div class="mik-prep-label">调 性</div>' +
                '<div class="mik-tone-row">' +
                    '<button class="mik-tone-btn" type="button" data-tone="-1">降半音</button>' +
                    '<button class="mik-tone-btn is-active" type="button" data-tone="0">原调</button>' +
                    '<button class="mik-tone-btn" type="button" data-tone="1">升半音</button>' +
                '</div>' +
                '<div class="mik-prep-label">伴奏音量</div>' +
                '<div class="mik-volume-row">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5 6.5 9H3v6h3.5L11 19Z"/><path d="M15 9.5a4.5 4.5 0 0 1 0 5"/></svg>' +
                    '<div class="mik-volume-track" id="mikVolTrack"><i class="mik-volume-fill" id="mikVolFill"></i></div>' +
                    '<span class="mik-volume-num" id="mikVolNum">80%</span>' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5 6.5 9H3v6h3.5L11 19Z"/><path d="M15.5 8.5a6.5 6.5 0 0 1 0 7"/><path d="M18.5 5.5a10 10 0 0 1 0 13"/></svg>' +
                '</div>' +
                '<div class="mik-prep-label">演唱模式</div>' +
                '<div class="mik-tone-row">' +
                    '<button class="mik-tone-btn is-active" type="button" data-orig="0">伴奏</button>' +
                    '<button class="mik-tone-btn" type="button" data-orig="1">原唱演示</button>' +
                '</div>' +
                '<button class="mik-prep-start" type="button" id="mikPrepStart">' + IC.mic + ' 开始演唱</button>' +
                '<p class="mik-prep-tip">评分维度：音准 · 节奏 · 完整度 · 气息 · 参考全民K歌</p>' +
            '</div>';
        app.appendChild(d);
        d.querySelector('#mikPrepBack').addEventListener('click', function () { stopSinging(); d.remove(); });
        d.querySelectorAll('[data-tone]').forEach(function (b) {
            b.addEventListener('click', function () {
                S.semi = Number(b.dataset.tone);
                d.querySelectorAll('[data-tone]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
            });
        });
        d.querySelectorAll('[data-orig]').forEach(function (b) {
            b.addEventListener('click', function () {
                S.originalOn = b.dataset.orig === '1';
                d.querySelectorAll('[data-orig]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
            });
        });
        d.querySelector('#mikPrepStart').addEventListener('click', startSinging);
        bindVolume(d.querySelector('#mikVolTrack'));
        requestMic();
        S.node = d;
    }
    function bindVolume(track) {
        if (!track) return;
        function setFromEvent(e) {
            var rect = track.getBoundingClientRect();
            var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            S.volume = Math.max(0.05, pct);
            var fill = document.getElementById('mikVolFill');
            var num = document.getElementById('mikVolNum');
            if (fill) fill.style.width = (pct * 100) + '%';
            if (num) num.textContent = Math.round(pct * 100) + '%';
        }
        track.addEventListener('pointerdown', function (e) { track.setPointerCapture(e.pointerId); setFromEvent(e); });
        track.addEventListener('pointermove', function (e) { if (track.hasPointerCapture(e.pointerId)) setFromEvent(e); });
    }
    function requestMic() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { S.micOk = false; S.demo = true; return; }
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function (stream) {
                S.micStream = stream; S.micOk = true; S.demo = false;
                if (S.phase === 'idle') toast('麦克风已就绪，点击麦克风开始');
            })
            .catch(function () { S.micOk = false; S.demo = true; toast('未获得麦克风权限，将进入演示跟唱模式'); });
    }
    function startSinging() {
        if (!S.song) return;
        if (S.ctx) stopSinging();
        // 移除准备页/旧演唱页，创建演唱页
        var prep = document.getElementById('mikSingPrep');
        if (prep) prep.remove();
        var old = document.getElementById('mikSingView');
        if (old) old.remove();
        var song = S.song;
        var d = document.createElement('div');
        d.className = 'mik-sing';
        d.id = 'mikSingView';
        d.innerHTML =
            '<div class="mik-prep-bg" style="background-image:url(' + coverOf(song) + ')"></div>' +
            '<div class="mik-sing-header">' +
                '<button class="mik-back" type="button" id="mikSingBack">‹</button>' +
                '<div class="mik-sing-songinfo"><div class="mik-sing-songname">' + esc(song.title) + '</div>' +
                '<div class="mik-sing-artist">' + esc(song.artist) + (S.originalOn ? ' · 原唱演示中' : ' · 伴奏') + '</div></div>' +
                '<span class="mik-header-spacer"></span>' +
            '</div>' +
            '<div class="mik-sentence-score" id="mikSentScore"><b>--</b><span>本句评分</span></div>' +
            '<div class="mik-lyrics" id="mikLyrics">' +
                song.lines.map(function (l, i) {
                    return '<span class="mik-lyric-line" data-line="' + i + '">' + esc(l.txt) + '</span>';
                }).join('') +
            '</div>' +
            '<div class="mik-sing-stage">' +
                '<div class="mik-scoreline">' +
                    '<span class="mik-score-label">综合</span>' +
                    '<div class="mik-score-track"><i class="mik-score-fill" id="mikScoreFill"></i></div>' +
                    '<b class="mik-score-num" id="mikScoreNum">0</b>' +
                '</div>' +
                '<div class="mik-pitch-row">' +
                    '<span class="mik-pitch-text" id="mikPitchText">准备开唱</span>' +
                    '<div class="mik-pitch-track" id="mikPitchTrack"><i class="mik-pitch-zone"></i><i class="mik-pitch-cursor" id="mikPitchCursor"></i></div>' +
                '</div>' +
                '<div class="mik-sing-btns">' +
                    '<button class="mik-sing-round" type="button" id="mikBtnRestart" aria-label="重唱">' + IC.restart + '</button>' +
                    '<button class="mik-sing-mic" type="button" id="mikBtnMic" aria-label="暂停/继续">' + IC.mic + '</button>' +
                    '<button class="mik-sing-round" type="button" id="mikBtnStop" aria-label="结束">' + IC.pause + '</button>' +
                '</div>' +
                '<div class="mik-progressline">' +
                    '<div class="mik-progress"><i id="mikProgress"></i></div>' +
                    '<span class="mik-progress-time" id="mikTime">0:00 / 0:18</span>' +
                '</div>' +
            '</div>';
        app.appendChild(d);
        S.node = d;
        d.querySelector('#mikSingBack').addEventListener('click', function () { stopSinging(); d.remove(); });
        d.querySelector('#mikBtnRestart').addEventListener('click', function () { startSinging(); });
        d.querySelector('#mikBtnMic').addEventListener('click', function () {
            if (S.phase === 'singing') pauseSinging();
            else if (S.phase === 'paused') resumeSinging();
        });
        d.querySelector('#mikBtnStop').addEventListener('click', function () {
            if (S.phase === 'singing' || S.phase === 'paused') finishSing();
        });
        // 初始化演唱状态
        S.phase = 'singing';
        S.notes = notesOf(S.song);
        S.sentence = 0; S.sentScores = []; S.sentTexts = [];
        S.sentPitchSum = 0; S.sentPitchN = 0;
        S.pitchSum = 0; S.pitchN = 0; S.rhythmSum = 0; S.rhythmN = 0;
        S.singMs = 0; S.aliveMs = 0; S.pauseCount = 0;
        S.demoPitch = 76;
        try {
            var AC = window.AudioContext || window.webkitAudioContext;
            S.ctx = new AC();
            S.master = S.ctx.createGain();
            S.master.gain.value = Math.max(0.05, S.volume);
            S.master.connect(S.ctx.destination);
            scheduleAccompaniment(S.ctx, S.master, S.notes);
            if (S.micOk && S.micStream && S.ctx) {
                var src = S.ctx.createMediaStreamSource(S.micStream);
                S.analyser = S.ctx.createAnalyser();
                S.analyser.fftSize = 2048;
                src.connect(S.analyser);
            }
            S.startAt = performance.now() + PRE_MS;
            S.ctx.resume();
        } catch (e) {
            S.demo = true; S.micOk = false;
            S.startAt = performance.now() + PRE_MS;
        }
        var micBtn = document.getElementById('mikBtnMic');
        if (micBtn) micBtn.classList.add('is-on');
        document.getElementById('mikPitchText').textContent = S.demo ? '演示跟唱模式' : '开唱吧！';
        setScore(0);
        clearInterval(S.timer);
        S.timer = setInterval(tickSing, 90);
    }
    /* 真实感伴奏：和弦琶音 + 贝斯 + 鼓组 + 原唱演示 */
    function scheduleAccompaniment(ctx, master, notes) {
        var now = ctx.currentTime + PRE_MS / 1000;
        var semi = S.semi, shift = Math.pow(2, semi / 12);
        var beat = 0.575; // ≈104 BPM
        var chords = CHORDS[S.song.id] || ['Am', 'F', 'C', 'G'];
        // ---- 钢琴琶音 + 贝斯（每组一个和弦，8 拍）----
        for (var g = 0; g < 4; g++) {
            var cf = CHORD_FREQS[chords[g]].map(function (f) { return f * shift; });
            var root = cf[0] / 2;
            var t0 = now + g * SENT_MS / 1000;
            // 琶音型：[根, 五, 三, 五] 循环，每拍一个
            var arp = [0, 2, 1, 2];
            for (var b = 0; b < 8; b++) {
                var tA = t0 + b * beat;
                var fA = cf[arp[b % 4]] * 2; // 高八度更清亮
                piano(ctx, master, fA, tA, 0.42, 0.075);
                // 贝斯：每拍根音（第 5 拍重音 + 半拍切分感）
                piano(ctx, master, root, tA, 0.3, 0.11, 'triangle');
            }
        }
        // ---- 鼓组 ----
        var totalBeats = Math.ceil(TOTAL_MS / 1000 / beat) + 1;
        for (var i = 0; i < totalBeats; i++) {
            var tK = now + i * beat;
            if (i % 4 === 0 || i % 4 === 2) kick(ctx, master, tK);            // 1、3 拍
            if (i % 4 === 1 || i % 4 === 3) snare(ctx, master, tK);           // 2、4 拍
            hat(ctx, master, tK);                                             // 每拍
            hat(ctx, master, tK + beat / 2, 0.5);                             // 后半拍弱
        }
        // ---- 原唱演示（柔和哼唱旋律）----
        if (S.originalOn) {
            for (var n = 0; n < notes.length; n++) {
                demoVocal(ctx, master, notes[n].f * shift, now + notes[n].t / 1000, notes[n].d / 1000);
            }
        }
        // ---- 前奏提示（2 拍）----
        var pF = CHORD_FREQS[chords[0]][0] * shift;
        piano(ctx, master, pF * 2, now, 0.24, 0.08);
        piano(ctx, master, pF * 2, now + beat, 0.24, 0.08);
        hat(ctx, master, now);
        hat(ctx, master, now + beat / 2, 0.5);
    }
    function piano(ctx, master, freq, t, dur, vol, type) {
        // 双振荡器叠加 + 低通滤波，接近钢琴/键盘的柔和音色
        var g = ctx.createGain(), f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 2600; f.Q.value = 0.6;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
        g.gain.exponentialRampToValueAtTime(vol * 0.55, t + dur * 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        var o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
        o1.type = type || 'sine';
        o2.type = type || 'triangle';
        o2.detune.value = 7;
        o1.frequency.setValueAtTime(freq, t);
        o2.frequency.setValueAtTime(freq, t);
        o1.connect(f); o2.connect(f); f.connect(g); g.connect(master);
        o1.start(t); o2.start(t);
        o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    }
    function kick(ctx, master, t) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(170, t);
        o.frequency.exponentialRampToValueAtTime(50, t + 0.16);
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 0.22);
    }
    function snare(ctx, master, t) {
        var dur = 0.16, buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        var data = buf.getChannelData(0);
        for (var s = 0; s < data.length; s++) data[s] = (Math.random() * 2 - 1) * (1 - s / data.length);
        var src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        src.buffer = buf;
        f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.9;
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f); f.connect(g); g.connect(master);
        src.start(t); src.stop(t + dur + 0.02);
    }
    function hat(ctx, master, t, vel) {
        var dur = 0.05, buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
        var data = buf.getChannelData(0);
        for (var s = 0; s < data.length; s++) data[s] = (Math.random() * 2 - 1) * (1 - s / data.length);
        var src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        src.buffer = buf;
        f.type = 'highpass'; f.frequency.value = 7500;
        g.gain.setValueAtTime((vel || 1) * 0.13, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f); f.connect(g); g.connect(master);
        src.start(t); src.stop(t + dur + 0.01);
    }
    function demoVocal(ctx, master, freq, t, dur) {
        // 柔和"哼唱"：锯齿 + 带通 + 颤音
        var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(freq, t);
        o.frequency.linearRampToValueAtTime(freq * 1.004, t + dur); // 轻微上滑
        var vib = ctx.createOscillator(), vG = ctx.createGain();
        vib.frequency.setValueAtTime(5.2, t);
        vG.gain.setValueAtTime(freq * 0.008, t);
        vib.connect(vG); vG.connect(o.frequency);
        f.type = 'bandpass'; f.frequency.value = 820; f.Q.value = 0.8;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.92);
        o.connect(f); f.connect(g); g.connect(master);
        o.start(t); o.stop(t + dur);
        vib.start(t); vib.stop(t + dur);
    }
    function pauseSinging() {
        if (S.phase !== 'singing') return;
        S.phase = 'paused';
        S.pausedAt = performance.now();
        if (S.ctx && S.ctx.state === 'running') S.ctx.suspend();
        clearInterval(S.timer);
        document.getElementById('mikPitchText').textContent = '已暂停';
        document.getElementById('mikBtnMic').classList.remove('is-on');
    }
    function resumeSinging() {
        if (S.phase !== 'paused') return;
        var delta = performance.now() - S.pausedAt;
        S.startAt += delta;
        S.phase = 'singing';
        if (S.ctx && S.ctx.state === 'suspended') S.ctx.resume();
        S.timer = setInterval(tickSing, 90);
        document.getElementById('mikBtnMic').classList.add('is-on');
        document.getElementById('mikPitchText').textContent = '继续演唱';
    }
    function setScore(v) {
        var fill = document.getElementById('mikScoreFill');
        var num = document.getElementById('mikScoreNum');
        if (fill) fill.style.width = Math.max(0, Math.min(100, v)) + '%';
        if (num) num.textContent = Math.round(v);
    }
    function tickSing() {
        if (S.phase !== 'singing') return;
        var elapsed = performance.now() - S.startAt;
        if (elapsed < 0) return;
        var sec = elapsed / 1000;
        var isSinging = false, pitch = null;
        if (S.micOk && S.analyser) {
            var rms = micRms();
            isSinging = rms > 0.012;
            if (isSinging) pitch = detectPitch();
        } else if (S.demo) {
            isSinging = true;
            pitch = refFreqAt(elapsed) * (1 + (Math.sin(elapsed / 900) * 0.012 - 0.004));
        }
        if (S.singingOn && !isSinging) S.pauseCount++;
        S.singingOn = isSinging;
        S.aliveMs = Math.min(elapsed, TOTAL_MS);
        if (isSinging) S.singMs += 90;
        var ref = refFreqAt(elapsed);
        var lineIdx = Math.min(3, Math.floor(elapsed / SENT_MS));
        var lineEl = document.querySelector('#mikLyrics [data-line="' + lineIdx + '"]');
        document.querySelectorAll('#mikLyrics .mik-lyric-line').forEach(function (l) {
            l.classList.toggle('is-current', l === lineEl);
        });
        // 评分
        var pScore = 0, rScore = 0, err = 0;
        if (isSinging && ref && pitch) {
            err = 12 * Math.log2(pitch / ref);
            pScore = Math.max(0, Math.min(100, 100 - Math.abs(err) / 3 * 100));
            var noteStart = S.notes[Math.min(S.notes.length - 1, Math.floor(elapsed / NOTE_MS))].t;
            var off = Math.abs(elapsed - noteStart - NOTE_MS / 2);
            rScore = Math.max(0, Math.min(100, 100 - (off / 900) * 100));
            S.pitchSum += pScore; S.pitchN++;
            S.sentPitchSum += pScore; S.sentPitchN++;
            S.rhythmSum += rScore; S.rhythmN++;
            document.getElementById('mikPitchText').textContent = err > 0.8 ? '偏高' : err < -0.8 ? '偏低' : '音准 OK';
        } else if (S.demo) {
            S.demoPitch += (92 - S.demoPitch) * 0.02 + Math.sin(elapsed / 700) * 3;
            pScore = Math.max(0, Math.min(100, S.demoPitch));
            rScore = 88;
            err = Math.sin(elapsed / 700) * 0.9;
            S.pitchSum += pScore; S.pitchN++;
            S.sentPitchSum += pScore; S.sentPitchN++;
            S.rhythmSum += rScore; S.rhythmN++;
            document.getElementById('mikPitchText').textContent = '演示跟唱中';
        } else {
            document.getElementById('mikPitchText').textContent = '请跟着伴奏演唱';
        }
        // 音准滑动条
        var cursor = document.getElementById('mikPitchCursor');
        if (cursor) {
            var pos = 50 + Math.max(-3, Math.min(3, err)) * 14;
            cursor.style.left = pos + '%';
        }
        var coverage = S.aliveMs > 0 ? S.singMs / S.aliveMs : 0;
        var pitchAvg = S.pitchN ? S.pitchSum / S.pitchN : 0;
        var rhythmAvg = S.rhythmN ? S.rhythmSum / S.rhythmN : 0;
        var breath = Math.max(0, 100 - S.pauseCount * 14);
        if (S.demo) breath = Math.max(breath, 92);
        var total = 0.5 * pitchAvg + 0.2 * rhythmAvg + 0.15 * coverage * 100 + 0.15 * breath;
        setScore(total);
        // 句切换：记录本句得分
        var sIdx = Math.min(3, Math.floor(elapsed / SENT_MS));
        if (sIdx !== S.sentence) {
            if (S.sentPitchN) {
                S.sentScores.push(Math.round(S.sentPitchSum / S.sentPitchN));
                S.sentTexts.push(S.song.lines[Math.min(S.sentence, 3)].txt);
            }
            S.sentPitchSum = 0; S.sentPitchN = 0;
            S.sentence = sIdx;
        }
        var sentEl = document.getElementById('mikSentScore');
        if (sentEl) {
            var sentNow = S.sentPitchN ? Math.round(S.sentPitchSum / S.sentPitchN) : 0;
            sentEl.querySelector('b').textContent = sentNow ? sentNow : '--';
            if (sentNow > 88) sentEl.classList.add('is-burst');
            else sentEl.classList.remove('is-burst');
        }
        var prog = document.getElementById('mikProgress');
        var tm = document.getElementById('mikTime');
        if (prog) prog.style.width = Math.min(100, elapsed / TOTAL_MS * 100) + '%';
        if (tm) tm.textContent = fmtTime(sec) + ' / 0:18';
        if (elapsed >= TOTAL_MS) finishSing();
    }
    function refFreqAt(ms) {
        var n = null;
        for (var i = 0; i < S.notes.length; i++) {
            if (ms >= S.notes[i].t && ms < S.notes[i].t + S.notes[i].d) { n = S.notes[i]; break; }
        }
        return n ? n.f : null;
    }
    function fmtTime(sec) {
        sec = Math.max(0, Math.floor(sec));
        return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2);
    }
    function micRms() {
        if (!S.analyser) return 0;
        var buf = new Float32Array(S.analyser.fftSize);
        S.analyser.getFloatTimeDomainData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        return Math.sqrt(sum / buf.length);
    }
    function detectPitch() {
        if (!S.analyser) return null;
        var buf = new Float32Array(S.analyser.fftSize);
        S.analyser.getFloatTimeDomainData(buf);
        var sr = S.ctx ? S.ctx.sampleRate : 44100;
        var minLag = Math.floor(sr / 900), maxLag = Math.floor(sr / 70);
        var bestLag = -1, bestVal = 0;
        for (var lag = minLag; lag < maxLag; lag++) {
            var sum = 0;
            for (var i = 0; i < Math.min(buf.length - lag, sr * 0.02); i++) {
                sum += buf[i] * buf[i + lag];
            }
            var norm = sum / (Math.min(buf.length - lag, sr * 0.02));
            if (norm > bestVal) { bestVal = norm; bestLag = lag; }
        }
        if (bestLag < 0) return null;
        return sr / bestLag;
    }
    function finishSing() {
        // 收尾：记录最后一句得分
        if (S.sentPitchN) {
            S.sentScores.push(Math.round(S.sentPitchSum / S.sentPitchN));
            S.sentTexts.push(S.song.lines[Math.min(S.sentence, 3)].txt);
        }
        var pitchAvg = S.pitchN ? S.pitchSum / S.pitchN : 0;
        var rhythmAvg = S.rhythmN ? S.rhythmSum / S.rhythmN : 0;
        var coverage = S.aliveMs > 0 ? Math.min(1, S.singMs / S.aliveMs) : 0;
        var breath = Math.max(0, 100 - S.pauseCount * 14);
        if (S.demo) breath = Math.max(breath, 92);
        var total = Math.max(0, Math.min(100, Math.round(0.5 * pitchAvg + 0.2 * rhythmAvg + 0.15 * coverage * 100 + 0.15 * breath)));
        var grade = total >= 95 ? 'SSS' : total >= 90 ? 'SS' : total >= 85 ? 'S' : total >= 75 ? 'A' : total >= 60 ? 'B' : 'C';
        var beat = grade === 'SSS' ? 99 : grade === 'SS' ? 96 : grade === 'S' ? 91 : grade === 'A' ? 82 : grade === 'B' ? 66 : 38;
        clearInterval(S.timer);
        var micBtn = document.getElementById('mikBtnMic');
        if (micBtn) micBtn.classList.remove('is-on');
        if (S.ctx) { S.ctx.suspend().catch(function () {}); }
        if (S.micStream) { S.micStream.getTracks().forEach(function (t) { t.stop(); }); S.micStream = null; }
        S.phase = 'done';
        // 句分报告：最高 / 平均 / 最低
        var repBest = '-', repAvg = '-', repLow = '-';
        if (S.sentScores.length) {
            var sum = 0, best = -1, low = 101;
            for (var i = 0; i < S.sentScores.length; i++) {
                sum += S.sentScores[i];
                if (S.sentScores[i] > best) best = S.sentScores[i];
                if (S.sentScores[i] < low) low = S.sentScores[i];
            }
            repBest = best; repLow = low; repAvg = Math.round(sum / S.sentScores.length);
        } else if (S.demo) {
            repBest = 94; repAvg = 88; repLow = 78;
        }
        var d = document.createElement('div');
        d.className = 'mik-result';
        d.innerHTML =
            '<div class="mik-result-grade">' + grade + '</div>' +
            '<div class="mik-result-song">' + esc(S.song.title) + ' · ' + esc(S.song.artist) + '</div>' +
            '<div class="mik-result-score">' + total + '<span style="font-size:16px;color:var(--mik-muted)"> 分</span></div>' +
            '<div class="mik-result-sub">' + (S.demo ? '演示跟唱模式' : '实时评分') + ' · 超越 ' + beat + '% 的听众</div>' +
            '<div class="mik-result-dims">' +
                '<div class="mik-dim"><span class="mik-dim-name">音准</span><div class="mik-dim-track"><i class="mik-dim-fill" style="width:' + Math.round(pitchAvg) + '%"></i></div><span class="mik-dim-val">' + Math.round(pitchAvg) + '</span></div>' +
                '<div class="mik-dim"><span class="mik-dim-name">节奏</span><div class="mik-dim-track"><i class="mik-dim-fill" style="width:' + Math.round(rhythmAvg) + '%"></i></div><span class="mik-dim-val">' + Math.round(rhythmAvg) + '</span></div>' +
                '<div class="mik-dim"><span class="mik-dim-name">完整度</span><div class="mik-dim-track"><i class="mik-dim-fill" style="width:' + Math.round(coverage * 100) + '%"></i></div><span class="mik-dim-val">' + Math.round(coverage * 100) + '</span></div>' +
                '<div class="mik-dim"><span class="mik-dim-name">气息</span><div class="mik-dim-track"><i class="mik-dim-fill" style="width:' + Math.round(breath) + '%"></i></div><span class="mik-dim-val">' + Math.round(breath) + '</span></div>' +
            '</div>' +
            '<div class="mik-result-report">' +
                '<div class="mik-report-cell"><b>' + repBest + '</b><span>最高句</span></div>' +
                '<div class="mik-report-cell"><b>' + repAvg + '</b><span>平均</span></div>' +
                '<div class="mik-report-cell"><b>' + repLow + '</b><span>最低句</span></div>' +
            '</div>' +
            '<button class="mik-result-btn mik-result-pub" type="button" data-r="pub">发布作品</button>' +
            '<div class="mik-result-actions">' +
                '<button class="mik-result-btn" type="button" data-r="again">再唱一次</button>' +
                '<button class="mik-result-btn is-primary" type="button" data-r="close">返回</button>' +
            '</div>';
        S.node.appendChild(d);
        d.querySelector('[data-r="again"]').addEventListener('click', function () { d.remove(); startSinging(); });
        d.querySelector('[data-r="close"]').addEventListener('click', function () { stopSinging(); S.node.remove(); });
        d.querySelector('[data-r="pub"]').addEventListener('click', function () { publishWork(grade, total); });
    }
    function readWorks() {
        try {
            var w = JSON.parse(localStorage.getItem('mik_works'));
            return Array.isArray(w) && w.length ? w : null;
        } catch (e) { return null; }
    }
    function publishWork(grade, total) {
        if (!S.song) return;
        var now = new Date();
        var mm = ('0' + (now.getMonth() + 1)).slice(-2);
        var dd = ('0' + now.getDate()).slice(-2);
        var works = readWorks() || [];
        works.unshift({ songId: S.song.id, grade: grade, plays: '新作品', time: mm + '-' + dd, score: total });
        try { localStorage.setItem('mik_works', JSON.stringify(works)); } catch (e) {}
        toast('已发布到「我的作品」');
    }
    function stopSinging() {
        clearInterval(S.timer);
        if (S.ctx) { S.ctx.close().catch(function () {}); }
        S.ctx = null; S.analyser = null;
        if (S.micStream) { S.micStream.getTracks().forEach(function (t) { t.stop(); }); S.micStream = null; }
        S.phase = 'idle'; S.song = null;
    }

    /* ---------- 初始化 ---------- */
    function init() {
        app = document.getElementById('mikApp');
        view = document.getElementById('mikView');
        if (!app || !view) return;
        document.getElementById('mikBackBtn').addEventListener('click', closeMikApp);
        app.querySelectorAll('.mik-nav-bar').forEach(function (b) {
            b.addEventListener('click', function () { setTab(b.dataset.mikTab); });
        });
        if (window.location.hash && window.location.hash.indexOf('mik') >= 0) openMikApp();
    }
    window.openMikApp = openMikApp;
    window.closeMikApp = closeMikApp;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
