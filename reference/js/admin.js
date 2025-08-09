/**
 * 管理后台脚本
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化管理后台
    initAdminPage();
    
    // 添加导航切换事件
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === '#') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                switchPanel(link.getAttribute('data-page'));
            });
        }
    });
    
    // 添加用户搜索事件
    document.getElementById('user-search-btn').addEventListener('click', () => {
        loadUsers(1);
    });
    
    // 添加添加用户按钮事件
    document.getElementById('add-user-btn').addEventListener('click', () => {
        openUserModal();
    });
    
    // 添加用户表单提交事件
    document.getElementById('user-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveUser();
    });
    
    // 添加模态窗口关闭事件
    document.querySelectorAll('.close, #cancel-edit').forEach(element => {
        element.addEventListener('click', () => {
            document.getElementById('user-modal').classList.remove('active');
        });
    });
    
    // 添加历史记录搜索事件
    document.getElementById('history-search-btn').addEventListener('click', () => {
        loadHistories(1);
    });
    
    // 添加批量删除按钮事件
    document.getElementById('batch-delete-btn').addEventListener('click', () => {
        batchDeleteHistories();
    });
    
    // 添加全选/取消全选事件
    document.getElementById('select-all-histories').addEventListener('change', (e) => {
        const checked = e.target.checked;
        document.querySelectorAll('.history-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
        });
    });
    
    // 添加确认框按钮事件
    document.getElementById('cancel-confirm').addEventListener('click', () => {
        document.getElementById('confirm-modal').classList.remove('active');
    });
});

// 全局变量
let usersPage = 1;
let historiesPage = 1;
let currentConfirmAction = null;

/**
 * 初始化管理后台
 */
async function initAdminPage() {
    try {
        // 检查登录状态
        const authResult = await API.auth.checkStatus();
        if (!authResult.success || !authResult.authenticated) {
            // 未登录，重定向到登录页
            window.location.href = 'login.html?redirect=admin.html';
            return;
        }
        
        // 使用用户名验证管理员身份
        if (authResult.user.username !== 'admin') {
            alert('您没有管理员权限');
            window.location.href = 'index.html';
            return;
        }
        
        // 加载用户数据
        loadUsers(1);
        
        // 初始化用户过滤器
        loadUserFilter();
        
        // 默认加载历史记录
        loadHistories(1);
        
    } catch (error) {
        console.error('初始化管理后台错误:', error);
        alert('加载管理后台失败');
    }
}

/**
 * 切换面板
 * @param {string} panelId - 面板ID
 */
function switchPanel(panelId) {
    // 更新导航链接激活状态
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === panelId) {
            link.classList.add('active');
        }
    });
    
    // 更新面板显示状态
    document.querySelectorAll('.admin-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${panelId}-panel`).classList.add('active');
    
    // 更新页面标题
    let title = '用户管理';
    if (panelId === 'histories') {
        title = '历史记录';
        // 加载历史记录数据
        loadHistories();
    } else if (panelId === 'statistics') {
        title = '统计数据';
        // 加载统计数据
        loadStatistics();
    }
    document.getElementById('page-title').textContent = title;
}

/**
 * 加载用户数据
 * @param {number} page - 页码
 */
async function loadUsers(page = 1) {
    usersPage = page;
    const searchInput = document.getElementById('user-search');
    const search = searchInput.value.trim();
    
    try {
        const tableBody = document.getElementById('users-table-body');
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">加载中...</td></tr>';
        
        const result = await API.admin.getUsers(page, 10, search);
        
        if (result.success) {
            // 渲染用户表格
            renderUsersTable(result.users);
            
            // 渲染分页
            renderPagination('users-pagination', result.total, result.pages, page, (p) => loadUsers(p));
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">加载失败: ${result.message}</td></tr>`;
        }
    } catch (error) {
        console.error('加载用户错误:', error);
        document.getElementById('users-table-body').innerHTML = 
            `<tr><td colspan="7" class="text-center">加载失败: ${error.message}</td></tr>`;
    }
}

/**
 * 渲染用户表格
 * @param {Array} users - 用户数据
 */
function renderUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">暂无用户数据</td></tr>';
        return;
    }
    
    let html = '';
    users.forEach(user => {
        const membershipClass = user.membership_level === 0 ? 'free' : 
                              user.membership_level === 1 ? 'standard' : 'premium';
                              
        html += `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.created_at}</td>
                <td><span class="badge ${membershipClass}">${user.membership_name}</span></td>
                <td>${user.membership_expiry || '无'}</td>
                <td>${user.is_admin ? '<span class="badge admin">管理员</span>' : '普通用户'}</td>
                <td>
                    <button class="action-button edit" onclick="openUserModal(${user.id})">编辑</button>
                    <button class="action-button delete" onclick="confirmDeleteUser(${user.id})">删除</button>
                    <button class="action-button" onclick="loadHistories(1, ${user.id})">查看记录</button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

/**
 * 渲染分页控件
 * @param {string} elementId - 分页容器元素ID
 * @param {number} total - 总记录数
 * @param {number} pages - 总页数
 * @param {number} currentPage - 当前页码
 * @param {Function} callback - 页码点击回调函数
 */
function renderPagination(elementId, total, pages, currentPage, callback) {
    const paginationElement = document.getElementById(elementId);
    
    if (!pages || pages <= 1) {
        paginationElement.innerHTML = '';
        return;
    }
    
    let html = `<div class="pagination-info">共 ${total} 条记录，${pages} 页</div>`;
    html += '<div class="pagination-controls">';
    
    // 上一页按钮
    html += `<button class="page-button" ${currentPage <= 1 ? 'disabled' : ''} 
             onclick="${currentPage > 1 ? `loadPage(${currentPage - 1})` : ''}">上一页</button>`;
    
    // 页码按钮
    const maxPages = 5; // 最多显示5个页码
    const startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(pages, startPage + maxPages - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-button ${i === currentPage ? 'active' : ''}" 
                 onclick="loadPage(${i})">${i}</button>`;
    }
    
    // 下一页按钮
    html += `<button class="page-button" ${currentPage >= pages ? 'disabled' : ''} 
             onclick="${currentPage < pages ? `loadPage(${currentPage + 1})` : ''}">下一页</button>`;
    
    html += '</div>';
    
    paginationElement.innerHTML = html;
    
    // 定义loadPage函数
    window.loadPage = callback;
}

/**
 * 打开用户编辑模态窗口
 * @param {number} userId - 用户ID，不传则为添加新用户
 */
async function openUserModal(userId = null) {
    const modalTitle = document.getElementById('modal-title');
    const userForm = document.getElementById('user-form');
    const userIdInput = document.getElementById('edit-user-id');
    const usernameInput = document.getElementById('edit-username');
    const passwordInput = document.getElementById('edit-password');
    const membershipSelect = document.getElementById('edit-membership');
    const durationInput = document.getElementById('edit-duration');
    const adminCheckbox = document.getElementById('edit-admin');
    
    // 重置表单
    userForm.reset();
    
    if (userId) {
        // 编辑现有用户
        modalTitle.textContent = '编辑用户';
        
        try {
            // 使用API获取用户详情，而不是从DOM解析
            const result = await API.admin.getUser(userId);
            
            if (!result.success) {
                throw new Error(result.message || '获取用户数据失败');
            }
            
            const user = result.user;
            
            // 填充表单
            userIdInput.value = user.id;
            usernameInput.value = user.username;
            passwordInput.value = ''; // 不显示密码
            membershipSelect.value = user.membership_level;
            adminCheckbox.checked = user.is_admin;
            
            // 如果是会员，默认显示1个月续期时长
            if (user.membership_level > 0) {
                durationInput.value = 1;
            }
        } catch (error) {
            console.error('获取用户详情错误:', error);
            alert('获取用户详情失败: ' + (error.message || '未知错误'));
            return;
        }
    } else {
        // 添加新用户
        modalTitle.textContent = '添加用户';
        userIdInput.value = '';
        usernameInput.value = '';
        passwordInput.value = '';
        membershipSelect.value = 0;
        durationInput.value = 1;
        adminCheckbox.checked = false;
    }
    
    // 显示模态窗口
    document.getElementById('user-modal').classList.add('active');
}

/**
 * 保存用户信息
 */
async function saveUser() {
    const userId = document.getElementById('edit-user-id').value;
    const username = document.getElementById('edit-username').value.trim();
    const password = document.getElementById('edit-password').value;
    const membershipLevel = parseInt(document.getElementById('edit-membership').value);
    const duration = parseInt(document.getElementById('edit-duration').value);
    const isAdmin = document.getElementById('edit-admin').checked;
    
    // 验证表单
    if (!username) {
        alert('请输入用户名');
        return;
    }
    
    if (!userId && !password) {
        alert('请输入密码');
        return;
    }
    
    // 构建用户数据
    const userData = {
        username,
        membership_level: membershipLevel,
        is_admin: isAdmin,
        duration
    };
    
    if (userId) {
        userData.id = parseInt(userId);
    }
    
    if (password) {
        userData.password = password;
    }
    
    try {
        const result = await API.admin.saveUser(userData);
        
        if (result.success) {
            alert(userId ? '用户更新成功' : '用户添加成功');
            
            // 关闭模态窗口
            document.getElementById('user-modal').classList.remove('active');
            
            // 刷新用户列表
            loadUsers(usersPage);
        } else {
            alert(`操作失败: ${result.message}`);
        }
    } catch (error) {
        console.error('保存用户错误:', error);
        alert('操作过程中发生错误');
    }
}

