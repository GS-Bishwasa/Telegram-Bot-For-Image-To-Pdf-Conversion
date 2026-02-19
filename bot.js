import TelegramBot from "node-telegram-bot-api";
import PDFDocument from "pdfkit";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const token = process.env.TOKEN;
const app = express();

app.use(express.json());

// IMPORTANT: Use process.env.PORT for Render/Railway
const PORT = process.env.PORT || 3000;

// Create bot WITHOUT polling
const bot = new TelegramBot(token);

// Your deployed app URL (VERY IMPORTANT)
// Example: https://your-app-name.onrender.com
const WEBHOOK_URL = process.env.APP_URL;

// Set webhook
bot.setWebHook(`${WEBHOOK_URL}/bot${token}`);

// Telegram will send updates here
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Bot is running...");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// store user images
const userPhotos = {};

// ================= PHOTO HANDLER =================
bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;

  if (!userPhotos[chatId]) userPhotos[chatId] = [];

  const photo = msg.photo[msg.photo.length - 1];
  const file = await bot.getFile(photo.file_id);
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

  const filename = `photo_${Date.now()}.jpg`;

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  const writer = fs.createWriteStream(filename);
  response.data.pipe(writer);

  writer.on("finish", () => {
    userPhotos[chatId].push(filename);

    bot.sendMessage(
      chatId,
      `✅ Photo added successfully!

🖼 Photos in queue: ${userPhotos[chatId].length}

When ready, choose:
📄 /pdf – Original size PDF
📑 /a4pdf – A4-size PDF`
    );
  });
});

// ================= A4 PDF =================
bot.onText(/\/a4pdf/, async (msg) => {
  const chatId = msg.chat.id;

  if (!userPhotos[chatId] || userPhotos[chatId].length === 0) {
    return bot.sendMessage(chatId, "No photos added.");
  }

  bot.sendMessage(chatId, "Creating A4 Size PDF...");

  const pdfName = `output_${chatId}.pdf`;
  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const stream = fs.createWriteStream(pdfName);

  doc.pipe(stream);

  let first = true;

  for (const img of userPhotos[chatId]) {
    if (!first) doc.addPage({ size: "A4", margin: 0 });
    first = false;

    doc.image(img, 0, 0, {
      fit: [doc.page.width, doc.page.height],
      align: "center",
      valign: "center",
    });
  }

  doc.end();

  stream.on("finish", async () => {
    await bot.sendDocument(chatId, pdfName);

    userPhotos[chatId].forEach((file) => fs.unlinkSync(file));
    fs.unlinkSync(pdfName);
    userPhotos[chatId] = [];
  });
});

// ================= NORMAL PDF =================
bot.onText(/\/pdf/, async (msg) => {
  const chatId = msg.chat.id;

  if (!userPhotos[chatId] || userPhotos[chatId].length === 0) {
    return bot.sendMessage(chatId, "No photos added.");
  }

  bot.sendMessage(chatId, "Creating Normal PDF...");

  const pdfName = `output_${chatId}.pdf`;
  const doc = new PDFDocument({ autoFirstPage: false });
  const stream = fs.createWriteStream(pdfName);

  doc.pipe(stream);

  for (const img of userPhotos[chatId]) {
    const image = doc.openImage(img);

    doc.addPage({
      size: [image.width, image.height],
      margin: 0,
    });

    doc.image(img, 0, 0);
  }

  doc.end();

  stream.on("finish", async () => {
    await bot.sendDocument(chatId, pdfName);

    userPhotos[chatId].forEach((file) => fs.unlinkSync(file));
    fs.unlinkSync(pdfName);
    userPhotos[chatId] = [];
  });
});

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `📄 Photo-to-PDF Bot

Convert multiple photos into a single PDF in seconds.

✨ Features:
• Add multiple photos easily
• Automatic PDF creation
• Each image placed on a separate A4 page
• Fast and simple workflow

🚀 How to use:
1. Send one or more photos
2. When finished, type /pdf
3. Receive your PDF instantly

🧾 Commands:
• /a4pdf → Create A4 Size PDF from added photos
• /pdf → Create Normal PDF from added photos
• /reset → Clear added photos (optional)
• /info → About this bot
• /help → Show usage instructions

👨‍💻 Created by GS Bishwasa
© All rights reserved ${new Date().getFullYear()}

🔗 Connect with me:
GitHub: https://github.com/GS-Bishwasa
LinkedIn: https://www.linkedin.com/in/gs-bishwasa-480764331
Twitter (X): https://x.com/GSBishwasa
Telegram: @D_GmingHD
Feel free to reach out for feedback or support!`
  );
});


// /reset command
bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;

  if (userPhotos[chatId]) {
    userPhotos[chatId].forEach((file) => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
  }

  userPhotos[chatId] = [];

  bot.sendMessage(chatId, "Photo list cleared. You can start adding new photos.");
});


// /info command
bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `📄 Photo-to-PDF Bot

• Send photos to add them to your PDF
• /a4pdf → Generate A4 Size PDF from added photos
• /pdf → Generate PDF from added photos
• /reset → Clear all added photos
• /help → Show usage instructions

This bot helps you quickly combine multiple images into a single A4 PDF file — perfect for notes, documents, assignments, or scanned pages.

👨‍💻 Created by GS Bishwasa
© All rights reserved ${new Date().getFullYear()}

🔗 Connect with me:
GitHub: https://github.com/GS-Bishwasa
LinkedIn: https://www.linkedin.com/in/gs-bishwasa-480764331
Twitter (X): https://x.com/GSBishwasa
Telegram: @D_GmingHD
Feel free to reach out for feedback or support!`
  )
});

// /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `📖 Bot Commands

/a4pdf → Create a A4 Size PDF from all added photos
/pdf → Create a PDF from all added photos
/reset → Remove all added photos and start fresh
/info → About this bot
/help → Show this help message

🖼️ Send photos anytime to add them to your PDF collection.
When you're done, simply type /pdf to generate your file.
`
  );
});

// Handle unsupported message types
bot.on("message", (msg) => {
  const chatId = msg.chat.id;

  // Ignore messages already handled by photo handler
  if (msg.photo) return;

  // If user sends a document (file)
  if (msg.document) {
    const mime = msg.document.mime_type;

    if (mime === "application/pdf") {
      bot.sendMessage(chatId, "More functionality coming soon 📄");
    } else {
      bot.sendMessage(chatId, "Unsupported file format.");
    }
    return;
  }

  // If message is text
  if (msg.text) {
    if (msg.text.startsWith("/")) {
      const command = msg.text.split(" ")[0].substring(1);

      if (command !== "help" && command !== "info" && command !== "pdf" && command !== "reset" && command !== "start" && command !== "a4pdf") {
        bot.sendMessage(
          chatId,
          `❌ Unknown command: /${command}\nType /help to see available commands.`
        );
      }
    } else {
      bot.sendMessage(
        chatId,
        "Unsupported message type. Send me photos to make pdf."
      );
    }
  }
});
