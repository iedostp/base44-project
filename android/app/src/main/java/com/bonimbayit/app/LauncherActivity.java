package com.bonimbayit.app;

import android.net.Uri;
import android.os.Bundle;
import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import androidx.browser.customtabs.CustomTabColorSchemeParams;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

/**
 * Launches the PWA as a Trusted Web Activity.
 *
 * If Chrome supports TWA and Digital Asset Links are verified,
 * the PWA runs full-screen without any browser UI.
 * Otherwise, it falls back to a Custom Tab with a thin toolbar.
 */
public class LauncherActivity extends Activity {

    private static final String TAG = "BonimBayitTWA";
    private static final Uri LAUNCH_URI =
            Uri.parse("https://base44-migration.vercel.app/");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // Build a TWA intent
            CustomTabColorSchemeParams colorScheme =
                    new CustomTabColorSchemeParams.Builder()
                            .setToolbarColor(0xFF1E40AF)    // theme_color
                            .setNavigationBarColor(0xFFFFFFFF)
                            .build();

            TrustedWebActivityIntentBuilder builder =
                    new TrustedWebActivityIntentBuilder(LAUNCH_URI)
                            .setDefaultColorSchemeParams(colorScheme);

            // Launch as TWA — Chrome will verify assetlinks.json
            // If verification fails, it falls back to Custom Tabs automatically
            Intent twaIntent = builder.build(null).getIntent();
            twaIntent.setPackage("com.android.chrome");
            startActivity(twaIntent);
        } catch (Exception e) {
            Log.w(TAG, "TWA launch failed, falling back to Custom Tab", e);
            // Fallback: open as a regular Custom Tab
            new CustomTabsIntent.Builder()
                    .setDefaultColorSchemeParams(
                            new CustomTabColorSchemeParams.Builder()
                                    .setToolbarColor(0xFF1E40AF)
                                    .build())
                    .build()
                    .launchUrl(this, LAUNCH_URI);
        }

        finish();
    }
}
