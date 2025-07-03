let translations, scoutingData, teams, mockData, averagePace;

let fourFactorsChart, playerEngineChart, playerStyleChart;
let currentLang = 'en';

const pe_statOptions = [
    { value: 'pts', label: 'stat-pts' },
    { value: 'ast', label: 'stat-ast' },
    { value: 'reb', label: 'stat-reb' },
    { value: 'usg', label: 'stat-usg' },
    { value: 'ts_pct', label: 'stat-ts_pct' },
    { value: 'fga', label: 'stat-fga' },
    { value: '3pa', label: 'stat-3pa' },
    { value: 'tov', label: 'stat-tov' }
];

function initializeCharts() {
    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
    const radarOptions = { ...chartOptions, scales: { r: { suggestedMin: 0, suggestedMax: 100, grid: { color: 'rgba(0,0,0,0.05)' }, pointLabels: { font: { size: 10 } }, ticks: { display: false } } }, plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } } };
    const barOptions = { ...chartOptions, scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }, plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } } };
    const horizontalBarOptions = { ...barOptions, indexAxis: 'y', scales: { x: { stacked: true }, y: { stacked: true } } };

    fourFactorsChart = new Chart(document.getElementById('fourFactorsChart'), { type: 'radar', data: { labels: ['eFG%', 'TOV%', 'ORB%', 'FT Rate'], datasets: [{}, {}] }, options: radarOptions });
    playerEngineChart = new Chart(document.getElementById('playerEngineChart'), { type: 'bar', data: { labels: [], datasets: [{}, {}] }, options: barOptions });
    playerStyleChart = new Chart(document.getElementById('playerStyleChart'), { type: 'bar', data: { labels: [], datasets: [{}, {}, {}] }, options: horizontalBarOptions });
}

function updateDashboard(teamName, isAllTeams) {
    const dashboard = document.getElementById('team-dashboard');
    const prompt = document.getElementById('team-selection-prompt');
    dashboard.classList.add('loading');
    const brilliantBlues = ['#003F5C', '#665191', '#D45087', '#FFA600'];
    const brilliantBluesTransparent = ['rgba(0, 63, 92, 0.6)', 'rgba(102, 81, 145, 0.6)', 'rgba(212, 80, 135, 0.6)', 'rgba(255, 166, 0, 0.6)'];

    if (isAllTeams) {
        prompt.style.display = 'block';
        document.getElementById('pace-value').innerText = averagePace;
        document.getElementById('average-pace-value').innerText = "avg pace";
        
        fourFactorsChart.data.datasets = [{
            label: 'Offense', data: [], backgroundColor: brilliantBluesTransparent[1], borderColor: brilliantBlues[1], borderWidth: 2
        }, {
            label: 'Defense', data: [], backgroundColor: brilliantBluesTransparent[2], borderColor: brilliantBlues[2], borderWidth: 2
        }];
        fourFactorsChart.update();

        playerEngineChart.data.labels = [];
        playerEngineChart.data.datasets = [];
        playerEngineChart.update();

        playerStyleChart.data.labels = [];
        playerStyleChart.data.datasets = [];
        playerStyleChart.update();

        dashboard.classList.remove('loading');
        return;
    }

    prompt.style.display = 'none';
    setTimeout(() => {
        const data = scoutingData[teamName];
        document.getElementById('pace-value').innerText = data.pace;
        document.getElementById('average-pace-value').innerText = `/ ${averagePace} avg`;

        fourFactorsChart.data.datasets[0] = { label: 'Offense', data: data.fourFactors.offense, backgroundColor: brilliantBluesTransparent[1], borderColor: brilliantBlues[1], borderWidth: 2 };
        fourFactorsChart.data.datasets[1] = { label: 'Defense', data: data.fourFactors.defense, backgroundColor: brilliantBluesTransparent[2], borderColor: brilliantBlues[2], borderWidth: 2 };
        fourFactorsChart.update();

        const topPlayers = data.players.sort((a, b) => b.usg - a.usg).slice(0, 3);

        playerEngineChart.data.labels = topPlayers.map(p => p.name);
        playerEngineChart.data.datasets[0] = { label: 'USG%', data: topPlayers.map(p => p.usg), backgroundColor: brilliantBlues[0] };
        playerEngineChart.data.datasets[1] = { label: 'TS%', data: topPlayers.map(p => p.ts), backgroundColor: brilliantBlues[3] };
        playerEngineChart.update();

        playerStyleChart.data.labels = topPlayers.map(p => p.name);
        playerStyleChart.data.datasets[0] = { label: '2PA%', data: topPlayers.map(p => p.style['2PA']), backgroundColor: brilliantBlues[0] };
        playerStyleChart.data.datasets[1] = { label: '3PA%', data: topPlayers.map(p => p.style['3PA']), backgroundColor: brilliantBlues[1] };
        playerStyleChart.data.datasets[2] = { label: 'FTA%', data: topPlayers.map(p => p.style['FTA']), backgroundColor: brilliantBlues[2] };
        playerStyleChart.update();

        d3.selectAll(".team-circle").classed("selected", false).transition().duration(200).attr("r", 15);
        d3.select(`#circle-${teamName}`).classed("selected", true).raise().transition().duration(200).attr("r", 20);
        
        dashboard.classList.remove('loading');
    }, 300);
}

