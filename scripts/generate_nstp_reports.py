import os
import openpyxl
from openpyxl.worksheet.page import PageMargins
from openpyxl.worksheet.properties import WorksheetProperties, PageSetupProperties
from openpyxl.styles import Alignment, Border, Side, Font
from openpyxl.utils import get_column_letter

def enforce_print_setup(ws):
    """Fix for Excel templates when customizing print properties."""
    if ws.sheet_properties is None:
        ws.sheet_properties = WorksheetProperties()
    if ws.sheet_properties.pageSetUpPr is None:
        ws.sheet_properties.pageSetUpPr = PageSetupProperties()
    ws.sheet_properties.pageSetUpPr.fitToPage = True

def generate_nstp_reports(
    form_b_template: str = 'OSDS-NSTP-Form-2-B.xlsx',
    form_a_template: str = 'OSDS-NSTP-Form-2-A.xlsx',
    students_data: list = None,
    summary_data: list = None,
    output_dir: str = '.'
):
    """
    Populates existing OSDS-NSTP Form 2-A and Form 2-B templates with
    enforced Landscape A4 print setup, thin borders, and auto-fit widths.
    """
    os.makedirs(output_dir, exist_ok=True)
    out_b = os.path.join(output_dir, 'Print_Ready_OSDS-NSTP-Form-2-B.xlsx')
    out_a = os.path.join(output_dir, 'Print_Ready_OSDS-NSTP-Form-2-A.xlsx')

    # ==============================================================
    # 1. PROCESS FORM 2-B (NSTP Enrollment List)
    # ==============================================================
    if os.path.exists(form_b_template):
        wb_b = openpyxl.load_workbook(form_b_template)
        ws_b = wb_b.active
        enforce_print_setup(ws_b)

        # Magic Print Settings
        ws_b.page_setup.paperSize = 9  # 9 = A4 Size Paper
        ws_b.page_setup.orientation = ws_b.ORIENTATION_LANDSCAPE
        ws_b.page_setup.fitToHeight = False  # Allows multiple pages vertically for long lists
        ws_b.page_setup.fitToWidth = 1       # Fit to exactly 1 page width horizontally
        ws_b.page_margins = PageMargins(left=0.25, right=0.25, top=0.5, bottom=0.5)

        # Default sample student records if none supplied
        # Notice Column 10 and 12 are blank ("") to safeguard merged address columns
        sample_data_b = students_data or [
            [1, "2024-00101", "Dela Cruz", "Juan", "P.", "BSIT 3A", "M", "2005-08-17", "Brgy 1", "", "Imus", "", "Cavite", "09123456789", "juan@email.com"],
            [2, "2024-00102", "Santos", "Maria", "C.", "BSIT 3A", "F", "2006-01-20", "Brgy 2", "", "Bacoor", "", "Cavite", "09987654321", "maria@email.com"]
        ]

        thin_border = Border(
            left=Side(style='thin', color='000000'),
            right=Side(style='thin', color='000000'),
            top=Side(style='thin', color='000000'),
            bottom=Side(style='thin', color='000000')
        )
        data_font = Font(name="Arial", size=9)

        # Start writing at Row 13 in Form-2-B
        for row_idx, data in enumerate(sample_data_b, start=13):
            ws_b.row_dimensions[row_idx].height = 20
            for col_idx, value in enumerate(data, start=1):
                cell = ws_b.cell(row=row_idx, column=col_idx)
                if value != "":  # Write non-empty value to keep template merges intact
                    cell.value = value
                cell.border = thin_border
                cell.font = data_font
                is_center = col_idx in [1, 2, 6, 7, 8, 14]
                cell.alignment = Alignment(horizontal="center" if is_center else "left", vertical="center", wrap_text=True)

        wb_b.save(out_b)
        print(f"✅ Form 2-B generated: {out_b}")
    else:
        print(f"⚠️ Form 2-B template not found at '{form_b_template}', skipping template injection.")

    # ==============================================================
    # 2. PROCESS FORM 2-A (Summary Report)
    # ==============================================================
    if os.path.exists(form_a_template):
        wb_a = openpyxl.load_workbook(form_a_template)
        ws_a = wb_a.active
        enforce_print_setup(ws_a)

        # Magic Print Settings for Summary (Fit exactly on 1 page)
        ws_a.page_setup.paperSize = 9  # A4
        ws_a.page_setup.orientation = ws_a.ORIENTATION_LANDSCAPE
        ws_a.page_setup.fitToHeight = 1  # 1 Page high
        ws_a.page_setup.fitToWidth = 1   # 1 Page wide
        ws_a.page_margins = PageMargins(left=0.25, right=0.25, top=0.5, bottom=0.5)

        if summary_data:
            # Start writing at Row 12/14 for summary rows
            for row_idx, data in enumerate(summary_data, start=12):
                for col_idx, value in enumerate(data, start=1):
                    if value != "":
                        ws_a.cell(row=row_idx, column=col_idx, value=value)

        wb_a.save(out_a)
        print(f"✅ Form 2-A generated: {out_a}")
    else:
        print(f"⚠️ Form 2-A template not found at '{form_a_template}', skipping template injection.")

    print("🎉 Success! Na-generate na ang mga print-ready Excel files.")

if __name__ == '__main__':
    generate_nstp_reports()
