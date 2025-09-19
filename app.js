const dotenv = require('dotenv');
dotenv.config();
const authRoutes = require('./routes/auth.routes')
const ridesRoutes = require('./routes/rides.routes');
const paymentsRoutes = require("./routes/payments.routes");
const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true,
}));
app.use(express.json());



//Routes
app.use('/api/auth',authRoutes );
app.use('/api/rides', ridesRoutes);
app.use('/api/payments', paymentsRoutes);


module.exports = app;
