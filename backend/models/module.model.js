import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  path: { type: String, required: true },
  icon: { type: String, required: true },
  parentKey: { type: String, default: null },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.model("Module", moduleSchema);
