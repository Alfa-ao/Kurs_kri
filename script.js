fetch('data.json')
.then(response => response.json())
.then(rawData => {
    const processedData = {};
    const RATE_MULTIPLIER = 10000;
    
    rawData.forEach(item => {
        const date = new Date(item.time.replace(' ', 'T'));
        const year = date.getFullYear().toString();
        const month = date.getMonth();
        const day = date.getDate();
        const hour = date.getHours();
        const dateKey = `${month}-${day}`;
        const hourKey = `${month}-${day}-${hour}`;
        
        if (!processedData[year]) {
            processedData[year] = {
                daily: {},
                hourly: {}
            };
        }
        
        if (!processedData[year].daily[dateKey]) {
            const timestamp = new Date(2000, month, day).getTime();
            processedData[year].daily[dateKey] = { 
                buy: [], 
                sell: [], 
                timestamp: timestamp 
            };
        }
        
        if (!processedData[year].hourly[hourKey]) {
            const timestamp = new Date(2000, month, day, hour).getTime();
            processedData[year].hourly[hourKey] = { 
                buy: [], 
                sell: [], 
                timestamp: timestamp 
            };
        }
        
        processedData[year].daily[dateKey].buy.push(item.buy / RATE_MULTIPLIER);
        processedData[year].daily[dateKey].sell.push(item.sell / RATE_MULTIPLIER);
        processedData[year].hourly[hourKey].buy.push(item.buy / RATE_MULTIPLIER);
        processedData[year].hourly[hourKey].sell.push(item.sell / RATE_MULTIPLIER);
    });
    
    const colors = {
        '2024': { buy: '#38bdf8', sell: '#38bff8aa' },
        '2025': { buy: '#34d399', sell: '#34d399aa' },
        '2026': { buy: '#a78bfa', sell: '#a78bfaaa' }
    };
    
    const MAX_GAP_MS = 7 * 24 * 60 * 60 * 1000;
    
    function filterGaps(points) {
        const filtered = [];
        let lastValidPoint = null;
        
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            
            if (point.y !== null) {
                if (lastValidPoint !== null) {
                    const gap = point.x - lastValidPoint.x;
                    if (gap > MAX_GAP_MS) {
                        filtered.push({ x: point.x, y: null, isGap: true });
                    }
                }
                filtered.push(point);
                lastValidPoint = point;
            }
        }
        
        return filtered;
    }
    
    function generateDailyDatasets() {
        const datasets = [];
        const years = Object.keys(processedData).sort();
        
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
                const timestamp = new Date(2000, month, dayOfMonth).getTime();
                
                if (processedData[year].daily[dateKey]) {
                    const dayData = processedData[year].daily[dateKey];
                    const avgBuy = dayData.buy.reduce((a, b) => a + b, 0) / dayData.buy.length;
                    const avgSell = dayData.sell.reduce((a, b) => a + b, 0) / dayData.sell.length;
                    buyPoints.push({ x: timestamp, y: avgBuy });
                    sellPoints.push({ x: timestamp, y: avgSell });
                }
            }
            
            const filteredBuyPoints = filterGaps(buyPoints);
            const filteredSellPoints = filterGaps(sellPoints);
            
            const yearColors = colors[year] || { buy: '#ffffff', sell: '#888888' };
            datasets.push({
                label: `Покупка ${year}`,
                data: filteredBuyPoints,
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
                data: filteredSellPoints,
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
        
        return datasets;
    }
    
    function generateHourlyDatasets() {
        const datasets = [];
        const years = Object.keys(processedData).sort();
        
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
                
                for (let hour = 0; hour < 24; hour++) {
                    const hourKey = `${month}-${dayOfMonth}-${hour}`;
                    const timestamp = new Date(2000, month, dayOfMonth, hour).getTime();
                    
                    if (processedData[year].hourly[hourKey]) {
                        const hourData = processedData[year].hourly[hourKey];
                        const avgBuy = hourData.buy.reduce((a, b) => a + b, 0) / hourData.buy.length;
                        const avgSell = hourData.sell.reduce((a, b) => a + b, 0) / hourData.sell.length;
                        buyPoints.push({ x: timestamp, y: avgBuy });
                        sellPoints.push({ x: timestamp, y: avgSell });
                    }
                }
            }
            
            const filteredBuyPoints = filterGaps(buyPoints);
            const filteredSellPoints = filterGaps(sellPoints);
            
            const yearColors = colors[year] || { buy: '#ffffff', sell: '#888888' };
            datasets.push({
                label: `Покупка ${year}`,
                data: filteredBuyPoints,
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
                data: filteredSellPoints,
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
        
        return datasets;
    }
    
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
        data: { datasets: generateDailyDatasets() },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
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
                decimation: {
                    enabled: true,
                    algorithm: 'lttb',
                    threshold: 100
                },
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
                    filter: function(tooltipItem) {
                        return tooltipItem.parsed.y !== null && !tooltipItem.raw.isGap;
                    },
                    callbacks: {
                        title: function(context) {
                            const date = new Date(context[0].parsed.x);
                            const dayVisible = chart.scales.x.max - chart.scales.x.min;
                            const daysVisible = dayVisible / (1000 * 60 * 60 * 24);
                            if (daysVisible < 14) {
                                return date.toLocaleDateString('ru-RU', { 
                                    day: 'numeric', 
                                    month: 'long' 
                                }) + ' ' + date.getHours() + ':00';
                            } else {
                                return date.toLocaleDateString('ru-RU', { 
                                    day: 'numeric', 
                                    month: 'long' 
                                });
                            }
                        },
                        label: function(context) {
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
                            const zoomLevel = chart.scales.x.max - chart.scales.x.min;
                            const daysVisible = zoomLevel / (1000 * 60 * 60 * 24);
                            
                            let currentMode = chart.options.plugins.zoom._currentMode || 'daily';
                            
                            if (daysVisible < 14 && currentMode === 'daily') {
                                chart.data.datasets = generateHourlyDatasets();
                                chart.options.scales.x.time.unit = 'hour';
                                chart.options.scales.x.time.displayFormats = { hour: 'dd MMM HH:mm' };
                                chart.options.plugins.zoom._currentMode = 'hourly';
                                chart.update('none');
                            } else if (daysVisible >= 14 && currentMode === 'hourly') {
                                chart.data.datasets = generateDailyDatasets();
                                chart.options.plugins.zoom._currentMode = 'daily';
                                
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
                                chart.update('none');
                            } else {
                                if (daysVisible < 7) {
                                    chart.options.scales.x.time.unit = 'hour';
                                    chart.options.scales.x.time.displayFormats = { hour: 'dd MMM HH:mm' };
                                } else if (daysVisible < 30) {
                                    chart.options.scales.x.time.unit = 'day';
                                    chart.options.scales.x.time.displayFormats = { day: 'dd MMM' };
                                } else if (daysVisible < 90) {
                                    chart.options.scales.x.time.unit = 'week';
                                    chart.options.scales.x.time.displayFormats = { week: 'dd MMM' };
                                } else {
                                    chart.options.scales.x.time.unit = 'month';
                                    chart.options.scales.x.time.displayFormats = { month: 'MMM' };
                                }
                                chart.update('none');
                            }
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
        },
        plugins: [crosshairPlugin]
    });
    
    chart.options.plugins.zoom._currentMode = 'daily';
    
    document.getElementById('resetZoom').addEventListener('click', function() {
        chart.resetZoom();
        chart.data.datasets = generateDailyDatasets();
        chart.options.scales.x.time.unit = 'month';
        chart.options.scales.x.time.displayFormats = { month: 'MMM' };
        chart.options.plugins.zoom._currentMode = 'daily';
        chart.update('none');
    });
})
.catch(error => console.error('Ошибка загрузки данных:', error));