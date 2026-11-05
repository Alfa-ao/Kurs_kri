fetch('data.json')
.then(response => response.json())
.then(rawData => {
    const processedData = {};
    const RATE_MULTIPLIER = 10000;
    
    rawData.forEach(item => {
        const date = new Date(item.time.replace(' ', 'T'));
        const year = date.getFullYear().toString();
        const hour = date.getHours();
        
        if (!processedData[year]) {
            processedData[year] = {};
        }
        if (!processedData[year][hour]) {
            processedData[year][hour] = { 
                buy: [], 
                sell: [] 
            };
        }
        processedData[year][hour].buy.push(item.buy / RATE_MULTIPLIER);
        processedData[year][hour].sell.push(item.sell / RATE_MULTIPLIER);
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
        
        for (let hour = 0; hour < 24; hour++) {
            if (processedData[year][hour]) {
                const hourData = processedData[year][hour];
                const avgBuy = hourData.buy.reduce((a, b) => a + b, 0) / hourData.buy.length;
                const avgSell = hourData.sell.reduce((a, b) => a + b, 0) / hourData.sell.length;
                buyPoints.push({ x: hour, y: avgBuy });
                sellPoints.push({ x: hour, y: avgSell });
            } else {
                buyPoints.push({ x: hour, y: null });
                sellPoints.push({ x: hour, y: null });
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
    
    const crosshairPlugin = {
        id: 'crosshair',
        afterDraw(chart) {
            if (chart.tooltip?._active?.length) {
                const activePoint = chart.tooltip._active[0];
                const ctx = chart.ctx;
                const x = activePoint.element.x;
                const topY = chart.scales.y.top;
                const bottomY = chart.scales.y.bottom;
                
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, bottomY);
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.restore();
            }
        }
    };
    
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
                    type: 'linear',
                    min: 0,
                    max: 23,
                    ticks: {
                        color: '#94a3b8',
                        font: { size: 12 },
                        stepSize: 1,
                        callback: function(value) {
                            return value + ':00';
                        }
                    },
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    title: {
                        display: true,
                        text: 'Час дня',
                        color: '#94a3b8'
                    }
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
                            const hour = Math.round(context[0].parsed.x);
                            return `${hour}:00 - ${hour + 1}:00`;
                        },
                        label: function(context) {
                            if (context.parsed.y === null) {
                                return `${context.dataset.label}: нет данных`;
                            }
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} зол.`;
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
                            chart.update();
                        }
                    },
                    limits: {
                        x: {
                            min: 0,
                            max: 23
                        }
                    }
                }
            }
        },
        plugins: [crosshairPlugin]
    });
    
    document.getElementById('resetZoom').addEventListener('click', function() {
        chart.resetZoom();
    });
})
.catch(error => console.error('Ошибка загрузки данных:', error));