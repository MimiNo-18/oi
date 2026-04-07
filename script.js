const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ccc'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Ccircle cx='12' cy='10' r='3' fill='%23fff'/%3E%3Cpath d='M12 14c-4 0-6 2-6 2v1h12v-1s-2-2-6-2z' fill='%23fff'/%3E%3C/svg%3E";
        const DEFAULT_LANDSCAPE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23eee'%3E%3Crect width='24' height='24'/%3E%3Cpath d='M4 18l4-4 3 3 4-4 5 5v1H4v-1z' fill='%23ccc'/%3E%3C/svg%3E";

        let currentElement = null;
        let currentImageId = null;
        let quotedMessage = null;
        let messageToForward = null;
        let isMultiSelectMode = false;
        let selectedMsgIndexes = new Set();
        let currentForwardMode = 'single'; // 'single', 'multi-one-by-one', 'multi-combine'

        // Mimi号逻辑
        function initMimiId() {
            let mimiId = localStorage.getItem('mimi_unique_id');
            if (!mimiId) {
                // 生成唯一的Mimi号：Mimi_ + 随机字符串
                mimiId = 'Mimi_' + Math.random().toString(36).substr(2, 9).toUpperCase();
                localStorage.setItem('mimi_unique_id', mimiId);
            }
            // 更新UI上的显示
            const idDisplay = document.getElementById('info-mimi-id');
            if (idDisplay) idDisplay.textContent = mimiId;
            
            const meIdDisplay = document.getElementById('wechatMeID');
            if (meIdDisplay) meIdDisplay.textContent = 'Mimi号：' + mimiId;

            // 朋友圈背景持久化
            const savedBg = localStorage.getItem('mimi_moments_bg');
            if (savedBg) {
                const bgImg = document.getElementById('momentsBg');
                if (bgImg) bgImg.src = savedBg;
            }
        }

        // 朋友圈逻辑
        let momentsData = JSON.parse(localStorage.getItem('mimi_moments') || '[]');
        let currentMomentImage = '';
        let currentMomentsFriendId = null;

        function openMoments(friendId = null) {
            // 如果是从联系人详情页进入，立即隐藏详情页，不留痕迹
            const detailPage = document.getElementById('contactDetailPage');
            if (detailPage && detailPage.style.display === 'flex') {
                detailPage.style.display = 'none';
                document.body.classList.remove('contact-detail-active');
            }

            // 修复白屏问题：进入朋友圈前隐藏聊天页和聊天信息页，防止它们的高层级遮挡朋友圈 (Issue 1)
            const chatPage = document.getElementById('chatPageContainer');
            if (chatPage) chatPage.style.display = 'none';
            const chatInfo = document.getElementById('chatInfoContainer');
            if (chatInfo) chatInfo.style.display = 'none';

            // 确保微信容器是显示的，因为朋友圈容器是它的子元素
            const wechatContainer = document.getElementById('wechatContainer');
            if (wechatContainer) {
                wechatContainer.style.display = 'flex';
            }

            // 统一 ID 类型为数字，防止比较失败
            currentMomentsFriendId = friendId ? Number(friendId) : null;
            const container = document.getElementById('momentsContainer');
            container.style.display = 'flex';
            document.body.classList.add('moments-active');
            
            // 重置朋友圈状态
            document.body.classList.remove('moments-scrolled');
            const scrollArea = document.getElementById('momentsScrollArea');
            if (scrollArea) scrollArea.scrollTop = 0;

            // 点击空白区域隐藏弹窗和评论框
            container.onclick = (e) => {
                // 需求4：点击评论之后点击空白处关闭输入框
                // 只要不是点击评论输入框、操作弹窗、或者触发弹窗的按钮，都关闭
                if (!e.target.closest('#momentCommentInputBar') && 
                    !e.target.closest('#momentActionPopup') && 
                    !e.target.closest('.moment-actions-btn')) {
                    hideMomentPopups();
                }
            };

            // 加载背景图
            const bgImg = document.getElementById('momentsBg');
            if (bgImg) {
                const bgKey = currentMomentsFriendId ? `mimi_moments_bg_AI_${currentMomentsFriendId}` : 'mimi_moments_bg';
                const savedBg = localStorage.getItem(bgKey);
                bgImg.src = savedBg || DEFAULT_LANDSCAPE;
                // 需求1：更换朋友圈背景图
                bgImg.onclick = (e) => {
                    e.stopPropagation();
                    changeMomentsBg();
                };
                bgImg.style.cursor = 'pointer';
            }
            
            // 初始化个人信息
            const avatarImg = document.getElementById('momentsAvatar');
            const nameEl = document.getElementById('momentsUsername');
            const sigEl = document.getElementById('momentsSignature');
            const postBtn = document.querySelector('.moments-header-right');

            if (currentMomentsFriendId) {
                // AI 朋友圈模式
                const friend = chatList.find(f => f.id === currentMomentsFriendId);
                const contact = contacts.find(c => c.id === (friend ? friend.contactId : null));
                
                if (avatarImg) avatarImg.src = (friend ? friend.avatar : '') || (contact ? contact.avatar : '') || DEFAULT_AVATAR;
                if (nameEl) {
                    // 名字显示逻辑：备注 > 网名 > 原始名
                    const remark = friend ? friend.remark : '';
                    const netName = contact ? contact.netName : '';
                    nameEl.textContent = remark || netName || (friend ? friend.name : '未知');
                }
                if (sigEl) sigEl.textContent = (contact ? contact.signature : '') || '';
                
                // 需求3：联系人的朋友圈页面上方显示的才是刷新图标，点击可以生成内容
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
                // 自己的朋友圈模式
                const me = wechatUserInfo;
                if (avatarImg) avatarImg.src = me.avatar || DEFAULT_AVATAR;
                if (nameEl) nameEl.textContent = me.nickname || '未设置网名';
                if (sigEl) sigEl.textContent = me.signature || '个性签名...';
                
                // 需求2：朋友圈页面的上面是照相机图标点击可以编辑内容发布朋友圈
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
            
            // 重置头部样式，确保颜色为黑色且背景透明
            const header = document.getElementById('momentsHeader');
            if (header) {
                header.classList.remove('scrolled');
                header.style.backgroundColor = 'transparent';
                header.style.color = '#000';
            }
            
            renderMoments();
            updateTime();
            saveUIState();
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
            // 滑动时关闭弹窗
            hideMomentPopups();
        }

        async function refreshAiMoments() {
            if (currentMomentsFriendId) {
                // 如果是查看特定好友的AI朋友圈，立刻生成该好友的朋友圈内容
                await generateAiMoment(currentMomentsFriendId);
            } else {
                // 如果是自己的朋友圈，随机挑选一个开启了主动发朋友圈的好友生成动态
                const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
                const availableFriends = chatList.filter(f => allSettings[f.id] && allSettings[f.id].proactiveMoment);
                if (availableFriends.length > 0) {
                    const randomFriend = availableFriends[Math.floor(Math.random() * availableFriends.length)];
                    await generateAiMoment(randomFriend.id);
                } else if (chatList.length > 0) {
                    // 兜底：随机挑选任意一个好友生成
                    const randomFriend = chatList[Math.floor(Math.random() * chatList.length)];
                    await generateAiMoment(randomFriend.id);
                }
            }
        }

        let momentImages = []; // 存储朋友圈图片（真实图片或内容图片）
        let editingMomentId = null;

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

        // 监听朋友圈输入
        document.addEventListener('DOMContentLoaded', () => {
            const area = document.getElementById('momentTextInput');
            if (area) {
                area.addEventListener('input', updatePostBtnState);
            }
            
            // 点击卡片以外关闭图片展示
            const detailModal = document.getElementById('imageDetailModal');
            if (detailModal) {
                detailModal.addEventListener('click', (e) => {
                    if (e.target === detailModal) {
                        closeImageDetail();
                    }
                });
            }
        });

        function selectMomentImage() {
            document.getElementById('imageContentModal').classList.add('active');
            document.getElementById('imageContentInput').value = '';
            document.getElementById('imageContentInput').focus();
        }

        function closeImageContentModal() {
            document.getElementById('imageContentModal').classList.remove('active');
        }

        function confirmImageContent() {
            const content = document.getElementById('imageContentInput').value.trim();
            if (content) {
                momentImages.push({
                    type: 'text',
                    content: content
                });
                renderEditImages();
                updatePostBtnState();
            }
            closeImageContentModal();
        }

        function renderEditImages() {
            const container = document.getElementById('momentEditImagesContainer');
            if (!container) return;
            
            // 获取上传按钮（如果不存在则创建一个）
            let uploader = container.querySelector('.moment-image-uploader');
            if (!uploader) {
                uploader = document.createElement('div');
                uploader.className = 'moment-image-uploader';
                uploader.onclick = selectMomentImage;
                uploader.innerHTML = '<div class="uploader-plus">+</div>';
            }
            
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
            
            container.appendChild(uploader);
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
            // 此函数目前被 selectMomentImage 的弹窗逻辑替代，但保留作为兼容
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentMomentImage = e.target.result;
                    momentImageContent = '';
                    const preview = document.getElementById('momentImagePreview');
                    const placeholder = document.getElementById('momentImagePlaceholder');
                    if (preview) {
                        preview.src = currentMomentImage;
                        preview.style.display = 'block';
                    }
                    if (placeholder) placeholder.style.display = 'none';
                    document.querySelector('.uploader-plus').style.display = 'none';
                    updatePostBtnState();
                };
                reader.readAsDataURL(file);
            }
        }

        function postMoment() {
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

            localStorage.setItem('mimi_moments', JSON.stringify(momentsData));
            
            if (!editingMomentId && postedId) {
                // 发布后触发自动互动（点赞+评论）
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
            if (range === '全部') return true;
            return true;
        }

        let currentMomentId = null;
        function renderMoments() {
            // 修正：重绘前将共享的操作弹窗移回容器，防止被 list.innerHTML = '' 销毁
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
                // 如果是查看特定好友的AI朋友圈
                if (currentMomentsFriendId) {
                    if (item.isMine || item.friendId !== currentMomentsFriendId) {
                        return;
                    }
                }

                // AI朋友圈可见度过滤
                if (!item.isMine && item.friendId) {
                    const settings = allSettings[item.friendId] || {};
                    const range = settings.aiMomentRange || '最近三天';
                    if (!isMomentVisible(item.time, range)) {
                        return; // 跳过不可见的动态
                    }
                }

                const momentEl = document.createElement('div');
                momentEl.className = 'moment-item';
                momentEl.setAttribute('data-moment-id', item.id);
                
                // 添加长按事件
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
                    imagesHtml = `<div class="moment-images" style="grid-template-columns: repeat(${item.images.length === 1 ? 1 : (item.images.length === 2 || item.images.length === 4 ? 2 : 3)}, 1fr);">`;
                    item.images.forEach(img => {
                        if (img.type === 'text') {
                            imagesHtml += `<div class="moment-img" onclick="showMomentImageDetail('${img.content}')" style="display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px; padding:5px; text-align:center;">${img.content}</div>`;
                        } else {
                            imagesHtml += `<img src="${img.content}" class="moment-img" onclick="previewImage('${img.content}')">`;
                        }
                    });
                    imagesHtml += `</div>`;
                }

                let likesHtml = '';
                if (item.likes && item.likes.length > 0) {
                    likesHtml = `
                        <div class="moment-likes-box">
                            <span class="heart-hollow">♡</span>
                            ${item.likes.join(', ')}
                        </div>
                    `;
                }

                let dividerHtml = (item.likes && item.likes.length > 0 && item.comments && item.comments.length > 0) 
                    ? '<div class="moment-feedback-divider"></div>' 
                    : '';

                let commentsHtml = '';
                if (item.comments && item.comments.length > 0) {
                    commentsHtml = `<div class="moment-comments-list">
                        ${item.comments.map((c, cIdx) => {
                            // 严格按照格式：网名 回复 备注：回复内容
                            let replyText = c.replyTo ? ` <span class="moment-comment-reply">回复</span> <span class="moment-comment-nickname">${c.replyTo}</span>` : '';
                            return `<div class="moment-comment-item" 
                                onclick="handleCommentClick(${item.id}, ${cIdx}, event)"
                                ontouchstart="window.commentLongPressTimer = setTimeout(() => { if(confirm('是否删除评论？')){ const m = momentsData.find(mo => mo.id === ${item.id}); if(m){ m.comments.splice(${cIdx}, 1); localStorage.setItem('mimi_moments', JSON.stringify(momentsData)); renderMoments(); } } }, 700)"
                                ontouchend="clearTimeout(window.commentLongPressTimer)"
                                ontouchmove="clearTimeout(window.commentLongPressTimer)"
                                onmousedown="window.commentLongPressTimer = setTimeout(() => { if(confirm('是否删除评论？')){ const m = momentsData.find(mo => mo.id === ${item.id}); if(m){ m.comments.splice(${cIdx}, 1); localStorage.setItem('mimi_moments', JSON.stringify(momentsData)); renderMoments(); } } }, 700)"
                                onmouseup="clearTimeout(window.commentLongPressTimer)"
                                onmouseleave="clearTimeout(window.commentLongPressTimer)">
                                <span class="moment-comment-nickname">${c.nickname}</span>${replyText}：${c.content}
                            </div>`;
                        }).join('')}
                    </div>`;
                }

                momentEl.innerHTML = `
                    <img src="${item.avatar || DEFAULT_AVATAR}" class="moment-avatar">
                    <div class="moment-content-box">
                        <div class="moment-nickname">${item.nickname}</div>
                        <div class="moment-text">${item.content}</div>
                        ${imagesHtml}
                        <div class="moment-footer">
                            <div class="moment-time">${formatMomentTime(item.time)}</div>
                            <div class="moment-actions-btn" onclick="toggleMomentActions(${item.id}, event)">
                                <div class="dot-icon"></div>
                                <div class="dot-icon"></div>
                            </div>
                        </div>
                        <div class="moment-feedback-section" style="${(!likesHtml && !commentsHtml) ? 'display:none' : ''}">
                            ${likesHtml}
                            ${dividerHtml}
                            ${commentsHtml}
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

        let currentCommentIndex = null;
        function handleCommentClick(momentId, commentIdx, event) {
            event.stopPropagation();
            const moment = momentsData.find(m => m.id === momentId);
            if (!moment) return;
            const comment = moment.comments[commentIdx];
            if (!comment) return;

            const myNickname = wechatUserInfo.nickname || '我';
            if (comment.nickname === myNickname) {
                // 自己的评论
                currentMomentId = momentId;
                currentCommentIndex = commentIdx;
                document.getElementById('commentActionModal').classList.add('active');
            } else {
                // 联系人的评论 -> 回复
                showMomentCommentInput(momentId, event, comment.nickname);
            }
        }

        function deleteComment() {
            if (currentMomentId && currentCommentIndex !== null) {
                const moment = momentsData.find(m => m.id === currentMomentId);
                if (moment) {
                    moment.comments.splice(currentCommentIndex, 1);
                    localStorage.setItem('mimi_moments', JSON.stringify(momentsData));
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
                    navigator.clipboard.writeText(comment.content).then(() => {
                        alert('已复制');
                    });
                }
            }
            document.getElementById('commentActionModal').classList.remove('active');
        }

        function toggleMomentActions(id, event) {
            event.stopPropagation();
            const popup = document.getElementById('momentActionPopup');
            
            // 如果评论框正在显示，先将其关闭
            const inputBar = document.getElementById('momentCommentInputBar');
            if (inputBar && inputBar.style.display === 'flex') {
                inputBar.style.display = 'none';
                document.getElementById('momentCommentInput').blur();
            }

            const btn = event.currentTarget;
            
            // 检查是否已经在当前这条动态且显示中
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
            
            // 设置点赞按钮文本
            const moment = momentsData.find(m => m.id === id);
            const myName = wechatUserInfo.nickname || '我';
            const likeBtn = document.getElementById('momentLikeBtn');
            if (moment && likeBtn) {
                likeBtn.textContent = (moment.likes && moment.likes.includes(myName)) ? '取消' : '点赞';
                likeBtn.onclick = (e) => {
                    handleMomentLike(id, e);
                };
            }
            
            const commentBtn = document.getElementById('momentCommentBtn');
            if (commentBtn) {
                commentBtn.onclick = (e) => {
                    showMomentCommentInput(id, e);
                };
            }

            const contactReplyBtn = document.getElementById('momentContactReplyBtn');
            if (contactReplyBtn) {
                contactReplyBtn.onclick = (e) => {
                    handleMomentContactReply(id, e);
                };
            }
        }

        async function handleMomentContactReply(id, event) {
            event.stopPropagation();
            hideMomentPopups();
            
            const moment = momentsData.find(m => m.id === id);
            if (!moment) return;

            // 选取一个随机联系人作为回复者
            if (chatList.length === 0) {
                alert('请先添加好友以进行联系人回复');
                return;
            }
            const randomFriend = chatList[Math.floor(Math.random() * chatList.length)];
            await callAIForMoment(id, randomFriend, 'manual_trigger');
        }

        function triggerAutoMomentsFeedback(momentId) {
            if (chatList.length === 0) return;
            // 随机决定 1-4 个好友进行互动
            const count = Math.floor(Math.random() * 4) + 1;
            const shuffled = [...chatList].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, count);
            selected.forEach((friend, index) => {
                // 随机延迟，模拟不同人的回复时机
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

            let systemPrompt = `你现在的身份是微信好友：${nickname}。
【身份身份】：你不是AI，你是一个真实的联系人，拥有独立的思想和社交习惯。你现在正在刷朋友圈。
【人设信息】：${contact ? contact.design : '一个普通的微信好友'}。
【当前场景】：你在朋友圈看到了用户发布的内容。你需要根据你们的关系亲疏和内容质量，决定是否互动。
【朋友圈内容】：${moment.content}
${moment.images && moment.images.length > 0 ? '包含图片描述：' + moment.images.filter(img => img.type === 'text').map(img => img.content).join(', ') : ''}`;

            if (type === 'auto_feedback' || type === 'manual_trigger') {
                systemPrompt += `\n任务：决定是否给这条朋友圈点赞，以及是否进行评论。
请根据你的人设和内容逻辑，以 JSON 格式返回你的决定：
{
  "like": boolean, // 是否点赞
  "comment": string // 评论内容，如果不评论则留空 ""。评论应在20字以内，口语化，不带引号。
}
如果由于人设或忙碌不打算进行任何互动，请依然返回该 JSON，like 设为 false，comment 设为 ""。
直接返回 JSON，不要有前缀或后缀。`;
            } else if (type === 'reply_to_user') {
                const history = chatHistories[friend.id] || [];
                const chatContext = history.slice(-5).map(m => `${m.type === 'sent' ? '用户' : '你'}: ${m.content}`).join('\n');
                systemPrompt += `\n你们最近的私聊记录：\n${chatContext || '暂无交流'}`;
                systemPrompt += `\n用户在朋友圈回复了你的评论："${context.userComment}"。
【任务】：作为真实的联系人，根据你们的私聊默契、朋友圈语境和人设决定是否在朋友圈回复用户。
注意：朋友圈回复通常比较简短、随意。
直接返回回复内容（20字以内，口语化，不要前缀，不要引号，不要有动作描写）。
如果不打算回复，或者此时觉得不便回复，请返回 "SKIP"。`;
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
                            localStorage.setItem('mimi_moments', JSON.stringify(momentsData));
                            renderMoments();
                        }
                    } else {
                        // 解析 JSON
                        try {
                            const jsonStr = resContent.match(/\{.*\}/s) ? resContent.match(/\{.*\}/s)[0] : resContent;
                            const decision = JSON.parse(jsonStr);
                            
                            let changed = false;
                            if (decision.like) {
                                if (!moment.likes.includes(nickname)) {
                                    moment.likes.push(nickname);
                                    changed = true;
                                }
                            }
                            
                            if (decision.comment && decision.comment.trim() !== "") {
                                moment.comments.push({
                                    nickname: nickname,
                                    content: decision.comment.trim(),
                                    time: Date.now()
                                });
                                changed = true;
                            }
                            
                            if (changed) {
                                localStorage.setItem('mimi_moments', JSON.stringify(momentsData));
                                renderMoments();
                            }
                        } catch (jsonErr) {
                            console.error("AI Decision Parse Error:", jsonErr, resContent);
                        }
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

            // 根据是否是自己的朋友圈显示不同按钮
            if (item.isMine) {
                editBtn.style.display = 'block';
                deleteBtn.style.display = 'block';
                repostBtn.style.display = 'none';
                
                editBtn.style.width = '50%';
                deleteBtn.style.width = '50%';
            } else {
                editBtn.style.display = 'block';
                deleteBtn.style.display = 'block';
                repostBtn.style.display = 'block';
                
                editBtn.style.width = '33.3%';
                deleteBtn.style.width = '33.3%';
                repostBtn.style.width = '33.3%';
            }

            editBtn.onclick = () => handleMomentLongAction('edit', item);
            deleteBtn.onclick = () => handleMomentLongAction('delete', item);
            repostBtn.onclick = () => handleMomentLongAction('repost', item);

            if (navigator.vibrate) navigator.vibrate(50);
        }

        function handleMomentLongAction(action, item) {
            document.getElementById('momentContextMenu').style.display = 'none';
            
            if (action === 'delete') {
                if (confirm('是否删除这条朋友圈？')) {
                    momentsData = momentsData.filter(m => m.id !== item.id);
                    localStorage.setItem('mimi_moments', JSON.stringify(momentsData));
                    renderMoments();
                }
            } else if (action === 'edit') {
                openMomentsEdit(item);
            } else if (action === 'repost') {
                if (confirm('确定要重发这条朋友圈吗？')) {
                    // 删除旧的
                    momentsData = momentsData.filter(m => m.id !== item.id);
                    // 创建新的（更新时间）
                    const newMoment = {
                        ...item,
                        id: Date.now(),
                        time: Date.now(),
                        likes: [],
                        comments: []
                    };
                    momentsData.unshift(newMoment);
                    localStorage.setItem('mimi_moments', JSON.stringify(momentsData));
                    renderMoments();
                }
            }
        }

        function confirmMomentEdit() {
            const newValue = document.getElementById('momentEditTextInput').value.trim();
            if (currentMomentId) {
                const moment = momentsData.find(m => m.id === currentMomentId);
                if (moment) {
                    moment.content = newValue;
                    localStorage.setItem('mimi_moments', JSON.stringify(momentsData));
                    renderMoments();
                }
            }
            document.getElementById('momentEditModal').classList.remove('active');
        }

        function hideMomentPopups() {
            const popup = document.getElementById('momentActionPopup');
            if (popup) popup.style.display = 'none';
            const contextMenu = document.getElementById('momentContextMenu');
            if (contextMenu) contextMenu.style.display = 'none';
            
            // 需求4：关闭评论输入框
            const inputBar = document.getElementById('momentCommentInputBar');
            if (inputBar) {
                inputBar.style.display = 'none';
                const input = document.getElementById('momentCommentInput');
                if (input) {
                    input.value = '';
                    input.blur();
                }
            }
            currentMomentId = null;
            currentReplyTo = null;
        }

        function handleMomentLike(id, event) {
            event.stopPropagation();
            const moment = momentsData.find(m => m.id === id);
            if (moment) {
                const myName = wechatUserInfo.nickname || '我';
                const idx = moment.likes.indexOf(myName);
                if (idx > -1) {
                    moment.likes.splice(idx, 1);
                } else {
                    moment.likes.push(myName);
                }
                localStorage.setItem('mimi_moments', JSON.stringify(momentsData));
                
                // 优化：仅更新当前动态的 UI，实现立刻反应
                const momentEl = document.querySelector(`.moment-item[data-moment-id="${id}"]`);
                if (momentEl) {
                    const feedbackSection = momentEl.querySelector('.moment-feedback-section');
                    
                    let likesHtml = '';
                    if (moment.likes && moment.likes.length > 0) {
                        likesHtml = `
                            <div class="moment-likes-box">
                                <span class="heart-hollow">♡</span>
                                ${moment.likes.join(', ')}
                            </div>
                        `;
                    }

                    let dividerHtml = (moment.likes && moment.likes.length > 0 && moment.comments && moment.comments.length > 0) 
                        ? '<div class="moment-feedback-divider"></div>' 
                        : '';

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

                    if (!likesHtml && !commentsHtml) {
                        feedbackSection.style.display = 'none';
                    } else {
                        feedbackSection.style.display = 'flex';
                        feedbackSection.innerHTML = `${likesHtml}${dividerHtml}${commentsHtml}`;
                    }
                } else {
                    renderMoments();
                }
            }
            document.getElementById('momentActionPopup').style.display = 'none';
        }

        let currentReplyTo = null;
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

        function sendMomentComment() {
            const content = document.getElementById('momentCommentInput').value.trim();
            if (!content || !currentMomentId) return;

            const moment = momentsData.find(m => m.id === currentMomentId);
            const id = currentMomentId;
            if (moment) {
                const myNickname = wechatUserInfo.nickname || '我';
                const newComment = {
                    nickname: myNickname,
                    content: content,
                    time: Date.now()
                };
                if (currentReplyTo) {
                    newComment.replyTo = currentReplyTo;
                }
                moment.comments.push(newComment);
                localStorage.setItem('mimi_moments', JSON.stringify(momentsData));
                
                // 需求3：用户回复了联系人的评论联系人会再次自动调取api回复用户
                if (currentReplyTo && currentReplyTo !== myNickname) {
                    const friend = chatList.find(f => getFriendDisplayName(f) === currentReplyTo);
                    if (friend) {
                        // 缩短延迟，增强互动感
                        setTimeout(() => callAIForMoment(id, friend, 'reply_to_user', { userComment: content }), 1000);
                    } else {
                        // 兜底尝试从联系人列表寻找匹配项
                        const contact = contacts.find(c => (c.remark || c.netName || c.name) === currentReplyTo);
                        if (contact) {
                            const tempFriend = { id: 0, contactId: contact.id, name: contact.name };
                            setTimeout(() => callAIForMoment(id, tempFriend, 'reply_to_user', { userComment: content }), 1000);
                        }
                    }
                }

                // 优化：立刻局部更新 UI
                const momentEl = document.querySelector(`.moment-item[data-moment-id="${id}"]`);
                if (momentEl) {
                    const feedbackSection = momentEl.querySelector('.moment-feedback-section');
                    
                    let likesHtml = '';
                    if (moment.likes && moment.likes.length > 0) {
                        likesHtml = `
                            <div class="moment-likes-box">
                                <span class="heart-hollow">♡</span>
                                ${moment.likes.join(', ')}
                            </div>
                        `;
                    }

                    let dividerHtml = (moment.likes && moment.likes.length > 0 && moment.comments && moment.comments.length > 0) 
                        ? '<div class="moment-feedback-divider"></div>' 
                        : '';

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
                } else {
                    renderMoments();
                }
            }

            const inputBar = document.getElementById('momentCommentInputBar');
            inputBar.style.display = 'none';
            document.getElementById('momentCommentInput').value = '';
            document.getElementById('momentCommentInput').blur();
            currentReplyTo = null;
            updateMomentCommentSendBtn();
        }

        function changeMomentsBg() {
            // 需求1：更换朋友圈背景图（相册/URL）
            currentImageId = 'momentsBg';
            
            // 劫持模态框确认回调以实现朋友圈背景的持久化保存
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
                // 恢复原始函数，防止污染全局
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
            if (typeof initialIndex === 'number') {
                selectedMsgIndexes.add(initialIndex);
            }
            
            // UI 切换 - 顶部导航
            const navLeft = document.getElementById('chatNavLeft');
            if (navLeft) {
                navLeft.innerHTML = '<span style="font-size: 16px; color: #000; font-weight: normal; margin-left: 4px;">取消</span>';
                navLeft.onclick = exitMultiSelectMode;
            }
            const navRight = document.getElementById('chatNavRight');
            if (navRight) navRight.style.visibility = 'hidden';

            // UI 切换 - 底部工具栏
            document.getElementById('multiSelectToolbar').classList.add('active');
            
            // 隐藏输入框
            const inputBarChildren = document.getElementById('chatInputBar').children;
            for (let child of inputBarChildren) {
                if (child.id !== 'multiSelectToolbar') {
                    child.style.display = 'none';
                }
            }
            
            renderMessages();
        }

        function exitMultiSelectMode() {
            isMultiSelectMode = false;
            selectedMsgIndexes.clear();
            
            // 恢复顶部导航
            const navLeft = document.getElementById('chatNavLeft');
            if (navLeft) {
                navLeft.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;"><path d="M15 18l-6-6 6-6"/></svg>';
                navLeft.onclick = closeChat;
            }
            const navRight = document.getElementById('chatNavRight');
            if (navRight) navRight.style.visibility = 'visible';

            document.getElementById('multiSelectToolbar').classList.remove('active');
            
            // 恢复输入框
            const inputBarChildren = document.getElementById('chatInputBar').children;
            for (let child of inputBarChildren) {
                if (child.id !== 'multiSelectToolbar' && child.id !== 'quotePreview' && child.id !== 'chatSendBtn') {
                    child.style.display = 'flex';
                }
            }
            // quotePreview 和 chatSendBtn 根据状态决定
            if (quotedMessage) document.getElementById('quotePreview').style.display = 'block';
            
            renderMessages();
        }

        function toggleMsgSelection(index) {
            if (selectedMsgIndexes.has(index)) {
                selectedMsgIndexes.delete(index);
            } else {
                selectedMsgIndexes.add(index);
            }
            renderMessages();
        }

        function showForwardOptions() {
            if (selectedMsgIndexes.size === 0) {
                alert('请先选择消息');
                return;
            }
            document.getElementById('forwardTypeModal').classList.add('active');
        }

        function closeForwardTypeModal() {
            document.getElementById('forwardTypeModal').classList.remove('active');
        }

        function handleForwardMode(mode) {
            currentForwardMode = mode === '逐条' ? 'multi-one-by-one' : 'multi-combine';
            closeForwardTypeModal();
            
            // 复用现有的转发联系人选择弹窗
            document.getElementById('forwardModal').classList.add('active');
            renderForwardContacts();
        }

        function handleMultiFavorite() {
            if (selectedMsgIndexes.size === 0) {
                alert('请先选择消息');
                return;
            }
            
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

                const newFav = {
                    id: Date.now(),
                    content: '[聊天记录]',
                    isMergedForward: true,
                    title: title,
                    fullHistory: fullHistory,
                    date: new Date().toISOString().split('T')[0],
                    isPinned: false
                };
                favoritesData.unshift(newFav);
                saveFavoritesToStorage();
                alert(`已将 ${selectedCount} 条消息合并收藏`);
            }
            
            exitMultiSelectMode();
        }

        function handleMultiDelete() {
            if (selectedMsgIndexes.size === 0) {
                alert('请先选择消息');
                return;
            }
            
            if (confirm(`确定删除选中的 ${selectedMsgIndexes.size} 条消息吗？`)) {
                const history = chatHistories[currentChatFriendId];
                if (history) {
                    selectedMsgIndexes.forEach(idx => {
                        if (history[idx]) {
                            history[idx].isDeletedLocal = true;
                        }
                    });
                    saveChatHistories();
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
            if (history && !isNaN(idx)) {
                messageToForward = history[idx];
            } else {
                messageToForward = currentLongPressedMsg.querySelector('div:not(.msg-translation):not([style*="font-size: 12px"])').textContent;
            }
            
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
            if (keyword) {
                filteredFriends = chatList.filter(f => getFriendDisplayName(f).toLowerCase().includes(keyword.toLowerCase()));
            }

            if (filteredFriends.length === 0) {
                listContainer.innerHTML = '<div class="empty-state">未找到联系人</div>';
                return;
            }

            let html = '';
            filteredFriends.forEach(friend => {
                html += `
                    <div class="wechat-contact-item" onclick="forwardToContact(${friend.id})">
                        <img src="${friend.avatar || DEFAULT_AVATAR}" class="wechat-contact-avatar" alt="">
                        <div class="wechat-contact-name">${getFriendDisplayName(friend)}</div>
                    </div>
                `;
            });
            listContainer.innerHTML = html;
        }

        function searchForwardContacts() {
            const keyword = document.getElementById('forwardSearchInput').value.trim();
            renderForwardContacts(keyword);
        }

        function forwardToContact(friendId) {
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
                    } else {
                        messagesToSend.push({ type: 'sent', content: messageToForward });
                    }
                }
            } else {
                const sortedIndexes = Array.from(selectedMsgIndexes).sort((a, b) => a - b);
                const selectedMsgs = sortedIndexes.map(idx => history[idx]).filter(m => m && !m.isDeletedLocal && m.type !== 'system_withdrawn');
                
                if (currentForwardMode === 'multi-one-by-one') {
                    messagesToSend = selectedMsgs.map(m => {
                        const msg = { ...m, type: 'sent' };
                        delete msg.translation;
                        return msg;
                    });
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

                    messagesToSend = [{
                        type: 'sent',
                        isMergedForward: true,
                        title: title,
                        fullHistory: fullHistory,
                        content: '[聊天记录]' // 降级显示
                    }];
                }
            }

            if (messagesToSend.length === 0) return;
            
            if (!chatHistories[friendId]) {
                chatHistories[friendId] = [];
            }
            
            messagesToSend.forEach(msg => {
                chatHistories[friendId].push({
                    ...msg,
                    time: new Date().getTime()
                });
            });
            
            // 更新该联系人的最后一条消息
            const friend = chatList.find(f => f.id === friendId);
            if (friend) {
                const lastMsg = messagesToSend[messagesToSend.length - 1];
                if (isMerged) {
                    friend.message = '[聊天记录]';
                } else if (lastMsg.msgType === 'sticker') {
                    friend.message = `[${lastMsg.stickerName || '表情'}]`;
                } else {
                    friend.message = lastMsg.content;
                }
                friend.time = formatTime(new Date());
            }

            saveChatHistories();
            saveChatListToStorage();
            
            alert('已转发');
            closeForwardModal();
            if (isMultiSelectMode) exitMultiSelectMode();
            
            // 如果在消息列表页，刷新显示
            const activeTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item.active .wechat-nav-label');
            if (activeTab && activeTab.textContent === '消息') {
                renderChatList();
            }
        }
        
        // 图标配置
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

        // 按钮图标配置
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
        
        // 加载保存的图标和普通图片
        async function loadSavedIcons() {
            try {
                const images = await dbGetAll("icons");
                images.forEach((img) => {
                    const el = document.getElementById(img.id);
                    if (el && img.src) {
                        el.src = img.src;
                    }
                });
                
                // 加载按钮图标
                const btnIcons = await dbGetAll("button_icons");
                btnIcons.forEach((icon) => {
                    const el = document.getElementById(icon.id);
                    if (el && icon.content) {
                        if (icon.content.startsWith('data:image/') || icon.content.startsWith('http')) {
                            el.innerHTML = `<img src="${icon.content}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
                            el.style.overflow = 'hidden';
                        } else {
                            el.textContent = icon.content;
                        }
                    }
                });
            } catch (e) {
                console.error("Failed to load images:", e);
            }
        }

        // 保存图片
        async function saveImage(id, src) {
            try {
                await dbPut("icons", { id: id, src: src });
            } catch (e) {
                console.error("Failed to save image:", e);
                alert("保存图片失败");
            }
        }

        // 更新时间
        function updateTime() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            
            const globalTime = document.getElementById('globalTime');
            if (globalTime) globalTime.textContent = timeStr;

            // 同步所有使用 wechat-time-sync 类的元素
            document.querySelectorAll('.wechat-time-sync').forEach(el => {
                el.textContent = timeStr;
            });
        }

        // 安全保存到 localStorage 的辅助函数
        function safeLocalStorageSet(key, value, silent = false) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.error("LocalStorage save failed:", e);
                if (!silent) {
                    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                        alert("保存失败：存储空间已满。请在微信->设置->存储空间中清理数据后再试。");
                    } else {
                        alert("保存失败：当前浏览器环境限制了数据保存（可能是开启了无痕模式）。");
                    }
                }
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
            if (statusBar) {
                statusBar.style.display = enabled ? 'none' : 'flex';
            }
            safeLocalStorageSet('mimi_status_bar_hide_pref', enabled ? 'true' : 'false');
            
            // 同步所有状态栏开关
            document.querySelectorAll('[id="statusBarToggle"]').forEach(toggle => {
                toggle.checked = enabled;
            });
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

            if (statusBarHidePref) {
                toggleStatusBar(true);
            }
        }

        // 更新电池状态
        function updateBattery() {
            if ('getBattery' in navigator) {
                navigator.getBattery().then(battery => {
                    const updateAll = () => {
                        const level = Math.round(battery.level * 100);
                        
                        // 同步所有百分比文字
                        document.querySelectorAll('.battery-percent').forEach(el => {
                            el.textContent = `${level}%`;
                        });
                        
                        // 同步所有电池进度条
                        document.querySelectorAll('.battery-fill').forEach(el => {
                            el.style.width = `${level}%`;
                            if (level <= 20) {
                                el.classList.add('low');
                            } else {
                                el.classList.remove('low');
                            }
                        });

                        // 低电量提醒 (低于20% 且本轮未提醒过)
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
            } else if (level > 20) {
                window.lowBatteryAlerted = false;
            }
        }

        function showCustomBatteryAlert(text, css) {
            // 移除旧的弹窗
            const old = document.getElementById('batteryAlertOverlay');
            if (old) old.remove();

            // 创建弹窗
            const overlay = document.createElement('div');
            overlay.id = 'batteryAlertOverlay';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 999999;
                display: flex; align-items: center; justify-content: center;
                animation: fadeIn 0.3s ease;
            `;

            const alertBox = document.createElement('div');
            alertBox.className = 'custom-battery-alert';
            
            // 默认基础样式
            let baseStyle = `
                background: #fff; padding: 25px; border-radius: 20px;
                width: 80%; max-width: 300px; text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                position: relative;
            `;
            
            alertBox.style.cssText = baseStyle + css;
            
            alertBox.innerHTML = `
                <div class="battery-alert-content" style="margin-bottom: 20px; font-size: 16px; line-height: 1.5;">${text}</div>
                <button onclick="document.getElementById('batteryAlertOverlay').remove()" 
                        style="width: 100%; padding: 12px; background: #000; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer;">
                    好的
                </button>
            `;

            overlay.appendChild(alertBox);
            document.body.appendChild(overlay);

            // 如果没有动画定义，添加一个
            if (!document.getElementById('batteryAlertAnim')) {
                const style = document.createElement('style');
                style.id = 'batteryAlertAnim';
                style.textContent = `
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `;
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
            if (line) {
                line.style.borderBottomColor = enabled ? '#000' : '#ddd';
            }
            if (input) {
                input.disabled = !enabled;
                input.style.color = enabled ? '#000' : '#888';
            }
            if (label) {
                label.style.color = enabled ? '#000' : '#666';
            }
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
                case 'ios':
                    css = "background: rgba(255,255,255,0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 14px; color: #000; font-family: -apple-system; font-weight: 600;";
                    break;
                case 'neon':
                    css = "background: #1a1a1a; border: 2px solid #0ff; box-shadow: 0 0 15px #0ff; color: #0ff; text-shadow: 0 0 5px #0ff; border-radius: 0; font-family: 'Courier New';";
                    break;
                case 'minimal':
                    css = "background: #fff; border-left: 5px solid #000; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: left;";
                    break;
                case 'dark':
                    css = "background: #2c2c2e; color: #fff; border-radius: 18px; box-shadow: 0 10px 40px rgba(0,0,0,0.4);";
                    break;
            }
            document.getElementById('batteryAlertCss').value = css;
            saveBatterySettings();
            
            // 立即预览效果
            showCustomBatteryAlert(document.getElementById('batteryAlertText').value, css);
        }

        // 编辑文字
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

        // 保存账号信息
        function saveAccountInfo() {
            // 增加点击反馈
            const btn = document.querySelector('.account-action-item[onclick="saveAccountInfo()"]');
            if (btn) btn.style.opacity = '0.5';

            setTimeout(() => {
                saveTextContent();
                alert('账号信息保存成功');
                if (btn) btn.style.opacity = '1';
            }, 50);
        }

        // 保存所有文案内容
        function saveTextContent() {
            const textElements = document.querySelectorAll('[id^="txt-"]');
            const textData = {};
            textElements.forEach(el => {
                textData[el.id] = el.textContent;
            });
            safeLocalStorageSet('mimi_text_content', JSON.stringify(textData));
        }

        // 加载所有文案内容
        function loadTextContent() {
            const saved = localStorage.getItem('mimi_text_content');
            if (saved) {
                const textData = JSON.parse(saved);
                for (const id in textData) {
                    const el = document.getElementById(id);
                    if (el) {
                        el.textContent = textData[id];
                    }
                }
            }
        }

        // 更改图片
        function changeImage(imageId) {
            currentImageId = imageId;
            document.getElementById('urlInputContainer').style.display = 'none';
            document.getElementById('imageModal').classList.add('active');
        }

        function selectFromAlbum() {
            document.getElementById('fileInput').click();
        }

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
                        // 处理按钮图标 (div)
                        el.innerHTML = `<img src="${src}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
                        el.style.overflow = 'hidden';
                        saveButtonIcon(currentImageId, src);
                    }
                    
                    // 刷新列表预览
                    if (document.getElementById('iconPage').style.display === 'flex') {
                        renderIconList();
                    }
                    if (document.getElementById('icon2Page').style.display === 'flex') {
                        renderIcon2List();
                    }
                    
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
                    // 处理按钮图标 (div)
                    el.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;">`;
                    el.style.overflow = 'hidden';
                    saveButtonIcon(currentImageId, url);
                }
                
                // 刷新列表预览
                if (document.getElementById('iconPage').style.display === 'flex') {
                    renderIconList();
                }
                if (document.getElementById('icon2Page').style.display === 'flex') {
                    renderIcon2List();
                }
                
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

        // 微信相关变量和函数
        let wechatVisible = false;
        let chatList = [];
        let groupList = [];

        // 设置页面相关函数
        async function updateApp() {
            if (confirm('确定要检查并更新到最新版本吗？\n更新将清理页面缓存并重新加载，您的聊天记录、联系人、主题等核心数据将保留。')) {
                try {
                    // 1. 清除 Service Worker 缓存
                    if ('caches' in window) {
                        const cacheNames = await caches.keys();
                        for (const name of cacheNames) {
                            await caches.delete(name);
                        }
                    }
                    
                    // 2. 取消注册 Service Worker
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                            await registration.unregister();
                        }
                    }
                    
                    // 3. 提示并刷新
                    alert('缓存已清理，即将重新加载以更新到最新版本');
                    window.location.reload();
                } catch (e) {
                    console.error("Update failed:", e);
                    alert("更新失败：" + e.message);
                }
            }
        }

        function openSettings() {
            document.querySelector('.phone-container').style.display = 'none';
            document.getElementById('settingsContainer').style.display = 'flex';
            updateTime();
            updateBattery();
            saveUIState();
        }

        function closeSettings() {
            document.getElementById('settingsContainer').style.display = 'none';
            document.querySelector('.phone-container').style.display = 'flex';
            saveUIState();
        }

        function openAccount() {
            document.getElementById('settingsContainer').style.display = 'none';
            document.getElementById('accountContainer').style.display = 'flex';
            updateTime();
            updateBattery();
            saveUIState();
        }

        function closeAccount() {
            document.getElementById('accountContainer').style.display = 'none';
            document.getElementById('settingsContainer').style.display = 'flex';
            saveUIState();
        }

        function openAccountInfo() {
            document.getElementById('accountContainer').style.display = 'none';
            document.getElementById('accountInfoContainer').style.display = 'flex';
            
            // 同步账号信息显示
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
            
            // 使用持久化 Mimi ID
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
            document.getElementById('accountInfoContainer').style.display = 'none';
            document.getElementById('accountContainer').style.display = 'flex';
            saveUIState();
        }

        function openRealNamePage() {
            document.getElementById('accountInfoContainer').style.display = 'none';
            document.getElementById('realNameContainer').style.display = 'flex';
            
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

            // 更新实名状态显示
            const statusEl = document.getElementById('real-name-status');
            if (statusEl) {
                statusEl.textContent = (realNameInfo.name !== '未设置') ? '已实名' : '未实名';
            }
            
            document.getElementById('realNameContainer').style.display = 'none';
            document.getElementById('accountInfoContainer').style.display = 'flex';
            saveUIState();
        }

        // API配置相关函数
        let apiConfigs = [];
        let currentConfigId = 'default';

        function openApiConfig() {
            console.log("Opening API Config, currentId:", currentConfigId);
            document.getElementById('settingsContainer').style.display = 'none';
            document.getElementById('apiConfigContainer').style.display = 'flex';
            updateTime();
            updateBattery();
            loadApiConfigs();
            saveUIState();
        }

        function closeApiConfig() {
            document.getElementById('apiConfigContainer').style.display = 'none';
            document.getElementById('settingsContainer').style.display = 'flex';
            saveUIState();
        }

        function openDisplaySettings() {
            document.getElementById('settingsContainer').style.display = 'none';
            document.getElementById('displaySettingsContainer').style.display = 'flex';
            updateTime();
            updateBattery();
            // 检查当前是否全屏
            document.getElementById('fullscreenToggle').checked = !!document.fullscreenElement;
            saveUIState();
        }

        function closeDisplaySettings() {
            document.getElementById('displaySettingsContainer').style.display = 'none';
            document.getElementById('settingsContainer').style.display = 'flex';
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
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('portrait').catch(() => {});
                    }
                }).catch(err => {
                    console.warn("Fullscreen request failed:", err);
                });
            }
        }

        function exitFullscreen() {
            if (document.fullscreenElement) {
                document.exitFullscreen();
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
            }
        }

        // 核心修改：通过全局点击监听自动恢复全屏状态，解决系统弹窗退出全屏的问题
        function checkFullscreenPref() {
            const pref = localStorage.getItem('mimi_fullscreen_pref');
            if (pref === 'true') {
                const toggle = document.getElementById('fullscreenToggle');
                if (toggle) toggle.checked = true;
            }
        }

        // 全局手势监听：如果预设为全屏但实际非全屏（如弹窗导致退出），则在下次点击时自动恢复
        document.addEventListener('click', () => {
            if (localStorage.getItem('mimi_fullscreen_pref') === 'true' && !document.fullscreenElement) {
                enterFullscreen();
            }
        }, true);

        document.addEventListener('fullscreenchange', () => {
            const toggle = document.getElementById('fullscreenToggle');
            if (toggle) {
                const pref = localStorage.getItem('mimi_fullscreen_pref');
                // 只要全屏偏好开启，开关就显示开启状态
                toggle.checked = (pref === 'true');
            }
        });

        // 通用导出函数，增加对移动端浏览器的兼容性
        function downloadData(data, fileName) {
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            // 兼容移动端：必须添加到 DOM
            a.style.display = 'none';
            document.body.appendChild(a);
            
            // 触发点击
            a.click();
            
            // 延时移除和释放，避免部分浏览器还没开始下载就释放了
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        }

        // 导出系统数据
        async function exportSystemData() {
            try {
                const data = {
                    localStorage: {},
                    indexedDB: {}
                };

                // 1. 导出 localStorage
                const keys = [
                    'mimi_text_content', 
                    'wechat_user_info', 
                    'wechat_chat_list', 
                    'wechat_group_list', 
                    'wechat_chat_histories', 
                    'contacts', 
                    'customCategories', 
                    'current_api_config_id', 
                    'mimi_ui_state',
                    'lowBatteryAlerted'
                ];
                keys.forEach(key => {
                    const val = localStorage.getItem(key);
                    if (val !== null) data.localStorage[key] = val;
                });

                // 2. 导出 IndexedDB
                const stores = ['wallpapers', 'icons', 'fonts', 'themes', 'api_configs', 'settings'];
                for (const store of stores) {
                    data.indexedDB[store] = await dbGetAll(store);
                }

                downloadData(data, `MimiPhone_FullData_${new Date().toISOString().slice(0,10)}.json`);
                alert('系统数据导出成功！');
            } catch (e) {
                console.error("Export failed:", e);
                alert("导出失败：" + e.message);
            }
        }

        // 导入系统数据
        function importSystemData(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.localStorage || !data.indexedDB) {
                        throw new Error('导入文件格式不正确');
                    }

                    if (!confirm('导入数据将覆盖当前所有设置，是否继续？')) return;

                    // 1. 恢复 localStorage
                    for (const key in data.localStorage) {
                        localStorage.setItem(key, data.localStorage[key]);
                    }

                    // 2. 恢复 IndexedDB
                    for (const storeName in data.indexedDB) {
                        await dbClear(storeName);
                        for (const item of data.indexedDB[storeName]) {
                            await dbPut(storeName, item);
                        }
                    }

                    alert('系统数据导入成功，即将刷新页面应用更改');
                    location.reload();
                } catch (error) {
                    console.error("Import failed:", error);
                    alert('导入失败：' + error.message);
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        // 删除系统数据
        async function deleteSystemData() {
            if (!confirm('确定要删除所有系统数据吗？这将清除所有聊天、联系人、主题、壁纸和配置，且无法恢复！')) return;
            if (!confirm('请再次确认：确定要彻底删除吗？')) return;

            try {
                // 清除 localStorage
                localStorage.clear();

                // 清除 IndexedDB
                const stores = ['wallpapers', 'icons', 'fonts', 'themes', 'api_configs', 'settings'];
                for (const store of stores) {
                    await dbClear(store);
                }

                alert('系统数据已全部删除，即将刷新页面');
                location.reload();
            } catch (e) {
                console.error("Delete failed:", e);
                alert("删除失败：" + e.message);
            }
        }

        async function loadApiConfigs() {
            try {
                apiConfigs = await dbGetAll('api_configs');
                if (apiConfigs.length === 0) {
                    // 初始化默认配置
                    const defaultConfig = {
                        id: 'default',
                        name: '默认配置',
                        url: '',
                        key: '',
                        model: '',
                        temp: '1.0'
                    };
                    await dbPut('api_configs', defaultConfig);
                    apiConfigs = [defaultConfig];
                }
                
                const savedConfigId = localStorage.getItem('current_api_config_id');
                if (savedConfigId && apiConfigs.find(c => c.id === savedConfigId)) {
                    currentConfigId = savedConfigId;
                } else {
                    currentConfigId = apiConfigs[0].id;
                }
                
                renderConfigDropdown();
                applyConfigToForm(currentConfigId);
            } catch (e) {
                console.error("Failed to load API configs:", e);
            }
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
                
                // 这里可能需要加载该配置的模型列表并选中对应的模型
                const modelSelect = document.getElementById('modelSelect');
                // 暂时清空并添加当前模型作为唯一选项，除非已经有列表
                if (config.model) {
                    modelSelect.innerHTML = `<option value="${config.model}">${config.model}</option>`;
                    modelSelect.value = config.model;
                } else {
                    modelSelect.innerHTML = '<option value="">请选择模型</option>';
                }
            }
        }

        async function deleteConfig() {
            if (currentConfigId === 'default') {
                alert('默认配置不能删除');
                return;
            }
            
            if (confirm('确定要删除当前配置吗？')) {
                try {
                    await dbDelete('api_configs', currentConfigId);
                    apiConfigs = apiConfigs.filter(c => c.id !== currentConfigId);
                    currentConfigId = apiConfigs[0].id;
                    localStorage.setItem('current_api_config_id', currentConfigId);
                    renderConfigDropdown();
                    applyConfigToForm(currentConfigId);
                } catch (e) {
                    console.error("Failed to delete config:", e);
                }
            }
        }

        function updateTempValue(val) {
            document.getElementById('tempValue').textContent = val;
        }

        // 拦截系统 alert 以防止退出全屏
        (function() {
            const originalAlert = window.alert;
            window.alert = function(text) {
                const modal = document.getElementById('mimiAlertModal');
                const textEl = document.getElementById('mimiAlertText');
                if (modal && textEl) {
                    textEl.textContent = text;
                    modal.classList.add('active');
                } else {
                    originalAlert(text);
                }
            };
        })();

        function closeMimiAlert() {
            document.getElementById('mimiAlertModal').classList.remove('active');
            // 如果开启了全屏偏好但实际未全屏，点击时尝试恢复
            if (localStorage.getItem('mimi_fullscreen_pref') === 'true' && !document.fullscreenElement) {
                enterFullscreen();
            }
        }

        function prepareNewConfig() {
            document.getElementById('configNameInput').value = '';
            document.getElementById('apiUrlInput').value = '';
            document.getElementById('apiKeyInput').value = '';
            document.getElementById('modelSelect').innerHTML = '<option value="">请选择模型</option>';
            document.getElementById('tempSlider').value = '1.0';
            document.getElementById('tempValue').textContent = '1.0';
            document.getElementById('configNameInput').focus();
            
            // 彻底重置内部状态，防止覆盖旧配置
            currentConfigId = ''; 
            document.getElementById('configSelect').value = '';
            console.log("Prepared for new config creation");
        }

        async function searchModels() {
            let url = document.getElementById('apiUrlInput').value.trim();
            const key = document.getElementById('apiKeyInput').value.trim();
            
            if (!url) {
                alert('请先输入接口地址');
                return;
            }
            
            const btn = document.querySelector('.search-model-btn');
            btn.textContent = '获取中...';
            btn.disabled = true;
            
            try {
                // 处理 URL，尝试获取模型列表
                // 如果是以 /chat/completions 结尾，尝试去掉它
                let baseUrl = url.replace(/\/chat\/completions\/?$/, '');
                // 确保有 /v1/models
                let modelsUrl = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
                if (baseUrl.includes('openai.azure.com')) {
                    alert('Azure OpenAI 暂不支持自动搜索模型，请手动输入');
                    return;
                }

                const response = await fetch(modelsUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${key}`
                    }
                });

                if (!response.ok) throw new Error('Network response was not ok');
                
                const data = await response.json();
                const select = document.getElementById('modelSelect');
                select.innerHTML = '<option value="">请选择模型</option>';
                
                if (data.data && Array.isArray(data.data)) {
                    data.data.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m.id;
                        opt.textContent = m.id;
                        select.appendChild(opt);
                    });
                    alert('模型获取成功');
                } else {
                    throw new Error('Unexpected data format');
                }
            } catch (e) {
                console.error("Failed to search models:", e);
                const manualModel = prompt('自动获取失败，请手动输入模型名称:');
                if (manualModel) {
                    const select = document.getElementById('modelSelect');
                    select.innerHTML = `<option value="${manualModel}">${manualModel}</option>`;
                    select.value = manualModel;
                }
            } finally {
                btn.textContent = '搜索模型';
                btn.disabled = false;
            }
        }

        async function saveCurrentApiConfig() {
            const nameInput = document.getElementById('configNameInput').value.trim();
            if (!nameInput) {
                alert('请输入配置名称');
                return;
            }

            // 增加反馈
            const saveBtn = document.querySelector('.theme-action-btn[onclick="saveCurrentApiConfig()"]');
            if (saveBtn) saveBtn.style.opacity = '0.5';

            const url = document.getElementById('apiUrlInput').value;
            const key = document.getElementById('apiKeyInput').value;
            const model = document.getElementById('modelSelect').value;
            const temp = document.getElementById('tempSlider').value;

            console.log("Attempting to save config:", { name: nameInput, currentId: currentConfigId });

            try {
                let configToSave = apiConfigs.find(c => c.name === nameInput);

                if (configToSave) {
                    // 1. 更新同名配置
                    configToSave.url = url;
                    configToSave.key = key;
                    configToSave.model = model;
                    configToSave.temp = temp;
                    await dbPut('api_configs', configToSave);
                    currentConfigId = configToSave.id;
                    console.log("Updated existing config by name");
                } else if (currentConfigId && currentConfigId !== '' && currentConfigId !== 'default') {
                    // 2. 修改当前非默认配置的名称或内容
                    const currentConfig = apiConfigs.find(c => c.id === currentConfigId);
                    if (currentConfig) {
                        currentConfig.name = nameInput;
                        currentConfig.url = url;
                        currentConfig.key = key;
                        currentConfig.model = model;
                        currentConfig.temp = temp;
                        await dbPut('api_configs', currentConfig);
                        console.log("Renamed/Updated current config");
                    }
                } else {
                    // 3. 创建全新配置
                    const newId = Date.now().toString();
                    const newConfig = { id: newId, name: nameInput, url, key, model, temp };
                    await dbPut('api_configs', newConfig);
                    apiConfigs.push(newConfig);
                    currentConfigId = newId;
                    console.log("Created new config:", newId);
                }

                // 强制同步本地状态缓存
                safeLocalStorageSet('current_api_config_id', currentConfigId, true);
                
                // 重新加载并刷新 UI
                apiConfigs = await dbGetAll('api_configs');
                renderConfigDropdown();
                
                alert('API配置已保存');
                console.log("Save successful. All configs:", apiConfigs);
            } catch (e) {
                console.error("Critical Save Error:", e);
                alert('保存失败: ' + e.message);
            } finally {
                if (saveBtn) saveBtn.style.opacity = '1';
            }
        }

        // 微信选项卡切换
        function switchWechatTab(tab, element) {
            const chatList = document.getElementById('chatList');
            const contactsPage = document.getElementById('wechatContactsPage');
            const discoverPage = document.getElementById('wechatDiscoverPage');
            const mePage = document.getElementById('wechatMePage');
            const tagBar = document.getElementById('wechatTagBar');
            const searchBar = document.getElementById('wechatSearchBar');
            const navBar = document.querySelector('#wechatContainer .wechat-nav-bar');
            const bottomNav = document.querySelector('.wechat-bottom-nav');
            const navTitle = document.querySelector('#wechatContainer .wechat-nav-title');

            // 更新导航项激活状态
            document.querySelectorAll('.wechat-bottom-nav .wechat-nav-item').forEach(item => {
                item.classList.remove('active');
            });
            element.classList.add('active');

            // 默认隐藏所有内容区域
            chatList.style.display = 'none';
            contactsPage.style.display = 'none';
            if (discoverPage) discoverPage.style.display = 'none';
            mePage.style.display = 'none';
            
            // 默认显示搜索栏 (消息和通讯录页需要)
            searchBar.style.display = 'none';
            tagBar.style.display = 'none';
            
            // 默认显示导航栏
            if (navBar) navBar.style.display = 'flex';
            if (bottomNav) bottomNav.style.backgroundColor = '#fff';

            if (tab === 'messages') {
                chatList.style.display = 'block';
                searchBar.style.display = 'block';
                tagBar.style.display = 'flex';
                navTitle.textContent = 'Wechat';
                if (navBar) {
                    navBar.style.display = 'flex';
                    navBar.style.backgroundColor = '#fff';
                    navBar.style.borderBottom = '1px solid #f5f5f5';
                }
                renderChatList();
            } else if (tab === 'contacts') {
                contactsPage.style.display = 'block';
                searchBar.style.display = 'block';
                navTitle.textContent = '通讯录';
                if (navBar) {
                    navBar.style.display = 'flex';
                    navBar.style.backgroundColor = '#fff';
                    navBar.style.borderBottom = '1px solid #f5f5f5';
                }
                renderWechatContacts();
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
                // 需求2：“我”页面的底部导航栏的背景色和其他页面的底部导航栏的背景色一致统一白色
                if (bottomNav) {
                    bottomNav.style.backgroundColor = '#fff';
                }
                // 更新“我”页面的个人信息 - 独立于系统设置
                renderWechatMePage();
            }
            saveUIState();
        }

        // 渲染微信通讯录
        function renderWechatContacts(keyword = '') {
            const contactContainer = document.getElementById('wechatAddedContactsList');
            const groupContainer = document.getElementById('wechatAddedGroupsList');
            
            // 渲染联系人
            let filteredFriends = chatList;
            if (keyword) {
                filteredFriends = chatList.filter(f => getFriendDisplayName(f).toLowerCase().includes(keyword.toLowerCase()));
            }

            if (filteredFriends.length === 0) {
                contactContainer.innerHTML = '<div class="empty-state" style="padding: 20px; font-size: 13px;">暂无好友</div>';
            } else {
                let contactHtml = '';
                filteredFriends.forEach(friend => {
                    contactHtml += `
                        <div class="wechat-contact-item" onclick="openContactDetail(${friend.id})">
                            <img src="${friend.avatar || DEFAULT_AVATAR}" class="wechat-contact-avatar" alt="">
                            <div class="wechat-contact-name">${getFriendDisplayName(friend)}</div>
                        </div>
                    `;
                });
                contactContainer.innerHTML = contactHtml;
            }

            // 渲染群聊
            let filteredGroups = groupList;
            if (keyword) {
                filteredGroups = groupList.filter(g => g.name.toLowerCase().includes(keyword.toLowerCase()));
            }

            if (filteredGroups.length === 0) {
                groupContainer.innerHTML = '<div class="empty-state" style="padding: 20px; font-size: 13px;">暂无群聊</div>';
            } else {
                let groupHtml = '';
                filteredGroups.forEach(group => {
                    groupHtml += `
                        <div class="wechat-contact-item" onclick="alert('进入群聊：' + '${group.name}')">
                            <div class="wechat-contact-avatar" style="background: #e1e1e1; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">群</div>
                            <div class="wechat-contact-name">${group.name}</div>
                        </div>
                    `;
                });
                groupContainer.innerHTML = groupHtml;
            }
        }

        // 保存群聊列表
        function saveGroupListToStorage() {
            safeLocalStorageSet('wechat_group_list', JSON.stringify(groupList));
        }

        // 加载群聊列表
        function loadGroupListFromStorage() {
            const saved = localStorage.getItem('wechat_group_list');
            if (saved) {
                groupList = JSON.parse(saved);
            }
        }

        // 发起群聊
        function createGroupChat() {
            const groupName = prompt('请输入群聊名称:');
            if (groupName && groupName.trim()) {
                const newGroup = {
                    id: Date.now(),
                    name: groupName.trim(),
                    members: []
                };
                groupList.push(newGroup);
                saveGroupListToStorage();
                
                // 如果当前在通讯录页，刷新显示
                const activeTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item.active .wechat-nav-label');
                if (activeTab && activeTab.textContent === '通讯录') {
                    renderWechatContacts();
                }
                alert('群聊创建成功！已自动保存到通讯录。');
            }
            // 关闭菜单
            const menu = document.getElementById('addMenu');
            if (menu) menu.classList.remove('active');
        }

        // 打开微信页面
        function openWechat() {
            wechatVisible = true;
            document.querySelector('.phone-container').style.display = 'none';
            document.getElementById('wechatContainer').style.display = 'flex';
            updateTime();
            updateBattery();
            
            // 默认显示消息页
            const messagesTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item');
            switchWechatTab('messages', messagesTab);
            
            saveUIState();
        }

        // 联系人相关变量
        let contacts = [];
        let contactSelectMode = false;
        let selectedContacts = new Set();
        let editingContactId = null;
        let swipedContactId = null;

        // 打开联系人页面
        function openContacts() {
            document.querySelector('.phone-container').style.display = 'none';
            document.getElementById('contactsContainer').style.display = 'flex';
            updateTime();
            updateBattery();
            loadContactsFromStorage();
            renderContactsList();
            saveUIState();
        }

        // 关闭联系人页面
        function closeContacts() {
            document.getElementById('contactsContainer').style.display = 'none';
            document.querySelector('.phone-container').style.display = 'flex';
            saveUIState();
        }

        // 切换联系人选择模式
        function toggleContactSelectMode() {
            contactSelectMode = !contactSelectMode;
            selectedContacts.clear();
            
            const selectBtn = document.getElementById('contactsSelectBtn');
            if (selectBtn) {
                selectBtn.style.color = contactSelectMode ? '#000' : '#000';
            }
            
            updateDeleteButton();
            renderContactsList();
        }

        // 更新删除按钮状态
        function updateDeleteButton() {
            const deleteBtn = document.getElementById('deleteBottomBtn');
            if (deleteBtn) {
                if (contactSelectMode) {
                    deleteBtn.style.display = 'block';
                    deleteBtn.disabled = selectedContacts.size === 0;
                    deleteBtn.textContent = selectedContacts.size > 0 
                        ? `删除选中的 ${selectedContacts.size} 个联系人` 
                        : '删除选中的联系人';
                } else {
                    deleteBtn.style.display = 'none';
                }
            }
        }

        // 处理底部删除按钮点击
        function handleBottomDelete() {
            if (selectedContacts.size === 0) {
                alert('请先选择要删除的联系人');
                return;
            }
            showDeleteContactModal();
        }

        // 显示添加联系人模态框（旧版，改为打开新页面）
        function showAddContactModal() {
            openAddContactPage();
        }

        // 打开添加联系人页面
        function openAddContactPage() {
            editingContactId = null;
            document.getElementById('contactsContainer').style.display = 'none';
            document.getElementById('addContactContainer').style.display = 'flex';
            document.querySelector('.add-contact-nav-title').textContent = '新建联系人';
            document.getElementById('deleteContactBtnContainer').style.display = 'none';
            updateTime();
            updateBattery();
            clearAddContactForm();
            saveUIState();
        }

        // 打开联系人详情页面 (WeChat Profile)
        let currentDetailFriendId = null;
        function openContactDetail(friendId) {
            const friend = chatList.find(f => f.id === friendId);
            if (!friend) return;
            const contact = contacts.find(c => c.id === friend.contactId);
            if (!contact) return;

            currentDetailFriendId = friendId;
            document.getElementById('detailAvatar').src = contact.avatar || DEFAULT_AVATAR;
            
            const remarkName = friend.remark || contact.name || contact.netName || '无名氏';
            document.getElementById('detailRemark').textContent = remarkName;

            // 如果没设置备注这一行不显示 (昵称：网名)
            const nicknameRow = document.getElementById('detailNicknameRow');
            if (friend.remark) {
                nicknameRow.style.display = 'block';
                document.getElementById('detailNickname').textContent = contact.netName || '未设置';
            } else {
                nicknameRow.style.display = 'none';
            }

            document.getElementById('detailWechatId').textContent = contact.wechat || '未设置';
            document.getElementById('detailRegion').textContent = contact.region || '未设置';
            document.getElementById('detailGroup').textContent = contact.category || '未设置';

            // 视频号
            const videoRow = document.getElementById('detailVideoChannelRow');
            if (contact.videoChannel) {
                videoRow.style.display = 'flex';
                document.getElementById('detailVideoChannelName').textContent = contact.videoChannel;
            } else {
                videoRow.style.display = 'none';
            }

            document.getElementById('contactDetailPage').style.display = 'flex';
            document.body.classList.add('contact-detail-active');
            document.getElementById('wechatContainer').style.display = 'none';
            
            // 检查内容高度，决定是否允许滚动
            setTimeout(() => {
                const detailPage = document.getElementById('contactDetailPage');
                const content = detailPage.querySelector('.contact-detail-content');
                if (content) {
                    if (content.scrollHeight <= content.clientHeight) {
                        content.style.overflowY = 'hidden';
                    } else {
                        content.style.overflowY = 'auto';
                    }
                }
            }, 50);

            saveUIState();
        }

        function closeContactDetail() {
            document.getElementById('contactDetailPage').style.display = 'none';
            document.body.classList.remove('contact-detail-active');
            document.getElementById('wechatContainer').style.display = 'block';
            // 不在关闭时立即清除 ID，以便从聊天信息页返回
            saveUIState();
        }

        function goToChatFromDetail() {
            if (currentDetailFriendId) {
                const id = currentDetailFriendId;
                closeContactDetail();
                openChat(id);
            }
        }

        let isOpenedFromContactDetail = false;
        function openContactDetailMenu() {
            if (currentDetailFriendId) {
                const friend = chatList.find(f => f.id === currentDetailFriendId);
                if (friend) {
                    isOpenedFromContactDetail = true;
                    // 进入原有的聊天信息设置页或系统编辑页
                    closeContactDetail();
                    openChat(friend.id);
                    openChatInfo();
                }
            }
        }

        // 打开编辑联系人页面
        function openEditContactPage(id) {
            const contact = contacts.find(c => c.id === id);
            if (!contact) return;

            editingContactId = id;
            document.getElementById('contactsContainer').style.display = 'none';
            document.getElementById('addContactContainer').style.display = 'flex';
            document.querySelector('.add-contact-nav-title').textContent = '编辑联系人';
            document.getElementById('deleteContactBtnContainer').style.display = 'block';
            updateTime();
            updateBattery();
            
            // 填充表单数据
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

        // 实时同步联系人编辑内容
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
            contact.nickname = nickname;
            contact.netName = netName;
            contact.wechat = wechat;
            contact.phoneNumber = phoneNumber;
            contact.region = region;
            contact.signature = signature;
            contact.phone = wechat || nickname || netName || '未设置';
            if (category !== '__custom__') contact.category = category;
            contact.design = design;

            // 实时更新可能存在的聊天列表显示
            const friend = chatList.find(f => f.contactId === editingContactId);
            if (friend) {
                friend.name = name || friend.name;
                // 如果当前正在与该联系人聊天，更新标题
                if (currentChatFriendId === friend.id) {
                    document.getElementById('chatPartnerName').textContent = getFriendDisplayName(friend);
                }
            }
        }

        // 关闭添加联系人页面
        function closeAddContactPage() {
            document.getElementById('addContactContainer').style.display = 'none';
            document.getElementById('contactsContainer').style.display = 'block';
            saveUIState();
        }

        // 清空添加联系人表单
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

        // 上传联系人头像
        function uploadContactAvatar() {
            document.getElementById('avatarUploadModal').classList.add('active');
        }

        // 从相册选择头像
        function selectAvatarFromAlbum() {
            document.getElementById('avatarFileInput').click();
        }

        // 处理头像文件选择
        function handleAvatarFileSelect(event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('newContactAvatar').src = e.target.result;
                    closeAvatarUploadModal();
                };
                reader.readAsDataURL(file);
            }
        }

        // 显示头像URL输入
        function showAvatarUrlInput() {
            document.getElementById('avatarUrlInputContainer').style.display = 'block';
            document.getElementById('avatarUrlInput').focus();
        }

        // 确认头像URL
        function confirmAvatarUrl() {
            const url = document.getElementById('avatarUrlInput').value.trim();
            if (url) {
                document.getElementById('newContactAvatar').src = url;
                closeAvatarUploadModal();
            }
        }

        // 关闭头像上传模态框
        function closeAvatarUploadModal() {
            document.getElementById('avatarUploadModal').classList.remove('active');
            document.getElementById('avatarUrlInputContainer').style.display = 'none';
            document.getElementById('avatarUrlInput').value = '';
        }

        // 保存新联系人
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

            if (!name) {
                alert('请输入真名');
                return;
            }

            // 增加点击反馈
            const saveBtn = document.querySelector('.add-contact-nav-right');
            if (saveBtn) saveBtn.style.opacity = '0.5';

            setTimeout(() => {
                if (editingContactId) {
                    // 编辑现有联系人
                    const contact = contacts.find(c => c.id === editingContactId);
                    if (contact) {
                        contact.name = name;
                        contact.phone = wechat || nickname || netName || '未设置';
                        contact.avatar = avatar || '';
                        contact.nickname = nickname;
                        contact.netName = netName;
                        contact.wechat = wechat;
                        contact.phoneNumber = phoneNumber;
                        contact.region = region;
                        contact.signature = signature;
                        contact.category = category;
                        contact.design = design;
                    }
                } else {
                    // 添加新联系人
                    const newContact = {
                        id: Date.now(),
                        name: name,
                        phone: wechat || nickname || netName || '未设置',
                        avatar: avatar || '',
                        nickname: nickname,
                        netName: netName,
                        wechat: wechat,
                        phoneNumber: phoneNumber,
                        region: region,
                        signature: signature,
                        category: category,
                        design: design
                    };
                    contacts.push(newContact);
                }

                if (saveContactsToStorage(false)) {
                    alert('保存成功');
                    closeAddContactPage();
                    renderContactsList();
                }
                if (saveBtn) saveBtn.style.opacity = '1';
            }, 50);
        }

        // 删除单个联系人
        function deleteSingleContact() {
            if (!editingContactId) return;
            
            if (confirm('确定要删除这个联系人吗?')) {
                contacts = contacts.filter(c => c.id !== editingContactId);
                saveContactsToStorage();
                closeAddContactPage();
                renderContactsList();
            }
        }

        // 显示编辑联系人模态框
        function showEditContactModal(id) {
            const contact = contacts.find(c => c.id === id);
            if (!contact) return;

            editingContactId = id;
            document.getElementById('contactModalTitle').textContent = '编辑联系人';
            document.getElementById('contactNameInput').value = contact.name;
            document.getElementById('contactPhoneInput').value = contact.phone;
            document.getElementById('contactAvatarInput').value = contact.avatar || '';
            document.getElementById('contactModal').classList.add('active');
        }

        // 保存联系人
        function saveContact() {
            const name = document.getElementById('contactNameInput').value.trim();
            const phone = document.getElementById('contactPhoneInput').value.trim();
            const avatar = document.getElementById('contactAvatarInput').value.trim();

            if (!name) {
                alert('请输入姓名');
                return;
            }

            if (!phone) {
                alert('请输入电话号码');
                return;
            }

            if (editingContactId) {
                const contact = contacts.find(c => c.id === editingContactId);
                if (contact) {
                    contact.name = name;
                    contact.phone = phone;
                    contact.avatar = avatar;
                }
            } else {
                const newContact = {
                    id: Date.now(),
                    name: name,
                    phone: phone,
                    avatar: avatar
                };
                contacts.push(newContact);
            }

            if (saveContactsToStorage(false)) {
                alert('保存成功');
                renderContactsList();
                closeContactModal();
            }
        }

        // 关闭联系人模态框
        function closeContactModal() {
            document.getElementById('contactModal').classList.remove('active');
        }

        // 切换联系人选中状态
        function toggleContactSelection(id, event) {
            if (event) {
                event.stopPropagation();
            }
            if (selectedContacts.has(id)) {
                selectedContacts.delete(id);
            } else {
                selectedContacts.add(id);
            }
            updateDeleteButton();
            renderContactsList();
        }

        // 处理联系人点击
        function handleContactClick(id) {
            if (contactSelectMode) {
                toggleContactSelection(id);
            } else {
                openEditContactPage(id);
            }
        }

        // 显示删除确认模态框
        function showDeleteContactModal() {
            if (selectedContacts.size === 0) {
                alert('请先选择要删除的联系人');
                return;
            }
            document.getElementById('deleteContactText').textContent = `确定要删除选中的 ${selectedContacts.size} 个联系人吗？`;
            document.getElementById('deleteContactModal').classList.add('active');
        }

        // 关闭删除确认模态框
        function closeDeleteContactModal() {
            document.getElementById('deleteContactModal').classList.remove('active');
            if (!contactSelectMode) {
                selectedContacts.clear();
            }
        }

        // 确认删除联系人
        function confirmDeleteContact() {
            contacts = contacts.filter(c => !selectedContacts.has(c.id));
            selectedContacts.clear();
            saveContactsToStorage();
            updateDeleteButton();
            renderContactsList();
            closeDeleteContactModal();
        }

        // 微信个人资料相关
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

        function loadRealNameInfo() {
            const saved = localStorage.getItem('mimi_real_name_info');
            if (saved) {
                realNameInfo = { ...realNameInfo, ...JSON.parse(saved) };
            }
        }

        function saveRealNameInfo() {
            safeLocalStorageSet('mimi_real_name_info', JSON.stringify(realNameInfo));
        }

        function loadWechatUserInfo() {
            const saved = localStorage.getItem('wechat_user_info');
            if (saved) {
                const data = JSON.parse(saved);
                // 合并数据，确保新增加的字段在旧存档中也能初始化
                wechatUserInfo = { ...wechatUserInfo, ...data };
            }
        }

        function saveWechatUserInfo() {
            safeLocalStorageSet('wechat_user_info', JSON.stringify(wechatUserInfo));
        }

        function renderWechatMePage() {
            document.getElementById('wechatMeNickname').textContent = wechatUserInfo.nickname;
            document.getElementById('wechatMeID').textContent = '微信号：' + wechatUserInfo.wechatId;
            document.getElementById('wechatMeAvatar').src = wechatUserInfo.avatar;
        }

        function openPersonalInfo() {
            document.getElementById('personalInfoContainer').style.display = 'flex';
            document.getElementById('editWechatAvatar').src = wechatUserInfo.avatar;
            document.getElementById('editWechatNickname').textContent = wechatUserInfo.nickname;
            document.getElementById('editWechatWechatId').textContent = wechatUserInfo.wechatId;
            document.getElementById('editWechatPhone').textContent = wechatUserInfo.phone;
            document.getElementById('editWechatRegion').textContent = wechatUserInfo.region;
            document.getElementById('editWechatPatPat').textContent = wechatUserInfo.patPat;
            document.getElementById('editWechatSignature').textContent = wechatUserInfo.signature;
            
            // 同步时间
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            document.querySelectorAll('.wechat-time-sync').forEach(el => el.textContent = timeStr);
            saveUIState();
        }

        function closePersonalInfo() {
            document.getElementById('personalInfoContainer').style.display = 'none';
            renderWechatMePage();
            saveUIState();
        }

        function openServicePage() {
            document.getElementById('servicePageContainer').style.display = 'flex';
            document.body.classList.add('service-page-active');
            updateTime();
            saveUIState();
        }

        function closeServicePage() {
            document.getElementById('servicePageContainer').style.display = 'none';
            document.body.classList.remove('service-page-active');
            saveUIState();
        }

        // 微信存储空间相关
        function openWechatStorage() {
            document.getElementById('wechatStorageContainer').style.display = 'flex';
            document.getElementById('storageScanning').style.display = 'flex';
            document.getElementById('storageDetail').style.display = 'none';

            // 模拟计算过程
            setTimeout(() => {
                calculateStorage();
            }, 1500);

            updateTime();
            saveUIState();
        }

        function closeWechatStorage() {
            document.getElementById('wechatStorageContainer').style.display = 'none';
            saveUIState();
        }

        async function calculateStorage() {
            // 1. 获取网页文件真实大小
            let appFileSize = 268815; // 默认值
            try {
                const response = await fetch(window.location.href);
                const blob = await response.blob();
                appFileSize = blob.size;
            } catch (e) {
                console.warn("无法动态获取文件大小，使用预估值", e);
            }
            
            // 2. 获取 localStorage 真实占用空间
            let lsBytes = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const val = localStorage.getItem(key);
                lsBytes += (key.length + val.length) * 2; // UTF-16 编码估算
            }

            // 3. 获取 IndexedDB 真实占用空间
            let idbBytes = 0;
            const stores = ['wallpapers', 'icons', 'fonts', 'themes', 'api_configs', 'settings'];
            const idbData = {};
            for (const store of stores) {
                const data = await dbGetAll(store);
                idbData[store] = data;
                idbBytes += JSON.stringify(data).length * 2;
            }

            // 分类统计
            // A. 聊天相关 (LocalStorage 中的通讯录、聊天记录)
            let chatBytes = 0;
            ['wechat_chat_list', 'wechat_group_list', 'wechat_chat_histories', 'contacts'].forEach(key => {
                const val = localStorage.getItem(key);
                if (val) chatBytes += (key.length + val.length) * 2;
            });

            // B. 资源相关 (IndexedDB 中的多媒体资源)
            let resourceBytes = 0;
            ['wallpapers', 'icons', 'fonts', 'themes'].forEach(store => {
                resourceBytes += JSON.stringify(idbData[store] || []).length * 2;
            });

            // C. 其他 (设置、API、UI状态等)
            const otherBytes = Math.max(0, lsBytes + idbBytes - chatBytes - resourceBytes);

            // 转换单位为 MB
            const toMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);
            
            const appMB = parseFloat(toMB(appFileSize));
            const chatMB = parseFloat(toMB(chatBytes));
            const resMB = parseFloat(toMB(resourceBytes));
            const othersMB = parseFloat(toMB(otherBytes));
            
            const totalMB = (parseFloat(appMB) + parseFloat(chatMB) + parseFloat(resMB) + parseFloat(othersMB)).toFixed(2);

            // 计算占比
            const getPct = (mb) => (totalMB > 0 ? (mb / totalMB * 100).toFixed(1) : 0);
            const chatPct = getPct(chatMB);
            const resPct = getPct(resMB);
            const appPct = getPct(appMB);
            const otherPct = (100 - parseFloat(chatPct) - parseFloat(resPct) - parseFloat(appPct)).toFixed(1);

            // 更新 UI
            document.getElementById('totalStorageSize').textContent = totalMB + ' MB';
            document.getElementById('size-chat').textContent = `${chatMB} MB (${chatPct}%)`;
            document.getElementById('size-resources').textContent = `${resMB} MB (${resPct}%)`;
            document.getElementById('size-app').textContent = `${appMB} MB (${appPct}%)`;
            document.getElementById('size-others').textContent = `${othersMB} MB (${otherPct}%)`;

            // 生成比例条
            const storageBar = document.getElementById('storageBar');
            storageBar.innerHTML = `
                <div class="storage-bar-item" style="width: ${chatPct}%; background: #07c160;"></div>
                <div class="storage-bar-item" style="width: ${resPct}%; background: #ff9800;"></div>
                <div class="storage-bar-item" style="width: ${appPct}%; background: #2196f3;"></div>
                <div class="storage-bar-item" style="width: ${otherPct}%; background: #9e9e9e;"></div>
            `;

            document.getElementById('storageScanning').style.display = 'none';
            document.getElementById('storageDetail').style.display = 'block';
        }

        function clearWechatCache() {
            if (confirm('确定要清除缓存吗？\n清除缓存将重置 UI 状态，但不会删除聊天记录和资源文件。')) {
                // 清除 UI 状态缓存
                sessionStorage.removeItem('mimi_ui_state');
                alert('缓存已清理，请重新计算存储空间');
                calculateStorage();
            }
        }

        async function deleteWechatData() {
            if (confirm('警告：清除数据将彻底清除网页内微信 App 的所有内容，包括所有联系人、群聊、聊天记录、账号信息以及个性化设置！此操作不可恢复。确定要执行吗？')) {
                // 标记为已卸载
                localStorage.setItem('wechat_app_uninstalled', 'true');
                
                // 立即隐藏主屏幕上的图标
                const wechatApp = document.getElementById('app1');
                if (wechatApp && wechatApp.parentElement) {
                    wechatApp.parentElement.style.display = 'none';
                }

                // 清除所有相关的本地存储
                localStorage.removeItem('wechat_user_info');
                localStorage.removeItem('wechat_chat_list');
                localStorage.removeItem('wechat_group_list');
                localStorage.removeItem('wechat_chat_histories');
                localStorage.removeItem('contacts');
                localStorage.removeItem('customCategories');
                
                // 重置变量
                contacts = [];
                chatList = [];
                groupList = [];
                chatHistories = {};
                wechatUserInfo = {
                    avatar: '',
                    nickname: '未设置网名',
                    wechatId: '未设置',
                    phone: '未设置',
                    region: '未设置',
                    patPat: '未设置',
                    signature: '未设置'
                };

                alert('所有数据已删除，微信App已彻底卸载并退出');
                
                // 关闭页面并重置
                closeWechatStorage();
                closeWechatSettings();
                goBack();
                
                // 重新渲染相关页面
                renderChatList();
                renderWechatMePage();
            }
        }

        // 微信设置页面相关函数
        function openWechatSettings() {
            document.getElementById('wechatSettingsContainer').style.display = 'flex';
            updateTime();
            saveUIState();
        }

        function closeWechatSettings() {
            document.getElementById('wechatSettingsContainer').style.display = 'none';
            saveUIState();
        }

        function openWechatDisplaySettings() {
            document.getElementById('wechatDisplaySettingsContainer').style.display = 'flex';
            updateTime();
            saveUIState();
        }

        function closeWechatDisplaySettings() {
            document.getElementById('wechatDisplaySettingsContainer').style.display = 'none';
            saveUIState();
        }

        // 微信账号与安全相关函数
        function openWechatAccountSwitch() {
            const container = document.getElementById('wechatAccountSwitchContainer');
            if (!container) {
                console.error('Account switch container not found');
                return;
            }

            // 隐藏可能覆盖的页面
            const settingsContainer = document.getElementById('wechatSettingsContainer');
            if (settingsContainer) settingsContainer.style.display = 'none';
            
            // 确保微信容器显示（如果它是父容器的一部分）
            const wechatContainer = document.getElementById('wechatContainer');
            if (wechatContainer) wechatContainer.style.display = 'flex';

            // 填充当前账号信息
            const avatarImg = document.getElementById('switchCurrentAvatar');
            const nicknameEl = document.getElementById('switchCurrentNickname');
            const idEl = document.getElementById('switchCurrentID');

            if (avatarImg) avatarImg.src = wechatUserInfo.avatar || '';
            if (nicknameEl) nicknameEl.textContent = wechatUserInfo.nickname || '未设置网名';
            if (idEl) idEl.textContent = '微信号：' + (wechatUserInfo.wechatId || '未设置');

            // 强制设置为 flex 并提升层级
            container.style.display = 'flex';
            container.style.zIndex = '10305'; // 确保在所有页面之上
            
            updateTime();
            saveUIState();
        }

        function closeWechatAccountSwitch() {
            const container = document.getElementById('wechatAccountSwitchContainer');
            if (container) container.style.display = 'none';
            
            // 返回设置页面
            const settingsContainer = document.getElementById('wechatSettingsContainer');
            if (settingsContainer) settingsContainer.style.display = 'flex';
            
            saveUIState();
        }

        function searchWechatSettings() {
            const keyword = document.getElementById('wechatSettingsSearchInput').value.trim().toLowerCase();
            const items = document.querySelectorAll('.setting-item');
            
            items.forEach(item => {
                const text = item.getAttribute('data-search') || item.textContent;
                if (text.toLowerCase().includes(keyword)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });

            // 隐藏没有可见子项的分组及其上方的分割线
            const groups = document.querySelectorAll('#wechatSettingsContainer .me-rounded-box');
            groups.forEach(group => {
                const visibleItems = group.querySelectorAll('.setting-item[style*="display: flex"]');
                const hasVisibleItems = visibleItems.length > 0 || keyword === '';
                
                group.style.display = hasVisibleItems ? 'block' : 'none';
                
                // 尝试找到紧邻该 group 前面的 divider
                let prev = group.previousElementSibling;
                if (prev && prev.classList.contains('me-divider')) {
                    prev.style.display = hasVisibleItems ? 'block' : 'none';
                }
            });
        }

        function changeWechatAvatar() {
            currentImageId = 'editWechatAvatar';
            const originalConfirmUrl = window.confirmUrl;
            
            // 临时重写确认函数以处理微信头像
            window.confirmUrl = function() {
                const url = document.getElementById('urlInput').value.trim();
                if (url) {
                    wechatUserInfo.avatar = url;
                    document.getElementById('editWechatAvatar').src = url;
                    saveWechatUserInfo();
                    closeModal();
                }
                window.confirmUrl = originalConfirmUrl; // 恢复
            };

            const originalHandleFileSelect = window.handleFileSelect;
            window.handleFileSelect = function(event) {
                const file = event.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const src = e.target.result;
                        wechatUserInfo.avatar = src;
                        document.getElementById('editWechatAvatar').src = src;
                        saveWechatUserInfo();
                        closeModal();
                    };
                    reader.readAsDataURL(file);
                }
                window.handleFileSelect = originalHandleFileSelect; // 恢复
            };

            document.getElementById('urlInputContainer').style.display = 'none';
            document.getElementById('imageModal').classList.add('active');
        }

        function editWechatInfo(field, label) {
            const originalConfirmText = window.confirmText;
            const input = document.getElementById('textInput');
            
            document.querySelector('#textModal .modal-title').textContent = '修改' + label;
            input.value = wechatUserInfo[field] === '未设置' ? '' : wechatUserInfo[field];
            document.getElementById('textModal').classList.add('active');

            window.confirmText = function() {
                const newValue = input.value.trim();
                if (newValue) {
                    wechatUserInfo[field] = newValue;
                    const displayId = 'editWechat' + field.charAt(0).toUpperCase() + field.slice(1);
                    const displayEl = document.getElementById(displayId);
                    if (displayEl) displayEl.textContent = newValue;
                    
                    // 立即更新“我”页面的显示
                    renderWechatMePage();
                    saveWechatUserInfo();
                }
                closeModal();
                window.confirmText = originalConfirmText; // 恢复
                document.querySelector('#textModal .modal-title').textContent = '编辑文字';
            };
        }

        function editAccountInfo(field, label) {
            const originalConfirmText = window.confirmText;
            const input = document.getElementById('textInput');
            
            document.querySelector('#textModal .modal-title').textContent = '修改' + label;
            
            let currentValue = wechatUserInfo[field] || (field === 'country' ? '中国' : '未设置');
            input.value = currentValue === '未设置' ? '' : currentValue;
            document.getElementById('textModal').classList.add('active');

            window.confirmText = function() {
                const newValue = input.value.trim();
                if (newValue) {
                    wechatUserInfo[field] = newValue;
                    
                    // 同步所有相关的显示元素
                    document.querySelectorAll('#info-' + field).forEach(el => {
                        el.textContent = newValue;
                    });
                    
                    saveWechatUserInfo();
                }
                closeModal();
                window.confirmText = originalConfirmText;
                document.querySelector('#textModal .modal-title').textContent = '编辑文字';
            };
        }
        
        window.editWechatAccountInfo = editAccountInfo;

        // 微信主页搜索功能
        function searchWechat() {
            const keyword = document.getElementById('wechatSearchInput').value.trim().toLowerCase();
            const activeTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item.active .wechat-nav-label').textContent;
            
            if (activeTab === '消息') {
                renderChatList(keyword);
            } else if (activeTab === '通讯录') {
                renderWechatContacts(keyword);
            }
        }

        // 搜索联系人
        function searchContactsList() {
            const keyword = document.getElementById('contactsSearchInput').value.trim().toLowerCase();
            renderContactsList(keyword);
        }

        // 渲染联系人列表
        function renderContactsList(searchKeyword = '') {
            const listContainer = document.getElementById('contactsListContainer');
            
            let filteredContacts = contacts;
            if (searchKeyword) {
                filteredContacts = contacts.filter(c => 
                    c.name.toLowerCase().includes(searchKeyword) || 
                    c.phone.includes(searchKeyword)
                );
            }

            if (filteredContacts.length === 0) {
                listContainer.innerHTML = '<div class="empty-state">暂无联系人</div>';
                return;
            }

            let html = '';
            filteredContacts.forEach(contact => {
                const isSelected = selectedContacts.has(contact.id);
                
                html += `<div class="contact-item ${contactSelectMode ? 'selecting' : ''}" 
                              data-id="${contact.id}"
                              onclick="handleContactClick(${contact.id})">`;
                
                if (contactSelectMode) {
                    html += `<div class="contact-checkbox ${isSelected ? 'checked' : ''}" 
                                  onclick="toggleContactSelection(${contact.id}, event)"></div>`;
                }
                
                html += `<img src="${contact.avatar || DEFAULT_AVATAR}" class="contact-avatar" alt="头像">`;
                html += '<div class="contact-info">';
                html += `<div class="contact-name">${contact.name}</div>`;
                html += `<div class="contact-phone">${contact.phone}</div>`;
                html += '</div>';
                
                if (!contactSelectMode) {
                    html += `<svg class="contact-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"/>
                             </svg>`;
                }
                
                html += '</div>';
            });

            listContainer.innerHTML = html;
        }

        // 保存联系人到本地存储
        function saveContactsToStorage(silent = true) {
            return safeLocalStorageSet('contacts', JSON.stringify(contacts), silent);
        }

        // 从本地存储加载联系人
        function loadContactsFromStorage() {
            const saved = localStorage.getItem('contacts');
            if (saved) {
                contacts = JSON.parse(saved);
            }
        }

        // 返回主页
        function goBack() {
            wechatVisible = false;
            document.getElementById('wechatContainer').style.display = 'none';
            document.querySelector('.phone-container').style.display = 'flex';
            saveUIState();
        }

        // 切换添加菜单
        function toggleAddMenu(event) {
            event.stopPropagation();
            const menu = document.getElementById('addMenu');
            menu.classList.toggle('active');
        }

        // 微信添加好友相关变量
        let selectedFriendContactId = null;

        // 显示添加好友模态框
        function showAddFriendModal() {
            document.getElementById('addMenu').classList.remove('active');
            
            // 加载联系人数据
            loadContactsFromStorage();
            
            // 检查是否有联系人
            if (contacts.length === 0) {
                alert('请先去联系人页面添加联系人');
                return;
            }
            
            // 显示模态框并渲染联系人列表
            document.getElementById('addFriendModal').classList.add('active');
            renderFriendContactsList();
        }

        // 渲染添加好友的联系人列表
        function renderFriendContactsList(searchKeyword = '') {
            const listContainer = document.getElementById('friendContactsList');
            
            let filteredContacts = contacts;
            if (searchKeyword) {
                filteredContacts = contacts.filter(c => 
                    c.name.toLowerCase().includes(searchKeyword) || 
                    (c.phone && c.phone.includes(searchKeyword))
                );
            }

            if (filteredContacts.length === 0) {
                listContainer.innerHTML = '<div class="empty-state" style="padding: 20px;">没有找到联系人</div>';
                return;
            }

            let html = '';
            filteredContacts.forEach(contact => {
                const isSelected = selectedFriendContactId === contact.id;
                html += `<div class="contact-item" style="cursor: pointer; background: ${isSelected ? '#F0F0F0' : '#fff'};" onclick="selectFriendContact(${contact.id})">`;
                html += `<img src="${contact.avatar || DEFAULT_AVATAR}" class="contact-avatar" alt="头像">`;
                html += '<div class="contact-info">';
                html += `<div class="contact-name">${contact.name}</div>`;
                html += `<div class="contact-phone">${contact.phone || '未设置'}</div>`;
                html += '</div>';
                if (isSelected) {
                    html += `<svg viewBox="0 0 24 24" fill="none" stroke="#07C160" stroke-width="2" style="width: 24px; height: 24px;">
                                <polyline points="20 6 9 17 4 12"/>
                             </svg>`;
                }
                html += '</div>';
            });

            listContainer.innerHTML = html;
        }

        // 选择联系人
        function selectFriendContact(contactId) {
            selectedFriendContactId = contactId;
            renderFriendContactsList(document.getElementById('friendSearchInput').value.trim().toLowerCase());
        }

        // 搜索好友联系人
        function searchFriendContacts() {
            const keyword = document.getElementById('friendSearchInput').value.trim().toLowerCase();
            renderFriendContactsList(keyword);
        }

        // 从联系人添加好友
        function addFriendFromContact() {
            if (!selectedFriendContactId) {
                alert('请选择一个联系人');
                return;
            }

            const contact = contacts.find(c => c.id === selectedFriendContactId);
            if (!contact) {
                alert('联系人不存在');
                return;
            }

            // 检查是否已经添加过
            const alreadyAdded = chatList.some(f => f.contactId === contact.id);

            if (alreadyAdded) {
                alert('该联系人已经是你的好友了');
                return;
            }

            const friend = {
                id: Date.now(),
                contactId: contact.id,
                name: contact.name,
                avatar: contact.avatar || '',
                message: '我通过了你的朋友验证请求，现在我们可以开始聊天了',
                time: formatTime(new Date()),
                isPinned: false
            };

            chatList.push(friend);
            saveChatListToStorage();
            
            const activeTab = document.querySelector('.wechat-bottom-nav .wechat-nav-item.active .wechat-nav-label').textContent;
            if (activeTab === '消息') {
                renderChatList();
            } else if (activeTab === '通讯录') {
                renderWechatContacts();
            }
            
            closeWechatModal();
        }

        // 关闭微信模态框
        function closeWechatModal() {
            document.getElementById('addFriendModal').classList.remove('active');
            document.getElementById('friendSearchInput').value = '';
            selectedFriendContactId = null;
        }

        // 格式化时间
        function formatTime(date) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            if (messageDate.getTime() === today.getTime()) {
                return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            } else {
                return `${date.getMonth() + 1}月${date.getDate()}日`;
            }
        }

        // 保存聊天列表到本地存储
        function saveChatListToStorage() {
            safeLocalStorageSet('wechat_chat_list', JSON.stringify(chatList));
        }

        // 从本地存储加载聊天列表
        function loadChatListFromStorage() {
            const saved = localStorage.getItem('wechat_chat_list');
            if (saved) {
                chatList = JSON.parse(saved);
            }
        }

        // 渲染聊天列表
        function renderChatList(searchKeyword = '') {
            const container = document.getElementById('chatList');
            
            let filteredList = chatList;
            if (searchKeyword) {
                filteredList = chatList.filter(friend => {
                    const nameMatch = getFriendDisplayName(friend).toLowerCase().includes(searchKeyword);
                    const msgMatch = friend.message.toLowerCase().includes(searchKeyword);
                    return nameMatch || msgMatch;
                });
            }

            if (filteredList.length === 0) {
                container.innerHTML = searchKeyword ? '<div class="empty-state">未找到匹配的聊天</div>' : '<div class="empty-state">请添加朋友开始聊天</div>';
                return;
            }

            const pinned = filteredList.filter(f => f.isPinned);
            const others = filteredList.filter(f => !f.isPinned);

            let html = '';

            // 渲染置顶列表
            pinned.forEach((friend, index) => {
                // 如果是最后一个置顶项，且后面还有非置顶项，则添加间距类
                const isLastPinned = (index === pinned.length - 1 && others.length > 0);
                html += renderChatItem(friend, true, isLastPinned);
            });

            // 渲染普通列表
            others.forEach(friend => {
                html += renderChatItem(friend, false);
            });

            container.innerHTML = html;
            
            // 添加滑动事件监听
            addSwipeListeners();
        }

        function renderChatItem(friend, isPinned) {
            let html = `<div class="chat-item-wrapper">`;
            
            // 聊天内容层
            html += `<div class="chat-item ${isPinned ? 'pinned' : ''}" 
                             data-id="${friend.id}" 
                             onclick="openChat(${friend.id})">`;
            html += `<img src="${friend.avatar || ''}" class="chat-avatar" alt="头像">`;
            html += '<div class="chat-content">';
            html += '<div class="chat-header">';
            html += `<span class="chat-name">${getFriendDisplayName(friend)}</span>`;
            html += `<span class="chat-time">${friend.time}</span>`;
            html += '</div>';
            html += `<div class="chat-message">${friend.message}</div>`;
            html += '</div>';
            html += '</div>'; // end chat-item

            // 操作按钮层
            html += `<div class="chat-actions">
                        <div class="chat-action-btn pin" onclick="togglePin(${friend.id}, event)">${isPinned ? '取消置顶' : '置顶'}</div>
                        <div class="chat-action-btn delete" onclick="deleteChat(${friend.id}, event)">删除</div>
                     </div>`;
            
            html += `</div>`; // end chat-item-wrapper
            return html;
        }

        // 删除聊天
        function deleteChat(id, event) {
            if (event) event.stopPropagation();
            if (confirm('确定要删除该聊天吗？')) {
                chatList = chatList.filter(c => c.id !== id);
                saveChatListToStorage();
                renderChatList();
            }
        }

        // 添加滑动监听
        function addSwipeListeners() {
            const items = document.querySelectorAll('.chat-item');
            items.forEach(item => {
                let startX = 0;
                let startY = 0;
                let currentX = 0;
                let isSwiping = false;
                const maxSwipe = -140; // 两个按钮宽度的负值
                
                item.addEventListener('touchstart', (e) => {
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                    item.style.transition = 'none';
                    
                    // 关闭其他已打开的项
                    document.querySelectorAll('.chat-item').forEach(otherItem => {
                        if (otherItem !== item && otherItem.style.transform && otherItem.style.transform !== 'translateX(0px)') {
                            otherItem.style.transition = 'transform 0.3s ease';
                            otherItem.style.transform = 'translateX(0)';
                        }
                    });
                }, { passive: true });

                item.addEventListener('touchmove', (e) => {
                    const touch = e.touches[0];
                    const diffX = touch.clientX - startX;
                    const diffY = touch.clientY - startY;

                    // 只响应向左滑动，且水平移动大于垂直移动
                    if (Math.abs(diffX) > Math.abs(diffY)) {
                        isSwiping = true;
                        // 向左滑 diffX 为负
                        if (diffX < 0) {
                            currentX = diffX;
                            // 增加阻尼效果
                            if (currentX < maxSwipe) {
                                currentX = maxSwipe + (currentX - maxSwipe) * 0.3;
                            }
                        } else {
                            // 向右滑（如果已经打开状态，可以右滑关闭）
                            currentX = diffX;
                            if (currentX > 0) currentX = 0;
                        }
                        item.style.transform = `translateX(${currentX}px)`;
                    }
                }, { passive: true });

                item.addEventListener('touchend', (e) => {
                    if (!isSwiping) return;
                    
                    item.style.transition = 'transform 0.3s ease';
                    
                    // 如果滑动超过一半，则完全展开，否则回弹
                    if (currentX < maxSwipe / 2) {
                        item.style.transform = `translateX(${maxSwipe}px)`;
                    } else {
                        item.style.transform = 'translateX(0)';
                    }
                    
                    currentX = 0;
                    isSwiping = false;
                });
            });
        }

        // 切换置顶状态
        function togglePin(id, event) {
            if (event) event.stopPropagation();
            const friend = chatList.find(f => f.id === id);
            if (friend) {
                friend.isPinned = !friend.isPinned;
                saveChatListToStorage();
                renderChatList();
            }
        }

        // 聊天相关变量
        let currentChatFriendId = null;
        let chatHistories = {}; // 存储每个好友的聊天记录
        let longPressTimer = null;
        let currentLongPressedMsg = null;

        // 处理消息长按
        function setupLongPress() {
            const chatMessages = document.getElementById('chatMessages');
            
            // 禁用系统默认菜单
            chatMessages.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });

            chatMessages.addEventListener('touchstart', (e) => {
                const bubble = e.target.closest('.msg-bubble');
                if (!bubble) return;
                
                longPressTimer = setTimeout(() => {
                    showMsgContextMenu(bubble, e.touches[0]);
                }, 600);
            }, { passive: true });

            chatMessages.addEventListener('touchend', () => {
                clearTimeout(longPressTimer);
            });

            chatMessages.addEventListener('touchmove', () => {
                clearTimeout(longPressTimer);
            });

            // 点击其他地方关闭菜单
            document.addEventListener('touchstart', (e) => {
                const menu = document.getElementById('msgContextMenu');
                if (menu && !menu.contains(e.target)) {
                    menu.style.display = 'none';
                }
            }, { passive: true });
        }

        function showQuotePreview() {
            if (!quotedMessage) return;
            const preview = document.getElementById('quotePreview');
            const text = document.getElementById('quotePreviewText');
            text.textContent = quotedMessage.content;
            preview.style.display = 'block';
            
            // 自动聚焦输入框
            document.getElementById('chatInput').focus();
        }

        function cancelQuote() {
            quotedMessage = null;
            document.getElementById('quotePreview').style.display = 'none';
        }

        function showMsgContextMenu(bubble, touch) {
            const menu = document.getElementById('msgContextMenu');
            currentLongPressedMsg = bubble;
            
            menu.style.display = 'flex';
            
            const rect = bubble.getBoundingClientRect();
            let top = rect.top - menu.offsetHeight - 15;
            let left = rect.left + (rect.width / 2) - (menu.offsetWidth / 2);
            
            // 边界检查
            if (top < 60) {
                top = rect.bottom + 15;
            }
            
            if (left < 10) left = 10;
            if (left + menu.offsetWidth > window.innerWidth - 10) {
                left = window.innerWidth - menu.offsetWidth - 10;
            }

            menu.style.top = top + 'px';
            menu.style.left = left + 'px';
            
            // 震动反馈
            if (navigator.vibrate) navigator.vibrate(50);
        }

        function handleMsgAction(action) {
            const menu = document.getElementById('msgContextMenu');
            menu.style.display = 'none';
            
            if (!currentLongPressedMsg) return;
            // 排除掉 quote 和 translation 部分
            let content = "";
            const textNode = currentLongPressedMsg.querySelector('div:not(.msg-translation):not([style*="font-size: 12px"])');
            if (textNode) {
                content = textNode.textContent;
            } else {
                content = currentLongPressedMsg.textContent;
            }
            
            const row = currentLongPressedMsg.closest('.msg-row');
            const isSent = row.classList.contains('sent');

            switch(action) {
                case '复制':
                    navigator.clipboard.writeText(content).then(() => {
                        alert('已复制到剪贴板');
                    });
                    break;
                case '转发':
                    openForwardModal();
                    break;
                case '收藏':
                    {
                        const row = currentLongPressedMsg.closest('.msg-row');
                        const idx = parseInt(row.getAttribute('data-msg-index'));
                        const history = chatHistories[currentChatFriendId];
                        let newFav;
                        
                        if (history && !isNaN(idx) && history[idx].isMergedForward) {
                            const msg = history[idx];
                            newFav = {
                                id: Date.now(),
                                content: msg.content,
                                isMergedForward: true,
                                title: msg.title,
                                fullHistory: msg.fullHistory,
                                date: new Date().toISOString().split('T')[0],
                                isPinned: false
                            };
                        } else {
                            newFav = {
                                id: Date.now(),
                                content: content,
                                date: new Date().toISOString().split('T')[0],
                                isPinned: false
                            };
                        }
                        favoritesData.unshift(newFav);
                        saveFavoritesToStorage();
                        alert('已收藏');
                    }
                    break;
                case '删除':
                    if (confirm('确定删除这条消息吗？')) {
                        deleteCurrentMsg();
                    }
                    break;
                case '撤回':
                    if (confirm('确定撤回这条消息吗？')) {
                        withdrawCurrentMsg(isSent);
                    }
                    break;
                case '引用':
                    const history = chatHistories[currentChatFriendId];
                    const dataIndex = row.getAttribute('data-msg-index');
                    if (history && dataIndex !== null) {
                        quotedMessage = history[dataIndex];
                        showQuotePreview();
                    }
                    break;
                case '多选':
                    enterMultiSelectMode(parseInt(row.getAttribute('data-msg-index')));
                    break;
                case '编辑':
                    editCurrentMsg(content);
                    break;
                case '翻译':
                    translateCurrentMsg();
                    break;
                case '重回':
                    {
                        const history = chatHistories[currentChatFriendId];
                        const dataIndex = parseInt(row.getAttribute('data-msg-index'));
                        if (history && !isNaN(dataIndex)) {
                            if (isSent) {
                                // 1.长按消息点击重回会将这条消息之后联系人回复的所有内容删除重新回复用户
                                history.splice(dataIndex + 1);
                            } else {
                                // 2.长按联系人的消息点击重回会重新回复这一条
                                history.splice(dataIndex);
                            }
                            saveChatHistories();
                            renderMessages();
                            
                            // 更新列表显示
                            const friend = chatList.find(f => f.id === currentChatFriendId);
                            if (friend) {
                                if (history.length > 0) {
                                    const lastMsg = history[history.length - 1];
                                    friend.message = lastMsg.content || '';
                                    friend.time = formatTime(new Date(lastMsg.time));
                                } else {
                                    friend.message = '请开始聊天';
                                }
                                saveChatListToStorage();
                                renderChatList();
                            }
                            
                            // 重新触发 AI 回复
                            callAI();
                        }
                    }
                    break;
                default:
                    alert('功能[' + action + ']开发中...');
            }
        }

        // 聊天信息页面逻辑
        function openChatInfo() {
            if (!currentChatFriendId) return;
            const friend = chatList.find(f => f.id === currentChatFriendId);
            if (!friend) return;

            document.getElementById('chatInfoContainer').style.display = 'flex';
            document.getElementById('chatInfoAvatar').src = friend.avatar || '';
            document.getElementById('chatInfoRemark').value = friend.remark || friend.name || '';
            
            // 加载设置
            const settings = getChatSettings(currentChatFriendId);

            // 更新绑定世界书数量显示
            const boundCountEl = document.getElementById('chatInfoBoundCount');
            if (boundCountEl) {
                const boundIds = settings.boundWorldBookIds || [];
                boundCountEl.textContent = boundIds.length > 0 ? `已绑定 ${boundIds.length} 本` : '未绑定';
            }

            document.getElementById('chatInfoMemCount').value = settings.memCount || 10;
            const autoSum = settings.autoSum || false;
            document.getElementById('chatInfoAutoSum').checked = autoSum;
            document.getElementById('chatInfoSumRounds').value = settings.sumRounds || 5;
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

        // AI朋友圈可见范围弹窗逻辑
        function openAiMomentRangeModal() {
            const modal = document.getElementById('aiMomentRangeModal');
            const currentRange = document.getElementById('chatInfoAiMomentRangeText').textContent;
            
            modal.classList.add('active');
            
            // 重置单选框样式
            document.querySelectorAll('.range-radio').forEach(r => r.classList.remove('selected'));
            
            // 根据当前值设置选中状态
            const radioIdMap = {
                '最近半年': 'range-half-year',
                '最近一个月': 'range-one-month',
                '最近三天': 'range-three-days',
                '全部': 'range-all'
            };
            const radioId = radioIdMap[currentRange];
            if (radioId) {
                const radio = document.getElementById(radioId);
                if (radio) radio.classList.add('selected');
            }

            // 点击弹窗以外区域关闭
            modal.onclick = (e) => {
                if (e.target === modal) closeAiMomentRangeModal();
            };
        }

        function selectAiMomentRange(range) {
            // 更新 radio UI
            document.querySelectorAll('.range-radio').forEach(r => r.classList.remove('selected'));
            const radioIdMap = {
                '最近半年': 'range-half-year',
                '最近一个月': 'range-one-month',
                '最近三天': 'range-three-days',
                '全部': 'range-all'
            };
            const radioId = radioIdMap[range];
            if (radioId) {
                const radio = document.getElementById(radioId);
                if (radio) radio.classList.add('selected');
            }

            // 点击后立即更新文字并保存
            document.getElementById('chatInfoAiMomentRangeText').textContent = range;
            saveChatInfoSettings();
            
            // 稍微延迟关闭让用户看到选中效果
            setTimeout(closeAiMomentRangeModal, 200);
        }

        function closeAiMomentRangeModal() {
            document.getElementById('aiMomentRangeModal').classList.remove('active');
        }

        function openManualMemory() {
            if (!currentChatFriendId) return;
            const friend = chatList.find(f => f.id === currentChatFriendId);
            if (!friend) return;
            
            const contact = contacts.find(c => c.id === friend.contactId);
            const realName = contact ? contact.name : friend.name;
            
            document.getElementById('manualMemoryTitle').textContent = `${realName}的记忆`;
            
            const settings = getChatSettings(currentChatFriendId);
            document.getElementById('manualMemoryInput').value = settings.manualMemory || '';
            
            document.getElementById('chatInfoContainer').style.display = 'none';
            document.getElementById('manualMemoryContainer').style.display = 'flex';
            saveUIState();
        }

        function closeManualMemory() {
            document.getElementById('manualMemoryContainer').style.display = 'none';
            document.getElementById('chatInfoContainer').style.display = 'flex';
            saveUIState();
        }

        function saveManualMemory() {
            if (!currentChatFriendId) return;
            
            const memoryText = document.getElementById('manualMemoryInput').value.trim();
            const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
            if (!allSettings[currentChatFriendId]) allSettings[currentChatFriendId] = {};
            
            allSettings[currentChatFriendId].manualMemory = memoryText;
            localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings));
            
            alert('记忆已保存');
            closeManualMemory();
        }

        function closeChatInfo() {
            document.getElementById('chatInfoContainer').style.display = 'none';
            if (isOpenedFromContactDetail) {
                isOpenedFromContactDetail = false;
                // 返回联系人详情页
                closeChat();
                if (currentDetailFriendId) {
                    openContactDetail(currentDetailFriendId);
                }
            }
            saveUIState();
        }

        function getChatSettings(friendId) {
            const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
            return allSettings[friendId] || {};
        }

        function saveChatInfoSettings() {
            if (!currentChatFriendId) return;
            
            const friend = chatList.find(f => f.id === currentChatFriendId);
            if (!friend) return;

            // 处理备注
            const remark = document.getElementById('chatInfoRemark').value.trim();
            friend.remark = remark;
            document.getElementById('chatPartnerName').textContent = getFriendDisplayName(friend);

            // 处理置顶
            friend.isPinned = document.getElementById('chatInfoSticky').checked;

            const autoSum = document.getElementById('chatInfoAutoSum').checked;
            document.getElementById('chatInfoSumRoundsRow').style.display = autoSum ? 'flex' : 'none';

            const oldSettings = getChatSettings(currentChatFriendId);
            const settings = {
                ...oldSettings,
                memCount: document.getElementById('chatInfoMemCount').value,
                autoSum: autoSum,
                sumRounds: document.getElementById('chatInfoSumRounds').value,
                proactiveMsg: document.getElementById('chatInfoProactiveMsg').checked,
                senseTime: document.getElementById('chatInfoSenseTime').checked,
                proactiveMoment: document.getElementById('chatInfoProactiveMoment').checked,
                offlineInvite: document.getElementById('chatInfoOfflineInvite').checked,
                syncGroup: document.getElementById('chatInfoSyncGroup').checked,
                aiMomentRange: document.getElementById('chatInfoAiMomentRangeText').textContent,
                isBlocked: document.getElementById('chatInfoBlock').checked
            };

            const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
            allSettings[currentChatFriendId] = settings;
            localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings));
            
            saveChatListToStorage();
            renderChatList();
        }

        function changeChatInfoAvatar() {
            currentImageId = 'chatInfoAvatar';
            const originalConfirmUrl = window.confirmUrl;
            
            window.confirmUrl = function() {
                const url = document.getElementById('urlInput').value.trim();
                if (url && currentChatFriendId) {
                    const friend = chatList.find(f => f.id === currentChatFriendId);
                    if (friend) {
                        friend.avatar = url;
                        document.getElementById('chatInfoAvatar').src = url;
                        
                        // 同步更新联系人头像
                        const contact = contacts.find(c => c.id === friend.contactId);
                        if (contact) {
                            contact.avatar = url;
                            saveContactsToStorage();
                            renderContactsList();
                        }
                        
                        saveChatListToStorage();
                        renderChatList();
                    }
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
                            if (friend) {
                                friend.avatar = src;
                                document.getElementById('chatInfoAvatar').src = src;
                                
                                // 同步更新联系人头像
                                const contact = contacts.find(c => c.id === friend.contactId);
                                if (contact) {
                                    contact.avatar = src;
                                    saveContactsToStorage();
                                    renderContactsList();
                                }
                                
                                saveChatListToStorage();
                                renderChatList();
                            }
                        }
                        closeModal();
                    };
                    reader.readAsDataURL(file);
                }
                window.handleFileSelect = originalHandleFileSelect;
            };

            document.getElementById('urlInputContainer').style.display = 'none';
            document.getElementById('imageModal').classList.add('active');
        }

        function clearCurrentChatHistory() {
            if (!currentChatFriendId) return;
            if (confirm('确定要清空聊天记录吗？')) {
                chatHistories[currentChatFriendId] = [];
                saveChatHistories();
                renderMessages();
                alert('已清空聊天记录');
            }
        }

        function deleteCurrentPartner() {
            if (!currentChatFriendId) return;
            if (confirm('确定要删除该联系人吗？')) {
                chatList = chatList.filter(f => f.id !== currentChatFriendId);
                delete chatHistories[currentChatFriendId];
                saveChatListToStorage();
                saveChatHistories();
                closeChatInfo();
                closeChat();
                renderChatList();
            }
        }

        function editCurrentMsg(oldContent) {
            const input = document.getElementById('msgEditInput');
            input.value = oldContent;
            document.getElementById('msgEditModal').classList.add('active');
        }

        function closeMsgEditModal() {
            document.getElementById('msgEditModal').classList.remove('active');
        }

        function confirmMsgEdit() {
            const newValue = document.getElementById('msgEditInput').value.trim();
            if (newValue && currentLongPressedMsg) {
                const row = currentLongPressedMsg.closest('.msg-row');
                const history = chatHistories[currentChatFriendId];
                if (history) {
                    const dataIndex = parseInt(row.getAttribute('data-msg-index'));
                    if (!isNaN(dataIndex) && history[dataIndex]) {
                        history[dataIndex].content = newValue;
                        // 编辑后清除之前的翻译
                        delete history[dataIndex].translation;
                        saveChatHistories();
                        
                        // 如果编辑的是最后一条消息，同步更新聊天列表显示
                        if (dataIndex === history.length - 1) {
                            const friend = chatList.find(f => f.id === currentChatFriendId);
                            if (friend) {
                                friend.message = newValue;
                                saveChatListToStorage();
                                renderChatList();
                            }
                        }
                        
                        renderMessages();
                    }
                }
            }
            closeMsgEditModal();
        }

        async function translateCurrentMsg() {
            if (!currentLongPressedMsg || !currentChatFriendId) return;
            const row = currentLongPressedMsg.closest('.msg-row');
            const history = chatHistories[currentChatFriendId];
            const dataIndex = row.getAttribute('data-msg-index');
            
            if (history && dataIndex !== null && history[dataIndex]) {
                const msg = history[dataIndex];
                const content = msg.content;
                
                // 2.翻译好的内容长按消息再次点击翻译可以取消翻译。
                if (msg.translation) {
                    delete msg.translation;
                    saveChatHistories();
                    renderMessages();
                    return;
                }

                const chatStatus = document.getElementById('chatStatus');
                if (chatStatus) {
                    chatStatus.textContent = '翻译中...';
                    chatStatus.classList.add('typing-status');
                }

                // 获取 API 配置
                const configId = localStorage.getItem('current_api_config_id') || 'default';
                const configs = await dbGetAll('api_configs');
                const config = configs.find(c => c.id === configId);

                if (!config || !config.url || !config.key) {
                    // 如果没有配置，使用模拟翻译
                    setTimeout(() => {
                        if (chatStatus) {
                            chatStatus.textContent = '';
                            chatStatus.classList.remove('typing-status');
                        }
                        let translated = "（模拟翻译）" + content;
                        if (content.toLowerCase().includes("hello")) translated = "你好";
                        else if (content.toLowerCase().includes("how are you")) translated = "你好吗？";
                        
                        msg.translation = translated;
                        saveChatHistories();
                        renderMessages();
                    }, 800);
                    return;
                }

                try {
                    let apiUrl = config.url.trim().replace(/\/$/, '');
                    if (!apiUrl.endsWith('/chat/completions')) {
                        apiUrl += '/chat/completions';
                    }

                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${config.key}`
                        },
                        body: JSON.stringify({
                            model: config.model,
                            messages: [
                                { role: "system", content: "你是一个翻译专家。请将用户提供的文本翻译成系统语言（中文）。如果文本中包含emoji表情、特殊符号或图形，请在翻译结果中原封不动地保留它们在相应的位置。只返回翻译后的内容，不要有任何解释。" },
                                { role: "user", content: content }
                            ],
                            temperature: 0.3
                        })
                    });

                    const data = await response.json();
                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        msg.translation = data.choices[0].message.content.trim();
                        saveChatHistories();
                        renderMessages();
                    } else {
                        throw new Error('API 返回格式错误');
                    }
                } catch (e) {
                    console.error("Translation Error:", e);
                    msg.translation = "翻译失败，请检查配置";
                    renderMessages();
                } finally {
                    if (chatStatus) {
                        chatStatus.textContent = '';
                        chatStatus.classList.remove('typing-status');
                    }
                }
            }
        }

        function withdrawCurrentMsg(isSent) {
            const row = currentLongPressedMsg.closest('.msg-row');
            const history = chatHistories[currentChatFriendId];
            if (history) {
                const dataIndex = parseInt(row.getAttribute('data-msg-index'));
                if (isNaN(dataIndex) || !history[dataIndex]) return;

                const originalMsg = history[dataIndex];

                // 只能撤回自己发送的消息
                if (!isSent) {
                    alert('只能撤回自己发送的消息');
                    return;
                }

                // 检查是否超过2分钟
                const now = new Date().getTime();
                const diff = now - (originalMsg.time || 0);
                if (diff > 2 * 60 * 1000) {
                    alert('消息已发出超过2分钟，无法撤回');
                    return;
                }

                // 替换为系统提示
                history[dataIndex] = {
                    type: 'system_withdrawn',
                    withdrawnContent: originalMsg.content,
                    withdrawnBy: 'user',
                    time: new Date().getTime()
                };

                saveChatHistories();
                renderMessages();

                // 同步更新聊天列表显示
                const friend = chatList.find(f => f.id === currentChatFriendId);
                if (friend) {
                    friend.message = '你撤回了一条消息';
                    saveChatListToStorage();
                    renderChatList();
                }
            }
        }

        function showWithdrawDetail(content) {
            document.getElementById('withdrawnContent').textContent = content;
            document.getElementById('withdrawModal').classList.add('active');
        }

        function closeWithdrawModal() {
            document.getElementById('withdrawModal').classList.remove('active');
        }

        function deleteCurrentMsg() {
            const bubble = currentLongPressedMsg;
            const row = bubble.closest('.msg-row');
            const history = chatHistories[currentChatFriendId];
            if (history) {
                const dataIndex = row.getAttribute('data-msg-index');
                if (dataIndex !== null && history[dataIndex]) {
                    // 标记为本地删除，页面上会消失，但数据保留供 AI 使用
                    history[dataIndex].isDeletedLocal = true;
                    saveChatHistories();
                    renderMessages();
                }
            }
        }

        // 加载聊天记录
        function loadChatHistories() {
            const saved = localStorage.getItem('wechat_chat_histories');
            if (saved) {
                chatHistories = JSON.parse(saved);
            }
        }

        // 保存聊天记录
        function saveChatHistories() {
            safeLocalStorageSet('wechat_chat_histories', JSON.stringify(chatHistories), true);
        }

        // 打开聊天
        function openChat(friendId) {
            const friend = chatList.find(f => f.id === friendId);
            if (!friend) return;

            const contact = contacts.find(c => c.id === friend.contactId);
            currentChatFriendId = friendId;
            document.getElementById('wechatContainer').style.display = 'none';
            document.getElementById('chatPageContainer').style.display = 'flex';
            document.getElementById('chatPartnerName').textContent = getFriendDisplayName(friend);
            document.getElementById('chatStatus').textContent = '';
            
            // 加载聊天背景
            const settings = getChatSettings(friendId);
            applyChatBackground(settings.background);

            // 加载草稿
            const drafts = JSON.parse(localStorage.getItem('wechat_chat_drafts') || '{}');
            const draft = drafts[friendId] || '';
            const input = document.getElementById('chatInput');
            input.value = draft;
            
            // 确保更多面板默认关闭
            document.getElementById('chatMorePanel').style.display = 'none';
            
            updateTime();
            updateBattery();
            renderMessages();
            handleChatInput(input);
            saveUIState();
        }

        function openChatBackgroundModal() {
            if (!currentChatFriendId) return;
            
            const originalConfirmUrl = window.confirmUrl;
            const originalHandleFileSelect = window.handleFileSelect;

            window.confirmUrl = function() {
                const url = document.getElementById('urlInput').value.trim();
                if (url) {
                    setChatBackground(url);
                    closeModal();
                }
                window.confirmUrl = originalConfirmUrl;
                document.querySelector('#imageModal .modal-title').textContent = '更改图片';
            };

            window.handleFileSelect = function(event) {
                const file = event.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        setChatBackground(e.target.result);
                        closeModal();
                    };
                    reader.readAsDataURL(file);
                }
                window.handleFileSelect = originalHandleFileSelect;
                document.querySelector('#imageModal .modal-title').textContent = '更改图片';
            };

            document.getElementById('urlInputContainer').style.display = 'none';
            document.getElementById('imageModal').classList.add('active');
            document.querySelector('#imageModal .modal-title').textContent = '设置聊天背景';
        }

        function setChatBackground(src) {
            if (!currentChatFriendId) return;
            
            const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
            if (!allSettings[currentChatFriendId]) allSettings[currentChatFriendId] = {};
            
            allSettings[currentChatFriendId].background = src;
            localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings));
            
            applyChatBackground(src);
            alert('聊天背景已设置');
        }

        function applyChatBackground(src) {
            const container = document.getElementById('chatMessages');
            if (src) {
                container.style.backgroundImage = `url('${src}')`;
                container.style.backgroundSize = 'cover';
                container.style.backgroundPosition = 'center';
            } else {
                container.style.backgroundImage = 'none';
            }
        }

        let currentStickerCategory = 'default';
        let favoriteStickers = [];
        let isPanelToggling = false; // 标记是否正在切换面板，防止 focus/touchstart 冲突

        function loadFavoriteStickers() {
            const saved = localStorage.getItem('wechat_favorite_stickers');
            if (saved) {
                favoriteStickers = JSON.parse(saved);
            }
        }

        function saveFavoriteStickers() {
            localStorage.setItem('wechat_favorite_stickers', JSON.stringify(favoriteStickers));
        }

        function closeChat() {
            document.getElementById('chatPageContainer').style.display = 'none';
            document.getElementById('wechatContainer').style.display = 'block';
            document.getElementById('chatMorePanel').style.display = 'none';
            const stickerPicker = document.getElementById('stickerPickerPanel');
            if (stickerPicker) stickerPicker.classList.remove('active');
            currentChatFriendId = null;
            saveUIState();
        }

        function toggleStickerPicker(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const panel = document.getElementById('stickerPickerPanel');
            const morePanel = document.getElementById('chatMorePanel');
            const inputBar = document.getElementById('chatInputBar');
            const isVisible = panel.classList.contains('active');
            
            isPanelToggling = true;
            if (!isVisible) {
                // 隐藏更多面板并恢复内边距
                if (morePanel) morePanel.style.display = 'none';
                if (inputBar) inputBar.style.paddingBottom = '30px';
                
                document.activeElement.blur();
                // 需求 2: 聊天页面表情包预览点开优先显示默认页面
                switchStickerCategory('default');
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
            
            setTimeout(() => {
                const container = document.getElementById('chatMessages');
                if (container) container.scrollTop = container.scrollHeight;
                isPanelToggling = false;
            }, 300);
            saveUIState();
        }

        function switchStickerCategory(category) {
            currentStickerCategory = category;
            const items = document.querySelectorAll('.sticker-category-item');
            items.forEach(item => {
                if (item.textContent === (category === 'default' ? '默认' : '收藏')) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            renderChatStickerGrid();
        }

        function renderChatStickerGrid() {
            const grid = document.getElementById('chatStickerGrid');
            grid.innerHTML = '';
            grid.classList.remove('empty');
            
            const list = currentStickerCategory === 'default' ? stickerList : favoriteStickers;
            
            if (list.length === 0) {
                grid.classList.add('empty');
                const tip = document.createElement('div');
                tip.className = 'sticker-empty-tip';
                tip.textContent = currentStickerCategory === 'default' ? '表情库为空' : '暂无收藏表情包';
                grid.appendChild(tip);
                return;
            }

            list.forEach((sticker, index) => {
                const item = document.createElement('div');
                item.className = 'chat-sticker-item';
                
                let timer;
                item.addEventListener('touchstart', () => {
                    timer = setTimeout(() => {
                        if (currentStickerCategory === 'default') {
                            if (!favoriteStickers.some(s => s.src === sticker.src)) {
                                favoriteStickers.push(sticker);
                                saveFavoriteStickers();
                                if (navigator.vibrate) navigator.vibrate(50);
                                alert('已加入收藏');
                            } else {
                                alert('已经在收藏中了');
                            }
                        } else {
                            // 收藏列表中长按移除
                            if (confirm('确定从收藏中移除该表情吗？')) {
                                favoriteStickers.splice(index, 1);
                                saveFavoriteStickers();
                                renderChatStickerGrid();
                                if (navigator.vibrate) navigator.vibrate(50);
                            }
                        }
                    }, 800);
                }, { passive: true });
                
                item.addEventListener('touchend', () => clearTimeout(timer));
                item.addEventListener('touchmove', () => clearTimeout(timer));
                
                item.onclick = () => sendStickerMessage(sticker);
                item.innerHTML = `<img src="${sticker.src}" alt="${sticker.name}" class="chat-sticker-img">`;
                grid.appendChild(item);
            });
        }

        function sendStickerMessage(sticker) {
            if (!currentChatFriendId) return;
            
            const history = chatHistories[currentChatFriendId] || [];
            const newMessage = {
                type: 'sent',
                msgType: 'sticker',
                content: sticker.src,
                stickerName: sticker.name,
                time: new Date().getTime()
            };
            
            history.push(newMessage);
            chatHistories[currentChatFriendId] = history;
            
            const friend = chatList.find(f => f.id === currentChatFriendId);
            if (friend) {
                friend.message = `[${sticker.name}]`;
                friend.time = formatTime(new Date());
            }

            document.getElementById('stickerPickerPanel').classList.remove('active');
            renderMessages();
            saveChatHistories();
            saveChatListToStorage();
            renderChatList();
            
            // 发送表情包之后联系人不会立即回复，移除自动调用 AI
            // callAI();
        }

        function handleChatAlbum() {
            const originalConfirmUrl = window.confirmUrl;
            const originalCloseModal = window.closeModal;

            window.confirmUrl = function() {
                const url = document.getElementById('urlInput').value.trim();
                if (url) {
                    const description = prompt("请输入图片描述（以便AI理解图片内容）：");
                    sendChatImage(url, description || "一张图片");
                    closeModal();
                }
                window.confirmUrl = originalConfirmUrl;
            };

            document.getElementById('urlInputContainer').style.display = 'none';
            document.getElementById('modalMainButtons').style.display = 'flex';
            document.getElementById('imageModal').classList.add('active');
            document.querySelector('#imageModal .modal-title').textContent = '选择图片方式';
            
            const albumBtn = document.querySelector('#imageModal .image-option-btn');
            const originalAlbumClick = albumBtn.onclick;
            albumBtn.onclick = () => {
                document.getElementById('chatAlbumInput').click();
                closeModal();
            };

            window.closeModal = function() {
                originalCloseModal();
                albumBtn.onclick = originalAlbumClick;
                window.confirmUrl = originalConfirmUrl;
                window.closeModal = originalCloseModal;
                document.querySelector('#imageModal .modal-title').textContent = '更改图片';
            };
        }

        function handleChatAlbumSelect(event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const description = prompt("请输入图片描述（以便AI理解图片内容）：");
                    sendChatImage(e.target.result, description || "一张图片");
                };
                reader.readAsDataURL(file);
            }
            event.target.value = '';
        }

        function sendChatImage(src, description) {
            if (!currentChatFriendId) return;
            const history = chatHistories[currentChatFriendId] || [];
            const newMessage = {
                type: 'sent',
                msgType: 'image',
                content: src,
                description: description,
                time: new Date().getTime()
            };
            history.push(newMessage);
            chatHistories[currentChatFriendId] = history;
            
            const friend = chatList.find(f => f.id === currentChatFriendId);
            if (friend) {
                friend.message = '[图片]';
                friend.time = formatTime(new Date());
            }
            renderMessages();
            saveChatHistories();
            saveChatListToStorage();
            renderChatList();
            callAI(description);
        }

        function handleChatCamera() {
            const modal = document.getElementById('imageContentModal');
            const title = modal.querySelector('.modal-title');
            const confirmBtn = modal.querySelector('.confirm');
            const textarea = document.getElementById('imageContentInput');
            
            const originalTitle = title.textContent;
            const originalConfirm = confirmBtn.onclick;

            title.textContent = '照片描写';
            textarea.value = '';
            confirmBtn.onclick = () => {
                const content = textarea.value.trim();
                if (content) {
                    sendChatPhoto(content);
                    modal.classList.remove('active');
                    title.textContent = originalTitle;
                    confirmBtn.onclick = originalConfirm;
                }
            };

            modal.classList.add('active');
            textarea.focus();

            window.closeImageContentModal = function() {
                modal.classList.remove('active');
                title.textContent = originalTitle;
                confirmBtn.onclick = originalConfirm;
            };
        }

        function sendChatPhoto(content) {
            if (!currentChatFriendId) return;
            const history = chatHistories[currentChatFriendId] || [];
            const newMessage = {
                type: 'sent',
                msgType: 'photo',
                content: content,
                time: new Date().getTime()
            };
            history.push(newMessage);
            chatHistories[currentChatFriendId] = history;
            
            const friend = chatList.find(f => f.id === currentChatFriendId);
            if (friend) {
                friend.message = '[照片]';
                friend.time = formatTime(new Date());
            }
            renderMessages();
            saveChatHistories();
            saveChatListToStorage();
            renderChatList();
            callAI(`发送了一张照片，内容描写为：${content}`);
        }

        function showPhotoDetail(content) {
            const modal = document.getElementById('imageDetailModal');
            const textEl = document.getElementById('imageDetailText');
            if (modal && textEl) {
                textEl.textContent = content;
                textEl.style.color = '#000';
                textEl.parentElement.style.background = '#fff';
                modal.classList.add('active');
                modal.onclick = () => {
                    modal.classList.remove('active');
                };
            }
        }

        function toggleChatMorePanel(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            const panel = document.getElementById('chatMorePanel');
            const stickerPanel = document.getElementById('stickerPickerPanel');
            const inputBar = document.getElementById('chatInputBar');
            const isVisible = panel.style.display === 'grid';
            
            isPanelToggling = true;
            if (!isVisible) {
                // 隐藏表情面板
                if (stickerPanel) stickerPanel.classList.remove('active');
                
                // 如果面板要显示，关闭键盘
                document.activeElement.blur();
                panel.style.display = 'grid';
                if (inputBar) inputBar.style.paddingBottom = '10px';
            } else {
                panel.style.display = 'none';
                if (inputBar) inputBar.style.paddingBottom = '30px';
            }
            
            // 无论如何显示/隐藏都滚动到底部
            setTimeout(() => {
                const container = document.getElementById('chatMessages');
                if (container) container.scrollTop = container.scrollHeight;
                isPanelToggling = false;
            }, 300);
            saveUIState();
        }

        function hideChatMorePanel() {
            if (isPanelToggling) return; // 如果正在切换中，则忽略此请求防止闪烁
            const panel = document.getElementById('chatMorePanel');
            const stickerPanel = document.getElementById('stickerPickerPanel');
            const inputBar = document.getElementById('chatInputBar');
            let changed = false;
            
            if (panel && panel.style.display === 'grid') {
                panel.style.display = 'none';
                if (inputBar) inputBar.style.paddingBottom = '30px';
                changed = true;
            }
            
            if (stickerPanel && stickerPanel.classList.contains('active')) {
                stickerPanel.classList.remove('active');
                changed = true;
            }
            
            if (changed) saveUIState();
        }

        // 初始化聊天页面事件
        document.addEventListener('DOMContentLoaded', () => {
            const chatInput = document.getElementById('chatInput');
            const chatMessages = document.getElementById('chatMessages');
            
            if (chatInput) {
                chatInput.addEventListener('focus', () => {
                    hideChatMorePanel();
                    setTimeout(() => {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }, 300);
                });
            }
            
            if (chatMessages) {
                chatMessages.addEventListener('touchstart', () => {
                    hideChatMorePanel();
                });
            }
        });

        function handleChatInput(textarea) {
            const sendBtn = document.getElementById('chatSendBtn');
            const addons = document.getElementById('chatAddons');
            const aiMicBtn = document.getElementById('aiMicBtn');
            
            // 自动调整高度，但不超过三行（CSS中已限制max-height）
            textarea.style.height = 'auto';
            let scrollHeight = textarea.scrollHeight;
            textarea.style.height = scrollHeight + 'px';

            if (textarea.value.length > 0) {
                sendBtn.style.display = 'block';
                addons.style.display = 'none';
                // 输入文字时隐藏麦克风
                if (aiMicBtn) aiMicBtn.style.display = 'none';
                
                // 输入文字时自动收起面板
                const morePanel = document.getElementById('chatMorePanel');
                if (morePanel && morePanel.style.display === 'grid') {
                    morePanel.style.display = 'none';
                    document.getElementById('chatInputBar').style.paddingBottom = '30px';
                }
                const stickerPanel = document.getElementById('stickerPickerPanel');
                if (stickerPanel && stickerPanel.classList.contains('active')) {
                    stickerPanel.classList.remove('active');
                }
            } else {
                sendBtn.style.display = 'none';
                addons.style.display = 'flex';
                // 没有文字时恢复麦克风显示
                if (aiMicBtn) aiMicBtn.style.display = 'flex';
            }

            // 保存草稿
            if (currentChatFriendId) {
                const drafts = JSON.parse(localStorage.getItem('wechat_chat_drafts') || '{}');
                drafts[currentChatFriendId] = textarea.value;
                localStorage.setItem('wechat_chat_drafts', JSON.stringify(drafts));
            }
        }

        function renderMessages() {
            const container = document.getElementById('chatMessages');
            const history = chatHistories[currentChatFriendId] || [];
            const friend = chatList.find(f => f.id === currentChatFriendId);
            const userAvatar = wechatUserInfo.avatar || document.getElementById('accountAvatarImg').src || DEFAULT_AVATAR;
            const friendAvatar = friend ? (friend.avatar || DEFAULT_AVATAR) : DEFAULT_AVATAR;

            container.innerHTML = '';
            let lastShowTime = 0;
            const FIVE_MINUTES = 5 * 60 * 1000;

            history.forEach((msg, index) => {
                if (msg.isDeletedLocal) return;

                const msgTime = msg.time || 0;
                if (lastShowTime === 0 || (msgTime - lastShowTime > FIVE_MINUTES)) {
                    const timeHint = document.createElement('div');
                    timeHint.className = 'msg-system-hint';
                    const date = new Date(msgTime);
                    const now = new Date();
                    const isToday = date.toDateString() === now.toDateString();
                    const timeStr = isToday 
                        ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
                        : `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                    
                    timeHint.textContent = timeStr;
                    container.appendChild(timeHint);
                    lastShowTime = msgTime;
                }

                if (msg.type === 'system_withdrawn') {
                    const hint = document.createElement('div');
                    hint.className = 'msg-system-hint';
                    let text = msg.withdrawnBy === 'user' ? `你撤回了一条消息` : `对方撤回了一条消息`;
                    hint.textContent = text;
                    hint.onclick = () => showWithdrawDetail(msg.withdrawnContent);
                    container.appendChild(hint);
                    return;
                }

                const row = document.createElement('div');
                row.className = `msg-row ${msg.type}`;
                if (isMultiSelectMode) {
                    row.classList.add('multi-selecting');
                    row.onclick = () => toggleMsgSelection(index);
                }
                row.setAttribute('data-msg-index', index);
                
                const checkbox = document.createElement('div');
                checkbox.className = 'msg-checkbox';
                if (selectedMsgIndexes.has(index)) {
                    checkbox.classList.add('checked');
                }

                const avatar = document.createElement('img');
                avatar.className = 'msg-avatar';
                avatar.src = msg.type === 'sent' ? userAvatar : friendAvatar;
                
                const bubble = document.createElement('div');
                if (msg.isMergedForward) {
                    bubble.className = 'msg-bubble merged-forward-bubble';
                    bubble.onclick = (e) => {
                        e.stopPropagation();
                        openMergedChatDetail(msg);
                    };
                    
                    const title = document.createElement('div');
                    title.className = 'merged-forward-title';
                    title.textContent = msg.title || '聊天记录';
                    bubble.appendChild(title);
                    
                    const preview = document.createElement('div');
                    preview.className = 'merged-forward-preview';
                    const historyToPreview = msg.fullHistory || [];
                    historyToPreview.slice(0, 3).forEach(h => {
                        const item = document.createElement('div');
                        item.className = 'merged-forward-preview-item';
                        let displayContent = h.content;
                        if (h.msgType === 'sticker') {
                            displayContent = `[${h.stickerName || '表情'}]`;
                        }
                        item.textContent = `${h.name}：${displayContent}`;
                        preview.appendChild(item);
                    });
                    if (historyToPreview.length > 3) {
                        const more = document.createElement('div');
                        more.className = 'merged-forward-preview-item';
                        more.textContent = '...';
                        preview.appendChild(more);
                    }
                    bubble.appendChild(preview);
                    
                    const line = document.createElement('div');
                    line.className = 'merged-forward-line';
                    bubble.appendChild(line);
                    
                    const footer = document.createElement('div');
                    footer.className = 'merged-forward-footer';
                    footer.textContent = '聊天记录';
                    bubble.appendChild(footer);
                } else if (msg.msgType === 'sticker') {
                    bubble.className = 'msg-bubble sticker-bubble';
                } else if (msg.msgType === 'image') {
                    bubble.className = 'msg-bubble image-bubble';
                } else if (msg.msgType === 'photo') {
                    bubble.className = 'msg-bubble photo-bubble';
                } else {
                    bubble.className = 'msg-bubble';
                }
                
                if (msg.quote) {
                    const quoteBox = document.createElement('div');
                    quoteBox.className = 'msg-quote-box';
                    quoteBox.style.fontSize = '12px';
                    quoteBox.style.padding = '6px 10px';
                    quoteBox.style.borderRadius = '6px';
                    quoteBox.style.marginBottom = '8px';
                    quoteBox.style.wordBreak = 'break-all';
                    quoteBox.style.lineHeight = '1.4';
                    
                    if (msg.type === 'sent') {
                        quoteBox.style.background = 'rgba(255, 255, 255, 0.15)';
                        quoteBox.style.borderLeft = '3px solid rgba(255, 255, 255, 0.4)';
                        quoteBox.style.color = 'rgba(255, 255, 255, 0.8)';
                    } else {
                        quoteBox.style.background = 'rgba(0, 0, 0, 0.05)';
                        quoteBox.style.borderLeft = '3px solid #ddd';
                        quoteBox.style.color = '#888';
                    }
                    
                    quoteBox.textContent = msg.quote.content;
                    bubble.appendChild(quoteBox);
                }

                if (!msg.isMergedForward) {
                    if (msg.msgType === 'sticker') {
                        const img = document.createElement('img');
                        img.src = msg.content;
                        img.className = 'msg-sticker-img';
                        bubble.appendChild(img);
                    } else if (msg.msgType === 'image') {
                        const img = document.createElement('img');
                        img.src = msg.content;
                        img.style.maxWidth = '150px';
                        img.style.maxHeight = '200px';
                        img.style.borderRadius = '4px';
                        img.onclick = (e) => {
                            e.stopPropagation();
                            const modal = document.getElementById('imageDetailModal');
                            if (modal) {
                                modal.innerHTML = `<img src="${msg.content}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
                                modal.classList.add('active');
                                modal.onclick = () => modal.classList.remove('active');
                            }
                        };
                        bubble.appendChild(img);
                    } else if (msg.msgType === 'photo') {
                        bubble.style.width = '100px';
                        bubble.style.height = '100px';
                        bubble.style.background = '#888';
                        bubble.style.color = '#fff';
                        bubble.style.display = 'flex';
                        bubble.style.alignItems = 'center';
                        bubble.style.justifyContent = 'center';
                        bubble.style.padding = '10px';
                        bubble.style.fontSize = '12px';
                        bubble.style.cursor = 'pointer';
                        bubble.style.borderRadius = '4px';
                        bubble.style.overflow = 'hidden';
                        bubble.style.textAlign = 'center';
                        bubble.textContent = msg.content;
                        bubble.onclick = (e) => {
                            e.stopPropagation();
                            showPhotoDetail(msg.content);
                        };
                    } else {
                        const textNode = document.createElement('div');
                        textNode.textContent = msg.content;
                        bubble.appendChild(textNode);
                    }
                }

                if (msg.translation) {
                    const transDiv = document.createElement('div');
                    transDiv.className = 'msg-translation';
                    transDiv.textContent = msg.translation;
                    bubble.appendChild(transDiv);
                }
                
                // 处理合并转发详情页逻辑已移出 renderMessages

                if (msg.type === 'sent') {
                    row.appendChild(checkbox);
                    row.appendChild(bubble);
                    row.appendChild(avatar);
                } else {
                    row.appendChild(checkbox);
                    row.appendChild(avatar);
                    row.appendChild(bubble);
                }
                
                container.appendChild(row);
            });
            container.scrollTop = container.scrollHeight;
        }

        // 处理小麦克风点击：如果有文字则发送并触发AI回复，如果没有则直接触发AI回复
        async function handleMicClick() {
            if (!currentChatFriendId) return;
            const input = document.getElementById('chatInput');
            if (input.value.trim().length > 0) {
                await sendChatMessage();
            }
            await callAI(null, true);
        }

        async function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const content = input.value.trim();
            if (!content || !currentChatFriendId) return;

            // 添加到历史记录
            if (!chatHistories[currentChatFriendId]) {
                chatHistories[currentChatFriendId] = [];
            }
            
            const newMessage = {
                type: 'sent',
                content: content,
                time: new Date().getTime()
            };

            if (quotedMessage) {
                newMessage.quote = {
                    content: quotedMessage.content
                };
                cancelQuote();
            }
            
            chatHistories[currentChatFriendId].push(newMessage);
            
            // 清除草稿
            const drafts = JSON.parse(localStorage.getItem('wechat_chat_drafts') || '{}');
            delete drafts[currentChatFriendId];
            localStorage.setItem('wechat_chat_drafts', JSON.stringify(drafts));

            // 更新聊天列表中的最后一条消息
            const friend = chatList.find(f => f.id === currentChatFriendId);
            if (friend) {
                friend.message = content;
                friend.time = formatTime(new Date());
            }

            input.value = '';
            document.getElementById('chatMorePanel').style.display = 'none';
            handleChatInput(input);
            renderMessages();
            saveChatHistories();
            saveChatListToStorage();
            
            // 移除自动调用 AI，改为手动点击麦克风触发
            // callAI(content);
        }


        async function autoSummarizeChat(friendId, config) {
            const history = chatHistories[friendId] || [];
            const settings = getChatSettings(friendId);
            const sumRounds = parseInt(settings.sumRounds) || 5;
            
            // 获取最近需要总结的消息（最近的 N 轮，即 2*N 条消息）
            const recentMsgs = history.filter(h => h.type !== 'system_withdrawn').slice(-(sumRounds * 2));
            if (recentMsgs.length === 0) return;

            let chatContent = "";
            recentMsgs.forEach(m => {
                const name = m.type === 'sent' ? '用户' : '联系人';
                const content = m.msgType === 'sticker' ? `[表情: ${m.stickerName || '未知'}]` : m.content;
                chatContent += `${name}: ${content}\n`;
            });

            try {
                let apiUrl = config.url.trim().replace(/\/$/, '');
                if (!apiUrl.endsWith('/chat/completions')) {
                    apiUrl += '/chat/completions';
                }

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.key}`
                    },
                    body: JSON.stringify({
                        model: config.model,
                        messages: [
                            { role: "system", content: "你是一个聊天记录总结专家。请根据提供的对话内容进行总结，提取其中的关键信息、约定的事项或重要的互动细节。总结要精炼，直接返回总结内容，不要有前缀。" },
                            { role: "user", content: `请总结以下聊天内容：\n${chatContent}` }
                        ],
                        temperature: 0.3
                    })
                });

                const data = await response.json();
                if (data.choices && data.choices[0] && data.choices[0].message) {
                    const summary = data.choices[0].message.content.trim();
                    
                    // 更新记忆
                    const oldMemory = settings.manualMemory || "";
                    const newMemory = oldMemory ? `${oldMemory}\n\n【自动总结】：${summary}` : `【自动总结】：${summary}`;
                    
                    const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
                    if (!allSettings[friendId]) allSettings[friendId] = {};
                    allSettings[friendId].manualMemory = newMemory;
                    localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings));
                    
                    console.log("Auto-summary completed for", friendId);
                }
            } catch (e) {
                console.error("Auto-summary failed:", e);
            }
        }

        async function callAI(userMsg, isPersonaTrigger = false, targetFriendId = null) {
            const friendId = targetFriendId || currentChatFriendId;
            if (!friendId) return;

            const friend = chatList.find(f => f.id === friendId);
            if (!friend) return;
            const contact = contacts.find(c => c.id === friend.contactId);
            if (!contact) return;

            const isCurrentChat = (friendId === currentChatFriendId);
            const chatStatus = isCurrentChat ? document.getElementById('chatStatus') : null;
            
            if (chatStatus) {
                chatStatus.textContent = '正在输入...';
                chatStatus.classList.add('typing-status');
            }

            // 获取 API 配置
            const configId = localStorage.getItem('current_api_config_id') || 'default';
            const configs = await dbGetAll('api_configs');
            const config = configs.find(c => c.id === configId);

            if (!config || !config.url || !config.key) {
                console.log('API config missing');
                if (isCurrentChat) {
                    // 模拟回复
                    setTimeout(() => {
                        if (chatStatus) {
                            chatStatus.textContent = '';
                            chatStatus.classList.remove('typing-status');
                        }
                        receiveAIMessage("（请在设置中配置有效的 API 以启用 AI 聊天）");
                    }, 1000);
                }
                return;
            }

            // 获取手动记忆
            const settings = getChatSettings(friendId);
            const manualMemory = settings.manualMemory || "";

            // 构建系统提示词 - 增强真实感
            let systemPrompt = `你现在的身份是：${contact.netName || contact.name}。
【重要】：你不是AI助手，你就是用户设置好的这个联系人。你是一个真实的、有血有肉的人。

你的背景信息（严格遵守）：
- 真实姓名：${contact.name}
- 微信网名：${contact.netName}
- 亲近昵称：${contact.nickname}
- 你的性格、经历与核心人设：${contact.design || '一个普通的微信好友，态度自然亲切。'}
${manualMemory ? `- 你们之间的共同记忆（重要）：${manualMemory}` : ''}

用户的实名信息（用于你了解对方，但请根据你的人设决定是否知道这些内容）：
- 姓名：${realNameInfo.name}
- 年龄：${realNameInfo.age}
- 性别：${realNameInfo.gender}
- 职业：${realNameInfo.job}
- 现居地：${realNameInfo.location}
- 籍贯：${realNameInfo.hometown}
- 人设：${realNameInfo.persona}

【重要逻辑约束】：
1. 如果你的人设设定是不知道用户的真实姓名、职业等（例如刚认识、网友关系等），即使实名信息里有这些内容，你也必须表现出不知道。
2. 只有当你的人设是用户的熟人、家人或在对话中用户主动告知后，你才能表现出知道这些实名信息的内容。
3. 请严格按照你设定的角色性格进行交流。`;

            // 感知真实时间
            if (settings.senseTime) {
                const now = new Date();
                const timeStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}点${now.getMinutes()}分${now.getSeconds()}秒`;
            systemPrompt += `\n- 当前真实时间：${timeStr}`;
        }

        // 注入世界书信息
        const boundWorldBookIds = settings.boundWorldBookIds || [];
        if (worldBooks && worldBooks.length > 0 && boundWorldBookIds.length > 0) {
            let worldBookPrompt = "";
            worldBooks.forEach(book => {
                if (boundWorldBookIds.includes(book.id)) {
                    const activeItems = book.items.filter(item => item.enabled);
                    if (activeItems.length > 0) {
                        worldBookPrompt += `\n【世界书：${book.name}】\n简介：${book.description || '无'}\n相关条目：\n`;
                        activeItems.forEach(item => {
                            worldBookPrompt += `- ${item.name}${item.remark ? ' (' + item.remark + ')' : ''}：${item.content}\n`;
                        });
                    }
                }
            });
            if (worldBookPrompt) {
                systemPrompt += `\n\n以下是关于你们所处世界的背景知识（请牢记并根据需要提及）：${worldBookPrompt}`;
            }
        }

        systemPrompt += `\n\n请严格遵守以下【真实社交】准则：
1. **角色一致性**：永远不要跳出角色，不要承认自己是AI。如果用户问你是谁，根据你的人设回答。**严禁做出任何违反你人设的行为。**
2. **回复相关性**：仔细阅读用户发送的每一句话，确保你的回复不答非所问，逻辑连贯。
3. **引用功能**：如果你想引用某条历史消息进行针对性回复，请在你的回复开头使用格式 \`(引用: 消息内容) 你的回复\`。例如：\`(引用: 晚上一起吃饭吗) 好啊，去哪吃？\`。你可以引用用户说的话，也可以引用你自己说的话。注意：你无法引用合并聊天记录里面的具体聊天内容，但可以引用合并聊天记录本身（如其标题）。
4. **拒绝AI腔调**：禁止使用“作为一个AI...”、“我无法...”、“我可以为您提供...”等客服式用语。说话要随性、自然。
5. **口语化与活人感**：
   - 多使用语气助词（嘛、哈、呢、嗷、诶、啦）。
   - 适当使用表情符号（emoji）或简单的颜文字。
   - 严禁出现动作或心理描写，如 \`*笑了笑*\` 或 \`(摸头)\`。
   - 微信聊天通常不需要完美的标点符号。
6. **社交距离**：根据人设（恋人、死党、同事等）动态调整亲疏远近和说话语气。
7. **表情包使用**：你可以发送表情包。如果你想发送表情包，请在回复中使用格式 \`[表情: 表情名]\`。例如：\`[表情: 哭泣]\`。请确保表情名与上下文中提到的或你认为对方有的表情名一致。
8. **记忆读取与提及**：请读取并记住“共同记忆”中的内容。当用户提及相关内容时，你应该能够准确回忆并以此进行回复。即使在日常对话中，也可以适当地提及这些记忆来增加真实感。
9. **人设驱动的表情包**：发送表情包时，必须符合你的人设。例如，高冷的人设不应发送过于卖萌的表情，活泼的人设可以多发一些搞怪的表情。**严禁发送任何违反你人设的表情包。**

现在，请开始以 ${contact.netName || contact.name} 的身份与用户进行真实的微信对话。`;

            if (isPersonaTrigger) {
                systemPrompt += "\n\n【场景提醒】：你现在正主动想找用户聊天。请根据当前对话的上下文，表现得像你突然想起某事，或者单纯想找对方聊天一样，主动发起一个符合你人设的新话题或延伸旧话题。不要生硬。";
            }

            // 告知 AI 有哪些可用的表情包
            if (stickerList.length > 0) {
                const stickerNames = stickerList.map(s => s.name).join('、');
                systemPrompt += `\n\n【可用表情包】：${stickerNames}。你可以根据语境发送这些表情包，格式为 [表情: 表情名]。
【重要】：不要随便发表情包，一定要读取人设之后才发表情包。发送的表情包必须符合你的人设性格。`;
            }

            // 获取历史消息
            const history = chatHistories[friendId] || [];
            const messages = [
                { role: "system", content: systemPrompt }
            ];
            
            // 过滤掉撤回的消息，但包含本地删除的消息
            const aiHistory = history.filter(h => h.type !== 'system_withdrawn');
            
            // 根据设置读取上下文条数
            const memCount = parseInt(settings.memCount) || 10;
            // 如果用户设置的是1，就读取用户消息上面的一条消息。即包含当前消息在内共 memCount + 1 条
            const sliceCount = memCount + 1;
            
            // 映射历史消息，包含引用信息以提供上下文
            aiHistory.slice(-sliceCount).forEach(h => {
                let content = h.content;
                if (h.msgType === 'sticker') {
                    content = `[发送了一个表情包: ${h.stickerName || '未知'}]`;
                } else if (h.msgType === 'image') {
                    content = `[发送了一张图片，描述内容为：${h.description || '无'}]`;
                } else if (h.msgType === 'photo') {
                    content = `[发送了一张拍照照片，文字描写为：${h.content}]`;
                } else if (h.isMergedForward && h.fullHistory) {
                    // 合并转发的内容，展开给 AI 识别
                    content = `[合并转发的聊天记录]\n`;
                    h.fullHistory.forEach(item => {
                        content += `${item.name}：${item.content}\n`;
                    });
                } else if (h.quote) {
                    content = `[引用了消息: "${h.quote.content}"]\n${content}`;
                }
                messages.push({
                    role: h.type === 'sent' ? 'user' : 'assistant',
                    content: content
                });
            });
            
            // 如果是触发且最后一条是对方发的，可以加一个小提示让模型知道是在接话
            if (isPersonaTrigger && messages.length > 1 && messages[messages.length-1].role === 'assistant') {
                messages.push({ role: "user", content: "（请主动开启一段符合你人设的新对话）" });
            } else if (isPersonaTrigger) {
                messages.push({ role: "user", content: "（期待你的主动回复）" });
            }

            try {
                let apiUrl = config.url.trim().replace(/\/$/, '');
                if (!apiUrl.endsWith('/chat/completions')) {
                    apiUrl += '/chat/completions';
                }

                // 自动识别输出模式：优先尝试流式输出
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.key}`
                    },
                    body: JSON.stringify({
                        model: config.model,
                        messages: messages,
                        temperature: parseFloat(config.temp) || 0.8,
                        presence_penalty: 0.6,
                        frequency_penalty: 0.3,
                        stream: true // 默认请求流式
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error ? errorData.error.message : response.statusText);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/event-stream')) {
                    // 处理流式输出
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let done = false;
                    let fullContent = "";
                    let buffer = "";
                    let currentQuoteObj = null;

                    while (!done) {
                        const { value, done: readerDone } = await reader.read();
                        done = readerDone;
                        buffer += decoder.decode(value, { stream: !done });
                        const lines = buffer.split('\n');
                        buffer = lines.pop();
                        
                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
                                try {
                                    const json = JSON.parse(trimmedLine.substring(6));
                                    const delta = json.choices[0].delta.content || "";
                                    if (delta) {
                                        // 检查是否有引用标记
                                        if (fullContent === "" && delta.startsWith("(引用:")) {
                                            // 等待引用内容完整（简单处理：直到匹配到闭合括号）
                                        }

                                        fullContent += delta;
                                        
                                        // 每次遇到换行符，就认为是一条完整消息的结束
                                        if (fullContent.includes('\n')) {
                                            const parts = fullContent.split('\n');
                                            // 处理已经完整的行
                                            for (let i = 0; i < parts.length - 1; i++) {
                                                const lineContent = parts[i].trim();
                                                if (lineContent) {
                                                    await processAIMessagePart(lineContent, friendId, isCurrentChat);
                                                }
                                            }
                                            // 留下最后未完成的部分
                                            fullContent = parts[parts.length - 1];
                                        }
                                    }
                                } catch (e) {}
                            }
                        }
                    }
                    // 处理最后剩下的部分
                    if (fullContent.trim()) {
                        await processAIMessagePart(fullContent.trim(), friendId, isCurrentChat);
                    }
                } else {
                    // 处理非流式输出（即 fallback 情况）
                    const data = await response.json();
                    if (!data.choices || !data.choices[0]) throw new Error('API 返回数据格式错误');
                    const aiResponse = data.choices[0].message.content;
                    
                    const parts = aiResponse.split(/[\n\r]+/).filter(p => p.trim() !== '');
                    
                    for (let i = 0; i < parts.length; i++) {
                        if (i > 0) {
                            if (chatStatus && isCurrentChat) {
                                chatStatus.textContent = '正在输入...';
                                chatStatus.classList.add('typing-status');
                            }
                            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
                        }
                        
                        if (chatStatus && isCurrentChat) {
                            chatStatus.textContent = '';
                            chatStatus.classList.remove('typing-status');
                        }

                        await processAIMessagePart(parts[i], friendId, isCurrentChat);
                    }
                }

                // 检查自动总结
                if (settings.autoSum) {
                    const sumRounds = parseInt(settings.sumRounds) || 5;
                    // 增加轮数计数 (用户的对话加上联系人的对话为一轮)
                    // 我们在 callAI 结束时增加计数，因为此时一轮对话（用户发+AI回）已完成
                    let roundCount = (settings.roundCount || 0) + 1;
                    
                    if (roundCount >= sumRounds) {
                        // 触发总结
                        await autoSummarizeChat(friendId, config);
                        roundCount = 0; // 重置
                    }
                    
                    // 保存轮数计数
                    const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
                    if (!allSettings[friendId]) allSettings[friendId] = {};
                    allSettings[friendId].roundCount = roundCount;
                    localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings));
                }
            } catch (e) {
                if (chatStatus) {
                    chatStatus.textContent = '';
                    chatStatus.classList.remove('typing-status');
                }
                console.error("AI Error:", e);
                receiveAIMessage(e.message || "未知错误");
            }
        }

        // 处理 AI 消息片段（支持引用、表情过滤、一条条发送）
        async function processAIMessagePart(content, friendId, isCurrentChat) {
            if (!content || content.trim() === "") return;
            
            let quoteObj = null;

            // 1. 处理引用识别
            const quoteMatch = content.match(/^\(引用:\s*(.*?)\)\s*(.*)/s);
            if (quoteMatch) {
                const quotedContent = quoteMatch[1].trim();
                if (quotedContent) quoteObj = { content: quotedContent };
                content = quoteMatch[2].trim();
            }

            // 2. 处理表情包、照片解析与过滤
            const stickerRegex = /\[表情[:：]\s*(.*?)\]/g;
            const photoRegex = /\[照片[:：]\s*(.*?)\]/g;
            
            let combinedMatches = [];
            let m;
            while ((m = stickerRegex.exec(content)) !== null) {
                combinedMatches.push({ index: m.index, length: m[0].length, type: 'sticker', value: m[1].trim() });
            }
            while ((m = photoRegex.exec(content)) !== null) {
                combinedMatches.push({ index: m.index, length: m[0].length, type: 'photo', value: m[1].trim() });
            }
            combinedMatches.sort((a, b) => a.index - b.index);

            let lastIndex = 0;
            let finalParts = [];

            combinedMatches.forEach(match => {
                const prevText = content.substring(lastIndex, match.index).trim();
                if (prevText) finalParts.push({ type: 'text', content: prevText });
                
                if (match.type === 'sticker') {
                    const foundSticker = stickerList.find(s => s.name === match.value);
                    if (foundSticker) {
                        finalParts.push({ type: 'sticker', content: foundSticker });
                    }
                } else if (match.type === 'photo') {
                    finalParts.push({ type: 'photo', content: match.value });
                }
                lastIndex = match.index + match.length;
            });
            
            const remainingText = content.substring(lastIndex).trim();
            if (remainingText) finalParts.push({ type: 'text', content: remainingText });

            // 3. 分条发送逻辑
            if (finalParts.length > 0) {
                for (let i = 0; i < finalParts.length; i++) {
                    const part = finalParts[i];
                    // 只有第一条消息带上引用
                    const currentQuote = (i === 0) ? quoteObj : null;
                    
                    if (part.type === 'text') {
                        receiveAIMessage(part.content, currentQuote, null, friendId);
                    } else if (part.type === 'sticker') {
                        receiveAIMessage(null, currentQuote, part.content, friendId);
                    } else if (part.type === 'photo') {
                        receiveAIMessage(null, currentQuote, null, friendId, part.content);
                    }
                    
                    if (i < finalParts.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
                    }
                }
            } else if (quoteObj) {
                // 如果解析后没有有效内容但有引用，发送一个兜底消息
                receiveAIMessage("好的", quoteObj, null, friendId);
            }
        }

        window.openMergedChatDetail = function(msg) {
            const container = document.getElementById('mergedChatDetailContainer');
            const titleEl = document.getElementById('mergedDetailTitle');
            const contentEl = document.getElementById('mergedDetailContent');
            
            titleEl.textContent = msg.title || '聊天记录';
            contentEl.innerHTML = '';
            
            (msg.fullHistory || []).forEach(h => {
                const item = document.createElement('div');
                item.className = 'merged-msg-item';
                
                const date = new Date(h.time || Date.now());
                const timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                
                let displayContent = '';
                if (h.isMergedForward) {
                    // 如果详情里还有合并转发，渲染成气泡样式
                    displayContent = `
                        <div class="msg-bubble merged-forward-bubble" style="margin: 5px 0; cursor: pointer;">
                            <div class="merged-forward-title">${h.title || '聊天记录'}</div>
                            <div class="merged-forward-preview">
                                ${(h.fullHistory || []).slice(0, 2).map(prev => `${prev.name}：${prev.msgType === 'sticker' ? '[表情]' : prev.content}`).join('<br>')}
                            </div>
                            <div class="merged-forward-line"></div>
                            <div class="merged-forward-footer">聊天记录</div>
                        </div>
                    `;
                } else if (h.msgType === 'sticker') {
                    displayContent = `<img src="${h.content}" class="msg-sticker-img" style="margin-top: 5px;">`;
                } else {
                    displayContent = h.content;
                }
                
                item.innerHTML = `
                    <img src="${h.avatar || DEFAULT_AVATAR}" class="merged-msg-avatar">
                    <div class="merged-msg-info">
                        <div class="merged-msg-header">
                            <div class="merged-msg-name">${h.name}</div>
                            <div class="merged-msg-time">${timeStr}</div>
                        </div>
                        <div class="merged-msg-text">${displayContent}</div>
                    </div>
                `;
                
                // 处理嵌套点击
                const nestedBubble = item.querySelector('.merged-forward-bubble');
                if (nestedBubble) {
                    nestedBubble.onclick = (e) => {
                        e.stopPropagation();
                        openMergedChatDetail(h);
                    };
                }
                
                contentEl.appendChild(item);
            });
            
            container.style.display = 'flex';
            updateTime();
            saveUIState();
        };

        window.closeMergedChatDetail = function() {
            document.getElementById('mergedChatDetailContainer').style.display = 'none';
            saveUIState();
        };

        function receiveAIMessage(content, quote = null, sticker = null, targetFriendId = null, photo = null) {
            const friendId = targetFriendId || currentChatFriendId;
            if (!friendId) return;

            if (!chatHistories[friendId]) chatHistories[friendId] = [];

            const newMessage = {
                type: 'received',
                content: content || photo,
                time: new Date().getTime()
            };

            if (quote) {
                newMessage.quote = quote;
            }

            if (sticker) {
                newMessage.msgType = 'sticker';
                newMessage.content = sticker.src;
                newMessage.stickerName = sticker.name;
            }

            if (photo) {
                newMessage.msgType = 'photo';
                newMessage.content = photo;
            }
            
            chatHistories[friendId].push(newMessage);
            
            const friend = chatList.find(f => f.id === friendId);
            if (friend) {
                let displayMsg = content || "[收到一条消息]";
                if (sticker) displayMsg = `[${sticker.name}]`;
                else if (photo) displayMsg = `[照片]`;
                
                friend.message = displayMsg;
                friend.time = formatTime(new Date());
            }

            if (friendId === currentChatFriendId) {
                renderMessages();
            }
            
            saveChatHistories();
            saveChatListToStorage();
            renderChatList();
        }

        async function generateAiMoment(friendId) {
            const friend = chatList.find(f => f.id === friendId);
            if (!friend) return;
            const contact = contacts.find(c => c.id === friend.contactId);
            if (!contact) return;

            const configId = localStorage.getItem('current_api_config_id') || 'default';
            const configs = await dbGetAll('api_configs');
            const config = configs.find(c => c.id === configId);
            if (!config || !config.url || !config.key) {
                alert('请先在设置中配置有效的 API 以使用 AI 朋友圈功能');
                return;
            }

            // 获取最近的聊天记录作为上下文
            const history = chatHistories[friendId] || [];
            const recentMsgs = history.slice(-10).map(m => `${m.type === 'sent' ? '用户' : '你'}: ${m.content}`).join('\n');

            let systemPrompt = `你现在的身份是微信好友：${getFriendDisplayName(friend)}。
