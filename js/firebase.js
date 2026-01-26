const firebaseConfig = {
  apiKey: "AIzaSyDtXuRlcPqow7DTiGwtGtpMWmbyXunTvvE",
  authDomain: "calendrieresl.firebaseapp.com",
  databaseURL: "https://calendrieresl-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "calendrieresl",
  storageBucket: "calendrieresl.firebasestorage.app",
  messagingSenderId: "792675065002",
  appId: "1:792675065002:web:be64fc3a062c08790dc4d3"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.database();