// WeChat related Global Variables
let quotedMessage = null;
let messageToForward = null;
let isMultiSelectMode = false;
let selectedMsgIndexes = new Set();
let currentForwardMode = 'single'; // 'single', 'multi-one-by-one', 'multi-combine'

let momentsData = [];
let currentMomentImage = '';
let currentMomentsFriendId = null;

let momentImages = []; 
let editingMomentId = null;
let currentMomentId = null;
let currentCommentIndex = null;
let currentReplyTo = null;

let wechatVisible = false;
let chatList = [];
let groupList = [];

let contacts = [];
let contactSelectMode = false;
let selectedContacts = new Set();
let editingContactId = null;
let swipedContactId = null;

let currentDetailFriendId = null;
let isOpenedFromContactDetail = false;

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

let realNameInfo = {
    name: '未设置',
    age: '未设置',
    gender: '未设置',
    birthday: '未设置',
    job: '未设置',
    location: '未设置',
    hometown: '未设置',
    persona: '未设置'
};

let personalInfoSource = 'me';
let chatHistories = {};
let longPressTimer = null;
let currentLongPressedMsg = null;
let currentChatFriendId = null;

let currentStickerCategory = 'default';
let favoriteStickers = [];
let isPanelToggling = false; 

let mobileNetModel = null;

let topCategories = []; // { name: string, contactIds: number[] }
let currentSelectedCategory = '默认';
let currentEditingCategoryName = null;
let selectedContactIdsForCategory = new Set();

let favoritesData = [];
let favSelectMode = false;
let selectedFavIds = new Set();
let currentLongPressedFav = null;
let favLongPressTimer = null;

let stickerList = [];
let currentUploadMode = 'single';
let currentEditingStickerIndex = null;

let pendingStickerFiles = [];

let worldBooks = JSON.parse(localStorage.getItem('mimi_world_books') || '[]');
let currentEditingBookId = null;
let currentEditingItemId = null;

let bookIdToDelete = null;
let itemIdToDelete = null;

let tempBoundWorldBookIds = [];
let selectedFriendContactId = null;
let selectedGroupContacts = new Set();
let currentGroupChatId = null;

// Mimi号逻辑
function initMimiId() {
    let mimiId = localStorage.getItem('mimi_unique_id');
    if (!mimiId) {
        mimiId = 'Mimi_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        localStorage.setItem('mimi_unique_id', mimiId);
    }
    const idDisplay = document.getElementById('info-mimi-id');
    if (idDisplay) idDisplay.textContent = mimiId;
    
    const meIdDisplay = document.getElementById('wechatMeID');
    if (meIdDisplay) meIdDisplay.textContent = 'Mimi号：' + mimiId;

    const savedBg = localStorage.getItem('mimi_moments_bg');
    if (savedBg) {
        const bgImg = document.getElementById('momentsBg');
        if (bgImg) bgImg.src = savedBg;
    }
}

// 朋友圈逻辑
async function openMoments(friendId = null) {
    showContainer('momentsContainer');
    document.body.classList.add('moments-active');
    currentMomentsFriendId = friendId ? Number(friendId) : null;
    const container = document.getElementById('momentsContainer');
    document.body.classList.remove('moments-scrolled');
    const scrollArea = document.getElementById('momentsScrollArea');
    if (scrollArea) scrollArea.scrollTop = 0;

    container.onclick = (e) => {
        if (!e.target.closest('#momentCommentInputBar') && 
            !e.target.closest('#momentActionPopup') && 
            !e.target.closest('.moment-actions-btn')) {
            hideMomentPopups();
        }
    };

    const bgImg = document.getElementById('momentsBg');
    if (bgImg) {
        const bgKey = currentMomentsFriendId ? `mimi_moments_bg_AI_${currentMomentsFriendId}` : 'mimi_moments_bg';
        const savedBg = localStorage.getItem(bgKey);
        bgImg.src = savedBg || DEFAULT_LANDSCAPE;
        bgImg.onclick = (e) => {
            e.stopPropagation();
            changeMomentsBg();
        };
        bgImg.style.cursor = 'pointer';
    }
    
    const avatarImg = document.getElementById('momentsAvatar');
    const nameEl = document.getElementById('momentsUsername');
    const sigEl = document.getElementById('momentsSignature');
    const postBtn = document.querySelector('.moments-header-right');

    if (currentMomentsFriendId) {
        const friend = chatList.find(f => f.id === currentMomentsFriendId);
        const contact = contacts.find(c => c.id === (friend ? friend.contactId : null));
        if (avatarImg) avatarImg.src = (friend ? friend.avatar : '') || (contact ? contact.avatar : '') || DEFAULT_AVATAR;
        if (nameEl) {
            const remark = friend ? friend.remark : '';
            const netName = contact ? contact.netName : '';
            nameEl.textContent = remark || netName || (friend ? friend.name : '未知');
        }
        const signature = (contact ? contact.signature : '') || '';
        if (sigEl) {
            sigEl.textContent = signature;
            sigEl.style.display = (signature && signature !== '未设置' && signature.trim() !== '') ? 'block' : 'none';
        }
        if (postBtn) {
            postBtn.style.visibility = 'visible';
            postBtn.onclick = () => refreshAiMoments();
            postBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>`;
        }
    } else {
        const me = wechatUserInfo;
        if (avatarImg) avatarImg.src = me.avatar || DEFAULT_AVATAR;
        if (nameEl) nameEl.textContent = me.nickname || '未设置网名';
        const signature = me.signature || '';
        if (sigEl) {
            sigEl.textContent = signature || '个性签名...';
            sigEl.style.display = (signature && signature !== '未设置' && signature !== '个性签名...' && signature.trim() !== '') ? 'block' : 'none';
        }
        if (postBtn) {
            postBtn.style.visibility = 'visible';
            postBtn.onclick = () => openMomentsEdit();
            postBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                </svg>`;
        }
    }
    const header = document.getElementById('momentsHeader');
    if (header) {
        header.classList.remove('scrolled');
        header.style.backgroundColor = 'transparent';
        header.style.color = '#000';
    }
    await loadMoments();
    renderMoments();
    updateTime();
    saveUIState();
}

async function loadMoments() {
    try {
        const data = await dbGet('settings', 'mimi_moments');
        if (data) {
            momentsData = data.value;
        } else {
            const saved = localStorage.getItem('mimi_moments');
            if (saved) {
                momentsData = JSON.parse(saved);
                await saveMoments();
            }
        }
    } catch (e) {
        console.error("Load Moments Error:", e);
        const saved = localStorage.getItem('mimi_moments');
        if (saved) momentsData = JSON.parse(saved);
    }
}

async function saveMoments() {
    try {
        await dbPut('settings', { key: 'mimi_moments', value: momentsData });
    } catch (e) {
        console.error("Save Moments Error:", e);
        safeLocalStorageSet('mimi_moments', JSON.stringify(momentsData));
    }
}

function closeMoments() {
    document.getElementById('momentsContainer').style.display = 'none';
    document.body.classList.remove('moments-active');
    saveUIState();
}

function handleMomentsScroll(el) {
    const header = document.getElementById('momentsHeader');
    if (!header) return;
    const scrollThreshold = 5;
    if (el.scrollTop > scrollThreshold) {
        header.classList.add('scrolled');
        document.body.classList.add('moments-scrolled');
        header.style.backgroundColor = '#f2f2f2';
        header.style.color = '#000';
    } else {
        header.classList.remove('scrolled');
        document.body.classList.remove('moments-scrolled');
        header.style.backgroundColor = 'transparent';
        header.style.color = '#000';
    }
    hideMomentPopups();
}

async function refreshAiMoments() {
    const postBtn = document.querySelector('.moments-header-right');
    const svg = postBtn ? postBtn.querySelector('svg') : null;
    if (!svg || svg.classList.contains('spinning')) return;
    svg.classList.add('spinning');
    try {
        if (currentMomentsFriendId) {
            await generateAiMoment(currentMomentsFriendId);
        } else {
            const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
            const availableFriends = chatList.filter(f => allSettings[f.id] && allSettings[f.id].proactiveMoment);
            if (availableFriends.length > 0) {
                const randomFriend = availableFriends[Math.floor(Math.random() * availableFriends.length)];
                await generateAiMoment(randomFriend.id);
            } else if (chatList.length > 0) {
                const randomFriend = chatList[Math.floor(Math.random() * chatList.length)];
                await generateAiMoment(randomFriend.id);
            }
        }
    } catch (err) {
        console.error("Refresh AI Moments error:", err);
    } finally {
        svg.classList.remove('spinning');
    }
}

function openMomentsEdit(item = null) {
    document.getElementById('momentsEditPage').style.display = 'flex';
    const input = document.getElementById('momentTextInput');
    if (item) {
        editingMomentId = item.id;
        input.value = item.content;
        momentImages = JSON.parse(JSON.stringify(item.images || []));
    } else {
        editingMomentId = null;
        input.value = '';
        momentImages = [];
    }
    renderEditImages();
    updatePostBtnState();
}

function closeMomentsEdit() {
    document.getElementById('momentsEditPage').style.display = 'none';
    editingMomentId = null;
}

function updatePostBtnState() {
    const text = document.getElementById('momentTextInput').value.trim();
    const btn = document.getElementById('momentsPostBtn');
    if (text || momentImages.length > 0) {
        btn.classList.add('active');
        btn.style.backgroundColor = '#000';
    } else {
        btn.classList.remove('active');
        btn.style.backgroundColor = '#e1e1e1';
    }
}

function selectMomentImage() {
    const modal = document.getElementById('momentUploadOptionsModal');
    if (!modal) return;
    modal.classList.add('active');
}

function triggerMomentInputContent() {
    document.getElementById('momentUploadOptionsModal').classList.remove('active');
    const modal = document.getElementById('imageContentModal');
    if (!modal) return;
    modal.classList.add('active');
    const textarea = document.getElementById('imageContentInput');
    textarea.value = '';
    textarea.focus();
    const confirmBtn = modal.querySelector('.modal-btn.confirm');
    if (confirmBtn) confirmBtn.onclick = confirmImageContent;
}

function triggerMomentAlbumSelect() {
    document.getElementById('momentUploadOptionsModal').classList.remove('active');
    document.getElementById('momentImageInput').click();
}

function closeImageContentModal() {
    document.getElementById('imageContentModal').classList.remove('active');
}

async function confirmImageContent() {
    const content = document.getElementById('imageContentInput').value.trim();
    if (content) {
        if (momentImages.length >= 9) {
            alert('最多只能发送九张图片');
            return;
        }
        momentImages.push({ type: 'text', content: content });
        renderEditImages();
        updatePostBtnState();
    }
    closeImageContentModal();
}

function renderEditImages() {
    const container = document.getElementById('momentEditImagesContainer');
    if (!container) return;
    container.innerHTML = '';
    momentImages.forEach((img, idx) => {
        const item = document.createElement('div');
        item.className = 'moment-preview-image';
        if (img.type === 'text') {
            item.innerHTML = `<span>${img.content}</span>`;
        } else {
            item.style.backgroundImage = `url(${img.content})`;
            item.style.backgroundSize = 'cover';
        }
        item.onclick = () => {
            if (confirm('是否删除这张图片？')) {
                momentImages.splice(idx, 1);
                renderEditImages();
                updatePostBtnState();
            }
        };
        container.appendChild(item);
    });
    if (momentImages.length < 9) {
        const uploader = document.createElement('div');
        uploader.className = 'moment-image-uploader';
        uploader.onclick = selectMomentImage;
        uploader.innerHTML = '<div class="uploader-plus">+</div>';
        container.appendChild(uploader);
    }
}

function showMomentImageDetail(content) {
    const modal = document.getElementById('imageDetailModal');
    const textEl = document.getElementById('imageDetailText');
    if (modal && textEl) {
        textEl.textContent = content;
        modal.classList.add('active');
    }
}

function closeImageDetail() {
    document.getElementById('imageDetailModal').classList.remove('active');
}

function handleMomentImageSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        if (momentImages.length >= 9) {
            alert('最多只能发送九张图片');
            return;
        }
        const reader = new FileReader();
        reader.onload = async function(e) {
            const imgSrc = e.target.result;
            const imgItem = { type: 'image', content: imgSrc, description: '正在识别...' };
            momentImages.push(imgItem);
            renderEditImages();
            updatePostBtnState();
            try {
                const predictions = await recognizeImage(imgSrc);
                if (predictions && predictions.length > 0) {
                    const top = predictions[0];
                    imgItem.description = `${top.className} (${(top.probability * 100).toFixed(1)}%)`;
                } else {
                    imgItem.description = '无法识别';
                }
                renderEditImages();
            } catch (err) {
                console.error("Moment image recognition error:", err);
                imgItem.description = '识别出错';
                renderEditImages();
            }
        };
        reader.readAsDataURL(file);
    }
    event.target.value = '';
}

async function postMoment() {
    const text = document.getElementById('momentTextInput').value.trim();
    if (!text && momentImages.length === 0) return;
    const me = wechatUserInfo;
    let postedId = null;
    if (editingMomentId) {
        const moment = momentsData.find(m => m.id === editingMomentId);
        if (moment) {
            moment.content = text;
            moment.images = JSON.parse(JSON.stringify(momentImages));
            postedId = editingMomentId;
        }
    } else {
        const newMoment = {
            id: Date.now(),
            nickname: me.nickname || '我',
            avatar: me.avatar || wechatUserInfo.avatar || '',
            content: text,
            images: JSON.parse(JSON.stringify(momentImages)),
            time: Date.now(),
            likes: [],
            comments: [],
            isMine: true
        };
        momentsData.unshift(newMoment);
        postedId = newMoment.id;
    }
    await saveMoments();
    if (!editingMomentId && postedId) {
        setTimeout(() => triggerAutoMomentsFeedback(postedId), 2000);
    }
    momentImages = [];
    editingMomentId = null;
    closeMomentsEdit();
    renderMoments();
}

function isMomentVisible(time, range) {
    const now = Date.now();
    const diff = now - time;
    const DAY = 24 * 60 * 60 * 1000;
    if (range === '最近三天') return diff <= 3 * DAY;
    if (range === '最近一个月') return diff <= 30 * DAY;
    if (range === '最近半年') return diff <= 180 * DAY;
    return true;
}

function renderMoments() {
    const popup = document.getElementById('momentActionPopup');
    if (popup && popup.parentElement) {
        document.getElementById('momentsContainer').appendChild(popup);
        popup.style.display = 'none';
    }
    const list = document.getElementById('momentsList');
    if (!list) return;
    list.innerHTML = '';
    const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
    momentsData.forEach((item, index) => {
        if (currentMomentsFriendId) {
            if (item.isMine || item.friendId !== currentMomentsFriendId) return;
        }
        if (!item.isMine && item.friendId) {
            const settings = allSettings[item.friendId] || {};
            const range = settings.aiMomentRange || '最近三天';
            if (!isMomentVisible(item.time, range)) return;
        }
        const momentEl = document.createElement('div');
        momentEl.className = 'moment-item';
        momentEl.setAttribute('data-moment-id', item.id);
        let momentLongPressTimer;
        momentEl.addEventListener('touchstart', (e) => {
            momentLongPressTimer = setTimeout(() => {
                showMomentContextMenu(item, e.touches[0]);
            }, 600);
        }, { passive: true });
        momentEl.addEventListener('touchend', () => clearTimeout(momentLongPressTimer));
        momentEl.addEventListener('touchmove', () => clearTimeout(momentLongPressTimer));
        momentEl.addEventListener('mousedown', (e) => {
            momentLongPressTimer = setTimeout(() => {
                showMomentContextMenu(item, e);
            }, 600);
        });
        momentEl.addEventListener('mouseup', () => clearTimeout(momentLongPressTimer));
        momentEl.addEventListener('mouseleave', () => clearTimeout(momentLongPressTimer));

        let imagesHtml = '';
        if (item.images && item.images.length > 0) {
            let cols = 3;
            if (item.images.length === 1) cols = 1;
            else if (item.images.length === 2 || item.images.length === 4) cols = 2;
            imagesHtml = `<div class="moment-images" style="grid-template-columns: repeat(${cols}, 1fr);">`;
            item.images.forEach(img => {
                if (img.type === 'text') {
                    imagesHtml += `<div class="moment-img" onclick="showMomentImageDetail('${img.content}')" style="display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; padding:5px; text-align:center;">${img.content}</div>`;
                } else {
                    imagesHtml += `
                        <div style="position: relative; width: 100%; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background-color: #555;">
                            <img src="${img.content}" class="moment-img" onclick="previewImage('${img.content}')" style="width: 100%; height: 100%; display: block; border-radius: 0;">
                        </div>`;
                }
            });
            imagesHtml += `</div>`;
        }
        let likesHtml = '';
        if (item.likes && item.likes.length > 0) {
            likesHtml = `<div class="moment-likes-box"><span class="heart-hollow">♡</span>${item.likes.join(', ')}</div>`;
        }
        let dividerHtml = (item.likes && item.likes.length > 0 && item.comments && item.comments.length > 0) ? '<div class="moment-feedback-divider"></div>' : '';
        let commentsHtml = '';
        if (item.comments && item.comments.length > 0) {
            commentsHtml = `<div class="moment-comments-list">
                ${item.comments.map((c, cIdx) => {
                    let replyText = c.replyTo ? ` <span class="moment-comment-reply">回复</span> <span class="moment-comment-nickname">${c.replyTo}</span>` : '';
                    return `<div class="moment-comment-item" onclick="handleCommentClick(${item.id}, ${cIdx}, event)">
                        <span class="moment-comment-nickname">${c.nickname}</span>${replyText}：${c.content}
                    </div>`;
                }).join('')}
            </div>`;
        }
        const contentHtml = item.content ? `<div class="moment-text">${item.content}</div>` : '';
        momentEl.innerHTML = `
            <img src="${item.avatar || DEFAULT_AVATAR}" class="moment-avatar">
            <div class="moment-content-box">
                <div class="moment-nickname">${item.nickname}</div>
                ${contentHtml}
                ${imagesHtml}
                <div class="moment-footer">
                    <div class="moment-time">${formatMomentTime(item.time)}</div>
                    <div class="moment-actions-btn" onclick="toggleMomentActions(${item.id}, event)">
                        <div class="dot-icon"></div>
                        <div class="dot-icon"></div>
                    </div>
                </div>
                <div class="moment-feedback-section" style="${(!likesHtml && !commentsHtml) ? 'display:none' : ''}">
                    ${likesHtml}${dividerHtml}${commentsHtml}
                </div>
            </div>
        `;
        list.appendChild(momentEl);
    });
}

function formatMomentTime(ms) {
    const now = Date.now();
    const diff = now - ms;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff/60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff/3600000) + '小时前';
    return Math.floor(diff/86400000) + '天前';
}

function handleCommentClick(momentId, commentIdx, event) {
    event.stopPropagation();
    const moment = momentsData.find(m => m.id === momentId);
    if (!moment) return;
    const comment = moment.comments[commentIdx];
    if (!comment) return;
    const myNickname = wechatUserInfo.nickname || '我';
    if (comment.nickname === myNickname) {
        currentMomentId = momentId;
        currentCommentIndex = commentIdx;
        showCommentContextMenu(momentId, commentIdx, event);
    } else {
        showMomentCommentInput(momentId, event, comment.nickname);
    }
}

function showCommentContextMenu(momentId, commentIdx, event) {
    if (event && event.preventDefault) event.preventDefault();
    const menu = document.getElementById('commentActionModal');
    if (!menu) return;
    currentMomentId = momentId;
    currentCommentIndex = commentIdx;
    const moment = momentsData.find(m => m.id === momentId);
    const comment = moment.comments[commentIdx];
    const myNickname = wechatUserInfo.nickname || '我';
    const btnGroup = menu.querySelector('.modal-buttons');
    btnGroup.innerHTML = '';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'modal-btn';
    copyBtn.style.cssText = 'background: #fff; color: #000; border-bottom: 1px solid #eee; border-radius: 0;';
    copyBtn.textContent = '复制';
    copyBtn.onclick = copyComment;
    btnGroup.appendChild(copyBtn);
    if (comment.nickname !== myNickname) {
        const redoBtn = document.createElement('button');
        redoBtn.className = 'modal-btn';
        redoBtn.style.cssText = 'background: #fff; color: #07c160; border-bottom: 1px solid #eee; border-radius: 0;';
        redoBtn.textContent = '重回';
        redoBtn.onclick = async () => {
            menu.classList.remove('active');
            const friend = chatList.find(f => getFriendDisplayName(f) === comment.nickname);
            if (friend) {
                await callAIForMoment(momentId, friend, 'reply_to_user', { userComment: "(系统触发重回)" });
            } else {
                const contact = contacts.find(c => (c.remark || c.netName || c.name) === comment.nickname);
                if (contact) {
                    const tempFriend = { id: 0, contactId: contact.id, name: contact.name };
                    await callAIForMoment(momentId, tempFriend, 'reply_to_user', { userComment: "(系统触发重回)" });
                }
            }
        };
        btnGroup.appendChild(redoBtn);
    }
    const delBtn = document.createElement('button');
    delBtn.className = 'modal-btn';
    delBtn.style.cssText = 'background: #fff; color: #fa5151; border-radius: 0;';
    delBtn.textContent = '删除';
    delBtn.onclick = deleteComment;
    btnGroup.appendChild(delBtn);
    menu.classList.add('active');
    if (navigator.vibrate) navigator.vibrate(50);
}

async function deleteComment() {
    if (currentMomentId && currentCommentIndex !== null) {
        const moment = momentsData.find(m => m.id === currentMomentId);
        if (moment) {
            moment.comments.splice(currentCommentIndex, 1);
            await saveMoments();
            renderMoments();
        }
    }
    document.getElementById('commentActionModal').classList.remove('active');
}

function copyComment() {
    if (currentMomentId && currentCommentIndex !== null) {
        const moment = momentsData.find(m => m.id === currentMomentId);
        if (moment) {
            const comment = moment.comments[currentCommentIndex];
            navigator.clipboard.writeText(comment.content).then(() => { alert('已复制'); });
        }
    }
    document.getElementById('commentActionModal').classList.remove('active');
}

function toggleMomentActions(id, event) {
    event.stopPropagation();
    const popup = document.getElementById('momentActionPopup');
    const inputBar = document.getElementById('momentCommentInputBar');
    if (inputBar && inputBar.style.display === 'flex') {
        inputBar.style.display = 'none';
        document.getElementById('momentCommentInput').blur();
    }
    const btn = event.currentTarget;
    const isShownOnSame = currentMomentId === id && popup.style.display === 'flex';
    if (isShownOnSame) {
        popup.style.display = 'none';
        currentMomentId = null;
        return;
    }
    currentMomentId = id;
    const footer = btn.closest('.moment-footer');
    footer.appendChild(popup);
    popup.style.display = 'flex';
    const moment = momentsData.find(m => m.id === id);
    const myName = wechatUserInfo.nickname || '我';
    const likeBtn = document.getElementById('momentLikeBtn');
    if (moment && likeBtn) {
        likeBtn.textContent = (moment.likes && moment.likes.includes(myName)) ? '取消' : '点赞';
        likeBtn.onclick = (e) => { handleMomentLike(id, e); };
    }
    const commentBtn = document.getElementById('momentCommentBtn');
    if (commentBtn) { commentBtn.onclick = (e) => { showMomentCommentInput(id, e); }; }
    const contactReplyBtn = document.getElementById('momentContactReplyBtn');
    if (contactReplyBtn) { contactReplyBtn.onclick = (e) => { handleMomentContactReply(id, e); }; }
}

async function handleMomentContactReply(id, event) {
    event.stopPropagation();
    hideMomentPopups();
    const moment = momentsData.find(m => m.id === id);
    if (!moment) return;
    if (chatList.length === 0) {
        alert('请先添加好友以进行联系人回复');
        return;
    }
    let targetFriend = null;
    if (currentMomentsFriendId) {
        targetFriend = chatList.find(f => f.id === currentMomentsFriendId);
    } else if (!moment.isMine && moment.friendId) {
        targetFriend = chatList.find(f => f.id === moment.friendId);
    }
    if (!targetFriend) { targetFriend = chatList[Math.floor(Math.random() * chatList.length)]; }
    await callAIForMoment(id, targetFriend, 'manual_trigger');
}

function triggerAutoMomentsFeedback(momentId) {
    if (chatList.length === 0) return;
    const count = Math.floor(Math.random() * 4) + 1;
    const shuffled = [...chatList].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    selected.forEach((friend, index) => {
        const delay = Math.random() * 15000 + 2000;
        setTimeout(() => callAIForMoment(momentId, friend, 'auto_feedback'), delay);
    });
}

