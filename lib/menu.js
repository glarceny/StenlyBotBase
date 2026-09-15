// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

function categorySections(plugins, prefix) {
    const registry = plugins?.getCategories ? plugins : require("./plugins");
    const categories = registry.getCategories();
    const keys = Object.keys(categories).sort((a, b) => a.localeCompare(b));
    return [{
        title: "Pilihan Menu Plugins",
        rows: keys.map(category => ({
            title: `${category.charAt(0).toUpperCase()}${category.slice(1)} Menu`,
            description: `Lihat daftar fitur ${category}`,
            id: `${prefix}menu ${category}`
        }))
    }];
}

module.exports = { categorySections };
