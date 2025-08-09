/**
 * 历史记录详情页面
 * 用于显示完整的历史对话
 */
document.addEventListener('DOMContentLoaded', () => {
    initHistoryDetailPage();
});

// 全局变量
let currentHistoryId = null;

/**
 * 初始化历史详情页面
 */
async function initHistoryDetailPage() {
    try {
        // 从URL获取历史记录ID和管理员标识
        const urlParams = new URLSearchParams(window.location.search);
        currentHistoryId = urlParams.get('id');
        const isAdmin = urlParams.get('admin') === '1';
        
        if (!currentHistoryId) {
            showError('未指定历史记录ID');
            return;
        }
        
        // 检查登录状态
        const authResult = await API.auth.checkStatus();
        if (!authResult.success || !authResult.authenticated) {
            window.location.href = `login.html?redirect=history_detail.html?id=${currentHistoryId}${isAdmin ? '&admin=1' : ''}`;
            return;
        }
        
        // 加载历史记录详情 - 传递管理员标识
        loadHistoryDetail(isAdmin);
        
    } catch (error) {
        console.error('初始化历史详情页面错误:', error);
        showError('加载页面失败: ' + (error.message || '未知错误'));
    }
}

/**
 * 加载历史记录详情
 */
async function loadHistoryDetail(isAdmin = false) {
    try {
        const contentElement = document.getElementById('history-detail-content');
        contentElement.innerHTML = `<div class="loading">加载历史记录中...</div>`;
        
        // 获取历史记录详情 - 传递管理员标识
        const result = await API.history.getDetail(currentHistoryId, isAdmin);
        
        if (!result.success) {
            contentElement.innerHTML = `<div class="error">${result.message || '获取历史记录失败'}</div>`;
            return;
        }
        
        const history = result.history;
        
        // 设置页面标题
        document.title = `${history.title} - 塔罗牌 AI 对话历史`;
        
        // 渲染页面标题和元数据
        const headerElement = document.getElementById('history-header');
        headerElement.innerHTML = `
            <h1>${history.title}</h1>
            <div class="history-meta">
                <span>${history.created_at}</span>
                <span>${history.layout || '未使用牌阵'}</span>
            </div>
        `;
        
        // 渲染塔罗牌区域（如果有）
        if (history.cards && history.cards.length > 0) {
            renderTarotCards(history.cards);
        }
        
        // 清空内容区域
        contentElement.innerHTML = '';
        
        // 添加自定义样式 - 紫色主题风格
        if (!document.getElementById('history-message-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'history-message-styles';
            styleElement.innerHTML = `
                #history-detail-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    padding: 1rem;
                    background-color: #1a1a2e; /* 深色背景 */
                }
                
                .message {
                    margin-bottom: 1rem;
                    max-width: 85%;
                }
                
                .message.user {
                    align-self: flex-end;
                    margin-left: auto;
                }
                
                .message.assistant {
                    align-self: flex-start;
                    margin-right: auto;
                }
                
                .message .message-content {
                    padding: 12px 16px;
                    border-radius: 12px;
                    line-height: 1.5;
                }
                
                .message.user .message-content {
                    background-color: #7b68ee; /* 与您示例类似的紫色 */
                    color: white;
                }
                
                .message.assistant .message-content {
                    background-color: #4b3f72; /* 较暗的紫色 */
                    color: white;
                }
                
                .message-time {
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.7);
                    margin-top: 4px;
                    text-align: right;
                }
                
                /* 为空状态添加样式 */
                .empty-message {
                    color: rgba(255,255,255,0.7);
                    text-align: center;
                    padding: 2rem;
                }
                
                /* 卡片图片展示样式 */
                .tarot-cards-container {
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                    margin: 1rem 0;
                }
                
                .tarot-card {
                    width: 100px;
                    text-align: center;
                }
                
                .tarot-card img {
                    width: 100%;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                }
                
                .tarot-card-name {
                    margin-top: 0.5rem;
                    font-size: 0.9rem;
                    color: white;
                }
            `;
            document.head.appendChild(styleElement);
        }
        
        // 渲染完整的对话记录
        if (history.messages && history.messages.length > 0) {
            history.messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.className = `message ${message.role === 'user' ? 'user' : 'assistant'}`;
                
                // 处理消息内容，支持Markdown
                const formattedContent = formatMessage(message.content);
                
                messageElement.innerHTML = `
                    <div class="message-content">${formattedContent}</div>
                    <div class="message-time">${message.timestamp || ''}</div>
                `;
                
                contentElement.appendChild(messageElement);
            });
        } else {
            contentElement.innerHTML = `<div class="empty-message">没有对话记录</div>`;
        }
        
    } catch (error) {
        console.error('加载历史详情错误:', error);
        document.getElementById('history-detail-content').innerHTML = 
            `<div class="error">加载失败: ${error.message || '未知错误'}</div>`;
    }
}