【身份信息】：你是一个真实的联系人，现在正准备发一条朋友圈。
【人设信息】：${contact.design || '一个普通的微信好友'}。
${recentMsgs ? '【最近聊天内容】：\n' + recentMsgs : ''}
【任务】：请根据你的人设以及最近和用户的互动内容（如果有），发一条朋友圈。朋友圈内容可以是你的生活琐事、感悟、或者隐晦地提到你们刚才聊的话题。
要求：
1. 文案要符合你的人设语气，自然、口语化。
2. 字数在50字以内。
3. 如果需要，可以描述配图内容。配图格式为：[图片: 描述内容]。最多可配1-4张图。
只返回内容，不要有任何前缀或后缀。`;

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
                    
                    let content = resContent;
                    let images = [];
                    const imgRegex = /\[图片[:：]\s*(.*?)\]/g;
                    let match;
                    while ((match = imgRegex.exec(resContent)) !== null) {
                        images.push({ type: 'text', content: match[1].trim() });
                    }
                    content = resContent.replace(imgRegex, '').trim();

                    if (!content && images.length === 0) return;

                    const newMoment = {
                        id: Date.now(),
                        friendId: friendId,
                        nickname: getFriendDisplayName(friend),
                        avatar: friend.avatar || DEFAULT_AVATAR,
                        content: content,
                        images: images,
                        time: Date.now(),
                        likes: [],
                        comments: [],
                        isMine: false
                    };
                    momentsData.unshift(newMoment);
                    localStorage.setItem('mimi_moments', JSON.stringify(momentsData));
                    if (document.getElementById('momentsContainer').style.display === 'flex') {
                        renderMoments();
                    }
                }
            } catch (e) { console.error("AI Moment Generation Error:", e); }
        }

        // 主动发消息定时检查
        function startProactiveMsgCheck() {
            setInterval(async () => {
                const now = new Date().getTime();
                const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
                
                for (const friendId in allSettings) {
                    const settings = allSettings[friendId];
                    const friendIdNum = parseInt(friendId);
                    
                    if (settings.proactiveMsg) {
                        const history = chatHistories[friendId] || [];
                        let lastTime = 0;
                        if (history.length > 0) {
                            lastTime = history[history.length - 1].time || 0;
                        }
                        
                        const idleTime = now - lastTime;
                        if ((lastTime === 0 || idleTime > 5 * 60 * 1000) && Math.random() > 0.7) {
                            console.log(`Triggering proactive message for friend: ${friendId}`);
                            await callAI(null, true, friendIdNum);
                        }
                    }

                    if (settings.proactiveMoment) {
                        // 随机触发朋友圈，降低频率
                        if (Math.random() > 0.95) {
                            console.log(`Triggering proactive moment for friend: ${friendId}`);
                            await generateAiMoment(friendIdNum);
                        }
                    }
                }
            }, 60000); // 每分钟检查一次
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
            document.querySelector('.phone-container').style.display = 'none';
            document.getElementById('themeContainer').style.display = 'flex';
            showThemeMainMenu();
            updateTime();
            updateBattery();
            saveUIState();
        }

        function closeThemePage() {
            document.getElementById('themeContainer').style.display = 'none';
            document.querySelector('.phone-container').style.display = 'flex';
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
            document.getElementById('themeContainer').style.display = 'none';
            document.getElementById('mineContainer').style.display = 'flex';
            document.querySelector('#mineContainer .theme-title').textContent = '我的主题';
            updateTime();
            updateBattery();
            renderThemeList();
            saveUIState();
        }

        function closeMinePage() {
            document.getElementById('mineContainer').style.display = 'none';
            document.getElementById('themeContainer').style.display = 'flex';
            showThemeMainMenu();
            saveUIState();
        }

        // IndexedDB 封装
        const DB_NAME = 'MimiPhoneDB';
        const DB_VERSION = 3; // 提升版本号以强制触发存储表更新
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
            document.getElementById('categoryManagementContainer').style.display = 'flex';
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
            document.getElementById('categoryManagementContainer').style.display = 'none';
            document.body.classList.remove('category-management-active');
            renderTopTagBar();
            renderChatList();
            saveUIState();
        }

        function renderCategoryManagementList() {
            const list = document.getElementById('categoryManagementList');
            const preview = document.getElementById('categoryPreviewTags');
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

        // 修改 renderChatList 以支持分类筛选
        const originalRenderChatList = window.renderChatList;
        window.renderChatList = function(searchKeyword = '') {
            const container = document.getElementById('chatList');
            
            let filteredList = chatList;
            
            // 顶部分类筛选
            if (currentSelectedCategory !== '默认') {
                const category = topCategories.find(c => c.name === currentSelectedCategory);
                if (category) {
                    filteredList = chatList.filter(chat => category.contactIds.includes(chat.contactId));
                }
            }

            if (searchKeyword) {
                filteredList = filteredList.filter(friend => {
                    const nameMatch = getFriendDisplayName(friend).toLowerCase().includes(searchKeyword);
                    const msgMatch = friend.message.toLowerCase().includes(searchKeyword);
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
            pinned.forEach((friend, index) => {
                html += renderChatItem(friend, true);
            });

            // 如果有置顶项且有普通项，插入物理灰色间隔
            if (pinned.length > 0 && others.length > 0) {
                html += '<div class="chat-list-physical-gap"></div>';
            }

            // 渲染普通列表
            others.forEach(friend => {
                html += renderChatItem(friend, false);
            });

            container.innerHTML = html;
            addSwipeListeners();
        };

        // 微信收藏逻辑
        let favoritesData = [];
        let favSelectMode = false;
        let selectedFavIds = new Set();
        let currentLongPressedFav = null;
        let favLongPressTimer = null;

        function loadFavoritesFromStorage() {
            const saved = localStorage.getItem('wechat_favorites_data');
            if (saved) {
                favoritesData = JSON.parse(saved);
            } else {
                favoritesData = [];
            }
        }

        function saveFavoritesToStorage() {
            localStorage.setItem('wechat_favorites_data', JSON.stringify(favoritesData));
        }

        function openWechatFavorites() {
            document.getElementById('wechatFavoritesContainer').style.display = 'flex';
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
            menu.style.display = 'none';
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
                    renderForwardContacts();
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
                    openMergedChatDetail(fav);
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

            renderMessages();
            saveChatHistories();
            saveChatListToStorage();
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
            const keyword = document.getElementById('favoritesSearchInput').value.trim();
            renderFavoritesList(keyword);
        }

        // 统一点击外部关闭收藏菜单
        document.addEventListener('touchstart', (e) => {
            const menu = document.getElementById('favContextMenu');
            if (menu && menu.style.display === 'flex' && !menu.contains(e.target)) {
                menu.style.display = 'none';
            }
        }, { passive: true });

        // 表情库逻辑
        let stickerList = [];
        let currentUploadMode = 'single';

        function loadStickers() {
            const saved = localStorage.getItem('wechat_stickers');
            if (saved) {
                stickerList = JSON.parse(saved);
            }
        }

        function saveStickers() {
            localStorage.setItem('wechat_stickers', JSON.stringify(stickerList));
        }

        function openStickerLibrary() {
            document.getElementById('stickerLibraryContainer').style.display = 'flex';
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
            const keyword = document.getElementById('stickerSearchInput').value.trim().toLowerCase();
            
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
            document.getElementById(`stickerUrlArea-${mode}`).style.display = 'block';
        }

        function hideStickerUrlInput(mode) {
            document.getElementById(`stickerUrlArea-${mode}`).style.display = 'none';
            document.getElementById(`stickerUrl-${mode}`).value = '';
        }

        function confirmStickerUrl(mode) {
            const input = document.getElementById(`stickerUrl-${mode}`);
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
            input.value = '';
            
            // 修复 Issue 1 & 2: 在打开名字模态框之前关闭上传模态框，并确保名字模态框在最前面
            closeStickerUploadModal();
            document.getElementById('batchStickerNameModal').classList.add('active');
            
            // 修复无法回车bug：确保 textarea 可以接收回车键并阻止冒泡
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
            const namesInput = document.getElementById('batchStickerNameInput').value.trim();
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
            document.getElementById('worldBookContainer').style.display = 'flex';
            document.querySelector('.phone-container').style.display = 'none';
            renderWorldBookList();
            updateTime();
            saveUIState();
        }

        function closeWorldBook() {
            document.getElementById('worldBookContainer').style.display = 'none';
            document.querySelector('.phone-container').style.display = 'flex';
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

        function toggleWorldBookBinding(id) {
            const index = tempBoundWorldBookIds.indexOf(id);
            if (index > -1) {
                tempBoundWorldBookIds.splice(index, 1);
            } else {
                tempBoundWorldBookIds.push(id);
            }
            renderWorldBookBindingList();
        }

        function confirmWorldBookBinding() {
            if (!currentChatFriendId) return;

            const allSettings = JSON.parse(localStorage.getItem('wechat_chat_settings') || '{}');
            if (!allSettings[currentChatFriendId]) allSettings[currentChatFriendId] = {};
            
            allSettings[currentChatFriendId].boundWorldBookIds = tempBoundWorldBookIds;
            localStorage.setItem('wechat_chat_settings', JSON.stringify(allSettings));

            // 更新 UI
            const boundCountEl = document.getElementById('chatInfoBoundCount');
            if (boundCountEl) {
                boundCountEl.textContent = tempBoundWorldBookIds.length > 0 ? `已绑定 ${tempBoundWorldBookIds.length} 本` : '未绑定';
            }

            closeWorldBookBindingModal();
            alert('绑定成功');
        }

        // 初始化
        (async function init() {
            // 检查微信是否已卸载
            if (localStorage.getItem('wechat_app_uninstalled') === 'true') {
                const wechatApp = document.getElementById('app1');
                if (wechatApp && wechatApp.parentElement) {
                    wechatApp.parentElement.style.display = 'none';
                }
            }

            updateTime();
            updateBattery();
            loadContactsFromStorage();
            loadCustomCategories();
            loadTextContent();
            loadChatListFromStorage();
            loadGroupListFromStorage();
            loadChatHistories();
            loadWechatUserInfo();
            loadRealNameInfo();
            loadTopCategories();
            loadFavoritesFromStorage();
            loadStickers();
            loadFavoriteStickers();
            renderTopTagBar();
            startProactiveMsgCheck();
            initMimiId();

            // 微信页面点开没有联系人
            if (chatList.length === 0) {
                // 不再增加示例联系人
            }
            
            setupLongPress();
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
            } catch (e) {
                console.error("Initialization failed:", e);
                alert("数据库初始化失败，部分功能可能无法使用。");
            }

            setInterval(() => {
                updateTime();
            }, 1000);
        })();
