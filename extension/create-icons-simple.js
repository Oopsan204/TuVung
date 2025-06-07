// Simple icon creator for TuVung Extension
// Tạo icon đơn giản bằng Canvas API

function createIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    
    // Draw background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw letter "T" for TuVung
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', size / 2, size / 2);
    
    return canvas.toDataURL();
}

// Create icons for all sizes
function generateIcons() {
    const sizes = [16, 48, 128];
    const results = {};
    
    sizes.forEach(size => {
        results[size] = createIcon(size);
    });
    
    return results;
}

// Export for use
if (typeof module !== 'undefined') {
    module.exports = { createIcon, generateIcons };
}