/**
 * 渲染塔罗牌区域
 */
function renderTarotCards(cards) {
    const tarotArea = document.getElementById('tarot-area');
    if (!tarotArea) return;
    
    // 清空牌区域
    tarotArea.innerHTML = '';
    tarotArea.style.display = 'flex';
    
    // 渲染每张牌
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'tarot-card' + (card.reversed ? ' reversed' : '');
        
        cardElement.innerHTML = `
            <div class="tarot-card-position">${card.position}</div>
            <div class="tarot-card-inner">
                <div class="tarot-card-front"></div>
                <div class="tarot-card-back">
                    <img src="${card.image}" alt="${card.name}">
                    <div class="tarot-card-title">${card.name}</div>
                    ${card.reversed ? '<div class="reversed-indicator">逆位</div>' : ''}
                </div>
            </div>
        `;
        
        tarotArea.appendChild(cardElement);
    });
}

/**
 * 格式化消息内容 - 增强版
 * 支持Markdown格式化，特别针对塔罗牌解读内容
 */
function formatMessage(content) {
    if (!content) return '';
    
    // 处理换行符
    let formatted = content.replace(/\n/g, '<br>');
    
    // 处理标题 (### 标题)
    formatted = formatted.replace(/###\s+(.*?)(<br>|$)/g, '<h3>$1</h3>');
    
    // 处理子标题 (#### 标题)
    formatted = formatted.replace(/####\s+(.*?)(<br>|$)/g, '<h4>$1</h4>');
    
    // 处理水平分隔线 (---)
    formatted = formatted.replace(/---(<br>|$)/g, '<hr>');
    
    // 处理加粗 **文本**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理斜体 *文本*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 处理列表项 (- 或 • 开头)
    formatted = formatted.replace(/(-|\•)\s+(.*?)(<br>|$)/g, '<li>$2</li>');
    
    // 将连续的列表项包装在ul标签中
    formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    
    // 添加特殊样式
    const styleElement = document.createElement('style');
    if (!document.getElementById('tarot-reading-styles')) {
        styleElement.id = 'tarot-reading-styles';
        styleElement.innerHTML = `
            h3 {
                color: #d4b0ff;
                margin: 16px 0 8px 0;
                font-size: 1.3rem;
            }
            
            h4 {
                color: #b088ff;
                margin: 14px 0 6px 0;
                font-size: 1.1rem;
            }
            
            hr {
                border: 0;
                height: 1px;
                background: rgba(255,255,255,0.2);
                margin: 12px 0;
            }
            
            ul {
                padding-left: 20px;
                margin: 8px 0;
            }
            
            li {
                margin-bottom: 4px;
            }
            
            .message.assistant .message-content {
                padding: 16px;
            }
            
            .emoji-highlight {
                font-size: 1.2em;
                margin-right: 5px;
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    return formatted;
}

/**
 * 显示错误消息
 */
function showError(message) {
    const contentElement = document.getElementById('history-detail-content');
    if (contentElement) {
        contentElement.innerHTML = `<div class="error-message">${message}</div>`;
    } else {
        alert(message);
    }
} 