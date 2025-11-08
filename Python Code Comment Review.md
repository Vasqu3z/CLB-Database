# Mario Super Sluggers Stat Editor - Code Comment Review (P4)

## Overview
This document identifies areas in the Python code that need improved documentation, clearer comments, or better organization to improve maintainability.

---

## Executive Summary

**Total Lines:** 3,373
**Current State:** Minimal documentation, mostly uncommented complex logic
**Priority Issues:** 67 high-priority items, 43 medium-priority items

### Key Issues:
1. No file-level docstring explaining purpose and usage
2. No function docstrings (0% coverage)
3. Complex algorithms lack inline comments
4. Magic numbers throughout code
5. Variable names sometimes unclear
6. GUI setup code lacks section organization
7. Clipboard fix recently added but needs better explanation

---

## High Priority Issues

### 1. File Header Documentation
**Location:** Lines 1-11
**Issue:** Missing file-level docstring

**Current:**
```python
import tkinter as tk
from tkinter import ttk
from random import random,randint
from numpy import random as nprandom
from functools import partial
from tkinter import filedialog
import tkinter.messagebox as messagebox
import re
import os

#Big Lists
```

**Suggested Addition:**
```python
"""
Mario Super Sluggers Stat Editor

A comprehensive character stat and chemistry editor for Mario Super Sluggers (Wii).
Allows editing of:
- Character stats (pitching, batting, fielding, speed)
- Chemistry relationships between characters
- Hit trajectory data
- Generates Gecko codes for patching the game

Features:
- Manual stat editing
- Randomized stat generation with constraints
- Chemistry matrix editor with global operations
- Trajectory height curve editor
- Stats preset import/export (.txt format, 228 lines)
- Save/Load configuration (.csv format)
- Gecko code generation for modified characters

Usage:
1. Edit stats manually or randomize with constraints
2. Modify chemistry relationships
3. Adjust trajectory curves
4. Generate Gecko code or export stats preset
5. Save configuration for later reuse

Author: [Your Name]
Version: [Version Number]
"""

import tkinter as tk
# ... rest of imports
```

---

### 2. Global Variable Documentation
**Location:** Lines 12-81
**Issue:** Large data structures lack explanation

**Suggested Additions:**

```python
# ===== CHARACTER DATA =====

# Full list of all 124 characters in the game (internal order)
# Used for stat array indexing and display
charList = ["Mario", "Luigi", ...]

# Hierarchical character list for dropdown menus
# Characters in groups are indented with spaces (e.g., "  Boomerang Bro")
# Groups are collapsed in UI, individual characters are selectable
comboList = ["Baby DK", "Baby Daisy", ...]

# ===== STAT DEFINITIONS =====

# Internal names for all 30 stat fields in the game's data structure
# Index matches the position in character stat arrays
# Note: "???" at index 3 is unknown/unused field
# Note: "NOT stamina" at index 25 is NOT the actual stamina stat (that's index 28)
statsList = ["pitching arm", "batting arm", ...]

# ===== TRAJECTORY CONFIGURATION =====

# All 6 possible trajectory groups (3 are used by default)
# Can be renamed and enabled/disabled in the trajectory editor
# Default: Medium (0), High (1), Low (2) are active
trajAllList = ["Medium", "High", "Low", "Group 3", "Group 4", "Group 5"]

# Binary flags for which trajectory groups are enabled (1) or disabled (0)
# Matches trajAllList indices
trajUsed = [1, 1, 1, 0, 0, 0]

# Currently active trajectory names (filtered from trajAllList by trajUsed)
# Dynamically updated when enabling/disabling trajectories
trajList = ["Medium", "High", "Low"]

# ===== ABILITY LISTS =====

# Special fielding abilities (13 types)
# Index 0 = None, indices 1-12 are special abilities
fieldingAbilitiesList = ["None", "Super Dive", ...]

# Special baserunning abilities (8 types)
# Index 0 = None, indices 1-7 are special abilities
baserunningAbilitiesList = ["None", "Scatter Dive", ...]

# ===== DEFAULT DATA MATRICES =====

# Default chemistry matrix (101x101)
# Values: 0 = negative chemistry, 1 = neutral, 2 = positive
# Symmetric matrix (chemistry[i][j] == chemistry[j][i])
# Rows/columns match charList indices (first 101 characters only, excludes Miis)
defaultChem = [[1,2,1,1,...], ...]

# Active chemistry data (modified during editing)
# Deep copy of defaultChem, updated by user actions
changedChem = []

# Default stat matrix (124 characters x 30 stats each)
# Each row is a character, each column is a stat (matches statsList)
defaultStat = [[0,0,0,2,2,1,...], ...]

# Active stat data (modified during editing)
# Deep copy of defaultStat
changedStat = []

# Default trajectory height data (24 trajectory curves x 25 height values)
# 6 trajectories x 4 ball types (normal, slice, charge, both) = 24 total curves
# Each curve has 25 height values representing the ball's arc
# Values are percentages (0-100) that must sum to 100 for each curve
defaultTraj = [[0,10,20,30,40,...], ...]

# Active trajectory data (modified during editing)
# Deep copy of defaultTraj
changedTraj = []
```

