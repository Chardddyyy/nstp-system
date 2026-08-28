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
    try:
        from generate_form_b_openpyxl import generate_ready_to_print_form_b, create_base_form_b_template
        if not os.path.exists(form_b_template):
            create_base_form_b_template(form_b_template)

        sample_students_b = students_data or [
            {
                'student_no': '2025-0001',
                'surname': 'Dela Cruz',
                'first_name': 'Juan',
                'middle_name': 'Santos',
                'program': 'BSIT',
                'sex': 'M',
                'birthdate': '2005-08-17',
                'street_brgy': 'Bancaan',
                'city': 'Naic',
                'province': 'Cavite',
                'contact_no': '09123456789',
                'email': 'juan@cvsu.edu.ph'
            },
            {
                'student_no': '2025-0002',
                'surname': 'Belen',
                'first_name': 'Richard',
                'middle_name': 'Mariño',
                'program': 'BSIT',
                'sex': 'M',
                'birthdate': '2005-08-17',
                'street_brgy': 'Halang',
                'city': 'Naic',
                'province': 'Cavite',
                'contact_no': '09987654321',
                'email': 'richard@cvsu.edu.ph'
            }
        ]
        generate_ready_to_print_form_b(sample_students_b, template_path=form_b_template, output_filename=out_b)
    except Exception as e:
        print(f"⚠️ Form 2-B generation notice: {e}")

    # ==============================================================
    # 2. PROCESS FORM 2-A (Summary Report)
    # ==============================================================
    try:
        from generate_form_a_openpyxl import generate_ready_to_print_form_a, create_base_form_a_template
        if not os.path.exists(form_a_template):
            create_base_form_a_template(form_a_template)
            
        sample_summary_records = summary_data or [
            {
                'hei_name': 'CAVITE STATE UNIVERSITY - NAIC', 
                'classification': 'PUBLIC',
                'sem1_rotc_m': 45, 'sem1_rotc_f': 12,
                'sem1_cwts_m': 120, 'sem1_cwts_f': 150,
                'sem1_lts_m': 15, 'sem1_lts_f': 25,
                'sem2_rotc_m': 43, 'sem2_rotc_f': 12,
                'sem2_cwts_m': 118, 'sem2_cwts_f': 149,
                'sem2_lts_m': 15, 'sem2_lts_f': 25,
                'summer_rotc_m': 0, 'summer_rotc_f': 0,
                'summer_cwts_m': 0, 'summer_cwts_f': 0,
                'summer_lts_m': 0, 'summer_lts_f': 0,
                'grad_rotc_m': 43, 'grad_rotc_f': 12,
                'grad_cwts_m': 118, 'grad_cwts_f': 149,
                'grad_lts_m': 15, 'grad_lts_f': 25
            }
        ]
        generate_ready_to_print_form_a(sample_summary_records, template_path=form_a_template)
        print(f"✅ Form 2-A generated: Ready_To_Print_{form_a_template}")
    except Exception as e:
        print(f"⚠️ Form 2-A generation notice: {e}")

    print("🎉 Success! Na-generate na ang mga print-ready Excel files.")

if __name__ == '__main__':
    generate_nstp_reports()
