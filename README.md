# NEVOA Premium Services — site

Site da NEVOA Premium Services, um grupo com divisões (21 nov 2026, o João, dono da NEVOA): NEVOA Cleaning
(limpezas profissionais), NEVOA Laundry (lavandaria e engomadoria, em breve) e NEVOA Express (recolhas e entregas, em
breve). Sede em Felgueiras, a trabalhar em todo o Norte. No ar em https://nevoagroup.pt desde 22 nov 2026 (o
renatovalente5.github.io/nevoa/ reencaminha), indexável: mapa do site com as datas do git, Search Console e Bing, e o
IndexNow avisa o Bing depois de cada publicação (`scripts/indexnow.mjs`). O desenho é a proposta A «Névoa»; as outras duas (B «Seda», C
«Vidro») só se constroem com `--propostas`, localmente. A página inicial abre com a intro (o logótipo
verdadeiro deles a sair da névoa dourada, em HTML e CSS), uma vez por visita.

    python3 scripts/imagens.py          # versões AVIF/WebP das fotografias, da marca, ícones e cartão de partilha (.cache/imagens)
    node scripts/build.mjs              # o site em _site/ (--base, --url, --producao, --sem-propostas)
    node scripts/testar.mjs             # provas do site construído
    python3 -m http.server 5210 --directory _site

Conteúdo em `content/` (site.json: marca, contactos, zona, proposta escolhida; servicos.json: as divisões (uma
divisão nova = uma entrada na lista e a página dela), espaços, tipos de limpeza, roupa, passos; fotos.json: as descrições), fotografias e vídeos em `media/` (recortados das publicações e
destaques do Instagram @nevoaservices, sem o texto por cima), o logótipo deles recortado do preto sem redesenhar em
`media/marca/` (desde 21 nov 2026 a partir dos ficheiros originais que o João mandou), o desenho em `src/` (letra Gantari, SIL OFL). As peças legais vêm de `legal-comum/`.
