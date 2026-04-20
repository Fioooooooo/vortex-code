## ADDED Requirements

### Requirement: Header has fixed height of 35px

The system SHALL render the AppHeader with a fixed height of 35 pixels.

#### Scenario: Header renders at correct height

- **WHEN** the AppHeader component is rendered
- **THEN** its height is exactly 35px

### Requirement: Header uses three-column layout

The system SHALL divide the AppHeader horizontally into three sections: left (20% width), center (60% width), and right (20% width).

#### Scenario: Layout proportions are correct

- **WHEN** the AppHeader is rendered
- **THEN** the left section occupies 20% of the width
- **AND** the center section occupies 60% of the width
- **AND** the right section occupies 20% of the width

### Requirement: Left section is empty placeholder

The system SHALL render the left section as an empty placeholder with no visible content.

#### Scenario: Left section has no content

- **WHEN** the AppHeader is rendered
- **THEN** the left section contains no interactive elements or text

### Requirement: Center section displays project and agent info

The system SHALL render the center section with the current project name, current agent name, and a chevron-down icon, all horizontally centered.

#### Scenario: Center section shows project switcher

- **WHEN** the AppHeader is rendered with an active project
- **THEN** the center section displays the project name
- **AND** the current agent name
- **AND** a chevron-down icon
- **AND** all elements are horizontally centered within the section

#### Scenario: Center section shows fallback when no project

- **WHEN** the AppHeader is rendered without an active project
- **THEN** the center section displays "No Project" as the project name

### Requirement: Right section contains theme toggle icon button

The system SHALL render only the theme toggle icon button in the right section.

#### Scenario: Right section has theme toggle

- **WHEN** the AppHeader is rendered
- **THEN** the right section contains a theme toggle icon button
- **AND** no other controls (token usage, agent status) are present

### Requirement: Right section icon button container has proper spacing

The system SHALL render the right section with an inner container that has 8px right padding, and icon buttons inside are right-aligned with 4px gap between them.

#### Scenario: Icon button container layout

- **WHEN** the AppHeader is rendered
- **THEN** the right section's inner container has 8px right padding
- **AND** icon buttons are aligned to the right
- **AND** the gap between icon buttons is 4px

### Requirement: Icon buttons have fixed dimensions

The system SHALL render each icon button at 22px by 22px, with the actual icon at 16px by 16px.

#### Scenario: Icon button sizing

- **WHEN** the AppHeader is rendered
- **THEN** each icon button has width 22px and height 22px
- **AND** each icon inside has width 16px and height 16px

### Requirement: Icon buttons have hover background effect

The system SHALL apply a background color change on hover for each icon button.

#### Scenario: Hover effect on icon button

- **WHEN** the user hovers over an icon button
- **THEN** the icon button's background color changes

### Requirement: Header supports Electron window drag

The system SHALL apply `-webkit-app-region: drag` to the Header root element to enable Electron window dragging.

#### Scenario: Header is draggable

- **WHEN** the AppHeader is rendered in an Electron environment
- **THEN** the user can drag the window by clicking and dragging the Header area

### Requirement: Header interactive elements do not trigger drag

The system SHALL apply `-webkit-app-region: no-drag` to all interactive elements inside the Header (buttons, icons, clickable areas) to prevent them from initiating window drag.

#### Scenario: Interactive elements are clickable

- **WHEN** the user clicks on a button or interactive element inside the Header
- **THEN** the click triggers the element's intended action
- **AND** the window does not start dragging

### Requirement: macOS window hides native titlebar but keeps traffic lights

On macOS, the system SHALL create the main window with `titleBarStyle: 'hidden'` to hide the native titlebar while preserving the traffic light buttons.

#### Scenario: macOS window has no native titlebar

- **WHEN** the application launches on macOS
- **THEN** the window has no native titlebar
- **AND** the traffic light buttons (close, minimize, maximize) are visible

### Requirement: Center section uses bordered div with vertical spacing

The system SHALL render the center section's project switcher as a bordered div container with vertical spacing from the Header edges, instead of a UButton.

#### Scenario: Center section has bordered div

- **WHEN** the AppHeader is rendered
- **THEN** the center section contains a div with a border
- **AND** the div has vertical spacing from the Header top and bottom edges
- **AND** the div is horizontally centered

### Requirement: Clicking center div opens project switcher dropdown

The system SHALL open a dropdown menu when the user clicks the center section div, showing recent projects and a "Create New Project" option separated by a divider.

#### Scenario: Dropdown shows recent projects

- **WHEN** the user clicks the center section div
- **THEN** a dropdown menu opens
- **AND** the menu displays recent projects in a scrollable list
- **AND** a divider separates the project list from the "Create New Project" option

#### Scenario: Clicking "Create New Project" opens modal

- **WHEN** the user clicks "Create New Project" in the dropdown
- **THEN** the CreateProjectModal opens
- **AND** the modal functions identically to the welcome page's create project flow

### Requirement: macOS traffic lights are positioned in the left header area

On macOS, the system SHALL position the traffic light buttons within the Header's left section using `trafficLightPosition`.

#### Scenario: Traffic lights align with header left section

- **WHEN** the application launches on macOS
- **THEN** the traffic light buttons are positioned at the top-left of the window
- **AND** they visually align with the Header's left 20% section
- **AND** they do not overlap with the center section content
