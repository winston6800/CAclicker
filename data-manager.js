// Robust data management system to prevent data loss
class DataManager {
    constructor() {
        this.storageKey = 'opportunityTrackerData';
        this.version = '1.0';
        this.migrateData();
    }
    
    // Migrate old data format to new format
    migrateData() {
        const oldData = localStorage.getItem('opportunityTracker');
        const oldLogs = localStorage.getItem('opportunityTrackerLogs');
        
        if (oldData && !localStorage.getItem(this.storageKey)) {
            const data = JSON.parse(oldData);
            const logs = oldLogs ? JSON.parse(oldLogs) : [];
            
            // Convert to new format
            const newData = {
                version: this.version,
                currentDay: {
                    taken: data.taken || 0,
                    missed: data.missed || 0,
                    date: data.currentDate || new Date().toDateString(),
                    undoCount: data.undoCount || 0,
                    actionHistory: data.actionHistory || []
                },
                logs: logs,
                settings: {
                    maxUndos: 3,
                    createdAt: new Date().toISOString()
                }
            };
            
            this.saveData(newData);
            
            // Clean up old data
            localStorage.removeItem('opportunityTracker');
            localStorage.removeItem('opportunityTrackerLogs');
        }
    }
    
    // Get all data
    getData() {
        const data = localStorage.getItem(this.storageKey);
        if (!data) {
            return this.getDefaultData();
        }
        
        try {
            const parsed = JSON.parse(data);
            return this.validateAndFixData(parsed);
        } catch (error) {
            console.error('Error parsing data:', error);
            return this.getDefaultData();
        }
    }
    
    // Get default data structure
    getDefaultData() {
        return {
            version: this.version,
            currentDay: {
                taken: 0,
                missed: 0,
                date: new Date().toDateString(),
                undoCount: 0,
                actionHistory: []
            },
            logs: [],
            settings: {
                maxUndos: 3,
                createdAt: new Date().toISOString()
            }
        };
    }
    
    // Validate and fix data structure
    validateAndFixData(data) {
        const defaultData = this.getDefaultData();
        
        // Ensure all required fields exist
        if (!data.version) data.version = this.version;
        if (!data.currentDay) data.currentDay = defaultData.currentDay;
        if (!data.logs) data.logs = [];
        if (!data.settings) data.settings = defaultData.settings;
        
        // Validate currentDay structure
        const currentDay = data.currentDay;
        if (typeof currentDay.taken !== 'number') currentDay.taken = 0;
        if (typeof currentDay.missed !== 'number') currentDay.missed = 0;
        if (!currentDay.date) currentDay.date = new Date().toDateString();
        if (typeof currentDay.undoCount !== 'number') currentDay.undoCount = 0;
        if (!Array.isArray(currentDay.actionHistory)) currentDay.actionHistory = [];
        
        // Validate logs structure
        if (!Array.isArray(data.logs)) data.logs = [];
        
        return data;
    }
    
    // Save data with backup
    saveData(data) {
        try {
            // Create backup before saving
            const currentData = localStorage.getItem(this.storageKey);
            if (currentData) {
                localStorage.setItem(this.storageKey + '_backup', currentData);
            }
            
            // Save new data
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            
            // Clean up old backup after successful save
            setTimeout(() => {
                localStorage.removeItem(this.storageKey + '_backup');
            }, 1000);
            
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            
            // Try to restore from backup
            const backup = localStorage.getItem(this.storageKey + '_backup');
            if (backup) {
                localStorage.setItem(this.storageKey, backup);
            }
            
            return false;
        }
    }
    
    // Update current day data
    updateCurrentDay(updates) {
        const data = this.getData();
        data.currentDay = { ...data.currentDay, ...updates };
        return this.saveData(data);
    }
    
    // Add log entry
    addLogEntry(logEntry) {
        const data = this.getData();
        data.logs.unshift(logEntry); // Add to beginning
        return this.saveData(data);
    }
    
    // Get logs with optional filtering
    getLogs(filter = 'all') {
        const data = this.getData();
        let logs = [...data.logs];
        
        if (filter !== 'all') {
            logs = logs.filter(log => {
                switch (filter) {
                    case 'excellent':
                        return log.percentage >= 90;
                    case 'good':
                        return log.percentage >= 50 && log.percentage < 90;
                    case 'poor':
                        return log.percentage < 50;
                    default:
                        return true;
                }
            });
        }
        
        return logs;
    }
    
    // Calculate statistics
    getStatistics() {
        const data = this.getData();
        const logs = data.logs;
        
        if (logs.length === 0) {
            return {
                overallScore: 0,
                currentStreak: 0,
                totalDays: 0,
                bestStreak: 0,
                averageScore: 0
            };
        }
        
        // Calculate overall score
        const totalTaken = logs.reduce((sum, log) => sum + log.taken, 0);
        const totalOpportunities = logs.reduce((sum, log) => sum + log.total, 0);
        const overallScore = totalOpportunities > 0 ? Math.round((totalTaken / totalOpportunities) * 100) : 0;
        
        // Calculate streaks
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        
        for (let i = 0; i < logs.length; i++) {
            if (logs[i].percentage >= 50) {
                tempStreak++;
                if (i === 0) currentStreak = tempStreak;
            } else {
                bestStreak = Math.max(bestStreak, tempStreak);
                tempStreak = 0;
            }
        }
        bestStreak = Math.max(bestStreak, tempStreak);
        
        // Calculate average score
        const averageScore = logs.length > 0 ? 
            Math.round(logs.reduce((sum, log) => sum + log.percentage, 0) / logs.length) : 0;
        
        return {
            overallScore,
            currentStreak,
            totalDays: logs.length,
            bestStreak,
            averageScore
        };
    }
    
    // Export data for backup
    exportData() {
        const data = this.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opportunity-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Import data from backup
    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const validatedData = this.validateAndFixData(data);
                    if (this.saveData(validatedData)) {
                        resolve(true);
                    } else {
                        reject(new Error('Failed to save imported data'));
                    }
                } catch (error) {
                    reject(new Error('Invalid backup file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }
    
    // Clear all data (with confirmation)
    clearAllData() {
        if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.storageKey + '_backup');
            return true;
        }
        return false;
    }
}

// Global data manager instance
window.dataManager = new DataManager();
