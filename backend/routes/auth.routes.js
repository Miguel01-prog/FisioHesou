import { Router } from 'express';
import User from '../models/user.model.js';
import Client from '../models/client.model.js';
import bcrypt from 'bcryptjs'; 
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, checkRole } from '../libs/auth.middleware.js';

console.log('[auth.routes.js] cargado correctamente');


const router = Router();
const SECRET = process.env.JWT_SECRET || 'mi_secreto_superseguro'; // Usa variable de entorno

router.get('/test', (req, res) => {
  res.json({ message: 'Ruta /api/test funcionando' });
});


router.post('/register', verifyToken, checkRole('superadmin'), async (req, res) => {
  console.log(' POST /api/register recibido', req.body);  // <--- agrega esto para depurar
  try {
    const { email, password, role, name, clientId } = req.body;

    if (!email || !password || !role || !name) {
      return res.status(400).json({ message: 'Faltan campos obligatorios (email, password, role, name)' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Si no se envió clientId explícito, asociar la primera clínica existente
    let assignedClientId = clientId;
    if (!assignedClientId) {
      const defaultClient = await Client.findOne();
      if (defaultClient) assignedClientId = defaultClient._id;
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      clientId: assignedClientId || undefined
    });

    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado correctamente', userId: newUser._id });
  } catch (err) {
    console.error('Error al registrar usuario:', err);
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

    const user = await User.findOne({ email }).populate("clientId");
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

    let clientObj = user.clientId;
    if (!clientObj) {
      const defaultClient = await Client.findOne();
      if (defaultClient) {
        user.clientId = defaultClient._id;
        await user.save();
        clientObj = defaultClient;
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, clientId: clientObj ? clientObj._id : null },
      SECRET,
      { expiresIn: '12h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 12 * 60 * 60 * 1000 // 12 hours
    });

    res.json({ role: user.role, name: user.name, client: clientObj, token });
    console.log("Usuario logueado exitosamente:", user.email);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.json({ message: 'Sesión cerrada correctamente' });
});

// Obtener datos del usuario actual
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("clientId");
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    let clientData = user.clientId;
    if (!clientData) {
      const defaultClient = await Client.findOne();
      if (defaultClient) {
        user.clientId = defaultClient._id;
        await user.save();
        clientData = defaultClient;
      }
    }

    res.json({ role: user.role, name: user.name, email: user.email, id: user._id, client: clientData, signature: user.signature });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password Simple (por ID) - Protegido solo para superadmin
router.put('/reset-password/:id', verifyToken, checkRole('superadmin'), async (req, res) => {
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

// Cambiar contraseña (el propio usuario logueado)
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'La contraseña actual y la nueva son obligatorias' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar la contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
    }

    // Hashear y guardar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar perfil (nombre, email, y/o nueva contraseña)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, newPassword, signature } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (name) user.name = name;
    
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({ message: 'El correo electrónico ya está en uso por otro usuario' });
      }
      user.email = email.toLowerCase();
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    if (signature !== undefined) {
      user.signature = signature;
    }

    await user.save();

    res.json({ 
      message: 'Perfil actualizado correctamente', 
      user: { name: user.name, email: user.email, role: user.role, signature: user.signature } 
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los usuarios especialistas (solo superadmin)
router.get('/users', verifyToken, checkRole('superadmin'), async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'superadmin' } }).populate('clientId').select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
