import app from './app.js';
import { connectDB } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

connectDB();


const PORT = process.env.PORT || 5000;

// Iniciamos el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto: ${PORT}`);
});
