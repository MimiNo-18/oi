(function () {
    'use strict';

    const DEFAULT_CARD_COLOR = '#17102D';
    const PROFILE_KEY = 'mimi_game_profile';
    const CARD_BACKGROUNDS_KEY = 'mimi_game_card_backgrounds';
    const CUSTOM_GAMES_KEY = 'mimi_custom_html_games';
    const GAME_SAVES_KEY = 'mimi_html_game_saves';
    const GAME_ALBUMS_KEY = 'mimi_game_albums';
    const GAME_CODE_SOURCES = {
        template: `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>我的小游戏</title>
  <style>
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
    body { color: #f3efff; background: linear-gradient(160deg,#080914,#17102d); font-family: sans-serif; }
    #game { position: relative; width: 100%; height: 100%; touch-action: none; }
    button { min-width: 120px; min-height: 46px; color: #fff; border: 1px solid #ffffff20; border-radius: 14px; background: #59409a; }
  </style>
</head>
<body>
  <main id="game">
    <h1>我的小游戏</h1>
    <button id="action">开始</button>
  </main>
  <script>
    const old = window.MimiGameSave ? MimiGameSave.load() : null;
    let score = old?.score || 0;
    document.getElementById('action').onclick = function () {
      score += 1;
      this.textContent = '分数：' + score;
      if (window.MimiGameSave) MimiGameSave.save({ score });
    };
  <\/script>
</body>
</html>`,
        example: `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <title>星辉捕手</title>
  <style>
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
    body { color: #f5f1ff; background: radial-gradient(circle at 75% 10%,#5f47a655,transparent 30%),#070812; font-family: sans-serif; }
    #game { position: relative; width: 100%; height: 100%; overflow: hidden; touch-action: manipulation; }
    header { position: absolute; z-index: 2; top: 26px; right: 20px; left: 20px; display: flex; justify-content: space-between; }
    h1 { margin: 0; font: 500 25px Georgia,serif; }
    .star { position: absolute; width: 50px; height: 50px; color: #fff; border: 1px solid #d9c9ff66; border-radius: 50%; background: #8067d466; box-shadow: 0 0 28px #8c70ea99; font-size: 21px; }
  </style>
</head>
<body>
  <main id="game">
    <header><h1>星辉捕手</h1><span id="score">SCORE 0</span></header>
  </main>
  <script>
    const saved = window.MimiGameSave ? MimiGameSave.load() : null;
    let score = saved?.score || 0;
    const game = document.getElementById('game');
    const scoreView = document.getElementById('score');
    function createStar() {
      game.querySelector('.star')?.remove();
      const star = document.createElement('button');
      star.className = 'star';
      star.textContent = '✦';
      star.style.left = 18 + Math.random() * Math.max(20,game.clientWidth - 82) + 'px';
      star.style.top = 90 + Math.random() * Math.max(30,game.clientHeight - 180) + 'px';
      star.onclick = function () {
        score += 1;
        scoreView.textContent = 'SCORE ' + score;
        if (window.MimiGameSave) MimiGameSave.save({ score });
        createStar();
      };
      game.appendChild(star);
    }
    scoreView.textContent = 'SCORE ' + score;
    createStar();
    setInterval(createStar,1800);
  <\/script>
</body>
</html>`
    };

    const games = [
        {
            title: '雾隐之境',
            english: 'VEIL OF MIST',
            genre: 'MYSTERY · EXPLORATION',
            description: '醒来时，你已置身一座被永夜与迷雾封存的古城。失落的钟声、无名者留下的手稿，以及每到午夜就会改变方向的街道，都在指向同一个被遗忘的真相。请谨慎选择，因为城中的每扇门，都记得你曾经做过什么。',
            color: '#17102D',
            accent: '#9d83ff'
        },
        {
            title: '星渊回响',
            english: 'ECHOES OF ABYSS',
            genre: 'SCI-FI · NARRATIVE',
            description: '一艘失联七年的深空观测船突然发回信号，而信号里的声音正是你自己。穿越静默星域，修复破碎的航行日志，在有限的氧气与不断重写的记忆中，寻找那段本不该存在的返航坐标。',
            color: '#0C1830',
            accent: '#668cff'
        },
        {
            title: '午夜藏书阁',
            english: 'MIDNIGHT ARCHIVE',
            genre: 'FANTASY · PUZZLE',
            description: '这座藏书阁只在零点后出现，每本书都收藏着一个人的秘密。你将成为新任守书人，通过整理禁忌书页、破解古老密文，阻止故事中的人物逃入现实。只是其中一本书的封面上，写着你的名字。',
            color: '#241126',
            accent: '#cf7cdb'
        },
        {
            title: '数界归一',
            english: 'UNITY OF NUMBERS',
            genre: 'PUZZLE · STRATEGY',
            description: '数字在幽暗棋盘中不断苏醒。向四个方向推动所有方块，让相同的数字彼此融合，最终抵达传说中的 2048。棋盘空间有限，每一步都需要计算与取舍。',
            color: '#111522',
            accent: '#91a2ca'
        }
    ];

    function simpleGameShell(title, subtitle, body, script, accent) {
        return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#070812;color:#eeeaff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}body{display:flex;flex-direction:column;padding:24px 18px 20px;background:radial-gradient(circle at 80% 5%,' + accent + '33,transparent 30%),linear-gradient(160deg,#080914,#130b25)}header{flex:0 0 auto}small{color:#756a94;font:600 8px/1 monospace;letter-spacing:.26em}h1{margin:8px 0 4px;font:500 27px/1.2 Georgia,serif}p{margin:0;color:#8d879a;font-size:11px;line-height:1.6}.stage{position:relative;flex:1 1 auto;min-height:0;margin-top:18px;border:1px solid #ffffff14;border-radius:22px;background:#ffffff06;overflow:hidden;box-shadow:inset 0 0 40px #0006}button{color:#eeeaff;border:1px solid #ffffff18;border-radius:14px;background:#ffffff0a;font:inherit;touch-action:manipulation}.hud{display:flex;justify-content:space-between;align-items:center;margin-top:14px;color:#9d94ac;font-size:11px}.primary{min-height:44px;padding:0 18px;background:linear-gradient(100deg,' + accent + '99,' + accent + '44)}' + body + '</style></head><body><header><small>NOCTURNE MINI GAME</small><h1>' + title + '</h1><p>' + subtitle + '</p></header><div class="stage" id="stage"></div><div class="hud" id="hud"></div><script>' + script + '<\/script></body></html>';
    }

    games[0].html = simpleGameShell('迷雾迷宫', '穿过随机生成的迷宫，在迷雾深处找到出口。', '.maze{position:absolute;left:50%;top:46%;width:min(88vw,310px);aspect-ratio:1;display:grid;grid-template-columns:repeat(9,1fr);transform:translate(-50%,-50%);background:#080713;box-shadow:0 0 35px #7053d133}.maze-cell{position:relative;background:#ffffff03}.maze-cell.player::after,.maze-cell.exit::after{content:"";position:absolute;inset:22%;border-radius:50%}.maze-cell.player::after{background:#e4ddff;box-shadow:0 0 13px #9d83ff}.maze-cell.exit::after{border:2px solid #9d83ff;box-shadow:inset 0 0 9px #9d83ff88}.pad{position:absolute;left:50%;bottom:12px;display:grid;grid-template-columns:repeat(3,42px);grid-template-rows:repeat(2,42px);gap:5px;transform:translateX(-50%)}.pad button{font-size:17px}.pad .up{grid-column:2}.pad .left{grid-column:1}.pad .down{grid-column:2}.pad .right{grid-column:3}', "var state=MimiGameSave.load()||{level:1,wins:0},N=9,cells=[],player=0,exit=N*N-1,stage=document.getElementById('stage'),hud=document.getElementById('hud'),sx=0,sy=0;function build(){cells=Array.from({length:N*N},function(){return{w:[1,1,1,1],v:0}});var stack=[0];cells[0].v=1;while(stack.length){var at=stack[stack.length-1],r=Math.floor(at/N),c=at%N,opts=[];if(r>0&&!cells[at-N].v)opts.push([at-N,0,2]);if(c<N-1&&!cells[at+1].v)opts.push([at+1,1,3]);if(r<N-1&&!cells[at+N].v)opts.push([at+N,2,0]);if(c>0&&!cells[at-1].v)opts.push([at-1,3,1]);if(!opts.length){stack.pop();continue}var pick=opts[Math.floor(Math.random()*opts.length)];cells[at].w[pick[1]]=0;cells[pick[0]].w[pick[2]]=0;cells[pick[0]].v=1;stack.push(pick[0])}player=0;draw()}function draw(){stage.innerHTML='<div class=maze>'+cells.map(function(cell,i){return '<i class=\"maze-cell '+(i===player?'player ':'')+(i===exit?'exit':'')+'\" style=\"border-top:'+(cell.w[0]?'1px solid #7462a4':'0')+';border-right:'+(cell.w[1]?'1px solid #7462a4':'0')+';border-bottom:'+(cell.w[2]?'1px solid #7462a4':'0')+';border-left:'+(cell.w[3]?'1px solid #7462a4':'0')+'\"></i>'}).join('')+'</div><div class=pad><button class=up data-d=0>↑</button><button class=left data-d=3>←</button><button class=down data-d=2>↓</button><button class=right data-d=1>→</button></div>';hud.innerHTML='<span>迷宫 '+state.level+'</span><span>逃离 '+state.wins+' 次</span>'}function move(d){if(cells[player].w[d])return;player+=d===0?-N:d===1?1:d===2?N:-1;if(player===exit){state.wins++;state.level++;MimiGameSave.save(state);setTimeout(build,350)}draw()}stage.onclick=function(e){if(e.target.dataset.d!==undefined)move(Number(e.target.dataset.d))};onkeydown=function(e){var map={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3};if(map[e.key]!==undefined){e.preventDefault();move(map[e.key])}};stage.onpointerdown=function(e){sx=e.clientX;sy=e.clientY};stage.onpointerup=function(e){var dx=e.clientX-sx,dy=e.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;move(Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0))};build();", '#7053d1');
    games[1].html = simpleGameShell('星轨躲避', '拖动飞船避开坠落星体，坚持越久分数越高。', '.ship{position:absolute;bottom:20px;width:42px;height:42px;border:1px solid #8aa6ff;border-radius:50%;background:#668cff55;box-shadow:0 0 24px #668cff88;transform:translateX(-50%)}.meteor{position:absolute;width:24px;height:24px;border-radius:50%;background:#ddd7ff;box-shadow:0 0 18px #a6b5ff}', "var best=(MimiGameSave.load()||{}).best||0,stage=document.getElementById('stage'),hud=document.getElementById('hud'),x=50,score=0,dead=false,ship=document.createElement('div');ship.className='ship';stage.appendChild(ship);function move(e){var r=stage.getBoundingClientRect();x=Math.max(7,Math.min(93,(e.clientX-r.left)/r.width*100));ship.style.left=x+'%'}stage.onpointerdown=move;stage.onpointermove=function(e){if(e.buttons||e.pointerType==='touch')move(e)};function spawn(){if(dead)return;var m=document.createElement('i');m.className='meteor';m.style.left=(5+Math.random()*90)+'%';m.style.top='-30px';stage.appendChild(m);var y=-30,speed=2+score/180;function fall(){if(dead)return;y+=speed;m.style.top=y+'px';var a=m.getBoundingClientRect(),b=ship.getBoundingClientRect();if(a.bottom>b.top&&a.left<b.right&&a.right>b.left){dead=true;best=Math.max(best,Math.floor(score));MimiGameSave.save({best:best});hud.innerHTML='<span>撞击结束</span><button class=primary onclick=location.reload()>再来一次</button>';return}if(y>stage.clientHeight){m.remove();score+=10}else requestAnimationFrame(fall)}fall();setTimeout(spawn,Math.max(330,850-score*2))}function tick(){if(!dead){score+=.08;hud.innerHTML='<span>分数 '+Math.floor(score)+'</span><span>最佳 '+best+'</span>';requestAnimationFrame(tick)}}ship.style.left='50%';spawn();tick();", '#5277dc');
    games[2].html = simpleGameShell('午夜翻牌', '翻开两张相同符文，配对全部卡牌。', '.cards{position:absolute;inset:18px;display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.memory{font-size:24px;background:#ffffff08}.memory.open,.memory.done{background:#cf7cdb33;border-color:#cf7cdb88}.memory.done{opacity:.45}', "var stats=MimiGameSave.load()||{wins:0},symbols=['✦','☾','◇','♢','✧','♧','♤','☼'],deck=symbols.concat(symbols).sort(function(){return Math.random()-.5}),open=[],done=[],stage=document.getElementById('stage'),hud=document.getElementById('hud'),moves=0;function draw(){stage.innerHTML='<div class=cards>'+deck.map(function(v,i){return '<button class=\"memory '+(open.includes(i)?'open ':'')+(done.includes(i)?'done':'')+'\" data-i='+i+'>'+(open.includes(i)||done.includes(i)?v:'')+'</button>'}).join('')+'</div>';hud.innerHTML='<span>步数 '+moves+'</span><span>完成 '+stats.wins+' 局</span>'}stage.onclick=function(e){var i=Number(e.target.dataset.i);if(!Number.isFinite(i)||open.length===2||done.includes(i)||open.includes(i))return;open.push(i);draw();if(open.length===2){moves++;setTimeout(function(){if(deck[open[0]]===deck[open[1]])done=done.concat(open);open=[];if(done.length===deck.length){stats.wins++;MimiGameSave.save(stats);hud.innerHTML='<span>配对完成</span><button class=primary onclick=location.reload()>再玩一局</button>'}else draw()},430)}};draw();", '#a950b5');
    games[3].html = simpleGameShell('数界归一', '滑动数字方块，让相同数字合并并抵达 2048。', '.board{position:absolute;left:50%;top:46%;width:min(88vw,320px);aspect-ratio:1;display:grid;grid-template-columns:repeat(4,1fr);gap:9px;padding:10px;border-radius:18px;background:#0b0c17;transform:translate(-50%,-50%);touch-action:none}.tile{display:grid;place-items:center;border-radius:12px;background:#ffffff08;color:#eeeaff;font:600 22px/1 Georgia,serif}.tile[data-v="2"]{background:#29283a}.tile[data-v="4"]{background:#36324c}.tile[data-v="8"]{background:#4a3764}.tile[data-v="16"]{background:#604176}.tile[data-v="32"]{background:#765080}.tile[data-v="64"]{background:#895988}.tile[data-v="128"]{background:#54628e;font-size:19px}.tile[data-v="256"]{background:#4c7195;font-size:19px}.tile[data-v="512"]{background:#477f94;font-size:19px}.tile[data-v="1024"]{background:#8574ad;font-size:16px}.tile[data-v="2048"]{background:#ad94dd;color:#171020;font-size:16px;box-shadow:0 0 24px #ad94dd88}.over{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:15px;background:#080914dd;z-index:2}.over strong{font:500 25px/1 Georgia,serif}', "var saved=MimiGameSave.load()||{},board=Array.isArray(saved.board)&&saved.board.length===16?saved.board:Array(16).fill(0),score=saved.score||0,best=saved.best||0,stage=document.getElementById('stage'),hud=document.getElementById('hud'),sx=0,sy=0;if(!board.some(Boolean)){add();add()}function add(){var free=[];board.forEach(function(v,i){if(!v)free.push(i)});if(free.length)board[free[Math.floor(Math.random()*free.length)]]=Math.random()<.9?2:4}function line(values){var a=values.filter(Boolean),out=[];for(var i=0;i<a.length;i++){if(a[i]===a[i+1]){var v=a[i]*2;out.push(v);score+=v;i++}else out.push(a[i])}while(out.length<4)out.push(0);return out}function move(dir){var old=board.join(','),next=Array(16).fill(0);for(var n=0;n<4;n++){var vals=[];for(var k=0;k<4;k++){var r=dir===0?k:dir===1?n:dir===2?3-k:n,c=dir===0?n:dir===1?k:dir===2?n:3-k;vals.push(board[r*4+c])}vals=line(vals);for(var j=0;j<4;j++){var rr=dir===0?j:dir===1?n:dir===2?3-j:n,cc=dir===0?n:dir===1?j:dir===2?n:3-j;next[rr*4+cc]=vals[j]}}board=next;if(board.join(',')===old)return;add();best=Math.max(best,score);save();draw()}function save(){MimiGameSave.save({board:board,score:score,best:best})}function canMove(){if(board.includes(0))return true;for(var i=0;i<16;i++){if(i%4<3&&board[i]===board[i+1])return true;if(i<12&&board[i]===board[i+4])return true}return false}function draw(){stage.innerHTML='<div class=board>'+board.map(function(v){return '<div class=tile data-v='+v+'>'+(v||'')+'</div>'}).join('')+(!canMove()?'<div class=over><strong>棋局封存</strong><button class=primary id=restart>重新开始</button></div>':'')+'</div>';hud.innerHTML='<span>分数 '+score+'</span><span>最高 '+best+'</span>';var btn=document.getElementById('restart');if(btn)btn.onclick=function(){board=Array(16).fill(0);score=0;add();add();save();draw()}}onkeydown=function(e){var map={ArrowUp:0,ArrowRight:1,ArrowDown:2,ArrowLeft:3};if(map[e.key]!==undefined){e.preventDefault();move(map[e.key])}};stage.onpointerdown=function(e){sx=e.clientX;sy=e.clientY};stage.onpointerup=function(e){var dx=e.clientX-sx,dy=e.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;move(Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0))};draw();", '#8290b4');

    games[3].html = games[3].html
        .replace('ArrowRight:1,ArrowDown:2,ArrowLeft:3', 'ArrowRight:3,ArrowDown:2,ArrowLeft:1')
        .replace('(dx>0?1:3):(dy>0?2:0)', '(dx>0?3:1):(dy>0?2:0)')
        .replace('grid-template-columns:repeat(4,1fr);gap:9px;padding:10px', 'grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr));gap:9px;padding:10px')
        .replace('.tile{display:grid;', '.tile{width:100%;height:100%;min-width:0;min-height:0;display:grid;');

    games[2].html = games[2].html
        .replace('grid-template-columns:repeat(4,1fr);gap:9px', 'grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr));gap:9px')
        .replace('.memory{font-size:', '.memory{width:100%;height:100%;min-width:0;min-height:0;padding:0;font-size:');

    games.push({
        id: 'builtin-starlight-catcher',
        title: '星辉捕手',
        english: 'STARLIGHT CATCHER',
        genre: 'ARCADE · REACTION',
        description: '星光只会在夜幕中短暂停留。快速找到并触碰不断转移的星辉，在它消失前积累更高分数。每一次成功捕获都会被记录进属于你的星光档案。',
        color: '#15102E',
        accent: '#9b7cff',
        html: simpleGameShell('星辉捕手', '在星光消失前点击它，挑战更高分数。', '.star{position:absolute;width:52px;height:52px;padding:0;color:#f4ecff;border:1px solid #d9c9ff77;border-radius:50%;background:#8067d466;box-shadow:0 0 30px #8c70eaaa;font-size:22px;animation:starIn .18s ease-out}@keyframes starIn{from{opacity:0;transform:scale(.4)}}.timer{position:absolute;right:18px;bottom:18px;left:18px;height:3px;background:#ffffff0b}.timer i{display:block;height:100%;background:#a68cff;transform-origin:left}', "var saved=MimiGameSave.load()||{best:0},score=0,best=saved.best||0,stage=document.getElementById('stage'),hud=document.getElementById('hud'),timer=0;function spawn(){clearTimeout(timer);stage.innerHTML='<button class=star>✦</button><div class=timer><i></i></div>';var star=stage.querySelector('.star'),bar=stage.querySelector('.timer i'),life=Math.max(650,1800-score*18);star.style.left=(12+Math.random()*76)+'%';star.style.top=(10+Math.random()*70)+'%';star.style.transform='translate(-50%,-50%)';bar.animate([{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration:life,fill:'forwards'});star.onclick=function(){score++;best=Math.max(best,score);MimiGameSave.save({best:best});drawHud();spawn()};timer=setTimeout(function(){score=0;drawHud();spawn()},life)}function drawHud(){hud.innerHTML='<span>连续捕获 '+score+'</span><span>最高 '+best+'</span>'}drawHud();spawn();", '#8067d4')
    });

    loadJSON(CUSTOM_GAMES_KEY, []).forEach(function (game) {
        if (game && game.title && game.html) games.push(game);
    });

    let app;
    let carousel;
    let activeIndex = 0;
    let activeSlide = 1;
    let scrollTimer = 0;
    let loopTimer = 0;
    let draftAvatar = '';
    let draftGameCover = '';
    let uploadedGameHtml = '';
    let sourceMode = 'input';
    let gameSaves = loadJSON(GAME_SAVES_KEY, []);
    let gameAlbums = loadJSON(GAME_ALBUMS_KEY, []);
    let currentAlbumGameId = '';
    let currentPlayerGame = null;
    let openedFromSave = false;
    let activeSaveId = '';
    let selectedSaveId = '';
    let currentSaveDraftData = null;
    let longPressTimer = 0;
    let longPressTriggered = false;
    let activeCodeSource = '';
    let activeCodeFilename = '';
    let profile = loadJSON(PROFILE_KEY, { name: '', bio: '', avatar: '' });
    let cardBackgrounds = loadJSON(CARD_BACKGROUNDS_KEY, {});

    function loadJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; }
        catch (_) { return fallback; }
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>'"]/g, function (char) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
        });
    }

    function renderCards() {
        const sequence = games.map(function (_, index) { return index; });
        const slides = sequence.concat(sequence, sequence);
        activeSlide = games.length + activeIndex;
        carousel.innerHTML = slides.map(function (gameIndex, slideIndex) {
            const game = games[gameIndex];
            const index = gameIndex;
            const customBackground = cardBackgrounds[index] || game.cover;
            const image = customBackground ? '<img class="game-card-image" src="' + customBackground + '" alt="' + escapeHTML(game.title) + '背景">' : '';
            return '<article class="game-card" data-card-index="' + index + '" data-slide-index="' + slideIndex + '" style="--card-background:' + game.color + ';">' +
                '<div class="game-card-inner">' +
                    '<div class="game-card-face game-card-front">' + image + '<div class="game-card-shade"></div>' +
                        '<span class="game-card-serial">ARCHIVE / ' + String(index + 1).padStart(2, '0') + '</span>' +
                        '<div class="game-card-glyph" aria-hidden="true"><span></span></div>' +
                        '<div class="game-card-front-copy"><span class="game-card-number">NO. ' + String(index + 1).padStart(2, '0') + '</span><h2>' + escapeHTML(game.title) + '</h2><p>' + game.genre + '</p></div>' +
                        '<span class="game-card-flip-hint" aria-hidden="true">↻</span>' +
                    '</div>' +
                    '<div class="game-card-face game-card-back">' +
                        '<div class="game-card-back-content"><span class="game-card-back-index">FILE / ' + String(index + 1).padStart(2, '0') + '</span><h2>' + escapeHTML(game.title) + '</h2><div class="game-card-rule"></div>' +
                        '<p class="game-card-description">' + escapeHTML(game.description) + '</p><button class="game-card-more" type="button" data-game-more="' + index + '">… 更多</button>' +
                        '<div class="game-card-background-actions"><button type="button" data-game-background="' + index + '">上传背景</button>' + (customBackground ? '<button type="button" data-game-background-reset="' + index + '">恢复纯色</button>' : '') + '</div>' +
                        '<div class="game-card-back-footer"><span>' + game.english + '</span><b>✦</b></div></div>' +
                    '</div>' +
                '</div></article>';
        }).join('');

        updateActiveCard(false);
    }

    function updateActiveCard(shouldScroll, instant) {
        const cards = Array.from(carousel.querySelectorAll('.game-card'));
        cards.forEach(function (card, slideIndex) {
            const isActive = slideIndex === activeSlide;
            card.classList.toggle('is-active', isActive);
            card.classList.toggle('is-left', slideIndex < activeSlide);
            card.classList.toggle('is-right', slideIndex > activeSlide);
            if (!isActive) card.classList.remove('is-flipped');
        });
        const headerIndex = document.getElementById('gameHeaderIndex');
        if (headerIndex) headerIndex.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(games.length).padStart(2, '0');
        if (shouldScroll && cards[activeSlide]) {
            if (instant) carousel.style.scrollBehavior = 'auto';
            cards[activeSlide].scrollIntoView({ behavior: instant ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
            if (instant) requestAnimationFrame(function () { carousel.style.scrollBehavior = ''; });
        }
    }

    function syncActiveCardFromScroll() {
        const center = carousel.scrollLeft + carousel.clientWidth / 2;
        let nearestSlide = 0;
        let nearestDistance = Infinity;
        carousel.querySelectorAll('.game-card').forEach(function (card, slideIndex) {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(cardCenter - center);
            if (distance < nearestDistance) { nearestDistance = distance; nearestSlide = slideIndex; }
        });
        if (nearestSlide !== activeSlide) {
            activeSlide = nearestSlide;
            activeIndex = Number(carousel.children[activeSlide].dataset.cardIndex);
            updateActiveCard(false);
        }
        clearTimeout(loopTimer);
        loopTimer = setTimeout(normalizeLoopPosition, 90);
    }

    function normalizeLoopPosition() {
        if (activeSlide < games.length) activeSlide += games.length;
        else if (activeSlide >= games.length * 2) activeSlide -= games.length;
        else return;
        activeIndex = Number(carousel.children[activeSlide].dataset.cardIndex);
        updateActiveCard(true, true);
    }

    function gameId(game, index) {
        return game.id || 'builtin-' + (typeof index === 'number' ? index : games.indexOf(game));
    }

    function findGameById(id) {
        return games.find(function (game, index) { return gameId(game, index) === id; });
    }

    function saveGameSaves() {
        localStorage.setItem(GAME_SAVES_KEY, JSON.stringify(gameSaves));
    }

    function ensureGameAlbum(game, index) {
        const id = gameId(game, index);
        if (!gameAlbums.some(function (album) { return album.gameId === id; })) {
            gameAlbums.push({ gameId: id, createdAt: Date.now() });
            localStorage.setItem(GAME_ALBUMS_KEY, JSON.stringify(gameAlbums));
        }
    }

    function formatSaveTime(timestamp) {
        const date = new Date(timestamp);
        const pad = function (value) { return String(value).padStart(2, '0'); };
        return date.getFullYear() + '年' + pad(date.getMonth() + 1) + '月' + pad(date.getDate()) + '日 ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    function createAutoSave(game) {
        if (!game || !game.html) return;
        const timestamp = Date.now();
        gameSaves.unshift({
            id: activeSaveId || 'save-' + timestamp + '-' + Math.random().toString(36).slice(2, 7),
            gameId: gameId(game),
            name: formatSaveTime(timestamp),
            createdAt: timestamp,
            data: currentSaveDraftData
        });
        saveGameSaves();
    }

    function renderBookshelf() {
        const shelf = document.getElementById('gameBookshelf');
        games.forEach(ensureGameAlbum);
        document.getElementById('gameArchiveCount').textContent = gameSaves.length + ' SAVES';
        const colors = [
            'linear-gradient(145deg,#66507f,#2a2038)',
            'linear-gradient(145deg,#46617d,#1b293b)',
            'linear-gradient(145deg,#7b5369,#33202b)',
            'linear-gradient(145deg,#596078,#24293a)',
            'linear-gradient(145deg,#786552,#332920)',
            'linear-gradient(145deg,#4e6d69,#1e302e)'
        ];
        const albums = games.map(function (game, index) {
            const id = gameId(game, index);
            const count = gameSaves.filter(function (save) { return save.gameId === id; }).length;
            const cover = game.cover || cardBackgrounds[index] || '';
            return '<button class="game-album" type="button" data-album-game="' + escapeHTML(id) + '"><span class="game-album-book" style="--album-color:' + colors[index % colors.length] + '">' + (cover ? '<img src="' + cover + '" alt="">' : '<span class="game-album-emblem"><i></i></span>') + '<span class="game-album-serial">ARCHIVE ' + String(index + 1).padStart(2, '0') + '</span><span class="game-album-sigil">✦</span><i class="game-album-clasp"></i><i class="game-album-ribbon"></i></span><span class="game-album-caption"><strong>' + escapeHTML(game.title) + '</strong><small>' + count + ' 张存档</small></span></button>';
        });
        shelf.innerHTML = albums.join('');
    }

    function openArchivePage() {
        document.querySelector('#gameApp > .game-header').hidden = true;
        document.querySelector('#gameApp > .game-main').hidden = true;
        document.getElementById('gameCreatePage').hidden = true;
        document.getElementById('gameArchivePage').hidden = false;
        document.getElementById('gameAlbumView').hidden = true;
        renderBookshelf();
    }

    function closeArchivePage() {
        document.getElementById('gameAlbumView').hidden = true;
        document.getElementById('gameArchivePage').hidden = true;
        document.querySelector('#gameApp > .game-header').hidden = false;
        document.querySelector('#gameApp > .game-main').hidden = false;
    }

    function openAlbum(gameIdValue) {
        const game = findGameById(gameIdValue);
        if (!game) return;
        currentAlbumGameId = gameIdValue;
        document.getElementById('gameAlbumTitle').textContent = game.title;
        renderSaveCards();
        const view = document.getElementById('gameAlbumView');
        view.hidden = false;
        view.scrollTop = 0;
    }

    function closeAlbum() {
        document.getElementById('gameAlbumView').hidden = true;
        currentAlbumGameId = '';
        renderBookshelf();
    }

    function renderSaveCards() {
        const grid = document.getElementById('gameSaveGrid');
        const saves = gameSaves.filter(function (save) { return save.gameId === currentAlbumGameId; });
        document.getElementById('gameAlbumPageCount').textContent = String(saves.length).padStart(2, '0');
        if (!saves.length) {
            grid.innerHTML = '<div class="game-save-empty">这本卡册还是空的。<br>进入游戏并退出后会自动生成存档卡牌。</div>';
            return;
        }
        grid.innerHTML = saves.map(function (save, index) {
            return '<button class="game-save-card" type="button" data-save-id="' + escapeHTML(save.id) + '"><small>SAVE / ' + String(index + 1).padStart(2, '0') + '</small><strong>' + escapeHTML(save.name) + '</strong><time>' + formatSaveTime(save.createdAt) + '</time><b>↗</b></button>';
        }).join('');
    }

    function openSaveAction(saveId) {
        const save = gameSaves.find(function (item) { return item.id === saveId; });
        if (!save) return;
        selectedSaveId = saveId;
        document.getElementById('gameSaveRenameInput').value = save.name;
        openModal(document.getElementById('gameSaveActionModal'));
    }

    function closeSaveAction() {
        selectedSaveId = '';
        closeModal(document.getElementById('gameSaveActionModal'));
    }

    function renameSelectedSave() {
        const name = document.getElementById('gameSaveRenameInput').value.trim();
        const save = gameSaves.find(function (item) { return item.id === selectedSaveId; });
        if (!save || !name) return;
        save.name = name;
        saveGameSaves();
        closeSaveAction();
        renderSaveCards();
    }

    function deleteSelectedSave() {
        const index = gameSaves.findIndex(function (item) { return item.id === selectedSaveId; });
        if (index < 0) return;
        gameSaves.splice(index, 1);
        saveGameSaves();
        closeSaveAction();
        renderSaveCards();
    }

    function enterSave(saveId) {
        const save = gameSaves.find(function (item) { return item.id === saveId; });
        const game = save && findGameById(save.gameId);
        if (!game) return;
        activeSaveId = saveId;
        openGamePlayer(game, true);
    }

    function showDescription(index) {
        const game = games[index];
        document.getElementById('gameDescriptionTitle').textContent = game.title;
        document.getElementById('gameDescriptionText').textContent = game.description;
        openModal(document.getElementById('gameDescriptionModal'));
    }

    function openModal(modal) {
        modal.hidden = false;
        requestAnimationFrame(function () { modal.classList.add('is-open'); });
    }

    function closeModal(modal) {
        modal.classList.remove('is-open');
        modal.hidden = true;
    }

    function showCodeSource(type) {
        const source = GAME_CODE_SOURCES[type];
        if (!source) return;
        activeCodeSource = source;
        activeCodeFilename = type === 'template' ? 'MimiPhone-game-template.html' : 'MimiPhone-full-game-example.html';
        document.getElementById('gameCodeTitle').textContent = type === 'template' ? '空白模板代码' : '完整游戏代码';
        document.getElementById('gameCodeContent').textContent = source;
        openModal(document.getElementById('gameCodeModal'));
    }

    function copyCodeSource() {
        if (!activeCodeSource) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(activeCodeSource).then(function () { notify('代码已复制'); });
        } else {
            const area = document.createElement('textarea');
            area.value = activeCodeSource;
            document.body.appendChild(area);
            area.select();
            document.execCommand('copy');
            area.remove();
            notify('代码已复制');
        }
    }

    function downloadCodeSource() {
        if (!activeCodeSource) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([activeCodeSource], { type: 'text/html;charset=utf-8' }));
        link.download = activeCodeFilename || 'game.html';
        link.click();
        setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
    }

    function renderAvatar() {
        const avatar = profile.avatar || '';
        const targets = [
            [document.getElementById('gameAvatarImage'), document.getElementById('gameAvatarPlaceholder')],
            [document.getElementById('gameProfileAvatarImage'), document.getElementById('gameProfileAvatarPlaceholder')]
        ];
        targets.forEach(function (pair) {
            const image = pair[0];
            const placeholder = pair[1];
            if (avatar) {
                image.src = avatar;
                image.hidden = false;
                placeholder.hidden = true;
            } else {
                image.removeAttribute('src');
                image.hidden = true;
                placeholder.hidden = false;
            }
        });
    }

    function renderDraftAvatar() {
        const image = document.getElementById('gameProfileAvatarImage');
        const placeholder = document.getElementById('gameProfileAvatarPlaceholder');
        if (draftAvatar) {
            image.src = draftAvatar;
            image.hidden = false;
            placeholder.hidden = true;
        } else {
            image.hidden = true;
            placeholder.hidden = false;
        }
    }

    function openProfile() {
        draftAvatar = profile.avatar || '';
        document.getElementById('gameProfileName').value = profile.name || '';
        document.getElementById('gameProfileBio').value = profile.bio || '';
        renderDraftAvatar();
        openModal(document.getElementById('gameProfileModal'));
    }

    function saveProfile() {
        profile = {
            name: document.getElementById('gameProfileName').value.trim(),
            bio: document.getElementById('gameProfileBio').value.trim(),
            avatar: draftAvatar
        };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        renderAvatar();
        closeModal(document.getElementById('gameProfileModal'));
    }

    function readAvatar(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = function () { draftAvatar = reader.result; renderDraftAvatar(); };
        reader.readAsDataURL(file);
    }

    function readCardBackground(file, index) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = function () {
            cardBackgrounds[index] = reader.result;
            localStorage.setItem(CARD_BACKGROUNDS_KEY, JSON.stringify(cardBackgrounds));
            renderCards();
            const card = carousel.querySelector('[data-card-index="' + index + '"]');
            if (card) card.classList.add('is-flipped');
        };
        reader.readAsDataURL(file);
    }

    function readCreateCover(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = function () {
            draftGameCover = reader.result;
            const preview = document.getElementById('gameCoverPreview');
            preview.src = draftGameCover;
            preview.hidden = false;
            document.getElementById('gameCoverPlaceholder').hidden = true;
        };
        reader.readAsDataURL(file);
    }

    function readHtmlGameFile(file) {
        if (!file || !/\.html?$/i.test(file.name)) {
            showCreateError('请选择 .html 或 .htm 文件。');
            return;
        }
        const reader = new FileReader();
        reader.onload = function () {
            uploadedGameHtml = String(reader.result || '');
            document.getElementById('gameHtmlFileName').textContent = file.name;
            showCreateError('');
        };
        reader.onerror = function () { showCreateError('HTML 文件读取失败，请重新选择。'); };
        reader.readAsText(file);
    }

    function showCreateError(message) {
        const error = document.getElementById('gameCreateError');
        error.textContent = message;
        error.hidden = !message;
    }

    function setSourceMode(mode) {
        sourceMode = mode;
        document.querySelectorAll('[data-source-mode]').forEach(function (button) {
            const active = button.dataset.sourceMode === mode;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', String(active));
        });
        document.querySelectorAll('[data-source-panel]').forEach(function (panel) {
            const active = panel.dataset.sourcePanel === mode;
            panel.classList.toggle('is-active', active);
            panel.hidden = !active;
        });
        showCreateError('');
    }

    function openCreatePage() {
        document.querySelector('#gameApp > .game-header').hidden = true;
        document.querySelector('#gameApp > .game-main').hidden = true;
        document.getElementById('gameCreatePage').hidden = false;
        document.getElementById('gameCreateName').focus();
    }

    function closeCreatePage() {
        document.getElementById('gameCreatePage').hidden = true;
        document.querySelector('#gameApp > .game-header').hidden = false;
        document.querySelector('#gameApp > .game-main').hidden = false;
    }

    function resetCreateForm() {
        document.getElementById('gameCreateForm').reset();
        document.getElementById('gameDescriptionCount').textContent = '0';
        document.getElementById('gameCoverPreview').hidden = true;
        document.getElementById('gameCoverPreview').removeAttribute('src');
        document.getElementById('gameCoverPlaceholder').hidden = false;
        document.getElementById('gameHtmlFileName').textContent = '选择 HTML 文件';
        draftGameCover = '';
        uploadedGameHtml = '';
        setSourceMode('input');
        showCreateError('');
    }

    function createGame(event) {
        event.preventDefault();
        const title = document.getElementById('gameCreateName').value.trim();
        const description = document.getElementById('gameCreateDescription').value.trim();
        const html = sourceMode === 'input' ? document.getElementById('gameHtmlSource').value.trim() : uploadedGameHtml.trim();
        if (!title) { showCreateError('请输入游戏标题。'); return; }
        if (!description) { showCreateError('请输入游戏简介。'); return; }
        if (!draftGameCover) { showCreateError('请上传一张游戏封面。'); return; }
        if (!html) { showCreateError(sourceMode === 'input' ? '请输入完整的 HTML 游戏代码。' : '请上传 HTML 游戏文件。'); return; }
        if (!/<(?:html|body|canvas|div|script)[\s>]/i.test(html)) { showCreateError('HTML 内容似乎不完整，请检查后再保存。'); return; }

        const game = {
            id: 'custom-' + Date.now(),
            title: title,
            english: 'USER CREATION',
            genre: 'CUSTOM · HTML',
            description: description,
            color: DEFAULT_CARD_COLOR,
            accent: '#9d83ff',
            cover: draftGameCover,
            html: html,
            custom: true
        };
        const customGames = games.filter(function (item) { return item.custom; }).concat(game);
        try {
            localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(customGames));
        } catch (_) {
            showCreateError('游戏文件或封面过大，无法保存在浏览器中。请压缩图片或精简 HTML 后重试。');
            return;
        }
        games.push(game);
        ensureGameAlbum(game, games.length - 1);
        activeIndex = games.length - 1;
        activeSlide = activeIndex + 1;
        renderCards();
        resetCreateForm();
        closeCreatePage();
        requestAnimationFrame(function () { updateActiveCard(true, true); });
        renderBookshelf();
        notify('「' + title + '」已创建，存档卡册已生成');
    }

    function openGamePlayer(game, fromSave) {
        if (!game.html) { notify('「' + game.title + '」游戏内容准备中'); return; }
        currentPlayerGame = game;
        openedFromSave = !!fromSave;
        const existingSave = fromSave ? gameSaves.find(function (save) { return save.id === activeSaveId; }) : null;
        if (!fromSave) activeSaveId = 'save-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        currentSaveDraftData = existingSave ? existingSave.data : null;
        document.querySelector('#gameApp > .game-header').hidden = true;
        document.querySelector('#gameApp > .game-main').hidden = true;
        document.getElementById('gameCreatePage').hidden = true;
        document.getElementById('gameArchivePage').hidden = true;
        document.getElementById('gamePlayerTitle').textContent = game.title;
        const saveBootstrap = '<script>(function(){var value=' + JSON.stringify(currentSaveDraftData) + ';window.MIMI_GAME_SAVE_ID=' + JSON.stringify(activeSaveId) + ';window.MIMI_GAME_RESUMED=' + (fromSave ? 'true' : 'false') + ';window.MimiGameSave={id:window.MIMI_GAME_SAVE_ID,load:function(){return value;},save:function(data){value=data;parent.postMessage({type:"mimi-game-save",saveId:this.id,data:data},"*");}};})();<\/script>';
        const html = /<head[\s>]/i.test(game.html) ? game.html.replace(/<head([^>]*)>/i, '<head$1>' + saveBootstrap) : saveBootstrap + game.html;
        document.getElementById('gamePlayerFrame').srcdoc = html;
        document.getElementById('gamePlayerPage').hidden = false;
    }

    function closeGamePlayer() {
        const returnToAlbum = openedFromSave && currentAlbumGameId;
        if (currentPlayerGame && !openedFromSave) createAutoSave(currentPlayerGame);
        if (currentPlayerGame && openedFromSave) {
            const existingSave = gameSaves.find(function (save) { return save.id === activeSaveId; });
            if (existingSave) { existingSave.data = currentSaveDraftData; saveGameSaves(); }
        }
        document.getElementById('gamePlayerPage').hidden = true;
        document.getElementById('gamePlayerFrame').srcdoc = '';
        currentPlayerGame = null;
        openedFromSave = false;
        activeSaveId = '';
        currentSaveDraftData = null;
        document.querySelector('#gameApp > .game-header').hidden = false;
        document.querySelector('#gameApp > .game-main').hidden = false;
        if (returnToAlbum) {
            document.querySelector('#gameApp > .game-header').hidden = true;
            document.querySelector('#gameApp > .game-main').hidden = true;
            document.getElementById('gameArchivePage').hidden = false;
            document.getElementById('gameAlbumView').hidden = false;
            renderSaveCards();
        }
    }

    function notify(message) {
        let toast = app.querySelector('.game-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'game-toast';
            toast.style.cssText = 'position:fixed;left:50%;bottom:28px;z-index:120;transform:translateX(-50%) translateY(10px);max-width:80%;padding:10px 16px;color:#eee9ff;border:1px solid rgba(190,174,255,.14);border-radius:99px;background:rgba(17,13,31,.92);box-shadow:0 14px 36px rgba(0,0,0,.4);font-size:11px;letter-spacing:.06em;opacity:0;transition:.25s;white-space:nowrap;';
            app.appendChild(toast);
        }
        toast.textContent = message;
        requestAnimationFrame(function () { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; });
        clearTimeout(notify.timer);
        notify.timer = setTimeout(function () { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(10px)'; }, 1800);
    }

    function handleAction(action) {
        const game = games[activeIndex];
        if (action === 'start') openGamePlayer(game);
        if (action === 'archive') openArchivePage();
        if (action === 'create') openCreatePage();
    }

    function bindEvents() {
        carousel.addEventListener('scroll', function () {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(syncActiveCardFromScroll, 70);
        }, { passive: true });

        carousel.addEventListener('click', function (event) {
            const more = event.target.closest('[data-game-more]');
            if (more) { event.stopPropagation(); showDescription(Number(more.dataset.gameMore)); return; }
            const upload = event.target.closest('[data-game-background]');
            if (upload) {
                event.stopPropagation();
                const input = document.getElementById('gameCardBackgroundInput');
                input.dataset.cardIndex = upload.dataset.gameBackground;
                input.click();
                return;
            }
            const reset = event.target.closest('[data-game-background-reset]');
            if (reset) {
                event.stopPropagation();
                const index = Number(reset.dataset.gameBackgroundReset);
                delete cardBackgrounds[index];
                localStorage.setItem(CARD_BACKGROUNDS_KEY, JSON.stringify(cardBackgrounds));
                renderCards();
                const resetCard = carousel.querySelector('[data-card-index="' + index + '"]');
                if (resetCard) resetCard.classList.add('is-flipped');
                return;
            }
            const card = event.target.closest('.game-card');
            if (!card) return;
            const index = Number(card.dataset.cardIndex);
            const slideIndex = Number(card.dataset.slideIndex);
            if (slideIndex !== activeSlide) {
                activeSlide = slideIndex;
                activeIndex = index;
                updateActiveCard(true);
                return;
            }
            card.classList.toggle('is-flipped');
        });

        app.querySelectorAll('[data-game-action]').forEach(function (button) {
            button.addEventListener('click', function () { handleAction(button.dataset.gameAction); });
        });
        app.querySelectorAll('[data-close-game-modal]').forEach(function (button) {
            button.addEventListener('click', function () { closeModal(document.getElementById('gameDescriptionModal')); });
        });
        app.querySelectorAll('[data-close-profile-modal]').forEach(function (button) {
            button.addEventListener('click', function () { closeModal(document.getElementById('gameProfileModal')); });
        });
        app.querySelectorAll('[data-close-tutorial-modal]').forEach(function (button) {
            button.addEventListener('click', function () { closeModal(document.getElementById('gameTutorialModal')); });
        });
        app.querySelectorAll('[data-close-save-action]').forEach(function (button) {
            button.addEventListener('click', closeSaveAction);
        });
        app.querySelectorAll('[data-close-code-modal]').forEach(function (button) {
            button.addEventListener('click', function () { closeModal(document.getElementById('gameCodeModal')); });
        });
        document.getElementById('gameAvatarButton').addEventListener('click', openProfile);
        document.getElementById('gameProfileAvatarButton').addEventListener('click', function () { document.getElementById('gameAvatarInput').click(); });
        document.getElementById('gameAvatarInput').addEventListener('change', function (event) { readAvatar(event.target.files[0]); event.target.value = ''; });
        document.getElementById('gameCardBackgroundInput').addEventListener('change', function (event) {
            readCardBackground(event.target.files[0], Number(event.target.dataset.cardIndex));
            event.target.value = '';
        });
        document.getElementById('gameRemoveAvatar').addEventListener('click', function () { draftAvatar = ''; renderDraftAvatar(); });
        document.getElementById('gameSaveProfile').addEventListener('click', saveProfile);
        document.getElementById('gameCreateBack').addEventListener('click', closeCreatePage);
        document.getElementById('gameTutorialButton').addEventListener('click', function () { openModal(document.getElementById('gameTutorialModal')); });
        document.querySelectorAll('[data-game-code]').forEach(function (button) {
            button.addEventListener('click', function () { showCodeSource(button.dataset.gameCode); });
        });
        document.getElementById('gameCodeCopy').addEventListener('click', copyCodeSource);
        document.getElementById('gameCodeDownload').addEventListener('click', downloadCodeSource);
        document.getElementById('gameCoverUpload').addEventListener('click', function () { document.getElementById('gameCoverInput').click(); });
        document.getElementById('gameCoverInput').addEventListener('change', function (event) { readCreateCover(event.target.files[0]); event.target.value = ''; });
        document.getElementById('gameHtmlUpload').addEventListener('click', function () { document.getElementById('gameHtmlFileInput').click(); });
        document.getElementById('gameHtmlFileInput').addEventListener('change', function (event) { readHtmlGameFile(event.target.files[0]); event.target.value = ''; });
        document.querySelectorAll('[data-source-mode]').forEach(function (button) {
            button.addEventListener('click', function () { setSourceMode(button.dataset.sourceMode); });
        });
        document.getElementById('gameCreateDescription').addEventListener('input', function (event) {
            document.getElementById('gameDescriptionCount').textContent = String(event.target.value.length);
        });
        document.getElementById('gameCreateForm').addEventListener('submit', createGame);
        document.getElementById('gamePlayerBack').addEventListener('click', closeGamePlayer);
        document.getElementById('gameArchiveBack').addEventListener('click', closeArchivePage);
        document.getElementById('gameAlbumBack').addEventListener('click', closeAlbum);
        document.getElementById('gameSaveRename').addEventListener('click', renameSelectedSave);
        document.getElementById('gameSaveDelete').addEventListener('click', deleteSelectedSave);
        window.addEventListener('message', function (event) {
            if (event.source !== document.getElementById('gamePlayerFrame').contentWindow) return;
            if (!event.data || event.data.type !== 'mimi-game-save' || event.data.saveId !== activeSaveId) return;
            currentSaveDraftData = event.data.data;
            if (openedFromSave) {
                const save = gameSaves.find(function (item) { return item.id === activeSaveId; });
                if (save) { save.data = currentSaveDraftData; saveGameSaves(); }
            }
        });
        const albumGallery = document.getElementById('gameBookshelf');
        let albumDragStartX = 0;
        let albumDragStartScroll = 0;
        let albumDragging = false;
        let pressedAlbumId = '';
        let suppressAlbumClick = false;
        albumGallery.addEventListener('pointerdown', function (event) {
            const album = event.target.closest('[data-album-game]');
            if (!album) return;
            albumDragStartX = event.clientX;
            albumDragStartScroll = albumGallery.scrollLeft;
            albumDragging = true;
            pressedAlbumId = album.dataset.albumGame;
            suppressAlbumClick = false;
            albumGallery.classList.add('is-dragging');
            albumGallery.setPointerCapture(event.pointerId);
        });
        albumGallery.addEventListener('pointermove', function (event) {
            if (!albumDragging) return;
            const distance = event.clientX - albumDragStartX;
            if (Math.abs(distance) > 7) suppressAlbumClick = true;
            albumGallery.scrollLeft = albumDragStartScroll - distance;
        });
        function finishAlbumDrag(event) {
            if (!albumDragging) return;
            albumDragging = false;
            albumGallery.classList.remove('is-dragging');
            if (event && albumGallery.hasPointerCapture(event.pointerId)) albumGallery.releasePointerCapture(event.pointerId);
            if (!suppressAlbumClick && pressedAlbumId && event && event.type === 'pointerup') {
                const id = pressedAlbumId;
                pressedAlbumId = '';
                openAlbum(id);
                return;
            }
            pressedAlbumId = '';
            const center = albumGallery.scrollLeft + albumGallery.clientWidth / 2;
            let nearest = null;
            let distance = Infinity;
            albumGallery.querySelectorAll('.game-album').forEach(function (album) {
                const albumCenter = album.offsetLeft + album.offsetWidth / 2;
                const nextDistance = Math.abs(albumCenter - center);
                if (nextDistance < distance) { distance = nextDistance; nearest = album; }
            });
            if (nearest) nearest.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
        albumGallery.addEventListener('pointerup', finishAlbumDrag);
        albumGallery.addEventListener('pointercancel', finishAlbumDrag);
        albumGallery.addEventListener('click', function (event) {
            if (event.detail !== 0) return;
            const album = event.target.closest('[data-album-game]');
            if (album) openAlbum(album.dataset.albumGame);
        });
        const saveGrid = document.getElementById('gameSaveGrid');
        function beginSavePress(event) {
            const card = event.target.closest('[data-save-id]');
            if (!card) return;
            longPressTriggered = false;
            clearTimeout(longPressTimer);
            longPressTimer = setTimeout(function () {
                longPressTriggered = true;
                openSaveAction(card.dataset.saveId);
            }, 650);
        }
        function cancelSavePress() { clearTimeout(longPressTimer); }
        saveGrid.addEventListener('pointerdown', beginSavePress);
        saveGrid.addEventListener('pointerup', cancelSavePress);
        saveGrid.addEventListener('pointercancel', cancelSavePress);
        saveGrid.addEventListener('pointerleave', cancelSavePress);
        saveGrid.addEventListener('contextmenu', function (event) {
            const card = event.target.closest('[data-save-id]');
            if (!card) return;
            event.preventDefault();
            clearTimeout(longPressTimer);
            longPressTriggered = true;
            openSaveAction(card.dataset.saveId);
        });
        saveGrid.addEventListener('click', function (event) {
            const card = event.target.closest('[data-save-id]');
            if (!card) return;
            if (longPressTriggered) { longPressTriggered = false; return; }
            enterSave(card.dataset.saveId);
        });
    }

    function init() {
        app = document.getElementById('gameApp');
        carousel = document.getElementById('gameCarousel');
        if (!app || !carousel) return;
        renderCards();
        renderAvatar();
        bindEvents();
    }

    function openGameApp() {
        if (!app) init();
        app.hidden = false;
        document.body.classList.add('game-app-active');
        requestAnimationFrame(function () { updateActiveCard(true, true); });
    }

    function closeGameApp() {
        if (!app) return;
        closeGamePlayer();
        closeCreatePage();
        closeArchivePage();
        app.hidden = true;
        document.body.classList.remove('game-app-active');
        app.querySelectorAll('.game-modal').forEach(function (modal) { modal.hidden = true; });
    }

    window.openGameApp = openGameApp;
    window.closeGameApp = closeGameApp;
    window.setGameCardBackground = function (index, dataUrl) {
        if (index < 0 || index >= games.length) return;
        if (dataUrl) cardBackgrounds[index] = dataUrl;
        else delete cardBackgrounds[index];
        localStorage.setItem(CARD_BACKGROUNDS_KEY, JSON.stringify(cardBackgrounds));
        renderCards();
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
