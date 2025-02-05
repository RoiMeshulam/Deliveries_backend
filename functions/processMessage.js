const functions = require('firebase-functions');
const axios = require('axios');
const { firestoreDb, rtdb, messaging } = require('./firebase');
const handleMessage = require('./handleMessage');
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

// IDs of groups you want to listen to
const allowedGroups = [
    '120363323823233206@g.us', // Group Test 1
    '120363337977447321@g.us', // Group Test 2
    '120363324758446250@g.us', // Group Test 3
];

// Cloud Firestore Trigger
exports.processMessages = onDocumentCreated(`messages/{messageId}`, async (event) => {
    const snapshot = event.data;
    const messageId = event.params.messageId;

    if (!snapshot) {
        console.log("Snapshot is undefined or null.");
        return;
    }

    const messageData = snapshot.data();
    console.log("New message added to Firestore:", messageData);

    if (!messageData || messageData.processed || !messageData.messageData?.fileMessageData?.downloadUrl) {
        console.log("Message is invalid or already processed.");
        return;
    }

    try {
        const chatId = messageData.senderData?.chatId;
        let formattedTimestamp = null;
        // Process message only from allowed groups
        if (allowedGroups.includes(chatId)) {
            const result = await handleMessage(messageData);

            if (result) {
                const messageTimestamp = messageData.timestamp || null;
                if (messageTimestamp) {
                    // Convert the timestamp to a Date object (assuming timestamp is in seconds)
                    const messageDate = new Date(messageTimestamp * 1000);
                
                    // Extract year, month, day, hour, minute, second
                    const year = messageDate.getFullYear();
                    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0'); // months are 0-based
                    const day = messageDate.getDate().toString().padStart(2, '0');
                    const hour = messageDate.getHours().toString().padStart(2, '0');
                    const minute = messageDate.getMinutes().toString().padStart(2, '0');
                    const second = messageDate.getSeconds().toString().padStart(2, '0');
                
                    // Format the timestamp as desired: "DD.MM.YYYY, HH:mm:ss"
                    formattedTimestamp = `${day}.${month}.${year}, ${hour}:${minute}:${second}`;
                    
                    console.log(formattedTimestamp); // This should output the timestamp in your desired format
                } else {
                    console.log('Invalid or missing timestamp.');
                }
                const phones = Array.isArray(result.phones)
                    ? result.phones
                    : typeof result.phones === 'string'
                        ? result.phones.split(',')
                        : [];

                const uniquePhones = new Set(phones);

                const enhancedResult = {
                    businessId: chatId || 'null',
                    address: result.address || 'null',
                    city: result.city || 'אריאל',
                    imageUrl: result.imageUrl || 'null',
                    phones: Array.from(uniquePhones),
                    timestamp: formattedTimestamp ? formattedTimestamp : 'null',
                    deliver: 'null',
                    status: false,
                };

                // Get the current date in the Asia/Jerusalem time zone
                const jerusalemDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });

                // Extract the year, month, and day from the current date
                const currentDate = new Date(jerusalemDate);
                const year = currentDate.getFullYear();
                const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');  // months are 0-based, so we add 1
                const day = currentDate.getDate().toString().padStart(2, '0');

                console.log(`Automatically extracted Date: Year=${year}, Month=${month}, Day=${day}`);

                // Push data to Realtime Database with dynamically extracted date
                const deliveryRef = rtdb.ref(`deliveries/${year}/${month}/${day}`).push();
                await deliveryRef.set(enhancedResult);

                console.log('Successfully saved data to Realtime Database:', enhancedResult);

                // Emit the message event
                const emitMessage = {
                    address: enhancedResult.address === 'null' ? undefined : enhancedResult.address,
                    businessId: enhancedResult.businessId === 'null' ? undefined : enhancedResult.businessId,
                    city: enhancedResult.city === 'null' ? undefined : enhancedResult.city,
                    deliver: enhancedResult.deliver === 'null' ? 'Pending' : enhancedResult.deliver,
                    id: deliveryRef.key || undefined, // Use the auto-generated key
                    imageUrl: enhancedResult.imageUrl === 'null' ? undefined : enhancedResult.imageUrl,
                    phones: enhancedResult.phones.length > 0 ? enhancedResult.phones : undefined,
                    status: enhancedResult.status === 'null' ? 'Pending' : enhancedResult.status,
                    timestamp: enhancedResult.timestamp === 'null' ? undefined : enhancedResult.timestamp,
                };
                await axios.post("https://backend-690991638006.us-central1.run.app/newDelivery", emitMessage);


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
