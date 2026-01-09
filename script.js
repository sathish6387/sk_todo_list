/* Simple To-Do app using localStorage */
const SELECTORS = {
  form: document.getElementById('todoForm'),
  input: document.getElementById('todoInput'),
  addBtn: document.getElementById('addBtn'),
  list: document.getElementById('todoList'),
  emptyMsg: document.getElementById('emptyMsg'),
  taskCount: document.getElementById('taskCount'),
  clearCompleted: document.getElementById('clearCompleted'),
  clearAll: document.getElementById('clearAll'),
  themeToggle: document.getElementById('themeToggle')
};

const LS_KEY = 'minimal_todos_v1';
let todos = [];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function loadTodos(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    todos = raw ? JSON.parse(raw) : [];
  }catch(e){ todos = []; }
}

function saveTodos(){ localStorage.setItem(LS_KEY, JSON.stringify(todos)); }

function render(){
  SELECTORS.list.innerHTML = '';
  if(todos.length === 0){ SELECTORS.emptyMsg.style.display = 'block'; updateCounts(); return; }
  SELECTORS.emptyMsg.style.display = 'none';
  todos.forEach(t => SELECTORS.list.appendChild(createTaskElement(t)));
  updateCounts();
}

function createTaskElement(task){
  const li = document.createElement('li');
  li.className = 'todo-item';
  li.dataset.id = task.id;
  li.setAttribute('role','listitem');

  const left = document.createElement('div'); left.className='todo-left';

  const chk = document.createElement('button'); chk.className='checkbox';
  chk.setAttribute('aria-label','Mark task as completed');
  chk.setAttribute('aria-pressed', task.completed ? 'true' : 'false');
  chk.innerHTML = task.completed ? '✓' : '';
  if(task.completed) chk.classList.add('checked');

  chk.addEventListener('click', ()=>{
    task.completed = !task.completed; saveTodos(); updateTaskUI(li, task); });

  const text = document.createElement('div'); text.className='todo-text';
  text.textContent = task.text;
  if(task.completed) text.classList.add('completed');

  left.appendChild(chk);
  left.appendChild(text);

  const actions = document.createElement('div'); actions.className='actions';

  // Edit
  const editBtn = document.createElement('button'); editBtn.className='action-btn'; editBtn.title='Edit task'; editBtn.innerHTML='✏️';
  editBtn.addEventListener('click', ()=> startEdit(task, text, li));

  // Delete
  const delBtn = document.createElement('button'); delBtn.className='action-btn delete-btn'; delBtn.title='Delete task'; delBtn.innerHTML='🗑️';
  delBtn.addEventListener('click', ()=> removeTask(task.id, li));

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  li.appendChild(left);
  li.appendChild(actions);
  return li;
}

function updateTaskUI(li, task){
  const chk = li.querySelector('.checkbox');
  const text = li.querySelector('.todo-text');
  if(task.completed){ chk.classList.add('checked'); chk.innerHTML='✓'; text.classList.add('completed'); chk.setAttribute('aria-pressed','true'); }
  else { chk.classList.remove('checked'); chk.innerHTML=''; text.classList.remove('completed'); chk.setAttribute('aria-pressed','false'); }
}

// Update counts shown in header
function updateCounts(){
  if(!SELECTORS.taskCount) return;
  const total = todos.length;
  const completed = todos.filter(t=>t.completed).length;
  const remaining = total - completed;
  SELECTORS.taskCount.textContent = `${remaining} / ${total}`;
}

function clearCompleted(){
  const completedIds = todos.filter(t => t.completed).map(t => t.id);
  if(completedIds.length === 0) return;
  const lis = completedIds.map(id => SELECTORS.list.querySelector(`[data-id="${id}"]`)).filter(Boolean);
  if(lis.length === 0){ todos = todos.filter(t => !t.completed); saveTodos(); render(); return; }
  let remaining = lis.length;
  lis.forEach(li => {
    li.classList.add('removing');
    li.addEventListener('animationend', ()=> {
      remaining--;
      if(remaining === 0){
        todos = todos.filter(t => !t.completed);
        saveTodos();
        render();
      }
    }, { once: true });
  });
}

function clearAll(){
  if(todos.length === 0) return;
  if(!confirm('Delete ALL tasks? This cannot be undone.')) return;
  const lis = Array.from(SELECTORS.list.children);
  if(lis.length === 0){ todos = []; saveTodos(); render(); return; }
  let remaining = lis.length;
  lis.forEach(li => {
    li.classList.add('removing');
    li.addEventListener('animationend', ()=> {
      remaining--;
      if(remaining === 0){
        todos = [];
        saveTodos();
        render();
      }
    }, { once:true});
  });
}

function addTask(text){
  const trimmed = text.trim(); if(!trimmed) return;
  const task = { id: uid(), text: trimmed, completed:false };
  todos.unshift(task); saveTodos(); render();
}

function removeTask(id, li){
  // animate removal
  li.classList.add('removing');
  li.addEventListener('animationend', ()=>{
    todos = todos.filter(t => t.id !== id); saveTodos(); render();
  }, { once:true });
}

function startEdit(task, textEl, li){
  const input = document.createElement('input'); input.className='edit-input'; input.value = task.text;
  textEl.replaceWith(input);
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  function finish(save){
    if(save){ task.text = input.value.trim() || task.text; saveTodos(); }
    render();
  }

  input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') finish(true); if(e.key === 'Escape') finish(false); });
  input.addEventListener('blur', ()=> finish(true));
}

// Form handlers
function toggleAddButton(){ const disabled = SELECTORS.input.value.trim() === ''; SELECTORS.addBtn.disabled = disabled; if(disabled) SELECTORS.addBtn.classList.add('disabled'); else SELECTORS.addBtn.classList.remove('disabled'); }

SELECTORS.form.addEventListener('submit', (e)=>{ e.preventDefault(); addTask(SELECTORS.input.value); SELECTORS.input.value=''; toggleAddButton(); SELECTORS.input.focus(); });
SELECTORS.input.addEventListener('input', toggleAddButton);
SELECTORS.input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); addTask(SELECTORS.input.value); SELECTORS.input.value=''; toggleAddButton(); } });

// Clear handlers
SELECTORS.clearCompleted.addEventListener('click', clearCompleted);
SELECTORS.clearAll.addEventListener('click', clearAll);

// Theme toggle
const THEME_KEY = 'minimal_theme_v1';
function applyTheme(theme){ if(theme === 'dark') document.body.setAttribute('data-theme','dark'); else document.body.removeAttribute('data-theme'); }
function loadTheme(){ const t = localStorage.getItem(THEME_KEY) || 'light'; applyTheme(t); SELECTORS.themeToggle.textContent = t === 'dark' ? '☀️' : '🌙'; SELECTORS.themeToggle.setAttribute('aria-pressed', t === 'dark' ? 'true':'false'); }
SELECTORS.themeToggle.addEventListener('click', ()=>{ const current = document.body.getAttribute('data-theme') === 'dark' ? 'dark':'light'; const next = current==='dark'?'light':'dark'; localStorage.setItem(THEME_KEY, next); applyTheme(next); SELECTORS.themeToggle.textContent = next==='dark'?'☀️':'🌙'; SELECTORS.themeToggle.setAttribute('aria-pressed', next === 'dark' ? 'true':'false'); });

// Init
document.addEventListener('DOMContentLoaded', ()=>{ loadTheme(); loadTodos(); render(); toggleAddButton(); });
