const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Child Vaccination Management System...\n');

// Start backend server
console.log('📡 Starting Backend Server on port 8080...');
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Wait a moment for backend to start
setTimeout(() => {
  console.log('🌐 Starting Frontend Server on port 3000...');
  
  // Start frontend server
  const frontend = spawn('npx', ['serve', '.', '--listen', '3000'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  // Wait for frontend to start
  setTimeout(() => {
    console.log('🌍 Opening application in browser...');
    const { exec } = require('child_process');
    
    // Open browser
    exec('start http://localhost:3000', (error) => {
      if (error) {
        console.log('Please open http://localhost:3000 in your browser');
      }
    });

    console.log('\n✅ Application is now running!');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Backend:  http://localhost:8080');
    console.log('\nPress Ctrl+C to stop both servers');
  }, 3000);

}, 2000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping servers...');
  backend.kill();
  process.exit(0);
});
