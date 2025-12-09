## Polish Header buttons and Hierarchy
 - Make print button in header match button properties of the header meal name button
 - Normalize rules for Header print button display versions
   - in 'tablet' viewport, button that just says 'Print' by itself feels deprecated, replace with middle ground between desktop and mobile
     - Mobile should use just a print icon, since the mealname is right there in the sub header
     - tablet should use icon + meal name to save space
     - Desktop stays the same with the word Print + meal name
   - Consider another break point between mobile and tablet wherein the subheader does not appear yet, but the print button becomes just the icon, and considers the highlighted header meal name button to be the verbosity
 - Make the print full week button inside the hamburger menu match the color of the one on the hero of the page
 - Consider putting the 'back to top' and 'print week' buttons inside the hamburger menu side by side for better visual hierarchy

## Polish Header transitions and page scroll position read states
 - Integrate blank space scroll buffer state between determined sections of the page
   - at the top of the page, the first most header button would not be highlighted until you scroll down a bit, there is some blank buffer scroll space
   - at the bottom of the page, the last most header button would not be highlighted, and in the case of the current website layout, clicking the 'Links' button or scrolling to the very bottom should in fact highlight the 'Links' button in the header
   - in between each meal section, there should be a short window of time, where since two meal sections are visible on the screen at once, no single header meal name button is highlighted
 - The header print buttons will work within this enhanced scroll position buffer stating as well
   - as you scroll to the end of a given meal section, the print button in the header will start to fade away in sync with the page scrolling, by the time you are halfway between the previous meal and the next meal, the print button in the header will have completely dissapeared, and it won't reappear for as the active print button for the next meal section, until the instant that the print button inside the section itself passes halfway through the header. 
