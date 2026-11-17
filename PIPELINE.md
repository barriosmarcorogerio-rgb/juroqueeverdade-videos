# Pipeline diário — "Juro Que É Verdade"

Canal: YouTube **@juroqueeverdade.brasil** + Instagram **@juroqueeverdade.brasil**. 1 vídeo por dia, 55–65 s (ver ESTILO.md, Duração e retenção), vertical 1080x1920.
LEIA ANTES: `ESTILO.md` (roteiro, câmera, luz, legenda e APRENDIZADOS — obrigatórios) e `historias.md` (o que já saiu + ideias).

## Tarefa A — Produção (madrugada)
1. **Escolher a história**: a próxima do backlog em `historias.md` (ou uma nova melhor, inspirada nas métricas em `metricas.md`). Nunca repetir. Fatos conferidos com busca na web; lenda é avisada ("diz a lenda"). Nada político, nada gráfico, nada de pessoas vivas.
2. **Roteiro** no formato do `ESTILO.md` (conferir a "Régua de qualidade" e o exemplo completo; a história 1 do backlog JÁ TEM roteiro pronto lá — use-o), 150–170 palavras, com pontuação expressiva ("...", "!", MAIÚSCULA para ênfase) porque é ela que dá emoção à voz. Salvar em `projetos/AAAA-MM-DD-slug/script.txt` (uma frase por linha).
3. **Projeto**: `cp -r template projetos/AAAA-MM-DD-slug` ; `cd` nele ; `npm i --silent --no-audit --no-fund playwright-core@1.49.1` só se `import('playwright')` falhar (Chromium já vem instalado no container).
4. **Voz**: `python3 gemini_tts.py script.txt voice.wav` (Charon, +8%). Timing por palavra: `HF_HUB_DISABLE_XET=1 python3 -I words.py voice.wav script.txt work/words.json` (precisa `pip install faster-whisper`; na 1ª vez baixa o modelo `small` do Hugging Face). TOTAL de quadros = round(duração × 30).
5. **Cena** (`web/main.js`, seção `// ---------- world ----------` até `// ---------- cards ----------`): construir o cenário da história no estilo semi-realista do template (MeshStandardMaterial, sem contorno, grama 3D instanciada, árvores com folhas instanciadas, nuvens suaves). O exemplo da fazenda mostra todas as técnicas. Personagens novos: `web/toon.js` OUTFITS (tronco único, sem saia). Objetos-chave na forma ICÔNICA de desenho (ver aprendizados).
6. **Plano** (`web/story.js`): 30–45 planos de 1–2 s, ângulos variados (close de rosto, close de objeto, POV, drone, contra-plongée, câmera seguindo objeto), luz progredindo (dia → entardecer → noite/chuva no clímax → amanhecer). Exemplo pronto: `template/web/story.js`.
7. **Prévia obrigatória**: `node render.mjs stills/a "<meio de cada plano>"` + `python3 sheet.py stills/a stills/sheet.jpg 8`. OLHAR a folha e corrigir: objeto reconhecível em 1 s? algo atravessando algo? telhado/janela coerentes? rosto cortado? Repetir até ficar limpo.
8. **Render** em blocos: `RESUME=1 node render.mjs frames "0-299"`, `"300-599"`... até o fim (~4–9 s/quadro). Nunca terminar a sessão com render rodando.
9. **Som**: ajustar a tabela de deixas em `audio.py` (DUR, MUSIC_END na virada, efeitos nos eventos) → `python3 audio.py && python3 mix.py voice.wav music.wav sfx.wav`.
10. **Legenda + MP4**: `python3 captions.py && FRAMES=frames_cap bash finish.sh "Titulo"`. Conferir `out/qa_sheet.jpg`.
11. **Versão YouTube** (Make grátis aceita ≤5 MB): `ffmpeg -i out/X.mp4 -c:v libx264 -preset slow -b:v 520k -maxrate 600k -bufsize 1200k -vf scale=720:1280 -c:a aac -b:a 96k -movflags +faststart videos/AAAA-MM-DD-slug-yt.mp4` (conferir < 5 MB; se passar, baixar o bitrate). Alta: `cp out/X.mp4 videos/AAAA-MM-DD-slug.mp4`.
11b. **Thumbnail + capa**: escolher o quadro com personagem em close + expressão exagerada + objeto-chave na metade de baixo (ver ESTILO.md "Capa") e rodar `python3 thumb.py frames/fNNNN.jpg "TEXTO DE 2-3 PALAVRAS" ../../videos/AAAA-MM-DD-slug-thumb.jpg` (vertical 1080x1920). `cover_ms` = NNNN/30*1000. Fazer ANTES de apagar frames/.
12. **Fila de publicação**: acrescentar em `fila.json` um item `{data, slug, titulo, descricao, legenda_instagram, video, video_yt, thumb, cover_ms, publicado:false}`. Título YouTube ≤ 70 caracteres terminando em `#shorts`. Atualizar `historias.md`.
13. `git add -A && git commit` (fim da mensagem com as linhas de atribuição) `&& git push`. Apagar `frames/`, `frames_cap/`, `stills/` antes do commit (não versionar quadros).

