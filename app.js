// app.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ====== Firebase config ====== */
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

/* ====== DOM ====== */
const usernameInput = document.getElementById('username');
const medNameInput = document.getElementById('medName');
const medTimeInput = document.getElementById('medTime');
const medList = document.getElementById('medList');
const historyList = document.getElementById('historyList');
const addBtn = document.getElementById('addBtn');
const enableNotifBtn = document.getElementById('enableNotifBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const alarmSound = document.getElementById('alarmSound');

let username = '';
let notificationsEnabled = false;

/* ====== Helpers ====== */
function formatHHMM(d) {
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
}

/* ====== UI events ====== */
usernameInput.addEventListener('change', (e)=>{
  username = e.target.value.trim();
  loadMedications();
  loadHistory();
});

addBtn.addEventListener('click', addMedication);

/* เปิดการแจ้งเตือน (ต้องมาจากการคลิกผู้ใช้) */
enableNotifBtn.addEventListener('click', async ()=>{
  try {
    const perm = await Notification.requestPermission();
    if(perm === 'granted') {
      notificationsEnabled = true;
      enableNotifBtn.textContent = "แจ้งเตือนเปิดแล้ว";
      enableNotifBtn.disabled = true;
      // พยายามเล่นเสียงเล็กน้อยเพื่อ "unlock" audio (ผู้ใช้คลิกแล้ว จึงอนุญาต)
      try {
        await alarmSound.play();
        alarmSound.pause();
        alarmSound.currentTime = 0;
      } catch(e){
        // ไม่ต้องทำอะไร ถ้า browser ยังบล็อก
        console.warn('Cannot play sound yet:', e);
      }
    } else {
      alert('ผู้ใช้ไม่ได้อนุญาตแจ้งเตือน');
    }
  } catch(e) {
    console.error(e);
  }
});

/* ลบรายการทั้งหมด (สำหรับทดสอบ) */
clearAllBtn.addEventListener('click', async ()=>{
  if(!username) { alert('กรอกชื่อผู้ใช้ก่อน'); return; }
  if(!confirm('ต้องการลบรายการยาและประวัติทั้งหมดของผู้ใช้?')) return;
  // โหลด meds แล้วลบทีละ doc
  const medsSnap = await getDocs(collection(db, 'users', username, 'medications'));
  for(const d of medsSnap.docs) {
    await deleteDoc(doc(db, 'users', username, 'medications', d.id));
  }
  const histSnap = await getDocs(collection(db, 'users', username, 'history'));
  for(const d of histSnap.docs) {
    await deleteDoc(doc(db, 'users', username, 'history', d.id));
  }
  loadMedications();
  loadHistory();
});

/* ====== ฟังก์ชันหลัก ====== */
async function addMedication(){
  if(!username) { alert("กรอกชื่อผู้ใช้ก่อน"); return; }
  const name = medNameInput.value.trim();
  const time = medTimeInput.value;
  if(!name || !time) { alert("กรอกชื่อยาและเวลาให้ครบ"); return; }

  try {
    await addDoc(collection(db, "users", username, "medications"), {name, time});
    medNameInput.value = '';
    loadMedications();
  } catch(e) {
    console.error(e);
    alert("เกิดข้อผิดพลาดขณะเพิ่มยา: " + e.message);
  }
}

async function loadMedications(){
  medList.innerHTML = '';
  if(!username) return;
  try {
    const medSnapshot = await getDocs(collection(db, "users", username, "medications"));
    if(medSnapshot.empty){
      const li = document.createElement('li');
      li.textContent = 'ยังไม่มีรายการยา';
      medList.appendChild(li);
      return;
    }
    // แสดงรายการ
    medSnapshot.forEach(docItem=>{
      const med = docItem.data();
      const li = document.createElement('li');
      const left = document.createElement('div');
      left.className = 'left';
      const info = document.createElement('div');
      info.innerHTML = `<div><strong>${med.name}</strong></div><div class="small">เวลา ${med.time}</div>`;
      left.appendChild(info);
      li.appendChild(left);

      const delBtn = document.createElement('button');
      delBtn.textContent = "ลบ";
      delBtn.onclick = async ()=>{
        if(!confirm('ลบรายการนี้?')) return;
        try{
          await deleteDoc(doc(db, "users", username, "medications", docItem.id));
          loadMedications();
        }catch(e){
          console.error(e);
          alert('ลบไม่สำเร็จ: ' + e.message);
        }
      };
      li.appendChild(delBtn);
      medList.appendChild(li);
    });
  } catch(e) {
    console.error(e);
    medList.innerHTML = '<li>โหลดรายการยาไม่สำเร็จ</li>';
  }
}

async function loadHistory(){
  historyList.innerHTML = '';
  if(!username) return;
  try {
    const q = query(collection(db, "users", username, "history"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    if(snapshot.empty){
      const li = document.createElement('li');
      li.textContent = 'ยังไม่มีประวัติการกินยา';
      historyList.appendChild(li);
      return;
    }
    snapshot.forEach(docItem=>{
      const h = docItem.data();
      const li = document.createElement('li');
      li.innerHTML = `<div class="left"><div><strong>${h.name}</strong></div><div class="small">${h.time} — ${h.timestamp ? '' : ''}</div></div>`;
      historyList.appendChild(li);
    });
  } catch(e){
    console.error(e);
    historyList.innerHTML = '<li>โหลดประวัติไม่สำเร็จ</li>';
  }
}

/* ====== การแจ้งเตือนอัตโนมัติ ====== */
/*
  - ใช้ setInterval ทุก 15 วินาที เพื่อตรวจสอบเวลา (ระหว่างการทดสอบ)
  - เปรียบเทียบเป็น hh:mm (24hr)
  - เพิ่มข้อมูลประวัติลง firestore เมื่อแจ้งเตือนแล้ว
  - ป้องกันไม่ให้แจ้งเตือนซ้ำภายในนาทีเดียวโดยใช้ cache ชั่วคราว
*/
let lastNotified = {}; // key = "username|hh:mm|medname" -> timestamp

async function checkMedications(){
  if(!username) return;
  try {
    const now = new Date();
    const hhmm = formatHHMM(now);
    const medsSnap = await getDocs(collection(db, "users", username, "medications"));
    medsSnap.forEach(async docItem=>{
      const med = docItem.data();
      if(med.time === hhmm) {
        const key = `${username}|${hhmm}|${med.name}`;
        // ถ้าแจ้งเตือนไปแล้วภายใน 90 วินาที ให้ข้าม (กันซ้ำ)
        if(lastNotified[key] && (Date.now() - lastNotified[key] < 90*1000)) return;
        lastNotified[key] = Date.now();

        // Notification
        if(Notification.permission === "granted") {
          try {
            new Notification("ถึงเวลาแล้ว!", { body: `กินยา: ${med.name}`, tag: `${username}-${hhmm}-${med.name}` });
          } catch(e){
            console.warn('Notification error:', e);
          }
        }

        // เสียง (พยายามเล่น ถ้า browser อนุญาต)
        try {
          await alarmSound.play();
        } catch(e){
          console.warn('Cannot play alarm sound:', e);
        }

        // บันทึกประวัติ
        try {
          await addDoc(collection(db, "users", username, "history"), {
            name: med.name,
            time: hhmm,
            timestamp: serverTimestamp()
          });
          loadHistory();
        } catch(e) {
          console.error('Save history failed:', e);
        }
      }
    });
  } catch(e) {
    console.error('checkMedications error:', e);
  }
}

// เริ่มตรวจสอบทุก 15 วินาที
setInterval(checkMedications, 15000);

// โหลดข้อมูลเมื่อเปิดหน้า (ถ้ามี username กรอกไว้)
window.addEventListener('load', ()=> {
  username = usernameInput.value.trim();
  if(username) {
    loadMedications();
    loadHistory();
  }
});

