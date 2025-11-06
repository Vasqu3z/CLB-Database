// ===== PLAYER ATTRIBUTE COMPARISON =====
// Purpose: Retrieve and compare player attributes with in-memory caching for performance
// Dependencies: DatabaseConfig.js
// Entry Point(s): getPlayerAttributes(), getPlayerAttributesWithAverages(), showAttributeComparison()

function showAttributeComparison() {
  var html = HtmlService.createHtmlOutputFromFile('DatabaseAttributesApp')
    .setWidth(1000)
    .setHeight(700)
    .setTitle('Player Attribute Comparison');
  SpreadsheetApp.getUi().showModalDialog(html, 'Player Attribute Comparison');
}

function showAttributeComparisonAdmin() {
  var html = HtmlService.createHtmlOutputFromFile('DatabaseAttributesAdmin')
    .setWidth(1100)
    .setHeight(700)
    .setTitle('Player Attribute Comparison (Admin)');
  SpreadsheetApp.getUi().showModalDialog(html, 'Player Attribute Comparison (Admin)');
}

// Cache to store the attribute data
var attributeCache = null;
var attributeCacheTimestamp = null;
var ATTRIBUTE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getAttributeData() {
  var now = new Date().getTime();
  
  // Return cached data if it's still valid
  if (attributeCache && attributeCacheTimestamp && (now - attributeCacheTimestamp < ATTRIBUTE_CACHE_DURATION)) {
    return attributeCache;
  }
  
  var config = getConfig();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var attributeSheet = ss.getSheetByName(config.SHEETS.ATTRIBUTES);
  
  if (!attributeSheet) {
    throw new Error(config.SHEETS.ATTRIBUTES + ' sheet not found');
  }
  
  var lastRow = attributeSheet.getLastRow();
  if (lastRow < config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW) {
    return null;
  }
  
  // Read ALL data in ONE operation
  var allData = attributeSheet.getRange(
    config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW,
    1,
    lastRow - config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW + 1,
    config.ATTRIBUTES_CONFIG.TOTAL_COLUMNS
  ).getValues();
  
  // Build a map of player name -> attributes
  var playerMap = {};
  var playerNames = [];
  
  for (var i = 0; i < allData.length; i++) {
    var name = String(allData[i][0]).trim();
    if (!name) continue;
    
    playerNames.push(name);
    playerMap[name] = allData[i];
  }
  
  // Sort player names
  playerNames.sort(function(a, b) {
    return a.localeCompare(b);
  });
  
  // Cache the result
  attributeCache = {
    map: playerMap,
    players: playerNames,
    config: config
  };
  attributeCacheTimestamp = now;
  
  return attributeCache;
}

function getPlayerAttributeList() {
  try {
    var data = getAttributeData();
    if (!data) return [];
    return data.players;
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getPlayerAttributeList: ' + e.toString());
    }
    throw e;
  }
}

function getPlayerAttributes(playerNames) {
  try {
    var data = getAttributeData();
    if (!data) return [];

    var config = data.config;
    var COLS = config.ATTRIBUTES_CONFIG.COLUMNS;
    var results = [];

    for (var p = 0; p < playerNames.length; p++) {
      var playerName = playerNames[p];
      var row = data.map[playerName];

      if (!row) continue;

      var playerData = {
        name: playerName,
        characterClass: row[COLS.CHARACTER_CLASS],
        armSide: row[COLS.ARM_SIDE],
        battingSide: row[COLS.BATTING_SIDE],
        weight: row[COLS.WEIGHT],
        ability: row[COLS.ABILITY],

        // Overall stats
        pitchingOverall: row[COLS.PITCHING_OVERALL],
        battingOverall: row[COLS.BATTING_OVERALL],
        fieldingOverall: row[COLS.FIELDING_OVERALL],
        speedOverall: row[COLS.SPEED_OVERALL],

        // Hitting attributes
        hittingTrajectory: row[COLS.HITTING_TRAJECTORY],
        slapHitContact: row[COLS.SLAP_HIT_CONTACT],
        chargeHitContact: row[COLS.CHARGE_HIT_CONTACT],
        slapHitPower: row[COLS.SLAP_HIT_POWER],
        chargeHitPower: row[COLS.CHARGE_HIT_POWER],


        // Running attributes
        speed: row[COLS.SPEED],
        bunting: row[COLS.BUNTING],

        // Fielding attributes
        throwingSpeed: row[COLS.THROWING_SPEED],
        fielding: row[COLS.FIELDING],

        // Pitching attributes
        curveballSpeed: row[COLS.CURVEBALL_SPEED],
        fastballSpeed: row[COLS.FASTBALL_SPEED],
        curve: row[COLS.CURVE],

        // Stamina
        stamina: row[COLS.STAMINA]
      };

      results.push(playerData);
    }

    return results;
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getPlayerAttributes: ' + e.toString());
    }
    throw e;
  }
}

