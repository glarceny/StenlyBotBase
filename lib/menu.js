// ===================================================
//  Stenly WhatsApp Bot
//  Creator : Stenly Christian
//  Updated : 13 September 2026
// ===================================================

function categorySections(plugins, prefix) {
    const categories = plugins?.getCategories?.() || {};
    const keys = Object.keys(categories).sort((a, b) => a.localeCompare(b));
    return [{
        title: "Pilihan Menu Plugins",
        rows: keys.map(category => ({
            header: "",
            title: `${category.charAt(0).toUpperCase()}${category.slice(1)} Menu`,
            description: `Lihat daftar fitur ${category}`,
            id: `${prefix}menu ${category}`
        }))
    }];
}

module.exports = { categorySections };
