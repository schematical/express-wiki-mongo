# express-wiki-mongo
A mongo data store for my other npm module `express-wiki` found at https://github.com/schematical/express-wiki.

##Setup:
###Pass it an existing Mongoose Object:
```
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

app.use('/wiki', expressWiki({
    datastore: new ExpressWikiMongoose({
        mongoose: mongoose,
        modelName:'WikiRecord'//Optional
    })
}));
```

