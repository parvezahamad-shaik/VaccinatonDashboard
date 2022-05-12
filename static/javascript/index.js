var width = window.innerWidth * 0.5
var centerDivHeight = window.innerHeight * 0.5
var height = centerDivHeight;
var states_json,vaccination_data,criteria;
var flag = true;
var clicked = false;

// var selected_features = ["State","Abbr","Administered_Dose1_Pop_Pct","Series_Complete_Pop_Pct",
//     "Booster_Doses_Vax_Pct","Metro_Counties","Non_Metro_Counties","Literacy_Rate","Total_Cases","Active_Cases",
//     "Total_Deaths","Total_Tests","Tests_Per_Million","Population","Pfizer_Administered","Moderna_Administered",
//     "JohnsonJohnson_Administered","Unknown_Administered"]

var atleastOne = d3.select("#button_atleastone").on("click",function(){
    d3.select("#button_atleastone").style("border","2px solid yellow")
    d3.select("#button_fullyvaccinated").style("border","2px solid white")
    d3.select("#button_boosted").style("border","2px solid white")
    projectAtleastOneDoseMap()
});
var fullyVaxxed = d3.select("#button_fullyvaccinated").on("click",function(){
    // d3.select("#button_fullyvaccinated").style("background-color","rgb(171,193,234)")
    d3.select("#button_fullyvaccinated").style("border","2px solid yellow")
    d3.select("#button_atleastone").style("border","2px solid white")
    d3.select("#button_boosted").style("border","2px solid white")
    projectFullyVaccinatedMap()});

var boosted = d3.select("#button_boosted").on("click",function(){
    d3.select("#button_boosted").style("border","2px solid yellow")
    d3.select("#button_atleastone").style("border","2px solid white")
    d3.select("#button_fullyvaccinated").style("border","2px solid white")
    projectBoostedMap()})


var atleast_one_dose_colors = ["rgb(199, 117, 96)","rgb(219, 167, 136)","rgb(239, 219, 203)","rgb(179, 208, 199)","rgb(111, 161, 148)" ,"rgb(47, 114, 100)"]
var atleast_one_dose_domain = [45,50,55,60,65,85]
var atleast_one_dose_color = d3.scaleLinear()
                .range(atleast_one_dose_colors)
                .domain(atleast_one_dose_domain)

var fully_vaccinated_colors = ["rgb(199, 117, 96)","rgb(219, 167, 136)","rgb(239, 219, 203)","rgb(179, 208, 199)","rgb(111, 161, 148)" ,"rgb(47, 114, 100)"]
var fully_vaccinated_domain = [30,40,50,60,70,80]
var fully_vaccinated_color = d3.scaleLinear()
                .range(fully_vaccinated_colors)
                .domain(fully_vaccinated_domain)

var boosted_colors = ["rgb(247, 242, 227)","rgb(241, 228, 196)","rgb(233, 214, 165)","rgb(224, 200, 134)","rgb(215, 186, 103)","rgb(204, 173, 71)"]
var boosted_domain = [20,25,30,35,40,45,50]
var boosted_color = d3.scaleLinear()
                .range(boosted_colors)
                .domain(boosted_domain)

// D3 Projection
var projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2]) // translate to center of screen
    .scale([width]); // scale things down so see entire US

// Define path generator
var path = d3.geoPath() // path generator that will convert GeoJSON to SVG paths
    .projection(projection); // tell path generator to use albersUsa projection

//Create SVG element and append map to the SVG
var svg = d3.select("body")
    .select("#div-center")
    .select("#map")
    .select("#map_projection")
    .append("svg")
    .attr("width", width)
    .attr("height", height);
