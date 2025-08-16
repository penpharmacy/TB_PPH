import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-messaging.js";

// --- Firebase Config ---
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
const addMedBtn = document.getElementById('addMedBtn');

let fcmToken = "";

// ขอสิทธิ์ Notification และรับ FCM token
Notification.requestPermission().then(async (permission)=>{
  if(permission==='granted'){
    fcmToken = await getToken(messaging, { vapidKey: 'BEW_OlIcEMACqhY8gvQJnED9MHFIT5e0Iyp6cOmVdu8LGQn6XwSplZJ-a2FsHJWJvwr5ouW2LdyYJ6P0yCviT3Y' });
    console.log('FCM Token:', fcmToken);
  }
});

onMessage(messaging, (payload)=>{
  alert(payload.notification.body);
});

// --- ฟังก์ชัน UI ---
function renderMedications(){
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
}

// --- เพิ่มยา ---
addMedBtn.addEventListener('click', async ()=>{
  const name = document.getElementById('newMed').value.trim();
  const time = document.getElementById('newMedTime').value;
  if(!name || !time){ alert("กรอกชื่อยาและเวลาให้ครบ"); return; }

  medications.push({name, time, token: fcmToken});
  document.getElementById('newMed').value='';
  document.getElementById('newMedTime').value='19:00';
  renderMedications();
  await saveMedicationsToFirebase();
});

// --- บันทึกยา ---
async function saveMedication(idx){
  const name = document.getElementById(`medName_${idx}`).value.trim();
  const time = document.getElementById(`medTime_${idx}`).value;
  if(!name || !time){ alert("กรอกชื่อยาและเวลาให้ครบ"); return; }

  medications[idx]={name, time, token: fcmToken};
  renderMedications();
  await saveMedicationsToFirebase();
}

// --- ลบยา ---
async function deleteMedication(idx){
  medications.splice(idx,1);
  renderMedications();
  await saveMedicationsToFirebase();
}

// --- บันทึกการกินยา ---
async function markTaken(medName, taken){
  const today = new Date().toLocaleDateString('th-TH');
  const status = taken ? "✅ กินยาแล้ว" : "❌ ไม่ได้กินยา";

  await setDoc(doc(db, "medication_history", today), { [medName]: status, timestamp: new Date() }, { merge:true });
  alert(`บันทึก ${medName} ${status} แล้ว`);
  loadHistory();
}

// --- โหลดประวัติ ---
async function loadHistory(){
  historyTbody.innerHTML='';
  const q = query(collection(db, "medication_history"), orderBy("timestamp"));
  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap=>{
    const date = docSnap.id;
    const data = docSnap.data();
    for(const med in data){
      if(med!=='timestamp'){
        const tr = document.createElement('tr');
        const statusClass = data[med].includes('✅') ? 'status-taken' : 'status-not-taken';
        tr.innerHTML=`<td>${date}</td><td>${med}</td><td class="${statusClass}">${data[med]}</td>`;
        historyTbody.appendChild(tr);
      }
    }
  });
}

// --- บันทึกไป Firebase ---
async function saveMedicationsToFirebase(){
  const colRef = collection(db, "medications_schedule");
  // ลบเก่า
  medications.forEach(async (med)=>{
    await setDoc(doc(colRef, med.name), med);
  });
}

// --- โหลดรายการยา ---
async function loadMedicationsFromFirebase(){
  const snapshot = await getDocs(collection(db, "medications_schedule"));
  medications = [];
  snapshot.forEach(docSnap=>{
    medications.push(docSnap.data());
  });
  renderMedications();
}

// โหลดตอนเริ่ม
loadMedicationsFromFirebase();
loadHistory();

