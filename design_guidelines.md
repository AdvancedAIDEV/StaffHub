# Design Guidelines: Online Staffing Services Platform

## Design Approach

**Selected Approach**: Design System (Utility-Focused)

**Justification**: This is a productivity and workforce management application where efficiency, clarity, and learnability are paramount. Users (both admins and staff) need to quickly access schedules, track time, and manage events without visual distraction.

**Primary References**: 
- **Linear** - Clean, modern interface with excellent data density and navigation
- **Notion** - Accessible forms and content management patterns
- **Asana** - Task/event organization and list views

**Key Design Principles**:
1. Information clarity over visual flair
2. Consistent patterns for rapid learning
3. Mobile-first for staff, desktop-optimized for admin
4. Clear visual hierarchy for status states (confirmed, pending, available)

---

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Primary: 240 85% 55% (Professional blue for actions, confirmed shifts)
- Secondary: 220 15% 35% (Charcoal for text and headings)
- Success: 145 65% 45% (Green for confirmed/accepted states)
- Warning: 35 90% 55% (Amber for pending/awaiting response)
- Danger: 0 75% 55% (Red for cancelled/rejected)
- Background: 0 0% 98% (Soft white)
- Surface: 0 0% 100% (Pure white for cards)
- Border: 220 15% 90% (Light grey dividers)

**Dark Mode**:
- Primary: 240 85% 60% (Slightly brighter blue)
- Secondary: 220 10% 85% (Light grey text)
- Success: 145 60% 50% (Brighter green)
- Warning: 35 95% 60% (Brighter amber)
- Danger: 0 70% 60% (Brighter red)
- Background: 220 15% 10% (Deep charcoal)
- Surface: 220 12% 14% (Elevated surface)
- Border: 220 15% 22% (Subtle borders)

### B. Typography

**Font Families**:
- Primary: Inter (Google Fonts) - UI elements, body text
- Monospace: JetBrains Mono - Time displays, employee IDs, codes

**Type Scale**:
- Headings: font-semibold (600 weight)
  - H1: text-3xl lg:text-4xl
  - H2: text-2xl lg:text-3xl
  - H3: text-xl lg:text-2xl
- Body: font-normal (400 weight)
  - Large: text-base
  - Regular: text-sm
  - Small: text-xs
- Labels/Caps: text-xs uppercase tracking-wide font-medium

### C. Layout System

**Spacing Primitives**: We will use Tailwind units of **2, 4, 8, 12, 16, 20, 24** for consistent spacing.
- Micro spacing (gaps, padding within components): p-2, gap-2, space-x-2
- Component internal spacing: p-4, gap-4
- Section spacing: py-8, px-8, gap-8
- Major section divisions: py-12, mt-16, gap-12
- Page-level spacing: py-20, px-4 lg:px-20

**Grid System**:
- Admin Dashboard: 12-column grid with sidebar (col-span-3) + main content (col-span-9)
- Staff Mobile: Single column, full-width cards
- Event Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Calendar Views: 7-column weekly grid

**Container Constraints**:
- Admin panels: max-w-7xl mx-auto
- Form content: max-w-2xl
- Reading content: max-w-prose

### D. Component Library

**Navigation**:
- Admin: Fixed sidebar with icon + label navigation (w-64)
- Staff: Bottom tab bar (mobile) with 4-5 primary actions
- Breadcrumbs: For deep admin navigation (text-sm with chevron separators)

**Data Display**:
- Event Cards: Rounded corners (rounded-lg), shadow-sm, with status badge, venue icon, date/time, staff count
- Staff List: Avatar + name + role + status indicator in horizontal layout
- Calendar: Full calendar grid with color-coded event blocks, hover states showing event details
- Tables: Striped rows (even:bg-gray-50 dark:even:bg-gray-800), sticky headers, sortable columns with caret icons

**Forms**:
- Input Fields: Consistent height (h-10), rounded-md, border with focus ring (ring-2 ring-primary)
- Dropdowns: Custom styled with Heroicons chevron-down
- Date/Time Pickers: Calendar popup with time selection
- Toggle Switches: For availability, notifications (w-11 h-6)
- File Upload: Drag-and-drop zone with upload icon

**Status Indicators**:
- Badges: Small, rounded-full px-2 py-1 text-xs
  - Confirmed: bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200
  - Pending: bg-amber-100 text-amber-800
  - Available: bg-blue-100 text-blue-800
  - Cancelled: bg-red-100 text-red-800
- Status Dots: w-2 h-2 rounded-full for compact displays

**Buttons**:
- Primary: bg-primary text-white rounded-md px-4 py-2
- Secondary: bg-gray-200 dark:bg-gray-700 rounded-md px-4 py-2
- Outline: border-2 border-primary text-primary (use with backdrop-blur-sm on images)
- Icon Only: p-2 rounded-md hover:bg-gray-100

**Cards & Containers**:
- Standard Card: bg-white dark:bg-surface rounded-lg shadow-sm p-6 border border-border
- Stat Card: With large number (text-3xl font-bold), label below (text-sm text-gray-600)
- Message Bubble: Different bg for sender/receiver, rounded-2xl, max-w-md

**Modals & Overlays**:
- Modal: Centered, max-w-lg, rounded-xl, shadow-2xl with backdrop-blur
- Slide-over: Fixed right-0, w-96, h-full for detailed views
- Toast Notifications: Fixed top-right, slide-in animation, auto-dismiss

**Icons**: 
- Library: Heroicons (outline for general UI, solid for active states)
- Size: w-5 h-5 for inline, w-6 h-6 for buttons, w-8 h-8 for feature highlights

### E. Interaction & Animation

**Use Sparingly**:
- Page transitions: Simple fade-in (duration-200)
- Dropdown menus: slide-down with fade (duration-150)
- Success feedback: Brief scale animation on confirmation (scale-105 duration-200)
- Loading states: Skeleton screens with subtle pulse animation

**Avoid**:
- Unnecessary hover animations on cards
- Overly complex transitions between views
- Decorative animations that distract from task completion

---

## Images

**Admin Dashboard**:
- No hero image needed - dashboard is utility-focused
- Staff profile photos: Circular avatars (w-10 h-10 rounded-full)
- Venue placeholder images: In event cards if available (aspect-video, rounded-t-lg)

**Staff Mobile App**:
- No hero image - focus on immediate schedule view
- Event venue photos: Optional in event detail view (aspect-video, rounded-lg, mb-4)

**Marketing/Landing Page** (if created separately):
- Hero image: Photo of diverse staff team in professional attire at an event, full-width, aspect-[21/9], with text overlay and blurred button backgrounds
- Feature sections: Small supporting images (aspect-square, w-24 h-24, rounded-lg) showing app screenshots in mockup devices

---

## Key Interface Patterns

**Admin Dashboard Home**: Quick stats (4 cards), upcoming events list, staff availability calendar, recent activity feed

**Event Creation Flow**: Multi-step form with progress indicator, venue details, shift configuration, staff assignment selector (with filtering by availability/role)

**Schedule View (Staff)**: Week/month toggle, color-coded event blocks, tap to view details, swipe actions for quick accept/decline

**Time Tracking**: Large clock-in/out button, current shift timer, automatic hour calculation display, photo verification option

**Messaging**: Chat-style interface with timestamps, read receipts, typing indicators

**Performance Reviews**: Star rating display, comment threads, filterable by date range

This design system prioritizes **clarity, efficiency, and mobile accessibility** while maintaining a modern, professional aesthetic appropriate for workforce management software.