# Admin Stat Editor Implementation Guide

## Overview
This document outlines the implementation plan for adding **inline editing capabilities** to the Admin: Comparison with Averages tool. This feature would allow admins to balance characters directly while viewing league average comparisons.

**Status:** Future consideration - Not yet implemented
**Priority:** Nice-to-have (balancing quality-of-life improvement)
**Estimated Effort:** 4-6 hours

---

## Motivation

### Current State
The Admin tool currently provides read-only comparison of player stats against league averages. To make changes, admins must:
1. View stats in comparison tool
2. Note which stats to change
3. Close comparison tool
4. Open Python tool or manually edit sheet
5. Make changes
6. Re-open comparison tool to verify

### Proposed State
With inline editing, admins can:
1. View stats in comparison tool
2. Edit stats directly in the same interface
3. See real-time validation feedback
4. Save changes immediately
5. Continue comparing/editing

### Primary Use Case
**Character balancing workflow:** When balancing a character's stats, seeing how they compare to league averages in real-time helps make informed adjustments. For example:
- "This character's Speed is 20 points below average - let's bump it to 45"
- "Their Charge Hit Power is way above average - reduce to match the league standard"

---

## Technical Requirements

### 1. UI Components

#### Convert Read-Only Displays to Inputs
Currently stats are displayed as text. They need to become:

**Numeric Stats** → `<input type="number">` with validation
- Visual styling to distinguish from averages
- Real-time validation (red border if invalid)
- Increment/decrement buttons for ease

**Dropdown Stats** → `<select>` elements
- Character Class, Star Swing, Star Pitch, Abilities, Arm Sides
- Trajectory, Hit Curve, Pre-Charge Pitching
- Captain, Mii (Yes/No)

**Calculated Fields** (read-only)
- Overall stats can optionally be recalculated based on component stats
- Or allow manual override

#### Action Buttons
```html
<div class="edit-actions">
  <button onclick="saveChanges()">Save Changes</button>
  <button onclick="resetFields()">Reset to Original</button>
  <button onclick="cancelEdit()">Cancel</button>
</div>
```

#### Visual State Indicators
- **Modified fields:** Yellow/blue highlight
- **Invalid fields:** Red border with error message
- **Saved successfully:** Green flash animation
- **Unsaved changes warning:** On close/navigate away

---

### 2. Validation Rules

All validation rules match the Python tool's specifications:

#### Numeric Ranges

| Stat | Min | Max | Notes |
|------|-----|-----|-------|
| Weight | 0 | 4 | Integer only |
| Curve | 0 | 200 | |
| Curveball Speed | 70 | 200 | Min is 70, not 0 |
| Fastball Speed | 70 | 200 | Min is 70, not 0 |
| Stamina | 0 | 100 | |
| Slap Hit Contact | 10 | 200 | Min is 10, not 0 |
| Charge Hit Contact | 10 | 200 | Min is 10, not 0 |
| Slap Hit Power | 0 | 150 | |
| Charge Hit Power | 0 | 150 | |
| Bunting | 0 | 200 | |
| Speed | 0 | 200 | |
| Throwing Speed | 0 | 200 | |
| Fielding | 0 | 200 | |
| Pitching Overall | 0 | 10 | |
| Batting Overall | 0 | 10 | |
| Fielding Overall | 0 | 10 | |
| Speed Overall | 0 | 10 | |

#### Dropdown Fields

| Field | Options | Source |
|-------|---------|--------|
| Arm Side | Right, Left | `ARM_SIDES` |
| Batting Side | Right, Left | `ARM_SIDES` |
| Character Class | 5 classes | `CHARACTER_CLASSES` config |
| Star Swing | 18 types | `STAR_SWINGS` array |
| Star Pitch | Varies | `STAR_PITCHES` array |
| Star Pitch Type | None, Breaking Ball, Fastball, Change-Up | `STAR_PITCH_TYPES` |
| Ability (split) | Fielding + Baserunning | Two separate dropdowns |
| Hitting Trajectory | Dynamic from config | `getTrajectoryTypes()` |
| Hit Curve | Enabled, Disabled | `HIT_CURVE_TYPES` |
| Captain | Yes, No | Boolean |
| Pre-Charge Pitching | Enabled, Disabled | Custom field (same as Hit Curve) |
| Mii | Yes, No | Custom field (boolean) |
| Mii Color | Color names | Custom field (only for Mii characters) |

#### Special Field Logic

**Mii Color Field:**
- Only enabled when Mii = "Yes"
- List of valid colors should be pulled from config or hardcoded list
- Consider using a color picker or dropdown with color swatches

