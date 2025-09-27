import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { Palette } from 'lucide-react';

/**
 * Generate an Excel file for the invoice data
 * @param data Invoice data to generate Excel file from
 */

export const loadImageBuffer = async (  // mann patel
    url: string
): Promise<{ buffer: ArrayBuffer; extension: string; width: number; height: number } | undefined> => {
    try {
        const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || "";
        const response = await fetch(`${baseUrl}${url}`);

        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ Bad response from ${url}:`, response.status, text);
            return undefined;
        }

        const contentType = response.headers.get("Content-Type") || "";
        const extension = contentType.split("/")[1];

        if (!["png", "jpeg", "jpg", "gif", "webp"].includes(extension)) {
            console.error(`❌ Unsupported image type: ${contentType}`);
            return undefined;
        }

        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();

        const imageBitmap = await createImageBitmap(blob);
        const width = imageBitmap.width;
        const height = imageBitmap.height;

        return { buffer, extension, width, height };
    } catch (err) {
        console.error(`❌ Error fetching or processing image from ${url}`, err);
        return undefined;
    }
};


function round3(num: number): number {
    return Math.round(num * 10000) / 10000;
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

export const generateInvoiceExcel = async (data): Promise<any> => {

    // Exporter Details
    let companyName = data.exporter.company_name || "";
    let companyAddress = data.exporter.company_address || "";
    let email = data.exporter.email || "";
    let taxid = data.exporter.tax_id || "";
    let ieCode = data.exporter.ie_code || "";
    let panNo = data.exporter.pan_number || "";
    let gstinNo = data.exporter.gstin_number || "";
    let stateCode = data.exporter.state_code || "";
    let invoiceNo = data.invoice_number || "";
    let invoiceDate = data.invoice_date || "";
    // invoiceDate = normalizeDateSeparator(invoiceDate, '.');
    let [year, month, day] = invoiceDate.split('/');
    invoiceDate = `${month}/${year}/${day}`;
    let buyersOrderNo = data.buyer.order_number || "";
    let buyersOrderDate = data.buyer.order_date || "";
    [year, month, day] = buyersOrderDate.split('-');
    buyersOrderDate = `${day}/${month}/${year}`;
    let poNo = data.buyer.po_number === "-" ? "" : data.buyer.po_number;
    let consignee = data.buyer.consignee || "";
    let notifyParty = data.buyer.notify_party || "";
    let preCarriage = data.shipping.pre_carriage === "-" ? "" : data.shipping.pre_carriage;
    let vassalFlightNo = data.shipping.vessel_flight_no === "-" ? "" : data.shipping.vessel_flight_no;
    let placeOfReceipt = data.shipping.place_of_receipt || "";
    let portOfLoading = data.shipping.port_of_loading || "";
    let portOfDischarge = data.shipping.port_of_discharge || "";
    let finalDestination = data.shipping.final_destination || "";
    let countryOfOrigin = data.shipping.country_of_origin || "";
    let origin = data.shipping.origin_details || "";
    // let termsOfDelivery = data.payment_term || "FOB";
    let termsOfDeliveryMain = data.payment_term || "";
    let termsOfDelivery: String;
    if (termsOfDeliveryMain == "CIF -> FOB") {
        termsOfDelivery = "CIF";
    } else {
        termsOfDelivery = termsOfDeliveryMain;
    }
    let paymentTerms = data.shipping.payment || "";
    let shippingMethod = data.shipping.shipping_method || "";
    let currency = data.currancy_type || "";
    let currencyRate = data.currancy_rate || "";
    let containerType = data.product_details.nos || "";
    let marksAndNos = data.product_details.marks || "";

    // product_name, size, quantity, unit, sqm_box, total_sqm, price, amount , net_weight, gross_weight

    const reverseTransformProducts = (data: any[]) => { // mann patel
        const result: any[] = [];

        data.forEach((category) => {
            // Add the category as the first element
            result.push([category.category_name, category.hsn_code]);

            // Add all products under the category
            category.products.forEach((product: any) => {
                result.push([
                    product.product_name,
                    product.size,
                    product.quantity,
                    product.unit,
                    product.sqm,
                    product.total_sqm,
                    product.price,
                    product.total_price,
                    product.net_weight,
                    product.gross_weight,
                ]);
            });
        });

        return result;
    };

    let products = reverseTransformProducts(data.product_details.product_section);
    // const products = [
    //   ['Glazed porcelain Floor Tiles ', 482931],
    //   ['Ceramica White', '600X1200', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Stone Grey', '600X1200', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Marble Mist', '600X1200', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Ocean Blue', '600X600', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Sunset Beige', '600X600', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Granite Spark', '600X600', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Lava Black', '600X600', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Glazed Ceramic Wall tiles', 294762],
    //   ['Ivory Pearl', '600X1200', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Alpine Frost', '600X1200', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Sahara Sand', '600X1200', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Cement Ash', '600X600', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Coral Blush', '600X600', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    //   ['Shadow Brown', '600X600', 1000, 'BOX', 1.44, 1440, 10.0, 14400.0, 32522.00, 65465.00],
    // ];
    let packageInfo = data.package.number_of_package || "";
    let [totalPackages, unitOfIt] = packageInfo.split(' ');

    let noOfPackages = totalPackages;
    let grossWeight = data.annexure.gross_weight || "";
    let netWeight = data.annexure.net_weight || "";
    let totalSQM = data.package.total_sqm || "";
    let insurance = data.product_details.insurance || "";
    let freight = data.product_details.freight || "";
    let fOBEuro = data.package.total_amount - insurance - freight;
    let totalFOBEuro = data.package.total_amount;
    if (termsOfDeliveryMain === "CIF -> FOB") {
        fOBEuro = data.package.total_amount;
        totalFOBEuro = data.package.total_amount - insurance - freight;
    }
    let amountInWords = data.package.amount_in_words || "";
    let gstCirculerNumber = data.package.gst_circular || "";
    // let customDate = data.invoice_date || "26-04-2025";
    let arn = data.package.app_ref_number || "";
    let lutDate = data.package.lut_date || "";
    [year, month, day] = lutDate.split('-');
    lutDate = `${day}/${month}/${year}`;
    let totalInINR = data.package.taxable_value || "";

    let gstValue = data.package.gst_amount || "";   // New value // mann patel
    function formatSupplierDetails(suppliers) { // mann Patel
        return suppliers.map(supplier => {
            // Convert GSTIN to numeric-only (if required)
            const numericGstin = supplier.gstin_number;

            // Format date from 'yyyy-mm-dd' to 'dd.mm.yyyy'
            [year, month, day] = supplier.date.split('-');
            let formattedDate = `${day}.${month}.${year}`;

            return [
                supplier.supplier_name,
                numericGstin,
                supplier.tax_invoice_no,
                formattedDate  // Use formatted date or fallback to original
            ];
        });
    }
    let supplierDetails = formatSupplierDetails(data.suppliers || []); // mann patel

    // const supplierDetails = [
    //   ['abc', 3254626216, 'asf/235', '12.02.2025'],
    //   ['def', 3254263511, 'aag/235', '16.02.2025'],
    //   ['ghi', 3252626216, 'dhf/235', '12.12.2025'],
    //   ['jkl', 3246526216, 'hdt/235', '12.06.2025'],
    //   ['mno', 3254632526, 'rth/235', '16.02.2025'],
    //   ['pqr', 3254632526, 'rth/235', '16.02.2025'],
    //   ['xyz', 3254632526, 'rth/235', '16.02.2025'],
    // ];

    // Packing List
    const convertArrayToFormat = (
        data: Array<{ [key: string]: any }>,
        containerSize: string, // Static value for container size
        additionalData: Array<{ booking_no: string; tare_weight: number }> // Array for booking_no and tare_weight
    ): Array<any> => {
        return data.map((item, idx) => [
            item.container_number || '',
            item.line_seal_number || '',
            item.rfid_number || '',
            item.design_no || '',
            item.quantity_box || 0,
            item.net_weight || 0.0,
            item.gross_weight || 0.0,
            containerSize, // Static value for container size
            additionalData[idx]?.booking_no || '', // Booking number from additional data
            additionalData[idx]?.tare_weight || 0, // Tare weight from additional data
        ]);
    };

    // zala your work
    // container_no , line_seal_no , rfid_seal , description , quantity , container.net_weight , container.gross_weight , annexure.container_size , vgn.booking_no , vgn.tare_weight
    // let containerDetails = [
    //   ['EWRUJ4875265', "T 234567884", 'SFSS 1233 2133', 'TILES', 1000, 32522.00, 65465.00, '1 X 20\'', 'SFY35789526', 2342],
    //   ['EWRUJ4875265', "T 234567884", 'SFSS 1233 2133', 'TILES', 1000, 32522.00, 65465.00, '1 X 20\'', 'SFY35789526', 2342],
    //   ['EWRUJ4875265', "T 234567884", 'SFSS 1233 2133', 'TILES', 1000, 32522.00, 65465.00, '1 X 20\'', 'SFY35789526', 2342],
    //   ['EWRUJ4875265', "T 234567884", 'SFSS 1233 2133', 'TILES', 1000, 32522.00, 65465.00, '1 X 20\'', 'SFY35789526', 2342],
    //   ['EWRUJ4875265', "T 234567884", 'SFSS 1233 2133', 'TILES', 1000, 32522.00, 65465.00, '1 X 20\'', 'SFY35789526', 2342],
    //   ['EWRUJ4875265', "T 234567884", 'SFSS 1233 2133', 'TILES', 1000, 32522.00, 65465.00, '1 X 20\'', 'SFY35789526', 2342],
    //   ['EWRUJ4875265', "T 234567884", 'SFSS 1233 2133', 'TILES', 1000, 32522.00, 65465.00, '1 X 20\'', 'SFY35789526', 2342], 
    // ];


    let containerDetails = convertArrayToFormat(data.product_details.containers, data.product_details.marks, data.vgm.containers);
    let totalPallet = data.product_details.total_pallet_count || "";

    // Annexure
    let range = data.annexure.range || "";
    let division = data.annexure.division || "";
    let commissionerate = data.annexure.commissionerate || "";
    let branchCodeNo = "";
    let binNo = "";
    let manufacturer = data.annexure.manufacturer_name || "";
    let manufacturerAddress = data.annexure.manufacturer_address || "";
    let manufacturerGST = data.annexure.manufacturer_gstin_no || "";
    let ann5 = data.annexure.officer_designation1 || "";
    let ann6 = data.annexure.officer_designation2 || "";
    let ann9a = data.annexure.question9a || "";
    let ann9b = data.annexure.question9b || "";
    let ann9c = data.annexure.question9c || "";
    let ann10a = data.annexure.non_containerized || "";
    let ann10b = data.annexure.containerized || "";
    let locationCode = data.annexure.location_code || "";
    let ssPermissionNo = data.annexure.manufacturer_permission || "";
    // let issuedBy = "*******************************************************************************************";
    let selfSealingCircularNo = "59/2010" // new values
    let selfSealingCircularNoDate = "23.12.2010" // new values

    //vgn
    let nameOfOfficial = data.vgm.authorized_name || "";
    let numberOfOfficial = data.vgm.authorized_contact || "";
    let vgn5 = data.vgm.container_number || "";
    let containerSize = data.vgm.container_size || "";
    let vgn7 = data.vgm.permissible_weight || "";
    let vgn8 = data.vgm.weighbridge_registration || "";
    let vgn9 = data.vgm.verified_gross_mass || "";
    let unitOfMeasure = data.vgm.unit_of_measurement || "";
    let vgn12 = data.vgm.weighing_slip_no || "";
    let vgn13 = data.vgm.type || "";
    let vgn14 = data.vgm.IMDG_class || "";


    // let packegingType = unitOfIt;  // Ignore it for now
    let packegingType = products[1][3];  // Ignore it for now
    for (let i = 2; i < products.length; i++) {
        if (products[i].length !== 2) {
            if (!(packegingType.includes(products[i][3]))) {
                packegingType += "/" + products[i][3];
            }
        }
    }

    // let type = "sanitary";
    let typeMain = data.product_type.toLowerCase() || "sanitary"; // Default to "sanitary" if not provided
    let taxStatus = data.integrated_tax.toLowerCase() || "with";

    console.log("typeMain", typeMain, "totalSQM", totalSQM);
    // console.log(totalSQM === "NaN");
    // console.log(totalSQM !== "NaN");
    if (typeMain === "mix" && (totalSQM === "NaN") ) {
        typeMain = "sanitary"
    } else if (typeMain === "mix") {
        typeMain = "tiles"
    }
    let type: String;

    console.log("typeMain", typeMain);
    if (typeMain === "tiles") {
        type = "sanitary"; // 7 column
    } else {
        type = "tiles"; // 4 column
    }
    console.log("type", type);



    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('CUSTOM INVOICE');

    const headerUrl = data.exporter?.header;   // e.g., "https://api.example.com/exporter/header"
    const footerUrl = data.exporter?.footer;
    const signatureUrl = data.exporter?.signature;
    // let response = await fetch('/devabhai.png'); // <-- relative to `public/`
    // let arrayBuf = await response.arrayBuffer();

    // ✅ Add image to workbook
    let vgnFooter;
    let vgnHeader;
    let signature;
    let vgnHeaderW;
    let vgnHeaderH;
    let vgnFooterW;
    let vgnFooterH;
    let vgnSignatureW;
    let vgnSignatureH;
    if (signatureUrl) {

        const { buffer, extension, width, height } = await loadImageBuffer(signatureUrl);
        signature = workbook.addImage({
            buffer: buffer,
            extension: extension,
        });
        vgnSignatureW = width;
        vgnSignatureH = height;

    }





    worksheet.getColumn(1).width = 5;
    worksheet.getCell('A1').value = worksheet.getCell('A1').value || ' ';

    const configurePrintSheet = (sheet: ExcelJS.Worksheet) => {
        sheet.pageSetup = {
            paperSize: 9,            // A4
            orientation: 'portrait',
            fitToPage: true,
            fitToWidth: 1,           // Fit width to one page
            fitToHeight: 0,          // Allow height to flow onto multiple pages
            horizontalCentered: true,
            margins: {
                left: 0.2,
                right: 0.2,
                top: 0.4,
                bottom: 0.4,
                header: 0.2,
                footer: 0.2,
            },
        };
    };

    configurePrintSheet(worksheet);
    // worksheet.pageSetup = {
    //   paperSize: 9,            // A4
    //   orientation: 'portrait',
    //   fitToPage: true,
    //   fitToWidth: 1,           // Fit width to one page
    //   horizontalCentered: true,
    // };

    const setGlobalFontSize = (
        worksheet: ExcelJS.Worksheet,
        fontSize: number = 10
    ) => {
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                const currentFont = cell.font || {};

                // ✅ Only apply size if it's not already defined
                if (!currentFont.size) {
                    cell.font = {
                        ...currentFont,
                        size: fontSize,
                    };
                }
            });
        });
    };


    //setting font size to 10
    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.font = { size: 12 };
        });
    });

    // Setting widht for each column
    const pixelToExcelWidth = (px) => {
        return Math.round(((px - 5) / 7) * 100) / 100;
    };
    worksheet.getColumn(17).hidden = true;


    const columnWidths = [
        47 - 2,  // A (index 1)
        16,  // B
        33,  // C
        33,  // D
        33 - 2,  // E
        33 - 2,  // F
        33 - 2,  // G
        33 - 2,  // H
        72 - 2,  // I
        18 - 2,  // J
        42 - 2,  // K
        34 - 2,  // L
        43 - 2,  // M
        43 - 2,  // N
        43 - 2,  // O
        64 - 2,  // P
        3 - 2,   // Q
        126 - 2, // R
        38,  // S
        38,  // T
        39 - 2,  // U
        71 - 2,  // V
        35 - 2,  // W
        35 - 2,  // X
        75 - 2,  // Y
        85 - 2,  // Z
        84 - 2,  // AA (index 27)
    ];


    const setOuterBorder = (range: string, sheet: ExcelJS.Worksheet, thickness: ExcelJS.BorderStyle = 'thin') => {
        const [startRef, endRef] = range.split(':');

        const colToNum = (col: string): number =>
            col.split('').reduce((r, c) => r * 26 + c.charCodeAt(0) - 64, 0);

        const getRowCol = (ref: string) => {
            const match = ref.match(/^([A-Z]+)(\d+)$/);
            if (!match) throw new Error(`Invalid ref ${ref}`);
            const [, colLetters, rowStr] = match;
            return { row: +rowStr, col: colToNum(colLetters) };
        };

        const { row: startRow, col: startCol } = getRowCol(startRef);
        const { row: endRow, col: endCol } = getRowCol(endRef);

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const cell = sheet.getCell(row, col);
                cell.border = {
                    top: row === startRow ? { style: thickness } : cell.border?.top,
                    bottom: row === endRow ? { style: thickness } : cell.border?.bottom,
                    left: col === startCol ? { style: thickness } : cell.border?.left,
                    right: col === endCol ? { style: thickness } : cell.border?.right,
                };

                // 🔧 Extra fix for Column A (first column)
                if (col === 1) {
                    cell.border.left = { style: thickness };
                }
            }
        }
    };


    workbook.calcProperties.fullCalcOnLoad = true;


    worksheet.mergeCells('A1:AA1');
    worksheet.getCell('A1').value = 'CUSTOMS INVOICE';
    worksheet.getCell('A1').font = { bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    setOuterBorder('A1:AA1', worksheet);

    // ✅ Red note below title
    worksheet.mergeCells('A2:AA2');
    if (taxStatus === "without") {
        worksheet.getCell('A2').value = '“SUPPLY MEANT FOR EXPORT UNDER BOND & LUT- LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX”';
    } else if (taxStatus === "with") {
        worksheet.getCell('A2').value = '“SUPPLY MEANT FOR EXPORT WITH PAYMENT OF INTEGRATED TAX (IGST)”';
    }
    // worksheet.getCell('A2').font = { bold: true, color: { argb: 'FFFF0000' } };
    worksheet.getCell('A2').font = { bold: true, italic: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    setOuterBorder('A2:AA2', worksheet);

    // ✅ Exporter Info
    worksheet.mergeCells('A3:N3');
    worksheet.getCell('A3').value = `EXPORTER:`;
    worksheet.getCell('A3').alignment = { wrapText: true, vertical: 'top' };
    worksheet.getCell('A3').font = { bold: true, underline: true };

    worksheet.mergeCells('A4:N10');
    worksheet.getCell('A4').value = `${companyName}\n${companyAddress}`;
    worksheet.getCell('A4').alignment = { wrapText: true, vertical: 'top' };
    worksheet.getCell('A4').font = { bold: true };
    setOuterBorder('A4:N10', worksheet);

    // ✅ Email & Tax No

    worksheet.mergeCells('A11:B11');
    worksheet.getCell('A11').value = `EMAIL:`;
    worksheet.getCell('A11').font = { bold: true };
    worksheet.getCell('A11').alignment = { wrapText: true };

    worksheet.mergeCells('A12:B12');
    worksheet.getCell('A12').value = `TAX ID:`;
    worksheet.getCell('A12').font = { bold: true };
    worksheet.getCell('A12').alignment = { wrapText: true };

    worksheet.mergeCells('C11:N11');
    worksheet.getCell('C11').value = email;
    worksheet.getCell('C11').alignment = { wrapText: true };

    worksheet.mergeCells('C12:N12');
    worksheet.getCell('C12').value = taxid;
    worksheet.getCell('C12').alignment = { wrapText: true };
    setOuterBorder('A11:N12', worksheet);

    // ✅ Invoice No. & Date
    worksheet.mergeCells('O3:T3');
    worksheet.getCell('O3').value = "Invoice No. & Date:";
    worksheet.getCell('O3').font = { bold: true };
    worksheet.getCell('O3').alignment = { horizontal: 'center' };

    worksheet.mergeCells('O4:T4');
    worksheet.getCell('O4').value = `${invoiceNo}`;

    worksheet.mergeCells('O5:T5');
    worksheet.getCell('O5').value = `Dt. ${invoiceDate}`;

    setOuterBorder('O3:T5', worksheet);

    // ✅ Exporter's Ref
    worksheet.mergeCells('U3:AA3');
    worksheet.getCell('U3').value = "Exporter’s Ref.:";
    worksheet.getCell('U3').font = { bold: true };

    worksheet.mergeCells('U4:AA12');
    worksheet.getCell('U4').value = `I. E. Code #: ${ieCode}\nPAN No #: ${panNo}\nGSTIN No #: ${gstinNo}\nSTATE CODE : ${stateCode}`;
    worksheet.getCell('U4').alignment = { wrapText: true, vertical: 'top' };
    setOuterBorder('U3:AA12', worksheet);

    // ✅ Buyer's Order No
    worksheet.mergeCells('O6:T6');
    worksheet.getCell('O6').value = "Buyer's Order no. & Date";
    worksheet.getCell('O6').font = { bold: true };

    worksheet.mergeCells('O7:T8');
    worksheet.getCell('O7').value = `${buyersOrderNo}    ${buyersOrderDate}`;
    worksheet.getCell('O7').alignment = { wrapText: true, vertical: 'top' };

    worksheet.mergeCells('O12:T12');
    worksheet.getCell('O12').value = `PO No: ${poNo}`;
    setOuterBorder('O6:T12', worksheet);

    // ✅ Consignee
    worksheet.mergeCells('A13:N13');
    worksheet.getCell('A13').value = "Consignee:";
    worksheet.getCell('A13').font = { bold: true, underline: true };

    worksheet.mergeCells('A14:N19');
    worksheet.getCell('A14').value = `${consignee}`;
    worksheet.getCell('A14').alignment = { wrapText: true, vertical: 'top' };
    setOuterBorder('A13:N19', worksheet);

    // ✅ Notify Party
    worksheet.mergeCells('O13:AA13');
    worksheet.getCell('O13').value = "Notify Party # :";
    worksheet.getCell('O13').font = { bold: true };

    worksheet.mergeCells('O14:AA19');
    worksheet.getCell('O14').value = `${notifyParty}`;
    worksheet.getCell('O14').font = { bold: true };
    worksheet.getCell('O14').alignment = { wrapText: true, vertical: 'top' };
    setOuterBorder('O13:AA19', worksheet, 'medium'); // Removalble

    worksheet.mergeCells('A20:G20');
    worksheet.getCell('A20').value = 'Pre-Carriage By';
    // worksheet.getCell('A20').font = { bold: true };
    worksheet.getCell('A20').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A21:G21');
    worksheet.getCell('A21').value = `${preCarriage}`;
    worksheet.getCell('A21').font = { color: { argb: 'FFFF0000' }, bold: true };
    worksheet.getCell('A21').alignment = { horizontal: 'center' };
    setOuterBorder('A20:G21', worksheet);

    worksheet.mergeCells('H20:N20');
    worksheet.getCell('H20').value = "Place of Receipt by Pre-Carrier";
    // worksheet.getCell('H20').font = { bold: true };
    worksheet.getCell('H20').alignment = { horizontal: 'center' };

    worksheet.mergeCells('H21:N21');
    worksheet.getCell('H21').value = `${placeOfReceipt}`;
    worksheet.getCell('H21').font = { color: { argb: 'FFFF0000' }, bold: true };
    worksheet.getCell('H21').alignment = { horizontal: 'center' };
    setOuterBorder('H20:N21', worksheet);

    worksheet.mergeCells('O20:V20');
    // worksheet.getCell('O20').value = `Country of Origin of Goods : ${countryOfOrigin}`;
    worksheet.getCell('O20').value = {
        richText: [
            { text: 'Country of Origin of Goods : ', font: { bold: false } },
            { text: countryOfOrigin, font: { bold: true } }
        ]
    };
    worksheet.getCell('O20').alignment = { horizontal: 'center' };

    worksheet.mergeCells('O21:V21');
    worksheet.getCell('O21').value = `ORIGIN : ${origin}`;
    worksheet.getCell('O21').font = { bold: true };
    worksheet.getCell('O21').alignment = { horizontal: 'center' };
    setOuterBorder('O20:V21', worksheet);

    worksheet.mergeCells('W20:AA20');
    worksheet.getCell('W20').value = "Country of Final Destination";
    worksheet.getCell('W20').alignment = { horizontal: 'center' };

    worksheet.mergeCells('W21:AA21');
    worksheet.getCell('W21').value = `${finalDestination}`;
    worksheet.getCell('W21').font = { bold: true };
    worksheet.getCell('W21').alignment = { horizontal: 'center' };
    setOuterBorder('W20:AA21', worksheet);

    worksheet.mergeCells('A22:G22');
    worksheet.getCell('A22').value = 'Vessel Flight No.';
    // worksheet.getCell('A22').font = { bold: true };
    worksheet.getCell('A22').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A23:G23');
    worksheet.getCell('A23').value = `${vassalFlightNo}`;
    worksheet.getCell('A23').font = { color: { argb: 'FFFF0000' }, bold: true };
    worksheet.getCell('A23').alignment = { horizontal: 'center' };
    setOuterBorder('A22:G23', worksheet);

    worksheet.mergeCells('H22:N22');
    worksheet.getCell('H22').value = "Port of Loading";
    // worksheet.getCell('H22').font = { bold: true };
    worksheet.getCell('H22').alignment = { horizontal: 'center' };

    worksheet.mergeCells('H23:N23');
    worksheet.getCell('H23').value = `${portOfLoading}`;
    worksheet.getCell('H23').font = { color: { argb: 'FFFF0000' }, bold: true };
    worksheet.getCell('H23').alignment = { horizontal: 'center' };
    setOuterBorder('H22:N23', worksheet);

    worksheet.mergeCells('A24:G24');
    worksheet.getCell('A24').value = 'Port of Discharge';
    // worksheet.getCell('A24').font = { bold: true };
    worksheet.getCell('A24').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A25:G26');
    worksheet.getCell('A25').value = `${portOfDischarge}`;
    worksheet.getCell('A25').font = { color: { argb: 'FFFF0000' }, bold: true };
    worksheet.getCell('A25').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('A24:G26', worksheet);

    worksheet.mergeCells('H24:N24');
    worksheet.getCell('H24').value = "Final Destination";
    // worksheet.getCell('H24').font = { bold: true };
    worksheet.getCell('H24').alignment = { horizontal: 'center' };

    worksheet.mergeCells('H25:N26');
    worksheet.getCell('H25').value = `${finalDestination}`;
    worksheet.getCell('H25').font = { color: { argb: 'FFFF0000' }, bold: true };
    worksheet.getCell('H25').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('H24:N26', worksheet);

    worksheet.mergeCells('O22:AA22');
    worksheet.getCell('O22').value = "Terms of Delivery & Payment :-";
    worksheet.getCell('O22').font = { bold: true };

    worksheet.mergeCells('O23:AA23');
    if (termsOfDelivery === "FOB") {
        worksheet.getCell('O23').value = `${termsOfDelivery} AT ${portOfLoading} PORT`;
    } else {
        worksheet.getCell('O23').value = `${termsOfDelivery} AT ${portOfDischarge} PORT`;
    }
    worksheet.getCell('O23').font = { color: { argb: 'FFFF0000' } };

    worksheet.mergeCells('O24:AA25');
    worksheet.getCell('O24').value = `PAYMENT : ${paymentTerms}`;
    worksheet.getCell('O24').font = { name: 'Arial', color: { argb: 'FFFF0000' } };
    worksheet.getCell('O24').alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };

    worksheet.mergeCells('O26:U26');
    worksheet.getCell('O26').value = shippingMethod;
    setOuterBorder('O22:AA26', worksheet);

    if (type !== "tiles") {
        worksheet.mergeCells('W26:Y26');
        worksheet.getCell('W26').value = `${currency} RATE:`;
        worksheet.getCell('W26').alignment = { horizontal: 'center' };
        worksheet.getCell('W26').font = { bold: true };

        worksheet.mergeCells('Z26:AA26');
        worksheet.getCell('Z26').value = currencyRate;
        // worksheet.getCell('Z26').fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
        // };

        worksheet.getCell('Z26').alignment = { horizontal: 'center' };
        worksheet.getCell('Z26').font = { bold: true };
        setOuterBorder('W26:AA26', worksheet, 'medium');
    } else {
        worksheet.mergeCells('V26:X26');
        worksheet.getCell('V26').value = `${currency} RATE:`;
        worksheet.getCell('V26').alignment = { horizontal: 'center' };
        worksheet.getCell('V26').font = { bold: true };

        worksheet.mergeCells('Y26:AA26');
        worksheet.getCell('Y26').value = currencyRate;
        worksheet.getCell('Y26').alignment = { horizontal: 'center' };
        // worksheet.getCell('Y26').fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
        // };

        worksheet.getCell('Y26').font = { bold: true };
        setOuterBorder('V26:AA26', worksheet, 'medium');
    }

    worksheet.mergeCells('A27:D27');
    worksheet.getCell('A27').value = "Marks & Nos.";
    worksheet.getCell('A27').font = { bold: true };
    worksheet.getCell('A27').alignment = { horizontal: 'center' };

    if (containerType === 'FCL') {
        worksheet.mergeCells('A28:D28');
        worksheet.getCell('A28').value = `${marksAndNos} ${containerType}`;
        worksheet.getCell('A28').font = { bold: true };
        worksheet.getCell('A28').alignment = { horizontal: 'center' };
        setOuterBorder('A27:D28', worksheet, 'medium');
    } else {
        worksheet.mergeCells('A28:D28');
        worksheet.getCell('A28').value = `${containerType}`;
        worksheet.getCell('A28').font = { bold: true };
        worksheet.getCell('A28').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('A27:D28', worksheet, 'medium');
    }
    worksheet.getRow(28).height = 24;

    worksheet.mergeCells('E27:Q28');
    worksheet.getCell('E27').value = "Description of Goods";
    worksheet.getCell('E27').font = { bold: true };
    worksheet.getCell('E27').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('E27:Q28', worksheet, 'medium');

    if (type !== "tiles") {
        worksheet.getCell('R27').value = "SIZE";
        worksheet.getCell('R27').font = { bold: true };
        worksheet.getCell('R27').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.getCell('R28').value = "MM";
        worksheet.getCell('R28').font = { bold: true };
        worksheet.getCell('R28').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('R27:R28', worksheet, 'medium');

        worksheet.mergeCells('S27:T27')
        worksheet.getCell('S27').value = "QUANTITY";
        worksheet.getCell('S27').font = { bold: true };
        worksheet.getCell('S27').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('S28:T28')
        worksheet.getCell('S28').value = packegingType;
        worksheet.getCell('S28').font = { bold: true };
        worksheet.getCell('S28').alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        setOuterBorder('S27:T28', worksheet, 'medium');
        if (packegingType.length > 8) {
            worksheet.getCell('S28').font = { size: 8, bold: true };
        }

        worksheet.mergeCells('U27:V27')
        worksheet.getCell('U27').value = "UNIT TYPE";
        worksheet.getCell('U27').font = { bold: true };
        worksheet.getCell('U27').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('U28:V28')
        worksheet.getCell('U28').value = packegingType;
        worksheet.getCell('U28').font = { bold: true };
        worksheet.getCell('U28').alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        setOuterBorder('U27:V28', worksheet, 'medium');

        worksheet.mergeCells('W27:X27')
        worksheet.getCell('W27').value = "SQM/";
        worksheet.getCell('W27').font = { bold: true };
        worksheet.getCell('W27').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('W28:X28')
        worksheet.getCell('W28').value = unitOfIt;
        worksheet.getCell('W28').font = { bold: true };
        worksheet.getCell('W28').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('W27:X28', worksheet, 'medium');

        worksheet.getCell('Y27').value = "TOTAL";
        worksheet.getCell('Y27').font = { bold: true };
        worksheet.getCell('Y27').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.getCell('Y28').value = "SQM";
        worksheet.getCell('Y28').font = { bold: true };
        worksheet.getCell('Y28').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('Y27:Y28', worksheet, 'medium');

        worksheet.getCell('Z27').value = "PRICE/";
        worksheet.getCell('Z27').font = { bold: true };
        worksheet.getCell('Z27').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.getCell('Z28').value = "SQM";
        worksheet.getCell('Z28').font = { bold: true };
        worksheet.getCell('Z28').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('Z27:Z28', worksheet, 'medium');

        worksheet.getCell('AA27').value = "AMOUNT";
        worksheet.getCell('AA27').font = { bold: true };
        worksheet.getCell('AA27').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.getCell('AA28').value = `IN (${currency})`;
        worksheet.getCell('AA28').font = { bold: true };
        worksheet.getCell('AA28').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('AA27:AA28', worksheet, 'medium');
    }
    else {
        worksheet.mergeCells('R27:S27')
        worksheet.getCell('R27').value = "QUANTITY";
        worksheet.getCell('R27').font = { bold: true };
        worksheet.getCell('R27').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('R28:S28')
        worksheet.getCell('R28').value = "PKGS";
        worksheet.getCell('R28').font = { bold: true };
        worksheet.getCell('R28').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('R27:S28', worksheet);

        worksheet.mergeCells('T27:U27')
        worksheet.getCell('T27').value = "UNIT TYPE";
        worksheet.getCell('T27').font = { bold: true };
        worksheet.getCell('T27').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('T28:U28')
        worksheet.getCell('T28').value = packegingType;
        worksheet.getCell('T28').font = { bold: true };
        worksheet.getCell('T28').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('T27:U28', worksheet);
        if (packegingType.length > 8) {
            worksheet.getCell('T28').font = { size: 8, bold: true };
        }

        worksheet.mergeCells('V27:X27')
        worksheet.getCell('V27').value = "RATE PER";
        worksheet.getCell('V27').font = { bold: true };
        worksheet.getCell('V27').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('V28:X28')
        worksheet.getCell('V28').value = `UNIT (${currency})`;
        worksheet.getCell('V28').font = { bold: true };
        worksheet.getCell('V28').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('V27:X28', worksheet);

        worksheet.mergeCells('Y27:AA27')
        worksheet.getCell('Y27').value = "AMOUNT/";
        worksheet.getCell('Y27').font = { bold: true };
        worksheet.getCell('Y27').alignment = { horizontal: 'center', vertical: 'middle' };

        worksheet.mergeCells('Y28:AA28')
        worksheet.getCell('Y28').value = `IN (${currency})`;
        worksheet.getCell('Y28').font = { bold: true };
        worksheet.getCell('Y28').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('Y27:AA28', worksheet);
    }
    if (packegingType.length > 6) {
        worksheet.getRow(28).width = 36;
    }

    worksheet.getCell('A29').value = "SR NO.";
    worksheet.getCell('A29').font = { bold: true };
    worksheet.getCell('A29').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell('A29').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    worksheet.mergeCells('B29:D29');
    worksheet.getCell('B29').value = "HSN CODE";
    worksheet.getCell('B29').font = { bold: true };
    worksheet.getCell('B29').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('B29:D29', worksheet);

    // Table saction

    let srNo = 1;
    let row = 28;
    let hsnCode: number;
    let allProductsType: string;
    for (let i = 0; i < products.length; i++) {
        if (type !== "tiles") {
            row++;
            if (products[i].length === 2) {
                worksheet.mergeCells('E' + row + ':Q' + row);
                worksheet.getCell('E' + row).value = products[i][0];
                // worksheet.getCell('E' + row).fill = {
                //     type: 'pattern',
                //     pattern: 'solid',
                //     fgColor: { argb: 'FFFFCC99' }, // Light orange / peach
                // };
                worksheet.getCell('E' + row).font = { bold: true, size: 12 };
                worksheet.getCell('E' + row).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getRow(row).height = 46;
                setOuterBorder('E' + row + ':Q' + row, worksheet);
                hsnCode = Number(products[i][1]);
                if (i == 0) {
                    allProductsType = String(products[i][0]);
                }
                else {
                    allProductsType += '/' + String(products[i][0]);
                }

                if (i !== 0) {
                    worksheet.getCell('A' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };

                    setOuterBorder('B' + row + ':D' + row, worksheet);
                }
                setOuterBorder('E' + row + ':Q' + row, worksheet);

                worksheet.getCell('R' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                setOuterBorder('S' + row + ':T' + row, worksheet);
                setOuterBorder('U' + row + ':V' + row, worksheet);
                setOuterBorder('W' + row + ':X' + row, worksheet);

                worksheet.getCell('Y' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                worksheet.getCell('Z' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                worksheet.getCell('AA' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };

            } else {

                worksheet.getCell('A' + row).value = srNo;
                worksheet.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                worksheet.getCell('A' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };
                srNo++;

                worksheet.mergeCells('B' + row + ':D' + row);
                worksheet.getCell('B' + row).value = hsnCode;
                worksheet.getCell('B' + row).font = { bold: true };
                worksheet.getCell('B' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('B' + row + ':D' + row, worksheet);

                worksheet.mergeCells('E' + row + ':Q' + row);
                worksheet.getCell('E' + row).value = products[i][0];
                worksheet.getCell('E' + row).font = { size: 12 };
                worksheet.getCell('E' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('E' + row + ':Q' + row, worksheet);
                if (String(products[i][0]).length > 56) {
                    worksheet.getRow(row).height = 36;
                }

                if (products[i][1] === "-") {
                    worksheet.getCell('R' + row).value = "-";
                } else {
                    worksheet.getCell('R' + row).value = products[i][1];
                }
                worksheet.getCell('R' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                worksheet.getCell('R' + row).font = { size: 12 };
                worksheet.getCell('R' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                worksheet.mergeCells('S' + row + ':T' + row);
                worksheet.getCell('S' + row).value = products[i][2];
                worksheet.getCell('S' + row).font = { size: 12 };
                worksheet.getCell('S' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('S' + row + ':T' + row, worksheet);

                worksheet.mergeCells('U' + row + ':V' + row);
                worksheet.getCell('U' + row).value = products[i][3];
                worksheet.getCell('U' + row).font = { size: 12 };
                worksheet.getCell('U' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('U' + row + ':V' + row, worksheet);

                worksheet.mergeCells('W' + row + ':X' + row);
                if (products[i][4] === "-") {
                    worksheet.getCell('W' + row).value = "-";
                } else {
                    worksheet.getCell('W' + row).value = products[i][4];
                }
                worksheet.getCell('W' + row).font = { size: 12 };
                worksheet.getCell('W' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('W' + row + ':X' + row, worksheet);

                if (products[i][5] === "-") {
                    worksheet.getCell('Y' + row).value = "-";
                } else {
                    if (products[i][4] === "-") {
                        if (products[i][5] === "" || products[i][5] === 0) {
                            worksheet.getCell('Y' + row).value = "-";
                        } else {
                            worksheet.getCell('Y' + row).value = products[i][5];
                        }
                    } else {
                        worksheet.getCell('Y' + row).value = { formula: `S${row}*W${row}`, result: 0 };
                    }
                }
                worksheet.getCell('Y' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                worksheet.getCell('Y' + row).font = { size: 12 };
                worksheet.getCell('Y' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                worksheet.getCell('Z' + row).value = products[i][6];
                worksheet.getCell('Z' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                worksheet.getCell('Z' + row).font = { size: 12 };
                worksheet.getCell('Z' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };
                worksheet.getCell('Z' + row).numFmt = '0.00';

                // worksheet.getCell('AA' + row).value = products[i][7];
                if (products[i][1] === "-") {
                    if (products[i][5] === "" || products[i][5] === 0) {
                        worksheet.getCell('AA' + row).value = { formula: `ROUND(S${row}*Z${row}, 2)`, result: 0 };
                    } else {
                        worksheet.getCell('AA' + row).value = { formula: `ROUND(Y${row}*Z${row}, 2)`, result: 0 };
                    }
                } else {
                    worksheet.getCell('AA' + row).value = { formula: `ROUND(Y${row}*Z${row}, 2)`, result: 0 };
                }
                worksheet.getCell('AA' + row).numFmt = '0.00';
                worksheet.getCell('AA' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                worksheet.getCell('AA' + row).font = { size: 12 };
                worksheet.getCell('AA' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };

            }
        }
        else {
            row++;
            if (products[i].length === 2) {
                worksheet.mergeCells('E' + row + ':Q' + row);
                worksheet.getCell('E' + row).value = products[i][0];
                // worksheet.getCell('E' + row).fill = {
                //     type: 'pattern',
                //     pattern: 'solid',
                //     fgColor: { argb: 'FFFFCC99' }, // Light orange / peach
                // };

                worksheet.getCell('E' + row).font = { bold: true, size: 12 };
                worksheet.getCell('E' + row).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getRow(row).height = 46;
                setOuterBorder('E' + row + ':Q' + row, worksheet);
                hsnCode = Number(products[i][1]);
                if (i == 0) {
                    allProductsType = String(products[i][0]);
                }
                else {
                    allProductsType += '/' + String(products[i][0]);
                }

                if (i !== 0) {
                    worksheet.getCell('A' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };

                    setOuterBorder('B' + row + ':D' + row, worksheet);
                }
                setOuterBorder('E' + row + ':Q' + row, worksheet);

                setOuterBorder('R' + row + ':S' + row, worksheet);
                setOuterBorder('T' + row + ':U' + row, worksheet);
                setOuterBorder('V' + row + ':X' + row, worksheet);
                setOuterBorder('Y' + row + ':AA' + row, worksheet);

            } else {
                worksheet.getCell('A' + row).value = srNo;
                worksheet.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                worksheet.getCell('A' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };
                srNo++;

                worksheet.mergeCells('B' + row + ':D' + row);
                worksheet.getCell('B' + row).value = hsnCode;
                worksheet.getCell('B' + row).font = { bold: true };
                worksheet.getCell('B' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('B' + row + ':D' + row, worksheet);

                worksheet.mergeCells('E' + row + ':Q' + row);
                worksheet.getCell('E' + row).value = products[i][0];
                worksheet.getCell('E' + row).font = { size: 12 };
                worksheet.getCell('E' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('E' + row + ':Q' + row, worksheet);
                if (String(products[i][0]).length > 56) {
                    worksheet.getRow(row).height = 36;
                }

                worksheet.mergeCells('R' + row + ':S' + row);
                worksheet.getCell('R' + row).value = products[i][2];
                worksheet.getCell('R' + row).font = { size: 12 };
                worksheet.getCell('R' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('R' + row + ':S' + row, worksheet);

                worksheet.mergeCells('T' + row + ':U' + row);
                worksheet.getCell('T' + row).value = products[i][3];
                worksheet.getCell('T' + row).font = { size: 12 };
                worksheet.getCell('T' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('T' + row + ':U' + row, worksheet);

                worksheet.mergeCells('V' + row + ':X' + row);
                worksheet.getCell('V' + row).value = products[i][6];
                worksheet.getCell('V' + row).numFmt = '0.00';
                worksheet.getCell('V' + row).font = { size: 12 };
                worksheet.getCell('V' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('V' + row + ':X' + row, worksheet);

                worksheet.mergeCells('Y' + row + ':AA' + row);
                // worksheet.getCell('Y' + row).value = products[i][7];
                worksheet.getCell('Y' + row).value = { formula: `ROUND(R${row}*V${row}, 2)`, result: 0 };
                worksheet.getCell('Y' + row).numFmt = '0.00';
                worksheet.getCell('Y' + row).font = { size: 12 };
                worksheet.getCell('Y' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('Y' + row + ':AA' + row, worksheet);
            }
        }
    }

    row++;
    worksheet.mergeCells('A' + row + ':D' + (row + 7));
    setOuterBorder('A' + row + ':D' + (row + 7), worksheet);

    let skipRow = 3;
    let addSkipRow = 6;
    if (taxStatus == "with") {
        skipRow = 2;
        addSkipRow = 7;
    }
    if (type !== "tiles") {
        for (let i = 0; i < skipRow; i++) {
            setOuterBorder('E' + row + ':Q' + row, worksheet);

            worksheet.getCell('R' + row).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            setOuterBorder('S' + row + ':T' + row, worksheet);
            setOuterBorder('U' + row + ':V' + row, worksheet);
            setOuterBorder('W' + row + ':X' + row, worksheet);

            worksheet.getCell('Y' + row).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            worksheet.getCell('Z' + row).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            worksheet.getCell('AA' + row).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };
            row++;
        }

        worksheet.mergeCells('R' + row + ':R' + (row + addSkipRow));
        setOuterBorder('R' + row + ':R' + (row + addSkipRow), worksheet);
        worksheet.mergeCells('S' + row + ':T' + (row + addSkipRow));
        setOuterBorder('S' + row + ':T' + (row + addSkipRow), worksheet);
        worksheet.mergeCells('U' + row + ':V' + (row + addSkipRow));
        setOuterBorder('U' + row + ':V' + (row + addSkipRow), worksheet);
        worksheet.mergeCells('W' + row + ':X' + (row + addSkipRow));
        setOuterBorder('W' + row + ':X' + (row + addSkipRow), worksheet);
        worksheet.mergeCells('Y' + row + ':Y' + (row + addSkipRow));
        setOuterBorder('Y' + row + ':Y' + (row + addSkipRow), worksheet);
        worksheet.mergeCells('Z' + row + ':Z' + (row + addSkipRow));
        setOuterBorder('Z' + row + ':Z' + (row + addSkipRow), worksheet);
        worksheet.mergeCells('AA' + row + ':AA' + (row + addSkipRow));
        setOuterBorder('AA' + row + ':AA' + (row + addSkipRow), worksheet);
    }
    else {
        for (let i = 0; i < skipRow; i++) {
            setOuterBorder('E' + row + ':Q' + row, worksheet);

            setOuterBorder('R' + row + ':S' + row, worksheet);
            setOuterBorder('T' + row + ':U' + row, worksheet);
            setOuterBorder('V' + row + ':X' + row, worksheet);
            setOuterBorder('Y' + row + ':AA' + row, worksheet);
            row++;
        }

        worksheet.mergeCells('R' + row + ':S' + (row + addSkipRow));
        setOuterBorder('R' + row + ':S' + (row + addSkipRow), worksheet);
        worksheet.mergeCells('T' + row + ':U' + (row + addSkipRow));
        setOuterBorder('T' + row + ':U' + (row + addSkipRow), worksheet);
        worksheet.mergeCells('V' + row + ':X' + (row + addSkipRow));
        setOuterBorder('V' + row + ':X' + (row + addSkipRow), worksheet);
        worksheet.mergeCells('Y' + row + ':AA' + (row + addSkipRow));
        setOuterBorder('Y' + row + ':AA' + (row + addSkipRow), worksheet);
    }

    if (taxStatus == "with") {
        worksheet.mergeCells('E' + row + ':Q' + row);
        worksheet.getCell('E' + row).value = "CERTIFIED THAT GOODS ARE OF INDIAN ORIGIN";
        worksheet.getCell('E' + row).font = { name: 'Arial' };
        worksheet.getCell('E' + row).alignment = { horizontal: 'center' };
        setOuterBorder('E' + row + ':Q' + row, worksheet);
        row++;
    }

    worksheet.mergeCells('E' + row + ':Q' + row);
    worksheet.getCell('E' + row).value = "Export Under Duty Drawback Scheme";
    worksheet.getCell('E' + row).font = { bold: true };
    worksheet.getCell('E' + row).alignment = { horizontal: 'center' };
    setOuterBorder('E' + row + ':Q' + row, worksheet);
    row++;

    worksheet.mergeCells('E' + row + ':Q' + (row + 1));
    worksheet.getCell('E' + row).value = "I/we shall claim under chapter 3 incentive of FTP as admissible at time policy in force - MEIS, RODTEP ";
    worksheet.getCell('E' + row).font = { bold: true };
    worksheet.getCell('E' + row).alignment = { wrapText: true, horizontal: 'center' };
    setOuterBorder('E' + row + ':Q' + (row + 1), worksheet);
    row += 2;

    worksheet.mergeCells('E' + row + ':Q' + (row + 1));
    setOuterBorder('E' + row + ':Q' + (row + 1), worksheet);
    row += 2;

    if (type !== 'tiles') {
        worksheet.mergeCells('A' + row + ':E' + row);
        worksheet.getCell('A' + row).value = "NET WT. (KGS): ";
        worksheet.getCell('A' + row).font = { underline: true };
        worksheet.getCell('A' + row).alignment = { horizontal: 'right' };
        setOuterBorder('A' + row + ':E' + row, worksheet);

        worksheet.mergeCells('F' + row + ':H' + row);
        worksheet.getCell('F' + row).value = netWeight;
        worksheet.getCell('F' + row).numFmt = '0.00';
        worksheet.getCell('F' + row).font = { underline: true };
        // worksheet.getCell('F' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };

        worksheet.getCell('F' + row).font = { bold: true };
        worksheet.getCell('F' + row).alignment = { horizontal: 'left' };
        setOuterBorder('F' + row + ':H' + row, worksheet);

        worksheet.mergeCells('I' + row + ':Q' + row);
        setOuterBorder('I' + row + ':Q' + row, worksheet);
        row++;

        worksheet.mergeCells('A' + row + ':E' + row);
        worksheet.getCell('A' + row).value = "GROSS WT.(KGS): ";
        worksheet.getCell('A' + row).font = { underline: true };
        worksheet.getCell('A' + row).alignment = { horizontal: 'right' };
        setOuterBorder('A' + row + ':E' + row, worksheet);

        worksheet.mergeCells('F' + row + ':H' + row);
        worksheet.getCell('F' + row).value = grossWeight;
        worksheet.getCell('F' + row).numFmt = '0.00';
        worksheet.getCell('F' + row).font = { underline: true };
        // worksheet.getCell('F' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };

        worksheet.getCell('F' + row).font = { bold: true };
        worksheet.getCell('F' + row).alignment = { horizontal: 'left' };
        setOuterBorder('F' + row + ':H' + row, worksheet);

        worksheet.mergeCells('I' + row + ':Q' + row);
        setOuterBorder('I' + row + ':Q' + row, worksheet);
        row++;
    } else {
        worksheet.mergeCells('A' + row + ':D' + row);
        worksheet.getCell('A' + row).value = "NET WT. (KGS): ";
        worksheet.getCell('A' + row).font = { underline: true };
        worksheet.getCell('A' + row).alignment = { horizontal: 'right' };
        setOuterBorder('A' + row + ':D' + row, worksheet);

        worksheet.mergeCells('E' + row + ':G' + row);
        worksheet.getCell('E' + row).value = netWeight;
        worksheet.getCell('E' + row).numFmt = '0.00';
        worksheet.getCell('E' + row).font = { underline: true };
        // worksheet.getCell('E' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };

        worksheet.getCell('E' + row).font = { bold: true };
        worksheet.getCell('E' + row).alignment = { horizontal: 'left' };
        setOuterBorder('E' + row + ':G' + row, worksheet);

        worksheet.mergeCells('H' + row + ':Q' + row);
        setOuterBorder('H' + row + ':Q' + row, worksheet);
        row++;

        worksheet.mergeCells('A' + row + ':D' + row);
        worksheet.getCell('A' + row).value = "GROSS WT.(KGS): ";
        worksheet.getCell('A' + row).font = { underline: true };
        worksheet.getCell('A' + row).alignment = { horizontal: 'right' };
        setOuterBorder('A' + row + ':D' + row, worksheet);

        worksheet.mergeCells('E' + row + ':G' + row);
        worksheet.getCell('E' + row).value = grossWeight;
        worksheet.getCell('E' + row).numFmt = '0.00';
        worksheet.getCell('E' + row).font = { underline: true };
        // worksheet.getCell('E' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };

        worksheet.getCell('E' + row).font = { bold: true };
        worksheet.getCell('E' + row).alignment = { horizontal: 'left' };
        setOuterBorder('E' + row + ':G' + row, worksheet);

        worksheet.mergeCells('H' + row + ':Q' + row);
        setOuterBorder('H' + row + ':Q' + row, worksheet);
        row++;
    }

    worksheet.mergeCells('A' + row + ':G' + row);
    worksheet.getCell('A' + row).value = "Nos. of Kind Packages";
    worksheet.getCell('A' + row).font = { bold: true };
    worksheet.getCell('A' + row).alignment = { horizontal: 'center' };

    worksheet.mergeCells('H' + row + ':Q' + (row + 1));
    worksheet.getCell('H' + row).value = "Total     >>>>>>>>>>";
    worksheet.getCell('H' + row).font = { bold: true };
    worksheet.getCell('H' + row).alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('H' + row + ':Q' + (row + 1), worksheet);

    if (type !== "tiles") {
        setOuterBorder('R' + row + ':R' + (row + 1), worksheet);

        worksheet.mergeCells('S' + row + ':T' + row);
        worksheet.getCell('S' + row).value = { formula: `SUM(S30:S${row - 1})`, result: 0 };
        ;
        worksheet.getCell('S' + row).font = { bold: true };
        worksheet.getCell('S' + row).alignment = { horizontal: 'center' };

        setOuterBorder('U' + row + ':V' + (row + 1), worksheet);

        worksheet.mergeCells('W' + row + ':Y' + row);
        worksheet.getCell('W' + row).value = `TOTAL SQM`;
        worksheet.getCell('W' + row).font = { bold: true };
        worksheet.getCell('W' + row).alignment = { horizontal: 'center' };

        worksheet.mergeCells('W' + (row + 1) + ':Y' + (row + 1));
        worksheet.getCell('W' + (row + 1)).value = { formula: `SUM(Y30:Y${row - 1})`, result: 0 };
        ;
        worksheet.getCell('W' + (row + 1)).font = { bold: true };
        worksheet.getCell('W' + (row + 1)).alignment = { horizontal: 'center' };
        setOuterBorder('W' + row + ':Y' + (row + 1), worksheet);

        worksheet.mergeCells('Z' + row + ':Z' + (row + 1));
        if (termsOfDeliveryMain === "CIF -> FOB") {
            worksheet.getCell('Z' + row).value = `CIF ${currency}`;
            // } else if (termsOfDeliveryMain === "CNF") {
            //     worksheet.getCell('Z' + row).value = `TOTAL ${termsOfDelivery} ${currency}`;
        } else {
            worksheet.getCell('Z' + row).value = `${termsOfDelivery} ${currency}`;
        }
        worksheet.getCell('Z' + row).font = { bold: true };
        worksheet.getCell('Z' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        setOuterBorder('Z' + row + ':Z' + (row + 1), worksheet);

        worksheet.mergeCells('AA' + row + ':AA' + (row + 1));
        if (termsOfDeliveryMain === "CIF -> FOB") {
            worksheet.getCell('AA' + row).value = { formula: `ROUND(AA${row + 4} - ${insurance} - ${freight}, 2)`, result: 0 };
        } else {
            worksheet.getCell('AA' + row).value = { formula: `ROUND(SUM(AA28:AA${row - 1}), 2)`, result: 0 };
        }        // worksheet.getCell('AA' + row).value = {
        //   formula: `SUM(AA30:AA${row-1})`,
        //   result: 0, // optional static value
        // };
        worksheet.getCell('AA' + row).font = { bold: true };
        worksheet.getCell('AA' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('AA' + row + ':AA' + (row + 1), worksheet);
    }
    else {
        worksheet.mergeCells('R' + row + ':S' + row);
        worksheet.getCell('R' + row).value = { formula: `ROUND(SUM(R30:R${row - 1}), 2)`, result: 0 };
        worksheet.getCell('R' + row).font = { bold: true };
        worksheet.getCell('R' + row).alignment = { horizontal: 'center' };

        worksheet.mergeCells('T' + row + ':U' + row);
        worksheet.getCell('T' + row).value = "UNIT TYPE";
        worksheet.getCell('T' + row).font = { bold: true };
        worksheet.getCell('T' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('T' + row + ':U' + row, worksheet);

        worksheet.mergeCells('T' + (row + 1) + ':U' + (row + 1));
        worksheet.getCell('T' + (row + 1)).value = packegingType;
        worksheet.getCell('T' + (row + 1)).font = { bold: true };
        worksheet.getCell('T' + (row + 1)).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('T' + (row + 1) + ':U' + (row + 1), worksheet);

        worksheet.mergeCells('V' + row + ':X' + (row + 1));
        if (termsOfDeliveryMain === "CIF -> FOB") {
            worksheet.getCell('V' + row).value = `CIF ${currency}`;
            // } else if (termsOfDeliveryMain === "CNF") {
            //     worksheet.getCell('V' + row).value = `TOTAL ${termsOfDelivery} ${currency}`;
        } else {
            worksheet.getCell('V' + row).value = `${termsOfDelivery} ${currency}`;
        }
        worksheet.getCell('V' + row).font = { bold: true };
        worksheet.getCell('V' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('V' + row + ':X' + (row + 1), worksheet);



        worksheet.mergeCells('Y' + row + ':AA' + (row + 1));
        if (termsOfDeliveryMain === "CIF -> FOB") {
            worksheet.getCell('Y' + row).value = { formula: `ROUND(Y${row + 4} - ${insurance} - ${freight}, 2)`, result: 0 };
        } else {
            worksheet.getCell('Y' + row).value = { formula: `ROUND(SUM(Y30:Y${row - 1}), 2)`, result: 0 };
        }
        worksheet.getCell('Y' + row).font = { bold: true };
        worksheet.getCell('Y' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('Y' + row + ':AA' + (row + 1), worksheet);
    }
    row++;

    worksheet.mergeCells('A' + row + ':G' + row);
    if (type !== "tiles") {
        worksheet.getCell('A' + row).value = { formula: `INT(SUM(S30:S${row - 2})) & " ${unitOfIt}"`, result: `0${unitOfIt}`, };
    }
    else {
        worksheet.getCell('A' + row).value = { formula: `INT(SUM(R30:R${row - 2})) & " ${unitOfIt}"`, result: `0${unitOfIt}`, };
    }
    worksheet.getCell('A' + row).font = { bold: true };
    worksheet.getCell('A' + row).alignment = { horizontal: 'center' };
    setOuterBorder('A' + (row - 1) + ':G' + row, worksheet);

    if (type !== "tiles") {
        worksheet.mergeCells('S' + row + ':T' + row);
        worksheet.getCell('S' + row).value = unitOfIt;
        worksheet.getCell('S' + row).font = { bold: true };
        worksheet.getCell('S' + row).alignment = { horizontal: 'center' };
        setOuterBorder('S' + (row - 1) + ':T' + row, worksheet);
    }
    else {
        worksheet.mergeCells('R' + row + ':S' + row);
        worksheet.getCell('R' + row).value = unitOfIt;
        worksheet.getCell('R' + row).font = { bold: true };
        worksheet.getCell('R' + row).alignment = { horizontal: 'center' };
        setOuterBorder('R' + (row - 1) + ':S' + row, worksheet);
    }
    row++;

    worksheet.mergeCells('A' + row + ':Q' + row);
    worksheet.getCell('A' + row).value = `TOTAL ${termsOfDelivery} ${currency}:`;
    worksheet.getCell('A' + row).font = { bold: true };
    worksheet.getCell('A' + row).alignment = { horizontal: 'left' };
    setOuterBorder('A' + row + ':Q' + row, worksheet);

    if (type === "sanitary" && termsOfDelivery === "CIF") {
        setOuterBorder('R' + row + ':R' + row, worksheet);
        setOuterBorder('S' + row + ':Y' + row, worksheet);

        worksheet.mergeCells('Z' + row + ':Z' + row);
        worksheet.getCell('Z' + row).value = "INSURANCE";
        worksheet.getCell('Z' + row).font = { bold: true };
        worksheet.getCell('Z' + row).alignment = { horizontal: 'center' };
        setOuterBorder('Z' + row + ':Z' + row, worksheet);

        worksheet.mergeCells('AA' + row + ':AA' + row);
        worksheet.getCell('AA' + row).value = insurance;
        worksheet.getCell('AA' + row).font = { bold: true };
        worksheet.getCell('AA' + row).alignment = { horizontal: 'center' };
        setOuterBorder('AA' + row + ':AA' + row, worksheet);
    }
    else if (type === "tiles" && termsOfDelivery === "CIF") {
        worksheet.mergeCells('R' + row + ':X' + row);
        worksheet.getCell('R' + row).value = "INSURANCE";
        worksheet.getCell('R' + row).font = { bold: true };
        worksheet.getCell('R' + row).alignment = { horizontal: 'right' };
        setOuterBorder('R' + row + ':X' + row, worksheet);

        worksheet.mergeCells('Y' + row + ':AA' + row);
        worksheet.getCell('Y' + row).value = insurance;
        worksheet.getCell('Y' + row).font = { bold: true };
        worksheet.getCell('Y' + row).alignment = { horizontal: 'center' };
        setOuterBorder('Y' + row + ':AA' + row, worksheet);
    } else if (type === "sanitary") {
        setOuterBorder('R' + row + ':R' + row, worksheet);
        setOuterBorder('S' + row + ':Y' + row, worksheet);

        worksheet.mergeCells('Z' + row + ':Z' + row);
        setOuterBorder('Z' + row + ':Z' + row, worksheet);

        worksheet.mergeCells('AA' + row + ':AA' + row);
        setOuterBorder('AA' + row + ':AA' + row, worksheet);
    } else if (type === "tiles") {
        worksheet.mergeCells('R' + row + ':X' + row);
        setOuterBorder('R' + row + ':X' + row, worksheet);

        worksheet.mergeCells('Y' + row + ':AA' + row);
        setOuterBorder('Y' + row + ':AA' + row, worksheet);
    }
    row++;

    worksheet.mergeCells('A' + row + ':Q' + (row + 1));
    worksheet.getCell('A' + row).value = `${amountInWords}.`;
    // worksheet.getCell('A' + row).fill = {
    //     type: 'pattern',
    //     pattern: 'solid',
    //     fgColor: { argb: 'FFFFFF00' },
    // };

    worksheet.getCell('A' + row).font = { bold: true };
    worksheet.getCell('A' + row).alignment = { horizontal: 'left', vertical: 'top' };
    setOuterBorder('A' + row + ':Q' + (row + 1), worksheet);

    if (type === "sanitary") {
        worksheet.getCell('R' + row).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },     // black
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        worksheet.getCell('R' + (row + 1)).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },     // black
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
        };
    }

    setOuterBorder('S' + row + ':Y' + row, worksheet);

    if (type === "sanitary" && termsOfDelivery !== "FOB") {
        worksheet.mergeCells('Z' + row + ':Z' + row);
        worksheet.getCell('Z' + row).value = "FREIGHT";
        worksheet.getCell('Z' + row).font = { bold: true };
        worksheet.getCell('Z' + row).alignment = { horizontal: 'center' };
        setOuterBorder('Z' + row + ':Z' + row, worksheet);

        worksheet.mergeCells('AA' + row + ':AA' + row);
        worksheet.getCell('AA' + row).value = freight;
        worksheet.getCell('AA' + row).font = { bold: true };
        worksheet.getCell('AA' + row).alignment = { horizontal: 'center' };
        setOuterBorder('AA' + row + ':AA' + row, worksheet);
    }
    else if (type === "tiles" && termsOfDelivery !== "FOB") {
        worksheet.mergeCells('R' + row + ':X' + row);
        worksheet.getCell('R' + row).value = "FREIGHT";
        worksheet.getCell('R' + row).font = { bold: true };
        worksheet.getCell('R' + row).alignment = { horizontal: 'right' };
        setOuterBorder('R' + row + ':X' + row, worksheet);

        worksheet.mergeCells('Y' + row + ':AA' + row);
        worksheet.getCell('Y' + row).value = freight;
        worksheet.getCell('Y' + row).font = { bold: true };
        worksheet.getCell('Y' + row).alignment = { horizontal: 'center' };
        setOuterBorder('Y' + row + ':AA' + row, worksheet);
    } else if (type === "sanitary") {
        worksheet.mergeCells('Z' + row + ':Z' + row);
        setOuterBorder('Z' + row + ':Z' + row, worksheet);

        worksheet.mergeCells('AA' + row + ':AA' + row);
        setOuterBorder('AA' + row + ':AA' + row, worksheet);
    }
    else if (type === "tiles") {
        worksheet.mergeCells('R' + row + ':X' + row);
        setOuterBorder('R' + row + ':X' + row, worksheet);

        worksheet.mergeCells('Y' + row + ':AA' + row);
        setOuterBorder('Y' + row + ':AA' + row, worksheet);
    }
    row++;

    if (type === "sanitary") {
        worksheet.mergeCells('S' + row + ':Y' + row);
        if (termsOfDeliveryMain === "CIF -> FOB") {
            worksheet.getCell('S' + row).value = `TOTAL FOB ${currency}`;
        } else {
            worksheet.getCell('S' + row).value = `TOTAL ${termsOfDelivery} ${currency}`;
        }
        worksheet.getCell('S' + row).font = { bold: true };
        worksheet.getCell('S' + row).alignment = { horizontal: 'right' };
        setOuterBorder('S' + row + ':Y' + row, worksheet);

        if (termsOfDeliveryMain === "CIF -> FOB" || termsOfDeliveryMain === "FOB") {
            worksheet.getCell('AA' + row).value = { formula: `ROUND(SUM(AA28:AA${row - 5}), 4)`, result: 0 };
        } else {
            worksheet.getCell('AA' + row).value = { formula: `ROUND(SUM(AA${row - 5}:AA${row - 1}), 4)`, result: 0 };
        }
        worksheet.getCell('AA' + row).font = { bold: true };
        worksheet.getCell('AA' + row).alignment = { horizontal: 'center' };
        worksheet.getCell('AA' + row).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },     // black
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
        };

    }
    else if (type === "tiles") {
        worksheet.mergeCells('R' + row + ':X' + row);
        if (termsOfDeliveryMain === "CIF -> FOB") {
            worksheet.getCell('R' + row).value = `TOTAL FOB ${currency}`;
        } else {
            worksheet.getCell('R' + row).value = `TOTAL ${termsOfDelivery} ${currency}`;
        }
        worksheet.getCell('R' + row).font = { bold: true };
        worksheet.getCell('R' + row).alignment = { horizontal: 'right' };
        setOuterBorder('R' + row + ':X' + row, worksheet);

        worksheet.mergeCells('Y' + row + ':AA' + row);
        // worksheet.getCell('Y' + row).value = totalFOBEuro;
        if (termsOfDeliveryMain === "CIF -> FOB" || termsOfDeliveryMain === "FOB") {
            worksheet.getCell('Y' + row).value = { formula: `ROUND(SUM(Y28:Y${row - 5}), 4)`, result: 0 };
        } else {
            worksheet.getCell('Y' + row).value = { formula: `ROUND(SUM(Y${row - 5}:Y${row - 1}), 4)`, result: 0 };
        }

        worksheet.getCell('Y' + row).font = { bold: true };
        worksheet.getCell('Y' + row).alignment = { horizontal: 'center' };
        setOuterBorder('Y' + row + ':AA' + row, worksheet);

    }

    worksheet.getCell('R' + (row + 1)).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    row++;

    worksheet.mergeCells('A' + row + ':AA' + row);
    worksheet.getCell('A' + row).value = gstCirculerNumber;
    worksheet.getCell('A' + row).font = { italic: true };
    worksheet.getCell('A' + row).alignment = { horizontal: 'left' };
    setOuterBorder('A' + row + ':AA' + row, worksheet);
    row++;

    worksheet.mergeCells('A' + row + ':AA' + (row + 1));
    if (taxStatus === "without") {
        worksheet.getCell('A' + row).value = `LETTER OF UNDERTAKING NO.ACKNOWLEDGMENT FOR LUT  APPLICATION REFERENCE NUMBER (ARN) ${arn}\nDT:${lutDate}`;
    } else {
        worksheet.getCell('A' + row).value = `SUPPLY MEANT FOR EXPORT ON PAYMENT OF IGST UNDER CLAIM OF REFUND RS. TOTAL : ${gstValue}\n(TAXABLE ${termsOfDelivery} INR VALUE ${totalInINR}@ 18%)                                                                            ${gstValue}  `;
    }
    worksheet.getCell('A' + row).font = { name: 'Arial', italic: true, color: { argb: 'FFFF0000' } };
    worksheet.getCell('A' + row).alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };
    setOuterBorder('A' + row + ':AA' + (row + 1), worksheet);
    row += 2;

    if (taxStatus === "with") {
        for (let i = 0; i < 4; i++) {
            worksheet.getCell('A' + (row + i)).border = {
                left: { style: 'thin', color: { argb: 'FF000000' } },
            }
        }
    }

    if (taxStatus == "without") {


        for (let i = 0; i < supplierDetails.length; i++) {
            if (type === "sanitary") {
                if (i % 2 === 0) {
                    worksheet.mergeCells('A' + row + ':Q' + row);
                    worksheet.getCell('A' + row).value = `SUPPLIER DETAILS :- ${i + 1}`;
                    worksheet.getCell('A' + row).font = { bold: true };
                    worksheet.getCell('A' + row).alignment = { horizontal: 'center' };
                    setOuterBorder('A' + row + ':Q' + row, worksheet, 'medium'); // Removable

                    worksheet.mergeCells('A' + (row + 1) + ':F' + (row + 1));
                    worksheet.getCell('A' + (row + 1)).value = "NAME:";
                    worksheet.getCell('A' + (row + 1)).font = { bold: true };
                    worksheet.getCell('A' + (row + 1)).alignment = { horizontal: 'center' };
                    setOuterBorder('A' + (row + 1) + ':F' + (row + 1), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('G' + (row + 1) + ':Q' + (row + 1));
                    worksheet.getCell('G' + (row + 1)).value = supplierDetails[i][0];
                    worksheet.getCell('G' + (row + 1)).alignment = { horizontal: 'center' };
                    setOuterBorder('G' + (row + 1) + ':Q' + (row + 1), worksheet);

                    worksheet.mergeCells('A' + (row + 2) + ':F' + (row + 2));
                    worksheet.getCell('A' + (row + 2)).value = "GSTIN NO.";
                    worksheet.getCell('A' + (row + 2)).font = { bold: true };
                    worksheet.getCell('A' + (row + 2)).alignment = { horizontal: 'center' };
                    setOuterBorder('A' + (row + 2) + ':F' + (row + 2), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('G' + (row + 2) + ':Q' + (row + 2));
                    worksheet.getCell('G' + (row + 2)).value = supplierDetails[i][1];
                    worksheet.getCell('G' + (row + 2)).alignment = { horizontal: 'center' };
                    setOuterBorder('G' + (row + 2) + ':Q' + (row + 2), worksheet);

                    worksheet.mergeCells('A' + (row + 3) + ':F' + (row + 3));
                    worksheet.getCell('A' + (row + 3)).value = "TAX INVOICE NO & DATE:";
                    worksheet.getCell('A' + (row + 3)).font = { bold: true };
                    worksheet.getCell('A' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('A' + (row + 3) + ':F' + (row + 3), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('G' + (row + 3) + ':K' + (row + 3));
                    worksheet.getCell('G' + (row + 3)).value = supplierDetails[i][2];
                    // worksheet.getCell('G' + (row + 3)).fill = {
                    //     type: 'pattern',
                    //     pattern: 'solid',
                    //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                    // };
                    worksheet.getCell('G' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('G' + (row + 3) + ':K' + (row + 3), worksheet);

                    worksheet.mergeCells('L' + (row + 3) + ':Q' + (row + 3));
                    worksheet.getCell('L' + (row + 3)).value = supplierDetails[i][3];
                    // worksheet.getCell('L' + (row + 3)).fill = {
                    //     type: 'pattern',
                    //     pattern: 'solid',
                    //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                    // };
                    worksheet.getCell('L' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('L' + (row + 3) + ':Q' + (row + 3), worksheet);
                } else {
                    worksheet.mergeCells('R' + row + ':AA' + row);
                    worksheet.getCell('R' + row).value = `SUPPLIER DETAILS :- ${i + 1}`;
                    worksheet.getCell('R' + row).font = { bold: true };
                    worksheet.getCell('R' + row).alignment = { horizontal: 'center' };
                    setOuterBorder('R' + row + ':AA' + row, worksheet, 'medium'); // Removable

                    worksheet.mergeCells('R' + (row + 1) + ':U' + (row + 1));
                    worksheet.getCell('R' + (row + 1)).value = "NAME:";
                    worksheet.getCell('R' + (row + 1)).font = { bold: true };
                    worksheet.getCell('R' + (row + 1)).alignment = { horizontal: 'center' };
                    setOuterBorder('R' + (row + 1) + ':U' + (row + 1), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('V' + (row + 1) + ':AA' + (row + 1));
                    worksheet.getCell('V' + (row + 1)).value = supplierDetails[i][0];
                    worksheet.getCell('V' + (row + 1)).alignment = { horizontal: 'center' };
                    setOuterBorder('V' + (row + 1) + ':AA' + (row + 1), worksheet);

                    worksheet.mergeCells('R' + (row + 2) + ':U' + (row + 2));
                    worksheet.getCell('R' + (row + 2)).value = "GSTIN NO.";
                    worksheet.getCell('R' + (row + 2)).font = { bold: true };
                    worksheet.getCell('R' + (row + 2)).alignment = { horizontal: 'center' };
                    setOuterBorder('R' + (row + 2) + ':U' + (row + 2), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('V' + (row + 2) + ':AA' + (row + 2));
                    worksheet.getCell('V' + (row + 2)).value = supplierDetails[i][1];
                    worksheet.getCell('V' + (row + 2)).alignment = { horizontal: 'center' };
                    setOuterBorder('V' + (row + 2) + ':AA' + (row + 2), worksheet);

                    worksheet.mergeCells('R' + (row + 3) + ':U' + (row + 3));
                    worksheet.getCell('R' + (row + 3)).value = "TAX INVOICE NO & DATE:";
                    worksheet.getCell('R' + (row + 3)).font = { bold: true };
                    worksheet.getCell('R' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('R' + (row + 3) + ':U' + (row + 3), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('V' + (row + 3) + ':Y' + (row + 3));
                    worksheet.getCell('V' + (row + 3)).value = supplierDetails[i][2];
                    // worksheet.getCell('V' + (row + 3)).fill = {
                    //     type: 'pattern',
                    //     pattern: 'solid',
                    //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                    // };
                    worksheet.getCell('V' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('V' + (row + 3) + ':Y' + (row + 3), worksheet);

                    worksheet.mergeCells('Z' + (row + 3) + ':AA' + (row + 3));
                    worksheet.getCell('Z' + (row + 3)).value = supplierDetails[i][3];
                    // worksheet.getCell('Z' + (row + 3)).fill = {
                    //     type: 'pattern',
                    //     pattern: 'solid',
                    //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                    // };
                    worksheet.getCell('Z' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('Z' + (row + 3) + ':AA' + (row + 3), worksheet);
                    row += 4;
                }
            }
            else if (type === "tiles") {
                if (i % 2 === 0) {
                    worksheet.mergeCells('A' + row + ':M' + row);
                    worksheet.getCell('A' + row).value = `SUPPLIER DETAILS :- ${i + 1}`;
                    worksheet.getCell('A' + row).font = { bold: true };
                    worksheet.getCell('A' + row).alignment = { horizontal: 'center' };
                    setOuterBorder('A' + row + ':M' + row, worksheet, 'medium'); // Removable

                    worksheet.mergeCells('A' + (row + 1) + ':E' + (row + 1));
                    worksheet.getCell('A' + (row + 1)).value = "NAME:";
                    worksheet.getCell('A' + (row + 1)).font = { bold: true };
                    worksheet.getCell('A' + (row + 1)).alignment = { horizontal: 'center' };
                    setOuterBorder('A' + (row + 1) + ':E' + (row + 1), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('F' + (row + 1) + ':M' + (row + 1));
                    worksheet.getCell('F' + (row + 1)).value = supplierDetails[i][0];
                    worksheet.getCell('F' + (row + 1)).alignment = { horizontal: 'center' };
                    setOuterBorder('F' + (row + 1) + ':M' + (row + 1), worksheet);

                    worksheet.mergeCells('A' + (row + 2) + ':E' + (row + 2));
                    worksheet.getCell('A' + (row + 2)).value = "GSTIN NO.";
                    worksheet.getCell('A' + (row + 2)).font = { bold: true };
                    worksheet.getCell('A' + (row + 2)).alignment = { horizontal: 'center' };
                    setOuterBorder('A' + (row + 2) + ':E' + (row + 2), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('F' + (row + 2) + ':M' + (row + 2));
                    worksheet.getCell('F' + (row + 2)).value = supplierDetails[i][1];
                    worksheet.getCell('F' + (row + 2)).alignment = { horizontal: 'center' };
                    setOuterBorder('F' + (row + 2) + ':M' + (row + 2), worksheet);

                    worksheet.mergeCells('A' + (row + 3) + ':E' + (row + 3));
                    worksheet.getCell('A' + (row + 3)).value = "TAX INVOICE NO & DATE:";
                    worksheet.getCell('A' + (row + 3)).font = { bold: true };
                    worksheet.getCell('A' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('A' + (row + 3) + ':E' + (row + 3), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('F' + (row + 3) + ':I' + (row + 3));
                    worksheet.getCell('F' + (row + 3)).value = supplierDetails[i][2];
                    // worksheet.getCell('F' + (row + 3)).fill = {
                    //     type: 'pattern',
                    //     pattern: 'solid',
                    //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                    // };
                    worksheet.getCell('F' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('F' + (row + 3) + ':I' + (row + 3), worksheet);

                    worksheet.mergeCells('J' + (row + 3) + ':M' + (row + 3));
                    worksheet.getCell('J' + (row + 3)).value = supplierDetails[i][3];
                    // worksheet.getCell('J' + (row + 3)).fill = {
                    //     type: 'pattern',
                    //     pattern: 'solid',
                    //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                    // };
                    worksheet.getCell('J' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('J' + (row + 3) + ':M' + (row + 3), worksheet);
                } else {
                    worksheet.mergeCells('N' + row + ':AA' + row);
                    worksheet.getCell('N' + row).value = `SUPPLIER DETAILS :- ${i + 1}`;
                    worksheet.getCell('N' + row).font = { bold: true };
                    worksheet.getCell('N' + row).alignment = { horizontal: 'center' };
                    setOuterBorder('N' + row + ':AA' + row, worksheet, 'medium'); // Removable

                    worksheet.mergeCells('N' + (row + 1) + ':S' + (row + 1));
                    worksheet.getCell('N' + (row + 1)).value = "NAME:";
                    worksheet.getCell('N' + (row + 1)).font = { bold: true };
                    worksheet.getCell('N' + (row + 1)).alignment = { horizontal: 'center' };
                    setOuterBorder('N' + (row + 1) + ':S' + (row + 1), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('T' + (row + 1) + ':AA' + (row + 1));
                    worksheet.getCell('T' + (row + 1)).value = supplierDetails[i][0];
                    worksheet.getCell('T' + (row + 1)).alignment = { horizontal: 'center' };
                    setOuterBorder('T' + (row + 1) + ':AA' + (row + 1), worksheet);

                    worksheet.mergeCells('N' + (row + 2) + ':S' + (row + 2));
                    worksheet.getCell('N' + (row + 2)).value = "GSTIN NO.";
                    worksheet.getCell('N' + (row + 2)).font = { bold: true };
                    worksheet.getCell('N' + (row + 2)).alignment = { horizontal: 'center' };
                    setOuterBorder('N' + (row + 2) + ':S' + (row + 2), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('T' + (row + 2) + ':AA' + (row + 2));
                    worksheet.getCell('T' + (row + 2)).value = supplierDetails[i][1];
                    worksheet.getCell('T' + (row + 2)).alignment = { horizontal: 'center' };
                    setOuterBorder('T' + (row + 2) + ':AA' + (row + 2), worksheet);

                    worksheet.mergeCells('N' + (row + 3) + ':S' + (row + 3));
                    worksheet.getCell('N' + (row + 3)).value = "TAX INVOICE NO & DATE:";
                    worksheet.getCell('N' + (row + 3)).font = { bold: true };
                    worksheet.getCell('N' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('N' + (row + 3) + ':S' + (row + 3), worksheet, 'medium'); // Removable

                    worksheet.mergeCells('T' + (row + 3) + ':W' + (row + 3));
                    worksheet.getCell('T' + (row + 3)).value = supplierDetails[i][2];
                    // worksheet.getCell('T' + (row + 3)).fill = {
                    //     type: 'pattern',
                    //     pattern: 'solid',
                    //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                    // };
                    worksheet.getCell('T' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('T' + (row + 3) + ':W' + (row + 3), worksheet);

                    worksheet.mergeCells('X' + (row + 3) + ':AA' + (row + 3));
                    worksheet.getCell('X' + (row + 3)).value = supplierDetails[i][3];
                    // worksheet.getCell('X' + (row + 3)).fill = {
                    //     type: 'pattern',
                    //     pattern: 'solid',
                    //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                    // };
                    worksheet.getCell('X' + (row + 3)).alignment = { horizontal: 'center' };
                    setOuterBorder('X' + (row + 3) + ':AA' + (row + 3), worksheet);
                    row += 4;
                }
            }
        }

    }

    if (supplierDetails.length % 2 === 0 || supplierDetails.length == 0) {
        if (type == "tiles") {
            worksheet.mergeCells('A' + row + ':M' + row);
            setOuterBorder('A' + row + ':M' + row, worksheet);

            worksheet.mergeCells('A' + (row + 1) + ':E' + (row + 1));
            setOuterBorder('A' + (row + 1) + ':E' + (row + 1), worksheet);

            worksheet.mergeCells('F' + (row + 1) + ':M' + (row + 1));
            setOuterBorder('F' + (row + 1) + ':M' + (row + 1), worksheet);

            worksheet.mergeCells('A' + (row + 2) + ':E' + (row + 2));
            setOuterBorder('A' + (row + 2) + ':E' + (row + 2), worksheet);

            worksheet.mergeCells('F' + (row + 2) + ':M' + (row + 2));
            setOuterBorder('F' + (row + 2) + ':M' + (row + 2), worksheet);

            worksheet.mergeCells('A' + (row + 3) + ':E' + (row + 3));
            setOuterBorder('A' + (row + 3) + ':E' + (row + 3), worksheet);

            worksheet.mergeCells('F' + (row + 3) + ':I' + (row + 3));
            // worksheet.getCell('F' + (row + 3)).fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
            // };
            setOuterBorder('F' + (row + 3) + ':I' + (row + 3), worksheet);

            worksheet.mergeCells('J' + (row + 3) + ':M' + (row + 3));
            // worksheet.getCell('J' + (row + 3)).fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
            // };
            setOuterBorder('J' + (row + 3) + ':M' + (row + 3), worksheet);
        } else {
            worksheet.mergeCells('A' + row + ':Q' + row);
            setOuterBorder('A' + row + ':Q' + row, worksheet);

            worksheet.mergeCells('A' + (row + 1) + ':F' + (row + 1));
            setOuterBorder('A' + (row + 1) + ':F' + (row + 1), worksheet);

            worksheet.mergeCells('G' + (row + 1) + ':Q' + (row + 1));
            setOuterBorder('G' + (row + 1) + ':Q' + (row + 1), worksheet);

            worksheet.mergeCells('A' + (row + 2) + ':F' + (row + 2));
            setOuterBorder('A' + (row + 2) + ':F' + (row + 2), worksheet);

            worksheet.mergeCells('G' + (row + 2) + ':Q' + (row + 2));
            setOuterBorder('G' + (row + 2) + ':Q' + (row + 2), worksheet);

            worksheet.mergeCells('A' + (row + 3) + ':F' + (row + 3));
            setOuterBorder('A' + (row + 3) + ':F' + (row + 3), worksheet);

            worksheet.mergeCells('G' + (row + 3) + ':K' + (row + 3));
            // worksheet.getCell('G' + (row + 3)).fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
            // };
            setOuterBorder('G' + (row + 3) + ':K' + (row + 3), worksheet);

            worksheet.mergeCells('L' + (row + 3) + ':Q' + (row + 3));
            // worksheet.getCell('L' + (row + 3)).fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
            // };
            setOuterBorder('L' + (row + 3) + ':Q' + (row + 3), worksheet);
        }
    }
    if (type === "sanitary") {
        worksheet.mergeCells('R' + row + ':AA' + row);
        worksheet.getCell('R' + row).value = "Signature & Date";
        worksheet.getCell('R' + row).font = { bold: true };
        worksheet.getCell('R' + row).alignment = { horizontal: 'right' };
        row++;

        worksheet.mergeCells('R' + row + ':AA' + row);
        worksheet.getCell('R' + row).value = "For, ZERIC CERAMICA";
        worksheet.getCell('R' + row).font = { bold: true };
        worksheet.getCell('R' + row).alignment = { horizontal: 'right' };

        worksheet.addImage(signature, {
            tl: { col: 24, row: (row - 1) }, // X66 (X = col 24 → 24 - 1 = 23 → 22 for 0-based)
            ext: { width: 100, height: 100 }, // adjust size as needed
        });
        row += 5;

        worksheet.mergeCells('R' + row + ':AA' + row);
        worksheet.getCell('R' + row).value = "AUTHORISED SIGN.";
        worksheet.getCell('R' + row).font = { bold: true };
        worksheet.getCell('R' + row).alignment = { horizontal: 'right' };
        setOuterBorder('R' + (row - 6) + ':AA' + row, worksheet);


        worksheet.mergeCells('A' + (row - 1) + ':Q' + row);
        worksheet.getCell('A' + (row - 1)).value = "Declaration:We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
        worksheet.getCell('A' + (row - 1)).font = { bold: true };
        worksheet.getCell('A' + (row - 1)).alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };
        setOuterBorder('A' + (row - 1) + ':Q' + row, worksheet);
        setOuterBorder('A' + (row - 2) + ':Q' + (row - 2), worksheet);
    }
    else if (type === "tiles") {
        worksheet.mergeCells('N' + row + ':AA' + row);
        worksheet.getCell('N' + row).value = "Signature & Date";
        worksheet.getCell('N' + row).font = { bold: true };
        worksheet.getCell('N' + row).alignment = { horizontal: 'right' };
        row++;

        worksheet.mergeCells('N' + row + ':AA' + row);
        worksheet.getCell('N' + row).value = "For, ZERIC CERAMICA";
        worksheet.getCell('N' + row).font = { bold: true };
        worksheet.getCell('N' + row).alignment = { horizontal: 'right' };

        worksheet.addImage(signature, {
            tl: { col: 20, row: (row - 1) }, // X66 (X = col 24 → 24 - 1 = 23 → 22 for 0-based)
            ext: { width: 100, height: 100 }, // adjust size as needed
        });
        row += 5;

        worksheet.mergeCells('N' + row + ':AA' + row);
        worksheet.getCell('N' + row).value = "AUTHORISED SIGN.";
        worksheet.getCell('N' + row).font = { bold: true };
        worksheet.getCell('N' + row).alignment = { horizontal: 'right' };
        setOuterBorder('N' + (row - 6) + ':AA' + row, worksheet);


        worksheet.mergeCells('A' + (row - 1) + ':M' + row);
        worksheet.getCell('A' + (row - 1)).value = "Declaration:We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
        worksheet.getCell('A' + (row - 1)).font = { bold: true };
        worksheet.getCell('A' + (row - 1)).alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };
        setOuterBorder('A' + (row - 1) + ':M' + row, worksheet);
        setOuterBorder('A' + (row - 2) + ':M' + (row - 2), worksheet);
    }

    setOuterBorder('A1:AA' + row, worksheet, 'medium');

    worksheet.pageSetup.fitToPage = true;

    let MAX_WIDTH = 5;
    if (type === "tiles") {

        worksheet.columns.forEach((column) => {
            let maxLength = 10;

            column.eachCell({ includeEmpty: true }, (cell) => {
                const cellValue = cell.value ? cell.value.toString() : '';
                const lines = cellValue.split('\n');
                const longestLine = Math.max(...lines.map(line => line.length));
                if (longestLine > maxLength) {
                    maxLength = longestLine;
                }
            });

            column.width = Math.min(maxLength + 2, MAX_WIDTH); // 👈 LIMIT IT
        });
        worksheet.getColumn(1).width = pixelToExcelWidth(50);
    }
    else if (type === "sanitary") {
        columnWidths.forEach((px, index) => {
            worksheet.getColumn(index + 1).width = pixelToExcelWidth(px);
        });
    }

    setGlobalFontSize(worksheet);










































































    // Create a new workbook
    const customInvoiceCopyWorkbook = new ExcelJS.Workbook();
    if (termsOfDeliveryMain !== "FOB") {
        // New tab
        const worksheetCopy = customInvoiceCopyWorkbook.addWorksheet('COPY OF CUSTOM INVOICE');
        if (signatureUrl) {

            const { buffer, extension, width, height } = await loadImageBuffer(signatureUrl);
            signature = customInvoiceCopyWorkbook.addImage({
                buffer: buffer,
                extension: extension,
            });
            vgnSignatureW = width;
            vgnSignatureH = height;
        }

        worksheetCopy.getColumn(1).width = 5;
        worksheetCopy.getCell('A1').value = worksheet.getCell('A1').value || ' ';
        configurePrintSheet(worksheetCopy);
        worksheetCopy.getColumn(17).hidden = true;



        worksheetCopy.mergeCells('A1:AA1');
        worksheetCopy.getCell('A1').value = 'CUSTOMS INVOICE';
        worksheetCopy.getCell('A1').font = { bold: true };
        worksheetCopy.getCell('A1').alignment = { horizontal: 'center' };
        setOuterBorder('A1:AA1', worksheetCopy);

        // ✅ Red note below title
        worksheetCopy.mergeCells('A2:AA2');
        if (taxStatus === "without") {
            worksheetCopy.getCell('A2').value = '“SUPPLY MEANT FOR EXPORT UNDER BOND & LUT- LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX”';
        } else if (taxStatus === "with") {
            worksheetCopy.getCell('A2').value = '“SUPPLY MEANT FOR EXPORT WITH PAYMENT OF INTEGRATED TAX (IGST)”';
        }
        // worksheetCopy.getCell('A2').font = { bold: true, color: { argb: 'FFFF0000' } };
        worksheetCopy.getCell('A2').font = { bold: true, italic: true };
        worksheetCopy.getCell('A2').alignment = { horizontal: 'center' };
        setOuterBorder('A2:AA2', worksheetCopy);

        // ✅ Exporter Info
        worksheetCopy.mergeCells('A3:N3');
        worksheetCopy.getCell('A3').value = `EXPORTER:`;
        worksheetCopy.getCell('A3').alignment = { wrapText: true, vertical: 'top' };
        worksheetCopy.getCell('A3').font = { bold: true, underline: true };

        worksheetCopy.mergeCells('A4:N10');
        worksheetCopy.getCell('A4').value = `${companyName}\n${companyAddress}`;
        worksheetCopy.getCell('A4').alignment = { wrapText: true, vertical: 'top' };
        worksheetCopy.getCell('A4').font = { bold: true };
        setOuterBorder('A4:N10', worksheetCopy);

        // ✅ Email & Tax No

        worksheetCopy.mergeCells('A11:B11');
        worksheetCopy.getCell('A11').value = `EMAIL:`;
        worksheetCopy.getCell('A11').font = { bold: true };
        worksheetCopy.getCell('A11').alignment = { wrapText: true };

        worksheetCopy.mergeCells('A12:B12');
        worksheetCopy.getCell('A12').value = `TAX ID:`;
        worksheetCopy.getCell('A12').font = { bold: true };
        worksheetCopy.getCell('A12').alignment = { wrapText: true };

        worksheetCopy.mergeCells('C11:N11');
        worksheetCopy.getCell('C11').value = email;
        worksheetCopy.getCell('C11').alignment = { wrapText: true };

        worksheetCopy.mergeCells('C12:N12');
        worksheetCopy.getCell('C12').value = taxid;
        worksheetCopy.getCell('C12').alignment = { wrapText: true };
        setOuterBorder('A11:N12', worksheetCopy);

        // ✅ Invoice No. & Date
        worksheetCopy.mergeCells('O3:T3');
        worksheetCopy.getCell('O3').value = "Invoice No. & Date:";
        worksheetCopy.getCell('O3').font = { bold: true };
        worksheetCopy.getCell('O3').alignment = { horizontal: 'center' };

        worksheetCopy.mergeCells('O4:T4');
        worksheetCopy.getCell('O4').value = `${invoiceNo}`;

        worksheetCopy.mergeCells('O5:T5');
        worksheetCopy.getCell('O5').value = `Dt. ${invoiceDate}`;

        setOuterBorder('O3:T5', worksheetCopy);

        // ✅ Exporter's Ref
        worksheetCopy.mergeCells('U3:AA3');
        worksheetCopy.getCell('U3').value = "Exporter’s Ref.:";
        worksheetCopy.getCell('U3').font = { bold: true };

        worksheetCopy.mergeCells('U4:AA12');
        worksheetCopy.getCell('U4').value = `I. E. Code #: ${ieCode}\nPAN No #: ${panNo}\nGSTIN No #: ${gstinNo}\nSTATE CODE : ${stateCode}`;
        worksheetCopy.getCell('U4').alignment = { wrapText: true, vertical: 'top' };
        setOuterBorder('U3:AA12', worksheetCopy);

        // ✅ Buyer's Order No
        worksheetCopy.mergeCells('O6:T6');
        worksheetCopy.getCell('O6').value = "Buyer's Order no. & Date";
        worksheetCopy.getCell('O6').font = { bold: true };

        worksheetCopy.mergeCells('O7:T8');
        worksheetCopy.getCell('O7').value = `${buyersOrderNo}    ${buyersOrderDate}`;
        worksheetCopy.getCell('O7').alignment = { wrapText: true, vertical: 'top' };

        worksheetCopy.mergeCells('O12:T12');
        worksheetCopy.getCell('O12').value = `PO No: ${poNo}`;
        setOuterBorder('O6:T12', worksheetCopy);

        // ✅ Consignee
        worksheetCopy.mergeCells('A13:N13');
        worksheetCopy.getCell('A13').value = "Consignee:";
        worksheetCopy.getCell('A13').font = { bold: true, underline: true };

        worksheetCopy.mergeCells('A14:N19');
        worksheetCopy.getCell('A14').value = `${consignee}`;
        worksheetCopy.getCell('A14').alignment = { wrapText: true, vertical: 'top' };
        setOuterBorder('A13:N19', worksheetCopy);

        // ✅ Notify Party
        worksheetCopy.mergeCells('O13:AA13');
        worksheetCopy.getCell('O13').value = "Notify Party # :";
        worksheetCopy.getCell('O13').font = { bold: true };

        worksheetCopy.mergeCells('O14:AA19');
        worksheetCopy.getCell('O14').value = `${notifyParty}`;
        worksheetCopy.getCell('O14').font = { bold: true };
        worksheetCopy.getCell('O14').alignment = { wrapText: true, vertical: 'top' };
        setOuterBorder('O13:AA19', worksheetCopy, 'medium'); // Removalble

        worksheetCopy.mergeCells('A20:G20');
        worksheetCopy.getCell('A20').value = 'Pre-Carriage By';
        // worksheetCopy.getCell('A20').font = { bold: true };
        worksheetCopy.getCell('A20').alignment = { horizontal: 'center' };

        worksheetCopy.mergeCells('A21:G21');
        worksheetCopy.getCell('A21').value = `${preCarriage}`;
        worksheetCopy.getCell('A21').font = { color: { argb: 'FFFF0000' }, bold: true };
        worksheetCopy.getCell('A21').alignment = { horizontal: 'center' };
        setOuterBorder('A20:G21', worksheetCopy);

        worksheetCopy.mergeCells('H20:N20');
        worksheetCopy.getCell('H20').value = "Place of Receipt by Pre-Carrier";
        // worksheetCopy.getCell('H20').font = { bold: true };
        worksheetCopy.getCell('H20').alignment = { horizontal: 'center' };

        worksheetCopy.mergeCells('H21:N21');
        worksheetCopy.getCell('H21').value = `${placeOfReceipt}`;
        worksheetCopy.getCell('H21').font = { color: { argb: 'FFFF0000' }, bold: true };
        worksheetCopy.getCell('H21').alignment = { horizontal: 'center' };
        setOuterBorder('H20:N21', worksheetCopy);

        worksheetCopy.mergeCells('O20:V20');
        // worksheetCopy.getCell('O20').value = `Country of Origin of Goods : ${countryOfOrigin}`;
        worksheetCopy.getCell('O20').value = {
            richText: [
                { text: 'Country of Origin of Goods : ', font: { bold: false } },
                { text: countryOfOrigin, font: { bold: true } }
            ]
        };
        worksheetCopy.getCell('O20').alignment = { horizontal: 'center' };

        worksheetCopy.mergeCells('O21:V21');
        worksheetCopy.getCell('O21').value = `ORIGIN : ${origin}`;
        worksheetCopy.getCell('O21').font = { bold: true };
        worksheetCopy.getCell('O21').alignment = { horizontal: 'center' };
        setOuterBorder('O20:V21', worksheetCopy);

        worksheetCopy.mergeCells('W20:AA20');
        worksheetCopy.getCell('W20').value = "Country of Final Destination";
        worksheetCopy.getCell('W20').alignment = { horizontal: 'center' };

        worksheetCopy.mergeCells('W21:AA21');
        worksheetCopy.getCell('W21').value = `${finalDestination}`;
        worksheetCopy.getCell('W21').font = { bold: true };
        worksheetCopy.getCell('W21').alignment = { horizontal: 'center' };
        setOuterBorder('W20:AA21', worksheetCopy);

        worksheetCopy.mergeCells('A22:G22');
        worksheetCopy.getCell('A22').value = 'Vessel Flight No.';
        // worksheetCopy.getCell('A22').font = { bold: true };
        worksheetCopy.getCell('A22').alignment = { horizontal: 'center' };

        worksheetCopy.mergeCells('A23:G23');
        worksheetCopy.getCell('A23').value = `${vassalFlightNo}`;
        worksheetCopy.getCell('A23').font = { color: { argb: 'FFFF0000' }, bold: true };
        worksheetCopy.getCell('A23').alignment = { horizontal: 'center' };
        setOuterBorder('A22:G23', worksheetCopy);

        worksheetCopy.mergeCells('H22:N22');
        worksheetCopy.getCell('H22').value = "Port of Loading";
        // worksheetCopy.getCell('H22').font = { bold: true };
        worksheetCopy.getCell('H22').alignment = { horizontal: 'center' };

        worksheetCopy.mergeCells('H23:N23');
        worksheetCopy.getCell('H23').value = `${portOfLoading}`;
        worksheetCopy.getCell('H23').font = { color: { argb: 'FFFF0000' }, bold: true };
        worksheetCopy.getCell('H23').alignment = { horizontal: 'center' };
        setOuterBorder('H22:N23', worksheetCopy);

        worksheetCopy.mergeCells('A24:G24');
        worksheetCopy.getCell('A24').value = 'Port of Discharge';
        // worksheetCopy.getCell('A24').font = { bold: true };
        worksheetCopy.getCell('A24').alignment = { horizontal: 'center' };

        worksheetCopy.mergeCells('A25:G26');
        worksheetCopy.getCell('A25').value = `${portOfDischarge}`;
        worksheetCopy.getCell('A25').font = { color: { argb: 'FFFF0000' }, bold: true };
        worksheetCopy.getCell('A25').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('A24:G26', worksheetCopy);

        worksheetCopy.mergeCells('H24:N24');
        worksheetCopy.getCell('H24').value = "Final Destination";
        // worksheetCopy.getCell('H24').font = { bold: true };
        worksheetCopy.getCell('H24').alignment = { horizontal: 'center' };

        worksheetCopy.mergeCells('H25:N26');
        worksheetCopy.getCell('H25').value = `${finalDestination}`;
        worksheetCopy.getCell('H25').font = { color: { argb: 'FFFF0000' }, bold: true };
        worksheetCopy.getCell('H25').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('H24:N26', worksheetCopy);

        worksheetCopy.mergeCells('O22:AA22');
        worksheetCopy.getCell('O22').value = "Terms of Delivery & Payment :-";
        worksheetCopy.getCell('O22').font = { bold: true };

        worksheetCopy.mergeCells('O23:AA23');
        if (termsOfDelivery === "FOB") {
            worksheetCopy.getCell('O23').value = `${termsOfDelivery} AT ${portOfLoading} PORT`;
        } else {
            worksheetCopy.getCell('O23').value = `${termsOfDelivery} AT ${portOfDischarge} PORT`;
        }
        worksheetCopy.getCell('O23').font = { color: { argb: 'FFFF0000' } };

        worksheetCopy.mergeCells('O24:AA25');
        worksheetCopy.getCell('O24').value = `PAYMENT : ${paymentTerms}`;
        worksheetCopy.getCell('O24').font = { name: 'Arial', color: { argb: 'FFFF0000' } };
        worksheetCopy.getCell('O24').alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };

        worksheetCopy.mergeCells('O26:U26');
        worksheetCopy.getCell('O26').value = shippingMethod;
        setOuterBorder('O22:AA26', worksheetCopy);

        if (type !== "tiles") {
            worksheetCopy.mergeCells('W26:Y26');
            worksheetCopy.getCell('W26').value = `${currency} RATE:`;
            worksheetCopy.getCell('W26').alignment = { horizontal: 'center' };
            worksheetCopy.getCell('W26').font = { bold: true };

            worksheetCopy.mergeCells('Z26:AA26');
            worksheetCopy.getCell('Z26').value = currencyRate;
            // worksheetCopy.getCell('Z26').fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
            // };

            worksheetCopy.getCell('Z26').alignment = { horizontal: 'center' };
            worksheetCopy.getCell('Z26').font = { bold: true };
            setOuterBorder('W26:AA26', worksheetCopy, 'medium');
        } else {
            worksheetCopy.mergeCells('V26:X26');
            worksheetCopy.getCell('V26').value = `${currency} RATE:`;
            worksheetCopy.getCell('V26').alignment = { horizontal: 'center' };
            worksheetCopy.getCell('V26').font = { bold: true };

            worksheetCopy.mergeCells('Y26:AA26');
            worksheetCopy.getCell('Y26').value = currencyRate;
            worksheetCopy.getCell('Y26').alignment = { horizontal: 'center' };
            // worksheetCopy.getCell('Y26').fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
            // };

            worksheetCopy.getCell('Y26').font = { bold: true };
            setOuterBorder('V26:AA26', worksheetCopy, 'medium');
        }

        worksheetCopy.mergeCells('A27:D27');
        worksheetCopy.getCell('A27').value = "Marks & Nos.";
        worksheetCopy.getCell('A27').font = { bold: true };
        worksheetCopy.getCell('A27').alignment = { horizontal: 'center' };

        if (containerType === 'FCL') {
            worksheetCopy.mergeCells('A28:D28');
            worksheetCopy.getCell('A28').value = `${marksAndNos} ${containerType}`;
            worksheetCopy.getCell('A28').font = { bold: true };
            worksheetCopy.getCell('A28').alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('A27:D28', worksheetCopy, 'medium');
        } else {
            worksheetCopy.mergeCells('A28:D28');
            worksheetCopy.getCell('A28').value = `${containerType}`;
            worksheetCopy.getCell('A28').font = { bold: true };
            worksheetCopy.getCell('A28').alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('A27:D28', worksheetCopy, 'medium');
        }
        worksheetCopy.getRow(28).height = 24;

        worksheetCopy.mergeCells('E27:Q28');
        worksheetCopy.getCell('E27').value = "Description of Goods";
        worksheetCopy.getCell('E27').font = { bold: true };
        worksheetCopy.getCell('E27').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('E27:Q28', worksheetCopy, 'medium');

        if (type !== "tiles") {
            worksheetCopy.getCell('R27').value = "SIZE";
            worksheetCopy.getCell('R27').font = { bold: true };
            worksheetCopy.getCell('R27').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheetCopy.getCell('R28').value = "MM";
            worksheetCopy.getCell('R28').font = { bold: true };
            worksheetCopy.getCell('R28').alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('R27:R28', worksheetCopy, 'medium');

            worksheetCopy.mergeCells('S27:T27')
            worksheetCopy.getCell('S27').value = "QUANTITY";
            worksheetCopy.getCell('S27').font = { bold: true };
            worksheetCopy.getCell('S27').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheetCopy.mergeCells('S28:T28')
            worksheetCopy.getCell('S28').value = packegingType;
            worksheetCopy.getCell('S28').font = { bold: true };
            worksheetCopy.getCell('S28').alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            setOuterBorder('S27:T28', worksheetCopy, 'medium');
            if (packegingType.length > 8) {
                worksheetCopy.getCell('S28').font = { size: 8, bold: true };
            }

            worksheetCopy.mergeCells('U27:V27')
            worksheetCopy.getCell('U27').value = "UNIT TYPE";
            worksheetCopy.getCell('U27').font = { bold: true };
            worksheetCopy.getCell('U27').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheetCopy.mergeCells('U28:V28')
            worksheetCopy.getCell('U28').value = packegingType;
            worksheetCopy.getCell('U28').font = { bold: true };
            worksheetCopy.getCell('U28').alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            setOuterBorder('U27:V28', worksheetCopy, 'medium');

            worksheetCopy.mergeCells('W27:X27')
            worksheetCopy.getCell('W27').value = "SQM/";
            worksheetCopy.getCell('W27').font = { bold: true };
            worksheetCopy.getCell('W27').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheetCopy.mergeCells('W28:X28')
            worksheetCopy.getCell('W28').value = unitOfIt;
            worksheetCopy.getCell('W28').font = { bold: true };
            worksheetCopy.getCell('W28').alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('W27:X28', worksheetCopy, 'medium');

            worksheetCopy.getCell('Y27').value = "TOTAL";
            worksheetCopy.getCell('Y27').font = { bold: true };
            worksheetCopy.getCell('Y27').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheetCopy.getCell('Y28').value = "SQM";
            worksheetCopy.getCell('Y28').font = { bold: true };
            worksheetCopy.getCell('Y28').alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('Y27:Y28', worksheetCopy, 'medium');

            worksheetCopy.getCell('Z27').value = "PRICE/";
            worksheetCopy.getCell('Z27').font = { bold: true };
            worksheetCopy.getCell('Z27').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheetCopy.getCell('Z28').value = "SQM";
            worksheetCopy.getCell('Z28').font = { bold: true };
            worksheetCopy.getCell('Z28').alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('Z27:Z28', worksheetCopy, 'medium');

            worksheetCopy.getCell('AA27').value = "AMOUNT";
            worksheetCopy.getCell('AA27').font = { bold: true };
            worksheetCopy.getCell('AA27').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheetCopy.getCell('AA28').value = `IN (${currency})`;
            worksheetCopy.getCell('AA28').font = { bold: true };
            worksheetCopy.getCell('AA28').alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('AA27:AA28', worksheetCopy, 'medium');
        }
        else {
            worksheetCopy.mergeCells('R27:S27')
            worksheetCopy.getCell('R27').value = "QUANTITY";
            worksheetCopy.getCell('R27').font = { bold: true };
            worksheetCopy.getCell('R27').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheetCopy.mergeCells('R28:S28')
            worksheetCopy.getCell('R28').value = "PKGS";
            worksheetCopy.getCell('R28').font = { bold: true };
            worksheetCopy.getCell('R28').alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('R27:S28', worksheetCopy);

            worksheetCopy.mergeCells('T27:U27')
            worksheetCopy.getCell('T27').value = "UNIT TYPE";
            worksheetCopy.getCell('T27').font = { bold: true };
            worksheetCopy.getCell('T27').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheetCopy.mergeCells('T28:U28')
            worksheetCopy.getCell('T28').value = packegingType;
            worksheetCopy.getCell('T28').font = { bold: true };
            worksheetCopy.getCell('T28').alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            setOuterBorder('T27:U28', worksheetCopy);
            if (packegingType.length > 8) {
                worksheetCopy.getCell('S28').font = { size: 8, bold: true };
            }

            worksheetCopy.mergeCells('V27:X27')
            worksheetCopy.getCell('V27').value = "RATE PER";
            worksheetCopy.getCell('V27').font = { bold: true };
            worksheetCopy.getCell('V27').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheetCopy.mergeCells('V28:X28')
            worksheetCopy.getCell('V28').value = `UNIT (${currency})`;
            worksheetCopy.getCell('V28').font = { bold: true };
            worksheetCopy.getCell('V28').alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('V27:X28', worksheetCopy);

            worksheetCopy.mergeCells('Y27:AA27')
            worksheetCopy.getCell('Y27').value = "AMOUNT/";
            worksheetCopy.getCell('Y27').font = { bold: true };
            worksheetCopy.getCell('Y27').alignment = { horizontal: 'center', vertical: 'middle' };

            worksheetCopy.mergeCells('Y28:AA28')
            worksheetCopy.getCell('Y28').value = `IN (${currency})`;
            worksheetCopy.getCell('Y28').font = { bold: true };
            worksheetCopy.getCell('Y28').alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('Y27:AA28', worksheetCopy);
        }
        if (packegingType.length > 6) {
            worksheetCopy.getRow(28).width = 36;
        }

        worksheetCopy.getCell('A29').value = "SR NO.";
        worksheetCopy.getCell('A29').font = { bold: true };
        worksheetCopy.getCell('A29').alignment = { horizontal: 'center', vertical: 'middle' };
        worksheetCopy.getCell('A29').border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },     // black
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        worksheetCopy.mergeCells('B29:D29');
        worksheetCopy.getCell('B29').value = "HSN CODE";
        worksheetCopy.getCell('B29').font = { bold: true };
        worksheetCopy.getCell('B29').alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('B29:D29', worksheetCopy);

        let x = (insurance + freight) / (srNo - 1);
        x = Math.floor(x);
        // console.log("x:" + x);
        // const adjustments = getBestPrecisionAdjustments(products, insurance, freight).adjustments;

        let price = 0;
        let tPrice = 0;
        let ttPrice = 0;
        let srNoCopy = srNo - 1;

        // Table saction

        srNo = 1;
        row = 28;
        for (let i = 0; i < products.length; i++) {
            if (type !== "tiles") {
                row++;
                if (products[i].length === 2) {
                    worksheetCopy.mergeCells('E' + row + ':Q' + row);
                    worksheetCopy.getCell('E' + row).value = products[i][0];
                    // worksheetCopy.getCell('E' + row).fill = {
                    //     type: 'pattern',
                    //     pattern: 'solid',
                    //     fgColor: { argb: 'FFFFCC99' }, // Light orange / peach
                    // };
                    worksheetCopy.getCell('E' + row).font = { bold: true, size: 12 };
                    worksheetCopy.getCell('E' + row).alignment = { horizontal: 'center', vertical: 'middle' };
                    worksheetCopy.getRow(row).height = 46;
                    setOuterBorder('E' + row + ':Q' + row, worksheetCopy);
                    hsnCode = Number(products[i][1]);
                    if (i == 0) {
                        allProductsType = String(products[i][0]);
                    }
                    else {
                        allProductsType += '/' + String(products[i][0]);
                    }

                    if (i !== 0) {
                        worksheetCopy.getCell('A' + row).border = {
                            top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                            left: { style: 'thin', color: { argb: 'FF000000' } },
                            bottom: { style: 'thin', color: { argb: 'FF000000' } },
                            right: { style: 'thin', color: { argb: 'FF000000' } },
                        };

                        setOuterBorder('B' + row + ':D' + row, worksheetCopy);
                    }
                    setOuterBorder('E' + row + ':Q' + row, worksheetCopy);

                    worksheetCopy.getCell('R' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };

                    setOuterBorder('S' + row + ':T' + row, worksheetCopy);
                    setOuterBorder('U' + row + ':V' + row, worksheetCopy);
                    setOuterBorder('W' + row + ':X' + row, worksheetCopy);

                    worksheetCopy.getCell('Y' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };

                    worksheetCopy.getCell('Z' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };

                    worksheetCopy.getCell('AA' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };

                } else {

                    // console.log("srNO:"+srNo+" srNoCopy:"+srNoCopy);
                    if (srNoCopy == srNo && products.length > 2) {
                        let y = totalFOBEuro - ttPrice - Number(products[i][7]);
                        console.log("y:" + y);
                        console.log("Total fob:" + totalFOBEuro);
                        console.log("ttPrice:" + ttPrice);
                        console.log("products[i][7]:" + products[i][7]);
                        if (products[i][1] === "-") {
                            if (products[i][5] === "" || products[i][5] === 0) {
                                price = Number(products[i][6]) + round3(y / Number(products[i][2]));
                                console.log("Right one Y");
                            } else {
                                price = Number(products[i][6]) + round3(y / Number(products[i][5]));
                                console.log("Wrong one Y");
                            }
                        } else {
                            price = Number(products[i][6]) + round3(y / Number(products[i][5]));
                            console.log("very Wrong one Y");
                        }
                        // console.log("price:"+price)
                        // } else if ((srNoCopy - 1) == srNo) {
                        //   let y = totalFOBEuro - ttPrice - Number(products[i][7]) - Number(products[i + 1][7]);
                        //   y = y / 2;
                        //   console.log("y:" + y + " x:" + x);
                        //   price = Number(products[i][6]) + round3(y / Number(products[i][5]));
                    } else {
                        if (products[i][1] === "-") {
                            if (products[i][5] === "" || products[i][5] === 0) {
                                price = Number(products[i][6]) + round3(x / Number(products[i][2]));
                            } else {
                                price = Number(products[i][6]) + round3(x / Number(products[i][5]));
                            }
                        } else {
                            price = Number(products[i][6]) + round3(x / Number(products[i][5]));
                        }
                    }
                    console.log("price:" + price);

                    worksheetCopy.getCell('A' + row).value = srNo;
                    worksheetCopy.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    worksheetCopy.getCell('A' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };
                    srNo++;

                    worksheetCopy.mergeCells('B' + row + ':D' + row);
                    worksheetCopy.getCell('B' + row).value = hsnCode;
                    worksheetCopy.getCell('B' + row).font = { bold: true };
                    worksheetCopy.getCell('B' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    setOuterBorder('B' + row + ':D' + row, worksheetCopy);

                    worksheetCopy.mergeCells('E' + row + ':Q' + row);
                    worksheetCopy.getCell('E' + row).value = products[i][0];
                    worksheetCopy.getCell('E' + row).font = { size: 12 };
                    worksheetCopy.getCell('E' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    setOuterBorder('E' + row + ':Q' + row, worksheetCopy);
                    if (String(products[i][0]).length > 56) {
                        worksheetCopy.getRow(row).height = 36;
                    }

                    if (products[i][1] === "-") {
                        worksheetCopy.getCell('R' + row).value = "-";
                    } else {
                        worksheetCopy.getCell('R' + row).value = products[i][1];
                    }
                    worksheetCopy.getCell('R' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    worksheetCopy.getCell('R' + row).font = { size: 12 };
                    worksheetCopy.getCell('R' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };

                    worksheetCopy.mergeCells('S' + row + ':T' + row);
                    worksheetCopy.getCell('S' + row).value = products[i][2];
                    worksheetCopy.getCell('S' + row).font = { size: 12 };
                    worksheetCopy.getCell('S' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    setOuterBorder('S' + row + ':T' + row, worksheetCopy);

                    worksheetCopy.mergeCells('U' + row + ':V' + row);
                    worksheetCopy.getCell('U' + row).value = products[i][3];
                    worksheetCopy.getCell('U' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    setOuterBorder('U' + row + ':V' + row, worksheetCopy);

                    worksheetCopy.mergeCells('W' + row + ':X' + row);
                    if (products[i][4] === "-") {
                        worksheetCopy.getCell('W' + row).value = "-";
                    } else {
                        worksheetCopy.getCell('W' + row).value = products[i][4];
                    }
                    worksheetCopy.getCell('W' + row).font = { size: 12 };
                    worksheetCopy.getCell('W' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    setOuterBorder('W' + row + ':X' + row, worksheetCopy);

                    // worksheetCopy.getCell('Y' + row).value = products[i][5];
                    // worksheetCopy.getCell('Y' + row).value = { formula: `ROUND(S${row}*W${row}, 4)`, result: 0 };
                    // worksheetCopy.getCell('Y' + row).value = { formula: `S${row}*W${row}`, result: 0 };
                    if (products[i][5] === "-") {
                        worksheetCopy.getCell('Y' + row).value = "-";
                    } else {
                        if (products[i][4] === "-") {
                            if (products[i][5] === "" || products[i][5] === 0) {
                                worksheetCopy.getCell('Y' + row).value = "-";
                            } else {
                                worksheetCopy.getCell('Y' + row).value = products[i][5];
                            }
                        } else {
                            worksheetCopy.getCell('Y' + row).value = { formula: `S${row}*W${row}`, result: 0 };
                        }
                    }
                    worksheetCopy.getCell('Y' + row).numFmt = '0.00'
                    worksheetCopy.getCell('Y' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    worksheetCopy.getCell('Y' + row).font = { size: 12 };
                    worksheetCopy.getCell('Y' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };

                    // REPLACE WITH:
                    // const adjustment = adjustments.get(i) || 0;
                    // price = Number(products[i][6]) + adjustment;

                    // // ALSO UPDATE:
                    // tPrice = round4(price * Number(products[i][5])); //

                    worksheetCopy.getCell('Z' + row).value = price;
                    worksheetCopy.getCell('Z' + row).numFmt = '0.0000';
                    worksheetCopy.getCell('Z' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    worksheetCopy.getCell('Z' + row).font = { size: 12 };
                    worksheetCopy.getCell('Z' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };


                    if (products[i][1] === "-") {
                        if (products[i][5] === "" || products[i][5] === 0) {
                            tPrice = round3(price * Number(products[i][2]))
                        } else {
                            tPrice = round3(price * Number(products[i][5]))
                        }
                    } else {
                        tPrice = round3(price * Number(products[i][5]))
                    }
                    // 
                    // console.log("tPrice:"+tPrice);
                    // if (srNoCopy == srNo) {
                    //   tPrice = +(price * Number(products[i][5])).toFixed(3);
                    // }

                    // worksheetCopy.getCell('AA' + row).value = { formula: `ROUND(Y${row}*Z${row}, 4)`, result: 0 };
                    if (products[i][1] === "-") {
                        if (products[i][5] === "-" || products[i][5] === 0) {
                            worksheetCopy.getCell('AA' + row).value = { formula: `ROUND(S${row}*Z${row}, 4)`, result: 0 };
                        } else {
                            worksheetCopy.getCell('AA' + row).value = { formula: `ROUND(Y${row}*Z${row}, 4)`, result: 0 };
                        }
                    } else {
                        worksheetCopy.getCell('AA' + row).value = { formula: `ROUND(Y${row}*Z${row}, 4)`, result: 0 };
                    }
                    worksheetCopy.getCell('AA' + row).numFmt = '0.0000';
                    worksheetCopy.getCell('AA' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    worksheetCopy.getCell('AA' + row).font = { size: 12 };
                    worksheetCopy.getCell('AA' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };

                    ttPrice += tPrice;
                    // console.log(ttPrice);
                }
            }
            else {
                row++;
                if (products[i].length === 2) {
                    worksheetCopy.mergeCells('E' + row + ':Q' + row);
                    worksheetCopy.getCell('E' + row).value = products[i][0];
                    // worksheet.getCell('E' + row).fill = {
                    //     type: 'pattern',
                    //     pattern: 'solid',
                    //     fgColor: { argb: 'FFFFCC99' }, // Light orange / peach
                    // };

                    worksheetCopy.getCell('E' + row).font = { bold: true, size: 12 };
                    worksheetCopy.getCell('E' + row).alignment = { horizontal: 'center', vertical: 'middle' };
                    worksheetCopy.getRow(row).height = 46;
                    setOuterBorder('E' + row + ':Q' + row, worksheetCopy);
                    hsnCode = Number(products[i][1]);
                    if (i == 0) {
                        allProductsType = String(products[i][0]);
                    }
                    else {
                        allProductsType += '/' + String(products[i][0]);
                    }

                    if (i !== 0) {
                        worksheetCopy.getCell('A' + row).border = {
                            top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                            left: { style: 'thin', color: { argb: 'FF000000' } },
                            bottom: { style: 'thin', color: { argb: 'FF000000' } },
                            right: { style: 'thin', color: { argb: 'FF000000' } },
                        };

                        setOuterBorder('B' + row + ':D' + row, worksheetCopy);
                    }
                    setOuterBorder('E' + row + ':Q' + row, worksheetCopy);

                    setOuterBorder('R' + row + ':S' + row, worksheetCopy);
                    setOuterBorder('T' + row + ':U' + row, worksheetCopy);
                    setOuterBorder('V' + row + ':X' + row, worksheetCopy);
                    setOuterBorder('Y' + row + ':AA' + row, worksheetCopy);

                } else {

                    // console.log("srNO:"+srNo+" srNoCopy:"+srNoCopy);
                    if (srNoCopy == srNo && products.length > 2) {
                        let y = totalFOBEuro - ttPrice - Number(products[i][7]);
                        console.log("y:" + y);
                        price = Number(products[i][6]) + round3(y / Number(products[i][2]));
                        // console.log("price:"+price)
                        // } else if ((srNoCopy - 1) == srNo) {
                        //   let y = totalFOBEuro - ttPrice - Number(products[i][7]) - Number(products[i + 1][7]);
                        //   y = y / 2;
                        //   console.log("y:" + y + " x:" + x);
                        //   price = Number(products[i][6]) + round3(y / Number(products[i][5]));
                    } else {
                        price = Number(products[i][6]) + round3(x / Number(products[i][2]));
                    }

                    worksheetCopy.getCell('A' + row).value = srNo;
                    worksheetCopy.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    worksheetCopy.getCell('A' + row).border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } },
                    };
                    srNo++;

                    worksheetCopy.mergeCells('B' + row + ':D' + row);
                    worksheetCopy.getCell('B' + row).value = hsnCode;
                    worksheetCopy.getCell('B' + row).font = { bold: true };
                    worksheetCopy.getCell('B' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    setOuterBorder('B' + row + ':D' + row, worksheetCopy);

                    worksheetCopy.mergeCells('E' + row + ':Q' + row);
                    worksheetCopy.getCell('E' + row).value = products[i][0];
                    worksheetCopy.getCell('E' + row).font = { size: 12 };
                    worksheetCopy.getCell('E' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    setOuterBorder('E' + row + ':Q' + row, worksheetCopy);
                    if (String(products[i][0]).length > 56) {
                        worksheetCopy.getRow(row).height = 36;
                    }

                    worksheetCopy.mergeCells('R' + row + ':S' + row);
                    worksheetCopy.getCell('R' + row).value = products[i][2];
                    worksheetCopy.getCell('R' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    worksheetCopy.getCell('R' + row).font = { size: 12 };
                    setOuterBorder('R' + row + ':S' + row, worksheetCopy);

                    worksheetCopy.mergeCells('T' + row + ':U' + row);
                    worksheetCopy.getCell('T' + row).value = products[i][3];
                    worksheetCopy.getCell('T' + row).font = { size: 12 };
                    worksheetCopy.getCell('T' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    setOuterBorder('T' + row + ':U' + row, worksheetCopy);

                    worksheetCopy.mergeCells('V' + row + ':X' + row);
                    worksheetCopy.getCell('V' + row).value = price;
                    worksheetCopy.getCell('V' + row).numFmt = '0.0000';
                    worksheetCopy.getCell('V' + row).font = { size: 12 };
                    worksheetCopy.getCell('V' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    setOuterBorder('V' + row + ':X' + row, worksheetCopy);

                    tPrice = round3(price * Number(products[i][2]))

                    worksheetCopy.mergeCells('Y' + row + ':AA' + row);
                    worksheetCopy.getCell('Y' + row).value = { formula: `ROUND(R${row}*V${row}, 4)`, result: 0 };
                    worksheetCopy.getCell('Y' + row).numFmt = '0.0000';
                    worksheetCopy.getCell('Y' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                    worksheetCopy.getCell('Y' + row).font = { size: 12 };
                    setOuterBorder('Y' + row + ':AA' + row, worksheetCopy);


                    ttPrice += tPrice;
                    // console.log(ttPrice);
                }

            }
        }

        row++;
        worksheetCopy.mergeCells('A' + row + ':D' + (row + 7));
        setOuterBorder('A' + row + ':D' + (row + 7), worksheetCopy);

        skipRow = 3;
        addSkipRow = 6;
        if (taxStatus == "with") {
            skipRow = 2;
            addSkipRow = 7;
        }
        if (type !== "tiles") {
            for (let i = 0; i < skipRow; i++) {
                setOuterBorder('E' + row + ':Q' + row, worksheetCopy);

                worksheetCopy.getCell('R' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                setOuterBorder('S' + row + ':T' + row, worksheetCopy);
                setOuterBorder('U' + row + ':V' + row, worksheetCopy);
                setOuterBorder('W' + row + ':X' + row, worksheetCopy);

                worksheetCopy.getCell('Y' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                worksheetCopy.getCell('Z' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                worksheetCopy.getCell('AA' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };
                row++;
            }

            worksheetCopy.mergeCells('R' + row + ':R' + (row + addSkipRow));
            setOuterBorder('R' + row + ':R' + (row + addSkipRow), worksheetCopy);
            worksheetCopy.mergeCells('S' + row + ':T' + (row + addSkipRow));
            setOuterBorder('S' + row + ':T' + (row + addSkipRow), worksheetCopy);
            worksheetCopy.mergeCells('U' + row + ':V' + (row + addSkipRow));
            setOuterBorder('U' + row + ':V' + (row + addSkipRow), worksheetCopy);
            worksheetCopy.mergeCells('W' + row + ':X' + (row + addSkipRow));
            setOuterBorder('W' + row + ':X' + (row + addSkipRow), worksheetCopy);
            worksheetCopy.mergeCells('Y' + row + ':Y' + (row + addSkipRow));
            setOuterBorder('Y' + row + ':Y' + (row + addSkipRow), worksheetCopy);
            worksheetCopy.mergeCells('Z' + row + ':Z' + (row + addSkipRow));
            setOuterBorder('Z' + row + ':Z' + (row + addSkipRow), worksheetCopy);
            worksheetCopy.mergeCells('AA' + row + ':AA' + (row + addSkipRow));
            setOuterBorder('AA' + row + ':AA' + (row + addSkipRow), worksheetCopy);
        }
        else {
            for (let i = 0; i < skipRow; i++) {
                setOuterBorder('E' + row + ':Q' + row, worksheetCopy);

                setOuterBorder('R' + row + ':S' + row, worksheetCopy);
                setOuterBorder('T' + row + ':U' + row, worksheetCopy);
                setOuterBorder('V' + row + ':X' + row, worksheetCopy);
                setOuterBorder('Y' + row + ':AA' + row, worksheetCopy);
                row++;
            }

            worksheetCopy.mergeCells('R' + row + ':S' + (row + addSkipRow));
            setOuterBorder('R' + row + ':S' + (row + addSkipRow), worksheetCopy);
            worksheetCopy.mergeCells('T' + row + ':U' + (row + addSkipRow));
            setOuterBorder('T' + row + ':U' + (row + addSkipRow), worksheetCopy);
            worksheetCopy.mergeCells('V' + row + ':X' + (row + addSkipRow));
            setOuterBorder('V' + row + ':X' + (row + addSkipRow), worksheetCopy);
            worksheetCopy.mergeCells('Y' + row + ':AA' + (row + addSkipRow));
            setOuterBorder('Y' + row + ':AA' + (row + addSkipRow), worksheetCopy);
        }

        if (taxStatus == "with") {
            worksheetCopy.mergeCells('E' + row + ':Q' + row);
            worksheetCopy.getCell('E' + row).value = "CERTIFIED THAT GOODS ARE OF INDIAN ORIGIN";
            worksheetCopy.getCell('E' + row).font = { name: 'Arial' };
            worksheetCopy.getCell('E' + row).alignment = { horizontal: 'center' };
            setOuterBorder('E' + row + ':Q' + row, worksheetCopy);
            row++;
        }

        worksheetCopy.mergeCells('E' + row + ':Q' + row);
        worksheetCopy.getCell('E' + row).value = "Export Under Duty Drawback Scheme";
        worksheetCopy.getCell('E' + row).font = { bold: true };
        worksheetCopy.getCell('E' + row).alignment = { horizontal: 'center' };
        setOuterBorder('E' + row + ':Q' + row, worksheetCopy);
        row++;

        worksheetCopy.mergeCells('E' + row + ':Q' + (row + 1));
        worksheetCopy.getCell('E' + row).value = "I/we shall claim under chapter 3 incentive of FTP as admissible at time policy in force - MEIS, RODTEP ";
        worksheetCopy.getCell('E' + row).font = { bold: true };
        worksheetCopy.getCell('E' + row).alignment = { wrapText: true, horizontal: 'center' };
        setOuterBorder('E' + row + ':Q' + (row + 1), worksheetCopy);
        row += 2;

        worksheetCopy.mergeCells('E' + row + ':Q' + (row + 1));
        setOuterBorder('E' + row + ':Q' + (row + 1), worksheetCopy);
        row += 2;

        if (type !== 'tiles') {
            worksheetCopy.mergeCells('A' + row + ':E' + row);
            worksheetCopy.getCell('A' + row).value = "NET WT. (KGS): ";
            worksheetCopy.getCell('A' + row).font = { underline: true };
            worksheetCopy.getCell('A' + row).alignment = { horizontal: 'right' };
            setOuterBorder('A' + row + ':E' + row, worksheetCopy);

            worksheetCopy.mergeCells('F' + row + ':H' + row);
            worksheetCopy.getCell('F' + row).value = netWeight;
            worksheetCopy.getCell('F' + row).numFmt = '0.00';
            worksheetCopy.getCell('F' + row).font = { underline: true };
            // worksheetCopy.getCell('F' + row).fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' },
            // };

            worksheetCopy.getCell('F' + row).font = { bold: true };
            worksheetCopy.getCell('F' + row).alignment = { horizontal: 'left' };
            setOuterBorder('F' + row + ':H' + row, worksheetCopy);

            worksheetCopy.mergeCells('I' + row + ':Q' + row);
            setOuterBorder('I' + row + ':Q' + row, worksheetCopy);
            row++;

            worksheetCopy.mergeCells('A' + row + ':E' + row);
            worksheetCopy.getCell('A' + row).value = "GROSS WT.(KGS): ";
            worksheetCopy.getCell('A' + row).font = { underline: true };
            worksheetCopy.getCell('A' + row).alignment = { horizontal: 'right' };
            setOuterBorder('A' + row + ':E' + row, worksheetCopy);

            worksheetCopy.mergeCells('F' + row + ':H' + row);
            worksheetCopy.getCell('F' + row).value = grossWeight;
            worksheetCopy.getCell('F' + row).numFmt = '0.00';
            worksheetCopy.getCell('F' + row).font = { underline: true };
            // worksheetCopy.getCell('F' + row).fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' },
            // };

            worksheetCopy.getCell('F' + row).font = { bold: true };
            worksheetCopy.getCell('F' + row).alignment = { horizontal: 'left' };
            setOuterBorder('F' + row + ':H' + row, worksheetCopy);

            worksheetCopy.mergeCells('I' + row + ':Q' + row);
            setOuterBorder('I' + row + ':Q' + row, worksheetCopy);
            row++;
        } else {
            worksheetCopy.mergeCells('A' + row + ':D' + row);
            worksheetCopy.getCell('A' + row).value = "NET WT. (KGS): ";
            worksheetCopy.getCell('A' + row).font = { underline: true };
            worksheetCopy.getCell('A' + row).alignment = { horizontal: 'right' };
            setOuterBorder('A' + row + ':D' + row, worksheetCopy);

            worksheetCopy.mergeCells('E' + row + ':G' + row);
            worksheetCopy.getCell('E' + row).value = netWeight;
            worksheetCopy.getCell('E' + row).numFmt = '0.00';
            worksheetCopy.getCell('E' + row).font = { underline: true };
            // worksheetCopy.getCell('E' + row).fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' },
            // };

            worksheetCopy.getCell('E' + row).font = { bold: true };
            worksheetCopy.getCell('E' + row).alignment = { horizontal: 'left' };
            setOuterBorder('E' + row + ':G' + row, worksheetCopy);

            worksheetCopy.mergeCells('H' + row + ':Q' + row);
            setOuterBorder('H' + row + ':Q' + row, worksheetCopy);
            row++;

            worksheetCopy.mergeCells('A' + row + ':D' + row);
            worksheetCopy.getCell('A' + row).value = "GROSS WT.(KGS): ";
            worksheetCopy.getCell('A' + row).font = { underline: true };
            worksheetCopy.getCell('A' + row).alignment = { horizontal: 'right' };
            setOuterBorder('A' + row + ':D' + row, worksheetCopy);

            worksheetCopy.mergeCells('E' + row + ':G' + row);
            worksheetCopy.getCell('E' + row).value = grossWeight;
            worksheetCopy.getCell('E' + row).numFmt = '0.00';
            worksheetCopy.getCell('E' + row).font = { underline: true };
            // worksheetCopy.getCell('E' + row).fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' },
            // };

            worksheetCopy.getCell('E' + row).font = { bold: true };
            worksheetCopy.getCell('E' + row).alignment = { horizontal: 'left' };
            setOuterBorder('E' + row + ':G' + row, worksheetCopy);

            worksheetCopy.mergeCells('H' + row + ':Q' + row);
            setOuterBorder('H' + row + ':Q' + row, worksheetCopy);
            row++;
        }

        worksheetCopy.mergeCells('A' + row + ':G' + row);
        worksheetCopy.getCell('A' + row).value = "Nos. of Kind Packages";
        worksheetCopy.getCell('A' + row).font = { bold: true };
        worksheetCopy.getCell('A' + row).alignment = { horizontal: 'center' };

        worksheetCopy.mergeCells('H' + row + ':Q' + (row + 1));
        worksheetCopy.getCell('H' + row).value = "Total     >>>>>>>>>>";
        worksheetCopy.getCell('H' + row).font = { bold: true };
        worksheetCopy.getCell('H' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('H' + row + ':Q' + (row + 1), worksheetCopy);

        if (type !== "tiles") {
            setOuterBorder('R' + row + ':R' + (row + 1), worksheetCopy);

            worksheetCopy.mergeCells('S' + row + ':T' + row);
            worksheetCopy.getCell('S' + row).value = { formula: `SUM(S30:S${row - 1})`, result: 0 };
            worksheetCopy.getCell('S' + row).font = { bold: true };
            worksheetCopy.getCell('S' + row).alignment = { horizontal: 'center' };

            setOuterBorder('U' + row + ':V' + (row + 1), worksheetCopy);

            worksheetCopy.mergeCells('W' + row + ':Y' + row);
            worksheetCopy.getCell('W' + row).value = `TOTAL SQM`;
            worksheetCopy.getCell('W' + row).font = { bold: true };
            worksheetCopy.getCell('W' + row).alignment = { horizontal: 'center' };

            worksheetCopy.mergeCells('W' + (row + 1) + ':Y' + (row + 1));
            worksheetCopy.getCell('W' + (row + 1)).value = { formula: `SUM(Y30:Y${row - 1})`, result: 0 };
            worksheetCopy.getCell('W' + (row + 1)).font = { bold: true };
            worksheetCopy.getCell('W' + (row + 1)).alignment = { horizontal: 'center' };
            setOuterBorder('W' + row + ':Y' + (row + 1), worksheetCopy);

            worksheetCopy.mergeCells('Z' + row + ':Z' + (row + 1));
            if (termsOfDeliveryMain === "CIF -> FOB") {
                worksheetCopy.getCell('Z' + row).value = `CIF ${currency}`;
            } else {
                worksheetCopy.getCell('Z' + row).value = `${termsOfDelivery} ${currency}`;
            }
            worksheetCopy.getCell('Z' + row).font = { bold: true };
            worksheetCopy.getCell('Z' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            setOuterBorder('Z' + row + ':Z' + (row + 1), worksheetCopy);

            worksheetCopy.mergeCells('AA' + row + ':AA' + (row + 1));
            if (termsOfDeliveryMain === "CIF -> FOB") {
                worksheetCopy.getCell('AA' + row).value = { formula: `ROUND(AA${row + 4} - ${insurance} - ${freight}, 2)`, result: 0 };
            } else {
                worksheetCopy.getCell('AA' + row).value = { formula: `ROUND(SUM(AA28:AA${row - 1}), 2)`, result: 0 };
            }
            worksheetCopy.getCell('AA' + row).font = { bold: true };
            worksheetCopy.getCell('AA' + row).alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('AA' + row + ':AA' + (row + 1), worksheetCopy);
        }
        else {
            worksheetCopy.mergeCells('R' + row + ':S' + row);
            worksheetCopy.getCell('R' + row).value = { formula: `ROUND(SUM(R30:R${row - 1}), 2)`, result: 0 };
            worksheetCopy.getCell('R' + row).font = { bold: true };
            worksheetCopy.getCell('R' + row).alignment = { horizontal: 'center' };

            worksheetCopy.mergeCells('T' + row + ':U' + row);
            worksheetCopy.getCell('T' + row).value = "UNIT TYPE";
            worksheetCopy.getCell('T' + row).font = { bold: true };
            worksheetCopy.getCell('T' + row).alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('T' + row + ':U' + row, worksheetCopy);

            worksheetCopy.mergeCells('T' + (row + 1) + ':U' + (row + 1));
            worksheetCopy.getCell('T' + (row + 1)).value = packegingType;
            worksheetCopy.getCell('T' + (row + 1)).font = { bold: true };
            worksheetCopy.getCell('T' + (row + 1)).alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('T' + (row + 1) + ':U' + (row + 1), worksheetCopy);

            worksheetCopy.mergeCells('V' + row + ':X' + (row + 1));
            if (termsOfDeliveryMain === "CIF -> FOB") {
                worksheetCopy.getCell('V' + row).value = `CIF ${currency}`;
            } else {
                worksheetCopy.getCell('V' + row).value = `${termsOfDelivery} ${currency}`;
            }
            worksheetCopy.getCell('V' + row).font = { bold: true };
            worksheetCopy.getCell('V' + row).alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('V' + row + ':X' + (row + 1), worksheetCopy);



            worksheetCopy.mergeCells('Y' + row + ':AA' + (row + 1));
            if (termsOfDeliveryMain === "CIF -> FOB") {
                worksheetCopy.getCell('Y' + row).value = { formula: `ROUND(Y${row + 4} - ${insurance} - ${freight}, 2)`, result: 0 };
            } else {
                worksheetCopy.getCell('Y' + row).value = { formula: `ROUND(SUM(Y30:Y${row - 1}), 2)`, result: 0 };
            }
            worksheetCopy.getCell('Y' + row).font = { bold: true };
            worksheetCopy.getCell('Y' + row).alignment = { horizontal: 'center', vertical: 'middle' };
            setOuterBorder('Y' + row + ':AA' + (row + 1), worksheetCopy);
        }
        row++;

        worksheetCopy.mergeCells('A' + row + ':G' + row);
        if (type !== "tiles") {
            worksheetCopy.getCell('A' + row).value = { formula: `INT(SUM(S30:S${row - 2})) & " ${unitOfIt}"`, result: `0${unitOfIt}`, };
        }
        else {
            worksheetCopy.getCell('A' + row).value = { formula: `INT(SUM(R30:R${row - 2})) & " ${unitOfIt}"`, result: `0${unitOfIt}`, };
        }
        worksheetCopy.getCell('A' + row).font = { bold: true };
        worksheetCopy.getCell('A' + row).alignment = { horizontal: 'center' };
        setOuterBorder('A' + (row - 1) + ':G' + row, worksheetCopy);

        if (type !== "tiles") {
            worksheetCopy.mergeCells('S' + row + ':T' + row);
            worksheetCopy.getCell('S' + row).value = unitOfIt;
            worksheetCopy.getCell('S' + row).font = { bold: true };
            worksheetCopy.getCell('S' + row).alignment = { horizontal: 'center' };
            setOuterBorder('S' + (row - 1) + ':T' + row, worksheetCopy);
        }
        else {
            worksheetCopy.mergeCells('R' + row + ':S' + row);
            worksheetCopy.getCell('R' + row).value = unitOfIt;
            worksheetCopy.getCell('R' + row).font = { bold: true };
            worksheetCopy.getCell('R' + row).alignment = { horizontal: 'center' };
            setOuterBorder('R' + (row - 1) + ':S' + row, worksheetCopy);
        }
        row++;

        worksheetCopy.mergeCells('A' + row + ':Q' + row);
        worksheetCopy.getCell('A' + row).value = `TOTAL ${termsOfDelivery} ${currency}:`;
        worksheetCopy.getCell('A' + row).font = { bold: true };
        worksheetCopy.getCell('A' + row).alignment = { horizontal: 'left' };
        setOuterBorder('A' + row + ':Q' + row, worksheetCopy);

        if (type === "sanitary" && termsOfDelivery === "CIF") {
            setOuterBorder('R' + row + ':R' + row, worksheetCopy);
            setOuterBorder('S' + row + ':Y' + row, worksheetCopy);

            worksheetCopy.mergeCells('Z' + row + ':Z' + row);
            // worksheetCopy.getCell('Z' + row).value = "INSURANCE";
            // worksheetCopy.getCell('Z' + row).font = { bold: true };
            // worksheetCopy.getCell('Z' + row).alignment = { horizontal: 'center' };
            setOuterBorder('Z' + row + ':Z' + row, worksheetCopy);

            worksheetCopy.mergeCells('AA' + row + ':AA' + row);
            // worksheetCopy.getCell('AA' + row).value = insurance;
            // worksheetCopy.getCell('AA' + row).font = { bold: true };
            // worksheetCopy.getCell('AA' + row).alignment = { horizontal: 'center' };
            setOuterBorder('AA' + row + ':AA' + row, worksheetCopy);
        }
        else if (type === "tiles" && termsOfDelivery === "CIF") {
            worksheetCopy.mergeCells('R' + row + ':X' + row);
            // worksheetCopy.getCell('R' + row).value = "INSURANCE";
            // worksheetCopy.getCell('R' + row).font = { bold: true };
            // worksheetCopy.getCell('R' + row).alignment = { horizontal: 'right' };
            setOuterBorder('R' + row + ':X' + row, worksheetCopy);

            worksheetCopy.mergeCells('Y' + row + ':AA' + row);
            // worksheetCopy.getCell('Y' + row).value = insurance;
            // worksheetCopy.getCell('Y' + row).font = { bold: true };
            // worksheetCopy.getCell('Y' + row).alignment = { horizontal: 'center' };
            setOuterBorder('Y' + row + ':AA' + row, worksheetCopy);
        } else if (type === "sanitary") {
            setOuterBorder('R' + row + ':R' + row, worksheetCopy);
            setOuterBorder('S' + row + ':Y' + row, worksheetCopy);

            worksheetCopy.mergeCells('Z' + row + ':Z' + row);
            setOuterBorder('Z' + row + ':Z' + row, worksheetCopy);

            worksheetCopy.mergeCells('AA' + row + ':AA' + row);
            setOuterBorder('AA' + row + ':AA' + row, worksheetCopy);
        } else if (type === "tiles") {
            worksheetCopy.mergeCells('R' + row + ':X' + row);
            setOuterBorder('R' + row + ':X' + row, worksheetCopy);

            worksheetCopy.mergeCells('Y' + row + ':AA' + row);
            setOuterBorder('Y' + row + ':AA' + row, worksheetCopy);
        }
        row++;

        worksheetCopy.mergeCells('A' + row + ':Q' + (row + 1));
        worksheetCopy.getCell('A' + row).value = `${amountInWords}.`;
        // worksheetCopy.getCell('A' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };

        worksheetCopy.getCell('A' + row).font = { bold: true };
        worksheetCopy.getCell('A' + row).alignment = { horizontal: 'left', vertical: 'top' };
        setOuterBorder('A' + row + ':Q' + (row + 1), worksheetCopy);

        if (type === "sanitary") {
            worksheetCopy.getCell('R' + row).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };

            worksheetCopy.getCell('R' + (row + 1)).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };
        }

        setOuterBorder('S' + row + ':Y' + row, worksheetCopy);

        if (type === "sanitary" && termsOfDelivery !== "FOB") {
            worksheetCopy.mergeCells('Z' + row + ':Z' + row);
            // worksheetCopy.getCell('Z' + row).value = "FREIGHT";
            // worksheetCopy.getCell('Z' + row).font = { bold: true };
            // worksheetCopy.getCell('Z' + row).alignment = { horizontal: 'center' };
            setOuterBorder('Z' + row + ':Z' + row, worksheetCopy);

            worksheetCopy.mergeCells('AA' + row + ':AA' + row);
            // worksheetCopy.getCell('AA' + row).value = freight;
            // worksheetCopy.getCell('AA' + row).font = { bold: true };
            // worksheetCopy.getCell('AA' + row).alignment = { horizontal: 'center' };
            setOuterBorder('AA' + row + ':AA' + row, worksheetCopy);
        }
        else if (type === "tiles" && termsOfDelivery !== "FOB") {
            worksheetCopy.mergeCells('R' + row + ':X' + row);
            // worksheetCopy.getCell('R' + row).value = "FREIGHT";
            // worksheetCopy.getCell('R' + row).font = { bold: true };
            // worksheetCopy.getCell('R' + row).alignment = { horizontal: 'right' };
            setOuterBorder('R' + row + ':X' + row, worksheetCopy);

            worksheetCopy.mergeCells('Y' + row + ':AA' + row);
            // worksheetCopy.getCell('Y' + row).value = freight;
            // worksheetCopy.getCell('Y' + row).font = { bold: true };
            // worksheetCopy.getCell('Y' + row).alignment = { horizontal: 'center' };
            setOuterBorder('Y' + row + ':AA' + row, worksheetCopy);
        } else if (type === "sanitary") {
            worksheetCopy.mergeCells('Z' + row + ':Z' + row);
            setOuterBorder('Z' + row + ':Z' + row, worksheetCopy);

            worksheetCopy.mergeCells('AA' + row + ':AA' + row);
            setOuterBorder('AA' + row + ':AA' + row, worksheetCopy);
        }
        else if (type === "tiles") {
            worksheetCopy.mergeCells('R' + row + ':X' + row);
            setOuterBorder('R' + row + ':X' + row, worksheetCopy);

            worksheetCopy.mergeCells('Y' + row + ':AA' + row);
            setOuterBorder('Y' + row + ':AA' + row, worksheetCopy);
        }
        row++;

        if (type === "sanitary") {
            worksheetCopy.mergeCells('S' + row + ':Y' + row);
            if (termsOfDeliveryMain === "CIF -> FOB") {
                worksheetCopy.getCell('S' + row).value = `TOTAL FOB ${currency}`;
            } else {
                worksheetCopy.getCell('S' + row).value = `TOTAL ${termsOfDelivery} ${currency}`;
            }
            worksheetCopy.getCell('S' + row).font = { bold: true };
            worksheetCopy.getCell('S' + row).alignment = { horizontal: 'right' };
            setOuterBorder('S' + row + ':Y' + row, worksheetCopy);

            worksheetCopy.getCell('AA' + row).value = { formula: `ROUND(SUM(AA${row - 5}:AA${row - 4}), 4)`, result: 0 };
            worksheetCopy.getCell('AA' + row).font = { bold: true };
            worksheetCopy.getCell('AA' + row).alignment = { horizontal: 'center' };
            worksheetCopy.getCell('AA' + row).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };

        }
        else if (type === "tiles") {
            worksheetCopy.mergeCells('R' + row + ':X' + row);
            if (termsOfDeliveryMain === "CIF -> FOB") {
                worksheetCopy.getCell('R' + row).value = `TOTAL FOB ${currency}`;
            } else {
                worksheetCopy.getCell('R' + row).value = `TOTAL ${termsOfDelivery} ${currency}`;
            }
            worksheetCopy.getCell('R' + row).font = { bold: true };
            worksheetCopy.getCell('R' + row).alignment = { horizontal: 'right' };
            setOuterBorder('R' + row + ':X' + row, worksheetCopy);

            worksheetCopy.mergeCells('Y' + row + ':AA' + row);
            worksheetCopy.getCell('Y' + row).value = { formula: `ROUND(SUM(Y${row - 5}:Y${row - 4}), 4)`, result: 0 };
            // worksheetCopy.getCell('Y' + row).value = { formula: `='CUSTOM INVOICE'!Y69`, result: 0 };
            worksheetCopy.getCell('Y' + row).font = { bold: true };
            worksheetCopy.getCell('Y' + row).alignment = { horizontal: 'center' };
            setOuterBorder('Y' + row + ':AA' + row, worksheetCopy);

        }

        worksheetCopy.getCell('R' + (row + 1)).border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },     // black
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        row++;

        worksheetCopy.mergeCells('A' + row + ':AA' + row);
        worksheetCopy.getCell('A' + row).value = gstCirculerNumber;
        worksheetCopy.getCell('A' + row).font = { italic: true };
        worksheetCopy.getCell('A' + row).alignment = { horizontal: 'left' };
        setOuterBorder('A' + row + ':AA' + row, worksheetCopy);
        row++;

        worksheetCopy.mergeCells('A' + row + ':AA' + (row + 1));
        if (taxStatus === "without") {
            worksheetCopy.getCell('A' + row).value = `LETTER OF UNDERTAKING NO.ACKNOWLEDGMENT FOR LUT  APPLICATION REFERENCE NUMBER (ARN) ${arn}\nDT:${lutDate}`;
        } else {
            worksheetCopy.getCell('A' + row).value = `SUPPLY MEANT FOR EXPORT ON PAYMENT OF IGST UNDER CLAIM OF REFUND RS. TOTAL : ${gstValue}\n(TAXABLE ${termsOfDelivery} INR VALUE ${totalInINR}@ 18%)                                                                            ${gstValue}  `;
        }
        worksheetCopy.getCell('A' + row).font = { name: 'Arial', italic: true, color: { argb: 'FFFF0000' } };
        worksheetCopy.getCell('A' + row).alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };
        setOuterBorder('A' + row + ':AA' + (row + 1), worksheetCopy);
        row += 2;

        if (taxStatus === "with") {
            for (let i = 0; i < 4; i++) {
                worksheetCopy.getCell('A' + (row + i)).border = {
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                }
            }
        }

        if (taxStatus == "without") {


            for (let i = 0; i < supplierDetails.length; i++) {
                if (type === "sanitary") {
                    if (i % 2 === 0) {
                        worksheetCopy.mergeCells('A' + row + ':Q' + row);
                        worksheetCopy.getCell('A' + row).value = `SUPPLIER DETAILS :- ${i + 1}`;
                        worksheetCopy.getCell('A' + row).font = { bold: true };
                        worksheetCopy.getCell('A' + row).alignment = { horizontal: 'center' };
                        setOuterBorder('A' + row + ':Q' + row, worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('A' + (row + 1) + ':F' + (row + 1));
                        worksheetCopy.getCell('A' + (row + 1)).value = "NAME:";
                        worksheetCopy.getCell('A' + (row + 1)).font = { bold: true };
                        worksheetCopy.getCell('A' + (row + 1)).alignment = { horizontal: 'center' };
                        setOuterBorder('A' + (row + 1) + ':F' + (row + 1), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('G' + (row + 1) + ':Q' + (row + 1));
                        worksheetCopy.getCell('G' + (row + 1)).value = supplierDetails[i][0];
                        worksheetCopy.getCell('G' + (row + 1)).alignment = { horizontal: 'center' };
                        setOuterBorder('G' + (row + 1) + ':Q' + (row + 1), worksheetCopy);

                        worksheetCopy.mergeCells('A' + (row + 2) + ':F' + (row + 2));
                        worksheetCopy.getCell('A' + (row + 2)).value = "GSTIN NO.";
                        worksheetCopy.getCell('A' + (row + 2)).font = { bold: true };
                        worksheetCopy.getCell('A' + (row + 2)).alignment = { horizontal: 'center' };
                        setOuterBorder('A' + (row + 2) + ':F' + (row + 2), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('G' + (row + 2) + ':Q' + (row + 2));
                        worksheetCopy.getCell('G' + (row + 2)).value = supplierDetails[i][1];
                        worksheetCopy.getCell('G' + (row + 2)).alignment = { horizontal: 'center' };
                        setOuterBorder('G' + (row + 2) + ':Q' + (row + 2), worksheetCopy);

                        worksheetCopy.mergeCells('A' + (row + 3) + ':F' + (row + 3));
                        worksheetCopy.getCell('A' + (row + 3)).value = "TAX INVOICE NO & DATE:";
                        worksheetCopy.getCell('A' + (row + 3)).font = { bold: true };
                        worksheetCopy.getCell('A' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('A' + (row + 3) + ':F' + (row + 3), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('G' + (row + 3) + ':K' + (row + 3));
                        worksheetCopy.getCell('G' + (row + 3)).value = supplierDetails[i][2];
                        // worksheetCopy.getCell('G' + (row + 3)).fill = {
                        //     type: 'pattern',
                        //     pattern: 'solid',
                        //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                        // };
                        worksheetCopy.getCell('G' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('G' + (row + 3) + ':K' + (row + 3), worksheetCopy);

                        worksheetCopy.mergeCells('L' + (row + 3) + ':Q' + (row + 3));
                        worksheetCopy.getCell('L' + (row + 3)).value = supplierDetails[i][3];
                        // worksheetCopy.getCell('L' + (row + 3)).fill = {
                        //     type: 'pattern',
                        //     pattern: 'solid',
                        //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                        // };
                        worksheetCopy.getCell('L' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('L' + (row + 3) + ':Q' + (row + 3), worksheetCopy);
                    } else {
                        worksheetCopy.mergeCells('R' + row + ':AA' + row);
                        worksheetCopy.getCell('R' + row).value = `SUPPLIER DETAILS :- ${i + 1}`;
                        worksheetCopy.getCell('R' + row).font = { bold: true };
                        worksheetCopy.getCell('R' + row).alignment = { horizontal: 'center' };
                        setOuterBorder('R' + row + ':AA' + row, worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('R' + (row + 1) + ':U' + (row + 1));
                        worksheetCopy.getCell('R' + (row + 1)).value = "NAME:";
                        worksheetCopy.getCell('R' + (row + 1)).font = { bold: true };
                        worksheetCopy.getCell('R' + (row + 1)).alignment = { horizontal: 'center' };
                        setOuterBorder('R' + (row + 1) + ':U' + (row + 1), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('V' + (row + 1) + ':AA' + (row + 1));
                        worksheetCopy.getCell('V' + (row + 1)).value = supplierDetails[i][0];
                        worksheetCopy.getCell('V' + (row + 1)).alignment = { horizontal: 'center' };
                        setOuterBorder('V' + (row + 1) + ':AA' + (row + 1), worksheetCopy);

                        worksheetCopy.mergeCells('R' + (row + 2) + ':U' + (row + 2));
                        worksheetCopy.getCell('R' + (row + 2)).value = "GSTIN NO.";
                        worksheetCopy.getCell('R' + (row + 2)).font = { bold: true };
                        worksheetCopy.getCell('R' + (row + 2)).alignment = { horizontal: 'center' };
                        setOuterBorder('R' + (row + 2) + ':U' + (row + 2), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('V' + (row + 2) + ':AA' + (row + 2));
                        worksheetCopy.getCell('V' + (row + 2)).value = supplierDetails[i][1];
                        worksheetCopy.getCell('V' + (row + 2)).alignment = { horizontal: 'center' };
                        setOuterBorder('V' + (row + 2) + ':AA' + (row + 2), worksheetCopy);

                        worksheetCopy.mergeCells('R' + (row + 3) + ':U' + (row + 3));
                        worksheetCopy.getCell('R' + (row + 3)).value = "TAX INVOICE NO & DATE:";
                        worksheetCopy.getCell('R' + (row + 3)).font = { bold: true };
                        worksheetCopy.getCell('R' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('R' + (row + 3) + ':U' + (row + 3), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('V' + (row + 3) + ':Y' + (row + 3));
                        worksheetCopy.getCell('V' + (row + 3)).value = supplierDetails[i][2];
                        // worksheetCopy.getCell('V' + (row + 3)).fill = {
                        //     type: 'pattern',
                        //     pattern: 'solid',
                        //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                        // };
                        worksheetCopy.getCell('V' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('V' + (row + 3) + ':Y' + (row + 3), worksheetCopy);

                        worksheetCopy.mergeCells('Z' + (row + 3) + ':AA' + (row + 3));
                        worksheetCopy.getCell('Z' + (row + 3)).value = supplierDetails[i][3];
                        // worksheetCopy.getCell('Z' + (row + 3)).fill = {
                        //     type: 'pattern',
                        //     pattern: 'solid',
                        //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                        // };
                        worksheetCopy.getCell('Z' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('Z' + (row + 3) + ':AA' + (row + 3), worksheetCopy);
                        row += 4;
                    }
                }
                else if (type === "tiles") {
                    if (i % 2 === 0) {
                        worksheetCopy.mergeCells('A' + row + ':M' + row);
                        worksheetCopy.getCell('A' + row).value = `SUPPLIER DETAILS :- ${i + 1}`;
                        worksheetCopy.getCell('A' + row).font = { bold: true };
                        worksheetCopy.getCell('A' + row).alignment = { horizontal: 'center' };
                        setOuterBorder('A' + row + ':M' + row, worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('A' + (row + 1) + ':E' + (row + 1));
                        worksheetCopy.getCell('A' + (row + 1)).value = "NAME:";
                        worksheetCopy.getCell('A' + (row + 1)).font = { bold: true };
                        worksheetCopy.getCell('A' + (row + 1)).alignment = { horizontal: 'center' };
                        setOuterBorder('A' + (row + 1) + ':E' + (row + 1), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('F' + (row + 1) + ':M' + (row + 1));
                        worksheetCopy.getCell('F' + (row + 1)).value = supplierDetails[i][0];
                        worksheetCopy.getCell('F' + (row + 1)).alignment = { horizontal: 'center' };
                        setOuterBorder('F' + (row + 1) + ':M' + (row + 1), worksheetCopy);

                        worksheetCopy.mergeCells('A' + (row + 2) + ':E' + (row + 2));
                        worksheetCopy.getCell('A' + (row + 2)).value = "GSTIN NO.";
                        worksheetCopy.getCell('A' + (row + 2)).font = { bold: true };
                        worksheetCopy.getCell('A' + (row + 2)).alignment = { horizontal: 'center' };
                        setOuterBorder('A' + (row + 2) + ':E' + (row + 2), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('F' + (row + 2) + ':M' + (row + 2));
                        worksheetCopy.getCell('F' + (row + 2)).value = supplierDetails[i][1];
                        worksheetCopy.getCell('F' + (row + 2)).alignment = { horizontal: 'center' };
                        setOuterBorder('F' + (row + 2) + ':M' + (row + 2), worksheetCopy);

                        worksheetCopy.mergeCells('A' + (row + 3) + ':E' + (row + 3));
                        worksheetCopy.getCell('A' + (row + 3)).value = "TAX INVOICE NO & DATE:";
                        worksheetCopy.getCell('A' + (row + 3)).font = { bold: true };
                        worksheetCopy.getCell('A' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('A' + (row + 3) + ':E' + (row + 3), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('F' + (row + 3) + ':I' + (row + 3));
                        worksheetCopy.getCell('F' + (row + 3)).value = supplierDetails[i][2];
                        // worksheetCopy.getCell('F' + (row + 3)).fill = {
                        //     type: 'pattern',
                        //     pattern: 'solid',
                        //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                        // };
                        worksheetCopy.getCell('F' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('F' + (row + 3) + ':I' + (row + 3), worksheetCopy);

                        worksheetCopy.mergeCells('J' + (row + 3) + ':M' + (row + 3));
                        worksheetCopy.getCell('J' + (row + 3)).value = supplierDetails[i][3];
                        // worksheetCopy.getCell('J' + (row + 3)).fill = {
                        //     type: 'pattern',
                        //     pattern: 'solid',
                        //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                        // };
                        worksheetCopy.getCell('J' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('J' + (row + 3) + ':M' + (row + 3), worksheetCopy);
                    } else {
                        worksheetCopy.mergeCells('N' + row + ':AA' + row);
                        worksheetCopy.getCell('N' + row).value = `SUPPLIER DETAILS :- ${i + 1}`;
                        worksheetCopy.getCell('N' + row).font = { bold: true };
                        worksheetCopy.getCell('N' + row).alignment = { horizontal: 'center' };
                        setOuterBorder('N' + row + ':AA' + row, worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('N' + (row + 1) + ':S' + (row + 1));
                        worksheetCopy.getCell('N' + (row + 1)).value = "NAME:";
                        worksheetCopy.getCell('N' + (row + 1)).font = { bold: true };
                        worksheetCopy.getCell('N' + (row + 1)).alignment = { horizontal: 'center' };
                        setOuterBorder('N' + (row + 1) + ':S' + (row + 1), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('T' + (row + 1) + ':AA' + (row + 1));
                        worksheetCopy.getCell('T' + (row + 1)).value = supplierDetails[i][0];
                        worksheetCopy.getCell('T' + (row + 1)).alignment = { horizontal: 'center' };
                        setOuterBorder('T' + (row + 1) + ':AA' + (row + 1), worksheetCopy);

                        worksheetCopy.mergeCells('N' + (row + 2) + ':S' + (row + 2));
                        worksheetCopy.getCell('N' + (row + 2)).value = "GSTIN NO.";
                        worksheetCopy.getCell('N' + (row + 2)).font = { bold: true };
                        worksheetCopy.getCell('N' + (row + 2)).alignment = { horizontal: 'center' };
                        setOuterBorder('N' + (row + 2) + ':S' + (row + 2), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('T' + (row + 2) + ':AA' + (row + 2));
                        worksheetCopy.getCell('T' + (row + 2)).value = supplierDetails[i][1];
                        worksheetCopy.getCell('T' + (row + 2)).alignment = { horizontal: 'center' };
                        setOuterBorder('T' + (row + 2) + ':AA' + (row + 2), worksheetCopy);

                        worksheetCopy.mergeCells('N' + (row + 3) + ':S' + (row + 3));
                        worksheetCopy.getCell('N' + (row + 3)).value = "TAX INVOICE NO & DATE:";
                        worksheetCopy.getCell('N' + (row + 3)).font = { bold: true };
                        worksheetCopy.getCell('N' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('N' + (row + 3) + ':S' + (row + 3), worksheetCopy, 'medium'); // Removable

                        worksheetCopy.mergeCells('T' + (row + 3) + ':W' + (row + 3));
                        worksheetCopy.getCell('T' + (row + 3)).value = supplierDetails[i][2];
                        // worksheetCopy.getCell('T' + (row + 3)).fill = {
                        //     type: 'pattern',
                        //     pattern: 'solid',
                        //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                        // };
                        worksheetCopy.getCell('T' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('T' + (row + 3) + ':W' + (row + 3), worksheetCopy);

                        worksheetCopy.mergeCells('X' + (row + 3) + ':AA' + (row + 3));
                        worksheetCopy.getCell('X' + (row + 3)).value = supplierDetails[i][3];
                        // worksheetCopy.getCell('X' + (row + 3)).fill = {
                        //     type: 'pattern',
                        //     pattern: 'solid',
                        //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                        // };
                        worksheetCopy.getCell('X' + (row + 3)).alignment = { horizontal: 'center' };
                        setOuterBorder('X' + (row + 3) + ':AA' + (row + 3), worksheetCopy);
                        row += 4;
                    }
                }
            }

        }

        if (supplierDetails.length % 2 === 0 || supplierDetails.length == 0) {
            if (type == "tiles") {
                worksheetCopy.mergeCells('A' + row + ':M' + row);
                setOuterBorder('A' + row + ':M' + row, worksheetCopy);

                worksheetCopy.mergeCells('A' + (row + 1) + ':E' + (row + 1));
                setOuterBorder('A' + (row + 1) + ':E' + (row + 1), worksheetCopy);

                worksheetCopy.mergeCells('F' + (row + 1) + ':M' + (row + 1));
                setOuterBorder('F' + (row + 1) + ':M' + (row + 1), worksheetCopy);

                worksheetCopy.mergeCells('A' + (row + 2) + ':E' + (row + 2));
                setOuterBorder('A' + (row + 2) + ':E' + (row + 2), worksheetCopy);

                worksheetCopy.mergeCells('F' + (row + 2) + ':M' + (row + 2));
                setOuterBorder('F' + (row + 2) + ':M' + (row + 2), worksheetCopy);

                worksheetCopy.mergeCells('A' + (row + 3) + ':E' + (row + 3));
                setOuterBorder('A' + (row + 3) + ':E' + (row + 3), worksheetCopy);

                worksheetCopy.mergeCells('F' + (row + 3) + ':I' + (row + 3));
                // worksheetCopy.getCell('F' + (row + 3)).fill = {
                //     type: 'pattern',
                //     pattern: 'solid',
                //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                // };
                setOuterBorder('F' + (row + 3) + ':I' + (row + 3), worksheetCopy);

                worksheetCopy.mergeCells('J' + (row + 3) + ':M' + (row + 3));
                // worksheetCopy.getCell('J' + (row + 3)).fill = {
                //     type: 'pattern',
                //     pattern: 'solid',
                //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                // };
                setOuterBorder('J' + (row + 3) + ':M' + (row + 3), worksheetCopy);
            } else {
                worksheetCopy.mergeCells('A' + row + ':Q' + row);
                setOuterBorder('A' + row + ':Q' + row, worksheetCopy);

                worksheetCopy.mergeCells('A' + (row + 1) + ':F' + (row + 1));
                setOuterBorder('A' + (row + 1) + ':F' + (row + 1), worksheetCopy);

                worksheetCopy.mergeCells('G' + (row + 1) + ':Q' + (row + 1));
                setOuterBorder('G' + (row + 1) + ':Q' + (row + 1), worksheetCopy);

                worksheetCopy.mergeCells('A' + (row + 2) + ':F' + (row + 2));
                setOuterBorder('A' + (row + 2) + ':F' + (row + 2), worksheetCopy);

                worksheetCopy.mergeCells('G' + (row + 2) + ':Q' + (row + 2));
                setOuterBorder('G' + (row + 2) + ':Q' + (row + 2), worksheetCopy);

                worksheetCopy.mergeCells('A' + (row + 3) + ':F' + (row + 3));
                setOuterBorder('A' + (row + 3) + ':F' + (row + 3), worksheetCopy);

                worksheetCopy.mergeCells('G' + (row + 3) + ':K' + (row + 3));
                // worksheetCopy.getCell('G' + (row + 3)).fill = {
                //     type: 'pattern',
                //     pattern: 'solid',
                //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                // };
                setOuterBorder('G' + (row + 3) + ':K' + (row + 3), worksheetCopy);

                worksheetCopy.mergeCells('L' + (row + 3) + ':Q' + (row + 3));
                // worksheetCopy.getCell('L' + (row + 3)).fill = {
                //     type: 'pattern',
                //     pattern: 'solid',
                //     fgColor: { argb: 'FFFFFF00' }, // Yellow fill
                // };
                setOuterBorder('L' + (row + 3) + ':Q' + (row + 3), worksheetCopy);
            }
        }
        if (type === "sanitary") {
            worksheetCopy.mergeCells('R' + row + ':AA' + row);
            worksheetCopy.getCell('R' + row).value = "Signature & Date";
            worksheetCopy.getCell('R' + row).font = { bold: true };
            worksheetCopy.getCell('R' + row).alignment = { horizontal: 'right' };
            row++;

            worksheetCopy.mergeCells('R' + row + ':AA' + row);
            worksheetCopy.getCell('R' + row).value = "For, ZERIC CERAMICA";
            worksheetCopy.getCell('R' + row).font = { bold: true };
            worksheetCopy.getCell('R' + row).alignment = { horizontal: 'right' };

            worksheetCopy.addImage(signature, {
                tl: { col: 24, row: (row - 1) }, // X66 (X = col 24 → 24 - 1 = 23 → 22 for 0-based)
                ext: { width: 100, height: 100 }, // adjust size as needed
            });
            row += 5;

            worksheetCopy.mergeCells('R' + row + ':AA' + row);
            worksheetCopy.getCell('R' + row).value = "AUTHORISED SIGN.";
            worksheetCopy.getCell('R' + row).font = { bold: true };
            worksheetCopy.getCell('R' + row).alignment = { horizontal: 'right' };
            setOuterBorder('R' + (row - 6) + ':AA' + row, worksheetCopy);


            worksheetCopy.mergeCells('A' + (row - 1) + ':Q' + row);
            worksheetCopy.getCell('A' + (row - 1)).value = "Declaration:We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
            worksheetCopy.getCell('A' + (row - 1)).font = { bold: true };
            worksheetCopy.getCell('A' + (row - 1)).alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };
            setOuterBorder('A' + (row - 1) + ':Q' + row, worksheetCopy);
            setOuterBorder('A' + (row - 2) + ':Q' + (row - 2), worksheetCopy);
        }
        else if (type === "tiles") {
            worksheetCopy.mergeCells('N' + row + ':AA' + row);
            worksheetCopy.getCell('N' + row).value = "Signature & Date";
            worksheetCopy.getCell('N' + row).font = { bold: true };
            worksheetCopy.getCell('N' + row).alignment = { horizontal: 'right' };
            row++;

            worksheetCopy.mergeCells('N' + row + ':AA' + row);
            worksheetCopy.getCell('N' + row).value = "For, ZERIC CERAMICA";
            worksheetCopy.getCell('N' + row).font = { bold: true };
            worksheetCopy.getCell('N' + row).alignment = { horizontal: 'right' };

            worksheetCopy.addImage(signature, {
                tl: { col: 20, row: (row - 1) }, // X66 (X = col 24 → 24 - 1 = 23 → 22 for 0-based)
                ext: { width: 100, height: 100 }, // adjust size as needed
            });
            row += 5;

            worksheetCopy.mergeCells('N' + row + ':AA' + row);
            worksheetCopy.getCell('N' + row).value = "AUTHORISED SIGN.";
            worksheetCopy.getCell('N' + row).font = { bold: true };
            worksheetCopy.getCell('N' + row).alignment = { horizontal: 'right' };
            setOuterBorder('N' + (row - 6) + ':AA' + row, worksheetCopy);


            worksheetCopy.mergeCells('A' + (row - 1) + ':M' + row);
            worksheetCopy.getCell('A' + (row - 1)).value = "Declaration:We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
            worksheetCopy.getCell('A' + (row - 1)).font = { bold: true };
            worksheetCopy.getCell('A' + (row - 1)).alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };
            setOuterBorder('A' + (row - 1) + ':M' + row, worksheetCopy);
            setOuterBorder('A' + (row - 2) + ':M' + (row - 2), worksheetCopy);
        }

        setOuterBorder('A1:AA' + row, worksheetCopy, 'medium');

        worksheetCopy.pageSetup.fitToPage = true;

        MAX_WIDTH = 5;
        if (type === "tiles") {

            worksheetCopy.columns.forEach((column) => {
                let maxLength = 10;

                column.eachCell({ includeEmpty: true }, (cell) => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    const lines = cellValue.split('\n');
                    const longestLine = Math.max(...lines.map(line => line.length));
                    if (longestLine > maxLength) {
                        maxLength = longestLine;
                    }
                });

                column.width = Math.min(maxLength + 2, MAX_WIDTH); // 👈 LIMIT IT
            });
            worksheetCopy.getColumn(1).width = pixelToExcelWidth(50);
        }
        else if (type === "sanitary") {
            columnWidths.forEach((px, index) => {
                worksheetCopy.getColumn(index + 1).width = pixelToExcelWidth(px);
            });
        }

        setGlobalFontSize(worksheetCopy);

    }











































































    // Create a new workbook
    const packingListWorkbook = new ExcelJS.Workbook();
    // New tab : PACKING LIST
    const packingList = packingListWorkbook.addWorksheet('PACKING LIST');
    if (signatureUrl) {

        const { buffer, extension, width, height } = await loadImageBuffer(signatureUrl);
        signature = packingListWorkbook.addImage({
            buffer: buffer,
            extension: extension,
        });
        vgnSignatureW = width;
        vgnSignatureH = height;

    }

    packingList.mergeCells('A1:AA1');
    packingList.getCell('A1').value = 'PACKING LIST';
    packingList.getCell('A1').font = { bold: true };
    packingList.getCell('A1').alignment = { horizontal: 'center' };
    setOuterBorder('A1:AA1', packingList);

    packingList.mergeCells('A2:M9');
    packingList.getCell('A2').value = `EXPORTER:\n${companyName}\n${companyAddress}`;
    packingList.getCell('A2').alignment = { wrapText: true, vertical: 'top' };
    packingList.getCell('A2').font = { bold: true };
    setOuterBorder('A2:M9', packingList);

    // ✅ Email & Tax No
    packingList.mergeCells('A10:B10');
    packingList.getCell('A10').value = `EMAIL:`;
    packingList.getCell('A10').font = { bold: true };
    packingList.getCell('A10').alignment = { wrapText: true };

    packingList.mergeCells('A11:B11');
    packingList.getCell('A11').value = `TAX ID:`;
    packingList.getCell('A11').font = { bold: true };
    packingList.getCell('A11').alignment = { wrapText: true };

    packingList.mergeCells('C10:M10');
    packingList.getCell('C10').value = email;
    packingList.getCell('C10').alignment = { wrapText: true };

    packingList.mergeCells('C11:M11');
    packingList.getCell('C11').value = taxid;
    packingList.getCell('C11').alignment = { wrapText: true };
    setOuterBorder('A10:M11', packingList);

    // ✅ Invoice No. & Date
    packingList.mergeCells('N2:T2');
    packingList.getCell('N2').value = "Invoice No. & Date:";
    packingList.getCell('N2').font = { bold: true };
    packingList.getCell('N2').alignment = { horizontal: 'center' };

    packingList.mergeCells('N3:T3');
    packingList.getCell('N3').value = `${invoiceNo}`;

    packingList.mergeCells('N4:T4');
    packingList.getCell('N4').value = `Dt. ${invoiceDate}`;

    setOuterBorder('N2:T4', packingList);

    // ✅ Exporter's Ref
    packingList.mergeCells('U2:AA2');
    packingList.getCell('U2').value = "Exporter’s Ref.:";
    packingList.getCell('U2').font = { bold: true };

    packingList.mergeCells('U3:AA11');
    packingList.getCell('U3').value = `I. E. Code #: ${ieCode}\nPAN No #: ${panNo}\nGSTIN No #: ${gstinNo}\nSTATE CODE : ${stateCode}`;
    packingList.getCell('U3').alignment = { wrapText: true, vertical: 'top' };
    setOuterBorder('U2:AA11', packingList);

    // ✅ Buyer's Order No
    packingList.mergeCells('N5:T5');
    packingList.getCell('N5').value = "Buyer's Order no. & Date";
    packingList.getCell('N5').font = { bold: true };

    packingList.mergeCells('N6:T7');
    packingList.getCell('N6').value = `${buyersOrderNo}    ${buyersOrderDate}`;
    packingList.getCell('N6').alignment = { wrapText: true, vertical: 'top' };

    packingList.mergeCells('N11:T11');
    packingList.getCell('N11').value = `PO No: ${poNo}`;
    setOuterBorder('N5:T11', packingList);

    // ✅ Consignee
    packingList.mergeCells('A12:M12');
    packingList.getCell('A12').value = "Consignee:";
    packingList.getCell('A12').font = { bold: true };

    packingList.mergeCells('A13:M18');
    packingList.getCell('A13').value = `${consignee}`;
    packingList.getCell('A13').alignment = { wrapText: true, vertical: 'top' };
    setOuterBorder('A12:M18', packingList);

    // ✅ Notify Party
    packingList.mergeCells('N12:AA12');
    packingList.getCell('N12').value = "Notify Party # :";
    packingList.getCell('N12').font = { bold: true };

    packingList.mergeCells('N13:AA18');
    packingList.getCell('N13').value = `${notifyParty}`;
    packingList.getCell('N13').alignment = { wrapText: true, vertical: 'top' };
    setOuterBorder('N12:AA18', packingList);

    packingList.mergeCells('A19:F19');
    packingList.getCell('A19').value = 'Pre-Carriage By';
    packingList.getCell('A19').alignment = { horizontal: 'center' };

    packingList.mergeCells('A20:F20');
    packingList.getCell('A20').value = `${preCarriage}`;
    packingList.getCell('A20').font = { bold: true };
    packingList.getCell('A20').alignment = { horizontal: 'center' };
    setOuterBorder('A19:F20', packingList);

    packingList.mergeCells('G19:M19');
    packingList.getCell('G19').value = "Place of Receipt by Pre-Carrier";
    packingList.getCell('G19').alignment = { horizontal: 'center' };

    packingList.mergeCells('G20:M20');
    packingList.getCell('G20').value = `${placeOfReceipt}`;
    packingList.getCell('G20').font = { bold: true };
    packingList.getCell('G20').alignment = { horizontal: 'center' };
    setOuterBorder('G19:M20', packingList);

    packingList.mergeCells('N19:V19');
    packingList.getCell('N19').value = "Country of Origin of Goods : INDIA";
    packingList.getCell('N19').alignment = { horizontal: 'center' };

    packingList.mergeCells('N20:V20');
    packingList.getCell('N20').value = `ORIGIN : ${origin}`;
    packingList.getCell('N20').font = { bold: true };
    packingList.getCell('N20').alignment = { horizontal: 'center' };
    setOuterBorder('N19:V20', packingList);

    packingList.mergeCells('W19:AA19');
    packingList.getCell('W19').value = "Country of Final Destination";
    packingList.getCell('W19').alignment = { horizontal: 'center' };

    packingList.mergeCells('W20:AA20');
    packingList.getCell('W20').value = `${finalDestination}`;
    packingList.getCell('W20').font = { bold: true };
    packingList.getCell('W20').alignment = { horizontal: 'center' };
    setOuterBorder('W19:AA20', packingList);

    packingList.mergeCells('A21:F21');
    packingList.getCell('A21').value = 'Vessel Flight No.';
    packingList.getCell('A21').alignment = { horizontal: 'center' };

    packingList.mergeCells('A22:F22');
    packingList.getCell('A22').value = `${vassalFlightNo}`;
    packingList.getCell('A22').font = { bold: true };
    packingList.getCell('A22').alignment = { horizontal: 'center' };
    setOuterBorder('A21:F22', packingList);

    packingList.mergeCells('G21:M21');
    packingList.getCell('G21').value = "Port of Loading";
    packingList.getCell('G21').alignment = { horizontal: 'center' };

    packingList.mergeCells('G22:M22');
    packingList.getCell('G22').value = `${portOfLoading}`;
    packingList.getCell('G22').font = { bold: true };
    packingList.getCell('G22').alignment = { horizontal: 'center' };
    setOuterBorder('G21:M22', packingList);

    packingList.mergeCells('A23:F23');
    packingList.getCell('A23').value = 'Port of Discharge';
    packingList.getCell('A23').alignment = { horizontal: 'center' };

    packingList.mergeCells('A24:F25');
    packingList.getCell('A24').value = `${portOfDischarge}`;
    packingList.getCell('A24').font = { bold: true };
    packingList.getCell('A24').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('A23:F25', packingList);

    packingList.mergeCells('G23:M23');
    packingList.getCell('G23').value = "Final Destination";
    packingList.getCell('G23').alignment = { horizontal: 'center' };

    packingList.mergeCells('G24:M25');
    packingList.getCell('G24').value = `${finalDestination}`;
    packingList.getCell('G24').font = { bold: true };
    packingList.getCell('G24').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('G23:M25', packingList);

    packingList.mergeCells('N21:AA21');
    packingList.getCell('N21').value = "Terms of Delivery & Payment :-";
    // packingList.getCell('N21').font = { bold: true };

    packingList.mergeCells('N22:AA22');
    if (termsOfDelivery === "FOB") {
        packingList.getCell('N22').value = `${termsOfDelivery} AT ${portOfLoading} PORT`;
    } else {
        packingList.getCell('N22').value = `${termsOfDelivery} AT ${portOfDischarge} PORT`;
    }

    packingList.mergeCells('N23:AA24');
    packingList.getCell('N23').value = `PAYMENT : ${paymentTerms}`;
    packingList.getCell('N23').alignment = { wrapText: true, vertical: 'top' };

    packingList.mergeCells('N25:V25');
    packingList.getCell('N25').value = shippingMethod;
    packingList.getCell('N25').font = { bold: true };
    setOuterBorder('N21:AA25', packingList);

    configurePrintSheet(packingList);

    packingList.mergeCells('A26:D26');
    packingList.getCell('A26').value = "Marks & Nos.";
    packingList.getCell('A26').font = { bold: true };
    packingList.getCell('A26').alignment = { horizontal: 'center' };

    if (containerType === 'FCL') {
        packingList.mergeCells('A27:D27');
        packingList.getCell('A27').value = `${marksAndNos} ${containerType}`;
        packingList.getCell('A27').font = { bold: true };
        packingList.getCell('A27').alignment = { horizontal: 'center' };
        setOuterBorder('A26:D27', packingList);
    } else {
        packingList.mergeCells('A27:D27');
        packingList.getCell('A27').value = containerType;
        packingList.getCell('A27').font = { bold: true };
        packingList.getCell('A27').alignment = { horizontal: 'center' };
        setOuterBorder('A26:D27', packingList);
    }

    packingList.mergeCells('E26:P27');
    packingList.getCell('E26').value = "Description of Goods";
    packingList.getCell('E26').font = { bold: true };
    packingList.getCell('E26').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('E26:P27', packingList);

    packingList.mergeCells('Q26:U26');
    packingList.getCell('Q26').value = "QUANTITY";
    packingList.getCell('Q26').font = { bold: true };
    packingList.getCell('Q26').alignment = { horizontal: 'center' };

    packingList.mergeCells('Q27:U27');
    packingList.getCell('Q27').value = packegingType;
    packingList.getCell('Q27').font = { bold: true };
    packingList.getCell('Q27').alignment = { horizontal: 'center' };
    setOuterBorder('Q26:U27', packingList);

    packingList.mergeCells('V26:X26');
    packingList.getCell('V26').value = "NET. WT.";
    packingList.getCell('V26').font = { bold: true };
    packingList.getCell('V26').alignment = { horizontal: 'center' };

    packingList.mergeCells('V27:X27');
    packingList.getCell('V27').value = "IN KGS.";
    packingList.getCell('V27').font = { bold: true };
    packingList.getCell('V27').alignment = { horizontal: 'center' };
    setOuterBorder('V26:X27', packingList);

    packingList.mergeCells('Y26:AA26');
    packingList.getCell('Y26').value = "GRS. WT.";
    packingList.getCell('Y26').font = { bold: true };
    packingList.getCell('Y26').alignment = { horizontal: 'center' };

    packingList.mergeCells('Y27:AA27');
    packingList.getCell('Y27').value = "IN KGS.";
    packingList.getCell('Y27').font = { bold: true };
    packingList.getCell('Y27').alignment = { horizontal: 'center' };
    setOuterBorder('Y26:AA27', packingList);

    packingList.getCell('A28').value = "SR NO.";
    packingList.getCell('A28').font = { bold: true };
    packingList.getCell('A28').alignment = { horizontal: 'center', vertical: 'middle' };
    packingList.getCell('A28').border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    packingList.mergeCells('B28:D28');
    packingList.getCell('B28').value = "HSN CODE";
    packingList.getCell('B28').font = { bold: true };
    packingList.getCell('B28').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('B28:D28', packingList);


    row = 27;
    srNo = 1;
    for (let i = 0; i < products.length; i++) {
        row++;
        if (products[i].length === 2) {
            packingList.mergeCells('E' + row + ':P' + row);
            packingList.getCell('E' + row).value = products[i][0];
            packingList.getCell('E' + row).font = { bold: true, size: 12 };
            packingList.getCell('E' + row).alignment = { horizontal: 'center', vertical: 'middle' };
            packingList.getRow(row).height = 46;
            setOuterBorder('E' + row + ':P' + row, packingList);
            hsnCode = Number(products[i][1]);

            if (i !== 0) {
                packingList.getCell('A' + row).border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } },
                };

                setOuterBorder('B' + row + ':D' + row, packingList);
            }
            setOuterBorder('E' + row + ':P' + row, packingList);

            setOuterBorder('Q' + row + ':U' + row, packingList);
            setOuterBorder('V' + row + ':X' + row, packingList);
            setOuterBorder('Y' + row + ':AA' + row, packingList);

        } else {
            packingList.getCell('A' + row).value = srNo;
            packingList.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            packingList.getCell('A' + row).font = { bold: true };
            packingList.getCell('A' + row).border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },     // black
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } },
            };
            srNo++;

            packingList.mergeCells('B' + row + ':D' + row);
            packingList.getCell('B' + row).value = hsnCode;
            packingList.getCell('B' + row).font = { bold: true };
            packingList.getCell('B' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            setOuterBorder('B' + row + ':D' + row, packingList);

            if (type !== 'tiles') {
                packingList.mergeCells('E' + row + ':J' + row);
                packingList.getCell('E' + row).value = products[i][0];
                packingList.getCell('E' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('E' + row + ':J' + row, packingList);

                packingList.mergeCells('K' + row + ':P' + row);
                packingList.getCell('K' + row).value = products[i][1];
                packingList.getCell('K' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('K' + row + ':P' + row, packingList);
            } else {
                packingList.mergeCells('E' + row + ':P' + row);
                packingList.getCell('E' + row).value = products[i][0];
                packingList.getCell('E' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
                setOuterBorder('E' + row + ':P' + row, packingList);
            }
            if (String(products[i][0]).length > 56) {
                packingList.getRow(row).height = 36;
            }

            packingList.mergeCells('Q' + row + ':U' + row);
            packingList.getCell('Q' + row).value = products[i][2];
            packingList.getCell('Q' + row).font = { bold: true, underline: true };
            packingList.getCell('Q' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            setOuterBorder('Q' + row + ':U' + row, packingList);

            packingList.mergeCells('V' + row + ':X' + row);
            packingList.getCell('V' + row).value = products[i][8];
            packingList.getCell('V' + row).numFmt = '0.00'
            // packingList.getCell('V' + row).fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' },
            // };
            packingList.getCell('V' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            setOuterBorder('V' + row + ':X' + row, packingList);

            packingList.mergeCells('Y' + row + ':AA' + row);
            packingList.getCell('Y' + row).value = products[i][9];
            packingList.getCell('Y' + row).numFmt = '0.00'
            // packingList.getCell('Y' + row).fill = {
            //     type: 'pattern',
            //     pattern: 'solid',
            //     fgColor: { argb: 'FFFFFF00' },
            // };
            packingList.getCell('Y' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
            setOuterBorder('Y' + row + ':AA' + row, packingList);
        }
    }


    row++;
    packingList.mergeCells('A' + row + ':D' + (row + 4));
    setOuterBorder('A' + row + ':D' + (row + 4), packingList);

    packingList.mergeCells('Q' + row + ':U' + (row + 5));
    setOuterBorder('Q' + row + ':U' + (row + 5), packingList);

    packingList.mergeCells('V' + row + ':X' + (row + 5));
    setOuterBorder('V' + row + ':AA' + (row + 5), packingList);

    packingList.mergeCells('Y' + row + ':AA' + (row + 5));
    setOuterBorder('Y' + row + ':AA' + (row + 5), packingList);

    if (taxStatus == "with") {
        packingList.mergeCells('E' + row + ':P' + row);
        packingList.getCell('E' + row).value = "CERTIFIED THAT GOODS ARE OF INDIAN ORIGIN";
        packingList.getCell('E' + row).font = { name: 'Arial' };
        packingList.getCell('E' + row).alignment = { horizontal: 'center' };
        setOuterBorder('E' + row + ':P' + row, packingList);
        row++;
    }

    packingList.mergeCells('E' + row + ':P' + row);
    packingList.getCell('E' + row).value = "Export Under Duty Drawback Scheme";
    packingList.getCell('E' + row).font = { bold: true };
    packingList.getCell('E' + row).alignment = { horizontal: 'center' };
    setOuterBorder('E' + row + ':P' + row, packingList);
    row++;

    packingList.mergeCells('E' + row + ':P' + (row + 1));
    packingList.getCell('E' + row).value = "I/we shall claim under chapter 3 incentive of FTP as admissible at time policy in force - MEIS, RODTEP ";
    packingList.getCell('E' + row).font = { bold: true };
    packingList.getCell('E' + row).alignment = { wrapText: true, horizontal: 'center' };
    setOuterBorder('E' + row + ':P' + (row + 1), packingList);
    row += 2;

    if (taxStatus == "without") {
        packingList.mergeCells('E' + row + ':P' + (row + 1));
        setOuterBorder('E' + row + ':P' + (row + 1), packingList);
        row += 2;
    } else {
        packingList.mergeCells('E' + row + ':P' + row);
        setOuterBorder('E' + row + ':P' + row, packingList);
        row++;
    }

    packingList.mergeCells('A' + row + ':D' + row);
    packingList.getCell('A' + row).value = "CONTAINER NO.";
    packingList.getCell('A' + row).font = { bold: true };
    packingList.getCell('A' + row).alignment = { horizontal: 'center' };
    setOuterBorder('A' + row + ':D' + row, packingList);

    packingList.mergeCells('E' + row + ':H' + row);
    packingList.getCell('E' + row).value = "LINE SEAL NO.";
    packingList.getCell('E' + row).font = { bold: true };
    packingList.getCell('E' + row).alignment = { horizontal: 'center' };
    setOuterBorder('E' + row + ':H' + row, packingList);

    packingList.mergeCells('I' + row + ':L' + row);
    packingList.getCell('I' + row).value = "RFID SEAL";
    packingList.getCell('I' + row).font = { bold: true };
    packingList.getCell('I' + row).alignment = { horizontal: 'center' };
    setOuterBorder('I' + row + ':L' + row, packingList);

    packingList.mergeCells('M' + row + ':P' + row);
    packingList.getCell('M' + row).value = "Design no";
    packingList.getCell('M' + row).font = { bold: true };
    packingList.getCell('M' + row).alignment = { horizontal: 'center' };
    setOuterBorder('M' + row + ':P' + row, packingList);

    row++;

    for (let i = 0; i < containerDetails.length; i++) {

        packingList.getRow(row).height = 36;  // fix height here

        packingList.mergeCells('A' + row + ':D' + row);
        packingList.getCell('A' + row).value = containerDetails[i][0];
        packingList.getCell('A' + row).font = { size: 11 };
        // packingList.getCell('A' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFD9EAF7' },
        // };
        packingList.getCell('A' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('A' + row + ':D' + row, packingList);

        packingList.mergeCells('E' + row + ':H' + row);
        packingList.getCell('E' + row).value = containerDetails[i][1];
        packingList.getCell('E' + row).font = { size: 11 };
        // packingList.getCell('E' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };
        packingList.getCell('E' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('E' + row + ':H' + row, packingList);

        packingList.mergeCells('I' + row + ':L' + row);
        packingList.getCell('I' + row).value = containerDetails[i][2];
        packingList.getCell('I' + row).font = { size: 11 };
        // packingList.getCell('I' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };
        packingList.getCell('I' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('I' + row + ':L' + row, packingList);

        packingList.mergeCells('M' + row + ':P' + row);
        packingList.getCell('M' + row).value = containerDetails[i][3];
        packingList.getCell('M' + row).font = { size: 11 };
        packingList.getCell('M' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
        setOuterBorder('M' + row + ':P' + row, packingList);
        if (String(containerDetails[i][3]).length > 17) {
            packingList.getRow(row).height = 36;
        }

        packingList.mergeCells('Q' + row + ':U' + row);
        packingList.getCell('Q' + row).value = containerDetails[i][4];
        packingList.getCell('Q' + row).font = { size: 11 };
        packingList.getCell('Q' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('Q' + row + ':U' + row, packingList);

        packingList.mergeCells('V' + row + ':X' + row);
        packingList.getCell('V' + row).value = containerDetails[i][5];
        packingList.getCell('V' + row).numFmt = '0.00'
        packingList.getCell('V' + row).font = { size: 11 };
        packingList.getCell('V' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('V' + row + ':X' + row, packingList);

        packingList.mergeCells('Y' + row + ':AA' + row);
        packingList.getCell('Y' + row).value = containerDetails[i][6];
        packingList.getCell('Y' + row).numFmt = '0.00'
        packingList.getCell('Y' + row).font = { size: 11 };
        packingList.getCell('Y' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('Y' + row + ':AA' + row, packingList);

        row++;

    }

    packingList.mergeCells('A' + row + ':D' + (row + 1));
    // packingList.getCell('A' + row).value = `Nos. of Kind Packages ${packegingType}`;
    packingList.getCell('A' + row).value = {
        formula: `"Nos. of Kind Packages " & SUM(Q${row - containerDetails.length}:Q${row - 1}) & " ${packegingType}"`,
        result: null
    };
    packingList.getCell('A' + row).font = { bold: true };
    packingList.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
    setOuterBorder('A' + row + ':D' + (row + 1), packingList);

    if (totalPallet > 0) {
        packingList.mergeCells('E' + row + ':H' + (row + 1));
        packingList.getCell('E' + row).value = "Total     >>>>>>>>>>";
        packingList.getCell('E' + row).font = { bold: true };
        packingList.getCell('E' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('E' + row + ':H' + (row + 1), packingList);

        packingList.mergeCells('I' + row + ':P' + (row + 1));
        packingList.getCell('I' + row).value = `TOTAL PALLET - ${totalPallet} NOS`;
        packingList.getCell('I' + row).font = { name: 'Arial', bold: true };
        packingList.getCell('I' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('I' + row + ':P' + (row + 1), packingList);
    } else {
        packingList.mergeCells('E' + row + ':P' + (row + 1));
        packingList.getCell('E' + row).value = "Total     >>>>>>>>>>";
        packingList.getCell('E' + row).font = { bold: true };
        packingList.getCell('E' + row).alignment = { horizontal: 'center', vertical: 'middle' };
        setOuterBorder('E' + row + ':P' + (row + 1), packingList);
    }

    packingList.mergeCells('Q' + row + ':U' + (row + 1));
    packingList.getCell('Q' + row).value = { formula: `SUM(Q${row - containerDetails.length}:Q${row - 1})`, result: 0 };
    packingList.getCell('Q' + row).font = { bold: true };
    packingList.getCell('Q' + row).alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('Q' + row + ':U' + (row + 1), packingList);

    packingList.mergeCells('V' + row + ':X' + (row + 1));
    packingList.getCell('V' + row).value = { formula: `SUM(V${row - containerDetails.length}:V${row - 1})`, result: 0 };
    packingList.getCell('V' + row).numFmt = '0.00'
    packingList.getCell('V' + row).font = { bold: true };
    packingList.getCell('V' + row).alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('V' + row + ':X' + (row + 1), packingList);

    packingList.mergeCells('Y' + row + ':AA' + (row + 1));
    packingList.getCell('Y' + row).value = { formula: `SUM(Y${row - containerDetails.length}:Y${row - 1})`, result: 0 };
    packingList.getCell('Y' + row).numFmt = '0.00'
    packingList.getCell('Y' + row).font = { bold: true };
    packingList.getCell('Y' + row).alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('Y' + row + ':AA' + (row + 1), packingList);

    row += 2;

    packingList.mergeCells('A' + row + ':P' + row);
    setOuterBorder('A' + row + ':P' + row, packingList);

    packingList.mergeCells('Q' + row + ':U' + row);
    packingList.getCell('Q' + row).value = packegingType;
    packingList.getCell('Q' + row).font = { bold: true };
    packingList.getCell('Q' + row).alignment = { horizontal: 'center' };
    setOuterBorder('Q' + row + ':U' + row, packingList);

    packingList.mergeCells('V' + row + ':X' + row);
    packingList.getCell('V' + row).value = "KGS";
    packingList.getCell('V' + row).font = { bold: true };
    packingList.getCell('V' + row).alignment = { horizontal: 'center' };
    setOuterBorder('V' + row + ':X' + row, packingList);

    packingList.mergeCells('Y' + row + ':AA' + row);
    packingList.getCell('Y' + row).value = "KGS";
    packingList.getCell('Y' + row).font = { bold: true };
    packingList.getCell('Y' + row).alignment = { horizontal: 'center' };
    setOuterBorder('Y' + row + ':AA' + row, packingList);

    row++;
    packingList.mergeCells('Q' + row + ':AA' + row);
    packingList.getCell('Q' + row).value = "Signature & Date";
    packingList.getCell('Q' + row).font = { bold: true };
    packingList.getCell('Q' + row).alignment = { horizontal: 'right' };

    packingList.mergeCells('Q' + (row + 1) + ':AA' + (row + 1));
    packingList.getCell('Q' + (row + 1)).value = `For, ${companyName}`;
    packingList.getCell('Q' + (row + 1)).font = { bold: true };
    packingList.getCell('Q' + (row + 1)).alignment = { horizontal: 'right' };

    packingList.addImage(signature, {
        tl: { col: 20, row: row }, // X66 (X = col 24 → 24 - 1 = 23 → 22 for 0-based)
        ext: { width: 95, height: 95 }, // adjust size as needed
    });

    packingList.mergeCells('A' + row + ':P' + (row + 4));
    setOuterBorder('A' + row + ':P' + (row + 4), packingList);

    packingList.mergeCells('Q' + (row + 6) + ':AA' + (row + 6));
    packingList.getCell('Q' + (row + 6)).value = "AUTHORISED SIGN.";
    packingList.getCell('Q' + (row + 6)).font = { bold: true };
    packingList.getCell('Q' + (row + 6)).alignment = { horizontal: 'right' };
    setOuterBorder('Q' + row + ':AA' + (row + 6), packingList);

    row += 5;

    packingList.mergeCells('A' + row + ':P' + (row + 1));
    packingList.getCell('A' + row).value = "Declaration:We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
    packingList.getCell('A' + row).font = { bold: true };
    packingList.getCell('A' + row).alignment = { wrapText: true, horizontal: 'left', vertical: 'middle' };
    setOuterBorder('A' + row + ':P' + (row + 1), packingList);
    row++;

    setOuterBorder('A1:AA' + row, packingList, 'medium');

    MAX_WIDTH = 4; // reasonable width ~420px in Excel

    packingList.columns.forEach((column) => {
        let maxLength = 10;

        column.eachCell({ includeEmpty: true }, (cell) => {
            const cellValue = cell.value ? cell.value.toString() : '';
            const lines = cellValue.split('\n');
            const longestLine = Math.max(...lines.map(line => line.length));
            if (longestLine > maxLength) {
                maxLength = longestLine;
            }
        });

        column.width = Math.min(maxLength + 2, MAX_WIDTH); // 👈 LIMIT IT
    });

    setGlobalFontSize(packingList);
    packingList.getColumn(1).width = pixelToExcelWidth(50);
    packingList.getColumn(24).width = pixelToExcelWidth(45);
    packingList.getColumn(25).width = pixelToExcelWidth(45);


















































































    // Create a new workbook
    const annexureWorkbook = new ExcelJS.Workbook();
    const annexure = annexureWorkbook.addWorksheet('ANNEXURE');
    configurePrintSheet(annexure);

    if (signatureUrl) {

        const { buffer, extension, width, height } = await loadImageBuffer(signatureUrl);
        signature = annexureWorkbook.addImage({
            buffer: buffer,
            extension: extension,
        });
        vgnSignatureW = width;
        vgnSignatureH = height;

    }

    annexure.mergeCells('A1:AA1');
    annexure.getCell('A1').value = "ANNEXURE";
    annexure.getCell('A1').font = { bold: true };
    annexure.getCell('A1').alignment = { horizontal: 'center' };

    annexure.mergeCells('A2:AA2');
    annexure.getCell('A2').value = "OFFICE OF THE SUPERITENTNDENT OF GST";
    annexure.getCell('A2').font = { bold: true };
    annexure.getCell('A2').alignment = { horizontal: 'center' };

    annexure.mergeCells('A3:G3');
    annexure.getCell('A3').value = `RANGE: ${range}`;
    annexure.getCell('A3').alignment = { horizontal: 'left' };

    annexure.mergeCells('H3:P3');
    annexure.getCell('H3').value = `DIVISION: ${division}`;
    annexure.getCell('H3').alignment = { horizontal: 'left' };

    annexure.mergeCells('Q3:AA3');
    annexure.getCell('Q3').value = `COMMISSIONERATE: ${commissionerate}`;
    annexure.getCell('Q3').alignment = { horizontal: 'left' };

    annexure.mergeCells('A4:AA4');
    annexure.getCell('A4').value = "EXAMINATION REPORT FOR FACTORY SEALED CONTAINER";
    annexure.getCell('A4').font = { bold: true };
    annexure.getCell('A4').alignment = { horizontal: 'center' };
    setOuterBorder('A1:AA4', annexure);

    annexure.mergeCells('A5:A6');
    annexure.getCell('A5').value = 1;
    // annexure.getCell('A5').font = { bold: true };
    annexure.getCell('A5').alignment = { horizontal: 'right', vertical: 'top' };

    annexure.mergeCells('B5:L6');
    annexure.getCell('B5').value = "NAME OF EXPORTER";
    // annexure.getCell('B5').font = { bold: true };
    annexure.getCell('B5').alignment = { horizontal: 'left', vertical: 'top' };
    setOuterBorder('A5:L6', annexure);

    annexure.mergeCells('M5:AA5');
    annexure.getCell('M5').value = companyName;
    annexure.getCell('M5').font = { bold: true };
    annexure.getCell('M5').alignment = { horizontal: 'left' };
    setOuterBorder('M5:AA5', annexure);

    annexure.mergeCells('M6:AA6');
    annexure.getCell('M6').value = `TAX ID: ${taxid}`;
    annexure.getCell('M6').alignment = { horizontal: 'left' };
    setOuterBorder('M6:AA6', annexure);

    annexure.mergeCells('A7:A10');
    annexure.getCell('A7').value = 2;
    // annexure.getCell('A7').font = { bold: true };
    annexure.getCell('A7').alignment = { horizontal: 'right', vertical: 'top' };

    annexure.mergeCells('B7:L8');
    annexure.getCell('B7').value = "(a) I.E.CODE No.";
    // annexure.getCell('B7').font = { bold: true };
    annexure.getCell('B7').alignment = { horizontal: 'left', vertical: 'top' };

    annexure.mergeCells('B9:L9');
    annexure.getCell('B9').value = "(b) BRANCH CODE No.";
    // annexure.getCell('B9').font = { bold: true };
    annexure.getCell('B9').alignment = { horizontal: 'left', vertical: 'top' };

    annexure.mergeCells('B10:L10');
    annexure.getCell('B10').value = "(c) BIN No.";
    // annexure.getCell('B10').font = { bold: true };
    annexure.getCell('B10').alignment = { horizontal: 'left', vertical: 'top' };
    setOuterBorder('A7:L10', annexure);

    annexure.mergeCells('M7:T7');
    annexure.getCell('M7').value = `I.E. CODE #: ${ieCode}`;
    annexure.getCell('M7').font = { bold: true };
    annexure.getCell('M7').alignment = { horizontal: 'left' };

    annexure.mergeCells('M8:T8');
    annexure.getCell('M8').value = `GSTIN NO. #: ${gstinNo}`;
    annexure.getCell('M8').alignment = { horizontal: 'left' };

    annexure.mergeCells('U7:AA7');
    annexure.getCell('U7').value = `PAN NO. #: ${panNo}`;
    annexure.getCell('U7').alignment = { horizontal: 'left' };

    annexure.mergeCells('U8:AA8');
    annexure.getCell('U8').value = `STATE CODE : ${stateCode}`;
    annexure.getCell('U8').alignment = { horizontal: 'left' };
    setOuterBorder('M7:AA8', annexure);

    annexure.mergeCells('M9:AA9');
    annexure.getCell('M9').value = branchCodeNo;
    annexure.getCell('M9').alignment = { horizontal: 'left' };
    setOuterBorder('M9:AA9', annexure);

    annexure.mergeCells('M10:AA10');
    annexure.getCell('M10').value = binNo;
    annexure.getCell('M10').alignment = { horizontal: 'left' };
    setOuterBorder('M10:AA10', annexure);

    annexure.mergeCells('A11:A16');
    annexure.getCell('A11').value = 3;
    // annexure.getCell('A11').font = { bold: true };
    annexure.getCell('A11').alignment = { horizontal: 'right', vertical: 'top' };

    annexure.mergeCells('B11:L11');
    annexure.getCell('B11').value = "NAME OF THE MANUFACTURER";
    // annexure.getCell('B11').font = { bold: true };
    annexure.getCell('B11').alignment = { horizontal: 'left', vertical: 'top' };

    annexure.mergeCells('B12:L12');
    annexure.getCell('B12').value = "(DIFFERENCE FROM THE EXPORTER)";
    // annexure.getCell('B12').font = { bold: true };
    annexure.getCell('B12').alignment = { horizontal: 'left', vertical: 'top' };

    annexure.mergeCells('B13:L13');
    annexure.getCell('B13').value = "FACTORY ADDRESS";
    // annexure.getCell('B13').font = { bold: true };
    annexure.getCell('B13').alignment = { horizontal: 'left', vertical: 'top' };
    setOuterBorder('A11:L16', annexure);

    annexure.mergeCells('M11:AA11');
    annexure.getCell('M11').value = manufacturer;
    annexure.getCell('M11').font = { bold: true };
    annexure.getCell('M11').alignment = { horizontal: 'left' };

    annexure.mergeCells('M12:AA15');
    annexure.getCell('M12').value = manufacturerAddress;
    annexure.getCell('M12').alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };

    annexure.mergeCells('M16:AA16');
    annexure.getCell('M16').value = `GST:  ${manufacturerGST}`;
    annexure.getCell('M16').alignment = { horizontal: 'left' };
    setOuterBorder('M11:AA16', annexure);

    annexure.getCell('A17').value = 4;
    // annexure.getCell('A17').font = { bold: true };
    annexure.getCell('A17').alignment = { horizontal: 'right' };

    annexure.mergeCells('B17:L17');
    annexure.getCell('B17').value = "DATE OF EXAMINATION";
    // annexure.getCell('B17').font = { bold: true };
    annexure.getCell('B17').alignment = { horizontal: 'left' };
    setOuterBorder('A17:L17', annexure);

    annexure.mergeCells('M17:AA17');
    annexure.getCell('M17').value = `Dt. ${invoiceDate}`;
    annexure.getCell('M17').font = { bold: true };
    annexure.getCell('M17').alignment = { horizontal: 'left' };
    setOuterBorder('M17:AA17', annexure);

    annexure.mergeCells('A18:A19');
    annexure.getCell('A18').value = 5;
    // annexure.getCell('A18').font = { bold: true };
    annexure.getCell('A18').alignment = { horizontal: 'right', vertical: 'top' };

    annexure.mergeCells('B18:L18');
    annexure.getCell('B18').value = "NAME AND DESIGNATION OF THE EXAMINING";
    // annexure.getCell('B18').font = { bold: true };
    annexure.getCell('B18').alignment = { horizontal: 'left', vertical: 'top' };

    annexure.mergeCells('B19:L19');
    annexure.getCell('B19').value = "OFFICER / INSPECTOR / EO / PO";
    // annexure.getCell('B19').font = { bold: true };
    annexure.getCell('B19').alignment = { horizontal: 'left', vertical: 'top' };
    setOuterBorder('A18:L19', annexure);

    annexure.mergeCells('M18:AA18');
    annexure.getCell('M18').value = ann5;
    annexure.getCell('M18').font = { bold: true };
    annexure.getCell('M18').alignment = { horizontal: 'left' };
    setOuterBorder('M18:AA18', annexure);

    annexure.mergeCells('M19:AA19');
    setOuterBorder('M19:AA19', annexure);

    annexure.mergeCells('A20:A21');
    annexure.getCell('A20').value = 6;
    // annexure.getCell('A20').font = { bold: true };
    annexure.getCell('A20').alignment = { horizontal: 'right', vertical: 'top' };

    annexure.mergeCells('B20:L20');
    annexure.getCell('B20').value = "NAME AND DESIGNATION OF THE EXAMINING";
    // annexure.getCell('B20').font = { bold: true };
    annexure.getCell('B20').alignment = { horizontal: 'left', vertical: 'top' };

    annexure.mergeCells('B21:L21');
    annexure.getCell('B21').value = "OFFICER / APPRAISER / SUPERINTENDENT ";
    // annexure.getCell('B21').font = { bold: true };
    annexure.getCell('B21').alignment = { horizontal: 'left', vertical: 'top' };
    setOuterBorder('A20:L21', annexure);

    annexure.mergeCells('M20:AA20');
    annexure.getCell('M20').value = ann6;
    annexure.getCell('M20').font = { bold: true };
    annexure.getCell('M20').alignment = { horizontal: 'left' };
    setOuterBorder('M20:AA20', annexure);

    annexure.mergeCells('M21:AA21');
    setOuterBorder('M21:AA21', annexure);

    annexure.mergeCells('A22:A23');
    annexure.getCell('A22').value = 7;
    // annexure.getCell('A22').font = { bold: true };
    annexure.getCell('A22').alignment = { horizontal: 'right', vertical: 'top' };

    annexure.mergeCells('B22:L22');
    annexure.getCell('B22').value = "(a) NAME OF COMMISERATE / DIVISION / RANGE";
    // annexure.getCell('B22').font = { bold: true };
    annexure.getCell('B22').alignment = { horizontal: 'left', vertical: 'top' };

    annexure.mergeCells('B23:L23');
    annexure.getCell('B23').value = "(b) LOCATION CODEO";
    // annexure.getCell('B23').font = { bold: true };
    annexure.getCell('B23').alignment = { horizontal: 'left', vertical: 'top' };
    setOuterBorder('A22:L23', annexure);

    annexure.mergeCells('M22:AA22');
    annexure.getCell('M22').value = `${commissionerate} /${division} / ${range}`;
    annexure.getCell('M22').font = { bold: true };
    annexure.getCell('M22').alignment = { horizontal: 'left' };
    setOuterBorder('M22:AA22', annexure);

    annexure.mergeCells('M23:AA23');
    annexure.getCell('M23').value = locationCode;
    annexure.getCell('M23').font = { bold: true };
    annexure.getCell('M23').alignment = { horizontal: 'left' };
    setOuterBorder('M23:AA23', annexure);

    annexure.mergeCells('A24:A30');
    annexure.getCell('A24').value = 8;
    // annexure.getCell('A24').font = { bold: true };
    annexure.getCell('A24').alignment = { horizontal: 'right', vertical: 'top' };

    annexure.mergeCells('B24:L24');
    annexure.getCell('B24').value = "PARTICULARS OF EXPORT INVOICE";
    // annexure.getCell('B24').font = { bold: true };
    annexure.getCell('B24').alignment = { horizontal: 'left' };

    annexure.mergeCells('B25:L25');
    annexure.getCell('B25').value = "(a) EXPORT INVOICE No";
    // annexure.getCell('B25').font = { bold: true };
    annexure.getCell('B25').alignment = { horizontal: 'left' };

    annexure.mergeCells('B26:L26');
    annexure.getCell('B26').value = "(b) TOTAL No. OF PACKAGES";
    // annexure.getCell('B26').font = { bold: true };
    annexure.getCell('B26').alignment = { horizontal: 'left' };

    annexure.mergeCells('B27:L27');
    annexure.getCell('B27').value = "(c) NAME AND ADDRESS OF THE CONSIGNEE";
    // annexure.getCell('B27').font = { bold: true };
    annexure.getCell('B27').alignment = { horizontal: 'left' };
    setOuterBorder('A24:L30', annexure);

    annexure.mergeCells('M24:AA24');
    setOuterBorder('M24:AA24', annexure);

    annexure.mergeCells('M25:AA25');
    annexure.getCell('M25').value = `${invoiceNo}  Dt.${invoiceDate}`;
    annexure.getCell('M25').font = { bold: true };
    annexure.getCell('M25').alignment = { horizontal: 'left' };
    setOuterBorder('M25:AA25', annexure);

    annexure.mergeCells('M26:AA26');
    annexure.getCell('M26').value = `${noOfPackages} ${packegingType}`;
    annexure.getCell('M26').font = { bold: true };
    annexure.getCell('M26').alignment = { horizontal: 'left' };
    setOuterBorder('M26:AA26', annexure);

    annexure.mergeCells('M27:AA30');
    annexure.getCell('M27').value = `${consignee}\n${finalDestination}`;
    annexure.getCell('M27').font = { bold: true };
    annexure.getCell('M27').alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };
    setOuterBorder('M27:AA30', annexure);


    annexure.mergeCells('A31:A33');
    annexure.getCell('A31').value = 9;
    // annexure.getCell('A31').font = { bold: true };
    annexure.getCell('A31').alignment = { horizontal: 'right', vertical: 'top' };

    annexure.mergeCells('B31:V31');
    annexure.getCell('B31').value = "(a) IS THE DESCRIPTION OF THE GOODS THE QUANTITY AND THERE VALUE AS PER PARTICULARS FURNISHED IN THE EXPORT INVOICE";
    // annexure.getCell('B31').font = { bold: true };
    annexure.getCell('B31').alignment = { horizontal: 'left' };

    annexure.mergeCells('B32:V32');
    annexure.getCell('B32').value = "(b) WHETHER SAMPLES IS DRAWN FOR BEING FORWARDED TO PORT OF EXPORT";
    // annexure.getCell('B32').font = { bold: true };
    annexure.getCell('B32').alignment = { horizontal: 'left' };

    annexure.mergeCells('B33:V33');
    annexure.getCell('B33').value = "(c) IF YES THE No. OF THE SEAL OF THE PACKAGE CONTAINING THE SAMPLE ";
    // annexure.getCell('B33').font = { bold: true };
    annexure.getCell('B33').alignment = { horizontal: 'left' };
    setOuterBorder('A31:V33', annexure);

    annexure.mergeCells('W31:AA31');
    annexure.getCell('W31').value = ann9a;
    annexure.getCell('W31').font = { bold: true };
    annexure.getCell('W31').alignment = { horizontal: 'left' };
    setOuterBorder('W31:AA31', annexure);

    annexure.mergeCells('W32:AA32');
    annexure.getCell('W32').value = ann9b;
    annexure.getCell('W32').font = { bold: true };
    annexure.getCell('W32').alignment = { horizontal: 'left' };
    setOuterBorder('W32:AA32', annexure);

    annexure.mergeCells('W33:AA33');
    annexure.getCell('W33').value = ann9c;
    annexure.getCell('W33').font = { bold: true };
    annexure.getCell('W33').alignment = { horizontal: 'left' };
    setOuterBorder('W33:AA33', annexure);

    annexure.mergeCells('A34:A36');
    annexure.getCell('A34').value = 10;
    // annexure.getCell('A34').font = { bold: true };
    annexure.getCell('A34').alignment = { horizontal: 'right', vertical: 'top' };

    annexure.mergeCells('B34:V34');
    annexure.getCell('B34').value = "CENTRAL EXCISE / CUSTOM SEAL No.";
    // annexure.getCell('B34').font = { bold: true };
    annexure.getCell('B34').alignment = { horizontal: 'left' };

    annexure.mergeCells('B35:V35');
    annexure.getCell('B35').value = "(a) FOR NON CONTAINERIZED CARGO No.OF PACKAGES";
    // annexure.getCell('B35').font = { bold: true };
    annexure.getCell('B35').alignment = { horizontal: 'left' };

    annexure.mergeCells('B36:V36');
    annexure.getCell('B36').value = "(b) FOR CONTAINERAISED CARGO";
    // annexure.getCell('B36').font = { bold: true };
    annexure.getCell('B36').alignment = { horizontal: 'left' };
    setOuterBorder('A34:V36', annexure);

    annexure.mergeCells('W34:AA34');
    annexure.getCell('W34').alignment = { horizontal: 'left' };
    setOuterBorder('W34:AA34', annexure);

    annexure.mergeCells('W35:AA35');
    annexure.getCell('W35').value = ann10a;
    annexure.getCell('W35').font = { bold: true };
    annexure.getCell('W35').alignment = { horizontal: 'left' };
    setOuterBorder('W35:AA35', annexure);

    annexure.mergeCells('W36:AA36');
    annexure.getCell('W36').value = ann10b;
    annexure.getCell('W36').font = { bold: true };
    annexure.getCell('W36').alignment = { horizontal: 'left' };
    setOuterBorder('W36:AA36', annexure);

    annexure.mergeCells('A37:B38');
    annexure.getCell('A37').value = "Sr. No.";
    annexure.getCell('A37').font = { bold: true };
    annexure.getCell('A37').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('A37:B38', annexure);

    annexure.mergeCells('C37:G38');
    annexure.getCell('C37').value = "CONTAINER NO.";
    annexure.getCell('C37').font = { bold: true };
    annexure.getCell('C37').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('C37:G38', annexure);

    annexure.mergeCells('H37:N38');
    annexure.getCell('H37').value = "LINE SEAL NO.";
    annexure.getCell('H37').font = { bold: true };
    annexure.getCell('H37').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('H37:N38', annexure);

    annexure.mergeCells('O37:S38');
    annexure.getCell('O37').value = "RFID SEAL";
    annexure.getCell('O37').font = { bold: true };
    annexure.getCell('O37').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('O37:S38', annexure);

    annexure.mergeCells('T37:V38');
    annexure.getCell('T37').value = "SIZE";
    annexure.getCell('T37').font = { bold: true };
    annexure.getCell('T37').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('T37:V38', annexure);

    annexure.mergeCells('W37:AA38');
    annexure.getCell('W37').value = "NO OF PACKAGES";
    annexure.getCell('W37').font = { bold: true };
    annexure.getCell('W37').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('W37:AA38', annexure);

    row = 39;

    for (let i = 0; i < containerDetails.length; i++) {
        annexure.mergeCells('A' + row + ':B' + row);
        annexure.getCell('A' + row).value = i + 1;
        annexure.getCell('A' + row).alignment = { horizontal: 'center' };
        setOuterBorder('A' + row + ':B' + row, annexure);

        annexure.mergeCells('C' + row + ':G' + row);
        annexure.getCell('C' + row).value = containerDetails[i][0];
        annexure.getCell('C' + row).alignment = { horizontal: 'center' };
        setOuterBorder('C' + row + ':G' + row, annexure);

        annexure.mergeCells('H' + row + ':N' + row);
        annexure.getCell('H' + row).value = containerDetails[i][1];
        annexure.getCell('H' + row).alignment = { horizontal: 'center' };
        setOuterBorder('H' + row + ':N' + row, annexure);

        annexure.mergeCells('O' + row + ':S' + row);
        annexure.getCell('O' + row).value = containerDetails[i][2];;
        annexure.getCell('O' + row).alignment = { horizontal: 'center' };
        setOuterBorder('O' + row + ':S' + row, annexure);

        annexure.mergeCells('T' + row + ':V' + row);
        annexure.getCell('T' + row).value = containerDetails[i][7];
        annexure.getCell('T' + row).alignment = { horizontal: 'center' };
        setOuterBorder('T' + row + ':V' + row, annexure);

        annexure.mergeCells('W' + row + ':AA' + row);
        annexure.getCell('W' + row).value = `${containerDetails[i][4]} ${packegingType}`;
        annexure.getCell('W' + row).alignment = { horizontal: 'center' };
        setOuterBorder('W' + row + ':AA' + row, annexure);

        row++;
    }

    let startRow = row;

    row += 4;

    annexure.getCell('A' + row).value = 11;
    annexure.getCell('A' + row).font = { bold: true };
    annexure.getCell('A' + row).alignment = { horizontal: 'right' };

    annexure.mergeCells('B' + row + ':E' + row);
    annexure.getCell('B' + row).value = "S.S. PERMISSION No.";
    annexure.getCell('B' + row).font = { bold: true };
    annexure.getCell('B' + row).alignment = { horizontal: 'left' };

    annexure.mergeCells('F' + row + ':AA' + (row + 1));
    annexure.getCell('F' + row).value = ssPermissionNo;
    annexure.getCell('F' + row).font = { color: { argb: 'FFFF0000' }, bold: true, size: 11 };
    annexure.getCell('F' + row).alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };
    row += 2;

    // annexure.mergeCells('F' + row + ':AA' + row);
    // annexure.getCell('F' + row).value = issuedBy;
    // annexure.getCell('F' + row).font = { color: { argb: 'FFFF0000' }, bold: true };
    // annexure.getCell('F' + row).alignment = { horizontal: 'left' };
    // row++;

    annexure.getCell('A' + row).value = 12;
    annexure.getCell('A' + row).font = { bold: true };
    annexure.getCell('A' + row).alignment = { horizontal: 'right' };

    annexure.mergeCells('B' + row + ':AA' + row);
    annexure.getCell('B' + row).value = gstCirculerNumber;
    annexure.getCell('B' + row).font = { italic: true };
    annexure.getCell('B' + row).alignment = { horizontal: 'left' };
    row++;

    annexure.mergeCells('A' + row + ':A' + (row + 1));
    annexure.getCell('A' + row).value = 13;
    annexure.getCell('A' + row).font = { bold: true };
    annexure.getCell('A' + row).alignment = { horizontal: 'right', vertical: 'top' };

    annexure.mergeCells('B' + row + ':AA' + (row + 1));
    if (taxStatus === "without") {
        annexure.getCell('B' + row).value = `LETTER OF UNDERTAKING NO.ACKNOWLEDGMENT FOR LUT  APPLICATION REFERENCE NUMBER (ARN) ${arn}\nDT:${lutDate}`;
    } else {
        annexure.getCell('B' + row).value = `SUPPLY MEANT FOR EXPORT ON PAYMENT OF IGST UNDER CLAIM OF REFUND RS. TOTAL : ${gstValue}\n(TAXABLE ${termsOfDelivery} INR VALUE ${totalInINR}@ 18%)                                                                            ${gstValue}  `;
    }
    annexure.getCell('B' + row).font = { italic: true };
    annexure.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };
    row += 2;

    annexure.mergeCells('A' + row + ':AA' + (row + 1));
    annexure.getCell('A' + row).value = `EXAMINED THE EXPORT GOODS COVERED UNDER THIS INVOICE ,DESCRIPTION OF THE GOODS WITH REFERENCE TO DBK & MEIS SCHEME & NET WAIGHT OF ALL ${allProductsType} ARE AS UNDER`;
    annexure.getCell('A' + row).alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };
    row += 2;

    annexure.mergeCells('A' + row + ':AA' + row);
    annexure.getCell('A' + row).value = `EXPORT UNDER SELF SEALING UNDER Circular No. ${selfSealingCircularNo} Dated : ${selfSealingCircularNoDate}`;
    annexure.getCell('A' + row).font = { bold: true, underline: true };
    annexure.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' };
    row++;

    annexure.mergeCells('A' + row + ':AA' + (row + 1));
    annexure.getCell('A' + row).value = "Certified that the description and value of the goods coverd by this invoice have been checked by me and the goods have been packed and sealed with lead seal one time lock seal checked by me and the goods have been packed and sealed with lead seal/ one time lock seal.";
    annexure.getCell('A' + row).alignment = { wrapText: true, horizontal: 'left' };
    row += 3;

    annexure.mergeCells('A' + row + ':E' + row);
    annexure.getCell('A' + row).value = `For, ${companyName}`;
    annexure.getCell('A' + row).font = { bold: true };
    annexure.getCell('A' + row).alignment = { horizontal: 'left' };

    annexure.addImage(signature, {
        tl: { col: 3, row: (row - 1) }, // X66 (X = col 24 → 24 - 1 = 23 → 22 for 0-based)
        ext: { width: 100, height: 100 }, // adjust size as needed
    });

    annexure.mergeCells('O' + row + ':AA' + row);
    annexure.getCell('O' + row).value = `NET WEIGHT: ${netWeight} KGS        GROSS WEIGHT: ${grossWeight} KGS`;
    // annexure.getCell('O' + row).fill = {
    //     type: 'pattern',
    //     pattern: 'solid',
    //     fgColor: { argb: 'FFFFFF00' },
    // };
    annexure.getCell('O' + row).font = { bold: true };
    annexure.getCell('O' + row).alignment = { horizontal: 'left' };
    row += 4;

    annexure.mergeCells('A' + row + ':D' + row);
    annexure.getCell('A' + row).value = "AUTHORISED SIGN.";
    annexure.getCell('A' + row).font = { bold: true };
    annexure.getCell('A' + row).alignment = { horizontal: 'left' };
    row++;

    annexure.mergeCells('A' + row + ':E' + row);
    annexure.getCell('A' + row).value = "SIGNATURE OF EXPORTER";
    annexure.getCell('A' + row).alignment = { horizontal: 'left' };

    setOuterBorder('A' + startRow + ':AA' + row, annexure);

    MAX_WIDTH = 4;

    annexure.columns.forEach((column) => {
        let maxLength = 10;

        column.eachCell({ includeEmpty: true }, (cell) => {
            const cellValue = cell.value ? cell.value.toString() : '';
            const lines = cellValue.split('\n');
            const longestLine = Math.max(...lines.map(line => line.length));
            if (longestLine > maxLength) {
                maxLength = longestLine;
            }
        });

        column.width = Math.min(maxLength + 2, MAX_WIDTH); // 👈 LIMIT IT
    });

    for (let i = 1; i <= 12; i++) {
        annexure.getColumn(i).width = pixelToExcelWidth(50);
    }

    setGlobalFontSize(annexure);




















































































    const vgnWorkbook = new ExcelJS.Workbook();
    const vgn = vgnWorkbook.addWorksheet('VGM');

    if (signatureUrl) {

        const { buffer, extension, width, height } = await loadImageBuffer(signatureUrl);
        signature = vgnWorkbook.addImage({
            buffer: buffer,
            extension: extension,
        });
        vgnSignatureW = width;
        vgnSignatureH = height;

    }

    // response = await fetch('/vgnHeader.png'); // <-- relative to `public/`
    // arrayBuf = await response.arrayBuffer();

    // Add vgnHeader
    if (headerUrl) {

        const { buffer, extension, width, height } = await loadImageBuffer(headerUrl);
        vgnHeader = vgnWorkbook.addImage({
            buffer: buffer,
            extension: extension,
        });
        vgnHeaderW = width;
        vgnHeaderH = height;
    }

    // response = await fetch('/vgnFooter.png'); // <-- relative to `public/`
    // arrayBuf = await response.arrayBuffer();

    // Add vgnHeader


    if (footerUrl) {

        const { buffer, extension, width, height } = await loadImageBuffer(footerUrl);
        vgnFooter = vgnWorkbook.addImage({
            buffer: buffer,
            extension: extension,
        });
        vgnFooterW = width;
        vgnFooterH = height;
    }

    // const vgnHeaderH = 216; // height in pixels (example)
    const estimatedRowsUsed = Math.ceil(vgnHeaderH / 20); // Convert px to row count
    row = Math.max(7, estimatedRowsUsed + 1); // Ensure at least row 7
    // row = 7;

    vgn.addImage(vgnHeader, {
        tl: { col: 0, row: 0 }, // X66 (X = col 24 → 24 - 1 = 23 → 22 for 0-based)
        ext: { width: vgnHeaderW, height: vgnHeaderH }, // adjust size as needed 116
    });

    vgn.mergeCells('A' + row + ':K' + row);
    vgn.getCell('A' + row).value = "INFORMATION ABOUT VERIFIED GROSS MASS OF CONTAINER";
    vgn.getCell('A' + row).font = { bold: true, underline: true, size: 14 };
    vgn.getCell('A' + row).alignment = { horizontal: 'center' }
    row++;

    vgn.getCell('A' + row).value = "SR. NO.";
    vgn.getCell('A' + row).font = { bold: true };
    vgn.getCell('A' + row).alignment = { horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Details of information";
    vgn.getCell('B' + row).font = { bold: true };
    vgn.getCell('B' + row).alignment = { horizontal: 'center' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = "Particulars";
    vgn.getCell('G' + row).font = { bold: true };
    vgn.getCell('G' + row).alignment = { horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 1;
    vgn.getCell('A' + row).alignment = { horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Name of the shipper";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = companyName;
    vgn.getCell('G' + row).font = { color: { argb: 'FFFF0000' } }
    vgn.getCell('G' + row).alignment = { horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 2;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Shipper Registration /License no.( IEC No/CIN No)**";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = `I.E. CODE #: ${ieCode}`;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 3;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Name and designation of official of the shipper authorizedto sign document";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = nameOfOfficial;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 4;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "24 x 7 contact details of authorised official of shipper";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = Number(numberOfOfficial);
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 5;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Container No.";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = vgn5;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 6;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Container Size ( TEU/FEU/other) ";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = `${containerSize}'`;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.mergeCells('A' + row + ':A' + (row + 1));
    vgn.getCell('A' + row).value = 7;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'top' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + (row + 1));
    vgn.getCell('B' + row).value = "Maximum permissible weight of container as per the CSC plate";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + (row + 1), vgn);

    vgn.mergeCells('G' + row + ':K' + (row + 1));
    vgn.getCell('G' + row).value = vgn7;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'top' }
    setOuterBorder('G' + row + ':K' + (row + 1), vgn);

    // vgn.getRow(row).height = 34;
    row += 2;

    vgn.getCell('A' + row).value = 8;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Weighbridge registration no. & Address of Weighbridge";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = vgn8;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 9;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Verified gross mass of container (method-1/method-2)";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = vgn9;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 10;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Unit of measure (KG / MT/ LBS)";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = unitOfMeasure;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 11;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Date and time of weighing";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = `Dt.${invoiceDate}`;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 12;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Weighing slip no.";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = vgn12;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 13;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "Type (Normal/Reefer/Hazardous/others)";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = vgn13;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row++;

    vgn.getCell('A' + row).value = 14;
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center' }
    vgn.getCell('A' + row).border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },     // black
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    vgn.mergeCells('B' + row + ':F' + row);
    vgn.getCell('B' + row).value = "If Hazardous  UN NO.IMDG class";
    vgn.getCell('B' + row).alignment = { wrapText: true, horizontal: 'left' }
    setOuterBorder('B' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + row);
    vgn.getCell('G' + row).value = vgn14;
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row += 2;

    vgn.mergeCells('C' + row + ':F' + row);
    vgn.getCell('C' + row).value = "Signature of authorised person of shipper";
    vgn.getCell('C' + row).alignment = { wrapText: true, horizontal: 'left' }

    vgn.mergeCells('H' + row + ':I' + row);
    vgn.getCell('H' + row).value = `For, ${companyName}`;
    vgn.getCell('H' + row).alignment = { wrapText: true, horizontal: 'left' }

    vgn.addImage(signature, {
        tl: { col: 9, row: (row - 1) }, // X66 (X = col 24 → 24 - 1 = 23 → 22 for 0-based)
        ext: { width: 100, height: 100 }, // adjust size as needed
    });
    row++;

    vgn.getCell('C' + row).value = `NAME:`;
    vgn.getCell('C' + row).alignment = { wrapText: true, horizontal: 'left' }

    vgn.mergeCells('D' + row + ':F' + row);
    vgn.getCell('D' + row).value = nameOfOfficial;
    vgn.getCell('D' + row).alignment = { wrapText: true, horizontal: 'left' }
    row++;

    vgn.getCell('C' + row).value = `DATE:`;
    vgn.getCell('C' + row).alignment = { wrapText: true, horizontal: 'left' }

    vgn.mergeCells('D' + row + ':F' + row);
    vgn.getCell('D' + row).value = invoiceDate;
    vgn.getCell('D' + row).alignment = { wrapText: true, horizontal: 'left' }
    row += 2;

    vgn.mergeCells('H' + row + ':K' + row);
    vgn.getCell('H' + row).value = "AUTHORISED SIGNATURE";
    vgn.getCell('H' + row).alignment = { wrapText: true, horizontal: 'left' }
    row += 2;

    vgn.mergeCells('A' + row + ':C' + (row + 1));
    vgn.getCell('A' + row).value = "BOOKING NO.";
    vgn.getCell('A' + row).font = { bold: true }
    vgn.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' }
    setOuterBorder('A' + row + ':C' + row, vgn);

    vgn.mergeCells('D' + row + ':F' + (row + 1));
    vgn.getCell('D' + row).value = "CONTAINER NUMBER";
    vgn.getCell('D' + row).font = { bold: true }
    vgn.getCell('D' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' }
    setOuterBorder('D' + row + ':F' + row, vgn);

    vgn.mergeCells('G' + row + ':K' + (row + 1));
    vgn.getCell('G' + row).value = "VGN (KGS)\n(CARGO + TARE WEIGHT)";
    vgn.getCell('G' + row).font = { bold: true }
    vgn.getCell('G' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' }
    setOuterBorder('G' + row + ':K' + row, vgn);
    row += 2;

    for (let i = 0; i < containerDetails.length; i++) {
        vgn.mergeCells('A' + row + ':C' + row);
        vgn.getCell('A' + row).value = containerDetails[i][8];
        vgn.getCell('A' + row).alignment = { horizontal: 'center' }
        setOuterBorder('A' + row + ':C' + row, vgn);

        vgn.mergeCells('D' + row + ':F' + row);
        vgn.getCell('D' + row).value = containerDetails[i][0];
        vgn.getCell('D' + row).alignment = { horizontal: 'center' }
        setOuterBorder('D' + row + ':F' + row, vgn);

        vgn.getCell('G' + row).value = containerDetails[i][6];
        vgn.getCell('G' + row).numFmt = '0.00';
        // vgn.getCell('G' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };
        vgn.getCell('G' + row).alignment = { horizontal: 'center' }

        vgn.getCell('H' + row).value = "+";
        // vgn.getCell('H' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };
        vgn.getCell('H' + row).alignment = { horizontal: 'center' }

        vgn.getCell('I' + row).value = containerDetails[i][9];
        vgn.getCell('I' + row).numFmt = '0.00';
        // vgn.getCell('I' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };
        vgn.getCell('I' + row).alignment = { horizontal: 'center' }

        vgn.getCell('J' + row).value = "=";
        // vgn.getCell('J' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };
        vgn.getCell('J' + row).alignment = { horizontal: 'center' }

        vgn.getCell('K' + row).value = { formula: `G${row}+I${row}`, result: 0 };
        vgn.getCell('K' + row).numFmt = '0.00';
        // vgn.getCell('K' + row).fill = {
        //     type: 'pattern',
        //     pattern: 'solid',
        //     fgColor: { argb: 'FFFFFF00' },
        // };
        vgn.getCell('K' + row).alignment = { horizontal: 'center' }

        setOuterBorder('G' + row + ':K' + row, vgn);

        row++;
    }

    vgn.addImage(vgnFooter, {
        tl: { col: 0, row: (row + 1) }, // X66 (X = col 24 → 24 - 1 = 23 → 22 for 0-based)
        ext: { width: vgnFooterW, height: vgnFooterH }, // adjust size as needed
    });

    vgn.pageSetup.fitToPage = true;

    MAX_WIDTH = 8.4;

    vgn.columns.forEach((column) => {
        let maxLength = 10;

        column.eachCell({ includeEmpty: true }, (cell) => {
            const cellValue = cell.value ? cell.value.toString() : '';
            const lines = cellValue.split('\n');
            const longestLine = Math.max(...lines.map(line => line.length));
            if (longestLine > maxLength) {
                maxLength = longestLine;
            }
        });

        column.width = Math.min(maxLength + 2, MAX_WIDTH); // 👈 LIMIT IT
    });

    vgn.getColumn(6).width = pixelToExcelWidth(80);

    setGlobalFontSize(vgn);











    // ✅ Save File
    let fileName = "";
    if (containerType === "FCL") {
        fileName = `${invoiceNo.split("/")[1]} - ${finalDestination} - ${marksAndNos}ft.xlsx`;
    } else {
        fileName = `${invoiceNo.split("/")[1]} - ${finalDestination} - ${containerType}.xlsx`;
    }

    let allBuffers = [];
    const bufferCustomInvoice = await workbook.xlsx.writeBuffer();
    allBuffers.push({ buffer: bufferCustomInvoice, fileName: `CUSTOM_INVOICE.xlsx` });

    if (termsOfDeliveryMain !== "FOB") {
        const bufferWorksheetCopy = await customInvoiceCopyWorkbook.xlsx.writeBuffer();
        allBuffers.push({ buffer: bufferWorksheetCopy, fileName: `WORKSHEET_COPY.xlsx` });
    }

    const bufferPackingList = await packingListWorkbook.xlsx.writeBuffer();
    allBuffers.push({ buffer: bufferPackingList, fileName: `PACKING_LIST.xlsx` });

    const bufferAnnexure = await annexureWorkbook.xlsx.writeBuffer();
    allBuffers.push({ buffer: bufferAnnexure, fileName: `ANNEXURE.xlsx` });

    const bufferVgn = await vgnWorkbook.xlsx.writeBuffer();
    allBuffers.push({ buffer: bufferVgn, fileName: `VGM.xlsx` });



    //   const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    //   saveAs(blob, fileName);


    console.log('✅ Excel file prepared for download');
    return { allBuffers, fileName };
};
