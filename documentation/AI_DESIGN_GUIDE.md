# AI Design Internal Guidelines - Racoon LMS

## 1. Project Philosophy

Racoon LMS is a **PWA-first**, **Mobile-First** Learning Management System focusing on a premium, high-performance user experience.

- **"Wow" Factor**: Every view must look polished. No generic Bootstrap/Material default looks.
- **Glassmorphism & Gradients**: Use subtle backgrounds, blurred cards (`backdrop-blur`), and soft gradients.
- **Micro-interactions**: Hover effects, smooth transitions between states.

## 2. Architecture & Code Quality

- **Atomic Design**: Small, single-purpose components.
- **Features Folder**: Logic specific to a domain stays in `src/features/<domain>`.
- **Shared Folder**: Universal UI components and helpers stay in `src/shared`.
- **No Spaghetti**: Break down large components (> 300 lines is a warning sign).
- **Separation of Concerns**: Logic (Hooks/Services) needs to be separate from View (JSX).

## 3. Database (Appwrite)

- **Constraint-First**: Always respect the constraints in `documentation/appwrite_db_racoon_lms.md`.
- **No Relationships**: We manage FKs manually via strings (e.g., `courseId`), no native Appwrite relationships.
- **Collections**: Use the collection IDs provided in `.env`.

## 4. Mobile First & PWA

- **Safe Area**: Respect top/bottom safe areas (for iPhone notch/home bar).
- **Touch Targets**: Buttons/inputs must be tappable (min 44px height recommeded).
- **Responsiveness**: Always test grid cols `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

## 5. Localization (i18n)

- **No Hardcoded Text**: Use `t('namespace.key')`.
- **Structure**:
  - `src/i18n/locales/en`
  - `src/i18n/locales/es` (Default)

## 6. Theming

- **Dark Mode Default**: Review everything in dark mode first.
- **Variables**: Use CSS variables for colors (e.g., `var(--bg-card)`, `var(--text-primary)`).

## 7. AI Contribution Rules

- **Analyze First**: Read existing code before overwriting.
- **Preserve Context**: Don't break existing functionality when adding new features.
- **Documentation**: Update this guide or `README.md` if architectural patterns change.
