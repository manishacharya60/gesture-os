# Gesture OS

A web-based gesture-controlled desktop environment demo that simulates a full operating system experience using hand tracking.

## Features

- **Hand Gesture Recognition**: Uses MediaPipe Hands for real-time hand tracking
- **Gesture Controls**:
  - **Pointer**: Index finger up (cursor control)
  - **Pinch**: Thumb and index together (click action)
  - **Open Palm**: All fingers up (minimize all windows)
  - **Fist**: All fingers down (close active window)
  - **Thumbs Up/Down**: Volume control
  - **Peace Sign**: Open Image Gallery
  - **Rock On**: Open Music Player
  - **OK Sign**: Open Web Browser
  - **Pen Sign**: Open Notepad

- **Simulated Applications**:
  - Notepad with text editing
  - Music Player with controls
  - Web Browser with iframe
  - Image Gallery with sample images
  - Settings panel with toggles
  - Calculator with functional buttons

- **Desktop Environment**:
  - Taskbar with running applications
  - Window management (drag, close, minimize)
  - Volume control with visual feedback
  - Real-time clock
  - Custom cursor controlled by gestures

## Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Run with Electron (Development)**:
   ```bash
   npm run electron-dev
   ```

## Building for Production

1. **Build Web Application**:
   ```bash
   npm run build
   ```

2. **Build Electron Application**:
   ```bash
   npm run build-electron
   ```

3. **Create Distributable**:
   ```bash
   npm run dist
   ```

This will create a Windows executable in the `dist` folder.

## Camera Permissions

The application requires camera access for hand tracking. Make sure to allow camera permissions when prompted.

## Gesture Recognition Tips

- Ensure good lighting for better hand detection
- Keep your hand clearly visible in the camera frame
- Hold gestures for about 0.5 seconds to trigger actions
- The webcam feed shows hand landmarks for debugging

## Technology Stack

- **Frontend**: HTML, CSS (Tailwind), JavaScript
- **Hand Tracking**: MediaPipe Hands
- **Desktop App**: Electron
- **Build Tool**: Vite

## File Structure

```
gesture-os/
├── index.html          # Main HTML file
├── js/
│   └── app.js         # Main application logic
├── electron/
│   ├── main.js        # Electron main process
│   └── preload.js     # Electron preload script
├── assets/
│   └── icon.png       # Application icon
├── package.json       # Dependencies and scripts
├── vite.config.js     # Vite configuration
└── README.md          # This file
```

## Customization

You can easily customize the OS by:
- Adding new gesture patterns in `detectGesture()`
- Creating new simulated applications
- Modifying the desktop theme and wallpaper
- Adding more window management features

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Edge
- Safari (limited MediaPipe support)

## License

MIT License - feel free to modify and distribute.