# Project Guidelines

- Before adding reusable UI logic, inspect and reuse existing components and helpers. Confirmation flows should use `react-frontend/src/components/common/ConfirmationModal.jsx` (which delegates to `DeleteConfirmationModal.jsx`) rather than adding duplicate confirmation hooks or components.
- Keep explicit import extensions consistent with the actual file extension; verify frontend imports with the production build.
