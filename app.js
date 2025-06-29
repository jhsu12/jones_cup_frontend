// --- FAKE DATA (In a real app, this would be loaded from a JSON file or API) ---
const MOCK_DATA = {
    teams: [
        { teamId: 'sharks', teamName: 'Team Shark', eFG: 0.525, TOV: 0.14, OREB: 0.28, FTRate: 0.35 },
        { teamId: 'vipers', teamName: 'Team Vipers', eFG: 0.541, TOV: 0.155, OREB: 0.335, FTRate: 0.29 },
        { teamId: 'eagles', teamName: 'Team Eagles', eFG: 0.490, TOV: 0.12, OREB: 0.25, FTRate: 0.40 },
    ],
    players: [
        { playerId: 'viper1', teamId: 'vipers', name: 'James Lee', pos: 'Guard', usg_pct: 0.312, ts_pct: 0.605, efg: 0.580, shot_types: [{type: '3PT Jumpshot', freq: 0.55, efg: 0.61}, {type: '2PT Jumpshot', freq: 0.20, efg: 0.38}, {type: 'At the Rim', freq: 0.25, efg: 0.72}], scoring_creation: {assisted: 0.40, unassisted: 0.60} },
        { playerId: 'viper2', teamId: 'vipers', name: 'Ken Davis', pos: 'Forward', usg_pct: 0.18, ts_pct: 0.59, efg: 0.575, shot_types: [{type: '3PT Jumpshot', freq: 0.30, efg: 0.59}, {type: '2PT Jumpshot', freq: 0.30, efg: 0.45}, {type: 'At the Rim', freq: 0.40, efg: 0.68}], scoring_creation: {assisted: 0.85, unassisted: 0.15} },
        { playerId: 'viper3', teamId: 'vipers', name: 'Mike Chan', pos: 'Guard', usg_pct: 0.25, ts_pct: 0.48, efg: 0.450, shot_types: [{type: '3PT Jumpshot', freq: 0.30, efg: 0.35}, {type: '2PT Jumpshot', freq: 0.50, efg: 0.40}, {type: 'At the Rim', freq: 0.20, efg: 0.55}], scoring_creation: {assisted: 0.50, unassisted: 0.50} },
        { playerId: 'shark1', teamId: 'sharks', name: 'David Lin', pos: 'Guard', usg_pct: 0.28, ts_pct: 0.57, efg: 0.55, shot_types: [], scoring_creation: {}},
        { playerId: 'eagle1', teamId: 'eagles', name: 'John Doe', pos: 'Center', usg_pct: 0.22, ts_pct: 0.62, efg: 0.60, shot_types: [], scoring_creation: {}},
    ]
};

