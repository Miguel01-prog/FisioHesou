import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/user.model.js";

dotenv.config();

const createSuperadmin = async () => {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log("Uso: node create-superadmin.js <Nombre> <Email> <Password>");
    console.log('Ejemplo: node create-superadmin.js "Super Admin" admin@fisiohesou.com MiSuperPassword123');
    process.exit(1);
  }

  const [name, email, password] = args;

  try {
    console.log("Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado exitosamente.");

    // Verificar si el email ya existe
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.error(`Error: El correo '${email}' ya está registrado.`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const superadmin = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "superadmin"
    });

    await superadmin.save();
    console.log("\n==========================================");
    console.log(`¡Superusuario creado con éxito!`);
    console.log(`Nombre:   ${name}`);
    console.log(`Email:    ${email.toLowerCase()}`);
    console.log(`Password: (La especificada)`);
    console.log(`Rol:      superadmin`);
    console.log("==========================================");

  } catch (error) {
    console.error("Error al crear superusuario:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createSuperadmin();