async function callAIForMoment(momentId, friend, type, context = {}) {
    const moment = momentsData.find(m => m.id === momentId);
    if (!moment) return;
    const configId = localStorage.getItem('current_api_config_id') || 'default';
    const configs = await dbGetAll('api_configs');
    const config = configs.find(c => c.id === configId);
    if (!config || !config.url || !config.key) return;
    const contact = contacts.find(c => c.id === friend.contactId);
    const nickname = getFriendDisplayName(friend);
    let imgDescriptions = [];
    if (moment.images && moment.images.length > 0) {
        moment.images.forEach(img => {
            if (img.type === 'text') imgDescriptions.push(img.content);
            else if (img.description) imgDescriptions.push(img.description);
        });
    }
    const history = chatHistories[friend.id] || [];
    const chatContext = history.slice(-10).map(m => `${m.type === 'sent' ? '用户' : '你'}: ${m.content}`).join('\n');
    let systemPrompt = `你现在的身份是微信好友：${nickname}。
【重要指令】：你不是AI，也不是助手，你就是这个真实的微信联系人。你现在正闲着没事刷朋友圈。
【你的人设】：${contact ? contact.design : '一个普通的微信好友'}。请务必读取并严格遵守。
【当前记忆/上下文】：${getChatSettings(friend.id).manualMemory || '暂无特殊记忆'}。
【私聊历史参考】：\n${chatContext || '暂无私聊记录'}
【朋友圈内容】：${moment.content}
${imgDescriptions.length > 0 ? '【朋友圈配图内容】：' + imgDescriptions.join('、') : ''}
【任务】：作为真实的联系人，看到朋友圈后的自然反应。`;
    if (type === 'auto_feedback' || type === 'manual_trigger') {
        systemPrompt += `\n任务：决定是否给这条朋友圈点赞，以及是否进行评论。
请根据你的人设、记忆和你们之前的私聊默契，以 JSON 格式返回你的 decision：
{ "like": boolean, "comment": string }`;
    } else if (type === 'reply_to_user') {
        systemPrompt += `\n用户在朋友圈回复了你的评论："${context.userComment}"。
直接返回回复内容（20字以内，口语化）。如果不回复，请返回 "SKIP"。`;
    }
    try {
        let apiUrl = config.url.trim().replace(/\/$/, '');
        if (!apiUrl.endsWith('/chat/completions')) apiUrl += '/chat/completions';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` },
            body: JSON.stringify({
                model: config.model,
                messages: [{ role: "system", content: systemPrompt }],
                temperature: 0.8
            })
        });
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const resContent = data.choices[0].message.content.trim();
            if (type === 'reply_to_user') {
                if (resContent.toUpperCase() !== 'SKIP' && resContent !== '') {
                    const newComment = { nickname: nickname, content: resContent, time: Date.now(), replyTo: wechatUserInfo.nickname || '我' };
                    moment.comments.push(newComment);
                    await saveMoments();
                    renderMoments();
                }
            } else {
                try {
                    const jsonStr = resContent.match(/\{.*\}/s) ? resContent.match(/\{.*\}/s)[0] : resContent;
                    const decision = JSON.parse(jsonStr);
                    let changed = false;
                    if (decision.like && !moment.likes.includes(nickname)) {
                        moment.likes.push(nickname);
                        changed = true;
                    }
                    if (decision.comment && decision.comment.trim() !== "") {
                        moment.comments.push({ nickname: nickname, content: decision.comment.trim(), time: Date.now() });
                        changed = true;
                    }
                    if (changed) { await saveMoments(); renderMoments(); }
                } catch (jsonErr) { console.error("AI Decision Parse Error:", jsonErr, resContent); }
            }
        }
    } catch (e) { console.error("AI Moment Interaction Error:", e); }
}

function showMomentContextMenu(item, pos) {
    const menu = document.getElementById('momentContextMenu');
    currentMomentId = item.id;
    menu.style.display = 'flex';
    const top = pos.clientY - 20;
    const left = Math.max(10, Math.min(window.innerWidth - 250, pos.clientX - 120));
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
    const editBtn = document.getElementById('momentMenuEdit');
    const deleteBtn = document.getElementById('momentMenuDelete');
    const repostBtn = document.getElementById('momentMenuRepost');
    if (item.isMine) {
        editBtn.style.display = 'block'; deleteBtn.style.display = 'block'; repostBtn.style.display = 'none';
        editBtn.style.width = '50%'; deleteBtn.style.width = '50%';
    } else {
        editBtn.style.display = 'block'; deleteBtn.style.display = 'block'; repostBtn.style.display = 'block';
        editBtn.style.width = '33.3%'; deleteBtn.style.width = '33.3%'; repostBtn.style.width = '33.3%';
    }
    editBtn.onclick = () => handleMomentLongAction('edit', item);
    deleteBtn.onclick = () => handleMomentLongAction('delete', item);
    repostBtn.onclick = () => handleMomentLongAction('repost', item);
    if (navigator.vibrate) navigator.vibrate(50);
}

async function handleMomentLongAction(action, item) {
    document.getElementById('momentContextMenu').style.display = 'none';
    if (action === 'delete') {
        if (confirm('是否删除这条朋友圈？')) {
            momentsData = momentsData.filter(m => m.id !== item.id);
            await saveMoments(); renderMoments();
        }
    } else if (action === 'edit') {
        openMomentsEdit(item);
    } else if (action === 'repost') {
        if (confirm('确定要重发这条朋友圈吗？')) {
            momentsData = momentsData.filter(m => m.id !== item.id);
            const newMoment = { ...item, id: Date.now(), time: Date.now(), likes: [], comments: [] };
            momentsData.unshift(newMoment);
            await saveMoments(); renderMoments();
        }
    }
}

async function confirmMomentEdit() {
    const newValue = document.getElementById('momentEditTextInput').value.trim();
    if (currentMomentId) {
        const moment = momentsData.find(m => m.id === currentMomentId);
        if (moment) { moment.content = newValue; await saveMoments(); renderMoments(); }
    }
    document.getElementById('momentEditModal').classList.remove('active');
}

function hideMomentPopups() {
    const popup = document.getElementById('momentActionPopup');
    if (popup) popup.style.display = 'none';
    const contextMenu = document.getElementById('momentContextMenu');
    if (contextMenu) contextMenu.style.display = 'none';
    const inputBar = document.getElementById('momentCommentInputBar');
    if (inputBar) {
        inputBar.style.display = 'none';
        const input = document.getElementById('momentCommentInput');
        if (input) { input.value = ''; input.blur(); }
    }
    currentMomentId = null;
    currentReplyTo = null;
}

async function handleMomentLike(id, event) {
    event.stopPropagation();
    const moment = momentsData.find(m => m.id === id);
    if (moment) {
        const myName = wechatUserInfo.nickname || '我';
        const idx = moment.likes.indexOf(myName);
        if (idx > -1) { moment.likes.splice(idx, 1); } else { moment.likes.push(myName); }
        await saveMoments();
        const momentEl = document.querySelector(`.moment-item[data-moment-id="${id}"]`);
        if (momentEl) {
            const feedbackSection = momentEl.querySelector('.moment-feedback-section');
            let likesHtml = '';
            if (moment.likes && moment.likes.length > 0) {
                likesHtml = `<div class="moment-likes-box"><span class="heart-hollow">♡</span>${moment.likes.join(', ')}</div>`;
            }
            let dividerHtml = (moment.likes && moment.likes.length > 0 && moment.comments && moment.comments.length > 0) ? '<div class="moment-feedback-divider"></div>' : '';
            let commentsHtml = '';
            if (moment.comments && moment.comments.length > 0) {
                commentsHtml = `<div class="moment-comments-list">
                    ${moment.comments.map((c, cIdx) => {
                        let replyText = c.replyTo ? ` <span class="moment-comment-reply">回复</span> <span class="moment-comment-nickname">${c.replyTo}</span>` : '';
                        return `<div class="moment-comment-item" onclick="handleCommentClick(${moment.id}, ${cIdx}, event)">
                            <span class="moment-comment-nickname">${c.nickname}</span>${replyText}：${c.content}
                        </div>`;
                    }).join('')}
                </div>`;
            }
            if (!likesHtml && !commentsHtml) { feedbackSection.style.display = 'none'; } else {
                feedbackSection.style.display = 'flex';
                feedbackSection.innerHTML = `${likesHtml}${dividerHtml}${commentsHtml}`;
            }
        } else { renderMoments(); }
    }
    document.getElementById('momentActionPopup').style.display = 'none';
}

function showMomentCommentInput(id, event, replyTo = null) {
    event.stopPropagation();
    currentMomentId = id;
    currentReplyTo = replyTo;
    const inputBar = document.getElementById('momentCommentInputBar');
    inputBar.style.display = 'flex';
    const input = document.getElementById('momentCommentInput');
    input.value = '';
    input.placeholder = replyTo ? `回复 ${replyTo}` : '评论';
    input.focus();
    updateMomentCommentSendBtn();
    document.getElementById('momentActionPopup').style.display = 'none';
}

function updateMomentCommentSendBtn() {
    const val = document.getElementById('momentCommentInput').value.trim();
    const btn = document.getElementById('momentCommentSendBtn');
    if (val) {
        btn.classList.add('active');
        btn.style.backgroundColor = '#000';
    } else {
        btn.classList.remove('active');
        btn.style.backgroundColor = '#e1e1e1';
    }
}

async function sendMomentComment() {
    const content = document.getElementById('momentCommentInput').value.trim();
    if (!content || !currentMomentId) return;
    const moment = momentsData.find(m => m.id === currentMomentId);
    const id = currentMomentId;
    if (moment) {
        const myNickname = wechatUserInfo.nickname || '我';
        const newComment = { nickname: myNickname, content: content, time: Date.now() };
        if (currentReplyTo) newComment.replyTo = currentReplyTo;
        moment.comments.push(newComment);
        await saveMoments();
        if (!moment.isMine && moment.friendId) {
            const friend = chatList.find(f => f.id === moment.friendId);
            if (friend) { setTimeout(() => callAIForMoment(id, friend, 'reply_to_user', { userComment: content }), 1000 + Math.random() * 2000); }
        }
        if (currentReplyTo && currentReplyTo !== myNickname) {
            const friend = chatList.find(f => getFriendDisplayName(f) === currentReplyTo);
            if (friend) { setTimeout(() => callAIForMoment(id, friend, 'reply_to_user', { userComment: content }), 1000); }
            else {
                const contact = contacts.find(c => (c.remark || c.netName || c.name) === currentReplyTo);
                if (contact) {
                    const tempFriend = { id: 0, contactId: contact.id, name: contact.name };
                    setTimeout(() => callAIForMoment(id, tempFriend, 'reply_to_user', { userComment: content }), 1000);
                }
            }
        }
        const momentEl = document.querySelector(`.moment-item[data-moment-id="${id}"]`);
        if (momentEl) {
            const feedbackSection = momentEl.querySelector('.moment-feedback-section');
            let likesHtml = '';
            if (moment.likes && moment.likes.length > 0) {
                likesHtml = `<div class="moment-likes-box"><span class="heart-hollow">♡</span>${moment.likes.join(', ')}</div>`;
            }
            let dividerHtml = (moment.likes && moment.likes.length > 0 && moment.comments && moment.comments.length > 0) ? '<div class="moment-feedback-divider"></div>' : '';
            let commentsHtml = '';
            if (moment.comments && moment.comments.length > 0) {
                commentsHtml = `<div class="moment-comments-list">
                    ${moment.comments.map((c, cIdx) => {
                        let replyText = c.replyTo ? ` <span class="moment-comment-reply">回复</span> <span class="moment-comment-nickname">${c.replyTo}</span>` : '';
                        return `<div class="moment-comment-item" onclick="handleCommentClick(${moment.id}, ${cIdx}, event)">
                            <span class="moment-comment-nickname">${c.nickname}</span>${replyText}：${c.content}
                        </div>`;
                    }).join('')}
                </div>`;
            }
            feedbackSection.style.display = 'flex';
            feedbackSection.innerHTML = `${likesHtml}${dividerHtml}${commentsHtml}`;
        } else { renderMoments(); }
    }
    const inputBar = document.getElementById('momentCommentInputBar');
    inputBar.style.display = 'none';
    document.getElementById('momentCommentInput').value = '';
    document.getElementById('momentCommentInput').blur();
    currentReplyTo = null;
    updateMomentCommentSendBtn();
}

function changeMomentsBg() {
    currentImageId = 'momentsBg';
    const originalConfirmUrl = window.confirmUrl;
    const originalHandleFileSelect = window.handleFileSelect;
    const originalCloseModal = window.closeModal;
    window.confirmUrl = function() {
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            const url = urlInput.value.trim();
            if (url) {
                const bgImg = document.getElementById('momentsBg');
                if (bgImg) bgImg.src = url;
                const bgKey = currentMomentsFriendId ? `mimi_moments_bg_AI_${currentMomentsFriendId}` : 'mimi_moments_bg';
                localStorage.setItem(bgKey, url);
                closeModal();
            }
        }
    };
    window.handleFileSelect = function(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const src = e.target.result;
                const bgImg = document.getElementById('momentsBg');
                if (bgImg) bgImg.src = src;
                const bgKey = currentMomentsFriendId ? `mimi_moments_bg_AI_${currentMomentsFriendId}` : 'mimi_moments_bg';
                localStorage.setItem(bgKey, src);
                closeModal();
            };
            reader.readAsDataURL(file);
        }
    };
    window.closeModal = function() {
        originalCloseModal();
        window.confirmUrl = originalConfirmUrl;
        window.handleFileSelect = originalHandleFileSelect;
        window.closeModal = originalCloseModal;
    };
    document.getElementById('urlInputContainer').style.display = 'none';
    document.getElementById('imageModal').classList.add('active');
}

function enterMultiSelectMode(initialIndex) {
    isMultiSelectMode = true;
    selectedMsgIndexes.clear();
    if (typeof initialIndex === 'number') selectedMsgIndexes.add(initialIndex);
    const navLeft = document.getElementById('chatNavLeft');
    if (navLeft) {
        navLeft.innerHTML = '<span style="font-size: 16px; color: #000; font-weight: normal; margin-left: 4px;">取消</span>';
        navLeft.onclick = exitMultiSelectMode;
    }
    const navRight = document.getElementById('chatNavRight');
    if (navRight) navRight.style.visibility = 'hidden';
    document.getElementById('multiSelectToolbar').classList.add('active');
    const inputBarChildren = document.getElementById('chatInputBar').children;
    for (let child of inputBarChildren) {
        if (child.id !== 'multiSelectToolbar') child.style.display = 'none';
    }
    renderMessages();
}

function exitMultiSelectMode() {
    isMultiSelectMode = false;
    selectedMsgIndexes.clear();
    const navLeft = document.getElementById('chatNavLeft');
    if (navLeft) {
        navLeft.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;"><path d="M15 18l-6-6 6-6"/></svg>';
        navLeft.onclick = closeChat;
    }
    const navRight = document.getElementById('chatNavRight');
    if (navRight) navRight.style.visibility = 'visible';
    document.getElementById('multiSelectToolbar').classList.remove('active');
    const inputBarChildren = document.getElementById('chatInputBar').children;
    for (let child of inputBarChildren) {
        if (child.id !== 'multiSelectToolbar' && child.id !== 'quotePreview' && child.id !== 'chatSendBtn') {
            child.style.display = 'flex';
        }
    }
    if (quotedMessage) document.getElementById('quotePreview').style.display = 'block';
    renderMessages();
}

function toggleMsgSelection(index) {
    if (selectedMsgIndexes.has(index)) selectedMsgIndexes.delete(index);
    else selectedMsgIndexes.add(index);
    renderMessages();
}

function showForwardOptions() {
    if (selectedMsgIndexes.size === 0) { alert('请先选择消息'); return; }
    document.getElementById('forwardTypeModal').classList.add('active');
}

function closeForwardTypeModal() { document.getElementById('forwardTypeModal').classList.remove('active'); }

function handleForwardMode(mode) {
    currentForwardMode = mode === '逐条' ? 'multi-one-by-one' : 'multi-combine';
    closeForwardTypeModal();
    document.getElementById('forwardModal').classList.add('active');
    renderForwardContacts();
}

async function handleMultiFavorite() {
    if (selectedMsgIndexes.size === 0) { alert('请先选择消息'); return; }
    const history = chatHistories[currentChatFriendId];
    if (!history) return;
    const sortedIndexes = Array.from(selectedMsgIndexes).sort((a, b) => a - b);
    const partner = chatList.find(f => f.id === currentChatFriendId);
    const partnerName = getFriendDisplayName(partner);
    const myName = wechatUserInfo.nickname || '我';
    const selectedMsgs = sortedIndexes.map(idx => history[idx]).filter(m => m && !m.isDeletedLocal && m.type !== 'system_withdrawn');
    const selectedCount = selectedMsgs.length;
    if (selectedCount > 0) {
        const title = `${myName}和${partnerName}的聊天记录`;
        const fullHistory = selectedMsgs.map(m => {
            return {
                name: m.type === 'sent' ? myName : partnerName,
                avatar: m.type === 'sent' ? (wechatUserInfo.avatar || document.getElementById('accountAvatarImg').src || '') : (partner ? partner.avatar : ''),
                content: m.content,
                msgType: m.msgType || 'text',
                stickerName: m.stickerName || '',
                time: m.time,
                isMergedForward: m.isMergedForward || false,
                title: m.title || '',
                fullHistory: m.fullHistory || null
            };
        });
        const newFav = { id: Date.now(), content: '[聊天记录]', isMergedForward: true, title: title, fullHistory: fullHistory, date: new Date().toISOString().split('T')[0], isPinned: false };
        favoritesData.unshift(newFav);
        saveFavoritesToStorage();
        alert(`已将 ${selectedCount} 条消息合并收藏`);
    }
    exitMultiSelectMode();
}

async function handleMultiDelete() {
    if (selectedMsgIndexes.size === 0) { alert('请先选择消息'); return; }
    if (confirm(`确定删除选中的 ${selectedMsgIndexes.size} 条消息吗？`)) {
        const history = chatHistories[currentChatFriendId];
        if (history) {
            selectedMsgIndexes.forEach(idx => { if (history[idx]) history[idx].isDeletedLocal = true; });
            await saveChatHistories();
            exitMultiSelectMode();
        }
    }
}

function getFriendDisplayName(friend) {
    if (!friend) return '未知';
    if (friend.remark) return friend.remark;
    const contact = contacts.find(c => c.id === friend.contactId);
    if (contact && contact.netName) return contact.netName;
    return friend.name;
}

function openForwardModal() {
    if (!currentLongPressedMsg) return;
    currentForwardMode = 'single';
    const row = currentLongPressedMsg.closest('.msg-row');
    const idx = parseInt(row.getAttribute('data-msg-index'));
    const history = chatHistories[currentChatFriendId];
    if (history && !isNaN(idx)) { messageToForward = history[idx]; }
    else { messageToForward = currentLongPressedMsg.querySelector('div:not(.msg-translation):not([style*="font-size: 12px"])').textContent; }
    document.getElementById('forwardModal').classList.add('active');
    renderForwardContacts();
}

function closeForwardModal() {
    document.getElementById('forwardModal').classList.remove('active');
    messageToForward = null;
}

function renderForwardContacts(keyword = '') {
    const listContainer = document.getElementById('forwardContactsList');
    let filteredFriends = chatList;
    if (keyword) filteredFriends = chatList.filter(f => getFriendDisplayName(f).toLowerCase().includes(keyword.toLowerCase()));
    if (filteredFriends.length === 0) { listContainer.innerHTML = '<div class="empty-state">未找到联系人</div>'; return; }
    let html = '';
    filteredFriends.forEach(friend => {
        html += `<div class="wechat-contact-item" onclick="forwardToContact(${friend.id})">
            <img src="${friend.avatar || DEFAULT_AVATAR}" class="wechat-contact-avatar" alt="">
            <div class="wechat-contact-name">${getFriendDisplayName(friend)}</div>
        </div>`;
    });
    listContainer.innerHTML = html;
}

function searchForwardContacts() {
    const keyword = document.getElementById('forwardSearchInput').value.trim();
    renderForwardContacts(keyword);
}

async function forwardToContact(friendId) {
    const history = chatHistories[currentChatFriendId] || [];
    let messagesToSend = [];
    let isMerged = false;
    if (currentForwardMode === 'single') {
        if (messageToForward) {
            if (typeof messageToForward === 'object') {
                const msg = { ...messageToForward, type: 'sent' };
                delete msg.translation;
                messagesToSend.push(msg);
                if (msg.isMergedForward) isMerged = true;
            } else { messagesToSend.push({ type: 'sent', content: messageToForward }); }
        }
    } else {
        const sortedIndexes = Array.from(selectedMsgIndexes).sort((a, b) => a - b);
        const selectedMsgs = sortedIndexes.map(idx => history[idx]).filter(m => m && !m.isDeletedLocal && m.type !== 'system_withdrawn');
        if (currentForwardMode === 'multi-one-by-one') {
            messagesToSend = selectedMsgs.map(m => { const msg = { ...m, type: 'sent' }; delete msg.translation; return msg; });
            isMerged = selectedMsgs.some(m => m.isMergedForward);
        } else if (currentForwardMode === 'multi-combine') {
            isMerged = true;
            const partner = chatList.find(f => f.id === currentChatFriendId);
            const partnerName = getFriendDisplayName(partner);
            const myName = wechatUserInfo.nickname || '我';
            const title = `${myName}和${partnerName}的聊天记录`;
            const fullHistory = selectedMsgs.map(m => {
                return {
                    name: m.type === 'sent' ? myName : partnerName,
                    avatar: m.type === 'sent' ? (wechatUserInfo.avatar || document.getElementById('accountAvatarImg').src || '') : (partner ? partner.avatar : ''),
                    content: m.content,
                    msgType: m.msgType || 'text',
                    stickerName: m.stickerName || '',
                    time: m.time,
                    isMergedForward: m.isMergedForward || false,
                    title: m.title || '',
                    fullHistory: m.fullHistory || null
                };
            });
            messagesToSend = [{ type: 'sent', isMergedForward: true, title: title, fullHistory: fullHistory, content: '[聊天记录]' }];
        }
    }
    if (messagesToSend.length === 0) return;
    if (!chatHistories[friendId]) chatHistories[friendId] = [];
    messagesToSend.forEach(msg => { chatHistories[friendId].push({ ...msg, time: new Date().getTime() }); });
    const friend = chatList.find(f => f.id === friendId);
    if (friend) {
        const lastMsg = messagesToSend[messagesToSend.length - 1];
        if (isMerged) friend.message = '[聊天记录]';
        else if (lastMsg.msgType === 'sticker') friend.message = `[${lastMsg.stickerName || '表情'}]`;
        else friend.message = lastMsg.content;
        friend.time = formatTime(new Date());
    }
    await saveChatHistories();
    saveChatListToStorage();
    alert('已转发');
    closeForwardModal();
    if (isMultiSelectMode) exitMultiSelectMode();
    const activeTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item.active .wechat-nav-label');
    if (activeTab && activeTab.textContent === '消息') renderChatList();
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
    chatListEl.style.display = 'none'; contactsPage.style.display = 'none'; if (discoverPage) discoverPage.style.display = 'none'; mePage.style.display = 'none';
    searchBar.style.display = 'none'; tagBar.style.display = 'none';
    if (navBar) navBar.style.display = 'flex';
    if (bottomNav) bottomNav.style.backgroundColor = '#fff';
    if (tab === 'messages') {
        chatListEl.style.display = 'block'; searchBar.style.display = 'block'; tagBar.style.display = 'flex'; navTitle.textContent = 'Wechat';
        if (navBar) { navBar.style.display = 'flex'; navBar.style.backgroundColor = '#fff'; navBar.style.borderBottom = '1px solid #f5f5f5'; }
        renderChatList();
    } else if (tab === 'contacts') {
        contactsPage.style.display = 'block'; searchBar.style.display = 'block'; navTitle.textContent = '通讯录';
        if (navBar) { navBar.style.display = 'flex'; navBar.style.backgroundColor = '#fff'; navBar.style.borderBottom = '1px solid #f5f5f5'; }
        renderWechatContacts();
    } else if (tab === 'discover') {
        if (discoverPage) discoverPage.style.display = 'block'; navTitle.textContent = '发现';
        if (navBar) { navBar.style.display = 'flex'; navBar.style.backgroundColor = '#fff'; navBar.style.borderBottom = 'none'; }
    } else if (tab === 'me') {
        mePage.style.display = 'block'; if (navBar) navBar.style.display = 'none';
        if (bottomNav) bottomNav.style.backgroundColor = '#fff';
        renderWechatMePage();
    }
    saveUIState();
}

function renderWechatContacts(keyword = '') {
    const contactContainer = document.getElementById('wechatAddedContactsList');
    const groupContainer = document.getElementById('wechatAddedGroupsList');
    if (!contactContainer || !groupContainer) return;
    let filteredFriends = chatList;
    if (keyword) filteredFriends = chatList.filter(f => getFriendDisplayName(f).toLowerCase().includes(keyword.toLowerCase()));
    if (filteredFriends.length === 0) contactContainer.innerHTML = '<div class="empty-state">暂无好友</div>';
    else {
        let contactHtml = '';
        filteredFriends.forEach(friend => {
            contactHtml += `<div class="wechat-contact-item" onclick="openContactDetail('${friend.id}')"><img src="${friend.avatar || DEFAULT_AVATAR}" class="wechat-contact-avatar"><div class="wechat-contact-name">${getFriendDisplayName(friend)}</div></div>`;
        });
        contactContainer.innerHTML = contactHtml;
    }
    let filteredGroups = groupList;
    if (keyword) filteredGroups = groupList.filter(g => g.name.toLowerCase().includes(keyword.toLowerCase()));
    if (filteredGroups.length === 0) groupContainer.innerHTML = '<div class="empty-state">暂无群聊</div>';
    else {
        let groupHtml = '';
        filteredGroups.forEach(group => {
            groupHtml += `<div class="wechat-contact-item" onclick="openGroupChat('${group.id}')"><div class="wechat-contact-avatar" style="background: #e1e1e1; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">群</div><div class="wechat-contact-name">${group.name}</div></div>`;
        });
        groupContainer.innerHTML = groupHtml;
    }
}

async function saveGroupListToStorage() {
    try { await dbPut('settings', { key: 'wechat_group_list', value: groupList }); } catch (e) { safeLocalStorageSet('wechat_group_list', JSON.stringify(groupList)); }
}

async function loadGroupListFromStorage() {
    try {
        const data = await dbGet('settings', 'wechat_group_list');
        if (data) { groupList = data.value; } else {
            const saved = localStorage.getItem('wechat_group_list');
            if (saved) { groupList = JSON.parse(saved); await saveGroupListToStorage(); }
        }
    } catch (e) { const saved = localStorage.getItem('wechat_group_list'); if (saved) groupList = JSON.parse(saved); }
}

function createGroupChat() {
    const addMenu = document.getElementById('addMenu');
    const groupChatModal = document.getElementById('groupChatModal');
    if (addMenu) addMenu.classList.remove('active');
    if (groupChatModal) groupChatModal.classList.add('active');
    selectedGroupContacts.clear();
    const searchInput = document.getElementById('groupChatSearchInput');
    if (searchInput) searchInput.value = '';
    renderGroupChatContacts();
}

function closeGroupChatModal() { const modal = document.getElementById('groupChatModal'); if (modal) modal.classList.remove('active'); }

function renderGroupChatContacts(keyword = '') {
    const container = document.getElementById('groupChatContactsList');
    if (!container) return;
    let filtered = chatList;
    if (keyword) filtered = chatList.filter(f => getFriendDisplayName(f).toLowerCase().includes(keyword.toLowerCase()));
    if (filtered.length === 0) { container.innerHTML = '<div class="empty-state">暂无好友</div>'; return; }
    let html = '';
    filtered.forEach(friend => {
        const isSelected = Array.from(selectedGroupContacts).some(id => String(id) === String(friend.id));
        html += `<div class="wechat-contact-item" onclick="toggleGroupContact('${friend.id}')">
            <div class="contact-checkbox ${isSelected ? 'checked' : ''}" style="margin-right: 10px;"></div>
            <img src="${friend.avatar || DEFAULT_AVATAR}" class="wechat-contact-avatar">
            <div class="wechat-contact-name">${getFriendDisplayName(friend)}</div>
        </div>`;
    });
    container.innerHTML = html;
}

function searchGroupChatContacts() { const keyword = document.getElementById('groupChatSearchInput').value.trim(); renderGroupChatContacts(keyword); }

function toggleGroupContact(id) {
    let found = false;
    for (let existingId of selectedGroupContacts) { if (String(existingId) === String(id)) { selectedGroupContacts.delete(existingId); found = true; break; } }
    if (!found) selectedGroupContacts.add(id);
    const searchInput = document.getElementById('groupChatSearchInput');
    renderGroupChatContacts(searchInput ? searchInput.value.trim() : '');
}

async function confirmCreateGroupChat() {
    if (selectedGroupContacts.size === 0) { alert('请选择联系人'); return; }
    const meName = wechatUserInfo.nickname || '我';
    let names = [meName];
    let members = [];
    selectedGroupContacts.forEach(id => {
        const friend = chatList.find(f => String(f.id) === String(id));
        if (friend) { names.push(getFriendDisplayName(friend)); members.push(friend.id); }
    });
    const groupName = names.join('、');
    const newGroup = { id: Date.now(), name: groupName, members: members, time: formatTime(new Date()), message: '大家可以开始聊天了', isPinned: false };
    groupList.unshift(newGroup);
    await saveGroupListToStorage();
    closeGroupChatModal();
    openGroupChat(newGroup.id);
}

function openGroupChat(groupId) {
    const group = groupList.find(g => String(g.id) === String(groupId));
    if (!group) return;
    currentChatFriendId = null; currentGroupChatId = group.id;
    showContainer('groupChatPage');
    document.getElementById('groupChatTitle').textContent = `${group.name}(${(group.members ? group.members.length : 0) + 1})`;
    const navRight = document.querySelector('#groupChatPage .wechat-nav-right');
    if (navRight) { navRight.onclick = (e) => { e.stopPropagation(); openGroupInfo(currentGroupChatId); }; }
    const input = document.getElementById('groupChatInput');
    if (input) { input.value = ''; handleGroupChatInput(input); }
    const morePanel = document.getElementById('groupChatMorePanel');
    if (morePanel) morePanel.style.display = 'none';
    const stickerPanel = document.getElementById('groupStickerPickerPanel');
    if (stickerPanel) stickerPanel.classList.remove('active');
    const inputBar = document.getElementById('groupChatInputBar');
    if (inputBar) inputBar.style.paddingBottom = '30px';
    renderGroupMessages();
    updateTime();
    saveUIState();
}

function closeGroupChat() {
    document.getElementById('groupChatPage').style.display = 'none';
    document.getElementById('wechatContainer').style.display = 'block';
    currentGroupChatId = null;
    saveUIState();
}

function openGroupInfo(groupId) {
    const group = groupList.find(g => String(g.id) === String(groupId));
    if (!group) return;
    currentGroupChatId = group.id;
    document.getElementById('groupChatInfoPage').style.display = 'flex';
    document.getElementById('groupChatInfoPage').style.zIndex = '10600';
    document.getElementById('groupInfoMemberCount').textContent = `(${(group.members ? group.members.length : 0) + 1})`;
    document.getElementById('groupInfoNameText').textContent = group.name;
    const muteToggle = document.getElementById('groupInfoMuteToggle');
    const stickyToggle = document.getElementById('groupInfoStickyToggle');
    if (muteToggle) { muteToggle.checked = group.isMuted || false; muteToggle.onchange = (e) => { group.isMuted = e.target.checked; saveGroupListToStorage(); }; }
    if (stickyToggle) { stickyToggle.checked = group.isPinned || false; stickyToggle.onchange = (e) => { group.isPinned = e.target.checked; saveGroupListToStorage(); renderChatList(); }; }
    renderGroupInfoMembers(group);
    updateTime();
    saveUIState();
}

function closeGroupInfo() { document.getElementById('groupChatInfoPage').style.display = 'none'; saveUIState(); }

function renderGroupInfoMembers(group, showAll = false) {
    const grid = document.getElementById('groupInfoMemberGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const meName = wechatUserInfo.nickname || '我';
    const meAvatar = wechatUserInfo.avatar || DEFAULT_AVATAR;
    let allMembers = [ { id: 'me', name: meName, avatar: meAvatar } ];
    if (group.members) {
        group.members.forEach(mId => {
            const friend = chatList.find(f => f.id === mId);
            if (friend) { allMembers.push({ id: friend.id, name: getFriendDisplayName(friend), avatar: friend.avatar || DEFAULT_AVATAR }); }
        });
    }
    let displayList = showAll ? allMembers : allMembers.slice(0, 18);
    displayList.forEach(m => {
        const item = document.createElement('div');
        item.className = 'group-member-item';
        item.innerHTML = `<img src="${m.avatar}" class="member-avatar"><div class="member-name">${m.name}</div>`;
        grid.appendChild(item);
    });
    const addBtn = document.createElement('div');
    addBtn.className = 'group-member-item';
    addBtn.onclick = () => alert('邀请新成员功能开发中');
    addBtn.innerHTML = `<div class="member-avatar action">+</div><div class="member-name"></div>`;
    grid.appendChild(addBtn);
    const minusBtn = document.createElement('div');
    minusBtn.className = 'group-member-item';
    minusBtn.onclick = () => alert('移除群成员功能开发中');
    minusBtn.innerHTML = `<div class="member-avatar action">-</div><div class="member-name"></div>`;
    grid.appendChild(minusBtn);
    const moreBtn = document.getElementById('groupInfoMoreBtn');
    if (moreBtn) { moreBtn.style.display = (!showAll && allMembers.length > 18) ? 'flex' : 'none'; }
}

function toggleAllGroupMembers() { const group = groupList.find(g => g.id === currentGroupChatId); if (group) renderGroupInfoMembers(group, true); }

function updateGroupName() {
    const group = groupList.find(g => g.id === currentGroupChatId);
    if (!group) return;
    const newName = prompt('修改群聊名称', group.name);
    if (newName && newName.trim()) {
        group.name = newName.trim();
        document.getElementById('groupInfoNameText').textContent = group.name;
        const titleEl = document.getElementById('groupChatTitle');
        if (titleEl) { titleEl.textContent = `${group.name}(${(group.members ? group.members.length : 0) + 1})`; }
        saveGroupListToStorage(); renderChatList();
    }
}

function quitGroupChat() {
    if (confirm('确定要退出群聊吗？')) {
        groupList = groupList.filter(g => g.id !== currentGroupChatId);
        saveGroupListToStorage(); closeGroupInfo(); closeGroupChat(); renderChatList();
    }
}

function dissolveGroupChat() {
    if (confirm('确定要解散群聊吗？此操作将移除所有成员。')) {
        groupList = groupList.filter(g => g.id !== currentGroupChatId);
        saveGroupListToStorage(); closeGroupInfo(); closeGroupChat(); renderChatList();
    }
}

function toggleGroupStickerPicker(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const panel = document.getElementById('groupStickerPickerPanel');
    const morePanel = document.getElementById('groupChatMorePanel');
    const inputBar = document.getElementById('groupChatInputBar');
    const isVisible = panel.classList.contains('active');
    if (!isVisible) {
        if (morePanel) morePanel.style.display = 'none';
        if (inputBar) inputBar.style.paddingBottom = '30px';
        document.activeElement.blur();
        renderGroupStickerGrid();
        panel.classList.add('active');
    } else { panel.classList.remove('active'); }
    setTimeout(() => { const container = document.getElementById('groupChatMessages'); if (container) container.scrollTop = container.scrollHeight; }, 300);
}

function renderGroupStickerGrid() {
    const grid = document.getElementById('groupChatStickerGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const list = stickerList;
    if (list.length === 0) { grid.innerHTML = '<div class="sticker-empty-tip">表情库为空</div>'; return; }
    list.forEach(sticker => {
        const item = document.createElement('div');
        item.className = 'chat-sticker-item';
        item.onclick = () => sendGroupSticker(sticker);
        item.innerHTML = `<img src="${sticker.src}" alt="${sticker.name}" class="chat-sticker-img">`;
        grid.appendChild(item);
    });
}

function sendGroupSticker(sticker) {
    if (!currentGroupChatId) return;
    const historyKey = 'group_' + currentGroupChatId;
    if (!chatHistories[historyKey]) chatHistories[historyKey] = [];
    const newMessage = { type: 'sent', msgType: 'sticker', content: sticker.src, stickerName: sticker.name, time: new Date().getTime() };
    chatHistories[historyKey].push(newMessage);
    const group = groupList.find(g => g.id === currentGroupChatId);
    if (group) { group.message = `[${sticker.name}]`; group.time = formatTime(new Date()); }
    document.getElementById('groupStickerPickerPanel').classList.remove('active');
    renderGroupMessages(); saveChatHistories(); saveGroupListToStorage(); renderChatList();
}

function toggleGroupChatMorePanel(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const panel = document.getElementById('groupChatMorePanel');
    const stickerPanel = document.getElementById('groupStickerPickerPanel');
    const inputBar = document.getElementById('groupChatInputBar');
    const isVisible = panel.style.display === 'grid';
    if (!isVisible) {
        if (stickerPanel) stickerPanel.classList.remove('active');
        document.activeElement.blur();
        panel.style.display = 'grid';
        if (inputBar) inputBar.style.paddingBottom = '10px';
    } else { panel.style.display = 'none'; if (inputBar) inputBar.style.paddingBottom = '30px'; }
    setTimeout(() => { const container = document.getElementById('groupChatMessages'); if (container) container.scrollTop = container.scrollHeight; }, 300);
}

function handleGroupChatInput(textarea) {
    const sendBtn = document.getElementById('groupChatSendBtn');
    const addons = document.getElementById('groupChatAddons');
    const aiMicBtn = document.getElementById('groupAiMicBtn');
    textarea.style.height = 'auto';
    let scrollHeight = textarea.scrollHeight;
    textarea.style.height = scrollHeight + 'px';
    if (textarea.value.length > 0) {
        sendBtn.style.display = 'block'; if (addons) addons.style.display = 'none'; if (aiMicBtn) aiMicBtn.style.display = 'none';
    } else {
        sendBtn.style.display = 'none'; if (addons) addons.style.display = 'flex'; if (aiMicBtn) aiMicBtn.style.display = 'flex';
    }
}

function renderGroupMessages() {
    const container = document.getElementById('groupChatMessages');
    const history = chatHistories['group_' + currentGroupChatId] || [];
    const userAvatar = wechatUserInfo.avatar || DEFAULT_AVATAR;
    container.innerHTML = '';
    const group = groupList.find(g => g.id === currentGroupChatId);
    if (group) {
        const sysHint = document.createElement('div');
        sysHint.className = 'msg-system-hint';
        sysHint.textContent = '你邀请了' + (group.members ? group.members.length : 0) + '位朋友加入群聊';
        container.appendChild(sysHint);
    }
    history.forEach((msg, index) => {
        const row = document.createElement('div');
        row.className = `msg-row ${msg.type}`;
        const avatar = document.createElement('img');
        avatar.className = 'msg-avatar';
        let senderAvatar = userAvatar;
        let senderName = wechatUserInfo.nickname || '我';
        if (msg.type === 'received') {
            const friend = chatList.find(f => f.id === msg.senderId);
            senderAvatar = friend ? (friend.avatar || DEFAULT_AVATAR) : DEFAULT_AVATAR;
            senderName = friend ? getFriendDisplayName(friend) : '未知';
        }
        avatar.src = senderAvatar;
        const bubble = document.createElement('div');
        bubble.className = (msg.msgType === 'sticker') ? 'msg-bubble sticker-bubble' : 'msg-bubble';
        const contentWrapper = document.createElement('div');
        if (msg.type === 'received') {
            const nameLabel = document.createElement('div');
            nameLabel.style.cssText = 'font-size: 11px; color: #888; margin-bottom: 2px; margin-left: 2px;';
            nameLabel.textContent = senderName;
            contentWrapper.appendChild(nameLabel);
        }
        if (msg.msgType === 'sticker') {
            const img = document.createElement('img'); img.src = msg.content; img.className = 'msg-sticker-img'; contentWrapper.appendChild(img);
        } else { const textNode = document.createElement('div'); textNode.textContent = msg.content; contentWrapper.appendChild(textNode); }
        bubble.appendChild(contentWrapper);
        if (msg.type === 'sent') { row.appendChild(bubble); row.appendChild(avatar); } else { row.appendChild(avatar); row.appendChild(bubble); }
        container.appendChild(row);
    });
    container.scrollTop = container.scrollHeight;
}

async function sendGroupMessage() {
    const input = document.getElementById('groupChatInput');
    const content = input.value.trim();
    if (!content || !currentGroupChatId) return;
    const historyKey = 'group_' + currentGroupChatId;
    if (!chatHistories[historyKey]) chatHistories[historyKey] = [];
    const newMessage = { type: 'sent', content: content, time: new Date().getTime() };
    chatHistories[historyKey].push(newMessage);
    const group = groupList.find(g => g.id === currentGroupChatId);
    if (group) { group.message = content; group.time = formatTime(new Date()); }
    input.value = ''; renderGroupMessages(); await saveChatHistories(); await saveGroupListToStorage(); renderChatList(); handleGroupChatInput(input);
}

function openWechat() {
    wechatVisible = true;
    document.querySelector('.phone-container').style.display = 'none';
    document.getElementById('wechatContainer').style.display = 'flex';
    updateTime(); updateBattery();
    const messagesTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item');
    switchWechatTab('messages', messagesTab);
    saveUIState();
}

async function openContacts() {
    document.querySelector('.phone-container').style.display = 'none';
    document.getElementById('contactsContainer').style.display = 'flex';
    updateTime(); updateBattery(); await loadContactsFromStorage(); renderContactsList(); saveUIState();
}

function closeContacts() {
    document.getElementById('contactsContainer').style.display = 'none';
    document.querySelector('.phone-container').style.display = 'flex';
    saveUIState();
}

function toggleContactSelectMode() {
    contactSelectMode = !contactSelectMode; selectedContacts.clear();
    const selectBtn = document.getElementById('contactsSelectBtn');
    if (selectBtn) selectBtn.style.color = '#000';
    updateDeleteButton(); renderContactsList();
}

function updateDeleteButton() {
    const deleteBtn = document.getElementById('deleteBottomBtn');
    if (deleteBtn) {
        if (contactSelectMode) {
            deleteBtn.style.display = 'block'; deleteBtn.disabled = selectedContacts.size === 0;
            deleteBtn.textContent = selectedContacts.size > 0 ? `删除选中的 ${selectedContacts.size} 个联系人` : '删除选中的联系人';
        } else { deleteBtn.style.display = 'none'; }
    }
}

function handleBottomDelete() { if (selectedContacts.size === 0) { alert('请先选择要删除的联系人'); return; } showDeleteContactModal(); }

function showAddContactModal() { openAddContactPage(); }

function openAddContactPage() {
    editingContactId = null;
    document.getElementById('contactsContainer').style.display = 'none';
    document.getElementById('addContactContainer').style.display = 'flex';
    document.querySelector('.add-contact-nav-title').textContent = '新建联系人';
    document.getElementById('deleteContactBtnContainer').style.display = 'none';
    updateTime(); updateBattery(); clearAddContactForm(); saveUIState();
}

function openContactDetail(friendId) {
    const friend = chatList.find(f => String(f.id) === String(friendId));
    if (!friend) return;
    const contact = contacts.find(c => String(c.id) === String(friend.contactId));
    if (!contact) return;
    currentDetailFriendId = friend.id;
    document.getElementById('detailAvatar').src = contact.avatar || DEFAULT_AVATAR;
    const remarkName = friend.remark || contact.name || contact.netName || '无名氏';
    document.getElementById('detailRemark').textContent = remarkName;
    const nicknameRow = document.getElementById('detailNicknameRow');
    if (friend.remark) { nicknameRow.style.display = 'block'; document.getElementById('detailNickname').textContent = contact.netName || '未设置'; }
    else { nicknameRow.style.display = 'none'; }
    document.getElementById('detailWechatId').textContent = contact.wechat || '未设置';
    document.getElementById('detailRegion').textContent = contact.region || '未设置';
    document.getElementById('detailGroup').textContent = contact.category || '未设置';
    const videoRow = document.getElementById('detailVideoChannelRow');
    if (contact.videoChannel) { videoRow.style.display = 'flex'; document.getElementById('detailVideoChannelName').textContent = contact.videoChannel; }
    else { videoRow.style.display = 'none'; }
    showContainer('contactDetailPage');
    document.body.classList.add('contact-detail-active');
    setTimeout(() => {
        const detailPage = document.getElementById('contactDetailPage');
        const content = detailPage.querySelector('.contact-detail-content');
        if (content) { content.style.overflowY = (content.scrollHeight <= content.clientHeight) ? 'hidden' : 'auto'; }
    }, 50);
    saveUIState();
}

function closeContactDetail() {
    document.getElementById('contactDetailPage').style.display = 'none';
    document.body.classList.remove('contact-detail-active');
    document.getElementById('wechatContainer').style.display = 'block';
    saveUIState();
}

function goToChatFromDetail() { if (currentDetailFriendId) { const id = currentDetailFriendId; closeContactDetail(); openChat(id); } }

function openContactDetailMenu() {
    if (currentDetailFriendId) {
        const friend = chatList.find(f => f.id === currentDetailFriendId);
        if (friend) { isOpenedFromContactDetail = true; closeContactDetail(); openChat(friend.id); openChatInfo(); }
    }
}

function openEditContactPage(id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    editingContactId = id;
    document.getElementById('contactsContainer').style.display = 'none';
    document.getElementById('addContactContainer').style.display = 'flex';
    document.querySelector('.add-contact-nav-title').textContent = '编辑联系人';
    document.getElementById('deleteContactBtnContainer').style.display = 'block';
    updateTime(); updateBattery();
    document.getElementById('newContactAvatar').src = contact.avatar || '';
    document.getElementById('newContactName').value = contact.name || '';
    document.getElementById('newContactNickname').value = contact.nickname || '';
    document.getElementById('newContactNetName').value = contact.netName || '';
    document.getElementById('newContactWechat').value = contact.wechat || '';
    document.getElementById('newContactPhone').value = contact.phoneNumber || '';
    document.getElementById('newContactRegion').value = contact.region || '';
    document.getElementById('newContactSignature').value = contact.signature || '';
    document.getElementById('newContactCategory').value = contact.category || '朋友';
    document.getElementById('newContactDesign').value = contact.design || '';
    saveUIState();
}

function syncContactEdit() {
    if (!editingContactId) return;
    const contact = contacts.find(c => c.id === editingContactId);
    if (!contact) return;
    const name = document.getElementById('newContactName').value.trim();
    const nickname = document.getElementById('newContactNickname').value.trim();
    const netName = document.getElementById('newContactNetName').value.trim();
    const wechat = document.getElementById('newContactWechat').value.trim();
    const phoneNumber = document.getElementById('newContactPhone').value.trim();
    const region = document.getElementById('newContactRegion').value.trim();
    const signature = document.getElementById('newContactSignature').value.trim();
    const category = document.getElementById('newContactCategory').value;
    const design = document.getElementById('newContactDesign').value.trim();
    if (name) contact.name = name;
    contact.nickname = nickname; contact.netName = netName; contact.wechat = wechat;
    contact.phoneNumber = phoneNumber; contact.region = region; contact.signature = signature;
    contact.phone = wechat || nickname || netName || '未设置';
    if (category !== '__custom__') contact.category = category;
    contact.design = design;
    const friend = chatList.find(f => f.contactId === editingContactId);
    if (friend) { friend.name = name || friend.name; if (currentChatFriendId === friend.id) { document.getElementById('chatPartnerName').textContent = getFriendDisplayName(friend); } }
}

function closeAddContactPage() { document.getElementById('addContactContainer').style.display = 'none'; document.getElementById('contactsContainer').style.display = 'block'; saveUIState(); }

function clearAddContactForm() {
    document.getElementById('newContactAvatar').src = '';
    document.getElementById('newContactName').value = '';
    document.getElementById('newContactNickname').value = '';
    document.getElementById('newContactNetName').value = '';
    document.getElementById('newContactWechat').value = '';
    document.getElementById('newContactPhone').value = '';
    document.getElementById('newContactRegion').value = '';
    document.getElementById('newContactCategory').value = '朋友';
    document.getElementById('newContactDesign').value = '';
}

function uploadContactAvatar() { document.getElementById('avatarUploadModal').classList.add('active'); }
function selectAvatarFromAlbum() { document.getElementById('avatarFileInput').click(); }

function handleAvatarFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) { document.getElementById('newContactAvatar').src = e.target.result; closeAvatarUploadModal(); };
        reader.readAsDataURL(file);
    }
}

function showAvatarUrlInput() { document.getElementById('avatarUrlInputContainer').style.display = 'block'; document.getElementById('avatarUrlInput').focus(); }
function confirmAvatarUrl() { const url = document.getElementById('avatarUrlInput').value.trim(); if (url) { document.getElementById('newContactAvatar').src = url; closeAvatarUploadModal(); } }
function closeAvatarUploadModal() { document.getElementById('avatarUploadModal').classList.remove('active'); document.getElementById('avatarUrlInputContainer').style.display = 'none'; document.getElementById('avatarUrlInput').value = ''; }

function saveNewContact(event) {
    if (event) event.stopPropagation();
    const name = document.getElementById('newContactName').value.trim();
    const nickname = document.getElementById('newContactNickname').value.trim();
    const netName = document.getElementById('newContactNetName').value.trim();
    const wechat = document.getElementById('newContactWechat').value.trim();
    const phoneNumber = document.getElementById('newContactPhone').value.trim();
    const region = document.getElementById('newContactRegion').value.trim();
    const signature = document.getElementById('newContactSignature').value.trim();
    const category = document.getElementById('newContactCategory').value;
    const design = document.getElementById('newContactDesign').value.trim();
    const avatar = document.getElementById('newContactAvatar').src;
    if (!name) { alert('请输入真名'); return; }
    const saveBtn = document.querySelector('.add-contact-nav-right');
    if (saveBtn) saveBtn.style.opacity = '0.5';
    setTimeout(() => {
        if (editingContactId) {
            const contact = contacts.find(c => c.id === editingContactId);
            if (contact) {
                contact.name = name; contact.phone = wechat || nickname || netName || '未设置'; contact.avatar = avatar || '';
                contact.nickname = nickname; contact.netName = netName; contact.wechat = wechat;
                contact.phoneNumber = phoneNumber; contact.region = region; contact.signature = signature;
                contact.category = category; contact.design = design;
            }
        } else {
            const newContact = {
                id: Date.now(), name: name, phone: wechat || nickname || netName || '未设置', avatar: avatar || '',
                nickname: nickname, netName: netName, wechat: wechat, phoneNumber: phoneNumber, region: region,
                signature: signature, category: category, design: design
            };
            contacts.push(newContact);
        }
        if (saveContactsToStorage(false)) { alert('保存成功'); closeAddContactPage(); renderContactsList(); }
        if (saveBtn) saveBtn.style.opacity = '1';
    }, 50);
}

function deleteSingleContact() {
    if (!editingContactId) return;
    if (confirm('确定要删除这个联系人吗?')) { contacts = contacts.filter(c => c.id !== editingContactId); saveContactsToStorage(); closeAddContactPage(); renderContactsList(); }
}

function showEditContactModal(id) {
    const contact = contacts.find(c => c.id === id); if (!contact) return;
    editingContactId = id;
    document.getElementById('contactModalTitle').textContent = '编辑联系人';
    document.getElementById('contactNameInput').value = contact.name;
    document.getElementById('contactPhoneInput').value = contact.phone;
    document.getElementById('contactAvatarInput').value = contact.avatar || '';
    document.getElementById('contactModal').classList.add('active');
}

function saveContact() {
    const name = document.getElementById('contactNameInput').value.trim();
    const phone = document.getElementById('contactPhoneInput').value.trim();
    const avatar = document.getElementById('contactAvatarInput').value.trim();
    if (!name) { alert('请输入姓名'); return; }
    if (!phone) { alert('请输入电话号码'); return; }
    if (editingContactId) {
        const contact = contacts.find(c => c.id === editingContactId);
        if (contact) { contact.name = name; contact.phone = phone; contact.avatar = avatar; }
    } else {
        const newContact = { id: Date.now(), name: name, phone: phone, avatar: avatar };
        contacts.push(newContact);
    }
    if (saveContactsToStorage(false)) { alert('保存成功'); renderContactsList(); closeContactModal(); }
}

function closeContactModal() { document.getElementById('contactModal').classList.remove('active'); }

function toggleContactSelection(id, event) {
    if (event) event.stopPropagation();
    if (selectedContacts.has(id)) { selectedContacts.delete(id); } else { selectedContacts.add(id); }
    updateDeleteButton(); renderContactsList();
}

function handleContactClick(id) { if (contactSelectMode) { toggleContactSelection(id); } else { openEditContactPage(id); } }

function showDeleteContactModal() {
    if (selectedContacts.size === 0) { alert('请先选择要删除的联系人'); return; }
    document.getElementById('deleteContactText').textContent = `确定要删除选中的 ${selectedContacts.size} 个联系人吗？`;
    document.getElementById('deleteContactModal').classList.add('active');
}

function closeDeleteContactModal() { document.getElementById('deleteContactModal').classList.remove('active'); if (!contactSelectMode) { selectedContacts.clear(); } }

function confirmDeleteContact() {
    contacts = contacts.filter(c => !selectedContacts.has(c.id));
    selectedContacts.clear(); saveContactsToStorage(); updateDeleteButton(); renderContactsList(); closeDeleteContactModal();
}

function loadRealNameInfo() { const saved = localStorage.getItem('mimi_real_name_info'); if (saved) { realNameInfo = { ...realNameInfo, ...JSON.parse(saved) }; } }
function saveRealNameInfo() { safeLocalStorageSet('mimi_real_name_info', JSON.stringify(realNameInfo)); }

function loadWechatUserInfo() { const saved = localStorage.getItem('wechat_user_info'); if (saved) { const data = JSON.parse(saved); wechatUserInfo = { ...wechatUserInfo, ...data }; } }
function saveWechatUserInfo() { safeLocalStorageSet('wechat_user_info', JSON.stringify(wechatUserInfo)); }

function renderWechatMePage() {
    document.getElementById('wechatMeNickname').textContent = wechatUserInfo.nickname;
    document.getElementById('wechatMeID').textContent = '微信号：' + wechatUserInfo.wechatId;
    document.getElementById('wechatMeAvatar').src = wechatUserInfo.avatar;
}

function openPersonalInfo(source = 'me') {
    personalInfoSource = source;
    showContainer('personalInfoContainer');
    document.body.classList.add('personal-info-active');
    const avatarEl = document.getElementById('editWechatAvatar'); if (avatarEl) avatarEl.src = wechatUserInfo.avatar || DEFAULT_AVATAR;
    const nicknameEl = document.getElementById('editWechatNickname'); if (nicknameEl) nicknameEl.textContent = wechatUserInfo.nickname || '未设置';
    const wechatIdEl = document.getElementById('editWechatWechatId'); if (wechatIdEl) wechatIdEl.textContent = wechatUserInfo.wechatId || '未设置';
    const phoneEl = document.getElementById('editWechatPhone'); if (phoneEl) phoneEl.textContent = wechatUserInfo.phone || '未设置';
    const regionEl = document.getElementById('editWechatRegion'); if (regionEl) regionEl.textContent = wechatUserInfo.region || '未设置';
    const patPatEl = document.getElementById('editWechatPatPat'); if (patPatEl) patPatEl.textContent = wechatUserInfo.patPat || '未设置';
    const sigEl = document.getElementById('editWechatSignature'); if (sigEl) sigEl.textContent = wechatUserInfo.signature || '未设置';
    updateTime(); saveUIState();
}

function closePersonalInfo() {
    if (personalInfoSource === 'settings') { openWechatSettings(); } else {
        showContainer('wechatContainer');
        const meTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item:last-child');
        if (meTab) switchWechatTab('me', meTab);
    }
    document.body.classList.remove('personal-info-active');
    saveUIState();
}

function openServicePage() { document.getElementById('servicePageContainer').style.display = 'flex'; document.body.classList.add('service-page-active'); updateTime(); saveUIState(); }
function closeServicePage() { document.getElementById('servicePageContainer').style.display = 'none'; document.body.classList.remove('service-page-active'); saveUIState(); }

function openWechatStorage() {
    showContainer('wechatStorageContainer');
    document.getElementById('storageScanning').style.display = 'flex';
    document.getElementById('storageDetail').style.display = 'none';
    setTimeout(() => { calculateStorage(); }, 1500);
    updateTime(); saveUIState();
}

function closeWechatStorage() { document.getElementById('wechatStorageContainer').style.display = 'none'; openWechatSettings(); saveUIState(); }

async function calculateStorage() {
    let appFileSize = 268815;
    try { const response = await fetch(window.location.href); const blob = await response.blob(); appFileSize = blob.size; } catch (e) { console.warn("无法动态获取文件大小", e); }
    let lsBytes = 0; for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); const val = localStorage.getItem(key); lsBytes += (key.length + val.length) * 2; }
    let idbBytes = 0; const stores = ['wallpapers', 'icons', 'fonts', 'themes', 'api_configs', 'settings']; const idbData = {};
    for (const store of stores) { const data = await dbGetAll(store); idbData[store] = data; idbBytes += JSON.stringify(data).length * 2; }
    let chatBytes = 0; ['wechat_chat_list', 'wechat_group_list', 'wechat_chat_histories', 'contacts'].forEach(key => { const val = localStorage.getItem(key); if (val) chatBytes += (key.length + val.length) * 2; });
    let resourceBytes = 0; ['wallpapers', 'icons', 'fonts', 'themes'].forEach(store => { resourceBytes += JSON.stringify(idbData[store] || []).length * 2; });
    const otherBytes = Math.max(0, lsBytes + idbBytes - chatBytes - resourceBytes);
    const toMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);
    const appMB = parseFloat(toMB(appFileSize)); const chatMB = parseFloat(toMB(chatBytes)); const resMB = parseFloat(toMB(resourceBytes)); const othersMB = parseFloat(toMB(otherBytes));
    const totalMB = (parseFloat(appMB) + parseFloat(chatMB) + parseFloat(resMB) + parseFloat(othersMB)).toFixed(2);
    const getPct = (mb) => (totalMB > 0 ? (mb / totalMB * 100).toFixed(1) : 0);
    const chatPct = getPct(chatMB); const resPct = getPct(resMB); const appPct = getPct(appMB);
    const otherPct = (100 - parseFloat(chatPct) - parseFloat(resPct) - parseFloat(appPct)).toFixed(1);
    document.getElementById('totalStorageSize').textContent = totalMB + ' MB';
    document.getElementById('size-chat').textContent = `${chatMB} MB (${chatPct}%)`;
    document.getElementById('size-resources').textContent = `${resMB} MB (${resPct}%)`;
    document.getElementById('size-app').textContent = `${appMB} MB (${appPct}%)`;
    document.getElementById('size-others').textContent = `${othersMB} MB (${otherPct}%)`;
    const storageBar = document.getElementById('storageBar');
    storageBar.innerHTML = `<div class="storage-bar-item" style="width: ${chatPct}%; background: #07c160;"></div>
        <div class="storage-bar-item" style="width: ${resPct}%; background: #ff9800;"></div>
        <div class="storage-bar-item" style="width: ${appPct}%; background: #2196f3;"></div>
        <div class="storage-bar-item" style="width: ${otherPct}%; background: #9e9e9e;"></div>`;
    document.getElementById('storageScanning').style.display = 'none';
    document.getElementById('storageDetail').style.display = 'block';
}

function clearWechatCache() {
    if (confirm('确定要清除缓存吗？\n清除缓存将重置 UI 状态，但不会删除聊天记录和资源文件。')) {
        sessionStorage.removeItem('mimi_ui_state'); alert('缓存已清理，请重新计算存储空间'); calculateStorage();
    }
}

async function deleteWechatData() {
    if (confirm('警告：清除数据将彻底清除网页内微信 App 的所有内容！确定要执行吗？')) {
        localStorage.setItem('wechat_app_uninstalled', 'true');
        const wechatApp = document.getElementById('app1'); if (wechatApp && wechatApp.parentElement) { wechatApp.parentElement.style.display = 'none'; }
        localStorage.removeItem('wechat_user_info'); localStorage.removeItem('wechat_chat_list'); localStorage.removeItem('wechat_group_list');
        localStorage.removeItem('wechat_chat_histories'); localStorage.removeItem('contacts'); localStorage.removeItem('customCategories');
        contacts = []; chatList = []; groupList = []; chatHistories = {};
        wechatUserInfo = { avatar: '', nickname: '未设置网名', wechatId: '未设置', phone: '未设置', region: '未设置', patPat: '未设置', signature: '未设置' };
        alert('所有数据已删除，微信App已彻底卸载并退出'); closeWechatStorage(); closeWechatSettings(); goBack(); renderChatList(); renderWechatMePage();
    }
}

function openWechatSettings() { showContainer('wechatSettingsContainer'); updateTime(); saveUIState(); }
function closeWechatSettings() { showContainer('wechatContainer'); const meTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item:last-child'); if (meTab) switchWechatTab('me', meTab); saveUIState(); }
function openWechatDisplaySettings() { showContainer('wechatDisplaySettingsContainer'); updateTime(); saveUIState(); }
function closeWechatDisplaySettings() { openWechatSettings(); saveUIState(); }

function openWechatAccountSwitch() {
    showContainer('wechatAccountSwitchContainer');
    const container = document.getElementById('wechatAccountSwitchContainer'); if (!container) return;
    container.style.display = 'flex';
    const avatarImg = document.getElementById('switchCurrentAvatar'); const nicknameEl = document.getElementById('switchCurrentNickname'); const idEl = document.getElementById('switchCurrentID');
    if (avatarImg) avatarImg.src = wechatUserInfo.avatar || DEFAULT_AVATAR;
    if (nicknameEl) nicknameEl.textContent = wechatUserInfo.nickname || '未设置网名';
    if (idEl) idEl.textContent = '微信号：' + (wechatUserInfo.wechatId || '未设置');
    updateTime(); saveUIState();
}

function closeWechatAccountSwitch() { openWechatSettings(); saveUIState(); }

function searchWechatSettings() {
    const keyword = document.getElementById('wechatSettingsSearchInput').value.trim().toLowerCase();
    const items = document.querySelectorAll('.setting-item');
    items.forEach(item => {
        const text = item.getAttribute('data-search') || item.textContent;
        item.style.display = text.toLowerCase().includes(keyword) ? 'flex' : 'none';
    });
    const groups = document.querySelectorAll('#wechatSettingsContainer .me-rounded-box');
    groups.forEach(group => {
        const visibleItems = group.querySelectorAll('.setting-item[style*="display: flex"]');
        const hasVisibleItems = visibleItems.length > 0 || keyword === '';
        group.style.display = hasVisibleItems ? 'block' : 'none';
        let prev = group.previousElementSibling; if (prev && prev.classList.contains('me-divider')) { prev.style.display = hasVisibleItems ? 'block' : 'none'; }
    });
}

function changeWechatAvatar() {
    currentImageId = 'editWechatAvatar';
    const originalConfirmUrl = window.confirmUrl;
    window.confirmUrl = function() {
        const url = document.getElementById('urlInput').value.trim();
        if (url) { wechatUserInfo.avatar = url; document.getElementById('editWechatAvatar').src = url; saveWechatUserInfo(); closeModal(); }
        window.confirmUrl = originalConfirmUrl;
    };
    const originalHandleFileSelect = window.handleFileSelect;
    window.handleFileSelect = function(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) { wechatUserInfo.avatar = e.target.result; document.getElementById('editWechatAvatar').src = e.target.result; saveWechatUserInfo(); closeModal(); };
            reader.readAsDataURL(file);
        }
        window.handleFileSelect = originalHandleFileSelect;
    };
    document.getElementById('urlInputContainer').style.display = 'none';
    document.getElementById('imageModal').classList.add('active');
}

function editWechatInfo(field, label) {
    const originalConfirmText = window.confirmText; const input = document.getElementById('textInput');
    document.querySelector('#textModal .modal-title').textContent = '修改' + label;
    input.value = wechatUserInfo[field] === '未设置' ? '' : wechatUserInfo[field];
    document.getElementById('textModal').classList.add('active');
    window.confirmText = function() {
        const newValue = input.value.trim();
        if (newValue) {
            wechatUserInfo[field] = newValue;
            const displayId = 'editWechat' + field.charAt(0).toUpperCase() + field.slice(1);
            const displayEl = document.getElementById(displayId); if (displayEl) displayEl.textContent = newValue;
            renderWechatMePage(); saveWechatUserInfo();
        }
        closeModal(); window.confirmText = originalConfirmText; document.querySelector('#textModal .modal-title').textContent = '编辑文字';
    };
}

function editAccountInfo(field, label) {
    const originalConfirmText = window.confirmText; const input = document.getElementById('textInput');
    document.querySelector('#textModal .modal-title').textContent = '修改' + label;
    let currentValue = wechatUserInfo[field] || (field === 'country' ? '中国' : '未设置');
    input.value = currentValue === '未设置' ? '' : currentValue;
    document.getElementById('textModal').classList.add('active');
    window.confirmText = function() {
        const newValue = input.value.trim();
        if (newValue) {
            wechatUserInfo[field] = newValue; document.querySelectorAll('#info-' + field).forEach(el => { el.textContent = newValue; }); saveWechatUserInfo(); }
        closeModal(); window.confirmText = originalConfirmText; document.querySelector('#textModal .modal-title').textContent = '编辑文字';
    };
}
window.editWechatAccountInfo = editAccountInfo;

function searchWechat() {
    const keyword = document.getElementById('wechatSearchInput').value.trim().toLowerCase();
    const activeTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item.active .wechat-nav-label').textContent;
    if (activeTab === '消息') { renderChatList(keyword); } else if (activeTab === '通讯录') { renderWechatContacts(keyword); }
}

function searchContactsList() { const keyword = document.getElementById('contactsSearchInput').value.trim().toLowerCase(); renderContactsList(keyword); }

function renderContactsList(searchKeyword = '') {
    const listContainer = document.getElementById('contactsListContainer');
    let filteredContacts = contacts;
    if (searchKeyword) { filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchKeyword) || c.phone.includes(searchKeyword)); }
    if (filteredContacts.length === 0) { listContainer.innerHTML = '<div class="empty-state">暂无联系人</div>'; return; }
    let html = '';
    filteredContacts.forEach(contact => {
        const isSelected = selectedContacts.has(contact.id);
        html += `<div class="contact-item ${contactSelectMode ? 'selecting' : ''}" data-id="${contact.id}" onclick="handleContactClick(${contact.id})">`;
        if (contactSelectMode) { html += `<div class="contact-checkbox ${isSelected ? 'checked' : ''}" onclick="toggleContactSelection(${contact.id}, event)"></div>`; }
        html += `<img src="${contact.avatar || DEFAULT_AVATAR}" class="contact-avatar" alt="头像">
            <div class="contact-info"><div class="contact-name">${contact.name}</div><div class="contact-phone">${contact.phone}</div></div>`;
        if (!contactSelectMode) { html += `<svg class="contact-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`; }
        html += '</div>';
    });
    listContainer.innerHTML = html;
}

