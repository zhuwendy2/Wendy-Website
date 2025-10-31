// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 40, right: 30, bottom: 60, left: 70 },
          width  = 600 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#boxplot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    // You can use the range 0 to 1000 for the number of Likes, or if you want, you can use
    // d3.min(data, d => d.Likes) to achieve the min value and 
    // d3.max(data, d => d.Likes) to achieve the max value
    // For the domain of the xscale, you can list all three age groups or use
    // [...new Set(data.map(d => d.AgeGroup))] to achieve a unique list of the age group
    const ageGroups = [...new Set(data.map(d => d.AgeGroup))];
    const xScale = d3.scaleBand()
        .domain(ageGroups)
        .range([0, width])
        .padding(0.4);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Likes)])
        .range([height, 0]);

    // Add scales     
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 45)
      .attr("text-anchor", "middle")
      .text("Age Group");

    // Add y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text("Number of Likes");

    const rollupFunction = function(groupData) {
      const values = groupData.map(d => d.Likes).sort(d3.ascending);
      const min = d3.min(values); 
      const q1 = d3.quantile(values, 0.25);
      const median = d3.quantile(values, 0.5);
      const q3 = d3.quantile(values, 0.75);
      const max = d3.max(values);
      return { min, q1, median, q3, max };
    };

    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.AgeGroup);

    quantilesByGroups.forEach((q, AgeGroup) => {
        const x = xScale(AgeGroup);
        const boxWidth = xScale.bandwidth();

        // Draw vertical lines
        svg.append("line")
          .attr("x1", x + boxWidth / 2)
          .attr("x2", x + boxWidth / 2)
          .attr("y1", yScale(q.min))
          .attr("y2", yScale(q.max))
          .attr("stroke", "black");

        // Draw box
        svg.append("rect")
          .attr("x", x)
          .attr("y", yScale(q.q3))
          .attr("width", boxWidth)
          .attr("height", yScale(q.q1) - yScale(q.q3))
          .attr("stroke", "black")
          .attr("fill", "#add8e6");

        // Draw median line
        svg.append("line")
          .attr("x1", x)
          .attr("x2", x + boxWidth)
          .attr("y1", yScale(q.median))
          .attr("y2", yScale(q.median))
          .attr("stroke", "black")
          .attr("stroke-width", 2);
    });
});

// Prepare you data and load the data again. 
// This data should contains three columns, platform, post type and average number of likes. 
d3.csv("socialMedia.csv").then(function(data) {
    // Convert string values to numbers
    data.forEach(d => d.Likes = +d.Likes);

    // Group by Platform and PostType and compute the average Likes
    const grouped = d3.rollup(
      data,
      v => d3.mean(v, d => d.Likes),
      d => d.Platform,
      d => d.PostType
    );

    // Convert rollup map to an array
    const processedData = [];
    grouped.forEach((postTypeMap, platform) => {
      postTypeMap.forEach((avgLikes, postType) => {
        processedData.push({
          Platform: platform,
          PostType: postType,
          AvgLikes: +avgLikes.toFixed(2)
        });
      });
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 40, right: 160, bottom: 70, left: 70 },
          width  = 700 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#barplot")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define four scales
    // Scale x0 is for the platform, which divide the whole scale into 4 parts
    // Scale x1 is for the post type, which divide each bandwidth of the previous x0 scale into three part for each post type
    // Recommend to add more spaces for the y scale for the legend
    // Also need a color scale for the post type
    const platforms = [...new Set(processedData.map(d => d.Platform))];
    const postTypes = [...new Set(processedData.map(d => d.PostType))];

    const x0 = d3.scaleBand()
      .domain(platforms)
      .range([0, width])
      .paddingInner(0.2);

    const x1 = d3.scaleBand()
      .domain(postTypes)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.AvgLikes)])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(postTypes)
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);    
         
    // Add scales x0 and y     
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    svg.append("g")
      .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .attr("text-anchor", "middle")
      .text("Platform");

    // Add y-axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text("Average Number of Likes");

  // Group container for bars
  const barGroups = svg.selectAll(".platform")
    .data(d3.groups(processedData, d => d.Platform))
    .enter()
    .append("g")
    .attr("class", "platform")
    .attr("transform", d => `translate(${x0(d[0])},0)`); // d[0] = Platform name

  // Draw bars
  barGroups.selectAll("rect")
    .data(d => d[1])
    .enter()
    .append("rect")
      .attr("x", d => x1(d.PostType))
      .attr("y", d => y(d.AvgLikes))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.AvgLikes))
      .attr("fill", d => color(d.PostType));

    // Add the legend to the right of the chart
    const legend = svg.append("g")
      .attr("transform", `translate(${width + 40}, ${40})`);


    const types = [...new Set(processedData.map(d => d.PostType))];
 
    types.forEach((type, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 25)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", color(type));
      
       // Alread have the text information for the legend. 
      // Now add a small square/rect bar next to the text with different color.
      legend.append("text")
          .attr("x", 25)
          .attr("y", i * 25 + 13)
          .text(type)
          .attr("alignment-baseline", "middle");
  });
});

// Prepare your data and load the data again.
// This data should contain two columns: Date (3/1–3/7) and average number of Likes.
d3.csv("socialMedia.csv").then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Group by Date and compute average Likes
    const grouped = d3.rollup(
        data,
        v => d3.mean(v, d => d.Likes),
        d => d.Date
    );

    // Convert rollup map to array
    const processedData = Array.from(grouped, ([Date, AvgLikes]) => ({ Date, AvgLikes }));

    // Sort by date
    processedData.sort((a, b) => d3.ascending(a.Date, b.Date));

    // Define dimensions and margins for the SVG
    const margin = { top: 40, right: 60, bottom: 70, left: 70 },
          width  = 700 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#lineplot")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes  
    const x = d3.scaleBand()
        .domain(processedData.map(d => d.Date))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.AvgLikes)])
        .nice()
        .range([height, 0]);

    // Draw axes, you can rotate the text in the x-axis here
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
          .style("text-anchor", "end")
          .attr("transform", "rotate(-25)");

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 65) // move lower
        .attr("text-anchor", "middle")
        .text("Date");


    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Average Number of Likes");

    // Make the line and path. Remember to use curveNatural.
    const line = d3.line()
        .x(d => x(d.Date) + x.bandwidth() / 2)
        .y(d => y(d.AvgLikes))
        .curve(d3.curveNatural);

    svg.append("path")
        .datum(processedData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Add dots at each data point
    svg.selectAll(".dot")
        .data(processedData)
        .enter()
        .append("circle")
          .attr("cx", d => x(d.Date) + x.bandwidth() / 2)
          .attr("cy", d => y(d.AvgLikes))
          .attr("r", 4)
          .attr("fill", "steelblue");
});

});

