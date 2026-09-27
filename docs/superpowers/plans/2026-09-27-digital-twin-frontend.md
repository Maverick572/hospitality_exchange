# Digital Twin Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a frontend-only digital twin page for simulating weather scenarios and visualizing their impact on resources, strictly isolated from live booking data.

**Architecture:** A standalone page (or distinct tab) controlled by a central mode switch ("live" vs "simulated"). It uses a custom hook to manage debounced API calls for scoring and independent LLM narrative fetching, keeping simulated state entirely separate from the main application's real search results.

**Tech Stack:** React, TypeScript, Fetch API

**Spec:** `digital-twin-frontend-spec.md`

## Global Constraints

- Never call a write endpoint while in simulated mode.
- Never persist simulated results as if they were real state.
- Never let the two modes look visually identical.

## Review Focus

- The slider is dragged rapidly back and forth. -> The narrative call must only fire when settled, and intermediate scoring requests must be cancelled and not leak stale data into the UI. Added test for request cancellation and debouncing.
- The toggle is flipped to "live" while a simulated request is in flight. -> The in-flight request must be immediately aborted so it doesn't overwrite the live state upon completion. Added test for abort on mode switch.
- The `/api/v1/weather/current` fetch fails on page load. -> The page must not crash; it should fall back gracefully to allowing simulated mode instead of showing a hard error. Added test for API failure handling.
- A scenario results in zero available resources. -> An explicit empty state message should appear, not a broken or blank list. Added test for empty resource list under extreme scenarios.
- The user clicks a booking or write action while in simulated mode. -> The action must be disabled with a visible reason, never hidden or active. Added test for write action suppression in simulated mode.

---

### Task 1: Data Fetching and State Management Hook

**Files:**
- Create: `frontend/src/hooks/useTwinSimulation.ts`
- Create: `frontend/src/types/twin.ts`
- Test: `frontend/src/hooks/__tests__/useTwinSimulation.test.ts`

**Interfaces:**
- Produces: `useTwinSimulation(scenario: ScenarioState, mode: WeatherMode)` returning `{ simResult, simStatus, narrativeStatus, refetch }`
- Produces: Type definitions for `WeatherMode`, `TwinPageState`, `WeatherSnapshot`.

- [ ] **Step 1: Write the failing tests**

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useTwinSimulation } from '../useTwinSimulation';

