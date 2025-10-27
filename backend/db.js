import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conexión exitosa a MongoDB Atlas");
  } catch (e) {
    console.error("Error al conectar con MongoDB Atlas:", e);
  }
};
