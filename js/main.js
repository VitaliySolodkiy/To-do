// + возможность сортировки: все, только не выполненные
// + выполненная задача должна быть перечеркнута
// + добавить возможность очистки списка задач
// + отмена удаления в течении 10 секунд
// +возможность удаления
// +возможность редактирования

//выделить логику туду и отображение задач в разные классы
//два класса вынести в разные файлы, потом их импортировать в основной

class Todo {
    tasks = [];
    id = 0;
    taskList = document.querySelector('#taskList');
    lastUsedId;
    sort = 'all';
    timer;
    temporaryObj;
    currentIndex;
    intervalForUndoDelete = 3;
    interval;
    constructor() { };
    localStorageSync() {
        let jsonString = JSON.stringify(this.tasks);
        localStorage.setItem('tasks', jsonString);
        localStorage.setItem('lastUsedId', this.id);
        localStorage.setItem('sort', this.sort);
    }
    addTask() {
        let taskDesc = document.querySelector('#taskDesc').value;
        if (taskDesc !== '') { //проверяем не является ли поле ввода пустым
            document.querySelector('#taskDesc').value = '';
            let taskObj = {
                id: this.id++,
                taskDesc: taskDesc,
                isDone: false,
            }
            this.tasks.push(taskObj);
            this.drawTasksList(this.sort);
        }
    }
    renderTask(taskObj) {
        this.taskList.insertAdjacentHTML('beforeend', `
        <div class="todo-tasks__task">
			<input type="checkbox" id="${taskObj.id}" ${taskObj.isDone === true ? 'checked' : ''}>
			<p ${taskObj.isDone === true ? "class='todo-tasks__task-done'" : ''}>${taskObj.taskDesc}</p>
			<span class="task-icon edit" data-edit='false'></span>
			<span class="task-icon delete"></span>
		</div>
        `);
    }
    drawTasksList(sort) {
        this.taskList.innerHTML = '';
        this.tasks.forEach(taskObj => {
            switch (true) {
                case (sort === 'all'):
                    this.renderTask(taskObj)
                    break;
                case (sort === 'done'):
                    if (taskObj.isDone === true) this.renderTask(taskObj);
                    break;
                case (sort === 'notDone'):
                    if (taskObj.isDone === false) this.renderTask(taskObj);
                    break;
            }
        });
        this.localStorageSync();
    }
    deleteTask(id) {
        for (let i = 0; i < this.tasks.length; i++) {
            if (this.tasks[i].id === id) {
                this.currentIndex = i;
                this.temporaryObj = {
                    id: this.tasks[i].id,
                    taskDesc: this.tasks[i].taskDesc,
                    isDone: this.tasks[i].isDone,
                }
                this.tasks.splice(i, 1);
            }
        }
        this.drawTasksList(this.sort);
    }

    clearAllTasks() {
        this.tasks = [];
        this.sort = 'all';
        this.id = 0;
        this.localStorageSync();
        this.drawTasksList(this.sort);
    }

    taskRecovery() {
        this.tasks.splice(this.currentIndex, 0, this.temporaryObj);
        this.drawTasksList(this.sort);
    }

    chengeTask(id, isChecked, editedValue) {
        for (let i = 0; i < this.tasks.length; i++) {
            if (this.tasks[i].id === id) {
                editedValue !== undefined ? this.tasks[i].taskDesc = editedValue : '';
                isChecked !== undefined ? this.tasks[i].isDone = isChecked : '';
            }
        }
        this.drawTasksList(this.sort);
    }
}

let todo = new Todo();

window.addEventListener('load', () => {
    if (localStorage.getItem('tasks') && JSON.parse(localStorage.getItem('tasks')).length !== 0) {
        let tasksString = localStorage.getItem('tasks');
        todo.tasks = JSON.parse(tasksString);
        todo.id = localStorage.getItem('lastUsedId');
        todo.sort = localStorage.getItem('sort');
        todo.drawTasksList(todo.sort);

        //ставим сортировку в сохраненную в localstorage позицию
        let sorting = document.querySelector('#sorting');
        for (let i = 0; i < sorting.length; i++) {
            if (sorting[i].value === todo.sort) {
                sorting[i].selected = true;
            }
        }
    }
    else {
        todo.taskList.insertAdjacentHTML('beforeend', `
        <div class="todo-tasks__task">
			<input type="checkbox" id="">
			<p>==Your tasks will be displayed here===</p>
			<span class="task-icon edit" data-edit='false'></span>
			<span class="task-icon delete"></span>
		</div>
        `);
    }
});

