# 🚀 Spraya - Vue 3 Interview Cheat Sheet & Architecture Guide

Welcome! This guide is designed to help you confidently present **Spraya** during your technical interview. Since you come from a **React** background, every concept here is mapped directly to its React equivalent.

---

## 📌 1. Project Executive Overview (What is Spraya?)

**Spraya** is a cultural event payment link & reciprocal gifting ledger application built with **Vue 3 (Composition API)**, **Vite**, **Vue Router**, **Paystack Payment Gateway**, and **Google OAuth (GIS)**.

### Core Problem It Solves:
In African owambes and cultural events (weddings, milestone birthdays, burials, naming ceremonies), guests spray or gift cash to hosts. Spraya digitizes this tradition:
1. **Event Hosts** generate a centralized payment link with an optional target goal.
2. **Guests** open the link, sign in with Google, and pay securely via card/USSD/bank transfer via Paystack.
3. **Host Dashboard** tracks received funds and target goal progress bars in real-time.
4. **My Sent Gifts Dashboard** tracks all gifts sent out by a guest for future reciprocal owambes.

---

## 🔄 2. React vs. Vue 3 Side-by-Side Mental Model

| React Concept | Vue 3 Composition API Equivalent | How It Works in Spraya |
| :--- | :--- | :--- |
| `useState(val)` | `ref(val)` or `reactive({...})` | `ref()` holds primitive values (`ref(false)`). `reactive()` holds state objects (`reactive({ name: '' })`). In JS you access `ref.value`, but in Vue `<template>`, it auto-unwraps! |
| `useMemo(() => ...)` | `computed(() => ...)` | Evaluates a reactive getter and caches the result until dependencies change. Used in `PayEvent.vue` for `ngnAmount` and `goalProgress`. |
| `useEffect(() => ..., [deps])` | `watch()` or `watchEffect()` | `watchEffect()` auto-tracks dependencies used inside it. `watch(store, fn, { deep: true })` auto-saves the store to `localStorage`. |
| JSX (`return <div>...</div>`) | Vue SFC Templates (`<template>`) | Declarative template directives (`v-if`, `v-for`, `v-model`) instead of JavaScript `.map()` arrays or inline ternaries. |
| Controlled Inputs (`value` + `onChange`) | Two-Way Binding (`v-model`) | `<input v-model="form.name" />` syncs state and input DOM value automatically without manual `onChange` handlers. |
| Redux / Zustand / Context | `reactive()` Global Store | Exporting a single `reactive({...})` object from `store.js` creates a global store without Redux boilerplate. |
| `react-router-dom` | `vue-router` | Route configuration using `createRouter` and `<RouterView />` view slots. |

---

## 🏗️ 3. Key Architecture & File Structure

```
spraya/
├── src/
│   ├── main.js             # Vue App Mounting & Router plugin registration
│   ├── router.js           # Vue Router config (routes for Home, CreateEvent, PayEvent, HostDashboard, MySentGifts)
│   ├── store.js            # Global Reactive Store & LocalStorage persistence
│   ├── style.css           # Custom Owambe theme (CSS Variables, Typography, Responsive grid)
│   ├── App.vue             # Root layout with Sticky Bunting & Top Navbar
│   ├── components/
│   │   └── GoogleAuth.vue  # Google Identity Services (GIS) OAuth & profile pill
│   └── views/
│       ├── Home.vue          # Landing page with hero & CTAs
│       ├── CreateEvent.vue   # Host event creation form with live preview
│       ├── PayEvent.vue      # Public guest payment link screen with Paystack integration
│       ├── HostDashboard.vue # Host dashboard showing received funds & target goal progress
│       └── MySentGifts.vue   # Guest dashboard showing all gifts sent out
```

---

## 💡 4. Deep Dive into Vue 3 Concepts Used in Spraya

### A. Reactive Global State Store (`src/store.js`)
- **React comparison**: Similar to `Zustand` or React `Context` + `useReducer`, but without providers or dispatchers.
- **Implementation**:
  ```js
  export const store = reactive(savedLocalStorage || seedData);
  
  // Auto-save store to localStorage whenever any property changes
  watch(store, () => {
    localStorage.setItem('spraya-persistent-db-v1', JSON.stringify(store));
  }, { deep: true });
  ```

### B. Strict State Isolation (Host vs. Guest Dashboards)
- **`getHostEvents(userEmail)`**: Filters events created by `userEmail`.
- **`getHostLedger(userEmail)`**: Filters gifts `received` for events matching `userEmail`.
- **`getSentLedger(userEmail)`**: Filters gifts `sent` by `userEmail`.

