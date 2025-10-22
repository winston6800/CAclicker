class OpportunityTracker {
    constructor() {
        this.taken = 0;
        this.missed = 0;
        this.currentDate = new Date().toDateString();
        this.logs = [];
        this.undoCount = 0;
        this.maxUndos = 3;
        this.actionHistory = []; // Store last actions for undo
        
        this.initializeElements();
        this.loadData();
        this.updateDisplay();
        this.setupEventListeners();
        this.checkDailyReset();
    }
    
    initializeElements() {
        this.fractionDisplay = document.getElementById('fractionDisplay');
        this.todayScore = document.getElementById('todayScore');
        this.totalOpportunities = document.getElementById('totalOpportunities');
        this.currentDateElement = document.getElementById('currentDate');
        this.logEntries = document.getElementById('logEntries');
        this.addTakenBtn = document.getElementById('addTaken');
        this.addMissedBtn = document.getElementById('addMissed');
        this.undoBtn = document.getElementById('undoLast');
        this.resetDayBtn = document.getElementById('resetDay');
    }
    
    setupEventListeners() {
        this.addTakenBtn.addEventListener('click', () => this.addOpportunity('taken'));
        this.addMissedBtn.addEventListener('click', () => this.addOpportunity('missed'));
        this.undoBtn.addEventListener('click', () => this.undoLastAction());
        this.resetDayBtn.addEventListener('click', () => this.resetDay());
    }
    
    addOpportunity(type) {
        // Store the action in history for undo
        this.actionHistory.push({
            type: type,
            timestamp: Date.now()
        });
        
        if (type === 'taken') {
            this.taken++;
        } else {
            this.missed++;
        }
        this.saveData();
        this.updateDisplay();
    }
    
    undoLastAction() {
        if (this.undoCount >= this.maxUndos) {
            return; // No more undos allowed
        }
        
        if (this.actionHistory.length === 0) {
            return; // No actions to undo
        }
        
        const lastAction = this.actionHistory.pop();
        
        if (lastAction.type === 'taken') {
            this.taken = Math.max(0, this.taken - 1);
        } else {
            this.missed = Math.max(0, this.missed - 1);
        }
        
        this.undoCount++;
        this.saveData();
        this.updateDisplay();
    }
    
    resetDay() {
        if (this.taken > 0 || this.missed > 0) {
            // Save current day to log
            this.saveToLog();
        }
        
        this.taken = 0;
        this.missed = 0;
        this.currentDate = new Date().toDateString();
        this.undoCount = 0; // Reset undo count for new day
        this.actionHistory = []; // Clear action history
        this.saveData();
        this.updateDisplay();
    }
    
    saveToLog() {
        const total = this.taken + this.missed;
        const percentage = total > 0 ? Math.round((this.taken / total) * 100) : 0;
        
        const logEntry = {
            date: this.currentDate,
            taken: this.taken,
            missed: this.missed,
            total: total,
            percentage: percentage
        };
        
        this.logs.unshift(logEntry); // Add to beginning of array
        this.saveLogs();
    }
    
    checkDailyReset() {
        const today = new Date().toDateString();
        if (this.currentDate !== today) {
            // New day detected, save previous day and reset
            if (this.taken > 0 || this.missed > 0) {
                this.saveToLog();
            }
            this.taken = 0;
            this.missed = 0;
            this.currentDate = today;
            this.undoCount = 0; // Reset undo count for new day
            this.actionHistory = []; // Clear action history
            this.saveData();
            this.updateDisplay();
        }
    }
    
    updateDisplay() {
        const total = this.taken + this.missed;
        const percentage = total > 0 ? Math.round((this.taken / total) * 100) : 0;
        
        this.fractionDisplay.textContent = `${this.taken}/${total}`;
        this.todayScore.textContent = `${percentage}%`;
        this.totalOpportunities.textContent = total;
        this.currentDateElement.textContent = this.currentDate;
        
        // Update undo button state
        const remainingUndos = this.maxUndos - this.undoCount;
        this.undoBtn.textContent = `↶ Undo (${remainingUndos}/${this.maxUndos})`;
        this.undoBtn.disabled = this.undoCount >= this.maxUndos || this.actionHistory.length === 0;
        
        this.updateLogDisplay();
    }
    
    updateLogDisplay() {
        this.logEntries.innerHTML = '';
        
        if (this.logs.length === 0) {
            this.logEntries.innerHTML = '<div style="text-align: center; opacity: 0.7; padding: 20px;">No logs yet</div>';
            return;
        }
        
        // Sort logs by date (newest first)
        const sortedLogs = [...this.logs].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedLogs.forEach((log, index) => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const isGoodDay = log.percentage >= 50;
            const isExcellentDay = log.percentage >= 80;
            const isPoorDay = log.percentage < 30;
            
            if (isExcellentDay) {
                logEntry.classList.add('excellent');
            } else if (isPoorDay) {
                logEntry.classList.add('poor');
            } else if (!isGoodDay) {
                logEntry.classList.add('missed');
            }
            
            // Add streak indicator for consecutive good days
            const streak = this.calculateStreak(sortedLogs, index);
            const streakText = streak > 1 ? ` 🔥 ${streak} day streak` : '';
            
            logEntry.innerHTML = `
                <div class="log-date">${log.date}${streakText}</div>
                <div class="log-fraction">${log.taken}/${log.total} (${log.percentage}%)</div>
                <div class="log-performance">${this.getPerformanceText(log.percentage)}</div>
            `;
            
            this.logEntries.appendChild(logEntry);
        });
    }
    
    calculateStreak(sortedLogs, currentIndex) {
        let streak = 1;
        for (let i = currentIndex + 1; i < sortedLogs.length; i++) {
            if (sortedLogs[i].percentage >= 50) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }
    
    getPerformanceText(percentage) {
        if (percentage >= 90) return '🌟 Excellent!';
        if (percentage >= 80) return '🎯 Great job!';
        if (percentage >= 70) return '👍 Good work!';
        if (percentage >= 50) return '✅ On track';
        if (percentage >= 30) return '⚠️ Needs improvement';
        return '❌ Tough day';
    }
    
    saveData() {
        const data = {
            taken: this.taken,
            missed: this.missed,
            currentDate: this.currentDate,
            undoCount: this.undoCount,
            actionHistory: this.actionHistory
        };
        localStorage.setItem('opportunityTracker', JSON.stringify(data));
    }
    
    loadData() {
        const saved = localStorage.getItem('opportunityTracker');
        if (saved) {
            const data = JSON.parse(saved);
            this.taken = data.taken || 0;
            this.missed = data.missed || 0;
            this.currentDate = data.currentDate || new Date().toDateString();
            this.undoCount = data.undoCount || 0;
            this.actionHistory = data.actionHistory || [];
        }
        
        this.loadLogs();
    }
    
    saveLogs() {
        localStorage.setItem('opportunityTrackerLogs', JSON.stringify(this.logs));
    }
    
    loadLogs() {
        const saved = localStorage.getItem('opportunityTrackerLogs');
        if (saved) {
            this.logs = JSON.parse(saved);
        }
    }
    
    // Method to clear all data (for debugging)
    clearAllData() {
        localStorage.removeItem('opportunityTracker');
        localStorage.removeItem('opportunityTrackerLogs');
        this.taken = 0;
        this.missed = 0;
        this.logs = [];
        this.currentDate = new Date().toDateString();
        this.updateDisplay();
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.opportunityTracker = new OpportunityTracker();
});

// Add some haptic feedback for mobile
function addHapticFeedback() {
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
}

// Add haptic feedback to buttons
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', addHapticFeedback);
    });
});
