const express = require('express');
const router = express.Router();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;
const client = require('twilio')(accountSid, authToken);

router.post('/send', async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ status: "error", message: "Missing phone number or message" });
  }
  try {
    const result = await client.messages.create({
      to,
      from: fromNumber,
      body: message
    });
    res.json({ status: "sent", sid: result.sid });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;