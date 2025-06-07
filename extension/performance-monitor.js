// TuVung Extension Performance Monitor
// Theo dõi hiệu suất và debug extension

class TuVungPerformanceMonitor {
    constructor() {
        this.metrics = {
            wordLookups: 0,
            wordsAdded: 0,
            dialogOpens: 0,
            apiCalls: 0,
            errors: 0,
            sessionStart: Date.now()
        };
        
        this.logs = [];
        this.enabled = false; // Chỉ enable khi debug
        
        // Enable performance monitoring trong development
        if (this.isDevelopment()) {
            this.enabled = true;
            this.init();
        }
    }
    
    isDevelopment() {
        return !('update_url' in chrome.runtime.getManifest());
    }
    
    init() {
        console.log('🔍 TuVung Performance Monitor initialized');
        
        // Listen for extension events
        this.attachEventListeners();
        
        // Periodic reporting
        setInterval(() => {
            this.reportMetrics();
        }, 60000); // Every minute
        
        // Report on page unload
        window.addEventListener('beforeunload', () => {
            this.reportFinal();
        });
    }
    
    attachEventListeners() {
        // Override console methods to capture logs
        const originalLog = console.log;
        const originalError = console.error;
        
        console.log = (...args) => {
            if (args[0] && args[0].includes('TuVung')) {
                this.log('INFO', args.join(' '));
            }
            originalLog.apply(console, args);
        };
        
        console.error = (...args) => {
            this.log('ERROR', args.join(' '));
            this.metrics.errors++;
            originalError.apply(console, args);
        };
    }
    
    log(level, message) {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            url: window.location.href
        };
        
        this.logs.push(logEntry);
        
        // Keep only last 100 logs
        if (this.logs.length > 100) {
            this.logs.shift();
        }
    }
    
    recordMetric(metric, value = 1) {
        if (!this.enabled) return;
        
        if (this.metrics.hasOwnProperty(metric)) {
            this.metrics[metric] += value;
        } else {
            this.metrics[metric] = value;
        }
        
        this.log('METRIC', `${metric}: ${this.metrics[metric]}`);
    }
    
    recordTiming(operation, startTime) {
        if (!this.enabled) return;
        
        const duration = performance.now() - startTime;
        const timingKey = `${operation}_timing`;
        
        if (!this.metrics[timingKey]) {
            this.metrics[timingKey] = [];
        }
        
        this.metrics[timingKey].push(duration);
        this.log('TIMING', `${operation}: ${duration.toFixed(2)}ms`);
    }
    
    recordAPICall(url, success, duration) {
        if (!this.enabled) return;
        
        this.metrics.apiCalls++;
        
        if (!this.metrics.apiStats) {
            this.metrics.apiStats = {
                successful: 0,
                failed: 0,
                totalDuration: 0
            };
        }
        
        if (success) {
            this.metrics.apiStats.successful++;
        } else {
            this.metrics.apiStats.failed++;
        }
        
        this.metrics.apiStats.totalDuration += duration;
        
        this.log('API', `${url} - ${success ? 'SUCCESS' : 'FAIL'} - ${duration}ms`);
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }
    
    reportMetrics() {
        if (!this.enabled) return;
        
        const uptime = Date.now() - this.metrics.sessionStart;
        const memory = this.getMemoryUsage();
        
        const report = {
            uptime: Math.round(uptime / 1000), // seconds
            metrics: this.metrics,
            memory: memory,
            recentLogs: this.logs.slice(-10)
        };
        
        console.group('📊 TuVung Extension Performance Report');
        console.table(this.metrics);
        if (memory) {
            console.log('💾 Memory Usage:', memory);
        }
        console.log('⏱️ Uptime:', Math.round(uptime / 1000), 'seconds');
        console.groupEnd();
        
        // Send to background script for storage
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
                action: 'performanceReport',
                data: report
            }).catch(() => {
                // Ignore errors if background script not available
            });
        }
    }
    
    reportFinal() {
        if (!this.enabled) return;
        
        this.log('INFO', 'Session ending - final report');
        this.reportMetrics();
        
        // Save session data
        const sessionData = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.metrics.sessionStart,
            metrics: this.metrics,
            logs: this.logs
        };
        
        localStorage.setItem('tuVungExtensionSession', JSON.stringify(sessionData));
    }
    
    exportLogs() {
        if (!this.enabled) return null;
        
        const exportData = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            logs: this.logs,
            memory: this.getMemoryUsage(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tuvung-extension-logs-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        return exportData;
    }
    
    // Public API for tracking specific extension events
    trackWordLookup(word, success, duration) {
        this.recordMetric('wordLookups');
        this.recordTiming('wordLookup', performance.now() - duration);
        this.log('LOOKUP', `Word: ${word}, Success: ${success}`);
    }
    
    trackWordAdded(word, auto = false) {
        this.recordMetric('wordsAdded');
        this.log('ADD_WORD', `Added: ${word}, Auto: ${auto}`);
    }
    
    trackDialogOpen(trigger) {
        this.recordMetric('dialogOpens');
        this.log('DIALOG', `Opened via: ${trigger}`);
    }
    
    trackError(error, context) {
        this.recordMetric('errors');
        this.log('ERROR', `${context}: ${error.message || error}`);
    }
}

// Create global instance
window.TuVungMonitor = new TuVungPerformanceMonitor();

// Expose debugging utilities
if (window.TuVungMonitor.enabled) {
    window.debugTuVung = {
        getMetrics: () => window.TuVungMonitor.metrics,
        getLogs: () => window.TuVungMonitor.logs,
        exportLogs: () => window.TuVungMonitor.exportLogs(),
        reportNow: () => window.TuVungMonitor.reportMetrics(),
        clearLogs: () => {
            window.TuVungMonitor.logs = [];
            console.log('🧹 TuVung logs cleared');
        }
    };
    
    console.log('🛠️ TuVung Debug utilities available: window.debugTuVung');
}
