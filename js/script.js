var draw = function(data) {
	
  var formatTime = d3.timeFormat("%B %Y"),
    formatRate = d3.format(".2%");
  
  data.forEach(function(d) {
    d.date = d3.timeParse("%Y %b")(d.date);
    d.rate = +d.rate;
  });
  
  let chart_title = `Seasonally adjusted claimant rate, ${formatTime(data[0].date)} to ${formatTime(data.slice(-1)[0].date)}`

  data_nest = d3.nest()
      .key(d => d.gender)
      .entries(data);

  var margin = {top:40, right:40, bottom: 40, left:40},
      height = 400,
      width = 800;

  var svg = d3.select("#chart-container")
    .append("svg")
      .attr("height", height + margin.top + margin.bottom)
      .attr("width", width + margin.right + margin.left);

  svg.append("text")
      .attr("class", "title")
      .attr("transform", `translate(${margin.left}, 0)`)
      .attr("dy", "1em")
      .text(chart_title);

  svg.append("text")
      .attr("class", "source")
      .attr("dy", "-0.25em")
      .attr("transform", `translate(${margin.left + width}, ${margin.top + margin.bottom + height})`)
      .text("Source: nisra.gov.uk");

  var chart = svg.append("g")
      .attr("class", "chart")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

  var domain_rate = [0, d3.max(data, d => d.rate)],
      domain_gender = data_nest.keys(),
      domain_date = d3.extent(data, d => d.date);

  var x_scale = d3.scaleTime()
      .domain(domain_date)
      .range([0, width]);

  var y_scale = d3.scaleLinear()
      .domain(domain_rate)
      .range([height, 0])
      .nice();

  var x_axis = d3.axisBottom()
      .scale(x_scale)
      .ticks(d3.timeYear.every(2));

  chart.append("g")
      .attr("class", "xaxis")
      .attr("transform", `translate(0, ${height})`)
      .call(x_axis)
      .call(g => g.select(".domain")
          .remove());

  var y_axis = d3.axisRight()
    .scale(y_scale)
    .tickSize(width)
    .tickFormat(d3.format(".0%"));

  chart.append("g")
      .attr("class", "yaxis")
      .call(y_axis)
      .call(g => g.select(".domain")
          .remove())
      .call(g => g.selectAll(".tick:not(:first-of-type) line")
          .attr("stroke-opacity", 0.5)
          .attr("stroke", "#ccc"))
      .call(g => g.selectAll(".tick text")
          .attr("x", 4)
          .attr("dy", -4));

  var colour_scale = d3.scaleOrdinal()
      .domain(domain_gender)
      .range(['#aaa','#ee5a45','#1e8f89']);

  var rate_line = d3.line()
      .x(d => x_scale(d.date))
      .y(d => y_scale(d.rate));

  chart.selectAll(".line")
      .data(data_nest)
      .enter()
    .append("path")
      .attr("class", "line")
      .attr("stroke-width", 2)
      .attr("stroke", d => colour_scale(d.key))
      .attr("d", function(d) { d.values.line = this; return rate_line(d.values); });

  var voronoi = d3.voronoi()
            .x(function(d) { return x_scale(d.date); })
            .y(function(d) { return y_scale(d.rate); })
            .extent([[0, 0], [width, height]]);

  var focus = chart.append("g")
      .attr("transform", "translate(-100, -100)")
      .attr("class", "focus");

  focus.append("circle")
      .attr("r", 4);

  var tooltip = d3.select("#chart-container")
    .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip");

  var voronoiGroup = chart.append("g")
      .attr("class", "voronoi");

  voronoiGroup.selectAll("path")
      .data(voronoi.polygons(d3.merge(data_nest.map(d => d.values))))
      .enter()
    .append("path")
      .attr("d", d => d ? "M" + d.join("L") + "Z" : null)
      .on("mouseover", mouseover)
      .on("mouseleave", mouseleave);

  function mouseover(d) {
    var l = data_nest.filter(g => g.key === d.data.gender);
    d3.select(l[0].values.line)
      .classed("line--hover", true);

    focus.attr("transform",
               `translate(${x_scale(d.data.date)}, ${y_scale(d.data.rate)})`)
        .attr("fill", colour_scale(d.data.gender));

    tooltip.style("opacity", 0.8)
        .style("left", (x_scale(d.data.date) + 60) + "px")
        .style("top", (y_scale(d.data.rate) + 25) + "px")
        .html(formatTime(d.data.date) + "<br>"
            + d.data.gender + ": " + formatRate(d.data.rate));
  }

  function mouseleave(d) {
    var l = data_nest.filter(g => g.key === d.data.gender);
    d3.select(l[0].values.line)
      .classed("line--hover", false);

    focus.attr("transform", "translate(-100, -100)");
    tooltip.style("opacity", 0);
  }

  var legend = chart.append("g")
      .attr("transform",
            `translate(${width - 40}, -10)`);

  data_nest.reverse();

  legend.selectAll("text")
      .data(data_nest)
      .enter()
    .append("text")
      .attr("class", "legend")
      .attr("transform", function(d, i) {
      return `translate(${-(i * 80)}, 0)`
    })
    .text(d => d.key);

  var y0 = -4,
        x0 = -10,
        xl = 25;

  legend.selectAll("line")
        .data(data_nest)
        .enter()
      .append("line")
        .attr("class", "linelegend")
        .attr("stroke", d => colour_scale(d.key))
        .attr("stroke-width", "3px")
        .attr("y1", y0)
        .attr("y2", y0)
        .attr("x1", function(d, i) { return x0 - (i * 80); })
        .attr("x2", function(d, i) { return x0 - (i * 80) - xl; });
}

d3.json("data/claimant_count.json").then(draw);
