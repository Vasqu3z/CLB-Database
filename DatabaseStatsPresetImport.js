// ===== STATS PRESET IMPORT/EXPORT =====
// Purpose: Import/export chemistry data from Mario Super Sluggers Stats Editor preset format
// Dependencies: DatabaseConfig.js
// Entry Point(s): importChemistryFromStatsPreset(), exportChemistryToStatsPreset(), showChemistryEditor()

/**
 * Character list in game order (positions 0-100)
 * Extracted from Mario Super Sluggers Stat Editor.py
 * This is the canonical order used in stats preset files
 */
const GAME_CHARACTER_ORDER = [
  "Mario", "Luigi", "Donkey Kong", "Diddy Kong", "Peach", "Daisy",
  "Green Yoshi", "Baby Mario", "Baby Luigi", "Bowser", "Wario",
  "Waluigi", "Green Koopa Troopa", "Red Toad", "Boo", "Toadette",
  "Red Shy Guy", "Birdo", "Monty Mole", "Bowser Jr.",
  "Red Koopa Paratroopa", "Blue Pianta", "Red Pianta",
  "Yellow Pianta", "Blue Noki", "Red Noki", "Green Noki",
  "Hammer Bro", "Toadsworth", "Blue Toad", "Yellow Toad",
  "Green Toad", "Purple Toad", "Blue Magikoopa", "Red Magikoopa",
  "Green Magikoopa", "Yellow Magikoopa", "King Boo", "Petey Piranha",
  "Dixie Kong", "Goomba", "Paragoomba", "Red Koopa Troopa",
  "Green Koopa Paratroopa", "Blue Shy Guy", "Yellow Shy Guy",
  "Green Shy Guy", "Gray Shy Guy", "Gray Dry Bones",
  "Green Dry Bones", "Dark Bones", "Blue Dry Bones", "Fire Bro",
  "Boomerang Bro", "Wiggler", "Blooper", "Funky Kong", "Tiny Kong",
  "Green Kritter", "Blue Kritter", "Red Kritter", "Brown Kritter",
  "King K. Rool", "Baby Peach", "Baby Daisy", "Baby DK", "Red Yoshi",
  "Blue Yoshi", "Yellow Yoshi", "Light Blue Yoshi", "Pink Yoshi",
  "Unused Yoshi 2", "Unused Yoshi", "Unused Toad", "Unused Pianta",
  "Unused Kritter", "Unused Koopa", "Red Mii (M)", "Orange Mii (M)",
  "Yellow Mii (M)", "Light Green Mii (M)", "Green Mii (M)",
  "Blue Mii (M)", "Light Blue Mii (M)", "Pink Mii (M)",
  "Purple Mii (M)", "Brown Mii (M)", "White Mii (M)", "Black Mii (M)",
  "Red Mii (F)", "Orange Mii (F)", "Yellow Mii (F)",
  "Light Green Mii (F)", "Green Mii (F)", "Blue Mii (F)",
  "Light Blue Mii (F)", "Pink Mii (F)", "Purple Mii (F)",
  "Brown Mii (F)", "White Mii (F)", "Black Mii (F)"
];

/**
 * Show file upload dialog for importing stats preset
 */
function importChemistryFromStatsPreset() {
  const html = HtmlService.createHtmlOutputFromFile('ImportStatsPreset')
    .setWidth(550)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Import Chemistry from Stats Preset');
}

/**
 * Parse stats preset file content and populate Chemistry Lookup
 * @param {string} fileContent - Raw .txt file content from stats preset
 * @returns {Object} Import results with statistics
 */
