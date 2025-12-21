/**
 * Print document generation logic.
 * Extracts meal and grocery data from DOM and generates print-ready HTML documents.
 * Separated from StickyHeader.astro to reduce component complexity.
 */

export interface PrintConfig {
  page: { margins: { top: string; right: string; bottom: string; left: string } };
  typography: {
    bodyFontFamily: string;
    headingFontFamily: string;
    bodyFontSize: string;
    lineHeight: number;
    h1Size: string;
    h2Size: string;
    h3Size: string;
  };
  spacing: {
    sectionGap: string;
    paragraphGap: string;
    listItemGap: string;
    categoryGap: string;
  };
  colors: {
    text: string;
    border: string;
    mutedText: string;
    headingColor: string;
  };
  checkbox: {
    size: string;
    borderWidth: string;
    checkedSymbol: string;
    globalCheckedSymbol: string;
  };
  groceryList: {
    columns: number;
    showCategories: boolean;
    categoryHeadingSize: string;
  };
  meals: {
    pageBreakBetween: boolean;
    showPhaseColors: boolean;
    instructionIndent: string;
  };
}

export interface GroceryItem {
  text: string;
  globallyChecked: boolean;
}

export interface GroceryCategory {
  name: string;
  items: GroceryItem[];
}

export interface Meal {
  id: string;
  number: number;
  title: string;
  fullTitle: string;
  cooked: boolean;
  fields: Array<{ title: string; paragraphs: string[]; items: string[] }>;  // H4 fields
  sections: Array<{ title: string; paragraphs: string[]; items: string[] }>; // H3 sections
  quickReadCodename?: string;
  quickReadDetails?: string;
}

export interface WeekPlan {
  weekTitle: string;
  groceryList: GroceryCategory[];
  meals: Meal[];
}

let printConfig: PrintConfig | null = null;

/**
 * Get default print configuration
 */
export function getDefaultPrintConfig(): PrintConfig {
  return {
    page: { margins: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' } },
    typography: {
      bodyFontFamily: 'Work Sans, sans-serif',
      headingFontFamily: 'Aleo, Georgia, serif',
      bodyFontSize: '11pt',
      lineHeight: 1.5,
      h1Size: '24pt',
      h2Size: '18pt',
      h3Size: '14pt',
    },
    spacing: {
      sectionGap: '16pt',
      paragraphGap: '8pt',
      listItemGap: '4pt',
      categoryGap: '12pt',
    },
    colors: {
      text: '#000000',
      border: '#cccccc',
      mutedText: '#666666',
      headingColor: '#333333',
    },
    checkbox: {
      size: '12pt',
      borderWidth: '1pt',
      checkedSymbol: '✓',
      globalCheckedSymbol: '●',
    },
    groceryList: {
      columns: 1,
      showCategories: true,
      categoryHeadingSize: '14pt',
    },
    meals: {
      pageBreakBetween: true,
      showPhaseColors: false,
      instructionIndent: '0pt',
    },
  };
}

/**
 * Load print configuration from public/print-config.json
 */
export async function loadPrintConfig(): Promise<PrintConfig> {
  if (printConfig) return printConfig;

  try {
    const baseUrl =
      document.querySelector('link[rel="icon"]')?.getAttribute('href')?.replace('favicon.svg', '') || '/';
    const response = await fetch(`${baseUrl}print-config.json`);
    printConfig = await response.json();
    return printConfig!;
  } catch (error) {
    console.warn('Could not load print-config.json, using defaults:', error);
    return getDefaultPrintConfig();
  }
}

/**
 * Extract week plan data from the rendered DOM.
 * Works with flex-parsing structure (info-group, instruction-group).
 */
export function getWeekPlanData(): WeekPlan {
  const weekTitle = document.querySelector('h1')?.textContent || 'Weekly Meal Plan';

  // Extract grocery list
  const groceryList: GroceryCategory[] = [];
  const grocerySection = document.querySelector('#print-section-grocery-list');
  if (grocerySection) {
    grocerySection.querySelectorAll('.grocery-category').forEach(cat => {
      const name = cat.querySelector('h3')?.textContent || '';
      const items: GroceryItem[] = [];
      cat.querySelectorAll('.grocery-item').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
        const text = item.querySelector('.item-text')?.textContent || '';
        items.push({ text, globallyChecked: checkbox?.dataset.globallyChecked === 'true' });
      });
      groceryList.push({ name, items });
    });
  }

  // Extract meals from flex-parsing structure
  const meals: Meal[] = [];
  document.querySelectorAll('.meal[data-section-type="meal"]').forEach((mealSection, index) => {
    const id = mealSection.id.replace('print-section-', '');
    const cooked = mealSection.getAttribute('data-cooked') === 'true';
    const fullTitle = mealSection.querySelector('h2')?.textContent || '';
    const number = index + 1;
    const title = fullTitle;

    // Extract fields from .info-group (H4 fields)
    const fields: Array<{ title: string; paragraphs: string[]; items: string[] }> = [];
    const infoGroup = mealSection.querySelector('.info-group');
    if (infoGroup) {
      infoGroup.querySelectorAll('.subsection-field').forEach(field => {
        const strong = field.querySelector('strong');
        const title = strong?.textContent?.trim() || '';
        let contentHtml = field.querySelector('.subsection-field-body')?.innerHTML?.trim() || '';

        if (!contentHtml) {
          const fallback = (field.textContent || '').replace(title, '').trim();
          contentHtml = fallback;
        }

        const paragraphs = contentHtml ? [contentHtml] : [];
        const items: string[] = [];

        fields.push({ title, paragraphs, items });
      });
    }

    // Extract sections from .instruction-group (H3 sections)
    const sections: Array<{ title: string; paragraphs: string[]; items: string[] }> = [];
    mealSection.querySelectorAll('.instruction-group').forEach(group => {
      const h3 = group.querySelector('h3');
      const title = h3?.textContent?.trim() || '';

      // Extract paragraphs from .subsection-content
      const paragraphs: string[] = [];
      group.querySelectorAll('.subsection-content p').forEach(p => {
        paragraphs.push(p.innerHTML || '');
      });

      // Extract list items
      const items: string[] = [];
      group.querySelectorAll('li').forEach(li => {
        items.push(li.innerHTML || '');
      });

      sections.push({ title, paragraphs, items });
    });

    const quickReadEl = mealSection.querySelector('.meal-quick-read');
    const quickReadCodename = quickReadEl?.querySelector('.quick-read-codename')?.textContent?.trim() || '';
    const quickReadDetails = quickReadEl?.querySelector('.quick-read-details')?.textContent?.trim() || '';

    meals.push({
      id,
      number,
      title,
      fullTitle,
      cooked,
      fields,
      sections,
      quickReadCodename: quickReadCodename || undefined,
      quickReadDetails: quickReadDetails || undefined,
    });
  });

  return { weekTitle, groceryList, meals };
}

