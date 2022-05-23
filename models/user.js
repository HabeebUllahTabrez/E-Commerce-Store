const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    cart: {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
            },
        ],
    },
});

userSchema.methods.addToCart = function (product) {

    // Updating the cart items
    const cartProductIndex = this.cart.items.findIndex((cartProduct) => {
        return cartProduct.productId.toString() === product._id.toString();
    });

    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        // If the item already exists in the cart -> Incrementing quantity by 1
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        // Pushing the item to the cart
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity,
        });
    }

    // Updating the entire cart with the updated cart items
    const updatedCart = {
        items: updatedCartItems,
    };
    this.cart = updatedCart;
    return this.save();
};

userSchema.methods.deleteItemFromCart = function (productId) {
    // Filtering items whose IDs do not match the ID of the product to be deleted
    const updatedCartItems = this.cart.items.filter((item) => {
        return item.productId.toString() !== productId.toString();
    });

    this.cart.items = updatedCartItems;
    return this.save();
};

userSchema.methods.clearCart = function () {
    this.cart = { items: [] };
    return this.save();
};

module.exports = mongoose.model("User", userSchema);
