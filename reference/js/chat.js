/**
 * 聊天页面主脚本
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化聊天页面
    initChatPage();
});

// 全局变量
let selectedLayoutId = null;
let messageHistory = [];
let isWaitingForResponse = false;
let drawButtonShown = false;
let currentUser = null;
let currentHistoryId = null;
let hasUnsavedChanges = false;
let autoSaveTimeout = null;
let lastUpdateTime = 0; // 用于跟踪上次更新时间

/**
 * 初始化聊天页面
 */
async function initChatPage() {
    // 检查用户登录状态
    try {
        const authResult = await API.auth.checkStatus();
        if (authResult.success && authResult.authenticated) {
            currentUser = authResult.user;
            // 添加用户信息和保存按钮
            addUserInfoToHeader();
        }
    } catch (error) {
        console.error('检查登录状态错误:', error);
    }
    
    // 检查是否有需要恢复的备份
    await checkForBackup();
    
    // 检查URL参数是否有历史记录ID
    const urlParams = new URLSearchParams(window.location.search);
    const historyId = urlParams.get('history');
    
    if (historyId && !currentHistoryId) {
        // 从历史记录加载对话
        await loadFromHistory(historyId);
    } else if (!currentHistoryId) {
        // 常规初始化，获取选中的牌阵ID
        selectedLayoutId = sessionStorage.getItem('selectedLayoutId');
        
        // 初始化塔罗功能
        const initialized = await Tarot.init(selectedLayoutId);
        
        if (initialized) {
            // 更新页面标题
            document.getElementById('layout-title').textContent = Tarot.currentLayout.name;
        } else {
            showSystemMessage('无法加载牌阵信息，请返回首页重试。');
        }
    }
    
    // 事件监听器
    setupEventListeners();
    
    // 添加页面关闭前的保存提示
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            backupToLocalStorage();
            // 现代浏览器会显示默认提示，不会使用自定义消息
            e.preventDefault();
            e.returnValue = '您有未保存的对话，确定要离开吗？';
            return e.returnValue;
        }
    });
}

/**
 * 将对话备份到localStorage
 */
function backupToLocalStorage() {
    try {
        // 只有当有足够的消息且有未保存的更改时才备份
        if (messageHistory.length <= 1 || !hasUnsavedChanges) {
            return;
        }
        
        const backupData = {
            history_id: currentHistoryId,
            messages: messageHistory,
            cards: Tarot.drawnCards || [],
            layout_id: Tarot.currentLayout ? Tarot.currentLayout.id : null,
            layout_type: Tarot.currentLayout ? Tarot.currentLayout.name : null,
            timestamp: new Date().getTime()
        };
        
        localStorage.setItem('tarot_chat_backup', JSON.stringify(backupData));
        console.log('对话已备份到本地存储');
    } catch (e) {
        console.error('备份到localStorage失败:', e);
    }
}

/**
 * 安全地更新历史记录
 */
function safeUpdateHistory() {
    // 防止频繁更新，如果距离上次更新不足5秒，就不更新
    const now = Date.now();
    if (now - lastUpdateTime < 5000) {
        console.log('更新太频繁，跳过本次更新');
        return;
    }
    
    lastUpdateTime = now;
    
    // 使用setTimeout实现完全异步更新，不阻塞UI
    setTimeout(async () => {
        if (!currentHistoryId) return;
        
        try {
            const updateData = {
                history_id: currentHistoryId,
                messages: JSON.parse(JSON.stringify(messageHistory)),
                cards: Tarot.drawnCards ? JSON.parse(JSON.stringify(Tarot.drawnCards)) : []
            };
            
            console.log('正在更新历史记录...');
            const result = await API.history.updateHistory(updateData);
            
            if (result.success) {
                console.log('历史记录已成功更新');
                hasUnsavedChanges = false;
                // 清除本地备份，因为已经成功保存到服务器
                localStorage.removeItem('tarot_chat_backup');
            } else {
                console.warn('更新历史记录失败:', result.message);
                // 保持未保存状态
                hasUnsavedChanges = true;
                // 更新本地备份
                backupToLocalStorage();
            }
        } catch (error) {
            console.error('更新历史记录出错:', error);
            // 保持未保存状态
            hasUnsavedChanges = true;
            // 确保有本地备份
            backupToLocalStorage();
        }
    }, 500);
}

/**
 * 检查是否有需要恢复的对话备份
 */
