const { firestoreDb, rtdb } = require('./firebase');
const handleMessage = require('./handleMessage');
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

// IDs of groups you want to listen to
const allowedGroups = [
    '120363323823233206@g.us', // Group Test 1
    '120363337977447321@g.us', // Group Test 2
    '120363324758446250@g.us', // Group Test 3
];

// Function to get today's date in the 'Asia/Jerusalem' timezone
const getTodayDate = () => {
    const jerusalemDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });
    const currentDate = new Date(jerusalemDate);
    return {
        year: currentDate.getFullYear(),
        month: (currentDate.getMonth() + 1).toString().padStart(2, '0'),
        day: currentDate.getDate().toString().padStart(2, '0'),
    };
};

// Firestore trigger: runs when a new message is created
exports.processMessages = onDocumentCreated(`messages/{messageId}`, async (event) => {
    const snapshot = event.data;
    const messageId = event.params.messageId;

    if (!snapshot) {
        console.log("Snapshot is undefined or null.");
        return;
    }

    const messageData = snapshot.data();
    console.log("New message added to Firestore:", messageData);

    // Validate the message data before processing
    if (!messageData || messageData.processed || !messageData.messageData?.fileMessageData?.downloadUrl) {
        console.log("Message is invalid or already processed.");
        return;
    }

    try {
        const chatId = messageData.senderData?.chatId;
        let formattedTimestamp = null;

        // Process messages only from allowed groups
        if (allowedGroups.includes(chatId)) {
            const result = await handleMessage(messageData);

            if (result) {
                const messageTimestamp = messageData.timestamp || null;
                if (messageTimestamp) {
                    // Convert timestamp to readable format
                    const messageDate = new Date(messageTimestamp * 1000);
                    const { year } = getTodayDate(); // Get the correct year
                
                    formattedTimestamp = messageDate.toLocaleString('en-GB', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                    }).replace(',', '');
                
                    // Replace the incorrect year with the correct one
                    formattedTimestamp = formattedTimestamp.replace(/\d{4}/, year);
                }

                const phones = Array.isArray(result.phones)
                    ? result.phones
                    : typeof result.phones === 'string'
                        ? result.phones.split(',')
                        : [];

                const uniquePhones = new Set(phones);

                // Structured data to be saved in RTDB
                const enhancedResult = {
                    businessId: chatId || 'null',
                    address: result.address || 'null',
                    city: result.city || 'אריאל',
                    imageUrl: result.imageUrl || 'null',
                    phones: Array.from(uniquePhones),
                    timestamp: formattedTimestamp || 'null',
                    deliver: 'null',
                    status: false,
                };

                // Get today's date for database path
                const { year, month, day } = getTodayDate();
                console.log(`Automatically extracted Date: Year=${year}, Month=${month}, Day=${day}`);

                // Save data to RTDB under 'deliveries/{year}/{month}/{day}'
                const deliveryRef = rtdb.ref(`deliveries/${year}/${month}/${day}`).push();
                await deliveryRef.set(enhancedResult);

                console.log('Successfully saved data to Realtime Database:', enhancedResult);

                // Mark message as processed in Firestore
                await firestoreDb.collection("messages").doc(messageId).update({ processed: true });
                console.log("Message marked as processed.");
            }
        } else {
            console.log('Message from unauthorized group:', chatId);
        }
    } catch (error) {
        console.error("Error processing message:", error);
    }
});
