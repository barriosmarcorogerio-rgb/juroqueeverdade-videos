# Kit de partida — canal "como as coisas são construídas"

Canal novo, operado por OUTRA conta Claude (Max), para não dividir o limite com o Juro Que É Verdade.

## O que o dono faz antes (uma vez)
1. Na conta Max: entrar em claude.ai/code, conectar o GitHub (claude.ai/connect-github) e instalar o Claude GitHub App no repositório novo.
2. No GitHub: criar um repositório **público** vazio para o canal (ex.: `comoefeito-videos`).
3. Criar o canal do YouTube e o Instagram profissional (o nome e a marca o Claude cria junto na conversa).
4. No Make (o mesmo ou outro): conectar o YouTube e o Instagram for Business do canal novo, e conectar o Make ao Claude da conta Max (Configurações → Conectores → Make).
5. Abrir uma conversa nova no Claude Code (nuvem), com o repositório novo selecionado, e colar o texto abaixo.

## Texto para colar na conversa nova
```
Quero montar um canal automático de YouTube Shorts + Instagram Reels que ensina COMO AS COISAS SÃO CONSTRUÍDAS (pontes, prédios, túneis, represas, estradas, casas), em português do Brasil, com animação 3D técnica e didática: peças, vigas, formas, armaduras, concreto e máquinas montando a obra em camadas, câmera orbitando, cortes mostrando o interior, setas e rótulos curtos. 1 vídeo de 45–60 s por dia.

Já existe um sistema igual funcionando em outro canal, no repositório público https://github.com/barriosmarcorogerio-rgb/juroqueeverdade-videos — clone-o (leitura) e reaproveite: template/ (motor 3D em three.js renderizado com Playwright, legendas palavra por palavra, mix de som, voz Gemini TTS), PIPELINE.md (produção → publicação via Make → métricas → melhoria semanal) e ESTILO.md (aprendizados de qualidade). Adapte tudo para este canal no repositório deste chat.

Faça, nesta ordem, me perguntando só o essencial:
1. Nome do canal, @, descrição, foto de perfil e banner (renderizados com o próprio motor 3D, estilo técnico limpo).
2. ESTILO.md próprio: roteiro didático em 6 batidas (pergunta curiosa → problema de engenharia → etapas da obra com números reais → o truque genial → erro famoso/curiosidade → final de impacto), legendas, capa vertical 1080x1920 com letreiro de 2–3 palavras, voz Gemini TTS (testar vozes comigo).
3. Um vídeo de teste de 10 s, mostrar a prévia antes do render longo.
4. Ambiente da nuvem próprio (Hugging Face para as legendas; chave do Google AI Studio no header x-goog-api-key; token do Make no header Authorization com prefixo Token; hook do Make liberado).
5. Cenários do Make (publicar + métricas) iguais aos do outro canal, com as contas deste canal.
6. Tarefas agendadas: produção 1h, publicação ~12h, melhoria semanal no domingo. Tudo 100% automático, sem me pedir nada depois de pronto.
Fatos e números sempre conferidos na web; nada de inventar especificação técnica.
```

## Diferenças em relação ao Juro Que É Verdade
- Personagens são opcionais (no máximo um mestre de obras mascote); o protagonista é a obra.
- Visual: materiais realistas (concreto, aço, terra, água), luz de dia limpa, cortes e transparências para mostrar o interior, peças entrando com animação de montagem.
- Fatos técnicos conferidos em fonte confiável (fabricante, órgão público, artigo de engenharia).
