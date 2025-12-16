const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Generate invoice PDF
exports.generateInvoicePDF = async (bill, guest, reservation, room) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `invoice_${bill._id}_${Date.now()}.pdf`;
      const filepath = path.join(__dirname, '../temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);
      
      // Header
      doc.fontSize(20).text('LuxuryStay Hospitality', { align: 'center' });
      doc.fontSize(14).text('Invoice', { align: 'center' });
      doc.moveDown();
      
      // Hotel Info
      doc.fontSize(10).text('Hotel Address', { align: 'left' });
      doc.moveDown(0.5);
      
      // Invoice Details
      doc.fontSize(12).text(`Invoice Number: ${bill._id}`, { align: 'left' });
      doc.text(`Date: ${new Date(bill.issuedAt).toLocaleDateString()}`, { align: 'left' });
      doc.moveDown();
      
      // Guest Info
      doc.fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10).text(`${guest.firstName} ${guest.lastName}`);
      doc.text(guest.email);
      if (guest.phone) doc.text(guest.phone);
      doc.moveDown();
      
      // Reservation Details
      doc.fontSize(12).text('Reservation Details:', { underline: true });
      doc.fontSize(10).text(`Confirmation Number: ${reservation.confirmationNumber}`);
      doc.text(`Room: ${room.roomNumber} - ${room.roomType}`);
      doc.text(`Check-in: ${new Date(reservation.checkInDate).toLocaleDateString()}`);
      doc.text(`Check-out: ${new Date(reservation.checkOutDate).toLocaleDateString()}`);
      doc.moveDown();
      
      // Items Table
      doc.fontSize(12).text('Items:', { underline: true });
      doc.moveDown(0.5);
      
      let yPos = doc.y;
      doc.fontSize(10);
      doc.text('Description', 50, yPos);
      doc.text('Amount', 450, yPos, { align: 'right' });
      yPos += 20;
      
      // Room Charges
      doc.text(`Room Charges (${room.roomType})`, 50, yPos);
      doc.text(`$${bill.roomCharges.toFixed(2)}`, 450, yPos, { align: 'right' });
      yPos += 20;
      
      // Additional Services
      if (bill.additionalServices && bill.additionalServices.length > 0) {
        bill.additionalServices.forEach(service => {
          doc.text(`${service.serviceType}`, 50, yPos);
          doc.text(`$${service.totalPrice.toFixed(2)}`, 450, yPos, { align: 'right' });
          yPos += 20;
        });
      }
      
      // Taxes
      if (bill.taxes > 0) {
        doc.text('Taxes', 50, yPos);
        doc.text(`$${bill.taxes.toFixed(2)}`, 450, yPos, { align: 'right' });
        yPos += 20;
      }
      
      // Discount
      if (bill.discount > 0) {
        doc.text('Discount', 50, yPos);
        doc.text(`-$${bill.discount.toFixed(2)}`, 450, yPos, { align: 'right' });
        yPos += 20;
      }
      
      // Total
      doc.moveDown();
      doc.fontSize(12).text('Total Amount:', 350, doc.y);
      doc.fontSize(14).text(`$${bill.totalAmount.toFixed(2)}`, 450, doc.y - 2, { align: 'right' });
      
      // Payment Status
      doc.moveDown();
      doc.fontSize(10).text(`Payment Status: ${bill.paymentStatus.toUpperCase()}`, { align: 'left' });
      
      // Footer
      doc.moveDown(2);
      doc.fontSize(8).text('Thank you for choosing LuxuryStay Hospitality!', { align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve({ filepath, filename });
      });
      
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

