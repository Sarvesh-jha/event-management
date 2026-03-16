const PDFDocument = require('pdfkit');

const collectPdfBuffer = (document) =>
  new Promise((resolve, reject) => {
    const chunks = [];

    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
  });

const generateCertificateBuffer = async ({ registration, user, event }) => {
  const document = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margin: 40,
  });

  const bufferPromise = collectPdfBuffer(document);

  document.rect(0, 0, 842, 595).fill('#f8f7f1');
  document.fillColor('#0f172a');
  document
    .fontSize(18)
    .text('Smart Campus Events', 50, 45, { align: 'center' });

  document
    .fontSize(32)
    .fillColor('#0b3b60')
    .text('Certificate of Participation', 50, 110, { align: 'center' });

  document
    .fillColor('#475569')
    .fontSize(16)
    .text('This certificate is proudly presented to', 50, 190, { align: 'center' });

  document
    .fillColor('#111827')
    .fontSize(28)
    .text(user.fullName, 50, 230, { align: 'center' });

  document
    .fillColor('#475569')
    .fontSize(16)
    .text(
      `for participating in ${event.title} held on ${new Date(event.startDate).toLocaleDateString()}.`,
      90,
      290,
      { align: 'center' },
    );

  document
    .fontSize(13)
    .text(`Certificate No: ${registration.certificateNumber}`, 70, 430);
  document
    .text(`Issued On: ${new Date(registration.certificateIssuedAt).toLocaleDateString()}`, 70, 455);

  document
    .fontSize(13)
    .text(event.organizer, 620, 430, { width: 140, align: 'center' });
  document
    .moveTo(610, 425)
    .lineTo(760, 425)
    .strokeColor('#94a3b8')
    .stroke();
  document
    .fillColor('#475569')
    .text('Organizer Signature', 620, 455, { width: 140, align: 'center' });

  document.end();

  return bufferPromise;
};

module.exports = {
  generateCertificateBuffer,
};
