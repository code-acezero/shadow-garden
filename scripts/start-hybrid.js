// scripts/start-hybrid.js
// 1-Click Runner: Boots Next.js UI and Go Streaming Gateway together

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENGINE_DIR = path.join(ROOT_DIR, 'engine');
const IS_WINDOWS = process.platform === 'win32';
const GO_BIN_NAME = IS_WINDOWS ? 'kagemi-gateway.exe' : 'kagemi-gateway';
const GO_BIN_PATH = path.join(ENGINE_DIR, GO_BIN_NAME);

console.log('========================================================');
console.log('   KAGEMI 1-CLICK HYBRID RUNNER (Go + Next.js)');
console.log('========================================================');

// 1. Ensure Go Binary is compiled
if (!fs.existsSync(GO_BIN_PATH)) {
    console.log('[1/3] Compiling Go Streaming Gateway...');
    try {
        execSync(`go build -ldflags="-s -w" -o ${GO_BIN_NAME} .`, {
            cwd: ENGINE_DIR,
            stdio: 'inherit'
        });
        console.log('[1/3] Go Gateway compiled successfully!');
    } catch (err) {
        console.error('Failed to compile Go engine. Make sure Go is installed:', err.message);
        process.exit(1);
    }
} else {
    console.log('[1/3] Go Gateway binary found.');
}

// 2. Start Next.js on port 3000
const isProd = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
console.log(`[2/3] Starting Next.js core server on port 3000 (${isProd ? 'PRODUCTION - ZERO LAG' : 'DEVELOPMENT'})...`);
const nextArgs = isProd ? ['run', 'start', '--', '-p', '3000'] : ['run', 'dev'];
const nextProcess = spawn(
    IS_WINDOWS ? 'npm.cmd' : 'npm',
    nextArgs,
    {
        cwd: ROOT_DIR,
        env: { ...process.env, PORT: '3000' },
        stdio: 'inherit',
        shell: IS_WINDOWS
    }
);

// 3. Start Go Gateway on port 8085 (reverse-proxies to 3000, intercepts /api/proxy & /api/shorts)
console.log('[3/3] Starting Go Streaming Gateway on port 8085...');
const goProcess = spawn(
    GO_BIN_PATH,
    [],
    {
        cwd: ENGINE_DIR,
        env: {
            ...process.env,
            PORT: '8085',
            NEXT_URL: 'http://127.0.0.1:3000'
        },
        stdio: 'inherit',
        shell: false
    }
);

console.log('\n>>> KAGEMI HYBRID IS LIVE: Open http://localhost:8085 in your browser <<<\n');

function shutdown() {
    console.log('\nShutting down Kagemi hybrid stack...');
    try { goProcess.kill(); } catch (e) {}
    try { nextProcess.kill(); } catch (e) {}
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
