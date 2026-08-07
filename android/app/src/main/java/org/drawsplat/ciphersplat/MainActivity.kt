package org.drawsplat.ciphersplat

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature

/**
 * Minimal native shell around the bundled CipherSplat web app.
 *
 * The web app is served from a real (secure) origin via WebViewAssetLoader so
 * that Web Crypto, Web Workers, Subresource Integrity, and the app's strict
 * Content-Security-Policy all behave exactly as they do on the website. No
 * network is available to the WebView (the app has no INTERNET permission), so
 * all cryptography stays on-device.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result: ActivityResult ->
        val callback = fileChooserCallback
        fileChooserCallback = null
        callback?.onReceiveValue(
            if (result.resultCode == Activity.RESULT_OK) parseChooserResult(result.data) else arrayOf()
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
        setContentView(webView)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.settings.apply {
            javaScriptEnabled = true
            // CipherSplat intentionally persists nothing; keep the WebView the same.
            domStorageEnabled = false
            databaseEnabled = false
            allowFileAccess = false
            allowContentAccess = false
            cacheMode = WebSettings.LOAD_NO_CACHE
            mediaPlaybackRequiresUserGesture = true
            setGeolocationEnabled(false)
            setSupportMultipleWindows(false)
        }
        WebView.setWebContentsDebuggingEnabled(false)

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                // Never leave the bundled app origin. There is no network anyway.
                return request.url.host != APP_HOST
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                view: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                fileChooserCallback?.onReceiveValue(null)
                fileChooserCallback = filePathCallback
                val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    putExtra(
                        Intent.EXTRA_ALLOW_MULTIPLE,
                        params.mode == FileChooserParams.MODE_OPEN_MULTIPLE
                    )
                }
                return try {
                    fileChooserLauncher.launch(
                        Intent.createChooser(intent, getString(R.string.choose_files))
                    )
                    true
                } catch (e: Exception) {
                    fileChooserCallback = null
                    false
                }
            }
        }

        webView.addJavascriptInterface(DownloadBridge(), BRIDGE_NAME)

        // Install the download shim before the page's own scripts run.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(
                webView,
                DOWNLOAD_SHIM,
                setOf("https://$APP_HOST")
            )
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        if (savedInstanceState == null) {
            webView.loadUrl(APP_URL)
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    private fun parseChooserResult(data: Intent?): Array<Uri> {
        if (data == null) return arrayOf()
        data.clipData?.let { clip ->
            return Array(clip.itemCount) { clip.getItemAt(it).uri }
        }
        return data.data?.let { arrayOf(it) } ?: arrayOf()
    }

    /** Receives download bytes from the page and writes them to Downloads. */
    inner class DownloadBridge {
        @JavascriptInterface
        fun saveBase64(name: String, mime: String, base64: String) {
            val safeName = sanitizeName(name)
            val bytes = try {
                Base64.decode(base64, Base64.DEFAULT)
            } catch (e: IllegalArgumentException) {
                runOnUiThread { toast(getString(R.string.save_failed)) }
                return
            }
            try {
                writeToDownloads(safeName, mime.ifBlank { "application/octet-stream" }, bytes)
                runOnUiThread { toast(getString(R.string.saved_to_downloads, safeName)) }
            } catch (e: Exception) {
                runOnUiThread { toast(getString(R.string.save_failed)) }
            }
        }
    }

    private fun writeToDownloads(name: String, mime: String, bytes: ByteArray) {
        val resolver = contentResolver
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, name)
            put(MediaStore.Downloads.MIME_TYPE, mime)
            put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            put(MediaStore.Downloads.IS_PENDING, 1)
        }
        val collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        val item = resolver.insert(collection, values)
            ?: throw IllegalStateException("MediaStore insert failed")
        resolver.openOutputStream(item)?.use { it.write(bytes) }
            ?: throw IllegalStateException("MediaStore stream failed")
        values.clear()
        values.put(MediaStore.Downloads.IS_PENDING, 0)
        resolver.update(item, values, null, null)
    }

    private fun sanitizeName(raw: String): String {
        val cleaned = raw.replace('/', '_')
            .replace('\\', '_')
            .replace("..", "_")
            .trim()
        return if (cleaned.isEmpty()) "ciphersplat-output" else cleaned.take(200)
    }

    private fun toast(message: String) =
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()

    companion object {
        private const val APP_HOST = "appassets.androidplatform.net"
        private const val APP_URL = "https://appassets.androidplatform.net/assets/ciphersplat/index.html"
        private const val BRIDGE_NAME = "CipherSplatAndroid"

        // Reads download blobs by capturing them at URL.createObjectURL time and
        // handing the bytes to the native bridge. It never calls fetch()/XHR, so
        // it stays compatible with the app's `connect-src 'none'` policy.
        private val DOWNLOAD_SHIM = """
            (function () {
              if (window.__csplatBridgeInstalled) return;
              window.__csplatBridgeInstalled = true;
              var store = Object.create(null);
              var nativeCreate = URL.createObjectURL.bind(URL);
              var nativeRevoke = URL.revokeObjectURL.bind(URL);
              URL.createObjectURL = function (obj) {
                var url = nativeCreate(obj);
                try { if (obj instanceof Blob) store[url] = obj; } catch (e) {}
                return url;
              };
              URL.revokeObjectURL = function (url) {
                try { delete store[url]; } catch (e) {}
                return nativeRevoke(url);
              };
              function send(blob, name, mime) {
                var reader = new FileReader();
                reader.onload = function () {
                  var s = String(reader.result || '');
                  var comma = s.indexOf(',');
                  var data = comma >= 0 ? s.slice(comma + 1) : '';
                  try {
                    CipherSplatAndroid.saveBase64(name || 'ciphersplat-output', mime || (blob && blob.type) || '', data);
                  } catch (e) {}
                };
                reader.readAsDataURL(blob);
              }
              var nativeClick = HTMLAnchorElement.prototype.click;
              HTMLAnchorElement.prototype.click = function () {
                try {
                  var href = this.getAttribute('href') || '';
                  if (this.hasAttribute('download')) {
                    var name = this.getAttribute('download') || '';
                    if (store[href]) { send(store[href], name, store[href].type); return; }
                    if (href.indexOf('data:') === 0) {
                      var head = href.substring(5, href.indexOf(','));
                      var mime = (head.split(';')[0]) || 'application/octet-stream';
                      var payload = href.slice(href.indexOf(',') + 1);
                      var data = head.indexOf('base64') >= 0 ? payload : btoa(unescape(payload));
                      try { CipherSplatAndroid.saveBase64(name || 'ciphersplat-output', mime, data); } catch (e) {}
                      return;
                    }
                  }
                } catch (e) {}
                return nativeClick.apply(this, arguments);
              };
            })();
        """.trimIndent()
    }
}
