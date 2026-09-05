import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from generate_cor import create_cor_image

def generate_canonical_cors():
    os.makedirs('public/id-photos', exist_ok=True)
    
    # 1. CWTS Sample COR
    create_cor_image(
        '202610001',
        'DELA CRUZ, JUAN SANTOS',
        'BS Information Technology',
        'BSIT 1-A',
        'CWTS',
        'public/id-photos/cor-cwts.jpg'
    )
    
    # 2. ROTC Sample COR
    create_cor_image(
        '202610002',
        'RAMOS, MARK CHRISTIAN BAUTISTA',
        'BS Computer Science',
        'BSCS 1-A',
        'ROTC',
        'public/id-photos/cor-rotc.jpg'
    )
    
    # 3. LTS Sample COR
    create_cor_image(
        '202610003',
        'SANTOS, MARIA ALYSSA MERCADO',
        'Bachelor of Secondary Education - English',
        'BSEd 1-A',
        'LTS',
        'public/id-photos/cor-lts.jpg'
    )
    print('Canonical departmental CORs generated successfully in public/id-photos/.')

if __name__ == '__main__':
    generate_canonical_cors()
