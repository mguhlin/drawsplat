plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "org.drawsplat.ciphersplat"
    compileSdk = 34

    defaultConfig {
        applicationId = "org.drawsplat.ciphersplat"
        minSdk = 29
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.2"
        resourceConfigurations += listOf("en")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    // Keep the Google-signed dependency metadata block out of the APK so the
    // build stays fully reproducible / free for F-Droid.
    dependenciesInfo {
        includeInApk = false
        includeInBundle = false
    }
}

// Single source of truth: the CipherSplat web app lives in /solutions/CipherSplat.
// Copy it into the APK assets at build time instead of committing a second copy.
val webSource = rootProject.file("../solutions/CipherSplat")
val generatedAssets = layout.buildDirectory.dir("generated/webAssets")

val copyCipherSplat by tasks.registering(Copy::class) {
    description = "Bundle the CipherSplat web app into app assets."
    from(webSource) {
        include(
            "index.html",
            "app.js",
            "argon2-worker.js",
            "manifest.webmanifest",
            "styles.css",
            "security.css",
            "mobile.css",
            "integrity.json",
            "assets/**",
            "vendor/**"
        )
    }
    into(generatedAssets.map { it.dir("ciphersplat") })
}

android.sourceSets["main"].assets.srcDir(generatedAssets)

// Ensure the copy runs before assets are merged into the APK.
tasks.matching { it.name.startsWith("merge") && it.name.endsWith("Assets") }
    .configureEach { dependsOn(copyCipherSplat) }
tasks.named("preBuild").configure { dependsOn(copyCipherSplat) }

dependencies {
    implementation("androidx.activity:activity-ktx:1.9.2")
    implementation("androidx.webkit:webkit:1.11.0")
}
