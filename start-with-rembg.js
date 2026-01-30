const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting StyleIt with Rembg Background Removal...');

// Check if Python is installed
function checkPython() {
  return new Promise((resolve) => {
    const python = spawn('python', ['--version'], { shell: true });
    python.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Python is installed');
        resolve(true);
      } else {
        console.log('❌ Python is not installed. Please install Python first.');
        resolve(false);
      }
    });
  });
}

// Install Python dependencies
function installPythonDeps() {
  return new Promise((resolve) => {
    const requirementsPath = path.join(__dirname, 'python-service', 'requirements.txt');
    if (!fs.existsSync(requirementsPath)) {
      console.log('⚠️  requirements.txt not found, skipping dependency installation');
      resolve(true);
      return;
    }

    console.log('📦 Installing Python dependencies...');
    const pip = spawn('pip', ['install', '-r', requirementsPath], { shell: true });

    pip.stdout.on('data', (data) => {
      console.log(`pip: ${data}`);
    });

    pip.stderr.on('data', (data) => {
      console.error(`pip error: ${data}`);
    });

    pip.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Python dependencies installed');
        resolve(true);
      } else {
        console.log('❌ Failed to install Python dependencies');
        resolve(false);
      }
    });
  });
}

// Start Python rembg service
function startRembgService() {
  return new Promise((resolve) => {
    console.log('🐍 Starting Python rembg service on port 5001...');

    const pythonService = spawn('python', ['rembg_service.py'], {
      cwd: path.join(__dirname, 'python-service'),
      shell: true
    });

    pythonService.stdout.on('data', (data) => {
      console.log(`rembg: ${data}`);
    });

    pythonService.stderr.on('data', (data) => {
      console.error(`rembg error: ${data}`);
    });

    // Wait for service to start
    // Increased timeout to 15 seconds to allow for model loading
    setTimeout(() => {
      // Check if service is running
      const curl = spawn('curl', ['-s', 'http://localhost:5001/health'], { shell: true });
      curl.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Rembg service is running');
          resolve(pythonService);
        } else {
          console.log('❌ Rembg service failed to start (check timeout or logs)');
          // Don't kill immediately, let user see logs
          resolve(pythonService); // Resolving anyway to prevent full crash if it's just slow
        }
      });
    }, 15000);
  });
}

// Start main application
function startMainApp() {
  console.log('🚀 Starting main application...');
  const mainApp = spawn('npm', ['run', 'start:full'], {
    shell: true,
    stdio: 'inherit'
  });

  return mainApp;
}

// Cleanup function
function cleanup(rembgProcess, mainProcess) {
  console.log('🛑 Shutting down services...');
  if (rembgProcess) {
    rembgProcess.kill();
  }
  if (mainProcess) {
    mainProcess.kill();
  }
  process.exit(0);
}

// Main execution
async function main() {
  try {
    // Check Python installation
    const pythonInstalled = await checkPython();
    if (!pythonInstalled) {
      process.exit(1);
    }

    // Install Python dependencies
    const depsInstalled = await installPythonDeps();
    if (!depsInstalled) {
      process.exit(1);
    }

    // Start rembg service
    const rembgProcess = await startRembgService();
    if (!rembgProcess) {
      process.exit(1);
    }

    // Start main application
    const mainProcess = startMainApp();

    // Set up cleanup handlers
    process.on('SIGINT', () => cleanup(rembgProcess, mainProcess));
    process.on('SIGTERM', () => cleanup(rembgProcess, mainProcess));

    // Wait for processes
    mainProcess.on('close', () => {
      cleanup(rembgProcess, mainProcess);
    });

  } catch (error) {
    console.error('❌ Error starting application:', error);
    process.exit(1);
  }
}

main();
