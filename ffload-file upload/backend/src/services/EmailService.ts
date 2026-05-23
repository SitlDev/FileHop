import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@filehop.dev';

export class EmailService {
  static async sendWelcomeEmail(email: string, name: string): Promise<void> {
    if (!resend) {
      console.log(`[EMAIL] Welcome email to ${email}: Welcome to FileHop, ${name}!`);
      return;
    }
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Welcome to FileHop',
        html: `
          <h1>Welcome to FileHop, ${name}!</h1>
          <p>Your 2GB free storage is ready to use.</p>
          <p>Files are automatically deleted after 15 days.</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  }

  static async sendDownloadLink(
    email: string,
    filename: string,
    downloadLink: string,
    qrCode: string
  ): Promise<void> {
    if (!resend) {
      console.log(`[EMAIL] Download link email to ${email}: ${filename} - ${downloadLink}`);
      return;
    }
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `Download: ${filename}`,
        html: `
          <h2>${filename}</h2>
          <p><a href="${downloadLink}">Download File</a></p>
          <img src="${qrCode}" alt="QR Code" />
        `,
      });
    } catch (error) {
      console.error('Failed to send download link email:', error);
      throw error;
    }
  }

  static async sendPaymentConfirmation(email: string, amount: number): Promise<void> {
    if (!resend) {
      console.log(`[EMAIL] Payment confirmation to ${email}: $${(amount / 100).toFixed(2)}`);
      return;
    }
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Payment Confirmed',
        html: `
          <h1>Payment Confirmed</h1>
          <p>Amount: $${(amount / 100).toFixed(2)}</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error);
      throw error;
    }
  }

  static async sendStorageWarning(email: string, usedGB: number, limitGB: number): Promise<void> {
    if (!resend) {
      console.log(`[EMAIL] Storage warning to ${email}: ${usedGB}GB / ${limitGB}GB used`);
      return;
    }
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Storage Limit Warning',
        html: `
          <h1>Storage Warning</h1>
          <p>You've used ${usedGB}GB of ${limitGB}GB storage.</p>
          <p>Please delete some files to free up space.</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send storage warning email:', error);
      throw error;
    }
  }

  static async sendFileAutoDelete(email: string, filename: string, freedGB: number): Promise<void> {
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'File Expired and Deleted',
        html: `
        <h1>File Expired</h1>
        <p><strong>${filename}</strong> has been deleted.</p>
        <p>You've freed up ${freedGB}GB of storage.</p>
      `,
      });
    } catch (error) {
      console.error('Failed to send file auto-delete email:', error);
      throw error;
    }
  }

  static async sendPaymentMethodUpdated(email: string): Promise<void> {
    if (!resend) {
      console.log(`[EMAIL] Payment method updated notification to ${email}`);
      return;
    }
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Payment Method Updated',
        html: `
          <h1>Payment Method Updated</h1>
          <p>Your payment method has been successfully updated.</p>
          <p>Future payments will use the new card on file.</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send payment method updated email:', error);
      throw error;
    }
  }

  static async sendPaymentFailureNotification(
    email: string,
    amount: number,
    invoiceId: string
  ): Promise<void> {
    if (!resend) {
      console.log(`[EMAIL] Payment failure notification to ${email}: $${(amount / 100).toFixed(2)}`);
      return;
    }
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Payment Failed - Action Required',
        html: `
          <h1>Payment Failed</h1>
          <p>Your subscription payment of $${(amount / 100).toFixed(2)} could not be processed.</p>
          <p>Please update your payment method to continue enjoying FileHop Pro.</p>
          <p><a href="https://filehop.com/payments">Update Payment Method</a></p>
        `,
      });
    } catch (error) {
      console.error('Failed to send payment failure email:', error);
      throw error;
    }
  }

  static async sendPaymentRetrySuccess(
    email: string,
    retriedCount: number,
    successCount: number,
    amounts: number[]
  ): Promise<void> {
    if (!resend) {
      console.log(
        `[EMAIL] Payment retry success notification to ${email}: ${successCount}/${retriedCount} payments recovered`
      );
      return;
    }
    try {
      const totalAmount = amounts.reduce((sum, a) => sum + a, 0);
      const statusColor = successCount === retriedCount ? '#10b981' : '#f59e0b';
      const statusText = successCount === retriedCount ? 'All Payments Recovered!' : 'Partial Recovery';

      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Payment Retry Results - Action Completed',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: ${statusColor}; margin-bottom: 20px;">${statusText}</h1>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #1f2937;">Retry Summary</h2>
              <p style="margin: 8px 0;"><strong>Payments Attempted:</strong> ${retriedCount}</p>
              <p style="margin: 8px 0;"><strong>Payments Successful:</strong> <span style="color: #10b981; font-weight: bold;">${successCount}</span></p>
              <p style="margin: 8px 0;"><strong>Total Amount Recovered:</strong> $${(totalAmount / 100).toFixed(2)}</p>
            </div>

            ${successCount === retriedCount
              ? `
              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #047857;"><strong>✓ Success!</strong> All failed payments have been recovered. Your account is now in good standing.</p>
              </div>
              `
              : `
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;"><strong>⚠ Partial Recovery</strong> Some payments could not be processed. Please update your payment method to complete the recovery.</p>
                <p style="margin: 8px 0 0 0; color: #92400e;"><a href="https://filehop.com/payments" style="color: #d97706; text-decoration: none; font-weight: bold;">Update Payment Method →</a></p>
              </div>
              `
            }

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
              <p style="margin: 0;">FileHop Payment System</p>
              <p style="margin: 8px 0 0 0;">If you have any questions, please contact our support team.</p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send payment retry success email:', error);
      throw error;
    }
  }
}
