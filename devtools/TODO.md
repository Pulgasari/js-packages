# todo

- [x] das `menu` erweitern um einen zweiten satz clickable icons:
  - [x] `pick` (vom dom/elements-panel)
  - [x] `reload`
- [x] `menu` bekommt `space-between` sodass satz1 linksbündig und satz2 rechtsbündig flowt
- [x] im menu sollte das icon eines aktiven panels in der `--accent` farbe hervorgehoben werden
- [x] settings-panel-option: `position` (`bottom` oder `top`)
- [x] settings-panel in aufklappbare sektion unterteilen wie das data-panel: `ui/general` + panel-spezifisches


## panel: console
- [x] font in console-einträgen sollte monospace sein
- [x] wenn eintrag in console angeklickt wird wird dieser quasi fokusierr, dadurch:
  - [x] opacity zu 100%
  - [x] rechts erscheinen icons: copy, delete, und wo passend: re-run
  - [x] links vor jedem eintrag und im filter (info, warn usw) jeweils noch n pasendes icon zur besseren repräsentation

## ui generell

- [x] aktuell ist es etwas nervig, dass wenn man panel wechselt, die höhe immer anders ist, das sollte immer gleich hoch sein. ausserdem wäre es nice wenn oben am panel ein kleines handle wäre, dass man gedrückt halten und dann nach oben/unten verschieben kann. dieser wert sollte dann auh der wert aus den settings options bzgl der höhe sein. sinnvoll wäre hier vermutlich auf min. 10dvh bis max 60dvh zu begrenzen
- [x] wenn die panel-position auf `top` eingestellt ist, ist das menu unter dem panel. hier müsste vermutlich am umgebenden container `column-reverse` statt `column` greifen, wenn `top` gesetzt ist.