/**
 * 确认删除用户
 * @param {number} userId - 用户ID
 */
function confirmDeleteUser(userId) {
    // 存储当前操作
    currentConfirmAction = () => deleteUser(userId);
    
    // 显示确认对话框
    document.getElementById('confirm-message').textContent = '确定要删除该用户吗？此操作将同时删除该用户的所有历史记录，且不可恢复。';
    document.getElementById('confirm-modal').classList.add('active');
    
    // 绑定确认按钮事件
    document.getElementById('confirm-action').onclick = () => {
        document.getElementById('confirm-modal').classList.remove('active');
        currentConfirmAction();
    };
}

/**
 * 删除用户
 * @param {number} userId - 用户ID
 */
async function deleteUser(userId) {
    try {
        const result = await API.admin.deleteUser(userId);
        
        if (result.success) {
            alert('用户已删除');
            
            // 刷新用户列表
            loadUsers(usersPage);
        } else {
            alert(`删除失败: ${result.message}`);
        }
    } catch (error) {
        console.error('删除用户错误:', error);
        alert('删除过程中发生错误');
    }
}

/**
 * 加载用户过滤下拉框
 */
async function loadUserFilter() {
    try {
        // 实际应用中，这里应该有一个获取所有用户简要信息的API
        // 这里简化处理，直接使用用户列表API
        const result = await API.admin.getUsers(1, 100);
        
        if (result.success) {
            const filterSelect = document.getElementById('history-user-filter');
            let options = '<option value="">所有用户</option>';
            
            result.users.forEach(user => {
                options += `<option value="${user.id}">${user.username}</option>`;
            });
            
            filterSelect.innerHTML = options;
        }
    } catch (error) {
        console.error('加载用户过滤错误:', error);
    }
}

/**
 * 加载历史记录数据 - 简化版，不做权限验证
 * @param {number} page - 页码
 * @param {number} userId - 用户ID过滤
 */
async function loadHistories(page = 1, userId = null) {
    historiesPage = page;
    
    // 切换到历史记录面板
    if (userId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === 'histories') {
                link.classList.add('active');
            }
        });
        
        document.querySelectorAll('.admin-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById('histories-panel').classList.add('active');
        document.getElementById('page-title').textContent = '历史记录';
        
        // 设置用户过滤
        document.getElementById('history-user-filter').value = userId;
    }
    
    const searchInput = document.getElementById('history-search');
    const search = searchInput.value.trim();
    const userFilter = document.getElementById('history-user-filter').value;
    
    try {
        const tableBody = document.getElementById('histories-table-body');
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">加载中...</td></tr>';
        
        // 直接使用 API 加载所有历史记录，忽略权限验证
        const result = await API.admin.getHistories(page, 20, search, userFilter || userId);
        
        if (result.success) {
            // 渲染历史记录表格
            renderHistoriesTable(result.histories);
            
            // 渲染分页
            renderPagination('histories-pagination', result.total, result.pages, page, (p) => loadHistories(p, userFilter || userId));
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">加载失败: ${result.message}</td></tr>`;
        }
    } catch (error) {
        console.error('加载历史记录错误:', error);
        document.getElementById('histories-table-body').innerHTML = 
            `<tr><td colspan="7" class="text-center">加载失败: ${error.message}</td></tr>`;
    }
}

/**
 * 渲染历史记录表格
 * @param {Array} histories - 历史记录数据
 */
