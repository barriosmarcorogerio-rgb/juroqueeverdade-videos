"""Capa vertical (padrão Shorts/Reels): um quadro da animação, sem texto, com leve realce de cor e contraste.
uso: python3 thumb.py frames/fNNNN.jpg saida.jpg   -> cover_ms = NNNN/30*1000
Escolha um quadro com o personagem em close, expressão exagerada e o objeto-chave visível."""
import sys
from PIL import Image, ImageEnhance
im = Image.open(sys.argv[1]).convert('RGB')
im = ImageEnhance.Color(im).enhance(1.15); im = ImageEnhance.Contrast(im).enhance(1.06)
im.save(sys.argv[-1], quality=90); print(sys.argv[-1])
