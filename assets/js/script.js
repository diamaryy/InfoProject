document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const container = document.getElementById('jobs-container');
    const usernameSpan = document.getElementById('username');
    const API_URL = "https://api.sheety.co/3333c1e1c7776341c6bdbef9be3fc265/copyOfCopyOfInternshipData/internshipJobsDataCsv";


    let jobs = [];
    let currentView = 'all';
    if (currentUser && usernameSpan) {
        usernameSpan.textContent = currentUser.username;
    }

    const logoutWrapper = document.getElementById('logoutWrapper');
    if (logoutWrapper) {
        logoutWrapper.style.display = currentUser ? 'block' : 'none';
    }

const loginWrapper = document.getElementById('loginWrapper');
if (loginWrapper) {
  loginWrapper.style.display = currentUser ? 'none' : 'block';
}

const viewButtons = document.querySelectorAll('.view-toggle button');
viewButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    viewButtons.forEach(btn => btn.classList.remove('view-active'));
    btn.classList.add('view-active');
  });
});

    try {
        showLoading();
        const response = await fetch(API_URL);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch jobs: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        jobs = data.internshipJobsDataCsv;

        populateLocations();
        populateJobTypesAndCategories();

        setupEventListeners();
        updateView();
        hideLoading();
    } catch (error) {
        hideLoading();
        container.innerHTML = `<div class="error">⚠️ ${error.message}</div>`;
    }

    function updateView() {
        const filtered = filterJobs();
        container.innerHTML = filtered.map(job => `
            <div class="job-card-flip">
                <div class="job-card-inner">
                    <div class="job-card-front">
                        <h3 class="job-title">${job.jobTitle}</h3>
                        <div class="job-card-info">
                        <p><strong>${job.companyName}</strong></p>
                        <p>📍 ${job.location}</p>
                        <p>💰 ${job.salary}</p>
                        <p>⏳ ${job.duration}</p>
                        ${job.email ? `<p>📧 ${job.email}</p>` : ''} <!-- Plain text email (no link) -->
                        </div>
                        <button 
                            class="favorite-btn ${!currentUser ? 'disabled' : ''} ${currentUser?.favorites?.some(f => f.id == job.id) ? 'favorited' : ''}" 
                            data-id="${job.id}">
                            ${currentUser?.favorites?.some(f => f.id == job.id) ? '❤️' : '☆'}
                        </button>
                        <button class="detail-btn">Details</button>
                    </div>
                    <div class="job-card-back">
                       <h4 class="job-details-title">Details</h4>
                        <p class="job-details-text">${job.description}</p>
                        <button class="back-btn">Show Less</button>
                    </div>
                </div>
            </div>
        `).join(''); 
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="no-results">😢 No internships found matching your filters.</div>';
        }

        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                toggleFavorite(e);
            });
        });

        document.querySelectorAll('.detail-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cardInner = btn.closest('.job-card-inner');
                cardInner.classList.add('flipped');
            });
        });

        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cardInner = btn.closest('.job-card-inner');
                cardInner.classList.remove('flipped');
            });
        });
    }

    function toggleFavorite(e) {
        if (!Array.isArray(currentUser.favorites)) {
            currentUser.favorites = [];
        }

        const jobId = e.target.dataset.id;
        const job = jobs.find(j => j.id == jobId);
        const index = currentUser.favorites.findIndex(f => f.id == jobId);

        if (index === -1) {
            currentUser.favorites.push(job);
        } else {
            currentUser.favorites.splice(index, 1);
        }

        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        const users = JSON.parse(localStorage.getItem('jobBoardUsers')) || {};
        if (users[currentUser.username]) {
            users[currentUser.username].favorites = currentUser.favorites;
            localStorage.setItem('jobBoardUsers', JSON.stringify(users));
        }

        updateView();
    }

    function filterJobs() {
        const search = document.getElementById('search').value.toLowerCase();
        const location = document.getElementById('locationFilter').value;
        const jobType = document.getElementById('jobTypeFilter').value;
        const category = document.getElementById('categoryFilter').value;

        return jobs.filter(job => {
            const matchesSearch = job.jobTitle.toLowerCase().includes(search) || 
                                  job.companyName.toLowerCase().includes(search);
            const matchesLocation = location ? job.location === location : true;
            const matchesType = jobType ? job.jobType === jobType : true;
            const matchesCategory = category ? job.jobCategory === category : true;
            const isFavorite = currentUser?.favorites?.some(f => f.id == job.id) || false;

            return matchesSearch && matchesLocation && matchesType && matchesCategory &&
                   (currentView === 'all' || isFavorite);
        });
    }

    function populateLocations() {
        const locations = [...new Set(jobs.map(job => job.location))];
        const select = document.getElementById('locationFilter');
        select.innerHTML = `
            <option value="">All Locations</option>
            ${locations.map(loc => `<option>${loc}</option>`).join('')}
        `;
    }

    function populateJobTypesAndCategories() {
        const jobTypes = [...new Set(jobs.map(job => job.jobType))];
        const categories = [...new Set(jobs.map(job => job.jobCategory))];

        const jobTypeSelect = document.getElementById('jobTypeFilter');
        const categorySelect = document.getElementById('categoryFilter');

        jobTypeSelect.innerHTML = `<option value="">All Job Types</option>` +
            jobTypes.map(type => `<option value="${type}">${type}</option>`).join('');

        categorySelect.innerHTML = `<option value="">All Categories</option>` +
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    function setupEventListeners() {
        document.getElementById('search').addEventListener('input', () => updateView());
        document.getElementById('locationFilter').addEventListener('change', () => updateView());
        document.getElementById('jobTypeFilter').addEventListener('change', () => updateView());
        document.getElementById('categoryFilter').addEventListener('change', () => updateView());
        document.getElementById('logoutBtn').addEventListener('click', logout);

        document.getElementById('viewAll').addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });

        document.getElementById('viewFavorites').addEventListener('click', () => {
            currentView = 'favorites';
            updateView();
        });

        const viewFavBtn = document.getElementById('viewFavorites');
        if (viewFavBtn) viewFavBtn.textContent = "View Favorites";
    }

    function logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    function showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
        }
    }

    function hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
        }
    }
});

     