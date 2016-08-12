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
    },
    
};
var eventManager = SmartTrafficChartClass.extend({
    on: function(type, callback,self) {
        if (!this._events) this._events = {};
        if (!this._events[type]) this._events[type] = [];
        if(self) callback=callback.bind(self);
        if(this._events[type].indexOf(callback) <0) this._events[type].push(callback);
        return this;
    },
    off: function(type, callback,self) {
        if (this._events && this._events[type]) {
            this._events[type].forEach(function(v, i, events) {
                if (v === callback) delete events[i];
            });
        }
        return this;
    },
    call: function(type, data,self) {
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
var curry = function(f) {
        var arity = f.length;
        return function f1() {
            var args = Array.prototype.slice.call(arguments, 0);
            if(args.length < arity) {
                var f2 = function() {
                    var args2 = Array.prototype.slice.call(arguments, 0); // parameters of returned curry func
                    return f1.apply(null, args.concat(args2)); // compose the parameters for origin func f
                };
                return f2;
            } else {
                return f.apply(null, args); //all parameters are provided call the origin function
            }
        };
    };
var set=function(f){
    this.compareFunction=f;
    this._vals=[];
};
set.prototype.add=function(v){
    var self =this;
    var i = -1;
    for(var _i in this._vals){
        if(this.compareFunction(this._vals[_i],v)){
            i=_i;
            break;
        }
    }
    if(i=== -1){
        this._vals.push(v);
    }else{
        this._vals[i]=v;
    }
    return this;
}
set.prototype.forEach=function(){
    Array().forEach.apply(this._vals,arguments);
   
}
set.prototype.del=function(v){
    var del=null;
    for(var _i in this._vals){
        if(this.compareFunction(this._vals[_i],v)){
            i=_i;
            break;
        }
    }
    if(i!== -1){
      del=this._vals[i];
      this._vals.splice(i,1);
    }
    return del;
}
set.prototype.vals=function(){
    return this._vals;
}
var context=function(k,v){
    if(k) this[k] = v; 
    return this;
}
context.prototype.add=function(k,v){
    this[k]=v;
    return this;
}
context.prototype.get=function(k){
    return this[k];
}
var ChartToolTip=SmartTrafficChartClass.extend({
    initDraw:function(svg){
        svg.selectAll(".SmartChart-ToolTip").remove();
        this.toolTip=  svg.append("div").style("pointer-events", "none")
                    .attr("class", "SmartChart-ToolTip")
                    .style("position", "absolute")
                    .style("z-index", "10")
                    .attr("id","SmartChart-ToolTip-Id")
                    .style("visibility", "hidden");
        return this.toolTip;
    },
    setVisiable:function(isVisiable){
        if (isVisiable) this.toolTip.style("visibility", "visible");
        else this.toolTip.style("visibility", "hidden");
    },
    setContent:function(content){
        if(this.toolTip) this.toolTip.html(content);
    },
    setPosition:function(x,y){
        var width =document.getElementById("SmartChart-ToolTip-Id").offsetWidth;
        var height =document.getElementById("SmartChart-ToolTip-Id").offsetHeight;
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
var RadarChart = SmartTrafficChartClass.extend({
    mapkey:["d0","d1","d2","d3","d4","d5","d6","d7","d8","d9"],
    init:function(config){
        this.axisNum = config.axis.length;
        this.title = config.title;
        this.eventManager=eventManager.create();
        this.radarValueFormater=config.valueFormater||function(v){return v};
        this.axises = config.axis;
        this.appendId=config.appendId;
        this.height=config.height;
        this.width =config.width;
        this.isInitDraw = false;
        this.scales={};
        this.showToolTip = config.showToolTip ===false? false:true;
        this.colorManager=colorManager.create();
        this._figures=new set(function(v1,v2){return v1.id === v2.id});
        this.showLegend=config.showLegend === false? false:true;
        this.legend=Legend.create(this.eventManager);
        this.calculateMargin();
        this.registerEvent();
    },
    registerEvent:function(){
        this.eventManager.on("select",this.setSelectStyle,this)
        this.eventManager.on("deSelect",this.setSelectStyle,this)
        this.eventManager.on("legendmouseover",this.legendMouseOVer,this);
        this.eventManager.on("legendmouseout",this.showDetailMaxValue,this);
        

    },
    calculateMargin:function(){
        this._titleHeight =80;
       
        if(this.showLegend){
            this._drawAreaWidth=Math.floor(this.width*0.8);
            this._legendWidth=Math.floor(this.width*0.2);
        }else{
            this._drawAreaWidth=this.width;
        }
        
        this._drawAreaHeight=this.height-this._titleHeight;
    },
    initDraw:function(){
        if(this.isInitDraw) return this;
        if(this.validateConfig()){
            d3.select("#" + this.appendId).style("width", this.width)
                .style("height", this.height);
            this.svgContainer = d3.select("#"+this.appendId).append("div").classed("RadarChart",true)
                                    .style("width", this.width)
                                    .style("height", this.height);
            this.svg=this.svgContainer.append("svg").classed("RadarChart-svg",true)
                                                        .attr("width", this.width)
                                                        .attr("height",this.height);
            this.svg.title = this.svg.append('svg:g').classed("RadarChart-title-Container",true)
                                                      .attr("transform","translate("+(this._drawAreaWidth/2)+",5)");
            this.svg.drawArea =this.svg.append("svg:g").classed("RadarChart-drawArea",true)
                                        .attr("transform","translate(0,"+this._titleHeight+")");
            this.svg.drawArea.axis=this.svg.drawArea.selectAll("RadarChart-axis")
                                                    .append("svg:g").classed("RadarChart-axis",true);
            this.svg.drawArea.axisTicket= this.svg.drawArea.selectAll(".RadarChart-axis-tick")
                                                                                .append("svg:g").classed("RadarChart-axis-tick",true);
            this.svg.drawArea.axisLabel= this.svg.drawArea.selectAll(".RadarChart-axis-label")
                                                                           .append("svg:g").classed("RadarChart-axis-label",true);  
            if(this.showLegend)   {
               this.svg.legend= this.svg.append("g").attr("transform", "translate(" + (this._drawAreaWidth+5) + "," +this._titleHeight + ")").classed("RadarChart-Legend-Container", true);
            }
            if(this.showToolTip){
                this.svg.toolTip= this.svgContainer.append("div")
                    .style("pointer-events", "none")
                    .attr("class", "SmartChart-toolTip")
                    .style("position", "absolute")
                    .style("z-index", "10")
                    .style("visibility", "hidden");
            }
            this.isInitDraw=true;                                     
        }
        return this;
    },
    validateConfig:function(){
        return true;
    },
    addChartFigure:function(_chartFigure){
        this.attachChartFigure(_chartFigure);
        this._figures.add(_chartFigure);
        if(this.isInitDraw) this.reDraw();
    },
    attachChartFigure:function(_chartFigure){
        _chartFigure.color=_chartFigure.color||this.colorManager.getColor();
        _chartFigure.eventManager=this.eventManager;
    },
    rendering:function(){
        if(this.isInitDraw){
            this.reDraw();
        }else{
            this.initDraw().draw();
        }
    },
    reDraw:function(){
        this.svgContainer.remove();
        this.isInitDraw=false;
        this.scales={};
        this.rendering();
        
    },
    draw:function(){
        this.drawTitle().drawAxis().drawAxisLabel().drawAxisTicket().drawLegend().drawChartFigure().showDetailMaxValue();
    },
    drawTitle:function(){
        this.svg.title.append('svg:text').text(this.title)
                                            .attr("text-anchor", "middle")
                                            .attr("font-size","22px")
                                            .attr("dominant-baseline", "text-before-edge");
        return this;
    },
    drawAxis:function(){
          var axis=this.svg.drawArea.axis,axisNum=this.axisNum;
          var r = Math.min(this._drawAreaHeight/2,this._drawAreaWidth/2),width =this._drawAreaWidth,height=this._drawAreaHeight;
          axis.data(this.axises).enter()
                                    .append("svg:line")
                                    .attr("x1",this._drawAreaWidth/2)
                                    .attr("y1",this._drawAreaHeight/2)
                                    .attr("x2",function(d,i){return width/2+ r*( Math.sin(i * 2*Math.PI / axisNum))})
                                    .attr("y2",function(d,i){return height/2+ r*( - Math.cos(i * 2*Math.PI / axisNum))})
                                    .attr("stroke", "grey")
                                    .attr("stroke-width", "1px");
          return this;
    },
    drawAxisLabel:function(){
        var axisLabel =this.svg.drawArea.axisLabel,axisNum=this.axisNum,width =this._drawAreaWidth,height=this._drawAreaHeight;
        var r = Math.min(this._drawAreaHeight/2,this._drawAreaWidth/2)
        axisLabel.data(this.axises).enter()
                                    .append("svg:text")
                                    .text(function(d) { return d; })
                                    .attr("text-anchor", "middle")
                                    .attr("x",function(d,i){return width/2+ r*(1.05* Math.sin(i * 2*Math.PI / axisNum))})
                                    .attr("y",function(d,i){return height/2+ r*( -1.03* Math.cos(i * 2*Math.PI / axisNum))})
                                    .attr("font-size", "18px");
        return this;
    },
    drawAxisTicket:function(){
        var axisTicket =this.svg.drawArea.axisTicket,axisNum=this.axisNum,width =this._drawAreaWidth,height=this._drawAreaHeight;
        var r = Math.min(this._drawAreaHeight/2,this._drawAreaWidth/2),_r;
        for(var i = 0;i<5;++i){
            _r=r*(i+1)/5;
            axisTicket.data(this.axises).enter()
                                    .append("svg:line")
                                    .attr("x1",function(d,i){return width/2+ _r*( Math.sin(i * 2*Math.PI /axisNum))})
                                    .attr("y1",function(d,i){return height/2+ _r*( - Math.cos(i * 2*Math.PI / axisNum))})
                                    .attr("x2",function(d,i){return width/2+ _r*( Math.sin((i+1) * 2*Math.PI /axisNum))})
                                    .attr("y2",function(d,i){return height/2+ _r*( - Math.cos((i+1) * 2*Math.PI /axisNum))})
                                    .attr("stroke", "grey")
                                    .attr("stroke-width", "1px")
                                    .attr("stroke-dasharray", "2,2");
        }
        return this;
    },
    drawLegend:function(){
        if(this.showLegend){
            var ctx = new context();
            ctx.add("svg",this.svg.legend).add("legendWidth",this._legendWidth);
            this.legend.draw(ctx,this._figures);
        }
        return this;
    },
    drawChartFigure:function(){
        var ctx = new context();
        ctx.add("svg",this.svg.drawArea).add("scales",this.getScale.bind(this)).add("coordinate",this.getCoordinate.bind(this));
        this._figures.forEach(function(v){
            v.draw(ctx);
        })
        return this;
    },
    getScale:function(key){
        if(!this.scales[key]){
            var span, max,min;
            max = this.getMaxData(key);
            min =this.getMinData(key);
            if(min === max){
                min /=2 ;
                if(max === 0)   max +=100;
            }
            span = (max-min)/10;
            max+=span;min-=span;
            this.scales[key]=d3.scale.linear().range([0,Math.min(this._drawAreaHeight,this._drawAreaWidth)/2])
                                                .domain([min,max]);
        }
        return this.scales[key];
    },
    getCoordinate:function(r,axisIndex,_d){
        var c={};
                c.x= this._drawAreaWidth/2+ r*( Math.sin(axisIndex * 2*Math.PI / this.axisNum));
                c.y= this._drawAreaHeight/2+ r*( -Math.cos(axisIndex * 2*Math.PI / this.axisNum));
                c.i =axisIndex;
                c.originData=_d;;
                return c;
    },
    getMaxData:function(key){
        var d= Number.MIN_VALUE;
         this._figures.forEach(function(v){
             if(v._d){
                 if(v._d[key] !==undefined){
                     d=Math.max(d,v._d[key]);
                 }
             }
         })
        return d;
    },
    getMinData:function(key){
        var d= Number.MAX_VALUE;
         this._figures.forEach(function(v){
             if(v._d){
                 if(v._d[key] !==undefined){
                     d=Math.min(d,v._d[key]);
                 }
             }
         })
        return d;
    },
    setSelectStyle:function(){
        var isAllSelect = true,hasSelect=false;
        this._figures.forEach(function(f){
            if(f.isSelected) {hasSelect=true}
            else {isAllSelect=false}
        })
        if(isAllSelect){
            this._figures.forEach(function(f){
                f.isSelected = false;
            })
            hasSelect=false;
        }
        this._figures.forEach(function(f){
            if(hasSelect){
                    if(f.legendDom)  f.legendDom.classed("notSelected", !f.isSelected);
                    if(f.isSelected){
                            f.figureDom.style("visibility","visible");
                            
                        }else{
                            f.figureDom.style("visibility","hidden");
                        }
            }else{
                f.figureDom.style("visibility","visible");
                if(f.legendDom)  f.legendDom.classed("notSelected", false);
            }
           
        });
        this.showDetailMaxValue();
        return this;

    },
   showDetailValue:function(vals){
           var scales = this.getScale.bind(this),getCoordinate=this.getCoordinate.bind(this),datas=[],self=this;
            for(var i =0; i<vals.length;++i){
                var val ={},r,coor;
                val.i=vals[i].i;
                val.data=vals[i].data;
                r=scales(this.mapkey[val.i])(val.data);
                val.x=this._drawAreaWidth/2+ r*(1.02* Math.sin(val.i * 2*Math.PI / this.axisNum));
                val.y=this._drawAreaHeight/2+ r*( -1.02* Math.cos(val.i * 2*Math.PI / this.axisNum));
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
                                 if(self.radarValueFormater){
                                     return self.radarValueFormater(d.data)}
                                    else{
                                       return d.data; 
                                    }}
                                 )
                            .attr("class","detail-text");
      },
      showDetailMaxValue:function(){
            var datas=[],self=this;
            var hasSelect 
            this._figures.forEach(function(f){
                if(f.isSelected) {hasSelect=true}
            })
            if(hasSelect){
                this.mapkey.forEach(function(k,i){
                var data= Number.MIN_VALUE;
                    self._figures.forEach(function(v){
                        if(v._d&&v.isSelected){
                            if(v._d[k] !==undefined){
                                data=Math.max(data,v._d[k]);
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
                    self._figures.forEach(function(v){
                        if(v._d ){
                            if(v._d[k] !==undefined){
                                data=Math.max(data,v._d[k]);
                            }
                        }
                    })

                if(data !== Number.MIN_VALUE){
                    datas.push({i:i,data:data});
                }
            })
            }
          self.showDetailValue(datas);
        return this;
      },
      legendMouseOVer:function(d){
             var self =this;
             var datas=[];
            this.mapkey.forEach(function(key,i){
                if(d._d[key]!==undefined){
                    datas.push({i:i,data:d._d[key]});
                }
            });
            this.showDetailValue(datas);
      }
})
var ChartFigure = function(option){
        option = JSON.parse(JSON.stringify(option));
        if(option.id ===undefined ||option.id ===null){
            throw new Error("Please assign data id");
        }
        if(option.name === undefined){
            option.name = option.id;
        }
        if(option.type ==="radar") return Radar.create(option);
    
};
var Radar=SmartTrafficChartClass.extend({
    type:"radar",
    mapkey:["d0","d1","d2","d3","d4","d5","d6","d7","d8","d9"],
    init:function(originData){
        var config = originData,
            self = this;
        this._d=originData.data;
        this.color=originData.color;
        this.id=config.id;
        this.name=config.name;
        var mapkey = this.mapkey;
        mapkey.forEach(function(key) {
            if (config[key]) {
                    self._d[key] = originData.data[config[key]]; 
            }
        });
        Object.keys(this._d).forEach(function(k){
             if(self.mapkey.indexOf(k)===-1){
                    delete this._d[k];
                }
        })
        this._d._figureObj=self;
       // this.mergeOption(option);
    },
    draw:function(ctx){
       var transitionTime = ctx.get("transitionTime") || 1000;
       var scales = ctx.get("scales"),coordinate=ctx.get("coordinate"),svg=ctx.get("svg");
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
            var d=coordinate(r,i,this._d);
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
            .attr('stroke', this.color)
            .attr('stroke-width', 2)
            .attr('fill',this.color)
            .attr("opacity",0.4)
            .attr("pointer-events", "none");
    area.selectAll("circle").data(datas)
                        .enter()
                        .append("svg:circle")
                        .attr("cx",function(d){return d.x}).attr("cy",function(d){return d.y}).attr("r",0.1)
                        .attr("fill",this.color)
                        .attr("class",function(d,i){return "event-radar-"+d.i});
  
    if(!this.figureDom){
        p.call(tFunction);
    }
       this.figureDom=area;
    },

   
});
var Legend=SmartTrafficChartClass.extend({
    init:function(eventManager){
        this.eventManager =eventManager;
    },
    draw:function(ctx,_figures){
        var svg=ctx.get("svg"),legendWidth=ctx.get("legendWidth"),self=this;
        svg.selectAll(".RadarChart-legend")
                            .data(_figures.vals()).enter()
                            .append("g").classed("RadarChart-legend",true);
        svg.selectAll(".RadarChart-legend").each(function(d,i){
            var g=d3.select(this);
            g.append("svg:rect").attr("height", 26)
                                    .attr("width", legendWidth)
                                    .attr("y", i * 32 )
                                    .attr("x", -10)
                                    .attr("fill", "transparent");
            g.append("svg:circle").attr("cx",0)
                                    .attr("cy",  i * 32+13)
                                    .attr("r",8)
                                    .attr("fill", d.color );
            g.append("svg:text").attr("x", 12)
                                    .attr("y",(i * 32) + 14)
                                    .text(d.name)
                                    .attr("dominant-baseline", "middle");
            d.legendDom=g;
            g.on("mouseover", function(d) {
                d3.select(this).select("rect").attr("fill", "rgb(240,240,240)");
                self.eventManager.call("legendmouseover", d);
            })
            .on("mouseout", function(d) {
                self.eventManager.call( "legendmouseout", d);
                d3.select(this).select("rect").attr("fill", "transparent");
            });
            g.on("click", function() {
            if (d.isSelected) {
                d.isSelected = false;
                self.eventManager.call("deSelect", [d]);
            } else {
                d.isSelected = true;
                self.eventManager.call("select", [d]);
            }
            event.stopPropagation();
        });
        })
                                                     
    }
})