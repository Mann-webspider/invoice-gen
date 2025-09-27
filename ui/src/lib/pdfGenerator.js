import XlsxPopulate from 'xlsx-populate';
import { exec } from 'child_process';
import { platform } from 'os';
import { join } from 'path';

async function convertExcelToPdf(inputFilePath, outputDir) {
    const outputExcelFile = join(outputDir, 'output_with_printarea.xlsx');
    const libreOfficePath = platform() === 'win32' ? `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"` : 'soffice';

    // Load workbook
    const workbook = await XlsxPopulate.fromFileAsync(inputFilePath);

    workbook.sheets().forEach(sheet => {
        const usedRange = sheet.usedRange();
        const lastRow = usedRange.endCell().rowNumber();
        const lastCol = usedRange.endCell().columnNumber();
        const lastColLetter = String.fromCharCode('A'.charCodeAt(0) + lastCol - 1);

        // Set print area
        // sheet.printArea(`A1:${lastColLetter}${lastRow}`);
        sheet.pageSetup().printArea(`A1:${lastColLetter}${lastRow}`);
        // Optional: Fit to page
        sheet.pageSetup()
            .orientation('portrait')
            .scale(100)
            .fitToPage(true);
    });

    await workbook.toFileAsync(outputExcelFile);
    console.log(`✅ Excel with print area saved: ${outputExcelFile}`);

    // Convert to PDF
    const command = `${libreOfficePath} --headless --convert-to pdf "${outputExcelFile}" --outdir "${outputDir}"`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Conversion failed: ${error.message}`);
            console.error(stderr);
        } else {
            console.log(`✅ PDF conversion complete! Saved in ${outputDir}`);
            console.log(stdout);
        }
    });
}

const inputFilePath = './custom_invoice.xlsx';
const outputDir = './output';

convertExcelToPdf(inputFilePath, outputDir);
