// script.js
// ========== GLOBAL VARIABLES ==========
let tasks = [];
let categories = ['Work', 'Personal', 'Shopping']; // Default categories
let currentFilter = 'all';
let currentUser = 'default'; // Untuk fitur multi-user (dikembangkan nanti)

// ========== DOM ELEMENTS ==========
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const totalTasks = document.getElementById('total-tasks');
const categorySelect = document.getElementById('task-category');
const addCategoryBtn = document.getElementById('add-category-btn');
const searchInput = document.getElementById('search-input');
const themeToggle = document.getElementById('theme-toggle');
const modal = document.getElementById('category-modal');
const newCategoryInput = document.getElementById('new-category');
const saveCategoryBtn = document.getElementById('save-category-btn');
const closeModal = document.querySelector('.close');
const importFile = document.getElementById('import-file');

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  renderCategories();
  setupEventListeners();
});

// ========== EVENT LISTENERS SETUP ==========
function setupEventListeners() {
  // Task Operations
  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
  
  // Category Operations
  addCategoryBtn.addEventListener('click', openCategoryModal);
  saveCategoryBtn.addEventListener('click', saveNewCategory);
  closeModal.addEventListener('click', closeCategoryModal);
  
  // UI Operations
  themeToggle.addEventListener('click', toggleDarkMode);
  searchInput.addEventListener('input', () => searchTasks(searchInput.value));
  importFile.addEventListener('change', importTasks);
  
  // Drag and Drop Setup
  setupDragAndDrop();
}

// ========== TASK OPERATIONS ==========
function addTask() {
  const taskText = taskInput.value.trim();
  if (!taskText) return;

  const selectedCategory = categorySelect.value;
  const deadline = document.getElementById('task-deadline').value;
  
  const newTask = {
    id: Date.now(),
    text: taskText,
    completed: false,
    category: selectedCategory,
    deadline: deadline || null,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  saveToLocalStorage();
  renderTasks();
  
  // Reset input fields
  taskInput.value = '';
  document.getElementById('task-deadline').value = '';
  
  // Animasi
  const newTaskElement = taskList.lastChild;
  newTaskElement.classList.add('task-enter');
}

function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  tasks = tasks.filter(task => task.id !== id);
  saveToLocalStorage();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map(task => 
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveToLocalStorage();
  renderTasks();
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

// ========== CATEGORY OPERATIONS ==========
function renderCategories() {
  categorySelect.innerHTML = '';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function openCategoryModal() {
  modal.style.display = 'block';
  newCategoryInput.focus();
}

function closeCategoryModal() {
  modal.style.display = 'none';
  newCategoryInput.value = '';
}

function saveNewCategory() {
  const categoryName = newCategoryInput.value.trim();
  if (!categoryName) return;

  if (!categories.includes(categoryName)) {
    categories.push(categoryName);
    saveToLocalStorage();
    renderCategories();
  }
  closeCategoryModal();
}

// ========== FILTER & SEARCH ==========
function filterTasks(type) {
  currentFilter = type;
  renderTasks();
}

function searchTasks(keyword) {
  const filtered = tasks.filter(task => 
    task.text.toLowerCase().includes(keyword.toLowerCase()) ||
    task.category.toLowerCase().includes(keyword.toLowerCase())
  );
  renderFilteredTasks(filtered);
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
  
  renderFilteredTasks(filteredTasks);
}

function renderFilteredTasks(filteredTasks) {
  taskList.innerHTML = '';
  
  if (filteredTasks.length === 0) {
    taskList.innerHTML = '<p class="no-tasks">No tasks found</p>';
    totalTasks.textContent = '0';
    return;
  }
  
  filteredTasks.forEach(task => {
    const li = document.createElement('li');
    li.draggable = true;
    li.dataset.id = task.id;
    if (task.completed) li.classList.add('completed');
    
    li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} 
             onchange="toggleTask(${task.id})">
      <span class="task-text" ondblclick="editTask(${task.id})">${task.text}</span>
      ${task.category ? `<span class="task-category">${task.category}</span>` : ''}
      ${task.deadline ? `<span class="task-deadline">${formatDate(task.deadline)}</span>` : ''}
      <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
    `;
    
    taskList.appendChild(li);
  });
  
  totalTasks.textContent = filteredTasks.length;
}

// ========== DRAG AND DROP ==========
function setupDragAndDrop() {
  let draggedItem = null;

  // Drag Start
  taskList.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'LI') {
      draggedItem = e.target;
      setTimeout(() => e.target.classList.add('dragging'), 0);
    }
  });

  // Drag End
  taskList.addEventListener('dragend', (e) => {
    if (e.target.tagName === 'LI') {
      e.target.classList.remove('dragging');
    }
  });

  // Drag Over
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

  // Update task order after drop
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
  document.body.classList.toggle('dark-mode');
  themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️ Light Mode' : '🌓 Dark Mode';
  saveToLocalStorage();
}

// ========== IMPORT/EXPORT ==========
function exportTasks() {
  const data = {
    tasks: tasks,
    categories: categories,
    darkMode: document.body.classList.contains('dark-mode')
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `todo-list-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

function importTasks(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      
      if (data.tasks && Array.isArray(data.tasks)) {
        tasks = data.tasks;
        categories = data.categories || categories;
        
        if (data.darkMode) {
          document.body.classList.add('dark-mode');
          themeToggle.textContent = '☀️ Light Mode';
        }
        
        saveToLocalStorage();
        renderCategories();
        renderTasks();
        alert('Data imported successfully!');
      }
    } catch (error) {
      alert('Error importing file: ' + error.message);
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // Reset input
}

// ========== LOCAL STORAGE ==========
function saveToLocalStorage() {
  const data = {
    tasks: tasks,
    categories: categories,
    darkMode: document.body.classList.contains('dark-mode')
  };
  localStorage.setItem(`todoData_${currentUser}`, JSON.stringify(data));
}

function loadFromLocalStorage() {
  const savedData = localStorage.getItem(`todoData_${currentUser}`);
  if (savedData) {
    const data = JSON.parse(savedData);
    tasks = data.tasks || [];
    categories = data.categories || ['Work', 'Personal', 'Shopping'];
    
    if (data.darkMode) {
      document.body.classList.add('dark-mode');
      themeToggle.textContent = '☀️ Light Mode';
    }
    
    renderTasks();
  }
}

// ========== UTILITY FUNCTIONS ==========
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === modal) closeCategoryModal();
});