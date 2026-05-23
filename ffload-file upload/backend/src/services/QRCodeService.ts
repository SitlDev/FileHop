import QRCode from 'qrcode';

export class QRCodeService {
  static generateQRCode(data: string, options?: any): Promise<string> {
    return QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
      margin: 1,
      ...options,
    });
  }

  static generateQRCodeSVG(data: string): Promise<string> {
    return QRCode.toString(data, {
      errorCorrectionLevel: 'H',
      type: 'svg',
      width: 200,
    });
  }
}
