const PDFDocument = require("pdfkit");

function generateUsersReport(res, users) {
  const doc = new PDFDocument({ margin: 40 });

  res.setHeader("Content-Disposition", 'attachment; filename="relatorio_usuarios.pdf"');
  res.setHeader("Content-Type", "application/pdf");

  doc.fontSize(20).text("DescarteVivo - Relatório de Usuários", { align: "center" });
  doc.moveDown();

  users.forEach((u, index) => {
    doc.fontSize(14).text(`${index + 1}. ${u.name}`);
    doc.fontSize(12).text(`Email: ${u.email}`);
    doc.text(`Função: ${u.role}`);
    doc.text(`Criado em: ${new Date(u.created_at).toLocaleString("pt-BR")}`);
    doc.moveDown();
  });

  doc.end();
  doc.pipe(res);
}

module.exports = generateUsersReport;
