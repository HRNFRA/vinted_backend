const mongoose = require('mongoose');
const app = require('./app');
const env = require('./utils/validateEnv');


const port = env.PORT;

// Connect to MongoDB and start the server
mongoose.connect(env.MONGO_CONNECTION_STRING)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch(console.error)
