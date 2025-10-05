import mongoose from "mongoose";
export const connectDB = async () => 
{   try 
    {
        await mongoose.connect("mongodb://localhost/fisio");
        console.log("Conexion exitosa a la base de datos");
    } catch (e) 
    {
        console.error(e);
    } 
    
};