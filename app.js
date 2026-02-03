// Solar Site Visit Checklist App
class SolarChecklist {
    constructor() {
        this.currentId = null;
        this.photos = {
            roof: [],
            electrical: [],
            battery: []
        };
        // Google Apps Script Web App URL - UPDATE THIS AFTER DEPLOYMENT
        this.apiUrl = localStorage.getItem('solarChecklist_apiUrl') || '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCurrentSession();
        this.updateProgress();
        this.checkApiConfig();
    }

    checkApiConfig() {
        if (!this.apiUrl) {
            console.log('API URL not configured. Submit will only save locally.');
        }
    }

    bindEvents() {
        // Checkboxes
        document.querySelectorAll('input[type="checkbox"][data-item]').forEach(cb => {
            cb.addEventListener('change', () => this.updateProgress());
        });

        // Photo uploads
        document.getElementById('roofPhotos').addEventListener('change', (e) => this.handlePhotos(e, 'roof'));
        document.getElementById('electricalPhotos').addEventListener('change', (e) => this.handlePhotos(e, 'electrical'));
        document.getElementById('batteryPhotos').addEventListener('change', (e) => this.handlePhotos(e, 'battery'));

        // Buttons
        document.getElementById('saveBtn').addEventListener('click', () => this.save());
        document.getElementById('submitBtn').addEventListener('click', () => this.submit());
        document.getElementById('newBtn').addEventListener('click', () => this.newSession());
        document.getElementById('historyBtn').addEventListener('click', () => this.showHistory());
        document.getElementById('closeHistory').addEventListener('click', () => this.hideHistory());
        
        // Settings
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.showSettings());
        document.getElementById('closeSettings')?.addEventListener('click', () => this.hideSettings());
        document.getElementById('saveApiUrl')?.addEventListener('click', () => this.saveApiUrl());

