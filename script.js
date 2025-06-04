// User authentication and management
const users = JSON.parse(localStorage.getItem('users')) || {};
let currentUser = localStorage.getItem('currentUser');
let tasks = [];

// Task management
class Task {
    constructor(id, title, description, dueDate, priority, category, status = 'pending', completed = false) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.category = category;
        this.status = status;
        this.completed = completed;
        this.createdAt = new Date().toISOString();
    }
}

// Authentication functions
function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }

    if (!users[username]) {
        showError('User not found');
        return;
    }

    if (users[username].password !== password) {
        showError('Incorrect password');
        return;
    }

    currentUser = username;
    localStorage.setItem('currentUser', username);
    window.location.href = 'dashboard.html';
}

function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }

    if (username.length < 3) {
        showError('Username must be at least 3 characters long');
        return;
    }

    if (users[username]) {
        showError('Username already exists');
        return;
    }

    // Check password requirements
    if (password.length < 8) {
        showError('Password must be at least 8 characters long');
        return;
    }

    if (!/\d/.test(password)) {
        showError('Password must contain at least one number');
        return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        showError('Password must contain at least one special character');
        return;
    }

    if (!(/[a-z]/.test(password) && /[A-Z]/.test(password))) {
        showError('Password must contain both uppercase and lowercase letters');
        return;
    }

    users[username] = {
        password: password,
        tasks: []
    };

    localStorage.setItem('users', JSON.stringify(users));
    
    // Show success message and switch to login
    const errorElement = document.getElementById('error');
    errorElement.style.color = '#2ecc71';
    errorElement.textContent = 'Account created successfully! Please login.';
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
        switchTab('login');
    }, 2000);
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000);
}

// Task management functions
function loadTasks() {
    if (!currentUser || !users[currentUser]) {
        window.location.href = 'index.html';
        return;
    }

    tasks = users[currentUser].tasks || [];
    updateTaskList();
    updateTaskStats();
}

function addTask() {
    const taskInput = document.getElementById('taskInput');
    const dueDateInput = document.getElementById('dueDate');
    const priorityInput = document.getElementById('priority');

    if (!taskInput.value.trim()) {
        showError('Please enter a task');
        return;
    }

    const newTask = new Task(
        Date.now().toString(),
        taskInput.value.trim(),
        dueDateInput.value,
        priorityInput.value
    );

    tasks.push(newTask);
    saveAndUpdateTasks();
    taskInput.value = '';
    dueDateInput.value = '';
    priorityInput.value = 'low';
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveAndUpdateTasks();
}

function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveAndUpdateTasks();
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newTitle = prompt('Edit task:', task.title);
    if (newTitle !== null && newTitle.trim() !== '') {
        task.title = newTitle.trim();
        saveAndUpdateTasks();
    }
}

function filterTasks(filter) {
    const buttons = document.querySelectorAll('.filter-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const taskList = document.getElementById('taskList');
    taskList.className = `task-list filter-${filter}`;
    updateTaskList(filter);
}

function updateTaskList(filter = 'all', searchTerm = '', category = '') {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    const template = document.getElementById('taskTemplate');

    let filteredTasks = tasks;

    // Apply category filter
    if (category) {
        filteredTasks = filteredTasks.filter(task => task.category === category);
    }

    // Apply status filter
    if (filter === 'active') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (filter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (filter === 'urgent') {
        filteredTasks = filteredTasks.filter(task => task.priority === 'high' && !task.completed);
    }

    // Apply search filter
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            task.category.toLowerCase().includes(searchTerm)
        );
    }

    filteredTasks.forEach(task => {
        const taskElement = template.content.cloneNode(true).querySelector('.task-card');
        
        taskElement.dataset.id = task.id;
        if (task.completed) taskElement.classList.add('completed');
        
        // Set category
        const categoryIcon = taskElement.querySelector('.task-category i');
        const categoryText = taskElement.querySelector('.task-category span');
        setCategoryIcon(categoryIcon, task.category);
        categoryText.textContent = task.category.charAt(0).toUpperCase() + task.category.slice(1);

        // Set title and description
        taskElement.querySelector('.task-title').textContent = task.title;
        taskElement.querySelector('.task-description').textContent = task.description;

        // Set due date
        const dueDateElement = taskElement.querySelector('.due-date span');
        dueDateElement.textContent = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';

        // Set priority
        const priorityElement = taskElement.querySelector('.task-priority span');
        priorityElement.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        priorityElement.className = `priority-${task.priority}`;

        // Set status
        const statusDot = taskElement.querySelector('.status-dot');
        const statusText = taskElement.querySelector('.status-text');
        statusDot.className = `status-dot ${task.status}`;
        statusText.textContent = task.status.charAt(0).toUpperCase() + task.status.slice(1);

        // Set up event listeners
        const checkbox = taskElement.querySelector('.task-checkbox');
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskComplete(task.id));

        const editBtn = taskElement.querySelector('.edit-btn');
        editBtn.addEventListener('click', () => editTask(task.id));

        const deleteBtn = taskElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        taskList.appendChild(taskElement);
    });

    updateTaskStats();
}

function updateTaskStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const urgentTasks = tasks.filter(task => task.priority === 'high' && !task.completed).length;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('urgentTasks').textContent = urgentTasks;
}

function saveAndUpdateTasks() {
    users[currentUser].tasks = tasks;
    localStorage.setItem('users', JSON.stringify(users));
    updateTaskList();
    updateTaskStats();
}

// Authentication page specific functions
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.querySelector('[onclick="switchTab(\'login\')"]');
    const registerTab = document.querySelector('[onclick="switchTab(\'register\')"]');

    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = event.currentTarget.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function checkPasswordStrength(password) {
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const requirements = document.querySelectorAll('.password-requirements i');
    
    // Reset requirements
    requirements.forEach(req => req.classList.remove('valid'));
    
    // Check individual requirements
    const hasLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
    
    // Update requirement icons
    if (hasLength) requirements[0].classList.add('valid');
    if (hasNumber) requirements[1].classList.add('valid');
    if (hasSpecial) requirements[2].classList.add('valid');
    if (hasUpperLower) requirements[3].classList.add('valid');
    
    // Calculate strength
    let strength = 0;
    if (hasLength) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;
    if (hasUpperLower) strength++;
    
    // Update strength bar and text
    strengthBar.className = 'strength-bar';
    switch(strength) {
        case 0:
        case 1:
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Weak password';
            break;
        case 2:
        case 3:
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Medium password';
            break;
        case 4:
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Strong password';
            break;
    }
}

// Dashboard UI functions
function showAddTaskModal() {
    const modal = document.getElementById('taskModal');
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = 'Add New Task';
    modal.classList.add('active');
    clearModalForm();
}

function closeModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('active');
}

function clearModalForm() {
    document.getElementById('taskInput').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('dueDate').value = '';
    document.getElementById('priority').value = 'low';
    document.getElementById('category').value = 'personal';
    document.getElementById('status').value = 'pending';
}

function toggleSortMenu() {
    const menu = document.getElementById('sortMenu');
    menu.classList.toggle('active');
}

function switchView(view) {
    const taskList = document.getElementById('taskList');
    const buttons = document.querySelectorAll('.view-btn');
    
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.querySelector(`i.fa-${view === 'grid' ? 'th-large' : 'list'}`)) {
            btn.classList.add('active');
        }
    });

    taskList.className = view === 'grid' ? 'task-grid' : 'task-list';
}

function searchTasks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    updateTaskList('all', searchTerm);
}

function sortTasks(criteria) {
    const menu = document.getElementById('sortMenu');
    menu.classList.remove('active');

    tasks.sort((a, b) => {
        switch (criteria) {
            case 'dueDate':
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'category':
                return a.category.localeCompare(b.category);
            case 'status':
                return a.status.localeCompare(b.status);
            default:
                return 0;
        }
    });

    updateTaskList();
}

function filterByCategory(category) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.textContent.toLowerCase().includes(category)) {
            item.classList.add('active');
        }
    });

    updateTaskList('all', '', category);
}

function setCategoryIcon(iconElement, category) {
    iconElement.className = 'fas';
    switch (category) {
        case 'personal':
            iconElement.classList.add('fa-user');
            break;
        case 'work':
            iconElement.classList.add('fa-briefcase');
            break;
        case 'shopping':
            iconElement.classList.add('fa-shopping-cart');
            break;
        case 'health':
            iconElement.classList.add('fa-heart');
            break;
        default:
            iconElement.classList.add('fa-tasks');
    }
}

// Override existing functions
function saveTask() {
    const taskInput = document.getElementById('taskInput');
    const descriptionInput = document.getElementById('taskDescription');
    const dueDateInput = document.getElementById('dueDate');
    const priorityInput = document.getElementById('priority');
    const categoryInput = document.getElementById('category');
    const statusInput = document.getElementById('status');

    if (!taskInput.value.trim()) {
        showError('Please enter a task title');
        return;
    }

    const newTask = new Task(
        Date.now().toString(),
        taskInput.value.trim(),
        descriptionInput.value.trim(),
        dueDateInput.value,
        priorityInput.value,
        categoryInput.value,
        statusInput.value
    );

    tasks.push(newTask);
    saveAndUpdateTasks();
    closeModal();
}

// Initialize dashboard
if (window.location.pathname.includes('dashboard.html')) {
    loadTasks();
    document.getElementById('userDisplay').textContent = currentUser;
    
    // Close sort menu when clicking outside
    document.addEventListener('click', (e) => {
        const sortMenu = document.getElementById('sortMenu');
        const sortBtn = document.querySelector('.sort-btn');
        if (!sortBtn.contains(e.target)) {
            sortMenu.classList.remove('active');
        }
    });
}
