exports.getLogin = (req, res, next) => {
    let isLoggedIn = false;
    if (req.get("Cookie")) {
        isLoggedIn = req.get("Cookie").split("=")[1];
    }
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        isAuthenticated: isLoggedIn,
    });
};

exports.postLogin = (req, res, next) => {
    res.setHeader("Set-Cookie", "loggedIn=true");
    res.redirect("/");
};
