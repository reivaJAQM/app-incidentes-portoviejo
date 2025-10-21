// server.js (COMPLETO Y CORREGIDO)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// --- Configuración de Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'incidentes-portoviejo',
    format: async (req, file) => 'jpg',
    public_id: (req, file) => new Date().toISOString(),
  },
});

const upload = multer({ storage: storage });
// --- Fin de Configuración ---

const app = express();
app.use(cors());
app.use(express.json());

// --- Conexión a MongoDB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

// --- Molde de Usuario ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

// --- Molde de Comentario ---
const comentarioSchema = new mongoose.Schema({
  texto: { type: String, required: true },
  incidente: { type: mongoose.Schema.Types.ObjectId, ref: 'Incidente' },
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Comentario = mongoose.model('Comentario', comentarioSchema);

// --- Molde de Incidente ---
const incidenteSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  tipoIncidente: { type: String, required: true },
  ubicacion: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  estado: { type: String, default: 'Enviado' },
  imageUrl: { type: String },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Campo de Likes
  autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comentarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comentario' }]
}, { timestamps: true });

const Incidente = mongoose.model('Incidente', incidenteSchema);


// ===============================================
// --- MIDDLEWARE DE AUTENTICACIÓN ---
// ===============================================
const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No hay token, autorización denegada.' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No hay token, autorización denegada.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token no es válido.' });
  }
};

// ===============================================
// --- RUTAS DE AUTENTICACIÓN (AUTH) ---
// ===============================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'El email o nombre de usuario ya existe.' });
    }
    user = new User({ username, email, password });
    await user.save();
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas.' });
    }
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// ===============================================
// --- RUTAS DE INCIDENTES ---
// ===============================================

// POST /api/incidentes (Crear incidente)
app.post('/api/incidentes', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const nuevoIncidente = new Incidente({
      descripcion: req.body.descripcion,
      tipoIncidente: req.body.tipoIncidente,
      ubicacion: { coordinates: [req.body.longitud, req.body.latitud] },
      imageUrl: req.file ? req.file.path : undefined,
      autor: req.user.id
    });
    await nuevoIncidente.save();
    res.status(201).json({ message: 'Incidente reportado con éxito', data: nuevoIncidente });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el incidente', error: error.message });
  }
});

// GET /api/incidentes (Feed con filtro de categoría)
app.get('/api/incidentes', async (req, res) => {
  try {
    const { tipo } = req.query;
    const filtro = {};
    if (tipo && tipo !== 'Todos') {
      filtro.tipoIncidente = tipo;
    }
    const todosLosIncidentes = await Incidente.find(filtro)
      .sort({ createdAt: -1 })
      .populate('autor', 'username');
    res.status(200).json(todosLosIncidentes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los incidentes', error: error.message });
  }
});

// --- RUTA QUE ESTÁ FALLANDO (CORREGIDA) ---
// GET /api/incidentes/mis-reportes
app.get('/api/incidentes/mis-reportes', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // La única diferencia es que esta ruta también poblará los 'likes'
    // para que la tarjeta funcione correctamente.
    const misReportes = await Incidente.find({ autor: userId })
      .sort({ createdAt: -1 })
      .populate('autor', 'username')
      .populate('likes'); // <-- Esto podría haber faltado
      
    res.status(200).json(misReportes);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});
// --- FIN DE LA RUTA CORREGIDA ---

// GET /api/incidentes/:id (Detalles)
app.get('/api/incidentes/:id', async (req, res) => {
  try {
    const incidente = await Incidente.findById(req.params.id)
      .populate('autor', 'username')
      .populate('likes') // <-- Asegurémonos de poblar likes aquí también
      .populate({
        path: 'comentarios',
        populate: {
          path: 'autor',
          select: 'username'
        }
      });
    
    if (!incidente) {
      return res.status(404).json({ message: 'Incidente no encontrado' });
    }
    res.status(200).json(incidente);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el incidente', error: error.message });
  }
});

// POST /api/incidentes/:id/comentarios (Crear comentario)
app.post('/api/incidentes/:id/comentarios', authMiddleware, async (req, res) => {
  try {
    const incidente = await Incidente.findById(req.params.id);
    if (!incidente) {
      return res.status(404).json({ message: 'Incidente no encontrado' });
    }
    const nuevoComentario = new Comentario({
      texto: req.body.texto,
      incidente: incidente._id,
      autor: req.user.id
    });
    await nuevoComentario.save();
    incidente.comentarios.push(nuevoComentario._id);
    await incidente.save();
    
    const comentarioPoblado = await Comentario.findById(nuevoComentario._id)
                                    .populate('autor', 'username');
    res.status(201).json(comentarioPoblado);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el comentario', error: error.message });
  }
});

// POST /api/incidentes/:id/like (Dar/Quitar Like)
app.post('/api/incidentes/:id/like', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const incidente = await Incidente.findById(req.params.id);
    if (!incidente) {
      return res.status(404).json({ message: 'Incidente no encontrado' });
    }
    const hasLiked = incidente.likes.some(likeId => likeId.toString() === userId);
    if (hasLiked) {
      incidente.likes = incidente.likes.filter(likeId => likeId.toString() !== userId);
    } else {
      incidente.likes.push(userId);
    }
    await incidente.save();

    // Devolvemos el incidente completo, poblado igual que en 'detalles'
    const incidenteActualizado = await Incidente.findById(incidente._id)
      .populate('autor', 'username')
      .populate('likes')
      .populate({
        path: 'comentarios',
        populate: { path: 'autor', select: 'username' }
      });
    res.status(200).json(incidenteActualizado);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// --- Iniciar Servidor ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
