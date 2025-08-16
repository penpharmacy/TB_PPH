import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBcINCCqaoBBbV4egcbQ2W422ttwFl-dhE",
  authDomain: "tbmedicationreminder.firebaseapp.com",
  projectId: "tbmedicationreminder",
  storageBucket: "tbmedicationreminder.firebasestorage.app",
  messagingSenderId: "658947281549",
  appId: "1:658947281549:web:cb41c127f8b3174e83c8c4",
  measurementId: "G-Z27P0C9192"
};

const VAPID_KEY = "PASTE_YOUR_PUBLIC_VAPID_KEY_HERE";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

Notification.requestPermission().then((permission)=>{
  if(permission==="granted"){
    getToken(messaging,{vapIDKey:VAPID_KEY}).then(token=>console.log("FCM Token:",token));
  }
});

// Medications local
let medications=[];

window.addMedication=function(){
  const username=document.getElementById("username").value.trim();
  const medName=document.getElementById("medName").value.trim();
  const medTime=document.getElementById("medTime").value;
  if(!username||!medName||!medTime){alert("กรุณากรอกข้อมูลให้ครบ");return;}
  medications.push({username,medName,medTime,taken:false,createdAt:new Date().toISOString()});
  renderList();
  document.getElementById("medName").value='';
};

function renderList(){
  const medList=document.getElementById("medList");
  medList.innerHTML='';
  medications.forEach((med,index)=>{
    const li=document.createElement("li");
    li.innerHTML=`<div class='left'><div><strong>${med.medName}</strong></div><div class='small'>ผู้ใช้: ${med.username} • เวลา ${med.medTime}</div></div>`;
    const btn=document.createElement("button");
    btn.textContent="กินแล้ว";
    btn.onclick=()=>markAsTaken(index);
    li.appendChild(btn);
    medList.appendChild(li);
  });
}

function markAsTaken(index){
  const med=medications[index];
  med.taken=true;
  const historyList=document.getElementById("historyList");
  const li=document.createElement("li");
  li.innerHTML=`<div class='left'><div><strong>${med.medName}</strong></div><div class='small'>${med.username} • ${new Date().toLocaleString('th-TH')}</div></div><div class='small'>✅ กินแล้ว</div>`;
  historyList.prepend(li);
  renderList();
}

// แจ้งเตือนทุก 2 นาที หากยังไม่กิน
let pendingLocal={};
function formatHHMM(d){return String(d.getHours()).padStart(2,'0')+":"+String(d.getMinutes()).padStart(2,'0');}
setInterval(()=>{
  const now=new Date();
  const hhmm=formatHHMM(now);
  medications.forEach((med)=>{
    const key=`${med.username}|${med.medName}|${med.medTime}`;
    if(med.medTime===hhmm && !med.taken){
      const last=pendingLocal[key]||0;
      if(Date.now()-last>2*60*1000){
        pendingLocal[key]=Date.now();
        if(Notification.permission==='granted'){try{new Notification('ถึงเวลาแล้ว: '+med.medName,{body:`${med.username} - กรุณากินยา`,icon:'icon-192.png'});}catch(e){console.warn(e);}}
        try{document.getElementById('alarmSound').play();}catch(e){console.warn(e);}
      }
    }
  });
},15000);

// Handle messages when tab open
onMessage(messaging,(payload)=>{
  const title=payload.notification?.title||'แจ้งเตือน';
  const body=payload.notification?.body||'';
  if(Notification.permission==='granted'){try{new Notification(title,{body,icon:payload.notification?.icon});}catch(e){console.warn(e);}}
});
