var scrolls = Curry(Scroll);
var verticalScrolls=scrolls("vertical");
var Legend=SmartChartBaseClass.extend({
    init:function(eventManager){
        this.eventManager =eventManager;
    },
    draw:function(ctx,_measures){
        var svg=ctx.get("svg"),legendWidth=ctx.get("legendWidth")-10,self=this,legendHeight =ctx.get("legendHeight"),guid=ctx.get("guid");
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
                                        .attr("fill",d.style_color);
            }else{
                g.append("svg:circle").attr("cx",0)
                                    .attr("cy",  i * 32+13)
                                    .attr("r",8)
                                    .attr("fill", d.style_color );
            }
            g.append("svg:text").attr("x", 12)
                                    .attr("y",(i * 32) + 14)
                                    .text(d.name)
                                    .attr("dominant-baseline", "middle");
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
    }
})