// ===== CONVERSION SCRIPT =====
// Converts Chemistry Matrix to Chemistry Lookup with automatic variant handling

/**
 * Main conversion function with confirmation prompt and Mii Color Chemistry support
 */
function convertChemistryMatrixToLookupWithVariants() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config = getConfig();

  // SAFEGUARD: Check if Chemistry Lookup already has data
  let lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);

  if (lookupSheet && lookupSheet.getLastRow() > 1) {
    const response = ui.alert(
      '⚠️ Confirm Conversion',
      'This will overwrite all data in the Chemistry Lookup sheet.\n\n' +
        'Any manual edits you made will be lost.\n\n' +
        'Continue with conversion?',
      ui.ButtonSet.YES_NO
    );
    if (response !== ui.Button.YES) {
      ui.alert('Conversion cancelled.');
      return;
    }
  }

  const matrixSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY);
  const attributesSheet = ss.getSheetByName(config.SHEETS.ATTRIBUTES);

  if (!matrixSheet) throw new Error('Chemistry Matrix sheet not found: ' + config.SHEETS.CHEMISTRY);
  if (!attributesSheet) throw new Error('Advanced Attributes sheet not found: ' + config.SHEETS.ATTRIBUTES);

  const miiColorSheet = ensureMiiColorChemistrySheet(ss);

  if (!lookupSheet) lookupSheet = ss.insertSheet(config.SHEETS.CHEMISTRY_LOOKUP);

  // Step 1: Get master list
  const masterList = getPlayerListFromAdvancedAttributes(attributesSheet);

  // Step 2: Build variant map
  const variantMap = buildVariantMap(masterList);

  // Step 3: Read Chemistry Matrix
  const matrixData = readChemistryMatrix(matrixSheet);

  // Step 4: Expand variants and rules
  let expandedData = expandVariantsWithRules(matrixData, variantMap, masterList);

  // Step 5: Apply Mii color chemistry
  const miiColorMappings = readMiiColorChemistry(miiColorSheet);
  expandedData = applyMiiColorChemistry(expandedData, miiColorMappings, masterList);

  // Step 6: Write to Chemistry Lookup
  writeToChemistryLookup(lookupSheet, expandedData);

  // Step 7: Update JSON cache
  updateChemistryDataJSON();

  ui.alert(
    '✅ Conversion Complete',
    'Chemistry Lookup updated with ' + expandedData.length + ' pairs.\n\n' +
      '• Matrix chemistry: Expanded with variants\n' +
      '• Mii color chemistry: ' + miiColorMappings.length + ' mappings applied\n\n' +
      'JSON cache has been refreshed.',
    ui.ButtonSet.OK
  );
}

/**
 * Get all player names from Advanced Attributes
 */
function getPlayerListFromAdvancedAttributes(sheet) {
  const config = getConfig();
  const lastRow = sheet.getLastRow();
  if (lastRow < config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW) return [];

  const data = sheet
    .getRange(
      config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW,
      config.ATTRIBUTES_CONFIG.COLUMNS.NAME,
      lastRow - config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW + 1,
      1
    )
    .getValues();

  return data.map(r => String(r[0]).trim()).filter(Boolean);
}

/**
 * Build map of base names to their variants
 */
function buildVariantMap(masterList) {
  const map = {};
  masterList.forEach(fullName => {
    const base = extractBaseName(fullName);
    if (!map[base]) map[base] = [];
    map[base].push(fullName);
  });
  return map;
}

/**
 * Extract base name (strip variants)
 */
