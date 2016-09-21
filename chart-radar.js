var RadarChart = SmartChartBaseClass.extend({
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
            var _a=this.svg.append("a").attr("xlink:href","javascript:void(0)").attr("name","radar");
            this.keyboardHandle(_a);
            this.svg.title = this.svg.append('svg:g').classed("RadarChart-title-Container",true)
                                                      .attr("transform","translate("+(this._drawAreaWidth/2)+",5)");
            this.svg.drawArea =_a.append("svg:g").classed("RadarChart-drawArea",true)
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
    dataMouseOver:function(obj){
        this.svg.selectAll(".datamousehover").classed("datamousehover",false);
        obj? obj.classed("datamousehover",true):null;
    },
    keyboardHandle:function(_a){
        var i =-1,self=this;
            _a.on("keydown",function(){
                console.log(self._measures.vals().map(function(m){
                return m.getObjForAccessiability();
            }).reduce(function(v1,v2){
                return v1.concat(v2);
            }))
            var objs= self._measures.vals().map(function(m){
                return m.getObjForAccessiability();
            }).reduce(function(v1,v2){
                return v1.concat(v2);
            })
            switch(event.code){
                case "ArrowLeft":
               	    i=(i-1+objs.length)%objs.length;
                    var _ = d3.select(objs[i]);
                    self.toolTip.setVisiable(false);
                    var position = _.datum()._figureObj.getRelativePoint(_)
                    self.toolTip.setPosition(+position[0],+position[1]+self._titleHeight);
                    //self.toolTip.setPosition(event.pageX , event.pageY);
                    self.toolTip.setContent(self.getToolTipContent([_.datum()]));
                    self.toolTip.setVisiable(true);
                      
                        break;
                case "ArrowRight":
                     i=(i+1+objs.length)%objs.length;
                    var _ = d3.select(objs[i]);
                    self.toolTip.setVisiable(false);
                    var position = _.datum()._figureObj.getRelativePoint(_)
                    self.toolTip.setPosition(+position[0],+position[1]+self._titleHeight);
                    //self.toolTip.setPosition(event.pageX , event.pageY);
                    self.toolTip.setContent(self.getToolTipContent([_.datum()]));
                    self.toolTip.setVisiable(true);
                        break;
         }
        })

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

var Radar=SmartChartBaseClass.extend({
    type:"radar",
    mapkey:["d0","d1","d2","d3","d4","d5","d6","d7","d8","d9"],
    getObjForAccessiability:function(){
        return this.measureDom.selectAll("circle")[0];
    },
    getRelativePoint:function(point){
        return [point.attr("cx"),point.attr("cy")];
    },
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
RadarChart.mergeFunction(commentFunction);
window.SmartRadarChart=RadarChart;