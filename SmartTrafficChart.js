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
    getColor: function(i) {
        if (!this._colors) this.init();

        this._colorIndex %= this._colors.length;
        return this._colors[this._colorIndex++];
    },
    init: function() {
        this._colors = ["#FFCC66", "#5CBAE6", "#993366", "#669966", "#CCC5A8", "#D998CB", "#660066", "#FAC364", "#CC3300", "#66CC00", "#000066", "#00FF00", "#FF0066"];
        this._colorIndex = 0;
        console.log(this);
    },
    reset: function() {
        this._colorIndex = 0;
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
    this.y2Title = option.y2Title;
    this.secondTitle = option.secondTitle;
    this._calculateMargin();
    this.xType = "time";

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
            this.datas[i][data.type] = data[data.type];
            data[data.type]._parent = this.datas[i];
        } else {
            this.datas.push(data);
        }
        this._xSet(true);
        if (this.svg) this._reDraw();
    },
    removeData: function(id, type) {
        var _i = -1;
        for (var i in this.datas) {
            if (this.datas[i].id === id) {
                _i = i;
                break;
            }
        }
        if (_i !== -1) {
            if (type === undefined) this.datas.splice(i, 1);
            else {
                delete this.datas[i][type];
                //todo find empty data;
            }

        } else {
            return;
        }
        this._xSet(true);
        if (this.svg) this._reDraw();
    },
    _xSet: function(isUpdata) {
        if (!isUpdata) return this.xSet;
        var self = this,
            datas = this.datas;
        this.xSet = [];
        datas.forEach(function(data) {
            for(var i in data){
               if(data[i].getAllX){
                   var values = data[i].getAllX();
                   values.forEach(function(v){
                       if(!self.xSet.find(function(x){return x -v ===0;})){
                           self.xSet.push(v);
                       }
                   })
               }
           }
        });
        this.xSet = this.xSet.sort(function(v1, v2) {
            return v1 - v2;
        });
        return this.xSet;
    },
    _getXSetIndex: function(obj) {
        if (!this._xSet()) return -1;
        var _index = -1,
            set = this._xSet();
        for (var i = 0; i < set.length; ++i) {
            if (set[i] - obj === 0) {
                _index = i;
                break;
            }
        }
        return _index;
    },
    _parseData: function(originData) {
        var data = {},
            self = this;
        data.name = originData.name;
        data.id = originData.id;
        if (originData.id === undefined) {
            data.id = "smartTraffic" + this.datas.length;
        }
        if (originData.option) {
            data.type = originData.option.type || "line";
            if (data.type === "line") {
                data.line = LineBaseClass.create(originData, data, self);
            }
            if (data.type === "spline") {
                data.spline = SpLine.create(originData, data, self);
            }
            if (data.type === "area") {
                data.area = Area.create(originData, data, self);
            }
            if (data.type === "bar") {
                data.bar = Bar.create(originData, data, self);
            }
             if (data.type === "boxplot") {
                data.boxplot = BoxPlot.create(originData, data, self);
            }
            data.color = originData.option.color || this._getColor();

            // var option = originData.option;
            // data.type = option.type || "line";
            // data[data.type]={};
            // data.color = option.color || this._getColor();
            // data[data.type].baseWidth = option.width || 2;
            // data[data.type]._d = originData.data;
            // if(option.x){
            //       data[data.type]._d.forEach(function(d){
            //          d.x = d[option.x];
            //          delete d[option.x];
            //      })
            // }
            // if(option.y){
            //       data[data.type]._d.forEach(function(d){
            //          d.y = d[option.y];
            //          delete d[option.y];
            //      })
            // }
            //  if(option.y2){
            //       data[data.type].y2 = true;
            //       data[data.type]._d.forEach(function(d){
            //          d.y2 = d[option.y2];
            //          delete d[option.y2];
            //      })
            // }
            // if(self.xType === "time"){
            //     data[data.type]._d.forEach(function(d){
            //             if(typeof d.x !== "time") d.x = new Date(d.x);
            //     })
            // }
            // data[data.type]._d.forEach(function(d){
            //       d._parent = data[data.type];
            //   })

            // data[data.type]._d.sort(function(v1,v2){
            //     return v1.x -v2.x;
            // });
            // data[data.type]._parent = data;
            // delete data.type;
        } else {
            throw new Error("no data option ");
        }
        return data;
    },
    _hasY2: function() {
        var find = false;
        this.datas.forEach(function(d) {
            if (d.line) {
                find = d.line.y2 || false;
            }
            if (d.area) {
                find = d.area.y2 || false;
            }
            if (d.spline) {
                find = d.spline.y2 || false;
            }
            if (d.bar) {
                find = d.bar.y2 || false;
            }
        })
        return find;
    },
    _getColor: function() {
        return colorManager.getColor();
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
        this._yTitleWidth = 20;
        this._yAxisWidth = 40;
        this._chartWidth = Math.floor((this.width - this._yTitleWidth - this._yAxisWidth) * 0.8);
        this._infoBarMargin = 20;
        this._infoBarWidth = Math.floor((this.width - this._yTitleWidth - this._yAxisWidth) * 0.2) - 20;
        if (this._hasY2()) {
            this._y2AxisWidth = 40;
            this._y2TitleWidth = 20;
            this._chartWidth = Math.floor((this.width - this._yTitleWidth - this._yAxisWidth - this._y2TitleWidth - this._y2AxisWidth) * 0.8);
            this._infoBarWidth = Math.floor((this.width - this._yTitleWidth - this._yAxisWidth - this._y2AxisWidth - this._y2TitleWidth) * 0.2) - 20;
        }
        if (this.secondTitle) {
            this._titleHeight = 55;
            this._xAxisHeight = 25;
            this._xTitleHeight = 25;
            this._chartHeight = this.height - this._titleHeight - this._xAxisHeight - this._xTitleHeight;
        } else {
            this._titleHeight = 35;
            this._xAxisHeight = 25;
            this._xTitleHeight = 25;
            this._chartHeight = this.height - this._titleHeight - this._xAxisHeight - this._xTitleHeight;
        }
        return this;
    },

    _drawGuideLine: function(point) {
        var self = this;
        var xScale = self._getXScale(),
            yScale = point._parent.y2 ? self._getY2Scale() : self._getYScale();
        if (!self._guideLineGroup) self._guideLineGroup = this.svg.drawArea.chart.append("g").attr("class", "guide-lines");
        point._parent.getY(point).forEach(function(v) {
            if (point._parent.y2) {
                self._guideLineGroup
                    .append("line")
                    .attr("x1", xScale(point._parent.getX(point)[0]))
                    .attr("y1", yScale(v))
                    .attr("x2", self._chartWidth)
                    .attr("y2", yScale(v))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", "1,1");
            } else {
                self._guideLineGroup
                    .append("line")
                    .attr("x1", xScale(point._parent.getX(point)[0]))
                    .attr("y1", yScale(v))
                    .attr("x2", 0)
                    .attr("y2", yScale(v))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", "1,1");
            }
        });
        var minY = Number.MAX_VALUE;
        point._parent.getY(point).forEach(function(v) {
            minY = Math.min(minY, yScale(v));
        });
        if (self._guideLineGroup.yLine) {
            minY = Math.min(minY, Number(self._guideLineGroup.yLine.attr("y1")));
            self._guideLineGroup.yLine.remove();
        }
        self._guideLineGroup.yLine = self._guideLineGroup
            .append("line")
            .attr("x1", xScale(point._parent.getX(point)[0]))
            .attr("y1", minY)
            .attr("x2", xScale(point._parent.getX(point)[0]))
            .attr("y2", self._chartHeight)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "1,1");

    self.svg.selectAll(".yAxisGuideLine").attr("visibility","hidden");
    },
    _removeGuideLine: function() {
        var self = this;
        if (self._guideLineGroup) {
            self._guideLineGroup.remove();
            delete self._guideLineGroup;
        }
        self.svg.selectAll(".yAxisGuideLine").attr("visibility","visible");
    },
    _drawAxis: function() {
        var self = this;
        if (this._xAxis) this._xAxis.remove();
        this._xAxis = this.svg.drawArea.x.append("svg:g")
            .attr("transform", "translate(0," + (this._chartHeight) + ")")
            .attr("class", "xaxis")
            .call(d3.svg.axis().scale(this._getXScale()).orient("bottom").tickFormat(function(d) {
                if (self.xType === "time") {
                    return d.getHours() + ":" + d.getMinutes();
                }
            }))

        /////set style use attr
        this._xAxis.selectAll(".tick").selectAll("line").attr("fill","none").attr("stroke","black");
        this._xAxis.selectAll("path").attr("fill","none").attr("stroke","black");
        this._xAxis.selectAll(".tick").style("font-size","11px");
        //x.selectAll("g").append("line").attr("x2",0).attr("x1",0).attr("y1",0).attr("y2", - self._chartHeight).attr("stroke-width",1).attr("stroke","black").attr("opacity","0.2");
        if (this._yAxis) this._yAxis.remove();
        this._yAxis = this.svg.drawArea.y.append("svg:g")
            .attr("class", "yaxis")
            .call(d3.svg.axis().scale(this._getYScale()).orient("left"));
        
        this._yAxis.selectAll(".tick").selectAll("line").attr("fill","none").attr("stroke","black");
        this._yAxis.selectAll("path").attr("fill","none").attr("stroke","black");
        this._yAxis.selectAll(".tick").style("font-size","11px");
        this._yAxis.selectAll("g")
                .append("line").attr("x2", self._chartWidth).attr("x1", 0).attr("y1", 0).attr("y2", 0).attr("stroke-width", 1)
                .attr("stroke", "black").attr("opacity", "0.2").attr("stroke-dasharray", "5,3").attr("class","yAxisGuideLine");
        if (this._hasY2()) {
            if (this._y2Axis) this._y2Axis.remove();
            this._y2Axis = this.svg.drawArea.y.append("svg:g")
                .attr("class", "y2axis")
                .attr("transform", "translate(" + this._chartWidth + ",0)")
                .call(d3.svg.axis().scale(this._getY2Scale()).orient("right"));
        this._y2Axis.selectAll(".tick").selectAll("line").attr("fill","none").attr("stroke","black");
        this._y2Axis.selectAll("path").attr("fill","none").attr("stroke","black");
        this._y2Axis.selectAll(".tick").style("font-size","11px");
        }
    },
    _drawInfoBar: function(data, i) {
        var self = this;
        var g = this.svg.infoBar.append("g");
        var rects = g.append("rect")
            .attr("height", 21)
            .attr("width", this._infoBarWidth)
            .attr("y", i * 32 - 6)
            .attr("x", -10)
            .attr("fill", "transparent");
        var circleList = g
            .append("circle")
            .attr("cx", function(d) {
                return 0;
            })
            .attr("cy", function() {
                return i * 32;
            })
            .attr("r", function(d) {
                return 8;
            })
            .attr("fill", function(d, i) {
                return data.color;
            })
            .append("svg:title").text("haha");
        var nameList = g
            .append("text")
            .attr("x", 12)
            .attr("y", (i * 32) + 4)
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
        g.on("dblclick", function() {
            self.removeData(data.id);
        })
        return g;

    },
    _drawTitles: function() {
        this.svg.xTitleBar.append("text").text(this.xTitle).attr("dominant-baseline", "text-after-edge");
        this.svg.yTitleBar.append("text").text(this.yTitle).attr("transform", "rotate(-90)").attr("dominant-baseline", "text-before-edge");
        if (this._hasY2()) this.svg.y2TitleBar.append("text").text(this.y2Title).attr("transform", "rotate(-90)").attr("dominant-baseline", "text-before-edge");
        this.svg.titleBar.append("text").text(this.title).attr("dominant-baseline", "text-before-edge").classed("titleBar", true);
        this.svg.titleBar.append("text").text(this.secondTitle).attr("dominant-baseline", "text-before-edge").attr("dy", this._titleHeight / 2);
    },
    _drawEventRect: function() {
        if (this.svg.drawArea.eventRects) this.svg.drawArea.eventRects.remove();
        var self = this,
            set = this._xSet(),
            chart = this.svg.drawArea.chart,
            zoomScale = self._zoomScale ? self._zoomScale : 1;
        _width = Math.floor(this._chartWidth / (set.length + 1) * zoomScale);
        this.svg.drawArea.eventRects = chart.append("g").attr("class", "eventRect");
        this.svg.drawArea.eventRects.selectAll("rect").data(set)
            .enter()
            .append("rect")
            .attr("x", function(d, i) {
                return self._getXScale()(d) - _width / 2
            })
            .attr("y", 0)
            .attr("width", _width)
            .attr("height", self._chartHeight)
            .attr("class", function(d, i) {
                return "event-rect-" + i
            })
            .attr("rect-index", function(d, i) {
                return i
            })
            .attr("fill-opacity", "0")
            .on("mouseout", function(d, i) {
                self.toolTip.setVisiable(false);
                self._removeGuideLine();
            })
            .on("mousemove", function(d, i) {
                var sharps = d3.selectAll(".event-sharp-" + i),
                    mouse = d3.mouse(chart.node()),
                    content = [];
                self.toolTip.setVisiable(false);
                self._removeGuideLine();
                sharps.filter(function(d) {
                    return d._parent.isInSharp(this);
                }).each(function(d) {
                    self._drawGuideLine(d);
                    content.push(d);
                });
                if (content.length > 0) {
                    self.toolTip.setPosition(event.pageX , event.pageY);
                    self.toolTip.setContent(content);
                    self.toolTip.setVisiable(true);
                    // .style("top", (event.pageY -5) + "px").style("left", (event.pageX +10) + "px").html(content);
                }

            })
            .on("click", function(d, i) {
                var sharps = d3.selectAll(".event-sharp-" + i),
                mouse = d3.mouse(chart.node());
                self.toolTip.setVisiable(false);
                self._removeGuideLine();
                sharps.filter(function(d) {
                    return d._parent.isInSharp(this);
                }).each(function(d) {
                    var data = d._parent._parent;
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
            });


    },
    _initDraw: function() {
        var self = this;
        d3.select("#" + this.appendId).style("width", this.width)
            .style("height", this.height)
        this.svgContainer = d3.select("#" + this.appendId)
            .append("div")
            .style("width", this.width)
            .style("height", this.height)
            .attr("class", "smartTraffic-chart")
        this.svg = this.svgContainer
            .append("svg")
            .attr("width", this.width)
            .attr("height",this.height)
            .classed("noselect", true)
            .style("font-family","sans-serif");

        this.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", this._chartWidth)
            .attr("height", this._chartHeight);
        this.toolTip = SmartTrafficChartToolTip.create(this.svgContainer, this);
        this.svg.drawArea = this.svg.append("g")
            .attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth) + "," + this._titleHeight + ")")
            .attr("class", "drawArea")
            .on("click", function() {
                if (d3.event.defaultPrevented) {
                    return;
                }
                self._deselectAll.call(self);
            });
        this.svg.drawArea.chartArea = this.svg.drawArea.append("rect")
            .attr("width", this._chartWidth)
            .attr("height", this._chartHeight)
            .attr("fill-opacity", 0);


        this.svg.drawArea.x = this.svg.drawArea.append("g");
        this.svg.drawArea.y = this.svg.drawArea.append("g");
        this.svg.drawArea.chart = this.svg.drawArea.append("g")
            .attr("clip-path", "url(#clip)");
        if (this._hasY2()) {
            this.svg.y2TitleBar = this.svg.append("g").attr("transform", "translate(" + (this._yTitleWidth + this._y2AxisWidth + this._chartWidth + this._yAxisWidth) + "," + (this._titleHeight + this._chartHeight / 2) + ")").classed("titleBar", true).attr("text-anchor", "middle");
        }
        this.svg.yTitleBar = this.svg.append("g").attr("transform", "translate(1," + (this._titleHeight + this._chartHeight / 2) + ")").classed("titleBar", true).attr("text-anchor", "middle");
        this.svg.titleBar = this.svg.append("g").attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth / 2 + this._chartWidth / 2) + ",5)").attr("text-anchor", "middle");
        if (this._hasY2()) {
            this.svg.infoBar = this.svg.append("g").attr("transform", "translate(" + (this._chartWidth + this._yAxisWidth + this._yTitleWidth + this._infoBarMargin + this._y2TitleWidth + this._y2AxisWidth) + "," + this._titleHeight + ")").classed("infoBar", true);
        } else {
            this.svg.infoBar = this.svg.append("g").attr("transform", "translate(" + (this._chartWidth + this._yAxisWidth + this._yTitleWidth + this._infoBarMargin) + "," + this._titleHeight + ")").classed("infoBar", true);
        }

        this.svg.xTitleBar = this.svg.append("g").attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth / 2 + this._chartWidth / 2) + "," + (this.height -5) + ")").classed("titleBar", true).attr("text-anchor", "middle");
        this.zoom = d3.behavior.zoom()
            .x(self._getXScale())
            .scaleExtent([0.5, 8])
            .on("zoom", self._zoomed.bind(self));

        this.svg.drawArea.call(this.zoom).on("dblclick.zoom", null);

    },
    _drawChart: function(datas) {
        var self = this;
        datas.forEach(function(v) {
             if (v.area) {
                v.figure = v.figure || {};
                if (v.figure.area) v.figure.area.remove();
                v.figure.area = v.area.draw(self);
            }   
        });
        datas.forEach(function(v) {
            if (v.bar) {
                v.figure = v.figure || {};
                if (v.figure.bar) v.figure.bar.remove();
                v.figure.bar = v.bar.draw(self);
            }
        });
        datas.forEach(function(v) {
            if (v.boxplot) {
                v.figure = v.figure || {};
                if (v.figure.boxplot) v.figure.boxplot.remove();
                v.figure.boxplot = v.boxplot.draw(self);
            }
        });
        datas.forEach(function(v) {
            if (v.spline) {
                v.figure = v.figure || {};
                if (v.figure.spline) v.figure.spline.remove();
                v.figure.spline = v.spline.draw(self);
            }
        });
        datas.forEach(function(v) {
            if (v.line) {
                v.figure = v.figure || {};
                if (v.figure.line) v.figure.line.remove();
                v.figure.line = v.line.draw(self);
            }
        });
    },
    _drawInfoBars: function(datas) {
        var self = this;
        datas.forEach(function(v, i) {
            v.figure = v.figure || {};
            if (v.figure.infoBar) v.figure.infoBar.remove();
            v.figure.infoBar = self._drawInfoBar(v, i);
        });
    },
    _draw: function() {
        var self = this;
        this._drawAxis();
        this._drawTitles();
        this._drawEventRect();
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
        if (this.svgContainer) this.svgContainer.remove();
        if (this._xScale) delete this._xScale;
        if (this._yScale) delete this._yScale;
        if (this._y2Scale) delete this._y2Scale;
        if (this._zoomScale)  delete this._zoomScale;
        this._removeGuideLine();
        this._calculateMargin();
        this._initDraw();
        this._draw();
    },
    _getXScale: function() {
       // var span = 0;
        var span =(this._getMaxXData() -this._getMinXData())/24;
        if(!this._xScale ){
            this._xScale = this._xScale || d3.time.scale()
                .range([0, this._chartWidth])
                .domain([this._getMinXData() - span, this._getMaxXData() + span]).nice();            
        }
        return this._xScale;
    },
    _getYScale: function() {
        var span = (this._getMaxYData() - this._getMinYData()) / 10;
        if(!this._yScale){
            this._yScale = this._yScale || d3.scale.linear()
                .range([0, this._chartHeight])
                .domain([this._getMaxYData() + span, this._getMinYData() - 3 * span]).nice();
        }
        return this._yScale;
    },
    _getY2Scale: function() {
        var span = (this._getMaxY2Data() - this._getMinY2Data()) / 10;
        if(!this._y2Scale){
            this._y2Scale = this._y2Scale || d3.scale.linear()
                .range([0, this._chartHeight])
                .domain([this._getMaxY2Data() + span, this._getMinY2Data() - 3 * span]).nice();
        }
        return this._y2Scale;
    },
    _getMaxXData: function() {
        var _num = Number.MIN_VALUE;
        this.datas.forEach(function(d) {
            for(var i in d){
                if(d[i].getMaxX){
                     _num = Math.max(d[i].getMaxX(), _num);
                }
            }
        });
        return _num;
    },
    _getMinXData: function() {
        var _num = Number.MAX_VALUE;
        this.datas.forEach(function(d) {
                 for(var i in d){
                if(d[i].getMinX){
                     _num = Math.min(d[i].getMinX(), _num);
                }
            }
        });
        return _num;
    },
    _getMaxYData: function() {
        var _num = Number.MIN_VALUE;
        this.datas.forEach(function(d) {
            for(var i in d){
                if(d[i].getMaxY && !d[i].y2){
                    _num = Math.max(_num,d[i].getMaxY());
                }
            }
        });
        return _num;
    },
    _getMinYData: function() {
        var _num = Number.MAX_VALUE;
        this.datas.forEach(function(d) {
            for(var i in d){
                if(d[i].getMinY && !d[i].y2){
                    _num = Math.min(_num,d[i].getMinY());
                }
            }
        });
        return _num;
    },
    _getMaxY2Data: function() {
        var _num = Number.MIN_VALUE;
        this.datas.forEach(function(d) {
            for(var i in d){
                if(d[i].getMaxY && d[i].y2){
                    _num = Math.max(_num,d[i].getMaxY());
                }
            }
        });
        return _num;
    },
    _getMinY2Data: function() {
        var _num = Number.MAX_VALUE;
        this.datas.forEach(function(d) {
          for(var i in d){
                if(d[i].getMinY && d[i].y2){
                    _num = Math.min(_num,d[i].getMinY());
                }
            }
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
    _setSelectStyle: function() {
        var self = this;
        var hasSelect = !(this.datas.find(function(v) {
            return v.isSelected;
        }) === undefined);
        if (hasSelect) {
            this.datas.forEach(function(v) {
                if (v.figure.circles) {
                    v.figure.circles.classed("notSelected", !v.isSelected);
                }
                if (v.figure.line) {
                    v.figure.line.classed("notSelected", !v.isSelected);
                }
                if (v.figure.infoBar) {
                    v.figure.infoBar.classed("notSelected", !v.isSelected);
                }
                if (v.figure.spline) {
                    v.figure.spline.classed("notSelected", !v.isSelected);
                }
                if (v.figure.splineCircles) {
                    v.figure.splineCircles.classed("notSelected", !v.isSelected);
                }
                if (v.figure.bar) {
                    v.figure.bar.classed("notSelected", !v.isSelected);
                }
                if (v.figure.area) {
                    var _result = v.isSelected ? "visible" : "hidden";
                    v.figure.area.style("visibility", _result);
                }
                if (v.figure.boxplot) {
                    var _result = v.isSelected ? "visible" : "hidden";
                    v.figure.boxplot.style("visibility", _result);
                }
            });
        } else {
            this.datas.forEach(function(v) {
                if (v.figure.circles) {
                    v.figure.circles.classed("notSelected", false);
                }
                if (v.figure.bar) {
                    v.figure.bar.classed("notSelected", false);
                }
                if (v.figure.line) {
                    v.figure.line.classed("notSelected", false);
                }
                if (v.figure.infoBar) {
                    v.figure.infoBar.classed("notSelected", false);
                }
                if (v.figure.spline) {
                    v.figure.spline.classed("notSelected", false);
                }
                if (v.figure.splineCircles) {
                    v.figure.splineCircles.classed("notSelected", false);
                }
                if (v.figure.area) {
                    v.figure.area.style("visibility", "visible");
                }
                if (v.figure.boxplot) {
                    v.figure.boxplot.style("visibility", "visible");
                }

            })
        }
    },
    _deselectAll: function() {
        var self = this;
        self.datas.forEach(function(v) {
            delete v.isSelected;
        });
        self._setSelectStyle();
    },
    _zoomed: function() {
        var self = this;
        this._zoomScale = d3.event.scale;
        this._drawAxis();
        this._drawEventRect();
        self.toolTip.setVisiable(false);
        self._removeGuideLine();
        this._drawChart(this.datas, this._figures);
        this._setSelectStyle();
    },
    addEventHandler: function(type, callback) {
        eventManager.addEventHandler.call(this, type, callback);
    },
    removeEventHandler: function(type, callback) {
        eventManager.removeEventHandler.call(this, type, callback);
    },
    getPic:function(){
        var canvas =this.svgContainer.append("canvas").attr("height",this.height).attr("width",this.width).node();
        console.log(canvas);
        var ctx = canvas.getContext('2d');
        var data = (new XMLSerializer()).serializeToString(this.svg.node());
        var DOMURL = window.URL || window.webkitURL || window;

        var img = new Image();
        var svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        var url = DOMURL.createObjectURL(svgBlob);
        var self = this;
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            DOMURL.revokeObjectURL(url);
            var imgURI = canvas
                .toDataURL('image/png',1).replace('image/png', 'image/octet-stream');
            var evt = new MouseEvent('click', {
                view: window,
                bubbles: false,
                cancelable: true
            });
            var fileName = self.title+(self.secondTitle?"-"+self.secondTitle : "")+".png"; 
            var a =self.svgContainer.append("a").node();
            a.setAttribute('download',fileName);
            a.setAttribute('href', imgURI);
            a.setAttribute('target', '_blank');
            a.dispatchEvent(evt);
            }
            img.src = url;
    }
};
var SmartTrafficChartClass = {
    extend: function(prop) {
        var subClass = Object.create(this);
        for (var i in prop) {
            if (prop.hasOwnProperty(i)) subClass[i] = prop[i];
        }
        return subClass;
    },
    create: function() {
        var obj = Object.create(this);
        if (obj.init) obj.init.apply(obj, arguments);
        return obj;
    },
    mergeOption: function(option) {
        var dontMerge = ["x", "y", "ref", "data", "d1", "d2", "d3", "d4", "d5"];
        for (var i in option) {
            if (option.hasOwnProperty(i) && !dontMerge.find(function(v) {
                    return v === i;
                }))
                this[i] = option[i];
        }
    }
    
};
var SmartTrafficChartToolTip = SmartTrafficChartClass.extend({
    init: function(container, chart) {
        this.chart = chart;
        if (container.select("#smartTrafficChart-tooltip")) container.select("#smartTrafficChart-tooltip").remove();
        this.toolTip = container.append("div")
            .style("pointer-events", "none")
            .attr("class", "smartTrafficChart-toolTip")
            .style("position", "absolute")
            .style("z-index", "10")
            .attr("id","smartTrafficChart-tooltip")
            .style("visibility", "hidden");
        if (!this.toolTip) this.toolTip = this.append("g").attr("class", "tool-tip");
    },
    getContent: function(datas) {
        var text = "",
            self = this;
        var title = datas[0].x;
        text = "<table class='tool-tip-table' ><tbody><tr><th class = 'tooltip-title' colspan='3'>" + title + "</th></tr>";
        datas.forEach(function(data) {
            text += self.parseData(data);
        });
        return text += "</tbody><table>";
    },
    setVisiable: function(isVisiable) {
        if (isVisiable) this.toolTip.style("visibility", "visible");
        else this.toolTip.style("visibility", "hidden");
    },
    setContent: function(points) {
        if (this.toolTip) this.toolTip.html(this.getContent(points));
    },
    setPosition: function(x, y) {
        var width =document.getElementById("smartTrafficChart-tooltip").offsetWidth;
        var height =document.getElementById("smartTrafficChart-tooltip").offsetHeight;
        var screenWidth=document.body.clientWidth || 800;
        if(x-width/2 < 0){
              this.toolTip.style("left",  10+ "px");
        }else if(x+width/2 >screenWidth){
             this.toolTip.style("left", (screenWidth-width -10) + "px");
        }
        else
        {
              this.toolTip.style("left", x-width/2 + "px");
        }
        if(y - height -10 <0){
            this.toolTip.style("top", y +20+ "px");
        }else{
            this.toolTip.style("top", y - height -10+ "px");
        }
    },
    parseData: function(point) {
        var data = point._parent,
            dataParent = data._parent,
            text = "";
        if (data.type === "line" || data.type === "spline" || data.type === "bar") {
            text += "<tr>";
            text += "<td class='tooltip-name'><span style=' background-color:" + dataParent.color + "'></span>" + dataParent.name + "</td>";
            if (data.yHint) text += "<td class='tooltip-value'>" + data.yHint + "</td>";
            else {
                if (data.y2) text += "<td class='tooltip-value'>" + this.chart.y2Title + "</td>";
                else text += "<td class='tooltip-value'>" + this.chart.yTitle + "</td>"
            }
            text += "<td class='tooltip-value'>" + point.y + "</td>";
            text += "</tr>";
        }
        if(data.type ==="boxplot"){
             text += "<tr>";
            text += "<td class='tooltip-name' rowspan='5'><span style=' background-color:" + dataParent.color + "'></span>" + dataParent.name + "</td>";
            if (data.d1Hint) text += "<td class='tooltip-value'>" + data.d1Hint + "</td>";
            else text+= "<td class='tooltip-value'>" + "Data 1" + "</td>";
            text += "<td class='tooltip-value'>" + point.d1 + "</td>";
            text += "</tr>";
            text += "<tr>";
            if (data.d2Hint) text += "<td class='tooltip-value'>" + data.d2Hint + "</td>";
            else text+= "<td class='tooltip-value'>" + "Data 2" + "</td>";
            text += "<td class='tooltip-value'>" + point.d2 + "</td>";
            text += "</tr>";
             text += "<tr>";
            if (data.d3Hint) text += "<td class='tooltip-value'>" + data.d3Hint + "</td>";
            else text+= "<td class='tooltip-value'>" + "Data 3" + "</td>";
            text += "<td class='tooltip-value'>" + point.d3 + "</td>";
            text += "</tr>";
            text += "<tr>";
            if (data.d4Hint) text += "<td class='tooltip-value'>" + data.d4Hint + "</td>";
            else text+= "<td class='tooltip-value'>" + "Data 4" + "</td>";
            text += "<td class='tooltip-value'>" + point.d4 + "</td>";
            text += "</tr>";
             text += "<tr>";
            if (data.d5Hint) text += "<td class='tooltip-value'>" + data.d5Hint + "</td>";
            else text+= "<td class='tooltip-value'>" + "Data 5" + "</td>";
            text += "<td class='tooltip-value'>" + point.d5 + "</td>";
            text += "</tr>";
        }
        return text;
    }
});
var LineBaseClass = SmartTrafficChartClass.extend({
    type: "line",
    mapkey: ["x", "y"],
    init: function(originData, parent, chart) {
        var option = originData.option,
            self = this;
        this.chart = chart;
        this._d = originData.data;
        if (option.ref === "y2") {
            this.y2 = true;
        }
        var mapkey = this.mapkey;
        mapkey.forEach(function(key) {
            if (option[key]) {
                if (option[key] !== key) {
                    self._d.forEach(function(d) {
                        d[key] = d[option[key]];
                        delete d[option[key]];
                    })
                }
            }
        });
        if (chart.xType === "time") {
            this._d.forEach(function(d) {
                if (typeof d.x !== "time") d.x = new Date(d.x);
            })
        }
        this.mergeOption(option);
        this._d.forEach(function(d) {
            d._parent = self;
        })

        this._d.sort(function(v1, v2) {
            return v1.x - v2.x;
        });
        this._parent = parent;
    },
    getX: function(point) {
        return [point.x];
    },
    getY: function(point) {
        return [point.y];
    },
    getAllX:function(){
        return this._d.map(function(v){ return v.x});
    },
    getAllY:function(){
        return this._d.map(function(v){ return v.y});
    },
    getMaxX:function(){
        if(this._maxx) return this._maxx;
        var x = Number.MIN_VALUE;
        this._d.forEach(function(v){
            x = Math.max(v.x , x);
        });
        this._maxx =x;
        return x;
    },
    getMinX:function(){
        if(this._minx) return this._minx;
        var x = Number.MAX_VALUE;
        this._d.forEach(function(v){
            x = Math.min(x,v.x);
        });
        this._minx =x;
        return x;
    },
    getMaxY:function(){
        if(this._maxy) return this._maxy;
        this._maxy= this.getAllY().reduce(function(v1,v2){return Math.max(v1,v2)});
        return this._maxy;
    },
     getMinY:function(){
         if(this._miny) return this._miny;
        this._miny= this.getAllY().reduce(function(v1,v2){return Math.min(v1,v2)});
        return this._miny;
    },
    isInSharp: function(_sharp) {
        _sharp = d3.select(_sharp);
        if (_sharp.node().nodeName === "circle") {
            var mouse = d3.mouse(this.chart.svg.drawArea.chart.node());
            x2 = Number(_sharp.attr("cx")), y2 = Number(_sharp.attr("cy")), r = Number(_sharp.attr("r"));
            return Math.sqrt(Math.pow(mouse[0] - x2, 2) + Math.pow(mouse[1] - y2, 2)) < 3 * r;
        }
    },
    draw: function(svg) {
        var line = svg.svg.drawArea.chart.append("g").attr("class", "SmartTrafficChart-line").attr("pointer-events", "none");
        var parent = this._parent,
            yScale, _line, lineGen, _circle, xScale;
        yScale = this.y2 ? svg._getY2Scale() : svg._getYScale();
        xScale = svg._getXScale();
        lineGen = d3.svg.line()
            .x(function(d) {
                return xScale(d.x);
            })
            .y(function(d) {
                return yScale(d.y);
            });
        _line = line.append("path")
            .attr('d', lineGen(this._d))
            .attr('stroke', parent.color)
            .attr('stroke-width', 2)
            .attr('fill', 'none');

        _circle =
            line.selectAll("linepoint")
            .data(this._d)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return xScale(d.x);
            })
            .attr("cy", function(d) {
                return yScale(d.y);
            })
            .attr("r", function(d) {
                return 4;
            }).attr("fill", parent.color)
            .attr("class", function(d, i) {
                return "event-sharp-" + svg._getXSetIndex(d.x)
            });
        return line;
    }
});
var SpLine = LineBaseClass.extend({
    type: "spline",
    draw: function(svg) {
        var line = svg.svg.drawArea.chart.append("g").attr("class", "SmartTrafficChart-spline").attr("pointer-events", "none");
        var parent = this._parent,
            yScale, _line, lineGen, _circle, xScale;
        yScale = this.y2 ? svg._getY2Scale() : svg._getYScale();
        xScale = svg._getXScale();
        lineGen = d3.svg.line()
            .x(function(d) {
                return xScale(d.x);
            })
            .y(function(d) {
                return yScale(d.y);
            }).interpolate("monotone");
        _line = line.append("path")
            .attr('d', lineGen(this._d))
            .attr('stroke', parent.color)
            .attr('stroke-width', 2)
            .attr('fill', 'none');
        _circle =
            line.selectAll("linepoint")
            .data(this._d)
            .enter()
            .append("circle")
            .attr("cx", function(d) {
                return xScale(d.x);
            })
            .attr("cy", function(d) {
                return yScale(d.y);
            })
            .attr("r", function(d) {
                return 4;
            }).attr("fill", parent.color)
            .attr("class", function(d, i) {
                return "event-sharp-" + svg._getXSetIndex(d.x)
            });
        return line;
    }
});
var Area = LineBaseClass.extend({
    type: "area",
    draw: function(svg) {
        var parent = this._parent,
            xScale = svg._getXScale(),
            yScale = this.y2 ? svg._getY2Scale() : svg._getYScale(),
            _area, _gen;
        _gen = d3.svg.area()
            .x(function(d) {
                return xScale(d.x);
            })
            .y0(svg._chartHeight)
            .y1(function(d) {
                return yScale(d.y);
            }).interpolate("monotone");
        _area = svg.svg.drawArea.chart.append("g").attr("pointer-events", "none").attr("class", "SmartTrafficChart-area");
        _area.append("path")
            .attr('d', _gen(this._d))
            .attr('stroke', parent.color)
            .attr('stroke-width', 0)
            .attr('fill', parent.color);
        return _area;
    }
});
var Bar = LineBaseClass.extend({
    type: "bar",
    draw: function(svg) {
        var parent = this._parent,
            yScale, barWidth, barAcc, xScale, getBarIndex = this.getBarIndex.bind(this);
        yScale = this.y2 ? svg._getY2Scale() : svg._getYScale();
        barAcc = this.getBarAcc(svg.datas);
        xScale = svg._getXScale();
        var zoomScale = svg._zoomScale ? svg._zoomScale : 1;
        barWidth = Math.min(25, svg._chartWidth / (this.chart._xSet().length+1) / barAcc * zoomScale);

        var bar = svg.svg.drawArea.chart.append("g")
            .attr("class", "SmartTrafficChart-bar")
            .attr("pointer-events", "none");
        bar.selectAll("rect").data(this._d)
            .enter()
            .append("rect")
            .attr("x", function(d) {
                return xScale(d.x) - (barAcc) / 2 * barWidth + getBarIndex(svg.datas) * barWidth;
            })
            .attr("y", function(d) {
                return yScale(d.y);
            })
            .attr("width", barWidth)
            .attr("height", svg._chartHeight)
            .attr("fill", parent.color)
            .attr("class", function(d, i) {
                return "event-sharp-" + svg._getXSetIndex(d.x)
            });
        return bar;
    },
    getBarAcc: function(datas) {
        var i = 0;
        datas.forEach(function(v) {
            if (v.bar) ++i;
        });
        return i;
    },
    getBarIndex: function(datas) {
        var i = 0;
        var id = this._parent.id;
        for (var j = 0; j < datas.length; ++j) {
            if (datas[j].bar) {
                if (datas[j].id === id) {
                    break;
                } else {
                    ++i;
                }
            }
        }
        return i;
    },
    isInSharp: function(_sharp) {
        _sharp = d3.select(_sharp);
        if (_sharp.node().nodeName === "rect") {
            var mouse = d3.mouse(this.chart.svg.drawArea.chart.node());
            x = Number(_sharp.attr("x")), y = Number(_sharp.attr("y")), width = Number(_sharp.attr("width"));
            return mouse[0] > x && mouse[1] > y && mouse[0] < x + width;
        }
    }
});
var BoxPlot = LineBaseClass.extend({
    type: "boxplot",
    mapkey: ["x", "d1", "d2", "d3", "d4", "d5"],
    init: function(originData, parent, chart) {
        LineBaseClass.init.call(this, originData, parent, chart);
        this.lineWidth = this.lineWidth || 20;
        this.recWidth = this.recWidth || 16;
    },
    draw: function(svg) {
        var parent = this._parent,
            yScale, barWidth, barAcc, xScale,lineWidth = this.lineWidth,recWidth = this.recWidth,color = this._parent.color;
        yScale = this.y2 ? svg._getY2Scale() : svg._getYScale();
        xScale = svg._getXScale();
        var boxplots = svg.svg.drawArea.chart.append("g").attr("class","SmartTrafficChart-boxplot").attr("pointer-events", "none");
        this._d.forEach(function(d){
                var boxplot =boxplots.append("g").attr("class","event-sharp-" + svg._getXSetIndex(d.x)).datum(d);
                boxplot.append("line").attr("x1", xScale(d.x)-lineWidth/2).attr("y1", yScale(d.d1))
                                                                    .attr("x2",  xScale(d.x)+lineWidth/2 ).attr("y2", yScale(d.d1))
                                                                    .attr("stroke","black").attr("stroke-width","2");
                boxplot.append("line").attr("x1", xScale(d.x)).attr("y1", yScale(d.d1))
                                                                    .attr("x2",  xScale(d.x) ).attr("y2", yScale(d.d2))
                                                                    .attr("stroke","black").attr("stroke-width","1").attr("stroke-dasharray", "3,3").attr("stroke-fill".color);
                boxplot.append("rect").attr("x", xScale(d.x)-recWidth/2).attr("y", yScale(d.d2))
                                                                    .attr("width",recWidth).attr("height", yScale(d.d4)- yScale(d.d2))
                                                                    .attr("fill",color);
                boxplot.append("line").attr("x1", xScale(d.x)-recWidth/2).attr("y1", yScale(d.d3))
                                                                    .attr("x2",  xScale(d.x)+recWidth/2 ).attr("y2", yScale(d.d3))
                                                                    .attr("stroke","black").attr("stroke-width","2");
                boxplot.append("line").attr("x1", xScale(d.x)).attr("y1", yScale(d.d4))
                                                                    .attr("x2",  xScale(d.x)).attr("y2", yScale(d.d5))
                                                                    .attr("stroke","black").attr("stroke-width","1").attr("stroke-dasharray", "3,3").attr("stroke-fill".color);
                boxplot.append("line").attr("x1", xScale(d.x)-lineWidth/2).attr("y1", yScale(d.d5))
                                                                    .attr("x2",  xScale(d.x)+lineWidth/2 ).attr("y2", yScale(d.d5))
                                                                    .attr("stroke","black").attr("stroke-width","2");
        });
        return boxplots;                                 
    },
    isInSharp:function(_sharp){
          
             _sharp = d3.select(_sharp); 
             if (_sharp.style("visibility") ==="hidden") return false;
            var svg =this.chart,_d,mouse,yScale,xScale,recWidth;
            yScale = this.y2 ? svg._getY2Scale() : svg._getYScale();
            xScale = svg._getXScale();
         

            recWidth = this.recWidth;
            _d =_sharp.datum();
            mouse = d3.mouse(svg.svg.drawArea.chart.node());
            return mouse[0]> xScale(_d.x) - recWidth/2 && mouse[0] < xScale(_d.x) + recWidth/2 && mouse[1]> yScale(_d.d1) && mouse[1] <yScale(_d.d5);

    },
    getY:function(point){
        return  [point.d1,point.d2,point.d3,point.d4,point.d5];
    },
    getAllY:function(){
        return this._d.map(function(v){ return [v.d1,v.d2,v.d3,v.d4,v.d5]}).reduce(function(v1,v2){return v1.concat(v2)});
    }
});