## Tarefa B — Publicação + métricas (12h)
1. `git pull`. Pegar em `fila.json` o item mais antigo com `publicado:false`.
2. Make (conector), cenário **7068350**, `scenarios_run` com `responsive:true` e data:
   `video_url` = `https://raw.githubusercontent.com/barriosmarcorogerio-rgb/juroqueeverdade-videos/main/<video>`,
   `yt_url` = idem com `<video_yt>`, `thumb_url` = idem com `<thumb>`, `cover_ms`, `title`, `description`, `caption`, `yt_privacy:"public"`, `instagram:"sim"`. **E também** `yt_snippet` = `json.dumps({"title":titulo,"description":descricao,"categoryId":"1","defaultLanguage":"pt-BR","defaultAudioLanguage":"pt-BR"})` (string JSON; sem ela o YouTube marca o idioma como pt-PT). Chamada: `curl -X POST https://us2.make.com/api/v2/scenarios/7068350/run -H 'Content-Type: application/json' -d '{"responsive":true,"data":{...}}'` (token injetado pelo ambiente). Item antigo sem `thumb`: usar `thumb_url` = a URL do vídeo yt (o passo da thumbnail falha e é ignorado).
   Se o MCP der erro de rede, ANTES de repetir confira `executions_list` (não publicar 2 vezes).
3. Marcar `publicado:true` + data/hora em `fila.json`, commit e push.
4. **Métricas**: `curl -sS -m 120 -X POST https://hook.us2.make.com/eyu8l7uumr8uiv2yyp6lrjir03vhyn6e -H 'Content-Type: application/json' -d '{}'` devolve JSON com `youtube` (últimos 15 vídeos: snippet + statistics: views, likes, comentários) e `instagram` (últimos 15 posts: likes, comentários). Registrar uma tabela em `metricas.md` e 3 linhas de conclusão: que tipo de história/gancho rendeu mais → ajustar a ordem do backlog em `historias.md`.
4b. **Capa de vídeo já publicado** (ex.: depois que o canal foi verificado por telefone): rodar o mesmo cenário com `canal:"thumb"`, `video_id`, `thumb_url`, `yt_snippet` (+ os campos obrigatórios `video_url`, `yt_url`, `title`, e `instagram:"nao"`). Erro 403 "permissions to ... set custom video thumbnails" = canal ainda não verificado em youtube.com/verify.
5. Se a fila estiver vazia: não publicar nada e registrar o motivo em `metricas.md`.

## Tarefa C — Melhoria contínua (domingo)
1. `git pull`; ler `metricas.md` da semana, `historias.md`, `ESTILO.md` e os erros anotados pelas tarefas A/B.
2. Ler as métricas atuais (webhook acima). Comparar: quais ganchos, temas, épocas e durações tiveram mais views/likes por hora desde a publicação.
3. Pesquisar na web vídeos/canais do mesmo estilo (desenho "cabeça de feijão", histórias reais curiosas, shorts virais de história) e anotar 3 padrões novos que funcionam.
4. Atualizar `ESTILO.md` (seção Aprendizados) com o que funcionou/não funcionou, e o `PIPELINE.md` se algum passo deu erro na semana.
5. Repor o backlog de `historias.md` com 10 histórias novas com fatos conferidos, ordenadas pelo que as métricas indicam.
6. Corrigir no `template/` qualquer problema técnico recorrente (render lento, objetos mal reconhecíveis, falhas de voz).
7. Commit + push com um resumo da semana no topo de `metricas.md`.
