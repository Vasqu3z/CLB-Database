This document serves as the official Standard Operating Procedure (SOP) for all future development, additions, or modifications to the CLB project script suites. Adherence to these principles is mandatory to ensure the project remains performant, maintainable, and robust.

### The Four "Gold Standard" Principles

All code must be written in accordance with these four core principles. A feature is not "complete" until it complies with all four.

1.  **P1 (Performance): Read Once, Write Once.**

      * Spreadsheet I/O (Input/Output) is the primary bottleneck. All interaction with `SpreadsheetApp` must be batched.
      * **You must not** place `.getValue()`, `.setValue()`, `.getValues()`, `.setValues()`, or `.setFormula()` calls inside a loop.

2.  **P2 (Configurability): No Magic Numbers.**

      * All sheet names, row/column indices, ranges, and logical thresholds *must* be defined in a `Config.js` file.
      * **All column indices in config files must be 0-based** to eliminate all `[col - 1]` magic offsets in the code.

3.  **P3 (Data Flow): In-Memory Orchestration.**

      * Data must be read into memory, processed in memory, and written back.
      * **"Stats Engine" Model:** Functions must receive the in-memory `gameData` object and *must not* re-read data from the spreadsheet if it already exists in memory.
      * **"Web App" Model:** Server functions must load data from the *fastest available source* (e.g., `CacheService`) and send *only* the necessary data to the client, which handles all rendering.

4.  **P4 (Commenting & Style): Professional & Structural.**

      * Code must be clean, maintainable, and consistently styled.
      * Comments must provide structural guidance (JSDoc, section headers) and explain *why* complex logic exists, not *what* obvious code does.

-----

### Section I: P2 - Configuration (The Foundation)

All development *starts* with the config file. If a value is not in the config, it is a "magic number" and a violation.

#### Rule 1.1: The 0-Based Index Mandate

This is the most critical rule for code consistency. All column definitions in config files *must* use **0-based indices** for array access.

> **Violation (Before):**
>
> ```javascript
> // In Config.js
> ATTRIBUTES_CONFIG: {
>   COLUMNS: {
>     NAME: 1,                // Column A
>     CHARACTER_CLASS: 2,     // Column B
>   }
> }
> // In .gs File
> var name = row[COLS.NAME - 1]; // Forced to use magic offset
> ```
>
> **"Gold Standard" (After):**
>
> ```javascript
> // In Config.js
> ATTRIBUTES_CONFIG: {
>   COLUMNS: {
>     NAME: 0,                // Column A (1)
>     CHARACTER_CLASS: 1,     // Column B (2)
>   }
> }
> // In .gs File
> var name = row[COLS.NAME]; // Clean, direct, no offset
> ```

#### Rule 1.2: All I/O Must Be Config-Driven

All ranges, sheet names, and even single cells must be defined in the config.

> **Violation (Before):**
>
> ```javascript
> var batchData = sheet.getRange("B3:R50").getValues();
> var awayTeam = String(batchData[0][0]).trim(); // Magic offset
> ```
>
> **"Gold Standard" (After):**
>
> ```javascript
> // In Config.js
> CONFIG.BOX_SCORE_TEAM_INFO = "B3:F4";
> ```

> // In .gs File
> var teamInfo = sheet.getRange(CONFIG.BOX\_SCORE\_TEAM\_INFO).getValues();
> var awayTeam = String(teamInfo[0][0]).trim(); // Clear, non-magic offset
>
> ```
> ```

-----

### Section II: P1 & P3 - Performance & Data Flow

You must use one of these two architectures, depending on the context.

#### Architecture A: The "Stats Engine" Model

*(For processing game data and updating stats sheets, e.g., `LeagueCore.js`)*

**Rule 2.1: Use the `gameData` Object.**
The `updateAll` function orchestrates all data. It calls `processAllGameSheetsOnce()` to create the master `gameData` object. This object *must* be passed to all subsequent update functions (e.g., `updateAllPlayerStatsFromCache(gameData.playerStats)`).

**Rule 2.2: No Re-Reading Data.**
Functions with `...FromCache` in their name *must not* perform their own I/O to get data that is already in the `gameData` object.

> **Violation (e.g., `LeagueTeamSheets.js`):**
>
> ```javascript
> function updateTeamSheetsFromCache(teamStatsWithH2H, ...) {
>   // VIOLATION: This data is already in memory!
>   var hittingStatsSheet = ss.getSheetByName(CONFIG.HITTING_STATS_SHEET);
>   var hittingData = getSheetDataWithHeaders(hittingStatsSheet);
>   var teamHittingData = filterAndSortTeamData(hittingData.rows, teamName, ...);
> }
> ```
>
> **"Gold Standard" (After):**
>
> ```javascript
> // Refactor updateAll to pass the necessary data
> updateTeamSheetsFromCache(gameData.playerStats, playerTeamMap, ...);
> ```

> function updateTeamSheetsFromCache(playerStats, playerTeamMap, ...) {
> // Gold Standard: Use the in-memory object
> var teamHittingData = buildTeamStatsFromMemory(playerStats, playerTeamMap, teamName);
> }
>
> ```
> ```

