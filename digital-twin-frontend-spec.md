# Digital Twin Simulation — Frontend Implementation Spec

Scope: this is a **frontend-only** feature. It consumes `GET /weather/current`
and `POST /twin/simulate` (already specced) and never writes to real data.
No backend changes are covered here.

---

## 1. Hard boundary: what this page must never do

These aren't nice-to-haves — violating any of these breaks the "simulate
without affecting the actual system" requirement, which is judged directly.

- **Never call a write endpoint while in simulated mode.** Booking, request
  creation, listing edits — all disabled/hidden while `mode === "simulated"`.
  Don't just hide the button; disable it with a visible reason
  (`"Booking disabled — viewing a simulated scenario"`), because a hidden
  disabled action reads as a bug, a visibly disabled one reads as a feature.
- **Never persist simulated results as if they were real state.** No writing
  simulated `matchScore` back into whatever local cache/store holds the real
  search results. Keep simulated results in a separate piece of state that's
  discarded when the toggle flips off or the component unmounts.
- **Never let the two modes look visually identical.** A judge (or a real
  user) must be able to tell at a glance which mode they're in. This is a
  guardrail, not a polish item.

---

## 2. Page structure

```
/twin (or a tab/panel inside an existing page — either works, but if it's a
       standalone route, link to it from the main dashboard nav so it isn't
       hidden)

┌─────────────────────────────────────────────────────────┐
│  Mode banner (persistent, top of page)                   │
│  "🟢 Live conditions" | "🟠 Simulated scenario — no real  │
│   bookings affected"                                      │
├─────────────────────────────────────────────────────────┤
│  Toggle: Live ⇄ Simulated                                 │
│  [Simulated controls — hidden/disabled when Live]         │
│    - Rainfall intensity slider (mm/hr)                    │
│    - Temp delta slider (°C)                                │
│    - Duration slider (hrs)                                 │
│    - Location picker (defaults to user's current search    │
│      location / last requirement)                          │
│    - Reset-to-live button                                  │
├─────────────────────────────────────────────────────────┤
│  Map panel — weather overlay + affected resource pins      │
├─────────────────────────────────────────────────────────┤
│  Result cards — reused from search results, with delta     │
│  badges added                                               │
├─────────────────────────────────────────────────────────┤
│  Narrative panel (LLM explanation) — loads independently,   │
│  separate skeleton from the result cards                    │
├─────────────────────────────────────────────────────────┤
│  Social signal panel (small, non-blocking)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. State model

Keep three cleanly separated pieces of state — mixing them is where most of
the edge-case bugs below come from.

```ts
type WeatherMode = "live" | "simulated";

interface TwinPageState {
  mode: WeatherMode;

  // Slider inputs — only meaningful when mode === "simulated"
  scenario: {
    rainfall_mm_per_hr: number;   // 0–100, default 0
    temp_delta_c: number;         // -10–+15, default 0
    duration_hrs: number;         // 1–24, default 3
    location: { lat: number; lng: number };
  };

  // Live weather — fetched once on mount + polled every 10 min
  liveWeather: WeatherSnapshot | null;
  liveWeatherStatus: "idle" | "loading" | "success" | "error";

  // Simulation result — cleared whenever mode flips to "live"
  simResult: TwinSimulateResponse | null;
  simStatus: "idle" | "loading" | "success" | "error";

  // Narrative loads separately and later than the numeric result
  narrativeStatus: "idle" | "loading" | "success" | "error";

  // In-flight request tracking, for cancellation (see §5)
  activeRequestId: number;
}
```

Do **not** store `simResult` and live search results in the same array/store.
Keep the existing `seeker/search` results untouched in their own state;
the twin page renders its own result list, sourced from `simResult` OR
`liveWeather`-derived baseline, never a merge of both.

---

## 4. Component breakdown

```
<TwinPage>
 ├─ <ModeBanner mode />
 ├─ <ModeToggle mode onChange />
 ├─ <ScenarioControls>                    (disabled/hidden when mode=live)
 │    ├─ <RainfallSlider />
 │    ├─ <TempDeltaSlider />
 │    ├─ <DurationSlider />
 │    ├─ <LocationPicker />
 │    └─ <ResetToLiveButton />
 ├─ <WeatherMapOverlay
 │     conditions={mode === "live" ? liveWeather : simResult?.scenario}
 │     affectedResources={simResult?.resourceImpact.results}
 │     affectedRoutes={simResult?.logisticsImpact.routes} />
 ├─ <ImpactResultList
 │     results={...}
 │     showDeltaBadges={mode === "simulated"} />
 ├─ <NarrativePanel status={narrativeStatus} text={simResult?.narrative} />
 └─ <SocialSignalPanel location={scenario.location} />
```

A dedicated hook owns the request logic so components stay dumb:

```ts
function useTwinSimulation(scenario, mode) { ... }
// returns { simResult, simStatus, narrativeStatus, refetch }
```

---

## 5. Request lifecycle — the part most likely to break under demo conditions

This is the highest-risk area because a slider fires many events fast.

**Split into two calls, not one:**

1. **Scores call** — fires on every debounced slider `input` event
   (300–500ms debounce). Returns `resourceImpact` + `logisticsImpact` only.
   Cheap, fast, no LLM involved.
2. **Narrative call** — fires only on slider `change`/release (or after the
   scores call settles and the user hasn't moved the slider for ~1s).
   This is the one LLM call. Don't regenerate a sentence 20 times while
   someone drags a slider.

If your backend only exposes one combined endpoint, fine — but on the
frontend, ignore/discard the `narrative` field from intermediate responses
and only render it from the response that corresponds to the settled value.

**Cancellation is mandatory, not optional:**

```ts
const controllerRef = useRef<AbortController | null>(null);

