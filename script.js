// DOM Elements
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date-input');
const priorityInput = document.getElementById('priority-input');
const categoryInput = document.getElementById('category-input');
const addButton = document.getElementById('add-button');
const taskList = document.getElementById('task-list');
const tasksCounter = document.getElementById('tasks-counter');
const clearCompletedBtn = document.getElementById('clear-completed');
const clearExpiredBtn = document.getElementById('clear-expired');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const sortSelect = document.getElementById('sort-select');
const categoriesFilter = document.getElementById('categories-filter');
const themeToggle = document.getElementById('theme-toggle');

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentSort = 'date-added';
let searchQuery = '';
let selectedCategories = new Set();

// Initialize dark mode
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// Event Listeners
addButton.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addTask();
    }
});
clearCompletedBtn.addEventListener('click', clearCompleted);
clearExpiredBtn.addEventListener('click', clearExpired);
searchInput.addEventListener('input', handleSearch);
searchButton.addEventListener('click', handleSearch);
sortSelect.addEventListener('change', handleSort);
themeToggle.addEventListener('click', toggleTheme);

filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        setFilter(e.target.dataset.filter);
    });
});

// Functions
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') {
        taskInput.focus();
        return;
    }

    const categories = categoryInput.value
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => cat !== '');

    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        dueDate: dueDateInput.value || null,
        priority: priorityInput.value || 'low',
        categories: categories,
        dateAdded: new Date().toISOString()
    };

    tasks.unshift(task); // Add new task to the beginning
    resetInputs();
    saveTasks();
    renderTasks();
    updateCategoriesFilter();
}

function resetInputs() {
    taskInput.value = '';
    dueDateInput.value = '';
    priorityInput.value = 'low';
    categoryInput.value = '';
    taskInput.focus();
}

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    updateCategoriesFilter();
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    updateCategoriesFilter();
}

function clearExpired() {
    const today = new Date().toISOString().split('T')[0];
    tasks = tasks.filter(task => !task.dueDate || task.dueDate >= today);
    saveTasks();
    renderTasks();
}

function setFilter(filter) {
    currentFilter = filter;
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderTasks();
}

function handleSearch() {
    searchQuery = searchInput.value.toLowerCase();
    renderTasks();
}

function handleSort() {
    currentSort = sortSelect.value;
    renderTasks();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function updateCategoriesFilter() {
    const allCategories = new Set();
    tasks.forEach(task => {
        task.categories.forEach(category => allCategories.add(category));
    });

    categoriesFilter.innerHTML = '';
    allCategories.forEach(category => {
        const categoryTag = document.createElement('span');
        categoryTag.className = `category-tag ${selectedCategories.has(category) ? 'active' : ''}`;
        categoryTag.textContent = category;
        categoryTag.addEventListener('click', () => toggleCategory(category));
        categoriesFilter.appendChild(categoryTag);
    });
}

function toggleCategory(category) {
    if (selectedCategories.has(category)) {
        selectedCategories.delete(category);
    } else {
        selectedCategories.add(category);
    }
    renderTasks();
    updateCategoriesFilter();
}

function getFilteredTasks() {
    return tasks
        .filter(task => {
            // Filter by status
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        })
        .filter(task => {
            // Filter by search
            if (!searchQuery) return true;
            return task.text.toLowerCase().includes(searchQuery) ||
                   task.categories.some(cat => cat.toLowerCase().includes(searchQuery));
        })
        .filter(task => {
            // Filter by selected categories
            if (selectedCategories.size === 0) return true;
            return task.categories.some(cat => selectedCategories.has(cat));
        })
        .sort((a, b) => {
            // Sort tasks
            switch (currentSort) {
                case 'due-date':
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                default: // date-added
                    return new Date(b.dateAdded) - new Date(a.dateAdded);
            }
        });
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = searchQuery 
            ? 'No tasks match your search'
            : currentFilter === 'completed'
                ? 'No completed tasks'
                : 'No tasks to display';
        taskList.appendChild(emptyMessage);
    } else {
        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-header">
                        <span class="task-text">${task.text}</span>
                        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                    </div>
                    <div class="task-details">
                        ${task.dueDate ? `<span><i class="fas fa-calendar"></i> ${formatDate(task.dueDate)}</span>` : ''}
                        ${task.categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                    </div>
                </div>
                <button class="delete-btn" title="Delete task"><i class="fas fa-trash"></i></button>
            `;

            const checkbox = li.querySelector('.checkbox');
            const deleteBtn = li.querySelector('.delete-btn');

            checkbox.addEventListener('change', () => toggleTask(task.id));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            taskList.appendChild(li);
        });
    }

    updateTasksCounter();
}

function updateTasksCounter() {
    const activeTasks = tasks.filter(task => !task.completed).length;
    const totalTasks = tasks.length;
    tasksCounter.textContent = `${activeTasks} of ${totalTasks} task${totalTasks !== 1 ? 's' : ''} remaining`;
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Initial render
updateCategoriesFilter();
renderTasks(); 