const bcrypt = require("bcryptjs");

const password = "Latin4488mtsa1"; // Replace with the actual password
bcrypt.hash(password, 10, (err, hashedPassword) => {
  if (err) throw err;
  console.log("Hashed Password:", hashedPassword);
});