/**
 * Generate HTML for grocery list section
 */
export function generateGroceryListHTML(list: GroceryCategory[], cfg: PrintConfig): string {
  let html = `
    <div class="print-grocery-list">
      <h2 style="font-family:${cfg.typography.headingFontFamily};font-size:${cfg.typography.h2Size};color:${cfg.colors.headingColor};margin-bottom:${cfg.spacing.sectionGap};">
        Grocery List
      </h2>`;

  list.forEach(cat => {
    html += `<div style="margin-bottom:${cfg.spacing.categoryGap};">`;

    if (cfg.groceryList.showCategories) {
      html += `
        <h3 style="font-family:${cfg.typography.headingFontFamily};font-size:${cfg.groceryList.categoryHeadingSize};color:${cfg.colors.headingColor};margin-bottom:${cfg.spacing.listItemGap};">
          ${cat.name}
        </h3>`;
    }

    html += `<ul style="list-style:none;margin:0;padding:0;">`;

    cat.items.forEach(item => {
      const cbStyle = `display:inline-block;width:${cfg.checkbox.size};height:${cfg.checkbox.size};border:${cfg.checkbox.borderWidth} solid ${cfg.colors.text};margin-right:8pt;vertical-align:middle;text-align:center;line-height:${cfg.checkbox.size};`;
      const sym = item.globallyChecked ? cfg.checkbox.globalCheckedSymbol : '';
      const txtStyle = item.globallyChecked ? `color:${cfg.colors.mutedText};` : `color:${cfg.colors.text};`;
      html += `
        <li style="margin-bottom:${cfg.spacing.listItemGap};${txtStyle}">
          <span style="${cbStyle}">${sym}</span>${item.text}
        </li>`;
    });

    html += `</ul></div>`;
  });

  return html + `</div>`;
}

/**
 * Generate HTML for individual meal section
 */
