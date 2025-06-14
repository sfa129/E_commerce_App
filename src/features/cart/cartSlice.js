import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { saveCartToFirestore, loadCartFromFirestore } from '../../features/cart/firebaseCartAPI';

const loadCartFromLocalStorage = () => {
  try {
    const serializedCart = localStorage.getItem('cart');
    return serializedCart ? JSON.parse(serializedCart) : [];
  } catch (e) {
    console.warn('Could not load cart from localStorage', e);
    return [];
  }
};

const saveCartToLocalStorage = (cartItems) => {
  try {
    const serializedCart = JSON.stringify(cartItems);
    localStorage.setItem('cart', serializedCart);
  } catch (e) {
    console.warn('Could not save cart to localStorage', e);
  }
};

// 🔁 Thunks for Firestore
export const loadCartFromFirestoreThunk = createAsyncThunk(
  'cart/loadFromFirestore',
  async (uid) => {
    const items = await loadCartFromFirestore(uid);
    saveCartToLocalStorage(items); // Keep localStorage in sync
    return items;
  }
);

export const saveCartToFirestoreThunk = createAsyncThunk(
  'cart/saveToFirestore',
  async ({ uid, cartItems }) => {
    await saveCartToFirestore(uid, cartItems);
  }
);

const initialState = {
  items: loadCartFromLocalStorage(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
      saveCartToLocalStorage(state.items);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      saveCartToLocalStorage(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      saveCartToLocalStorage(state.items);
    },
    increaseQuantity: (state, action) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.quantity += 1;
      }
      saveCartToLocalStorage(state.items);
    },
    decreaseQuantity: (state, action) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
      }
      saveCartToLocalStorage(state.items);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCartFromFirestoreThunk.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  }
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  increaseQuantity,
  decreaseQuantity
} = cartSlice.actions;

export default cartSlice.reducer;
