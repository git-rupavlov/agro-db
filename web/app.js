"use strict";
// AgroDB Makotsevo v0.1. Climate data source: Open-Meteo ERA5-Land.
// All temperature thresholds are explicitly tagged as species-level reference values.
const $ = id => document.getElementById(id);
const months = ["Януари","Февруари","Март","Април","Май","Юни","Юли","Август","Септември","Октомври","Ноември","Декември"];
const VARIABLES = ["temperature_2m","soil_temperature_0_to_7cm","relative_humidity_2m","precipitation","shortwave_radiation"];
const UNITS = {temperature_2m:"°C",soil_temperature_0_to_7cm:"°C",relative_humidity_2m:"%",precipitation:"mm",shortwave_radiation:"W/m²"};
const PHASES = {
  seed_germination:{name:"Покълване",min:20,max:30,opt:25,scope:"Вид, температура на субстрата",variable:"soil_temperature_0_to_7cm",warning:"Температурата на почвата 0–7 cm не е идентична с температурата в съда за разсад."},
  emergence:{name:"Поникване",min:null,max:null,scope:"Няма проверена температурна граница"},
  seedling:{name:"Разсад",min:18,max:27,scope:"Вид, ориентировъчни стойности за отглеждане",warning:"Прагът 18°C е ориентир за нощ, а 27°C за ден; общото сравнение е опростено."},
  vegetative:{name:"Вегетативен растеж",min:null,max:null,scope:"Няма проверена температурна граница"},
  flowering:{name:"Цъфтеж",min:21,max:24,scope:"Вид, дневен температурен ориентир",warning:"Дневният оптимум не трябва да се тълкува като допустим диапазон за всяка нощна температура."},
  fruit_set:{name:"Завръз",min:15.5,max:24,scope:"Вид, индикативни нощни прагове",warning:"Сравняват се само часовете 22:00–05:59; температурите извън тези граници повишават риска, но не доказват неуспешен завръз.",night:true},
  fruit_growth:{name:"Нарастване на плода",min:null,max:null,scope:"Няма проверена температурна граница"},
  ripening:{name:"Узряване",min:null,max:null,scope:"Няма проверена температурна граница"},
  harvest:{name:"Беритба",min:null,max:null,scope:"Няма проверена температурна граница"},
  overwintering:{name:"Зимуване / защита",min:null,max:null,scope:"Без доказана сортова студоустойчивост; не означава устойчивост на слана"}
};
let hourly=null, locationInfo=null;
function number(v,d=1){return Number.isFinite(v)?v.toLocaleString("bg-BG",{minimumFractionDigits:d,maximumFractionDigits:d}):"—"}
function finite(values){return values.filter(Number.isFinite)}
function average(values){const v=finite(values);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null}
function sum(values){return finite(values).reduce((a,b)=>a+b,0)}
function stats(values){const v=finite(values);return v.length?{avg:average(v),min:Math.min(...v),max:Math.max(...v)}:{avg:null,min:null,max:null}}
function yearOptions(){const end=new Date().getFullYear()-1;for(let y=end;y>=1995;y--){const o=document.createElement("option");o.value=y;o.textContent=y;$("year").append(o)}for(const [i,m] of months.entries()){for(const id of ["month","stageMonth"]){const o=document.createElement("option");o.value=i+1;o.textContent=m;$(id).append(o)}}$("stageMonth").value="5";for(const [id,stage] of Object.entries(PHASES)){const o=document.createElement("option");o.value=id;o.textContent=stage.name;$("stage").append(o)}$("stage").value="fruit_set"}
function selectedEntries(){if(!hourly)return [];const m=$("month").value;return hourly.time.map((time,i)=>({time,i})).filter(x=>m==="all"||Number(x.time.slice(5,7))===Number(m))}
function setStatus(message,error=false){$("status").textContent=message;$("status").classList.toggle("error",error)}
function ymdNext(day){const x=new Date(day+"T12:00:00Z");x.setUTCDate(x.getUTCDate()+1);return x.toISOString().slice(0,10)}
async function fetchClimate(){
  const lat=Number($("lat").value),lon=Number($("lon").value),year=Number($("year").value);
  if(!Number.isFinite(lat)||lat< -90||lat>90||!Number.isFinite(lon)||lon< -180||lon>180){setStatus("Некоректни координати.",true);return}
  $("load").disabled=true;setStatus("Заявка към Open-Meteo за "+year+" г.…");
  const q=new URLSearchParams({latitude:String(lat),longitude:String(lon),start_date:year+"-01-01",end_date:year+"-12-31",hourly:VARIABLES.join(","),models:"era5_land",timezone:"Europe/Sofia"});
  const url="https://archive-api.open-meteo.com/v1/archive?"+q.toString();
  try{
    const response=await fetch(url,{headers:{accept:"application/json"}});
    const data=await response.json();
    if(!response.ok||data.error||!data.hourly?.time?.length)throw new Error(data.reason||"Липсва почасова серия");
    for(const key of VARIABLES){if(!Array.isArray(data.hourly[key]))throw new Error("Липсва параметър: "+key)}
    hourly=data.hourly;locationInfo={lat,lon,year,model:"era5_land",response_lat:data.latitude,response_lon:data.longitude,elevation:data.elevation};
    $("csv").disabled=false;$("coords").textContent=lat.toFixed(4)+", "+lon.toFixed(4);
    setStatus("Заредени "+hourly.time.length.toLocaleString("bg-BG")+" часови записа · ERA5-Land · "+year+" г. Данни за моделна клетка, не за датчик на терена.");
    render();
  }catch(e){setStatus("Неуспешно зареждане: "+e.message+". Проверете достъпността на Open-Meteo и опитайте отново.",true)}
  finally{$("load").disabled=false}
}
function render(){
  if(!hourly)return;
  const entries=selectedEntries(),idx=entries.map(x=>x.i);
  const select=key=>idx.map(i=>hourly[key][i]);
  const temps=finite(select("temperature_2m")),tempStats=stats(temps);
  $("avgTemp").textContent=number(tempStats.avg);
  $("minTemp").textContent=number(tempStats.min);
  $("frostHours").textContent=temps.filter(x=>x<0).length.toLocaleString("bg-BG");
  $("heatHours").textContent=temps.filter(x=>x>30).length.toLocaleString("bg-BG");
  $("rainTotal").textContent=number(sum(select("precipitation")));
  $("solarTotal").textContent=number(sum(select("shortwave_radiation"))/1000);
  monthlyTable();draw();renderTraits()
}
function monthlyTable(){
  const rows=[];
  for(let m=1;m<=12;m++){
    const ix=hourly.time.flatMap((time,i)=>Number(time.slice(5,7))===m?[i]:[]);
    const t=finite(ix.map(i=>hourly.temperature_2m[i]));
    const s=stats(t);
    rows.push("<tr><td>"+months[m-1]+"</td><td>"+number(s.avg)+"</td><td>"+number(s.min)+"</td><td>"+number(s.max)+"</td><td>"+t.filter(x=>x<0).length+"</td><td>"+t.filter(x=>x>30).length+"</td><td>"+number(sum(ix.map(i=>hourly.precipitation[i])))+"</td></tr>");
  }
  $("monthly").innerHTML=rows.join("");
}
function draw(){
  const canvas=$("hourChart"),rect=canvas.getBoundingClientRect();
  if(rect.width<10)return;
  const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.floor(rect.width*dpr),h=Math.floor(rect.height*dpr);
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
  const W=rect.width,H=rect.height,p={l:51,r:16,t:18,b:32},pw=W-p.l-p.r,ph=H-p.t-p.b;
  ctx.clearRect(0,0,W,H);
  const key=$("variable").value,entries=selectedEntries();
  const values=entries.map(x=>hourly[key][x.i]);
  const valid=finite(values);if(!valid.length){ctx.fillStyle="#a0b4a8";ctx.fillText("Няма данни",20,30);return}
  let lo=Math.min(...valid),hi=Math.max(...valid);if(lo===hi){lo-=1;hi+=1}const pad=(hi-lo)*.09;lo-=pad;hi+=pad;
  ctx.font="11px system-ui";ctx.strokeStyle="#304439";ctx.fillStyle="#a0b4a8";ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=p.t+ph*i/4,value=hi-(hi-lo)*i/4;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(W-p.r,y);ctx.stroke();ctx.fillText(number(value,1),4,y+3)}
  const n=values.length,bins=Math.max(1,Math.floor(pw)),step=Math.max(1,Math.ceil(n/bins));ctx.strokeStyle="#b3dc85";ctx.lineWidth=1.1;
  for(let i=0;i<n;i+=step){
    const sub=finite(values.slice(i,i+step));if(!sub.length)continue;
    const x=p.l+(i/n)*pw,y1=p.t+(hi-Math.max(...sub))/(hi-lo)*ph,y2=p.t+(hi-Math.min(...sub))/(hi-lo)*ph;
    ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y2===y1?y2+0.5:y2);ctx.stroke();
  }
  ctx.fillStyle="#a0b4a8";const first=entries[0]?.time||"",last=entries.at(-1)?.time||"";
  ctx.fillText(first.slice(0,10),p.l,H-7);ctx.fillText(last.slice(0,10),Math.max(p.l,W-90),H-7);
  ctx.fillText(UNITS[key],Math.max(p.l,W-80),13);
}
function renderTraits(){
 const s=PHASES[$("stage").value],items=[
  ["Култура","Solanum lycopersicum","Вид"],
  ["Сорт","Bobcat F1","Детерминантен · F1 · Syngenta"],
  ["Фаза",s.name,"Събитийно определена"],
  ["Температурен ориентир",s.min===null?"Неизвестен":number(s.min)+"–"+number(s.max)+"°C",s.scope],
  ["Светлина / DLI","Няма фазова стойност","Не заместваме с произволен оптимум"],
  ["UV устойчивост","Неизвестна","Няма измерена стойност за сорта"],
  ["Водно потребление","Неизвестно","Зависи от развитие и почва"],
  ["Почвено pH","Неизвестно в сортовия профил","Не е въведена проверена фазова стойност"]
 ];
 $("traits").innerHTML=items.map(([title,val,note])=>'<div><span class="field-label">'+title+'</span><strong>'+val+'</strong><p>'+note+'</p></div>').join("");
 const insight=$("compatibility");insight.className="insight";
 if(!hourly){insight.textContent="Заредете историческа година, за да сравним температурите с избраната фаза.";return}
 if(s.min===null){insight.textContent="Няма проверени числени граници за тази фаза. Не може да се изчисли надежден температурен индикатор.";return}
 const month=Number($("stageMonth").value),dayCount=Math.max(1,Math.min(180,Number($("duration").value)||30));
 const year=locationInfo.year,start=year+"-"+String(month).padStart(2,"0")+"-01";
 const begin=new Date(start+"T12:00:00Z");const finish=new Date(begin);finish.setUTCDate(finish.getUTCDate()+dayCount);
 const stop=finish.toISOString().slice(0,10);
 const ix=hourly.time.flatMap((t,i)=> t.slice(0,10)>=start && t.slice(0,10)<stop && (!s.night || (Number(t.slice(11,13))>=22||Number(t.slice(11,13))<6)) ? [i]:[]);
 const key=s.variable||"temperature_2m",vals=finite(ix.map(i=>hourly[key][i]));
 if(!vals.length){insight.textContent="Няма данни в избрания диапазон. Проверете началния месец и продължителността.";return}
 const below=vals.filter(v=>v<s.min).length,above=vals.filter(v=>v>s.max).length,within=vals.length-below-above;
 const pct=Math.round(100*within/vals.length);
 insight.classList.add(pct<45?"error":pct<75?"warn":"");
 insight.innerHTML="<strong>Температурен индикатор: "+pct+"% от сравнените часове в зададените граници.</strong><p>"+
 "Период "+start+" → "+stop+" · "+vals.length+" сравними часа · "+below+" под долната граница · "+above+" над горната граница. "+
 "Средно "+number(average(vals))+"°C. "+(s.warning||"")+" </p><p><strong>Не е оценка за вероятност за реколта.</strong> Прагът може да е оптимум, предупредителна стойност или измерване за друга среда; моделът е само първа проверка на климатична съвместимост.</p>";
}
function exportCSV(){
 if(!hourly)return;
 const sep=";",header=["time",...VARIABLES],lines=[header.join(sep)];
 for(const {i} of selectedEntries())lines.push([hourly.time[i],...VARIABLES.map(k=>hourly[k][i]??"")].join(sep));
 const blob=new Blob(["\ufeff",lines.join("\n")],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="agrodb_"+locationInfo.year+"_"+$("month").value+"_hourly.csv";a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000)
}
yearOptions();
$("load").addEventListener("click",fetchClimate);
$("month").addEventListener("change",render);
$("variable").addEventListener("change",draw);
for(const id of ["stage","stageMonth","duration"])$(id).addEventListener("change",renderTraits);
$("csv").addEventListener("click",exportCSV);
window.addEventListener("resize",()=>{if(hourly)draw()});
renderTraits();
