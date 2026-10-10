let allApis = [];
let categories = new Set();
let currentView = 'grid'; // 'grid' or 'list'

const apiContainer = document.getElementById('apiContainer');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const corsFilter = document.getElementById('corsFilter');
const apiCount = document.getElementById('apiCount');
const quickFilters = document.getElementById('quickFilters');
const expandFiltersBtn = document.getElementById('expandFiltersBtn');

let activeQuickFilters = new Set();

const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');

// Modal Elements
const modal = document.getElementById('testModal');
const closeModalBtn = document.querySelector('.close-modal');
const modalBackdrop = document.querySelector('.modal-backdrop');
const modalApiName = document.getElementById('modalApiName');
const modalApiUrl = document.getElementById('modalApiUrl');
const testEndpoint = document.getElementById('testEndpoint');
const runTestBtn = document.getElementById('runTestBtn');
const testResponse = document.getElementById('testResponse');
const testLoader = document.getElementById('testLoader');
const statusIndicator = document.getElementById('statusIndicator');

let currentTestUrl = '';

// Icons
const globeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
const playIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`;

// Initialization
async function init() {
    try {
        const response = await fetch('apis.json');
        allApis = await response.json();

        allApis.forEach(api => categories.add(api.category));

        const catArray = Array.from(categories).sort();
        catArray.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
            
            // Create Quick Filter pill
            const pill = document.createElement('button');
            pill.className = 'filter-pill';
            pill.textContent = cat;
            pill.addEventListener('click', () => {
                if (activeQuickFilters.has(cat)) {
                    activeQuickFilters.delete(cat);
                    pill.classList.remove('active');
                } else {
                    activeQuickFilters.add(cat);
                    pill.classList.add('active');
                }
                
                // Sync dropdown label
                const label = document.querySelector('.custom-select-wrapper:first-child .custom-select-label') || document.querySelector('.custom-select-label');
                if (activeQuickFilters.size > 0) {
                    categoryFilter.value = 'All'; // reset underlying select
                    if (label) label.textContent = `${activeQuickFilters.size} Selected`;
                    
                    // Clear custom dropdown selections
                    document.querySelectorAll('.custom-select-wrapper:first-child .custom-select-option').forEach(el => el.classList.remove('selected'));
                } else {
                    if (label) label.textContent = 'All Categories';
                }
                
                filterApis();
            });
            quickFilters.appendChild(pill);
        });

        createCustomSelect(categoryFilter);
        createCustomSelect(corsFilter);

        renderApis(allApis);

        expandFiltersBtn.addEventListener('click', () => {
            quickFilters.classList.toggle('expanded');
            expandFiltersBtn.classList.toggle('expanded');
        });

        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(filterApis, 300);
        });

        categoryFilter.addEventListener('change', () => {
            activeQuickFilters.clear();
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            filterApis();
        });
        corsFilter.addEventListener('change', filterApis);

        gridViewBtn.addEventListener('click', () => setView('grid'));
        listViewBtn.addEventListener('click', () => setView('list'));

    } catch (error) {
        apiContainer.innerHTML = `
            <div style="color: var(--text-main); grid-column: 1/-1; text-align: center; padding: 4rem 2rem;">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="var(--red)" stroke-width="2" fill="none" style="margin-bottom: 1rem;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <h3>Connection Error</h3>
                <p style="color: var(--text-muted); margin-top: 0.5rem;">Failed to load the API directory. Please check your internet connection or ensure apis.json exists.</p>
                <button onclick="window.location.reload()" class="black-btn" style="margin-top: 1.5rem;">Try Again</button>
            </div>
        `;
    }
}

function setView(viewMode) {
    currentView = viewMode;

    if (viewMode === 'grid') {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        apiContainer.className = 'api-grid fade-in-up delay-3';
    } else {
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        apiContainer.className = 'api-list fade-in-up delay-3';
    }

    filterApis();
}

function renderApis(apisToRender) {
    apiContainer.innerHTML = '';

    const fragment = document.createDocumentFragment();
    const displayApis = apisToRender.slice(0, 150);

    if (apisToRender.length > 150) {
        apiCount.textContent = `Displaying top 150 of ${apisToRender.length} results`;
    } else {
        apiCount.textContent = `Found ${apisToRender.length} results`;
    }

    if (currentView === 'list') {
        // Render List Header
        const header = document.createElement('div');
        header.className = 'api-list-header';
        header.innerHTML = `
            <div>Name</div>
            <div>Category</div>
            <div>Auth</div>
            <div>Description</div>
            <div style="text-align:right;">Actions</div>
        `;
        fragment.appendChild(header);
    }

    displayApis.forEach((api, index) => {
        const isCors = api.cors.toLowerCase() === 'yes';

        let authDisplay = api.auth || 'None';
        if (authDisplay.toLowerCase() === 'no') authDisplay = 'None';
        if (authDisplay === 'apiKey' || authDisplay === '`apiKey`') authDisplay = 'API Key';
        if (authDisplay === 'OAuth' || authDisplay === '`OAuth`') authDisplay = 'OAuth';
        if (authDisplay === 'User-Agent' || authDisplay === '`User-Agent`') authDisplay = 'User-Agent';

        if (currentView === 'grid') {
            const card = document.createElement('article');
            card.className = 'api-card';
            card.setAttribute('aria-label', api.name);
            card.style.animation = `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${Math.min(index * 0.03, 0.4)}s both`;
            
            card.innerHTML = `
                <div class="card__header">
                    <span class="tag" title="API Category">${api.category}</span>
                    <h3 class="card__title" title="${api.name}">${api.name}</h3>
                </div>

                <div class="card__body">
                    <p class="card__desc" title="${api.description}">${api.description}</p>
                </div>

                <div class="card__meta-grid">
                    <div class="meta-block">
                        <span class="meta-label" title="Authentication Requirement">Auth Type</span>
                        <span class="meta-value" title="${authDisplay}">${authDisplay}</span>
                    </div>
                    <div class="meta-block">
                        <span class="meta-label" title="Hypertext Transfer Protocol Secure">HTTPS</span>
                        <span class="meta-value">${api.https}</span>
                    </div>
                </div>

                <div class="card__footer">
                    <a href="${api.url}" target="_blank" class="btn-icon" aria-label="Open documentation" title="Documentation">
                        ${globeIcon}
                    </a>
                    <button class="btn-primary test-btn" data-name="${api.name}" data-url="${api.url}">
                        <span style="display:flex; align-items:center; width:16px; height:16px;">${playIcon}</span> Test
                    </button>
                </div>
            `;
            const testBtn = card.querySelector('.test-btn');
            testBtn.addEventListener('click', () => openTestModal(api));
            fragment.appendChild(card);

        } else {
            // List View Row
            const row = document.createElement('div');
            row.className = 'api-list-row';

            row.innerHTML = `
                <div class="col-name">
                    ${api.name}
                    ${isCors ? '<span class="badge green" style="font-size:0.65rem;">CORS</span>' : ''}
                </div>
                <div class="col-cat" style="font-weight:600; color:var(--text-muted);">${api.category}</div>
                <div class="col-auth" style="font-weight:600;">${authDisplay}</div>
                <div class="col-desc" title="${api.description}">${api.description}</div>
                <div class="col-actions" style="display:flex; gap:8px; align-items:center;">
                    <a href="${api.url}" target="_blank" class="btn-icon" aria-label="Open documentation" title="Documentation" style="width: 32px; height: 32px;">
                        ${globeIcon}
                    </a>
                    <button class="btn-primary test-btn" data-name="${api.name}" data-url="${api.url}" style="padding: 6px 16px; font-size: 12px;">
                        <span style="display:flex; align-items:center; width:14px; height:14px; margin-right: 4px;">${playIcon}</span> Test
                    </button>
                </div>
            `;
            const testBtn = row.querySelector('.test-btn');
            testBtn.addEventListener('click', () => openTestModal(api));
            fragment.appendChild(row);
        }
    });

    apiContainer.appendChild(fragment);
}

function filterApis() {
    const rawSearch = searchInput.value.toLowerCase().trim();
    const searchWords = rawSearch.split(/\s+/).filter(w => w.length > 2);

    const category = categoryFilter.value;
    const cors = corsFilter.value;

    const filtered = allApis.filter(api => {
        const textToSearch = (api.name + " " + api.description + " " + api.category).toLowerCase();

        let matchesSearch = true;
        if (rawSearch) {
            if (textToSearch.includes(rawSearch)) {
                matchesSearch = true;
            } else if (searchWords.length > 0) {
                const matchCount = searchWords.filter(word => textToSearch.includes(word)).length;
                matchesSearch = (matchCount / searchWords.length) >= 0.5;
            } else {
                matchesSearch = false;
            }
        }

        let matchesCategory = true;
        if (activeQuickFilters.size > 0) {
            matchesCategory = activeQuickFilters.has(api.category);
        } else {
            matchesCategory = category === 'All' || api.category === category;
        }

        let matchesCors = true;
        if (cors !== 'All') {
            matchesCors = api.cors.toLowerCase() === cors.toLowerCase();
        }

        return matchesSearch && matchesCategory && matchesCors;
    });

    renderApis(filtered);
}

function openTestModal(api) {
    modalApiName.textContent = api.name;
    modalApiUrl.textContent = api.url;
    modalApiUrl.href = api.url;
    currentTestUrl = api.url;

    testEndpoint.value = '';
    testResponse.textContent = "Waiting for execution...";
    statusIndicator.textContent = "Ready";
    statusIndicator.className = "status-indicator";

    modal.classList.add('active');
    document.body.classList.add('no-scroll');
}

function closeModal() {
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

function createCustomSelect(selectElement) {
    selectElement.style.display = 'none';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    
    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    
    const label = document.createElement('span');
    label.className = 'custom-select-label';
    label.textContent = selectElement.options[selectElement.selectedIndex].textContent;
    trigger.appendChild(label);
    
    const chevron = document.createElement('span');
    chevron.className = 'custom-select-chevron';
    chevron.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    trigger.appendChild(chevron);
    
    const menu = document.createElement('div');
    menu.className = 'custom-select-menu';
    
    Array.from(selectElement.options).forEach(opt => {
        const item = document.createElement('div');
        item.className = 'custom-select-option';
        item.textContent = opt.textContent;
        if (opt.selected) item.classList.add('selected');
        
        item.addEventListener('click', () => {
            selectElement.value = opt.value;
            label.textContent = opt.textContent;
            
            menu.querySelectorAll('.custom-select-option').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            
            selectElement.dispatchEvent(new Event('change'));
            
            menu.classList.remove('open');
            trigger.classList.remove('open');
        });
        menu.appendChild(item);
    });
    
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    selectElement.parentNode.insertBefore(wrapper, selectElement.nextSibling);
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        
        document.querySelectorAll('.custom-select-menu.open').forEach(m => {
            m.classList.remove('open');
            m.previousSibling.classList.remove('open');
        });
        
        if (!isOpen) {
            menu.classList.add('open');
            trigger.classList.add('open');
            
            const selectedItem = menu.querySelector('.selected');
            if (selectedItem) {
                menu.scrollTop = selectedItem.offsetTop - (menu.offsetHeight / 2) + (selectedItem.offsetHeight / 2);
            }
        }
    });
    
    document.addEventListener('click', () => {
        menu.classList.remove('open');
        trigger.classList.remove('open');
    });
}

closeModalBtn.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

runTestBtn.addEventListener('click', async () => {
    let endpoint = testEndpoint.value.trim();

    // Auto-sanitize if the user pastes a curl command
    if (endpoint.toLowerCase().startsWith('curl ')) {
        endpoint = endpoint.substring(5).trim();
        // Remove surrounding quotes if present
        if (endpoint.startsWith("'") && endpoint.endsWith("'")) {
            endpoint = endpoint.slice(1, -1);
        }
        if (endpoint.startsWith('"') && endpoint.endsWith('"')) {
            endpoint = endpoint.slice(1, -1);
        }
    }

    let targetUrl = currentTestUrl;
    
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        targetUrl = endpoint;
    } else {
        if (endpoint && !endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        if (targetUrl.endsWith('/')) {
            targetUrl = targetUrl.slice(0, -1);
        }
        targetUrl += endpoint;
    }

    testLoader.style.display = 'block';
    testResponse.textContent = "";
    statusIndicator.textContent = "Executing...";
    statusIndicator.className = "status-indicator";
    runTestBtn.disabled = true;

    try {
        const startTime = performance.now();
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*'
            }
        });

        const endTime = performance.now();
        const timeTaken = (endTime - startTime).toFixed(0);

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
            data = JSON.stringify(data, null, 2);
        } else {
            data = await response.text();
            if (data.length > 5000) data = data.substring(0, 5000) + '\n\n... (Output truncated)';
        }

        testResponse.textContent = data;
        statusIndicator.textContent = `${response.status} ${response.statusText} • ${timeTaken}ms`;

        if (!response.ok) {
            statusIndicator.classList.add('error');
        } else {
            statusIndicator.classList.add('success');
        }

    } catch (error) {
        statusIndicator.textContent = "Failed";
        statusIndicator.classList.add('error');
        testResponse.textContent = `Network Error: ${error.message}\n\nTroubleshooting:\n- The API might not support CORS from browsers.\n- Authentication may be required.\n- The URL path might be invalid.`;
    } finally {
        testLoader.style.display = 'none';
        runTestBtn.disabled = false;
    }
});

// Init
init();

// Scroll to Top Logic
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        scrollToTopBtn.classList.add('visible');
    } else {
        scrollToTopBtn.classList.remove('visible');
    }
});
scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});
