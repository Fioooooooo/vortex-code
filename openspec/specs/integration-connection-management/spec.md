# integration-connection-management Specification

## Purpose

TBD - created by archiving change integrations-page. Update Purpose after archive.

## Requirements

### Requirement: Users can connect tools via API Token

For tools using API Token authentication, the system SHALL display a form with labeled input fields for required credentials (e.g., Access Key, Token, Webhook URL). Each field SHALL include helper text and a help link explaining how to obtain the credential. A "Test Connection" button SHALL validate the entered credentials.

#### Scenario: API Token connection flow

- **WHEN** the user expands a tool card that uses API Token authentication
- **THEN** the connection section shows input fields for the required credentials
- **AND** each field has a label, helper text, and help link
- **AND** a "Test Connection" button is present

#### Scenario: Successful connection test

- **WHEN** the user fills in valid credentials and clicks "Test Connection"
- **THEN** the system validates the credentials
- **AND** upon success, the connection status changes to "Connected"
- **AND** the connected account/org name is displayed

### Requirement: Users can disconnect tools

For a connected tool, the system SHALL display the connected account information and a "Disconnect" button. Clicking "Disconnect" SHALL remove the connection and reset the tool to an unconnected state.

#### Scenario: Disconnect a tool

- **WHEN** the user clicks "Disconnect" on a connected tool
- **THEN** the tool's connection is removed
- **AND** the card updates to show "Not Connected"
- **AND** the tool is disabled in any projects where it was enabled

### Requirement: OAuth tools display connect button

For tools using OAuth authentication, the system SHALL display a "Connect with {Provider}" button. Clicking the button SHALL simulate an OAuth flow (state changes to connected after a brief delay).

#### Scenario: OAuth connection simulation

- **WHEN** the user clicks "Connect with GitHub" on a coming-soon OAuth tool
- **THEN** the button shows a loading state
- **AND** after a simulated delay, the tool becomes connected
- **AND** the connected account name is displayed
