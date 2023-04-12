/**
 * SkewT v1.1.0
 * 2016 David Felix - dfelix@live.com.pt
 * 
 * Dependency:
 * d3.v3.min.js from https://d3js.org/
 * 
 */
var SkewT = function(div, nskew) {
    if (nskew == undefined) nskew = 1;

    //properties used in calculations
    var wrapper = d3.select(div);
    var width = parseInt(wrapper.style('width'), 10);
    var height = width; //tofix
    var margin = {top: 30, right: 40 + 30*(nskew-1), bottom: 20, left: 35}; //container margins
    var deg2rad = (Math.PI/180);
    var tan = Math.tan(55*deg2rad);
    var basep = 1050;
    var topp = 100;
    var plines = [1000,925,850,700,500,400,300,250,200,150,100];
    var pticks = [950,900,800,750,650,600,550,450,400,350,250,150];
    var barbsize = 25;
    // functions for Scales and axes. Note the inverted domain for the y-scale: bigger is up!
    var r = d3.scaleLinear().range([0,300]).domain([0,150]);
    var y2 = d3.scaleLinear();
    var bisectTemp = d3.bisector(function(d) { return d.pres; }).left; // bisector function for tooltips
    var w, h, x, y, xAxis, yAxis, yAxis2, xNavi, yNavi;
    var data = [], tmpData = [];
    //aux
    var unit = "kt"; // or kmh

    //containers
    var svg = wrapper.append("svg").attr("id", "svg").attr("cursor", "grab");   //main svg
    var container = svg.append("g").attr("id", "container"); //container 
    var skewtbg = container.append("g").attr("id", "skewtbg").attr("class", "skewtbg");//background
    var skewtgroup = container.append("g").attr("class", "skewt"); // put skewt lines in this group
    var barbgroup  = container.append("g").attr("class", "windbarb"); // put barbs in this group    

    var skewdrag = d3.drag()
        .on('start', skewdragstarted)
        .on('drag', skewdragged)
        .on('end', skewdragended);

    var basedrag = d3.drag()
        .on('start', skewdragstarted)
        .on('drag', skewbasedragged)
        .on('end', skewdragended);

    function skewdragstarted(d) {
      d3.select(this).raise().classed('active', true);
    }

    function skewdragged() {
      var d = [];
      d[0] = x.invert(d3.event.x);
      d[1] = y.invert(d3.event.y);

      //console.log(x.invert(x(d[0]) - (y(basep)-y(d[1]))/tan), y.invert(y(d[1])));

      var idx = this.getAttribute("data-idx");
      var type = this.getAttribute("data-type");
      var pres = this.getAttribute("data-pres");

      var k = tmpData[idx].findIndex(function(x){return (x.pres == pres)});
      if (type == "ta") {
        tmpData[idx][k].ta = parseFloat(x.invert(x(d[0]) - (y(basep)-y(d[1]))/tan));

        if (x.invert(x(d[0]) - (y(basep)-y(d[1]))/tan) < tmpData[idx][k].td) {
          tmpData[idx][k].td = tmpData[idx][k].ta;
        }
      }
      else if (type == "td") {
        tmpData[idx][k].td = parseFloat(x.invert(x(d[0]) - (y(basep)-y(d[1]))/tan));

        if (x.invert(x(d[0]) - (y(basep)-y(d[1]))/tan) > tmpData[idx][k].ta) {
          tmpData[idx][k].ta = tmpData[idx][k].td;
        }
      }

      plot(tmpData, -1);
      table_button = parseInt(idx) + 1;
      tableSelect(table_button, 1);
      tableDisp(tmpData[idx]);
    }

    function skewdragended(d) {
      d3.select(this).classed('active', false);
    }

    function skewbasedragged() {
      //if (document.getElementById("skew_change").classList.contains("selected")) {
      //}
      //else {
      //  return;
      //}

      var base = y.invert(d3.event.y);
      var idx = this.getAttribute("data-idx");

      if (base < 300) {
        base = 300;
      }
      else if (base > tmpData[idx].base) {
        base = tmpData[idx].base;
      }

      tmpData[idx].tmpBase = base;

      plot(tmpData, -1);
      table_button = parseInt(idx) + 1;
      tableSelect(table_button, 1);
      tableDisp(tmpData[idx]);
    }

    function tableIndexDisp(data) {
      var item = document.getElementById("skew_index_table");
      while (item.hasChildNodes()) {
        item.removeChild(item.childNodes[0]);
      }

      var table = document.createElement("table");
      document.getElementById("skew_index_table").appendChild(table);
      table.classList.add("pop");

      var d_li = "";
      d_li += "<td style='min-width:50px; text-align:center; font-weight:bold;'>BASE</td><td style='min-width:70px; text-align:center;'>";
      if (document.getElementById("skew_change").classList.contains("selected")) {
        d_li += "<input class='edit prevent-keydown' type='text' name='tmpBase' value='" + parseFloat(data.tmpBase).toFixed(1) + "' oninput='fn_onlyNumInput(event);' onkeydown='if (event.keyCode == 13) fnSkewEdit();'></td>";
      }
      else {
        d_li += data.tmpBase.toFixed(0) + " hPa";
      }
      d_li += "<td style='min-width:50px; text-align:center; font-weight:bold;'>LCL</td><td style='min-width:70px; text-align:center;'>";
      if (data.lcl.p != -999) {
        d_li += data.lcl.p.toFixed(0) + " hPa";
      }
      else {
        d_li += "-";
      }
      d_li += "</td><td style='min-width:50px; text-align:center; font-weight:bold;'>CCL</td><td style='min-width:70px; text-align:center;'>";
      if (data.ccl.p != -999) {
        d_li += data.ccl.p.toFixed(0) + " hPa";
      }
      else {
        d_li += "-";
      }
      d_li += "</td>";
      var d_element = document.createElement("tr");
      d_element.innerHTML = d_li;
      table.appendChild(d_element);

      var d_li = "";
      d_li += "<td style='min-width:50px; text-align:center; font-weight:bold;'>LFC</td><td style='min-width:70px; text-align:center;'>";
      if (data.lfc.p != -999 && data.lfc.p != data.el.p) {
        d_li += data.lfc.p.toFixed(0) + " hPa";
      }
      else {
        d_li += "-";
      }
      d_li += "</td><td style='min-width:50px; text-align:center; font-weight:bold;'>EL</td><td style='min-width:70px; text-align:center;'>";
      if (data.el.p != -999 && data.lfc.p != data.el.p) {
        d_li += data.el.p.toFixed(0) + " hPa";
      }
      else {
        d_li += "-";
      }
      d_li += "</td><td style='min-width:50px; text-align:center; font-weight:bold;'>CVT</td><td style='min-width:70px; text-align:center;'>";
      if (data.cvt > -99.) {
        d_li += data.cvt.toFixed(1) + " ℃";
      }
      else {
        d_li += "-";
      }
      d_li += "</td>";
      var d_element = document.createElement("tr");
      d_element.innerHTML = d_li;
      table.appendChild(d_element);

      var d_li = "";
      d_li += "<td style='min-width:50px; text-align:center; font-weight:bold;'>CAPE</td><td style='min-width:70px; text-align:center;'>";
      if (data.cape.value > 0) {
        d_li += data.cape.value.toFixed(0) + " J/Kg";
      }
      else {
        d_li += "-";
      }
      d_li += "</td><td style='min-width:50px; text-align:center; font-weight:bold;'>CIN</td><td style='min-width:70px; text-align:center;'>";
      if (data.cin.value > 0) {
        d_li += data.cin.value.toFixed(0) + " J/Kg";
      }
      else {
        d_li += "-";
      }
      d_li += "</td>";
      var d_element = document.createElement("tr");
      d_element.innerHTML = d_li;
      table.appendChild(d_element);


      var item = document.getElementById("skew_hail_table");
      while (item.hasChildNodes()) {
        item.removeChild(item.childNodes[0]);
      }

      var table = document.createElement("table");
      document.getElementById("skew_hail_table").appendChild(table);
      table.classList.add("pop");

      var d_li = "";
      d_li += "<td style='min-width:70px; text-align:center; font-weight:bold;'>우박 점검표</td><td><i class=\"fas fa-question-circle\" title=\"논문\" onclick=\"view_win('http://cht.kma.go.kr/doc/hail_size.pdf');\" style=\"cursor:pointer;\"></i></td>";
      d_li += "<td style='min-width:70px; text-align:center; font-weight:bold;'>발생 가능성</td>";
      if (data.cape.value >= 800 && data.hail.size >= 10) {
        d_li += "<td style='min-width:40px; text-align:center; color:red; font-weight:bold;'>높음";
      }
      else if (data.cape.value >= 600 && data.hail.size >= 5) {
        d_li += "<td style='min-width:40px; text-align:center; color:blue; font-weight:bold;'>보통";
      }
      else if (data.cape.value >= 400 && data.hail.size >= 1) {
        d_li += "<td style='min-width:40px; text-align:center;'>낮음";
      }
      else {
        d_li += "<td style='min-width:40px; text-align:center;'>-";
      }
      d_li += "</td>";
      d_li += "<td style='min-width:65px; text-align:center; font-weight:bold;'>우박 직경</td><td style='min-width:40px; text-align:center;'>";
      if (data.hail.size > 0) {
        d_li += data.hail.size.toFixed(0) + "mm";
      }
      else {
        d_li += "-";
      }
      d_li += "</td>";
      var d_element = document.createElement("tr");
      d_element.innerHTML = d_li;
      table.appendChild(d_element);

      var d_li = "";
      d_li += "<td style='min-width:50px; text-align:center; font-weight:bold;'>delta1</td><td style='min-width:45px; text-align:center;'>";
      if (data.hail.delta1 > 0) {
        d_li += data.hail.delta1.toFixed(1);
      }
      else {
        d_li += "-";
      }
      d_li += "</td>";
      d_li += "<td style='min-width:50px; text-align:center; font-weight:bold;'>delta2</td><td style='min-width:45px; text-align:center;'>";
      if (data.hail.delta2 > 0) {
        d_li += data.hail.delta2.toFixed(1);
      }
      else {
        d_li += "-";
      }
      d_li += "</td>";
      d_li += "<td style='min-width:50px; text-align:center; font-weight:bold;'>WBZ</td><td style='min-width:60px; text-align:center;'>";
      if (data.hail.wbz >= 0) {
        d_li += data.hail.wbz.toFixed(0) + "m";
      }
      else {
        d_li += "-";
      }
      d_li += "</td>";
      var d_element = document.createElement("tr");
      d_element.innerHTML = d_li;
      table.appendChild(d_element);
    }

    //local functions   
    function setVariables() {
        width = parseInt(wrapper.style('width'), 10) - 10 + 30*(nskew-1); // tofix: using -10 to prevent x overflow
        //height = width - 30*(nskew-1); //to fix
        height = (parseInt(wrapper.style('width'), 10) - 10) * 0.828734; //to fix
        w = width - margin.left - margin.right;
        h = height - margin.top - margin.bottom;     
        x = d3.scaleLinear().range([0, w]).domain([-50,50]);
        y = d3.scaleLog().range([0, h]).domain([topp, basep]);
        xNavi = d3.scaleLinear().range([0, w]).domain([-50,50]);
        yNavi = d3.scaleLog().range([0, h]).domain([topp, basep]);
        xAxis = d3.axisBottom(x).tickSize(0,0).ticks(10).tickFormat("");
        yAxis = d3.axisRight(y).tickSize(0,0).tickValues(plines.filter(function(d) { return (y(d) >= 0 && y(d) <= h); })).tickFormat(d3.format(".0d"));
        //yAxis2 = d3.axisRight(y).tickSize(5,0).tickValues(pticks);
    }
    
    function convert(msvalue, unit)
    {
        switch(unit) {
            case "kt":
                return msvalue*1.943844492;
            break;
            case "kmh":
                return msvalue*3.6;
            break;
            default:
                return msvalue;
        }       
    }

    //assigns d3 events
    //d3.select(window).on('resize', resize); 

    function resize() {
        //skewtbg.selectAll("*").remove(); 
        setVariables();
        svg.attr("width", w + margin.right + margin.left).attr("height", h + margin.top + margin.bottom);               
        container.attr("transform", "translate(" + margin.left + "," + margin.top + ")");       
        drawBackground();
        makeBarbTemplates();
        makeDefs();
        plot(data);
    }
    
    var drawBackground = function() {
        skewtbg.selectAll("*").remove(); 
        yAxis = d3.axisRight(y).tickSize(0,0).tickValues(plines.filter(function(d) { return (y(d) >= 0 && y(d) <= h); })).tickFormat(d3.format(".0d"));

        // Add clipping path
        skewtbg.append("clipPath")
        .attr("id", "clipper")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", w)
        .attr("height", h);

        skewtbg.append("clipPath")
        .attr("id", "clipper2")
        .append("rect")
        .attr("x", 1)
        .attr("y", 0)
        .attr("width", w-1)
        .attr("height", h);

        var temp = d3.range(-120,60,10);
        temp.forEach( function (item, i) {
          if (item % 20 != 0) return;

          var poly = [{"x": x(item)-0.5, "y": y(basep)}, {"x": x(item+10)-0.5, "y": y(basep)}, {"x": x(item+10)-0.5 + (y(basep)-y(100))/tan, "y": y(100)}, {"x": x(item)-0.5 + (y(basep)-y(100))/tan, "y": y(100)}];
          skewtbg.append("polygon")
          .data([poly])
          .attr("fill", "#f2f2ff")
          .attr("clip-path", "url(#clipper2)")
          .attr("points", function(d) {
            return d.map(function(d) {
              return [d.x,d.y].join(",");
            }).join(" ");
          });
        });

        // Skewed temperature lines
        skewtbg.selectAll("templine")
        .data(d3.range(-120,45,5))
        .enter().append("line")
        .attr("x1", function(d) { return x(d)-0.5 + (y(basep)-y(100))/tan; })
        .attr("x2", function(d) { return x(d)-0.5; })
        .attr("y1", y(100))
        .attr("y2", y(basep))
        .attr("class", function(d) { if (d % 10 == 0) { return "tempbold"; } else { return "templine"}})
        .attr("clip-path", "url(#clipper)");
        //.attr("transform", "translate(0," + h + ") skewX(-30)");

        // Logarithmic pressure lines
        skewtbg.selectAll("pressureline")
        .data(plines)  
        .enter().append("line")
        .attr("x1", 0)
        .attr("x2", w)
        .attr("y1", function(d) { return y(d); })
        .attr("y2", function(d) { return y(d); })
        .attr("clip-path", "url(#clipper)")
        .attr("class", "templine");

        // create array to plot dry adiabats
        var pp = d3.range(topp,basep+1,10);
        var dryad = d3.range(-40,240,10);
        var all = [];
        for (var i=0; i<dryad.length; i++) { 
            var z = [];
            for (var j=0; j<pp.length; j++) {
              var zz = x( ( 273.15 + dryad[i] ) / Math.pow( (1000/pp[j]), 0.286) -273.15) + (y(basep)-y(pp[j]))/tan;
              z.push(zz);
            }
            all.push(z);
        }

        for (var i=0; i<all.length; i++) { 
          all[i] = all[i].filter(function(d) { return (d<w+20); });  
        }

        var dryline = d3.line()
            .x(function(d,i) { return d; })
            .y(function(d,i) { return y(pp[i])} );      
        
        // Draw dry adiabats
        skewtbg.selectAll("dryadiabatline")
        .data(all)
        .enter().append("path")
        .attr("class", "dryline")
        .attr("clip-path", "url(#clipper)")
        .attr("d", dryline);

        var vp = 0;
        var e_array = [];
        var t_array = [];
        for (var t=-60; t<=50; t+=.01) {
          vp=calcVaporPressure(t);
          e_array.push(vp);
          t_array.push(t);
        }

        var allmoist = [];
        var moistad = d3.range(-20,40,5);

        for (i=0; i<moistad.length; i++) { 
          var a = [];
          for (j=0; j<pp.length; j++) { 
            a.push( findTC( calcThetaE(basep, moistad[i], moistad[i]), pp[j])) 
          }
          allmoist.push(a);
        }

        var moistline = d3.line()
            //.interpolate("linear")
            .x(function(d,i) { return x(d) + (y(basep)-y(pp[i]))/tan;})
            .y(function(d,i) { return y(pp[i])} );
        
        // Draw moist adiabats
        skewtbg.selectAll(".moistline")
        .data(allmoist)
        .enter().append("path")
        .attr("class", "moistline")
        .attr("clip-path", "url(#clipper)")
        .attr("d", moistline);

        var mixra1, mixra2, mixra3;
        var allmixr1050 = [];
        var allmixr975 = [];
        var allmixr200 = [];
        var Ttuple = [];
        var allT = [];
        var mixr_lims = [.1,.2,.4,.6,1,1.5,2,4,6,9,14,20,30,40,60];
        var mixp = [1050, 975, 200]
        mixr_lims.forEach(function (item) {  
          for (var i=0; i<=e_array.length; i++) {
            var mixraf1 = 0;
            var mixraf2 = 0;
            var Ttuple = [];
            mixra1 = calcMixingRatio(e_array[i],1050);
            if (mixra1 >= item) {
              allmixr1050.push(mixra1);
              Ttuple.push(t_array[i]);
              break;
            }
          }

          for (var j=0; j<=e_array.length; j++) {
            mixra2 = calcMixingRatio(e_array[j],975);
            if (mixra2 >= item) {
              allmixr975.push(mixra2);
              Ttuple.push(t_array[j]);
              break;
            }
          }

          for (var j=0; j<=e_array.length; j++) {
            mixra3 = calcMixingRatio(e_array[j],200);
            if (mixra3 >= item) {
              allmixr200.push(mixra3);
              Ttuple.push(t_array[j]);
              break;
            }
          }
          allT.push(Ttuple);
        });

        // Mixing Ratio Lines
        var mrline = d3.line()
        //.interpolate("linear")
        .x(function(d,i) { return x(d) + (y(basep)-y(mixp[i]))/tan})
        .y(function(d,i) { return y(mixp[i])} );

        // Draw mixing ratio lines
        skewtbg.selectAll(".mrline")
        .data(allT)
        .enter().append("path")
        .attr("class", "gridline")
        .attr("class", "mrline")
        .attr("clip-path", "url(#clipper)")
        .attr("d", mrline);

        var xVal, yVal, mixR975, roundedMixR;
        allT.forEach( function (item, i) {
          xVal = x(item[1]) + (y(basep) - y(975))/tan;
          yVal = y(975);
          mixR975 = parseFloat(allmixr975[i]);
          if (mixR975 < 3) {
            roundedMixR = mixR975.toFixed(1);
            xVal = xVal-14;
          }
          else {
            roundedMixR = mixR975.toFixed(0);
            if (roundedMixR < 10) {
                xVal = xVal-8;
            }
            else {
                xVal = xVal-12;
            }
          }
        
          if (xVal < 0 || xVal > w || yVal < 0 || yVal > h) {
            return;
          }  

          skewtbg.append("text")
            .attr("transform","translate( " + xVal + " ," + yVal + ")")
            .text(roundedMixR)
            .attr("opacity",".65")
            .attr("class", "skewtext")
            .attr("fill","green");
        });

        // Line along right edge of plot
        skewtbg.append("line")
        .attr("x1", w-0.5)
        .attr("x2", w-0.5)
        .attr("y1", 0)
        .attr("y2", h)
        .attr("class", "gridline");

        // Add axes
        skewtbg.append("g").attr("class", "x axis").attr("transform", "translate(0," + (h-0.5) + ")").call(xAxis);
        skewtbg.append("g").attr("class", "y axis skewtextbold").attr("transform", "translate(-0.5,0)").call(yAxis);
        //skewtbg.append("g").attr("class", "y axis ticks").attr("transform", "translate(-0.5,0)").call(yAxis2);  

        // Add temperature value
        temp.forEach( function (item, i) {
          if (item > 40 || item < -100) return;

          xVal = x(item)-0.5 + (y(basep) - y(basep)/(temp.length-1)*i)/tan - 4;
          yVal = y(basep)/(temp.length-1)*i;

          if (xVal < 0 || xVal > w || yVal < 0 || yVal > h) {
            return;
          }  

          skewtbg.append("text")
            .attr("transform","translate( " + xVal + " ," + yVal + ") rotate(-58)")
            .text(item)
            .attr("opacity","1")
            .attr("class","skewtextbold")
            .attr("fill","brown");
        });
    }
    
    var makeBarbTemplates = function(){
        var speeds = d3.range(0,300,5);
        var barbdef = container.append('defs')
        speeds.forEach(function(d) {
            var thisbarb = barbdef.append('g').attr('id', 'barb'+d);
            var flags = Math.floor(d/50);
            var pennants = Math.floor((d - flags*50)/10);
            var halfpennants = Math.floor((d - flags*50 - pennants*10)/5);
            var px = barbsize;
            // Draw wind barb stems
            thisbarb.append("line").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", barbsize);
            // Draw wind barb flags and pennants for each stem
            for (var i=0; i<flags; i++) {
                thisbarb.append("polyline")
                    .attr("points", "0,"+px+" -10,"+(px)+" 0,"+(px-4))
                    .attr("class", "flag");
                px -= 7;
            }
            // Draw pennants on each barb
            for (i=0; i<pennants; i++) {
                thisbarb.append("line")
                    .attr("x1", 0)
                    .attr("x2", -10)
                    .attr("y1", px)
                    .attr("y2", px+4)
                px -= 3;
            }
            // Draw half-pennants on each barb
            for (i=0; i<halfpennants; i++) {
                thisbarb.append("line")
                    .attr("x1", 0)
                    .attr("x2", -5)
                    .attr("y1", px)
                    .attr("y2", px+2)
                px -= 3;
            }
        });     
    }

    var makeDefs = function(){
        var xsize = 2;
        var xdef = container.append('defs').append('g').attr('id', 'xdef');
        xdef.append("line").attr("x1", -xsize).attr("x2", xsize).attr("y1", -xsize).attr("y2", xsize);
        xdef.append("line").attr("x1", -xsize).attr("x2", xsize).attr("y1", xsize).attr("y2", -xsize);

        xsize = 8;
        var basedef = container.append('defs').append('g').attr('id', 'basedef');
        basedef.append("polyline").attr("points", "0,0 -" + xsize + ",-" + xsize/2 + " -" + xsize + "," + xsize/2);

        var pattern = container.append('defs').append('pattern').attr('id', 'pattern').attr('patternUnits', 'userSpaceOnUse')
                               .attr('width', 4).attr('height', 4).attr('patternTransform', 'rotate(-45 2 2)');
        pattern.append("line").attr("x1", 4).attr("x2", 0).attr("y1", 0).attr("y2", 4).attr("stroke-width", 0.5).attr("stroke", "#000").attr("stroke-dasharray", 1);
        //pattern.append("path").attr("d", "M -1,2 l 6,0").attr("stroke-width", 0.5).attr("stroke", "#000");
    }

    var drawToolTips = function(skewtlines) {
        var lines = skewtlines.reverse();
        // Draw tooltips
        var tmpcfocus = skewtgroup.append("g").attr("class", "focus tmpc").style("display", "none");
        tmpcfocus.append("circle").attr("r", 4);
        tmpcfocus.append("text").attr("x", 9).attr("dy", ".35em");
          
        var dwpcfocus = skewtgroup.append("g").attr("class", "focus dwpc").style("display", "none");
        dwpcfocus.append("circle").attr("r", 4);
        dwpcfocus.append("text").attr("x", -9).attr("text-anchor", "end").attr("dy", ".35em");

        var hghtfocus = skewtgroup.append("g").attr("class", "focus").style("display", "none");
        hghtfocus.append("text").attr("x", 0).attr("text-anchor", "start").attr("dy", ".35em");

        var wspdfocus = skewtgroup.append("g").attr("class", "focus windspeed").style("display", "none");
        wspdfocus.append("text").attr("x", 0).attr("text-anchor", "start").attr("dy", ".35em");   
    
        container.append("rect")
            .attr("class", "overlay")
            .attr("width", w)
            .attr("height", h)
            .on("mouseover", function() { tmpcfocus.style("display", null); dwpcfocus.style("display", null); hghtfocus.style("display", null); wspdfocus.style("display", null);})
            .on("mouseout", function() { tmpcfocus.style("display", "none"); dwpcfocus.style("display", "none"); hghtfocus.style("display", "none"); wspdfocus.style("display", "none");})
            .on("mousemove", function () {        
                var y0 = y.invert(d3.mouse(this)[1]); // get y value of mouse pointer in pressure space
                var i = bisectTemp(lines, y0, 1, lines.length-1);
                var d0 = lines[i - 1];
                var d1 = lines[i];
                var d = y0 - d0.pres > d1.pres - y0 ? d1 : d0;
                tmpcfocus.attr("transform", "translate(" + (x(d.ta) + (y(basep)-y(d.pres))/tan)+ "," + y(d.pres) + ")");
                dwpcfocus.attr("transform", "translate(" + (x(d.td) + (y(basep)-y(d.pres))/tan)+ "," + y(d.pres) + ")");
                hghtfocus.attr("transform", "translate(0," + y(d.pres) + ")");
                tmpcfocus.select("text").text(parseFloat(d.ta).toFixed(1)+"C");
                dwpcfocus.select("text").text(parseFloat(d.td).toFixed(1)+"C");
                hghtfocus.select("text").text("-- "+Math.round(d.hght)+" m");   //hgt or hghtagl ???
                wspdfocus.attr("transform", "translate(" + (w-65)  + "," + y(d.pres) + ")");
                wspdfocus.select("text").text(d.vec + " / " + d.wsd + "m/s");
            });
    }
    
    var plot = function(s, opt){
        if (opt != undefined && opt < 0) {
        }
        else {
          data = s;
          tmpData = JSON.parse(JSON.stringify(s));
        }
        skewtgroup.selectAll("path").remove(); //clear previous paths from skew
        skewtgroup.selectAll("line").remove(); //clear previous paths from skew
        skewtgroup.selectAll("text").remove(); //clear previous paths from skew
        skewtgroup.selectAll("circle").remove(); //clear previous paths from skew
        skewtgroup.selectAll("use").remove(); //clear previous paths from skew
        barbgroup.selectAll("use").remove(); //clear previous paths from barbs

        var item = document.getElementById("skew_index_table");
        while (item.hasChildNodes()) {
          item.removeChild(item.childNodes[0]);
        }

        var item = document.getElementById("skew_hail_table");
        while (item.hasChildNodes()) {
          item.removeChild(item.childNodes[0]);
        }

        //if(data.length==0) return;
        var color = ["red", "blue", "green", "purple"];
        var cnt = 0;

        for (var idx=0; idx<s.length; idx++) {
          if (s[idx] == undefined || s[idx].length == 0) continue;
          cnt++;
        }

        for (var idx=0; idx<s.length; idx++) {
          if (s[idx] == undefined || s[idx].length == 0) continue;

          //skew-t stuff
          var skewtline = s[idx].filter(function(d) { return (d.ta > -999 && d.td > -999 && (d.pres != "SFC" || (d.pres == "SFC" && d.ps != undefined && d.ps > 1000))); });
          var skewtlines = [];
          skewtlines.push(skewtline);

          var skewtline2 = s[idx].filter(function(d) { return (d.ta > -999 && d.td > -999 && ((d.pres != "SFC" && d.pres >= 300) || (d.pres == "SFC" && d.ps != undefined && d.ps > 1000))); });
          var skewtlines2 = [];
          skewtlines2.push(skewtline2);

          calcTw(s[idx]);

          if (cnt == 1) {
            var twline = d3.line().x(function(d,i) { if (d.pres != "SFC") return x(d.tw) + (y(basep)-y(d.pres))/tan; else return x(d.tw) + (y(basep)-y(d.ps))/tan; })
                                  .y(function(d,i) { if (d.pres != "SFC") return y(d.pres); else return y(d.ps); });
            var twlines = skewtgroup.selectAll("twlines")
                .data(skewtlines2).enter().append("path")
                .attr("stroke", "black")
                .attr("class", "tw")
                .attr("clip-path", "url(#clipper)")
                .attr("d", twline);
          }
        
          var templine = d3.line().x(function(d,i) { if (d.pres != "SFC") return x(d.ta) + (y(basep)-y(d.pres))/tan; else return x(d.ta) + (y(basep)-y(d.ps))/tan; })
                                  .y(function(d,i) { if (d.pres != "SFC") return y(d.pres); else return y(d.ps); });
          var templines = skewtgroup.selectAll("templines")
              .data(skewtlines).enter().append("path")
              .attr("stroke", color[idx])
              .attr("class", "temp skline")
              .attr("clip-path", "url(#clipper)")
              .attr("d", templine);

          var tempdewline = d3.line().x(function(d,i) { if (d.pres != "SFC") return x(d.td) + (y(basep)-y(d.pres))/tan; else return x(d.td) + (y(basep)-y(d.ps))/tan; })
                                     .y(function(d,i) { if (d.pres != "SFC") return y(d.pres); else return y(d.ps); });
          var tempDewlines = skewtgroup.selectAll("tempdewlines")
              .data(skewtlines).enter().append("path")
              .attr("stroke", color[idx])
              .attr("class", "dwpt skline")
              .attr("clip-path", "url(#clipper)")
              .attr("d", tempdewline);

          //barbs stuff
          var barbs = s[idx].filter(function(d) { return (parseFloat(d.wsd) > 0 && d.pres >= 100 && d.pres != "SFC" && y(d.pres) >= 0 && y(d.pres) <= h); });
          var allbarbs = barbgroup.selectAll("barbs")
              .data(barbs).enter().append("use")
              .attr("stroke", color[idx])
              .attr("fill", color[idx])
              .attr("xlink:href", function (d) { return "#barb"+Math.round(convert(d.wsd, "kt")/5)*5; }) // 0,5,10,15,... always in kt
              .attr("transform", function(d,i) { return "translate("+(w+idx*30)+","+y(d.pres)+") rotate("+(d.vec-180)+")"; });           

          //mouse over
          //drawToolTips(skewtlines[0]);

          //skew-index
          var dset = s[idx].slice();

          if (document.getElementById("model"+parseInt(idx+1)).value == "OBS") {
            for (var k=0; k<dset.length; k++) {
              if (dset[k].pres != -999 && dset[k].ta != -999 && dset[k].td != -999) {
                var base = parseFloat(dset[k].pres);
                break;
              }
            }
          }
          else {
            var base = 1000;
          }

          for (var k=0; k<dset.length; k++) {
            if ((dset[k].pres == "SFC" && dset[k].ps == undefined) || parseFloat(dset[k].ta) <= -999.0 || parseFloat(dset[k].td) <= -999.0 || parseFloat(dset[k].pres) < 100.0) {
              dset.splice(k,1);
              k--;
            }
            else if (dset[k].pres == "SFC" && dset[k].ps != undefined) {
              base = parseFloat(dset[k].ps);
              s[idx].base = base;
              var d = {};
              d.pres = parseFloat(dset[k].ps);
              d.ta = parseFloat(dset[k].ta);
              d.td = parseFloat(dset[k].td);
              d.gh = -999.;
              dset.splice(k,1);
              if (base < 1000) {
                k--;
              }
              else {
                dset.unshift(d);
              }
            }
          }

          if (s[idx].base == undefined) {
            s[idx].base = base;
          }

          if (s[idx].tmpBase == undefined) {
            s[idx].tmpBase = base;
          }

          for (var k=0; k<dset.length; k++) {
            if (dset[k].pres > s[idx].tmpBase) {
              var dtmp = {};
              dtmp.pres = dset[k].pres;
              dtmp.ta = dset[k].ta;
              dtmp.td = dset[k].td;
              dset.splice(k,1);
              k--;
            }
          }

          if (dset[0].pres != undefined && dset[0].pres != s[idx].tmpBase && dtmp != undefined) {
            var d = {};
            d.pres = s[idx].tmpBase;
            d.ta = parseFloat(dtmp.ta) - (parseFloat(dtmp.ta) - parseFloat(dset[0].ta))/(parseFloat(dtmp.pres) - parseFloat(dset[0].pres)) * (parseFloat(dtmp.pres) - parseFloat(s[idx].tmpBase));
            d.td = parseFloat(dtmp.td) - (parseFloat(dtmp.td) - parseFloat(dset[0].td))/(parseFloat(dtmp.pres) - parseFloat(dset[0].pres)) * (parseFloat(dtmp.pres) - parseFloat(s[idx].tmpBase));
            d.gh = -999.;
            dset.unshift(d);
          }
          //console.log(dset);

          //skewT base
          if (y(s[idx].tmpBase) >= 0 && y(s[idx].tmpBase) <= h) {
            if (document.getElementById("skew_change").classList.contains("selected")) {
              skewtgroup.append("use")
              .attr("stroke", color[idx])
              .attr("fill", color[idx])
              .attr("xlink:href", "#basedef")
              .attr("transform", "translate(-6," + y(s[idx].tmpBase) + ")")
              .style('cursor', 'pointer')
              .attr('data-idx', idx)
              .call(basedrag);

              skewtgroup.append("line")
              .attr("stroke", color[idx])
              .attr("x1", 0)
              .attr("x2", w)
              .attr("y1", y(s[idx].tmpBase))
              .attr("y2", y(s[idx].tmpBase))
              .attr("stroke-width", 2)
              .style('cursor', 'pointer')
              .attr('data-idx', idx)
              .call(basedrag);
            }
            else {
              skewtgroup.append("line")
              .attr("stroke", color[idx])
              .attr("x1", 0)
              .attr("x2", w)
              .attr("y1", y(s[idx].tmpBase))
              .attr("y2", y(s[idx].tmpBase))
              .attr("stroke-width", 1)
            }
          }
          //console.log(dset);

          var lfc = {};
          var lcl = calcLcl(parseFloat(dset[0].pres), parseFloat(dset[0].ta), parseFloat(dset[0].td));
          var ccl = calcCcl(dset);
          if (ccl.p >= lcl.p) {
            ccl.p = lcl.p;
            ccl.t = lcl.t;
            lfc.p = lcl.p;
            lfc.t = lcl.t;
          }
          else {
            lfc = calcLfc(dset, lcl);
          }
          var el = calcEl(dset, lcl, ccl, lfc);
          var cape = calcCape(dset, lcl, ccl, lfc, el);
          var cin = calcCin(dset, lcl, ccl, lfc, el);
          var hail = calcHailSize(dset, ccl);
          var cvt = calcCVT(dset, ccl);

          s[idx].lcl = lcl;
          s[idx].ccl = ccl;
          s[idx].lfc = lfc;
          s[idx].el = el;
          s[idx].cape = cape;
          s[idx].cin = cin;
          s[idx].hail = hail;
          s[idx].cvt = cvt;

          if (table_button == parseInt(idx)+1) {
            tableIndexDisp(s[idx]);
          }

          if (document.getElementById("skew_index").classList.contains("selected")) {
            if (cape.value > 0) {
              var capeline = d3.line().x(function(d,i) { return x(d.ta) + (y(basep)-y(d.pres))/tan; }).y(function(d,i) { return y(d.pres); });
              var capeLines = skewtgroup.selectAll("capelines")
                .data([cape.polygon]).enter().append("path")
                //.attr("stroke", color[idx])
                .attr("fill", color[idx])
                .attr("fill-opacity", 0.3)
                //.attr("class", function(d,i) { return (i<10) ? "temp skline" : "temp mean" })
                .attr("clip-path", "url(#clipper)")
                .attr("d", capeline);
            }

            if (cin.value > 0 && cin.polygon != undefined && cin.polygon.length > 0) {
              //console.log(cin.polygon);
              var cinline = d3.line().x(function(d,i) { return x(d.ta) + (y(basep)-y(d.pres))/tan; }).y(function(d,i) { return y(d.pres); });
              var cinLines = skewtgroup.selectAll("cinlines")
                .data([cin.polygon]).enter().append("path")
                .attr("stroke", color[idx])
                .attr("stroke-width", 0.5)
                .attr("stroke-dasharray", 3)
                .attr("fill", "url(#pattern)")
                //.attr("class", function(d,i) { return (i<10) ? "temp skline" : "temp mean" })
                .attr("clip-path", "url(#clipper)")
                .attr("d", cinline);
            }

            if (lcl.p != -999 && lcl.p > 100) {
              xVal = x(lcl.t-273.15) + (y(basep)-y(lcl.p))/tan;
              yVal = y(lcl.p);

              if (xVal >= 0 && xVal <= w && yVal >= 0 && yVal <= h) {
                skewtgroup.append("line")
                .attr("x1", xVal)
                .attr("x2", xVal - 20)
                .attr("y1", yVal)
                .attr("y2", yVal)
                .attr("stroke", color[idx])
                .attr("stroke-width", 0.75)
                .attr("clip-path", "url(#clipper)");

                skewtgroup.append("text")
                .attr("x", xVal - 40)
                .attr("y", yVal + 3)
                .text("LCL")
                .attr("class", "skewtext")
                .attr("fill", color[idx]);

                skewtgroup.append("use")
                .attr("stroke", color[idx])
                .attr("fill", color[idx])
                .attr("xlink:href", "#xdef")
                .attr("transform", "translate("+xVal+","+yVal+")"); 
              }
            }

            if (ccl.p != -999 && ccl.p > 100 && ccl.t != lcl.t && ccl.p != lcl.p) {
              xVal = x(ccl.t-273.15) + (y(basep)-y(ccl.p))/tan;
              yVal = y(ccl.p);

              if (xVal >= 0 && xVal <= w && yVal >= 0 && yVal <= h) {
                skewtgroup.append("line")
                .attr("x1", xVal)
                .attr("x2", xVal + 20)
                .attr("y1", yVal)
                .attr("y2", yVal)
                .attr("stroke", color[idx])
                .attr("stroke-width", 0.75)
                .attr("clip-path", "url(#clipper)");

                skewtgroup.append("text")
                .attr("x", xVal + 25)
                .attr("y", yVal + 3)
                .text("CCL")
                .attr("class", "skewtext")
                .attr("fill", color[idx]);

                skewtgroup.append("use")
                .attr("stroke", color[idx])
                .attr("fill", color[idx])
                .attr("xlink:href", "#xdef")
                .attr("transform", "translate("+xVal+","+yVal+")"); 
              }
            }

            if (lfc.t != -999 && lfc.t != lcl.t && lfc.p != lcl.p) {
              xVal = x(lfc.t-273.15) + (y(basep)-y(lfc.p))/tan;
              yVal = y(lfc.p);

              if (xVal >= 0 && xVal <= w && yVal >= 0 && yVal <= h) {
                skewtgroup.append("line")
                .attr("x1", xVal)
                .attr("x2", xVal - 20)
                .attr("y1", yVal)
                .attr("y2", yVal)
                .attr("stroke", color[idx])
                .attr("stroke-width", 0.75)
                .attr("clip-path", "url(#clipper)");

                skewtgroup.append("text")
                .attr("x", xVal - 40)
                .attr("y", yVal + 3)
                .text("LFC")
                .attr("class", "skewtext")
                .attr("fill", color[idx]);

                skewtgroup.append("use")
                .attr("stroke", color[idx])
                .attr("fill", color[idx])
                .attr("xlink:href", "#xdef")
                .attr("transform", "translate("+xVal+","+yVal+")"); 
              }
            }

            if (el.t != -999 && el.p != lfc.p) {
              xVal = x(el.t-273.15) + (y(basep)-y(el.p))/tan;
              yVal = y(el.p);

              if (xVal >= 0 && xVal <= w && yVal >= 0 && yVal <= h) {
                skewtgroup.append("line")
                .attr("x1", xVal)
                .attr("x2", xVal + 20)
                .attr("y1", yVal)
                .attr("y2", yVal)
                .attr("stroke", color[idx])
                .attr("stroke-width", 0.75)
                .attr("clip-path", "url(#clipper)");

                skewtgroup.append("text")
                .attr("x", xVal + 25)
                .attr("y", yVal + 3)
                .text("EL")
                .attr("class", "skewtext")
                .attr("fill", color[idx]);

                skewtgroup.append("use")
                .attr("stroke", color[idx])
                .attr("fill", color[idx])
                .attr("xlink:href", "#xdef")
                .attr("transform", "translate("+xVal+","+yVal+")"); 
              }
            }
            //console.log(lcl, ccl, lfc, el, cape);
          }

          //skewT value change
          if (document.getElementById("skew_change").classList.contains("selected")) {
              skewtgroup.selectAll("draggable-td")
              .data(skewtline).enter().append("circle")
              .attr("r", 3)
              .attr("cx", function(d) { if (d.pres != "SFC") return x(d.td) + (y(basep)-y(d.pres))/tan; else return x(d.td) + (y(basep)-y(d.ps))/tan; })
              .attr("cy", function(d) { if (d.pres != "SFC") return y(d.pres); else return y(d.ps); })
              .attr("stroke", color[idx])
              .attr("fill", color[idx])
              .attr("fill-opacity", 0)
              .style('cursor', 'pointer')
              .attr('data-idx', idx)
              .attr('data-type', 'td')
              .attr('data-pres', function(d) { return d.pres; })
              .attr("clip-path", "url(#clipper)")
              .call(skewdrag);

              skewtgroup.selectAll("draggable-ta")
              .data(skewtline).enter().append("circle")
              .attr("r", 3)
              .attr("cx", function(d) { if (d.pres != "SFC") return x(d.ta) + (y(basep)-y(d.pres))/tan; else return x(d.ta) + (y(basep)-y(d.ps))/tan; })
              .attr("cy", function(d) { if (d.pres != "SFC") return y(d.pres); else return y(d.ps); })
              .attr("fill", color[idx])
              .style('cursor', 'pointer')
              .attr('data-idx', idx)
              .attr('data-type', 'ta')
              .attr('data-pres', function(d) { return d.pres; })
              .attr("clip-path", "url(#clipper)")
              .call(skewdrag);
          }
        }
    }

    var clear = function(s){
        skewtgroup.selectAll("path").remove(); //clear previous paths from skew
        skewtgroup.selectAll("line").remove(); //clear previous lines from skew
        barbgroup.selectAll("use").remove(); //clear previous paths from barbs
        //must clear tooltips!
        container.append("rect")
            .attr("class", "overlay")
            .attr("width", w)
            .attr("height", h)
            .on("mouseover", function(){ return false;})
            .on("mouseout", function() { return false;})
            .on("mousemove",function() { return false;});
    }
    
    //assings functions as public methods
    this.drawBackground = drawBackground;
    this.plot = plot;
    this.clear = clear;
    
    //init 
    setVariables();
    resize();


    //zoom
    var zoom = d3.zoom()
                 .scaleExtent([1,5])// <1 means can resize smaller than  original size
                 .translateExtent([[0,0],[w,h]])
                 .extent([[0,0],[w,h]])//view point size
                 .on("zoom",zoomed);

    svg.call(zoom);

    function zoomed(opt, i){  
      if (opt != -1) {
        x.domain(d3.event.transform.rescaleX(xNavi).domain());
        y.domain(d3.event.transform.rescaleY(yNavi).domain());
        drawBackground();
        plot(tmpData, -1);
      }
      else {
        drawBackground();
        plot(tmpData, -1);
      }
    }

};