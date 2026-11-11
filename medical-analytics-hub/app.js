// ---------- Data (synthetic; replace with real source) ----------
var DEPTS=["Cardiology","Orthopedics","Neurology","Oncology","Pediatrics","Emergency"];
var DIAG={Cardiology:["Hypertension","Arrhythmia","Heart failure"],Orthopedics:["Fracture","Joint replacement","Spinal injury"],Neurology:["Stroke","Migraine","Epilepsy"],Oncology:["Chemotherapy","Biopsy","Radiation"],Pediatrics:["Asthma","Infection","Dehydration"],Emergency:["Trauma","Sepsis","Poisoning"]};
var NAMES=["Anita Rao","Rahul Mehta","Sana Khan","Vikram Reddy","Priya Nair","Arjun Das","Meera Iyer","Kiran Patel","Farah Ali","Dev Sharma","Lata Joshi","Imran Qureshi","Neha Gupta","Suresh Babu","Divya Menon"];
var MONTHS=["Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov"];
function makeData(){
  var s=42;function r(){s=(s*16807)%2147483647;return s/2147483647}
  var out=[];
  for(var i=0;i<140;i++){
    var d=DEPTS[Math.floor(r()*DEPTS.length)];
    var age=d==="Pediatrics"?Math.floor(1+r()*16):Math.floor(18+r()*72);
    var x=r(),o=x<.08?"Critical":x<.24?"Readmitted":"Recovered";
    out.push({id:"P-"+(1000+i),name:NAMES[Math.floor(r()*NAMES.length)],age:age,dept:d,
      dx:DIAG[d][Math.floor(r()*3)],month:Math.floor(r()*12),
      los:Math.round((2+r()*9+(o==="Critical"?6:0))*10)/10,
      cost:Math.round((900+r()*4200+(d==="Oncology"?3000:0)+(o==="Critical"?4000:0))/10)*10,out:o});
  }
  return out;
}
var ALL=makeData(), dept="All", sortKey="id", sortDir=1, page=0, PER=10;

// ---------- Helpers ----------
function $(id){return document.getElementById(id)}
function avg(a,k){return a.length?a.reduce(function(t,p){return t+p[k]},0)/a.length:0}
function money(n){return "\u20B9"+Math.round(n*83).toLocaleString("en-IN")}
function current(){return dept==="All"?ALL:ALL.filter(function(p){return p.dept===dept})}
function el(t,a,txt){var e=document.createElementNS("http://www.w3.org/2000/svg",t);for(var k in a)e.setAttribute(k,a[k]);if(txt!=null)e.textContent=txt;return e}
function svg(w,h){return el("svg",{viewBox:"0 0 "+w+" "+h,role:"img"})}

// ---------- Charts ----------
function barChart(host,labels,vals,color,fmt){
  var W=420,H=200,pad=28,max=Math.max.apply(null,vals)||1,bw=(W-pad)/labels.length;
  var s=svg(W,H);
  vals.forEach(function(v,i){
    var h=(H-pad-14)*v/max,x=pad+i*bw+bw*.15;
    var rect=el("rect",{class:"bar",x:x,y:H-pad-h,width:bw*.7,height:h,rx:3,fill:color});
    rect.appendChild(el("title",{},labels[i]+": "+(fmt?fmt(v):v)));
    s.appendChild(rect);
    s.appendChild(el("text",{x:x+bw*.35,y:H-pad-h-4,"text-anchor":"middle"},fmt?fmt(v):v));
    s.appendChild(el("text",{x:x+bw*.35,y:H-10,"text-anchor":"middle"},labels[i]));
  });
  host.innerHTML="";host.appendChild(s);
}
function lineChart(host,labels,vals){
  var W=560,H=220,px=30,py=24,max=Math.max.apply(null,vals)||1,n=vals.length;
  var s=svg(W,H),pts=[];
  for(var g=0;g<=4;g++){var y=py+(H-2*py)*g/4;s.appendChild(el("line",{x1:px,x2:W-10,y1:y,y2:y,stroke:"var(--line)"}));
    s.appendChild(el("text",{x:px-6,y:y+4,"text-anchor":"end"},Math.round(max*(1-g/4))))}
  vals.forEach(function(v,i){
    var x=px+(W-px-10)*i/(n-1),y=H-py-(H-2*py)*v/max;pts.push([x,y]);
    s.appendChild(el("text",{x:x,y:H-6,"text-anchor":"middle"},labels[i]));
  });
  s.appendChild(el("polyline",{points:pts.map(function(p){return p.join(",")}).join(" "),fill:"none",stroke:"var(--teal)","stroke-width":2.5,"stroke-linejoin":"round"}));
  pts.forEach(function(p,i){var c=el("circle",{cx:p[0],cy:p[1],r:4,fill:"var(--teal)"});c.appendChild(el("title",{},labels[i]+": "+vals[i]));s.appendChild(c)});
  host.innerHTML="";host.appendChild(s);
}
function outcomeChart(host,data){
  var keys=["Recovered","Readmitted","Critical"],cols=["var(--teal)","var(--gold)","var(--coral)"],tot=data.length||1;
  var s=svg(300,170),y=10;
  keys.forEach(function(k,i){
    var c=data.filter(function(p){return p.out===k}).length,w=220*c/tot;
    s.appendChild(el("text",{x:0,y:y+10},k));
    s.appendChild(el("rect",{x:0,y:y+16,width:220,height:14,rx:3,fill:"var(--sel)"}));
    s.appendChild(el("rect",{x:0,y:y+16,width:w,height:14,rx:3,fill:cols[i]}));
    s.appendChild(el("text",{x:228,y:y+28},c+" ("+Math.round(100*c/tot)+"%)"));
    y+=52;
  });
  host.innerHTML="";host.appendChild(s);
}

