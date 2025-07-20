// script.js
// ========== GLOBAL VARIABLES ==========
let tasks = [];
let categories = ['Work', 'Personal', 'Shopping'];
let currentFilter = 'all';
let currentUser = null;
let users = {};

// ========== DOM ELEMENTS ==========
const authModal = document.getElementById('auth-modal');
const authTitle = document.getElementById('auth-title');
const authSubmit = document.getElementById('auth-submit');
const authSwitch = document.getElementById('auth-switch');
const authError = document.getElementById('auth-error');
const appContainer = document.getElementById('app-container');
const welcomeMessage = document.getElementById('welcome-message');
const logoutBtn = document.getElementById('logout-btn');

// ========== AUTHENTICATION SYSTEM ==========
function initAuth() {
  loadUsers();
  showAuthModal(true);
  
  authSubmit.addEventListener('click', handleAuth);
  authSwitch.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthMode();
  });
  logoutBtn.addEventListener('click', logout);
}

function toggleAuthMode(isLogin = null) {
  const isCurrentlyLogin = authTitle.textContent === 'Login';
  const newMode = isLogin !== null ? isLogin : !isCurrentlyLogin;
  
  authTitle.textContent = newMode ? 'Login' : 'Sign Up';
  authSubmit.textContent = newMode ? 'Login' : 'Sign Up';
  authSwitch.innerHTML = newMode 
    ? 'Don\'t have an account? <a href="#">Sign up</a>' 
    : 'Already have an account? <a href="#">Login</a>';
  authError.textContent = '';
}

function handleAuth() {
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  const isLogin = authTitle.textContent === 'Login';
  
  if (!username || !password) {
    authError.textContent = 'Username and password are required';
    return;
  }
  
  if (isLogin) {
    loginUser(username, password);
  } else {
    registerUser(username, password);
  }
}

function registerUser(username, password) {
  if (users[username]) {
    authError.textContent = 'Username already exists';
    return;
  }
  
  users[username] = { password };
  saveUsers();
  
  authError.textContent = '';
  alert('Registration successful! Please login.');
  toggleAuthMode(true);
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
}

function loginUser(username, password) {
  const user = users[username];
  
  if (!user || user.password !== password) {
    authError.textContent = 'Invalid username or password';
    return;
  }
  
  currentUser = username;
  saveCurrentUser();
  loadFromLocalStorage();
  
  welcomeMessage.textContent = `Welcome, ${username}!`;
  showAuthModal(false);
  appContainer.style.display = 'block';
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  showAuthModal(true);
  appContainer.style.display = 'none';
  tasks = [];
  renderTasks();
}

// ========== USER MANAGEMENT ==========
function loadUsers() {
  users = JSON.parse(localStorage.getItem('todoUsers')) || {};
}

function saveUsers() {
  localStorage.setItem('todoUsers', JSON.stringify(users));
}

function saveCurrentUser() {
  localStorage.setItem('currentUser', currentUser);
}

function checkLoggedIn() {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser && users[savedUser]) {
    currentUser = savedUser;
    welcomeMessage.textContent = `Welcome back, ${currentUser}!`;
    showAuthModal(false);
    appContainer.style.display = 'block';
    return true;
  }
  return false;
}

function showAuthModal(show) {
  authModal.style.display = show ? 'block' : 'none';
  if (show) {
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
    authError.textContent = '';
  }
}

// ========== CATEGORY DROPDOWN ==========
function setupCategoryDropdown() {
  const categorySelect = document.getElementById('task-category');
  const newCategoryInput = document.getElementById('new-category-input');
  const confirmAddCategory = document.getElementById('confirm-add-category');
  
  categorySelect.addEventListener('focus', () => {
    document.querySelector('.dropdown-add-category').style.display = 'flex';
  });
  
  categorySelect.addEventListener('blur', () => {
    setTimeout(() => {
      document.querySelector('.dropdown-add-category').style.display = 'none';
    }, 200);
  });
  
  confirmAddCategory.addEventListener('click', () => {
    const newCategory = newCategoryInput.value.trim();
    if (newCategory && !categories.includes(newCategory)) {
      categories.push(newCategory);
      saveToLocalStorage();
      renderCategories();
      categorySelect.value = newCategory;
    }
    newCategoryInput.value = '';
  });
  
  newCategoryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') confirmAddCategory.click();
  });
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  if (checkLoggedIn()) {
    loadFromLocalStorage();
  }
  setupCategoryDropdown();
  setupEventListeners();
});

// ========== LOCAL STORAGE ==========
function saveToLocalStorage() {
  if (!currentUser) return;
  
  const data = {
    tasks: tasks,
    categories: categories,
    darkMode: document.body.classList.contains('dark-mode')
  };
  
  localStorage.setItem(`todoData_${currentUser}`, JSON.stringify(data));
}

function loadFromLocalStorage() {
  if (!currentUser) return;
  
  const savedData = localStorage.getItem(`todoData_${currentUser}`);
  if (savedData) {
    const data = JSON.parse(savedData);
    tasks = data.tasks || [];
    categories = data.categories || ['Work', 'Personal', 'Shopping'];
    
    if (data.darkMode) {
      document.body.classList.add('dark-mode');
      themeToggle.textContent = '☀️ Light Mode';
    }
    
    renderCategories();
    renderTasks();
  }
}

// ... (Fungsi-fungsi lainnya tetap sama)