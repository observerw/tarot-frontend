/**
 * 会话管理服务
 * 负责管理聊天会话状态、保存和加载
 */
const SessionService = {
    // 当前会话状态
    currentState: {
        historyId: null,
        messages: [],
        layout: null,
        cards: [],
        lastSaveTime: null,
        isDirty: false,
        autoSaveEnabled: true
    },
    
    // 初始化
    init() {
        // 设置自动保存定时器
        this._setupAutoSave();
        
        // 监听页面离开事件
        window.addEventListener('beforeunload', (e) => {
            if (this.currentState.isDirty && this.currentState.autoSaveEnabled) {
                // 尝试同步保存
                this.saveSession(true);
                
                // 可选：提示用户有未保存的更改
                e.preventDefault();
                e.returnValue = '有未保存的对话内容，确定要离开吗？';
                return e.returnValue;
            }
        });
        
        return this;
    },
    
    // 设置自动保存
    _setupAutoSave() {
        setInterval(() => {
            if (this.shouldAutoSave()) {
                this.saveSession();
            }
        }, 2 * 60 * 1000); // 2分钟
    },
    
    // 判断是否应该自动保存
    shouldAutoSave() {
        // 需要保存的条件
        return (
            this.currentState.isDirty && 
            this.currentState.autoSaveEnabled &&
            this.currentState.messages.filter(m => m.role === 'user').length > 0 &&
            (!this.currentState.lastSaveTime || 
             (Date.now() - this.currentState.lastSaveTime > 60 * 1000))
        );
    },
    
    // 添加消息
    addMessage(message) {
        this.currentState.messages.push(message);
        this.currentState.isDirty = true;
        return this;
    },
    
    // 设置牌阵信息
    setLayout(layoutInfo) {
        this.currentState.layout = layoutInfo;
        this.currentState.isDirty = true;
        return this;
    },
    
    // 设置卡牌信息
    setCards(cards) {
        this.currentState.cards = cards;
        this.currentState.isDirty = true;
        return this;
    },
    
    // 清除当前会话
    clearSession() {
        this.currentState = {
            historyId: null,
            messages: [],
            layout: null,
            cards: [],
            lastSaveTime: null,
            isDirty: false,
            autoSaveEnabled: this.currentState.autoSaveEnabled
        };
        return this;
    },
    
    // 从历史记录加载会话
    async loadFromHistory(historyId) {
        try {
            const result = await API.history.getDetail(historyId);
            
            if (!result.success) {
                throw new Error(result.message || '加载历史记录失败');
            }
            
            // 更新当前状态
            this.currentState.historyId = historyId;
            this.currentState.messages = result.history.messages || [];
            this.currentState.layout = {
                id: result.history.layout_id,
                name: result.history.layout_type
            };
            this.currentState.cards = result.history.cards || [];
            this.currentState.lastSaveTime = Date.now();
            this.currentState.isDirty = false;
            
            return result.history;
        } catch (error) {
            console.error('加载历史记录错误:', error);
            throw error;
        }
    },
    
    // 保存会话
    async saveSession(isSync = false) {
        try {
            // 检查是否有内容需要保存
            if (this.currentState.messages.length === 0) {
                return { success: false, message: '没有内容可保存' };
            }
            
            // 对数据进行深拷贝
            const messagesToSave = JSON.parse(JSON.stringify(this.currentState.messages));
            
            // 格式化牌信息
            const formattedCards = this.currentState.cards.map(card => ({
                id: card.id || null,
                name: card.name,
                position: card.position,
                reversed: !!card.reversed,
                image: card.image || null
            }));
            
            // 生成标题
            let title;
            if (this.currentState.historyId) {
                // 如果是更新现有记录，不需要新标题
                title = null;
            } else {
                // 从第一条用户消息生成标题
                const firstUserMsg = this.currentState.messages.find(m => m.role === 'user');
                title = firstUserMsg 
                    ? firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
                    : `对话记录 - ${new Date().toLocaleString()}`;
            }
            
            let result;
            
            // 根据是否有现有ID决定创建还是更新
            if (this.currentState.historyId) {
                const updateData = {
                    history_id: this.currentState.historyId,
                    messages: messagesToSave,
                    cards: formattedCards.length > 0 ? formattedCards : null
                };
                
                // 同步保存用于页面关闭时
                if (isSync) {
                    const syncRequest = new XMLHttpRequest();
                    syncRequest.open('PUT', `${API.baseUrl}/history/update`, false); // 同步请求
                    syncRequest.setRequestHeader('Content-Type', 'application/json');
                    syncRequest.withCredentials = true;
                    syncRequest.send(JSON.stringify(updateData));
                    
                    if (syncRequest.status === 200) {
                        result = JSON.parse(syncRequest.responseText);
                    } else {
                        throw new Error('同步保存失败');
                    }
                } else {
                    result = await API.history.updateHistory(updateData);
                }
            } else {
                const saveData = {
                    title: title,
                    messages: messagesToSave,
                    layout_id: this.currentState.layout?.id || null,
                    layout_type: this.currentState.layout?.name || null,
                    cards: formattedCards.length > 0 ? formattedCards : null
                };
                
                if (isSync) {
                    const syncRequest = new XMLHttpRequest();
                    syncRequest.open('POST', `${API.baseUrl}/history/save`, false); // 同步请求
                    syncRequest.setRequestHeader('Content-Type', 'application/json');
                    syncRequest.withCredentials = true;
                    syncRequest.send(JSON.stringify(saveData));
                    
                    if (syncRequest.status === 200) {
                        result = JSON.parse(syncRequest.responseText);
                    } else {
                        throw new Error('同步保存失败');
                    }
                } else {
                    result = await API.history.saveHistory(saveData);
                }
            }
            
            if (result.success) {
                // 更新状态
                this.currentState.historyId = result.history_id || this.currentState.historyId;
                this.currentState.lastSaveTime = Date.now();
                this.currentState.isDirty = false;
            }
            
            return result;
        } catch (error) {
            console.error('保存会话错误:', error);
            throw error;
        }
    },
    
    // 添加通知功能
    showNotification(message, type = 'info') {
        // 如果页面中有通知组件，使用它
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }
        
        // 否则创建一个简单的通知
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3秒后移除
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }
};

// 初始化
SessionService.init(); 