---

### 3. Helper Functions Need Docstrings

#### getGroupSize()
**Location:** Line 635
**Issue:** No docstring, unclear purpose

**Current:**
```python
def getGroupSize(n):
	if n==27 or n==30 or (n>=82 and n%3==1 and n<=115):
		return 2
	if n==10 or n==46 or n==53:
		return 3
	if n==18 or n==33 or n==39:
		return 4
	if n==57 or n==64:
		return 5
	return 1
```

**Suggested:**
```python
def getGroupSize(n):
	"""
	Get the number of characters in a character group.

	Some characters are grouped in the UI (e.g., "Dry Bones" has 4 variants).
	This function returns how many individual characters belong to that group.

	Args:
		n: Index in comboList (hierarchical character list)

	Returns:
		int: Number of characters in the group
			1 = single character (not a group)
			2-5 = group with that many members

	Examples:
		getGroupSize(10) -> 3  # "Bros" group has 3 members
		getGroupSize(0) -> 1   # "Baby DK" is a single character
	"""
	# Two-member groups (twins, pairs)
	if n==27 or n==30 or (n>=82 and n%3==1 and n<=115):
		return 2
	# Three-member groups
	if n==10 or n==46 or n==53:
		return 3
	# Four-member groups
	if n==18 or n==33 or n==39:
		return 4
	# Five-member groups
	if n==57 or n==64:
		return 5
	# Single character (default)
	return 1
```

---

#### getCaptain()
**Location:** Line 1873
**Issue:** No docstring, magic numbers

**Current:**
```python
def getCaptain(i):
	if i in [0,1,2,3,4,5,6,9,10,11,17,19]:
		return 1
	else:
		return 0
```

**Suggested:**
```python
def getCaptain(i):
	"""
	Determine if a character is a captain by default.

	Captain characters have special abilities and can be team captains.
	This reflects the game's default captain status.

	Args:
		i: Character index in charList (0-123)

	Returns:
		int: 1 if captain, 0 if not

	Default Captains (by index):
		0: Mario
		1: Luigi
		2: Donkey Kong
		3: Diddy Kong
		4: Peach
		5: Daisy
		6: Green Yoshi
		9: Bowser
		10: Wario
		11: Waluigi
		17: Birdo
		19: Bowser Jr.
	"""
	# List of character indices that are captains by default
	CAPTAIN_INDICES = [0, 1, 2, 3, 4, 5, 6, 9, 10, 11, 17, 19]

	if i in CAPTAIN_INDICES:
		return 1
	else:
		return 0
```

---

### 4. Chemistry Functions Need Documentation

#### chemRightClick() and chemLeftClick()
**Location:** Lines 650-680 (approximately)
**Issue:** No explanation of chemistry value system

**Suggested Addition (before these functions):**
```python
# ===== CHEMISTRY EDITING FUNCTIONS =====
#
# Chemistry values: 0 = Negative, 1 = Neutral, 2 = Positive
#
# User interactions:
# - Left click: Set to Positive (2)
# - Right click: Set to Negative (0)
# - Middle click/Shift+click: Set to Neutral (1)
#
# Chemistry is symmetric: changing chemistry[i][j] also changes chemistry[j][i]
```

---

### 5. Gecko Code Generation
**Location:** Lines 1872-2122
**Issue:** Extremely complex algorithm with ZERO comments

**Current State:** 250+ lines of bit manipulation and address calculation with no explanation

