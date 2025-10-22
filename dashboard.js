// Dashboard functionality
class Dashboard {
    constructor() {
        this.dataManager = window.dataManager;
        this.currentFilter = 'all';
        this.initializeElements();
        this.setupEventListeners();
        this.updateDashboard();
    }
    
    initializeElements() {
        this.overallScore = document.getElementById('overallScore');
        this.currentStreak = document.getElementById('currentStreak');
        this.totalDays = document.getElementById('totalDays');
        this.bestStreak = document.getElementById('bestStreak');
        this.chartContainer = document.getElementById('chartContainer');
        this.logEntries = document.getElementById('logEntries');
        this.insights = document.getElementById('insights');
        this.filterButtons = document.querySelectorAll('.filter-btn');
    }
    
    setupEventListeners() {
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.updateLogDisplay();
            });
        });
    }
    
    updateDashboard() {
        this.updateStatistics();
        this.updateChart();
        this.updateLogDisplay();
        this.updateInsights();
    }
    
    updateStatistics() {
        const stats = this.dataManager.getStatistics();
        
        this.overallScore.textContent = `${stats.overallScore}%`;
        this.currentStreak.textContent = stats.currentStreak;
        this.totalDays.textContent = stats.totalDays;
        this.bestStreak.textContent = stats.bestStreak;
    }
    
    updateChart() {
        const logs = this.dataManager.getLogs();
        
        if (logs.length === 0) {
            this.chartContainer.innerHTML = '<div class="chart-placeholder">No data yet - start tracking opportunities!</div>';
            return;
        }
        
        // Create simple bar chart
        const maxValue = Math.max(...logs.map(log => log.percentage));
        const chartBars = logs.slice(0, 14).reverse(); // Show last 14 days
        
        this.chartContainer.innerHTML = `
            <div class="chart">
                ${chartBars.map((log, index) => {
                    const height = (log.percentage / maxValue) * 100;
                    const isGood = log.percentage >= 50;
                    return `
                        <div class="chart-bar-container">
                            <div class="chart-bar ${isGood ? 'good' : 'poor'}" 
                                 style="height: ${height}%" 
                                 title="${log.date}: ${log.percentage}%">
                            </div>
                            <div class="chart-label">${new Date(log.date).getDate()}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    updateLogDisplay() {
        const logs = this.dataManager.getLogs(this.currentFilter);
        
        this.logEntries.innerHTML = '';
        
        if (logs.length === 0) {
            this.logEntries.innerHTML = '<div class="no-logs">No logs found for this filter</div>';
            return;
        }
        
        logs.forEach((log, index) => {
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
            
            // Calculate streak for this entry
            const streak = this.calculateStreak(logs, index);
            const streakText = streak > 1 ? ` 🔥 ${streak} day streak` : '';
            
            logEntry.innerHTML = `
                <div class="log-date">${log.date}${streakText}</div>
                <div class="log-fraction">${log.taken}/${log.total} (${log.percentage}%)</div>
                <div class="log-performance">${this.getPerformanceText(log.percentage)}</div>
            `;
            
            this.logEntries.appendChild(logEntry);
        });
    }
    
    calculateStreak(logs, currentIndex) {
        let streak = 1;
        for (let i = currentIndex + 1; i < logs.length; i++) {
            if (logs[i].percentage >= 50) {
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
    
    updateInsights() {
        const stats = this.dataManager.getStatistics();
        const logs = this.dataManager.getLogs();
        
        if (logs.length === 0) {
            this.insights.innerHTML = '<div class="insight">Start tracking opportunities to see insights!</div>';
            return;
        }
        
        const insights = [];
        
        // Overall performance insight
        if (stats.overallScore >= 80) {
            insights.push('🎉 You\'re crushing it! Keep up the excellent work!');
        } else if (stats.overallScore >= 60) {
            insights.push('👍 You\'re doing well! Try to push for even better results.');
        } else if (stats.overallScore >= 40) {
            insights.push('📈 You\'re making progress! Focus on taking more opportunities.');
        } else {
            insights.push('💪 Every opportunity counts! Start small and build momentum.');
        }
        
        // Streak insights
        if (stats.currentStreak >= 7) {
            insights.push(`🔥 Amazing ${stats.currentStreak}-day streak! You\'re building great habits.`);
        } else if (stats.currentStreak >= 3) {
            insights.push(`🔥 Nice ${stats.currentStreak}-day streak! Keep it going!`);
        }
        
        // Best streak insight
        if (stats.bestStreak >= 10) {
            insights.push(`🏆 Your best streak was ${stats.bestStreak} days! You know you can do it.`);
        }
        
        // Recent performance insight
        if (logs.length >= 3) {
            const recentLogs = logs.slice(0, 3);
            const recentAvg = recentLogs.reduce((sum, log) => sum + log.percentage, 0) / recentLogs.length;
            
            if (recentAvg >= 80) {
                insights.push('📈 Your recent performance has been excellent!');
            } else if (recentAvg < 40) {
                insights.push('💡 Consider what\'s holding you back from taking opportunities.');
            }
        }
        
        this.insights.innerHTML = insights.map(insight => 
            `<div class="insight">${insight}</div>`
        ).join('');
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
