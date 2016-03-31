
module.exports = MongooseDataStore = function(options){
	options = options || {};
	if(!options.mongoose) {
		this.mongoose = options.mongoose;
	}else if(options.config) {
		this.mongoose = require('mongoose');
		this.mongoose.connect(options.config);
	}else if(options.schema) {
		this.schema = options.schema
	}else{
			throw new Error("No valid 'config' option passed in. Where should we save this stuff?");
	}
	if(!this.schema) {
		//Create one

	}
	return this;
}
MongooseDataStore.plugin = function plugin (schema, options) {
	schema.add({
		"path": String,
		"name": String,
		"contents":String
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
	record.path = wiki_path;
	var full_path = path.join(this.dir, wiki_path);
	var full_dir = path.dirname(full_path);
	if(!fs.existsSync(full_dir)) {
		mkdirp.sync(full_dir);
	}
	var file_cont = JSON.stringify(record);
	return fs.writeFile(full_path, file_cont, callback);
}
MongooseDataStore.prototype.load = function(wiki_path, callback){
	var full_path = path.join(this.dir, wiki_path);
	var full_dir = path.dirname(full_path);
	if(!fs.existsSync(full_dir)) {
		return callback(null, null, null);
	}
	return fs.readFile(full_path, function(err, file_cont){
		if(err) return callback(null);
		var record = null;
		try{
			record = JSON.parse(file_cont);
		}catch(err){
			return callback(err);
		}
		return callback(
				null,
				record,
				file_cont
		);
	});
}
MongooseDataStore.prototype.index = function(wiki_dir, callback){
	var full_dir = path.join(this.dir, wiki_dir);
	console.log('full_dir', full_dir);
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