### C. Live Currency Formatting & Words Helper
- **`fmt(50000)`** -> `₦50,000`
- **`fmtWords(5000000)`** -> `(5.00 Million Naira)`
- Provides real-time formatted feedback as users type amounts into form fields.

### D. Centralized Paystack Gateway Integration
- Integrates `PaystackPop.setup()` in `PayEvent.vue`.
- Upon payment confirmation, `recordGiftPayment()` creates matching `received` (Host) and `sent` (Guest) entries.

---

## 🎤 5. Top 10 Technical Interview Questions & Answers

### Q1: "How does Vue 3's reactivity system differ from React's state model?"
> **Answer**: React uses an explicit immutability model where state updates trigger component re-renders via `setState` / hooks. Vue 3 uses JavaScript **Proxies** under the hood. When you mutate a property on a `reactive()` object or `ref()`, Vue's proxy traps detect the change and re-evaluate only the template parts that depend on that specific property.

### Q2: "What is the difference between `ref` and `reactive` in Vue 3?"
> **Answer**: `ref()` is used for primitive data types (booleans, strings, numbers) or reassignable objects and requires `.value` when accessed in JavaScript. `reactive()` takes an object and turns its properties into reactive proxies. In Vue templates (`<template>`), `ref` automatically unwraps so you don't need `.value`.

### Q3: "What is `computed()` and how does it compare to React's `useMemo`?"
> **Answer**: `computed()` creates a read-only reactive reference based on a getter function. Just like React's `useMemo`, Vue automatically caches the computed result and only re-computes when its underlying reactive dependencies change. In Spraya, I used `computed()` for `ngnAmount` and `goalProgress`.

### Q4: "How did you manage state in Spraya without Vuex or Pinia?"
> **Answer**: In Vue 3, you can build a lightweight, centralized store using a single `reactive()` module. I exported `export const store = reactive({...})` in `store.js`. Any component can import `store` and mutate or read properties directly, and Vue's reactivity system automatically updates all consuming components.

### Q5: "How does two-way binding (`v-model`) work under the hood?"
> **Answer**: `v-model` is syntactic sugar. In React, you manually write `value={state}` and `onChange={(e) => setState(e.target.value)}`. In Vue, `v-model="form.name"` automatically binds the input's `:value` and listens to the `@input` event to update the state variable.

### Q6: "How do `watch` and `watchEffect` compare to React's `useEffect`?"
> **Answer**: React's `useEffect` requires an explicit dependency array `[dep1, dep2]`. Vue's `watchEffect()` automatically tracks whichever reactive properties are accessed inside its callback. `watch()` allows explicitly watching a target property or object with options like `{ deep: true }`, which I used to auto-save the store to `localStorage`.

### Q7: "How did you structure routing in this application?"
> **Answer**: I used `vue-router` with `createWebHistory()`. Routes map path strings (e.g. `/pay/:id`, `/host-dashboard`, `/my-sent-gifts`) to lazy-loaded view components (`component: () => import('./views/PayEvent.vue')`). Navigation is handled using `<RouterLink to="...">` and the active page renders inside `<RouterView />`.

### Q8: "How did you prevent cross-user data leakage between Host and Guest dashboards?"
> **Answer**: I separated the getters in `store.js`. `getHostLedger(email)` filters received transactions matching `hostEmail`, while `getSentLedger(email)` filters sent transactions matching `personEmail`. This ensures a user donating money to someone else's event sees it in their "My Sent Gifts" dashboard, not their Host Dashboard.

### Q9: "How did you handle authentication in Spraya?"
> **Answer**: I integrated **Google Identity Services (GIS)** OAuth. In `GoogleAuth.vue`, when the user signs in with Google, we decode the JWT credential payload (`atob`) to extract the user's name, email, and Google profile picture, storing them in `store.user`.

### Q10: "How did you implement event deletion safely?"
> **Answer**: In `store.js`, `deleteEvent(eventId)` removes the event from `store.events` and cleans up related ledger items. Since `store` is wrapped in a `watch` effect with `{ deep: true }`, deleting an event immediately updates `localStorage`, ensuring the deletion persists across reloads.

---

## 🎯 Final Quick Tip for Your Interview
- Emphasize that **Vue 3 Composition API** (`<script setup>`) feels very natural to a React developer because it organizes code by **logical feature** rather than options objects.
- Highlight your understanding of **HTML Template Directives** (`v-if`, `v-for`, `v-model`) vs **JSX**.
- Mention how **Paystack Gateway Integration** and **Google OAuth** complete the end-to-end production workflow.

Good luck with your interview tomorrow! You've got this! 🚀
