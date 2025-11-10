import multer from "multer";
import path from "path";
import fs from "fs";

// Crear directorios si no existen (usando rutas absolutas)
const uploadsDir = path.join(process.cwd(), "uploads");
const uploadDir = path.join(process.cwd(), "uploads", "delegates");

// Crear directorio uploads si no existe
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`✅ Directorio creado: ${uploadsDir}`);
}

// Crear directorio delegates si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`✅ Directorio creado: ${uploadDir}`);
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Asegurar que el directorio exista antes de guardar
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`✅ Directorio creado (en destination): ${uploadDir}`);
      }
      // Usar ruta relativa para multer (desde process.cwd())
      cb(null, path.join("uploads", "delegates"));
    } catch (error) {
      console.error("Error al crear directorio de uploads:", error);
      cb(error as Error, path.join("uploads", "delegates"));
    }
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Validación de archivos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Solo permitir PDFs
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("El formato del archivo no es válido. Solo se permiten archivos PDF."));
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export default upload;
