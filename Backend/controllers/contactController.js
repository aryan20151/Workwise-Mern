const Contact = require('../models/Contact');

// @desc    Submit a contact message
// @route   POST /contact
const submitContact = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newMessage = new Contact({ name, email, message });
    await newMessage.save();
    res.status(200).json({ message: "Message submitted successfully!" });
  } catch (err) {
    console.error(" Error saving contact message:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  submitContact
};
