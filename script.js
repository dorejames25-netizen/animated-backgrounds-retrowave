/**
 * 80s Synthwave Background Engine (Chrome-Optimized)
 * Features: Pulsing Sun, Vector Mountains, 3D Moving Perspective Grid, Mirror Scanline Shimmer
 */

const canvas = document.getElementById('retroCanvas');
const ctx = canvas.getContext('2d');

// Fixed Offscreen Buffer Canvas initialized ONCE to prevent Chrome memory crashes
const offscreenCanvas = document.createElement('canvas');
const oCtx = offscreenCanvas.getContext('2d');

// Application State Tracking
let width = canvas.width = offscreenCanvas.width = window.innerWidth;
let height = canvas.height = offscreenCanvas.height = window.innerHeight;

let time = 0;
let gridSpeed = 2; // Speed of the forward grid movement
let gridOffset = 0;

// Reusable Mountain coordinates (Normalized ratios to maintain shape across screen resizing)
const mountainPeaks = [
    { rX: 0.00, rY: 0.44 }, { rX: 0.08, rY: 0.47 }, { rX: 0.14, rY: 0.42 },
    { rX: 0.22, rY: 0.49 }, { rX: 0.28, rY: 0.45 }, { rX: 0.35, rY: 0.49 },
    { rX: 0.42, rY: 0.48 }, { rX: 0.47, rY: 0.495 }, // Midpoint dips behind sun
    { rX: 0.53, rY: 0.495 }, { rX: 0.58, rY: 0.48 }, { rX: 0.65, rY: 0.49 },
    { rX: 0.72, rY: 0.44 }, { rX: 0.79, rY: 0.48 }, { rX: 0.86, rY: 0.41 },
    { rX: 0.93, rY: 0.46 }, { rX: 1.00, rY: 0.43 }
];

// Handle Window Resizing gracefully
window.addEventListener('resize', () => {
    width = canvas.width = offscreenCanvas.width = window.innerWidth;
    height = canvas.height = offscreenCanvas.height = window.innerHeight;
});

/**
 * Draw Sky Gradient and Cosmic Stars
 */
function drawSky() {
    let horizonY = height * 0.5;
    
    // Background sky gradient (Deep magenta to dark purple)
    let skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#53004b');
    skyGrad.addColorStop(0.7, '#a80077');
    skyGrad.addColorStop(1, '#db007c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizonY);

    // Render subtle background star matrix (Pseudo-randomized using sin)
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 1; i <= 60; i++) {
        let x = (Math.sin(i * 342.23) * 0.5 + 0.5) * width;
        let y = (Math.cos(i * 124.84) * 0.5 + 0.5) * (horizonY - 30);
        let size = (Math.sin(i + time * 0.05) * 0.5 + 0.5) * 1.5 + 0.5;
        ctx.fillRect(x, y, size, size);
    }
}

/**
 * Draw Atmospheric Pulsing Sun
 */
