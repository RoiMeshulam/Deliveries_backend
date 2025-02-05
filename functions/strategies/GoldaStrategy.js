const levenshtein = require("fast-levenshtein");

class GoldaStrategy {
  isCloseMatch(phone, businessPhone, threshold = 2) {
    return levenshtein.get(phone, businessPhone) <= threshold;
  }

  analyze(textData) {
    const phoneRegex050 = /\b(05[0-8])-?\d{7}\b/g;
    const phoneRegex03 = /\b(03|02|04|08)-?\d{7}\b/g;

    let phoneNumbersSet = new Set();
    let primaryPhone = null;
    let primaryAddress = null;
    let city = null;

    // Process text data to extract relevant information
    textData.blocks.forEach((block) => {
      block.lines.forEach((line) => {
        const lineText = line.text.trim();

        // Check for primary phone number (line contains "טלפון:")
        if (!primaryPhone && lineText.includes("טלפון:")) {
          const cleanPhoneNumber = lineText
            .replace(/-/g, "")
            .match(phoneRegex050);
          if (cleanPhoneNumber) {
            primaryPhone = cleanPhoneNumber[0];
          }
        }

        // Check for primary address (line contains "כתובת:")
        if (!primaryAddress && lineText.includes("כתובת:")) {
          const address = lineText.split(":")[1]?.trim();
          if (address) {
            primaryAddress = address;
          }
        }

        // Check for city (line contains "עיר:")
        if (!city && lineText.includes("עיר:")) {
          const cityName = lineText.split(":")[1]?.trim();
          if (cityName) {
            city = cityName;
          }
        }

        // Search for any additional phone numbers (mobile or landline)
        const mobileMatches = lineText.match(phoneRegex050);
        const landlineMatches = lineText.match(phoneRegex03);

        if (mobileMatches) {
          mobileMatches.forEach((match) => phoneNumbersSet.add(match));
        }

        if (landlineMatches) {
          landlineMatches.forEach((match) => phoneNumbersSet.add(match));
        }
      });
    });

    // Remove duplicates and ensure valid phone formats
    const validPhones = Array.from(phoneNumbersSet).filter(
      (phone) => phoneRegex050.test(phone) || phoneRegex03.test(phone)
    );

    // Return the results
    return {
      phones: validPhones.length > 0 ? validPhones : null,
      address: primaryAddress || null,
      city: city || null,
    };
  }
}

module.exports = GoldaStrategy;