// Append Div for tooltip to SVG
var div = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.csv("../static/data/Vaccination.csv").then(data => {
    console.log("vaccination_data: ", data);
    vaccination_data = data
    // Load GeoJSON data and merge with states data
    d3.json("../static/data/us_states.json").then(json => {
        console.log("us_states: ", json);
        console.log("us_states: ", json.features.map(f => f.properties.name));
        // Loop through each state data value in the .csv file
        for (var i = 0; i < data.length; i++) {

            // Grab State Name
            var dataState = data[i].State;

            // Find the corresponding state inside the GeoJSON
            for (var j = 0; j < json.features.length; j++) {
                var jsonState = json.features[j].properties.name;

                if (dataState == jsonState) {

                    // Copy the data value into the JSON
                    json.features[j].properties.vaccinationData = data[i];

                    // Stop looking through the JSON
                    break;
                }
            }
        }
        states_json = json
        projectAtleastOneDoseMap()
        updateSummaryDetails()
        updatePieChart()
        updateStackedChart()
    })
})

function projectMap(){
    svg.selectAll('*').remove();
    var labels_div = d3.select("body")
                        .select("#div-center")
                        .select("#map_labels")
                        .html("<div class = \"center\"> Pct. of residents with at least one dose </div>")


    let labels = labels_div.append("svg")
                .attr("width", width/2)
                .attr("height", "2vh")
                .attr("transform",
                    "translate(" + width/4 + "," + 10 + ")");

    let colors = []
    let domain = []
    let color_scale;
    switch(criteria) {
        case 'Administered_Dose1_Pop_Pct':
            colors = atleast_one_dose_colors
            domain = atleast_one_dose_domain
            color_scale = atleast_one_dose_color
            break;
        case 'Series_Complete_Pop_Pct':
            colors = fully_vaccinated_colors
            domain = fully_vaccinated_domain
            color_scale = fully_vaccinated_color
            break;
        case 'Booster_Doses_Vax_Pct':
            colors = boosted_colors
            domain = boosted_domain
            color_scale = boosted_color
            break;
        default:
        }
    colors.forEach((color,i) => {
        labels.append("rect")
            .attr("x", i*width/12)
            .attr("y",0)
            .attr("width", width/12)
            .attr("height","2vh")
            .attr("fill", color)
        if(i>0)
            labels.append("text")
            .attr("y", 5)
            .attr("x", i*width/12)
            .attr("dy", "0.75em")
            .style("text-anchor", "middle")
            .text(domain[i]);
    });

    // Bind the data to the SVG and create one path per GeoJSON feature
    svg.selectAll("path")
        .data(states_json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("stroke", "black")
        .style("stroke-width", "1")
        .style("fill", function(d) {
            // Get data value
            var value = d.properties.vaccinationData;
            return color_scale(value[criteria])
        })
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", .9)


            div.html("<b>" + d.properties.vaccinationData.State + "</b>"
                + "<br> Atleast one dose " + d.properties.vaccinationData.Administered_Dose1_Pop_Pct +
                "%<br> Fully Vaccinated " + d.properties.vaccinationData.Series_Complete_Pop_Pct + "%<br> With a Booster " +
                d.properties.vaccinationData.Booster_Doses_Vax_Pct + "%")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px")
                .style("color","black");
            d3.select(this).style("stroke-width","3")
            if(!clicked ) {
                updateSummaryDetails(d.properties.vaccinationData.State)
                updatePieChart(d.properties.vaccinationData.State)
                plotVaccinationBarGraph(d.properties.vaccinationData.State)
                updateStackedChart(d.properties.vaccinationData.State)
            }
        })
        // fade out tooltip on mouse out
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
            d3.select(this).style("stroke-width","1")
            if(!clicked ) {
                updateSummaryDetails()
                updatePieChart()
                plotVaccinationBarGraph()
                updateStackedChart()
            }
        })
        .on("click", function(d){
            clicked = true
            if(flag) {
                updateSummaryDetails(d.properties.vaccinationData.State)
                updatePieChart(d.properties.vaccinationData.State)
                plotVaccinationBarGraph(d.properties.vaccinationData.State)
                updateStackedChart(d.properties.vaccinationData.State)
                flag = false
            }
            else {
                updateSummaryDetails()
            updatePieChart()
            plotVaccinationBarGraph()
            updateStackedChart()
                flag = true
                clicked = false;
            }

        });

    svg.selectAll(".stateText")
        .data(states_json.features)
        .enter().append("text")
        .attr("x", function(d) {
            return path.centroid(d)[0];
        })
        .attr("y", function(d) {
            return path.centroid(d)[1] ;
        })
        .attr("text-anchor", "middle")
        .attr("font-size", "1.5vh")
        .attr("fill", "#333")
        .text(function(d){ return d.properties.vaccinationData.Abbr})

    plotVaccinationBarGraph()
}

