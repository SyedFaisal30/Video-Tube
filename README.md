# 📹 VideoTube - Backend for a YouTube-like Platform

VideoTube is a fully functional backend system built with **Node.js**, **Express.js**, and **MongoDB**, simulating core functionalities of a video streaming platform like YouTube. It handles video uploads, streaming, user authentication, and interactions such as likes, comments, and view tracking.

---

## 🚀 Features

- ✅ **User Authentication & Authorization**
  - Sign up / Sign in
  - JWT-based protected routes
  - Role-based access for admins/content creators

- 🎥 **Video Management**
  - Upload and store video files
  - Stream videos on demand with efficient buffering
  - Track views, likes, and comments

- 💬 **Engagement System**
  - Like/dislike videos
  - Comment on videos
  - Reply to comments

- 📂 **Categories & Search**
  - Tag-based filtering
  - Search videos by title, tags, or creator

- 🔄 **RESTful API**
  - Cleanly structured, versioned API endpoints
  - Follows REST principles for maintainability

---

## 🛠 Tech Stack

- **Node.js** – Server runtime
- **Express.js** – Web framework
- **MongoDB** – Database for storing user and video metadata
- **Mongoose** – ODM for MongoDB
- **Multer** – File uploads (videos, thumbnails)
- **JWT** – User authentication and session management
- **CORS** – Secure cross-origin communication
- **Dotenv** – Environment variable management

---


## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/SyedFaisal30/videotube-backend.git
cd videotube-backend
2. Install dependencies

npm install
3. Setup environment variables
Create a .env file in the root directory:

PORT=5000
MONGODB_URI=mongodb://localhost:27017/videotube
JWT_SECRET=your_secret_key
4. Start the server

npm start
The server should be running at http://localhost:5000.

🧪 API Testing
You can test API endpoints using:

Postman / Thunder Client (recommended)

Frontend integration

Tools like curl or httpie

📌 To-Do / Future Enhancements
Video transcoding support

Video thumbnails preview

Playlist and subscriptions system

Admin dashboard

Live video streaming (WebRTC)

Notifications & email integration

🙋‍♂️ Author
Syed Faisal Abdul Rahman Zulfequar
📍 Thane, Maharashtra, India
📧 sfarz172320@gmail.com

