# Mobile Swipe Card Flip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore reliable mobile left/right swipe navigation and add restrained paper-card flip animations for note transitions.

**Architecture:** Keep the existing single-file app and reuse the current `showPreviousNote()` / `showNextNote()` navigation. Add a more resilient gesture state machine in `index.html`, plus CSS keyframes/classes that animate the existing `quoteWrap` content layer without changing storage, sync, CSV import, or reading-record logic.

**Tech Stack:** Single-page HTML, CSS keyframes, vanilla JavaScript pointer/touch events, existing IndexedDB/storage logic.

---

### Task 1: Card Flip CSS

**Files:**
- Modify: `index.html`

- [x] **Step 1: Add flip-friendly card styles**

Add CSS so `#readingCard` has perspective and `#quoteWrap` can animate with 3D transforms:

```css
#readingCard {
  perspective: 1100px;
  overflow: hidden;
}

#quoteWrap {
  transform-origin: center;
  transform-style: preserve-3d;
  will-change: transform, opacity, filter;
}
```

- [x] **Step 2: Replace directional swap animations**

Use `cardFlipNext` and `cardFlipPrevious` for navigation while keeping `quoteSwap` for random:

```css
.quote-swap-next {
  animation: cardFlipNext 420ms cubic-bezier(0.2, 0.74, 0.22, 1) both;
}

.quote-swap-previous {
  animation: cardFlipPrevious 420ms cubic-bezier(0.2, 0.74, 0.22, 1) both;
}
```

- [x] **Step 3: Add keyframes**

```css
@keyframes cardFlipNext {
  from { opacity: 0; transform: translateX(34px) rotateY(-10deg) scale(0.985); filter: blur(1.2px); }
  58% { opacity: 1; }
  to { opacity: 1; transform: translateX(0) rotateY(0) scale(1); filter: blur(0); }
}

@keyframes cardFlipPrevious {
  from { opacity: 0; transform: translateX(-34px) rotateY(10deg) scale(0.985); filter: blur(1.2px); }
  58% { opacity: 1; }
  to { opacity: 1; transform: translateX(0) rotateY(0) scale(1); filter: blur(0); }
}
```

### Task 2: Gesture State Machine

**Files:**
- Modify: `index.html`

- [x] **Step 1: Add state constants**

Near `let swipeStart = null;`, add:

```js
let isAnimatingCard = false;
const SWIPE_TRIGGER_PX = 52;
const SWIPE_AXIS_RATIO = 1.25;
```

- [x] **Step 2: Add gesture helpers**

Add helpers:

```js
function getGesturePoint(event) {
  const point = event.changedTouches?.[0] || event.touches?.[0] || event;
  return { x: point.clientX, y: point.clientY };
}

function canStartSwipe(event) {
  return !isSettingsOpen() && notes.length && !isAnimatingCard && !event.target.closest("button, input, textarea, select, a, summary");
}

function resetSwipe() {
  swipeStart = null;
}
```

- [x] **Step 3: Rewrite start/move/end**

Use `beginSwipe`, `moveSwipe`, and `endSwipe` so horizontal gestures are captured while vertical scroll remains available:

```js
function beginSwipe(event) {
  if (!canStartSwipe(event) || event.pointerType === "mouse") return;
  const point = getGesturePoint(event);
  swipeStart = { x: point.x, y: point.y, currentX: point.x, currentY: point.y, pointerId: event.pointerId, horizontal: false };
  try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch {}
}

function moveSwipe(event) {
  if (!swipeStart || (event.pointerId && swipeStart.pointerId !== event.pointerId)) return;
  const point = getGesturePoint(event);
  swipeStart.currentX = point.x;
  swipeStart.currentY = point.y;
  const deltaX = point.x - swipeStart.x;
  const deltaY = point.y - swipeStart.y;
  if (!swipeStart.horizontal && Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_AXIS_RATIO) {
    swipeStart.horizontal = true;
  }
  if (swipeStart.horizontal) event.preventDefault();
}

function endSwipe(event) {
  if (!swipeStart || (event.pointerId && swipeStart.pointerId !== event.pointerId)) {
    resetSwipe();
    return;
  }
  const point = getGesturePoint(event);
  const deltaX = point.x - swipeStart.x;
  const deltaY = point.y - swipeStart.y;
  const horizontal = Math.abs(deltaX) >= SWIPE_TRIGGER_PX && Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_AXIS_RATIO;
  resetSwipe();
  if (!horizontal) return;
  if (deltaX < 0) showPreviousNote("swipe-previous");
  else showNextNote("swipe-next");
}
```

### Task 3: Animation Lock

**Files:**
- Modify: `index.html`

- [x] **Step 1: Lock during directional transitions**

In `displayNoteAt()`, before adding animation classes:

```js
if (animation === "next" || animation === "previous") {
  isAnimatingCard = true;
}
```

After adding the animation class:

```js
window.setTimeout(() => {
  isAnimatingCard = false;
}, animation === "next" || animation === "previous" ? 450 : 360);
```

- [x] **Step 2: Guard navigation**

At the top of `switchToNote()`:

```js
if (isAnimatingCard) return;
```

### Task 4: Wire Events

**Files:**
- Modify: `index.html`

- [x] **Step 1: Replace pointer handlers**

Replace old pointer event listeners:

```js
elements.readingCard.addEventListener("pointerdown", beginSwipe);
elements.readingCard.addEventListener("pointermove", moveSwipe);
elements.readingCard.addEventListener("pointerup", endSwipe);
elements.readingCard.addEventListener("pointercancel", resetSwipe);
```

- [x] **Step 2: Add touch fallback**

```js
elements.readingCard.addEventListener("touchstart", beginSwipe, { passive: true });
elements.readingCard.addEventListener("touchmove", moveSwipe, { passive: false });
elements.readingCard.addEventListener("touchend", endSwipe, { passive: true });
elements.readingCard.addEventListener("touchcancel", resetSwipe, { passive: true });
```

### Task 5: Verification

**Files:**
- Modify: `index.html`

- [x] **Step 1: Script syntax check**

Run:

```powershell
node -e "const fs=require('fs'); const html=fs.readFileSync('index.html','utf8'); const scripts=[...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]); scripts.forEach((code)=>new Function(code)); console.log(JSON.stringify({scripts:scripts.length,ok:true}));"
```

Expected: `{"scripts":2,"ok":true}`

- [x] **Step 2: Static gesture check**

Run:

```powershell
rg "beginSwipe|moveSwipe|endSwipe|touchstart|cardFlipNext|cardFlipPrevious|SWIPE_TRIGGER_PX" index.html
```

Expected: all symbols appear.

- [ ] **Step 3: Commit**

Run:

```powershell
git --git-dir=_git --work-tree=. add index.html docs/superpowers/plans/2026-05-30-mobile-swipe-card-flip.md
git --git-dir=_git --work-tree=. -c user.name="Codex" -c user.email="codex@example.local" commit -m "fix: restore mobile swipe card flip"
```
