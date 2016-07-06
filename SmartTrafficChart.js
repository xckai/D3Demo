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
        this._colors =["#FFCC66","#5CBAE6","#FF6666","#8CD3FF","#993366","#669966","#CCC5A8","#D998CB","#DBDB46","#660066","#FAC364"];
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
            this.datas[i].line = data.line || this.datas[i].line;
            this.datas[i].line._parent =this.datas[i];
        } else {
            this.datas.push(data);
        }
        this._xSet(true);
        if (this.svg) this._reDraw();
    } ,
    _xSet:function(isUpdata){
        if(!isUpdata) return this.xSet;
        var self = this , datas =this.datas;    
        this.xSet = [];
        datas.forEach(function(data){
            if (data.line) {
                 data.line._d.forEach(function(v){
                            if(!self.xSet.find(function(x){
                            return x - v.x === 0;
                })){
                    self.xSet.push(v.x);
                }
                })
         }
        });
        this.xSet = this.xSet.sort(function(v1,v2){
            return v1 -v2;
        });
        return this.xSet;
    },
    _getXSetIndex:function (obj){
        if(! this._xSet()) return -1;
        var _index = -1 ,set = this._xSet();
        for( var i = 0; i < set.length; ++i){
            if(set[i] -obj === 0) {
                _index = i;
                break;
            }
        }    
        return _index;
     },
    _parseData: function(originData) {
        var data = {},self = this;
        data.name = originData.name;
        data.id = originData.id;
        if(originData.id === undefined){
            data.id = "smartTraffic" +this.datas.length;
        }
        if(originData.option)
        {   
            var option = originData.option;
            data.type = option.type || "line";
            data[data.type]={};
            data.color = option.color || this._getColor();
            data[data.type].baseWidth = option.width || 2;
            data[data.type]._d = originData.data;
            if(option.x){
                  data[data.type]._d.forEach(function(d){
                     d.x = d[option.x];
                     delete d[option.x];
                 })
            }
            if(option.y){
                  data[data.type]._d.forEach(function(d){
                     d.y = d[option.y];
                     delete d[option.y];
                 })
            }
             if(option.y2){
                  data[data.type].y2 = true;
                  data[data.type]._d.forEach(function(d){
                     d.y2 = d[option.y2];
                     delete d[option.y2];
                 })
            }
            if(self.xType === "time"){
                data[data.type]._d.forEach(function(d){
                        if(typeof d.x !== "time") d.x = new Date(d.x);
                })
            }
              data[data.type]._d.forEach(function(d){
                  d._parent = data[data.type];
              })
            
            data[data.type]._d.sort(function(v1,v2){
                return v1.x -v2.x;
            });
            data[data.type]._parent = data;
            delete data.type;
        }
        else{
            throw new Error("no data option ");
        }
        return data;
    },
    _hasY2:function(){
         var find =false;
         this.datas.forEach(function(d){
            if(d.line) {
                find = d.line.y2 || false;
            }
        })
        return find;
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
        this._yTitleWidth =20;
        this._yAxisWidth = 40;
        this._chartWidth = Math.floor((this.width - this._yTitleWidth - this._yAxisWidth)*0.8);
        this._infoBarMargin = 20;
        this._infoBarWidth = Math.floor((this.width - this._yTitleWidth - this._yAxisWidth)*0.2) -20;
        if(this._hasY2()) {
            this._y2AxisWidth = 40;
            this._y2TitleWidth =20;
            this._chartWidth = Math.floor((this.width - this._yTitleWidth - this._yAxisWidth - this._y2TitleWidth- this._y2AxisWidth)*0.8);
            this._infoBarWidth = Math.floor((this.width - this._yTitleWidth - this._yAxisWidth- this._y2AxisWidth- this._y2TitleWidth)*0.2) -20;
        }
        if (this.secondTitle) {
            this._titleHeight = 50;
            this._xAxisHeight = 20;
            this._xTitleHeight =20;
            this._chartHeight =this.height - this._titleHeight - this._xAxisHeight -this._xTitleHeight;
        } else {
            this._titleHeight = 30;
            this._xAxisHeight = 20;
            this._xTitleHeight =20;
            this._chartHeight =this.height - this._titleHeight - this._xAxisHeight -this._xTitleHeight;
        }
        return this;
    },
    _drawAxisXLine: function() {

    },
    _drawGuideLine:function(x,y,x1,y1){
        guideLine.addGuideLine.call(this,this.svg.drawArea.chart,x,y,x1,y1);
    },
    _removeGuideLine:function(){
       guideLine.removeGuideLine.call(this);
    },
    _drawAxis: function() {
        var self = this;
        if(this._xAxis) this._xAxis.remove();
        this._xAxis = this.svg.drawArea.x.append("svg:g")
            .attr("transform", "translate(0," + (this._chartHeight) + ")")
            .attr("class","xaxis")
            .call(d3.svg.axis().scale(this._getXScale()).orient("bottom").tickFormat(function(d){
                if(self.xType === "time"){
                    return d.getHours() +":"+ d.getMinutes();
                }
            }))
            .classed("axis", true);
         //x.selectAll("g").append("line").attr("x2",0).attr("x1",0).attr("y1",0).attr("y2", - self._chartHeight).attr("stroke-width",1).attr("stroke","black").attr("opacity","0.2");
        if(this._yAxis) this._yAxis.remove();
        this._yAxis = this.svg.drawArea.y.append("svg:g")
            .attr("class","yaxis")
            .call(d3.svg.axis().scale(this._getYScale()).orient("left"))
            .classed("axis", true);
          this._yAxis.selectAll("g").append("line").attr("x2",self._chartWidth ).attr("x1",0).attr("y1",0).attr("y2",0).attr("stroke-width",1).attr("stroke","black").attr("opacity","0.2") .attr("stroke-dasharray","5,3");
        if(this._hasY2()){
            if(this._y2Axis) this._y2Axis.remove();
            this._y2Axis = this.svg.drawArea.y.append("svg:g")
                                        .attr("class","y2axis")
                                        .attr("transform","translate("+this._chartWidth+",0)")
                                        .call(d3.svg.axis().scale(this._getY2Scale()).orient("right"))
                                        .classed("axis", true);
        } 
   },
    _drawLine: function(data) {
        var self = this;
        
        var lineGen = data.line.y2?  d3.svg.line()
            .x(function(d) {
                return self._xScale(d.x);
            })
            .y(function(d) {
                return self._getY2Scale()(d.y2);
            }) :  d3.svg.line()
            .x(function(d) {
                return self._xScale(d.x);
            })
            .y(function(d) {
                return self._getYScale()(d.y);
            });
        var _line = this.svg.drawArea.chart.append("path")
            .attr('d', lineGen(data.line._d))
            .attr("class","line")
            .attr('stroke', data.color)
            .attr('stroke-width', data.line.baseWidth)
            .attr('fill', 'none')
             .attr("pointer-events","none");
        return _line;
    },
    _drawCircles: function(data) {
        var self = this;
        var g = this.svg.drawArea.chart.append("g")
                        .attr("pointer-events","none");
        var _circle =data.line.y2? 
            g.selectAll("linepoint")
                .data(data.line._d)
                .enter()
                .append("circle")
                .attr("cx", function(d) {
                    return self._getXScale()(d.x);
                })
                .attr("cy", function(d) {
                    return self._getY2Scale()(d.y2);
                })
                .attr("r", function(d) {
                    return 2* data.line.baseWidth;
                }).attr("fill", data.color)
                .attr("class",function(d,i){return "event-sharp-"+self._getXSetIndex(d.x)})
            :
             g.selectAll("linepoint")
                    .data(data.line._d)
                    .enter()
                    .append("circle")
                    .attr("cx", function(d) {
                        return self._getXScale()(d.x);
                    })
                    .attr("cy", function(d) {
                        return self._getYScale()(d.y);
                    })
                    .attr("r", function(d) {
                        return 2* data.line.baseWidth;
                    }).attr("fill", data.color)
                    .attr("class",function(d,i){return "event-sharp-"+self._getXSetIndex(d.x)});
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
            .attr("y", (i *32) + 4)
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
        if(this._hasY2()) this.svg.y2TitleBar.append("text").text(this.y2Title).attr("transform", "rotate(-90)").attr("dominant-baseline", "text-before-edge");
        this.svg.titleBar.append("text").text(this.title).attr("dominant-baseline", "text-before-edge").classed("titleBar", true);
        this.svg.titleBar.append("text").text(this.secondTitle).attr("dominant-baseline", "text-before-edge").attr("dy", this._titleHeight / 2);
    },
    _drawEventRect:function(){
        if(this.svg.drawArea.eventRects) this.svg.drawArea.eventRects.remove();
        var self =this, set = this._xSet(),chart=this.svg.drawArea.chart ,_width = Math.floor(this._chartWidth/(set.length +1));
        this.svg.drawArea.eventRects = chart.append("g").attr("class","eventRect");
        this.svg.drawArea.eventRects.selectAll("rect").data(set)
                                                .enter()
                                                .append("rect")
                                                .attr("x",function(d,i){ return self._getXScale()(d) - _width/2})
                                                .attr("y", 0)
                                                .attr("width",_width)
                                                .attr("height",self._chartHeight)
                                                .attr("class",function(d,i){ return "event-rect-"+i})
                                                .attr("rect-index",function(d,i ){return i})
                                                .attr("fill-opacity","0")
                                                .on("mouseout",function(d,i){
                                                       self.toolTip.setVisiable(false);
                                                       self._removeGuideLine();
                                                    })
                                                .on("mousemove",function(d,i){
                                                     var sharps=d3.selectAll(".event-sharp-"+i),mouse=d3.mouse(chart.node()),content=[];
                                                     self.toolTip.setVisiable(false);
                                                     self._removeGuideLine();
                                                     sharps.filter(function(d){
                                                         return self._isInSharp(this);
                                                     }).each(function(d){
                                                        
                                                          
                                                          if(d._parent.y2){
                                                              content.push({x:d.x,y:d.y2,color:d._parent._parent.color,name:d._parent._parent.name});
                                                              self._drawGuideLine(self._getXScale()(d.x),self._getY2Scale()(d.y2),self._chartWidth,self._chartHeight);
                                                          }else{
                                                              content.push({x:d.x,y:d.y,color:d._parent._parent.color,name:d._parent._parent.name});
                                                              self._drawGuideLine(self._getXScale()(d.x),self._getYScale()(d.y),0,self._chartHeight);
                                                          }
                                                     });
                                                     if(content.length>0){
                                                         self.toolTip.setPosition(event.pageX +10,event.pageY+20);
                                                         self.toolTip.setContent(content);
                                                         self.toolTip.setVisiable(true);
                                                        // .style("top", (event.pageY -5) + "px").style("left", (event.pageX +10) + "px").html(content);
                                                     }
                                                 
                                                })
                                                .on("click",function(d,i){
                                                     var sharps=d3.selectAll(".event-sharp-"+i),mouse=d3.mouse(chart.node());
                                                     self.toolTip.setVisiable(false);
                                                     self._removeGuideLine();
                                                     sharps.filter(function(d){
                                                         return self._isInSharp(this);
                                                     }).each(function(d){
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
                                                

} , 
_isInSharp:function(_sharp){
    _sharp = d3.select(_sharp);
 if(_sharp.node().nodeName ==="circle"){
       var mouse=d3.mouse(this.svg.drawArea.chart.node()); x2=Number(_sharp.attr("cx")),y2=Number(_sharp.attr("cy")),r=Number(_sharp.attr("r"));
         return Math.sqrt(Math.pow(mouse[0]-x2,2)+Math.pow(mouse[1]-y2,2)) < 3*r;
 }
},
    _initDraw:function(){
        var self = this;
      
        this.svgContainer = d3.select("#" + this.appendId)
            .append("div")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("class","smartTraffic-chart")
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
        this.toolTip = new toolTip(this.svgContainer);
        this.svg.drawArea = this.svg.append("g")
            .attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth) + "," + this._titleHeight + ")")
            .attr("class","drawArea")
            .on("click",function(){ 
                                                                                if (d3.event.defaultPrevented) {
                                                                                       return;
                                                                                }       
                                                                                self._deselectAll.call(self);
                                                                            });         
        this.svg.drawArea.chartArea = this.svg.drawArea.append("rect")
                                                                            .attr("width",this._chartWidth)
                                                                            .attr("height", this._chartHeight)
                                                                            .attr("fill-opacity",0);
                                                                        
                                                                                                         
        this.svg.drawArea.x = this.svg.drawArea.append("g");
        this.svg.drawArea.y = this.svg.drawArea.append("g");
        this.svg.drawArea.chart=this.svg.drawArea.append("g")
                                                             .attr("clip-path", "url(#clip)");
        if(this._hasY2())
        {
             this.svg.y2TitleBar = this.svg.append("g").attr("transform", "translate("+(this._yTitleWidth+this._y2AxisWidth+this._chartWidth+this._yAxisWidth)+"," + (this._titleHeight + this._chartHeight / 2) + ")").classed("titleBar", true).attr("text-anchor", "middle");
        }
        this.svg.yTitleBar = this.svg.append("g").attr("transform", "translate(1," + (this._titleHeight + this._chartHeight / 2) + ")").classed("titleBar", true).attr("text-anchor", "middle");
        this.svg.titleBar = this.svg.append("g").attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth / 2 + this._chartWidth / 2) + ",1)").attr("text-anchor", "middle");
        if(this._hasY2()){
             this.svg.infoBar = this.svg.append("g").attr("transform", "translate(" + (this._chartWidth + this._yAxisWidth + this._yTitleWidth + this._infoBarMargin+this._y2TitleWidth+this._y2AxisWidth) + "," + this._titleHeight + ")").classed("infoBar", true);
        }else{
             this.svg.infoBar = this.svg.append("g").attr("transform", "translate(" + (this._chartWidth + this._yAxisWidth + this._yTitleWidth + this._infoBarMargin) + "," + this._titleHeight + ")").classed("infoBar", true);
        }
       
        this.svg.xTitleBar = this.svg.append("g").attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth / 2 + this._chartWidth / 2) + "," + (this.height) + ")").classed("titleBar", true).attr("text-anchor", "middle");
        var zoom = d3.behavior.zoom()
                                                .x(self._getXScale())
                                                .scaleExtent([1,4])
                                                .on("zoom",self._zoomed.bind(self));
                                        
        this.svg.drawArea.call(zoom).on("dblclick.zoom", null);
        
         },
    _drawChart:function(datas){
           var self  = this;
           datas.forEach(function(v){
               if(v.line ){
                    v.figure = v.figure ||{};
                if( v.figure.circles)  v.figure .circles.remove();
                    v.figure.circles = self._drawCircles(v);
                if( v.figure.line)  v.figure .line.remove();
                    v.figure.line = self._drawLine(v);
               }
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
        if(this.svgContainer) this.svgContainer.remove();
        if (this._xScale) delete  this._xScale;
        if (this._yScale) delete  this._yScale;
        if(this._y2Scale) delete this._y2Scale;
        this._removeGuideLine();
        this._calculateMargin();
        this._initDraw();
        this._draw();
    },
    _getXScale: function() {
        this._xScale = this._xScale || d3.time.scale()
            .range([0, this._chartWidth])
            .domain([this._getMinXData(),this._getMaxXData()]).nice();

        return this._xScale;
    },
    _getYScale: function() {
        this._yScale = this._yScale || d3.scale.linear()
            .range([0, this._chartHeight])
            .domain([this._getMaxYData(), this._getMinYData()]).nice();
        return this._yScale;
    },
    _getY2Scale:function(){
        this._y2Scale = this._y2Scale || d3.scale.linear()
            .range([0, this._chartHeight])
            .domain([this._getMaxY2Data(), this._getMinY2Data()]).nice();
        return this._y2Scale;
    },
    _getMaxXData: function() {
        var _num = Number.MIN_VALUE;
        this.datas.forEach(function(d) {
            if(d.line){
                d.line ._d.forEach(function(v) {
                    _num = Math.max(v.x, _num);
                });
            }
        });
        return _num;
    },
    _getMinXData: function() {
        var _num = Number.MAX_VALUE;
        this.datas.forEach(function(d) {
              if(d.line){
                d.line ._d.forEach(function(v) {
                    _num = Math.min(v.x, _num);
                });
            }
        });
        return _num;
    },
    _getMaxYData: function() {
        var _num = Number.MIN_VALUE;
        this.datas.forEach(function(d) {
         if(d.line && !d.line.y2){
                d.line ._d.forEach(function(v) {
                    _num = Math.max(v.y, _num);
                });
            }
        });
        return _num;
    },
     _getMinYData: function() {
        var _num = Number.MAX_VALUE;
        this.datas.forEach(function(d) {
          if(d.line&& !d.line.y2){
                d.line ._d.forEach(function(v) {
                    _num = Math.min(v.y, _num);
                });
            }
        });
        return _num;
    },
    _getMaxY2Data: function() {
        var _num = Number.MIN_VALUE;
        this.datas.forEach(function(d) {
         if(d.line && d.line.y2){
                d.line ._d.forEach(function(v) {
                    _num = Math.max(v.y2, _num);
                });
            }
        });
        return _num;
    },
_getMinY2Data: function() {
        var _num = Number.MAX_VALUE;
        this.datas.forEach(function(d) {
          if(d.line && d.line.y2){
                d.line ._d.forEach(function(v) {
                    _num = Math.min(v.y2, _num);
                });
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
        this._drawAxis();
        this._drawEventRect();
       // this.svg.drawArea.select("g.xaxis").call(d3.svg.axis().scale(this._getXScale()).orient("bottom"));
         self.toolTip.setVisiable(false);
        self._removeGuideLine();
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
var guideLine={
    addGuideLine:function(svg,x,y,x2,y2){
            var self=this;
            if(!self._guideLineGroup) self._guideLineGroup=svg.append("g").attr("class","guide-lines");
            if(!self._guideLines) self._guideLines =[];
            if(!self._yGuideLine){
                   self._yGuideLine = self._guideLineGroup.append("line")
                            .attr("x1",x)
                            .attr("y1",y)
                            .attr("x2",x)
                            .attr("y2",y2)
                            .attr("stroke","black")
                            .attr("stroke-width",1)
                            .attr("stroke-dasharray","1,1");
            }else{
                if(y<  Number(self._yGuideLine.attr("y1"))){
                    self._yGuideLine.remove();
                    self._yGuideLine = self._guideLineGroup.append("line")
                            .attr("x1",x)
                            .attr("y1",y)
                            .attr("x2",x)
                            .attr("y2",y2)
                            .attr("stroke","black")
                            .attr("stroke-width",1)
                            .attr("stroke-dasharray","1,1");
                }
            }
            self._guideLineGroup.append("line")
                            .attr("x1",x)
                            .attr("y1",y)
                            .attr("x2",x2)
                            .attr("y2",y)
                            .attr("stroke","black")
                            .attr("stroke-width",1)
                            .attr("stroke-dasharray","1,1");
            // if(!self._guideLines.find(function(l){
            //     return   Number(l.attr("x1")) ===x && Number(l.attr("y1")) ===y && Number(l.attr("x2")) ===x && Number(l.attr("y2")) === y2;
            // })){
            //         var yline = self._guideLineGroup.append("line")
            //                 .attr("x1",x)
            //                 .attr("y1",y)
            //                 .attr("x2",x)
            //                 .attr("y2",y2)
            //                 .attr("stroke","black")
            //                 .attr("stroke-width",1)
            //                 .attr("stroke-dasharray","1,1");
            //           self._guideLines.push(yline);
            // }
            //  if(!self._guideLines.find(function(l){
            //     return   Number(l.attr("x1")) ===x && Number(l.attr("y1")) ===y && Number(l.attr("x2")) ===x2 && Number(l.attr("y2")) === y;
            // })){
            //     var xline = 
            //     self._guideLines.push(xline);
            // }
    },
    removeGuideLine:function(){
        var self=this;
        if(self._guideLineGroup) {
            self._guideLineGroup.remove();
            delete self._guideLineGroup;
        }
        if(self._yGuideLine){
            self._yGuideLine.remove();
            delete self._yGuideLine;
        }
        // if(self._guideLines){
        //     self._guideLines.forEach(function(v){
        //         v.remove()
        //         v = null;
        //     })
        // }
       // self._guideLines = null;
    }
}
var toolTip=function(container, option){
    this.init(container);
};
toolTip.prototype=
{
    getContent:function(datas){
        var text ="";
        var title = datas[0].x;
        text = "<table class='tool-tip-table' ><tbody><tr><th class = 'tooltip-title' colspan='2'>" +title + "</th></tr>";
        datas.forEach(function(data){
                text += "<tr>";
                text += "<td class='tooltip-name'><span style=' background-color:" + data.color + "'></span>" + data.name + "</td>";
                text += "<td class='tooltip-value'>" + data.y + "</td>";
                text += "</tr>";
        });
        return text+="</tbody><table>";
    },
    setVisiable:function(isVisiable){
        if(isVisiable)  this.toolTip.style("visibility", "visible");
        else   this.toolTip.style("visibility", "hidden");
    },
    init:function(container){
 ;
        if(container.select(".smartTraffic-tootip")) container.select(".smartTraffic-tootip").remove();
        this.toolTip=  container .append("div") 
            .style("pointer-events","none") 
            .attr("class", "tooltip smartTraffic-tootip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden");
        if(!this.toolTip) this.toolTip = this.append("g").attr("class","tool-tip");
    },
    setContent:function(content){
        if (this.toolTip)  this.toolTip.html(this.getContent(content)); 
    },
    setPosition:function(x,y){
        this.toolTip.style("top", y+ "px").style("left", x + "px");
    }
}
toolTip.prototype.constructor = toolTip;