function parseStatsPresetChemistry(fileContent) {
  try {
    const lines = fileContent.split('\n');

    // Validate we have enough lines
    if (lines.length < 101) {
      throw new Error(`Invalid preset file: Expected at least 101 lines, found ${lines.length}`);
    }

    // Extract chemistry section (lines 0-100, first 101 lines)
    const chemistryLines = lines.slice(0, 101);

    // Parse matrix
    const matrix = [];
    for (let i = 0; i < 101; i++) {
      const row = chemistryLines[i].split(',').map(v => {
        const val = parseInt(v.trim());
        if (isNaN(val)) {
          throw new Error(`Invalid value at row ${i + 1}: "${v}"`);
        }
        return val;
      });

      if (row.length !== 101) {
        throw new Error(`Invalid row ${i + 1}: Expected 101 values, found ${row.length}`);
      }

      matrix.push(row);
    }

    // Convert to lookup pairs
    const pairs = [];
    let positiveCount = 0;
    let strongPositiveCount = 0;

    for (let i = 0; i < 101; i++) {
      for (let j = i + 1; j < 101; j++) {
        const value = matrix[i][j];

        // Convert 0/1/2 to chemistry values
        // 0 = negative chemistry (-100)
        // 1 = neutral chemistry (0) - don't store
        // 2 = positive chemistry (+100)
        let chemistry = null;
        if (value === 0) {
          chemistry = -100;
          // Count as negative
        } else if (value === 1) {
          chemistry = null; // Neutral - don't store
        } else if (value === 2) {
          chemistry = 100;
          positiveCount++;
        }

        // Only store non-neutral chemistry (negative or positive)
        if (chemistry !== null) {
          pairs.push({
            player1: GAME_CHARACTER_ORDER[i],
            player2: GAME_CHARACTER_ORDER[j],
            chemistry: chemistry
          });
        }
      }
    }

    // Write to Chemistry Lookup sheet
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);

    if (!lookupSheet) {
      lookupSheet = ss.insertSheet(config.SHEETS.CHEMISTRY_LOOKUP);
    }

    writeToChemistryLookup(lookupSheet, pairs);
    updateChemistryDataJSON();

    const negativeCount = pairs.filter(p => p.chemistry < 0).length;

    return {
      success: true,
      totalPairs: pairs.length,
      positiveCount: positiveCount,
      negativeCount: negativeCount
    };

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in parseStatsPresetChemistry: ' + e.toString());
    }
    return {
      success: false,
      error: e.toString()
    };
  }
}

/**
 * Export current Chemistry Lookup to stats preset format
 * Returns the chemistry section as a string (101 lines)
 */
