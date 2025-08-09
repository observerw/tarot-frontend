/**
 * 历史记录页面脚本
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化历史记录页面
    initHistoryPage();
});

// 全局变量
let currentPage = 1;
let totalPages = 1;
let currentUser = null;

/**
 * 初始化历史记录页面
 */
async function initHistoryPage() {
    try {
        // 检查用户登录状态
        const authResult = await API.checkAuthStatus();
        if (!authResult.success || !authResult.authenticated) {
            // 未登录，重定向到登录页
            window.location.href = 'login.html?redirect=history.html';
            return;
        }
        
        console.log("用户已登录，正在加载历史记录...");
        
        // 保存当前用户信息
        currentUser = authResult.user;
        
        // 加载用户信息
        loadUserInfo();
        
        // 加载历史记录
        loadHistories();
    } catch (error) {
        console.error('初始化历史页面错误:', error);
        showError('加载失败: ' + (error.message || '未知错误'));
    }
}

/**
 * 加载用户信息
 */
function loadUserInfo() {
    if (!currentUser) return;
    
    const userInfoElement = document.getElementById('user-info');
    userInfoElement.innerHTML = `
        <div class="user-avatar">${currentUser.username.substring(0, 1).toUpperCase()}</div>
        <span>${currentUser.username}</span>
        <button class="logout-btn" id="logout-btn">退出</button>
    `;
    
    // 绑定退出按钮事件
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

/**
 * 处理退出登录
 */
async function handleLogout() {
    try {
        const result = await API.logout();
        if (result.success) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('退出错误:', error);
        alert('退出失败，请重试');
    }
}

/**
 * 加载历史记录
 */
async function loadHistories() {
    try {
        const historyListElement = document.getElementById('history-list');
        historyListElement.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>加载历史记录中...</p>
            </div>
        `;
        
        const result = await API.getHistoryList(currentPage);
        
        historyListElement.innerHTML = '';
        
        if (result.pages) {
            totalPages = result.pages;
        }
        
        if (!result.success || !result.histories || result.histories.length === 0) {
            historyListElement.innerHTML = `
                <div class="empty-state">
                    <p>您还没有历史记录</p>
                    <a href="chat.html" class="primary-button">开始新对话</a>
                </div>
            `;
            return;
        }
        
        result.histories.forEach(history => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-title">${history.title}</div>
                <div class="history-meta">
                    <span>${history.created_at}</span>
                    <span>${history.layout || '未使用牌阵'}</span>
                </div>
                <div class="history-preview">${truncateText(history.answer, 100)}</div>
                <div class="history-actions">
                    <button class="view-btn" data-id="${history.id}">查看</button>
                    <button class="delete-btn" data-id="${history.id}">删除</button>
                </div>
            `;
            
            const viewBtn = historyItem.querySelector('.view-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // 跳转到详情页面而不是弹窗
                    window.location.href = `history_detail.html?id=${history.id}`;
                });
            }
            
            const deleteBtn = historyItem.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除这条历史记录吗？')) {
                        deleteHistory(history.id);
                    }
                });
            }
            
            historyListElement.appendChild(historyItem);
        });
        
        renderPagination();
        
    } catch (error) {
        console.error('加载历史记录错误:', error);
        showError('加载历史记录失败: ' + (error.message || '未知错误'));
    }
}

/**
 * 截断文本
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * 渲染分页
 */
function renderPagination() {
    const paginationElement = document.getElementById('pagination');
    if (!paginationElement) return;
    
    if (totalPages <= 1) {
        paginationElement.innerHTML = '';
        return;
    }
    
    paginationElement.innerHTML = '';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn prev-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.textContent = '上一页';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadHistories();
        }
    });
    paginationElement.appendChild(prevBtn);
    
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            if (i !== currentPage) {
                currentPage = i;
                loadHistories();
            }
        });
        paginationElement.appendChild(pageBtn);
    }
    
    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn next-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.textContent = '下一页';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadHistories();
        }
    });
    paginationElement.appendChild(nextBtn);
}

/**
 * 删除历史记录
 * @param {number} historyId - 历史记录ID
 */
