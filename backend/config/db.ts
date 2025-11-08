import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/assemblyhub";
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  } catch (error: any) {
    console.error("❌ MongoDB connection error:", error);
    console.error("💡 Asegúrate de que MongoDB esté corriendo:");
    console.error("   - En Windows: net start MongoDB");
    console.error("   - O inicia MongoDB manualmente");
    throw error;
  }
};

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

export default connectDB;
