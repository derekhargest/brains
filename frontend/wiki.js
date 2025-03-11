// DOM elements
const pageList = document.getElementById('pageList');
const pageContent = document.getElementById('pageContent');
const editContainer = document.getElementById('editContainer');
const currentPageTitle = document.getElementById('currentPageTitle');
const wikiBreadcrumb = document.getElementById('wikiBreadcrumb');
const wikiActions = document.getElementById('wikiActions');
const newPageBtn = document.getElementById('newPageBtn');
const editPageBtn = document.getElementById('editPageBtn');
const deletePageBtn = document.getElementById('deletePageBtn');
const savePageBtn = document.getElementById('savePageBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const pageTitle = document.getElementById('pageTitle');
const pageSlug = document.getElementById('pageSlug');
const markdownContent = document.getElementById('markdownContent');
const pageSearch = document.getElementById('pageSearch');

// State
let currentPage = null;
let allPages = [];
let isEditMode = false;
let isNewPage = false;

// API URL
const API_URL = 'http://localhost:3002/api';

// Event listeners
newPageBtn.addEventListener('click', createNewPage);
editPageBtn.addEventListener('click', editCurrentPage);
deletePageBtn.addEventListener('click', deleteCurrentPage);
savePageBtn.addEventListener('click', savePage);
cancelEditBtn.addEventListener('click', cancelEdit);
pageTitle.addEventListener('input', generateSlug);
pageSearch.addEventListener('input', filterPages);

// Functions
async function loadAllPages() {
  try {
    const response = await fetch(`${API_URL}/wiki`);
    const data = await response.json();
    
    if (data.success) {
      allPages = data.pages;
      renderPageList(allPages);
      
      // Load home page by default if no page is selected
      if (!currentPage) {
        loadPage('home');
      }
    } else {
      showError('Failed to load pages');
    }
  } catch (error) {
    console.error('Error loading pages:', error);
    showError('Failed to load pages');
  }
}

function renderPageList(pages) {
  pageList.innerHTML = '';
  
  if (pages.length === 0) {
    pageList.innerHTML = '<li class="no-pages">No pages found</li>';
    return;
  }
  
  pages.forEach(page => {
    const li = document.createElement('li');
    li.textContent = page.title;
    li.dataset.slug = page.slug;
    
    if (currentPage && page.slug === currentPage.slug) {
      li.classList.add('active');
    }
    
    li.addEventListener('click', () => loadPage(page.slug));
    pageList.appendChild(li);
  });
}

async function loadPage(slug) {
  try {
    // Show loading state
    pageContent.innerHTML = '<div class="loading-content"><p>Loading content...</p></div>';
    currentPageTitle.textContent = 'Loading...';
    
    const response = await fetch(`${API_URL}/wiki/${slug}`);
    const data = await response.json();
    
    if (data.success) {
      currentPage = data.page;
      renderPage(currentPage);
      
      // Update active state in sidebar
      const pageItems = pageList.querySelectorAll('li');
      pageItems.forEach(item => {
        if (item.dataset.slug === slug) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      
      // Show edit/delete buttons for loaded page
      wikiActions.style.display = 'block';
    } else {
      showError('Page not found');
      
      // If the page doesn't exist, we could offer to create it
      if (response.status === 404) {
        pageContent.innerHTML = `
          <div class="not-found">
            <h2>Page Not Found</h2>
            <p>The page "${slug}" does not exist.</p>
            <button id="createMissingPage" class="btn-primary">Create This Page</button>
          </div>
        `;
        
        document.getElementById('createMissingPage').addEventListener('click', () => {
          createNewPage(slug);
        });
      }
    }
  } catch (error) {
    console.error('Error loading page:', error);
    showError('Failed to load page');
  }
}

function renderPage(page) {
  currentPageTitle.textContent = page.title;
  pageContent.innerHTML = page.content;
  
  // Add timestamp info
  const timestampInfo = document.createElement('div');
  timestampInfo.className = 'page-timestamps';
  
  const createdDate = page.created ? new Date(page.created).toLocaleString() : 'Unknown';
  const updatedDate = page.updated ? new Date(page.updated).toLocaleString() : 'Unknown';
  
  timestampInfo.innerHTML = `
    <small>
      Created: ${createdDate} | 
      Last updated: ${updatedDate}
    </small>
  `;
  
  pageContent.appendChild(document.createElement('hr'));
  pageContent.appendChild(timestampInfo);
}

function showError(message) {
  pageContent.innerHTML = `
    <div class="error-message">
      <p>${message}</p>
    </div>
  `;
}

function createNewPage(suggestedSlug) {
  isNewPage = true;
  isEditMode = true;
  currentPage = null;
  
  // Hide page content and show editor
  pageContent.style.display = 'none';
  editContainer.style.display = 'block';
  
  // Clear form fields
  pageTitle.value = '';
  pageSlug.value = suggestedSlug || '';
  markdownContent.value = '# New Page\n\nStart writing your content here...';
  
  // Update UI
  currentPageTitle.textContent = 'New Page';
  wikiActions.style.display = 'none';
}

function editCurrentPage() {
  if (!currentPage) return;
  
  isEditMode = true;
  isNewPage = false;
  
  // Hide page content and show editor
  pageContent.style.display = 'none';
  editContainer.style.display = 'block';
  
  // Populate form fields
  pageTitle.value = currentPage.title;
  pageSlug.value = currentPage.slug;
  markdownContent.value = currentPage.raw;
  
  // Hide actions while editing
  wikiActions.style.display = 'none';
}

function cancelEdit() {
  isEditMode = false;
  
  // Show page content and hide editor
  pageContent.style.display = 'block';
  editContainer.style.display = 'none';
  
  // Show actions if we have a current page
  if (currentPage) {
    wikiActions.style.display = 'block';
    renderPage(currentPage);
  } else {
    // If we were creating a new page and cancelled, load the home page
    loadPage('home');
  }
}

async function savePage() {
  const title = pageTitle.value.trim();
  const content = markdownContent.value.trim();
  let slug = pageSlug.value.trim();
  
  if (!title) {
    alert('Title is required');
    return;
  }
  
  if (!content) {
    alert('Content is required');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/wiki`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        content,
        slug
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Reset edit mode
      isEditMode = false;
      isNewPage = false;
      
      // Show success message
      alert('Page saved successfully');
      
      // Reload all pages to update the sidebar
      await loadAllPages();
      
      // Load the saved page
      loadPage(data.slug);
      
      // Show page content and hide editor
      pageContent.style.display = 'block';
      editContainer.style.display = 'none';
    } else {
      alert(`Failed to save page: ${data.error}`);
    }
  } catch (error) {
    console.error('Error saving page:', error);
    alert('Failed to save page');
  }
}

async function deleteCurrentPage() {
  if (!currentPage) return;
  
  // Don't allow deleting the home page
  if (currentPage.slug === 'home') {
    alert('Cannot delete the home page');
    return;
  }
  
  if (!confirm(`Are you sure you want to delete "${currentPage.title}"? This cannot be undone.`)) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/wiki/${currentPage.slug}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Page deleted successfully');
      
      // Reload all pages to update the sidebar
      await loadAllPages();
      
      // Load the home page
      loadPage('home');
    } else {
      alert(`Failed to delete page: ${data.error}`);
    }
  } catch (error) {
    console.error('Error deleting page:', error);
    alert('Failed to delete page');
  }
}

function generateSlug() {
  // Only auto-generate slug for new pages or if slug is empty
  if (isNewPage || !pageSlug.value.trim()) {
    const title = pageTitle.value.trim();
    if (title) {
      // Simple slug generation (for better handling, use the slugify library on server)
      const slug = title.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
      
      pageSlug.value = slug;
    }
  }
}

function filterPages() {
  const searchTerm = pageSearch.value.toLowerCase();
  
  if (!searchTerm) {
    renderPageList(allPages);
    return;
  }
  
  const filteredPages = allPages.filter(page => 
    page.title.toLowerCase().includes(searchTerm) || 
    page.slug.toLowerCase().includes(searchTerm)
  );
  
  renderPageList(filteredPages);
}

// Initialize
function init() {
  loadAllPages();
}

init(); 