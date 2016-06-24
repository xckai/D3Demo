        var SmartTrafficLineChart = function(width, height) {
            this.datas = [];
            this.svg = null;
            this.appendId = null;
            this.width = width;
            this.height = height;
            this._marginTop = Math.max(20, Math.floor(this.height * 0.05));
            this._marginLeft = Math.max(30, Math.floor(this.width * 0.08));
            this._marginButtom = Math.max(30, Math.floor(this.height * 0.08));
            this._marginRight = Math.max(10, Math.floor(this.width * 0.02));
            this._chartWidth = Math.floor(this.width * 0.7);
        };
        SmartTrafficLineChart.prototype = {
            addData: function(data) {
                this.datas.push(data);
                if (this.svg) this._reDraw();
            },
            addFlowData:function(name, _d ,option){
                var _t =this.datas.find(function(v){
                    if(v.name === name) return true;
                    return false;
                })
                if(! _t ){
                    _t ={"name":name,"_d":[],"option":option};
                    this.datas.push(_t);
                }
                _d.y = Math.sin( 16*Math.PI/360*_d.x);
                _t._d.push(_d);
                if(_t._d.length >45){
                    _t._d.shift();
                }
                if (this.svg) this._reDraw();
            },
            _calculateMargin: function() {
                this._marginTop = Math.max(20, Math.floor(this.height * 0.05));
                this._marginLeft = Math.max(30, Math.floor(this.width * 0.08));
                this._marginButtom = Math.max(30, Math.floor(this.height * 0.08));
                this._marginRight = Math.max(10, Math.floor(this.width * 0.02));
                this._chartWidth = Math.floor(this.width * 0.7);
            },
            _drawAxis: function() {
                this.svg.append("svg:g")
                    .attr("transform", "translate(0," + (this.height - this._marginButtom-this._marginTop) + ")")
                    .call(d3.svg.axis().scale(this._getXScale()).orient("bottom").tickFormat(function(d){ return d;}));
                this.svg.append("svg:g")
                    .attr("transform", "translate(" + this._marginLeft + ",0)")
                    .call(d3.svg.axis().scale(this._getYScale()).orient("left"));
            },
            _drawLine: function(data) {
                var self = this;
                var lineGen = d3.svg.line()
                    .x(function(d) {
                        return self._getXScale()(d.x);
                    })
                    .y(function(d) {
                        return self._getYScale()(d.y);
                    }).interpolate("monotone");
              var _line= this.svg.append("svg:path")
                    .attr('d', lineGen(data._d))
                    .attr('stroke', data.option.color)
                    .attr('stroke-width', 2)
                    .attr('fill', 'none');
                return _line;
            },
            _drawCircle: function(data) {
                var self = this;
                var _circle = this.svg.selectAll("linepoint")
                    .data(data._d)
                    .enter()
                    .append("circle")
                    .attr("cx", function(d) {
                        return self._getXScale()(d.x);
                    })
                    .attr("cy", function(d) {
                        return self._getYScale()(d.y);
                    })
                    .attr("r", 1).attr("fill", data.option.color);
                return _circle;
            },
            _drawInfoBar:function(){
                var self = this;
                     var circleList = this.svg.selectAll("circleList")
                                        .data(this.datas)
                                        .enter()
                                        .append("g")
                                        .append("circle")
                                        .attr("cx",function(d ,i){
                                            return self._chartWidth +5;
                                        })
                                        .attr("cy",function(d,i){
                                            return  i*30 + self._marginTop +30;
                                        })
                                        .attr("r",8)
                                        .attr("fill",function(d,i){
                                            return d.option.color;
                                        });
                                                               
                     var nameList = this.svg.selectAll("nameList")
                                        .data(this.datas)
                                        .enter()
                                        .append("text")
                                        .attr("x",function(d ,i){
                                            return self._chartWidth +25;
                                        })
                                        .attr("y",function(d,i){
                                            return  i*30 + self._marginTop +35;
                                        })
                                        .text(function(v,i){
                                            return v.name;
                                        });
                    
            },
            _draw: function() {
                this._drawAxis();
                this._drawInfoBar();
                var self = this;
                this.datas.forEach(function (v){
                      self._drawCircle(v);
                      self._drawLine(v);
                });            
            },
            appendTo: function(id) {
                this.svg = d3.select("#" + id)
                    .append("svg")
                    .attr("width", this.width)
                    .attr("height", this.height);
                this.appendId = id;
                this._draw();
            },
            _reDraw: function() {
                if (this.svg) this.svg.remove();
                if (this._xScale) this._xScale = null;
                if (this._yScale) this._yScale = null;
                this._calculateMargin();
                this.svg = d3.select("#" + this.appendId)
                    .append("svg")
                    .attr("width", this.width)
                    .attr("height", this.height);

                this._draw();
            },
            _getXScale: function() {
                this._xScale = this._xScale || d3.scale.linear()
                    .range([this._marginLeft, this._chartWidth])
                    .domain([this._getMinXData(), this._getMaxXData()]);
                return this._xScale;
            },
            _getYScale: function() {
                this._yScale = this._yScale || d3.scale.linear()
                    .range([this._marginTop, this.height - this._marginButtom - this._marginTop])
                    .domain([this._getMaxYData(), this._getMinYData()]);
                return this._yScale;
            },
            _getMaxXData: function() {
                var _num = Number.MIN_VALUE;
                this.datas.forEach(function(d) {
                    d._d.forEach(function(v) {
                        _num = Math.max(v.x, _num);
                    });
                });
               
                return _num;
            },
            _getMinXData: function() {
                var _num = Number.MAX_VALUE;
                this.datas.forEach(function(d) {
                    d._d.forEach(function(v) {
                        _num = Math.min(v.x, _num);
                    });
                });
                return _num;
            },
            _getMaxYData: function() {
                var _num = Number.MIN_VALUE;
                this.datas.forEach(function(d) {
                    d._d.forEach(function(v) {
                        _num = Math.max(v.y, _num);
                    });
                });
                return _num;
            },
            _getMinYData: function() {
                var _num = Number.MAX_VALUE;
                this.datas.forEach(function(d) {
                    d._d.forEach(function(v) {
                        _num = Math.min(v.y, _num);
                    });
                });
                return _num;
            },
            setHeight:function(height){
                this.height = height;
                this._reDraw();
            },
            setWidth:function(width){
                this.width = width;
                this._reDraw();
            }
        };