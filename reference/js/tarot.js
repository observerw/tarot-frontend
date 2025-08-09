/**
 * 塔罗牌相关功能
 */
const Tarot = {
    // 当前牌阵
    currentLayout: null,
    
    // 抽出的牌
    drawnCards: [],
    
    /**
     * 初始化塔罗功能
     * @param {string} layoutId - 牌阵ID
     */
    async init(layoutId) {
        if (!layoutId) return false;
        
        try {
            // 加载牌阵数据
            const layouts = await API.getLayouts();
            this.currentLayout = layouts.find(layout => layout.id === layoutId);
            
            if (!this.currentLayout) {
                console.error('未找到指定牌阵:', layoutId);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('初始化塔罗失败:', error);
            return false;
        }
    },
    
    /**
     * 抽取塔罗牌
     * @param {string} layoutId - 牌阵ID
     */
    async drawCards(layoutId) {
        try {
            this.drawnCards = await API.drawCards(layoutId);
            return this.drawnCards;
        } catch (error) {
            console.error('抽牌失败:', error);
            throw error;
        }
    },
    
    /**
     * 渲染塔罗牌到指定容器
     * @param {HTMLElement} container - 卡牌容器
     * @param {boolean} animate - 是否使用动画
     */
    renderCards(container, animate = true) {
        if (!container || !this.drawnCards || this.drawnCards.length === 0) return;
        
        // 清空容器
        container.innerHTML = '';
        
        // 为容器添加样式使其可见
        container.style.display = 'flex';
        
        // 渲染每张牌
        this.drawnCards.forEach((cardData, index) => {
            const { position, card } = cardData;
            
            const cardElement = document.createElement('div');
            cardElement.className = 'tarot-card';
            if (card.is_reversed) {
                cardElement.classList.add('reversed');
            }
            
            cardElement.innerHTML = `
                <div class="tarot-card-position">${position.name}</div>
                <div class="tarot-card-inner">
                    <div class="tarot-card-front"></div>
                    <div class="tarot-card-back">
                        <img class="tarot-card-image" src="${card.image_url}" alt="${card.name}">
                        <div class="tarot-card-title">${card.name}</div>
                        ${card.is_reversed ? '<div class="reversed-indicator">逆位</div>' : ''}
                    </div>
                </div>
            `;
            
            container.appendChild(cardElement);
            
            // 添加点击翻牌事件
            cardElement.addEventListener('click', () => {
                cardElement.classList.add('flipped');
            });
            
            // 如果需要动画，设置延迟翻牌
            if (animate) {
                setTimeout(() => {
                    cardElement.classList.add('flipped');
                }, index * 500 + 500);
            } else {
                cardElement.classList.add('flipped');
            }
        });
    },
    
    /**
     * 生成AI解牌提示文本
     * @returns {string} 解牌提示文本
     */
    generateReadingPrompt() {
        if (!this.drawnCards || this.drawnCards.length === 0) {
            return '请为我解读这些塔罗牌';
        }
        
        let prompt = `我抽出了以下塔罗牌，请为我解读:\n`;
        
        this.drawnCards.forEach(({ position, card }) => {
            prompt += `- ${position.name} 位置: ${card.name} ${card.is_reversed ? '(逆位)' : '(正位)'}\n`;
        });
        
        prompt += '\n请根据这些牌的含义和相互关系，为我的问题提供详细解读和指导。';
        
        return prompt;
    }
}; 