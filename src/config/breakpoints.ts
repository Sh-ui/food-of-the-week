/**
 * Centralized configuration for scroll behavior and responsive breakpoints.
 * 
 * RESPONSIVE BREAKPOINTS:
 * Breakpoints are now defined in tailwind.config.mjs (theme.extend.screens)
 * - Import from Tailwind config if needed in components
 * - Use @screen directives in CSS
 * - Reference: https://tailwindcss.com/docs/screens
 * 
 * Defined breakpoints:
 * - sm-mobile: 500px (small mobile devices)
 * - mobile: 768px (mobile devices)
 * - tablet: 950px (switch to mobile nav)
 * - desktop: 1000px (abbreviated text)
 */

/**
 * Scroll behavior thresholds (not CSS breakpoints)
 */
export const scrollThresholds = {
  /** Minimum scroll distance before showing header features (date, print button changes) */
  HEADER_ACTIVATION: 100, // pixels - Show header features after scrolling past hero section
  
  /** Section visibility threshold for navigation highlighting */
  SECTION_VISIBILITY: 0.25, // 25% - Section must be 25%+ visible to be considered "active"
  
  /** Fade-out zone at end of section */
  FADE_OUT_START: 0.85, // 85% - Start fading print button in last 15% of section
} as const;
