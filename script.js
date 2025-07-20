// ========== GLOBAL VARIABLES ==========
let tasks = [];
let categories = ['Work', 'Personal', 'Shopping'];
let currentFilter = 'all';
let currentUser = null;
let users = {};
let draggedItem = null;
let clockInterval = null;

// ========== DOM ELEMENTS ==========
// Auth Elements
const authModal = document.getElementById('auth-modal');
const authTitle = document.getElementById('auth-title');
const authSubmit = document.getElementById('auth-submit');
const authSwitch = document.getElementById('auth-switch');
const authError = document.getElementById('auth-error');
const appContainer = document.getElementById('app-container');
const greeting = document.getElementById('greeting');
const currentDate = document.getElementById('current-date');
const currentTime = document.getElementById('current-time');
const logoutBtn = document.getElementById('logout-btn');
const themeToggle = document.getElementById('theme-toggle');

// Task Elements
const taskInput = document.getElementById('task-input');
const categorySelect = document.getElementById('task-category');
const taskDeadline = document.getElementById('task-deadline');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filter-btn');

// Category Elements
const newCategoryInput = document.getElementById('new-category-input');
const confirmAddCategory = document.getElementById('confirm-add-category');
const dropdownAddCategory = document.querySelector('.dropdown-add-category');

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupEventListeners();
  updateDate();
  startClock();
  
  if (checkLoggedIn()) {
    loadUserData();
  }
});

// ========== TIME FUNCTIONS ==========
function startClock() {
  // Update immediately
  updateCurrentTime();
  
  // Update every second
  clockInterval = setInterval(updateCurrentTime, 1000);
}

function updateCurrentTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  currentTime.textContent = timeString;
}

function updateDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDate.textContent = new Date().toLocaleDateString(undefined, options);
}

// ========== AUTHENTICATION SYSTEM ==========
function initAuth() {
  loadUsers();
  
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
    showAuthError('Username and password are required');
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
    showAuthError('Username already exists');
    return;
  }
  
  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters');
    return;
  }
  
  users[username] = { password };
  saveUsers();
  
  showAuthError('');
  alert('Registration successful! Please login.');
  toggleAuthMode(true);
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
}

function loginUser(username, password) {
  const user = users[username];
  
  if (!user || user.password !== password) {
    showAuthError('Invalid username or password');
    return;
  }
  
  currentUser = username;
  saveCurrentUser();
  loadUserData();
  
  greeting.textContent = username;
  authModal.style.display = 'none';
  appContainer.style.display = 'block';
  
  applySavedTheme();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  authModal.style.display = 'block';
  appContainer.style.display = 'none';
  tasks = [];
  renderTasks();
  
  // Clear the clock interval
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
  
  // Reset form
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
  toggleAuthMode(true);
}

function showAuthError(message) {
  authError.textContent = message;
  authError.style.height = message ? 'auto' : '0';
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
    return true;
  }
  return false;
}

function loadUserData() {
  loadFromLocalStorage();
  renderCategories();
  renderTasks();
  updateTaskCount();
  startClock(); // Restart clock when user logs in
}

// ========== TASK MANAGEMENT ==========
function addTask() {
  const taskText = taskInput.value.trim();
  if (!taskText) return;

  const selectedCategory = categorySelect.value;
  if (!selectedCategory || selectedCategory === 'Select category') {
    alert('Please select a category');
    return;
  }

  const newTask = {
    id: Date.now(),
    text: taskText,
    completed: false,
    category: selectedCategory,
    deadline: taskDeadline.value || null,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  saveToLocalStorage();
  renderTasks();
  updateTaskCount();
  
  // Reset input fields
  taskInput.value = '';
  taskDeadline.value = '';
  
  // Add animation
  const newTaskElement = taskList.lastChild;
  newTaskElement.classList.add('task-enter');
}

function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  tasks = tasks.filter(task => task.id !== id);
  saveToLocalStorage();
  renderTasks();
  updateTaskCount();
}

function toggleTask(id) {
  tasks = tasks.map(task => 
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveToLocalStorage();
  renderTasks();
  updateTaskCount();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  const newText = prompt('Edit your task:', task.text);
  
  if (newText && newText.trim() !== '') {
    task.text = newText.trim();
    saveToLocalStorage();
    renderTasks();
  }
}

function clearCompletedTasks() {
  tasks = tasks.filter(task => !task.completed);
  saveToLocalStorage();
  renderTasks();
  updateTaskCount();
}

// ========== CATEGORY MANAGEMENT ==========
function renderCategories() {
  const categorySelect = document.getElementById('task-category');
  
  // Clear existing options except the first and last
  while (categorySelect.options.length > 2) {
    categorySelect.remove(1);
  }
  
  // Add existing categories after the default option
  categories.forEach(category => {
    const option = new Option(category, category);
    categorySelect.add(option, 1);
  });
}

function setupCategoryDropdown() {
  const categorySelect = document.getElementById('task-category');
  
  categorySelect.addEventListener('change', function() {
    if (this.value === 'add-new') {
      dropdownAddCategory.style.display = 'flex';
      newCategoryInput.focus();
      this.selectedIndex = 0; // Reset to default selection
    }
  });

  confirmAddCategory.addEventListener('click', addNewCategory);
  newCategoryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addNewCategory();
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!categorySelect.contains(e.target) && 
        !dropdownAddCategory.contains(e.target)) {
      dropdownAddCategory.style.display = 'none';
    }
  });
}

