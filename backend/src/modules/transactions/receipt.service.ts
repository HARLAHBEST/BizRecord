import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import PDFDocument from 'pdfkit';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class ReceiptService {
  private s3: S3;
  private bucket: string;
  private region: string;
  private endpoint: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('DO_SPACE_REGION') || '';
    this.bucket = this.configService.get<string>('DO_SPACE_BUCKET') || '';
    this.endpoint = this.configService.get<string>('DO_SPACE_ENDPOINT') || '';
    this.s3 = new S3({
      endpoint: this.endpoint,
      region: this.region,
      accessKeyId: this.configService.get<string>('DO_SPACE_KEY') || '',
      secretAccessKey: this.configService.get<string>('DO_SPACE_SECRET') || '',
      signatureVersion: 'v4',
    });
  }

  async generateAndUploadReceipt(transaction: Transaction): Promise<string> {
    const doc = new PDFDocument({ margin: 40 });
    const buffers: Buffer[] = [];
    doc.on('data', (data) => buffers.push(data));
    doc.on('end', async () => {});

    const workspaceName = transaction.workspace?.name || 'BizRecord Workspace';
    const customerName = transaction.customerName || 'Walk-in customer';
    const itemName = transaction.item?.name || 'General transaction';
    const itemSku = transaction.item?.sku || '-';
    const itemCategory = transaction.item?.category || '-';
    const itemLocation = transaction.item?.location || '-';
    const currentStock = Number(transaction.item?.quantity || 0);
    const transactionLabel =
      transaction.type === 'debt' ? 'Debt Sale Receipt' : 'Sales Receipt';
    const amountLabel =
      transaction.type === 'debt' ? 'Amount Due' : 'Amount Paid';
    const amountPrefix = 'NGN ';

    doc
      .fontSize(22)
      .text(workspaceName, { align: 'center' })
      .moveDown(0.2);
    doc
      .fontSize(18)
      .text(transactionLabel, { align: 'center' })
      .moveDown(1);

    doc.fontSize(11).fillColor('#4b5563');
    doc.text(`Date: ${transaction.createdAt.toLocaleString()}`);
    doc.text(`Receipt ID: ${transaction.id}`);
    doc.text(`Recorded by: ${transaction.createdBy?.name || 'Team member'}`);
    doc.text(`Payment method: ${transaction.paymentMethod || 'cash'}`);
    doc.text(`Status: ${transaction.status || 'pending'}`);
    if (transaction.dueDate) {
      doc.text(`Due date: ${transaction.dueDate.toLocaleDateString()}`);
    }
    doc.moveDown();

    doc.fontSize(13).fillColor('#111827').text('Customer Details', {
      underline: true,
    });
    doc.fontSize(11).fillColor('#374151');
    doc.text(`Customer: ${customerName}`);
    doc.text(`Phone: ${transaction.phone || '-'}`);
    doc.moveDown();

    doc.fontSize(13).fillColor('#111827').text('Goods Details', {
      underline: true,
    });
    doc.fontSize(11).fillColor('#374151');
    doc.text(`Item: ${itemName}`);
    doc.text(`SKU: ${itemSku}`);
    doc.text(`Category: ${itemCategory}`);
    doc.text(`Location: ${itemLocation}`);
    doc.text(`Quantity sold: ${Number(transaction.quantity || 0)}`);
    doc.text(
      `Unit price: ${amountPrefix}${Number(
        transaction.unitPrice || 0,
      ).toLocaleString()}`,
    );
    doc.text(
      `${amountLabel}: ${amountPrefix}${Number(
        transaction.totalAmount || 0,
      ).toLocaleString()}`,
    );
    doc.text(`Remaining stock after sale: ${currentStock}`);
    if (transaction.notes) {
      doc.text(`Notes: ${transaction.notes}`);
    }
    doc.moveDown();

    doc
      .fontSize(12)
      .fillColor('#111827')
      .text('Thank you for choosing BizRecord.', { align: 'center' });
    doc.end();

    await new Promise((resolve) => doc.on('end', resolve));
    const pdfBuffer = Buffer.concat(buffers);

    const key = `receipts/${transaction.id}.pdf`;
    await this.s3
      .putObject({
        Bucket: this.bucket,
        Key: key,
        Body: pdfBuffer,
        ACL: 'public-read',
        ContentType: 'application/pdf',
      })
      .promise();

    return `https://${this.bucket}.${this.endpoint.replace('https://', '')}/${key}`;
  }
}
