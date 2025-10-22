class OpportunityTracker {
    constructor() {
        this.dataManager = window.dataManager;
        this.initializeElements();
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
        const data = this.dataManager.getData();
        const currentDay = data.currentDay;
        
        // Store the action in history for undo
        currentDay.actionHistory.push({
            type: type,
            timestamp: Date.now()
        });
        
        if (type === 'taken') {
            currentDay.taken++;
        } else {
            currentDay.missed++;
        }
        
        this.dataManager.updateCurrentDay(currentDay);
        this.updateDisplay();
    }
    
    undoLastAction() {
        const data = this.dataManager.getData();
        const currentDay = data.currentDay;
        
        if (currentDay.undoCount >= 3) {
            return; // No more undos allowed
        }
        
        if (currentDay.actionHistory.length === 0) {
            return; // No actions to undo
        }
        
        const lastAction = currentDay.actionHistory.pop();
        
        if (lastAction.type === 'taken') {
            currentDay.taken = Math.max(0, currentDay.taken - 1);
        } else {
            currentDay.missed = Math.max(0, currentDay.missed - 1);
        }
        
        currentDay.undoCount++;
        this.dataManager.updateCurrentDay(currentDay);
        this.updateDisplay();
    }
    
    resetDay() {
        const data = this.dataManager.getData();
        const currentDay = data.currentDay;
        
        if (currentDay.taken > 0 || currentDay.missed > 0) {
            // Save current day to log
            const total = currentDay.taken + currentDay.missed;
            const percentage = total > 0 ? Math.round((currentDay.taken / total) * 100) : 0;
            
            const logEntry = {
                date: currentDay.date,
                taken: currentDay.taken,
                missed: currentDay.missed,
                total: total,
                percentage: percentage
            };
            
            this.dataManager.addLogEntry(logEntry);
        }
        
        // Reset for new day
        const newDay = {
            taken: 0,
            missed: 0,
            date: new Date().toDateString(),
            undoCount: 0,
            actionHistory: []
        };
        
        this.dataManager.updateCurrentDay(newDay);
        this.updateDisplay();
    }
    
    checkDailyReset() {
        const data = this.dataManager.getData();
        const currentDay = data.currentDay;
        const today = new Date().toDateString();
        
        if (currentDay.date !== today) {
            // New day detected, save previous day and reset
            if (currentDay.taken > 0 || currentDay.missed > 0) {
                const total = currentDay.taken + currentDay.missed;
                const percentage = total > 0 ? Math.round((currentDay.taken / total) * 100) : 0;
                
                const logEntry = {
                    date: currentDay.date,
                    taken: currentDay.taken,
                    missed: currentDay.missed,
                    total: total,
                    percentage: percentage
                };
                
                this.dataManager.addLogEntry(logEntry);
            }
            
            // Reset for new day
            const newDay = {
                taken: 0,
                missed: 0,
                date: today,
                undoCount: 0,
                actionHistory: []
            };
            
            this.dataManager.updateCurrentDay(newDay);
            this.updateDisplay();
        }
    }
    
    updateDisplay() {
        const data = this.dataManager.getData();
        const currentDay = data.currentDay;
        const total = currentDay.taken + currentDay.missed;
        const percentage = total > 0 ? Math.round((currentDay.taken / total) * 100) : 0;
        
        this.fractionDisplay.textContent = `${currentDay.taken}/${total}`;
        this.todayScore.textContent = `${percentage}%`;
        this.totalOpportunities.textContent = total;
        this.currentDateElement.textContent = currentDay.date;
        
        // Update undo button state
        const remainingUndos = 3 - currentDay.undoCount;
        this.undoBtn.textContent = `↶ Undo (${remainingUndos}/3)`;
        this.undoBtn.disabled = currentDay.undoCount >= 3 || currentDay.actionHistory.length === 0;
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
