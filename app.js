// Task Manager Application

class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentPriorityFilter = 'all';
        this.searchQuery = '';
        this.editingTaskId = null;
        this.draggedElement = null;

        this.init();
    }

    init() {
        this.loadTasks();
        this.loadTheme();
        this.cacheDOMElements();
        this.attachEventListeners();
        this.renderTasks();
        this.updateStats();
    }

    cacheDOMElements() {
        // Form elements
        this.taskForm = document.getElementById('taskForm');
        this.taskTitle = document.getElementById('taskTitle');
        this.taskDescription = document.getElementById('taskDescription');
        this.taskPriority = document.getElementById('taskPriority');

        // Task lists
        this.pendingTasks = document.getElementById('pendingTasks');
        this.completedTasks = document.getElementById('completedTasks');

        // Filter elements
        this.searchInput = document.getElementById('searchInput');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.priorityFilter = document.getElementById('priorityFilter');

        // Stats elements
        this.progressBar = document.getElementById('progressBar');
        this.completedCount = document.getElementById('completedCount');
        this.totalCount = document.getElementById('totalCount');
        this.pendingCount = document.getElementById('pendingCount');
        this.completedTaskCount = document.getElementById('completedTaskCount');

        // Modal elements
        this.editModal = document.getElementById('editModal');
        this.editTaskForm = document.getElementById('editTaskForm');
        this.editTaskTitle = document.getElementById('editTaskTitle');
        this.editTaskDescription = document.getElementById('editTaskDescription');
        this.editTaskPriority = document.getElementById('editTaskPriority');
        this.closeModal = document.getElementById('closeModal');
        this.cancelEdit = document.getElementById('cancelEdit');

        // Other elements
        this.themeToggle = document.getElementById('themeToggle');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.emptyState = document.getElementById('emptyState');
    }

    attachEventListeners() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));

        // Search and filters
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });
        this.priorityFilter.addEventListener('change', (e) => this.handlePriorityFilterChange(e));

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Clear completed
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

        // Modal
        this.closeModal.addEventListener('click', () => this.closeEditModal());
        this.cancelEdit.addEventListener('click', () => this.closeEditModal());
        this.editTaskForm.addEventListener('submit', (e) => this.handleEditTask(e));
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeEditModal();
            }
        });

        // Drag and drop for task lists
        [this.pendingTasks, this.completedTasks].forEach(list => {
            list.addEventListener('dragover', (e) => this.handleDragOver(e));
            list.addEventListener('drop', (e) => this.handleDrop(e));
            list.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        });
    }

    // Task Management
    handleAddTask(e) {
        e.preventDefault();

        const title = this.taskTitle.value.trim();
        const description = this.taskDescription.value.trim();
        const priority = this.taskPriority.value;

        if (!title) return;

        const task = {
            id: this.generateId(),
            title,
            description,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
            order: this.tasks.length
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();

        // Reset form with animation
        this.taskForm.reset();
        this.showNotification('Task added successfully!');
    }

    handleEditTask(e) {
        e.preventDefault();

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (!task) return;

        task.title = this.editTaskTitle.value.trim();
        task.description = this.editTaskDescription.value.trim();
        task.priority = this.editTaskPriority.value;

        this.saveTasks();
        this.renderTasks();
        this.closeEditModal();
        this.showNotification('Task updated successfully!');
    }

    toggleTaskComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Task deleted successfully!');
    }

    openEditModal(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        this.editingTaskId = id;
        this.editTaskTitle.value = task.title;
        this.editTaskDescription.value = task.description;
        this.editTaskPriority.value = task.priority;

        this.editModal.classList.add('show');
    }

    closeEditModal() {
        this.editModal.classList.remove('show');
        this.editingTaskId = null;
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!');
            return;
        }

        if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification(`${completedCount} task(s) cleared!`);
        }
    }

    // Drag and Drop
    handleDragStart(e, id) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', id);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.task-list').forEach(list => {
            list.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';

        const list = e.currentTarget;
        list.classList.add('drag-over');

        return false;
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        e.currentTarget.classList.remove('drag-over');

        const taskId = e.dataTransfer.getData('text/html');
        const targetList = e.currentTarget;
        const newStatus = targetList.dataset.status;

        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = newStatus === 'completed';
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }

        return false;
    }

    // Filtering and Search
    handleSearch(e) {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderTasks();
    }

    handleFilterChange(e) {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.renderTasks();
    }

    handlePriorityFilterChange(e) {
        this.currentPriorityFilter = e.target.value;
        this.renderTasks();
    }

    getFilteredTasks() {
        return this.tasks.filter(task => {
            // Search filter
            const matchesSearch = !this.searchQuery ||
                task.title.toLowerCase().includes(this.searchQuery) ||
                task.description.toLowerCase().includes(this.searchQuery);

            // Status filter
            const matchesStatus = this.currentFilter === 'all' ||
                (this.currentFilter === 'pending' && !task.completed) ||
                (this.currentFilter === 'completed' && task.completed);

            // Priority filter
            const matchesPriority = this.currentPriorityFilter === 'all' ||
                task.priority === this.currentPriorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }

    // Rendering
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        const pendingTasks = filteredTasks.filter(t => !t.completed);
        const completedTasks = filteredTasks.filter(t => t.completed);

        this.pendingTasks.innerHTML = '';
        this.completedTasks.innerHTML = '';

        if (this.tasks.length === 0) {
            this.emptyState.classList.add('show');
        } else {
            this.emptyState.classList.remove('show');
        }

        pendingTasks.forEach(task => {
            this.pendingTasks.appendChild(this.createTaskElement(task));
        });

        completedTasks.forEach(task => {
            this.completedTasks.appendChild(this.createTaskElement(task));
        });

        // Update counts
        this.pendingCount.textContent = pendingTasks.length;
        this.completedTaskCount.textContent = completedTasks.length;
    }

    createTaskElement(task) {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card priority-${task.priority} ${task.completed ? 'completed' : ''}`;
        taskCard.draggable = true;
        taskCard.dataset.id = task.id;

        // Drag events
        taskCard.addEventListener('dragstart', (e) => this.handleDragStart(e, task.id));
        taskCard.addEventListener('dragend', (e) => this.handleDragEnd(e));

        const formattedDate = this.formatDate(task.createdAt);

        taskCard.innerHTML = `
            <div class="task-header">
                <div class="task-checkbox-wrapper">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <div class="task-content">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit" data-id="${task.id}" aria-label="Edit task">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="task-action-btn delete" data-id="${task.id}" aria-label="Delete task">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="task-meta">
                <span class="priority-badge ${task.priority}">
                    <span class="priority-dot"></span>
                    ${task.priority}
                </span>
                <span class="task-date">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    ${formattedDate}
                </span>
            </div>
        `;

        // Event listeners
        const checkbox = taskCard.querySelector('.task-checkbox');
        checkbox.addEventListener('click', () => this.toggleTaskComplete(task.id));

        const editBtn = taskCard.querySelector('.edit');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openEditModal(task.id);
        });

        const deleteBtn = taskCard.querySelector('.delete');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this task?')) {
                this.deleteTask(task.id);
            }
        });

        return taskCard;
    }

    // Stats and Progress
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const progress = total > 0 ? (completed / total) * 100 : 0;

        this.totalCount.textContent = total;
        this.completedCount.textContent = completed;
        this.progressBar.style.width = `${progress}%`;
    }

    // Theme Management
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Local Storage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
    }

    // Utility Functions
    generateId() {
        return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                return diffMinutes === 0 ? 'Just now' : `${diffMinutes}m ago`;
            }
            return `${diffHours}h ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        // Simple notification - could be enhanced with a toast library
        console.log(message);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TaskManager();
});