async function checkForBackup() {
    try {
        const backupJson = localStorage.getItem('tarot_chat_backup');
        if (!backupJson) return;
        
        const backup = JSON.parse(backupJson);
        const backupAge = (new Date().getTime() - backup.timestamp) / (1000 * 60); // 分钟
        
        // 如果备份不超过30分钟且有消息历史
        if (backupAge <= 30 && backup.messages && backup.messages.length > 0) {
            // 显示恢复确认对话框
            if (confirm('发现未保存完成的对话，是否恢复？')) {
                // 恢复消息历史和其他状态
                messageHistory = backup.messages;
                currentHistoryId = backup.history_id;
                
                // 如果有牌阵信息，初始化牌阵
                if (backup.layout_id) {
                    selectedLayoutId = backup.layout_id;
                    const initialized = await Tarot.init(selectedLayoutId);
                    
                    if (initialized && backup.cards && backup.cards.length > 0) {
                        // 设置抽出的牌
                        Tarot.drawnCards = backup.cards;
                        
                        // 显示塔罗牌
                        const tarotArea = document.getElementById('tarot-area');
                        Tarot.renderCards(tarotArea);
                    }
                }
                
                // 清空聊天区域
                document.getElementById('chat-messages').innerHTML = '';
                
                // 更新页面标题
                if (Tarot.currentLayout) {
                    document.getElementById('layout-title').textContent = Tarot.currentLayout.name;
                }
                
                // 恢复消息到聊天界面
                for (const message of messageHistory) {
                    if (message.role === 'user') {
                        addMessage(message.content, 'user');
                    } else if (message.role === 'assistant') {
                        addMessage(message.content, 'bot');
                    }
                }
                
                // 设置为已抽牌状态（如果有卡牌）
                if (backup.cards && backup.cards.length > 0) {
                    drawButtonShown = true;
                    document.getElementById('draw-cards-button').style.display = 'none';
                } else {
                    showDrawButton();
                }
                
                showNotification('对话已恢复', 'success');
                hasUnsavedChanges = true;
            } else {
                // 用户选择不恢复，清除备份
                localStorage.removeItem('tarot_chat_backup');
            }
        } else {
            // 备份太旧或无效，清除
            localStorage.removeItem('tarot_chat_backup');
        }
    } catch (e) {
        console.error('检查备份错误:', e);
        // 出错时清除可能已损坏的备份数据
        localStorage.removeItem('tarot_chat_backup');
    }
}

/**
 * 从历史记录加载对话
 * @param {string} historyId - 历史记录ID
 */
async function loadFromHistory(historyId) {
    try {
        const result = await API.history.getDetail(historyId);
        
        if (!result.success) {
            showSystemMessage('无法加载历史记录，请返回首页重试。');
            return false;
        }
        
        const history = result.history;
        currentHistoryId = history.id;
        
        // 清空聊天区域，只保留欢迎消息
        document.getElementById('chat-messages').innerHTML = `
            <div class="message system">
                <div class="message-content">
                    正在查看历史对话：${history.title}
                </div>
            </div>
        `;
        
        // 更新页面标题
        document.getElementById('layout-title').textContent = `历史: ${history.title}`;
        
        // 如果有牌阵信息，初始化牌阵
        if (history.layout_id) {
            selectedLayoutId = history.layout_id;
            const initialized = await Tarot.init(selectedLayoutId);
            
            if (initialized && history.cards && history.cards.length > 0) {
                // 显示历史抽取的牌
                Tarot.displayHistoryCards(history.cards);
            }
        }
        
        // 加载消息历史
        messageHistory = history.messages || [];
        
        // 显示历史消息
        for (const message of messageHistory) {
            if (message.role === 'user') {
                addMessage(message.content, 'user');
            } else if (message.role === 'assistant') {
                addMessage(message.content, 'bot');
            }
        }
        
        // 隐藏抽牌按钮，因为是历史记录
        document.getElementById('draw-cards-button').style.display = 'none';
        
        return true;
    } catch (error) {
        console.error('加载历史记录错误:', error);
        showSystemMessage('加载历史记录时发生错误，请返回首页重试。');
        return false;
    }
}

/**
 * 添加用户信息到页面头部
 */
