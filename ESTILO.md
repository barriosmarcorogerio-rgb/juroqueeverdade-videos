# Estilo "Juro Que É Verdade" — tirado dos 3 vídeos de referência

## Roteiro (o mais importante)
Duração: 55–65 s, ~150–170 palavras, ~2,7 palavras/s (decisão do dono: vídeos longos; ver "Duração" abaixo). Narrador único, tom de contador de história, presente do indicativo.

1. **Abre no meio de uma ação estranha** (sem "olá", sem contexto): "Ele carregou a espingarda com ouro e atirou na parede da mina." / "Ele fez 82 furos numa tábua." / "Se você planta uma árvore do lado de uma estrada vazia, os carros vão bater nela."
2. **Um coadjuvante zomba ou estranha** com uma fala curta em discurso direto: "Então a gente tá atirando ouro numa mina de ouro?" / "A gente vai lutar ou ralar queijo?"
3. **"Veja bem..." / "Acontece que..."** dá o contexto mínimo (quem, onde, o que está em jogo) em 1–2 frases.
4. **Escalada em 4–6 batidas**, cada uma mais absurda, com objetos físicos fazendo a piada (placa gigante, cadeira de praia, casaco de guarda-chuva, tapa na mão).
5. **Personagens com papéis fixos**: o protagonista esquisito, o parceiro que duvida, a autoridade (xerife, comandante, ricaço), o especialista. Todos reagem com caras exageradas.
6. **"Mas fica mais estranho." / "Então, por que isso acontece?"** — vira a chave.
7. **Explicação com nome** ("Isso se chama fixação no alvo." / "Isso se chama salgar a mina.") + comparação do dia a dia.
8. **Desfecho irônico em 1–2 frases curtas**, que fecha o ciclo e é a última coisa dita: "...e bate direto no toco." / "...três metros depois de onde o último desistiu." / "...nem uma única flecha erra."

Regras: frases de 8–15 palavras; números por extenso; nada de descrever o óbvio; humor seco; sem moral explícita.

## Animação
- Personagens "cabeça de feijão" (2D) em mundo 3D detalhado e colorido; SEM contorno preto no cenário.
- Cortes a cada **1–2 s** (30–45 planos num vídeo de 60 s). Cada frase tem 1–3 planos.
- Ângulos: close de rosto reagindo, close no objeto-chave (ouro na bateia, furos na tábua, velocímetro), plano de dentro do carro/POV, drone/plano geral, contra-plongée, plano por cima do ombro, câmera seguindo objeto (flecha, foguete, carro).
- Luz conta a história: dia ensolarado → entardecer dourado → noite/chuva/tempestade no clímax → amanhecer no desfecho.
- Sempre algo se mexe: poeira, faíscas, fumaça, chuva, folhas.
- Texto dentro da cena para piadas (placa "NÃO BATA NESTA ÁRVORE", jornal "MILIONÁRIO CHEGA AMANHÃ", "3 METROS").

