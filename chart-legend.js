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
                                             .attr("width", self.textRectWidth)
                                             .append("xhtml:p")
                                             .style("line-height",self.textRectHeight+"px")
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
                d3.select(this).select("rect").classed("measuremouseover",true);
                self.eventManager.call("legendmouseover", d);
            })
            .on("mouseout", function(d) {
                d3.select(this).select("rect").classed("measuremouseover",false);
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