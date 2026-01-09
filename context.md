# Project Context & Conventions

## Coding Conventions

### Variable Naming
- **All variables must start with a lowercase letter**
- **Multi-word variables use camelCase** (second word and subsequent words start with capital letters)
- Examples:
  - `startAt` ✅
  - `endDate` ✅
  - `totalVotes` ✅
  - `dummyPolls` ✅
  - `pollCard` ✅
  - `homeHeader` ✅

**Incorrect examples:**
- `StartAt` ❌ (starts with capital)
- `end_date` ❌ (uses underscores)
- `end-date` ❌ (uses hyphens)

## CSS Styling Guidelines

### Theme: Monkeytype-Inspired Dark Theme
All CSS throughout the project should follow the homepage styling theme with the following color palette:

#### Color Palette
- **Primary Background (Black)**: `#1a1a1a`
- **Secondary Background (Dark Grey)**: `#2a2a2a` (for cards, navbar, forms)
- **Primary Text**: `#cccccc` (light grey)
- **Secondary Text**: `#999` (medium grey)
- **Accent Color (Yellow)**: `#ffcd29` (for highlights, titles, important elements)
- **Hover Yellow**: `#ffd84d` (lighter yellow for hover states)
- **Borders**: `#444` (dark grey borders)
- **Active Status (Green)**: `#28a745` with `rgba(40, 167, 69, 0.2)` background
- **Closed Status (Red)**: `#dc3545` with `rgba(220, 53, 69, 0.2)` background

#### Key Styling Patterns

**Backgrounds:**
- Body/main background: `#1a1a1a`
- Cards, forms, navbar: `#2a2a2a`
- Input fields: `#1a1a1a` with `#444` borders
- Option items/lists: `#333` background

**Text Colors:**
- Headings/titles: `#ffcd29` (yellow) for primary headings, `#cccccc` for section titles
- Body text: `#cccccc`
- Secondary/descriptive text: `#999`
- Links: `#ffcd29` with hover `#ffd84d`

**Buttons:**
- Primary buttons: `#ffcd29` background with `#1a1a1a` text
- Hover state: `#ffd84d` background
- Disabled: `#666` background with `#999` text

**Borders:**
- Standard borders: `1px solid #444`
- Focus borders: `1px solid #ffcd29` with `rgba(255, 205, 41, 0.25)` box-shadow

**Status Indicators:**
- Active/Open: Green (`#28a745`) with semi-transparent green background
- Closed: Red (`#dc3545`) with semi-transparent red background

**Shadows:**
- Card shadows: `0 2px 4px rgba(0, 0, 0, 0.3)`
- Hover shadows: `0 4px 8px rgba(255, 205, 41, 0.2)` (with yellow tint)

### Reference Files
- **Homepage Styles**: `frontend/src/components/HomeStyles.css` - This is the reference implementation
- **Global Styles**: `frontend/src/AppStyles.css`
- **Navbar Styles**: `frontend/src/components/NavBarStyles.css`
- **Auth Styles**: `frontend/src/components/AuthStyles.css`

When creating new components or styling, always reference the homepage styles to maintain consistency.

## Project Structure

### Frontend
- **Framework**: React with React Router
- **Location**: `frontend/src/`
- **Main App**: `frontend/src/App.jsx`
- **Components**: `frontend/src/components/`
- **Styling**: Component-specific CSS files (e.g., `HomeStyles.css`, `NavBarStyles.css`)

### Backend
- **Location**: `backend/`
- **API**: `backend/api/`
- **Authentication**: `backend/auth/`
- **Database**: `backend/database/`

## Current Features

- Homepage with "Ranked Voting" title
- Dummy poll cards displaying:
  - Poll title and description
  - Options list
  - Vote count
  - Status (active/closed) with color indicators
  - End dates (closes on/closed on)
- Navbar with Login and Sign Up links
- Authentication pages (Login/Signup)
- Dark theme applied across all components

## Testing

- Tests should be run every time something is changed
- Tests must pass before considering work complete
- If functionality lacks tests, tests should be created for it

