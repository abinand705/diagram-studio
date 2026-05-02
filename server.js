#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

// Target the actual server file
const serverPath = path.join(__dirname, 'backend', 'server.js');

// Spawn the process with the correct Working Directory so .env loads correctly
const child = spawn('node', [serverPath], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit' // Pipe output to the current terminal
});

child.on('error', (err) => {
    console.error('Failed to start server:', err);
});
