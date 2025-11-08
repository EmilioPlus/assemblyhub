import { Router, Request, Response } from "express";
import { authMiddleware, requireAdmin } from "../utils/authMiddleware";
import Assembly from "../models/Assembly";
import User from "../models/User";
import Delegate from "../models/Delegate";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const router = Router();

// Generar y exportar reporte
router.post("/exportar", authMiddleware, requireAdmin, async (req: any, res: Response) => {
  try {
    const { tipo, formato } = req.body;

    if (!tipo || !formato) {
      return res.status(400).json({ error: "Tipo y formato de reporte son requeridos" });
    }

    if (!["resultados", "participantes", "asamblea"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo de reporte inválido" });
    }

    if (!["pdf", "excel"].includes(formato)) {
      return res.status(400).json({ error: "Formato de reporte inválido" });
    }

    let data: any[] = [];
    let title = "";

    // Obtener datos según el tipo de reporte
    switch (tipo) {
      case "resultados":
        title = "Reporte de Resultados";
        const assemblies = await Assembly.find()
          .populate("createdBy", "firstName lastName email")
          .populate("participants", "firstName lastName email")
          .sort({ createdAt: -1 });
        data = assemblies.map((a: any) => ({
          nombre: a.name,
          tipo: a.processType,
          fechaInicio: new Date(a.startDateTime).toLocaleString(),
          fechaCierre: new Date(a.endDateTime).toLocaleString(),
          estado: a.status,
          creadoPor: `${a.createdBy?.firstName || ""} ${a.createdBy?.lastName || ""}`,
          participantes: a.participants?.length || 0,
        }));
        break;

      case "participantes":
        title = "Reporte de Participantes";
        const users = await User.find().select("firstName lastName email role createdAt");
        data = users.map((u: any) => ({
          nombre: `${u.firstName} ${u.lastName}`,
          email: u.email,
          rol: u.role,
          fechaRegistro: new Date(u.createdAt).toLocaleString(),
        }));
        break;

      case "asamblea":
        title = "Reporte de Asambleas";
        const allAssemblies = await Assembly.find()
          .populate("createdBy", "firstName lastName email")
          .populate("participants", "firstName lastName email")
          .sort({ createdAt: -1 });
        data = allAssemblies.map((a: any) => ({
          nombre: a.name,
          descripcion: a.description || "Sin descripción",
          tipo: a.processType,
          fechaInicio: new Date(a.startDateTime).toLocaleString(),
          fechaCierre: new Date(a.endDateTime).toLocaleString(),
          estado: a.status,
          creadoPor: `${a.createdBy?.firstName || ""} ${a.createdBy?.lastName || ""}`,
          participantes: a.participants?.length || 0,
          fechaCreacion: new Date(a.createdAt).toLocaleString(),
        }));
        break;
    }

    if (formato === "pdf") {
      // Generar PDF
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="reporte_${tipo}_${Date.now()}.pdf"`);

      doc.pipe(res);

      // Título
      doc.fontSize(20).text(title, { align: "center" });
      doc.moveDown();

      // Fecha de generación
      doc.fontSize(10).text(`Generado el: ${new Date().toLocaleString()}`, { align: "right" });
      doc.moveDown(2);

      // Tabla de datos
      if (data.length === 0) {
        doc.fontSize(12).text("No hay datos para mostrar", { align: "center" });
      } else {
        const headers = Object.keys(data[0]);
        let yPosition = doc.y;

        // Encabezados
        doc.fontSize(12).font("Helvetica-Bold");
        headers.forEach((header, index) => {
          const xPosition = 50 + (index * 120);
          doc.text(header.charAt(0).toUpperCase() + header.slice(1), xPosition, yPosition, { width: 110, align: "left" });
        });

        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 10;

        // Datos
        doc.fontSize(10).font("Helvetica");
        data.forEach((row) => {
          if (yPosition > 750) {
            doc.addPage();
            yPosition = 50;
          }
          headers.forEach((header, index) => {
            const xPosition = 50 + (index * 120);
            const value = String(row[header] || "");
            doc.text(value.substring(0, 15), xPosition, yPosition, { width: 110, align: "left" });
          });
          yPosition += 15;
        });
      }

      doc.end();
    } else if (formato === "excel") {
      // Generar Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(title);

      // Estilo de encabezado
      const headerStyle = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1976D2" },
        },
        alignment: { horizontal: "center", vertical: "middle" },
      };

      if (data.length === 0) {
        worksheet.addRow(["No hay datos para mostrar"]);
      } else {
        // Agregar encabezados
        const headers = Object.keys(data[0]);
        const headerRow = worksheet.addRow(headers.map((h) => h.charAt(0).toUpperCase() + h.slice(1).replace(/([A-Z])/g, " $1")));
        headerRow.eachCell((cell) => {
          cell.style = headerStyle;
        });

        // Agregar datos
        data.forEach((row) => {
          const values = headers.map((header) => row[header] || "");
          worksheet.addRow(values);
        });

        // Ajustar ancho de columnas
        worksheet.columns.forEach((column) => {
          let maxLength = 10;
          column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = maxLength < 30 ? maxLength + 2 : 30;
        });
      }

      // Fecha de generación
      worksheet.addRow([]);
      worksheet.addRow([`Generado el: ${new Date().toLocaleString()}`]);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="reporte_${tipo}_${Date.now()}.xlsx"`);

      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error: any) {
    console.error("Error al generar reporte:", error);
    res.status(500).json({ error: "Error al generar el archivo" });
  }
});

export default router;

