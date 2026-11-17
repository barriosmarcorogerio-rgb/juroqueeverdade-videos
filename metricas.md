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

