// Solar Site Visit Checklist App
class SolarChecklist {
    constructor() {
        this.currentId = null;
        this.photos = {
            roof: [],
            electrical: [],
            battery: []
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCurrentSession();
        this.updateProgress();
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
        document.getElementById('exportBtn').addEventListener('click', () => this.export());
        document.getElementById('newBtn').addEventListener('click', () => this.newSession());
        document.getElementById('historyBtn').addEventListener('click', () => this.showHistory());
        document.getElementById('closeHistory').addEventListener('click', () => this.hideHistory());

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
        document.getElementById('progressText').textContent = `${checked}/${total} 完成`;
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
            photos: this.photos
        };
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
        if (data.photos) {
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
            (this.photos[type] || []).forEach(src => {
                const img = document.createElement('img');
                img.src = src;
                container.appendChild(img);
            });
        });
    }

    save() {
        const data = this.getData();
        const history = this.getHistory();
        
        const existingIndex = history.findIndex(h => h.id === data.id);
        if (existingIndex >= 0) {
            history[existingIndex] = data;
        } else {
            history.unshift(data);
        }

        localStorage.setItem('solarChecklist_history', JSON.stringify(history));
        localStorage.setItem('solarChecklist_current', JSON.stringify(data));
        
        this.showToast('✅ 已保存');
    }

    autoSave() {
        const data = this.getData();
        localStorage.setItem('solarChecklist_current', JSON.stringify(data));
    }

    loadCurrentSession() {
        const current = localStorage.getItem('solarChecklist_current');
        if (current) {
            this.setData(JSON.parse(current));
        }
    }

    newSession() {
        if (confirm('确定要新建检查单吗？当前数据将被保存。')) {
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
            this.showToast('📝 已新建');
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
                    <p>暂无历史记录</p>
                </div>
            `;
        } else {
            container.innerHTML = history.map(item => `
                <div class="history-item">
                    <div class="history-info">
                        <h4>${item.customer?.name || '未命名客户'}</h4>
                        <p>${item.customer?.address || '无地址'}</p>
                        <p>${new Date(item.timestamp).toLocaleString('zh-CN')}</p>
                    </div>
                    <div class="history-actions">
                        <button class="btn-load" onclick="app.loadFromHistory('${item.id}')">加载</button>
                        <button class="btn-delete" onclick="app.deleteFromHistory('${item.id}')">删除</button>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('historyModal').classList.add('active');
    }

    hideHistory() {
        document.getElementById('historyModal').classList.remove('active');
    }

    loadFromHistory(id) {
        const history = this.getHistory();
        const item = history.find(h => h.id === id);
        if (item) {
            this.setData(item);
            localStorage.setItem('solarChecklist_current', JSON.stringify(item));
            this.hideHistory();
            this.showToast('✅ 已加载');
        }
    }

    deleteFromHistory(id) {
        if (confirm('确定要删除这条记录吗？')) {
            let history = this.getHistory();
            history = history.filter(h => h.id !== id);
            localStorage.setItem('solarChecklist_history', JSON.stringify(history));
            this.showHistory();
            this.showToast('🗑️ 已删除');
        }
    }

    export() {
        const data = this.getData();
        const report = this.generateReport(data);
        
        // Create blob and download
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `site-visit-${data.customer?.name || 'report'}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('📤 已导出');
    }

    generateReport(data) {
        const lines = [
            '========================================',
            '     SOLAR SITE VISIT REPORT',
            '========================================',
            '',
            `日期: ${new Date(data.timestamp).toLocaleString('zh-CN')}`,
            '',
            '【客户信息】',
            `姓名: ${data.customer?.name || '-'}`,
            `地址: ${data.customer?.address || '-'}`,
            `电话: ${data.customer?.phone || '-'}`,
            `预约时间: ${data.customer?.appointmentTime || '-'}`,
            '',
            '【屋顶评估】',
            `类型: ${this.translateValue('roofType', data.roof?.type)}`,
            `朝向: ${this.translateValue('orientation', data.roof?.orientation)}`,
            `角度: ${data.roof?.angle || '-'}`,
            `面积: ${data.roof?.area ? data.roof.area + ' m²' : '-'}`,
            '',
            '【电气评估】',
            `电网类型: ${this.translateValue('gridType', data.electrical?.gridType)}`,
            `电表型号: ${data.electrical?.meterModel || '-'}`,
            `配电箱容量: ${data.electrical?.panelCapacity || '-'}`,
            '',
            '【电池安装】',
            `位置: ${this.translateValue('batteryLocation', data.battery?.location)}`,
            '',
            '【客户需求】',
            `月均用电: ${data.requirements?.monthlyUsage || '-'}`,
            `高峰时段: ${data.requirements?.peakHours || '-'}`,
            `特殊设备: ${[
                data.requirements?.hasEV && 'EV充电器',
                data.requirements?.hasPool && '泳池泵',
                data.requirements?.hasAC && '中央空调'
            ].filter(Boolean).join(', ') || '无'}`,
            `预算: ${this.translateValue('budget', data.requirements?.budget)}`,
            `期望安装时间: ${data.requirements?.installTime || '-'}`,
            '',
            '【备注】',
            data.notes || '无',
            '',
            '========================================',
            `照片数量: 屋顶(${data.photos?.roof?.length || 0}) 电气(${data.photos?.electrical?.length || 0}) 电池(${data.photos?.battery?.length || 0})`,
            '========================================',
        ];

        return lines.join('\n');
    }

    translateValue(type, value) {
        const translations = {
            roofType: { tile: '瓦片', metal: '金属', concrete: '混凝土', other: '其他' },
            orientation: { north: '北', east: '东', west: '西', south: '南', mixed: '混合' },
            gridType: { single: '单相', three: '三相' },
            batteryLocation: { garage: '车库', exterior: '外墙', interior: '室内', other: '其他' },
            budget: { '5-10k': '$5,000-$10,000', '10-15k': '$10,000-$15,000', '15-20k': '$15,000-$20,000', '20k+': '$20,000+', flexible: '灵活' }
        };
        return translations[type]?.[value] || value || '-';
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
