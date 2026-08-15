import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['fisioterapeuta', 'nutriologa', 'superadmin'], 
    required: true 
  },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  signature: { type: String, default: "" }
});

export default mongoose.model('User', userSchema);