function drawSun() {
    let horizonY = height * 0.5;
    let centerX = width * 0.5;
    let baseRadius = Math.min(width, height) * 0.22;
    
    // Smooth looping breathing animation scale
    let pulseScale = 1 + Math.sin(time * 0.02) * 0.025;
    let radius = baseRadius * pulseScale;

    ctx.save();
    
    // Radial soft bloom aura
    let glowGrad = ctx.createRadialGradient(centerX, horizonY, radius * 0.5, centerX, horizonY, radius * 1.5);
    glowGrad.addColorStop(0, 'rgba(255, 180, 0, 0.35)');
    glowGrad.addColorStop(0.6, 'rgba(219, 0, 124, 0.15)');
    glowGrad.addColorStop(1, 'rgba(83, 0, 75, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(centerX, horizonY, radius * 1.6, 0, Math.PI, true);
    ctx.fill();

    // Solid core sun gradient
    let sunGrad = ctx.createLinearGradient(centerX, horizonY - radius, centerX, horizonY);
    sunGrad.addColorStop(0, '#ffe853');
    sunGrad.addColorStop(0.5, '#ffaa00');
    sunGrad.addColorStop(1, '#ff5500');
    
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(centerX, horizonY, radius, 0, Math.PI, true); // Render semi-circle dome over horizon
    ctx.fill();
    
    ctx.restore();
}

/**
 * Draw Flat Vector Mountain Silhouettes
 */
function drawMountains() {
    let horizonY = height * 0.5;
    ctx.fillStyle = '#1a0221'; // Deep flat vector shadow color
    ctx.beginPath();
    ctx.moveTo(0, horizonY);

    for (let i = 0; i < mountainPeaks.length; i++) {
        let x = mountainPeaks[i].rX * width;
        let y = mountainPeaks[i].rY * height;
        
        if (y > horizonY) y = horizonY - 10;
        ctx.lineTo(x, y);
    }

    ctx.lineTo(width, horizonY);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw 3D infinite scrolling Matrix perspective grid on a specific target context
 */
function renderGridPlane(targetCtx, planeWidth, planeHeight, isMirrored = false) {
    let horizonY = planeHeight * 0.5;
    targetCtx.strokeStyle = '#00f3ff'; // Bright cyan matrix wireframe lines
    targetCtx.lineWidth = 1.5;

    // 1. Structural Vertical Perspective Convergence Lines
    let totalLines = 36;
    for (let i = -totalLines / 2; i <= totalLines / 2; i++) {
        let startX = (planeWidth * 0.5) + (i * (planeWidth / 14));
        
        targetCtx.beginPath();
        targetCtx.moveTo(startX, planeHeight); 
        targetCtx.lineTo(planeWidth * 0.5 + (i * 2), horizonY); 
        targetCtx.stroke();
    }

    // 2. Horizon-bound Transverse Scroll Lines 
    let maxHorizontalLines = 15;
    for (let i = 0; i < maxHorizontalLines; i++) {
        let progress = ((i + gridOffset) / maxHorizontalLines);
        let yRatio = Math.pow(progress, 2.5); // 3D depth spacing curve
        
        let currentY;
        if (isMirrored) {
            currentY = horizonY + (yRatio * (planeHeight - horizonY));
        } else {
            currentY = planeHeight - (yRatio * (planeHeight - horizonY));
        }

        if (currentY >= horizonY && currentY <= planeHeight) {
            targetCtx.beginPath();
            targetCtx.moveTo(0, currentY);
            targetCtx.lineTo(planeWidth, currentY);
            targetCtx.stroke();
        }
    }
}

/**
 * Draw Lower Plane Water Matrix with accurate Horizontal VHS Scanline Shimmering
 */
function drawWaterAndGrid() {
    let horizonY = height * 0.5;
    let waterHeight = height * 0.5;

    // Background setup for water floor
    let waterBg = ctx.createLinearGradient(0, horizonY, 0, height);
    waterBg.addColorStop(0, '#003747');
    waterBg.addColorStop(0.2, '#0c102b');
    waterBg.addColorStop(1, '#050212');
    ctx.fillStyle = waterBg;
    ctx.fillRect(0, horizonY, width, waterHeight);

    // Clear and reuse our persistent buffer to prevent performance spikes
    oCtx.clearRect(0, 0, width, height);
    renderGridPlane(oCtx, width, height, true);

    // Apply tracking distortion slice-by-slice
    for (let y = 0; y < waterHeight; y++) {
        let globalY = horizonY + y;
        
        // Scanline Wave formulas
        let waveFactor = Math.sin((y * 0.2) + (time * 0.15)) * 1.8;
        let microShimmer = Math.cos((y * 0.8) - (time * 0.3)) * 0.7;
        let totalOffset = waveFactor + microShimmer;

        // Scale intensity as it gets closer to the viewer
        let distanceScale = (y / waterHeight);
        totalOffset *= (1 + distanceScale * 3.5);

        // Blit line segments to target viewport with offset
        ctx.drawImage(
            offscreenCanvas, 
            0, globalY, width, 1, 
            totalOffset, globalY, width, 1 
        );
    }
}

/**
 * Animation Master Loop
 */
function loop() {
    time += 1;
    
    gridOffset += (gridSpeed * 0.015);
    if (gridOffset >= 1.0) {
        gridOffset -= 1.0; 
    }

    ctx.clearRect(0, 0, width, height);

    drawSky();
    drawSun();
    drawMountains();
    drawWaterAndGrid();

    requestAnimationFrame(loop);
}

// Ignition
loop();