**Suggested Structure:**
```python
# ===== GECKO CODE GENERATION =====
#
# Gecko codes are cheat codes for the Dolphin emulator that patch game memory.
# This section generates codes that modify character stats and chemistry in-game.
#
# Memory Layout:
# - Base Address: 0x6CFA27 (7137703 decimal) - Character data start
# - Each character: 142 bytes
#   - Bytes 0-40: Stats (26 stats, some are 2 bytes)
#   - Bytes 41-141: Chemistry values (101 bytes)
# - Trajectory Base: 0x62A8DC (6463836 decimal)
# - Stamina Base: 0x6291A4 (6457636 decimal)
# - Star Pitch Type Base: 0x62914C (6457532 decimal)
# - Trajectory Heights Base: 0x627A08 (6450824 decimal)
#
# Gecko Code Format:
# - 04XXXXXX YYYYYYYY: Write 4 bytes to address XXXXXX
# - 06XXXXXX NNNNNNNN: Write N bytes to address XXXXXX (followed by data)
#
# Optimization:
# - Only generates code for values that differ from defaults
# - Groups consecutive writes into 06 codes for efficiency
# - Maximum code size: ~380 lines (game limit)

def simpleAdvance(stat, default, L):
	"""
	Advance the Gecko code generation state by one byte.

	Accumulates bytes into 4-byte (04) or multi-byte (06) write commands.
	Only writes values that differ from defaults to minimize code size.

	Args:
		stat: Current stat value to write
		default: Default stat value (from game)
		L: State list [is4, is6, count40, count68, count60, stock41, stock42, code, code6, startAddress]

	Returns:
		Updated state list

	State Variables:
		is4: Boolean (0/1) - Currently building a 4-byte write
		is6: Boolean (0/1) - Currently building a multi-byte write
		count40: Bytes accumulated for 04 command (0-3)
		count68: Bytes accumulated for 06 command
		count60: ??? (appears unused)
		stock41: Accumulated byte string for 04 command
		stock42: Accumulated byte string for 06 command
		code: Generated 04 codes
		code6: Generated 06 code data
		startAddress: Current memory address (hex string)
	"""
	# Implementation with inline comments below...
```

**Add inline comments throughout the gecko generation functions explaining each section.**

---

### 6. Clipboard Fix Needs Better Documentation
**Location:** Lines 2196-2204
**Issue:** Recently added but lacks context

**Current:**
```python
def geckoCopy():
	root.clipboard_clear()
	root.clipboard_append(geckoDisplay.get("1.0", tk.END).strip())
	# Force multiple update cycles to ensure clipboard data persists
	# This prevents clipboard from being cleared when window loses focus
	root.update()
	root.update_idletasks()
	# Keep clipboard alive even after window closes by delaying the update
	root.after(100, lambda: root.update_idletasks())
```

**Improved:**
```python
def geckoCopy():
	"""
	Copy generated Gecko code to system clipboard.

	Tkinter clipboard persistence fix:
	Tkinter's clipboard is cleared when the window loses focus or closes.
	This is a known Tkinter limitation on all platforms.

	Solution:
	- Use multiple update cycles (update() + update_idletasks())
	- Schedule a delayed update (100ms) to keep clipboard alive
	- This ensures clipboard persists even if user closes window immediately

	Bug: Without this fix, copying would randomly fail, especially when
	closing the window quickly after clicking "Copy to clipboard".

	See: https://stackoverflow.com/questions/579687/how-do-i-copy-a-string-to-the-clipboard
	"""
	root.clipboard_clear()
	root.clipboard_append(geckoDisplay.get("1.0", tk.END).strip())

	# Force multiple update cycles to ensure clipboard data persists
	root.update()
	root.update_idletasks()

	# Delayed update keeps clipboard alive after window closes
	root.after(100, lambda: root.update_idletasks())
```

---

### 7. Save/Load Functions
**Location:** Lines 2205-2440
**Issue:** Complex file format with no format documentation

