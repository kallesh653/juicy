const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;
let mongoProcess;

// MongoDB data path (local storage)
const MONGO_DATA_PATH = path.join(app.getPath('userData'), 'mongodb-data');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    show: false,
    title: 'ColdDrink Billing System'
  });

  // Remove default menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { role: 'reload' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About ColdDrink Billing',
              message: 'ColdDrink Billing System v1.0.0',
              detail: 'Professional billing software for cold drink shops.\n\nDeveloped with modern technologies for fast and reliable performance.'
            });
          }
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = isDev
      ? path.join(__dirname, '..', 'backend', 'server.js')
      : path.join(process.resourcesPath, 'backend', 'server.js');

    // Set environment variables for backend
    const env = {
      ...process.env,
      NODE_ENV: isDev ? 'development' : 'production',
      PORT: '5000',
      MONGODB_URI: 'mongodb://localhost:27017/colddrink_billing',
      JWT_SECRET: 'colddrink_billing_secure_key_2024',
      JWT_EXPIRE: '30d'
    };

    backendProcess = spawn('node', [backendPath], {
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
      if (data.toString().includes('Server running')) {
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (err) => {
      reject(err);
    });

    // Resolve after timeout if not already resolved
    setTimeout(resolve, 5000);
  });
}

app.whenReady().then(async () => {
  try {
    // Start backend server
    console.log('Starting backend server...');
    await startBackend();

    // Create main window
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox('Startup Error', `Failed to start the application: ${error.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Kill backend process
  if (backendProcess) {
    backendProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
