# powerbi-widget

Staffbase-Custom-Widget. Entwickelt, gebaut und released wird es aus dem
Meta-Repo [`ps-mhp/man-staffbase-cms-extensions`](https://github.com/ps-mhp/man-staffbase-cms-extensions);
dieses Repo enthält nur Quellcode und das ausgelieferte Bundle unter `dist/`.

```bash
scripts/sync.sh powerbi-widget
npm run build -- --env widget=powerbi-widget
npm test -- src/widgets/powerbi-widget
scripts/release.sh powerbi-widget
```