function renderHistoriesTable(histories) {
    const tableBody = document.getElementById('histories-table-body');
    
    if (!histories || histories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">暂无历史记录</td></tr>';
        return;
    }
    
    let html = '';
    histories.forEach(history => {
        html += `
            <tr>
                <td><input type="checkbox" class="history-checkbox" value="${history.id}"></td>
                <td>${history.id}</td>
                <td>${history.title}</td>
                <td>${history.username}</td>
                <td>${history.created_at}</td>
                <td>${history.layout_type || '未知'}</td>
                <td>
                    <button class="action-button delete" onclick="confirmDeleteHistory(${history.id})">删除</button>
                    <button class="action-button" onclick="viewHistory(${history.id})">查看</button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

/**
 * 确认删除历史记录
 * @param {number} historyId - 历史记录ID
 */
function confirmDeleteHistory(historyId) {
    // 存储当前操作
    currentConfirmAction = () => deleteHistory(historyId);
    
    // 显示确认对话框
    document.getElementById('confirm-message').textContent = '确定要删除该历史记录吗？此操作不可恢复。';
    document.getElementById('confirm-modal').classList.add('active');
    
    // 绑定确认按钮事件
    document.getElementById('confirm-action').onclick = () => {
        document.getElementById('confirm-modal').classList.remove('active');
        currentConfirmAction();
    };
}

/**
 * 删除历史记录
 * @param {number} historyId - 历史记录ID
 */
async function deleteHistory(historyId) {
    try {
        const result = await API.admin.batchDeleteHistories([historyId]);
        
        if (result.success) {
            alert('历史记录已删除');
            
            // 刷新历史记录列表
            loadHistories(historiesPage);
        } else {
            alert(`删除失败: ${result.message}`);
        }
    } catch (error) {
        console.error('删除历史记录错误:', error);
        alert('删除过程中发生错误');
    }
}

/**
 * 批量删除历史记录
 */
function batchDeleteHistories() {
    // 获取选中的历史记录ID
    const checkboxes = document.querySelectorAll('.history-checkbox:checked');
    const historyIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (historyIds.length === 0) {
        alert('请选择要删除的历史记录');
        return;
    }
    
    // 存储当前操作
    currentConfirmAction = () => {
        const userFilter = document.getElementById('history-user-filter').value;
        
        // 如果选择了用户过滤，询问是否删除该用户的所有记录
        if (userFilter && historyIds.length > 0) {
            const deleteAll = confirm('是否删除该用户的所有历史记录？');
            
            if (deleteAll) {
                deleteUserHistories(userFilter);
                return;
            }
        }
        
        // 否则只删除选中的记录
        deleteSelectedHistories(historyIds);
    };
    
    // 显示确认对话框
    document.getElementById('confirm-message').textContent = `确定要删除选中的 ${historyIds.length} 条历史记录吗？此操作不可恢复。`;
    document.getElementById('confirm-modal').classList.add('active');
    
    // 绑定确认按钮事件
    document.getElementById('confirm-action').onclick = () => {
        document.getElementById('confirm-modal').classList.remove('active');
        currentConfirmAction();
    };
}

/**
 * 删除选中的历史记录
 * @param {Array} historyIds - 历史记录ID数组
 */
async function deleteSelectedHistories(historyIds) {
    try {
        const result = await API.admin.batchDeleteHistories(historyIds);
        
        if (result.success) {
            alert(`成功删除 ${historyIds.length} 条历史记录`);
            
            // 刷新历史记录列表
            loadHistories(historiesPage);
        } else {
            alert(`删除失败: ${result.message}`);
        }
    } catch (error) {
        console.error('批量删除历史记录错误:', error);
        alert('删除过程中发生错误');
    }
}

/**
 * 删除用户的所有历史记录
 * @param {number} userId - 用户ID
 */
async function deleteUserHistories(userId) {
    try {
        const result = await API.admin.batchDeleteHistories([], userId);
        
        if (result.success) {
            alert(result.message || '删除成功');
            
            // 刷新历史记录列表
            loadHistories(historiesPage);
        } else {
            alert(`删除失败: ${result.message}`);
        }
    } catch (error) {
        console.error('删除用户历史记录错误:', error);
        alert('删除过程中发生错误');
    }
}

/**
 * 查看历史记录详情 - 简化版，不做权限验证
 * @param {number} historyId - 历史记录ID
 */
function viewHistory(historyId) {
    // 直接打开历史记录详情页，不做权限验证
    window.open(`history_detail.html?id=${historyId}&admin=1`, '_blank');
}

/**
 * 加载统计数据
 */
async function loadStatistics() {
    try {
        // 显示加载中状态
        document.getElementById('user-growth-chart').innerHTML = '<p class="chart-placeholder">加载中...</p>';
        document.getElementById('membership-chart').innerHTML = '<p class="chart-placeholder">加载中...</p>';
        
        // 在实际应用中，这里应该调用后端API获取统计数据
        // 这里简化处理，显示模拟数据
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 显示用户增长趋势
        document.getElementById('user-growth-chart').innerHTML = `
            <div class="chart-info">
                <p>功能开发中: 这里将显示用户增长趋势图表</p>
                <p>请实现一个获取实际统计数据的API</p>
            </div>
        `;
        
        // 显示会员分布
        document.getElementById('membership-chart').innerHTML = `
            <div class="chart-info">
                <p>功能开发中: 这里将显示会员分布图表</p>
                <p>请实现一个获取实际统计数据的API</p>
            </div>
        `;
    } catch (error) {
        console.error('加载统计数据错误:', error);
    }
} 