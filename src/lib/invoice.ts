import jsPDF from 'jspdf';
import { Order } from '../types/database';
import { BRAND_NAME, PARENT_BRAND_LABEL, PAYMENT_PROVIDER_NAME } from './brand';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 32;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const SIGNATURE_PATH = '/signature.jpg';
const MANDATORY_ADVANCE_AMOUNT = 49;

type RGB = [number, number, number];

const ink: RGB = [17, 24, 39];
const night: RGB = [12, 18, 30];
const muted: RGB = [100, 116, 139];
const softText: RGB = [71, 85, 105];
const line: RGB = [226, 232, 240];
const paper: RGB = [255, 255, 255];
const wash: RGB = [248, 250, 252];
const warmWash: RGB = [255, 251, 235];
const gold: RGB = [241, 199, 91];
const goldDeep: RGB = [138, 91, 18];
const amberLine: RGB = [245, 158, 11];
const green: RGB = [22, 101, 52];
const greenSoft: RGB = [220, 252, 231];
const red: RGB = [185, 28, 28];
const redSoft: RGB = [254, 226, 226];

const formatCurrency = (value: number) => `Rs. ${Math.max(value, 0).toLocaleString('en-IN')}`;

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function toTitleCase(value: string | null | undefined, fallback = '-') {
  if (!value) return fallback;
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function fulfillmentLabel(order: Order) {
  if (order.delivery_type !== 'printed') return 'Digital';
  return order.fulfillment_method === 'home_delivery' ? 'Home delivery' : 'In-store pickup';
}

function color(doc: jsPDF, value: RGB, target: 'fill' | 'draw' | 'text') {
  const [r, g, b] = value;
  if (target === 'fill') doc.setFillColor(r, g, b);
  if (target === 'draw') doc.setDrawColor(r, g, b);
  if (target === 'text') doc.setTextColor(r, g, b);
}

function text(
  doc: jsPDF,
  value: string | string[],
  x: number,
  y: number,
  options: {
    size?: number;
    style?: 'normal' | 'bold';
    rgb?: RGB;
    maxWidth?: number;
    align?: 'left' | 'right' | 'center';
    lineHeight?: number;
  } = {},
) {
  doc.setFont('helvetica', options.style ?? 'normal');
  doc.setFontSize(options.size ?? 10);
  color(doc, options.rgb ?? ink, 'text');
  const lines = Array.isArray(value)
    ? value
    : options.maxWidth
      ? doc.splitTextToSize(value || '-', options.maxWidth)
      : value;
  doc.text(lines, x, y, {
    align: options.align,
    lineHeightFactor: options.lineHeight ?? 1.18,
  });
}

function panel(doc: jsPDF, x: number, y: number, width: number, height: number, fill: RGB = paper, stroke: RGB = line) {
  color(doc, fill, 'fill');
  color(doc, stroke, 'draw');
  doc.roundedRect(x, y, width, height, 7, 7, 'FD');
}

function pill(doc: jsPDF, label: string, x: number, y: number, width: number, tone: 'green' | 'amber' | 'red') {
  const fill = tone === 'green' ? greenSoft : tone === 'red' ? redSoft : warmWash;
  const stroke = tone === 'green' ? [134, 239, 172] as RGB : tone === 'red' ? [252, 165, 165] as RGB : amberLine;
  const foreground = tone === 'green' ? green : tone === 'red' ? red : goldDeep;
  color(doc, fill, 'fill');
  color(doc, stroke, 'draw');
  doc.roundedRect(x, y, width, 25, 12, 12, 'FD');
  text(doc, label.toUpperCase(), x + width / 2, y + 16.5, {
    size: 8,
    style: 'bold',
    rgb: foreground,
    align: 'center',
  });
}

function rule(doc: jsPDF, x1: number, y: number, x2: number, stroke: RGB = line) {
  color(doc, stroke, 'draw');
  doc.line(x1, y, x2, y);
}

function labelValue(doc: jsPDF, label: string, value: string, x: number, y: number, width: number) {
  text(doc, label.toUpperCase(), x, y, { size: 7.2, style: 'bold', rgb: muted });
  text(doc, value || '-', x, y + 14, { size: 9.6, style: 'bold', rgb: ink, maxWidth: width });
}

function summaryRow(doc: jsPDF, label: string, value: string, x: number, y: number, width: number, strong = false) {
  text(doc, label, x, y, {
    size: strong ? 10.5 : 9.2,
    style: strong ? 'bold' : 'normal',
    rgb: strong ? ink : softText,
  });
  text(doc, value, x + width, y, {
    size: strong ? 10.5 : 9.2,
    style: 'bold',
    rgb: strong ? ink : softText,
    align: 'right',
  });
}

function clippedLines(doc: jsPDF, value: string, maxWidth: number, maxLines: number) {
  const lines = doc.splitTextToSize(value || '-', maxWidth) as string[];
  if (lines.length <= maxLines) {
    return lines;
  }
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = `${visible[maxLines - 1].replace(/\.*$/, '')}...`;
  return visible;
}

function drawBrandMark(doc: jsPDF, x: number, y: number) {
  color(doc, night, 'fill');
  doc.roundedRect(x, y, 58, 58, 7, 7, 'F');
  color(doc, gold, 'draw');
  doc.setLineWidth(1.4);
  doc.circle(x + 29, y + 24, 14, 'S');
  doc.setLineWidth(1);
  text(doc, 'DK', x + 29, y + 30, { size: 15, style: 'bold', rgb: gold, align: 'center' });
  text(doc, 'STUDIOS', x + 29, y + 46, { size: 5.8, style: 'bold', rgb: paper, align: 'center' });
}

function statusTone(order: Order): 'green' | 'amber' | 'red' {
  if (order.delivered_at || order.pickup_completed_at || order.status === 'completed') return 'green';
  if (order.status === 'cancelled' || order.payment_status === 'failed') return 'red';
  return 'amber';
}

function statusLabel(order: Order) {
  if (order.delivered_at || order.pickup_completed_at) return 'Delivered';
  if (order.status === 'completed') return 'Completed';
  if (order.payment_status === 'paid') return 'Advance Paid';
  if (order.payment_status === 'failed') return 'Payment Failed';
  return 'Advance Pending';
}

async function loadImageAsDataUrl(path: string | null | undefined) {
  if (!path) return null;
  try {
    const response = await fetch(path);
    if (!response.ok) return null;

    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function toPngBarcodeUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('format', 'png');
    parsed.searchParams.set('height', '150');
    parsed.searchParams.set('width', '460');
    return parsed.toString();
  } catch {
    return url.replace('format=svg', 'format=png');
  }
}

function drawHeader(doc: jsPDF, order: Order, billNumber: string) {
  color(doc, paper, 'fill');
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  color(doc, night, 'fill');
  doc.rect(0, 0, PAGE_WIDTH, 112, 'F');
  color(doc, gold, 'fill');
  doc.rect(0, 107, PAGE_WIDTH, 5, 'F');
  color(doc, gold, 'fill');
  doc.rect(0, 0, 10, PAGE_HEIGHT, 'F');

  drawBrandMark(doc, MARGIN, 27);
  text(doc, BRAND_NAME, MARGIN + 74, 47, { size: 22, style: 'bold', rgb: paper });
  text(doc, PARENT_BRAND_LABEL, MARGIN + 75, 65, { size: 8.8, style: 'bold', rgb: gold });
  text(doc, 'Photo editing, printing, framing and delivery billing', MARGIN + 75, 84, {
    size: 8.8,
    rgb: [203, 213, 225],
  });

  text(doc, 'ORDER BILL', PAGE_WIDTH - MARGIN, 45, {
    size: 25,
    style: 'bold',
    rgb: paper,
    align: 'right',
  });
  text(doc, `Bill No. ${billNumber}`, PAGE_WIDTH - MARGIN, 69, {
    size: 10,
    style: 'bold',
    rgb: [226, 232, 240],
    align: 'right',
  });
  text(doc, `Issued ${formatDateTime(order.created_at)}`, PAGE_WIDTH - MARGIN, 87, {
    size: 8.6,
    rgb: [203, 213, 225],
    align: 'right',
  });
}

function drawCustomerAndOrderCards(doc: jsPDF, order: Order, billNumber: string, serviceName: string) {
  const top = 132;
  const gap = 12;
  const leftWidth = 260;
  const rightWidth = CONTENT_WIDTH - leftWidth - gap;

  panel(doc, MARGIN, top, leftWidth, 126, paper);
  panel(doc, MARGIN + leftWidth + gap, top, rightWidth, 126, wash);

  text(doc, 'Bill To', MARGIN + 16, top + 24, { size: 12, style: 'bold' });
  labelValue(doc, 'Customer', order.customer_name, MARGIN + 16, top + 48, leftWidth - 32);
  labelValue(doc, 'Email', order.customer_email, MARGIN + 16, top + 78, leftWidth - 32);
  labelValue(doc, 'Phone', order.customer_phone ?? '-', MARGIN + 16, top + 108, leftWidth - 32);

  text(doc, 'Order Details', MARGIN + leftWidth + gap + 16, top + 24, { size: 12, style: 'bold' });
  pill(doc, statusLabel(order), MARGIN + leftWidth + gap + rightWidth - 126, top + 12, 108, statusTone(order));
  labelValue(doc, 'Bill Number', billNumber, MARGIN + leftWidth + gap + 16, top + 50, 115);
  labelValue(doc, 'Order ID', order.id, MARGIN + leftWidth + gap + 148, top + 50, rightWidth - 164);
  labelValue(doc, 'Service', serviceName, MARGIN + leftWidth + gap + 16, top + 86, 115);
  labelValue(doc, 'Fulfillment', fulfillmentLabel(order), MARGIN + leftWidth + gap + 148, top + 86, rightWidth - 164);
}

function drawLineItems(doc: jsPDF, order: Order, serviceName: string, subtotal: number, discount: number) {
  const top = 278;
  const height = 158;
  panel(doc, MARGIN, top, CONTENT_WIDTH, height, paper);

  color(doc, wash, 'fill');
  doc.roundedRect(MARGIN, top, CONTENT_WIDTH, 34, 7, 7, 'F');
  text(doc, 'Description', MARGIN + 16, top + 22, { size: 8.6, style: 'bold', rgb: softText });
  text(doc, 'Qty', PAGE_WIDTH - MARGIN - 168, top + 22, { size: 8.6, style: 'bold', rgb: softText, align: 'right' });
  text(doc, 'Rate', PAGE_WIDTH - MARGIN - 94, top + 22, { size: 8.6, style: 'bold', rgb: softText, align: 'right' });
  text(doc, 'Amount', PAGE_WIDTH - MARGIN - 16, top + 22, { size: 8.6, style: 'bold', rgb: softText, align: 'right' });

  const rows: Array<[string, string, string, string, boolean]> = [
    [`Studio work - ${serviceName}`, '1', formatCurrency(subtotal), formatCurrency(subtotal), true],
    [
      `${fulfillmentLabel(order)}${order.frame_option ? `, ${order.frame_option}` : ''}`,
      '-',
      '-',
      'Included',
      false,
    ],
    [`Photos supplied: ${order.photo_count}`, String(order.photo_count), '-', '-', false],
  ];

  let y = top + 60;
  rows.forEach(([description, qty, rate, amount, strong], index) => {
    if (index > 0) rule(doc, MARGIN + 16, y - 17, PAGE_WIDTH - MARGIN - 16);
    text(doc, description, MARGIN + 16, y, {
      size: 9.8,
      style: strong ? 'bold' : 'normal',
      rgb: strong ? ink : softText,
      maxWidth: 285,
    });
    text(doc, qty, PAGE_WIDTH - MARGIN - 168, y, { size: 9.4, rgb: softText, align: 'right' });
    text(doc, rate, PAGE_WIDTH - MARGIN - 94, y, { size: 9.4, rgb: softText, align: 'right' });
    text(doc, amount, PAGE_WIDTH - MARGIN - 16, y, {
      size: 9.4,
      style: strong ? 'bold' : 'normal',
      rgb: strong ? ink : softText,
      align: 'right',
    });
    y += 32;
  });

  if (discount > 0) {
    rule(doc, MARGIN + 16, y - 17, PAGE_WIDTH - MARGIN - 16);
    text(doc, `Discount${order.discount_code ? ` - ${order.discount_code}` : ''}`, MARGIN + 16, y, {
      size: 9.4,
      rgb: green,
    });
    text(doc, `- ${formatCurrency(discount)}`, PAGE_WIDTH - MARGIN - 16, y, {
      size: 9.4,
      style: 'bold',
      rgb: green,
      align: 'right',
    });
  }
}

function drawPaymentAndBarcode(doc: jsPDF, order: Order, barcodeDataUrl: string | null, subtotal: number, discount: number, balance: number) {
  const top = 456;
  const gap = 12;
  const summaryWidth = 244;
  const barcodeWidth = CONTENT_WIDTH - summaryWidth - gap;

  panel(doc, MARGIN, top, summaryWidth, 166, warmWash, amberLine);
  text(doc, 'Payment Summary', MARGIN + 16, top + 25, { size: 12.2, style: 'bold', rgb: goldDeep });
  summaryRow(doc, 'Subtotal', formatCurrency(subtotal), MARGIN + 16, top + 55, summaryWidth - 32);
  summaryRow(doc, 'Discount', discount > 0 ? `- ${formatCurrency(discount)}` : formatCurrency(0), MARGIN + 16, top + 78, summaryWidth - 32);
  summaryRow(doc, 'Total', formatCurrency(order.total_amount), MARGIN + 16, top + 101, summaryWidth - 32, true);
  rule(doc, MARGIN + 16, top + 115, MARGIN + summaryWidth - 16, amberLine);
  summaryRow(doc, 'Advance paid online', formatCurrency(order.advance_amount), MARGIN + 16, top + 136, summaryWidth - 32);
  summaryRow(doc, 'Balance after work', formatCurrency(balance), MARGIN + 16, top + 158, summaryWidth - 32, true);

  panel(doc, MARGIN + summaryWidth + gap, top, barcodeWidth, 166, night, night);
  text(doc, order.fulfillment_method === 'home_delivery' ? 'Delivery Barcode' : 'Pickup Barcode', MARGIN + summaryWidth + gap + 16, top + 25, {
    size: 12.2,
    style: 'bold',
    rgb: paper,
  });
  text(doc, order.fulfillment_method === 'home_delivery'
    ? ['Use for delivery', 'verification.', 'Keep bill ready.']
    : ['Show at shop.', 'Pay balance', 'cash/UPI QR.'], MARGIN + summaryWidth + gap + 16, top + 47, {
    size: 8.6,
    rgb: [203, 213, 225],
    lineHeight: 1.18,
  });
  text(doc, `via ${PAYMENT_PROVIDER_NAME}`, MARGIN + summaryWidth + gap + 16, top + 91, {
    size: 8.2,
    style: 'bold',
    rgb: gold,
  });
  text(doc, 'BARCODE VALUE', MARGIN + summaryWidth + gap + 16, top + 118, {
    size: 7.2,
    style: 'bold',
    rgb: gold,
  });
  text(doc, order.barcode_value ?? 'Pending', MARGIN + summaryWidth + gap + 16, top + 134, {
    size: 10.2,
    style: 'bold',
    rgb: paper,
    maxWidth: 166,
  });

  color(doc, paper, 'fill');
  color(doc, paper, 'draw');
  const barcodeX = PAGE_WIDTH - MARGIN - 178;
  const barcodeY = top + 40;
  doc.roundedRect(barcodeX, barcodeY, 152, 72, 6, 6, 'FD');
  if (barcodeDataUrl) {
    doc.addImage(barcodeDataUrl, 'PNG', barcodeX + 8, barcodeY + 13, 136, 40);
    text(doc, 'Scan for delivery', barcodeX + 76, barcodeY + 62, { size: 7.2, style: 'bold', rgb: muted, align: 'center' });
  } else {
    text(doc, order.barcode_value ?? 'Barcode pending', barcodeX + 76, barcodeY + 39, {
      size: 9.2,
      style: 'bold',
      align: 'center',
      maxWidth: 126,
    });
  }
}

function drawTermsAndSignature(doc: jsPDF, order: Order, signatureDataUrl: string | null, balance: number) {
  const notesTop = 642;
  const notesHeight = 82;
  panel(doc, MARGIN, notesTop, CONTENT_WIDTH, notesHeight, paper);
  text(doc, 'Terms and Notes', MARGIN + 16, notesTop + 24, { size: 12, style: 'bold' });
  const defaultNotes = `Rs. ${MANDATORY_ADVANCE_AMOUNT} online advance is mandatory. Remaining balance is collected only after the work is complete. Uploaded files are used for this order and follow the store retention policy.`;
  const instructions = order.instructions?.trim()
    ? `Customer note: ${order.instructions.trim()}`
    : defaultNotes;
  text(doc, clippedLines(doc, instructions, CONTENT_WIDTH - 32, 3), MARGIN + 16, notesTop + 45, {
    size: 8.8,
    rgb: softText,
    lineHeight: 1.25,
  });

  const footerTop = 744;
  panel(doc, MARGIN, footerTop, CONTENT_WIDTH, 64, wash);
  text(doc, 'Authorized Signature', MARGIN + 16, footerTop + 18, { size: 7.6, style: 'bold', rgb: muted });
  if (signatureDataUrl) {
    doc.addImage(signatureDataUrl, 'JPEG', MARGIN + 16, footerTop + 23, 128, 26);
  } else {
    rule(doc, MARGIN + 16, footerTop + 45, MARGIN + 145, line);
  }
  text(doc, BRAND_NAME, MARGIN + 158, footerTop + 45, { size: 9.5, style: 'bold', rgb: ink });

  text(doc, order.fulfillment_method === 'home_delivery' ? 'Amount Due at Delivery' : 'Amount Due at Pickup', PAGE_WIDTH - MARGIN - 16, footerTop + 21, {
    size: 8,
    style: 'bold',
    rgb: muted,
    align: 'right',
  });
  text(doc, formatCurrency(balance), PAGE_WIDTH - MARGIN - 16, footerTop + 47, {
    size: 18,
    style: 'bold',
    rgb: goldDeep,
    align: 'right',
  });
}

export async function downloadInvoicePdf(order: Order) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const signatureDataUrl = await loadImageAsDataUrl(SIGNATURE_PATH);
  const barcodeDataUrl = await loadImageAsDataUrl(toPngBarcodeUrl(order.barcode_url ?? order.tracking_url));
  const subtotal = order.subtotal_amount ?? order.total_amount;
  const discount = order.discount_amount ?? 0;
  const balance = Math.max(order.total_amount - order.advance_amount, 0);
  const billNumber = order.bill_number ?? 'Pending';
  const serviceName = toTitleCase(order.service_id, 'Custom studio work');

  drawHeader(doc, order, billNumber);
  drawCustomerAndOrderCards(doc, order, billNumber, serviceName);
  drawLineItems(doc, order, serviceName, subtotal, discount);
  drawPaymentAndBarcode(doc, order, barcodeDataUrl, subtotal, discount, balance);
  drawTermsAndSignature(doc, order, signatureDataUrl, balance);

  text(doc, `Generated on ${formatDateTime(new Date().toISOString())}`, MARGIN, PAGE_HEIGHT - 20, {
    size: 7.6,
    rgb: muted,
  });
  text(doc, 'Computer-generated bill for DK STUDIOS order workflow.', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 20, {
    size: 7.6,
    rgb: muted,
    align: 'right',
  });

  doc.save(`${order.bill_number ?? order.id}-dk-studios-bill.pdf`);
}

