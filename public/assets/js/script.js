import { toggleFavoriteJob, getCurrentUser } from './auth.js';
import { showLoading, hideLoading } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Get current user from either source
    const currentUser = getCurrentUser();
    const container = document.getElementById('jobs-container');
    const usernameSpan = document.getElementById('username');
    const API_URL = "https://api.sheety.co/6fd29e47dbc53b9a4eeb9bb859a7f01f/newInternshipJobsData/internshipJobsDataCsv";

    let jobs = [];
    let currentView = 'all';
    
    // Update UI based on auth state
    if (currentUser && usernameSpan) {
        usernameSpan.textContent = currentUser.username || currentUser.email?.split('@')[0] || 'User';
    }

    // Set up auth UI elements
    const logoutWrapper = document.getElementById('logoutWrapper');
    const loginWrapper = document.getElementById('loginWrapper');
    const viewFavoritesBtn = document.getElementById('viewFavorites');

    if (logoutWrapper) logoutWrapper.style.display = currentUser ? 'block' : 'none';
    if (loginWrapper) loginWrapper.style.display = currentUser ? 'none' : 'block';
    if (viewFavoritesBtn) viewFavoritesBtn.disabled = !currentUser;

    // View toggle buttons
    const viewButtons = document.querySelectorAll('.view-toggle button');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('view-active'));
            btn.classList.add('view-active');
        });
    });

    try {
        showLoading();
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Failed to fetch jobs: ${response.status}`);
        const data = await response.json();
        jobs = data.internshipJobsDataCsv;

        populateLocations();
        populateJobTypesAndCategories();
        setupEventListeners();
        updateView();
    } catch (error) {
        container.innerHTML = `<div class="error">⚠️ ${error.message}</div>`;
    } finally {
        hideLoading();
    }

    async function updateView() {
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
                            ${job.email ? `<p>📧 ${job.email}</p>` : ''}
                        </div>
                        <button 
                            class="favorite-btn ${!currentUser ? 'disabled' : ''} ${isJobFavorited(job.id) ? 'favorited' : ''}" 
                            data-id="${job.id}">
                            ${isJobFavorited(job.id) ? '❤️' : '☆'}
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

        setupDynamicEventListeners();
    }

    function isJobFavorited(jobId) {
        if (!currentUser) return false;
        if (currentUser.isLocalUser) {
            return currentUser.favorites?.some(f => f.id == jobId) || false;
        }
        return currentUser.favorites?.some(f => f.id == jobId) || false;
    }

    function setupDynamicEventListeners() {
        // Favorite buttons
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!currentUser) {
                    alert('Please login to save favorites');
                    return;
                }
                
                const jobId = e.target.dataset.id;
                const job = jobs.find(j => j.id == jobId);
                
                try {
                    const userId = currentUser.isLocalUser ? `local-${currentUser.username}` : currentUser.uid;
                    const isFavorite = await toggleFavoriteJob(userId, job);
                    
                    // Update UI immediately
                    e.target.innerHTML = isFavorite ? '❤️' : '☆';
                    e.target.classList.toggle('favorited', isFavorite);
                    
                    // Update local state
                    if (currentUser.isLocalUser) {
                        if (isFavorite) {
                            currentUser.favorites = [...(currentUser.favorites || []), job];
                        } else {
                            currentUser.favorites = (currentUser.favorites || []).filter(f => f.id !== job.id);
                        }
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    }
                } catch (error) {
                    console.error("Error toggling favorite:", error);
                    alert('Failed to update favorites');
                }
            });
        });

        // Card flip buttons
        document.querySelectorAll('.detail-btn, .back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cardInner = e.target.closest('.job-card-inner');
                cardInner?.classList.toggle('flipped');
            });
        });
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
            const isFavorite = isJobFavorited(job.id);

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
        // Filter controls
        document.getElementById('search').addEventListener('input', updateView);
        document.getElementById('locationFilter').addEventListener('change', updateView);
        document.getElementById('jobTypeFilter').addEventListener('change', updateView);
        document.getElementById('categoryFilter').addEventListener('change', updateView);

        // View controls
        document.getElementById('viewAll').addEventListener('click', () => {
            currentView = 'all';
            updateView();
        });

        document.getElementById('viewFavorites').addEventListener('click', () => {
            if (!currentUser) {
                alert('Please login to view favorites');
                return;
            }
            currentView = 'favorites';
            updateView();
        });
    }
});