const levenshtein = require("fast-levenshtein");

class JapanStrategy {
    isCloseMatch(phone, businessPhone, threshold = 2) {
      return levenshtein.get(phone, businessPhone) <= threshold;
    }
  
    calculateCenterX(boundingPolygon) {
      // Calculate the center X coordinate of the bounding box
      const xCoordinates = boundingPolygon.map((point) => point.x);
      return (Math.min(...xCoordinates) + Math.max(...xCoordinates)) / 2;
    }

    calculateCenterY(boundingPolygon) {
        // Calculate the center Y coordinate of the bounding box
        const yCoordinates = boundingPolygon.map((point) => point.y);
        return (Math.min(...yCoordinates) + Math.max(...yCoordinates)) / 2;
      }
  
    analyze(textData) {
      const phoneRegex050 = /\b(05[0-8])-?\d{7}\b/g;
      const phoneRegex03 = /\b(03|02|04|08)-?\d{7}\b/g;
      const businessPhone = "03-774-3888"; // Business phone to exclude
  
      let phoneNumbers = [];
      let pairs = [];
      let address = "";
      let city = "";
  
      // Step 1: Extract phone numbers and associated lines
      textData.blocks.forEach((block, blockIndex) => {
        block.lines.forEach((line, lineIndex) => {
          const mobileMatches = line.text.match(phoneRegex050);
          const landlineMatches = line.text.match(phoneRegex03);
  
          if (mobileMatches || landlineMatches) {
            const matches = mobileMatches || landlineMatches;
  
            matches.forEach((match) => {
              if (!this.isCloseMatch(match, businessPhone)) {
                phoneNumbers.push({
                  number: match,
                  lineIndex: lineIndex,
                  blockIndex: blockIndex,
                  boundingPolygon: line.boundingPolygon,
                });
  
                // Determine if the range should be extended
                const containsKoma = block.lines
                  .slice(lineIndex + 1, lineIndex + 11)
                  .some((line) => line.text.includes("קומה"));
  
                const range = containsKoma ? 11 : 7;
                console.log(`range: ${range}`);
  
                // Step 2: Look for lines after the current line
                const nextLines = block.lines
                  .slice(lineIndex + 1, lineIndex + range)
                  .map((line, idx) => ({
                    text: line.text,
                    boundingPolygon: line.boundingPolygon,
                    relativeIndex: idx + 1,
                  }));
  
                  for (let i = 0; i < nextLines.length; i++) {
                    let foundPair = false; // Flag to indicate if a pair has been found for the current line1
                    for (let j = i + 1; j < nextLines.length; j++) {
                      const line1 = nextLines[i];
                      const line2 = nextLines[j];
                  
                      // Calculate centerX and centerY for both lines
                      const centerX1 = this.calculateCenterX(line1.boundingPolygon);
                      const centerX2 = this.calculateCenterX(line2.boundingPolygon);
                      const centerY1 = this.calculateCenterY(line1.boundingPolygon);
                      const centerY2 = this.calculateCenterY(line2.boundingPolygon);
                  
                      // Calculate Euclidean distance
                      const distance = Math.sqrt(
                        Math.pow(centerX1 - centerX2, 2) + Math.pow(centerY1 - centerY2, 2)
                      );
                  
                    //   console.log(
                    //     JSON.stringify(
                    //       {
                    //         line1: line1.text,
                    //         line2: line2.text,
                    //         distance: distance,
                    //       },
                    //       null,
                    //       2
                    //     )
                    //   );
                  
                      // Pair if the distance is less than a threshold (e.g., 110)
                      if (distance < 110) {
                        // Ignore specific combinations
                        const ignorePairs = [
                          { line1: "עיר", line2: "קומה" },
                          { line1: "קומה", line2: "עיר" },
                          { line1: "רחוב", line2: "דירה" },
                          { line1: "דירה", line2: "רחוב" },
                        ];
                  
                        // Check if the current pair matches any ignored pair
                        const isIgnored = ignorePairs.some(
                          (pair) =>
                            (line1.text.trim() === pair.line1 && line2.text.trim() === pair.line2) ||
                            (line1.text.trim() === pair.line2 && line2.text.trim() === pair.line1)
                        );
                  
                        if (!isIgnored) {
                          pairs.push({
                            line1: line1.text,
                            line2: line2.text,
                            distance: distance,
                          });
                          foundPair = true; // Set the flag to true since a pair is found
                          break; // Exit the inner loop to stop searching for more pairs for this line1
                        }
                      }
                    }
                    if (foundPair) {
                      // Exit the outer loop for the current line1 since a pair is found
                      continue;
                    }
                  }
                  
              }
            });
          }
        });
      });
  
      // Step 5: Process pairs to find city, address, and specific "קומה" + "דירה"
      let floorInfo = ""; // To store קומה + דירה info
      pairs.forEach((pair) => {
        const { line1, line2 } = pair;
        // console.log(line1,line2);
        const cleanedLine1 = line1.replace(/[^\w\sא-ת]/g, "").trim(); // Clean line1
  
        if (levenshtein.get(cleanedLine1, "עיר") <= 1) {
          city = line2;
        } else if (
          levenshtein.get(cleanedLine1, "רחוב") <= 1 ||
          levenshtein.get(cleanedLine1, "מספר") <= 1
        ) {
          address += ` ${line2}`;
        } else if (
          levenshtein.get(cleanedLine1, "קומה") <= 1 ) {
          floorInfo +=`קומה: ${line2}`;
        } else if (
            levenshtein.get(cleanedLine1, "דירה") <= 1 )
        {
            floorInfo +=` דירה: ${line2}`;
        }
      });
  
      const phoneList = phoneNumbers.map((entry) => entry.number);
  
      // Return extracted results
      return {
        phones: phoneList.length > 0 ? phoneList : null,
        address: address.trim() || null, // Ensure address is null if empty
        city: city || null,
        floorInfo: floorInfo || null, // Return floor and apartment info
      };
    }
  }
  
  module.exports = JapanStrategy;