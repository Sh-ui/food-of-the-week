import { marked } from 'marked';
import type { Tokens } from 'marked';
import fs from 'fs';
import path from 'path';

/**
 * Flex Parser - Position-based markdown parsing for meal planning
 * 
 * This parser works with any markdown structure following the template pattern:
 * - H1 = Page title
 * - First H2 = List section (grocery categories with checklist items)
 * - Other H2s = Content sections (meals with subsections)
 * 
 * No keyword detection - everything is position-based.
 */

// ============================================================================
// Interfaces
// ============================================================================

export interface GroceryItem {
  text: string;
  globallyChecked: boolean;
}

export interface ListCategory {
  name: string;
  items: GroceryItem[];
}

export interface ListSection {
  id: string;
  title: string;
  categories: ListCategory[];
}

/**
 * A block within a content section.
 * Blocks are created from H3/H4 headings.
 */
export interface Subsection {
  title: string;              // The heading text (preserves punctuation like colons)
  content: string;            // Paragraph content that follows (joined with \n\n)
  items: string[];            // List items if content includes a bulleted list
  depth: 3 | 4;               // Heading depth: 3 for sections, 4 for fields
}

export interface QuickRead {
  codename: string;
  details: string;
}

/**
 * A content section (typically a meal).
 * Contains blocks parsed from H3/H4 headings.
 */
export interface ContentSection {
  id: string;
  title: string;              // H2 heading text (used for nav/print)
  cooked: boolean;            // From ~~strikethrough~~ on title
  quickRead?: QuickRead;
  preamble?: string;          // Content before first H3/H4 heading (if any)
  subsections: Subsection[];  // Blocks from H3/H4 headings
}

/**
 * Top-level page structure returned by the parser.
 */
export interface PagePlan {
  pageTitle: string;
  heroSummary: string[]; // Optional hero summary lines
  listSection: ListSection | null;
  contentSections: ContentSection[];
}

// Legacy interface for backwards compatibility during transition
export interface WeekPlan {
  weekTitle: string;
  heroSummary: string[]; // Optional hero summary lines
  groceryList: ListCategory[];
  meals: ContentSection[];
}

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse a markdown file and extract structured page data.
 * Uses position-based logic - no keyword detection.
 * 
 * @param filename - The markdown file to parse (defaults to FOOD-OF-THE-WEEK.md)
 */
export async function parseWeekPlan(filename: string = 'FOOD-OF-THE-WEEK.md'): Promise<WeekPlan> {
  const pagePlan = await parsePagePlan(filename);
  
  // Convert to legacy WeekPlan format for backwards compatibility
  return {
    weekTitle: pagePlan.pageTitle,
    heroSummary: pagePlan.heroSummary,
    groceryList: pagePlan.listSection?.categories || [],
    meals: pagePlan.contentSections,
  };
}

/**
 * Parse a markdown file into the new PagePlan structure.
 * 
 * EDGE CASES HANDLED:
 * - Missing file: Returns empty structure with friendly message
 * - No grocery list: First H2 still treated as list section (may be empty)
 * - No meals: Returns empty contentSections array
 * - Empty sections: Gracefully handled, no subsections created
 */
