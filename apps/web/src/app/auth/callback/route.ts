// // import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
// import { NextResponse } from 'next/server'
// import { cookies } from 'next/headers'

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server"
import { onSignUpUser } from "@/actions/auth"
import { onSignInUser } from "@/actions/auth"
import { saveGithubInstallation } from "@/actions/github"
import { NextRequest } from "next/server"

// // Force dynamic execution to ensure cookies are handled correctly
// export const dynamic = 'force-dynamic'

// export async function GET(request: Request) {
//   try {
//     const requestUrl = new URL(request.url)
//     const code = requestUrl.searchParams.get('code')
//     const error = requestUrl.searchParams.get('error')
//     const error_description = requestUrl.searchParams.get('error_description')
    
//     // If there's an error, redirect to login with error params
//     if (error || !code) {
//       const signInUrl = new URL('/login', requestUrl.origin)
//       if (error) signInUrl.hash = `error=${error}&error_description=${error_description}`
//       return NextResponse.redirect(signInUrl)
//     }

//     const cookieStore = cookies()
//     const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

//     // Exchange the code for a session
//     const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
//     if (exchangeError) {
//       console.error('Exchange error:', exchangeError)
//       const signInUrl = new URL('/login', requestUrl.origin)
//       signInUrl.hash = `error=server_error&error_description=${encodeURIComponent(exchangeError.message)}`
//       return NextResponse.redirect(signInUrl)
//     }

//     // Get the next URL or default to home
//     const next = requestUrl.searchParams.get('next') ?? '/'
//     return NextResponse.redirect(new URL(next, requestUrl.origin))
//   } catch (error) {
//     console.error('Auth callback error:', error)
//     return NextResponse.redirect(new URL('/login', request.url))
//   }
// } import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions


export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile/edit"; // Default redirect path
  const installationId = searchParams.get("installation_id"); // Check for GitHub App installation ID
  const setupAction = searchParams.get("setup_action"); // Check for setup action (e.g., 'install')
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Construct the profile edit URL (or get from env)
  const profileEditUrl = `${origin}/profile/edit`;
  const githubInstallUrl = `${origin}/profile/edit?tab=integrations`;

  // --- Handle GitHub App Installation Callback ---
  if (installationId) {
    const supabase = await createSupabaseServerClient();

    // Ensure user is logged in to link the installation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error("GitHub App Installation Error: User not logged in.");
        // Redirect to login, potentially passing installation intent?
        return NextResponse.redirect(`${origin}/login?error=github_install_requires_login`);
    }

    // Save the installation ID using the server action
    const saveResult = await saveGithubInstallation(installationId, setupAction);

    if (saveResult.error) {
      console.error('GitHub App Installation Error: Failed to save installation ID.', saveResult.error);
      const message = encodeURIComponent(saveResult.error || 'Failed to link GitHub installation.');
      // Redirect back to the edit page with error
      return NextResponse.redirect(`${githubInstallUrl}?error=github_install_failed&message=${message}`);
    }

    // Redirect back to the profile edit page, indicating success
    return NextResponse.redirect(`${githubInstallUrl}?github_install=complete`);
  }

  // --- Handle Standard OAuth Callback (Supabase) ---
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error: exchangeError, data: { session } } = await supabase.auth.exchangeCodeForSession(code);
    

    if (exchangeError) {
      console.error("OAuth Callback Error (exchangeCodeForSession):", exchangeError);
      return NextResponse.redirect(
        `${origin}/login?error=oauth_callback_failed&message=${encodeURIComponent(
          exchangeError.message || "Could not exchange code for session.",
        )}`,
      );
    }

    // After successful exchange, get user and call onSignInUser
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !user) {
        console.error("OAuth Callback Error: Could not get user after session exchange.", getUserError);
        return NextResponse.redirect(`${origin}/login?error=oauth_callback_user_error`);
    }

    const profileResult = await onSignInUser(user.id);

    if (profileResult.error) {
        console.error("OAuth Callback Error (onSignInUser):", profileResult.error);
        // Allow login but show error? Or redirect to error page?
        // For now, redirect to dashboard but maybe show a toast client-side later.
        return NextResponse.redirect(`${origin}/profile/edit?warning=profile_sync_error`);
    }

    // Redirect based on onboarding status or 'next' param
    const redirectTo = profileResult.data?.onboarded === false
      ? `${origin}/onboarding`
      : `${origin}${next}`;

    return NextResponse.redirect(redirectTo);
  }

  // --- Handle Errors from OAuth Provider ---
  if (error) {
    console.error("OAuth Provider Error in Callback:", { error, errorDescription });
    return NextResponse.redirect(
      `${origin}/login?error=oauth_provider_error&message=${encodeURIComponent(
        errorDescription || error || "An error occurred during authentication.",
      )}`,
    );
  }

  // Fallback redirect if no code, error, or installation_id is present
  console.warn("Callback received without code, error, or installation_id. Redirecting to login.");
  return NextResponse.redirect(`${origin}/login?error=invalid_callback`);
}