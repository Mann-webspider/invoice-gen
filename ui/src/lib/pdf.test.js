import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { convertExcelToPDF } from './pdfGenerator.js';
import { mkdirSync, existsSync } from 'fs';

// Get the directory path correctly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define paths relative to the current directory
const pathOfExcelFile = join(__dirname, 'custom_invoice.xlsm');
const outputDir = join(__dirname, 'output');
const pathOfPdfSave = join(outputDir, 'custom_invoice.pdf');

// Create output directory if it doesn't exist
if (!existsSync(outputDir)) {
    try {
        mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    } catch (err) {
        console.error(`Failed to create output directory: ${err.message}`);
        process.exit(1);
    }
}

(async () => {
    try {
        console.log('Converting Excel to PDF...');
        console.log('Input file:', pathOfExcelFile);
        console.log('Output file:', pathOfPdfSave);
        
        await convertExcelToPDF(pathOfExcelFile, pathOfPdfSave);
        console.log('Conversion completed successfully!');
    } catch (err) {
        console.error('Conversion failed:', err.message);
        process.exit(1);
    }
})();
