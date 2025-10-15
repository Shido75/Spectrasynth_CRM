const Imap = require("imap");
const { simpleParser } = require("mailparser");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const Inquiry = require("../models/Inquiry");
const InquiryProduct = require("../models/InquiryProduct");
const generateInquiryNumber = require("./generateInquiryNumber");

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const fetchRecentEmails = () => {
  const imap = new Imap({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT),
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  function openInbox(cb) {
    imap.openBox("INBOX", false, cb);
  }

  imap.once("ready", () => {
    openInbox(async (err, box) => {
      if (err) throw err;

      const today = new Date();
      const searchCriteria = [["SINCE", today.toISOString().split("T")[0]]];

      imap.search(searchCriteria, (err, results) => {
        if (err) return console.log("Search error:", err);
        if (!results.length) return console.log("📭 No recent emails");

        const f = imap.fetch(results, { bodies: "", struct: true });

        f.on("message", (msg, seqno) => {
          let buffer = "";
          let emailDate = null;

          msg.on("body", (stream) => {
            stream.on("data", (chunk) => (buffer += chunk.toString("utf8")));
          });

          msg.once("attributes", (attrs) => {
            emailDate = new Date(attrs.date || attrs.internalDate);
          });

          // ✅ Only one msg.once("end") per message
          msg.once("end", async () => {
            try {
              if (!emailDate) return;
              const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
              if (emailDate < oneMinuteAgo) return;

              const parsed = await simpleParser(buffer);
              const { text, html, attachments } = parsed;

              // ✅ Generate inquiry number only once
              const inquiry_number = await generateInquiryNumber();
              const customer_name = parsed.from?.value?.[0]?.name || "Unknown";
              const sender_email =
                parsed.from?.value?.[0]?.address || "unknown@example.com";

              // ✅ Create main inquiry
              await Inquiry.create({ inquiry_number, customer_name, email: sender_email });

              // ✅ Handle HTML tables
              if (html && html.includes("<table")) {
                const $ = cheerio.load(html);
                const $tables = $("table").filter(
                  (i, table) => $(table).find("th, td").length > 0
                );

                $tables.each((tIdx, table) => {
                  const $rows = $(table).find("tr").slice(1);
                  const headerMap = {};
                  $(table)
                    .find("tr")
                    .first()
                    .find("th, td")
                    .each((i, th) => {
                      headerMap[$(th).text().trim().toLowerCase()] = i;
                    });

                  $rows.each(async (i, row) => {
                    const cols = $(row).find("td");

                    const product_name =
                      $(cols[headerMap["chemical name"]]).text().trim() || "Unknown";
                    const cas_number =
                      $(cols[headerMap["cas number"]]).text().trim() || "N/A";
                    const quantity_required =
                      parseFloat(
                        $(cols[headerMap["quantity"]])
                          .text()
                          .trim()
                          .replace(/[^\d.]/g, "")
                      ) || 0;

                    let image_url = null;
                    const imgTags = $(cols[headerMap["structure"]]).find("img");

                    if (imgTags.length > 0) {
                      for (let j = 0; j < imgTags.length; j++) {
                        const src = $(imgTags[j]).attr("src");
                        if (!src) continue;

                        if (src.startsWith("cid:")) {
                          const cid = src.replace(/^cid:/, "").trim();
                          const attachment = attachments.find(
                            (a) => a.cid && cid.includes(a.cid)
                          );
                          if (attachment) {
                            const filename = `${Date.now()}_${i}_${j}.png`;
                            fs.writeFileSync(
                              path.join(uploadsDir, filename),
                              attachment.content
                            );
                            image_url = "uploads/" + filename;
                            break;
                          }
                        } else if (src.startsWith("data:image")) {
                          const matches = src.match(
                            /^data:image\/(png|jpeg|jpg);base64,(.+)$/
                          );
                          if (matches) {
                            const ext = matches[1];
                            const data = matches[2];
                            const filename = `${Date.now()}_${i}_${j}.${ext}`;
                            fs.writeFileSync(
                              path.join(uploadsDir, filename),
                              Buffer.from(data, "base64")
                            );
                            image_url = "uploads/" + filename;
                            break;
                          }
                        }
                      }
                    }

                    await InquiryProduct.create({
                      inquiry_number,
                      product_name,
                      cas_number,
                      quantity_required,
                      image_url,
                    });
                  });
                });
              }

              // ✅ Plain text fallback
              if (text && !html?.includes("<table")) {
                const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
                let currentEntry = { inquiry_number };

                for (let line of lines) {
                  const l = line.toLowerCase();
                  if (l.includes("chemical name")) {
                    currentEntry.product_name = line.split("-")[1]?.trim() || "Unknown";
                  } else if (l.includes("cas")) {
                    currentEntry.cas_number = line.split("-")[1]?.trim() || "N/A";
                  } else if (l.includes("quantity")) {
                    currentEntry.quantity_required = parseFloat(
                      line.split("-")[1]?.replace(/[^\d.]/g, "") || 0
                    );
                  }

                  if (
                    currentEntry.product_name &&
                    currentEntry.cas_number &&
                    currentEntry.quantity_required !== undefined
                  ) {
                    await InquiryProduct.create(currentEntry);
                    currentEntry = { inquiry_number };
                  }
                }
              }
            } catch (err) {
              console.error("❌ Error processing email:", err);
            }
          });
        });

        f.once("end", () => console.log("✅ All recent emails processed."));
        f.once("error", (err) => console.log("Fetch error:", err));
      });
    });
  });

  imap.once("error", (err) => console.log("❌ IMAP Error:", err));
  imap.connect();
};

module.exports = { fetchRecentEmails };