## Personagens (redesenho 2026-11-18, pedido do dono: "muito feios")
- Cabelo com estilo próprio por personagem (`hairStyle`: short, spiky, curly, bun, long, side, bald): franja em tufos com borda fina — NUNCA aquela faixa escura atravessando a testa (parecia capacete/sobrancelha). Boné/`cap` evitado pelo mesmo motivo.
- Mãos de luvinha com polegar (cor da pele), desenhadas POR CIMA do objeto: o personagem segura o cabo de verdade. Braços com manga (faixa com contorno), calça e sapato arredondado, bochecha rosada. Sem "saia" abaixo do tronco.
- Poses novas: `hold` (duas mãos na frente do peito, com `holdBoth: "objeto"`) e `give` (braço estendido para o lado: dois personagens em `give` frente a frente = entrega; troque `holdR` de um para `holdL` do outro no meio da fala).
- Objetos na mão não podem ser cortados: o cartão do personagem tem margem de 200 unidades de cada lado (`PAD`), cabendo braço esticado + pá/lanche.
- Mulheres precisam ser reconhecíveis num relance: `female: true` = silhueta de cintura e quadril (forma única), pescoço visível, cílios e batom leve, cabelo comprido (`long`, caindo atrás dos ombros) ou `ponytail`.
- Pegada: palma atrás do objeto, dedos na frente (o objeto passa ENTRE a mão, não por cima nem por baixo).
- Bichos: usar os de `animals.js` (camelo/mula, girafa, elefante, vaca, rato, dinossauro, urso, urubu) — contorno único (patas fundidas ao corpo), sombreado, olho com brilho. Bicho novo segue o mesmo método (`aGroup` + `aTaper` + `aEye`).
- Chão de campo: capim 3D no campo inteiro (FIELD GRASS), sem invadir plantação/estrada/horta; manchas grandes de cor no chão.
- Morros ao fundo: nunca esfera lisa de uma cor; usar `hillGeo` (contorno irregular) + `hillTexs` (campos, manchas de mata, árvores).
- Criaturas gigantes NÃO são personagem comum ampliado: usar `fxGiant` (contorno único com ombro/braço/perna fundidos ao tronco, peitoral e costelas, juntas ossudas, mãos com dedos, olheiras, sorriso com gengiva e dentes), 3 tipos: grin, tiny, long.
- Personagens: orelhas, narizinho, gola e dobras na roupa. Capacete de obra = `hardhat: true` (desenhado do tamanho da cabeça, com lanterna) — nunca cartão separado.
- Soldados (clima de anime de muralha, sem copiar): jaqueta curta marrom + camisa branca, calça branca, botas altas, arnês de correias (`straps`), aparelho de gancho na cintura (`gear`, `hookFire` dispara o cabo), lançador na mão (`holdR: 'grapple'`). NUNCA: símbolo de asas, capa verde com emblema, lâminas duplas com cilindros iguais aos do anime.
- Portas: nada atravessa porta fechada. O vão é um buraco de verdade na fachada com um cômodo iluminado atrás (não uma parede). A casa tem porta com batente, dobradiça, maçaneta e vão escuro; `world.door` (0→1) abre a folha. Personagem que sai de casa: abrir a porta nos ~0,5 s antes e começar a caminhada dentro do vão.
- Chão/paredes: câmera com near 0,15; estrada/areia/campos usam `decal()` (polygonOffset) para não piscar; capim do quintal baixo (não esconde as pernas).

## Legenda
Uma ou duas palavras por vez, centralizada a ~60% da altura, branca, fonte grossa, contorno preto. Sincronizada palavra a palavra.

## Som
Narração + trilha leve que para na virada + efeitos em cada ação (whoosh, batida, explosão).

## Aprendizados (feedback do dono do canal)
- **Objeto-chave tem que ser reconhecível num relance.** Um bloco 3D "realista" mal feito não lê como a coisa. Usar a forma ICÔNICA de desenho animado: carne = pedaço com osso (pernil/coxa com osso branco saindo), bife = formato de bife com borda de gordura e marcas. Conferir o objeto num close ANTES do render; se não der para dizer o que é em 1 segundo, refazer.
- **Roupas não podem criar volumes estranhos.** Saia/vestido desenhado como segunda forma abaixo do tronco parece "barriga dupla". Personagens: tronco único + pernas de palito, como nas referências. Avental pode.
- **Carne do template virava "ovo vermelho"** no close (osso escondido atrás). Usar a coxa em torno (LatheGeometry) deitada, com osso + 2 nós sempre de lado para a câmera, escala 0,6–1,0 (pedaço do tamanho da cabeça do personagem, não maior). Código pronto em `projetos/2026-11-17-chuva-de-carne/web/main.js` (`meatPiece`).
- **Closes cortavam a cabeça**: a cabeça do card fica ~1,7–1,9 m; mirar a câmera em y≈1,75 e a ≥2 m do rosto com fov 35–40.
- Mostrar a prévia (folha de quadros) com close do objeto-chave e de cada personagem novo antes do render longo.
- **Arquitetura coerente.** Telhado de varanda fica ABAIXO das janelas do andar de cima; nada atravessa janela, porta ou rosto. Conferir peças que se cruzam (colher atravessando carne, telhado cortando janela) em todos os ângulos da prévia.