function drawEfficiencyChart() {
    const chartContainer = d3.select("#chart");
    chartContainer.html("");
    const bounds = chartContainer.node().getBoundingClientRect();
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = bounds.width - margin.left - margin.right;
    let height = bounds.height - margin.top - margin.bottom;

    if (width > 0 && height < 150) {
        height = Math.min(width * 0.8, 500);
    }

    const svg = chartContainer.append("svg").attr("width", "100%").attr("height", "100%").attr("viewBox", `0 0 ${bounds.width} ${height + margin.top + margin.bottom}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const xScale = d3.scaleLinear().domain([95, 125]).range([0, width]);
    const yScale = d3.scaleLinear().domain([125, 95]).range([height, 0]);
    const avgOffense = d3.mean(teams, d => d.offense);
    const avgDefense = d3.mean(teams, d => d.defense);
    g.append("g").attr("class", "grid").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5).tickSize(-height).tickFormat("")).selectAll("line").attr("class", "grid-line");
    g.append("g").attr("class", "grid").call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat("")).selectAll("line").attr("class", "grid-line");
    g.append("line").attr("class", "average-line").attr("x1", 0).attr("x2", width).attr("y1", yScale(avgDefense)).attr("y2", yScale(avgDefense));
    g.append("line").attr("class", "average-line").attr("x1", xScale(avgOffense)).attr("x2", xScale(avgOffense)).attr("y1", 0).attr("y2", height);

    const domain = xScale.domain();
    const angle = Math.atan2(yScale(domain[1]) - yScale(domain[0]), xScale(domain[1]) - xScale(domain[0])) * 180 / Math.PI;

    // y = x line
    g.append("line")
        .attr("x1", xScale(domain[0]))
        .attr("y1", yScale(domain[0]))
        .attr("x2", xScale(domain[1]))
        .attr("y2", yScale(domain[1]))
        .style("stroke", "grey")
        .style("stroke-width", 1)
        .style("stroke-dasharray", "5,5");

    const textGroup = g.append("g")
        .attr("transform", `translate(${xScale(98)}, ${yScale(98)}) rotate(${angle})`);

    textGroup.append("text")
        .attr("y", -5)
        .style("font-size", "10px")
        .style("fill", "grey")
        .attr("text-anchor", "middle")
        .text("Positive Teams");

    textGroup.append("line")
        .attr("x1", -30)
        .attr("x2", 30)
        .attr("y1", 0)
        .attr("y2", 0)
        .style("stroke", "grey")
        .style("stroke-width", 0.5);

    textGroup.append("text")
        .attr("y", 10)
        .style("font-size", "10px")
        .style("fill", "grey")
        .attr("text-anchor", "middle")
        .text("Negative Teams");
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale).ticks(5));
    g.append("g").attr("class", "axis").call(d3.axisLeft(yScale).ticks(5));
    svg.append("text").attr("class", "axis-label").attr("x", margin.left + width / 2).attr("y", height + margin.top + 35).style("text-anchor", "middle").style("font-size", "12px").text("Offensive Rating");
    svg.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("y", 15).attr("x", -(margin.top + height / 2)).style("text-anchor", "middle").style("font-size", "12px").text("Defensive Rating");
    const tooltip = d3.select("#tooltip");
    const defs = g.append("defs");
    defs.selectAll(".team-pattern").data(teams).enter().append("pattern").attr("id", (d) => `logo-${d.name}`).attr("width", 1).attr("height", 1).attr("patternContentUnits", "objectBoundingBox").append("image").attr("xlink:href", d => d.logoUrl).attr("width", 1).attr("height", 1).attr("preserveAspectRatio", "xMidYMid slice");
    g.selectAll(".team-circle").data(teams).enter().append("circle").attr("class", "team-circle").attr("id", d => `circle-${d.name}`).attr("cx", d => xScale(d.offense)).attr("cy", d => yScale(d.defense)).attr("r", 15).attr("fill", d => `url(#logo-${d.name})`).on("mouseover", function(event, d) {
        d3.select(this).raise().transition().duration(200).attr("r", 18);
        tooltip.style("opacity", 1).html(`<strong>${d.name}</strong><br/>Off: ${d.offense}<br/>Def: ${d.defense}`).style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 10) + "px");
    }).on("mouseout", function(event, d) {
        if (!d3.select(this).classed("selected")) { d3.select(this).transition().duration(200).attr("r", 15); }
        tooltip.style("opacity", 0);
    });
}

