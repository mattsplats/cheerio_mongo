'use strict';

const mongoose = require("mongoose"),
      Schema   = mongoose.Schema;

const ArticleSchema = new Schema({
  title: {
    type: String
  },
  body: {
    type: String
  }
});

module.exports = mongoose.model("Article", ArticleSchema);