function projectAtleastOneDoseMap(){
    criteria = 'Administered_Dose1_Pop_Pct';
    projectMap();
}

function projectFullyVaccinatedMap(){
    criteria = 'Series_Complete_Pop_Pct';
    projectMap();
}

function projectBoostedMap(){
    criteria = 'Booster_Doses_Vax_Pct';
    projectMap();
}

function donutChartColors(vaccine){
    // var colors = ["#004c6d","#00a1c1","#00ffff"]
    // var colors = ["#de425b","#ec9c9d","#f1f1f1"]

     var colors = ["#ffa600","#bc5090","#2290ae"]
    if(vaccine==="Pfizer")
        return colors[0]
    else if(vaccine==="Moderna")
        return colors[1]
    else if(vaccine==="J&J")
        return colors[2]
    else
        return "#b01515"
}

function plotVaccinationBarGraph(state) {
    d3.select("body").select("#div-left").selectAll('*').remove();
    var margin = {
            top: 20,
            right: 20,
            bottom: 50,
            left: 50
        },
        width = window.innerWidth * 0.25 - margin.left - margin.right,
        height = window.innerHeight * 0.95 - margin.top - margin.bottom;

    var xScale = d3.scaleLinear().range([0, width]),
        yScale = d3.scaleBand().range([height, 0]).padding(0.4);

    var g = d3.select("body")
        .select("#div-left")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("fill","white")
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // let data = vaccination_data
    yScale.domain(vaccination_data.map(function(d) {
        return d.Abbr;
    }));
    xScale.domain([0, d3.max(vaccination_data, function(d) {
        return parseInt(+d[criteria]);
    })]);

    var botaxis = g.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale));

    botaxis.selectAll("text")
        .style("stroke", "white");
    g.append("text")
        .attr("transform",
            "translate(" + (width / 2) + " ," +
            (height + margin.top + 10) + ")")
        .style("text-anchor", "middle")
        .style("fill","white")
        .text("Percentage of people");

    var leftaxis = g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(x => x.length > 4 ? `${x.substr(0,3)}` : x))

    leftaxis.selectAll("text")
        .style("stroke", "white");


    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2) + 20)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill","white")
        .text("States");

    g.selectAll(".bar")
        .data(vaccination_data)
        .enter().append("rect")
        .attr("fill", function(d) {
             // return d.State == state ? "rgba(177,238,72,0.58)" : "skyblue";
            // return d.State == state ? "rgb(100,239,85)" : "skyblue";
               return d.State == state ? "rgb(231,236,73)" : "skyblue";
            // return d.State == state ? "rgba(190,7,179,0.58)" : "skyblue";
        })
        .attr("class", "bar")
        .attr("x", function(d) {
            return 0;
        })
        .attr("y", function(d) {
            return yScale(d.Abbr);
        })
        .attr("height", function(d) {
            if(d.State === state)
                return yScale.bandwidth() +  (yScale.bandwidth()/2);
            else
                return yScale.bandwidth();
        })
        .attr("width", function(d) {
            if(d.State === state)
                return xScale(d[criteria])
            else
                return xScale(d[criteria]);
        })
        .on("mouseover", function(d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);

            div.html("<b>" + d.State + "</b>" + "<br>"+"Atleast one dose " + d.Administered_Dose1_Pop_Pct + "%<br> Fully Vaccinated " + d.Series_Complete_Pop_Pct + "%<br> With a Booster " + d.Booster_Doses_Vax_Pct + "%")
               .style("left", (d3.event.pageX) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
        })

        // fade out tooltip on mouse out
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