**Suggested Addition:**
```python
# ===== SAVE/LOAD CONFIGURATION =====
#
# File Format: .csv (Character Selection format)
# Purpose: Save complete editor state for later reuse
#
# File Structure:
# Line 1: Header row (ignored during load)
# Lines 2-125: Character data (124 characters)
#
# Each character line contains:
# Column 0: Character name (for reference, not used during load)
# Columns 1-30: Stat values (matches statsList order)
# Columns 31-131: Chemistry values (101 values for chemistry with all non-Mii characters)
#
# Note: This is DIFFERENT from Stats Preset format (.txt, 228 lines)
# Stats Preset format:
#   - Lines 1-101: Chemistry matrix (101x101, one row per line)
#   - Lines 102-202: Character stats (101 characters, 30 values each, comma-separated)
#   - Lines 203-226: Trajectory height data (24 curves x 25 values)
#   - Line 227: Trajectory names (6 comma-separated strings)
#   - Line 228: Trajectory usage flags (6 comma-separated 0/1 values)

def saveChanges():
	"""
	Save current editor state to .csv file.

	Opens a native Save As dialog and saves all character stats and chemistry
	data in Character Selection format (.csv).

	The file can be reloaded later to restore the exact editor state.

	Creates saves/ directory if it doesn't exist.
	Default filename: "save.csv"

	File encoding: UTF-8
	"""
	# Implementation...

def loadChanges():
	"""
	Load previously saved editor state from .csv file.

	Opens a native Open dialog for .csv file selection.
	Validates file format and loads data into editor.

	Validation:
	- Checks for .csv extension
	- Warns if .txt file is selected (Stats Preset format)
	- Expects 124 data rows (after header)
	- Each row should have 132 columns (name + 30 stats + 101 chemistry)

	On success:
	- Updates changedStat and changedChem arrays
	- Refreshes all UI displays

	On error:
	- Shows error message
	- Does not modify current state
	"""
	# Implementation...
```

---

### 8. Stat Randomization
**Location:** Lines 1501-1730
**Issue:** Complex algorithm with constraints, no overview

**Suggested Addition:**
```python
def randomizeStats():
	"""
	Generate randomized stats for selected characters with constraints.

	Features:
	- Per-stat min/max/range controls
	- Constraint linking (e.g., charge power > slap power)
	- Overall bar recalculation (pitching/batting/fielding/speed)
	- Normal vs uniform distribution option
	- Variation mode (randomize around current values vs full range)

	Constraints (optional):
	1. Pitching Bar Constraint:
	   - Forces charge pitch speed >= curveball speed by X%
	   - Ensures fastball > curveball (realistic pitching)

	2. Contact Constraint:
	   - Forces charge contact >= slap contact by X%
	   - Prevents unrealistic contact distributions

	3. Power Constraint:
	   - Forces charge power >= slap power by X%
	   - Reflects game mechanics (charged hits should be stronger)

	Overall Bars:
	- Pitching: Weighted average of curveball speed (25%), fastball speed (25%), curve (50%)
	- Batting: Weighted average of slap contact (12.5%), charge contact (12.5%),
	           slap power (37.5%), charge power (37.5%)
	- Fielding: Based on fielding stat
	- Speed: Based on speed stat
	- Values clamped to 1-9 range

	Algorithm:
	1. For each selected character:
	2. For each stat with randomization enabled:
	3. Generate random value within min/max
	4. Apply variation mode if enabled
	5. Apply constraints (iteratively enforce all constraints)
	6. Recalculate overall bars if option enabled
	7. Update UI displays
	"""
	# Implementation...
```

---

### 9. Trajectory Editing
**Location:** Lines 1740-1868
**Issue:** Trajectory data structure unclear

**Suggested Addition:**
```python
# ===== TRAJECTORY EDITING =====
#
# Trajectory System:
# - 6 possible trajectory types (3 active by default: Medium, High, Low)
# - Each trajectory has 4 ball type variants:
#   1. Normal hit
#   2. Slice hit
#   3. Charge hit
#   4. Both (charge + slice)
# - Total: 6 trajectories × 4 ball types = 24 trajectory curves
#
# Each curve has 25 height values representing the ball's vertical position
# as it travels from home plate to the outfield.
#
# Height Values:
# - Range: 0-100 (percentage of max height)
# - Must sum to 100 for each curve (enforced by game)
# - If sum != 100, game normalizes values proportionally
#
# Curve Indices (in defaultTraj and changedTraj):
# - 0-3: Medium trajectory (normal, slice, charge, both)
# - 4-7: High trajectory (normal, slice, charge, both)
# - 8-11: Low trajectory (normal, slice, charge, both)
# - 12-15: Group 3 (if enabled)
# - 16-19: Group 4 (if enabled)
# - 20-23: Group 5 (if enabled)
#
# Example:
# changedTraj[0] = Medium/Normal curve (25 values)
# changedTraj[1] = Medium/Slice curve (25 values)
# changedTraj[8] = Low/Normal curve (25 values)
```

