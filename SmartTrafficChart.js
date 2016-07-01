"user direct"
function inherit(base, derived) {

    if (Object.create) {
        derived.prototype = Object.create(base.prototype);
    } else {
        var f = function f() {};
        f.prototype = base.prototype;
        derived.prototype = new f();
    }

    derived.prototype.constructor = derived;

    return derived;
}
var eventManager = {
    addEventHandler: function(type, callback) {
        if (!this._events) this._events = {};
        if (!this._events[type]) this._events[type] = [];
        if (this._events[type].indexOf(callback) < 0) this._events[type].push(callback);
        return this;
    },
    removeEventHandler: function(type, callback) {
        if (this._events && this._events[type]) {
            this._events[type].forEach(function(v, i, events) {
                if (v === callback) delete events[i];
            });
        }
        return this;
    },
    callEventHandler: function(type, data) {
        if (this._events && this._events[type]) {
            this._events[type].forEach(function(v) {
                v(data, this);
            })
        }
        return this;
    }
};
var colorManager = {
    getColor:function(i){
        if(! this._colors) colorManager.init.call(this);
     
        this._colorIndex %= this._colors.length;
        return this._colors[this._colorIndex++] ;
    },
    init:function(){
        this._colors =["#FF6666","#0099CC","#336633","#CC0033","#FFCC00"];
        this._colorIndex =0;
    }
}
var SmartTrafficLineChart = function(option) {
    this.datas = [];
    this.svg = null;
    this.appendId = null;
    this.option = option;
    this.width = option.width || "100%";
    this.height = option.height || 50;
    this.title = option.title;
    this.xTitle = option.xTitle;
    this.yTitle = option.yTitle;
    this.secondTitle = option.secondTitle;
    this._calculateMargin();

};
SmartTrafficLineChart.prototype.constructor = SmartTrafficLineChart;
SmartTrafficLineChart.prototype = {
    addData: function(data) {
        data = this._parseData(data);
        var _i = -1;
        for (var i in this.datas) {
            if (this.datas[i].id === data.id) {
                _i = i;
                break;
            }
        }
        if (_i !== -1) {
            this.datas.splice(_i , 1, data);
        } else {
            this.datas.push(data);
        }
        if (this.svg) this._reDraw();
    },
    _parseData: function(data) {
        var _d = {};
        _d.name = data.name;
        if(data.id === undefined) {
            if(data.name === undefined){
                _d.id =  "smartTraffic" + this.datas.length;
            }else{
                _d.id = data.name;
            }   
        }else{
            _d.id = data.id;
        }
       // _d.id = data.id || data.name || "smartTraffic" + this.datas.length;
        if (data.option) {
            _d._d = data.data;
            if (data.option.x) _d._d = _d._d.map(function(v) {
                v.x = v[data.option.x];
                delete v[data.option.x];
                return v;
            });
            if (data.option.y) {
                _d._d = _d._d.map(function(v) {
                    v.y = v[data.option.y];
                    delete v[data.option.y];
                    return v;
                });
            }
            _d.color =data.option.color || this._getColor();
            _d.baseWidth = data.option.width || 2;
        } else {
            _d._d = data.data;
            _d.color = this._getColor();
            _d.baseWidth = 2;
        }
        _d._d = _d._d.sort(function(v1,v2){
            return v1.x>v2.x;
        })
        return _d;
    },
    _getColor:function(){
       return  colorManager.getColor.call(this);
    },
    addFlowData: function(name, _d, option) {
        var _t = this.datas.find(function(v) {
            if (v.name === name) return true;
            return false;
        })
        if (!_t) {
            _t = {
                "name": name,
                "_d": [],
                "option": option
            };
            this.datas.push(_t);
        }
        _d.y = Math.sin(16 * Math.PI / 360 * _d.x);
        _t._d.push(_d);
        if (_t._d.length > 45) {
            _t._d.shift();
        }
        if (this.svg) this._reDraw();
    },
    _calculateMargin: function() {
        this._yTitleWidth =50;
        this._yAxisWidth = 30;
        this._chartWidth = Math.floor((this.width - this._yTitleWidth - this._yAxisWidth)*0.8);
        this._infoBarMargin = 20;
        this._infoBarWidth = Math.floor((this.width - this._yTitleWidth - this._yAxisWidth)*0.2) -20;

        if (this.secondTitle) {
            this._titleHeight = Math.max(1, Math.floor(this.height * 0.12));
            this._chartHeight = Math.floor(this.height * 0.78);
            this._xAxisHeight = Math.floor(this.height * 0.025);
            this._xTitleHeight = Math.max(1, Math.floor(this.height * 0.075));
        } else {
            this._titleHeight = Math.max(1, Math.floor(this.height * 0.075));
            this._chartHeight = Math.floor(this.height * 0.825);
            this._xAxisHeight = Math.floor(this.height * 0.025);
            this._xTitleHeight = Math.max(1, Math.floor(this.height * 0.075));
        }



        return this;
    },
    _drawAxisXLine: function() {

    },
    _drawAxis: function() {
        var self = this;
        this._xAxis = this.svg.drawArea.x.append("svg:g")
            .attr("transform", "translate(0," + (this._chartHeight) + ")")
            .attr("class","xaxis")
            .call(d3.svg.axis().scale(self._xScale).orient("bottom").tickFormat(function(d) {
                return d;
            }))
            .classed("axis", true);
         //x.selectAll("g").append("line").attr("x2",0).attr("x1",0).attr("y1",0).attr("y2", - self._chartHeight).attr("stroke-width",1).attr("stroke","black").attr("opacity","0.2");

        this._yAxis = this.svg.drawArea.y.append("svg:g")
            .attr("class","yaxis")
            .call(d3.svg.axis().scale(this._getYScale()).orient("left"))
            .classed("axis", true);
          this._yAxis.selectAll("g").append("line").attr("x2",self._chartWidth ).attr("x1",0).attr("y1",0).attr("y2",0).attr("stroke-width",1).attr("stroke","black").attr("opacity","0.2");
    },
    _drawLine: function(data) {
        var self = this;
        var lineGen = d3.svg.line()
            .x(function(d) {
                return self._xScale(d.x);
            })
            .y(function(d) {
                return self._getYScale()(d.y);
            });
        var _line = this.svg.drawArea.chart.append("path")
            .attr('d', lineGen(data._d))
            .attr("class","line")
            .attr('stroke', data.color)
            .attr('stroke-width', data.baseWidth)
            .attr('fill', 'none');
        return _line;
    },
    _drawCircles: function(data) {
        var self = this;
        var g = this.svg.drawArea.chart.append("g");
        var _circle = g.selectAll("linepoint")
            .data(data._d)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return self._xScale(d.x);
            })
            .attr("cy", function(d) {
                return self._getYScale()(d.y);
            })
            .attr("r", function(d) {
                return 2 * data.baseWidth;
            }).attr("fill", data.color)
            .on("mouseover", function() {
                return self.svg.toolTip.style("visibility", "visible");
            })
            .on("mousemove", function(d) {
                return self.svg.toolTip.style("top", (event.pageY -10) + "px").style("left", (event.pageX +10) + "px").text("X :"+d.x +"   Y: "+d.y);
            })
            .on("mouseout", function() {
                return self.svg.toolTip.style("visibility", "hidden");
            });
            // .append("svg:title").text( function(d){return "X :"+d.x +"   Y: "+d.y});
        g.on("click", function() {
            if (data.isSelected) {
                eventManager.callEventHandler.call(self, "deSelect", data);
               data.isSelected= false;
            } else {
                eventManager.callEventHandler.call(self, "select", data);
               data.isSelected = true;
            }
             event.stopPropagation();
              self._setSelectStyle();
        });
        return g;
    },
    _drawInfoBar: function(data, i) {
        var self = this;
        var g = this.svg.infoBar.append("g");
        var rects = g.append("rect")
            .attr("height", 21)
            .attr("width", this._infoBarWidth)
            .attr("y", i * 16 * data.baseWidth - 4 * data.baseWidth)
            .attr("x", -5 * data.baseWidth)
            .attr("fill", "transparent");

        var circleList = g
            .append("circle")
            .attr("cx", function(d) {
                return 0;
            })
            .attr("cy", function() {
                return i * 16 * data.baseWidth;
            })
            .attr("r", function(d) {
                return 4 * data.baseWidth;
            })
            .attr("fill", function(d, i) {
                return data.color;
            })
           .append("svg:title").text("haha");
        var nameList = g
            .append("text")
            .attr("x", 6 * data.baseWidth)
            .attr("y", i * 16 * data.baseWidth + 3 * data.baseWidth)
            .text(data.name);

        g.on("mouseover", function(d) {
                d3.select(this).select("rect").attr("fill", "rgb(240,240,240)");
                eventManager.callEventHandler.call(self, "mouseover", data);
            })
            .on("mouseout", function(d) {
                eventManager.callEventHandler.call(self, "mouseout", data);
                d3.select(this).select("rect").attr("fill", "transparent");
            });

        g.on("click", function() {
            if (data.isSelected) {
                eventManager.callEventHandler.call(self, "deSelect", data);
                data.isSelected = false;
            } else {
                data.isSelected = true;
                eventManager.callEventHandler.call(self, "select", data);
            }
            event.stopPropagation();
            self._setSelectStyle();
        });
        return g;

    },
    _drawTitles: function() {
        this.svg.xTitleBar.append("text").text(this.xTitle).attr("dominant-baseline", "text-after-edge");
        this.svg.yTitleBar.append("text").text(this.yTitle).attr("transform", "rotate(-90)").attr("dominant-baseline", "text-before-edge");
        this.svg.titleBar.append("text").text(this.title).attr("dominant-baseline", "text-before-edge").classed("titleBar", true);
        this.svg.titleBar.append("text").text(this.secondTitle).attr("dominant-baseline", "text-before-edge").attr("dy", this._titleHeight / 2);
    },
    _initDraw:function(){
        var self = this;
      
        this.svgContainer = d3.select("#" + this.appendId)
            .append("div")
            .attr("width", this.width)
            .attr("height", this.height)
        this.svg = this.svgContainer
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .classed("noselect", true);
           
        this.svg.append("defs").append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("width", this._chartWidth)
                .attr("height", this._chartHeight);
        d3.select("body")
            .select("#tooltip").remove();
        this.svg.toolTip = d3.select("body") .append("div")  
            .attr("class", "tooltip")
            .attr("id","tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden");
        this.svg.drawArea = this.svg.append("g")
            .attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth) + "," + this._titleHeight + ")");
        this.svg.drawArea.chartArea = this.svg.drawArea.append("rect")
                                                                            .attr("width",this._chartWidth)
                                                                            .attr("height", this._chartHeight)
                                                                            .attr("fill","white") 
                                                                            .on("click",function(){ 
                                                                                if (d3.event.defaultPrevented) {
                                                                                       return;
                                                                                }       
                                                                                self._deselectAll.call(self);
                                                                            });
                                                                            
                                                         
        this.svg.drawArea.x = this.svg.drawArea.append("g");
        this.svg.drawArea.y = this.svg.drawArea.append("g");
        this.svg.drawArea.chart=this.svg.drawArea.append("g")
                                                             .attr("clip-path", "url(#clip)");
  
        this.svg.yTitleBar = this.svg.append("g").attr("transform", "translate(1," + (this._titleHeight + this._chartHeight / 2) + ")").classed("titleBar", true).attr("text-anchor", "middle");
        this.svg.titleBar = this.svg.append("g").attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth / 2 + this._chartWidth / 2) + ",1)").attr("text-anchor", "middle");
        this.svg.infoBar = this.svg.append("g").attr("transform", "translate(" + (this._chartWidth + this._yAxisWidth + this._yTitleWidth + this._infoBarMargin) + "," + this._titleHeight + ")").classed("infoBar", true);
        this.svg.xTitleBar = this.svg.append("g").attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth / 2 + this._chartWidth / 2) + "," + (this.height) + ")").classed("titleBar", true).attr("text-anchor", "middle");
        this._xScale =d3.scale.linear()
            .range([0, this._chartWidth])
            .domain([this._getMinXData(), this._getMaxXData()]);
        var zoom = d3.behavior.zoom()
                                                .x(self._getXScale())
                                                .scaleExtent([1,4])
                                                .on("zoom",self._zoomed.bind(self));
        this.svg.drawArea.chartArea.call(zoom);
        
         },
       _drawChart:function(datas){
           var self  = this;
           datas.forEach(function(v){
                v.figure = v.figure ||{};
               if( v.figure .circles)  v.figure .circles.remove();
                v.figure .circles = self._drawCircles(v);
               if( v.figure .line)  v.figure .line.remove();
                v.figure .line = self._drawLine(v);
           });
       },
     _drawInfoBars:function(datas){
          var self  = this;
           datas.forEach(function(v,i){
               v.figure = v.figure ||{};
               if( v.figure.infoBar)  v.figure.infoBar.remove();
                v.figure.infoBar = self._drawInfoBar(v,i);
           });
       },
    _draw: function() {
        var self = this;

        this._drawAxis();
        this._drawTitles();
        
        this._drawChart(this.datas);
        this._drawInfoBars(this.datas);
         this._setSelectStyle();
    },
    appendTo: function(id) {
       
        this.appendId = id;
         this._initDraw();
        this._draw();
    },
    _reDraw: function() {
       // if (this.svg) this.svg.remove();
        if(this.svgContainer) this.svgContainer.remove();
        if (this._xScale) this._xScale = null;
        if (this._yScale) this._yScale = null;
        this._calculateMargin();
        this._initDraw();
        this._draw();
    },
    _getXScale: function() {
        this._xScale = this._xScale || d3.scale.linear()
            .range([0, this._chartWidth])
            .domain([this._getMinXData(), this._getMaxXData()]);
        return this._xScale;
    },
    _getYScale: function() {
        this._yScale = this._yScale || d3.scale.linear()
            .range([0, this._chartHeight])
            .domain([this._getMaxYData(), this._getMinYData()]).nice(5);
        return this._yScale;
    },
    _getMaxXData: function() {
        var _num = Number.MIN_VALUE;
        this.datas.forEach(function(d) {
            d._d.forEach(function(v) {
                _num = Math.max(v.x, _num);
            });
        });
        return _num;
    },
    _getMinXData: function() {
        var _num = Number.MAX_VALUE;
        this.datas.forEach(function(d) {
            d._d.forEach(function(v) {
                _num = Math.min(v.x, _num);
            });
        });
        return _num;
    },
    _getMaxYData: function() {
        var _num = Number.MIN_VALUE;
        this.datas.forEach(function(d) {
            d._d.forEach(function(v) {
                _num = Math.max(v.y, _num);
            });
        });
        return _num;
    },
    _getMinYData: function() {
        var _num = Number.MAX_VALUE;
        this.datas.forEach(function(d) {
            d._d.forEach(function(v) {
                _num = Math.min(v.y, _num);
            });
        });
        return _num;
    },
    setHeight: function(height) {
        this.height = height;
        this._reDraw();
    },
    setWidth: function(width) {
        this.width = width;
        this._reDraw();
    },
    _setSelectStyle:function(){
        var self =this;
        var hasSelect = !( this.datas.find(function(v){ return v.isSelected;}) === undefined);
        if(hasSelect){
            this.datas.forEach(function(v){
                v.figure.circles.classed("notSelected",!v.isSelected);
                 v.figure.line.classed("notSelected",!v.isSelected);
                 v.figure.infoBar.classed("notSelected",!v.isSelected);
            });
        }else{
          this.datas.forEach(function(v){  
                   v.figure.circles.classed("notSelected",false);
                   v.figure.line.classed("notSelected",false);
                   v.figure.infoBar.classed("notSelected",false);
            })
        }
    },
    _deselectAll:function(){
        var self = this;
        self.datas.forEach(function(v){
            delete v.isSelected;
        });
        self._setSelectStyle();
    },
    _zoomed:function(){
        var self = this;
        this.svg.drawArea.select("g.xaxis").call(d3.svg.axis().scale(this._xScale).orient("bottom").tickFormat(function(d) {
                return d;
        }));
         self.svg.toolTip.style("visibility", "hidden");
        this._drawChart(this.datas,this._figures);
        this._setSelectStyle();
    //    this.svg.drawArea.selectAll("path.line").attr("transform", "translate(" + d3.event.translate[0] + ",0)scale(" + d3.event.scale + ", 1)");
      //  this.svg.drawArea.selectAll("circle").attr("transform", "translate(" + d3.event.translate[0] + ",0)scale(" + d3.event.scale + ", 1)");
    },
    addEventHandler: function(type, callback) {
        eventManager.addEventHandler.call(this, type, callback);
    },
    removeEventHandler: function(type, callback) {
        eventManager.removeEventHandler.call(this, type, callback);
    }
};