### Aprendizados de 18–19/11 (vídeos longos e titãs) — conferir TODOS antes de renderizar
**Animação / personagens**
- Nunca personagem parado: o motor já faz gestos automáticos (braços alternam a cada ~1–2 s, ferramenta sobe e desce, balanço, olhar) e varia a expressão a cada ~2 s (16 expressões: neutral, stern, grin, laugh, smile, nervous, shock, angry, sad, cry, scared, terrified, surprised, smug, determined, excited, confused, disgust…). No plano, dar AÇÃO a cada frase: entrar andando (walk + to), cavar, apontar, cair (rollTo), correr. Uma pose fixa por 6–10 s foi a principal reclamação.
- Precisão do balanço/inclinação alta (q(…,5)/q(…,3)): arredondar fazia a cabeça "tremer" 1–2 px.
- Personagens diferentes precisam de silhueta diferente (cabelo, cor de cabelo, roupa) — não só a cor da roupa.
- Corda/escalada: pose 'grip' + climb=True; a corda é desenhada no próprio cartão (passa pelas mãos e entre as pernas). Corda 3D sozinha nunca alinha com o desenho.
- Voo de arpão: uma mão na corda ('reach'), lâmina na outra ('give'), corpo inclinado (roll). Nada de dois braços para cima. O gancho voa até cravar (ropes r[7] = quadros do disparo).
- Escala: pessoas ~1,7 m; criança s≈0.8 (não 0.6). Grama do campo abaixo do joelho — grama alta faz as pessoas parecerem anãs e esconde os pés dos gigantes.
**Titãs**
- Assustadores: órbitas fundas, olho pequeno parado, sobrancelha de raiva, sorriso esticado com muitos dentes, cabelo em mechas desiguais (nada de "capacete" em zigue-zague).
- Ponto fraco na nuca: mostrar o titã de PERFIL (side=1) para ver o rosto gritando + a nuca; decapitação com cabeça voando (decapFrac), toco jorrando, corpo caindo. Violência de desenho, sem órgãos.
- Gigantes com pés visíveis (sobem 0,45 m quando estão em y=0).
**Cenário**
- O mundo nasceu da fazenda: ao montar um lugar novo, CONFERIR o chão no nível da câmera (sobras de campo de trigo/grama aparecem). Cidade = calçamento contínuo + casas em enxaimel (não caixas lisas).
- Cenário vivo: pássaros, fumaça de chaminé, tochas, bandeiras ondulando.
- Nuvens: canvas alto o bastante (sem topo cortado).
**Objetos e gráficos**
- Todo gráfico explicativo precisa de RÓTULO na tela (ex.: cubos "1 CUBO" / "LADO 2x = 8 CUBOS!"). Sem texto o público não entende.
- A imagem tem que bater com a frase: se a narração cita algo (irmão mais novo, barbante), mostrar exatamente isso, na escala certa (barbante pequeno para criança; corda de navio para titã).
**Processo**
- Abrir a cena no nível da câmera de cada plano antes do render longo (prévia com 4–6 quadros) — o dono vê tudo de perto.
- Abertura de vídeo: começar com ação/personagem, nunca drone alto (perde o interesse e a grama tremula).
- Comentários em código JS: nunca colocar `//` antes de um `}` na mesma linha (já travou o render 2 vezes).
- Máquina tem 4 núcleos: 4 renders em paralelo, ~16 quadros/min nos cenários pesados.

## Duração e retenção (decidido pelo dono em 2026-11-17: vídeos LONGOS, 55–65 s)
- Dado do canal: teste de 10 s pegou ~1k views; versão de 58 s, 1 view em 6 h. O dono prefere manter os vídeos longos, então o trabalho é segurar a pessoa até o fim:
  - **Quadro 0 já com ação**: objeto-chave caindo/voando na tela; nada de plano de abertura parado.
  - **Uma piada ou surpresa a cada 5–8 s** (nova batida da escalada, objeto absurdo, reação exagerada).
  - **Promessa no começo** que só se paga no fim (ex.: "a explicação é nojenta" → revelação aos ~45 s).
  - **Final em loop**: a última frase/imagem conversa com a primeira, para o vídeo emendar sozinho.
- Nunca apagar vídeo publicado, mesmo teste: o histórico ajuda o canal.

## Voz (decidido pelo dono do canal)
Desde 19/11: **Gemini TTS, voz Fenrir, +5% de velocidade, sem mudar o tom** (o dono comparou Charon, Puck, Orus, Algenib, Sadachbia e 4 vozes brasileiras do ElevenLabs e preferiu a Fenrir original). Vale para longos, Shorts e cartelas. ElevenLabs está conectado (plano Creator, ~29 mil caracteres até 3/12), mas não é a voz do canal.

## Linha editorial (18/11, pedido do dono)
História antiga cansa o público. Prioridade: **curiosidades absurdas** (corpo, bichos, espaço, recordes) e **"E SE..."** inspirados no clima de séries/filmes famosos (zumbi, dragão, monstro, jogo mortal, mistério) — sempre com ciência real e o mesmo humor. Pode citar a série uma vez no título/descrição ("inspirado em..."), mas nunca usar personagens, nomes, logos ou visual da obra. Vilões e monstros devem dar medo de verdade (olhar fixo, sombra, sorriso esticado), e os heróis devem ser bonitos e expressivos.

