"""Rebuild approved crops without generative face restoration; requires Pillow."""
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter

root = Path(__file__).resolve().parents[1]
settings = [
    (1, 'KakaoTalk_Photo_2026-11-17-23-28-49.jpeg', (176, 292, 890, 1335), 45),
    (3, 'KakaoTalk_Photo_2026-11-17-23-28-08.jpeg', (88, 386, 982, 1473), 45),
    (15, 'KakaoTalk_Photo_2026-11-07-23-27-24.jpeg', (330, 702, 700, 1050), 45),
]
for number, filename, (x, y, width, height), amount in settings:
    with Image.open(root / filename) as source:
        im = ImageOps.exif_transpose(source).convert('RGB')
        assert im.width * 3 == im.height * 2
        sx, sy = im.width / 1280, im.height / 1920
        box = (x*sx, y*sy, (x+width)*sx, (y+height)*sy)
        assert box[2] <= im.width and box[3] <= im.height
        result = im.resize((1280, 1920), Image.Resampling.LANCZOS, box=box)
        result = result.filter(ImageFilter.UnsharpMask(radius=0.8, percent=amount, threshold=2))
        output = root / f'assets/photo-{number:02d}-enhanced.webp'
        result.save(output, 'WEBP', quality=98, method=6)
        print(f'{output.name}: source {im.size}, crop {width*sx:g}x{height*sy:g}, output {result.size}')