async function saveContactsToStorage(silent = true) {
    try { await dbPut('settings', { key: 'contacts', value: contacts }); return true; }
    catch (e) { return safeLocalStorageSet('contacts', JSON.stringify(contacts), silent); }
}

async function loadContactsFromStorage() {
    try {
        const data = await dbGet('settings', 'contacts');
        if (data) { contacts = data.value; } else {
            const saved = localStorage.getItem('contacts');
            if (saved) { contacts = JSON.parse(saved); await saveContactsToStorage(); }
        }
    } catch (e) { const saved = localStorage.getItem('contacts'); if (saved) contacts = JSON.parse(saved); }
}

function goBack() { wechatVisible = false; document.getElementById('wechatContainer').style.display = 'none'; document.querySelector('.phone-container').style.display = 'flex'; saveUIState(); }
function toggleAddMenu(event) { event.stopPropagation(); const menu = document.getElementById('addMenu'); menu.classList.toggle('active'); }

async function showAddFriendModal() {
    document.getElementById('addMenu').classList.remove('active'); await loadContactsFromStorage();
    if (contacts.length === 0) { alert('请先去联系人页面添加联系人'); return; }
    document.getElementById('addFriendModal').classList.add('active'); renderFriendContactsList();
}

function renderFriendContactsList(searchKeyword = '') {
    const listContainer = document.getElementById('friendContactsList'); if (!listContainer) return;
    const addedContactIds = new Set(chatList.filter(f => f.contactId !== undefined).map(f => String(f.contactId)));
    let filteredContacts = contacts.filter(c => !addedContactIds.has(String(c.id)));
    if (searchKeyword) { filteredContacts = filteredContacts.filter(c => c.name.toLowerCase().includes(searchKeyword) || (c.phone && c.phone.includes(searchKeyword))); }
    if (filteredContacts.length === 0) { listContainer.innerHTML = '<div class="empty-state" style="padding: 20px;">没有找到联系人</div>'; return; }
    let html = '';
    filteredContacts.forEach(contact => {
        const isSelected = selectedFriendContactId === contact.id;
        html += `<div class="contact-item" style="cursor: pointer; background: ${isSelected ? '#F0F0F0' : '#fff'};" onclick="selectFriendContact(${contact.id})">
            <img src="${contact.avatar || DEFAULT_AVATAR}" class="contact-avatar" alt="头像">
            <div class="contact-info"><div class="contact-name">${contact.name}</div><div class="contact-phone">${contact.phone || '未设置'}</div></div>`;
        if (isSelected) { html += `<svg viewBox="0 0 24 24" fill="none" stroke="#07C160" stroke-width="2" style="width: 24px; height: 24px;"><polyline points="20 6 9 17 4 12"/></svg>`; }
        html += '</div>';
    });
    listContainer.innerHTML = html;
}

