from PIL import Image, ImageDraw

def create_signature():
    width = 300
    height = 90
    img = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    ink_color = (30, 58, 138, 255) # Deep blue ink #1e3a8a
    
    # Draw smooth cursive curves for realistic signature
    points = [
        (25, 60), (35, 20), (45, 15), (55, 30), (60, 42), (55, 65),
        (75, 50), (90, 38), (105, 22), (120, 40), (130, 48), (140, 35),
        (150, 45), (165, 55), (175, 28), (190, 42), (205, 55), (220, 38),
        (240, 48), (255, 52), (270, 45), (285, 52)
    ]
    
    # Draw thick smooth curve line
    draw.line(points, fill=ink_color, width=4, joint='curve')

    # Draw flourish baseline underline
    underline_pts = [(40, 70), (80, 64), (140, 60), (200, 62), (260, 65), (280, 68)]
    draw.line(underline_pts, fill=ink_color, width=3, joint='curve')

    out_path = '/Users/Chardddddyyyyy/Documents/NSTP/nstp-system/public/signature.png'
    img.save(out_path, 'PNG')
    print("✅ Created public/signature.png")

if __name__ == '__main__':
    create_signature()
