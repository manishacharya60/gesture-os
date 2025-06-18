class GestureOS {
    constructor() {
        this.hands = null;
        this.camera = null;
        this.currentGesture = 'none';
        this.lastGesture = 'none';
        this.gestureStartTime = 0;
        this.gestureThreshold = 500; // ms
        this.volume = 50;
        this.openWindows = new Set();
        this.activeWindow = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.init();
    }
    
    async init() {
        await this.setupCamera();
        this.setupMediaPipe();
        this.setupEventListeners();
        this.startClock();
        this.updateVolumeDisplay();
    }
    
    async setupCamera() {
        try {
            const video = document.getElementById('webcam');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            video.srcObject = stream;
            
            this.camera = new Camera(video, {
                onFrame: async () => {
                    if (this.hands) {
                        await this.hands.send({ image: video });
                    }
                },
                width: 640,
                height: 480
            });
        } catch (error) {
            console.error('Error accessing camera:', error);
            // Hide webcam elements if camera access fails
            document.getElementById('webcam').style.display = 'none';
            document.getElementById('canvas').style.display = 'none';
        }
    }
    
    setupMediaPipe() {
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        
        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.hands.onResults((results) => {
            this.processResults(results);
        });
        
        if (this.camera) {
            this.camera.start();
        }
    }
    
    processResults(results) {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 192; // 48 * 4 (w-48 in Tailwind)
        canvas.height = 144; // 36 * 4 (h-36 in Tailwind)
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Draw hand landmarks
            this.drawLandmarks(ctx, landmarks);
            
            // Detect gesture
            const gesture = this.detectGesture(landmarks);
            this.handleGesture(gesture);
            
            // Update cursor position (index finger tip)
            this.updateCursor(landmarks[8]);
        }
    }
    
    drawLandmarks(ctx, landmarks) {
        ctx.fillStyle = '#3b82f6';
        landmarks.forEach(landmark => {
            const x = landmark.x * ctx.canvas.width;
            const y = landmark.y * ctx.canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }
    
    detectGesture(landmarks) {
        const fingers = this.getFingerStates(landmarks);
        
        // Pointer (index finger up, others down)
        if (fingers[1] && !fingers[0] && !fingers[2] && !fingers[3] && !fingers[4]) {
            return 'pointer';
        }
        
        // Peace sign (index and middle up)
        if (fingers[1] && fingers[2] && !fingers[0] && !fingers[3] && !fingers[4]) {
            return 'peace';
        }
        
        // Rock on (index and pinky up)
        if (fingers[1] && fingers[4] && !fingers[0] && !fingers[2] && !fingers[3]) {
            return 'rock_on';
        }
        
        // Open palm (all fingers up)
        if (fingers[0] && fingers[1] && fingers[2] && fingers[3] && fingers[4]) {
            return 'open_palm';
        }
        
        // Fist (all fingers down)
        if (!fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
            return 'fist';
        }
        
        // Thumbs up
        if (fingers[0] && !fingers[1] && !fingers[2] && !fingers[3] && !fingers[4]) {
            return 'thumbs_up';
        }
        
        // Thumbs down (thumb down, others up or neutral)
        if (!fingers[0] && (fingers[1] || fingers[2] || fingers[3] || fingers[4])) {
            const thumbTip = landmarks[4];
            const thumbMcp = landmarks[2];
            if (thumbTip.y > thumbMcp.y) {
                return 'thumbs_down';
            }
        }
        
        // Pinch (thumb and index close)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) + 
            Math.pow(thumbTip.y - indexTip.y, 2)
        );
        if (distance < 0.05) {
            return 'pinch';
        }
        
        // OK sign (thumb and index forming circle)
        if (distance < 0.08 && fingers[2] && fingers[3] && fingers[4]) {
            return 'ok';
        }
        
        // Pen sign (index and middle together, others down)
        const indexTip2 = landmarks[8];
        const middleTip = landmarks[12];
        const indexMiddleDistance = Math.sqrt(
            Math.pow(indexTip2.x - middleTip.x, 2) + 
            Math.pow(indexTip2.y - middleTip.y, 2)
        );
        if (indexMiddleDistance < 0.05 && !fingers[0] && !fingers[3] && !fingers[4]) {
            return 'pen';
        }
        
        return 'none';
    }
    
    getFingerStates(landmarks) {
        const fingers = [];
        
        // Thumb
        fingers.push(landmarks[4].x > landmarks[3].x);
        
        // Other fingers
        for (let i = 1; i <= 4; i++) {
            const tipIndex = i * 4;
            const pipIndex = tipIndex - 2;
            fingers.push(landmarks[tipIndex].y < landmarks[pipIndex].y);
        }
        
        return fingers;
    }
    
    handleGesture(gesture) {
        const now = Date.now();
        
        if (gesture !== this.lastGesture) {
            this.gestureStartTime = now;
            this.lastGesture = gesture;
        }
        
        // Only trigger action if gesture is held for threshold time
        if (gesture !== 'none' && gesture !== this.currentGesture && 
            (now - this.gestureStartTime) > this.gestureThreshold) {
            
            this.currentGesture = gesture;
            this.executeGestureAction(gesture);
        }
        
        // Update gesture indicator
        document.getElementById('gestureIndicator').textContent = 
            `Gesture: ${gesture.replace('_', ' ').toUpperCase()}`;
    }
    
    executeGestureAction(gesture) {
        switch (gesture) {
            case 'open_palm':
                this.minimizeAllWindows();
                break;
            case 'fist':
                this.closeActiveWindow();
                break;
            case 'thumbs_up':
                this.adjustVolume(10);
                break;
            case 'thumbs_down':
                this.adjustVolume(-10);
                break;
            case 'pen':
                this.openApp('notepad');
                break;
            case 'peace':
                this.openApp('gallery');
                break;
            case 'ok':
                this.openApp('browser');
                break;
            case 'rock_on':
                this.openApp('music');
                break;
        }
    }
    
    updateCursor(indexTip) {
        const cursor = document.getElementById('cursor');
        const x = (1 - indexTip.x) * window.innerWidth; // Mirror horizontally
        const y = indexTip.y * window.innerHeight;
        
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
        
        // Add clicking effect for pinch gesture
        if (this.currentGesture === 'pinch') {
            cursor.classList.add('clicking');
            this.handleClick(x, y);
        } else {
            cursor.classList.remove('clicking');
        }
    }
    
    handleClick(x, y) {
        // Check if clicking on app icons
        const appIcons = document.querySelectorAll('.app-icon');
        appIcons.forEach(icon => {
            const rect = icon.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                const appName = icon.dataset.app;
                this.openApp(appName);
            }
        });
        
        // Check if clicking on window close buttons
        const closeButtons = document.querySelectorAll('.close-btn');
        closeButtons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                const window = btn.closest('.window');
                this.closeWindow(window.id);
            }
        });
    }
    
    openApp(appName) {
        const windowId = `${appName}Window`;
        const window = document.getElementById(windowId);
        
        if (window && !this.openWindows.has(windowId)) {
            window.classList.remove('hidden', 'minimized');
            this.openWindows.add(windowId);
            this.activeWindow = windowId;
            this.addToTaskbar(appName, windowId);
        }
    }
    
    closeWindow(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            window.classList.add('hidden');
            this.openWindows.delete(windowId);
            this.removeFromTaskbar(windowId);
            
            if (this.activeWindow === windowId) {
                this.activeWindow = null;
            }
        }
    }
    
    closeActiveWindow() {
        if (this.activeWindow) {
            this.closeWindow(this.activeWindow);
        }
    }
    
    minimizeAllWindows() {
        this.openWindows.forEach(windowId => {
            const window = document.getElementById(windowId);
            if (window) {
                window.classList.add('minimized');
            }
        });
    }
    
    adjustVolume(delta) {
        this.volume = Math.max(0, Math.min(100, this.volume + delta));
        this.updateVolumeDisplay();
        this.showVolumeSlider();
    }
    
    updateVolumeDisplay() {
        const volumeLevel = document.getElementById('volumeLevel');
        const volumeText = document.getElementById('volumeText');
        
        volumeLevel.style.height = `${this.volume}%`;
        volumeText.textContent = `${this.volume}%`;
    }
    
    showVolumeSlider() {
        const slider = document.getElementById('volumeSlider');
        slider.classList.remove('hidden');
        
        // Hide after 2 seconds
        setTimeout(() => {
            slider.classList.add('hidden');
        }, 2000);
    }
    
    addToTaskbar(appName, windowId) {
        const taskbar = document.getElementById('taskbarApps');
        const existing = document.getElementById(`taskbar-${windowId}`);
        
        if (!existing) {
            const taskbarItem = document.createElement('div');
            taskbarItem.id = `taskbar-${windowId}`;
            taskbarItem.className = 'w-8 h-8 bg-white/20 rounded cursor-pointer flex items-center justify-center';
            taskbarItem.innerHTML = `<div class="w-2 h-2 bg-white rounded-full"></div>`;
            taskbarItem.onclick = () => this.toggleWindow(windowId);
            taskbar.appendChild(taskbarItem);
        }
    }
    
    removeFromTaskbar(windowId) {
        const taskbarItem = document.getElementById(`taskbar-${windowId}`);
        if (taskbarItem) {
            taskbarItem.remove();
        }
    }
    
    toggleWindow(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            if (window.classList.contains('minimized')) {
                window.classList.remove('minimized');
                this.activeWindow = windowId;
            } else {
                window.classList.add('minimized');
            }
        }
    }
    
    setupEventListeners() {
        // Close button handlers
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const window = e.target.closest('.window');
                this.closeWindow(window.id);
            });
        });
        
        // App icon handlers
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.addEventListener('click', () => {
                const appName = icon.dataset.app;
                this.openApp(appName);
            });
        });
        
        // Window dragging (for title bars)
        document.querySelectorAll('.window-header').forEach(header => {
            header.addEventListener('mousedown', (e) => {
                const window = header.closest('.window');
                this.startDragging(window, e);
            });
        });
    }
    
    startDragging(window, e) {
        this.isDragging = true;
        this.activeWindow = window.id;
        
        const rect = window.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        const handleMouseMove = (e) => {
            if (this.isDragging) {
                window.style.left = `${e.clientX - this.dragOffset.x}px`;
                window.style.top = `${e.clientY - this.dragOffset.y}px`;
            }
        };
        
        const handleMouseUp = () => {
            this.isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    
    startClock() {
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            document.getElementById('clock').textContent = timeString;
        };
        
        updateClock();
        setInterval(updateClock, 1000);
    }
}

// Initialize the Gesture OS when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GestureOS();
});