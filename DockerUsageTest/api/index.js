const express = require('express');
const bodyParser = require('body-parser');
const cors=require("cors");
const app = express();
const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}

app.use(cors(corsOptions))
app.use(bodyParser.json());
const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.get('/api/hello2', (req, res) => {
  res.json({ message: '222222222!' });
});