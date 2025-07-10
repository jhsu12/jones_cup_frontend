
function drawShotChart(data, containerSelector) {
    const svg = d3.select(containerSelector);
    svg.selectAll("*").remove(); // Clear previous chart

    const width = 500;
    const height = 470;

    const allValuesZero = Object.values(data).every(value => value === 0);
    let fillColor;

    if (allValuesZero) {
        fillColor = "white";
    } else {
        const percentages = Object.values(data);
        const colorScale = d3.scaleLinear()
            .domain([d3.min(percentages), d3.max(percentages)])
            .range(["#87CEEB", "#1E3A8A"]);
        fillColor = (value) => colorScale(value);
    }

    const court = {
        width: width,
        height: height,
        paintWidth: 160,
        paintHeight: 190,
        threePointRadius: 237.5,
        threePointSideY: height - 140,
        cornerThreeX: 30,
        basketY: height - 52.5,
        basketRadius: 7.5,
        ftCircleRadius: 60
    };
    court.paintX = (court.width - court.paintWidth) / 2;
    court.paintY = court.height - court.paintHeight;
    court.centerX = court.width / 2;

    const threePointAreaPath = `
        M ${court.cornerThreeX}, ${court.height}
        L ${court.cornerThreeX}, ${court.threePointSideY}
        A ${court.threePointRadius} ${court.threePointRadius} 0 0 1 ${court.width - court.cornerThreeX} ${court.threePointSideY}
        L ${court.width - court.cornerThreeX}, ${court.height}
        Z
    `;

    // Draw zones from largest to smallest to ensure correct layering
    // Full court background for 3-point area
    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", allValuesZero ? fillColor : fillColor(data["3PAttempt"]))
        .attr("class", "shot-chart-zone-area");

    // Mid-Range Area (using the original threePointAreaPath as its boundary)
    svg.append("path")
        .attr("d", threePointAreaPath)
        .attr("fill", allValuesZero ? fillColor : fillColor(data.MidRangeAttempt))
        .attr("class", "shot-chart-zone-area");

    // Paint Area
    svg.append("rect")
        .attr("x", court.paintX)
        .attr("y", court.paintY)
        .attr("width", court.paintWidth)
        .attr("height", court.paintHeight)
        .attr("fill", allValuesZero ? fillColor : fillColor(data.PaintAttempt))
        .attr("class", "shot-chart-zone-area");

    svg.append("path")
        .attr("d", threePointAreaPath)
        .attr("class", "shot-chart-court-line");

    svg.append("rect")
        .attr("x", court.paintX)
        .attr("y", court.paintY)
        .attr("width", court.paintWidth)
        .attr("height", court.paintHeight)
        .attr("class", "shot-chart-court-line");

    svg.append("circle")
       .attr("cx", court.centerX)
       .attr("cy", court.paintY)
       .attr("r", court.ftCircleRadius)
       .attr("class", "shot-chart-court-line");

     svg.append("line")
        .attr("x1", court.centerX - 30)
        .attr("y1", court.basketY)
        .attr("x2", court.centerX + 30)
        .attr("y2", court.basketY)
        .style("stroke", "#1a1a1a")
        .style("stroke-width", "3");

    svg.append("circle")
        .attr("cx", court.centerX)
        .attr("cy", court.basketY)
        .attr("r", court.basketRadius)
        .attr("class", "shot-chart-court-line")
        .style("fill", "#f5f5f5");

    svg.append("text")
        .attr("x", court.centerX)
        .attr("y", 100)
        .attr("class", "shot-chart-zone-label")
        .text("3-Point");
    svg.append("text")
        .attr("x", court.centerX)
        .attr("y", 125)
        .attr("class", "shot-chart-percentage-text")
        .text(`${data["3PAttempt"]}%`);

    svg.append("text")
        .attr("x", court.centerX)
        .attr("y", court.height - 220)
        .attr("class", "shot-chart-zone-label")
        .text("Mid-Range");
    svg.append("text")
        .attr("x", court.centerX)
        .attr("y", court.height - 195)
        .attr("class", "shot-chart-percentage-text")
        .text(`${data.MidRangeAttempt}%`);

    svg.append("text")
        .attr("x", court.centerX)
        .attr("y", court.height - 95)
        .attr("class", "shot-chart-zone-label")
        .text("Paint");
    svg.append("text")
        .attr("x", court.centerX)
        .attr("y", court.height - 70)
        .attr("class", "shot-chart-percentage-text")
        .text(`${data.PaintAttempt}%`);
}
