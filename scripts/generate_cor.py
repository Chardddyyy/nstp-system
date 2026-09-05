from PIL import Image, ImageDraw, ImageFont
import os

def create_cor_image(student_id, full_name, program, section, dept, filename):
    # Standard portrait dimensions for letter paper
    width = 900
    height = 1250
    img = Image.new('RGB', (width, height), color='#FFFFFF')
    draw = ImageDraw.Draw(img)

    # Outer border & header bar
    draw.rectangle([15, 15, width - 15, height - 15], outline='#065f46', width=2)
    draw.rectangle([19, 19, width - 19, height - 19], outline='#d1fae5', width=1)

    # Load fonts
    font_path_bold = '/System/Library/Fonts/Supplemental/Arial.ttf'
    font_path_regular = '/System/Library/Fonts/Helvetica.ttc'

    try:
        f_title_main = ImageFont.truetype(font_path_bold, 18)
        f_sub = ImageFont.truetype(font_path_bold, 11)
        f_sub_reg = ImageFont.truetype(font_path_regular, 10)
        f_cor_banner = ImageFont.truetype(font_path_bold, 15)
        f_meta_label = ImageFont.truetype(font_path_regular, 10)
        f_meta_val = ImageFont.truetype(font_path_bold, 11)
        f_tbl_head = ImageFont.truetype(font_path_bold, 10)
        f_tbl_row = ImageFont.truetype(font_path_regular, 9)
        f_tbl_row_bold = ImageFont.truetype(font_path_bold, 9)
        f_stamp = ImageFont.truetype(font_path_bold, 10)
    except:
        f_title_main = ImageFont.load_default()
        f_sub = f_sub_reg = f_cor_banner = f_meta_label = f_meta_val = f_tbl_head = f_tbl_row = f_tbl_row_bold = f_stamp = f_title_main

    # 1. Logos
    try:
        cvsu_logo = Image.open('public/cvsu.png').convert('RGBA')
        cvsu_logo = cvsu_logo.resize((70, 70), Image.Resampling.LANCZOS)
        img.paste(cvsu_logo, (35, 30), cvsu_logo)
    except Exception as e:
        print('CVSU logo load note:', e)

    try:
        ched_logo = Image.open('public/ched-logo.png').convert('RGBA')
        ched_logo = ched_logo.resize((70, 70), Image.Resampling.LANCZOS)
        img.paste(ched_logo, (width - 105, 30), ched_logo)
    except Exception as e:
        print('CHED logo load note:', e)

    # 2. Header Text
    draw.text((width // 2, 32), 'Republic of the Philippines', fill='#4b5563', font=f_sub_reg, anchor='mm')
    draw.text((width // 2, 48), 'CAVITE STATE UNIVERSITY', fill='#064e3b', font=f_title_main, anchor='mm')
    draw.text((width // 2, 68), 'Naic Campus • Bucana Malaki, Naic, Cavite', fill='#047857', font=f_sub, anchor='mm')
    draw.text((width // 2, 84), 'OFFICE OF THE UNIVERSITY REGISTRAR', fill='#374151', font=f_sub_reg, anchor='mm')

    # COR banner
    banner_y = 100
    draw.rectangle([160, banner_y, width - 160, banner_y + 26], fill='#ecfdf5', outline='#059669', width=1)
    draw.text((width // 2, banner_y + 13), 'CERTIFICATE OF REGISTRATION (COR)', fill='#065f46', font=f_cor_banner, anchor='mm')
    draw.text((width // 2, banner_y + 36), 'ACADEMIC YEAR 2026-2027 • FIRST SEMESTER', fill='#1f2937', font=f_sub, anchor='mm')

    # Watermark in center background
    watermark_text = "OFFICIAL REGISTRATION • CVSU NAIC"
    watermark_layer = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    w_draw = ImageDraw.Draw(watermark_layer)
    try:
        f_watermark = ImageFont.truetype(font_path_bold, 40)
    except:
        f_watermark = f_title_main
    w_draw.text((width // 2, height // 2 - 40), watermark_text, fill=(6, 95, 70, 14), font=f_watermark, anchor='mm')
    img.paste(watermark_layer, (0, 0), watermark_layer)

    # 3. Student Identification Information Box
    box_y = 150
    box_h = 100
    draw.rectangle([35, box_y, width - 35, box_y + box_h], fill='#f9fafb', outline='#d1d5db', width=1)
    draw.rectangle([35, box_y, width - 35, box_y + 20], fill='#064e3b')
    draw.text((45, box_y + 10), 'STUDENT REGISTRATION PROFILE', fill='#ffffff', font=f_sub, anchor='lm')

    # Details inside box (2 columns)
    row1_y = box_y + 32
    row2_y = box_y + 54
    row3_y = box_y + 76

    draw.text((45, row1_y), 'Student ID Number:', fill='#6b7280', font=f_meta_label)
    draw.text((160, row1_y), student_id, fill='#064e3b', font=f_meta_val)

    draw.text((470, row1_y), 'Date Enrolled:', fill='#6b7280', font=f_meta_label)
    draw.text((580, row1_y), 'August 28, 2026', fill='#111827', font=f_meta_val)

    draw.text((45, row2_y), 'Student Name:', fill='#6b7280', font=f_meta_label)
    draw.text((160, row2_y), full_name.upper(), fill='#111827', font=f_meta_val)

    draw.text((470, row2_y), 'Enrollment Status:', fill='#6b7280', font=f_meta_label)
    draw.text((580, row2_y), 'Regular • Officially Enrolled', fill='#047857', font=f_meta_val)

    draw.text((45, row3_y), 'Degree Program:', fill='#6b7280', font=f_meta_label)
    draw.text((160, row3_y), f"{program} ({section})", fill='#111827', font=f_meta_val)

    draw.text((470, row3_y), 'NSTP Component:', fill='#6b7280', font=f_meta_label)
    draw.text((580, row3_y), f"NSTP 1 - {dept}", fill='#b45309', font=f_meta_val)

    # 4. Enrolled Schedule / Course List Table
    tbl_y = 265
    draw.rectangle([35, tbl_y, width - 35, tbl_y + 22], fill='#064e3b')
    draw.text((45, tbl_y + 11), 'OFFICIALLY ENROLLED COURSES / SUBJECTS', fill='#ffffff', font=f_sub, anchor='lm')

    th_y = tbl_y + 22
    draw.rectangle([35, th_y, width - 35, th_y + 20], fill='#e5e7eb', outline='#d1d5db', width=1)
    draw.text((45, th_y + 10), 'CODE', fill='#111827', font=f_tbl_head, anchor='lm')
    draw.text((120, th_y + 10), 'COURSE TITLE / DESCRIPTION', fill='#111827', font=f_tbl_head, anchor='lm')
    draw.text((430, th_y + 10), 'UNITS', fill='#111827', font=f_tbl_head, anchor='mm')
    draw.text((480, th_y + 10), 'LEC', fill='#111827', font=f_tbl_head, anchor='mm')
    draw.text((520, th_y + 10), 'LAB', fill='#111827', font=f_tbl_head, anchor='mm')
    draw.text((610, th_y + 10), 'SCHEDULE / DAYS', fill='#111827', font=f_tbl_head, anchor='mm')
    draw.text((740, th_y + 10), 'TIME', fill='#111827', font=f_tbl_head, anchor='mm')
    draw.text((830, th_y + 10), 'ROOM', fill='#111827', font=f_tbl_head, anchor='mm')

    # Subject list customized by program & dept
    dept_label = 'Civic Welfare Training Service' if dept == 'CWTS' else ("Reserve Officers' Training Corps" if dept == 'ROTC' else 'Literacy Training Service')
    subjects = [
        ('GNED 01', 'Art Appreciation', '3.0', '3', '0', 'MON / THU', '08:00 - 09:30 AM', 'ACAD 201'),
        ('GNED 03', 'Mathematics in the Modern World', '3.0', '3', '0', 'TUE / FRI', '08:00 - 09:30 AM', 'ACAD 202'),
        ('GNED 06', 'Purposive Communication', '3.0', '3', '0', 'MON / THU', '10:00 - 11:30 AM', 'ACAD 201'),
        ('ITEC 50' if 'Tech' in program else 'COSC 50', 'Computer Systems & Modern Applications', '3.0', '2', '3', 'TUE / FRI', '10:00 - 12:30 PM', 'COMLAB 1'),
        ('MATH 10', 'Discrete Mathematics / Analytics', '3.0', '3', '0', 'WED', '08:00 - 11:00 AM', 'ACAD 105'),
        ('FITT 1', 'Movement Competency Training', '2.0', '2', '0', 'WED', '01:00 - 03:00 PM', 'GYMNASIUM'),
        ('NSTP 1', f'National Service Training Program 1 ({dept})', '3.0', '3', '0', 'SATURDAY', '08:00 - 11:00 AM', 'CVSU FIELD')
    ]

    curr_y = th_y + 20
    for idx, (code, title, units, lec, lab, days, time, room) in enumerate(subjects):
        is_nstp = code == 'NSTP 1'
        row_bg = '#fef3c7' if is_nstp else ('#ffffff' if idx % 2 == 0 else '#f9fafb')
        draw.rectangle([35, curr_y, width - 35, curr_y + 26], fill=row_bg, outline='#e5e7eb', width=1)
        
        c_font = f_tbl_row_bold if is_nstp else f_tbl_row
        t_color = '#92400e' if is_nstp else '#111827'
        
        draw.text((45, curr_y + 13), code, fill='#064e3b' if is_nstp else '#374151', font=f_tbl_row_bold, anchor='lm')
        draw.text((120, curr_y + 13), title, fill=t_color, font=c_font, anchor='lm')
        draw.text((430, curr_y + 13), units, fill=t_color, font=c_font, anchor='mm')
        draw.text((480, curr_y + 13), lec, fill=t_color, font=f_tbl_row, anchor='mm')
        draw.text((520, curr_y + 13), lab, fill=t_color, font=f_tbl_row, anchor='mm')
        draw.text((610, curr_y + 13), days, fill=t_color, font=c_font, anchor='mm')
        draw.text((740, curr_y + 13), time, fill=t_color, font=f_tbl_row, anchor='mm')
        draw.text((830, curr_y + 13), room, fill=t_color, font=f_tbl_row, anchor='mm')
        curr_y += 26

    # Totals bar
    draw.rectangle([35, curr_y, width - 35, curr_y + 24], fill='#f3f4f6', outline='#d1d5db', width=1)
    draw.text((45, curr_y + 12), 'TOTAL REGISTERED UNITS:', fill='#111827', font=f_sub, anchor='lm')
    draw.text((430, curr_y + 12), '20.0', fill='#064e3b', font=f_title_main, anchor='mm')
    draw.text((610, curr_y + 12), 'TOTAL ACADEMIC SUBJECTS: 7', fill='#374151', font=f_sub_reg, anchor='mm')

    # 5. Financial / UniFAST Assessment Box
    fin_y = curr_y + 35
    draw.rectangle([35, fin_y, width - 35, fin_y + 120], fill='#ffffff', outline='#d1d5db', width=1)
    draw.rectangle([35, fin_y, width - 35, fin_y + 20], fill='#064e3b')
    draw.text((45, fin_y + 10), 'ASSESSMENT & BILLING SUMMARY (R.A. 10931 FREE HIGHER EDUCATION)', fill='#ffffff', font=f_sub, anchor='lm')

    draw.text((45, fin_y + 35), 'Tuition Fee (20 Units @ ₱200/unit):', fill='#4b5563', font=f_tbl_row)
    draw.text((320, fin_y + 35), '₱ 4,000.00', fill='#111827', font=f_tbl_row_bold, anchor='rm')

    draw.text((45, fin_y + 55), 'NSTP Component Training Fee:', fill='#4b5563', font=f_tbl_row)
    draw.text((320, fin_y + 55), '₱   600.00', fill='#111827', font=f_tbl_row_bold, anchor='rm')

    draw.text((45, fin_y + 75), 'Total Miscellaneous & Laboratory Fees:', fill='#4b5563', font=f_tbl_row)
    draw.text((320, fin_y + 75), '₱ 1,850.00', fill='#111827', font=f_tbl_row_bold, anchor='rm')

    draw.line([(45, fin_y + 90), (320, fin_y + 90)], fill='#9ca3af', width=1)
    draw.text((45, fin_y + 102), 'Total Assessed Institution Fees:', fill='#111827', font=f_sub, anchor='lm')
    draw.text((320, fin_y + 102), '₱ 6,450.00', fill='#111827', font=f_sub, anchor='rm')

    # Right side of financial box (UniFAST Subsidy)
    draw.rectangle([450, fin_y + 30, width - 50, fin_y + 105], fill='#ecfdf5', outline='#059669', width=1)
    draw.text((465, fin_y + 45), 'SUBSIDY STATUS: CHED-UniFAST BENEFICIARY', fill='#065f46', font=f_sub)
    draw.text((465, fin_y + 65), 'Subsidized by National Government (R.A. 10931):', fill='#374151', font=f_tbl_row)
    draw.text((width - 65, fin_y + 65), '- ₱ 6,450.00', fill='#059669', font=f_tbl_row_bold, anchor='rm')
    draw.text((465, fin_y + 88), 'NET AMOUNT PAYABLE BY STUDENT:', fill='#064e3b', font=f_sub)
    draw.text((width - 65, fin_y + 88), '₱ 0.00 (FULLY COVERED)', fill='#059669', font=f_title_main, anchor='rm')

    # 6. Official Stamp & Signatures Box
    sig_y = fin_y + 135
    draw.rectangle([35, sig_y, width - 35, sig_y + 120], fill='#f9fafb', outline='#e5e7eb', width=1)

    # Left: Student pledge
    draw.text((45, sig_y + 18), 'STUDENT PLEDGE:', fill='#111827', font=f_sub)
    pledge_txt = "I hereby certify that all information submitted is true and correct, and I agree to abide\nby all the rules, regulations, and NSTP guidelines of Cavite State University."
    draw.text((45, sig_y + 36), pledge_txt, fill='#4b5563', font=f_tbl_row)
    draw.line([(45, sig_y + 90), (280, sig_y + 90)], fill='#9ca3af', width=1)
    draw.text((162, sig_y + 102), 'Student Signature / Conforme', fill='#6b7280', font=f_tbl_row, anchor='mm')

    # Center: Registrar Official Seal
    seal_x = 440
    seal_y = sig_y + 60
    draw.ellipse([seal_x - 45, seal_y - 45, seal_x + 45, seal_y + 45], outline='#dc2626', width=2)
    draw.ellipse([seal_x - 40, seal_y - 40, seal_x + 40, seal_y + 40], outline='#dc2626', width=1)
    draw.text((seal_x, seal_y - 20), 'OFFICIALLY', fill='#dc2626', font=f_stamp, anchor='mm')
    draw.text((seal_x, seal_y), 'ENROLLED', fill='#dc2626', font=f_stamp, anchor='mm')
    draw.text((seal_x, seal_y + 15), 'CVSU NAIC', fill='#dc2626', font=f_tbl_row, anchor='mm')
    draw.text((seal_x, seal_y + 26), 'REGISTRAR', fill='#dc2626', font=f_tbl_row, anchor='mm')

    # Right: University Registrar Signing
    reg_x = width - 180
    draw.line([(reg_x - 110, sig_y + 90), (reg_x + 110, sig_y + 90)], fill='#111827', width=1)
    draw.text((reg_x, sig_y + 75), 'ATTY. NORIEL C. BALLESTEROS', fill='#111827', font=f_sub, anchor='mm')
    draw.text((reg_x, sig_y + 102), 'University Registrar / Campus Registrar', fill='#6b7280', font=f_tbl_row, anchor='mm')

    # 7. Barcode & Security Verification Footer
    footer_y = height - 45
    draw.rectangle([35, footer_y, width - 35, footer_y + 24], fill='#064e3b')
    draw.text((45, footer_y + 12), f'OFFICIAL CVSU ENROLLMENT RECORD • QR/SYS-REF: CVSU-NAIC-2026-{student_id} • DATA PRIVACY PROTECTED', fill='#ffffff', font=f_tbl_row, anchor='lm')
    draw.text((width - 45, footer_y + 12), 'PAGE 1 OF 1', fill='#ffffff', font=f_tbl_row, anchor='rm')

    # Save image
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img.save(filename, 'JPEG', quality=88, optimize=True)
    print(f'Successfully generated COR for {student_id} -> {filename}')

if __name__ == '__main__':
    create_cor_image('202610001', 'CRUZ, ANGELO DELA CRUZ', 'BS Information Technology', 'BSIT 1-A', 'CWTS', 'public/id-photos/sample-cor.jpg')
