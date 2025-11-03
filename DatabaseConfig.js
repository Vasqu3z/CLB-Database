// ===== CONFIGURATION FILE =====
// Customize sheet names and data sources for all CLB Tools

var CONFIG = {
  // Sheet Names
  SHEETS: {
    ATTRIBUTES: 'Advanced Attributes',
    CHEMISTRY: 'Chemistry Matrix A-Z',
    CHEMISTRY_LOOKUP: 'Chemistry Lookup',
    MII_COLOR_CHEMISTRY: 'Mii Color Chemistry'
  },
  
  // Attribute Sheet Configuration
  ATTRIBUTES_CONFIG: {
    // Column mappings (1-indexed, as used by Google Sheets)
    COLUMNS: {
      NAME: 1,                // Column A
      CHARACTER_CLASS: 2,     // Column B
      ARM_SIDE: 3,            // Column C
      BATTING_SIDE: 4,        // Column D
      WEIGHT: 5,              // Column E
      ABILITY: 6,             // Column F
      PITCHING_OVERALL: 7,    // Column G
      BATTING_OVERALL: 8,     // Column H
      FIELDING_OVERALL: 9,    // Column I
      SPEED_OVERALL: 10,      // Column J
      HITTING_TRAJECTORY: 11, // Column K
      SLAP_HIT_CONTACT: 12,   // Column L
      CHARGE_HIT_CONTACT: 13, // Column M
      SLAP_HIT_POWER: 14,     // Column N
      CHARGE_HIT_POWER: 15,   // Column O
      SPEED: 16,              // Column P
      BUNTING: 17,            // Column Q
      THROWING_SPEED: 18,     // Column R
      FIELDING: 19,           // Column S
      CURVEBALL_SPEED: 20,    // Column T
      FASTBALL_SPEED: 21,     // Column U
      CURVE: 22,              // Column V
      STAMINA: 23             // Column W
    },
    FIRST_DATA_ROW: 2,      // First row of data (after headers)
    TOTAL_COLUMNS: 23       // Total columns to read (A through W)
  },
  
  // Chemistry Sheet Configuration
  CHEMISTRY_CONFIG: {
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