function addUserInfoToHeader() {
    if (!currentUser) return;
    
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;
    
    // 创建用户信息容器
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
        <span class="username">${currentUser.username}</span>
        <button id="save-chat-btn" class="small-button">保存对话</button>
        <a href="history.html" class="small-button">历史记录</a>
    `;
    
    headerRight.appendChild(userInfo);
    
    // 绑定保存按钮事件
    document.getElementById('save-chat-btn').addEventListener('click', saveConversation);
}

/**
 * 保存当前对话为历史记录
 */
async function saveConversation() {
    try {
        // 检查是否有消息可以保存
        if (messageHistory.length <= 1) { // 只有欢迎消息时不保存
            showNotification('没有足够的对话内容可保存', 'error');
            return;
        }
        
        // 如果已经有历史ID，询问是否更新
        if (currentHistoryId) {
            if (!confirm('此对话已保存，是否更新?')) {
                return;
            }
        }
        
        // 显示保存对话弹窗
        const title = await showSaveDialog();
        if (!title) return; // 用户取消保存
        
        // 准备要保存的数据
        const dataToSave = {
            title: title,
            messages: messageHistory,
            layout_id: Tarot.currentLayout ? Tarot.currentLayout.id : null,
            layout_type: Tarot.currentLayout ? Tarot.currentLayout.name : null,
            cards: Tarot.drawnCards
        };
        
        // 如果已有ID，则添加到数据中
        if (currentHistoryId) {
            dataToSave.history_id = currentHistoryId;
            
            // 使用更新API
            const result = await API.history.updateHistory(dataToSave);
            
            if (result.success) {
                showNotification('对话已更新', 'success');
                hasUnsavedChanges = false;
                // 清除本地备份
                localStorage.removeItem('tarot_chat_backup');
            } else {
                showNotification(result.message || '更新失败', 'error');
            }
        } else {
            // 使用保存API创建新记录
            const result = await API.history.saveHistory(dataToSave);
            
            if (result.success) {
                showNotification('对话已保存', 'success');
                // 更新当前历史ID，防止重复保存
                currentHistoryId = result.history_id;
                hasUnsavedChanges = false;
                // 清除本地备份
                localStorage.removeItem('tarot_chat_backup');
            } else {
                showNotification(result.message || '保存失败', 'error');
            }
        }
    } catch (error) {
        console.error('保存对话错误:', error);
        showNotification('保存失败: ' + (error.message || '未知错误'), 'error');
        // 确保本地备份
        backupToLocalStorage();
    }
}

/**
 * 显示保存对话弹窗
 * @returns {Promise<string>} 用户输入的标题
 */
function showSaveDialog() {
    return new Promise((resolve) => {
        // 创建模态对话框
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'save-dialog-modal';
        
        // 设置模态框内容
        modal.innerHTML = `
            <div class="modal-content">
                <h2>保存对话</h2>
                <p>请为这次对话设置一个标题:</p>
                <input type="text" id="save-title-input" placeholder="对话标题" maxlength="100">
                <div class="modal-buttons">
                    <button id="cancel-save-btn" class="secondary-button">取消</button>
                    <button id="confirm-save-btn" class="primary-button">保存</button>
                </div>
            </div>
        `;
        
        // 添加到文档中
        document.body.appendChild(modal);
        
        // 显示模态框
        setTimeout(() => {
            modal.classList.add('active');
            document.getElementById('save-title-input').focus();
        }, 10);
        
        // 绑定取消按钮事件
        document.getElementById('cancel-save-btn').addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                resolve(null);
            }, 300);
        });
        
        // 绑定确认按钮事件
        document.getElementById('confirm-save-btn').addEventListener('click', () => {
            const titleInput = document.getElementById('save-title-input');
            const title = titleInput.value.trim();
            
            if (!title) {
                titleInput.classList.add('error');
                setTimeout(() => titleInput.classList.remove('error'), 1000);
                return;
            }
            
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                resolve(title);
            }, 300);
        });
        
        // 支持回车键确认
        document.getElementById('save-title-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('confirm-save-btn').click();
            }
        });
    });
}

/**
 * 显示通知消息
 * @param {string} message - 通知内容
 * @param {string} type - 通知类型（success/error/warning）
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 动画显示
    setTimeout(() => notification.classList.add('show'), 10);
    
    // 自动消失
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 发送按钮点击事件
    document.getElementById('send-button').addEventListener('click', sendMessage);
    
    // 输入框回车事件
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 抽牌按钮点击事件
    document.getElementById('draw-cards-button').addEventListener('click', drawTarotCards);
}

/**
 * 解析Markdown格式为HTML
 * @param {string} text - 包含Markdown的文本
 * @returns {string} HTML格式的文本
 */
function parseMarkdown(text) {
    if (!text) return '';
    
    // 先处理水平分隔线，避免与其他格式冲突
    let html = text.replace(/^---+$/gm, '<hr>');
    
    // 处理标题
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
    html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
    
    // 处理粗体
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    
    // 处理链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // 处理有序列表
    html = html.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');
    
    // 处理无序列表
    html = html.replace(/^- (.*)$/gm, '<li>$1</li>');
    
    // 将连续的列表项包装在适当的列表标签中
    html = html.replace(/<li>.*?<\/li>(?:\s*<li>.*?<\/li>)+/gs, function(match) {
        return '<ul>' + match + '</ul>';
    });
    
    // 添加段落标签（对于不是标题、列表或其他块元素的文本行）
    html = html.replace(/^([^<\n].*[^>])$/gm, '<p>$1</p>');
    
    // 处理换行，但避免在HTML标签内添加<br>
    html = html.replace(/\n(?![<])/g, '<br>');
    
    return html;
}

/**
 * 创建消息元素
 * @param {string} content - 消息内容
 * @param {string} role - 消息角色
 * @returns {HTMLElement} 消息元素
 */
function createMessageElement(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // 根据角色决定是否解析Markdown
    if (role === 'bot') {
        contentDiv.innerHTML = parseMarkdown(content);
    } else {
        contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(contentDiv);
    
    // 如果不是系统消息，添加时间戳
    if (role !== 'system') {
        addTimeToMessage(messageDiv);
    }
    
    return messageDiv;
}

/**
 * 向消息添加时间戳
 * @param {HTMLElement} messageElement - 消息元素
 */
function addTimeToMessage(messageElement) {
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    
    const now = new Date();
    timeDiv.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    messageElement.appendChild(timeDiv);
}

/**
 * 显示系统消息
 * @param {string} message - 消息内容
 */
function showSystemMessage(message) {
    addMessage(message, 'system');
}

/**
 * 显示"正在输入"指示器
 */
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
    `;
    
    document.getElementById('chat-messages').appendChild(typingDiv);
    scrollToBottom();
}