function updateSummaryDetails(state) {
    d3.select("body").select("#summary").selectAll('*').remove();
    let title = 'United States';
    let totalCovidCases = ''
    let activeCovidCases = ''
    let totalDeaths = ''
    let recoveredCases = ''

    if (state) {
        title = state;
        let stateDetails = vaccination_data.find(x => x.State == state);
        totalCovidCases = stateDetails.Total_Cases;
        activeCovidCases = stateDetails.Active_Cases;
        totalDeaths = stateDetails.Total_Deaths;
    }
    else{
        totalCovidCases = vaccination_data.map(x => x.Total_Cases).reduce((prevValue, currValue) => {
            return (parseInt(prevValue.replaceAll(",","")) + parseInt(currValue.replaceAll(",",""))).toLocaleString()
        });
        activeCovidCases = vaccination_data.map(x => x.Active_Cases).reduce((prevValue, currValue) => {
            return (parseInt(prevValue.replaceAll(",","")) + parseInt(currValue.replaceAll(",",""))).toLocaleString()
        });
        totalDeaths = vaccination_data.map(x => x.Total_Deaths).reduce((prevValue, currValue) => {
            return (parseInt(prevValue.replaceAll(",","")) + parseInt(currValue.replaceAll(",",""))).toLocaleString()
        });
    }
    // console.log(totalCovidCases, activeCovidCases, totalDeaths)
    recoveredCases = (parseInt(totalCovidCases.replaceAll(",",""))
                            - parseInt(activeCovidCases.replaceAll(",", ""))
                            - parseInt(totalDeaths.replaceAll(",", ""))).toLocaleString()

    let summary_div = document.getElementById("summary");

    let state_title_div = summary_div.appendChild(document.createElement('div'))
    state_title_div.appendChild(document.createTextNode(`${title}`))
    state_title_div.classList.add('my_style')

    let total_covid_cases_div = summary_div.appendChild(document.createElement('div'));
    total_covid_cases_div.classList.add('my_style');
    total_covid_cases_div.appendChild(document.createTextNode('Total COVID Cases'))

    let total_covid_cases_count_div = summary_div.appendChild(document.createElement('div'));
    total_covid_cases_count_div.classList.add('my_style','totalCases');
    total_covid_cases_count_div.appendChild(document.createTextNode(`${totalCovidCases}`))

    let recovered_cases_div = summary_div.appendChild(document.createElement('div'));
    recovered_cases_div.classList.add('my_style');
    recovered_cases_div.appendChild(document.createTextNode('Recovered Cases'))

    let recovered_cases_count_div = summary_div.appendChild(document.createElement('div'));
    recovered_cases_count_div.classList.add('my_style','recoveredCases');
    recovered_cases_count_div.appendChild(document.createTextNode(`${recoveredCases}`))

    let total_deaths_div = summary_div.appendChild(document.createElement('div'));
    total_deaths_div.appendChild(document.createTextNode('Total Deaths'))
    total_deaths_div.classList.add('my_style');

    let total_deaths_count_div = summary_div.appendChild(document.createElement('div'));
    total_deaths_count_div.appendChild(document.createTextNode(`${totalDeaths}`))
    total_deaths_count_div.classList.add('my_style','deathCases');
}

