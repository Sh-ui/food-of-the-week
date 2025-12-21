#!/usr/bin/env python3
import os
import re
import glob

def migrate_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Define the replacements
    replacements = [
        (r'^\*\*Protein:\*\*\s*', '#### Protein: '),
        (r'^\*\*Ingredients:\*\*\s*', '#### Ingredients: '),
        (r'^\*\*Description:\*\*\s*', '#### Description: '),
        (r'^\*\*Day:\*\*\s*', '#### Day: '),
        (r'^\*\*Instructions:\*\*\s*$', '### Instructions'),
        (r'^\*\*Already Prepped:\*\*\s*$', '### Already Prepped'),
        (r'^\*\*Sous Chef - Prep:\*\*\s*$', '### Sous Chef - Prep'),
        (r'^\*\*Sous Chef - Cooking:\*\*\s*$', '### Sous Chef - Cooking'),
        (r'^\*\*Chef - Finishing & Plating:\*\*\s*$', '### Chef - Finishing & Plating'),
    ]

    # Apply all replacements
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

    # Write back to file
    with open(filepath, 'w') as f:
        f.write(content)

    print(f"Migrated {filepath}")

if __name__ == '__main__':
    # Get all archive markdown files
    archive_files = glob.glob('archive/*.md')
    archive_files = [f for f in archive_files if not f.endswith('.bak')]

    for filepath in archive_files:
        migrate_file(filepath)