/**
 * 移除"正在输入"指示器
 */
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * 滚动到聊天窗口底部
 */
function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * 显示抽牌按钮
 */
function showDrawButton() {
    const drawButton = document.getElementById('draw-cards-button');
    drawButton.style.display = 'block';
}

/**
 * 准备消息历史
 * @returns {Array} 格式化的消息历史
 */
function prepareMessageHistory() {
    // 深拷贝以避免修改原始历史
    return JSON.parse(JSON.stringify(messageHistory));
}

/**
 * 发送消息
 */
async function sendMessage() {
    // 获取输入框
    const inputElement = document.getElementById('chat-input');
    const message = inputElement.value.trim();
    
    // 如果消息为空或正在等待回应，则返回
    if (!message || isWaitingForResponse) return;
    
    // 清空输入框
    inputElement.value = '';
    
    // 添加用户消息到聊天
    addMessage(message, 'user');
    
    // 更新状态
    isWaitingForResponse = true;
    
    // 显示"正在输入"指示器
    showTypingIndicator();
    
    try {
        // 先将用户消息添加到历史
        messageHistory.push({ role: 'user', content: message });
        
        // 准备消息历史
        const history = prepareMessageHistory();
        
        // 发送消息到AI
        const stream = await API.sendQuestion(message, history, true);
        
        // 创建bot消息并准备更新
        const botMessageElement = createMessageElement('', 'bot');
        document.getElementById('chat-messages').appendChild(botMessageElement);
        
        let botResponse = '';
        
        // 处理流式回应
        stream.onChunk((chunk) => {
            botResponse += chunk;
            // 实时解析Markdown
            botMessageElement.querySelector('.message-content').innerHTML = parseMarkdown(botResponse);
            
            // 滚动到底部
            scrollToBottom();
        });
        
        stream.onComplete((fullText) => {
            // 移除"正在输入"指示器
            removeTypingIndicator();
            
            // 添加时间戳
            addTimeToMessage(botMessageElement);
            
            // 更新状态
            isWaitingForResponse = false;
            
            // 确保历史记录中保存原始Markdown文本，而不是HTML
            messageHistory.push({ role: 'user', content: message });
            messageHistory.push({ role: 'assistant', content: fullText });
            
            // 设置有未保存的更改
            hasUnsavedChanges = true;
            
            // 如果尚未显示抽牌按钮，现在显示
            if (!drawButtonShown) {
                showDrawButton();
                drawButtonShown = true;
            }
            
            // 创建本地备份
            backupToLocalStorage();
            
            // 如果有历史ID，安全地更新历史记录
            if (currentHistoryId) {
                safeUpdateHistory();
            } else if (currentUser) {
                // 设置自动保存定时器（仅在没有历史ID时）
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(() => {
                    if (hasUnsavedChanges && !currentHistoryId && currentUser) {
                        autoSaveConversation();
                    }
                }, 5000); // 5秒后自动保存
            }
        });
        
        stream.onError((error) => {
            console.error('流响应错误:', error);
            removeTypingIndicator();
            showSystemMessage('发生错误，请重试。');
            isWaitingForResponse = false;
            // 移除最后一个用户消息，因为它没有得到回应
            if (messageHistory.length > 0 && messageHistory[messageHistory.length - 1].role === 'user') {
                messageHistory.pop();
            }
        });
    } catch (error) {
        console.error('发送消息错误:', error);
        removeTypingIndicator();
        showSystemMessage('发送消息失败，请重试。');
        isWaitingForResponse = false;
        // 移除最后一个用户消息，因为它没有得到回应
        if (messageHistory.length > 0 && messageHistory[messageHistory.length - 1].role === 'user') {
            messageHistory.pop();
        }
    }
}