function updatePieChart(state){
    d3.select("body").select("#vaccination_pie").selectAll('*').remove();
    let pfizer = ''
    let moderna = ''
    let jj = ''
    // let others = ''

    if (state) {
        let stateDetails = vaccination_data.find(x => x.State == state);
        pfizer = stateDetails.Pfizer_Administered;
        moderna = stateDetails.Moderna_Administered;
        jj = stateDetails.JohnsonJohnson_Administered;
        // others = stateDetails.Unknown_Administered;
    }
    else{
        pfizer = vaccination_data.map(x => x.Pfizer_Administered).reduce((prevValue, currValue) => {
            return (parseInt(prevValue.replaceAll(",","")) + parseInt(currValue.replaceAll(",",""))).toLocaleString()
        });
        moderna = vaccination_data.map(x => x.Moderna_Administered).reduce((prevValue, currValue) => {
            return (parseInt(prevValue.replaceAll(",","")) + parseInt(currValue.replaceAll(",",""))).toLocaleString()
        });
        jj = vaccination_data.map(x => x.JohnsonJohnson_Administered).reduce((prevValue, currValue) => {
            return (parseInt(prevValue.replaceAll(",","")) + parseInt(currValue.replaceAll(",",""))).toLocaleString()
        });
        others = vaccination_data.map(x => x.Unknown_Administered).reduce((prevValue, currValue) => {
            return (parseInt(prevValue.replaceAll(",","")) + parseInt(currValue.replaceAll(",",""))).toLocaleString()
        });
    }

    let pfizerInt = parseInt(pfizer.replaceAll(",",""));
    let modernaInt = parseInt(moderna.replaceAll(",",""));
    let jjInt = parseInt(jj.replaceAll(",",""));
    // let othersInt = parseInt(others.replaceAll(",",""));
    let totalInt = pfizerInt + modernaInt + jjInt ;
    // let totalInt = pfizerInt + modernaInt + jjInt + othersInt;
    let data = [
        {
            "vaccine": "Pfizer",
            "total": pfizerInt,
            "percentage": `${((pfizerInt/totalInt) * 100).toFixed(1)}%`
        },
        {
            "vaccine": "Moderna",
            "total": modernaInt,
            "percentage": `${((modernaInt/totalInt) * 100).toFixed(1)}%`
        },
        {
            "vaccine": "J&J",
            "total": jjInt,
            "percentage": `${((jjInt/totalInt) * 100).toFixed(1)}%`
        },
        // {
        //     "vaccine": "Others",
        //     "total": othersInt,
        //     "percentage": `${((othersInt/totalInt) * 100).toFixed(1)}%`
        // },
    ]

    let width = window.innerWidth * 0.24
    let height = window.innerHeight * 0.3
    let radius = Math.min(width, height)/2
    let color = d3.scaleOrdinal(d3.inter)
    var path = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(radius - 70);

    var label = d3.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);
    let pie = d3.pie().value(d => {
        // console.log(d);
        return d.total;
    }).sort(null)
    // let arc = d3.arc().innerRadius(radius - 100).outerRadius(radius - 20)
    let svg = d3.select("body")
                .select("#vaccination_pie")
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    let arc = svg.selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("g")
        // .transition().delay(function(d, i) { return i * 500; }).duration(500)
        .attr("class", "arc")
    ;

    arc.append("path")
        .attr("d", path)
        .attr("fill", function(d) { return donutChartColors(d.data.vaccine); });


    arc.append("text")
        .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")rotate(-90)"; })
        .attr("dy", "0.39em")
        // .attr("dx", "0.1em")
        .attr("text-anchor", "middle")
        .text(function(d) { return `${d.data.percentage}`; })
        .attr("fill","black")
        .style("font-size","27px")
        ;


    arc.append("text")
        .text("VACCINES")
        .attr('transform', 'translate(' + -25 + ',' + -10 + ')')
        .attr("fill","white")
    arc.append("text")
        .text("ADMINISTERED")
        .attr('transform', 'translate(' + -45 + ',' + 10 + ')')
        .attr("fill","white")

    // xlabelPosition = -200
    // ylabelPosition = 40

    xlabelPosition = -200
    ylabelPosition = -157
 var clusterColors =["#ffa600","#bc5090","#2290ae"]
    // var clusterColors = ["#de425b","#ec9c9d","#f1f1f1"]
    var vaccines = ["Pfizer", "Moderna","Others"]
    for(let i=1;i<=3;i++) {
        svg.append("text").text(vaccines[i-1])
            .attr("transform", "translate("+xlabelPosition.toString()+","+(ylabelPosition+30*i).toString()+") ").style("fill", clusterColors[i-1]).style("font-size", "18px");
        svg.append("text").text("_")
            .attr("transform", "translate("+xlabelPosition.toString()+","+((ylabelPosition+5)+30*i).toString()+") ").style("fill", clusterColors[i-1]).style("font-size", "150px");
    }

}

