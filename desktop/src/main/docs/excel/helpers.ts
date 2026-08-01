/* eslint-disable */
// Copied verbatim from ui/src/lib/excelGenerator.ts lines 46-123.
// Pure string/number helpers shared by every sheet.

function round3(num: number): number {
    return Math.round(num * 10000) / 10000;
}



// Convert full names and address to initials except for numbers
function convertNamesToInitials(input: string): string {
    // Split into lines
    const lines = input.split("\n");

    return lines
        .map(line => {
            // If the line is a number → ignore
            if (/^\d+$/.test(line.trim())) {
                return line;
            }

            // If the line contains spaces (likely a name)
            if (/^[A-Za-z\s]+$/.test(line.trim())) {
                return line
                    .trim()
                    .split(/\s+/) // split by spaces
                    .map(word => word[0].toUpperCase() + ".") // take first letter + .
                    .join(" "); // join with space
            }

            // Otherwise, keep as-is (address or other text)
            return line;
        })
        .join("\n"); // join back all parts
}



// Format names to initials for names, keep numbers and addresses intact
function formatNames(input: string): string {
    const parts = input.split("\n");
    const result: string[] = [];

    for (let i = 0; i < parts.length; i += 3) {
        const name = parts[i]?.trim();
        const number = parts[i + 1]?.trim();
        const address = parts[i + 2]?.trim();

        // Convert only the name into initials (T. S. / S. R. V.)
        const initials = name
            ? name
                .split(/\s+/)
                .map((word) => word[0].toUpperCase() + ".")
                .join(" ")
            : "";

        result.push(initials, number, address);
    }

    return result.join("\n");
}


// /**
//  * Replace any date separator with the desired one.
//  * @param dateStr - The input date string in any format like "25/04/2004" or "25-04-2004"
//  * @param newSeparator - The new separator to use, e.g. '.', '/', '-'
//  * @returns A string with the new formatted date
//  */
// function normalizeDateSeparator(dateStr: string, newSeparator: string): string {
//   // Match and capture date parts regardless of separator
//   const match = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);

//   if (!match) {
//     throw new Error("Invalid date format. Expected dd/mm/yyyy, dd-mm-yyyy, or dd.mm.yyyy");
//   }

//   const [, day, month, year] = match;
//   return `${day}${newSeparator}${month}${newSeparator}${year}`;
// }


export { round3, convertNamesToInitials, formatNames }
