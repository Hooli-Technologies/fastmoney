const express = require("express")
const {json, urlencoded, bodyparser} = require("body-parser");
const dotenv = require('dotenv');
const { handle } = require("./process")

dotenv.config();
const app = express()
const port = process.env.PORT || 3000

app.use(json())
app.use(urlencoded({extended: true}));

app.route('/').post((req, res) => {
    handle(req.body.text, req.body.sessionId).then(response => res.send(response))
}).get((req, res) => {
    res.send("It works")
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})