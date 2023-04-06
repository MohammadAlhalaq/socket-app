const admin = require('firebase-admin');
const express = require("express");
const mongoose = require('mongoose');

const app = express();
const port = 3000;
const http = require('http').createServer(app);
const io = require('socket.io')(http);

mongoose.connect('mongodb://127.0.0.1/mydatabase', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// firebase
const firebaseConfig = {
  apiKey: "AIzaSyAtv1JeyodFWrS3uDSfqmfch6YYB9k9j0g",
  authDomain: "sync-db-b4123.firebaseapp.com",
  projectId: "sync-db-b4123",
  storageBucket: "sync-db-b4123.appspot.com",
  messagingSenderId: "651436963219",
  appId: "1:651436963219:web:c17abe09e4c532f2f8e466",
  measurementId: "G-XQDF4Z72ZX"
};
const serviceAccount = require('./sync-db-b4123-firebase-adminsdk-4p1wd-2aa694e2ae.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  firebaseConfig: firebaseConfig,
  databaseURL: 'https://sync-db-b4123.firestore.googleapis.com'
});

const db = admin.firestore();

const Schema = mongoose.Schema;
  const userSchema = new Schema({
    name: String,
    age: Number,
    firebaseId: Number
  });
  const User = mongoose.model('chat', userSchema);

io.on('connection', (socket) => {
  console.log('a user connected');
  
  socket.on('addUser', (msg) => {
    console.log('message: ' + msg);
    // addUserFirebase({name: msg.name, age: msg.age}, (id) => {
      addUser(msg.name, msg.age, (res) => {
        io.emit('addUser',  res);
      });
    // });
    
  });
  socket.on('updateUser', (msg) => {
    const obj = JSON.parse(msg);
    console.log('message: ' + JSON.parse(msg)._id);
    // let id = "64260cbcf285005014534175";

    User.findByIdAndUpdate(obj._id, {
      "name": obj.name,
      "age": obj.age
  }, { new: true })
    .then(user => {
      console.log(user);
      io.emit('updateUser',  user);

    })
    .catch(error => {
      io.emit('error',  error);

      console.log(error);
    });
    
  });

  socket.on('deletedUser', (msg) => {
    console.log('message: ' + msg);
    User
    .findByIdAndDelete(msg._id)
    .then(user => {
      io.emit('deletedUser',  user);

      console.log(user);
    })
    .catch(error => {
      io.emit('error',  error);

      console.log(error);
    });
    
  });


  socket.on('getUsers', (msg) => {
    console.log('message: ' + msg);

    User
    .find ()
    .then (users => {
      console.log(users[5]);
      io.emit('getUsers',users);
    })
    .catch (error => {
      console.log(error);
      io.emit('error',error+" : some thing error");

    });
  });


  socket.on('getUser', (msg) => {
    console.log('message: ' + msg);

    User
    .findById(msg._id)
    .then(user => {
      io.emit('getUser',user);

      console.log(user);
    })
    .catch(error => {
      console.log(error);
      io.emit('error',"user not found");

    });
    });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

});

// app.use(express.static(__dirname + '/public'));
// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

function addUser(name, age, callback) {
  
  const newUser = new User({
    name,
    age, 
    // firebaseId: id
  });

  newUser.save().then((r) => {
      console.log('User created successfully!', r);
      callback(r)
  }).catch((err) => {
    if (err) {
      console.log(err);
    }
  });
}

http.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});


function addUserFirebase({name, age }, callback) {
  const collectionRef = db.collection('users');

  const data = {
    name,
    age,
  };

  collectionRef.add(data)
    .then(docRef => console.log('Document added with ID: ', callback(docRef.id)))
    .catch(err => console.error('Error adding document: ', err));
}

function getUserFirebase(docId) {
  const documentRef = db.collection('users').doc(docId);
  documentRef.get()
    .then(doc => {
      if (!doc.exists) {
        console.log('No such document!');
      } else {
        console.log('Document data:', doc.data());
      }
    })
    .catch(err => console.error('Error getting document:', err));
}
function getUsersFirebase() {
  const collectionRef = db.collection('users');

  collectionRef.get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => ${doc.data()}`);
      });
    })
    .catch((error) => {
      console.error('Error getting documents: ', error);
    });
}
function getUserFirebase(docId) {
  const documentRef = db.collection('users').doc(docId);
  documentRef.get()
    .then(doc => {
      if (!doc.exists) {
        console.log('No such document!');
      } else {
        console.log('Document data:', doc.data());
      }
    })
    .catch(err => console.error('Error getting document:', err));
}
function updateUserFirebase(docId) {
  const documentRef = db.collection('users').doc(docId);

  const newData = {
    age: 30
  };
  
  documentRef.update(newData)
    .then(() => console.log('Document updated successfully!'))
    .catch(err => console.error('Error updating document: ', err));
}
function deleteUserFirebase(docId) {
  const documentRef = db.collection('users').doc(docId);

  documentRef.delete()
    .then(() => console.log('Document deleted successfully!'))
    .catch(err => console.error('Error deleting document: ', err));
}

