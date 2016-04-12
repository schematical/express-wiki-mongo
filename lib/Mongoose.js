var async = require('async');
var _ = require('underscore');
module.exports = MongooseDataStore = function(options){
	options = options || {};
	if(options.mongoose) {
		this.mongoose = options.mongoose;
	}else if(options.config) {
		this.mongoose = require('mongoose');
		this.mongoose.connect(options.config);
	}else{
		throw new Error("No valid 'config' option passed in. Where should we save this stuff?");
	}

	if(options.schema) {
		this.schema = options.schema
	} else {
		//Create one
		//Rock that plugin
		this.schema = new this.mongoose.Schema({ });
	}
	this.modelName = options.modelName || 'WikiRecord';
	MongooseDataStore.plugin(this.schema, options.mongoosePluginOptions || {})
	this.Model = this.mongoose.model(this.modelName, this.schema);
	return this;
}
MongooseDataStore.plugin = function plugin (schema, options) {
	schema.add({
		"path": String,
		"title": String,
		"markdown":String
	});

	/*schema.pre('save', function (next) {
		this.lastMod = new Date
		next()
	})
	if (options && options.index) {
		schema.path('lastMod').index(options.index)
	}*/
}
MongooseDataStore.prototype.save = function(wiki_path, record, callback){
	var _this = this;
	var model = null;
	record.path = wiki_path;

	return async.series([
	    function(cb){
				return _this.load(wiki_path, function(err, _model){
					if(err) return callback(err);

					model = _model;
					return cb();
				})
	    },
			function(cb){
				if(!model){
					model = new _this.Model(record);
				}else{
					model.markdown = record.markdown;
					model.title = record.title;
					model.path = record.path;
				}

				return model.save(function(err){
					if(err) return callback(err);
					return cb();
				});
			}
	],
	function(){
	    //end async
		return callback(null, model);
	});


}
MongooseDataStore.prototype.load = function(wiki_path, callback){
	return this.Model.findOne(
			{
				"path":wiki_path
			},
			callback
	);
}
MongooseDataStore.prototype.index = function(wiki_dir, callback){
	var full_dir = path.join(this.dir, wiki_dir);

	if(!fs.existsSync(full_dir)) {
		return callback(null, null, null);
	}
	var files = fs.readdirSync(full_dir);

	var response = [];
	for(var i in files){
		var payload = {
			path: path.join(wiki_dir || '/', files[i])
		}
		var file_path = path.join(full_dir, files[i]);
		var file_info = fs.statSync(file_path);
		if(file_info.isFile()) {
			payload.type = 'post';
			var file_cont = fs.readFileSync(file_path);
			var record = null;
			try {
				record = JSON.parse(file_cont)
			} catch (err) {
				return callback(err);
			}
			payload.title = record.title;
		}else{
			payload.title = payload.path;
			payload.type = 'dir';
		}
		response.push(payload);
	}
	return callback(
			null,
			response
	);

}