async function deleteHistory(historyId) {
    try {
        const result = await API.deleteHistory(historyId);
        if (result.success) {
            loadHistories();
        } else {
            alert(result.message || '删除失败');
        }
    } catch (error) {
        console.error('删除历史记录错误:', error);
        alert('删除失败，请重试');
    }
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 */
function showError(message) {
    const historyListElement = document.getElementById('history-list');
    historyListElement.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button class="primary-button" onclick="loadHistories()">重试</button>
        </div>
    `;
}

/**
 * 渲染历史记录列表
 * @param {Array} histories - 历史记录数组
 * @param {number} total - 总记录数
 * @param {number} totalPages - 总页数
 * @param {number} page - 当前页码
 */
function renderHistoryList(histories, total, totalPages, page) {
    const historyListElement = document.getElementById('history-list');
    historyListElement.innerHTML = '';
    
    if (!histories || histories.length === 0) {
        historyListElement.innerHTML = `
            <div class="empty-history">
                <p>暂无历史记录</p>
                <a href="index.html" class="primary-button">开始咨询</a>
            </div>
        `;
        return;
    }
    
    histories.forEach(history => {
        const questionPreview = truncateText(history.question || '无问题', 60);
        const answerPreview = truncateText(history.answer || '无回答', 100);
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-header">
                <h3 class="history-title">${history.title}</h3>
                <div class="history-time">${history.created_at}</div>
            </div>
            <div class="history-content">
                <div class="history-layout">牌阵: ${history.layout}</div>
                <div class="history-question"><strong>问题:</strong> ${questionPreview}</div>
                <div class="history-answer-preview"><strong>回答预览:</strong> ${answerPreview}</div>
            </div>
            <div class="history-footer">
                <button class="view-btn" data-id="${history.id}">查看详情</button>
                <button class="delete-btn" data-id="${history.id}">删除</button>
            </div>
        `;
        
        historyListElement.appendChild(historyItem);
    });
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const historyId = e.target.getAttribute('data-id');
            viewHistoryDetail(historyId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const historyId = e.target.getAttribute('data-id');
            if (confirm('确定要删除这条历史记录吗？')) {
                deleteHistory(historyId);
            }
        });
    });
    
    renderPagination(total, totalPages, page);
}

/**
 * 查看历史记录详情
 * @param {number} historyId - 历史记录ID
 */
async function viewHistoryDetail(historyId) {
    try {
        showLoadingModal('正在加载历史记录详情...');
        
        const result = await API.getHistoryDetail(historyId);
        
        hideLoadingModal();
        
        if (result.success) {
            showHistoryDetailModal(result.history);
        } else {
            alert(result.message || '获取历史记录详情失败');
        }
    } catch (error) {
        hideLoadingModal();
        console.error('查看历史记录详情错误:', error);
        alert('获取历史记录详情失败，请重试');
    }
}

/**
 * 显示历史记录详情弹窗
 * @param {Object} history - 历史记录对象
 */
function showHistoryDetailModal(history) {
    let modalElement = document.getElementById('history-detail-modal');
    
    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.id = 'history-detail-modal';
        modalElement.className = 'modal';
        document.body.appendChild(modalElement);
    }
    
    let cardsInfo = [];
    try {
        if (history.cards) {
            cardsInfo = JSON.parse(history.cards);
        }
    } catch (e) {
        console.error('解析牌阵信息错误:', e);
        cardsInfo = [];
    }
    
    let cardsHtml = '';
    if (Array.isArray(cardsInfo) && cardsInfo.length > 0) {
        cardsHtml = `
            <div class="cards-container">
                ${cardsInfo.map(card => `
                    <div class="card-item">
                        <div class="card-name">${card.name || '未知卡牌'}</div>
                        <div class="card-position">${card.position || '位置'}</div>
                        <div class="card-orientation">${card.reversed ? '逆位' : '正位'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        cardsHtml = '<p>无牌阵信息</p>';
    }
    
    modalElement.innerHTML = `
        <div class="modal-content history-detail-content">
            <span class="close" id="close-history-detail">&times;</span>
            <h2>${history.title}</h2>
            <div class="history-meta">
                <span class="history-time">${history.created_at}</span>
                <span class="history-layout">牌阵: ${history.layout}</span>
            </div>
            
            <div class="history-section">
                <h3>抽取的牌</h3>
                ${cardsHtml}
            </div>
            
            <div class="history-section">
                <h3>我的问题</h3>
                <div class="history-question-full">${history.question || '无问题'}</div>
            </div>
            
            <div class="history-section">
                <h3>AI回答</h3>
                <div class="history-answer-full">${formatAIResponse(history.answer)}</div>
            </div>
            
            <div class="modal-footer">
                <button id="close-detail-btn" class="secondary-button">关闭</button>
            </div>
        </div>
    `;
    
    modalElement.classList.add('active');
    
    document.getElementById('close-history-detail').addEventListener('click', () => {
        modalElement.classList.remove('active');
    });
    
    document.getElementById('close-detail-btn').addEventListener('click', () => {
        modalElement.classList.remove('active');
    });
}

/**
 * 格式化AI回复，保留换行和格式
 * @param {string} text - AI回复文本
 * @returns {string} - 格式化后的HTML
 */
function formatAIResponse(text) {
    if (!text) return '无回复';
    
    return text.replace(/\n/g, '<br>');
}

/**
 * 显示加载中模态窗口
 * @param {string} message - 加载信息
 */
function showLoadingModal(message = '加载中...') {
    let loadingModal = document.getElementById('loading-modal');
    
    if (!loadingModal) {
        loadingModal = document.createElement('div');
        loadingModal.id = 'loading-modal';
        loadingModal.className = 'modal';
        document.body.appendChild(loadingModal);
    }
    
    loadingModal.innerHTML = `
        <div class="modal-content loading-content">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
    
    loadingModal.classList.add('active');
}

/**
 * 隐藏加载中模态窗口
 */
function hideLoadingModal() {
    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) {
        loadingModal.classList.remove('active');
    }
} 