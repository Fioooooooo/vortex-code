## 1. Core - Add runTool wrapper

- [x] 1.1 Add `PromptId` import to `utils/state.ts` and implement `runTool` function
- [x] 1.2 Update `utils/state.ts` exports if needed

## 2. Tool handlers - Switch to runTool

- [x] 2.1 Update `tools/explore.ts` to use `runTool`
- [x] 2.2 Update `tools/create-proposal.ts` to use `runTool`
- [x] 2.3 Update `tools/apply-change.ts` to use `runTool`
- [x] 2.4 Update `tools/archive-change.ts` to use `runTool`

## 3. Tests - Update assertions

- [x] 3.1 Update `tools.test.ts` (or equivalent test file) — replace `rejects.toBeInstanceOf(McpError)` cases with `state.errors` checks
- [x] 3.2 Add test cases for error internalization (CLI error → state.errors)

## 4. Spec - Update openspec spec

- [x] 4.1 Update `openspec/specs/fyllo-specs-mcp/spec.md` to reflect error internalization semantics

## 5. Add `includeInstruction` optional parameter

- [x] 5.1 Update `runTool` in `utils/state.ts` to accept `includeInstruction` option
- [x] 5.2 Add `includeInstruction` to zod schema of all 4 tools
- [x] 5.3 Wire `includeInstruction` through each tool handler to `runTool`
- [x] 5.4 Update `parseState` in test to handle plain JSON responses
- [x] 5.5 Add tests for `includeInstruction: false` (normal path + error path)

## 6. Update spec for `includeInstruction`

- [x] 6.1 Update parameter definitions in `spec.md` for all 4 tools
- [x] 6.2 Add scenario describing `includeInstruction: false` behavior
- [x] 6.3 Update `design.md` with design decision rationale

## 7. Verification

- [x] 7.1 Run tests (`pnpm test` or equivalent) and ensure all pass
- [x] 7.2 Run typecheck and ensure no errors
