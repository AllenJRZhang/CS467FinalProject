  const urls = {
    // source: https://observablehq.com/@mbostock/u-s-airports-voronoi
    // source: https://github.com/topojson/us-atlas
    map: "/states-albers-10m.json",
  };
  
  const symptoms = {
    "symptom1": {
      "chills": 7,
      "arthralgia": 4,
      "other":  89
    },
    "symptom2": {
      "null": 18,
      "headache": 5,
      "other":  77
    },
    "symptom3": {
      "chills": 34,
      "arthralgia": 4,
      "other":  62
    },
    "symptom4": {
      "null": 49,
      "pyrexia": 3,
      "other":  48
    },
    "symptom5": {
      "null": 61,
      "pyrexia": 2,
      "other":  36
    }
  };

  const age = {'symptom1': {'chills': {'0-20': 22,
  '20-40': 1225,
  '40-60': 1263,
  '60-80': 555,
  '80-100': 51},
 'arthralgia': {'0-20': 10,
  '20-40': 545,
  '40-60': 844,
  '60-80': 404,
  '80-100': 50},
 'other': {'0-20': 438,
  '20-40': 11167,
  '40-60': 13755,
  '60-80': 10062,
  '80-100': 3922}},
'symptom2': {'na': {'0-20': 139,
  '20-40': 1964,
  '40-60': 2528,
  '60-80': 1999,
  '80-200': 824},
 'headache': {'0-20': 18,
  '20-40': 746,
  '40-60': 926,
  '60-80': 363,
  '80-200': 38},
 'other': {'0-20': 313,
  '20-40': 10227,
  '40-60': 12408,
  '60-80': 8659,
  '80-200': 3161}},
'symptom3': {'chills': {'0-20': 3,
  '20-40': 169,
  '40-60': 185,
  '60-80': 129,
  '80-300': 26},
 'arthralgia': {'0-20': 0, '20-40': 10, '40-60': 9, '60-80': 4, '80-300': 0},
 'other': {'0-20': 467,
  '20-40': 12758,
  '40-60': 15668,
  '60-80': 10888,
  '80-300': 3997}},
'symptom4': {'na': {'0-20': 286,
  '20-40': 6078,
  '40-60': 7416,
  '60-80': 5244,
  '80-200': 1933},
 'pyrexia': {'0-20': 13,
  '20-40': 441,
  '40-60': 490,
  '60-80': 269,
  '80-200': 35},
 'other': {'0-20': 171,
  '20-40': 6418,
  '40-60': 7956,
  '60-80': 5508,
  '80-200': 2055}},
'symptom5': {'na': {'0-20': 326,
  '20-50': 7833,
  '50-60': 9533,
  '60-80': 6509,
  '80-200': 2311},
 'pyrexia': {'0-20': 7,
  '20-50': 416,
  '50-60': 461,
  '60-80': 205,
  '80-200': 42},
 'other': {'0-20': 137,
  '20-50': 4688,
  '50-60': 5868,
  '60-80': 4307,
  '80-200': 1670}}
  };
  const sex = {
    'symptom1': {
      'chills': {'F': 2414, 'M': 789},
      'arthralgia': {'F': 1467, 'M': 450},
      'other': {'F': 30750, 'M': 11249}
    },
    'symptom2': {
      'na': {'F': 1137, 'M': 376},
      'headache': {'F': 1684, 'M': 469},
      'other': {'F': 31810, 'M': 11643}
    },
    'symptom3': {
      'chills': {'F': 403, 'M': 125},
      'arthralgia': {'F': 18, 'M': 5},
      'other': {'F': 34210, 'M': 12358}},
    'symptom4': {
      'na': {'F': 119, 'M': 57},
      'pyrexia': {'F': 941, 'M': 353},
      'other': {'F': 33571, 'M': 12078}
    },
    'symptom5': {
      'na': {'F': 42, 'M': 16},
      'pyrexia': {'F': 858, 'M': 305},
      'other': {'F': 33731, 'M': 12167}
    }
  };

  const svg  = d3.select("svg");
  
  const width  = parseInt(svg.attr("width"));
  const height = parseInt(svg.attr("height"));
  const hypotenuse = Math.sqrt(width * width + height * height);
  
  // must be hard-coded to match our topojson projection
  // source: https://github.com/topojson/us-atlas
  const projection = d3.geoAlbers().scale(1280).translate([480, 300]);
  
  const scales = {
    // used to scale airport bubbles
    airports: d3.scaleSqrt()
      .range([4, 18]),
  
    // used to scale number of segments per line
    segments: d3.scaleLinear()
      .domain([0, hypotenuse])
      .range([1, 10])
  };
  
  // have these already created for easier drawing
  const g = {
    basemap:  svg.select("g#basemap")
  };
  
  console.assert(g.basemap.size()  === 1);
  
  const tooltip = d3.select("text#tooltip");
  console.assert(tooltip.size() === 1);
  

  // load and draw base map
  d3.json(urls.map).then(drawMap);
  console.log("Finished drawing map");
  
  // draws the underlying map
  function drawMap(map) {
    // remove non-continental states
    map.objects.states.geometries = map.objects.states.geometries.filter(isContinental);
  
    // run topojson on remaining states and adjust projection
    let land = topojson.merge(map, map.objects.states.geometries);
  
    // use null projection; data is already projected
    let path = d3.geoPath();
  
    // draw base map
    g.basemap.append("path")
      .datum(land)
      .attr("class", "land")
      .attr("d", path);
  
    // draw interior borders
    g.basemap.append("path")
      .datum(topojson.mesh(map, map.objects.states, (a, b) => a !== b))
      .attr("class", "border interior")
      .attr("d", path);
  
    // draw exterior borders
    g.basemap.append("path")
      .datum(topojson.mesh(map, map.objects.states, (a, b) => a === b))
      .attr("class", "border exterior")
      .attr("d", path);
  }

  //change Symptom being selected
  function changeSymptom() {
    var selectBox = document.getElementById("symptoms");
    var selectedValue = selectBox.options[selectBox.selectedIndex].value;
    drawTotalDistributionPie(symptoms[selectedValue]);
    drawSexDistributionPie(sex[selectedValue]);
    drawAgeDistributionPie(age[selectedValue]);
  }

  // draw total distribution pie chart
  function drawTotalDistributionPie(data) {
    d3.select("#total_pie").html("");
    setPieChart("total_pie", data, "", "");
  }

   // draw sex distribution pie chart
  function drawSexDistributionPie(data) {
    d3.select("#sex_pie").html("");
    for (const k in data) {
      setPieChart("sex_pie", data[k], "sex", k);
    } 
  }

  // draw age distribution
  function drawAgeDistributionPie(data) {
    d3.select("#age_hist").html("");
    for (const k in data) {
      setHistogram("age_hist", data[k], k);
    } 
  }

  // set structure of pie chart
  function setPieChart(id, data, mode, title) {
    // set the dimensions and margins of the graph
    var width = 300
    var height = 300
    var margin = 40

    // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
    var radius = Math.min(width, height) / 2 - margin

    // append the svg object to the div
    var svg = d3.select("#" + id)
      .append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Create dummy data
    // var data = {a: 9, b: 20, c:30, d:8, e:12}

    // set the color scale
    var color = (mode === 'sex') ? 
    d3.scaleOrdinal()
    .domain(data)
    .range(["#98abc5", "#8a89a6"]) :
    d3.scaleOrdinal()
    .domain(data)
    .range(["#98abc5", "#8a89a6", "#7b6888"])

    // Compute the position of each group on the pie:
    var pie = d3.pie()
      .value(function(d) {return d.value; })
    var data_ready = pie(d3.entries(data))

    // shape helper to build arcs:
    var arcGenerator = d3.arc()
      .innerRadius(0)
      .outerRadius(radius)

    // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
    svg
      .selectAll('whatever')
      .data(data_ready)
      .enter()
      .append('path')
        .attr('d', arcGenerator)
        .attr('fill', function(d){ return(color(d.data.key)) })
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
    
    // Add the annotation. Use the centroid method to get the best coordinates
    svg
      .selectAll('whatever')
      .data(data_ready)
      .enter()
      .append('text')
      .text(function(d){ return d.data.key})
      .attr("transform", function(d) { return "translate(" + arcGenerator.centroid(d) + ")";  })
      .style("text-anchor", "middle")
      .style("font-size", 17)

    // add title
    svg.append("text")
      .attr("x", (width / 60))             
      .attr("y", (height / 2) - 10)
      .attr("text-anchor", "middle")  
      .style("font-size", "16px") 
      .style("text-decoration", "underline")  
      .text(title);
  };


  // set structure of histogram
  function setHistogram(id, data, title) {
    // set the dimensions and margins of the graph
    var width = 300
    var height = 300
    var margin = 40

    // append the svg object to the div
    var svg = d3.select("#" + id)
      .append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // get the data
    d3.json("age.json", function(data) {

      // X axis: scale and draw:
      var x = d3.scaleLinear()
          .domain([0, 1000])     // can use this instead of 1000 to have the max of data
          .range([0, width]);
      svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));

      // set the parameters for the histogram
      var histogram = d3.histogram()
          .value(function(d) { return d.value; })   // need to give the vector of value
          .domain(x.domain())  // then the domain of the graphic
          .thresholds(x.ticks(70)); // then the numbers of bins

      // And apply this function to data to get the bins
      var bins = histogram(data);

      // Y axis: scale and draw:
      var y = d3.scaleLinear()
          .range([height, 0]);
          y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
      svg.append("g")
          .call(d3.axisLeft(y));

      // append the bar rectangles to the svg element
      svg.selectAll("rect")
          .data(bins)
          .enter()
          .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
            .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
            .attr("height", function(d) { return height - y(d.length); })
            .style("fill", "#69b3a2")

    });  
  };