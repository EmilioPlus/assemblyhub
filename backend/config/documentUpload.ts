import multer from "multer";
import path from "path";
import fs from "fs";

// Crear directorio si no existe
const uploadDir = "uploads/assembly-documents";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento para documentos de asamblea
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `assembly-doc-${uniqueSuffix}${ext}`);
  },
});

// Validación de archivos para documentos de asamblea
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Permitir PDF, JPG, PNG
  const allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("El formato del archivo no es válido. Solo se permiten archivos PDF, JPG o PNG."));
  }
};

export const documentUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Middleware para manejar errores de multer
export const handleDocumentUploadError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        msg: "El archivo supera el tamaño máximo permitido (10MB).",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        msg: "Campo de archivo inesperado.",
      });
    }
  }
  if (err) {
    return res.status(400).json({
      msg: err.message || "Error al procesar el archivo",
    });
  }
  next();
};

export default documentUpload;

