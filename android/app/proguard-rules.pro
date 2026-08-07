# Keep the JavaScript bridge methods callable from the WebView.
-keepclassmembers class org.drawsplat.ciphersplat.MainActivity$DownloadBridge {
    @android.webkit.JavascriptInterface <methods>;
}
