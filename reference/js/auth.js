/**
 * 认证页面处理脚本
 */
document.addEventListener('DOMContentLoaded', () => {
    // 检查当前页面类型
    const isLoginPage = window.location.pathname.includes('login.html');
    const isRegisterPage = window.location.pathname.includes('register.html');
    
    // 绑定事件
    if (isLoginPage) {
        document.getElementById('login-button').addEventListener('click', handleLogin);
    } else if (isRegisterPage) {
        document.getElementById('register-button').addEventListener('click', handleRegister);
    }
    
    // 检查登录状态
    checkAuthStatus();
});

/**
 * 检查认证状态
 */
async function checkAuthStatus() {
    try {
        const result = await API.auth.checkStatus();
        if (result.success && result.authenticated) {
            // 已登录，重定向到首页
            const currentPage = window.location.pathname;
            if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('检查认证状态错误:', error);
    }
}

/**
 * 处理登录
 */
async function handleLogin() {
    // 获取用户输入
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const messageElement = document.getElementById('form-message');
    
    // 清除之前的消息
    messageElement.textContent = '';
    messageElement.className = 'form-message';
    
    // 验证输入
    if (!username || !password) {
        messageElement.textContent = '用户名和密码不能为空';
        return;
    }
    
    try {
        // 执行登录
        const result = await API.auth.login(username, password);
        
        if (result.success) {
            // 登录成功，显示消息并重定向
            messageElement.textContent = '登录成功，即将跳转...';
            messageElement.className = 'form-message success';
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            // 登录失败，显示错误
            messageElement.textContent = result.message || '登录失败';
        }
    } catch (error) {
        console.error('登录错误:', error);
        messageElement.textContent = '登录过程中发生错误，请重试';
    }
}

/**
 * 处理注册
 */
async function handleRegister() {
    // 获取用户输入
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();
    const messageElement = document.getElementById('form-message');
    
    // 清除之前的消息
    messageElement.textContent = '';
    messageElement.className = 'form-message';
    
    // 验证输入
    if (!username || !password) {
        messageElement.textContent = '用户名和密码不能为空';
        return;
    }
    
    if (password !== confirmPassword) {
        messageElement.textContent = '两次输入的密码不一致';
        return;
    }
    
    try {
        // 执行注册
        const result = await API.auth.register(username, password);
        
        if (result.success) {
            // 注册成功，显示消息并重定向到登录页
            messageElement.textContent = '注册成功，即将跳转到登录页...';
            messageElement.className = 'form-message success';
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            // 注册失败，显示错误
            messageElement.textContent = result.message || '注册失败';
        }
    } catch (error) {
        console.error('注册错误:', error);
        messageElement.textContent = '注册过程中发生错误，请重试';
    }
} 