**Rule 2.3: Batch All I/O.**
Never place `.setValues()` or `.setFormulas()` inside a loop. Build 2D arrays in memory first, then write them all at once *after* the loop.

> **Violation (e.g., `ScoreTriggers.js`):**
>
> ```javascript
> for (var name in playerStats) {
>   // VIOLATION: .setValues() is inside a loop
>   sheet.getRange(row, ...).setValues(pitchingArray);
>   sheet.getRange(hittingRow, ...).setValues(hittingArray);
> }
> ```
>
> **"Gold Standard" (After):**
>
> ```javascript
> // 1. Create empty batch arrays BEFORE the loop
> var awayPitchingBatch = createEmptyBatch(...);
> var awayHittingBatch = createEmptyBatch(...);
> ```

> // 2. Populate the arrays INSIDE the loop
> for (var name in playerStats) {
> // ...
> awayPitchingBatch[batchIndex] = [ip, p.BF, p.H, ...];
> awayHittingBatch[batchIndex] = [h.AB, h.H, h.HR, ...];
> }

> // 3. Write the batches ONCE, AFTER the loop
> sheet.getRange(...).setValues(awayPitchingBatch);
> sheet.getRange(...).setValues(awayHittingBatch);
>
> ```
> ```

#### Architecture B: The "Web App" Model

*(For all user-facing HTML dialogs, e.g., `Database` suite)*

**Rule 2.4: Cache-First Data Retrieval.**
All server-side functions called from HTML (e.g., `getChemistryData`, `getAttributeData`) *must* check for cached data first.

> **"Gold Standard" (e.g., `DatabaseLineups.js`):**
>
> ```javascript
> function getChemistryData() {
>   var cache = CacheService.getScriptCache();
>   var cached = cache.get(config.CACHE_CONFIG.KEYS.CHEMISTRY);
> ```

> // 1. Return from cache if available
> if (cached) {
> return JSON.parse(cached);
> }

> // 2. On cache miss, read from sheet (using P1 batch read)
> var lookupData = lookupSheet.getRange(...).getValues();
>
> // 3. Process data in memory
> var result = { ... };

> // 4. Store in cache before returning
> cache.put(config.CACHE\_CONFIG.KEYS.CHEMISTRY, JSON.stringify(result), ...);
> return result;
> }
>
> ```
> ```

**Rule 2.5: Automatic Cache Invalidation.**
Use the `onEdit(e)` trigger to *automatically* clear the relevant cache key when a "source of truth" sheet (e.g., `Advanced Attributes`) is modified. This provides the performance of caching with the accuracy of live data.

> **"Gold Standard" (e.g., `DatabaseMenu.js`):**
>
> ```javascript
> function onEdit(e) {
>   // ...
>   var editedSheet = e.range.getSheet();
> ```

> // Check if the source sheet was edited
> if (editedSheet.getName() === config.SHEETS.ATTRIBUTES) {
> // Invalidate the cache
> CacheService.getScriptCache().remove(config.CACHE\_CONFIG.KEYS.ATTRIBUTES);
> }
> }
>
> ```
> ```

-----

### Section III: P4 - Commenting & Style

#### Rule 3.1: File Headers

Every `.js` file must begin with this 4-line header.

```javascript
// ===== {MODULE_NAME_IN_CAPS} =====
// Purpose: {Brief, one-line description of the file's responsibility.}
// Dependencies: {Key config files or modules, e.g., DatabaseConfig.js}
// Entry Point(s): {Primary function(s) called from other modules or web apps}
```

#### Rule 3.2: JSDoc Headers

All non-trivial functions must have a JSDoc header.

```javascript
/**
 * Gets all stats for a list of requested players. Reads all stat sheets ONCE.
 * @param {Array<string>} playerNames - A list of player names to find.
 * @returns {Array<object>} An array of player stat objects.
 */
function getPlayerStats(playerNames) { ... }
```

#### Rule 3.3: Comment Cleanup

Maintain a professional, uncluttered codebase.

  * **REMOVE** all "Captain Obvious" comments (e.g., `// Loop through players`, `// Increment i`).
  * **REMOVE** all deprecated/legacy comments (e.g., `// OLD: Legacy function...`).
  * **REMOVE** all conversational notes (e.g., `// This function is now just a wrapper...`).

#### Rule 3.4: Standardized Logging

All logging must be conditional and use the native `Logger.log()`.

  * **In Config.js:** `DEBUG: { ENABLE_LOGGING: true }`
  * **In .gs File:**
    ```javascript
    if (CONFIG.DEBUG.ENABLE_LOGGING) {
      Logger.log("ERROR [Module]: Message (Entity: " + entity + ")");
    }
    ```

#### Rule 3.5: Naming Conventions

Use descriptive variable names.

  * **Violation:** `for (var g = 0; g < gameSheets.length; g++) { ... }`
  * **"Gold Standard":** `for (var gameIndex = 0; gameIndex < gameSheets.length; gameIndex++) { ... }`