## 1. Header Layout Refactoring

- [x] 1.1 Update Header height from `h-12` to fixed `h-[35px]`
- [x] 1.2 Restructure Header into three sections: left (20%), center (60%), right (20%) using flex layout
- [x] 1.3 Move project switcher (project name + agent badge + chevron-down) from left to center section, horizontally centered
- [x] 1.4 Leave left section empty as placeholder (20% width)

## 2. Right Section Controls

- [x] 2.1 Remove token usage popover from Header
- [x] 2.2 Remove agent status indicator from Header
- [x] 2.3 Keep only theme toggle icon button in right section
- [x] 2.4 Add right section inner container with `pr-2` (8px right padding) and `justify-end` alignment
- [x] 2.5 Set icon button container gap to `gap-1` (4px)

## 3. Icon Button Styling

- [x] 3.1 Set icon button size to `w-[22px] h-[22px]`
- [x] 3.2 Set icon size to `w-4 h-4` (16px)
- [x] 3.3 Ensure hover background effect works via UButton `variant="ghost"`

## 4. Electron Drag Support

- [x] 4.1 Add `-webkit-app-region: drag` style to Header root element
- [x] 4.2 Add `-webkit-app-region: no-drag` style to all interactive elements inside Header (project switcher button, theme toggle button, chevron-down icon)

## 5. macOS Titlebar Configuration

- [x] 5.1 Update `electron/main/index.ts` to set `titleBarStyle: 'hidden'` on macOS (`process.platform === 'darwin'`)
- [x] 5.2 Set `trafficLightPosition: { x: 12, y: 10 }` on macOS to position traffic lights within Header left section

## 6. Center Section Project Switcher

- [x] 6.1 Replace center UButton with bordered div, add vertical spacing (e.g., `my-1`)
- [x] 6.2 Add click handler on div to open project switcher dropdown menu
- [x] 6.3 Dropdown menu shows recent projects list (scrollable)
- [x] 6.4 Add divider separating projects from "Create New Project" option
- [x] 6.5 Clicking "Create New Project" opens CreateProjectModal
- [x] 6.6 Import and render CreateProjectModal in AppHeader
- [x] 6.7 Add `-webkit-app-region: no-drag` to center div and dropdown elements
