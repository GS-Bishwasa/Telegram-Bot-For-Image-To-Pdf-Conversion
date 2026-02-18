# 📄 Image to PDF Converter Telegram Bot

A powerful **Telegram bot** that instantly converts multiple images into a single PDF file — with support for both **A4 page format** and **original image size format**.

Perfect for students, office work, document scanning, assignments, and quick PDF creation.

🚀 **Live Bot:** [@img1_to_pdf_bot](https://t.me/img1_to_pdf_bot)  
🌐 **Backend Deployed On:** Render  
🗄 **Database:** No Database Added Till Now  

---

## ✨ What This Bot Does

This bot allows you to:

- Upload multiple images
- Convert them into a single PDF
- Choose between:
  - 📄 A4 Size PDF (print-ready)
  - 🖼 Original Size PDF (no scaling)

Simply send images → choose conversion command → receive your PDF instantly.

---

## ✅ Core Features

- 🖼 Multiple image upload support
- 📄 A4-size PDF generation
- 📐 Original image size PDF generation
- ⚡ Fast PDF creation
- 🧹 Auto cleanup after PDF creation
- 🔄 Reset uploaded images anytime
- ☁️ Cloud deployed bot
- 🤖 Telegram command menu support

---

## 🧠 How It Works

1. User sends photos to the bot
2. Bot temporarily stores image files
3. User runs:
   - `/a4pdf` → Convert to A4 PDF
   - `/pdf` → Convert using original image size
4. Bot generates PDF using **PDFKit**
5. PDF is sent back to user
6. Temporary files are deleted automatically

---

## 🤖 Bot Commands

| Command | Description |
|--------|-------------|
| `/start` | Start the bot |
| `/help` | Show available commands |
| `/info` | About the bot |
| `/a4pdf` | Create A4-size PDF from added photos |
| `/pdf` | Create normal PDF (original image size) |
| `/reset` | Clear all added photos |

---

## 📸 Example Use Case

You scanned multiple pages of notes using your phone and want a single PDF.

Steps:
- Send all images to the bot
- Run `/a4pdf`
- Download the generated PDF

Or run `/pdf` to keep original image dimensions.

---

## 🧩 Tech Stack

- Node.js
- node-telegram-bot-api
- PDFKit
- Axios
- dotenv
- Render (Deployment)

---

## 🚀 Deployment (Render – Background Worker)

Start Command:
```
node bot.js
```

Build Command:
```
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file:

```
TOKEN=your_telegram_bot_token
```

---

## 📦 Installation (Local Development)

Clone repository:

```
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
npm install
```

Create `.env`:

```
TOKEN=your_token_here
```

Run locally:

```
node bot.js
```

---

## ⚠️ Important

Do not run the bot locally and on the server at the same time.  
Telegram polling allows only **one active instance** of the bot.

---

## 🛠 Future Improvements

- PDF compression option
- Combine multiple images per page
- Database storage support
- Webhook-based version
- Inline keyboard controls

---

## 📌 Notes

- Uses Telegram polling
- Runs as a background worker
- Automatically deletes temporary files after PDF creation
- Optimized for quick PDF generation
