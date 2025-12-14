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
 * A subsection within a content section.
 * Subsections are detected by bold labels: **Label**
 */
export interface Subsection {
  title: string;              // The bold label text (without **)
  content: string;            // Paragraph content that follows
  items: string[];            // List items if content includes a bulleted list
  isGroupedWithPrevious: boolean;  // True if should be grouped with previous subsection
  hasInlineContent: boolean;  // True if label had content on the same line
}

/**
 * A content section (typically a meal).
 * Contains subsections parsed from bold labels.
 */
export interface ContentSection {
  id: string;
  title: string;              // H2 heading text (used for nav/print)
  cooked: boolean;            // From ~~strikethrough~~ on title
  subsections: Subsection[];
}

/**
 * Top-level page structure returned by the parser.
 */
export interface PagePlan {
  pageTitle: string;
  listSection: ListSection | null;
  contentSections: ContentSection[];
}

// Legacy interface for backwards compatibility during transition
export interface WeekPlan {
  weekTitle: string;
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
  let listSection: ListSection | null = null;
  const contentSections: ContentSection[] = [];
  
  let h2Count = 0;
  let contentSectionCount = 0; // Track content sections independently
  let currentSection: 'none' | 'list' | 'content' = 'none';
  
  // For list section parsing
  let currentCategory: ListCategory | null = null;
  let listCategories: ListCategory[] = [];
  let listSectionTitle = '';
  let listSectionId = '';
  
  // For content section parsing
  let currentContentSection: ContentSection | null = null;
  let currentSubsection: Subsection | null = null;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Skip space tokens
    if (token.type === 'space') {
      continue;
    }
    
    // H1 = Page title
    if (token.type === 'heading' && token.depth === 1) {
      pageTitle = token.text;
      continue;
    }
    
    // H2 = Section boundary
    if (token.type === 'heading' && token.depth === 2) {
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
        
        // Check for strikethrough (cooked indicator)
        let title = heading;
        let cooked = false;
        
        // Check if entire title is wrapped in strikethrough
        if (title.startsWith('~~') && title.endsWith('~~')) {
          cooked = true;
          title = title.slice(2, -2).trim();
        }
        
        // Also check for partial strikethrough (e.g., "Meal 1: ~~Title~~")
        const partialMatch = title.match(/^(.+?):\s*~~(.+)~~$/);
        if (partialMatch) {
          cooked = true;
          title = `${partialMatch[1]}: ${partialMatch[2]}`;
        }
        
        currentContentSection = {
          id: `meal-${contentSectionCount}`, // Use independent counter
          title: title,
          cooked: cooked,
          subsections: [],
        };
        currentSubsection = null;
      }
      
      continue;
    }
    
    // H3 = Category in list section
    if (token.type === 'heading' && token.depth === 3) {
      if (currentSection === 'list') {
        if (currentCategory) {
          listCategories.push(currentCategory);
        }
        currentCategory = {
          name: token.text,
          items: [],
        };
      }
      continue;
    }
    
    // List in list section = category items
    if (token.type === 'list' && currentSection === 'list' && currentCategory) {
      const items = extractGroceryItems(token as Tokens.List);
      currentCategory.items.push(...items);
      continue;
    }
    
    // Content section processing
    if (currentSection === 'content' && currentContentSection) {
      // Check for bold label pattern: **Label**
      if (token.type === 'paragraph') {
        const text = token.text;
        const boldLabelMatch = text.match(/^\*\*([^*]+)\*\*(.*)$/);
        
        if (boldLabelMatch) {
          const label = boldLabelMatch[1].trim();
          const inlineContent = boldLabelMatch[2].trim();
          
          // Key distinction: does this label have inline content?
          // - Inline content (text on same line as label) = should group with other inline items
          // - No inline content (empty after label) = starts a new ungrouped section
          const hasInlineContent = inlineContent.length > 0;
          
          // Save previous subsection if exists
          if (currentSubsection) {
            currentContentSection.subsections.push(currentSubsection);
          }
          
          // Determine if this should be grouped with previous
          // Grouped if: this has inline content AND previous subsection also had inline content
          const previousSub = currentContentSection.subsections[currentContentSection.subsections.length - 1];
          const previousHadInlineContent = previousSub?.hasInlineContent ?? false;
          const isGrouped = hasInlineContent && previousHadInlineContent;
          
          currentSubsection = {
            title: label,
            content: inlineContent,
            items: [],
            isGroupedWithPrevious: isGrouped,
            hasInlineContent: hasInlineContent,
          };
        } else if (currentSubsection) {
          // Regular paragraph - add to current subsection content
          if (currentSubsection.content) {
            currentSubsection.content += '\n\n' + text;
          } else {
            currentSubsection.content = text;
          }
        }
      }
      
      // List in content section - add to current subsection
      if (token.type === 'list' && currentSubsection) {
        const items = extractListItems(token as Tokens.List);
        currentSubsection.        items.push(...items);
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
    contentSections.push(currentContentSection);
  }
  
  return {
    pageTitle,
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
 * Group subsections for rendering.
 * Consecutive subsections with isGroupedWithPrevious=true are grouped together.
 * 
 * @returns Array of subsection groups. First group uses firstSubsection colors,
 *          subsequent groups use cycling instruction colors.
 */
export function groupSubsections(subsections: Subsection[]): Subsection[][] {
  const groups: Subsection[][] = [];
  let currentGroup: Subsection[] = [];
  
  for (const sub of subsections) {
    if (sub.isGroupedWithPrevious && currentGroup.length > 0) {
      // Add to current group
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
