// ===== WEB APP ROUTER =====
// Handles routing for multiple web apps in one project

function doGet(e) {
  var config = getConfig();
  var page = e.parameter.page || 'landing';

  if (config.DEBUG.ENABLE_LOGGING) {
    Logger.log('Web app accessed with page parameter: ' + page);
  }

  switch(page) {
    case 'lineup':
      if (config.DEBUG.ENABLE_LOGGING) {
        Logger.log('Returning LineupBuilder');
      }
      return HtmlService.createHtmlOutputFromFile('LineupBuilder')
        .setTitle('Lineup Builder')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    case 'chemistry':
      if (config.DEBUG.ENABLE_LOGGING) {
        Logger.log('Returning PlayerChemistry');
      }
      return HtmlService.createHtmlOutputFromFile('PlayerChemistry')
        .setTitle('Player Chemistry Comparison')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    case 'attributes':
      if (config.DEBUG.ENABLE_LOGGING) {
        Logger.log('Returning AttributeComparison');
      }
      return HtmlService.createHtmlOutputFromFile('AttributeComparison')
        .setTitle('Attribute Comparison')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    case 'landing':
    default:
      if (config.DEBUG.ENABLE_LOGGING) {
        Logger.log('Returning landing page');
      }
      return createLandingPage();
}
}

function createLandingPage() {
  // Get the current web app URL dynamically
  var scriptUrl = ScriptApp.getService().getUrl();
  
  var html = '<html><head><style>' +
    'body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }' +
    'h1 { color: #1e3c72; }' +
    '.tool-link { display: block; padding: 15px; margin: 10px 0; background: #667eea; color: white; ' +
    'text-decoration: none; border-radius: 8px; text-align: center; font-weight: 600; font-size: 16px; }' +
    '.tool-link:hover { background: #5568d3; transform: translateY(-2px); transition: all 0.2s; }' +
    '.description { color: #6c757d; font-size: 14px; margin-top: 5px; }' +
    '</style></head><body>' +
    '<h1>⚾ CLB Chemistry Tools Suite</h1>' +
    '<p>Select a tool to get started:</p>' +
    '<a href="' + scriptUrl + '?page=chemistry" class="tool-link">' +
    'Player Chemistry Comparison' +
    '<div class="description">Compare chemistry for up to 4 players side-by-side</div>' +
    '</a>' +
    '<a href="' + scriptUrl + '?page=lineup" class="tool-link">' +
    'Lineup Builder' +
    '<div class="description">Build your perfect lineup with chemistry visualization</div>' +
    '</a>' +
    '<a href="' + scriptUrl + '?page=attributes" class="tool-link">' +
    'Attribute Comparison' +
    '<div class="description">Compare player attributes and stats</div>' +
    '</a>' +
    '</body></html>';
  
  return HtmlService.createHtmlOutput(html)
    .setTitle('CLB Chemistry Tools')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}