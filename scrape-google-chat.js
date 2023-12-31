const express = require('express');
const cors = require('cors');
const router = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({origin: '*'}));
app.use('/scrape', router)


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
