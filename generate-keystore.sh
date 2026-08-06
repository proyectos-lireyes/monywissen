#!/bin/bash
if ! command -v keytool &> /dev/null
then
    echo "keytool could not be found, installing..."
    DEBIAN_FRONTEND=noninteractive apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y default-jre-headless
fi

echo "Generando release.keystore..."
keytool -genkey -v -keystore release.keystore -alias monywissen -keyalg RSA -keysize 2048 -validity 10000 -storepass monywissen123 -keypass monywissen123 -dname "CN=Monywissen, OU=App, O=Monywissen, L=City, S=State, C=US"

echo "=========================================================="
echo "KEYSTORE CREADO EXITOSAMENTE (release.keystore)"
echo "Alias: monywissen"
echo "Password: monywissen123"
echo "=========================================================="
echo "HUELLAS DIGITALES (Añadir a Firebase Console):"
keytool -list -v -keystore release.keystore -alias monywissen -storepass monywissen123 | grep -E "(SHA1|SHA256)"
echo "=========================================================="
echo "KEYSTORE BASE64 (Añadir a GitHub Secrets KEYSTORE_BASE64):"
base64 -w 0 release.keystore
echo ""
echo "=========================================================="
