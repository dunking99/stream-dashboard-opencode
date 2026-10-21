// "Gallery": a broadcast control room. Warm graphite, hardware-flat panels, tally-light colours,
// timecode in mono. Scoped under .gl so none of it can leak into the live app.
export const CSS = `
.gl{--bg:#151412;--panel:#1c1b19;--bar:#232220;--raised:#2a2926;--line:#322f2b;--line2:#47443d;--ink:#ebe7dd;--dim:#a29d91;--faint:#77736a;--red:#ff4136;--green:#35d07f;--amber:#ffb020;--dead:#57544c;
  font-family:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',sans-serif;font-size:13px;line-height:1.35;color:var(--ink);background:var(--bg)}
.gl *{box-sizing:border-box}
.gl button,.gl input,.gl select{font:inherit;color:inherit}
.gl button{cursor:pointer}
.gl .mono{font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;font-variant-numeric:tabular-nums}
.gl .t-dim{color:var(--dim)}.gl .t-faint{color:var(--faint)}.gl .t-red{color:var(--red)}.gl .t-green{color:var(--green)}.gl .t-amber{color:var(--amber)}
.gl .panel{background:var(--panel);border:1px solid var(--line)}
.gl .bar{background:var(--bar);border-bottom:1px solid var(--line)}
.gl .btn{border:1px solid var(--line2);background:var(--raised);padding:4px 10px;border-radius:2px;font-size:12px;font-weight:500;line-height:1.3}
.gl .btn:hover:not(:disabled){background:#33312d;border-color:#5a564d}
.gl .btn:disabled{opacity:.45;cursor:not-allowed}
.gl .btn-cut{border-color:#8a2a24;background:#3a1d1a;color:#ffd4d0;font-weight:600}
.gl .btn-cut:hover:not(:disabled){background:#52231f;border-color:var(--red)}
.gl .ghost{background:transparent;border:1px solid transparent;border-radius:2px;padding:3px 6px}
.gl .ghost:hover{background:var(--raised);border-color:var(--line)}
.gl :focus-visible{outline:2px solid var(--amber);outline-offset:1px}
.gl input[type=text],.gl input[type=search],.gl input[type=number],.gl select{background:#121110;border:1px solid var(--line2);border-radius:2px;padding:5px 8px;font-size:12.5px;width:100%}
.gl input::placeholder{color:var(--faint)}
.gl .kbd{display:inline-block;min-width:18px;padding:0 5px;border:1px solid var(--line2);border-bottom-width:2px;border-radius:3px;font:500 10.5px/16px 'IBM Plex Mono',monospace;color:var(--dim);text-align:center;background:#1f1e1b}
.gl .tab{padding:8px 12px;border-bottom:2px solid transparent;color:var(--dim);font-weight:500;white-space:nowrap;background:none;border-top:0;border-left:0;border-right:0}
.gl .tab:hover{color:var(--ink)}.gl .tab[aria-selected=true]{color:var(--ink);border-bottom-color:var(--red)}
.gl .seg{display:inline-flex;border:1px solid var(--line2);border-radius:2px;overflow:hidden}
.gl .seg button{background:#1c1b19;border:0;padding:4px 10px;font-size:12px;color:var(--dim);border-right:1px solid var(--line2)}
.gl .seg button:last-child{border-right:0}
.gl .seg button[aria-pressed=true]{background:var(--raised);color:var(--ink)}
.gl .row{display:block;width:100%;text-align:left;background:transparent;border:0;border-bottom:1px solid var(--line);padding:0}
.gl .row:hover{background:#211f1d}
.gl .row[aria-current=true]{background:#262420;box-shadow:inset 3px 0 0 var(--red)}
.gl ::-webkit-scrollbar{width:9px;height:9px}.gl ::-webkit-scrollbar-thumb{background:#3b3833;border:2px solid var(--bg);border-radius:6px}.gl ::-webkit-scrollbar-track{background:transparent}
@keyframes gl-pulse{50%{opacity:.25}}
.gl .tally-on{animation:gl-pulse 1.4s steps(1) infinite}
@keyframes gl-slide{from{transform:translateX(16px);opacity:0}to{transform:none;opacity:1}}
.gl .toast{animation:gl-slide .22s ease-out}
@keyframes gl-flash{0%{background:rgba(53,208,127,.45)}100%{background:transparent}}
.gl .flash{animation:gl-flash 2.4s ease-out}
@keyframes gl-run{0%,100%{transform:translate(0,0)}50%{transform:translate(var(--dx),var(--dy))}}
.gl .runner{animation:gl-run var(--t) ease-in-out infinite}
@keyframes gl-static{0%{transform:translate(0,0)}25%{transform:translate(-3%,2%)}50%{transform:translate(2%,-3%)}75%{transform:translate(-2%,-1%)}100%{transform:translate(0,0)}}
.gl .static{animation:gl-static .3s steps(1) infinite}
@media (prefers-reduced-motion:reduce){.gl .runner,.gl .static,.gl .tally-on,.gl .toast,.gl .flash{animation:none}}
`;
