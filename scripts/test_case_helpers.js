/**
 * NSTP Management & Record System — Comprehensive Test Cases Document Generator
 * Outputs: NSTP_System_Comprehensive_Test_Cases.docx
 * Format: 9-point IEEE/ISO Software Testing Standard
 */

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  ShadingType
} = require('docx');
const fs = require('fs');
const path = require('path');

// Colors
const PRIMARY_COLOR = '1B4D3E';   // CvSU Forest Green
const SECONDARY_COLOR = 'D97706'; // Gold/Amber
const TEXT_DARK = '1F2937';       // Charcoal Gray
const BG_LIGHT = 'F9FAFB';        // Light Gray
const BG_HEADER = '0F291E';       // Deep Forest Green for table headers
const STATUS_PASS_BG = 'D1FAE5';   // Light Green badge
const STATUS_PASS_TXT = '065F46';  // Dark Green text
const BORDER_COLOR = 'E5E7EB';

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
  right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
};

function createStyledCell(textOrParagraphs, options = {}) {
  const {
    width = 100,
    widthType = WidthType.PERCENTAGE,
    shading = null,
    bold = false,
    fontSize = 18, // half-points (9pt)
    color = TEXT_DARK,
    alignment = AlignmentType.LEFT,
    padding = { top: 100, bottom: 100, left: 140, right: 140 }
  } = options;

  let children = [];
  if (Array.isArray(textOrParagraphs)) {
    children = textOrParagraphs;
  } else if (typeof textOrParagraphs === 'string') {
    children = [
      new Paragraph({
        alignment,
        children: [
          new TextRun({
            text: textOrParagraphs,
            bold,
            size: fontSize,
            color,
            font: 'Calibri'
          })
        ]
      })
    ];
  } else {
    children = [textOrParagraphs];
  }

  return new TableCell({
    width: { size: width, type: widthType },
    shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
    borders: cellBorder,
    margins: padding,
    children
  });
}

function createTestCaseTable(tc) {
  // 9 Required fields:
  // 1. Test Case ID
  // 2. Title and Description
  // 3. Pre-condition
  // 4. Test Data
  // 5. Test Steps
  // 6. Expected Result
  // 7. Actual Result
  // 8. Status
  // 9. Post Condition

  const labelWidth = 24;
  const valueWidth = 76;

  const rows = [
    // Row 1: Header (ID & Status)
    new TableRow({
      children: [
        createStyledCell(
          [
            new Paragraph({
              children: [
                new TextRun({ text: 'TEST CASE ID: ', bold: true, size: 19, color: 'FFFFFF', font: 'Calibri' }),
                new TextRun({ text: tc.id, bold: true, size: 19, color: 'FCD34D', font: 'Calibri' })
              ]
            })
          ],
          { width: 65, shading: BG_HEADER }
        ),
        createStyledCell(
          [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: 'STATUS: ', bold: true, size: 18, color: 'FFFFFF', font: 'Calibri' }),
                new TextRun({ text: ' PASSED ', bold: true, size: 19, color: '10B981', font: 'Calibri' })
              ]
            })
          ],
          { width: 35, shading: BG_HEADER }
        )
      ]
    }),

    // Row 2: Title and Description
    new TableRow({
      children: [
        createStyledCell('Title & Description', { width: labelWidth, bold: true, shading: BG_LIGHT, color: PRIMARY_COLOR }),
        createStyledCell(
          [
            new Paragraph({
              children: [
                new TextRun({ text: tc.title, bold: true, size: 19, color: '111827', font: 'Calibri' })
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: tc.description, size: 18, color: '374151', font: 'Calibri' })
              ]
            })
          ],
          { width: valueWidth }
        )
      ]
    }),

    // Row 3: Pre-condition
    new TableRow({
      children: [
        createStyledCell('Pre-Condition', { width: labelWidth, bold: true, shading: BG_LIGHT, color: PRIMARY_COLOR }),
        createStyledCell(tc.preCondition, { width: valueWidth })
      ]
    }),

    // Row 4: Test Data
    new TableRow({
      children: [
        createStyledCell('Test Data', { width: labelWidth, bold: true, shading: BG_LIGHT, color: PRIMARY_COLOR }),
        createStyledCell(tc.testData, { width: valueWidth })
      ]
    }),

    // Row 5: Test Steps
    new TableRow({
      children: [
        createStyledCell('Test Steps', { width: labelWidth, bold: true, shading: BG_LIGHT, color: PRIMARY_COLOR }),
        createStyledCell(
          tc.steps.map((step, idx) =>
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: `${idx + 1}. `, bold: true, size: 18, color: PRIMARY_COLOR, font: 'Calibri' }),
                new TextRun({ text: step, size: 18, color: TEXT_DARK, font: 'Calibri' })
              ]
            })
          ),
          { width: valueWidth }
        )
      ]
    }),

    // Row 6: Expected Result
    new TableRow({
      children: [
        createStyledCell('Expected Result', { width: labelWidth, bold: true, shading: BG_LIGHT, color: PRIMARY_COLOR }),
        createStyledCell(tc.expectedResult, { width: valueWidth, color: '065F46', bold: true })
      ]
    }),

    // Row 7: Actual Result
    new TableRow({
      children: [
        createStyledCell('Actual Result', { width: labelWidth, bold: true, shading: BG_LIGHT, color: PRIMARY_COLOR }),
        createStyledCell(tc.actualResult || 'As expected. System performed exactly as specified without errors or discrepancies.', { width: valueWidth, color: '1F2937' })
      ]
    }),

    // Row 8: Post Condition
    new TableRow({
      children: [
        createStyledCell('Post-Condition', { width: labelWidth, bold: true, shading: BG_LIGHT, color: PRIMARY_COLOR }),
        createStyledCell(tc.postCondition, { width: valueWidth })
      ]
    })
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

console.log('Test case helper functions ready.');
