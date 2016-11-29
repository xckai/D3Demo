(function(){var root=this;
var previousChartManager=root.ChartManager;
var ChartManager={};
root.ChartManager=ChartManager;
ChartManager.createCompareChart = function (option) {
    return CompareChart.create(option)
};
ChartManager.createMeasure = function (option) {
    return new Measure(option);
}
ChartManager.createChartFromJSON = function (str) {
    var _ = JSON.parse(str, function (key, value) {    
        if (value && (typeof value === 'string') && value.indexOf("function") === 0) {        
            var jsFunc = new Function('return ' + value)();        
            return jsFunc;    
        }        
        return value;
    });
    if (_.type === "comparechart") {
        return CompareChart.create(_.config).addMeasures(_.measures);
    }
}
ChartManager.noConflict=function(){
    root.ChartManager=previousChartManager;
    return this;
}
var SmartChartBaseClass = {
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

var eventManager =  SmartChartBaseClass.extend({
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
var colorManager =  SmartChartBaseClass.extend({
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
    init: function(agrs) {
        this._colors=d3.scale.category10();
        // this._colors=function(i){
        //     var colorScale= ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
        //      return colorScale[i%colorScale.length];
        // }
        this._colorIndex = 0;
    },
    reset: function() {
        this._colorIndex = 0;
    },
    setColorPallet:function(agrs){
        if(Array.isArray(agrs)){
            this._colors=function(i){
                return agrs[i%agrs.length];
            }
        }else{
            switch (agrs){
                case "d3_20":
                     this._colors=d3.scale.category20();
                     break;
                default:
                     this._colors=d3.scale.category10();
            }
        }
        return this;
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
    return [].forEach.apply(this._vals,arguments);
   
}
Set.prototype.filter =function(){
   return [].filter.apply(this._vals,arguments);
}
Set.prototype.map =function(){
   return [].map.apply(this._vals,arguments);
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
Set.prototype.flush=function(){
     this._vals=[];
     return this;
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
var ChartToolTip=SmartChartBaseClass.extend({
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
    setPosition:function(x,y,screenWidth){
        var width =this.toolTip.node().offsetWidth;
        var height =this.toolTip.node().offsetHeight;
        screenWidth =screenWidth||document.body.clientWidth || 800;
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
                                    .classed("scrollBackground",true);
        var scroll=scrollContainer.append("path").attr("d",rectGen(-4,0,6,scrollbarlength,3,true,true,true,true))
                                    .classed("scrollContainer",true);
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
                                    .classed("scrollBackground",true);
        var scroll=scrollContainer.append("path").attr("d",rectGen(0,-4,scrollbarlength,6,3,true,true,true,true))
                                    .classed("scrollContainer",true);
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
    },
    getMeasures:function(){
        return this._measures.map(function(m){return m});
    },
    removeAllMeasures:function(){
        this._measures.flush();
        if(this.isInitDraw) this.reDraw();
        return this;
    }
}

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
var scrolls = Curry(Scroll);
var verticalScrolls=scrolls("vertical");
var Legend=SmartChartBaseClass.extend({
    init:function(options){
        this.eventManager =options.eventManager;
        this.textRectHeight=options.textRectHeight
        this.textRectWidth=options.textRectWidth 
    },
    draw:function(ctx,_measures){
        var svg=ctx.get("svg"),legendWidth=ctx.get("legendWidth")-10,self=this,legendHeight =ctx.get("legendHeight"),guid=ctx.get("guid");
        var displayModel=ctx.get("display")||"vertical",self=this;
        if(displayModel==="vertical"){
            this.textRectWidth=legendWidth-5;
        }else{
            this.textRectWidth=Math.min(legendWidth-5,this.textRectWidth);
        }
        var location=Curry(self.getLocation)(legendHeight,legendWidth,this.textRectHeight,this.textRectWidth,displayModel);
        var _a=svg.append("a").attr("xlink:href","javascript:void(0)").attr("name","legend")
        var legendGroup =_a.append("svg:g").classed("legendGroup",true);
        var i =-1;
        _a.on("keydown",function(){
            switch(event.code){
                case "ArrowDown":
               	     i=(i+1+_measures.vals().length)%_measures.vals().length;
                     legends.selectAll(".legend").each(function(_d,_i){
                            if(i===_i){
                                var evt = new MouseEvent("mouseover");
                                    d3.select(this).node().dispatchEvent(evt);
                            
                            }else{
                                var evt = new MouseEvent("mouseout");
                                    d3.select(this).node().dispatchEvent(evt);
                            }
                        })
                        event.preventDefault();
                        break;
                case "ArrowUp":
                     i=(i-1+_measures.vals().length)%_measures.vals().length;
                     legends.selectAll(".legend").each(function(_d,_i){
                            if(i===_i){
                                var evt = new MouseEvent("mouseover");
                                    d3.select(this).node().dispatchEvent(evt);
                            
                            }else{
                                var evt = new MouseEvent("mouseout");
                                    d3.select(this).node().dispatchEvent(evt);
                            }
                        })
                        event.preventDefault();  
                        break;
                case "Enter":
                      legends.selectAll(".legend").each(function(_d,_i){
                            if(i===_i){
                                var evt = new MouseEvent("click");
                                    d3.select(this).node().dispatchEvent(evt);
                            
                            }
                        })
                       event.preventDefault();
                       break;
            }
        })
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
        var scrollContainer=svg.append("g").attr("transform","translate("+(legendWidth-5)+",0)");
        verticalScrolls(legendHeight,legendWidth,self.getAccHeight(displayModel,legendWidth,self.textRectWidth,_measures.vals().length),0,svg,scrollContainer,legends);
        legends.selectAll(".legend").each(function(d,i){
            var g=d3.select(this);
            g.append("svg:rect").attr("height", self.textRectHeight)
                                    .attr("width", self.textRectWidth)
                                    .attr("y", location(i).y )
                                    .attr("x", location(i).x)
                                    .attr("fill", "transparent");
            if(d.config_legendIcon==="rect"){
                  g.append("svg:rect").attr("x",location(i).x)
                                        .attr("y",location(i).y+(self.textRectHeight-16)/2)
                                        .attr("width",16)
                                        .attr("height",16)
                                        .attr("fill",d.style_color);
            }else{
                g.append("svg:circle").attr("cx",location(i).x+8)
                                    .attr("cy", location(i).y+(self.textRectHeight)/2)
                                    .attr("r",8)
                                    .attr("fill", d.style_color );
            }
            g.append("svg:foreignObject").attr("x",location(i).x+ 20)
                                             .attr("y",location(i).y)
                                             .attr("height", self.textRectHeight)
                                             .attr("width", self.textRectWidth-15)
                                             .classed("legend-textarea",true)
                                             .append("xhtml:p")
                                             .attr("title",d.name)
                                             .style("line-height",self.textRectHeight+"px")
                                             .style("overflow","hidden")
                                             .style("text-overflow","ellipsis")
                                             .text(d.name);
  
            // g.append("textArea").attr("x", 20)
            //                                  .attr("y",(i * self.textRectHeight) + (self.textRectHeight)/2)
            //                                  .attr("height", self.textRectHeight)
            //                                  .attr("width", self.textRectWidth)
            //                                  .text(d.name)

                                            //   <p xmlns="http://www.w3.org/1999/xhtml">Text goes here</p>
            // g.append("svg:text").attr("x", 20)
            //                         .attr("y",(i * self.textRectHeight) + (self.textRectHeight)/2)
            //                         .text(d.name)
            //                         .attr("dominant-baseline", "middle");
            d.legendDom=g;
            g.on("mouseover", function(d) {
                d3.select(this).classed("legendmouseover",true);
                self.eventManager.call("legendmouseover", d);
            })
            .on("mouseout", function(d) {
                d3.select(this).classed("legendmouseover",false);
                self.eventManager.call( "legendmouseout", d);
               
            });
            g.on("click", function() {
            if (d.isSelected) {
                d.isSelected = false;
                self.eventManager.call("measuredeselect", [d]);
            } else {
                d.isSelected = true;
                self.eventManager.call("measureselect", [d]);
            }
            event.stopPropagation();
        });
        })                                                   
    },
    getLocation:function(h,w,th,tw,display,i){
        if(display==="vertical"){
            return {x:0,y:i*th}
        }else{
            var column=Math.floor(w/tw);
            var offSet=(w-tw*column)/2;
            return {x:(i%column)*tw+offSet,y:(Math.floor(i/column)*th)}
        }
    },
    getAccHeight:function(display,w,tw,acc){
        if(display==="vertical"){
            return acc*this.textRectHeight;
        }else{
            var column=Math.floor(w/tw);
            var rows=Math.ceil(acc/column);
            return rows*this.textRectHeight;
        }
    }
})
var defaultStyle = {
    linewidth: 2,
    circleradius: 3,
    rectwidth: 16
}
var CompareChart = SmartChartBaseClass.extend({
    mapkey: ["x", "y"],
    init: function (config) {
        var self = this;
        this.isInitDraw = false;
        //////////////////////add value format for localization
        this._yValueFormat = function (v) {
            var max = this.getMaxData("y"),
                min = this.getMinData("y");
            var span = (max - min) / 10;
            if (isNaN(v)) {
                return this.yValueFormat ? this.yValueFormat(v) : v;
            } else {
                var self = this;
                var _v;
                if (span > 9) {
                    _v = Number(v).toFixed();

                } else if (1 <= span && span <= 9) {
                    _v = Number(v).toFixed(1);
                } else {
                    var num = Math.abs(span),
                        i, counter = 2;
                    for (i = 0; i < num.toString().length; ++i) {
                        if (num.toString()[0] === 0) {
                            ++counter;
                        } else {
                            break;
                        }
                    }
                    _v = Number(v).toFixed(counter);
                }
                return self.yValueFormat ? self.yValueFormat(_v) : _v;
            }
        }
        this._y2ValueFormat = function (v) {
            var max = this.getMaxData("y2"),
                min = this.getMinData("y2");
            var span = (max - min) / 10;
            if (isNaN(v)) {
                return this.y2ValueFormat ? this.y2ValueFormat(v) : v;
            } else {
                var self = this;
                var _v;
                if (span > 9) {
                    _v = Number(v).toFixed();

                } else if (1 <= span && span <= 9) {
                    _v = Number(v).toFixed(1);
                } else {
                    var num = Math.abs(span),
                        i, counter = 2;
                    for (i = 0; i < num.toString().length; ++i) {
                        if (num.toString()[0] === 0) {
                            ++counter;
                        } else {
                            break;
                        }
                    }
                    _v = Number(v).toFixed(counter);
                }
                return self.y2ValueFormat ? self.y2ValueFormat(_v) : _v;
            }
        }

        this.eventManager = eventManager.create();
        this.colorManager = colorManager.create();
        this.legendOption = {
            eventManager: this.eventManager,
            textRectHeight: 32,
            textRectWidth: 250
        };
        this.legend = Legend.create(this.legendOption);
        this.toolTip = ChartToolTip.create();
        this._measures = new Set(function (v1, v2) {
            return String(v1.id) === String(v2.id)
        });
        this.memory = new Memory();
        this.translate = [0, 0];
        this._zoomScale = 1;
        this.registerEvent();
        this.isInitDraw = false;
        this.isDrawed = false;
        this.noAxisTicket = false;
        this.noAxisTitle = false;
        this.handleEvent = true;
        this.setConfig(config);
    },
    setConfig: function (config, val) {
        if (config === undefined || config === null) return this;
        if (typeof config === "object") {
            var self = this;
            this.setOption(config);
            this.showToolTip = config.showToolTip === false ? false : true;
            this.showLegend = config.showLegend === false ? false : true;
            this.yLabel = this.yLabel || this.yTitle;
            this.y2Label = this.y2Label || this.y2Title;
        } else {
            this[config] = val;
        }
        this.colorPallet ? this.colorManager.setColorPallet(this.colorPallet) : null;
        this.reDraw();
        return this;
    },
    registerEvent: function () {
        var self = this;
        this.eventManager.on("measureselect", this.setSelectStyle, this)
        this.eventManager.on("measuredeselect", this.setSelectStyle, this)
        this.eventManager.on("xtitleclick", function () {
            console.log("xtitleclick")
        }, this)
        this.eventManager.on("ytitleclick", function () {
            this._measures.forEach(function (d) {
                if (!d.y2) {
                    d.isSelected = true;
                } else {
                    d.isSelected = false;
                }
            })
            this.setSelectStyle();
            console.log("ytitleclick")
        }, this)
        this.eventManager.on("y2titleclick", function () {
            this._measures.forEach(function (d) {
                if (d.y2) {
                    d.isSelected = true;
                } else {
                    d.isSelected = false;
                }
            })
            this.setSelectStyle();
            console.log("y2titleclick")
        }, this)
    },
    appendTo: function (id) {
        this.appendId = id;
        this.reDraw();
        return this;
    },
    calculateMargin: function () {
        var padding = this.padding = 5 * 2;
        if (!this.legendDisplayModel) {
            this.legendDisplay = "horizontal";
        } else {
            this.legendDisplay = this.legendDisplayModel;
        }
        if (this.title) {
            this._titleHeight = 50;
        } else {
            this._titleHeight = 10;
        }

        this._drawAreaWidth = this.width - padding;
        this._drawAreaHeight = this.height;
        if (this.showLegend) {
            //this._drawAreaWidth = Math.floor(this.width * 0.8);
            if (this.legendDisplay === "horizontal") {
                var column = Math.floor((this.width - 10) / this.legendOption.textRectWidth);
                var rows = Math.ceil(this._measures.vals().length / column);
                this._legendHeight = Math.min(Math.max(Math.floor(this.height * 0.15), this.legendOption.textRectHeight), rows * this.legendOption.textRectHeight + 1);
                this._drawAreaHeight = this.height - this._titleHeight - this._legendHeight;
                this._legendWidth = this.width
            } else {

                this._legendHeight = this.height - this._titleHeight;
                this._drawAreaHeight = this.height - this._titleHeight;
                this._legendWidth = Math.max(Math.floor(this.width * 0.2), this.legendOption.textRectWidth);
                this._drawAreaWidth = this.width - this._legendWidth - padding;
            }

        } else {
            this._drawAreaWidth = this.width;
        }
        if (this.hasY1()) {
            // has y1  
            this._yAxisWidth = this.noAxisTicket ? 1 : this.getYAxisWidth("y");
            this._yTitleWidth = this.noAxisTitle ? 1 : 40;
        } else {
            this._yAxisWidth = 0;
            this._yTitleWidth = 0;
        }
        if (this.hasY2()) {
            //y2
            this._y2AxisWidth = this.noAxisTicket ? 1 : this.getYAxisWidth("y2");
            this._y2TitleWidth = this.noAxisTitle ? 1 : 40;
        } else {
            this._y2AxisWidth = 0;
            this._y2TitleWidth = 0;
        }
        this._xTitleHeight = this.noAxisTitle ? 1 : 20;
        this._xAxisHeight = this.noAxisTicket ? 1 : this.getXAxisHeight();
        this._figureHeight = this._drawAreaHeight - this._xTitleHeight - this._xAxisHeight;
        this._figureWidth = this._drawAreaWidth - this._y2AxisWidth - this._y2TitleWidth - this._yAxisWidth - this._yTitleWidth;
        return this;
    },
    validateConfig: function () {
        if (this.appendId === undefined || this.appendId === null) {
            console.error("please assign chart container ID");
            return false;
        }
        if (this._drawAreaHeight * this._drawAreaWidth < 0 || this._figureHeight * this._figureWidth < 0) {
            console.error("Wrong chart height and width");
            return false;
        }
        return true;
    },
    addMeasures: function (ms) {
        var _flag = this.isDrawed;
        this.isDrawed = false;
        ms.forEach(this.addMeasure.bind(this));
        this.isDrawed = _flag;
        if (this.isDrawed) this.reDraw();
        return this;

    },
    addMeasure: function (_measure) {
        var measureObj;
        switch (_measure.type) {
            case "line":
                measureObj = Line.create(_measure);
                // this.attachMeasure(measureObj)
                break;
            case "bar":
                measureObj = Bar.create(_measure);
                //this.attachMeasure(measureObj);
                break;
            case "boxplot":
                measureObj = BoxPlot.create(_measure);
                //this.attachMeasure(measureObj);
                break;
            case "area":
                measureObj = Area.create(_measure);
                //this.attachMeasure(measureObj);
                break;
            case "range":
                measureObj = RangeChart.create(_measure);
                //this.attachMeasure(measureObj);
                break;

            default:
                console.error("Error figure type !");
                return false;
        }
        this._measures.add(this.preHandleMeasure(measureObj));
        if (this.isDrawed) this.reDraw();
        return true;
    },
    removeMeasureById: function (id) {
        this._measures.del({
            id: id
        });
        if (this.isInitDraw) this.reDraw();
        return this;
    },
    removeMeasure: function (mesure) {
        this._measures.del(mesure);
        if (this.isInitDraw) this.reDraw();
        return this;
    },
    preHandleMeasure: function (obj) {
        var self = this;
        obj.style_color = obj.style_color || this.colorManager.getColor();
        obj.eventManager = this.eventManager;
        obj.$chart = this;
        obj._d.forEach(function (d) {
            if (self.xType === "time") {
                if (typeof d.x !== "time") d.x = new Date(d.x);
            }
            if (self.xType === "number") {
                d.x = Number(d.x);
            }
            if (self.xType === "string") {
                d.x = d.x.toString();
            }
        });
        obj._d.sort(function (v1, v2) {
            return v1.x - v2.x;
        });
        return obj;
    },
    validateMeasure: function (measure) {

    },
    initDraw: function () {
        if (this.isInitDraw) return this;
        if (this.validateConfig()) {
            var padding = this.padding;
            var self = this;
            this.svgContainer = d3.select("#" + this.appendId).append("div").classed("CompareChart", true)
                .style("width", this.width + "px")
                .style("height", this.height + "px")
                .style("position", "relative")
                .classed("notextselect", true);
            this.svg = this.svgContainer.append("svg").classed("CompareChart-svg", true)
                .attr("width", this.width)
                .attr("height", this.height);
            this.svg.append("defs").append("clipPath")
                .attr("id", this.appendId + "clip")
                .append("rect")
                .attr("width", this._figureWidth)
                .attr("height", this._figureHeight);
            this.svg.title = this.svg.append('svg:g').classed("CompareChart-title-Container", true)
                .attr("transform", "translate(" + (this.width / 2) + ",5)");
            this.svg.drawArea = this.svg.append("svg:g").classed("CompareChart-drawArea", true)
                .attr("transform", "translate(" + padding / 2 + "," + this._titleHeight + ")");
            var _a = this.svg.drawArea.append("a").attr("xlink:href", "javascript:void(0)").attr("name", "legend");
            this.keyboardHandle(_a);
            this.svg.drawArea.figureArea = _a.append("svg:g").classed("CompareChart-figure", true)
                .attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth) + ",0)")
                .attr("clip-path", "url(#" + this.appendId + "clip)");
            this.svg.drawArea.figureRect = this.svg.drawArea.figureArea
                .append("svg:rect")
                .attr("width", this._figureWidth)
                .attr("height", this._figureHeight)
                .attr("fill-opacity", 0);
            if (this.showLegend) {
                if (this.legendDisplay === "horizontal") {
                    this.svg.legend = this.svg.append("g").attr("transform", "translate(0," + (this._drawAreaHeight + this._titleHeight) + ")").classed("CompareChart-Legend-Container", true);
                } else {
                    this.svg.legend = this.svg.append("g").attr("transform", "translate(" + (this._drawAreaWidth + 10) + "," + this._titleHeight + ")").classed("CompareChart-Legend-Container", true);

                }
            }
            if (this.showToolTip) {
                this.svg.toolTip = this.toolTip.initDraw(this.svgContainer);
            }
            //this.drawEventZone(this.svg.drawArea);

            this.zoom = d3.behavior.zoom()
                .x(self.getScale("x"))
                .scaleExtent([0.8, 8])
                .on("zoom", self.zoomFunction.bind(self), false);
            if (this.handleEvent) {
                this.svg.drawArea.call(this.zoom).on("dblclick.zoom", null, false);
            }

            this.svg.drawArea.figureArea.on("click", self.getLinePosition.bind(this), false);
            this.isInitDraw = true;
        }
        return this;
    },
    dataMouseOver: function (obj) {
        this.svg.selectAll(".datamousehover").classed("datamousehover", false);
        obj ? obj.classed("datamousehover", true) : null;
    },
    keyboardHandle: function (_a) {
        var i = -1,
            self = this;
        _a.on("keydown", function () {
            console.log(self._measures.vals().map(function (m) {
                return m.getObjForAccessiability();
            }).reduce(function (v1, v2) {
                return v1.concat(v2);
            }))
            var objs = self._measures.vals().map(function (m) {
                return m.getObjForAccessiability();
            }).reduce(function (v1, v2) {
                return v1.concat(v2);
            })
            switch (event.code) {
                case "ArrowLeft":
                    i = (i - 1 + objs.length) % objs.length;
                    var _ = d3.select(objs[i]);
                    self.toolTip.setVisiable(false);
                    _.call(self.dataMouseOver.bind(self));
                    console.log(_);
                    var position = _.datum()._figureObj.getRelativePoint(_)
                    self.toolTip.setPosition(+position[0] + self._yTitleWidth + self._yAxisWidth, +position[1] + self._titleHeight);
                    //self.toolTip.setPosition(event.pageX , event.pageY);
                    self.toolTip.setContent(self.getToolTipContent([_.datum()]));
                    self.removeGuideLine();
                    self.drawGuideLine(_.datum())
                    self.toolTip.setVisiable(true);
                    break;
                case "ArrowRight":
                    i = (i + 1 + objs.length) % objs.length;
                    var _ = d3.select(objs[i]);
                    _.call(self.dataMouseOver.bind(self));
                    self.toolTip.setVisiable(false);
                    var position = _.datum()._figureObj.getRelativePoint(_)
                    self.toolTip.setPosition(+position[0] + self._yTitleWidth + self._yAxisWidth, +position[1] + self._titleHeight);
                    //self.toolTip.setPosition(event.pageX , event.pageY);
                    self.toolTip.setContent(self.getToolTipContent([_.datum()]));
                    self.removeGuideLine();
                    self.drawGuideLine(_.datum())
                    self.toolTip.setVisiable(true);
                    break;
            }
        })

    },
    draw: function () {
        this.drawTitle().drawBackground().drawAxis().drawYTicketLine().drawMeasure().drawLegend().drawEventZone();
        return this;
    },
    drawAxis: function () {
        var self = this;
        var xtickNum = Math.floor(this._figureWidth / 70);
        if (this._xAxis) this._xAxis.remove();
        if (this.xType === "string") {
            var ticksValues = [],
                Set = self.getXset();
            for (var i = 0; i < Set.length; ++i) ticksValues.push(i);
            this._xAxis = this.svg.drawArea.append("svg:g")
                .attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth) + "," + (this._drawAreaHeight - this._xTitleHeight - this._xAxisHeight) + ")")
                .attr("class", "CompareChart-xaxis")
                .attr("class", "CompareChart-axis")
                .call(d3.svg.axis().scale(this.getScale("x")).orient("bottom").tickFormat(function (v) {
                    if (Math.floor(v) !== Math.ceil(v)) return;
                    if (v > -1 && v < Set.length) {
                        if (this.xValueFormat) {
                            return this.xValueFormat(Set[v]);
                        }
                        return Set[v];
                    }

                }).ticks(xtickNum));
            //tickValues(d3.range(Set.length)));
        } else {
            this._xAxis = this.svg.drawArea.append("svg:g")
                .attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth) + "," + (this._drawAreaHeight - this._xTitleHeight - this._xAxisHeight) + ")")
                .attr("class", "CompareChart-xaxis")
                .attr("class", "CompareChart-axis")
                .call(d3.svg.axis().scale(this.getScale("x")).orient("bottom").tickFormat(this.xValueFormat.bind(this)).ticks([xtickNum]));
        }

        /////draw y1
        if (this.hasY1()) {
            if (this._yAxis) this._yAxis.remove();
            this._yAxis = this.svg.drawArea.append("svg:g")
                .attr("class", "CompareChart-yaxis")
                .attr("class", "CompareChart-axis")
                .attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth) + ",0)")
                .call(d3.svg.axis().scale(this.getScale("y")).orient("left").tickFormat(this._yValueFormat.bind(this)));
        }

        /// draw y2
        if (this.hasY2()) {
            if (this._y2Axis) this._y2Axis.remove();
            this._y2Axis = this.svg.drawArea.append("svg:g")
                .attr("class", "CompareChart-y2axis")
                .attr("class", "CompareChart-axis")
                .attr("transform", "translate(" + (this._figureWidth + this._yTitleWidth + this._yAxisWidth) + ",0)")
                .call(d3.svg.axis().scale(this.getScale("y2")).orient("right").tickFormat(this._y2ValueFormat.bind(this)));
        }
        if (this._xAxisHeight > 25) {
            this._xAxis.selectAll("text").style("text-anchor", "end")
                .attr("dx", "-4")
                .attr("dy", "8")
                .attr("transform", function (d) {
                    return "rotate(-45)"
                });
        }


        return this;
    },
    drawYTicketLine: function (isClear) {
        var self = this;
        if (isClear) {
            if (this._ticketLine) {
                this._ticketLine.remove();
            }
        } else {
            if (this._ticketLine) {
                this._ticketLine.remove();
            }
            if (this.hasY1() || this.hasY2()) {

                if (this.hasY1()) {
                    this._ticketLine = this._yAxis.selectAll("g")
                        .append("line").attr("x2", self._figureWidth).attr("x1", 0).attr("y1", 0).attr("y2", 0).classed("CompareChart-ytickline", true)

                } else if (this.hasY2()) {
                    this._ticketLine = this._y2Axis.selectAll("g")
                        .append("line").attr("x2", -self._figureWidth).attr("x1", 0).attr("y1", 0).attr("y2", 0).classed("CompareChart-ytickline", true);
                }
            }
        }
        return this;
    },
    getXAxisHeight: function () {
        return this.memory.cache("xAsisHeight", function () {
            if (this._measures.vals().length === 0) return 5;
            var length = 0,
                self = this;
            this._measures.forEach(function (f) {
                f._d.forEach(function (d) {
                    if (self.xValueFormat) {
                        length = Math.max(length, self.xValueFormat(d.x).toString().length);
                    } else {
                        length = Math.max(length, d.x.toString().length);
                    }
                })
            })

            if (length > 6)
                return length * 8 / Math.min(1, self._zoomScale);
            else {
                return 25 / Math.min(1, self._zoomScale);
            }
        }, this);

    },
    getYAxisWidth: function (y) {
        if (y === "y2") {
            return this.memory.cache("y2AxisWidth", function () {
                var length = 0,
                    self = this;
                this._measures.vals().filter(function (f) {
                    return f.y2
                }).forEach(function (f) {
                    f.getAllY().filter(function (d) {
                        return !isNaN(d)
                    }).forEach(function (d) {
                        if (self._y2ValueFormat) {
                            length = Math.max(length, self._y2ValueFormat(d).toString().length);
                        } else {
                            length = Math.max(length, d.toString().length);
                        }
                    })
                })
                return length * 7;
            }, this)
        } else {
            return this.memory.cache("yAxisWidth", function () {
                var length = 0,
                    self = this;
                this._measures.vals().filter(function (f) {
                    return !f.y2
                }).forEach(function (f) {
                    f.getAllY().filter(function (d) {
                        return !isNaN(d)
                    }).forEach(function (d) {
                        if (self._yValueFormat) {
                            length = Math.max(length, self._yValueFormat(d).toString().length);
                        } else {
                            length = Math.max(length, d.toString().length);
                        }
                    })
                })
                return length * 7;
            }, this)
        }
    },
    drawBackground: function () {
        var svg = this.svg.drawArea.figureArea.append("g"),
            self = this;
        if (this.xType === "string" || !this.customBackground) {
            return this;
        }
        this.customBackground.forEach(function (d) {
            if (self.xType === "time") {
                d.from = new Date(d.from);
                d.to = new Date(d.to);
            }
            if (self.xType === "number") {
                d.from = +d.from;
                d.to = +d.to;
            }
            svg.append("rect").attr("x", self.getScale("x")(d.from))
                .attr("y", 0)
                .attr("height", self._figureHeight)
                .attr("width", self.getScale("x")(d.to) - self.getScale("x")(d.from))
                .attr("fill", d.color)
                .attr("pointer-events", "none");
        })
        return this;
    },
    drawTitle: function () {
        var self = this;
        this.svg.title.selectAll("text").remove();
        this.svg.title.append("text").text(this.title).attr("text-anchor", "middle")
            .attr("dominant-baseline", "text-before-edge");
        if (this.hasY1() && !this.noAxisTitle) {
            var _titleRect = this.svg.drawArea.append("rect")
                .attr("x", 0)
                .attr("height", this._figureHeight).attr("width", this._yTitleWidth)
                .attr("fill-opacity", "0")
                .on("click", function () {
                    self.eventManager.call("ytitleclick")
                });
            switch (this.yTitle_location) {
                case "start":
                    this.svg.drawArea.append("g").attr("transform", "translate(1, 0)")
                        .classed("CompareChart-yTitleBar", true)
                        .classed("CompareChart-TitleBar", true)
                        .attr("text-anchor", "end")
                        .append("text").text(this.yTitle_value)
                        .attr("transform", "rotate(-90)")
                        .attr("dominant-baseline", "text-before-edge")
                        .attr("pointer-events", "none");
                    break;
                case "middle":
                    this.svg.drawArea.append("g").attr("transform", "translate(1," + (this._figureHeight / 2) + ")")
                        .classed("CompareChart-yTitleBar", true)
                        .classed("CompareChart-TitleBar", true)
                        .attr("text-anchor", "middle")
                        .append("text").text(this.yTitle_value)
                        .attr("transform", "rotate(-90)")
                        .attr("dominant-baseline", "text-before-edge")
                        .attr("pointer-events", "none");
                    break;
                case "end":
                    this.svg.drawArea.append("g").attr("transform", "translate(1," + (this._figureHeight) + ")")
                        .classed("CompareChart-yTitleBar", true)
                        .classed("CompareChart-TitleBar", true)
                        .attr("text-anchor", "start")
                        .append("text").text(this.yTitle_value)
                        .attr("transform", "rotate(-90)")
                        .attr("dominant-baseline", "text-before-edge")
                        .attr("pointer-events", "none");
                    break;
            }
        }
        if (this.hasY2() && !this.noAxisTitle) {
            var _titleRect = this.svg.drawArea.append("rect")
                .attr("x", this._figureWidth + this._yTitleWidth + this._yAxisWidth + this._y2AxisWidth)
                .attr("height", this._figureHeight).attr("width", this._y2TitleWidth)
                .attr("fill-opacity", "0")
                .on("click", function () {
                    self.eventManager.call("y2titleclick")
                });
            switch (this.y2Title_location) {
                case "start":
                    this.svg.drawArea.append("g").attr("transform", "translate(" + (this._figureWidth + this._yTitleWidth + this._yAxisWidth + this._y2AxisWidth + this._y2TitleWidth) + ",0)")
                        .classed("CompareChart-y2TitleBar", true).attr("text-anchor", "end")
                        .classed("CompareChart-TitleBar", true)
                        .append("text").text(this.y2Title_value)
                        .attr("transform", "rotate(-90)")
                        .attr("dominant-baseline", "text-after-edge")
                        .attr("pointer-events", "none");
                    break;
                case "middle":
                    this.svg.drawArea.append("g").attr("transform", "translate(" + (this._figureWidth + this._yTitleWidth + this._yAxisWidth + this._y2AxisWidth + this._y2TitleWidth) + "," + (this._figureHeight / 2) + ")")
                        .classed("CompareChart-y2TitleBar", true).attr("text-anchor", "middle")
                        .classed("CompareChart-TitleBar", true)
                        .append("text").text(this.y2Title_value)
                        .attr("transform", "rotate(-90)")
                        .attr("dominant-baseline", "text-after-edge")
                        .attr("pointer-events", "none");
                    break;
                case "end":
                    this.svg.drawArea.append("g").attr("transform", "translate(" + (this._figureWidth + this._yTitleWidth + this._yAxisWidth + this._y2AxisWidth + this._y2TitleWidth) + "," + (this._figureHeight) + ")")
                        .classed("CompareChart-y2TitleBar", true).attr("text-anchor", "start")
                        .classed("CompareChart-TitleBar", true)
                        .append("text").text(this.y2Title_value)
                        .attr("transform", "rotate(-90)")
                        .attr("dominant-baseline", "text-after-edge")
                        .attr("pointer-events", "none");
                    break;
            }
        }
        ////////////////////////x title
        var _titleRect = this.svg.drawArea.append("rect")
            .attr("x", this._yTitleWidth + this._yAxisWidth)
            .attr("y", this._drawAreaHeight - this._xTitleHeight)
            .attr("height", this._xTitleHeight).attr("width", this._figureWidth)
            .attr("fill-opacity", "0")
            .on("click", function () {
                self.eventManager.call("xtitleclick")
            });
        if (!this.noAxisTitle) {
            switch (this.xTitle_location) {

                case "start":
                    this.svg.drawArea.append("g").attr("transform", "translate(" + (0) + "," + (this._drawAreaHeight - this._xTitleHeight) + ")")
                        .classed("CompareChart-xTitleBar", true).attr("text-anchor", "start")
                        .classed("CompareChart-TitleBar", true)
                        .append("text")
                        .text(this.xTitle_value)
                        .attr("dominant-baseline", "text-before-edge")
                        .attr("pointer-events", "none");
                    break;
                case "middle":
                    this.svg.drawArea.append("g").attr("transform", "translate(" + (this._drawAreaWidth / 2) + "," + (this._drawAreaHeight - this._xTitleHeight) + ")")
                        .classed("CompareChart-xTitleBar", true).attr("text-anchor", "middle")
                        .classed("CompareChart-TitleBar", true)
                        .append("text")
                        .text(this.xTitle_value)
                        .attr("dominant-baseline", "text-before-edge")
                        .attr("pointer-events", "none");
                    break;
                case "end":
                    this.svg.drawArea.append("g").attr("transform", "translate(" + (this._drawAreaWidth - this._y2TitleWidth - this._y2AxisWidth) + "," + (this._drawAreaHeight - this._xTitleHeight) + ")")
                        .classed("CompareChart-xTitleBar", true).attr("text-anchor", "end")
                        .classed("CompareChart-TitleBar", true)
                        .append("text")
                        .text(this.xTitle_value)
                        .attr("dominant-baseline", "text-before-edge")
                        .attr("pointer-events", "none");
                    break;
            }
        }
        return this;
    },
    drawLegend: function () {
        if (this.showLegend) {
            var ctx = new context();
            ctx.add("svg", this.svg.legend).add("legendWidth", this._legendWidth)
                .add("guid", this.appendId)
                .add("legendHeight", this._legendHeight)
                .add("display", "horizontal");
            this.legend.draw(ctx, this._measures);
        }
        return this;
    },
    drawMeasure: function () {
        var ctx = new context();
        var self = this;
        ctx.add("svg", this.svg.drawArea.figureArea)
            .add("figureHeight", this._figureHeight)
            .add("scales", this.getScale.bind(this))
            .add("xsetIndex", this.getXsetIndex.bind(this))
            .add("xcooridate", this.getXCoordinate());
        ctx.add("bars", this._measures.vals().filter(function (v) {
                return v.type === "bar"
            }))
            .add("xset", this.getXset.bind(this))
            .add("barMaxHeight", this._figureHeight)
            .add("zoomScale", this._zoomScale || 1);
        this._measures.forEach(function (f) {
            if (f.type === "area" && self.xType !== "string") {
                f.draw(ctx);
            }
        })
        this._measures.forEach(function (f) {
            if (f.type === "range" && self.xType !== "string") {
                f.draw(ctx);
            }
        })
        this._measures.forEach(function (f) {
            if (f.type === "bar") {
                f.draw(ctx);
            }
        })
        this._measures.forEach(function (f) {
            if (f.type === "boxplot") {
                f.draw(ctx);
            }
        })
        this._measures.forEach(function (f) {
            if (f.type === "line" && self.xType !== "string") {
                f.draw(ctx);
            }
        })
        return this;
    },
    drawEventZone: function () {
        this.svg.drawArea.figureArea.selectAll("CompareChart-Event-Zone").remove();
        var self = this;
        var set = this.getXset();
        if (!set) return;
        var minSpan = this._figureWidth;
        for (var i = 0; i < set.length - 1; ++i) {
            minSpan = Math.min(self.getXCoordinate()(set[i + 1]) - self.getXCoordinate()(set[i]), minSpan);
        }
        minSpan = Math.floor(minSpan);
        this.svg.eventZones = this.svg.drawArea.figureArea.append("svg:g").classed("CompareChart-Event-Zone", true);
        this.svg.eventZones.selectAll("rect").data(set)
            .enter()
            .append("rect")
            .attr("x", function (d, i) {
                return self.getXCoordinate()(d) - minSpan / 2
            })
            .attr("y", 0)
            .attr("width", minSpan)
            .attr("height", self._figureHeight)
            .attr("class", function (d, i) {
                return "event-zone-" + i
            })
            .attr("rect-index", function (d, i) {
                return i
            })
            .attr("fill-opacity", "0");
        if (this.handleEvent) {
            this.svg.eventZones.selectAll("rect")
                .on("click", this.eventZoneMouseEvent.bind(this))
                .on("mousemove", this.eventZoneMouseEvent.bind(this))
                .on("mouseout", this.eventZoneMousout.bind(this));
        }

        return this;
    },
    eventZoneMousout: function () {
        if (this.showToolTip) this.toolTip.setVisiable(false);
        this.removeGuideLine();
        this.dataMouseOver();
    },
    eventZoneMouseEvent: function (d, i) {
        var self = this;
        var ctx = new context();
        if (this.showToolTip) this.toolTip.setVisiable(false);
        this.removeGuideLine();
        this.dataMouseOver();
        ctx.add("scales", this.getScale.bind(this));
        ctx.add("xcooridate", this.getXCoordinate());
        if (this.showToolTip) {
            var sharps = this.svg.selectAll(".event-comparechart-" + i);
            var chartFigrues = [];
            this.toolTip.setVisiable(false);
            sharps.filter(function (d) {
                //only show selected item
                var isAllSelect = true,
                    hasSelect = false;
                self._measures.forEach(function (f) {
                    if (f.isSelected) {
                        hasSelect = true
                    } else {
                        isAllSelect = false
                    }
                })
                if (isAllSelect) {
                    self._measures.forEach(function (f) {
                        f.isSelected = false;
                    })
                    hasSelect = false;
                }
                return (!hasSelect || d._figureObj.isSelected);
            }).filter(function (d) {
                //show insharp item
                return d._figureObj.isInSharp(self.svg.drawArea.figureArea, this, ctx);
            }).each(function (d) {
                chartFigrues.push(d);
                self.drawGuideLine(d);
                d3.select(this).call(self.dataMouseOver.bind(self));
            });
            if (chartFigrues.length > 0) {
                var position = d3.mouse(this.svg.node());
                this.toolTip.setPosition(position[0], position[1], this._drawAreaWidth);
                //this.toolTip.setPosition(event.pageX , event.pageY);
                this.toolTip.setContent(this.getToolTipContent(chartFigrues));
                this.toolTip.setVisiable(true);
                switch (d3.event.type) {
                    case "click":
                        self.eventManager.call("dataclick", chartFigrues);
                        break;
                    case "mousemove":
                        self.eventManager.call("datamouseover", chartFigrues);
                        break;
                    default:
                        break;
                }
            }
        }
    },
    getToolTipContent: function (chartFigrues) {
        var datas = chartFigrues.map(function (c, i) {
            var d = {};
            d.name = c._figureObj.name;
            d.id = c._figureObj.id;
            d.type = c._figureObj.type;
            d.data = c;
            d.color = c._figureObj.style.color;
            d.Measure = c._figureObj;
            return d;
        });

        var defaultTooltipGen = function (datas) {
            var text = "",
                self = this;
            var title = this.xValueFormat ? this.xValueFormat(datas[0].data.x) : datas[0].data.x;
            text = "<table class='tool-tip-table' ><tbody><tr><th class = 'tooltip-title' colspan='3'>" + title + "</th></tr>";
            datas.forEach(function (d) {
                var ctx = new context();
                ctx.add("d", d.data);
                text += d.Measure.toHtml(ctx);
            });
            return text += "</tbody><table>";
        }
        if (this.customToolTipGen) {
            return this.customToolTipGen(datas);
        } else {
            return defaultTooltipGen.bind(this)(datas);
        }
    },
    getXset: function () {
        return this.memory.cache("xset", function () {
            var self = this;
            self._xSet = new Set(function (v1, v2) {
                if (self.xType === "time" || self.xType === "number") {
                    return v1 - v2 === 0;
                } else {
                    return v1 === v2;
                }
            });
            this._measures.forEach(function (ds) {
                ds._d.forEach(function (d) {
                    self._xSet.add(d.x);
                })
            })
            self._xSet.sort(function (v1, v2) {
                return v1 - v2;
            })
            return self._xSet.vals();
        }, this);
    },
    getXsetIndex: function (x) {
        for (var i = 0; i < this.getXset().length; ++i) {
            if (this.xType === "time" || this.xType === "number") {
                if (this.getXset()[i] - x === 0)
                    return i;

            }
            if (this.xType === "string") {
                if (this.getXset()[i] === x) {
                    return i;
                }
            }

        }
        return -1;
    },
    hasY1: function () {
        return this.memory.cache("hasy1", function () {
            var find = false;
            this._measures.forEach(function (d) {
                find = !d.y2 || find;
            })
            return find;
        }, this);
    },
    hasY2: function () {
        return this.memory.cache("hasy2", function () {
            var find = false;
            this._measures.forEach(function (d) {
                find = d.y2 || find;
            })
            return find;
        }, this);
    },
    rendering: function () {
        var self = this;
        self.isDrawed = true;
        if (self._measures.vals().length === 0) {
            self.drawHint(self.emptyHint || "Please Add Item");
            self.colorManager.reset();
            return;
        }
        if (self.hintDiv) {
            self.hintDiv.remove();
            self.hintDiv = null;
        }
        if (self.isInitDraw) {
            self.reDraw();
        } else {
            self.calculateMargin().initDraw().draw().setSelectStyle();
        }

    },
    drawHint: function (str) {
        if (this.appendId) {
            if (!this.hintDiv) {
                this.hintDiv = d3.select("#" + this.appendId).append("div");
                this.hintDiv.textHint = this.hintDiv.append("text");
            };
            this.hintDiv.classed("CompareChart-hintdiv", true)
                .style("width", this.width + "px")
                .style("height", this.height + "px")
                .classed("notextselect", true);
            this.hintDiv.textHint.classed("CompareChart-hint", true).text(str);
        }
    },
    reDraw: function () {
        if (!this.isDrawed || !this.appendId) {
            return;
        }
        if (this.svgContainer) {
            this.svgContainer.remove();
            this.svgContainer = null;
        }
        this.isInitDraw = false;
        this.memory.flush();
        this._zoomScale = 1;
        this.translate = [0, 0];
        this.rendering();
    },
    remove: function () {
        this.svgContainer.remove();
        this.init();
    },
    getScale: function (key) {
        if (key === "x") {
            return this.memory.cache("xscale", function (key) {
                if (this.xType === "time" || this.xType === "number") {
                    var span = (this.getMaxData("x") - this.getMinData("x")) / 24;
                    return d3.scale.linear()
                        .range([0, this._figureWidth])
                        .domain([this.getMinData("x") - span, this.getMaxData("x") + span]);
                } else if (this.xType === "string") {

                    return d3.scale.linear()
                        .range([0, this._figureWidth])
                        .domain([-1, this.getXset().length]);

                }
            }, this);
        }
        if (key === "y" || key === "y2") {
            return this.memory.cache(key + "scale", function (key) {
                var span, max, min;
                max = this.getMaxData(key);
                min = this.getMinData(key);
                if (min === max) {
                    min /= 2;
                    if (max === 0) max += 10;
                }
                span = (max - min) / 12;
                max += span;
                min -= span;
                return d3.scale.linear()
                    .range([0, this._figureHeight])
                    .domain([max, min]);
            }, this, arguments);
        }
    },
    getXCoordinate: function () {
        return this.memory.cache("xcooridate", function () {
            if (this.xType === "time" || this.xType === "number") {
                return this.getScale("x");
            } else if (this.xType === "string") {
                var self = this;
                return function (x) {
                    var i = self.getXset().indexOf(x);
                    var f = self.getScale("x");
                    return f(i);
                }
            }
        }, this);
    },
    getMaxData: function (key) {
        return this.memory.cache("max" + key, function (key) {
            var datas = this._measures;
            var _num = Number.MIN_VALUE;
            datas.forEach(function (d) {
                if (d.getMax() !== null) {
                    _num = Math.max(d.getMax(key), _num);
                }
            })
            return _num;
        }, this, arguments)

    },
    getMinData: function (key) {
        return this.memory.cache("min" + key, function (key) {
            var datas = this._measures;
            var _num = Number.MAX_VALUE;
            datas.forEach(function (d) {
                if (d.getMin(key) !== null) {
                    _num = Math.min(d.getMin(key), _num);
                }
            })
            return _num;
        }, this, arguments);
    },
    zoomFunction: function () {
        var max, min;
        min = this.getXCoordinate()(this.getXset()[0]);
        max = this.getXCoordinate()(this.getXset()[this.getXset().length - 1]);
        if (max < this._figureWidth / 2 || min > this._figureWidth / 2) {
            this.zoom.translate(this.translate);
        };
        this.translate = this.zoom.translate();
        var self = this;
        this._zoomScale = d3.event.scale;
        this.toolTip.setVisiable(false);
        //this.svg.drawArea.remove();
        // this.svg.drawArea = this.svg.append("svg:g").classed("CompareChart-drawArea", true)
        //     .attr("transform", "translate(0," + this._titleHeight + ")");
        // var _a = this.svg.drawArea.append("a").attr("xlink:href", "javascript:void(0)").attr("name", "legend");
        // this.keyboardHandle(_a);
        // this.svg.drawArea.figureArea.remove();
        // this.svg.drawArea.figureRect.remove();
        // this.svg.drawArea.figureArea = _a.append("svg:g").classed("CompareChart-figure", true)
        //     .attr("transform", "translate(" + (this._yTitleWidth + this._yAxisWidth) + ",0)")
        //     .attr("clip-path", "url(#" + this.appendId + "clip)");
        // this.svg.drawArea.figureRect = this.svg.drawArea.figureArea
        //     .append("svg:rect")
        //     .attr("width", this._figureWidth)
        //     .attr("height", this._figureHeight)
        //     .attr("fill-opacity", 0);
        //this.svg.drawArea.call(this.zoom).on("dblclick.zoom", null);
        this.svg.drawArea.figureArea.selectAll("g").remove();
        if (!this.p2) {
            this.p1 = null;
        }
        this.drawBackground().drawAxis().drawYTicketLine().drawMeasure().drawEventZone().setSelectStyle();
        this.drawCustomeLine(this.p1, this.p2);
    },
    drawGuideLine: function (point) {
        var self = this,
            $chart = this.$chart;
        var xScale = self.getXCoordinate(),
            yScale = point._figureObj.y2 ? this.getScale("y2") : this.getScale("y");
        if (!self._guideLineGroup) self._guideLineGroup = this.svg.drawArea.figureArea.append("g").attr("class", "CompareChart-guideline");
        point._figureObj.getY(point).forEach(function (v) {
            if (point._figureObj.y2) {
                self._guideLineGroup
                    .append("line")
                    .attr("x1", 0)
                    .attr("y1", yScale(v))
                    .attr("x2", self._figureWidth)
                    .attr("y2", yScale(v))
                    .classed("CompareChart-xguideline", true);
                self._guideLineGroup.append("circle")
                    .attr("cx", self._figureWidth - 4)
                    .attr("cy", yScale(v))
                    .attr("r", 4);
            } else {
                //xScale(point._parent.getX(point)[0])
                self._guideLineGroup
                    .append("line")
                    .attr("x1", self._figureWidth)
                    .attr("y1", yScale(v))
                    .attr("x2", 0)
                    .attr("y2", yScale(v))
                    .classed("CompareChart-xguideline", true);
                self._guideLineGroup.append("circle")
                    .attr("cx", 4)
                    .attr("cy", yScale(v))
                    .attr("r", 4);
            }
        });
        var minY = Number.MAX_VALUE;
        point._figureObj.getY(point).forEach(function (v) {
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
            .classed("CompareChart-yguideline", true)
            // self.svg.selectAll(".yAxisGuideLine").attr("visibility", "hidden");
    },
    removeGuideLine: function () {
        var self = this;
        if (self._guideLineGroup) {
            self._guideLineGroup.remove();
            delete self._guideLineGroup;
        }
    },
    getLinePosition: function () {
        if (!this.showCustomLine) return;
        if (d3.event.defaultPrevented) return;
        if (this.p1 && this.p2) {
            this.p1 = null;
            this.p2 = null;
            this.customeLineYScale = null;
            if (this.customeLineFigure) this.customeLineFigure.remove();
        }
        if (this.hasY1()) {
            this.customeLineYScale = this.getScale("y");
        } else if (this.hasY2()) {
            this.customeLineYScale = this.getScale("y2");
        } else {
            return;
        }
        var self = this,
            xScale = this.getScale("x"),
            yScale = this.customeLineYScale;
        if (this.p1) {
            var position = d3.mouse(this.svg.drawArea.figureArea.node());
            this.svg.drawArea.on("mousemove", null)
            self.p2 = {};
            self.p2.x = xScale.invert(position[0]);
            self.p2.y = yScale.invert(position[1]);
            self.drawCustomeLine(this.p1, this.p2);

        } else {
            var position = d3.mouse(this.svg.drawArea.figureArea.node());
            this.p1 = {};
            this.p1.x = xScale.invert(position[0]);
            this.p1.y = yScale.invert(position[1]);
            var self = this;
            this.svg.drawArea.on("mousemove", function () {
                var position = d3.mouse(self.svg.drawArea.figureArea.node());
                var p2 = {};
                p2.x = xScale.invert(position[0]);
                p2.y = yScale.invert(position[1]);
                self.drawCustomeLine(self.p1, p2, true);
            })
        }

    },
    drawCustomeLine: function (p1, p2, isLineExtend) {
        if (!this.showCustomLine) return;
        if (p1 && p2) {
            var x0, y0, x1, y1, x2, y2;
            var xScale = this.getScale("x"),
                yScale = this.customeLineYScale;
            x0 = xScale(p1.x), y0 = yScale(p1.y), x2 = xScale(p2.x), y2 = yScale(p2.y);

            if (y2 > y0) {
                var tempx = x2,
                    tempy = y2;
                x2 = x0;
                y2 = y0;
                x0 = tempx;
                y0 = tempy;
            }
            x1 = x0;
            y1 = y0;
            if (!isLineExtend) {
                if (x2 === x0 && y2 === y0) return;
                x1 = 2 * x0 - x2;
                y1 = 2 * y0 - y2;
                while ((y1 > -2000 && y1 < 2000) && (x1 > -2000 && x1 < 2000)) {
                    x1 = 2 * x0 - x2;
                    y1 = 2 * y0 - y2;
                    x0 = x1;
                    y0 = y1;
                }
                x0 = x2;
                y0 = y2;
                while (x2 > -2000 && x2 < 2000 && y2 > -2000 && y2 < 2000) {
                    x2 = 2 * x0 - x1;
                    y2 = 2 * y0 - y1;
                    x0 = x2;
                    y0 = y2;

                }

            }

            if (this.customeLineFigure) this.customeLineFigure.remove();
            this.customeLineFigure = this.svg.drawArea.figureArea.append("line").attr("x1", x1)
                .attr("y1", y1)
                .attr("x2", x2)
                .attr("y2", y2)
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "3,3");
        }
    },
    setSelectStyle: function () {
        var isAllSelect = true,
            hasSelect = false;
        this._measures.forEach(function (f) {
            if (f.isSelected) {
                hasSelect = true
            } else {
                isAllSelect = false
            }
        })
        if (isAllSelect) {
            this._measures.forEach(function (f) {
                f.isSelected = false;
            })
            hasSelect = false;
        }
        this._measures.forEach(function (f) {
            if (hasSelect) {
                if (f.legendDom) f.legendDom.classed("legendNotSelected", !f.isSelected);
                if (f.isSelected) {
                    f.measureDom.classed("compareChartNotSelected", false);

                } else {
                    f.measureDom.classed("compareChartNotSelected", true);
                }
            } else {
                f.measureDom.classed("compareChartNotSelected", false);
                if (f.legendDom) f.legendDom.classed("legendNotSelected", false);
            }

        });

        return this;
    },
    _getConfig: function () {
        var _ = {
            isInitDraw: false,
            _y2ValueFormat: this._y2ValueFormat,
            _yValueFormat: this._yValueFormat,
            xValueFormat: this.xValueFormat,
            width: this.width,
            height: this.height,
            title: this.title,
            xType: this.xType,
            xTitle: this.xTitle,
            yTitle: this.yTitle,
            y2Title: this.y2Title,
            colorPallet: this.colorPallet,
            customBackground: this.customBackground,
            showCustomeLine: this.showCustomeLine
        };
        return _;
    },
    _getMeasures: function () {
        return this._measures.map(function (m) {
            var _m = {
                id: m.id,
                name: m.name,
                type: m.type,
                style: m.style,
                config: m.config
            };
            _m.data = [];
            m._d.forEach(function (_) {
                var t = {};
                m.mapkey.forEach(function (k) {
                    t[k] = _[k];
                });
                _m.data.push(t);
            })
            return _m;
        });
    },
    clone: function (arg) {
        var config = this._getConfig();
        var measures = this._getMeasures();
        return CompareChart.create(config).addMeasures(measures);
    },
    resize: function (arg) {
        if (arg === "mini") {
            this.handleEvent = false;
            this.showLegend = false;
            this.noAxisTicket = true;
            this.noAxisTitle = true;
        }
        if (arg === "normal") {
            this.handleEvent = true;
            this.showLegend = true;
            this.noAxisTicket = false;
            this.noAxisTitle = false;
        }
        return this;

    },
    toChartJSON: function () {
        var _ = {};
        _.type = "comparechart";
        _.config = this._getConfig();
        _.measures = this._getMeasures();
        return JSON.stringify(_, function (key, val) {
            if (typeof val === 'function') {
                return val.toString(); // implicitly `toString` it
            }
            return val;
        }, 4);
    },
    createFromJSON: function (str) {
        var _ = JSON.parse(str, function (key, value) {    
            if (value && (typeof value === 'string') && value.indexOf("function") === 0) {        
                var jsFunc = new Function('return ' + value)();        
                return jsFunc;    
            }        
            return value;
        });
        if (_.type === "comparechart") {
            return CompareChart.create(_.config).addMeasures(_.measures);
        }
    }
})
var Line = SmartChartBaseClass.extend({
    type: "line",
    mapkey: ["x", "y"],
    init: function (measure) {
        var self = this;
        this.measure = measure;
        this.setOption(measure);
        this.id = measure.id;
        this.name = measure.name;
        this._d = JSON.parse(JSON.stringify(measure.data));
        this.mapkey.forEach(function (key) {
            if (measure.mapkey) {
                self._d.forEach(function (d) {
                    if (measure.mapkey[key]) {
                        d[key] = d[measure.mapkey[key]];
                    }

                })
            }
        })
        if (measure.config) {
            this.y2 = measure.config.axes_ref === "y2" ? true : false;
            this.isHandleNaN = (measure.config.isHandleNaN === undefined ? true : this.isHandleNaN);
            this.config = measure.config;
        }

        this.style = measure.style || {};
        this._d.forEach(function (d) {
            d._figureObj = self;
        })
        this.dataCheck() ? null : (this._d = [], console.error("data format is error"));
        // var config = originData,
        //     self = this;
        // this.setOption(config);
        // this._d = originData.data;
        // this.isHandleNaN=(this.isHandleNaN ===undefined ?true:this.isHandleNaN);
        // if (config.ref === "y2") {
        //     this.y2 = true;
        // }
        // this.linelength=this.linelength ===undefined? 2:this.linelength;
        // var mapkey = this.mapkey;
        // mapkey.forEach(function(key) {
        //     if (config[key]) {
        //         self._d.forEach(function(d){
        //             d[key]=d[config[key]];
        //         })
        //     }
        // });
        // // Object.keys(this._d).forEach(function(k){
        // //      if(self.mapkey.indexOf(k)===-1){
        // //            self._d.forEach(function(d){
        // //                 delete d[k];
        // //            })
        // //         }
        // // })
        // this._d.forEach(function(d) {
        //     d._figureObj = self;
        // })
    },
    dataCheck: function () {
        var result = true,
            self = this;
        this.mapkey.forEach(function (k) {
            self._d.forEach(function (d) {
                var _r = !(d[k] === undefined || d[k] === null);
                !_r ? console.log(d) : null;
                result = _r && result;

            })
        })
        return result;

    },
    getX: function (point) {
        return [point.x];
    },
    getY: function (point) {
        return [point.y];
    },
    getAllX: function () {
        return this._d.map(function (v) {
            return v.x
        });
    },
    getAllY: function () {
        return this._d.map(function (v) {
            return v.y
        });
    },
    getObjForAccessiability: function () {
        return this.measureDom.selectAll("circle")[0];
    },
    getRelativePoint: function (point) {
        return [point.attr("cx"), point.attr("cy")];
    },
    getMax: function (key) {
        if (key === "x") {
            if (this._maxx) return this._maxx;
            var x = Number.MIN_VALUE;
            this._d.forEach(function (v) {
                if (!isNaN(x)) {
                    x = Math.max(v.x, x);
                }
            });
            this._maxx = x;
            return x;
        }
        if (key === "y") {
            if (this.y2) return Number.MIN_VALUE;
            if (this._maxy) return this._maxy;
            var self = this;
            this._maxy = Number.MIN_VALUE;
            this.getAllY().forEach(function (v) {
                if (!isNaN(v)) {
                    self._maxy = Math.max(v, self._maxy);
                }
            })
            return this._maxy;
        }
        if (key === "y2") {
            if (!this.y2) return Number.MIN_VALUE;
            if (this._maxy) return this._maxy;
            var self = this;
            this._maxy = Number.MIN_VALUE;
            this.getAllY().forEach(function (v) {
                if (!isNaN(v)) {
                    self._maxy = Math.max(v, self._maxy);
                }
            })
            return this._maxy;
        }

    },
    getMin: function (key) {
        if (key === "x") {
            if (this._minx !== undefined) return this._minx;
            var x = Number.MAX_VALUE;
            this._d.forEach(function (v) {
                if (!isNaN(x)) {
                    x = Math.min(x, v.x);
                }
            });
            this._minx = x;
            return this._minx;
        }
        if (key === "y") {
            if (this.y2) return null;
            if (this._miny) return this._miny;
            var self = this;
            this._miny = Number.MAX_VALUE;
            this.getAllY().forEach(function (v) {
                if (!isNaN(v)) {
                    self._miny = Math.min(v, self._miny);
                }
            })
            return this._miny;
        }
        if (key === "y2") {
            if (!this.y2) return null;
            if (this._miny) return this._miny;
            var self = this;
            this._miny = Number.MAX_VALUE;
            this.getAllY().forEach(function (v) {
                if (!isNaN(v)) {
                    self._miny = Math.min(v, self._miny);
                }
            })
            return this._miny;
        }

    },
    isInSharp: function (svg, _sharp) {

        _sharp = d3.select(_sharp);
        if (_sharp.node().nodeName === "circle") {
            var mouse = d3.mouse(svg.node());

            x2 = Number(_sharp.attr("cx")), y2 = Number(_sharp.attr("cy")), r = Number(_sharp.attr("r"));
            return Math.sqrt(Math.pow(mouse[0] - x2, 2) + Math.pow(mouse[1] - y2, 2)) < Math.max(r, 10);
        }
    },
    draw: function (ctx) {
        //this.parseFromMeasure();
        var svg = ctx.get("svg");
        var transitionTime = ctx.get("transitionTime") || 1000;
        var xcooridate = ctx.get("xcooridate");
        var scales = ctx.get("scales");
        var getColor = ctx.get("color");
        var xSetIndex = ctx.get("xsetIndex");
        var isHandleNaN = this.isHandleNaN;
        var line = svg.append("g").attr("class", "CompareChart-line").attr("pointer-events", "none");
        var self = this,
            yScale, _line, lineGen, _circle, xScale;
        yScale = this.y2 ? scales("y2") : scales("y");
        xScale = xcooridate;
        var lineTransition = function (l) {
            var totalLength = l.node().getTotalLength();
            if (self.style_dasharray) {
                l.attr("stroke-dasharray", totalLength + "," + totalLength)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                    .duration(transitionTime)
                    .ease("linear")
                    .attr("stroke-dashoffset", 0)
                    .transition().duration(0).attr("stroke-dasharray", self.style_dasharray);
            } else {
                l.attr("stroke-dasharray", totalLength + "," + totalLength)
                    .attr("stroke-dashoffset", totalLength)
                    .transition()
                    .duration(transitionTime)
                    .ease("linear")
                    .attr("stroke-dashoffset", 0);

            }
        }
        var circleTransition = function (c) {
                c.attr("opacity", "0")
                    .transition()
                    .delay(transitionTime)
                    .attr("opacity", 1);
            }
            // lineGen = d3.svg.line()
            //     .x(function(d) {
            //         return xScale(d.x);
            //     })
            //     .y(function(d) {
            //         return yScale(d.y);
            //     });
        _line = line.append("path")
            .attr('stroke', this.style_color)
            .attr('stroke-width', this.style_linewidth || defaultStyle.linewidth)
            .attr('fill', 'none')
            .attr('d', this.smartLineGen(xScale, yScale, isHandleNaN, this._d));
        if (this.style_dasharray) {
            _line.attr("stroke-dasharray", this.style_dasharray);
        }
        _circle =
            line.selectAll("linepoint")
            .data(this._d.filter(function (v) {
                return !isNaN(v.y)
            }))
            .enter()
            .append("circle")
            .attr("fill", this.style_color)
            .attr("cx", function (d) {
                return xScale(d.x);
            })
            .attr("cy", function (d) {
                return yScale(d.y);
            })
            .attr("r", this.style_circleradius || defaultStyle.circleradius)
            .attr("class", function (d, i) {
                return "event-comparechart-" + xSetIndex(d.x);
            })
        if (!isNaN(this.style_opacity)) {
            line.attr("opacity", +this.style_opacity);
            // _circle.attr("opacity",+this.style_opacity);
        }
        if (!this.measureDom) {
            _line.call(lineTransition);
            _circle.call(circleTransition);
        }
        this.measureDom = line;
    },
    smartLineGen: function (xScale, yScale, isHandleNaN, ds) {
        if (ds.length < 1) return "M0,0";
        var lineString = "";
        var isStartPoint = true;
        if (!isHandleNaN) {
            ds = ds.filter(function (v) {
                return !isNaN(v.y);
            })
        }
        for (var i = 0; i < ds.length; ++i) {
            if (isStartPoint) {
                if (isNaN(ds[i].y)) {
                    isStartPoint = true;
                    continue;
                } else {
                    lineString += "M" + xScale(ds[i].x) + "," + yScale(ds[i].y);
                    isStartPoint = false;
                }
            } else {
                if (isNaN(ds[i].y)) {
                    isStartPoint = true;
                    continue;
                } else {
                    lineString += "L" + xScale(ds[i].x) + "," + yScale(ds[i].y);
                }
            }

        }
        return lineString;
    },
    toHtml: function (ctx) {
        var data = ctx.get("d");
        var text = "";
        var yTitle;
        if (this.$chart) {
            yTitle = this.y2 ? this.$chart.y2Label : this.$chart.yLabel;
        } else {
            yTitle = " ";
        }
        text += "<tr>";
        text += "<td class='tooltip-name'><span style=' background-color:" + this.style_color + "'></span>" + this.name + "</td>";
        text += "<td class='tooltip-value'>" + (this.config_yLabel || yTitle) + "</td>";
        text += "<td class='tooltip-value'>" + data.y + "</td>";
        text += "</tr>";
        return text;
    }
})
var Bar = Line.extend({
    type: "bar",
    getObjForAccessiability: function () {
        return this.measureDom.selectAll("rect")[0];
    },
    getRelativePoint: function (point) {
        return [point.attr("x"), point.attr("y")];
    },
    draw: function (ctx) {
        // this.parseFromMeasure()
        var bars = ctx.get("bars");
        var scales = ctx.get("scales");
        var zoomScale = ctx.get("zoomScale");
        var xcooridate = ctx.get("xcooridate");
        var svg = ctx.get("svg");
        var xSet = ctx.get("xset")();
        var barMaxHeight = ctx.get("barMaxHeight");
        var xSetIndex = ctx.get("xsetIndex");
        var transSitionTime = ctx.get("transitionTime") || 1000;
        var bargroup = svg.append("g")
            .attr("class", "CompareChart-Bar")
            .attr("pointer-events", "none");
        var transitionFunction = function (b) {
            b.each(function (d) {
                d3.select(this).attr("y", barMaxHeight)
                    .transition()
                    .duration(transSitionTime)
                    .ease("linear")
                    .attr("y", function (d) {
                        return yScale(d.y);
                    })
            });
        }
        var xScale = xcooridate,
            yScale = this.y2 ? scales("y2") : scales("y"),
            barAcc = bars.length,
            barWidth = 60;
        for (var i = 0; i < xSet.length - 1; ++i) {
            barWidth = Math.min(xScale(xSet[i + 1]) - xScale(xSet[i]), barWidth);
        }
        barWidth = barWidth / barAcc * zoomScale;
        barWidth = Math.min(barWidth, 25);
        var getBarIndex = function (bars, bar, x) {
            var i = -1;
            bars.filter(function (b) {
                return b.getAllX().find(function (b) {
                    return b - x === 0 || b === x
                }) !== undefined;
            }).forEach(function (b, j) {
                if (b.id === bar.id) {
                    i = j;
                }
            })
            return i;
        }
        var getBarXAcc = function (bars, x) {
            return bars.filter(function (b) {
                return b.getAllX().find(function (b) {
                    return b - x === 0 || b === x
                }) !== undefined;
            }).length;
        }
        var self = this;
        var bars = bargroup.selectAll("rect").data(this._d.filter(function (v) {
                return !isNaN(v.y)
            }))
            .enter()
            .append("rect")
            .attr("x", function (d) {
                return xScale(d.x) - (getBarXAcc(bars, d.x)) / 2 * barWidth + getBarIndex(bars, self, d.x) * barWidth;
            })
            .attr("y", function (d) {
                return yScale(d.y);
            })
            .attr("width", barWidth)
            .attr("height", barMaxHeight)
            .attr("fill", this.style_color)
            .attr("class", function (d, i) {
                return "event-comparechart-" + xSetIndex(d.x);
            });
        if (!isNaN(this.style_opacity)) {
            bars.selectAll("rect").attr("opacity", +this.style_opacity);
        }
        if (!this.measureDom) {
            bars.call(transitionFunction);
        }
        this.measureDom = bargroup;
    },
    isInSharp: function (svg, _sharp) {
        _sharp = d3.select(_sharp);
        if (_sharp.node().nodeName === "rect") {
            var mouse = d3.mouse(svg.node());
            x = Number(_sharp.attr("x")), y = Number(_sharp.attr("y")), width = Number(_sharp.attr("width"));
            return mouse[0] > x && mouse[1] > y && mouse[0] < x + width;
        }
    },
    toHtml: function (ctx) {
        var data = ctx.get("d");
        var text = "";
        var yTitle;
        if (this.$chart) {
            yTitle = this.y2 ? this.$chart.y2Label : this.$chart.yLabel;
        } else {
            yTitle = " ";
        }
        text += "<tr>";
        text += "<td class='tooltip-name'><span style=' background-color:" + this.style_color + "'></span>" + this.name + "</td>";
        text += "<td class='tooltip-value'>" + (this.config_yLabel || yTitle) + "</td>";
        text += "<td class='tooltip-value'>" + data.y + "</td>";
        text += "</tr>";
        return text;
    }
})
var BoxPlot = Line.extend({
    type: "boxplot",
    mapkey: ["x", "d0", "d1", "d2", "d3", "d4", "d5"],
    getObjForAccessiability: function () {
        return this.measureDom.selectAll(".boxplot")[0];
    },
    getRelativePoint: function (point) {
        return [point.select("line").attr("x1"), point.select("line").attr("y1")];
    },
    init: function (measure) {
        Line.init.call(this, measure);
        this.rectwidth = this.style_rectwidth || defaultStyle.rectwidth;
        this.linelength = this.rectwidth + 4;
    },
    draw: function (ctx) {
        //this.parseFromMeasure();
        var scales = ctx.get("scales");
        var svg = ctx.get("svg");
        var xSetIndex = ctx.get("xsetIndex");
        var barMaxHeight = ctx.get("barMaxHeight");
        var transSitionTime = ctx.get("transitionTime") || 1000;
        var xcooridate = ctx.get("xcooridate");
        var xScale = xcooridate,
            yScale = this.y2 ? scales("y2") : scales("y"),
            linelength = this.linelength,
            rectwidth = this.rectwidth,
            self = this;
        var boxGroup = svg.append("g").attr("class", "CompareChart-boxplot").attr("pointer-events", "none");
        this._d.forEach(function (d) {
            var boxplot = boxGroup.append("g").attr("class", "event-comparechart-" + xSetIndex(d.x)).datum(d).classed("boxplot", true);
            boxplot.append("line").attr("x1", xScale(d.x) - linelength / 2).attr("y1", yScale(d.d0))
                .attr("x2", xScale(d.x) + linelength / 2).attr("y2", yScale(d.d0))
                .attr("stroke-width", "2");
            boxplot.append("line").attr("x1", xScale(d.x)).attr("y1", yScale(d.d0))
                .attr("x2", xScale(d.x)).attr("y2", yScale(d.d1))
                .attr("stroke-width", "1.5px").attr("stroke-dasharray", "2,2");
            boxplot.append("rect").attr("x", xScale(d.x) - rectwidth / 2).attr("y", yScale(d.d1))
                .attr("width", rectwidth).attr("height", yScale(d.d4) - yScale(d.d1))
                .attr("fill", self.style_color);
            boxplot.append("line").attr("x1", xScale(d.x) - rectwidth / 2).attr("y1", yScale(d.d2))
                .attr("x2", xScale(d.x) + rectwidth / 2).attr("y2", yScale(d.d2))
                .attr("stroke-width", "2");
            boxplot.append("line").attr("x1", xScale(d.x) - rectwidth / 2).attr("y1", yScale(d.d3))
                .attr("x2", xScale(d.x) + rectwidth / 2).attr("y2", yScale(d.d3))
                .attr("stroke-width", "2")
                .attr("stroke-dasharray", "2,2");
            boxplot.append("line").attr("x1", xScale(d.x)).attr("y1", yScale(d.d4))
                .attr("x2", xScale(d.x)).attr("y2", yScale(d.d5))
                .attr("stroke-width", "1.5px").attr("stroke-dasharray", "2,2");
            boxplot.append("line").attr("x1", xScale(d.x) - linelength / 2).attr("y1", yScale(d.d5))
                .attr("x2", xScale(d.x) + linelength / 2).attr("y2", yScale(d.d5))
                .attr("stroke-width", "2");
        });
        var tFunction = function (d) {
            var boxs = d.selectAll("g")[0];
            boxs.forEach(function (box, i) {
                d3.select(box).attr("transform", "translate(0," + barMaxHeight + ")")
                    .transition()
                    .delay(i * transSitionTime / (boxs.length + 1))
                    .duration(transSitionTime / 2)
                    .ease("linear")
                    .attr("transform", "translate(0,+" + 0 + ")");
            })
        }
        if (!this.measureDom) {
            boxGroup.call(tFunction);
        }
        this.measureDom = boxGroup;
    },
    getY: function (point) {
        return [point.d0, point.d1, point.d2, point.d3, point.d4, point.d5];
    },
    getAllY: function () {
        if (this._d.map(function (v) {
                return [v.d0, v.d1, v.d2, v.d3, v.d4]
            }).length > 0) {
            return this._d.map(function (v) {
                return [v.d0, v.d1, v.d2, v.d3, v.d4]
            }).reduce(function (v1, v2) {
                return v1.concat(v2)
            });
        } else {
            return [];
        }

    },
    isInSharp: function (svg, _sharp, ctx) {
        _sharp = d3.select(_sharp);
        var scales = ctx.get("scales");
        var xCoor = ctx.get("xcooridate");
        if (_sharp.style("visibility") === "hidden") return false;
        var figure, _d, mouse, yScale, xScale, rectwidth;
        yScale = this.y2 ? scales("y2") : scales("y")
        xScale = xCoor;
        rectwidth = this.rectwidth;
        _d = _sharp.datum();
        mouse = d3.mouse(svg.node());
        return mouse[0] > xScale(_d.x) - rectwidth / 2 && mouse[0] < xScale(_d.x) + rectwidth / 2 && mouse[1] > yScale(_d.d0) && mouse[1] < yScale(_d.d4);

    },
    toHtml: function (ctx) {
        var text = "";
        var data = ctx.get("d");
        text += "<tr>";
        text += "<td class='tooltip-name' rowspan='6'><span style=' background-color:" + this.style_color + "'></span>" + this.name + "</td>";
        text += "<td class='tooltip-value'>" + (this.config_d0Label || "Data 0") + "</td>";
        text += "<td class='tooltip-value'>" + data.d0 + "</td>";
        text += "</tr>";
        text += "<tr>";

        text += "<td class='tooltip-value'>" + (this.config_d1Label || "Data 1") + "</td>";
        text += "<td class='tooltip-value'>" + data.d1 + "</td>";
        text += "</tr>";
        text += "<tr>";

        text += "<td class='tooltip-value'>" + (this.config_d2Label || "Data 2") + "</td>";
        text += "<td class='tooltip-value'>" + data.d2 + "</td>";
        text += "</tr>";
        text += "<tr>";

        text += "<td class='tooltip-value'>" + (this.config_d3Label || "Data 3") + "</td>";
        text += "<td class='tooltip-value'>" + data.d3 + "</td>";
        text += "</tr>";
        text += "<tr>";

        text += "<td class='tooltip-value'>" + (this.config_d4Label || "Data 4") + "</td>";
        text += "<td class='tooltip-value'>" + data.d4 + "</td>";
        text += "</tr>";

        text += "<td class='tooltip-value'>" + (this.config_d5Label || "Data 5") + "</td>";
        text += "<td class='tooltip-value'>" + data.d5 + "</td>";
        text += "</tr>";
        return text;
    }
})
var Area = Line.extend({
    type: "area",
    mapkey: ["x", "y"],
    draw: function (ctx) {
        //this.parseFromMeasure();
        var svg = ctx.get("svg");
        var transitionTime = ctx.get("transitionTime") || 1000;
        var xcooridate = ctx.get("xcooridate");
        var scales = ctx.get("scales");
        var figureHeight = ctx.get("figureHeight");
        var getColor = ctx.get("color");
        var xSetIndex = ctx.get("xsetIndex");
        var isHandleNaN = this.isHandleNaN;
        var area = svg.append("g").attr("class", "CompareChart-area").attr("pointer-events", "none");
        var self = this,
            yScale, _line, lineGen, _circle, xScale;
        yScale = this.y2 ? scales("y2") : scales("y");
        xScale = xcooridate;


        _line = area.append("path")
            .attr('stroke', this.style_color)
            .attr('stroke-width', this.style_linewidth || defaultStyle.linewidth)
            .attr('fill', this.style_color)
            .attr('d', this.smartLineGen(xScale, yScale, isHandleNaN, this._d, figureHeight));
        if (this.style_dasharray) {
            _line.attr("stroke-dasharray", this.style_dasharray);
        }
        _circle =
            area.selectAll("linepoint")
            .data(this._d.filter(function (v) {
                return !isNaN(v.y)
            }))
            .enter()
            .append("circle")
            .attr("fill", this.style_color)
            .attr("cx", function (d) {
                return xScale(d.x);
            })
            .attr("cy", function (d) {
                return yScale(d.y);
            })
            .attr("r", this.style_circleradius || defaultStyle.circleradius)
            .attr("class", function (d, i) {
                return "event-comparechart-" + xSetIndex(d.x);
            })
        if (!isNaN(this.style_opacity)) {
            area.attr("opacity", +this.style_opacity);
            // _circle.attr("opacity",+this.style_opacity);
        }
        if (!this.measureDom) {

        }
        this.measureDom = area;
    },
    smartLineGen: function (xScale, yScale, isHandleNaN, ds, figureHeight) {
        if (!isHandleNaN) {
            ds = ds.filter(function (v) {
                return !isNaN(v.y);
            })
        }
        if (ds.length < 1) return "M0,0";
        var lineString = "";
        var gen = function (ds, i, isBegin) {
            if (i >= ds.length) return;
            if (isBegin) {
                lineString += "M" + xScale(ds[i].x) + "," + figureHeight;
            }
            if (!isNaN(ds[i].y)) {
                lineString += "L" + xScale(ds[i].x) + "," + yScale(ds[i].y);
                if (i + 1 >= ds.length || isNaN(ds[i + 1].y)) {
                    lineString += "L" + xScale(ds[i].x) + "," + figureHeight;
                    gen(ds, ++i, true);
                } else {
                    gen(ds, ++i, false);
                }
            } else {
                gen(ds, ++i, true);
            }
        }
        gen(ds, 0, true);


        // var isStartPoint = true;
        // if(!isHandleNaN){
        //     ds=ds.filter(function(v){
        //         return !isNaN(v.y);
        //     })
        // }
        // for(var i=0;i< ds.length;++i){
        //     if(isStartPoint){
        //         if(isNaN(ds[i].y)) {
        //             isStartPoint = true;
        //             continue;
        //         }else{
        //             lineString+="M"+xScale(ds[i].x)+","+yScale(ds[i].y);
        //             isStartPoint = false;
        //         }
        //     }else{
        //          if(isNaN(ds[i].y)) {
        //             isStartPoint = true;
        //             continue;
        //         }else{
        //              lineString+="L"+xScale(ds[i].x)+","+yScale(ds[i].y);
        //         }
        //     }

        // }
        return lineString;
    }

})
var RangeChart = Line.extend({
    type: "range",
    mapkey: ["x", "y1", "y2"],
    draw: function (ctx) {
        //this.parseFromMeasure();
        var svg = ctx.get("svg");
        var transitionTime = ctx.get("transitionTime") || 1000;
        var xcooridate = ctx.get("xcooridate");
        var scales = ctx.get("scales");
        var figureHeight = ctx.get("figureHeight");
        var getColor = ctx.get("color");
        var xSetIndex = ctx.get("xsetIndex");
        var isHandleNaN = this.isHandleNaN;
        var area = svg.append("g").attr("class", "CompareChart-area").attr("pointer-events", "none");
        var self = this,
            yScale, _line, lineGen, _circle, xScale;
        yScale = this.y2 ? scales("y2") : scales("y");
        xScale = xcooridate;

        lines = this.smartLinesGen(xScale, yScale, isHandleNaN, this._d);
        lines.forEach(function (d) {
            area.append("path")
                .attr('stroke', self.style_color)
                .attr('stroke-width', self.style_linewidth || defaultStyle.linewidth)
                .attr('fill', self.style_color)
                .attr('d', d);
        })
        if (this.style_dasharray) {
            area.attr("stroke-dasharray", this.style_dasharray);
        }
        var circles = function (ds) {
            ds = ds.filter(function (v) {
                return !isNaN(v.y1) && !isNaN(v.y2)
            });
            var ds1 = ds.map(function (d) {
                var _ = {};
                _.x = d.x;
                _.y = d.y1;
                _._figureObj = d._figureObj;
                return _;
            });
            var ds2 = ds.map(function (d) {
                var _ = {};
                _.x = d.x;
                _.y = d.y2;
                _._figureObj = d._figureObj;
                return _;
            });
            return ds1.concat(ds2);
        }
        _circle =
            area.selectAll("linepoint")
            .data(circles(this._d))
            .enter()
            .append("circle")
            .attr("fill", this.style_color)
            .attr("cx", function (d) {
                return xScale(d.x);
            })
            .attr("cy", function (d) {
                return yScale(d.y);
            })
            .attr("r", this.style_circleradius || defaultStyle.circleradius)
            .attr("class", function (d, i) {
                return "event-comparechart-" + xSetIndex(d.x);
            })
        if (!isNaN(this.style_opacity)) {
            area.attr("opacity", +this.style_opacity);
            // _circle.attr("opacity",+this.style_opacity);
        }
        if (!this.measureDom) {

        }
        this.measureDom = area;
    },
    smartLinesGen: function (xScale, yScale, isHandleNaN, ds) {
        if (!isHandleNaN) {
            ds = ds.filter(function (v) {
                return !isNaN(v.y1) && !isNaN(v.y2);
            })
        }
        var new_ds = [];
        var _ds = [];
        for (var i = 0; i < ds.length; ++i) {
            if (!isNaN(ds[i].y2) && !isNaN(ds[i].y1)) {
                _ds.push(ds[i]);
            } else {
                _ds.length > 0 ? new_ds.push(_ds) : 0;
                _ds = [];
            }
        }
        if (_ds.length > 0) {
            new_ds.push(_ds);
        }
        var gen = function (ds) {
            var i = 0;
            if (ds.length < 1) return "M0,0";
            var lineString = "";
            lineString += "M" + xScale(ds[i].x) + "," + yScale(ds[i].y2);
            lineString += "L" + xScale(ds[i].x) + "," + yScale(ds[i].y1);
            for (i = 1; i < ds.length; ++i) {
                lineString += "L" + xScale(ds[i].x) + "," + yScale(ds[i].y1);
            }
            lineString += "L" + xScale(ds[ds.length - 1].x) + "," + yScale(ds[ds.length - 1].y2);
            for (i = ds.length - 1; i >= 0; --i) {
                lineString += "L" + xScale(ds[i].x) + "," + yScale(ds[i].y2);
            }
            return lineString;
        }

        return new_ds.map(gen);

    },
    getAllY: function () {
        return this._d.map(function (v) {
            return [v.y1, v.y2]
        }).reduce(function (v1, v2) {
            return v1.concat(v2)
        });
    }
})
CompareChart.mergeFunction(commentFunction);
})();