import TelegramBot from "node-telegram-bot-api";
import PDFDocument from "pdfkit";
import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
import express from "express";
const app = express()

const port =  3000 

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

dotenv.config();

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

// store user images
const userPhotos = {};

bot.on("photo", async (msg) => {
  const chatId = msg.chat.id;
  console.log(msg);
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
  `📄 Photo added to PDF queue\nPhotos added: ${userPhotos[chatId].length}\n\nSend more photos or type /pdf to generate your PDF.`
);

  });
});

// /pdf command
bot.onText(/\/a4pdf/, async (msg) => {
  const chatId = msg.chat.id;

  if (!userPhotos[chatId] || userPhotos[chatId].length === 0) {
    bot.sendMessage(chatId, "No photos added.");
    return;
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

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    doc.image(img, 0, 0, {
      fit: [pageWidth, pageHeight],
      align: "center",
      valign: "center",
    });
  }

  doc.end();


  // WAIT until file is finished writing
  stream.on("finish", async () => {
    await bot.sendDocument(chatId, pdfName);

    // cleanup
    userPhotos[chatId].forEach((file) => fs.unlinkSync(file));
    fs.unlinkSync(pdfName);
    userPhotos[chatId] = [];
  });
});

bot.onText(/\/pdf/, async (msg) => {
  const chatId = msg.chat.id;

  if (!userPhotos[chatId] || userPhotos[chatId].length === 0) {
    bot.sendMessage(chatId, "No photos added.");
    return;
  }

  bot.sendMessage(chatId, "Creating Normal PDF...");

  const pdfName = `output_${chatId}.pdf`;
  const doc = new PDFDocument({ autoFirstPage: false });
  const stream = fs.createWriteStream(pdfName);

  doc.pipe(stream);

  for (const img of userPhotos[chatId]) {
    // get image size
    const image = doc.openImage(img);

    // create page same size as image
    doc.addPage({
      size: [image.width, image.height],
      margin: 0,
    });

    doc.image(img, 0, 0);
  }

  doc.end();

  stream.on("finish", async () => {
    await bot.sendDocument(chatId, pdfName);

    // cleanup
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
• /A4pdf → Create A4 Size PDF from added photos
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
• /A4pdf → Generate A4 Size PDF from added photos
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

/A4pdf → Create a A4 Size PDF from all added photos
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