function exportChemistryToStatsPreset() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);

    if (!lookupSheet) {
      throw new Error('Chemistry Lookup sheet not found');
    }

    // Initialize 101x101 matrix with neutral (1) as default
    const matrix = Array(101).fill(null).map(() => Array(101).fill(1));

    // Build character name to index map
    const nameToIndex = {};
    GAME_CHARACTER_ORDER.forEach((name, idx) => {
      nameToIndex[name] = idx;
    });

    // Read Chemistry Lookup and populate matrix
    const lastRow = lookupSheet.getLastRow();
    if (lastRow > 1) {
      const data = lookupSheet.getRange(2, 1, lastRow - 1, 3).getValues();

      data.forEach(([p1, p2, chemVal]) => {
        const player1 = String(p1).trim();
        const player2 = String(p2).trim();
        const chem = Math.round(chemVal);

        const idx1 = nameToIndex[player1];
        const idx2 = nameToIndex[player2];

        if (idx1 !== undefined && idx2 !== undefined) {
          // Convert chemistry values back to 0/1/2 format
          // -100 or less = 0 (Negative)
          // between -100 and 100 = 1 (Neutral)
          // 100 or more = 2 (Positive)
          let value = 1; // Default to neutral
          if (chem <= -100) value = 0;      // Negative
          else if (chem >= 100) value = 2;  // Positive
          // else value stays 1 (Neutral)

          // Store in both directions (symmetric matrix)
          matrix[idx1][idx2] = value;
          matrix[idx2][idx1] = value;
        }
      });
    }

    // Convert matrix to text format
    const lines = matrix.map(row => row.join(','));
    const content = lines.join('\n');

    // Create download via HTML dialog
    const html = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <base target="_top">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            text-align: center;
          }
          button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
          }
          button:hover {
            background: #45a049;
          }
          .info {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <h2>Export Complete</h2>
        <div class="info">
          <p>Chemistry data ready for download</p>
          <p><strong>Note:</strong> This is only the chemistry section (101 lines).</p>
          <p>To create a full stats preset, you'll need to add stat/trajectory data.</p>
        </div>
        <button onclick="downloadFile()">Download Chemistry Data</button>
        <script>
          const content = ${JSON.stringify(content)};

          function downloadFile() {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'chemistry_export.txt';
            a.click();
            URL.revokeObjectURL(url);
          }
        </script>
      </body>
      </html>
    `)
    .setWidth(450)
    .setHeight(250);

    SpreadsheetApp.getUi().showModalDialog(html, 'Export Chemistry Data');

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in exportChemistryToStatsPreset: ' + e.toString());
    }
    SpreadsheetApp.getUi().alert('Export Error', e.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Show visual chemistry editor
 */
function showChemistryEditor() {
  const html = HtmlService.createHtmlOutputFromFile('DatabaseChemistryEditor')
    .setWidth(1200)
    .setHeight(650);
  SpreadsheetApp.getUi().showModalDialog(html, 'Chemistry Matrix Editor');
}

/**
 * Get full chemistry matrix for editor
 * Returns 101x101 matrix with character names
 */
function getChemistryMatrix() {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);

    // Initialize matrix with neutral (1) as default
    const matrix = Array(101).fill(null).map(() => Array(101).fill(1));

    // Build character name to index map
    const nameToIndex = {};
    GAME_CHARACTER_ORDER.forEach((name, idx) => {
      nameToIndex[name] = idx;
    });

    // Read Chemistry Lookup
    if (lookupSheet && lookupSheet.getLastRow() > 1) {
      const data = lookupSheet.getRange(2, 1, lookupSheet.getLastRow() - 1, 3).getValues();

      data.forEach(([p1, p2, chemVal]) => {
        const player1 = String(p1).trim();
        const player2 = String(p2).trim();
        const chem = Math.round(chemVal);

        const idx1 = nameToIndex[player1];
        const idx2 = nameToIndex[player2];

        if (idx1 !== undefined && idx2 !== undefined) {
          // Convert to 0/1/2 format
          // -100 or less = 0 (Negative)
          // between -100 and 100 = 1 (Neutral)
          // 100 or more = 2 (Positive)
          let value = 1; // Default to neutral
          if (chem <= -100) value = 0;      // Negative
          else if (chem >= 100) value = 2;  // Positive

          matrix[idx1][idx2] = value;
          matrix[idx2][idx1] = value;
        }
      });
    }

    return {
      matrix: matrix,
      characters: GAME_CHARACTER_ORDER
    };

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getChemistryMatrix: ' + e.toString());
    }
    throw e;
  }
}

/**
 * Update chemistry matrix from editor
 * @param {Array<Array<number>>} matrix - 101x101 matrix of chemistry values (0/1/2)
 * @param {Array<Object>} changes - Array of change objects with char1, char2, oldValue, newValue
 */
function updateChemistryMatrix(matrix, changes) {
  try {
    // Log all changes
    if (changes && changes.length > 0) {
      changes.forEach(change => {
        logChemistryChange(
          change.char1,
          change.char2,
          change.oldValue,
          change.newValue
        );
      });
    }

    // Convert matrix to pairs
    const pairs = [];

    for (let i = 0; i < 101; i++) {
      for (let j = i + 1; j < 101; j++) {
        const value = matrix[i][j];

        // Convert 0/1/2 to chemistry values
        // 0 = negative (-100)
        // 1 = neutral (0) - don't store
        // 2 = positive (+100)
        let chemistry = null;
        if (value === 0) chemistry = -100;      // Negative
        else if (value === 1) chemistry = null; // Neutral - skip
        else if (value === 2) chemistry = 100;  // Positive

        if (chemistry !== null) {
          pairs.push({
            player1: GAME_CHARACTER_ORDER[i],
            player2: GAME_CHARACTER_ORDER[j],
            chemistry: chemistry
          });
        }
      }
    }

    // Write to Chemistry Lookup
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);

    if (!lookupSheet) {
      lookupSheet = ss.insertSheet(config.SHEETS.CHEMISTRY_LOOKUP);
    }

    writeToChemistryLookup(lookupSheet, pairs);
    updateChemistryDataJSON();

    return { success: true, totalPairs: pairs.length, changesLogged: changes ? changes.length : 0 };

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in updateChemistryMatrix: ' + e.toString());
    }
    return { success: false, error: e.toString() };
  }
}

/**
 * Get all chemistry relationships for a specific character
 * @param {string} characterName - Name of character
 * @returns {Object} Character's chemistry data
 */
function getCharacterChemistry(characterName) {
  try {
    const idx = GAME_CHARACTER_ORDER.indexOf(characterName);
    if (idx === -1) {
      throw new Error('Character not found: ' + characterName);
    }

    const matrixData = getChemistryMatrix();
    const row = matrixData.matrix[idx];

    const relationships = [];
    for (let i = 0; i < 101; i++) {
      if (i !== idx && row[i] !== 0) {
        relationships.push({
          character: GAME_CHARACTER_ORDER[i],
          value: row[i]
        });
      }
    }

    return {
      character: characterName,
      relationships: relationships,
      positiveCount: relationships.filter(r => r.value === 1).length,
      strongPositiveCount: relationships.filter(r => r.value === 2).length
    };

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in getCharacterChemistry: ' + e.toString());
    }
    throw e;
  }
}

/**
 * Log a chemistry change to the Chemistry Change Log sheet
 * @param {string} char1 - First character name
 * @param {string} char2 - Second character name
 * @param {number} oldValue - Old chemistry value (0/1/2)
 * @param {number} newValue - New chemistry value (0/1/2)
 */
function logChemistryChange(char1, char2, oldValue, newValue) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('Chemistry Change Log');

    // Create sheet if it doesn't exist
    if (!logSheet) {
      logSheet = ss.insertSheet('Chemistry Change Log');

      // Set up headers
      logSheet.getRange(1, 1, 1, 5).setValues([
        ['Timestamp', 'Character 1', 'Character 2', 'Old Value', 'New Value', 'Notes']
      ]);

      // Format header row
      const headerRange = logSheet.getRange(1, 1, 1, 6);
      headerRange.setBackground('#667eea');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');

      // Set column widths
      logSheet.setColumnWidth(1, 150); // Timestamp
      logSheet.setColumnWidth(2, 150); // Character 1
      logSheet.setColumnWidth(3, 150); // Character 2
      logSheet.setColumnWidth(4, 100); // Old Value
      logSheet.setColumnWidth(5, 100); // New Value
      logSheet.setColumnWidth(6, 300); // Notes

      // Freeze header row
      logSheet.setFrozenRows(1);
    }

    // Convert values to readable format
    const valueToText = function(val) {
      if (val === 0) return 'Negative';
      if (val === 1) return 'Neutral';
      if (val === 2) return 'Positive';
      return 'Unknown';
    };

    // Add new row
    const timestamp = new Date();
    const newRow = [
      timestamp,
      char1,
      char2,
      valueToText(oldValue),
      valueToText(newValue),
      '' // Empty notes column for manual entry
    ];

    logSheet.appendRow(newRow);

    // Format the timestamp cell
    const lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');

    // Add border to new row
    logSheet.getRange(lastRow, 1, 1, 6).setBorder(true, true, true, true, true, true);

    // Color code based on change type
    const valueRange = logSheet.getRange(lastRow, 4, 1, 2);
    if (newValue === 2) {
      // Changed to positive - green highlight
      valueRange.setBackground('#d4edda');
    } else if (newValue === 0) {
      // Changed to negative - red highlight
      valueRange.setBackground('#f8d7da');
    } else {
      // Changed to neutral - gray highlight
      valueRange.setBackground('#e2e3e5');
    }

  } catch (e) {
    const config = getConfig();
    if (config.DEBUG.ENABLE_LOGGING) {
      Logger.log('Error in logChemistryChange: ' + e.toString());
    }
    // Don't throw - logging failure shouldn't break the editor
  }
}
