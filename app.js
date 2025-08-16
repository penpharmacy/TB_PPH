import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, doc, addDoc, getDocs, deleteDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 🔹 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBcINCCqaoBBbV4egcbQ2W422ttwFl-dhE",
  authDomain: "tbmedicationreminder.firebaseapp.com",
  projectId: "tbmedicationreminder",
  storageBucket: "tbmedicationreminder.firebasestorage.app",
  messagingSenderId: "658947281549",
  appId: "1:658947281549:web:cb41c127f8b3174e83c8c4",
  measurementId: "G-Z27P0C9192"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ขออนุญาตแจ้งเตือน
if(Notification.permission !== "granted") Notification.requestPermission();

let username = '';
document.getElementById('username').addEventListener('change', (e)=>{
  username = e.target.value.trim();
  loadMedications();
  loadHistory();
});

// เพิ่มยา
async function addMedication() {
  if(!username) { alert("กรอกชื่อผู้ใช้ก่อน"); return; }
  const name = document.getElementById('medName').value.trim();
  const time = document.getElementById('medTime').value;
  if(!name || !time) { alert("กรอกชื่อยาและเวลาให้ครบ"); return; }

  await addDoc(collection(db, "users", username, "medications"), {name, time});
  document.getElementById('medName').value='';
  loadMedications();
}

// โหลดรายการยา
async function loadMedications() {
  const list = document.getElementById('medList');
  list.innerHTML = '';
  if(!username) return;

  const medSnapshot = await getDocs(collection(db, "users", username, "medications"));
  medSnapshot.forEach(docItem=>{
    const med = docItem.data();
    const li = document.createElement('li');
    li.textContent = `${med.name} เวลา ${med.time}`;
    const delBtn = document.createElement('button');
    delBtn.textContent = "ลบ";
    delBtn.onclick = async ()=>{
      await deleteDoc(doc(db, "users", username, "medications", docItem.id));
      loadMedications();
    };
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// โหลดประวัติการกินยา
async function loadHistory() {
  const list = document.getElementById('historyList');
  list.innerHTML = '';
  if(!username) return;

  const q = query(collection(db, "users", username, "history"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  snapshot.forEach(docItem=>{
    const h = docItem.data();
    const li = document.createElement('li');
    li.textContent = `${h.time} - กินยา: ${h.name}`;
    list.appendChild(li);
  });
}

// แจ้งเตือนอัตโนมัติทุกนาที
setInterval(async ()=>{
  if(!username) return;
  const now = new Date();
  const hhmm = now.toTimeString().slice(0,5);

  const medSnapshot = await getDocs(collection(db, "users", username, "medications"));
  medSnapshot.forEach(async docItem=>{
    const med = docItem.data();
    if(med.time === hhmm) {
      if(Notification.permission === "granted")
        new Notification("ถึงเวลาแล้ว!", {body:`กินยา: ${med.name}`});
      document.getElementById('alarmSound').play();
      await addDoc(collection(db, "users", username, "history"), {
        name: med.name,
        time: hhmm,
        timestamp: serverTimestamp()
      });
      loadHistory();
    }
  });
}, 60000);

