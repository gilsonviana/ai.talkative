# Feature: Client UI Overhaul – Migrate to shadcn/ui

## Goal

Replace the Headless UI dependency with shadcn/ui to modernize the component library, improve component customization options, and align with current best practices. This migration will provide better type safety, more composable components, and easier theming while maintaining the existing visual design and functionality.

## Acceptance Criteria

- All Headless UI components (`Input`, `Button`) are replaced with shadcn/ui equivalents
- The client application builds and runs without errors
- All existing functionality is preserved (form inputs, conversation control, Q&A display)
- Styling remains visually identical to the original design
- No new accessibility issues are introduced; existing a11y features are maintained
- Type safety is maintained or improved throughout the codebase

## Technical Approach

1. **Dependency Updates**:
   - Remove `@headlessui/react` from `packages/client/package.json`
   - Add shadcn/ui CLI and required dependencies (`@radix-ui/react-*`, `class-variance-authority`, `clsx`, `tailwind-merge`)
   - Verify Tailwind CSS v4.3.3 is compatible (it is; shadcn/ui works with Tailwind v4)

2. **Component Migration**:
   - Use shadcn/ui CLI to initialize shadcn/ui in the client package
   - Add required shadcn/ui components: `Button` and `Input`
   - Update `App.tsx` to import from shadcn/ui instead of Headless UI
   - Adapt component usage to match shadcn/ui API (props and class names may differ)

3. **Styling Integration**:
   - Configure shadcn/ui to use the existing Tailwind theme from `styles.css`
   - Ensure custom color tokens (`--color-paper`, `--color-ink`, etc.) are accessible to shadcn/ui components
   - Verify the fade-in-up animation is still applied to Q&A pairs

4. **Testing & Validation**:
   - Run dev server and verify all UI elements render correctly
   - Test form inputs and button interactions
   - Verify WebSocket conversation flow works end-to-end
   - Check that the custom color scheme is applied to shadcn/ui components

## Edge Cases / Constraints

- **Component API Differences**: shadcn/ui components may have different prop interfaces than Headless UI (e.g., class name handling)
- **Theme Customization**: shadcn/ui uses a components.json config file that may need adjusting to work with the existing Tailwind theme
- **CSS Specificity**: Ensure shadcn/ui's default styles don't override custom accent colors or other theme variables
- **TypeScript Strict Mode**: Ensure all TypeScript errors are resolved during migration
- **Breaking Changes**: Some Headless UI patterns (e.g., `data-[disabled]` selectors) may not have direct shadcn/ui equivalents

## Files to Modify

- `packages/client/package.json` (remove `@headlessui/react`, add shadcn/ui dependencies)
- `packages/client/vite.config.ts` (no changes needed; Tailwind v4 is already compatible)
- `packages/client/src/App.tsx` (replace Headless UI imports and components with shadcn/ui)
- `packages/client/src/styles.css` (may need minor adjustments for shadcn/ui integration)
- `packages/client/components.json` (create; shadcn/ui configuration file)
- `packages/client/.gitignore` (update if needed for shadcn/ui artifacts)

## Test Plan

1. **Unit Testing**:
   - Verify form inputs accept and emit values correctly
   - Verify buttons respond to click events and disabled states

2. **Integration Testing**:
   - Start a conversation from the client UI
   - Verify WebSocket connection and Q&A streaming
   - Ensure conversation completes without errors
   - Verify the UI disables inputs while running

3. **Visual Regression Testing**:
   - Compare rendered UI before and after migration
   - Verify all custom colors are applied (paper, ink, accent, line)
   - Verify typography (serif/sans-serif, sizing) is unchanged
   - Verify spacing and layout remain identical

4. **Manual Testing Checklist**:
   - [ ] Form submission with valid input
   - [ ] Input validation (required fields, number limits)
   - [ ] Button disabled states during conversation
   - [ ] Real-time Q&A pair display
   - [ ] Custom color scheme is applied
   - [ ] Animations (fade-in-up) work smoothly