function selectFriendContact(contactId) { selectedFriendContactId = contactId; renderFriendContactsList(document.getElementById('friendSearchInput').value.trim().toLowerCase()); }
function searchFriendContacts() { const keyword = document.getElementById('friendSearchInput').value.trim().toLowerCase(); renderFriendContactsList(keyword); }

function addFriendFromContact() {
    if (!selectedFriendContactId) { alert('请选择一个联系人'); return; }
    const contact = contacts.find(c => c.id === selectedFriendContactId); if (!contact) { alert('联系人不存在'); return; }
    if (chatList.some(f => f.contactId === contact.id)) { alert('该联系人已经是你的好友了'); return; }
    const friend = { id: Date.now(), contactId: contact.id, name: contact.name, remark: contact.netName || '', avatar: contact.avatar || '', message: '我通过了你的朋友验证请求，现在我们可以开始聊天了', time: formatTime(new Date()), isPinned: false };
    chatList.push(friend); saveChatListToStorage();
    const activeTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item.active .wechat-nav-label').textContent;
    if (activeTab === '消息') { renderChatList(); } else if (activeTab === '通讯录') { renderWechatContacts(); }
    closeWechatModal();
}

function closeWechatModal() { document.getElementById('addFriendModal').classList.remove('active'); document.getElementById('friendSearchInput').value = ''; selectedFriendContactId = null; }

function formatTime(date) {
    const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (messageDate.getTime() === today.getTime()) { return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; }
    else { return `${date.getMonth() + 1}月${date.getDate()}日`; }
}

async function saveChatListToStorage() {
    try { await dbPut('settings', { key: 'wechat_chat_list', value: chatList }); } catch (e) { safeLocalStorageSet('wechat_chat_list', JSON.stringify(chatList)); }
}

async function loadChatListFromStorage() {
    try {
        const data = await dbGet('settings', 'wechat_chat_list');
        if (data) { chatList = data.value; } else {
            const saved = localStorage.getItem('wechat_chat_list');
            if (saved) { chatList = JSON.parse(saved); await saveChatListToStorage(); }
        }
    } catch (e) { const saved = localStorage.getItem('wechat_chat_list'); if (saved) chatList = JSON.parse(saved); }
}

