import { marked } from 'marked';
import type { Tokens, Token } from 'marked';
import fs from 'fs';
import path from 'path';

export interface GroceryCategory {
  name: string;
  items: string[];
}

export interface Meal {
  id: string;
  number: number;
  title: string;
  fullTitle: string;
  protein?: string;
  ingredients?: string;
  description?: string;
  instructions?: string;
  alreadyPrepped?: string[];
  sousChef?: string;
  chefFinishing?: string;
  content: string;
}

export interface WeekPlan {
  weekTitle: string;
  groceryList: GroceryCategory[];
  meals: Meal[];
}

/**
 * Parse FOOD-OF-THE-WEEK.md and extract structured weekly meal plan data
 */
export async function parseReadme(): Promise<WeekPlan> {
  const readmePath = path.join(process.cwd(), 'FOOD-OF-THE-WEEK.md');
  
  if (!fs.existsSync(readmePath)) {
    return {
      weekTitle: 'No meal plan available',
      groceryList: [],
      meals: []
    };
  }
  
  const content = fs.readFileSync(readmePath, 'utf-8');
  const tokens = marked.lexer(content);
  
  let weekTitle = 'Weekly Meal Plan';
  const groceryList: GroceryCategory[] = [];
  const meals: Meal[] = [];
  
  let currentSection: 'none' | 'grocery' | 'meal' = 'none';
  let currentCategory: GroceryCategory | null = null;
  let currentMeal: Meal | null = null;
  let mealContent: string[] = [];
  let capturingInstructions = false;
  let instructionsContent: string[] = [];
  let currentPhase: 'none' | 'already-prepped' | 'sous-chef' | 'chef-finishing' = 'none';
  let alreadyPreppedItems: string[] = [];
  let sousChefContent: string[] = [];
  let chefFinishingContent: string[] = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // Extract week title (H1)
    if (token.type === 'heading' && token.depth === 1) {
      weekTitle = token.text;
      continue;
    }
    
    // Detect H2 sections
    if (token.type === 'heading' && token.depth === 2) {
      // Save previous meal if exists
      if (currentMeal) {
        if (instructionsContent.length > 0) {
          currentMeal.instructions = instructionsContent.join('\n\n');
        }
        if (alreadyPreppedItems.length > 0) {
          currentMeal.alreadyPrepped = alreadyPreppedItems;
        }
        if (sousChefContent.length > 0) {
          currentMeal.sousChef = sousChefContent.join('\n\n');
        }
        if (chefFinishingContent.length > 0) {
          currentMeal.chefFinishing = chefFinishingContent.join('\n\n');
        }
        currentMeal.content = mealContent.join('\n');
        meals.push(currentMeal);
        currentMeal = null;
        mealContent = [];
        instructionsContent = [];
        capturingInstructions = false;
        currentPhase = 'none';
        alreadyPreppedItems = [];
        sousChefContent = [];
        chefFinishingContent = [];
      }
      
      const heading = token.text;
      
      // Check if it's Grocery List section
      if (heading === 'Grocery List') {
        currentSection = 'grocery';
        currentCategory = null;
        continue;
      }
      
      // Check if it's a Meal section
      const mealMatch = heading.match(/^Meal (\d+):\s*(.+)$/);
      if (mealMatch) {
        currentSection = 'meal';
        const mealNumber = parseInt(mealMatch[1], 10);
        const mealTitle = mealMatch[2];
        currentMeal = {
          id: `meal-${mealNumber}`,
          number: mealNumber,
          title: mealTitle,
          fullTitle: heading,
          content: ''
        };
        capturingInstructions = false;
        instructionsContent = [];
        currentPhase = 'none';
        alreadyPreppedItems = [];
        sousChefContent = [];
        chefFinishingContent = [];
        continue;
      }
      
      currentSection = 'none';
      continue;
    }
    
    // Process H3 headings within sections
    if (token.type === 'heading' && token.depth === 3) {
      if (currentSection === 'grocery') {
        // Save previous category
        if (currentCategory) {
          groceryList.push(currentCategory);
        }
        // Start new category
        currentCategory = {
          name: token.text,
          items: []
        };
      }
      continue;
    }
    
    // Process list items
    if (token.type === 'list') {
      if (currentSection === 'grocery' && currentCategory) {
        // Extract grocery items
        const items = extractListItems(token as Tokens.List);
        currentCategory.items.push(...items);
      }
    }
    
    // Process meal content
    if (currentSection === 'meal' && currentMeal) {
      // Convert token back to markdown for content
      const tokenMarkdown = tokenToMarkdown(token);
      
      // Extract specific fields from paragraphs
      if (token.type === 'paragraph') {
        const text = token.text;
        
        // Extract bold fields
        if (text.startsWith('**Protein:**')) {
          currentMeal.protein = text.replace(/^\*\*Protein:\*\*\s*/, '').trim();
        } else if (text.startsWith('**Ingredients:**')) {
          currentMeal.ingredients = text.replace(/^\*\*Ingredients:\*\*\s*/, '').trim();
        } else if (text.startsWith('**Description:**')) {
          currentMeal.description = text.replace(/^\*\*Description:\*\*\s*/, '').trim();
        } else if (text.startsWith('**Instructions:**')) {
          capturingInstructions = true;
          // Don't add the label itself, just start capturing subsequent content
        } else if (text.startsWith('**Already Prepped:**')) {
          currentPhase = 'already-prepped';
        } else if (text.startsWith('**Sous Chef')) {
          currentPhase = 'sous-chef';
        } else if (text.startsWith('**Chef - Finishing')) {
          currentPhase = 'chef-finishing';
        } else if (capturingInstructions && currentPhase === 'none') {
          // Legacy format: Capture all paragraphs after Instructions label
          instructionsContent.push(text);
        } else if (currentPhase === 'sous-chef') {
          sousChefContent.push(text);
        } else if (currentPhase === 'chef-finishing') {
          chefFinishingContent.push(text);
        }
      }
      
      // Process list items for Already Prepped phase
      if (token.type === 'list' && currentPhase === 'already-prepped') {
        const items = extractListItems(token as Tokens.List);
        alreadyPreppedItems.push(...items);
      }
      
      mealContent.push(tokenMarkdown);
    }
  }
  
  // Save final category
  if (currentCategory) {
    groceryList.push(currentCategory);
  }
  
  // Save final meal
  if (currentMeal) {
    if (instructionsContent.length > 0) {
      currentMeal.instructions = instructionsContent.join('\n\n');
    }
    if (alreadyPreppedItems.length > 0) {
      currentMeal.alreadyPrepped = alreadyPreppedItems;
    }
    if (sousChefContent.length > 0) {
      currentMeal.sousChef = sousChefContent.join('\n\n');
    }
    if (chefFinishingContent.length > 0) {
      currentMeal.chefFinishing = chefFinishingContent.join('\n\n');
    }
    currentMeal.content = mealContent.join('\n');
    meals.push(currentMeal);
  }
  
  return {
    weekTitle,
    groceryList,
    meals
  };
}

