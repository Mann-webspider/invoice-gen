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
    const baseUrl = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}/api` || "";
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
  let companyName = data.exporter.company_name || "COMPANY NAME";
  let companyAddress = data.exporter.company_address || `SECOND FLOOR, OFFICE NO 7,\nISHAN CERAMIC ZONE WING D,\nLALPAR, MORBI,\nGujarat, 363642\nINDIA`;
  let email = data.exporter.email || "ABC@GMAIL.COM";
  let taxid = data.exporter.tax_id || "A1234567888";
  let ieCode = data.exporter.ie_code || "SED456789";
  let panNo = data.exporter.pan_number || "123456789";
  let gstinNo = data.exporter.gstin_number || "123456789";
  let stateCode = data.exporter.state_code || 24;
  let invoiceNo = data.invoice_number || "3S4D5F6G7H8";
  let invoiceDate = data.invoice_date || "26-04-2025";
  // invoiceDate = normalizeDateSeparator(invoiceDate, '.');
  let [year, month, day] = invoiceDate.split('/');
  invoiceDate = `${year}.${month}.${day}`;
  let buyersOrderNo = data.buyer.order_number || "123456789";
  let buyersOrderDate = data.buyer.order_date || "26-04-2025";
  let poNo = data.buyer.po_number || "";
  let consignee = data.buyer.consignee || "XYZ";
  let notifyParty = data.buyer.notify_party || ["ABC", "DEF", "GHI"];
  let preCarriage = data.shipping.pre_carriage || "";
  let vassalFlightNo = data.shipping.vessel_flight_no || "";
  let placeOfReceipt = data.shipping.place_of_receipt || "MORBI";
  let portOfLoading = data.shipping.port_of_loading || "MUNDRA";
  let portOfDischarge = data.shipping.port_of_discharge || "NY";
  let finalDestination = data.shipping.final_destination || "USA";
  let countryOfOrigin = data.shipping.country_of_origin || "INDIA";
  let origin = data.shipping.origin_details || "DISTRICT MORBI, STATE GUJARAT";
  let termsOfDelivery = data.payment_term || "FOB";
  let paymentTerms = data.shipping.payment || "PAYMENT: ....";
  let shippingMethod = data.shipping.shipping_method || "THROUGH SEA";
  let currency = data.currancy_type || "EURO";
  let currencyRate = data.currancy_rate || 88.95;
  let cuntainerType = data.product_details.nos || "FCL";
  let marksAndNos = data.product_details.marks || "10 x 20'";

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
  let packageInfo = data.package.number_of_package || 14000;
  let [totalPackages, unitOfIt] = packageInfo.split(' ');

  let noOfPackages = totalPackages;
  let grossWeight = data.package.total_gross_weight || 14000;
  let netWeight = data.package.total_net_weight || 14000;
  let totalSQM = data.package.total_sqm || 0;
  let fOBEuro = data.package.total_amount || 232352.00;
  let insurance = data.product_details.insurance || 1000.00;
  let freight = data.product_details.frieght || 1000.00;
  let totalFOBEuro = data.package.total_amount || 234352.00;
  let amountInWords = data.package.amount_in_words || "TWENTY THREE THOUSAND TWO HUNDRED AND THIRTY TWO ONLY";
  let gstCirculerNumber = data.package.gst_circular || "**/20**";
  // let customDate = data.invoice_date || "26-04-2025";
  let arn = data.package.app_ref_number || "KS3525252J32";
  let lutDate = data.package.lut_date || "26-04-2025";
  [year, month, day] = lutDate.split('-');
  lutDate = `${day}/${month}/${year}`;
  let totalInINR = data.package.taxable_value || 2646246.46;

  let gstValue = data.package.gst_amount || "44262423";   // New value // mann patel
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
  let totalPallet = data.product_details.total_pallet_count || 0;

  // Annexure
  let range = data.annexure.range || "MORBI";
  let division = data.annexure.division || "MORBI II";
  let commissionerate = data.annexure.commissionerate || "RAJKOT";
  let branchCodeNo = "";
  let binNo = "";
  let manufacturer = data.annexure.manufacturer_name || "... PVT. LTD.";
  let manufacturerAddress = data.annexure.manufacturer_address || "ADDRESS";
  let manufacturerGST = data.annexure.gstin_no || "5678J9U887Y8Y8Y";
  let ann5 = data.annexure.officer_designation1 || "SELF SEALING";
  let ann6 = data.annexure.officer_designation2 || "SELF SEALING";
  let ann9a = data.annexure.question9a || "YES";
  let ann9b = data.annexure.question9b || "NO";
  let ann9c = data.annexure.question9c || "N/A";
  let ann10a = data.annexure.non_containerized || "SELF SEALING";
  let ann10b = data.annexure.containerized || "SELF SEALING";
  let locationCode = data.annexure.location_code || "";
  let ssPermissionNo = data.annexure.manufacturer_permission || "*****************************************************************************************************";
  // let issuedBy = "*******************************************************************************************";
  let selfSealingCircularNo = "59/2010" // new values
  let selfSealingCircularNoDate = "23.12.2010" // new values

  //vgn
  let nameOfOfficial = data.vgm.authorized_name || "";
  let numberOfOfficial = data.vgm.authorized_contact || "";
  let vgn5 = data.vgm.container_number || "AS PER ANNEXURE";
  let containerSize = data.vgm.container_size || "20'";
  let vgn7 = data.vgm.permissible_weight || "AS PER ANNEXURE";
  let vgn8 = data.vgm.weighbridge_registration || "AS PER ANNEXURE";
  let vgn9 = data.vgm.verified_gross_mass || "method-1";
  let unitOfMeasure = data.vgm.unit_of_measurement || "kg";
  let vgn12 = data.vgm.weighing_slip_no || "AS PER ANNEXURE";
  let vgn13 = data.vgm.type || "NORMAL";
  let vgn14 = data.vgm.IMDG_class || "N/A";


  let packegingType = unitOfIt;  // Ignore it for now


  let type = "sanitary";
  let taxStatus = data.integrated_tax.toLowerCase() || "with";
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

  // response = await fetch('/vgnHeader.png'); // <-- relative to `public/`
  // arrayBuf = await response.arrayBuffer();

  // Add vgnHeader
  if (headerUrl) {

    const { buffer, extension, width, height } = await loadImageBuffer(headerUrl);
    vgnHeader = workbook.addImage({
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
    vgnFooter = workbook.addImage({
      buffer: buffer,
      extension: extension,
    });
    vgnFooterW = width;
    vgnFooterH = height;
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

  worksheet.mergeCells('O7:T7');
  worksheet.getCell('O7').value = `${buyersOrderNo}    ${buyersOrderDate}`;

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
  worksheet.getCell('O20').value = `Country of Origin of Goods : ${countryOfOrigin}`;
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
  worksheet.getCell('O23').value = `${termsOfDelivery} AT ${portOfLoading} PORT`;
  worksheet.getCell('O23').font = { color: { argb: 'FFFF0000' } };

  worksheet.mergeCells('O24:AA25');
  worksheet.getCell('O24').value = `${paymentTerms}`;
  worksheet.getCell('O24').font = { name: 'Arial', color: { argb: 'FFFF0000' } };
  worksheet.getCell('O24').alignment = { wrapText: true, horizontal: 'left', vertical: 'top' };

  worksheet.mergeCells('O26:U26');
  worksheet.getCell('O26').value = shippingMethod;
  setOuterBorder('O22:AA26', worksheet);

  if (type !== "mix") {
    worksheet.mergeCells('W26:Y26');
    worksheet.getCell('W26').value = `${currency} RATE:`;
    worksheet.getCell('W26').alignment = { horizontal: 'center' };
    worksheet.getCell('W26').font = { bold: true };

    worksheet.mergeCells('Z26:AA26');
    worksheet.getCell('Z26').value = currencyRate;
    worksheet.getCell('Z26').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' }, // Yellow fill
    };

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
    worksheet.getCell('Y26').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' }, // Yellow fill
    };

    worksheet.getCell('Y26').font = { bold: true };
    setOuterBorder('V26:AA26', worksheet, 'medium');
  }

  worksheet.mergeCells('A27:D27');
  worksheet.getCell('A27').value = "Marks & Nos.";
  worksheet.getCell('A27').font = { bold: true };
  worksheet.getCell('A27').alignment = { horizontal: 'center' };

  if (cuntainerType === 'FCL') {
    worksheet.mergeCells('A28:D28');
    worksheet.getCell('A28').value = `${marksAndNos} ${cuntainerType}`;
    worksheet.getCell('A28').font = { bold: true };
    worksheet.getCell('A28').alignment = { horizontal: 'center' };
    setOuterBorder('A27:D28', worksheet, 'medium');
  } else {
    worksheet.mergeCells('A28:D28');
    worksheet.getCell('A28').value = `${cuntainerType}`;
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

  if (type !== "mix") {
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
    worksheet.getCell('S28').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('S27:T28', worksheet, 'medium');

    worksheet.mergeCells('U27:V27')
    worksheet.getCell('U27').value = "UNIT TYPE";
    worksheet.getCell('U27').font = { bold: true };
    worksheet.getCell('U27').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('U28:V28')
    worksheet.getCell('U28').value = packegingType;
    worksheet.getCell('U28').font = { bold: true };
    worksheet.getCell('U28').alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('U27:V28', worksheet, 'medium');

    worksheet.mergeCells('W27:X27')
    worksheet.getCell('W27').value = "SQM/";
    worksheet.getCell('W27').font = { bold: true };
    worksheet.getCell('W27').alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('W28:X28')
    worksheet.getCell('W28').value = packegingType;
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
    if (type !== "mix") {
      row++;
      if (products[i].length === 2) {
        worksheet.mergeCells('E' + row + ':Q' + row);
        worksheet.getCell('E' + row).value = products[i][0];
        worksheet.getCell('E' + row).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCC99' }, // Light orange / peach
        };
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
        worksheet.getCell('A' + row).alignment = { horizontal: 'right' };
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
        worksheet.getCell('B' + row).alignment = { horizontal: 'center' };
        setOuterBorder('B' + row + ':D' + row, worksheet);

        worksheet.mergeCells('E' + row + ':Q' + row);
        worksheet.getCell('E' + row).value = products[i][0];
        worksheet.getCell('E' + row).font = { size: 12 };
        worksheet.getCell('E' + row).alignment = { horizontal: 'center' };
        setOuterBorder('E' + row + ':Q' + row, worksheet);

        worksheet.getCell('R' + row).value = products[i][1];
        worksheet.getCell('R' + row).alignment = { horizontal: 'center' };
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
        worksheet.getCell('S' + row).alignment = { horizontal: 'center' };
        setOuterBorder('S' + row + ':T' + row, worksheet);

        worksheet.mergeCells('U' + row + ':V' + row);
        worksheet.getCell('U' + row).value = products[i][3];
        worksheet.getCell('U' + row).alignment = { horizontal: 'center' };
        setOuterBorder('U' + row + ':V' + row, worksheet);

        worksheet.mergeCells('W' + row + ':X' + row);
        worksheet.getCell('W' + row).value = products[i][4];
        worksheet.getCell('W' + row).font = { size: 12 };
        worksheet.getCell('W' + row).alignment = { horizontal: 'center' };
        setOuterBorder('W' + row + ':X' + row, worksheet);

        worksheet.getCell('Y' + row).value = products[i][5];
        worksheet.getCell('Y' + row).alignment = { horizontal: 'center' };
        worksheet.getCell('Y' + row).font = { size: 12 };
        worksheet.getCell('Y' + row).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },     // black
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        worksheet.getCell('Z' + row).value = products[i][6];
        worksheet.getCell('Z' + row).alignment = { horizontal: 'center' };
        worksheet.getCell('Z' + row).font = { size: 12 };
        worksheet.getCell('Z' + row).border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },     // black
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };

        worksheet.getCell('AA' + row).value = products[i][7];
        worksheet.getCell('AA' + row).alignment = { horizontal: 'center' };
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
        worksheet.getCell('E' + row).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCC99' }, // Light orange / peach
        };

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
        worksheet.getCell('A' + row).alignment = { horizontal: 'right' };
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
        worksheet.getCell('B' + row).alignment = { horizontal: 'center' };
        setOuterBorder('B' + row + ':D' + row, worksheet);

        worksheet.mergeCells('E' + row + ':Q' + row);
        worksheet.getCell('E' + row).value = products[i][0];
        worksheet.getCell('E' + row).font = { size: 12 };
        worksheet.getCell('E' + row).alignment = { horizontal: 'center' };
        setOuterBorder('E' + row + ':Q' + row, worksheet);

        worksheet.mergeCells('R' + row + ':S' + row);
        worksheet.getCell('R' + row).value = products[i][2];
        worksheet.getCell('R' + row).font = { size: 12 };
        worksheet.getCell('R' + row).alignment = { horizontal: 'center' };
        setOuterBorder('R' + row + ':S' + row, worksheet);

        worksheet.mergeCells('T' + row + ':U' + row);
        worksheet.getCell('T' + row).value = products[i][3];
        worksheet.getCell('T' + row).alignment = { horizontal: 'center' };
        setOuterBorder('T' + row + ':U' + row, worksheet);

        worksheet.mergeCells('V' + row + ':X' + row);
        worksheet.getCell('V' + row).value = products[i][6];
        worksheet.getCell('V' + row).font = { size: 12 };
        worksheet.getCell('V' + row).alignment = { horizontal: 'center' };
        setOuterBorder('V' + row + ':X' + row, worksheet);

        worksheet.mergeCells('Y' + row + ':AA' + row);
        worksheet.getCell('Y' + row).value = products[i][7];
        worksheet.getCell('Y' + row).font = { size: 12 };
        worksheet.getCell('Y' + row).alignment = { horizontal: 'center' };
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
  if (type !== "mix") {
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

  if (type !== 'mix') {
    worksheet.mergeCells('A' + row + ':E' + row);
    worksheet.getCell('A' + row).value = "NET WT. (KGS): ";
    worksheet.getCell('A' + row).font = { underline: true };
    worksheet.getCell('A' + row).alignment = { horizontal: 'right' };
    setOuterBorder('A' + row + ':E' + row, worksheet);

    worksheet.mergeCells('F' + row + ':H' + row);
    worksheet.getCell('F' + row).value = netWeight;
    worksheet.getCell('F' + row).font = { underline: true };
    worksheet.getCell('F' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };

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
    worksheet.getCell('F' + row).font = { underline: true };
    worksheet.getCell('F' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };

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
    worksheet.getCell('E' + row).font = { underline: true };
    worksheet.getCell('E' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };

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
    worksheet.getCell('E' + row).font = { underline: true };
    worksheet.getCell('E' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };

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

  if (type !== "mix") {
    setOuterBorder('R' + row + ':R' + (row + 1), worksheet);

    worksheet.mergeCells('S' + row + ':T' + row);
    worksheet.getCell('S' + row).value = noOfPackages;
    worksheet.getCell('S' + row).font = { bold: true };
    worksheet.getCell('S' + row).alignment = { horizontal: 'center' };

    setOuterBorder('U' + row + ':V' + (row + 1), worksheet);

    worksheet.mergeCells('W' + row + ':Y' + row);
    worksheet.getCell('W' + row).value = `TOTAL SQM`;
    worksheet.getCell('W' + row).font = { bold: true };
    worksheet.getCell('W' + row).alignment = { horizontal: 'center' };

    worksheet.mergeCells('W' + (row + 1) + ':Y' + (row + 1));
    worksheet.getCell('W' + (row + 1)).value = totalSQM;
    worksheet.getCell('W' + (row + 1)).font = { bold: true };
    worksheet.getCell('W' + (row + 1)).alignment = { horizontal: 'center' };
    setOuterBorder('W' + row + ':Y' + (row + 1), worksheet);

    worksheet.mergeCells('Z' + row + ':Z' + (row + 1));
    worksheet.getCell('Z' + row).value = `${termsOfDelivery} ${currency}`;
    worksheet.getCell('Z' + row).font = { bold: true };
    worksheet.getCell('Z' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
    setOuterBorder('Z' + row + ':Z' + (row + 1), worksheet);

    worksheet.mergeCells('AA' + row + ':AA' + (row + 1));
    worksheet.getCell('AA' + row).value = fOBEuro;
    worksheet.getCell('AA' + row).font = { bold: true };
    worksheet.getCell('AA' + row).alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('AA' + row + ':AA' + (row + 1), worksheet);
  }
  else {
    worksheet.mergeCells('R' + row + ':S' + row);
    worksheet.getCell('R' + row).value = noOfPackages;
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
    worksheet.getCell('V' + row).value = `TOTAL ${currency}`;
    worksheet.getCell('V' + row).font = { bold: true };
    worksheet.getCell('V' + row).alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('V' + row + ':X' + (row + 1), worksheet);



    worksheet.mergeCells('Y' + row + ':AA' + (row + 1));
    worksheet.getCell('Y' + row).value = fOBEuro;
    worksheet.getCell('Y' + row).font = { bold: true };
    worksheet.getCell('Y' + row).alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('Y' + row + ':AA' + (row + 1), worksheet);
  }
  row++;

  worksheet.mergeCells('A' + row + ':G' + row);
  worksheet.getCell('A' + row).value = `${noOfPackages} ${packegingType}`;
  worksheet.getCell('A' + row).alignment = { horizontal: 'center' };
  setOuterBorder('A' + (row - 1) + ':G' + row, worksheet);

  if (type !== "mix") {
    worksheet.mergeCells('S' + row + ':T' + row);
    worksheet.getCell('S' + row).value = packegingType;
    worksheet.getCell('S' + row).font = { bold: true };
    worksheet.getCell('S' + row).alignment = { horizontal: 'center' };
    setOuterBorder('S' + (row - 1) + ':T' + row, worksheet);
  }
  else {
    worksheet.mergeCells('R' + row + ':S' + row);
    worksheet.getCell('R' + row).value = packegingType;
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

  if (type === "sanitary" && termsOfDelivery !== "FOB") {
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
  else if (type === "mix" && termsOfDelivery !== "FOB") {
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
  } else if (type === "mix") {
    worksheet.mergeCells('R' + row + ':X' + row);
    setOuterBorder('R' + row + ':X' + row, worksheet);

    worksheet.mergeCells('Y' + row + ':AA' + row);
    setOuterBorder('Y' + row + ':AA' + row, worksheet);
  }
  row++;

  worksheet.mergeCells('A' + row + ':Q' + (row + 1));
  worksheet.getCell('A' + row).value = `${amountInWords}.`;
  worksheet.getCell('A' + row).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF00' },
  };

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
  else if (type === "mix" && termsOfDelivery !== "FOB") {
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
  else if (type === "mix") {
    worksheet.mergeCells('R' + row + ':X' + row);
    setOuterBorder('R' + row + ':X' + row, worksheet);

    worksheet.mergeCells('Y' + row + ':AA' + row);
    setOuterBorder('Y' + row + ':AA' + row, worksheet);
  }
  row++;

  if (type === "sanitary") {
    worksheet.mergeCells('S' + row + ':Y' + row);
    worksheet.getCell('S' + row).value = `TOTAL ${termsOfDelivery} ${currency}`;
    worksheet.getCell('S' + row).font = { bold: true };
    worksheet.getCell('S' + row).alignment = { horizontal: 'right' };
    setOuterBorder('S' + row + ':Y' + row, worksheet);

    worksheet.getCell('AA' + row).value = totalFOBEuro;
    worksheet.getCell('AA' + row).font = { bold: true };
    worksheet.getCell('AA' + row).alignment = { horizontal: 'center' };
    worksheet.getCell('AA' + row).border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },     // black
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };

  }
  else if (type === "mix") {
    worksheet.mergeCells('R' + row + ':X' + row);
    worksheet.getCell('R' + row).value = `TOTAL ${termsOfDelivery} ${currency}`;
    worksheet.getCell('R' + row).font = { bold: true };
    worksheet.getCell('R' + row).alignment = { horizontal: 'right' };
    setOuterBorder('R' + row + ':X' + row, worksheet);

    worksheet.mergeCells('Y' + row + ':AA' + row);
    worksheet.getCell('Y' + row).value = totalFOBEuro;
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
    worksheet.getCell('A' + row).value = `SUPPLY MEANT FOR EXPORT ON PAYMENT OF IGST UNDER CLAIM OF REFUND RS. TOTAL : ${gstValue}\n(TAXABLE ${termsOfDelivery} INR VALUE ${totalInINR}@ 18% )                                                                            ${gstValue}  `;
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
          worksheet.getCell('G' + (row + 3)).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }, // Yellow fill
          };
          worksheet.getCell('G' + (row + 3)).alignment = { horizontal: 'center' };
          setOuterBorder('G' + (row + 3) + ':K' + (row + 3), worksheet);

          worksheet.mergeCells('L' + (row + 3) + ':Q' + (row + 3));
          worksheet.getCell('L' + (row + 3)).value = supplierDetails[i][3];
          worksheet.getCell('L' + (row + 3)).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }, // Yellow fill
          };
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
          worksheet.getCell('V' + (row + 3)).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }, // Yellow fill
          };
          worksheet.getCell('V' + (row + 3)).alignment = { horizontal: 'center' };
          setOuterBorder('V' + (row + 3) + ':Y' + (row + 3), worksheet);

          worksheet.mergeCells('Z' + (row + 3) + ':AA' + (row + 3));
          worksheet.getCell('Z' + (row + 3)).value = supplierDetails[i][3];
          worksheet.getCell('Z' + (row + 3)).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }, // Yellow fill
          };
          worksheet.getCell('Z' + (row + 3)).alignment = { horizontal: 'center' };
          setOuterBorder('Z' + (row + 3) + ':AA' + (row + 3), worksheet);
          row += 4;
        }
      }
      else if (type === "mix") {
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
          worksheet.getCell('F' + (row + 3)).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }, // Yellow fill
          };
          worksheet.getCell('F' + (row + 3)).alignment = { horizontal: 'center' };
          setOuterBorder('F' + (row + 3) + ':I' + (row + 3), worksheet);

          worksheet.mergeCells('J' + (row + 3) + ':M' + (row + 3));
          worksheet.getCell('J' + (row + 3)).value = supplierDetails[i][3];
          worksheet.getCell('J' + (row + 3)).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }, // Yellow fill
          };
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
          worksheet.getCell('T' + (row + 3)).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }, // Yellow fill
          };
          worksheet.getCell('T' + (row + 3)).alignment = { horizontal: 'center' };
          setOuterBorder('T' + (row + 3) + ':W' + (row + 3), worksheet);

          worksheet.mergeCells('X' + (row + 3) + ':AA' + (row + 3));
          worksheet.getCell('X' + (row + 3)).value = supplierDetails[i][3];
          worksheet.getCell('X' + (row + 3)).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' }, // Yellow fill
          };
          worksheet.getCell('X' + (row + 3)).alignment = { horizontal: 'center' };
          setOuterBorder('X' + (row + 3) + ':AA' + (row + 3), worksheet);
          row += 4;
        }
      }
    }

  }

  if (supplierDetails.length % 2 === 0 || supplierDetails.length == 0) {
    if (type == "mix") {
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
      worksheet.getCell('F' + (row + 3)).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' }, // Yellow fill
      };
      setOuterBorder('F' + (row + 3) + ':I' + (row + 3), worksheet);

      worksheet.mergeCells('J' + (row + 3) + ':M' + (row + 3));
      worksheet.getCell('J' + (row + 3)).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' }, // Yellow fill
      };
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
      worksheet.getCell('G' + (row + 3)).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' }, // Yellow fill
      };
      setOuterBorder('G' + (row + 3) + ':K' + (row + 3), worksheet);

      worksheet.mergeCells('L' + (row + 3) + ':Q' + (row + 3));
      worksheet.getCell('L' + (row + 3)).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' }, // Yellow fill
      };
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
  else if (type === "mix") {
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
  if (type === "mix") {

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

  // New tab : PACKING LIST
  const packingList = workbook.addWorksheet('PACKING LIST');

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

  packingList.mergeCells('N6:T6');
  packingList.getCell('N6').value = `${buyersOrderNo}    ${buyersOrderDate}`;

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
  packingList.getCell('N22').value = `${termsOfDelivery} AT ${portOfLoading} PORT`;

  packingList.mergeCells('N23:AA24');
  packingList.getCell('N23').value = `${paymentTerms}`;
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

  if (cuntainerType === 'FCL') {
    packingList.mergeCells('A27:D27');
    packingList.getCell('A27').value = `${marksAndNos} ${cuntainerType}`;
    packingList.getCell('A27').font = { bold: true };
    packingList.getCell('A27').alignment = { horizontal: 'center' };
    setOuterBorder('A26:D27', packingList);
  } else {
    packingList.mergeCells('A27:D27');
    packingList.getCell('A27').value = cuntainerType;
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
      packingList.getCell('A' + row).alignment = { horizontal: 'right' };
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
      packingList.getCell('B' + row).alignment = { horizontal: 'center' };
      setOuterBorder('B' + row + ':D' + row, packingList);

      packingList.mergeCells('E' + row + ':J' + row);
      packingList.getCell('E' + row).value = products[i][0];
      packingList.getCell('E' + row).alignment = { horizontal: 'center' };
      setOuterBorder('E' + row + ':J' + row, packingList);

      packingList.mergeCells('K' + row + ':P' + row);
      packingList.getCell('K' + row).value = products[i][1];
      packingList.getCell('K' + row).alignment = { horizontal: 'center' };
      setOuterBorder('K' + row + ':P' + row, packingList);

      packingList.mergeCells('Q' + row + ':U' + row);
      packingList.getCell('Q' + row).value = products[i][2];
      packingList.getCell('Q' + row).font = { bold: true };
      packingList.getCell('Q' + row).alignment = { horizontal: 'center' };
      setOuterBorder('Q' + row + ':U' + row, packingList);

      packingList.mergeCells('V' + row + ':X' + row);
      packingList.getCell('V' + row).value = products[i][8];
      packingList.getCell('V' + row).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
      };
      packingList.getCell('V' + row).alignment = { horizontal: 'center' };
      setOuterBorder('V' + row + ':X' + row, packingList);

      packingList.mergeCells('Y' + row + ':AA' + row);
      packingList.getCell('Y' + row).value = products[i][9];
      packingList.getCell('Y' + row).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
      };
      packingList.getCell('Y' + row).alignment = { horizontal: 'center' };
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
    packingList.getCell('A' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9EAF7' },
    };
    packingList.getCell('A' + row).alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('A' + row + ':D' + row, packingList);

    packingList.mergeCells('E' + row + ':H' + row);
    packingList.getCell('E' + row).value = containerDetails[i][1];
    packingList.getCell('E' + row).font = { size: 11 };
    packingList.getCell('E' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };
    packingList.getCell('E' + row).alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('E' + row + ':H' + row, packingList);

    packingList.mergeCells('I' + row + ':L' + row);
    packingList.getCell('I' + row).value = containerDetails[i][2];
    packingList.getCell('I' + row).font = { size: 11 };
    packingList.getCell('I' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };
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
    packingList.getCell('V' + row).font = { size: 11 };
    packingList.getCell('V' + row).alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('V' + row + ':X' + row, packingList);

    packingList.mergeCells('Y' + row + ':AA' + row);
    packingList.getCell('Y' + row).value = containerDetails[i][6];
    packingList.getCell('Y' + row).font = { size: 11 };
    packingList.getCell('Y' + row).alignment = { horizontal: 'center', vertical: 'middle' };
    setOuterBorder('Y' + row + ':AA' + row, packingList);

    row++;

  }

  packingList.mergeCells('A' + row + ':D' + (row + 1));
  packingList.getCell('A' + row).value = "Nos. of Kind Packages";
  packingList.getCell('A' + row).font = { bold: true };
  packingList.getCell('A' + row).alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
  setOuterBorder('A' + row + ':D' + (row + 1), packingList);

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

  packingList.mergeCells('Q' + row + ':U' + (row + 1));
  packingList.getCell('Q' + row).value = noOfPackages;
  packingList.getCell('Q' + row).font = { bold: true };
  packingList.getCell('Q' + row).alignment = { horizontal: 'center', vertical: 'middle' };
  setOuterBorder('Q' + row + ':U' + (row + 1), packingList);

  packingList.mergeCells('V' + row + ':X' + (row + 1));
  packingList.getCell('V' + row).value = netWeight;
  packingList.getCell('V' + row).font = { bold: true };
  packingList.getCell('V' + row).alignment = { horizontal: 'center', vertical: 'middle' };
  setOuterBorder('V' + row + ':X' + (row + 1), packingList);

  packingList.mergeCells('Y' + row + ':AA' + (row + 1));
  packingList.getCell('Y' + row).value = grossWeight;
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

  packingList.mergeCells('A' + row + ':P' + (row + 3));
  setOuterBorder('A' + row + ':P' + (row + 3), packingList);

  packingList.mergeCells('Q' + (row + 5) + ':AA' + (row + 5));
  packingList.getCell('Q' + (row + 5)).value = "AUTHORISED SIGN.";
  packingList.getCell('Q' + (row + 5)).font = { bold: true };
  packingList.getCell('Q' + (row + 5)).alignment = { horizontal: 'right' };
  setOuterBorder('Q' + row + ':AA' + (row + 5), packingList);

  row += 4;

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

  const annexure = workbook.addWorksheet('ANNEXURE');
  configurePrintSheet(annexure);

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
  annexure.getCell('M11').alignment = { horizontal: 'left' };

  annexure.mergeCells('M12:AA15');
  annexure.getCell('M12').value = manufacturerAddress;
  annexure.getCell('M12').alignment = { horizontal: 'left', vertical: 'top' };

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
  annexure.getCell('M26').value = noOfPackages;
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
  annexure.getCell('F' + row).font = { color: { argb: 'FFFF0000' }, bold: true };
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
    annexure.getCell('B' + row).value = `SUPPLY MEANT FOR EXPORT ON PAYMENT OF IGST UNDER CLAIM OF REFUND RS. TOTAL : ${gstValue}\n(TAXABLE ${termsOfDelivery} INR VALUE ${totalInINR}@ 18% )                                                                            ${gstValue}  `;
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
  annexure.getCell('O' + row).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF00' },
  };
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

  const vgn = workbook.addWorksheet('VGN');

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
  vgn.getCell('G' + row).value = numberOfOfficial;
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
    vgn.getCell('G' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };
    vgn.getCell('G' + row).alignment = { horizontal: 'center' }

    vgn.getCell('H' + row).value = "+";
    vgn.getCell('H' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };
    vgn.getCell('H' + row).alignment = { horizontal: 'center' }

    vgn.getCell('I' + row).value = containerDetails[i][9];
    vgn.getCell('I' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };
    vgn.getCell('I' + row).alignment = { horizontal: 'center' }

    vgn.getCell('J' + row).value = "=";
    vgn.getCell('J' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };
    vgn.getCell('J' + row).alignment = { horizontal: 'center' }

    vgn.getCell('K' + row).value = Number(containerDetails[i][6]) + Number(containerDetails[i][9]);
    vgn.getCell('K' + row).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF00' },
    };
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
  if (cuntainerType === "FCL") {
    fileName = `${invoiceNo.split("/")[1]} - ${finalDestination} - ${marksAndNos}ft.xlsx`;
  } else {
    fileName = `${invoiceNo.split("/")[1]} - ${finalDestination} - ${cuntainerType}.xlsx`;
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, fileName);
  console.log('✅ Excel file prepared for download');
  return {blob,fileName};
};
