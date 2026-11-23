"use strict";
// Additional graphical views over the same hourly ERA5-Land dataset.
// Browser globals 'hourly' and 'months' are provided by app.js.
(function(){
 const ids=["temperatureMonthly","stressMonthly","rainMonthly","diurnalTemperature"];
 const colors={line:"#b3dc85",low:"#79b9d4",high:"#e6ab78",rain:"#77b7dc",grid:"#37473d",text:"#b5c3b8"};
 const fmt=x=>Number(x).toLocaleString("bg-BG",{maximumFractionDigits:1});
 function canvas(id){
   const el=document.getElementById(id);if(!el)return null;
   const rect=el.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=rect.width,h=Math.max(190,rect.height);
   if(!w)return null;el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);
   const c=el.getContext("2d");c.setTransform(dpr,0,0,dpr,0,0);
   return {c,w,h,left:42,right:12,top:18,bottom:29};
 }
 function axes(g,lo,hi,labels){
   const {c,w,h,left,right,top,bottom}=g,W=w-left-right,H=h-top-bottom;
   c.font="10px system-ui";c.lineWidth=1;c.strokeStyle=colors.grid;c.fillStyle=colors.text;
   for(let i=0;i<=4;i++){let y=top+H*i/4;c.beginPath();c.moveTo(left,y);c.lineTo(w-right,y);c.stroke();c.fillText(fmt(hi-(hi-lo)*i/4),3,y+4)}
   labels.forEach((t,i)=>{const x=left+W*(i+0.5)/labels.length;c.fillText(t,x-9,h-10)});
   return {x:i=>left+W*(i+0.5)/labels.length,y:v=>top+H*(hi-v)/(hi-lo),W,H}
 }
 function bars(g,series,labels){
   const nums=series.flatMap(s=>s.data).filter(Number.isFinite);
   if(!nums.length)return;
   const lo=Math.min(0,...nums),hi=Math.max(1,...nums)*1.10,ax=axes(g,lo,hi,labels);
   const groupW=ax.W/labels.length,barW=Math.min(23,groupW/(series.length+1));
   for(let j=0;j<series.length;j++){
     g.c.fillStyle=series[j].color;
     series[j].data.forEach((v,i)=>{if(!Number.isFinite(v))return;const x=ax.x(i)+(j-(series.length-1)/2)*barW-barW*.42,y=ax.y(v),base=ax.y(0);g.c.fillRect(x,Math.min(y,base),barW*.84,Math.abs(base-y))})
   }
 }
 function line(g,values,labels,low=null,high=null){
   const all=[...values,...(low||[]),...(high||[])].filter(Number.isFinite);if(!all.length)return;
   let lo=Math.min(...all),hi=Math.max(...all);let pad=Math.max((hi-lo)*.12,1);lo-=pad;hi+=pad;
   const ax=axes(g,lo,hi,labels),paint=(arr,color,width=2)=>{
     g.c.strokeStyle=color;g.c.lineWidth=width;g.c.beginPath();let start=true;
     arr.forEach((v,i)=>{if(!Number.isFinite(v)){start=true;return}let x=ax.x(i),y=ax.y(v);if(start){g.c.moveTo(x,y);start=false}else g.c.lineTo(x,y)});g.c.stroke();
   };
   if(low)paint(low,colors.low,1.4);if(high)paint(high,colors.high,1.4);
   paint(values,colors.line,2.5);
 }

 function layered(g,series,labels){
   const all=series.flatMap(s=>s.data).filter(Number.isFinite);
   if(!all.length)return;
   let lo=Math.min(...all),hi=Math.max(...all);
   const pad=Math.max((hi-lo)*0.1,0.01);lo-=pad;hi+=pad;
   const ax=axes(g,lo,hi,labels);
   series.forEach(s=>{
      g.c.strokeStyle=s.color;g.c.lineWidth=2;g.c.beginPath();let started=false;
      s.data.forEach((v,i)=>{if(!Number.isFinite(v)){started=false;return}
        const x=ax.x(i),y=ax.y(v);if(!started){g.c.moveTo(x,y);started=true}else g.c.lineTo(x,y)
      });
      g.c.stroke();
   });
 }
 function render(){
   if(typeof hourly==="undefined"||!hourly?.time?.length)return;
   const byMonth=Array.from({length:12},()=>[]);
   hourly.time.forEach((t,i)=>{const m=Number(t.slice(5,7))-1;if(m>=0&&m<12)byMonth[m].push(i)});
   const vals=key=>byMonth.map(ix=>ix.map(i=>hourly[key][i]).filter(Number.isFinite));
   const ts=vals("temperature_2m");
   const avg=ts.map(v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null);
   const low=ts.map(v=>v.length?Math.min(...v):null),high=ts.map(v=>v.length?Math.max(...v):null);
   const labels=["Я","Ф","М","А","М","Ю","Ю","А","С","О","Н","Д"];
   const layers=["0_to_7cm","7_to_28cm","28_to_100cm","100_to_255cm"];
   const colorsByDepth=[colors.line,colors.low,colors.high,"#c29dde"];
   let c=canvas("soilTemperatureLayers");
   if(c)layered(c,layers.map((depth,i)=>({color:colorsByDepth[i],data:vals("soil_temperature_"+depth).map(v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null)})),labels);
   c=canvas("soilMoistureLayers");
   if(c)layered(c,layers.map((depth,i)=>({color:colorsByDepth[i],data:vals("soil_moisture_"+depth).map(v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null)})),labels);
   c=canvas("temperatureMonthly");if(c)line(c,avg,labels,low,high);
   c=canvas("stressMonthly");if(c)bars(c,[{data:ts.map(v=>v.filter(t=>t<0).length),color:colors.low},{data:ts.map(v=>v.filter(t=>t>30).length),color:colors.high}],labels);
   c=canvas("rainMonthly");if(c)bars(c,[{data:vals("precipitation").map(v=>v.reduce((a,b)=>a+b,0)),color:colors.rain}],labels);
   const byHour=Array.from({length:24},()=>[]);
   const selectedMonth=document.getElementById("month")?.value||"all";
   hourly.time.forEach((t,i)=>{if(selectedMonth!=="all"&&Number(t.slice(5,7))!==Number(selectedMonth))return;const h=Number(t.slice(11,13)),v=hourly.temperature_2m[i];if(h>=0&&h<24&&Number.isFinite(v))byHour[h].push(v)});
   const daily=byHour.map(v=>v.length?v.reduce((a,b)=>a+b,0)/v.length:null);
   c=canvas("diurnalTemperature");if(c)line(c,daily,Array.from({length:24},(_,i)=>i%3===0?String(i):""));
 }
 document.addEventListener("agrodb:data-updated",render);
 document.getElementById("month")?.addEventListener("change",render);
 window.addEventListener("resize",()=>{if(typeof hourly!=="undefined"&&hourly)render()});
})();
