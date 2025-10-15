const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

function numberToWords(num) {
  const converter = require("number-to-words");
  if (num === 0) return "Zero";
  return converter.toWords(num).replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Generate PDF for quotation with revision number
 * @param {Object} quotation - Quotation data
 * @param {Array} products - Array of products to include
 * @param {Object} inquiry - Inquiry / customer info
 * @param {number} revisionNumber - Revision number
 * @returns {Promise<string>} - Relative path to generated PDF
 */
async function generateRevicedQuotationPDF(quotation, products, inquiry, revisionNumber = null) {
  const pdfDir = path.join(__dirname, "../uploads/quotations");
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

  // Set PDF filename based on revision number
  const pdfFileName = revisionNumber
    ? `${quotation.quotation_number}-Rev-${revisionNumber}.pdf`
    : `${quotation.quotation_number}.pdf`;
  const pdfPath = path.join(pdfDir, pdfFileName);

  // Logo handling
  const logoPath = path.join(__dirname, "../assests/Spectrasynthicon.png");
  let logoImage = "";
  if (fs.existsSync(logoPath)) {
    const logoFile = fs.readFileSync(logoPath);
    logoImage = `data:image/png;base64,${logoFile.toString("base64")}`;
  } else {
    console.log("Warning: Logo file not found at", logoPath);
  }

  const customerName = inquiry?.customer_name || "N/A";
  const customerAddress = inquiry?.address || "N/A";

  const subtotal = Number(quotation.total_price);
  const gstRate = Number(quotation.gst) || 18;
  const gstAmount = (subtotal * gstRate) / 100;
  const grandTotal = subtotal + gstAmount;
  const amountInWords = numberToWords(Math.round(grandTotal)) + " Rupees Only";

  let productRowsHtml = products
    .map(
      (p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align: left;">${p.product_name}</td>
        <td>${p.cas_no || "-"}</td>
        <td>${p.product_code || "-"}</td>
        <td>${p.quantity || "-"}</td>
        <td>${Number(p.price).toFixed(2)}</td>
        <td>${p.lead_time || "-"}</td>
      </tr>`
    )
    .join("");

  const minRows = 5;
  const emptyRowsCount = minRows - products.length;
  if (emptyRowsCount > 0) {
    for (let i = 0; i < emptyRowsCount; i++) {
      productRowsHtml += `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`;
    }
  }

  // Your existing HTML template
  const html = `
  <html>
    <head>
      <style>
        /* Keep your CSS as it is */
      </style>
    </head>
    <body>
      <div class="page-container">
        <!-- HEADER, LOGO -->
        <div class="header-bar"></div>
        <div class="main-header">
          <div class="company-details">
            <div class="logo-container">
              <img src="${logoImage}" alt="Spectrasynth Logo" style="width: 60px; height: auto;">
              <div class="logo-text">Spectrasynth<span>Pharmachem</span></div>
            </div>
          </div>
          <div class="quotation-info">
            <div class="quotation-title">QUOTATION</div>
            <div class="quotation-fields">
              <div><span>QUOTATION NO.</span>${quotation.quotation_number}</div>
              <div><span>REVISION NO.</span>${revisionNumber || "-"}</div>
              <div><span>DATE</span>${quotation.date}</div>
            </div>
          </div>
        </div>
        <!-- CUSTOMER INFO -->
        <div class="quoted-to">
          <strong>QUOTED TO:</strong><br>${customerName}<br>${customerAddress}
        </div>
        <!-- PRODUCTS TABLE -->
        <table class="product-table">
          <thead>
            <tr><th>SI No</th><th>DESCRIPTION</th><th>CAS NO.</th><th>HSN CODE</th><th>QTY</th><th>UNIT PRICE (INR)</th><th>Lead Time</th></tr>
          </thead>
          <tbody>${productRowsHtml}</tbody>
        </table>
        <!-- TOTALS & TERMS -->
        <div class="bottom-section">
          <div class="terms-conditions">
            <strong>Terms and Condition-</strong><br>Please Read Terms & conditions:
            <!-- Keep your terms list here -->
          </div>
          <div class="totals-section">
            <table class="totals-table">
              <tr><td>SUBTOTAL (INR)</td><td>${subtotal.toFixed(2)}</td></tr>
              <tr><td>GST ${gstRate}%</td><td>${gstAmount.toFixed(2)}</td></tr>
              <tr class="grand-total"><td>Grand Total</td><td>${grandTotal.toFixed(2)}</td></tr>
            </table>
            <div class="value-in-word"><strong>Value in Word:</strong> ${amountInWords}</div>
          </div>
        </div>
        <div class="footer"><div class="signature">Authorised Signatory</div></div>
        <div class="final-note">**This is computer generated document and not required any signature and stamp</div>
      </div>
    </body>
  </html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
  });
  await browser.close();

  return `uploads/quotations/${pdfFileName}`;
}

module.exports = { generateRevicedQuotationPDF };
