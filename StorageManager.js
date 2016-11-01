function createDB (name,version,des,size,callback){
    version=version || "1.0";
    des =des|| name;
    size = size|| 1024*1024*4;
    var db=openDatabase(name,version,des,size,function(){
        callback(db);
    });
}
function executeSQL(db,str,callback){
    db.transaction(function(tx){
        tx.executeSql(str,[],callback);
    })
}
function createTable(db,tablename,entites,callback){
   var _t= "CREATE TABLE IF NOT EXISTS "+tablename+ "("+Object.keys(entites).join(",").replace("id","id unique")+")";
   executeSQL(db,_t,callback);
}

function addEntity (db,table,entity,callback){
    var _="INSERT INTO "+table + "("+Object.keys(entity).join(",")+") VALUES ("+Object.values(entity).map(function(d){return "'"+d+"'"}).join(",")+")";
    executeSQL(db,_,callback);
}
function getAllEntities(db,table,entity,callback){
    var _="SELECT * FROM "+table;
    executeSQL(db,_,function(ctx,results){
      var len = results.rows.length, i,res=[];
      for ( i = 0; i < len; i++){
         var o=Object.create(entity);
         Object.keys(entity).forEach(function(k){
             o[k]= results.rows.item(i)[k]
         });
         res.push(o);
      }
      callback(res);
    });
}
var  StorageManage=function(name,version,des,size){
    var self=this;
    createDB(name,version,des,size,function(db){
        self.db=db;
    })
};
function register(entityname,entity,fn){
    this._d=this._d || [];
    this._d.push({id:entityname,entity:entity});
    createTable(this.db,entityname,entity,fn);
}
function addData(entityname,entity,fn){
    addEntity(this.db,entityname,entity,fn);
}
function getAllData(entityname,fn){
    var o=this._d.find(function(d){return d.id===entityname});
    getAllEntities(this.db,entityname,o.entity,fn);
}
StorageManage.prototype.register=register;
StorageManage.prototype.addData=addData;
StorageManage.prototype.getAllData=getAllData;