function updateMDSChart(mdsData) {
    d3.select("body").select("#mds").selectAll('*').remove();
    var data = mdsData

    var mds_cx = data["mds_cx"]
    var mds_cy = data["mds_cy"]
    var featureNames = data["columns"]
    // var kmeansCorrelated = data["kmeans_correlated"]
    // console.log(mds_cy, mds_cx)


    var margin = {
        top: 20, right: 30, bottom: 120, left: 30
    }; // setting up margins for chart
    var width = 400 - margin.left - margin.right; // width of the chart
    var height = 400 - margin.top - margin.bottom; //height of bar/

    //Create SVG
    var svg = d3.select("body") //create Svg element
        .select("#mds")
        .append("svg")
        .attr('width', width + margin.right + margin.left) //width of the SVG canvas
        .attr('height', height + margin.top + margin.bottom) //height of the SVG canvas;

    var chart = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('width', width)
        .attr('height', height);

    var xDomainMin = d3.min(mds_cx, function (d) {
        return d
    })
    var xDomainMax = d3.max(mds_cx, function (d) {
        return d
    })
    var yDomainMin = d3.min(mds_cy, function (d) {
        return d
    })
    var yDomainMax = d3.max(mds_cy, function (d) {
        return d
    })
    var xLineScale = d3.scaleLinear().domain([xDomainMin - 0.1, xDomainMax + 0.4]).range([0, width]),
        yLineScale = d3.scaleLinear().domain([yDomainMin - 0.8, yDomainMax + 0.4]).range([height, 0]);

    var xAxisScatter = d3.axisBottom(xLineScale)
    var yAxisScatter = d3.axisLeft(yLineScale)

    // xAxisScatter.style("fill","blue")


    var title = chart.selectAll(".dot")
        .data(mds_cx)
        .enter()
        .append("circle")
        .attr("fill", "deeppink")
        // .attr("fill", "rgb(159, 90, 253)")
        .transition()
        .delay(function (d, i) {
            return (i * 3)
        })
        .duration(2000)

        .attr("cx", function (d, i) {
            return xLineScale(mds_cx[i])
        })
        .attr("cy", function (d, i) {
            return yLineScale(mds_cy[i])
        })
        .attr("r", 6);

    // title.append("svg:title")
    //    .text(function(d,i) { return featureNames[i]; });

    for (let i = 0; i < featureNames.length; i++) {
    chart.append("text")
        .attr("fill", "white")
        .attr("r", 3)
        .attr("x", xLineScale( mds_cx[i]))
        .attr("y", yLineScale( mds_cy[i]))
        .style("font-weight", "bold")
        .attr("dx", "-0.3em")
        .attr("dy", "1.1em")
        .attr("transform", "rotate(-3)")
        .text(featureNames[i])
}


        chart.append("g")
        .call(xAxisScatter)
        .attr('transform', 'translate(0,' + height + ')')
        .attr("class", "x axis")
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
            .attr("fill","white")
        .attr("transform", "rotate(-70)");

    chart.append("g")
        // .attr('transform',"translate(-10,0)")
        .call(yAxisScatter)
        .selectAll("text")
        .attr("fill","white")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-40)");

    chart.selectAll("line").style("stroke", "white");
    chart.selectAll("path").style("stroke", "white");


    // chart.append("text").attr("x", 890).attr("y", 90).text("==> Cluster 2").style("font-size", "15px").style("fill", "rgb(59,185,156)").attr("alignment-baseline", "middle")
}


