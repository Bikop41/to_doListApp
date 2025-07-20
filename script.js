// Ambil elemen dari DOM
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const totalTasks = document.getElementById('total-tasks');

// Array untuk menyimpan task
let tasks = [];

// Fungsi untuk menambahkan task
function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText === '') return;

  const task = {
    id: Date.now(),
    text: taskText,
    completed: false
  };

  tasks.push(task);
  renderTasks();
  taskInput.value = '';
}

// Fungsi untuk merender task ke UI
function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    li.innerHTML = `
      <span>${task.text}</span>
      <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
    `;
    taskList.appendChild(li);
  });

  totalTasks.textContent = tasks.length;
}

// Fungsi untuk menghapus task
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  renderTasks();
}

// Event Listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

// Jalankan render awal
renderTasks();