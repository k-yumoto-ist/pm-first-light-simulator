**Comparison Target**

- source visual truth path: `docs/qa/source-step-ui-1366x768.png` and the user's three-step UI specification
- implementation screenshots: `docs/qa/step1-situation-1366x768.png`, `docs/qa/step2-decision-1366x768.png`, and `docs/qa/step3-result-unlock-1366x768.png`
- combined full-view evidence: `docs/qa/qa-step-flow-comparison-1366x768.png`
- viewport: CSS viewport 1366 x 768, device scale 1
- pixels and density: source and implementation captures are 1366 x 768 px; no resampling was used before comparison
- state: Turn 1; STEP 1 at initial situation, STEP 2 with three Actions remaining, and STEP 3 after the decision-maker conversation

**Full-view Comparison Evidence**

The combined image places the previous three-pane cockpit and the revised STEP 2 decision screen in one 2732 x 768 px image. The revision retains the dark-green header, coral accent, cream surface, KPI data, scenario copy, and six original actions while removing the simultaneous situation/detail panes. At 1366 x 768 the browser reported `scrollWidth === innerWidth` and `scrollHeight === innerHeight` for STEP 1, STEP 2, the action-detail modal, and STEP 3.

**Focused Region Comparison Evidence**

Separate full-size captures were used because the key fidelity questions are readable copy and interaction hierarchy rather than small decorative details. STEP 1 shows only situation, PM thinking point, known facts, and locked unknowns. STEP 2 shows the compact KPI strip, one Action budget, and a 2 x 3 action grid without a permanent detail pane. STEP 3 separates the action, discovered fact, unlocked information, changed metric, causal explanation, and PMBOK learning. The action-detail capture was also inspected in-browser at 820 x 513 CSS px and remained fully inside the viewport.

**Required Fidelity Surfaces**

- Fonts and typography: the existing display/body pairing is preserved. Situation and decision headings use the existing serif display face; body copy remains at readable desktop sizes with no decision-critical 10–12 px text.
- Spacing and layout rhythm: phase-specific content replaces the previous four-region cockpit. STEP 1 uses a centered reading column, STEP 2 a balanced 2 x 3 grid, and STEP 3 a two-by-two result story grid. No controls overlap or clip at 1366 x 768.
- Colors and visual tokens: existing dark green, teal, coral, cream, gold, border, and semantic status colors are reused. Completed, current, locked, unlocked, positive, and caution states remain distinguishable.
- Image quality and asset fidelity: the target uses no photographic or illustrative assets. Existing typographic brand marks and action-code badges are retained; no replacement assets were introduced.
- Copy and content: original scenario/action/effect data is preserved. New interface copy follows the requested order of situation, decision, result, and learning without exposing exact effects before execution.
- States and accessibility: card selection does not consume an Action; the modal shows intent, trade-off, direction, and Action 3 to 2 before execution. Escape/outside-close, remaining-Action confirmation, result continuation, used-action state, and information unlock were exercised. Dialog labels and button semantics are present.

**Findings**

- No actionable P0, P1, or P2 visual or interaction findings remain.
- [P3] The local in-app browser is fixed at 1366 x 768, so the 1920 x 1080 media-query branch was validated through the production build and CSS review rather than a second native browser capture. The harder 1366 x 768 target passed with zero overflow.

**Comparison History**

1. Earlier P1: situation, six actions, selected-action detail, KPI, and turn controls competed simultaneously. Fix: made the stepper control three mutually exclusive main states and removed the permanent right detail pane. Post-fix evidence: all three implementation screenshots above.
2. Earlier P2: six repeated execution controls weakened the cost and meaning of a PM decision. Fix: cards now open a single final-confirmation detail modal; only that modal can execute. Post-fix evidence: browser interaction from STEP 2 through STEP 3.
3. Earlier P2: conversation selection could leave an earlier modal behind. Fix: the action-detail surface closes before the contact picker opens, and the picker/drawer close before STEP 3. Post-fix evidence: browser DOM inspection found `actionDetailVisible: false` with one contact picker, then zero drawer/picker layers in STEP 3.
4. Earlier P2: action results appeared as an overlay on the decision cockpit. Fix: results now own the main stage and isolate what happened, what unlocked, what changed, and why. Post-fix evidence: `docs/qa/step3-result-unlock-1366x768.png`.
5. Review P2: the used marker initially read all historical logs, and modal focus could leave the active dialog. Fix: used markers now filter to the current turn; both decision dialogs trap Tab/Shift+Tab and restore focus to the triggering control. Post-fix evidence: TypeScript/build checks plus browser focus sequence `close → execute → close → triggering card`.

**Implementation Checklist**

- [x] STEP 1 situation-only stage
- [x] STEP 2 decision-only 2 x 3 action grid
- [x] One action-detail/final-confirmation modal
- [x] Action cost and remaining budget before execution
- [x] STEP 3 full-stage result and PMBOK learning
- [x] Known-information lock/unlock reward
- [x] Used-action and updated Action budget state
- [x] Remaining-Action confirmation before advancing
- [x] Turn transition resets to STEP 1 and page top
- [x] 1366 x 768 zero-overflow browser check
- [x] Browser console check with no errors
- [x] Dialog keyboard focus trap and focus restoration
- [x] Unit/render tests and GitHub Pages production build

**Open Questions**

- None blocking. Tablet/mobile continue to use the existing stacked responsive mode because this redesign prioritizes PC.

**Follow-up Polish**

- A later pass could add a dedicated 1920 x 1080 visual capture when the in-app browser exposes a resizable viewport; the current responsive branch already builds successfully.

final result: passed
