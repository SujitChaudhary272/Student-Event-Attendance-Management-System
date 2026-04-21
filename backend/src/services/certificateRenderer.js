import puppeteer from "puppeteer";
import QRCode from "qrcode";
import fs from "fs";
import { buildCertificateHtml } from "../utils/certificates.js";

function findBrowserExecutable() {
  const configured = String(
    process.env.PUPPETEER_EXECUTABLE_PATH ||
      process.env.CHROME_PATH ||
      process.env.BROWSER_EXECUTABLE_PATH ||
      ""
  ).trim();

  if (configured && fs.existsSync(configured)) {
    return configured;
  }

  try {
    const bundled = puppeteer.executablePath();
    if (bundled && fs.existsSync(bundled)) {
      return bundled;
    }
  } catch {
    // Fall through to common system browser paths.
  }

  const commonPaths =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          `${process.env.LOCALAPPDATA || ""}\\Google\\Chrome\\Application\\chrome.exe`,
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
          `${process.env.LOCALAPPDATA || ""}\\Microsoft\\Edge\\Application\\msedge.exe`,
        ]
      : process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
          "/usr/bin/microsoft-edge",
        ];

  return commonPaths.find((path) => path && fs.existsSync(path)) || null;
}

export async function renderCertificatePDF(templateHtml, data) {
  const qrDataUrl = await QRCode.toDataURL(data.verify_url);

  const enrichedData = {
    ...data,
    qr_data_url: qrDataUrl,
  };

  let html = String(templateHtml || "").trim();
  if (html) {
    for (const [key, value] of Object.entries(enrichedData)) {
      html = html.replaceAll(`{{${key}}}`, value ?? "");
    }
  } else {
    html = buildCertificateHtml(enrichedData);
  }

  const executablePath = findBrowserExecutable();
  if (!executablePath) {
    throw new Error(
      "No Chrome or Edge browser was found for PDF generation. Install Chrome/Edge or set PUPPETEER_EXECUTABLE_PATH in backend/.env."
    );
  }

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath,
    args: ["--no-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    landscape: true,
    preferCSSPageSize: true,
    margin: {
      top: "0",
      right: "0",
      bottom: "0",
      left: "0",
    },
    printBackground: true,
  });

  await browser.close();
  return pdf;
}
