const levenshtein = require("fast-levenshtein");

class FatherPlaceStrategy {
  calculateCenterX(boundingPolygon) {
    const xValues = boundingPolygon.map((point) => point.x);
    return xValues.reduce((sum, x) => sum + x, 0) / xValues.length;
  }

  isCloseMatch(phone, businessPhone, threshold = 2) {
    return levenshtein.get(phone, businessPhone) <= threshold;
  }

  matchesPatternWithMistake(lineText, patterns, threshold = 1) {
    for (const pattern of patterns) {
      if (levenshtein.get(lineText, pattern) <= threshold) {
        return true;
      }
    }
    return false;
  }

  sanitizeAddress(address) {
    // Remove "אריאל" and sanitize patterns like ק-1 / ד-4
    address = address.replace(/אריאל/g, "").trim();
    address = address.replace(/ק-\d+\s?\/\s?ד-\d+/g, "").trim();

    // Limit to 8 words
    const words = address.split(/\s+/);
    return words.length > 8 ? null : address;
  }

  analyze(textData) {
    const phoneRegex050 = /\b(05[0-8])-?\d{7}\b/g;
    const phoneRegex03 = /\b(03|02|04|08)-?\d{7}\b/g;

    const accountPatterns = [
      "חן מס/קבלה",
      "חשבון למשלוח",
      "חו מס/קבלה",
      "מס/קבלה \\d{1,7}|מס/קבלה [\\d/]+",
    ];

    const businessPhone = "03-9067522"; // Business phone to exclude
    const epsilon = 30; // Define epsilon for centerX proximity

    let phoneNumbers = [];
    let address = null;

    // Step 1: Extract phone numbers and calculate their centerX
    textData.blocks.forEach((block, blockIndex) => {
      block.lines.forEach((line, lineIndex) => {
        const mobileMatches = line.text.match(phoneRegex050);
        const landlineMatches = line.text.match(phoneRegex03);

        if (mobileMatches || landlineMatches) {
          const matches = mobileMatches || landlineMatches;

          matches.forEach((match) => {
            if (!this.isCloseMatch(match, businessPhone)) {
              const centerX = this.calculateCenterX(line.boundingPolygon);
              phoneNumbers.push({
                number: match,
                text: line.text,
                centerX: centerX,
                lineIndex: lineIndex,
                blockIndex: blockIndex,
              });
            }
          });
        }

        // Step 2: Detect patterns using regex or Levenshtein distance
        for (const pattern of accountPatterns) {
          const regex = new RegExp(pattern, "i");
          if (regex.test(line.text)) {
            const detectedCenterX = this.calculateCenterX(line.boundingPolygon);
            let matchingPhone = null;
            let sectionLines = [];

            // Search backward for a phone number
            for (let i = lineIndex - 1; i >= 0; i--) {
              const aboveLine = block.lines[i];
              const phoneMatch =
                aboveLine.text.match(phoneRegex050) ||
                aboveLine.text.match(phoneRegex03);

              if (phoneMatch) {
                const phoneCenterX = this.calculateCenterX(
                  aboveLine.boundingPolygon
                );

                if (Math.abs(phoneCenterX - detectedCenterX) <= epsilon) {
                  matchingPhone = {
                    number: phoneMatch[0],
                    text: aboveLine.text,
                    centerX: phoneCenterX,
                  };
                  break;
                }
              }
              sectionLines.unshift(aboveLine);
            }

            // Filter lines by centerX proximity
            if (matchingPhone) {
              const filteredSection = sectionLines.filter((line) => {
                const lineCenterX = this.calculateCenterX(line.boundingPolygon);
                return Math.abs(lineCenterX - detectedCenterX) <= epsilon;
              });

              address = filteredSection.map((line) => line.text).join(" ");
              address = this.sanitizeAddress(address); // Apply sanitization
              return;
            }
          }
        }
      });
    });

    // Step 3: Fallback logic if no address is found
    if (!address && phoneNumbers.length >= 2) {
      const differences = phoneNumbers.flatMap((a, i) =>
        phoneNumbers.slice(i + 1).map((b) => ({
          pair: [a, b],
          diff: Math.abs(a.centerX - b.centerX),
        }))
      );

      differences.sort((a, b) => a.diff - b.diff);
      const closestPair = differences[0]?.pair;

      if (closestPair) {
        const leftoverPhone = phoneNumbers.find(
          (phone) => !closestPair.includes(phone)
        );

        if (leftoverPhone) {
          const leftoverBlock = textData.blocks[leftoverPhone.blockIndex];
          const linesAfter = leftoverBlock.lines.slice(
            leftoverPhone.lineIndex + 1
          );

          const extractedLines = linesAfter.slice(0, 6).map((line) => {
            const centerX = this.calculateCenterX(line.boundingPolygon);
            return {
              text: line.text,
              centerX: centerX,
            };
          });

          const addressLines = extractedLines
            .filter(
              (line) => Math.abs(line.centerX - leftoverPhone.centerX) <= epsilon
            )
            .slice(0, 2);

          address = addressLines.map((line) => line.text).join(" ");
          address = this.sanitizeAddress(address); // Apply sanitization
        }
      }
    }

    // Step 4: Prepare the final output
    const phoneList = phoneNumbers.map((phone) => phone.number);

    return {
      phones: phoneList.length > 0 ? phoneList : null,
      address: address || null,
    };
  }
}

module.exports = FatherPlaceStrategy;
