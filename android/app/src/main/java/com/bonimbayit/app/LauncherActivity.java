package com.bonimbayit.app;

import android.net.Uri;
import android.os.Bundle;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;

import androidx.browser.customtabs.CustomTabColorSchemeParams;
import androidx.browser.customtabs.CustomTabsIntent;

/**
 * Launches the PWA in a Chrome Custom Tab.
 *
 * The Custom Tab opens with the app's theme color in the toolbar,
 * providing a near-native experience. If the Digital Asset Links
 * (assetlinks.json) are properly configured, Chrome may promote
 * this to a full Trusted Web Activity automatically.
 */
public class LauncherActivity extends Activity {

    private static final String TAG = "BonimBayitTWA";
    private static final Uri LAUNCH_URI =
            Uri.parse("https://base44-migration.vercel.app/");
    private static final int TOOLBAR_COLOR = 0xFF1E40AF;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        CustomTabColorSchemeParams colorScheme =
                new CustomTabColorSchemeParams.Builder()
                        .setToolbarColor(TOOLBAR_COLOR)
                        .setNavigationBarColor(Color.WHITE)
                        .build();

        CustomTabsIntent customTabsIntent = new CustomTabsIntent.Builder()
                .setDefaultColorSchemeParams(colorScheme)
                .setShowTitle(true)
                .setShareState(CustomTabsIntent.SHARE_STATE_ON)
                .setUrlBarHidingEnabled(true)
                .build();

        // Prefer Chrome for best PWA support
        customTabsIntent.intent.setPackage("com.android.chrome");

        try {
            customTabsIntent.launchUrl(this, LAUNCH_URI);
        } catch (Exception e) {
            // If Chrome isn't available, try without specifying package
            customTabsIntent.intent.setPackage(null);
            customTabsIntent.launchUrl(this, LAUNCH_URI);
        }

        finish();
    }
}
