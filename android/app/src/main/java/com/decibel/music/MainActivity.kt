package com.decibel.music

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.webkit.WebSettings
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Configure WebView settings for uninterrupted background audio streaming
        bridge?.webView?.let { webView ->
            webView.settings.apply {
                mediaPlaybackRequiresUserGesture = false
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            }
        }

        // Start native Audio Foreground Service for background playback & MediaSession controls
        val serviceIntent = Intent(this, AudioForegroundService::class.java).apply {
            action = AudioForegroundService.ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    override fun onPause() {
        super.onPause()
        // Prevent the Android system from pausing standard WebView audio/video/JS when backgrounded
        bridge?.webView?.onResume()
    }

    override fun onStop() {
        super.onStop()
        // Re-enforce active WebView execution when app goes entirely to background or screen turns off
        bridge?.webView?.onResume()
    }
}
