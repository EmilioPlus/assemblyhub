import mongoose, { Schema, Document } from "mongoose";

export interface IAssemblyAccessCode extends Document {
  assembly: mongoose.Types.ObjectId;
  accessCode: string; // Código único de acceso a la asamblea
  isActive: boolean; // Si el código está activo
  createdAt: Date;
  updatedAt: Date;
}

const AssemblyAccessCodeSchema = new Schema<IAssemblyAccessCode>(
  {
    assembly: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assembly",
      required: true,
      unique: true, // Una asamblea solo puede tener un código de acceso
      index: true,
    },
    accessCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice para búsqueda rápida por código de acceso
AssemblyAccessCodeSchema.index({ accessCode: 1, isActive: 1 });

export default mongoose.model<IAssemblyAccessCode>("AssemblyAccessCode", AssemblyAccessCodeSchema);

