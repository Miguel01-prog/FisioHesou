import { Router } from 'express';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

console.log('[auth.routes.js] cargado correctamente');


const router = Router();
const SECRET = process.env.JWT_SECRET || 'mi_secreto_superseguro'; // Usa variable de entorno

router.get('/test', (req, res) => {
  res.json({ message: 'Ruta /api/test funcionando' });
});


router.post('/register', async (req, res) => {
  console.log(' POST /api/register recibido', req.body);  // <--- agrega esto para depurar

  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role});
    await user.save();

    res.status(201).json({ message: 'Usuario creado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, role: user.role, name: user.name });
    console.log("Usuario logueado exitosamente:", user.email);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password Simple (por ID)
router.put('/reset-password/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'La nueva contraseña es obligatoria' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
