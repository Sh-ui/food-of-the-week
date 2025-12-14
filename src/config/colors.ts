/**
 * Instruction section color cycling configuration.
 * 
 * IMPORTANT: All color values reference tailwind.config.mjs as master source.
 * To customize colors, edit tailwind.config.mjs (NOT this file).
 * 
 * This file handles the CYCLING LOGIC only - which colors go where.
 * The actual hex values come from Tailwind config.
 * 
 * HOW CYCLING WORKS:
 * - First subsection group (Protein, Ingredients) uses `firstSubsection` colors
 * - Instruction sections (Already Prepped, Sous Chef, etc.) cycle through `instructionSequence`
 * - If you have 5 instructions but 3 colors: [0,1,2,0,1] (wraps around)
 * 
 * TO CUSTOMIZE:
 * 1. Edit hex values in tailwind.config.mjs theme.extend.colors
 * 2. Add more color sets to instructionSequence array (change cycling pattern)
 * 3. Use positionOverrides to force specific positions to specific colors
 */

export interface SectionColorScheme {
  bg: string;       // Background color
  border: string;   // Left border color
  heading: string;  // Heading text color
}

export interface SectionColors {
  // First subsection group in each content section (meal info)
  firstSubsection: SectionColorScheme;
  
  // Instruction sequence - cycles through these for subsequent subsections
  instructionSequence: SectionColorScheme[];
  
  // Optional: Override specific positions (0-indexed, after first group)
  positionOverrides?: Record<number, SectionColorScheme>;
  
  // List section categories (grocery categories - currently plain)
  listCategory: SectionColorScheme;
}

// Import Tailwind config to get actual color values
import tailwindConfig from '../../tailwind.config.mjs';

// Extract color values from Tailwind config (single source of truth)
const colors = tailwindConfig.theme.extend.colors;

export const sectionColors: SectionColors = {
  // First subsection group (meal info: Protein, Ingredients, Description)
  firstSubsection: {
    bg: colors['bg-alt'],
    border: colors['secondary'],
    heading: colors['primary'],
  },
  
  // Instruction sequence - cycles through for instruction sections
  instructionSequence: [
    { bg: colors['instruction-salmon-bg'], border: colors['instruction-salmon'], heading: colors['instruction-salmon-heading'] },
    { bg: colors['instruction-yellow-bg'], border: colors['instruction-yellow'], heading: colors['instruction-yellow-heading'] },
    { bg: colors['instruction-orange-bg'], border: colors['instruction-orange'], heading: colors['instruction-orange-heading'] },
  ],
  
  // Optional: Override specific instruction positions (0-indexed)
  // Uncomment and customize to override specific positions:
  // positionOverrides: {
  //   0: { bg: '#custom', border: '#custom', heading: '#custom' },
  // },
  
  // List section categories (grocery categories)
  // Currently plain/transparent - can be customized if desired
  listCategory: {
    bg: 'transparent',
    border: 'transparent',
    heading: 'inherit',
  },
};

/**
 * Get the color scheme for an instruction section by its index.
 * Colors cycle through the instructionSequence if there are more sections than colors.
 * 
 * @param index - 0-indexed position of the instruction section (after first group)
 * @returns The color scheme for that position
 */
export function getInstructionColor(index: number): SectionColorScheme {
  const { instructionSequence, positionOverrides } = sectionColors;
  
  // Check for position-specific override first
  if (positionOverrides?.[index]) {
    return positionOverrides[index];
  }
  
  // Otherwise cycle through the sequence
  return instructionSequence[index % instructionSequence.length];
}

/**
 * Get the total number of instruction colors in the sequence.
 * Useful for testing or debugging color cycling.
 */
export function getInstructionColorCount(): number {
  return sectionColors.instructionSequence.length;
}
