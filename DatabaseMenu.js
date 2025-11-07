// ===== MENU SYSTEM =====
// Purpose: Creates the custom CLB Tools menu in Google Sheets with all tool access points
// Dependencies: DatabaseConfig.js
// Entry Point(s): onOpen()

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  
  ui.createMenu('🎮 CLB Tools')
    .addItem('⚾ Player Attribute Comparison', 'showAttributeComparison')
    .addItem('⚡ Player Chemistry Tool', 'showPlayerChemistry')
    .addItem('🏟️ Lineup Builder', 'showLineupBuilder')
    .addSeparator()
    .addItem('🔐 Admin: Comparison with Averages', 'showAttributeComparisonAdmin')
    .addSeparator()
    .addSubMenu(ui.createMenu('🔧 Chemistry Tools')
      .addItem('✏️ Visual Chemistry Editor', 'showChemistryEditor')
      .addItem('📊 Update Chemistry JSON Cache', 'updateChemistryDataJSON')
      .addItem('🧹 Clear JSON Cache', 'clearChemistryCache'))
    .addSubMenu(ui.createMenu('📦 Stats Preset Import/Export')
      .addItem('📥 Import Full Preset', 'importChemistryFromStatsPreset')
      .addItem('📤 Export Full Preset', 'exportChemistryToStatsPreset'))
    .addSeparator()
    .addItem('📋 About', 'showAbout')
    .addToUi();
}

function showAbout() {
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    'CLB Player Database Tools',
    'Player Attribute Comparison Tool v1.0\n\n' +
    '⚾ Standard Version:\n' +
    '  • Compare 2-5 players side-by-side\n' +
    '  • View all attributes and stats\n' +
    '  • Public-facing tool\n\n' +
    '⚡ Player Chemistry Tool:\n' +
    '  • Compare up to 4 players side-by-side\n' +
    '  • Team summary analysis\n' +
    '  • Shared chemistry highlighting\n\n' +
    '🏟️ Lineup Builder:\n' +
    '  • Interactive baseball field\n' +
    '  • Visual chemistry connections\n' +
    '  • Build and optimize lineups\n\n' +
    '🔧 Chemistry Tools:\n' +
    '  • Visual Chemistry Editor\n' +
    '  • Compact relationship views\n' +
    '  • Change logging for balance tracking\n' +
    '  • Negative/Neutral/Positive scale\n' +
    '  • JSON caching for performance\n\n' +
    '📦 Stats Preset Import/Export:\n' +
    '  • Import/Export full presets (228 lines)\n' +
    '  • Chemistry + Stats + Trajectory data\n' +
    '  • Custom trajectory name support\n' +
    '  • Character name mapping\n' +
    '  • Custom column preservation\n\n' +
    '🔐 Admin Version:\n' +
    '  • Includes league averages\n' +
    '  • Balance characters efficiently\n' +
    '  • For admin use only\n\n' +
    'Created for CLB Season I',
    ui.ButtonSet.OK
  );
}

/**
 * Clear the chemistry JSON cache
 */
function clearChemistryCache() {
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty('CHEMISTRY_DATA');
  props.deleteProperty('CHEMISTRY_DATA_TIMESTAMP');
  
  SpreadsheetApp.getUi().alert('Chemistry JSON cache cleared!');
}