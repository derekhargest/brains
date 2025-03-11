import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import slugify from 'slugify';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as fsExtra from 'fs-extra';

// Setup dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// Define the wiki content directory
const WIKI_DIR = path.join(__dirname, '..', 'wiki');
console.log('Wiki directory set to:', WIKI_DIR);

// Ensure wiki directory exists
try {
  await fsExtra.ensureDir(WIKI_DIR);
  console.log('Wiki directory exists or was created successfully');
} catch (error) {
  console.error('Failed to create wiki directory:', error);
}

// Create initial home page if it doesn't exist
const homePage = path.join(WIKI_DIR, 'home.md');
if (!(await fsExtra.pathExists(homePage))) {
  const initialContent = `---
title: Home
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
---

# Welcome to the AI Memory System Wiki

This wiki contains documentation about the AI Memory System project.

## Quick Links

- [About the Project](./about)
- [How to Use](./how-to-use)
- [API Documentation](./api-docs)
- [Technical Architecture](./architecture)

Feel free to edit this page or create new pages to document the project.
`;
  await fs.writeFile(homePage, initialContent);
}

/**
 * Get all wiki pages
 */
export async function getAllPages() {
  try {
    const files = await fs.readdir(WIKI_DIR);
    const pages = await Promise.all(files
      .filter(file => file.endsWith('.md'))
      .map(async file => {
        const rawContent = await fs.readFile(path.join(WIKI_DIR, file), 'utf8');
        const { data, content } = matter(rawContent);
        const slug = file.replace('.md', '');
        
        return {
          slug,
          title: data.title || slug,
          created: data.created || null,
          updated: data.updated || null,
          excerpt: content.split('\n').slice(0, 3).join(' ').substring(0, 150) + '...'
        };
      }));
    return pages.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    console.error('Error getting wiki pages:', error);
    return [];
  }
}

/**
 * Get a specific wiki page by slug
 */
export async function getPage(slug) {
  try {
    const filePath = path.join(WIKI_DIR, `${slug}.md`);
    if (!(await fsExtra.pathExists(filePath))) {
      return null;
    }
    
    const rawContent = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(rawContent);
    const htmlContent = md.render(content);
    
    return {
      slug,
      title: data.title || slug,
      created: data.created || null,
      updated: data.updated || null,
      content: htmlContent,
      raw: content
    };
  } catch (error) {
    console.error(`Error getting wiki page ${slug}:`, error);
    return null;
  }
}

/**
 * Save a wiki page
 */
export async function savePage(slug, title, content) {
  try {
    console.log(`Saving page: ${slug}, title: ${title}`);
    console.log(`Wiki directory: ${WIKI_DIR}`);
    
    const now = new Date().toISOString();
    const filePath = path.join(WIKI_DIR, `${slug}.md`);
    console.log(`File path: ${filePath}`);
    
    // Check if file exists to determine if created or updated
    const exists = await fsExtra.pathExists(filePath);
    
    let frontmatter = {
      title,
      updated: now
    };
    
    // If page is new, add created date
    if (!exists) {
      frontmatter.created = now;
    } else {
      // If page exists, preserve original created date
      const existingContent = await fs.readFile(filePath, 'utf8');
      const { data } = matter(existingContent);
      if (data.created) {
        frontmatter.created = data.created;
      }
    }
    
    // Create full content with frontmatter
    const fullContent = matter.stringify(content, frontmatter);
    
    // Save the file
    await fs.writeFile(filePath, fullContent);
    
    return {
      success: true,
      slug,
      title,
      created: frontmatter.created,
      updated: frontmatter.updated
    };
  } catch (error) {
    console.error(`Error saving wiki page ${slug}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Delete a wiki page
 */
export async function deletePage(slug) {
  try {
    // Don't allow deleting home page
    if (slug === 'home') {
      return {
        success: false,
        error: 'Cannot delete home page'
      };
    }
    
    const filePath = path.join(WIKI_DIR, `${slug}.md`);
    if (!(await fsExtra.pathExists(filePath))) {
      return {
        success: false,
        error: 'Page not found'
      };
    }
    
    await fs.unlink(filePath);
    
    return {
      success: true,
      message: `Page ${slug} deleted successfully`
    };
  } catch (error) {
    console.error(`Error deleting wiki page ${slug}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create a slug from a title
 */
export function createSlug(title) {
  return slugify(title, {
    lower: true,
    strict: true
  });
}

export async function ensureWikiDirectory(wikiDir) {
  try {
    console.log('Wiki directory set to:', wikiDir);
    await fsExtra.ensureDir(wikiDir);
    return true;
  } catch (error) {
    console.error('Failed to create wiki directory:', error);
    return false;
  }
} 