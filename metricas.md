# Métricas e aprendizados de audiência

## 2026-11-17 (leitura logo após publicar "Choveu carne do céu")
| Data | Plataforma | Título | Views | Likes | Coment. |
|---|---|---|---|---|---|
| 2026-11-17 16:06 | YouTube | Choveu carne do céu… e a culpa era de quem? #shorts | 0 | 0 | 0 |
| 2026-11-17 02:58 | YouTube | Choveu carne numa fazenda (teste) | 0 | 0 | 0 |
| 2026-11-17 16:07 | Instagram | Choveu CARNE do céu numa fazenda do Kentucky… | — | 0 | 0 |

Conclusões:
- Canal recém-criado: ainda sem dados de audiência (tudo em 0, leitura feita minutos após a publicação). Nada para ajustar no backlog ainda.
- Próxima leitura (Tarefa B de amanhã) já vai mostrar as primeiras 24 h deste vídeo; comparar gancho "Choveu carne" contra o próximo tema (camelos no Ceará).
- Publicação via Make funcionou nos dois (execução f5a55bcd…, SUCCESS); o vídeo de teste só existe no YouTube.


## 2026-11-17 — tarefa agendada de publicação (disparada 14:47 UTC, atendida 16:08 UTC)
Fila vazia: o único item pendente ("Choveu carne do céu") já foi publicado às 16:06 UTC pela recuperação manual, nos dois canais. Nada publicado de novo, para não duplicar. As métricas lidas às 16:07 estão na tabela acima (todas em 0).

## 2026-11-17 — ajustes no YouTube
- Idioma do Short estava `pt-PT` (padrão do upload). Cenário do Make ganhou o passo "Idioma pt-BR" (API videos.update) e o vídeo lgyRq-Q2C9Y já foi corrigido para pt-BR.
- Capa personalizada recusada (403): o canal precisa de verificação por telefone (youtube.com/verify). Depois de verificado, reaplicar com `canal:"thumb"` (PIPELINE.md, 4b).

## 2026-11-17 — aprendizado principal
- Teste de 10 s: ~1k views (dono apagou o vídeo depois). Versão de 58 s: 1 view em ~6 h. Dono decidiu manter vídeos longos (55–65 s); foco em retenção (gancho no quadro 0, surpresa a cada 5–8 s, final em loop). Acompanhar "visualizado vs. deslizado" no Studio.

## 2026-11-18 (leitura logo após publicar "Camelos de Dom Pedro II")
| Data | Plataforma | Título | Views | Likes | Coment. |
|---|---|---|---|---|---|
| 2026-11-18 15:26 | YouTube | Dom Pedro II trouxe CAMELOS pro sertão?! #shorts (j9vrGbPrAUM) | 0 | 0 | 0 |
| 2026-11-17 16:06 | YouTube | Choveu carne do céu… e a culpa era de quem? #shorts | 4 | 0 | 0 |
| 2026-11-17 02:58 | YouTube | Choveu carne numa fazenda (teste) | 0 | 0 | 0 |
| 2026-11-18 15:26 | Instagram | Em 1859 o Brasil trouxe 14 CAMELOS… | — | 0 | 0 |
| 2026-11-17 16:07 | Instagram | Choveu CARNE do céu numa fazenda do Kentucky… | — | 45 | 2 |

Conclusões:
- Instagram rende muito mais que o YouTube por enquanto: "Choveu carne" fez 45 likes + 2 comentários no Reels contra 4 views no Short em 23 h. Manter as legendas do Instagram com pergunta/gancho forte ("O que deu errado?").
- YouTube ainda em fase de "teste" do algoritmo (canal novo): não dá para concluir sobre temas; comparar camelos (Brasil) × chuva de carne (EUA) na leitura de amanhã.
- Publicação atrasou 40 min (11h47 → 12h26 BRT): o render do Short foi perdido duas vezes (finish sem pasta `out/` e reinício do contêiner). Corrigido no madrugada.sh; o render de Shorts deve terminar bem antes das 11h47.
- Backlog de historias.md mantido na ordem (sem dados suficientes para reordenar).

Publicação: execução Make ded0d5a5… SUCCESS (YouTube j9vrGbPrAUM + Instagram).

## 2026-11-18 — publicação da noite (18h50 BRT)
Nada publicado: o único item pendente fora do Instagram é a prévia "E se você cavasse um buraco até o Japão? (parte 1)", que exige o longo já no canal — e o longo ainda não foi publicado pelo dono. Os Shorts novos (2 por dia) entram na fila a partir da produção desta madrugada.
