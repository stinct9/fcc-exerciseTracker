const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')

mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )


const User = mongoose.model('User', {username: String})

const Exercise = mongoose.model('Exercise', {
  userId: String,
  description : String,
  duration : Number,
  date : Date
})


app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/exercise/new-user', (req,res) => {


  User.find({username : req.body.username}, (err, data) => {
    if(err) {
      res.send(err);
    }
    else if(data == ''){
      console.log("user does not exist. Inserting user");
      const newUser = new User({username: req.body.username});
      newUser.save().then( ()=> {
        console.log(newUser);
        res.send(JSON.stringify({"_id" : newUser._id, "username": newUser.username}));
      });

    }
    else res.send(JSON.stringify({"_id" : data[0]._id, "username": data[0].username}));
  })  

  })

app.post('/api/exercise/add', (req,res) => {

  User.find({_id : req.body.userId}, (err, data) => {
    
    if(err) {
      res.send(err);
    }
    else if(data == ''){
      console.log("Invalid user Id. UserId not found in the system");
      res.send("Invalid user Id. UserId not found in the system");
    }
    else {
      const newExercise = new Exercise({
        userId : req.body.userId,
        description : req.body.description,
        duration : req.body.duration,
        date :  new Date(req.body.date)
      });

      newExercise.save().then( () => {
        res.send(JSON.stringify({"_id": newExercise._id, "description":newExercise.description}));
      });

    }

  })
})

app.get('/api/exercise/log', (req,res) => {
  
  //console.log((req.query.to));
  //console.log(new Date(req.query.to));
  


  if(req.query.userId == "") {
    res.send("Unable to fetch without user ID");
  }

  var username;

  User.find({ _id : req.query.userId }, (err, data) => {
    username = data[0].username;
    console.log(data);
  });

  var searchQuery = {userId : req.query.userId};



  //console.log(searchQuery);

  if(req.query.from !== undefined && req.query.to !== undefined) {

    console.log("adding date filters");

    var searchQuery = {

      userId : req.query.userId,
      date : {
          $gte : new Date(req.query.from),
          $lte : new Date(req.query.to)
        }};
  }

  //console.log(searchQuery);

  var count = 0;

  Exercise.find(searchQuery).count( (err,data) => {
    count = data;
  })

  Exercise.find(searchQuery, (err,data) => {
    if(err) {
      res.send(err);
    }
    var temp = {
          "userId" : req.query.userId,
          "username" : username,
          "count" : count,
          "logs" : data
        };


    res.send(temp);

  }).select('description duration date -_id').limit((req.query.limit) ? parseInt(req.query.limit) : 0) ;


  //res.send(JSON.stringify(results));


})


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