**Ability Field:**
- Currently displayed as combined "Fielding / Baserunning"
- For editing, split into two separate dropdowns:
  - Fielding Ability: From `FIELDING_ABILITIES` list
  - Baserunning Ability: From `BASERUNNING_ABILITIES` list
- On save, combine back into display format

**Star Pitch Field:**
- Currently displayed as "Pitch Name (Type)"
- For editing, split into two dropdowns:
  - Star Pitch: From `STAR_PITCHES` list
  - Star Pitch Type: None/Breaking Ball/Fastball/Change-Up
- On save, combine back into display format

---

### 3. Implementation Breakdown

#### Phase 1: UI Structure (1-2 hours)

**File to modify:** `DatabaseAttributesAdmin.html`

1. Add edit mode toggle:
```javascript
let editMode = false;
let originalData = {};
let modifiedFields = {};

function enableEditMode() {
  editMode = true;
  convertDisplaysToInputs();
  showEditActions();
}

function disableEditMode() {
  editMode = false;
  convertInputsToDisplays();
  hideEditActions();
}
```

2. Create input field generation:
```javascript
function createNumberInput(value, min, max, field) {
  return `<input
    type="number"
    class="stat-input"
    value="${value}"
    min="${min}"
    max="${max}"
    data-field="${field}"
    onchange="validateAndMark(this)"
  />`;
}

function createDropdownInput(value, options, field) {
  let html = `<select class="stat-input" data-field="${field}" onchange="validateAndMark(this)">`;
  options.forEach(opt => {
    html += `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`;
  });
  html += `</select>`;
  return html;
}
```

3. Add validation styling:
```css
.stat-input.invalid {
  border: 2px solid #ea4335;
  background: #fce8e6;
}

.stat-input.modified {
  border: 2px solid #1a73e8;
  background: #e8f0fe;
}

.stat-input.valid {
  border: 2px solid #34a853;
}

.validation-error {
  color: #ea4335;
  font-size: 11px;
  display: block;
  margin-top: 2px;
}
```

#### Phase 2: Client-Side Validation (1-2 hours)

1. Create validation function:
```javascript
const VALIDATION_RULES = {
  'Weight': { min: 0, max: 4, type: 'number' },
  'Curve': { min: 0, max: 200, type: 'number' },
  'Curveball Speed': { min: 70, max: 200, type: 'number' },
  'Fastball Speed': { min: 70, max: 200, type: 'number' },
  'Stamina': { min: 0, max: 100, type: 'number' },
  'Slap Hit Contact': { min: 10, max: 200, type: 'number' },
  'Charge Hit Contact': { min: 10, max: 200, type: 'number' },
  'Slap Hit Power': { min: 0, max: 150, type: 'number' },
  'Charge Hit Power': { min: 0, max: 150, type: 'number' },
  'Bunting': { min: 0, max: 200, type: 'number' },
  'Speed': { min: 0, max: 200, type: 'number' },
  'Throwing Speed': { min: 0, max: 200, type: 'number' },
  'Fielding': { min: 0, max: 200, type: 'number' },
  'Pitching Overall': { min: 0, max: 10, type: 'number' },
  'Batting Overall': { min: 0, max: 10, type: 'number' },
  'Fielding Overall': { min: 0, max: 10, type: 'number' },
  'Speed Overall': { min: 0, max: 10, type: 'number' },
  // Dropdowns validated by option list
  'Captain': { options: ['Yes', 'No'], type: 'dropdown' },
  'Hit Curve': { options: ['Enabled', 'Disabled'], type: 'dropdown' },
  'Pre-Charge Pitching': { options: ['Enabled', 'Disabled'], type: 'dropdown' },
  'Mii': { options: ['Yes', 'No'], type: 'dropdown' },
  // ... other dropdowns
};

function validateField(field, value) {
  const rule = VALIDATION_RULES[field];

  if (rule.type === 'number') {
    const num = Number(value);
    if (isNaN(num)) return { valid: false, error: 'Must be a number' };
    if (num < rule.min) return { valid: false, error: `Min: ${rule.min}` };
    if (num > rule.max) return { valid: false, error: `Max: ${rule.max}` };
    return { valid: true };
  }

  if (rule.type === 'dropdown') {
    if (!rule.options.includes(value)) {
      return { valid: false, error: 'Invalid option' };
    }
    return { valid: true };
  }

  return { valid: true };
}

function validateAndMark(input) {
  const field = input.dataset.field;
  const value = input.value;
  const result = validateField(field, value);

  input.classList.remove('valid', 'invalid');

  if (result.valid) {
    input.classList.add('valid');
    if (value !== originalData[field]) {
      input.classList.add('modified');
      modifiedFields[field] = value;
    }
    // Remove error message if exists
    const errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('validation-error')) {
      errorDiv.remove();
    }
  } else {
    input.classList.add('invalid');
    // Add/update error message
    let errorDiv = input.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('validation-error')) {
      errorDiv = document.createElement('span');
      errorDiv.className = 'validation-error';
      input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }
    errorDiv.textContent = result.error;
  }
}

function validateAllFields() {
  const inputs = document.querySelectorAll('.stat-input');
  let allValid = true;

  inputs.forEach(input => {
    validateAndMark(input);
    if (input.classList.contains('invalid')) {
      allValid = false;
    }
  });

  return allValid;
}
```

