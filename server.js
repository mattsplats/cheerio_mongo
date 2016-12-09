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
      Note       = require('./models/Note.js'),
      Article    = require('./models/Article.js'),
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
    const $      = cheerio.load(html),
          links  = [],
          result = [];

    $("td.title").each(function(i, element) {
      const link = $(element).find("a").attr("href");
      if (link) links.push({ link: link });
    });

    for (let i = 0; i < 10; i++) result.push(links[i]);

    Note.find({}).then(comments => {
      res.render('index', {result: result, comments: comments});
    });
  });
});

app.post('/', (req, res) =>
  Note.create({comment: req.body.comment}).then(comment => res.json(comment))
);

app.delete('/', (req, res) => 
  Note.remove({}).then(data => res.json(data))
);



// Init server
app.listen(PORT, function () {
  console.log(`App listening on port ${PORT}`);
});
