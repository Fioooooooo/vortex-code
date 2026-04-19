## ADDED Requirements

### Requirement: Stage detail view has a unified layout framework

The system SHALL render all stage detail content within a unified layout framework containing a title bar with stage name, status badge, duration, token usage, and action buttons.

#### Scenario: View stage detail header

- **WHEN** the user views any stage's detail
- **THEN** the title bar shows the stage name, status badge, elapsed time, and token count
- **AND** action buttons include "Rerun Stage", "Skip Stage", and "Force Pass" (visible when failed)

### Requirement: Discuss stage shows conversation and summary

The system SHALL display the requirement discussion stage as a conversation thread followed by a summary card containing the task breakdown and technical decisions.

#### Scenario: View discuss stage with human confirmation

- **WHEN** the user views a discuss stage that requires human confirmation
- **THEN** the conversation is displayed in the same visual style as Workspace chat
- **AND** the last message is a confirmation card awaiting user action

#### Scenario: View discuss stage conclusion

- **WHEN** the discussion has concluded
- **THEN** a summary card is displayed at the end showing task breakdown and technical decisions
- **AND** the summary content is formatted as the input for the next stage

### Requirement: Code stage shows execution and file changes

The system SHALL display the code writing stage in two parts: the upper part shows the agent's execution process as a sequence of operation cards, and the lower part shows the list of file changes with expandable inline diffs.

#### Scenario: View code stage execution

- **WHEN** the user views a code stage
- **THEN** the execution process is shown as a sequence of file operation and command cards
- **AND** each file change can be clicked to expand and show its inline diff

### Requirement: Test stage shows test results

The system SHALL display the unit test stage with a test result summary card showing passed count, failed count, and coverage percentage, plus detailed failure information for any failed tests.

#### Scenario: View test results with failures

- **WHEN** the user views a test stage with failures
- **THEN** the summary card shows passed/failed counts and coverage
- **AND** failed tests are listed with error details
- **AND** if auto-repair is configured, the agent's repair attempts are shown chronologically

### Requirement: Review stage shows review comments

The system SHALL display the code review stage as a list of review comment cards, each containing the affected file and line numbers, issue category, severity level, and description.

#### Scenario: View review comment

- **WHEN** the user views a review stage
- **THEN** each review comment card shows file path, line numbers, category badge, severity badge, and description
- **AND** clicking a line number navigates to the corresponding diff position
- **AND** if auto-fix is configured, the fix process and re-review results are shown

### Requirement: Deploy stage shows deployment log and result

The system SHALL display the deploy stage as a log stream with deployment target information, deployment result status, and post-deployment verification results if configured.

#### Scenario: View deploy stage

- **WHEN** the user views a deploy stage
- **THEN** a scrollable log stream is displayed
- **AND** deployment target information is shown
- **AND** the final deployment result is prominently displayed
- **AND** verification results appear after successful deployment if configured
