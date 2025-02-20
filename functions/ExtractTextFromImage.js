const createClient = require("@azure-rest/ai-vision-image-analysis").default;
const { AzureKeyCredential } = require("@azure/core-auth");

// Azure credentials and endpoint
const endpoint = process.env.AZURE_ENDPOINT; // Replace with your endpoint
const key = process.env.AZURE_KEY; // Replace with your key
const credential = new AzureKeyCredential(key);
const client = createClient(endpoint, credential);

const features = ["Caption", "Read"]; // Specify the desired features

class ExtractTextFromImage {
  constructor(imageUrl) {
    this.imageUrl = imageUrl;
  }

  async extractText() {
    try {
      const result = await client.path("/imageanalysis:analyze").post({
        body: { url: this.imageUrl },
        queryParameters: { features: features },
        contentType: "application/json",
      });

      // Log the full result object for debugging
      // console.log("Full Result Object:", JSON.stringify(result, null, 2));

      const iaResult = result.body;

      // Log the API response body
      // console.log("Body Response:", JSON.stringify(iaResult, null, 2));

      if (iaResult?.readResult) {
        return iaResult.readResult; // Return the 'readResult' for further processing
      } else {
        // Log error details if 'readResult' is missing
        console.error(
          "API Error or No 'readResult' Found:",
          iaResult?.error || "No 'readResult' field in response."
        );
        return null;
      }
    } catch (error) {
      console.error("Error analyzing image:", error.message || error);
      throw error;
    }
  }
}

module.exports = ExtractTextFromImage;