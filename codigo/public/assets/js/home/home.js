
  let TotaldeTarefas;
let TarefasTotaisFeitas;
let TotaisDiarias;
let FeitasDiarias;
let CurrentDate;

// recebe a data atual e formata para o formato adequado
const data = new Date()
const dia = String(data.getDate()).padStart(2,'0')
const mes = String(data.getMonth()+1).padStart(2,'0')
const ano = data.getFullYear()
CurrentDate = `${ano}-${mes}-${dia}`

// número de tarefas para hoje
// número de tarefas feitas para hoje
fetch('http://localhost:3000/tasks')
    .then(response => response.json())
    .then(data => {
        const TD = data.filter(task => task.date === CurrentDate).length;
        const FD = data.filter(task => task.date === CurrentDate && task.complete).length;
        TotaisDiarias = TD
        FeitasDiarias = FD
    })

fetch('http://localhost:3000/tasks') // Número de tarefas ao todo
    .then(response => response.json())
    .then(data => {
        TotaldeTarefas = data.length;
    })
function countCompletedTasks(tasks) { // Número de tarefas principais completas
    return tasks.reduce((count, task) => {
        return task.complete ? count + 1 : count;
    }, 0);
}

fetch('http://localhost:3000/tasks')
    .then(response => response.json())
    .then(data => {
        const tasks = data;
        TarefasTotaisFeitas = countCompletedTasks(tasks);

        // Gráfico 1
        const ctx = document.getElementById('grafico1').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                // labels: ['Feitas', 'Pendentes'],
                datasets: [{
                    // label: 'Tarefas',
                    data: [FeitasDiarias, TotaisDiarias - FeitasDiarias], // dados do gráfico 1
                    backgroundColor: [
                        'rgb(34, 190, 110)',
                        'rgb(150, 150, 150)',
                    ],
                }]
            },
        });

        // Gráfico 2
        const ctx2 = document.getElementById('grafico2');
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                // labels: ['Pendentes', 'Feitas'],
                datasets: [{
                    // label: 'Tarefas',
                    data: [TarefasTotaisFeitas, TotaldeTarefas - TarefasTotaisFeitas],// dados do gráfico 2
                    backgroundColor: [
                        'rgb(34, 190, 110)',
                        'rgb(150, 150, 150)',
                    ],
                }]
            },
        });
    });