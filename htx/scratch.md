# scratch

```javascript
htx`<div onclick=${doSth} />`;

htx`<div onclick=${doSth} onresize=${doSth} />`;
htx`<div onclick|onresize=${doSth} />`;
htx`<div on:click|resize=${doSth} />`;
htx`<div on:[click|resize]=${doSth} />`;
htx`<div on:[click,resize]=${doSth} />`;
```

```javascript
htx`<div !html=${insertUnsafeHTML} />`;
```