2. Add special field logic:
```javascript
function updateMiiColorField() {
  const miiValue = document.querySelector('[data-field="Mii"]').value;
  const miiColorInput = document.querySelector('[data-field="Mii Color"]');

  if (miiValue === 'Yes') {
    miiColorInput.disabled = false;
  } else {
    miiColorInput.disabled = true;
    miiColorInput.value = '';
  }
}
```

#### Phase 3: Server-Side Save (1-2 hours)

**File to modify:** `DatabaseStatsPresetImport.js` (or create new `DatabaseAttributesEditor.js`)

1. Create save function:
```javascript
/**
 * Save edited attributes for a single character
 * @param {string} characterName - Character to update
 * @param {Object} updates - Object with field names and new values
 * @returns {Object} Success status and message
 */
function saveCharacterAttributes(characterName, updates) {
  try {
    const config = getConfig();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const attributesSheet = ss.getSheetByName(config.SHEETS.ATTRIBUTES);

    if (!attributesSheet) {
      throw new Error('Attributes sheet not found');
    }

    // Find character row
    const data = attributesSheet.getRange(
      config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW,
      1,
      attributesSheet.getLastRow() - config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW + 1,
      config.ATTRIBUTES_CONFIG.TOTAL_COLUMNS
    ).getValues();

    const cols = config.ATTRIBUTES_CONFIG.COLUMNS;
    let characterRowIndex = -1;

    for (let i = 0; i < data.length; i++) {
      if (data[i][cols.NAME] === characterName) {
        characterRowIndex = i;
        break;
      }
    }

    if (characterRowIndex === -1) {
      throw new Error('Character not found: ' + characterName);
    }

    const actualRow = config.ATTRIBUTES_CONFIG.FIRST_DATA_ROW + characterRowIndex;

    // Apply updates
    const updateLog = [];

    Object.keys(updates).forEach(field => {
      const colIndex = cols[field];
      if (colIndex === undefined) {
        throw new Error('Unknown field: ' + field);
      }

      const oldValue = data[characterRowIndex][colIndex];
      const newValue = updates[field];

      // Write to sheet (column is 1-indexed)
      attributesSheet.getRange(actualRow, colIndex + 1).setValue(newValue);

      updateLog.push({
        field: field,
        oldValue: oldValue,
        newValue: newValue
      });
    });

    // Optional: Log changes to a separate sheet
    logAttributeChanges(characterName, updateLog);

    return {
      success: true,
      message: `Updated ${updateLog.length} fields for ${characterName}`,
      updates: updateLog
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Optional: Log attribute changes for tracking
 */
function logAttributeChanges(characterName, changes) {
  // Similar to Chemistry Change Log
  // Create "Attribute Change Log" sheet if desired
  // Log timestamp, character, field, old value, new value
}
```

2. Add client-side save handler:
```javascript
function saveChanges() {
  // Validate all fields first
  if (!validateAllFields()) {
    showDialog('Validation Error', 'Please fix invalid fields before saving.');
    return;
  }

  if (Object.keys(modifiedFields).length === 0) {
    showDialog('No Changes', 'No fields have been modified.');
    return;
  }

  // Show loading state
  document.getElementById('saveBtn').disabled = true;
  document.getElementById('saveBtn').textContent = 'Saving...';

  const characterName = document.getElementById('player1').value;

  google.script.run
    .withSuccessHandler(onSaveSuccess)
    .withFailureHandler(onSaveError)
    .saveCharacterAttributes(characterName, modifiedFields);
}

function onSaveSuccess(result) {
  if (result.success) {
    showDialog('Success', result.message);

    // Update original data to reflect saved state
    Object.keys(modifiedFields).forEach(field => {
      originalData[field] = modifiedFields[field];
    });

    // Clear modified fields
    modifiedFields = {};

    // Remove modified styling
    document.querySelectorAll('.stat-input.modified').forEach(input => {
      input.classList.remove('modified');
    });

    // Re-enable save button
    document.getElementById('saveBtn').disabled = false;
    document.getElementById('saveBtn').textContent = 'Save Changes';
  } else {
    showDialog('Save Failed', result.message);
    document.getElementById('saveBtn').disabled = false;
    document.getElementById('saveBtn').textContent = 'Save Changes';
  }
}

function onSaveError(error) {
  showDialog('Error', 'Failed to save: ' + error.message);
  document.getElementById('saveBtn').disabled = false;
  document.getElementById('saveBtn').textContent = 'Save Changes';
}
```