/**
 * Extract text items from a list token
 */
function extractListItems(token: Tokens.List): string[] {
  const items: string[] = [];
  
  for (const item of token.items) {
    if (item.task !== undefined) {
      // Task list item (checkbox)
      items.push(item.text);
    } else {
      // Regular list item
      items.push(item.text);
    }
  }
  
  return items;
}

/**
 * Convert a token back to markdown
 */
function tokenToMarkdown(token: Token): string {
  // Use marked to convert back to HTML/text
  // For simplicity, we'll just extract text content
  
  if (token.type === 'paragraph') {
    return token.text + '\n\n';
  }
  
  if (token.type === 'heading') {
    const prefix = '#'.repeat((token as Tokens.Heading).depth);
    return `${prefix} ${token.text}\n\n`;
  }
  
  if (token.type === 'list') {
    const listToken = token as Tokens.List;
    let result = '';
    for (const item of listToken.items) {
      result += `- ${item.text}\n`;
    }
    return result + '\n';
  }
  
  if (token.type === 'code') {
    const codeToken = token as Tokens.Code;
    return `\`\`\`${codeToken.lang || ''}\n${codeToken.text}\n\`\`\`\n\n`;
  }
  
  if (token.type === 'blockquote') {
    return `> ${token.text}\n\n`;
  }
  
  return '';
}

/**
 * Generate a slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

