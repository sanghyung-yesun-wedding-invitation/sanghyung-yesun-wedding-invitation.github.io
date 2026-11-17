"""Apply approved original-pixel crops; requires Pillow. Originals stay untouched."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
crops = [(1, (176, 292, 890, 1335)), (3, (88, 386, 982, 1473)), (15, (423, 794, 596, 894))]
for number, (x, y, width, height) in crops:
    source = root / f'assets/photo-{number:02d}.webp'
    target = root / f'assets/photo-{number:02d}-cropped.webp'
    with Image.open(source) as original:
        assert original.size == (1280, 1920)
        assert width * 3 == height * 2
        assert x >= 0 and y >= 0 and x + width <= original.width and y + height <= original.height
        cropped = original.crop((x, y, x + width, y + height))
        resized = cropped.resize((1280, 1920), Image.Resampling.LANCZOS)
        resized.save(target, 'WEBP', quality=95, method=6, **({'icc_profile': original.info['icc_profile']} if original.info.get('icc_profile') else {}))
    with Image.open(target) as result:
        assert result.size == (1280, 1920)
    print(f'{target.name}: {width}x{height} -> 1280x1920')
