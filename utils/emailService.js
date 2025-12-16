const nodemailer = require('nodemailer');
const SystemSettings = require('../models/SystemSettings');

// Create reusable transporter
let transporter = null;

const getTransporter = async () => {
  const settings = await SystemSettings.getSettings();
  const emailSettings = settings.emailSettings;
  
    // Only log if debugging (comment out for production)
    // console.log('🔍 Email Settings Check:', {
    //   smtpHost: emailSettings?.smtpHost,
    //   smtpUser: emailSettings?.smtpUser ? '***configured***' : 'NOT SET',
    //   smtpPort: emailSettings?.smtpPort,
    //   hasPassword: !!emailSettings?.smtpPassword
    // });
  
  if (!emailSettings || !emailSettings.smtpHost || !emailSettings.smtpUser) {
    // Only warn once, not on every email attempt
    if (!transporter) {
      console.warn('⚠️  Email settings not configured. Email functionality disabled.');
      console.warn('   Please configure email settings via Admin → Settings page or run: node scripts/addEmailSettings.js');
    }
    return null;
  }
  
  if (!emailSettings.smtpPassword) {
    if (!transporter) {
      console.warn('⚠️  SMTP Password not configured. Email functionality disabled.');
    }
    return null;
  }
  
  // Create new transporter (don't cache, always get fresh settings)
  transporter = nodemailer.createTransport({
    host: emailSettings.smtpHost,
    port: emailSettings.smtpPort || 587,
    secure: emailSettings.smtpPort === 465,
    auth: {
      user: emailSettings.smtpUser,
      pass: emailSettings.smtpPassword.trim() // Remove any extra spaces
    }
  });
  
  // Verify connection (comment out for faster email sending)
  // Uncomment below if you want to verify connection on every email
  // try {
  //   await transporter.verify();
  //   console.log('✅ SMTP connection verified successfully');
  // } catch (error) {
  //   console.error('❌ SMTP connection failed:', error.message);
  //   transporter = null;
  //   return null;
  // }
  
  return transporter;
};

// Send email
exports.sendEmail = async (to, subject, html, text = '') => {
  try {
    const emailTransporter = await getTransporter();
    if (!emailTransporter) {
      console.log('Email not sent - SMTP not configured');
      return { success: false, message: 'Email settings not configured' };
    }
    
    const settings = await SystemSettings.getSettings();
    
    const mailOptions = {
      from: `"${settings.emailSettings.fromName}" <${settings.emailSettings.fromEmail}>`,
      to,
      subject,
      text,
      html
    };
    
    const info = await emailTransporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send reservation confirmation
exports.sendReservationConfirmation = async (reservation, guest) => {
  const subject = 'Reservation Confirmation - LuxuryStay';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #007bff;">Reservation Confirmed!</h2>
      <p>Dear ${guest.firstName} ${guest.lastName},</p>
      <p>Your reservation has been confirmed. Here are the details:</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Confirmation Number:</strong> ${reservation.confirmationNumber}</p>
        <p><strong>Check-in:</strong> ${new Date(reservation.checkInDate).toLocaleDateString()}</p>
        <p><strong>Check-out:</strong> ${new Date(reservation.checkOutDate).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> $${reservation.totalAmount.toFixed(2)}</p>
        <p><strong>Status:</strong> ${reservation.status}</p>
      </div>
      <p>We look forward to hosting you!</p>
      <p>Best regards,<br>LuxuryStay Hospitality</p>
    </div>
  `;
  
  return await exports.sendEmail(guest.email, subject, html);
};

// Send invoice email
exports.sendInvoice = async (bill, guest, reservation) => {
  const subject = 'Invoice - LuxuryStay Hospitality';
  const invoiceNumber = bill.invoiceNumber || bill._id.toString();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #c7925b; margin: 0;">LuxuryStay Hospitality</h1>
        <h2 style="color: #6d4c41; margin: 10px 0;">Invoice</h2>
      </div>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(bill.issuedAt || Date.now()).toLocaleDateString()}</p>
        ${reservation ? `<p style="margin: 5px 0;"><strong>Confirmation Number:</strong> ${reservation.confirmationNumber || 'N/A'}</p>` : ''}
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #6d4c41; border-bottom: 2px solid #c7925b; padding-bottom: 5px;">Bill To:</h3>
        <p style="margin: 5px 0;">${guest.firstName} ${guest.lastName}</p>
        <p style="margin: 5px 0;">${guest.email}</p>
        ${guest.phone ? `<p style="margin: 5px 0;">${guest.phone}</p>` : ''}
      </div>
      
      ${reservation ? `
      <div style="margin-bottom: 20px;">
        <h3 style="color: #6d4c41; border-bottom: 2px solid #c7925b; padding-bottom: 5px;">Reservation Details:</h3>
        <p style="margin: 5px 0;"><strong>Room:</strong> ${reservation.roomId?.roomNumber || 'N/A'} - ${reservation.roomId?.roomType || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Check-in:</strong> ${new Date(reservation.checkInDate).toLocaleDateString()}</p>
        <p style="margin: 5px 0;"><strong>Check-out:</strong> ${new Date(reservation.checkOutDate).toLocaleDateString()}</p>
      </div>
      ` : ''}
      
      <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #6d4c41; margin-top: 0;">Invoice Items:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f5f5f5;">
            <th style="text-align: left; padding: 10px; border-bottom: 2px solid #c7925b;">Description</th>
            <th style="text-align: right; padding: 10px; border-bottom: 2px solid #c7925b;">Amount</th>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">Room Charges</td>
            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">$${bill.roomCharges.toFixed(2)}</td>
          </tr>
          ${bill.additionalServices && bill.additionalServices.length > 0 ? bill.additionalServices.map(s => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${s.serviceName || s.serviceType} (${s.quantity || 1}x)</td>
            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">$${s.totalPrice.toFixed(2)}</td>
          </tr>
          `).join('') : ''}
          ${bill.taxes > 0 ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">Taxes</td>
            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee;">$${bill.taxes.toFixed(2)}</td>
          </tr>
          ` : ''}
          ${bill.discount > 0 ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">Discount</td>
            <td style="text-align: right; padding: 10px; border-bottom: 1px solid #eee; color: #28a745;">-$${bill.discount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="background: #f5f5f5; font-weight: bold;">
            <td style="padding: 15px; border-top: 2px solid #c7925b; font-size: 18px;">Total Amount</td>
            <td style="text-align: right; padding: 15px; border-top: 2px solid #c7925b; font-size: 18px; color: #6d4c41;">$${bill.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
        <p style="margin-top: 15px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
          <strong>Payment Status:</strong> ${bill.paymentStatus.toUpperCase()}
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
        <p style="margin: 5px 0;">Thank you for choosing LuxuryStay Hospitality!</p>
        <p style="margin: 5px 0; font-size: 12px;">For any queries, please contact us at support@luxurystay.com</p>
      </div>
    </div>
  `;
  
  return await exports.sendEmail(guest.email, subject, html);
};

