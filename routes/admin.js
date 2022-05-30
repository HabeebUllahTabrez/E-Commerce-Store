const express = require("express");
const { body } = require("express-validator");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

// All the paths here start with /admin

router.get("/add-product", isAuth, adminController.getAddProduct);

router.get("/products", isAuth, adminController.getProducts);

router.post(
    "/add-product",
    [
        body("title")
            .isString()
            .withMessage("Please enter a valid Title")
            .trim(),
        body("imageUrl").isURL().withMessage("Please enter a valid Image Url"),
        body("price").isFloat().withMessage("Please enter a valid Price"),
        body("description").trim(),
    ],
    isAuth,
    adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
    "/edit-product",
    [
        body("title")
            .isString()
            .withMessage("Please enter a valid Title")
            .trim(),
        body("imageUrl").isURL().withMessage("Please enter a valid Image Url"),
        body("price").isFloat().withMessage("Please enter a valid Price"),
        body("description").trim(),
    ],
    isAuth,
    adminController.postEditProduct
);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

module.exports = router;
