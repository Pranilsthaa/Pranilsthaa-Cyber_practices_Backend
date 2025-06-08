const crypto = require("crypto");

function encrypt(text, key, iv) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// function decrypt(encryptedText) {
//   const decipher = crypto.createDecipheriv("aes-256-cbc", SECRET_KEY, IV);
//   let decrypted = decipher.update(encryptedText, "hex", "utf8");
//   decrypted += decipher.final("utf8");
//   return decrypted;
// }

module.exports = { encrypt };
