/**
 * API服务
 * 处理与后端的所有通信
 */
const API = {
    // 基础API路径
    baseUrl: '/api',
    
    /**
     * 获取所有可用的牌阵
     */
    async getLayouts() {
        try {
            const response = await fetch(`${this.baseUrl}/tarot/layouts`);
            if (!response.ok) throw new Error('获取牌阵失败');
            const data = await response.json();
            return data.layouts;
        } catch (error) {
            console.error('获取牌阵错误:', error);
            throw error;
        }
    },
    
    /**
     * 抽取塔罗牌
     * @param {string} layoutId - 牌阵ID
     */
    async drawCards(layoutId) {
        try {
            const response = await fetch(`${this.baseUrl}/tarot/draw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ layout_id: layoutId })
            });
            
            if (!response.ok) throw new Error('抽牌失败');
            const data = await response.json();
            return data.cards;
        } catch (error) {
            console.error('抽牌错误:', error);
            throw error;
        }
    },
    
    /**
     * 发送问题给AI并获取回答
     * @param {string} question - 用户问题
     * @param {Array} messages - 对话历史
     * @param {boolean} stream - 是否使用流式响应
     */
    async sendQuestion(question, messages = [], stream = false) {
        if (stream) {
            return this.sendQuestionStream(question, messages);
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/chat/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    question, 
                    messages 
                }),
                credentials: 'include'
            });
            
            if (!response.ok) throw new Error('发送问题失败');
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('发送问题错误:', error);
            throw error;
        }
    },
    
    /**
     * 使用EventSource发送问题并接收流式回答
     * @param {string} question - 用户问题
     * @param {Array} messages - 对话历史
     * @returns {Promise} - 返回一个带有onChunk和onComplete回调的对象
     */
    sendQuestionStream(question, messages = []) {
        return new Promise((resolve, reject) => {
            // 创建请求URL，包含所有参数
            const url = `${this.baseUrl}/chat/ask`;
            
            // 准备请求参数
            const params = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    question, 
                    messages,
                    stream: true
                }),
                credentials: 'include'
            };
            
            // 定义回调函数
            let callbacks = {
                onChunk: (chunk) => {},
                onComplete: (fullText) => {},
                onError: (error) => {}
            };
            
            let fullText = '';
            
            // 发送请求并处理事件流
            fetch(url, params)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    // 创建reader以处理流
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    
                    // 处理流数据
                    function processStream({ done, value }) {
                        if (done) {
                            callbacks.onComplete(fullText);
                            return;
                        }
                        
                        // 解码数据
                        const chunk = decoder.decode(value, { stream: true });
                        
                        // 处理数据行
                        const lines = chunk.split('\n\n');
                        for (const line of lines) {
                            if (line.startsWith('data:')) {
                                try {
                                    const jsonData = JSON.parse(line.slice(5));
                                    if (jsonData.content) {
                                        fullText += jsonData.content;
                                        callbacks.onChunk(jsonData.content);
                                    }
                                } catch (e) {
                                    console.error('解析流数据错误:', e);
                                }
                            }
                        }
                        
                        // 继续读取
                        return reader.read().then(processStream);
                    }
                    
                    return reader.read().then(processStream);
                })
                .catch(error => {
                    console.error('流式请求错误:', error);
                    callbacks.onError(error);
                    reject(error);
                });
            
            // 返回回调设置对象
            resolve({
                onChunk: (callback) => {
                    callbacks.onChunk = callback;
                },
                onComplete: (callback) => {
                    callbacks.onComplete = callback;
                },
                onError: (callback) => {
                    callbacks.onError = callback;
                }
            });
        });
    },
    
    /**
     * 用户认证API
     */
    auth: {
        /**
         * 用户注册
         * @param {string} username - 用户名
         * @param {string} password - 密码
         */
        async register(username, password) {
            try {
                const response = await fetch(`${API.baseUrl}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('注册错误:', error);
                throw error;
            }
        },
        
        /**
         * 用户登录
         * @param {string} username - 用户名
         * @param {string} password - 密码
         */
        async login(username, password) {
            try {
                const response = await fetch(`${API.baseUrl}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('登录错误:', error);
                throw error;
            }
        },
        
        /**
         * 用户退出
         */
        async logout() {
            try {
                const response = await fetch(`${API.baseUrl}/auth/logout`, {
                    method: 'POST',
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('退出错误:', error);
                throw error;
            }
        },
        
        /**
         * 获取当前用户状态
         */
        async checkStatus() {
            try {
                const response = await fetch(`${API.baseUrl}/auth/status`, {
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('获取状态错误:', error);
                return { success: false, authenticated: false };
            }
        }
    },
    
    /**
     * 历史记录API
     */
    history: {
        /**
         * 获取历史记录列表
         * @param {number} page - 页码
         * @param {number} perPage - 每页记录数
         */
        async getList(page = 1, perPage = 10) {
            try {
                const params = new URLSearchParams({
                    page: page,
                    per_page: perPage
                });
                
                const response = await fetch(`${API.baseUrl}/history/list?${params}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('获取历史记录列表错误:', error);
                throw error;
            }
        },
        
        /**
         * 获取历史记录详情
         * @param {number} historyId - 历史记录ID
         */
        async getDetail(historyId, isAdmin = false) {
            try {
                const url = `/api/history/detail/${historyId}${isAdmin ? '?admin=1' : ''}`;
                const response = await fetch(url);
                return await response.json();
            } catch (error) {
                console.error('获取历史记录详情错误:', error);
                throw error;
            }
        },
        
        /**
         * 保存历史记录
         * @param {Object} data - 历史记录数据
         */
        async saveHistory(data) {
            try {
                const response = await fetch(`${API.baseUrl}/history/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(data)
                });
                
                return await response.json();
            } catch (error) {
                console.error('保存历史记录错误:', error);
                throw error;
            }
        },
        
        /**
         * 更新历史记录
         * @param {Object} data - 更新数据
         */
        async updateHistory(data) {
            try {
                const response = await fetch(`${API.baseUrl}/history/update`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(data)
                });
                
                return await response.json();
            } catch (error) {
                console.error('更新历史记录错误:', error);
                throw error;
            }
        },
        
        /**
         * 删除历史记录
         * @param {number} historyId - 历史记录ID
         */
        async deleteHistory(historyId) {
            try {
                const response = await fetch(`${API.baseUrl}/history/delete/${historyId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('删除历史记录错误:', error);
                throw error;
            }
        },
        
        /**
         * 获取历史记录
         */
        async getHistories(page = 1, per_page = 10, search = '', userId = null) {
            try {
                const params = new URLSearchParams({
                    page, 
                    per_page,
                    search: search || ''
                });
                
                if (userId) {
                    params.append('user_id', userId);
                }
                
                const response = await fetch(`${API.baseUrl}/admin/histories?${params}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('获取历史记录错误:', error);
                throw error;
            }
        },
        
        /**
         * 批量删除历史记录
         */
        async batchDeleteHistories(historyIds = [], userId = null) {
            try {
                const response = await fetch(`${API.baseUrl}/admin/histories/batch`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ 
                        history_ids: historyIds,
                        user_id: userId
                    })
                });
                
                return await response.json();
            } catch (error) {
                console.error('批量删除历史记录错误:', error);
                throw error;
            }
        }
    },
    
    /**
     * 会员相关API
     */
    membership: {
        /**
         * 获取当前会员信息
         */
        async getInfo() {
            try {
                const response = await fetch(`${API.baseUrl}/membership/info`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('获取会员信息错误:', error);
                throw error;
            }
        },
        
        /**
         * 升级会员
         * @param {number} level - 会员等级
         * @param {number} duration - 会员时长(月)
         */
        async upgrade(level, duration = 1) {
            try {
                const response = await fetch(`${API.baseUrl}/membership/upgrade`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ level, duration })
                });
                
                return await response.json();
            } catch (error) {
                console.error('升级会员错误:', error);
                throw error;
            }
        }
    },
    
    /**
     * 管理员相关API
     */
    admin: {
        /**
         * 获取用户列表
         */
        async getUsers(page = 1, per_page = 10, search = '') {
            try {
                const params = new URLSearchParams({
                    page, 
                    per_page,
                    search: search || ''
                });
                
                const response = await fetch(`${API.baseUrl}/admin/users?${params}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('获取用户列表错误:', error);
                throw error;
            }
        },
        
        /**
         * 获取单个用户信息
         */
        async getUser(userId) {
            try {
                const response = await fetch(`${API.baseUrl}/admin/users/${userId}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('获取用户信息错误:', error);
                throw error;
            }
        },
        
        /**
         * 添加或更新用户
         */
        async saveUser(userData) {
            try {
                const isNew = !userData.id;
                const method = isNew ? 'POST' : 'PUT';
                const url = isNew 
                    ? `${API.baseUrl}/admin/users` 
                    : `${API.baseUrl}/admin/users/${userData.id}`;
                
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify(userData)
                });
                
                return await response.json();
            } catch (error) {
                console.error('保存用户错误:', error);
                throw error;
            }
        },
        
        /**
         * 删除用户
         */
        async deleteUser(userId) {
            try {
                const response = await fetch(`${API.baseUrl}/admin/users/${userId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('删除用户错误:', error);
                throw error;
            }
        },
        
        /**
         * 获取历史记录
         */
        async getHistories(page = 1, per_page = 10, search = '', userId = null) {
            try {
                const params = new URLSearchParams({
                    page, 
                    per_page,
                    search: search || ''
                });
                
                if (userId) {
                    params.append('user_id', userId);
                }
                
                const response = await fetch(`${API.baseUrl}/admin/histories?${params}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                return await response.json();
            } catch (error) {
                console.error('获取历史记录错误:', error);
                throw error;
            }
        },
        
        /**
         * 批量删除历史记录
         */
        async batchDeleteHistories(historyIds = [], userId = null) {
            try {
                const response = await fetch(`${API.baseUrl}/admin/histories/batch`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ 
                        history_ids: historyIds,
                        user_id: userId
                    })
                });
                
                return await response.json();
            } catch (error) {
                console.error('批量删除历史记录错误:', error);
                throw error;
            }
        }
    },
    
    /**
     * 获取历史记录列表
     * @param {number} page - 页码
     * @param {number} perPage - 每页记录数
     */
    async getHistoryList(page = 1, perPage = 10) {
        try {
            const params = new URLSearchParams({
                page: page,
                per_page: perPage
            });
            
            const response = await fetch(`${this.baseUrl}/history/list?${params}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('获取历史记录列表错误:', error);
            throw error;
        }
    }
}; 