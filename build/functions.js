(()=>{"use strict";let t=new Map,e=!1;async function o(){e=!1;const o=new Map(t);t.clear();const n=Array.from(o.entries()).sort(((t,e)=>t[0].getTime()-e[0].getTime())),r=new Map;let a=null,s=[];for(let t=0;t<n.length;t++){const[e,o]=n[t];null==a&&(a=e);for(const t of o)s.push(t);if(e-a>31536e6||t==n.length-1){const t=`http://localhost:38820/https://api.aeso.ca/report/v1.1/price/poolPrice?startDate=${a.getUTCFullYear().toFixed()}-${(a.getUTCMonth()+1).toFixed().padStart(2,"0")}-${(a.getUTCDate()+1).toFixed().padStart(2,"0")}&endDate=${e.getUTCFullYear().toFixed()}-${(e.getUTCMonth()+1).toFixed().padStart(2,"0")}-${(e.getUTCDate()+1).toFixed().padStart(2,"0")}`;r.set(t,s),a=null,s=[]}}const i=[];for(const[t,e]of r)i.push(new Promise((async(o,n)=>{try{const o=await fetch(t,{headers:{"X-API-Key":localStorage.getItem("aeso-api-key")}}),n=await o.json();for(const t of e)t.resolve(n)}catch(t){for(const o of e)o.reject(t)}o()})));await Promise.allSettled(i)}CustomFunctions.associate("AESOPOOLPRICE",(async function(n,r){let a=function(t){switch(typeof t){case"string":{const e=new Date(t);if(isNaN(e.getTime()))throw new Error(`Invalid date "${t}".`);return new Date(t)}case"number":return(e=t)<61||(e-=1),new Date(24*(e-25568)*3600*1e3)}var e}(n);const s=await function(n){const r={resolve:void 0,reject:void 0},a=new Promise(((t,e)=>{r.resolve=t,r.reject=e})),s=t.get(n);return s?s.push(r):t.set(n,[r]),e||(e=!0,setTimeout(o,100)),a}(a);console.log(s);const i=`${a.getUTCFullYear()}-${(a.getUTCMonth()+1).toString().padStart(2,"0")}-${(a.getUTCDate()+1).toString().padStart(2,"0")} ${(r-1).toString().padStart(2,"0")}:00`;console.log("Search begin_datetime_mpt",i),console.log(s.return["Pool Price Report"]);for(const t of s.return["Pool Price Report"])if(console.log("Compate",t.begin_datetime_mpt,i),t.begin_datetime_mpt==i)return t.pool_price;throw new Error("Not found.")})),CustomFunctions.associate("XLDATETOJSDATE",(function(t){return dateFromSerial(t).toString()})),CustomFunctions.associate("CREATEFORMATTEDNUMBER",(function(t,e){return{type:"FormattedNumber",basicValue:t,numberFormat:e}})),CustomFunctions.associate("LOGINPUT",(function(t){console.log(typeof t+":",t)}))})();