let pe_averagedData;
const pe_margin = { top: 20, right: 30, bottom: 60, left: 60 };
let pe_width, pe_height;
const pe_svg = d3.select("#player-explorer-chart-area").append("svg").attr("class", "w-full h-full");
const pe_chart = pe_svg.append("g").attr("transform", `translate(${pe_margin.left},${pe_margin.top})`);
const pe_xAxis = pe_chart.append("g").attr("class", "pe-axis");
const pe_yAxis = pe_chart.append("g").attr("class", "pe-axis");
const pe_xAxisLabel = pe_chart.append("text").attr("text-anchor", "middle").attr("class", "font-semibold text-gray-600");
const pe_yAxisLabel = pe_chart.append("text").attr("text-anchor", "middle").attr("transform", "rotate(-90)").attr("class", "font-semibold text-gray-600");
const pe_grid = pe_chart.append("g").attr("class", "pe-grid");
const pe_tooltip = d3.select("#pe-tooltip");

function initializePlayerExplorer() {
    pe_averagedData = mockData;
    const teamFilter = d3.select("#pe-team-filter");
    const playerFilter = d3.select("#pe-player-filter"), xAxisSelect = d3.select("#x-axis-select"), yAxisSelect = d3.select("#y-axis-select");

    const teamNames = ["All", ...Object.keys(scoutingData)];
    teamFilter.selectAll("option").data(teamNames).enter().append("option").text(d => d === 'All' ? translations[currentLang]["all-teams"] : d).attr("value", d => d).attr("data-translate", d => d === 'All' ? 'all-teams' : `team-${d.toLowerCase()}`);

    const players = ["All", ...new Set(pe_averagedData.map(d => d.player))];
    playerFilter.selectAll("option").data(players).enter().append("option").text(d => d === 'All' ? translations[currentLang]["all-players"] : d).attr("value", d => d).attr("data-translate", d => d === 'All' ? 'all-players' : `player-${d.toLowerCase().replace(/\./g, "").replace(/\s/g, "-")}`);
    
    xAxisSelect.selectAll('option').data(pe_statOptions).enter().append('option').text(d => translations[currentLang][d.label]).attr('value', d => d.value).attr('data-translate', d => d.label);
    yAxisSelect.selectAll('option').data(pe_statOptions).enter().append('option').text(d => translations[currentLang][d.label]).attr('value', d => d.value).attr('data-translate', d => d.label);
    
    xAxisSelect.property('value', 'usg');
    yAxisSelect.property('value', 'ts_pct');

    teamFilter.on("change", updatePlayerExplorer);
    playerFilter.on("change", updatePlayerExplorer); 
    xAxisSelect.on("change", updatePlayerExplorer); 
    yAxisSelect.on("change", updatePlayerExplorer);
}

