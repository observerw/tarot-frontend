/**
 * 会员中心页面脚本
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化会员中心
    initMembershipPage();
    
    // 添加事件监听器
    document.getElementById('upgrade-standard').addEventListener('click', () => {
        upgradeMembership(1);
    });
    
    document.getElementById('upgrade-premium').addEventListener('click', () => {
        upgradeMembership(2);
    });
});

/**
 * 初始化会员中心页面
 */
async function initMembershipPage() {
    try {
        // 检查登录状态
        const authResult = await API.auth.checkStatus();
        if (!authResult.success || !authResult.authenticated) {
            // 未登录，重定向到登录页
            window.location.href = 'login.html?redirect=membership.html';
            return;
        }
        
        // 加载会员信息
        loadMembershipInfo();
    } catch (error) {
        console.error('初始化会员中心错误:', error);
        alert('加载会员中心失败，请重试');
    }
}

/**
 * 加载会员信息
 */
async function loadMembershipInfo() {
    try {
        const result = await API.membership.getInfo();
        if (!result.success) {
            throw new Error(result.message || '获取会员信息失败');
        }
        
        const membership = result.membership;
        
        // 更新当前会员信息区域
        updateMembershipUI(membership);
        
        // 更新按钮状态
        updateButtonsState(membership.membership_level);
        
        // 添加用户信息到页面头部
        addUserInfoToHeader(membership);
    } catch (error) {
        console.error('加载会员信息错误:', error);
        const currentMembershipElement = document.getElementById('current-membership');
        currentMembershipElement.innerHTML = `
            <div class="error-message">
                <p>获取会员信息失败: ${error.message}</p>
                <button class="retry-button" onclick="loadMembershipInfo()">重试</button>
            </div>
        `;
    }
}

/**
 * 更新会员信息UI
 * @param {Object} membership - 会员信息
 */
function updateMembershipUI(membership) {
    const currentMembershipElement = document.getElementById('current-membership');
    
    // 获取会员徽章类名
    let badgeClass = 'badge-free';
    if (membership.membership_level === 1) {
        badgeClass = 'badge-standard';
    } else if (membership.membership_level === 2) {
        badgeClass = 'badge-premium';
    }
    
    // 生成会员到期时间显示
    let expiryText = '永久有效';
    if (membership.membership_level > 0 && membership.membership_expiry) {
        expiryText = `有效期至: ${membership.membership_expiry}`;
    }
    
    currentMembershipElement.innerHTML = `
        <div class="membership-info">
            <div class="membership-status">
                <span class="membership-badge ${badgeClass}">${membership.membership_name}</span>
                <span class="membership-user">${membership.username}</span>
            </div>
            <div class="membership-expiry">
                ${expiryText}
            </div>
        </div>
        <div class="membership-details">
            <div class="detail-item">
                <div class="detail-label">每日请求限制</div>
                <div class="detail-value">${membership.daily_requests} / ${membership.daily_limit}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">历史记录限制</div>
                <div class="detail-value">${membership.history_limit} 条</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">账户创建时间</div>
                <div class="detail-value">${membership.created_at}</div>
            </div>
        </div>
    `;
}

/**
 * 更新按钮状态
 * @param {number} currentLevel - 当前会员等级
 */
function updateButtonsState(currentLevel) {
    const standardButton = document.getElementById('upgrade-standard');
    const premiumButton = document.getElementById('upgrade-premium');
    
    // 禁用当前等级及更低等级的按钮
    if (currentLevel >= 1) {
        standardButton.disabled = true;
        standardButton.textContent = '当前方案';
    }
    
    if (currentLevel >= 2) {
        premiumButton.disabled = true;
        premiumButton.textContent = '当前方案';
    }
}

/**
 * 添加用户信息到头部
 * @param {Object} user - 用户信息
 */
function addUserInfoToHeader(user) {
    const userInfoElement = document.getElementById('user-info');
    userInfoElement.innerHTML = `
        <div class="user-info">
            <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <span class="username">${user.username}</span>
            <a href="index.html" class="header-link">返回首页</a>
            <button class="small-button" id="logout-button">退出</button>
        </div>
    `;
    
    // 添加退出登录事件
    document.getElementById('logout-button').addEventListener('click', async () => {
        try {
            const result = await API.auth.logout();
            if (result.success) {
                window.location.href = 'index.html';
            } else {
                alert(result.message || '退出失败');
            }
        } catch (error) {
            console.error('退出错误:', error);
            alert('退出过程中发生错误');
        }
    });
}

/**
 * 升级会员
 * @param {number} level - 会员等级
 */
async function upgradeMembership(level) {
    try {
        // 在实际场景中，这里应该跳转到支付页面或显示支付二维码
        // 本示例直接调用API升级会员
        const confirmed = confirm(`确定要升级到${level === 1 ? '标准' : '高级'}会员吗？\n(实际应用中应有支付流程)`);
        
        if (!confirmed) return;
        
        // 显示加载中
        const buttonId = level === 1 ? 'upgrade-standard' : 'upgrade-premium';
        const button = document.getElementById(buttonId);
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = '处理中...';
        
        // 调用升级API
        const result = await API.membership.upgrade(level);
        
        if (result.success) {
            alert(`会员升级成功！您现在是${result.membership.membership_name}`);
            
            // 刷新会员信息
            loadMembershipInfo();
        } else {
            alert(`升级失败: ${result.message || '未知错误'}`);
            
            // 恢复按钮状态
            button.disabled = false;
            button.textContent = originalText;
        }
    } catch (error) {
        console.error('升级会员错误:', error);
        alert('升级过程中发生错误，请重试');
    }
} 