
const http = require('http');
const app = require('./app');
const port = process.env.PORT || 3000;
const bodyParse = require("body-parser");
const cookieParser = require("cookie-parser")
const authRoutes = require('./routes/auth.routes');
const server = http.createServer(app);


app.use(bodyParse.urlencoded({extended: true}));
app.use(cookieParser());



app.get("/", (req, res) => res.send("Supabase Auth Backend Running"));
server.listen(port, () =>{
  console.log(`server is running on port ${port}`);
});