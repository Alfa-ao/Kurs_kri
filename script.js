// Загрузить данные из локального файла
fetch('data.json')
    .then(response => response.json())
    .then(rawData => {
        const processedData = {};

        // Обработать каждую запись из лога
        rawData.forEach(item => {
            const date = new Date(item.time);
            const year = date.getFullYear().toString();
            
            // Нормализовать дату к 2000 году для корректного наложения линий на одну ось X
            const normalizedDate = new Date(2000, date.getMonth(), date.getDate());
            const dateKey = `${date.getMonth()}-${date.getDate()}`;

            if (!processedData[year]) {
                processedData[year] = {};
            }
            
            if (!processedData[year][dateKey]) {
                processedData[year][dateKey] = { 
                    buy: [], 
                    sell: [], 
                    date: normalizedDate 
                };
            }

            // Собрать все значения за день для последующего усреднения
            processedData[year][dateKey].buy.push(item.buy);
            processedData[year][dateKey].sell.push(item.sell);
        });

        const datasets = [];
        const years = Object.keys(processedData).sort();
        
        // Задать цветовую палитру для каждого года
        const colors = {
            '2024': { buy: '#38bdf8', sell: '#f472b6' },
            '2025': { buy: '#34d399', sell: '#fbbf24' },
            '2026': { buy: '#a78bfa', sell: '#fb923c' }
        };

        // Сформировать датасеты для Chart.js
        years.forEach(year => {
            const buyPoints = [];
            const sellPoints = [];

            Object.values(processedData[year]).forEach(dayData => {
                const avgBuy = dayData.buy.reduce((a, b) => a + b, 0) / dayData.buy.length;
                const avgSell = dayData.sell.reduce((a, b) => a + b, 0) / dayData.sell.length;

                buyPoints.push({ x: dayData.date, y: avgBuy });
                sellPoints.push({ x: dayData.date, y: avgSell });
            });

            // Отсортировать точки по времени
            buyPoints.sort((a, b) => a.x - b.x);
            sellPoints.sort((a, b) => a.x - b.x);

            const yearColors = colors[year] || { buy: '#ffffff', sell: '#888888' };

            datasets.push({
                label: `Покупка ${year}`,
                data: buyPoints,
                borderColor: yearColors.buy,
                backgroundColor: yearColors.buy + '20',
                tension: 0.4,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderWidth: 2.5
            });

            datasets.push({
                label: `Продажа ${year}`,
                data: sellPoints,
                borderColor: yearColors.sell,
                backgroundColor: yearColors.sell + '20',
                tension: 0.4,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderWidth: 2.5,
                borderDash: [5, 5]
            });
        });

        // Инициализировать график
        const ctx = document.getElementById('crystalChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            displayFormats: { month: 'MMM' }
                        },
                        ticks: { color: '#94a3b8', font: { size: 12 } },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#94a3b8', font: { size: 12 } },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { 
                            color: '#e2e8f0',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            // Показать реальный день и месяц во всплывающей подсказке
                            title: function(context) {
                                const date = new Date(context[0].parsed.x);
                                return date.toLocaleDateString('ru-RU', { 
                                    day: 'numeric', 
                                    month: 'long' 
                                });
                            }
                        }
                    }
                }
            }
        });
    })
    .catch(error => console.error('Ошибка загрузки данных:', error));