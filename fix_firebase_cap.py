import re

with open('src/utils/firebase.ts', 'r') as f:
    content = f.read()

import_cap = "import { Capacitor } from '@capacitor/core';\n"
if "Capacitor" not in content:
    content = import_cap + content

search = "export async function loginWithGoogleFirebase() {\n  try {"
replace = """export async function loginWithGoogleFirebase() {
  if (Capacitor.isNativePlatform()) {
    throw new Error('Google Sign-In is not supported in the Android preview yet. Please use your Email and Password.');
  }
  try {"""
content = content.replace(search, replace)

with open('src/utils/firebase.ts', 'w') as f:
    f.write(content)
