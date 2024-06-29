import { getDate } from "../util.js";

const apiUrl = '/tasks';

function readTasks(processData)
{
    fetch(apiUrl)
        .then(response =>
        {
            if (!response.ok)
            {
                throw new Error('Erro na rede ao tentar acessar a API');
            }
            return response.json();
        })
        .then(data =>
        {
            console.log('Dados recebidos da API:', data);
            if (data && data.length > 0)
            {
                processData(data);
            } else
            {
                displayMessage("Nenhuma tarefa criada. Comece agora!");
            }
        })
        .catch(error =>
        {
            console.error('Erro ao ler tarefas via API JSONServer:', error);
            displayMessage("Erro ao ler tarefas");
        });
}

function renderTasks(tasks)
{
    const containers = document.querySelectorAll('.priority-tasks-container');

    containers.forEach(container =>
    {
        container.innerHTML = '';
        container.closest('.priority').classList.add('hidden');
    })

    const priorityOrder = { 'alta': 1, 'media': 2, 'baixa': 3 };

    tasks.sort((a, b) =>
    {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    tasks.forEach((task, taskId) =>
    {
        const taskElement = document.createElement("div");
        taskElement.classList.add("task");
        if (task.complete)
        {
            taskElement.classList.add("completed");
        }
        taskElement.setAttribute('data-task-id', taskId);

        taskElement.innerHTML = `
            <div class="task-containers">
                <h3>${task.title}</h3>
                <p>${task.description}</p>
                ${!task.complete ?
                `<p>${generateRemainingDates(task)}</p>
                <div class="select-container">
                    <label>Prioridade:</label>
                    <select class="priority-select" name="priority-select" data-task-id="${taskId}">
                        <option value="alta" ${task.priority === 'alta' ? 'selected' : ''}>Alta</option>
                        <option value="media" ${task.priority === 'media' ? 'selected' : ''}>Média</option>
                        <option value="baixa" ${task.priority === 'baixa' ? 'selected' : ''}>Baixa</option>
                    </select>
                </div>` : ''}
                
                <button class="edit-btn">
                    Editar <i class="fa-solid fa-pen-to-square"></i>
                </button>
            </div>
            <div class="task-buttons">
                <button class="complete-btn" data-task-id="${taskId}">${task.complete ? 'Reabrir' : 'Concluir'} <i class="fa-solid ${task.complete ? 'fa-rotate-right' : 'fa-check'}"></i></button>
            </div>
        `;

        taskElement.querySelector('.edit-btn').addEventListener('click', () => { openEditModal(taskId) });

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = 'Excluir <i class="fa-solid fa-x"></i>';
        deleteButton.classList.add('delete-btn');
        deleteButton.addEventListener('click', function ()
        {
            const taskId = task.id;
            deleteTask(taskId);
        });
        taskElement.querySelector('.task-buttons').appendChild(deleteButton);

        if (task.complete)
        {
            containers[4].appendChild(taskElement);
            containers[4].closest('.priority').classList.remove('hidden');
        }
        else if (new Date(task.term) < today)
        {
            containers[0].appendChild(taskElement);
            containers[0].closest('.priority').classList.remove('hidden');
        }
        else
        {
            containers[priorityOrder[task.priority]].appendChild(taskElement);
            containers[priorityOrder[task.priority]].closest('.priority').classList.remove('hidden');
        }
    });

    document.querySelectorAll('.complete-btn').forEach(button =>
    {
        button.addEventListener('click', handleTaskCompleteButtonClick);
    });

    document.querySelectorAll('.subtask-complete').forEach(checkbox =>
    {
        checkbox.addEventListener('change', handleSubTaskCheckboxChange);
    });

    document.querySelectorAll('.priority-select').forEach(select =>
    {
        select.addEventListener('change', handlePriorityChange);
    });
}

function generateRemainingDates(task)
{
    const today = new Date();

    const parts = task.term.split('-');

    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[0], 10);

    const term = new Date(task.term);

    today.setHours(0, 0, 0, 0);
    term.setHours(0, 0, 0, 0);

    if (today < term)
    {
        const timeDifference = term - today;
        const days = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
        return `Vence em ${days} ${days === 1 ? 'dia' : 'dias'}`;
    }

    if (today === term)
    {
        return 'Vence hoje';
    }

    return 'Venceu';

}

function handleTaskCompleteButtonClick(event)
{
    const taskId = event.target.getAttribute('data-task-id');
    const taskIndex = tasks.findIndex((t, index) => index == taskId);
    if (taskIndex === -1) return;

    tasks[taskIndex].complete = !tasks[taskIndex].complete;

    fetch(`${apiUrl}/${tasks[taskIndex].id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tasks[taskIndex])
    })
        .then(response =>
        {
            if (!response.ok)
            {
                throw new Error('Erro ao atualizar a tarefa');
            }
            return response.json();
        })
        .then(updatedTask =>
        {
            tasks[taskIndex] = updatedTask;
            renderTasks(tasks);
        })
        .catch(error =>
        {
            console.error('Erro ao salvar a tarefa:', error);
        });
}

function handlePriorityChange(event)
{
    const taskId = event.target.getAttribute('data-task-id');
    const taskIndex = tasks.findIndex((t, index) => index == taskId);
    if (taskIndex === -1) return;

    tasks[taskIndex].priority = event.target.value;

    fetch(`${apiUrl}/${tasks[taskIndex].id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tasks[taskIndex])
    })
        .then(response =>
        {
            if (!response.ok)
            {
                throw new Error('Erro ao atualizar a prioridade da tarefa');
            }
            return response.json();
        })
        .then(updatedTask =>
        {
            tasks[taskIndex] = updatedTask;
            renderTasks(tasks);
        })
        .catch(error =>
        {
            console.error('Erro ao salvar a prioridade da tarefa:', error);
        });
}