async function runSimulation(scenario) {
  controllerRef.current?.abort();           // cancel any in-flight call
  const controller = new AbortController();
  controllerRef.current = controller;

  const requestId = ++activeRequestIdRef.current;
  setSimStatus("loading");

  try {
    const res = await fetch("/api/v1/twin/simulate", {
      method: "POST",
      signal: controller.signal,
      body: JSON.stringify({ ...scenario, isSimulated: true }),
    });
    const data = await res.json();

    // Stale-response guard — see edge case below
    if (requestId !== activeRequestIdRef.current) return;

    setSimResult(data);
    setSimStatus("success");
  } catch (err) {
    if (err.name === "AbortError") return;   // expected, not an error
    setSimStatus("error");
  }
}
```

Without the `requestId` check, a slow early response arriving after a fast
later one will overwrite newer results with stale ones — this is the #1
source of "the numbers don't match the slider position" bugs in a live demo.

---

## 6. Guardrails

| Guardrail | Why | Implementation |
|---|---|---|
| Slider bounds enforced client-side | Prevent nonsensical inputs (negative rain, 500°C) even before backend validation | `min`/`max`/`step` on the slider input, disable manual text entry or clamp on blur |
| Simulated mode never touches booking/write flows | Core requirement — twin must not affect real system | Disable write actions app-wide via a context flag (`isSimulatedMode`) rather than per-button, so a new feature added later doesn't accidentally slip through |
| Debounce + cancel in-flight requests | Slider fires fast; avoid request pile-up and stale-response races | §5 above |
| Distinguish "no data yet" from "zero impact" | A rainfall=0 simulated result legitimately equals baseline — don't show an empty state for it | Check `simStatus === "success"` before rendering, not just truthiness of `simResult` |
| Visually distinct mode at all times | Judge/user must never mistake simulated for live | Persistent banner (§2), consider a subtle background tint or border on the whole panel, not just a small badge |
| Weather API failure doesn't block the page | Live weather is one of several inputs, not a hard dependency of the whole page | `liveWeatherStatus === "error"` → show a small inline warning, keep toggle usable; if toggle is on "live" and it fails, offer to switch to simulated instead of showing a dead page |
| Graceful LLM/narrative failure | Narrative is decoration on top of the numeric result, not load-bearing | Numeric results (scores, ETA, cost) render independently of narrative status; narrative panel shows its own skeleton/error, never blocks the rest |
| Reset path always available | Users (and judges) will want to get back to a known-good state fast | `ResetToLiveButton` sets `mode = "live"` and clears `scenario` to defaults in one action |
| No cross-tab/cross-user state leakage | Simulated scenario is local to this session only | Keep `TwinPageState` in component/local state (or a scoped store), not in any shared/global cache that other pages or users read from |
| Rate-limit protection on your side too | Free-tier weather API + LLM calls both have limits | Cache live weather client-side for its own TTL window (don't refetch on every render); the scores-vs-narrative split above already reduces LLM call volume significantly |

---

## 7. Edge cases to explicitly handle

| Edge case | Expected behavior |
|---|---|
| Slider at exactly 0 / defaults | Simulated result should equal (or be visibly near-identical to) the live baseline — a good self-check to run before demo day |
| Rapid slider dragging | Only the final settled value's results render; intermediate requests are cancelled, not queued |
| No resources match under extreme scenario | Explicit empty state ("No available resources under this scenario — try reducing intensity"), not a blank list that looks broken |
| Live weather fetch fails on page load | Page still loads; toggle defaults to simulated mode with a note, rather than a hard error screen |
| `/twin/simulate` times out or 5xxs | Show retry affordance on the result panel specifically, not a full-page error — the slider/controls should remain interactive |
| User changes location mid-scenario | Treat as a new scenario: cancel in-flight request, refetch live weather for new location, reset delta badges until new sim result arrives |
| Toggle flipped off mid-request | Abort the in-flight simulated request immediately; don't let it resolve and render after the user already switched back to live |
| Extreme values (rainfall at slider max) | Should still render a coherent result, not `NaN`/`Infinity` — verify backend's speed multiplier floor (already clamped at 0.5× in the earlier client code) actually reaches the frontend as a sane number, and clamp defensively on the frontend too before display |
| Map has many affected pins | Cluster markers rather than rendering 50+ individual pins that overlap at typical zoom levels |
| Narrative arrives after user already moved slider again | Discard it (same `requestId` staleness check as §5) — never show a narrative sentence that describes a scenario the slider no longer reflects |
| Mobile / narrow viewport | Sliders and map need to stack vertically without the result list becoming unreachable — test at your actual demo device width, not just desktop |
| Keyboard-only interaction | Slider must be operable via arrow keys; toggle must be a real `<button>`/`<switch>` with `aria-pressed`, not a styled `<div>` |
| Colorblind judges/users | Delta badges use icons/arrows (▲/▼) in addition to color, never color alone |

---

## 8. Demo-day rehearsal checklist

Judges will do exactly these things — walk through them yourself first:

1. Toggle on, drag rainfall to max immediately, release — does it settle
   correctly without stale data?
2. Drag back to 0 — does it match the live baseline?
3. Turn wifi/throttle network in devtools — does the page degrade instead
   of breaking?
4. Toggle off mid-loading-state — does the in-flight request get cancelled
   cleanly with no console errors or leaked state?
5. Resize to a phone width — is everything still usable?
