const ExtractTextFromImage = require('./ExtractTextFromImage');
const FatherPlaceStrategy = require('./strategies/FatherPlaceStrategy');
const JapanStrategy = require('./strategies/JapanStrategy');


async function handleMessage(message) {
    const chatId = message.senderData.chatId;
    let result;

    try {
        switch (chatId) {

            // father place chat
            case "120363323823233206@g.us": // Group test 1
                console.log("__________Group test 1____________");
                if (message.messageData.typeMessage === "imageMessage") {
                    const imageUrl = message.messageData.fileMessageData.downloadUrl;
                    console.log(`Analyzing image: ${imageUrl}`);
                    const extractor = new ExtractTextFromImage(imageUrl);
                    try {
                        const textData = await extractor.extractText();
                        if (textData) {
                            console.log("Extracted Text Data:");
                            // console.log(JSON.stringify(textData, null, 2));
                            const strategy = new FatherPlaceStrategy();
                            const analysisResult = strategy.analyze(textData);
                            console.log("Analysis Result:");
                            console.log(JSON.stringify(analysisResult, null, 2));
                            // Include imageUrl in the result
                            const result = {
                                address: analysisResult.address || null,
                                city: "אריאל",
                                imageUrl: imageUrl || null, // Add imageUrl here
                                phones: analysisResult.phones || [],

                            };

                            console.log("Final Result:");
                            console.log(JSON.stringify(result, null, 2));

                            return result;

                        } else {
                            console.log("No text data found for this image.");
                        }
                    } catch (error) {
                        console.error(`Error processing image ${imageUrl}:`, error);
                    }

                }
                break;

                 // japan japan chat
            case "120363337977447321@g.us": // Group test 2
                console.log("__________Group test 2____________");
                if (message.messageData.typeMessage === "imageMessage") {
                    const imageUrl = message.messageData.fileMessageData.downloadUrl;
                    console.log(`Analyzing image: ${imageUrl}`);
                    const extractor = new ExtractTextFromImage(imageUrl);
                    try {
                        const textData = await extractor.extractText();
                        if (textData) {
                            console.log("Extracted Text Data:");
                            // console.log(JSON.stringify(textData, null, 2));
                            const strategy = new JapanStrategy();
                            const analysisResult = strategy.analyze(textData);
                            console.log("Analysis Result:");
                            console.log(JSON.stringify(analysisResult, null, 2));
                            // Include imageUrl in the result
                            const result = {
                                address: analysisResult.address || null,
                                city: analysisResult.city,
                                imageUrl: imageUrl || null, // Add imageUrl here
                                phones: analysisResult.phones || [],

                            };

                            console.log("Final Result:");
                            console.log(JSON.stringify(result, null, 2));

                            return result;

                        } else {
                            console.log("No text data found for this image.");
                        }
                    } catch (error) {
                        console.error(`Error processing image ${imageUrl}:`, error);
                    }

                }
                break;

            case "120363324758446250@g.us": // Group test 3
                console.log("__________Group test 3____________");
                if (message.messageData.typeMessage === "textMessage") {
                    console.log("Received a text message in Group test 3");
                    result = "Text message processing for Group test 3";
                }
                break;

            // Additional cases can be added here for other groups

            default:
                console.log("No specific logic for this group:", chatId);
                break;
        }
    } catch (error) {
        console.error("Error processing message:", error);
    }

    // Log result if any operation is performed
    if (result) {
        // Get the current date and time in local time (Israel Time)
        const now = new Date();

        // Convert to local time for Israel (UTC+3)
        const options = {
            timeZone: 'Asia/Jerusalem', // Specify the local timezone
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false, // 24-hour format
        };
        const messageTimestamp = message.timestamp || null;
        // Get the formatted local time string
        // const localTimestamp = now.toLocaleString('he-IL', options).replace(/\//g, '-'); // Format as dd-mm-yyyy

        // Prepare the result object to include timestamp and chatId
        const enhancedResult = {
            timestamp: messageTimestamp ? new Date(messageTimestamp * 1000).toLocaleString('he-IL', {
                timeZone: 'Asia/Jerusalem',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }) : 'null', 
            chatId: chatId, // or replace with business name if desired
            data: result, // The original result from analyzeImageFromUrl
        };

        console.log("Result:", enhancedResult);
        return enhancedResult;
    }
}

module.exports = handleMessage;