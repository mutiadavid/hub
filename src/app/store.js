import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../api/authApi";
import { userApi } from "../api/userApi";
import { logApi } from "../api/logApi"; // <-- added logApi
import { auditApi } from "../api/auditApi"; // <-- added auditApi
import { checklistApi } from "../api/checklistApi";
import { mfaApi } from "../api/mfaApi"; // <-- added mfaApi
import { deferralApi } from "../api/deferralApi"; // <-- added deferralApi
import authReducer from "../api/authSlice";
import deferralReducer from "../api/deferralSlice"; // <-- added deferralReducer
import { extensionApi } from "../api/extensionApi";
import { notificationApi } from "../api/notificationApi";
import { adSearchApi } from "../api/adSearchApi"; // <-- added adSearchApi
import { customerApi } from "../api/customerApi";  // <-- DataWarehouse customer search
import { protectedUploadsApi } from "../api/protectedUploadsApi";


export const store = configureStore({
  reducer: {
    auth: authReducer,
    deferral: deferralReducer, // <-- added deferral reducer
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
     [adSearchApi.reducerPath]: adSearchApi.reducer,
    [checklistApi.reducerPath]: checklistApi.reducer,
    [logApi.reducerPath]: logApi.reducer, // <-- added logApi reducer
    [auditApi.reducerPath]: auditApi.reducer, // <-- added auditApi reducer
    [mfaApi.reducerPath]: mfaApi.reducer, // <-- added mfaApi reducer
    [deferralApi.reducerPath]: deferralApi.reducer, // <-- added deferralApi reducer
    [extensionApi.reducerPath]: extensionApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [customerApi.reducerPath]: customerApi.reducer,  // <-- DataWarehouse customer search
    [protectedUploadsApi.reducerPath]: protectedUploadsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      userApi.middleware,
      adSearchApi.middleware,
      checklistApi.middleware,
      logApi.middleware, // <-- added logApi middleware
      auditApi.middleware, // <-- added auditApi middleware
      mfaApi.middleware, // <-- added mfaApi middleware
      deferralApi.middleware, // <-- added deferralApi middleware
      extensionApi.middleware,
      notificationApi.middleware,
      customerApi.middleware,  // <-- DataWarehouse customer search
      protectedUploadsApi.middleware,
    ),
  devTools: true,
});
