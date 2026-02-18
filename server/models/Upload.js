const mongoose = require("mongoose")

const uploadSchema = new mongoose.Schema({
  type: {
    type: String, // "file" or "text"
    required: true
  },
  filename: {
    type: String
  },
  filepath: {
    type: String
  },
  content: {
    type: String
  },
  fileSize: {
    type: Number
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model("Upload", uploadSchema)
