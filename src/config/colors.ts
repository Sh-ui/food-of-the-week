/**
 * Centralized color configuration for section styling.
 * 
 * This file controls the colors used for subsections within content sections (meals).
 * Colors are applied by position, allowing flexible markdown without keyword dependencies.
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

export const sectionColors: SectionColors = {
  // First subsection group in each content section (meal info)
  // This is the grouped box with Protein, Ingredients, Description, etc.
  firstSubsection: {
    bg: '#F5F2EB',      // Warm cream background
    border: '#F3CA40',  // Gold left border (Tuscan Sun)
    heading: '#494331', // Dark primary heading color
  },
  
  // Instruction sequence - cycles through these for instruction sections
  // These are the individual colored boxes for Already Prepped, Sous Chef, Chef, etc.
  instructionSequence: [
    { bg: '#fef5f2', border: '#D78A76', heading: '#b86d5c' },  // Salmon (Sweet Salmon)
    { bg: '#fef9e8', border: '#F3CA40', heading: '#c9a22d' },  // Yellow (Tuscan Sun)
    { bg: '#fff5ef', border: '#F08A4B', heading: '#d16d2f' },  // Orange (Tangerine Dream)
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
