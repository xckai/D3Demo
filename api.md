# Config & API reference  - timeseries

---

## Chart
1. 创建

		var _c=SmartCompareChart.create();


2. 配置Chart

		var _config={
            width: 1000,//chart的宽度
            height: 800,//chart 高度
            title: "TimeSeries Demo",
            xType: "time",//x轴类型 现在支持 time number string 需在使用chart前指定
            xTitle: {
                location: "end",//x轴标题的位置 参数 start middle end
                value: "X Title"//x轴标题显示文本
            },
            yTitle: {
                location: "start",
                value: "Y Title"
            },
            y2Title: {
                location: "end",
                value: "Y2 Title"
            },
            colorPallet: "d3_10",//颜色调色板 内置 d3_10 d3_20 两套，支持自定义调色板,自定义颜色集合接收如下格式["#eee","#fff"]
            xValueFormat: function(v) {//xtype为time时该函数必须定义，默认的Date toString 字符串过长，会导致绘图失败。回调函数接受一个参数，该参数类型为string，使用时需重新构造为需要的类型。
	            return d3.time.format("%m月 %d 日 %H:%M")(new Date(v));
		        },
		    yValueFormat:function(v){return v},//y轴数值格式化函数
            customBackground: [{//自定义背景接收一个对象数组 可定义多组不同的背景 ，背景定义格式如下如需修改全部chart背景建议直接修改css
                from: "2016-2-3 1:00",
                to: "2016-2-3 1:10",
                color: "#ddd"
            }, {
                from: "2016-2-3 1:30",
                to: "2016-2-3 1:40",
                color: "#aaa"
            }],
            showCustomLine: true,///自定义绘制辅助线，默认为false 不需要可不设置该属性
            showLegend:true///设置legend是否显示 默认为true 不需要可不设置该属性
        }
        _c.setConfig(_config)



3. 设置chart绘制位置以及绘制


		_c.appendTo("divchart")//在id为 divchart元素里绘制chart
		_c.rendering()//chart 渲染


4. 事件监听

		_c.on(eventname,callback)
		//现在支持的事件 measureclick measuremouseover 以上事件是mouse在legend上点击相应的item的时候引发
		//datamouseover dataclick 事件由鼠标在chart图标区域点击、经过相应的 line bar 以及boxplot 时引发 
		//callback(data) 回调函数会传入当前点击的对象 可以通过该对象获取点击目标的所有信息


5. 增加measure

		_c.addMeasure(measure)//chart如果已经渲染，增加measure后会自行重新渲染。
        

6. 调整宽高

		_c.setHeight(1000).setWidth(800);
        
---

## Measure
1. 创建

        measure = new SmartMeasure({
                    id: 1,    //相同id 的measure添加近同一chart会覆盖之前的measure
                    name: 1,   //legend上显示的名称
                    data: [{}],//可以再创建的时候指定data数组，数组格式请见 步骤2
                    type: "line",//支持的格式类型 line area range bar boxpolt 不同格式有不同的数据类型
                    mapkey: {  //如果给定data里数据格式与需求格式不一致需要设置map关系
                        x: "num",
                        y: "val",
                    },
                    style: {// 针对特定的measre设置不同的样式 ，不需要可不定义
                        linewidth: 4,
                        dasharray: "2,3",
                        color:"#aaa",//指定颜色
                        circleradius: 0.1//圆半径长度
                    },
                    config: {
                        yLabel: "速度"// tooltip 时候显示的数据单位名称不同类型有不同定义
                        legendIcon: "rect",//legend 上item的颜色标志显示圆圈还是矩形  默认圆圈
                        d0Label: "最大值",//定义boxplot的tooltip数据单位名称 不需要可不定义
                        d1Label: "3/4分位值",
                        d2Label: "中位数",
                        d3Label: "平均值",
                        d4Label: "1/4",
                        d5Label: "最小值"
                    }});

2. Data数据

			 line bar area 接收的格式[{x:"2010-3-3 10:20",y:"29"},{x:"2010-3-3 10:20",y:"29"}]
			 range [{x:"2010-3-3 10:20",y1:"29",y1:"20"},{x:"2010-3-3 10:20",y1:"23",y2:"10"}]
					 //(y1 显示在y2 之上  y1>y2)
			 boxplot[{
                    x: "2010-3-3 10:20",
                    d0: 20,
                    d1:18,
                    d2: 15，
                    d3: 10,
                    d4: 3,
                    d5: 1
                },{
                    x: "2010-3-3 10:25",
                    d0: 25,
                    d1:18,
                    d2: 14，
                    d3: 10,
                    d4: 5,
                    d5: 1
                }]
                //(d0>d1>d2>d3>d4>d5)
                
---

## 本地化
>chart本身不处理任何字符本地化，例如时间显示以及数字格式显示，时间以及数字显示格式请通过ui5或者其他库完成本地化。
chart会根据xy 轴的刻度字符串的长度自动调整chart的宽高，请设置合适的高度以及正确的xy轴格式化函数，不然chart无法绘制。
 
	