#### Phase 4: Config Integration (30 minutes)

1. Load Mii data from config (if applicable):
```javascript
function getMiiCharacters() {
  // If config has Mii character list, load it
  // Otherwise return hardcoded list
  return ['Mii (Red)', 'Mii (Blue)', 'Mii (Green)', /* ... */];
}

function getMiiColors() {
  return ['Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', /* ... */];
}
```

2. Load trajectory names dynamically:
```javascript
function loadTrajectoryOptions() {
  google.script.run
    .withSuccessHandler(function(types) {
      const select = document.querySelector('[data-field="Hitting Trajectory"]');
      select.innerHTML = '';
      types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
      });
    })
    .getTrajectoryTypes();
}
```

---

## UX Considerations

### Edit Mode Toggle
Should editing be:
- **Always on:** Fields are always editable (simpler, but risky)
- **Toggle mode:** "Enable Editing" button switches to edit mode (recommended)
- **Per-field:** Click a field to edit it (most complex)

**Recommendation:** Toggle mode with clear visual distinction

### Single vs. Multiple Player Editing
- **Single player mode** (recommended): Edit one player at a time
  - Simpler implementation
  - Less risk of errors
  - Clear undo/reset
- **Multi-player mode**: Edit multiple players in comparison view
  - More complex
  - Would need per-player save/reset
  - Higher risk of accidental changes

### Unsaved Changes Warning
Implement warning dialog if user tries to:
- Close the tool with unsaved changes
- Switch to a different player with unsaved changes
- Navigate away from the page

```javascript
window.onbeforeunload = function() {
  if (Object.keys(modifiedFields).length > 0) {
    return 'You have unsaved changes. Are you sure you want to leave?';
  }
};
```

---

## Testing Checklist

### Validation Testing
- [ ] Each numeric field rejects values outside its range
- [ ] Numeric fields reject non-numeric input
- [ ] Special minimums (e.g., Curveball Speed ≥ 70) work correctly
- [ ] Dropdown fields only accept valid options
- [ ] Mii Color disables when Mii is "No"
- [ ] Save button disables when validation fails

### Save Testing
- [ ] Saved values appear correctly in Attributes sheet
- [ ] Row lookup works for all character names
- [ ] Variant character names work (e.g., "Toad (Red)")
- [ ] Save failure shows appropriate error message
- [ ] Multiple saves in one session work correctly

### Edge Cases
- [ ] Empty/null values handled appropriately
- [ ] Very long character names don't break layout
- [ ] Special characters in names handled correctly
- [ ] Concurrent edits (if multiple admins) handled gracefully
- [ ] Sheet structure changes don't break editor

### UX Testing
- [ ] Modified fields visually distinct from unmodified
- [ ] Invalid fields clearly indicated with helpful error messages
- [ ] Save confirmation message appears
- [ ] Reset button restores original values correctly
- [ ] Unsaved changes warning works on close/navigate

---

## Future Enhancements

Once basic editing is implemented, consider:

1. **Bulk Edit Mode:** Edit multiple characters at once
2. **Formula Support:** Allow expressions like "Average + 10" or "Max * 1.2"
3. **Preset Templates:** Save common stat distributions as templates
4. **Change History:** View edit history for a character
5. **Undo/Redo:** Multiple levels of undo
6. **Compare Before/After:** Show original vs. modified side-by-side
7. **Export Changes:** Export a diff/changelog of modifications
8. **Smart Suggestions:** "This character's Speed is 30 below average - consider increasing"

---

## Notes

- **Code Location:** All code should go in `DatabaseAttributesAdmin.html` and related `.js` files
- **Dependencies:** Requires `DatabaseConfig.js` and `DatabaseStatsPresetImport.js`
- **Permissions:** Ensure admin users have edit permissions on the Attributes sheet
- **Performance:** For 101 characters, save operations should complete in <2 seconds
- **Backup:** Consider automatic backup before applying bulk changes

---

## Implementation Timeline

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| 1 | UI Structure | 1-2 hours |
| 2 | Client-side Validation | 1-2 hours |
| 3 | Server-side Save | 1-2 hours |
| 4 | Config Integration | 30 minutes |
| 5 | Testing & Polish | 30 minutes |
| **Total** | | **4-6 hours** |

---

**Document Created:** 2025-11-07
**Status:** Planning/Design Phase
**Next Steps:** Review with team, prioritize against other features, schedule implementation
