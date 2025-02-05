const { firestoreDb } = require('./firebase');

exports.webhook = async (req, res) => {
  const message = req.body;

  if (!message) {
    console.error('No message received');
    return res.status(400).send('No message received');
  }

  console.log('Received message:', message);

  try {
    // Save to Firestore
    await firestoreDb.collection('messages').add({
      ...message,
      processed: false,
      timestamp: new Date(),
    });

    res.status(200).send('Message saved for processing');
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).send('Internal Server Error');
  }
};