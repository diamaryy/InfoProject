document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const USERS_KEY = 'jobBoardUsers';
    const CURRENT_USER_KEY = 'currentUser';
  
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = loginForm.username.value.trim();
      const password = loginForm.password.value.trim();
      const users = JSON.parse(localStorage.getItem(USERS_KEY)) || {};
  
      const errorDiv = loginForm.querySelector('.form-error');
      errorDiv.textContent = '';
  
      if (!username || !password) {
        return errorDiv.textContent = 'Please fill in all fields';
      }
  
      const user = users[username];
      if (!user || user.password !== password) {
        return errorDiv.textContent = 'Invalid username or password';
      }
  
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
        username,
        email: user.email,
        favorites: user.favorites
      }));
  
      window.location.href = 'dashboard.html';
    });
    
  });
  