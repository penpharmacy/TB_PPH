import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyBcINCCqaoBBbV4egcbQ2W422ttwFl-dhE",
  authDomain: "tbmedicationreminder.firebaseapp.com",
  projectId: "tbmedicationreminder",
  storageBucket: "tbmedicationreminder.firebasestorage.app",
  messagingSenderId: "658947281549",
  appId: "1:658947281549:web:cb41c127f8b3174e83c8c4",
  measurementId: "G-Z27P0C9192"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app);

let medications = [];
const medListDiv = document.getElementById('medList');
const historyTbody = document.querySelector('#historyTable tbody');

Notification.requestPermission().then((permission)=>{
  if(permission==='granted'){
    getToken(messaging, { vapidKey: 'BEW_OlIcEMACqhY8gvQJnED9MHFIT5e0Iyp6cOmVdu8LGQn6XwSplZJ-a2FsHJWJvwr5ouW2LdyYJ6P0yCviT3Y' })
    .then(token=>{
      console.log('FCM Token:', token);
    });
  }
});

onMessage(messaging, (payload)=>{
  alert(payload.notification.body);
});

window.addMedication = async function(){
  const name = document.getElementById('newMed').value.trim();
  const time = document.getElementById('newMedTime').value;
  if(!name || !time) return alert("กรอกชื่อยาและเวลาให้ครบ");
  medications.push({name,time});
  document.getElementById('newMed').value='';
  document.getElementById('newMedTime').value='19:00';
  renderMedications();
  await setDoc(doc(db,'medications','list'),{medications});
}

window.renderMedications = async function(){
  medListDiv.innerHTML='';
  medications.forEach((med, idx)=>{
    const div=document.createElement('div');
    div.className='med';
    div.innerHTML=`
      <input id="medName_${idx}" value="${med.name}">
      <input type="time" id="medTime_${idx}" value="${med.time}" step="60">
      <button onclick="saveMedication(${idx})" class="save">บันทึก</button>
      <button onclick="deleteMedication(${idx})" class="delete">ลบ</button>
      <button onclick="markTaken('${med.name}', true)" class="taken">✅ กินยาแล้ว</button>
      <button onclick="markTaken('${med.name}', false)" class="not-taken">❌ ไม่ได้กินยา</button>
    `;
    medListDiv.appendChild(div);
  });
  scheduleAllNotifications();
}

window.saveMedication = async function(idx){
  const name = document.getElementById(`medName_${idx}`).value.trim();
  const time = document.getElementById(`medTime_${idx}`).value;
  if(!name || !time) return alert("กรอกชื่อยาและเวลาให้ครบ");
  medications[idx]={name,time};
  renderMedications();
  await setDoc(doc(db,'medications','list'),{medications});
}

window.deleteMedication = async function(idx){
  medications.splice(idx,1);
  renderMedications();
  await setDoc(doc(db,'medications','list'),{medications});
}

window.markTaken = async function(medName, taken){
  const today = new Date().toLocaleDateString('th-TH');
  const status = taken ? "✅ กินยาแล้ว" : "❌ ไม่ได้กินยา";
  await setDoc(doc(db,'medication_history',today),{[medName]:status,timestamp:new Date()},{merge:true});
  loadHistory(true, medName);
}

window.loadHistory = async function(flash=false, highlightMed=null){
  historyTbody.innerHTML='';
  const q = query(collection(db,'medication_history'),orderBy('timestamp'));
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap=>{
    const date = docSnap.id;
    const data = docSnap.data();
    for(const med in data){
      if(med!=='timestamp'){
        const tr = document.createElement('tr');
        const statusClass = data[med].includes('✅') ? 'status-taken':'status-not-taken';
        tr.innerHTML=`<td>${date}</td><td>${med}</td><td class="${statusClass}">${data[med]}</td>`;
        historyTbody.appendChild(tr);
        if(flash && med===highlightMed){
          const tdStatus = tr.querySelector('td.status-taken, td.status-not-taken');
          tdStatus.classList.add('flash');
          setTimeout(()=> tdStatus.classList.remove('flash'),800);
        }
      }
    }
  });
}

window.scheduleAllNotifications = function(){
  if(Notification.permission!=='granted'){ Notification.requestPermission(); return; }
  medications.forEach(med=>{
    const [hour,minute]=med.time.split(':').map(Number);
    const now = new Date();
    const thailandNow = new Date(now.getTime() + 7*3600000);
    let notifTime = new Date(thailandNow);
    notifTime.setHours(hour,minute,0,0);
    if(notifTime<thailandNow) notifTime.setDate(notifTime.getDate()+1);
    const timeout = notifTime.getTime()-thailandNow.getTime();
    setTimeout(()=>{
      new Notification('เวลากินยา',{body:`โปรดรับประทาน ${med.name} เวลา ${med.time}`});
      scheduleAllNotifications();
    }, timeout);
  });
}

window.loadMedicationsFromFirebase = async function(){
  const docSnap = await getDoc(doc(db,'medications','list'));
  if(docSnap.exists()){ medications = docSnap.data().medications||[]; renderMedications(); }
}

window.loadMedicationsFromFirebase();
window.loadHistory();