function extractBaseName(fullName) {
  const paren = fullName.match(/^(.+?)\s*\(/);
  if (paren) return paren[1].trim();
  const bracket = fullName.match(/^(.+?)\s*\[/);
  if (bracket) return bracket[1].trim();
  return fullName.trim();
}

function isMiiCharacter(name) {
  return name.includes('[') && name.includes(']');
}

function extractMiiColor(name) {
  const m = name.match(/\[(.+?)\]/);
  return m ? m[1].trim() : null;
}

/**
 * Read chemistry pairs from matrix
 */
function readChemistryMatrix(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const header = sheet.getRange(1, 2, 1, lastCol - 1).getValues()[0];
  const pairs = [];

  for (let i = 0; i < data.length; i++) {
    const player1 = String(data[i][0]).trim();
    if (!player1) continue;

    for (let j = 1; j < data[i].length; j++) {
      const player2 = String(header[j - 1]).trim();
      const value = data[i][j];
      if (!player2 || typeof value !== 'number' || value === 0) continue;
      if (player1 <= player2) {
        pairs.push({ player1, player2, chemistry: Math.round(value) });
      }
    }
  }
  return pairs;
}

/**
 * Expand variants and apply special rules
 */
function expandVariantsWithRules(matrixData, variantMap, masterList) {
  const expanded = [];
  const seen = {};

  matrixData.forEach(({ player1, player2, chemistry }) => {
    const p1Variants = variantMap[player1] || [player1];
    const p2Variants = variantMap[player2] || [player2];

    p1Variants.forEach(p1 => {
      p2Variants.forEach(p2 => {
        if (p1 === p2) return;
        const key = [p1, p2].sort().join('|');
        if (seen[key]) return;
        seen[key] = true;

        const final = applyChemistryRules(p1, p2, chemistry);
        if (final !== 0) {
          const [a, b] = [p1, p2].sort();
          expanded.push({ player1: a, player2: b, chemistry: final });
        }
      });
    });
  });
  return expanded;
}

/**
 * Apply chemistry rules
 */
function applyChemistryRules(p1, p2, base) {
  // Yoshi rule
  const yoshi = applyYoshiException(p1, p2, base);
  if (yoshi !== base) return yoshi;

  const isMii1 = isMiiCharacter(p1);
  const isMii2 = isMiiCharacter(p2);
  if (isMii1 && isMii2) {
    const c1 = extractMiiColor(p1);
    const c2 = extractMiiColor(p2);
    return c1 !== c2 ? 0 : base;
  }

  const b1 = extractBaseName(p1);
  const b2 = extractBaseName(p2);
  if (b1 === b2 && p1 !== p2) return 0;

  return base;
}

/**
 * Yoshi (Green) exception
 */
function applyYoshiException(p1, p2, base) {
  const b1 = extractBaseName(p1);
  const b2 = extractBaseName(p2);
  if (b1 !== 'Yoshi' || b2 !== 'Yoshi') return base;
  if (p1 === 'Yoshi (Green)' || p2 === 'Yoshi (Green)') return base;
  return 0;
}

/**
 * Read Mii Color Chemistry mappings
 */
function readMiiColorChemistry(sheet) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  return data
    .map(r => ({
      miiColor: String(r[0]).trim(),
      characterVariant: String(r[1]).trim(),
      chemistry: Math.round(r[2])
    }))
    .filter(r => r.miiColor && r.characterVariant);
}

/**
 * Create Mii Color Chemistry sheet if missing
 */
function ensureMiiColorChemistrySheet(ss) {
  const config = getConfig();
  let sheet = ss.getSheetByName(config.SHEETS.MII_COLOR_CHEMISTRY);
  if (!sheet) {
    sheet = ss.insertSheet(config.SHEETS.MII_COLOR_CHEMISTRY);
    sheet.getRange(1, 1, 1, 3).setValues([['Mii Color', 'Character Variant', 'Chemistry']]);
    sheet.getRange(1, 1, 1, 3)
    sheet.setColumnWidths(1, 3, 150);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Apply Mii color chemistry
 */
function applyMiiColorChemistry(data, mappings, masterList) {
  if (mappings.length === 0) return data;
  const miisByColor = {};
  masterList.forEach(name => {
    if (isMiiCharacter(name)) {
      const color = extractMiiColor(name);
      if (color) {
        if (!miisByColor[color]) miisByColor[color] = [];
        miisByColor[color].push(name);
      }
    }
  });

  const seen = {};
  data.forEach(p => (seen[p.player1 + '|' + p.player2] = true));
  const added = [];

  mappings.forEach(m => {
    const miis = miisByColor[m.miiColor] || [];
    miis.forEach(mii => {
      const [a, b] = [mii, m.characterVariant].sort();
      const key = a + '|' + b;
      if (seen[key]) return;
      seen[key] = true;
      added.push({ player1: a, player2: b, chemistry: m.chemistry });
    });
  });

  return data.concat(added);
}

/**
 * Write expanded chemistry data to the Chemistry Lookup sheet.
 * Uses conditional formatting for performance and cleaner visuals.
 */
function writeToChemistryLookup(sheet, data) {
  const config = getConfig();
  const isNewSheet = sheet.getLastRow() === 0;

  // Clear only contents (keep any existing formatting or rules)
  if (!isNewSheet) {
    sheet.getRange(2, 1, Math.max(0, sheet.getLastRow() - 1), 3).clearContent();
  }

  // Write header row
  sheet.getRange(1, 1, 1, 3).setValues([['Player 1', 'Player 2', 'Chemistry']]);
  sheet.getRange(1, 1, 1, 3)
  sheet.setFrozenRows(1);

  if (data.length === 0) return;

  // Sort and write data
  data.sort((a, b) =>
    a.player1 !== b.player1 ? a.player1.localeCompare(b.player1) : a.player2.localeCompare(b.player2)
  );
  const rows = data.map(p => [p.player1, p.player2, p.chemistry]);
  const range = sheet.getRange(2, 1, rows.length, 3);
  range.setValues(rows);

  // Add borders and adjust column widths
  range.setBorder(true, true, true, true, true, true);
  sheet.setColumnWidths(1, 3, 200);

  // Apply conditional formatting rules (only if new or missing)
  if (isNewSheet || sheet.getConditionalFormatRules().length === 0) {
    applyChemistryConditionalFormatting(sheet, config.CHEMISTRY_CONFIG.THRESHOLDS);
  }

  // Update last-modified property for freshness checks
  const props = PropertiesService.getScriptProperties();
  props.setProperty('CHEMISTRY_LOOKUP_LAST_MODIFIED', new Date().toISOString());
}

/**
 * Sets up conditional formatting rules for the Chemistry Lookup sheet.
 */
function applyChemistryConditionalFormatting(sheet, thresholds) {
  const { POSITIVE_MIN, NEGATIVE_MAX } = thresholds;

  const rules = [];

  // Positive chemistry (green)
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(POSITIVE_MIN)
      .setBackground('#d9ead3')
      .setFontColor('#38761d')
      .setBold(true)
      .setRanges([sheet.getRange('C2:C')])
      .build()
  );

  // Negative chemistry (red)
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThanOrEqualTo(NEGATIVE_MAX)
      .setBackground('#f4cccc')
      .setFontColor('#cc0000')
      .setBold(true)
      .setRanges([sheet.getRange('C2:C')])
      .build()
  );

  // Neutral chemistry (gray)
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=AND(C2>${NEGATIVE_MAX},C2<${POSITIVE_MIN})`)
      .setBackground('#ffffff')
      .setFontColor('#666666')
      .setBold(true)
      .setRanges([sheet.getRange('C2:C')])
      .build()
  );

  sheet.setConditionalFormatRules(rules);
}

/**
 * Update JSON cache and sync freshness for LineupBuilder
 */
function updateChemistryDataJSON() {
  const config = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lookupSheet = ss.getSheetByName(config.SHEETS.CHEMISTRY_LOOKUP);
  if (!lookupSheet) throw new Error('Chemistry Lookup sheet not found');
  const lastRow = lookupSheet.getLastRow();
  if (lastRow < 2) return;

  const data = lookupSheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const playerSet = {};
  const pairs = [];

  data.forEach(([p1r, p2r, chemVal]) => {
    const p1 = String(p1r).trim();
    const p2 = String(p2r).trim();
    const chem = Math.round(chemVal);
    if (!p1 || !p2) return;
    playerSet[p1] = true;
    playerSet[p2] = true;
    pairs.push({ p1, p2, v: chem });
  });

  const players = Object.keys(playerSet).sort();
  const jsonData = {
    players,
    pairs,
    thresholds: {
      positive: config.CHEMISTRY_CONFIG.THRESHOLDS.POSITIVE_MIN,
      negative: config.CHEMISTRY_CONFIG.THRESHOLDS.NEGATIVE_MAX
    },
    timestamp: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };

  const props = PropertiesService.getScriptProperties();
  props.setProperty('CHEMISTRY_DATA', JSON.stringify(jsonData));
  props.setProperty('CHEMISTRY_DATA_TIMESTAMP', jsonData.timestamp);

  // --- Freshness sync for LineupBuilder ---
  let checksum = 0;
  data.forEach(([p1, p2, v]) => {
    const s = (String(p1) + String(p2));
    for (let i = 0; i < s.length; i++) checksum += s.charCodeAt(i);
    checksum += Number(v);
  });

  props.setProperty('CHEMISTRY_LOOKUP_TIMESTAMP', jsonData.timestamp);
  props.setProperty('CHEMISTRY_LOOKUP_ROWCOUNT', lastRow);
  props.setProperty('CHEMISTRY_LOOKUP_CHECKSUM', checksum);
}
