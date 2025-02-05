const levenshtein = require("fast-levenshtein");

class BobStrategy {
  isCloseMatch(phone, businessPhone, threshold = 2) {
    return levenshtein.get(phone, businessPhone) <= threshold;
  }

  analyze(textData) {
    const phoneRegex050 = /\b(05[0-8])-?\d{7}\b/g;
    const phoneRegex03 = /\b(03|02|04|08)-?\d{7}\b/g;
    const phoneRegexInternational = /\+?972-?\d{9}\b/g; // Support for +972 with optional +
    const businessPhone = "035560050"; // Business phone to exclude

    let phoneNumbers = [];
    let address = null;

    textData.blocks.forEach((block) => {
      block.lines.forEach((line, lineIndex) => {
        const lineText = line.text.trim();

        // Extract phone numbers using regex
        const mobileMatches = line.text.match(phoneRegex050);
        const landlineMatches = line.text.match(phoneRegex03);
        const internationalMatches = line.text.match(phoneRegexInternational);

        const matches = [...(mobileMatches || []), ...(landlineMatches || []), ...(internationalMatches || [])];

        matches.forEach((match) => {
          if (!this.isCloseMatch(match, businessPhone)) {
            phoneNumbers.push({
              number: match,
              lineText: line.text,
              lineIndex: lineIndex,
              blockIndex: block.blockIndex,
            });
          }
        });

        // Extract phone directly from labeled lines
        if (lineText.includes("טלפון:")) {
          const phoneCandidate = lineText.split("טלפון:")[1]?.trim();
          if (phoneCandidate) {
            const cleanedPhone = phoneCandidate.replace(/[^0-9+]/g, "");
            if (!phoneNumbers.some((p) => p.number === cleanedPhone)) {
              phoneNumbers.push({ number: cleanedPhone, lineText: line.text });
            }
          }
        }

        // Extract address directly from labeled lines
        if (lineText.includes("כתובת:")) {
          const addressCandidate = lineText.split("כתובת:")[1]?.trim();
          if (addressCandidate) {
            address = addressCandidate;
          }
        }

        // If "טל:" is found, take two lines below as the address
        if (lineText.includes("טל:")) {
          const lineBelow1 = block.lines[lineIndex + 1]?.text.trim();
          const lineBelow2 = block.lines[lineIndex + 2]?.text.trim();
          const combinedAddress = [lineBelow1, lineBelow2]
            .filter((line) => line) // Filter out undefined or empty lines
            .join(" ");
          if (combinedAddress) {
            address = combinedAddress;
          }
        }
      });
    });

    // Filter phone numbers to ensure only valid formats and remove duplicates
    const phoneSet = new Set(
      phoneNumbers
        .map((entry) => entry.number)
        .filter(
          (number) =>
            phoneRegex050.test(number) ||
            phoneRegex03.test(number) ||
            phoneRegexInternational.test(number)
        )
    );

    const uniquePhoneList = [...phoneSet]; // Convert Set back to an array

    // Step 3: Return extracted phone numbers and address
    return {
      phones: uniquePhoneList.length > 0 ? uniquePhoneList : null,
      address: address || null,
    };
  }
}

module.exports = BobStrategy;
