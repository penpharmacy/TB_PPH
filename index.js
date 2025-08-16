const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.sendMedNotifications = functions.pubsub.schedule("every 1 minutes").onRun(async ()=>{
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

  const snapshot = await db.collection("medications_schedule").get();
  snapshot.forEach(async docSnap=>{
    const data = docSnap.data();
    if(data.time === timeStr && data.token){
      await admin.messaging().send({
        notification: { title: "เวลาอาหารยา", body: `โปรดรับประทาน ${data.name} เวลา ${data.time}` },
        token: data.token
      });
    }
  });
});