document.addEventListener('DOMContentLoaded', () => {

    const tooltip = d3.select("#tooltip");

    // --- SETUP FILTERS & TABS ---
    const team1Select = d3.select("#team1-select");
    const team2Select = d3.select("#team2-select");
    const playerSelect = d3.select("#player-select");

    MOCK_DATA.teams.forEach(team => {
        team1Select.append('option').attr('value', team.teamId).text(team.teamName);
        team2Select.append('option').attr('value', team.teamId).text(team.teamName);
    });
    
    team1Select.property('value', 'sharks');
    team2Select.property('value', 'vipers');

    function updatePlayerFilter(teamId) {
        const players = MOCK_DATA.players.filter(p => p.teamId === teamId);
        playerSelect.html(''); // Clear previous options
        playerSelect.append('option').attr('value', 'all').text('All Players');
        players.forEach(player => {
            playerSelect.append('option').attr('value', player.playerId).text(player.name);
        });
    }

    // Tab switching logic
    d3.selectAll('.tab-button').on('click', function() {
        d3.selectAll('.tab-button').classed('active', false);
        d3.selectAll('.chart-container').classed('active', false);
        
        d3.select(this).classed('active', true);
        d3.select(`#${this.dataset.tab}`).classed('active', true);
    });


    // --- D3 CHART IMPLEMENTATIONS ---

    // Visualization 1: Team Identity (Four Factors Bar Chart)
    function drawTeamIdentityChart(team1Id, team2Id) {
        const container = d3.select("#team-identity-chart");
        container.html(''); // Clear previous chart
        const team1Data = MOCK_DATA.teams.find(t => t.teamId === team1Id);
        const team2Data = MOCK_DATA.teams.find(t => t.teamId === team2Id);

        const factors = ['eFG', 'TOV', 'OREB', 'FTRate'];
        const factorLabels = {eFG: 'Effective FG%', TOV: 'Turnover %', OREB: 'Offensive Reb %', FTRate: 'Free Throw Rate'};

        const margin = {top: 20, right: 30, bottom: 40, left: 150};
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const y = d3.scaleBand()
            .domain(factors)
            .range([0, height])
            .padding(0.4);

        const x = d3.scaleLinear()
            .domain([0, 0.6]) // Max value for factors
            .range([0, width]);

        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d => factorLabels[d]))
            .selectAll("text").style("fill", "#e1e1e1").style("font-size", "14px");

        // Team 1 Bars
        svg.selectAll(".bar-team1")
            .data(factors)
            .join("rect")
            .attr("class", "bar-team1")
            .attr("y", d => y(d))
            .attr("height", y.bandwidth() / 2)
            .attr("fill", "var(--team1-color)")
            .attr("width", 0)
            .transition().duration(1000)
            .attr("width", d => x(team1Data[d]));

        // Team 2 Bars
        svg.selectAll(".bar-team2")
            .data(factors)
            .join("rect")
            .attr("class", "bar-team2")
            .attr("y", d => y(d) + y.bandwidth() / 2)
            .attr("height", y.bandwidth() / 2)
            .attr("fill", "var(--team2-color)")
            .attr("width", 0)
            .transition().duration(1000)
            .attr("width", d => x(team2Data[d]));
    }
    
    // Visualization 2: Offensive Roles (Quadrant Chart)
    function drawQuadrantChart(teamId) {
        const container = d3.select("#quadrant-chart");
        container.html('');
        const teamData = MOCK_DATA.teams.find(t => t.teamId === teamId);
        d3.select("#quadrant-chart-title").text(`Offensive Roles: ${teamData.teamName}`);
        
        const players = MOCK_DATA.players.filter(p => p.teamId === teamId);
        
        const avg_usg = d3.mean(players, d => d.usg_pct);
        const avg_ts = d3.mean(players, d => d.ts_pct);
        
        const margin = {top: 20, right: 20, bottom: 50, left: 50};
        const width = 800 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        const svg = container.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
            
        const x = d3.scaleLinear()
            .domain([d3.min(players, d => d.usg_pct) - 0.05, d3.max(players, d => d.usg_pct) + 0.05])
            .range([0, width]);
        
        const y = d3.scaleLinear()
            .domain([d3.min(players, d => d.ts_pct) - 0.05, d3.max(players, d => d.ts_pct) + 0.05])
            .range([height, 0]);

        // Axes
        svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x).tickFormat(d3.format(".0%")));
        svg.append("g").call(d3.axisLeft(y).tickFormat(d3.format(".0%")));
        
        // Quadrant lines
        svg.append("line").attr("class", "quadrant-line").attr("x1", x(avg_usg)).attr("x2", x(avg_usg)).attr("y1", 0).attr("y2", height);
        svg.append("line").attr("class", "quadrant-line").attr("y1", y(avg_ts)).attr("y2", y(avg_ts)).attr("x1", 0).attr("x2", width);

        // Player dots
        svg.selectAll("circle")
            .data(players, d => d.playerId)
            .join(
                enter => enter.append("circle")
                    .attr("cx", d => x(d.usg_pct))
                    .attr("cy", d => y(d.ts_pct))
                    .attr("r", 0)
                    .attr("fill", "var(--team2-color)")
                    .attr("stroke", "white")
                    .style("cursor", "pointer")
                    .call(enter => enter.transition().duration(1000).attr("r", 8)),
                update => update.transition().duration(1000)
                    .attr("cx", d => x(d.usg_pct))
                    .attr("cy", d => y(d.ts_pct)),
                exit => exit.transition().duration(500).attr("r", 0).remove()
            )
            .on("mouseover", function(event, d) {
                d3.select(this).transition().duration(200).attr('r', 12);
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.name}</strong><br>USG%: ${d3.format(".1%")(d.usg_pct)}<br>TS%: ${d3.format(".1%")(d.ts_pct)}`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).transition().duration(200).attr('r', 8);
                tooltip.style("opacity", 0);
            })
            .on("click", function(event, d) {
                playerSelect.property('value', d.playerId);
                updateDashboard();
                // Switch to player tab
                d3.select(".tab-button[data-tab='player-dna']").dispatch('click');
            });
    }

    // Visualization 3: Player DNA
    function drawPlayerDnaChart(playerId) {
        const container = d3.select("#player-dna-chart");
        container.html('');
        const player = MOCK_DATA.players.find(p => p.playerId === playerId);
        if (!player) {
            container.append("p").text("Select a player to see their DNA.").style("color", "#8c8f94");
            d3.select("#player-dna-chart-title").text("Player DNA");
            return;
        }

        d3.select("#player-dna-chart-title").text(`Scoring DNA: ${player.name}`);

        // Placeholder for the new charts
        const shotTypeContainer = container.append('div');
        shotTypeContainer.append('h3').text('Shot Type Breakdown');
        
        // This is a simplified bar chart for shot types
        const shotTypeData = player.shot_types;
        const margin = {top: 20, right: 30, bottom: 40, left: 120};
        const width = 700 - margin.left - margin.right;
        const height = 200 - margin.top - margin.bottom;

        const svg = shotTypeContainer.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
            
        const y = d3.scaleBand().range([0, height]).domain(shotTypeData.map(d => d.type)).padding(0.1);
        const x = d3.scaleLinear().range([0, width]).domain([0, d3.max(shotTypeData, d => d.freq)]);
        const color = d3.scaleLinear().domain([0.35, 0.5, 0.65]).range(["#ff7a00", "#f9f871", "#00a9ff"]);
        
        svg.append("g").call(d3.axisLeft(y));
        
        svg.selectAll(".bar")
            .data(shotTypeData)
            .join("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.type))
            .attr("height", y.bandwidth())
            .attr("fill", d => color(d.efg))
            .attr("width", 0)
            .transition().duration(1000)
            .attr("width", d => x(d.freq));
    }


    // --- INITIAL DRAW & EVENT LISTENERS ---
    function updateDashboard() {
        const team1Id = team1Select.property('value');
        const team2Id = team2Select.property('value');
        const playerId = playerSelect.property('value');

        // Update player dropdown based on opponent team
        updatePlayerFilter(team2Id);
        playerSelect.property('value', playerId); // try to keep player selected if they still exist

        drawTeamIdentityChart(team1Id, team2Id);
        drawQuadrantChart(team2Id);
        drawPlayerDnaChart(playerSelect.property('value'));
    }

    team1Select.on('change', updateDashboard);
    team2Select.on('change', updateDashboard);
    playerSelect.on('change', updateDashboard);

    updateDashboard(); // Initial call
});