function updateStackedChart(state){
    d3.select("body").select("#sac").selectAll('*').remove();

    let margin = {top: 10, right: 100, bottom: 50, left: 100},
        width = window.innerWidth * 0.5 - margin.left - margin.right,
        height = window.innerHeight * 0.4 - margin.top - margin.bottom;

    let svg = d3.select("body")
                .select("#sac")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    let parseDate = d3.timeParse("%d/%m/%Y");

    let formatNumber = d3.format(".1f"),
        formatMillion = function(x) { return formatNumber(x / 1e6); };
    //"#08f8bf"
    let x = d3.scaleTime()
        .range([0, width]);

    let y = d3.scaleLinear()
        .range([height, 0]);
    // var clusterColors =["#e15050","#ffff00"]
    // var clusterColors =["#e15050","#f0f62a"]
     var clusterColors =["#e15050","#e8ec75"]
    let color = d3.scaleOrdinal(clusterColors);

    let xAxis = d3.axisBottom()
        .scale(x);

    let yAxis = d3.axisLeft()
        .scale(y)
        .tickFormat(formatMillion);

    let area = d3.area()
        .x(function(d) {
            return x(d.data.Date); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); });

    let stack = d3.stack()

    d3.csv('../static/data/timeseries.csv').then(data => {
        color.domain(d3.keys(data[0]).filter(function(key) { return key !== 'Date' && key !== 'State' && key !== 'Cases' && key !== 'DeathsPerMonth'; }));
        var keys = data.columns.filter(key => key !== 'Date' && key !== 'State' && key !== 'Cases' && key !== 'DeathsPerMonth')
        data = data.filter(d => d.State == (state ? state : "US"));
        console.log(data)
        data.forEach(function(d) {
            d.Date = parseDate(d.Date);
        });
        var maxDateVal = d3.max(data, function(d){
            var vals = d3.keys(d).map(function(key){ return key !== 'Date' && key !== 'State' && key !== 'Cases' && key !== 'DeathsPerMonth' ? d[key] : 0 });
            return d3.sum(vals);
        });

        // Set domains for axes
        x.domain(d3.extent(data, function(d) { return d.Date; }));
        y.domain([0, maxDateVal])

        stack.keys(keys);

        stack.order(d3.stackOrderNone);
        stack.offset(d3.stackOffsetNone);

        console.log(stack(data));

        var browser = svg.selectAll('.browser')
            .data(stack(data))
            .enter()
            .append('g')
            .attr('class', function(d){ return 'browser ' + d.key; })
            .attr('fill-opacity', 0.5);

        browser.append('path')
            .attr('class', 'area')
            .attr('d', area)
            .style('fill', function(d) { return color(d.key); });

        browser.append('text')
            .datum(function(d) { return d; })
            .attr('transform', function(d) { return 'translate(' + x(data[27].Date) + ',' + y(d[27][1]) + ')'; })
            .attr('x',2)
            .attr('dy', '.35em')
            .style("text-anchor", "start")
            .attr("fill","white")
            .text(function(d) { return d.key; })
            .attr('fill-opacity', 1);

        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
             .attr("fill","white")
            .call(xAxis)
         .attr("fill","white");

        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis)
         .attr("fill","white")
        ;

        svg.append ("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 60)
            .attr("x", 0 - (height / 2) - 20)
            .attr("fill","white")
            // .attr("x", 0-margin.left)
            .text("People in Millions");
        // d3.select("svg").select(".browser Deaths").style("stroke","red")
        svg.selectAll("line").style("stroke", "white");
        svg.selectAll("path").style("stroke", "orange");
        svg.selectAll("text").style("stroke", "white");
    });

}

