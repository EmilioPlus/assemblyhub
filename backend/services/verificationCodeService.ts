import Assembly from "../models/Assembly";
import User from "../models/User";
import Delegate from "../models/Delegate";
import VerificationCode from "../models/VerificationCode";
import { createEmailTransporter, getMailFrom } from "../utils/emailConfig";

// Función para generar código de verificación (6 dígitos)
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Función para enviar código de verificación por email
const sendVerificationCode = async (
  user: any,
  assembly: any,
  code: string
): Promise<boolean> => {
  try {
    const transporter = await createEmailTransporter();

    const mailOptions = {
      from: getMailFrom(),
      to: user.email,
      subject: `Código de verificación - ${assembly.name}`,
      html: `
        <p>Hola ${user.firstName} ${user.lastName},</p>
        <p>Tu código de verificación para acceder a la asamblea "${assembly.name}" es:</p>
        <h2 style="text-align: center; font-size: 32px; letter-spacing: 5px; color: #1976d2;">${code}</h2>
        <p>Este código expira en 2 horas.</p>
        <p>La asamblea iniciará en breve. Por favor, ten este código listo para acceder.</p>
        <p>Si no solicitaste este código, por favor ignora este mensaje.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Código de verificación enviado a ${user.email} para asamblea ${assembly.name}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Error al enviar código de verificación a ${user.email}:`, error);
    return false;
  }
};

// Función principal para enviar códigos 30 minutos antes del evento
export const sendVerificationCodesBeforeEvent = async (): Promise<void> => {
  try {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos desde ahora

    // Buscar asambleas que inician en aproximadamente 30 minutos (±2 minutos de margen)
    const twoMinutesBefore = new Date(thirtyMinutesFromNow.getTime() - 2 * 60 * 1000);
    const twoMinutesAfter = new Date(thirtyMinutesFromNow.getTime() + 2 * 60 * 1000);

    const assemblies = await Assembly.find({
      startDateTime: {
        $gte: twoMinutesBefore,
        $lte: twoMinutesAfter,
      },
      status: { $in: ["scheduled", "active"] },
    }).populate("participants");

    console.log(`🔍 Verificando asambleas para envío de códigos: ${assemblies.length} encontradas`);

    for (const assembly of assemblies) {
      try {
        // Obtener todos los participantes de la asamblea
        const participants = assembly.participants || [];

        for (const participantId of participants) {
          try {
            // Verificar si ya se envió un código reciente (últimos 35 minutos)
            const recentCode = await VerificationCode.findOne({
              assembly: assembly._id,
              participant: participantId,
              sentAt: {
                $gte: new Date(now.getTime() - 35 * 60 * 1000), // Últimos 35 minutos
              },
            });

            if (recentCode) {
              console.log(`⏭️  Código ya enviado recientemente para participante ${participantId} en asamblea ${assembly.name}`);
              continue;
            }

            // Obtener información del participante
            const participant = await User.findById(participantId);
            if (!participant) {
              console.log(`⚠️  Participante ${participantId} no encontrado`);
              continue;
            }

            // Verificar si el participante tiene un delegado autorizado
            const delegate = await Delegate.findOne({
              assembly: assembly._id,
              participant: participantId,
              "powerOfAttorneyValidation.status": "approved",
            }).populate("participant");

            // Si tiene delegado, enviar código al delegado también
            if (delegate) {
              // Generar código para el participante original (si es necesario)
              // Por ahora, solo enviamos al participante original
              // El delegado puede acceder con su documento cuando lo necesite
            }

            // Generar código de verificación
            const verificationCode = generateVerificationCode();
            const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 horas

            // Eliminar códigos anteriores no usados
            await VerificationCode.deleteMany({
              assembly: assembly._id,
              participant: participantId,
              isUsed: false,
            });

            // Crear nuevo código de verificación
            const verification = await VerificationCode.create({
              assembly: assembly._id,
              participant: participantId,
              email: participant.email,
              code: verificationCode,
              expiresAt: expiresAt,
              isUsed: false,
              attempts: 0,
              sentAt: now,
            });

            // Enviar código por email
            const emailSent = await sendVerificationCode(participant, assembly, verificationCode);

            if (emailSent) {
              console.log(`✅ Código de verificación enviado a ${participant.email} para asamblea ${assembly.name}`);
            } else {
              console.log(`❌ Error al enviar código a ${participant.email}`);
            }
          } catch (participantError: any) {
            console.error(`❌ Error procesando participante ${participantId}:`, participantError);
          }
        }

        // Procesar delegados autorizados
        const delegates = await Delegate.find({
          assembly: assembly._id,
          "powerOfAttorneyValidation.status": "approved",
        }).populate("participant");

        for (const delegate of delegates) {
          try {
            // Verificar si ya se envió un código reciente para este delegado
            const recentCode = await VerificationCode.findOne({
              assembly: assembly._id,
              participant: delegate.participant,
              sentAt: {
                $gte: new Date(now.getTime() - 35 * 60 * 1000),
              },
            });

            if (recentCode) {
              continue;
            }

            // Obtener información del participante original
            const participant = await User.findById(delegate.participant);
            if (!participant) {
              continue;
            }

            // Generar código de verificación para el delegado
            // El código se enviará al email del participante original
            // pero el delegado puede acceder con su documento
            const verificationCode = generateVerificationCode();
            const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000);

            // Eliminar códigos anteriores no usados
            await VerificationCode.deleteMany({
              assembly: assembly._id,
              participant: delegate.participant,
              isUsed: false,
            });

            // Crear nuevo código
            await VerificationCode.create({
              assembly: assembly._id,
              participant: delegate.participant,
              email: participant.email,
              code: verificationCode,
              expiresAt: expiresAt,
              isUsed: false,
              attempts: 0,
              sentAt: now,
            });

            // Enviar código por email al participante original
            // (El delegado puede usar este código o acceder con su documento)
            await sendVerificationCode(participant, assembly, verificationCode);
          } catch (delegateError: any) {
            console.error(`❌ Error procesando delegado:`, delegateError);
          }
        }
      } catch (assemblyError: any) {
        console.error(`❌ Error procesando asamblea ${assembly._id}:`, assemblyError);
      }
    }
  } catch (error: any) {
    console.error("❌ Error en sendVerificationCodesBeforeEvent:", error);
  }
};

export default sendVerificationCodesBeforeEvent;

