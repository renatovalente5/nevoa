#!/usr/bin/env python3
"""As versões web das imagens do site da NEVOA Premium Services.

Lê:
  media/fotos/*.jpg        as fotografias (cada uma tem de estar em content/fotos.json, com a descrição)
  media/videos/*.jpg       a imagem de espera (poster) de cada vídeo
  media/marca/*.png        o logótipo deles, recortado do preto SEM redesenhar (desde 21 nov 2026 dos ficheiros
                           originais que o João mandou: _cliente/ferramentas/logotipo-original.py):
                           completo (empilhado), emblema (o N no anel), palavra (NEVOA), palavra-linha (NEVOA +
                           PREMIUM SERVICES); as «-escuro» são a mesma máscara no bronze dos destaques claros deles
  media/marca/perfil.jpg   a fotografia de perfil do Instagram (dourado sobre preto), para os ícones

Escreve em .cache/imagens/ (o nome de cada ficheiro leva um resumo do original: só se refaz o que muda) e o manifesto
.cache/imagens/manifesto.json, que o scripts/build.mjs lê para escrever os <picture> e copiar para _site/ só o que
as páginas usam. Para o painel (backoffice), de cada fotografia: uma miniatura de 320 px e uma grande de 1200 px em
WebP, que o build.mjs põe em assets/fotos/ com o nome fixo (miniatura-<nome>.webp, grande-<nome>.webp).

    python3 scripts/imagens.py
"""
import glob, hashlib, json, os, sys
try:
    from PIL import Image, ImageOps, features
