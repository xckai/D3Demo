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
    },
    mergeFunction:function(obj){
        var self = this;
        Object.keys(obj).forEach(
            function(k){
                if(typeof obj[k]==="function"){
                    self[k]=obj[k]
                }
            }
        )
        return this;
    }
    
};
var Measure = function(config){
        var self=this;
        this.setConfig(config);
        if(this.id ===undefined ||this.id ===null){
            throw new Error("Please assign data id");
        }
        if(this.name === undefined){
            this.name = this.id;
        }
};
Measure.prototype.setData=function(data){
    this.data=data;
    return this;
}
Measure.prototype.setColor=function(color){
    this.color = color;
    return this;
}
Measure.prototype.setType=function(type){
    this.type=type;
    return this;
}
Measure.prototype.setConfig=function(config){
    var self =this;
    Object.keys(config).forEach(function(k){
                if(typeof config[k] ==="object"){
                    self[k] = JSON.parse(JSON.stringify(config[k]));
                }else{
                    self[k]=config[k]; 
                }
                     
    })
}
Measure.prototype.constructor=Measure;
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
        if(i!== undefined)
        {
            return this._colors(i);
        }
        else{
                  
        return this._colors(this._colorIndex++);
        }

    },
    init: function() {
        this._colors=d3.scale.category10();
        // this._colors=function(i){
        //     var colorScale= ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
        //      return colorScale[i%colorScale.length];
        // }
        this._colorIndex = 0;
    },
    reset: function() {
        this._colorIndex = 0;
    }
});
var Curry = function(f) {
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
var Memory=function(key,f,that){

   this._mem={};
}
Memory.prototype.cache=function(_key,f,that,args){
    var mem = this._mem;
    if(mem[_key] === undefined){
        if(that){
                mem[_key]=f.apply(that,args);
            }else{
                mem[_key] = f.apply(null,args);
          }
    }
    return mem[_key];
}
Memory.prototype.flush=function(){
    this._mem={};
}
var Set=function(f){
    this.compareFunction=f;
    this._vals=[];
};
Set.prototype.add=function(v){
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
Set.prototype.forEach=function(){
    Array().forEach.apply(this._vals,arguments);
   
}
Set.prototype.del=function(v){
    var del=null,i=-1;
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
Set.prototype.vals=function(){
    return this._vals;
}
Set.prototype.sort=function(){
    Array().sort.apply(this._vals,arguments);
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
                    .style("visibility", "hidden")
                    .classed("notextselect",true);
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
        var width =this.toolTip.node().offsetWidth;
        var height =this.toolTip.node().offsetHeight;
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
        this.setConfig(config);
        this.eventManager=eventManager.create();
        this.scales={};
        this.toolTip=ChartToolTip.create();
        this.colorManager=colorManager.create();
        this._measures=new Set(function(v1,v2){  return String(v1.id) === String(v2.id)});
        this.legend=Legend.create(this.eventManager);
        this.memory=new Memory();
        this.registerEvent();
    },
    setConfig:function(config,val){
        if(config === undefined|| config ===null) return this;
        if(typeof config ==="object"){
            var self= this;
            this.setOption(config);
            this.axises = config.axis;
            this.axisNum = config.axis.length;
            this.showToolTip = config.showToolTip === false? false :true;
            this.showLegend=config.showLegend === false ? false:true;
            this.isInitDraw=false;
        }else{
            this[config] = val;
        }   
        return this;
    },
    appendTo:function(id){
        this.appendId = id;
    },
    registerEvent:function(){
        this.eventManager.on("select",this.setSelectStyle,this)
        this.eventManager.on("deSelect",this.setSelectStyle,this)
        this.eventManager.on("legendmouseover",this.legendMouseOVer,this);
        this.eventManager.on("legendmouseout",this.legendMouseOut,this);
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
        return this;
    },
    initDraw:function(){
        if(this.validateConfig()){
            this.svgContainer = d3.select("#"+this.appendId).append("div").classed("RadarChart",true)
                                    .style("width", this.width)
                                    .style("height", this.height)
                                    .style("position","relative")
                                    .classed("notextselect",true);
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
               this.svg.legend= this.svg.append("g").attr("transform", "translate(" + (this._drawAreaWidth+10) + "," +this._titleHeight + ")").classed("RadarChart-Legend-Container", true);
            }
            if(this.showToolTip){
               this.svg.toolTip=this.toolTip.initDraw(this.svgContainer);
            }
            this.drawEventZone(this.svg.drawArea);
            this.isInitDraw=true;                                     
        }
        return this;
    },
    validateConfig:function(){
        if(this.appendId===undefined || this.appendId ===null){
                console.error("please assign chart container ID");
                return false; 
        }
        if(this._drawAreaHeight * this._drawAreaWidth <0){
                console.error("Wrong chart height and width");
                return false;
        }
        return true;
    },
    addMeasure:function(_measure){
        var measureObj;
        if(_measure.type==="radar"){
            measureObj=Radar.create(_measure);
            this.attachMeasure(measureObj);
            this._measures.add(measureObj);
            if(this.isInitDraw) this.reDraw();
            return true;
        }else{
            console.error("Error figure type !");
            return false;
        }
        
    },
    removeMeasureById:function(id){
        this._measures.del({id:id});
        if(this.isInitDraw) this.reDraw();
        return this;
    },
    removeMeasure:function(mesure){
        this._measures.del(mesure);
        if(this.isInitDraw) this.reDraw();
        return this;
    },
    attachMeasure:function(_measure){
        _measure.color=_measure.color||this.colorManager.getColor();
        _measure.eventManager=this.eventManager;
        _measure.$chart=this;
    },
    rendering:function(){
        if(this.isInitDraw){
            this.reDraw();
        }else{
            this.calculateMargin().initDraw().draw();
        }
    },
    reDraw:function(){
        this.svgContainer.remove();
        this.isInitDraw=false;
        this.scales={};
        this.memory.flush();
        this.rendering();
        
    },
    remove:function(){
        this.svgContainer.remove();
        this.init();
    },
    draw:function(){
        this.drawTitle().drawAxis().drawAxisLabel().drawAxisTicket().drawLegend().drawMeasure().showDetailMaxValue();
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
            ctx.add("svg",this.svg.legend).add("legendWidth",this._legendWidth).add("legendHeight",this._drawAreaHeight)
                .add("guid",this.appendId);
            this.legend.draw(ctx,this._measures);
        }
        return this;
    },
    drawMeasure:function(){
        var ctx = new context();
        ctx.add("svg",this.svg.drawArea).add("scales",this.getScale.bind(this)).add("coordinate",this.getCoordinate.bind(this));
        this._measures.forEach(function(v){
            v.draw(ctx);
        })
        return this;
    },
    bringToFront:function(f){
        var ctx = new context();
        ctx.add("svg",this.svg.drawArea).add("scales",this.getScale.bind(this)).add("coordinate",this.getCoordinate.bind(this));
        f.measureDom.remove();
        f.draw(ctx);
    }
    ,
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
                c._figureObj=_d;;
                return c;
    },
    getMaxData:function(key){
        var d= Number.MIN_VALUE;
         this._measures.forEach(function(v){
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
         this._measures.forEach(function(v){
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
        this._measures.forEach(function(f){
            if(f.isSelected) {hasSelect=true}
            else {isAllSelect=false}
        })
        if(isAllSelect){
            this._measures.forEach(function(f){
                f.isSelected = false;
            })
            hasSelect=false;
        }
        this._measures.forEach(function(f){
            if(hasSelect){
                    if(f.legendDom)  f.legendDom.classed("legendNotSelected", !f.isSelected);
                    if(f.isSelected){
                            f.measureDom.classed("radarNotSelect",false);
                            
                        }else{
                            f.measureDom.classed("radarNotSelect",true);
                        }
            }else{
                f.measureDom.classed("radarNotSelect",false);
                if(f.legendDom)  f.legendDom.classed("legendNotSelected", false);
            }
           
        });
        this.showDetailMaxValue();
        return this;

    },
    drawEventZone:function(){
        this.svg.drawArea.selectAll("RadarChart-Event-Zone").remove();
        var self =this, r = Math.min(self._drawAreaHeight/2,self._drawAreaWidth/2)
        var zone = this.svg.drawArea.append("g").classed("RadarChart-Event-Zone",true)
                        .attr("transform","translate("+this._drawAreaWidth/2+","+this._drawAreaHeight/2+")")
        var arc = d3.svg.arc()
			.startAngle(function(d,i) { return (360/self.axises.length) *(i)*2*Math.PI /360 -Math.min(Math.PI/12,360/self.axises.length)})
			.endAngle(function(d,i) {return (360/self.axises.length) *(i)*2*Math.PI /360+Math.min(Math.PI/12,360/self.axises.length)})
			.innerRadius(0)
			.outerRadius(r);
        zone.selectAll("path").data(this.axises)
                                    .enter()
                                    .append("svg:path")
                                    .attr("d",arc)
                                    .attr("fill","black")
                                    .attr("fill-opacity", "0")
                                    .attr("class",function(d,i){return "Event-Zone-"+i})
                                    .on("mouseout",this.eventZoneMousout.bind(this))
                                    .on("mousemove", this.eventZoneMousemove.bind(this))
    },
    eventZoneMousout:function(){
        if(this.showToolTip) this.toolTip.setVisiable(false);
    },
    eventZoneMousemove:function(d,i){
        if(this.showToolTip){
            var sharps = this.svg.drawArea.selectAll(".event-radar-"+i);
            var chartFigrues=[];
            this.toolTip.setVisiable(false);
            sharps.filter(function(s){
                return true;
                }).each(function(d){
                    chartFigrues.push(d);
                });
            if(chartFigrues.length>0){
                var position = d3.mouse(this.svg.node());
                this.toolTip.setPosition(position[0] ,position[1]);
                this.toolTip.setContent(this.getToolTipContent(chartFigrues));
                this.toolTip.setVisiable(true);
            }

        }
        

    },
    getToolTipContent(chartFigrues){
        var datas=chartFigrues.map(function(c,i){
            var d={};
            d.name=c._figureObj.name;
            d.id=c._figureObj.id;
            d.type=c._figureObj.type;
            d.data=c._figureObj._d;
            d.color=c._figureObj.color;
            d.Measure=c._figureObj;
            d.i=c.i;
            return d;
        });
        var defaultTooltipGen=function(datas){
            var text = "",
            self = this;
                var title = this.axises[datas[0].i] ;
                text = "<table class='tool-tip-table' ><tbody><tr><th class = 'tooltip-title' colspan='3'>" + title + "</th></tr>";
                datas.forEach(function(data) {
                    var ctx=new context();
                    ctx.add("i",data.i);
                    text += data.Measure.toHtml(ctx);
                });
                return text += "</tbody><table>";
        }
        if(this.customToolTipGen){
            return this.customToolTipGen(datas);
        }else{
            return defaultTooltipGen.bind(this)(datas);
        }
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
                                 if(self.valueFormater){
                                     return self.valueFormater(d.data)}
                                    else{
                                       return d.data; 
                                    }}
                                 )
                            .attr("class","detail-text");
      },
      showDetailMaxValue:function(){
            var datas=[],self=this;
            var hasSelect 
            this._measures.forEach(function(f){
                if(f.isSelected) {hasSelect=true}
            })
            if(hasSelect){
                this.mapkey.forEach(function(k,i){
                var data= Number.MIN_VALUE;
                    self._measures.forEach(function(v){
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
                    self._measures.forEach(function(v){
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
            this._measures.forEach(function(f){
                if(f.id !==  d.id){
                    f.measureDom.classed("radarNotSelect",true);
                }else{
                    self.bringToFront(f)
                    //f.measureDom.classed("radarNotSelect",false);
                }
            })
            this.showDetailValue(datas);
      },
      legendMouseOut:function(d){
          this.showDetailMaxValue();
          this.setSelectStyle();
      }
})

var Radar=SmartTrafficChartClass.extend({
    type:"radar",
    mapkey:["d0","d1","d2","d3","d4","d5","d6","d7","d8","d9"],
    init:function(originData){
        var config = originData,
            self = this;
        this.setOption(config);
        this._d=originData.data;
        var mapkey = this.mapkey;
        mapkey.forEach(function(key) {
            if (config[key]) {
                    self._d[key] = originData.data[config[key]]; 
            }
        });
        Object.keys(this._d).forEach(function(k){
             if(self.mapkey.indexOf(k)===-1){
                    delete self._d[k];
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
            var d=coordinate(r,i,this);
            datas.push(d);
        }
    }
    var area = svg.append("svg:g").attr("class","Radar-area");
    var tFunction=function(d){
        d.attr("opacity",0)
            .transition()
            .duration(transitionTime)
            .ease("linear")
            .attr("opacity",0.6);
    }
    var p=area.append("svg:path")
            .attr('d', lineGen(datas))
            .attr('stroke', this.color)
            .attr('stroke-width', 2)
            .attr('fill',this.color)
            .attr("opacity",0.6)
            .attr("pointer-events", "none");
    area.selectAll("circle").data(datas)
                        .enter()
                        .append("svg:circle")
                        .attr("cx",function(d){return d.x}).attr("cy",function(d){return d.y}).attr("r",0.1)
                        .attr("fill",this.color)
                        .attr("class",function(d,i){return "event-radar-"+d.i});
  
    if(!this.measureDom){
        p.call(tFunction);
    }
       this.measureDom=area;
    },
    toHtml:function(ctx){
        var i = ctx.get("i");
        var d=this._d["d"+i];
        if(this.valueFormater) {d=this.valueFormater(d)};
        var text = "";
            text += "<tr>";
            text += "<td class='tooltip-name'><span style=' background-color:" + this.color + "'></span>" + this.name + "</td>";
            text += "<td class='tooltip-value'>" + d + "</td>";
            text += "</tr>";
        return text;
    }
   
});
var Scroll=function(type,svgheight,svgWidth,fullheight,fullwidth,svgContainer,scrollContainer,svgGroup){
    var offset=0,scrollOffset =0,scrollbarlength=svgheight*Math.min(svgheight/fullheight,1);
    var rectGen=function(x, y, w, h, r, tl, tr, bl, br) {
                // x: x-coordinate
                // y: y-coordinate
                // w: width
                // h: height
                // r: corner radius
                // tl: top_left rounded?
                // tr: top_right rounded?
                // bl: bottom_left rounded?
                // br: bottom_right rounded?
                var path;
                path  = "M" + (x + r) + "," + y;
                path += "h" + (w - 2*r);
                if (tr) { path += "a" + r + "," + r + " 0 0 1 " + r + "," + r; }
                else { path += "h" + r; path += "v" + r; }
                path += "v" + (h - 2*r);
                if (br) { path += "a" + r + "," + r + " 0 0 1 " + -r + "," + r; }
                else { path += "v" + r; path += "h" + -r; }
                path += "h" + (2*r - w);
                if (bl) { path += "a" + r + "," + r + " 0 0 1 " + -r + "," + -r; }
                else { path += "h" + -r; path += "v" + -r; }
                path += "v" + (2*r - h);
                if (tl) { path += "a" + r + "," + r + " 0 0 1 " + r + "," + -r; }
                else { path += "v" + -r; path += "h" + r; }
                path += "z";
                return path;
            }
    var drag = d3.behavior.drag();
    if(type==="vertical"){
       if(svgheight>fullheight) return;
        
       
        //legendGroup.append("rect").attr("height",svgheight).attr("width",svgWidth).attr("fill-opacity", 0);
        var scrollBackground=scrollContainer.append("path").attr("d",rectGen(-5,0,8,svgheight,3,true,true,true,true))
                                    .attr("fill","#BBB")                             
                                    .style("opacity",0.4);
        var scroll=scrollContainer.append("path").attr("d",rectGen(-4,0,6,scrollbarlength,3,true,true,true,true))
                                    .attr("fill","#AAA")                             
                                    .style("opacity",0.6);
        svgContainer.on("mousewheel",function(){
            var _offset= d3.event.deltaY;
            scrollOffset = (offset+_offset)*svgheight/fullheight;
            if(scrollOffset<0){
                scrollOffset=0;
            }
            if(scrollOffset+scrollbarlength>svgheight){
                scrollOffset=svgheight- scrollbarlength;
            }
            offset = scrollOffset*fullheight/svgheight;
            svgGroup.attr("transform","translate(0,"+(-offset)+")");
            scroll.attr("transform","translate(0,"+scrollOffset+")");
           
            //event.stopPropagation();
            event.preventDefault();

        });
        drag.on("drag",function(){
           var _offset= d3.event.dy;
            scrollOffset+=_offset;
            if(scrollOffset<0){
                scrollOffset=0;
            }
            if(scrollOffset+scrollbarlength>svgheight){
                scrollOffset=svgheight- scrollbarlength;
            }
            offset = scrollOffset*fullheight/svgheight;
            svgGroup.attr("transform","translate(0,"+(-offset)+")");
            scroll.attr("transform","translate(0,"+scrollOffset+")");
             event.preventDefault();
        })
    }
    if(type==="horizontal"){
        var scrollBackground=scrollContainer.append("path").attr("d",rectGen(0,-5,svgWidth,8,3,true,true,true,true))
                                    .attr("fill","#BBB")                             
                                    .style("opacity",0.4);
        var scroll=scrollContainer.append("path").attr("d",rectGen(0,-4,scrollbarlength,6,3,true,true,true,true))
                                    .attr("fill","#AAA")                             
                                    .style("opacity",0.6);
        svgContainer.on("mousewheel",function(){
            var _offset= d3.event.deltaX;
            scrollOffset = (offset+_offset)*svgWidth/fullwidth;
            if(scrollOffset<0){
                scrollOffset=0;
            }
            if(scrollOffset+scrollbarlength>svgWidth){
                scrollOffset=svgWidth- scrollbarlength;
            }
            offset = scrollOffset*fullwidth/svgWidth;
            svgGroup.attr("transform","translate("+(-offset)+",0)");
            scroll.attr("transform","translate("+scrollOffset+",0)");
           
            event.stopPropagation();

        })
        
        drag.on("drag",function(){
           var _offset= d3.event.dx;
            scrollOffset+=_offset;
            if(scrollOffset<0){
                scrollOffset=0;
            }
            if(scrollOffset+scrollbarlength>svgWidth){
                scrollOffset=svgWidth- scrollbarlength;
            }
            offset = scrollOffset*fullwidth/svgWidth;
            svgGroup.attr("transform","translate("+(-offset)+",0)");
            scroll.attr("transform","translate("+scrollOffset+",0)");
           
            event.stopPropagation();
        })
    }
    drag.on("dragstart",function(){
            scroll.style("opacity",1);
        })
        drag.on("dragend",function(){
             scroll.style("opacity",0.6);
        })
        scroll.call(drag);
        scroll.on("mousemove",function(){
            scroll.style("opacity",1);
        })
        scroll.on("mouseout",function(){
            scroll.style("opacity",0.6);
        })
}
var scrolls = Curry(Scroll);
var verticalScrolls=scrolls("vertical");
var Legend=SmartTrafficChartClass.extend({
    init:function(eventManager){
        this.eventManager =eventManager;
    },
    draw:function(ctx,_measures){
        var svg=ctx.get("svg"),legendWidth=ctx.get("legendWidth")-10,self=this,legendHeight =ctx.get("legendHeight"),guid=ctx.get("guid");
        var legendGroup =svg.append("svg:g").classed("legendGroup",true)
        legendGroup.append("rect").attr("height",legendHeight).attr("width",legendWidth).attr("fill-opacity", 0);
        var legends=legendGroup.append("svg:g");
        svg.append("defs").append("clipPath")
                        .attr("id", guid+"legendclip")
                        .append("rect")
                        .attr("x",-10)
                        .attr("y",-2)
                        .attr("width", legendWidth+20)
                        .attr("height", legendHeight+4);
        svg.attr("clip-path", "url(#"+guid+"legendclip");
        legends.selectAll(".legend")
                            .data(_measures.vals()).enter()
                            .append("g").classed("legend",true);
        var scrollContainer=svg.append("g").attr("transform","translate("+(legendWidth-10)+",0)");
        verticalScrolls(legendHeight,legendWidth,_measures.vals().length*32,0,svg,scrollContainer,legends);
        legends.selectAll(".legend").each(function(d,i){
            var g=d3.select(this);
            g.append("svg:rect").attr("height", 26)
                                    .attr("width", legendWidth-10)
                                    .attr("y", i * 32 )
                                    .attr("x", -10)
                                    .attr("fill", "transparent");
            if(d.legendIcon==="rect"){
                  g.append("svg:rect").attr("x",-8)
                                        .attr("y",i * 32+5)
                                        .attr("width",16)
                                        .attr("height",16)
                                        .attr("fill",d.color);
            }else{
                g.append("svg:circle").attr("cx",0)
                                    .attr("cy",  i * 32+13)
                                    .attr("r",8)
                                    .attr("fill", d.color );
            }
            g.append("svg:text").attr("x", 12)
                                    .attr("y",(i * 32) + 14)
                                    .text(d.name)
                                    .attr("dominant-baseline", "middle");
            d.legendDom=g;
            g.on("mouseover", function(d) {
                d3.select(this).select("rect").classed("legendMouseOver",true);
                self.eventManager.call("legendmouseover", d);
            })
            .on("mouseout", function(d) {
                d3.select(this).select("rect").classed("legendMouseOver",false);
                self.eventManager.call( "legendmouseout", d);
               
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
var CompareChart=SmartTrafficChartClass.extend({
    mapkey:["x","y"],
    init:function(config){
        var self= this;
        this.isInitDraw=false;

        this._yValueFormat=function(v){
            var max=this.getMaxData("y"),min=this.getMinData("y");
            var span = (max-min)/10;
            if(isNaN(v)){
                return this.yValueFormat? this.yValueFormat(v):v;
            }else{
                var self=this;
                return span>1? function(v){
                    var _v =Number(v).toFixed();
                        return self.yValueFormat? self.yValueFormat(_v):_v;
                    }(v)
                    :
                    function(v){
                        var num = 1,_v;
                        for(var i =0;i<span.toString().length;++i){
                            if(span.toString()[i]!== 0 && span.toString()[i]!="."){
                                num = i;
                                break;
                            }
                        }
                        _v=Number(v).toFixed(i);
                        return self.yValueFormat? self.yValueFormat(_v):_v;
                    }(v)
            }
        }
        this._y2ValueFormat = function(v){
            var max=this.getMaxData("y2"),min=this.getMinData("y2");
            var span = (max-min)/10;
            if(isNaN(v)){
                return this.y2ValueFormat? this.y2ValueFormat(v):v;
            }else{
                var self=this;
                return span>1? function(v){
                    var _v =Number(v).toFixed();
                        return self.y2ValueFormat? self.y2ValueFormat(_v):_v;
                    }(v)
                    :
                    function(v){
                        var num = 1,_v;
                        for(var i =0;i<span.toString().length;++i){
                            if(span.toString()[i]!== 0 && span.toString()[i]!="."){
                                num = i;
                            }
                        }
                        _v=Number(v).toFixed(i);
                        return self.y2ValueFormat? self.y2ValueFormat(_v):_v;
                    }(v)
            }
        }
        this.eventManager=eventManager.create();
	    this.colorManager=colorManager.create();
        this.legend=Legend.create(this.eventManager);
        this.toolTip=ChartToolTip.create();
        this._measures=new Set(function(v1,v2){
            return String(v1.id) === String(v2.id)});
        this.memory=new Memory(); 
        this.translate=[0,0];
        this._zoomScale=1;
        this.setConfig(config);
        this.registerEvent();
    },
    setConfig:function(config,val){
        if(config === undefined|| config ===null) return this;
        if(typeof config ==="object"){
            var self= this;
            this.setOption(config);
            this.showToolTip = config.showToolTip ===false? false :true;
            this.showLegend=config.showLegend === false ? false:true;
            this.yLabel=this.yLabel||this.yTitle;
            this.y2Label=this.y2Label || this.y2Title;
            
            this.isInitDraw=false;
        }else{
            this[config] = val;
        }   
        return this;
    },
    registerEvent:function(){
        this.eventManager.on("select",this.setSelectStyle,this)
        this.eventManager.on("deSelect",this.setSelectStyle,this)
    },
    appendTo:function(id){
        this.appendId = id;
        return this;
    },
    calculateMargin:function(){
        this._titleHeight=80;
        this._drawAreaWidth=this.width;
        this._drawAreaHeight=this.height - this._titleHeight;
         if(this.showLegend){
            this._drawAreaWidth=Math.floor(this.width*0.8);
            this._legendWidth=Math.floor(this.width*0.2);
        }else{
            this._drawAreaWidth=this.width;
        }
        if(this.hasY1()){
            // has y1  
            this._yAxisWidth=this.getYAxisWidth("y");
            this._yTitleWidth=40;
        }else{
            this._yAxisWidth=0;
            this._yTitleWidth=0;          
        }
        if(this.hasY2()){
            //y2
            this._y2AxisWidth =this.getYAxisWidth("y2");
            this._y2TitleWidth=40;        
        }else{
            this._y2AxisWidth =0;
            this._y2TitleWidth=0;   
        }
        this._xTitleHeight=20;
        this._xAxisHeight=this.getXAxisHeight();
        this._figureHeight=this._drawAreaHeight - this._xTitleHeight -this._xAxisHeight;
        this._figureWidth = this._drawAreaWidth - this._y2AxisWidth - this._y2TitleWidth -this._yAxisWidth - this._yTitleWidth;
        return this;
    },
    validateConfig:function(){
        if(this.appendId===undefined || this.appendId ===null){
                console.error("please assign chart container ID");
                return false;
        }
        if(this._drawAreaHeight * this._drawAreaWidth <0 || this._figureHeight* this._figureWidth<0){
              console.error("Wrong chart height and width");
              return false;
        }
        return true;
    },
    addMeasure:function(_measure){
        var measureObj;
        switch(_measure.type){
            case "line":
                measureObj=Line.create(_measure);
               // this.attachMeasure(measureObj);
               
                break;
            case "bar":
                measureObj=Bar.create(_measure);
                //this.attachMeasure(measureObj);
               break;
            case "boxplot":
                measureObj=BoxPlot.create(_measure);
                //this.attachMeasure(measureObj);
                break;
            default:
                console.error("Error figure type !");
                return false;
        }
        this._measures.add(this.preHandleMeasure(measureObj));
        if(this.isInitDraw) this.reDraw();
        return true;
    },
    removeMeasureById:function(id){
        this._measures.del({id:id});
        if(this.isInitDraw) this.reDraw();
        return this;
    },
    removeMeasure:function(mesure){
        this._measures.del(mesure);
        if(this.isInitDraw) this.reDraw();
        return this;
    },
    preHandleMeasure:function(obj){
        var self = this;
        obj.color=obj.color||this.colorManager.getColor();
        obj.eventManager=this.eventManager;
        obj.$chart=this;
        obj._d.forEach(function(d) {
                if(self.xType ==="time"){
                     if (typeof d.x !== "time") d.x = new Date(d.x);
                }
                if(self.xType ==="number"){
                    d.x=Number(d.x);
                }
                if(self.xType ==="string"){
                    d.x=d.x.toString();
                }
               
            });
        obj._d.sort(function(v1, v2) {
            return v1.x - v2.x;
        });
        return obj;
    },
    validateMeasure:function(measure){

    },
    initDraw:function(){
        if(this.isInitDraw) return this;
        if(this.validateConfig()){
            var self=this;
            this.svgContainer = d3.select("#"+this.appendId).append("div").classed("CompareChart",true)
                                    .style("width", this.width)
                                    .style("height", this.height)
                                    .style("position","relative")
                                    .classed("notextselect",true);
            this.svg=this.svgContainer.append("svg").classed("CompareChart-svg",true)
                                                        .attr("width", this.width)
                                                        .attr("height",this.height);
            this.svg.append("defs").append("clipPath")
                .attr("id", this.appendId+"clip")
                .append("rect")
                .attr("width", this._figureWidth)
                .attr("height", this._figureHeight);
            this.svg.title = this.svg.append('svg:g').classed("CompareChart-title-Container",true)
                                                      .attr("transform","translate("+(this._drawAreaWidth/2)+",5)");
            this.svg.drawArea =this.svg.append("svg:g").classed("CompareChart-drawArea",true)
                                        .attr("transform","translate(0,"+this._titleHeight+")"); 
            this.svg.drawArea.figureArea=this.svg.drawArea.append("svg:g").classed("CompareChart-figure",true)
                                          .attr("transform","translate("+(this._yTitleWidth+this._yAxisWidth)+",0)")
                                          .attr("clip-path", "url(#"+this.appendId+"clip)");
            this.svg.drawArea.figureRect=this.svg.drawArea.figureArea
                                          .append("svg:rect")
                                          .attr("width", this._figureWidth)
                                          .attr("height", this._figureHeight)
                                          .attr("fill-opacity", 0);
            if(this.showLegend)   {
               this.svg.legend= this.svg.append("g").attr("transform", "translate(" + (this._drawAreaWidth+10) + "," +this._titleHeight + ")").classed("CompareChart-Legend-Container", true);
            }
            if(this.showToolTip){
               this.svg.toolTip=this.toolTip.initDraw(this.svgContainer);
            }
            //this.drawEventZone(this.svg.drawArea);
            this.zoom = d3.behavior.zoom()
                .x(self.getScale("x"))
                .scaleExtent([0.8, 8])
                .on("zoom", self.zoomFunction.bind(self),false);
            this.svg.drawArea.call(this.zoom).on("dblclick.zoom", null,false);
            this.svg.drawArea.figureArea.on("click",self.getLinePosition.bind(this),false);
            this.isInitDraw=true;                                     
        }
        return this;
    },
    draw:function(){
        this.drawTitle().drawAxis().drawYTicketLine().drawMeasure().drawLegend().drawEventZone();
    },
    drawAxis:function(){
        var self = this;
        var xtickNum = Math.floor(this._figureWidth/70);
        if(this._xAxis) this._xAxis.remove();
        if(this.xType ==="string"){
            var ticksValues=[] , Set = self.getXset();
            for(var i =0 ;i <Set.length;++i) ticksValues.push(i);
            this._xAxis = this.svg.drawArea.append("svg:g")
                .attr("transform", "translate("+(this._yTitleWidth+this._yAxisWidth)+"," + (this._drawAreaHeight-this._xTitleHeight-this._xAxisHeight) + ")")
                .attr("class", "CompareChart-xaxis")
                .call(d3.svg.axis().scale(this.getScale("x")).orient("bottom").tickFormat(function(v){
                    if(Math.floor(v)!== Math.ceil(v)) return ;
                    if(v>-1 && v<Set.length)
                    {
                        if(this.xValueFormat){
                            return this.xValueFormat(Set[v]);
                        }
                        return Set[v];
                    }
                        
                }).ticks(Set.length));
                //tickValues(d3.range(Set.length)));
        }else{
            this._xAxis = this.svg.drawArea.append("svg:g")
                .attr("transform", "translate("+(this._yTitleWidth+this._yAxisWidth)+"," + (this._drawAreaHeight-this._xTitleHeight-this._xAxisHeight) + ")")
                .attr("class", "CompareChart-xaxis")
                .call(d3.svg.axis().scale(this.getScale("x")).orient("bottom").tickFormat(this.xValueFormat.bind(this)).ticks([xtickNum]));
        }

        /////draw y1
        if(this.hasY1()){
            if (this._yAxis) this._yAxis.remove();
            this._yAxis = this.svg.drawArea.append("svg:g")
                        .attr("class", "CompareChart-yaxis")
                        .attr("transform","translate("+(this._yTitleWidth+this._yAxisWidth)+",0)")
                        .call(d3.svg.axis().scale(this.getScale("y")).orient("left").tickFormat(this._yValueFormat.bind(this)));
        }

        /// draw y2
        if(this.hasY2()){
            if (this._y2Axis) this._y2Axis.remove();
            this._y2Axis = this.svg.drawArea.append("svg:g")
                .attr("class", "CompareChart-y2axis")
                .attr("transform", "translate(" + (this._figureWidth+this._yTitleWidth+this._yAxisWidth) + ",0)")
                .call(d3.svg.axis().scale(this.getScale("y2")).orient("right").tickFormat(this._y2ValueFormat.bind(this)));
        }
        if(this._xAxisHeight > 25){
            this._xAxis.selectAll("text").style("text-anchor", "end")
                .attr("dx", "-4")
                .attr("dy", "8")
                .attr("transform", function(d) {
                    return "rotate(-45)" 
                    });
        }
        
        
        return this;
    },
    drawYTicketLine:function(isClear){
        var self = this;
        if(isClear){
          if(this._ticketLine) {
                this._ticketLine.remove();
            } 
        }
        else{
            if(this._ticketLine) {
                this._ticketLine.remove();
            }
            if(this.hasY1()||this.hasY2()){

                if(this.hasY1()){
                this._ticketLine= this._yAxis.selectAll("g")
                                .append("line").attr("x2", self._figureWidth).attr("x1", 0).attr("y1", 0).attr("y2", 0).attr("stroke-width", 1)
                                .attr("stroke", "black").attr("opacity", "0.2").attr("stroke-dasharray", "2,2");
                    
                }
                else if(this.hasY2()){
                this._ticketLine=this._y2Axis.selectAll("g")
                                .append("line").attr("x2", -self._figureWidth).attr("x1", 0).attr("y1", 0).attr("y2", 0).attr("stroke-width", 1)
                                .attr("stroke", "black").attr("opacity", "0.2").attr("stroke-dasharray", "2,2");
                }
          }
        }
        return this;
    },
    getXAxisHeight:function(){
        return this.memory.cache("xAsisHeight",function(){
            if(this._measures.vals().length === 0) return 5;
            var length =0,self =this;
            this._measures.forEach(function(f){
                f._d.forEach(function(d){
                    if(self.xValueFormat){
                        length=Math.max(length,self.xValueFormat(d.x).toString().length);
                        }
                    else{
                            length=Math.max(length,d.x.toString().length);
                        }
                })
            })

            if(length>6)
                return length * 8/Math.min(1,self._zoomScale);
            else{
                return 25/Math.min(1,self._zoomScale);
            }
        },this);
        
    },
    getYAxisWidth:function(y){
        if(y==="y2"){
            return this.memory.cache("y2AxisWidth",function(){
                var length=0,self=this;
                this._measures.vals().filter(function(f) {return f.y2}).forEach(function(f){
                    f.getAllY().filter(function(d){return !isNaN(d)}).forEach(function(d){
                        if(self._y2ValueFormat){
                            length = Math.max(length,self._y2ValueFormat(d).toString().length);
                        }else{
                            length = Math.max(length,d.toString().length);
                        }
                    })
                })
                return length *7;
            },this)
        }else{
            return this.memory.cache("yAxisWidth",function(){
                var length=0,self=this;
                this._measures.vals().filter(function(f) {return !f.y2}).forEach(function(f){
                    f.getAllY().filter(function(d){return !isNaN(d)}).forEach(function(d){
                        if(self._yValueFormat){
                            length = Math.max(length,self._yValueFormat(d).toString().length);
                        }else{
                            length = Math.max(length,d.toString().length);
                        }
                    })
                })
                return length *7;
            },this)
        }
    },
    drawTitle:function(){
        this.svg.title.selectAll("text").remove();
        this.svg.title.append("text").text(this.title).attr("text-anchor", "middle")
                                            .attr("font-size","22px")
                                            .attr("dominant-baseline", "text-before-edge");
        if(this.hasY1()){
            this.svg.drawArea.append("g").attr("transform", "translate(1," + ( this._figureHeight / 2) + ")")
            .classed("CompareChart-yTitleBar", true)
            .attr("text-anchor", "middle")
            .append("text").text(this.yTitle)
            .attr("transform", "rotate(-90)")
            .attr("dominant-baseline", "text-before-edge");
        }
        if(this.hasY2()){
             this.svg.drawArea.append("g").attr("transform", "translate(" + (this._figureWidth+this._yTitleWidth+this._yAxisWidth+this._y2AxisWidth+this._y2TitleWidth) + "," + ( this._figureHeight / 2) + ")")
             .classed("CompareChart-y2TitleBar", true).attr("text-anchor", "middle")
             .append("text").text(this.y2Title)
             .attr("transform", "rotate(-90)")
             .attr("dominant-baseline", "text-after-edge");
        }
        this.svg.drawArea.append("g").attr("transform", "translate(" + (this._drawAreaWidth / 2) + "," + (this._drawAreaHeight-this._xTitleHeight) + ")")
            .classed("CompareChart-xTitleBar", true).attr("text-anchor", "middle")
            .append("text")
            .text(this.xTitle)
            .attr("dominant-baseline", "text-before-edge");
        return this;
    },
    drawLegend:function(){
        if(this.showLegend){
            var ctx = new context();
            ctx.add("svg",this.svg.legend).add("legendWidth",this._legendWidth).add("legendHeight",this._figureHeight)
                .add("guid",this.appendId);
            this.legend.draw(ctx,this._measures);
        }
        return this;
    },
    drawMeasure:function(){
        var ctx = new context();
        var self =this;
        ctx.add("svg",this.svg.drawArea.figureArea)
            .add("scales",this.getScale.bind(this))
            .add("xsetIndex",this.getXsetIndex.bind(this))
            .add("xcooridate",this.getXCoordinate());
        ctx.add("bars",this._measures.vals().filter(function(v){return v.type ==="bar"}))
            .add("xset",this.getXset.bind(this))
            .add("barMaxHeight",this._figureHeight)
            .add("zoomScale",this._zoomScale || 1);
        this._measures.forEach(function(f){
            if(f.type==="bar"){
                 f.draw(ctx);
            }
        })
        this._measures.forEach(function(f){
            if(f.type==="boxplot"){
                 f.draw(ctx);
            }
        })
        this._measures.forEach(function(f){
            if(f.type==="line" &&self.xType !== "string"){
                 f.draw(ctx);
            }
        })
        return this;
    },
    drawEventZone:function(){
        this.svg.drawArea.figureArea.selectAll("CompareChart-Event-Zone").remove();
        var self =this;
        var set =this.getXset();
        if(!set) return;
        var minSpan = this._figureWidth;
        for(var i =0;i<set.length-1;++i){
            minSpan = Math.min(self.getXCoordinate()(set[i+1])-self.getXCoordinate()(set[i]),minSpan);
        }
        minSpan=Math.floor(minSpan);
        this.svg.eventZones=this.svg.drawArea.figureArea.append("svg:g").classed("CompareChart-Event-Zone",true);
        this.svg.eventZones.selectAll("rect").data(set)
                .enter()
                .append("rect")
                .attr("x", function(d, i) {
                    return self.getXCoordinate()(d) - minSpan / 2
                })
                .attr("y", 0)
                .attr("width", minSpan)
                .attr("height", self._figureHeight)
                .attr("class", function(d, i) {
                    return "event-zone-" + i
                })
                .attr("rect-index", function(d, i) {
                    return i
                })
                .attr("fill-opacity", "0")
                .on("mouseout",this.eventZoneMousout.bind(this))
                .on("mousemove", this.eventZoneMousemove.bind(this));
        return this;
    },
    eventZoneMousout:function(){
        if(this.showToolTip) this.toolTip.setVisiable(false);
        this.removeGuideLine();
    },
    eventZoneMousemove:function(d,i){
            var self=this;
            var ctx=new context();
            this.removeGuideLine();
            ctx.add("scales",this.getScale.bind(this));
            ctx.add("xcooridate",this.getXCoordinate());
            if(this.showToolTip){
                var sharps = this.svg.selectAll(".event-comparechart-"+i);
                var chartFigrues=[];
                this.toolTip.setVisiable(false);
                sharps.filter(function(d){
                    //only show selected item
                    var isAllSelect = true,hasSelect=false;
                    self._measures.forEach(function(f){
                        if(f.isSelected) {hasSelect=true}
                        else {isAllSelect=false}
                    })
                    if(isAllSelect){
                        self._measures.forEach(function(f){
                            f.isSelected = false;
                        })
                        hasSelect=false;
                    }
                    return (!hasSelect || d._figureObj.isSelected);
                }).filter(function(d){
                    //show insharp item
                    return d._figureObj.isInSharp(self.svg.drawArea.figureArea,this,ctx);
                    }).each(function(d){
                        chartFigrues.push(d);
                        self.drawGuideLine(d);
                    });
                if(chartFigrues.length>0){
                    var position = d3.mouse(this.svg.node());
                    this.toolTip.setPosition(position[0] ,position[1]);
                    //this.toolTip.setPosition(event.pageX , event.pageY);
                    this.toolTip.setContent(this.getToolTipContent(chartFigrues));
                    this.toolTip.setVisiable(true);
                }
            } 
    },
    getToolTipContent:function(chartFigrues){
        var datas=chartFigrues.map(function(c,i){
            var d={};
            d.name=c._figureObj.name;
            d.id=c._figureObj.id;
            d.type=c._figureObj.type;
            d.data=c;
            d.color=c._figureObj.color;
            d.Measure=c._figureObj;
            return d;
        });
        
        var defaultTooltipGen=function(datas){
            var text = "",
            self = this;
                var title = this.xValueFormat?this.xValueFormat(datas[0].data.x ): datas[0].data.x ;
                text = "<table class='tool-tip-table' ><tbody><tr><th class = 'tooltip-title' colspan='3'>" + title + "</th></tr>";
                datas.forEach(function(d) {
                    var ctx=new context();
                    ctx.add("d",d.data);
                    text += d.Measure.toHtml(ctx);
                });
                return text += "</tbody><table>";
        }
        if(this.customToolTipGen){
            return this.customToolTipGen(datas);
        }else{
            return defaultTooltipGen.bind(this)(datas);
        }

    },
    getXset:function(){
        return this.memory.cache("xset",function(){
            var self = this;
            self._xSet =new Set(function(v1,v2){
                    if(self.xType==="time"|| self.xType==="number"){
                        return v1 -v2 === 0;
                    }else{
                        return v1 === v2;
                    }
                });
            this._measures.forEach(function(ds){
               ds._d.forEach(function(d){
                    self._xSet.add(d.x);
               })
            })
            self._xSet.sort(function(v1,v2){
               return v1 -v2;
            })
            return self._xSet.vals();
        },this);
    },
    getXsetIndex:function(x){
        for(var i =0;i<this.getXset().length;++i){
            if(this.xType ==="time"|| this.xType ==="number")
            {
                if(this.getXset()[i]- x=== 0)
                   return i;
              
            }
            if(this.xType ==="string"){
                if(this.getXset()[i] === x){
                    return i;
                }
            }
            
        }
        return -1;
    },  
    hasY1:function(){
       return this.memory.cache("hasy1",function(){
            var find =false;
            this._measures.forEach(function(d){
                find = !d.y2 || find;
            })
            return find;
        },this);
    },
    hasY2:function(){
       return this.memory.cache("hasy2",function(){
            var find = false;
            this._measures.forEach(function(d){
                find = d.y2 || find;
            })
             return find;
        },this);
    },
    rendering:function(){
        if(this.isInitDraw){
            this.reDraw();
        }else{
            this.calculateMargin().initDraw().draw();
        }
    },
    reDraw:function(){
        this.svgContainer.remove();
        this.isInitDraw =false;
        this.memory.flush();
        this._zoomScale=1;
        this.translate=[0,0];
        this.rendering();
    },
    remove:function(){
        this.svgContainer.remove();
        this.init();
    },
    getScale:function(key){
        if(key ==="x"){
            return this.memory.cache("xscale",function(key){
                if(this.xType==="time" || this.xType==="number"){
                    var span =(this.getMaxData("x") -this.getMinData("x"))/24;
                    return d3.scale.linear()
                                    .range([0, this._figureWidth])
                                    .domain([this.getMinData("x") - span, this.getMaxData("x") + span]);        
                }else if(this.xType === "string"){
                  
                    return d3.scale.linear()
                                    .range([0, this._figureWidth])
                                    .domain([-1,this.getXset().length]);
                   
                }
            },this);
        }
        if(key ==="y" || key ==="y2"){
            return this.memory.cache(key+"scale",function(key){
                var span, max,min;
                max = this.getMaxData(key);
                min =this.getMinData(key);
                if(min === max){
                    min /=2 ;
                    if(max === 0)   max +=10;
                }
                span = (max-min)/12;
                max+=span;min-=span;
                return  d3.scale.linear()
                        .range([0, this._figureHeight])
                        .domain([max, min]);
            },this,arguments);
        }
    },
    getXCoordinate:function(){
         return this.memory.cache("xcooridate",function(){
                if(this.xType==="time" || this.xType==="number"){
                    return this.getScale("x");        
                }else if(this.xType === "string"){
                    var self=this;
                    return function(x){
                        var i = self.getXset().indexOf(x);
                        var f=self.getScale("x");
                        return f(i);
                    } 
                }
            },this);
    },
    getMaxData:function(key){
        return this.memory.cache("max"+key,function(key){
            var datas= this._measures;
            var _num = Number.MIN_VALUE;
            datas.forEach(function(d){
                if(d.getMax()!== null){
                    _num=Math.max(d.getMax(key),_num);
                }
            })
            return _num;
        },this,arguments)
       
    },
    getMinData:function(key){
        return this.memory.cache("min"+key,function(key){
            var datas =this._measures;
            var _num =Number.MAX_VALUE;
            datas.forEach(function(d){
                if(d.getMin(key)!== null){
                    _num=Math.min(d.getMin(key),_num);
                }
            })
            return _num;
        },this,arguments);
    },
    zoomFunction:function(){
        var max,min;
        min = this.getXCoordinate()(this.getXset()[0]);
        max = this.getXCoordinate()(this.getXset()[this.getXset().length-1]);
        if(max< this._figureWidth/2 || min > this._figureWidth/2) {
           this.zoom.translate(this.translate);
        };
        this.translate=this.zoom.translate();
        var self = this;
        this._zoomScale = d3.event.scale;
        this.toolTip.setVisiable(false);
        this.svg.drawArea.remove();
        this.svg.drawArea =this.svg.append("svg:g").classed("CompareChart-drawArea",true)
                                        .attr("transform","translate(0,"+this._titleHeight+")");  
        this.svg.drawArea.figureArea=this.svg.drawArea.append("svg:g").classed("CompareChart-figure",true)
                                          .attr("transform","translate("+(this._yTitleWidth+this._yAxisWidth)+",0)")
                                          .attr("clip-path", "url(#"+this.appendId+"clip)");
        this.svg.drawArea.figureRect=this.svg.drawArea.figureArea
                                          .append("svg:rect")
                                          .attr("width", this._figureWidth)
                                          .attr("height", this._figureHeight)
                                          .attr("fill-opacity", 0);
        this.svg.drawArea.call(this.zoom).on("dblclick.zoom", null);
        this.svg.drawArea.figureArea.on("click",self.getLinePosition.bind(this));
        if(!this.p2){
            this.p1=null;
        }
        this.drawAxis().drawYTicketLine().drawTitle().drawMeasure().drawEventZone().setSelectStyle();
        this.drawCustomeLine(this.p1,this.p2);
    },
    drawGuideLine:function(point){
        var self = this,$chart =this.$chart;
        var xScale = self.getXCoordinate(),
            yScale = point._figureObj.y2? this.getScale("y2"): this.getScale("y");
        if (!self._guideLineGroup) self._guideLineGroup = this.svg.drawArea.figureArea.append("g").attr("class", "guide-lines");
        point._figureObj.getY(point).forEach(function(v) {
            if (point._figureObj.y2) {
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
                                    .attr("cx",self._figureWidth-4)
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
                                    .attr("cx",4)
                                    .attr("cy", yScale(v))
                                    .attr("r",4);
            }
        });
        var minY = Number.MAX_VALUE;
        point._figureObj.getY(point).forEach(function(v) {
            minY = Math.min(minY, yScale(v));
        });
        if (self._guideLineGroup.yLine) {
            minY = Math.min(minY, Number(self._guideLineGroup.yLine.attr("y1")));
            self._guideLineGroup.yLine.remove();
        }
        self._guideLineGroup.yLine = self._guideLineGroup
            .append("line")
            .attr("x1", xScale(point._figureObj.getX(point)[0]))
            .attr("y1", minY)
            .attr("x2", xScale(point._figureObj.getX(point)[0]))
            .attr("y2", self._figureHeight)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");
    self.svg.selectAll(".yAxisGuideLine").attr("visibility","hidden"); 
    },
    removeGuideLine:function(){
        var self = this;
        if (self._guideLineGroup) {
            self._guideLineGroup.remove();
            delete self._guideLineGroup;
        }
    },
    getLinePosition:function(){
        if(!this.showCustomLine) return;
        if(d3.event.defaultPrevented) return;
        if(this.p1 &&  this.p2)
        {
            this.p1 = null;
            this.p2 = null;
            this.customeLineYScale=null;
            if(this.customeLineFigure) this.customeLineFigure.remove();
        }
        if(this.hasY1()){
            this.customeLineYScale = this.getScale("y"); 
        }else if(this.hasY2()){
            this.customeLineYScale = this.getScale("y2");
        }else{
            return;
        }
         var self = this,xScale=this.getScale("x"),yScale = this.customeLineYScale;
        if(this.p1){
            var position = d3.mouse(this.svg.drawArea.figureArea.node());
            this.svg.drawArea.on("mousemove",null)
            self.p2={};
                self.p2.x=xScale.invert(position[0]);
                self.p2.y = yScale.invert(position[1]);
                self.drawCustomeLine(this.p1,this.p2);
            
        }else{
            var position = d3.mouse(this.svg.drawArea.figureArea.node());
            this.p1 ={};
            this.p1.x=xScale.invert(position[0]);
            this.p1.y = yScale.invert(position[1]);
            var self = this;
            this.svg.drawArea.on("mousemove",function(){
                var position = d3.mouse(self.svg.drawArea.figureArea.node());
                var p2={};
                p2.x=xScale.invert(position[0]);
                p2.y = yScale.invert(position[1]);
                self.drawCustomeLine(self.p1,p2,true);
            })
        }
       
    },
    drawCustomeLine:function (p1,p2,isLineExtend) {
         if(p1 && p2){
            var x0,y0,x1,y1,x2,y2;
            var xScale = this.getScale("x"),yScale=this.customeLineYScale;
            x0=xScale(p1.x),y0=yScale(p1.y),x2=xScale(p2.x),y2=yScale(p2.y);
            
            if(y2>y0){
                var tempx=x2,tempy=y2;
                x2=x0;y2=y0;x0=tempx;y0=tempy;
            }
            x1=x0;
            y1=y0;
            if(!isLineExtend){
                   if(x2 ===x0 && y2 === y0) return;
                    x1=2*x0-x2;
                    y1=2*y0-y2;
                    while( (y1>-2000&&y1<2000)&&(x1>-2000&&x1<2000)){
                        x1=2*x0-x2;
                        y1=2*y0-y2;
                        x0=x1;
                        y0=y1;
                    }
                    x0=x2;
                    y0=y2;
                    while(x2>-2000&&x2<2000&&y2>-2000&&y2<2000){
                        x2=2*x0-x1;
                        y2=2*y0-y1;
                        x0=x2;
                        y0=y2;
                        
                    }
        
            }
            
            if(this.customeLineFigure) this.customeLineFigure.remove();
            this.customeLineFigure=this.svg.drawArea.figureArea.append("line").attr("x1",x1)
                                                .attr("y1",y1)
                                                .attr("x2",x2)
                                                .attr("y2",y2)
                                                .attr("stroke", "black")
                                                .attr("stroke-width", 2)
                                                .attr("stroke-dasharray", "3,3");
        }
    },
    setSelectStyle:function(){
        var isAllSelect = true,hasSelect=false;
        this._measures.forEach(function(f){
            if(f.isSelected) {hasSelect=true}
            else {isAllSelect=false}
        })
        if(isAllSelect){
            this._measures.forEach(function(f){
                f.isSelected = false;
            })
            hasSelect=false;
        }
        this._measures.forEach(function(f){
            if(hasSelect){
                    if(f.legendDom)  f.legendDom.classed("legendNotSelected", !f.isSelected);
                    if(f.isSelected){
                            f.measureDom.classed("compareChartNotSelected",false);
                            
                        }else{
                            f.measureDom.classed("compareChartNotSelected",true);
                        }
            }else{
                f.measureDom.classed("compareChartNotSelected",false);
                if(f.legendDom)  f.legendDom.classed("legendNotSelected", false);
            }
           
        });
      
        return this;
    }
})
var Line=SmartTrafficChartClass.extend({
    type: "line",
    mapkey: ["x", "y"],
    init: function(originData) {
        var config = originData,
            self = this;
        this.setOption(config);
        this._d = originData.data;
        this.isHandleNaN=(this.isHandleNaN ===undefined ?true:this.isHandleNaN);
        if (config.ref === "y2") {
            this.y2 = true;
        }
        this.lineWidth=this.lineWidth ===undefined? 2:this.lineWidth;
        var mapkey = this.mapkey;
        mapkey.forEach(function(key) {
            if (config[key]) {
                self._d.forEach(function(d){
                    d[key]=d[config[key]];
                })
            }
        });
        // Object.keys(this._d).forEach(function(k){
        //      if(self.mapkey.indexOf(k)===-1){
        //            self._d.forEach(function(d){
        //                 delete d[k];
        //            })
        //         }
        // })
        this._d.forEach(function(d) {
            d._figureObj = self;
        })
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
    getMax:function(key){
        if(key ==="x"){
            if(this._maxx) return this._maxx;
            var x = Number.MIN_VALUE;
            this._d.forEach(function(v){
                if(!isNaN(x)){
                    x = Math.max(v.x , x);
                }
            });
            this._maxx =x;
            return x;
        }
        if(key ==="y"){
            if(this.y2) return Number.MIN_VALUE;
            if(this._maxy) return this._maxy;
            var self =this;
            this._maxy = Number.MIN_VALUE;
            this.getAllY().forEach(function(v){
                if(!isNaN(v)){
                    self._maxy=Math.max(v,self._maxy);
                }
            })
            return this._maxy;
        }
        if(key ==="y2"){
            if(!this.y2) return Number.MIN_VALUE;
            if(this._maxy) return this._maxy;
            var self =this;
            this._maxy = Number.MIN_VALUE;
            this.getAllY().forEach(function(v){
                if(!isNaN(v)){
                    self._maxy=Math.max(v,self._maxy);
                }
            })
            return this._maxy;
        }
       
    },
    getMin:function(key){
        if(key  ==="x"){
            if(this._minx!== undefined) return this._minx;
            var x = Number.MAX_VALUE;
            this._d.forEach(function(v){
                if(!isNaN(x)){
                    x = Math.min(x,v.x);
                }
            });
            this._minx =x;
            return this._minx;
        }
        if(key ==="y"){
            if(this.y2) return null;
            if(this._miny) return this._miny;
            var self =this;
            this._miny=Number.MAX_VALUE;
            this.getAllY().forEach(function(v){
                if(!isNaN(v)){
                    self._miny=Math.min(v,self._miny);
                }
            })
            return this._miny;
        }
        if(key ==="y2"){
            if(!this.y2) return null;
            if(this._miny) return this._miny;
            var self =this;
            this._miny=Number.MAX_VALUE;
            this.getAllY().forEach(function(v){
                if(!isNaN(v)){
                    self._miny=Math.min(v,self._miny);
                }
            })
            return this._miny;
        }
     
    },
    isInSharp: function(svg,_sharp) {
        
        _sharp=d3.select(_sharp);
        if (_sharp.node().nodeName === "circle") {
            var mouse = d3.mouse(svg.node());

            x2 = Number(_sharp.attr("cx")), y2 = Number(_sharp.attr("cy")), r = Number(_sharp.attr("r"));
            return Math.sqrt(Math.pow(mouse[0] - x2, 2) + Math.pow(mouse[1] - y2, 2)) < 3 * r;
        }
    },
    draw: function(ctx) {
        var svg= ctx.get("svg");
        var transitionTime = ctx.get("transitionTime") || 1000;
        var xcooridate=ctx.get("xcooridate");
        var scales = ctx.get("scales");
        var xSetIndex=ctx.get("xsetIndex");
        var isHandleNaN=this.isHandleNaN;
        var line = svg.append("g").attr("class", "CompareChart-line").attr("pointer-events", "none");
        var self = this,yScale, _line, lineGen, _circle, xScale;
        yScale = this.y2 ? scales("y2") : scales("y");
        xScale =xcooridate;
        var lineTransition = function(l){
             var totalLength = l.node().getTotalLength();
             if(self.dashArray){
                l.attr("stroke-dasharray", totalLength + "," + totalLength)
                                .attr("stroke-dashoffset", totalLength)
                                .transition()
                                    .duration(transitionTime)
                                    .ease("linear")
                                    .attr("stroke-dashoffset", 0)
                    .transition().duration(0).attr("stroke-dasharray",self.dashArray);
             }else{
                l.attr("stroke-dasharray", totalLength + "," + totalLength)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                        .duration(transitionTime)
                        .ease("linear")
                        .attr("stroke-dashoffset", 0);
                       
             }
        }
       var circleTransition=function(c){
             c.attr("opacity","0")
                        .transition()
                        .delay(transitionTime)
                        .attr("opacity",1);
        }
        // lineGen = d3.svg.line()
        //     .x(function(d) {
        //         return xScale(d.x);
        //     })
        //     .y(function(d) {
        //         return yScale(d.y);
        //     });
        _line = line.append("path")
            .attr('stroke', this.color)
            .attr('stroke-width', this.lineWidth)
            .attr('fill', 'none')
            .attr('d', this.smartLineGen(xScale,yScale,isHandleNaN,this._d));
        if(this.dashArray){
           _line.attr("stroke-dasharray",this.dashArray); 
        } 
        _circle =
            line.selectAll("linepoint")
            .data(this._d.filter(function(v){return !isNaN(v.y)}))
            .enter()
            .append("circle")
            .attr("fill", this.color)
            .attr("cx", function(d) {
                return xScale(d.x);
            })
            .attr("cy", function(d) {
                return yScale(d.y);
            })
            .attr("r", function(d) {
                return 4;
            })
            .attr("class",function(d,i){
                return "event-comparechart-"+xSetIndex(d.x);
            })
        if(!this.measureDom){
            _line.call(lineTransition);
            _circle.call(circleTransition);
        }  
        this.measureDom =line;
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
        },
        toHtml:function(ctx){
            var data =ctx.get("d");
            var text="";
            var yTitle ;
            if(this.$chart){
                yTitle= this.y2? this.$chart.y2Label:this.$chart.yLabel;
            }else{
                yTitle =" ";
            }
            text += "<tr>";
            text += "<td class='tooltip-name'><span style=' background-color:" + this.color + "'></span>" + this.name + "</td>";
            text += "<td class='tooltip-value'>" + (this.yLabel ||yTitle ) + "</td>";
            text += "<td class='tooltip-value'>" + data.y + "</td>";
            text += "</tr>";
            return text;
        }
})
var Bar =Line.extend({
    type:"bar",
    draw:function(ctx){
        var bars=ctx.get("bars");
        var scales=ctx.get("scales");
        var zoomScale=ctx.get("zoomScale");
        var xcooridate=ctx.get("xcooridate");
        var svg=ctx.get("svg");
        var xSet=ctx.get("xset")();
        var barMaxHeight=ctx.get("barMaxHeight");
        var xSetIndex=ctx.get("xsetIndex");
        var transSitionTime = ctx.get("transitionTime") || 1000;
        var bargroup=svg.append("g")
            .attr("class", "CompareChart-Bar")
            .attr("pointer-events", "none");
        var transitionFunction=function(b){
            b.each(function(d){
                d3.select(this).attr("y",barMaxHeight)
                .transition()
                .duration(transSitionTime)
                .ease("linear")
                .attr("y",function(d) {
                return yScale(d.y);
            })
            });
        }
        var xScale =xcooridate,yScale=this.y2?scales("y2"):scales("y"),barAcc=bars.length,barWidth=60;
        for(var i =0;i<xSet.length-1;++i){
            barWidth = Math.min(xScale(xSet[i+1])-xScale(xSet[i]),barWidth);
        }
        barWidth=barWidth/barAcc * zoomScale;
        barWidth=Math.min(barWidth,25);
        var getBarIndex=function(bars,bar,x){
            var i =-1;
            bars.filter(function(b){
                return b.getAllX().find(function(b){ return b-x=== 0 || b===x})!== undefined;
            }).forEach(function(b,j){
                if(b.id === bar.id){
                    i=j;
                }
            })
            return i;
        }
        var getBarXAcc = function(bars,x){
            return bars.filter(function(b){
                return b.getAllX().find(function(b){ return b-x=== 0 || b===x })!== undefined;
            }).length;
        }
        var self=this;
        var bars=bargroup.selectAll("rect").data(this._d.filter(function(v){return !isNaN(v.y)}))
                .enter()
                .append("rect")
                .attr("x", function(d) {
                    return xScale(d.x) - (getBarXAcc(bars,d.x)) / 2 * barWidth + getBarIndex(bars,self,d.x) * barWidth;
                })
                .attr("y", function(d) {
                    return yScale(d.y);
                })
                .attr("width", barWidth)
                .attr("height",barMaxHeight )
                .attr("fill", this.color)
                .attr("class", function(d, i) {
                    return "event-comparechart-" + xSetIndex(d.x);
                });
        if(!this.measureDom){
            bars.call(transitionFunction);
        }
        this.measureDom=bargroup;
    },
    isInSharp: function(svg,_sharp) {
        _sharp = d3.select(_sharp);
        if (_sharp.node().nodeName === "rect") {
            var mouse = d3.mouse(svg.node());
            x = Number(_sharp.attr("x")), y = Number(_sharp.attr("y")), width = Number(_sharp.attr("width"));
            return mouse[0] > x && mouse[1] > y && mouse[0] < x + width;
        }
    },
    toHtml:function(ctx){
            var data =ctx.get("d");
            var text="";
            var yTitle ;
            if(this.$chart){
                yTitle= this.y2? this.$chart.y2Label:this.$chart.yLabel;
            }else{
                yTitle =" ";
            }
            text += "<tr>";
            text += "<td class='tooltip-name'><span style=' background-color:" + this.color + "'></span>" + this.name + "</td>";
            text += "<td class='tooltip-value'>" + (this.yLabel ||yTitle ) + "</td>";
            text += "<td class='tooltip-value'>" + data.y + "</td>";
            text += "</tr>";
            return text;
        }
})
var BoxPlot = Line.extend({
    type:"boxplot",
    mapkey:["x", "d0", "d1", "d2", "d3", "d4","d5"],
    init:function(oData){
        Line.init.call(this,oData);
        this.rectWidth=oData.rectWidth||18;
        this.lineWidth=this.rectWidth+4;
    },
    draw:function(ctx){;
        var scales=ctx.get("scales");
        var svg=ctx.get("svg");
        var xSetIndex=ctx.get("xsetIndex");
        var barMaxHeight=ctx.get("barMaxHeight");
        var transSitionTime = ctx.get("transitionTime") || 1000;
        var xcooridate=ctx.get("xcooridate");
    
        var xScale =xcooridate,yScale=this.y2?scales("y2"):scales("y"),lineWidth=this.lineWidth,rectWidth=this.rectWidth,self=this;
        var boxGroup=svg.append("g").attr("class","CompareChart-boxplot").attr("pointer-events", "none");
        this._d.forEach(function(d){
                var boxplot =boxGroup.append("g").attr("class","event-comparechart-" + xSetIndex(d.x)).datum(d);
                boxplot.append("line").attr("x1", xScale(d.x)-lineWidth/2).attr("y1", yScale(d.d0))
                                                                    .attr("x2",  xScale(d.x)+lineWidth/2 ).attr("y2", yScale(d.d0))
                                                                    .attr("stroke","black").attr("stroke-width","2");
                boxplot.append("line").attr("x1", xScale(d.x)).attr("y1", yScale(d.d0))
                                                                    .attr("x2",  xScale(d.x) ).attr("y2", yScale(d.d1))
                                                                    .attr("stroke","black").attr("stroke-width","1.5px").attr("stroke-dasharray", "2,2").attr("stroke-fill".color);
                boxplot.append("rect").attr("x", xScale(d.x)-rectWidth/2).attr("y", yScale(d.d1))
                                                                    .attr("width",rectWidth).attr("height", yScale(d.d4)- yScale(d.d1))
                                                                    .attr("fill",self.color);
                boxplot.append("line").attr("x1", xScale(d.x)-rectWidth/2).attr("y1", yScale(d.d2))
                                                                    .attr("x2",  xScale(d.x)+rectWidth/2 ).attr("y2", yScale(d.d2))
                                                                    .attr("stroke","black").attr("stroke-width","2");
                boxplot.append("line").attr("x1", xScale(d.x)-rectWidth/2).attr("y1", yScale(d.d3))
                                                                    .attr("x2",  xScale(d.x)+rectWidth/2 ).attr("y2", yScale(d.d3))
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
                d3.select(box).attr("transform","translate(0,"+barMaxHeight+")")
                .transition()
                .delay(i*transSitionTime/(boxs.length+1))
                .duration(transSitionTime/2)
                .ease("linear")
                .attr("transform","translate(0,+"+0+")");
            })
        }
        if(!this.measureDom){
            boxGroup.call(tFunction);
        }
        this.measureDom=boxGroup;
    },
    getY:function(point){
       return [point.d0,point.d1,point.d2,point.d3,point.d4];
    },  
    getAllY:function(){
              return this._d.map(function(v){ return [v.d0,v.d1,v.d2,v.d3,v.d4]}).reduce(function(v1,v2){return v1.concat(v2)});
    },
    isInSharp:function(svg,_sharp,ctx){
            _sharp = d3.select(_sharp); 
            var scales= ctx.get("scales");
            var xCoor=ctx.get("xcooridate");
            if (_sharp.style("visibility") ==="hidden") return false;
            var figure,_d,mouse,yScale,xScale,rectWidth;
            yScale = this.y2 ? scales("y2"):scales("y")
            xScale = xCoor;
            rectWidth = this.rectWidth;
            _d =_sharp.datum();
            mouse = d3.mouse(svg.node());
            return mouse[0]> xScale(_d.x) - rectWidth/2 && mouse[0] < xScale(_d.x) + rectWidth/2 && mouse[1]> yScale(_d.d0) && mouse[1] <yScale(_d.d4);

    },
    toHtml:function(ctx){
        var text="";
        var data =ctx.get("d");
        text += "<tr>";
            text += "<td class='tooltip-name' rowspan='6'><span style=' background-color:" + this.color + "'></span>" + this.name + "</td>";
            text+= "<td class='tooltip-value'>" +(this.d0Label || "Data 0") + "</td>";
            text += "<td class='tooltip-value'>" + data.d0 + "</td>";
            text += "</tr>";
            text += "<tr>";
           
            text+= "<td class='tooltip-value'>" + (this.d1Label || "Data 1")+ "</td>";
            text += "<td class='tooltip-value'>" + data.d1 + "</td>";
            text += "</tr>";
            text += "<tr>";
            
            text+= "<td class='tooltip-value'>" +(this.d2Label || "Data 2")+ "</td>";
            text += "<td class='tooltip-value'>" + data.d2 + "</td>";
            text += "</tr>";
            text += "<tr>";

            text+= "<td class='tooltip-value'>" + (this.d3Label || "Data 3" )+ "</td>";
            text += "<td class='tooltip-value'>" + data.d3 + "</td>";
            text += "</tr>";
            text += "<tr>";
  
            text+= "<td class='tooltip-value'>" + (this.d4Label|| "Data 4") + "</td>";
            text += "<td class='tooltip-value'>" + data.d4 + "</td>";
            text += "</tr>";

            text+= "<td class='tooltip-value'>" +(this.d5Label || "Data 5") + "</td>";
            text += "<td class='tooltip-value'>" + data.d5 + "</td>";
            text += "</tr>";
        return text;
    }
})
var commentFunction={
    on:function(key, callback,self){
        this.eventManager.on(key, callback,self);
        return this;
    },
    off:function(key, callback,self){
         this.eventManager.off(key, callback,self);
         return this;
    },
    setHeight:function(height){
        this.height=height;
        if(this.isInitDraw) this.reDraw();
        return this;       
    },
    setWidth:function(width){
        this.width=width;
        if(this.isInitDraw) this.reDraw();
        return this;
    }
}
CompareChart.mergeFunction(commentFunction);
RadarChart.mergeFunction(commentFunction);
window.SmartCompareChart=CompareChart;
window.SmartMeasure=Measure;
window.SmartRadarChart=RadarChart;
}();


