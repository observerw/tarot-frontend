/**
 * 首页主脚本
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化首页
    initHomePage();
});

/**
 * 初始化首页
 */
async function initHomePage() {
    // 检查用户登录状态
    try {
        const authResult = await API.auth.checkStatus();
        updateUserMenu(authResult);
        
        // 加载牌阵列表
        loadTarotLayouts();
    } catch (error) {
        console.error('初始化错误:', error);
    }
}

/**
 * 更新用户菜单
 * @param {Object} authResult - 认证结果
 */
async function updateUserMenu(authResult) {
    const userInfoElement = document.getElementById('user-info');
    
    if (authResult.success && authResult.authenticated) {
        // 尝试获取会员信息
        let membershipInfo = null;
        try {
            const membershipResult = await API.membership.getInfo();
            if (membershipResult.success) {
                membershipInfo = membershipResult.membership;
            }
        } catch (err) {
            console.error('获取会员信息失败:', err);
        }
        
        // 构建用户菜单
        let membershipBadge = '';
        if (membershipInfo) {
            const badgeClass = membershipInfo.membership_level === 0 ? 'free' : 
                               membershipInfo.membership_level === 1 ? 'standard' : 'premium';
            membershipBadge = `<span class="membership-badge ${badgeClass}">${membershipInfo.membership_name}</span>`;
        }
        
        userInfoElement.innerHTML = `
            <div class="user-menu">
                <div class="user-info">
                    <div class="user-avatar">${authResult.user.username.charAt(0).toUpperCase()}</div>
                    <span class="username">${authResult.user.username}</span>
                    ${membershipBadge}
                    <div class="dropdown-icon">▼</div>
                </div>
                <div class="dropdown-menu">
                    <a href="membership.html" class="dropdown-item">会员中心</a>
                    <a href="history.html" class="dropdown-item">历史记录</a>
                    <a href="admin.html" class="dropdown-item">管理后台</a>
                    <a href="#" class="dropdown-item" id="logout-btn">退出登录</a>
                </div>
            </div>
        `;
        
        // 添加退出登录事件
        document.getElementById('logout-btn').addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const result = await API.auth.logout();
                if (result.success) {
                    window.location.reload();
                } else {
                    alert(result.message || '退出失败');
                }
            } catch (error) {
                console.error('退出登录错误:', error);
            }
        });
        
        // 添加下拉菜单切换功能
        const userMenu = document.querySelector('.user-menu');
        userMenu.addEventListener('click', function(e) {
            this.classList.toggle('active');
            e.stopPropagation();
        });
        
        // 点击页面其他地方关闭下拉菜单
        document.addEventListener('click', function() {
            userMenu.classList.remove('active');
        });
        
    } else {
        // 显示登录/注册按钮
        userInfoElement.innerHTML = `
            <div class="auth-buttons">
                <a href="login.html" class="button login-button">登录</a>
                <a href="register.html" class="button register-button">注册</a>
            </div>
        `;
    }
}

/**
 * 加载塔罗牌牌阵
 */
async function loadTarotLayouts() {
    // 获取牌阵容器
    const layoutsContainer = document.getElementById('layouts-container');
    
    try {
        // 加载牌阵数据
        const layouts = await API.getLayouts();
        
        // 清空容器并移除加载动画
        layoutsContainer.innerHTML = '';
        
        // 如果没有牌阵数据
        if (!layouts || layouts.length === 0) {
            layoutsContainer.innerHTML = '<div class="no-layouts">暂无可用的牌阵</div>';
            return;
        }
        
        // 渲染每个牌阵卡片
        layouts.forEach(layout => {
            const card = createLayoutCard(layout);
            layoutsContainer.appendChild(card);
        });
    } catch (error) {
        console.error('加载牌阵失败:', error);
        layoutsContainer.innerHTML = `
            <div class="error-message">
                <p>加载牌阵失败</p>
                <button class="secondary-button" onclick="initHomePage()">重试</button>
            </div>
        `;
    }
}

/**
 * 创建牌阵卡片
 * @param {Object} layout - 牌阵数据
 */
function createLayoutCard(layout) {
    const card = document.createElement('div');
    card.className = 'layout-card';
    card.innerHTML = `
        <h3>${layout.name}</h3>
        <p>${layout.description}</p>
        <div class="layout-info">
            <span class="card-count">${layout.card_count}张牌</span>
        </div>
        <div class="layout-visualization">
            ${createLayoutVisualization(layout)}
        </div>
        <button class="select-button">选择此牌阵</button>
    `;
    
    card.querySelector('.select-button').addEventListener('click', () => {
        selectLayout(layout.id);
    });
    
    return card;
}

/**
 * 创建牌阵可视化
 * @param {Object} layout - 牌阵数据
 */
function createLayoutVisualization(layout) {
    // 根据不同牌阵生成不同的可视化
    let html = '<div class="layout-placeholder">';
    
    if (layout.positions && layout.positions.length > 0) {
        // 使用牌阵中的位置信息生成可视化
        layout.positions.forEach((pos, index) => {
            // 简单的布局定位，根据x、y相对位置
            const left = (pos.x * 30) + 10;
            const top = (pos.y * 50) + 10;
            html += `
                <div class="card-placeholder" style="left: ${left}px; top: ${top}px;" 
                     title="${pos.name}: ${pos.description}"></div>
            `;
        });
    } else {
        // 默认可视化
        for (let i = 0; i < layout.card_count; i++) {
            const left = (i * 20) + 10;
            const top = 50;
            html += `<div class="card-placeholder" style="left: ${left}px; top: ${top}px;"></div>`;
        }
    }
    
    html += '</div>';
    return html;
}

/**
 * 选择牌阵并导航到聊天页面
 * @param {string} layoutId - 牌阵ID
 */
function selectLayout(layoutId) {
    // 保存选中的牌阵ID到会话存储
    sessionStorage.setItem('selectedLayoutId', layoutId);
    
    // 导航到聊天页面
    window.location.href = 'chat.html';
} 