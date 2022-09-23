const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json()); //middleware allows you to get incoming data

//url, think urls.py and paths in python
// app.get('/', (req, res) => {
//this is response only appears when at the home and get request (request is /)
//   res
//     .status(200) // default
//before was res.status(200).send('Hello from the server side!')
//     .json({ message: 'Hello from the server side!', app: 'Natours' });
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint');
// });

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { tours: tours },
  });
}); //v1 is version of the api
app.get('/api/v1/tours/:id', (req, res) => {
  console.log(req.params); //variable id in url is param

  const id = req.params.id * 1;
  //by mulitplying by number, automatically chanegs from string to int

  // if (id > tours.length) {
  //   return res.status(404).json({
  //     status: 'fail',
  //     message: 'Invalid ID',
  //   });
  // }
  const tour = tours.find((el) => el.id === id);
  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  //find is a funct that loops through and creates an array that matches]
  //i.e. find the element with id matched with id from parameter

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});

app.post('/api/v1/tours', (req, res) => {
  //console.log(req.body);
  //normally get id from database but no data base so get from last object and add one
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body); //Object.assign merges attributes from another object with new
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
      //201 stands for created
    }
  ); //overwrites file with new object
  //res.send('Done'); //always has to return a response
  //post wont work without middleware, created an object using postnab abd was sent here
}); //url is the same, but diff http method

app.patch('/api/v1/tours/:id', (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  res.status(200).json({
    status: 'status',
    data: {
      tour: '<Updated tour here...>',
    },
  });
});

app.delete('/api/v1/tours/:id', (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  res.status(204).json({
    //204 means no content
    status: 'success',
    data: null, //shows resource no longer exists
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