/**
 * 自动保存当前对话
 */
async function autoSaveConversation() {
    try {
        // 如果消息历史太少，不进行保存
        if (messageHistory.length <= 1) {
            return;
        }
        
        // 自动生成标题
        let title = '塔罗对话';
        if (messageHistory.length > 0) {
            // 从用户的第一个问题生成标题
            const firstUserMessage = messageHistory.find(msg => msg.role === 'user');
            if (firstUserMessage) {
                // 截取问题的前20个字符作为标题
                title = firstUserMessage.content.substring(0, 20) + (firstUserMessage.content.length > 20 ? '...' : '');
            }
        }
        
        // 如果有牌阵信息，添加到标题
        if (Tarot.currentLayout) {
            title = `${title} - ${Tarot.currentLayout.name}`;
        }
        
        // 准备要保存的数据
        const dataToSave = {
            title: title,
            messages: messageHistory,
            layout_id: Tarot.currentLayout ? Tarot.currentLayout.id : null,
            layout_type: Tarot.currentLayout ? Tarot.currentLayout.name : null,
            cards: Tarot.drawnCards
        };
        
        // 保存到历史记录
        const result = await API.history.saveHistory(dataToSave);
        
        if (result.success) {
            showNotification('对话已自动保存', 'success');
            // 更新当前历史ID，防止重复保存
            currentHistoryId = result.history_id;
            hasUnsavedChanges = false;
            // 清除本地备份
            localStorage.removeItem('tarot_chat_backup');
        } else {
            console.error('自动保存失败:', result.message);
            // 确保本地备份
            backupToLocalStorage();
        }
    } catch (error) {
        console.error('自动保存错误:', error);
        // 确保本地备份
        backupToLocalStorage();
    }
}

/**
 * 抽取塔罗牌
 */
async function drawTarotCards() {
    if (!selectedLayoutId) {
        showSystemMessage('未选择牌阵，无法抽牌。');
        return;
    }
    
    try {
        // 显示加载中消息
        showSystemMessage('正在抽取塔罗牌...');
        
        // 抽牌
        await Tarot.drawCards(selectedLayoutId);
        
        // 获取塔罗区域并渲染卡牌
        const tarotArea = document.getElementById('tarot-area');
        Tarot.renderCards(tarotArea);
        
        // 显示系统消息
        showSystemMessage('塔罗牌已抽取完毕，请点击卡牌查看详情。');
        
        // 设置为已经有未保存的更改
        hasUnsavedChanges = true;
        
        // 创建本地备份
        backupToLocalStorage();
        
        // 如果有历史ID，安全地更新历史记录以保存抽牌结果
        if (currentHistoryId) {
            safeUpdateHistory();
        }
        
        // 生成解牌提示
        const readingPrompt = Tarot.generateReadingPrompt();
        
        // 等待所有卡牌翻开
        setTimeout(() => {
            // 自动发送解牌请求
            document.getElementById('chat-input').value = readingPrompt;
            sendMessage();
        }, Tarot.drawnCards.length * 500 + 1000);
        
    } catch (error) {
        console.error('抽牌错误:', error);
        showSystemMessage('抽取塔罗牌失败，请重试。');
    }
}

/**
 * 添加消息到聊天窗口
 * @param {string} content - 消息内容
 * @param {string} role - 消息角色(user/bot/system)
 */
function addMessage(content, role) {
    const messageElement = createMessageElement(content, role);
    document.getElementById('chat-messages').appendChild(messageElement);
    scrollToBottom();
} 