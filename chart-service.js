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
var MeasureSet=function(keypath){
    this.keypath=keypath||"id";
    this._d={};
}
MeasureSet.prototype.add=function(v){
    var keypath = v[this.keypath],key=keypath.splice(":")[0],ns=keypath.splice(":")[1]?keypath.splice(":")[1]:"default";
    if(this._d[key]){
        this._d[key][ns]=v;
    }else{
        this._d[key]={};
        this._d[key][ns]=v;
    }
    return this;
}
MeasureSet.prototype.remove=function(keypath){
    var key=keypath.splice(":")[0],ns=keypath.splice(":")[1];
    if(ns){
        if(this._d[key]){
            delete this._d[key][ns];
            if(_(this._d[key]).size ===0){
                 delete this._d[key];
            }
        }
    }else{
        delete this._d[key];
    }
}
MeasureSet.prototype.values=function(){
    var r=[],self=this;
    _(this._d).each(function(v,k){
        _(v).each(function(_v){
            r.push(_v);
        })
    })
    return r;
}
MeasureSet.prototype.each=function(fn,ctx){
    ctx?fn.bind(ctx):null;
    _(this.values()).each(fn);
    return this;
}
MeasureSet.prototype.filterByKey=function(keypath){
   var  key=keypath.splice(":")[0],ns=keypath.splice(":")[1];
   if(this._d[key]){
       if(ns){
           return this._d[key][ns]?[this._d[key][ns]]:[];
       }else{
           _(this._d[key]).toArray();
       }
   }else{
       return [];
   }
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
Set.prototype.keys=function(){
    var t={};
    
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