function renderChatList(searchKeyword = '') {
    const container = document.getElementById('chatList');
    let combinedList = [...chatList, ...groupList]; let filteredList = combinedList;
    if (currentSelectedCategory !== '默认') {
        const category = topCategories.find(c => c.name === currentSelectedCategory);
        if (category) { filteredList = chatList.filter(chat => category.contactIds.includes(chat.contactId)); }
    }
    if (searchKeyword) {
        filteredList = filteredList.filter(item => {
            const isGroup = item.members !== undefined; const name = isGroup ? item.name : getFriendDisplayName(item);
            return name.toLowerCase().includes(searchKeyword) || item.message.toLowerCase().includes(searchKeyword);
        });
    }
    if (filteredList.length === 0) { container.innerHTML = searchKeyword ? '<div class="empty-state">未找到匹配的聊天</div>' : '<div class="empty-state">该分类下暂无聊天记录</div>'; return; }
    const pinned = filteredList.filter(f => f.isPinned); const others = filteredList.filter(f => !f.isPinned);
    let html = ''; pinned.forEach((item, index) => { html += renderChatItem(item, true); });
    if (pinned.length > 0 && others.length > 0) { html += '<div class="chat-list-physical-gap"></div>'; }
    others.forEach(item => { html += renderChatItem(item, false); });
    container.innerHTML = html; addSwipeListeners();
}

function renderChatItem(item, isPinned) {
    let html = `<div class="chat-item-wrapper">`;
    const isGroup = item.members !== undefined;
    const clickAction = isGroup ? `openGroupChat('${item.id}')` : `openChat('${item.id}')`;
    const avatar = isGroup ? 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"%3E%3Crect width="24" height="24"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="8"%3E群%3C/text%3E%3C/svg%3E' : (item.avatar || DEFAULT_AVATAR);
    const name = isGroup ? item.name : getFriendDisplayName(item);
    html += `<div class="chat-item ${isPinned ? 'pinned' : ''}" data-id="${item.id}" onclick="${clickAction}">
        <img src="${avatar}" class="chat-avatar" alt="头像">
        <div class="chat-content"><div class="chat-header"><span class="chat-name">${name}</span><span class="chat-time">${item.time}</span></div><div class="chat-message">${item.message}</div></div>
    </div>`;
    html += `<div class="chat-actions">
        <div class="chat-action-btn pin" onclick="togglePin(${item.id}, event, ${isGroup})">${isPinned ? '取消置顶' : '置顶'}</div>
        <div class="chat-action-btn delete" onclick="deleteChat(${item.id}, event, ${isGroup})">删除</div>
    </div></div>`;
    return html;
}

function deleteChat(id, event, isGroup) {
    if (event) event.stopPropagation();
    if (confirm('确定要删除该聊天吗？')) {
        if (isGroup) { groupList = groupList.filter(g => g.id !== id); saveGroupListToStorage(); }
        else { chatList = chatList.filter(c => c.id !== id); saveChatListToStorage(); }
        renderChatList();
    }
}

function addSwipeListeners() {
    const items = document.querySelectorAll('.chat-item');
    items.forEach(item => {
        let startX = 0, startY = 0, currentX = 0, isSwiping = false; const maxSwipe = -140;
        item.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX; startY = e.touches[0].clientY; item.style.transition = 'none';
            document.querySelectorAll('.chat-item').forEach(other => { if (other !== item && other.style.transform && other.style.transform !== 'translateX(0px)') { other.style.transition = 'transform 0.3s ease'; other.style.transform = 'translateX(0)'; } });
        }, { passive: true });
        item.addEventListener('touchmove', (e) => {
            const touch = e.touches[0]; const diffX = touch.clientX - startX; const diffY = touch.clientY - startY;
            if (Math.abs(diffX) > Math.abs(diffY)) {
                isSwiping = true; currentX = diffX < 0 ? Math.max(diffX, maxSwipe + (diffX - maxSwipe) * 0.3) : Math.min(diffX, 0);
                item.style.transform = `translateX(${currentX}px)`;
            }
        }, { passive: true });
        item.addEventListener('touchend', (e) => {
            if (!isSwiping) return; item.style.transition = 'transform 0.3s ease';
            item.style.transform = currentX < maxSwipe / 2 ? `translateX(${maxSwipe}px)` : 'translateX(0)';
            currentX = 0; isSwiping = false;
        });
    });
}

function togglePin(id, event, isGroup) {
    if (event) event.stopPropagation();
    if (isGroup) { const group = groupList.find(g => g.id === id); if (group) { group.isPinned = !group.isPinned; saveGroupListToStorage(); } }
    else { const friend = chatList.find(f => f.id === id); if (friend) { friend.isPinned = !friend.isPinned; saveChatListToStorage(); } }
    renderChatList();
}

function setupLongPress() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.addEventListener('contextmenu', (e) => e.preventDefault());
    chatMessages.addEventListener('touchstart', (e) => {
        const bubble = e.target.closest('.msg-bubble'); if (!bubble) return;
        longPressTimer = setTimeout(() => { showMsgContextMenu(bubble, e.touches[0]); }, 600);
    }, { passive: true });
    chatMessages.addEventListener('touchend', () => clearTimeout(longPressTimer));
    chatMessages.addEventListener('touchmove', () => clearTimeout(longPressTimer));
    document.addEventListener('touchstart', (e) => { const menu = document.getElementById('msgContextMenu'); if (menu && !menu.contains(e.target)) menu.style.display = 'none'; }, { passive: true });
}

function showQuotePreview() {
    if (!quotedMessage) return;
    const preview = document.getElementById('quotePreview'); const text = document.getElementById('quotePreviewText');
    if (quotedMessage.msgType === 'image') { text.innerHTML = `<img src="${quotedMessage.content}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; vertical-align:middle; margin-right:5px;">图片`; }
    else if (quotedMessage.msgType === 'photo' || quotedMessage.msgType === 'gray_card') { text.textContent = '[照片]'; }
    else if (quotedMessage.msgType === 'sticker') { text.textContent = `[${quotedMessage.stickerName || '表情'}]`; }
    else { text.textContent = quotedMessage.content; }
    preview.style.display = 'block'; document.getElementById('chatInput').focus();
}

function cancelQuote() { quotedMessage = null; document.getElementById('quotePreview').style.display = 'none'; }

function showMsgContextMenu(bubble, touch) {
    const menu = document.getElementById('msgContextMenu'); currentLongPressedMsg = bubble; menu.style.display = 'flex';
    const rect = bubble.getBoundingClientRect(); let top = rect.top - menu.offsetHeight - 15, left = rect.left + (rect.width / 2) - (menu.offsetWidth / 2);
    if (top < 60) top = rect.bottom + 15; if (left < 10) left = 10; if (left + menu.offsetWidth > window.innerWidth - 10) left = window.innerWidth - menu.offsetWidth - 10;
    menu.style.top = top + 'px'; menu.style.left = left + 'px'; if (navigator.vibrate) navigator.vibrate(50);
}

function handleMsgAction(action) {
    const menu = document.getElementById('msgContextMenu'); menu.style.display = 'none'; if (!currentLongPressedMsg) return;
    let content = ""; const textNode = currentLongPressedMsg.querySelector('div:not(.msg-translation):not([style*="font-size: 12px"])');
    content = textNode ? textNode.textContent : currentLongPressedMsg.textContent;
    const row = currentLongPressedMsg.closest('.msg-row'); const isSent = row.classList.contains('sent');
    switch(action) {
        case '复制': navigator.clipboard.writeText(content).then(() => alert('已复制到剪贴板')); break;
        case '转发': openForwardModal(); break;
        case '收藏': {
            const idx = parseInt(row.getAttribute('data-msg-index')); const history = chatHistories[currentChatFriendId]; let newFav;
            if (history && !isNaN(idx) && history[idx].isMergedForward) { const msg = history[idx]; newFav = { id: Date.now(), content: msg.content, isMergedForward: true, title: msg.title, fullHistory: msg.fullHistory, date: new Date().toISOString().split('T')[0], isPinned: false }; }
            else { newFav = { id: Date.now(), content: content, date: new Date().toISOString().split('T')[0], isPinned: false }; }
            favoritesData.unshift(newFav); saveFavoritesToStorage(); alert('已收藏');
            break;
        }
        case '删除': if (confirm('确定删除这条消息吗？')) deleteCurrentMsg(); break;
        case '撤回': if (confirm('确定撤回这条消息吗？')) withdrawCurrentMsg(isSent); break;
        case '引用': { const history = chatHistories[currentChatFriendId]; const dataIndex = row.getAttribute('data-msg-index'); if (history && dataIndex !== null) { quotedMessage = history[dataIndex]; showQuotePreview(); } break; }
        case '多选': enterMultiSelectMode(parseInt(row.getAttribute('data-msg-index'))); break;
        case '编辑': editCurrentMsg(content); break;
        case '翻译': translateCurrentMsg(); break;
        case '重回': {
            const history = chatHistories[currentChatFriendId]; const dataIndex = parseInt(row.getAttribute('data-msg-index'));
            if (history && !isNaN(dataIndex)) {
                if (isSent) history.splice(dataIndex + 1); else history.splice(dataIndex);
                saveChatHistories(); renderMessages(); const friend = chatList.find(f => f.id === currentChatFriendId);
                if (friend) { if (history.length > 0) { const lastMsg = history[history.length - 1]; friend.message = lastMsg.content || ''; friend.time = formatTime(new Date(lastMsg.time)); } else { friend.message = '请开始聊天'; } saveChatListToStorage(); renderChatList(); }
                callAI();
            }
            break;
        }
        default: alert('功能[' + action + ']开发中...');
    }
}

function openChatInfo() {
    if (!currentChatFriendId) return; const friend = chatList.find(f => f.id === currentChatFriendId); if (!friend) return;
    showContainer('chatInfoContainer'); document.getElementById('chatInfoAvatar').src = friend.avatar || ''; document.getElementById('chatInfoRemark').value = friend.remark || friend.name || '';
    const settings = getChatSettings(currentChatFriendId); const boundCountEl = document.getElementById('chatInfoBoundCount');
    if (boundCountEl) { const boundIds = settings.boundWorldBookIds || []; boundCountEl.textContent = boundIds.length > 0 ? `已绑定 ${boundIds.length} 本` : '未绑定'; }
    document.getElementById('chatInfoMemCount').value = settings.memCount || 10;
    const autoSum = settings.autoSum || false; document.getElementById('chatInfoAutoSum').checked = autoSum; document.getElementById('chatInfoSumRounds').value = settings.sumRounds || 5;
    document.getElementById('chatInfoSumRoundsRow').style.display = autoSum ? 'flex' : 'none';
    document.getElementById('chatInfoProactiveMsg').checked = settings.proactiveMsg || false;
    document.getElementById('chatInfoSenseTime').checked = settings.senseTime || false;
    document.getElementById('chatInfoProactiveMoment').checked = settings.proactiveMoment || false;
    document.getElementById('chatInfoOfflineInvite').checked = settings.offlineInvite || false;
    document.getElementById('chatInfoSyncGroup').checked = settings.syncGroup || false;
    document.getElementById('chatInfoAiMomentRangeText').textContent = settings.aiMomentRange || '最近三天';
    document.getElementById('chatInfoSticky').checked = friend.isPinned || false;
    document.getElementById('chatInfoBlock').checked = settings.isBlocked || false;
    saveUIState();
}

function openAiMomentRangeModal() {
    const modal = document.getElementById('aiMomentRangeModal'); const currentRange = document.getElementById('chatInfoAiMomentRangeText').textContent;
    modal.classList.add('active'); document.querySelectorAll('.range-radio').forEach(r => r.classList.remove('selected'));
    const radioIdMap = { '最近半年': 'range-half-year', '最近一个月': 'range-one-month', '最近三天': 'range-three-days', '全部': 'range-all' };
    const radioId = radioIdMap[currentRange]; if (radioId) { const radio = document.getElementById(radioId); if (radio) radio.classList.add('selected'); }
    modal.onclick = (e) => { if (e.target === modal) closeAiMomentRangeModal(); };
}

function selectAiMomentRange(range) {
    document.querySelectorAll('.range-radio').forEach(r => r.classList.remove('selected'));
    const radioIdMap = { '最近半年': 'range-half-year', '最近一个月': 'range-one-month', '最近三天': 'range-three-days', '全部': 'range-all' };
    const radioId = radioIdMap[range]; if (radioId) { const radio = document.getElementById(radioId); if (radio) radio.classList.add('selected'); }
    document.getElementById('chatInfoAiMomentRangeText').textContent = range; saveChatInfoSettings();
    setTimeout(closeAiMomentRangeModal, 200);
}

function closeAiMomentRangeModal() { document.getElementById('aiMomentRangeModal').classList.remove('active'); }

function openManualMemory() {
    if (!currentChatFriendId) return; const friend = chatList.find(f => f.id === currentChatFriendId); if (!friend) return;
    const contact = contacts.find(c => c.id === friend.contactId); const realName = contact ? contact.name : friend.name;
    document.getElementById('manualMemoryTitle').textContent = `${realName}的记忆`;
    const settings = getChatSettings(currentChatFriendId); document.getElementById('manualMemoryInput').value = settings.manualMemory || '';
    document.getElementById('chatInfoContainer').style.display = 'none'; document.getElementById('manualMemoryContainer').style.display = 'flex'; saveUIState();
}

function closeManualMemory() { document.getElementById('manualMemoryContainer').style.display = 'none'; document.getElementById('chatInfoContainer').style.display = 'flex'; saveUIState(); }

function saveManualMemory() {
    if (!currentChatFriendId) return; const memoryText = document.getElementById('manualMemoryInput').value.trim();
    const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}'); if (!allSettings[currentChatFriendId]) allSettings[currentChatFriendId] = {};
    allSettings[currentChatFriendId].manualMemory = memoryText; localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings));
    alert('记忆已保存'); closeManualMemory();
}

function closeChatInfo() {
    document.getElementById('chatInfoContainer').style.display = 'none';
    if (isOpenedFromContactDetail) { isOpenedFromContactDetail = false; closeChat(); if (currentDetailFriendId) openContactDetail(currentDetailFriendId); }
    saveUIState();
}

function getChatSettings(friendId) { const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}'); return allSettings[friendId] || {}; }

function saveChatInfoSettings() {
    if (!currentChatFriendId) return; const friend = chatList.find(f => f.id === currentChatFriendId); if (!friend) return;
    const remark = document.getElementById('chatInfoRemark').value.trim(); friend.remark = remark; document.getElementById('chatPartnerName').textContent = getFriendDisplayName(friend);
    friend.isPinned = document.getElementById('chatInfoSticky').checked;
    const autoSum = document.getElementById('chatInfoAutoSum').checked; document.getElementById('chatInfoSumRoundsRow').style.display = autoSum ? 'flex' : 'none';
    const oldSettings = getChatSettings(currentChatFriendId);
    const settings = { ...oldSettings, memCount: document.getElementById('chatInfoMemCount').value, autoSum: autoSum, sumRounds: document.getElementById('chatInfoSumRounds').value, proactiveMsg: document.getElementById('chatInfoProactiveMsg').checked, senseTime: document.getElementById('chatInfoSenseTime').checked, proactiveMoment: document.getElementById('chatInfoProactiveMoment').checked, offlineInvite: document.getElementById('chatInfoOfflineInvite').checked, syncGroup: document.getElementById('chatInfoSyncGroup').checked, aiMomentRange: document.getElementById('chatInfoAiMomentRangeText').textContent, isBlocked: document.getElementById('chatInfoBlock').checked };
    const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}'); allSettings[currentChatFriendId] = settings;
    localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings)); saveChatListToStorage(); renderChatList();
}

function changeChatInfoAvatar() {
    currentImageId = 'chatInfoAvatar'; const originalConfirmUrl = window.confirmUrl;
    window.confirmUrl = function() {
        const url = document.getElementById('urlInput').value.trim();
        if (url && currentChatFriendId) {
            const friend = chatList.find(f => f.id === currentChatFriendId);
            if (friend) { friend.avatar = url; document.getElementById('chatInfoAvatar').src = url; const contact = contacts.find(c => c.id === friend.contactId); if (contact) { contact.avatar = url; saveContactsToStorage(); renderContactsList(); } saveChatListToStorage(); renderChatList(); }
            closeModal();
        }
        window.confirmUrl = originalConfirmUrl;
    };
    const originalHandleFileSelect = window.handleFileSelect;
    window.handleFileSelect = function(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const src = e.target.result;
                if (currentChatFriendId) {
                    const friend = chatList.find(f => f.id === currentChatFriendId);
                    if (friend) { friend.avatar = src; document.getElementById('chatInfoAvatar').src = src; const contact = contacts.find(c => c.id === friend.contactId); if (contact) { contact.avatar = src; saveContactsToStorage(); renderContactsList(); } saveChatListToStorage(); renderChatList(); }
                }
                closeModal();
            };
            reader.readAsDataURL(file);
        }
        window.handleFileSelect = originalHandleFileSelect;
    };
    document.getElementById('urlInputContainer').style.display = 'none'; document.getElementById('imageModal').classList.add('active');
}

function clearCurrentChatHistory() { if (!currentChatFriendId) return; if (confirm('确定要清空聊天记录吗？')) { chatHistories[currentChatFriendId] = []; saveChatHistories(); renderMessages(); alert('已清空聊天记录'); } }

function deleteCurrentPartner() {
    if (!currentChatFriendId) return;
    if (confirm('确定要删除该联系人吗？')) {
        chatList = chatList.filter(f => f.id !== currentChatFriendId); delete chatHistories[currentChatFriendId];
        saveChatListToStorage(); saveChatHistories(); closeChatInfo(); closeChat(); renderChatList();
    }
}

function editCurrentMsg(oldContent) { const input = document.getElementById('msgEditInput'); input.value = oldContent; document.getElementById('msgEditModal').classList.add('active'); }
function closeMsgEditModal() { document.getElementById('msgEditModal').classList.remove('active'); }

function confirmMsgEdit() {
    const newValue = document.getElementById('msgEditInput').value.trim();
    if (newValue && currentLongPressedMsg) {
        const row = currentLongPressedMsg.closest('.msg-row'); const history = chatHistories[currentChatFriendId];
        if (history) {
            const dataIndex = parseInt(row.getAttribute('data-msg-index'));
            if (!isNaN(dataIndex) && history[dataIndex]) {
                history[dataIndex].content = newValue; delete history[dataIndex].translation; saveChatHistories();
                if (dataIndex === history.length - 1) { const friend = chatList.find(f => f.id === currentChatFriendId); if (friend) { friend.message = newValue; saveChatListToStorage(); renderChatList(); } }
                renderMessages();
            }
        }
    }
    closeMsgEditModal();
}

