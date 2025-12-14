/**
 * Centralized responsive breakpoint configuration.
 * 
 * All breakpoints are defined here for consistency across components and styles.
 * Update these values to adjust responsive behavior site-wide.
 * 
 * USAGE IN COMPONENTS:
 * ```typescript
 * import { breakpoints } from '../config/breakpoints';
 * const isMobile = window.innerWidth < breakpoints.tablet;
 * ```
 * 
 * USAGE IN CSS:
 * ```css
 * @media (max-width: 768px) { ... }  // Use breakpoints.mobile value
 * ```
 */

export const breakpoints = {
  /** Small mobile devices: 500px and below */
  smallMobile: 500,
  
  /** Mobile devices: 768px and below */
  mobile: 768,
  
  /** Tablet devices: 950px and below (switch to mobile nav) */
  tablet: 950,
  
  /** Desktop devices: 1000px and below (show abbreviated text) */
  desktop: 1000,
} as const;

/**
 * Scroll behavior thresholds
 */
export const scrollThresholds = {
  /** Minimum scroll distance before showing header features (date, print button changes) */
  HEADER_ACTIVATION: 100, // pixels - Show header features after scrolling past hero section
  
  /** Section visibility threshold for navigation highlighting */
  SECTION_VISIBILITY: 0.25, // 25% - Section must be 25%+ visible to be considered "active"
  
  /** Fade-out zone at end of section */
  FADE_OUT_START: 0.85, // 85% - Start fading print button in last 15% of section
} as const;

export type Breakpoint = keyof typeof breakpoints;