export function generateMealHTML(meal: Meal, cfg: PrintConfig): string {
  const textColor = meal.cooked ? cfg.colors.mutedText : cfg.colors.text;
  const headingColor = meal.cooked ? cfg.colors.mutedText : cfg.colors.headingColor;
  const pageBreak = cfg.meals.pageBreakBetween ? 'page-break-after:always;' : '';

  let html = `
    <div class="print-meal" style="color:${textColor};${pageBreak}">
      <h2 style="font-family:${cfg.typography.headingFontFamily};font-size:${cfg.typography.h2Size};color:${headingColor};margin-bottom:${cfg.spacing.sectionGap};">
        ${meal.fullTitle}
      </h2>
      ${meal.quickReadCodename ? `
      <div style="display:flex;flex-wrap:wrap;gap:8pt;margin-bottom:${cfg.spacing.listItemGap};">
        <span style="background:${cfg.colors.border};color:${cfg.colors.headingColor};border:1px solid ${cfg.colors.border};border-radius:4px;padding:3pt 8pt;font-weight:600;">
          ${meal.quickReadCodename}
        </span>
        ${meal.quickReadDetails ? `
        <span style="background:${cfg.colors.border};color:${cfg.colors.text};border:1px solid ${cfg.colors.border};border-radius:4px;padding:3pt 8pt;">
          ${meal.quickReadDetails}
        </span>` : ''}
      </div>` : ''}
      <div style="border:1px solid ${cfg.colors.border};padding:10pt;margin-bottom:${cfg.spacing.sectionGap};">`;

  // Print all fields
  meal.fields.forEach(field => {
    field.paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        html += `
        <p style="margin-bottom:${cfg.spacing.listItemGap};">
          <strong>${field.title}</strong> ${paragraph}
        </p>`;
      }
    });
  });

  html += `</div>`;

  // Print all sections
  meal.sections.forEach(section => {
    html += `
      <div style="margin-bottom:${cfg.spacing.sectionGap};">
        <h3 style="font-family:${cfg.typography.headingFontFamily};font-size:${cfg.typography.h3Size};color:${headingColor};margin-bottom:${cfg.spacing.listItemGap};">
          ${section.title}
        </h3>`;

    // Print paragraphs
    section.paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        html += `
        <p style="margin-bottom:${cfg.spacing.paragraphGap};">${paragraph}</p>`;
      }
    });

    // Print list items if any
    if (section.items.length > 0) {
      html += `
        <ul style="margin-left:20pt;">`;
      section.items.forEach(item => {
        html += `
          <li style="margin-bottom:${cfg.spacing.listItemGap};">${item}</li>`;
      });
      html += `
        </ul>`;
    }

    html += `
      </div>`;
  });

  return html + `</div>`;
}

/**
 * Generate complete print document HTML
 */
export function generatePrintDocument(plan: WeekPlan, cfg: PrintConfig, target: string): string {
  const { margins } = cfg.page;
  let content = '';

  // Generate content based on print target
  if (target === 'all') {
    content += `
      <h1 style="font-family:${cfg.typography.headingFontFamily};font-size:${cfg.typography.h1Size};color:${cfg.colors.headingColor};margin-bottom:${cfg.spacing.sectionGap};text-align:center;">
        ${plan.weekTitle}
      </h1>`;
    content += generateGroceryListHTML(plan.groceryList, cfg);
    content += `<div style="page-break-after:always;"></div>`;
    plan.meals.forEach(meal => (content += generateMealHTML(meal, cfg)));
  } else if (target === 'grocery-list') {
    content += `
      <h1 style="font-family:${cfg.typography.headingFontFamily};font-size:${cfg.typography.h1Size};color:${cfg.colors.headingColor};margin-bottom:${cfg.spacing.sectionGap};">
        ${plan.weekTitle}
      </h1>`;
    content += generateGroceryListHTML(plan.groceryList, cfg);
  } else if (target.startsWith('meal-')) {
    const mealNumber = parseInt(target.replace('meal-', ''), 10);
    const meal = plan.meals.find(m => m.number === mealNumber);
    if (meal) {
      content += generateMealHTML(meal, cfg);
    }
  }

  // Return complete HTML document
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Print - ${plan.weekTitle}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Aleo:wght@400;600;700&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        @page { margin: ${margins.top} ${margins.right} ${margins.bottom} ${margins.left}; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: ${cfg.typography.bodyFontFamily};
          font-size: ${cfg.typography.bodyFontSize};
          line-height: ${cfg.typography.lineHeight};
          color: ${cfg.colors.text};
          padding: 0;
        }
        strong { font-weight: 600; }
        .print-meal:last-child { page-break-after: auto; }
      </style>
    </head>
    <body>${content}</body>
  </html>`;
}

/**
 * Trigger print dialog with generated document
 */
export async function printSection(sectionId: string): Promise<void> {
  const cfg = await loadPrintConfig();
  const plan = getWeekPlanData();
  const html = generatePrintDocument(plan, cfg, sectionId);

  const win = window.open('', '_blank', 'width=800,height=600');
  if (!win) {
    console.error(
      'Print failed: Could not open print window. Please check if pop-ups are blocked in your browser settings.'
    );
    return;
  }

  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };
}