async function translateCurrentMsg() {
    if (!currentLongPressedMsg || !currentChatFriendId) return; const row = currentLongPressedMsg.closest('.msg-row'); const history = chatHistories[currentChatFriendId]; const dataIndex = row.getAttribute('data-msg-index');
    if (history && dataIndex !== null && history[dataIndex]) {
        const msg = history[dataIndex]; const content = msg.content;
        if (msg.translation) { delete msg.translation; saveChatHistories(); renderMessages(); return; }
        const chatStatus = document.getElementById('chatStatus'); if (chatStatus) { chatStatus.textContent = '翻译中...'; chatStatus.classList.add('typing-status'); }
        const configId = localStorage.getItem('current_api_config_id') || 'default'; const configs = await dbGetAll('api_configs'); const config = configs.find(c => c.id === configId);
        if (!config || !config.url || !config.key) {
            setTimeout(() => {
                if (chatStatus) { chatStatus.textContent = ''; chatStatus.classList.remove('typing-status'); }
                msg.translation = "（模拟翻译）" + content; saveChatHistories(); renderMessages();
            }, 800); return;
        }
        try {
            let apiUrl = config.url.trim().replace(/\/$/, ''); if (!apiUrl.endsWith('/chat/completions')) apiUrl += '/chat/completions';
            const response = await fetch(apiUrl, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` },
                body: JSON.stringify({ model: config.model, messages: [ { role: "system", content: "你是一个翻译专家。只返回翻译后的内容。" }, { role: "user", content: content } ], temperature: 0.3 })
            });
            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) { msg.translation = data.choices[0].message.content.trim(); saveChatHistories(); renderMessages(); } else { throw new Error('API 返回格式错误'); }
        } catch (e) { console.error("Translation Error:", e); msg.translation = "翻译失败，请检查配置"; renderMessages(); }
        finally { if (chatStatus) { chatStatus.textContent = ''; chatStatus.classList.remove('typing-status'); } }
    }
}

function withdrawCurrentMsg(isSent) {
    const row = currentLongPressedMsg.closest('.msg-row'); const history = chatHistories[currentChatFriendId];
    if (history) {
        const dataIndex = parseInt(row.getAttribute('data-msg-index')); if (isNaN(dataIndex) || !history[dataIndex]) return;
        const originalMsg = history[dataIndex]; if (!isSent) { alert('只能撤回自己发送的消息'); return; }
        const now = new Date().getTime(); const diff = now - (originalMsg.time || 0); if (diff > 2 * 60 * 1000) { alert('消息已发出超过2分钟，无法撤回'); return; }
        history[dataIndex] = { type: 'system_withdrawn', withdrawnContent: originalMsg.content, withdrawnBy: 'user', time: new Date().getTime() };
        saveChatHistories(); renderMessages();
        const friend = chatList.find(f => f.id === currentChatFriendId); if (friend) { friend.message = '你撤回了一条消息'; saveChatListToStorage(); renderChatList(); }
    }
}

function showWithdrawDetail(content) { document.getElementById('withdrawnContent').textContent = content; document.getElementById('withdrawModal').classList.add('active'); }
function closeWithdrawModal() { document.getElementById('withdrawModal').classList.remove('active'); }

function deleteCurrentMsg() {
    const bubble = currentLongPressedMsg; const row = bubble.closest('.msg-row'); const history = chatHistories[currentChatFriendId];
    if (history) { const dataIndex = row.getAttribute('data-msg-index'); if (dataIndex !== null && history[dataIndex]) { history[dataIndex].isDeletedLocal = true; saveChatHistories(); renderMessages(); } }
}

async function loadChatHistories() {
    try {
        const data = await dbGet('settings', 'wechat_chat_histories');
        if (data) { chatHistories = data.value; } else {
            const saved = localStorage.getItem('wechat_chat_histories');
            if (saved) { chatHistories = JSON.parse(saved); await saveChatHistories(); }
        }
    } catch (e) { console.error("Load Chat Histories Error:", e); const saved = localStorage.getItem('wechat_chat_histories'); if (saved) chatHistories = JSON.parse(saved); }
}

async function saveChatHistories() {
    try { await dbPut('settings', { key: 'wechat_chat_histories', value: chatHistories }); } catch (e) { console.error("Save Chat Histories Error:", e); safeLocalStorageSet('wechat_chat_histories', JSON.stringify(chatHistories), true); }
}

function openChat(friendId) {
    const friend = chatList.find(f => String(f.id) === String(friendId)); if (!friend) return;
    currentChatFriendId = friend.id; showContainer('chatPageContainer'); document.getElementById('chatPartnerName').textContent = getFriendDisplayName(friend); document.getElementById('chatStatus').textContent = '';
    const settings = getChatSettings(friendId); applyChatBackground(settings.background);
    const drafts = JSON.parse(localStorage.getItem('wechat_chat_drafts') || '{}'); const draft = drafts[friendId] || '';
    const input = document.getElementById('chatInput'); input.value = draft; document.getElementById('chatMorePanel').style.display = 'none';
    updateTime(); updateBattery(); renderMessages(); handleChatInput(input); saveUIState();
}

function openChatBackgroundModal() {
    if (!currentChatFriendId) return; const originalConfirmUrl = window.confirmUrl; const originalHandleFileSelect = window.handleFileSelect;
    window.confirmUrl = function() { const url = document.getElementById('urlInput').value.trim(); if (url) { setChatBackground(url); closeModal(); } window.confirmUrl = originalConfirmUrl; document.querySelector('#imageModal .modal-title').textContent = '更改图片'; };
    window.handleFileSelect = function(event) {
        const file = event.target.files[0]; if (file && file.type.startsWith('image/')) {
            const reader = new FileReader(); reader.onload = function(e) { setChatBackground(e.target.result); closeModal(); }; reader.readAsDataURL(file);
        }
        window.handleFileSelect = originalHandleFileSelect; document.querySelector('#imageModal .modal-title').textContent = '更改图片';
    };
    document.getElementById('urlInputContainer').style.display = 'none'; document.getElementById('imageModal').classList.add('active'); document.querySelector('#imageModal .modal-title').textContent = '设置聊天背景';
}

function setChatBackground(src) {
    if (!currentChatFriendId) return; const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}'); if (!allSettings[currentChatFriendId]) allSettings[currentChatFriendId] = {};
    allSettings[currentChatFriendId].background = src; localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings)); applyChatBackground(src); alert('聊天背景已设置');
}

function applyChatBackground(src) {
    const container = document.getElementById('chatMessages');
    if (src) { container.style.backgroundImage = `url('${src}')`; container.style.backgroundSize = 'cover'; container.style.backgroundPosition = 'center'; } else { container.style.backgroundImage = 'none'; }
}

async function loadFavoriteStickers() {
    try {
        const data = await dbGet('settings', 'wechat_favorite_stickers');
        if (data) { favoriteStickers = data.value; } else {
            const saved = localStorage.getItem('wechat_favorite_stickers'); if (saved) { favoriteStickers = JSON.parse(saved); await saveFavoriteStickers(); }
        }
    } catch (e) { const saved = localStorage.getItem('wechat_favorite_stickers'); if (saved) favoriteStickers = JSON.parse(saved); }
}

async function saveFavoriteStickers() { try { await dbPut('settings', { key: 'wechat_favorite_stickers', value: favoriteStickers }); } catch (e) { localStorage.setItem('wechat_favorite_stickers', JSON.stringify(favoriteStickers)); } }

function closeChat() {
    document.getElementById('chatPageContainer').style.display = 'none'; document.getElementById('wechatContainer').style.display = 'block';
    document.getElementById('chatMorePanel').style.display = 'none'; const stickerPicker = document.getElementById('stickerPickerPanel'); if (stickerPicker) stickerPicker.classList.remove('active');
    currentChatFriendId = null; saveUIState();
}

function toggleStickerPicker(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const panel = document.getElementById('stickerPickerPanel'); const morePanel = document.getElementById('chatMorePanel'); const inputBar = document.getElementById('chatInputBar'); const isVisible = panel.classList.contains('active');
    isPanelToggling = true;
    if (!isVisible) { if (morePanel) morePanel.style.display = 'none'; if (inputBar) inputBar.style.paddingBottom = '30px'; document.activeElement.blur(); switchStickerCategory('default'); panel.classList.add('active'); }
    else { panel.classList.remove('active'); }
    setTimeout(() => { const container = document.getElementById('chatMessages'); if (container) container.scrollTop = container.scrollHeight; isPanelToggling = false; }, 300); saveUIState();
}

function switchStickerCategory(category) {
    currentStickerCategory = category; document.querySelectorAll('.sticker-category-item').forEach(item => { item.classList.toggle('active', item.textContent === (category === 'default' ? '默认' : '收藏')); }); renderChatStickerGrid();
}

function renderChatStickerGrid() {
    const grid = document.getElementById('chatStickerGrid'); grid.innerHTML = ''; grid.classList.remove('empty');
    const list = currentStickerCategory === 'default' ? stickerList : favoriteStickers;
    if (list.length === 0) {
        grid.classList.add('empty'); const tip = document.createElement('div'); tip.className = 'sticker-empty-tip';
        tip.textContent = currentStickerCategory === 'default' ? '表情库为空' : '暂无收藏表情包'; grid.appendChild(tip); return;
    }
    list.forEach((sticker, index) => {
        const item = document.createElement('div'); item.className = 'chat-sticker-item';
        let timer;
        item.addEventListener('touchstart', () => {
            timer = setTimeout(() => {
                if (currentStickerCategory === 'default') {
                    if (!favoriteStickers.some(s => s.src === sticker.src)) { favoriteStickers.push(sticker); saveFavoriteStickers(); alert('已加入收藏'); }
                    else { alert('已经在收藏中了'); }
                } else { if (confirm('确定从收藏中移除该表情吗？')) { favoriteStickers.splice(index, 1); saveFavoriteStickers(); renderChatStickerGrid(); } }
            }, 800);
        }, { passive: true });
        item.addEventListener('touchend', () => clearTimeout(timer)); item.addEventListener('touchmove', () => clearTimeout(timer));
        item.onclick = () => sendStickerMessage(sticker); item.innerHTML = `<img src="${sticker.src}" alt="${sticker.name}" class="chat-sticker-img">`; grid.appendChild(item);
    });
}

function sendStickerMessage(sticker) {
    if (!currentChatFriendId) return;
    const history = chatHistories[currentChatFriendId] || [];
    const newMessage = { type: 'sent', msgType: 'sticker', content: sticker.src, stickerName: sticker.name, time: new Date().getTime() };
    history.push(newMessage); chatHistories[currentChatFriendId] = history;
    const friend = chatList.find(f => f.id === currentChatFriendId); if (friend) { friend.message = `[${sticker.name}]`; friend.time = formatTime(new Date()); }
    document.getElementById('stickerPickerPanel').classList.remove('active'); renderMessages(); saveChatHistories(); saveChatListToStorage(); renderChatList();
}

function handleChatAlbum() { document.getElementById('chatAlbumInput').click(); }
window.handleChatAlbum = handleChatAlbum;

async function loadMobileNet() {
    if (!mobileNetModel) {
        try { mobileNetModel = await mobilenet.load(); } catch (e) { console.error("MobileNet 加载失败:", e); }
    }
    return mobileNetModel;
}

async function recognizeImage(imgSrc) {
    const model = await loadMobileNet(); if (!model) return [];
    return new Promise((resolve) => {
        const img = new Image(); img.onload = async () => { try { const predictions = await model.classify(img); resolve(predictions); } catch (err) { resolve([]); } };
        img.onerror = () => resolve([]); img.src = imgSrc;
    });
}

function handleChatAlbumSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader(); reader.onload = async function(e) { sendChatImage(e.target.result, ""); }; reader.readAsDataURL(file);
    }
    event.target.value = '';
}
window.handleChatAlbumSelect = handleChatAlbumSelect;

function sendChatImage(src, description) {
    if (!currentChatFriendId) return; const history = chatHistories[currentChatFriendId] || [];
    const newMessage = { type: 'sent', msgType: 'image', content: src, description: description || "", time: new Date().getTime() };
    history.push(newMessage); chatHistories[currentChatFriendId] = history;
    const friend = chatList.find(f => f.id === currentChatFriendId); if (friend) { friend.message = '[照片]'; friend.time = formatTime(new Date()); }
    renderMessages(); saveChatHistories(); saveChatListToStorage(); renderChatList();
}

function handleChatCamera() {
    const modal = document.getElementById('imageContentModal'); if (!modal) return;
    const textarea = document.getElementById('imageContentInput'); const title = modal.querySelector('.modal-title'); if (title) title.textContent = '拍照输入';
    textarea.value = ''; modal.classList.add('active'); textarea.focus();
    const confirmBtn = modal.querySelector('.modal-btn.confirm');
    confirmBtn.onclick = () => { const content = textarea.value.trim(); if (content) { sendChatGrayCard(content); closeImageContentModal(); } };
}
window.handleChatCamera = handleChatCamera;

function sendChatGrayCard(content, sender = 'me') {
    if (!currentChatFriendId) return; const history = chatHistories[currentChatFriendId] || [];
    const newMessage = { type: sender === 'me' ? 'sent' : 'received', msgType: 'gray_card', content: content, time: new Date().getTime() };
    history.push(newMessage); chatHistories[currentChatFriendId] = history;
    const friend = chatList.find(f => f.id === currentChatFriendId); if (friend) { friend.message = '[照片]'; friend.time = formatTime(new Date()); }
    renderMessages(); saveChatHistories(); saveChatListToStorage(); renderChatList();
}

function handleChatFile() { document.getElementById('chatFileInput').click(); }
window.handleChatFile = handleChatFile;

async function handleChatFileSelect(event) {
    const file = event.target.files[0]; if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === 'docx') {
        const reader = new FileReader(); reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            if (window.mammoth) { mammoth.extractRawText({arrayBuffer: arrayBuffer}).then(function(result) { sendChatFile(file.name, result.value); }).catch(function(err) { alert('Docx解析失败：' + err.message); }); }
            else { alert('正在加载Docx解析组件，请稍后再试'); }
        }; reader.readAsArrayBuffer(file);
    } else { const reader = new FileReader(); reader.onload = function(e) { sendChatFile(file.name, e.target.result); }; reader.readAsText(file); }
    event.target.value = '';
}
window.handleChatFileSelect = handleChatFileSelect;

function sendChatFile(fileName, fileContent) {
    if (!currentChatFriendId) return; const history = chatHistories[currentChatFriendId] || [];
    const newMessage = { type: 'sent', msgType: 'file', fileName: fileName, content: `[文件: ${fileName}]`, fileContent: fileContent, time: new Date().getTime() };
    history.push(newMessage); chatHistories[currentChatFriendId] = history;
    const friend = chatList.find(f => f.id === currentChatFriendId); if (friend) { friend.message = `[文件] ${fileName}`; friend.time = formatTime(new Date()); }
    renderMessages(); saveChatHistories(); saveChatListToStorage(); renderChatList();
}

function openContactCardModal() { document.getElementById('contactCardModal').classList.add('active'); renderContactCardList(); }
window.openContactCardModal = openContactCardModal;
function closeContactCardModal() { document.getElementById('contactCardModal').classList.remove('active'); document.getElementById('contactCardSearchInput').value = ''; }
window.closeContactCardModal = closeContactCardModal;

function renderContactCardList() {
    const container = document.getElementById('contactCardList'); const keyword = document.getElementById('contactCardSearchInput').value.trim().toLowerCase();
    let filtered = chatList.filter(friend => getFriendDisplayName(friend).toLowerCase().includes(keyword));
    if (filtered.length === 0) { container.innerHTML = '<div class="empty-state" style="padding: 10px; font-size: 12px; color: #999;">无匹配联系人</div>'; return; }
    let html = ''; filtered.forEach(friend => {
        const displayName = getFriendDisplayName(friend);
        html += `<div class="wechat-contact-item" onclick="sendContactCard(${friend.contactId})" style="padding: 8px 12px; border-bottom: 1px solid #f9f9f9; display: flex; align-items: center; gap: 10px;">
            <img src="${friend.avatar || DEFAULT_AVATAR}" class="wechat-contact-avatar" style="width: 36px; height: 36px; border-radius: 4px; object-fit: cover;">
            <div class="wechat-contact-name" style="font-size: 15px; color: #000;">${displayName}</div>
        </div>`;
    }); container.innerHTML = html;
}
window.renderContactCardList = renderContactCardList;

function sendContactCard(contactId) {
    if (!currentChatFriendId) return; const contact = contacts.find(c => c.id === contactId); if (!contact) return;
    const history = chatHistories[currentChatFriendId] || []; const displayName = contact.netName || contact.name;
    const newMessage = { type: 'sent', msgType: 'card', content: `[名片: ${displayName}]`, cardInfo: contact, cardContactId: contact.id, time: new Date().getTime() };
    history.push(newMessage); chatHistories[currentChatFriendId] = history;
    const friend = chatList.find(f => f.id === currentChatFriendId); if (friend) { friend.message = `[个人名片] ${displayName}`; friend.time = formatTime(new Date()); }
    renderMessages(); saveChatHistories(); saveChatListToStorage(); renderChatList(); closeContactCardModal();
}

function sendChatPhoto(content) { sendChatGrayCard(content); }
window.sendChatPhoto = sendChatPhoto;

function previewImage(src) {
    const modal = document.getElementById('imageDetailModal'); const imgEl = document.getElementById('imageDetailImg'); const textEl = document.getElementById('imageDetailText');
    if (modal && imgEl && textEl) { modal.classList.remove('photo-preview-mode'); imgEl.src = src; imgEl.style.display = 'block'; textEl.style.display = 'none'; modal.classList.add('active'); }
}
window.previewImage = previewImage;

function showPhotoDetail(content) {
    const modal = document.getElementById('imageDetailModal'); const textEl = document.getElementById('imageDetailText'); const imgEl = document.getElementById('imageDetailImg');
    if (modal && textEl) { modal.classList.add('photo-preview-mode'); if (imgEl) imgEl.style.display = 'none'; textEl.textContent = content; textEl.style.display = 'block'; textEl.style.color = '#000'; modal.classList.add('active'); }
}

function showFilePreview(fileName, fileContent) {
    const modal = document.getElementById('filePreviewModal'); const titleEl = document.getElementById('filePreviewTitle'); const textEl = document.getElementById('filePreviewText'); const scrollEl = document.getElementById('filePreviewScroll');
    if (modal && titleEl && textEl) { titleEl.textContent = fileName; textEl.textContent = fileContent || '无内容'; modal.classList.add('active'); if (scrollEl) scrollEl.scrollTop = 0; }
}

function toggleChatMorePanel(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const panel = document.getElementById('chatMorePanel'); const stickerPanel = document.getElementById('stickerPickerPanel'); const inputBar = document.getElementById('chatInputBar'); const isVisible = panel.style.display === 'grid';
    isPanelToggling = true;
    if (!isVisible) { if (stickerPanel) stickerPanel.classList.remove('active'); document.activeElement.blur(); panel.style.display = 'grid'; if (inputBar) inputBar.style.paddingBottom = '10px'; }
    else { panel.style.display = 'none'; if (inputBar) inputBar.style.paddingBottom = '30px'; }
    setTimeout(() => { const container = document.getElementById('chatMessages'); if (container) container.scrollTop = container.scrollHeight; isPanelToggling = false; }, 300); saveUIState();
}

function hideChatMorePanel() {
    if (isPanelToggling) return; const panel = document.getElementById('chatMorePanel'); const stickerPanel = document.getElementById('stickerPickerPanel'); const inputBar = document.getElementById('chatInputBar');
    let changed = false; if (panel && panel.style.display === 'grid') { panel.style.display = 'none'; if (inputBar) inputBar.style.paddingBottom = '30px'; changed = true; }
    if (stickerPanel && stickerPanel.classList.contains('active')) { stickerPanel.classList.remove('active'); changed = true; }
    if (changed) saveUIState();
}

function handleChatInput(textarea) {
    const sendBtn = document.getElementById('chatSendBtn'); const addons = document.getElementById('chatAddons'); const aiMicBtn = document.getElementById('aiMicBtn');
    textarea.style.height = 'auto'; let scrollHeight = textarea.scrollHeight; textarea.style.height = scrollHeight + 'px';
    if (textarea.value.length > 0) {
        sendBtn.style.display = 'block'; addons.style.display = 'none'; if (aiMicBtn) aiMicBtn.style.display = 'none';
        const morePanel = document.getElementById('chatMorePanel'); if (morePanel && morePanel.style.display === 'grid') { morePanel.style.display = 'none'; document.getElementById('chatInputBar').style.paddingBottom = '30px'; }
        const stickerPanel = document.getElementById('stickerPickerPanel'); if (stickerPanel && stickerPanel.classList.contains('active')) { stickerPanel.classList.remove('active'); }
    } else { sendBtn.style.display = 'none'; addons.style.display = 'flex'; if (aiMicBtn) aiMicBtn.style.display = 'flex'; }
    if (currentChatFriendId) { const drafts = JSON.parse(localStorage.getItem('wechat_chat_drafts') || '{}'); drafts[currentChatFriendId] = textarea.value; localStorage.setItem('wechat_chat_drafts', JSON.stringify(drafts)); }
}

function renderMessages() {
    const container = document.getElementById('chatMessages'); const history = chatHistories[currentChatFriendId] || []; const friend = chatList.find(f => f.id === currentChatFriendId);
    const userAvatar = wechatUserInfo.avatar || document.getElementById('accountAvatarImg').src || DEFAULT_AVATAR; const friendAvatar = friend ? (friend.avatar || DEFAULT_AVATAR) : DEFAULT_AVATAR;
    container.innerHTML = ''; let lastShowTime = 0; const FIVE_MINUTES = 5 * 60 * 1000;
    history.forEach((msg, index) => {
        if (msg.isDeletedLocal) return; const msgTime = msg.time || 0;
        if (lastShowTime === 0 || (msgTime - lastShowTime > FIVE_MINUTES)) {
            const timeHint = document.createElement('div'); timeHint.className = 'msg-system-hint'; const date = new Date(msgTime); const now = new Date(); const isToday = date.toDateString() === now.toDateString();
            timeHint.textContent = isToday ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            container.appendChild(timeHint); lastShowTime = msgTime;
        }
        if (msg.type === 'system_withdrawn') {
            const hint = document.createElement('div'); hint.className = 'msg-system-hint'; hint.textContent = msg.withdrawnBy === 'user' ? `你撤回了一条消息` : `对方撤回了一条消息`; hint.onclick = () => showWithdrawDetail(msg.withdrawnContent); container.appendChild(hint); return;
        }
        const row = document.createElement('div'); row.className = `msg-row ${msg.type}`; if (isMultiSelectMode) { row.classList.add('multi-selecting'); row.onclick = () => toggleMsgSelection(index); }
        row.setAttribute('data-msg-index', index); const checkbox = document.createElement('div'); checkbox.className = 'msg-checkbox'; if (selectedMsgIndexes.has(index)) checkbox.classList.add('checked');
        const avatar = document.createElement('img'); avatar.className = 'msg-avatar'; avatar.src = msg.type === 'sent' ? userAvatar : friendAvatar;
        const bubble = document.createElement('div');
        if (msg.isMergedForward) {
            bubble.className = 'msg-bubble merged-forward-bubble'; bubble.onclick = (e) => { e.stopPropagation(); openMergedChatDetail(msg); };
            const title = document.createElement('div'); title.className = 'merged-forward-title'; title.textContent = msg.title || '聊天记录'; bubble.appendChild(title);
            const preview = document.createElement('div'); preview.className = 'merged-forward-preview'; const historyToPreview = msg.fullHistory || [];
            historyToPreview.slice(0, 3).forEach(h => { const item = document.createElement('div'); item.className = 'merged-forward-preview-item'; item.textContent = `${h.name}：${h.msgType === 'sticker' ? '[' + (h.stickerName || '表情') + ']' : h.content}`; preview.appendChild(item); });
            if (historyToPreview.length > 3) { const more = document.createElement('div'); more.className = 'merged-forward-preview-item'; more.textContent = '...'; preview.appendChild(more); }
            bubble.appendChild(preview); const line = document.createElement('div'); line.className = 'merged-forward-line'; bubble.appendChild(line);
            const footer = document.createElement('div'); footer.className = 'merged-forward-footer'; footer.textContent = '聊天记录'; bubble.appendChild(footer);
        } else if (msg.msgType === 'sticker') { bubble.className = 'msg-bubble sticker-bubble'; }
        else if (msg.msgType === 'image') { bubble.className = 'msg-bubble image-bubble'; }
        else if (msg.msgType === 'photo' || msg.msgType === 'gray_card') { bubble.className = 'msg-bubble'; bubble.style.background = 'transparent'; bubble.style.boxShadow = 'none'; bubble.style.padding = '0'; bubble.style.maxWidth = 'none'; }
        else if (msg.msgType === 'file') { bubble.className = 'msg-bubble file-bubble'; }
        else if (msg.msgType === 'card') { bubble.className = 'msg-bubble card-bubble'; }
        else { bubble.className = 'msg-bubble'; }
        if (msg.quote) {
            const quoteBox = document.createElement('div'); quoteBox.className = 'msg-quote-box'; quoteBox.style.cssText = 'font-size:12px; padding:6px 10px; border-radius:6px; margin-bottom:8px; word-break:break-all; line-height:1.4; display:flex; align-items:center; gap:8px;';
            if (msg.type === 'sent') { quoteBox.style.background = 'rgba(255,255,255,0.15)'; quoteBox.style.borderLeft = '3px solid rgba(255,255,255,0.4)'; quoteBox.style.color = 'rgba(255,255,255,0.8)'; }
            else { quoteBox.style.background = 'rgba(0,0,0,0.05)'; quoteBox.style.borderLeft = '3px solid #ddd'; quoteBox.style.color = '#888'; }
            if (msg.quote.msgType === 'image') { const qImg = document.createElement('img'); qImg.src = msg.quote.imgSrc; qImg.style.cssText = 'width:40px; height:40px; object-fit:cover; border-radius:4px;'; quoteBox.appendChild(qImg); const qText = document.createElement('span'); qText.textContent = '图片'; quoteBox.appendChild(qText); }
            else { quoteBox.textContent = msg.quote.content; } bubble.appendChild(quoteBox);
        }
        if (!msg.isMergedForward) {
            if (msg.msgType === 'sticker') { const img = document.createElement('img'); img.src = msg.content; img.className = 'msg-sticker-img'; bubble.appendChild(img); }
            else if (msg.msgType === 'image') { const img = document.createElement('img'); img.src = msg.content; img.style.cssText = 'max-width:150px; max-height:200px; border-radius:4px;'; img.onclick = (e) => { e.stopPropagation(); previewImage(msg.content); }; bubble.appendChild(img); }
            else if (msg.msgType === 'photo' || msg.msgType === 'gray_card') { const card = document.createElement('div'); card.className = 'message-gray-card'; card.textContent = msg.content; card.onclick = (e) => { e.stopPropagation(); showPhotoDetail(msg.content); }; bubble.appendChild(card); }
            else if (msg.msgType === 'file') {
                bubble.style.cssText = 'padding:10px; min-width:120px; cursor:pointer;'; bubble.onclick = (e) => { e.stopPropagation(); showFilePreview(msg.fileName, msg.fileContent); };
                bubble.innerHTML = `<div style="display: flex; align-items: center; gap: 8px;"><div style="font-size: 24px;">📄</div><div style="flex: 1; overflow: hidden;"><div style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${msg.fileName}</div><div style="font-size: 11px; color: ${msg.type === 'sent' ? 'rgba(255,255,255,0.7)' : '#999'};">文档</div></div></div>`;
            } else if (msg.msgType === 'card') {
                bubble.style.cssText = 'padding:10px; min-width:150px; cursor:pointer;'; bubble.onclick = (e) => { e.stopPropagation(); if (msg.cardContactId) openContactDetail(msg.cardContactId); };
                bubble.innerHTML = `<div style="display: flex; flex-direction: column; gap: 8px;"><div style="display: flex; align-items: center; gap: 10px;"><img src="${msg.cardInfo.avatar || DEFAULT_AVATAR}" style="width: 40px; height: 40px; border-radius: 4px;"><div style="font-size: 15px; font-weight: 500;">${msg.cardInfo.name || msg.cardInfo.netName}</div></div><div style="height: 1px; background: ${msg.type === 'sent' ? 'rgba(255,255,255,0.2)' : '#eee'};"></div><div style="font-size: 11px; color: ${msg.type === 'sent' ? 'rgba(255,255,255,0.7)' : '#999'};">个人名片</div></div>`;
            } else { const textNode = document.createElement('div'); textNode.textContent = msg.content; bubble.appendChild(textNode); }
        }
        if (msg.translation) { const transDiv = document.createElement('div'); transDiv.className = 'msg-translation'; transDiv.textContent = msg.translation; bubble.appendChild(transDiv); }
        if (msg.type === 'sent') { row.appendChild(checkbox); row.appendChild(bubble); row.appendChild(avatar); } else { row.appendChild(checkbox); row.appendChild(avatar); row.appendChild(bubble); }
        container.appendChild(row);
    }); container.scrollTop = container.scrollHeight;
}

async function handleGroupMicClick() {
    if (!currentGroupChatId) return; const input = document.getElementById('groupChatInput'); if (input.value.trim().length > 0) await sendGroupMessage(); alert('群聊 AI 正在开发中...');
}

function handleGroupChatCamera() { window.handleChatCamera(); }
function handleGroupChatAlbum() { window.handleChatAlbum(); }
function handleGroupChatFile() { window.handleChatFile(); }
window.handleGroupChatCamera = handleGroupChatCamera; window.handleGroupChatAlbum = handleGroupChatAlbum; window.handleGroupChatFile = handleGroupChatFile;

async function handleMicClick() {
    if (!currentChatFriendId) return; const history = chatHistories[currentChatFriendId] || []; let lastImageMsg = null;
    for (let i = history.length - 1; i >= 0; i--) { if (history[i].msgType === 'image' && history[i].type === 'sent' && (!history[i].description)) { lastImageMsg = history[i]; break; } if (history[i].type === 'received') break; }
    if (lastImageMsg) {
        const chatStatus = document.getElementById('chatStatus'); if (chatStatus) { chatStatus.textContent = '正在识别图片内容...'; chatStatus.classList.add('typing-status'); }
        try {
            const predictions = await recognizeImage(lastImageMsg.content); let recognitionResult = "未能识别", topClassName = "图片";
            if (predictions && predictions.length > 0) { recognitionResult = predictions.map(p => `${p.className} (${(p.probability * 100).toFixed(1)}%)`).join(', '); topClassName = predictions[0].className; }
            lastImageMsg.description = `[识别结果：${recognitionResult}]`; saveChatHistories(); renderMessages(); await callAI(`(发送了图片，识别为：${topClassName})`); return;
        } catch (err) { console.error(err); } finally { if (chatStatus) { chatStatus.textContent = ''; chatStatus.classList.remove('typing-status'); } }
    }
    const input = document.getElementById('chatInput'); if (input.value.trim().length > 0) { await sendChatMessage(); await callAI(null, false); } else { await callAI(null, true); }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput'); const content = input.value.trim(); if (!content || !currentChatFriendId) return;
    if (!chatHistories[currentChatFriendId]) chatHistories[currentChatFriendId] = [];
    const newMessage = { type: 'sent', content: content, time: new Date().getTime() };
    if (quotedMessage) { let qc = quotedMessage.content; if (quotedMessage.msgType === 'photo' || quotedMessage.msgType === 'gray_card') qc = '[照片]'; else if (quotedMessage.msgType === 'sticker') qc = `[${quotedMessage.stickerName || '表情'}]`; newMessage.quote = { content: qc, msgType: quotedMessage.msgType, imgSrc: quotedMessage.msgType === 'image' ? quotedMessage.content : null }; cancelQuote(); }
    chatHistories[currentChatFriendId].push(newMessage); const drafts = JSON.parse(localStorage.getItem('wechat_chat_drafts') || '{}'); delete drafts[currentChatFriendId]; localStorage.setItem('wechat_chat_drafts', JSON.stringify(drafts));
    const friend = chatList.find(f => f.id === currentChatFriendId); if (friend) { friend.message = content; friend.time = formatTime(new Date()); }
    input.value = ''; document.getElementById('chatMorePanel').style.display = 'none'; handleChatInput(input); renderMessages(); saveChatHistories(); saveChatListToStorage(); renderChatList();
}

async function autoSummarizeChat(friendId, config) {
    const history = (chatHistories[friendId] || []).filter(h => h.type !== 'system_withdrawn').slice(-( (parseInt(getChatSettings(friendId).sumRounds) || 5) * 2));
    if (history.length === 0) return; let chatContent = ""; history.forEach(m => { chatContent += `${m.type === 'sent' ? '用户' : '联系人'}: ${m.msgType === 'sticker' ? '[表情]' : m.content}\n`; });
    try {
        let apiUrl = config.url.trim().replace(/\/$/, ''); if (!apiUrl.endsWith('/chat/completions')) apiUrl += '/chat/completions';
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` }, body: JSON.stringify({ model: config.model, messages: [ { role: "system", content: "请总结以下聊天内容，直接返回总结内容。" }, { role: "user", content: chatContent } ], temperature: 0.3 }) });
        const data = await response.json(); if (data.choices && data.choices[0] && data.choices[0].message) {
            const summary = data.choices[0].message.content.trim(); const settings = getChatSettings(friendId); const oldMemory = settings.manualMemory || ""; const newMemory = oldMemory ? `${oldMemory}\n\n【自动总结】：${summary}` : `【自动总结】：${summary}`;
            const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}'); if (!allSettings[friendId]) allSettings[friendId] = {}; allSettings[friendId].manualMemory = newMemory; localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings));
        }
    } catch (e) { console.error(e); }
}