function displayMessage(message)
{
    const tasksContainer = document.getElementById("tasks");
    tasksContainer.innerHTML = `<h2>${message}</h2>`;
}

function formatDate(date)
{
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function openEditModal(taskId)
{
    const modal = document.getElementById("editTaskModal");
    const form = document.getElementById("editTaskForm");
    const task = tasks[taskId];

    document.getElementById("editTaskTitle").value = task.title;
    document.getElementById("editTaskDescription").value = task.description;
    document.getElementById("editTaskTerm").value = formatDate(task.term);

    form.onsubmit = function (e)
    {
        e.preventDefault();
        saveTask(taskId);
    };

    modal.classList.remove('hidden');
}

function closeModal()
{
    const modal = document.getElementById("editTaskModal");
    modal.classList.add('hidden');
}

document.querySelector(".close").onclick = closeModal;

function deleteTask(taskId)
{
    fetch(`${apiUrl}/${taskId}`, {
        method: 'DELETE'
    })
        .then(response =>
        {
            if (!response.ok)
            {
                throw new Error('Erro ao excluir a tarefa');
            }
            return response.json();
        })
        .then(() =>
        {
            console.log('Tarefa excluída com sucesso');
            readTasks(processData);
        })
        .catch(error =>
        {
            console.error('Erro ao excluir a tarefa:', error);
        });
}

function saveTask(taskId)
{
    const taskIndex = tasks.findIndex((t, index) => index === taskId);
    if (taskIndex === -1) return;

    tasks[taskIndex].title = document.getElementById("editTaskTitle").value;
    tasks[taskIndex].description = document.getElementById("editTaskDescription").value;
    tasks[taskIndex].term = document.getElementById("editTaskTerm").value;

    fetch(`${apiUrl}/${tasks[taskIndex].id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tasks[taskIndex])
    })
        .then(response =>
        {
            if (!response.ok)
            {
                throw new Error('Erro ao atualizar a tarefa');
            }
            return response.json();
        })
        .then(updatedTask =>
        {
            tasks[taskIndex] = updatedTask;
            renderTasks(tasks);
            closeModal();
        })
        .catch(error =>
        {
            console.error('Erro ao salvar a tarefa:', error);
        });
}

function handleSubTaskCheckboxChange(event)
{
    const taskId = event.target.getAttribute('data-task-id');
    const subTaskId = event.target.getAttribute('data-subtask-id');
    const taskIndex = tasks.findIndex((t, index) => index == taskId);
    if (taskIndex === -1) return;

    const subTaskIndex = tasks[taskIndex].subTasks.findIndex((st, index) => index == subTaskId);
    if (subTaskIndex === -1) return;

    tasks[taskIndex].subTasks[subTaskIndex].complete = event.target.checked;

    fetch(`${apiUrl}/${tasks[taskIndex].id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(tasks[taskIndex])
    })
        .then(response =>
        {
            if (!response.ok)
            {
                throw new Error('Erro ao atualizar a subtarefa');
            }
            return response.json();
        })
        .then(updatedTask =>
        {
            tasks[taskIndex] = updatedTask;
            renderTasks(tasks);
        })
        .catch(error =>
        {
            console.error('Erro ao salvar a subtarefa:', error);
        });
}

let tasks = [];

function processData(data)
{
    tasks = data;
    renderTasks(tasks);
}

readTasks(processData);

document.addEventListener('DOMContentLoaded', function ()
{
    const addTaskButton = document.querySelector('.add-task-header');
    const modals = document.querySelectorAll('.modal');

    addTaskButton.addEventListener('click', function ()
    {
        modals[0].classList.remove('hidden');
    });

    const closeButtons = document.querySelectorAll('.close');
    console.log(closeButtons)
    closeButtons.forEach((button, index) => button.addEventListener('click', function ()
    {
        modals[index].classList.add('hidden');
    }));

    const addTaskForm = document.getElementById('addTaskForm');
    addTaskForm.addEventListener('submit', function (event)
    {
        event.preventDefault();

        const formData = new FormData(addTaskForm);
        const newTaskData = {};
        formData.forEach((value, key) =>
        {
            newTaskData[key] = value;
        });

        console.log(newTaskData)

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTaskData)
        })
            .then(response =>
            {
                if (!response.ok)
                {
                    throw new Error('Erro ao adicionar a tarefa');
                }
                return response.json();
            })
            .then(newTask =>
            {
                console.log('Nova tarefa adicionada:', newTask);
                addTaskForm.closest('.modal').style.display = 'none';
                readTasks(processData);
            })
            .catch(error =>
            {
                console.error('Erro ao adicionar a tarefa:', error);
            });
    });

    const wrappers = document.querySelectorAll('.priority .wrapper');
    const priorityTaskContainers = document.querySelectorAll('.priority-tasks-container');
    const priorityHeaders = document.querySelectorAll('.priority-header');
    const chevrons = document.querySelectorAll('.priority-header i');

    priorityHeaders.forEach((header, index) =>
    {
        header.addEventListener('click', () =>
        {
            const wrapper = wrappers[index];

            chevrons[index].classList.toggle('fa-chevron-up');
            chevrons[index].classList.toggle('fa-chevron-down');

            if (wrapper.classList.contains('collapse'))
            {
                wrapper.classList.remove('collapse');
                console.log($(priorityTaskContainers[index]).outerHeight(true))
                wrapper.style.height = `${$(priorityTaskContainers[index]).outerHeight(true)}px`;
                return;
            }

            wrapper.classList.add('collapse');
            wrapper.style.height = '0px';
        })
    })
});