document.querySelector('#addTask').addEventListener('click', () => todo.addTask());
document.querySelector('#taskDesc').addEventListener('keydown', (e) => {
    if (e.code === 'Enter') {
        todo.addTask();
    }
});

let recoveryBtn = document.querySelector('.recovery-btn');

todo.taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete')) { //если клик по кнопке удаления
        let id = Number(e.target.parentElement.firstElementChild.id);
        todo.deleteTask(id);

        //=======удаляем предыдущие обработчики если они были=====
        //удаляем предыдущий таймер
        clearInterval(todo.interval);
        //удаляем timeout
        clearTimeout(todo.timer);
        //удалим обработчик события с кнопки отмены удаления
        recoveryBtn.removeEventListener('click', recoveryHandler);
        //===============||=============

        //отображаем кнопку отмены удаления
        recoveryBtn.style.display = 'block';
        //переписываем в переменную заданный в классе интервал для отмены удаления, чтобы потом с ним работать
        let temporaryIntervalForUndoDelete = todo.intervalForUndoDelete;
        //записываем начальную цифру обратного отсчета в кнопку отмены удаления
        recoveryBtn.querySelector('span').innerText = temporaryIntervalForUndoDelete;

        //устанавливаем таймер обновляющий кол-во оставшихся секунд в кнопке удаления
        todo.interval = setInterval(() => {
            recoveryBtn.querySelector('span').innerText = --temporaryIntervalForUndoDelete;
        }, 1000);


        //создаем отложенное действие, которое скроет кнопку отмены удаления и очистит таймер
        todo.timer = setTimeout(() => {
            recoveryBtn.style.display = 'none';
            clearInterval(todo.interval);
        }, (temporaryIntervalForUndoDelete + 1) * 1000);

        //добавим обработчик события на кнопку отмены удаления
        recoveryBtn.addEventListener('click', recoveryHandler);
    }
    else if (e.target.dataset.edit === 'false') { //если клик просиходит на кнопку редактирования задачи
        e.target.dataset.edit = 'true'; //помечаем редактируемую задачу
        let editIcons = document.querySelectorAll('.task-icon.edit');
        for (let i = 0; i < editIcons.length; i++) { //всем остальным задачам меняем dataset.edit на lock, чтобы исключить одновременное редактирование других задач
            if (editIcons[i].dataset.edit === 'false') {
                editIcons[i].dataset.edit = 'lock';
            }
        }
        let p = e.target.previousElementSibling; //получаем параграф с текстом задачи

        //создаем инпут, куда поместим задачу для редактирования
        let input = document.createElement('input');
        input.type = 'text';
        input.classList.add('edit-task');
        input.value = p.textContent; //вставляем в инпут текст задачи
        //===========||==========

        p.replaceWith(input); //меняем параграф с текстом задачи на инпут
        input.focus(); //ставим курсор в поле ввода
        let editBtn = input.nextElementSibling; //находим иконку с карандашом
        editBtn.classList.add('active'); //добавляем стиль, который меняет иконку с карандашом на галочку
    }
    else if (e.target.dataset.edit === 'true') { //условие срабатываем если было нажатие на галочку редактируемой задачи
        let id = Number(e.target.parentElement.firstElementChild.id);
        let isChecked = e.target.parentElement.firstElementChild.checked;
        let editedValue = e.target.parentElement.querySelector('.edit-task').value;

        todo.chengeTask(id, isChecked, editedValue);
    }
    else if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') { //отслеживаем установку задачи в позицию checked
        let id = Number(e.target.id);
        todo.chengeTask(id, e.target.checked);
    }
})

document.querySelector('#sorting').addEventListener('change', (e) => {
    for (let i = 0; i < e.target.length; i++) {
        if (e.target[i].selected === true) {
            todo.sort = e.target[i].value;
            todo.localStorageSync();
            todo.drawTasksList(todo.sort);
        }
    }
})

document.querySelector('#clearAll').addEventListener('click', () => {
    let isClearAll = confirm('Are you sure to clear all task?')
    if (isClearAll) {
        todo.clearAllTasks();

        //ставим сортировку в позицию по умолчанию (all)
        let sorting = document.querySelector('#sorting');
        for (let i = 0; i < sorting.length; i++) {
            if (sorting[i].value === todo.sort) {
                sorting[i].selected = true;
            }
        }
    }
})

//=====Functions=======

function recoveryHandler() {
    todo.taskRecovery();
    recoveryBtn.style.display = 'none';
}