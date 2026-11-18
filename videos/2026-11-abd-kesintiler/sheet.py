import sys, glob
from PIL import Image
name, times = sys.argv[1], sys.argv[2].split(',')
ims = [Image.open(f'out/stills/{name}-{t}.png').resize((270, 480)) for t in times]
cols = 5; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (270 * cols, 480 * rows))
for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * 270, (i // cols) * 480))
sheet.save(f'out/stills/sheet-{name}.png')
