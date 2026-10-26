plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.storyglow.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.storyglow.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    // the demo audiobook must stay uncompressed so it can be streamed and seeked from the APK
    androidResources {
        noCompress += "mp3"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

// No third-party libraries: only the Android framework + Kotlin stdlib.
