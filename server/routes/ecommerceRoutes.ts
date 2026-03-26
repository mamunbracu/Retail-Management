import express from "express";
import { 
  getCategories, 
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts, 
  getProductById, 
  createProduct,
  updateProduct,
  deleteProduct,
  getSiteAssets,
  createSiteAsset,
  updateSiteAsset,
  deleteSiteAsset,
  createOrder, 
  getAllOrders,
  getOrdersByUserId, 
  contactForm,
  getWishlist,
  getAllWishlists,
  addToWishlist,
  removeFromWishlist,
  getCart,
  getAllCartItems,
  addToCart,
  removeFromCart,
  updateCartItem,
  updateTheme,
  getUserTheme,
  getEcommerceSettings,
  updateEcommerceSettings
} from "../controllers/ecommerceController.js";

const router = express.Router();

// Categories
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// Products
router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Site Assets
router.get("/site-assets", getSiteAssets);
router.post("/site-assets", createSiteAsset);
router.put("/site-assets/:id", updateSiteAsset);
router.delete("/site-assets/:id", deleteSiteAsset);
router.get("/orders", getAllOrders);
router.post("/orders", createOrder);
router.get("/orders/user/:userId", getOrdersByUserId);
router.post("/contact", contactForm);

// Settings
router.get("/settings", getEcommerceSettings);
router.post("/settings", updateEcommerceSettings);

// Wishlist
router.get("/wishlist/all", getAllWishlists);
router.get("/wishlist/:userId", getWishlist);
router.post("/wishlist", addToWishlist);
router.delete("/wishlist/:userId/:productId", removeFromWishlist);

// Cart
router.get("/cart/all", getAllCartItems);
router.get("/cart/:userId", getCart);
router.post("/cart", addToCart);
router.put("/cart", updateCartItem);
router.delete("/cart/:userId/:productId", removeFromCart);

// Theme
router.get("/theme/:userId", getUserTheme);
router.post("/theme", updateTheme);

export default router;
