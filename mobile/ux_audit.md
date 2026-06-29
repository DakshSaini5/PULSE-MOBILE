# Pulse App — UX/Accessibility Audit Report

## Critical Issues (Play Store Risk)

| # | File | Issue | Severity |
|---|------|--------|----------|
| 1 | `LoginScreen.tsx` | **Debug alert in production**: `Alert.alert("Debug WebBrowser Result", ...)` is hardcoded. This will popup for every single user that tries Google Sign-In. | 🔴 CRITICAL |
| 2 | `SafeScreen.tsx` | **Ignores `edges` prop entirely**. It always adds `paddingTop: insets.top` regardless of what edges are requested. Screens like `HospitalDetailScreen` that pass `edges={['top','left','right']}` don't get bottom inset protection either. | 🔴 CRITICAL |
| 3 | `AppNavigator.tsx` | **Android back button exits app from nested screens**. No `hardwareBackPress` handler. Users hitting back on HospitalDetail will correctly go back, but on root screens they'll exit directly to Android home instead of showing a confirmation. | 🔴 CRITICAL |
| 4 | `HomeScreen.tsx` | **"? Need Help?" button has no `onPress` handler**. Tapping it does nothing. | 🔴 CRITICAL |

## High Severity (UX Blockers)

| # | File | Issue | Severity |
|---|------|--------|----------|
| 5 | `HomeScreen.tsx` | **No loading skeleton** on the Dashboard Summary stats. Stats default to `0, 0, 0` and then snap to real numbers. Users see broken "0" state on every app open. | 🟠 HIGH |
| 6 | `SearchScreen.tsx` | **No empty state UI** when hospital search returns 0 results. The list just goes blank with no message. | 🟠 HIGH |
| 7 | `SearchScreen.tsx` | **No error state** if `fetchHospitals` throws — error is silently swallowed, user sees nothing. | 🟠 HIGH |
| 8 | `SearchScreen.tsx` | **"Radius" slider is purely decorative** — it's a static `View` with no gesture handler. Moving the slider thumb does absolutely nothing. | 🟠 HIGH |
| 9 | `SearchScreen.tsx` | **"Govt Affiliated" filter chip has no `onPress`** handler. Tapping it does nothing. | 🟠 HIGH |
| 10 | `HospitalDetailScreen.tsx` | **Small tap targets on star ratings** in the review section. Each star is 20×20 dp, well below the 48×48 dp minimum. | 🟠 HIGH |
| 11 | `HospitalDetailScreen.tsx` | **No error feedback when review submission fails**. The `catch` block only calls `console.error` — user never sees an error message. | 🟠 HIGH |
| 12 | `ReportCenterScreen.tsx` | **Back button in `verify`/`detail` views sets `view` to `'list'` but Android hardware back triggers `navigation.goBack()`**, popping the entire screen instead of going back to the list view. Navigation loop. | 🟠 HIGH |
| 13 | `DrawerMenu.tsx` | **Drawer `pt-16` hardcoded** for the header. On devices with large notches (e.g. Pixel 9 Pro), the menu header content clips under the status bar. | 🟠 HIGH |
| 14 | `ProfileScreen.tsx` | **Delete Account in `ProfileScreen` never calls the backend API** — it fires `logout()` directly without hitting `userAPI.deleteAccount()`. Account persists on the server. | 🟠 HIGH |

## Medium Severity (Polish & Compliance)

| # | File | Issue | Severity |
|---|------|--------|----------|
| 15 | `Header.tsx` | **Bell icon has no `onPress` handler** — notification badge shows but tapping the bell does nothing. | 🟡 MEDIUM |
| 16 | `Header.tsx` | **PANIC ATTACK button `py-1.5` is only ~28dp tall** — below the 48dp touch target requirement. | 🟡 MEDIUM |
| 17 | `EmergencyContacts.tsx` | **Edit button shows a hardcoded alert** saying "will be available in the next update" — should be removed or implemented. | 🟡 MEDIUM |
| 18 | `ProfileScreen.tsx` | **No loading state** when `handleUpdateProfile` or `handleAddContact` is in-flight. User can double-tap and submit twice. | 🟡 MEDIUM |
| 19 | `SettingsScreen.tsx` | **Location "Granted" status is hardcoded** as a static string — never reflects actual state dynamically. | 🟡 MEDIUM |
| 20 | `HealthTrendsScreen.tsx` | **Chart renders at fixed pixel width** using `Dimensions.get('window').width - 80`. This is computed once and doesn't react to orientation changes or foldable devices. | 🟡 MEDIUM |
| 21 | `PanicScreen.tsx` | **Breathing timer has a bug** — `setTimeLeft` returns `0` before the phase transition logic fires, causing a 0-second flash on every phase change. | 🟡 MEDIUM |
| 22 | Multiple screens | **`space-y-3`, `space-x-4` NativeWind utilities don't work on RN**. NativeWind v4 does NOT support `space-*` utilities in React Native — they silently fail and add no gap. | 🟡 MEDIUM |

## Low Severity (Consistency & Code Quality)

| # | File | Issue | Severity |
|---|------|--------|----------|
| 23 | `LoginScreen.tsx` | **Back button overlaps `AnimatedBackground`** due to `absolute top-4 left-4` positioning without accounting for safe area on Android status bar. | 🟢 LOW |
| 24 | `DrawerMenu.tsx` | **"Lab Reports" and "Prescriptions" both use `FileText` icon** — visual ambiguity in the menu. | 🟢 LOW |
| 25 | `ReportCenterScreen.tsx` | **Trailing `\r\n` whitespace** on lines 370-373 — signals sloppy file editing. | 🟢 LOW |
