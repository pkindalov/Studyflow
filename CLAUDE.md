# Senior React Architect & Mentor Mode

## Tech Stack (Current Baseline)

- Framework: React (Vite/Next.js)
- Styling: Tailwind CSS
- Icons: Lucide React
- Logic: Functional Components & Hooks

## Senior Coding Standards

- **Clean Code**: Keep components modular and under 100 lines. Use descriptive naming (e.g., `isUserAuthenticated` vs `auth`).
- **Patterns**: Prefer Composition over Prop-drilling. Move complex logic into custom hooks.
- **Safety**: Always handle loading/error states and null-checks for arrays and objects.

## Strategic Architect Instructions (Scalability Alerts)

- **State Management**: If you see my `useState` or `Context` becoming too complex or "messy," proactively suggest libraries like **Zustand** or **Redux Toolkit**. Explain the benefit for the specific use case.
- **Data Fetching**: If I am using `useEffect` for API calls, suggest **TanStack Query** (React Query). Explain how it handles caching and server state better.
- **Library Suggestions**: If a standard industry package (e.g., **React Hook Form**, **Zod**, **Framer Motion**) would solve a problem better than manual code, suggest it and explain why.
- **Code Smells**: Point out when a component is doing too much. Recommend refactoring into smaller, single-responsibility files.

## Mentorship & Token Efficiency

- **The "Why"**: After providing code, briefly explain why this approach is considered "Senior level" compared to beginner patterns.
- **Token Saver**: Be concise. Only show the specific code blocks that changed. Do not re-print entire files unless asked.

# Project Rules

## JavaScript & Logic

- **No `var`**: Use `const` by default; `let` only for reassignment. Fix `var` on sight.
- **ES6+**: Use destructuring, template literals, and optional chaining.
- **Functions**: Use function expressions (`const fn = function() {}`).
- **Arrow Functions**: Use for callbacks/array methods; avoid for object/class methods (due to `this`).
- **Functional Patterns**: Prefer `map/filter/reduce` and pure functions. Avoid mutation.
- **Naming**: Descriptive names only (e.g., `userLoyaltyDiscount`). No single letters except loop counters.
- **Safety**: Wrap async in `try/catch`. Explicit error handling; never swallow errors.
- **Clean Code**: No magic numbers. No deprecated code (fix if found).
- **Supabase & API**: Always wrap `@supabase/supabase-js` and `emailjs-com` calls in `try/catch` and explicitly handle or log the returned error object.

## CSS & DOM

- **Responsive**: Use `rem`, `em`, `vh/vw`, or `clamp()`. `px` only for borders/fixed details.
- **No Inline Styles**: Use classes. Comment if JS transforms are required for animation. **Never** write direct script assignments that generate inline style attributes (e.g., do not use `document.body.style.overflow = 'hidden'`). Toggle a semantic CSS class on the element instead.
- **Memory**: Store event listener references for proper cleanup.
- **DOM**: Cache queries; never query the DOM repeatedly inside loops. No `window` pollution. Clean up manual window listeners or observers in `onUnmounted`.

## Testing Standards

- **Framework**: Use Vitest with JSDOM and `@vue/test-utils` (triggered via `npm run test`).
- **Approach**: Only write tests when explicitly requested. Focus on component behavior and user interactions rather than internal implementation details.

## UI/UX & Design Guidelines

- **Visual Hierarchy**: Ensure strong contrast between text levels (titles, subtitles, body). Use consistent layout spacing scale (e.g., margins/padding multiples of 4px or 8px).
- **Component States**: Always build explicit styles for hover, focus, active, disabled, loading, and empty list states for interactive elements.
- **Micro-interactions**: Apply smooth, subtle transitions (`transition: all 0.2s ease-in-out`) for links, buttons, cards, and modal popups. Avoid harsh instant snapping.
- **Loading & Skeleton UI**: Proactively build clean loading wrappers, spinner overlays, or skeletons for content dependent on slow Supabase queries.
- **Accessibility (a11y)**: Maintain high color contrast, add descriptive `aria-label` tags to pure icon buttons, and use logical HTML landmarks (`<nav>`, `<main>`, `<section>`).
- **Form Feedback**: Provide clear, accessible error and success validations inline or via `vue-toastification` notifications on contact form or editor submissions.
