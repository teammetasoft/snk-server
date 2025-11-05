const mongoose = require("mongoose");
const uri = process.env.URI;

const connectDb = async () => {
  mongoose.connect(uri)
  .then(() => {
    console.log('Connected to database');
    // Your code here
  })
  .catch((error) => {
    console.log(error.message);
    console.error('Error connecting to database:', error);
  });
};

module.exports = { connectDb };
