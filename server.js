console.log("server test");

// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
// var axios = require("axios");
var request = require("request");
var cheerio = require("cheerio");

// Require all models - could have made a new folder for routing, but will just include it in server file...
var Article = require("./models/Article.js");
var Comment = require("./models/Comment.js")


// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

var db = mongoose.connection;

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));



// Show mongoose errors
db.on("error", function(error) {
    console.log("Mongoose Error: ", error);
});

// Log a success message
db.once("open", function() {
    console.log("Mongoose connection successful");
});


// Handlebars - may or may not use
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({
  defaultLayout: "main",
  partialsDir: path.join(__dirname, "/views/layouts/partials")
}));

app.set("view engine", "handlebars");





// Routes


// Handlebars get request - render into homepage
app.get("/", function(request, response) {
  //load up to 10 articles and render with handlebars
  Article.find({"saved": false}).limit(10).exec(function(error, data) {
    var handlebarsObject = {
      article: data
    };
    // console.log(handlebarsObject);
    response.render("homepage", handlebarsObject);
  });
});


// Get route to show saved articles
app.get("/saved", function(request, response) {
  Article.find({"saved": true}).populate("comments").exec(function(error, articles) {
    var handlebarsObject = {
      article: articles
    };
    response.render("saved", handlebarsObject);
  });
});


// Get route to scrape New York Times website (news)
app.get("/scrape", function(request, res) {
  // grab NY Times html using request
  request("https://nytimes.com/", function(error, response, html) {
    // use Cheerio to save/load the html
    var $ = cheerio.load(html);

    // grab each NY times article - by the article tag
    $("article").each(function(i, element) {

      // result object from cheerio scrape - insert data into
      let result = {};

      // Get the Title, URL, and summary for each article and insert/save into result object
      result.title = $(this).children("h2").text();
      result.link = $(this).children("h2").children("a").attr("href");
      result.summary = $(this).children(".summary").text();


        // only add the article if is not already there
        // Article.count({ title: result.title}, function (err, test){
          //if the test is 0, the entry is unique and good to save
        // if(test == 0){}

      // create a new entry - save in the DB/Article model
      var entry = new Article(result);

      entry.save(function(error, doc) {
        // log errors
        if(error) {
          console.log(error);
        }
        // log the doc
        else {
          console.log(doc);
        }
      });
    });
    response.send("Scraped!");
  });
});


// Get the scraped articles from DB
app.get("/articles", function(request, response) {
  // find all articles (max of 10)
  Article.find({}).limit(10).exec(function(error, doc) {
    // log success/errors
    if(error) {
      console.log(error);
    }
    else {
      response.json(doc);
    }
  });
});


// Get article by it's ID
app.get("/articles/:id", function(request, response) {
  // find article with matching id
  Article.findOne({"_id": request.params.id})
    // populate associated comments
    .populate("comment")

    .exec(function(error, doc) {
      if(error) {
        console.log(error);
      }
      else {
        response.json(doc);
      }
    });
});


// Save an article
app.post("/articles/save/:id", function(request, response) {
  // find and article and save it
  Article.findOneAndUpdate({"_id": request.params.id}, {"saved": true})
  .exec(function(error, doc) {
    if(error) {
      console.log(error);
    }
    else {
      response.send(doc);
    }
  });
});


// Delete article

app.post("/articles/delete/:id", function(request, response) {
  // remove saved article and comments
  Article.findOneAndUpdate({"_id": req.params.id}, {"saved": false, "comments": []})
  .exec(function(error, doc) {
    if(error) {
      console.log(error);
    }
    else {
      response.send(doc);
    }
  });
});


// Create comment

app.post("/comments/save/:id", function(request, response) {
  // create comment and pass to DB assoicated with article
  var newComment = new Comment({
    body: request.body.text,
    article: request.params.id
  });
  console.log(request.body)

  newComment.save(function(error, comment) {
    if(error) {
      console.log(error);
    }
    else {
      Article.findOneAndUpdate({"_id": req.params.id}, {$push: {"comments": comment}})

      .exec(function(err) {
        if(err) {
          console.log(err);
        }
        else {
          response.send(comment);
        }
      });
    };
  });

});


// Delete note
app.delete("/notes/delete/:comment_id/:article_id", function(request, response) { 
  Comment.findOneAndRemove({ "_id": request.params.comment_id}, function(err) {
    if(err) {
      console.log(err)
      res.send(err);
    }
    else {
      Article.findOneAndUpdate({"_id": request.params.article_id}, {$pull: {"comments": request.params.comment_id}})
    
      if(err) {
        console.log(err)
        res.send(err);
      }
      else {
        res.send("Comment Deleted")
      }
    }
  });
});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});









