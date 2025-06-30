const teams = [
    { name: "Warriors", offense: 120.2, defense: 113.8, logoUrl: "https://storage.googleapis.com/p-xc-m/event/416/squads/cdd5dbcf6e4e40d3c6fa1dc556ec4b78e4cabfbb4dfddd80a05990bdaea9b42b" }, // Red
    { name: "Clippers", offense: 112.3, defense: 103.5, logoUrl: "https://storage.googleapis.com/p-xc-m/event/416/squads/9e78de903e7fdb8b2458011575cdd087b600fcac61ac94dbca3642f7b4f7f8e9" }, // Blue
    { name: "Thunder", offense: 111.1, defense: 99.2,  logoUrl: "https://storage.googleapis.com/p-xc-m/event/416/squads/c2be655be99db096194132a6f3f509afcc98e3a38f48a3295ccd0002cf2fa6c9" }, // Firebrick Red
    { name: "Celtics", offense: 108.9, defense: 98.5, logoUrl: "https://storage.googleapis.com/p-xc-m/event/417/squads/d8c35320ae26ede7e2650a0796fff6d6953f9ade0248f611c83026ffc279a25d" }, // Royal Blue
    { name: "Lakers", offense: 99.2, defense: 103.1, logoUrl: "https://storage.googleapis.com/p-xc-m/event/417/squads/66c8691d2debaaeabd22fe90dd73ca5da9033778ad0e98048e366118bae57ba2"}  // Crimson Red
];

function drawChart() {
    // Clear existing chart
    d3.select("#chart").html("");

    // Set up dimensions and margins
    const containerWidth = document.getElementById('chart').offsetWidth;
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = width * 0.75; // Maintain aspect ratio

    // Create SVG
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales
    const xScale = d3.scaleLinear()
        .domain([95, 115])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([95, 125])
        .range([height, 0]);

    // Average lines
    const avgOffense = d3.mean(teams, d => d.offense);
    const avgDefense = d3.mean(teams, d => d.defense);

    // Add grid lines
    const xGridLines = d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat("");

    const yGridLines = d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat("");

    g.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(xGridLines)
        .selectAll("line")
        .attr("class", "grid-line");

    g.append("g")
        .attr("class", "grid")
        .call(yGridLines)
        .selectAll("line")
        .attr("class", "grid-line");

    // Add average lines
    g.append("line")
        .attr("class", "average-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", yScale(avgOffense))
        .attr("y2", yScale(avgOffense));

    g.append("line")
        .attr("class", "average-line")
        .attr("x1", xScale(avgDefense))
        .attr("x2", xScale(avgDefense))
        .attr("y1", 0)
        .attr("y2", height);

    // Add axes
    g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale));

    // Add axis labels
    g.append("text")
        .attr("class", "axis-label")
        .attr("transform", `translate(${width/2}, ${height + 40})`)
        .style("text-anchor", "middle")
        .text("Defensive Rating");

    g.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", -height/2)
        .style("text-anchor", "middle")
        .text("Offensive Rating");

    // Add quadrant labels
    g.append("text")
        .attr("class", "quadrant-label")
        .attr("x", 10)
        .attr("y", 20)
        .text("Good Offense, Bad Defense");

    g.append("text")
        .attr("class", "quadrant-label")
        .attr("x", width - 10)
        .attr("y", 20)
        .attr("text-anchor", "end")
        .text("Good Offense, Good Defense");

    g.append("text")
        .attr("class", "quadrant-label")
        .attr("x", 10)
        .attr("y", height - 10)
        .text("Bad Offense, Bad Defense");

    g.append("text")
        .attr("class", "quadrant-label")
        .attr("x", width - 10)
        .attr("y", height - 10)
        .attr("text-anchor", "end")
        .text("Bad Offense, Good Defense");

    // Create tooltip
    const tooltip = d3.select("#tooltip");

    // Add defs for image patterns
    const defs = g.append("defs");

    defs.selectAll(".team-pattern")
        .data(teams)
        .enter()
        .append("pattern")
        .attr("id", (d, i) => `logo-pattern-${i}`)
        .attr("width", 1)
        .attr("height", 1)
        .attr("patternContentUnits", "objectBoundingBox")
        .append("image")
        .attr("xlink:href", d => d.logoUrl)
        .attr("width", 1)
        .attr("height", 1)
        .attr("preserveAspectRatio", "xMidYMid slice");

    // Add team circles with logos
    g.selectAll(".team-circle")
        .data(teams)
        .enter()
        .append("circle")
        .attr("class", "team-circle")
        .attr("cx", d => xScale(d.defense))
        .attr("cy", d => yScale(d.offense))
        .attr("r", containerWidth > 480 ? 15 : 10)
        .attr("fill", (d, i) => `url(#logo-pattern-${i})`)
        .attr("stroke", "#000")
        .attr("stroke-width", 2)
        .on("mouseover", function(event, d) {
            d3.select(this).transition().duration(200).attr("r", containerWidth > 480 ? 18 : 12);
            tooltip.style("opacity", 1)
                .html(`<strong>${d.name}</strong><br/>Offensive: ${d.offense}<br/>Defensive: ${d.defense}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function(event, d) {
            d3.select(this).transition().duration(200).attr("r", containerWidth > 480 ? 15 : 10);
            tooltip.style("opacity", 0);
        });

    // Add team name labels
    g.selectAll(".team-label")
        .data(teams)
        .enter()
        .append("text")
        .attr("class", "team-label")
        .attr("x", d => xScale(d.defense))
        .attr("y", d => yScale(d.offense) + (containerWidth > 480 ? 25 : 18))
        .attr("text-anchor", "middle")
        .style("font-size", containerWidth > 480 ? "11px" : "9px")
        .style("font-weight", "600")
        .style("fill", "#333")
        .text(d => d.name);
}

// Initial draw
drawChart();

// Redraw on window resize
window.addEventListener('resize', drawChart);
