import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import assemblyRoutes from "./routes/assembly.routes";
import roleRoutes from "./routes/role.routes";
import delegateRoutes from "./routes/delegate.routes";
import votingRoutes from "./routes/voting.routes";
import reportesRoutes from "./routes/reportes.routes";
import path from "path";

dotenv.config();

// Verificar variables de entorno críticas
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  ADVERTENCIA: JWT_SECRET no está configurado. El login fallará.");
  console.warn("💡 Crea un archivo .env con JWT_SECRET o exporta la variable de entorno.");
}

const app = express();

// Middlewares
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Conectar a MongoDB
connectDB().catch((error) => {
  console.error("❌ Error conectando a MongoDB:", error);
  console.error("💡 El servidor continuará, pero las operaciones de base de datos fallarán.");
  console.error("💡 Soluciones:");
  console.error("   1. Verifica que MongoDB esté instalado y corriendo");
  console.error("   2. En Windows: net start MongoDB");
  console.error("   3. O inicia MongoDB manualmente desde los servicios");
  console.error("   4. Verifica MONGO_URI en el archivo .env");
  // No hacer exit para que el servidor pueda mostrar errores más específicos
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assemblies", assemblyRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/delegates", delegateRoutes);
app.use("/api/votaciones", votingRoutes);
app.use("/api/reportes", reportesRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    msg: err.message || "Error del servidor",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

// Manejar errores de puerto en uso
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: El puerto ${PORT} ya está en uso.`);
    console.error(`💡 Soluciones:`);
    console.error(`   1. Cierra la otra instancia del servidor`);
    console.error(`   2. O cambia el puerto con: PORT=5001 npm run dev`);
    console.error(`   3. En Windows, ejecuta: netstat -ano | findstr :5000`);
    console.error(`      Luego: taskkill /PID <PID> /F`);
    process.exit(1);
  } else {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
});

