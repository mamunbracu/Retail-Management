import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

export const getCategories = async (req: Request, res: Response) => {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) return handleTableError(error, res);
  res.json(data);
};

export const createCategory = async (req: Request, res: Response) => {
  const { data, error } = await supabase.from("categories").insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("categories").update(req.body).eq("id", id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

export const getProducts = async (req: Request, res: Response) => {
  const { categoryId, search } = req.query;
  let query = supabase.from("products").select("*, categories(name)");
  
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return handleTableError(error, res);
  res.json(data);
};

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("products").select("*, categories(name)").eq("id", id).single();
  if (error) return handleTableError(error, res, null);
  res.json(data);
};

export const createProduct = async (req: Request, res: Response) => {
  const { colors, images, ...rest } = req.body;
  const slug = rest.slug || rest.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  const { data, error } = await supabase.from("products").insert([{
    ...rest,
    slug,
    colors: colors,
    images: images,
    created_at: new Date().toISOString()
  }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { colors, images, ...rest } = req.body;
  const slug = rest.slug || rest.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  const { data, error } = await supabase.from("products").update({
    ...rest,
    slug,
    colors: colors,
    images: images
  }).eq("id", id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

export const getSiteAssets = async (req: Request, res: Response) => {
  const { data, error } = await supabase.from("site_assets").select("*").order("created_at", { ascending: false });
  if (error) return handleTableError(error, res);
  res.json(data);
};

export const createSiteAsset = async (req: Request, res: Response) => {
  const { data, error } = await supabase.from("site_assets").insert([req.body]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

export const updateSiteAsset = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("site_assets").update(req.body).eq("id", id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

export const deleteSiteAsset = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { error } = await supabase.from("site_assets").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    return handleTableError(error, res);
  }
};

export const createOrder = async (req: Request, res: Response) => {
  const { userId, items, totalPrice, userInfo } = req.body;
  const { data, error } = await supabase.from("orders").insert([{
    user_id: userId,
    items: JSON.stringify(items),
    total_price: totalPrice,
    user_info: JSON.stringify(userInfo),
    status: 'Pending',
    created_at: new Date().toISOString()
  }]).select();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

export const getOrdersByUserId = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { data, error } = await supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) return handleTableError(error, res);
  res.json(data);
};

export const getAllCartItems = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        *,
        products (*),
        employees (name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    return handleTableError(error, res);
  }
};

export const getAllWishlists = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("wishlists")
      .select(`
        *,
        products (*),
        employees (name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    return handleTableError(error, res);
  }
};

export const contactForm = async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  // In a real app, you'd save this to a 'contacts' table or send an email
  console.log("Contact Form Submission:", { name, email, message });
  res.json({ success: true, message: "Message received!" });
};

const handleTableError = (error: any, res: Response, defaultData: any = []) => {
  if (error.message && (error.message.includes("Could not find the table") || error.message.includes("relation") || error.code === '42P01')) {
    return res.json(defaultData);
  }
  return res.status(500).json({ error: error.message });
};

export const getWishlist = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { data, error } = await supabase.from("wishlists").select("*, products(*)").eq("user_id", userId);
  if (error) return handleTableError(error, res);
  res.json(data);
};

export const addToWishlist = async (req: Request, res: Response) => {
  const { userId, productId } = req.body;
  const { data, error } = await supabase.from("wishlists").upsert([{ user_id: userId, product_id: productId }]).select();
  if (error) return handleTableError(error, res, { success: false, message: "Table not found" });
  res.json(data[0]);
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  const { userId, productId } = req.params;
  const { error } = await supabase.from("wishlists").delete().eq("user_id", userId).eq("product_id", productId);
  if (error) return handleTableError(error, res, { success: false, message: "Table not found" });
  res.json({ success: true });
};

export const getCart = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { data, error } = await supabase.from("cart_items").select("*, products(*)").eq("user_id", userId);
  if (error) return handleTableError(error, res);
  res.json(data);
};

export const addToCart = async (req: Request, res: Response) => {
  const { userId, productId, quantity, color } = req.body;
  const { data, error } = await supabase.from("cart_items").upsert([{ user_id: userId, product_id: productId, quantity, color }]).select();
  if (error) return handleTableError(error, res, { success: false, message: "Table not found" });
  res.json(data[0]);
};

export const updateCartItem = async (req: Request, res: Response) => {
  const { userId, productId, quantity } = req.body;
  const { data, error } = await supabase.from("cart_items").update({ quantity }).eq("user_id", userId).eq("product_id", productId).select();
  if (error) return handleTableError(error, res, { success: false, message: "Table not found" });
  res.json(data[0]);
};

export const removeFromCart = async (req: Request, res: Response) => {
  const { userId, productId } = req.params;
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
  if (error) return handleTableError(error, res, { success: false, message: "Table not found" });
  res.json({ success: true });
};

export const getUserTheme = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { data, error } = await supabase.from("user_themes").select("*").eq("user_id", userId).single();
  if (error && error.code !== 'PGRST116') return handleTableError(error, res, { theme: 'default', is_dark: false });
  res.json(data || { theme: 'default', is_dark: false });
};

export const updateTheme = async (req: Request, res: Response) => {
  const { userId, theme, isDark } = req.body;
  const { data, error } = await supabase.from("user_themes").upsert([{ user_id: userId, theme, is_dark: isDark }]).select();
  if (error) return handleTableError(error, res, { success: false, message: "Table not found" });
  res.json(data[0]);
};

export const getEcommerceSettings = async (req: Request, res: Response) => {
  const defaultSettings = {
    shop_name: 'Firestation Newsagency',
    footer_about: 'Your one-stop shop for all your news and stationery needs.',
    contact_email: 'contact@firestation.com',
    contact_phone: '+1 234 567 890',
    contact_address: '123 Firestation St, City, Country',
    social_links: { facebook: '#', instagram: '#', twitter: '#' }
  };

  const { data, error } = await supabase.from("ecommerce_settings").select("*").limit(1).single();
  if (error && error.code !== 'PGRST116') return handleTableError(error, res, defaultSettings);
  
  res.json(data || defaultSettings);
};

export const updateEcommerceSettings = async (req: Request, res: Response) => {
  const settings = req.body;
  const { data: existing } = await supabase.from("ecommerce_settings").select("id").limit(1).single();
  
  let result;
  if (existing) {
    result = await supabase.from("ecommerce_settings").update(settings).eq("id", existing.id).select();
  } else {
    result = await supabase.from("ecommerce_settings").insert([settings]).select();
  }
  
  if (result.error) return res.status(500).json({ error: result.error.message });
  res.json(result.data[0]);
};
