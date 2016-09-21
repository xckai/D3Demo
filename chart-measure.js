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
window.SmartMeasure=Measure;