const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // createdAt과 updatedAt 자동 생성
});

module.exports = mongoose.model('Todo', todoSchema);

