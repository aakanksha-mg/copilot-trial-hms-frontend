require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5000,
  dotnetApiUrl: process.env.DOTNET_API_URL,
  encryptionKey: process.env.ENCRYPTION_KEY, // Example: 32-char key for AES
  encryptionIv: process.env.ENCRYPTION_IV, 
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '15mb',
  security: {
    rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0',
  },
  cors: {
    allowedOrigins: [
      "https://hrmadmin.netlify.app",
      "https://hms-alpha-eight.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
  },  // Example: 16-char IV
  // console.log("test")
};