// ---------- Render ----------
function renderTabs(){
  var t=$("deptTabs");t.innerHTML="";
  ["All"].concat(DEPTS).forEach(function(d){
    var b=document.createElement("button");b.textContent=d;b.setAttribute("aria-pressed",d===dept);
    b.onclick=function(){dept=d;page=0;render()};t.appendChild(b);
  });
}
function renderKpis(d){
  var re=d.filter(function(p){return p.out==="Readmitted"}).length,cr=d.filter(function(p){return p.out==="Critical"}).length;
  var items=[["Patients",d.length,""],["Average stay",avg(d,"los").toFixed(1)+" days",""],
    ["Readmission rate",(d.length?100*re/d.length:0).toFixed(1)+"%","alert"],["Average cost",money(avg(d,"cost")),""]];
  $("kpis").innerHTML=items.map(function(i){return '<div class="kpi '+i[2]+'"><span>'+i[0]+'</span><b>'+i[1]+'</b></div>'}).join("");
}
function renderCharts(d){
  var m=MONTHS.map(function(_,i){return d.filter(function(p){return p.month===i}).length});
  lineChart($("lineChart"),MONTHS,m);
  outcomeChart($("outChart"),d);
  var groups=[["0-17",0,17],["18-39",18,39],["40-59",40,59],["60+",60,200]];
  barChart($("ageChart"),groups.map(function(g){return g[0]}),groups.map(function(g){return d.filter(function(p){return p.age>=g[1]&&p.age<=g[2]}).length}),"var(--teal)");
  barChart($("losChart"),DEPTS.map(function(x){return x.slice(0,5)}),DEPTS.map(function(x){return +avg(ALL.filter(function(p){return p.dept===x}),"los").toFixed(1)}),"var(--gold)");
}
var COLS=[["id","ID"],["name","Name"],["age","Age"],["dept","Department"],["dx","Diagnosis"],["los","Stay (days)"],["cost","Cost"],["out","Outcome"]];
function renderTable(d){
  var q=$("q").value.toLowerCase(),f=$("outFilter").value;
  var rows=d.filter(function(p){return (!f||p.out===f)&&(!q||(p.name+p.id+p.dx).toLowerCase().indexOf(q)>-1)});
  rows.sort(function(a,b){return (a[sortKey]>b[sortKey]?1:a[sortKey]<b[sortKey]?-1:0)*sortDir});
  var pages=Math.max(1,Math.ceil(rows.length/PER));if(page>=pages)page=pages-1;
  $("thead").innerHTML=COLS.map(function(c){return '<th data-k="'+c[0]+'" tabindex="0" aria-sort="'+(sortKey===c[0]?(sortDir>0?"ascending":"descending"):"none")+'">'+c[1]+(sortKey===c[0]?(sortDir>0?" \u25B2":" \u25BC"):"")+'</th>'}).join("");
  $("tbody").innerHTML=rows.slice(page*PER,page*PER+PER).map(function(p){
    return "<tr><td>"+p.id+"</td><td>"+p.name+"</td><td>"+p.age+"</td><td>"+p.dept+"</td><td>"+p.dx+"</td><td>"+p.los+"</td><td>"+money(p.cost)+'</td><td><span class="tag '+p.out+'">'+p.out+"</span></td></tr>";
  }).join("")||'<tr><td colspan="8">No patients match. Clear the search or change the outcome filter.</td></tr>';
  $("count").textContent=rows.length+" patients \u2022 page "+(page+1)+" of "+pages;
  $("prev").disabled=page===0;$("next").disabled=page>=pages-1;
  Array.prototype.forEach.call($("thead").children,function(th){
    function go(){var k=th.getAttribute("data-k");sortDir=sortKey===k?-sortDir:1;sortKey=k;renderTable(current())}
    th.onclick=go;th.onkeydown=function(e){if(e.key==="Enter")go()};
  });
}
function render(){renderTabs();var d=current();renderKpis(d);renderCharts(d);renderTable(d)}
$("q").oninput=function(){page=0;renderTable(current())};
$("outFilter").onchange=function(){page=0;renderTable(current())};
$("prev").onclick=function(){page--;renderTable(current())};
$("next").onclick=function(){page++;renderTable(current())};
render();
