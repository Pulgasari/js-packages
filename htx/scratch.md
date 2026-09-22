# scratch

this file is only for brainstorming.

```javascript
htx`<div onclick=${doSth} />`;

htx`<div onclick=${doSth} onresize=${doSth} />`;
htx`<div onclick|onresize=${doSth} />`;
htx`<div on:click|resize=${doSth} />`;
htx`<div on:[click|resize]=${doSth} />`;
htx`<div on:[click,resize]=${doSth} />`;

htx`<div key:ctrl+f=${doSth} />`;
htx`<div onkeydown:ctrl+f=${doSth} />`;
htx`<div on:keydown[ctrl+f]=${doSth} />`;
```

```javascript
htx`<div !html=${insertUnsafeHTML} />`;
```
