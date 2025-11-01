// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(dataset) {
    dataset.forEach(function(item) {
        item.Likes = +item.Likes;
    });

    const margins = { top: 40, right: 30, bottom: 60, left: 70 },
          w  = 600 - margins.left - margins.right,
          h = 400 - margins.top - margins.bottom;

    const chart = d3.select("#boxplot")
      .append("svg")
      .attr("width", w + margins.left + margins.right)
      .attr("height", h + margins.top + margins.bottom)
      .append("g")
      .attr("transform", `translate(${margins.left},${margins.top})`);

    const groups = [...new Set(dataset.map(d => d.AgeGroup))];
    const xAxisScale = d3.scaleBand()
        .domain(groups)
        .range([0, w])
        .padding(0.4);
    
    const yAxisScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d.Likes)])
        .range([h, 0]);

    chart.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(xAxisScale));

    chart.append("g")
      .call(d3.axisLeft(yAxisScale));

    chart.append("text")
      .attr("x", w / 2)
      .attr("y", h + 45)
      .attr("text-anchor", "middle")
      .text("Age Group");

    chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text("Number of Likes");

    const summarize = function(groupValues) {
      const values = groupValues.map(d => d.Likes).sort(d3.ascending);
      return {
        min: d3.min(values),
        q1: d3.quantile(values, 0.25),
        median: d3.quantile(values, 0.5),
        q3: d3.quantile(values, 0.75),
        max: d3.max(values)
      };
    };

    const statsByGroup = d3.rollup(dataset, summarize, d => d.AgeGroup);

    statsByGroup.forEach((stats, group) => {
        const x = xAxisScale(group);
        const boxWidth = xAxisScale.bandwidth();

        chart.append("line")
          .attr("x1", x + boxWidth / 2)
          .attr("x2", x + boxWidth / 2)
          .attr("y1", yAxisScale(stats.min))
          .attr("y2", yAxisScale(stats.max))
          .attr("stroke", "#333");

        chart.append("rect")
          .attr("x", x)
          .attr("y", yAxisScale(stats.q3))
          .attr("width", boxWidth)
          .attr("height", yAxisScale(stats.q1) - yAxisScale(stats.q3))
          .attr("stroke", "#333")
          .attr("fill", "#f2a9a9");

        chart.append("line")
          .attr("x1", x)
          .attr("x2", x + boxWidth)
          .attr("y1", yAxisScale(stats.median))
          .attr("y2", yAxisScale(stats.median))
          .attr("stroke", "#333")
          .attr("stroke-width", 2);
    });
});

// Second chart (bar plot)
d3.csv("socialMedia.csv").then(function(dataset) {
    dataset.forEach(d => d.Likes = +d.Likes);

    const groupedData = d3.rollup(
      dataset,
      v => d3.mean(v, d => d.Likes),
      d => d.Platform,
      d => d.PostType
    );

    const arrangedData = [];
    groupedData.forEach((inner, platform) => {
      inner.forEach((avg, type) => {
        arrangedData.push({
          Platform: platform,
          PostType: type,
          AvgLikes: +avg.toFixed(2)
        });
      });
    });

    const margins = { top: 40, right: 160, bottom: 70, left: 70 },
          w = 700 - margins.left - margins.right,
          h = 400 - margins.top - margins.bottom;

    const chart = d3.select("#barplot")
      .append("svg")
        .attr("width", w + margins.left + margins.right)
        .attr("height", h + margins.top + margins.bottom)
      .append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);

    const platforms = [...new Set(arrangedData.map(d => d.Platform))];
    const postTypes = [...new Set(arrangedData.map(d => d.PostType))];

    const xMain = d3.scaleBand()
      .domain(platforms)
      .range([0, w])
      .paddingInner(0.2);

    const xSub = d3.scaleBand()
      .domain(postTypes)
      .range([0, xMain.bandwidth()])
      .padding(0.05);

    const yAxisScale = d3.scaleLinear()
      .domain([0, d3.max(arrangedData, d => d.AvgLikes)])
      .nice()
      .range([h, 0]);

    const colors = d3.scaleOrdinal()
      .domain(postTypes)
      .range(["#9370DB", "#FFB347", "#77DD77"]);    

    chart.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(xMain));

    chart.append("g")
      .call(d3.axisLeft(yAxisScale));

    chart.append("text")
      .attr("x", w / 2)
      .attr("y", h + 50)
      .attr("text-anchor", "middle")
      .text("Platform");

    chart.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -h / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text("Average Number of Likes");

    const bars = chart.selectAll(".platform")
      .data(d3.groups(arrangedData, d => d.Platform))
      .enter()
      .append("g")
      .attr("class", "platform")
      .attr("transform", d => `translate(${xMain(d[0])},0)`);

    bars.selectAll("rect")
      .data(d => d[1])
      .enter()
      .append("rect")
        .attr("x", d => xSub(d.PostType))
        .attr("y", d => yAxisScale(d.AvgLikes))
        .attr("width", xSub.bandwidth())
        .attr("height", d => h - yAxisScale(d.AvgLikes))
        .attr("fill", d => colors(d.PostType));

    const legend = chart.append("g")
      .attr("transform", `translate(${w + 40}, ${40})`);

    const legendItems = [...new Set(arrangedData.map(d => d.PostType))];
    legendItems.forEach((type, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 25)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", colors(type));
      
      legend.append("text")
          .attr("x", 25)
          .attr("y", i * 25 + 13)
          .text(type)
          .attr("alignment-baseline", "middle");
  });
});

// Line plot
d3.csv("socialMedia.csv").then(function(dataset) {
    dataset.forEach(d => d.Likes = +d.Likes);

    const byDate = d3.rollup(
        dataset,
        v => d3.mean(v, d => d.Likes),
        d => d.Date
    );

    const arranged = Array.from(byDate, ([Date, AvgLikes]) => ({ Date, AvgLikes }));
    arranged.sort((a, b) => d3.ascending(a.Date, b.Date));

    const margins = { top: 40, right: 60, bottom: 70, left: 70 },
          w = 700 - margins.left - margins.right,
          h = 400 - margins.top - margins.bottom;

    const chart = d3.select("#lineplot")
      .append("svg")
        .attr("width", w + margins.left + margins.right)
        .attr("height", h + margins.top + margins.bottom)
      .append("g")
        .attr("transform", `translate(${margins.left},${margins.top})`);

    const x = d3.scaleBand()
        .domain(arranged.map(d => d.Date))
        .range([0, w])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(arranged, d => d.AvgLikes)])
        .nice()
        .range([h, 0]);

    chart.append("g")
        .attr("transform", `translate(0,${h})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
          .style("text-anchor", "end")
          .attr("transform", "rotate(-25)");

    chart.append("g")
        .call(d3.axisLeft(y));

    chart.append("text")
        .attr("x", w / 2)
        .attr("y", h + 65)
        .attr("text-anchor", "middle")
        .text("Date");

    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -h / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Average Number of Likes");

    const connector = d3.line()
        .x(d => x(d.Date) + x.bandwidth() / 2)
        .y(d => y(d.AvgLikes))
        .curve(d3.curveNatural);

    chart.append("path")
        .datum(arranged)
        .attr("fill", "none")
        .attr("stroke", "#FF6347")
        .attr("stroke-width", 2)
        .attr("d", connector);

    chart.selectAll(".dot")
        .data(arranged)
        .enter()
        .append("circle")
          .attr("cx", d => x(d.Date) + x.bandwidth() / 2)
          .attr("cy", d => y(d.AvgLikes))
          .attr("r", 4)
          .attr("fill", "#FF6347");
});
