# Print Configuration Guide

## Overview

The `print-config.json` file in the project root lets you customize how your meal plans look when printed. Edit this JSON file to adjust margins, spacing, font sizes, and more.

## Location

```
/Users/ianschuepbach/Documents/GroceryPlanning/print-config.json
```

## How to Use

1. **Edit the JSON file** with your preferred text editor
2. **Save the file**
3. **Restart the dev server** (if running) to see changes:
   ```bash
   # Stop server (Ctrl+C), then:
   npm run dev
   ```
4. **Print preview** to test your changes (Cmd+P in browser)

## Configuration Options

### Page Margins

Control the white space around the edges of each printed page:

```json
"page": {
  "marginTop": "0.5in",      // Top margin
  "marginRight": "0.5in",    // Right margin
  "marginBottom": "0.5in",   // Bottom margin
  "marginLeft": "0.5in"      // Left margin
}
```

**To fit more on one page:** Reduce margins to `"0.4in"` or `"0.3in"`

**Units:** You can use `in` (inches), `cm` (centimeters), or `pt` (points)

### Typography

Control text size and line spacing:

```json
"typography": {
  "baseFontSize": "11pt",         // Main text size
  "lineHeight": "1.3",            // Space between lines (1.0 = no extra space)
  "headingLineHeight": "1.2"      // Line height for headings
}
```

**To fit more on one page:** 
- Reduce `baseFontSize` to `"10pt"` or `"10.5pt"`
- Reduce `lineHeight` to `"1.2"` or `"1.25"`

**To make more readable:**
- Increase `baseFontSize` to `"12pt"`
- Increase `lineHeight` to `"1.4"` or `"1.5"`

### Spacing

Fine-tune spacing between different elements:

```json
"spacing": {
  "sectionMarginBottom": "8pt",      // Space after major sections
  "paragraphMarginBottom": "6pt",    // Space after paragraphs
  "listItemMarginBottom": "3pt",     // Space between list items
  "headingMarginTop": "8pt",         // Space before headings
  "headingMarginBottom": "6pt"       // Space after headings
}
```

**To fit more on one page:** Reduce all values by 2-3pt

**To add breathing room:** Increase values by 2-3pt

### Meals

Control how meal cards are formatted:

```json
"meals": {
  "pageBreakAfter": true,                  // Each meal on new page (not configurable yet)
  "detailsPadding": "8pt",                 // Padding inside meal details box
  "instructionsMarginTop": "8pt"           // Space before instructions
}
```

**To fit more:** Reduce `detailsPadding` to `"6pt"`

### Grocery List

Control grocery list formatting:

```json
"grocery": {
  "categoryMarginBottom": "10pt",     // Space between categories
  "itemMarginBottom": "3pt",          // Space between items
  "checkboxSize": "11pt"              // Size of checkboxes
}
```

**To fit more items:** Reduce `itemMarginBottom` to `"2pt"`

**For bigger checkboxes:** Increase `checkboxSize` to `"13pt"` or `"14pt"`

## Common Adjustments

### Fit Each Meal on One Page

Try these settings:

```json
{
  "page": {
    "marginTop": "0.4in",
    "marginRight": "0.4in",
    "marginBottom": "0.4in",
    "marginLeft": "0.4in"
  },
  "typography": {
    "baseFontSize": "10.5pt",
    "lineHeight": "1.25",
    "headingLineHeight": "1.15"
  },
  "spacing": {
    "sectionMarginBottom": "6pt",
    "paragraphMarginBottom": "5pt",
    "listItemMarginBottom": "2pt",
    "headingMarginTop": "6pt",
    "headingMarginBottom": "5pt"
  },
  "meals": {
    "pageBreakAfter": true,
    "detailsPadding": "6pt",
    "instructionsMarginTop": "6pt"
  },
  "grocery": {
    "categoryMarginBottom": "8pt",
    "itemMarginBottom": "2pt",
    "checkboxSize": "10pt"
  }
}
```

### More Readable / Spacious

Try these settings:

```json
{
  "page": {
    "marginTop": "0.6in",
    "marginRight": "0.6in",
    "marginBottom": "0.6in",
    "marginLeft": "0.6in"
  },
  "typography": {
    "baseFontSize": "12pt",
    "lineHeight": "1.5",
    "headingLineHeight": "1.3"
  },
  "spacing": {
    "sectionMarginBottom": "10pt",
    "paragraphMarginBottom": "8pt",
    "listItemMarginBottom": "4pt",
    "headingMarginTop": "10pt",
    "headingMarginBottom": "8pt"
  },
  "meals": {
    "pageBreakAfter": true,
    "detailsPadding": "10pt",
    "instructionsMarginTop": "10pt"
  },
  "grocery": {
    "categoryMarginBottom": "12pt",
    "itemMarginBottom": "4pt",
    "checkboxSize": "13pt"
  }
}
```

### Compact / Save Paper

Try these settings:

```json
{
  "page": {
    "marginTop": "0.3in",
    "marginRight": "0.3in",
    "marginBottom": "0.3in",
    "marginLeft": "0.3in"
  },
  "typography": {
    "baseFontSize": "10pt",
    "lineHeight": "1.2",
    "headingLineHeight": "1.1"
  },
  "spacing": {
    "sectionMarginBottom": "5pt",
    "paragraphMarginBottom": "4pt",
    "listItemMarginBottom": "2pt",
    "headingMarginTop": "5pt",
    "headingMarginBottom": "4pt"
  },
  "meals": {
    "pageBreakAfter": true,
    "detailsPadding": "5pt",
    "instructionsMarginTop": "5pt"
  },
  "grocery": {
    "categoryMarginBottom": "6pt",
    "itemMarginBottom": "2pt",
    "checkboxSize": "9pt"
  }
}
```

## Tips

1. **Test incrementally**: Change one value at a time and print preview to see the effect
2. **Use Print Preview**: Press Cmd+P (Mac) or Ctrl+P (Windows) to see how it looks without wasting paper
3. **Keep backups**: Copy the JSON before making big changes
4. **Restart dev server**: Changes only take effect after restarting `npm run dev`

## Troubleshooting

**Changes not appearing?**
- Make sure you saved the JSON file
- Restart the dev server
- Hard refresh the browser (Cmd+Shift+R)

**JSON syntax error?**
- Check for missing commas between properties
- Ensure all strings are in quotes
- Use a JSON validator online if needed

**Meals still over one page?**
- Your meals might just have a lot of content
- Try the "compact" preset above
- Consider shortening instruction text

## Default Values

If you mess up, here are the original default values:

```json
{
  "page": {
    "marginTop": "0.5in",
    "marginRight": "0.5in",
    "marginBottom": "0.5in",
    "marginLeft": "0.5in"
  },
  "typography": {
    "baseFontSize": "11pt",
    "lineHeight": "1.3",
    "headingLineHeight": "1.2"
  },
  "spacing": {
    "sectionMarginBottom": "8pt",
    "paragraphMarginBottom": "6pt",
    "listItemMarginBottom": "3pt",
    "headingMarginTop": "8pt",
    "headingMarginBottom": "6pt"
  },
  "meals": {
    "pageBreakAfter": true,
    "detailsPadding": "8pt",
    "instructionsMarginTop": "8pt"
  },
  "grocery": {
    "categoryMarginBottom": "10pt",
    "itemMarginBottom": "3pt",
    "checkboxSize": "11pt"
  }
}
```

Happy printing! 🖨️