describe('useTwinSimulation', () => {
    it('cancels in-flight requests when a new scenario is provided rapidly', async () => {
        // Mock fetch to delay response
        // Call hook with scenario A
        // Immediately update to scenario B
        // Verify only scenario B's fetch resolves and updates state
    });

    it('aborts simulated request if mode switches to live', async () => {
        // Trigger simulated fetch
        // Immediately change mode to 'live'
        // Verify fetch is aborted and simStatus remains idle/cleared
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useTwinSimulation.test.ts`
Expected: FAIL with "module not found" or "useTwinSimulation is not a function"

- [ ] **Step 3: Implement `useTwinSimulation` and types**

Implement the types from Section 3 of the spec in `types/twin.ts`.
Implement the `useTwinSimulation` hook in `useTwinSimulation.ts`. The hook must maintain a `useRef` for the `AbortController` and `activeRequestId` to cancel requests on unmount or when scenario changes, ensuring only the latest response resolves as described in Section 5 of the spec. Separate the "scores" call from the "narrative" call to avoid hammering the LLM.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useTwinSimulation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useTwinSimulation.ts frontend/src/types/twin.ts frontend/src/hooks/__tests__/useTwinSimulation.test.ts
git commit -m "feat: digital twin state management and API hook"
```

### Task 2: Core Components - Mode Banner and Toggle

**Files:**
- Create: `frontend/src/components/Twin/ModeBanner.tsx`
- Create: `frontend/src/components/Twin/ModeToggle.tsx`
- Test: `frontend/src/components/Twin/__tests__/ModeComponents.test.ts`

**Interfaces:**
- Consumes: `WeatherMode` from `types/twin.ts`
- Produces: `<ModeBanner mode={mode} />`
- Produces: `<ModeToggle mode={mode} onChange={setMode} />`

- [ ] **Step 1: Write the failing test**

```typescript
import { render, screen } from '@testing-library/react';
import { ModeBanner } from '../ModeBanner';
import { ModeToggle } from '../ModeToggle';

describe('Mode Components', () => {
    it('ModeBanner displays visually distinct styles based on mode', () => {
        const { rerender } = render(<ModeBanner mode="live" />);
        expect(screen.getByText(/Live conditions/i)).toBeInTheDocument();
        
        rerender(<ModeBanner mode="simulated" />);
        expect(screen.getByText(/Simulated scenario/i)).toBeInTheDocument();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ModeComponents.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `ModeBanner` and `ModeToggle`**

Create `ModeBanner` to show a persistent, visually distinct banner ("🟢 Live conditions" vs "🟠 Simulated scenario — no real bookings affected").
Create `ModeToggle` using an accessible `<button>` or switch with `aria-pressed`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ModeComponents.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Twin/ModeBanner.tsx frontend/src/components/Twin/ModeToggle.tsx frontend/src/components/Twin/__tests__/ModeComponents.test.ts
git commit -m "feat: add digital twin mode banner and toggle components"
```

### Task 3: Scenario Controls

**Files:**
- Create: `frontend/src/components/Twin/ScenarioControls.tsx`
- Test: `frontend/src/components/Twin/__tests__/ScenarioControls.test.ts`

**Interfaces:**
- Consumes: `ScenarioState`, `WeatherMode` from `types/twin.ts`
- Produces: `<ScenarioControls mode={mode} scenario={scenario} onChange={setScenario} onReset={resetToLive} />`

- [ ] **Step 1: Write the failing test**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioControls } from '../ScenarioControls';

describe('ScenarioControls', () => {
    it('hides or disables controls when mode is live', () => {
        render(<ScenarioControls mode="live" scenario={defaultScenario} onChange={jest.fn()} onReset={jest.fn()} />);
        // Assert controls are disabled or hidden
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ScenarioControls.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `ScenarioControls`**

Implement sliders for Rainfall (mm/hr, 0-100), Temp delta (°C, -10 to +15), Duration (hrs, 1-24), and a Location picker. Include client-side bounds (min/max/step) to prevent nonsensical inputs. Include a Reset-to-live button. Hide or disable all when `mode === "live"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ScenarioControls.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Twin/ScenarioControls.tsx frontend/src/components/Twin/__tests__/ScenarioControls.test.ts
git commit -m "feat: add digital twin scenario controls"
```

### Task 4: Digital Twin Page Assembly

**Files:**
- Create: `frontend/src/pages/TwinPage.tsx`
- Test: `frontend/src/pages/__tests__/TwinPage.test.ts`

**Interfaces:**
- Consumes: `useTwinSimulation`, `ModeBanner`, `ModeToggle`, `ScenarioControls`
- Produces: The default exported `TwinPage` component.

- [ ] **Step 1: Write the failing test**

```typescript
import { render, screen } from '@testing-library/react';
import TwinPage from '../TwinPage';

describe('TwinPage', () => {
    it('disables write actions app-wide via a context flag or prop when simulated', () => {
        // Render TwinPage in simulated mode
        // Assert that booking buttons are disabled with visible reason
    });

    it('shows explicit empty state if no resources match under extreme scenario', () => {
        // Mock hook to return success with 0 resources
        // Assert "No available resources" message appears
    });
    
    it('gracefully handles live weather fetch failure', () => {
        // Mock hook to return liveWeatherStatus error
        // Assert page still loads and allows switching to simulated mode
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TwinPage.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `TwinPage`**

Assemble the components. Provide a context flag `isSimulatedMode` to disable any write/booking actions globally inside this route. Integrate placeholders or existing components for the Map panel, Result cards (with delta badges if simulated), Narrative panel (separate loading state), and Social signal panel. Ensure the page does not crash if live weather fetching fails (fallback to allowing simulated mode). 

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- TwinPage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/TwinPage.tsx frontend/src/pages/__tests__/TwinPage.test.ts
git commit -m "feat: assemble digital twin page"
```