function addNewCategory() {
  const newCategory = newCategoryInput.value.trim();
  if (!newCategory) return;
  
  if (!categories.includes(newCategory)) {
    categories.push(newCategory);
    saveToLocalStorage();
    renderCategories();
    
    // Select the newly added category
    document.getElementById('task-category').value = newCategory;
  }
  
  // Reset and hide the input
  newCategoryInput.value = '';
  dropdownAddCategory.style.display = 'none';
}

// ========== FILTER & SEARCH ==========
function filterTasks(type) {
  currentFilter = type;
  
  // Update active filter button
  filterButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === type);
  });
  
  renderTasks();
}

// ========== RENDERING FUNCTIONS ==========
function renderTasks() {
  let filteredTasks = tasks;
  
  // Apply current filter
  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(task => !task.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(task => task.completed);
  }
  
  taskList.innerHTML = '';
  
  if (filteredTasks.length === 0) {
    taskList.innerHTML = '<p class="no-tasks">No tasks found</p>';
    return;
  }
  
  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('completed');
    
    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
             onchange="toggleTask(${task.id})">
      <span class="task-text">${task.text}</span>
      ${task.category ? `<span class="task-category">${task.category}</span>` : ''}
      ${task.deadline ? `<span class="task-deadline">${formatDate(task.deadline)}</span>` : ''}
      <div class="task-actions">
        <button class="edit-btn" onclick="editTask(${task.id})">Edit</button>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;
    
    taskList.appendChild(li);
  });
}

function updateTaskCount() {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  
  taskCount.textContent = `${totalTasks} tasks (${completedTasks} completed)`;
}

// ========== DRAG AND DROP ==========
function setupDragAndDrop() {
  taskList.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'LI') {
      draggedItem = e.target;
      setTimeout(() => e.target.classList.add('dragging'), 0);
    }
  });

  taskList.addEventListener('dragend', (e) => {
    if (e.target.tagName === 'LI') {
      e.target.classList.remove('dragging');
    }
  });

  taskList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(e.clientY);
    const currentItem = document.querySelector('.dragging');
    
    if (!currentItem || !afterElement) return;
    
    if (afterElement === currentItem.nextSibling) {
      taskList.insertBefore(currentItem, afterElement.nextSibling);
    } else {
      taskList.insertBefore(currentItem, afterElement);
    }
  });

  taskList.addEventListener('drop', () => {
    const newOrder = Array.from(taskList.children).map(li => parseInt(li.dataset.id));
    reorderTasks(newOrder);
  });
}

function getDragAfterElement(y) {
  const draggableElements = [...taskList.querySelectorAll('li:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function reorderTasks(newOrder) {
  tasks.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
  saveToLocalStorage();
}

// ========== THEME MANAGEMENT ==========
function toggleDarkMode() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeToggle.textContent = isDark ? '🌙 Dark Mode' : '☀️ Light Mode';
  saveToLocalStorage();
}

function applySavedTheme() {
  const savedData = localStorage.getItem(`todoData_${currentUser}`);
  if (savedData) {
    const data = JSON.parse(savedData);
    if (data.darkMode) {
      document.body.setAttribute('data-theme', 'dark');
      themeToggle.textContent = '☀️ Light Mode';
    }
  }
}

// ========== UTILITY FUNCTIONS ==========
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: dateString.includes('-') ? 'numeric' : undefined
  });
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  // Task Operations
  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
  clearCompletedBtn.addEventListener('click', clearCompletedTasks);
  
  // Category Operations
  setupCategoryDropdown();
  
  // Filter Buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => filterTasks(btn.dataset.filter));
  });
  
  // Theme Toggle
  themeToggle.addEventListener('click', toggleDarkMode);
  
  // Drag and Drop
  setupDragAndDrop();
}

// ========== LOCAL STORAGE ==========
function saveToLocalStorage() {
  if (!currentUser) return;
  
  const data = {
    tasks: tasks,
    categories: categories,
    darkMode: document.body.getAttribute('data-theme') === 'dark'
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
      document.body.setAttribute('data-theme', 'dark');
      themeToggle.textContent = '☀️ Light Mode';
    }
  }
}