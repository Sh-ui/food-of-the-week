# Offline Functionality Audit

**Date:** December 10, 2025

**Status:** Completed ✅

## Current State

### What Works Offline

1. **Static Site Generation**

   - All content is pre-rendered at build time
   - Once a page is loaded, it's available in browser cache
   - No API calls needed for content

2. **Grocery List Persistence**

   - Checkbox states saved to `localStorage` with week-specific keys
   - Format: `grocery-list-week-of-[date]`
   - Persists across browser sessions
   - Works offline after initial page load
   - Supports both locally-checked (by user) and globally-checked (pre-checked in markdown) items

3. **Browser Caching**

   - Basic HTTP caching for static assets (CSS, fonts, images)
   - No custom cache control headers

### What Doesn't Work Offline

1. **No Service Worker**

   - Site cannot be accessed without internet connection
   - No offline fallback page
   - Cannot cache content for offline use

2. **No PWA Support**

   - No `manifest.json` for app installation
   - Cannot be added to home screen as standalone app
   - No app-like experience on mobile devices

3. **Google Fonts**

   - Fonts loaded from Google Fonts CDN
   - Won't load offline (falls back to system fonts)

4. **Navigation**

   - Archive pages not cached for offline browsing
   - No offline indicator in UI

## Recommendations

### Short-term Improvements (Phase 6)

1. **Add Service Worker**

   - Cache current week's content
   - Implement cache-first strategy for static assets
   - Add offline fallback page

2. **PWA Manifest**

   - Create `manifest.json` with app metadata
   - Enable "Add to Home Screen" functionality
   - Configure app icons and theme colors

3. **Font Strategy**

   - Self-host critical fonts or
   - Use `font-display: swap` with system font fallbacks

### Long-term Enhancements (Phase 8)

1. **Background Sync**

   - Queue grocery list changes when offline
   - Sync when connection restored

2. **Archive Caching**

   - Cache recently viewed archive pages
   - Implement LRU cache eviction

3. **Offline Indicator**

   - Show connection status in UI
   - Notify user when offline features are limited

## Technical Details

### localStorage Schema

```javascript
// Grocery list key format
const key = `grocery-list-${weekTitle.toLowerCase().replace(/\s+/g, '-')}`;

// Value format (JSON array of checked item keys)
["Produce::0::Organic red onion - 1", "Dairy::2::Heavy cream - 1 pint"]
```

### Item Key Format

```javascript
// Pattern: category::index::itemText
const itemKey = `${category}::${index}::${item}`;
```

## Dependencies for PWA Implementation

Would need to add:

- `workbox-*` packages for service worker generation
- Astro PWA integration (e.g., `@vite-pwa/astro`)
- Icon assets for various sizes

## Browser Support

Current localStorage implementation works in:

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Android)
- ✅ Private/Incognito mode (session-only)

Would need testing for:

- Service Worker support in older browsers
- iOS Safari PWA limitations
- Notification API support (for Phase 4 features)

---

## Implementation Plan

This audit identifies gaps that will be addressed in **Phase 6: PWA and Offline** of the roadmap.

### Todos

Based on this audit, the following tasks should be completed:

#### Phase 6: PWA and Offline (from TODOS.md)

- [ ] Implement service worker for offline caching
  - [ ] Create `/public/sw.js` with cache strategies
  - [ ] Register service worker in main layout
  - [ ] Implement cache-first strategy for static assets
  - [ ] Add offline fallback page
- [ ] Cache current week's data for offline access
  - [ ] Cache `FOOD-OF-THE-WEEK.md` content
  - [ ] Cache rendered HTML for current week
  - [ ] Implement cache versioning by week
- [ ] Add offline indicator in UI
  - [ ] Detect online/offline status
  - [ ] Show visual indicator when offline
  - [ ] Notify user of limited functionality when offline
- [ ] Implement background sync for checklist changes
  - [ ] Queue localStorage changes when offline
  - [ ] Sync to server when connection restored (if applicable)
  - [ ] Handle conflicts gracefully

#### PWA Enhancements (Additional)

- [ ] Create `manifest.json` for app installation
  - [ ] Define app metadata (name, description, theme)
  - [ ] Add app icons (various sizes: 192x192, 512x512)
  - [ ] Configure display mode and orientation
  - [ ] Set start_url and scope
- [ ] Self-host critical fonts
  - [ ] Download Work Sans and Aleo font files
  - [ ] Add to `/public/fonts/` directory
  - [ ] Update CSS to use local fonts with CDN fallback
  - [ ] Add `font-display: swap` for performance
- [ ] Test PWA functionality
  - [ ] Verify "Add to Home Screen" works on iOS Safari
  - [ ] Verify "Add to Home Screen" works on Chrome Android
  - [ ] Test offline mode across browsers
  - [ ] Verify service worker updates properly

#### Archive Caching (Phase 8 - Long-term)

- [ ] Implement LRU cache for archive pages
  - [ ] Cache last 5 viewed archive weeks
  - [ ] Implement cache eviction strategy
  - [ ] Add manual cache clearing option

---

**Related TODOS.md Phases:**

- Phase 6: PWA and Offline (lines 152-159)
- Phase 4: Local Push Notifications (requires service worker, lines 104-109)

**Dependencies:**

- Service worker must be implemented before notification support (Phase 4)
- PWA manifest required for "Add to Home Screen" functionality
- Archive caching depends on Phase 6 service worker implementation