export async function parsePagePlan(filename: string = 'FOOD-OF-THE-WEEK.md'): Promise<PagePlan> {
  const filePath = path.join(process.cwd(), filename);
  
  // EDGE CASE: File doesn't exist - return safe empty structure
  if (!fs.existsSync(filePath)) {
    return {
      pageTitle: 'No content available',
      heroSummary: [],
      listSection: null,
      contentSections: [],
    };
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseMarkdownContent(content);
}

/**
 * Parse raw markdown content into PagePlan structure.
 */
function parseMarkdownContent(content: string): PagePlan {
  const tokens = marked.lexer(content);

  let pageTitle = 'Page Title';
  let heroSummary: string[] = [];
  let listSection: ListSection | null = null;
  const contentSections: ContentSection[] = [];

  let h2Count = 0;
  let contentSectionCount = 0; // Track content sections independently
  let currentSection: 'none' | 'list' | 'content' = 'none';
  let collectingHeroSummary = false;
  
  // For list section parsing
  let currentCategory: ListCategory | null = null;
  let listCategories: ListCategory[] = [];
  let listSectionTitle = '';
  let listSectionId = '';
  
  // For content section parsing
  let currentContentSection: ContentSection | null = null;
  let currentSubsection: Subsection | null = null;
  let quickReadCodename: string | null = null;
  let quickReadDetails: string | null = null;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Skip space tokens
    if (token.type === 'space') {
      continue;
    }
    
    // H1 = Page title
    if (token.type === 'heading' && token.depth === 1) {
      pageTitle = token.text;
      collectingHeroSummary = true; // Start collecting hero summary after H1
      continue;
    }
    
    // H2 = Section boundary
    if (token.type === 'heading' && token.depth === 2) {
      collectingHeroSummary = false; // Stop collecting when we hit first H2
      // Save previous section
      if (currentSection === 'list') {
        if (currentCategory) {
          listCategories.push(currentCategory);
        }
        listSection = {
          id: listSectionId,
          title: listSectionTitle,
          categories: listCategories,
        };
      } else if (currentSection === 'content' && currentContentSection) {
        if (currentSubsection) {
          currentContentSection.subsections.push(currentSubsection);
        }
        if (quickReadCodename) {
          currentContentSection.quickRead = {
            codename: quickReadCodename,
            details: quickReadDetails?.trim() || '',
          };
        }
        contentSections.push(currentContentSection);
      }
      
      h2Count++;
      const heading = token.text;
      
      if (h2Count === 1) {
        // First H2 = List section (typically "Grocery List")
        // EDGE CASE: Even if no H3 categories or items follow, this structure ensures
        // content sections always start at meal-1 (see contentSectionCount below)
        currentSection = 'list';
        listSectionTitle = heading;
        listSectionId = slugify(heading);
        listCategories = [];
        currentCategory = null;
      } else {
        // All other H2s = Content sections (meals)
        currentSection = 'content';
        contentSectionCount++; // CRITICAL: Independent counter ensures meal-1, meal-2, etc.
                               // even if no grocery list exists (h2Count would be off by 1)

        const title = heading;
        const cooked = heading.includes('✓');

        quickReadCodename = null;
        quickReadDetails = null;

        currentContentSection = {
          id: `meal-${contentSectionCount}`, // Use independent counter
          title,
          cooked,
          subsections: [],
        };
        currentSubsection = null;
      }
      
      continue;
    }
    
    // H3 = Category in list section (only in list section, not content sections)
    if (token.type === 'heading' && token.depth === 3) {
      if (currentSection === 'list') {
        if (currentCategory) {
          listCategories.push(currentCategory);
        }
        currentCategory = {
          name: token.text,
          items: [],
        };
        continue; // Only continue for list section H3s
      }
      // H3s in content sections fall through to be handled below
    }
    
    // List in list section = category items
    if (token.type === 'list' && currentSection === 'list' && currentCategory) {
      const items = extractGroceryItems(token as Tokens.List);
      currentCategory.items.push(...items);
      continue;
    }
    
    // Collect hero summary lines (paragraphs after H1, before first H2)
    if (collectingHeroSummary && token.type === 'paragraph') {
      const lines = token.text
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean);

      for (const line of lines) {
        const text = line.replace(/^\*\*(.+)\*\*$/, '$1').trim();
        if (text.includes('•')) heroSummary.push(text);
      }
      continue;
    }

    // Content section processing
    if (currentSection === 'content' && currentContentSection) {
      if (token.type === 'heading' && token.depth === 5) {
        quickReadCodename = token.text.trim();
        continue;
      }

      if (token.type === 'heading' && token.depth === 6) {
        quickReadDetails = token.text.trim();
        continue;
      }

      // H3/H4 = Block creation
      if (token.type === 'heading' && (token.depth === 3 || token.depth === 4)) {
        // Save previous block if exists
        if (currentSubsection) {
          currentContentSection.subsections.push(currentSubsection);
        }

        currentSubsection = {
          title: token.text,  // Preserve exact heading text including colons
          content: '',
          items: [],
          depth: token.depth as 3 | 4,
        };
        continue;
      }

      // Accumulate content into current block
      if (currentSubsection) {
        if (token.type === 'paragraph') {
          const text = token.text.trim();
          if (!text) continue;
          if (currentSubsection.content) {
            currentSubsection.content += '\n\n' + text;
          } else {
            currentSubsection.content = text;
          }
        } else if (token.type === 'list') {
          const items = extractListItems(token as Tokens.List);
          currentSubsection.items.push(...items);
        }
      } else {
        // Content before first H3/H4 heading - store as preamble
        if (token.type === 'paragraph') {
          const text = token.text;
          if (currentContentSection.preamble) {
            currentContentSection.preamble += '\n\n' + text;
          } else {
            currentContentSection.preamble = text;
          }
        } else if (token.type === 'list') {
          const items = extractListItems(token as Tokens.List);
          const listText = items.join('\n- ');
          if (currentContentSection.preamble) {
            currentContentSection.preamble += '\n\n- ' + listText;
          } else {
            currentContentSection.preamble = '- ' + listText;
          }
        }
      }
    }
  }
  
  // Save final section
  if (currentSection === 'list') {
    if (currentCategory) {
      listCategories.push(currentCategory);
    }
    listSection = {
      id: listSectionId,
      title: listSectionTitle,
      categories: listCategories,
    };
  } else if (currentSection === 'content' && currentContentSection) {
    if (currentSubsection) {
      currentContentSection.subsections.push(currentSubsection);
    }
    if (quickReadCodename) {
      currentContentSection.quickRead = {
        codename: quickReadCodename,
        details: quickReadDetails?.trim() || '',
      };
    }
    contentSections.push(currentContentSection);
  }

  if (heroSummary.length === 0) {
    heroSummary = contentSections
      .filter(section => Boolean(section.quickRead?.codename))
      .map(section => {
        const codename = section.quickRead?.codename?.trim() ?? '';
        const details = section.quickRead?.details?.trim() ?? '';
        return details ? `${section.title} • ${codename} • ${details}` : `${section.title} • ${codename}`;
      });
  }
  
  return {
    pageTitle,
    heroSummary,
    listSection,
    contentSections,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract grocery items from a list token with checked state.
 */
function extractGroceryItems(token: Tokens.List): GroceryItem[] {
  const items: GroceryItem[] = [];
  
  for (const item of token.items) {
    items.push({
      text: item.text,
      globallyChecked: item.checked === true,
    });
  }
  
  return items;
}

/**
 * Extract plain text items from a list token.
 */
function extractListItems(token: Tokens.List): string[] {
  const items: string[] = [];
  
  for (const item of token.items) {
    items.push(item.text);
  }
  
  return items;
}

/**
 * Generate a URL-safe slug from text.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ============================================================================
// Rendering Helpers
// ============================================================================

/**
 * Group blocks for rendering based on heading depth.
 * Consecutive H4 blocks are grouped together as a "fields group".
 * Each H3 block forms its own "section group".
 *
 * @returns Array of block groups for rendering.
 */
export function groupSubsections(subsections: Subsection[]): Subsection[][] {
  const groups: Subsection[][] = [];
  let currentGroup: Subsection[] = [];

  for (const sub of subsections) {
    // If this is an H4 and the current group contains H4s, add to current group
    // If this is an H3, start a new group
    // If this is an H4 but current group contains H3s, start a new group
    const canAddToCurrentGroup = currentGroup.length > 0 &&
      currentGroup[0].depth === sub.depth &&
      sub.depth === 4; // Only H4 blocks can be grouped consecutively

    if (canAddToCurrentGroup) {
      // Add to current group (only works for consecutive H4 blocks)
      currentGroup.push(sub);
    } else {
      // Start new group
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [sub];
    }
  }

  // Push final group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}
