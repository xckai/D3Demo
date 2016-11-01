ChartManeger={};
ChartManeger.createCompareChart = function (option) {
    return CompareChart.create(option)
};
ChartManeger.createMeasure = function (option) {
    return new Measure(option);
}
ChartManeger.createChartFromJSON = function (str) {
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