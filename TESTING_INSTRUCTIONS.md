# Testing Instructions for Wallet Address Saving Fix

## Prerequisites
1. Have Phantom wallet installed in your browser
2. Development environment is running:
   - Frontend: `npm run dev` (http://localhost:5173)
   - Supabase: `supabase start` (http://localhost:54323 for Studio)

## Test Scenarios

### Scenario 1: Manual Wallet Connection
1. Open http://localhost:5173/
2. Click "Sign In" and create/sign in to a test account
3. Click "Connect Wallet" button
4. Approve the connection in Phantom wallet
5. **Expected Result**: 
   - Wallet address appears in header
   - Console shows: "Wallet successfully linked to profile: [address]"
   - No errors displayed

### Scenario 2: Page Refresh with Connected Wallet
1. Complete Scenario 1 first
2. Refresh the page (F5)
3. Sign in again if needed
4. **Expected Result**:
   - Wallet automatically reconnects
   - Address is displayed in header
   - Console shows linking success message

### Scenario 3: Wallet Already Linked to Another Account
1. Complete Scenario 1 with one account
2. Sign out and create a new account
3. Try to connect the same wallet
4. **Expected Result**:
   - Error message: "This wallet is already linked to another account"
   - Wallet connection fails gracefully

### Scenario 4: Database Verification
1. Complete Scenario 1
2. Open Supabase Studio: http://localhost:54323
3. Navigate to Table Editor → profiles
4. Find your user record
5. **Expected Result**:
   - `wallet_address` column contains the correct address
   - Address matches what's shown in the app header

### Scenario 5: Sign Out and Reconnect
1. Complete Scenario 1
2. Click "Sign Out"
3. Sign back in with the same account
4. Click "Connect Wallet"
5. **Expected Result**:
   - Wallet connects successfully
   - Same address is linked again
   - No duplicate entries in database

## Debug Information

### Console Logs to Watch For
- `handleLinkWallet:` - Shows function execution
- `Wallet successfully linked to profile:` - Success confirmation
- `Error in wallet connect callback:` - Callback errors

### Error Messages
- "Wallet or user not found" - Missing data
- "This wallet is already linked to another account" - Duplicate wallet
- "Failed to link wallet" - Network/database error

### Database Tables to Check
- `profiles` table: `wallet_address` column should be populated
- No orphaned wallet addresses should exist

## Troubleshooting

### If wallet doesn't connect:
1. Check if Phantom is installed and unlocked
2. Clear browser cache and try again
3. Check browser console for errors

### If address isn't saved:
1. Check Supabase is running locally
2. Verify user is signed in before connecting wallet
3. Check network tab for failed API calls

### If errors persist:
1. Check `link-wallet` function logs in Supabase
2. Verify environment variables are set
3. Restart both frontend and Supabase services

## Success Criteria
✅ Wallet connects reliably  
✅ Address saves to database immediately  
✅ Works on page refresh  
✅ Proper error handling for edge cases  
✅ No duplicate wallet addresses allowed  
✅ Clean disconnect on sign out
