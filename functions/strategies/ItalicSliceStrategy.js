const levenshtein = require("fast-levenshtein");

class ItalicSliceStrategy {
  isCloseMatch(phone, businessPhone, threshold = 2) {
    return levenshtein.get(phone, businessPhone) <= threshold;
  }

  analyze(textData) {
    const phoneRegex050 = /\b(05[0-8])-?\d{7}\b/g;
    const phoneRegex03 = /\b(03|02|04|08)-?\d{7}\b/g;
    const phoneRegexInternational = /\+?972-?\d{9}\b/g; // Support for +972 with optional +
    const businessPhone = "0507177122"; // Business phone to exclude

    let phoneNumbers = [];
    let address = null;

    textData.blocks.forEach((block, blockIndex) => {
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
              blockIndex: blockIndex,
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
      });
    });

    // Collect phone numbers into a list
    const phoneList = phoneNumbers.map((entry) => entry.number);

    // Return extracted results
    return {
      phones: phoneList.length > 0 ? phoneList : null,
      address: address || null,
    };
  }
}

module.exports = ItalicSliceStrategy;
