# Dependency Migration Plan

This document outlines migration plans for major version dependency updates that require code changes or careful evaluation.

## ✅ Completed Updates (Simple)

These updates have been completed successfully:

- **Astro**: `5.16.4` → `5.16.5` (patch version - no breaking changes)
- **GitHub Actions**:
  - `actions/checkout@v4` → `v6`
  - `actions/setup-node@v4` → `v6`
  - `actions/upload-pages-artifact@v3` → `v4`

---

## 🔄 Major Version Updates Requiring Migration

### 1. Tailwind CSS: `3.4.19` → `4.1.18`

**Status**: ⚠️ **MAJOR BREAKING CHANGES** - Requires significant migration

**Impact**: Tailwind CSS v4 is a complete rewrite with fundamental architectural changes.

#### Key Breaking Changes:

1. **Configuration Format**
   - v3: `tailwind.config.mjs` with `theme.extend`
   - v4: CSS-first configuration using `@theme` directive in CSS files
   - **Action Required**: Migrate all theme definitions from `tailwind.config.mjs` to CSS

2. **CSS Custom Properties**
   - v4 uses CSS variables directly instead of generating utilities
   - Current approach (`theme()` function in `global.css`) may need adjustment
   - **Action Required**: Review how CSS variables are defined and used

3. **Plugin System**
   - v4 has a new plugin API
   - **Action Required**: Verify `@astrojs/tailwind` compatibility with v4

4. **Utility Generation**
   - Some utility classes may have changed or been removed
   - **Action Required**: Test all Tailwind utilities used in components

#### Migration Steps:

1. **Research Phase**:
   - Review [Tailwind CSS v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
   - Check `@astrojs/tailwind` compatibility with Tailwind v4
   - Identify all Tailwind utilities used in codebase

2. **Configuration Migration**:
   - Move theme definitions from `tailwind.config.mjs` to CSS using `@theme`
   - Update color, spacing, font, and breakpoint definitions
   - Test that all design tokens still work

3. **Component Updates**:
   - Review all components using Tailwind utilities
   - Update any deprecated or changed utilities
   - Verify visual parity after migration

4. **Testing**:
   - Run full build and verify no errors
   - Visual regression testing (compare before/after)
   - Test print functionality (uses Tailwind utilities)
   - Test responsive breakpoints

#### Estimated Effort: **4-8 hours**

#### Risk Level: **HIGH** - Core styling framework rewrite

#### Recommendation: 
- **Defer until needed** - v3.4.19 is stable and secure
- **Plan as separate project** - This is a significant refactor, not a simple update
- **Consider waiting** for more ecosystem maturity (Astro integration, plugin support)

---

### 2. Marked: `13.0.0` → `17.0.1`

**Status**: ⚠️ **MAJOR BREAKING CHANGES** - Requires code review

**Impact**: Major version jump (13 → 17) suggests significant API changes.

#### Key Concerns:

1. **API Changes**
   - Check if `marked.parse()` or other APIs have changed
   - Review breaking changes in changelog
   - **Action Required**: Test markdown parsing functionality

2. **Usage in Codebase**:
   - Used in `src/utils/weekParser.ts`:
     - `marked.lexer(content)` - Converts markdown to tokens
     - `Tokens.List` - Type for list tokens (grocery lists, instruction lists)
     - `Tokens` type imports for type checking
   - **Action Required**: Verify `marked.lexer()` API hasn't changed
   - **Action Required**: Check if `Tokens.List` structure is still compatible

#### Migration Steps:

1. **Research Phase**:
   - Review [Marked v17 Release Notes](https://github.com/markedjs/marked/releases)
   - Identify breaking changes between v13 and v17
   - Check if current usage patterns are still supported

2. **Code Review**:
   - Find all `marked` imports and usage
   - Review parsing logic in `src/utils/weekParser.ts`
   - Check if any custom renderers or extensions are used

3. **Testing**:
   - Test markdown parsing with current `FOOD-OF-THE-WEEK.md` structure
   - Verify all markdown features still work (headings, lists, bold, etc.)
   - Test edge cases and complex markdown

4. **Update**:
   - Update `package.json` dependency
   - Fix any API changes
   - Run full test suite

#### Estimated Effort: **1-3 hours**

#### Risk Level: **MEDIUM** - Core parsing library, but likely backward compatible

#### Recommendation:
- **Proceed with caution** - Review changelog first
- **Test thoroughly** - Markdown parsing is critical to the app
- **Consider incremental update** - Update to v14, then v15, etc. to catch issues early

---

## 📋 Migration Checklist

When ready to proceed with major migrations:

### Pre-Migration:
- [ ] Create feature branch for migration
- [ ] Review all breaking changes in official docs
- [ ] Check ecosystem compatibility (Astro, plugins, etc.)
- [ ] Document current behavior (screenshots, test cases)

### During Migration:
- [ ] Update dependencies incrementally if possible
- [ ] Update configuration files
- [ ] Fix breaking changes
- [ ] Update code to match new APIs

### Post-Migration:
- [ ] Run full build (`npm run build`)
- [ ] Visual regression testing
- [ ] Test all features (parsing, printing, responsive)
- [ ] Update documentation if needed
- [ ] Commit and test in production-like environment

---

## 🎯 Priority Recommendations

1. **Tailwind CSS v4**: **DEFER** - Too risky, v3 is stable
2. **Marked v17**: **EVALUATE** - Review changelog, test if safe, then proceed

---

## 📚 Resources

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Marked Releases](https://github.com/markedjs/marked/releases)
- [Astro Tailwind Integration](https://docs.astro.build/en/guides/integrations-guide/tailwind/)

---

**Last Updated**: December 14, 2025
**Status**: Simple updates completed, major migrations deferred pending evaluation
