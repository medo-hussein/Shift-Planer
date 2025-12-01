import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  // This forces the app to stop if the connection fails.
  // 1 means the process exited due to an error.
  // It’s safer to stop here than let your server run without a database connection.
    process.exit(1);
  }
};

export default connectDB;
