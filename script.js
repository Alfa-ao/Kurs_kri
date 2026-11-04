fetch('data.json')
    .then(response => response.json())
    .then(rawData => {
        const processedData = {};
        const RATE_MULTIPLIER = 10000;

        rawData.forEach(item => {
            const date = new Date(item.time.replace(' ', 'T'));
            const year = date.getFullYear().toString();
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

            processedData[year][dateKey].buy.push(item.buy / RATE_MULTIPLIER);
            processedData[year][dateKey].sell.push(item.sell / RATE_MULTIPLIER);
        });

        const datasets = [];
        const years = Object.keys(processedData).sort();
        
        const colors = {
            '2024': { buy: '#38bdf8', sell: '#38bff8aa' },
            '2025': { buy: '#34d399', sell: '#34d399aa' },
            '2026': { buy: '#a78bfa', sell: '#a78bfaaa' }
        };

        years.forEach(year => {
            const buyPoints = [];
            const sellPoints = [];
            
            const yearNum = parseInt(year);
            const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0);
            const daysInYear = isLeapYear ? 366 : 365;
            
            for (let day = 0; day < daysInYear; day++) {
                const date = new Date(2000, 0, day + 1);
                const month = date.getMonth();
                const dayOfMonth = date.getDate();
                const dateKey = `${month}-${dayOfMonth}`;
                
                if (processedData[year][dateKey]) {
                    const dayData = processedData[year][dateKey];
                    const avgBuy = dayData.buy.reduce((a, b) => a + b, 0) / dayData.buy.length;
                    const avgSell = dayData.sell.reduce((a, b) => a + b, 0) / dayData.sell.length;
                    
                    buyPoints.push({ x: date, y: avgBuy });
                    sellPoints.push({ x: date, y: avgSell });
                } else {
                    buyPoints.push({ x: date, y: null });
                    sellPoints.push({ x: date, y: null });
                }
            }

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
                borderWidth: 2.5,
                spanGaps: false
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
                borderDash: [5, 5],
                spanGaps: false
            });
        });

        const ctx = document.getElementById('crystalChart').getContext('2d');
        const chart = new Chart(ctx, {
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
                        ticks: { 
                            color: '#94a3b8', 
                            font: { size: 12 },
                            callback: function(value) {
                                return value.toFixed(2) + ' зол.';
                            }
                        },
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
                            title: function(context) {
                                const date = new Date(context[0].parsed.x);
                                return date.toLocaleDateString('ru-RU', { 
                                    day: 'numeric', 
                                    month: 'long' 
                                });
                            },
                            label: function(context) {
                                if (context.parsed.y === null) {
                                    return `${context.dataset.label}: нет данных`;
                                }
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(4)} зол.`;
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: null
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                                speed: 0.1
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                            onZoomComplete: function({chart}) {
                                const zoomLevel = chart.scales.x.max - chart.scales.x.min;
                                const daysVisible = zoomLevel / (1000 * 60 * 60 * 24);
                                
                                if (daysVisible < 30) {
                                    chart.options.scales.x.time.unit = 'day';
                                    chart.options.scales.x.time.displayFormats = { day: 'dd MMM' };
                                } else if (daysVisible < 90) {
                                    chart.options.scales.x.time.unit = 'week';
                                    chart.options.scales.x.time.displayFormats = { week: 'dd MMM' };
                                } else {
                                    chart.options.scales.x.time.unit = 'month';
                                    chart.options.scales.x.time.displayFormats = { month: 'MMM' };
                                }
                                chart.update();
                            }
                        },
                        limits: {
                            x: {
                                min: 'original',
                                max: 'original'
                            }
                        }
                    }
                }
            }
        });

        document.getElementById('resetZoom').addEventListener('click', function() {
            chart.resetZoom();
        });
    })
    .catch(error => console.error('Ошибка загрузки данных:', error));