except ImportError:  # o Python do Mac tem a Pillow na pasta do utilizador
    sys.path.append(os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages'))
    from PIL import Image, ImageOps, features

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FOTOS = os.path.join(RAIZ, 'media', 'fotos')
VIDEOS = os.path.join(RAIZ, 'media', 'videos')
MARCA = os.path.join(RAIZ, 'media', 'marca')
INDICE = os.path.join(RAIZ, 'content', 'fotos.json')
CACHE = os.path.join(RAIZ, '.cache', 'imagens')

LARGURAS = [360, 540, 720, 960, 1280]
FORMATOS = ('avif', 'webp') if features.check('avif') else ('webp',)
QUALIDADE = {'avif': 52, 'webp': 80}
PARTILHA = (1200, 630)
PRETO = (0, 0, 0)            # o fundo do logótipo deles (medido: #000000)
VERSAO = f'v1-{LARGURAS}-{QUALIDADE}-{PARTILHA}'

# alturas em que cada peça da marca aparece (×1, ×2, ×3): cabeçalho 22–28 px, rodapé ~90, capa ~180
ALTURAS_MARCA = {
    'palavra': (22, 24, 26, 28, 44, 48, 52, 56, 66, 72, 78, 84),
    'palavra-escuro': (22, 24, 26, 28, 44, 48, 52, 56, 66, 72, 78, 84),
    'palavra-linha': (40, 48, 60, 72, 80, 96, 120, 144, 160, 180, 211),
    'palavra-linha-escuro': (40, 48, 60, 72, 80, 96, 120, 144, 160, 180, 211),
    # o completo vai também à intro (até ~320 px de altura): 640 e 823 (o original) para os ecrãs de 2× e 3×
    'completo': (96, 120, 160, 192, 240, 288, 320, 360, 480, 556, 640, 823),
    'completo-escuro': (96, 120, 160, 192, 240, 288, 320, 360, 480, 556),
    # o emblema da capa vai até ~290 px de altura: 640 e 720 para os ecrãs de 2× e 3× (o original tem 1108 px)
    'emblema': (32, 40, 48, 64, 80, 96, 120, 144, 160, 240, 320, 480, 640, 720),
    'emblema-escuro': (32, 40, 48, 64, 80, 96, 120, 144, 160, 240, 320),
}


def resumo(caminho, extra=''):
    h = hashlib.sha256((VERSAO + extra).encode())
    with open(caminho, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()[:10]


def guardar(im, destino, formato, **kw):
    if os.path.exists(destino):
        return
    tmp = destino + '.tmp'
    if formato == 'avif':
        im.save(tmp, 'AVIF', quality=QUALIDADE['avif'], speed=6)
    elif formato == 'webp':
        im.save(tmp, 'WEBP', quality=kw.get('q', QUALIDADE['webp']), method=6)
    elif formato == 'png':
        im.save(tmp, 'PNG', optimize=True)
    else:
        im.save(tmp, 'JPEG', quality=kw.get('q', 82), optimize=True, progressive=True,
                subsampling=kw.get('subsampling', 2))
    os.replace(tmp, destino)


def versoes(nome, origem):
    """AVIF + WebP nas larguras que a imagem aguenta (nunca se aumenta), um JPEG de recurso e o cartão de partilha."""
    h = resumo(origem)
    with Image.open(origem) as cab:
        W, H = cab.size
    larguras = sorted(set([w for w in LARGURAS if w < W] + [min(W, LARGURAS[-1])]))
    jw = min(W, 960)
    feito = [os.path.join(CACHE, f'{nome}-{h}-{w}.{fmt}') for w in larguras for fmt in FORMATOS]
    feito += [os.path.join(CACHE, f'{nome}-{h}-{jw}.jpg'), os.path.join(CACHE, f'{nome}-{h}-partilha.jpg')]
    info = {'w': W, 'h': H, 'resumo': h, 'larguras': larguras, 'formatos': list(FORMATOS), 'jpg': jw}
    if all(os.path.exists(f) for f in feito):
        return info
    im = ImageOps.exif_transpose(Image.open(origem)).convert('RGB')
    for w in larguras:
        r = im if w == W else im.resize((w, round(H * w / W)), Image.LANCZOS)
        for fmt in FORMATOS:
            guardar(r, os.path.join(CACHE, f'{nome}-{h}-{w}.{fmt}'), fmt)
    guardar(im if jw == W else im.resize((jw, round(H * jw / W)), Image.LANCZOS),
            os.path.join(CACHE, f'{nome}-{h}-{jw}.jpg'), 'jpg')
    # cartão de partilha 1200×630, recortado ao meio (as fotografias são quase todas ao alto)
    pw, ph = PARTILHA
    esc = max(pw / W, ph / H)
    r = im.resize((round(W * esc), round(H * esc)), Image.LANCZOS)
    x = (r.width - pw) // 2
    y = max(0, min(r.height - ph, round(r.height * 0.5 - ph / 2)))
    guardar(r.crop((x, y, x + pw, y + ph)), os.path.join(CACHE, f'{nome}-{h}-partilha.jpg'), 'jpg')
    return info


PAINEL = (('miniatura', 320), ('grande', 1200))


def painel(nome, origem):
    """As duas versões que o painel mostra (as listas e a janela de cada fotografia), nunca aumentadas."""
    h = resumo(origem, extra=f'painel-{PAINEL}')
    out = {tipo: f'painel-{tipo}-{nome}-{h}.webp' for tipo, _ in PAINEL}
    if all(os.path.exists(os.path.join(CACHE, f)) for f in out.values()):
        return out
    im = ImageOps.exif_transpose(Image.open(origem)).convert('RGB')
    for tipo, w in PAINEL:
        r = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        guardar(r, os.path.join(CACHE, out[tipo]), 'webp', q=82)
    return out


def marca():
    """As peças do logótipo nas alturas em que aparecem, os ícones e o cartão de partilha."""
    out = {}
    for chave, alturas in ALTURAS_MARCA.items():
        origem = os.path.join(MARCA, chave + '.png')
        im = Image.open(origem).convert('RGBA')
        h = resumo(origem)
        item = {'w': im.width, 'h': im.height, 'resumo': h, 'alturas': []}
        for alt in sorted(set(min(a, im.height) for a in alturas)):
            w = round(im.width * alt / im.height)
            r = im if alt == im.height else im.resize((w, alt), Image.LANCZOS)
            guardar(r, os.path.join(CACHE, f'{chave}-{h}-{alt}.png'), 'png')
            guardar(r, os.path.join(CACHE, f'{chave}-{h}-{alt}.webp'), 'webp', q=90)
            item['alturas'].append(alt)
        out[chave] = item
    # ícones: o emblema dourado (o N no anel) sobre o preto do logótipo, como na fotografia de perfil
    emb = Image.open(os.path.join(MARCA, 'emblema.png')).convert('RGBA')
    he = out['emblema']['resumo']
    for lado in (32, 180, 192, 512):
        q = Image.new('RGBA', (lado, lado), PRETO + (255,))
        margem = 0.1 if lado == 32 else 0.16
        caixa = round(lado * (1 - 2 * margem))
        r = emb.copy(); r.thumbnail((caixa, caixa), Image.LANCZOS)
        q.alpha_composite(r, ((lado - r.width) // 2, (lado - r.height) // 2))
        guardar(q.convert('RGB'), os.path.join(CACHE, f'icone-{he}-{lado}.png'), 'png')
    out['icones'] = [32, 180, 192, 512]
    # cartão de partilha da marca: o logótipo inteiro ao centro, no preto deles, ao tamanho do desenho (nunca aumentado)
    comp = Image.open(os.path.join(MARCA, 'completo.png')).convert('RGBA')
    hc = resumo(os.path.join(MARCA, 'completo.png'), extra=f'cartao-{PRETO}-{PARTILHA}')
    out['partilha'] = f'nevoa-premium-services-{hc}-partilha.jpg'
    destino = os.path.join(CACHE, out['partilha'])
    if not os.path.exists(destino):
        cartao = Image.new('RGBA', PARTILHA, PRETO + (255,))
        r = comp.copy()
        r.thumbnail((PARTILHA[0] - 160, PARTILHA[1] - 120), Image.LANCZOS)  # só encolhe se não couber
        cartao.alpha_composite(r, ((PARTILHA[0] - r.width) // 2, (PARTILHA[1] - r.height) // 2))
        guardar(cartao.convert('RGB'), destino, 'jpg', q=92, subsampling=0)
    return out


def main():
    indice = json.load(open(INDICE, encoding='utf-8'))
    fotos = {os.path.splitext(os.path.basename(f))[0]: f for f in sorted(glob.glob(os.path.join(FOTOS, '*.jpg')))}
    sem_indice = sorted(set(fotos) - set(indice))
    sem_ficheiro = sorted(set(indice) - set(fotos))
    if sem_indice or sem_ficheiro:
        if sem_indice:
            print('Fotografias sem entrada em content/fotos.json:', ', '.join(sem_indice))
        if sem_ficheiro:
            print('Entradas de content/fotos.json sem fotografia:', ', '.join(sem_ficheiro))
        sys.exit(1)
    os.makedirs(CACHE, exist_ok=True)
    manifesto = {'fotos': {}, 'painel': {}, 'videos': {}, 'marca': None}
    for nome, f in fotos.items():
        manifesto['fotos'][nome] = versoes(nome, f)
        manifesto['painel'][nome] = painel(nome, f)
    for f in sorted(glob.glob(os.path.join(VIDEOS, '*.jpg'))):
        nome = os.path.splitext(os.path.basename(f))[0]
        info = versoes('video-' + nome, f)
        mp4 = os.path.join(VIDEOS, nome + '.mp4')
        info['mp4'] = resumo(mp4)
        manifesto['videos'][nome] = info
    manifesto['marca'] = marca()
    with open(os.path.join(CACHE, 'manifesto.json'), 'w', encoding='utf-8') as f:
        json.dump(manifesto, f, ensure_ascii=False, indent=1)
    print(f"{len(manifesto['fotos'])} fotografias, {len(manifesto['videos'])} vídeos e a marca.")


if __name__ == '__main__':
    main()
