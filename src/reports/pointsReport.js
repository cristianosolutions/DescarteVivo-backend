const PDFDocument = require("pdfkit");

async function generatePointsReport(res, points) {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Disposition", 'attachment; filename="pontos_de_coleta.pdf"');
  res.setHeader("Content-Type", "application/pdf");

  doc.fontSize(20).text("DescarteVivo - Relatório de Pontos de Coleta", { align: "center" });
  doc.moveDown();

  points.forEach((p, index) => {
    doc.fontSize(14).text(`${index+1}. ${p.name}`);
    doc.fontSize(12).text(`Cidade: ${p.city}`);
    doc.text(`Endereço: ${p.address}`);
    doc.text(`Bairro: ${p.neighborhood}`);
    doc.moveDown();
  });

  doc.end();
  doc.pipe(res);
}
module.exports = generatePointsReport;
