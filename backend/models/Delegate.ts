import mongoose, { Schema, Document } from "mongoose";

export interface IDelegate extends Document {
  participant: mongoose.Types.ObjectId; // Usuario que registra el delegado
  assembly: mongoose.Types.ObjectId; // Asamblea para la que se registra
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName?: string;
  documentType: string;
  documentNumber: string;
  email: string;
  sharesDelegated: number;
  powerOfAttorneyFile: string; // Path al archivo PDF
  powerOfAttorneyValidation: {
    status: "pending" | "approved" | "rejected";
    validatedBy?: mongoose.Types.ObjectId;
    validatedAt?: Date;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DelegateSchema = new Schema<IDelegate>(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assembly: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assembly",
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    secondName: {
      type: String,
      trim: true,
    },
    firstLastName: {
      type: String,
      required: true,
      trim: true,
    },
    secondLastName: {
      type: String,
      trim: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: ["CC", "CE", "PA", "TI"], // Cédula, Cédula Extranjería, Pasaporte, Tarjeta Identidad
    },
    documentNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    sharesDelegated: {
      type: Number,
      required: true,
      min: 1,
    },
    powerOfAttorneyFile: {
      type: String,
      required: true,
    },
    powerOfAttorneyValidation: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      validatedAt: {
        type: Date,
      },
      notes: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para asegurar que un participante solo tiene un delegado por asamblea
DelegateSchema.index({ participant: 1, assembly: 1 }, { unique: true });

// Índice para prevenir duplicados de documento del delegado en la misma asamblea
DelegateSchema.index({ assembly: 1, documentNumber: 1 }, { unique: true });

export default mongoose.model<IDelegate>("Delegate", DelegateSchema);