---

## Medium Priority Issues

### 10. GUI Setup Code Organization
**Location:** Lines 2600-3373
**Issue:** 700+ lines of GUI setup with minimal section headers

**Suggested Structure:**
```python
# ===== GUI INITIALIZATION =====

root = tk.Tk()
root.title("Mario Super Sluggers Stat Editor")

notebook = ttk.Notebook(root)
notebook.pack()

# === TAB 1: CHEMISTRY EDITOR ===
chemFrame = tk.Frame(notebook)
notebook.add(chemFrame, text="Chemistry")

# Chemistry matrix display
chemTable = tk.Frame(chemFrame)
chemTable.grid(...)

# Chemistry controls (global operations)
chemControls = tk.LabelFrame(chemFrame, text="Global Chemistry")
chemControls.grid(...)

# Auto-chemistry settings
autoChemFrame = tk.LabelFrame(chemFrame, text="Auto Chemistry")
autoChemFrame.grid(...)

# === TAB 2: MANUAL STATS ===
manualStatsFrame = tk.Frame(notebook)
notebook.add(manualStatsFrame, text="Manual Stats")

# Character selector
cbPlayer = ttk.Combobox(manualStatsFrame, values=comboList, state="readonly")
cbPlayer.grid(...)

# Stat spinboxes (30 stats organized into groups)
# Group: Basic Info (arm side, class, weight, captain)
# Group: Special Moves (star pitch, star swing, abilities)
# Group: Pitching Stats (curve, speeds, stamina)
# Group: Batting Stats (contact, power, trajectory, hit curve)
# Group: Fielding/Running (bunting, speed, throwing, fielding)
# Group: Overall Bars (calculated values, 0-10 scale)

# === TAB 3: RANDOM STATS ===
randomStatsFrame = tk.Frame(notebook)
notebook.add(randomStatsFrame, text="Random Stats")

# Player selection for randomization
# Min/Max/Range controls for each stat
# Constraint checkboxes
# Distribution options

# === TAB 4: TRAJECTORY EDITOR ===
trajFrame = tk.Frame(notebook)
notebook.add(trajFrame, text="Trajectory")

# Trajectory group selector
# Ball type selector (normal, slice, charge, both)
# 25 height value spinboxes
# Trajectory management (rename, enable/disable, reset)

# === TAB 5: GECKO CODE ===
geckoFrame = tk.Frame(notebook)
notebook.add(geckoFrame, text="Gecko Code")

# Player selection for code generation
# Generated code display
# Copy to clipboard button
# Warning label (if code too large)

# === RECAP/LOG PANEL ===
recapList = tk.Text(root, height=10, state="disabled")
recapList.pack(...)
# Displays operation results and error messages

# === MAIN LOOP ===
root.mainloop()
```

---

### 11. Variable Naming Clarity

**Issue:** Some variable names are non-obvious

**Examples:**
- `L` in gecko generation → Should be `geckoState` or `codeGenState`
- `is4`, `is6` → Should be `building4ByteWrite`, `buildingMultiByteWrite`
- `stock41`, `stock42` → Should be `accumulatedBytes4`, `accumulatedBytes6`
- `sbStat0`, `sbStat1`, etc. → Document what `sb` means (spinbox)
- `randStat10min`, `randStat10max` → Add comment mapping stat indices to names

**Suggested:**
Add comments at variable declaration:
```python
# Spinbox widgets for manual stat editing (sb = spinbox)
sbStat0 = ttk.Combobox(...)  # Pitching arm
sbStat1 = ttk.Combobox(...)  # Batting arm
sbStat2 = ttk.Combobox(...)  # Character class
# ... etc

# Random stat min/max controls
randStat10min = ttk.Spinbox(...)  # Slap hit contact minimum
randStat10max = ttk.Spinbox(...)  # Slap hit contact maximum
# ... etc
```

---

### 12. Magic Number Documentation

**Issue:** Numerous magic numbers without explanation

**Examples:**

**Line ~635: getGroupSize()**
```python
if n==27 or n==30 or (n>=82 and n%3==1 and n<=115):
```
Why 27? Why 30? Why 82-115 with mod 3?
→ These are specific group indices in comboList, document them

