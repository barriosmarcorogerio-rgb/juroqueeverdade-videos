# Estilo "Juro Que É Verdade" — tirado dos 3 vídeos de referência

## Roteiro (o mais importante)
Duração: 25–35 s, ~70–95 palavras, ~2,7 palavras/s (ver "Duração" abaixo; os 55–65 s originais renderam pouco). Narrador único, tom de contador de história, presente do indicativo.

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

## Duração (dado real do canal, 2026-11-17)
- O teste de **10 s** ("Choveu carne numa fazenda") pegou **~1k views** no YouTube; a versão de **58 s** teve **1 view em 6 h**. Até as métricas dizerem outra coisa: mirar **25–35 s** (~70–95 palavras), gancho visual forte já no quadro 0 (objeto-chave em movimento na tela, sem plano de abertura parado), virada antes dos 20 s e final que dê vontade de rever (loop).
- Nunca apagar vídeo publicado, mesmo teste: o histórico ajuda o canal.

## Voz (decidido pelo dono do canal)
Gemini TTS voz **Charon**, +8% de velocidade (`template/gemini_tts.py`). Sem instrução de estilo (ela é lida em voz alta). A animação da voz vem da pontuação do roteiro: "...", "!", MAIÚSCULA na palavra de ênfase, frases curtas.

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
