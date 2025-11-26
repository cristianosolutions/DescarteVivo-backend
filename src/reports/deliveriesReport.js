const PDFDocument = require("pdfkit");

function generateDeliveriesReport(res, deliveries) {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Disposition", 'attachment; filename="relatorio_entregas.pdf"');
  res.setHeader("Content-Type", "application/pdf");

  doc.fontSize(20).text("DescarteVivo - Relatório de Entregas", { align: "center" });
  doc.moveDown();

  deliveries.forEach((d, index) => {
    doc.fontSize(14).text(`${index + 1}. Usuário: ${d.user_name}`);
    doc.fontSize(12).text(`Ponto: ${d.point_name}`);
    doc.text(`Resíduo: ${d.waste_name}`);
    doc.text(`Quantidade (kg): ${d.quantity_kg}`);
    doc.text(`Data: ${new Date(d.created_at).toLocaleString("pt-BR")}`);
    doc.moveDown();
  });

  doc.end();
  doc.pipe(res);
}

module.exports = generateDeliveriesReport;
