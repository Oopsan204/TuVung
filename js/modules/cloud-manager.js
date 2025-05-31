// Module quản lý Cloud/GitHub Gist
const CloudManager = {
    token: '',
    gistId: '',
    autoSync: false, // Thêm cài đặt tự động đồng bộ
    syncTimeout: null, // Timeout cho debounce    // Khởi tạo
    async init() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateAuthStatus();
        this.updateSyncButtonState();
        
        // Tự động tải xuống dữ liệu mới nhất từ cloud nếu đã đăng nhập
        await this.autoDownloadOnInit();
    },

    // Tải cài đặt từ localStorage
    loadSettings() {
        this.token = localStorage.getItem('githubToken') || '';
        this.gistId = localStorage.getItem('gistId') || '';
        this.autoSync = localStorage.getItem('autoSync') === 'true';
    },

    // Lưu cài đặt
    saveSettings() {
        localStorage.setItem('githubToken', this.token);
        localStorage.setItem('gistId', this.gistId);
        localStorage.setItem('autoSync', this.autoSync.toString());
    },

    // Thiết lập event listeners
    setupEventListeners() {
        const loginBtn = document.getElementById('github-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginDialog());
        }

        const logoutBtn = document.getElementById('github-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        const saveTokenBtn = document.getElementById('save-token');
        if (saveTokenBtn) {
            saveTokenBtn.addEventListener('click', () => this.saveToken());
        }

        const uploadBtn = document.getElementById('upload-data');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.uploadData());
        }

        const downloadBtn = document.getElementById('download-data');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadData());
        }        const syncBtn = document.getElementById('sync-data');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => {
                if (this.token) {
                    this.toggleAutoSync();
                } else {
                    this.syncData();
                }
            });
        }

        const closeTokenDialog = document.getElementById('close-token-dialog');
        if (closeTokenDialog) {
            closeTokenDialog.addEventListener('click', () => this.hideLoginDialog());
        }

        // Add backup event listeners
        const backupDownloadBtn = document.getElementById('backup-download');
        if (backupDownloadBtn) {
            backupDownloadBtn.addEventListener('click', () => this.downloadBackup());
        }

        const backupRestoreBtn = document.getElementById('backup-restore');
        if (backupRestoreBtn) {
            backupRestoreBtn.addEventListener('click', () => this.showRestoreDialog());
        }

        const backupFileInput = document.getElementById('backup-file-input');
        if (backupFileInput) {
            backupFileInput.addEventListener('change', (e) => this.handleRestoreFile(e));
        }
    },

    // Hiển thị dialog đăng nhập
    showLoginDialog() {
        const dialog = document.getElementById('github-token-dialog');
        if (dialog) {
            dialog.style.display = 'block';
        }
    },

    // Ẩn dialog đăng nhập
    hideLoginDialog() {
        const dialog = document.getElementById('github-token-dialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    },    // Lưu token
    async saveToken() {
        const tokenInput = document.getElementById('github-token');
        if (!tokenInput) return;

        const token = tokenInput.value.trim();
        if (!token) {
            if (window.UIManager) {
                window.UIManager.showToast('Vui lòng nhập GitHub Token!', 'warning');
            }
            return;
        }

        // Xác thực token trước khi lưu
        this.token = token;
        const validation = await this.validateToken();
        
        if (!validation.valid) {
            if (window.UIManager) {
                window.UIManager.showToast(`Lỗi xác thực: ${validation.message}`, 'error');
            }
            this.token = '';
            return;
        }

        this.saveSettings();
        this.hideLoginDialog();
        this.updateAuthStatus();
        
        if (window.UIManager) {
            window.UIManager.showToast(`${validation.message}`, 'success');
        }
    },

    // Đăng xuất
    logout() {
        this.token = '';
        this.gistId = '';
        localStorage.removeItem('githubToken');
        localStorage.removeItem('gistId');
        this.updateAuthStatus();
        
        if (window.UIManager) {
            window.UIManager.showToast('Đã đăng xuất khỏi GitHub!', 'info');
        }
    },

    // Cập nhật trạng thái xác thực
    updateAuthStatus() {
        if (window.UIManager) {
            window.UIManager.updateGitHubAuthStatus();
        }
    },

    // Upload dữ liệu lên GitHub Gist
    async uploadData() {
        if (!this.token) {
            if (window.UIManager) {
                window.UIManager.showToast('Vui lòng đăng nhập GitHub trước!', 'warning');
            }
            return;
        }

        try {
            const data = this.prepareDataForUpload();
            let response;

            if (this.gistId) {
                // Cập nhật Gist có sẵn
                response = await this.updateGist(data);
            } else {
                // Tạo Gist mới
                response = await this.createGist(data);
            }

            if (response.ok) {
                const result = await response.json();
                this.gistId = result.id;
                this.saveSettings();
                
                if (window.UIManager) {
                    window.UIManager.showToast('Đã upload dữ liệu thành công!', 'success');
                    window.UIManager.updateDataStatistics();
                }            } else {
                let errorMessage = `HTTP error! status: ${response.status}`;
                
                if (response.status === 401) {
                    errorMessage = 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
                } else if (response.status === 403) {
                    errorMessage = 'Token không có quyền tạo Gist. Vui lòng kiểm tra scope "gist".';
                } else if (response.status === 422) {
                    errorMessage = 'Dữ liệu không hợp lệ. Vui lòng thử lại.';
                }
                
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Lỗi upload:', error);
            if (window.UIManager) {
                window.UIManager.showToast(`Lỗi khi upload: ${error.message}`, 'error');
            }
        }
    },

    // Download dữ liệu từ GitHub Gist
    async downloadData() {
        if (!this.token || !this.gistId) {
            if (window.UIManager) {
                window.UIManager.showToast('Vui lòng đăng nhập và có Gist ID!', 'warning');
            }
            return;
        }

        try {            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (response.ok) {
                const gist = await response.json();
                await this.loadDataFromGist(gist);
                
                if (window.UIManager) {
                    window.UIManager.showToast('Đã download dữ liệu thành công!', 'success');
                    window.UIManager.updateDataStatistics();
                }
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Lỗi download:', error);
            if (window.UIManager) {
                window.UIManager.showToast('Lỗi khi download dữ liệu!', 'error');
            }
        }
    },

    // Đồng bộ dữ liệu
    async syncData() {
        await this.downloadData();
        await this.uploadData();
    },

    // Chuẩn bị dữ liệu để upload
    prepareDataForUpload() {
        return {
            vocabulary_data: JSON.stringify(window.vocabulary || {}, null, 2),
            word_packages: JSON.stringify(window.wordPackages || {}, null, 2),
            word_topics: JSON.stringify(window.wordTopics || {}, null, 2),
            word_synonyms: JSON.stringify(window.wordSynonyms || {}, null, 2),
            srs_data: JSON.stringify(window.srsData || {}, null, 2),
            metadata: JSON.stringify({
                lastUpdated: new Date().toISOString(),
                deviceInfo: navigator.userAgent,
                wordCount: Object.keys(window.vocabulary || {}).length,
                topicCount: Object.keys(window.wordTopics || {}).length,
                version: '1.0.0'
            }, null, 2)
        };
    },

    // Tạo Gist mới
    async createGist(data) {
        const files = {};
        Object.keys(data).forEach(key => {
            files[`${key}.json`] = { content: data[key] };
        });        return fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify({
                description: `Dữ liệu từ vựng tiếng Anh - TuVung App (${new Date().toLocaleString()})`,
                public: false,
                files: files
            })
        });
    },

    // Cập nhật Gist
    async updateGist(data) {
        const files = {};
        Object.keys(data).forEach(key => {
            files[`${key}.json`] = { content: data[key] };
        });        return fetch(`https://api.github.com/gists/${this.gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json',
                'X-GitHub-Api-Version': '2022-11-28'
            },
            body: JSON.stringify({
                description: `Dữ liệu từ vựng tiếng Anh - TuVung App (Cập nhật: ${new Date().toLocaleString()})`,
                files: files
            })
        });
    },

    // Tải dữ liệu từ Gist
    async loadDataFromGist(gist) {
        try {
            const files = gist.files;
            
            if (files['vocabulary_data.json']) {
                const vocabulary = JSON.parse(files['vocabulary_data.json'].content);
                if (window.VocabularyManager) {
                    window.VocabularyManager.data.vocabulary = vocabulary;
                }
            }

            if (files['word_packages.json']) {
                const wordPackages = JSON.parse(files['word_packages.json'].content);
                if (window.VocabularyManager) {
                    window.VocabularyManager.data.wordPackages = wordPackages;
                }
            }

            if (files['word_topics.json']) {
                const wordTopics = JSON.parse(files['word_topics.json'].content);
                if (window.VocabularyManager) {
                    window.VocabularyManager.data.wordTopics = wordTopics;
                }
            }

            if (files['word_synonyms.json']) {
                const wordSynonyms = JSON.parse(files['word_synonyms.json'].content);
                if (window.VocabularyManager) {
                    window.VocabularyManager.data.wordSynonyms = wordSynonyms;
                }
            }

            if (files['srs_data.json']) {
                const srsData = JSON.parse(files['srs_data.json'].content);
                window.srsData = srsData;
                if (window.SRSManager) {
                    window.SRSManager.saveSRSData();
                }
            }

            // Cập nhật VocabularyManager và biến toàn cục
            if (window.VocabularyManager) {
                window.VocabularyManager.saveToLocalStorage();
                window.VocabularyManager.updateGlobalVariables();
            }

        } catch (error) {
            console.error('Lỗi khi xử lý dữ liệu từ Gist:', error);
            throw error;
        }
    },

    // Kiểm tra kết nối mạng
    isOnline() {
        return navigator.onLine;
    },

    // Lấy thông tin kết nối
    getConnectionStatus() {
        return this.isOnline() ? 'online' : 'offline';
    },    // Download backup file
    downloadBackup() {
        try {
            // Tạo backup với cả hai định dạng để đảm bảo tương thích
            const gistData = this.prepareDataForUpload();
            const directData = {
                vocabulary: window.vocabulary || {},
                wordPackages: window.wordPackages || {},
                wordTopics: window.wordTopics || {},
                wordSynonyms: window.wordSynonyms || {},
                srsData: window.srsData || {},
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    deviceInfo: navigator.userAgent,
                    wordCount: Object.keys(window.vocabulary || {}).length,
                    topicCount: Object.keys(window.wordTopics || {}).length,
                    version: '1.0.0',
                    backupFormat: 'combined'
                }
            };

            // Kết hợp cả hai định dạng
            const combinedData = {
                ...gistData, // Định dạng Gist (JSON strings)
                ...directData // Định dạng direct (objects)
            };

            const dataStr = JSON.stringify(combinedData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tuvung-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            if (window.UIManager) {
                window.UIManager.showToast('Đã tải xuống file backup thành công!', 'success');
            }
        } catch (error) {
            console.error('Lỗi khi tạo backup:', error);
            if (window.UIManager) {
                window.UIManager.showToast('Lỗi khi tạo file backup!', 'error');
            }
        }
    },

    // Show restore dialog
    showRestoreDialog() {
        const fileInput = document.getElementById('backup-file-input');
        if (fileInput) {
            fileInput.click();
        }
    },

    // Xử lý dữ liệu backup 
    async processBackupData(data) {
        try {
            // Kiểm tra định dạng dữ liệu (có thể là Gist format hoặc direct format)
            if (data.vocabulary_data || data.word_packages || data.word_topics || data.word_synonyms) {
                // Gist format - parse JSON strings
                if (data.vocabulary_data) {
                    const vocabulary = typeof data.vocabulary_data === 'string' ? 
                        JSON.parse(data.vocabulary_data) : data.vocabulary_data;
                    if (window.VocabularyManager) {
                        window.VocabularyManager.data.vocabulary = vocabulary;
                    }
                }

                if (data.word_packages) {
                    const wordPackages = typeof data.word_packages === 'string' ? 
                        JSON.parse(data.word_packages) : data.word_packages;
                    if (window.VocabularyManager) {
                        window.VocabularyManager.data.wordPackages = wordPackages;
                    }
                }

                if (data.word_topics) {
                    const wordTopics = typeof data.word_topics === 'string' ? 
                        JSON.parse(data.word_topics) : data.word_topics;
                    if (window.VocabularyManager) {
                        window.VocabularyManager.data.wordTopics = wordTopics;
                    }
                }

                if (data.word_synonyms) {
                    const wordSynonyms = typeof data.word_synonyms === 'string' ? 
                        JSON.parse(data.word_synonyms) : data.word_synonyms;
                    if (window.VocabularyManager) {
                        window.VocabularyManager.data.wordSynonyms = wordSynonyms;
                    }
                }

                if (data.srs_data) {
                    const srsData = typeof data.srs_data === 'string' ? 
                        JSON.parse(data.srs_data) : data.srs_data;
                    window.srsData = srsData;
                    if (window.SRSManager) {
                        window.SRSManager.saveSRSData();
                    }
                }
            } else {
                // Direct format - use data directly
                if (data.vocabulary && window.VocabularyManager) {
                    window.VocabularyManager.data.vocabulary = data.vocabulary;
                }

                if (data.wordPackages && window.VocabularyManager) {
                    window.VocabularyManager.data.wordPackages = data.wordPackages;
                }

                if (data.wordTopics && window.VocabularyManager) {
                    window.VocabularyManager.data.wordTopics = data.wordTopics;
                }

                if (data.wordSynonyms && window.VocabularyManager) {
                    window.VocabularyManager.data.wordSynonyms = data.wordSynonyms;
                }

                if (data.srsData) {
                    window.srsData = data.srsData;
                    if (window.SRSManager) {
                        window.SRSManager.saveSRSData();
                    }
                }
            }

            // Lưu dữ liệu và cập nhật biến toàn cục
            if (window.VocabularyManager) {
                window.VocabularyManager.saveToLocalStorage();
                window.VocabularyManager.updateGlobalVariables();
            }

        } catch (error) {
            console.error('Lỗi khi xử lý dữ liệu backup:', error);
            throw error;
        }
    },

    // Handle restore file
    async handleRestoreFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.includes('json')) {
            if (window.UIManager) {
                window.UIManager.showToast('Vui lòng chọn file JSON hợp lệ!', 'error');
            }
            return;
        }

        if (!confirm('Việc khôi phục sẽ ghi đè toàn bộ dữ liệu hiện tại. Bạn có chắc chắn muốn tiếp tục?')) {
            return;
        }        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate data structure
            if (!data.vocabulary_data && !data.word_topics && !data.word_synonyms && 
                !data.vocabulary && !data.wordTopics && !data.wordSynonyms) {
                throw new Error('File backup không hợp lệ!');
            }

            await this.processBackupData(data);
            
            if (window.UIManager) {
                window.UIManager.showToast('Đã khôi phục dữ liệu thành công!', 'success');
                window.UIManager.updateDataStatistics();
            }

            // Reload the current page to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error('Lỗi khi khôi phục backup:', error);
            if (window.UIManager) {
                window.UIManager.showToast('Lỗi khi khôi phục dữ liệu: ' + error.message, 'error');
            }
        }

        // Clear file input
        event.target.value = '';
    },

    // Bật/tắt tự động đồng bộ
    toggleAutoSync() {
        this.autoSync = !this.autoSync;
        this.saveSettings();
        
        if (window.UIManager) {
            const message = this.autoSync ? 
                'Đã bật tự động đồng bộ dữ liệu!' : 
                'Đã tắt tự động đồng bộ dữ liệu!';
            window.UIManager.showToast(message, 'info');
        }
        
        this.updateSyncButtonState();    },

    // Cập nhật trạng thái nút đồng bộ
    updateSyncButtonState() {
        const syncBtn = document.getElementById('sync-data');
        if (syncBtn) {
            if (this.autoSync) {
                syncBtn.classList.add('active');
                syncBtn.innerHTML = '<i class="fas fa-sync"></i> Tự động đồng bộ (BẬT)';
            } else {
                syncBtn.classList.remove('active');
                syncBtn.innerHTML = '<i class="fas fa-sync"></i> Đồng bộ tự động';
            }
        }
    },

    // Tự động tải xuống dữ liệu khi khởi tạo ứng dụng
    async autoDownloadOnInit() {
        // Chỉ tự động tải xuống nếu đã có thông tin đăng nhập
        if (!this.token || !this.gistId) {
            console.log('CloudManager: Không có token hoặc gistId, bỏ qua auto-download');
            return;
        }

        try {
            console.log('CloudManager: Bắt đầu tự động tải xuống dữ liệu từ cloud...');
            
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (response.ok) {
                const gist = await response.json();
                await this.loadDataFromGist(gist);
                
                console.log('CloudManager: Đã tải xuống và cập nhật dữ liệu từ cloud thành công');
                
                if (window.UIManager) {
                    window.UIManager.showToast('Đã đồng bộ dữ liệu mới nhất từ cloud!', 'success');
                    window.UIManager.updateDataStatistics();
                }
            } else {
                console.warn('CloudManager: Không thể tải dữ liệu từ cloud:', response.status);
            }
        } catch (error) {
            console.warn('CloudManager: Lỗi khi tự động tải xuống dữ liệu:', error.message);
            // Không hiển thị toast lỗi cho auto-download để tránh làm phiền người dùng
        }
    },

    // Tự động đồng bộ với debounce (chờ 3 giây sau thay đổi cuối)
    autoSyncData() {
        if (!this.autoSync || !this.token) {
            return;
        }

        // Clear timeout cũ nếu có
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }

        // Đặt timeout mới
        this.syncTimeout = setTimeout(async () => {
            try {
                console.log('Tự động đồng bộ dữ liệu...');
                await this.uploadData();
            } catch (error) {
                console.error('Lỗi tự động đồng bộ:', error);
            }
        }, 3000); // Đợi 3 giây sau thay đổi cuối
    },

    // Xác thực GitHub token
    async validateToken() {
        if (!this.token) {
            return { valid: false, message: 'Không có token' };
        }

        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            });

            if (response.ok) {
                const user = await response.json();
                return { 
                    valid: true, 
                    message: `Đã xác thực thành công với user: ${user.login}`,
                    user: user
                };
            } else {
                let errorMessage = 'Token không hợp lệ';
                if (response.status === 401) {
                    errorMessage = 'Token đã hết hạn hoặc không có quyền truy cập';
                } else if (response.status === 403) {
                    errorMessage = 'Token không có quyền cần thiết (cần scope "gist")';
                }
                return { 
                    valid: false, 
                    message: errorMessage,
                    status: response.status
                };
            }
        } catch (error) {
            return { 
                valid: false, 
                message: `Lỗi kết nối: ${error.message}`
            };
        }
    },
};

// Export CloudManager
window.CloudManager = CloudManager;
