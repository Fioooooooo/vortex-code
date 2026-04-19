## ADDED Requirements

### Requirement: Integrations page displays tools organized by category

The system SHALL display integrations grouped into six categories in a fixed vertical order: Project Management, Source Control, CI/CD, Deployment, Communication, Observability. Each category SHALL have a title and a one-line description of its Pipeline role.

#### Scenario: Category sections render in order

- **WHEN** the user navigates to the Integrations page
- **THEN** the page displays six category sections vertically
- **AND** the sections appear in the order: Project Management, Source Control, CI/CD, Deployment, Communication, Observability

### Requirement: Each tool is displayed as a card within its category

The system SHALL render each integration tool as a card. Cards within the same category SHALL be arranged horizontally in a responsive grid (2-3 cards per row depending on viewport width).

#### Scenario: Tool cards render in responsive grid

- **WHEN** the user views a category section
- **THEN** the category's tools are displayed as cards in a grid layout
- **AND** the grid adapts to show 2-3 cards per row based on available width

### Requirement: Tool card displays brand identity and description

Each tool card SHALL display the tool's brand logo (approx. 36x36px), name, and a one-line description on its front face.

#### Scenario: Card front shows tool metadata

- **WHEN** the user views a tool card
- **THEN** the card shows the tool logo on the left
- **AND** the tool name and description on the right

### Requirement: Tool card displays connection status

Each tool card SHALL display a connection status badge in the top-right corner. The badge SHALL show "Connected" with a checkmark in green when connected, or "Not Connected" in gray when not connected.

#### Scenario: Connected tool shows green status

- **WHEN** a tool has an active connection
- **THEN** its card displays a green "Connected" badge with a checkmark icon

#### Scenario: Unconnected tool shows gray status

- **WHEN** a tool has no active connection
- **THEN** its card displays a gray "Not Connected" badge

### Requirement: Tool card displays project-level enablement status

Each tool card SHALL display a project enablement area at the bottom. If a project is open and the tool is connected, the area SHALL show a toggle switch labeled with the current project name. If the tool is not connected, the area SHALL show "Connect first to enable in project". If no project is open, the area SHALL show "Open a project to enable".

#### Scenario: Tool connected with project open

- **WHEN** a tool is connected and a project is currently open
- **THEN** the card bottom shows a toggle switch with the project name

#### Scenario: Tool not connected

- **WHEN** a tool has no connection
- **THEN** the card bottom shows "Connect first to enable in project"

#### Scenario: No project open

- **WHEN** no project is currently open
- **THEN** the card bottom shows "Open a project to enable"

### Requirement: Coming Soon tools are visually distinct and non-interactive

Tools marked as "coming soon" SHALL have a "Coming Soon" label, be visually grayed out, and SHALL NOT be clickable or expandable.

#### Scenario: Coming soon tool is disabled

- **WHEN** a tool is marked as coming soon
- **THEN** the card is rendered with reduced opacity
- **AND** a "Coming Soon" badge is visible
- **AND** the card does not respond to click or expand interactions

### Requirement: Users can search tools by name

The system SHALL provide a search input at the top of the page. Typing in the search input SHALL filter the displayed tool cards to show only those whose names match the search text.

#### Scenario: Search filters tools

- **WHEN** the user types "钉钉" in the search box
- **THEN** only tools with names containing "钉钉" remain visible
- **AND** tools not matching are hidden

### Requirement: Users can filter tools by connection status

The system SHALL provide a filter dropdown next to the search input with options: "All", "Connected", and "Enabled in Project". The "Enabled in Project" option SHALL only be available when a project context exists.

#### Scenario: Filter by connected status

- **WHEN** the user selects "Connected" from the filter dropdown
- **THEN** only tools with an active connection are displayed

#### Scenario: Enabled in Project filter requires project context

- **WHEN** no project is open and the filter dropdown is opened
- **THEN** the "Enabled in Project" option is disabled or hidden