function updatePlayerExplorer() {
    const chartArea = d3.select("#player-explorer-chart-area").node();
    pe_width = chartArea.clientWidth - pe_margin.left - pe_margin.right;
    pe_height = 500 - pe_margin.top - pe_margin.bottom;
    pe_svg.attr("width", pe_width + pe_margin.left + pe_margin.right).attr("height", 500);
    const selectedTeam = d3.select("#pe-team-filter").property("value");
    const selectedPlayer = d3.select("#pe-player-filter").property("value"), xVal = d3.select("#x-axis-select").property("value"), yVal = d3.select("#y-axis-select").property("value");
    
    let filteredData = pe_averagedData;
    if (selectedTeam !== "All") {
        filteredData = filteredData.filter(d => d.team === selectedTeam);
    }
    if (selectedPlayer !== "All") { 
        filteredData = filteredData.filter(d => d.player === selectedPlayer); 
    }

    const x = d3.scaleLinear().domain([0, d3.max(filteredData, d => d[xVal]) * 1.1 || 10]).range([0, pe_width]);
    const y = d3.scaleLinear().domain([0, d3.max(filteredData, d => d[yVal]) * 1.1 || 10]).range([pe_height, 0]);
    
    pe_xAxis.attr("transform", `translate(0,${pe_height})`).transition().duration(500).call(d3.axisBottom(x));
    pe_yAxis.transition().duration(500).call(d3.axisLeft(y));
    pe_grid.transition().duration(500).call(d3.axisLeft(y).tickSize(-pe_width).tickFormat(""));
    pe_xAxisLabel.attr("x", pe_width / 2).attr("y", pe_height + pe_margin.bottom - 10).text(translations[currentLang][pe_statOptions.find(opt => opt.value === xVal).label]);
    pe_yAxisLabel.attr("x", -pe_height / 2).attr("y", -pe_margin.left + 20).text(translations[currentLang][pe_statOptions.find(opt => opt.value === yVal).label]);

    const defs = pe_svg.selectAll("defs").data([null]).join("defs");

    defs.selectAll(".player-pattern")
        .data(pe_averagedData, d => d.player)
        .join(
            enter => enter.append("pattern")
                .attr("class", "player-pattern")
                .attr("id", d => `avatar-${d.player.replace(/[\.\s']/g, '-')}`)
                .attr("width", 1).attr("height", 1)
                .attr("patternContentUnits", "objectBoundingBox")
                .append("image")
                .attr("xlink:href", d => d.avatarUrl)
                .attr("width", 1).attr("height", 1)
                .attr("preserveAspectRatio", "xMidYMid slice")
        );

    const dataKey = d => d.player;
    const circles = pe_chart.selectAll("circle").data(filteredData, dataKey);
    
    circles.exit().transition().duration(500).attr("r", 0).remove();
    
    circles.enter().append("circle")
        .attr("r", 0)
        .style("fill", d => `url(#avatar-${d.player.replace(/[\.\s']/g, '-')})`)
        .style("stroke", "#003F5C")
        .style("stroke-width", 1.5)
    .merge(circles)
        .on("mouseover", (event, d) => { 
            pe_tooltip.style("opacity", 1); 
            d3.select(event.currentTarget).raise().transition().duration(200).attr("r", 24).style("stroke-width", 3);
        })
        .on("mousemove", (event, d) => { 
            const xVal = d3.select("#x-axis-select").property("value");
            const yVal = d3.select("#y-axis-select").property("value");
            let h = `<strong>${d.player}</strong><br/>`;
            h += `${translations[currentLang][pe_statOptions.find(opt => opt.value === xVal).label]}: ${d[xVal].toFixed(1)}<br/>`;
            h += `${translations[currentLang][pe_statOptions.find(opt => opt.value === yVal).label]}: ${d[yVal].toFixed(1)}`;
            pe_tooltip.html(h).style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 28) + "px"); 
        })
        .on("mouseout", (event, d) => { 
            pe_tooltip.style("opacity", 0); 
            d3.select(event.currentTarget).transition().duration(200).attr("r", 20).style("stroke-width", 1.5);
        })
        .transition().duration(500)
        .attr("cx", d => x(d[xVal]))
        .attr("cy", d => y(d[yVal]))
        .attr("r", 20);
}

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });
    updatePlayerExplorer();
    updateDashboard(document.getElementById('team-filter').value, document.getElementById('team-filter').value === 'All');
}

function main() {
    averagePace = (Object.values(scoutingData).reduce((sum, team) => sum + team.pace, 0) / Object.keys(scoutingData).length).toFixed(1);

    const landscapeFilter = document.getElementById('team-filter');
    const languageSwitcher = document.getElementById('language-switcher');
    
    const allTeamsOption = document.createElement('option');
    allTeamsOption.value = "All";
    allTeamsOption.innerText = translations[currentLang]["all-teams"];
    allTeamsOption.setAttribute('data-translate', 'all-teams');
    landscapeFilter.appendChild(allTeamsOption);

    Object.keys(scoutingData).forEach(teamName => { 
        const option = document.createElement('option'); 
        option.value = teamName; 
        option.innerText = teamName; 
        landscapeFilter.appendChild(option); 
    });
    
    landscapeFilter.value = "All";

    drawEfficiencyChart();
    initializeCharts();
    initializePlayerExplorer();
    updatePlayerExplorer();
    updateDashboard(null, true);
    
    landscapeFilter.addEventListener('change', (e) => { 
        const selectedTeam = e.target.value;
        if (selectedTeam !== "All") {
            updateDashboard(selectedTeam, false);
        } else {
            d3.selectAll(".team-circle").classed("selected", false).transition().duration(200).attr("r", 15);
            updateDashboard(null, true);
        }
    });

    languageSwitcher.addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });
    
    window.addEventListener('resize', () => { 
        drawEfficiencyChart(); 
        updatePlayerExplorer(); 
        if (landscapeFilter.value === 'All') {
            updateDashboard(null, true);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        fetch('json/mock_data/translations.json').then(response => response.json()),
        fetch('json/mock_data/scoutingData.json').then(response => response.json()),
        fetch('json/mock_data/teams.json').then(response => response.json()),
        fetch('json/mock_data/playerData.json').then(response => response.json())
    ]).then(([translationsData, scoutingDataData, teamsData, playerData]) => {
        translations = translationsData;
        scoutingData = scoutingDataData;
        teams = teamsData;
        mockData = playerData;
        main();
    });
});