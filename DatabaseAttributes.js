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
        captain: row[COLS.CAPTAIN],
        mii: row[COLS.MII],
        miiColor: row[COLS.MII_COLOR],
        armSide: row[COLS.ARM_SIDE],
        battingSide: row[COLS.BATTING_SIDE],
        weight: row[COLS.WEIGHT],
        ability: row[COLS.ABILITY],

        // Overall stats
        pitchingOverall: row[COLS.PITCHING_OVERALL],
        battingOverall: row[COLS.BATTING_OVERALL],
        fieldingOverall: row[COLS.FIELDING_OVERALL],
        speedOverall: row[COLS.SPEED_OVERALL],

        // Pitching attributes
        starPitch: row[COLS.STAR_PITCH],
        fastballSpeed: row[COLS.FASTBALL_SPEED],
        curveballSpeed: row[COLS.CURVEBALL_SPEED],
        curve: row[COLS.CURVE],
        stamina: row[COLS.STAMINA],

        // Hitting attributes
        starSwing: row[COLS.STAR_SWING],
        hitCurve: row[COLS.HIT_CURVE],
        hittingTrajectory: row[COLS.HITTING_TRAJECTORY],
        slapHitContact: row[COLS.SLAP_HIT_CONTACT],
        chargeHitContact: row[COLS.CHARGE_HIT_CONTACT],
        slapHitPower: row[COLS.SLAP_HIT_POWER],
        chargeHitPower: row[COLS.CHARGE_HIT_POWER],
        preCharge: row[COLS.PRE_CHARGE],

        // Fielding attributes
        fielding: row[COLS.FIELDING],
        throwingSpeed: row[COLS.THROWING_SPEED],

        // Running attributes
        speed: row[COLS.SPEED],
        bunting: row[COLS.BUNTING]
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
        captain: row[COLS.CAPTAIN],
        mii: row[COLS.MII],
        miiColor: row[COLS.MII_COLOR],
        armSide: row[COLS.ARM_SIDE],
        battingSide: row[COLS.BATTING_SIDE],
        weight: row[COLS.WEIGHT],
        ability: row[COLS.ABILITY],

        // Overall stats
        pitchingOverall: row[COLS.PITCHING_OVERALL],
        battingOverall: row[COLS.BATTING_OVERALL],
        fieldingOverall: row[COLS.FIELDING_OVERALL],
        speedOverall: row[COLS.SPEED_OVERALL],

        // Pitching attributes
        starPitch: row[COLS.STAR_PITCH],
        fastballSpeed: row[COLS.FASTBALL_SPEED],
        curveballSpeed: row[COLS.CURVEBALL_SPEED],
        curve: row[COLS.CURVE],
        stamina: row[COLS.STAMINA],

        // Hitting attributes
        starSwing: row[COLS.STAR_SWING],
        hitCurve: row[COLS.HIT_CURVE],
        hittingTrajectory: row[COLS.HITTING_TRAJECTORY],
        slapHitContact: row[COLS.SLAP_HIT_CONTACT],
        chargeHitContact: row[COLS.CHARGE_HIT_CONTACT],
        slapHitPower: row[COLS.SLAP_HIT_POWER],
        chargeHitPower: row[COLS.CHARGE_HIT_POWER],
        preCharge: row[COLS.PRE_CHARGE],

        // Fielding attributes
        fielding: row[COLS.FIELDING],
        throwingSpeed: row[COLS.THROWING_SPEED],

        // Running attributes
        speed: row[COLS.SPEED],
        bunting: row[COLS.BUNTING]
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

/**
 * Save character attribute changes to the database
 * @param {string} playerName - Name of the player to update
 * @param {Object} modifiedFields - Object mapping field labels to new values
 * @returns {Object} Success/error result
 */
function saveCharacterAttributes(playerName, modifiedFields) {
  try {
    var config = getConfig();
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var attributeSheet = ss.getSheetByName(config.SHEETS.ATTRIBUTES);

    if (!attributeSheet) {
      throw new Error(config.SHEETS.ATTRIBUTES + ' sheet not found');
    }

    // Find the player's row
    var data = getAttributeData();
    if (!data || !data.map[playerName]) {
      throw new Error('Player not found: ' + playerName);
    }

    // Get the player's row number (1-based)
    var playerIndex = data.players.indexOf(playerName);
    var rowNumber = config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW + playerIndex;

    // Map field labels to column indices
    var COLS = config.ATTRIBUTES_CONFIG.COLUMNS;
    var fieldToColumn = {
      'Weight': COLS.WEIGHT + 1,
      'Curve': COLS.CURVE + 1,
      'Curveball Speed': COLS.CURVEBALL_SPEED + 1,
      'Fastball Speed': COLS.FASTBALL_SPEED + 1,
      'Stamina': COLS.STAMINA + 1,
      'Slap Hit Contact Size': COLS.SLAP_HIT_CONTACT + 1,
      'Charge Hit Contact Size': COLS.CHARGE_HIT_CONTACT + 1,
      'Slap Hit Power': COLS.SLAP_HIT_POWER + 1,
      'Charge Hit Power': COLS.CHARGE_HIT_POWER + 1,
      'Bunting': COLS.BUNTING + 1,
      'Speed': COLS.SPEED + 1,
      'Throwing Speed': COLS.THROWING_SPEED + 1,
      'Fielding': COLS.FIELDING + 1,
      'Pitching Overall': COLS.PITCHING_OVERALL + 1,
      'Batting Overall': COLS.BATTING_OVERALL + 1,
      'Fielding Overall': COLS.FIELDING_OVERALL + 1,
      'Speed Overall': COLS.SPEED_OVERALL + 1,
      'Captain': COLS.CAPTAIN + 1,
      'Hit Curve': COLS.HIT_CURVE + 1,
      'Pre-Charge': COLS.PRE_CHARGE + 1,
      'Mii': COLS.MII + 1
    };

    // Update each modified field
    for (var fieldLabel in modifiedFields) {
      if (modifiedFields.hasOwnProperty(fieldLabel)) {
        var columnNumber = fieldToColumn[fieldLabel];
        if (!columnNumber) {
          Logger.log('Warning: Unknown field label: ' + fieldLabel);
          continue;
        }

        var newValue = modifiedFields[fieldLabel];

        // Convert to number if it's a numeric field
        if (typeof newValue === 'string' && !isNaN(newValue)) {
          newValue = Number(newValue);
        }

        // Update the cell
        attributeSheet.getRange(rowNumber, columnNumber).setValue(newValue);
      }
    }

    // Clear cache to force refresh
    clearAttributeCache();

    return { success: true, message: 'Character attributes updated successfully' };

  } catch (e) {
    Logger.log('Error in saveCharacterAttributes: ' + e.toString());
    throw new Error('Failed to save character attributes: ' + e.message);
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