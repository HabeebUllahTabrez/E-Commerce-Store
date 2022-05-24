const bcrypt = require("bcryptjs");

const User = require("../models/user");

exports.getLogin = (req, res, next) => {
    let isLoggedIn;
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        isAuthenticated: req.session.isLoggedIn,
    });
};

exports.getSignup = (req, res, next) => {
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        isAuthenticated: false,
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                return res.redirect("/login");
            }

            if (bcrypt.compareSync(password, user.password)) {
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save((err) => {
                    res.redirect("/");
                });
            } else {
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
