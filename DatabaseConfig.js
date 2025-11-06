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
      NAME: 0,                // Column A (1)
      CHARACTER_CLASS: 1,     // Column B (2)
      ARM_SIDE: 2,            // Column C (3)
      BATTING_SIDE: 3,        // Column D (4)
      WEIGHT: 4,              // Column E (5)
      ABILITY: 5,             // Column F (6)
      PITCHING_OVERALL: 6,    // Column G (7)
      BATTING_OVERALL: 7,     // Column H (8)
      FIELDING_OVERALL: 8,    // Column I (9)
      SPEED_OVERALL: 9,       // Column J (10)
      HITTING_TRAJECTORY: 10, // Column K (11)
      SLAP_HIT_CONTACT: 11,   // Column L (12)
      CHARGE_HIT_CONTACT: 12, // Column M (13)
      SLAP_HIT_POWER: 13,     // Column N (14)
      CHARGE_HIT_POWER: 14,   // Column O (15)
      SPEED: 15,              // Column P (16)
      BUNTING: 16,            // Column Q (17)
      THROWING_SPEED: 17,     // Column R (18)
      FIELDING: 18,           // Column S (19)
      CURVEBALL_SPEED: 19,    // Column T (20)
      FASTBALL_SPEED: 20,     // Column U (21)
      CURVE: 21,              // Column V (22)
      STAMINA: 22             // Column W (23)
    },
    FIRST_DATA_ROW: 2,      // First row of data (after headers)
    TOTAL_COLUMNS: 23       // Total columns to read (A through W)
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