## Regras de alcance (desde 18/11 — obrigatórias em todo Short)
1. **Gancho no 1º segundo** — escrito como CURIOSIDADE em forma de pergunta direta ao espectador (ex.: "POR QUE OS POMBOS FAZEM COCÔ EM VOCÊ?", "VOCÊ AGUENTARIA 11 DIAS SEM DORMIR?", "UM DRAGÃO CONSEGUIRIA VOAR?"). Vídeo inspirado em anime/série: o 1º plano é a REPRESENTAÇÃO da cena mais famosa da obra no nosso traço (ex.: titã espiando por cima da muralha), sem copiar personagens. Detalhes: o vídeo ABRE na cena mais absurda (não na apresentação calma) e o arquivo `work/gancho.txt` tem a frase-gancho curta (4–7 palavras, pergunta ou afirmação chocante, ex.: "O BRASIL IMPORTOU CAMELOS?!"). O `captions.py` mostra ela grande no topo nos primeiros 2,8 s. A 1ª frase da narração já é o absurdo.
2. **Final em loop**: a última frase do roteiro emenda na primeira (ex.: termina com "...e foi assim que" / "E tudo começou quando..." e o vídeo recomeça na frase 1). O último plano tem enquadramento parecido com o primeiro, para a volta não ser percebida.
3. **Duração** continua 55–65 s (decisão do dono).
4. **2 Shorts por dia**: a produção da madrugada faz 2 histórias; publicação às 11h47 e às 19h (BRT).
5. Legenda palavra a palavra fica em 74% da altura (abaixo dos rostos).

## Régua de qualidade do roteiro (o teste de 10 s ficou FRACO — não repetir)
Os roteiros de referência têm SEMPRE: (a) personagens com papel e FALA em discurso direto, (b) números concretos (82 furos, 15 por hora, 10 anos, último cem reais, 3 metros), (c) 4–6 piadas físicas em escalada, cada frase = uma ação que dá pra desenhar, (d) "Isso se chama..." com o nome do fenômeno, (e) final irônico de 1 frase que fecha o ciclo. Se faltar um desses, reescreva antes de gerar a voz.

Exemplo completo no padrão (≈60 s) — "A chuva de carne":
```
Choveu carne do céu... e a fazenda inteira achou que era o fim do mundo.
Kentucky, mil oitocentos e setenta e seis. A senhora Crouch está fazendo sabão no quintal, quando um pedaço de carne cai dentro do caldeirão.
Ela olha pra cima. Céu azul. Nem UMA nuvem.
E aí... cai outro. E outro. E OUTRO!
Em poucos minutos, carne cobre o quintal, a cerca e o telhado.
O marido sai correndo: "Mulher, é castigo de Deus!"
Os vizinhos chegam... e um deles PROVA um pedaço.
"Carneiro", ele diz. O outro mastiga devagar: "Não... é veado."
Os jornais chamam de "a chuva de carne do Kentucky", e cientistas aparecem com potinhos de vidro pra levar amostras.
Mas a explicação era bem mais nojenta.
Isso se chama... vômito de urubu.
Quando um bando de urubus se assusta, eles vomitam tudo o que comeram, pra ficar leves e fugir mais rápido.
Bem em cima da fazenda.
E os vizinhos? Já tinham repetido o prato.
```

## Capa / thumbnail (aprovado pelo dono)
VERTICAL 1080x1920 (o YouTube recomenda 9:16 para Shorts; horizontal é substituído por recorte automático). Quadro da animação com o personagem em close, expressão exagerada e o objeto-chave visível na metade de baixo + letreiro grosso amarelo/branco com contorno preto, 2–3 palavras em MAIÚSCULAS no terço de cima (ex.: "CHOVEU CARNE?!"). Gerar com `thumb.py`. A capa do Reel no Instagram é o mesmo quadro (cover_ms), sem letreiro.

### Aprendizados da revisão de 19/11 (titãs, meio do render)
- Objeto de apoio só na hora em que a narração fala dele: o cartão dos cubos estava "grudado" no enquadramento do Lúcio e aparecia em 39 planos (23% do vídeo), inclusive falando de coração, fome e Wadlow. Agora: cubos só no trecho do quadrado-cubo; na fome, pães; no Wadlow, o gráfico de alturas.
- Titã inteiro em quadro quando a narração fala da cabeça/altura: câmera a ~30 m do titã alto (antes a 12 m cortava a cabeça).
- Evitar braços abertos em "T" (pose 'reach' de longe parece boneco de teste) e titã "afundado" no chão (y negativo).
- Revisar uma folha de quadros (12 por bloco) logo no começo do render, não no fim: corrigir cedo custa poucos quadros.