// ===== ADMIN VERSION FUNCTIONS =====

function getPlayerAttributesWithAverages(playerNames) {
  try {
    var data = getAttributeData();
    if (!data) return [];

    var config = data.config;
    var COLS = config.ATTRIBUTES_CONFIG.COLUMNS;
    var results = [];

    for (var p = 0; p < playerNames.length; p++) {
      var playerName = playerNames[p];
      var row = data.map[playerName];

      if (!row) continue;

      var playerData = {
        name: playerName,
        characterClass: row[COLS.CHARACTER_CLASS],
        armSide: row[COLS.ARM_SIDE],
        battingSide: row[COLS.BATTING_SIDE],
        weight: row[COLS.WEIGHT],
        ability: row[COLS.ABILITY],

        // Overall stats
        pitchingOverall: row[COLS.PITCHING_OVERALL],
        battingOverall: row[COLS.BATTING_OVERALL],
        fieldingOverall: row[COLS.FIELDING_OVERALL],
        speedOverall: row[COLS.SPEED_OVERALL],

        // Hitting attributes
        hittingTrajectory: row[COLS.HITTING_TRAJECTORY],
        slapHitContact: row[COLS.SLAP_HIT_CONTACT],
        chargeHitContact: row[COLS.CHARGE_HIT_CONTACT],
        slapHitPower: row[COLS.SLAP_HIT_POWER],
        chargeHitPower: row[COLS.CHARGE_HIT_POWER],


        // Running attributes
        speed: row[COLS.SPEED],
        bunting: row[COLS.BUNTING],

        // Fielding attributes
        throwingSpeed: row[COLS.THROWING_SPEED],
        fielding: row[COLS.FIELDING],

        // Pitching attributes
        curveballSpeed: row[COLS.CURVEBALL_SPEED],
        fastballSpeed: row[COLS.FASTBALL_SPEED],
        curve: row[COLS.CURVE],

        // Stamina
        stamina: row[COLS.STAMINA]
      };
      
      // Calculate individual player averages
      // Pitching Average: ((Curveball Speed / 2) + (Fastball Speed / 2) + Curve + Stamina) / 4
      playerData.pitchingAverage = (
        (playerData.curveballSpeed / 2) + 
        (playerData.fastballSpeed / 2) + 
        playerData.curve + 
        playerData.stamina
      ) / 4;
      
      // Batting Average: (Slap Contact + Charge Contact + Slap Power + Charge Power) / 4
      playerData.battingAverage = (
        playerData.slapHitContact + 
        playerData.chargeHitContact + 
        playerData.slapHitPower + 
        playerData.chargeHitPower
      ) / 4;
      
      // Fielding Average: (Throwing Speed + Fielding) / 2
      playerData.fieldingAverage = (
        playerData.throwingSpeed + 
        playerData.fielding
      ) / 2;
      
      results.push(playerData);
    }
    
    return results;
  } catch (e) {
    var config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getPlayerAttributesWithAverages: ' + e.toString());
    }
    throw e;
  }
}

// Function to manually clear cache if needed
function clearAttributeCache() {
  attributeCache = null;
  attributeCacheTimestamp = null;
}

// Function to clear all caches
function clearAllCaches() {
  clearAttributeCache();
  if (typeof clearChemistryCache === 'function') {
    clearChemistryCache();
  }
}