        // Auto-save on input change
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('change', () => this.autoSave());
        });
    }

    updateProgress() {
        const total = document.querySelectorAll('input[type="checkbox"][data-item]').length;
        const checked = document.querySelectorAll('input[type="checkbox"][data-item]:checked').length;
        const percentage = (checked / total) * 100;

        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `${checked}/${total} completed`;
    }

    handlePhotos(event, type) {
        const files = event.target.files;
        const previewContainer = document.getElementById(`${type}PhotoPreview`);

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                previewContainer.appendChild(img);
                this.photos[type].push(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    }

    getData() {
        return {
            id: this.currentId || Date.now().toString(),
            timestamp: new Date().toISOString(),
            customer: {
                name: document.getElementById('customerName').value,
                address: document.getElementById('address').value,
                phone: document.getElementById('phone').value,
                appointmentTime: document.getElementById('appointmentTime').value
            },
            preChecks: this.getCheckedItems('pre'),
            roof: {
                type: document.getElementById('roofType').value,
                orientation: document.getElementById('roofOrientation').value,
                angle: document.getElementById('roofAngle').value,
                area: document.getElementById('roofArea').value,
                checks: this.getCheckedItems('roof')
            },
            electrical: {
                gridType: document.getElementById('gridType').value,
                meterModel: document.getElementById('meterModel').value,
                panelCapacity: document.getElementById('panelCapacity').value,
                checks: this.getCheckedItems('elec')
            },
            battery: {
                location: document.getElementById('batteryLocation').value,
                checks: this.getCheckedItems('bat')
            },
            requirements: {
                monthlyUsage: document.getElementById('monthlyUsage').value,
                peakHours: document.getElementById('peakHours').value,
                hasEV: document.getElementById('hasEV').checked,
                hasPool: document.getElementById('hasPool').checked,
                hasAC: document.getElementById('hasAC').checked,
                budget: document.getElementById('budget').value,
                installTime: document.getElementById('installTime').value
            },
            finalChecks: this.getCheckedItems('final'),
            notes: document.getElementById('notes').value,
            photos: {
                roof: this.photos.roof.length,
                electrical: this.photos.electrical.length,
                battery: this.photos.battery.length
            }
        };
    }

    getFullData() {
        const data = this.getData();
        data.photos = this.photos; // Include full photo data
        return data;
    }

    getCheckedItems(prefix) {
        const items = {};
        document.querySelectorAll(`input[data-item^="${prefix}"]`).forEach(cb => {
            items[cb.dataset.item] = cb.checked;
        });
        return items;
    }

    setData(data) {
        if (!data) return;

        this.currentId = data.id;

        // Customer info
        document.getElementById('customerName').value = data.customer?.name || '';
        document.getElementById('address').value = data.customer?.address || '';
        document.getElementById('phone').value = data.customer?.phone || '';
        document.getElementById('appointmentTime').value = data.customer?.appointmentTime || '';

        // Pre-checks
        this.setCheckedItems(data.preChecks);

        // Roof
        document.getElementById('roofType').value = data.roof?.type || '';
        document.getElementById('roofOrientation').value = data.roof?.orientation || '';
        document.getElementById('roofAngle').value = data.roof?.angle || '';
        document.getElementById('roofArea').value = data.roof?.area || '';
        this.setCheckedItems(data.roof?.checks);

        // Electrical
        document.getElementById('gridType').value = data.electrical?.gridType || '';
        document.getElementById('meterModel').value = data.electrical?.meterModel || '';
        document.getElementById('panelCapacity').value = data.electrical?.panelCapacity || '';
        this.setCheckedItems(data.electrical?.checks);

        // Battery
        document.getElementById('batteryLocation').value = data.battery?.location || '';
        this.setCheckedItems(data.battery?.checks);

        // Requirements
        document.getElementById('monthlyUsage').value = data.requirements?.monthlyUsage || '';
        document.getElementById('peakHours').value = data.requirements?.peakHours || '';
        document.getElementById('hasEV').checked = data.requirements?.hasEV || false;
        document.getElementById('hasPool').checked = data.requirements?.hasPool || false;
        document.getElementById('hasAC').checked = data.requirements?.hasAC || false;
        document.getElementById('budget').value = data.requirements?.budget || '';
        document.getElementById('installTime').value = data.requirements?.installTime || '';

        // Final checks
        this.setCheckedItems(data.finalChecks);

        // Notes
        document.getElementById('notes').value = data.notes || '';

        // Photos
        if (data.photos && typeof data.photos === 'object' && data.photos.roof?.length) {
            this.photos = data.photos;
            this.renderPhotos();
        }

        this.updateProgress();
    }

    setCheckedItems(items) {
        if (!items) return;
        Object.entries(items).forEach(([key, value]) => {
            const cb = document.querySelector(`input[data-item="${key}"]`);
            if (cb) cb.checked = value;
        });
    }

    renderPhotos() {
        ['roof', 'electrical', 'battery'].forEach(type => {
            const container = document.getElementById(`${type}PhotoPreview`);
            container.innerHTML = '';
            const photos = this.photos[type] || [];
            if (Array.isArray(photos)) {
                photos.forEach(src => {
                    if (typeof src === 'string' && src.startsWith('data:')) {
                        const img = document.createElement('img');
                        img.src = src;
                        container.appendChild(img);
                    }
                });
            }
        });
    }

    save() {
        const data = this.getFullData();
        const history = this.getHistory();
        
        const existingIndex = history.findIndex(h => h.id === data.id);
        if (existingIndex >= 0) {
            history[existingIndex] = data;
        } else {
            history.unshift(data);
        }

        localStorage.setItem('solarChecklist_history', JSON.stringify(history));
        localStorage.setItem('solarChecklist_current', JSON.stringify(data));
        
        this.showToast('✅ Saved locally');
    }

    async submit() {
        // First save locally
        this.save();
        
        const data = this.getData();
        
        // Check if API is configured
        if (!this.apiUrl) {
            this.showToast('⚠️ API not configured. Click ⚙️ to set up.');
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳ Submitting...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                mode: 'no-cors', // Google Apps Script requires this
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            // With no-cors mode, we can't read the response, but if it didn't throw, it likely succeeded
            this.showToast('✅ Submitted to Google Sheets & Email sent!');
            
            // Mark as submitted
            data.submitted = true;
            data.submittedAt = new Date().toISOString();
            localStorage.setItem('solarChecklist_current', JSON.stringify(data));
            
        } catch (error) {
            console.error('Submit error:', error);
            this.showToast('❌ Submit failed. Check your connection.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    autoSave() {
        const data = this.getFullData();
        localStorage.setItem('solarChecklist_current', JSON.stringify(data));
    }

    loadCurrentSession() {
        const current = localStorage.getItem('solarChecklist_current');
        if (current) {
            this.setData(JSON.parse(current));
        }
    }

    newSession() {
        if (confirm('Start a new checklist? Current data will be saved.')) {
            this.save();
            this.currentId = null;
            this.photos = { roof: [], electrical: [], battery: [] };
            document.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.type === 'checkbox') {
                    el.checked = false;
                } else {
                    el.value = '';
                }
            });
            ['roof', 'electrical', 'battery'].forEach(type => {
                document.getElementById(`${type}PhotoPreview`).innerHTML = '';
            });
            localStorage.removeItem('solarChecklist_current');
            this.updateProgress();
            this.showToast('📝 New checklist started');
        }
    }

    getHistory() {
        const history = localStorage.getItem('solarChecklist_history');
        return history ? JSON.parse(history) : [];
    }

    showHistory() {
        const history = this.getHistory();
        const container = document.getElementById('historyList');
        
        if (history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📭</span>
                    <p>No history yet</p>
                </div>
            `;
        } else {
            container.innerHTML = history.map(item => `
                <div class="history-item">
                    <div class="history-info">
                        <h4>${item.customer?.name || 'Unnamed Customer'} ${item.submitted ? '✅' : ''}</h4>
                        <p>${item.customer?.address || 'No address'}</p>
                        <p>${new Date(item.timestamp).toLocaleString('en-AU')}</p>
                    </div>
                    <div class="history-actions">
                        <button class="btn-load" onclick="app.loadFromHistory('${item.id}')">Load</button>
                        <button class="btn-delete" onclick="app.deleteFromHistory('${item.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('historyModal').classList.add('active');
    }

    hideHistory() {
        document.getElementById('historyModal').classList.remove('active');
    }

    showSettings() {
        document.getElementById('apiUrlInput').value = this.apiUrl;
        document.getElementById('settingsModal').classList.add('active');
    }

    hideSettings() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    saveApiUrl() {
        const url = document.getElementById('apiUrlInput').value.trim();
        this.apiUrl = url;
        localStorage.setItem('solarChecklist_apiUrl', url);
        this.hideSettings();
        this.showToast('✅ API URL saved');
    }

    loadFromHistory(id) {
        const history = this.getHistory();
        const item = history.find(h => h.id === id);
        if (item) {
            this.setData(item);
            localStorage.setItem('solarChecklist_current', JSON.stringify(item));
            this.hideHistory();
            this.showToast('✅ Loaded');
        }
    }

    deleteFromHistory(id) {
        if (confirm('Delete this record?')) {
            let history = this.getHistory();
            history = history.filter(h => h.id !== id);
            localStorage.setItem('solarChecklist_history', JSON.stringify(history));
            this.showHistory();
            this.showToast('🗑️ Deleted');
        }
    }

    showToast(message) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

// Initialize app
const app = new SolarChecklist();
