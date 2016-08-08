"user direct"
!function(){
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
    },
    bindThis:function(that){
        Object.keys(this).forEach(function(k){
            if(typeof this[k] === "function"){
                this[k].bind(that);
            }
        })
        return this;
    },
    setOption:function(option){
        var self = this;
        var  f = function(key,option){
            if(typeof option ==="object" && !Array.isArray(option)){
                Object.keys(option).forEach(function(k){
                     f(key+"_"+k,option[k]);
                });
            }else{
                self[key] = option;
            }
        };
        Object.keys(option).forEach(function(k){
            f(k,option[k]);
        });
    }
};
var eventManager = SmartTrafficChartClass.extend({
    addEventHandler: function(type, callback,self) {
        if (!this._events) this._events = {};
        if (!this._events[type]) this._events[type] = [];
        if(self) callback=callback.bind(self);
        if(this._events[type].indexOf(callback) <0) this._events[type].push(callback);
        return this;
    },
    removeEventHandler: function(type, callback,self) {
        if (this._events && this._events[type]) {
            this._events[type].forEach(function(v, i, events) {
                if (v === callback) delete events[i];
            });
        }
        return this;
    },
    callEventHandler: function(type, data,self) {
        if (this._events && this._events[type]) {
            this._events[type].forEach(function(v) {
                v(data, self);
            })
        }
        return this;
    }
});
var colorManager =  SmartTrafficChartClass.extend({
    getColor: function(i) {
        if (!this._colors) this.init();

        this._colorIndex %= this._colors.length;
        return this._colors[this._colorIndex++];
    },
    init: function() {
        this._colors = ["#FFCC66", "#5CBAE6", "#993366", "#669966", "#CCC5A8", "#D998CB", "#660066", "#FAC364", "#CC3300", "#66CC00", "#000066", "#00FF00", "#FF0066"];
        this._colorIndex = 0;
    },
    reset: function() {
        this._colorIndex = 0;
    }
});
var SmartTrafficChart =SmartTrafficChartClass.extend({
        init:function(option){
            var $chart = this;
            $chart.datas = [];
            $chart.isInitDraw = false;
            $chart.svg = null;
            $chart.appendId = null;
            $chart.option = option;
            $chart.width = option.width || "100%";
            $chart.height = option.height || 200;
            $chart.colorManager=colorManager.create().bindThis($chart);
            $chart.eventManager=eventManager.create().bindThis($chart);
            $chart.labels_radar=[];
            $chart.setOption(option);
           
            this.toolTip = SmartTrafficChartToolTip.create( this);
            $chart.timeSeriesFigure= SmartTrafficTimeSeriesChart.create($chart,option);
            $chart.radarFigure = SmartTrafficRadarChart.create($chart,option);
             switch($chart.type)
            {
                case "timeSeries" :
                    $chart.figure = $chart.timeSeriesFigure;
                    break;
                case "radar":
                    $chart.figure = $chart.radarFigure;
                    break;
                default:
                    throw new Error("Wrong chart type!");

            }
            // if($chart.type ==="timeSeries") {
            //     $chart.figure =$chart.timeSeriesFigure;
            // }
            // if($chart.type ==="radar") {
            //     $chart.figure = $chart.radarFigure;
            // }
            //$chart._calculateMargin();
            $chart.eventManager.addEventHandler("dataSelect",function(data,sender){this._setSelectStyle()},this);
        },
     _calculateMargin: function() {
            this._figureWidth = Math.floor((this.width) * 0.8);
            this._figureHeight =this.height;
            this._infoBarMargin = 20;
            this._infoBarMarinTop =40;
            this._infoBarWidth = Math.floor(this.width * 0.2) - 20;
            //this.figure._calculateMargin();
            return this;
        },
    addData:function(data){
        data = JSON.parse(JSON.stringify(data));
        data = this._parseData(data);
        var _i = -1;
        for (var i in this.datas) {
            if (this.datas[i].id === data.id) {
                _i = i;
                break;
            }
        }
        if (_i !== -1) {
            this.datas[i] = data;
        } else {
            this.datas.push(data);
        }
        this.eventManager.callEventHandler("adddata", data);
        this._reDraw();
      
    },
    _parseData: function(originData) {
        var data = {},
            $chart = this;
        data.name = originData.name;
        data.id = originData.id;
        if (originData.id === undefined) {
            data.id = "smartTraffic" + this.datas.length;
        }
        if (originData.config) {
                data.type = originData.config.type || "line";
        if( ["line","dashline","area","bar","boxplot"].indexOf(data.type) !== -1){
            data.figureObj= $chart.timeSeriesFigure._parseData(originData);
            data.figureObj._parent = data;
        }
        if(["radar"].indexOf(data.type) !== -1){
            data.figureObj= $chart.radarFigure._parseData(originData);
             data.figureObj._parent = data;
        }
        data.color = originData.config.color || this.colorManager.getColor();
        } else {
            throw new Error("no data option ");
        }
        return data;
    },
    removeData:function(id){
        var _i = -1;
        for (var i in this.datas) {
            if (this.datas[i].id === id) {
                _i = i;
                break;
            }
        }
        if (_i !== -1) {
           this.datas.splice(i, 1);
        } else {
            return;
        }
       this.eventManager.callEventHandler("removedata", data);
        this._reDraw();
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
             this.svg.figure = this.svg
                .append("g")
                .attr("class","figure");
            this.toolTip._initDraw();
            this.svg.infoBar = this.svg.append("g").attr("transform", "translate(" + (this._figureWidth + this._infoBarMargin) + "," +this._infoBarMarinTop + ")").classed("infoBar", true);
            //this.figure._initDraw()
            this.canvasContainer = this.svgContainer.append("div").attr("visibility","hidden");    
    },
    _drawChart: function() {
            var $chart = this;
            if($chart.appendId === null) return;
            if(!$chart.isInitDraw){
                $chart._calculateMargin()._initDraw();
                $chart.isInitDraw=true;
            }
            this.figure._draw(this.datas);
            this._drawInfoBars(this.datas);
            this._setSelectStyle();
            },
    appendTo: function(id) {
            this.appendId = id;
            //this._initDraw();
            //this._draw();
        },
    _reDraw: function() {
            if (this.svgContainer) this.svgContainer.remove();
            this.isInitDraw = false;
            if(this.figure) this.figure.reset();
            this._drawChart();
        },
    _drawInfoBars: function(datas) {
            if(this.svg.infoBar) this.svg.infoBar.remove();
            this.svg.infoBar = this.svg.append("g").attr("transform", "translate(" + (this._figureWidth + this._infoBarMargin) + "," +this._infoBarMarinTop + ")").classed("infoBar", true);
            var self = this;
            datas.forEach(function(v, i) {
                v.figure = v.figure || {};
                if (v.figure.infoBar) v.figure.infoBar.remove();
                v.figure.infoBar = self._drawInfoBar(v, i);
            });
            this._setSelectStyle();
        },
     _drawInfoBar: function(data, i) {
        var self = this;
        var g = this.svg.infoBar.append("g").attr("class","SmartTrafficChart-infoBar");
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
                self.eventManager.callEventHandler("legendmouseover", data);
            })
            .on("mouseout", function(d) {
                self.eventManager.callEventHandler( "legendmouseout", data);
                d3.select(this).select("rect").attr("fill", "transparent");
            });
        g.on("click", function() {
            if (data.isSelected) {
                data.isSelected = false;
                self.eventManager.callEventHandler("deSelect", [data]);
                self.eventManager.callEventHandler("dataSelect", data);
               
            } else {
                data.isSelected = true;
                self.eventManager.callEventHandler("select", [data]);
                self.eventManager.callEventHandler("dataSelect", data);
            }
            event.stopPropagation();
        });
        g.on("dblclick", function() {
            self.removeData(data.id);
        })
        return g;
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
                if (v.figure.infoBar) {
                    v.figure.infoBar.classed("notSelected", !v.isSelected);
                }
            });
        } else {
            this.datas.forEach(function(v) {
                if (v.figure.infoBar) {
                    v.figure.infoBar.classed("notSelected", false);
                }
            })
        }
    },
    getPic:function(){
        this.canvasContainer.selectAll("canvas").remove();
        var canvas =this.canvasContainer.append("canvas").attr("height",this.height+100).attr("width",this.width+100).node();
        var ctx = canvas.getContext('2d');
            ctx.beginPath();
            ctx.rect(0, 0, this.width+100, this.height+100);
            ctx.fillStyle = "white";
            ctx.fill();
        var data = (new XMLSerializer()).serializeToString(this.svg.node());
        var DOMURL = window.URL || window.webkitURL || window;
        var img = new Image();
        var svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        var url = DOMURL.createObjectURL(svgBlob);
        var self = this,$chart = this;
        img.onload = function () {
            ctx.drawImage(img, 50, 50);
            DOMURL.revokeObjectURL(url);
            var imgURI = canvas
                .toDataURL('image/png').replace('image/png', 'image/octet-stream');
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
         this.canvasContainer.selectAll("canvas").remove();
    },
    addEventHandler:function(type,callback,receiver){
        this.eventManager.addEventHandler(type,callback,receiver);
    },
    removeEventHandler:function(type,callback){
        this.eventManager.removeEventHandler(type,callback);
    }
});
SmartTrafficTimeSeriesChart =  SmartTrafficChartClass.extend({
    init:function(chart) {
    var $chart=chart;
    this.$chart= chart;
    this.datas=chart.datas;
    this.customeLine=chart.customeLine;
    this.title = $chart.title;
    this.secondTitle = $chart.secondTitle;
    this.xTitle = $chart.axis_timeseries_xTitle ||"undefined";
    this.yTitle = $chart.axis_timeseries_yTitle ||"undefined";
    this.y2Title =$chart.axis_timeseries_y2Title ;
    this.toolTip = chart.toolTip;
    this.xType = "time";
    this.isInitDraw = false;
    this.xValueFormat=function(d){
        var hours = d.getHours().toString().length <2? "0"+ d.getHours():d.getHours();
        var minu =d.getMinutes().toString().length <2 ? "0"+d.getMinutes():d.getMinutes();
        return hours+":"+minu;
    }
    this.xValueFormat=chart.xValueFormat || this.xValueFormat;
    this.$chart.eventManager.addEventHandler("adddata",this.handleAddData,this);
    this.$chart.eventManager.addEventHandler("removedata",function(data,sender){this._getXset(true);if(this.svg) this._reDraw()},this);
    this.$chart.eventManager.addEventHandler("dataSelect",function(data,sender){this._setSelectStyle()},this);
    },
    handleAddData: function(data) {
        this._getXset(true);
        //if (this.svg) this._reDraw();
    },
    _parseData:function(originData){
            var type =originData.config.type;
            if (type === "line") {
                return LineBaseClass.create(originData,this);
            }
            if (type === "dashline") {
                return  DashLine.create(originData,this);
            }
            if (type === "area") {
               return Area.create(originData,this);
            }
            if (type === "bar") {
               return Bar.create(originData,this);
            }
             if (type === "boxplot") {
               return BoxPlot.create(originData,this);
            }
    },
    _getXset: function(isUpdata) {
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
        if (!this._getXset()) return -1;
        var _index = -1,
            set = this._getXset();
        for (var i = 0; i < set.length; ++i) {
            if (set[i] - obj === 0) {
                _index = i;
                break;
            }
        }
        return _index;
    },
    _hasY2: function() {
        var find = false;
        this.datas.forEach(function(d) {
            if (d.figureObj) {
                find = (d.figureObj.y2 || find);
            }
        })
        return find;
    },
    _getColor: function() {
        return colorManager.getColor();
    },
    _calculateMargin: function() {
        var $chart=this.$chart,width = $chart._figureWidth,height=$chart._figureHeight;
        this._yTitleWidth = 20;
        this._yAxisWidth = 40;
        this._figureWidth = Math.floor(width - this._yTitleWidth - this._yAxisWidth);
        if (this._hasY2()) {
            this._y2AxisWidth = 40;
            this._y2TitleWidth = 20;
            this._figureWidth = Math.floor(width - this._yTitleWidth - this._yAxisWidth - this._y2TitleWidth - this._y2AxisWidth);
        }
        if (this.secondTitle) {
            this._titleHeight = 55;
            this._xAxisHeight = 25;
            this._xTitleHeight = 25;
            this._figureHeight = height - this._titleHeight - this._xAxisHeight - this._xTitleHeight;
        } else {
            this._titleHeight = 35;
            this._xAxisHeight = 25;
            this._xTitleHeight = 25;
            this._figureHeight = height - this._titleHeight - this._xAxisHeight - this._xTitleHeight;
        }
        return this;
    },
 _initDraw: function() {
        var self = this,$chart = this.$chart;
        this.svg = $chart.svg.figure;
        this.svg.drawArea = this.svg.append("g")
            .attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth) + "," + this._titleHeight + ")")
            .attr("class", "drawArea")
            .on("click", function() {
                if (d3.event.defaultPrevented) {
                    return;
                }
                self._deselectAll();
            });
        this.svg.append("defs").append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("width", this._figureWidth)
                .attr("height", this._figureHeight);
        this.svg.drawArea.figureArea = this.svg.drawArea.append("rect")
            .attr("width", this._figureWidth)
            .attr("height", this._figureHeight)
            .attr("fill-opacity", 0);
        this.svg.drawArea.x = this.svg.drawArea.append("g");
        this.svg.drawArea.y = this.svg.drawArea.append("g");
        this.svg.drawArea.figure = this.svg.drawArea.append("g")
            .attr("clip-path", "url(#clip)");
        if (this._hasY2()) {
            this.svg.y2TitleBar = this.svg.append("g").attr("transform", "translate(" + ($chart._figureWidth-this._y2TitleWidth) + "," + (this._titleHeight + this._figureHeight / 2) + ")").classed("titleBar", true).attr("text-anchor", "middle");
        }
        this.svg.yTitleBar = this.svg.append("g").attr("transform", "translate(1," + (this._titleHeight + this._figureHeight / 2) + ")").classed("titleBar", true).attr("text-anchor", "middle");
        this.svg.titleBar = this.svg.append("g").attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth  + this._figureWidth / 2) + ",0)").attr("text-anchor", "middle");
        this.svg.xTitleBar = this.svg.append("g").attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth  + this._figureWidth / 2) + "," + ($chart._figureHeight) + ")").classed("titleBar", true).attr("text-anchor", "middle");
        this.zoom = d3.behavior.zoom()
            .x(self._getXScale())
            .scaleExtent([0.5, 8])
            .on("zoom", self._zoomed.bind(self));
        this.svg.drawArea.call(this.zoom).on("dblclick.zoom", null);
    },
    _draw: function(datas) {
        var $figure = this;
        if(!$figure.isInitDraw){
            $figure._calculateMargin()._initDraw();
            $figure.isInitDraw = true;
        }
        this._drawAxis();
        this._drawTitles();
        this._drawEventRect();
        this._drawChart(this.datas);
        this._setSelectStyle();
        if(this.customeLine)  this.enableDrawLine();
       
    },
    _drawAxis: function() {
        var self = this;
        if (this._xAxis) this._xAxis.remove();
        this._xAxis = this.svg.drawArea.x.append("svg:g")
            .attr("transform", "translate(0," + (this._figureHeight) + ")")
            .attr("class", "xaxis")
            .call(d3.svg.axis().scale(this._getXScale()).orient("bottom").tickFormat(this.xValueFormat))
        /////set style use attr
        this._xAxis.selectAll(".tick").selectAll("line").attr("fill","none").attr("stroke","black");
        this._xAxis.selectAll("path").attr("fill","none").attr("stroke","black");
        this._xAxis.selectAll(".tick").style("font-size","11px");
        if (this._yAxis) this._yAxis.remove();
        this._yAxis = this.svg.drawArea.y.append("svg:g")
            .attr("class", "yaxis")
            .call(d3.svg.axis().scale(this._getYScale()).orient("left"));
   
        this._yAxis.selectAll(".tick").selectAll("line").attr("fill","none").attr("stroke","black");
        this._yAxis.selectAll("path").attr("fill","none").attr("stroke","black");
        this._yAxis.selectAll(".tick").style("font-size","11px");
        this._yAxis.selectAll("g")
                .append("line").attr("x2", self._figureWidth).attr("x1", 0).attr("y1", 0).attr("y2", 0).attr("stroke-width", 1)
                .attr("stroke", "black").attr("opacity", "0.2").attr("stroke-dasharray", "2,2").attr("class","yAxisGuideLine");
        if (this._hasY2()) {
            if (this._y2Axis) this._y2Axis.remove();
            this._y2Axis = this.svg.drawArea.y.append("svg:g")
                .attr("class", "y2axis")
                .attr("transform", "translate(" + this._figureWidth + ",0)")
                .call(d3.svg.axis().scale(this._getY2Scale()).orient("right"));
        this._y2Axis.selectAll(".tick").selectAll("line").attr("fill","none").attr("stroke","black");
        this._y2Axis.selectAll("path").attr("fill","none").attr("stroke","black");
        this._y2Axis.selectAll(".tick").style("font-size","11px");
        }
    },
    _drawTitles: function() {
        this.svg.xTitleBar.append("text").text(this.xTitle).attr("dominant-baseline", "text-after-edge");
        this.svg.yTitleBar.append("text").text(this.yTitle).attr("transform", "rotate(-90)").attr("dominant-baseline", "text-before-edge");
        if (this._hasY2()) this.svg.y2TitleBar.append("text").text(this.y2Title).attr("transform", "rotate(-90)").attr("dominant-baseline", "text-before-edge");
        this.svg.titleBar.append("text").text(this.title).attr("dominant-baseline", "text-before-edge").classed("titleBar", true);
        this.svg.titleBar.append("text").text(this.secondTitle).attr("dominant-baseline", "text-before-edge").attr("dy", this._titleHeight / 2);
    },
    _drawEventRect: function() {
        var $figure = this;
        if (this.svg.drawArea.eventRects) this.svg.drawArea.eventRects.remove();
        var self = this,
            set = this._getXset(),
            chart = this.svg.drawArea.figure,
            zoomScale = self._zoomScale ? self._zoomScale : 1,
            eventManager = this.$chart.eventManager;
        if(!set) return;
        _width = Math.floor(this._figureWidth / (set.length + 1) * zoomScale);
        this.svg.drawArea.eventRects = chart.append("g").attr("class", "eventRect");
        this.svg.drawArea.eventRects.selectAll("rect").data(set)
            .enter()
            .append("rect")
            .attr("x", function(d, i) {
                return self._getXScale()(d) - _width / 2
            })
            .attr("y", 0)
            .attr("width", _width)
            .attr("height", self._figureHeight)
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
                    self.toolTip.setContent($figure.getTooltipContent(content));
                    self.toolTip.setVisiable(true);
                }

            })
            .on("click", function(d, i) {
                if($figure.customeLine) return;
                var sharps = d3.selectAll(".event-sharp-" + i),
                mouse = d3.mouse(chart.node());
                self.toolTip.setVisiable(false);
                self._removeGuideLine();
                sharps.filter(function(d) {
                    return d._parent.isInSharp(this);
                }).each(function(d) {
                    var data = d._parent._parent;
                    if (data.isSelected) {
                        eventManager.callEventHandler("deSelect", [data]);
                        eventManager.callEventHandler("dataSelect", data);
                        data.isSelected = false;
                    } else {
                        data.isSelected = true;
                        eventManager.callEventHandler ("select", [data]);
                        eventManager.callEventHandler("dataSelect", data);
                    }
                    //event.stopPropagation();
                    self._setSelectStyle();
                });
            });
    },
    _drawChart: function(datas) {
        var self = this;
      datas.forEach(function(v) {
            if (v.type === "area") {
                if (v.figure)
                {
                    v.figure.remove();
                    v.figure = v.figureObj.drawOn(self.svg.drawArea.figure);
                }else{
                    v.figure = v.figureObj.drawOn(self.svg.drawArea.figure,true);
                }
            }
        });
         datas.forEach(function(v) {
            if (v.type === "bar") {
                if (v.figure)
                {
                    v.figure.remove();
                    v.figure = v.figureObj.drawOn(self.svg.drawArea.figure);
                }else{
                    v.figure = v.figureObj.drawOn(self.svg.drawArea.figure,true);
                }
            }
        });
         datas.forEach(function(v) {
            if (v.type === "boxplot") {
                if (v.figure)
                {
                    v.figure.remove();
                    v.figure = v.figureObj.drawOn(self.svg.drawArea.figure);
                }else{
                    v.figure = v.figureObj.drawOn(self.svg.drawArea.figure,true);
                }
            }
        });
         datas.forEach(function(v) {
            if (v.type === "dashline") {
                if (v.figure)
                {
                    v.figure.remove();
                    v.figure = v.figureObj.drawOn(self.svg.drawArea.figure);
                }else{
                    v.figure = v.figureObj.drawOn(self.svg.drawArea.figure,true);
                }
            }
        });
         datas.forEach(function(v) {
            if (v.type === "line") {
                if (v.figure)
                {
                    v.figure.remove();
                    v.figure = v.figureObj.drawOn(self.svg.drawArea.figure);
                }else{
                    v.figure = v.figureObj.drawOn(self.svg.drawArea.figure,true);
                }
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
    _drawGuideLine: function(point) {
        var self = this,$chart =this.$chart;
        var xScale = self._getXScale(),
            yScale = point._parent.y2 ? self._getY2Scale() : self._getYScale();
        if (!self._guideLineGroup) self._guideLineGroup = this.svg.drawArea.figure.append("g").attr("class", "guide-lines");
        point._parent.getY(point).forEach(function(v) {
            if (point._parent.y2) {
                self._guideLineGroup
                    .append("line")
                    .attr("x1", 0)
                    .attr("y1", yScale(v))
                    .attr("x2", self._figureWidth)
                    .attr("y2", yScale(v))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", "3,3");
                self._guideLineGroup.append("circle")
                                    .attr("cx",self._figureWidth)
                                    .attr("cy", yScale(v))
                                    .attr("r",4);
            } else {
                //xScale(point._parent.getX(point)[0])
                self._guideLineGroup
                    .append("line")
                    .attr("x1", self._figureWidth)
                    .attr("y1", yScale(v))
                    .attr("x2", 0)
                    .attr("y2", yScale(v))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1)
                    .attr("stroke-dasharray", "3,3");
                self._guideLineGroup.append("circle")
                                    .attr("cx",0)
                                    .attr("cy", yScale(v))
                                    .attr("r",4);
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
            .attr("y2", self._figureHeight)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");
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
    _reDraw: function() {
        this.reset();
        this._draw();
    },
    reset:function(){
        if (this.svg) {
            this.svg.selectAll("g").remove();
            this.svg.selectAll("defs").remove();
            this._removeGuideLine();
            this.svg.remove();
        }
        this.isInitDraw=false;
        if (this._xScale) delete this._xScale;
        if (this._yScale) delete this._yScale;
        if (this._y2Scale) delete this._y2Scale;
        if (this._zoomScale)  delete this._zoomScale;     
        return this;
    },
    _getXScale: function() {
        
        if(!this._xScale ){
            var span =(this._getMaxXData() -this._getMinXData())/24;
            if(this.type="timeSeries"){
                this._xScale = d3.time.scale()
                                .range([0, this._figureWidth])
                                .domain([this._getMinXData() - span, this._getMaxXData() + span]);          
            }else{
                this._xScale = d3.scale.linear()
                                .range([0, this._figureWidth])
                                .domain([this._getMinXData() - span, this._getMaxXData() + span]);
            }
                     
        }
      
        return this._xScale;
    },
    _getYScale: function() {
       
        if(!this._yScale){
             var span = (this._getMaxYData() - this._getMinYData()) / 10;
            this._yScale = this._yScale || d3.scale.linear()
                .range([0, this._figureHeight])
                .domain([this._getMaxYData() + span, this._getMinYData() - 3 * span]).nice();
        }
        return this._yScale;
    },
    _getY2Scale: function() {
        
        if(!this._y2Scale){
            var span = (this._getMaxY2Data() - this._getMinY2Data()) / 10;
            this._y2Scale = this._y2Scale || d3.scale.linear()
                .range([0, this._figureHeight])
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
    _setSelectStyle: function() {
        var self = this;
        var isAllSelect = (this.datas.find(function(v) {
            return !v.isSelected;
        }) === undefined);
        if(isAllSelect){
            this.datas.forEach(function(v){
                v.isSelected = false;
            })
        }
        var hasSelect = !(this.datas.find(function(v) {
            return v.isSelected;
        }) === undefined);
        if (hasSelect) {
            this.datas.forEach(function(v) {
                if (v.figure) {
                    if(["line","dashline","bar"].indexOf(v.type)!== -1){
                          v.figure.classed("notSelected", !v.isSelected);
                    }else{
                         var _result = v.isSelected ? "visible" : "hidden";
                         v.figure.style("visibility", _result);
                    }
                  
                }
            });
        } else {
            this.datas.forEach(function(v) {
                 if (v.figure) {
                    if(["line","dashline","bar"].indexOf(v.type)!== -1){
                          v.figure.classed("notSelected", false);
                    }else{
                         var _result = v.isSelected ? "visible" : "hidden";
                         v.figure.style("visibility", "visible");
                    }
                  
                }
            })
        }
    },
    _deselectAll: function() {
        var self = this;
        var datas=[];
        self.datas.forEach(function(v) {
            if(v.isSelected) datas.push(v);
            delete v.isSelected;
        });
        this.$chart.eventManager.callEventHandler("dataSelect",this);
        this.$chart.eventManager.callEventHandler("deSelect",datas);
    },
    _zoomed: function() {
        var max,min;
        min = this._getXScale()(this._getXset()[0]);
        max = this._getXScale()(this._getXset()[this._getXset().length-1]);
        if(max< this._figureWidth/2 || min > this._figureWidth/2) {
           this.zoom.translate(this.translate);
        };
        this.translate=this.zoom.translate();
        var self = this;
        this._zoomScale = d3.event.scale;
        this._drawAxis();
        this._drawEventRect();
        self.toolTip.setVisiable(false);
        self._removeGuideLine();
        this._drawChart(this.datas, this._figures);
        this._setSelectStyle();
        this.drawCustomeLine(this.p1,this.p2);
    },
    getTooltipContent: function(datas) {
        var text = "",
            self = this;
        var title = this.xValueFormat(datas[0].x);
        text = "<table class='tool-tip-table' ><tbody><tr><th class = 'tooltip-title' colspan='3'>" + title + "</th></tr>";
        datas.forEach(function(data) {
            text += self.parseTooltipData(data);
        });
        return text += "</tbody><table>";
    },
     parseTooltipData: function(point) {
         var $figure = this,$chart = $figure.$chart;
        var data = point._parent,
            dataParent = data._parent,
            text = "";
        if (data.type === "line" || data.type === "dashline" || data.type === "bar") {
            text += "<tr>";
            text += "<td class='tooltip-name'><span style=' background-color:" + dataParent.color + "'></span>" + dataParent.name + "</td>";
            if(data.y2){
                text += "<td class='tooltip-value'>" + ($chart.labels_timeseries_y2Label || $figure.y2Title) + "</td>";
            }else{
                text += "<td class='tooltip-value'>" + ($chart.labels_timeseries_yLabel  || $figure.yTitle) + "</td>";
            }
            text += "<td class='tooltip-value'>" + point.y + "</td>";
            text += "</tr>";
        }
        if(data.type ==="boxplot"){
            text += "<tr>";
            text += "<td class='tooltip-name' rowspan='6'><span style=' background-color:" + dataParent.color + "'></span>" + dataParent.name + "</td>";
            text+= "<td class='tooltip-value'>" +$chart.labels_timeseries_d0Label || "Data 0" + "</td>";
            text += "<td class='tooltip-value'>" + point.d0 + "</td>";
            text += "</tr>";
            text += "<tr>";
           
            text+= "<td class='tooltip-value'>" + $chart.labels_timeseries_d1Label || "Data 1"+ "</td>";
            text += "<td class='tooltip-value'>" + point.d1 + "</td>";
            text += "</tr>";
            text += "<tr>";
            
            text+= "<td class='tooltip-value'>" +$chart.labels_timeseries_d2Label || "Data 2"+ "</td>";
            text += "<td class='tooltip-value'>" + point.d2 + "</td>";
            text += "</tr>";
            text += "<tr>";

            text+= "<td class='tooltip-value'>" + $chart.labels_timeseries_d3Label || "Data 3" + "</td>";
            text += "<td class='tooltip-value'>" + point.d3 + "</td>";
            text += "</tr>";
            text += "<tr>";
  
            text+= "<td class='tooltip-value'>" +$chart.labels_timeseries_d4Label || "Data 4" + "</td>";
            text += "<td class='tooltip-value'>" + point.d4 + "</td>";
            text += "</tr>";

            text+= "<td class='tooltip-value'>" +$chart.labels_timeseries_d5Label || "Data 5" + "</td>";
            text += "<td class='tooltip-value'>" + point.d5 + "</td>";
            text += "</tr>";
        }
        return text;
    },
    enableDrawLine:function(){
        var drawCanvas = this.svg.drawArea,self = this;
        drawCanvas.on("click",self.getLinePosition.bind(this));
    },
    getLinePosition:function(){
        if(d3.event.defaultPrevented) return;
        if(this.p1 &&  this.p2)
        {
            this.p1 = null;
            this.p2 = null;
            if(this.customeLineFigure) this.customeLineFigure.remove();
        }

        if(this.p1){
        var self = this;
        var position = d3.mouse(this.svg.drawArea.node());
           this.svg.drawArea.on("mousemove",null)
           self.p2={};
            self.p2.x=self._getXScale().invert(position[0]);
            self.p2.y = self._getYScale().invert(position[1]);
            self.drawCustomeLine(this.p1,this.p2);
           
        }else{
            var position = d3.mouse(this.svg.drawArea.node());
            this.p1 ={};
            this.p1.x=this._getXScale().invert(position[0]);
            this.p1.y = this._getYScale().invert(position[1]);
            var self = this;
            this.svg.drawArea.on("mousemove",function(){
                var position = d3.mouse(self.svg.drawArea.node());
                var p2={};
                p2.x=self._getXScale().invert(position[0]);
                p2.y = self._getYScale().invert(position[1]);
                self.drawCustomeLine(self.p1,p2,true);
            })
        }
       
    },
    drawCustomeLine:function (p1,p2,isMouseMove) {
         if(p1 && p2){
            var x0,y0,x1,y1,x2,y2;
            x0=this._getXScale()(p1.x),y0=this._getYScale()(p1.y),x2=this._getXScale()(p2.x),y2=this._getYScale()(p2.y);
            
            if(y2>y0){
                var tempx=x2,tempy=y2;
                x2=x0;y2=y0;x0=tempx;y0=tempy;
            }
            x1=x0;
            y1=y0;
            if(!isMouseMove){
                   if(x2 ===x0 && y2 === y0) return;
                    x1=2*x0-x2;
                    y1=2*y0-y2;
                    while( (y1>-5000&&y1<5000)&&(x1>-5000&&x1<5000)){
                        x1=2*x0-x2;
                        y1=2*y0-y2;
                        x0=x1;
                        y0=y1;
                    }
                    x0=x2;
                    y0=y2;
                    while(x2>-5000&&x2<5000&&y2>-5000&&y2<5000){
                        x2=2*x0-x1;
                        y2=2*y0-y1;
                        x0=x2;
                        y0=y2;
                        
                    }
        
            }
            
            if(this.customeLineFigure) this.customeLineFigure.remove();
            this.customeLineFigure=this.svg.drawArea.figure.append("line").attr("x1",x1)
                                                .attr("y1",y1)
                                                .attr("x2",x2)
                                                .attr("y2",y2)
                                                .attr("stroke", "black")
                                                .attr("stroke-width", 2)
                                                .attr("stroke-dasharray", "3,3");
        }
    }
});
var SmartTrafficRadarChart = SmartTrafficChartClass.extend({
     mapkey:["d0","d1","d2","d3","d4","d5","d6","d7","d8","d9"],
      init:function(chart,config){
          this.$chart= chart;
          var $chart =chart;
          if($chart.axis_radar ===undefined || $chart.axis_radar.length <2)
          {
              return null;
          }
          this.isInitDraw = false;
          this.axisNum =$chart.axis_radar.length
          this.title = config.title;
          this.radarValueFormater=chart.radarValueFormater;
          this.scales ={};
          this.toolTip = chart.toolTip;
          this.axises=$chart.axis_radar;
          this.$chart.eventManager.addEventHandler("adddata",function(data,sender){
         if(this.svg) this._reDraw()},this);
         this.$chart.eventManager.addEventHandler("removedata",function(data,sender){
         if(this.svg) this._reDraw()},this);
         this.$chart.eventManager.addEventHandler("dataSelect",function(){this._setSelectStyle()},this);
         this.$chart.eventManager.addEventHandler("legendmouseover",function(d){
             var self =this;
             var datas=[];
            this.mapkey.forEach(function(key,i){
                if(d.figureObj._d[key]!==undefined){
                    datas.push({i:i,data:d.figureObj._d[key]});
                }
            });
            this._drawDetailValue(datas);
            // this.$chart.datas.forEach(function(v){
            //     if(v.id!==d.id){
            //           v.figure.style("visibility", "hidden");
            //     }else{
            //         v.figure.style("visibility", "visible");
            //     }
            // })
         },this)
         this.$chart.eventManager.addEventHandler("legendmouseout",function(d){
            this._drawDetailMaxValue();
           // this._setSelectStyle();
         },this)
      },
      _parseData:function(originData){
          var type =originData.config.type;
            if (type === "radar") {
                return Radar.create(originData,this);
            }
      },
      _calculateMargin:function(){
          var $chart = this.$chart,width =$chart._figureWidth,height=$chart._figureHeight;
          this._titleHeight = 60;
          this._marginLeft=20;
          this._marginRight=20;
          this._marginBottom=40;
          this._drawAreaWidth = width-this._marginLeft-this._marginRight;
          this._drawAreaHeight = height - this._titleHeight-this._marginBottom;

      },
      _initDraw:function(){
        var self = this,$chart = this.$chart;
        this.svg= $chart.svg.figure;
        this.svg.title=this.svg.append("g").classed("SmartTrafficChart-title",true)
                            .attr("transform","translate("+(this._marginLeft+this._drawAreaWidth/2)+",5)");
        this.svg.drawArea =this.svg.append("g").attr("transform","translate("+this._marginLeft+","+this._titleHeight+")")
                                                                        .attr("click","drawArea").attr("class","drawArea");
        this.svg.drawArea.axis= this.svg.drawArea.selectAll(".axis")
                                                                                .append("svg:g").classed("axis",true);
        this.svg.drawArea.axisTickets= this.svg.drawArea.selectAll(".axis-ticks")
                                                                                .append("svg:g").classed("axis-ticks",true);
      },
      _getScale:function(key){
            var figure = this,$chart = this.$chart,axis=figure.svg.drawArea.axis;
            if(!figure.scales[key]){
                var  span,max,min;
                max =figure._getMaxData(key);
                min = figure._getMinData(key);
                 if(min === max){
                    min/=2;
                    if(max===0) max+=100;
                }
                span =(max -min)/10;
                max +=span;
                min-=2*span; 
                figure.scales[key] = d3.scale.linear()
                                                    .range([0,Math.min(figure._drawAreaHeight/2,figure._drawAreaWidth/2)])
                                                    .domain([min,max]);
            }
            return  figure.scales[key];

      },
      _draw:function(datas){
          if(!this.isInitDraw){
              this._calculateMargin();
              this._initDraw();
              this.isInitDraw = true;
          }
            this._drawAxis();
            this._drawAxisLabels();
            this._drawAxisTickets();
         this._drawTitle();
         var self =this;
         this._drawEventRect();
         this.$chart.datas.forEach(function(data){
            if(data.type === "radar") {
                if(data.figure){
                      data.figure.remove();
                      data.figure = data.figureObj.drawOn(self.svg.drawArea);
                }else{
                    data.figure = data.figureObj.drawOn(self.svg.drawArea,true);
                }
                
            }
        });
        this._drawDetailMaxValue();
        this._setSelectStyle();
      },
      _drawAxis:function(){
          var figure = this,$chart = this.$chart,axis=figure.svg.drawArea.axis;
          var r = Math.min(figure._drawAreaHeight/2,figure._drawAreaWidth/2)
          axis.data(figure.axises).enter()
                                    .append("svg:line")
                                    .attr("x1",figure._drawAreaWidth/2)
                                    .attr("y1",figure._drawAreaHeight/2)
                                    .attr("x2",function(d,i){return figure._drawAreaWidth/2+ r*( Math.sin(i * 2*Math.PI / figure.axisNum))})
                                    .attr("y2",function(d,i){return figure._drawAreaHeight/2+ r*( - Math.cos(i * 2*Math.PI / figure.axisNum))})
                                    .attr("stroke", "grey")
                                    .attr("stroke-width", "1px");
                                  //  1 - 1.3 * Math.sin(i * 2*Math.PI / figure.axisNum)
      },
      _drawAxisLabels:function(){
        var figure = this,$chart = this.$chart,axis=figure.svg.drawArea.axis;
        var r = Math.min(figure._drawAreaHeight/2,figure._drawAreaWidth/2)
        axis.data(figure.axises).enter()
                                    .append("svg:text")
                                    .text(function(d) { return d; })
                                    .attr("text-anchor", "middle")
                                    .attr("x",function(d,i){return figure._drawAreaWidth/2+ r*(1.05* Math.sin(i * 2*Math.PI / figure.axisNum))})
                                    .attr("y",function(d,i){return figure._drawAreaHeight/2+ r*( -1.03* Math.cos(i * 2*Math.PI / figure.axisNum))})
                                    .attr("font-size", "18px");
      },
      _drawAxisTickets:function(){
            var figure = this,$chart = this.$chart,ticks=figure.svg.drawArea.axisTickets,_r;
            var r = Math.min(figure._drawAreaHeight/2,figure._drawAreaWidth/2)
            for(var i = 0; i<5 ;++i){
             _r =r*(i+1)/5;
              ticks.data(figure.axises).enter()
                                    .append("svg:line")
                                    .attr("x1",function(d,i){return figure._drawAreaWidth/2+ _r*( Math.sin(i * 2*Math.PI / figure.axisNum))})
                                    .attr("y1",function(d,i){return figure._drawAreaHeight/2+ _r*( - Math.cos(i * 2*Math.PI / figure.axisNum))})
                                    .attr("x2",function(d,i){return figure._drawAreaWidth/2+ _r*( Math.sin((i+1) * 2*Math.PI / figure.axisNum))})
                                    .attr("y2",function(d,i){return figure._drawAreaHeight/2+ _r*( - Math.cos((i+1) * 2*Math.PI / figure.axisNum))})
                                    .attr("stroke", "grey")
                                    .attr("stroke-width", "1px")
                                    .attr("stroke-dasharray", "2,2");
                      }
      },
      _drawTitle:function(){
           var figure = this,$chart = this.$chart;
           this.svg.title .append("svg:text")
                                .text($chart.title)
                                .attr("text-anchor", "middle")
                                .attr("font-size","22px")
                                .attr("dominant-baseline", "text-before-edge");
      },
      _drawEventRect:function(){
          var $figure=this; var $chart=$figure.$chart;
         var r = Math.min($figure._drawAreaHeight/2,$figure._drawAreaWidth/2)
          if(this._eventFigure) this._eventFigure.remove();
          var arc = d3.svg.arc()
			.startAngle(function(d,i) { return (360/$figure.axises.length) *(i)*2*Math.PI /360 -Math.min(Math.PI/12,360/$figure.axises.length)})
			.endAngle(function(d,i) {return (360/$figure.axises.length) *(i)*2*Math.PI /360+Math.min(Math.PI/12,360/$figure.axises.length)})
			.innerRadius(0)
			.outerRadius(r);
          this._eventFigure= this.svg.drawArea.append("g").classed("event-figure",true).attr("transform","translate("+$figure._drawAreaWidth/2+","+$figure._drawAreaHeight/2+")")
          this._eventFigure.selectAll("path").data($figure.axises)
                                                                .enter()
                                                                .append("svg:path")
                                                                .attr("d",arc)
                                                                .attr("fill","black")
                                                                .attr("fill-opacity", "0")
                        .on("mouseout", function(d, i) {
                            $figure.toolTip.setVisiable(false);
                            //self._removeGuideLine();
                        })
                        .on("mousemove", function(d, i) {
                            var sharps = $figure.svg.selectAll(".event-radar-" + i);
                                content = [];
                            $figure.toolTip.setVisiable(false);
                        // self._removeGuideLine();
                            sharps.filter(function(d) {
                                return true;
                            }).each(function(d) {
                                //self._drawGuideLine(d);
                                content.push(d);
                            });
                            if (content.length > 0) {
                                $figure.toolTip.setPosition(event.pageX , event.pageY);
                                $figure.toolTip.setContent($figure.getTooltipContent(content));
                                $figure.toolTip.setVisiable(true);
                            }

                        })
                        .on("click", function(d, i) {
                            var sharps = $figure.svg.selectAll(".event-radar-" + i);
                            $figure.toolTip.setVisiable(false);
                            //self._removeGuideLine();
                            sharps.filter(function(d) {
                                return true;
                            }).each(function(d) {
                                var data = d.originData;
                                if (data.isSelected) {
                                    eventManager.callEventHandler("deSelect", [data]);
                                    eventManager.callEventHandler("dataSelect", data);
                                    data.isSelected = false;
                                } else {
                                    data.isSelected = true;
                                    eventManager.callEventHandler ("select", [data]);
                                    eventManager.callEventHandler("dataSelect", data);
                                }
                                //event.stopPropagation();
                                $figure._setSelectStyle();
                            });
                        });

      },
      _drawDetailMaxValue:function(){
            var datas=[],self=this;
             var hasSelect = !(this.$chart.datas.find(function(v) {
                    return v.isSelected;
                }) === undefined);
            if(hasSelect){
                this.mapkey.forEach(function(k,i){
                var data= Number.MIN_VALUE;
                    self.$chart.datas.forEach(function(v){
                        if(v.figureObj &&v.isSelected){
                            if(v.figureObj._d[k] !==undefined){
                                data=Math.max(data,v.figureObj._d[k]);
                            }
                        }
                    })

                if(data !== Number.MIN_VALUE){
                    datas.push({i:i,data:data});
                }
            }) 
            }else{
                 this.mapkey.forEach(function(k,i){
                var data= Number.MIN_VALUE;
                    self.$chart.datas.forEach(function(v){
                        if(v.figureObj ){
                            if(v.figureObj._d[k] !==undefined){
                                data=Math.max(data,v.figureObj._d[k]);
                            }
                        }
                    })

                if(data !== Number.MIN_VALUE){
                    datas.push({i:i,data:data});
                }
            })
            }
           
          self._drawDetailValue(datas);
      },
      _drawDetailValue:function(vals){
           var scales = this._getScale.bind(this),getCoordinate=this._getCoordinate.bind(this),datas=[],figure=this;
            for(var i =0; i<vals.length;++i){
                var val ={},r,coor;
                val.i=vals[i].i;
                val.data=vals[i].data;
                r=scales(this.mapkey[val.i])(val.data);
                val.x=figure._drawAreaWidth/2+ r*(1.02* Math.sin(val.i * 2*Math.PI / figure.axisNum));
                val.y=figure._drawAreaHeight/2+ r*( -1.02* Math.cos(val.i * 2*Math.PI / figure.axisNum));
                datas.push(val);
            }
            this.svg.drawArea.selectAll(".detail-text").remove();
            var textArea=  this.svg.drawArea.selectAll(".detail-text").data(datas)
                            .enter()
                            .append("svg:text")
                            .attr("text-anchor", "middle")
                            .attr("x", function(d){return d.x})
                            .attr("y", function(d){return d.y})
                            .text(function(d){
                                 if(figure.radarValueFormater){
                                     return figure.radarValueFormater(d.data)}
                                    else{
                                       return d.data; 
                                    }}
                                 )
                            .attr("class","detail-text");
      },
      _reDraw:function(){
          this.reset();
          this._draw();
      },
      reset:function(){
        if(this.svg) {
            this.svg.selectAll("g").remove();
            this.svg.selectAll("text").remove();
            this.svg.remove();
          }
        this.isInitDraw = false;
        this.scales =[];
      },
     _getMinData:function(key){
        var d= Number.MAX_VALUE;
         this.$chart.datas.forEach(function(v){
             if(v.figureObj){
                 if(v.figureObj._d[key] !==undefined){
                     d=Math.min(d,v.figureObj._d[key]);
                 }
             }
         })
        return d;
    },
    _getMaxData:function(key){
        var d= Number.MIN_VALUE;
         this.$chart.datas.forEach(function(v){
             if(v.figureObj){
                 if(v.figureObj._d[key] !==undefined){
                     d=Math.max(d,v.figureObj._d[key]);
                 }
             }
         })
        return d;
    },
    _getCoordinate:function(r,axisIndex,_d){
        var c={};
        c.x= this._drawAreaWidth/2+ r*( Math.sin(axisIndex * 2*Math.PI / this.axisNum));
        c.y= this._drawAreaHeight/2+ r*( -Math.cos(axisIndex * 2*Math.PI / this.axisNum));
        c.i =axisIndex;
        c.originData=_d;;
        return c;
    },
    _setSelectStyle:function(){
        var datas=this.$chart.datas;
        var hasSelect = !(datas.find(function(v) {
            return v.isSelected;
        }) === undefined);
       if(hasSelect){
           datas.forEach(function(v){
            if (v.figure) {
                                var _result = v.isSelected ? "visible" : "hidden";
                                v.figure.style("visibility", _result);
                            }
           });
       }else{
              datas.forEach(function(v){
            if (v.figure) {
                                v.figure.style("visibility", "visible");
                }
           });
       }
    },
    getTooltipContent: function(datas) {
        var text = "",
            self = this;
        var $chart=this.$chart,$figure=this;
        var title = $chart.labels_radar[datas[0].i]  || $figure.axises[datas[0].i] ;
        text = "<table class='tool-tip-table' ><tbody><tr><th class = 'tooltip-title' colspan='3'>" + title + "</th></tr>";
        datas.forEach(function(data) {
            text += self.parseTooltipData(data);
        });
        return text += "</tbody><table>";
    },
     parseTooltipData: function(point) {
         var $figure = this,$chart = $figure.$chart;
         var i = point.i;
        var data = point.originData._parent,
            dataParent = data._parent,
            text = "";
            text += "<tr>";
            text += "<td class='tooltip-name'><span style=' background-color:" + dataParent.color + "'></span>" + dataParent.name + "</td>";
            text += "<td class='tooltip-value'>" + point.originData["d"+i] + "</td>";
            text += "</tr>";
        return text;
    }
});
var Radar=SmartTrafficChartClass.extend({
    type:"radar",
    mapkey:["d0","d1","d2","d3","d4","d5","d6","d7","d8","d9"],
    init:function(originData,figure){
         var config = originData.config,
            self = this;
        this.figure = figure;
        this.$chart = figure.$chart;
        this._d=originData.data;
        var mapkey = this.mapkey;
        mapkey.forEach(function(key) {
            if (config[key]) {
                if (config[key] !== key) {
                    self._d[key] = self._d[config[key]];
                    delete self._d[config[key]];
                }
            }
        
        });
    this._d._parent=this;
       // this.mergeOption(option);
    },
    drawOn:function(svg,isTransition){
        var transitionTime = 1000;
       var scales = this.figure._getScale.bind(this.figure),getCoordinate=this.figure._getCoordinate.bind(this.figure);
       var  lineGen = d3.svg.line()
            .x(function(d) {
                return d.x
            })
            .y(function(d) {
                return d.y
         });
    var datas =[];
    for(var i = 0; i<this.mapkey.length;++i){
        if(this._d[this.mapkey[i]] !== undefined){
            var r= scales(this.mapkey[i])(this._d[this.mapkey[i]])
            var d=getCoordinate(r,i,this._d);
            datas.push(d);
        }
    }
    var area = svg.append("svg:g").attr("class","radar-area");
    var tFunction=function(d){
        d.attr("opacity",0)
            .transition()
            .duration(transitionTime)
            .ease("linear")
            .attr("opacity",0.4);
    }
    var p=area.append("svg:path")
            .attr('d', lineGen(datas))
            .attr('stroke', this._parent.color)
            .attr('stroke-width', 2)
            .attr('fill',this._parent.color)
            .attr("opacity",0.4)
            .attr("pointer-events", "none");
    area.selectAll("circle").data(datas)
                        .enter()
                        .append("svg:circle")
                        .attr("cx",function(d){return d.x}).attr("cy",function(d){return d.y}).attr("r",1)
                        .attr("fill",this._parent.color)
                        .attr("class",function(d,i){return "event-radar-"+d.i});
  
    if(isTransition){
        p.call(tFunction);
    }
        return area;
    },
    showDetailValue:function(svg,vals){
        var scales = this.figure._getScale.bind(this.figure),getCoordinate=this.figure._getCoordinate.bind(this.figure),datas=[],figure=this.figure;
        for(var i =0; i<vals.length;++i){
            var val ={},r,coor;
            val.i=vals[i].i;
            val.data=vals[i].data;
            r=scales(this.mapkey[val.i])(val.data);
            val.x=figure._drawAreaWidth/2+ r*(1.02* Math.sin(val.i * 2*Math.PI / figure.axisNum));
            val.y=figure._drawAreaHeight/2+ r*( -1.04* Math.cos(val.i * 2*Math.PI / figure.axisNum));
            datas.push(val);
        }
        var textArea=  svg.selectAll("text").data(datas)
                        .enter()
                        .append("svg:text")
                        .attr("text-anchor", "middle")
                        .attr("x", function(d){return d.x})
                        .attr("y", function(d){return d.y})
                        .text(function(d){
                            return d.data});
    }
});
var SmartTrafficChartToolTip = SmartTrafficChartClass.extend({
    init: function(chart) {
        this.chart = chart;
    
    },
    _initDraw:function(){
            if (d3.select("#smartTrafficChart-tooltip")) d3.select("#smartTrafficChart-tooltip").remove();
                this.toolTip = d3.select("body").append("div")
                    .style("pointer-events", "none")
                    .attr("class", "smartTrafficChart-toolTip")
                    .style("position", "absolute")
                    .style("z-index", "10")
                    .attr("id","smartTrafficChart-tooltip")
                    .style("visibility", "hidden");
                if (!this.toolTip) this.toolTip = this.append("g").attr("class", "tool-tip");
    },
    setVisiable: function(isVisiable) {
        if (isVisiable) this.toolTip.style("visibility", "visible");
        else this.toolTip.style("visibility", "hidden");
    },
    setContent: function(content) {
        if (this.toolTip) this.toolTip.html(content);
    },
    setPosition: function(x, y) {
        this.toolTip =d3.select("#smartTrafficChart-tooltip");
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
    }
   
});
var LineBaseClass = SmartTrafficChartClass.extend({
    type: "line",
    mapkey: ["x", "y"],
    init: function(originData, figure) {
        var config = originData.config,
            self = this;
        this.$figure = figure;
        this.$chart = figure.$chart;
        this._d = originData.data;
        this.isHandleNaN=this.$chart.isHandleNaN ===undefined ?true:this.$chart.isHandleNaN;
        if (config.ref === "y2") {
            this.y2 = true;
        }
        var mapkey = this.mapkey;
        mapkey.forEach(function(key) {
            if (config[key]) {
                if (config[key] !== key) {
                    self._d.forEach(function(d) {
                        d[key] = d[config[key]];
                        delete d[config[key]];
                    })
                }
            }
        });
        this._d.forEach(function(d) {
                if (typeof d.x !== "time") d.x = new Date(d.x);
            });
        //this.mergeOption(option);
        this._d.forEach(function(d) {
            d._parent = self;
        })
        this._d.sort(function(v1, v2) {
            return v1.x - v2.x;
        });
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
            if(!isNaN(x)){
                x = Math.max(v.x , x);
            }
           
        });
        this._maxx =x;
        return x;
    },
    getMinX:function(){
        if(this._minx) return this._minx;
        var x = Number.MAX_VALUE;
        this._d.forEach(function(v){
              if(!isNaN(x)){
                 x = Math.min(x,v.x);
              }
        });
        this._minx =x;
        return x;
    },
    getMaxY:function(){
        if(this._maxy) return this._maxy;
         var self =this;
        this._maxy = Number.MIN_VALUE;
        this.getAllY().forEach(function(v){
            if(!isNaN(v)){
                self._maxy=Math.max(v,self._maxy);
            }
        })
        return this._maxy;
    },
     getMinY:function(){
         if(this._miny) return this._miny;
         var self =this;
        this._miny=Number.MAX_VALUE;
        this.getAllY().forEach(function(v){
            if(!isNaN(v)){
                self._miny=Math.min(v,self._miny);
            }
        })
        return this._miny;
    },
    isInSharp: function(_sharp) {
        _sharp = d3.select(_sharp);
        if (_sharp.node().nodeName === "circle") {
            var mouse = d3.mouse(this.$figure.svg.drawArea.figure.node());
            x2 = Number(_sharp.attr("cx")), y2 = Number(_sharp.attr("cy")), r = Number(_sharp.attr("r"));
            return Math.sqrt(Math.pow(mouse[0] - x2, 2) + Math.pow(mouse[1] - y2, 2)) < 3 * r;
        }
    },
    drawOn: function(svg,isTransition) {
        var transSitionTime =1000;
        var $figure = this.$figure,$chart = $figure.$chart;
        var line = svg.append("g").attr("class", "SmartTrafficChart-line").attr("pointer-events", "none");
        var parent = this._parent,
            yScale, _line, lineGen, _circle, xScale;
        yScale = this.y2 ? $figure._getY2Scale() : $figure._getYScale();
        xScale = $figure._getXScale();
        
        var lineTransition = function(l){
             var totalLength = l.node().getTotalLength();
             l.attr("stroke-dasharray", totalLength + "," + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                    .duration(transSitionTime)
                    .ease("linear")
                    .attr("stroke-dashoffset", 0);
        }
       var circleTransition=function(c){
             c.attr("opacity","0")
                         .transition()
                        .delay(transSitionTime)
                        .attr("opacity",1);
        }
        lineGen = d3.svg.line()
            .x(function(d) {
                return xScale(d.x);
            })
            .y(function(d) {
                return yScale(d.y);
            });
        _line = line.append("path")
            .attr('stroke', parent.color)
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('d', this.smartLineGen(xScale,yScale,this.isHandleNaN,this._d));

          
        _circle =
            line.selectAll("linepoint")
            .data(this._d.filter(function(v){return !isNaN(v.y)}))
            .enter()
            .append("circle")
            .attr("fill", parent.color)
            .attr("cx", function(d) {
                return xScale(d.x);
            })
            .attr("cy", function(d) {
                return yScale(d.y);
            })
            .attr("r", function(d) {
                return 4;
            })
            .attr("class", function(d, i) {
                return "event-sharp-" + $figure._getXSetIndex(d.x)
            });
        if(isTransition){
            _line.call(lineTransition);
            _circle.call(circleTransition);
        }  
        return line;
    },
    smartLineGen: function(xScale,yScale,isHandleNaN,ds){
            if (ds.length<1) return "M0,0"; 
            var lineString="";
            var isStartPoint = true;
            if(!isHandleNaN){
                ds=ds.filter(function(v){
                    return !isNaN(v.y);
                })
            }
            for(var i=0;i< ds.length;++i){
                if(isStartPoint){
                    if(isNaN(ds[i].y)) {
                        isStartPoint = true;
                        continue;
                    }else{
                        lineString+="M"+xScale(ds[i].x)+","+yScale(ds[i].y);
                        isStartPoint = false;
                    }
                }else{
                     if(isNaN(ds[i].y)) {
                        isStartPoint = true;
                        continue;
                    }else{
                         lineString+="L"+xScale(ds[i].x)+","+yScale(ds[i].y);
                    }
                }
               
            }
           return lineString;
        }
});
// var SpLine = LineBaseClass.extend({
//     type: "spline",
//     drawOn: function(svg,isTransition) {
//         var transSitionTime =1000;
//          var $figure = this.$figure,$chart = $figure.$chart;
//         var line = svg.append("g").attr("class", "SmartTrafficChart-spline").attr("pointer-events", "none");
//         var parent = this._parent,
//             yScale, _line, lineGen, _circle, xScale;
//         yScale = this.y2 ?  $figure._getY2Scale() :  $figure._getYScale();
//         xScale =  $figure._getXScale();
//         var lineTransition = function(l){
//              var totalLength = l.node().getTotalLength();
//              l.attr("stroke-dasharray", totalLength + "," + totalLength)
//                 .attr("stroke-dashoffset", totalLength)
//                 .transition()
//                     .duration(transSitionTime)
//                     .ease("linear")
//                     .attr("stroke-dashoffset", 0);
//         }
//        var circleTransition=function(c){
//              c.attr("opacity","0")
//                          .transition()
//                         .delay(transSitionTime)
//                         .attr("opacity",1);
//         }       
//         lineGen = d3.svg.line()
//             .x(function(d) {
//                 return xScale(d.x);
//             })
//             .y(function(d) {
//                 return yScale(d.y);
//             }).interpolate("monotone");
//         _line = line.append("path")
//             .attr('d', lineGen(this._d))
//             .attr('stroke', parent.color)
//             .attr('stroke-width', 2)
//             .attr('fill', 'none');
//         _circle =
//             line.selectAll("linepoint")
//             .data(this._d.filter(function(v){return !isNaN(v.y)}))
//             .enter()
//             .append("circle")
//             .attr("cx", function(d) {
//                 return xScale(d.x);
//             })
//             .attr("cy", function(d) {
//                 return yScale(d.y);
//             })
//             .attr("r", function(d) {
//                 return 4;
//             }).attr("fill", parent.color)
//             .attr("class", function(d, i) {
//                 return "event-sharp-" +  $figure._getXSetIndex(d.x)
//             });
//         if(isTransition){
//             _line.call(lineTransition);
//             _circle.call(circleTransition);
//         } 
//         return line;
//     }
// });
var DashLine = LineBaseClass.extend({
    type: "dashline",
    drawOn: function(svg,isTransition) {
        var transSitionTime =1000;
         var $figure = this.$figure,$chart = $figure.$chart;
        var line = svg.append("g").attr("class", "SmartTrafficChart-dashline").attr("pointer-events", "none");
        var parent = this._parent,
            yScale, _line, lineGen, _circle, xScale;
        yScale = this.y2 ?  $figure._getY2Scale() :  $figure._getYScale();
        xScale =  $figure._getXScale();
        var lineTransition = function(l){
             var totalLength = l.node().getTotalLength();
             l.attr("stroke-dasharray", totalLength + "," + totalLength)
                .attr("stroke-dashoffset", totalLength)
                .transition()
                    .duration(transSitionTime)
                    .ease("linear")
                    .attr("stroke-dashoffset", 0)
                    .transition()
                    .duration(0)
                     .attr("stroke-dasharray","3,3");
        }
       var circleTransition=function(c){
             c.attr("opacity","0")
                         .transition()
                        .delay(transSitionTime)
                        .attr("opacity",1);
        }       
        //lineGen = this.smartLineGen()
        _line = line.append("path")
            .attr('d', this.smartLineGen(xScale,yScale,this.isHandleNaN,this._d))
            .attr('stroke', parent.color)
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .attr("stroke-dasharray","3,3");
           
        _circle =
            line.selectAll("linepoint")
            .data(this._d.filter(function(v){return !isNaN(v.y)}))
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
                return "event-sharp-" +  $figure._getXSetIndex(d.x)
            });
        if(isTransition){
            _line.call(lineTransition);
            _circle.call(circleTransition);
        } 
        return line;
    }
});
var Area = LineBaseClass.extend({
    type: "area",
    drawOn: function(svg,isTransition) {
        var transSitionTime =1000;
        var $figure = this.$figure,$chart = $figure.$chart;
        var parent = this._parent,
            xScale =  $figure._getXScale(),
            yScale = this.y2 ?  $figure._getY2Scale() :  $figure._getYScale(),
            _area, _gen;
        _gen = d3.svg.area()
            .x(function(d) {
                return xScale(d.x);
            })
            .y0( $figure._figureHeight)
            .y1(function(d) {
                return yScale(d.y);
            }).interpolate("monotone");
        _area = svg.append("g").attr("pointer-events", "none").attr("class", "SmartTrafficChart-area").attr("opacity",0.5);
    var line=_area.append("path")
            .attr('d', _gen(this._d.filter(function(v){return !isNaN(v.y)})))
            .attr('stroke', parent.color)
            .attr('stroke-width', 0)
            .attr('fill', parent.color);
    var lineTransition = function(l){
             l.attr("opacity", 0)
                .transition()
                    .duration(transSitionTime)
                    .ease("linear")
                    .attr("opacity", 0.5);
        }       
      if(isTransition){
            _area.call(lineTransition);
        } 
        return _area;
    }
});
var Bar = LineBaseClass.extend({
    type: "bar",
    drawOn: function(svg,isTransition) {
        var transSitionTime =1000;
        var $figure = this.$figure,$chart = $figure.$chart;
        var parent = this._parent,
            yScale, barWidth, barAcc, xScale, getBarIndex = this.getBarIndex.bind(this);
        yScale = this.y2 ?  $figure._getY2Scale() :  $figure._getYScale();
        barAcc = this.getBarAcc($chart.datas);
        xScale =  $figure._getXScale();
        var zoomScale =  $figure._zoomScale ?  $figure._zoomScale : 1;
        barWidth = Math.min(25,  $figure._figureWidth / ( $figure._getXset().length+1) / barAcc * zoomScale);
        var transitionFunction=function(b){
            b.each(function(d){
                d3.select(this).attr("y",$figure._figureHeight)
                .transition()
                .duration(transSitionTime)
                .ease("linear")
                .attr("y",function(d) {
                return yScale(d.y);
            })
            });
        }
        var bar = svg.append("g")
            .attr("class", "SmartTrafficChart-bar")
            .attr("pointer-events", "none");
        var bars= bar.selectAll("rect").data(this._d.filter(function(v){return !isNaN(v.y)}))
            .enter()
            .append("rect")
            .attr("x", function(d) {
                return xScale(d.x) - (barAcc) / 2 * barWidth + getBarIndex($chart.datas) * barWidth;
            })
            .attr("y", function(d) {
                return yScale(d.y);
            })
            .attr("width", barWidth)
            .attr("height",  $figure._figureHeight)
            .attr("fill", parent.color)
            .attr("class", function(d, i) {
                return "event-sharp-" +  $figure._getXSetIndex(d.x)
            });
        if(isTransition) bars.call(transitionFunction);
        return bar;
    },
    getBarAcc: function(datas) {
        var i = 0;
        datas.forEach(function(v) {
            if (v.type === "bar") ++i;
        });
        return i;
    },
    getBarIndex: function(datas) {
        var i = 0;
        var id = this._parent.id;
        for (var j = 0; j < datas.length; ++j) {
            if (datas[j].type ==="bar") {
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
        var $figure = this.$figure,$chart = $figure.$chart;
        _sharp = d3.select(_sharp);
        if (_sharp.node().nodeName === "rect") {
            var mouse = d3.mouse( $figure.svg.drawArea.figure.node());
            x = Number(_sharp.attr("x")), y = Number(_sharp.attr("y")), width = Number(_sharp.attr("width"));
            return mouse[0] > x && mouse[1] > y && mouse[0] < x + width;
        }
    }
});
var BoxPlot = LineBaseClass.extend({
    type: "boxplot",
    mapkey: ["x", "d0", "d1", "d2", "d3", "d4"],
    init: function(originData, figure) {
        LineBaseClass.init.call(this, originData, figure);
        this.lineWidth = this.lineWidth || 20;
        this.recWidth = this.recWidth || 16;
    },
    drawOn: function(svg,isTransition) {
        var parent = this._parent,
            yScale, barWidth, barAcc, xScale,lineWidth = this.lineWidth,recWidth = this.recWidth,color = this._parent.color;
        var transSitionTime =1000;
        var $figure = this.$figure,$chart = $figure.$chart;
        yScale = this.y2 ? $figure._getY2Scale() : $figure._getYScale();
        xScale = $figure._getXScale();
        var boxplots = svg.append("g").attr("class","SmartTrafficChart-boxplot").attr("pointer-events", "none");
        this._d.forEach(function(d){
                var boxplot =boxplots.append("g").attr("class","event-sharp-" + $figure._getXSetIndex(d.x)).datum(d);
                boxplot.append("line").attr("x1", xScale(d.x)-lineWidth/2).attr("y1", yScale(d.d0))
                                                                    .attr("x2",  xScale(d.x)+lineWidth/2 ).attr("y2", yScale(d.d0))
                                                                    .attr("stroke","black").attr("stroke-width","2");
                boxplot.append("line").attr("x1", xScale(d.x)).attr("y1", yScale(d.d0))
                                                                    .attr("x2",  xScale(d.x) ).attr("y2", yScale(d.d1))
                                                                    .attr("stroke","black").attr("stroke-width","1.5px").attr("stroke-dasharray", "2,2").attr("stroke-fill".color);
                boxplot.append("rect").attr("x", xScale(d.x)-recWidth/2).attr("y", yScale(d.d1))
                                                                    .attr("width",recWidth).attr("height", yScale(d.d4)- yScale(d.d1))
                                                                    .attr("fill",color);
                boxplot.append("line").attr("x1", xScale(d.x)-recWidth/2).attr("y1", yScale(d.d2))
                                                                    .attr("x2",  xScale(d.x)+recWidth/2 ).attr("y2", yScale(d.d2))
                                                                    .attr("stroke","black").attr("stroke-width","2");
                boxplot.append("line").attr("x1", xScale(d.x)-recWidth/2).attr("y1", yScale(d.d3))
                                                                    .attr("x2",  xScale(d.x)+recWidth/2 ).attr("y2", yScale(d.d3))
                                                                    .attr("stroke","black").attr("stroke-width","2")
                                                                    .attr("stroke-dasharray", "2,2");
                boxplot.append("line").attr("x1", xScale(d.x)).attr("y1", yScale(d.d4))
                                                                    .attr("x2",  xScale(d.x)).attr("y2", yScale(d.d5))
                                                                    .attr("stroke","black").attr("stroke-width","1.5px").attr("stroke-dasharray", "2,2").attr("stroke-fill".color);
                boxplot.append("line").attr("x1", xScale(d.x)-lineWidth/2).attr("y1", yScale(d.d5))
                                                                    .attr("x2",  xScale(d.x)+lineWidth/2 ).attr("y2", yScale(d.d5))
                                                                    .attr("stroke","black").attr("stroke-width","2");
        });
        var tFunction =function(d){
            var boxs= d.selectAll("g")[0];
            boxs.forEach(function(box,i){
                d3.select(box).attr("transform","translate(0,"+$figure._figureHeight+")")
                .transition()
                .delay(i*transSitionTime/(boxs.length+1))
                .duration(transSitionTime/2)
                .ease("linear")
                .attr("transform","translate(0,+"+0+")");
            })
        }
        if(isTransition){
            boxplots.call(tFunction);
        }
        return boxplots;                                 
    },
    isInSharp:function(_sharp){
           var $figure = this.$figure,$chart = $figure.$chart;
             _sharp = d3.select(_sharp); 
             if (_sharp.style("visibility") ==="hidden") return false;
            var figure,_d,mouse,yScale,xScale,recWidth;
            yScale = this.y2 ? $figure._getY2Scale() : $figure._getYScale();
            xScale = $figure._getXScale();
            recWidth = this.recWidth;
            _d =_sharp.datum();
            mouse = d3.mouse($figure.svg.drawArea.figure.node());
            return mouse[0]> xScale(_d.x) - recWidth/2 && mouse[0] < xScale(_d.x) + recWidth/2 && mouse[1]> yScale(_d.d0) && mouse[1] <yScale(_d.d4);

    },
    getY:function(point){
        return  [point.d0,point.d1,point.d2,point.d3,point.d4];
    },
    getAllY:function(){
        return this._d.map(function(v){ return [v.d0,v.d1,v.d2,v.d3,v.d4]}).reduce(function(v1,v2){return v1.concat(v2)});
    }
});

window.SmartTrafficChart=SmartTrafficChart;
}();
