document.addEventListener('DOMContentLoaded', () => {
    // 创建星星背景
    createStars();
    
    // 初始化主卡片交互
    initMainCard();
    
    // 初始化牌阵选择
    initReadingCards();
    
    // 初始化底部导航
    initNavigation();
});

/**
 * 初始化主卡片交互
 */
function initMainCard() {
    const tarotCard = document.querySelector('.tarot-card');
    
    if (tarotCard) {
        // 添加悬停效果
        tarotCard.addEventListener('mouseover', () => {
            tarotCard.style.boxShadow = '0 15px 40px rgba(102, 51, 153, 0.4)';
        });
        
        tarotCard.addEventListener('mouseout', () => {
            tarotCard.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
        });
        
        // 点击选择三张牌阵
        tarotCard.addEventListener('click', () => {
            selectLayout('three_card', tarotCard);
        });
    }
}

/**
 * 初始化牌阵选择卡片
 */
function initReadingCards() {
    const readingCards = document.querySelectorAll('.reading-card');
    
    readingCards.forEach(card => {
        card.addEventListener('click', () => {
            // 确定选择的牌阵ID
            let layoutId;
            
            if (card.querySelector('h3').textContent.includes('每日运势')) {
                layoutId = 'daily';
            } else if (card.querySelector('h3').textContent.includes('单牌阵')) {
                layoutId = 'single';
            } else if (card.querySelector('h3').textContent.includes('三牌阵')) {
                layoutId = 'three_card';
            } else if (card.querySelector('h3').textContent.includes('凯尔特十字')) {
                layoutId = 'celtic_cross';
            }
            
            selectLayout(layoutId);
        });
    });
}

/**
 * 选择牌阵并跳转
 * @param {string} layoutId - 牌阵ID
 * @param {Element} [element] - 触发元素(可选)
 */
function selectLayout(layoutId, element) {
    // 保存选中的牌阵ID到会话存储
    sessionStorage.setItem('selectedLayoutId', layoutId);
    
    // 添加页面转场效果
    document.body.classList.add('page-transition');
    
    // 如果是主卡片，添加翻转动画
    if (element && element.classList.contains('tarot-card')) {
        element.classList.add('card-selected');
    }
    
    // 延迟跳转以便动画效果完成
    setTimeout(() => {
        window.location.href = 'chat.html';
    }, 600);
}

/**
 * 初始化底部导航
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // 只有当点击非活动项时才执行
            if (!item.classList.contains('active')) {
                // 移除所有导航项的active类
                navItems.forEach(navItem => {
                    navItem.classList.remove('active');
                });
                
                // 添加active类到当前项
                item.classList.add('active');
                
                // 如果不是探索选项，阻止默认行为并显示开发中提示
                if (!item.querySelector('span').textContent.includes('探索')) {
                    e.preventDefault();
                    showToast('此功能正在开发中...');
                }
            }
        });
    });
}

/**
 * 在页面中创建星星效果
 */
function createStars() {
    const app = document.querySelector('.app-container');
    const starCount = 20;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // 随机位置
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        
        // 随机大小
        const size = Math.random() * 2 + 1;
        
        // 随机闪烁动画
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 5;
        
        star.style.cssText = `
            position: absolute;
            top: ${top}%;
            left: ${left}%;
            width: ${size}px;
            height: ${size}px;
            background-color: white;
            border-radius: 50%;
            opacity: ${Math.random() * 0.7 + 0.3};
            animation: twinkle ${duration}s infinite ${delay}s;
            z-index: -1;
        `;
        
        app.appendChild(star);
    }
}

/**
 * 显示Toast消息
 * @param {string} message - 消息内容
 * @param {number} [duration=2000] - 显示时长(毫秒)
 */
function showToast(message, duration = 2000) {
    // 检查是否已存在toast
    let toast = document.querySelector('.toast');
    
    if (!toast) {
        // 创建新的toast元素
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
        
        // 添加样式
        toast.style.cssText = `
            position: fixed;
            bottom: 70px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
        `;
    }
    
    // 设置消息内容
    toast.textContent = message;
    
    // 显示toast
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // 设置自动隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        
        // 移除元素
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, duration);
}