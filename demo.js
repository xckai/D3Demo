var chartconfig,measureconfig,chart;
function init(){
        chartconfig=ace.edit("chartconfig");
        chartconfig.setTheme("ace/theme/monokai");
        chartconfig.getSession().setMode("ace/mode/javascript");
        chartconfig.renderer.setShowGutter(false);
        measureconfig = ace.edit("measureconfig");
        measureconfig.setTheme("ace/theme/monokai");
        measureconfig.getSession().setMode("ace/mode/javascript");
        measureconfig.renderer.setShowGutter(false);
        chartconfig.setValue(defaultConfig("Chart"));
        chart = SmartCompareChart.create();
        chart.appendTo("timechart");
        typechange();
        setconfig();
        addmeasure();
        chart.rendering();
        var s="#Config & API reference";
        $.get("./api.md",function(d){
            var converter = new showdown.Converter();
            document.getElementsByClassName("timechartapi")[0].insertAdjacentHTML("beforeend",converter.makeHtml(d));
            $('.timechartapi pre code').each(function(i, block) {
                    hljs.highlightBlock(block);
                    });
        })

        
}

function defaultConfig(type) {
        var configs = [],
            chartConfig;
        chartConfig = {
            width: 1000,
            height: 800,
            title: "TimeSeries Demo",
            xType: "time",
            xTitle: {
                location: "end",
                value: "X Title"
            },
            yTitle: {
                location: "start",
                value: "Y Title"
            },
            y2Title: {
                location: "end",
                value: "Y2 Title"
            },
            colorPallet: "d3_10",
            xValueFormat: function(v) {return d3.time.format("%m月 %d 日 %H:%M")(new Date(v));},
            customBackground: [{
                from: "2016-2-3 1:00",
                to: "2016-2-3 1:10",
                color: "#ddd"
            }, {
                from: "2016-2-3 1:30",
                to: "2016-2-3 1:40",
                color: "#aaa"
            }],
            showCustomLine: true
        }
        configs.push({
            id: "1",
            name: "name1",
            data: null,
            type: "line",
            mapkey: {
                y: "num1",
                x: "time"
            },
            style: {
                linewidth: 4,
                dasharray: "2,3",
                circleradius: 0.1
            },
            config: {
                yLabel: "Speed"
            }
        });
        configs.push({
            id: "2",
            name: "name2",
            data: null,
            type: "bar",
            mapkey: {
                y: "num1",
                x: "time"
            },
            config: {
                yLabel: "Speed",
                axes_ref: "y2"
            }       
        });
        configs.push({
            id: "3",
            name: "name3",
            data: null,
            type: "area",
            mapkey: {
                y: "num1",
                x: "time"
            },
            config: {
                yLabel: "Speed",
                axes_ref: "y2"
            }            
        });
        configs.push({
            id: "4",
            name: "name4",
            data: null,
            type: "range",
            mapkey: {
                y1: "num1",
                y2: "num2",
                x: "time"
            },
            config: {
                yLabel: "Speed"
            }            
        })
        var conf;
        switch(type){
            case "Line":
                conf= configs.find(function(c){return c.type==="line"});
                break;
            case "Bar":
                conf= configs.find(function(c){return c.type==="bar"});
                break;
            case "Area":
                conf= configs.find(function(c){return c.type==="area"});
                break;
            case "Range":
                conf= configs.find(function(c){return c.type==="range"});
                break;
            case "Chart":
                conf=chartConfig;
                break;
            default:
                throw new Error("not support type");
                break;
        }
        var res= JSON.stringify(conf,function(key,val){
             if (typeof val === 'function') {
                    return val.toString(); // implicitly `toString` it
                }
                return val;
        },4);
       
        return removeFunction(res);
    }
    var dataGen=function(){
        var res=new Set(function(a,b){
            return a.time==b.time || a.num==b.num;
        });
        for(var i =0;i<100;++i){
              res.add({
                    time: "2016-2-3 1:" + 5 * Math.floor(60 * Math.random()) % 60,
                    num: 1000 * Math.random() + i,
                    num1: 2000 + 100 * Math.random() + i,
                    num2: 1900 + 100 * Math.random() + i,
                    num3: 1800 + 100 * Math.random() + i,
                    num4: 1700 + 100 * Math.random() + i,
                    num5: 1600 + 100 * Math.random() + i,
                    num6: 1500 + 100 * Math.random() + i,
                });
        }
        return res.vals();
    }
function typechange(){
        var type=d3.select("#measuretype").node().value;
        measureconfig.setValue(defaultConfig(type));
     
    }
function addmeasure(){
    var conf=JSON.parse(measureconfig.getValue());
    var measure = new SmartMeasure(conf);
    measure.setData(dataGen());
    chart.addMeasure(measure);
    console.log(conf);
}
function  setconfig(){
    var conf=JSON.parse(addFunction(chartconfig.getValue()), function (key, value) {
        if (value && (typeof value === 'string') && value.indexOf("function") === 0) {
            var jsFunc = new Function('return ' + value)();
            return jsFunc;
        }
              
        return value;
    });
   // autoResize(conf.width);
    chart.setConfig(conf);
    chart.rendering();
   
}
function removeFunction(str){
    var bg=0,cIndex=0;
    var _strIndex=[];
    while((cIndex=str.indexOf("function",bg))!=-1){
        console.log(cIndex)
        bg=cIndex+8;
        _strIndex.push(cIndex-1);
        var count=0,i=0;
        for( i = cIndex; i<str.length;++i){
            if(str[i]==="{") ++count;
            if(str[i]=="}"){
               if(count==1) break;
               else --count;
            }
        }
        _strIndex.push(i+1);
    }
    console.log(_strIndex);
    var res="";
    for(var i =0;i<str.length;++i){
       _strIndex.indexOf(i)=== -1 ? res+=str[i]:0;
      
    }
     console.log(res);
    return res;
}
function addFunction(str){
    var bg=0,cIndex=0;
    var _strIndex=[];
    while((cIndex=str.indexOf("function",bg))!=-1){
        bg=cIndex+8;
        _strIndex.push(cIndex);
        var count=0,i=0;
        for( i = cIndex; i<str.length;++i){
            if(str[i]==="{") ++count;
            if(str[i]=="}"){
               if(count==1) break;
               else --count;
            }
        }
        _strIndex.push(i+1);
    }
    console.log(_strIndex);
    var res="";
    for(var i =0;i<str.length;++i){
       _strIndex.indexOf(i)=== -1 ? res+=str[i]:(res+="\"",res+=str[i]);
       
    }
    console.log(res);
    return res;
}
// function autoResize(width){
//     if(document.body.clientWidth-width<620){
//         document.getElementsByClassName("chartsection")[0].style["flex-wrap"]= "wrap";
//     }else{
//         document.getElementsByClassName("chartsection")[0].style["flex-wrap"]= "nowrap";
//     }
// }