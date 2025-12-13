# Title header <!-- the week of range/date for the hero at the top of the page -->


## First section header <!-- Grocery List, expecting subsections with checklist items until next section header -->
- [ ] expecting checklist item one
- [ ] ... 

### First checklist item <!-- one or more checklist items sub section -->
- [ ] ... 

### Second checklist item <!-- one or more checklist items sub section -->
- [ ] ... 


## Second section header <!-- Meal 1, expecting recipe instructions until next section header -->

**Sub section item one :** some text

**Sub section item two:** some text

**Sub section item three:** some text 

<!-- 
can expect any number of these sub sections that will be grouped together until the next delimiter
if text is placed next to the bold sub section name, it will be grouped with it's neighbors
-->

<!-- The **instructions:** thing is no longer needed to delineate the above from the instruction sections below because the parser now uses wheteher or not the text is on the same line as the sub section name to determine if it is part of the sub section or not -->

**Section Instruction One:** 

some text underneath as part of this instruction section

**Section Instruction Two:** 

some text underneath as part of this instruction section

**Section Instruction Three:** 

some text underneath as part of this instruction section


## Third section header <!-- Meal 2, expecting recipe instructions until next section header -->

<!-- the pattern continues as above for how ever many sections with sub sections inside -->