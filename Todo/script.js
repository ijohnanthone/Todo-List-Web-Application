const STORAGE_KEY = "flowlist_tasks_v1";

const state = {
  tasks: [],
  filter: "all"
};

const els = {
  form: document.getElementById("todo-form"),
  input: document.getElementById("todo-input"),
  list: document.getElementById("todo-list"),
  count: document.getElementById("task-count"),
  filters: document.getElementById("filters"),
  clearCompleted: document.getElementById("clear-completed"),
  template: document.getElementById("todo-item-template")
};

function init() {
  loadTasks();
  bindEvents();
  render();
}

function bindEvents() {
  els.form.addEventListener("submit", handleAddTask);

  els.filters.addEventListener("click", (event) => {
    const button = event.target.closest(".filter");
    if (!button) return;
    state.filter = button.dataset.filter;
    render();
  });

  els.clearCompleted.addEventListener("click", () => {
    state.tasks = state.tasks.filter((task) => !task.completed);
    persist();
    render();
  });

  els.list.addEventListener("click", (event) => {
    const item = event.target.closest(".todo-item");
    if (!item) return;

    const id = item.dataset.id;
    const target = event.target;

    if (target.classList.contains("delete-btn")) {
      deleteTask(id);
    }

    if (target.classList.contains("edit-btn")) {
      startEditing(item, id);
    }
  });

  els.list.addEventListener("change", (event) => {
    const check = event.target.closest(".todo-check");
    if (!check) return;

    toggleTask(check.closest(".todo-item").dataset.id, check.checked);
  });

  els.list.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const input = event.target.closest(".todo-edit-input");
    if (!input) return;
    finishEditing(input.closest(".todo-item"), true);
  });

  els.list.addEventListener("blur", (event) => {
    const input = event.target.closest(".todo-edit-input");
    if (!input) return;
    finishEditing(input.closest(".todo-item"), true);
  }, true);
}

function handleAddTask(event) {
  event.preventDefault();
  const text = els.input.value.trim();
  if (!text) return;

  state.tasks.unshift({
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: Date.now()
  });

  els.input.value = "";
  persist();
  render();
}

function toggleTask(id, completed) {
  const task = state.tasks.find((entry) => entry.id === id);
  if (!task) return;
  task.completed = completed;
  persist();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  persist();
  render();
}

function startEditing(item, id) {
  const task = state.tasks.find((entry) => entry.id === id);
  if (!task) return;

  const editInput = item.querySelector(".todo-edit-input");
  item.classList.add("is-editing");
  editInput.value = task.text;
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);
}

function finishEditing(item, save) {
  if (!item.classList.contains("is-editing")) return;

  const id = item.dataset.id;
  const editInput = item.querySelector(".todo-edit-input");
  const next = editInput.value.trim();
  item.classList.remove("is-editing");

  if (!save) return;

  if (!next) {
    deleteTask(id);
    return;
  }

  const task = state.tasks.find((entry) => entry.id === id);
  if (!task) return;

  task.text = next;
  persist();
  render();
}

function getVisibleTasks() {
  if (state.filter === "active") {
    return state.tasks.filter((task) => !task.completed);
  }

  if (state.filter === "completed") {
    return state.tasks.filter((task) => task.completed);
  }

  return state.tasks;
}

function render() {
  renderFilters();
  renderList();
  renderCount();
}

function renderFilters() {
  els.filters.querySelectorAll(".filter").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.filter);
  });
}

function renderList() {
  const tasks = getVisibleTasks();
  els.list.innerHTML = "";

  if (!tasks.length) {
    const empty = document.createElement("li");
    empty.className = "todo-item";
    empty.innerHTML = `<p class="todo-text">No tasks here. Add one above.</p>`;
    els.list.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  tasks.forEach((task) => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.dataset.id = task.id;
    node.classList.toggle("is-completed", task.completed);

    node.querySelector(".todo-check").checked = task.completed;
    node.querySelector(".todo-text").textContent = task.text;

    fragment.appendChild(node);
  });

  els.list.appendChild(fragment);
}

function renderCount() {
  const remaining = state.tasks.filter((task) => !task.completed).length;
  els.count.textContent = `${remaining} ${remaining === 1 ? "task" : "tasks"} left`;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;

    state.tasks = parsed.filter((task) => {
      return task && typeof task.id === "string" && typeof task.text === "string";
    }).map((task) => ({
      id: task.id,
      text: task.text,
      completed: Boolean(task.completed),
      createdAt: Number(task.createdAt) || Date.now()
    }));
  } catch (error) {
    console.error("Could not load tasks:", error);
    state.tasks = [];
  }
}

init();
