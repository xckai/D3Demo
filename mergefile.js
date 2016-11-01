var fs=require("fs")
var serviceFile=fs.readFileSync("chart-service.js");
var measureFile=fs.readFileSync("chart-measure.js");
var legendFile=fs.readFileSync("chart-legend.js");
var compareFile=fs.readFileSync("chart-compare.js");
var managerFile=fs.readFileSync("chart-manager.js");
fs.open("comparechart.js","a+",function(err,fd){
    if(err){
        console.log(err);
    }
    fs.writeFile("comparechart.js",
    "(function(){"+serviceFile+"\n"+measureFile+"\n"+legendFile+"\n"+compareFile+"\n"+managerFile+"\nwindow.ChartManeger=ChartManeger;\nwindow.SmartCompareChart=CompareChart;\nwindow.SmartMeasure=Measure;})();",function(err){
        if(err){
            console.log(err);
        }
        console.log("finished");
    })
})