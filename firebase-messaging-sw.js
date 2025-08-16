importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBcINCCqaoBBbV4egcbQ2W422ttwFl-dhE",
  authDomain: "tbmedicationreminder.firebaseapp.com",
  projectId: "tbmedicationreminder",
  storageBucket: "tbmedicationreminder.firebasestorage.app",
  messagingSenderId: "658947281549",
  appId: "1:658947281549:web:cb41c127f8b3174e83c8c4",
  measurementId: "G-Z27P0C9192"
});

const messaging=firebase.messaging();

messaging.onBackgroundMessage(function(payload){
  const title=payload.notification?.title||'แจ้งเตือน';
  const options={
    body:payload.notification?.body||'',
    icon:payload.notification?.icon||'/icon-192.png',
    data:payload.data||{}
  };
  self.registration.showNotification(title,options);
});

self.addEventListener('notificationclick',function(event){
  event.notification.close();
  const urlToOpen='/';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(windowClients=>{
    for(let i=0;i<windowClients.length;i++){
      const client=windowClients[i];
      if(client.url===urlToOpen && 'focus' in client){return client.focus();}
    }
    if(clients.openWindow){return clients.openWindow(urlToOpen);}
  }));
});
