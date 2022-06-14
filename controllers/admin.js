const { validationResult } = require("express-validator");

const Product = require("../models/product");
const fileHelper = require("../util/file");

const ITEMS_PER_PAGE = 3;

exports.getAddProduct = (req, res, next) => {
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        hasError: false,
        editing: false,
        errorMessage: null,
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const userId = req.user;

    console.log(req.file);

    if (!image) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: { title, price, description },
            errorMessage: "Attached file is not an image.",
        });
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors);

        return res.status(422).render("admin/edit-product", {
            pageTitle: "Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: { title, imageUrl, price, description },
            errorMessage: errors.array()[0].msg,
        });
    }

    const imageUrl = image.path;

    const product = new Product({
        title,
        price,
        description,
        imageUrl,
        userId,
    });

    product
        .save()
        .then((result) => {
            console.log("Product has been added");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    const prodId = req.params.productId;
    if (!editMode) {
        return res.redirect("/");
    }
    Product.findById(prodId)
        .then((product) => {
            if (!product) {
                return res.redirect("/404");
            }
            res.render("admin/edit-product", {
                pageTitle: "Edit Product",
                path: "/admin/edit-product",
                editing: editMode,
                hasError: false,
                product: product,
                errorMessage: null,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.id;
    const updatedTitle = req.body.title;
    const image = req.file;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // console.log(errors);

        return res.status(422).render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId,
            },
            errorMessage: errors.array()[0].msg,
        });
    }

    Product.findById(prodId)
        .then((product) => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect("/");
            }

            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }

            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;

            return product
                .save()
                .then((result) => {
                    console.log("Product has been updated");
                    res.redirect("/admin/products");
                })
                .catch((err) => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find({ userId: req.user._id })
        // .select("title price -_id")
        // .populate("userId", "name")
        .countDocuments()
        .then((numOfProds) => {
            totalItems = numOfProds;
            return Product.find({ userId: req.user._id })
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then((products) => {
            res.render("admin/products", {
                prods: products,
                pageTitle: "Admin Products",
                path: "/admin/products",
                currPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.id;

    Product.findById(prodId)
        .then((product) => {
            if (!product) {
                return next(new Error("Product Not Found"));
            }
            
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        .then((result) => {
            console.log("Product has been deleted");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
