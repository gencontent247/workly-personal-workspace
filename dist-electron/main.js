"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_crypto_1 = require("node:crypto");
const isDev = !electron_1.app.isPackaged;
const dataDirectory = () => node_path_1.default.join(electron_1.app.getPath('documents'), 'Personal Workspace', 'data');
const passwordFile = () => node_path_1.default.join(electron_1.app.getPath('userData'), 'password.json');
function readPassword() {
    try {
        const record = JSON.parse(node_fs_1.default.readFileSync(passwordFile(), 'utf8'));
        return typeof record.salt === 'string' && typeof record.hash === 'string' ? record : null;
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return null;
        throw error;
    }
}
function matches(password, record) {
    const actual = (0, node_crypto_1.scryptSync)(password, Buffer.from(record.salt, 'hex'), 64);
    const expected = Buffer.from(record.hash, 'hex');
    return actual.length === expected.length && (0, node_crypto_1.timingSafeEqual)(actual, expected);
}
function writePassword(password) {
    const salt = (0, node_crypto_1.randomBytes)(16);
    const hash = (0, node_crypto_1.scryptSync)(password, salt, 64);
    node_fs_1.default.mkdirSync(electron_1.app.getPath('userData'), { recursive: true });
    node_fs_1.default.writeFileSync(passwordFile(), JSON.stringify({ salt: salt.toString('hex'), hash: hash.toString('hex') }), { mode: 0o600 });
}
function createWindow() {
    electron_1.Menu.setApplicationMenu(null);
    const win = new electron_1.BrowserWindow({
        width: 1440, height: 920, minWidth: 1000, minHeight: 680,
        backgroundColor: '#f4f6f5', title: 'Personal Workspace', autoHideMenuBar: true,
        webPreferences: { preload: node_path_1.default.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false }
    });
    win.setMenu(null);
    win.setMenuBarVisibility(false);
    win.webContents.session.setSpellCheckerEnabled(false);
    if (isDev)
        win.loadURL('http://127.0.0.1:5173');
    else
        win.loadFile(node_path_1.default.join(__dirname, '../dist/index.html'));
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://'))
            electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
}
electron_1.app.whenReady().then(() => {
    electron_1.ipcMain.handle('app:ensure-data-directory', () => {
        const dir = dataDirectory();
        node_fs_1.default.mkdirSync(dir, { recursive: true });
        return dir;
    });
    electron_1.ipcMain.handle('auth:has-password', () => readPassword() !== null);
    electron_1.ipcMain.handle('auth:verify', (_event, password) => {
        const record = readPassword();
        return record !== null && matches(password, record);
    });
    electron_1.ipcMain.handle('auth:set-password', (_event, password, current) => {
        if (typeof password !== 'string' || password.length < 8)
            return false;
        const record = readPassword();
        if (record && (typeof current !== 'string' || !matches(current, record)))
            return false;
        writePassword(password);
        return true;
    });
    electron_1.ipcMain.handle('auth:remove-password', (_event, current) => {
        const record = readPassword();
        if (!record || !matches(current, record))
            return false;
        node_fs_1.default.rmSync(passwordFile());
        return true;
    });
    electron_1.ipcMain.handle('auth:reset-all', () => {
        node_fs_1.default.rmSync(dataDirectory(), { recursive: true, force: true });
        node_fs_1.default.rmSync(passwordFile(), { force: true });
        return true;
    });
    createWindow();
    electron_1.app.on('activate', () => { if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow(); });
});
electron_1.app.on('window-all-closed', () => { if (process.platform !== 'darwin')
    electron_1.app.quit(); });
