// ===== PLAYER ATTRIBUTE COMPARISON TOOL =====
// Compare player attributes from the Player Database

function showAttributeComparison() {
  var html = HtmlService.createHtmlOutputFromFile('DatabaseAttributesApp')
    .setWidth(1000)
    .setHeight(700)
    .setTitle('Player Attribute Comparison');
  SpreadsheetApp.getUi().showModalDialog(html, 'Player Attribute Comparison');
}

function showAttributeComparisonAdmin() {
  var html = HtmlService.createHtmlOutputFromFile('AttributesToolAdmin')
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
    Logger.log('Error in getPlayerAttributeList: ' + e.toString());
    throw e;
  }
}

function getPlayerAttributes(playerNames) {
  try {
    var data = getAttributeData();
    if (!data) return [];
    
    var results = [];
    
    for (var p = 0; p < playerNames.length; p++) {
      var playerName = playerNames[p];
      var row = data.map[playerName];
      
      if (!row) continue;
      
      var playerData = {
        name: playerName,
        characterClass: row[1],
        armSide: row[2],
        battingSide: row[3],
        weight: row[4],
        ability: row[5],
        
        // Overall stats
        pitchingOverall: row[6],
        battingOverall: row[7],
        fieldingOverall: row[8],
        speedOverall: row[9],
        
        // Hitting attributes
        hittingTrajectory: row[10],
        slapHitContact: row[11],
        chargeHitContact: row[12],
        slapHitPower: row[13],
        chargeHitPower: row[14],
        
        
        // Running attributes
        speed: row[15],
        bunting: row[16],
        
        // Fielding attributes
        throwingSpeed: row[17],
        fielding: row[18],
        
        // Pitching attributes
        curveballSpeed: row[19],
        fastballSpeed: row[20],
        curve: row[21],
        
        // Stamina
        stamina: row[22]
      };
      
      results.push(playerData);
    }
    
    return results;
  } catch (e) {
    Logger.log('Error in getPlayerAttributes: ' + e.toString());
    throw e;
  }
}

// ===== ADMIN VERSION FUNCTIONS =====

function getPlayerAttributesWithAverages(playerNames) {
  try {
    var data = getAttributeData();
    if (!data) return [];
    
    var results = [];
    
    for (var p = 0; p < playerNames.length; p++) {
      var playerName = playerNames[p];
      var row = data.map[playerName];
      
      if (!row) continue;
      
      var playerData = {
        name: playerName,
        characterClass: row[1],
        armSide: row[2],
        battingSide: row[3],
        weight: row[4],
        ability: row[5],
        
        // Overall stats
        pitchingOverall: row[6],
        battingOverall: row[7],
        fieldingOverall: row[8],
        speedOverall: row[9],
        
        // Hitting attributes
        hittingTrajectory: row[10],
        slapHitContact: row[11],
        chargeHitContact: row[12],
        slapHitPower: row[13],
        chargeHitPower: row[14],
        
        
        // Running attributes
        speed: row[15],
        bunting: row[16],
        
        // Fielding attributes
        throwingSpeed: row[17],
        fielding: row[18],
        
        // Pitching attributes
        curveballSpeed: row[19],
        fastballSpeed: row[20],
        curve: row[21],
        
        // Stamina
        stamina: row[22]
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
    Logger.log('Error in getPlayerAttributesWithAverages: ' + e.toString());
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