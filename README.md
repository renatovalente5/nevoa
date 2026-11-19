# NEVOA Premium Services — site

Site da NEVOA Premium Services (limpeza profissional para casas e empresas, e lavandaria & engomadoria com recolha e
entrega, em Felgueiras e no distrito do Porto). Pré-visualização: https://renatovalente5.github.io/nevoa/ (noindex),
com as três propostas da página inicial: A «Névoa» (na raiz), B «Seda» e C «Vidro» (em `/propostas/b|c/`, com o site
inteiro em cada uma).

    python3 scripts/imagens.py          # versões AVIF/WebP das fotografias, da marca, ícones e cartão de partilha (.cache/imagens)
    node scripts/build.mjs              # o site em _site/ (--base, --url, --producao, --sem-propostas)
    node scripts/testar.mjs             # provas do site construído
    python3 -m http.server 5210 --directory _site

Conteúdo em `content/` (site.json: marca, contactos, zona, proposta escolhida; servicos.json: espaços, tipos de
limpeza, roupa, passos; fotos.json: as descrições), fotografias e vídeos em `media/` (recortados das publicações e
destaques do Instagram @nevoaservices, sem o texto por cima), o logótipo deles recortado do preto sem redesenhar em
`media/marca/`, o desenho em `src/` (letra Gantari, SIL OFL). As peças legais vêm de `legal-comum/`.
