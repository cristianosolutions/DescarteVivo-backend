const express = require('express');
const PDFDocument = require('pdfkit');
const pool = require('../db');

const router = express.Router();

router.get('/points-report', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM collection_points ORDER BY created_at DESC');

    const doc = new PDFDocument();
    let filename = "pontos_de_coleta.pdf";
    filename = encodeURIComponent(filename);

    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.text('RELATÓRIO - PONTOS DE COLETA', { align: 'center' });
    doc.moveDown();

    result.rows.forEach((ponto, index) => {
      doc.text(`${index + 1}. ${ponto.name}`);
      doc.text(`Cidade: ${ponto.city}`);
      doc.text(`Endereço: ${ponto.address}`);
      doc.text(`Bairro: ${ponto.neighborhood}`);
      doc.text('------------------------------');
      doc.moveDown();
    });

    doc.pipe(res);
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao gerar relatório');
  } finally {
    client.release();
  }
});

module.exports = router;
