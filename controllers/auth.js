const bcrypt = require("bcryptjs");

const User = require("../models/user");

exports.getLogin = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: message,
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: message,
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                req.flash("error", "Invalid email.");
                return res.redirect("/login");
            }

            if (bcrypt.compareSync(password, user.password)) {
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save((err) => {
                    res.redirect("/");
                });
            } else {
                req.flash("error", "Invalid password.");
                res.redirect("/login");
            }
        })
        .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    User.findOne({
        email: email,
    })
        .then((userDoc) => {
            // If the user with that email already exists
            if (userDoc) {
                req.flash(
                    "error",
                    "User with the entered email already exists."
                );
                return res.redirect("/signup");
            }
            // If the user doesnt exist (NEW USER)

            const hashedPassword = bcrypt.hashSync(password, 12);
            const user = new User({
                email,
                password: hashedPassword,
                cart: { items: [] },
            });

            return user.save();
        })
        .then((result) => {
            res.redirect("/login");
        })
        .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        res.redirect("/");
    });
};
