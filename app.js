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
        
        this.showToast('✅ Saved');
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
                        <h4>${item.customer?.name || 'Unnamed Customer'}</h4>
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

        this.showToast('📤 Exported');
    }

    generateReport(data) {
        const lines = [
            '========================================',
            '     SOLAR SITE VISIT REPORT',
            '========================================',
            '',
            `Date: ${new Date(data.timestamp).toLocaleString('en-AU')}`,
            '',
            '【CUSTOMER INFORMATION】',
            `Name: ${data.customer?.name || '-'}`,
            `Address: ${data.customer?.address || '-'}`,
            `Phone: ${data.customer?.phone || '-'}`,
            `Appointment: ${data.customer?.appointmentTime || '-'}`,
            '',
            '【ROOF ASSESSMENT】',
            `Type: ${this.translateValue('roofType', data.roof?.type)}`,
            `Orientation: ${this.translateValue('orientation', data.roof?.orientation)}`,
            `Pitch: ${data.roof?.angle || '-'}`,
            `Area: ${data.roof?.area ? data.roof.area + ' m²' : '-'}`,
            '',
            '【ELECTRICAL ASSESSMENT】',
            `Grid Type: ${this.translateValue('gridType', data.electrical?.gridType)}`,
            `Meter Model: ${data.electrical?.meterModel || '-'}`,
            `Switchboard Capacity: ${data.electrical?.panelCapacity || '-'}`,
            '',
            '【BATTERY INSTALLATION】',
            `Location: ${this.translateValue('batteryLocation', data.battery?.location)}`,
            '',
            '【CUSTOMER REQUIREMENTS】',
            `Monthly Usage: ${data.requirements?.monthlyUsage || '-'}`,
            `Peak Hours: ${data.requirements?.peakHours || '-'}`,
            `Special Equipment: ${[
                data.requirements?.hasEV && 'EV Charger',
                data.requirements?.hasPool && 'Pool Pump',
                data.requirements?.hasAC && 'Ducted A/C'
            ].filter(Boolean).join(', ') || 'None'}`,
            `Budget: ${this.translateValue('budget', data.requirements?.budget)}`,
            `Installation Timeframe: ${data.requirements?.installTime || '-'}`,
            '',
            '【NOTES】',
            data.notes || 'None',
            '',
            '========================================',
            `Photos: Roof(${data.photos?.roof?.length || 0}) Electrical(${data.photos?.electrical?.length || 0}) Battery(${data.photos?.battery?.length || 0})`,
            '========================================',
        ];

        return lines.join('\n');
    }

    translateValue(type, value) {
        const translations = {
            roofType: { tile: 'Tile', metal: 'Metal / Colorbond', concrete: 'Concrete', other: 'Other' },
            orientation: { north: 'North', east: 'East', west: 'West', south: 'South', mixed: 'Mixed' },
            gridType: { single: 'Single Phase', three: 'Three Phase' },
            batteryLocation: { garage: 'Garage', exterior: 'Exterior Wall', interior: 'Interior', other: 'Other' },
            budget: { '5-10k': '$5,000-$10,000', '10-15k': '$10,000-$15,000', '15-20k': '$15,000-$20,000', '20k+': '$20,000+', flexible: 'Flexible' }
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