async function callAI(userMsg, isPersonaTrigger = false, targetFriendId = null) {
    const friendId = targetFriendId || currentChatFriendId; if (!friendId) return;
    const friend = chatList.find(f => f.id === friendId); const contact = contacts.find(c => c.id === (friend ? friend.contactId : null)); if (!contact) return;
    const isCurrentChat = (friendId === currentChatFriendId); const chatStatus = isCurrentChat ? document.getElementById('chatStatus') : null;
    if (chatStatus) { chatStatus.textContent = '正在输入...'; chatStatus.classList.add('typing-status'); }
    const configId = localStorage.getItem('current_api_config_id') || 'default'; const configs = await dbGetAll('api_configs'); const config = configs.find(c => c.id === configId);
    if (!config || !config.url || !config.key) {
        if (isCurrentChat) setTimeout(() => { if (chatStatus) { chatStatus.textContent = ''; chatStatus.classList.remove('typing-status'); } receiveAIMessage("（请配置 API）"); }, 1000); return;
    }
    const settings = getChatSettings(friendId); const manualMemory = settings.manualMemory || "";
    let systemPrompt = `你现在的身份是：${contact.netName || contact.name}。你就是用户设置好的这个真实联系人。性格：${contact.design || '自然亲切'}。${manualMemory ? '记忆：' + manualMemory : ''}`;
    if (settings.senseTime) { systemPrompt += `\n- 当前真实时间：${new Date().toLocaleString()}`; }
    const boundIds = settings.boundWorldBookIds || []; if (worldBooks && worldBooks.length > 0 && boundIds.length > 0) {
        let wbPrompt = ""; worldBooks.forEach(book => { if (boundIds.includes(book.id)) { const items = book.items.filter(i => i.enabled); if (items.length > 0) { wbPrompt += `\n【世界书：${book.name}】\n`; items.forEach(i => { wbPrompt += `- ${i.name}：${i.content}\n`; }); } } });
        if (wbPrompt) systemPrompt += `\n\n背景知识：${wbPrompt}`;
    }
    systemPrompt += `\n\n原则：角色一致，随性自然。可以发表情包 [表情: 表情名]，可以引用 (引用: 内容) 你的回复。可以发灰色卡片 [卡片: 内容]。`;
    if (isPersonaTrigger) systemPrompt += "\n\n主动找用户聊天。";
    if (stickerList.length > 0) systemPrompt += `\n\n【可用表情包】：${stickerList.map(s => s.name).join('、')}。`;
    const history = chatHistories[friendId] || []; const messages = [ { role: "system", content: systemPrompt } ];
    const aiHistory = history.filter(h => h.type !== 'system_withdrawn'); const sliceCount = (parseInt(settings.memCount) || 10) + 1;
    aiHistory.slice(-sliceCount).forEach(h => {
        let c = h.content; if (h.msgType === 'sticker') c = `[表情: ${h.stickerName || '未知'}]`;
        else if (h.msgType === 'image') { messages.push({ role: h.type === 'sent' ? 'user' : 'assistant', content: [ { type: "text", text: h.description || "用户发送了图片" }, { type: "image_url", image_url: { url: h.content } } ] }); return; }
        else if (h.msgType === 'photo' || h.msgType === 'gray_card') c = `[卡片: ${h.content}]`;
        else if (h.msgType === 'file') c = `[文件 \"${h.fileName}\"：${h.fileContent || ''}]`;
        else if (h.msgType === 'card') c = `[推荐了名片：${h.cardInfo.name || h.cardInfo.netName}]`;
        else if (h.isMergedForward && h.fullHistory) { c = `[聊天记录]：\n` + h.fullHistory.map(i => `${i.name}：${i.content}`).join('\n'); }
        else if (h.quote) c = `(引用: ${h.quote.content}) ${c}`;
        messages.push({ role: h.type === 'sent' ? 'user' : 'assistant', content: c });
    });
    if (isPersonaTrigger) messages.push({ role: "user", content: "（主动回复）" });
    try {
        let apiUrl = config.url.trim().replace(/\/$/, ''); if (!apiUrl.endsWith('/chat/completions')) apiUrl += '/chat/completions';
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` }, body: JSON.stringify({ model: config.model, messages: messages, temperature: parseFloat(config.temp) || 0.8, stream: true }) });
        if (!response.ok) throw new Error(response.statusText);
        const reader = response.body.getReader(); const decoder = new TextDecoder("utf-8"); let done = false, fullContent = "", buffer = "";
        while (!done) {
            const { value, done: readerDone } = await reader.read(); done = readerDone; buffer += decoder.decode(value, { stream: !done });
            const lines = buffer.split('\n'); buffer = lines.pop();
            for (const line of lines) {
                const tl = line.trim(); if (tl.startsWith('data: ') && tl !== 'data: [DONE]') {
                    try {
                        const json = JSON.parse(tl.substring(6)); const delta = json.choices[0].delta.content || "";
                        if (delta) { fullContent += delta; if (fullContent.includes('\n')) { const parts = fullContent.split('\n'); for (let i = 0; i < parts.length - 1; i++) { if (parts[i].trim()) await processAIMessagePart(parts[i].trim(), friendId, isCurrentChat); } fullContent = parts[parts.length - 1]; } }
                    } catch (e) {}
                }
            }
        }
        if (fullContent.trim()) await processAIMessagePart(fullContent.trim(), friendId, isCurrentChat);
        if (chatStatus && isCurrentChat) { chatStatus.textContent = ''; chatStatus.classList.remove('typing-status'); }
        if (settings.autoSum) {
            let rc = (settings.roundCount || 0) + 1; if (rc >= (parseInt(settings.sumRounds) || 5)) { await autoSummarizeChat(friendId, config); rc = 0; }
            const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}'); if (!allSettings[friendId]) allSettings[friendId] = {}; allSettings[friendId].roundCount = rc; localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings));
        }
    } catch (e) { if (chatStatus) { chatStatus.textContent = ''; chatStatus.classList.remove('typing-status'); } receiveAIMessage(e.message || "错误"); }
}

async function processAIMessagePart(content, friendId, isCurrentChat) {
    if (!content || !content.trim()) return; let quoteObj = null; const quoteMatch = content.match(/^\(引用:\s*(.*?)\)\s*(.*)/s);
    if (quoteMatch) { const qc = quoteMatch[1].trim(); if (qc) quoteObj = { content: qc }; content = quoteMatch[2].trim(); }
    const stickerRegex = /\[表情[:：]\s*(.*?)\]/g, photoRegex = /\[照片[:：]\s*(.*?)\]/g, cardRegex = /\[卡片[:：]\s*(.*?)\]/g;
    let combined = [], m;
    while ((m = stickerRegex.exec(content)) !== null) combined.push({ index: m.index, length: m[0].length, type: 'sticker', value: m[1].trim() });
    while ((m = photoRegex.exec(content)) !== null) combined.push({ index: m.index, length: m[0].length, type: 'photo', value: m[1].trim() });
    while ((m = cardRegex.exec(content)) !== null) combined.push({ index: m.index, length: m[0].length, type: 'gray_card', value: m[1].trim() });
    combined.sort((a, b) => a.index - b.index);
    let lastIndex = 0, finalParts = [];
    combined.forEach(match => {
        const prevText = content.substring(lastIndex, match.index).trim(); if (prevText) finalParts.push({ type: 'text', content: prevText });
        if (match.type === 'sticker') { const s = stickerList.find(st => st.name === match.value); if (s) finalParts.push({ type: 'sticker', content: s }); }
        else { finalParts.push({ type: match.type, content: match.value }); } lastIndex = match.index + match.length;
    });
    const remaining = content.substring(lastIndex).trim(); if (remaining) finalParts.push({ type: 'text', content: remaining });
    if (finalParts.length > 0) {
        for (let i = 0; i < finalParts.length; i++) {
            const part = finalParts[i]; const cq = (i === 0) ? quoteObj : null;
            if (part.type === 'text') receiveAIMessage(part.content, cq, null, friendId);
            else if (part.type === 'sticker') receiveAIMessage(null, cq, part.content, friendId);
            else if (part.type === 'photo') receiveAIMessage(null, cq, null, friendId, part.content);
            else if (part.type === 'gray_card') receiveAIMessage(null, cq, null, friendId, null, part.content);
            if (i < finalParts.length - 1) await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
        }
    } else if (quoteObj) receiveAIMessage("好的", quoteObj, null, friendId);
}

function openMergedChatDetail(msg) {
    const container = document.getElementById('mergedChatDetailContainer'); const titleEl = document.getElementById('mergedDetailTitle'); const contentEl = document.getElementById('mergedDetailContent');
    titleEl.textContent = msg.title || '聊天记录'; contentEl.innerHTML = '';
    (msg.fullHistory || []).forEach(h => {
        const item = document.createElement('div'); item.className = 'merged-msg-item'; const date = new Date(h.time || Date.now());
        const timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        let dc = h.isMergedForward ? `<div class="msg-bubble merged-forward-bubble" style="margin:5px 0; cursor:pointer;"><div class="merged-forward-title">${h.title || '聊天记录'}</div><div class="merged-forward-preview">${(h.fullHistory || []).slice(0, 2).map(p => p.name + '：' + (p.msgType === 'sticker' ? '[表情]' : p.content)).join('<br>')}</div><div class="merged-forward-line"></div><div class="merged-forward-footer">聊天记录</div></div>` : (h.msgType === 'sticker' ? `<img src="${h.content}" class="msg-sticker-img" style="margin-top:5px;">` : h.content);
        item.innerHTML = `<img src="${h.avatar || DEFAULT_AVATAR}" class="merged-msg-avatar"><div class="merged-msg-info"><div class="merged-msg-header"><div class="merged-msg-name">${h.name}</div><div class="merged-msg-time">${timeStr}</div></div><div class="merged-msg-text">${dc}</div></div>`;
        const nb = item.querySelector('.merged-forward-bubble'); if (nb) nb.onclick = (e) => { e.stopPropagation(); openMergedChatDetail(h); }; contentEl.appendChild(item);
    });
    container.style.display = 'flex'; updateTime(); saveUIState();
}
window.openMergedChatDetail = openMergedChatDetail;
function closeMergedChatDetail() { document.getElementById('mergedChatDetailContainer').style.display = 'none'; saveUIState(); }
window.closeMergedChatDetail = closeMergedChatDetail;

function receiveAIMessage(content, quote = null, sticker = null, targetFriendId = null, photo = null, gray_card = null) {
    const friendId = targetFriendId || currentChatFriendId; if (!friendId) return;
    if (!chatHistories[friendId]) chatHistories[friendId] = [];
    const newMessage = { type: 'received', content: content || photo || gray_card, time: new Date().getTime() };
    if (quote) newMessage.quote = quote;
    if (sticker) { newMessage.msgType = 'sticker'; newMessage.content = sticker.src; newMessage.stickerName = sticker.name; }
    if (photo) { newMessage.msgType = 'photo'; newMessage.content = photo; }
    if (gray_card) { newMessage.msgType = 'gray_card'; newMessage.content = gray_card; }
    chatHistories[friendId].push(newMessage); const friend = chatList.find(f => f.id === friendId);
    if (friend) { let dm = content || "[收到消息]"; if (sticker) dm = `[${sticker.name}]`; else if (photo || gray_card) dm = `[照片]`; friend.message = dm; friend.time = formatTime(new Date()); }
    if (friendId === currentChatFriendId) renderMessages();
    saveChatHistories(); saveChatListToStorage(); renderChatList();
}

async function generateAiMoment(friendId) {
    const friend = chatList.find(f => f.id === friendId); if (!friend) return;
    const contact = contacts.find(c => c.id === friend.contactId); if (!contact) return;
    const configId = localStorage.getItem('current_api_config_id') || 'default'; const configs = await dbGetAll('api_configs'); const config = configs.find(c => c.id === configId);
    if (!config || !config.url || !config.key) return;
    const history = chatHistories[friendId] || []; const recent = history.slice(-10).map(m => `${m.type === 'sent' ? '用户' : '你'}: ${m.content}`).join('\n');
    let systemPrompt = `你现在的身份是：${getFriendDisplayName(friend)}。朋友圈内容，50字以内，可以配图 [图片: 描述]。`;
    try {
        let apiUrl = config.url.trim().replace(/\/$/, ''); if (!apiUrl.endsWith('/chat/completions')) apiUrl += '/chat/completions';
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.key}` }, body: JSON.stringify({ model: config.model, messages: [{ role: "system", content: systemPrompt }], temperature: 0.8 }) });
        const data = await response.json(); if (data.choices && data.choices[0] && data.choices[0].message) {
            const res = data.choices[0].message.content.trim(); let content = res, images = [], imgRegex = /\[图片[:：]\s*(.*?)\]/g, match;
            while ((match = imgRegex.exec(res)) !== null) images.push({ type: 'text', content: match[1].trim() });
            content = res.replace(imgRegex, '').trim(); if (!content && images.length === 0) return;
            const nm = { id: Date.now(), friendId: friendId, nickname: getFriendDisplayName(friend), avatar: friend.avatar || DEFAULT_AVATAR, content: content, images: images, time: Date.now(), likes: [], comments: [], isMine: false };
            momentsData.unshift(nm); localStorage.setItem('mimi_moments', JSON.stringify(momentsData));
            if (document.getElementById('momentsContainer').style.display === 'flex') renderMoments();
        }
    } catch (e) { console.error(e); }
}

function startProactiveMsgCheck() {
    setInterval(async () => {
        const now = new Date().getTime(); const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
        for (const friendId in allSettings) {
            const settings = allSettings[friendId], friendIdNum = parseInt(friendId);
            if (settings.proactiveMsg) {
                const history = chatHistories[friendId] || []; let lastTime = history.length > 0 ? (history[history.length - 1].time || 0) : 0;
                if ((lastTime === 0 || now - lastTime > 5 * 60 * 1000) && Math.random() > 0.7) await callAI(null, true, friendIdNum);
            }
            if (settings.proactiveMoment && Math.random() > 0.95) await generateAiMoment(friendIdNum);
        }
    }, 60000);
}

function loadTopCategories() { const saved = localStorage.getItem('wechat_top_categories'); if (saved) { topCategories = JSON.parse(saved); } else { topCategories = [ { name: '默认', contactIds: [] } ]; } }
function saveTopCategories() { safeLocalStorageSet('wechat_top_categories', JSON.stringify(topCategories)); }

function renderTopTagBar() {
    const bar = document.getElementById('wechatTagBar'); bar.innerHTML = '';
    topCategories.forEach(cat => {
        const item = document.createElement('div'); item.className = `tag-item ${currentSelectedCategory === cat.name ? 'active' : ''}`;
        item.textContent = cat.name; item.onclick = () => { currentSelectedCategory = cat.name; renderTopTagBar(); renderChatList(); }; bar.appendChild(item);
    });
}

function openCategoryManagement() { showContainer('categoryManagementContainer'); document.body.classList.add('category-management-active'); showCategoryMenu(); renderCategoryManagementList(); saveUIState(); }
function showCategoryMenu() { document.getElementById('categoryNavTitle').textContent = '更多'; document.getElementById('categoryMenuArea').style.display = 'block'; document.getElementById('actualCategoryContent').style.display = 'none'; document.getElementById('relationshipBindingContent').style.display = 'none'; document.getElementById('categoryBackBtn').onclick = closeCategoryManagement; }
function showActualCategoryManagement() { document.getElementById('categoryNavTitle').textContent = '顶部分组设置'; document.getElementById('categoryMenuArea').style.display = 'none'; document.getElementById('actualCategoryContent').style.display = 'flex'; document.getElementById('relationshipBindingContent').style.display = 'none'; document.getElementById('categoryBackBtn').onclick = showCategoryMenu; renderCategoryManagementList(); }
function showRelationshipBinding() { document.getElementById('categoryNavTitle').textContent = '关系绑定'; document.getElementById('categoryMenuArea').style.display = 'none'; document.getElementById('actualCategoryContent').style.display = 'none'; document.getElementById('relationshipBindingContent').style.display = 'block'; document.getElementById('categoryBackBtn').onclick = showCategoryMenu; }
function closeCategoryManagement() { showContainer('wechatSettingsContainer'); document.body.classList.remove('category-management-active'); renderTopTagBar(); renderChatList(); saveUIState(); }

function renderCategoryManagementList() {
    const list = document.getElementById('categoryManagementList'), preview = document.getElementById('categoryPreviewTags'); list.innerHTML = ''; preview.innerHTML = '';
    topCategories.forEach(cat => {
        const tag = document.createElement('div'); tag.className = 'tag-item'; if (currentSelectedCategory === cat.name) tag.classList.add('active'); tag.textContent = cat.name; preview.appendChild(tag);
        const item = document.createElement('div'); item.className = 'category-mgmt-item'; let ab = `<span class="category-action-btn" onclick="renameCategory('${cat.name}')">重命名</span><span class="category-action-btn" onclick="manageCategoryMembers('${cat.name}')">管理成员</span>`;
        if (cat.name !== '默认' && cat.name !== topCategories[0].name) { ab += `<span class="category-action-btn delete" onclick="deleteCategory('${cat.name}')">删除</span>`; }
        item.innerHTML = `<div class="category-mgmt-info"><div class="category-mgmt-name">${cat.name}</div><div class="category-mgmt-count">${cat.contactIds ? cat.contactIds.length : 0} 位成员</div></div><div class="category-mgmt-actions">${ab}</div>`; list.appendChild(item);
    });
}

function renameCategory(oldName) {
    const newName = prompt('请输入新名称:', oldName);
    if (newName && newName.trim() && newName.trim() !== oldName) {
        if (topCategories.find(c => c.name === newName.trim())) { alert('名称已存在'); return; }
        const cat = topCategories.find(c => c.name === oldName); if (cat) { cat.name = newName.trim(); if (currentSelectedCategory === oldName) currentSelectedCategory = cat.name; saveTopCategories(); renderCategoryManagementList(); renderTopTagBar(); }
    }
}

function addNewCategory() {
    const name = prompt('请输入新分组名称:');
    if (name && name.trim()) { if (topCategories.find(c => c.name === name.trim())) { alert('已存在'); return; } topCategories.push({ name: name.trim(), contactIds: [] }); saveTopCategories(); renderCategoryManagementList(); }
}

function deleteCategory(name) { if (confirm(`确定删除 "${name}" 吗？`)) { topCategories = topCategories.filter(c => c.name !== name); if (currentSelectedCategory === name) currentSelectedCategory = '默认'; saveTopCategories(); renderCategoryManagementList(); } }

function manageCategoryMembers(categoryName) {
    currentEditingCategoryName = categoryName; const category = topCategories.find(c => c.name === categoryName); selectedContactIdsForCategory = new Set(category.contactIds);
    document.getElementById('selectionModalTitle').textContent = `为 "${categoryName}" 选择成员`; renderSelectionContactsList(); document.getElementById('contactSelectionModal').classList.add('active');
}

function renderSelectionContactsList() {
    const container = document.getElementById('selectionContactsList'); container.innerHTML = ''; if (contacts.length === 0) { container.innerHTML = '<div class="empty-state">暂无联系人</div>'; return; }
    contacts.forEach(contact => {
        const isChecked = selectedContactIdsForCategory.has(contact.id); const item = document.createElement('div'); item.className = 'selection-contact-item';
        item.onclick = () => { if (selectedContactIdsForCategory.has(contact.id)) selectedContactIdsForCategory.delete(contact.id); else selectedContactIdsForCategory.add(contact.id); renderSelectionContactsList(); };
        item.innerHTML = `<div class="selection-checkbox ${isChecked ? 'checked' : ''}"></div><img src="${contact.avatar || ''}" class="wechat-contact-avatar" style="width:32px; height:32px;"><div class="wechat-contact-name">${contact.name}</div>`; container.appendChild(item);
    });
}

function closeSelectionModal() { document.getElementById('contactSelectionModal').classList.remove('active'); }
function confirmContactSelection() { const cat = topCategories.find(c => c.name === currentEditingCategoryName); if (cat) { cat.contactIds = Array.from(selectedContactIdsForCategory); saveTopCategories(); renderCategoryManagementList(); } closeSelectionModal(); }

async function loadFavoritesFromStorage() {
    try { const data = await dbGet('settings', 'wechat_favorites_data'); if (data) { favoritesData = data.value; } else { const saved = localStorage.getItem('wechat_favorites_data'); if (saved) { favoritesData = JSON.parse(saved); await saveFavoritesToStorage(); } } }
    catch (e) { const saved = localStorage.getItem('wechat_favorites_data'); if (saved) favoritesData = JSON.parse(saved); }
}

async function saveFavoritesToStorage() { try { await dbPut('settings', { key: 'wechat_favorites_data', value: favoritesData }); } catch (e) { safeLocalStorageSet('wechat_favorites_data', JSON.stringify(favoritesData)); } }

function openWechatFavorites() { showContainer('wechatFavoritesContainer'); favSelectMode = false; selectedFavIds.clear(); updateFavPageUI(); renderFavoritesList(); updateTime(); saveUIState(); }
function closeWechatFavorites() { document.getElementById('wechatFavoritesContainer').style.display = 'none'; saveUIState(); }

