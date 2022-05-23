const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const errorController = require("./controllers/error");
const User = require("./models/user");

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    User.findById("619685328a9f64abb5b5eb5b")
        .then((user) => {
            req.user = user;
            next();
        })
        .catch((err) => console.log(err));
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
    .connect(
        "mongodb+srv://habeeb:cYSfWwEZDghb24CQ@cluster0.zmqhg.mongodb.net/shop?retryWrites=true&w=majority"
    )
    .then((result) => {
        return User.findOne()
    })
    .then((user) => {
        if (!user) {
            const user = new User({
                name: "Habeeb",
                email: "test@test.com",
                cart: {
                    items: [],
                },
            });
            user.save();
        }
        return user;
    })
    .then(user => {
        app.listen(3000);
        console.log("The server is up and running at http://localhost:3000");
    })
    .catch((err) => console.log(err));
