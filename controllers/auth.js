const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

const User = require("../models/user");

var transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "6c3daaf3c1f9e6",
        pass: "bf9feeed81c528",
    },
});

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

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // console.log(errors.array());
        return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: errors.array()[0].msg,
        });
    }

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // console.log(errors.array());
        return res.status(422).render("auth/signup", {
            path: "/signup",
            pageTitle: "Signup",
            errorMessage: errors.array()[0].msg,
        });
    }

    // If the user doesnt exist (NEW USER)
    const hashedPassword = bcrypt.hashSync(password, 12);
    const user = new User({
        email,
        password: hashedPassword,
        cart: { items: [] },
    });

    user.save()
        .then((user) => {
            res.redirect("/login");
            return transport.sendMail({
                from: "shop@node-complete.com",
                to: user.email,
                subject: "Signup Succeeded",
                html: `<h3>Dear ${user.email},<br><br>You have Successfully signed up</h3>`,
            });
        })
        .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        res.redirect("/");
    });
};

exports.getReset = (req, res, next) => {
    let message = req.flash("error");
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/reset", {
        path: "/reset",
        pageTitle: "Reset Password",
        errorMessage: message,
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect("/reset");
        }
        const token = buffer.toString("hex");
        User.findOne({ email: req.body.email })
            .then((user) => {
                if (!user) {
                    req.flash(
                        "error",
                        "No account with that email address found!"
                    );
                    return res.redirect("/reset");
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then((user) => {
                if (user) {
                    res.redirect("/");
                    return transport.sendMail({
                        from: "shop@node-complete.com",
                        to: req.body.email,
                        subject: "Password Reset",
                        html: `
                        <p>You requested a password request</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset your password</p>
                    `,
                    });
                }
            })
            .catch((err) => console.log(err));
    });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
    })
        .then((user) => {
            let message = req.flash("error");
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render("auth/new-password", {
                path: "/new-password",
                pageTitle: "New Password",
                errorMessage: message,
                passwordToken: token,
                userId: user._id.toString(),
            });
        })
        .catch((err) => console.log(err));
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId,
    })
        .then((user) => {
            const hashedPassword = bcrypt.hashSync(newPassword, 12);
            user.password = hashedPassword;
            user.resetToken = null;
            user.resetTokenExpiration = undefined;
            return user.save();
        })
        .then((result) => {
            res.redirect("/login");
        })
        .catch((err) => console.log(err));
};
