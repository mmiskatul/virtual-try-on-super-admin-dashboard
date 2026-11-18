import { configureStore } from '@reduxjs/toolkit';
import platformReducer from './slices/platformSlice';
import { adminUiSlice } from './slices/legacyAdminSlices';
import { platformPersistenceMiddleware } from './middleware/persistence';

export const store = configureStore({
  reducer: {
    platform: platformReducer,
    adminUi: adminUiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).prepend(platformPersistenceMiddleware.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