export function getCustomerWhatsAppLink(order: Order, stage: 'progress' | 'delivery') {
  const phone = order.customer_phone?.replace(/\D/g, '');
  if (!phone) return null;

  const message = stage === 'delivery'
    ? `Hi ${order.customer_name}, your ${BRAND_NAME} order ${order.bill_number ?? order.id} has been delivered/completed.`
    : `Hi ${order.customer_name}, your ${BRAND_NAME} order ${order.bill_number ?? order.id} has been updated and is ready for the next step.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function getCustomerEmailLink(order: Order, stage: 'progress' | 'delivery') {
  const subject = stage === 'delivery'
    ? `Your ${BRAND_NAME} order ${order.bill_number ?? order.id} is ready`
    : `Update for your ${BRAND_NAME} order ${order.bill_number ?? order.id}`;
  const body = stage === 'delivery'
    ? `Hi ${order.customer_name},%0D%0A%0D%0AYour order has been completed/delivered.%0D%0ABill: ${order.bill_number ?? order.id}%0D%0AStatus: ${order.status}%0D%0A%0D%0AThanks,%0D%0A${BRAND_NAME}`
    : `Hi ${order.customer_name},%0D%0A%0D%0AWe have an update on your order.%0D%0ABill: ${order.bill_number ?? order.id}%0D%0AStatus: ${order.status}%0D%0A%0D%0AThanks,%0D%0A${BRAND_NAME}`;
  return `mailto:${order.customer_email}?subject=${encodeURIComponent(subject)}&body=${body}`;
}
