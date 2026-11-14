# Assets do PDF — Fase 4

| Arquivo | Uso |
|---|---|
| `diagrama-geral-fase4.mmd` | Fonte Mermaid do diagrama geral |
| `diagrama-geral-fase4.png` | Figura para anexar no PDF (gerar abaixo) |

## Gerar PNG

Opção A — [Mermaid Live Editor](https://mermaid.live): colar o conteúdo do `.mmd` → Export PNG.

Opção B — CLI (requer Chrome local):

```bash
cd docs/delivery/assets
npx @mermaid-js/mermaid-cli@11 \
  -i diagrama-geral-fase4.mmd \
  -o diagrama-geral-fase4.png \
  -b white -w 1600 -H 1200 \
  -p puppeteer.json
```

Crie `puppeteer.json` apontando para o Chrome do macOS se necessário:

```json
{
  "executablePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "args": ["--no-sandbox"]
}
```
