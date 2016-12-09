'use strict';

const mongoose = require("mongoose"),
      Schema   = mongoose.Schema;

const NoteSchema = new Schema({
  title: {
    type: String
  },
  body: {
    type: String
  }
});

module.exports = mongoose.model("Note", NoteSchema);
