package com.bonimbayit.app;

import android.net.Uri;
import android.os.Bundle;
import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import androidx.browser.customtabs.CustomTabColorSchemeParams;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;
import androidx.browser.trusted.TwaLauncher;

/**
 * Launches the PWA as a Trusted Web Activity.
 *
 * Uses TwaLauncher which properly manages the CustomTabsSession lifecycle.
 * If Chrome supports TWA and Digital Asset Links are verified,
 * the PWA runs full-screen without any browser UI.
 * Otherwise, it falls back to a Custom Tab with a thin toolbar.
 */
public class LauncherActivity extends Activity {

    private static final String TAG = "BonimBayitTWA";
    private static final Uri LAUNCH_URI =
            Uri.parse("https://base44-migration.vercel.app/");

    private TwaLauncher mTwaLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        CustomTabColorSchemeParams colorScheme =
                new CustomTabColorSchemeParams.Builder()
                        .setToolbarColor(0xFF1E40AF)
                        .setNavigationBarColor(0xFFFFFFFF)
                        .build();

        TrustedWebActivityIntentBuilder twaBuilder =
                new TrustedWebActivityIntentBuilder(LAUNCH_URI)
                        .setDefaultColorSchemeParams(colorScheme);

        mTwaLauncher = new TwaLauncher(this);
        mTwaLauncher.launch(twaBuilder, null, null);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (mTwaLauncher != null) {
            mTwaLauncher.destroy();
        }
    }
}
