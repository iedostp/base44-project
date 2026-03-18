package com.bonimbayit.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

/**
 * Native Android wrapper for the Bonim Bayit PWA.
 *
 * Designed to look and feel exactly like a native app downloaded from Google Play:
 * - Splash screen with app icon while loading
 * - No browser toolbar, no URL bar, no scrollbars
 * - No overscroll glow, no text selection handles
 * - No long-press context menu
 * - Persistent cookies/auth across sessions
 * - State preservation on configuration changes
 * - Proper back-button navigation
 * - File upload support for documents
 */
public class LauncherActivity extends Activity {

    private static final String APP_URL = "https://base44-migration.vercel.app/";
    private static final int STATUS_BAR_COLOR = 0xFF1E40AF;
    private static final int FILE_CHOOSER_REQUEST = 1001;

    private WebView mWebView;
    private ProgressBar mProgressBar;
    private View mSplashView;
    private ValueCallback<Uri[]> mFileUploadCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Switch from splash theme to app theme
        setTheme(R.style.Theme_LauncherTheme);

        // Immersive status/navigation bar setup
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(STATUS_BAR_COLOR);
        window.setNavigationBarColor(Color.WHITE);

        // Light navigation bar icons (dark icons on white background)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            window.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }

        // Build layout programmatically — no XML, just like a native app
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);

        // === WebView (fills entire screen) ===
        mWebView = new WebView(this);
        mWebView.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        // --- Make WebView feel native ---
        mWebView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
        mWebView.setVerticalScrollBarEnabled(false);    // no scrollbar
        mWebView.setHorizontalScrollBarEnabled(false);  // no scrollbar
        mWebView.setOverScrollMode(View.OVER_SCROLL_NEVER); // no overscroll glow
        mWebView.setBackgroundColor(Color.WHITE);

        // Disable long-press (no "Copy / Share / Select All" popup)
        mWebView.setOnLongClickListener(new View.OnLongClickListener() {
            @Override
            public boolean onLongClick(View v) {
                return true; // consume the event
            }
        });
        mWebView.setLongClickable(false);
        mWebView.setHapticFeedbackEnabled(false);

        // === Progress bar (thin line at top, like native loading indicator) ===
        mProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                6 // very thin — 6px
        );
        mProgressBar.setLayoutParams(progressParams);
        mProgressBar.setMax(100);
        mProgressBar.setVisibility(View.GONE);

        // === Splash overlay (shown until first page finishes loading) ===
        mSplashView = new View(this);
        mSplashView.setBackgroundColor(Color.WHITE);
        mSplashView.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        root.addView(mWebView);
        root.addView(mProgressBar);
        root.addView(mSplashView);
        setContentView(root);

        // === Configure WebView settings ===
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);              // localStorage for auth
        settings.setDatabaseEnabled(true);                // IndexedDB
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);               // security
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportMultipleWindows(false);
        settings.setGeolocationEnabled(false);

        // Viewport: make content fit the screen like a native app
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        // User agent: append identifier so the PWA can detect native mode
        String defaultUA = settings.getUserAgentString();
        settings.setUserAgentString(defaultUA + " BonimBayitApp/1.0");

        // === Cookies for authentication persistence ===
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(mWebView, true);

        // === WebViewClient — handle navigation ===
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                String host = url.getHost();

                // Keep our app URLs + auth flows inside the WebView
                if (host != null && (
                        host.contains("base44-migration.vercel.app") ||
                        host.contains("base44.app") ||
                        host.contains("accounts.google.com") ||
                        host.contains("googleapis.com") ||
                        host.contains("firebaseapp.com") ||
                        host.contains("firebaseauth.com")
                )) {
                    return false; // load inside WebView
                }

                // External links → system browser
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, url);
                    startActivity(intent);
                } catch (ActivityNotFoundException ignored) {}
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                mProgressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                mProgressBar.setVisibility(View.GONE);

                // Hide splash screen on first load
                if (mSplashView != null && mSplashView.getVisibility() == View.VISIBLE) {
                    mSplashView.setVisibility(View.GONE);
                }

                // Inject CSS to disable browser-like behaviors in the web content
                view.evaluateJavascript(
                    "document.documentElement.style.overscrollBehavior = 'none';" +
                    "document.documentElement.style.webkitTapHighlightColor = 'transparent';" +
                    "document.documentElement.style.webkitTouchCallout = 'none';",
                    null
                );
            }
        });

        // === WebChromeClient — progress bar + file uploads ===
        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                mProgressBar.setProgress(newProgress);
                if (newProgress >= 100) {
                    mProgressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {
                if (mFileUploadCallback != null) {
                    mFileUploadCallback.onReceiveValue(null);
                }
                mFileUploadCallback = filePathCallback;
                try {
                    Intent intent = fileChooserParams.createIntent();
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                } catch (ActivityNotFoundException e) {
                    mFileUploadCallback = null;
                    return false;
                }
                return true;
            }
        });

        // === Load content ===
        if (savedInstanceState != null) {
            mWebView.restoreState(savedInstanceState);
            // Still hide splash since we're restoring
            if (mSplashView != null) {
                mSplashView.setVisibility(View.GONE);
            }
        } else {
            mWebView.loadUrl(APP_URL);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (mWebView != null) {
            mWebView.saveState(outState);
        }
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (mFileUploadCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                mFileUploadCallback.onReceiveValue(results);
                mFileUploadCallback = null;
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mWebView != null) {
            mWebView.onResume();
        }
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mWebView != null) {
            mWebView.onPause();
        }
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
