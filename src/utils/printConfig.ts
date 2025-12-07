import printConfig from '../../print-config.json';

/**
 * Get print configuration settings
 */
export function getPrintConfig() {
  return printConfig;
}

/**
 * Generate CSS custom properties from print config
 */
export function generatePrintCSSVars(): string {
  const config = getPrintConfig();
  
  const vars = [
    // Page margins
    `--print-margin-top: ${config.page.marginTop}`,
    `--print-margin-right: ${config.page.marginRight}`,
    `--print-margin-bottom: ${config.page.marginBottom}`,
    `--print-margin-left: ${config.page.marginLeft}`,
    
    // Typography
    `--print-font-size: ${config.typography.baseFontSize}`,
    `--print-line-height: ${config.typography.lineHeight}`,
    `--print-heading-line-height: ${config.typography.headingLineHeight}`,
    
    // Spacing
    `--print-section-margin-bottom: ${config.spacing.sectionMarginBottom}`,
    `--print-paragraph-margin-bottom: ${config.spacing.paragraphMarginBottom}`,
    `--print-list-item-margin-bottom: ${config.spacing.listItemMarginBottom}`,
    `--print-heading-margin-top: ${config.spacing.headingMarginTop}`,
    `--print-heading-margin-bottom: ${config.spacing.headingMarginBottom}`,
    
    // Meals
    `--print-meal-details-padding: ${config.meals.detailsPadding}`,
    `--print-meal-instructions-margin-top: ${config.meals.instructionsMarginTop}`,
    
    // Grocery
    `--print-grocery-category-margin-bottom: ${config.grocery.categoryMarginBottom}`,
    `--print-grocery-item-margin-bottom: ${config.grocery.itemMarginBottom}`,
    `--print-checkbox-size: ${config.grocery.checkboxSize}`
  ];
  
  return vars.join(';\n    ');
}

