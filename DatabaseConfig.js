// ===== CONFIGURATION =====
// Purpose: Central configuration for all CLB Tools (sheet names, column mappings, thresholds, debug settings)
// Dependencies: None (foundational config file)
// Entry Point(s): getConfig()

var CONFIG = {
  // Sheet Names
  SHEETS: {
    ATTRIBUTES: 'Advanced Attributes',
    CHEMISTRY: 'Player Chemistry Matrix',
    MII_COLOR_CHEMISTRY: 'Mii Chemistry Matrix',
    CHEMISTRY_LOOKUP: 'Chemistry Lookup'
  },
  
  // Attribute Sheet Configuration
  ATTRIBUTES_CONFIG: {
    // Column mappings (0-indexed, for array access)
    COLUMNS: {
      NAME: 0,                // Column A (1) - Character name
      CHARACTER_CLASS: 1,     // Column B (2) - Preset index 2
      CAPTAIN: 2,             // Column C (3) - Preset index 5
      MII: 3,                 // Column D (4) - Manual entry (not from preset)
      MII_COLOR: 4,           // Column E (5) - Manual entry (not from preset)
      ARM_SIDE: 5,            // Column F (6) - Preset index 0 (pitching arm)
      BATTING_SIDE: 6,        // Column G (7) - Preset index 1
      WEIGHT: 7,              // Column H (8) - Preset index 4
      ABILITY: 8,             // Column I (9) - Combined: Preset index 8 OR 9
      PITCHING_OVERALL: 9,    // Column J (10) - Preset index 18
      BATTING_OVERALL: 10,    // Column K (11) - Preset index 19
      FIELDING_OVERALL: 11,   // Column L (12) - Preset index 20
      SPEED_OVERALL: 12,      // Column M (13) - Preset index 21
      STAR_SWING: 13,         // Column N (14) - Preset index 7
      HIT_CURVE: 14,          // Column O (15) - Preset index 27
      HITTING_TRAJECTORY: 15, // Column P (16) - Preset index 26
      SLAP_HIT_CONTACT: 16,   // Column Q (17) - Preset index 10
      CHARGE_HIT_CONTACT: 17, // Column R (18) - Preset index 11
      SLAP_HIT_POWER: 18,     // Column S (19) - Preset index 12
      CHARGE_HIT_POWER: 19,   // Column T (20) - Preset index 13
      SPEED: 20,              // Column U (21) - Preset index 15
      BUNTING: 21,            // Column V (22) - Preset index 14
      FIELDING: 22,           // Column W (23) - Preset index 17
      THROWING_SPEED: 23,     // Column X (24) - Preset index 16
      PRE_CHARGE: 24,         // Column Y (25) - Custom field (not from preset)
      STAR_PITCH: 25,         // Column Z (26) - Combined: Preset index 6 + 29
      FASTBALL_SPEED: 26,     // Column AA (27) - Preset index 23
      CURVEBALL_SPEED: 27,    // Column AB (28) - Preset index 22
      CURVE: 28,              // Column AC (29) - Preset index 24
      STAMINA: 29             // Column AD (30) - Preset index 28
    },
    FIRST_DATA_ROW: 2,      // First row of data (after headers)
    TOTAL_COLUMNS: 30       // Total columns to read (A through AD)
  },
  
  // Chemistry Sheet Configuration
  CHEMISTRY_CONFIG: {
    // Column mappings for Chemistry Lookup sheet (0-indexed, for array access)
    COLUMNS: {
      PLAYER_1: 0,          // Column A (1)
      PLAYER_2: 1,          // Column B (2)
      CHEMISTRY_VALUE: 2    // Column C (3)
    },
    FIRST_DATA_ROW: 2,      // First row with character names in column A
    FIRST_DATA_COLUMN: 2,   // First column with chemistry values (column B)
    HEADER_ROW: 1,          // Row with character names across the top
    NAME_COLUMN: 1,         // Column with character names (column A)

    // Chemistry value thresholds
    THRESHOLDS: {
      POSITIVE_MIN: 100,    // Values >= 100 are positive chemistry
      NEGATIVE_MAX: -100    // Values <= -100 are negative chemistry
    }
  },

  // Debug Configuration
  DEBUG: {
    ENABLE_LOGGING: true
  },
  
  // Tool Display Names
  TOOL_NAMES: {
    ATTRIBUTE_COMPARISON: 'Player Attribute Comparison',
    CHEMISTRY_TOOL: 'Player Chemistry Tool',
    ADMIN_COMPARISON: 'Admin: Comparison with Averages'
  },
  
  // Menu Configuration
  MENU: {
    NAME: '🎮 CLB Tools',
    ICONS: {
      ATTRIBUTES: '⚾',
      CHEMISTRY: '⚡',
      ADMIN: '🔐',
      ABOUT: '📋'
    }
  }
};

// Helper function to get config values
function getConfig() {
  return CONFIG;

}