**Line ~1873: getCaptain()**
```python
if i in [0,1,2,3,4,5,6,9,10,11,17,19]:
```
Already addressed above (use named constant)

**Line ~1905: getStatOffset()**
```python
def getStatOffset(i):
    # Needs docstring explaining stat memory layout
    # Add comments for each case explaining which stat
```

**Line ~2005: Gecko addresses**
```python
baseAddress=7137703
baseTraj=6463836
baseStamina=6457636
baseStarPitchType=6457532
baseTrajHeight=6450824
```
→ Already addressed above, but add hex equivalents:
```python
BASE_ADDRESS = 7137703      # 0x6CFA27 - Character data start
BASE_TRAJ = 6463836         # 0x62A8DC - Trajectory type array
BASE_STAMINA = 6457636      # 0x6291A4 - Stamina array
BASE_STAR_PITCH_TYPE = 6457532  # 0x62914C - Star pitch type array
BASE_TRAJ_HEIGHT = 6450824  # 0x627A08 - Trajectory height curves
```

---

### 13. Function Purpose Documentation

Many small functions lack purpose explanation:

**chemColor()** - What does this do?
**statDisplay()** - Display what? How?
**trajDisplay()** - Display trajectory... data? UI?
**statCheckButton()** - What is being checked?
**linkPitch(), linkContact(), linkPower()** - Linking what to what?

**Suggested:** Add brief docstrings to ALL functions:
```python
def chemColor():
	"""
	Update chemistry matrix UI colors based on values.

	Color coding:
	- Red: Negative chemistry (0)
	- Yellow: Neutral chemistry (1)
	- Green: Positive chemistry (2)
	"""
	# Implementation...

def statDisplay(mode):
	"""
	Refresh stat display UI for selected character.

	Args:
		mode: 0 = show specific character, 1 = show range for entire group

	Updates all 30 stat spinboxes with current values.
	For groups, shows "min - max" range if values differ.
	"""
	# Implementation...
```

---

## Low Priority Issues

### 14. Code Organization
- Consider breaking into multiple files:
  - `data_defaults.py` - All default matrices
  - `ui_chemistry.py` - Chemistry tab UI
  - `ui_stats.py` - Stats tabs UI
  - `ui_trajectory.py` - Trajectory tab UI
  - `gecko_generator.py` - Gecko code generation
  - `file_io.py` - Save/load functions
  - `main.py` - Main application

### 15. Consistent Comment Style
- Mix of `#comment` and `# comment` (with space)
- Mix of `#Section` and `#===== SECTION =====`
- Standardize to PEP 8: always use space after `#`

### 16. Remove Commented-Out Code
Search for and remove or document any commented-out code sections.

### 17. Add Type Hints (Python 3.5+)
Consider adding type hints for better IDE support:
```python
def getCaptain(i: int) -> int:
def getGroupSize(n: int) -> int:
def randomizeStats() -> None:
```

---

## Implementation Plan

### Phase 1: Critical Documentation (4-6 hours)
1. Add file header docstring ✓
2. Document all global data structures ✓
3. Add docstrings to top 20 most important functions
4. Document gecko code generation algorithm

### Phase 2: Inline Comments (3-4 hours)
5. Add inline comments to complex logic sections
6. Document magic numbers
7. Explain non-obvious variable names

### Phase 3: Polish (2-3 hours)
8. Organize GUI section with clear headers
9. Standardize comment formatting
10. Add type hints to public functions

### Total Estimated Time: 9-13 hours

---

## Quick Wins (1-2 hours)

These can be done quickly for immediate improvement:

1. ✅ Add file header docstring (10 min)
2. ✅ Document clipboard fix better (5 min) - DONE
3. Add docstrings to top 10 functions (30 min)
4. Replace magic number lists with named constants (20 min)
5. Add section headers to GUI code (15 min)

---

## Notes for Implementation

- Focus on "why" over "what" in comments
- Explain business logic, not obvious syntax
- Document assumptions and constraints
- Link to external resources where relevant
- Keep comments up-to-date when code changes
- Use TODO/FIXME/HACK markers where appropriate

**Example of good vs bad comments:**

❌ Bad:
```python
# Set x to 5
x = 5
```

✅ Good:
```python
# Default to 5 captains per team (game maximum)
max_captains_per_team = 5
```

---

**Document Version:** 1.0
**Date:** 2025-11-07
**Status:** Review Complete - Ready for Implementation
