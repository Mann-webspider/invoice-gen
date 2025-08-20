import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export const generateInvoigenerateDocxceExcel = async (data): Promise<void> => {
  let companyName = data.exporter.company_name || "COMPANY NAME";
  let companyAddress = data.exporter.company_address || `SECOND FLOOR, OFFICE NO 7,\nISHAN CERAMIC ZONE WING D,\nLALPAR, MORBI,\nGujarat, 363642\nINDIA`;
  let email = data.vgm.forwarder_email || "ABC@GMAIL.COM";
  let consignee = data.buyer.consignee || "XYZ";
  let notifyParty = data.buyer.notify_party || "";
  let finalDestination = data.shipping.final_destination || "USA";
  let termsOfDelivery = data.payment_term || "FOB";
  let cuntainerType = data.product_details.nos || "FCL";
  let marksAndNos = data.product_details.marks || "10 x 20'";

  // product_name, size, quantity, unit, sqm_box, total_sqm, price, amount , net_weight, gross_weight

  const reverseTransformProducts = (data: any[]) => {
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
  let noOfPackages = data.package.number_of_package || 14000;
  let grossWeight = data.annexure.gross_weight || "";
  let netWeight = data.annexure.net_weight || "";
  let insurance = data.product_details.insurance || 1000.00;
  let freight = data.product_details.frieght || 1000.00;




  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "DEAR TEAM,",
                bold: true,
              }),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `\nPLEASE FIND ATTACHED DOCS & VGM OF ${marksAndNos}FT - ${finalDestination}\n`,
              }),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({}),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun(companyName),
            ],
          }),
          new Paragraph({
            children: companyAddress.split("\n").flatMap((line, index, arr) => [
              new TextRun(line),
              ...(index < arr.length - 1 ? [new TextRun({ break: 1 })] : []),
            ]),
          }),

          new Paragraph({
            children: [
              new TextRun({}),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "CONSIGNEE FOR THE S.B.\n", bold: true }),
            ],
          }),
          ...notifyParty.split("\n").map((party, index) => [
            new Paragraph({
              children: [
                new TextRun(party),
              ],
            }),
          ]).flat(),
          // new Paragraph({
          //   children: [
          //     new TextRun(`${consignee}`),
          //   ],
          // }),

          new Paragraph({
            children: [
              new TextRun({}),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "CONSIGNEE FOR THE BL:", bold: true }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun(`${consignee}`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(noOfPackages + "       " + netWeight),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({}),
            ],
          }),

          ...notifyParty.split("\n").map((party, index) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `NOTIFY FOR THE BL: ${index + 1}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(party),
              ],
            }),
          ]).flat(),

          new Paragraph({
            children: [
              new TextRun({}),
            ],
          }),

          // new Paragraph({
          //   children: [
          //     new TextRun({ text: "NOTIFY FOR THE BL: 2", bold: true }),
          //   ],
          // }),

          new Paragraph({
            children: [
              new TextRun({}),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "GOODS DESCRIPTION FOR BL:\n", bold: true }),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun(`${marksAndNos} ${cuntainerType} CONTINERS`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(` TOTAL ${noOfPackages}`),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({}),
            ],
          }),

          // new Paragraph({ children: [new TextRun("Your heading or other content here")] }),

          // 👇 Inline loop directly inside children using flatMap
          ...products.flatMap(item =>
            item.length === 2
              ? [
                new Paragraph({
                  children: [
                    new TextRun(item[0])
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun("HS CODE " + item[1])
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun("TOTAL " + noOfPackages)
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({}),
                  ],
                }),
              ]
              : []
          ),

          new Paragraph({
            children: [
              new TextRun("NET WEIGHT " + netWeight + " KGS\n"),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun("GROSS WEIGHT " + grossWeight + " KGS"),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun("SHIPPING BILL NO:     SHIPPING BILL DATE:\n"),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun("FREE DAYS POD"),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({}),
            ],
          }),

          // new Paragraph({
          //   children: [
          //     new TextRun(`${netWeight}`),
          //   ],
          // }),
          // new Paragraph({
          //   children: [
          //     new TextRun(`${grossWeight}`),
          //   ],
          // }),

          new Paragraph({
            children: [
              new TextRun("Forwarder : " + email),
            ],
          }),
          ...(termsOfDelivery !== "FOB"
            ? [
              new Paragraph({
                children: [new TextRun("Insurance: " + insurance)],
              }),
              new Paragraph({
                children: [new TextRun("Freight: " + freight)],
              }),
            ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  // saveAs(blob, "shipping_details.docx");
  return blob
}

// Utility for bold style
function boldText() {
  return { bold: true };
}
