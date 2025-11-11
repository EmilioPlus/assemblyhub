import nodemailer from "nodemailer";

/**
 * Crea y retorna un transporter de nodemailer configurado para Gmail o el servicio SMTP especificado
 * @returns Transporter configurado de nodemailer
 */
export const createEmailTransporter = async () => {
  const smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // Si no hay credenciales configuradas, usar Ethereal para pruebas
  if (!smtpUser || !smtpPass) {
    console.warn("⚠️  SMTP_USER/SMTP_PASS no configurados. Usando cuenta Ethereal temporal para pruebas.");
    const testAccount = await (nodemailer as any).createTestAccount();
    
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Configuración para Gmail
  const isGmail = smtpHost.includes("gmail.com");
  
  // Configuración base del transporter
  const transporterConfig: any = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true para 465, false para otros puertos
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };

  // Para Gmail con puerto 587, necesitamos requireTLS
  if (isGmail && smtpPort === 587) {
    transporterConfig.requireTLS = true;
    transporterConfig.secure = false;
  }

  // Para Gmail con puerto 465, usar SSL
  if (isGmail && smtpPort === 465) {
    transporterConfig.secure = true;
  }

  // Configuración adicional para mejorar la compatibilidad
  transporterConfig.tls = {
    rejectUnauthorized: false, // Solo para desarrollo, en producción debería ser true
  };

  const transporter = nodemailer.createTransport(transporterConfig);

  // Verificar la conexión
  try {
    await transporter.verify();
    console.log("✅ Servidor SMTP verificado correctamente");
  } catch (error: any) {
    console.error("❌ Error al verificar servidor SMTP:", error.message);
    if (error.code === "EAUTH") {
      console.error("💡 Verifica que SMTP_USER y SMTP_PASS sean correctos");
      console.error("💡 Para Gmail, asegúrate de usar una 'Contraseña de aplicación' en lugar de tu contraseña normal");
    }
  }

  return transporter;
};

/**
 * Obtiene la URL de preview del mensaje (solo para Ethereal)
 * @param info - Información del mensaje enviado
 * @returns URL de preview o null
 */
export const getPreviewUrl = (info: any): string | null => {
  return (nodemailer as any).getTestMessageUrl?.(info) || null;
};

/**
 * Obtiene el remitente configurado
 * @returns Dirección de correo del remitente
 */
export const getMailFrom = (): string => {
  return process.env.MAIL_FROM || "AssemblyHub <no-reply@assemblyhub.local>";
};