function renderFavoritesList(keyword = '') {
    const container = document.getElementById('favoritesList'); let filtered = [...favoritesData]; filtered.sort((a, b) => { if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1; return b.id - a.id; });
    if (keyword) filtered = filtered.filter(item => item.content.includes(keyword));
    if (filtered.length === 0) { container.innerHTML = '<div class="empty-state">暂无收藏</div>'; return; }
    let html = ''; filtered.forEach(item => {
        const isSelected = selectedFavIds.has(item.id);
        if (item.isMergedForward) {
            const previewHtml = (item.fullHistory || []).slice(0, 2).map(h => `<div class="merged-forward-preview-item">${h.name}：${h.msgType === 'sticker' ? '[表情]' : h.content}</div>`).join('');
            html += `<div class="favorite-item ${item.isPinned ? 'pinned' : ''} ${favSelectMode ? 'selecting' : ''}" data-id="${item.id}" onclick="handleFavClick(${item.id})">
                <div class="favorite-checkbox ${isSelected ? 'checked' : ''}"></div>
                <div class="merged-forward-bubble" style="width:100%; border:none!important; box-shadow:none!important; padding:0!important; pointer-events:none; background:transparent!important;">
                    <div class="merged-forward-title">${item.title || '聊天记录'}</div><div class="merged-forward-preview">${previewHtml}${(item.fullHistory || []).length > 2 ? '...' : ''}</div><div class="merged-forward-line"></div><div class="merged-forward-footer">聊天记录</div>
                </div><div class="favorite-date">${item.date}</div></div>`;
        } else {
            html += `<div class="favorite-item ${item.isPinned ? 'pinned' : ''} ${favSelectMode ? 'selecting' : ''}" data-id="${item.id}" onclick="handleFavClick(${item.id})">
                <div class="favorite-checkbox ${isSelected ? 'checked' : ''}"></div><div class="favorite-content">${item.content}</div><div class="favorite-date">${item.date}</div></div>`;
        }
    }); container.innerHTML = html; setupFavLongPress();
}

function setupFavLongPress() {
    document.querySelectorAll('.favorite-item').forEach(item => {
        item.addEventListener('touchstart', (e) => { if (favSelectMode) return; favLongPressTimer = setTimeout(() => showFavContextMenu(item, e.touches[0]), 600); }, { passive: true });
        item.addEventListener('touchend', () => clearTimeout(favLongPressTimer)); item.addEventListener('touchmove', () => clearTimeout(favLongPressTimer));
    });
}

function showFavContextMenu(item, touch) {
    const menu = document.getElementById('favContextMenu'); currentLongPressedFav = item; menu.style.display = 'flex';
    const rect = item.getBoundingClientRect(); let top = rect.top + (rect.height / 2) - (menu.offsetHeight / 2), left = rect.left + (rect.width / 2) - (menu.offsetWidth / 2);
    if (top < 60) top = 60; if (top + menu.offsetHeight > window.innerHeight - 60) top = window.innerHeight - menu.offsetHeight - 60; if (left < 10) left = 10; if (left + menu.offsetWidth > window.innerWidth - 10) left = window.innerWidth - menu.offsetWidth - 10;
    menu.style.top = top + 'px'; menu.style.left = left + 'px';
    const id = parseInt(item.getAttribute('data-id')), fav = favoritesData.find(f => f.id === id); const si = menu.querySelector('[onclick*="置顶"]');
    if (si && fav) si.textContent = fav.isPinned ? '取消置顶' : '置顶'; if (navigator.vibrate) navigator.vibrate(50);
}

function handleFavAction(action) {
    const menu = document.getElementById('favContextMenu'); menu.style.display = 'none'; if (!currentLongPressedFav) return;
    const id = parseInt(currentLongPressedFav.getAttribute('data-id')), fav = favoritesData.find(f => f.id === id);
    switch(action) {
        case '删除': if (confirm('确定删除吗？')) { favoritesData = favoritesData.filter(f => f.id !== id); saveFavoritesToStorage(); renderFavoritesList(); } break;
        case '置顶': if (fav) { fav.isPinned = !fav.isPinned; saveFavoritesToStorage(); renderFavoritesList(); } break;
        case '多选': toggleFavSelectMode(); break;
        case '转发': messageToForward = fav.isMergedForward ? fav : fav.content; document.getElementById('forwardModal').classList.add('active'); renderForwardContacts(); break;
    }
}

function handleFavClick(id) {
    if (favSelectMode) { if (selectedFavIds.has(id)) selectedFavIds.delete(id); else selectedFavIds.add(id); renderFavoritesList(); updateFavPageUI(); }
    else { const fav = favoritesData.find(f => f.id === id); if (!fav) return; if (currentChatFriendId) { if (confirm('是否发送该收藏？')) { sendFavoriteMessage(fav); closeWechatFavorites(); return; } } if (fav.isMergedForward) openMergedChatDetail(fav); }
}

function sendFavoriteMessage(fav) {
    if (!currentChatFriendId) return; const history = chatHistories[currentChatFriendId] || [];
    let nm = fav.isMergedForward ? { type: 'sent', isMergedForward: true, title: fav.title, fullHistory: JSON.parse(JSON.stringify(fav.fullHistory)), content: '[聊天记录]', time: new Date().getTime() } : { type: 'sent', content: fav.content, time: new Date().getTime() };
    history.push(nm); chatHistories[currentChatFriendId] = history;
    const friend = chatList.find(f => f.id === currentChatFriendId); if (friend) { friend.message = fav.isMergedForward ? '[聊天记录]' : fav.content; friend.time = formatTime(new Date()); }
    renderMessages(); saveChatHistories(); saveChatListToStorage(); renderChatList();
}

function toggleFavSelectMode() { favSelectMode = !favSelectMode; selectedFavIds.clear(); updateFavPageUI(); renderFavoritesList(); }
function updateFavPageUI() {
    const cb = document.getElementById('favCancelSelectBtn'), db = document.getElementById('favDeleteBtn');
    cb.style.display = favSelectMode ? 'block' : 'none'; db.style.display = favSelectMode ? 'block' : 'none'; db.disabled = selectedFavIds.size === 0; db.style.opacity = selectedFavIds.size === 0 ? '0.5' : '1';
}

function handleFavBatchDelete() { if (selectedFavIds.size === 0) return; if (confirm(`确定删除选中的 ${selectedFavIds.size} 条吗？`)) { favoritesData = favoritesData.filter(f => !selectedFavIds.has(f.id)); saveFavoritesToStorage(); toggleFavSelectMode(); } }
function searchFavorites() { const keyword = document.getElementById('favoritesSearchInput').value.trim(); renderFavoritesList(keyword); }

async function loadStickers() {
    try { const data = await dbGet('settings', 'wechat_stickers'); if (data) { stickerList = data.value; } else { const saved = localStorage.getItem('wechat_stickers'); if (saved) { stickerList = JSON.parse(saved); await saveStickers(); } } }
    catch (e) { const saved = localStorage.getItem('wechat_stickers'); if (saved) stickerList = JSON.parse(saved); }
}

async function saveStickers() { try { await dbPut('settings', { key: 'wechat_stickers', value: stickerList }); } catch (e) { localStorage.setItem('wechat_stickers', JSON.stringify(stickerList)); } }

function openStickerLibrary() { showContainer('stickerLibraryContainer'); loadStickers(); renderStickerGrid(); updateTime(); saveUIState(); }
function closeStickerLibrary() { document.getElementById('stickerLibraryContainer').style.display = 'none'; saveUIState(); }
function openStickerManagement() { document.getElementById('stickerManagementContainer').style.display = 'flex'; updateTime(); saveUIState(); }
function closeStickerManagement() { document.getElementById('stickerManagementContainer').style.display = 'none'; saveUIState(); }

function triggerStickerImport() { document.getElementById('stickerFileImportInput').click(); }

async function handleStickerFileImport(event) {
    const file = event.target.files[0]; if (!file) return; const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'json') { const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target.result); if (Array.isArray(data)) { stickerList = [...stickerList, ...data]; saveStickers(); renderStickerGrid(); alert('导入成功'); } } catch (err) { alert(err.message); } }; reader.readAsText(file); }
    else if (ext === 'txt') { const reader = new FileReader(); reader.onload = (e) => processStickerTextContent(e.target.result); reader.readAsText(file); }
    else if (ext === 'docx') {
        const reader = new FileReader(); reader.onload = (e) => { const ab = e.target.result; if (window.mammoth) { window.mammoth.extractRawText({arrayBuffer: ab}).then(r => processStickerTextContent(r.value)).catch(err => alert(err.message)); } else { alert('加载中...'); } }; reader.readAsArrayBuffer(file);
    } else { alert('不支持'); } event.target.value = '';
}

function processStickerTextContent(text) {
    const regex = /([^：:\n\r]+)[：:](https?:\/\/[^ \n\r]+?\.(?:jpg|png|gif))/gi; let match, added = 0;
    while ((match = regex.exec(text)) !== null) { const name = match[1].trim(), url = match[2].trim(); if (name && url) { stickerList.push({ name: name, src: url }); added++; } }
    if (added > 0) { saveStickers(); renderStickerGrid(); alert(`导入 ${added} 个`); } else { alert('未识别'); }
}

function exportStickers() { if (stickerList.length === 0) { alert('为空'); return; } downloadData(stickerList, `Emoji.json`); }

function renderStickerGrid() {
    const container = document.getElementById('stickerGrid'), kw = document.getElementById('stickerSearchInput').value.trim().toLowerCase();
    let filtered = kw ? stickerList.filter(s => s.name.toLowerCase().includes(kw)) : stickerList;
    container.innerHTML = ''; if (!kw) { const ab = document.createElement('div'); ab.className = 'sticker-add-btn'; ab.onclick = openStickerUploadModal; ab.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`; container.appendChild(ab); }
    filtered.forEach((sticker, index) => {
        const item = document.createElement('div'); item.className = 'sticker-item';
        let pt; item.addEventListener('touchstart', (e) => { pt = setTimeout(() => showStickerOptions(sticker, index), 600); }, { passive: true });
        item.addEventListener('touchend', () => clearTimeout(pt)); item.addEventListener('touchmove', () => clearTimeout(pt));
        item.innerHTML = `<img src="${sticker.src}" alt="${sticker.name}"><div class="sticker-name-overlay">${sticker.name}</div>`; container.appendChild(item);
    });
}

function showStickerOptions(sticker, index) { if (navigator.vibrate) navigator.vibrate(50); currentEditingStickerIndex = index; document.getElementById('stickerOptionsModal').classList.add('active'); }
function closeStickerOptionsModal() { document.getElementById('stickerOptionsModal').classList.remove('active'); }
function startModifyStickerName() { const s = stickerList[currentEditingStickerIndex]; if (s) { const nn = prompt('新名字：', s.name); if (nn && nn.trim()) { s.name = nn.trim(); saveStickers(); renderStickerGrid(); } } closeStickerOptionsModal(); }
function startDeleteSticker() { if (confirm('确定删除？')) { stickerList.splice(currentEditingStickerIndex, 1); saveStickers(); renderStickerGrid(); } closeStickerOptionsModal(); }
function openStickerUploadModal() { document.getElementById('stickerUploadModal').classList.add('active'); switchStickerUploadTab('single'); }
function closeStickerUploadModal() { document.getElementById('stickerUploadModal').classList.remove('active'); hideStickerUrlInput('single'); hideStickerUrlInput('batch'); }
function switchStickerUploadTab(mode) { currentUploadMode = mode; document.getElementById('tab-single').classList.toggle('active', mode === 'single'); document.getElementById('tab-batch').classList.toggle('active', mode === 'batch'); document.getElementById('stickerUploadSingle').style.display = mode === 'single' ? 'block' : 'none'; document.getElementById('stickerUploadBatch').style.display = mode === 'batch' ? 'block' : 'none'; }
function importStickerFromAlbum(mode) { if (mode === 'single') document.getElementById('stickerFileInputSingle').click(); else document.getElementById('stickerFileInputBatch').click(); }

function handleStickerFileSelect(event, mode) {
    const files = event.target.files; if (!files || files.length === 0) return;
    if (mode === 'single') {
        const name = prompt('名字：'); if (!name) return;
        const reader = new FileReader(); reader.onload = (e) => { stickerList.push({ name: name.trim(), src: e.target.result }); saveStickers(); renderStickerGrid(); closeStickerUploadModal(); }; reader.readAsDataURL(files[0]);
    } else {
        const ni = prompt('名字（空格隔开）：'); if (!ni) return; const names = ni.trim().split(/\s+/);
        let pr = 0; for (let i = 0; i < files.length; i++) { const reader = new FileReader(); reader.onload = (e) => { stickerList.push({ name: names[i] || `表情_${i}`, src: e.target.result }); pr++; if (pr === files.length) { saveStickers(); renderStickerGrid(); closeStickerUploadModal(); } }; reader.readAsDataURL(files[i]); }
    } event.target.value = '';
}

function showStickerUrlInput(mode) { document.getElementById(`stickerUrlArea-${mode}`).style.display = 'block'; }
function hideStickerUrlInput(mode) { document.getElementById(`stickerUrlArea-${mode}`).style.display = 'none'; document.getElementById(`stickerUrl-${mode}`).value = ''; }
function confirmStickerUrl(mode) {
    const input = document.getElementById(`stickerUrl-${mode}`), val = input.value.trim(); if (!val) return;
    if (mode === 'single') { const name = prompt('名字：'); if (!name) return; stickerList.push({ name: name.trim(), src: val }); }
    else { const lines = val.split(/[\s\n]+/); lines.forEach(line => { const parts = line.split(/[：:]/); if (parts.length >= 2) { const name = parts[0].trim(), url = line.substring(line.indexOf(parts[1])).trim(); if (name && url) stickerList.push({ name, src: url }); } }); }
    saveStickers(); renderStickerGrid(); closeStickerUploadModal();
}

function handleBatchStickerSelect(event) {
    const files = event.target.files; if (!files || files.length === 0) return;
    pendingStickerFiles = Array.from(files); const input = document.getElementById('batchStickerNameInput'); input.value = '';
    closeStickerUploadModal(); document.getElementById('batchStickerNameModal').classList.add('active');
    input.onkeydown = (e) => { if (e.key === 'Enter') e.stopPropagation(); }; setTimeout(() => input.focus(), 100);
}
function closeBatchNameModal() { document.getElementById('batchStickerNameModal').classList.remove('active'); pendingStickerFiles = []; }
function confirmBatchNames() {
    const ni = document.getElementById('batchStickerNameInput').value.trim(); if (!ni) { alert('名字'); return; } const names = ni.split(/[\s\n]+/);
    let pr = 0; pendingStickerFiles.forEach((file, i) => { const reader = new FileReader(); reader.onload = (e) => { stickerList.push({ name: names[i] || `表情_${i}`, src: e.target.result }); pr++; if (pr === pendingStickerFiles.length) { saveStickers(); renderStickerGrid(); closeBatchNameModal(); closeStickerUploadModal(); } }; reader.readAsDataURL(file); });
}

function saveWorldBooks() { localStorage.setItem('mimi_world_books', JSON.stringify(worldBooks)); }
function openWorldBook() { showContainer('worldBookContainer'); renderWorldBookList(); updateTime(); saveUIState(); }
function closeWorldBook() { showContainer('phone-container'); saveUIState(); }
function showAddWorldBookModal() { document.getElementById('addWorldBookModal').classList.add('active'); document.getElementById('newWorldBookName').value = ''; document.getElementById('newWorldBookName').focus(); }
function closeAddWorldBookModal() { document.getElementById('addWorldBookModal').classList.remove('active'); }
function confirmAddWorldBook() { const name = document.getElementById('newWorldBookName').value.trim(); if (!name) return; const nb = { id: Date.now(), name, description: '', items: [] }; worldBooks.push(nb); saveWorldBooks(); closeAddWorldBookModal(); openWorldBookEdit(nb.id); }

function showDeleteWorldBookModal(id) {
    bookIdToDelete = id; document.getElementById('deleteWorldBookConfirmModal').classList.add('active');
    document.getElementById('confirmDeleteWorldBookBtn').onclick = () => { worldBooks = worldBooks.filter(b => b.id !== bookIdToDelete); saveWorldBooks(); renderWorldBookList(); closeDeleteWorldBookConfirmModal(); };
}
function closeDeleteWorldBookConfirmModal() { document.getElementById('deleteWorldBookConfirmModal').classList.remove('active'); bookIdToDelete = null; }
function showDeleteBookItemModal(id) {
    itemIdToDelete = id; document.getElementById('deleteBookItemConfirmModal').classList.add('active');
    document.getElementById('confirmDeleteBookItemBtn').onclick = () => { const b = worldBooks.find(book => book.id === currentEditingBookId); if (b) { b.items = b.items.filter(i => i.id !== itemIdToDelete); saveWorldBooks(); renderBookItemsList(); } closeDeleteBookItemConfirmModal(); };
}
function closeDeleteBookItemConfirmModal() { document.getElementById('deleteBookItemConfirmModal').classList.remove('active'); itemIdToDelete = null; }

function renderWorldBookList() {
    const list = document.getElementById('worldBookList'), empty = document.getElementById('worldBookEmptyState'); list.innerHTML = '';
    if (worldBooks.length === 0) { list.style.display = 'none'; empty.style.display = 'flex'; return; }
    list.style.display = 'grid'; empty.style.display = 'none';
    worldBooks.forEach(book => {
        const card = document.createElement('div'); card.className = 'world-book-card';
        let lpt, isLp = false;
        card.addEventListener('touchstart', (e) => { isLp = false; lpt = setTimeout(() => { isLp = true; showDeleteWorldBookModal(book.id); }, 800); }, { passive: true });
        card.addEventListener('touchend', () => clearTimeout(lpt)); card.addEventListener('touchmove', () => clearTimeout(lpt));
        card.onclick = () => { if (!isLp) openWorldBookEdit(book.id); };
        card.innerHTML = `<div class="world-book-name">${book.name}</div><div class="world-book-desc">${book.description || '暂无简介'}</div>`; list.appendChild(card);
    });
}

function openWorldBookEdit(id) {
    currentEditingBookId = id; const book = worldBooks.find(b => b.id === id); if (!book) return;
    document.getElementById('editBookTitle').textContent = book.name; document.getElementById('editBookDesc').value = book.description;
    renderBookItemsList(); document.getElementById('worldBookContainer').style.display = 'none'; document.getElementById('worldBookEditPage').style.display = 'flex'; updateTime();
}
function closeWorldBookEdit() { document.getElementById('worldBookEditPage').style.display = 'none'; openWorldBook(); }
function editWorldBookName() {
    const book = worldBooks.find(b => b.id === currentEditingBookId); if (!book) return;
    const nn = prompt('修改名称', book.name); if (nn && nn.trim()) { book.name = nn.trim(); document.getElementById('editBookTitle').textContent = book.name; saveWorldBooks(); renderWorldBookList(); }
}
function updateBookDesc() { const book = worldBooks.find(b => b.id === currentEditingBookId); if (book) { book.description = document.getElementById('editBookDesc').value; saveWorldBooks(); } }
function showAddBookItemModal() { document.getElementById('addBookItemModal').classList.add('active'); document.getElementById('newBookItemName').value = ''; document.getElementById('newBookItemName').focus(); }
function closeAddBookItemModal() { document.getElementById('addBookItemModal').classList.remove('active'); }
function confirmAddBookItem() {
    const name = document.getElementById('newBookItemName').value.trim(); if (!name) return; const book = worldBooks.find(b => b.id === currentEditingBookId); if (!book) return;
    const ni = { id: Date.now(), name, remark: '', content: '', enabled: true }; book.items.push(ni); saveWorldBooks(); closeAddBookItemModal(); openBookItemEdit(ni.id);
}

function renderBookItemsList() {
    const list = document.getElementById('bookItemsList'), book = worldBooks.find(b => b.id === currentEditingBookId); if (!book) return;
    list.innerHTML = ''; book.items.forEach(item => {
        const row = document.createElement('div'); row.className = 'book-item-row';
        let lpt, isLp = false;
        row.addEventListener('touchstart', (e) => { isLp = false; lpt = setTimeout(() => { isLp = true; showDeleteBookItemModal(item.id); }, 800); }, { passive: true });
        row.addEventListener('touchend', () => clearTimeout(lpt)); row.addEventListener('touchmove', () => clearTimeout(lpt));
        row.onclick = () => { if (!isLp) openBookItemEdit(item.id); };
        row.innerHTML = `<div class="book-item-content-left"><div class="book-item-name">${item.name}</div><div class="book-item-remark">${item.remark || ''}</div></div><div onclick="event.stopPropagation()"><label class="switch"><input type="checkbox" ${item.enabled ? 'checked' : ''} onchange="toggleItemRead(${item.id}, this.checked)"><span class="slider"></span></label></div>`; list.appendChild(row);
    });
}

function toggleItemRead(itemId, enabled) { const book = worldBooks.find(b => b.id === currentEditingBookId); if (book) { const item = book.items.find(i => i.id === itemId); if (item) { item.enabled = enabled; saveWorldBooks(); renderBookItemsList(); } } }

function openBookItemEdit(itemId) {
    const book = worldBooks.find(b => b.id === currentEditingBookId); if (!book) return; const item = book.items.find(i => i.id === itemId); if (!item) return;
    currentEditingItemId = itemId; document.getElementById('editItemTitle').textContent = item.name; document.getElementById('editItemRemark').value = item.remark; document.getElementById('editItemContent').value = item.content;
    document.getElementById('worldBookEditPage').style.display = 'none'; document.getElementById('bookItemEditPage').style.display = 'flex'; updateTime();
}
function closeBookItemEdit() { document.getElementById('bookItemEditPage').style.display = 'none'; document.getElementById('worldBookEditPage').style.display = 'flex'; renderBookItemsList(); }
function updateItemDetails() { const b = worldBooks.find(book => book.id === currentEditingBookId); if (b) { const i = b.items.find(item => item.id === currentEditingItemId); if (i) { i.remark = document.getElementById('editItemRemark').value; i.content = document.getElementById('editItemContent').value; saveWorldBooks(); } } }

function openWorldBookBindingModal() { if (!currentChatFriendId) return; const settings = getChatSettings(currentChatFriendId); tempBoundWorldBookIds = [...(settings.boundWorldBookIds || [])]; document.getElementById('worldBookBindingModal').classList.add('active'); renderWorldBookBindingList(); }
function closeWorldBookBindingModal() { document.getElementById('worldBookBindingModal').classList.remove('active'); tempBoundWorldBookIds = []; }
function renderWorldBookBindingList() {
    const container = document.getElementById('worldBookBindingList'); container.innerHTML = ''; if (worldBooks.length === 0) { container.innerHTML = '<div class="empty-state">暂无世界书</div>'; return; }
    worldBooks.forEach(book => {
        const isChecked = tempBoundWorldBookIds.includes(book.id); const item = document.createElement('div'); item.className = 'selection-contact-item'; item.onclick = () => toggleWorldBookBinding(book.id);
        item.innerHTML = `<div class="selection-checkbox ${isChecked ? 'checked' : ''}"></div><div style="flex:1; margin-left:10px;"><div style="font-size:15px; color:#333; font-weight:500;">${book.name}</div><div style="font-size:12px; color:#999;">${book.items.length} 个条目</div></div>`; container.appendChild(item);
    });
}
function toggleWorldBookBinding(id) { const idx = tempBoundWorldBookIds.indexOf(id); if (idx > -1) tempBoundWorldBookIds.splice(idx, 1); else tempBoundWorldBookIds.push(id); renderWorldBookBindingList(); }
function confirmWorldBookBinding() {
    if (!currentChatFriendId) return; const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}'); if (!allSettings[currentChatFriendId]) allSettings[currentChatFriendId] = {};
    allSettings[currentChatFriendId].boundWorldBookIds = tempBoundWorldBookIds; localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings));
    const boundCountEl = document.getElementById('chatInfoBoundCount'); if (boundCountEl) boundCountEl.textContent = tempBoundWorldBookIds.length > 0 ? `已绑定 ${tempBoundWorldBookIds.length} 本` : '未绑定';
    closeWorldBookBindingModal(); alert('绑定成功');
}

// Initialization of WeChat
async function initWechat() {
    if (localStorage.getItem('wechat_app_uninstalled') === 'true') {
        const wechatApp = document.getElementById('app1'); if (wechatApp && wechatApp.parentElement) wechatApp.parentElement.style.display = 'none';
    }
    await loadContactsFromStorage();
    loadCustomCategories();
    await loadChatListFromStorage();
    await loadGroupListFromStorage();
    await loadChatHistories();
    loadWechatUserInfo();
    loadRealNameInfo();
    loadTopCategories();
    await loadFavoritesFromStorage();
    await loadStickers();
    await loadFavoriteStickers();
    renderTopTagBar();
    startProactiveMsgCheck();
    initMimiId();
    setupLongPress();
    loadMobileNet();
}
