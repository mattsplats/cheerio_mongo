'use strict';

// Modules
const express    = require('express'),
      exphbs     = require('express-handlebars'),
      bodyParser = require('body-parser'),
      logger     = require('morgan'),
      mongoose   = require('mongoose'),
      Promise    = require('bluebird'),
      cheerio    = require('cheerio'),
      rp         = require('request-promise'),

      // Local dependencies
      Article    = require('./models/Article.js'),
      Comment    = require('./models/Comment.js'),
      localVars  = require('./mongodb_uri.json'),

      // Const vars
      app    = express(),
      hbs    = exphbs.create({ defaultLayout: 'main', extname: '.hbs' }),
      PORT   = process.env.PORT || 3000,
      DB_URI = process.env.MONGODB_URI || localVars.LOCAL_URI;

// Handlebars init
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
if (process.env.PORT) app.enable('view cache');  // Disable view cache for local testing

// Morgan for logging
app.use(logger('dev'));

// Body parser init
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());

// Route for static content
app.use(express.static(process.cwd() + '/public'));

// Mongoose init
mongoose.Promise = Promise;
mongoose.connect(DB_URI);
const db = mongoose.connection;

db.on('error', function (err) {
  console.log('Mongoose Error: ', err);
});

db.once('open', function () {
  console.log('Mongoose connection successful.');
});



// Routes
app.get('/', (req, res) => {
  rp('https://news.ycombinator.com/').then(html => {
    const $ = cheerio.load(html),
          promises = [];

    $("td.title").each(function(i, element) {
      const link = $(element).find("a").attr("href");
      
      if (link) {
        // Push new promise to promises
        promises.push(new Promise((resolve, reject) => {
          Article.update(
            { link: link },   // if link exists,
            { $setOnInsert:   // do not replace fields
              {
                title: 'Test',
                link: link
              }                 
            },
            {
              upsert: true,
              setDefaultsOnInsert: true
            }
          ).then(article => 
            resolve(article)
          );
        }));
      };
    });

    // When all updates are resolved, continue
    Promise.all(promises).then(() => 
      Article.find({}).populate('comments').exec((err, docs) => {
        console.log(docs[0]);
        res.render('index', {article: docs[0]})
      })
    );
  });
});

app.post('/', (req, res) => {
  Comment.create({comment: req.body.comment}).then(comment => {
    console.log(comment);
    Article.findOneAndUpdate(
      { _id: '584b472d96b3a0f2f41cd440' },
      { $push: { "comments": comment._id } }
    ).then(() => 
      res.json(comment)
    )
  })
});

app.delete('/', (req, res) => 
  Comment.remove({}).then(data => res.json(data))
);



// Init server
app.listen(PORT, function () {
  console.log(`App listening on port ${PORT}`);
});
