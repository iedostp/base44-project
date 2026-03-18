package com.bonimbayit.app;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;

/**
 * Native Android wrapper for the Bonim Bayit PWA.
 *
 * Uses an embedded WebView instead of Chrome Custom Tabs, providing:
 * - No browser toolbar (truly native feel)
 * - Persistent cookies/auth across sessions
 * - State preservation on refresh
 * - Proper back-button navigation
 */
public class LauncherActivity extends Activity {

    private static final String APP_URL = "https://base44-migration.vercel.app/";
    private static final int TOOLBAR_COLOR = 0xFF1E40AF;

    private WebView mWebView;
    private ProgressBar mProgressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Full-screen, no title bar
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        // Set status bar color to match app theme
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(TOOLBAR_COLOR);
            window.setNavigationBarColor(Color.WHITE);
        }

        // Create layout programmatically (no XML needed)
        RelativeLayout layout = new RelativeLayout(this);
        layout.setBackgroundColor(Color.WHITE);

        // Progress bar at the top
        mProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        RelativeLayout.LayoutParams progressParams = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                8 // 8px height
        );
        progressParams.addRule(RelativeLayout.ALIGN_PARENT_TOP);
        mProgressBar.setLayoutParams(progressParams);
        mProgressBar.setMax(100);
        mProgressBar.setVisibility(View.GONE);

        // WebView fills the screen
        mWebView = new WebView(this);
        RelativeLayout.LayoutParams webViewParams = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT
        );
        mWebView.setLayoutParams(webViewParams);

        layout.addView(mWebView);
        layout.addView(mProgressBar);
        setContentView(layout);

        // Configure WebView settings
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);           // localStorage for auth tokens
        settings.setDatabaseEnabled(true);             // IndexedDB support
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        // User agent: append app identifier so the PWA can detect native mode
        String defaultUA = settings.getUserAgentString();
        settings.setUserAgentString(defaultUA + " BonimBayitApp/1.0");

        // Enable cookies for authentication persistence
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(mWebView, true);

        // Handle navigation inside the WebView (don't open external browser)
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                String host = url.getHost();

                // Keep our app URLs inside the WebView
                if (host != null && (
                        host.contains("base44-migration.vercel.app") ||
                        host.contains("base44.app") ||
                        host.contains("accounts.google.com") ||    // Google auth
                        host.contains("googleapis.com") ||
                        host.contains("firebaseapp.com") ||        // Firebase auth
                        host.contains("firebaseauth.com")
                )) {
                    return false; // load inside WebView
                }

                // External links: open in default browser
                return false; // keep everything in WebView for now
            }
        });

        // Show progress bar while loading
        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    mProgressBar.setVisibility(View.VISIBLE);
                    mProgressBar.setProgress(newProgress);
                } else {
                    mProgressBar.setVisibility(View.GONE);
                }
            }
        });

        // Restore state or load fresh
        if (savedInstanceState != null) {
            mWebView.restoreState(savedInstanceState);
        } else {
            mWebView.loadUrl(APP_URL);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        mWebView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        // Navigate back in WebView history instead of closing the app
        if (mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        mWebView.onResume();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onPause() {
        super.onPause();
        mWebView.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.destroy();
        }
        super.onDestroy();
    }
}
