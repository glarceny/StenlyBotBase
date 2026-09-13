// ===================================================
//  Stenly WhatsApp Bot - Plugin Manager
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const PLUGINS_DIR = path.join(__dirname, '../plugins');
const plugins = new Map(); // fullFilePath -> pluginObject

/**
 * Recursively find all .js files in a directory
 */
function getPluginFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            results = results.concat(getPluginFiles(fullPath));
        } else if (item.isFile() && item.name.endsWith('.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Load or reload a single plugin file
 */
function loadPlugin(filePath) {
    const relPath = path.relative(PLUGINS_DIR, filePath);
    try {
        const resolved = require.resolve(filePath);
        delete require.cache[resolved];
        const plugin = require(filePath);

        if (!plugin || typeof plugin !== 'object') {
            console.log(chalk.yellow(`[PLUGIN] Skip invalid plugin: ${relPath}`));
            return false;
        }

        plugin.__file = filePath;
        plugin.__rel = relPath;
        plugins.set(filePath, plugin);
        console.log(chalk.green(`[PLUGIN AUTO-LOAD] Loaded: ${relPath}`));
        return true;
    } catch (err) {
        console.error(chalk.red(`[PLUGIN ERROR] Failed loading ${relPath}:`), err.message || err);
        return false;
    }
}

/**
 * Unload a plugin file
 */
function unloadPlugin(filePath) {
    const relPath = path.relative(PLUGINS_DIR, filePath);
    try {
        const resolved = require.resolve(filePath);
        delete require.cache[resolved];
    } catch (_) {}

    if (plugins.has(filePath)) {
        plugins.delete(filePath);
        console.log(chalk.yellow(`[PLUGIN AUTO-LOAD] Unloaded: ${relPath}`));
    }
}

let watchInitialized = false;
let watchDebounce = null;

/**
 * Watch plugins directory for changes, creations, and deletions
 */
function watchPlugins() {
    if (watchInitialized) return;
    watchInitialized = true;

    try {
        fs.watch(PLUGINS_DIR, { recursive: true }, (eventType, filename) => {
            if (!filename || !filename.endsWith('.js')) return;

            clearTimeout(watchDebounce);
            watchDebounce = setTimeout(() => {
                const fullPath = path.join(PLUGINS_DIR, filename);
                if (fs.existsSync(fullPath)) {
                    loadPlugin(fullPath);
                } else {
                    unloadPlugin(fullPath);
                }
            }, 100);
        });
        console.log(chalk.cyan(`[PLUGIN WATCHER] Active watching on ${PLUGINS_DIR}`));
    } catch (err) {
        console.error(chalk.red('[PLUGIN WATCHER ERROR]'), err.message || err);
    }
}

/**
 * Initialize all plugins
 */
function initPlugins() {
    if (!fs.existsSync(PLUGINS_DIR)) {
        fs.mkdirSync(PLUGINS_DIR, { recursive: true });
    }

    const files = getPluginFiles(PLUGINS_DIR);
    for (const file of files) {
        loadPlugin(file);
    }
    console.log(chalk.bold.cyan(`[PLUGINS READY] Total ${plugins.size} plugins loaded.`));

    watchPlugins();
}

/**
 * Find plugin matching command
 */
function findPlugin(cmd) {
    if (!cmd) return null;
    const cleanCmd = cmd.toLowerCase().trim();

    // 1. Pass pertama: cocokkan string pasti (exact match)
    for (const plugin of plugins.values()) {
        if (!plugin.command) continue;
        if (Array.isArray(plugin.command)) {
            if (plugin.command.some(c => typeof c === 'string' && c.toLowerCase() === cleanCmd)) return plugin;
        } else if (typeof plugin.command === 'string') {
            if (plugin.command.toLowerCase() === cleanCmd) return plugin;
        }
    }

    // 2. Pass kedua: cocokkan regex / pola dinamis
    for (const plugin of plugins.values()) {
        if (!plugin.command) continue;
        if (plugin.command instanceof RegExp) {
            if (plugin.command.test(cleanCmd)) return plugin;
        } else if (Array.isArray(plugin.command)) {
            for (const c of plugin.command) {
                if (c instanceof RegExp && c.test(cleanCmd)) return plugin;
            }
        }
    }

    return null;
}

/**
 * Get all categories with their registered commands
 * Returns: { [categoryName]: string[] }
 */
function getCategories() {
    const cats = {};
    for (const plugin of plugins.values()) {
        const cat = (plugin.category || 'other').toLowerCase();
        if (!cats[cat]) cats[cat] = [];
        if (Array.isArray(plugin.command)) {
            for (const cmd of plugin.command) {
                if (typeof cmd === 'string' && !cats[cat].includes(cmd)) {
                    cats[cat].push(cmd);
                }
            }
        } else if (typeof plugin.command === 'string' && !cats[cat].includes(plugin.command)) {
            cats[cat].push(plugin.command);
        }
        if (Array.isArray(plugin.menu)) {
            for (const item of plugin.menu) {
                if (typeof item === 'string' && !cats[cat].includes(item)) {
                    cats[cat].push(item);
                }
            }
        }
    }
    return cats;
}

/**
 * Run 'before' hooks of all loaded plugins
 */
async function runBefore(context) {
    for (const plugin of plugins.values()) {
        if (typeof plugin.before === 'function') {
            try {
                const handled = await plugin.before(context);
                if (handled === true) return true;
            } catch (err) {
                console.error(chalk.red(`[PLUGIN ERROR in ${plugin.__rel} before]:`), err);
            }
        }
    }
    return false;
}

/**
 * Get all loaded plugins
 */
function getAll() {
    return Array.from(plugins.values());
}

/**
 * Count total registered commands
 */
function countCommands() {
    let count = 0;
    for (const plugin of plugins.values()) {
        if (Array.isArray(plugin.command)) {
            count += plugin.command.length;
        } else if (plugin.command) {
            count += 1;
        }
    }
    return count;
}

module.exports = {
    initPlugins,
    findPlugin,
    runBefore,
    getAll,
    loadPlugin,
    unloadPlugin,
    count: () => plugins.size,
    countCommands,
    getCategories
};
