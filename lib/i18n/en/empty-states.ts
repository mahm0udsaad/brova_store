/**
 * Empty States Translations - English
 * 
 * These messages turn "no data" moments into guidance opportunities.
 * Each variant should:
 * - Explain the current state
 * - Suggest a next action
 * - Feel helpful, not disappointing
 */

const emptyStates = {
  // Products
  products: {
    title: "No products yet",
    description: "Start building your store by adding your first product. It only takes a minute.",
    action: "Add Product",
  },

  // Orders
  orders: {
    title: "No orders yet",
    description: "When customers place orders, they'll appear here. Share your store to get started.",
    action: "Browse Products",
  },

  // Search
  search: {
    title: "No results found",
    description: "We couldn't find anything matching your search. Try different keywords or browse our categories.",
    descriptionWithQuery: "We couldn't find anything for \"{query}\". Try different keywords or browse our categories.",
    action: "Clear Search",
  },

  // Cart
  cart: {
    title: "Your cart is empty",
    description: "Discover our collection and add items you love. We'll keep them safe here.",
    action: "Start Shopping",
  },

  // Favorites
  favorites: {
    title: "No favorites yet",
    description: "Tap the heart icon on products you love to save them here for later.",
    action: "Explore Products",
  },

  // Images
  images: {
    title: "No images yet",
    description: "Upload images to bring your products to life. High-quality photos make all the difference.",
    action: "Upload Images",
  },

  // Documents
  documents: {
    title: "No documents",
    description: "Documents you create or receive will appear here.",
    action: "Create Document",
  },

  // Users
  users: {
    title: "No users yet",
    description: "When customers sign up, you'll see them here. Share your store to grow your audience.",
    action: "Invite Users",
  },

  // Analytics
  analytics: {
    title: "No data yet",
    description: "Analytics will appear once your store gets some activity. Check back soon!",
    action: "View Dashboard",
  },

  // Messages
  messages: {
    title: "No messages",
    description: "When customers reach out, their messages will appear here.",
    action: "Start Conversation",
  },

  // Notifications
  notifications: {
    title: "All caught up!",
    description: "You have no new notifications. We'll let you know when something important happens.",
    action: "View Settings",
  },

  // Inbox
  inbox: {
    title: "Inbox is empty",
    description: "New items will appear here when they arrive.",
    action: "Refresh",
  },

  // Folder
  folder: {
    title: "This folder is empty",
    description: "Add files or create subfolders to organize your content.",
    action: "Add Content",
  },

  // AI
  ai: {
    title: "How can I help?",
    description: "I'm your AI assistant. Ask me anything about managing your store, products, or orders.",
    action: "Start Conversation",
  },
} as const

export default emptyStates
